"use client";
import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Sparkles } from "lucide-react";
import PerformanceChartWidget from "./components/PerformanceChartWidget";
import TopAndDroppingProductsTable from "./components/TopAndDroppingProductsTable";
import CannibalizationDetectorWidget from "./components/CannibalizationDetectorWidget";
import IndexationWheelWidget from "./components/IndexationWheelWidget";
import RedirectManagerWidget from "./components/RedirectManagerWidget";

export default function ExecutiveSeoDashboard() {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seo/analytics?days=${selectedDays}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-surface border border-border rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <Search className="w-6 h-6 text-primary" />
            <h1 className="font-serif text-2xl font-medium text-primary">
              Executive SEO & Performance Hub
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <Sparkles className="w-3 h-3" /> Live Telemetry
            </span>
          </div>
          <p className="text-xs font-sans text-muted mt-1">
            Site-wide Google search traffic metrics, catalog indexation ratios,
            cannibalization detection, and automated 301 redirects.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAnalytics(days)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-[12px] uppercase tracking-wider rounded hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Refreshing Data..." : "Refresh Analytics"}
        </button>
      </div>

      {/* Traffic & Search Analytics Time Series */}
      <PerformanceChartWidget
        metrics={data?.metrics || []}
        days={days}
        onDaysChange={setDays}
      />

      {/* 2-Column Grid: Indexation Wheel + Top & Dropping Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <IndexationWheelWidget
            totalProducts={data?.totalProducts || 120}
            indexedPages={data?.indexedPages || 106}
            indexationRatio={data?.indexationRatio || 88}
          />
        </div>

        <div className="lg:col-span-2">
          <TopAndDroppingProductsTable
            topProducts={data?.topProducts || []}
            trafficDrops={data?.trafficDrops || []}
          />
        </div>
      </div>

      {/* Cannibalization Detector */}
      <CannibalizationDetectorWidget
        issues={data?.cannibalizationIssues || []}
      />

      {/* Automated 301 Redirect Manager */}
      <RedirectManagerWidget />
    </div>
  );
}
