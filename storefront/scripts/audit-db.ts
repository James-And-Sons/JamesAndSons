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

  console.log("=== DB AUDIT STATS ===");

  // Count orders, tickets, rfqs, users
  const ordersCount = await client.query('SELECT COUNT(*) FROM "Order"');
  const ticketsCount = await client.query('SELECT COUNT(*) FROM "Ticket"');
  const rfqsCount = await client.query('SELECT COUNT(*) FROM "RFQ"');
  const usersCount = await client.query('SELECT COUNT(*) FROM "User"');
  const productsCount = await client.query('SELECT COUNT(*) FROM "Product"');

  console.log(`Orders: ${ordersCount.rows[0].count}`);
  console.log(`Tickets: ${ticketsCount.rows[0].count}`);
  console.log(`RFQs: ${rfqsCount.rows[0].count}`);
  console.log(`Users: ${usersCount.rows[0].count}`);
  console.log(`Products: ${productsCount.rows[0].count}`);

  // Fetch users and their roles
  const users = await client.query('SELECT id, email, role FROM "User"');
  console.log("\n=== USERS ===");
  console.log(users.rows);

  // Fetch some products to see if there are errors (e.g. invalid json, negative price, missing fields)
  const products = await client.query('SELECT id, sku, name, slug, mrp, "d2cPrice", "b2bPrice", "categoryId", images, "whiteBackgroundImages", "amazonKeywords" FROM "Product"');
  console.log("\n=== PRODUCTS ===");
  console.log(products.rows.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    mrp: p.mrp,
    d2cPrice: p.d2cPrice,
    b2bPrice: p.b2bPrice,
    imagesCount: p.images?.length,
    whiteBackgroundImagesCount: p.whiteBackgroundImages?.length,
    amazonKeywords: p.amazonKeywords
  })));

  await client.end();
}

main().catch(console.error);
