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
      createdAt: true,
      totalAmount: true,
      status: true,
      channel: true,
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

  const formattedOrders = orders.map((o: any) => ({
    id: o.id,
    displayId: o.orderNumber,
    date: o.createdAt,
    customerName: o.user.firstName + " " + o.user.lastName,
    company: o.user.company?.name || null,
    email: o.user.email,
    totalValue: o.totalAmount,
    status: o.status,
    channel: o.channel,
  }));

  return <OrdersTableClient records={formattedOrders} />;
}
