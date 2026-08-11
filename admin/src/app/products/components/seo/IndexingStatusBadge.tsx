"use client";
import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  HelpCircle,
} from "lucide-react";

interface IndexingStatusBadgeProps {
  productId: string;
  status: string;
  lastInspectedAt?: string;
  coverageState?: string;
  onRequestIndexing?: () => void;
}

export default function IndexingStatusBadge({
  productId,
  status,
  lastInspectedAt,
  coverageState,
  onRequestIndexing,
}: IndexingStatusBadgeProps) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleRequest = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/seo/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: "REQUEST_INDEXING" }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Indexing requested with Google");
        if (onRequestIndexing) onRequestIndexing();
      }
    } catch {
      setMsg("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeConfig = () => {
    switch (status) {
      case "INDEXED":
        return {
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
          label: "Indexed on Google",
        };
      case "DISCOVERED_NOT_INDEXED":
        return {
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: <Clock className="w-4 h-4 text-amber-500" />,
          label: "Discovered - Not Indexed",
        };
      case "CRAWLED_NOT_INDEXED":
        return {
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
          label: "Crawled - Currently Not Indexed",
        };
      default:
        return {
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
          label: "Not Indexed",
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-medium text-primary">
            Google Indexing Status
          </span>
          <div className="relative group">
            <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
              Shows real-time index status from Google Search Console URL
              Inspection API.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRequest}
          disabled={loading || status === "INDEXED"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-primary border border-border rounded hover:bg-surface-muted transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3 h-3" />
          {loading ? "Submitting..." : "Request Indexing"}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badge.bg} font-sans text-[13px] font-medium`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>

        {lastInspectedAt && (
          <span className="text-[11px] font-mono text-muted">
            Last checked: {new Date(lastInspectedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {coverageState && (
        <p className="mt-2.5 text-[12px] font-sans text-muted">
          Coverage: <span className="text-primary">{coverageState}</span>
        </p>
      )}

      {msg && (
        <p className="mt-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
          {msg}
        </p>
      )}
    </div>
  );
}
