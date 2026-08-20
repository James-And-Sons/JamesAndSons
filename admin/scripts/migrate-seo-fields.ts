import { Client } from 'pg';
import path from 'path';
import fs from 'fs';

// Load env variables manually from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading .env.local...');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    console.log('Running manual PostgreSQL migration to add Amazon SEO columns...');
    await client.query(`
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonFixtureForm" TEXT;
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonMountingType" TEXT;
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonLightingMethod" TEXT;
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonWaterResistance" TEXT;
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonTheme" TEXT;
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonSpecialFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonIncludedComponents" TEXT;
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonKeywords" TEXT;
    `);
    console.log('PostgreSQL migration completed successfully.');
  } catch (err) {
    console.error('PostgreSQL migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
