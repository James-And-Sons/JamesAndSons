export async function syncToPepperfry(product: any) {
  const endpoint = process.env.PEPPERFRY_API_ENDPOINT;
  const token = process.env.PEPPERFRY_API_TOKEN;

  if (!endpoint || !token) {
    console.warn('[Pepperfry Sync] Missing Pepperfry credentials (PEPPERFRY_API_ENDPOINT/PEPPERFRY_API_TOKEN). Skipping Pepperfry sync.');
    return { success: false, reason: 'Credentials missing' };
  }

  const mapItem = (sku: string, name: string, price: number, mrp: number, quantity: number) => ({
    sku: sku,
    title: name,
    price: price,
    mrp: mrp,
    quantity: quantity,
    brand: 'James and Sons',
    availability: quantity > 0 ? 'instock' : 'outofstock',
    last_updated: new Date().toISOString()
  });

  const payload: any = {
    sync_source: 'JamesAndSons_PIM',
    items: []
  };

  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      const vPrice = v.d2cPrice || product.d2cPrice;
      const vMrp = v.mrp || product.mrp;
      payload.items.push(mapItem(v.sku, `${product.name} - ${v.name}`, vPrice, vMrp, v.stockQuantity));
    }
  } else {
    payload.items.push(mapItem(product.sku, product.name, product.d2cPrice, product.mrp, product.stockQuantity));
  }

  console.log(`[Pepperfry Sync Stub] Directing push of ${payload.items.length} items to Pepperfry endpoint: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pepperfry Client Stub API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json().catch(() => ({ status: 'success' }));
  console.log('[Pepperfry Sync Stub] Response:', JSON.stringify(result));
  return { success: true, result };
}
