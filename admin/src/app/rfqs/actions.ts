'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateRfqQuote(rfqId: string, items: { id: string; targetPrice: number }[], accept: boolean) {
  try {
    // Update individual RFQ items with the admin's Target Price
    await prisma.$transaction(
      items.map(item =>
        prisma.rFQItem.update({
          where: { id: item.id },
          data: { targetPrice: item.targetPrice },
        })
      )
    );

    // Update the parent RFQ status to APPROVED or REJECTED
    await prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: accept ? 'APPROVED' : 'REJECTED' },
    });

    revalidatePath(`/rfqs/${rfqId}`);
    revalidatePath('/rfqs');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
