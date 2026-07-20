'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function SearchInputInner({ 
  placeholder 
}: { 
  placeholder?: string 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    if (query === (searchParams.get('q') || '')) return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      router.push(`?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, router]);

  return (
    <input 
      type="text" 
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="w-1/3 px-4 py-2 border border-border bg-background text-primary font-body text-[13px] focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
    />
  );
}

export default function SearchInput({ 
  placeholder = "Search..." 
}: { 
  placeholder?: string 
}) {
  return (
    <Suspense fallback={<input type="text" placeholder={placeholder} disabled className="w-1/3 px-4 py-2 border border-border bg-background text-primary font-body text-[13px] focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50" />}>
      <SearchInputInner placeholder={placeholder} />
    </Suspense>
  );
}
