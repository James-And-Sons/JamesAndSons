'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResultItem {
  type: 'product' | 'order' | 'rfq' | 'customer';
  id: string;
  title: string;
  subtitle: string;
  image?: string | null;
  href: string;
}

interface GroupedResults {
  products: SearchResultItem[];
  orders: SearchResultItem[];
  rfqs: SearchResultItem[];
  customers: SearchResultItem[];
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedResults>({
    products: [],
    orders: [],
    rfqs: [],
    customers: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut CMD+K or Ctrl+K to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ products: [], orders: [], rfqs: [], customers: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const hasResults =
    results.products.length > 0 ||
    results.orders.length > 0 ||
    results.rfqs.length > 0 ||
    results.customers.length > 0;

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 border border-border/80 bg-surface-muted/50 px-3 py-1.5 rounded-sm text-xs font-mono min-w-[320px] focus-within:border-accent">
        <span className="text-muted" aria-hidden="true">🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search catalog, orders, RFQs..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent text-primary font-mono text-[11px] focus:outline-none focus-visible:outline-none w-full placeholder:text-muted/60"
        />
        {loading ? (
          <span className="inline-block animate-spin border border-t-transparent border-muted rounded-full w-3 h-3" />
        ) : (
          <span className="text-[9px] text-muted/60 bg-surface px-1.5 py-0.5 rounded border border-border">⌘K</span>
        )}
      </div>

      {isOpen && (query.trim().length >= 2 || loading) && (
        <div className="absolute right-0 mt-2 w-[480px] bg-background border border-border shadow-xl rounded-sm z-50 max-h-[420px] overflow-y-auto divide-y divide-border/40 font-mono text-[11px]">
          {loading && !hasResults && (
            <div className="p-4 text-center text-muted">Searching...</div>
          )}

          {!loading && !hasResults && (
            <div className="p-4 text-center text-muted">No results found for &ldquo;{query}&rdquo;</div>
          )}

          {/* Products Group */}
          {results.products.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-accent font-bold">Products</div>
              {results.products.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-surface-muted transition-colors rounded-sm text-primary group"
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="w-8 h-8 object-cover border border-border bg-surface shrink-0" />
                  ) : (
                    <div className="w-8 h-8 border border-border bg-surface flex items-center justify-center text-[8px] text-muted shrink-0">IMG</div>
                  )}
                  <div className="truncate">
                    <div className="font-semibold truncate group-hover:text-accent transition-colors">{item.title}</div>
                    <div className="text-[9px] text-muted truncate">{item.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Orders Group */}
          {results.orders.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-accent font-bold">Orders</div>
              {results.orders.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-muted transition-colors rounded-sm text-primary group"
                >
                  <div className="font-semibold group-hover:text-accent transition-colors">{item.title}</div>
                  <div className="text-[9px] text-muted">{item.subtitle}</div>
                </button>
              ))}
            </div>
          )}

          {/* RFQs Group */}
          {results.rfqs.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-accent font-bold">RFQs</div>
              {results.rfqs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-muted transition-colors rounded-sm text-primary group"
                >
                  <div className="font-semibold group-hover:text-accent transition-colors">{item.title}</div>
                  <div className="text-[9px] text-muted">{item.subtitle}</div>
                </button>
              ))}
            </div>
          )}

          {/* Customers Group */}
          {results.customers.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-accent font-bold">Customers</div>
              {results.customers.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-muted transition-colors rounded-sm text-primary group"
                >
                  <div className="font-semibold group-hover:text-accent transition-colors">{item.title}</div>
                  <div className="text-[9px] text-muted">{item.subtitle}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
