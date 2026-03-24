'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus, updateTrackingNumber } from '../actions';

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrderStatusControls({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const [tracking, setTracking] = useState('');
  const [awb, setAwb] = useState('');
  const [showTracking, setShowTracking] = useState(false);

  const handleStatusUpdate = (status: string) => {
    if (status === 'SHIPPED') {
      setShowTracking(true);
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (!result.success) alert('Failed to update status: ' + result.error);
    });
  };

  const handleTrackingSubmit = () => {
    startTransition(async () => {
      const result = await updateTrackingNumber(orderId, tracking, awb);
      if (!result.success) alert('Failed to update tracking: ' + result.error);
      else setShowTracking(false);
    });
  };

  return (
    <div className="bg-surface border border-border p-6 space-y-6">
      <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border-b border-border pb-3">Manage Order</h3>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary mb-3">Update Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(status => (
            <button
              key={status}
              onClick={() => handleStatusUpdate(status)}
              disabled={isPending || status === currentStatus}
              className={`font-mono text-[9px] uppercase tracking-[0.12em] px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                status === currentStatus
                  ? 'border-accent text-accent bg-accent/10'
                  : status === 'CANCELLED'
                  ? 'border-[#f87171]/40 text-[#f87171]/70 hover:border-[#f87171] hover:text-[#f87171] hover:bg-[#f87171]/10'
                  : 'border-border text-muted hover:border-accent hover:text-accent hover:bg-accent/05'
              }`}
            >
              {status === currentStatus ? '✓ ' : ''}{status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {showTracking && (
        <div className="border-t border-border pt-6 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">Add Tracking Details (marks order as Shipped)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">Tracking Number</label>
              <input
                value={tracking}
                onChange={e => setTracking(e.target.value)}
                placeholder="e.g. 14786594834"
                className="w-full bg-background border border-border text-primary font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">AWB Number</label>
              <input
                value={awb}
                onChange={e => setAwb(e.target.value)}
                placeholder="e.g. DHLE1234567"
                className="w-full bg-background border border-border text-primary font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowTracking(false)} className="font-mono text-[9px] uppercase tracking-[0.12em] px-4 py-2 border border-border text-muted hover:text-primary transition-colors">
              Cancel
            </button>
            <button onClick={handleTrackingSubmit} disabled={isPending || !tracking} className="font-mono text-[9px] uppercase tracking-[0.12em] px-6 py-2 bg-accent text-obsidian hover:bg-[#d8b46e] transition-colors disabled:opacity-50">
              {isPending ? 'Saving...' : 'Mark as Shipped →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
