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

async function testConnection() {
  console.log('--- Zoho Desk Connection Diagnostics ---');
  
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const orgId = process.env.NEXT_PUBLIC_ZOHO_DESK_ORG_ID;
  const departmentId = process.env.ZOHO_DEPARTMENT_ID;
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'desk.zoho.com';

  console.log(`Checking Env Keys:`);
  console.log(`- ZOHO_CLIENT_ID: ${clientId ? '✓ Configured' : '✗ Missing'}`);
  console.log(`- ZOHO_CLIENT_SECRET: ${clientSecret ? '✓ Configured' : '✗ Missing'}`);
  console.log(`- ZOHO_REFRESH_TOKEN: ${refreshToken ? '✓ Configured' : '✗ Missing'}`);
  console.log(`- ORG_ID (from NEXT_PUBLIC_ZOHO_DESK_ORG_ID): ${orgId ? `✓ Configured (${orgId})` : '✗ Missing'}`);
  console.log(`- ZOHO_DEPARTMENT_ID: ${departmentId ? `✓ Configured (${departmentId})` : '✗ Missing'}`);

  if (!clientId || !clientSecret || !refreshToken || !orgId || !departmentId) {
    console.log('\n\x1b[31m%s\x1b[0m', 'Diagnostics Failed: One or more required credentials are missing in storefront/.env.local.');
    return;
  }

  console.log('\nStep 1: Attempting to refresh access token...');
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
      console.log('\x1b[31m%s\x1b[0m', `Token Refresh Failed: ${data.error || res.statusText}`);
      return;
    }

    const accessToken = data.access_token;
    console.log('\x1b[32m%s\x1b[0m', 'Access Token Refreshed successfully!');

    console.log('\nStep 2: Creating a diagnostic test ticket in Zoho Desk...');
    const body = {
      subject: 'James & Sons Integration Test',
      description: 'This is a diagnostic ticket verifying the REST API connection.',
      departmentId: departmentId,
      contact: {
        firstName: 'System',
        lastName: 'Diagnostic',
        email: 'diagnostic@jamesandsons.in'
      }
    };

    const apiRes = await fetch(`https://${apiDomain}/api/v1/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': orgId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const apiData = await apiRes.json();
    if (!apiRes.ok) {
      console.log('\x1b[31m%s\x1b[0m', `Ticket Creation Failed: ${apiRes.statusText}`);
      console.log(apiData);
    } else {
      console.log('\n\x1b[32m%s\x1b[0m', '--- CONNECTION VERIFIED SUCCESS ---');
      console.log(`Test Ticket Created in Zoho Desk!`);
      console.log(`Ticket ID: ${apiData.id}`);
      console.log(`Ticket Number: ${apiData.ticketNumber}`);
      console.log('------------------------------------\n');
    }
  } catch (err) {
    console.error('Request failed due to networking issue:', err);
  }
}

testConnection();
