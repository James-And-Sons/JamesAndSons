"use client";
import React from "react";
import Link from "next/link";
import { Product, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { AdaptiveImageFrame } from "@james-andsons/media";

interface BlogContentRendererProps {
  content: string;
  productsMap: Record<string, Product>;
  featuredImg?: string | null;
}

// Helper to parse inline markdown (bold, italic, links)
function renderInlineMarkdown(text: string) {
  if (!text) return null;

  // Split by bold (**text**), italic (*text*), and links ([text](url))
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return (
        <em key={i} className="italic text-[var(--gold-light)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <Link
          key={i}
          href={linkMatch[2]}
          className="text-[var(--gold)] hover:underline font-medium transition-colors"
        >
          {linkMatch[1]}
        </Link>
      );
    }
    return part;
  });
}

export default function BlogContentRenderer({
  content,
  productsMap,
  featuredImg,
}: BlogContentRendererProps) {
  const { addItem } = useCartStore();

  if (!content) return null;

  const rawLines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul
          key={`${keyPrefix}-ul`}
          className="my-5 space-y-2.5 pl-6 list-disc list-outside text-[var(--cream)] marker:text-[var(--gold)]"
        >
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="leading-relaxed">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>,
      );
      listItems = [];
      inList = false;
    }
  };

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`line-${idx}`);
      return;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList(`hr-${idx}`);
      elements.push(
        <hr
          key={`hr-${idx}`}
          className="my-8 border-t border-[var(--border)] opacity-60"
        />,
      );
      return;
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      flushList(`h4-${idx}`);
      elements.push(
        <h4
          key={`h4-${idx}`}
          className="font-serif text-xl md:text-2xl text-[var(--cream)] font-light mt-8 mb-3 tracking-wide"
        >
          {renderInlineMarkdown(trimmed.replace(/^####\s+/, ""))}
        </h4>,
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList(`h3-${idx}`);
      elements.push(
        <h3
          key={`h3-${idx}`}
          className="font-serif text-2xl md:text-3xl text-[var(--cream)] font-light mt-10 mb-4 border-b border-[var(--border)]/40 pb-2 tracking-wide flex items-center gap-2"
        >
          <span className="text-[var(--gold)] text-lg">✦</span>
          <span>{renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}</span>
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList(`h2-${idx}`);
      elements.push(
        <h2
          key={`h2-${idx}`}
          className="font-serif text-3xl md:text-4xl text-[var(--cream)] font-light mt-12 mb-5 border-b border-[var(--gold)]/30 pb-3 tracking-wide text-gradient-gold"
        >
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
        </h2>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList(`h1-${idx}`);
      elements.push(
        <h1
          key={`h1-${idx}`}
          className="font-serif text-4xl md:text-5xl text-[var(--cream)] font-light mt-12 mb-6"
        >
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
        </h1>,
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList(`quote-${idx}`);
      elements.push(
        <blockquote
          key={`quote-${idx}`}
          className="my-6 p-5 rounded-r-2xl bg-gradient-to-r from-[var(--gold)]/10 to-transparent border-l-4 border-[var(--gold)] text-[var(--cream)] font-serif italic text-lg md:text-xl leading-relaxed"
        >
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
        </blockquote>,
      );
      return;
    }

    // Bullet Lists (* or -)
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      inList = true;
      listItems.push(trimmed.replace(/^[*|-]\s+/, ""));
      return;
    }

    // If line is not a bullet list, flush list
    flushList(`flush-${idx}`);

    // 1. Embedded Shoppable Product Card Shortcode: [product:slug]
    const productMatch = trimmed.match(/^\[product:([a-zA-Z0-9-]+)\]$/i);
    if (productMatch) {
      const pSlug = productMatch[1].toLowerCase();
      const product = productsMap[pSlug];

      if (product) {
        const thumb = product.images?.[0] || product.whiteBackgroundImages?.[0];
        const hasDiscount = product.mrp && product.mrp > product.d2cPrice;

        elements.push(
          <div
            key={`prod-${idx}`}
            className="my-8 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[rgba(20,17,14,0.95)] to-[rgba(10,9,7,0.95)] border border-[var(--gold)]/30 shadow-2xl flex flex-col sm:flex-row items-center gap-6 group hover:border-[var(--gold)] transition-all"
          >
            {/* Product Photo */}
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

            {/* Product Details & Add to Bag */}
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
          </div>,
        );
        return;
      }
    }

    // 2. Embedded Photo Link Shortcode: ![alt](url#product:slug) or ![alt](url#align:left|right)
    const imageMatch = trimmed.match(
      /^!\[(.*?)\]\((.*?)(?:#(?:product:)?([a-zA-Z0-9-]+))?\)$/,
    );
    if (imageMatch) {
      const altText = imageMatch[1] || "Product Photo";
      const imgUrl = imageMatch[2];
      const linkedSlug = imageMatch[3];

      // Avoid duplicating top featured image
      if (featuredImg && imgUrl === featuredImg) {
        return;
      }

      const linkedProduct = linkedSlug
        ? productsMap[linkedSlug.toLowerCase()]
        : null;

      elements.push(
        <div
          key={`img-${idx}`}
          className="my-6 md:float-right md:ml-6 md:mb-4 md:w-80 w-full clear-both"
        >
          <div className="relative rounded-xl overflow-hidden border border-[var(--gold)]/30 bg-black/50 shadow-xl group">
            {linkedSlug ? (
              <Link
                href={`/products/${linkedSlug}`}
                className="block relative group/link"
              >
                <AdaptiveImageFrame
                  src={imgUrl}
                  alt={altText}
                  objectFit="cover"
                  aspectRatio="4/3"
                  imgClassName="transition-transform duration-700 group-hover/link:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/link:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <span className="px-3 py-1.5 rounded-full bg-[var(--gold)] text-black font-mono text-[11px] uppercase tracking-widest font-bold shadow-xl flex items-center gap-1.5">
                    <span>View {linkedProduct?.name || "Product"} ↗</span>
                  </span>
                </div>
              </Link>
            ) : (
              <AdaptiveImageFrame
                src={imgUrl}
                alt={altText}
                objectFit="cover"
                aspectRatio="4/3"
              />
            )}
          </div>
          {altText && (
            <p className="mt-1.5 text-center font-mono text-[11px] text-[var(--text-muted)] italic tracking-wide">
              {altText} {linkedProduct && `— ${linkedProduct.name}`}
            </p>
          )}
        </div>,
      );
      return;
    }

    // Regular Paragraph
    elements.push(
      <p
        key={`p-${idx}`}
        className="my-4 leading-relaxed text-[var(--cream)]/90"
      >
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
  });

  flushList("end");

  return (
    <div className="blog-content-container space-y-2 text-[16px] md:text-[17px] text-[var(--cream)] leading-[1.85] opacity-95 clearfix">
      {elements}
    </div>
  );
}
