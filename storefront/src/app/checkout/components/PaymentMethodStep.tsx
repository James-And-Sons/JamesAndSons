"use client";

import React, { useState } from "react";
import { CreditCard, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { renderPrice } from "@/lib/utils";

interface PaymentMethodStepProps {
  grandTotal: number;
  onBack: () => void;
  onCompleteOrder: (method: "RAZORPAY" | "COD" | "BANK_TRANSFER") => void;
  isProcessing?: boolean;
}

export default function PaymentMethodStep({
  grandTotal,
  onBack,
  onCompleteOrder,
  isProcessing = false,
}: PaymentMethodStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    "RAZORPAY" | "COD" | "BANK_TRANSFER"
  >("RAZORPAY");

  return (
    <div className="space-y-5 bg-surface/40 p-6 border border-border/80 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <CreditCard size={18} className="text-gold" />
        <h3 className="font-serif font-bold text-base text-cream">
          Select Payment Gateway
        </h3>
      </div>

      <div className="space-y-3">
        {/* Razorpay Online Payment */}
        <label
          onClick={() => setSelectedMethod("RAZORPAY")}
          className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
            selectedMethod === "RAZORPAY"
              ? "bg-gold/15 border-gold text-gold shadow-sm"
              : "bg-background border-border/70 text-textMuted hover:border-gold/40 hover:text-cream"
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentMethod"
              checked={selectedMethod === "RAZORPAY"}
              onChange={() => setSelectedMethod("RAZORPAY")}
              className="accent-gold w-4 h-4 cursor-pointer"
            />
            <div>
              <div className="font-bold text-xs text-cream font-serif">
                Instant Online Payment (Razorpay)
              </div>
              <div className="text-[10px] font-mono text-textMuted mt-0.5">
                UPI (GPay/PhonePe), Credit/Debit Cards, NetBanking, EMI
              </div>
            </div>
          </div>
          <ShieldCheck size={16} className="text-gold shrink-0" />
        </label>

        {/* Bank Wire / NEFT Transfer */}
        <label
          onClick={() => setSelectedMethod("BANK_TRANSFER")}
          className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
            selectedMethod === "BANK_TRANSFER"
              ? "bg-gold/15 border-gold text-gold shadow-sm"
              : "bg-background border-border/70 text-textMuted hover:border-gold/40 hover:text-cream"
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentMethod"
              checked={selectedMethod === "BANK_TRANSFER"}
              onChange={() => setSelectedMethod("BANK_TRANSFER")}
              className="accent-gold w-4 h-4 cursor-pointer"
            />
            <div>
              <div className="font-bold text-xs text-cream font-serif">
                Direct Bank Wire Transfer (NEFT/RTGS)
              </div>
              <div className="text-[10px] font-mono text-textMuted mt-0.5">
                Proforma Invoice & Corporate Bank Account Details Provided
              </div>
            </div>
          </div>
        </label>
      </div>

      <div className="p-3.5 bg-background border border-border/70 rounded-lg flex items-center justify-between text-xs font-mono">
        <span className="text-textMuted">Amount Payable:</span>
        <span className="text-gold font-bold text-base">
          {renderPrice(grandTotal)}
        </span>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 py-3 border border-border/80 text-textMuted font-mono text-xs uppercase tracking-wider rounded hover:text-cream hover:border-cream transition-all cursor-pointer disabled:opacity-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => onCompleteOrder(selectedMethod)}
          disabled={isProcessing}
          className="flex-1 py-3 bg-gold text-obsidian font-mono text-xs uppercase tracking-widest font-bold rounded hover:bg-gold-pale transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Lock size={14} />
          <span>{isProcessing ? "Processing..." : "Complete & Pay Order"}</span>
        </button>
      </div>
    </div>
  );
}
