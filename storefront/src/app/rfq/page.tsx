import Navigation from '@/components/Navigation';
import RFQForm from './RFQForm';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getProducts, getProductBySlug } from '@/lib/products';

export default async function RFQPage(props: {
  searchParams: Promise<{ product?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/rfq');

  const meta = user.user_metadata || {};
  const isB2B = meta.accountType === 'business';

  const products = await getProducts();

  const preselectedProduct = searchParams.product
    ? await getProductBySlug(searchParams.product)
    : undefined;

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '48px 40px 40px', position: 'relative', overflow: 'hidden' }}>
          <svg viewBox="0 0 200 260" style={{ position: 'absolute', right: '-40px', top: '-20px', width: '280px', opacity: 0.04, pointerEvents: 'none' }} stroke="var(--gold)" fill="none" strokeWidth="0.8">
            <line x1="100" y1="0" x2="100" y2="260" />
            <ellipse cx="100" cy="60" rx="70" ry="10" strokeWidth="0.4" />
            <ellipse cx="100" cy="110" rx="50" ry="8" strokeWidth="0.4" />
          </svg>
          <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div className="section-label">B2B Wholesale</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.05, marginTop: '8px' }}>
              Request for Quotation
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.7, maxWidth: '600px' }}>
              Submit your project brief and we'll respond with a detailed quote — including volume pricing, lead times, and installation costs — within 48 hours.
            </p>
            {!isB2B && (
              <div style={{ marginTop: '16px', padding: '12px 18px', background: 'rgba(196,160,90,0.06)', border: '1px solid var(--border-gold)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--gold)', display: 'inline-block' }}>
                ℹ Note: RFQs are processed with priority for verified B2B accounts.
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 40px' }}>
          <RFQForm products={products} preselectedProduct={preselectedProduct} user={user} />
        </div>
      </main>
    </>
  );
}
