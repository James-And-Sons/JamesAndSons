import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import PromotionsManagerClient from "./PromotionsManagerClient";

export const dynamic = "force-dynamic";

async function getCoupons() {
  const p = prisma as any;
  if (!p.coupon) {
    console.error("Prisma Coupon model is not initialized");
    return [];
  }
  return p.coupon.findMany({
    include: {
      affiliate: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getAffiliates() {
  const p = prisma as any;
  if (!p.affiliate) {
    console.error("Prisma Affiliate model is not initialized");
    return [];
  }
  return p.affiliate.findMany({
    select: { id: true, name: true, affiliateCode: true },
    where: { status: "ACTIVE" },
  });
}

async function getCouponOrderStats() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        couponCode: { not: null },
        status: { notIn: ["CANCELLED"] },
      },
      select: {
        discountAmount: true,
        totalAmount: true,
      },
    });

    const totalDiscountSaved = orders.reduce(
      (sum, o) => sum + (o.discountAmount || 0),
      0,
    );
    const totalRevenueGenerated = orders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0,
    );

    return {
      totalDiscountSaved,
      totalRevenueGenerated,
      orderCount: orders.length,
    };
  } catch (err) {
    console.error("Failed to query coupon order stats:", err);
    return {
      totalDiscountSaved: 0,
      totalRevenueGenerated: 0,
      orderCount: 0,
    };
  }
}

export default async function PromotionsPage() {
  await requireAdmin();
  const coupons = await getCoupons();
  const affiliates = await getAffiliates();
  const orderStats = await getCouponOrderStats();

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
      orderStats={orderStats}
    />
  );
}
