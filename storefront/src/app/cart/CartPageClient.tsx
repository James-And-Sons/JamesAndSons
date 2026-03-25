'use client';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function CartPageClient() {
  const { items, removeItem, updateQty, total } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ minHeight: '50vh' }} />;

  const subtotal = total();
  const gst = subtotal * 0.05;
  const shipping = subtotal > 50000 ? 0 : 2500;
  const grandTotal = subtotal + gst + shipping;

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {items.map(item => (
            <div key={item.product.id} className="cart-item-grid" style={{ alignItems: 'center', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
              {/* Product Info */}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <Link href={`/products/${item.product.slug}`} style={{ width: '100px', height: '125px', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>
                  <svg width="60" height="75" viewBox="0 0 100 120" stroke="var(--gold)" fill="none" style={{ opacity: 0.6 }}>
                    <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3"/>
                    <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7"/>
                    <circle cx="50" cy="95" r="4" fill="var(--gold-light)" stroke="none"/>
                  </svg>
                </Link>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.product.collection}</div>
                  <Link href={`/products/${item.product.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.2, marginBottom: '12px' }}>{item.product.name}</div>
                  </Link>
                  <button onClick={() => removeItem(item.product.id)} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                    Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--text)' }}>
                {formatPrice(item.product.d2cPrice)}
              </div>

              {/* Quantity */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', width: '32px', textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>+</button>
              </div>

              {/* Total */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--gold-light)', textAlign: 'right' }}>
                {formatPrice(item.product.d2cPrice * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px', position: 'sticky', top: '96px' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, color: 'var(--cream)', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>Order Summary</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            <span>Subtotal</span><span style={{ color: 'var(--text)' }}>{formatPrice(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            <span>Estimated GST (18%)</span><span style={{ color: 'var(--text)' }}>{formatPrice(gst)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            <span>Shipping</span><span style={{ color: shipping === 0 ? 'var(--green)' : 'var(--text)' }}>{shipping === 0 ? 'Complimentary' : formatPrice(shipping)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '20px', borderTop: '1px solid var(--border)', marginBottom: '32px' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, color: 'var(--cream)' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, color: 'var(--gold)' }}>{formatPrice(grandTotal)}</span>
        </div>

        <Link href="/checkout" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', textDecoration: 'none', letterSpacing: '0.15em', width: '100%', marginBottom: '16px' }}>
          Proceed to Checkout
        </Link>
        <Link href="/collections" className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', textDecoration: 'none', letterSpacing: '0.15em', width: '100%' }}>
          Continue Shopping
        </Link>
      </div>

    </div>
  );
}
