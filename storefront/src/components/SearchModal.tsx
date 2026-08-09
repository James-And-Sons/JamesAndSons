"use client";

import { useState, useEffect, useMemo } from "react";
import { Product } from "@/lib/utils";
import SearchResultRow, { SearchResultItem } from "./search/SearchResultRow";
import SearchTrendingTags from "./search/SearchTrendingTags";
import { Search, X } from "lucide-react";

type Props = { products: Product[]; onClose: () => void };

const POPULAR_TAGS = [
  "Chandeliers",
  "LED Lights",
  "Pendants",
  "Wall Sconces",
  "B2B Quote",
];

export default function SearchModal({ products, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();

    const productResults: SearchResultItem[] = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.category && p.category.name.toLowerCase().includes(q)),
      )
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        type: "product",
        title: p.name,
        subtitle: `SKU: ${p.sku} | ${p.category?.name || "Catalog"}`,
        url: `/products/${p.slug || p.id}`,
        price: p.d2cPrice || p.mrp || 0,
        imageUrl: p.images && p.images[0] ? p.images[0] : undefined,
        badge: "Product",
      }));

    return productResults;
  }, [debouncedQuery, products]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-10">
        {/* Input Bar */}
        <div className="flex items-center p-4 border-b border-border bg-surface">
          <Search size={20} className="text-gold mr-3" />
          <input
            type="text"
            placeholder="Search products, SKUs, or categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-text text-base placeholder-textMuted focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-textMuted hover:text-text rounded-md ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Popular Tags */}
        {!debouncedQuery && (
          <SearchTrendingTags
            tags={POPULAR_TAGS}
            onSelectTag={(tag) => setQuery(tag)}
          />
        )}

        {/* Search Results List */}
        <div className="max-h-[400px] overflow-y-auto p-4 space-y-1">
          {debouncedQuery && searchResults.length === 0 ? (
            <div className="text-center py-8 text-textMuted text-sm">
              No matching products or specifications found for &quot;
              {debouncedQuery}&quot;.
            </div>
          ) : (
            searchResults.map((item) => (
              <SearchResultRow key={item.id} item={item} onSelect={onClose} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
