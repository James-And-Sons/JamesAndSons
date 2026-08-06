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
import {
  getLwaAccessToken,
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
}

// ---------------------------------------------------------------------------
// Fetch new unshipped orders from SP-API
// ---------------------------------------------------------------------------

export async function fetchNewAmazonOrders(
  minutesBack = 1440,
): Promise<AmazonOrder[]> {
  const config = getAmazonConfig();
  const accessToken = await getLwaAccessToken();

  const lastUpdatedAfter = new Date(
    Date.now() - minutesBack * 60 * 1000,
  ).toISOString();

  // Query unshipped, partially shipped, shipped, and canceled orders across MFN & AFN channels
  const statuses = "Unshipped,PartiallyShipped,Shipped,Canceled";
  const path = `/orders/v0/orders?MarketplaceIds=${config.marketplaceId}&LastUpdatedAfter=${encodeURIComponent(lastUpdatedAfter)}&OrderStatuses=${statuses}`;

  console.log(
    `[Amazon Orders] Fetching Amazon orders updated after ${lastUpdatedAfter}...`,
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
    const accessToken = await getLwaAccessToken();
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

  if (existing) {
    if (
      existing.status !== mappedStatus ||
      existing.amazonOrderStatus !== amzStatus
    ) {
      await prisma.order.update({
        where: { id: existing.id },
        data: {
          status: mappedStatus as any,
          amazonOrderStatus: amzStatus,
        },
      });

      // If status changed to CANCELLED, restore inventory
      if (mappedStatus === "CANCELLED" && existing.status !== "CANCELLED") {
        for (const item of existing.items) {
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
        `[Amazon Orders] Updated existing Amazon order ${AmazonOrderId} status from ${existing.status} to ${mappedStatus} (Amazon Status: ${amzStatus}).`,
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

  // Create the JNS order
  const jnsOrder = await prisma.order.create({
    data: {
      orderNumber,
      userId: systemUser.id,
      status: "PAID", // Amazon only notifies on confirmed/paid orders
      channel: "AMAZON",
      amazonOrderId: AmazonOrderId,
      amazonOrderStatus: amazonOrder.OrderStatus,

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
