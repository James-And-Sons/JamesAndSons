import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RFQStatus } from '@prisma/client';

@Injectable()
export class RfqService {
  constructor(private prisma: PrismaService) {}

  async submitRfq(userId: string, data: { notes?: string; items: { productId: string; quantity: number }[] }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Create the RFQ and its items in a transaction using nested writes
    return this.prisma.rFQ.create({
      data: {
        userId,
        status: 'SUBMITTED',
        notes: data.notes,
        // Using a timestamp + random to ensure unique rfqNumber for now
        rfqNumber: `RFQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async getAllRfqs() {
    return this.prisma.rFQ.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, company: true } },
        items: { include: { product: true } },
      },
    });
  }

  async getRfqById(id: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, company: true } },
        items: { include: { product: true } },
      },
    });

    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async updateQuote(id: string, data: { status: RFQStatus; items: { id: string; targetPrice: number }[] }) {
    // We update the items and the RFQ status in a transaction
    await this.prisma.$transaction(
      data.items.map(item =>
        this.prisma.rFQItem.update({
          where: { id: item.id },
          data: { targetPrice: item.targetPrice },
        })
      )
    );

    return this.prisma.rFQ.update({
      where: { id },
      data: { status: data.status },
      include: {
        items: { include: { product: true } },
      },
    });
  }
}
