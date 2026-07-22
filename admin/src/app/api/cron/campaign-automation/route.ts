import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { draftCampaignForHoliday, dispatchCampaignStage2 } from '@/lib/services/draft-campaign';

export const dynamic = 'force-dynamic';

// Seed default Indian Major Holidays for calendar automation if database is empty
async function seedDefaultIndianHolidays() {
  const count = await prisma.indianHoliday.count();
  if (count > 0) return;

  const currentYear = new Date().getFullYear();
  const defaultHolidays = [
    { name: 'Raksha Bandhan', date: new Date(`${currentYear}-08-28T00:00:00Z`), isMajor: true },
    { name: 'Ganesh Chaturthi', date: new Date(`${currentYear}-09-17T00:00:00Z`), isMajor: true },
    { name: 'Karwa Chauth', date: new Date(`${currentYear}-10-20T00:00:00Z`), isMajor: true },
    { name: 'Dhanteras', date: new Date(`${currentYear}-11-08T00:00:00Z`), isMajor: true },
    { name: 'Diwali', date: new Date(`${currentYear}-11-10T00:00:00Z`), isMajor: true },
    { name: 'Durga Puja', date: new Date(`${currentYear}-10-12T00:00:00Z`), isMajor: true },
    { name: 'Christmas', date: new Date(`${currentYear}-12-25T00:00:00Z`), isMajor: true },
    { name: 'New Year Eve', date: new Date(`${currentYear + 1}-01-01T00:00:00Z`), isMajor: true },
    { name: 'Holi', date: new Date(`${currentYear + 1}-03-25T00:00:00Z`), isMajor: true }
  ];

  await prisma.indianHoliday.createMany({
    data: defaultHolidays
  });
}

export async function GET(req: NextRequest) {
  try {
    await seedDefaultIndianHolidays();

    const now = new Date();
    const results: any[] = [];

    // --- 1. THE 20-DAY TRIGGER CHECK ---
    // Look for major Indian holidays that are 19 to 21 days from today
    const in19Days = new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000);
    const in21Days = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

    const upcomingMajorHolidays = await prisma.indianHoliday.findMany({
      where: {
        isMajor: true,
        date: {
          gte: in19Days,
          lte: in21Days
        }
      }
    });

    for (const holiday of upcomingMajorHolidays) {
      // Check if a campaign has already been drafted/created for this holiday
      const existing = await prisma.campaign.findFirst({
        where: { holidayId: holiday.id }
      });

      if (!existing) {
        const campaign = await draftCampaignForHoliday(holiday.id, 'VIP', 15);
        results.push({
          action: '20_DAY_TRIGGER_DRAFTED',
          holiday: holiday.name,
          campaignId: campaign.id,
          name: campaign.name
        });
      }
    }

    // --- 2. STAGE 2 (DAY -2) EXPIRY WARNING TRIGGER CHECK ---
    // Find active campaigns whose holiday date is 1 to 3 days away
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const activeCampaignsNearExpiry = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        stage: 'STAGE_1_DISPATCH',
        holiday: {
          date: {
            gte: in1Day,
            lte: in3Days
          }
        }
      }
    });

    for (const campaign of activeCampaignsNearExpiry) {
      const res = await dispatchCampaignStage2(campaign.id);
      results.push({
        action: 'STAGE_2_EXPIRY_WARNING_DISPATCHED',
        campaignId: campaign.id,
        unredeemedCount: res.unredeemedCount
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      triggeredActions: results.length,
      details: results
    });
  } catch (err: any) {
    console.error('[Campaign Automation Cron] Error executing automation:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to execute campaign automation cron.' },
      { status: 500 }
    );
  }
}
