import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import NavClient from './NavClient';
import { getProducts } from '@/lib/products';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';

export default async function Navigation() {
  const supabase = await createClient();
  let user = null;
  let products: any[] = [];

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    products = await getProducts();
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
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/collections">Collections</Link></li>
          <li><Link href="/blog">Blog</Link></li>
          <li><Link href="/spaces">Spaces</Link></li>
          <li><Link href="https://indiamart.jamesandsons.in">B2B Portal</Link></li>
        </ul>
        <NavClient user={user} products={products} />
      </nav>
      
      {/* Mobile Top Header */}
      <MobileHeader user={user} />

      <MobileBottomNav user={user} />
    </>
  );
}
