const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CSV_PATH = '/Users/abhishikt_mac/Skills/Coding/Growth-ho clients/JamesAndSons/admin/james_and_sons_products.csv';

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function parseArray(val) {
  if (!val || val === '—') return [];
  // Handle commas or other delimiters
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

async function main() {
  try {
    console.log('--- Reading CSV file ---');
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} rows to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const row of records) {
      try {
        const categoryName = row['category']?.trim();
        let categoryId = null;

        if (categoryName && categoryName !== '—') {
          let category = await prisma.category.findFirst({
            where: { name: { equals: categoryName, mode: 'insensitive' } }
          });

          if (!category) {
            category = await prisma.category.create({
              data: {
                name: categoryName,
                slug: generateSlug(categoryName),
                description: `All ${categoryName} products`,
              }
            });
            console.log(`Created new category: ${categoryName}`);
          }
          categoryId = category.id;
        }

        // Process spaces
        const spaceNames = row['spaces']?.split(';').map(s => s.trim()).filter(Boolean) || [];
        const spaceConnects = [];
        for (const name of spaceNames) {
          let space = await prisma.space.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
          });
          if (!space) {
            space = await prisma.space.create({
              data: {
                name,
                slug: generateSlug(name)
              }
            });
            console.log(`Created new space: ${name}`);
          }
          spaceConnects.push({ id: space.id });
        }

        const sku = row['sku']?.trim();
        if (!sku) {
          throw new Error('Missing SKU');
        }

        let existingProduct = await prisma.product.findUnique({
          where: { sku }
        });

        if (!existingProduct) {
          let slug = row['handle']?.trim() || generateSlug(row['name']);
          const existingSlug = await prisma.product.findUnique({ where: { slug } });
          if (existingSlug) slug = `${slug}-${Date.now()}`;

          existingProduct = await prisma.product.create({
            data: {
              sku,
              name: row['name'],
              slug,
              description: row['description'] || '',
              mrp: parseFloat(row['mrp']) || 0,
              d2cPrice: parseFloat(row['d2cPrice']) || 0,
              b2bPrice: parseFloat(row['b2bPrice']) || 0,
              stockQuantity: parseInt(row['stockQuantity'], 10) || 0,
              weight: parseFloat(row['weight_kg']) || null,
              length: parseFloat(row['length_cm']) || null,
              breadth: parseFloat(row['breadth_cm']) || null,
              height: parseFloat(row['height_cm']) || null,
              actualHeight: parseFloat(row['actualHeight_in']) || null,
              actualWidth: parseFloat(row['actualWidth_in']) || null,
              actualDepth: parseFloat(row['actualDepth_in']) || null,
              isLed: row['isLed']?.toUpperCase() === 'TRUE',
              gstRate: parseFloat(row['gstRate']) || 18.0,
              hsnCode: row['hsnCode'] || null,
              bisCertification: row['bisCertification'] || null,
              materialAndFinish: parseArray(row['materialAndFinish']),
              bulbType: parseArray(row['bulbType']),
              style: parseArray(row['style']),
              images: parseArray(row['images']),
              categoryId: categoryId,
              spaces: {
                connect: spaceConnects
              }
            }
          });
          console.log(`Created product: ${row['name']} (${sku})`);
        }

        // Add variant if present
        const variantSku = row['variant_sku']?.trim();
        if (variantSku) {
          const existingVariant = await prisma.productVariant.findUnique({
            where: { sku: variantSku }
          });

          if (!existingVariant) {
            await prisma.productVariant.create({
              data: {
                productId: existingProduct.id,
                name: row['variant_name'] || '',
                sku: variantSku,
                mrp: parseFloat(row['variant_mrp']) || null,
                d2cPrice: parseFloat(row['variant_d2cPrice']) || null,
                stockQuantity: parseInt(row['variant_stock'], 10) || 0,
              }
            });
            console.log(`Created variant: ${row['variant_name']} (${variantSku}) for ${row['name']}`);
          }
        }

        successCount++;
      } catch (err) {
        console.error(`Failed to import row for product ${row['name']}:`, err.message);
        failCount++;
      }
    }

    console.log('--- Import Complete ---');
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Failed: ${failCount}`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
