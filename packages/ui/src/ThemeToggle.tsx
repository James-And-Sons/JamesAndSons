"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export interface ThemeToggleProps {
  compact?: boolean;
  variant?: "storefront" | "admin";
}

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

function SunIcon({ className = "w-3.5 h-3.5", style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25m-13.5 0H3m15.364-6.364l-1.591 1.591M6.758 17.242l-1.591 1.591m12.728 0l-1.591-1.591M6.758 6.758L5.167 5.167M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"
      />
    </svg>
  );
}

function MoonIcon({ className = "w-3.5 h-3.5", style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  );
}

function SystemIcon({ className = "w-3.5 h-3.5", style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 3v18" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

const OPTIONS = [
  { value: "system", label: "System", Icon: SystemIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
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
    return (
      <div className="flex items-center bg-surface border border-border rounded-sm p-0.5 gap-0.5">
        {OPTIONS.map((opt) => {
          const isActive = theme === opt.value;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              title={`Switch to ${opt.label} theme`}
              className={`flex items-center justify-center w-7 h-7 rounded-sm text-xs transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent border border-accent/30 font-medium"
                  : "text-muted hover:text-primary hover:bg-surface-muted border border-transparent"
              }`}
              aria-label={`Set theme to ${opt.label}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>
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
        const Icon = opt.Icon;
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
              color: isActive
                ? "var(--obsidian, #0A0905)"
                : "var(--text-muted, #6b6860)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              fontWeight: isActive ? 600 : 400,
            }}
          >
            <Icon
              className="w-3.5 h-3.5"
              style={{
                color: isActive ? "var(--obsidian, #0A0905)" : "inherit",
              }}
            />
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
