'use client';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

type Variant = {
  id: string;
  name: string;
  sku: string;
  d2cPrice: number | null;
  mrp: number | null;
  stockQuantity: number;
  images: string[];
};

export default function PDPClient({ product, variants }: { product: any; variants: Variant[] }) {
  const { addItem } = useCartStore();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(variants.length > 0 ? variants[0] : null);

  const activeImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : product.images?.length
    ? product.images
    : [];

  const displayPrice = selectedVariant?.d2cPrice ?? product.d2cPrice;
  const displayMrp = selectedVariant?.mrp ?? product.mrp;
  const availableStock = selectedVariant?.stockQuantity ?? product.stockQuantity;

  const handleAddToCart = () => {
    if (qty > availableStock) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="pdp-layout">
      
      {/* LEFT COLUMN: Gallery & Description */}
      <div className="pdp-gallery" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeImages.length > 0 ? (
            <div style={{
              width: '100%', aspectRatio: '4/3', background: 'var(--void)',
              border: '1px solid var(--border)', overflow: 'hidden', position: 'relative'
            }}>
              <img
                src={activeImages[activeImg]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--void)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="120" height="160" viewBox="0 0 100 120" stroke="#C4A05A" fill="none">
                <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3"/>
                <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7"/>
                <circle cx="50" cy="95" r="4" fill="#F5E9C8" stroke="none"/>
              </svg>
            </div>
          )}
          
          {activeImages.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {activeImages.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: '80px', height: '80px', padding: 0, cursor: 'pointer', background: 'var(--void)',
                    border: `1px solid ${i === activeImg ? 'var(--gold)' : 'var(--border)'}`,
                    overflow: 'hidden', transition: 'border-color 0.2s'
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div style={{ marginTop: '16px' }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>About this piece</div>
            {product.description.split('\n\n').map((para: string, i: number) => (
              <p key={i} style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.85, marginBottom: '16px' }}>{para}</p>
            ))}
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Info & Actions */}
      <div className="pdp-info" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <div className="pdp-breadcrumb" style={{ marginBottom: '16px' }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/collections" style={{ color: 'inherit', textDecoration: 'none' }}>Collections</Link>
            <span>/</span>
            {product.name}
          </div>

          <div className="pdp-collection" style={{ marginBottom: '8px' }}>{product.category?.name || 'Collection'}</div>
          <h1 className="pdp-name" style={{ marginBottom: '16px' }}>{product.name}</h1>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {product.isLed && <span className="spec-pill led">✓ LED Engine</span>}
            {product.bisCertification && <span className="spec-pill gst">BIS {product.bisCertification}</span>}
            {product.hsnCode && <span className="spec-pill">HSN {product.hsnCode}</span>}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 300, color: 'var(--gold-light)' }}>
              {formatPrice(displayPrice)}
            </div>
            {displayMrp > displayPrice && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                {formatPrice(displayMrp)}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', marginLeft: 'auto' }}>
              {availableStock > 0 ? `${availableStock} in stock` : 'Made to Order'}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '8px' }}>
            GST {product.gstRate}% inclusive · B2B price from {formatPrice(product.b2bPrice)}
          </div>
        </div>

        {/* Variant Selector */}
        {variants.length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Select Variant
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVariant(v); setActiveImg(0); }}
                  style={{
                    padding: '10px 18px', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                    background: selectedVariant?.id === v.id ? 'rgba(196,160,90,0.12)' : 'transparent',
                    border: `1px solid ${selectedVariant?.id === v.id ? 'var(--gold)' : 'var(--border)'}`,
                    color: selectedVariant?.id === v.id ? 'var(--gold)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                    opacity: v.stockQuantity === 0 ? 0.4 : 1,
                  }}
                >
                  {v.name}{v.stockQuantity === 0 ? ' (Out)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableStock > 0 && availableStock <= 5 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase' }}>
            ⚡ Only {availableStock} left in stock
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Qty</div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', width: '40px', height: '40px', cursor: 'pointer', fontSize: '16px' }}>−</button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', width: '40px', textAlign: 'center' }}>{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(availableStock || 999, q + 1))}
                disabled={qty >= availableStock}
                style={{ background: 'transparent', border: 'none', color: qty >= availableStock ? 'var(--border)' : 'var(--text-muted)', width: '40px', height: '40px', cursor: qty >= availableStock ? 'not-allowed' : 'pointer', fontSize: '16px' }}
              >+</button>
            </div>
            {availableStock > 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Total: <span style={{ color: 'var(--gold-light)' }}>{formatPrice(displayPrice * qty)}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-primary"
              onClick={handleAddToCart}
              style={{ flex: 1, padding: '16px 24px', letterSpacing: '0.15em', transition: 'all 0.2s' }}
              disabled={availableStock === 0}
            >
              {availableStock === 0 ? 'Made to Order' : added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
            <button
              className="btn-outline"
              onClick={() => router.push(`/rfq?product=${product.slug}`)}
              style={{ padding: '16px 24px', letterSpacing: '0.12em' }}
            >
              Request Quote
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px' }}>
          {['Free Installation', 'GST Invoice', '2-Year Warranty', 'Custom Dimensions'].map(t => (
            <div key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--gold)' }}>✓</span> {t}
            </div>
          ))}
        </div>

        {/* Dynamic Specs Table */}
        {product.specs && typeof product.specs === 'object' && Object.keys(product.specs).length > 0 && (
          <div style={{ marginTop: '36px', borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
            <div className="section-label" style={{ marginBottom: '16px' }}>Technical Specifications</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(product.specs as Record<string, string>).map(([key, value]) => (
                  <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '10px 0', width: '45%' }}>{key}</td>
                    <td style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)', padding: '10px 0' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
