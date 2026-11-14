import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const priceStr = searchParams.get('price');

  if (!priceStr) {
    return NextResponse.json({ error: 'Price parameter is required' }, { status: 400 });
  }

  const price = parseFloat(priceStr);
  if (isNaN(price)) {
    return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
  }

  try {
    const plans = await prisma.onsitegoMapping.findMany({
      where: {
        minPrice: { lte: price },
        maxPrice: { gte: price }
      },
      orderBy: { planPriceD2c: 'asc' }
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Error fetching Onsitego mappings:', error);
    return NextResponse.json({ error: 'Failed to retrieve warranty options' }, { status: 500 });
  }
}
