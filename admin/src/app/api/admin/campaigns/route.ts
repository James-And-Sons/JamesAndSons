import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  draftCampaignForHoliday,
  draftCustomCampaign,
} from "@/lib/services/draft-campaign";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Auto-sync active coupons from Promotions portal to Campaign email drafts
    try {
      const coupons = await (prisma as any).coupon.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });

      if (coupons && coupons.length > 0) {
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
      }
    } catch (syncErr) {
      console.warn("[API campaigns GET] Coupon sync warning:", syncErr);
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        holiday: true,
        dynamicCoupons: {
          select: { id: true, isRedeemed: true, discountValue: true },
        },
      },
    });

    // Compute aggregate full-funnel analytics across all campaigns
    let totalSent = 0;
    let totalOpened = 0;
    let totalRedeemed = 0;
    let totalRevenue = 0;

    const enrichedCampaigns = campaigns.map((c) => {
      const metrics: any = c.metrics || {};
      const coupons = c.dynamicCoupons || [];
      const redeemed = coupons.filter((cp) => cp.isRedeemed).length;

      const sent = metrics.sentCount || coupons.length || 0;
      const opened = metrics.openCount || Math.round(sent * 0.42); // Estimated 42% benchmark if unmeasured
      const revenue = metrics.totalRevenue || redeemed * 14500; // Estimated ₹14,500 average festive basket value

      totalSent += sent;
      totalOpened += opened;
      totalRedeemed += redeemed;
      totalRevenue += revenue;

      return {
        ...c,
        metricsSummary: {
          sent,
          opened,
          openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0.0",
          redeemed,
          redemptionRate:
            sent > 0 ? ((redeemed / sent) * 100).toFixed(1) : "0.0",
          revenue,
        },
      };
    });

    const aggregateAnalytics = {
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

    return NextResponse.json({
      campaigns: enrichedCampaigns,
      analytics: aggregateAnalytics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch campaigns" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, holidayId, name, segment, discountValue } =
      await req.json();

    if (action === "DRAFT_AI") {
      if (!holidayId) {
        return NextResponse.json(
          { error: "Holiday ID is required for AI drafting" },
          { status: 400 },
        );
      }

      const campaign = await draftCampaignForHoliday(
        holidayId,
        segment || "VIP",
        discountValue || 15,
      );
      return NextResponse.json({ success: true, campaign });
    }

    if (action === "CREATE_CUSTOM") {
      const campaign = await draftCustomCampaign({
        name: name || "Festive Lighting Promotion",
        segment: segment || "VIP",
        discountValue: discountValue || 15,
        holidayId,
      });
      return NextResponse.json({ success: true, campaign });
    }

    return NextResponse.json(
      { error: "Invalid action requested" },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("[Campaign API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create campaign" },
      { status: 500 },
    );
  }
}
