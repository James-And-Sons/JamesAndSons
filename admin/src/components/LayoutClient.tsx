'use client';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <ThemeProvider>
      {!isLoginPage && <Sidebar />}
      <main className={`flex-1 flex flex-col min-h-screen ${isLoginPage ? 'ml-0' : 'ml-[260px]'}`}>
        {!isLoginPage && (
          <header className="h-[64px] bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-10 sticky top-0 z-50 transition-colors duration-300">
            <h2 className="section-label m-0 font-medium text-accent tracking-[0.2em] font-mono text-[10px]">Overview</h2>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent bg-accent/5 px-3 py-1.5 border border-accent/30 rounded-sm">
                Super Admin
              </span>
            </div>
          </header>
        )}
        <div className={isLoginPage ? '' : 'p-10 flex-1 overflow-auto bg-background selection:bg-accent/20 transition-colors duration-300'}>
          <div className={isLoginPage ? '' : 'max-w-[1200px] mx-auto w-full'}>
            {children}
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}
