'use client';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MobileHeader({ user }: { user: any }) {
  const pathname = usePathname();
  const { itemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useCartStore(state => state.items);
  const count = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  return (
    <div className="mobile-page-header md:hidden" style={{ position: 'relative' }}>
      <div className="mobile-brand-name">James <em>&amp;</em> Sons</div>

      <div className="mobile-header-actions">
        <div className="mobile-icon-btn" onClick={() => window.dispatchEvent(new Event('open-search'))}>
          <i className="ti ti-search" aria-hidden="true"></i>
        </div>
        <Link href={user ? '/account' : '/login'} className="mobile-icon-btn" style={{ textDecoration: 'none' }}>
          <i className="ti ti-user" aria-hidden="true"></i>
        </Link>
      </div>
    </div>
  );
}
