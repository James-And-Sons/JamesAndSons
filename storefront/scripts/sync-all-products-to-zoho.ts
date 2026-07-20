import * as fs from 'fs';
import * as path from 'path';

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

async function getZohoAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Zoho credentials in storefront environment.');
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token'
  });

  const res = await fetch(`https://${accountsDomain}/oauth/v2/token`, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Failed to refresh Zoho token: ${errorData.error || res.statusText}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function syncAllProducts() {
  console.log('--- Database to Zoho Inventory Catalog Sync ---');
  
  try {
    const accessToken = await getZohoAccessToken();
    const orgId = process.env.ZOHO_INVENTORY_ORG_ID || '';
    const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
    const isIndia = accountsDomain.endsWith('.in');
    const apiBase = isIndia 
      ? 'https://www.zohoapis.in/inventory/v1' 
      : 'https://www.zohoapis.com/inventory/v1';

    if (!orgId) {
      console.error('Error: ZOHO_INVENTORY_ORG_ID is not configured in .env.local');
      return;
    }

    // Dynamic import to prevent hoisting issues
    const { prisma } = await import('../src/lib/prisma');

    console.log('Fetching products and variants from Supabase...');
    const products = await prisma.product.findMany({
      include: { variants: true }
    });

    console.log(`Found ${products.length} products to evaluate.`);

    for (const p of products) {
      const itemsToSync = [];
      
      // If there are variants, sync variants as separate items
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

        console.log(`Checking SKU: "${item.sku}" in Zoho Inventory...`);

        // Check if item already exists in Zoho
        const searchRes = await fetch(`${apiBase}/items?sku=${item.sku}`, {
          method: 'GET',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'X-com-zoho-organizationid': orgId
          }
        });

        const searchData = await searchRes.json();
        
        if (searchRes.ok && searchData.items && searchData.items.length > 0) {
          console.log(`- SKU "${item.sku}" already exists in Zoho Inventory. Skipping.`);
          continue;
        }

        // Create the item in Zoho Inventory
        console.log(`- SKU "${item.sku}" not found. Creating Item "${item.name}"...`);
        
        const createPayload = {
          name: item.name,
          sku: item.sku,
          rate: Number(item.rate),
          description: item.description,
          item_type: 'sales'
        };

        const createRes = await fetch(`${apiBase}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'X-com-zoho-organizationid': orgId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        });

        const createData = await createRes.json();
        if (createRes.ok) {
          console.log(`\x1b[32m%s\x1b[0m`, `✓ Successfully created Item in Zoho. Item ID: ${createData.item.item_id}`);
        } else {
          console.error(`\x1b[31m%s\x1b[0m`, `✗ Failed to create Item: ${createData.message || createRes.statusText}`);
        }
      }
    }

    console.log('\n--- Catalog Sync Completed Successfully ---');

  } catch (err) {
    console.error('Catalog sync failed:', err);
  }
}

syncAllProducts();
