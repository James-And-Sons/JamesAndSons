import React from "react";

export default function WishlistLoading() {
  return (
    <main
      className="min-h-screen pt-24 pb-16 px-4 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300"
      style={{ background: "var(--obsidian)" }}
    >
      {/* ── Top Ambient Gold Progress Bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#C4A05A] to-transparent z-[99999] animate-pulse shadow-[0_0_12px_rgba(196,160,90,0.6)]" />

      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-28 bg-[var(--surface2)]/60 rounded-md" />
        <div className="h-8 w-56 bg-[var(--surface2)] rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden shadow-sm space-y-4 p-4 animate-pulse"
          >
            <div className="w-full aspect-square rounded-[16px] bg-[var(--surface2)]" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-[var(--surface2)] rounded" />
              <div className="h-3 w-1/2 bg-[var(--surface2)]/60 rounded" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/40">
              <div className="h-5 w-20 bg-[var(--surface2)] rounded" />
              <div className="h-8 w-8 bg-[var(--surface2)] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
