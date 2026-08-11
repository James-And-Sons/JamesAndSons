"use client";
import React, { useState, useEffect } from "react";
import { RefreshCw, Search, Sparkles } from "lucide-react";
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

  const fetchCachedHealth = async () => {
    try {
      const res = await fetch(`/api/seo/pagespeed?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.health) {
          setHealthData(data.health);
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
      }
    } catch (err) {
      console.error("Manual scan error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Container Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-surface border border-border rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-medium text-primary">
              SEO & Health Panel
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono bg-accent/10 text-accent border border-accent/20">
              <Sparkles className="w-3 h-3" /> Live Audit Engine
            </span>
          </div>
          <p className="text-[13px] text-muted font-sans mt-1">
            Real-time Core Web Vitals, Google Index inspection, structured data
            validator, and SERP preview.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunManualScan}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-[12px] uppercase tracking-wider rounded hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Running Audit..." : "Run Manual Scan"}
        </button>
      </div>

      {/* Grid Layout of Health Modules */}
      <div className="grid grid-cols-1 gap-6">
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
