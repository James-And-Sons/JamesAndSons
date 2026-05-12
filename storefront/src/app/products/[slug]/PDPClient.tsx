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

export default function PDPClient({ product, variants, isB2B }: { product: any; variants: Variant[]; isB2B: boolean }) {
  const { addItem } = useCartStore();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(variants.length > 0 ? variants[0] : null);
  const [pincode, setPincode] = useState('');
  const [shippingRes, setShippingRes] = useState<any>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleSwipe = (endX: number) => {
    if (touchStartX === null) return;
    const diff = touchStartX - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setActiveImg(i => Math.min(activeImages.length - 1, i + 1));
      else setActiveImg(i => Math.max(0, i - 1));
    }
    setTouchStartX(null);
  };

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

  const items = useWishlistStore(state => state.items);
  const isWishlisted = items.some(i => i.id === product.id);
  const { toggleItem } = useWishlistStore();

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
    <div className="pdp-wrapper" style={{ background: 'var(--obsidian)', minHeight: '100vh' }}>
      
      {/* ── MOBILE LAYOUT (md:hidden) ── */}
      <div className="md:hidden" style={{ paddingBottom: '40px' }}>
        
        {/* Mobile Sub-Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
          <button onClick={() => router.back()} className="icon-btn" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: '18px' }}></i>
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => toggleItem(product)} className="icon-btn" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: isWishlisted ? 'var(--gold)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={isWishlisted ? "ti ti-heart-filled" : "ti ti-heart"} style={{ fontSize: '18px' }}></i>
            </button>
            <button onClick={() => router.push('/cart')} className="icon-btn" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <i className="ti ti-shopping-bag" style={{ fontSize: '18px' }}></i>
              {/* Add cart dot if needed */}
            </button>
          </div>
        </div>

        {/* Product Image Gallery */}
        <div
          onClick={() => activeImages.length > 0 && setLightboxOpen(true)}
          onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={e => handleSwipe(e.changedTouches[0].clientX)}
          style={{ margin: '0 20px', position: 'relative', height: '320px', borderRadius: '24px', border: '0.5px solid var(--border)', overflow: 'hidden', cursor: activeImages.length > 0 ? 'zoom-in' : 'default' }}
        >
          {activeImages.length > 0 ? (
            <img src={activeImages[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(150deg, #1a160a 0%, #0d0b06 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="130" viewBox="0 0 100 130" stroke="var(--gold)" fill="none" opacity="0.6">
                <path d="M50 5 L50 35" strokeDasharray="3 3"/>
                <path d="M20 60 Q50 25 80 60" strokeWidth="1.5"/>
                <circle cx="20" cy="82" r="4" fill="var(--gold)"/>
                <circle cx="80" cy="82" r="4" fill="var(--gold)"/>
              </svg>
            </div>
          )}

          {activeImages.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => Math.max(0, i - 1)); }} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: activeImg === 0 ? 0.3 : 1 }}>
                <i className="ti ti-chevron-left" style={{ fontSize: '16px' }}></i>
              </button>
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => Math.min(activeImages.length - 1, i + 1)); }} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: activeImg === activeImages.length - 1 ? 0.3 : 1 }}>
                <i className="ti ti-chevron-right" style={{ fontSize: '16px' }}></i>
              </button>
              <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                {activeImages.map((_: any, i: number) => (
                  <div key={i} onClick={e => { e.stopPropagation(); setActiveImg(i); }} style={{ width: i === activeImg ? '16px' : '6px', height: '6px', borderRadius: i === activeImg ? '3px' : '50%', background: i === activeImg ? 'var(--gold)' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
                ))}
              </div>
            </>
          )}
        </div>



        {/* Product Info Header */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '4px', height: '4px', background: 'var(--gold)', borderRadius: '50%' }} />
            {product.category?.name}
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--cream)', lineHeight: 1.2, fontWeight: 300 }}>{product.name}</h1>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '0.06em', marginTop: '6px' }}>SKU: {selectedVariant?.sku || product.sku}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <div style={{ width: '6px', height: '6px', background: availableStock > 0 ? 'var(--green)' : 'var(--gold)', borderRadius: '50%' }} />
            <div style={{ fontSize: '12px', color: availableStock > 0 ? 'var(--green)' : 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {availableStock > 0 ? `${availableStock} in stock` : 'Made to Order'}
            </div>
          </div>
        </div>

        {/* Mobile Pricing Row */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {displayPrice ? 'Price inclusive of taxes' : 'Price on request'}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '34px', color: 'var(--gold-light)', fontStyle: 'italic' }}>
              {displayPrice ? formatPrice(displayPrice) : '₹ —'}
            </div>
            {isB2B && (
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '0.06em' }}>
                GST {product.gstRate}% · B2B from {formatPrice(product.b2bPrice)}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {product.bisCertification && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginBottom: '4px' }}>
                <i className="ti ti-shield-check" style={{ fontSize: '13px', color: 'var(--gold)' }}></i>
                <span style={{ color: 'var(--gold)', fontSize: '10px', letterSpacing: '0.06em' }}>BIS Certified</span>
              </div>
            )}
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Luxury Living<br />Estate Heritage
            </div>
          </div>
        </div>

        {/* Variant Selector */}
        {variants.length > 0 && (
          <div style={{ padding: '20px 24px 0' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Select Finish</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {variants.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => { setSelectedVariant(v); setActiveImg(0); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '24px', 
                    border: selectedVariant?.id === v.id ? '1px solid rgba(196,160,90,0.4)' : '0.5px solid var(--border)', 
                    background: selectedVariant?.id === v.id ? 'rgba(196,160,90,0.08)' : 'var(--surface)',
                    color: selectedVariant?.id === v.id ? 'var(--gold-light)' : 'var(--text-muted)',
                    fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: v.name.toLowerCase().includes('gold') ? 'linear-gradient(135deg, #E2C97A, #C9A84C)' : 'linear-gradient(135deg, #D0D0D0, #A8A8A8)' }} />
                  {v.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Row */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Qty</div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px' }}>−</button>
            <div style={{ width: '36px', textAlign: 'center', fontSize: '14px', color: 'var(--cream)', fontFamily: 'var(--font-mono)' }}>{qty}</div>
            <button onClick={() => setQty(q => Math.min(availableStock || 999, q + 1))} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '18px' }}>+</button>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            Total: <span style={{ color: 'var(--gold-light)', fontSize: '13px' }}>{formatPrice(displayPrice * qty)}</span>
          </div>
        </div>

        {/* Primary Actions */}
        <div style={{ padding: '24px 24px 0', display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleAddToCart}
            disabled={availableStock === 0}
            className="btn-primary" 
            style={{ flex: 1, height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px' }}
          >
            <i className="ti ti-shopping-bag-plus" style={{ fontSize: '18px' }}></i>
            {availableStock === 0 ? 'Made to Order' : added ? '✓ Added to Cart' : 'Add to Cart'}
          </button>
          <button onClick={() => toggleItem(product)} className="btn-outline" style={{ width: '52px', height: '52px', borderRadius: '16px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={isWishlisted ? "ti ti-heart-filled" : "ti ti-heart"} style={{ fontSize: '20px', color: isWishlisted ? 'var(--gold)' : 'var(--text-dim)' }}></i>
          </button>
        </div>

        {/* Secondary Action — B2B only */}
        {isB2B && (
          <Link href={`/rfq?product=${product.slug}`} className="btn-outline" style={{ display: 'flex', height: '50px', borderRadius: '16px', border: '0.5px solid var(--border)', fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.06em', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '12px 24px 0', width: 'auto' }}>
            <i className="ti ti-file-text" style={{ fontSize: '16px' }}></i>
            Request Custom Quote
          </Link>
        )}

        {/* Trust — warranty only */}
        <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-shield-check" style={{ fontSize: '16px', color: 'var(--gold)' }}></i>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>2-Year Warranty Included</span>
        </div>

        {/* Pincode Section */}
        <div style={{ margin: '20px 20px 0', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Check Delivery Estimate</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <input 
              placeholder="Enter pincode" 
              maxLength={6} 
              value={pincode}
              onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
              style={{ flex: 1, minWidth: 0, background: 'var(--obsidian)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--cream)', outline: 'none' }}
            />
            <button onClick={() => handleCheckPincode(pincode)} className="btn-outline" style={{ flexShrink: 0, borderRadius: '12px', padding: '0 18px', fontSize: '13px', whiteSpace: 'nowrap' }}>Check</button>
          </div>
          {shippingRes && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-truck"></i> Estimated by {shippingRes.etd}
            </div>
          )}
        </div>

        {/* Description Card */}
        {product.description && (
          <div style={{ margin: '16px 20px 0', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '20px' }}>
            <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>Provenance & Craftsmanship</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {product.description}
            </div>
          </div>
        )}

        {/* Technical Specs Card */}
        <div style={{ margin: '12px 20px 0', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', borderBottom: '0.5px solid var(--border)' }}>Technical Specifications</div>
          <div style={{ padding: '0 20px' }}>
            {[
              { key: 'Material', val: product.materialAndFinish?.join(', ') || 'Metals' },
              { key: 'Bulb Type', val: product.bulbType?.join(', ') || 'LED' },
              { key: 'Style', val: product.style?.join(', ') || 'Modern' },
              { key: 'GST Rate', val: `${product.gstRate}%` }
            ].map(spec => (
              <div key={spec.key} style={{ display: 'flex', gap: '12px', padding: '14px 0', borderBottom: '0.5px dashed rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', flex: '0 0 90px' }}>{spec.key}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--cream)', flex: 1 }}>{spec.val}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── DESKTOP LAYOUT (hidden md:grid) ── */}
      <div className="hidden md:grid" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', gridTemplateColumns: '1fr 1fr', gap: '0', minHeight: '100vh' }}>
        
        {/* LEFT COLUMN: Gallery */}
        <div className="pdp-gallery" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="pdp-gallery-container" style={{ position: 'sticky', top: '100px' }}>
            {activeImages.length > 0 ? (
              <div className="pdp-main-image bg-[var(--surface2)] rounded border border-[var(--border)] overflow-hidden flex items-center justify-center max-h-[500px]">
                <img src={activeImages[activeImg]} alt={product.name} className="max-h-full max-w-full object-contain" />
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
                  <button key={i} onClick={() => setActiveImg(i)} className={i === activeImg ? 'pdp-thumb active' : 'pdp-thumb'}><img src={img} alt="" /></button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Info & Actions */}
        <div className="pdp-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '60px' }}>
          <div>
            <div className="pdp-breadcrumb" style={{ marginBottom: '16px' }}>
              <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> <span>/</span> 
              <Link href="/collections" style={{ color: 'inherit', textDecoration: 'none' }}>Collections</Link> <span>/</span> {product.name}
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
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 300, color: 'var(--gold-light)' }}>{formatPrice(displayPrice)}</div>
              {displayMrp > displayPrice && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-dim)', textDecoration: 'line-through' }}>{formatPrice(displayMrp)}</div>}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', marginLeft: 'auto' }}>{availableStock > 0 ? `${availableStock} in stock` : 'Made to Order'}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '8px' }}>
              {isB2B && `GST ${product.gstRate}% inclusive · B2B price from ${formatPrice(product.b2bPrice)}`}
            </div>
          </div>

          {product.description && (
            <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded my-4">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--gold)] mb-4">Provenance & Craftsmanship</div>
              <div className="space-y-4">{product.description.split('\n\n').map((para: string, i: number) => <p key={i} className="font-body text-[14px] text-[var(--text-muted)] leading-relaxed">{para}</p>)}</div>
            </div>
          )}

          {variants.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Select Variant</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {variants.map(v => (
                  <button key={v.id} onClick={() => { setSelectedVariant(v); setActiveImg(0); }} style={{ padding: '10px 18px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', background: selectedVariant?.id === v.id ? 'rgba(196,160,90,0.12)' : 'transparent', border: `1px solid ${selectedVariant?.id === v.id ? 'var(--gold)' : 'var(--border)'}`, color: selectedVariant?.id === v.id ? 'var(--gold)' : 'var(--text-muted)', transition: 'all 0.15s', opacity: v.stockQuantity === 0 ? 0.4 : 1 }}>{v.name}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Qty</div>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', width: '40px', height: '40px', cursor: 'pointer', fontSize: '16px' }}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text)', width: '40px', textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(availableStock || 999, q + 1))} disabled={qty >= availableStock} style={{ background: 'transparent', border: 'none', color: qty >= availableStock ? 'var(--border)' : 'var(--text-muted)', width: '40px', height: '40px', cursor: qty >= availableStock ? 'not-allowed' : 'pointer', fontSize: '16px' }}>+</button>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Total: <span style={{ color: 'var(--gold-light)' }}>{formatPrice(displayPrice * qty)}</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddToCart} disabled={availableStock === 0}>{availableStock === 0 ? 'Made to Order' : added ? '✓ Added to Cart' : 'Add to Cart'}</button>
              <button className="btn-outline" style={{ width: '56px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => toggleItem(product)}><span style={{ fontSize: '20px', color: isWishlisted ? 'var(--gold)' : 'var(--text-dim)' }}>{isWishlisted ? '♥' : '♡'}</span></button>
            </div>
            {isB2B && (
              <button className="btn-outline w-full" onClick={() => router.push(`/rfq?product=${product.slug}`)}>Request Quote</button>
            )}
          </div>

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '20px', borderRadius: '4px', marginTop: '8px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Check Delivery Estimate</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input placeholder="Enter Pincode" maxLength={6} value={pincode} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setPincode(val); if (val.length === 6) handleCheckPincode(val); else setShippingRes(null); }} style={{ flex: 1, background: 'var(--obsidian)', border: '1px solid var(--border)', color: 'var(--cream)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }} />
              <button onClick={() => handleCheckPincode(pincode)} disabled={pincode.length !== 6 || checkingPincode} className="btn-outline" style={{ padding: '0 20px', fontSize: '11px', height: '42px' }}>{checkingPincode ? '...' : 'Check'}</button>
            </div>
            {shippingRes && <div style={{ marginTop: '14px', animation: 'fadeIn 0.3s ease' }}><div style={{ color: 'var(--green)', fontSize: '11px' }}>✓ Delivery to {shippingRes.city} by {shippingRes.etd}</div></div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px' }}>
            {['Free Installation', 'GST Invoice', '2-Year Warranty', 'Custom Dimensions'].map(t => <div key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--gold)' }}>✓</span> {t}</div>)}
          </div>
        </div>

      </div>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <button onClick={() => setLightboxOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-x"></i>
          </button>
          <div
            onClick={e => e.stopPropagation()}
            onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={e => handleSwipe(e.changedTouches[0].clientX)}
            style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 60px' }}
          >
            <img src={activeImages[activeImg]} alt={product.name} style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
            {activeImages.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => Math.max(0, i - 1))} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: activeImg === 0 ? 0.3 : 1 }}>
                  <i className="ti ti-chevron-left"></i>
                </button>
                <button onClick={() => setActiveImg(i => Math.min(activeImages.length - 1, i + 1))} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: activeImg === activeImages.length - 1 ? 0.3 : 1 }}>
                  <i className="ti ti-chevron-right"></i>
                </button>
                <div style={{ position: 'absolute', bottom: '-32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                  {activeImages.map((_: any, i: number) => (
                    <div key={i} onClick={() => setActiveImg(i)} style={{ width: i === activeImg ? '18px' : '7px', height: '7px', borderRadius: i === activeImg ? '4px' : '50%', background: i === activeImg ? 'var(--gold)' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s', cursor: 'pointer' }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
