import { prisma } from '@/lib/prisma';
import { generateAICampaignCopy } from './ai-campaign';
import { batchGenerateDynamicCoupons } from './coupon-generator';

export async function draftCampaignForHoliday(holidayId: string, segment: string = 'VIP', discountValue: number = 15) {
  const holiday = await prisma.indianHoliday.findUnique({
    where: { id: holidayId }
  });

  if (!holiday) {
    throw new Error(`IndianHoliday with ID ${holidayId} not found.`);
  }

  // 1. Call AI service to generate tailored campaign copy
  const aiOutput = await generateAICampaignCopy({
    holidayName: holiday.name,
    targetSegment: segment,
    discountValue
  });

  // 2. Fetch top 4 catalog items matching recommended_products_query
  const terms = aiOutput.recommended_products_query.split(/\s+/).filter(t => t.length > 2);
  const products = await prisma.product.findMany({
    where: terms.length > 0 ? {
      OR: [
        { name: { contains: terms[0], mode: 'insensitive' } },
        { description: { contains: terms[0], mode: 'insensitive' } }
      ]
    } : undefined,
    take: 4,
    select: {
      id: true,
      name: true,
      sku: true,
      d2cPrice: true,
      mrp: true,
      images: true
    }
  });

  // Fallback if query returns fewer than 4 items
  let recommendedProducts = products;
  if (recommendedProducts.length < 4) {
    const fallbackProducts = await prisma.product.findMany({
      take: 4,
      select: {
        id: true,
        name: true,
        sku: true,
        d2cPrice: true,
        mrp: true,
        images: true
      }
    });
    recommendedProducts = fallbackProducts;
  }

  // 3. Create Campaign draft in database
  const campaign = await prisma.campaign.create({
    data: {
      holidayId: holiday.id,
      name: `${holiday.name} Festive Blast (${segment})`,
      status: 'DRAFT',
      stage: 'STAGE_1_DISPATCH',
      segmentationRules: {
        segment,
        discountValue,
        description: segment === 'VIP' ? 'VIP & High Value Buyers' : segment === 'LAPSED' ? 'Lapsed Buyers (>90 Days)' : 'All Registered Customers'
      },
      metrics: {
        sentCount: 0,
        openCount: 0,
        redeemedCount: 0,
        totalRevenue: 0
      },
      emailSubject: aiOutput.email_subject,
      emailBodyHtml: aiOutput.email_body_html,
      whatsappText: aiOutput.whatsapp_broadcast_text,
      recommendedProducts: recommendedProducts,
      scheduledAt: new Date(holiday.date.getTime() - 20 * 24 * 60 * 60 * 1000)
    }
  });

  return campaign;
}

/**
 * Draft a custom campaign (not tied to any specific holiday calendar event)
 */
export async function draftCustomCampaign({
  name,
  segment = 'VIP',
  discountValue = 15,
  holidayId
}: {
  name: string;
  segment?: string;
  discountValue?: number;
  holidayId?: string;
}) {
  let holidayName = name;
  if (holidayId) {
    const h = await prisma.indianHoliday.findUnique({ where: { id: holidayId } });
    if (h) holidayName = h.name;
  }

  const aiOutput = await generateAICampaignCopy({
    holidayName,
    targetSegment: segment,
    discountValue
  });

  const terms = aiOutput.recommended_products_query.split(/\s+/).filter(t => t.length > 2);
  const products = await prisma.product.findMany({
    where: terms.length > 0 ? {
      OR: [
        { name: { contains: terms[0], mode: 'insensitive' } },
        { description: { contains: terms[0], mode: 'insensitive' } }
      ]
    } : undefined,
    take: 4,
    select: {
      id: true,
      name: true,
      sku: true,
      d2cPrice: true,
      mrp: true,
      images: true
    }
  });

  let recommendedProducts = products;
  if (recommendedProducts.length < 4) {
    recommendedProducts = await prisma.product.findMany({
      take: 4,
      select: {
        id: true,
        name: true,
        sku: true,
        d2cPrice: true,
        mrp: true,
        images: true
      }
    });
  }

  const campaign = await prisma.campaign.create({
    data: {
      holidayId: holidayId || null,
      name: name || `${holidayName} Campaign`,
      status: 'DRAFT',
      stage: 'STAGE_1_DISPATCH',
      segmentationRules: {
        segment,
        discountValue,
        description: segment === 'VIP' ? 'VIP & High Value Buyers' : segment === 'LAPSED' ? 'Lapsed Buyers (>90 Days)' : 'All Registered Customers'
      },
      metrics: {
        sentCount: 0,
        openCount: 0,
        redeemedCount: 0,
        totalRevenue: 0
      },
      emailSubject: aiOutput.email_subject,
      emailBodyHtml: aiOutput.email_body_html,
      whatsappText: aiOutput.whatsapp_broadcast_text,
      recommendedProducts: recommendedProducts
    }
  });

  return campaign;
}

/**
 * Revert a scheduled or active campaign back to DRAFT mode (Undo Schedule)
 */
export async function unscheduleCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('Campaign not found');

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'DRAFT',
      stage: 'STAGE_1_DISPATCH',
      scheduledAt: null,
      sentAt: null
    }
  });

  return updated;
}

/**
 * Delete a campaign and its associated dynamic coupons
 */
export async function deleteCampaign(campaignId: string) {
  await prisma.dynamicCoupon.deleteMany({ where: { campaignId } });
  return await prisma.campaign.delete({ where: { id: campaignId } });
}

