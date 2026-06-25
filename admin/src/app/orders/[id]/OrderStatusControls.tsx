'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus, updateTrackingNumber } from '../actions';
import { syncRazorpayPayment, trackShiprocketShipment, generateOrderLabel, requestOrderPickup, retryLogisticsSync } from './logistics-actions';

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrderStatusControls({ 
  orderId, 
  currentStatus,
  razorpayOrderId,
  awbNumber,
  fulfillmentError
}: { 
  orderId: string, 
  currentStatus: string,
  razorpayOrderId?: string | null,
  awbNumber?: string | null,
  fulfillmentError?: string | null
}) {
  const [isPending, startTransition] = useTransition();
  const [tracking, setTracking] = useState('');
  const [awb, setAwb] = useState(awbNumber || '');
  const [showTracking, setShowTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);

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

  const handleSyncPayment = () => {
    if (!razorpayOrderId) return;
    startTransition(async () => {
      const result = await syncRazorpayPayment(orderId, razorpayOrderId);
      if (!result.success) alert('Sync failed: ' + result.error);
      else alert('Payment status synced successfully!');
    });
  };

  const handleTrackRealtime = () => {
    if (!awbNumber) return;
    startTransition(async () => {
      const result = await trackShiprocketShipment(awbNumber);
      if (!result.success) alert('Tracking failed: ' + result.error);
      else setTrackingData(result.data);
    });
  };

  const handleGenerateLabel = () => {
    if (!awbNumber) return; // Note: awbNumber currently stores the shipment_id from automation
    startTransition(async () => {
      const result = await generateOrderLabel(awbNumber);
      if (result.success && result.labelUrl) {
        window.open(result.labelUrl, '_blank');
      } else {
        alert('Failed to generate label: ' + (result.error || 'Check if AWB is assigned'));
      }
    });
  };

  const handleRequestPickup = () => {
    if (!awbNumber) return;
    startTransition(async () => {
      const result = await requestOrderPickup(awbNumber);
      if (result.success) alert('Pickup requested successfully!');
      else alert('Pickup request failed: ' + result.error);
    });
  };

  const handleRetryLogistics = () => {
    startTransition(async () => {
      const result = await retryLogisticsSync(orderId);
      if (!result.success) alert('Logistics Sync Failed: ' + result.error);
      else alert('Logistics synced successfully and AWB assigned!');
    });
  };

  return (
    <div className="bg-surface border border-border p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-3">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted m-0">Manage Order</h3>
        <div className="flex gap-2">
          {((currentStatus === 'PAID' || currentStatus === 'PROCESSING') && (!awbNumber || fulfillmentError)) && (
            <button 
              onClick={handleRetryLogistics}
              disabled={isPending}
              className="font-mono text-[8px] uppercase tracking-widest px-3 py-1 bg-[#d97706] text-white hover:bg-[#b45309] transition-colors disabled:opacity-50"
            >
              {isPending ? 'Syncing...' : 'Retry Shiprocket Sync'}
            </button>
          )}
          {currentStatus === 'PENDING' && razorpayOrderId && (
            <button 
              onClick={handleSyncPayment}
              disabled={isPending}
              className="font-mono text-[8px] uppercase tracking-widest px-3 py-1 bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
            >
              Sync Razorpay Payment
            </button>
          )}
          {awbNumber && (
            <>
              <button 
                onClick={handleGenerateLabel}
                disabled={isPending}
                className="font-mono text-[8px] uppercase tracking-widest px-3 py-1 border border-accent text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
              >
                Download Label
              </button>
              <button 
                onClick={handleRequestPickup}
                disabled={isPending}
                className="font-mono text-[8px] uppercase tracking-widest px-3 py-1 bg-white text-obsidian hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                Request Pickup
              </button>
              <button 
                onClick={handleTrackRealtime}
                disabled={isPending}
                className="font-mono text-[8px] uppercase tracking-widest px-3 py-1 bg-[#059669] text-white hover:bg-[#047857] transition-colors disabled:opacity-50"
              >
                Track Real-time
              </button>
            </>
          )}
        </div>
      </div>

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

      {trackingData && (
        <div className="border-t border-border pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">Real-time Logistics Status</p>
            <button onClick={() => setTrackingData(null)} className="text-muted hover:text-white text-[10px] font-mono">Close</button>
          </div>
          <div className="bg-background/50 border border-border p-4 rounded">
            <div className="space-y-3">
              {trackingData.shipment_track?.map((track: any, i: number) => (
                <div key={i} className="flex gap-4 border-l-2 border-accent/30 pl-4 relative">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-accent" />
                  <div>
                    <p className="font-mono text-[11px] text-accent uppercase tracking-wider">{track.status}</p>
                    <p className="font-body text-[12px] text-primary mt-1">{track.location}</p>
                    <p className="font-mono text-[9px] text-muted mt-1">{track.date}</p>
                  </div>
                </div>
              ))}
              {!trackingData.shipment_track && (
                <p className="font-mono text-[11px] text-muted italic">No tracking history found yet for AWB: {awbNumber}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
