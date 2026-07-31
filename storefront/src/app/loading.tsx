"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="w-full min-h-[70vh] px-6 py-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      {/* Top Floating Soft Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#C4A05A] to-transparent z-[99999] animate-pulse" />

      {/* Hero / Header Skeleton Shimmer */}
      <div className="space-y-4">
        <div className="h-4 w-32 bg-white/5 rounded-full animate-pulse" />
        <div className="h-10 w-3/4 max-w-md bg-white/10 rounded-lg animate-pulse" />
        <div className="h-4 w-1/2 max-w-sm bg-white/5 rounded-md animate-pulse" />
      </div>

      {/* Grid Skeleton Cards Shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-4 overflow-hidden relative"
          >
            <div className="aspect-[4/5] rounded-xl bg-white/5 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-white/5 rounded" />
              <div className="h-5 w-full bg-white/10 rounded" />
              <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
