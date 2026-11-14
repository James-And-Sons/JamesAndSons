import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getCatalogues() {
  try {
    return await prisma.catalogue.findMany({
      where: { isPublished: true },
      orderBy: { year: 'desc' },
    });
  } catch {
    return [];
  }
}

export const metadata = {
  title: 'Download Catalogues | James & Sons Luxury Lighting',
  description: 'Browse and download the James & Sons lighting catalogues — curated collections of chandeliers, floor lamps, wall brackets, and luxury illumination for every space.',
};

export default async function CataloguesPage() {
  const catalogues = await getCatalogues();

  return (
    <>
            <main style={{ paddingTop: '80px', minHeight: '80vh', background: 'var(--background)' }}>

        {/* Hero */}
        <section style={{
          padding: '80px 40px 60px',
          background: 'linear-gradient(135deg, var(--obsidian) 0%, var(--surface) 100%)',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background chandelier */}
          <svg style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', opacity: 0.04, pointerEvents: 'none' }}
            width="300" height="350" viewBox="0 0 100 120" stroke="#C4A05A" fill="none">
            <path d="M50 5 L50 80" strokeWidth="0.8" strokeDasharray="2 2" />
            <path d="M10 55 Q50 95 90 55" strokeWidth="1.2" />
            <line x1="10" y1="55" x2="10" y2="78" stroke="#E2C882" strokeWidth="1.5" /><circle cx="10" cy="83" r="3" fill="#C4A05A" />
            <line x1="90" y1="55" x2="90" y2="78" stroke="#E2C882" strokeWidth="1.5" /><circle cx="90" cy="83" r="3" fill="#C4A05A" />
            <line x1="50" y1="80" x2="50" y2="108" stroke="#E2C882" strokeWidth="1.5" /><circle cx="50" cy="113" r="5" fill="#F5E9C8" />
          </svg>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
              Our Publications
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 300, color: 'var(--text)', lineHeight: 1.15, marginBottom: '20px' }}>
              Product <em style={{ color: 'var(--gold-light)' }}>Catalogues</em>
            </h1>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.8 }}>
              Download our beautifully curated product catalogues and explore the full James &amp; Sons collection at your leisure.
            </p>
          </div>
        </section>

        {/* Catalogues Grid */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 40px' }}>
          {catalogues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <i className="ti ti-book-2" style={{ fontSize: '48px', color: 'var(--gold)', opacity: 0.3, display: 'block', marginBottom: '20px' }} />
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Catalogues Coming Soon
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
                Our digital catalogues are being prepared. Contact us to request a copy.
              </p>
              <Link href="/contact" className="catalogue-cta-link" style={{
                display: 'inline-block',
                marginTop: '32px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
                padding: '14px 32px',
                textDecoration: 'none',
              }}>
                Contact Us
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
              {catalogues.map((cat) => (
                <div
                  key={cat.id}
                  className="catalogue-card"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Cover image */}
                  <div style={{
                    height: '300px',
                    background: 'linear-gradient(135deg, var(--surface2) 0%, #1a1508 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {cat.coverImage ? (
                      <img src={cat.coverImage} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <i className="ti ti-book-2" style={{ fontSize: '56px', color: 'var(--gold)', opacity: 0.3 }} />
                      </div>
                    )}
                    {/* Year badge */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'var(--gold)',
                      color: 'var(--obsidian)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      padding: '4px 10px',
                    }}>
                      {cat.year}
                    </div>
                  </div>

                  {/* Info + Download */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text)', marginBottom: '8px', lineHeight: 1.3 }}>
                        {cat.title}
                      </div>
                      {cat.description && (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em', lineHeight: 1.7 }}>
                          {cat.description}
                        </p>
                      )}
                      {cat.downloads > 0 && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '10px' }}>
                          {cat.downloads.toLocaleString()} downloads
                        </div>
                      )}
                    </div>
                    <a
                      href={cat.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="catalogue-download-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        background: 'var(--gold)',
                        color: 'var(--obsidian)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        padding: '14px 24px',
                        textDecoration: 'none',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <i className="ti ti-download" style={{ fontSize: '14px' }} />
                      Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA strip */}
        <section style={{
          background: 'var(--obsidian)',
          borderTop: '1px solid var(--border)',
          padding: '60px 40px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--text)', marginBottom: '16px' }}>
              Can&apos;t find what you need?
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', lineHeight: 1.8, marginBottom: '32px' }}>
              Our design concierge can prepare custom product lists, look-books, and specifications for your project.
            </p>
            <Link href="/contact" className="catalogue-cta-link" style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
              padding: '14px 36px',
              textDecoration: 'none',
            }}>
              Request Custom Look-Book
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
