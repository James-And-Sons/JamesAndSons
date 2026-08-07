"use client";

import { useState, useEffect } from "react";
import { Bell, X, Sparkles } from "lucide-react";

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

export default function StorefrontPushManager() {
  const [showBanner, setShowBanner] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      // Register storefront service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[Storefront SW] Registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.warn("[Storefront SW] Registration error:", err);
        });

      // Check if permission is default and user hasn't dismissed recently
      const dismissed = localStorage.getItem("jns_push_banner_dismissed");
      if (Notification.permission === "default" && !dismissed) {
        const timer = setTimeout(() => setShowBanner(true), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShowBanner(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.");
        setShowBanner(false);
        return;
      }

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // Send subscription to backend API
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      setShowBanner(false);
    } catch (err) {
      console.error("[Storefront Push Subscribe Error]:", err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("jns_push_banner_dismissed", String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-[#141414]/95 border border-[#C4A05A]/40 backdrop-blur-md shadow-2xl rounded-sm text-white transition-all animate-in fade-in slide-in-from-bottom-5">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted hover:text-white transition-colors"
        aria-label="Dismiss notification prompt"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="p-2.5 bg-[#C4A05A]/10 border border-[#C4A05A]/30 text-[#C4A05A] rounded-xs shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <p className="font-serif text-[15px] font-medium text-white tracking-wide">
            VIP Early Access & New Drops
          </p>
          <p className="font-sans text-[12px] text-zinc-300 leading-relaxed">
            Get instant alerts when new bespoke lighting drops, limited artisan
            collections, and private offers launch.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="px-4 py-2 bg-[#C4A05A] text-black hover:bg-[#d5b16b] font-mono text-[10px] uppercase tracking-wider rounded-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {isSubscribing ? "Subscribing..." : "Enable Instant Alerts"}
              </span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-zinc-400 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
