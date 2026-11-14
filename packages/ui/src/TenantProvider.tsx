"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { ITenantConfig, DEFAULT_TENANT_CONFIG } from "@james-andsons/config";

interface ITenantContext {
  config: ITenantConfig;
  t: (
    key: string,
    fallback?: string,
    params?: Record<string, string | number>,
  ) => string;
}

const TenantContext = createContext<ITenantContext>({
  config: DEFAULT_TENANT_CONFIG,
  t: (key, fallback) => fallback || key,
});

export interface TenantProviderProps {
  config?: ITenantConfig;
  children: React.ReactNode;
}

export function TenantProvider({
  config = DEFAULT_TENANT_CONFIG,
  children,
}: TenantProviderProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    const applyThemeTokens = () => {
      const isLight =
        root.getAttribute("data-theme") === "light" ||
        root.classList.contains("light");

      const { colors, typography, borderRadius } = config.theme;
      const palette =
        isLight && colors.light
          ? { ...colors, ...colors.light }
          : colors.dark
            ? { ...colors, ...colors.dark }
            : colors;

      root.style.setProperty("--gold", palette.primary);
      root.style.setProperty("--gold-light", palette.primaryLight);
      root.style.setProperty("--gold-pale", palette.primaryPale);
      root.style.setProperty("--obsidian", palette.background);
      root.style.setProperty("--surface", palette.surface);
      root.style.setProperty("--surface2", palette.surface2);
      root.style.setProperty("--text", palette.text);
      root.style.setProperty("--text-muted", palette.textMuted);
      root.style.setProperty("--text-dim", palette.textDim);
      root.style.setProperty("--border", palette.border);
      root.style.setProperty("--border-gold", palette.borderAccent);
      root.style.setProperty("--radius-btn", borderRadius.button);
      root.style.setProperty("--radius-card", borderRadius.card);
      root.style.setProperty("--radius-input", borderRadius.input);

      if (typography.headingFont) {
        root.style.setProperty(
          "--font-serif",
          `'${typography.headingFont}', Georgia, serif`,
        );
      }
      if (typography.bodyFont) {
        root.style.setProperty(
          "--font-body",
          `'${typography.bodyFont}', sans-serif`,
        );
      }
      if (typography.monoFont) {
        root.style.setProperty(
          "--font-mono",
          `'${typography.monoFont}', monospace`,
        );
      }
    };

    applyThemeTokens();

    const observer = new MutationObserver(applyThemeTokens);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => observer.disconnect();
  }, [config]);

  const t = useMemo(() => {
    return (
      key: string,
      fallback?: string,
      params?: Record<string, string | number>,
    ): string => {
      let value = config.dictionary[key] || fallback || key;
      if (params) {
        Object.entries(params).forEach(([pKey, pValue]) => {
          value = value.replace(
            new RegExp(`\\{${pKey}\\}`, "g"),
            String(pValue),
          );
        });
      }
      return value;
    };
  }, [config.dictionary]);

  return (
    <TenantContext.Provider value={{ config, t }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantConfig(): ITenantConfig {
  const context = useContext(TenantContext);
  return context.config;
}

export function useDictionary() {
  const context = useContext(TenantContext);
  return { t: context.t };
}
