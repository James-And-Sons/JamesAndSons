/**
 * Flipkart Seller API v3 — Order Ingestion & Lifecycle Synchronization
 *
 * Fetches orders (APPROVED, PACKED, SHIPPED, DELIVERED, CANCELLED) from Flipkart Seller API,
 * ingests them into the JNS database with full customer shipping information,
 * updates inventory balances, and notifies admin panel.
 */
import { prisma } from "../prisma";
import { sendNotificationToAllAdmins } from "../push";

// ---------------------------------------------------------------------------
// Helpers & Types
// ---------------------------------------------------------------------------

export async function getFlipkartAccessToken(): Promise<string> {
  let appId = process.env.FLIPKART_APP_ID?.trim() || "";
  let appSecret = process.env.FLIPKART_APP_SECRET?.trim() || "";

  // Strip literal surrounding quotes if present in env file
  appId = appId.replace(/^['"]|['"]$/g, "");
  appSecret = appSecret.replace(/^['"]|['"]$/g, "");

  if (
    !appId ||
    !appSecret ||
    appId.includes("your_") ||
    appSecret.includes("your_")
  ) {
    throw new Error("Missing or placeholder Flipkart API credentials.");
  }

  const authHeader =
    "Basic " + Buffer.from(`${appId}:${appSecret}`).toString("base64");

  let res = await fetch(
    "https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api",
    {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
  );

  if (!res.ok && res.status === 405) {
    res = await fetch(
      "https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api",
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    );
  }

  if (!res.ok) {
    const text = await res.text();
    const cleanText = text.trim().startsWith("<")
      ? `HTTP ${res.status} (${res.statusText || "HTML Error"})`
      : text;
    throw new Error(`Failed to refresh Flipkart token: ${cleanText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export interface FlipkartOrderItem {
  order_item_id: string;
  sku: string;
  title?: string;
  quantity: number;
  price: number;
  hsn?: string;
  fsn?: string;
}

export interface FlipkartAddress {
  name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

export interface FlipkartOrder {
  order_id: string;
  order_date?: string;
  status: string; // APPROVED | PACKED | SHIPPED | DELIVERED | CANCELLED
  shipping_address?: FlipkartAddress;
  order_items: FlipkartOrderItem[];
  total_amount?: number;
}

// ---------------------------------------------------------------------------
// Fetch Orders from Flipkart v3 API
// ---------------------------------------------------------------------------

export async function fetchFlipkartOrders(
  token?: string,
): Promise<FlipkartOrder[]> {
  const authToken = token || (await getFlipkartAccessToken());

  console.log("[Flipkart Orders] Querying Flipkart v3 search orders...");

  // Query orders with active statuses
  const res = await fetch("https://api.flipkart.net/sellers/v3/orders/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        states: ["APPROVED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"],
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(
      `[Flipkart Orders] Search orders returned status ${res.status}: ${text}`,
    );
    return [];
  }

  const data = await res.json();
  const rawOrders = data.orders || data.shipments || [];

  // Normalize response
  const orders: FlipkartOrder[] = rawOrders.map((o: any) => {
    const addr =
      o.delivery_address || o.shipping_address || o.billing_address || {};
    const items = (o.order_items || o.items || []).map((i: any) => ({
      order_item_id: i.order_item_id || i.id || String(Math.random()),
      sku: i.sku || i.seller_sku || "",
      title: i.title || i.product_title || "Flipkart Listing Item",
      quantity: Number(i.quantity || i.qty || 1),
      price: Number(i.price || i.selling_price || 0),
      hsn: i.hsn,
      fsn: i.fsn || i.product_id,
    }));

    const total = items.reduce(
      (acc: number, item: any) => acc + item.price * item.quantity,
      0,
    );

    return {
      order_id: o.order_id || o.shipment_id || `FK-${Date.now()}`,
      order_date: o.order_date || o.created_at || new Date().toISOString(),
      status: (o.status || o.state || "APPROVED").toUpperCase(),
      shipping_address: {
        name: addr.name || addr.full_name || "Flipkart Customer",
        address_line1:
          addr.address_line1 ||
          addr.address_line ||
          addr.landmark ||
          "Flipkart Buyer Address",
        address_line2: addr.address_line2 || "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode || addr.zip || "",
        phone: addr.contact_number || addr.phone || "",
        email: addr.email || "",
      },
      order_items: items,
      total_amount: total,
    };
  });

  console.log(
    `[Flipkart Orders] Fetched and normalized ${orders.length} Flipkart orders.`,
  );
  return orders;
}

// ---------------------------------------------------------------------------
// Ingest / Update Single Flipkart Order into Prisma Database
// ---------------------------------------------------------------------------

export async function ingestFlipkartOrder(
  order: FlipkartOrder,
): Promise<string | null> {
  const { order_id, status: fkStatus, order_items, shipping_address } = order;

  // Map Flipkart status to Prisma OrderStatus enum
  let mappedStatus:
    "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" =
    "PROCESSING";
  if (fkStatus === "APPROVED") {
    mappedStatus = "PROCESSING";
  } else if (fkStatus === "PACKED") {
    mappedStatus = "PROCESSING";
  } else if (fkStatus === "SHIPPED") {
    mappedStatus = "SHIPPED";
  } else if (fkStatus === "DELIVERED") {
    mappedStatus = "DELIVERED";
  } else if (fkStatus === "CANCELLED" || fkStatus === "CANCELED") {
    mappedStatus = "CANCELLED";
  }

  // Check if order already exists in database
  const existing = await prisma.order.findUnique({
    where: { flipkartOrderId: order_id },
    include: { items: true },
  });

  if (existing) {
    if (
      existing.status !== mappedStatus ||
      existing.flipkartOrderStatus !== fkStatus
    ) {
      await prisma.order.update({
        where: { id: existing.id },
        data: {
          status: mappedStatus as any,
          flipkartOrderStatus: fkStatus,
        },
      });

      // Handle order cancellation (restore stock & notify admin)
      if (mappedStatus === "CANCELLED" && existing.status !== "CANCELLED") {
        sendNotificationToAllAdmins({
          title: `⚠️ Flipkart Order Cancelled #${order_id}`,
          body: `Flipkart Order #${order_id} status changed to Cancelled.`,
          url: "/orders",
          type: "ORDER",
        }).catch((err) =>
          console.error("[Flipkart Push] Cancellation error:", err),
        );

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
        `[Flipkart Orders] Updated existing order ${order_id} status from ${existing.status} to ${mappedStatus} (FK status: ${fkStatus}).`,
      );
    }
    return existing.id;
  }

  // Get or create system Flipkart marketplace user
  const FLIPKART_SYSTEM_EMAIL = "flipkart-marketplace@jamesandsons.in";
  let systemUser = await prisma.user.findUnique({
    where: { email: FLIPKART_SYSTEM_EMAIL },
  });
  if (!systemUser) {
    console.log(
      "[Flipkart Orders] Creating system Flipkart Marketplace user...",
    );
    systemUser = await prisma.user.create({
      data: {
        email: FLIPKART_SYSTEM_EMAIL,
        password: "SYSTEM_ACCOUNT_NO_LOGIN",
        firstName: "Flipkart",
        lastName: "Marketplace",
        role: "CUSTOMER",
      },
    });
  }

  // Parse customer shipping address details
  const addr = shipping_address || {};
  const customerName = addr.name || "Flipkart Customer";
  const addrLine =
    [addr.address_line1, addr.address_line2].filter(Boolean).join(", ") ||
    "Flipkart Delivery Address";
  const city = addr.city || "";
  const state = addr.state || "";
  const pincode = addr.pincode || "";
  const phone = addr.phone || "";
  const fullAddress = `${customerName}\n${addrLine}\n${city}, ${state} - ${pincode}\nPhone: ${phone}`;

  const totalAmount = order.total_amount || 0;
  const taxAmount = parseFloat(((totalAmount * 0.18) / 1.18).toFixed(2));
  const shippingAmount = 0;

  // Match SKUs to JNS Products / ProductVariants
  const orderItemsData: {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[] = [];

  for (const item of order_items) {
    let matchedProductId: string | null = null;
    let matchedVariantId: string | null = null;

    if (item.sku) {
      // 1. Check ProductVariant by SKU
      const variant = await prisma.productVariant.findUnique({
        where: { sku: item.sku },
      });
      if (variant) {
        matchedProductId = variant.productId;
        matchedVariantId = variant.id;
      } else {
        // 2. Check main Product by SKU
        const product = await prisma.product.findFirst({
          where: { sku: item.sku },
        });
        if (product) {
          matchedProductId = product.id;
        }
      }
    }

    // Fallback: If SKU doesn't match any JNS product, fallback to first active product
    if (!matchedProductId) {
      const fallbackProduct = await prisma.product.findFirst({
        select: { id: true },
      });
      if (fallbackProduct) {
        matchedProductId = fallbackProduct.id;
      }
    }

    if (matchedProductId) {
      orderItemsData.push({
        productId: matchedProductId,
        variantId: matchedVariantId || undefined,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
      });

      // Deduct inventory stock balances for matched item
      if (matchedVariantId) {
        await prisma.productVariant
          .update({
            where: { id: matchedVariantId },
            data: { stockQuantity: { decrement: item.quantity } },
          })
          .catch((err) =>
            console.warn(
              `[Flipkart Stock] Decrement variant ${matchedVariantId} failed:`,
              err,
            ),
          );
      }
      await prisma.product
        .update({
          where: { id: matchedProductId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
        .catch((err) =>
          console.warn(
            `[Flipkart Stock] Decrement product ${matchedProductId} failed:`,
            err,
          ),
        );
    }
  }

  if (orderItemsData.length === 0) {
    console.warn(
      `[Flipkart Orders] Skipping order ${order_id} because no items could be mapped.`,
    );
    return null;
  }

  // Create Order record in Database
  const orderNumber = `FK-${Date.now()}`;
  const newOrder = await prisma.order.create({
    data: {
      orderNumber,
      userId: systemUser.id,
      channel: "FLIPKART",
      flipkartOrderId: order_id,
      flipkartOrderStatus: fkStatus,
      status: mappedStatus as any,
      taxAmount,
      shippingAmount,
      discountAmount: 0,
      totalAmount,
      shippingAddress: fullAddress,
      billingAddress: fullAddress,
      recipientName: customerName,
      recipientEmail: addr.email || undefined,
      items: {
        create: orderItemsData,
      },
    },
  });

  console.log(
    `[Flipkart Orders] Ingested Flipkart Order #${order_id} -> JNS Order ID: ${newOrder.id}`,
  );

  // Trigger push notification to admins
  sendNotificationToAllAdmins({
    title: `📦 New Flipkart Order #${order_id}`,
    body: `Flipkart Order received: ₹${totalAmount.toLocaleString("en-IN")} (${order_items.length} item(s))`,
    url: `/orders/${newOrder.id}`,
    type: "ORDER",
  }).catch((err) => console.error("[Flipkart Push] Notification error:", err));

  // Send operational notification email with Flipkart guidelines to operations@jamesandsons.in
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: { items: { include: { product: true } }, user: true },
    });
    if (fullOrder) {
      const { sendOperationsOrderNotification } = await import("../email");
      sendOperationsOrderNotification(fullOrder).catch((err) =>
        console.error(
          "[Flipkart Email] Operations email notification error:",
          err,
        ),
      );
    }
  } catch (emailErr) {
    console.error(
      "[Flipkart Email] Error triggering operations notification:",
      emailErr,
    );
  }

  return newOrder.id;
}

// ---------------------------------------------------------------------------
// Orchestrator Process Function
// ---------------------------------------------------------------------------

export async function processNewFlipkartOrders(): Promise<{
  fetched: number;
  ingested: number;
  skipped: number;
  errors: number;
}> {
  const stats = { fetched: 0, ingested: 0, skipped: 0, errors: 0 };

  try {
    const token = await getFlipkartAccessToken();
    const orders = await fetchFlipkartOrders(token);
    stats.fetched = orders.length;

    for (const order of orders) {
      try {
        const id = await ingestFlipkartOrder(order);
        if (id) {
          stats.ingested++;
        } else {
          stats.skipped++;
        }
      } catch (err) {
        console.error(
          `[Flipkart Orders] Error ingesting order ${order.order_id}:`,
          err,
        );
        stats.errors++;
      }
    }
  } catch (err) {
    console.error("[Flipkart Orders] Failed to process Flipkart orders:", err);
    throw err;
  }

  return stats;
}
