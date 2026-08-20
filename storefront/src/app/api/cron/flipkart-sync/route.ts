import { NextResponse } from "next/server";
import {
  processNewFlipkartOrders,
  fetchFlipkartOrders,
  getFlipkartAccessToken,
} from "@james-andsons/integrations";

export const maxDuration = 60; // Serverless function execution timeout
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Validate Cron authorization header in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(
    "[Flipkart Cron Sync] Starting background order ingestion & sync...",
  );
  const startedAt = Date.now();

  try {
    // 1. Ingest Flipkart orders into Prisma & update stock/admin portal
    let stats = { fetched: 0, ingested: 0, skipped: 0, errors: 0 };
    try {
      stats = await processNewFlipkartOrders();
      console.log("[Flipkart Cron Sync] Ingestion complete:", stats);
    } catch (ingestErr) {
      console.warn(
        "[Flipkart Cron Sync] Ingestion skipped or failed:",
        ingestErr,
      );
    }

    // 2. Refresh Zoho access token & sync orders to ERP if configured
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const accountsDomain =
      process.env.ZOHO_ACCOUNTS_DOMAIN || "accounts.zoho.com";
    const isIndia = accountsDomain.endsWith(".in");
    const apiBase = isIndia
      ? "https://www.zohoapis.in/inventory/v1"
      : "https://www.zohoapis.com/inventory/v1";
    const orgId = process.env.ZOHO_INVENTORY_ORG_ID || "";

    if (
      clientId &&
      clientSecret &&
      refreshToken &&
      orgId &&
      stats.fetched > 0
    ) {
      try {
        const token = await getFlipkartAccessToken();
        const rawOrders = await fetchFlipkartOrders(token);

        const params = new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        });

        const zohoRes = await fetch(
          `https://${accountsDomain}/oauth/v2/token`,
          {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );

        if (zohoRes.ok) {
          const zohoData = await zohoRes.json();
          const zohoToken = zohoData.access_token;

          for (const order of rawOrders) {
            try {
              const salesOrderPayload = {
                customer_id: "FLIPKART_MARKETPLACE_CONTACT_ID",
                salesorder_number: `FK-${order.order_id}`,
                date: new Date().toISOString().split("T")[0],
                custom_fields: [
                  { label: "Channel Origin", value: "Flipkart Seller" },
                ],
                line_items: order.order_items.map((item: any) => ({
                  sku: item.sku,
                  name: item.title || "Flipkart Item",
                  rate: Number(item.price),
                  quantity: Number(item.quantity),
                })),
                shipping_charge: 0,
                billing_address: {
                  address:
                    order.shipping_address?.address_line1 || "Flipkart Order",
                  city: order.shipping_address?.city || "",
                  state: order.shipping_address?.state || "",
                  zip: order.shipping_address?.pincode || "",
                  country: "India",
                },
              };

              await fetch(`${apiBase}/salesorders`, {
                method: "POST",
                headers: {
                  Authorization: `Zoho-oauthtoken ${zohoToken}`,
                  "X-com-zoho-organizationid": orgId,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(salesOrderPayload),
              });

              console.log(
                `[Flipkart Cron Sync] Synced order FK-${order.order_id} to Zoho.`,
              );
            } catch (syncErr) {
              console.error(
                `[Flipkart Cron Sync] Failed to map order ${order.order_id} to Zoho:`,
                syncErr,
              );
            }
          }
        }
      } catch (zohoErr) {
        console.warn("[Flipkart Cron Sync] Zoho sync skipped:", zohoErr);
      }
    }

    const durationMs = Date.now() - startedAt;
    return NextResponse.json({
      success: true,
      durationMs,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Flipkart Cron Sync] Integration error:", err);
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 },
    );
  }
}
