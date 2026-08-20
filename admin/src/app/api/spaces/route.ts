import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const spaces = await prisma.space.findMany({
      include: { _count: { select: { products: true } } }
    });
    return NextResponse.json(spaces);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let slug: string | undefined;
  try {
    const body = await req.json();
    const { name, description, image, images } = body;
    slug = body.slug;

    if (!slug) {
      return new NextResponse('Slug is required', { status: 400 });
    }

    // Check if the slug is already taken
    const existing = await prisma.space.findUnique({
      where: { slug }
    });

    if (existing) {
      return new NextResponse(`A space with the name "${name}" (slug: "${slug}") already exists. Please choose a unique name.`, { status: 400 });
    }

    const space = await prisma.space.create({ 
      data: { 
        name, 
        slug, 
        description, 
        image: image || null,
        images: Array.isArray(images) ? images : []
      } 
    });
    return NextResponse.json(space);
  } catch (e: any) {
    if (e.code === 'P2002') {
      return new NextResponse(`A space with the slug "${slug || ''}" already exists.`, { status: 400 });
    }
    return new NextResponse(e.message || 'Internal Server Error', { status: 500 });
  }
}
