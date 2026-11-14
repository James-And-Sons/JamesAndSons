"use client";

import React from "react";
import { Clock } from "lucide-react";

interface PromotionScheduleSectionProps {
  startsAt: string;
  setStartsAt: (val: string) => void;
  expiresAt: string;
  setExpiresAt: (val: string) => void;
}

export default function PromotionScheduleSection({
  startsAt,
  setStartsAt,
  expiresAt,
  setExpiresAt,
}: PromotionScheduleSectionProps) {
  return (
    <div
      id="promo-schedule"
      className="p-4 rounded-sm border border-border bg-surface/50 space-y-4"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Clock className="w-4 h-4 text-accent" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
          Validity Window & Scheduling
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Start Date & Time (Optional)
          </label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent"
          />
          <p className="text-[10px] font-mono text-muted/80">
            If left blank, promotion goes live immediately upon creation.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Expiration Date & Time (Optional)
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent"
          />
          <p className="text-[10px] font-mono text-muted/80">
            Leave blank for ongoing / non-expiring promo code.
          </p>
        </div>
      </div>
    </div>
  );
}
