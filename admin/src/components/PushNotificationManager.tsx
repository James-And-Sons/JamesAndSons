"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

// Helper to convert base64 VAPID key to Uint8Array for subscribe options
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Sections that "clear" badge count when visited
const BADGE_CLEAR_PATHS: Record<string, string[]> = {
  "/tickets": ["tickets"],
  "/orders": ["orders"],
  "/rfqs": ["rfqs"],
  "/inquiries": ["inquiries"],
};

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const pathname = usePathname();

  // ── Badging API ────────────────────────────────────────────────────────────
  const updateAppBadge = useCallback(async () => {
    if (typeof navigator === "undefined") return;
    if (!("setAppBadge" in navigator)) return;
    try {
      const res = await fetch("/api/notifications/summary");
      if (!res.ok) return;
      const data = await res.json();
      const total =
        (data.tickets || 0) +
        (data.orders || 0) +
        (data.rfqs || 0) +
        (data.inquiries || 0);
      if (total > 0) {
        await (navigator as any).setAppBadge(total);
      } else {
        await (navigator as any).clearAppBadge();
      }
    } catch {
      // Badge API is best-effort — swallow errors silently
    }
  }, []);

  // Update badge on page focus and every 5 minutes when visible
  useEffect(() => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      updateAppBadge();
    }

    const handleFocus = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        updateAppBadge();
      }
    };
    document.addEventListener("visibilitychange", handleFocus);
    const interval = setInterval(handleFocus, 300_000);
    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
      clearInterval(interval);
    };
  }, [updateAppBadge]);

  // Clear badge for the specific category when user navigates to it
  useEffect(() => {
    if (typeof navigator === "undefined" || !("clearAppBadge" in navigator))
      return;
    for (const [prefix] of Object.entries(BADGE_CLEAR_PATHS)) {
      if (pathname?.startsWith(prefix)) {
        // Re-fetch the badge count (minus the visited section) rather than just clearing to 0
        updateAppBadge();
        break;
      }
    }
  }, [pathname, updateAppBadge]);

  // ── Service Worker + Push ──────────────────────────────────────────────────
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // If we are already subscribed, let's keep the backend in sync
      if (subscription) {
        await sendSubscriptionToBackend(subscription);
      }
    } catch (err) {
      console.error("Error checking push subscription:", err);
    }
  };

  const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });
      if (!response.ok) {
        console.warn("Failed to send subscription details to backend");
      }
    } catch (err) {
      console.error("Error sending subscription to backend:", err);
    }
  };

  const handleSubscribe = async () => {
    try {
      const requestedPermission = await Notification.requestPermission();
      setPermission(requestedPermission);

      if (requestedPermission !== "granted") {
        console.log("Notification permission denied by user");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error("VAPID public key not found in env configuration");
        return;
      }

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      await sendSubscriptionToBackend(subscription);
      setIsSubscribed(true);
      console.log("Successfully subscribed user to push notifications");
    } catch (err) {
      console.error("Failed to subscribe user:", err);
    }
  };

  // Automatically request/subscribe if supported and permission is default
  useEffect(() => {
    if (isSupported && permission === "default") {
      // Delay slightly to not interrupt initial page load
      const timer = setTimeout(() => {
        handleSubscribe();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  // Periodic Background Sync Registration
  useEffect(() => {
    if (isSupported && isSubscribed) {
      registerPeriodicSync();
    }
  }, [isSupported, isSubscribed]);

  const registerPeriodicSync = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if ("periodicSync" in registration) {
        const status = await (navigator as any).permissions.query({
          name: "periodic-background-sync",
        });

        if (status.state === "granted") {
          await (registration as any).periodicSync.register("check-new-items", {
            minInterval: 5 * 60 * 1000, // 5 minutes
          });
          console.log("Registered periodic background sync: check-new-items");
        } else {
          console.log("Periodic background sync permission not granted");
        }
      }
    } catch (err) {
      console.warn("Periodic Background Sync registration failed:", err);
    }
  };

  return null; // Invisible component
}
