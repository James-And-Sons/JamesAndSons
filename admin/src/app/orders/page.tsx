import { prisma } from "../../lib/prisma";
import OrdersTableClient from "./OrdersTableClient";

import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireAdmin("orders");

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      amazonOrderId: true,
      flipkartOrderId: true,
      createdAt: true,
      totalAmount: true,
      status: true,
      channel: true,
      trackingNumber: true,
      awbNumber: true,
      recipientName: true,
      recipientEmail: true,
      shippingCity: true,
      shippingState: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  function isPlaceholderName(n?: string | null) {
    if (!n) return true;
    return (
      n.includes("Amazon") ||
      n.includes("Flipkart") ||
      n.includes("Marketplace") ||
      n.includes("Not Authorized") ||
      n.trim() === ""
    );
  }

  function isPlaceholderEmail(e?: string | null) {
    if (!e) return true;
    return (
      e.startsWith("amazon-") ||
      e.startsWith("flipkart-") ||
      e.includes("marketplace")
    );
  }

  const formattedOrders = orders.map((o: any) => {
    const isAmazon = o.channel === "AMAZON" || Boolean(o.amazonOrderId);
    const isFlipkart = o.channel === "FLIPKART" || Boolean(o.flipkartOrderId);
    const userFullName =
      `${o.user?.firstName || ""} ${o.user?.lastName || ""}`.trim();

    const displayName =
      (o.recipientName && !isPlaceholderName(o.recipientName)
        ? o.recipientName
        : null) ||
      (!isPlaceholderName(userFullName) ? userFullName : null) ||
      o.recipientName ||
      (isAmazon
        ? "Amazon Customer"
        : isFlipkart
          ? "Flipkart Customer"
          : "Guest Customer");

    const displayEmail =
      (o.recipientEmail && !isPlaceholderEmail(o.recipientEmail)
        ? o.recipientEmail
        : null) ||
      (!isPlaceholderEmail(o.user?.email) ? o.user?.email : null) ||
      (o.shippingCity && o.shippingState
        ? `${o.shippingCity}, ${o.shippingState}`
        : isAmazon
          ? "Amazon Order"
          : isFlipkart
            ? "Flipkart Order"
            : "Direct Purchase");

    return {
      id: o.id,
      displayId: o.orderNumber,
      date: o.createdAt,
      customerName: displayName,
      company: o.user?.company?.name || null,
      email: displayEmail,
      totalValue: o.totalAmount,
      status: o.status,
      channel: o.channel,
      trackingNumber: o.trackingNumber,
      awbNumber: o.awbNumber,
      trackingCode: o.trackingNumber || o.awbNumber || null,
    };
  });

  return <OrdersTableClient records={formattedOrders} />;
}
