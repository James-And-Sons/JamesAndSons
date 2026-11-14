"use client";

import { useEffect, useState } from "react";

export default function PwaInstallHelper() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<
    "android" | "ios" | "desktop" | "standalone"
  >("desktop");

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setPlatform("standalone");
      return;
    }

    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIos =
      /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);

    if (isIos) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[Admin PWA Install] Outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else if (platform === "ios") {
      alert(
        "To install Admin Portal on iOS Safari:\n1. Tap the Share button (↑)\n2. Scroll and select 'Add to Home Screen'",
      );
    } else if (platform === "android") {
      alert(
        "To install Admin Portal on Android Chrome:\n1. Tap the Chrome menu (⋮)\n2. Select 'Install app' or 'Add to Home screen'",
      );
    } else {
      alert(
        "To install Admin Portal on Desktop Chrome/Edge:\n1. Click the Install icon (💻) in your address bar\n2. Click Install",
      );
    }
  };

  if (platform === "standalone") {
    return (
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] uppercase tracking-wider flex items-center justify-between rounded-sm">
        <span>✅ Installed as Admin PWA App</span>
        <span>App Active</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface border border-accent/30 rounded-sm space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-serif text-[16px] text-primary font-light m-0">
            Admin Mobile & Desktop App
          </h4>
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted mt-0.5">
            Platform: {platform.toUpperCase()}
          </p>
        </div>
        <span className="text-xl">📱</span>
      </div>

      <p className="text-xs text-muted leading-relaxed m-0">
        {platform === "android"
          ? "Install the Admin Portal native app on Android for instant access, push notifications, and barcode scanning."
          : platform === "ios"
            ? "Install on iOS Safari: Tap Share (↑) and choose 'Add to Home Screen'."
            : "Install as a desktop application for fast windowed order processing."}
      </p>

      <button
        onClick={handleInstallClick}
        className="btn-primary font-mono text-[10px] uppercase tracking-widest px-4 py-2 w-full"
      >
        {deferredPrompt
          ? "Install Admin App Now 🚀"
          : platform === "ios"
            ? "View iOS Installation Guide 📱"
            : "Install App Guide ↗"}
      </button>
    </div>
  );
}
