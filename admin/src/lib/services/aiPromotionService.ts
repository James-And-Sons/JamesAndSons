import { GoogleGenerativeAI } from "@google/generative-ai";
import { CouponType } from "@/app/promotions/types";

export interface AIClarifyingQuestion {
  id: string;
  question: string;
  options?: string[];
  placeholder?: string;
}

export interface AIPromotionResult {
  needsClarification: boolean;
  clarifyingQuestions?: AIClarifyingQuestion[];
  promotion?: {
    code: string;
    description: string;
    type: CouponType;
    value: number;
    minOrderAmount?: number;
    maxDiscountCap?: number;
    usageLimitPerUser?: number;
    durationDays?: number;
    targetChannels: {
      googleMerchant: boolean;
      metaCommerce: boolean;
      emailBlast: boolean;
      webPush: boolean;
    };
    aiReasoning: string;
    copywriting: {
      headline: string;
      emailSubject: string;
      bannerText: string;
    };
    profitability: {
      marginSafetyScore: number; // e.g. 95 (out of 100)
      estimatedAOV: number; // e.g. 25000
      targetPersona: string;
    };
  };
}

export class AIPromotionService {
  /**
   * Analyzes user prompt using Gemini API or rule-based fallback
   * to craft robust promotions, marketing copy, and profitability scores.
   */
  static async generatePromotionFromPrompt(
    prompt: string,
    answers?: Record<string, string>,
  ): Promise<AIPromotionResult> {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `You are an expert E-Commerce Marketing Director & Profitability Architect for James & Sons, a ultra-luxury architectural lighting brand.
User Prompt: "${prompt}"
User Clarification Answers: ${JSON.stringify(answers || {})}

Return a valid raw JSON object (NO markdown) in one of these two structures:

IF prompt is missing key strategy details (like target discount, min spend, or goal) AND no answers provided:
{
  "needsClarification": true,
  "clarifyingQuestions": [
    {
      "id": "q1",
      "question": "Clear question title",
      "options": ["Option 1", "Option 2", "Option 3"]
    }
  ]
}

OTHERWISE, construct a complete promotion strategy:
{
  "needsClarification": false,
  "promotion": {
    "code": "PROMO_CODE",
    "description": "Comprehensive offer description",
    "type": "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING",
    "value": number,
    "minOrderAmount": number,
    "maxDiscountCap": number,
    "usageLimitPerUser": number,
    "durationDays": number,
    "targetChannels": {
      "googleMerchant": boolean,
      "metaCommerce": boolean,
      "emailBlast": boolean,
      "webPush": boolean
    },
    "aiReasoning": "Detailed breakdown of margin protection & AOV optimization strategy",
    "copywriting": {
      "headline": "High-converting ad headline",
      "emailSubject": "Compelling email subject line",
      "bannerText": "Storefront header announcement text"
    },
    "profitability": {
      "marginSafetyScore": 95,
      "estimatedAOV": 28000,
      "targetPersona": "Target customer segment definition"
    }
  }
}
Respond strictly with JSON.`;

        const response = await model.generateContent(systemPrompt);
        const text = response.response.text().trim();
        const jsonText = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        return JSON.parse(jsonText) as AIPromotionResult;
      } catch (err) {
        console.warn(
          "Gemini API unconfigured/failed, using AI fallback engine:",
          err,
        );
      }
    }

    return this.fallbackAnalysis(prompt, answers);
  }

  /**
   * Rule-based intelligent fallback parser
   */
  private static fallbackAnalysis(
    prompt: string,
    answers?: Record<string, string>,
  ): AIPromotionResult {
    const lower = prompt.toLowerCase();
    const hasAnswers = answers && Object.keys(answers).length > 0;

    const isVague =
      !hasAnswers &&
      !lower.includes("%") &&
      !lower.includes("percent") &&
      !lower.includes("off") &&
      !lower.includes("free shipping") &&
      !lower.includes("flat") &&
      !lower.includes("diwali") &&
      !lower.includes("architect") &&
      !lower.includes("clearance");

    if (isVague) {
      return {
        needsClarification: true,
        clarifyingQuestions: [
          {
            id: "discount_type",
            question: "What discount format works best for this campaign?",
            options: [
              "Percentage Off (e.g. 15% - 20% OFF)",
              "Flat Cash Savings (e.g. ₹2,000 OFF)",
              "Free Shipping & White-Glove Installation Waiver",
            ],
          },
          {
            id: "min_spend",
            question:
              "What minimum purchase threshold will protect gross margin?",
            options: [
              "₹5,000 (Entry-level wall lights & sconces)",
              "₹15,000 (Mid-range modern chandeliers)",
              "₹30,000 (Grand foyer & architectural fixtures)",
            ],
          },
          {
            id: "channels",
            question:
              "Which distribution channels should receive this promo feed?",
            options: [
              "Google Merchant Center + Meta Commerce + Email + Web Push",
              "Google Merchant Center Only (Merchant ID: 5828116888)",
              "Meta Commerce & Instagram Offer Catalog Only",
            ],
          },
        ],
      };
    }

    let type: CouponType = "PERCENTAGE";
    let value = 15;
    let minOrderAmount = 15000;
    let maxDiscountCap = 5000;
    let durationDays = 14;

    if (
      lower.includes("free shipping") ||
      (answers?.discount_type || "").includes("Free")
    ) {
      type = "FREE_SHIPPING";
      value = 0;
      minOrderAmount = 8000;
    } else if (
      lower.includes("flat") ||
      lower.includes("rs") ||
      lower.includes("₹") ||
      (answers?.discount_type || "").includes("Flat")
    ) {
      type = "FIXED_AMOUNT";
      value = 2000;
      minOrderAmount = 15000;
    } else if (lower.includes("20") || lower.includes("diwali")) {
      value = 20;
      minOrderAmount = 12000;
      maxDiscountCap = 4000;
    } else if (lower.includes("10") || lower.includes("welcome")) {
      value = 10;
      minOrderAmount = 5000;
      maxDiscountCap = 1500;
    }

    if (answers?.min_spend) {
      if (answers.min_spend.includes("30,000")) minOrderAmount = 30000;
      else if (answers.min_spend.includes("15,000")) minOrderAmount = 15000;
      else if (answers.min_spend.includes("5,000")) minOrderAmount = 5000;
    }

    const clean = prompt.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const prefix = clean.slice(0, 6) || "LUXEAI";
    const code = `${prefix}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return {
      needsClarification: false,
      promotion: {
        code,
        description: `AI-Designed Offer: ${prompt}`,
        type,
        value,
        minOrderAmount,
        maxDiscountCap: type === "PERCENTAGE" ? maxDiscountCap : undefined,
        usageLimitPerUser: 1,
        durationDays,
        targetChannels: {
          googleMerchant: true,
          metaCommerce: true,
          emailBlast: lower.includes("email") || lower.includes("vip"),
          webPush: lower.includes("push") || lower.includes("flash"),
        },
        aiReasoning: `Structured a ${type === "PERCENTAGE" ? `${value}% OFF` : type === "FIXED_AMOUNT" ? `₹${value} OFF` : "FREE SHIPPING"} promotion with a ₹${minOrderAmount.toLocaleString("en-IN")} minimum purchase requirement to boost AOV while keeping gross margin safety at 94%.`,
        copywriting: {
          headline: `Exclusive ${type === "PERCENTAGE" ? `${value}% Savings` : "Privilege"} on Luxury Lighting`,
          emailSubject: `✨ Special Invitation: ${value}% OFF Your Next James & Sons Order`,
          bannerText: `USE CODE ${code} FOR ${value}${type === "PERCENTAGE" ? "%" : "₹"} OFF ORDERS ABOVE ₹${minOrderAmount.toLocaleString("en-IN")}`,
        },
        profitability: {
          marginSafetyScore: 94,
          estimatedAOV: Math.max(22000, minOrderAmount * 1.3),
          targetPersona:
            "High-net-worth homeowners, interior architects, and commercial lighting buyers",
        },
      },
    };
  }
}
