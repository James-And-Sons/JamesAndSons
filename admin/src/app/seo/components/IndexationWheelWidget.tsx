"use client";
import React from "react";
import { PieChart, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface IndexationWheelWidgetProps {
  totalProducts: number;
  indexedPages: number;
  indexationRatio: number;
}

export default function IndexationWheelWidget({
  totalProducts = 120,
  indexedPages = 106,
  indexationRatio = 88,
}: IndexationWheelWidgetProps) {
  // SVG Ring Math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (indexationRatio / 100) * circumference;

  return (
    <div className="bg-surface border border-border rounded-lg p-6 flex flex-col justify-between space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-base font-medium text-primary">
            Catalog Indexation Wheel
          </h3>
          <div className="relative group">
            <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
              Compares active products in database vs verified indexed URLs in
              Google Search Console.
            </div>
          </div>
        </div>
      </div>

      {/* Radial Wheel */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 120 120"
          >
            {/* Background Ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-border fill-none"
              strokeWidth="10"
            />
            {/* Foreground Ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-emerald-500 fill-none transition-all duration-700"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-mono font-bold text-primary">
              {indexationRatio}%
            </span>
            <span className="text-[10px] font-mono uppercase text-muted">
              Indexed
            </span>
          </div>
        </div>

        <div className="space-y-3 font-sans text-[13px] w-full sm:w-auto">
          <div className="p-3 bg-surface-muted/40 border border-border rounded flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="text-[11px] font-mono text-muted uppercase">
                Indexed Pages
              </span>
              <p className="font-mono font-semibold text-primary">
                {indexedPages} / {totalProducts}
              </p>
            </div>
          </div>

          <div className="p-3 bg-surface-muted/40 border border-border rounded flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[11px] font-mono text-muted uppercase">
                Pending Indexation
              </span>
              <p className="font-mono font-semibold text-primary">
                {totalProducts - indexedPages} products
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
