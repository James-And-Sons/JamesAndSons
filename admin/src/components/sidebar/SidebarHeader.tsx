"use client";

import React from "react";
import { BrandLogo, useTenantConfig } from "@james-andsons/ui";

interface SidebarHeaderProps {
  onClose?: () => void;
}

export default function SidebarHeader({ onClose }: SidebarHeaderProps) {
  const config = useTenantConfig();

  return (
    <div className="h-[64px] flex flex-col justify-center px-8 border-b border-border relative overflow-hidden bg-background shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo
            variant="light"
            className="logo-light-img h-14 w-auto z-10"
          />
          <BrandLogo
            variant="dark"
            className="logo-dark-img h-14 w-auto z-10"
          />
          <div>
            <h1 className="font-serif text-[16px] font-light tracking-[0.2em] text-accent-hover uppercase z-10 leading-none">
              {config.brand.name}
            </h1>
            <p className="font-mono text-[8px] text-muted mt-1 uppercase tracking-[0.18em] z-10 leading-none">
              Admin Portal
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-muted hover:text-accent"
            aria-label="Close Sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
