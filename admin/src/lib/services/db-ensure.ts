import { prisma } from '@/lib/prisma';

export async function ensureCampaignTablesExist() {
  try {
    await prisma.indianHoliday.count();
  } catch (err: any) {
    if (
      err?.code === 'P2021' ||
      String(err).includes('TableDoesNotExist') ||
      String(err).includes('does not exist')
    ) {
      console.log('[DB Auto-Init] Table missing. Auto-creating campaign tables via SQL DDL...');
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
              CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
          EXCEPTION WHEN duplicate_object THEN null; END $$;

          DO $$ BEGIN
              CREATE TYPE "CampaignStage" AS ENUM ('STAGE_1_DISPATCH', 'STAGE_2_EXPIRY_WARNING');
          EXCEPTION WHEN duplicate_object THEN null; END $$;

          CREATE TABLE IF NOT EXISTS "indian_holidays" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL,
            "date" TIMESTAMP(3) NOT NULL,
            "isMajor" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "campaigns" (
            "id" TEXT PRIMARY KEY,
            "holidayId" TEXT REFERENCES "indian_holidays"("id") ON DELETE SET NULL,
            "name" TEXT NOT NULL,
            "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
            "stage" "CampaignStage" NOT NULL DEFAULT 'STAGE_1_DISPATCH',
            "segmentationRules" JSONB NOT NULL DEFAULT '{}'::jsonb,
            "metrics" JSONB NOT NULL DEFAULT '{}'::jsonb,
            "emailSubject" TEXT,
            "emailBodyHtml" TEXT,
            "whatsappText" TEXT,
            "recommendedProducts" JSONB,
            "scheduledAt" TIMESTAMP(3),
            "sentAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "campaign_templates" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL,
            "htmlLayout" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "dynamic_coupons" (
            "id" TEXT PRIMARY KEY,
            "campaignId" TEXT NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
            "customerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
            "uniqueCode" TEXT UNIQUE NOT NULL,
            "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 15,
            "isRedeemed" BOOLEAN NOT NULL DEFAULT false,
            "redeemedAt" TIMESTAMP(3),
            "expiresAt" TIMESTAMP(3) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('[DB Auto-Init] Campaign tables initialized successfully!');
      } catch (sqlErr) {
        console.error('[DB Auto-Init] SQL initialization error:', sqlErr);
      }
    }
  }
}
