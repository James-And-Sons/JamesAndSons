'use server';

import { prisma } from '@/lib/prisma';
import { trackShipment } from '@/lib/shiprocket';

export async function getOrderTrackingAction(orderNumber: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { 
        awbNumber: true, 
        status: true,
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    if (!order.awbNumber) {
      return { 
        success: true, 
        status: order.status, 
        message: 'Your order is being prepared and will be shipped soon.' 
      };
    }

    const tracking = await trackShipment(order.awbNumber);
    return { success: true, order, tracking: tracking.success ? tracking.data : null };
  } catch (error: any) {
    console.error('Error fetching tracking:', error);
    return { success: false, error: 'Failed to load tracking information.' };
  }
}
