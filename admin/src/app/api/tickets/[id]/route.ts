import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const { status } = await req.json();
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(ticket);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
