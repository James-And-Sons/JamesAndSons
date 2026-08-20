/**
 * Amazon Order Ingestion - Externally-Triggered Cron Endpoint
 *
 * This endpoint is NOT registered in vercel.json (Vercel free tier does not
 * support cron jobs). Instead, trigger it every 15 minutes from an external
 * service such as:
 *
 *   - cron-job.org  (free, reliable) -- recommended
 *   - GitHub Actions (schedule: "* /15 * * * *")
 *   - Render Cron Jobs
 *   - Uptime Robot (HTTP monitor on 15-min interval)
 *
 * Request:
 *   GET https://jamesandsons.in/api/cron/amazon-orders
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Optional query param:
 *   ?minutes=30  -- how far back to look for new orders (default: 30)
 *
 * Security: protected by the same CRON_SECRET used for flipkart-sync.
 */
import { NextResponse } from "next/server";
import {
  processNewAmazonOrders,
  syncSingleAmazonOrder,
} from "@james-andsons/integrations";

export const maxDuration = 60; // Vercel Serverless function timeout (seconds)
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Auth
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn(
      "[Amazon Cron] Unauthorized request -- invalid or missing CRON_SECRET.",
    );
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse options
  const url = new URL(request.url);
  const amazonOrderId = url.searchParams.get("amazonOrderId");
  const minutesBack = parseInt(url.searchParams.get("minutes") || "1440", 10);

  if (amazonOrderId) {
    console.log(
      `[Amazon Cron] Targeted single order sync for: ${amazonOrderId}`,
    );
    const result = await syncSingleAmazonOrder(amazonOrderId);
    return NextResponse.json(result);
  }

  console.log(
    `[Amazon Cron] Triggered. Looking back ${minutesBack} minutes for new orders.`,
  );
  const startedAt = Date.now();

  // Run ingestion
  try {
    const stats = await processNewAmazonOrders(minutesBack);

    const durationMs = Date.now() - startedAt;
    console.log(`[Amazon Cron] Complete in ${durationMs}ms.`, stats);

    return NextResponse.json({
      success: true,
      durationMs,
      minutesBack,
      fetched: stats.fetched,
      ingested: stats.ingested,
      skipped: stats.skipped,
      errors: stats.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Amazon Cron] Fatal error:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
