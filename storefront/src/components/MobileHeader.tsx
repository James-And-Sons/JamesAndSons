'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useEffect, useState } from 'react';

export default function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? itemCount() : 0;
  const isHome = pathname === '/';
  const isPDP = pathname.startsWith('/products/');

  if (isPDP) return null;

  return (
    <div className="mobile-page-header md:hidden" style={{ position: 'relative' }}>
      {!isHome ? (
        <div className="mobile-back-btn" onClick={() => router.back()}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i>
        </div>
      ) : (
        <div className="mobile-brand-name">James <em>&amp;</em> Sons</div>
      )}
      
      {!isHome && (
        <div className="mobile-brand-name" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          James <em>&amp;</em> Sons
        </div>
      )}

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
