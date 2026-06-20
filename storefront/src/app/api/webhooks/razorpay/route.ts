import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { fulfillPaidOrder } from '@/lib/fulfillment';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid signature in Razorpay webhook');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    if (event === 'order.paid') {
      const rpOrderId = payload.payload.order.entity.id;
      const razorpayPaymentId = payload.payload.payment?.entity?.id || undefined;
      const razorpaySignature = payload.payload.payment?.entity?.signature || undefined;
      
      const order = await prisma.order.findUnique({
        where: { razorpayOrderId: rpOrderId },
      });

      if (order) {
        console.log(`[Webhook] Processing fulfillment for Razorpay Order: ${rpOrderId} (JNS Order: ${order.orderNumber})`);
        const result = await fulfillPaidOrder({
          orderId: order.id,
          razorpayPaymentId,
          razorpaySignature,
        });

        if (!result.success) {
          console.error(`[Webhook] Fulfillment failed for order ${order.orderNumber}:`, result.error);
          return NextResponse.json({ error: result.error || 'Fulfillment failed' }, { status: 500 });
        }
      } else {
        console.warn(`[Webhook] No order found in database matching Razorpay Order ID: ${rpOrderId}`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
