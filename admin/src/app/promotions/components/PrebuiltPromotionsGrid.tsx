"use client";

import React, { useState } from "react";
import {
  Zap,
  Plane,
  Users,
  Ticket,
  Tag,
  CheckCircle2,
  Globe,
  Share2,
  Mail,
  Bell,
  Sparkles,
  Loader2,
} from "lucide-react";
import { PREBUILT_PROMOTION_PRESETS } from "../prebuilt-promotions";
import { PrebuiltPromotionPreset } from "../types";

interface PrebuiltPromotionsGridProps {
  onLaunchPreset: (presetId: string) => Promise<void>;
  isLaunching: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Plane,
  Users,
  Ticket,
  Tag,
  CheckCircle2,
};

export default function PrebuiltPromotionsGrid({
  onLaunchPreset,
  isLaunching,
}: PrebuiltPromotionsGridProps) {
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const handleLaunch = async (presetId: string) => {
    setActivePresetId(presetId);
    try {
      await onLaunchPreset(presetId);
    } finally {
      setActivePresetId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="font-mono text-sm font-semibold tracking-wider uppercase text-primary">
            Prebuilt 1-Click Promotions
          </h2>
        </div>
        <span className="text-[11px] font-mono text-muted">
          Instant multi-channel provisioning
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PREBUILT_PROMOTION_PRESETS.map((preset) => {
          const IconComponent = iconMap[preset.iconName] || Zap;
          const isThisLaunching = isLaunching && activePresetId === preset.id;

          return (
            <div
              key={preset.id}
              className="group relative p-4 rounded-sm border border-border/80 bg-surface/40 hover:bg-surface/80 hover:border-accent/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-sm bg-background border border-border text-accent group-hover:scale-105 transition-transform">
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-wide">
                        {preset.title}
                      </h3>
                      <p className="text-[11px] text-muted font-mono">
                        {preset.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${preset.badgeBg}`}
                  >
                    {preset.badge}
                  </span>
                </div>

                <p className="text-xs text-muted/90 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>

                {/* Channels Badge Row */}
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-muted flex-wrap">
                  <span className="text-[9px] uppercase tracking-wider text-muted/70">
                    Targets:
                  </span>
                  {preset.targetChannels.googleMerchant && (
                    <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <Globe className="w-3 h-3" /> Google Merchant
                    </span>
                  )}
                  {preset.targetChannels.metaCommerce && (
                    <span className="inline-flex items-center gap-1 text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                      <Share2 className="w-3 h-3" /> Meta Ads
                    </span>
                  )}
                  {preset.targetChannels.emailBlast && (
                    <span className="inline-flex items-center gap-1 text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                  )}
                  {preset.targetChannels.webPush && (
                    <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Bell className="w-3 h-3" /> Push
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLaunch(preset.id)}
                disabled={isLaunching}
                className="w-full py-2 px-3 text-xs font-mono tracking-wider uppercase border border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground font-semibold rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isThisLaunching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                    Provisioning Channels...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" /> Launch in
                    1-Click
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
