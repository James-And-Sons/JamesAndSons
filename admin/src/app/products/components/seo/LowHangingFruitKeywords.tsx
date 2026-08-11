"use client";
import React from "react";
import { TrendingUp, Plus, HelpCircle, Sparkles } from "lucide-react";
import { TopKeywordItem } from "@james-andsons/seo";

interface LowHangingFruitKeywordsProps {
  keywords?: TopKeywordItem[];
  onInsertKeyword?: (query: string) => void;
}

export default function LowHangingFruitKeywords({
  keywords = [],
  onInsertKeyword,
}: LowHangingFruitKeywordsProps) {
  const items =
    keywords.length > 0
      ? keywords
      : [
          {
            query: "brass wall fixture light",
            clicks: 140,
            impressions: 2100,
            ctr: 6.6,
            position: 4.2,
            isLowHangingFruit: false,
          },
          {
            query: "modern sconce lamp fixture",
            clicks: 75,
            impressions: 1850,
            ctr: 4.0,
            position: 9.1,
            isLowHangingFruit: true,
          },
          {
            query: "dimmable wall mounted LED",
            clicks: 42,
            impressions: 1420,
            ctr: 2.9,
            position: 11.5,
            isLowHangingFruit: true,
          },
          {
            query: "warm gold bedroom lighting",
            clicks: 31,
            impressions: 980,
            ctr: 3.1,
            position: 14.3,
            isLowHangingFruit: true,
          },
        ];

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-sm font-medium text-primary">
            Low-Hanging Fruit Keywords
          </h3>
          <div className="relative group">
            <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
              Identifies top search terms ranking in positions 8-20 on Google.
              Weaving these terms naturally into your product copy can quickly
              boost them to page 1.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left font-sans text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-mono text-muted uppercase">
              <th className="pb-2.5 font-medium">Search Term</th>
              <th className="pb-2.5 font-medium text-right">Avg Position</th>
              <th className="pb-2.5 font-medium text-right">Impressions</th>
              <th className="pb-2.5 font-medium text-right">CTR</th>
              <th className="pb-2.5 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-surface-muted/40 transition-colors"
              >
                <td className="py-3 font-medium text-primary flex items-center gap-2">
                  <span>{item.query}</span>
                  {item.isLowHangingFruit && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full">
                      <Sparkles className="w-2.5 h-2.5" /> Pos 8-20 Opportunity
                    </span>
                  )}
                </td>
                <td className="py-3 text-right font-mono text-muted">
                  {item.position}
                </td>
                <td className="py-3 text-right font-mono text-muted">
                  {item.impressions.toLocaleString()}
                </td>
                <td className="py-3 text-right font-mono text-muted">
                  {item.ctr}%
                </td>
                <td className="py-3 text-right font-mono">
                  {onInsertKeyword && (
                    <button
                      type="button"
                      onClick={() => onInsertKeyword(item.query)}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-surface border border-border rounded text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Weave into copy
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
