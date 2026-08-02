import * as fs from 'fs';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
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
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function testFlipkartSync() {
  console.log('--- Flipkart Listings API v3 Sync Test ---');
  
  try {
    const { syncToFlipkart } = await import('../src/lib/sync/flipkart');
    const { prisma } = await import('@james-andsons/db');

    console.log('Fetching first product with variants from database...');
    const product = await prisma.product.findFirst({
      include: { variants: true }
    });

    if (!product) {
      console.error('No products found in the database to sync!');
      return;
    }

    console.log(`Triggering syncToFlipkart for product: ${product.name} (SKU: ${product.sku})...`);
    const result = await syncToFlipkart(product);
    console.log('Sync Result:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('Flipkart sync execution failed:', err);
  }
}

testFlipkartSync();
