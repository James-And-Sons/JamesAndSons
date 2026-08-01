"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

export interface SimpleProduct {
  id: string | number;
  name: string;
  slug: string;
  sku?: string;
  d2cPrice?: number | null;
  images?: string[];
  whiteBackgroundImages?: string[];
  collection?: string | null;
}

interface BlogMarkdownRendererProps {
  content: string;
  productsMap?: Record<string, SimpleProduct>;
  featuredImg?: string | null;
  /** Pass a Link component from Next.js or a plain anchor fallback */
  LinkComponent?: React.ComponentType<{
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
  }>;
}

/**
 * Transforms raw markdown content, replacing product/image shortcodes
 * so react-markdown can handle the rest as standard GFM.
 * We keep shortcodes as-is for now and handle them in custom renderers.
 */
function preprocessContent(content: string): string {
  // Normalise Windows line endings
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function BlogMarkdownRenderer({
  content,
  productsMap = {},
  featuredImg,
  LinkComponent,
}: BlogMarkdownRendererProps) {
  if (!content) return null;

  const processed = preprocessContent(content);

  const LinkEl =
    LinkComponent ||
    (({ href, children, className, target, rel }: any) => (
      <a href={href} className={className} target={target} rel={rel}>
        {children}
      </a>
    ));

  const components: Components | any = {
    // ── Headings ─────────────────────────────────────────────────────────────
    h1: ({ children }: any) => <h1 className="blog-md-h1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="blog-md-h2">{children}</h2>,
    h3: ({ children }: any) => (
      <h3 className="blog-md-h3">
        <span className="blog-md-h3-icon">✦</span>
        <span>{children}</span>
      </h3>
    ),
    h4: ({ children }: any) => <h4 className="blog-md-h4">{children}</h4>,
    h5: ({ children }: any) => <h5 className="blog-md-h5">{children}</h5>,
    h6: ({ children }: any) => <h6 className="blog-md-h6">{children}</h6>,

    // ── Paragraph ────────────────────────────────────────────────────────────
    p: ({ children, node }: any) => {
      // Check if this paragraph is a product shortcode
      const raw = (node as any)?.children?.[0]?.value as string | undefined;

      if (raw) {
        // Product card shortcode: [product:slug]
        const productMatch = raw.match(/^\[product:([a-zA-Z0-9-]+)\]$/i);
        if (productMatch) {
          const pSlug = productMatch[1].toLowerCase();
          const product = productsMap[pSlug];
          if (product) {
            const thumb =
              product.images?.[0] || product.whiteBackgroundImages?.[0];
            return (
              <div className="blog-md-product-card">
                <div className="blog-md-product-thumb">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={product.name}
                      className="blog-md-product-img"
                    />
                  ) : (
                    <span className="blog-md-product-placeholder">JS</span>
                  )}
                </div>
                <div className="blog-md-product-info">
                  <div className="blog-md-product-collection">
                    {product.collection || "Signature Fixture"}
                  </div>
                  <div className="blog-md-product-name">{product.name}</div>
                  <div className="blog-md-product-price">
                    ₹{product.d2cPrice?.toLocaleString() || "N/A"}
                  </div>
                </div>
              </div>
            );
          }
        }
      }

      return <p className="blog-md-p">{children}</p>;
    },

    // ── Inline elements ───────────────────────────────────────────────────────
    strong: ({ children }: any) => (
      <strong className="blog-md-strong">{children}</strong>
    ),
    em: ({ children }: any) => <em className="blog-md-em">{children}</em>,
    del: ({ children }: any) => <del className="blog-md-del">{children}</del>,

    // ── Links ────────────────────────────────────────────────────────────────
    a: ({ href, children }: any) => (
      <LinkEl
        href={href || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="blog-md-link"
      >
        {children}
      </LinkEl>
    ),

    // ── Inline code ───────────────────────────────────────────────────────────
    code: ({ children, className, ...props }: any) => {
      // Block code is handled by <pre><code>
      const isInline = !className;
      if (isInline) {
        return <code className="blog-md-inline-code">{children}</code>;
      }
      return (
        <code
          className={`blog-md-code-block ${className || ""}`}
          {...(props as any)}
        >
          {children}
        </code>
      );
    },

    // ── Code block (pre) ──────────────────────────────────────────────────────
    pre: ({ children }: any) => (
      <div className="blog-md-pre-wrapper">
        <pre className="blog-md-pre">{children}</pre>
      </div>
    ),

    // ── Blockquote ────────────────────────────────────────────────────────────
    blockquote: ({ children }: any) => (
      <blockquote className="blog-md-blockquote">{children}</blockquote>
    ),

    // ── Lists ─────────────────────────────────────────────────────────────────
    ul: ({ children }: any) => <ul className="blog-md-ul">{children}</ul>,
    ol: ({ children }: any) => <ol className="blog-md-ol">{children}</ol>,
    li: ({ children }: any) => <li className="blog-md-li">{children}</li>,

    // ── Horizontal rule ───────────────────────────────────────────────────────
    hr: () => <hr className="blog-md-hr" />,

    // ── Tables ────────────────────────────────────────────────────────────────
    table: ({ children }: any) => (
      <div className="blog-md-table-wrapper">
        <table className="blog-md-table">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="blog-md-thead">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="blog-md-tbody">{children}</tbody>
    ),
    tr: ({ children }: any) => <tr className="blog-md-tr">{children}</tr>,
    th: ({ children }: any) => <th className="blog-md-th">{children}</th>,
    td: ({ children }: any) => <td className="blog-md-td">{children}</td>,

    // ── Images ────────────────────────────────────────────────────────────────
    img: ({ src, alt }: any) => {
      if (!src || typeof src !== "string") return null;
      // Skip if this is the featured image (already shown at top)
      if (featuredImg && src === featuredImg) return null;

      // Extract linked product slug from URL fragment: ![alt](url#product:slug)
      const urlParts = src.split("#");
      const imgUrl = urlParts[0];
      const fragment = urlParts[1] || "";
      const linkedSlugMatch = fragment.match(/^(?:product:)?([a-zA-Z0-9-]+)$/);
      const linkedSlug = linkedSlugMatch?.[1]?.toLowerCase();
      const linkedProduct = linkedSlug ? productsMap[linkedSlug] : null;

      return (
        <figure className="blog-md-figure">
          <div className="blog-md-img-wrapper">
            <img src={imgUrl} alt={alt || "Image"} className="blog-md-img" />
          </div>
          {(alt || linkedProduct) && (
            <figcaption className="blog-md-figcaption">
              {alt} {linkedProduct && `— ${linkedProduct.name}`}
            </figcaption>
          )}
        </figure>
      );
    },
  };

  return (
    <div className="blog-markdown-root">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

export default BlogMarkdownRenderer;
