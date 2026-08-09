"use client";

import { useEffect, useState } from "react";

export default function PwaInstallHelper() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<
    "android" | "ios" | "desktop" | "standalone"
  >("desktop");
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setPlatform("standalone");
      return;
    }

    // Detect user platform
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

    // Listen for native Android/Desktop Chrome beforeinstallprompt event
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
      console.log(`[PWA Install] Choice outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else if (platform === "ios") {
      alert(
        "To install on iOS:\n1. Tap the Share button in Safari\n2. Scroll down and tap 'Add to Home Screen'",
      );
    } else {
      alert(
        "To install:\nTap your browser menu (⋮) and select 'Install App' or 'Add to Home Screen'",
      );
    }
  };

  if (platform === "standalone" || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-[#0a0a0b] border border-[#C97E6A]/40 text-white p-4 shadow-2xl rounded-sm flex flex-col gap-3 font-sans">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📱</span>
          <div>
            <h4 className="font-serif text-[15px] font-medium text-white m-0">
              Install App
            </h4>
            <p className="font-mono text-[10px] text-gray-400 m-0 uppercase tracking-wider">
              {platform === "android"
                ? "Android App"
                : platform === "ios"
                  ? "iOS Safari Web App"
                  : "Desktop App"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-gray-400 hover:text-white font-mono text-xs px-1"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-gray-300 m-0 leading-relaxed">
        {platform === "android"
          ? "Install the official app on your Android device for instant access & offline order tracking."
          : platform === "ios"
            ? "Tap Share (↑) in Safari and choose 'Add to Home Screen' to install."
            : "Install directly on your desktop for quick order management."}
      </p>

      <button
        onClick={handleInstallClick}
        className="w-full py-2.5 bg-gradient-to-r from-[#C97E6A] to-[#b36754] text-white font-mono text-[10px] uppercase tracking-widest font-bold rounded-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
      >
        {deferredPrompt
          ? "Install App Now 🚀"
          : platform === "ios"
            ? "How to Install on iOS 📱"
            : "Install App Guide ↗"}
      </button>
    </div>
  );
}
