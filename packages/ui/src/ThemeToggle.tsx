"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export interface ThemeToggleProps {
  compact?: boolean;
  variant?: "storefront" | "admin";
}

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle({
  compact = false,
  variant = "storefront",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted)
    return variant === "admin" ? <div className="w-[32px] h-[32px]" /> : null;

  if (variant === "admin") {
    const isDark = theme === "dark";
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex items-center justify-center w-[32px] h-[32px] rounded-sm border border-border text-muted hover:text-accent hover:border-accent/30 transition-colors bg-surface"
        aria-label="Toggle theme"
      >
        <span className="text-xs font-mono">{isDark ? "🌙" : "☀️"}</span>
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        background: "var(--surface2)",
        border: "0.5px solid var(--border)",
        borderRadius: "12px",
        padding: "4px",
        gap: "2px",
        flexShrink: 0,
      }}
    >
      {OPTIONS.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: compact ? "0" : "6px",
              padding: compact ? "8px 10px" : "8px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              background: isActive ? "var(--gold, #c4a05a)" : "transparent",
              color: isActive ? "#0A0905" : "var(--text-muted, #6b6860)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
