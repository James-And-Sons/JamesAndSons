"use client";
import React from "react";
import { Globe, FileText, Image as ImageIcon, HelpCircle } from "lucide-react";
import { getProductPublicUrl } from "@james-andsons/seo";

interface SerpPreviewCardProps {
  title: string;
  description: string;
  slug: string;
  missingAltCount?: number;
}

export default function SerpPreviewCard({
  title,
  description,
  slug,
  missingAltCount = 0,
}: SerpPreviewCardProps) {
  const publicUrl = getProductPublicUrl(slug || "sample-product");

  const titleLen = (title || "").length;
  const descLen = (description || "").length;

  const isTitleGood = titleLen >= 50 && titleLen <= 60;
  const isDescGood = descLen >= 150 && descLen <= 160;

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-sm font-medium text-primary">
            On-Page Health & SERP Preview
          </h3>
          <div className="relative group">
            <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
              Real-time Google search snippet rendering. Optimized titles are
              50-60 characters; descriptions 150-160 characters.
            </div>
          </div>
        </div>
      </div>

      {/* Google SERP Card Preview */}
      <div className="mt-4 p-4 bg-background border border-border rounded-md font-sans">
        <div className="flex items-center gap-2 text-[12px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{publicUrl}</span>
        </div>
        <h4 className="text-[17px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mt-1 font-sans truncate">
          {title || "Product Title Preview"}
        </h4>
        <p className="text-[13px] text-muted mt-1 leading-snug line-clamp-2">
          {description ||
            "Add a detailed meta description to improve organic click-through rate on search engine result pages."}
        </p>
      </div>

      {/* Real-time Character Counters */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Title Counter */}
        <div className="p-3 bg-surface-muted/40 border border-border rounded">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-mono text-muted flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Title Tag
            </span>
            <span
              className={`font-mono ${isTitleGood ? "text-emerald-500 font-semibold" : "text-amber-500"}`}
            >
              {titleLen} / 60 chars
            </span>
          </div>
          <div className="mt-2 w-full bg-border h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isTitleGood ? "bg-emerald-500" : titleLen > 60 ? "bg-rose-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, (titleLen / 60) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted font-mono mt-1 block">
            Target: 50-60 chars
          </span>
        </div>

        {/* Description Counter */}
        <div className="p-3 bg-surface-muted/40 border border-border rounded">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-mono text-muted flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Meta Description
            </span>
            <span
              className={`font-mono ${isDescGood ? "text-emerald-500 font-semibold" : "text-amber-500"}`}
            >
              {descLen} / 160 chars
            </span>
          </div>
          <div className="mt-2 w-full bg-border h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isDescGood ? "bg-emerald-500" : descLen > 160 ? "bg-rose-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, (descLen / 160) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted font-mono mt-1 block">
            Target: 150-160 chars
          </span>
        </div>

        {/* Primary ALT Text Auditor */}
        <div className="p-3 bg-surface-muted/40 border border-border rounded flex flex-col justify-between">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-mono text-muted flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Image ALT Text
            </span>
            <span
              className={`font-mono ${missingAltCount === 0 ? "text-emerald-500 font-semibold" : "text-rose-500"}`}
            >
              {missingAltCount === 0 ? "All Set" : `${missingAltCount} Missing`}
            </span>
          </div>
          <p className="text-[11px] text-muted mt-1 leading-snug">
            {missingAltCount === 0
              ? "Primary gallery images include ALT description tags."
              : "Some product images lack descriptive primary ALT attributes."}
          </p>
        </div>
      </div>
    </div>
  );
}
