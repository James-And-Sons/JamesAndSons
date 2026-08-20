"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cancelShiprocketOrder } from "@/lib/shiprocket";
import { refundRazorpayPayment } from "@/lib/razorpay";
import { sendNotificationToAllAdmins } from "@/lib/push";
import {
  validateStateTransition,
  createCreditNoteForOrder,
} from "@/lib/accounting/state-machine";

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Validate state transition compliance
    const isValidTransition = validateStateTransition(order.status, status);
    if (!isValidTransition) {
      throw new Error(
        `Illegal state transition from ${order.status} to ${status}. GST compliance rules violated.`,
      );
    }

    const isCancellation =
      status === "CANCELLED" ||
      status === "CANCELLED_PRE_INVOICE" ||
      status === "CANCELLED_POST_INVOICE";
    const isReturn = status === "RETURNED" || status === "RTO_COMPLETED";

    if (isCancellation && order.status !== "CANCELLED") {
      let notes = [];

      // 1. If there's a Shiprocket order synced, cancel it
      if (order.awbNumber) {
        console.log(
          `[CancelOrder] Attempting to cancel Shiprocket order for JNS order number: ${order.orderNumber}`,
        );
        const logisticsRes = await cancelShiprocketOrder(order.orderNumber);
        if (logisticsRes.success) {
          notes.push("Shiprocket order cancelled.");
        } else {
          notes.push(`Logistics cancel failed: ${logisticsRes.message}`);
        }
      }

      // 2. If it was a paid order (Razorpay payment captured), initiate a full refund
      if (order.razorpayPaymentId) {
        console.log(
          `[CancelOrder] Attempting to refund payment ID: ${order.razorpayPaymentId} for JNS order: ${order.orderNumber}`,
        );
        try {
          const refund = await refundRazorpayPayment(
            order.razorpayPaymentId,
            undefined,
            `Order #${order.orderNumber} cancelled via Admin Portal`,
          );
          notes.push(`Refund initiated (ID: ${refund.id}).`);
        } catch (refundError: any) {
          console.error("[CancelOrder] Razorpay refund failed:", refundError);
          notes.push(
            `Refund failed: ${refundError.message || "Unknown Error"}`,
          );
        }
      }

      // 3. Issue GST Credit Note if tax invoice was issued
      try {
        const cnReason =
          status === "CANCELLED_PRE_INVOICE"
            ? "PRE_DISPATCH_CANCEL"
            : "PRE_DISPATCH_CANCEL";
        const cn = await createCreditNoteForOrder(order.id, cnReason);
        notes.push(
          `Credit Note issued: ${cn.creditNoteNumber} (${cn.creditNoteType}).`,
        );
      } catch (cnError: any) {
        console.warn(
          "[CancelOrder] Credit Note creation notice:",
          cnError.message,
        );
      }

      const fulfillmentError = notes.join(" | ");

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: status as any,
          fulfillmentError: fulfillmentError || null,
        },
      });
    } else if (isReturn) {
      let notes = [];
      try {
        const cnReason = status === "RTO_COMPLETED" ? "RTO" : "CUSTOMER_RETURN";
        const cn = await createCreditNoteForOrder(order.id, cnReason);
        notes.push(
          `Credit Note issued: ${cn.creditNoteNumber} (${cn.creditNoteType}).`,
        );
      } catch (cnError: any) {
        console.warn(
          "[ReturnOrder] Credit Note creation notice:",
          cnError.message,
        );
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: status as any,
          fulfillmentError: notes.join(" | ") || null,
        },
      });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: status as any },
      });
    }

    sendNotificationToAllAdmins({
      title: `${isCancellation ? "🛑 Order Cancelled" : isReturn ? "↩️ Order Returned" : "📦 Order Updated"} #${order.orderNumber}`,
      body: `Order #${order.orderNumber} status updated to ${status}.`,
      url: `/orders/${order.id}`,
      type: "ORDER",
    }).catch((err) =>
      console.error("[Admin Order Actions] Push notification failed:", err),
    );

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTrackingNumber(
  orderId: string,
  trackingNumber: string,
  awbNumber: string,
) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: trackingNumber || null,
        awbNumber: awbNumber || null,
        status: "SHIPPED",
      },
    });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncAmazonOrdersAction(minutesBack: number = 1440) {
  try {
    const storefrontUrl =
      process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in";
    const cronSecret =
      process.env.CRON_SECRET || "james_and_sons_automation_secure_88";

    const res = await fetch(
      `${storefrontUrl}/api/cron/amazon-orders?minutes=${minutesBack}`,
      {
        headers: { Authorization: `Bearer ${cronSecret}` },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cron trigger returned ${res.status}: ${text}`);
    }

    const data = await res.json();
    revalidatePath("/orders");
    return {
      success: true,
      stats: data,
      message: `Fetched ${data.fetched || 0} Amazon order(s), ingested ${data.ingested || 0}, skipped ${data.skipped || 0}.`,
    };
  } catch (error: any) {
    console.error("[Amazon Order Sync Action] Error:", error);
    return {
      success: false,
      error: error.message || "Amazon order sync failed.",
    };
  }
}

export async function syncFlipkartOrdersAction() {
  try {
    const storefrontUrl =
      process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in";
    const cronSecret =
      process.env.CRON_SECRET || "james_and_sons_automation_secure_88";

    const res = await fetch(`${storefrontUrl}/api/cron/flipkart-sync`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Flipkart sync trigger returned ${res.status}: ${text}`);
    }

    const data = await res.json();
    revalidatePath("/orders");
    const stats = data.stats || {};
    return {
      success: true,
      stats: data,
      message: `Fetched ${stats.fetched || 0} Flipkart order(s), ingested ${stats.ingested || 0}, skipped ${stats.skipped || 0}.`,
    };
  } catch (error: any) {
    console.error("[Flipkart Order Sync Action] Error:", error);
    return {
      success: false,
      error: error.message || "Flipkart order sync failed.",
    };
  }
}

