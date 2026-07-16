'use client';
import { useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isLoginPage = pathname?.startsWith('/login');


  return (
    <ThemeProvider>
      {!isLoginPage && (
        <Suspense fallback={<div className="w-[260px] fixed inset-y-0 left-0 bg-surface border-r border-border" />}>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        </Suspense>
      )}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isLoginPage ? 'ml-0' : 'lg:ml-[260px] ml-0'}`}>
        {!isLoginPage && (
          <header className="h-[64px] bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-10 sticky top-0 z-40 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-muted hover:text-accent"
                aria-label="Open Sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <h2 className="section-label m-0 font-medium text-accent tracking-[0.2em] font-mono text-[10px]">Overview</h2>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent bg-accent/5 px-3 py-1.5 border border-accent/30 rounded-sm">
                Super Admin
              </span>
            </div>
          </header>
        )}
        <div className={isLoginPage ? '' : 'p-4 lg:p-10 flex-1 overflow-auto bg-background selection:bg-accent/20 transition-colors duration-300'}>
          <div className={isLoginPage ? '' : 'max-w-[1200px] mx-auto w-full'}>
            {children}
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}
