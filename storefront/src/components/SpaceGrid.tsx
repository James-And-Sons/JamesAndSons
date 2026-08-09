import Link from "next/link";
import Image from "next/image";

type Space = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  images: string[];
  _count: { products: number };
};

export default function SpaceGrid({ spaces = [] }: { spaces: Space[] }) {
  // If no spaces are passed (fallback), we will show a placeholder or mock data
  // instead of returning null, so the section is visible on the home screen.

  // We take up to 5 spaces for the homepage grid
  const displaySpaces =
    spaces.length > 0
      ? spaces
      : [
          {
            id: "1",
            name: "Living Room",
            slug: "living-room",
            image: null,
            images: [],
            _count: { products: 0 },
          },
          {
            id: "2",
            name: "Dining Room",
            slug: "dining-room",
            image: null,
            images: [],
            _count: { products: 0 },
          },
          {
            id: "3",
            name: "Bedroom",
            slug: "bedroom",
            image: null,
            images: [],
            _count: { products: 0 },
          },
          {
            id: "4",
            name: "Office",
            slug: "office",
            image: null,
            images: [],
            _count: { products: 0 },
          },
          {
            id: "5",
            name: "Foyer",
            slug: "foyer",
            image: null,
            images: [],
            _count: { products: 0 },
          },
        ];

  const mainSpace = displaySpaces[0];
  const otherSpaces = displaySpaces.slice(1, 5);

  return (
    <section className="section" id="spaces">
      <div className="section-header">
        <div>
          <div className="section-label">Curated Environs</div>
          <h2 className="section-title">
            Shop by <em>Space</em>
          </h2>
        </div>
        <Link href="/spaces" className="link-all">
          View All Spaces
        </Link>
      </div>

      <div className="space-grid desktop-only-grid">
        {/* Main large space */}
        <Link
          href={`/collections?space=${encodeURIComponent(mainSpace.name)}`}
          className="space-card block"
        >
          {mainSpace.image ? (
            <Image
              src={mainSpace.image}
              alt={mainSpace.name}
              fill
              priority
              className="space-card-bg object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="space-card-bg"></div>
          )}

          {/* Keep the signature chandelier icon for the main card if it's the foyer or if no image */}
          {!mainSpace.image && (
            <svg
              className="space-card-chandelier"
              width="120"
              height="150"
              viewBox="0 0 100 120"
              stroke="#C4A05A"
              fill="none"
            >
              <path d="M50 10 L50 80" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M20 60 Q50 90 80 60" strokeWidth="1.5" />
              <line
                x1="20"
                y1="60"
                x2="20"
                y2="75"
                stroke="#E2C882"
                strokeWidth="2"
              />
              <circle cx="20" cy="80" r="3" fill="#C4A05A" />
              <line
                x1="80"
                y1="60"
                x2="80"
                y2="75"
                stroke="#E2C882"
                strokeWidth="2"
              />
              <circle cx="80" cy="80" r="3" fill="#C4A05A" />
              <line
                x1="50"
                y1="80"
                x2="50"
                y2="100"
                stroke="#E2C882"
                strokeWidth="2"
              />
              <circle cx="50" cy="105" r="4" fill="#F5E9C8" />
            </svg>
          )}

          <div className="space-card-arrow">↗</div>
          <div className="space-card-content">
            <div className="space-card-name">{mainSpace.name}</div>
            <div className="space-card-count">
              {mainSpace._count.products} Designs
            </div>
          </div>
        </Link>

        <div className="space-grid-right">
          {otherSpaces.map((space) => (
            <Link
              key={space.id}
              href={`/collections?space=${encodeURIComponent(space.name)}`}
              className="space-card block"
            >
              {space.image ? (
                <Image
                  src={space.image}
                  alt={space.name}
                  fill
                  className="space-card-bg object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              ) : (
                <div className="space-card-bg"></div>
              )}
              <div className="space-card-arrow">↗</div>
              <div className="space-card-content">
                <div className="space-card-name">{space.name}</div>
                <div className="space-card-count">
                  {space.slug.includes("hotel") ||
                  space.slug.includes("conference")
                    ? "B2B Exclusive"
                    : `${space._count.products} Designs`}
                </div>
              </div>
            </Link>
          ))}

          {/* Fill empty spots if less than 5 spaces to maintain grid layout */}
          {Array.from({ length: Math.max(0, 4 - otherSpaces.length) }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="space-card block opacity-20 pointer-events-none"
              >
                <div className="space-card-bg"></div>
                <div className="space-card-content">
                  <div className="space-card-name">Coming Soon</div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Mobile Spaces Scroll */}
      <div className="mobile-spaces-scroll touch-scroll-view">
        {displaySpaces.map((space, index) => {
          const bgClass = `mobile-sc-${(index % 4) + 1}`;
          const iconClass =
            index === 0
              ? "ti-home"
              : index === 1
                ? "ti-glass"
                : index === 2
                  ? "ti-bed"
                  : index === 3
                    ? "ti-briefcase"
                    : "ti-door";

          return (
            <Link
              key={space.id}
              href={`/collections?space=${encodeURIComponent(space.name)}`}
              className={`mobile-space-card relative overflow-hidden ${space.image ? "has-image" : bgClass}`}
            >
              {space.image && (
                <Image
                  src={space.image}
                  alt={space.name}
                  fill
                  className="absolute inset-0 object-cover"
                  sizes="(max-width: 768px) 140px, 100vw"
                  priority={index < 2}
                />
              )}
              {!space.image && (
                <i
                  className={`ti ${iconClass} mobile-space-icon`}
                  aria-hidden="true"
                ></i>
              )}
              <div style={{ position: "relative", zIndex: 2 }}>
                <div className="mobile-space-name">{space.name}</div>
                <div className="mobile-space-count">
                  {space._count.products} Designs
                </div>
              </div>
              <div className="mobile-space-arrow" style={{ zIndex: 2 }}>
                <i className="ti ti-arrow-up-right"></i>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
