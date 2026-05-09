'use client';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useWishlistStore } from '@/store/wishlist';
import { useRouter } from 'next/navigation';

export default function CartPageClient() {
  const router = useRouter();
  const { items, removeItem, updateQty, total } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (!mounted) return <div style={{ minHeight: '50vh' }} />;

  const subtotal = total();
  const gst = subtotal * 0.05;
  const shipping = subtotal > 50000 ? 0 : 2500;
  const grandTotal = subtotal + gst + shipping;

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

        <div className="cart-items-desktop">
          {items.map(item => (
            <div key={item.product.id} className="cart-item-grid" style={{ alignItems: 'center', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
              {/* Product Info */}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <Link href={`/products/${item.product.slug}`} style={{ width: '100px', height: '125px', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>
                  <svg width="60" height="75" viewBox="0 0 100 120" stroke="var(--gold)" fill="none" style={{ opacity: 0.6 }}>
                    <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7" />
                    <circle cx="50" cy="95" r="4" fill="var(--gold-light)" stroke="none" />
                  </svg>
                </Link>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.product.collection}</div>
                  <Link href={`/products/${item.product.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.2, marginBottom: '12px' }}>{item.product.name}</div>
                  </Link>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                    <button onClick={() => removeItem(item.product.id)} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                      Remove
                    </button>
                    <button 
                      onClick={() => { toggleItem(item.product); removeItem(item.product.id); }} 
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', padding: 0 }}
                    >
                      {isInWishlist(item.product.id) ? 'Already in Wishlist' : 'Move to Wishlist'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--text)' }}>
                {formatPrice(item.product.d2cPrice)}
              </div>

              {/* Quantity */}
              <div className="qty-stepper">
                <button onClick={() => updateQty(item.product.id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.product.id, item.quantity + 1)}>+</button>
              </div>

              {/* Total */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--gold-light)', textAlign: 'right' }}>
                {formatPrice(item.product.d2cPrice * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="cart-items-mobile">
          {items.map(item => (
            <div key={item.product.id} className="cart-mobile-card">
              <Link href={`/products/${item.product.slug}`} className="cart-card-image">
                <svg width="40" height="50" viewBox="0 0 100 120" stroke="var(--gold)" fill="none">
                  <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7" />
                  <circle cx="50" cy="95" r="4" fill="var(--gold-light)" stroke="none" />
                </svg>
              </Link>
              <div className="cart-card-info">
                <div className="cart-card-header">
                  <span className="cart-card-coll">{item.product.collection}</span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      onClick={() => { toggleItem(item.product); removeItem(item.product.id); }} 
                      className="cart-card-remove" 
                      style={{ position: 'static', fontSize: '14px', color: 'var(--gold)' }}
                      title="Move to Wishlist"
                    >
                      ♥
                    </button>
                    <button onClick={() => removeItem(item.product.id)} className="cart-card-remove" style={{ position: 'static' }}>✕</button>
                  </div>
                </div>
                <Link href={`/products/${item.product.slug}`} className="cart-card-name">{item.product.name}</Link>
                <div className="cart-card-footer">
                  <div className="qty-stepper">
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-card-price">{formatPrice(item.product.d2cPrice * item.quantity)}</div>
                </div>
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
                {shipping === 0 ? 'Complimentary' : formatPrice(shipping)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8 bg-[var(--obsidian)] p-4 border border-[var(--border)]">
            <span className="font-mono text-[12px] uppercase tracking-widest text-[var(--gold)]">Total</span>
            <span className="font-serif text-[28px] text-[var(--gold-light)]">{formatPrice(subtotal + gst + shipping)}</span>
          </div>

          <button onClick={handleCheckout} className="btn-primary w-full py-4 text-[12px] tracking-[0.2em] hover:bg-[var(--gold-light)] transition-colors group relative overflow-hidden">
            <span className="relative z-10">Secure Checkout</span>
          </button>
          
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
