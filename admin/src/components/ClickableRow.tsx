'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface ClickableRowProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function ClickableRow({ href, children, className = "" }: ClickableRowProps) {
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking a button, link, or input inside the row
    const target = e.target as HTMLElement;
    const isInteractive = 
      target.tagName === 'A' || 
      target.tagName === 'BUTTON' || 
      target.tagName === 'INPUT' || 
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('a') || 
      target.closest('button');

    if (!isInteractive) {
      router.push(href);
    }
  };

  return (
    <tr 
      onClick={handleRowClick}
      className={`cursor-pointer hover:bg-surface-muted transition-colors ${className}`}
    >
      {children}
    </tr>
  );
}
