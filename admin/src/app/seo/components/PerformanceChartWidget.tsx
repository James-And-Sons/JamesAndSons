"use client";
import React from "react";
import {
  TrendingUp,
  MousePointer,
  Eye,
  Target,
  HelpCircle,
} from "lucide-react";
import { SearchAnalyticsMetric } from "@james-andsons/seo";

interface PerformanceChartWidgetProps {
  metrics: SearchAnalyticsMetric[];
  days: number;
  onDaysChange: (days: number) => void;
}

export default function PerformanceChartWidget({
  metrics,
  days,
  onDaysChange,
}: PerformanceChartWidgetProps) {
  const totalClicks = metrics.reduce((acc, m) => acc + m.clicks, 0);
  const totalImpressions = metrics.reduce((acc, m) => acc + m.impressions, 0);
  const avgCtr =
    metrics.length > 0
      ? (metrics.reduce((acc, m) => acc + m.ctr, 0) / metrics.length).toFixed(2)
      : "0";
  const avgPos =
    metrics.length > 0
      ? (
          metrics.reduce((acc, m) => acc + m.position, 0) / metrics.length
        ).toFixed(1)
      : "0";

  // Simple SVG trend path generator
  const maxVal = Math.max(...metrics.map((m) => m.clicks), 1);
  const points = metrics
    .map((m, idx) => {
      const x = (idx / Math.max(metrics.length - 1, 1)) * 500;
      const y = 120 - (m.clicks / maxVal) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-medium text-primary">
              Traffic & Search Performance
            </h2>
            <div className="relative group">
              <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
                Organic search performance aggregated from Google Search Console
                Search Analytics API.
              </div>
            </div>
          </div>
          <p className="text-xs font-sans text-muted mt-1">
            Total clicks, impressions, average CTR, and ranking position.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center bg-surface-muted p-1 border border-border rounded font-mono text-[11px]">
          {[7, 28, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDaysChange(d)}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                days === d
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted hover:text-primary"
              }`}
            >
              {d === 7 ? "7 Days" : d === 28 ? "28 Days" : "3 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-surface-muted/30 border border-border rounded-lg">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Total Clicks</span>
            <MousePointer className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-semibold text-primary mt-2">
            {totalClicks.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-surface-muted/30 border border-border rounded-lg">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Impressions</span>
            <Eye className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-semibold text-primary mt-2">
            {totalImpressions.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-surface-muted/30 border border-border rounded-lg">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Avg CTR</span>
            <Target className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-semibold text-primary mt-2">{avgCtr}%</p>
        </div>

        <div className="p-4 bg-surface-muted/30 border border-border rounded-lg">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Avg Position</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-semibold text-primary mt-2">{avgPos}</p>
        </div>
      </div>

      {/* SVG Time Series Visual */}
      <div className="relative bg-background border border-border rounded-lg p-4 h-40 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 500 140"
          className="w-full h-full stroke-emerald-500 fill-none"
          preserveAspectRatio="none"
        >
          <path d={`M 0,130 ${points} L 500,130`} strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
