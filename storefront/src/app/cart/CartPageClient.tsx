'use client';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useWishlistStore } from '@/store/wishlist';
import { useRouter } from 'next/navigation';
import { checkPincode, getSavedPincode } from '@/app/products/actions';
import Image from 'next/image';

export default function CartPageClient() {
  const router = useRouter();
  const { items, removeItem, updateQty, total } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [mounted, setMounted] = useState(false);
  const [pincode, setPincode] = useState('');
  const [shippingRes, setShippingRes] = useState<any>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [showPincode, setShowPincode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadPincode = async () => {
      const saved = await getSavedPincode();
      if (saved) {
        setPincode(saved);
        // We'll trigger the check once weight is calculated
      }
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
  }, [mounted, pincode.length]); // Re-check if pincode is prefilled

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (!mounted) return <div style={{ minHeight: '50vh' }} />;

  const subtotal = total();
  const gst = subtotal * 0.05;
  const isShippingCalculated = !!shippingRes?.success;
  const shipping = isShippingCalculated ? shippingRes.rate : (subtotal > 50000 ? 0 : null);
  const grandTotal = subtotal + gst + (shipping || 0);

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(40px, 8vw, 80px) clamp(20px, 4vw, 40px)', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface)', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-gold)' }}>
          <span style={{ fontSize: '32px', color: 'var(--gold)' }}>🛍</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)', marginBottom: '16px' }}>Your bag is empty</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '400px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          Curate your perfect space with masterworks from our Heritage and Modern lighting collections.
        </p>
        <Link href="/collections" className="btn-primary" style={{ display: 'inline-block', padding: '16px 40px', textDecoration: 'none', letterSpacing: '0.15em' }}>
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      {/* Mobile Title Area */}
      <div className="md:hidden" style={{ padding: '0 0 32px' }}>
        <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>Your Selection</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 400, color: 'var(--cream)', margin: 0 }}>
          Shopping <em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>Bag</em>
        </h2>
        <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <i className="ti ti-package" style={{ fontSize: '13px', color: 'var(--gold)' }}></i>
          {items.length} item{items.length !== 1 ? 's' : ''} · Free installation included
        </div>
      </div>

      {/* Items List */}
      <div>
        <div className="cart-headers hidden md:block" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '32px' }}>
          <div className="cart-item-grid">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Product</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Price</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Quantity</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Total</span>
          </div>
        </div>

        <div className="cart-items-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {items.map(item => (
            <div key={item.product.id} className="cart-item-row" style={{ display: 'grid', gridTemplateColumns: '140px 1.5fr 1fr 1fr 100px', gap: '32px', alignItems: 'center', padding: '32px', background: 'var(--surface2)', borderRadius: '24px', border: '1px solid var(--border)', transition: 'transform 0.3s ease' }}>
              {/* Image */}
              <Link href={`/products/${item.product.slug}`} style={{ width: '140px', height: '175px', background: 'var(--void)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', display: 'block' }}>
                {item.product.images?.[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} width={140} height={175} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-lamp" style={{ fontSize: '32px', color: 'var(--gold)', opacity: 0.3 }}></i>
                  </div>
                )}
              </Link>

              {/* Product Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{item.product.collection}</div>
                <Link href={`/products/${item.product.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--cream)', lineHeight: 1.2 }}>{item.product.name}</div>
                </Link>
                <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                  <button onClick={() => removeItem(item.product.id)} style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>Remove</button>
                  <button 
                    onClick={() => { toggleItem(item.product); removeItem(item.product.id); }} 
                    style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--gold)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'opacity 0.2s' }}
                  >
                    Move to Wishlist
                  </button>
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Unit Price</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text)' }}>{formatPrice(item.product.d2cPrice)}</div>
              </div>

              {/* Quantity */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quantity</div>
                <div className="qty-stepper" style={{ border: '1px solid var(--border)', background: 'var(--void)' }}>
                  <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ padding: '0 15px' }}>−</button>
                  <span style={{ minWidth: '30px' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ padding: '0 15px' }}>+</button>
                </div>
              </div>

              {/* Subtotal */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '8px' }}>Subtotal</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--gold-light)' }}>{formatPrice(item.product.d2cPrice * item.quantity)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-items-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map(item => (
            <div key={item.product.id} style={{ background: 'var(--surface2)', borderRadius: '20px', border: '0.5px solid var(--border)', padding: '16px', display: 'flex', gap: '16px', position: 'relative' }}>
              <Link href={`/products/${item.product.slug}`} style={{ width: '80px', height: '100px', background: 'var(--void)', borderRadius: '14px', overflow: 'hidden', border: '0.5px solid var(--border)', flexShrink: 0 }}>
                {item.product.images?.[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} width={80} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-lamp" style={{ fontSize: '24px', color: 'var(--gold)', opacity: 0.3 }}></i>
                  </div>
                )}
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>{item.product.collection}</div>
                <Link href={`/products/${item.product.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--cream)', lineHeight: 1.2, marginBottom: '6px' }}>{item.product.name}</div>
                </Link>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--gold-light)', marginBottom: '12px' }}>{formatPrice(item.product.d2cPrice)}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="qty-stepper" style={{ background: 'var(--void)', height: '32px' }}>
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ width: '32px' }}>−</button>
                    <span style={{ minWidth: '24px' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ width: '32px' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => { toggleItem(item.product); removeItem(item.product.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <i className="ti ti-heart"></i>
                      Save
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => removeItem(item.product.id)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '14px', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="cart-summary-container">
        <div style={{ background: 'var(--surface2)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' }} className="sticky top-32">
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--cream)', margin: 0, fontWeight: 300 }}>Order Summary</h3>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
          </div>

          <div style={{ padding: '24px' }}>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline border-b border-dashed border-[var(--border)] pb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Subtotal</span>
                <span className="font-serif text-[18px] text-[var(--cream)]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dashed border-[var(--border)] pb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">GST (18%)</span>
                <span className="font-serif text-[18px] text-[var(--cream)]">{formatPrice(subtotal * 0.18)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dashed border-[var(--border)] pb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Shipping</span>
                <span className={`font-serif text-[18px] ${shipping === 0 ? 'text-[var(--gold)]' : 'text-[var(--cream)]'}`}>
                  {shipping === 0 ? (isShippingCalculated || subtotal > 50000 ? 'Complimentary' : 'Calculated at next step') : (shipping === null ? 'Calculated at next step' : formatPrice(shipping))}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dashed border-[var(--border)] pb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Installation</span>
                <span className="font-serif text-[14px] text-[var(--green)] flex items-center gap-1">
                  <i className="ti ti-check"></i>
                  Free
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8 bg-[var(--void)] p-4 border border-[var(--border)] rounded-xl">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[var(--gold)]">Total</span>
              <span className="font-serif text-[32px] text-[var(--gold-light)]">{formatPrice(subtotal + (subtotal * 0.18) + (shipping ?? 0))}</span>
            </div>

            <button onClick={handleCheckout} className="btn-primary w-full py-4 text-[11px] tracking-[0.2em] rounded-xl flex items-center justify-center gap-2">
              <i className="ti ti-lock" style={{ fontSize: '14px' }}></i>
              Secure Checkout
            </button>

            {/* Pincode Estimator */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button 
                onClick={() => setShowPincode(!showPincode)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 0' }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                  Estimate Shipping & Delivery
                </div>
                <i className={`ti ${showPincode ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ color: 'var(--gold-light)', fontSize: '14px' }}></i>
              </button>
              
              {showPincode && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      placeholder="Enter Pincode" 
                      maxLength={6} 
                      value={pincode}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPincode(val);
                        if (val.length === 6) handleCheckPincode(val);
                        else setShippingRes(null);
                      }}
                      style={{ flex: 1, background: 'var(--void)', border: '1px solid var(--border)', color: 'var(--cream)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none', borderRadius: '8px' }}
                    />
                    <button 
                      onClick={() => handleCheckPincode(pincode)}
                      disabled={pincode.length !== 6 || checkingPincode}
                      style={{ 
                        background: 'transparent', 
                        border: '1px solid var(--border)', 
                        color: 'var(--text)', 
                        padding: '0 15px', 
                        fontSize: '11px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em',
                        cursor: pincode.length === 6 ? 'pointer' : 'not-allowed',
                        opacity: pincode.length === 6 ? 1 : 0.5,
                        borderRadius: '8px'
                      }}
                    >
                      {checkingPincode ? '...' : 'Check'}
                    </button>
                  </div>
                  
                  {shippingRes && (
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        <span>✓</span>
                        <span>Deliver to {shippingRes.city}</span>
                      </div>
                      <div style={{ marginTop: '4px', fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--cream)' }}>
                        Arriving by <span style={{ color: 'var(--gold-light)' }}>{shippingRes.etd}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Trust Badges */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(76,175,122,0.1)', padding: '12px', borderRadius: '12px', border: '0.5px solid rgba(76,175,122,0.2)' }}>
                <i className="ti ti-shield-check" style={{ color: 'var(--green)', fontSize: '18px' }}></i>
                <div style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 500 }}>Authenticity Guaranteed</span> — Inspected and secured for transit.
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', opacity: 0.6 }}>
                <TrustBadge icon="ti-tools" label="Free Install" />
                <TrustBadge icon="ti-receipt" label="GST Invoice" />
                <TrustBadge icon="ti-shield" label="2-Yr Warranty" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <i className={`ti ${icon}`} style={{ color: 'var(--gold)', fontSize: '12px' }}></i>
      {label}
    </div>
  );
}
