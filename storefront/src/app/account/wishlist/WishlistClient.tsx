'use client';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function WishlistClient() {
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="animate-pulse bg-[var(--surface)] h-[400px] rounded" />;

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(196,160,90,0.1)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
          ♥
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--cream)', marginBottom: '16px', fontWeight: 300 }}>Your wishlist is empty</div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '400px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          Save pieces you love to revisit or share with your interior designer.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/collections" className="btn-primary" style={{ padding: '14px 40px', textDecoration: 'none', letterSpacing: '0.1em' }}>Explore Collections</Link>
          <Link href="/account" className="btn-outline" style={{ padding: '14px 40px', textDecoration: 'none', letterSpacing: '0.1em' }}>Back to Account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((product) => (
        <div key={product.id} className="bg-[var(--surface)] border border-[var(--border)] overflow-hidden group">
          <Link href={`/products/${product.slug}`} className="block relative aspect-[4/5] bg-[var(--surface2)]">
            {product.images?.[0] ? (
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-30">
                <svg width="60" height="75" viewBox="0 0 100 120" stroke="var(--gold)" fill="none">
                  <path d="M20 70 Q50 30 80 70" strokeWidth="2" />
                  <circle cx="50" cy="95" r="4" fill="var(--gold-light)" stroke="none" />
                </svg>
              </div>
            )}
            <button 
              onClick={(e) => { e.preventDefault(); removeItem(product.id); }}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
              title="Remove from Wishlist"
            >
              ✕
            </button>
          </Link>
          
          <div className="p-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--gold)] mb-2">{product.collection}</div>
            <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
              <h3 className="font-serif text-[20px] text-[var(--cream)] mb-4 font-light group-hover:text-white transition-colors">{product.name}</h3>
            </Link>
            <div className="flex justify-between items-center mb-6">
              <span className="font-mono text-[16px] text-[var(--gold-light)]">{formatPrice(product.d2cPrice)}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { addItem(product); removeItem(product.id); }}
                className="btn-primary w-full py-3 text-[11px] flex items-center justify-center gap-2"
              >
                <span>Move to Bag</span>
                <span className="opacity-50">→</span>
              </button>
              <button 
                onClick={() => removeItem(product.id)}
                className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-[var(--gold)] transition-colors text-center py-2"
              >
                Discard Piece
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
