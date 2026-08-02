"use client";

import React from "react";
import { ThemeProvider, TenantProvider } from "@james-andsons/ui";
import { DEFAULT_TENANT_CONFIG } from "@james-andsons/config";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider config={DEFAULT_TENANT_CONFIG}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </TenantProvider>
  );
}
