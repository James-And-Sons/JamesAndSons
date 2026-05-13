'use server';

// ─────────────────────────────────────────────────────────────
// Admin-facing server actions for the Promotions portal
// These import from the core promotions engine in the storefront
// but are exposed here to avoid duplication.
//
// NOTE: The admin portal shares the same Prisma DB.
// ─────────────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma';

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
  return prisma.coupon.create({
    data: {
      ...data,
      code: data.code.trim().toUpperCase(),
    },
  });
}

export async function adminUpdateCouponStatus(couponId: string, status: 'ACTIVE' | 'PAUSED') {
  return prisma.coupon.update({ where: { id: couponId }, data: { status } });
}

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
  const pfx = (data.prefix ?? 'JNS').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const codes: string[] = [];
  const created: string[] = [];

  while (codes.length < data.count) {
    const code = `${pfx}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (!codes.includes(code)) codes.push(code);
  }

  for (const code of codes) {
    try {
      await prisma.coupon.create({
        data: {
          code,
          type: data.type,
          value: Number(data.value),
          usageLimit: 1,
          usageLimitPerUser: 1,
          expiresAt: data.expiresAt,
          source: data.source,
          affiliateId: data.affiliateId || undefined,
          minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : undefined,
        },
      });
      created.push(code);
    } catch {
      // skip collisions
    }
  }

  return created;
}

export async function adminCreateAffiliate(data: {
  name: string;
  email: string;
  phone?: string;
  affiliateCode: string;
  commissionRate?: number;
  notes?: string;
}) {
  return prisma.affiliate.create({
    data: { ...data, affiliateCode: data.affiliateCode.trim().toUpperCase() },
  });
}

export async function adminUpdateAffiliateStatus(affiliateId: string, status: 'ACTIVE' | 'SUSPENDED') {
  return prisma.affiliate.update({ where: { id: affiliateId }, data: { status } });
}

export async function adminMarkConversionsPaid(conversionIds: string[]) {
  return prisma.affiliateConversion.updateMany({
    where: { id: { in: conversionIds } },
    data: { isPaid: true, paidAt: new Date() },
  });
}

export async function adminListCoupons() {
  return prisma.coupon.findMany({
    include: { _count: { select: { usages: true } }, affiliate: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function adminGetCouponDetail(id: string) {
  return prisma.coupon.findUnique({
    where: { id },
    include: {
      usages: {
        include: { order: { select: { orderNumber: true, createdAt: true, totalAmount: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      affiliate: true,
    },
  });
}

export async function adminListAffiliates() {
  return prisma.affiliate.findMany({
    include: {
      _count: { select: { conversions: true } },
      coupons: { select: { code: true, status: true } },
    },
    orderBy: { totalRevenue: 'desc' },
  });
}

export async function adminGetAffiliateDetail(id: string) {
  return prisma.affiliate.findUnique({
    where: { id },
    include: {
      conversions: {
        include: { order: { select: { orderNumber: true, createdAt: true, totalAmount: true } } },
        orderBy: { createdAt: 'desc' },
      },
      coupons: true,
    },
  });
}
