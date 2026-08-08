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

    const knownCarriers = [
      "BlueDart",
      "Delhivery",
      "DTDC",
      "India Post",
      "FedEx",
      "DHL",
    ];
    const isKnown = knownCarriers.some(
      (c) => c.toLowerCase() === carrierName.trim().toLowerCase(),
    );
    const finalCarrierCode = isKnown ? carrierName.trim() : "Other";

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

    const shipmentPayload = {
      marketplaceId: config.marketplaceId,
      packageDetail: {
        packageReferenceId: "1",
        carrierCode: finalCarrierCode,
        carrierName: carrierName || "Shiprocket",
        shippingService: shippingService || "Standard",
        trackingNumber: awbToUse,
        shipDate: new Date().toISOString(),
        orderItems: orderItemsPayload,
      },
    };

    const spPath = `/orders/v0/orders/${order.amazonOrderId}/shipmentConfirmation`;
    console.log(
      `[Amazon SP-API] Confirming shipment for order ${order.amazonOrderId} with AWB ${awbToUse}...`,
    );

    let res = await signedSpApiFetch(spPath, accessToken, config, {
      method: "POST",
      body: JSON.stringify(shipmentPayload),
    });

    // If Amazon SP-API returns InvalidCarrier, automatically fallback to carrierCode: "Other", carrierName: "Other"
    if (!res.ok) {
      const errorText = await res.text();
      console.warn(
        `[Amazon SP-API] First attempt error: ${res.status} — ${errorText}`,
      );

      if (errorText.includes("InvalidCarrier")) {
        console.log(
          "[Amazon SP-API] Retrying shipment confirmation with fallback carrierCode: 'Other', carrierName: 'Other'...",
        );
        const fallbackPayload = {
          marketplaceId: config.marketplaceId,
          packageDetail: {
            ...shipmentPayload.packageDetail,
            carrierCode: "Other",
            carrierName: "Other",
          },
        };
        res = await signedSpApiFetch(spPath, accessToken, config, {
          method: "POST",
          body: JSON.stringify(fallbackPayload),
        });
      }

      if (!res.ok) {
        const finalErrorText = await res.text();
        console.error(
          `[Amazon SP-API] Final shipment confirmation error: ${res.status} — ${finalErrorText}`,
        );

        // Update local DB status & tracking even if Amazon SP-API requires manual fallback
        await prisma.order.update({
          where: { id },
          data: {
            awbNumber: awbToUse,
            trackingNumber: awbToUse,
            status: "SHIPPED",
            amazonOrderStatus: "Shipped",
            fulfillmentError: `SP-API Warning: ${finalErrorText}`,
          },
        });

        return NextResponse.json({
          success: false,
          warning: true,
          awbNumber: awbToUse,
          message: `AWB ${awbToUse} saved in JNS. Amazon API response: ${finalErrorText}`,
        });
      }
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
      message: `✅ Shipment confirmed on Amazon with Tracking ID ${awbToUse}!`,
    });
  } catch (error: any) {
    console.error("[Amazon Confirm Shipment Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm shipment on Amazon." },
      { status: 500 },
    );
  }
}
