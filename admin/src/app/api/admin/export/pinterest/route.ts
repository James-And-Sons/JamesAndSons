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
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : req.nextUrl.searchParams.get('secret');
    const secret = process.env.INVENTORY_SYNC_WEBHOOK_SECRET;

    if (secret && token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { name: 'asc' }
    });

    const headers = [
      'id',
      'title',
      'description',
      'link',
      'image_link',
      'price',
      'availability',
      'condition',
      'brand'
    ];

    const rows = [];
    rows.push(headers.join(','));

    for (const p of products) {
      const getAvailability = (qty: number) => (qty > 0 ? 'in stock' : 'out of stock');
      const getProductLink = (slug: string) => `https://jamesandsons.in/products/${slug}`;
      const getPriceText = (price: number) => `${Math.round(price)} INR`;

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const vPrice = v.d2cPrice || p.d2cPrice;
          const vImages = v.images && v.images.length > 0 ? v.images : p.images;

          rows.push([
            escapeCSV(v.sku),
            escapeCSV(`${p.name} - ${v.name}`),
            escapeCSV(p.description || p.name),
            escapeCSV(getProductLink(p.slug)),
            escapeCSV(vImages[0] || 'https://jamesandsons.in/images/placeholder.png'),
            escapeCSV(getPriceText(vPrice)),
            escapeCSV(getAvailability(v.stockQuantity)),
            escapeCSV('new'),
            escapeCSV('James and Sons')
          ].join(','));
        }
      } else {
        rows.push([
          escapeCSV(p.sku),
          escapeCSV(p.name),
          escapeCSV(p.description || p.name),
          escapeCSV(getProductLink(p.slug)),
          escapeCSV(p.images[0] || 'https://jamesandsons.in/images/placeholder.png'),
          escapeCSV(getPriceText(p.d2cPrice)),
          escapeCSV(getAvailability(p.stockQuantity)),
          escapeCSV('new'),
          escapeCSV('James and Sons')
        ].join(','));
      }
    }

    const csvContent = rows.join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pinterest_catalog_feed.csv"'
      }
    });
  } catch (error: any) {
    console.error('Pinterest CSV export failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
