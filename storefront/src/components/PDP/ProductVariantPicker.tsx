"use client";

import React from "react";
import { Check } from "lucide-react";

export interface VariantOption {
  id: string;
  name?: string | null;
  sku?: string | null;
  color?: string | null;
  size?: string | null;
  d2cPrice: number;
}

interface ProductVariantPickerProps {
  variants: VariantOption[];
  selectedVariantId: string | null;
  onSelectVariant: (variant: VariantOption) => void;
}

export default function ProductVariantPicker({
  variants = [],
  selectedVariantId,
  onSelectVariant,
}: ProductVariantPickerProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="space-y-2 py-3 border-y border-border/40">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-textMuted uppercase tracking-wider">
          Select Variant
        </span>
        <span className="text-gold font-semibold">
          {variants.length} Options Available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {variants.map((v) => {
          const isSelected = v.id === selectedVariantId;
          const label =
            v.name || v.color || v.size || v.sku || "Variant Option";

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVariant(v)}
              className={`p-2.5 rounded border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? "bg-gold/15 border-gold text-gold font-bold shadow-sm"
                  : "bg-surface/50 border-border/60 text-textMuted hover:text-cream hover:border-gold/40"
              }`}
            >
              <span className="truncate">{label}</span>
              {isSelected && <Check size={14} className="text-gold shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
