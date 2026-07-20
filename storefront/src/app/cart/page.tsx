import Navigation from '@/components/Navigation';
import CartPageClient from '@/app/cart/CartPageClient';

export default function CartPage() {
  return (
    <>
      <Navigation />
      <main className="md:pt-16 min-h-screen" style={{ background: 'var(--bg)' }}>
        <CartPageClient />
      </main>
    </>
  );
}
