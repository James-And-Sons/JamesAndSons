"use client";

import { useState, useTransition } from "react";
import { updateRfqQuote, syncRfqToZohoAction } from "../actions";
import { printPdfQuotation } from "@/lib/pdf/generatePdfQuote";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  Cloud,
  Check,
  X,
} from "lucide-react";

type RFQItem = {
  id: string;
  quantity: number;
  targetPrice: number | null;
  approvedPrice: number | null;
  customSpecs?: any;
  product: {
    name: string;
    sku: string;
    b2bPrice: number;
    mrp: number;
  };
};

export default function QuoteBuilderForm({ rfq }: { rfq: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [zohoSyncing, setZohoSyncing] = useState(false);

  const [prices, setPrices] = useState<Record<string, number>>(
    rfq.items.reduce((acc: any, item: RFQItem) => {
      acc[item.id] =
        item.approvedPrice !== null
          ? item.approvedPrice
          : item.targetPrice !== null
            ? item.targetPrice
            : item.product.b2bPrice;
      return acc;
    }, {}),
  );

  const [discountAmount, setDiscountAmount] = useState<number>(
    rfq.discountAmount || 0,
  );
  const [shippingAmount, setShippingAmount] = useState<number>(
    rfq.shippingAmount || 0,
  );
  const [includeGst, setIncludeGst] = useState<boolean>(true);

  const handlePriceChange = (id: string, value: string) => {
    setPrices((prev) => ({ ...prev, [id]: Number(value) || 0 }));
  };

  const calculateSubtotal = () => {
    return rfq.items.reduce((acc: number, item: RFQItem) => {
      return acc + prices[item.id] * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = includeGst ? netSubtotal * 0.18 : rfq.taxAmount || 0;
  const totalAmount = netSubtotal + taxAmount + shippingAmount;

  const handleAction = (accept: boolean) => {
    if (
      !accept &&
      !confirm("Are you sure you want to REJECT this quotation request?")
    )
      return;

    startTransition(async () => {
      const itemsPayload = rfq.items.map((item: RFQItem) => ({
        id: item.id,
        targetPrice: prices[item.id],
      }));

      const quotePricing = {
        discountAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
      };

      const result = await updateRfqQuote(
        rfq.id,
        itemsPayload,
        accept,
        quotePricing,
      );
      if (!result.success) {
        alert("Action failed: " + result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handlePrintPdf = () => {
    printPdfQuotation({
      rfqNumber: rfq.rfqNumber,
      date: new Date(rfq.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      customerName: `${rfq.user.firstName} ${rfq.user.lastName}`,
      email: rfq.user.email,
      phone: rfq.user.phone || undefined,
      companyName: rfq.user.company?.name || undefined,
      projectName: rfq.projectName || undefined,
      notes: rfq.notes || undefined,
      discountAmount,
      taxAmount,
      shippingAmount,
      totalAmount,
      items: rfq.items.map((item: RFQItem) => ({
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: prices[item.id],
        total: prices[item.id] * item.quantity,
        customSpecs: item.customSpecs,
      })),
    });
  };

  const handleZohoSync = async () => {
    if (zohoSyncing) return;
    setZohoSyncing(true);
    try {
      const res = await syncRfqToZohoAction(rfq.id);
      if (res.success) {
        alert(
          `Lead successfully synced to Zoho CRM! Record ID: ${res.leadId || "Active"}`,
        );
      } else {
        alert(`Zoho Sync Failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Zoho Sync Error: ${err.message}`);
    } finally {
      setZohoSyncing(false);
    }
  };

  const formatPriceInline = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const isLocked = rfq.status !== "SUBMITTED" && rfq.status !== "REVIEWING";

  // ── Mobile Wizard State ───────────────────────────────────────────────────
  const MOBILE_STEPS = [
    "Item Pricing",
    "Adjustments",
    "Summary",
    "Actions",
  ] as const;
  const [mobileStep, setMobileStep] = useState(0);

  const renderMobileWizard = () => (
    <div className="block md:hidden flex flex-col min-h-0">
      {/* Step Progress Bar */}
      <div className="sticky top-[64px] z-20 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-1">
          {MOBILE_STEPS.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setMobileStep(idx)}
              className={`flex-1 flex flex-col items-center gap-1 p-1 cursor-pointer transition-colors ${
                idx === mobileStep
                  ? "text-accent"
                  : idx < mobileStep
                    ? "text-emerald-500"
                    : "text-muted"
              }`}
              aria-current={idx === mobileStep ? "step" : undefined}
            >
              <span
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono text-[10px] ${
                  idx < mobileStep
                    ? "bg-emerald-500 border-emerald-500 text-black"
                    : idx === mobileStep
                      ? "bg-accent border-accent text-black font-bold"
                      : "border-border text-muted"
                }`}
              >
                {idx < mobileStep ? <Check size={10} /> : idx + 1}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-wider text-center leading-tight hidden xs:block">
                {label}
              </span>
            </button>
          ))}
        </div>
        {/* Progress line */}
        <div className="mt-2 h-0.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 rounded-full"
            style={{
              width: `${(mobileStep / (MOBILE_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* ── Step 1: Item Pricing ─────────────────────────────────────────── */}
      {mobileStep === 0 && (
        <div className="flex-1 p-4 space-y-4">
          <h2 className="font-serif text-[20px] text-primary font-light">
            Review & Price Items
          </h2>
          {rfq.items.map((item: RFQItem) => (
            <div
              key={item.id}
              className="bg-surface border border-border rounded-lg overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border/40 bg-surface-muted/30">
                <div className="font-serif text-[16px] text-primary">
                  {item.product.name}
                </div>
                <div className="font-mono text-[10px] text-muted mt-0.5 tracking-wide">
                  {item.product.sku}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {item.customSpecs?.notes && (
                  <div className="font-body text-[11px] text-accent bg-accent/5 px-3 py-2 border border-accent/20 rounded-sm">
                    Requested Specs: {item.customSpecs.notes}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 font-mono text-center">
                  <div className="bg-surface-muted/50 p-2 rounded-sm border border-border/30">
                    <span className="text-[9px] text-muted uppercase tracking-wider block">
                      Qty
                    </span>
                    <span className="text-[16px] text-primary font-semibold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="bg-surface-muted/50 p-2 rounded-sm border border-border/30">
                    <span className="text-[9px] text-muted uppercase tracking-wider block">
                      Standard B2B
                    </span>
                    <span className="text-[13px] text-muted line-through">
                      {formatPriceInline(item.product.b2bPrice)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-accent block mb-1.5">
                    Approved Unit Price (₹)
                  </label>
                  <div className="flex items-center gap-2 bg-surface border border-border focus-within:border-accent rounded-sm px-3 py-2 min-h-[44px]">
                    <span className="font-mono text-muted text-[13px]">₹</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={prices[item.id] || ""}
                      onChange={(e) =>
                        handlePriceChange(item.id, e.target.value)
                      }
                      disabled={isLocked || isPending}
                      className="flex-1 bg-transparent font-mono text-[16px] text-primary focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="font-mono text-[10px] text-muted mt-1">
                    Line total:{" "}
                    <span className="text-accent font-semibold">
                      {formatPriceInline(prices[item.id] * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Step 2: Adjustments ─────────────────────────────────────────── */}
      {mobileStep === 1 && (
        <div className="flex-1 p-4 space-y-4">
          <h2 className="font-serif text-[20px] text-primary font-light">
            Quote Adjustments
          </h2>
          <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted block mb-1.5">
                Discount (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                disabled={isLocked || isPending}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                className="w-full bg-background border border-border px-4 py-3 min-h-[44px] font-mono text-[15px] text-primary focus:border-accent outline-none rounded-sm"
              />
            </div>
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted block mb-1.5">
                Freight / Shipping (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                disabled={isLocked || isPending}
                value={shippingAmount}
                onChange={(e) => setShippingAmount(Number(e.target.value) || 0)}
                className="w-full bg-background border border-border px-4 py-3 min-h-[44px] font-mono text-[15px] text-primary focus:border-accent outline-none rounded-sm"
              />
            </div>
            <label className="flex items-center gap-3 p-4 bg-surface-muted/40 border border-border rounded-sm cursor-pointer min-h-[52px]">
              <input
                type="checkbox"
                disabled={isLocked || isPending}
                checked={includeGst}
                onChange={(e) => setIncludeGst(e.target.checked)}
                className="w-5 h-5 accent-accent"
              />
              <div>
                <div className="font-mono text-[11px] text-primary">
                  Include 18% GST
                </div>
                <div className="font-mono text-[10px] text-muted">
                  {formatPriceInline(taxAmount)} will be added
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ── Step 3: Summary ─────────────────────────────────────────────── */}
      {mobileStep === 2 && (
        <div className="flex-1 p-4 space-y-4">
          <h2 className="font-serif text-[20px] text-primary font-light">
            Quote Summary
          </h2>
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="divide-y divide-border/40">
              <div className="flex justify-between px-4 py-3.5">
                <span className="font-mono text-[11px] text-muted">
                  Subtotal
                </span>
                <span className="font-mono text-[13px] text-primary tabular-nums">
                  {formatPriceInline(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between px-4 py-3.5">
                  <span className="font-mono text-[11px] text-amber-500">
                    Discount
                  </span>
                  <span className="font-mono text-[13px] text-amber-500 tabular-nums">
                    -{formatPriceInline(discountAmount)}
                  </span>
                </div>
              )}
              {includeGst && (
                <div className="flex justify-between px-4 py-3.5">
                  <span className="font-mono text-[11px] text-muted">
                    GST (18%)
                  </span>
                  <span className="font-mono text-[13px] text-primary tabular-nums">
                    {formatPriceInline(taxAmount)}
                  </span>
                </div>
              )}
              {shippingAmount > 0 && (
                <div className="flex justify-between px-4 py-3.5">
                  <span className="font-mono text-[11px] text-muted">
                    Freight
                  </span>
                  <span className="font-mono text-[13px] text-primary tabular-nums">
                    {formatPriceInline(shippingAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between px-4 py-4 bg-accent/5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                  Final Total
                </span>
                <span className="font-serif text-[24px] text-accent">
                  {formatPriceInline(totalAmount)}
                </span>
              </div>
            </div>
          </div>
          {/* Items recap */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Items in this quote
            </p>
            {rfq.items.map((item: RFQItem) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-border/30"
              >
                <div>
                  <div className="font-mono text-[11px] text-primary">
                    {item.product.name}
                  </div>
                  <div className="font-mono text-[9px] text-muted">
                    × {item.quantity} units @{" "}
                    {formatPriceInline(prices[item.id])}
                  </div>
                </div>
                <span className="font-mono text-[12px] text-accent tabular-nums">
                  {formatPriceInline(prices[item.id] * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 4: Actions ─────────────────────────────────────────────── */}
      {mobileStep === 3 && (
        <div className="flex-1 p-4 space-y-4">
          <h2 className="font-serif text-[20px] text-primary font-light">
            Finalize Quote
          </h2>
          {/* Tools */}
          <div className="bg-surface border border-border rounded-lg divide-y divide-border/40">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="w-full flex items-center gap-3 px-4 py-4 min-h-[52px] text-left text-primary hover:bg-surface-muted transition-colors"
            >
              <FileText size={18} className="text-accent shrink-0" />
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider">
                  Generate PDF Quote
                </div>
                <div className="font-mono text-[9px] text-muted">
                  Print or share with client
                </div>
              </div>
              <ChevronRight size={14} className="ml-auto text-muted" />
            </button>
            <button
              type="button"
              onClick={handleZohoSync}
              disabled={zohoSyncing}
              className="w-full flex items-center gap-3 px-4 py-4 min-h-[52px] text-left text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
            >
              <Cloud size={18} className="text-accent shrink-0" />
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider">
                  {zohoSyncing ? "Syncing..." : "Sync to Zoho CRM"}
                </div>
                <div className="font-mono text-[9px] text-muted">
                  Push lead to your CRM
                </div>
              </div>
              {zohoSyncing && (
                <span className="ml-auto inline-block animate-spin border border-t-transparent border-accent rounded-full w-4 h-4" />
              )}
            </button>
          </div>

          {/* Channel badge */}
          <div className="font-mono text-[10px] text-muted text-center">
            Channel:{" "}
            <span className="text-accent uppercase font-medium">
              {rfq.channel || "STOREFRONT"}
            </span>
          </div>

          {/* Final Approve/Reject */}
          {!isLocked ? (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleAction(true)}
                disabled={isPending}
                className="w-full py-4 min-h-[52px] bg-accent text-black hover:bg-accent-hover transition-colors font-mono text-[11px] uppercase tracking-[0.15em] font-bold disabled:opacity-50 cursor-pointer rounded-sm"
              >
                {isPending ? "Processing..." : "Approve & Save Quote"}
              </button>
              <button
                onClick={() => handleAction(false)}
                disabled={isPending}
                className="w-full py-4 min-h-[52px] border border-border bg-transparent text-secondary hover:text-red-400 hover:border-red-900 transition-colors font-mono text-[11px] uppercase tracking-[0.15em] disabled:opacity-50 cursor-pointer rounded-sm"
              >
                Reject Quotation
              </button>
            </div>
          ) : (
            <div className="p-4 bg-surface-muted/40 border border-border rounded-lg text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                This quotation has been {rfq.status.toLowerCase()} and cannot be
                modified.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Sticky Step Navigation ───────────────────────────────────────── */}
      <div className="sticky-action-bar bg-surface/95 backdrop-blur-md border-t border-border flex gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileStep((s) => Math.max(s - 1, 0))}
          disabled={mobileStep === 0}
          className="flex items-center gap-1.5 px-4 py-3 min-h-[44px] border border-border text-muted font-mono text-[10px] uppercase tracking-wider disabled:opacity-30 hover:text-primary transition-colors rounded-sm cursor-pointer"
        >
          <ChevronLeft size={14} />
          Back
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted">
            Step {mobileStep + 1} of {MOBILE_STEPS.length}
          </span>
        </div>
        {mobileStep < MOBILE_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() =>
              setMobileStep((s) => Math.min(s + 1, MOBILE_STEPS.length - 1))
            }
            className="flex items-center gap-1.5 px-4 py-3 min-h-[44px] bg-accent text-black font-mono text-[10px] uppercase tracking-wider font-bold transition-colors rounded-sm cursor-pointer hover:bg-accent-hover"
          >
            Next
            <ChevronRight size={14} />
          </button>
        ) : (
          <div className="w-[80px]" />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mobile Wizard (< md) — rendered first, completely separate from desktop */}
      {renderMobileWizard()}

      {/* Desktop Layout (md+) */}
      <div className="hidden md:block space-y-6">
        {/* Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface border border-border">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Tools:
            </span>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] border border-border text-primary hover:text-accent hover:border-accent transition-colors bg-background/50 rounded-sm cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-accent" /> Print / Generate
              PDF Quote
            </button>
            <button
              type="button"
              onClick={handleZohoSync}
              disabled={zohoSyncing}
              className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] border border-border text-primary hover:text-accent hover:border-accent transition-colors bg-background/50 rounded-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {zohoSyncing ? (
                <span className="inline-block animate-spin border border-t-transparent border-accent rounded-full w-2.5 h-2.5" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-accent" />
              )}
              Sync to Zoho CRM
            </button>
          </div>

          <div className="font-mono text-[11px] text-muted">
            Channel:{" "}
            <span className="text-accent uppercase font-medium">
              {rfq.channel || "STOREFRONT"}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-border bg-[#16161a] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#1c1c21]">
                <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  Product & Custom Specs
                </th>
                <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                  Qty
                </th>
                <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal opacity-50">
                  Standard B2B
                </th>
                <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-accent font-normal bg-[#1a1a1f]">
                  Approved Unit Price (₹)
                </th>
                <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody>
              {rfq.items.map((item: RFQItem) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-4 px-6">
                    <div className="font-serif text-[16px] text-primary">
                      {item.product.name}
                    </div>
                    <div className="font-mono text-[10px] text-muted mt-0.5 tracking-wide">
                      {item.product.sku}
                    </div>
                    {item.customSpecs?.notes && (
                      <div className="font-body text-[11px] text-accent mt-1 bg-accent/5 px-2 py-1 border border-accent/20 rounded-sm">
                        Requested Specs: {item.customSpecs.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 font-mono text-[13px] text-primary">
                    {item.quantity}
                  </td>
                  <td className="py-4 px-6 font-mono text-[13px] text-muted opacity-50 line-through">
                    {formatPriceInline(item.product.b2bPrice)}
                  </td>
                  <td className="py-4 px-6 bg-[#1a1a1f] border-x border-border/50">
                    <div className="flex items-center">
                      <span className="font-mono text-muted mr-2">₹</span>
                      <input
                        type="number"
                        value={prices[item.id] || ""}
                        onChange={(e) =>
                          handlePriceChange(item.id, e.target.value)
                        }
                        disabled={isLocked || isPending}
                        className="w-full bg-transparent font-mono text-[14px] text-primary border-b border-dashed border-border focus:border-accent focus:outline-none py-1 disabled:opacity-50"
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-[14px] text-primary text-right">
                    {formatPriceInline(prices[item.id] * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Dynamic Quote Pricing Adjustments */}
          <div className="p-6 bg-[#111114] border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent font-semibold">
                Quote Adjustments
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isLocked || isPending}
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(Number(e.target.value) || 0)
                    }
                    className="w-full bg-[#16161a] border border-border px-3 py-1.5 font-mono text-xs text-primary focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted block mb-1">
                    Freight / Shipping (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isLocked || isPending}
                    value={shippingAmount}
                    onChange={(e) =>
                      setShippingAmount(Number(e.target.value) || 0)
                    }
                    className="w-full bg-[#16161a] border border-border px-3 py-1.5 font-mono text-xs text-primary focus:border-accent outline-none"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 font-mono text-[10px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isLocked || isPending}
                  checked={includeGst}
                  onChange={(e) => setIncludeGst(e.target.checked)}
                  className="accent-accent"
                />
                <span>
                  Calculate 18% GST Tax (₹{taxAmount.toLocaleString("en-IN")})
                </span>
              </label>
            </div>

            <div className="space-y-1 text-right border-l border-border/40 pl-6">
              <div className="font-mono text-[11px] text-muted">
                Subtotal: {formatPriceInline(subtotal)}
              </div>
              {discountAmount > 0 && (
                <div className="font-mono text-[11px] text-amber-500">
                  Discount: -{formatPriceInline(discountAmount)}
                </div>
              )}
              {includeGst && (
                <div className="font-mono text-[11px] text-muted">
                  GST (18%): {formatPriceInline(taxAmount)}
                </div>
              )}
              {shippingAmount > 0 && (
                <div className="font-mono text-[11px] text-muted">
                  Freight: {formatPriceInline(shippingAmount)}
                </div>
              )}
              <div className="pt-2 border-t border-border/40">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block">
                  Final Quote Total
                </span>
                <span className="font-serif text-[32px] text-accent tracking-wide">
                  {formatPriceInline(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!isLocked && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => handleAction(false)}
              disabled={isPending}
              className="flex-1 py-4 border border-border bg-transparent text-secondary hover:text-red-400 hover:border-red-900 transition-colors font-mono text-[11px] uppercase tracking-[0.15em] disabled:opacity-50 cursor-pointer"
            >
              Reject Quotation
            </button>

            <button
              onClick={() => handleAction(true)}
              disabled={isPending}
              className="flex-1 py-4 bg-accent text-black hover:bg-accent-hover transition-colors font-mono text-[11px] uppercase tracking-[0.15em] font-bold disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Processing..." : "Approve & Save Quote"}
            </button>
          </div>
        )}

        {isLocked && (
          <div className="mt-8 p-4 bg-[#1c1c21] border border-border text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              This quotation has been {rfq.status.toLowerCase()} and cannot be
              modified further.
            </p>
          </div>
        )}
      </div>
      {/* end hidden md:block desktop wrapper */}
    </div>
  );
}
