"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  queryParamKey?: string;
}

function SearchInputInner({
  placeholder = "Search...",
  className = "w-1/3 px-4 py-2 border border-border bg-background text-primary font-body text-[13px] focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50",
  queryParamKey = "q",
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get(queryParamKey) || "");

  useEffect(() => {
    if (query === (searchParams.get(queryParamKey) || "")) return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set(queryParamKey, query);
      } else {
        params.delete(queryParamKey);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, router, searchParams, queryParamKey]);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className={className}
    />
  );
}

export function SearchInput({
  placeholder = "Search...",
  className = "w-1/3 px-4 py-2 border border-border bg-background text-primary font-body text-[13px] focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50",
  queryParamKey = "q",
}: SearchInputProps) {
  return (
    <Suspense
      fallback={
        <input
          type="text"
          placeholder={placeholder}
          disabled
          className={className}
        />
      }
    >
      <SearchInputInner
        placeholder={placeholder}
        className={className}
        queryParamKey={queryParamKey}
      />
    </Suspense>
  );
}

export default SearchInput;
