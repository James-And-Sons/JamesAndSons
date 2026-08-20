"use client";

import { ClickableRow as SharedClickableRow } from "@james-andsons/ui";
import { ReactNode } from "react";

export default function ClickableRow({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SharedClickableRow href={href} className={className}>
      {children}
    </SharedClickableRow>
  );
}
