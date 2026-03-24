import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class B2bService {
  constructor(private prisma: PrismaService) {}

  async applyForB2b(userId: string, data: { companyName: string; gstin?: string; billingAddress?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const company = await this.prisma.company.create({
      data: {
        name: data.companyName,
        gstin: data.gstin,
        billingAddress: data.billingAddress,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    return company;
  }

  async getPendingApplications() {
    return this.prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        companyId: { not: null },
      },
      include: {
        company: true,
      },
    });
  }

  async approveApplication(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'B2B_BUYER' },
      include: { company: true },
    });
  }
}
