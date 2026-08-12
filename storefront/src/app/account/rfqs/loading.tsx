import React from "react";

export default function RfqsLoading() {
  return (
    <main
      className="min-h-screen pt-24 pb-16 px-4 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300"
      style={{ background: "var(--obsidian)" }}
    >
      {/* ── Top Ambient Gold Progress Bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#C4A05A] to-transparent z-[99999] animate-pulse shadow-[0_0_12px_rgba(196,160,90,0.6)]" />

      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-28 bg-[var(--surface2)]/60 rounded-md" />
        <div className="h-8 w-60 bg-[var(--surface2)] rounded-lg" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5 sm:p-6 shadow-sm flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="space-y-2">
              <div className="h-4.5 w-64 bg-[var(--surface2)] rounded" />
              <div className="h-3 w-40 bg-[var(--surface2)]/60 rounded" />
            </div>
            <div className="h-6 w-20 bg-[var(--surface2)] rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </main>
  );
}
