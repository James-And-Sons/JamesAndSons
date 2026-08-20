import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { Coupon } from "@/app/promotions/types";

export interface AICampaignSyncResult {
  success: boolean;
  campaignId: string;
  campaignName: string;
  emailSubject: string;
  emailBodyHtml: string;
  whatsappText: string;
  message: string;
}

export class AICampaignSyncService {
  /**
   * Autonomously generates a matching Email & WhatsApp marketing campaign in the Campaign database
   * whenever a promotion code is created or launched.
   */
  static async syncPromotionToCampaign(
    coupon: Coupon,
  ): Promise<AICampaignSyncResult> {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    let emailSubject = `✨ Special Luxury Offer: ${coupon.code} - ${coupon.value}${coupon.type === "PERCENTAGE" ? "% OFF" : " OFF"}`;
    let emailBodyHtml = "";
    let whatsappText = "";

    const discountText =
      coupon.type === "PERCENTAGE"
        ? `${coupon.value}% OFF`
        : coupon.type === "FIXED_AMOUNT"
          ? `₹${coupon.value} OFF`
          : "FREE White-Glove Delivery & Installation";

    const minSpendText = coupon.minOrderAmount
      ? `on orders above ₹${coupon.minOrderAmount.toLocaleString("en-IN")}`
      : "on all orders";

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as an elite Copywriter for James & Sons luxury lighting brand.
Promotion Code: "${coupon.code}"
Discount: "${discountText} ${minSpendText}"
Note: "${coupon.description || "Luxury festive offer"}"

Generate a promotional email campaign.
Return ONLY raw JSON (no markdown formatting):
{
  "emailSubject": "Catchy email subject line with emojis",
  "whatsappText": "Short WhatsApp message text with promo code and store link",
  "emailHeadline": "Polished headline for email banner",
  "emailBodyParagraph": "2-sentence elegant introduction inviting customer to shop luxury chandeliers & lighting"
}`;

        const response = await model.generateContent(prompt);
        const text = response.response.text().trim();
        const jsonText = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(jsonText);

        emailSubject = parsed.emailSubject || emailSubject;
        whatsappText =
          parsed.whatsappText ||
          `✨ James & Sons Luxury Offer! Use code *${coupon.code}* for ${discountText} ${minSpendText}. Shop now: https://jamesandsons.in`;
        emailBodyHtml = this.generateLuxuryEmailHtml({
          code: coupon.code,
          discountText,
          minSpendText,
          headline:
            parsed.emailHeadline ||
            `${coupon.description || coupon.code}: ${discountText}`,
          bodyText:
            parsed.emailBodyParagraph ||
            "Transform your living space with handcrafted architectural lighting and chandeliers.",
          expiresAt: coupon.expiresAt,
        });
      } catch (err) {
        console.warn(
          "[AICampaignSyncService] Gemini API error, using luxury HTML template fallback:",
          err,
        );
      }
    }

    if (!emailBodyHtml) {
      emailBodyHtml = this.generateLuxuryEmailHtml({
        code: coupon.code,
        discountText,
        minSpendText,
        headline: `${coupon.description || coupon.code}: ${discountText}`,
        bodyText:
          "Discover statement dining chandeliers, foyer lighting, and architectural wall sconces curated for fine interiors.",
        expiresAt: coupon.expiresAt,
      });
      whatsappText = `✨ James & Sons Special Offer! Use code *${coupon.code}* to get ${discountText} ${minSpendText}. Explore collection: https://jamesandsons.in`;
    }

    const campaignName = `${coupon.description || coupon.code} - ${discountText}`;

    // Check if campaign already exists for this promo code
    const existing = await (prisma as any).campaign.findFirst({
      where: {
        OR: [
          { name: campaignName },
          { name: `[AI Synced] ${coupon.code} - ${discountText}` },
          { segmentationRules: { path: ["promoCode"], equals: coupon.code } },
        ],
      },
    });

    let campaign;
    if (existing) {
      campaign = await (prisma as any).campaign.update({
        where: { id: existing.id },
        data: {
          name: campaignName,
          emailSubject,
          emailBodyHtml,
          whatsappText,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });
    } else {
      campaign = await (prisma as any).campaign.create({
        data: {
          name: campaignName,
          status: "ACTIVE",
          stage: "STAGE_1_DISPATCH",
          segmentationRules: {
            segment: "ALL_BUYERS",
            promoCode: coupon.code,
            discountValue: coupon.value,
          },
          metrics: {
            sentCount: 0,
            openCount: 0,
            redeemedCount: 0,
            totalRevenue: 0,
          },
          emailSubject,
          emailBodyHtml,
          whatsappText,
        },
      });
    }

    return {
      success: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
      emailSubject,
      emailBodyHtml,
      whatsappText,
      message: `AI automatically constructed and synced Email & WhatsApp marketing campaign for promo '${coupon.code}'.`,
    };
  }

  /**
   * Generates a luxury styled HTML email template for James & Sons
   */
  private static generateLuxuryEmailHtml(params: {
    code: string;
    discountText: string;
    minSpendText: string;
    headline: string;
    bodyText: string;
    expiresAt?: string | Date | null;
  }): string {
    const formattedExpiry = params.expiresAt
      ? new Date(params.expiresAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Limited Time Only";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Playfair Display', Georgia, serif; background-color: #0c0a09; color: #f5f5f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #44403c; border-radius: 4px; overflow: hidden; }
    .header { background: #0c0a09; text-align: center; padding: 30px 20px; border-b: 1px solid #292524; }
    .brand { font-size: 24px; font-weight: bold; letter-spacing: 4px; text-transform: uppercase; color: #d97706; margin: 0; }
    .content { padding: 35px 30px; text-align: center; }
    .headline { font-size: 22px; color: #f5f5f4; margin-bottom: 15px; }
    .body-text { font-family: -apple-system, sans-serif; font-size: 14px; color: #a8a29e; line-height: 1.6; margin-bottom: 25px; }
    .code-box { background: #292524; border: 1px dashed #d97706; padding: 20px; border-radius: 4px; margin: 25px 0; }
    .code { font-family: monospace; font-size: 26px; font-weight: bold; color: #fbbf24; letter-spacing: 3px; }
    .rules { font-family: -apple-system, sans-serif; font-size: 12px; color: #78716c; margin-top: 8px; }
    .btn { display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; font-family: -apple-system, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; border-radius: 2px; margin-top: 15px; }
    .footer { font-family: -apple-system, sans-serif; font-size: 11px; color: #78716c; text-align: center; padding: 20px; border-t: 1px solid #292524; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand">James &amp; Sons</h1>
      <p style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #a8a29e; margin-top: 5px;">Luxury Lighting &amp; Decor</p>
    </div>
    <div class="content">
      <h2 class="headline">${params.headline}</h2>
      <p class="body-text">${params.bodyText}</p>

      <div class="code-box">
        <div style="font-family: -apple-system, sans-serif; font-size: 11px; text-transform: uppercase; color: #a8a29e; margin-bottom: 5px;">Exclusive Promo Code</div>
        <div class="code">${params.code}</div>
        <div class="rules">Enjoy ${params.discountText} ${params.minSpendText}. Valid until ${formattedExpiry}.</div>
      </div>

      <a href="https://jamesandsons.in/collections" class="btn">Explore Luxury Catalog &rarr;</a>
    </div>
    <div class="footer">
      James &amp; Sons • Fine Architectural Lighting • <a href="https://jamesandsons.in" style="color: #d97706;">jamesandsons.in</a>
    </div>
  </div>
</body>
</html>`;
  }
}
