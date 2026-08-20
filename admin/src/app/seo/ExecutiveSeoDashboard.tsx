"use client";
import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Sparkles, Zap } from "lucide-react";
import PerformanceChartWidget from "./components/PerformanceChartWidget";
import TopAndDroppingProductsTable from "./components/TopAndDroppingProductsTable";
import CannibalizationDetectorWidget from "./components/CannibalizationDetectorWidget";
import IndexationWheelWidget from "./components/IndexationWheelWidget";
import RedirectManagerWidget from "./components/RedirectManagerWidget";
import BulkScanModal from "./components/BulkScanModal";

export default function ExecutiveSeoDashboard() {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showBulkScan, setShowBulkScan] = useState(false);

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
    <>
      <div className="space-y-6 pb-16">
        {/* ── Dashboard Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-6 bg-surface border border-border rounded-sm shadow-sm">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Search className="w-5 h-5 text-accent shrink-0" />
              <h1 className="font-serif text-xl font-medium text-primary">
                Executive SEO &amp; Performance Hub
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Live Telemetry
              </span>
            </div>
            <p className="text-[12px] font-mono text-muted mt-1.5 tracking-wide">
              Site-wide traffic, indexation ratios, cannibalization detection,
              and automated 301 redirects.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Refresh Analytics */}
            <button
              id="refresh-analytics-btn"
              type="button"
              onClick={() => fetchAnalytics(days)}
              disabled={loading}
              title="Refresh analytics data"
              className="btn-secondary font-mono text-[10px] uppercase tracking-[0.12em] px-5 py-2.5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing…" : "Refresh"}
            </button>

            {/* Run Catalog Scan — primary CTA */}
            <button
              id="run-catalog-scan-btn"
              type="button"
              onClick={() => setShowBulkScan(true)}
              className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-accent/20 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Run Catalog Scan
            </button>
          </div>
        </div>

        {/* Traffic & Search Analytics */}
        <PerformanceChartWidget
          metrics={data?.metrics || []}
          days={days}
          onDaysChange={setDays}
        />

        {/* 2-Column: Indexation + Top Products */}
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

      {/* Bulk Scan Modal — portal-style overlay */}
      <BulkScanModal
        isOpen={showBulkScan}
        onClose={() => setShowBulkScan(false)}
        onComplete={() => {
          // Refresh analytics after scan completes
          setTimeout(() => fetchAnalytics(days), 1500);
        }}
      />
    </>
  );
}
