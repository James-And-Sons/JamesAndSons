'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MobileMenu({ user }: { user: { id: string; email?: string } | null }) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <button 
        className="nav-icon hamburger-btn" 
        onClick={() => setIsOpen(true)}
        aria-label="Open Mobile Menu"
        title="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {isOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-header">
            <span className="mobile-menu-title font-serif">James <span>&amp;</span> Sons</span>
            <button 
              className="nav-icon mobile-menu-close" 
              onClick={() => setIsOpen(false)}
              aria-label="Close Mobile Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <ul className="mobile-nav-links font-mono">
            <li><Link href="/" onClick={() => setIsOpen(false)}>Home</Link></li>
            <li><Link href="/collections" onClick={() => setIsOpen(false)}>Collections</Link></li>
            <li><Link href="/blog" onClick={() => setIsOpen(false)}>Blog</Link></li>
            <li><a href="/#spaces" onClick={() => setIsOpen(false)}>Spaces</a></li>
            <li><Link href="/b2b" onClick={() => setIsOpen(false)}>B2B Portal</Link></li>
            <li className="mobile-menu-divider" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(196,160,90,0.3)' }}>
              {user ? (
                <Link href="/account" onClick={() => setIsOpen(false)}>My Account</Link>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
