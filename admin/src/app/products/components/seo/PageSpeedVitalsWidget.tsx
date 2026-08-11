"use client";
import React, { useState } from "react";
import {
  Gauge,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { PageSpeedAuditWarning } from "@james-andsons/seo";

interface PageSpeedVitalsWidgetProps {
  mobileScore?: number | null;
  desktopScore?: number | null;
  mobileLcp?: number | null;
  mobileCls?: number | null;
  mobileInp?: number | null;
  desktopLcp?: number | null;
  desktopCls?: number | null;
  desktopInp?: number | null;
  warnings?: PageSpeedAuditWarning[] | null;
}

export default function PageSpeedVitalsWidget({
  mobileScore = 88,
  desktopScore = 94,
  mobileLcp = 2.1,
  mobileCls = 0.04,
  mobileInp = 140,
  desktopLcp = 1.4,
  desktopCls = 0.01,
  desktopInp = 85,
  warnings = [],
}: PageSpeedVitalsWidgetProps) {
  const [activeTab, setActiveTab] = useState<"mobile" | "desktop">("mobile");

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted border-border";
    if (score >= 90)
      return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 50)
      return "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const score = activeTab === "mobile" ? mobileScore : desktopScore;
  const lcp = activeTab === "mobile" ? mobileLcp : desktopLcp;
  const cls = activeTab === "mobile" ? mobileCls : desktopCls;
  const inp = activeTab === "mobile" ? mobileInp : desktopInp;

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-sm font-medium text-primary">
            PageSpeed & Core Web Vitals
          </h3>
          <div className="relative group">
            <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
              Analyzed via Google PageSpeed Insights API. Measures LCP (Largest
              Contentful Paint), CLS (Cumulative Layout Shift), and INP
              (Interaction to Next Paint).
            </div>
          </div>
        </div>

        {/* Mobile / Desktop Toggle */}
        <div className="flex items-center bg-surface-muted p-1 border border-border rounded">
          <button
            type="button"
            onClick={() => setActiveTab("mobile")}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded cursor-pointer transition-colors ${
              activeTab === "mobile"
                ? "bg-background text-primary shadow-sm"
                : "text-muted"
            }`}
          >
            <Smartphone className="w-3 h-3" />
            Mobile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("desktop")}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded cursor-pointer transition-colors ${
              activeTab === "desktop"
                ? "bg-background text-primary shadow-sm"
                : "text-muted"
            }`}
          >
            <Monitor className="w-3 h-3" />
            Desktop
          </button>
        </div>
      </div>

      {/* Main Score & Vitals Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Lighthouse Score Ring */}
        <div
          className={`flex flex-col items-center justify-center p-4 border rounded-lg ${getScoreColor(score)}`}
        >
          <span className="text-3xl font-mono font-semibold">
            {score ?? "--"}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider mt-1 text-muted">
            Lighthouse Score
          </span>
        </div>

        {/* LCP */}
        <div className="bg-surface-muted/40 border border-border p-3.5 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-muted">
              LCP
            </span>
            <span className="text-[10px] font-mono text-emerald-500">
              &lt; 2.5s target
            </span>
          </div>
          <p className="text-xl font-mono font-medium text-primary mt-2">
            {lcp ? `${lcp}s` : "--"}
          </p>
          <p className="text-[11px] text-muted font-sans mt-0.5">
            Largest Contentful Paint
          </p>
        </div>

        {/* CLS */}
        <div className="bg-surface-muted/40 border border-border p-3.5 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-muted">
              CLS
            </span>
            <span className="text-[10px] font-mono text-emerald-500">
              &lt; 0.10 target
            </span>
          </div>
          <p className="text-xl font-mono font-medium text-primary mt-2">
            {cls !== null && cls !== undefined ? cls : "--"}
          </p>
          <p className="text-[11px] text-muted font-sans mt-0.5">
            Cumulative Layout Shift
          </p>
        </div>

        {/* INP */}
        <div className="bg-surface-muted/40 border border-border p-3.5 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-muted">
              INP
            </span>
            <span className="text-[10px] font-mono text-emerald-500">
              &lt; 200ms target
            </span>
          </div>
          <p className="text-xl font-mono font-medium text-primary mt-2">
            {inp ? `${inp}ms` : "--"}
          </p>
          <p className="text-[11px] text-muted font-sans mt-0.5">
            Interaction to Next Paint
          </p>
        </div>
      </div>

      {/* Action Items derived from Audit Warnings */}
      <div className="mt-5 border-t border-border pt-4">
        <h4 className="text-[12px] font-mono uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Recommended Action Items
        </h4>

        {warnings && warnings.length > 0 ? (
          <div className="space-y-2.5">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-md flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-primary">
                      {w.title}
                    </span>
                    {w.displayValue && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface text-muted border border-border rounded">
                        {w.displayValue}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted mt-1 leading-normal">
                    {w.actionItem}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-md flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[13px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            No major Lighthouse diagnostic warnings detected.
          </div>
        )}
      </div>
    </div>
  );
}
