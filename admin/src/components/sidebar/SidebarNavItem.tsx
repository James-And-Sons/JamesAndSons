"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  name: string;
  href: string;
  icon?: LucideIcon;
  badge?: number | null;
  isActive: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function SidebarNavItem({
  name,
  href,
  icon: Icon,
  badge,
  isActive,
  onClick,
}: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      className={`
        group flex items-center justify-between px-4 py-3 font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-200 border relative overflow-hidden rounded-sm
        ${
          isActive
            ? "text-primary border-accent/40 bg-surface-muted font-semibold"
            : "text-muted border-transparent hover:text-accent hover:border-border hover:bg-surface-muted"
        }
      `}
    >
      <span className="group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-2.5">
        {Icon ? (
          <Icon
            size={14}
            strokeWidth={isActive ? 2 : 1.5}
            className={
              isActive ? "text-accent" : "text-muted/70 group-hover:text-accent"
            }
            aria-hidden="true"
          />
        ) : isActive ? (
          <span
            className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
            aria-hidden="true"
          ></span>
        ) : null}
        <span>{name}</span>
      </span>
      {badge !== null && badge !== undefined && badge > 0 && (
        <span className="bg-[#f59e0b] text-black font-mono text-[9px] font-medium px-1.5 py-0.5 min-w-[20px] text-center rounded-sm">
          {badge}
        </span>
      )}
    </Link>
  );
}
