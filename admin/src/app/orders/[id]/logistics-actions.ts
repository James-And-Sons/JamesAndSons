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

function getEarliestPickupDate(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  // Cut-off at 3:00 PM IST (15:00). If past 3 PM IST, schedule for tomorrow
  if (istNow.getUTCHours() >= 15) {
    istNow.setUTCDate(istNow.getUTCDate() + 1);
  }
  return istNow.toISOString().split("T")[0];
}

function parseCourierName(rawName?: string): string {
  if (!rawName) return "Delhivery";
  const lower = rawName.toLowerCase();
  if (lower.includes("bluedart") || lower.includes("blue dart"))
    return "BlueDart";
  if (lower.includes("delhivery")) return "Delhivery";
  if (lower.includes("dtdc")) return "DTDC";
  if (lower.includes("india") || lower.includes("post")) return "India Post";
  if (lower.includes("ecom")) return "Ecom Express";
  if (lower.includes("xpress")) return "Xpressbees";
  if (lower.includes("fedex")) return "FedEx";
  if (lower.includes("dhl")) return "DHL";
  return rawName.split(" ")[0] || "Other";
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

    // Step 1: Book earliest pickup (Today / Tomorrow Morning)
    const earliestDate = getEarliestPickupDate();
    const pickupResult = await requestPickup([shipmentId], earliestDate);
    console.log(
      `[bookShiprocketPickup] requestPickup for date ${earliestDate} result:`,
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
      scheduledDate: earliestDate,
    };
  } catch (err: any) {
    console.error("bookShiprocketPickupAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all official Shiprocket logistics documents (Label PDF, Manifest PDF, Invoice PDF)
 */
export async function getShiprocketDocumentUrlsAction(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const {
      getShiprocketToken,
      generateLabel,
      generateManifest,
      generateInvoice,
    } = await import("@james-andsons/shiprocket");

    let shipmentId: number | null = null;
    let shiprocketOrderDbId: number | null = null;

    if (
      order.awbNumber &&
      !isNaN(parseInt(order.awbNumber)) &&
      order.awbNumber.length < 12
    ) {
      shipmentId = parseInt(order.awbNumber);
    }

    // Always fetch order details from Shiprocket catalog to resolve both shipmentId AND numeric orderDbId
    const token = await getShiprocketToken();
    if (token) {
      const getRes = await fetch(
        `https://apiv2.shiprocket.in/v1/external/orders?per_page=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (getRes.ok) {
        const getData = await getRes.json();
        const ordersList: any[] = getData.data || [];
        const match = ordersList.find((o: any) => {
          const channelId = String(o.channel_order_id || "");
          const orderNum = String(order.orderNumber || "");
          const awbInShipment = o.shipments?.some(
            (s: any) =>
              String(s.id) === String(order.awbNumber) ||
              String(s.awb) === String(order.trackingNumber),
          );
          return (
            channelId.includes(orderNum) ||
            orderNum.includes(channelId) ||
            String(o.order_id || "").includes(orderNum) ||
            awbInShipment
          );
        });

        if (match) {
          shiprocketOrderDbId = match.id;
          if (match.shipments && match.shipments.length > 0) {
            const foundShipmentId = match.shipments[0].id;
            shipmentId = foundShipmentId;
            if (order.awbNumber !== foundShipmentId.toString()) {
              await prisma.order.update({
                where: { id: orderId },
                data: { awbNumber: foundShipmentId.toString() },
              });
            }
          }
        }
      }
    }

    if (!shipmentId) {
      return {
        success: false,
        error: "Shipment ID not found on Shiprocket catalog for this order.",
      };
    }

    const [labelUrl, manifestUrl, invoiceUrl] = await Promise.all([
      generateLabel([shipmentId]),
      generateManifest([shipmentId]),
      shiprocketOrderDbId
        ? generateInvoice([shiprocketOrderDbId])
        : generateLabel([shipmentId]),
    ]);

    const finalInvoiceUrl = invoiceUrl || labelUrl;
    const finalManifestUrl = manifestUrl || labelUrl;

    return {
      success: true,
      labelUrl,
      manifestUrl: finalManifestUrl,
      invoiceUrl: finalInvoiceUrl,
      shipmentId,
    };
  } catch (err: any) {
    console.error("getShiprocketDocumentUrlsAction error:", err);
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
    let courierName = "Delhivery";

    // Case 0: Order is ALREADY fully booked in Shiprocket (has both awbNumber and trackingNumber)
    if (order.awbNumber && order.trackingNumber) {
      console.log(
        `[RetryLogistics] Order #${order.orderNumber} is already fully booked in Shiprocket (AWB: ${order.trackingNumber}). Skipping duplicate creation.`,
      );
      return {
        success: true,
        trackingNumber: order.trackingNumber,
        awbNumber: order.awbNumber,
        courierName: "Delhivery",
        alreadyBooked: true,
        message: `Order #${order.orderNumber} is already booked in Shiprocket (AWB: ${order.trackingNumber}).`,
      };
    }

    let needNewShipment = !order.awbNumber || !order.trackingNumber;

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
        courierName = parseCourierName(awbRes.courier_name);
        fulfillmentError = null;
        finalStatus = "PROCESSING";
        needNewShipment = false;

        // Schedule earliest pickup immediately
        await requestPickup(
          [parseInt(order.awbNumber)],
          getEarliestPickupDate(),
        );
      } else {
        console.log(
          `[RetryLogistics] Stored shipment ID ${order.awbNumber} AWB assignment failed (${awbRes.message}). Falling back to fresh shipment creation on Shiprocket...`,
        );
        awbNumber = null;
        needNewShipment = true;
      }
    }

    if (needNewShipment) {
      // Case 2: Order was never created in Shiprocket. Create order + assign AWB + request pickup.
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

      let shipRes = await createShiprocketOrder(shiprocketParams);

      // If order_id already exists or was cancelled on Shiprocket catalog, retry with a fresh unique order_id suffix
      if (!shipRes.success) {
        const errorMsg =
          typeof shipRes.message === "object"
            ? JSON.stringify(shipRes.message)
            : String(shipRes.message || "");

        if (
          errorMsg.includes("already assigned") ||
          errorMsg.includes("already exists") ||
          errorMsg.includes("CANCELLED") ||
          errorMsg.includes("CANCELED")
        ) {
          const uniqueOrderId = `${order.orderNumber}-R${Date.now().toString().slice(-4)}`;
          console.log(
            `[RetryLogistics] Previous Shiprocket order collision detected. Retrying with unique order_id: ${uniqueOrderId}...`,
          );
          shipRes = await createShiprocketOrder({
            ...shiprocketParams,
            order_id: uniqueOrderId,
          });
        }
      }

      if (shipRes.success && shipRes.shipment_id) {
        awbNumber = shipRes.shipment_id.toString();
        console.log(
          `[RetryLogistics] Shiprocket order created successfully. Shipment ID: ${shipRes.shipment_id}`,
        );

        let awbRes = await assignAWB(shipRes.shipment_id);

        // If assignAWB fails because Shiprocket returned an old cancelled shipment ID, force fresh unique order creation
        if (!awbRes.success) {
          const errorMsg =
            typeof awbRes.message === "object"
              ? JSON.stringify(awbRes.message)
              : String(awbRes.message || "");

          if (
            errorMsg.includes("already assigned") ||
            errorMsg.includes("CANCELLED") ||
            errorMsg.includes("CANCELED")
          ) {
            const uniqueOrderId = `${order.orderNumber}-R${Date.now().toString().slice(-4)}`;
            console.log(
              `[RetryLogistics] Shipment ID ${shipRes.shipment_id} returned cancelled AWB error. Creating fresh order with unique ID ${uniqueOrderId}...`,
            );

            const freshShipRes = await createShiprocketOrder({
              ...shiprocketParams,
              order_id: uniqueOrderId,
            });

            if (freshShipRes.success && freshShipRes.shipment_id) {
              awbNumber = freshShipRes.shipment_id.toString();
              awbRes = await assignAWB(freshShipRes.shipment_id);
            }
          }
        }

        if (awbRes.success) {
          trackingNumber = awbRes.awb_code;
          courierName = parseCourierName(awbRes.courier_name);
          fulfillmentError = null;
          finalStatus = "PROCESSING";

          // Schedule earliest pickup immediately
          if (awbNumber) {
            await requestPickup([parseInt(awbNumber)], getEarliestPickupDate());
          }
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
    return { success: true, trackingNumber, awbNumber, courierName };
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
