import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const count = await prisma.ticket.count({ where: { status: 'OPEN' } });
  return NextResponse.json({ count });
}
