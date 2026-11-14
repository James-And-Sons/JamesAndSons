import { NextResponse } from "next/server";
import { MonthlyEventsAIService } from "@/lib/services/monthlyEventsAIService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret =
      process.env.CRON_SECRET || "james_and_sons_automation_secure_88";

    if (
      authHeader !== `Bearer ${cronSecret}` &&
      process.env.NODE_ENV === "production"
    ) {
      return NextResponse.json(
        { error: "Unauthorized cron trigger" },
        { status: 401 },
      );
    }

    const result =
      await MonthlyEventsAIService.scanAndGenerateMonthlyPromotions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      holidaysSeeded: result.holidaysSeeded,
      promotionsGeneratedCount: result.promotionsGenerated.length,
      aiSummary: result.aiSummary,
      promotions: result.promotionsGenerated,
    });
  } catch (error: any) {
    console.error("[Cron AI Monthly Promotions] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute monthly AI promotions scan",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
