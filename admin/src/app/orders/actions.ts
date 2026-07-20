'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cancelShiprocketOrder } from '@/lib/shiprocket';
import { refundRazorpayPayment } from '@/lib/razorpay';

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      let notes = [];

      // 1. If there's a Shiprocket order synced, cancel it
      if (order.awbNumber) {
        console.log(`[CancelOrder] Attempting to cancel Shiprocket order for JNS order number: ${order.orderNumber}`);
        const logisticsRes = await cancelShiprocketOrder(order.orderNumber);
        if (logisticsRes.success) {
          notes.push('Shiprocket order cancelled.');
        } else {
          notes.push(`Logistics cancel failed: ${logisticsRes.message}`);
        }
      }

      // 2. If it was a paid order (Razorpay payment captured), initiate a full refund
      if (order.razorpayPaymentId) {
        console.log(`[CancelOrder] Attempting to refund payment ID: ${order.razorpayPaymentId} for JNS order: ${order.orderNumber}`);
        try {
          const refund = await refundRazorpayPayment(order.razorpayPaymentId, undefined, `Order #${order.orderNumber} cancelled via Admin Portal`);
          notes.push(`Refund initiated (ID: ${refund.id}).`);
        } catch (refundError: any) {
          console.error('[CancelOrder] Razorpay refund failed:', refundError);
          notes.push(`Refund failed: ${refundError.message || 'Unknown Error'}`);
        }
      }

      const fulfillmentError = notes.join(' | ');

      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'CANCELLED',
          fulfillmentError: fulfillmentError || null
        },
      });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: status as any },
      });
    }

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
