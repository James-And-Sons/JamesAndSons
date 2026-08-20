/**
 * Amazon SP-API — Order Ingestion
 *
 * Fetches new "Unshipped" orders from Amazon Seller Central and ingests them
 * into the JNS database, ready for the standard fulfillment pipeline.
 *
 * SP-API references:
 *   GET /orders/v0/orders
 *   GET /orders/v0/orders/{orderId}/orderItems
 */
import { prisma } from "../prisma";
import { sendNotificationToAllAdmins } from "../push";
import {
  getLwaAccessToken,
  getRestrictedDataToken,
  getAmazonConfig,
  signedSpApiFetch,
} from "../amazon-sp-api";

// ---------------------------------------------------------------------------
// Types (minimal subset of SP-API Order response)
// ---------------------------------------------------------------------------

interface AmazonAddress {
  Name: string;
  AddressLine1: string;
  AddressLine2?: string;
  City: string;
  StateOrRegion: string;
  PostalCode: string;
  CountryCode: string;
  Phone?: string;
}

interface AmazonOrderItem {
  ASIN: string;
  SellerSKU: string;
  OrderItemId: string;
  Title: string;
  QuantityOrdered: number;
  ItemPrice?: { Amount: string; CurrencyCode: string };
  ItemTax?: { Amount: string; CurrencyCode: string };
}

interface AmazonOrder {
  AmazonOrderId: string;
  OrderStatus: string;
  PurchaseDate: string;
  ShippingAddress?: AmazonAddress;
  BuyerInfo?: { BuyerEmail?: string; BuyerName?: string };
  OrderTotal?: { Amount: string; CurrencyCode: string };
  NumberOfItemsShipped: number;
  NumberOfItemsUnshipped: number;
  FulfillmentChannel: string; // MFN (merchant) or AFN (Amazon)
  // Easy Ship orders have this field; absent = Self-Ship MFN
  EasyShipShipmentStatus?: string; // PendingPickUp | PickedUp | OutForDelivery | Delivered | ...
}

// ---------------------------------------------------------------------------
// Fetch new unshipped orders from SP-API
// ---------------------------------------------------------------------------

export async function fetchNewAmazonOrders(
  minutesBack = 1440,
): Promise<AmazonOrder[]> {
  const config = getAmazonConfig();
  const accessToken = await getRestrictedDataToken([
    "buyerInfo",
    "shippingAddress",
  ]);

  const lastUpdatedAfter = new Date(
    Date.now() - minutesBack * 60 * 1000,
  ).toISOString();

  // Query unshipped, partially shipped, shipped, and canceled orders across MFN & AFN channels
  const statuses = "Unshipped,PartiallyShipped,Shipped,Canceled";
  const path = `/orders/v0/orders?MarketplaceIds=${config.marketplaceId}&LastUpdatedAfter=${encodeURIComponent(lastUpdatedAfter)}&OrderStatuses=${statuses}`;

  console.log(
    `[Amazon Orders] Fetching Amazon orders updated after ${lastUpdatedAfter} with RDT...`,
  );
  const res = await signedSpApiFetch(path, accessToken, config);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `[Amazon Orders] GET /orders/v0/orders failed: ${res.status} — ${text}`,
    );
  }

  const data = await res.json();
  const orders: AmazonOrder[] = data?.payload?.Orders || [];
  console.log(`[Amazon Orders] Found ${orders.length} updated Amazon orders.`);
  return orders;
}

// ---------------------------------------------------------------------------
// Sync single Amazon order by Amazon Order ID
// ---------------------------------------------------------------------------

