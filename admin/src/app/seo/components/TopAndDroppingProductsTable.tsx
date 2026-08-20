"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { TrafficDropAlert } from "@james-andsons/seo";

interface TopProductItem {
  id: string;
  name: string;
  slug: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  indexingStatus: string;
}

interface TopAndDroppingProductsTableProps {
  topProducts: TopProductItem[];
  trafficDrops: TrafficDropAlert[];
}

export default function TopAndDroppingProductsTable({
  topProducts,
  trafficDrops,
}: TopAndDroppingProductsTableProps) {
  const [tab, setTab] = useState<"top" | "drops">("top");

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-base font-medium text-primary">
              Product Traffic & Performance
            </h3>
            <div className="relative group">
              <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
                Highlights top organic traffic drivers vs products suffering
                week-over-week click drops &gt;20%.
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-surface-muted p-1 border border-border rounded font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setTab("top")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
              tab === "top"
                ? "bg-background text-primary shadow-sm"
                : "text-muted hover:text-primary"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Top Earners ({topProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("drops")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
              tab === "drops"
                ? "bg-background text-rose-500 shadow-sm"
                : "text-muted hover:text-primary"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Traffic Drops Alert ({trafficDrops.length})
          </button>
        </div>
      </div>

      {tab === "top" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] font-mono text-muted uppercase">
                <th className="pb-2.5 font-medium">Product Name</th>
                <th className="pb-2.5 font-medium text-right">
                  Organic Clicks
                </th>
                <th className="pb-2.5 font-medium text-right">Impressions</th>
                <th className="pb-2.5 font-medium text-right">Avg Position</th>
                <th className="pb-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {topProducts.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-surface-muted/40 transition-colors"
                >
                  <td className="py-3 font-medium text-primary flex items-center gap-2">
                    <Link
                      href={`/products/${p.id}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      {p.name}
                      <ExternalLink className="w-3 h-3 text-muted" />
                    </Link>
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {p.clicks.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono text-muted">
                    {p.impressions.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono text-muted">
                    {p.position}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/products/${p.id}`}
                      className="text-[11px] font-mono px-2.5 py-1 bg-surface border border-border rounded text-primary hover:bg-surface-muted transition-colors"
                    >
                      Audit SEO
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {trafficDrops.map((drop, idx) => (
            <div
              key={idx}
              className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[14px] font-medium text-primary flex items-center gap-1.5">
                    {drop.productName}
                    <span className="text-[11px] font-mono text-rose-500 font-semibold px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/20">
                      -{drop.dropPercentage}% WoW
                    </span>
                  </h4>
                  <p className="text-[12px] font-mono text-muted mt-1">
                    Organic Clicks dropped from{" "}
                    <span className="text-primary font-semibold">
                      {drop.previousClicks}
                    </span>{" "}
                    to{" "}
                    <span className="text-rose-500 font-semibold">
                      {drop.currentClicks}
                    </span>{" "}
                    week-over-week.
                  </p>
                </div>
              </div>

              <Link
                href={`/products/${drop.productId}`}
                className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 bg-background border border-rose-500/30 text-rose-500 rounded hover:bg-rose-500/10 transition-colors shrink-0"
              >
                Inspect Health Panel
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
