'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!collectionsRef.current?.contains(e.target as Node)) setCollectionsOpen(false);
      if (!spacesRef.current?.contains(e.target as Node)) setSpacesOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 16px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--obsidian)',
    border: '1px solid var(--border)',
    padding: '20px 24px',
    minWidth: '220px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
    zIndex: 200,
    display: 'grid',
    gap: '2px',
  };

  const dropdownLinkStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    padding: '7px 0',
    borderBottom: '1px solid var(--border)',
    transition: 'color 0.2s',
  };

  const liStyle: React.CSSProperties = { position: 'relative', listStyle: 'none' };

  const linkStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'color 0.2s',
  };

  return (
    <ul className="nav-links" style={{ display: 'flex', gap: '32px', listStyle: 'none', alignItems: 'center' }}>
      <li>
        <Link href="/" style={linkStyle}>Home</Link>
      </li>

      {/* Collections with dropdown */}
      <li
        ref={collectionsRef}
        style={liStyle}
        onMouseEnter={() => setCollectionsOpen(true)}
        onMouseLeave={() => setCollectionsOpen(false)}
      >
        <Link href="/collections" style={linkStyle}>
          Collections
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '1px', transition: 'transform 0.2s', transform: collectionsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Link>
        {collectionsOpen && (
          <div style={dropdownStyle}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-gold)' }}>
              Shop by Category
            </div>
            <Link href="/collections" style={{ ...dropdownLinkStyle, color: 'var(--text)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
              All Collections
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                style={dropdownLinkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </li>

      {/* Spaces with dropdown */}
      <li
        ref={spacesRef}
        style={liStyle}
        onMouseEnter={() => setSpacesOpen(true)}
        onMouseLeave={() => setSpacesOpen(false)}
      >
        <Link href="/spaces" style={linkStyle}>
          Spaces
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '1px', transition: 'transform 0.2s', transform: spacesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Link>
        {spacesOpen && (
          <div style={dropdownStyle}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-gold)' }}>
              Shop by Space
            </div>
            <Link href="/spaces" style={{ ...dropdownLinkStyle, color: 'var(--text)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}>
              All Spaces
            </Link>
            {spaces.map(space => (
              <Link
                key={space.slug}
                href={`/collections?space=${encodeURIComponent(space.name)}`}
                style={dropdownLinkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {space.name}
              </Link>
            ))}
          </div>
        )}
      </li>

      <li>
        <Link href="/blog" style={linkStyle}>Blog</Link>
      </li>
      <li>
        <Link href="/catalogues" style={linkStyle}>Catalogues</Link>
      </li>
      <li>
        <Link href="https://indiamart.jamesandsons.in" style={linkStyle}>B2B Portal</Link>
      </li>
    </ul>
  );
}
