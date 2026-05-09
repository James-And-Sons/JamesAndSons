'use client';
import { useState, useRef, useEffect } from 'react';
import { formatPrice, Product } from '@/lib/utils';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';

export default function ProductGrid({ initialFilter = 'All', initialProducts }: { initialFilter?: string, initialProducts: Product[] }) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCartStore();

  const uniqueCollections = Array.from(new Set(initialProducts.map(p => p.collection))).filter(c => c !== 'Uncategorized').sort();
  const uniqueStyles = Array.from(new Set(initialProducts.flatMap(p => p.style || []))).filter(Boolean).sort();
  const uniqueMaterials = Array.from(new Set(initialProducts.flatMap(p => p.materialAndFinish || []))).filter(Boolean).sort();
  const uniqueSpaces = Array.from(new Set(initialProducts.flatMap(p => p.spaces || []))).filter(Boolean).sort();

  useEffect(() => {
    if (initialFilter && initialFilter !== 'All') {
      const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
      const allPossibleFilters = [...uniqueCollections, ...uniqueSpaces, ...uniqueStyles, ...uniqueMaterials, 'LED Certified'];
      const matchedFilter = allPossibleFilters.find(f => slugify(f) === initialFilter || f.toLowerCase() === initialFilter.toLowerCase());
      if (matchedFilter) {
        setActiveFilters([matchedFilter]);
      } else if (initialFilter) {
        setActiveFilters([initialFilter]);
      }
    }
  }, [initialFilter, initialProducts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown-area]')) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const filters = ['All', ...uniqueCollections, ...uniqueSpaces, ...uniqueStyles, ...uniqueMaterials, 'LED Certified'];

  const products = activeFilters.length === 0 ? initialProducts : initialProducts.filter(p =>
    activeFilters.some(filter => {
      const lowerFilter = filter.toLowerCase();
      const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
      const filterSlug = slugify(filter);

      return (p.collection && (p.collection.toLowerCase() === lowerFilter || slugify(p.collection) === filterSlug)) ||
             (p.spaces && p.spaces.some(s => s.toLowerCase() === lowerFilter || slugify(s) === filterSlug)) ||
             (p.style && p.style.some(s => s.toLowerCase() === lowerFilter || slugify(s) === filterSlug)) ||
             (p.materialAndFinish && p.materialAndFinish.some(m => m.toLowerCase() === lowerFilter || slugify(m) === filterSlug)) ||
             (lowerFilter === 'led certified' && p.isLed);
    })
  );

  return (
    <section className="section" id="collections">
      <div className="section-header">
        <div>
          <div className="section-label">{activeFilters.length === 0 ? 'Masterworks' : 'Curated Selection'}</div>
          <h2 className="section-title">
            {activeFilters.length === 0 ? 'All Collections' :
              activeFilters.length === 1 ? `The ${activeFilters[0]} Collection` :
                'Filtered Collections'}
          </h2>
        </div>
        <Link href="/collections" className="link-all">View All {products.length} Products</Link>
      </div>

      <div className="filter-bar-container" style={{ position: 'relative', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              data-dropdown-area="true"
              onClick={() => setShowFilters(!showFilters)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
                border: '1px solid var(--border)', background: showFilters ? 'var(--surface2)' : 'var(--surface)', 
                color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-mono)', 
                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.3s ease'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
              Filters {activeFilters.length > 0 && `(${activeFilters.length} Active)`}
            </button>
            
            {activeFilters.map(filter => (
              <div key={filter} style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                background: 'var(--surface2)', border: '1px solid var(--border)', 
                borderRadius: '16px', fontSize: '10px', fontFamily: 'var(--font-mono)', 
                textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em' 
              }}>
                {filter}
                <button 
                  onClick={() => toggleFilter(filter)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  ✕
                </button>
              </div>
            ))}

            {activeFilters.length > 0 && (
               <button 
                 onClick={() => { setActiveFilters([]); setShowFilters(false); }} 
                 style={{ 
                   background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', 
                   fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', 
                   letterSpacing: '0.1em', padding: '10px', marginLeft: '4px'
                 }}
               >
                 Clear All
               </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div data-dropdown-area="true" style={{ 
            position: 'absolute', top: '100%', left: 0, marginTop: '12px', zIndex: 50,
            background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px', width: '100%', maxWidth: '900px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            {uniqueCollections.length > 0 && (
              <div>
                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', fontFamily: 'var(--font-mono)' }}>Collections</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {uniqueCollections.map(c => (
                    <button key={c} onClick={() => toggleFilter(c)} className={`filter-dropdown-btn ${activeFilters.includes(c) ? 'active' : ''}`}>{c}</button>
                  ))}
                </div>
              </div>
            )}
            
            {uniqueSpaces.length > 0 && (
              <div>
                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', fontFamily: 'var(--font-mono)' }}>Spaces</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {uniqueSpaces.map(s => (
                    <button key={s} onClick={() => toggleFilter(s)} className={`filter-dropdown-btn ${activeFilters.includes(s) ? 'active' : ''}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {uniqueStyles.length > 0 && (
              <div>
                <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', fontFamily: 'var(--font-mono)' }}>Styles</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {uniqueStyles.map(s => (
                    <button key={s} onClick={() => toggleFilter(s)} className={`filter-dropdown-btn ${activeFilters.includes(s) ? 'active' : ''}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', fontFamily: 'var(--font-mono)' }}>Materials & Features</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {uniqueMaterials.map(m => (
                  <button key={m} onClick={() => toggleFilter(m)} className={`filter-dropdown-btn ${activeFilters.includes(m) ? 'active' : ''}`}>{m}</button>
                ))}
                <button onClick={() => toggleFilter('LED Certified')} className={`filter-dropdown-btn ${activeFilters.includes('LED Certified') ? 'active' : ''}`}>LED Certified</button>
              </div>
            </div>
          </div>
        )}
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

            <div className="product-img" style={{ position: 'relative' }}>
              <div className="product-img-bg" />

              {/* Placeholder SVG (always in background if there's an image, or as main if not) */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
                <svg className="prod-chandelier-svg" width="120" height="150" viewBox="0 0 100 120" stroke="#C4A05A" fill="none" style={{ opacity: 0.3 }}>
                  <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7" />
                  <circle cx="50" cy="95" r="4" fill="#F5E9C8" stroke="none" />
                </svg>
              </div>

              {product.images && product.images.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="prod-actual-img"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    transition: 'opacity 0.5s ease',
                    opacity: 0
                  }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target) target.style.opacity = '1';
                  }}
                // Start at opacity 0 to show the placeholder
                // Note: In some browsers/states this might flicker, but it's the standard way
                />
              )}
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
