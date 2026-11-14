import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const catalogues = await prisma.catalogue.findMany({
      where: { isPublished: true },
      orderBy: { year: 'desc' },
    });
    return NextResponse.json(catalogues);
  } catch (error) {
    console.error('Error fetching catalogues:', error);
    return NextResponse.json({ error: 'Failed to fetch catalogues' }, { status: 500 });
  }
}
