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
      <nav className="main-nav hidden md:flex">
        <Link href="/" className="nav-logo" style={{ textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/images/logo-light.png" alt="James & Sons" className="logo-light-img" style={{ height: '56px', width: 'auto' }} />
          <img src="/images/logo-dark.png" alt="James & Sons" className="logo-dark-img" style={{ height: '56px', width: 'auto' }} />
          James <span>&amp;</span> Sons
        </Link>
        <NavDropdown categories={categories} spaces={spaces} />
        <NavClient user={user} products={products} />
      </nav>

      {/* Mobile Top Header */}
      <MobileHeader user={user} />

      <MobileBottomNav user={user} />
    </>
  );
}
