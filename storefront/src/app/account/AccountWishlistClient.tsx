'use client';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AccountWishlistClient() {
  const { items, removeItem } = useWishlistStore();
  const { addItem, openCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMoveToCart = (item: any) => {
    addItem(item);
    removeItem(item.id);
    openCart();
  };

  if (!mounted) return <div className="h-40 animate-pulse bg-[var(--surface2)]" />;

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 20px', textAlign: 'center', border: '1px dashed var(--border)' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1" style={{ opacity: 0.35, marginBottom: '20px' }}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--cream)', marginBottom: '10px' }}>Wishlist is empty</div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: 1.8, marginBottom: '24px' }}>
          Save pieces you love to revisit or share with your interior designer.
        </p>
        <Link href="/collections" className="btn-outline" style={{ display: 'inline-block', padding: '12px 32px', textDecoration: 'none' }}>
          Explore Designs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.slice(0, 3).map((item) => (
          <div key={item.id} className="group flex flex-col">
            <Link href={`/products/${item.slug}`} className="block flex-1">
              <div className="aspect-square bg-[var(--surface2)] border border-[var(--border)] overflow-hidden mb-2">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                     <svg width="30" height="40" viewBox="0 0 100 120" stroke="var(--gold)" fill="none">
                      <path d="M20 70 Q50 30 80 70" strokeWidth="2" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--gold)] truncate">{item.name}</div>
              <div className="font-body text-[13px] text-[var(--text-muted)] mb-3">{formatPrice(item.d2cPrice)}</div>
            </Link>
            <button 
              onClick={() => handleMoveToCart(item)}
              className="w-full py-2 border border-[var(--border)] font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--cream)] hover:bg-[var(--gold)] hover:text-black hover:border-[var(--gold)] transition-all duration-300"
            >
              Move to Cart
            </button>
          </div>
        ))}
      </div>
      {items.length > 3 && (
        <p className="font-mono text-[12px] text-[var(--text-dim)] uppercase tracking-widest">
          + {items.length - 3} more items in your wishlist
        </p>
      )}
      <Link href="/account/wishlist" className="btn-outline w-full text-center py-3 text-[13px] block mt-4">
        View Full Wishlist
      </Link>
    </div>
  );
}
