"use client";

import React, { useEffect } from "react";
import { ThemeProvider, TenantProvider } from "@james-andsons/ui";
import { DEFAULT_TENANT_CONFIG } from "@james-andsons/config";

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          reg.update();
        })
        .catch(() => {
          /* silent */
        });
    }
  }, []);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider config={DEFAULT_TENANT_CONFIG}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <ServiceWorkerRegistrar />
        {children}
      </ThemeProvider>
    </TenantProvider>
  );
}
