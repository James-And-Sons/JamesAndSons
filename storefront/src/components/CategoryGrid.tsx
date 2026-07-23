'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/utils';

type Category = {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
  image?: string | null;
  images?: string[];
};

type CategoryGridProps = {
  categories?: Category[];
  products?: Product[];
};

export default function CategoryGrid({ categories = [], products = [] }: CategoryGridProps) {
  const displayCategories = categories.length > 0 ? categories : [
    { id: '1', name: 'Chandeliers', slug: 'chandeliers', _count: { products: 0 }, image: null, images: [] },
    { id: '2', name: 'Floor Lamps', slug: 'floor-lamps', _count: { products: 0 }, image: null, images: [] },
    { id: '3', name: 'Wall Brackets', slug: 'wall-brackets', _count: { products: 0 }, image: null, images: [] },
    { id: '4', name: 'Hanging Lamps', slug: 'hanging-lamps', _count: { products: 0 }, image: null, images: [] },
    { id: '5', name: 'Table Lamps', slug: 'table-lamps', _count: { products: 0 }, image: null, images: [] },
  ];

  // Map each category slug to its cover image, or fallback to a deterministic product image from that category
  const categoryImages = useMemo(() => {
    const map: Record<string, string> = {};

    displayCategories.forEach(cat => {
      if (cat.image) {
        map[cat.slug] = cat.image;
        return;
      }

      const catSlug = (cat.slug || '').toLowerCase().replace(/[-_]/g, '');
      const catName = (cat.name || '').toLowerCase();

      // Find all products matching this category
      const matchingProducts = products.filter(p => {
        const pCol = (p.collection || '').toLowerCase().replace(/[-_]/g, '');
        return pCol.includes(catSlug) || catSlug.includes(pCol) || pCol.includes(catName);
      });

      // Extract all product images for this category
      const pool = matchingProducts.flatMap(p => [
        ...(p.images || []),
        ...(p.whiteBackgroundImages || [])
      ]).filter(Boolean);

      if (pool.length > 0) {
        // Deterministically select an image from the pool to avoid hydration mismatches
        let hash = 0;
        const seed = cat.id || cat.slug || '';
        for (let i = 0; i < seed.length; i++) {
          hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % pool.length;
        map[cat.slug] = pool[index];
      }
    });

    return map;
  }, [displayCategories, products]);

  // Category icon mapping as fallback
  const categoryIcons: Record<string, string> = {
    chandeliers: 'ti-lamp',
    'floor-lamps': 'ti-lamp-2',
    'wall-brackets': 'ti-sun',
    'hanging-lamps': 'ti-bulb',
    'table-lamps': 'ti-device-desktop',
  };

  const mainCat = displayCategories[0];
  const otherCats = displayCategories.slice(1, 5);

  const mainCatImage = categoryImages[mainCat?.slug];

  return (
    <section className="section" id="categories">
      <div className="section-header">
        <div>
          <div className="section-label">Illuminate Every Style</div>
          <h2 className="section-title">Shop by <em>Category</em></h2>
        </div>
        <Link href="/collections" className="link-all nav-haptic">View All Collections</Link>
      </div>

      {/* Desktop Grid */}
      <div className="space-grid hidden md:grid">
        {/* Main large category card */}
        <Link href={`/collections?category=${mainCat.slug}`} className="space-card block overflow-hidden group">
          {mainCatImage ? (
            <Image
              src={mainCatImage}
              alt={mainCat.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="space-card-bg" style={{ background: 'linear-gradient(135deg, var(--surface2) 0%, #1a1508 100%)' }} />
          )}

          {/* Dark Luxury Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(10,10,10,0.85) 100%)',
              zIndex: 1,
            }}
          />

          {!mainCatImage && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <i className={`ti ${categoryIcons[mainCat.slug] || 'ti-lamp'}`} style={{ fontSize: '80px', color: 'var(--gold)', opacity: 0.25 }} />
            </div>
          )}

          <div className="space-card-arrow" style={{ zIndex: 3 }}>↗</div>
          <div className="space-card-content" style={{ zIndex: 3 }}>
            <div className="space-card-name">{mainCat.name}</div>
            <div className="space-card-count">{mainCat._count?.products || 0} Designs</div>
          </div>
        </Link>

        {/* Right side 4 categories */}
        <div className="space-grid-right">
          {otherCats.map((cat) => {
            const catImage = categoryImages[cat.slug];
            return (
              <Link key={cat.id} href={`/collections?category=${cat.slug}`} className="space-card block overflow-hidden group">
                {catImage ? (
                  <Image
                    src={catImage}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="space-card-bg" style={{ background: 'linear-gradient(135deg, var(--surface2) 0%, #140f04 100%)' }} />
                )}

                {/* Dark Luxury Gradient Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(10,10,10,0.85) 100%)',
                    zIndex: 1,
                  }}
                />

                {!catImage && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                    <i className={`ti ${categoryIcons[cat.slug] || 'ti-lamp'}`} style={{ fontSize: '42px', color: 'var(--gold)', opacity: 0.25 }} />
                  </div>
                )}

                <div className="space-card-arrow" style={{ zIndex: 3 }}>↗</div>
                <div className="space-card-content" style={{ zIndex: 3 }}>
                  <div className="space-card-name">{cat.name}</div>
                  <div className="space-card-count">{cat._count?.products || 0} Designs</div>
                </div>
              </Link>
            );
          })}

          {Array.from({ length: Math.max(0, 4 - otherCats.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="space-card block opacity-20 pointer-events-none">
              <div className="space-card-bg" />
              <div className="space-card-content"><div className="space-card-name">Coming Soon</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Horizontal Scroll */}
      <div className="mobile-spaces-scroll md:hidden">
        {displayCategories.map((cat, index) => {
          const bgClass = `mobile-sc-${(index % 4) + 1}`;
          const catImage = categoryImages[cat.slug];
          return (
            <Link
              key={cat.id}
              href={`/collections?category=${cat.slug}`}
              className={`mobile-space-card ${bgClass} relative overflow-hidden group`}
            >
              {catImage ? (
                <Image
                  src={catImage}
                  alt={cat.name}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              ) : (
                <i className={`ti ${categoryIcons[cat.slug] || 'ti-lamp'} mobile-space-icon`} aria-hidden="true" />
              )}

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(10,10,10,0.85) 100%)',
                  zIndex: 1,
                }}
              />

              <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="mobile-space-name">{cat.name}</div>
                <div className="mobile-space-count">{cat._count?.products || 0} Designs</div>
              </div>
              <div className="mobile-space-arrow" style={{ zIndex: 2 }}><i className="ti ti-arrow-up-right" /></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
