"use client";

import React from "react";

export default function AdminLoadingSkeleton() {
  return (
    <div className="w-full min-h-[85vh] p-6 space-y-6 animate-pulse">
      {/* Top Header Breadcrumb Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-surface2 rounded-md"></div>
          <div className="h-3 w-72 bg-surface2/60 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-surface2 rounded-lg"></div>
          <div className="h-9 w-32 bg-gold/20 rounded-lg"></div>
        </div>
      </div>

      {/* Top KPI Metric Cards Skeleton (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-surface border border-border/60 rounded-xl space-y-3 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-surface2 rounded"></div>
              <div className="h-8 w-8 bg-gold/15 rounded-lg"></div>
            </div>
            <div className="h-7 w-32 bg-surface2 rounded-md"></div>
            <div className="h-3 w-20 bg-surface2/50 rounded"></div>
          </div>
        ))}
      </div>

      {/* Filter / Controls Bar Skeleton */}
      <div className="p-4 bg-surface border border-border/60 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
        <div className="h-9 w-full sm:w-72 bg-background border border-border/40 rounded-lg"></div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-surface2 rounded-lg"></div>
          <div className="h-9 w-24 bg-surface2 rounded-lg"></div>
        </div>
      </div>

      {/* Main Table / Data Grid Skeleton */}
      <div className="bg-surface border border-border/60 rounded-xl p-4 space-y-3 shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 pb-3 border-b border-border/40">
          <div className="h-4 w-20 bg-surface2 rounded"></div>
          <div className="h-4 w-32 bg-surface2 rounded"></div>
          <div className="h-4 w-24 bg-surface2 rounded"></div>
          <div className="h-4 w-20 bg-surface2 rounded"></div>
          <div className="h-4 w-16 bg-surface2 rounded"></div>
          <div className="h-4 w-12 bg-surface2 rounded justify-self-end"></div>
        </div>

        {/* Table Rows (6 Rows) */}
        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div
            key={row}
            className="grid grid-cols-6 gap-4 py-3 items-center border-b border-border/20"
          >
            <div className="h-3.5 w-16 bg-surface2/70 rounded font-mono"></div>
            <div className="h-3.5 w-40 bg-surface2/80 rounded"></div>
            <div className="h-3.5 w-24 bg-surface2/60 rounded"></div>
            <div className="h-3.5 w-20 bg-surface2/70 rounded"></div>
            <div className="h-5 w-16 bg-gold/15 rounded-full border border-gold/30"></div>
            <div className="h-7 w-8 bg-surface2 rounded justify-self-end"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
