import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const cats = await prisma.category.findMany({
      include: { _count: { select: { products: true } } }
    });
    return NextResponse.json(cats);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, slug, description, technicalSubheading, hsnCode, gstRate, bisStandard, bisStatus, image, images, baseShippingLimit, freeShippingThreshold } = await req.json();
    const cat = await prisma.category.create({ 
      data: { 
        name, 
        slug, 
        description,
        technicalSubheading,
        hsnCode,
        gstRate: gstRate !== undefined && gstRate !== null ? parseFloat(String(gstRate)) : null,
        bisStandard,
        bisStatus,
        baseShippingLimit: baseShippingLimit !== undefined && baseShippingLimit !== null ? parseFloat(String(baseShippingLimit)) : null,
        freeShippingThreshold: freeShippingThreshold !== undefined && freeShippingThreshold !== null ? parseFloat(String(freeShippingThreshold)) : null,
        image: image || null,
        images: Array.isArray(images) ? images : []
      } 
    });
    return NextResponse.json(cat);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
