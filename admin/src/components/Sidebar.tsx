'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions';
import { useEffect, useState } from 'react';

export default function Sidebar() {
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
    { name: 'B2B Workspace', href: '/b2b' },
    { name: 'Pages / CMS', href: '/pages' },
    { name: 'Blog', href: '/blog' },
    { name: 'Tickets', href: '/tickets', badge: openTickets },
    { name: 'Customers', href: '/customers' },
    { name: 'Admin Settings', href: '/account' },
  ];

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <aside className="w-[260px] fixed inset-y-0 left-0 z-40 h-screen bg-surface flex flex-col border-r border-border shrink-0 transition-colors duration-300">
      <div className="h-[64px] flex flex-col justify-center px-8 border-b border-border relative overflow-hidden bg-background transition-colors duration-300">
        <h1 className="font-serif text-[18px] font-light tracking-[0.25em] text-accent-hover uppercase z-10">
          James <span className="text-[#f5e9c8] italic font-light">&</span> Sons
        </h1>
        <p className="font-mono text-[8px] text-muted mt-1 uppercase tracking-[0.2em] z-10 drop-shadow-md">Admin Portal</p>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="flex items-center justify-between px-4 py-3 text-muted hover:text-accent border border-transparent hover:border-border hover:bg-surface-muted transition-all duration-200 font-mono text-[10px] tracking-[0.12em] uppercase"
          >
            <span>{link.name}</span>
            {link.badge !== null && link.badge !== undefined && link.badge > 0 && (
              <span className="bg-[#f59e0b] text-black font-mono text-[9px] font-medium px-1.5 py-0.5 min-w-[20px] text-center">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-border bg-background transition-colors duration-300">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 text-[10px] font-mono tracking-[0.12em] uppercase text-muted hover:text-red-500 transition-colors border border-transparent hover:border-border"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
