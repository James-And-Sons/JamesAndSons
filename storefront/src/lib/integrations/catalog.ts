import { prisma } from '../prisma';

export async function syncCatalogToZoho(accessToken: string) {
  console.log('[Catalog Sync] Evaluating website items against Zoho Inventory...');
  
  const orgId = process.env.ZOHO_INVENTORY_ORG_ID || '';
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
  const isIndia = accountsDomain.endsWith('.in');
  const apiBase = isIndia 
    ? 'https://www.zohoapis.in/inventory/v1' 
    : 'https://www.zohoapis.com/inventory/v1';

  if (!orgId) {
    console.warn('[Catalog Sync] ZOHO_INVENTORY_ORG_ID is missing. Skipping sync.');
    return;
  }

  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  for (const p of products) {
    const itemsToSync = [];
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        itemsToSync.push({
          sku: v.sku,
          name: `${p.name} - ${v.name || 'Variant'}`,
          rate: v.d2cPrice || p.d2cPrice,
          description: p.description || ''
        });
      }
    } else {
      itemsToSync.push({
        sku: p.sku,
        name: p.name,
        rate: p.d2cPrice,
        description: p.description || ''
      });
    }

    for (const item of itemsToSync) {
      if (!item.sku) continue;

      try {
        const searchRes = await fetch(`${apiBase}/items?sku=${item.sku}`, {
          method: 'GET',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'X-com-zoho-organizationid': orgId
          }
        });

        const searchData = await searchRes.json();
        if (searchRes.ok && searchData.items && searchData.items.length > 0) {
          continue; // Already exists in Zoho
        }

        // Create missing item in Zoho
        const createPayload = {
          name: item.name,
          sku: item.sku,
          rate: Number(item.rate),
          description: item.description,
          item_type: 'sales'
        };

        await fetch(`${apiBase}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'X-com-zoho-organizationid': orgId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        });
        console.log(`[Catalog Sync] Created missing item SKU: ${item.sku}`);
      } catch (err) {
        console.error(`[Catalog Sync] Failed for SKU ${item.sku}:`, err);
      }
    }
  }
}
