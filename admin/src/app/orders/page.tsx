import { prisma } from '../../lib/prisma';
import OrdersTableClient from './OrdersTableClient';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: { user: { include: { company: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const formattedOrders = orders.map((o: any) => ({
    id: o.id,
    displayId: o.orderNumber,
    date: o.createdAt,
    customerName: o.user.firstName + ' ' + o.user.lastName,
    company: o.user.company?.name || null,
    email: o.user.email,
    totalValue: o.totalAmount,
    status: o.status,
  }));

  return <OrdersTableClient records={formattedOrders} />;
}