export async function syncSingleAmazonOrder(
  amazonOrderId: string,
): Promise<{ success: boolean; status?: string; message?: string }> {
  try {
    const config = getAmazonConfig();
    const accessToken = await getRestrictedDataToken([
      "buyerInfo",
      "shippingAddress",
    ]);
    const path = `/orders/v0/orders/${amazonOrderId}`;

    console.log(
      `[Amazon Sync] Fetching SP-API details for Amazon order: ${amazonOrderId}`,
    );
    const res = await signedSpApiFetch(path, accessToken, config);
    if (!res.ok) {
      const text = await res.text();
      return { success: false, message: `SP-API error ${res.status}: ${text}` };
    }

    const data = await res.json();
    const amazonOrder: AmazonOrder = data?.payload;
    if (!amazonOrder) {
      return {
        success: false,
        message: "No order payload returned from Amazon SP-API",
      };
    }

    const items = await getAmazonOrderItems(amazonOrderId);
    const jnsId = await ingestAmazonOrder(amazonOrder, items);

    return {
      success: true,
      status: amazonOrder.OrderStatus,
      message: `Synced Amazon order ${amazonOrderId} successfully.`,
    };
  } catch (err: any) {
    console.error(
      `[Amazon Sync] Failed to sync single Amazon order ${amazonOrderId}:`,
      err,
    );
    return { success: false, message: err?.message || "Internal sync error" };
  }
}

// ---------------------------------------------------------------------------
// Fetch order items for a specific Amazon order
// ---------------------------------------------------------------------------

export async function getAmazonOrderItems(
  amazonOrderId: string,
): Promise<AmazonOrderItem[]> {
  const config = getAmazonConfig();
  const accessToken = await getLwaAccessToken();

  const path = `/orders/v0/orders/${amazonOrderId}/orderItems`;
  const res = await signedSpApiFetch(path, accessToken, config);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `[Amazon Orders] GET order items failed for ${amazonOrderId}: ${res.status} — ${text}`,
    );
  }

  const data = await res.json();
  return data?.payload?.OrderItems || [];
}

// ---------------------------------------------------------------------------
// Ingest or update a single Amazon order in JNS database
// ---------------------------------------------------------------------------

