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
      await import("../../../../../../../storefront/src/lib/amazon-sp-api");

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

    // Build list of valid Indian Amazon carrier candidates
    const carrierCandidates = Array.from(
      new Set(
        [
          carrierName?.trim(),
          "Delhivery",
          "BlueDart",
          "DTDC",
          "India Post",
          "Ecom Express",
          "FedEx",
          "DHL",
          "Other",
        ].filter(Boolean),
      ),
    ) as string[];

    const spPath = `/orders/v0/orders/${order.amazonOrderId}/shipmentConfirmation`;
    let isSuccess = false;
    let lastErrorText = "";
    let acceptedCarrier = "";

    for (const carrier of carrierCandidates) {
      console.log(
        `[Amazon SP-API] Attempting shipment confirmation for ${order.amazonOrderId} (AWB: ${awbToUse}) with carrierCode: "${carrier}"...`,
      );

      const shipmentPayload = {
        marketplaceId: config.marketplaceId,
        packageDetail: {
          packageReferenceId: "1",
          carrierCode: carrier,
          carrierName: carrier === "Other" ? "Other" : carrier,
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
