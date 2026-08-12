"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="w-full min-h-screen pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      {/* ── Top Ambient Gold Progress Bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#C4A05A] to-transparent z-[99999] animate-pulse shadow-[0_0_12px_rgba(196,160,90,0.6)]" />

      {/* ── Hero / Header Skeleton Shimmer ── */}
      <div className="p-6 sm:p-8 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-[var(--surface2)] rounded-full border border-[var(--border)]" />
        <div className="h-9 w-3/4 max-w-md bg-[var(--surface2)] rounded-lg border border-[var(--border)]" />
        <div className="h-4 w-1/2 max-w-sm bg-[var(--surface2)]/60 rounded-md border border-[var(--border)]" />
      </div>

      {/* ── Grid Skeleton Cards Shimmer (With Generous Breathing Room) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5 overflow-hidden relative shadow-sm animate-pulse"
          >
            <div className="aspect-[4/5] rounded-[16px] bg-[var(--surface2)]" />
            <div className="space-y-2.5">
              <div className="h-3 w-20 bg-[var(--surface2)]/70 rounded" />
              <div className="h-5 w-full bg-[var(--surface2)] rounded" />
              <div className="h-4 w-24 bg-[var(--surface2)]/80 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
