/**
 * Amazon Selling Partner API (SP-API) shared utilities.
 * Used by the order ingestion cron and the shipment confirmation integration.
 *
 * Uses native Node.js crypto for AWS SigV4 signing — no aws4 package required.
 */
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface AmazonSpConfig {
  sellerId: string;
  marketplaceId: string;
  endpoint: string;
  awsAccessKey: string;
  awsSecretKey: string;
  awsRegion: string;
}

export function getAmazonConfig(): AmazonSpConfig {
  const sellerId       = process.env.AMAZON_SELLER_ID;
  const marketplaceId  = process.env.AMAZON_MARKETPLACE_ID   || 'A21TJRUUN4KGV';
  const endpoint       = process.env.AMAZON_SP_API_ENDPOINT  || 'https://sellingpartnerapi-eu.amazon.com';
  const awsAccessKey   = process.env.AMAZON_AWS_ACCESS_KEY_ID  || process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey   = process.env.AMAZON_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion      = process.env.AWS_REGION || 'eu-west-1';

  if (!sellerId || !awsAccessKey || !awsSecretKey) {
    throw new Error('[Amazon SP-API] Missing required credentials: AMAZON_SELLER_ID, AMAZON_AWS_ACCESS_KEY_ID, AMAZON_AWS_SECRET_ACCESS_KEY');
  }

  return { sellerId, marketplaceId, endpoint, awsAccessKey, awsSecretKey, awsRegion };
}

// ---------------------------------------------------------------------------
// LWA (Login with Amazon) — OAuth2 access token via refresh token grant
// ---------------------------------------------------------------------------

let _cachedToken: { token: string; expiresAt: number } | null = null;

export async function getLwaAccessToken(): Promise<string> {
  // Reuse cached token if still valid (5 min buffer)
  if (_cachedToken && Date.now() < _cachedToken.expiresAt - 300_000) {
    return _cachedToken.token;
  }

  const clientId     = process.env.AMAZON_LWA_CLIENT_ID;
  const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;
  const refreshToken = process.env.AMAZON_LWA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('[Amazon SP-API] Missing LWA credentials: AMAZON_LWA_CLIENT_ID, AMAZON_LWA_CLIENT_SECRET, AMAZON_LWA_REFRESH_TOKEN');
  }

  console.log('[Amazon SP-API] Fetching fresh LWA access token...');
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Amazon SP-API] LWA token exchange failed: ${res.status} — ${text}`);
  }

  const data = await res.json();
  _cachedToken = {
    token:     data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  console.log('[Amazon SP-API] LWA access token obtained.');
  return _cachedToken.token;
}

// ---------------------------------------------------------------------------
// AWS SigV4 signing (native crypto, no aws4 package)
// ---------------------------------------------------------------------------

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate    = hmacSha256('AWS4' + secretKey, dateStamp);
  const kRegion  = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  return kSigning;
}

export interface SignedFetchOptions {
  method?: string;
  body?: string;
  extraHeaders?: Record<string, string>;
}

/**
 * Makes an AWS SigV4-signed request to the Amazon SP-API.
 *
 * @param path      - API path, e.g. `/orders/v0/orders`
 * @param accessToken - LWA access token
 * @param config    - Amazon SP-API config from getAmazonConfig()
 * @param options   - Optional method, body, extra headers
 */
export async function signedSpApiFetch(
  path: string,
  accessToken: string,
  config: AmazonSpConfig,
  options: SignedFetchOptions = {}
): Promise<Response> {
  const { method = 'GET', body, extraHeaders = {} } = options;
  const service  = 'execute-api';
  const host     = new URL(config.endpoint).hostname;

  const now      = new Date();
  const amzDate  = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = sha256Hex(body || '');

  // Build canonical headers (must be sorted)
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-access-token:${accessToken}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = 'host;x-amz-access-token;x-amz-date';

  // Split path and query string
  const [canonicalUri, queryString = ''] = path.split('?');

  // Sort query params for canonical form
  const sortedQuery = queryString
    .split('&')
    .filter(Boolean)
    .sort()
    .join('&');

  const canonicalRequest = [
    method,
    encodeURI(canonicalUri),
    sortedQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${config.awsRegion}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(config.awsSecretKey, dateStamp, config.awsRegion, service);
  const signature  = hmacSha256(signingKey, stringToSign).toString('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${config.awsAccessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `${config.endpoint}${path}`;
  return fetch(url, {
    method,
    headers: {
      'host':                 host,
      'x-amz-access-token':  accessToken,
      'x-amz-date':          amzDate,
      'Authorization':        authorization,
      'Content-Type':         'application/json',
      ...extraHeaders,
    },
    body: body || undefined,
  });
}
