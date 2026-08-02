'use client';
import Link from 'next/link';

export default function AboutExcerpt() {
  return (
    <section
      id="about-excerpt"
      style={{
        position: 'relative',
        padding: '100px 40px',
        background: 'var(--obsidian)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Decorative chandelier SVG */}
      <svg
        style={{ position: 'absolute', top: '-20px', right: '60px', opacity: 0.04, pointerEvents: 'none' }}
        width="360" height="420" viewBox="0 0 100 120" stroke="#C4A05A" fill="none"
      >
        <path d="M50 5 L50 80" strokeWidth="0.8" strokeDasharray="2 2" />
        <path d="M10 55 Q50 95 90 55" strokeWidth="1.2" />
        <line x1="10" y1="55" x2="10" y2="78" stroke="#E2C882" strokeWidth="1.5" />
        <circle cx="10" cy="83" r="3" fill="#C4A05A" />
        <line x1="90" y1="55" x2="90" y2="78" stroke="#E2C882" strokeWidth="1.5" />
        <circle cx="90" cy="83" r="3" fill="#C4A05A" />
        <line x1="50" y1="80" x2="50" y2="108" stroke="#E2C882" strokeWidth="1.5" />
        <circle cx="50" cy="113" r="5" fill="#F5E9C8" />
      </svg>

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: '24px',
        }}>
          Our Story
        </div>

        {/* Decorative quote mark */}
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '120px',
          lineHeight: 0.6,
          color: 'var(--gold)',
          opacity: 0.15,
          marginBottom: '16px',
          userSelect: 'none',
        }}>
          "
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 300,
          color: 'var(--text)',
          lineHeight: 1.2,
          marginBottom: '28px',
          letterSpacing: '0.02em',
        }}>
          Crafting Heritage in Light,<br />
          <em style={{ color: 'var(--gold-light)' }}>One Chandelier at a Time</em>
        </h2>

        {/* Excerpt paragraph */}
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '18px',
          lineHeight: 1.85,
          color: 'var(--text-muted)',
          maxWidth: '680px',
          marginBottom: '40px',
          letterSpacing: '0.02em',
        }}>
          For over three decades, James &amp; Sons has illuminated the grandest homes, heritage hotels,
          and palatial spaces across India. Born from a passion for classical craftsmanship and
          a reverence for light as an art form, our collections bridge the timeless traditions
          of Agra&rsquo;s artisans with contemporary luxury design.
        </p>

        {/* Scripture citation */}
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '14px',
          color: 'var(--gold-pale)',
          marginBottom: '40px',
          borderLeft: '2px solid var(--gold)',
          paddingLeft: '16px',
        }}>
          &ldquo;Let your light shine before others&rdquo; &mdash; Matthew 5:16
        </div>

        <Link
          href="/about"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            textDecoration: 'none',
            border: '1px solid var(--gold)',
            padding: '14px 32px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'var(--gold)';
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--obsidian)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--gold)';
          }}
        >
          Read Our Story
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
