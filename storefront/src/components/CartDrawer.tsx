'use client';

import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWishlistStore } from '@/store/wishlist';
import CouponInput from '@/components/CouponInput';
import Image from 'next/image';

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

  if (!mounted) return null;

  const currentItems = items;
  const currentCount = itemCount();
  const cartTotal = total();
  const finalSubtotal = discountedTotal();
  const gst = finalSubtotal * 0.18;
  const grandTotal = finalSubtotal + gst;

  return createPortal(
    <>
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
        <div style={{ padding: '24px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
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
              width: '40px', height: '40px', borderRadius: '50%', background: 'var(--void)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F0E8D5', cursor: 'pointer' 
            }}
          >
            <i className="ti ti-x" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Scrollable Items Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#0A0905' }}>
          {currentItems.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '80px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(201,168,76,0.05)', border: '0.5px dashed rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#C9A84C' }}>
                <i className="ti ti-shopping-bag" style={{ fontSize: '28px', opacity: 0.5 }}></i>
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#F0E8D5', marginBottom: '8px' }}>Your bag is empty</div>
              <p style={{ fontSize: '13px', color: '#7A7060', marginBottom: '32px' }}>Curate your space with our masterworks.</p>
              <button onClick={closeCart} style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', borderBottom: '1px solid #C9A84C' }}>Browse Collections</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentItems.map((item) => (
                <div key={item.product.id} style={{ background: 'var(--surface2)', borderRadius: '20px', border: '0.5px solid var(--border)', padding: '14px', display: 'flex', gap: '16px', position: 'relative' }}>
                  <div style={{ width: '80px', height: '100px', background: 'var(--void)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={item.product.images?.[0] || '/placeholder.jpg'} alt={item.product.name} width={80} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>{item.product.collection}</div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: '#F0E8D5', margin: '0 0 4px', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</h3>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: '#E2C97A' }}>{formatPrice(item.product.d2cPrice)}</div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--void)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                        <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ padding: '4px 10px', background: 'none', border: 'none', color: '#7A7060', cursor: 'pointer' }}>−</button>
                        <span style={{ fontSize: '12px', color: '#F0E8D5', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ padding: '4px 10px', background: 'none', border: 'none', color: '#7A7060', cursor: 'pointer' }}>+</button>
                      </div>
                      <button 
                        onClick={() => { toggleItem(item.product); removeItem(item.product.id); }}
                        style={{ background: 'none', border: 'none', fontSize: '10px', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: '#3A3528', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {currentItems.length > 0 && (
          <div style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)', padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <CouponInput />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <span>Promo: {appliedCoupon.code}</span>
                  <span>{appliedCoupon.freeShipping ? 'Free Ship' : `- ${formatPrice(appliedCoupon.discountAmount)}`}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <span>GST (18%)</span>
                <span>{formatPrice(gst)}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#E2C97A' }}>{formatPrice(grandTotal)}</div>
            </div>

            <Link href="/checkout" onClick={closeCart} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#C9A84C', color: '#0A0905', borderRadius: '14px', padding: '16px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em' }}>
              SECURE CHECKOUT
            </Link>
            <Link href="/cart" onClick={closeCart} style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
              View Full Shopping Bag
            </Link>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
