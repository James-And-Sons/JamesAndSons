"use client";

import React from "react";
import { Package } from "lucide-react";

interface ProductBasicInfoProps {
  name: string;
  sku: string;
  slug: string;
  description: string;
  collection: string;
  collections: string[];
  onChange: (field: string, value: any) => void;
}

export default function ProductBasicInfo({
  name,
  sku,
  slug,
  description,
  collection,
  collections = [],
  onChange,
}: ProductBasicInfoProps) {
  return (
    <div className="p-6 bg-surface border border-border rounded-xl space-y-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Package size={18} className="text-gold" />
        <h3 className="font-serif font-bold text-base text-text">
          Basic Product Details
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Name */}
        <div className="space-y-1 md:col-span-2">
          <label className="block text-xs font-semibold text-text">
            Product Title *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="e.g. Royal Crystal Chandelier 12-Light"
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
          />
        </div>

        {/* SKU */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text">
            SKU Code *
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => onChange("sku", e.target.value)}
            placeholder="e.g. JNS-CHAND-001"
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text">
            URL Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => onChange("slug", e.target.value)}
            placeholder="e.g. royal-crystal-chandelier-12-light"
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-gold"
          />
        </div>

        {/* Collection */}
        <div className="space-y-1 md:col-span-2">
          <label className="block text-xs font-semibold text-text">
            Collection / Category
          </label>
          <select
            value={collection}
            onChange={(e) => onChange("collection", e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
          >
            <option value="">Select Collection...</option>
            {collections.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1 md:col-span-2">
          <label className="block text-xs font-semibold text-text">
            Product Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Write detailed product description..."
            className="w-full px-3 py-2 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
          />
        </div>
      </div>
    </div>
  );
}
