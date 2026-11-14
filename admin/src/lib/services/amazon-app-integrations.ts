/**
 * Amazon Selling Partner AppIntegrations API (v2024-04-01) — Admin Service
 *
 * Enables James & Sons Admin Operations to:
 * 1. Create and trigger in-app operational notifications inside Amazon Seller Central.
 * 2. Delete / dismiss stale notification alerts.
 * 3. Record seller feedback on operational actions.
 */

import crypto from "crypto";

export interface AmazonSpConfig {
  sellerId: string;
  marketplaceId: string;
  endpoint: string;
  awsAccessKey: string;
  awsSecretKey: string;
  awsRegion: string;
}

function getAmazonConfig(): AmazonSpConfig {
  const sellerId = process.env.AMAZON_SELLER_ID;
  const marketplaceId = process.env.AMAZON_MARKETPLACE_ID || "A21TJRUUN4KGV";
  const endpoint =
    process.env.AMAZON_SP_API_ENDPOINT ||
    "https://sellingpartnerapi-fe.amazon.com";
  const awsAccessKey =
    process.env.AMAZON_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey =
    process.env.AMAZON_AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION || "eu-west-1";

  if (!sellerId || !awsAccessKey || !awsSecretKey) {
    throw new Error(
      "[Amazon SP-API] Missing required credentials: AMAZON_SELLER_ID, AMAZON_AWS_ACCESS_KEY_ID, AMAZON_AWS_SECRET_ACCESS_KEY",
    );
  }

  return {
    sellerId,
    marketplaceId,
    endpoint,
    awsAccessKey,
    awsSecretKey,
    awsRegion,
  };
}

let _cachedToken: { token: string; expiresAt: number } | null = null;

async function getLwaAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt - 300_000) {
    return _cachedToken.token;
  }

  const clientId = process.env.AMAZON_LWA_CLIENT_ID;
  const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;
  const refreshToken = process.env.AMAZON_LWA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("[Amazon SP-API] Missing LWA credentials");
  }

  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Amazon SP-API] LWA token exchange failed: ${text}`);
  }

  const data = await res.json();
  _cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return _cachedToken.token;
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

async function signedSpApiFetch(
  path: string,
  accessToken: string,
  config: AmazonSpConfig,
  options: {
    method?: string;
    body?: string;
    extraHeaders?: Record<string, string>;
  } = {},
): Promise<Response> {
  const { method = "GET", body, extraHeaders = {} } = options;
  const service = "execute-api";
  const host = new URL(config.endpoint).hostname;

  const now = new Date();
  const amzDate =
    now
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, "")
      .slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body || "");

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-access-token:${accessToken}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-access-token;x-amz-date";

  const [canonicalUri, queryString = ""] = path.split("?");
  const sortedQuery = queryString.split("&").filter(Boolean).sort().join("&");

  const canonicalRequest = [
    method,
    encodeURI(canonicalUri),
    sortedQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${config.awsRegion}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(
    config.awsSecretKey,
    dateStamp,
    config.awsRegion,
    service,
  );
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${config.awsAccessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const headers: Record<string, string> = {
    host,
    "x-amz-access-token": accessToken,
    "x-amz-date": amzDate,
    Authorization: authorizationHeader,
    ...extraHeaders,
  };

  const url = `${config.endpoint}${path}`;
  return fetch(url, {
    method,
    headers,
    body: body ? body : undefined,
  });
}

export interface CreateAppNotificationPayload {
  templateId: string;
  notificationParameters: Record<string, any>;
  marketplaceId?: string;
}

export interface AppNotificationResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Trigger an in-app operational notification inside Amazon Seller Central.
 * POST /appIntegrations/2024-04-01/notifications
 */
export async function createAppNotification(
  payload: CreateAppNotificationPayload,
): Promise<AppNotificationResponse> {
  try {
    const config = getAmazonConfig();
    const accessToken = await getLwaAccessToken();

    const body = {
      templateId: payload.templateId,
      notificationParameters: payload.notificationParameters,
      marketplaceId: payload.marketplaceId || config.marketplaceId,
    };

    const res = await signedSpApiFetch(
      "/appIntegrations/2024-04-01/notifications",
      accessToken,
      config,
      {
        method: "POST",
        extraHeaders: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        error: `Amazon API error ${res.status}: ${errorText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      notificationId: data?.notificationId,
    };
  } catch (err: any) {
    console.error(
      "[Amazon AppIntegrations Admin] Error creating notification:",
      err,
    );
    return {
      success: false,
      error: err.message || "Failed to create AppIntegrations notification",
    };
  }
}

/**
 * Delete a notification from Seller Central.
 * POST /appIntegrations/2024-04-01/notifications/deletion
 */
export async function deleteAppNotification(
  templateId: string,
  deletionReason = "ACTION_COMPLETED",
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getAmazonConfig();
    const accessToken = await getLwaAccessToken();

    const body = {
      templateId,
      deletionReason,
    };

    const res = await signedSpApiFetch(
      "/appIntegrations/2024-04-01/notifications/deletion",
      accessToken,
      config,
      {
        method: "POST",
        extraHeaders: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        error: `Amazon API error ${res.status}: ${errorText}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error(
      "[Amazon AppIntegrations Admin] Error deleting notification:",
      err,
    );
    return { success: false, error: err.message };
  }
}
