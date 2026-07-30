'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Grid3x3,
  TicketCheck,
  Menu,
  X,
  ShoppingCart,
  FileText,
  Megaphone,
  Tag,
  Users,
  Settings,
  BookOpen,
  BookMarked,
  MessageSquare,
  Building2,
  Image,
  LogOut,
} from 'lucide-react';
import { useSidebar } from '@/lib/context/SidebarContext';
import { logoutAction } from '@/app/actions';

const PRIMARY_TABS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Orders', href: '/orders', icon: Package },
  { label: 'Products', href: '/products', icon: Grid3x3 },
  { label: 'Tickets', href: '/tickets', icon: TicketCheck },
];

const MORE_LINKS = [
  { label: 'Inquiries', href: '/rfqs', icon: MessageSquare },
  { label: 'B2B Workspace', href: '/b2b', icon: Building2 },
  { label: 'Collections', href: '/collections', icon: BookMarked },
  { label: 'Spaces', href: '/spaces', icon: Image },
  { label: 'Blog', href: '/blog', icon: BookOpen },
  { label: 'Marketing', href: '/campaigns', icon: Megaphone },
  { label: 'Coupons', href: '/promotions', icon: Tag },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Catalogues', href: '/catalogues', icon: BookOpen },
  { label: 'Settings', href: '/account', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isMobileNavOpen, setIsMobileNavOpen } = useSidebar();

  if (pathname?.startsWith('/login')) return null;

  const isTabActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const [badges, setBadges] = useState({ orders: 0, tickets: 0, rfqs: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await fetch('/api/notifications/summary');
        if (response.ok) {
          const data = await response.json();
          setBadges({
            orders: data.orders || 0,
            tickets: data.tickets || 0,
            rfqs: data.rfqs || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching badges for bottom nav:', err);
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getBadgeCountForTab = (label: string) => {
    if (label === 'Orders') return badges.orders;
    if (label === 'Tickets') return badges.tickets;
    return 0;
  };

  const getBadgeCountForMoreLink = (label: string) => {
    if (label === 'Inquiries') return badges.rfqs;
    return 0;
  };

  const totalMoreBadges = badges.rfqs;

  const handleLogout = async () => {
    setIsMobileNavOpen(false);
    await logoutAction();
  };

  return (
    <>
      {/* ── "More" Full-Screen Drawer ─────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 ${
          isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel — slides up from below the nav bar */}
      <div
        className={`fixed bottom-0 inset-x-0 z-50 lg:hidden bg-surface border-t border-border rounded-t-2xl shadow-2xl shadow-black/60 transition-transform duration-400 ease-out bottom-nav-bar ${
          isMobileNavOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-label="More navigation options"
        aria-modal="true"
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border/60" aria-hidden="true" />
        </div>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
          <div>
            <p className="font-serif text-[18px] text-primary font-light tracking-wide leading-none">
              James <span className="text-accent italic">&</span> Sons
            </p>
            <p className="font-mono text-[9px] text-muted mt-0.5 uppercase tracking-[0.18em]">Admin Portal</p>
          </div>
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="touch-target text-muted hover:text-accent transition-colors rounded-sm"
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links grid */}
        <nav className="p-4 grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto" aria-label="More navigation links">
          {MORE_LINKS.map((link) => {
            const Icon = link.icon;
            const active = isTabActive(link.href);
            const count = getBadgeCountForMoreLink(link.label);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200 touch-target ${
                  active
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-surface-muted/40 border-border/30 text-muted hover:text-primary hover:border-border'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon size={18} strokeWidth={1.5} />
                  {count > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-[#f59e0b] text-black text-[8px] font-mono font-bold px-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-center leading-tight">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out button */}
        <div className="px-4 pb-4 pt-2 border-t border-border/30">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-mono tracking-[0.14em] uppercase text-[#C97E6A] bg-[#C97E6A]/10 border border-[#C97E6A]/30 hover:bg-[#C97E6A]/20 transition-all rounded-lg touch-target cursor-pointer font-medium"
          >
            <span className="flex items-center gap-2">
              <LogOut size={14} />
              Sign Out
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* ── Bottom Navigation Bar ────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-surface/95 backdrop-blur-md border-t border-border bottom-nav-bar"
        aria-label="Primary navigation"
      >
        <div className="flex items-stretch h-16">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(tab.href, tab.exact);
            const count = getBadgeCountForTab(tab.label);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-200 ${
                  active ? 'text-accent' : 'text-muted hover:text-primary'
                }`}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
              >
                {/* Active indicator: gold line on top */}
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-b-full bg-accent transition-all duration-300 ${
                    active ? 'w-8' : 'w-0'
                  }`}
                  aria-hidden="true"
                />
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-[#f59e0b] text-black text-[9px] font-mono font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider">{tab.label}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-200 cursor-pointer ${
              isMobileNavOpen ? 'text-accent' : 'text-muted hover:text-primary'
            }`}
            aria-label="More navigation options"
            aria-expanded={isMobileNavOpen}
            aria-haspopup="dialog"
          >
            <span
              className={`absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-b-full bg-accent transition-all duration-300 ${
                isMobileNavOpen ? 'w-8' : 'w-0'
              }`}
              aria-hidden="true"
            />
            <div className="relative">
              <Menu size={20} strokeWidth={isMobileNavOpen ? 2 : 1.5} />
              {totalMoreBadges > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-[#f59e0b] text-black text-[9px] font-mono font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center">
                  {totalMoreBadges}
                </span>
              )}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
