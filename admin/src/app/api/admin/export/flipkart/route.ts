import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function escapeCSV(val: any) {
  if (val === null || val === undefined) return '';
  let str = String(val).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    str = `"${str}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { name: 'asc' }
    });

    const headers = [
      'seller_sku',
      'brand',
      'title',
      'description',
      'selling_price',
      'mrp',
      'stock',
      'shipping_weight_kg',
      'package_length_cm',
      'package_breadth_cm',
      'package_height_cm',
      'main_image_url',
      'sub_image_1',
      'sub_image_2',
      'power_consumption_w',
      'voltage',
      'hsn',
      'gst_rate_percent',
      'material',
      'color',
      'size',
      'country_of_origin',
      'warranty_summary'
    ];

    const rows = [];
    rows.push(headers.join(','));

    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const vPrice = v.d2cPrice || p.d2cPrice;
          const vMrp = v.mrp || p.mrp;
          const vImages = v.images && v.images.length > 0 ? v.images : p.images;
          const brandVal = v.brand || p.brand || 'James and Sons';
          const powerVal = v.power || p.power || '';
          const voltageVal = v.voltage || p.voltage || '';
          const materialVal = v.material || p.material || (p.materialAndFinish && p.materialAndFinish.length > 0 ? p.materialAndFinish[0] : '');
          const colorVal = v.color || p.color || '';
          const sizeVal = v.size || p.size || '';
          const originVal = v.countryOfOrigin || p.countryOfOrigin || 'India';
          const warrantyVal = v.warranty || p.warranty || '';

          rows.push([
            escapeCSV(v.sku),
            escapeCSV(brandVal),
            escapeCSV(`${p.name} - ${v.name}`),
            escapeCSV(p.description || p.name),
            escapeCSV(vPrice),
            escapeCSV(vMrp),
            escapeCSV(v.stockQuantity),
            escapeCSV(v.weight || p.weight || 0.5),
            escapeCSV(v.length || p.length || 10),
            escapeCSV(v.breadth || p.breadth || 10),
            escapeCSV(v.height || p.height || 10),
            escapeCSV(vImages[0] || ''),
            escapeCSV(vImages[1] || ''),
            escapeCSV(vImages[2] || ''),
            escapeCSV(powerVal),
            escapeCSV(voltageVal),
            escapeCSV(p.hsnCode || ''),
            escapeCSV(p.gstRate || 18),
            escapeCSV(materialVal),
            escapeCSV(colorVal),
            escapeCSV(sizeVal),
            escapeCSV(originVal),
            escapeCSV(warrantyVal)
          ].join(','));
        }
      } else {
        const brandVal = p.brand || 'James and Sons';
        const powerVal = p.power || '';
        const voltageVal = p.voltage || '';
        const materialVal = p.material || (p.materialAndFinish && p.materialAndFinish.length > 0 ? p.materialAndFinish[0] : '');
        const colorVal = p.color || '';
        const sizeVal = p.size || '';
        const originVal = p.countryOfOrigin || 'India';
        const warrantyVal = p.warranty || '';

        rows.push([
          escapeCSV(p.sku),
          escapeCSV(brandVal),
          escapeCSV(p.name),
          escapeCSV(p.description || p.name),
          escapeCSV(p.d2cPrice),
          escapeCSV(p.mrp),
          escapeCSV(p.stockQuantity),
          escapeCSV(p.weight || 0.5),
          escapeCSV(p.length || 10),
          escapeCSV(p.breadth || 10),
          escapeCSV(p.height || 10),
          escapeCSV(p.images[0] || ''),
          escapeCSV(p.images[1] || ''),
          escapeCSV(p.images[2] || ''),
          escapeCSV(powerVal),
          escapeCSV(voltageVal),
          escapeCSV(p.hsnCode || ''),
          escapeCSV(p.gstRate || 18),
          escapeCSV(materialVal),
          escapeCSV(colorVal),
          escapeCSV(sizeVal),
          escapeCSV(originVal),
          escapeCSV(warrantyVal)
        ].join(','));
      }
    }

    const csvContent = rows.join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="flipkart_listing_feed.csv"'
      }
    });
  } catch (error: any) {
    console.error('Flipkart CSV export failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
