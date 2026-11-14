"use client";
import React from "react";
import Link from "next/link";
import { Layers, AlertTriangle, ExternalLink, HelpCircle } from "lucide-react";
import { CannibalizationIssue } from "@james-andsons/seo";

interface CannibalizationDetectorWidgetProps {
  issues: CannibalizationIssue[];
}

export default function CannibalizationDetectorWidget({
  issues,
}: CannibalizationDetectorWidgetProps) {
  const sampleIssues: CannibalizationIssue[] =
    issues.length > 0
      ? issues
      : [
          {
            query: "luxury brass wall sconce",
            totalClicks: 185,
            totalImpressions: 4200,
            competingUrls: [
              {
                url: "/products/brass-sconce-light",
                productId: "p1",
                productName: "Classic Brass Wall Sconce",
                clicks: 110,
                impressions: 2400,
                position: 3.2,
              },
              {
                url: "/products/modern-gold-sconce",
                productId: "p2",
                productName: "Modern Gold Sconce Light",
                clicks: 75,
                impressions: 1800,
                position: 6.8,
              },
            ],
          },
          {
            query: "dimmable led ceiling fixture",
            totalClicks: 95,
            totalImpressions: 2100,
            competingUrls: [
              {
                url: "/products/led-ceiling-light-48w",
                productId: "p3",
                productName: "48W LED Ceiling Fixture",
                clicks: 60,
                impressions: 1300,
                position: 8.4,
              },
              {
                url: "/products/flush-mount-led-lamp",
                productId: "p4",
                productName: "Flush Mount LED Ceiling Lamp",
                clicks: 35,
                impressions: 800,
                position: 11.2,
              },
            ],
          },
        ];

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <h3 className="font-serif text-base font-medium text-primary">
              Keyword Cannibalization Detector
            </h3>
            <div className="relative group">
              <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
                Flags queries where 2 or more distinct product URLs compete for
                the exact same search query, splitting page authority.
              </div>
            </div>
          </div>
          <p className="text-xs font-sans text-muted mt-1">
            Consolidate content or set canonical tags to avoid internal search
            competition.
          </p>
        </div>

        <span className="text-xs font-mono px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full font-medium">
          {sampleIssues.length} Conflicts Flagged
        </span>
      </div>

      <div className="space-y-4">
        {sampleIssues.map((issue, idx) => (
          <div
            key={idx}
            className="p-4 bg-surface-muted/30 border border-border rounded-lg space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="font-mono text-sm font-semibold text-primary">
                  "{issue.query}"
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-muted">
                <span>
                  Total Clicks:{" "}
                  <strong className="text-primary">{issue.totalClicks}</strong>
                </span>
                <span>
                  Total Imp:{" "}
                  <strong className="text-primary">
                    {issue.totalImpressions.toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {issue.competingUrls.map((urlItem: any, uIdx: number) => (
                <div
                  key={uIdx}
                  className="p-3 bg-background border border-border rounded flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono text-muted uppercase">
                      Competing URL #{uIdx + 1}
                    </span>
                    <h5 className="text-[13px] font-medium text-primary mt-0.5 truncate">
                      {urlItem.productName}
                    </h5>
                    <p className="text-[11px] font-mono text-muted truncate mt-0.5">
                      {urlItem.url}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-border/40 pt-2 text-muted">
                    <span>
                      Pos:{" "}
                      <strong className="text-primary">
                        {urlItem.position}
                      </strong>
                    </span>
                    <span>
                      Clicks:{" "}
                      <strong className="text-emerald-500">
                        {urlItem.clicks}
                      </strong>
                    </span>
                    {urlItem.productId && (
                      <Link
                        href={`/products/${urlItem.productId}`}
                        className="text-accent hover:underline flex items-center gap-0.5"
                      >
                        Audit <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
