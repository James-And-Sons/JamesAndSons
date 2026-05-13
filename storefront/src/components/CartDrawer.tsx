'use client';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWishlistStore } from '@/store/wishlist';
import CouponInput from '@/components/CouponInput';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total, itemCount, appliedCoupon, discountedTotal } = useCartStore();
  const { toggleItem } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const currentItems = mounted ? items : [];
  const currentCount = mounted ? itemCount() : 0;
  const cartTotal = mounted ? total() : 0;
  const finalTotal = mounted ? discountedTotal() : 0;
  const gst = finalTotal * 0.18;

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{`
        .cart-drawer-content::-webkit-scrollbar { width: 3px; }
        .cart-drawer-content::-webkit-scrollbar-track { background: var(--bg); }
        .cart-drawer-content::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 10px; }
        
        .cart-item-card {
          background: #181510;
          border-radius: 20px;
          border: 0.5px solid rgba(255,255,255,0.06);
          padding: 14px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          position: relative;
          margin-bottom: 12px;
          transition: border-color 0.3s ease;
        }
        .cart-item-card:hover { border-color: rgba(201,168,76,0.3); }
        
        .summary-card {
          background: #181510;
          border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 20px;
        }
        
        .qty-control-btn {
          width: 30px; height: 30px;
          display: flex; alignItems: center; justifyContent: center;
          background: transparent; border: none;
          color: #7A7060; cursor: pointer; font-size: 16px;
        }
      `}</style>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9998,
            backdropFilter: 'blur(8px)',
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '420px',
          maxWidth: '100vw',
          background: '#0A0905',
          borderLeft: '1px solid rgba(201,168,76,0.1)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 50px rgba(0,0,0,0.8)',
          visibility: isOpen ? 'visible' : 'hidden',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, visibility 0.3s ease',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '10px', color: '#C9A84C', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>Your Selection</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 400, color: '#F0E8D5', margin: 0 }}>
              Shopping <em style={{ color: '#E2C97A', fontStyle: 'italic' }}>Bag</em>
            </h2>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{ 
              width: '40px', height: '40px', borderRadius: '50%', background: '#141209', border: '0.5px solid rgba(201,168,76,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F0E8D5', cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.1)'; e.currentTarget.style.color = '#F0E8D5'; }}
          >
            <i className="ti ti-x" style={{ fontSize: '20px' }}></i>
          </button>
        </div>

        {currentCount > 0 && (
          <div style={{ padding: '0 24px 12px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#141209', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#7A7060', letterSpacing: '0.04em' }}>
              <i className="ti ti-package" style={{ fontSize: '13px', color: '#C9A84C' }}></i>
              {currentCount} {currentCount === 1 ? 'item' : 'items'} · Free installation included
            </div>
          </div>
        )}

        {/* Scrollable Items Area */}
        <div className="cart-drawer-content" style={{ flex: 1, overflowY: 'auto', padding: '12px 24px', background: '#0A0905' }}>
          {currentItems.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '80px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(201,168,76,0.05)', border: '0.5px dashed rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#C9A84C' }}>
                <i className="ti ti-shopping-bag" style={{ fontSize: '28px', opacity: 0.5 }}></i>
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#F0E8D5', marginBottom: '8px' }}>Your bag is empty</div>
              <p style={{ fontSize: '13px', color: '#7A7060', marginBottom: '32px', lineHeight: 1.6, maxWidth: '240px', margin: '0 auto 32px' }}>Curate your space with our heritage collection.</p>
              <Link href="/collections" onClick={closeCart} className="btn-outline" style={{ display: 'inline-block', padding: '12px 32px', textDecoration: 'none', borderRadius: '12px' }}>Browse Collections</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {currentItems.map((item, i) => (
                <div key={`${item.product.id}-${i}`} className="cart-item-card">
                  <Link href={`/products/${item.product.slug}`} onClick={closeCart} style={{ width: '80px', height: '100px', background: 'linear-gradient(140deg, #181410, #1e1a0f)', borderRadius: '14px', border: '0.5px solid rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="ti ti-lamp" style={{ fontSize: '28px', color: '#C9A84C', opacity: 0.3 }}></i>
                    )}
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '9px', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>{item.product.collection || 'Bespoke'}</div>
                    <Link href={`/products/${item.product.slug}`} onClick={closeCart} style={{ textDecoration: 'none' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 400, color: '#F0E8D5', lineHeight: 1.3, marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                    </Link>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: '#E2C97A', marginBottom: '12px' }}>{formatPrice(item.product.d2cPrice)}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#0A0905', border: '0.5px solid rgba(201,168,76,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                        <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="qty-control-btn">−</button>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0E8D5', width: '24px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="qty-control-btn">+</button>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                         <button 
                          onClick={() => { toggleItem(item.product); removeItem(item.product.id); }}
                          style={{ background: 'none', border: 'none', fontSize: '10px', color: '#C9A84C', letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <i className="ti ti-heart" style={{ fontSize: '12px' }}></i>
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} style={{ position: 'absolute', top: '12px', right: '12px', width: '26px', height: '26px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#3A3528', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#F0E8D5'} onMouseLeave={e => e.currentTarget.style.color = '#3A3528'}>✕</button>
                </div>
              ))}

              {/* Coupon Input */}
              <div style={{ margin: '12px 0 0' }}>
                <CouponInput />
              </div>

              {/* Order Summary Card */}
              <div className="summary-card">
                <div style={{ padding: '14px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 400, color: '#F0E8D5' }}>Order Summary</div>
                  <div style={{ fontSize: '10px', color: '#7A7060', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{currentCount} item{currentCount !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ padding: '4px 0' }}>
                  <SummaryRow label="Subtotal" value={formatPrice(cartTotal)} />
                  {appliedCoupon && (
                    <SummaryRow
                      label={`Promo: ${appliedCoupon.code}`}
                      value={appliedCoupon.freeShipping ? 'Free Shipping' : `- ${formatPrice(appliedCoupon.discountAmount)}`}
                      highlight
                    />
                  )}
                  <SummaryRow label="GST (18%)" value={formatPrice(gst)} />
                  <SummaryRow label="Shipping" value={appliedCoupon?.freeShipping ? 'Free' : 'At next step'} muted={!appliedCoupon?.freeShipping} highlight={!!appliedCoupon?.freeShipping} />
                  <SummaryRow label="Installation" value="Free" highlight />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', margin: '0 8px 8px', background: 'rgba(201,168,76,0.07)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#E2C97A' }}>{formatPrice(finalTotal + gst)}</div>
                </div>
              </div>

              {/* Trust Badge */}
              <div style={{ marginTop: '16px', background: 'rgba(76,175,122,0.12)', border: '0.5px solid rgba(76,175,122,0.2)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="ti ti-shield-check" style={{ fontSize: '20px', color: '#4CAF7A' }}></i>
                <div style={{ fontSize: '11px', color: '#F0E8D5', lineHeight: 1.5 }}>
                  <span style={{ color: '#4CAF7A', fontWeight: 500 }}>Authenticity Guaranteed</span> — Every piece is inspected for quality and securely packaged for transit.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {currentItems.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', padding: '20px 24px 32px', background: '#0A0905', flexShrink: 0 }}>
            <Link href="/checkout" onClick={closeCart} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', borderRadius: '16px', textDecoration: 'none', background: '#C9A84C', color: '#0A0905', fontSize: '13px', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '10px' }}>
              <i className="ti ti-lock" style={{ fontSize: '15px' }}></i>
              Secure Checkout
            </Link>
            <button onClick={closeCart} style={{ width: '100%', background: 'transparent', color: '#7A7060', border: '0.5px solid rgba(201,168,76,0.1)', borderRadius: '16px', padding: '14px', fontSize: '12px', cursor: 'pointer', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <i className="ti ti-arrow-left" style={{ fontSize: '14px' }}></i>
              Continue Shopping
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
              <TrustItem icon="ti-tools" label="Free Install" />
              <TrustItem icon="ti-receipt" label="GST Invoice" />
              <TrustItem icon="ti-shield" label="2-Yr Warranty" />
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

function SummaryRow({ label, value, muted, highlight }: { label: string; value: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderTop: label !== 'Subtotal' ? '0.5px dashed rgba(255,255,255,0.04)' : 'none' }}>
      <div style={{ fontSize: '12px', color: '#7A7060', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ 
        fontSize: muted ? '11px' : '12px', 
        color: highlight ? '#4CAF7A' : (muted ? '#7A7060' : '#F0E8D5'),
        fontWeight: 500,
        fontStyle: muted ? 'italic' : 'normal',
        display: highlight ? 'flex' : 'block',
        alignItems: 'center',
        gap: '4px'
      }}>
        {highlight && <i className="ti ti-check" style={{ fontSize: '12px' }}></i>}
        {value}
      </div>
    </div>
  );
}

function TrustItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#3A3528', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      <i className={`ti ${icon}`} style={{ fontSize: '12px', color: '#C9A84C', opacity: 0.6 }}></i>
      {label}
    </div>
  );
}
