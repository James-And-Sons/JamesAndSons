"use client";

import {
  SelectFilter as SharedSelectFilter,
  type FilterOption,
} from "@james-andsons/ui";

export type { FilterOption };
export default function SelectFilter(props: {
  paramName: string;
  options: FilterOption[];
  placeholder?: string;
}) {
  return <SharedSelectFilter {...props} />;
}
