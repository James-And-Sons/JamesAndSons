import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { formatPrice } from '@/lib/utils';
import Navigation from '@/components/Navigation';
import PDPClient from './PDPClient';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';



export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  
  // Determine B2B status
  let isB2B = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (user) {
      const meta = user.user_metadata || {};
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } }).catch(() => null);
      isB2B = dbUser?.role === 'B2B_BUYER' || dbUser?.role === 'B2B_APPROVER' || meta.accountType === 'business';
    }
  } catch (error) {
    console.error('Error checking B2B status on PDP:', error);
  }

  let product;
  try {
    product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        variants: { orderBy: { createdAt: 'asc' } }
      }
    });
  } catch (error) {
    console.error(`Error fetching product with slug ${params.slug}:`, error);
    product = null; 
  }

  if (!product) return notFound();

  let related: any[] = [];
  try {
    related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id } },
      take: 4,
    });
  } catch (error) {
    console.error('Error fetching related products:', error);
  }

  return (
    <>
      <Navigation />
      <main className="pt-14 md:pt-16 min-h-screen" style={{ background: 'var(--obsidian)' }}>

        <PDPClient product={product as any} variants={product.variants as any} isB2B={isB2B} />

        {/* Related Products */}
        {related.length > 0 && (
          <section className="section" style={{ borderTop: '1px solid var(--border)', padding: '40px 0' }}>
            <div className="section-header" style={{ padding: '0 24px', marginBottom: '24px' }}>
              <div>
                <div className="section-label">From the Same Collection</div>
                <h2 className="section-title" style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}>You May Also <em>Love</em></h2>
              </div>
              <Link href="/collections" className="link-all">View All →</Link>
            </div>

            {/* Mobile Scroll */}
            <div className="md:hidden" style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '0 24px 20px', scrollbarWidth: 'none' }}>
              {related.map((p: any) => (
                <Link key={p.id} href={`/products/${p.slug}`} style={{ flexShrink: 0, width: '160px', textDecoration: 'none' }}>
                  <div style={{ height: '180px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="ti ti-lamp" style={{ fontSize: '32px', color: 'var(--gold)', opacity: 0.3 }}></i>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--cream)', lineHeight: 1.3, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--gold-light)' }}>{formatPrice(p.d2cPrice)}</div>
                </Link>
              ))}
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:block">
              <div className="product-grid" style={{ padding: '0 40px' }}>
                {related.map((p: any) => (
                  <Link key={p.id} href={`/products/${p.slug}`} className="product-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    <div className="product-img">
                      <div className="product-img-bg" />
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg className="prod-chandelier-svg" width="120" height="160" viewBox="0 0 100 120" stroke="#C4A05A" fill="none">
                          <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3"/>
                          <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7"/>
                          <circle cx="50" cy="95" r="4" fill="#F5E9C8" stroke="none"/>
                        </svg>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-meta">
                        <div className="product-price">{formatPrice(p.d2cPrice)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
