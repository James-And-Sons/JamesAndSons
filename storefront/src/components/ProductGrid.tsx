"use client";
import { useState, useEffect, useMemo } from "react";
import { formatPrice, Product } from "@/lib/utils";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import Image from "next/image";
import { AdaptiveImageFrame } from "@james-andsons/media";
import InquiryModal from "./InquiryModal";
import FilterPanel from "./FilterPanel";

export default function ProductGrid({
  initialFilter = "All",
  initialProducts,
  initialCategory,
}: {
  initialFilter?: string;
  initialProducts: Product[];
  initialCategory?: string;
}) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuoteProduct, setSelectedQuoteProduct] = useState<any | null>(
    null,
  );

  // Price range filter
  const allPrices = initialProducts.map((p) => p.d2cPrice).filter(Boolean);
  const globalMin =
    allPrices.length > 0 ? Math.floor(Math.min(...allPrices) / 1000) * 1000 : 0;
  const globalMax =
    allPrices.length > 0
      ? Math.ceil(Math.max(...allPrices) / 1000) * 1000
      : 500000;
  const [priceMin, setPriceMin] = useState<number>(globalMin);
  const [priceMax, setPriceMax] = useState<number>(globalMax);

  useEffect(() => {
    setPriceMin(globalMin);
    setPriceMax(globalMax);
  }, [globalMin, globalMax]);

  const priceActive = priceMin > globalMin || priceMax < globalMax;
  const { addItem } = useCartStore();
  const { uniqueCollections, uniqueStyles, uniqueMaterials, uniqueSpaces } =
    useMemo(
      () => ({
        uniqueCollections: Array.from(
          new Set(initialProducts.map((p) => p.collection)),
        )
          .filter((c) => c !== "Uncategorized")
          .sort(),
        uniqueStyles: Array.from(
          new Set(initialProducts.flatMap((p) => p.style || [])),
        )
          .filter(Boolean)
          .sort(),
        uniqueMaterials: Array.from(
          new Set(initialProducts.flatMap((p) => p.materialAndFinish || [])),
        )
          .filter(Boolean)
          .sort(),
        uniqueSpaces: Array.from(
          new Set(initialProducts.flatMap((p) => p.spaces || [])),
        )
          .filter(Boolean)
          .sort(),
      }),
      [initialProducts],
    );

  useEffect(() => {
    if (initialFilter && initialFilter !== "All") {
      const slugify = (text: string) =>
        text
          .toLowerCase()
          .replace(/[^\w ]+/g, "")
          .replace(/ +/g, "-");
      const allPossibleFilters = [
        ...uniqueCollections,
        ...uniqueSpaces,
        ...uniqueStyles,
        ...uniqueMaterials,
        "LED Certified",
      ];
      const matchedFilter = allPossibleFilters.find(
        (f) =>
          slugify(f) === initialFilter ||
          f.toLowerCase() === initialFilter.toLowerCase(),
      );
      if (matchedFilter) {
        setActiveFilters([matchedFilter]);
      } else if (initialFilter) {
        setActiveFilters([initialFilter]);
      }
    }
  }, [initialFilter, initialProducts]);

  // Apply category filter from URL
  useEffect(() => {
    if (initialCategory) {
      const slugify = (text: string) =>
        text
          .toLowerCase()
          .replace(/[^\w ]+/g, "")
          .replace(/ +/g, "-");
      const matched = uniqueCollections.find(
        (c) =>
          slugify(c) === initialCategory.toLowerCase() ||
          c.toLowerCase() === initialCategory.toLowerCase(),
      );
      if (matched) setActiveFilters([matched]);
      else if (initialCategory) setActiveFilters([initialCategory]);
    }
  }, [initialCategory, initialProducts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown-area]")) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  const filters = [
    "All",
    ...uniqueCollections,
    ...uniqueSpaces,
    ...uniqueStyles,
    ...uniqueMaterials,
    "LED Certified",
  ];

  const filteredProducts = useMemo(() => {
    let results = initialProducts;
    // Category / attribute filters
    if (activeFilters.length > 0) {
      results = results.filter((p) =>
        activeFilters.some((filter) => {
          const lowerFilter = filter.toLowerCase();
          const slugify = (text: string) =>
            text
              .toLowerCase()
              .replace(/[^\w ]+/g, "")
              .replace(/ +/g, "-");
          const filterSlug = slugify(filter);
          return (
            (p.collection &&
              (p.collection.toLowerCase() === lowerFilter ||
                slugify(p.collection) === filterSlug)) ||
            (p.spaces &&
              p.spaces.some(
                (s) =>
                  s.toLowerCase() === lowerFilter || slugify(s) === filterSlug,
              )) ||
            (p.style &&
              p.style.some(
                (s) =>
                  s.toLowerCase() === lowerFilter || slugify(s) === filterSlug,
              )) ||
            (p.materialAndFinish &&
              p.materialAndFinish.some(
                (m) =>
                  m.toLowerCase() === lowerFilter || slugify(m) === filterSlug,
              )) ||
            (lowerFilter === "led certified" && p.isLed)
          );
        }),
      );
    }
    // Price range filter
    if (priceActive) {
      results = results.filter(
        (p) => p.d2cPrice >= priceMin && p.d2cPrice <= priceMax,
      );
    }
    return results;
  }, [activeFilters, initialProducts, priceMin, priceMax, priceActive]);

  return (
    <section className="section" id="collections" style={{ padding: 0 }}>
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div
          style={{
            padding: "4px 16px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div className="section-label" style={{ marginBottom: "2px" }}>
              {activeFilters.length === 0 ? "Masterworks" : "Curated Selection"}
            </div>
            <div className="section-title" style={{ fontSize: "22px" }}>
              {activeFilters.length === 0 ? (
                <>
                  All <em>Collections</em>
                </>
              ) : activeFilters.length === 1 ? (
                <>
                  The <em>{activeFilters[0]}</em>
                </>
              ) : (
                <>
                  Filtered <em>Collections</em>
                </>
              )}
            </div>
          </div>
          <div className="mobile-count-badge">
            {filteredProducts.length} products
          </div>
        </div>

        {/* Mobile Sticky Floating Filter Pill Bar */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-black/85 backdrop-blur-md border border-[var(--gold)]/40 text-[var(--gold)] shadow-[0_12px_32px_rgba(0,0,0,0.6)] font-mono text-xs uppercase tracking-wider font-semibold active:scale-95 transition-all"
          >
            <i className="ti ti-adjustments-horizontal text-sm" />
            <span>Filter Catalog</span>
            {activeFilters.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--gold)] text-[var(--obsidian)] text-[10px] font-bold flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        <div
          className="mobile-filter-bar"
          style={{ position: "relative", margin: "16px 24px 0", zIndex: 50 }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              data-dropdown-area="true"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                border: "1px solid var(--border)",
                background: showFilters ? "var(--surface2)" : "var(--surface)",
                color: "var(--text)",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                transition: "all 0.3s ease",
                borderRadius: "16px",
              }}
            >
              <i
                className="ti ti-adjustments-horizontal"
                style={{ fontSize: "14px" }}
              ></i>
              Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
            </button>

            {activeFilters.map((filter) => (
              <div
                key={filter}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  background: "rgba(201,168,76,0.1)",
                  border: "0.5px solid rgba(201,168,76,0.3)",
                  borderRadius: "16px",
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--gold-light)",
                }}
              >
                {filter}
                <button
                  onClick={() => toggleFilter(filter)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    fontSize: "12px",
                  }}
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>
            ))}

            {activeFilters.length > 0 && (
              <button
                onClick={() => {
                  setActiveFilters([]);
                  setShowFilters(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "4px",
                  marginLeft: "4px",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "12px",
                zIndex: 60,
                width: "100%",
              }}
            >
              <FilterPanel
                uniqueCollections={uniqueCollections}
                uniqueSpaces={uniqueSpaces}
                uniqueStyles={uniqueStyles}
                uniqueMaterials={uniqueMaterials}
                activeFilters={activeFilters}
                toggleFilter={toggleFilter}
                clearAllFilters={() => {
                  setActiveFilters([]);
                  setPriceMin(globalMin);
                  setPriceMax(globalMax);
                }}
                globalMin={globalMin}
                globalMax={globalMax}
                priceMin={priceMin}
                priceMax={priceMax}
                setPriceMin={setPriceMin}
                setPriceMax={setPriceMax}
                priceActive={priceActive}
                totalResultsCount={filteredProducts.length}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}
        </div>

        <div className="mobile-products-grid" style={{ marginTop: "16px" }}>
          {filteredProducts.map((product) => {
            const thumbnail =
              product.images?.[0] || product.whiteBackgroundImages?.[0];
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="mobile-product-card"
                style={{
                  background: "var(--card2)",
                  borderRadius: "20px",
                  border: "0.5px solid var(--border2)",
                }}
              >
                {thumbnail ? (
                  <AdaptiveImageFrame
                    src={thumbnail}
                    alt={product.name}
                    objectFit="cover"
                    className="mobile-product-img"
                    style={{
                      background:
                        "linear-gradient(140deg, #181410 0%, #1e1a0f 100%)",
                      borderRadius: "20px 20px 0 0",
                    }}
                  />
                ) : (
                  <div
                    className="mobile-product-img"
                    style={{
                      height: "148px",
                      position: "relative",
                      background:
                        "linear-gradient(140deg, #181410 0%, #1e1a0f 100%)",
                      borderRadius: "20px 20px 0 0",
                      overflow: "hidden",
                    }}
                  >
                    <i
                      className="ti ti-lamp mobile-product-img-icon"
                      style={{
                        fontSize: "38px",
                        color: "var(--gold)",
                        opacity: 0.28,
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    ></i>
                  </div>
                )}
                <div
                  className="mobile-product-info"
                  style={{ padding: "10px 12px 12px" }}
                >
                  <div className="mobile-product-cat">{product.collection}</div>
                  <div
                    className="mobile-product-name"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--text)",
                      lineHeight: 1.35,
                      marginBottom: "8px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {product.name}
                  </div>
                  <div
                    className="mobile-product-footer"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                    }}
                  >
                    <div className="mobile-price-block">
                      <div
                        className="mobile-product-price"
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--gold-light)",
                        }}
                      >
                        {formatPrice(product.d2cPrice)}
                      </div>
                      {product.mrp > product.d2cPrice && (
                        <div className="mobile-price-old">
                          {formatPrice(product.mrp)}
                        </div>
                      )}
                    </div>
                    <button
                      className="mobile-add-btn"
                      style={{
                        width: "30px",
                        height: "30px",
                        background: "var(--gold)",
                        borderRadius: "9px",
                        color: "#0A0905",
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product);
                      }}
                    >
                      <i
                        className="ti ti-plus"
                        style={{ fontSize: "14px" }}
                      ></i>
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {filteredProducts.length > 0 && (
          <div
            className="mobile-list-divider"
            style={{
              height: "0.5px",
              background: "var(--border)",
              margin: "20px 24px 0",
            }}
          ></div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block" style={{ padding: "32px 40px 0" }}>
        <div className="section-header" style={{ marginBottom: "20px" }}>
          <div>
            <div className="section-label">
              {activeFilters.length === 0 ? "Masterworks" : "Curated Selection"}
            </div>
            <h2 className="section-title">
              {activeFilters.length === 0
                ? "All Collections"
                : activeFilters.length === 1
                  ? `The ${activeFilters[0]} Collection`
                  : "Filtered Collections"}
            </h2>
          </div>
          <Link href="/collections" className="link-all">
            View All {filteredProducts.length} Products
          </Link>
        </div>

        <div
          className="filter-bar-container"
          style={{ position: "relative", marginBottom: "32px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                data-dropdown-area="true"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  border: "1px solid var(--border)",
                  background: showFilters
                    ? "var(--surface2)"
                    : "var(--surface)",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  transition: "all 0.3s ease",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                Filters{" "}
                {activeFilters.length > 0 && `(${activeFilters.length} Active)`}
              </button>

              {activeFilters.map((filter) => (
                <div
                  key={filter}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {filter}
                  <button
                    onClick={() => toggleFilter(filter)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {activeFilters.length > 0 && (
                <button
                  onClick={() => {
                    setActiveFilters([]);
                    setShowFilters(false);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "10px",
                    marginLeft: "4px",
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "12px",
                zIndex: 60,
              }}
            >
              <FilterPanel
                uniqueCollections={uniqueCollections}
                uniqueSpaces={uniqueSpaces}
                uniqueStyles={uniqueStyles}
                uniqueMaterials={uniqueMaterials}
                activeFilters={activeFilters}
                toggleFilter={toggleFilter}
                clearAllFilters={() => {
                  setActiveFilters([]);
                  setPriceMin(globalMin);
                  setPriceMax(globalMax);
                }}
                globalMin={globalMin}
                globalMax={globalMax}
                priceMin={priceMin}
                priceMax={priceMax}
                setPriceMin={setPriceMin}
                setPriceMax={setPriceMax}
                priceActive={priceActive}
                totalResultsCount={filteredProducts.length}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => {
            const thumbnail =
              product.images?.[0] || product.whiteBackgroundImages?.[0];
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="product-card"
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {product.badge && (
                  <div
                    className={`product-badge ${product.badge === "new" ? "badge-new" : product.badge === "bis" ? "badge-bis" : product.badge === "b2b" ? "badge-sale" : "badge-sale"}`}
                  >
                    {product.badge === "new"
                      ? "New Release"
                      : product.badge === "bis"
                        ? "BIS Appv."
                        : "B2B Volume"}
                  </div>
                )}

                <div className="product-actions" style={{ zIndex: 2 }}>
                  <button
                    className="prod-action-btn"
                    title="Add to Cart"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addItem(product);
                    }}
                  >
                    +
                  </button>
                  <button
                    className="prod-action-btn"
                    title="Request Quote"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedQuoteProduct(product);
                    }}
                  >
                    Q
                  </button>
                </div>

                <div className="product-img" style={{ position: "relative" }}>
                  <div className="product-img-bg" />

                  {/* Placeholder SVG */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 0,
                    }}
                  >
                    <svg
                      className="prod-chandelier-svg"
                      width="120"
                      height="150"
                      viewBox="0 0 100 120"
                      stroke="#C4A05A"
                      fill="none"
                      style={{ opacity: 0.3 }}
                    >
                      <path
                        d="M50 10 L50 40"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <path
                        d="M20 70 Q50 30 80 70"
                        strokeWidth="2"
                        opacity="0.7"
                      />
                      <circle
                        cx="50"
                        cy="95"
                        r="4"
                        fill="#F5E9C8"
                        stroke="none"
                      />
                    </svg>
                  </div>

                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 33vw, 25vw"
                      className="prod-actual-img"
                      style={{
                        objectFit: "cover",
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                      }}
                    />
                  ) : null}
                </div>

                <div
                  className="product-info"
                  style={{ padding: "20px 20px 24px" }}
                >
                  <div className="product-brand">{product.collection}</div>
                  <div
                    className="product-name"
                    style={{ fontSize: "19px", marginBottom: "12px" }}
                  >
                    {product.name}
                  </div>
                  <div className="product-meta">
                    <div className="product-price">
                      {formatPrice(product.d2cPrice)}
                      {product.mrp > product.d2cPrice && (
                        <span className="product-price-old">
                          {formatPrice(product.mrp)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="product-specs">
                    {product.isLed && (
                      <span className="spec-pill led">
                        {product.luminousEfficacy} lm/W LED
                      </span>
                    )}
                    {product.cri && (
                      <span className="spec-pill">CRI {product.cri}</span>
                    )}
                    <span className="spec-pill gst">
                      GST {product.gstRate}%
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {selectedQuoteProduct && (
        <InquiryModal
          isOpen={!!selectedQuoteProduct}
          onClose={() => setSelectedQuoteProduct(null)}
          product={{
            id: selectedQuoteProduct.id,
            name: selectedQuoteProduct.name,
            sku: selectedQuoteProduct.sku,
            d2cPrice: selectedQuoteProduct.d2cPrice,
            image: selectedQuoteProduct.images?.[0],
          }}
        />
      )}
    </section>
  );
}
