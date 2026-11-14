"use client";

import React from "react";
import { Search, Filter, Plus } from "lucide-react";
import Link from "next/link";

interface ProductsFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCollection: string;
  onCollectionChange: (c: string) => void;
  collections: string[];
  totalCount: number;
}

export default function ProductsFilterToolbar({
  searchQuery,
  onSearchChange,
  selectedCollection,
  onCollectionChange,
  collections = [],
  totalCount,
}: ProductsFilterToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface p-4 border border-border rounded-xl shadow-sm">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-2.5 text-textMuted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by title or SKU..."
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
          />
        </div>

        <select
          value={selectedCollection}
          onChange={(e) => onCollectionChange(e.target.value)}
          className="px-3 py-1.5 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold font-mono"
        >
          <option value="ALL">All Collections</option>
          {collections.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4">
        <span className="font-mono text-xs text-textMuted">
          {totalCount} Catalog Items
        </span>
        <Link
          href="/products/new"
          className="px-4 py-2 bg-gold text-obsidian font-mono text-xs uppercase tracking-wider font-bold rounded hover:bg-gold-pale transition-all flex items-center gap-1.5 shadow-md"
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>
    </div>
  );
}
