/**
 * Amazon SP-API — Order Ingestion & Financial Event Parsing
 *
 * Fetches new and updated orders from Amazon Seller Central, parses
 * Financial Events (refunds, RTO events), and ingests them into the database.
 */

import { prisma } from "@james-andsons/db";
import {
  getAmazonConfig,
  getLwaAccessToken,
  getRestrictedDataToken,
  signedSpApiFetch,
} from "./sp-api";

export interface AmazonAddress {
  Name: string;
  AddressLine1: string;
  AddressLine2?: string;
  City: string;
  StateOrRegion: string;
  PostalCode: string;
  CountryCode: string;
  Phone?: string;
}

export interface AmazonOrderItem {
  ASIN: string;
  SellerSKU: string;
  OrderItemId: string;
  Title: string;
  QuantityOrdered: number;
  ItemPrice?: { Amount: string; CurrencyCode: string };
  ItemTax?: { Amount: string; CurrencyCode: string };
}

export interface AmazonOrder {
  AmazonOrderId: string;
  OrderStatus: string;
  PurchaseDate: string;
  ShippingAddress?: AmazonAddress;
  BuyerInfo?: { BuyerEmail?: string; BuyerName?: string };
  OrderTotal?: { Amount: string; CurrencyCode: string };
  NumberOfItemsShipped: number;
  NumberOfItemsUnshipped: number;
  FulfillmentChannel: string;
  EasyShipShipmentStatus?: string;
}

/**
 * Fetch new or updated orders from SP-API
 */
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

/**
 * Sync single Amazon order by Amazon Order ID
 */
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

/**
 * Fetch order items for a specific Amazon order
 */
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

/**
 * Ingest or update a single Amazon order in JNS database
 */
export async function ingestAmazonOrder(
  amazonOrder: AmazonOrder,
  items: AmazonOrderItem[],
): Promise<string | null> {
  const { AmazonOrderId } = amazonOrder;

  let mappedStatus:
    "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" =
    "PAID";
  const amzStatus = amazonOrder.OrderStatus;
  const easyStatus = amazonOrder.EasyShipShipmentStatus;
  if (amzStatus === "Delivered" || easyStatus === "Delivered") {
    mappedStatus = "DELIVERED";
  } else if (amzStatus === "Shipped" || amzStatus === "PartiallyShipped") {
    mappedStatus = "SHIPPED";
  } else if (amzStatus === "Canceled") {
    mappedStatus = "CANCELLED";
  }

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
          rtoStatus:
            finalStatus === "DELIVERED"
              ? null
              : refundData.isRefunded
                ? existing.rtoStatus || "RTO_INITIATED"
                : existing.rtoStatus,
          ndrReason: finalStatus === "DELIVERED" ? null : existing.ndrReason,
        },
      });

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

  const orderNumber = `AMZ-${Date.now()}`;

  const addr = amazonOrder.ShippingAddress;
  const addrLine =
    [addr?.AddressLine1, addr?.AddressLine2].filter(Boolean).join(", ") ||
    "Amazon Marketplace";
  const city = addr?.City || "";
  const state = addr?.StateOrRegion || "";
  const pincode = addr?.PostalCode || "";
  const phone = addr?.Phone || "";
  const fullAddress = `${addrLine}, ${city}, ${state} - ${pincode}`;

  const totalAmount = parseFloat(amazonOrder.OrderTotal?.Amount || "0");
  const taxAmount = parseFloat(((totalAmount * 0.18) / 1.18).toFixed(2));
  const shippingAmount = 0;

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

    const product = await prisma.product.findFirst({
      where: { sku: item.SellerSKU },
    });

    if (!product) {
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
          `[Amazon Orders] SKU "${item.SellerSKU}" not found in DB. Mapping fallback.`,
        );

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
          unmappedSkusWarning += `SKU: ${item.SellerSKU} (${item.Title}) unmapped. `;
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
      `[Amazon Orders] No products could be mapped for Amazon order ${AmazonOrderId}. Skipping.`,
    );
    return null;
  }

  const fulfillmentType =
    amazonOrder.EasyShipShipmentStatus != null ? "EASY_SHIP" : "SELF_SHIP";

  const jnsOrder = await prisma.order.create({
    data: {
      orderNumber,
      userId: systemUser.id,
      status: finalStatus as any,
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
      billingAddress: fullAddress,
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

  return jnsOrder.id;
}

/**
 * Orchestrator — fetch + ingest all new orders
 */
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
