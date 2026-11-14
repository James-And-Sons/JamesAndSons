import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const { name, slug, description, technicalSubheading, hsnCode, gstRate, bisStandard, bisStatus, image, images, baseShippingLimit, freeShippingThreshold } = await req.json();
    const cat = await prisma.category.update({ 
      where: { id }, 
      data: { 
        name, 
        slug, 
        description,
        technicalSubheading,
        hsnCode,
        gstRate: (gstRate !== undefined && gstRate !== null && !isNaN(parseFloat(String(gstRate)))) ? parseFloat(String(gstRate)) : null,
        bisStandard,
        bisStatus,
        baseShippingLimit: baseShippingLimit !== undefined && baseShippingLimit !== null ? parseFloat(String(baseShippingLimit)) : null,
        freeShippingThreshold: freeShippingThreshold !== undefined && freeShippingThreshold !== null ? parseFloat(String(freeShippingThreshold)) : null,
        image: image || null,
        images: Array.isArray(images) ? images : []
      } 
    });

    // Cascade updates to all products in this category
    const productGst = (gstRate !== undefined && gstRate !== null && !isNaN(parseFloat(String(gstRate)))) ? parseFloat(String(gstRate)) : 18.0;
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: {
        hsnCode: hsnCode || null,
        gstRate: productGst,
        bisCertification: bisStandard || null
      }
    });

    return NextResponse.json(cat);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
