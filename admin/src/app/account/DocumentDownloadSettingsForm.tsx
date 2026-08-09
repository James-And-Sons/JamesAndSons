"use client";

import { useState, useEffect, useTransition } from "react";
import {
  FileText,
  CheckCircle2,
  Package,
  Tag,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { adminGetSystemConfig, adminSaveSystemConfig } from "./config-actions";

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

export default function DocumentDownloadSettingsForm() {
  const [prefs, setPrefs] = useState<DocDownloadPrefs>(DEFAULT_DOC_PREFS);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const loaded = await adminGetSystemConfig("DOC_DOWNLOAD_PREFS");
        if (loaded) {
          setPrefs({ ...DEFAULT_DOC_PREFS, ...loaded });
        }
      } catch (err) {
        console.error("Failed to load account doc download prefs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleToggle = (key: keyof DocDownloadPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);

    startTransition(async () => {
      try {
        await adminSaveSystemConfig("DOC_DOWNLOAD_PREFS", updated);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "jns_download_docs_prefs",
            JSON.stringify(updated),
          );
          window.dispatchEvent(new CustomEvent("jns:doc-prefs-updated"));
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        console.error("Failed to save doc download prefs:", err);
      }
    });
  };

  return (
    <div className="bg-surface border border-border shadow-sm p-8 rounded-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-serif text-[20px] text-primary mb-1">
            Order Document Download Preferences
          </h2>
          <p className="font-body text-[13px] text-muted m-0">
            Account-level setting: Select which compliance &amp; shipping PDFs
            are bundled into the single ZIP download file when you click{" "}
            <strong>"Download All Documents"</strong>.
          </p>
        </div>
        {saved && (
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xs flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Account Settings Saved</span>
          </span>
        )}
        {loading && (
          <span className="font-mono text-[10px] text-muted flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading preferences...</span>
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
            disabled={isPending || loading}
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
            disabled={isPending || loading}
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
            disabled={isPending || loading}
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
            disabled={isPending || loading}
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
