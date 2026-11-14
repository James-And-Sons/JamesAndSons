"use client";

import React from "react";
import { Truck, ShieldCheck } from "lucide-react";
import { renderPrice } from "@/lib/utils";

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

interface ShippingMethodStepProps {
  options: ShippingOption[];
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function ShippingMethodStep({
  options = [],
  selectedOptionId,
  onSelectOption,
  onBack,
  onContinue,
}: ShippingMethodStepProps) {
  return (
    <div className="space-y-5 bg-surface/40 p-6 border border-border/80 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <Truck size={18} className="text-gold" />
        <h3 className="font-serif font-bold text-base text-cream">
          Select Delivery Method
        </h3>
      </div>

      <div className="space-y-3">
        {options.length === 0 ? (
          <div className="p-4 bg-background border border-border rounded text-xs font-mono text-textMuted text-center">
            Standard Express Delivery (Insured Freight) — {renderPrice(0)}
          </div>
        ) : (
          options.map((opt) => {
            const isSelected = opt.id === selectedOptionId;
            return (
              <label
                key={opt.id}
                onClick={() => onSelectOption(opt.id)}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gold/15 border-gold text-gold shadow-sm"
                    : "bg-background border-border/70 text-textMuted hover:border-gold/40 hover:text-cream"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={isSelected}
                    onChange={() => onSelectOption(opt.id)}
                    className="accent-gold w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-xs text-cream font-serif">
                      {opt.name}
                    </div>
                    <div className="text-[10px] font-mono text-textMuted mt-0.5 flex items-center gap-1">
                      <ShieldCheck size={11} className="text-emerald-400" />
                      <span>Delivery in {opt.estimatedDays}</span>
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-xs text-gold">
                  {opt.price === 0 ? "FREE" : renderPrice(opt.price)}
                </div>
              </label>
            );
          })
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 border border-border/80 text-textMuted font-mono text-xs uppercase tracking-wider rounded hover:text-cream hover:border-cream transition-all cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="flex-1 py-3 bg-gold text-obsidian font-mono text-xs uppercase tracking-widest font-bold rounded hover:bg-gold-pale transition-all cursor-pointer shadow-md"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
