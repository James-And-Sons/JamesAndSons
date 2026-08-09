"use client";

import React, { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  X,
  ShoppingBag,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Coupon } from "../types";

interface StorefrontTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onValidate: (code: string, cartSubtotal: number) => Promise<any>;
}

export default function StorefrontTesterModal({
  isOpen,
  onClose,
  initialCode = "",
  onValidate,
}: StorefrontTesterModalProps) {
  const [code, setCode] = useState(initialCode);
  const [cartSubtotal, setCartSubtotal] = useState("15000");
  const [result, setResult] = useState<any>(null);
  const [isTesting, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleTest = () => {
    if (!code.trim()) {
      alert("Please enter a promo code to test.");
      return;
    }
    startTransition(async () => {
      const res = await onValidate(code, Number(cartSubtotal) || 0);
      setResult(res);
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-sm max-w-lg w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent" />
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-primary">
                Storefront Redemption Simulator
              </h2>
              <p className="text-xs font-mono text-muted">
                Test coupon validation against cart engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="block text-[11px] uppercase text-muted mb-1 font-medium">
              Promo Code to Test
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FESTIVE20"
              className="w-full px-3 py-2 bg-background border border-border rounded text-accent uppercase font-bold focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase text-muted mb-1 font-medium">
              Simulated Cart Subtotal (₹)
            </label>
            <input
              type="number"
              value={cartSubtotal}
              onChange={(e) => setCartSubtotal(e.target.value)}
              placeholder="15000"
              className="w-full px-3 py-2 bg-background border border-border rounded text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="w-full py-2.5 px-4 bg-accent text-accent-foreground font-semibold uppercase tracking-wider text-xs rounded hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running
                Storefront Validation...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Execute Test Redemption
              </>
            )}
          </button>
        </div>

        {/* Test Result Display */}
        {result && (
          <div
            className={`p-4 rounded border font-mono text-xs space-y-2 ${
              result.valid
                ? "bg-emerald-500/10 border-emerald-500/30 text-primary"
                : "bg-red-500/10 border-red-500/30 text-primary"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="font-bold uppercase tracking-wider">
                {result.valid
                  ? "VALID STOREFRONT COUPON"
                  : "REJECTED BY STOREFRONT"}
              </span>
            </div>

            {result.valid ? (
              <div className="space-y-1 pt-1 text-muted">
                <div className="flex justify-between">
                  <span>Cart Subtotal:</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(Number(cartSubtotal))}
                  </span>
                </div>
                <div className="flex justify-between text-accent font-semibold">
                  <span>Calculated Discount:</span>
                  <span>- {formatCurrency(result.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Free Shipping Granted:</span>
                  <span
                    className={
                      result.freeShipping
                        ? "text-emerald-400 font-bold"
                        : "text-muted"
                    }
                  >
                    {result.freeShipping ? "YES (Waiver Active)" : "NO"}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/60 text-primary font-bold">
                  <span>Final Cart Payable:</span>
                  <span>
                    {formatCurrency(
                      Math.max(0, Number(cartSubtotal) - result.discountAmount),
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-red-400 text-[11px] pt-1 leading-relaxed">
                Reason: {result.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
