"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cancelShiprocketOrder } from "@/lib/shiprocket";
import { refundRazorpayPayment } from "@/lib/razorpay";
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

export async function syncSingleAmazonOrderAction(
  amazonOrderId: string,
  orderId?: string,
) {
  try {
    const storefrontUrl =
      process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in";
    const cronSecret =
      process.env.CRON_SECRET || "james_and_sons_automation_secure_88";

    const res = await fetch(
      `${storefrontUrl}/api/cron/amazon-orders?amazonOrderId=${encodeURIComponent(amazonOrderId)}`,
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
    if (orderId) revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");

    return {
      success: data.success !== false,
      status: data.status,
      message:
        data.message || `Amazon status synced for order ${amazonOrderId}`,
    };
  } catch (error: any) {
    console.error("[Amazon Single Sync Action] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to sync Amazon order.",
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
        shippingPhone: data.shippingPhone,
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
