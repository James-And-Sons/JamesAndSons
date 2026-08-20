const fs = require('fs');
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

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  try {
    console.log('--- Fetching products from database ---');
    const products = await prisma.product.findMany({
      include: {
        category: true,
        spaces: true,
        variants: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${products.length} products.`);

    const headers = [
      'handle', 'sku', 'name', 'description', 'category', 'spaces',
      'mrp', 'd2cPrice', 'b2bPrice', 'stockQuantity', 'weight_kg',
      'length_cm', 'breadth_cm', 'height_cm', 'actualHeight_in',
      'actualWidth_in', 'actualDepth_in', 'isLed', 'gstRate', 'hsnCode',
      'bisCertification', 'materialAndFinish', 'bulbType', 'style', 'images',
      'variant_name', 'variant_sku', 'variant_mrp', 'variant_d2cPrice', 'variant_stock'
    ];

    const rows = [];
    rows.push(headers.join(','));

    for (const p of products) {
      const baseData = {
        handle: p.slug,
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category ? p.category.name : '',
        spaces: p.spaces ? p.spaces.map(s => s.name).join(';') : '',
        mrp: p.mrp,
        d2cPrice: p.d2cPrice,
        b2bPrice: p.b2bPrice,
        stockQuantity: p.stockQuantity,
        weight_kg: p.weight,
        length_cm: p.length,
        breadth_cm: p.breadth,
        height_cm: p.height,
        actualHeight_in: p.actualHeight,
        actualWidth_in: p.actualWidth,
        actualDepth_in: p.actualDepth,
        isLed: p.isLed ? 'TRUE' : 'FALSE',
        gstRate: p.gstRate,
        hsnCode: p.hsnCode || '',
        bisCertification: p.bisCertification || '',
        materialAndFinish: p.materialAndFinish ? p.materialAndFinish.join(', ') : '',
        bulbType: p.bulbType ? p.bulbType.join(', ') : '',
        style: p.style ? p.style.join(', ') : '',
        images: p.images ? p.images.join(', ') : ''
      };

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const rowData = [
            escapeCSV(baseData.handle),
            escapeCSV(baseData.sku),
            escapeCSV(baseData.name),
            escapeCSV(baseData.description),
            escapeCSV(baseData.category),
            escapeCSV(baseData.spaces),
            escapeCSV(baseData.mrp),
            escapeCSV(baseData.d2cPrice),
            escapeCSV(baseData.b2bPrice),
            escapeCSV(baseData.stockQuantity),
            escapeCSV(baseData.weight_kg),
            escapeCSV(baseData.length_cm),
            escapeCSV(baseData.breadth_cm),
            escapeCSV(baseData.height_cm),
            escapeCSV(baseData.actualHeight_in),
            escapeCSV(baseData.actualWidth_in),
            escapeCSV(baseData.actualDepth_in),
            escapeCSV(baseData.isLed),
            escapeCSV(baseData.gstRate),
            escapeCSV(baseData.hsnCode),
            escapeCSV(baseData.bisCertification),
            escapeCSV(baseData.materialAndFinish),
            escapeCSV(baseData.bulbType),
            escapeCSV(baseData.style),
            escapeCSV(baseData.images),
            escapeCSV(v.name),
            escapeCSV(v.sku),
            escapeCSV(v.mrp),
            escapeCSV(v.d2cPrice),
            escapeCSV(v.stockQuantity)
          ];
          rows.push(rowData.join(','));
        }
      } else {
        const rowData = [
          escapeCSV(baseData.handle),
          escapeCSV(baseData.sku),
          escapeCSV(baseData.name),
          escapeCSV(baseData.description),
          escapeCSV(baseData.category),
          escapeCSV(baseData.spaces),
          escapeCSV(baseData.mrp),
          escapeCSV(baseData.d2cPrice),
          escapeCSV(baseData.b2bPrice),
          escapeCSV(baseData.stockQuantity),
          escapeCSV(baseData.weight_kg),
          escapeCSV(baseData.length_cm),
          escapeCSV(baseData.breadth_cm),
          escapeCSV(baseData.height_cm),
          escapeCSV(baseData.actualHeight_in),
          escapeCSV(baseData.actualWidth_in),
          escapeCSV(baseData.actualDepth_in),
          escapeCSV(baseData.isLed),
          escapeCSV(baseData.gstRate),
          escapeCSV(baseData.hsnCode),
          escapeCSV(baseData.bisCertification),
          escapeCSV(baseData.materialAndFinish),
          escapeCSV(baseData.bulbType),
          escapeCSV(baseData.style),
          escapeCSV(baseData.images),
          '', // variant_name
          '', // variant_sku
          '', // variant_mrp
          '', // variant_d2cPrice
          ''  // variant_stock
        ];
        rows.push(rowData.join(','));
      }
    }

    const csvContent = rows.join('\n');
    const outputPath = 'exported_products.csv';
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    console.log(`Successfully exported catalog to ${outputPath}`);

  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
