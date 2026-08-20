import webpush from "web-push";
import { prisma } from "./prisma";

const initWebPush = () => {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:admin@jamesandsons.in";

  if (!publicKey || !privateKey) {
    console.warn(
      "Web Push VAPID keys not configured in environment variables.",
    );
    return false;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  return true;
};

export async function sendNotificationToAllAdmins(payload: {
  title: string;
  body: string;
  url: string;
  type: "TICKET" | "RFQ" | "ORDER" | "INQUIRY";
}) {
  const isInitialized = initWebPush();
  if (!isInitialized) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      include: {
        user: true,
      },
    });

    if (!subscriptions.length) return;

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
        );
      } catch (error: any) {
        console.error(
          `Failed to send push notification to subscription ID ${sub.id}:`,
          error,
        );
        if (error.statusCode === 410 || error.statusCode === 404) {
          try {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
            console.log(`Cleaned up expired subscription ID ${sub.id}`);
          } catch (deleteErr) {
            console.error(
              `Failed to delete expired subscription ID ${sub.id}:`,
              deleteErr,
            );
          }
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error("Error sending push notification to admins:", error);
  }
}
