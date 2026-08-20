/**
 * Amazon Reviews Ingestion & Solicitation - Daily Cron Endpoint
 *
 * This endpoint is run once daily to request compliant buyer feedback and
 * reviews for Amazon orders delivered/shipped within the 5-to-30 day window.
 *
 * Request:
 *   GET https://jamesandsons.in/api/cron/amazon-reviews
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Security: protected by the standard workspace CRON_SECRET.
 */
import { NextResponse } from "next/server";
import { dispatchAmazonReviewSolicitations } from "@james-andsons/integrations";

export const maxDuration = 60; // Timeout
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Amazon Reviews Cron] Unauthorized request.");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(
    "[Amazon Reviews Cron] Initiating daily review solicitation run...",
  );
  const startedAt = Date.now();

  try {
    const stats = await dispatchAmazonReviewSolicitations();
    const durationMs = Date.now() - startedAt;

    return NextResponse.json({
      success: true,
      durationMs,
      processed: stats.processed,
      successes: stats.success,
      skipped: stats.skipped,
      errors: stats.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error(
      "[Amazon Reviews Cron] Fatal error during dispatch run:",
      err,
    );
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
