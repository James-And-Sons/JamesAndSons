import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product, formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";

type Props = { products: Product[]; onClose: () => void };

interface SearchResultItem {
  id: string;
  type: "product" | "page" | "account" | "blog" | "order";
  title: string;
  subtitle: string;
  url: string;
  price?: number;
  imageUrl?: string;
  badge?: string;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Helper to construct Cloudinary thumbnail URL (100x100)
function getCloudinaryThumbnail(url?: string): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  if (!url.includes("res.cloudinary.com") || url.includes("f_auto")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_100,h_100,c_fill/");
}

// Static Site & Feature Navigation Search Index
const PLATFORM_SITE_INDEX: SearchResultItem[] = [
  {
    id: "page-catalogues",
    type: "page",
    title: "Digital Catalogues",
    subtitle: "Browse digital luxury lighting catalogues",
    url: "/catalogues",
    badge: "Collection",
  },
  {
    id: "page-b2b",
    type: "page",
    title: "Trade & B2B Portal",
    subtitle: "Architect & Designer trade registration & bulk RFQ",
    url: "/b2b",
    badge: "Trade",
  },
  {
    id: "page-rfq",
    type: "page",
    title: "Request Custom Quote (RFQ)",
    subtitle: "Bespoke chandeliers & custom commercial quotes",
    url: "/rfq",
    badge: "Custom",
  },
  {
    id: "page-blog",
    type: "blog",
    title: "Design Journal & Articles",
    subtitle: "Lighting guides, architectural trends & heritage stories",
    url: "/blog",
    badge: "Editorial",
  },
  {
    id: "page-contact",
    type: "page",
    title: "Contact Atelier & Concierge",
    subtitle: "Get in touch with James & Sons lighting specialists",
    url: "/contact",
    badge: "Support",
  },
  {
    id: "page-track",
    type: "order",
    title: "Track Order & Shipment",
    subtitle: "Check real-time status of your delivery",
    url: "/track",
    badge: "Logistics",
  },
  {
    id: "page-returns",
    type: "page",
    title: "Returns & Replacement Policy",
    subtitle: "30-day luxury white-glove replacement policy",
    url: "/returns-policy",
    badge: "Policy",
  },
  {
    id: "page-warranties",
    type: "page",
    title: "Warranty Registration",
    subtitle: "Register & claim 5-year fixture warranty",
    url: "/warranties",
    badge: "Warranty",
  },
  {
    id: "acc-orders",
    type: "account",
    title: "My Orders & Invoices",
    subtitle: "View your order history & download tax invoices",
    url: "/account/orders",
    badge: "Account",
  },
  {
    id: "acc-tickets",
    type: "account",
    title: "My Support Tickets",
    subtitle: "Manage active customer care support tickets",
    url: "/account/tickets",
    badge: "Account",
  },
  {
    id: "acc-addresses",
    type: "account",
    title: "Saved Shipping Addresses",
    subtitle: "Manage billing & shipping address book",
    url: "/account/addresses",
    badge: "Account",
  },
  {
    id: "acc-wishlist",
    type: "account",
    title: "My Curated Wishlist",
    subtitle: "Saved luxury lighting fixtures",
    url: "/account/wishlist",
    badge: "Account",
  },
];

export default function SearchModal({ products, onClose }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 180);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (mounted) {
      inputRef.current?.focus();
    }
  }, [mounted]);

  // Meta Pixel Search Event
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      if (
        typeof window !== "undefined" &&
        typeof window.trackMetaEvent === "function"
      ) {
        window.trackMetaEvent("Search", {
          search_string: debouncedQuery.trim(),
        });
      }
    }
  }, [debouncedQuery]);

  // Compute Full-Site Search Results
  const searchResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const items: SearchResultItem[] = [];

    // 1. Order Number Query Match (Privacy-Safe Public Lookup)
    if (/\d+/.test(q) || q.startsWith("ord") || q.startsWith("#")) {
      const cleanNum = q.replace(/[^a-zA-Z0-9]/g, "");
      items.push({
        id: `order-lookup-${cleanNum}`,
        type: "order",
        title: `Track Order #${cleanNum}`,
        subtitle: `Track shipment & live courier status for order ${cleanNum}`,
        url: `/track/${cleanNum}`,
        badge: "Order Tracking",
      });
    }

    // 2. Product Search Match
    const matchedProducts = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.spaces.some((s) => s.toLowerCase().includes(q)) ||
          (p.materialAndFinish &&
            p.materialAndFinish.some((m) => m.toLowerCase().includes(q))),
      )
      .slice(0, 10);

    matchedProducts.forEach((p) => {
      const thumb = p.images?.[0] || p.whiteBackgroundImages?.[0];
      items.push({
        id: `prod-${p.id}`,
        type: "product",
        title: p.name,
        subtitle: `${p.collection} · SKU: ${p.sku}`,
        url: `/products/${p.slug}`,
        price: p.d2cPrice,
        imageUrl: getCloudinaryThumbnail(thumb),
        badge: p.collection || "Product",
      });
    });

    // 3. Site Pages & Features Match
    const matchedPages = PLATFORM_SITE_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q),
    );
    items.push(...matchedPages);

    return items;
  }, [debouncedQuery, products]);

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
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "680px",
          maxWidth: "calc(100vw - 32px)",
          background: "var(--void)",
          border: "1px solid var(--border-gold)",
          zIndex: 10000,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
            padding: "0 20px",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, order #, catalogues, blogs, tickets..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--text)",
              padding: "18px 16px",
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              width: "28px",
              height: "28px",
              cursor: "pointer",
              fontSize: "11px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        {debouncedQuery.trim().length >= 2 && (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "20px",
                    fontWeight: 300,
                    color: "var(--text-muted)",
                  }}
                >
                  No results for "{debouncedQuery}"
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
                  Try searching product name, order #, catalogue, or ticket
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "10px 20px",
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}
                  >
                    {searchResults.length} indexed result
                    {searchResults.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "14px 20px",
                      borderBottom: "1px solid var(--border)",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                    className="hover:bg-[var(--surface)] transition-colors"
                  >
                    {/* Thumbnail Frame (Cloudinary optimized or Icon) */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "6px",
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <i
                          className={
                            item.type === "order"
                              ? "ti ti-package text-[var(--gold)] text-lg"
                              : item.type === "account"
                                ? "ti ti-user text-[var(--gold)] text-lg"
                                : item.type === "blog"
                                  ? "ti ti-news text-[var(--gold)] text-lg"
                                  : "ti ti-compass text-[var(--gold)] text-lg"
                          }
                        />
                      )}
                    </div>

                    {/* Result Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "var(--gold)",
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "16px",
                          fontWeight: 300,
                          color: "var(--cream)",
                          marginTop: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--text-dim)",
                          marginTop: "1px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>

                    {/* Price if product */}
                    {item.price !== undefined && (
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "15px",
                          fontWeight: 500,
                          color: "var(--gold-light)",
                          flexShrink: 0,
                        }}
                      >
                        {formatPrice(item.price)}
                      </div>
                    )}
                  </Link>
                ))}
              </>
            )}
          </div>
        )}

        {/* Default state hints */}
        {debouncedQuery.trim().length < 2 && (
          <div style={{ padding: "20px 20px" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
                marginBottom: "12px",
              }}
            >
              Quick Index Shortcuts
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { label: "Crystal Chandeliers", q: "Crystal" },
                { label: "LED Certified", q: "LED" },
                { label: "Catalogues", q: "Catalogues" },
                { label: "Track Order", q: "Track" },
                { label: "My Orders", q: "Orders" },
                { label: "Support Tickets", q: "Tickets" },
              ].map((hint) => (
                <button
                  key={hint.label}
                  onClick={() => setQuery(hint.q)}
                  className="filter-btn"
                  style={{
                    padding: "6px 12px",
                    fontSize: "11px",
                    borderRadius: "4px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {hint.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
