'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import CartDrawer from './CartDrawer';
import SearchModal from './SearchModal';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/utils';

export default function NavClient({ user, products }: { user: { id: string; email?: string } | null, products: Product[] }) {
  const { itemCount, openCart } = useCartStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const count = itemCount();

  return (
    <>
      <div className="nav-right">
        <button className="nav-icon" title="Search" onClick={() => setSearchOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        {user ? (
          <Link href="/account" className="nav-icon hide-on-mobile" title="Account">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
        ) : (
          <Link href="/login" className="hide-on-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Sign In
          </Link>
        )}

        <button className="nav-icon" title={`Cart (${count})`} onClick={openCart} style={{ position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {count > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--gold)', color: 'var(--obsidian)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {count}
            </span>
          )}
        </button>
      </div>

      <CartDrawer />
      {searchOpen && <SearchModal products={products} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
