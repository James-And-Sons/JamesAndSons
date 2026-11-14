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

async function testAmazonReviews() {
  console.log('=== Amazon SP-API Review Solicitations Test ===');
  
  try {
    const { getLwaAccessToken, getAmazonConfig } = await import('../src/lib/amazon-sp-api');
    const { dispatchAmazonReviewSolicitations } = await import('../src/lib/integrations/amazon-reviews');
    const { prisma } = await import('../src/lib/prisma');

    const config = getAmazonConfig();
    console.log(`Endpoint: ${config.endpoint}`);

    // Fetch token
    const token = await getLwaAccessToken();
    console.log('✅ Access token fetched successfully.');

    // Print count of candidates in DB
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo   = new Date(now - 5 * 24 * 60 * 60 * 1000);

    const candidatesCount = await prisma.order.count({
      where: {
        channel:               'AMAZON',
        amazonReviewSolicited: false,
        amazonOrderId:         { not: null },
        createdAt: {
          gte: thirtyDaysAgo,
          lte: fiveDaysAgo,
        },
      },
    });

    console.log(`Eligible orders in DB: ${candidatesCount}`);

    // Trigger run (dry run logs will be outputted)
    const stats = await dispatchAmazonReviewSolicitations();
    console.log('Stats:', stats);
    console.log('✅ Review solicitations check passed successfully!');
    
  } catch (err: any) {
    console.error('❌ Solicitations check failed:', err.message || err);
  }
}

testAmazonReviews();
