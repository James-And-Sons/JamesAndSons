"use client";
import Link from "next/link";
import { AdaptiveImageFrame } from "@james-andsons/media";
import { formatPrice, Product } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

export default function NewArrivalsSection({
  products,
}: {
  products: Product[];
}) {
  const { addItem } = useCartStore();

  if (!products || products.length === 0) return null;

  return (
    <section
      className="section"
      id="new-arrivals"
      style={{
        padding: "80px 40px",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, var(--background) 70%)",
        borderTop: "1px solid var(--border)",
        overflow: "hidden",
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
              Fresh from our Atelier
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
              New <em>Arrivals</em>
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
            Explore All ↗
          </Link>
        </div>

        {/* Product Cards Grid / Horizontal Scroll */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {products.slice(0, 4).map((product) => {
            const thumbnail =
              product.images?.[0] || product.whiteBackgroundImages?.[0];
            const hasDiscount = product.mrp && product.mrp > product.d2cPrice;
            const discountPercent = hasDiscount
              ? Math.round(
                  ((product.mrp - product.d2cPrice) / product.mrp) * 100,
                )
              : 0;

            return (
              <div
                key={product.id}
                style={{
                  background:
                    "linear-gradient(145deg, rgba(20,17,14,0.85) 0%, rgba(10,9,7,0.95) 100%)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                }}
                className="group hover:border-[var(--gold)] hover:shadow-[0_20px_40px_rgba(201,168,76,0.14)] hover:-translate-y-1"
              >
                {/* Floating "NEW RELEASE" Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    zIndex: 10,
                    background:
                      "linear-gradient(135deg, var(--gold) 0%, #b89343 100%)",
                    color: "var(--obsidian)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "8.5px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  }}
                >
                  New Release
                </div>

                {/* Product Image Area */}
                <Link
                  href={`/products/${product.slug}`}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1/1",
                    background:
                      "linear-gradient(145deg, #181410 0%, #110d09 100%)",
                    overflow: "hidden",
                    display: "block",
                  }}
                >
                  {thumbnail ? (
                    <AdaptiveImageFrame
                      src={thumbnail}
                      alt={product.name}
                      objectFit="cover"
                      imgClassName="transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i
                        className="ti ti-lamp"
                        style={{
                          fontSize: "54px",
                          color: "var(--gold)",
                          opacity: 0.2,
                        }}
                      />
                    </div>
                  )}
                  {/* Subtle Luxury Vignette Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(10,9,5,0.7) 0%, transparent 45%)",
                      pointerEvents: "none",
                    }}
                  />
                </Link>

                {/* Card Content */}
                <div
                  style={{
                    padding: "20px",
                    flex: 1,
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
                        marginBottom: "6px",
                      }}
                    >
                      {product.collection || "Luxury Collection"}
                    </div>

                    <Link
                      href={`/products/${product.slug}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <h3
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "18px",
                          fontWeight: 300,
                          color: "var(--text)",
                          lineHeight: 1.3,
                          marginBottom: "12px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <div>
                    {/* Price and Discount Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "var(--gold-light)",
                        }}
                      >
                        {formatPrice(product.d2cPrice)}
                      </span>
                      {hasDiscount && (
                        <>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "12px",
                              color: "var(--text-dim)",
                              textDecoration: "line-through",
                            }}
                          >
                            {formatPrice(product.mrp)}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "9px",
                              background: "rgba(201,168,76,0.15)",
                              border: "1px solid rgba(201,168,76,0.3)",
                              color: "var(--gold)",
                              padding: "2px 7px",
                              borderRadius: "3px",
                              fontWeight: 600,
                            }}
                          >
                            {discountPercent}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {/* Quick Add Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product);
                      }}
                      style={{
                        width: "100%",
                        padding: "11px",
                        background: "transparent",
                        border: "1px solid var(--border-gold)",
                        color: "var(--gold)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.25s ease",
                      }}
                      className="hover:!bg-[var(--gold)] hover:!text-[var(--obsidian)] active:scale-95"
                    >
                      <i className="ti ti-plus" style={{ fontSize: "12px" }} />
                      Add to Bag
                    </button>
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
