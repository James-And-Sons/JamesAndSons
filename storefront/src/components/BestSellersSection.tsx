'use client';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, Product } from '@/lib/utils';

export default function BestSellersSection({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="section" id="best-sellers">
      <div className="section-header">
        <div>
          <div className="section-label">Most Loved</div>
          <h2 className="section-title">Best <em>Sellers</em></h2>
        </div>
        <Link href="/collections" className="link-all">View All</Link>
      </div>

      {/* 3-column desktop grid, 2-column mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '2px',
      }}>
        {products.slice(0, 6).map((product, index) => {
          const thumbnail = product.images?.[0] || product.whiteBackgroundImages?.[0];
          const rankLabel = String(index + 1).padStart(2, '0');

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '20px',
                background: index % 2 === 0 ? 'var(--surface)' : 'var(--obsidian)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'inherit',
                alignItems: 'center',
                transition: 'border-color 0.3s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {/* Large rank number watermark */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '12px',
                fontFamily: 'var(--font-serif)',
                fontSize: '80px',
                fontWeight: 300,
                color: 'var(--gold)',
                opacity: 0.06,
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
                {rankLabel}
              </div>

              {/* Rank badge */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                color: index === 0 ? 'var(--gold)' : 'var(--text-muted)',
                letterSpacing: '0.1em',
                minWidth: '28px',
                flexShrink: 0,
              }}>
                #{rankLabel}
              </div>

              {/* Product thumbnail */}
              <div style={{ width: '72px', height: '72px', flexShrink: 0, background: 'var(--surface2)', position: 'relative', overflow: 'hidden' }}>
                {thumbnail ? (
                  <Image src={thumbnail} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="72px" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-lamp" style={{ fontSize: '28px', color: 'var(--gold)', opacity: 0.25 }} />
                  </div>
                )}
              </div>

              {/* Product info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '3px' }}>
                  {product.collection}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--text)', lineHeight: 1.3, marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold-light)' }}>
                  {formatPrice(product.d2cPrice)}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--gold)', opacity: 0.5, flexShrink: 0 }}>↗</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
