'use client';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useEffect, useState } from 'react';

export default function MobileHeader() {
  const pathname = usePathname();
  const { itemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useCartStore(state => state.items);
  const count = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const isPDP = pathname.startsWith('/products/');

  if (isPDP) return null;

  return (
    <div className="mobile-page-header md:hidden" style={{ position: 'relative' }}>
      <div className="mobile-brand-name">James <em>&amp;</em> Sons</div>

      <div className="mobile-header-actions">
        <div className="mobile-icon-btn" onClick={() => window.dispatchEvent(new Event('open-search'))}>
          <i className="ti ti-search" aria-hidden="true"></i>
        </div>
        <div className="mobile-icon-btn" onClick={() => window.dispatchEvent(new Event('open-cart'))}>
          <i className="ti ti-shopping-bag" aria-hidden="true"></i>
          {count > 0 && <div className="mobile-cart-dot"></div>}
        </div>
      </div>
    </div>
  );
}
