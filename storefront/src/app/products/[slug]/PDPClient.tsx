'use client';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlist';
import { checkPincode, getSavedPincode } from '../actions';
import { useEffect } from 'react';

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
  const [pincode, setPincode] = useState('');
  const [shippingRes, setShippingRes] = useState<any>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  useEffect(() => {
    const loadPincode = async () => {
      const saved = await getSavedPincode();
      if (saved) {
        setPincode(saved);
        handleCheckPincode(saved);
      }
    };
    loadPincode();
  }, []);

  const handleCheckPincode = async (code: string) => {
    if (code.length !== 6) return;
    setCheckingPincode(true);
    const weight = product.weight || 0.5;
    const res = await checkPincode(code, weight, displayPrice);
    setShippingRes(res);
    setCheckingPincode(false);
  };

  const activeImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : product.images?.length
      ? product.images
      : [];

  const { toggleItem, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

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
        <div className="pdp-gallery-container" style={{ position: 'sticky', top: '100px' }}>
          {activeImages.length > 0 ? (
            <div className="pdp-main-image bg-[var(--surface2)] rounded border border-[var(--border)] overflow-hidden flex items-center justify-center max-h-[500px]">
              <img
                src={activeImages[activeImg]}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="pdp-main-image pdp-placeholder bg-[var(--surface2)] rounded border border-[var(--border)] flex items-center justify-center min-h-[400px]">
              <svg width="120" height="160" viewBox="0 0 100 120" stroke="#C4A05A" fill="none">
                <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7" />
                <circle cx="50" cy="95" r="4" fill="#F5E9C8" stroke="none" />
              </svg>
            </div>
          )}

          {activeImages.length > 1 && (
            <div className="pdp-thumbnails">
              {activeImages.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={i === activeImg ? 'pdp-thumb active' : 'pdp-thumb'}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/* Description */}
        {product.description && product.description.trim() !== '' && (
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded my-4">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--gold)] mb-4">Provenance & Craftsmanship</div>
            <div className="space-y-4">
              {product.description.split('\n\n').map((para: string, i: number) => (
                <p key={i} className="font-body text-[14px] text-[var(--text-muted)] leading-relaxed">{para}</p>
              ))}
            </div>
          </div>
        )}

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

          <div className="pdp-actions" style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={handleAddToCart}
              disabled={availableStock === 0}
            >
              {availableStock === 0 ? 'Made to Order' : added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
            <button
              className="btn-outline"
              style={{ width: '56px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => toggleItem(product)}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <span style={{ fontSize: '20px', color: isWishlisted ? 'var(--gold)' : 'var(--text-dim)' }}>
                {isWishlisted ? '♥' : '♡'}
              </span>
            </button>
          </div>
          <button
            className="btn-outline w-full"
            onClick={() => router.push(`/rfq?product=${product.slug}`)}
          >
            Request Quote
          </button>
        </div>

        {/* Pincode Checker */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '20px', borderRadius: '4px', marginTop: '8px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Check Delivery Estimate
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              placeholder="Enter Pincode" 
              maxLength={6} 
              value={pincode}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setPincode(val);
                if (val.length === 6) handleCheckPincode(val);
                else setShippingRes(null);
              }}
              style={{ flex: 1, background: 'var(--obsidian)', border: '1px solid var(--border)', color: 'var(--cream)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }}
            />
            <button 
              onClick={() => handleCheckPincode(pincode)}
              disabled={pincode.length !== 6 || checkingPincode}
              className="btn-outline" 
              style={{ padding: '0 20px', fontSize: '11px', height: '42px', opacity: pincode.length === 6 ? 1 : 0.5 }}
            >
              {checkingPincode ? '...' : 'Check'}
            </button>
          </div>
          
          {shippingRes && (
            <div style={{ marginTop: '14px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <span>✓</span>
                <span>Delivery to {shippingRes.city}, {shippingRes.state}</span>
              </div>
              <div style={{ marginTop: '4px', fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--cream)' }}>
                Estimated by <span style={{ color: 'var(--gold-light)' }}>{shippingRes.etd}</span>
              </div>
            </div>
          )}

          {pincode.length === 6 && !checkingPincode && !shippingRes && (
            <div style={{ marginTop: '12px', color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
              ⚠ Service unavailable for this pincode.
            </div>
          )}
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
        {(() => {
          const combinedSpecs = {
            ...(product.dimensions && { 'Dimensions': product.dimensions }),
            ...(product.materialAndFinish?.length > 0 && { 'Material & Finish': product.materialAndFinish.join(', ') }),
            ...(product.bulbType?.length > 0 && { 'Bulb Type': product.bulbType.join(', ') }),
            ...(product.style?.length > 0 && { 'Style': product.style.join(', ') }),
            ...((product.specs && typeof product.specs === 'object') ? product.specs : {})
          };

          if (Object.keys(combinedSpecs).length === 0) return null;

          return (
            <div className="pdp-specs mt-8">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--gold)] mb-6">Technical Specifications</div>
              <div className="grid grid-cols-1 border-t border-[var(--border)]">
                {Object.entries(combinedSpecs).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 py-4 border-b border-dashed border-[var(--border)]">
                    <div className="col-span-1 font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex items-center pr-4">
                      {key}
                    </div>
                    <div className="col-span-2 font-serif text-[15px] text-[var(--cream)] leading-relaxed">
                      {value as React.ReactNode}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
