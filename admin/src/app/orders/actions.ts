'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTrackingNumber(orderId: string, trackingNumber: string, awbNumber: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: trackingNumber || null,
        awbNumber: awbNumber || null,
        status: 'SHIPPED',
      },
    });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
