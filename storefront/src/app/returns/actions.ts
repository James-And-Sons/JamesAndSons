'use server';

import { prisma } from '@/lib/prisma';

export async function findOrderForReturnAction(orderNumber: string, pincode: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.trim(),
        shippingPincode: pincode.trim(),
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      return { success: false, error: 'Order not found or pincode mismatch.' };
    }

    // Check Eligibility
    // 1. Must be DELIVERED
    if (order.status !== 'DELIVERED' && order.status !== 'SHIPPED') { // Allowing SHIPPED for testing if needed
      return { success: false, error: 'Only delivered orders can be returned.' };
    }

    // 2. Must be within 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (order.updatedAt < sevenDaysAgo) {
      return { success: false, error: 'The 7-day return window has expired for this order.' };
    }

    return { success: true, order };
  } catch (error: any) {
    console.error('Error finding order for return:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function createReturnRequestAction(orderId: string, reason: string, items: string[]) {
  try {
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        reason,
        status: 'PENDING'
      }
    });

    // Update order status to show return is in progress
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURNED' } // We use RETURNED to track the state
    });

    return { success: true, requestId: returnRequest.id };
  } catch (error: any) {
    console.error('Error creating return request:', error);
    return { success: false, error: 'Failed to submit return request.' };
  }
}
