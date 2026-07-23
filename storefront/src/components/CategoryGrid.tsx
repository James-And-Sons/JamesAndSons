import Link from 'next/link';
import Image from 'next/image';

type Category = {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
};

export default function CategoryGrid({ categories = [] }: { categories: Category[] }) {
  const displayCategories = categories.length > 0 ? categories : [
    { id: '1', name: 'Chandeliers', slug: 'chandeliers', _count: { products: 0 } },
    { id: '2', name: 'Floor Lamps', slug: 'floor-lamps', _count: { products: 0 } },
    { id: '3', name: 'Wall Brackets', slug: 'wall-brackets', _count: { products: 0 } },
    { id: '4', name: 'Hanging Lamps', slug: 'hanging-lamps', _count: { products: 0 } },
    { id: '5', name: 'Table Lamps', slug: 'table-lamps', _count: { products: 0 } },
  ];

  // Category icon mapping
  const categoryIcons: Record<string, string> = {
    chandeliers: 'ti-lamp',
    'floor-lamps': 'ti-lamp-2',
    'wall-brackets': 'ti-sun',
    'hanging-lamps': 'ti-bulb',
    'table-lamps': 'ti-device-desktop',
  };

  const mainCat = displayCategories[0];
  const otherCats = displayCategories.slice(1, 5);

  return (
    <section className="section" id="categories">
      <div className="section-header">
        <div>
          <div className="section-label">Illuminate Every Style</div>
          <h2 className="section-title">Shop by <em>Category</em></h2>
        </div>
        <Link href="/collections" className="link-all">View All Collections</Link>
      </div>

      {/* Desktop Grid — mirrors SpaceGrid layout */}
      <div className="space-grid hidden md:grid">
        {/* Main large category */}
        <Link href={`/collections?category=${mainCat.slug}`} className="space-card block">
          <div className="space-card-bg" style={{ background: 'linear-gradient(135deg, var(--surface2) 0%, #1a1508 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <i className={`ti ${categoryIcons[mainCat.slug] || 'ti-lamp'}`} style={{ fontSize: '80px', color: 'var(--gold)', opacity: 0.18 }} />
          </div>
          <div className="space-card-arrow">↗</div>
          <div className="space-card-content">
            <div className="space-card-name">{mainCat.name}</div>
            <div className="space-card-count">{mainCat._count.products} Designs</div>
          </div>
        </Link>

        <div className="space-grid-right">
          {otherCats.map((cat) => (
            <Link key={cat.id} href={`/collections?category=${cat.slug}`} className="space-card block">
              <div className="space-card-bg" style={{ background: 'linear-gradient(135deg, var(--surface2) 0%, #140f04 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <i className={`ti ${categoryIcons[cat.slug] || 'ti-lamp'}`} style={{ fontSize: '42px', color: 'var(--gold)', opacity: 0.18 }} />
              </div>
              <div className="space-card-arrow">↗</div>
              <div className="space-card-content">
                <div className="space-card-name">{cat.name}</div>
                <div className="space-card-count">{cat._count.products} Designs</div>
              </div>
            </Link>
          ))}
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
          return (
            <Link
              key={cat.id}
              href={`/collections?category=${cat.slug}`}
              className={`mobile-space-card ${bgClass}`}
            >
              <i className={`ti ${categoryIcons[cat.slug] || 'ti-lamp'} mobile-space-icon`} aria-hidden="true" />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="mobile-space-name">{cat.name}</div>
                <div className="mobile-space-count">{cat._count.products} Designs</div>
              </div>
              <div className="mobile-space-arrow" style={{ zIndex: 2 }}><i className="ti ti-arrow-up-right" /></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
