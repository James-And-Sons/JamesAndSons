"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  Package,
  Tag,
  FileSpreadsheet,
} from "lucide-react";

export interface DocDownloadPrefs {
  gstInvoice: boolean;
  shippingLabel: boolean;
  pickupManifest: boolean;
  courierInvoice: boolean;
}

export const DEFAULT_DOC_PREFS: DocDownloadPrefs = {
  gstInvoice: true,
  shippingLabel: true,
  pickupManifest: true,
  courierInvoice: true,
};

export const DOC_PREFS_KEY = "jns_download_docs_prefs";

export function getDocDownloadPrefs(): DocDownloadPrefs {
  if (typeof window === "undefined") return DEFAULT_DOC_PREFS;
  try {
    const raw = localStorage.getItem(DOC_PREFS_KEY);
    if (raw) return { ...DEFAULT_DOC_PREFS, ...JSON.parse(raw) };
  } catch (e) {
    // fallback
  }
  return DEFAULT_DOC_PREFS;
}

export default function DocumentDownloadSettingsForm() {
  const [prefs, setPrefs] = useState<DocDownloadPrefs>(DEFAULT_DOC_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(getDocDownloadPrefs());
  }, []);

  const handleToggle = (key: keyof DocDownloadPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(DOC_PREFS_KEY, JSON.stringify(updated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jns:doc-prefs-updated"));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-surface border border-border shadow-sm p-8 rounded-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-serif text-[20px] text-primary mb-1">
            Order Document Download Preferences
          </h2>
          <p className="font-body text-[13px] text-muted m-0">
            Select which compliance &amp; shipping PDFs are downloaded as
            separate files when you click{" "}
            <strong>"Download All Documents"</strong>.
          </p>
        </div>
        {saved && (
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xs flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <label
          className={`p-4 border rounded-sm flex items-start gap-3 cursor-pointer transition-all ${
            prefs.gstInvoice
              ? "border-accent bg-accent/5"
              : "border-border bg-background/50 opacity-60"
          }`}
        >
          <input
            type="checkbox"
            checked={prefs.gstInvoice}
            onChange={() => handleToggle("gstInvoice")}
            className="mt-1 accent-amber-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-bold block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>GST Tax Invoice</span>
            </span>
            <span className="font-mono text-[9px] text-muted mt-1 block">
              Official Tax Invoice PDF
            </span>
          </div>
        </label>

        <label
          className={`p-4 border rounded-sm flex items-start gap-3 cursor-pointer transition-all ${
            prefs.shippingLabel
              ? "border-accent bg-accent/5"
              : "border-border bg-background/50 opacity-60"
          }`}
        >
          <input
            type="checkbox"
            checked={prefs.shippingLabel}
            onChange={() => handleToggle("shippingLabel")}
            className="mt-1 accent-amber-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-bold block flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>Shipping Label</span>
            </span>
            <span className="font-mono text-[9px] text-muted mt-1 block">
              Courier Barcode Label PDF
            </span>
          </div>
        </label>

        <label
          className={`p-4 border rounded-sm flex items-start gap-3 cursor-pointer transition-all ${
            prefs.pickupManifest
              ? "border-accent bg-accent/5"
              : "border-border bg-background/50 opacity-60"
          }`}
        >
          <input
            type="checkbox"
            checked={prefs.pickupManifest}
            onChange={() => handleToggle("pickupManifest")}
            className="mt-1 accent-amber-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-bold block flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-accent" />
              <span>Pickup Manifest</span>
            </span>
            <span className="font-mono text-[9px] text-muted mt-1 block">
              Warehouse Manifest PDF
            </span>
          </div>
        </label>

        <label
          className={`p-4 border rounded-sm flex items-start gap-3 cursor-pointer transition-all ${
            prefs.courierInvoice
              ? "border-accent bg-accent/5"
              : "border-border bg-background/50 opacity-60"
          }`}
        >
          <input
            type="checkbox"
            checked={prefs.courierInvoice}
            onChange={() => handleToggle("courierInvoice")}
            className="mt-1 accent-amber-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-bold block flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
              <span>Courier Invoice</span>
            </span>
            <span className="font-mono text-[9px] text-muted mt-1 block">
              Shiprocket Invoice PDF
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
