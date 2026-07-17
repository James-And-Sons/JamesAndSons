'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function MobileMenu({ user }: { user: { id: string; email?: string } | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/collections', label: 'Collections' },
    { href: '/spaces', label: 'Spaces' },
    { href: '/blog', label: 'Blog' },
    { href: 'https://indiamart.jamesandsons.in', label: 'B2B Portal' },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="nav-icon hamburger-btn"
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <line x1="3" y1="8" x2="21" y2="8" />
            <line x1="3" y1="16" x2="21" y2="16" />
          </svg>
        )}
      </button>

      {/* Drawer */}
      {mounted && createPortal(
        <div
          className={`mobile-drawer-overlay${isOpen ? ' open' : ''}`}
          aria-hidden={!isOpen}
          onClick={close}
        >
        <nav
          className="mobile-drawer-panel"
          onClick={e => e.stopPropagation()}
          role="navigation"
          aria-label="Mobile Menu"
        >


          {/* Nav Links */}
          <ul className="mobile-drawer-links">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} onClick={close} className="mobile-drawer-link">
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Account divider */}
          <div className="mobile-drawer-divider" />
          <div className="mobile-drawer-account">
            {user ? (
              <Link href="/account" onClick={close} className="mobile-drawer-link account-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My Account
              </Link>
            ) : (
              <Link href="/login" onClick={close} className="mobile-drawer-link account-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign In
              </Link>
            )}
          </div>

          {/* Footer touch */}
          <p className="mobile-drawer-tagline">Est. 1987 · Luxury Chandeliers</p>
        </nav>
      </div>
      , document.body)}
    </>
  );
}
