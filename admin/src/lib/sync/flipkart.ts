async function getFlipkartAccessToken() {
  const appId = process.env.FLIPKART_APP_ID;
  const appSecret = process.env.FLIPKART_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing Flipkart app credentials.');
  }

  // Base64 encoding credentials for Basic Auth
  const authHeader = 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64');

  const res = await fetch('https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api', {
    method: 'POST',
    headers: {
      'Authorization': authHeader
    }
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

  if (
    !appId || 
    !appSecret || 
    appId.includes('your_') || 
    appSecret.includes('your_')
  ) {
    console.warn('[Flipkart Sync] Missing or placeholder Flipkart credentials. Skipping Flipkart sync.');
    return { success: false, reason: 'Credentials missing' };
  }

  try {
    const token = await getFlipkartAccessToken();

    const syncFlipkartItem = async (sku: string, price: number, mrp: number, quantity: number) => {
      console.log(`[Flipkart Sync] Retrieving listing status for SKU ${sku}...`);
      
      // Step 1: Query the Flipkart Listings API to find the FSN and active locations
      const getUrl = `https://api.flipkart.net/sellers/listings/v3/${sku}`;
      const getRes = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!getRes.ok) {
        if (getRes.status === 404) {
          console.log(`[Flipkart Sync] SKU ${sku} is not active or listed on Flipkart. Skipping sync.`);
          return { sku, success: true, status: 'SKIPPED', reason: 'SKU not listed' };
        }
        const errText = await getRes.text();
        throw new Error(`GET /listings/v3/${sku} failed: ${getRes.status} - ${errText}`);
      }

      const getData = await getRes.json();
      const listing = getData.available?.[sku];

      if (!listing) {
        console.log(`[Flipkart Sync] SKU ${sku} not found in available listings response. Skipping sync.`);
        return { sku, success: true, status: 'SKIPPED', reason: 'SKU not available' };
      }

      const fsn = listing.product_id;
      const locations = listing.locations || [];

      if (!fsn) {
        throw new Error(`Product ID (FSN) missing in listings response for SKU ${sku}`);
      }

      console.log(`[Flipkart Sync] Dynamic lookup succeeded: SKU ${sku} has FSN: ${fsn}. Listing has ${locations.length} fulfillment locations.`);

      // Step 2: Push Pricing Update (MRP and Selling Price)
      const priceUrl = 'https://api.flipkart.net/sellers/listings/v3/update/price';
      const pricePayload = {
        [sku]: {
          product_id: fsn,
          price: {
            mrp: Math.round(mrp),
            selling_price: Math.round(price),
            currency: 'INR'
          }
        }
      };

      console.log(`[Flipkart Sync] Updating price on Flipkart for SKU ${sku}...`);
      const priceRes = await fetch(priceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pricePayload)
      });

      if (!priceRes.ok) {
        const errText = await priceRes.text();
        console.error(`[Flipkart Sync] Price update failed for SKU ${sku}:`, errText);
      } else {
        console.log(`[Flipkart Sync] Price update succeeded for SKU ${sku}.`);
      }

      // Step 3: Push Inventory Update (for each fulfillment location)
      if (locations.length > 0) {
        const invUrl = 'https://api.flipkart.net/sellers/listings/v3/update/inventory';
        
        for (const loc of locations) {
          const invPayload = {
            [sku]: {
              product_id: fsn,
              locations: [
                {
                  id: loc.id,
                  inventory: Math.max(0, quantity)
                }
              ]
            }
          };

          console.log(`[Flipkart Sync] Updating stock (${quantity}) for Location ${loc.id}...`);
          const invRes = await fetch(invUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(invPayload)
          });

          if (!invRes.ok) {
            const errText = await invRes.text();
            console.error(`[Flipkart Sync] Inventory update failed for Location ${loc.id}:`, errText);
          } else {
            console.log(`[Flipkart Sync] Inventory update succeeded for Location ${loc.id}.`);
          }
        }
      } else {
        console.warn(`[Flipkart Sync] Warning: No fulfillment locations returned for SKU ${sku}. Inventory update skipped.`);
      }

      return { sku, success: true, status: 'SUCCESS', fsn };
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
  } catch (error: any) {
    console.error('[Flipkart Sync] CRITICAL SYNC FAILURE:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}
