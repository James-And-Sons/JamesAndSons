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
        <Link href={user ? '/account' : '/login'} style={{ textDecoration: 'none' }}>
          {user ? (
            <div className="mobile-icon-btn">
              <i className="ti ti-user" aria-hidden="true"></i>
            </div>
          ) : (
            <div style={{ 
              fontSize: '10px', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--gold)', 
              letterSpacing: '0.12em', 
              border: '1px solid rgba(196,160,90,0.3)', 
              padding: '6px 12px', 
              borderRadius: '20px', 
              textTransform: 'uppercase',
              background: 'rgba(196,160,90,0.05)'
            }}>
              Sign In
            </div>
          )}
        </Link>

      </div>
    </div>
  );
}
