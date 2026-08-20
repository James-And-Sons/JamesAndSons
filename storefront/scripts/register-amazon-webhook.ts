import * as fs from 'fs';
import * as path from 'path';

// 1. Load storefront env
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

async function registerWebhook() {
  const snsArn = process.argv[2];
  
  if (!snsArn) {
    console.error('❌ Error: Please provide your AWS SNS Topic ARN as an argument.');
    console.error('Usage: npx tsx scripts/register-amazon-webhook.ts "arn:aws:sns:eu-west-1:12345:topic-name"');
    process.exit(1);
  }

  console.log('=== Amazon SP-API Webhook Registration ===');
  console.log(`Target SNS ARN: ${snsArn}\n`);

  try {
    const { getLwaAccessToken, getAmazonConfig, signedSpApiFetch } = await import('../src/lib/amazon-sp-api');
    
    const config = getAmazonConfig();
    const token = await getLwaAccessToken();

    // ── Step 1: Create Destination ──────────────────────────────────────────
    console.log('Step 1: Creating SNS Destination on Amazon SP-API...');
    
    const destPath = '/notifications/v1/destinations';
    const destPayload = {
      name: 'JNS_Orders_SNS_Destination',
      resource: {
        sns: {
          arn: snsArn
        }
      }
    };

    const destRes = await signedSpApiFetch(destPath, token, config, {
      method: 'POST',
      body: JSON.stringify(destPayload)
    });

    const destData = await destRes.json();
    
    if (!destRes.ok) {
      throw new Error(`Failed to create destination: ${destRes.status} — ${JSON.stringify(destData)}`);
    }

    const destinationId = destData.payload?.destinationId;
    console.log(`✅ Success! Destination Created. Destination ID: ${destinationId}\n`);

    // ── Step 2: Subscribe to ORDER_CHANGE ───────────────────────────────────
    console.log('Step 2: Subscribing to ORDER_CHANGE notifications...');
    
    const subPath = `/notifications/v1/subscriptions/ORDER_CHANGE`;
    const subPayload = {
      destinationId: destinationId,
      payloadVersion: '1.0'
    };

    const subRes = await signedSpApiFetch(subPath, token, config, {
      method: 'POST',
      body: JSON.stringify(subPayload)
    });

    const subData = await subRes.json();

    if (subRes.ok) {
      console.log('✅ Success! Subscribed to ORDER_CHANGE events.');
    } else {
      console.error(`❌ Failed to subscribe to ORDER_CHANGE: ${subRes.status} — ${JSON.stringify(subData)}`);
    }

    // ── Step 3: Subscribe to MFN_ORDER_STATUS_CHANGE ────────────────────────
    console.log('\nStep 3: Subscribing to MFN_ORDER_STATUS_CHANGE notifications...');
    
    const cancelSubPath = `/notifications/v1/subscriptions/MFN_ORDER_STATUS_CHANGE`;
    const cancelSubRes = await signedSpApiFetch(cancelSubPath, token, config, {
      method: 'POST',
      body: JSON.stringify(subPayload)
    });

    const cancelSubData = await cancelSubRes.json();

    if (cancelSubRes.ok) {
      console.log('✅ Success! Subscribed to MFN_ORDER_STATUS_CHANGE events.');
    } else {
      console.error(`❌ Failed to subscribe to MFN_ORDER_STATUS_CHANGE: ${cancelSubRes.status} — ${JSON.stringify(cancelSubData)}`);
    }

    console.log('\n🎉 Webhook registration complete!');

  } catch (err: any) {
    console.error('\n❌ Registration Failed:');
    console.error(err.message || err);
  }
}

registerWebhook();
