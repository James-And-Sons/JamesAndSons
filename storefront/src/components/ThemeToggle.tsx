"use client";

import { ThemeToggle as SharedThemeToggle } from "@james-andsons/ui";

export default function ThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  return <SharedThemeToggle compact={compact} variant="storefront" />;
}
