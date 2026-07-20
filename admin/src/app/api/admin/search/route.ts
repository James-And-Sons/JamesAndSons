import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const [products, orders, rfqs, customers] = await Promise.all([
    // Products — search by name or SKU
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, sku: true, images: true },
      take: 5,
    }),

    // Orders — search by orderNumber or customer name/email
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { user: { firstName: { contains: q, mode: 'insensitive' } } },
          { user: { lastName: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      take: 5,
    }),

    // RFQs — search by rfqNumber, company, or contact name
    prisma.rFQ.findMany({
      where: {
        OR: [
          { rfqNumber: { contains: q, mode: 'insensitive' } },
          { projectName: { contains: q, mode: 'insensitive' } },
          { user: { firstName: { contains: q, mode: 'insensitive' } } },
          { user: { lastName: { contains: q, mode: 'insensitive' } } },
          { user: { company: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      select: {
        id: true,
        rfqNumber: true,
        status: true,
        projectName: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            company: { select: { name: true } },
          },
        },
      },
      take: 5,
    }),

    // Customers — search by name or email
    prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    results: {
      products: products.map(p => ({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: p.sku,
        image: p.images?.[0] || null,
        href: `/products/${p.id}/edit`,
      })),
      orders: orders.map(o => ({
        type: 'order',
        id: o.id,
        title: `#${o.orderNumber}`,
        subtitle: `${o.user.firstName} ${o.user.lastName} · ${o.status}`,
        href: `/orders/${o.id}`,
      })),
      rfqs: rfqs.map(r => ({
        type: 'rfq',
        id: r.id,
        title: `RFQ ${r.rfqNumber}`,
        subtitle: r.user.company?.name || `${r.user.firstName} ${r.user.lastName}`,
        href: `/rfqs`,
      })),
      customers: customers.map(c => ({
        type: 'customer',
        id: c.id,
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.email,
        href: `/customers`,
      })),
    },
  });
}
