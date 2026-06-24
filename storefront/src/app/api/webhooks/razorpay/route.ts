import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { fulfillPaidOrder } from '@/lib/fulfillment';
import { refundRazorpayPayment } from '@/lib/razorpay';

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
        try {
          const result = await fulfillPaidOrder({
            orderId: order.id,
            razorpayPaymentId,
            razorpaySignature,
          });

          if (!result.success) {
            console.error(`[Webhook] Fulfillment failed for order ${order.orderNumber}:`, result.error);
            if (razorpayPaymentId) {
              console.log(`[Webhook] Initiating automated refund for JNS Order ${order.orderNumber} due to fulfillment failure.`);
              await refundRazorpayPayment(razorpayPaymentId, undefined, `Fulfillment failed: ${result.error || 'Unknown Error'}`);
              
              // Mark order as cancelled/refunded in DB
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  status: 'CANCELLED',
                  fulfillmentError: `Fulfillment failed: ${result.error || 'Unknown Error'}. Automated instant refund initiated.`,
                }
              });
            }
            return NextResponse.json({ error: result.error || 'Fulfillment failed, automated refund initiated' }, { status: 500 });
          }
        } catch (fulfillmentErr: any) {
          console.error(`[Webhook] Exception during fulfillment for order ${order.orderNumber}:`, fulfillmentErr);
          if (razorpayPaymentId) {
            await refundRazorpayPayment(razorpayPaymentId, undefined, `Fulfillment exception: ${fulfillmentErr.message || 'Unknown Error'}`);
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'CANCELLED',
                fulfillmentError: `Fulfillment exception: ${fulfillmentErr.message || 'Unknown Error'}. Automated instant refund initiated.`,
              }
            });
          }
          return NextResponse.json({ error: fulfillmentErr.message || 'Fulfillment exception, automated refund initiated' }, { status: 500 });
        }
      } else {
        console.error(`[Webhook] CRITICAL: No order found in database matching Razorpay Order ID: ${rpOrderId}`);
        if (razorpayPaymentId) {
          console.log(`[Webhook] Initiating automated refund for unmatched Razorpay Order ID ${rpOrderId}`);
          await refundRazorpayPayment(razorpayPaymentId, undefined, `No matching order found for Razorpay Order ID: ${rpOrderId}`);
        }
        return NextResponse.json({ error: 'Order not found, automated refund initiated' }, { status: 400 });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
