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
    { label: 'Cart', type: 'cart', icon: 'ti-shopping-bag' }
  ];

  return (
    <div className="mobile-bottom-nav-container md:hidden">
      {navItems.map((item, index) => {
        if (item.type === 'cart') {
          return (
            <div key={index} className="mobile-nav-item" onClick={() => window.dispatchEvent(new Event('open-cart'))}>
              <div style={{ position: 'relative' }}>
                <i className={`ti ${item.icon}`}></i>
                {count > 0 && (
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--gold)', borderRadius: '50%' }}></div>
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </div>
          );
        }

        const isActive = item.href && pathname === item.href;
        
        return (
          <Link key={index} href={item.href || '#'} className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
            <i className={`ti ${item.icon}`}></i>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
