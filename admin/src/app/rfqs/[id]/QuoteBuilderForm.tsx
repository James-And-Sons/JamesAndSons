'use client';

import { useState, useTransition } from 'react';
import { updateRfqQuote } from '../actions';
import { useRouter } from 'next/navigation';

type RFQItem = {
  id: string;
  quantity: number;
  targetPrice: number | null;
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
  const [prices, setPrices] = useState<Record<string, number>>(
    rfq.items.reduce((acc: any, item: RFQItem) => {
      acc[item.id] = item.targetPrice !== null ? item.targetPrice : item.product.b2bPrice;
      return acc;
    }, {})
  );

  const handlePriceChange = (id: string, value: string) => {
    setPrices(prev => ({ ...prev, [id]: Number(value) || 0 }));
  };

  const handleAction = (accept: boolean) => {
    if (!accept && !confirm('Are you sure you want to REJECT this quotation request?')) return;
    
    startTransition(async () => {
      const itemsPayload = rfq.items.map((item: RFQItem) => ({
        id: item.id,
        targetPrice: prices[item.id]
      }));

      const result = await updateRfqQuote(rfq.id, itemsPayload, accept);
      if (!result.success) {
        alert('Action failed: ' + result.error);
      } else {
        router.refresh();
      }
    });
  };

  const calculateTotal = () => {
    return rfq.items.reduce((acc: number, item: RFQItem) => {
      return acc + (prices[item.id] * item.quantity);
    }, 0);
  };

  const formatPriceInline = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const isLocked = rfq.status !== 'SUBMITTED' && rfq.status !== 'REVIEWING';

  return (
    <div>
      <div className="border border-border bg-[#16161a] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-[#1c1c21]">
              <th className="py-4 px-6 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Product</th>
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
                  <div className="font-mono text-[10px] text-muted mt-1 tracking-wide">{item.product.sku}</div>
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

        <div className="p-6 bg-[#111114] border-t border-border flex justify-between items-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Total Approved Value</div>
          <div className="font-serif text-[28px] text-accent tracking-wide">{formatPriceInline(calculateTotal())}</div>
        </div>
      </div>

      {!isLocked && (
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => handleAction(false)}
            disabled={isPending}
            className="flex-1 py-4 border border-border bg-transparent text-secondary hover:text-red-400 hover:border-red-900 transition-colors font-mono text-[11px] uppercase tracking-[0.15em] disabled:opacity-50"
          >
            Reject Quotation
          </button>
          
          <button
            onClick={() => handleAction(true)}
            disabled={isPending}
            className="flex-1 py-4 bg-accent text-obsidian hover:bg-[#d8b46e] transition-colors font-mono text-[11px] uppercase tracking-[0.15em] font-bold disabled:opacity-50"
          >
            {isPending ? 'Processing...' : 'Approve & Send Quote'}
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
