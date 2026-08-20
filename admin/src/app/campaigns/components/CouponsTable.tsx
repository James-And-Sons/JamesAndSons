"use client";

import React from "react";
import { Tag, CheckCircle2, Clock } from "lucide-react";

export interface DynamicCoupon {
  id: string;
  uniqueCode: string;
  discountValue: number;
  isRedeemed: boolean;
  expiresAt: string;
  createdAt: string;
  customer?: { firstName?: string; lastName?: string; email?: string } | null;
}

interface CouponsTableProps {
  coupons: DynamicCoupon[];
}

export default function CouponsTable({ coupons }: CouponsTableProps) {
  return (
    <div className="bg-surface border border-border/80 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-serif font-bold text-sm text-text flex items-center gap-2">
          <Tag size={16} className="text-gold" />
          Single-Use Dynamic Coupons ({coupons.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-background border-b border-border/60 font-mono text-[10px] uppercase text-textMuted tracking-wider">
              <th className="p-4">Coupon Code</th>
              <th className="p-4">Value</th>
              <th className="p-4">Customer Target</th>
              <th className="p-4">Status</th>
              <th className="p-4">Expiry Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-text">
            {coupons.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-textMuted font-mono"
                >
                  No dynamic single-use coupons generated yet.
                </td>
              </tr>
            ) : (
              coupons.map((c) => {
                const customerName = c.customer
                  ? `${c.customer.firstName || ""} ${c.customer.lastName || ""}`.trim() ||
                    c.customer.email
                  : "General Broadcast";

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-surface2/40 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-gold">
                      {c.uniqueCode}
                    </td>
                    <td className="p-4 font-mono">
                      ₹{c.discountValue.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 text-textMuted">{customerName}</td>
                    <td className="p-4">
                      {c.isRedeemed ? (
                        <span className="px-2 py-0.5 font-mono text-[9px] uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Redeemed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 font-mono text-[9px] uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded inline-flex items-center gap-1">
                          <Clock size={11} /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-textMuted">
                      {new Date(c.expiresAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
