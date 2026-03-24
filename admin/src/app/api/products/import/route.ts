import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function POST(req: NextRequest) {
  const { rows } = await req.json();
  let success = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const category = await prisma.category.findFirst({ where: { slug: row.categorySlug || '' } });
      if (!category) { failed++; continue; }

      let slug = generateSlug(row.name);
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) slug = `${slug}-${Date.now()}`;

      await prisma.product.create({
        data: {
          name: row.name,
          sku: row.sku,
          slug,
          description: row.description || '',
          mrp: parseFloat(row.mrp) || 0,
          d2cPrice: parseFloat(row.d2cPrice) || 0,
          b2bPrice: parseFloat(row.b2bPrice) || 0,
          stockQuantity: parseInt(row.stockQuantity, 10) || 0,
          categoryId: category.id,
          images: [],
        },
      });
      success++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ success, failed });
}
