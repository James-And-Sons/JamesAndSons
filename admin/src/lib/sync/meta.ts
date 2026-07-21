import { BRAND_CONFIG } from '@james-andsons/config';

export async function syncToMeta(product: any) {
  const catalogId = process.env.META_CATALOG_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!catalogId || !accessToken) {
    console.warn('[Meta Sync] Missing META_CATALOG_ID or META_ACCESS_TOKEN. Skipping Meta sync.');
    return { success: false, reason: 'Credentials missing' };
  }

  const itemsToSync = [];
  const formatPrice = (price: number) => `${Math.round(price)} ${BRAND_CONFIG.currencyCode}`;

  const mapItem = (sku: string, name: string, price: number, mrp: number, images: string[]) => ({
    retailer_id: sku,
    data: {
      title: name,
      description: product.description || name,
      image_link: images[0] || `${BRAND_CONFIG.storefrontUrl}/images/placeholder.png`,
      brand: BRAND_CONFIG.name,
      price: formatPrice(price),
      sale_price: price < mrp ? formatPrice(price) : undefined,
      availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      link: `${BRAND_CONFIG.storefrontUrl}/products/${product.slug}`
    }
  });

  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      const vPrice = v.d2cPrice || product.d2cPrice;
      const vMrp = v.mrp || product.mrp;
      const vImages = v.images && v.images.length > 0 ? v.images : product.images;
      itemsToSync.push({
        method: 'UPDATE',
        ...mapItem(v.sku, `${product.name} - ${v.name}`, vPrice, vMrp, vImages)
      });
    }
  } else {
    itemsToSync.push({
      method: 'UPDATE',
      ...mapItem(product.sku, product.name, product.d2cPrice, product.mrp, product.images)
    });
  }

  const endpoint = `https://graph.facebook.com/v19.0/${catalogId}/batch`;
  console.log(`[Meta Sync] Pushing ${itemsToSync.length} items to Meta Catalog...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ requests: itemsToSync })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meta API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[Meta Sync] Meta Batch API response:', JSON.stringify(result));
  return { success: true, result };
}
