"use client";

import React, { useState } from "react";

interface ProductSpecsTableProps {
  specs?: { key: string; value: string }[];
  customAttributes?: Record<string, any> | null;
  materialAndFinish?: string | null;
  bulbType?: string | null;
  power?: string | null;
  voltage?: string | null;
  countryOfOrigin?: string | null;
  warranty?: string | null;
}

export default function ProductSpecsTable({
  specs = [],
  customAttributes,
  materialAndFinish,
  bulbType,
  power,
  voltage,
  countryOfOrigin,
  warranty,
}: ProductSpecsTableProps) {
  const [showAll, setShowAll] = useState(false);

  const baseItems: { label: string; value: string }[] = [];

  if (materialAndFinish)
    baseItems.push({ label: "Material & Finish", value: materialAndFinish });
  if (bulbType)
    baseItems.push({ label: "Bulb / Socket Type", value: bulbType });
  if (power) baseItems.push({ label: "Power Output", value: power });
  if (voltage) baseItems.push({ label: "Operating Voltage", value: voltage });
  if (warranty) baseItems.push({ label: "Warranty", value: warranty });
  if (countryOfOrigin)
    baseItems.push({ label: "Country of Origin", value: countryOfOrigin });

  // Add custom specs
  specs.forEach((s) => {
    if (s.key && s.value) {
      baseItems.push({ label: s.key, value: s.value });
    }
  });

  // Add dynamic customAttributes
  if (customAttributes && typeof customAttributes === "object") {
    Object.entries(customAttributes).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        const formattedKey = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        baseItems.push({
          label: formattedKey,
          value: typeof val === "boolean" ? (val ? "Yes" : "No") : String(val),
        });
      }
    });
  }

  if (baseItems.length === 0) return null;

  const visibleItems = showAll ? baseItems : baseItems.slice(0, 6);

  return (
    <div className="space-y-4 pt-4 border-t border-border/40">
      <h3 className="font-serif font-bold text-lg text-text">
        Technical Specifications
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {visibleItems.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-surface/50 border border-border/50 rounded flex justify-between gap-2"
          >
            <span className="text-textMuted font-mono text-[11px] uppercase tracking-wider">
              {item.label}
            </span>
            <span className="text-text font-medium text-right">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {baseItems.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-mono text-gold hover:underline cursor-pointer uppercase tracking-wider"
        >
          {showAll
            ? "Show Less Specs ▲"
            : `Show All ${baseItems.length} Specifications ▼`}
        </button>
      )}
    </div>
  );
}
