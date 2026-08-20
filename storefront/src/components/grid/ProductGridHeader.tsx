"use client";

import React from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

interface ProductGridHeaderProps {
  activeFiltersCount: number;
  activeFilterTitle?: string;
  totalProductsCount: number;
  showFilters: boolean;
  onToggleShowFilters: () => void;
}

export default function ProductGridHeader({
  activeFiltersCount,
  activeFilterTitle,
  totalProductsCount,
  showFilters,
  onToggleShowFilters,
}: ProductGridHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border/60">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-1">
          {activeFiltersCount === 0
            ? "Masterworks Catalog"
            : "Curated Selection"}
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-cream">
          {activeFilterTitle || "All Collections"}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          data-dropdown-area="true"
          onClick={onToggleShowFilters}
          className={`flex items-center gap-2 px-4 py-2 rounded border font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
            showFilters
              ? "bg-gold/15 border-gold text-gold font-bold"
              : "bg-surface/60 border-border text-textMuted hover:text-cream hover:border-gold/40"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-gold text-obsidian text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <span className="font-mono text-xs text-textMuted">
          {totalProductsCount} Products
        </span>
      </div>
    </div>
  );
}
