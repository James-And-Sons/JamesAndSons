"use client";

import React from "react";

interface FilterOptionsGroupProps {
  options: string[];
  activeFilters: string[];
  onToggleFilter: (filter: string) => void;
  searchQuery?: string;
}

export default function FilterOptionsGroup({
  options,
  activeFilters,
  onToggleFilter,
  searchQuery = "",
}: FilterOptionsGroupProps) {
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (filtered.length === 0) {
    return (
      <div className="p-6 text-center text-textMuted text-xs">
        No matching filters found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-4 custom-scrollbar">
      {filtered.map((option) => {
        const isChecked = activeFilters.includes(option);
        return (
          <label
            key={option}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer text-xs font-mono select-none ${
              isChecked
                ? "bg-gold/15 border-gold/60 text-gold font-bold shadow-sm"
                : "bg-surface/60 border-border/70 text-textMuted hover:text-cream hover:bg-surface2 hover:border-gold/30"
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggleFilter(option)}
              className="accent-gold w-4 h-4 cursor-pointer"
            />
            <span className="truncate">{option}</span>
          </label>
        );
      })}
    </div>
  );
}
