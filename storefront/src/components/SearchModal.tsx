"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  History,
  Sparkles,
  Package,
  LayoutGrid,
  FileText,
  Compass,
  ShoppingBag,
  Ticket,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

type SearchModalProps = {
  onClose: () => void;
};

const POPULAR_HINTS = [
  "Chandeliers",
  "Wall Sconces",
  "LED Pendant Lights",
  "Architectural Outdoor",
  "B2B Custom Quote",
];

const LOCAL_STORAGE_KEY = "james_sons_recent_searches";

export default function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [results, setResults] = useState<{
    products: any[];
    categories: any[];
    spaces: any[];
    blogs: any[];
    userOrders: any[];
    userTickets: any[];
    userRfqs: any[];
  }>({
    products: [],
    categories: [],
    spaces: [],
    blogs: [],
    userOrders: [],
    userTickets: [],
    userRfqs: [],
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Mount check for createPortal client rendering
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {}
  }, []);

  // Auto-focus input on mount
  useEffect(() => {
    if (mounted) {
      inputRef.current?.focus();
    }
  }, [mounted]);

  // Listen for Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Debounced API fetch
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({
        products: [],
        categories: [],
        spaces: [],
        blogs: [],
        userOrders: [],
        userTickets: [],
        userRfqs: [],
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        setResults({
          products: data.products || [],
          categories: data.categories || [],
          spaces: data.spaces || [],
          blogs: data.blogs || [],
          userOrders: data.userOrders || [],
          userTickets: data.userTickets || [],
          userRfqs: data.userRfqs || [],
        });
      } catch (err) {
        console.error("Search API error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const updated = Array.from(
        new Set([term.trim(), ...recentSearches]),
      ).slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveRecentSearch(query);
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectTerm = (term: string) => {
    saveRecentSearch(term);
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  };

  const hasResults =
    results.products.length > 0 ||
    results.categories.length > 0 ||
    results.spaces.length > 0 ||
    results.blogs.length > 0 ||
    results.userOrders.length > 0 ||
    results.userTickets.length > 0 ||
    results.userRfqs.length > 0;

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          zIndex: 9998,
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Overlapping Floating Search Panel */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "640px",
          maxWidth: "calc(100vw - 40px)",
          background: "var(--void)",
          border: "1px solid var(--border-gold)",
          borderRadius: "20px",
          zIndex: 10000,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        {/* Input Bar Header */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
            padding: "0 20px",
            background: "var(--surface)",
          }}
        >
          <Search size={18} className="text-[var(--gold)] shrink-0 mr-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, tickets, collections..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontSize: "16px",
              color: "var(--text)",
              padding: "18px 0",
            }}
          />
          {loading && (
            <Loader2
              size={18}
              className="text-[var(--gold)] animate-spin mr-3 shrink-0"
            />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                marginRight: "8px",
              }}
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
          >
            ESC
          </button>
        </form>

        {/* Results Container */}
        <div
          style={{ maxHeight: "60vh", overflowY: "auto", padding: "16px 20px" }}
        >
          {/* Default State: Popular Searches & Recent History */}
          {!query.trim() && (
            <div className="space-y-5">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--gold)] mb-2.5 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <History size={14} /> Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectTerm(term)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-xs text-[var(--cream)] hover:text-[var(--gold)] hover:border-[var(--border-gold)] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{term}</span>
                        <ArrowRight
                          size={12}
                          className="text-[var(--text-muted)]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[var(--gold)] mb-2.5 flex items-center gap-1.5 font-semibold">
                  <Sparkles size={14} /> Popular Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_HINTS.map((hint) => (
                    <button
                      key={hint}
                      onClick={() => handleSelectTerm(hint)}
                      className="px-3.5 py-1.5 rounded-xl bg-[rgba(196,160,90,0.08)] border border-[rgba(196,160,90,0.2)] text-xs text-[var(--gold-light)] hover:bg-[rgba(196,160,90,0.18)] transition-all cursor-pointer"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Results Match */}
          {query.trim().length >= 2 && !loading && !hasResults && (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "20px",
                  fontWeight: 300,
                  color: "var(--text-muted)",
                }}
              >
                No results for &ldquo;{query}&rdquo;
              </div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  color: "var(--text-dim)",
                  marginTop: "8px",
                  textTransform: "uppercase",
                }}
              >
                Try a product name, order #, collection, or ticket number
              </p>
            </div>
          )}

          {/* Search Results Groups */}
          {hasResults && (
            <div className="space-y-5">
              {/* User Personal Orders */}
              {results.userOrders.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-2.5 font-bold flex items-center gap-1.5">
                    <ShoppingBag size={14} /> My Orders (
                    {results.userOrders.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.userOrders.map((o) => (
                      <Link
                        key={o.id}
                        href={o.url}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--gold)]/40 transition-all text-decoration-none group"
                      >
                        <div>
                          <div className="text-sm font-medium text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
                            {o.title}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                            {o.subtitle}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold font-mono text-[var(--gold)]">
                            {formatPrice(o.amount)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* User Support Tickets */}
              {results.userTickets.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-2.5 font-bold flex items-center gap-1.5">
                    <Ticket size={14} /> My Support Tickets (
                    {results.userTickets.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.userTickets.map((t) => (
                      <Link
                        key={t.id}
                        href={t.url}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--gold)]/40 transition-all text-decoration-none group"
                      >
                        <div>
                          <div className="text-sm font-medium text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
                            {t.title}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                            {t.subtitle}
                          </div>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* User Trade RFQs */}
              {results.userRfqs.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-2.5 font-bold flex items-center gap-1.5">
                    <FileText size={14} /> My Trade RFQs (
                    {results.userRfqs.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.userRfqs.map((r) => (
                      <Link
                        key={r.id}
                        href={r.url}
                        onClick={onClose}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--gold)]/40 transition-all text-decoration-none group"
                      >
                        <div>
                          <div className="text-sm font-medium text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
                            {r.title}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                            {r.subtitle}
                          </div>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Matches */}
              {results.products.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-2.5 font-bold flex items-center gap-1.5">
                    <Package size={14} /> Products ({results.products.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.products.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.slug}`}
                        onClick={() => {
                          saveRecentSearch(item.name);
                          onClose();
                        }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--gold)]/40 transition-all group text-decoration-none"
                      >
                        <div className="w-12 h-12 relative bg-[#15130b] rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border)]">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="48px"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--gold)] text-xs font-serif font-bold">
                              J&amp;S
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-mono">
                            SKU: {item.sku} · {item.categoryName}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold font-mono text-[var(--gold)]">
                            {formatPrice(item.price)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Collections Matches */}
              {results.categories.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-2.5 font-bold flex items-center gap-1.5">
                    <LayoutGrid size={14} /> Collections
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.categories.map((c) => (
                      <Link
                        key={c.id}
                        href={c.url}
                        onClick={onClose}
                        className="p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--gold)]/40 transition-all flex items-center justify-between text-decoration-none group"
                      >
                        <span className="text-xs font-medium text-[var(--cream)] group-hover:text-[var(--gold)] truncate">
                          {c.name}
                        </span>
                        <ArrowRight
                          size={14}
                          className="text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
