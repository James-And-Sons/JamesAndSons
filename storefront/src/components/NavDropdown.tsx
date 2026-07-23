'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type DropdownItem = { name: string; slug: string };

export default function NavDropdown({
  categories,
  spaces,
}: {
  categories: DropdownItem[];
  spaces: DropdownItem[];
}) {
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [spacesOpen, setSpacesOpen] = useState(false);
  const collectionsRef = useRef<HTMLLIElement>(null);
  const spacesRef = useRef<HTMLLIElement>(null);
  const pathname = usePathname();

  // Close dropdowns on outside click or route change
  useEffect(() => {
    setCollectionsOpen(false);
    setSpacesOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!collectionsRef.current?.contains(e.target as Node)) setCollectionsOpen(false);
      if (!spacesRef.current?.contains(e.target as Node)) setSpacesOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dropdownContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    paddingTop: '10px', // Seamless hover bridge
    zIndex: 200,
  };

  const dropdownInnerStyle: React.CSSProperties = {
    background: 'var(--obsidian)',
    border: '1px solid var(--border)',
    padding: '24px 28px',
    minWidth: '280px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderRadius: '6px',
    backdropFilter: 'blur(20px)',
  };

  const dropdownLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: isActive ? 'var(--gold)' : 'var(--text-muted)',
    textDecoration: 'none',
    padding: '9px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    transition: 'all 0.2s ease',
  });

  const liStyle: React.CSSProperties = { position: 'relative', listStyle: 'none', height: '100%', display: 'flex', alignItems: 'center' };

  const getLinkStyle = (isActive: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: isActive ? 'var(--gold)' : 'var(--text-muted)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'all 0.25s ease',
    position: 'relative',
  });

  return (
    <ul className="nav-links" style={{ display: 'flex', gap: '8px', listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}>
      {/* Home */}
      <li style={liStyle}>
        <Link href="/" style={getLinkStyle(pathname === '/')}>
          Home
        </Link>
      </li>

      {/* Collections Dropdown */}
      <li
        ref={collectionsRef}
        style={liStyle}
        onMouseEnter={() => setCollectionsOpen(true)}
        onMouseLeave={() => setCollectionsOpen(false)}
      >
        <Link
          href="/collections"
          style={getLinkStyle(pathname.startsWith('/collections') || collectionsOpen)}
        >
          Collections
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{
              transition: 'transform 0.25s ease',
              transform: collectionsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Link>
        {collectionsOpen && (
          <div style={dropdownContainerStyle}>
            <div style={dropdownInnerStyle}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-gold)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Shop by Category</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>{categories.length} Categories</span>
              </div>

              <Link
                href="/collections"
                style={{
                  ...dropdownLinkStyle(false),
                  color: 'var(--text)',
                  fontWeight: 600,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--gold)';
                  e.currentTarget.style.paddingLeft = '6px';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.paddingLeft = '0px';
                }}
              >
                <span>All Collections</span>
                <span style={{ fontSize: '12px', color: 'var(--gold)' }}>↗</span>
              </Link>

              {categories.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                  style={dropdownLinkStyle(pathname.includes(`category=${cat.slug}`))}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--gold)';
                    e.currentTarget.style.paddingLeft = '6px';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = pathname.includes(`category=${cat.slug}`)
                      ? 'var(--gold)'
                      : 'var(--text-muted)';
                    e.currentTarget.style.paddingLeft = '0px';
                  }}
                >
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </li>

      {/* Spaces Dropdown */}
      <li
        ref={spacesRef}
        style={liStyle}
        onMouseEnter={() => setSpacesOpen(true)}
        onMouseLeave={() => setSpacesOpen(false)}
      >
        <Link
          href="/spaces"
          style={getLinkStyle(pathname.startsWith('/spaces') || spacesOpen)}
        >
          Spaces
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{
              transition: 'transform 0.25s ease',
              transform: spacesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Link>
        {spacesOpen && (
          <div style={dropdownContainerStyle}>
            <div style={dropdownInnerStyle}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-gold)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Curated Environs</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>{spaces.length} Spaces</span>
              </div>

              <Link
                href="/spaces"
                style={{
                  ...dropdownLinkStyle(false),
                  color: 'var(--text)',
                  fontWeight: 600,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--gold)';
                  e.currentTarget.style.paddingLeft = '6px';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.paddingLeft = '0px';
                }}
              >
                <span>All Spaces</span>
                <span style={{ fontSize: '12px', color: 'var(--gold)' }}>↗</span>
              </Link>

              {spaces.map(space => (
                <Link
                  key={space.slug}
                  href={`/collections?space=${encodeURIComponent(space.name)}`}
                  style={dropdownLinkStyle(pathname.includes(`space=${space.name}`))}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--gold)';
                    e.currentTarget.style.paddingLeft = '6px';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = pathname.includes(`space=${space.name}`)
                      ? 'var(--gold)'
                      : 'var(--text-muted)';
                    e.currentTarget.style.paddingLeft = '0px';
                  }}
                >
                  <span>{space.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </li>

      {/* Catalogues */}
      <li style={liStyle}>
        <Link href="/catalogues" style={getLinkStyle(pathname === '/catalogues')}>
          Catalogues
        </Link>
      </li>

      {/* Blog */}
      <li style={liStyle}>
        <Link href="/blog" style={getLinkStyle(pathname.startsWith('/blog'))}>
          Blog
        </Link>
      </li>

      {/* B2B Portal */}
      <li style={liStyle}>
        <Link
          href="https://indiamart.jamesandsons.in"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...getLinkStyle(false),
            border: '1px solid rgba(201,168,76,0.3)',
            color: 'var(--gold)',
            borderRadius: '4px',
            padding: '6px 14px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--gold)';
            e.currentTarget.style.color = 'var(--obsidian)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--gold)';
          }}
        >
          B2B Portal
        </Link>
      </li>
    </ul>
  );
}
