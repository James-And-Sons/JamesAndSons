"use client";

import React from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { ShieldCheck, Tag } from "lucide-react";

interface CheckoutOrderSummaryProps {
  items: any[];
  total: number;
  discountedTotal?: number | null;
  appliedCoupon?: { code: string; discountAmount: number } | null;
  shippingFee?: number;
}

export default function CheckoutOrderSummary({
  items,
  total,
  discountedTotal,
  appliedCoupon,
  shippingFee = 0,
}: CheckoutOrderSummaryProps) {
  const finalPrice =
    discountedTotal !== undefined && discountedTotal !== null
      ? discountedTotal
      : total;
  const grandTotal = finalPrice + shippingFee;

  return (
    <div className="p-5 bg-surface border border-border/80 rounded-xl space-y-4 shadow-md">
      <h3 className="font-serif font-bold text-base text-text flex items-center justify-between border-b border-border pb-3">
        <span>Order Summary</span>
        <span className="text-xs font-mono text-textMuted uppercase">
          {items.length} Item(s)
        </span>
      </h3>

      {/* Items list */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex gap-3 text-xs border-b border-border/30 pb-2"
          >
            <div className="w-12 h-12 bg-background border border-border/50 rounded overflow-hidden shrink-0 relative">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface2"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text truncate">{item.name}</h4>
              <p className="text-[10px] text-textMuted font-mono">
                Qty: {item.quantity}
              </p>
            </div>
            <div className="text-right font-mono font-bold text-text">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Coupon banner */}
      {appliedCoupon && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-between text-xs text-emerald-400">
          <span className="flex items-center gap-1.5 font-mono">
            <Tag size={13} />
            <span>{appliedCoupon.code}</span>
          </span>
          <span className="font-mono font-bold">
            -{formatPrice(appliedCoupon.discountAmount)}
          </span>
        </div>
      )}

      {/* Breakdown */}
      <div className="space-y-2 text-xs font-mono border-t border-border pt-3">
        <div className="flex justify-between text-textMuted">
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>

        {shippingFee > 0 ? (
          <div className="flex justify-between text-textMuted">
            <span>Standard Express Freight</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-emerald-400">
            <span>Express Shipping</span>
            <span>FREE</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-text font-bold pt-2 border-t border-border/60">
          <span>Grand Total</span>
          <span className="text-gold">{formatPrice(grandTotal)}</span>
        </div>
      </div>

      {/* Guarantees */}
      <div className="pt-2 text-[10px] text-textMuted flex items-center gap-1.5 font-mono">
        <ShieldCheck size={14} className="text-gold shrink-0" />
        <span>256-Bit SSL Encryption • Express Insured Delivery</span>
      </div>
    </div>
  );
}
