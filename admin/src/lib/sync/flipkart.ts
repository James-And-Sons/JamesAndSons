async function getFlipkartAccessToken() {
  const appId = process.env.FLIPKART_APP_ID;
  const appSecret = process.env.FLIPKART_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing Flipkart app credentials.');
  }

  const res = await fetch('https://api.flipkart.net/oauth-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'seller_api'
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh Flipkart token: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function syncToFlipkart(product: any) {
  const appId = process.env.FLIPKART_APP_ID;
  const appSecret = process.env.FLIPKART_APP_SECRET;

  if (!appId || !appSecret) {
    console.warn('[Flipkart Sync] Missing Flipkart credentials (FLIPKART_APP_ID/FLIPKART_APP_SECRET). Skipping Flipkart sync.');
    return { success: false, reason: 'Credentials missing' };
  }

  const token = await getFlipkartAccessToken();

  const syncFlipkartItem = async (sku: string, price: number, mrp: number, quantity: number) => {
    const url = 'https://api.flipkart.net/sellers/v3/listings/update';

    const payload = {
      [sku]: [
        {
          attribute_name: 'price',
          value: price
        },
        {
          attribute_name: 'mrp',
          value: mrp
        },
        {
          attribute_name: 'inventory',
          value: quantity
        }
      ]
    };

    console.log(`[Flipkart Sync] Syncing SKU ${sku} price/inventory to Flipkart...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Flipkart API error for SKU ${sku}: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Flipkart Sync] Flipkart response for ${sku}:`, JSON.stringify(result));
    return result;
  };

  const results = [];
  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      const vPrice = v.d2cPrice || product.d2cPrice;
      const vMrp = v.mrp || product.mrp;
      const vQty = v.stockQuantity;
      const res = await syncFlipkartItem(v.sku, vPrice, vMrp, vQty);
      results.push(res);
    }
  } else {
    const res = await syncFlipkartItem(product.sku, product.d2cPrice, product.mrp, product.stockQuantity);
    results.push(res);
  }

  return { success: true, results };
}
