import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { formatPrice } from '@/lib/utils';
import Navigation from '@/components/Navigation';
import PDPClient from './PDPClient';
import Link from 'next/link';



export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  
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
    // If an error occurs during the Prisma call, treat it as if the product was not found.
    // The original code returns notFound() if product is null, so setting product to null
    // here will lead to the same outcome.
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
      <main className="md:pt-16 min-h-screen" style={{ background: 'var(--obsidian)' }}>

        <PDPClient product={product as any} variants={product.variants as any} />

        {/* Related Products */}
        {related.length > 0 && (
          <section className="section" style={{ borderTop: '1px solid var(--border)', padding: '40px 0' }}>
            <div className="section-header" style={{ padding: '0 24px', marginBottom: '24px' }}>
              <div>
                <div className="section-label">From the Same Collection</div>
                <h2 className="section-title" style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}>You May Also <em>Love</em></h2>
              </div>
              <Link href="/collections" className="link-all">View All ↗</Link>
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
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cream)', lineHeight: 1.3, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gold-light)' }}>{formatPrice(p.d2cPrice)}</div>
                </Link>
              ))}
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid product-grid" style={{ padding: '0 40px' }}>
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
          </section>
        )}
      </main>
    </>
  );
}
