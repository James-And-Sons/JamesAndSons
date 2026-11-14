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

  console.log("Connected to DB. Fixing product listings...");

  // Fix low prices for JCs
  console.log("Fixing JC08 pricing...");
  await client.query(`
    UPDATE "Product" 
    SET mrp = 9500, "d2cPrice" = 6500, "b2bPrice" = 5200 
    WHERE sku = 'JC08'
  `);

  console.log("Fixing JC22 pricing...");
  await client.query(`
    UPDATE "Product" 
    SET mrp = 45000, "d2cPrice" = 28000, "b2bPrice" = 22000 
    WHERE sku = 'JC22'
  `);

  console.log("Fixing JC14 pricing...");
  await client.query(`
    UPDATE "Product" 
    SET mrp = 38000, "d2cPrice" = 24000, "b2bPrice" = 19200 
    WHERE sku = 'JC14'
  `);

  console.log("Fixing JC01 pricing...");
  await client.query(`
    UPDATE "Product" 
    SET mrp = 18000, "d2cPrice" = 12000, "b2bPrice" = 9600 
    WHERE sku = 'JC01'
  `);

  // Let's also check if any products are missing generic search keywords and populate them
  console.log("Generating generic search keywords for existing listings...");
  const productsRes = await client.query(`
    SELECT p.id, p.name, p.sku, p.style, p.color, p.material, c.name as category_name
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p."amazonKeywords" IS NULL OR p."amazonKeywords" = ''
  `);

  for (const p of productsRes.rows) {
    const keywordSet = new Set<string>();
    
    if (p.name) {
      p.name.toLowerCase().split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^a-z0-9]/g, '');
        if (clean.length > 2) keywordSet.add(clean);
      });
    }

    if (p.category_name) {
      p.category_name.toLowerCase().split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^a-z0-9]/g, '');
        if (clean.length > 2) keywordSet.add(clean);
      });
    }

    // Default terms
    keywordSet.add("lighting");
    keywordSet.add("fixture");
    keywordSet.add("decor");
    keywordSet.add("luxury");

    const keywords = Array.from(keywordSet).join(', ').substring(0, 250);
    await client.query('UPDATE "Product" SET "amazonKeywords" = $1 WHERE id = $2', [keywords, p.id]);
  }

  console.log("Listing fix execution complete!");
  await client.end();
}

main().catch(console.error);
