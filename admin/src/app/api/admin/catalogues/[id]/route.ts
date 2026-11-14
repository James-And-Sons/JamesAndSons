import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const catalogue = await prisma.catalogue.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(catalogue);
  } catch (error) {
    console.error('Error updating catalogue:', error);
    return NextResponse.json({ error: 'Failed to update catalogue' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.catalogue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting catalogue:', error);
    return NextResponse.json({ error: 'Failed to delete catalogue' }, { status: 500 });
  }
}
