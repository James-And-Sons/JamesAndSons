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

  const items = useCartStore(state => state.items);
  const count = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  const navItems = [
    { label: 'Home', href: '/', icon: 'ti-home' },
    { label: 'Collections', href: '/collections', icon: 'ti-layout-grid' },
    { label: 'Blog', href: '/blog', icon: 'ti-article' },
    { label: 'Account', href: user ? '/account' : '/login', icon: 'ti-user' }
  ];

  return (
    <div className="mobile-bottom-nav-container md:hidden">
      {navItems.map((item, index) => {
        const isActive = item.href && pathname === item.href;
        
        return (
          <Link key={index} href={item.href} className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
            <i className={`ti ${item.icon}`}></i>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
