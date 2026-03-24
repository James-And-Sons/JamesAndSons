import Navigation from '@/components/Navigation';
import CartPageClient from '@/app/cart/CartPageClient';

export default function CartPage() {
  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div className="section-label">Your Selection</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.05, marginTop: '8px' }}>
              Shopping Bag
            </h1>
          </div>
        </div>
        <CartPageClient />
      </main>
    </>
  );
}
