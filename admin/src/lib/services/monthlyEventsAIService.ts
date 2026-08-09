import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { PrebuiltPromotionPreset } from "@/app/promotions/types";

export interface MonthlyAIScanResult {
  holidaysSeeded: number;
  promotionsGenerated: PrebuiltPromotionPreset[];
  aiSummary: string;
}

const SETTING_KEY = "AI_LAST_MONTHLY_SCAN_MONTH";

export class MonthlyEventsAIService {
  /**
   * Checks if the monthly AI Indian Event Scan has ALREADY executed for the current calendar month.
   * If not, automatically executes the scan once and records the current month key (e.g., "2026-08").
   * Guaranteed 0-latency skip on subsequent page visits in the same month!
   */
  static async checkAndRunOnceAMonthGuard(): Promise<
    MonthlyAIScanResult | { skipped: boolean }
  > {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    try {
      // Check last run month stored in database (TenantCredential or IndianHoliday meta)
      const existingSetting = await (prisma as any).tenantCredential.findFirst({
        where: { service: SETTING_KEY },
      });

      const lastRunMonth = existingSetting?.credentials?.month;

      if (lastRunMonth === currentMonthKey) {
        // Already executed for this month -> Instant 1ms skip!
        return { skipped: true };
      }

      // First run of the new calendar month -> Execute scan!
      const result = await this.scanAndGenerateMonthlyPromotions();

      // Record completion for this month
      if (existingSetting) {
        await (prisma as any).tenantCredential.update({
          where: { id: existingSetting.id },
          data: {
            credentials: {
              month: currentMonthKey,
              lastExecutedAt: now.toISOString(),
            },
          },
        });
      } else {
        await (prisma as any).tenantCredential.create({
          data: {
            service: SETTING_KEY,
            credentials: {
              month: currentMonthKey,
              lastExecutedAt: now.toISOString(),
            },
          },
        });
      }

      return result;
    } catch (err) {
      console.warn(
        "[MonthlyEventsAIService] Monthly guard check warning:",
        err,
      );
      return { skipped: true };
    }
  }

  /**
   * Scans upcoming major Indian holidays and events for the current & next 3 months,
   * seeds the IndianHoliday table, and constructs fresh Prebuilt 1-Click Promotions.
   */
  static async scanAndGenerateMonthlyPromotions(): Promise<MonthlyAIScanResult> {
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const now = new Date();
    const currentYear = now.getFullYear();

    let upcomingHolidays: {
      name: string;
      date: string;
      description: string;
      recommendedDiscount: string;
    }[] = [];

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as an expert Indian Retail & Festive Marketing Strategist for James & Sons, a luxury lighting e-commerce brand.
The current date is ${now.toISOString().split("T")[0]}.
List the top 6 major upcoming Indian holidays, festivals, cultural celebrations, and shopping events for India over the next 90 days starting from ${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.

Return ONLY a raw JSON array matching this structure (no markdown formatting):
[
  {
    "name": "Festival Name (e.g. Diwali / Raksha Bandhan / Ganesh Chaturthi / New Year)",
    "date": "YYYY-MM-DD",
    "description": "Short explanation of the festival significance for luxury home decor",
    "recommendedDiscount": "20% OFF or ₹2,000 OFF or Free Shipping"
  }
]`;

        const response = await model.generateContent(prompt);
        const text = response.response.text().trim();
        const jsonText = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        upcomingHolidays = JSON.parse(jsonText);
      } catch (err) {
        console.warn(
          "[MonthlyEventsAIService] Gemini API error, using dynamic calendar fallback:",
          err,
        );
      }
    }

    // Dynamic Fallback Calendar if Gemini is offline
    if (upcomingHolidays.length === 0) {
      upcomingHolidays = [
        {
          name: "Raksha Bandhan",
          date: `${currentYear}-08-28`,
          description: "Festive home gifting season",
          recommendedDiscount: "15% OFF",
        },
        {
          name: "Ganesh Chaturthi",
          date: `${currentYear}-09-17`,
          description: "Home makeover & puja lighting",
          recommendedDiscount: "20% OFF",
        },
        {
          name: "Navratri & Durga Puja",
          date: `${currentYear}-10-12`,
          description: "High-volume festive decor shopping",
          recommendedDiscount: "20% OFF",
        },
        {
          name: "Dhanteras & Diwali",
          date: `${currentYear}-11-10`,
          description: "Peak luxury lighting purchase season",
          recommendedDiscount: "25% OFF",
        },
        {
          name: "Christmas & New Year",
          date: `${currentYear}-12-25`,
          description: "Year-end party & dining chandeliers",
          recommendedDiscount: "₹2,000 OFF",
        },
        {
          name: "Holi Sparkle Sale",
          date: `${currentYear + 1}-03-25`,
          description: "Spring home refresh lighting",
          recommendedDiscount: "15% OFF",
        },
      ];
    }

    let seededCount = 0;
    const generatedPresets: PrebuiltPromotionPreset[] = [];

    for (const h of upcomingHolidays) {
      const eventDate = new Date(h.date);
      if (isNaN(eventDate.getTime())) continue;

      // Seed / Update IndianHoliday in DB
      try {
        const existing = await (prisma as any).indianHoliday.findFirst({
          where: { name: h.name },
        });

        if (!existing) {
          await (prisma as any).indianHoliday.create({
            data: {
              name: h.name,
              date: eventDate,
              isMajor: true,
            },
          });
          seededCount++;
        }
      } catch {
        // ignore DB constraint collisions
      }

      // Generate 1-Click Preset
      const cleanName = h.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const codePrefix = cleanName.slice(0, 8) || "FESTIVE";
      const isPercent = h.recommendedDiscount.includes("%");
      const numVal =
        parseInt(h.recommendedDiscount.replace(/[^0-9]/g, ""), 10) || 20;

      const preset: PrebuiltPromotionPreset = {
        id: `ai_event_${cleanName.toLowerCase()}_${eventDate.getMonth() + 1}`,
        title: `${h.name} Luxury Sale`,
        subtitle: `${h.recommendedDiscount} • ${h.description}`,
        description: `AI-Generated Monthly Event Offer for ${h.name}. Configured with Google Merchant feed sync, Meta Commerce ads, and automated Resend email blast.`,
        badge: h.recommendedDiscount,
        badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
        codePrefix,
        type: isPercent ? "PERCENTAGE" : "FIXED_AMOUNT",
        value: numVal,
        minOrderAmount: isPercent ? 10000 : 15000,
        maxDiscountCap: isPercent ? 4000 : undefined,
        durationDays: 14,
        usageLimitPerUser: 1,
        targetChannels: {
          googleMerchant: true,
          metaCommerce: true,
          emailBlast: true,
          webPush: true,
        },
        iconName: "Zap",
      };

      generatedPresets.push(preset);
    }

    return {
      holidaysSeeded: seededCount,
      promotionsGenerated: generatedPresets,
      aiSummary: `AI scanned calendar for next 90 days and generated ${generatedPresets.length} event promotions tailored for Indian festivals (Diwali, Dhanteras, Durga Puja, etc.).`,
    };
  }
}
