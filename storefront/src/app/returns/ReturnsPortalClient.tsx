'use client';

import { useState } from 'react';
import { findOrderForReturnAction, createReturnRequestAction } from './actions';
import { formatPrice } from '@/lib/utils';
import Navigation from '@/components/Navigation';

export default function ReturnsPortalClient() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [pincode, setPincode] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [reason, setReason] = useState('');

  const handleFindOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await findOrderForReturnAction(orderNumber, pincode);
    if (res.success) {
      setOrder(res.order);
      setStep(2);
    } else {
      setError(res.error || 'Failed to find order.');
    }
    setLoading(false);
  };

  const handleSubmitReturn = async () => {
    if (!reason) {
      setError('Please provide a reason for the return.');
      return;
    }
    setLoading(true);
    const res = await createReturnRequestAction(order.id, reason, []);
    if (res.success) {
      setStep(3);
    } else {
      setError(res.error || 'Submission failed.');
    }
    setLoading(false);
  };

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 20px' }}>
          
          {step === 1 && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div className="section-label">Returns & Exchanges</div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 300, color: 'var(--cream)', marginTop: '8px', marginBottom: '16px' }}>Self-Service Portal</h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginBottom: '48px', lineHeight: 1.6 }}>
                Every James & Sons piece is a legacy. If it isn't perfect for your space, we offer a complimentary 7-day return window.
              </p>

              <form onSubmit={handleFindOrder} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px', textAlign: 'left' }}>
                {error && <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '11px', marginBottom: '20px', padding: '10px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)' }}>⚠ {error}</div>}
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Order Number</label>
                  <input required placeholder="e.g. JNS-1001" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} style={{ width: '100%', background: 'var(--obsidian)', border: '1px solid var(--border)', padding: '14px', color: 'var(--cream)', outline: 'none', fontFamily: 'var(--font-mono)' }} />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Pincode</label>
                  <input required placeholder="Shipping Pincode" maxLength={6} value={pincode} onChange={e => setPincode(e.target.value)} style={{ width: '100%', background: 'var(--obsidian)', border: '1px solid var(--border)', padding: '14px', color: 'var(--cream)', outline: 'none', fontFamily: 'var(--font-mono)' }} />
                </div>

                <button disabled={loading} type="submit" className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                  {loading ? 'Locating Order...' : 'Find My Order'}
                </button>
              </form>
            </div>
          )}

          {step === 2 && order && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <div className="section-label">Order Found</div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginTop: '4px' }}>{order.orderNumber}</h2>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', marginBottom: '32px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Items in Order</div>
                {order.items.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--cream)', fontSize: '14px' }}>{item.product.name} × {item.quantity}</div>
                    <div style={{ color: 'var(--gold-light)' }}>{formatPrice(item.total)}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>Reason for Return</label>
                <textarea 
                  required 
                  placeholder="Tell us why you'd like to return these items..." 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ width: '100%', minHeight: '120px', background: 'var(--obsidian)', border: '1px solid var(--border)', padding: '14px', color: 'var(--cream)', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', marginBottom: '24px', resize: 'vertical' }}
                />
                <button disabled={loading} onClick={handleSubmitReturn} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                  {loading ? 'Submitting...' : 'Request Return Shipment'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                <span style={{ fontSize: '32px', color: 'var(--obsidian)' }}>✓</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, color: 'var(--cream)', marginBottom: '16px' }}>Request Received</h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: 1.6 }}>
                Our concierge team is reviewing your request. Once approved, you will receive a WhatsApp notification with your **Shiprocket Return Label** and pickup details.
              </p>
              <button onClick={() => window.location.href = '/'} className="btn-outline" style={{ padding: '14px 40px' }}>Back to Store</button>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
