import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import NavClient from './NavClient';
import { getProducts } from '@/lib/products';

export default async function Navigation() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const products = await getProducts();

  return (
    <nav>
      <Link href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
        James <span>&amp;</span> Sons
      </Link>
      <ul className="nav-links">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/collections">Collections</Link></li>
        <li><Link href="/blog">Blog</Link></li>
        <li><Link href="/#spaces">Spaces</Link></li>
        <li><Link href="/b2b">B2B Portal</Link></li>
      </ul>
      <NavClient user={user} products={products} />
    </nav>
  );
}
