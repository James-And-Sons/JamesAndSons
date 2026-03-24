import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await req.json();
    const { id, variants, specs, images, ...productData } = body;

    // Delete old variants and recreate
    await prisma.productVariant.deleteMany({ where: { productId: params.id } });

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...productData,
        images: images || [],
        specs: specs && Object.keys(specs).length > 0 ? specs : undefined,
        updatedAt: new Date(),
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

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
