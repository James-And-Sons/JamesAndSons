"use client";
import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

export default function RedirectManagerWidget() {
  const [redirects, setRedirects] = useState<any[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [statusCode, setStatusCode] = useState(301);
  const [loading, setLoading] = useState(false);

  const fetchRedirects = async () => {
    try {
      const res = await fetch("/api/seo/redirects");
      if (res.ok) {
        const data = await res.json();
        setRedirects(data.redirects || []);
      }
    } catch {
      // Ignore error
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl || !targetUrl) return;

    setLoading(true);
    try {
      const res = await fetch("/api/seo/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl, targetUrl, statusCode }),
      });
      if (res.ok) {
        setSourceUrl("");
        setTargetUrl("");
        fetchRedirects();
      }
    } catch (err) {
      console.error("Add redirect error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/seo/redirects?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchRedirects();
      }
    } catch (err) {
      console.error("Delete redirect error:", err);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-base font-medium text-primary">
              Automated 301 Redirect Manager
            </h3>
            <div className="relative group">
              <HelpCircle className="w-3.5 h-3.5 text-muted cursor-pointer" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-2.5 bg-neutral-900 text-neutral-100 text-[11px] leading-snug rounded shadow-xl z-50 pointer-events-none">
                Manages 301 Permanent Redirects and canonical tag rewrites when
                product URLs or slugs are changed or unpublished.
              </div>
            </div>
          </div>
          <p className="text-xs font-sans text-muted mt-1">
            Preserve link equity and avoid 404 errors by mapping old URLs to new
            destinations.
          </p>
        </div>
      </div>

      {/* Add Redirect Form */}
      <form
        onSubmit={handleAddRedirect}
        className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface-muted/30 p-4 border border-border rounded-lg font-sans text-[13px]"
      >
        <div className="sm:col-span-1">
          <label className="block text-[11px] font-mono text-muted uppercase mb-1">
            Source Path *
          </label>
          <input
            required
            placeholder="/products/old-slug"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full bg-background border border-border px-3 py-2 rounded text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-[11px] font-mono text-muted uppercase mb-1">
            Target Path *
          </label>
          <input
            required
            placeholder="/products/new-slug"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full bg-background border border-border px-3 py-2 rounded text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-[11px] font-mono text-muted uppercase mb-1">
            HTTP Status
          </label>
          <select
            value={statusCode}
            onChange={(e) => setStatusCode(Number(e.target.value))}
            className="w-full bg-background border border-border px-3 py-2 rounded text-primary focus:outline-none focus:border-accent"
          >
            <option value={301}>301 Permanent Redirect</option>
            <option value={302}>302 Temporary Redirect</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-mono text-[12px] uppercase tracking-wider rounded hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </button>
        </div>
      </form>

      {/* Redirects Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-mono text-muted uppercase">
              <th className="pb-2.5 font-medium">Source URL</th>
              <th className="pb-2.5 font-medium">Target URL</th>
              <th className="pb-2.5 font-medium text-center">Status</th>
              <th className="pb-2.5 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {redirects.length > 0 ? (
              redirects.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-surface-muted/40 transition-colors"
                >
                  <td className="py-3 font-mono text-muted truncate max-w-xs">
                    {r.sourceUrl}
                  </td>
                  <td className="py-3 font-mono text-primary font-medium truncate max-w-xs">
                    {r.targetUrl}
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                      {r.statusCode}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-muted hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete Redirect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-center text-muted font-mono text-xs"
                >
                  No custom redirect rules configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
