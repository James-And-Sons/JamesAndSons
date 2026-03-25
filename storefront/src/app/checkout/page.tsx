import Navigation from '@/components/Navigation';
import CheckoutPageClient from './CheckoutPageClient';

export default function CheckoutPage() {
  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '32px 40px' }} className="checkout-title-bg">
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="section-label">Secure Checkout</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 300, color: 'var(--cream)', marginTop: '6px' }}>Complete Your Order</h1>
          </div>
        </div>
        <CheckoutPageClient />
      </main>
    </>
  );
}
