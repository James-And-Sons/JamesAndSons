'use client';
import { useState } from 'react';
import { formatPrice, Product } from '@/lib/utils';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';

export default function ProductGrid({ initialFilter = 'All', initialProducts }: { initialFilter?: string, initialProducts: Product[] }) {
  const [activeFilter, setActiveFilter] = useState(initialFilter || 'All');
  const { addItem } = useCartStore();

  const filters = ['All', 'Modern', 'Classical', 'LED Certified', 'Grand Foyer', 'Dining Estate'];
  
  const f = activeFilter.toLowerCase();
  const products = activeFilter === 'All' ? initialProducts : initialProducts.filter(p =>
    p.collection.toLowerCase().includes(f) ||
    p.spaces.some(s => s.toLowerCase().includes(f)) ||
    (f === 'led certified' && p.isLed) ||
    (f === 'modern' && p.collection.toLowerCase().includes('modern')) ||
    (f === 'classical' && p.collection.toLowerCase().includes('heritage'))
  );

  return (
    <section className="section" id="collections">
      <div className="section-header">
        <div>
          <div className="section-label">Masterworks</div>
          <h2 className="section-title">The <em>Heritage</em> Collection</h2>
        </div>
        <Link href="/collections" className="link-all">View All {products.length} Products</Link>
      </div>

      <div className="filter-bar">
        <span className="filter-label">Filter:</span>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`filter-btn ${activeFilter.toLowerCase() === filter.toLowerCase() ? 'active' : ''}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {products.map(product => (
          <Link key={product.id} href={`/products/${product.slug}`} className="product-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            {product.badge && (
              <div className={`product-badge ${product.badge === 'new' ? 'badge-new' : product.badge === 'bis' ? 'badge-bis' : product.badge === 'b2b' ? 'badge-sale' : 'badge-sale'}`}>
                {product.badge === 'new' ? 'New Release' : product.badge === 'bis' ? 'BIS Appv.' : 'B2B Volume'}
              </div>
            )}

            <div className="product-actions" style={{ zIndex: 2 }}>
              <button className="prod-action-btn" title="Add to Cart" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product); }}>+</button>
              <Link href={`/rfq?product=${product.slug}`} className="prod-action-btn" title="Request Quote" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>Q</Link>
            </div>

            <div className="product-img">
              <div className="product-img-bg" />
              <svg className="prod-chandelier-svg" width="160" height="200" viewBox="0 0 100 120" stroke="#C4A05A" fill="none">
                <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3"/>
                <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7"/>
                <path d="M30 80 Q50 50 70 80" strokeWidth="1.5" opacity="0.9"/>
                <circle cx="20" cy="75" r="3" fill="#E2C882" stroke="none"/>
                <circle cx="30" cy="85" r="3" fill="#E2C882" stroke="none"/>
                <circle cx="50" cy="95" r="4" fill="#F5E9C8" stroke="none"/>
                <circle cx="70" cy="85" r="3" fill="#E2C882" stroke="none"/>
                <circle cx="80" cy="75" r="3" fill="#E2C882" stroke="none"/>
              </svg>
            </div>

            <div className="product-info" style={{ padding: '20px 20px 24px' }}>
              <div className="product-brand">{product.collection}</div>
              <div className="product-name" style={{ fontSize: '19px', marginBottom: '12px' }}>{product.name}</div>
              <div className="product-meta">
                <div className="product-price">
                  {formatPrice(product.d2cPrice)}
                  {product.mrp > product.d2cPrice && (
                    <span className="product-price-old">{formatPrice(product.mrp)}</span>
                  )}
                </div>
              </div>
              <div className="product-specs">
                {product.isLed && <span className="spec-pill led">{product.luminousEfficacy} lm/W LED</span>}
                {product.cri && <span className="spec-pill">CRI {product.cri}</span>}
                <span className="spec-pill gst">GST {product.gstRate}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
