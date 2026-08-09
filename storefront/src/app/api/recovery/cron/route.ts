import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAbandonedCartNudge } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 2. Find carts older than 30 mins, no nudge sent yet, not recovered
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        nudgeSent: false,
        recovered: false,
        updatedAt: { lte: thirtyMinsAgo },
      },
      take: 10, // Process in batches to avoid timeouts
    });

    console.log(
      `[Abandoned Cart Recovery] Processing ${abandonedCarts.length} abandoned carts...`,
    );

    for (const cart of abandonedCarts) {
      // Trigger Email Nudge via Resend
      await sendAbandonedCartNudge(cart.email, cart.cartData);

      // Trigger Meta WhatsApp Reminder Ping (if phone is provided)
      if (cart.phone) {
        const recoveryUrl = `${process.env.NEXT_PUBLIC_STORE_URL || "https://jamesandsons.in"}/checkout?recoverCart=${encodeURIComponent(cart.email)}`;
        const whatsappText = `🪔 *Namaste from James & Sons Luxury Lighting!*\n\nWe noticed you left items in your luxury shopping cart. Your handcrafted lighting selections are reserved for a limited time.\n\n✨ Complete your order now with complimentary white-glove shipping:\n👉 ${recoveryUrl}\n\n_Need design advice or custom dimensions? Reply to this message to connect with a lighting specialist._`;

        await sendWhatsAppMessage({
          to: cart.phone,
          text: whatsappText,
        });
      }

      // Mark as sent
      await prisma.abandonedCart.update({
        where: { email: cart.email },
        data: { nudgeSent: true },
      });
    }

    return NextResponse.json({
      success: true,
      processed: abandonedCarts.length,
    });
  } catch (error: any) {
    console.error("[Abandoned Cart Recovery Cron Error]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
