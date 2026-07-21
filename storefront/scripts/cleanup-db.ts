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

  console.log("Connected to DB. Beginning database cleanup...");

  try {
    // 1. Delete Orders & Related Tables
    console.log("Deleting OrderItems...");
    await client.query('DELETE FROM "OrderItem"');
    console.log("Deleting ReturnRequests...");
    await client.query('DELETE FROM "ReturnRequest"');
    console.log("Deleting Orders...");
    await client.query('DELETE FROM "Order"');

    // 2. Delete RFQs
    console.log("Deleting RFQItems...");
    await client.query('DELETE FROM "RFQItem"');
    console.log("Deleting RFQs...");
    await client.query('DELETE FROM "RFQ"');

    // 3. Delete Tickets
    console.log("Deleting TicketMessages...");
    await client.query('DELETE FROM "TicketMessage"');
    console.log("Deleting Tickets...");
    await client.query('DELETE FROM "Ticket"');

    // 4. Delete other dependent/unwanted tables
    console.log("Deleting AbandonedCarts...");
    await client.query('DELETE FROM "AbandonedCart"');
    console.log("Deleting CouponUsages...");
    await client.query('DELETE FROM "CouponUsage"');

    // 5. Delete User Addresses
    console.log("Deleting UserAddresses...");
    await client.query('DELETE FROM "UserAddress"');

    // 6. Delete Affiliate & conversions
    console.log("Deleting AffiliateConversions...");
    await client.query('DELETE FROM "AffiliateConversion"');
    console.log("Deleting Affiliates...");
    await client.query('DELETE FROM "Affiliate"');

    // 7. Clean up Users & Companies
    console.log("Deleting all Companies...");
    await client.query('DELETE FROM "Company"'); // Disconnects any B2B companies

    // Find if target admins exist
    const vishalRes = await client.query('SELECT * FROM "User" WHERE email = $1', ['vishal@jamesandsons.in']);
    const adminRes = await client.query('SELECT * FROM "User" WHERE email = $1', ['admin@jamesandsons.in']);

    const vishalUser = vishalRes.rows[0];
    const adminUser = adminRes.rows[0];

    // Delete all users except these two (or their emails)
    console.log("Deleting all test customers and test admins...");
    await client.query('DELETE FROM "User" WHERE email NOT IN ($1, $2)', ['vishal@jamesandsons.in', 'admin@jamesandsons.in']);

    // Ensure vishal@jamesandsons.in exists
    if (!vishalUser) {
      console.log("Creating vishal@jamesandsons.in...");
      const id = 'vishal-admin-id-placeholder-' + Date.now();
      await client.query(`
        INSERT INTO "User" (id, email, "firstName", "lastName", password, role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [id, 'vishal@jamesandsons.in', 'Vishal', 'Admin', 'SUPABASE_AUTH', 'ADMIN']);
    } else {
      console.log("Updating vishal@jamesandsons.in to ADMIN role...");
      await client.query('UPDATE "User" SET role = $1 WHERE email = $2', ['ADMIN', 'vishal@jamesandsons.in']);
    }

    // Ensure admin@jamesandsons.in exists
    if (!adminUser) {
      console.log("Creating admin@jamesandsons.in...");
      const id = 'super-admin-id-placeholder-' + Date.now();
      await client.query(`
        INSERT INTO "User" (id, email, "firstName", "lastName", password, role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [id, 'admin@jamesandsons.in', 'Super', 'Admin', 'SUPABASE_AUTH', 'ADMIN']);
    } else {
      console.log("Updating admin@jamesandsons.in to ADMIN role...");
      await client.query('UPDATE "User" SET role = $1 WHERE email = $2', ['ADMIN', 'admin@jamesandsons.in']);
    }

    console.log("Database cleanup successfully completed!");
  } catch (error) {
    console.error("Error during database cleanup:", error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
