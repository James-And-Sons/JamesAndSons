'use client';
import { useState, Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import GlobalSearch from '@/components/GlobalSearch';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider, useSidebar } from '@/lib/context/SidebarContext';

function HeaderTitle() {
  const pathname = usePathname();
  const sidebar = useSidebar();
  
  const getBreadcrumbs = () => {
    // If product form state is active:
    if (sidebar?.productFormState) {
      const { mode, productName } = sidebar.productFormState;
      const action = mode === 'add' ? 'Add Product' : 'Edit Product';
      const nameSuffix = productName ? `: ${productName}` : '';
      return [
        { label: 'Catalog & Pricing', href: '/products' },
        { label: `${action}${nameSuffix}` }
      ];
    }

    if (pathname === '/') return [{ label: 'Dashboard', href: '/' }];
    if (pathname === '/orders') return [{ label: 'Orders', href: '/orders' }];
    if (pathname === '/rfqs') return [{ label: 'Inquiries', href: '/rfqs' }];
    if (pathname === '/products') return [{ label: 'Catalog & Pricing', href: '/products' }];
    if (pathname === '/products/add') {
      return [
        { label: 'Catalog & Pricing', href: '/products' },
        { label: 'Add Product' }
      ];
    }
    if (pathname === '/collections') return [{ label: 'Collections', href: '/collections' }];
    if (pathname === '/spaces') return [{ label: 'Spaces', href: '/spaces' }];
    if (pathname === '/b2b') return [{ label: 'B2B Workspace', href: '/b2b' }];
    if (pathname === '/pages') return [{ label: 'CMS Pages', href: '/pages' }];
    if (pathname === '/blog') return [{ label: 'Blog', href: '/blog' }];
    if (pathname === '/campaigns') return [{ label: 'Marketing', href: '/campaigns' }];
    if (pathname === '/promotions') return [{ label: 'Coupons & Promotions', href: '/promotions' }];
    if (pathname === '/affiliates') return [{ label: 'Affiliates', href: '/affiliates' }];
    if (pathname === '/tickets') return [{ label: 'Support Tickets', href: '/tickets' }];
    if (pathname === '/customers') return [{ label: 'Customers', href: '/customers' }];
    if (pathname === '/account') return [{ label: 'Settings', href: '/account' }];

    // Dynamic builder for arbitrary paths
    const segments = pathname.split('/').filter(Boolean);
    let accumPath = '';
    return segments.map((seg, idx) => {
      accumPath += `/${seg}`;
      const isLast = idx === segments.length - 1;
      return {
        label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        href: isLast ? undefined : accumPath
      };
    });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isDirty = sidebar?.productFormState?.isDirty || sidebar?.isPageDirty;
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-accent font-medium select-none">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return (
          <div key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <span className="text-muted/40 font-normal">/</span>}
            {isLast || !crumb.href ? (
              <span className="text-primary/95 font-semibold">{crumb.label}</span>
            ) : (
              <Link 
                href={crumb.href} 
                onClick={handleNavClick}
                className="hover:text-accent-hover transition-colors text-accent"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

import PushNotificationManager from '@/components/PushNotificationManager';

function UnsavedChangesListener() {
  const sidebar = useSidebar();
  const pathname = usePathname();

  // Reset page dirtiness on page transitions
  useEffect(() => {
    sidebar.setIsPageDirty(false);
  }, [pathname]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirty = sidebar?.productFormState?.isDirty || sidebar?.isPageDirty;
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sidebar?.productFormState?.isDirty, sidebar?.isPageDirty]);

  return null;
}

/** Registers the service worker once on mount */
function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {/* silent — dev environments may block SW */});
    }
  }, []);
  return null;
}

// Clear badge count when visiting key notification pages
function AppBadgeManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'clearAppBadge' in navigator) {
      const targetPaths = ['/tickets', '/orders', '/rfqs', '/inquiries'];
      const matched = targetPaths.some(p => pathname?.startsWith(p));
      
      if (matched) {
        (navigator as any).clearAppBadge().catch((err: any) => {
          console.warn('Failed to clear app badge:', err);
        });
      }
    }
  }, [pathname]);

  return null;
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isLoginPage = pathname?.startsWith('/login');
  const isChatPage = pathname?.startsWith('/tickets/') && pathname !== '/tickets';

  return (
    <ThemeProvider>
      <SidebarProvider>
        <a className="skip-link" href="#main">Skip to content</a>
        <ServiceWorkerRegistrar />
        <PushNotificationManager />
        <AppBadgeManager />
        <UnsavedChangesListener />

        {!isLoginPage && (
          <Suspense fallback={<div className="w-[260px] fixed inset-y-0 left-0 bg-surface border-r border-border" />}>
            <Sidebar 
              isOpen={isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)} 
            />
          </Suspense>
        )}

        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 min-w-0 overflow-x-hidden ${isLoginPage ? 'ml-0' : 'lg:ml-[260px] ml-0'}`}>
          {!isLoginPage && (
            <header className={`h-[64px] bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-10 sticky top-0 z-40 transition-colors duration-300 ${
              isChatPage ? 'hidden md:flex' : 'flex'
            }`}>
              {/* LEFT: Hamburger (desktop only) + Breadcrumb */}
              <div className="flex items-center gap-4">
                {/* Desktop hamburger — only shown when sidebar is not always-visible */}
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 text-muted hover:text-accent cursor-pointer touch-target"
                  aria-label="Open navigation"
                  aria-expanded={isSidebarOpen}
                  aria-controls="sidebar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <HeaderTitle />
              </div>

              {/* RIGHT: Desktop = GlobalSearch + ThemeToggle + badge; Mobile = search icon + theme toggle */}
              <div className="flex items-center gap-2 lg:gap-4">
                {/* Desktop search */}
                <div className="hidden lg:flex">
                  <GlobalSearch />
                </div>

                {/* Mobile search toggle */}
                <button
                  className="lg:hidden touch-target text-muted hover:text-accent transition-colors"
                  onClick={() => setMobileSearchOpen(s => !s)}
                  aria-label="Toggle search"
                >
                  <Search size={18} />
                </button>

                <ThemeToggle />

                {/* Super admin badge — desktop only */}
                <span className="hidden lg:inline font-mono text-[9px] tracking-[0.15em] uppercase text-accent bg-accent/5 px-3 py-1.5 border border-accent/30 rounded-sm">
                  Super Admin
                </span>
              </div>
            </header>
          )}

          {/* Mobile expandable search bar */}
          {!isLoginPage && mobileSearchOpen && (
            <div className="lg:hidden px-4 py-3 bg-background border-b border-border z-30 sticky top-[64px]">
              <GlobalSearch autoFocus onClose={() => setMobileSearchOpen(false)} />
            </div>
          )}

          <main
            id="main"
            className={
              isLoginPage
                ? ''
                : isChatPage
                  ? 'p-0 md:p-10 flex-1 flex flex-col bg-background selection:bg-accent/20 transition-colors duration-300 min-h-0'
                  : 'p-4 lg:p-10 flex-1 overflow-x-hidden bg-background selection:bg-accent/20 transition-colors duration-300 has-bottom-nav lg:pb-10'
            }
          >
            <div className={isLoginPage || isChatPage ? 'h-full flex flex-col min-h-0' : 'max-w-[1200px] mx-auto w-full min-w-0 overflow-x-hidden'}>
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation — rendered outside the scrollable column */}
        {!isLoginPage && (
          <div className={isChatPage ? 'hidden md:block' : 'block'}>
            <BottomNav />
          </div>
        )}

      </SidebarProvider>
    </ThemeProvider>
  );
}
