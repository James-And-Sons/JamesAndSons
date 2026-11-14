"use client";

import React from "react";
import {
  Zap,
  Ticket,
  TrendingUp,
  Sparkles,
  Globe,
  Download,
} from "lucide-react";
import { OrderStats } from "../types";

interface PromotionsHeaderProps {
  orderStats?: OrderStats;
  activeCount: number;
  totalCount: number;
  onOpenCreate: () => void;
  onOpenBulk: () => void;
  onOpenAI: () => void;
  onOpenTester: () => void;
  onScanEventsAI: () => void;
  isScanningEvents?: boolean;
}

export default function PromotionsHeader({
  orderStats,
  activeCount,
  totalCount,
  onOpenCreate,
  onOpenBulk,
  onOpenAI,
  onOpenTester,
  onScanEventsAI,
  isScanningEvents = false,
}: PromotionsHeaderProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-sm bg-accent/10 text-accent">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-semibold tracking-wide text-primary">
              Promotions & Marketing Hub
            </h1>
          </div>
          <p className="text-xs text-muted max-w-2xl font-mono">
            Omnichannel campaign engine integrated with Google Merchant Center
            Promotions, Meta Ads, and AI Offer Architect.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onScanEventsAI}
            disabled={isScanningEvents}
            className="px-3.5 py-2 text-xs font-mono tracking-wider uppercase border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-semibold rounded-sm transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            title="Scan upcoming Indian festivals & generate monthly 1-click promotions"
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${isScanningEvents ? "animate-spin" : "text-amber-300"}`}
            />
            {isScanningEvents ? "Scanning Events..." : "Scan Indian Events AI"}
          </button>
          <button
            type="button"
            onClick={onOpenAI}
            className="px-3.5 py-2 text-xs font-mono tracking-wider uppercase border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 font-semibold rounded-sm transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" /> AI Architect
          </button>
          <button
            type="button"
            onClick={onOpenTester}
            className="px-3 py-2 text-xs font-mono tracking-wider uppercase border border-border/80 bg-background hover:bg-surface text-muted hover:text-emerald-400 rounded-sm transition-all flex items-center gap-1.5"
            title="Simulate storefront redemption"
          >
            Storefront Tester
          </button>
          <a
            href="/api/promotions/google-merchant-feed"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-xs font-mono tracking-wider uppercase border border-border/80 bg-background hover:bg-surface hover:border-accent/40 text-muted hover:text-accent rounded-sm transition-all flex items-center gap-1.5"
            title="Download/Preview Google Merchant Center XML Feed"
          >
            <Globe className="w-3.5 h-3.5" /> Google Feed XML
          </a>
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-4 py-2 text-xs font-mono tracking-wider uppercase bg-accent text-accent-foreground font-semibold rounded-sm hover:brightness-110 shadow-sm transition-all flex items-center gap-1.5"
          >
            Custom Promotion
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-sm border border-border bg-surface/50 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-muted uppercase tracking-wider">
            <span>Attributed Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-mono font-bold text-primary">
            {formatCurrency(orderStats?.totalRevenueGenerated || 0)}
          </p>
          <p className="text-[10px] font-mono text-muted">
            From {orderStats?.orderCount || 0} attributed promo checkout orders
          </p>
        </div>

        <div className="p-4 rounded-sm border border-border bg-surface/50 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-muted uppercase tracking-wider">
            <span>Total Discounts Given</span>
            <Ticket className="w-4 h-4 text-accent" />
          </div>
          <p className="text-xl font-mono font-bold text-accent">
            {formatCurrency(orderStats?.totalDiscountSaved || 0)}
          </p>
          <p className="text-[10px] font-mono text-muted">
            Customer savings delivered
          </p>
        </div>

        <div className="p-4 rounded-sm border border-border bg-surface/50 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-muted uppercase tracking-wider">
            <span>Active Offers</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xl font-mono font-bold text-emerald-400">
            {activeCount}{" "}
            <span className="text-xs text-muted font-normal">
              / {totalCount} total
            </span>
          </p>
          <p className="text-[10px] font-mono text-muted">
            Live across store & marketing channels
          </p>
        </div>

        <div className="p-4 rounded-sm border border-border bg-surface/50 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-muted uppercase tracking-wider">
            <span>Google Merchant Feed</span>
            <Globe className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-mono font-bold text-amber-300">ONLINE</p>
          <p className="text-[10px] font-mono text-muted">
            Auto-indexing active coupons
          </p>
        </div>
      </div>
    </div>
  );
}
