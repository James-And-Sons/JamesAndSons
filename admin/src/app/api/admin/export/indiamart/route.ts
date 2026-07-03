import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function escapeCSV(val: any) {
  if (val === null || val === undefined) return '';
  let str = String(val).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    str = `"${str}"`;
  }
  return str;
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true
      },
      orderBy: { name: 'asc' }
    });

    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'D2C Price (INR)',
      'MRP (INR)',
      'B2B Price (INR)',
      'Stock Qty',
      'Description',
      'Unit',
      'Physical Dimensions',
      'Material & Finish',
      'Bulb Type',
      'Style',
      'Image URL 1',
      'Image URL 2',
      'Image URL 3',
      'Technical Specs'
    ];

    const rows = [];
    rows.push(headers.join(','));

    for (const p of products) {
      const getDimensionsText = (pRecord: any, parentProduct: any = null) => {
        const h = pRecord.actualHeight;
        const w = pRecord.actualWidth;
        const d = pRecord.actualDepth;
        const unit = pRecord.dimensionUnit || parentProduct?.dimensionUnit || 'INCH';
        const suffix = unit === 'CM' ? 'cm' : 'in';
        if (h || w || d) {
          const parts = [];
          if (h) parts.push(`${h}${suffix} H`);
          if (w) parts.push(`${w}${suffix} W`);
          if (d) parts.push(`${d}${suffix} D`);
          return parts.join(' x ');
        }
        return parentProduct?.dimensions || pRecord.dimensions || '';
      };

      const formatSpecs = (specsObj: any) => {
        if (!specsObj || typeof specsObj !== 'object') return '';
        return Object.entries(specsObj)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
      };

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const vPrice = v.d2cPrice || p.d2cPrice;
          const vMrp = v.mrp || p.mrp;
          const vB2B = v.b2bPrice || p.b2bPrice;
          const vImages = v.images && v.images.length > 0 ? v.images : p.images;
          const specsText = formatSpecs(p.specs);

          rows.push([
            escapeCSV(`${p.name} - ${v.name}`),
            escapeCSV(v.sku),
            escapeCSV(p.category?.name),
            escapeCSV(vPrice),
            escapeCSV(vMrp),
            escapeCSV(vB2B),
            escapeCSV(v.stockQuantity),
            escapeCSV(p.description),
            escapeCSV('Piece'),
            escapeCSV(getDimensionsText(v, p)),
            escapeCSV(p.materialAndFinish?.join(', ')),
            escapeCSV(p.bulbType?.join(', ')),
            escapeCSV(p.style?.join(', ')),
            escapeCSV(vImages[0] || ''),
            escapeCSV(vImages[1] || ''),
            escapeCSV(vImages[2] || ''),
            escapeCSV(specsText)
          ].join(','));
        }
      } else {
        const specsText = formatSpecs(p.specs);
        rows.push([
          escapeCSV(p.name),
          escapeCSV(p.sku),
          escapeCSV(p.category?.name),
          escapeCSV(p.d2cPrice),
          escapeCSV(p.mrp),
          escapeCSV(p.b2bPrice),
          escapeCSV(p.stockQuantity),
          escapeCSV(p.description),
          escapeCSV('Piece'),
          escapeCSV(getDimensionsText(p)),
          escapeCSV(p.materialAndFinish?.join(', ')),
          escapeCSV(p.bulbType?.join(', ')),
          escapeCSV(p.style?.join(', ')),
          escapeCSV(p.images[0] || ''),
          escapeCSV(p.images[1] || ''),
          escapeCSV(p.images[2] || ''),
          escapeCSV(specsText)
        ].join(','));
      }
    }

    const csvContent = rows.join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="indiamart_catalog.csv"'
      }
    });
  } catch (error: any) {
    console.error('IndiaMART export failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
