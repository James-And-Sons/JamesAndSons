import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const catalogues = await prisma.catalogue.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(catalogues);
  } catch (error) {
    console.error('Error fetching catalogues:', error);
    return NextResponse.json({ error: 'Failed to fetch catalogues' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, year, coverImage, fileUrl, isPublished } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: 'title and fileUrl are required' }, { status: 400 });
    }

    const catalogue = await prisma.catalogue.create({
      data: {
        title,
        description: description || null,
        year: year ? Number(year) : new Date().getFullYear(),
        coverImage: coverImage || null,
        fileUrl,
        isPublished: isPublished ?? false,
      },
    });

    return NextResponse.json(catalogue, { status: 201 });
  } catch (error) {
    console.error('Error creating catalogue:', error);
    return NextResponse.json({ error: 'Failed to create catalogue' }, { status: 500 });
  }
}
