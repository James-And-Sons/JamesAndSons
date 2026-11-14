"use client";

import { ActionDropdown as SharedActionDropdown } from "@james-andsons/ui";

export default function ActionDropdown(props: {
  productId: string;
  sku: string;
  slug: string;
}) {
  return <SharedActionDropdown {...props} />;
}
