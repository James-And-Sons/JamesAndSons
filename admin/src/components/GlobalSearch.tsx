"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Package,
  ShoppingBag,
  FileText,
  Users,
  LayoutDashboard,
  Settings,
  Sparkles,
  ArrowRight,
  Loader2,
  Tag,
} from "lucide-react";

interface SearchResultItem {
  type: "product" | "order" | "rfq" | "customer";
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

const QUICK_SHORTCUTS = [
  {
    title: "Dashboard Overview",
    href: "/",
    icon: LayoutDashboard,
    category: "Shortcut",
  },
  {
    title: "Product Catalog Management",
    href: "/products",
    icon: Package,
    category: "Shortcut",
  },
  {
    title: "Orders & Fulfillment",
    href: "/orders",
    icon: ShoppingBag,
    category: "Shortcut",
  },
  {
    title: "B2B Trade RFQs",
    href: "/rfqs",
    icon: FileText,
    category: "Shortcut",
  },
  {
    title: "Customer Database",
    href: "/customers",
    icon: Users,
    category: "Shortcut",
  },
  {
    title: "SEO & PageSpeed Engine",
    href: "/seo",
    icon: Sparkles,
    category: "Shortcut",
  },
  {
    title: "Coupons & Discounts",
    href: "/coupons",
    icon: Tag,
    category: "Shortcut",
  },
  {
    title: "Store & Brand Settings",
    href: "/settings",
    icon: Settings,
    category: "Shortcut",
  },
];

export default function GlobalSearch({
  isOpen: externalIsOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
} = {}) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedResults>({
    products: [],
    orders: [],
    rfqs: [],
    customers: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    setInternalIsOpen(false);
    setQuery("");
    setResults({ products: [], orders: [], rfqs: [], customers: [] });
    if (onClose) onClose();
  };

  // Keyboard listener for Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setInternalIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced API search fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ products: [], orders: [], rfqs: [], customers: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(
            data.results || {
              products: [],
              orders: [],
              rfqs: [],
              customers: [],
            },
          );
        }
      } catch (err) {
        console.error("Admin search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const allItems: (SearchResultItem | (typeof QUICK_SHORTCUTS)[0])[] =
    query.trim()
      ? [
          ...results.products,
          ...results.orders,
          ...results.rfqs,
          ...results.customers,
        ]
      : QUICK_SHORTCUTS;

  const handleSelect = (href: string) => {
    handleClose();
    router.push(href);
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length),
      );
    } else if (e.key === "Enter" && allItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(allItems[selectedIndex].href);
    }
  };

  return (
    <>
      {/* Search Header Trigger Bar */}
      <button
        onClick={() => setInternalIsOpen(true)}
        className="flex items-center gap-2.5 border border-border/80 bg-surface-muted/50 px-3 py-1.5 rounded-md text-xs font-mono w-full max-w-[340px] hover:border-accent/60 transition-colors cursor-pointer text-left"
      >
        <Search size={14} className="text-muted shrink-0" aria-hidden="true" />
        <span className="text-muted/80 text-[11px] truncate flex-1">
          Search catalog, orders, RFQs...
        </span>
        <span className="hidden sm:inline-flex text-[10px] font-mono text-muted/80 bg-surface px-1.5 py-0.5 rounded border border-border shrink-0">
          ⌘K
        </span>
      </button>

      {/* Command Palette Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 font-mono">
          <div className="fixed inset-0" onClick={handleClose} />

          <div className="relative w-full max-w-2xl bg-background border border-border shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-border bg-surface">
              <Search size={18} className="text-accent mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a product SKU, order #, customer name, or page..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDownInInput}
                className="flex-1 bg-transparent text-primary text-sm placeholder:text-muted/60 focus:outline-none font-mono"
              />
              {loading && (
                <Loader2
                  size={16}
                  className="text-accent animate-spin mr-3 shrink-0"
                />
              )}
              {query && !loading && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 text-muted hover:text-primary rounded mr-2 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-2 py-0.5 text-[10px] text-muted border border-border rounded hover:text-primary transition-colors cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results Container */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
              {/* Default State: Quick Navigation Shortcuts */}
              {!query.trim() && (
                <div>
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-accent font-bold mb-1">
                    Quick System Navigation
                  </div>
                  <div className="space-y-1">
                    {QUICK_SHORTCUTS.map((item, idx) => {
                      const Icon = item.icon;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleSelect(item.href)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-accent/15 text-accent font-bold"
                              : "hover:bg-surface-muted text-primary"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              size={16}
                              className={
                                isSelected ? "text-accent" : "text-muted"
                              }
                            />
                            <span>{item.title}</span>
                          </div>
                          <ArrowRight
                            size={14}
                            className={
                              isSelected ? "text-accent" : "text-muted/40"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty Query State */}
              {query.trim().length >= 2 &&
                !loading &&
                allItems.length === 0 && (
                  <div className="p-8 text-center text-muted">
                    No matching catalog items, orders, or RFQs found for &ldquo;
                    <span className="text-primary">{query}</span>&rdquo;.
                  </div>
                )}

              {/* Grouped Search Results */}
              {query.trim().length >= 2 && (
                <div className="space-y-4">
                  {/* Products */}
                  {results.products.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-accent font-bold flex items-center gap-1.5 mb-1">
                        <Package size={12} /> Products (
                        {results.products.length})
                      </div>
                      <div className="space-y-1">
                        {results.products.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.href)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-surface-muted transition-colors rounded text-primary group cursor-pointer"
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="w-8 h-8 object-cover border border-border bg-surface shrink-0 rounded"
                              />
                            ) : (
                              <div className="w-8 h-8 border border-border bg-surface flex items-center justify-center text-[9px] text-muted shrink-0 rounded">
                                IMG
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate group-hover:text-accent transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-muted truncate">
                                SKU: {item.subtitle}
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className="text-muted/40 group-hover:text-accent transition-colors"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders */}
                  {results.orders.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-accent font-bold flex items-center gap-1.5 mb-1">
                        <ShoppingBag size={12} /> Orders (
                        {results.orders.length})
                      </div>
                      <div className="space-y-1">
                        {results.orders.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.href)}
                            className="w-full text-left flex items-center justify-between px-3 py-2 hover:bg-surface-muted transition-colors rounded text-primary group cursor-pointer"
                          >
                            <div>
                              <div className="font-semibold group-hover:text-accent transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-muted">
                                {item.subtitle}
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className="text-muted/40 group-hover:text-accent transition-colors"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RFQs */}
                  {results.rfqs.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-accent font-bold flex items-center gap-1.5 mb-1">
                        <FileText size={12} /> B2B Trade RFQs (
                        {results.rfqs.length})
                      </div>
                      <div className="space-y-1">
                        {results.rfqs.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.href)}
                            className="w-full text-left flex items-center justify-between px-3 py-2 hover:bg-surface-muted transition-colors rounded text-primary group cursor-pointer"
                          >
                            <div>
                              <div className="font-semibold group-hover:text-accent transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-muted">
                                {item.subtitle}
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className="text-muted/40 group-hover:text-accent transition-colors"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customers */}
                  {results.customers.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-accent font-bold flex items-center gap-1.5 mb-1">
                        <Users size={12} /> Customers (
                        {results.customers.length})
                      </div>
                      <div className="space-y-1">
                        {results.customers.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.href)}
                            className="w-full text-left flex items-center justify-between px-3 py-2 hover:bg-surface-muted transition-colors rounded text-primary group cursor-pointer"
                          >
                            <div>
                              <div className="font-semibold group-hover:text-accent transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-muted">
                                {item.subtitle}
                              </div>
                            </div>
                            <ArrowRight
                              size={14}
                              className="text-muted/40 group-hover:text-accent transition-colors"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Key Hints */}
            <div className="px-4 py-2 bg-surface border-t border-border flex items-center justify-between text-[10px] text-muted font-mono">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="bg-background px-1 py-0.5 rounded border border-border">
                    ↑
                  </kbd>{" "}
                  <kbd className="bg-background px-1 py-0.5 rounded border border-border">
                    ↓
                  </kbd>{" "}
                  Navigate
                </span>
                <span>
                  <kbd className="bg-background px-1 py-0.5 rounded border border-border">
                    ↵
                  </kbd>{" "}
                  Select
                </span>
                <span>
                  <kbd className="bg-background px-1 py-0.5 rounded border border-border">
                    ESC
                  </kbd>{" "}
                  Close
                </span>
              </div>
              <span className="text-accent font-bold">Admin Portal</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
