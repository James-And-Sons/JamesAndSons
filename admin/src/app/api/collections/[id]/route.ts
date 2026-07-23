import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const { name, slug, description, technicalSubheading, hsnCode, gstRate, bisStandard, bisStatus, image, images } = await req.json();
    const cat = await prisma.category.update({ 
      where: { id }, 
      data: { 
        name, 
        slug, 
        description,
        technicalSubheading,
        hsnCode,
        gstRate: gstRate !== undefined && gstRate !== null ? parseFloat(String(gstRate)) : null,
        bisStandard,
        bisStatus,
        image: image || null,
        images: Array.isArray(images) ? images : []
      } 
    });

    // Cascade updates to all products in this category
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: {
        hsnCode: hsnCode || null,
        gstRate: gstRate !== undefined && gstRate !== null ? parseFloat(String(gstRate)) : 18.0,
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
