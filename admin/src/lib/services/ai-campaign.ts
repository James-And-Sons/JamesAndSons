import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AICampaignOutput {
  email_subject: string;
  email_body_html: string;
  whatsapp_broadcast_text: string;
  recommended_products_query: string;
}

export async function generateAICampaignCopy({
  holidayName,
  targetSegment = 'VIP',
  discountValue = 15
}: {
  holidayName: string;
  targetSegment?: string;
  discountValue?: number;
}): Promise<AICampaignOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = `You are an expert, elite e-commerce marketing copywriter for "James & Sons" (jamesandsons.in), an Indian luxury e-commerce brand specializing in handcrafted brass lighting fixtures, decorative sconces, chandeliers, and high-end fashion jewelry & home accents.

Your objective is to generate an exclusive, high-converting holiday marketing campaign for the upcoming festival: "${holidayName}".
Target Audience Segment: ${targetSegment} (${
    targetSegment === 'VIP'
      ? 'High-value elite buyers expecting prestige, personal concierge treatment, and early access'
      : targetSegment === 'LAPSED'
      ? 'Lapsed customers inactive for 90+ days needing a strong win-back incentive and urgency'
      : 'All valued customers looking for festive luxury enhancements'
  }).

Discount Offer: ${discountValue}% OFF via a dynamic 8-character single-use voucher code: {{COUPON_CODE}}.

STRICT REQUIREMENT: You MUST respond ONLY with a raw JSON object containing EXACTLY these 4 fields:
{
  "email_subject": "A captivating, high-open-rate subject line with festive flair and luxury tone",
  "email_body_html": "Fully styled HTML string for an email template. Use inline CSS with a dark luxury aesthetic (#0d0d0d background, #D4AF37 gold text accents, #1a1a1a card containers, clear typography, {{COUPON_CODE}} voucher box, and a prominent 'Claim Your Exclusive Voucher' button)",
  "whatsapp_broadcast_text": "Concise, elegant WhatsApp message (under 160 words). Include emojis (✨, 🪔, 🎁, 🕯️), clear highlight of the ${discountValue}% OFF discount using code {{COUPON_CODE}}, and a direct link call-to-action: https://jamesandsons.in/collections/festive",
  "recommended_products_query": "4-5 search terms separated by space to query our catalog for the 4 most relevant festive products (e.g. 'brass pendant chandelier wall sconce gold')"
}`;

  if (!apiKey) {
    console.warn('[AI Campaign Service] GEMINI_API_KEY missing. Returning fallback structured copy.');
    return getFallbackCampaignCopy(holidayName, discountValue, targetSegment);
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.response.text();
    const cleanJsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText) as AICampaignOutput;

    if (
      parsed.email_subject &&
      parsed.email_body_html &&
      parsed.whatsapp_broadcast_text &&
      parsed.recommended_products_query
    ) {
      return parsed;
    }

    return getFallbackCampaignCopy(holidayName, discountValue, targetSegment);
  } catch (err) {
    console.error('[AI Campaign Service] Failed to call Gemini AI:', err);
    return getFallbackCampaignCopy(holidayName, discountValue, targetSegment);
  }
}

function getFallbackCampaignCopy(holidayName: string, discount: number, segment: string): AICampaignOutput {
  const isVip = segment === 'VIP';
  const prefix = isVip ? '✨ Exclusive VIP Access: ' : '🪔 Festive Celebration: ';

  return {
    email_subject: `${prefix}Illuminate Your Home for ${holidayName} — Enjoy ${discount}% Off`,
    email_body_html: `
<div style="background-color: #0d0d0d; color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212,175,55,0.3); border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #D4AF37; font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">James &amp; Sons</h2>
    <p style="color: #888888; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px;">Bespoke Handcrafted Luxury</p>
  </div>
  
  <div style="text-align: center; padding: 30px 20px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
    <h1 style="color: #ffffff; font-size: 26px; font-weight: 300; margin-bottom: 12px;">Celebrate ${holidayName} in Grandeur</h1>
    <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
      In honor of ${holidayName}, we invite you to elevate your interior spaces with our signature handcrafted brass lighting and festive decor collection.
    </p>

    <div style="background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%); border: 1px dashed #D4AF37; padding: 20px; border-radius: 10px; display: inline-block; margin: 10px 0 24px;">
      <span style="display: block; color: #D4AF37; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Your Personal Single-Use Code</span>
      <strong style="color: #ffffff; font-size: 28px; letter-spacing: 0.2em; font-family: monospace; display: block; margin-top: 6px;">{{COUPON_CODE}}</strong>
      <span style="color: #aaaaaa; font-size: 11px; margin-top: 4px; display: block;">Valid for ${discount}% OFF your entire festive order</span>
    </div>

    <div>
      <a href="https://jamesandsons.in/collections/festive" style="background-color: #D4AF37; color: #000000; padding: 14px 32px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; border-radius: 30px; display: inline-block;">
        Claim Your Voucher
      </a>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; color: #666666; font-size: 11px;">
    &copy; ${new Date().getFullYear()} James &amp; Sons. All rights reserved. | CNI Church Compound, Civil Lines, Aligarh, UP 202001
  </div>
</div>
    `.trim(),
    whatsapp_broadcast_text: `🪔 *Celebrate ${holidayName} with James & Sons* ✨\n\nElevate your home with handcrafted brass lighting & bespoke festive decor.\n\nEnjoy an exclusive *${discount}% OFF* using your unique single-use voucher code:\n👉 *{{COUPON_CODE}}*\n\nExplore the festive collection:\nhttps://jamesandsons.in/collections/festive`,
    recommended_products_query: 'brass pendant sconce chandelier luxury'
  };
}
