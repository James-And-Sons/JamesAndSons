'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, formatPrice } from '@/lib/utils';
import Link from 'next/link';

type Props = { products: Product[], onClose: () => void };

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchModal({ products, onClose }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = debouncedQuery.trim().length < 2 ? [] : products.filter(p =>
    p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    p.collection.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    p.spaces.some(s => s.toLowerCase().includes(debouncedQuery.toLowerCase()))
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(6px)' }} />

      {/* Modal */}
      <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', width: '640px', maxWidth: 'calc(100vw - 40px)', background: 'var(--void)', border: '1px solid var(--border-gold)', zIndex: 301, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search collections, spaces, SKU..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--text)', padding: '18px 16px' }}
          />
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ESC</button>
        </div>

        {/* Results */}
        {debouncedQuery.trim().length >= 2 && (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, color: 'var(--text-muted)' }}>No results for "{debouncedQuery}"</div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-dim)', marginTop: '8px', textTransform: 'uppercase' }}>Try a product name, collection, or space</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                </div>
                {results.map(product => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: '48px', height: '48px', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="28" height="36" viewBox="0 0 100 120" stroke="var(--gold)" fill="none">
                        <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3"/>
                        <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7"/>
                        <circle cx="50" cy="90" r="4" fill="var(--gold-light)" stroke="none"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{product.collection} · {product.sku}</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 300, color: 'var(--cream)', marginTop: '3px' }}>{product.name}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 300, color: 'var(--gold-light)', flexShrink: 0 }}>
                      {formatPrice(product.d2cPrice)}
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}

        {/* Default state hints */}
        {debouncedQuery.trim().length < 2 && (
          <div style={{ padding: '20px 20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '12px' }}>Popular Searches</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Crystal', 'LED', 'Grand Foyer', 'Modern', 'Heritage', 'Dining'].map(hint => (
                <button key={hint} onClick={() => setQuery(hint)} className="filter-btn" style={{ padding: '5px 12px' }}>{hint}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
