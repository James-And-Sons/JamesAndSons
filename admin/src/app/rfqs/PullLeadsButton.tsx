'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PullLeadsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePull = async () => {
    if (loading) return;
    
    setLoading(true);

    try {
      const res = await fetch('/api/admin/indiamart/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to pull IndiaMART leads');
      }

      const data = await res.json();
      
      alert(
        `IndiaMART Sync Complete!\nTotal Fetched: ${data.totalFetched}\nNew RFQs Imported: ${data.importedCount}`
      );
      
      // Refresh the page data
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(`Sync Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePull}
      disabled={loading}
      className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-200 border border-accent text-accent hover:bg-accent hover:text-black font-semibold rounded-sm bg-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
    >
      {loading && (
        <span className="inline-block animate-spin border border-t-transparent border-accent hover:border-black rounded-full w-3 h-3" />
      )}
      {loading ? 'Pulling Leads...' : 'Pull IndiaMART Leads'}
    </button>
  );
}
