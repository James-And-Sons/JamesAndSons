'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function submitRfqAction(userId: string, data: { projectName: string; timeline: string; notes: string; items: { productId: string; quantity: number; targetPrice?: string }[] }) {
  try {
    const rfq = await prisma.rFQ.create({
      data: {
        userId,
        status: 'SUBMITTED',
        notes: `Project: ${data.projectName}\nTimeline: ${data.timeline}\nNotes: ${data.notes}`,
        rfqNumber: `RFQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            targetPrice: item.targetPrice ? parseFloat(item.targetPrice.replace(/[^0-9.]/g, '')) : null,
          })),
        },
      },
    });

    revalidatePath('/account/rfqs');
    revalidatePath('/account');
    return { success: true, id: rfq.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
