"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  RotateCcw,
  DollarSign,
  Truck,
  PackageCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { restockRTOOrderAction } from "../actions";

interface RTOFinancialsBannerProps {
  orderId: string;
  channel: string | null;
  status: string;
  refundStatus: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
  rtoStatus: string | null;
  rtoAwbNumber: string | null;
  rtoRestocked: boolean;
  ndrReason: string | null;
  amazonFinancialEvents: any | null;
}

export default function RTOFinancialsBanner({
  orderId,
  channel,
  status,
  refundStatus,
  refundAmount,
  refundedAt,
  rtoStatus,
  rtoAwbNumber,
  rtoRestocked,
  ndrReason,
  amazonFinancialEvents,
}: RTOFinancialsBannerProps) {
  const [isPending, startTransition] = useTransition();
  const [restocked, setRestocked] = useState(rtoRestocked);
  const [message, setMessage] = useState<string | null>(null);

  const hasRefund = (refundAmount && refundAmount > 0) || refundStatus != null;
  const isRto =
    rtoStatus != null || status === "REFUNDED_RTO" || status === "RETURNED";
  const hasNdr = ndrReason != null;

  if (!hasRefund && !isRto && !hasNdr) {
    return null; // Don't render banner for normal active orders
  }

  const handleRestock = () => {
    startTransition(async () => {
      const res = await restockRTOOrderAction(orderId);
      if (res.success) {
        setRestocked(true);
        setMessage(res.message || "Restocked inventory successfully.");
      } else {
        alert(res.error || "Failed to restock inventory");
      }
    });
  };

  // Extract financial adjustments if available
  const refundEvents = amazonFinancialEvents?.RefundEventList || [];
  const postedDateStr = refundedAt
    ? new Date(refundedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 backdrop-blur-sm space-y-4">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono text-[14px] uppercase tracking-wider text-amber-300 font-semibold m-0 flex items-center gap-2">
              Operational Alert:{" "}
              {hasRefund
                ? "Amazon Refund & RTO Initiated"
                : "Delivery Failure / RTO Shipment"}
            </h3>
            <p className="font-mono text-[11px] text-muted m-0 mt-0.5">
              Channel: {channel} • Status: {status}
            </p>
          </div>
        </div>

        {/* 1-Click Warehouse Restock Button */}
        <div className="flex items-center gap-3">
          {restocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              Physical Return Verified & Restocked
            </div>
          ) : (
            <button
              onClick={handleRestock}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30 transition-all font-mono text-[11px] uppercase tracking-wider cursor-pointer font-medium shadow-sm"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  Restocking...
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4 text-amber-300" />
                  Confirm Warehouse Receipt & Restock Inventory
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/30 font-mono text-[11px] text-emerald-300">
          {message}
        </div>
      )}

      {/* Grid of Operational Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Refund Details */}
        <div className="p-3.5 rounded bg-surface/60 border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-[11px] uppercase tracking-wider mb-2">
            <DollarSign className="w-4 h-4" />
            Refund Summary
          </div>
          <div>
            <span className="font-serif text-[24px] text-rose-400 font-normal">
              ₹{(refundAmount || 0).toLocaleString("en-IN")}
            </span>
            <p className="font-mono text-[10px] text-muted m-0 mt-1">
              {postedDateStr
                ? `Refunded on ${postedDateStr}`
                : "Refund Processed by Marketplace"}
            </p>
          </div>
        </div>

        {/* Card 2: Delivery Failure / NDR Reason */}
        <div className="p-3.5 rounded bg-surface/60 border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4" />
            NDR / Delivery Exception
          </div>
          <div>
            <span className="font-mono text-[12px] text-primary font-medium block">
              {ndrReason || "Customer Unavailable / Delivery Failed"}
            </span>
            <p className="font-mono text-[10px] text-muted m-0 mt-1">
              Delivery attempt unsuccessful at destination
            </p>
          </div>
        </div>

        {/* Card 3: RTO Tracking */}
        <div className="p-3.5 rounded bg-surface/60 border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] uppercase tracking-wider mb-2">
            <Truck className="w-4 h-4" />
            RTO Shipment Status
          </div>
          <div>
            <span className="font-mono text-[12px] text-primary font-medium block">
              {rtoStatus || "RTO_IN_TRANSIT"}
            </span>
            <p className="font-mono text-[10px] text-muted m-0 mt-1">
              Return AWB: {rtoAwbNumber || "In Transit to Warehouse"}
            </p>
          </div>
        </div>
      </div>

      {/* Amazon SP-API Financial Event Breakup */}
      {refundEvents.length > 0 && (
        <div className="pt-3 border-t border-amber-500/20">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted mb-2">
            <FileText className="w-3.5 h-3.5" />
            Amazon SP-API Financial Breakup
          </div>
          <div className="bg-surface/80 rounded border border-border p-3 space-y-1.5 font-mono text-[11px]">
            {refundEvents.map((ref: any, idx: number) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-2 text-muted"
              >
                <span>
                  Posted: {new Date(ref.PostedDate).toLocaleDateString()}
                </span>
                <span>
                  Seller SKU:{" "}
                  {ref.ShipmentItemAdjustmentList?.[0]?.SellerSKU || "N/A"}
                </span>
                <span className="text-rose-400 font-medium">
                  Adjustment: ₹
                  {Math.abs(
                    ref.ShipmentItemAdjustmentList?.[0]
                      ?.ItemChargeAdjustmentList?.[0]?.ChargeAmount
                      ?.CurrencyAmount || 0,
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
