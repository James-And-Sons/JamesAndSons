"use client";

import React from "react";
import Link from "next/link";
import { renderPrice } from "@/lib/utils";
import CouponInput from "@/components/CouponInput";
import { useCartStore } from "@/store/cart";
import { ArrowRight } from "lucide-react";

interface CartDrawerFooterProps {
  onCloseCart: () => void;
}

export default function CartDrawerFooter({
  onCloseCart,
}: CartDrawerFooterProps) {
  const { items, appliedCoupon, discountedTotal } = useCartStore();

  const grandTotal =
    typeof discountedTotal === "function"
      ? discountedTotal()
      : discountedTotal || 0;
  const gst = grandTotal - grandTotal / 1.18;
  const finalSubtotal = grandTotal - gst;

  const handleCheckoutClick = () => {
    if (
      typeof window !== "undefined" &&
      typeof (window as any).trackMetaEvent === "function"
    ) {
      (window as any).trackMetaEvent("InitiateCheckout", {
        value: grandTotal,
        currency: "INR",
        content_ids: items
          .map((item: any) => item.product?.sku)
          .filter(Boolean),
        content_type: "product",
      });
    }
    onCloseCart();
  };

  return (
    <div className="p-6 border-t border-border bg-obsidian space-y-5 shrink-0 shadow-2xl">
      {/* Coupon Input */}
      <div className="pb-1">
        <CouponInput />
      </div>

      {/* Financial Receipt Breakdown with Generous Padding */}
      <div className="py-4 border-y border-border/50 space-y-3 text-xs font-mono">
        <div className="flex justify-between items-center text-textDim py-0.5">
          <span>Subtotal (excl. GST)</span>
          <span className="text-cream font-medium">
            {renderPrice(finalSubtotal)}
          </span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between items-center text-gold bg-gold/10 px-3 py-2 rounded border border-gold/30 my-1">
            <span>Promo Code ({appliedCoupon.code})</span>
            <span className="font-bold">
              {appliedCoupon.freeShipping ? (
                "Free Shipping"
              ) : (
                <>- {renderPrice(appliedCoupon.discountAmount)}</>
              )}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-textDim py-0.5">
          <span>GST (18% Included)</span>
          <span className="text-cream font-medium">{renderPrice(gst)}</span>
        </div>

        <div className="flex justify-between items-center text-sm text-cream font-bold pt-3 border-t border-border/80 mt-2">
          <span className="font-serif tracking-wider text-xs uppercase text-cream">
            Total (incl. GST)
          </span>
          <span className="text-gold font-mono text-base">
            {renderPrice(grandTotal)}
          </span>
        </div>
      </div>

      {/* Dual CTA Action Buttons */}
      <div className="flex gap-3 pt-1">
        <Link
          href="/cart"
          onClick={onCloseCart}
          className="flex-1 h-12 border border-gold/70 text-gold hover:bg-gold/10 hover:border-gold transition-all duration-300 rounded-sm flex items-center justify-center font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-center"
        >
          VIEW CART
        </Link>

        <Link
          href="/checkout"
          onClick={handleCheckoutClick}
          className="flex-1 h-12 bg-gold text-obsidian hover:bg-gold-pale transition-all duration-300 rounded-sm flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.14em] uppercase text-center shadow-lg shadow-gold/15 group"
        >
          <span>CHECKOUT</span>
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}
