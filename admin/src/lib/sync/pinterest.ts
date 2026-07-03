export async function syncToPinterest(product: any) {
  const catalogId = process.env.PINTEREST_CATALOG_ID;
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  const adAccountId = process.env.PINTEREST_AD_ACCOUNT_ID;

  if (!catalogId || !accessToken) {
    console.warn('[Pinterest Sync] Missing PINTEREST_CATALOG_ID or PINTEREST_ACCESS_TOKEN. Skipping Pinterest sync.');
    return { success: false, reason: 'Credentials missing' };
  }

  const items = [];
  const mapItem = (sku: string, name: string, price: number, images: string[]) => ({
    item_id: sku,
    attributes: {
      title: name,
      description: product.description || name,
      link: `https://jamesandsons.in/products/${product.slug}`,
      image_link: images[0] || 'https://jamesandsons.in/images/placeholder.png',
      price: `${Math.round(price)} INR`,
      availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      brand: 'James and Sons'
    }
  });

  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      const vPrice = v.d2cPrice || product.d2cPrice;
      const vImages = v.images && v.images.length > 0 ? v.images : product.images;
      items.push(mapItem(v.sku, `${product.name} - ${v.name}`, vPrice, vImages));
    }
  } else {
    items.push(mapItem(product.sku, product.name, product.d2cPrice, product.images));
  }

  const endpoint = `https://api.pinterest.com/v5/catalogs/items/batch`;
  console.log(`[Pinterest Sync] Pushing ${items.length} items to Pinterest Catalog...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...(adAccountId ? { 'x-pinterest-ad-account-id': adAccountId } : {})
    },
    body: JSON.stringify({
      operation: 'UPSERT',
      catalog_id: catalogId,
      items: items
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinterest API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[Pinterest Sync] Pinterest API response:', JSON.stringify(result));
  return { success: true, result };
}
