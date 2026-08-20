"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function SearchBarInput({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleClear = () => {
    setQuery("");
    router.push("/search");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
      <div className="relative flex items-center">
        <Search
          size={18}
          className="absolute left-4 text-[var(--gold)] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product name, SKU, category..."
          className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--gold)] rounded-2xl pl-11 pr-10 py-3 text-sm text-[var(--cream)] placeholder-[var(--text-muted)] focus:outline-none transition-colors shadow-inner font-sans"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 text-[var(--text-muted)] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  );
}
