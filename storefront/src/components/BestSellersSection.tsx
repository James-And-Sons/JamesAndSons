"use client";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, Product } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

export default function BestSellersSection({
  products,
}: {
  products: Product[];
}) {
  const { addItem } = useCartStore();

  if (!products || products.length === 0) return null;

  return (
    <section
      className="section"
      id="best-sellers"
      style={{
        padding: "80px 40px",
        background: "var(--obsidian)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="section-header" style={{ marginBottom: "36px" }}>
          <div>
            <div
              className="section-label"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "4px",
              }}
            >
              Client Favorites
            </div>
            <h2
              className="section-title"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 300,
                color: "var(--text)",
              }}
            >
              Best <em>Sellers</em>
            </h2>
          </div>
          <Link
            href="/collections"
            className="link-all"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--gold)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            View All Collection ↗
          </Link>
        </div>

        {/* 6-Grid Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {products.slice(0, 6).map((product, index) => {
            const thumbnail =
              product.images?.[0] || product.whiteBackgroundImages?.[0];
            const rankLabel = String(index + 1).padStart(2, "0");
            const hasDiscount = product.mrp && product.mrp > product.d2cPrice;

            return (
              <div
                key={product.id}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(20,17,14,0.9) 0%, rgba(12,10,8,0.95) 100%)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  display: "flex",
                  gap: "18px",
                  padding: "18px",
                  position: "relative",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
                className="group hover:border-[var(--gold)] hover:shadow-[0_16px_36px_rgba(201,168,76,0.15)] hover:-translate-y-0.5"
              >
                {/* Rank Tag Overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "16px",
                    fontFamily: "var(--font-serif)",
                    fontSize: "28px",
                    fontWeight: 300,
                    color: "var(--gold)",
                    opacity: 0.25,
                    lineHeight: 1,
                    pointerEvents: "none",
                    letterSpacing: "-0.02em",
                  }}
                >
                  #{rankLabel}
                </div>

                {/* Product Thumbnail */}
                <Link
                  href={`/products/${product.slug}`}
                  style={{
                    width: "115px",
                    height: "115px",
                    flexShrink: 0,
                    borderRadius: "8px",
                    overflow: "hidden",
                    position: "relative",
                    background:
                      "linear-gradient(135deg, #1a1612 0%, #0d0a08 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "block",
                  }}
                >
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={product.name}
                      fill
                      className="transition-transform duration-500 ease-out group-hover:scale-110 object-cover"
                      sizes="115px"
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i
                        className="ti ti-lamp"
                        style={{
                          fontSize: "32px",
                          color: "var(--gold)",
                          opacity: 0.25,
                        }}
                      />
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--gold)",
                        marginBottom: "4px",
                      }}
                    >
                      {product.collection || "Signature Series"}
                    </div>

                    <Link
                      href={`/products/${product.slug}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <h3
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "17px",
                          fontWeight: 300,
                          color: "var(--text)",
                          lineHeight: 1.3,
                          marginBottom: "8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.name}
                      </h3>
                    </Link>

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
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--gold-light)",
                        }}
                      >
                        {formatPrice(product.d2cPrice)}
                      </span>
                      {hasDiscount && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--text-dim)",
                            textDecoration: "line-through",
                          }}
                        >
                          {formatPrice(product.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: "flex", gap: "8px", marginTop: "12px" }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product);
                      }}
                      style={{
                        padding: "7px 14px",
                        background:
                          "linear-gradient(135deg, var(--gold) 0%, #b89343 100%)",
                        color: "var(--obsidian)",
                        border: "none",
                        borderRadius: "4px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 4px 12px rgba(201,168,76,0.2)",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:brightness-110 active:scale-95"
                    >
                      <i className="ti ti-plus" style={{ fontSize: "11px" }} />
                      Add to Bag
                    </button>
                    <Link
                      href={`/products/${product.slug}`}
                      style={{
                        padding: "7px 14px",
                        background: "rgba(255,255,255,0.03)",
                        color: "var(--text-muted)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "4px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:!border-[var(--gold)] hover:!text-[var(--gold)]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
