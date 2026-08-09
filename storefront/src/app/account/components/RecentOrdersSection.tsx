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
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-bold text-text flex items-center gap-2">
          <Package size={18} className="text-gold" />
          Recent Purchases & Orders
        </h3>
        <Link
          href="/account/orders"
          className="text-xs font-semibold text-gold hover:underline flex items-center gap-1"
        >
          <span>View All Orders</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-textMuted text-xs bg-background/50 rounded-xl border border-border/40">
          You haven&apos;t placed any orders yet. Explore our luxury collection
          to place your first order.
        </div>
      ) : (
        <div className="space-y-3">
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
                className="p-4 bg-background border border-border/60 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-text flex items-center gap-2">
                    <span>Order #{order.orderNumber}</span>
                    <span className="px-2 py-0.5 text-[9px] uppercase font-mono bg-gold/15 text-gold rounded border border-gold/30">
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs text-textMuted mt-1">
                    Placed on {dateStr} • {order.items?.length || 0} item(s)
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                  <div className="text-sm font-bold text-gold font-mono">
                    {formatPrice(order.totalAmount)}
                  </div>
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="px-3 py-1.5 bg-surface2 border border-border text-text text-xs rounded hover:border-gold transition-colors"
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
