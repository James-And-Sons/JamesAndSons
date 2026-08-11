"use client";
import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Code,
  HelpCircle,
} from "lucide-react";
import { SchemaValidationResult } from "@james-andsons/seo";

interface SchemaValidatorWidgetProps {
  validation?: SchemaValidationResult | null;
}

export default function SchemaValidatorWidget({
  validation,
}: SchemaValidatorWidgetProps) {
  const v = validation || {
    hasProductSchema: true,
    hasOfferSchema: true,
    hasAggregateRatingSchema: true,
    hasInStockSchema: true,
    missingRequiredFields: [],
    missingRecommendedFields: ["Global Trade Item Number (`gtin`)"],
    isValid: true,
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-sm font-medium text-primary">
            Structured Data & Schema Validator
          </h3>
          <div className="relative group">
            <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
              Validates JSON-LD microdata for Google Rich Results snippet
              compliance (Product, Offer, Rating, Stock).
            </div>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border ${
            v.isValid
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}
        >
          {v.isValid ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>{v.isValid ? "Schema Valid" : "Action Required"}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 font-sans text-[13px]">
        {/* Product Schema */}
        <div className="p-3 bg-surface-muted/40 border border-border rounded flex items-center gap-2">
          {v.hasProductSchema ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>Product Schema</span>
        </div>

        {/* Offer Schema */}
        <div className="p-3 bg-surface-muted/40 border border-border rounded flex items-center gap-2">
          {v.hasOfferSchema ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>Offer Schema</span>
        </div>

        {/* AggregateRating */}
        <div className="p-3 bg-surface-muted/40 border border-border rounded flex items-center gap-2">
          {v.hasAggregateRatingSchema ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span>AggregateRating</span>
        </div>

        {/* InStock */}
        <div className="p-3 bg-surface-muted/40 border border-border rounded flex items-center gap-2">
          {v.hasInStockSchema ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>InStock Availability</span>
        </div>
      </div>

      {/* Missing Fields Alerts */}
      {(v.missingRequiredFields.length > 0 ||
        v.missingRecommendedFields.length > 0) && (
        <div className="mt-4 space-y-2">
          {v.missingRequiredFields.map((f: string, i: number) => (
            <div
              key={i}
              className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded text-[12px] flex items-center gap-2 font-mono"
            >
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Missing Required Field: {f}</span>
            </div>
          ))}

          {v.missingRecommendedFields.map((f: string, i: number) => (
            <div
              key={i}
              className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-[12px] flex items-center gap-2 font-mono"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Missing Recommended Field: {f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
