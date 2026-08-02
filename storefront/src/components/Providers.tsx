"use client";
import { ThemeProvider } from "next-themes";
import { TenantProvider } from "@james-andsons/ui";
import { DEFAULT_TENANT_CONFIG } from "@james-andsons/config";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider config={DEFAULT_TENANT_CONFIG}>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </TenantProvider>
  );
}
