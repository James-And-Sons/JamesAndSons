"use client";

import React from "react";
import CloudinaryUpload from "@/components/CloudinaryUpload";

interface BlogMetaSectionProps {
  title: string;
  slug: string;
  excerpt: string;
  featuredImg: string;
  isDraft: boolean;
  onTitleChange: (val: string) => void;
  onSlugChange: (val: string) => void;
  onExcerptChange: (val: string) => void;
  onFeaturedImgChange: (val: string) => void;
  onIsDraftChange: (val: boolean) => void;
}

export default function BlogMetaSection({
  title,
  slug,
  excerpt,
  featuredImg,
  isDraft,
  onTitleChange,
  onSlugChange,
  onExcerptChange,
  onFeaturedImgChange,
  onIsDraftChange,
}: BlogMetaSectionProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gold uppercase tracking-wider font-mono">
          Article Identity & Metadata
        </h3>
        <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => onIsDraftChange(e.target.checked)}
            className="accent-gold w-4 h-4"
          />
          <span
            className={
              isDraft
                ? "text-amber-400 font-bold"
                : "text-emerald-400 font-bold"
            }
          >
            {isDraft ? "Draft Mode" : "Published Live"}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-textMuted mb-1">
            Article Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-gold font-serif text-base"
          />
        </div>

        <div>
          <label className="block text-xs text-textMuted mb-1">URL Slug</label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm font-mono focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-textMuted mb-1">
          Article Summary Excerpt
        </label>
        <textarea
          rows={2}
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded text-text text-sm focus:outline-none focus:border-gold"
        />
      </div>

      <div>
        <label className="block text-xs text-textMuted mb-2">
          Featured Cover Photo
        </label>
        <CloudinaryUpload
          defaultImages={featuredImg ? [featuredImg] : []}
          onUpload={(urls: string[]) => onFeaturedImgChange(urls[0] || "")}
        />
      </div>
    </div>
  );
}
