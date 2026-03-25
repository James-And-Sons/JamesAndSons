import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import NavClient from './NavClient';
import { getProducts } from '@/lib/products';
import MobileMenu from './MobileMenu';

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
    <nav>
      <MobileMenu user={user} />
      <Link href="/" className="nav-logo" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
        James <span>&amp;</span> Sons
      </Link>
      <ul className="nav-links">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/collections">Collections</Link></li>
        <li><Link href="/blog">Blog</Link></li>
        <li><a href="/#spaces">Spaces</a></li>
        <li><Link href="/b2b">B2B Portal</Link></li>
      </ul>
      <NavClient user={user} products={products} />
    </nav>
  );
}
