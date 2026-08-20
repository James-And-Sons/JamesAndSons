"use server";

// ─────────────────────────────────────────────────────────────
// Admin-facing server actions for the Promotions portal
// These import from the core promotions engine in the storefront
// but are exposed here to avoid duplication.
//
// NOTE: The admin portal shares the same Prisma DB.
// ─────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";

export async function sanitizeRootPromotionText(
  input?: string,
): Promise<string> {
  if (!input) return "";

  let clean = input.trim();

  // 1. Fix common spelling errors
  clean = clean
    .replace(/Independance/gi, "Independence")
    .replace(/Valantine/gi, "Valentine")
    .replace(/Diwaly/gi, "Diwali")
    .replace(/Dhanterass/gi, "Dhanteras")
    .replace(/Chritmas/gi, "Christmas")
    .replace(/Ganesh chaturthi/gi, "Ganesh Chaturthi")
    .replace(/Durga puja/gi, "Durga Puja");

  // 2. Strip conversational prompt junk & informal phrasing
  clean = clean
    .replace(/is coming up.*$/gi, "")
    .replace(/let's plan.*$/gi, "")
    .replace(/plan something.*$/gi, "")
    .replace(/create an? (offer|promotion|coupon).*$/gi, "")
    .replace(/can we do.*$/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "";

  // 3. Ensure proper Title Case for short descriptions
  if (clean.length < 50 && !clean.includes(".")) {
    clean = clean
      .split(" ")
      .map((word) => {
        if (/^(and|of|the|for|in|on|at|to|a|an|with|or)$/i.test(word))
          return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean;
}

export async function adminCreateCoupon(data: {
  code: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  minOrderAmount?: number;
  maxDiscountCap?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt?: Date;
  expiresAt?: Date;
  source?: string;
  affiliateId?: string;
}) {
  const coupon = await (prisma as any).coupon.create({
    data: {
      ...data,
      code: data.code.trim().toUpperCase(),
      description: await sanitizeRootPromotionText(data.description),
    },
  });

  // Autonomously construct and sync Email Marketing Campaign
  try {
    const { AICampaignSyncService } =
      await import("@/lib/services/aiCampaignSyncService");
    await AICampaignSyncService.syncPromotionToCampaign(coupon);
  } catch (err) {
    console.warn("[adminCreateCoupon] Auto campaign sync warning:", err);
  }

  return coupon;
}

export async function adminUpdateCouponStatus(
  couponId: string,
  status: "ACTIVE" | "PAUSED",
) {
  return (prisma as any).coupon.update({
    where: { id: couponId },
    data: { status },
  });
}

export async function adminBulkGenerateCoupons(data: {
  count: number;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  expiresAt?: Date;
  source?: string;
  affiliateId?: string;
  minOrderAmount?: number;
  prefix?: string;
}) {
  const pfx = (data.prefix ?? "JNS")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  const codes: string[] = [];
  const created: string[] = [];

  while (codes.length < data.count) {
    const code = `${pfx}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (!codes.includes(code)) codes.push(code);
  }

  for (const code of codes) {
    try {
      await (prisma as any).coupon.create({
        data: {
          code,
          type: data.type,
          value: Number(data.value),
          usageLimit: 1,
          usageLimitPerUser: 1,
          expiresAt: data.expiresAt,
          source: data.source,
          affiliateId: data.affiliateId || undefined,
          minOrderAmount: data.minOrderAmount
            ? Number(data.minOrderAmount)
            : undefined,
        },
      });
      created.push(code);
    } catch {
      // skip collisions
    }
  }

  return created;
}

export async function adminCreateAffiliate(data: {
  name: string;
  email: string;
  phone?: string;
  affiliateCode: string;
  commissionRate?: number;
  notes?: string;
}) {
  return (prisma as any).affiliate.create({
    data: { ...data, affiliateCode: data.affiliateCode.trim().toUpperCase() },
  });
}

export async function adminUpdateAffiliateStatus(
  affiliateId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  return (prisma as any).affiliate.update({
    where: { id: affiliateId },
    data: { status },
  });
}

export async function adminUpdateAffiliate(
  affiliateId: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    affiliateCode: string;
    commissionRate?: number;
    notes?: string;
    status?: "ACTIVE" | "SUSPENDED";
  },
) {
  return (prisma as any).affiliate.update({
    where: { id: affiliateId },
    data: { ...data, affiliateCode: data.affiliateCode.trim().toUpperCase() },
  });
}

export async function adminDeleteAffiliate(affiliateId: string) {
  return (prisma as any).affiliate.delete({
    where: { id: affiliateId },
  });
}

export async function adminMarkConversionsPaid(conversionIds: string[]) {
  return (prisma as any).affiliateConversion.updateMany({
    where: { id: { in: conversionIds } },
    data: { isPaid: true, paidAt: new Date() },
  });
}

export async function adminListCoupons() {
  return (prisma as any).coupon.findMany({
    include: {
      _count: { select: { usages: true } },
      affiliate: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminGetCouponDetail(id: string) {
  return (prisma as any).coupon.findUnique({
    where: { id },
    include: {
      usages: {
        include: {
          order: {
            select: { orderNumber: true, createdAt: true, totalAmount: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      affiliate: true,
    },
  });
}

export async function adminListAffiliates() {
  return (prisma as any).affiliate.findMany({
    include: {
      _count: { select: { conversions: true } },
      coupons: { select: { code: true, status: true } },
    },
    orderBy: { totalRevenue: "desc" },
  });
}

export async function adminGetAffiliateDetail(id: string) {
  return (prisma as any).affiliate.findUnique({
    where: { id },
    include: {
      conversions: {
        include: {
          order: {
            select: { orderNumber: true, createdAt: true, totalAmount: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      coupons: true,
    },
  });
}

export async function adminDeleteCoupon(couponId: string) {
  return (prisma as any).coupon.delete({
    where: { id: couponId },
  });
}

export async function adminUpdateCoupon(
  couponId: string,
  data: Partial<{
    code: string;
    description?: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
    value: number;
    minOrderAmount?: number;
    maxDiscountCap?: number;
    usageLimit?: number;
    usageLimitPerUser?: number;
    startsAt?: Date;
    expiresAt?: Date;
    source?: string;
    affiliateId?: string;
    status?: "ACTIVE" | "PAUSED" | "EXPIRED" | "EXHAUSTED";
  }>,
) {
  return (prisma as any).coupon.update({
    where: { id: couponId },
    data: {
      ...data,
      code: data.code ? data.code.trim().toUpperCase() : undefined,
    },
  });
}

export async function adminLaunchPrebuiltPromotion(presetId: string) {
  const { PREBUILT_PROMOTION_PRESETS } = await import("./prebuilt-promotions");
  const { MultiChannelPromotionsService } =
    await import("@/lib/services/multiChannelPromotionsService");

  const preset = PREBUILT_PROMOTION_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error("Preset promotion not found");

  const code = `${preset.codePrefix}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const sourceFlags: string[] = [];
  if (preset.targetChannels.googleMerchant) sourceFlags.push("google_merchant");
  if (preset.targetChannels.metaCommerce) sourceFlags.push("meta");
  if (preset.targetChannels.emailBlast) sourceFlags.push("email");
  if (preset.targetChannels.webPush) sourceFlags.push("push");
  if (sourceFlags.length === 0) sourceFlags.push("internal");

  const expiresAt = preset.durationDays
    ? new Date(Date.now() + preset.durationDays * 24 * 60 * 60 * 1000)
    : undefined;

  const coupon = await (prisma as any).coupon.create({
    data: {
      code,
      description: await sanitizeRootPromotionText(preset.description),
      type: preset.type,
      value: preset.value,
      status: "ACTIVE",
      minOrderAmount: preset.minOrderAmount,
      maxDiscountCap: preset.maxDiscountCap,
      usageLimitPerUser: preset.usageLimitPerUser || 1,
      expiresAt,
      source: sourceFlags.join(","),
    },
  });

  const syncResult =
    await MultiChannelPromotionsService.syncAllChannels(coupon);

  // Autonomously construct and sync Email Marketing Campaign
  try {
    const { AICampaignSyncService } =
      await import("@/lib/services/aiCampaignSyncService");
    await AICampaignSyncService.syncPromotionToCampaign(coupon);
  } catch (err) {
    console.warn(
      "[adminLaunchPrebuiltPromotion] Auto campaign sync warning:",
      err,
    );
  }

  return {
    coupon,
    syncResult,
  };
}

export async function adminScanUpcomingEventsAI() {
  const { MonthlyEventsAIService } =
    await import("@/lib/services/monthlyEventsAIService");
  return MonthlyEventsAIService.scanAndGenerateMonthlyPromotions();
}

export async function adminSyncPromotionEmailCampaign(couponId: string) {
  const { AICampaignSyncService } =
    await import("@/lib/services/aiCampaignSyncService");

  const coupon = await (prisma as any).coupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon) throw new Error("Promotion coupon not found");

  return AICampaignSyncService.syncPromotionToCampaign(coupon);
}

export async function adminSyncGoogleMerchantPromotion(couponId: string) {
  const { GoogleMerchantPromotionsService } =
    await import("@/lib/services/googleMerchantPromotionsService");

  const coupon = await (prisma as any).coupon.findUnique({
    where: { id: couponId },
  });
  if (!coupon) throw new Error("Coupon not found");

  const result =
    await GoogleMerchantPromotionsService.syncPromotionToGoogleMerchant(coupon);

  const updatedSource = Array.from(
    new Set([...(coupon.source || "internal").split(","), "google_merchant"]),
  ).join(",");

  await (prisma as any).coupon.update({
    where: { id: couponId },
    data: { source: updatedSource },
  });

  return result;
}

export async function adminGenerateAIPromotion(
  prompt: string,
  answers?: Record<string, string>,
) {
  const { AIPromotionService } =
    await import("@/lib/services/aiPromotionService");
  return AIPromotionService.generatePromotionFromPrompt(prompt, answers);
}

export async function adminSanitizeExistingCampaigns() {
  try {
    const campaigns = await (prisma as any).campaign.findMany();
    let count = 0;

    for (const c of campaigns) {
      let updatedName = c.name.replace(/\[AI Synced\]\s*/g, "");
      let updatedSubject = c.emailSubject
        ? c.emailSubject.replace(/\[AI Synced\]\s*/g, "")
        : c.emailSubject;
      let updatedHtml = c.emailBodyHtml
        ? c.emailBodyHtml.replace(/\[AI Synced\]\s*/g, "")
        : c.emailBodyHtml;

      // Fix misformatted percentage vs fixed rupee discount in HTML/subject
      if (updatedSubject) {
        updatedSubject = updatedSubject.replace(
          /(\d+)\s*%\s*OFF/gi,
          (match: string, val: string) => {
            const num = parseInt(val, 10);
            return num > 100 ? `₹${num} OFF` : match;
          },
        );
      }

      if (updatedHtml) {
        updatedHtml = updatedHtml.replace(
          /(\d+)\s*%\s*OFF/gi,
          (match: string, val: string) => {
            const num = parseInt(val, 10);
            return num > 100 ? `₹${num} OFF` : match;
          },
        );
      }

      if (
        updatedName !== c.name ||
        updatedSubject !== c.emailSubject ||
        updatedHtml !== c.emailBodyHtml
      ) {
        await (prisma as any).campaign.update({
          where: { id: c.id },
          data: {
            name: updatedName,
            emailSubject: updatedSubject,
            emailBodyHtml: updatedHtml,
          },
        });
        count++;
      }
    }
    return { success: true, count };
  } catch (err: any) {
    console.warn("[adminSanitizeExistingCampaigns] Sanitation warning:", err);
    return { success: false, error: err.message };
  }
}

export async function adminTestValidateCoupon(
  code: string,
  cartSubtotal: number,
) {
  const cleanCode = code.trim().toUpperCase();
  const coupon = await (prisma as any).coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon) {
    return {
      valid: false,
      error: "This promo code does not exist in database.",
    };
  }

  if (coupon.status === "PAUSED") {
    return { valid: false, error: "This code is currently PAUSED." };
  }
  if (coupon.status === "EXHAUSTED") {
    return {
      valid: false,
      error: "This code has reached its maximum total usage limit.",
    };
  }
  if (coupon.status === "EXPIRED") {
    return { valid: false, error: "This code has expired." };
  }

  const now = new Date();
  if (coupon.startsAt && now < new Date(coupon.startsAt)) {
    return {
      valid: false,
      error: `Code will become active on ${new Date(coupon.startsAt).toLocaleDateString("en-IN")}.`,
    };
  }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
    return { valid: false, error: "This code has expired." };
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit > 0 &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return { valid: false, error: "Global usage limit reached." };
  }

  if (coupon.minOrderAmount && cartSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `A minimum cart subtotal of ₹${coupon.minOrderAmount.toLocaleString("en-IN")} is required for this code. (Cart subtotal: ₹${cartSubtotal.toLocaleString("en-IN")})`,
    };
  }

  let discountAmount = 0;
  let freeShipping = false;

  if (coupon.type === "PERCENTAGE") {
    discountAmount = (coupon.value / 100) * cartSubtotal;
    if (coupon.maxDiscountCap) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountCap);
    }
  } else if (coupon.type === "FIXED_AMOUNT") {
    discountAmount = Math.min(coupon.value, cartSubtotal);
  } else if (coupon.type === "FREE_SHIPPING") {
    freeShipping = true;
    discountAmount = 0;
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    discountAmount,
    freeShipping,
    couponId: coupon.id,
    code: coupon.code,
    description:
      coupon.description ||
      `${coupon.value}${coupon.type === "PERCENTAGE" ? "%" : "₹"} off`,
  };
}
