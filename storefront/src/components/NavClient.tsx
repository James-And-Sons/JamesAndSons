'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import CartDrawer from './CartDrawer';
import SearchModal from './SearchModal';
import { usePathname, useRouter } from 'next/navigation';
import { Product, triggerHaptic } from '@/lib/utils';

export default function NavClient({ user, products }: { user: { id: string; email?: string } | null, products: Product[] }) {
  const { itemCount, openCart } = useCartStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const items = useCartStore(state => state.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    setMounted(true);
    
    // Listen for custom event from MobileBottomNav
    const handleOpenSearch = () => setSearchOpen(true);
    const handleOpenCart = () => openCart();
    window.addEventListener('open-search', handleOpenSearch);
    window.addEventListener('open-cart', handleOpenCart);
    return () => {
      window.removeEventListener('open-search', handleOpenSearch);
      window.removeEventListener('open-cart', handleOpenCart);
    };
  }, []);

  const isPDP = pathname.startsWith('/products/');

  const handleCartClick = () => {
    triggerHaptic();
    if (isPDP) {
      router.push('/cart');
    } else {
      openCart();
    }
  };

  return (
    <>
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="nav-icon hide-on-mobile nav-haptic"
          title="Search"
          onClick={() => {
            triggerHaptic();
            setSearchOpen(true);
          }}
          onMouseEnter={triggerHaptic}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '6px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        {user ? (
          <Link
            href="/account"
            className="nav-icon hide-on-mobile nav-haptic"
            title="Account"
            onMouseEnter={triggerHaptic}
            style={{ color: 'var(--text)', padding: '6px', display: 'flex', alignItems: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
        ) : (
          <Link
            href="/login"
            className="hide-on-mobile nav-haptic"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-sm)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', textDecoration: 'none' }}
            onMouseEnter={e => {
              triggerHaptic();
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Sign In
          </Link>
        )}

        <button
          className="nav-icon nav-haptic"
          title={mounted ? `Cart (${count})` : 'Cart'}
          onClick={handleCartClick}
          onMouseEnter={triggerHaptic}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '6px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {mounted && count > 0 && (
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--gold)', color: 'var(--obsidian)', width: '16px', height: '16px', borderRadius: '50%', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
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
