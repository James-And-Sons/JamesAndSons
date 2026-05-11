import Navigation from '@/components/Navigation';
import CartPageClient from '@/app/cart/CartPageClient';

export default function CartPage() {
  return (
    <>
      <Navigation />
      <main className="md:pt-16 min-h-screen" style={{ background: 'var(--obsidian)' }}>
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: 'clamp(24px, 5vw, 48px) clamp(20px, 4vw, 40px)', position: 'relative', overflow: 'hidden' }}>
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
