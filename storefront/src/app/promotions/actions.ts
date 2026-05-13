'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type CouponValidationResult =
  | { valid: true; discountAmount: number; freeShipping: boolean; couponId: string; code: string; description: string }
  | { valid: false; error: string };

// ─────────────────────────────────────────────────────────────
// VALIDATE COUPON — called client-side before/during checkout
// ─────────────────────────────────────────────────────────────

export async function validateCoupon(
  code: string,
  cartSubtotal: number,
  userId?: string | null
): Promise<CouponValidationResult> {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

    if (!coupon) return { valid: false, error: 'This promo code does not exist.' };

    // Status check
    if (coupon.status === 'PAUSED') return { valid: false, error: 'This code is currently paused.' };
    if (coupon.status === 'EXHAUSTED') return { valid: false, error: 'This code has been fully redeemed.' };
    if (coupon.status === 'EXPIRED') return { valid: false, error: 'This code has expired.' };

    // Date bounds check
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt)
      return { valid: false, error: `This code is valid from ${coupon.startsAt.toLocaleDateString('en-IN')}.` };
    if (coupon.expiresAt && now > coupon.expiresAt)
      return { valid: false, error: 'This code has expired.' };

    // Global usage limit check
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
      return { valid: false, error: 'This code has reached its usage limit.' };

    // Per-user usage limit check
    if (userId && coupon.usageLimitPerUser !== null) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsageCount >= (coupon.usageLimitPerUser ?? 1))
        return { valid: false, error: 'You have already used this promo code.' };
    }

    // Minimum order amount check
    if (coupon.minOrderAmount && cartSubtotal < coupon.minOrderAmount)
      return {
        valid: false,
        error: `A minimum order of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} is required for this code.`,
      };

    // Calculate discount
    let discountAmount = 0;
    let freeShipping = false;

    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (coupon.value / 100) * cartSubtotal;
      if (coupon.maxDiscountCap) discountAmount = Math.min(discountAmount, coupon.maxDiscountCap);
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(coupon.value, cartSubtotal); // Can't discount more than cart total
    } else if (coupon.type === 'FREE_SHIPPING') {
      freeShipping = true;
      discountAmount = 0; // Shipping discount applied separately
    }

    discountAmount = Math.round(discountAmount * 100) / 100; // Round to 2 decimal places

    return {
      valid: true,
      discountAmount,
      freeShipping,
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description ?? `${coupon.value}${coupon.type === 'PERCENTAGE' ? '%' : '₹'} off`,
    };
  } catch (error: any) {
    console.error('[validateCoupon] Error:', error);
    return { valid: false, error: 'Unable to validate coupon. Please try again.' };
  }
}

// ─────────────────────────────────────────────────────────────
// APPLY COUPON TO ORDER — called after successful payment
// ─────────────────────────────────────────────────────────────

export async function applyCouponToOrder(
  orderId: string,
  couponId: string,
  discountAmount: number,
  userId?: string | null
): Promise<void> {
  await prisma.$transaction([
    // Record the usage
    prisma.couponUsage.create({
      data: { couponId, orderId, discountAmount, userId: userId ?? null },
    }),
    // Increment the global usage counter
    prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    }),
  ]);

  // Auto-set status to EXHAUSTED if limit reached
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (coupon?.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    await prisma.coupon.update({ where: { id: couponId }, data: { status: 'EXHAUSTED' } });
  }
}

// ─────────────────────────────────────────────────────────────
// RECORD AFFILIATE CONVERSION — called after successful payment
// ─────────────────────────────────────────────────────────────

export async function recordAffiliateConversion(
  orderId: string,
  affiliateCode: string,
  orderRevenue: number
): Promise<void> {
  try {
    const affiliate = await prisma.affiliate.findUnique({ where: { affiliateCode } });
    if (!affiliate || affiliate.status !== 'ACTIVE') return;

    const commissionAmount = Math.round(((affiliate.commissionRate / 100) * orderRevenue) * 100) / 100;

    await prisma.$transaction([
      prisma.affiliateConversion.create({
        data: { affiliateId: affiliate.id, orderId, orderRevenue, commissionAmount },
      }),
      prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          totalRevenue: { increment: orderRevenue },
          totalCommission: { increment: commissionAmount },
        },
      }),
    ]);
  } catch (error: any) {
    console.error('[recordAffiliateConversion] Error:', error);
    // Non-fatal — do not throw
  }
}

// ─────────────────────────────────────────────────────────────
// GET ACTIVE COUPON (server component use)
// ─────────────────────────────────────────────────────────────

export async function getCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, code: true, type: true, value: true, status: true, description: true },
  });
}

// ─────────────────────────────────────────────────────────────
// ADMIN: Create Coupon
// ─────────────────────────────────────────────────────────────

export async function adminCreateCoupon(data: {
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: number;
  maxDiscountCap?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt?: Date;
  expiresAt?: Date;
  source?: string;
  affiliateId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  return prisma.coupon.create({
    data: {
      ...data,
      code: data.code.trim().toUpperCase(),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// ADMIN: Update Coupon Status
// ─────────────────────────────────────────────────────────────

export async function adminUpdateCouponStatus(
  couponId: string,
  status: 'ACTIVE' | 'PAUSED'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  return prisma.coupon.update({ where: { id: couponId }, data: { status } });
}

// ─────────────────────────────────────────────────────────────
// ADMIN: Bulk generate unique one-time-use coupon codes
// ─────────────────────────────────────────────────────────────

export async function adminBulkGenerateCoupons(data: {
  count: number;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  expiresAt?: Date;
  source?: string;
  affiliateId?: string;
  minOrderAmount?: number;
  prefix?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const prefix = (data.prefix ?? 'JNS').toUpperCase();
  const codes: string[] = [];
  const created = [];

  // Generate unique codes
  while (codes.length < data.count) {
    const code = `${prefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (!codes.includes(code)) codes.push(code);
  }

  for (const code of codes) {
    try {
      const coupon = await prisma.coupon.create({
        data: {
          code,
          type: data.type,
          value: data.value,
          usageLimit: 1,
          usageLimitPerUser: 1,
          expiresAt: data.expiresAt,
          source: data.source,
          affiliateId: data.affiliateId,
          minOrderAmount: data.minOrderAmount,
        },
      });
      created.push(coupon.code);
    } catch {
      // Skip duplicates that somehow collide
    }
  }

  return created;
}

// ─────────────────────────────────────────────────────────────
// ADMIN: Create Affiliate
// ─────────────────────────────────────────────────────────────

export async function adminCreateAffiliate(data: {
  name: string;
  email: string;
  phone?: string;
  affiliateCode: string;
  commissionRate?: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  return prisma.affiliate.create({
    data: {
      ...data,
      affiliateCode: data.affiliateCode.trim().toUpperCase(),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// ADMIN: List Coupons with usage stats
// ─────────────────────────────────────────────────────────────

export async function adminListCoupons(filters?: { status?: string; source?: string }) {
  return prisma.coupon.findMany({
    where: {
      ...(filters?.status ? { status: filters.status as any } : {}),
      ...(filters?.source ? { source: filters.source } : {}),
    },
    include: {
      _count: { select: { usages: true } },
      affiliate: { select: { name: true, affiliateCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// ADMIN: List Affiliates
// ─────────────────────────────────────────────────────────────

export async function adminListAffiliates() {
  return prisma.affiliate.findMany({
    include: {
      _count: { select: { conversions: true } },
      coupons: { select: { code: true, status: true } },
    },
    orderBy: { totalRevenue: 'desc' },
  });
}
