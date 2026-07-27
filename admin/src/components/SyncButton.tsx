'use client';

import React, { useState } from 'react';

interface SyncButtonProps {
  productId?: string;
  className?: string;
  label?: string;
}

export default function SyncButton({ productId, className, label }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);

  const handleSync = async (e: React.MouseEvent) => {
    // Prevent event propagation if this button is inside a clickable row or link
    e.stopPropagation();
    e.preventDefault();

    if (syncing) return;

    const confirmMsg = productId 
      ? 'Sync this product to all marketplaces (Amazon, Meta, Pinterest, etc.)?'
      : 'Start bulk sync for all catalog products? This will process products in batches to avoid timeout errors.';

    if (!window.confirm(confirmMsg)) return;

    setSyncing(true);
    setProgressText(null);

    try {
      if (productId) {
        // Sync single product
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
      } else {
        // Bulk sync: 1. Fetch list of IDs first
        setProgressText('Catalog list...');
        const listRes = await fetch('/api/admin/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list' })
        });
        const listData = await listRes.json();
        if (!listRes.ok) {
          throw new Error(listData.error || 'Failed to fetch catalog list');
        }

        const ids: string[] = listData.productIds || [];
        if (ids.length === 0) {
          alert('No products found to sync.');
          return;
        }

        // 2. Loop through each product and sync sequentially
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < ids.length; i++) {
          const percent = Math.round(((i + 1) / ids.length) * 100);
          setProgressText(`Syncing (${i + 1}/${ids.length}) - ${percent}%`);

          try {
            const syncItemRes = await fetch('/api/admin/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: ids[i] })
            });
            if (syncItemRes.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        alert(`Bulk Sync Completed!\n\nSuccessfully Synced: ${successCount}\nFailed / Skipped: ${failCount}`);
      }
    } catch (err: any) {
      console.error('[Sync Action] Sync error:', err);
      alert(`Sync Failed: ${err.message}`);
    } finally {
      setSyncing(false);
      setProgressText(null);
    }
  };

  const defaultLabel = productId ? 'Sync' : 'Sync All';
  const displayLabel = syncing ? (progressText || 'Syncing...') : (label || defaultLabel);

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
