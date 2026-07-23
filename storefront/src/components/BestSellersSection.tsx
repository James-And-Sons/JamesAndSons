'use client';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, Product } from '@/lib/utils';
import { useCartStore } from '@/store/cart';

export default function BestSellersSection({ products }: { products: Product[] }) {
  const { addItem } = useCartStore();

  if (!products || products.length === 0) return null;

  return (
    <section
      className="section"
      id="best-sellers"
      style={{
        padding: '80px 40px',
        background: 'var(--obsidian)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-header" style={{ marginBottom: '36px' }}>
          <div>
            <div
              className="section-label"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                marginBottom: '4px',
              }}
            >
              Client Favorites
            </div>
            <h2
              className="section-title"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 300,
                color: 'var(--text)',
              }}
            >
              Best <em>Sellers</em>
            </h2>
          </div>
          <Link
            href="/collections"
            className="link-all"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            View All Collection ↗
          </Link>
        </div>

        {/* 6-Grid Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {products.slice(0, 6).map((product, index) => {
            const thumbnail = product.images?.[0] || product.whiteBackgroundImages?.[0];
            const rankLabel = String(index + 1).padStart(2, '0');
            const hasDiscount = product.mrp && product.mrp > product.d2cPrice;

            return (
              <div
                key={product.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  position: 'relative',
                  transition: 'all 0.35s ease',
                }}
                className="group hover:border-[var(--gold)] hover:shadow-[0_12px_28px_rgba(196,160,90,0.1)]"
              >
                {/* Rank Tag Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '36px',
                    fontWeight: 300,
                    color: 'var(--gold)',
                    opacity: 0.12,
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  #{rankLabel}
                </div>

                {/* Product Thumbnail */}
                <Link
                  href={`/products/${product.slug}`}
                  style={{
                    width: '110px',
                    height: '110px',
                    flexShrink: 0,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'linear-gradient(135deg, #181410 0%, #110d09 100%)',
                    display: 'block',
                  }}
                >
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={product.name}
                      fill
                      className="transition-transform duration-500 ease-out group-hover:scale-110"
                      style={{ objectFit: 'cover' }}
                      sizes="110px"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-lamp" style={{ fontSize: '32px', color: 'var(--gold)', opacity: 0.25 }} />
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--gold)',
                        marginBottom: '4px',
                      }}
                    >
                      {product.collection || 'Signature Series'}
                    </div>

                    <Link
                      href={`/products/${product.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <h3
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '16px',
                          fontWeight: 400,
                          color: 'var(--text)',
                          lineHeight: 1.25,
                          marginBottom: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product.name}
                      </h3>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'var(--gold-light)',
                        }}
                      >
                        {formatPrice(product.d2cPrice)}
                      </span>
                      {hasDiscount && (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: 'var(--text-dim)',
                            textDecoration: 'line-through',
                          }}
                        >
                          {formatPrice(product.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--gold)',
                        color: 'var(--obsidian)',
                        border: 'none',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <i className="ti ti-plus" style={{ fontSize: '11px' }} />
                      Add
                    </button>
                    <Link
                      href={`/products/${product.slug}`}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--gold)';
                        e.currentTarget.style.color = 'var(--gold)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
