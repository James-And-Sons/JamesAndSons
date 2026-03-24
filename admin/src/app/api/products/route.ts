import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variants, specs, images, ...productData } = body;

    let slug = generateSlug(productData.name);
    // Ensure slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        description: productData.description || '',
        images: images || [],
        specs: specs && Object.keys(specs).length > 0 ? specs : undefined,
        variants: variants?.length > 0
          ? {
              create: variants.map((v: any) => ({
                name: v.name,
                sku: v.sku,
                d2cPrice: v.d2cPrice || null,
                mrp: v.mrp || null,
                b2bPrice: v.b2bPrice || null,
                stockQuantity: v.stockQuantity || 0,
                images: v.images || [],
              }))
            }
          : undefined,
      },
    });

    return NextResponse.json(product);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