export async function ingestAmazonOrder(
  amazonOrder: AmazonOrder,
  items: AmazonOrderItem[],
): Promise<string | null> {
  const { AmazonOrderId } = amazonOrder;

  // Map Amazon OrderStatus to Prisma enum OrderStatus
  let mappedStatus:
    "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" =
    "PAID";
  const amzStatus = amazonOrder.OrderStatus;
  if (amzStatus === "Shipped" || amzStatus === "PartiallyShipped") {
    mappedStatus = "SHIPPED";
  } else if (amzStatus === "Delivered") {
    mappedStatus = "DELIVERED";
  } else if (amzStatus === "Canceled") {
    mappedStatus = "CANCELLED";
  }

  // If order already exists in DB, update status and tracking info
  const existing = await prisma.order.findUnique({
    where: { amazonOrderId: AmazonOrderId },
    include: { items: true },
  });

  // Check Amazon Financial Events for refund adjustments / RTO events
  let refundData: {
    refundStatus?: string;
    refundAmount?: number;
    refundedAt?: Date;
    amazonFinancialEvents?: any;
    isRefunded?: boolean;
  } = {};

  try {
    const config = getAmazonConfig();
    const accessToken = await getRestrictedDataToken();
    const resFin = await signedSpApiFetch(
      `/finances/v0/orders/${encodeURIComponent(AmazonOrderId)}/financialEvents`,
      accessToken,
      config,
    );
    if (resFin.ok) {
      const finJson = await resFin.json();
      const finEvents = finJson?.payload?.FinancialEvents;
      if (finEvents) {
        refundData.amazonFinancialEvents = finEvents;
        const refundList = finEvents.RefundEventList || [];
        if (refundList.length > 0) {
          let totalRefund = 0;
          let latestPostedDate: string | null = null;

          for (const ref of refundList) {
            if (ref.PostedDate) latestPostedDate = ref.PostedDate;
            const adjustments = ref.ShipmentItemAdjustmentList || [];
            for (const adj of adjustments) {
              const charges = adj.ItemChargeAdjustmentList || [];
              for (const chg of charges) {
                if (chg.ChargeAmount?.CurrencyAmount) {
                  totalRefund += Math.abs(
                    Number(chg.ChargeAmount.CurrencyAmount),
                  );
                }
              }
            }
          }

          if (totalRefund > 0) {
            refundData.isRefunded = true;
            refundData.refundAmount = totalRefund;
            refundData.refundStatus = "FULL_REFUND";
            refundData.refundedAt = latestPostedDate
              ? new Date(latestPostedDate)
              : new Date();
          }
        }
      }
    }
  } catch (finErr) {
    console.warn(
      `[Amazon Financial Sync Warning] Order ${AmazonOrderId}:`,
      finErr,
    );
  }

  const isTerminalState =
    existing?.status === "RETURNED" || existing?.status === "CANCELLED";
  const finalStatus = isTerminalState
    ? existing.status
    : refundData.isRefunded
      ? "CANCELLED"
      : mappedStatus;

  if (existing) {
    // Also update fulfillment type if it was previously null (order re-synced after initial ingestion)
    const updatedFulfillmentType =
      amazonOrder.EasyShipShipmentStatus != null
        ? "EASY_SHIP"
        : existing.amazonFulfillmentType || "SELF_SHIP";

    if (
      existing.status !== finalStatus ||
      existing.amazonOrderStatus !== amzStatus ||
      existing.easyShipStatus !==
        (amazonOrder.EasyShipShipmentStatus || null) ||
      refundData.isRefunded
    ) {
      await prisma.order.update({
        where: { id: existing.id },
        data: {
          status: finalStatus as any,
          amazonOrderStatus: amzStatus,
          amazonFulfillmentType: updatedFulfillmentType,
          easyShipStatus: amazonOrder.EasyShipShipmentStatus || null,
          refundStatus: refundData.refundStatus || existing.refundStatus,
          refundAmount:
            refundData.refundAmount && refundData.refundAmount > 0
              ? refundData.refundAmount
              : existing.refundAmount,
          refundedAt: refundData.refundedAt || existing.refundedAt,
          amazonFinancialEvents:
            refundData.amazonFinancialEvents ||
            (existing.amazonFinancialEvents as any),
          rtoStatus: refundData.isRefunded
            ? existing.rtoStatus || "RTO_INITIATED"
            : existing.rtoStatus,
        },
      });

      // Dispatch Push Notification on Amazon Refund / Cancellation
      if (
        refundData.isRefunded &&
        (existing.status as string) !== "REFUNDED_RTO"
      ) {
        sendNotificationToAllAdmins({
          title: `⚠️ Amazon Refund & RTO #${AmazonOrderId}`,
          body: `Amazon refunded ₹${refundData.refundAmount} to customer. RTO initiated.`,
          url: `/orders/${existing.id}`,
          type: "ORDER",
        }).catch(() => {});
      } else if (
        mappedStatus === "CANCELLED" &&
        existing.status !== "CANCELLED"
      ) {
        sendNotificationToAllAdmins({
          title: `⚠️ Amazon Order Cancelled #${AmazonOrderId}`,
          body: `Amazon Order #${AmazonOrderId} status changed to Cancelled.`,
          url: "/orders",
          type: "ORDER",
        }).catch((err) =>
          console.error("[Amazon Push] Cancellation notification error:", err),
        );
      }

      console.log(
        `[Amazon Orders] Updated existing Amazon order ${AmazonOrderId} status to ${finalStatus} (Amazon Status: ${amzStatus}, Refunded: ₹${refundData.refundAmount || 0}).`,
      );
    }
    return existing.id;
  }

  // Find or create the system "Amazon Marketplace" user
  const AMAZON_SYSTEM_EMAIL = "amazon-marketplace@jamesandsons.in";
  let systemUser = await prisma.user.findUnique({
    where: { email: AMAZON_SYSTEM_EMAIL },
  });
  if (!systemUser) {
    console.log("[Amazon Orders] Creating system Amazon marketplace user...");
    systemUser = await prisma.user.create({
      data: {
        email: AMAZON_SYSTEM_EMAIL,
        password: "SYSTEM_ACCOUNT_NO_LOGIN",
        firstName: "Amazon",
        lastName: "Marketplace",
        role: "CUSTOMER",
      },
    });
  }

  // Build a sequential order number for Amazon orders
  const orderNumber = `AMZ-${Date.now()}`;

  // Parse shipping address
  const addr = amazonOrder.ShippingAddress;
  const addrLine =
    [addr?.AddressLine1, addr?.AddressLine2].filter(Boolean).join(", ") ||
    "Amazon Marketplace";
  const city = addr?.City || "";
  const state = addr?.StateOrRegion || "";
  const pincode = addr?.PostalCode || "";
  const phone = addr?.Phone || "";
  const fullAddress = `${addrLine}, ${city}, ${state} - ${pincode}`;

  // Compute financials
  const totalAmount = parseFloat(amazonOrder.OrderTotal?.Amount || "0");

  // Estimate tax at 18% GST (Amazon doesn't break out tax separately in basic order response)
  const taxAmount = parseFloat(((totalAmount * 0.18) / 1.18).toFixed(2));
  const shippingAmount = 0; // Amazon usually handles shipping for MFN listings at 0

  // Map items → JNS OrderItems (link by SKU)
  const orderItemsData: {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[] = [];

  let unmappedSkusWarning = "";

  for (const item of items) {
    const unitPrice =
      parseFloat(item.ItemPrice?.Amount || "0") / item.QuantityOrdered;

    // Find the product/variant by SKU
    const product = await prisma.product.findFirst({
      where: { sku: item.SellerSKU },
    });

    if (!product) {
      // Try variants
      const variant = await prisma.productVariant.findFirst({
        where: { sku: item.SellerSKU },
        include: { product: true },
      });
      if (variant) {
        orderItemsData.push({
          productId: variant.productId,
          variantId: variant.id,
          quantity: item.QuantityOrdered,
          unitPrice,
          total: unitPrice * item.QuantityOrdered,
        });
      } else {
        console.warn(
          `[Amazon Orders] SKU "${item.SellerSKU}" not found in JNS DB. Mapping to fallback product.`,
        );

        // Find or create fallback product
        let fallbackProduct = await prisma.product.findUnique({
          where: { sku: "UNMAPPED-SKU" },
        });

        if (!fallbackProduct) {
          const anyCategory = await prisma.category.findFirst();
          if (anyCategory) {
            fallbackProduct = await prisma.product.create({
              data: {
                sku: "UNMAPPED-SKU",
                name: "Unmapped Seller Central SKU",
                slug: `unmapped-sku-${Date.now()}`,
                description:
                  "Placeholder product created dynamically for unmapped marketplace listings.",
                mrp: 0,
                d2cPrice: 0,
                b2bPrice: 0,
                categoryId: anyCategory.id,
              },
            });
          }
        }

        if (fallbackProduct) {
          orderItemsData.push({
            productId: fallbackProduct.id,
            quantity: item.QuantityOrdered,
            unitPrice,
            total: unitPrice * item.QuantityOrdered,
          });
          unmappedSkusWarning += `SKU: ${item.SellerSKU} (Title: ${item.Title}) is unmapped. `;
        }
      }
    } else {
      orderItemsData.push({
        productId: product.id,
        quantity: item.QuantityOrdered,
        unitPrice,
        total: unitPrice * item.QuantityOrdered,
      });
    }
  }

  if (orderItemsData.length === 0) {
    console.warn(
      `[Amazon Orders] No products could be mapped for Amazon order ${AmazonOrderId} and no category was available for fallback. Skipping ingestion.`,
    );
    return null;
  }

  // Determine fulfillment type from SP-API EasyShipShipmentStatus
  // If EasyShipShipmentStatus exists → order is Amazon Easy Ship (ATS pickup)
  // If absent → MFN Self-Ship (we book Shiprocket + push AWB)
  const fulfillmentType =
    amazonOrder.EasyShipShipmentStatus != null ? "EASY_SHIP" : "SELF_SHIP";

  // Create the JNS order
  const jnsOrder = await prisma.order.create({
    data: {
      orderNumber,
      userId: systemUser.id,
      status: finalStatus as any, // Amazon only notifies on confirmed/paid orders
      channel: "AMAZON",
      amazonOrderId: AmazonOrderId,
      amazonOrderStatus: amazonOrder.OrderStatus,
      amazonFulfillmentType: fulfillmentType,
      easyShipStatus: amazonOrder.EasyShipShipmentStatus || null,

      refundStatus: refundData.refundStatus || null,
      refundAmount: refundData.refundAmount || 0,
      refundedAt: refundData.refundedAt || null,
      amazonFinancialEvents: refundData.amazonFinancialEvents || null,
      rtoStatus: refundData.isRefunded ? "RTO_INITIATED" : null,

      totalAmount,
      taxAmount,
      shippingAmount,
      discountAmount: 0,

      shippingAddress: fullAddress,
      shippingCity: city,
      shippingState: state,
      shippingPincode: pincode,
      shippingPhone: phone.replace(/\D/g, "").slice(-10),
      billingAddress: fullAddress, // Amazon doesn't provide separate billing addr in basic API
      fulfillmentError: unmappedSkusWarning
        ? `WARNING: Unmapped SKUs found in Amazon feed. ${unmappedSkusWarning}`
        : null,

      items: {
        create: orderItemsData,
      },
    },
  });

  console.log(
    `[Amazon Orders] ✅ Ingested Amazon order ${AmazonOrderId} → JNS ${orderNumber} (ID: ${jnsOrder.id})`,
  );

  // Dispatch real-time PWA Push Notification to all admins
  sendNotificationToAllAdmins({
    title: `📦 New Amazon Order #${AmazonOrderId}`,
    body: `Amazon Order received: ₹${totalAmount.toLocaleString("en-IN")} (${orderItemsData.length} item(s))`,
    url: `/orders/${jnsOrder.id}`,
    type: "ORDER",
  }).catch((err) =>
    console.error("[Amazon Push] New order notification error:", err),
  );

  // Send operational email notification with Amazon PII / Easy Ship guidelines to operations@jamesandsons.in
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: jnsOrder.id },
      include: { items: { include: { product: true } }, user: true },
    });
    if (fullOrder) {
      const { sendOperationsOrderNotification } = await import("../email");
      sendOperationsOrderNotification(fullOrder).catch((err) =>
        console.error(
          "[Amazon Email] Operations email notification error:",
          err,
        ),
      );
    }
  } catch (emailErr) {
    console.error(
      "[Amazon Email] Error triggering operations notification:",
      emailErr,
    );
  }

  return jnsOrder.id;
}

