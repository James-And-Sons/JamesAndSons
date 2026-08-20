"use client";

import { SearchInput as SharedSearchInput } from "@james-andsons/ui";

export default function SearchInput({
  placeholder = "Search...",
}: {
  placeholder?: string;
}) {
  return <SharedSearchInput placeholder={placeholder} />;
}
