import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
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

async function main() {
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log("Connected to DB.");

  const res = await client.query('SELECT id, sku, name, mrp, "d2cPrice", "b2bPrice" FROM "Product" WHERE mrp < 1000 OR "d2cPrice" < 1000');
  console.log("Products with low prices:");
  console.log(JSON.stringify(res.rows, null, 2));

  // Let's also check all products to see if there are missing images, etc.
  const allRes = await client.query('SELECT id, sku, name, images, "whiteBackgroundImages" FROM "Product"');
  const invalidImages = allRes.rows.filter(p => !p.images || p.images.length === 0);
  console.log("\nProducts with NO images:");
  console.log(JSON.stringify(invalidImages, null, 2));

  await client.end();
}

main().catch(console.error);
