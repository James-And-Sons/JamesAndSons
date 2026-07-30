import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const count = await prisma.rFQ.count({
    where: {
      status: { in: ['SUBMITTED', 'REVIEWING'] }
    }
  });
  return NextResponse.json({ count });
}
