"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { razorpay } from "@/lib/razorpay";
import { getShiprocketToken } from "@/lib/shiprocket";

export async function syncRazorpayPayment(
  orderId: string,
  razorpayOrderId: string,
) {
  try {
    const payments = await razorpay.orders.fetchPayments(razorpayOrderId);
    const capturedPayment = payments.items.find(
      (p: any) => p.status === "captured",
    );

    if (capturedPayment) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          razorpayPaymentId: capturedPayment.id,
        },
      });
      revalidatePath(`/orders/${orderId}`);
      return { success: true, status: "PAID" };
    }

    return { success: false, error: "No captured payment found in Razorpay" };
  } catch (error: any) {
    console.error("syncRazorpayPayment error:", error);
    return { success: false, error: error.message };
  }
}

export async function trackShiprocketShipment(awbNumber: string) {
  try {
    const token = await getShiprocketToken();
    if (!token) throw new Error("Shiprocket authentication failed");

    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbNumber}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json();
    return { success: true, data: data.tracking_data };
  } catch (error: any) {
    console.error("trackShiprocketShipment error:", error);
    return { success: false, error: error.message };
  }
}

import {
  generateLabel,
  requestPickup,
  createShiprocketOrder,
  assignAWB,
} from "@/lib/shiprocket";

/**
 * Fetch the real Shiprocket label PDF URL for an order.
 * Uses order.awbNumber as Shiprocket numeric shipment ID.
 */
