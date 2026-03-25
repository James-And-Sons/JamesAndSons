'use client';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createOrder } from './actions';

export default function CheckoutPageInner() {
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderError, setOrderError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
    paymentMethod: 'upi',
  });

  const subtotal = total();
  const gst = subtotal * 0.05;
  const shipping = subtotal > 50000 ? 0 : 2500;
  const grandTotal = subtotal + gst + shipping;

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  if (items.length === 0 && step !== 3) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginBottom: '16px' }}>Your cart is empty</h2>
        <a href="/collections" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 32px', whiteSpace: 'nowrap' }}>Browse Collections</a>
      </div>
    );
  }

  const handlePayment = async () => {
    setLoading(true);
    setOrderError('');
    try {
      const result = await createOrder(
        form,
        items.map(i => ({ product: i.product, quantity: i.quantity })),
        subtotal,
        gst,
        shipping
      );
      if (result.success && result.orderNumber) {
        setOrderNumber(result.orderNumber);
        clearCart();
        setStep(3);
      } else {
        setOrderError(result.error || 'Order failed. Please try again.');
      }
    } catch (e) {
      setOrderError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '64px', color: 'var(--gold)', marginBottom: '16px', lineHeight: 1 }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, color: 'var(--cream)', marginBottom: '12px' }}>Order Confirmed</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '8px' }}>
          Your order <strong style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-mono)' }}>{orderNumber}</strong> has been placed successfully.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '32px' }}>
          A GST invoice and tracking info will be sent to your email. Our installation team will reach out to schedule delivery.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/account" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px', whiteSpace: 'nowrap' }}>View My Orders</a>
          <a href="/collections" className="btn-outline" style={{ textDecoration: 'none', padding: '12px 28px', whiteSpace: 'nowrap' }}>Continue Shopping</a>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-wrapper">

      {/* Left — steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
          {[{ n: 1, label: 'Delivery Details' }, { n: 2, label: 'Payment' }].map(s => (
            <div key={s.n} style={{ flex: 1, padding: '14px 20px', background: step === s.n ? 'rgba(196,160,90,0.08)' : 'transparent', borderRight: s.n === 1 ? '1px solid var(--border)' : 'none', cursor: step > s.n ? 'pointer' : 'default' }} onClick={() => step > s.n && setStep(s.n as 1 | 2)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1px solid ${step >= s.n ? 'var(--gold)' : 'var(--border)'}`, background: step > s.n ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: step > s.n ? 'var(--obsidian)' : step === s.n ? 'var(--gold)' : 'var(--text-dim)', flexShrink: 0 }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: step === s.n ? 'var(--gold)' : 'var(--text-muted)' }}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {orderError && (
          <div style={{ marginBottom: '4px', padding: '12px 16px', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.06)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#f87171' }}>
            ⚠ {orderError}
          </div>
        )}

        {/* Step 1 — Address */}
        {step === 1 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
            <div className="section-label" style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Delivery Details</div>
            <div className="form-grid">
              {[
                { key: 'name', label: 'Full Name' },
                { key: 'email', label: 'Email Address' },
                { key: 'phone', label: 'Phone Number' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.key === 'phone' ? 'auto' : 'auto' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{f.label} <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input required value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%', transition: 'border-color 0.2s' }} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Street Address <span style={{ color: 'var(--red)' }}>*</span></label>
                <input required value={form.address} onChange={e => update('address', e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%' }} />
              </div>
              {[{ key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'pincode', label: 'Pincode' }].map(f => (
                <div key={f.key}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{f.label} <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input required value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%' }} />
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
                  setOrderError('Please fill in all delivery details before continuing.');
                  return;
                }
                setOrderError('');
                setStep(2);
              }} 
              className="btn-primary" 
              style={{ marginTop: '24px', padding: '14px 32px', letterSpacing: '0.15em', width: '100%', whiteSpace: 'nowrap' }}
            >
              Continue to Payment →
            </button>
          </div>
        )}

        {/* Step 2 — Payment */}
        {step === 2 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
            <div className="section-label" style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Payment Method</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              {[
                { id: 'upi', label: 'UPI / GPay / PhonePe', icon: '⚡' },
                { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
                { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
                { id: 'emi', label: 'EMI (6/12/18 months)', icon: '📅' },
              ].map(method => (
                <label key={method.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', border: `1px solid ${form.paymentMethod === method.id ? 'var(--gold)' : 'var(--border)'}`, background: form.paymentMethod === method.id ? 'rgba(196,160,90,0.06)' : 'var(--surface2)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="radio" name="payment" value={method.id} checked={form.paymentMethod === method.id} onChange={() => update('paymentMethod', method.id)} style={{ accentColor: 'var(--gold)' }} />
                  <span style={{ fontSize: '18px' }}>{method.icon}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text)' }}>{method.label}</span>
                </label>
              ))}
            </div>
            <div style={{ padding: '14px 18px', background: 'rgba(196,160,90,0.04)', border: '1px solid var(--border-gold)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '20px' }}>
              🔒 Payments secured by Razorpay. Your card details are never stored on our servers.
            </div>
            <button onClick={handlePayment} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px 32px', letterSpacing: '0.15em', opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
              {loading ? 'Processing Payment...' : `Pay ${formatPrice(grandTotal)} →`}
            </button>
          </div>
        )}
      </div>

      {/* Right — Order Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'sticky', top: '80px' }} className="checkout-aside">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}>
          <div className="section-label" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>Order Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {items.map(item => (
              <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--cream)', marginBottom: '2px' }}>{item.product.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Qty {item.quantity}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--gold-light)', flexShrink: 0 }}>{formatPrice(item.product.d2cPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[['Subtotal', formatPrice(subtotal)], ['GST (~5%)', formatPrice(gst)], ['Shipping', shipping === 0 ? 'FREE' : formatPrice(shipping)]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <span>{l}</span><span style={{ color: v === 'FREE' ? 'var(--green)' : 'inherit' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--cream)', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--gold-light)' }}>{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px 20px' }}>
          {['GST Invoice Included', 'Free Installation (metro)', '2-Year Warranty'].map(t => (
            <div key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
              <span style={{ color: 'var(--gold)' }}>✓</span>{t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
