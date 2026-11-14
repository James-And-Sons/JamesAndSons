"use client";

import React from "react";

export type FilterTab =
  "price" | "collections" | "spaces" | "styles" | "materials";

interface FilterTabListProps {
  activeTab: FilterTab;
  setActiveTab: (tab: FilterTab) => void;
  counts: Record<FilterTab, number>;
}

export default function FilterTabList({
  activeTab,
  setActiveTab,
  counts,
}: FilterTabListProps) {
  const tabs: { key: FilterTab; label: string }[] = [
    { key: "price", label: "Price Range" },
    { key: "collections", label: "Collections" },
    { key: "spaces", label: "Spaces" },
    { key: "styles", label: "Design Style" },
    { key: "materials", label: "Material & Finish" },
  ];

  return (
    <div className="flex border-b border-border overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === tab.key
              ? "border-gold text-gold bg-surface2/50"
              : "border-transparent text-textMuted hover:text-text"
          }`}
        >
          <span>{tab.label}</span>
          {counts[tab.key] > 0 && (
            <span className="w-4 h-4 rounded-full bg-gold text-obsidian text-[10px] font-bold flex items-center justify-center">
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
