"use client";

import React, { useState } from "react";
import {
  X,
  Globe,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  FileText,
  Table,
  Cpu,
} from "lucide-react";
import { Coupon } from "../types";
import { GoogleMerchantPromotionsService } from "@/lib/services/googleMerchantPromotionsService";

interface ChannelSyncModalProps {
  coupon: Coupon | null;
  onClose: () => void;
  onResync: (couponId: string) => Promise<void>;
}

export default function ChannelSyncModal({
  coupon,
  onClose,
  onResync,
}: ChannelSyncModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "sheets" | "api">("api");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isResyncing, setIsResyncing] = useState(false);

  if (!coupon) return null;

  const googlePayload =
    GoogleMerchantPromotionsService.formatForGoogleMerchant(coupon);
  const xmlSnippet = GoogleMerchantPromotionsService.generateXmlFeed([coupon]);
  const tsvSnippet = GoogleMerchantPromotionsService.generateTsvFeed([coupon]);

  const merchantId = GoogleMerchantPromotionsService.getMerchantId();
  const sourceId = GoogleMerchantPromotionsService.getSourceId();
  const sourceName = GoogleMerchantPromotionsService.getSourceName();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleResyncClick = async () => {
    setIsResyncing(true);
    try {
      await onResync(coupon.id);
    } finally {
      setIsResyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-sm max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-primary">
                Google Merchant Promotions Sync (ID: {merchantId})
              </h2>
              <p className="text-xs font-mono text-muted">
                James And Sons • Promo Code: {coupon.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Google Merchant Integration Method Tabs */}
        <div className="flex items-center gap-1 border-b border-border/80 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("api")}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold uppercase flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeTab === "api"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Option 3: Add via API
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold uppercase flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeTab === "file"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Option 1: File / Scheduled
            Fetch
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sheets")}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-semibold uppercase flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeTab === "sheets"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Option 2: Google Sheets
          </button>
        </div>

        {/* TAB 1: API (Option 3) */}
        {activeTab === "api" && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Merchant API
                Source Connected
              </div>
              <p className="text-muted">
                Configured with Google Merchant Center Account{" "}
                <span className="font-bold text-amber-200">
                  James And Sons (ID: {merchantId})
                </span>{" "}
                via API Source{" "}
                <span className="font-bold text-amber-200">
                  {sourceName} (Source ID: {sourceId})
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded border border-border bg-background/50 space-y-1">
                <span className="text-[10px] text-muted uppercase">
                  Merchant Account ID
                </span>
                <p className="font-bold text-accent">{merchantId}</p>
              </div>
              <div className="p-3 rounded border border-border bg-background/50 space-y-1">
                <span className="text-[10px] text-muted uppercase">
                  API Source Name
                </span>
                <p className="font-bold text-primary">{sourceName}</p>
              </div>
              <div className="p-3 rounded border border-border bg-background/50 space-y-1">
                <span className="text-[10px] text-muted uppercase">
                  API Source ID
                </span>
                <p className="font-bold text-emerald-400">{sourceId}</p>
              </div>
              <div className="p-3 rounded border border-border bg-background/50 space-y-1">
                <span className="text-[10px] text-muted uppercase">
                  Promotion ID
                </span>
                <p className="font-bold text-accent truncate">
                  {googlePayload.promotionId}
                </p>
              </div>
              <div className="p-3 rounded border border-border bg-background/50 space-y-1">
                <span className="text-[10px] text-muted uppercase">
                  Target Country & Lang
                </span>
                <p className="font-bold text-primary">
                  {googlePayload.targetCountry} ({googlePayload.contentLanguage}
                  )
                </p>
              </div>
              <div className="p-3 rounded border border-border bg-background/50 space-y-1">
                <span className="text-[10px] text-muted uppercase">
                  Redemption Channel
                </span>
                <p className="font-bold text-primary">
                  {googlePayload.redemptionChannel}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResyncClick}
              disabled={isResyncing}
              className="w-full py-2.5 px-4 bg-accent text-accent-foreground font-semibold uppercase tracking-wider text-xs rounded hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isResyncing ? "animate-spin" : ""}`}
              />
              Push Promotion to Google Merchant API (Source ID: 10703767031)
            </button>
          </div>
        )}

        {/* TAB 2: FILE / SCHEDULED FETCH (Option 1) */}
        {activeTab === "file" && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded border border-border bg-background/50 space-y-2">
              <span className="font-bold text-primary">
                Scheduled Fetch Feed URL:
              </span>
              <p className="text-[11px] text-accent font-bold break-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/promotions/google-merchant-feed`
                  : "/api/promotions/google-merchant-feed"}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      typeof window !== "undefined"
                        ? `${window.location.origin}/api/promotions/google-merchant-feed`
                        : "",
                      "feed_url",
                    )
                  }
                  className="px-3 py-1 bg-surface border border-border rounded text-[10px] uppercase hover:text-accent flex items-center gap-1"
                >
                  {copiedCode === "feed_url" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Copy Scheduled Feed URL
                </button>
                <a
                  href="/api/promotions/google-merchant-tsv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-surface border border-border rounded text-[10px] uppercase hover:text-accent flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Download TSV File
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase text-muted font-semibold">
                  Generated XML RSS Feed
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(xmlSnippet, "xml")}
                  className="text-[10px] text-accent hover:underline flex items-center gap-1"
                >
                  {copiedCode === "xml" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}{" "}
                  Copy XML
                </button>
              </div>
              <pre className="p-3 rounded bg-black/60 border border-border text-[11px] text-emerald-400 overflow-x-auto max-h-40 leading-relaxed">
                {xmlSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE SHEETS (Option 2) */}
        {activeTab === "sheets" && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded border border-border bg-background/50 space-y-1 text-[11px]">
              <span className="font-bold text-primary">
                Google Sheets Import Format:
              </span>
              <p className="text-muted">
                Copy the tab-separated rows below and paste them directly into
                your Google Merchant Center Promotions spreadsheet.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase text-muted font-semibold">
                  TSV Spreadsheet Columns
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(tsvSnippet, "tsv")}
                  className="text-[10px] text-accent hover:underline flex items-center gap-1"
                >
                  {copiedCode === "tsv" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}{" "}
                  Copy TSV for Google Sheets
                </button>
              </div>
              <pre className="p-3 rounded bg-black/60 border border-border text-[11px] text-emerald-300 overflow-x-auto max-h-48 leading-relaxed">
                {tsvSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono uppercase border border-border text-muted hover:text-primary rounded-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
