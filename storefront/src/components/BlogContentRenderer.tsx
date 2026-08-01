"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { AdaptiveImageFrame } from "@james-andsons/media";

interface BlogContentRendererProps {
  content: string;
  productsMap: Record<string, Product>;
}

export default function BlogContentRenderer({
  content,
  productsMap,
}: BlogContentRendererProps) {
  const { addItem } = useCartStore();

  if (!content) return null;

  // Split content into blocks or lines to process shortcodes and images
  const lines = content.split("\n");

  return (
    <div className="blog-content-container space-y-6 text-[16px] md:text-[17px] text-[var(--cream)] leading-[1.85] opacity-95">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // 1. Check for Embedded Product Shortcode: [product:slug]
        const productMatch = trimmed.match(/^\[product:([a-zA-Z0-9-]+)\]$/i);
        if (productMatch) {
          const pSlug = productMatch[1].toLowerCase();
          const product = productsMap[pSlug];

          if (product) {
            const thumb =
              product.images?.[0] || product.whiteBackgroundImages?.[0];
            const hasDiscount = product.mrp && product.mrp > product.d2cPrice;

            return (
              <div
                key={idx}
                className="my-8 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[rgba(20,17,14,0.95)] to-[rgba(10,9,7,0.95)] border border-[var(--border-gold)]/40 shadow-2xl flex flex-col sm:flex-row items-center gap-6 group hover:border-[var(--gold)] transition-all"
              >
                {/* Product Photo Link */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative w-full sm:w-36 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-black/40 border border-white/10 block group/img"
                >
                  {thumb ? (
                    <AdaptiveImageFrame
                      src={thumb}
                      alt={product.name}
                      objectFit="cover"
                      imgClassName="transition-transform duration-500 group-hover/img:scale-108"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="ti ti-lamp text-3xl text-[var(--gold)] opacity-30" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/80 text-[var(--gold)] font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--gold)]/30 backdrop-blur-sm">
                    View ↗
                  </span>
                </Link>

                {/* Info & Cart Actions */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--gold)]">
                    {product.collection || "Signature Fixture"}
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-serif text-xl font-light text-[var(--cream)] hover:text-[var(--gold-light)] transition-colors block truncate"
                  >
                    {product.name}
                  </Link>

                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="font-mono text-base font-semibold text-[var(--gold-light)]">
                      {formatPrice(product.d2cPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="font-mono text-xs text-[var(--text-dim)] line-through">
                        {formatPrice(product.mrp)}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <button
                      onClick={() => addItem(product)}
                      className="px-5 py-2 rounded bg-[var(--gold)] text-black font-mono text-[10px] uppercase tracking-widest font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--gold)]/15"
                    >
                      + Add to Bag
                    </button>
                    <Link
                      href={`/products/${product.slug}`}
                      className="px-4 py-2 rounded border border-white/20 text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] font-mono text-[10px] uppercase tracking-widest transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          }
        }

        // 2. Check for Product Photo Image Link syntax: ![alt](url#product:slug) or ![alt](url#slug)
        const imageMatch = trimmed.match(
          /^!\[(.*?)\]\((.*?)(?:#(?:product:)?([a-zA-Z0-9-]+))?\)$/,
        );
        if (imageMatch) {
          const altText = imageMatch[1] || "Product Image";
          const imgUrl = imageMatch[2];
          const linkedSlug = imageMatch[3];

          const linkedProduct = linkedSlug
            ? productsMap[linkedSlug.toLowerCase()]
            : null;

          return (
            <div key={idx} className="my-6 space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 group">
                {linkedSlug ? (
                  <Link
                    href={`/products/${linkedSlug}`}
                    className="block relative group/link"
                  >
                    <AdaptiveImageFrame
                      src={imgUrl}
                      alt={altText}
                      objectFit="cover"
                      imgClassName="transition-transform duration-700 group-hover/link:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/link:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="px-4 py-2 rounded-full bg-[var(--gold)] text-black font-mono text-xs uppercase tracking-widest font-bold shadow-xl flex items-center gap-2">
                        <i className="ti ti-shopping-bag text-sm" />
                        <span>View {linkedProduct?.name || "Product"} ↗</span>
                      </span>
                    </div>
                  </Link>
                ) : (
                  <AdaptiveImageFrame
                    src={imgUrl}
                    alt={altText}
                    objectFit="cover"
                  />
                )}
              </div>
              {altText && (
                <p className="text-center font-mono text-xs text-[var(--text-muted)] italic tracking-wide">
                  {altText} {linkedProduct && `— ${linkedProduct.name}`}
                </p>
              )}
            </div>
          );
        }

        // Standard Text Paragraph
        return (
          <p key={idx} className="my-3">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
