"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Building2,
  Clock,
  DollarSign,
  Receipt,
  FileText,
  Loader2,
} from "lucide-react";

export default function AccountingDashboardPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const firstOfMonthStr = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState<string>(firstOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr); // End date defaults to current date
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");

  const [isExporting, setIsExporting] = useState(false);
  const [isDispatchingGst, setIsDispatchingGst] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Summary Metrics State
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalTax: 0,
    orderCount: 0,
    b2bCount: 0,
  });

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/accounting/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          allTime: false,
          format: "json",
        }),
      });
      // Fallback calculation or preview
    } catch {}
  };

  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate]);

  const handleDownload = (allTime = false, forcedFormat?: "xlsx" | "csv") => {
    setIsExporting(true);
    setStatusMsg(null);

    const fmt = forcedFormat || format;
    let url = `/api/accounting/export?format=${fmt}`;
    if (allTime) {
      url += `&allTime=true`;
    } else {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    // Trigger browser file download
    const link = document.createElement("a");
    link.href = url;
    link.download = allTime
      ? `Accounts_Statement_AllTime_${todayStr}.${fmt}`
      : `Accounts_Statement_${startDate}_to_${endDate}.${fmt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
      setStatusMsg({
        type: "success",
        text: allTime
          ? `🎉 One-click All-Time Financial Dataset downloaded successfully!`
          : `🎉 Financial Statement (${startDate} to ${endDate}) downloaded successfully!`,
      });
    }, 1000);
  };

  const handleManualGstDispatch = async () => {
    setIsDispatchingGst(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/accounting/auto-gst-filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to dispatch automated GST filing email.",
        );
      }

      setStatusMsg({
        type: "success",
        text: `🎉 Automated GST Filing package (${data.filingPeriod}) successfully emailed to ${data.recipient}!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "An error occurred during email dispatch.",
      });
    } finally {
      setIsDispatchingGst(false);
    }
  };

  const setPresetMonth = () => {
    setStartDate(firstOfMonthStr);
    setEndDate(todayStr);
  };

  const setPresetPrevMonth = () => {
    const now = new Date();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split("T")[0];
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split("T")[0];
    setStartDate(prevStart);
    setEndDate(prevEnd);
  };

  const setPresetFY = () => {
    const now = new Date();
    const fyYear =
      now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    setStartDate(`${fyYear}-04-01`);
    setEndDate(todayStr);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 premium-card p-6">
        <div>
          <div className="flex items-center gap-2 text-muted font-mono text-[11px] uppercase tracking-widest mb-1">
            <span>Finance & Compliance</span>
            <span>/</span>
            <span className="text-accent font-semibold">
              Accounts & GST Portal
            </span>
          </div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0 flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-accent" /> Accounts &
            Financial Statement Exporter
          </h1>
          <p className="font-sans text-[13px] text-muted mt-1">
            One-click financial downloads for Chartered Accountants (CAs), date
            range filters, all-time dataset exports, and zero-human-intervention
            automated GST email filing.
          </p>
        </div>

        <button
          onClick={() => handleDownload(true, "xlsx")}
          disabled={isExporting}
          className="btn-primary font-mono text-[10px] uppercase tracking-widest px-6 py-3 shadow-lg shadow-accent/20 flex items-center gap-2"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          📦 Download Entire Data Up to Date
        </button>
      </div>

      {/* Notifications Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl font-sans text-xs flex items-center gap-3 border ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Exporter Controls & GST Automated Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Date Range & Exporter Card (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-border/60 pb-4">
              <h3 className="font-serif text-[20px] text-primary flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-accent" /> Financial Statement
                Date Range Selector
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted bg-surface-muted px-3 py-1 rounded-full border border-border">
                CA & Tally Format
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted mr-2">
                Quick Presets:
              </span>
              <button
                onClick={setPresetMonth}
                className="font-mono text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg bg-surface-muted border border-border hover:border-accent/40 text-primary transition-all"
              >
                Current Month
              </button>
              <button
                onClick={setPresetPrevMonth}
                className="font-mono text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg bg-surface-muted border border-border hover:border-accent/40 text-primary transition-all"
              >
                Previous Month
              </button>
              <button
                onClick={setPresetFY}
                className="font-mono text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg bg-surface-muted border border-border hover:border-accent/40 text-primary transition-all"
              >
                FY 2026-27
              </button>
            </div>

            {/* Date Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                  Statement Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm font-mono text-primary focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                  Statement End Date{" "}
                  <span className="text-accent">(Default: Current Date)</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm font-mono text-primary focus:border-accent outline-none"
                />
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                Export File Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormat("xlsx")}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                    format === "xlsx"
                      ? "bg-accent/10 border-accent text-accent font-semibold"
                      : "bg-surface border-border text-muted hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-mono text-xs uppercase">
                        Excel Workbook (.xlsx)
                      </div>
                      <div className="font-sans text-[11px] text-muted">
                        4-Sheet CA Package with GSTR-1
                      </div>
                    </div>
                  </div>
                  {format === "xlsx" && (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("csv")}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                    format === "csv"
                      ? "bg-accent/10 border-accent text-accent font-semibold"
                      : "bg-surface border-border text-muted hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-mono text-xs uppercase">
                        Raw Ledger (.csv)
                      </div>
                      <div className="font-sans text-[11px] text-muted">
                        Single CSV file for Tally/Zoho import
                      </div>
                    </div>
                  </div>
                  {format === "csv" && (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-border/60 flex flex-col md:flex-row gap-4">
              <button
                onClick={() => handleDownload(false)}
                disabled={isExporting}
                className="flex-1 btn-primary font-mono text-[11px] uppercase tracking-widest py-3.5 flex justify-center items-center gap-2 shadow-lg shadow-accent/20"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download Statement ({startDate} to {endDate})
              </button>

              <button
                onClick={() => handleDownload(true)}
                disabled={isExporting}
                className="btn-secondary font-mono text-[11px] uppercase tracking-widest px-6 py-3.5 flex justify-center items-center gap-2"
              >
                <Database className="w-4 h-4 text-accent" />
                All-Time Data Export
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Automated GST Email Filing Card (1 Col) */}
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-6 border-l-4 border-l-accent">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="font-serif text-[18px] text-primary flex items-center gap-2">
                <Send className="w-4 h-4 text-accent" /> Automated GST Filing
                System
              </h3>
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Auto Active
              </span>
            </div>

            <p className="font-sans text-[12px] text-muted leading-relaxed">
              Zero-human-intervention scheduled filing system. Automatically
              generates and emails the monthly GSTR-1 Excel package directly to
              the Accounts & CA team.
            </p>

            <div className="p-4 rounded-xl bg-surface-muted/30 border border-border/70 space-y-3">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted mb-1">
                  Recipient Address
                </label>
                <div className="font-mono text-xs font-semibold text-accent flex items-center gap-2">
                  accounts@jamesandsons.in
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted mb-1">
                  Automated Schedule
                </label>
                <div className="font-mono text-xs text-primary">
                  Monthly on 1st of every month (00:00 AM)
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted mb-1">
                  Attached Package Contents
                </label>
                <div className="font-sans text-[11px] text-muted space-y-1">
                  <div>• Tab 1: Master Sales Ledger</div>
                  <div>• Tab 2: GSTR-1 B2B Sales Register</div>
                  <div>• Tab 3: GSTR-1 B2CS Small Register</div>
                  <div>• Tab 4: HSN/SAC Code Summary</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleManualGstDispatch}
              disabled={isDispatchingGst}
              className="w-full btn-secondary font-mono text-[10px] uppercase tracking-widest py-3 border border-accent/30 text-accent hover:bg-accent/10 transition-all flex justify-center items-center gap-2"
            >
              {isDispatchingGst ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              ⚡ Send GST Filing Report Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
