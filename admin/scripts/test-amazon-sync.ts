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

// Set region
process.env.AWS_REGION = process.env.AWS_REGION || 'eu-west-1';

async function testAmazonSync() {
  console.log('--- Amazon SP-API Listings Sync Test ---');
  
  try {
    const { syncToAmazon } = await import('../src/lib/sync/amazon');

    const { prisma } = await import('../src/lib/prisma');

    console.log('Fetching first product with variants from database...');
    const product = await prisma.product.findFirst({
      include: { variants: true }
    });

    if (!product) {
      console.error('No products found in the database to sync!');
      return;
    }

    console.log(`Triggering syncToAmazon for real product: ${product.name} (SKU: ${product.sku})...`);
    const result = await syncToAmazon(product);
    console.log('Sync Result:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('Amazon sync execution failed:', err);
  }
}

testAmazonSync();
