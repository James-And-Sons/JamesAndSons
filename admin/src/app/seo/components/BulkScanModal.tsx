"use client";
import React, { useState, useRef, useCallback } from "react";
import {
  X,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface ScanProgress {
  type: "init" | "progress" | "complete" | "error" | "warning";
  total?: number;
  completed?: number;
  failed?: number;
  productName?: string;
  productId?: string;
  status?: "success" | "error";
  error?: string;
  message?: string;
  errors?: { productId: string; name: string; error: string }[];
}

interface BulkScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function BulkScanModal({
  isOpen,
  onClose,
  onComplete,
}: BulkScanModalProps) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [log, setLog] = useState<
    { name: string; status: "success" | "error"; error?: string }[]
  >([]);
  const abortRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const scrollLog = () => {
    setTimeout(() => {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleStart = useCallback(async () => {
    setPhase("scanning");
    setLog([]);
    setProgress(null);
    setWarnings([]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/seo/bulk-scan?batchSize=5", {
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setPhase("error");
        setProgress({ type: "error", message: "Failed to start scan" });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data: ScanProgress = JSON.parse(line.slice(6));
            setProgress(data);

            if (data.type === "warning" && data.message) {
              setWarnings((prev) => [...prev, data.message!]);
            }

            if (data.type === "progress" && data.productName) {
              setLog((prev) => [
                ...prev,
                {
                  name: data.productName!,
                  status: data.status || "success",
                  error: data.error,
                },
              ]);
              scrollLog();
            }

            if (data.type === "complete") {
              setPhase("done");
              onComplete?.();
            }

            if (data.type === "error") {
              setPhase("error");
            }
          } catch {
            // Bad SSE line
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setPhase("error");
        setProgress({ type: "error", message: err.message || "Scan aborted" });
      }
    }
  }, [onComplete]);

  const handleAbort = () => {
    abortRef.current?.abort();
    setPhase("done");
  };

  const handleClose = () => {
    if (phase === "scanning") handleAbort();
    setPhase("idle");
    setLog([]);
    setProgress(null);
    onClose();
  };

  if (!isOpen) return null;

  const pct =
    progress?.total && progress?.completed !== undefined
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Bulk SEO Scan"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={phase !== "scanning" ? handleClose : undefined}
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-xl mx-4 flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-[var(--color-primary)]">
                Catalog SEO Scan
              </h2>
              <p className="text-[11px] font-mono text-[var(--color-muted)] mt-0.5 uppercase tracking-wider">
                Full site audit engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={phase === "scanning"}
            className="w-8 h-8 flex items-center justify-center rounded-sm border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-accent)]/40 transition-all cursor-pointer disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
          {/* Idle state */}
          {phase === "idle" && (
            <div className="space-y-4">
              <div className="p-4 rounded-sm border border-[var(--color-accent)]/15 bg-[var(--color-accent)]/5">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-4 h-4 text-[var(--color-accent)] mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[13px] font-sans text-[var(--color-primary)]">
                      This will audit <strong>every active product</strong> in
                      your catalog — running PageSpeed, Google indexing
                      inspection, schema validation, and keyword analysis in
                      parallel batches.
                    </p>
                    <p className="text-[11px] font-mono text-[var(--color-muted)] uppercase tracking-wide mt-2">
                      Estimated time · 5–12 minutes for 80+ products
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-2">
                {[
                  "PageSpeed Insights (Mobile + Desktop)",
                  "Google Search Console Indexing Status",
                  "Schema.org Product Validator",
                  "Low-Hanging-Fruit Keyword Detection",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-[12px] font-sans text-[var(--color-muted)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scanning / Done state */}
          {(phase === "scanning" || phase === "done" || phase === "error") && (
            <div className="space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Total",
                    value: progress?.total ?? "—",
                    color: "text-[var(--color-primary)]",
                  },
                  {
                    label: "Completed",
                    value: progress?.completed ?? 0,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Failed",
                    value: progress?.failed ?? 0,
                    color:
                      (progress?.failed ?? 0) > 0
                        ? "text-rose-400"
                        : "text-[var(--color-muted)]",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-3 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-sm text-center"
                  >
                    <div
                      className={`text-xl font-serif font-medium ${s.color}`}
                    >
                      {s.value}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider mt-1">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-mono text-[var(--color-muted)] uppercase tracking-wider">
                    {phase === "scanning"
                      ? "Scanning catalog…"
                      : phase === "done"
                        ? "Scan complete"
                        : "Scan error"}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--color-accent)]">
                    {pct}%
                  </span>
                </div>
                <div className="h-1 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Credential warnings — shown when pre-flight detects bad/missing keys */}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  {warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-sm border border-amber-500/25 bg-amber-500/5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-mono text-amber-400 leading-relaxed">
                        {w}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Live Log */}
              <div className="rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-muted)] overflow-hidden">
                <div className="px-3 py-1.5 border-b border-[var(--color-border)] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider">
                    Live Output
                  </span>
                  {phase === "scanning" && (
                    <Loader2 className="w-3 h-3 text-[var(--color-accent)] animate-spin" />
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto p-3 space-y-1">
                  {log.length === 0 && (
                    <p className="text-[11px] font-mono text-[var(--color-muted)] italic">
                      Initialising…
                    </p>
                  )}
                  {log.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[11px] font-mono"
                    >
                      {entry.status === "success" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                      )}
                      <span
                        className={
                          entry.status === "success"
                            ? "text-[var(--color-primary)]"
                            : "text-rose-400"
                        }
                      >
                        {entry.name}
                      </span>
                      {entry.error && (
                        <span className="text-[var(--color-muted)] truncate">
                          — {entry.error}
                        </span>
                      )}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>

              {/* Done summary */}
              {phase === "done" && (
                <div className="p-3 rounded-sm border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-[12px] font-sans text-emerald-400">
                    {progress?.message ||
                      `Scan complete — ${progress?.completed} products audited.`}
                  </p>
                </div>
              )}

              {phase === "error" && (
                <div className="p-3 rounded-sm border border-rose-500/20 bg-rose-500/5 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <p className="text-[12px] font-sans text-rose-400">
                    {progress?.message || "An error occurred during the scan."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
          {phase === "idle" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="bulk-scan-start-btn"
                type="button"
                onClick={handleStart}
                className="btn-primary font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-accent/20 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Start Full Scan
              </button>
            </>
          )}

          {phase === "scanning" && (
            <button
              type="button"
              onClick={handleAbort}
              className="btn-secondary font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 flex items-center gap-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Abort Scan
            </button>
          )}

          {(phase === "done" || phase === "error") && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPhase("idle");
                  setLog([]);
                  setProgress(null);
                }}
                className="btn-secondary font-mono text-[10px] uppercase tracking-widest px-5 py-2.5 cursor-pointer"
              >
                Scan Again
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn-primary font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 cursor-pointer"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
