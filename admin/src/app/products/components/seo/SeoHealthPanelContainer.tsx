"use client";
import React, { useState, useEffect } from "react";
import { RefreshCw, Search, Sparkles, Zap, Clock } from "lucide-react";
import IndexingStatusBadge from "./IndexingStatusBadge";
import PageSpeedVitalsWidget from "./PageSpeedVitalsWidget";
import SchemaValidatorWidget from "./SchemaValidatorWidget";
import SerpPreviewCard from "./SerpPreviewCard";
import LowHangingFruitKeywords from "./LowHangingFruitKeywords";

interface SeoHealthPanelContainerProps {
  productId: string;
  title: string;
  description: string;
  slug: string;
  onWeaveKeyword?: (keyword: string) => void;
}

export default function SeoHealthPanelContainer({
  productId,
  title,
  description,
  slug,
  onWeaveKeyword,
}: SeoHealthPanelContainerProps) {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [lastScanned, setLastScanned] = useState<Date | null>(null);

  const fetchCachedHealth = async () => {
    try {
      const res = await fetch(`/api/seo/pagespeed?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.health) {
          setHealthData(data.health);
          if (data.health.lastScannedAt) {
            setLastScanned(new Date(data.health.lastScannedAt));
          }
        }
      }
    } catch {
      // Ignore cache fetch error
    }
  };

  useEffect(() => {
    if (productId) {
      fetchCachedHealth();
    }
  }, [productId]);

  const handleRunManualScan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seo/pagespeed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success && data.health) {
        setHealthData(data.health);
        setLastScanned(new Date());
      }
    } catch (err) {
      console.error("Manual scan error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatLastScanned = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  return (
    <div className="space-y-5">
      {/* ── Panel Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 bg-surface border border-border rounded-sm">
        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Search className="w-4 h-4 text-accent shrink-0" />
            <h2 className="font-serif text-base font-medium text-primary">
              SEO &amp; Health Panel
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono bg-accent/10 text-accent border border-accent/20 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Live Audit Engine
            </span>
          </div>
          <p className="text-[12px] font-mono text-muted mt-1 tracking-wide">
            Core Web Vitals · Index inspection · Schema validator · SERP preview
          </p>

          {/* Last scanned timestamp */}
          {lastScanned && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className="w-3 h-3 text-muted" />
              <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
                Last scanned {formatLastScanned(lastScanned)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh cached data */}
          <button
            id={`seo-refresh-btn-${productId}`}
            type="button"
            onClick={fetchCachedHealth}
            disabled={loading}
            title="Reload cached scan data"
            className="btn-secondary font-mono text-[10px] uppercase tracking-[0.12em] px-4 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          {/* Run fresh scan */}
          <button
            id={`seo-scan-btn-${productId}`}
            type="button"
            onClick={handleRunManualScan}
            disabled={loading}
            className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-5 py-2 flex items-center gap-1.5 shadow-lg shadow-accent/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Run Scan
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Health Modules Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5">
        <IndexingStatusBadge
          productId={productId}
          status={healthData?.indexingStatus || "INDEXED"}
          lastInspectedAt={healthData?.lastInspectedAt}
          coverageState={healthData?.indexingCoverageState}
          onRequestIndexing={fetchCachedHealth}
        />

        <PageSpeedVitalsWidget
          mobileScore={healthData?.mobileLighthouseScore}
          desktopScore={healthData?.desktopLighthouseScore}
          mobileLcp={healthData?.mobileLcp}
          mobileCls={healthData?.mobileCls}
          mobileInp={healthData?.mobileInp}
          desktopLcp={healthData?.desktopLcp}
          desktopCls={healthData?.desktopCls}
          desktopInp={healthData?.desktopInp}
          warnings={healthData?.pageSpeedAuditWarnings}
        />

        <SchemaValidatorWidget validation={healthData?.schemaValidation} />

        <SerpPreviewCard
          title={title}
          description={description}
          slug={slug}
          missingAltCount={healthData?.missingAltCount || 0}
        />

        <LowHangingFruitKeywords
          keywords={healthData?.topKeywords}
          onInsertKeyword={onWeaveKeyword}
        />
      </div>
    </div>
  );
}
