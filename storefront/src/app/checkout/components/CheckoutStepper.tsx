"use client";

import React from "react";
import { Check } from "lucide-react";

interface CheckoutStepperProps {
  step: 1 | 2 | 3;
  setStep: (step: 1 | 2 | 3) => void;
  canNavigateToStep2?: boolean;
  canNavigateToStep3?: boolean;
}

export default function CheckoutStepper({
  step,
  setStep,
  canNavigateToStep2 = false,
  canNavigateToStep3 = false,
}: CheckoutStepperProps) {
  const steps = [
    { number: 1, label: "Shipping Address" },
    { number: 2, label: "Delivery & Logistics" },
    { number: 3, label: "Payment & Confirmation" },
  ];

  return (
    <div className="w-full py-4 border-b border-border/40 mb-6">
      <div className="flex items-center justify-between max-w-xl mx-auto">
        {steps.map((s, idx) => {
          const isCompleted = step > s.number;
          const isCurrent = step === s.number;
          const isClickable =
            s.number === 1 ||
            (s.number === 2 && canNavigateToStep2) ||
            (s.number === 3 && canNavigateToStep3);

          return (
            <React.Fragment key={s.number}>
              <div
                onClick={() => isClickable && setStep(s.number as 1 | 2 | 3)}
                className={`flex items-center gap-2 cursor-pointer transition-all ${
                  isCurrent
                    ? "text-gold font-bold"
                    : isCompleted
                      ? "text-emerald-400 font-medium"
                      : "text-textMuted/60 opacity-60"
                } ${!isClickable ? "pointer-events-none" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border ${
                    isCompleted
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                      : isCurrent
                        ? "bg-gold/15 border-gold text-gold"
                        : "bg-surface border-border text-textMuted"
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : s.number}
                </div>
                <span className="hidden sm:inline text-xs font-mono uppercase tracking-wider">
                  {s.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[1px] mx-3 transition-colors ${
                    step > idx + 1 ? "bg-emerald-500/50" : "bg-border/40"
                  }`}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
