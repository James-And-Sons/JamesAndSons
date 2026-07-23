'use client';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, Product } from '@/lib/utils';

export default function NewArrivalsSection({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="section" id="new-arrivals" style={{ overflow: 'hidden' }}>
      <div className="section-header">
        <div>
          <div className="section-label">Just Arrived</div>
          <h2 className="section-title">New <em>Arrivals</em></h2>
        </div>
        <Link href="/collections" className="link-all">View All</Link>
      </div>

      {/* Horizontal scroll strip */}
      <div style={{
        display: 'flex',
        gap: '20px',
        overflowX: 'auto',
        paddingBottom: '16px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--gold) var(--surface)',
      }}>
        {products.map((product) => {
          const thumbnail = product.images?.[0] || product.whiteBackgroundImages?.[0];
          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              style={{
                display: 'block',
                flexShrink: 0,
                width: '240px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.3s',
                position: 'relative',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {/* NEW badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 2,
                background: 'var(--gold)',
                color: 'var(--obsidian)',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '3px 8px',
              }}>
                New
              </div>

              {/* Product image */}
              <div style={{ position: 'relative', height: '220px', background: 'linear-gradient(135deg, #181410 0%, #1e1a0f 100%)' }}>
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={product.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="240px"
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-lamp" style={{ fontSize: '48px', color: 'var(--gold)', opacity: 0.2 }} />
                  </div>
                )}
              </div>

              {/* Product info */}
              <div style={{ padding: '16px 16px 20px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '4px' }}>
                  {product.collection}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--text)', lineHeight: 1.3, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold-light)' }}>
                  {formatPrice(product.d2cPrice)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