// ---------------------------------------------------------------------------
// Orchestrator — fetch + ingest all new orders
// ---------------------------------------------------------------------------

export async function processNewAmazonOrders(minutesBack = 30): Promise<{
  fetched: number;
  ingested: number;
  skipped: number;
  errors: number;
}> {
  console.log("[Amazon Orders] Starting order ingestion run...");
  const stats = { fetched: 0, ingested: 0, skipped: 0, errors: 0 };

  let orders: AmazonOrder[];
  try {
    orders = await fetchNewAmazonOrders(minutesBack);
  } catch (err) {
    console.error("[Amazon Orders] Failed to fetch orders from SP-API:", err);
    stats.errors++;
    return stats;
  }

  stats.fetched = orders.length;

  for (const order of orders) {
    try {
      const items = await getAmazonOrderItems(order.AmazonOrderId);
      const jnsId = await ingestAmazonOrder(order, items);

      if (jnsId) {
        stats.ingested++;

        // Process Amazon order ingestion: Send invoice email & sync Zoho (Shiprocket is completely bypassed for Amazon orders)
        console.log(
          `[Amazon Orders] Ingested order ${order.AmazonOrderId} (JNS ID: ${jnsId}). Shiprocket is bypassed for Amazon orders.`,
        );
        const { sendInvoiceEmail } = await import("../email");
        const { prisma } = await import("../prisma");
        const ingestedOrder = await prisma.order.findUnique({
          where: { id: jnsId },
          include: { items: { include: { product: true } }, user: true },
        });
        if (ingestedOrder) {
          sendInvoiceEmail(ingestedOrder).catch((err) => {
            console.error(
              `[Amazon Orders] Invoice email failed for JNS ID ${jnsId}:`,
              err,
            );
          });
        }
      } else {
        stats.skipped++;
      }
    } catch (err) {
      console.error(
        `[Amazon Orders] Error processing order ${order.AmazonOrderId}:`,
        err,
      );
      stats.errors++;
    }
  }

  console.log(
    `[Amazon Orders] Run complete. Fetched: ${stats.fetched}, Ingested: ${stats.ingested}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`,
  );
  return stats;
}
