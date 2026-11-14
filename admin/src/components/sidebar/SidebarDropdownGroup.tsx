"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface SubItem {
  name: string;
  href: string;
  active?: boolean;
}

interface SidebarDropdownGroupProps {
  name: string;
  icon?: LucideIcon;
  manageHref: string;
  isOpenDefault?: boolean;
  isGroupActive?: boolean;
  subItems: SubItem[];
  onNavClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  showSearch?: boolean;
  searchVal?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;
  onSearchClear?: () => void;
}

export default function SidebarDropdownGroup({
  name,
  icon: Icon,
  manageHref,
  isOpenDefault = false,
  isGroupActive = false,
  subItems,
  onNavClick,
  showSearch,
  searchVal = "",
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
}: SidebarDropdownGroupProps) {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="space-y-1">
      <div
        className={`
          flex items-center justify-between font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-200 border rounded-sm relative overflow-hidden group
          ${
            isGroupActive
              ? "text-primary border-accent/30 bg-surface-muted/40 font-semibold"
              : "text-muted border-transparent hover:text-accent hover:border-border hover:bg-surface-muted"
          }
        `}
      >
        <Link
          href={manageHref}
          onClick={onNavClick}
          className="flex-1 px-4 py-3 flex items-center gap-2.5 hover:text-accent transition-colors"
        >
          {Icon ? (
            <Icon
              size={14}
              strokeWidth={isGroupActive ? 2 : 1.5}
              className={
                isGroupActive
                  ? "text-accent"
                  : "text-muted/70 group-hover:text-accent"
              }
              aria-hidden="true"
            />
          ) : isGroupActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-accent/70"></span>
          ) : null}
          <span>{name}</span>
        </Link>

        <button
          type="button"
          onClick={toggle}
          className="px-4 py-3 flex items-center justify-center border-l border-border/10 hover:text-accent transition-colors cursor-pointer"
          aria-label={`Toggle ${name} dropdown`}
        >
          <span
            className={`text-[12px] font-semibold transition-transform duration-300 ${
              isOpen ? "rotate-90 text-accent" : ""
            }`}
          >
            ›
          </span>
        </button>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out pl-3 space-y-1 border-l border-border/50 ml-4"
        style={{
          maxHeight: isOpen
            ? `${(subItems.length + (showSearch ? 2 : 1)) * 40}px`
            : "0px",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {showSearch && (
          <div className="px-2 py-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchVal}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSearchSubmit?.();
                  }
                }}
                className="w-full bg-background border border-border/80 hover:border-border/100 focus:border-accent px-3 py-2 text-[11px] font-mono text-primary focus:outline-none transition-colors placeholder:text-muted/50 rounded-sm"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={onSearchClear}
                  className="absolute right-2.5 top-2 text-muted hover:text-accent font-mono text-[12px] cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {!showSearch && (
          <Link
            href={manageHref}
            onClick={onNavClick}
            className={`
              group flex items-center pl-4 py-2.5 font-mono text-[9px] tracking-[0.15em] uppercase transition-all duration-200 border-l hover:border-accent/40 relative rounded-sm
              ${
                !subItems.some((i) => i.active)
                  ? "text-accent border-l-accent bg-surface-muted/20 font-semibold"
                  : "text-muted border-l-transparent hover:text-accent hover:bg-surface-muted"
              }
            `}
          >
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              View All {name}
            </span>
          </Link>
        )}

        {subItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            onClick={onNavClick}
            className={`
              group flex items-center pl-4 py-2.5 font-mono text-[9px] tracking-[0.15em] uppercase transition-all duration-200 border-l hover:border-accent/40 relative rounded-sm
              ${
                item.active
                  ? "text-accent border-l-accent bg-surface-muted/20 font-semibold"
                  : "text-muted border-l-transparent hover:text-accent hover:bg-surface-muted"
              }
            `}
          >
            <span className="group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1.5">
              {item.active && (
                <span className="w-1 h-1 rounded-full bg-accent animate-pulse"></span>
              )}
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
