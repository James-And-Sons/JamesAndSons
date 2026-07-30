'use client';
import { useState, useTransition } from 'react';

type ShippingRulesClientProps = {
  initialBaseLimit: number;
  initialFreeThreshold: number;
  updateRulesAction: (baseLimit: number, freeThreshold: number) => Promise<{ success: boolean }>;
};

export default function ShippingRulesClient({
  initialBaseLimit,
  initialFreeThreshold,
  updateRulesAction
}: ShippingRulesClientProps) {
  const [baseLimit, setBaseLimit] = useState<number>(initialBaseLimit);
  const [freeThreshold, setFreeThreshold] = useState<number>(initialFreeThreshold);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (baseLimit < 0 || freeThreshold < 0) {
      setError('Values cannot be negative');
      return;
    }

    if (freeThreshold < baseLimit) {
      setError('Free shipping threshold cannot be less than the base shipping limit');
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateRulesAction(baseLimit, freeThreshold);
        if (res.success) {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to update shipping rules');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface border border-border shadow-sm p-8 space-y-6">
        <h2 className="font-serif text-[20px] text-primary font-normal m-0 pb-4 border-b border-border/30">Global Shipping Pricing Settings</h2>
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 font-mono text-[11px] uppercase tracking-wide">
            ✓ Shipping rules updated successfully
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 font-mono text-[11px] uppercase tracking-wide">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block mb-1">
              Base Shipping Baked-In (₹)
            </label>
            <input
              type="number"
              value={baseLimit}
              disabled={isPending}
              onChange={(e) => setBaseLimit(parseFloat(e.target.value) || 0)}
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent"
              required
            />
            <p className="font-body text-[11.5px] text-muted/70 leading-relaxed">
              The default shipping cost built into item prices. If actual shipping costs less than this, the customer is offered the difference as a dynamic checkout discount.
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted block mb-1">
              Free Shipping Threshold (₹)
            </label>
            <input
              type="number"
              value={freeThreshold}
              disabled={isPending}
              onChange={(e) => setFreeThreshold(parseFloat(e.target.value) || 0)}
              className="w-full bg-background border border-border px-4 py-3 text-primary font-body text-[14px] focus:outline-none focus:border-accent"
              required
            />
            <p className="font-body text-[11.5px] text-muted/70 leading-relaxed">
              The max shipping cost absorbed by the store. If actual shipping exceeds this threshold, the customer is billed the difference as a shipping surcharge.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border/30 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-8 py-3"
          >
            {isPending ? 'Saving...' : 'Save Global Rules'}
          </button>
        </div>
      </div>
    </form>
  );
}
