"use client";

import React from "react";
import {
  Check,
  Clock,
  Package,
  Truck,
  Home,
  XCircle,
  RotateCcw,
} from "lucide-react";

interface OrderStepperTimelineProps {
  status: string;
}

const STEPS = [
  { key: "PENDING", label: "Placed", icon: Clock },
  { key: "PAID", label: "Paid", icon: Check },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
];

export default function OrderStepperTimeline({
  status,
}: OrderStepperTimelineProps) {
  const isCancelled = status === "CANCELLED" || status.includes("CANCEL");
  const isReturned = status.includes("RETURN") || status.includes("RTO");

  if (isCancelled) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-800 text-red-300 rounded-xl flex items-center gap-3">
        <XCircle size={20} />
        <div>
          <div className="font-semibold text-sm">Order Cancelled</div>
          <div className="text-xs opacity-80">
            This order has been cancelled and refunded if payment was processed.
          </div>
        </div>
      </div>
    );
  }

  if (isReturned) {
    return (
      <div className="p-4 bg-purple-950/40 border border-purple-800 text-purple-300 rounded-xl flex items-center gap-3">
        <RotateCcw size={20} />
        <div>
          <div className="font-semibold text-sm">Return / RTO Processed</div>
          <div className="text-xs opacity-80">
            Return logistics request has been recorded.
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const activeStepIndex = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
      <h3 className="text-xs uppercase font-mono tracking-wider text-textMuted font-bold">
        Fulfillment Status Timeline
      </h3>

      <div className="grid grid-cols-5 gap-2 relative">
        {STEPS.map((step, idx) => {
          const isDone = idx <= activeStepIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center text-center space-y-2 relative z-10"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  isDone
                    ? "bg-gold text-obsidian border-gold font-bold shadow-md"
                    : "bg-surface2 text-textMuted border-border"
                }`}
              >
                <StepIcon size={16} />
              </div>
              <span
                className={`text-[11px] font-mono tracking-wider ${isDone ? "text-text font-bold" : "text-textMuted"}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
