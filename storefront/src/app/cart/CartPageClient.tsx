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

      {/* Items List */}
      <div>
        <div className="cart-headers" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '32px' }}>
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

        <div className="cart-items-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          {items.map(item => (
            <div key={item.product.id} className="cart-mobile-card" style={{ padding: '24px', gap: '20px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: '320px' }}>
              <Link href={`/products/${item.product.slug}`} className="cart-card-image" style={{ width: '160px', height: '200px' }}>
                {item.product.images?.[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} width={160} height={200} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="60" height="80" viewBox="0 0 100 120" stroke="var(--gold)" fill="none">
                    <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7" />
                    <circle cx="50" cy="95" r="4" fill="var(--gold-light)" stroke="none" />
                  </svg>
                )}
              </Link>
              <div className="cart-card-info" style={{ gap: '8px', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <span className="cart-card-coll" style={{ fontSize: '11px' }}>{item.product.collection}</span>
                  <Link href={`/products/${item.product.slug}`} className="cart-card-name" style={{ fontSize: '20px', fontWeight: 400 }}>{item.product.name}</Link>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <button 
                    onClick={() => { 
                      if (window.confirm("Move this item to your wishlist? It will be removed from your bag.")) {
                        toggleItem(item.product); 
                        removeItem(item.product.id); 
                      }
                    }} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(201,168,76,0.1)', 
                      border: '0.5px solid rgba(201,168,76,0.3)', 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      color: 'var(--gold)', 
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    <i className="ti ti-heart" style={{ fontSize: '14px' }}></i>
                    {isInWishlist(item.product.id) ? 'Already in Wishlist' : 'Move to Wishlist'}
                  </button>
                </div>

                <div className="cart-card-footer" style={{ width: '100%', justifyContent: 'center', gap: '20px' }}>
                  <div className="qty-stepper" style={{ transform: 'scale(1.1)' }}>
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-card-price" style={{ fontSize: '22px' }}>{formatPrice(item.product.d2cPrice * item.quantity)}</div>
                </div>
                
                <button onClick={() => removeItem(item.product.id)} style={{ marginTop: '16px', color: 'var(--text-dim)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none' }}>Remove Item</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="cart-summary-container">
        <div className="bg-[var(--surface)] p-8 border-t-[4px] border-t-[var(--gold)] border-[var(--border)] shadow-2xl sticky top-32">
          <h3 className="font-serif text-[24px] text-[var(--cream)] mb-6 font-light">Order Summary</h3>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-baseline border-b border-dashed border-[var(--border)] pb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Subtotal</span>
              <span className="font-serif text-[18px] text-[var(--cream)]">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-dashed border-[var(--border)] pb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Estimated GST</span>
              <span className="font-serif text-[18px] text-[var(--cream)]">{formatPrice(gst)}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-dashed border-[var(--border)] pb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Shipping</span>
              <span className={`font-serif text-[18px] ${shipping === 0 ? 'text-[var(--gold)]' : 'text-[var(--cream)]'}`}>
                {shipping === 0 ? (isShippingCalculated || subtotal > 50000 ? 'Complimentary' : 'Calculated at next step') : (shipping === null ? 'Calculated at next step' : formatPrice(shipping))}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8 bg-[var(--obsidian)] p-4 border border-[var(--border)]">
            <span className="font-mono text-[14px] uppercase tracking-widest text-[var(--gold)]">Total</span>
            <span className="font-serif text-[32px] text-[var(--gold-light)]">{formatPrice(subtotal + gst + (shipping ?? 0))}</span>
          </div>

          <button onClick={handleCheckout} className="btn-primary w-full py-3 text-[11px] tracking-[0.2em] hover:bg-[var(--gold-light)] transition-all group relative overflow-hidden flex items-center justify-center gap-2">
            <i className="ti ti-lock" style={{ fontSize: '14px' }}></i>
            <span className="relative z-10">Secure Checkout</span>
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
              <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease' }}>
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
                    style={{ flex: 1, background: 'var(--obsidian)', border: '1px solid var(--border)', color: 'var(--cream)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }}
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
                      opacity: pincode.length === 6 ? 1 : 0.5
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
          
          {/* Trust Badge */}
          <div className="mt-8 text-center border border-[var(--border)] p-4 bg-[var(--obsidian)]">
            <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--gold)] mb-2">Authenticity Guaranteed</div>
            <p className="font-body text-[11px] text-[var(--text-dim)]">Every piece is inspected for quality and securely packaged for transit.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
