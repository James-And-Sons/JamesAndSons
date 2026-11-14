"use client";

import React, { useState } from "react";
import {
  Tag,
  Edit,
  Trash2,
  Pause,
  Play,
  Globe,
  Share2,
  Mail,
  Bell,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Coupon } from "../types";

interface PromotionsTableProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (couponId: string) => void;
  onToggleStatus: (couponId: string, currentStatus: string) => void;
  onSyncGoogleMerchant: (couponId: string) => void;
  onInspectSync: (coupon: Coupon) => void;
  onSyncEmailAI?: (couponId: string) => void;
  isPending: boolean;
}

export default function PromotionsTable({
  coupons,
  onEdit,
  onDelete,
  onToggleStatus,
  onSyncGoogleMerchant,
  onInspectSync,
  onSyncEmailAI,
  isPending,
}: PromotionsTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  if (coupons.length === 0) {
    return (
      <div className="p-12 text-center border border-border/80 rounded-sm bg-surface/30 space-y-3">
        <Tag className="w-8 h-8 text-muted/60 mx-auto" />
        <h3 className="font-serif text-base text-primary font-medium">
          No Promotions Found
        </h3>
        <p className="text-xs font-mono text-muted max-w-md mx-auto">
          No active or archived promotions match your filter criteria. Launch a
          prebuilt promotion or create a custom coupon code above.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-sm bg-surface overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-background/50 font-mono text-[10px] uppercase tracking-wider text-muted">
            <th className="py-3 px-4">Offer & Code</th>
            <th className="py-3 px-4">Type & Value</th>
            <th className="py-3 px-4">Usage / Cap</th>
            <th className="py-3 px-4">Channels</th>
            <th className="py-3 px-4">Validity</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-xs">
          {coupons.map((c) => {
            const sources = (c.source || "internal").split(",");
            const hasGoogle =
              sources.includes("google_merchant") || sources.includes("all");
            const hasMeta = sources.includes("meta") || sources.includes("all");
            const hasEmail =
              sources.includes("email") || sources.includes("all");
            const hasPush = sources.includes("push") || sources.includes("all");

            return (
              <tr
                key={c.id}
                className="hover:bg-background/40 transition-colors group"
              >
                {/* Code & Description */}
                <td className="py-3.5 px-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider">
                      {c.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(c.code)}
                      className="text-muted hover:text-primary transition-colors p-1"
                      title="Copy code"
                    >
                      {copiedCode === c.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {c.description && (
                    <p className="text-[11px] text-muted line-clamp-1 max-w-xs">
                      {c.description}
                    </p>
                  )}
                  {c.affiliate?.name && (
                    <span className="inline-block text-[9px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded">
                      Partner: {c.affiliate.name}
                    </span>
                  )}
                </td>

                {/* Type & Value */}
                <td className="py-3.5 px-4">
                  <div className="font-mono text-xs font-semibold text-primary">
                    {c.type === "PERCENTAGE"
                      ? `${c.value}% OFF`
                      : c.type === "FIXED_AMOUNT"
                        ? formatCurrency(c.value)
                        : "FREE SHIPPING"}
                  </div>
                  {c.minOrderAmount && c.minOrderAmount > 0 ? (
                    <div className="text-[10px] font-mono text-muted">
                      Min: {formatCurrency(c.minOrderAmount)}
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-muted/60">
                      No min purchase
                    </div>
                  )}
                  {c.maxDiscountCap && c.maxDiscountCap > 0 && (
                    <div className="text-[10px] font-mono text-amber-400">
                      Cap: {formatCurrency(c.maxDiscountCap)}
                    </div>
                  )}
                </td>

                {/* Usage Count */}
                <td className="py-3.5 px-4 font-mono text-xs">
                  <div className="font-medium text-primary">
                    {c.usedCount}{" "}
                    <span className="text-muted text-[10px]">
                      / {c.usageLimit && c.usageLimit > 0 ? c.usageLimit : "∞"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted">
                    {c.usageLimitPerUser
                      ? `${c.usageLimitPerUser} per user`
                      : "Unlimited per user"}
                  </div>
                </td>

                {/* External Sync Channels */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hasGoogle ? (
                      <button
                        type="button"
                        onClick={() => onInspectSync(c)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded hover:bg-amber-500/20 transition-all"
                        title="Google Merchant Promotions Synced - Click to inspect feed XML"
                      >
                        <Globe className="w-3 h-3" /> Google
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSyncGoogleMerchant(c.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-muted/60 bg-background/50 border border-border px-1.5 py-0.5 rounded hover:text-amber-300 hover:border-amber-500/30 transition-all"
                        title="Sync to Google Merchant Center"
                      >
                        <Globe className="w-3 h-3" /> +Google
                      </button>
                    )}

                    {hasMeta && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-300 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 rounded">
                        <Share2 className="w-3 h-3" /> Meta
                      </span>
                    )}

                    {hasEmail && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded">
                        <Mail className="w-3 h-3" /> Email
                      </span>
                    )}

                    {hasPush && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        <Bell className="w-3 h-3" /> Push
                      </span>
                    )}
                  </div>
                </td>

                {/* Validity */}
                <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                  {c.expiresAt ? (
                    <div>
                      <div>
                        Until {new Date(c.expiresAt).toLocaleDateString()}
                      </div>
                      <div className="text-[9px] text-muted/70">
                        {new Date(c.expiresAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ) : (
                    <span>No expiration</span>
                  )}
                </td>

                {/* Status Badge & Toggle */}
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase border ${
                      c.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : c.status === "PAUSED"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.status === "ACTIVE"
                          ? "bg-emerald-400 animate-pulse"
                          : "bg-zinc-400"
                      }`}
                    />
                    {c.status}
                  </span>
                </td>

                {/* Action Buttons */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onSyncEmailAI && (
                      <button
                        type="button"
                        onClick={() => onSyncEmailAI(c.id)}
                        disabled={isPending}
                        className="p-1.5 text-purple-300 hover:text-purple-200 hover:bg-purple-950/30 rounded border border-purple-500/30 transition-all cursor-pointer"
                        title="Auto-Generate & Sync Email Marketing Campaign via AI"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(c.id, c.status)}
                      disabled={isPending}
                      className="p-1.5 text-muted hover:text-amber-400 hover:bg-amber-950/20 rounded border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
                      title={
                        c.status === "ACTIVE"
                          ? "Pause Promotion"
                          : "Activate Promotion"
                      }
                    >
                      {c.status === "ACTIVE" ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      disabled={isPending}
                      className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded border border-transparent hover:border-accent/30 transition-all cursor-pointer"
                      title="Edit Promotion"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      disabled={isPending}
                      className="p-1.5 text-muted hover:text-red-400 hover:bg-red-950/20 rounded border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
                      title="Delete Promotion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