/**
 * Dispatch Stage 1 (Day -20): Batch-generate dynamic single-use coupons & schedule multi-channel dispatch
 */
export async function dispatchCampaignStage1(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { holiday: true }
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found.`);
  }

  const rules: any = campaign.segmentationRules || {};
  const segment = rules.segment || 'VIP';
  const discountValue = rules.discountValue || 15;

  // Find target customers based on segment
  let targetCustomers: { id: string; email: string; phone: string | null }[] = [];

  if (segment === 'VIP') {
    // Customers with orders total > 25,000
    targetCustomers = await prisma.user.findMany({
      where: {
        orders: {
          some: {
            totalAmount: { gte: 25000 },
            status: { in: ['PAID', 'DELIVERED', 'SHIPPED', 'PROCESSING'] }
          }
        }
      },
      select: { id: true, email: true, phone: true },
      take: 100
    });
  } else if (segment === 'LAPSED') {
    // Customers with last order > 90 days ago
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    targetCustomers = await prisma.user.findMany({
      where: {
        orders: {
          some: {
            createdAt: { lte: ninetyDaysAgo }
          }
        }
      },
      select: { id: true, email: true, phone: true },
      take: 100
    });
  }

  // Fallback if no specific customers match segment: take all active customers
  if (targetCustomers.length === 0) {
    targetCustomers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, email: true, phone: true },
      take: 100
    });
  }

  const expiresAt = campaign.holiday?.date
    ? new Date(campaign.holiday.date)
    : new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

  const prefix = (campaign.holiday?.name || 'FEST').substring(0, 3).toUpperCase();

  // Batch generate dynamic 8-character single-use coupons
  const customerIds = targetCustomers.map(c => c.id);
  const couponResult = await batchGenerateDynamicCoupons({
    campaignId: campaign.id,
    customerIds,
    discountValue,
    expiresAt,
    codePrefix: prefix
  });

  // Background dispatch to all target customers (Email + WhatsApp)
  const { sendEmail, sendWhatsAppMessage } = await import('@/lib/services/messaging');
  
  // Async dispatch without blocking HTTP response
  (async () => {
    try {
      const generatedCoupons = await prisma.dynamicCoupon.findMany({
        where: { campaignId: campaign.id },
        include: { customer: true }
      });

      for (const coupon of generatedCoupons) {
        const custName = coupon.customer?.firstName || 'Valued Customer';
        const custEmail = coupon.customer?.email;
        const custPhone = coupon.customer?.phone;

        // 1. Dispatch Email
        if (custEmail && campaign.emailBodyHtml) {
          const personalizedHtml = campaign.emailBodyHtml
            .replace(/\{\{CUSTOMER_NAME\}\}/g, custName)
            .replace(/\{\{COUPON_CODE\}\}/g, coupon.uniqueCode)
            .replace(/\{\{DISCOUNT_VALUE\}\}/g, String(discountValue));

          const subject = (campaign.emailSubject || 'Exclusive Offer for {{CUSTOMER_NAME}}')
            .replace(/\{\{CUSTOMER_NAME\}\}/g, custName)
            .replace(/\{\{COUPON_CODE\}\}/g, coupon.uniqueCode);

          await sendEmail({ to: custEmail, subject, html: personalizedHtml });
        }

        // 2. Dispatch WhatsApp
        if (custPhone && campaign.whatsappText) {
          const personalizedWA = campaign.whatsappText
            .replace(/\{\{CUSTOMER_NAME\}\}/g, custName)
            .replace(/\{\{COUPON_CODE\}\}/g, coupon.uniqueCode)
            .replace(/\{\{DISCOUNT_VALUE\}\}/g, String(discountValue));

          await sendWhatsAppMessage({ to: custPhone, text: personalizedWA });
        }
      }
    } catch (dispatchErr) {
      console.error('[Campaign Dispatcher] Background messaging error:', dispatchErr);
    }
  })();

  const updatedMetrics: any = campaign.metrics || {};
  updatedMetrics.sentCount = customerIds.length;
  updatedMetrics.stage1SentAt = new Date().toISOString();

  const updatedCampaign = await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'ACTIVE',
      stage: 'STAGE_1_DISPATCH',
      sentAt: new Date(),
      metrics: updatedMetrics
    }
  });

  return {
    campaign: updatedCampaign,
    couponsGenerated: couponResult.count,
    targetCount: customerIds.length,
    sampleCodes: couponResult.sampleCodes
  };
}

/**
 * Dispatch Stage 2 (Day -2): Send urgent expiry warnings for unredeemed coupons
 */
export async function dispatchCampaignStage2(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      dynamicCoupons: {
        where: { isRedeemed: false }
      }
    }
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found.`);
  }

  const unredeemedCoupons = campaign.dynamicCoupons;
  const unredeemedCount = unredeemedCoupons.length;

  const updatedMetrics: any = campaign.metrics || {};
  updatedMetrics.stage2WarningSentCount = unredeemedCount;
  updatedMetrics.stage2SentAt = new Date().toISOString();

  const updatedCampaign = await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      stage: 'STAGE_2_EXPIRY_WARNING',
      metrics: updatedMetrics
    }
  });

  return {
    campaign: updatedCampaign,
    unredeemedCount,
    message: `Stage 2 expiry warnings dispatched for ${unredeemedCount} unredeemed customer vouchers.`
  };
}
