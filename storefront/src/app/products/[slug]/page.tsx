import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { formatPrice } from '@/lib/utils';
import Navigation from '@/components/Navigation';
import PDPClient from './PDPClient';
import Link from 'next/link';



export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      variants: { orderBy: { createdAt: 'asc' } }
    }
  });

  if (!product) return notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    take: 4,
  });

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>

        <PDPClient product={product as any} variants={product.variants as any} />

        {/* Related Products */}
        {related.length > 0 && (
          <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="section-header">
              <div>
                <div className="section-label">From the Same Collection</div>
                <h2 className="section-title">You May Also <em>Love</em></h2>
              </div>
              <Link href="/collections" className="link-all">View All</Link>
            </div>
            <div className="product-grid">
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
