"use client";

import React, { ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface ClickableRowProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function ClickableRow({
  href,
  children,
  className = "",
}: ClickableRowProps) {
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive =
      target.tagName === "A" ||
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("a") ||
      target.closest("button");

    if (!isInteractive && href) {
      if (e.ctrlKey || e.metaKey) {
        window.open(href, "_blank");
      } else {
        router.push(href);
      }
    }
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`cursor-pointer hover:bg-surface-muted/60 transition-colors ${className}`}
    >
      {children}
    </tr>
  );
}

export default ClickableRow;
