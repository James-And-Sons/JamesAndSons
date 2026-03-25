'use client';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useEffect } from 'react';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, total, itemCount } = useCartStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  const cartTotal = total();

  return (
    <>
      {isOpen && (
        <div
          onClick={closeCart}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(4px)' }}
        />
      )}

      <div className="cart-drawer-mobile" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '380px', maxWidth: '100vw', height: '100vh',
        background: 'var(--obsidian)',
        borderLeft: '1px solid var(--border)',
        zIndex: 201,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.5)'
      }}>

        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, color: 'var(--cream)', letterSpacing: '0.02em', margin: 0 }}>
            Mini Bag {itemCount() > 0 && <span style={{ color: 'var(--gold)' }}>({itemCount()})</span>}
          </h2>
          <button onClick={closeCart} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', transition: 'color 0.2s', padding: '4px' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--void)' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '40px' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--text-muted)', marginBottom: '12px' }}>Your bag is empty</div>
              <Link href="/collections" onClick={closeCart} className="btn-outline" style={{ display: 'inline-block', padding: '10px 24px', textDecoration: 'none' }}>Explore</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map((item, i) => (
                <div key={`${item.product.id}-${i}`} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: i < items.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                  <Link href={`/products/${item.product.slug}`} onClick={closeCart} style={{ width: '72px', height: '90px', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>
                    <svg width="36" height="45" viewBox="0 0 100 120" stroke="var(--gold)" fill="none" style={{ opacity: 0.6 }}>
                      <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3" />
                      <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7" />
                      <circle cx="50" cy="95" r="4" fill="var(--gold-light)" stroke="none" />
                    </svg>
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Link href={`/products/${item.product.slug}`} onClick={closeCart} style={{ textDecoration: 'none', color: 'var(--cream)', flex: 1, paddingRight: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 300, lineHeight: 1.2, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qty: {item.quantity}</div>
                      </Link>
                      <button onClick={() => removeItem(item.product.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '14px', padding: '2px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>✕</button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--gold-light)', marginTop: '8px' }}>
                      {formatPrice(item.product.d2cPrice * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', background: 'var(--obsidian)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, color: 'var(--cream)' }}>{formatPrice(cartTotal)}</span>
            </div>

            <Link href="/cart" onClick={closeCart} className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '14px', textDecoration: 'none', letterSpacing: '0.15em', width: '100%', marginBottom: '12px' }}>
              View Shopping Bag
            </Link>
            <Link href="/checkout" onClick={closeCart} className="btn-outline" style={{ display: 'block', textAlign: 'center', padding: '14px', textDecoration: 'none', letterSpacing: '0.15em', width: '100%', border: 'none', background: 'var(--surface)', color: 'var(--text)' }}>
              Checkout Directly
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
