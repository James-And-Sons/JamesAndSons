"use client";

import React from "react";
import { Share2, Globe, Mail, Bell, Sparkles } from "lucide-react";

interface PromotionChannelsSectionProps {
  targetChannels: {
    googleMerchant: boolean;
    metaCommerce: boolean;
    emailBlast: boolean;
    webPush: boolean;
  };
  setTargetChannels: React.Dispatch<
    React.SetStateAction<{
      googleMerchant: boolean;
      metaCommerce: boolean;
      emailBlast: boolean;
      webPush: boolean;
    }>
  >;
}

export default function PromotionChannelsSection({
  targetChannels,
  setTargetChannels,
}: PromotionChannelsSectionProps) {
  const toggleChannel = (key: keyof typeof targetChannels) => {
    setTargetChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div
      id="promo-channels"
      className="p-4 rounded-sm border border-border bg-surface/50 space-y-4"
    >
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-accent" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            Multi-Channel Sync Outlets
          </h3>
        </div>
        <span className="text-[10px] font-mono text-accent flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Auto-Broadcasting
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Merchant Center */}
        <label
          onClick={() => toggleChannel("googleMerchant")}
          className={`p-3 rounded-sm border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            targetChannels.googleMerchant
              ? "bg-amber-500/10 border-amber-500/40 text-primary"
              : "bg-background/40 border-border text-muted hover:border-border/80"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={`p-2 rounded ${
                targetChannels.googleMerchant
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-surface text-muted"
              }`}
            >
              <Globe className="w-4 h-4" />
            </span>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider">
                Google Merchant Promotions
              </div>
              <p className="text-[11px] text-muted leading-tight mt-0.5">
                Automatically submits promo XML & API payload to Google Content
                API for Shopping.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={targetChannels.googleMerchant}
            onChange={() => {}}
            className="mt-1 border-border bg-background rounded text-accent focus:ring-0"
          />
        </label>

        {/* Meta Commerce */}
        <label
          onClick={() => toggleChannel("metaCommerce")}
          className={`p-3 rounded-sm border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            targetChannels.metaCommerce
              ? "bg-blue-500/10 border-blue-500/40 text-primary"
              : "bg-background/40 border-border text-muted hover:border-border/80"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={`p-2 rounded ${
                targetChannels.metaCommerce
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-surface text-muted"
              }`}
            >
              <Share2 className="w-4 h-4" />
            </span>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider">
                Meta Commerce & Ads
              </div>
              <p className="text-[11px] text-muted leading-tight mt-0.5">
                Pushes promotional offer badge to Instagram & Facebook Catalog.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={targetChannels.metaCommerce}
            onChange={() => {}}
            className="mt-1 border-border bg-background rounded text-accent focus:ring-0"
          />
        </label>

        {/* Email Blast */}
        <label
          onClick={() => toggleChannel("emailBlast")}
          className={`p-3 rounded-sm border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            targetChannels.emailBlast
              ? "bg-purple-500/10 border-purple-500/40 text-primary"
              : "bg-background/40 border-border text-muted hover:border-border/80"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={`p-2 rounded ${
                targetChannels.emailBlast
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-surface text-muted"
              }`}
            >
              <Mail className="w-4 h-4" />
            </span>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider">
                Resend Email Blast
              </div>
              <p className="text-[11px] text-muted leading-tight mt-0.5">
                Triggers promotional email sequence via Resend API to VIP &
                active customers.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={targetChannels.emailBlast}
            onChange={() => {}}
            className="mt-1 border-border bg-background rounded text-accent focus:ring-0"
          />
        </label>

        {/* Web Push */}
        <label
          onClick={() => toggleChannel("webPush")}
          className={`p-3 rounded-sm border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            targetChannels.webPush
              ? "bg-emerald-500/10 border-emerald-500/40 text-primary"
              : "bg-background/40 border-border text-muted hover:border-border/80"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={`p-2 rounded ${
                targetChannels.webPush
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-surface text-muted"
              }`}
            >
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider">
                Web Push Notification
              </div>
              <p className="text-[11px] text-muted leading-tight mt-0.5">
                Sends instant web push notifications to opted-in browser
                subscribers.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={targetChannels.webPush}
            onChange={() => {}}
            className="mt-1 border-border bg-background rounded text-accent focus:ring-0"
          />
        </label>
      </div>
    </div>
  );
}