export async function syncSingleAmazonOrderAction(
  targetId: string,
  orderId?: string,
) {
  try {
    let resolvedAmazonOrderId = targetId;
    let resolvedDbOrderId = orderId || targetId;

    // Check if targetId is a DB UUID or internal orderNumber rather than an Amazon Order ID (format: 40X-XXXXXXX-XXXXXXX)
    if (!targetId.includes("-") || targetId.length > 25) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: targetId }, { orderNumber: targetId }],
        },
        select: { id: true, amazonOrderId: true, orderNumber: true },
      });
      if (order?.amazonOrderId) {
        resolvedAmazonOrderId = order.amazonOrderId;
        resolvedDbOrderId = order.id;
      }
    }

    const storefrontUrl =
      process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in";
    const cronSecret =
      process.env.CRON_SECRET || "james_and_sons_automation_secure_88";

    const res = await fetch(
      `${storefrontUrl}/api/cron/amazon-orders?amazonOrderId=${encodeURIComponent(resolvedAmazonOrderId)}`,
      {
        headers: { Authorization: `Bearer ${cronSecret}` },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Amazon sync endpoint returned ${res.status}: ${text}`);
    }

    const data = await res.json();
    if (resolvedDbOrderId) revalidatePath(`/orders/${resolvedDbOrderId}`);
    revalidatePath("/orders");

    return {
      success: data.success !== false,
      status: data.status,
      message:
        data.message ||
        `Amazon status synced for order ${resolvedAmazonOrderId}`,
    };
  } catch (error: any) {
    console.error("[Amazon Single Sync Action] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to sync Amazon order.",
      message: error.message || "Failed to sync Amazon order.",
    };
  }
}

export async function updateOrderAddressAction(
  orderId: string,
  data: {
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
    shippingPhone?: string;
  },
) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPincode: data.shippingPincode,
      },
    });
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    console.error("updateOrderAddressAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to update shipping address",
    };
  }
}

export async function resetAmazonOrderShipmentAction(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    if (order.awbNumber) {
      console.log(
        `[ResetAmazonOrder] Cancelling active courier AWB/Shipment ${order.awbNumber}...`,
      );
      const { cancelShiprocketShipment } =
        await import("@james-andsons/shiprocket");
      await cancelShiprocketShipment(order.awbNumber).catch((err) =>
        console.warn("[ResetAmazonOrder] Shiprocket AWB cancel warning:", err),
      );
    }

    if (order.orderNumber) {
      console.log(
        `[ResetAmazonOrder] Cancelling Shiprocket order ${order.orderNumber}...`,
      );
      await cancelShiprocketOrder(order.orderNumber).catch((err) =>
        console.warn("[ResetAmazonOrder] Shiprocket cancel warning:", err),
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        awbNumber: null,
        trackingNumber: null,
        fulfillmentError: null,
        status: "PAID",
        amazonOrderStatus: "Unshipped",
      },
    });

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return {
      success: true,
      message: `Shipment reset for order #${order.orderNumber}. Wallet refund requested on Shiprocket.`,
    };
  } catch (err: any) {
    console.error("resetAmazonOrderShipmentAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to reset order shipment",
    };
  }
}

