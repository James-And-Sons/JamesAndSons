"use client";

import React, { useState } from "react";
import PriceSlider from "./PriceSlider";
import FilterTabList, { FilterTab } from "./filter/FilterTabList";
import FilterOptionsGroup from "./filter/FilterOptionsGroup";
import { X, RotateCcw } from "lucide-react";

type FilterPanelProps = {
  uniqueCollections: string[];
  uniqueSpaces: string[];
  uniqueStyles: string[];
  uniqueMaterials: string[];
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  clearAllFilters: () => void;
  globalMin: number;
  globalMax: number;
  priceMin: number;
  priceMax: number;
  setPriceMin: (val: number) => void;
  setPriceMax: (val: number) => void;
  priceActive: boolean;
  totalResultsCount: number;
  onClose: () => void;
};

export default function FilterPanel({
  uniqueCollections,
  uniqueSpaces,
  uniqueStyles,
  uniqueMaterials,
  activeFilters,
  toggleFilter,
  clearAllFilters,
  globalMin,
  globalMax,
  priceMin,
  priceMax,
  setPriceMin,
  setPriceMax,
  priceActive,
  totalResultsCount,
  onClose,
}: FilterPanelProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("price");
  const [filterSearch, setFilterSearch] = useState("");

  const counts: Record<FilterTab, number> = {
    price: priceActive ? 1 : 0,
    collections: uniqueCollections.filter((c) => activeFilters.includes(c))
      .length,
    spaces: uniqueSpaces.filter((s) => activeFilters.includes(s)).length,
    styles: uniqueStyles.filter((st) => activeFilters.includes(st)).length,
    materials: uniqueMaterials.filter((m) => activeFilters.includes(m)).length,
  };

  const getActiveOptions = () => {
    switch (activeTab) {
      case "collections":
        return uniqueCollections;
      case "spaces":
        return uniqueSpaces;
      case "styles":
        return uniqueStyles;
      case "materials":
        return uniqueMaterials;
      default:
        return [];
    }
  };

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface/50 flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-lg text-text">
            Refine Collection
          </h3>
          <p className="text-xs text-textMuted">
            {totalResultsCount} matching products
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(activeFilters.length > 0 || priceActive) && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gold hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw size={12} />
              Reset All
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-textMuted hover:text-text rounded-md"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <FilterTabList
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
      />

      {/* Body */}
      {activeTab === "price" ? (
        <div className="p-6">
          <PriceSlider
            min={globalMin}
            max={globalMax}
            currentMin={priceMin}
            currentMax={priceMax}
            onChange={(min, max) => {
              setPriceMin(min);
              setPriceMax(max);
            }}
            onReset={clearAllFilters}
          />
        </div>
      ) : (
        <div>
          <div className="p-3 border-b border-border/40 bg-surface/20">
            <input
              type="text"
              placeholder="Search filters..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs text-text focus:outline-none focus:border-gold"
            />
          </div>
          <FilterOptionsGroup
            options={getActiveOptions()}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            searchQuery={filterSearch}
          />
        </div>
      )}
    </div>
  );
}
