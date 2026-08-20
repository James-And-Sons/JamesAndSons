"use client";

import React from "react";
import { Sliders, Users } from "lucide-react";
import { Affiliate } from "../types";

interface PromotionRulesSectionProps {
  minOrderAmount: string;
  setMinOrderAmount: (val: string) => void;
  maxDiscountCap: string;
  setMaxDiscountCap: (val: string) => void;
  usageLimit: string;
  setUsageLimit: (val: string) => void;
  usageLimitPerUser: string;
  setUsageLimitPerUser: (val: string) => void;
  affiliateId: string;
  setAffiliateId: (val: string) => void;
  affiliates: Affiliate[];
  isPercentageType: boolean;
}

export default function PromotionRulesSection({
  minOrderAmount,
  setMinOrderAmount,
  maxDiscountCap,
  setMaxDiscountCap,
  usageLimit,
  setUsageLimit,
  usageLimitPerUser,
  setUsageLimitPerUser,
  affiliateId,
  setAffiliateId,
  affiliates,
  isPercentageType,
}: PromotionRulesSectionProps) {
  return (
    <div
      id="promo-rules"
      className="p-4 rounded-sm border border-border bg-surface/50 space-y-4"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Sliders className="w-4 h-4 text-accent" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
          Discount Rules & Order Constraints
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Min Order Subtotal */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Min Order Subtotal (₹)
          </label>
          <input
            type="number"
            min="0"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            placeholder="e.g. 5000"
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent"
          />
        </div>

        {/* Max Discount Cap */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Max Cap Amount (₹)
          </label>
          <input
            type="number"
            min="0"
            value={maxDiscountCap}
            onChange={(e) => setMaxDiscountCap(e.target.value)}
            placeholder={isPercentageType ? "e.g. 2000" : "N/A for fixed"}
            disabled={!isPercentageType}
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        {/* Total Usage Limit */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Total Use Limit
          </label>
          <input
            type="number"
            min="0"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="Unlimited"
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent"
          />
        </div>

        {/* Usage Limit Per User */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Limit Per Customer
          </label>
          <input
            type="number"
            min="1"
            value={usageLimitPerUser}
            onChange={(e) => setUsageLimitPerUser(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Partner / Affiliate Link */}
      <div className="pt-2 border-t border-border/60">
        <div className="space-y-1.5 max-w-md">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" /> Attribute to
            Affiliate / Trade Partner
          </label>
          <select
            value={affiliateId}
            onChange={(e) => setAffiliateId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="">No Partner Attribution (Internal Promo)</option>
            {affiliates.map((aff) => (
              <option key={aff.id} value={aff.id}>
                {aff.name} ({aff.affiliateCode})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
