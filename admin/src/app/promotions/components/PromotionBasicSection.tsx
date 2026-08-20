"use client";

import React from "react";
import { Tag, Sparkles } from "lucide-react";
import { CouponType } from "../types";

interface PromotionBasicSectionProps {
  code: string;
  setCode: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  type: CouponType;
  setType: (val: CouponType) => void;
  value: string;
  setValue: (val: string) => void;
  onGenerateCode: () => void;
}

export default function PromotionBasicSection({
  code,
  setCode,
  description,
  setDescription,
  type,
  setType,
  value,
  setValue,
  onGenerateCode,
}: PromotionBasicSectionProps) {
  return (
    <div
      id="promo-basic"
      className="p-4 rounded-sm border border-border bg-surface/50 space-y-4"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Tag className="w-4 h-4 text-accent" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
          Basic Offer Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code Field */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Promo Code <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. LUXE20"
              className="flex-1 px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary uppercase focus:outline-none focus:border-accent"
              required
            />
            <button
              type="button"
              onClick={onGenerateCode}
              className="px-3 py-2 text-xs font-mono uppercase border border-border bg-background hover:bg-surface text-accent hover:border-accent/40 rounded-sm transition-all flex items-center gap-1 shrink-0"
              title="Generate random promo code"
            >
              <Sparkles className="w-3.5 h-3.5" /> Random
            </button>
          </div>
        </div>

        {/* Promo Type */}
        <div className="space-y-1.5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Discount Type <span className="text-red-400">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CouponType)}
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="PERCENTAGE">Percentage Discount (%)</option>
            <option value="FIXED_AMOUNT">Fixed Amount Discount (₹)</option>
            <option value="FREE_SHIPPING">Free Shipping Waiver</option>
          </select>
        </div>
      </div>

      {/* Discount Value & Description */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {type !== "FREE_SHIPPING" && (
          <div className="space-y-1.5 md:col-span-1">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
              Value ({type === "PERCENTAGE" ? "%" : "₹"}){" "}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "PERCENTAGE" ? "20" : "500"}
              className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary focus:outline-none focus:border-accent"
              required
            />
          </div>
        )}

        <div
          className={`space-y-1.5 ${type !== "FREE_SHIPPING" ? "md:col-span-2" : "md:col-span-3"}`}
        >
          <div className="flex items-center justify-between">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
              Internal Note / Description
            </label>
            <button
              type="button"
              onClick={() => {
                const generatedNote = `${type === "PERCENTAGE" ? `${value}% OFF` : type === "FIXED_AMOUNT" ? `₹${value} OFF` : "Free White-Glove Delivery"} campaign for James & Sons luxury lighting catalog. Includes Google Merchant Center sync & storefront cart discount.`;
                setDescription(generatedNote);
              }}
              className="text-[10px] font-mono text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-purple-400" /> AI Write
              Description
            </button>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Festive luxury lighting promotion for high-ticket chandeliers"
            className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
      </div>
    </div>
  );
}
