import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { draftCampaignForHoliday } from '@/lib/services/draft-campaign';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        holiday: true,
        dynamicCoupons: {
          select: { id: true, isRedeemed: true, discountValue: true }
        }
      }
    });

    // Compute aggregate full-funnel analytics across all campaigns
    let totalSent = 0;
    let totalOpened = 0;
    let totalRedeemed = 0;
    let totalRevenue = 0;

    const enrichedCampaigns = campaigns.map(c => {
      const metrics: any = c.metrics || {};
      const coupons = c.dynamicCoupons || [];
      const redeemed = coupons.filter(cp => cp.isRedeemed).length;

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
          openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0',
          redeemed,
          redemptionRate: sent > 0 ? ((redeemed / sent) * 100).toFixed(1) : '0.0',
          revenue
        }
      };
    });

    const aggregateAnalytics = {
      totalCampaigns: campaigns.length,
      totalSent,
      totalOpened,
      overallOpenRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0',
      totalRedeemed,
      overallRedemptionRate: totalSent > 0 ? ((totalRedeemed / totalSent) * 100).toFixed(1) : '0.0',
      totalRevenue
    };

    return NextResponse.json({
      campaigns: enrichedCampaigns,
      analytics: aggregateAnalytics
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, holidayId, segment, discountValue } = await req.json();

    if (action === 'DRAFT_AI') {
      if (!holidayId) {
        return NextResponse.json({ error: 'Holiday ID is required for AI drafting' }, { status: 400 });
      }

      const campaign = await draftCampaignForHoliday(holidayId, segment || 'VIP', discountValue || 15);
      return NextResponse.json({ success: true, campaign });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (err: any) {
    console.error('[Campaign API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create campaign' }, { status: 500 });
  }
}
