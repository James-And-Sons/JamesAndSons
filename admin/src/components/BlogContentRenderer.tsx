"use client";
import React from "react";
import Link from "next/link";
import { SimpleProduct } from "./BlogProductPickerModal";

interface BlogContentRendererProps {
  content: string;
  productsMap: Record<string, SimpleProduct>;
  featuredImg?: string | null;
}

function renderInlineMarkdown(text: string) {
  if (!text) return null;

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
        <em key={i} className="italic text-accent">
          {part.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-medium transition-colors"
        >
          {linkMatch[1]}
        </a>
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
          className="my-5 space-y-2.5 pl-6 list-disc list-outside text-primary marker:text-accent"
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

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList(`hr-${idx}`);
      elements.push(
        <hr
          key={`hr-${idx}`}
          className="my-8 border-t border-border opacity-60"
        />,
      );
      return;
    }

    if (trimmed.startsWith("#### ")) {
      flushList(`h4-${idx}`);
      elements.push(
        <h4
          key={`h4-${idx}`}
          className="font-serif text-xl md:text-2xl text-primary font-light mt-8 mb-3 tracking-wide"
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
          className="font-serif text-2xl md:text-3xl text-primary font-light mt-10 mb-4 border-b border-border/40 pb-2 tracking-wide flex items-center gap-2"
        >
          <span className="text-accent text-lg">✦</span>
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
          className="font-serif text-3xl md:text-4xl text-primary font-light mt-12 mb-5 border-b border-accent/30 pb-3 tracking-wide text-accent"
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
          className="font-serif text-4xl md:text-5xl text-primary font-light mt-12 mb-6"
        >
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
        </h1>,
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      flushList(`quote-${idx}`);
      elements.push(
        <blockquote
          key={`quote-${idx}`}
          className="my-6 p-5 rounded-r-2xl bg-gradient-to-r from-accent/10 to-transparent border-l-4 border-accent text-primary font-serif italic text-lg md:text-xl leading-relaxed"
        >
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
        </blockquote>,
      );
      return;
    }

    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      inList = true;
      listItems.push(trimmed.replace(/^[*|-]\s+/, ""));
      return;
    }

    flushList(`flush-${idx}`);

    // Product shortcode card
    const productMatch = trimmed.match(/^\[product:([a-zA-Z0-9-]+)\]$/i);
    if (productMatch) {
      const pSlug = productMatch[1].toLowerCase();
      const product = productsMap[pSlug];

      if (product) {
        const thumb = product.images?.[0] || product.whiteBackgroundImages?.[0];

        elements.push(
          <div
            key={`prod-${idx}`}
            className="my-6 p-4 rounded-xl bg-surface border border-accent/30 shadow-xl flex items-center gap-4 group"
          >
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black/40 border border-white/10 relative">
              {thumb ? (
                <img
                  src={thumb}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-accent">JS</span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="font-mono text-[9px] uppercase tracking-widest text-accent">
                {product.collection || "Signature Fixture"}
              </div>
              <div className="font-serif text-lg font-light text-primary truncate">
                {product.name}
              </div>
              <div className="font-mono text-sm text-accent font-semibold">
                ₹{product.d2cPrice?.toLocaleString() || "N/A"}
              </div>
            </div>
          </div>,
        );
        return;
      }
    }

    // Photo Shortcode
    const imageMatch = trimmed.match(
      /^!\[(.*?)\]\((.*?)(?:#(?:product:)?([a-zA-Z0-9-]+))?\)$/,
    );
    if (imageMatch) {
      const altText = imageMatch[1] || "Product Photo";
      const imgUrl = imageMatch[2];
      const linkedSlug = imageMatch[3];

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
          <div className="relative rounded-xl overflow-hidden border border-accent/30 bg-black/50 shadow-xl group">
            <img
              src={imgUrl}
              alt={altText}
              className="w-full h-48 object-cover"
            />
          </div>
          {altText && (
            <p className="mt-1.5 text-center font-mono text-[11px] text-muted italic tracking-wide">
              {altText} {linkedProduct && `— ${linkedProduct.name}`}
            </p>
          )}
        </div>,
      );
      return;
    }

    elements.push(
      <p key={`p-${idx}`} className="my-4 leading-relaxed text-primary/90">
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
  });

  flushList("end");

  return (
    <div className="blog-content-container space-y-2 text-[15px] md:text-[16px] text-primary leading-[1.85] opacity-95 clearfix">
      {elements}
    </div>
  );
}
