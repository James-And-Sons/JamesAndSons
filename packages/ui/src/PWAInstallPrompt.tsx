"use client";
import React, { useState, useEffect } from "react";
import { useTenantConfig } from "./TenantProvider";

interface PWAInstallPromptProps {
  appName?: string;
}

export function PWAInstallPrompt({ appName }: PWAInstallPromptProps) {
  const config = useTenantConfig();
  const title = appName || config?.brand?.name || "James & Sons";

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running as installed standalone PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if dismissed in this session
    const isDismissed =
      sessionStorage.getItem("pwa_prompt_dismissed") === "true";
    setDismissed(isDismissed);

    // Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    const isSafari =
      /safari/i.test(ua) && !/chrome|crios|crmo|firefox|fxios/i.test(ua);
    setIsIOS(iosDevice && isSafari);

    // Listen for Chrome / Android beforeinstallprompt
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
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  // Don't show if standalone or dismissed or neither iOS nor Android prompt available
  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "16px",
        right: "16px",
        zIndex: 999,
        background: "var(--surface, #16161a)",
        color: "var(--text, #d4cfc4)",
        border: "1px solid var(--border-gold, rgba(197, 160, 89, 0.4))",
        borderRadius: "16px",
        padding: "14px 16px",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "var(--gold, #c4a05a)",
            color: "#0a0a0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "bold",
            flexShrink: 0,
          }}
        >
          📱
        </div>
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--gold, #c4a05a)",
              fontFamily: "var(--font-serif)",
            }}
          >
            Install {title}
          </div>
          <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "2px" }}>
            {isIOS ? (
              <span>
                Tap <strong>Share</strong> then{" "}
                <strong>Add to Home Screen</strong>
              </span>
            ) : (
              <span>Install app for fast offline access & notifications</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            style={{
              padding: "6px 14px",
              background: "var(--gold, #c4a05a)",
              color: "#0a0a0b",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted, #888)",
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px",
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
