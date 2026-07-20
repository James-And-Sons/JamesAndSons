import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────────────────────
// PUBLIC COUPON VERIFICATION API
// Used by external partners (Pauket, CouponDunia, etc.)
//
// POST /api/v1/coupons/verify
// Headers: x-api-key: <API_SECRET_KEY>
// Body: { code: string, cart_total: number, user_email?: string }
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Authenticate the partner
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.PROMOTIONS_API_KEY) {
    return NextResponse.json({ valid: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, cart_total, user_email } = body;

    if (!code || typeof cart_total !== 'number') {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields: code, cart_total' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toString().trim().toUpperCase() },
    });

    if (!coupon) return NextResponse.json({ valid: false, error: 'Coupon not found.' });
    if (coupon.status !== 'ACTIVE') return NextResponse.json({ valid: false, error: `Coupon is ${coupon.status.toLowerCase()}.` });

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return NextResponse.json({ valid: false, error: 'Coupon not yet active.' });
    if (coupon.expiresAt && now > coupon.expiresAt) return NextResponse.json({ valid: false, error: 'Coupon has expired.' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ valid: false, error: 'Coupon exhausted.' });
    if (coupon.minOrderAmount && cart_total < coupon.minOrderAmount) {
      return NextResponse.json({ valid: false, error: `Minimum order ₹${coupon.minOrderAmount} required.` });
    }

    // Per-user check (if email provided)
    if (user_email && coupon.usageLimitPerUser) {
      const dbUser = await prisma.user.findUnique({ where: { email: user_email.toLowerCase() } });
      if (dbUser) {
        const usageCount = await prisma.couponUsage.count({
          where: { couponId: coupon.id, userId: dbUser.id },
        });
        if (usageCount >= coupon.usageLimitPerUser) {
          return NextResponse.json({ valid: false, error: 'User has already used this coupon.' });
        }
      }
    }

    // Calculate discount
    let discount_amount = 0;
    let free_shipping = false;
    if (coupon.type === 'PERCENTAGE') {
      discount_amount = (coupon.value / 100) * cart_total;
      if (coupon.maxDiscountCap) discount_amount = Math.min(discount_amount, coupon.maxDiscountCap);
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discount_amount = Math.min(coupon.value, cart_total);
    } else if (coupon.type === 'FREE_SHIPPING') {
      free_shipping = true;
    }

    discount_amount = Math.round(discount_amount * 100) / 100;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.type,
      discount_value: coupon.value,
      discount_amount,
      free_shipping,
      description: coupon.description ?? `${coupon.value}${coupon.type === 'PERCENTAGE' ? '%' : '₹'} off`,
    });
  } catch (error: any) {
    console.error('[/api/v1/coupons/verify] Error:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error.' }, { status: 500 });
  }
}

// GET — partner can do a quick status check
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.PROMOTIONS_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code param required' }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    select: { code: true, type: true, value: true, status: true, expiresAt: true, usedCount: true, usageLimit: true },
  });
  if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(coupon);
}
