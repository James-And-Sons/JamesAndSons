async function getLwaAccessToken() {
  const clientId = process.env.AMAZON_LWA_CLIENT_ID;
  const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;
  const refreshToken = process.env.AMAZON_LWA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Amazon LWA credentials.');
  }

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
    throw new Error(`Failed to refresh Amazon LWA Access Token: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function syncToAmazon(product: any) {
  const sellerId = process.env.AMAZON_SELLER_ID;
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const spApiEndpoint = process.env.AMAZON_SP_API_ENDPOINT || 'https://sellingpartnerapi-fe.amazon.com';

  if (!sellerId || !awsAccessKey || !awsSecretKey) {
    console.warn('[Amazon Sync] Missing Amazon credentials (sellerId/awsAccessKey/awsSecretKey). Skipping Amazon SP-API sync.');
    return { success: false, reason: 'Credentials missing' };
  }

  const accessToken = await getLwaAccessToken();

  const syncListingItem = async (sku: string, name: string, price: number, quantity: number) => {
    const path = `/listings/2021-08-01/sellers/${sellerId}/listingsItems/${sku}`;
    const url = `${spApiEndpoint}${path}`;

    const payload = {
      productType: 'PRODUCT',
      requirements: 'LISTING_OFFER_ONLY',
      attributes: {
        purchasable_offer: [
          {
            marketplace_id: process.env.AMAZON_MARKETPLACE_ID || 'A21TJRUUN4KGV',
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

    const headers = {
      'Content-Type': 'application/json',
      'x-amz-access-token': accessToken,
      'host': new URL(spApiEndpoint).hostname,
      'x-amz-date': new Date().toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'
    };

    console.log(`[Amazon Sync] Syncing SKU ${sku} to Amazon Listings Items API...`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(payload)
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
