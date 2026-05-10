'use client';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createOrder, verifyPayment, validatePincodeDelivery, calculateShippingRateAction, generatePaymentLinkAction, syncAbandonedCartAction } from './actions';

export default function CheckoutPageInner({ 
  initialData 
}: { 
  initialData?: { name: string; email: string; phone: string; pincode?: string } 
}) {
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderError, setOrderError] = useState('');
  const [form, setForm] = useState({
    name: initialData?.name || '', 
    email: initialData?.email || '', 
    phone: initialData?.phone || '',
    address: '', city: '', state: '', pincode: initialData?.pincode || '',
    gstin: '', companyName: '',
    paymentMethod: 'upi',
  });
  const [showGst, setShowGst] = useState(false);

  const subtotal = total();
  const gst = subtotal * 0.05;
  const totalWeight = items.reduce((acc, item) => acc + (item.product.weight || 0.5) * item.quantity, 0);

  const [paymentFailed, setPaymentFailed] = useState(false);
  const [failedOrderId, setFailedOrderId] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);
  const [shippingCalculated, setShippingCalculated] = useState(false);
  const [etd, setEtd] = useState('');

  // Abandoned Cart Sync (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.email && form.email.includes('@')) {
        syncAbandonedCartAction(form.email, form.phone, items, step);
      }
    }, 2000); // Sync after 2 seconds of inactivity
    return () => clearTimeout(timer);
  }, [form.email, form.phone, step]);

  const grandTotal = subtotal + gst + (shipping || 0);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));
  const [lastPincode, setLastPincode] = useState('');

  // Smart Autofill based on Pincode
  useEffect(() => {
    if (form.pincode.length === 6 && form.pincode !== lastPincode) {
      const autofill = async () => {
        setOrderError('');
        const res = await calculateShippingRateAction(form.pincode, totalWeight, subtotal);
        if (res && res.city && res.state) {
          setForm(prev => ({ ...prev, city: res.city, state: res.state }));
          setLastPincode(form.pincode);
        }
      };
      autofill();
    }
  }, [form.pincode, subtotal, lastPincode, totalWeight]);

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
        shipping || 0
      );
      
      if (!result.success || !result.razorpayOrderId) {
        setOrderError(result.error || 'Failed to initialize payment gateway.');
        setLoading(false);
        return;
      }

      const options = {
        key: result.key,
        amount: result.amount,
        currency: result.currency,
        name: 'James & Sons',
        description: `Order ${result.orderNumber}`,
        order_id: result.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              result.orderId!
            );
            if (verifyRes.success) {
              setOrderNumber(result.orderNumber!);
              clearCart();
              setStep(3); // Show Success Screen
            } else {
              setOrderError(verifyRes.error || 'Payment signature verification failed.');
              setLoading(false);
            }
          } catch (err) {
            setOrderError('Failed to verify payment. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: '#C4A05A',
        },
        modal: {
          ondismiss: function() {
            setOrderError('Payment cancelled.');
            setFailedOrderId(result.orderId || null);
            setPaymentFailed(true);
            setLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setOrderError(response.error.description || 'Payment Failed');
        setFailedOrderId(result.orderId || null);
        setPaymentFailed(true);
        setLoading(false);
      });
      rzp.open();

    } catch (e) {
      setOrderError('Unexpected error. Please try again.');
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '64px', color: 'var(--gold)', marginBottom: '16px', lineHeight: 1 }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginBottom: '12px' }}>Order Confirmed</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '8px' }}>
          Your order <strong style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-mono)' }}>{orderNumber}</strong> has been placed successfully.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '32px' }}>
          A GST invoice and tracking info will be sent to your email. Our installation team will reach out to schedule delivery.
        </p>
        <div style={{ display: 'flex', gap: '12px', rowGap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
          <a href="/account" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px', whiteSpace: 'nowrap', minWidth: '180px' }}>View My Orders</a>
          <a href="/collections" className="btn-outline" style={{ textDecoration: 'none', padding: '12px 28px', whiteSpace: 'nowrap', minWidth: '180px' }}>Continue Shopping</a>
        </div>
      </div>
    );
  }

  if (paymentFailed) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ width: '80px', height: '80px', background: 'var(--red)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
          <span style={{ color: '#fff', fontSize: '40px' }}>!</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginBottom: '16px' }}>Payment Unsuccessful</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginBottom: '40px' }}>Your selection is still reserved for you. Please choose a recovery option below to finalize your order.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '350px', margin: '0 auto' }}>
          <button 
            onClick={() => { setPaymentFailed(false); setStep(2); }} 
            className="btn-primary" 
            style={{ width: '100%' }}
          >
            Try Another Method
          </button>
          
          <button 
            onClick={async () => {
              if (!failedOrderId) return;
              setGeneratingLink(true);
              const res = await generatePaymentLinkAction(failedOrderId);
              if (res.success && res.url) setPaymentLink(res.url);
              setGeneratingLink(false);
            }} 
            disabled={generatingLink || !!paymentLink}
            className="btn-outline" 
            style={{ width: '100%' }}
          >
            {generatingLink ? 'Generating Link...' : paymentLink ? 'Link Sent' : 'Get Payment Link via SMS'}
          </button>

          {paymentLink && (
            <div style={{ marginTop: '20px', padding: '20px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Your Personal Payment Link</div>
              <a href={paymentLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '13px', wordBreak: 'break-all' }}>{paymentLink}</a>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>You can also pay later using this link on your mobile phone.</p>
            </div>
          )}
        </div>
        <div style={{ marginTop: '40px' }}>
          <button onClick={() => setPaymentFailed(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>← Back to Checkout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-layout">

      {/* Left — steps */}
      <div className="checkout-main" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '4px', border: '1px solid var(--border)', background: 'var(--surface)', flexWrap: 'wrap' }}>
          {[{ n: 1, label: 'Delivery Details' }, { n: 2, label: 'Payment' }].map(s => (
            <div key={s.n} style={{ flex: '1 1 200px', padding: '14px 20px', background: step === s.n ? 'rgba(196,160,90,0.08)' : 'transparent', borderRight: s.n === 1 ? '1px solid var(--border)' : 'none', borderBottom: s.n === 1 && step === 1 ? 'none' : 'none', cursor: step > s.n ? 'pointer' : 'default' }} onClick={() => step > s.n && setStep(s.n as 1 | 2)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `1px solid ${step >= s.n ? 'var(--gold)' : 'var(--border)'}`, background: step > s.n ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: step > s.n ? 'var(--obsidian)' : step === s.n ? 'var(--gold)' : 'var(--text-dim)', flexShrink: 0 }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: step === s.n ? 'var(--gold)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.label}</span>
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
                <input required placeholder="House No, Street, Area" value={form.address} onChange={e => update('address', e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>City <span style={{ color: 'var(--red)' }}>*</span></label>
                <input required placeholder="City Name" value={form.city} onChange={e => update('city', e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>State <span style={{ color: 'var(--red)' }}>*</span></label>
                <select 
                  required 
                  value={form.state} 
                  onChange={e => update('state', e.target.value)} 
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '8px 12px', outline: 'none', width: '100%', height: '39px' }}
                >
                  <option value="">Select State</option>
                  {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Pincode <span style={{ color: 'var(--red)' }}>*</span></label>
                <input required placeholder="6 Digits" maxLength={6} value={form.pincode} onChange={e => update('pincode', e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%' }} />
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showGst} onChange={e => setShowGst(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--cream)' }}>Add GST Details (Optional)</span>
              </label>

              {showGst && (
                <div className="form-grid" style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease' }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>GSTIN</label>
                    <input placeholder="15-digit GST Number" value={form.gstin} onChange={e => update('gstin', e.target.value.toUpperCase())} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Registered Company Name</label>
                    <input placeholder="As per GST records" value={form.companyName} onChange={e => update('companyName', e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', padding: '9px 12px', outline: 'none', width: '100%' }} />
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={async () => {
                if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
                  setOrderError('Please fill in all delivery details before continuing.');
                  return;
                }

                // Strict Email Validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(form.email)) {
                  setOrderError('Please enter a valid email address.');
                  return;
                }

                // Strict Phone Validation (India 10 digits)
                const phoneClean = form.phone.replace(/\D/g, '');
                if (phoneClean.length < 10) {
                  setOrderError('Please enter a valid 10-digit phone number.');
                  return;
                }
                
                // Strict Address Validation
                if (form.address.trim().length < 5) {
                  setOrderError('Please enter a more detailed street address (minimum 5 characters).');
                  return;
                }
                
                // Validate Pincode with Shiprocket
                setOrderError('');
                setLoading(true);
                try {
                  const check = await validatePincodeDelivery(form.pincode);
                  if (check.serviceable) {
                    // Fetch dynamic shipping rate
                    const rateData = await calculateShippingRateAction(form.pincode, totalWeight, subtotal);
                    if (rateData) {
                      setShipping(rateData.rate);
                      setEtd(rateData.etd);
                      setShippingCalculated(true);
                    } else {
                      // Fallback if Shiprocket fails but pincode is serviceable
                      setShipping(subtotal > 50000 ? 0 : 2500);
                      setShippingCalculated(true);
                    }
                    setStep(2);
                  } else {
                    setOrderError(`Sorry, we currently do not deliver to pincode ${form.pincode}.`);
                  }
                } catch (e) {
                  setOrderError('Unable to verify delivery pincode at this time.');
                } finally {
                  setLoading(false);
                }
              }} 
              disabled={loading}
              className="btn-primary" 
              style={{ marginTop: '24px', padding: '14px 32px', letterSpacing: '0.15em', width: '100%', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Verifying Area...' : 'Continue to Payment →'}
            </button>
          </div>
        )}

        {/* Step 2 — Final Review & Pay */}
        {step === 2 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
            <div className="section-label" style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Final Review</div>
            
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Shipping To</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)' }}>
                    <strong>{form.name}</strong><br />
                    {form.address}, {form.city}, {form.state} - {form.pincode}
                  </div>
                </div>

                {showGst && form.gstin && (
                  <div style={{ padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>GST Details</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)' }}>
                      <strong>{form.companyName || 'Company Name Not Provided'}</strong><br />
                      GSTIN: <span style={{ fontFamily: 'var(--font-mono)' }}>{form.gstin}</span>
                    </div>
                  </div>
                )}
                
                <div style={{ padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Delivery Estimate</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--green)' }}>
                    {etd ? `Arriving by ${etd}` : 'Ships within 24-48 hours'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: 'rgba(196,160,90,0.04)', border: '1px solid var(--border-gold)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '20px' }}>
              🔒 Secure payment powered by Razorpay. All major UPI, Cards, and Net Banking apps are supported.
            </div>
            
            <button onClick={handlePayment} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px 32px', letterSpacing: '0.15em', opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
              {loading ? 'Opening Gateway...' : `Complete Secure Payment →`}
            </button>
            
            <button 
              onClick={() => setStep(1)} 
              style={{ width: '100%', marginTop: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              ← Edit Delivery Details
            </button>
          </div>
        )}
      </div>

      {/* Right — Order Summary */}
      <div className="checkout-aside" style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'sticky', top: '80px', height: 'fit-content' }}>
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
            {[['Subtotal', formatPrice(subtotal)], ['GST (~5%)', formatPrice(gst)], ['Shipping', shipping === null ? (subtotal > 50000 ? 'FREE' : 'Calculated next') : (shipping === 0 ? 'FREE' : formatPrice(shipping))]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <span>{l}</span><span style={{ color: v === 'FREE' ? 'var(--green)' : 'inherit' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--cream)', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--gold-light)' }}>{formatPrice(grandTotal)}</span>
            </div>
            {etd && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--green)', textAlign: 'right', marginTop: '4px' }}>
                Estimated Delivery: {etd}
              </div>
            )}
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
