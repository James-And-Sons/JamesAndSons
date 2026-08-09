import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { subscription } = await request.json();

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 },
      );
    }

    // Find or create storefront guest / system user for anonymous subscriptions
    const GUEST_SYSTEM_EMAIL = "storefront-subscriber@jamesandsons.in";
    let systemUser = await prisma.user.findUnique({
      where: { email: GUEST_SYSTEM_EMAIL },
    });
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: GUEST_SYSTEM_EMAIL,
          password: "GUEST_SUBSCRIBER_NO_AUTH",
          firstName: "Storefront",
          lastName: "Subscriber",
          role: "CUSTOMER",
        },
      });
    }

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: systemUser.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId: systemUser.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true, id: sub.id });
  } catch (error: any) {
    console.error("Storefront push subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
