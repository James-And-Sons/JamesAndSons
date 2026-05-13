'use client';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useWishlistStore } from '@/store/wishlist';
import { useRouter } from 'next/navigation';
import { checkPincode, getSavedPincode } from '@/app/products/actions';
import Image from 'next/image';
import CouponInput from '@/components/CouponInput';

export default function CartPageClient() {
  const router = useRouter();
  const { items, removeItem, updateQty, total, appliedCoupon, discountedTotal, itemCount } = useCartStore();
  const { toggleItem } = useWishlistStore();
  const [mounted, setMounted] = useState(false);
  const [pincode, setPincode] = useState('');
  const [shippingRes, setShippingRes] = useState<any>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadPincode = async () => {
      const saved = await getSavedPincode();
      if (saved) setPincode(saved);
    };
    loadPincode();
  }, []);

  const totalWeight = items.reduce((acc, item) => acc + (item.product.weight || 0.5) * item.quantity, 0);

  const handleCheckPincode = async (code: string) => {
    if (code.length !== 6) return;
    setCheckingPincode(true);
    const res = await checkPincode(code, totalWeight, subtotal);
    setShippingRes(res);
    setCheckingPincode(false);
  };

  useEffect(() => {
    if (mounted && pincode.length === 6) {
      handleCheckPincode(pincode);
    }
  }, [mounted, pincode.length]);

  if (!mounted) return <div style={{ minHeight: '80vh', background: 'var(--bg)' }} />;

  const subtotal = total();
  const finalSubtotal = discountedTotal();
  const gst = finalSubtotal * 0.18; // Standard 18% for luxury goods
  const isShippingCalculated = !!shippingRes?.success;
  const shipping = appliedCoupon?.freeShipping ? 0 : (isShippingCalculated ? shippingRes.rate : (subtotal > 50000 ? 0 : null));
  const grandTotal = finalSubtotal + gst + (shipping || 0);

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface)', border: '1px dashed var(--gold)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🛍</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--cream)', marginBottom: '16px', fontWeight: 300 }}>Your bag is empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px', lineHeight: 1.6 }}>Curate your perfect space with masterworks from our Heritage and Modern lighting collections.</p>
          <Link href="/collections" className="btn-primary" style={{ display: 'inline-block', padding: '16px 40px', textDecoration: 'none', letterSpacing: '0.15em' }}>Explore Collections</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-container" style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'clamp(40px, 8vw, 80px) 0' }}>
      <style jsx>{`
        .cart-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .cart-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .cart-sidebar {
            position: static !important;
          }
        }
        @media (max-width: 640px) {
          .cart-item-card {
            flex-direction: column;
            gap: 16px !important;
          }
          .cart-item-image {
            width: 100% !important;
            height: 200px !important;
          }
          .qty-stepper {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Title Area */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px' }}>Your Selection</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 6vw, 56px)', color: 'var(--cream)', margin: 0, fontWeight: 300, lineHeight: 1.1 }}>
            Shopping <em style={{ color: '#E2C97A', fontStyle: 'italic' }}>Bag</em>
          </h1>
          <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '8px 18px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <i className="ti ti-package" style={{ color: 'var(--gold)' }}></i>
            {itemCount()} {itemCount() === 1 ? 'item' : 'items'}
          </div>

        </div>

        <div className="cart-grid">
          
          {/* Main List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {items.map(item => (
              <div key={item.product.id} className="cart-item-card" style={{ background: 'var(--surface2)', borderRadius: '24px', border: '1px solid var(--border)', padding: '20px', display: 'flex', gap: '24px', position: 'relative' }}>
                {/* Image */}
                <Link href={`/products/${item.product.slug}`} className="cart-item-image" style={{ width: '140px', height: '175px', background: 'var(--void)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                  <Image src={item.product.images?.[0] || '/images/brand-placeholder.png'} alt={item.product.name} width={140} height={175} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>{item.product.collection}</div>
                    <Link href={`/products/${item.product.slug}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(18px, 3vw, 24px)', color: 'var(--cream)', margin: '0 0 8px', fontWeight: 400, lineHeight: 1.2 }}>{item.product.name}</h3>
                    </Link>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(16px, 2.5vw, 20px)', color: '#E2C97A' }}>{formatPrice(item.product.d2cPrice)}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <div className="qty-stepper" style={{ background: 'var(--void)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ padding: '8px 16px' }}>−</button>
                      <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ padding: '8px 16px' }}>+</button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <button 
                        onClick={() => { toggleItem(item.product); removeItem(item.product.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <i className="ti ti-heart"></i> Save
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={() => removeItem(item.product.id)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--void)', border: '1px solid var(--border)', width: '32px', height: '32px', borderRadius: '50%', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✕</button>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="cart-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '100px' }}>
            
            {/* Coupon Section */}
            <div style={{ background: 'var(--surface2)', borderRadius: '24px', border: '1px solid var(--border)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--cream)', marginBottom: '16px', fontWeight: 300 }}>Promo Code</div>
              <CouponInput />
            </div>

            {/* Summary Section */}
            <div style={{ background: 'var(--surface2)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--cream)', fontWeight: 300 }}>Order Summary</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{itemCount()} item{itemCount() !== 1 ? 's' : ''}</span>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
                  {appliedCoupon && (
                    <SummaryRow 
                      label={`Promo: ${appliedCoupon.code}`} 
                      value={appliedCoupon.freeShipping ? 'Free Shipping' : `- ${formatPrice(appliedCoupon.discountAmount)}`} 
                      highlight 
                    />
                  )}
                  <SummaryRow label="GST (18%)" value={formatPrice(gst)} />
                  <SummaryRow 
                    label="Shipping" 
                    value={appliedCoupon?.freeShipping ? 'Free' : (shipping === null ? 'At next step' : (shipping === 0 ? 'Complimentary' : formatPrice(shipping)))} 
                    highlight={appliedCoupon?.freeShipping || shipping === 0}
                    muted={shipping === null && !appliedCoupon?.freeShipping}
                  />
                  <SummaryRow label="Installation" value="Free" highlight />
                </div>

                <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: '#E2C97A' }}>{formatPrice(grandTotal)}</div>
                </div>

                <button onClick={() => router.push('/checkout')} style={{ width: '100%', background: 'var(--gold)', color: '#0A0905', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <i className="ti ti-lock"></i> SECURE CHECKOUT
                </button>
              </div>
            </div>

            {/* Trust Badge */}
            <div style={{ background: 'rgba(76,175,122,0.08)', border: '1px solid rgba(76,175,122,0.2)', borderRadius: '20px', padding: '16px 20px', display: 'flex', gap: '12px' }}>
              <i className="ti ti-shield-check" style={{ color: 'var(--green)', fontSize: '20px' }}></i>
              <div style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>Authenticity Guaranteed</span> — Every piece is inspected for quality and securely packaged for transit.
              </div>
            </div>

            {/* Pincode Tool */}
            <div style={{ padding: '0 8px' }}>
              <PincodeEstimator 
                pincode={pincode} 
                setPincode={setPincode} 
                checking={checkingPincode} 
                result={shippingRes} 
                onCheck={handleCheckPincode} 
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 991px) {
          .cart-grid { grid-template-columns: 1fr; }
          .cart-item-card { gap: 16px; padding: 16px; }
          .qty-stepper button { padding: 6px 12px; }
        }
      `}</style>
    </div>
  );
}

function SummaryRow({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: highlight ? 'var(--gold)' : (muted ? 'var(--text-dim)' : 'var(--cream)'), fontWeight: highlight ? 600 : 400 }}>{value}</span>
    </div>
  );
}

function PincodeEstimator({ pincode, setPincode, checking, result, onCheck }: any) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button onClick={() => setShow(!show)} style={{ width: '100%', background: 'none', border: 'none', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <span style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Estimate Delivery</span>
        <i className={`ti ${show ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ color: 'var(--text-dim)' }}></i>
      </button>
      {show && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              value={pincode} 
              onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter Pincode" 
              maxLength={6}
              style={{ flex: 1, background: 'var(--void)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--cream)', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={() => onCheck(pincode)} disabled={checking || pincode.length !== 6} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0 16px', color: 'var(--text)', fontSize: '11px', textTransform: 'uppercase' }}>
              {checking ? '...' : 'Check'}
            </button>
          </div>
          {result?.success && (
            <div style={{ fontSize: '12px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-truck"></i>
              Arriving by {result.etd} to {result.city}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

