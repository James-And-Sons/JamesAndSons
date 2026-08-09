"use client";

import React, { useState } from "react";
import { Tag, X, Sparkles } from "lucide-react";

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (couponData: any) => void;
  initialData?: any;
}

export default function CouponFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CouponFormModalProps) {
  const [code, setCode] = useState(initialData?.code || "");
  const [type, setType] = useState<
    "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"
  >(initialData?.type || "PERCENTAGE");
  const [value, setValue] = useState(initialData?.value || 10);
  const [minOrder, setMinOrder] = useState(initialData?.minOrderAmount || 0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ code: code.toUpperCase(), type, value, minOrderAmount: minOrder });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-textMuted hover:text-text p-1 rounded-md"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Tag size={20} className="text-gold" />
          <h3 className="font-serif font-bold text-base text-text">
            {initialData
              ? "Edit Promotion Coupon"
              : "Create New Promotion Coupon"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. LUXURY10"
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono uppercase focus:outline-none focus:border-gold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text">
              Discount Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
            >
              <option value="PERCENTAGE">Percentage Discount (%)</option>
              <option value="FIXED_AMOUNT">Fixed Flat Amount (₹)</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
          </div>

          {type !== "FREE_SHIPPING" && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">
                {type === "PERCENTAGE"
                  ? "Percentage Off (%)"
                  : "Flat Amount Off (₹)"}
              </label>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text">
              Minimum Order Amount (₹)
            </label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 10000"
              className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-textMuted font-mono text-xs uppercase rounded hover:bg-surface2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gold text-obsidian font-mono text-xs uppercase tracking-wider font-bold rounded hover:bg-gold-pale transition-all shadow-md"
            >
              Save Coupon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
