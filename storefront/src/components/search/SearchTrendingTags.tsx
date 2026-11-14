"use client";

import React from "react";

interface SearchTrendingTagsProps {
  tags: string[];
  onSelectTag: (tag: string) => void;
}

export default function SearchTrendingTags({
  tags,
  onSelectTag,
}: SearchTrendingTagsProps) {
  return (
    <div className="p-4 border-b border-border/40">
      <div className="text-xs uppercase font-mono tracking-wider text-textMuted mb-2">
        Popular Searches
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onSelectTag(tag)}
            className="px-3 py-1 bg-surface2 hover:bg-gold/20 hover:text-gold text-text text-xs rounded-full border border-border/60 transition-all"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
