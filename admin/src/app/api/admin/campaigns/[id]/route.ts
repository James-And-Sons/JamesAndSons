import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatchCampaignStage1, dispatchCampaignStage2, unscheduleCampaign, deleteCampaign } from '@/lib/services/draft-campaign';

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
        name: body.name,
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

    if (action === 'REGENERATE_AI') {
      const { generateAICampaignCopy } = await import('@/lib/services/ai-campaign');
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: { holiday: true }
      });
      if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

      const reqBody = await req.json().catch(() => ({}));
      const segment = reqBody.segment || (campaign.segmentationRules as any)?.segment || 'VIP';
      const discountValue = reqBody.discountValue || (campaign.segmentationRules as any)?.discountValue || 15;
      const holidayName = campaign.holiday?.name || campaign.name;

      const aiResult = await generateAICampaignCopy({ holidayName, targetSegment: segment, discountValue });

      return NextResponse.json({
        success: true,
        aiResult: {
          emailSubject: aiResult.email_subject,
          emailBodyHtml: aiResult.email_body_html,
        }
      });
    }

    if (action === 'UNSCHEDULE' || action === 'REVERT_TO_DRAFT') {
      const result = await unscheduleCampaign(id);
      return NextResponse.json({ success: true, campaign: result });
    }

    return NextResponse.json({ error: 'Invalid campaign action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Campaign Action API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to execute campaign action' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteCampaign(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete campaign' }, { status: 500 });
  }
}
