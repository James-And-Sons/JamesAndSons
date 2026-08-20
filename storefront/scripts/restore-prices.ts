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

  console.log("Connected to DB. Restoring product listing prices...");

  // Restore original low prices for JC08, JC22, JC14, JC01
  console.log("Restoring JC08 pricing...");
  await client.query(`
    UPDATE "Product" 
    SET mrp = 1100, "d2cPrice" = 500, "b2bPrice" = 300 
    WHERE sku = 'JC08'
  `);

  console.log("Restoring JC22 pricing...");
  await client.query(`
    UPDATE "Product" 
    SET mrp = 1000, "d2cPrice" = 900, "b2bPrice" = 700 
    WHERE sku = 'JC22'
  `);

  console.log("Restoring JC14 pricing...");
  await client.query(`
    UPDATE "Product" 
    SET mrp = 700, "d2cPrice" = 600, "b2bPrice" = 500 
    WHERE sku = 'JC14'
  `);

  console.log("Restoring JC01 pricing...");
  await client.query(`
    UPDATE "Product" 
    SET mrp = 5500, "d2cPrice" = 3000, "b2bPrice" = 2500 
    WHERE sku = 'JC01'
  `);

  console.log("Restoration complete!");
  await client.end();
}

main().catch(console.error);
