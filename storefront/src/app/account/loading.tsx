import React from "react";

export default function GenericAccountLoading() {
  return (
    <main
      className="min-h-screen pt-24 pb-16 px-4 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300"
      style={{ background: "var(--obsidian)" }}
    >
      {/* ── 1. Profile Hero Card Skeleton ── */}
      <div className="relative p-6 sm:p-8 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xl animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-16 h-16 rounded-full bg-[var(--surface2)] border border-[var(--border)] shrink-0" />
            <div className="space-y-2.5">
              <div className="h-6 w-48 bg-[var(--surface2)] rounded-md" />
              <div className="h-3.5 w-64 bg-[var(--surface2)]/60 rounded-md" />
              <div className="h-3 w-36 bg-[var(--surface2)]/40 rounded-full mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="h-8 w-24 bg-[var(--surface2)] rounded-lg" />
            <div className="h-8 w-24 bg-[var(--surface2)] rounded-lg" />
          </div>
        </div>
      </div>

      {/* ── 2. Navigation Menu Tile Card Skeleton (With Generous Inner Gaps) ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-4 sm:p-5 shadow-sm space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-[16px] bg-[var(--background)]/50 border border-[var(--border)]/50"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[var(--surface2)] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-[var(--surface2)] rounded" />
              <div className="h-3 w-2/3 bg-[var(--surface2)]/60 rounded" />
            </div>
            <div className="w-5 h-5 rounded-full bg-[var(--surface2)] shrink-0" />
          </div>
        ))}
      </div>

      {/* ── 3. Main Desktop Grid Content Skeleton ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Recent Purchases Section Skeleton (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm space-y-6 animate-pulse">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div className="h-6 w-48 bg-[var(--surface2)] rounded-md" />
            <div className="h-4 w-20 bg-[var(--surface2)]/60 rounded-md" />
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-5 rounded-[18px] bg-[var(--background)]/40 border border-[var(--border)]/40 flex items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="h-4.5 w-40 bg-[var(--surface2)] rounded" />
                  <div className="h-3 w-52 bg-[var(--surface2)]/60 rounded" />
                </div>
                <div className="h-6 w-20 bg-[var(--surface2)] rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Security & Wishlist Skeleton (5 cols) */}
        <div className="lg:col-span-5 space-y-8 lg:space-y-10">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm space-y-4 animate-pulse">
            <div className="h-6 w-44 bg-[var(--surface2)] rounded-md pb-3 border-b border-[var(--border)]" />
            <div className="h-12 w-full bg-[var(--surface2)]/40 rounded-[14px]" />
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm space-y-4 animate-pulse">
            <div className="h-6 w-36 bg-[var(--surface2)] rounded-md pb-3 border-b border-[var(--border)]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 bg-[var(--surface2)]/40 rounded-[16px]" />
              <div className="h-24 bg-[var(--surface2)]/40 rounded-[16px]" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
