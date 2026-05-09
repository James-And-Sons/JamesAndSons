'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useEffect, useState } from 'react';

export default function MobileBottomNav({ user }: { user: any }) {
  const pathname = usePathname();
  const { itemCount, openCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? itemCount() : 0;

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      label: 'Collections',
      href: '/collections',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      )
    },
    {
      label: 'Search',
      onClick: () => {
        window.dispatchEvent(new Event('open-search'));
      },
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      )
    },
    {
      label: 'Blog',
      href: '/blog',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      label: 'Account',
      href: user ? '/account' : '/login',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ];

  return (
    <div className="mobile-bottom-nav">
      {navItems.map((item, index) => {
        const isActive = item.href && pathname === item.href;
        
        if (item.onClick) {
          return (
            <button key={index} onClick={item.onClick} className="mobile-bottom-nav-item">
              <span className="mobile-bottom-nav-icon">{item.icon}</span>
              <span className="mobile-bottom-nav-label">{item.label}</span>
            </button>
          );
        }

        return (
          <Link key={index} href={item.href!} className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="mobile-bottom-nav-icon">{item.icon}</span>
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
