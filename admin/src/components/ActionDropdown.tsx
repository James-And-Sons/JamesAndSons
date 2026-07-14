'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ActionDropdownProps {
  productId: string;
  sku: string;
}

export default function ActionDropdown({ productId, sku }: ActionDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = async (e: React.MouseEvent, target: 'amazon' | 'platform' | 'both') => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);

    let confirmMsg = '';
    if (target === 'amazon') {
      confirmMsg = `Are you sure you want to delete listing SKU ${sku} (and its variants) from Amazon Seller Central? This will NOT delete it from the website.`;
    } else if (target === 'platform') {
      confirmMsg = `Are you sure you want to delete product SKU ${sku} from the local website database? This will NOT delete it from Amazon.`;
    } else {
      confirmMsg = `WARNING: Are you sure you want to delete product SKU ${sku} from BOTH the website database and Amazon Seller Central? This action is permanent.`;
    }

    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/sync?productId=${productId}&target=${target}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete deletion request');
      }

      alert(data.message || 'Deletion completed successfully!');
      
      // If we deleted it from the website, refresh/reload the page to update the catalog list
      if (target === 'platform' || target === 'both') {
        router.refresh();
      }
    } catch (err: any) {
      console.error('[ActionDropdown] Delete error:', err);
      alert(`Deletion Failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center">
        {deleting ? (
          <button
            disabled
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-4 py-1.5 bg-background disabled:opacity-50 cursor-not-allowed flex items-center"
          >
            <span className="inline-block animate-spin mr-1.5 border border-t-transparent border-muted rounded-full w-2.5 h-2.5" />
            Deleting...
          </button>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsOpen(!isOpen);
              }}
              className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-4 py-1.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background cursor-pointer flex items-center gap-1"
            >
              Action ▾
            </button>
          </>
        )}
      </div>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute right-0 mt-1 w-48 bg-background border border-border shadow-lg z-50 py-1"
        >
          <a
            href={`/products/${productId}/edit`}
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted hover:bg-surface-muted hover:text-primary transition-colors"
          >
            Edit Product
          </a>
          <button
            onClick={(e) => handleAction(e, 'amazon')}
            className="w-full text-left block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#eab308] hover:bg-surface-muted hover:text-[#eab308] border-t border-border/30 transition-colors"
          >
            Delete from Amazon
          </button>
          <button
            onClick={(e) => handleAction(e, 'platform')}
            className="w-full text-left block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#ef4444] hover:bg-surface-muted hover:text-[#ef4444] border-t border-border/30 transition-colors"
          >
            Delete from Website
          </button>
          <button
            onClick={(e) => handleAction(e, 'both')}
            className="w-full text-left block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#ef4444] font-bold hover:bg-surface-muted hover:text-[#ef4444] border-t border-border/30 transition-colors"
          >
            Delete Everywhere
          </button>
        </div>
      )}
    </div>
  );
}
