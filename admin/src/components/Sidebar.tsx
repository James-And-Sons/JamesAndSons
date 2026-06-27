'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions';
import { useEffect, useState } from 'react';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [openTickets, setOpenTickets] = useState<number | null>(null);

  if (pathname === '/login') return null;

  useEffect(() => {
    fetch('/api/tickets/count')
      .then(r => r.json())
      .then(d => setOpenTickets(d.count))
      .catch(() => {});
  }, []);

  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Orders', href: '/orders' },
    { name: 'RFQ Inbox', href: '/rfqs' },
    { name: 'Catalog & Pricing', href: '/products' },
    { name: 'Collections', href: '/collections' },
    { name: 'Spaces', href: '/spaces' },
    { name: 'B2B Workspace', href: '/b2b' },
    { name: 'Pages / CMS', href: '/pages' },
    { name: 'Blog', href: '/blog' },
    { name: 'Coupons', href: '/promotions' },
    { name: 'Affiliates', href: '/affiliates' },
    { name: 'Tickets', href: '/tickets', badge: openTickets },

    { name: 'Customers', href: '/customers' },
    { name: 'Admin Settings', href: '/account' },
  ];

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-[260px] fixed inset-y-0 left-0 z-50 h-screen bg-surface flex flex-col border-r border-border shrink-0 transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-[64px] flex flex-col justify-center px-8 border-b border-border relative overflow-hidden bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/images/logo-light.png" alt="James & Sons" className="logo-light-img h-14 w-auto z-10" />
              <img src="/images/logo-dark.png" alt="James & Sons" className="logo-dark-img h-14 w-auto z-10" />
              <div>
                <h1 className="font-serif text-[16px] font-light tracking-[0.2em] text-accent-hover uppercase z-10 leading-none">
                  James <span className="text-[#f5e9c8] italic font-light">&</span> Sons
                </h1>
                <p className="font-mono text-[8px] text-muted mt-1 uppercase tracking-[0.18em] z-10 leading-none">Admin Portal</p>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="lg:hidden p-2 text-muted hover:text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = link.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(link.href);
              
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={onClose}
                className={`
                  flex items-center justify-between px-4 py-3 font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-200 border
                  ${isActive 
                    ? 'text-white border-accent/40 bg-surface-muted' 
                    : 'text-muted hover:text-accent border-transparent hover:border-border hover:bg-surface-muted'
                  }
                `}
              >
                <span>{link.name}</span>
                {link.badge !== null && link.badge !== undefined && link.badge > 0 && (
                  <span className="bg-[#f59e0b] text-black font-mono text-[9px] font-medium px-1.5 py-0.5 min-w-[20px] text-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border bg-background">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-[10px] font-mono tracking-[0.12em] uppercase text-muted hover:text-red-500 transition-colors border border-transparent hover:border-border"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
