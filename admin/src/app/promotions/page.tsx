import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import PromotionsManagerClient from './PromotionsManagerClient';

export const dynamic = 'force-dynamic';

async function getCoupons() {
  const p = prisma as any;
  if (!p.coupon) {
    console.error('Prisma Coupon model is not initialized');
    return [];
  }
  return p.coupon.findMany({
    include: {
      affiliate: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getAffiliates() {
  const p = prisma as any;
  if (!p.affiliate) {
    console.error('Prisma Affiliate model is not initialized');
    return [];
  }
  return p.affiliate.findMany({
    select: { id: true, name: true, affiliateCode: true },
    where: { status: 'ACTIVE' },
  });
}

export default async function PromotionsPage() {
  await requireAdmin();
  const coupons = await getCoupons();
  const affiliates = await getAffiliates();

  // Map Date objects to ISO string dates to make them serializable for the client component
  const serializedCoupons = coupons.map((c: any) => ({
    ...c,
    startsAt: c.startsAt ? c.startsAt.toISOString() : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <PromotionsManagerClient
      initialCoupons={serializedCoupons as any}
      affiliates={affiliates as any}
    />
  );
}
