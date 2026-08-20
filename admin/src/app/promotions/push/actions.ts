"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import webpush from "web-push";

const initWebPush = () => {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:admin@jamesandsons.in";

  if (!publicKey || !privateKey) {
    console.warn("VAPID keys not configured in environment variables.");
    return false;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  return true;
};

export async function getPushCampaignStats() {
  try {
    await requireAdmin("push_campaigns");
    const totalSubscriptions = await prisma.pushSubscription.count();
    const adminSubscriptions = await prisma.pushSubscription.count({
      where: { user: { role: "ADMIN" } },
    });
    const storefrontSubscriptions = totalSubscriptions - adminSubscriptions;

    return {
      success: true,
      totalSubscriptions,
      storefrontSubscriptions: Math.max(0, storefrontSubscriptions),
      adminSubscriptions,
    };
  } catch (error: any) {
    console.error("[Get Push Stats Error]:", error);
    return {
      success: false,
      totalSubscriptions: 0,
      storefrontSubscriptions: 0,
      adminSubscriptions: 0,
    };
  }
}

export async function sendPushBroadcastAction(payload: {
  title: string;
  body: string;
  url?: string;
  image?: string;
  targetAudience?: "ALL" | "STOREFRONT" | "ADMIN";
}) {
  try {
    await requireAdmin("push_campaigns");
    const isInitialized = initWebPush();
    if (!isInitialized) {
      throw new Error("Web Push VAPID keys not configured in environment.");
    }

    // Character Enforcers
    const title = payload.title.trim().slice(0, 50);
    const body = payload.body.trim().slice(0, 120);
    const url = payload.url?.trim() || "/";
    const image = payload.image?.trim() || undefined;

    let whereClause: any = {};
    if (payload.targetAudience === "ADMIN") {
      whereClause = { user: { role: "ADMIN" } };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
      include: { user: true },
    });

    if (subscriptions.length === 0) {
      return {
        success: false,
        error: "No active push notification subscribers found.",
      };
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      url,
      image,
      tag: `jas-campaign-${Date.now()}`,
    });

    let sentCount = 0;
    let failedCount = 0;

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, pushPayload);
        sentCount++;
      } catch (err: any) {
        failedCount++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        }
      }
    });

    await Promise.allSettled(sendPromises);
    revalidatePath("/promotions/push");

    return {
      success: true,
      sentCount,
      failedCount,
      totalTargeted: subscriptions.length,
      message: `Push broadcast delivered to ${sentCount} subscriber(s).`,
    };
  } catch (error: any) {
    console.error("[Send Push Broadcast Error]:", error);
    return {
      success: false,
      error: error.message || "Failed to deliver push broadcast.",
    };
  }
}

/**
 * Trigger automated push notification when a new product is added
 */
export async function triggerNewProductPushNotification(product: {
  id: string;
  name: string;
  slug?: string;
  d2cPrice: number;
  images?: string[];
}) {
  try {
    const isInitialized = initWebPush();
    if (!isInitialized) return;

    const title = `✨ New Drop: ${product.name}`.slice(0, 50);
    const body =
      `Discover our new bespoke lighting piece for ₹${product.d2cPrice.toLocaleString("en-IN")}.`.slice(
        0,
        120,
      );
    const heroImage =
      product.images && product.images.length > 0
        ? product.images[0]
        : undefined;
    const url = `/products/${product.slug || product.id}`;

    await sendPushBroadcastAction({
      title,
      body,
      url,
      image: heroImage,
      targetAudience: "ALL",
    });
    console.log(
      `[Auto Push] Sent New Product Launch notification for ${product.name}`,
    );
  } catch (err) {
    console.error("[Auto Push Error]:", err);
  }
}
