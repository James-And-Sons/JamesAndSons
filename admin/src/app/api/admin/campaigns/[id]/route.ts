import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatchCampaignStage1, dispatchCampaignStage2 } from '@/lib/services/draft-campaign';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        holiday: true,
        dynamicCoupons: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { id: true, firstName: true, lastName: true, email: true } } }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        emailSubject: body.emailSubject,
        emailBodyHtml: body.emailBodyHtml,
        whatsappText: body.whatsappText,
        segmentationRules: body.segmentationRules,
        recommendedProducts: body.recommendedProducts,
        status: body.status,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined
      }
    });

    return NextResponse.json({ campaign: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update campaign' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action } = await req.json();

    if (action === 'DISPATCH_STAGE_1' || action === 'APPROVE_AND_SCHEDULE') {
      const result = await dispatchCampaignStage1(id);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'DISPATCH_STAGE_2') {
      const result = await dispatchCampaignStage2(id);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid campaign action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Campaign Action API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to execute campaign action' }, { status: 500 });
  }
}
