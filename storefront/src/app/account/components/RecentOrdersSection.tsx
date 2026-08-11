"use client";

import React from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Package, ExternalLink } from "lucide-react";

interface RecentOrdersSectionProps {
  orders: any[];
}

export default function RecentOrdersSection({
  orders,
}: RecentOrdersSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h3 className="text-xl font-serif font-medium text-text flex items-center gap-2">
          <Package size={20} className="text-gold" />
          Recent Purchases & Order History
        </h3>
        <Link
          href="/account/orders"
          className="text-xs font-mono font-semibold text-gold hover:underline flex items-center gap-1.5"
        >
          <span>Full History</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 px-4 text-textMuted text-xs bg-background/50 rounded-2xl border border-border/40 space-y-2">
          <p className="font-serif text-base text-text">
            No purchases recorded yet.
          </p>
          <p className="text-textMuted max-w-sm mx-auto">
            Explore our curated luxury collections to place your first bespoke
            order.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            );
            return (
              <div
                key={order.id}
                className="p-5 bg-background/60 border border-border/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gold/30 transition-all duration-300"
              >
                <div className="space-y-1">
                  <div className="font-mono text-xs font-bold text-text flex items-center gap-2">
                    <span>Order #{order.orderNumber}</span>
                    <span className="px-2.5 py-0.5 text-[9px] uppercase font-mono bg-gold/15 text-gold rounded-full border border-gold/30">
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs text-textMuted">
                    Placed on {dateStr} • {order.items?.length || 0} item(s)
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
                  <div className="text-sm font-bold text-gold font-mono">
                    {formatPrice(order.totalAmount)}
                  </div>
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="px-4 py-2 bg-surface2 border border-border text-text text-xs font-mono uppercase tracking-wider rounded-xl hover:border-gold/50 transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
