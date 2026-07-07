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
      'sku',
      'external_product_id',
      'external_product_id_type',
      'item_name',
      'brand_name',
      'item_description',
      'standard_price',
      'list_price',
      'quantity',
      'main_image_url',
      'other_image_url1',
      'other_image_url2',
      'item_weight',
      'item_length',
      'item_width',
      'item_height',
      'wattage',
      'voltage',
      'hsn_code',
      'gst_rate',
      'bis_certification',
      'material',
      'bullet_point1',
      'bullet_point2',
      'bullet_point3',
      'bullet_point4',
      'bullet_point5',
      'country_of_origin'
    ];

    const rows = [];
    rows.push(headers.join(','));

    for (const p of products) {
      const getProductLink = (slug: string) => `https://jamesandsons.in/products/${slug}`;
      const getBullets = (bulletsArray: string[] | null, fallbackArray: string[] | null) => {
        const arr = (bulletsArray && bulletsArray.length > 0) ? bulletsArray : (fallbackArray || []);
        return [
          arr[0] || '',
          arr[1] || '',
          arr[2] || '',
          arr[3] || '',
          arr[4] || ''
        ];
      };

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const vPrice = v.d2cPrice || p.d2cPrice;
          const vMrp = v.mrp || p.mrp;
          const vImages = v.images && v.images.length > 0 ? v.images : p.images;
          const brandVal = v.brand || p.brand || 'James and Sons';
          const powerVal = v.power || p.power || '';
          const voltageVal = v.voltage || p.voltage || '';
          const materialVal = v.material || p.material || (p.materialAndFinish && p.materialAndFinish.length > 0 ? p.materialAndFinish[0] : '');
          const bullets = getBullets(v.bulletPoints, p.bulletPoints);
          const originVal = v.countryOfOrigin || p.countryOfOrigin || 'India';

          rows.push([
            escapeCSV(v.sku),
            escapeCSV(v.sku),
            escapeCSV('SellerSKU'),
            escapeCSV(`${p.name} - ${v.name}`),
            escapeCSV(brandVal),
            escapeCSV(p.description || p.name),
            escapeCSV(vPrice),
            escapeCSV(vMrp),
            escapeCSV(v.stockQuantity),
            escapeCSV(vImages[0] || ''),
            escapeCSV(vImages[1] || ''),
            escapeCSV(vImages[2] || ''),
            escapeCSV(v.weight || p.weight || 0.5),
            escapeCSV(v.length || p.length || 10),
            escapeCSV(v.breadth || p.breadth || 10),
            escapeCSV(v.height || p.height || 10),
            escapeCSV(powerVal),
            escapeCSV(voltageVal),
            escapeCSV(p.hsnCode || ''),
            escapeCSV(p.gstRate || 18),
            escapeCSV(p.bisCertification || ''),
            escapeCSV(materialVal),
            escapeCSV(bullets[0]),
            escapeCSV(bullets[1]),
            escapeCSV(bullets[2]),
            escapeCSV(bullets[3]),
            escapeCSV(bullets[4]),
            escapeCSV(originVal)
          ].join(','));
        }
      } else {
        const brandVal = p.brand || 'James and Sons';
        const powerVal = p.power || '';
        const voltageVal = p.voltage || '';
        const materialVal = p.material || (p.materialAndFinish && p.materialAndFinish.length > 0 ? p.materialAndFinish[0] : '');
        const bullets = getBullets(p.bulletPoints, null);
        const originVal = p.countryOfOrigin || 'India';

        rows.push([
          escapeCSV(p.sku),
          escapeCSV(p.sku),
          escapeCSV('SellerSKU'),
          escapeCSV(p.name),
          escapeCSV(brandVal),
          escapeCSV(p.description || p.name),
          escapeCSV(p.d2cPrice),
          escapeCSV(p.mrp),
          escapeCSV(p.stockQuantity),
          escapeCSV(p.images[0] || ''),
          escapeCSV(p.images[1] || ''),
          escapeCSV(p.images[2] || ''),
          escapeCSV(p.weight || 0.5),
          escapeCSV(p.length || 10),
          escapeCSV(p.breadth || 10),
          escapeCSV(p.height || 10),
          escapeCSV(powerVal),
          escapeCSV(voltageVal),
          escapeCSV(p.hsnCode || ''),
          escapeCSV(p.gstRate || 18),
          escapeCSV(p.bisCertification || ''),
          escapeCSV(materialVal),
          escapeCSV(bullets[0]),
          escapeCSV(bullets[1]),
          escapeCSV(bullets[2]),
          escapeCSV(bullets[3]),
          escapeCSV(bullets[4]),
          escapeCSV(originVal)
        ].join(','));
      }
    }

    const csvContent = rows.join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="amazon_listing_feed.csv"'
      }
    });
  } catch (error: any) {
    console.error('Amazon CSV export failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
