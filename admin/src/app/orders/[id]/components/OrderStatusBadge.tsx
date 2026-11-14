"use client";

import React, { useState, useTransition } from "react";
import { updateOrderStatus } from "../../actions";

const STATUS_OPTIONS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-border text-muted bg-surface",
  PAID: "border-amber-500/20 text-amber-400/90 bg-amber-500/5",
  PROCESSING: "border-amber-500/20 text-amber-400/90 bg-amber-500/5",
  SHIPPED: "border-cyan-500/20 text-cyan-400/90 bg-cyan-500/5",
  DELIVERED: "border-emerald-500/20 text-emerald-400/90 bg-emerald-500/5",
  CANCELLED: "border-rose-500/20 text-rose-400/90 bg-rose-500/5",
};

interface OrderStatusBadgeProps {
  orderId: string;
  initialStatus: string;
}

export default function OrderStatusBadge({
  orderId,
  initialStatus,
}: OrderStatusBadgeProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
    });
  };

  const badgeStyle =
    STATUS_COLORS[status] || "border-border text-muted bg-surface";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-3 py-1 font-mono text-xs uppercase tracking-wider font-bold rounded-sm border ${badgeStyle} ${
          isPending ? "opacity-50 animate-pulse" : ""
        }`}
      >
        {status}
      </span>

      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="bg-surface border border-border px-2.5 py-1 text-xs font-mono text-primary rounded-sm focus:outline-none focus:border-accent cursor-pointer"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
