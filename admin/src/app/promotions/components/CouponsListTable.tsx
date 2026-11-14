"use client";

import React from "react";
import { Edit, Trash2, Pause, Play, Tag, Plane } from "lucide-react";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  status: "ACTIVE" | "PAUSED" | "EXPIRED" | "EXHAUSTED";
  minOrderAmount: number | null;
  maxDiscountCap: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  affiliate?: { name: string } | null;
}

interface CouponsListTableProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
  onTogglePause: (coupon: Coupon) => void;
}

export default function CouponsListTable({
  coupons,
  onEdit,
  onDelete,
  onTogglePause,
}: CouponsListTableProps) {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "PAUSED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "EXPIRED":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-surface2 text-textMuted border-border";
    }
  };

  return (
    <div className="bg-surface border border-border/80 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-background border-b border-border/60 font-mono text-[10px] uppercase text-textMuted tracking-wider">
              <th className="p-4">Coupon Code</th>
              <th className="p-4">Discount Type</th>
              <th className="p-4">Value</th>
              <th className="p-4">Usage</th>
              <th className="p-4">Status</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-text">
            {coupons.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-textMuted font-mono"
                >
                  No promotion coupons found.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-surface2/40 transition-colors"
                >
                  <td className="p-4 font-mono font-bold text-gold flex items-center gap-2">
                    <Tag size={13} />
                    <span>{c.code}</span>
                  </td>

                  <td className="p-4">
                    <span className="font-mono text-[10px] uppercase text-textMuted">
                      {c.type === "FREE_SHIPPING" ? "Free Shipping" : c.type}
                    </span>
                  </td>

                  <td className="p-4 font-mono font-semibold">
                    {c.type === "PERCENTAGE"
                      ? `${c.value}% OFF`
                      : c.type === "FIXED_AMOUNT"
                        ? `₹${c.value.toLocaleString("en-IN")} OFF`
                        : "FREE SHIPPING"}
                  </td>

                  <td className="p-4 font-mono text-[11px] text-textMuted">
                    {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : "Uses"}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold rounded border ${getBadgeStyle(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="p-4 font-mono text-[11px] text-textMuted">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString("en-IN")
                      : "Never"}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onTogglePause(c)}
                        className="p-1.5 bg-surface2 text-textMuted hover:text-gold rounded transition-colors cursor-pointer"
                        title={
                          c.status === "PAUSED"
                            ? "Resume Coupon"
                            : "Pause Coupon"
                        }
                      >
                        {c.status === "PAUSED" ? (
                          <Play size={13} />
                        ) : (
                          <Pause size={13} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="p-1.5 bg-surface2 text-textMuted hover:text-primary rounded transition-colors cursor-pointer"
                        title="Edit Coupon"
                      >
                        <Edit size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
