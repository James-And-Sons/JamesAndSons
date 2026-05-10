import { prisma } from '@/lib/prisma';
import { sendAbandonedCartNudge } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Simple security check (could use a secret header in production)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        nudgeSent: false,
        recovered: false,
        lastSeen: { lte: thirtyMinutesAgo }
      }
    });

    for (const cart of abandonedCarts) {
      await sendAbandonedCartNudge(cart.email, cart.cartData);
    }

    return NextResponse.json({ 
      success: true, 
      processed: abandonedCarts.length 
    });
  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
