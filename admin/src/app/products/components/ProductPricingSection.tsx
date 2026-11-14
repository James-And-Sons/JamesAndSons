"use client";

import React from "react";
import { IndianRupee } from "lucide-react";

interface ProductPricingSectionProps {
  d2cPrice: number;
  mrp: number;
  b2bPrice?: number | null;
  costPrice?: number | null;
  stock: number;
  onChange: (field: string, value: any) => void;
}

export default function ProductPricingSection({
  d2cPrice,
  mrp,
  b2bPrice,
  costPrice,
  stock,
  onChange,
}: ProductPricingSectionProps) {
  return (
    <div className="p-6 bg-surface border border-border rounded-xl space-y-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <IndianRupee size={18} className="text-gold" />
        <h3 className="font-serif font-bold text-base text-text">
          Pricing & Inventory
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* D2C Selling Price */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text">
            D2C Selling Price (₹) *
          </label>
          <input
            type="number"
            value={d2cPrice || ""}
            onChange={(e) =>
              onChange("d2cPrice", parseFloat(e.target.value) || 0)
            }
            placeholder="e.g. 45000"
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
          />
        </div>

        {/* MRP / List Price */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text">
            MRP / List Price (₹) *
          </label>
          <input
            type="number"
            value={mrp || ""}
            onChange={(e) => onChange("mrp", parseFloat(e.target.value) || 0)}
            placeholder="e.g. 60000"
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
          />
        </div>

        {/* B2B Trade Price */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text">
            B2B Trade Price (₹)
          </label>
          <input
            type="number"
            value={b2bPrice || ""}
            onChange={(e) =>
              onChange("b2bPrice", parseFloat(e.target.value) || null)
            }
            placeholder="e.g. 35000"
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
          />
        </div>

        {/* Stock Inventory */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text">
            Available Stock Quantity *
          </label>
          <input
            type="number"
            value={stock || 0}
            onChange={(e) =>
              onChange("stock", parseInt(e.target.value, 10) || 0)
            }
            placeholder="e.g. 25"
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
          />
        </div>
      </div>
    </div>
  );
}
