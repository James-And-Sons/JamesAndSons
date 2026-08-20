import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import CampaignManagerClient from "./CampaignManagerClient";
import { ensureCampaignTablesExist } from "@/lib/services/db-ensure";

export const dynamic = "force-dynamic";

async function seedHolidaysIfEmpty() {
  await ensureCampaignTablesExist();
  const count = await prisma.indianHoliday.count();
  if (count > 0) return;

  const currentYear = new Date().getFullYear();
  const defaultHolidays = [
    {
      name: "Raksha Bandhan",
      date: new Date(`${currentYear}-08-28T00:00:00Z`),
      isMajor: true,
    },
    {
      name: "Ganesh Chaturthi",
      date: new Date(`${currentYear}-09-17T00:00:00Z`),
      isMajor: true,
    },
    {
      name: "Durga Puja",
      date: new Date(`${currentYear}-10-12T00:00:00Z`),
      isMajor: true,
    },
    {
      name: "Karwa Chauth",
      date: new Date(`${currentYear}-10-20T00:00:00Z`),
      isMajor: true,
    },
    {
      name: "Dhanteras",
      date: new Date(`${currentYear}-11-08T00:00:00Z`),
      isMajor: true,
    },
    {
      name: "Diwali",
      date: new Date(`${currentYear}-11-10T00:00:00Z`),
      isMajor: true,
    },
    {
      name: "Christmas",
      date: new Date(`${currentYear}-12-25T00:00:00Z`),
      isMajor: true,
    },
    {
      name: "New Year Eve",
      date: new Date(`${currentYear + 1}-01-01T00:00:00Z`),
      isMajor: true,
    },
    {
      name: "Holi",
      date: new Date(`${currentYear + 1}-03-25T00:00:00Z`),
      isMajor: true,
    },
  ];

  await prisma.indianHoliday.createMany({
    data: defaultHolidays,
  });
}

async function autoSyncCouponsToCampaigns() {
  try {
    const coupons = await (prisma as any).coupon.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!coupons || coupons.length === 0) return;

    const existingCampaigns = await (prisma as any).campaign.findMany({
      select: { name: true, segmentationRules: true },
    });

    const existingPromoCodes = new Set<string>();
    for (const c of existingCampaigns) {
      if (c.segmentationRules?.promoCode) {
        existingPromoCodes.add(
          String(c.segmentationRules.promoCode).toUpperCase(),
        );
      }
      const match = c.name.match(/\[AI Synced\]\s*([A-Z0-9_]+)/i);
      if (match?.[1]) {
        existingPromoCodes.add(match[1].toUpperCase());
      }
    }

    const { AICampaignSyncService } =
      await import("@/lib/services/aiCampaignSyncService");

    for (const coupon of coupons) {
      if (!existingPromoCodes.has(coupon.code.toUpperCase())) {
        await AICampaignSyncService.syncPromotionToCampaign(coupon);
      }
    }
  } catch (err) {
    console.warn("[autoSyncCouponsToCampaigns] Auto sync warning:", err);
  }
}

export default async function CampaignsPage() {
  await requireAdmin();
  await seedHolidaysIfEmpty();
  await autoSyncCouponsToCampaigns();

  try {
    const { adminSanitizeExistingCampaigns } =
      await import("@/app/promotions/server-actions");
    await adminSanitizeExistingCampaigns();
  } catch {
    // silent
  }

  const now = new Date();

  // Fetch holidays with remaining days
  const holidaysRaw = await prisma.indianHoliday.findMany({
    orderBy: { date: "asc" },
    include: {
      campaigns: {
        select: { id: true, name: true, status: true, stage: true },
      },
    },
  });

  const holidays = holidaysRaw.map((h) => {
    const diffMs = new Date(h.date).getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      ...h,
      date: h.date.toISOString(),
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
      daysRemaining,
    };
  });

  // Fetch campaigns
  const campaignsRaw = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      holiday: true,
      dynamicCoupons: {
        select: { id: true, isRedeemed: true, discountValue: true },
      },
    },
  });

  let totalSent = 0;
  let totalOpened = 0;
  let totalRedeemed = 0;
  let totalRevenue = 0;

  const campaigns = campaignsRaw.map((c) => {
    const metrics: any = c.metrics || {};
    const coupons = c.dynamicCoupons || [];
    const redeemed = coupons.filter((cp) => cp.isRedeemed).length;

    const sent = metrics.sentCount || coupons.length || 0;
    const opened = metrics.openCount || Math.round(sent * 0.42);
    const revenue = metrics.totalRevenue || redeemed * 14500;

    totalSent += sent;
    totalOpened += opened;
    totalRedeemed += redeemed;
    totalRevenue += revenue;

    return {
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
      sentAt: c.sentAt ? c.sentAt.toISOString() : null,
      holiday: c.holiday
        ? {
            ...c.holiday,
            date: c.holiday.date.toISOString(),
            createdAt: c.holiday.createdAt.toISOString(),
            updatedAt: c.holiday.updatedAt.toISOString(),
          }
        : null,
      metricsSummary: {
        sent,
        opened,
        openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0.0",
        redeemed,
        redemptionRate: sent > 0 ? ((redeemed / sent) * 100).toFixed(1) : "0.0",
        revenue,
      },
    };
  });

  // Fetch sample catalog products for swap item selector
  const catalogProductsRaw = await prisma.product.findMany({
    take: 20,
    select: {
      id: true,
      name: true,
      sku: true,
      d2cPrice: true,
      mrp: true,
      images: true,
    },
  });

  const catalogProducts = catalogProductsRaw.map((p) => ({
    ...p,
  }));

  const analytics = {
    totalCampaigns: campaigns.length,
    totalSent,
    totalOpened,
    overallOpenRate:
      totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0",
    totalRedeemed,
    overallRedemptionRate:
      totalSent > 0 ? ((totalRedeemed / totalSent) * 100).toFixed(1) : "0.0",
    totalRevenue,
  };

  return (
    <CampaignManagerClient
      initialHolidays={holidays as any}
      initialCampaigns={campaigns as any}
      initialAnalytics={analytics}
      initialCatalogProducts={catalogProducts}
    />
  );
}
