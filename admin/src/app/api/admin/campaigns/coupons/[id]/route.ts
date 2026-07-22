import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/campaigns/coupons/[id] — Revoke (delete) a single dynamic coupon
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Only allow revoking unredeemed coupons
    const coupon = await prisma.dynamicCoupon.findUnique({ where: { id } });
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    if (coupon.isRedeemed) {
      return NextResponse.json({ error: 'Cannot revoke a coupon that has already been redeemed.' }, { status: 400 });
    }

    await prisma.dynamicCoupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to revoke coupon' }, { status: 500 });
  }
}

// PATCH /api/admin/campaigns/coupons/[id] — Mark coupon as redeemed manually
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.dynamicCoupon.update({
      where: { id },
      data: {
        isRedeemed: body.isRedeemed ?? true,
        redeemedAt: body.isRedeemed ? new Date() : null,
      },
    });

    return NextResponse.json({ coupon: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update coupon' }, { status: 500 });
  }
}
