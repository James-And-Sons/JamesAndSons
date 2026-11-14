import * as fs from 'fs';
import * as path from 'path';

// Load .env.local properties
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

async function testInventoryConnection() {
  console.log('--- Zoho Inventory Connection Diagnostics ---');
  
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
  const inventoryDomain = process.env.ZOHO_INVENTORY_API_DOMAIN || 'inventory.zoho.in';

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('Missing Zoho credentials in .env.local.');
    return;
  }

  console.log('Step 1: Refreshing Zoho OAuth token...');
  try {
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

    const data = await res.json();
    if (!res.ok || data.error) {
      console.log(`Token Refresh Failed: ${data.error || res.statusText}`);
      return;
    }

    const accessToken = data.access_token;
    console.log('Access Token Refreshed successfully!');

    console.log('\nStep 2: Fetching organization profiles from Zoho Inventory...');
    const apiRes = await fetch(`https://${inventoryDomain}/api/v1/organizations`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const apiData = await apiRes.json();
    if (!apiRes.ok) {
      console.log(`Failed to fetch profiles: ${apiRes.statusText}`);
      console.log(apiData);
    } else {
      console.log('\n--- ZOHO INVENTORY CONNECTION VERIFIED ---');
      console.log(`Successfully connected! Here are your active Zoho Inventory organizations:`);
      for (const org of apiData.organizations || []) {
        console.log(`- Org Name: "${org.name}" | Org ID: ${org.organization_id} (${org.is_active ? 'Active' : 'Inactive'})`);
      }
      console.log('-------------------------------------------\n');
    }
  } catch (err) {
    console.error('Request failed:', err);
  }
}

testInventoryConnection();
