import React from "react";

export default function AddressesLoading() {
  return (
    <main
      className="min-h-screen pt-24 pb-16 px-4 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300"
      style={{ background: "var(--obsidian)" }}
    >
      {/* ── Top Ambient Gold Progress Bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#C4A05A] to-transparent z-[99999] animate-pulse shadow-[0_0_12px_rgba(196,160,90,0.6)]" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-[var(--surface2)]/60 rounded-md" />
          <div className="h-8 w-60 bg-[var(--surface2)] rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-[var(--surface2)] rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm space-y-5 animate-pulse"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="h-5 w-32 bg-[var(--surface2)] rounded" />
              <div className="h-5 w-20 bg-[var(--surface2)] rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-48 bg-[var(--surface2)] rounded" />
              <div className="h-3.5 w-3/4 bg-[var(--surface2)]/60 rounded" />
              <div className="h-3.5 w-1/2 bg-[var(--surface2)]/60 rounded" />
              <div className="h-3.5 w-28 bg-[var(--surface2)]/60 rounded" />
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]/40">
              <div className="h-8 w-20 bg-[var(--surface2)] rounded-lg" />
              <div className="h-8 w-20 bg-[var(--surface2)] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