export async function getShiprocketLabelAction(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.awbNumber) {
      return {
        success: false,
        error: "No Shiprocket shipment ID found for this order.",
      };
    }

    const shipmentId = parseInt(order.awbNumber);
    if (isNaN(shipmentId)) {
      return {
        success: false,
        error: `awbNumber "${order.awbNumber}" is not a numeric Shiprocket shipment ID.`,
      };
    }

    const url = await generateLabel([shipmentId]);
    if (!url) {
      return {
        success: false,
        error:
          "Shiprocket returned no label URL. Pickup may not yet be scheduled.",
      };
    }
    return { success: true, labelUrl: url };
  } catch (err: any) {
    console.error("getShiprocketLabelAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Book Shiprocket pickup + fetch official label URL in one click.
 * orderId → look up numeric shipment ID from DB → requestPickup → generateLabel.
 */
export async function bookShiprocketPickupAction(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.awbNumber) {
      return {
        success: false,
        error:
          "No Shiprocket shipment ID on record. Please retry Shiprocket sync first.",
      };
    }

    const shipmentId = parseInt(order.awbNumber);
    if (isNaN(shipmentId)) {
      return {
        success: false,
        error: `Stored awbNumber "${order.awbNumber}" is not a numeric Shiprocket shipment ID.`,
      };
    }

    // Step 1: Book pickup
    const pickupResult = await requestPickup([shipmentId]);
    console.log(
      "[bookShiprocketPickup] requestPickup result:",
      JSON.stringify(pickupResult),
    );

    // Shiprocket returns 409 if pickup already scheduled — treat as success
    const pickupScheduled =
      pickupResult?.status === 1 ||
      pickupResult?.pickup_scheduled_date ||
      pickupResult?.response?.data?.pickup_scheduled_date ||
      pickupResult?.status === 409;

    // Step 2: Generate the official Shiprocket label PDF
    const labelUrl = await generateLabel([shipmentId]);
    console.log("[bookShiprocketPickup] generateLabel URL:", labelUrl);

    revalidatePath(`/orders/${orderId}`);

    return {
      success: true,
      pickupScheduled,
      pickupResult,
      labelUrl,
    };
  } catch (err: any) {
    console.error("bookShiprocketPickupAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function retryLogisticsSync(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    let trackingNumber = order.trackingNumber;
    let awbNumber = order.awbNumber;
    let fulfillmentError = order.fulfillmentError;
    let finalStatus = order.status;

    // Case 1: Order already created in Shiprocket (we have shipment ID in awbNumber), but AWB assignment failed.
    if (
      order.awbNumber &&
      !isNaN(parseInt(order.awbNumber)) &&
      !order.trackingNumber
    ) {
      console.log(
        `[RetryLogistics] Shipment already exists (ID: ${order.awbNumber}). Assigning AWB...`,
      );
      const awbRes = await assignAWB(parseInt(order.awbNumber));

      if (awbRes.success) {
        trackingNumber = awbRes.awb_code;
        fulfillmentError = null;
        finalStatus = "PROCESSING";
      } else {
        fulfillmentError = `Order created, but AWB failed: ${awbRes.message}`;
        throw new Error(awbRes.message || "AWB Assignment failed");
      }
    } else {
      // Case 2: Order was never created in Shiprocket. Create order + assign AWB.
      console.log(`[RetryLogistics] Creating new Shiprocket order...`);
      const parts = order.shippingAddress.split(", ");
      const pincodeStr =
        parts.pop()?.split(" - ")[1] || order.shippingPincode || "110030";
      const stateStr = parts.pop() || order.shippingState || "";
      const cityStr = parts.pop() || order.shippingCity || "";
      const addrStr = parts.join(", ") || order.shippingAddress;

      const firstProduct = order.items[0]?.product;
      const length = firstProduct?.length || 10;
      const breadth = firstProduct?.breadth || 10;
      const height = firstProduct?.height || 10;
      const weight = firstProduct?.weight || 0.5;

      const shiprocketParams = {
        order_id: order.orderNumber,
        order_date: order.createdAt.toISOString().split("T")[0],
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
        billing_customer_name: order.user.firstName,
        billing_last_name: order.user.lastName,
        billing_address: addrStr,
        billing_city: cityStr,
        billing_pincode: pincodeStr,
        billing_state: stateStr,
        billing_country: "India",
        billing_email: order.user.email.trim().toLowerCase(),
        billing_phone:
          (order.shippingPhone || order.user.phone || "9999999999")
            .replace(/\D/g, "")
            .slice(-10) || "9999999999",
        shipping_is_billing: true,
        order_items: order.items.map((item) => ({
          name: item.product.name,
          sku: item.product.sku,
          units: item.quantity,
          selling_price: item.unitPrice,
        })),
        payment_method: "Prepaid",
        sub_total: order.totalAmount - order.taxAmount - order.shippingAmount,
        length,
        breadth,
        height,
        weight,
      };

      const shipRes = await createShiprocketOrder(shiprocketParams);

      if (shipRes.success) {
        awbNumber = shipRes.shipment_id?.toString();
        console.log(
          `[RetryLogistics] Shiprocket order created successfully. Shipment ID: ${shipRes.shipment_id}`,
        );

        const awbRes = await assignAWB(shipRes.shipment_id);

        if (awbRes.success) {
          trackingNumber = awbRes.awb_code;
          fulfillmentError = null;
          finalStatus = "PROCESSING";
        } else {
          fulfillmentError = `Order created, but AWB failed: ${awbRes.message}`;
          throw new Error(awbRes.message || "AWB Assignment failed");
        }
      } else {
        const errorMsg =
          typeof shipRes.message === "object"
            ? JSON.stringify(shipRes.message)
            : shipRes.message || "Unknown Shiprocket Error";
        fulfillmentError = errorMsg;
        throw new Error(errorMsg);
      }
    }

    // Save final status back to the order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        awbNumber,
        fulfillmentError,
        status: finalStatus as any,
      },
    });

    revalidatePath(`/orders/${orderId}`);
    return { success: true, trackingNumber, awbNumber };
  } catch (error: any) {
    console.error("retryLogisticsSync error:", error);
    // Update the error note on database
    await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentError: error.message || "Fulfillment sync retry failed",
      },
    });
    revalidatePath(`/orders/${orderId}`);
    return { success: false, error: error.message };
  }
}

export interface AmazonMfnRateResult {
  success: boolean;
  services?: Array<{
    shippingServiceId: string;
    shippingServiceName: string;
    carrierName: string;
    rateAmount: number;
    currencyCode: string;
  }>;
  error?: string;
}

export interface AmazonMfnBookResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  error?: string;
}

export async function getAmazonMfnRatesAction(
  orderId: string,
): Promise<AmazonMfnRateResult> {
  try {
    const { getEligibleShippingServices } =
      await import("../../../../../storefront/src/lib/integrations/amazon-mfn");
    const result = await getEligibleShippingServices(orderId);
    return result;
  } catch (error: any) {
    console.error("getAmazonMfnRatesAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch Amazon shipping rates",
    };
  }
}

export async function bookAmazonMfnShipmentAction(
  orderId: string,
  shippingServiceId?: string,
): Promise<AmazonMfnBookResult> {
  try {
    const { createAmazonMfnShipment } =
      await import("../../../../../storefront/src/lib/integrations/amazon-mfn");
    const result = await createAmazonMfnShipment(orderId, shippingServiceId);
    revalidatePath(`/orders/${orderId}`);
    return result;
  } catch (error: any) {
    console.error("bookAmazonMfnShipmentAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to book Amazon shipment",
    };
  }
}
