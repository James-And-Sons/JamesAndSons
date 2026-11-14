import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/orders/[id]/amazon-confirm-shipment
 * Confirms shipment on Amazon Seller Central via SP-API for Self-Ship (MFN) orders.
 * Automatically transmits the AWB tracking number & carrier name to Amazon.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const {
      carrierCode = "Shiprocket",
      carrierName = "Shiprocket",
      trackingNumber,
      shippingService = "Standard",
    } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order?.amazonOrderId) {
      return NextResponse.json(
        { error: "Not an Amazon order" },
        { status: 400 },
      );
    }

    const awbToUse = trackingNumber || order.awbNumber || order.trackingNumber;

    if (!awbToUse) {
      return NextResponse.json(
        {
          error:
            "Tracking ID (AWB Number) is required to confirm shipment on Amazon.",
        },
        { status: 400 },
      );
    }

    const { getLwaAccessToken, getAmazonConfig, signedSpApiFetch } =
      await import("@james-andsons/integrations");

    const config = getAmazonConfig();
    const accessToken = await getLwaAccessToken();

    // Fetch Amazon OrderItems from SP-API to satisfy OrderItemList requirement
    let orderItemsPayload: { orderItemId: string; quantity: number }[] = [];
    try {
      const itemsRes = await signedSpApiFetch(
        `/orders/v0/orders/${order.amazonOrderId}/orderItems`,
        accessToken,
        config,
      );
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        const rawItems: any[] = itemsData?.payload?.OrderItems || [];
        orderItemsPayload = rawItems.map((it) => ({
          orderItemId: it.OrderItemId,
          quantity: Number(it.QuantityOrdered) || 1,
        }));
      }
    } catch (err) {
      console.warn(
        "[Amazon Confirm Shipment] Could not fetch OrderItems from SP-API:",
        err,
      );
    }

    // Fetch exact real courier name from Shiprocket for this AWB if available
    let fetchedCourierName = carrierName;
    if (!fetchedCourierName || fetchedCourierName === "Shiprocket") {
      try {
        const { getShiprocketToken } =
          await import("@james-andsons/shiprocket");
        const token = await getShiprocketToken();
        if (token && awbToUse) {
          const trackRes = await fetch(
            `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awbToUse)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            },
          );
          if (trackRes.ok) {
            const trackData = await trackRes.json();
            const realCourier =
              trackData?.tracking_data?.shipment_track?.[0]?.courier_name ||
              trackData?.courier_name;
            if (realCourier) {
              fetchedCourierName = realCourier;
              console.log(
                `[Amazon Confirm Shipment] Fetched real courier from Shiprocket for AWB ${awbToUse}: "${realCourier}"`,
              );
            }
          }
        }
      } catch (err) {
        console.warn(
          "[Amazon Confirm Shipment] Could not fetch real courier from Shiprocket:",
          err,
        );
      }
    }

    // Parse exact carrier for Amazon SP-API
    const parseCarrierForAmazon = (rawName?: string | null): string => {
      if (!rawName) return "Delhivery";
      const lower = rawName.toLowerCase();
      if (lower.includes("bluedart") || lower.includes("blue dart"))
        return "BlueDart";
      if (lower.includes("delhivery")) return "Delhivery";
      if (lower.includes("dtdc")) return "DTDC";
      if (lower.includes("india") || lower.includes("post"))
        return "India Post";
      if (lower.includes("ecom")) return "Ecom Express";
      if (lower.includes("xpress")) return "Xpressbees";
      if (lower.includes("fedex")) return "FedEx";
      if (lower.includes("dhl")) return "DHL";
      return "Other";
    };

    const primaryCarrier = parseCarrierForAmazon(fetchedCourierName);
    const displayCarrierName = fetchedCourierName || "Delhivery";

    // Strictly attempt primary carrier first, then "Other" with explicit name (NO cross-carrier mismatches)
    const carrierCandidates = Array.from(
      new Set([primaryCarrier, "Other"].filter(Boolean)),
    ) as string[];

    const spPath = `/orders/v0/orders/${order.amazonOrderId}/shipmentConfirmation`;
    let isSuccess = false;
    let lastErrorText = "";
    let acceptedCarrier = "";

    for (const carrier of carrierCandidates) {
      console.log(
        `[Amazon SP-API] Attempting shipment confirmation for ${order.amazonOrderId} (AWB: ${awbToUse}) with carrierCode: "${carrier}" (Actual: ${displayCarrierName})...`,
      );

      const shipmentPayload = {
        marketplaceId: config.marketplaceId,
        packageDetail: {
          packageReferenceId: "1",
          carrierCode: carrier,
          carrierName: carrier === "Other" ? displayCarrierName : carrier,
          shippingService: shippingService || "Standard",
          trackingNumber: awbToUse,
          shipDate: new Date().toISOString(),
          orderItems: orderItemsPayload,
        },
      };

      const res = await signedSpApiFetch(spPath, accessToken, config, {
        method: "POST",
        body: JSON.stringify(shipmentPayload),
      });

      if (res.ok) {
        isSuccess = true;
        acceptedCarrier = carrier;
        console.log(
          `[Amazon SP-API] ✅ Shipment confirmed successfully on Amazon using carrierCode: "${carrier}"!`,
        );
        break;
      } else {
        lastErrorText = await res.text();
        console.warn(
          `[Amazon SP-API] Carrier "${carrier}" rejected: ${res.status} — ${lastErrorText}`,
        );

        // If error is not InvalidCarrier (e.g. order state invalid or orderItems error), stop looping
        if (!lastErrorText.includes("InvalidCarrier")) {
          break;
        }
      }
    }

    if (!isSuccess) {
      console.error(
        `[Amazon SP-API] Final shipment confirmation failed: ${lastErrorText}`,
      );

      // Update local DB status & tracking so JNS keeps records updated
      await prisma.order.update({
        where: { id },
        data: {
          awbNumber: awbToUse,
          trackingNumber: awbToUse,
          status: "SHIPPED",
          amazonOrderStatus: "Shipped",
          fulfillmentError: `SP-API Warning: ${lastErrorText}`,
        },
      });

      return NextResponse.json({
        success: false,
        warning: true,
        awbNumber: awbToUse,
        message: `AWB ${awbToUse} saved in JNS. Amazon API response: ${lastErrorText}`,
      });
    }

    // Success — update Prisma order
    await prisma.order.update({
      where: { id },
      data: {
        awbNumber: awbToUse,
        trackingNumber: awbToUse,
        status: "SHIPPED",
        amazonOrderStatus: "Shipped",
        fulfillmentError: null,
      },
    });

    return NextResponse.json({
      success: true,
      awbNumber: awbToUse,
      message: `✅ Shipment confirmed on Amazon with Carrier "${acceptedCarrier}" & Tracking ID ${awbToUse}!`,
    });
  } catch (error: any) {
    console.error("[Amazon Confirm Shipment Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm shipment on Amazon." },
      { status: 500 },
    );
  }
}
