import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Shiprocket Webhook Handler
 * Endpoint: /api/webhooks/shiprocket
 */
export async function POST(req: Request) {
  try {
    console.log("--- Shiprocket Webhook Debug ---");
    console.log("Headers:", Object.fromEntries(req.headers.entries()));

    let payload;
    try {
      payload = await req.json();
      console.log("Payload:", payload);
    } catch (e) {
      console.log(
        "Empty or invalid JSON body. Responding with 200 for test ping.",
      );
      return NextResponse.json({
        success: true,
        message: "Ready to receive webhooks",
      });
    }

    // Verify security token
    const authHeader = req.headers.get("x-api-key");
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (expectedToken && authHeader !== expectedToken) {
      console.warn(
        `Unauthorized Webhook attempt. Got: ${authHeader}, Expected: ${expectedToken}`,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { event, order_id, awb, channel_order_id } = payload;
    const targetOrderId = channel_order_id
      ? String(channel_order_id)
      : order_id
        ? String(order_id)
        : null;

    // If it's a test payload from Shiprocket without real data, just return 200
    if (!targetOrderId || !event) {
      console.log(
        "Test payload or missing data received. Responding with 200.",
      );
      return NextResponse.json({
        success: true,
        message: "Test notification received",
      });
    }

    // Map Shiprocket events to our Prisma OrderStatus enum
    // enum OrderStatus: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED
    let localStatus: "DELIVERED" | "SHIPPED" | "CANCELLED" | "RETURNED" | null =
      null;

    switch (event.toLowerCase()) {
      case "delivered":
        localStatus = "DELIVERED";
        break;
      case "shipment_dispatch":
      case "shipped":
      case "out_for_delivery":
      case "in_transit":
        localStatus = "SHIPPED";
        break;
      case "canceled":
      case "cancelled":
        localStatus = "CANCELLED";
        break;
      case "return_received":
      case "returned":
        localStatus = "RETURNED";
        break;
      case "ndr":
        console.warn(
          `NDR (Non-Delivery Report) received for order ${targetOrderId}. Manual intervention may be required.`,
        );
        break;
    }

    if (localStatus) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          OR: [{ orderNumber: targetOrderId }, { id: targetOrderId }],
        },
        include: { items: true },
      });

      if (existingOrder) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: localStatus as any,
            awbNumber: awb ? String(awb) : existingOrder.awbNumber || undefined,
          },
        });

        // If order was cancelled or returned, restore product stock
        if (
          (localStatus === "CANCELLED" || localStatus === "RETURNED") &&
          existingOrder.status !== "CANCELLED" &&
          existingOrder.status !== "RETURNED"
        ) {
          for (const item of existingOrder.items) {
            if (item.variantId) {
              await prisma.productVariant
                .update({
                  where: { id: item.variantId },
                  data: { stockQuantity: { increment: item.quantity } },
                })
                .catch(() => {});
            }
            await prisma.product
              .update({
                where: { id: item.productId },
                data: { stockQuantity: { increment: item.quantity } },
              })
              .catch(() => {});
          }
        }

        console.log(
          `Order ${existingOrder.orderNumber} status updated to ${localStatus} via Webhook.`,
        );
      } else {
        console.warn(
          `[Shiprocket Webhook] No order matching orderNumber/id: ${targetOrderId}`,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Shiprocket Webhook Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