export async function updateOrderFulfillmentTypeAction(
  orderId: string,
  fulfillmentType: "EASY_SHIP" | "SELF_SHIP",
) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { amazonFulfillmentType: fulfillmentType },
    });
    revalidatePath(`/orders/${orderId}`);
    return {
      success: true,
      message: `Updated fulfillment mode to ${fulfillmentType === "EASY_SHIP" ? "Easy Ship" : "Self-Ship"}.`,
    };
  } catch (err: any) {
    console.error("updateOrderFulfillmentTypeAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to update fulfillment type",
    };
  }
}

export async function syncShiprocketStatusesAction() {
  try {
    const { trackShipment } = await import("@james-andsons/shiprocket");

    // Fetch active orders (status PROCESSING or SHIPPED) with an AWB or tracking number
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { in: ["PROCESSING", "SHIPPED"] },
        NOT: { awbNumber: null },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        awbNumber: true,
        trackingNumber: true,
        shippingPhone: true,
        user: { select: { phone: true, firstName: true } },
      },
      take: 50, // Process up to 50 active shipments per batch to remain lightweight
    });

    if (activeOrders.length === 0) {
      return {
        success: true,
        message: "No active shipments requiring status sync.",
        updatedCount: 0,
      };
    }

    let updatedCount = 0;
    const updates: Array<{
      orderNumber: string;
      oldStatus: string;
      newStatus: string;
    }> = [];

    for (const order of activeOrders) {
      const awbToTrack = order.awbNumber || order.trackingNumber;
      if (!awbToTrack) continue;

      const trackRes = await trackShipment(awbToTrack);
      if (!trackRes.success || !trackRes.status) continue;

      const shiprocketStatusStr = (trackRes.status || "").toUpperCase();
      let newStatus: "DELIVERED" | "SHIPPED" | "CANCELLED" | "RETURNED" | null =
        null;

      if (shiprocketStatusStr.includes("DELIVERED")) {
        newStatus = "DELIVERED";
      } else if (
        shiprocketStatusStr.includes("TRANSIT") ||
        shiprocketStatusStr.includes("OUT FOR DELIVERY") ||
        shiprocketStatusStr.includes("SHIPPED") ||
        shiprocketStatusStr.includes("DISPATCHED")
      ) {
        newStatus = "SHIPPED";
      } else if (shiprocketStatusStr.includes("CANCEL")) {
        newStatus = "CANCELLED";
      } else if (
        shiprocketStatusStr.includes("RETURN") ||
        shiprocketStatusStr.includes("RTO")
      ) {
        newStatus = "RETURNED";
      }

      if (newStatus && newStatus !== order.status) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: newStatus as any },
        });

        updatedCount++;
        updates.push({
          orderNumber: order.orderNumber,
          oldStatus: order.status,
          newStatus,
        });

        // Dispatch Admin PWA Push Notification
        sendNotificationToAllAdmins({
          title: `🚚 Order #${order.orderNumber} ${newStatus === "DELIVERED" ? "Delivered!" : "Updated"}`,
          body: `Order #${order.orderNumber} status changed to ${newStatus} (Shiprocket: ${trackRes.status}).`,
          url: `/orders/${order.id}`,
          type: "ORDER",
        }).catch((err) =>
          console.error("[Shiprocket Status Sync Push Error]", err),
        );
      }
    }

    revalidatePath("/orders");
    revalidatePath("/logistics");

    return {
      success: true,
      message: `Synced ${activeOrders.length} active order(s). ${updatedCount} status update(s) applied.`,
      updatedCount,
      updates,
    };
  } catch (error: any) {
    console.error("[syncShiprocketStatusesAction Error]", error);
    return {
      success: false,
      error: error.message || "Failed to sync Shiprocket order statuses",
    };
  }
}
