import * as fs from 'fs';
import * as path from 'path';

// Load credentials from env file
const envPath = path.resolve(__dirname, '../.env.local');
let clientId = '';
let clientSecret = '';

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
    if (key === 'ZOHO_CLIENT_ID') clientId = val;
    if (key === 'ZOHO_CLIENT_SECRET') clientSecret = val;
  }
}

async function run() {
  const code = process.argv[2];
  const cliClientId = process.argv[3] || clientId;
  const cliClientSecret = process.argv[4] || clientSecret;

  if (!code) {
    console.log('\x1b[31m%s\x1b[0m', 'Error: Please provide the Zoho Authorization Code.');
    console.log('Usage: npx tsx scripts/get-refresh-token.ts <AUTHORIZATION_CODE> [CLIENT_ID] [CLIENT_SECRET]');
    process.exit(1);
  }

  if (!cliClientId || !cliClientSecret) {
    console.log('\x1b[31m%s\x1b[0m', 'Error: ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET is missing. Please add them in storefront/.env.local or pass them as arguments:');
    console.log('Usage: npx tsx scripts/get-refresh-token.ts <AUTHORIZATION_CODE> <CLIENT_ID> <CLIENT_SECRET>');
    process.exit(1);
  }

  console.log('Exchanging authorization code with Zoho Accounts Server...');
  try {
    const params = new URLSearchParams({
      code,
      client_id: cliClientId,
      client_secret: cliClientSecret,
      redirect_uri: 'https://jamesandsons.in/api/support/callback',
      grant_type: 'authorization_code'
    });

    const res = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = await res.json();
    if (data.error) {
      console.log('\x1b[31m%s\x1b[0m', `Exchange Failed: ${data.error}`);
    } else {
      console.log('\n\x1b[32m%s\x1b[0m', '--- ZOHO DESK REFRESH TOKEN GENERATED ---');
      console.log(`Refresh Token: ${data.refresh_token}`);
      console.log('-------------------------------------------\n');
      console.log('Copy this Refresh Token and add it as ZOHO_REFRESH_TOKEN in storefront/.env.local.');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

run();
