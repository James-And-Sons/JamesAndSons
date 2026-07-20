import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  let slug: string | undefined;
  try {
    const body = await req.json();
    const { name, description, image } = body;
    slug = body.slug;

    if (!slug) {
      return new NextResponse('Slug is required', { status: 400 });
    }

    // Check if the slug is already taken by another space
    const existing = await prisma.space.findFirst({
      where: {
        slug,
        id: { not: id }
      }
    });

    if (existing) {
      return new NextResponse(`A space with the name "${name}" (slug: "${slug}") already exists. Please choose a unique name.`, { status: 400 });
    }

    const space = await prisma.space.update({ 
      where: { id }, 
      data: { name, slug, description, image } 
    });
    return NextResponse.json(space);
  } catch (e: any) {
    if (e.code === 'P2002') {
      return new NextResponse(`A space with the slug "${slug || ''}" already exists.`, { status: 400 });
    }
    return new NextResponse(e.message || 'Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    // For many-to-many relationships, we need to disconnect products first
    // to avoid potential constraint issues depending on the DB configuration.
    await prisma.space.update({
      where: { id },
      data: {
        products: {
          set: [] // Disconnect all products
        }
      }
    });

    await prisma.space.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error deleting space:', e);
    return NextResponse.json({ 
      error: e.message || 'An error occurred while deleting the space. Please make sure no products are strictly dependent on it.' 
    }, { status: 500 });
  }
}
