import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAbandonedCartNudge } from '@/lib/email';

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Find carts older than 30 mins, no nudge sent yet, not recovered
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        nudgeSent: false,
        recovered: false,
        updatedAt: { lte: thirtyMinsAgo }
      },
      take: 10 // Process in batches to avoid timeouts
    });

    console.log(`Processing ${abandonedCarts.length} abandoned carts...`);

    for (const cart of abandonedCarts) {
      // Trigger Email Nudge
      await sendAbandonedCartNudge(cart.email, cart.cartData);
      
      // Mark as sent
      await prisma.abandonedCart.update({
        where: { email: cart.email },
        data: { nudgeSent: true }
      });
    }

    return NextResponse.json({ 
      success: true, 
      processed: abandonedCarts.length 
    });
  } catch (error: any) {
    console.error('Recovery Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
