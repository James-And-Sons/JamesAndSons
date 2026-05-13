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
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => { 
      document.documentElement.style.overflow = '';
      document.body.style.overflow = ''; 
    };
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
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9998,
            backdropFilter: 'blur(4px)',
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
          width: '400px',
          maxWidth: '100vw',
          background: '#0A0905',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          visibility: isOpen ? 'visible' : 'hidden',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div style={{ padding: '32px 32px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, color: 'var(--cream)', margin: 0 }}>
            Bag <span style={{ fontSize: '14px', color: 'var(--gold)', marginLeft: '8px', opacity: 0.8 }}>({currentCount})</span>
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{ 
              background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '8px'
            }}
          >
            <i className="ti ti-x" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Scrollable Items Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px', background: '#0A0905' }}>
          {currentItems.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '100px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>Your bag is currently empty.</p>
              <button onClick={closeCart} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', borderBottom: '1px solid var(--gold)' }}>Continue Curating</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {currentItems.map((item) => (
                <div key={item.product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px 0', display: 'flex', gap: '20px', position: 'relative' }}>
                  <div style={{ width: '70px', height: '90px', background: 'var(--void)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={item.product.images?.[0] || '/images/brand-placeholder.png'} alt={item.product.name} width={70} height={90} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--cream)', margin: '0 0 2px', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</h3>
                      <div style={{ fontSize: '13px', color: 'var(--gold-light)', opacity: 0.9 }}>{formatPrice(item.product.d2cPrice)}</div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ padding: '2px 8px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>−</button>
                          <span style={{ fontSize: '11px', color: 'var(--cream)', width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ padding: '2px 8px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                      <button 
                        onClick={() => { toggleItem(item.product); removeItem(item.product.id); }}
                        style={{ background: 'none', border: 'none', fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <i className="ti ti-heart"></i> Move to wishlist
                      </button>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {currentItems.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <CouponInput />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-dim)' }}>
                <span>Subtotal</span>
                <span style={{ color: 'var(--cream)' }}>{formatPrice(cartTotal)}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gold)' }}>
                  <span>Promo: {appliedCoupon.code}</span>
                  <span>{appliedCoupon.freeShipping ? 'Free' : `- ${formatPrice(appliedCoupon.discountAmount)}`}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-dim)' }}>
                <span>GST (18%)</span>
                <span style={{ color: 'var(--cream)' }}>{formatPrice(gst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--cream)', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link 
                href="/cart" 
                onClick={closeCart} 
                style={{ 
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '8px', 
                  height: '52px', textDecoration: 'none', fontSize: '11px', fontWeight: 600, 
                  letterSpacing: '0.12em', transition: 'all 0.2s' 
                }}
              >
                VIEW CART
              </Link>
              <Link 
                href="/checkout" 
                onClick={closeCart} 
                style={{ 
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  background: 'var(--gold)', color: '#0A0905', borderRadius: '8px', 
                  height: '52px', textDecoration: 'none', fontSize: '11px', fontWeight: 600, 
                  letterSpacing: '0.12em', transition: 'all 0.2s' 
                }}
              >
                CHECKOUT
              </Link>
            </div>

          </div>
        )}
      </div>
    </>,
    document.body
  );
}
