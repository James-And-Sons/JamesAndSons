'use client';

import { useState, useTransition } from 'react';
import { updateRfqQuote, syncRfqToZohoAction } from '../actions';
import { printPdfQuotation } from '@/lib/pdf/generatePdfQuote';
import { useRouter } from 'next/navigation';

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
      acc[item.id] = item.approvedPrice !== null 
        ? item.approvedPrice 
        : item.targetPrice !== null 
          ? item.targetPrice 
          : item.product.b2bPrice;
      return acc;
    }, {})
  );

  const [discountAmount, setDiscountAmount] = useState<number>(rfq.discountAmount || 0);
  const [shippingAmount, setShippingAmount] = useState<number>(rfq.shippingAmount || 0);
  const [includeGst, setIncludeGst] = useState<boolean>(true);

  const handlePriceChange = (id: string, value: string) => {
    setPrices(prev => ({ ...prev, [id]: Number(value) || 0 }));
  };

  const calculateSubtotal = () => {
    return rfq.items.reduce((acc: number, item: RFQItem) => {
      return acc + (prices[item.id] * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = includeGst ? netSubtotal * 0.18 : (rfq.taxAmount || 0);
  const totalAmount = netSubtotal + taxAmount + shippingAmount;

  const handleAction = (accept: boolean) => {
    if (!accept && !confirm('Are you sure you want to REJECT this quotation request?')) return;
    
    startTransition(async () => {
      const itemsPayload = rfq.items.map((item: RFQItem) => ({
        id: item.id,
        targetPrice: prices[item.id]
      }));

      const quotePricing = {
        discountAmount,
        taxAmount,
        shippingAmount,
        totalAmount
      };

      const result = await updateRfqQuote(rfq.id, itemsPayload, accept, quotePricing);
      if (!result.success) {
        alert('Action failed: ' + result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handlePrintPdf = () => {
    printPdfQuotation({
      rfqNumber: rfq.rfqNumber,
      date: new Date(rfq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
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
        customSpecs: item.customSpecs
      }))
    });
  };

  const handleZohoSync = async () => {
    if (zohoSyncing) return;
    setZohoSyncing(true);
    try {
      const res = await syncRfqToZohoAction(rfq.id);
      if (res.success) {
        alert(`Lead successfully synced to Zoho CRM! Record ID: ${res.leadId || 'Active'}`);
      } else {
        alert(`Zoho Sync Failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Zoho Sync Error: ${err.message}`);
    } finally {
      setZohoSyncing(false);
    }
  };

  const formatPriceInline = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const isLocked = rfq.status !== 'SUBMITTED' && rfq.status !== 'REVIEWING';

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface border border-border">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Tools:</span>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] border border-border text-primary hover:text-accent hover:border-accent transition-colors bg-background/50 rounded-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>📄</span> Print / Generate PDF Quote
          </button>
          <button
            type="button"
            onClick={handleZohoSync}
            disabled={zohoSyncing}
            className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] border border-border text-primary hover:text-accent hover:border-accent transition-colors bg-background/50 rounded-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {zohoSyncing && <span className="inline-block animate-spin border border-t-transparent border-accent rounded-full w-2.5 h-2.5" />}
            <span>☁</span> Sync to Zoho CRM
          </button>
        </div>

        <div className="font-mono text-[11px] text-muted">
          Channel: <span className="text-accent uppercase font-medium">{rfq.channel || 'STOREFRONT'}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-border bg-[#16161a] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-[#1c1c21]">
              <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Product & Custom Specs</th>
              <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Qty</th>
              <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal opacity-50">Standard B2B</th>
              <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-accent font-normal bg-[#1a1a1f]">Approved Unit Price (₹)</th>
              <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {rfq.items.map((item: RFQItem) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-4 px-6">
                  <div className="font-serif text-[16px] text-primary">{item.product.name}</div>
                  <div className="font-mono text-[10px] text-muted mt-0.5 tracking-wide">{item.product.sku}</div>
                  {item.customSpecs?.notes && (
                    <div className="font-body text-[11px] text-accent mt-1 bg-accent/5 px-2 py-1 border border-accent/20 rounded-sm">
                      Requested Specs: {item.customSpecs.notes}
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 font-mono text-[13px] text-primary">{item.quantity}</td>
                <td className="py-4 px-6 font-mono text-[13px] text-muted opacity-50 line-through">
                  {formatPriceInline(item.product.b2bPrice)}
                </td>
                <td className="py-4 px-6 bg-[#1a1a1f] border-x border-border/50">
                  <div className="flex items-center">
                    <span className="font-mono text-muted mr-2">₹</span>
                    <input
                      type="number"
                      value={prices[item.id] || ''}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
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
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent font-semibold">Quote Adjustments</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted block mb-1">Discount (₹)</label>
                <input
                  type="number"
                  disabled={isLocked || isPending}
                  value={discountAmount}
                  onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-full bg-[#16161a] border border-border px-3 py-1.5 font-mono text-xs text-primary focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted block mb-1">Freight / Shipping (₹)</label>
                <input
                  type="number"
                  disabled={isLocked || isPending}
                  value={shippingAmount}
                  onChange={e => setShippingAmount(Number(e.target.value) || 0)}
                  className="w-full bg-[#16161a] border border-border px-3 py-1.5 font-mono text-xs text-primary focus:border-accent outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 font-mono text-[10px] text-muted cursor-pointer">
              <input
                type="checkbox"
                disabled={isLocked || isPending}
                checked={includeGst}
                onChange={e => setIncludeGst(e.target.checked)}
                className="accent-accent"
              />
              <span>Calculate 18% GST Tax (₹{taxAmount.toLocaleString('en-IN')})</span>
            </label>
          </div>

          <div className="space-y-1 text-right border-l border-border/40 pl-6">
            <div className="font-mono text-[11px] text-muted">Subtotal: {formatPriceInline(subtotal)}</div>
            {discountAmount > 0 && <div className="font-mono text-[11px] text-amber-500">Discount: -{formatPriceInline(discountAmount)}</div>}
            {includeGst && <div className="font-mono text-[11px] text-muted">GST (18%): {formatPriceInline(taxAmount)}</div>}
            {shippingAmount > 0 && <div className="font-mono text-[11px] text-muted">Freight: {formatPriceInline(shippingAmount)}</div>}
            <div className="pt-2 border-t border-border/40">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block">Final Quote Total</span>
              <span className="font-serif text-[32px] text-accent tracking-wide">{formatPriceInline(totalAmount)}</span>
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
            {isPending ? 'Processing...' : 'Approve & Save Quote'}
          </button>
        </div>
      )}
      
      {isLocked && (
        <div className="mt-8 p-4 bg-[#1c1c21] border border-border text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
            This quotation has been {rfq.status.toLowerCase()} and cannot be modified further.
          </p>
        </div>
      )}
    </div>
  );
}
