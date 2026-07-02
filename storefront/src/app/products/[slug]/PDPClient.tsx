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
import Image from 'next/image';

type Variant = {
  id: string;
  name: string;
  sku: string;
  d2cPrice: number | null;
  mrp: number | null;
  stockQuantity: number;
  images: string[];
  actualHeight?: number | null;
  actualWidth?: number | null;
  actualDepth?: number | null;
  dimensionUnit?: string | null;
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

  const getDimensions = () => {
    const h = selectedVariant?.actualHeight ?? product.actualHeight;
    const w = selectedVariant?.actualWidth ?? product.actualWidth;
    const d = selectedVariant?.actualDepth ?? product.actualDepth;
    const unit = selectedVariant?.dimensionUnit ?? product.dimensionUnit ?? 'INCH';
    const suffix = unit === 'CM' ? ' cm' : '"';

    if (h || w || d) {
      const parts = [];
      if (h) parts.push(`${h}${suffix} H`);
      if (w) parts.push(`${w}${suffix} W`);
      if (d) parts.push(`${d}${suffix} D`);
      return parts.join(' × ');
    }
    return product.dimensions || 'Standard';
  };

  return (
    <>
      <div className="pdp-wrapper" style={{ background: 'var(--obsidian)', minHeight: '100vh' }}>

        {/* ── MOBILE LAYOUT (md:hidden) ── */}
        <div className="md:hidden" style={{ paddingBottom: '40px' }}>

          {/* Mobile Spacer (Buttons removed as per request) */}
          <div style={{ height: '16px' }}></div>

          {/* Product Image Gallery */}
          <div
            onClick={() => activeImages.length > 0 && setLightboxOpen(true)}
            onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={e => handleSwipe(e.changedTouches[0].clientX)}
            style={{ margin: '0 20px', position: 'relative', height: '320px', borderRadius: '24px', border: '0.5px solid var(--border)', overflow: 'hidden', cursor: activeImages.length > 0 ? 'zoom-in' : 'default' }}
          >
            {activeImages.length > 0 ? (
              <Image
                src={activeImages[activeImg]}
                alt={product.name}
                fill
                priority
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(150deg, #1a160a 0%, #0d0b06 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100" height="130" viewBox="0 0 100 130" stroke="var(--gold)" fill="none" opacity="0.6">
                  <path d="M50 5 L50 35" strokeDasharray="3 3" />
                  <path d="M20 60 Q50 25 80 60" strokeWidth="1.5" />
                  <circle cx="20" cy="82" r="4" fill="var(--gold)" />
                  <circle cx="80" cy="82" r="4" fill="var(--gold)" />
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
            <button
              onClick={() => router.push(`/rfq?product=${product.slug}`)}
              className="btn-outline"
              style={{ display: 'flex', height: '50px', borderRadius: '16px', border: '0.5px solid var(--border)', fontSize: '13px', color: 'var(--gold)', letterSpacing: '0.06em', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '12px 24px 0', width: 'auto' }}
            >
              <i className="ti ti-file-text" style={{ fontSize: '16px' }}></i>
              Request Custom Quote
            </button>
          )}

          {/* Trust — Brand Highlights */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)', padding: '20px 24px', margin: '24px 0 0' }}>
            {[
              { icon: 'ti-award', label: 'Heritage Craftsmanship' },
              { icon: 'ti-truck-delivery', label: 'Pan-India Delivery' },
              { icon: 'ti-shield-check', label: '2-Year Warranty' },
              { icon: 'ti-sparkles', label: 'Curated Brilliance' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={`ti ${item.icon}`} style={{ color: 'var(--gold)', fontSize: '15px' }}></i>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</span>
              </div>
            ))}
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
                { key: 'Dimensions', val: getDimensions() },
                { key: 'Weight', val: product.weight ? `${product.weight} kg` : 'Standard' }
              ].map(spec => (
                <div key={spec.key} style={{ display: 'flex', gap: '12px', padding: '14px 0', borderBottom: '0.5px dashed rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', flex: '0 0 90px' }}>{spec.key}</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--cream)', flex: 1 }}>{spec.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ultra-slim Footer */}
          <div style={{ textAlign: 'center', padding: '30px 20px 0', fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Estate Heritage · Authenticity Guaranteed
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (hidden md:grid) ── */}
        <div className="hidden md:grid" style={{ maxWidth: '1440px', margin: '0 auto', padding: '60px 60px 80px 60px', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '80px', minHeight: '100vh' }}>

          {/* LEFT COLUMN: Gallery */}
          <div className="pdp-gallery" style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'static', height: 'auto', overflow: 'visible', background: 'transparent' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeImages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Main Active Image Container */}
                  <div
                    className="bg-[var(--surface2)] rounded-2xl border border-[var(--border)] overflow-hidden flex items-center justify-center relative cursor-zoom-in"
                    style={{ height: '600px' }}
                    onClick={() => setLightboxOpen(true)}
                  >
                    <Image
                      src={activeImages[activeImg]}
                      alt={`${product.name} - view ${activeImg + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      priority
                    />

                    {/* Left & Right Chevron Arrows */}
                    {activeImages.length > 1 && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); setActiveImg(i => Math.max(0, i - 1)); }}
                          style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', opacity: activeImg === 0 ? 0.3 : 1 }}
                          disabled={activeImg === 0}
                        >
                          <i className="ti ti-chevron-left" style={{ fontSize: '20px' }}></i>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setActiveImg(i => Math.min(activeImages.length - 1, i + 1)); }}
                          style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', opacity: activeImg === activeImages.length - 1 ? 0.3 : 1 }}
                          disabled={activeImg === activeImages.length - 1}
                        >
                          <i className="ti ti-chevron-right" style={{ fontSize: '20px' }}></i>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails Row */}
                  {activeImages.length > 1 && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {activeImages.map((img: string, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setActiveImg(idx)}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '12px',
                            border: idx === activeImg ? '2px solid var(--gold)' : '1px solid var(--border)',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            opacity: idx === activeImg ? 1 : 0.6,
                            transition: 'all 0.2s'
                          }}
                        >
                          <Image
                            src={img}
                            alt={`${product.name} thumbnail ${idx + 1}`}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[var(--surface2)] rounded-2xl border border-[var(--border)] flex items-center justify-center min-h-[600px]">
                  <svg width="120" height="160" viewBox="0 0 100 120" stroke="var(--gold)" fill="none" opacity="0.3">
                    <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M20 70 Q50 30 80 70" strokeWidth="2" />
                    <circle cx="50" cy="95" r="4" fill="var(--gold-light)" stroke="none" />
                  </svg>
                </div>
              )}
            </div>

            {/* Description & Technical Specs - Moved here to fill space below product image */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '20px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>The Masterpiece</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  {product.description || 'Discover the essence of luxury with this masterfully crafted piece, designed to bring sustainable brilliance to your grand spaces.'}
                </div>
              </div>

              <div style={{ background: 'var(--surface2)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text)' }}>Specifications</div>
                <div style={{ padding: '8px 24px' }}>
                  {[
                    { key: 'Material & Finish', val: product.materialAndFinish?.join(', ') || 'Estate Metals' },
                    { key: 'Illumination', val: product.bulbType?.join(', ') || 'LED Engine' },
                    { key: 'Design Style', val: product.style?.join(', ') || 'Modern Heritage' },
                    { key: 'Dimensions', val: getDimensions() },
                    { key: 'Ship Weight', val: product.weight ? `${product.weight} kg` : 'Standard' },
                    { key: 'Compliance', val: `BIS Certified · GST ${product.gstRate}%` }
                  ].map(spec => (
                    <div key={spec.key} style={{ display: 'flex', padding: '16px 0', borderBottom: spec.key === 'Compliance' ? 'none' : '1px dashed var(--border)' }}>
                      <div style={{ flex: '0 0 140px', fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{spec.key}</div>
                      <div style={{ flex: 1, fontSize: '14px', color: 'var(--cream)', fontFamily: 'var(--font-serif)' }}>{spec.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Info & Actions (Sticky) */}
          <div className="pdp-info" style={{ paddingTop: '0px' }}>
            <div style={{ position: 'sticky', top: '10px', display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '-18px' }}>

              {/* Header Info */}
              <div>
                <div className="pdp-breadcrumb" style={{ marginBottom: '24px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                  <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
                  <span style={{ margin: '0 10px', opacity: 0.5 }}>/</span>
                  <Link href="/collections" style={{ color: 'inherit', textDecoration: 'none' }}>Collections</Link>
                  <span style={{ margin: '0 10px', opacity: 0.5 }}>/</span>
                  <span style={{ color: 'var(--gold-light)' }}>{product.name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ height: '1px', width: '24px', background: 'var(--gold)' }}></div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{product.category?.name || 'Exclusive Design'}</div>
                </div>

                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '56px', color: 'var(--cream)', lineHeight: 1.1, fontWeight: 300, marginBottom: '16px' }}>{product.name}</h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>SKU: {selectedVariant?.sku || product.sku}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', background: availableStock > 0 ? 'var(--green)' : 'var(--gold)', borderRadius: '50%' }} />
                    <div style={{ fontSize: '11px', color: availableStock > 0 ? 'var(--green)' : 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {availableStock > 0 ? `${availableStock} Units Available` : 'Crafted to Order'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div style={{ padding: '32px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', color: 'var(--gold-light)', fontStyle: 'italic' }}>{formatPrice(displayPrice)}</div>
                  {displayMrp > displayPrice && (
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--text-dim)', textDecoration: 'line-through', opacity: 0.6 }}>{formatPrice(displayMrp)}</div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', letterSpacing: '0.05em' }}>
                  {isB2B ? `Inclusive of GST ${product.gstRate}% · B2B pricing active` : 'Price inclusive of all taxes'}
                </div>
              </div>

              {/* Finish Selector */}
              {variants.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Available Finishes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVariant(v); setActiveImg(0); }}
                        style={{
                          padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                          background: selectedVariant?.id === v.id ? 'var(--gold)' : 'var(--surface2)',
                          border: '1px solid var(--border)',
                          color: selectedVariant?.id === v.id ? 'var(--obsidian)' : 'var(--text-muted)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          fontWeight: selectedVariant?.id === v.id ? 600 : 400,
                          display: 'flex', alignItems: 'center', gap: '10px'
                        }}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: v.name.toLowerCase().includes('gold') ? '#E2C97A' : '#D0D0D0' }} />
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '50px', height: '50px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>−</button>
                    <div style={{ width: '40px', textAlign: 'center', fontSize: '16px', color: 'var(--cream)', fontFamily: 'var(--font-mono)' }}>{qty}</div>
                    <button onClick={() => setQty(q => Math.min(availableStock || 999, q + 1))} style={{ width: '50px', height: '50px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>+</button>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ flex: 1, height: '54px', borderRadius: '12px', fontSize: '14px', whiteSpace: 'nowrap' }}
                    onClick={handleAddToCart}
                    disabled={availableStock === 0}
                  >
                    {availableStock === 0 ? 'Notify Availability' : added ? '✓ Added to Cart' : 'Add to Cart'}
                  </button>

                  <button
                    onClick={() => toggleItem(product)}
                    style={{ width: '54px', height: '54px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface2)', color: isWishlisted ? 'var(--gold)' : 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                  >
                    <i className={isWishlisted ? "ti ti-heart-filled" : "ti ti-heart"} style={{ fontSize: '22px' }}></i>
                  </button>
                </div>

                {isB2B && (
                  <button
                    className="btn-outline w-full"
                    style={{ height: '54px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    onClick={() => router.push(`/rfq?product=${product.slug}`)}
                  >
                    <i className="ti ti-file-text"></i>
                    Request Enterprise Quotation
                  </button>
                )}
              </div>

              {/* Details & Delivery */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '24px', borderRadius: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Delivery Check</div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      placeholder="Enter Pincode"
                      maxLength={6}
                      value={pincode}
                      onChange={e => { const val = e.target.value.replace(/\D/g, ''); setPincode(val); if (val.length === 6) handleCheckPincode(val); else setShippingRes(null); }}
                      style={{ flex: 1, minWidth: 0, height: '46px', boxSizing: 'border-box', background: 'var(--obsidian)', border: '1px solid var(--border)', color: 'var(--cream)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '14px', outline: 'none', borderRadius: '8px' }}
                    />
                    <button onClick={() => handleCheckPincode(pincode)} disabled={pincode.length !== 6 || checkingPincode} className="btn-outline" style={{ padding: '0 24px', fontSize: '11px', height: '46px', minHeight: 'none', boxSizing: 'border-box', borderRadius: '8px' }}>{checkingPincode ? '...' : 'Check'}</button>
                  </div>
                  {shippingRes && (
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                      <i className="ti ti-truck"></i>
                      Expected Delivery to {shippingRes.city} by {shippingRes.etd}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { icon: 'ti-award', label: 'Heritage Craftsmanship' },
                    { icon: 'ti-truck-delivery', label: 'Pan-India Delivery' },
                    { icon: 'ti-shield-check', label: '2-Year Warranty' },
                    { icon: 'ti-sparkles', label: 'Curated Brilliance' }
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <i className={`ti ${item.icon}`} style={{ color: 'var(--gold)', fontSize: '14px' }}></i>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

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
                    {activeImages.map((_: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: idx === activeImg ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                          transition: 'all 0.3s ease',
                          transform: idx === activeImg ? 'scale(1.3)' : 'scale(1)'
                        }}
                      />
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
    </>
  );
}
