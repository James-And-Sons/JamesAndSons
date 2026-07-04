import aws4 from 'aws4';

async function getLwaAccessToken() {
  const clientId = process.env.AMAZON_LWA_CLIENT_ID;
  const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;
  const refreshToken = process.env.AMAZON_LWA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Amazon Sync] Missing Amazon LWA credentials (client id, secret, or refresh token).');
    throw new Error('Missing Amazon LWA credentials.');
  }

  console.log('[Amazon Sync] Fetching LWA Access Token from Amazon...');
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Amazon Sync] LWA Token Exchange failed: ${res.status} - ${text}`);
    throw new Error(`Failed to refresh Amazon LWA Access Token: ${text}`);
  }

  const data = await res.json();
  console.log('[Amazon Sync] LWA Access Token retrieved successfully.');
  return data.access_token;
}

export async function syncToAmazon(product: any) {
  console.log(`[Amazon Sync] Starting Amazon SP-API sync process for SKU: ${product.sku}...`);
  const sellerId = process.env.AMAZON_SELLER_ID;
  const awsAccessKey = process.env.AMAZON_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AMAZON_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const spApiEndpoint = process.env.AMAZON_SP_API_ENDPOINT || 'https://sellingpartnerapi-eu.amazon.com';

  if (!sellerId || !awsAccessKey || !awsSecretKey) {
    console.warn('[Amazon Sync] Missing AWS credentials (sellerId, access key, or secret key). Skipping Amazon SP-API sync.');
    return { success: false, reason: 'Credentials missing' };
  }

  const accessToken = await getLwaAccessToken();

  const syncListingItem = async (sku: string, name: string, price: number, quantity: number) => {
    const marketplaceId = process.env.AMAZON_MARKETPLACE_ID || 'A21TJRUUN4KGV';
    const path = `/listings/2021-08-01/sellers/${sellerId}/listingsItems/${sku}?marketplaceIds=${marketplaceId}`;
    const url = `${spApiEndpoint}${path}`;

    const payload = {
      productType: 'LIGHT_FIXTURE',
      requirements: 'LISTING_OFFER_ONLY',
      attributes: {
        purchasable_offer: [
          {
            marketplace_id: marketplaceId,
            currency: 'INR',
            our_price: [
              {
                schedule: [
                  {
                    value_with_tax: price
                  }
                ]
              }
            ]
          }
        ],
        fulfillment_availability: [
          {
            fulfillment_channel_code: 'DEFAULT',
            quantity: quantity
          }
        ]
      }
    };

    const host = new URL(spApiEndpoint).hostname;
    const requestOptions: any = {
      host: host,
      path: path,
      method: 'PUT',
      service: 'execute-api',
      region: process.env.AWS_REGION || 'eu-west-1',
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': accessToken,
      },
      body: JSON.stringify(payload)
    };

    // Sign the options using AWS credentials
    aws4.sign(requestOptions, {
      accessKeyId: awsAccessKey,
      secretAccessKey: awsSecretKey
    });

    console.log(`[Amazon Sync] Syncing SKU ${sku} to Amazon Listings Items API...`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: requestOptions.headers,
      body: requestOptions.body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Amazon SP-API Listings Items PUT error for ${sku}: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Amazon Sync] SKU ${sku} sync result:`, JSON.stringify(result));
    return result;
  };

  const results = [];
  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      const vPrice = v.d2cPrice || product.d2cPrice;
      const vQty = v.stockQuantity;
      const res = await syncListingItem(v.sku, `${product.name} - ${v.name}`, vPrice, vQty);
      results.push(res);
    }
  } else {
    const res = await syncListingItem(product.sku, product.name, product.d2cPrice, product.stockQuantity);
    results.push(res);
  }

  return { success: true, results };
}
