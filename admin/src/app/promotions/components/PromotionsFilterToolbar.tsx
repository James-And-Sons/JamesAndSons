"use client";

import React from "react";
import { Search, Filter, RefreshCcw } from "lucide-react";
import { PromotionFilterState } from "../types";

interface PromotionsFilterToolbarProps {
  filters: PromotionFilterState;
  onFilterChange: (key: keyof PromotionFilterState, value: string) => void;
  onReset: () => void;
}

export default function PromotionsFilterToolbar({
  filters,
  onFilterChange,
  onReset,
}: PromotionsFilterToolbarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.status !== "ALL" ||
    filters.type !== "ALL" ||
    filters.channel !== "ALL";

  return (
    <div className="p-3 rounded-sm border border-border bg-surface/60 space-y-3">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Search promo code, description, or source..."
            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="EXPIRED">Expired</option>
            <option value="EXHAUSTED">Exhausted</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange("type", e.target.value)}
            className="px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </select>

          {/* Channel Filter */}
          <select
            value={filters.channel}
            onChange={(e) => onFilterChange("channel", e.target.value)}
            className="px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="ALL">All Channels</option>
            <option value="google_merchant">Google Merchant Center</option>
            <option value="meta">Meta Commerce / Ads</option>
            <option value="email">Email Blast</option>
            <option value="push">Web Push</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="p-2 text-xs font-mono text-muted hover:text-accent border border-border hover:border-accent/40 rounded-sm transition-all"
              title="Reset Filters"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
