import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <>
      {/* Desktop Hero */}
      <section className="hero hidden md:flex">
        <div className="hero-bg"></div>

        {/* Abstract Chandelier Graphics */}
        <div className="hero-chandelier"></div>
        <Image
          src="/images/hero-chandelier.png"
          alt="James & Sons Heritage Chandelier"
          width={450}
          height={580}
          priority
          className="hero-svg live-chandelier object-contain"
        />

        <div className="font-serif italic text-[var(--gold-pale)] text-[24px] tracking-[0.1em] mb-4 py-12 opacity-95 animate-fadeIn">
          &ldquo;Let your light shine before others&rdquo; &mdash;Matthew 5:16
        </div>

        <div className="hero-eyebrow">The 2026 Collection</div>

        <h1 className="hero-title">
          Illuminate<br />
          <em>with Purpose</em>
        </h1>

        <p className="hero-sub">
          Explore India's premier B2B & D2C ecosystem for luxury lighting. Masterfully crafted chandeliers engineered for sustainable brilliance.
        </p>

        <div className="hero-ctas">
          <Link href="/collections" className="btn-primary" style={{ textDecoration: 'none' }}>Shop Collection</Link>
          <Link href="https://indiamart.jamesandsons.in" className="btn-outline" style={{ textDecoration: 'none' }}>B2B Portal Login</Link>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">90+</div>
            <div className="hero-stat-label">CRI Rating</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">100%</div>
            <div className="hero-stat-label">BIS Certified</div>
          </div>
        </div>
      </section>

      {/* Mobile Hero */}
      <section className="mobile-hero-section md:hidden mt-4">
        <div className="mobile-hero-visual">
          <Image
            src="/images/hero-chandelier.png"
            alt="James & Sons Heritage Chandelier"
            width={180}
            height={230}
            priority
            className="mobile-chandelier-svg live-chandelier object-contain"
          />
          <div className="mobile-hero-badge">
            <div className="mobile-hero-badge-dot"></div>
            The 2026 Collection
          </div>
          <div className="mobile-hero-title">Illuminate<br /><em>with Purpose</em></div>
          
          <div className="font-serif italic text-[var(--gold-pale)] text-[15px] tracking-[0.05em] mb-3 opacity-95">
            &ldquo;Let your light shine before others&rdquo; &mdash;Matthew 5:16
          </div>
          
          <div className="mobile-hero-sub">India's premier luxury lighting ecosystem — heritage craftsmanship for grand spaces.</div>
          <div className="mobile-hero-ctas">
            <Link href="/collections" className="mobile-btn-primary">Shop Collection</Link>
            <Link href="https://indiamart.jamesandsons.in" className="mobile-btn-ghost">B2B Portal</Link>
          </div>
        </div>

        <div className="mobile-hero-stats">
          <div className="mobile-stat-chip">
            <i className="ti ti-brightness-up mobile-stat-icon" aria-hidden="true"></i>
            <div>
              <div className="mobile-stat-num">90+</div>
              <div className="mobile-stat-label">CRI Rating</div>
            </div>
          </div>
          <div className="mobile-stat-chip">
            <i className="ti ti-shield-check mobile-stat-icon" aria-hidden="true"></i>
            <div>
              <div className="mobile-stat-num">100%</div>
              <div className="mobile-stat-label">BIS Certified</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
