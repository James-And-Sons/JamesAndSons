import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import NavClient from './NavClient';
import { getProducts, getCategories, getSpaces } from '@/lib/products';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import NavDropdown from './NavDropdown';

export default async function Navigation() {
  const supabase = await createClient();
  let user = null;
  let products: any[] = [];
  let categories: { name: string; slug: string }[] = [];
  let spaces: { name: string; slug: string }[] = [];

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    products = await getProducts();
    const rawCats = await getCategories();
    categories = rawCats.map(c => ({ name: c.name, slug: c.slug }));
    const rawSpaces = await getSpaces();
    spaces = rawSpaces.map(s => ({ name: s.name, slug: s.slug }));
  } catch (error) {
    console.error('Error in Navigation data fetching:', error);
  }

  return (
    <>
      <nav
        className="main-nav hidden md:flex"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          height: '64px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          background: 'color-mix(in srgb, var(--obsidian) 92%, transparent)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Left: Brand Logo */}
        <Link
          href="/"
          className="nav-logo"
          style={{
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <img src="/images/logo-light.png" alt="James & Sons" className="logo-light-img" style={{ height: '52px', width: 'auto' }} />
          <img src="/images/logo-dark.png" alt="James & Sons" className="logo-dark-img" style={{ height: '52px', width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', letterSpacing: '0.25em', color: 'var(--gold-light)', textTransform: 'uppercase' }}>
            James &amp; Sons
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <NavDropdown categories={categories} spaces={spaces} />
        </div>

        {/* Right: Search, Account, Cart */}
        <div style={{ flexShrink: 0 }}>
          <NavClient user={user} products={products} />
        </div>
      </nav>

      {/* Mobile Top Header */}
      <MobileHeader user={user} />

      <MobileBottomNav user={user} />
    </>
  );
}
