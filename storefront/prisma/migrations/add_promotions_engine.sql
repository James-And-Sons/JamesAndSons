-- ─────────────────────────────────────────────────────────────
-- PROMOTIONS ENGINE MIGRATION
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. New Enums
DO $$ BEGIN
  CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'EXHAUSTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AffiliateStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Extend Order table
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "couponCode"     TEXT,
  ADD COLUMN IF NOT EXISTS "affiliateCode"  TEXT;

-- Remove old DiscountCode relation from Order if it exists
ALTER TABLE "Order" DROP COLUMN IF EXISTS "discountCodeId";
DROP TABLE IF EXISTS "DiscountCode";

-- 3. Affiliate table
CREATE TABLE IF NOT EXISTS "Affiliate" (
  "id"              TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"            TEXT NOT NULL,
  "email"           TEXT NOT NULL UNIQUE,
  "phone"           TEXT,
  "affiliateCode"   TEXT NOT NULL UNIQUE,
  "commissionRate"  DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  "status"          "AffiliateStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes"           TEXT,
  "totalRevenue"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Coupon table
CREATE TABLE IF NOT EXISTS "Coupon" (
  "id"                TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "code"              TEXT NOT NULL UNIQUE,
  "description"       TEXT,
  "type"              "CouponType" NOT NULL DEFAULT 'PERCENTAGE',
  "value"             DOUBLE PRECISION NOT NULL,
  "status"            "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
  "minOrderAmount"    DOUBLE PRECISION,
  "maxDiscountCap"    DOUBLE PRECISION,
  "usageLimit"        INTEGER,
  "usageLimitPerUser" INTEGER DEFAULT 1,
  "usedCount"         INTEGER NOT NULL DEFAULT 0,
  "startsAt"          TIMESTAMP(3),
  "expiresAt"         TIMESTAMP(3),
  "source"            TEXT,
  "affiliateId"       TEXT REFERENCES "Affiliate"("id"),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. CouponUsage table
CREATE TABLE IF NOT EXISTS "CouponUsage" (
  "id"             TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "couponId"       TEXT NOT NULL REFERENCES "Coupon"("id"),
  "userId"         TEXT,
  "orderId"        TEXT NOT NULL UNIQUE REFERENCES "Order"("id"),
  "discountAmount" DOUBLE PRECISION NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. AffiliateConversion table
CREATE TABLE IF NOT EXISTS "AffiliateConversion" (
  "id"               TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "affiliateId"      TEXT NOT NULL REFERENCES "Affiliate"("id"),
  "orderId"          TEXT NOT NULL UNIQUE REFERENCES "Order"("id"),
  "orderRevenue"     DOUBLE PRECISION NOT NULL,
  "commissionAmount" DOUBLE PRECISION NOT NULL,
  "isPaid"           BOOLEAN NOT NULL DEFAULT false,
  "paidAt"           TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Indexes for common queries
CREATE INDEX IF NOT EXISTS "Coupon_status_idx" ON "Coupon"("status");
CREATE INDEX IF NOT EXISTS "Coupon_source_idx" ON "Coupon"("source");
CREATE INDEX IF NOT EXISTS "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
CREATE INDEX IF NOT EXISTS "CouponUsage_userId_idx" ON "CouponUsage"("userId");
CREATE INDEX IF NOT EXISTS "AffiliateConversion_affiliateId_idx" ON "AffiliateConversion"("affiliateId");
CREATE INDEX IF NOT EXISTS "AffiliateConversion_isPaid_idx" ON "AffiliateConversion"("isPaid");
