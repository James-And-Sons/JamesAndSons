import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPayment } from '@/app/checkout/actions';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
    const razorpay_order_id = formData.get('razorpay_order_id') as string;
    const razorpay_signature = formData.get('razorpay_signature') as string;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.redirect(`${new URL(req.url).origin}/checkout?error=Payment+cancelled+or+failed`, 303);
    }

    // Find matching order in DB
    const dbOrder = await prisma.order.findFirst({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!dbOrder) {
      return NextResponse.redirect(`${new URL(req.url).origin}/checkout?error=Order+not+found`, 303);
    }

    const verifyRes = await verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrder.id
    );

    if (verifyRes.success) {
      return NextResponse.redirect(`${new URL(req.url).origin}/checkout?step=3&orderNumber=${dbOrder.orderNumber}`, 303);
    } else {
      return NextResponse.redirect(`${new URL(req.url).origin}/checkout?error=${encodeURIComponent(verifyRes.error || 'Signature verification failed')}`, 303);
    }
  } catch (error: any) {
    console.error('[RazorpayCallback] Error:', error);
    return NextResponse.redirect(`${new URL(req.url).origin}/checkout?error=Internal+Callback+Error`, 303);
  }
}
