"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

type SearchModalProps = {
  onClose: () => void;
};

const TRENDING_TAGS = [
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
  const [results, setResults] = useState<{
    products: any[];
    categories: any[];
    spaces: any[];
    blogs: any[];
  }>({ products: [], categories: [], spaces: [], blogs: [] });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {}
  }, []);

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
      setResults({ products: [], categories: [], spaces: [], blogs: [] });
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
    results.blogs.length > 0;

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/80 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 px-4">
      {/* Backdrop Click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0f0d08] border border-[var(--border)] rounded-[24px] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Search Input Bar */}
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface)]"
        >
          <Search size={22} className="text-[var(--gold)] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products, SKUs, collections, spaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-[var(--cream)] text-base placeholder-[var(--text-muted)] focus:outline-none font-sans"
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
              className="p-1 text-[var(--text-muted)] hover:text-white rounded-lg mr-2 cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-mono text-[var(--text-muted)] border border-[var(--border)] rounded-md hover:text-white transition-colors cursor-pointer shrink-0"
          >
            ESC
          </button>
        </form>

        {/* Results / Default State Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Default State: Recent Searches & Trending Tags */}
          {!query.trim() && (
            <div className="space-y-6">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--gold)] mb-3">
                    <span className="flex items-center gap-1.5 font-semibold">
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
                <div className="text-xs font-mono uppercase tracking-wider text-[var(--gold)] mb-3 flex items-center gap-1.5 font-semibold">
                  <Sparkles size={14} /> Popular Trending Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSelectTerm(tag)}
                      className="px-3.5 py-1.5 rounded-xl bg-[rgba(196,160,90,0.08)] border border-[rgba(196,160,90,0.2)] text-xs text-[var(--gold-light)] hover:bg-[rgba(196,160,90,0.18)] transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. No Match State */}
          {query.trim().length >= 2 && !loading && !hasResults && (
            <div className="text-center py-10 text-[var(--text-muted)] text-sm font-mono">
              No matching products or categories found for &ldquo;
              <span className="text-[var(--cream)]">{query}</span>&rdquo;.
              <div className="mt-4">
                <button
                  onClick={handleFormSubmit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
                >
                  Search Full Catalog <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* 3. Categorized Search Results */}
          {hasResults && (
            <div className="space-y-6">
              {/* Product Matches */}
              {results.products.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-3 font-bold flex items-center gap-1.5">
                    <Package size={14} /> Products ({results.products.length})
                  </div>
                  <div className="space-y-2">
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
                          {item.inStock ? (
                            <span className="text-[10px] font-mono text-[var(--green)]">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">
                              Made to Order
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories & Collections Matches */}
              {results.categories.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-3 font-bold flex items-center gap-1.5">
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

              {/* Spaces / Rooms Matches */}
              {results.spaces.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-3 font-bold flex items-center gap-1.5">
                    <Compass size={14} /> Spaces &amp; Environments
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.spaces.map((s) => (
                      <Link
                        key={s.id}
                        href={s.url}
                        onClick={onClose}
                        className="p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--gold)]/40 transition-all flex items-center justify-between text-decoration-none group"
                      >
                        <span className="text-xs font-medium text-[var(--cream)] group-hover:text-[var(--gold)] truncate">
                          {s.name}
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

              {/* Blog Article Matches */}
              {results.blogs.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--gold)] mb-3 font-bold flex items-center gap-1.5">
                    <FileText size={14} /> Articles &amp; Journal
                  </div>
                  <div className="space-y-2">
                    {results.blogs.map((b) => (
                      <Link
                        key={b.id}
                        href={b.url}
                        onClick={onClose}
                        className="p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--gold)]/40 transition-all flex items-center justify-between text-decoration-none group"
                      >
                        <span className="text-xs font-medium text-[var(--cream)] group-hover:text-[var(--gold)] truncate">
                          {b.title}
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

              {/* View All Results Button */}
              <div className="pt-2 text-center">
                <button
                  onClick={handleFormSubmit}
                  className="w-full py-3 rounded-xl bg-[rgba(196,160,90,0.12)] hover:bg-[rgba(196,160,90,0.2)] border border-[rgba(196,160,90,0.3)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--gold)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  View All Search Results <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
