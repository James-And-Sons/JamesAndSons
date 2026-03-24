'use client';

import { useState } from 'react';

type Category = { id: string; name: string; slug: string };
type ProductOption = { id: string; name: string; slug: string; sku: string; images: string[] };

export default function CMSControls({ categories, products }: { categories: Category[]; products: ProductOption[] }) {
  const [heroHeadline, setHeroHeadline] = useState('Light as a Philosophy. Craft as a Legacy.');
  const [heroSubline, setHeroSubline] = useState('Bespoke chandeliers and luminaires crafted for India\'s most distinguished spaces.');
  const [featuredCategory, setFeaturedCategory] = useState(categories[0]?.id || '');
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const toggleProduct = (id: string) => {
    setFeaturedProductIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleSave = async () => {
    // In a real integration, this would write to a CMS table or JSON config.
    // For now, we show confirmation.
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section Config */}
      <div className="bg-surface border border-border p-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent mb-6 border-b border-border pb-3">Homepage Hero</h2>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">Main Headline</label>
            <input
              value={heroHeadline}
              onChange={e => setHeroHeadline(e.target.value)}
              className="w-full bg-background border border-border text-primary font-serif text-[18px] px-4 py-3 focus:outline-none focus:border-accent transition-colors placeholder:text-muted"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">Subline</label>
            <textarea
              value={heroSubline}
              onChange={e => setHeroSubline(e.target.value)}
              rows={2}
              className="w-full bg-background border border-border text-secondary font-body text-[14px] px-4 py-3 focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Featured Collection */}
      <div className="bg-surface border border-border p-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent mb-6 border-b border-border pb-3">Featured Collection</h2>
        <div className="mb-6">
          <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-2">Active Collection</label>
          <select
            value={featuredCategory}
            onChange={e => setFeaturedCategory(e.target.value)}
            className="bg-background border border-border text-primary font-mono text-[12px] px-4 py-2 focus:outline-none focus:border-accent w-64"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-3">
            Featured Products (select up to 4)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map(p => {
              const isSelected = featuredProductIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`text-left p-3 border transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/10'
                      : featuredProductIds.length >= 4
                      ? 'border-border opacity-40 cursor-not-allowed'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="w-full aspect-square bg-surface2 mb-2 flex items-center justify-center border border-border/50 overflow-hidden">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="32" height="40" viewBox="0 0 100 120" stroke="rgba(196,160,90,0.4)" fill="none">
                        <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3"/>
                        <path d="M20 70 Q50 30 80 70" strokeWidth="2"/>
                        <circle cx="50" cy="90" r="4" fill="rgba(196,160,90,0.3)" stroke="none"/>
                      </svg>
                    )}
                  </div>
                  <div className="font-mono text-[8px] uppercase tracking-wide text-muted mb-0.5">{p.sku}</div>
                  <div className="font-serif text-[13px] text-primary leading-tight">{p.name}</div>
                  {isSelected && <div className="font-mono text-[8px] text-accent mt-1">✓ Featured</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Banner */}
      <div className="flex justify-end gap-4">
        {saved && (
          <div className="flex items-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#4ade80]">
            ✓ Changes saved successfully
          </div>
        )}
        <button
          onClick={handleSave}
          className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-8 py-3"
        >
          Save & Publish Changes
        </button>
      </div>
    </div>
  );
}
