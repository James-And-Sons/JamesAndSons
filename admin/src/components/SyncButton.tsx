'use client';

import React, { useState } from 'react';

interface SyncButtonProps {
  productId?: string;
  className?: string;
  label?: string;
}

export default function SyncButton({ productId, className, label }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async (e: React.MouseEvent) => {
    // Prevent event propagation if this button is inside a clickable row or link
    e.stopPropagation();
    e.preventDefault();

    if (syncing) return;

    const confirmMsg = productId 
      ? 'Sync this product to all marketplaces (Amazon, Meta, Pinterest, etc.)?'
      : 'Start bulk sync for all catalog products? This may take a minute.';

    if (!window.confirm(confirmMsg)) return;

    setSyncing(true);

    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute sync');
      }

      alert(data.message || 'Sync completed successfully!');
    } catch (err: any) {
      console.error('[Sync Action] Sync error:', err);
      alert(`Sync Failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const defaultLabel = productId ? 'Sync' : 'Sync All';
  const displayLabel = syncing ? 'Syncing...' : (label || defaultLabel);

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className={className || "font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"}
    >
      {syncing && (
        <span className="inline-block animate-spin mr-1.5 border border-t-transparent border-muted rounded-full w-2.5 h-2.5 align-middle" />
      )}
      {displayLabel}
    </button>
  );
}
