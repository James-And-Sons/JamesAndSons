import React from "react";

export default function OrdersLoading() {
  return (
    <main
      className="min-h-screen pt-24 pb-16 px-4 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300"
      style={{ background: "var(--obsidian)" }}
    >
      {/* ── Top Ambient Gold Progress Bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#C4A05A] to-transparent z-[99999] animate-pulse shadow-[0_0_12px_rgba(196,160,90,0.6)]" />

      {/* Header Breadcrumb & Title Skeleton */}
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-28 bg-[var(--surface2)]/60 rounded-md" />
        <div className="h-8 w-64 bg-[var(--surface2)] rounded-lg" />
        <div className="h-4 w-96 bg-[var(--surface2)]/40 rounded-md" />
      </div>

      {/* Orders List Skeleton Cards */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm space-y-6 animate-pulse"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--border)]">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-[var(--surface2)] rounded" />
                <div className="h-3.5 w-56 bg-[var(--surface2)]/60 rounded" />
              </div>
              <div className="h-7 w-24 bg-[var(--surface2)] rounded-full" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[14px] bg-[var(--surface2)] shrink-0 border border-[var(--border)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-[var(--surface2)] rounded" />
                  <div className="h-3 w-32 bg-[var(--surface2)]/60 rounded" />
                </div>
                <div className="h-5 w-20 bg-[var(--surface2)] rounded shrink-0" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]/40">
              <div className="h-4 w-32 bg-[var(--surface2)]/60 rounded" />
              <div className="h-9 w-36 bg-[var(--surface2)] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
