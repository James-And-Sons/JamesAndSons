"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSidebar } from "@/lib/context/SidebarContext";

interface PostType {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  isDraft: boolean;
  metaTitle?: string | null;
  metaDesc?: string | null;
  geoTakeaway?: string | null;
  faq?: any;
  citations?: any;
}

export default function BlogFormClient({
  post,
  action,
}: {
  post: PostType;
  action: (formData: FormData) => Promise<void>;
}) {
  const { setIsPageDirty } = useSidebar();

  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [content, setContent] = useState(post.content);
  const [isDraft, setIsDraft] = useState(post.isDraft);

  const [metaTitle, setMetaTitle] = useState(post.metaTitle || "");
  const [metaDesc, setMetaDesc] = useState(post.metaDesc || "");
  const [geoTakeaway, setGeoTakeaway] = useState(post.geoTakeaway || "");

  const initialFaq = () => {
    try {
      if (typeof post.faq === "string") return JSON.parse(post.faq);
      if (Array.isArray(post.faq)) return post.faq;
    } catch {}
    return [];
  };
  const [faq, setFaq] = useState<{ q: string; a: string }[]>(initialFaq());

  const initialCitations = () => {
    try {
      if (typeof post.citations === "string") return JSON.parse(post.citations);
      if (Array.isArray(post.citations)) return post.citations;
    } catch {}
    return [];
  };
  const [citations, setCitations] =
    useState<{ title: string; url: string }[]>(initialCitations());

  const isDirty =
    title !== post.title ||
    slug !== post.slug ||
    excerpt !== (post.excerpt || "") ||
    content !== post.content ||
    isDraft !== post.isDraft ||
    metaTitle !== (post.metaTitle || "") ||
    metaDesc !== (post.metaDesc || "") ||
    geoTakeaway !== (post.geoTakeaway || "") ||
    JSON.stringify(faq) !== JSON.stringify(initialFaq()) ||
    JSON.stringify(citations) !== JSON.stringify(initialCitations());

  useEffect(() => {
    setIsPageDirty(isDirty);
    return () => setIsPageDirty(false);
  }, [isDirty, setIsPageDirty]);

  const handleCancel = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDirty) {
      if (
        !confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  return (
    <form
      action={async (formData) => {
        setIsPageDirty(false);
        await action(formData);
      }}
      className="space-y-6"
    >
      {/* Sticky Header Actions */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/80 py-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
            Edit Blog Post
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">
            Editing: {post.title}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/blog"
            onClick={handleCancel}
            className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-6 py-2.5 hover:text-primary hover:bg-surface-muted/30 transition-colors bg-background flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold shadow-lg shadow-accent/15"
          >
            Update Post
          </button>
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">
          Article Content
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label
              htmlFor="title"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="slug"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
            >
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 font-mono text-[12px] text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="excerpt"
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
          >
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors resize-none"
            placeholder="A brief summary..."
          ></textarea>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="content"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
            >
              Content * (Markdown &amp; Product Shortcodes Supported)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const pSlug = prompt(
                    "Enter Product Slug (e.g. opulent-crystal-chandelier):",
                  );
                  if (pSlug) {
                    setContent(
                      (prev) => prev + `\n\n[product:${pSlug.trim()}]\n\n`,
                    );
                  }
                }}
                className="font-mono text-[9px] uppercase tracking-wider text-accent border border-accent/30 hover:bg-accent/10 px-2.5 py-1 rounded transition-colors"
                title="Embeds an interactive Shoppable Product Card in article"
              >
                + Insert Product Card
              </button>
              <button
                type="button"
                onClick={() => {
                  const pSlug = prompt(
                    "Enter Product Slug (e.g. opulent-crystal-chandelier):",
                  );
                  const imgUrl = prompt("Enter Product Image URL:");
                  const altText = prompt(
                    "Enter Photo Caption/Alt Text:",
                    "Featured Fixture",
                  );
                  if (imgUrl) {
                    setContent(
                      (prev) =>
                        prev +
                        `\n\n![${altText || "Product"}](${imgUrl.trim()}#product:${(pSlug || "").trim()})\n\n`,
                    );
                  }
                }}
                className="font-mono text-[9px] uppercase tracking-wider text-primary border border-border hover:border-accent hover:text-accent px-2.5 py-1 rounded transition-colors"
                title="Embeds a photo that links directly to product page"
              >
                + Insert Product Photo
              </button>
            </div>
          </div>
          <textarea
            id="content"
            name="content"
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] leading-relaxed"
            placeholder="Write your article content here... Use [product:slug] to embed a product card or ![Name](url#product:slug) for clickable product photos."
          ></textarea>
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">
          SEO &amp; Generative Engine Optimization (GEO)
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label
              htmlFor="metaTitle"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
            >
              SEO Meta Title
            </label>
            <input
              type="text"
              id="metaTitle"
              name="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="Recommended: Under 60 characters"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="metaDesc"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
            >
              SEO Meta Description
            </label>
            <textarea
              id="metaDesc"
              name="metaDesc"
              rows={2}
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors resize-none"
              placeholder="Recommended: Under 160 characters"
            ></textarea>
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="geoTakeaway"
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
          >
            GEO Summary / Key Takeaway
          </label>
          <textarea
            id="geoTakeaway"
            name="geoTakeaway"
            rows={3}
            value={geoTakeaway}
            onChange={(e) => setGeoTakeaway(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors resize-none"
            placeholder="A direct, concise summary of the article's core findings. Highly favored by generative search engines like Perplexity/Gemini."
          ></textarea>
        </div>

        {/* FAQs */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex justify-between items-center">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              GEO Structured FAQs (Q&amp;A)
            </label>
            <button
              type="button"
              onClick={() => setFaq([...faq, { q: "", a: "" }])}
              className="font-mono text-[9px] uppercase tracking-wider text-accent border border-accent/25 hover:border-accent/80 hover:bg-accent/5 px-3 py-1.5 transition-all"
            >
              + Add FAQ Pair
            </button>
          </div>

          <div className="space-y-4">
            {faq.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border border-border/40 bg-background/50 rounded-lg space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => setFaq(faq.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 font-mono text-[9px] text-[#ef4444] hover:underline"
                >
                  Remove
                </button>
                <div className="space-y-1 pr-12">
                  <input
                    type="text"
                    placeholder="Question (e.g., What are the best chandelier styles for high ceilings?)"
                    value={item.q}
                    onChange={(e) => {
                      const next = [...faq];
                      next[idx].q = e.target.value;
                      setFaq(next);
                    }}
                    className="w-full bg-background border border-border px-3 py-2 text-[12px] text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <textarea
                    placeholder="Answer (Provide a direct, authoritative, and fact-backed answer)"
                    rows={2}
                    value={item.a}
                    onChange={(e) => {
                      const next = [...faq];
                      next[idx].a = e.target.value;
                      setFaq(next);
                    }}
                    className="w-full bg-background border border-border px-3 py-2 text-[12px] text-primary focus:outline-none focus:border-accent resize-none"
                  ></textarea>
                </div>
              </div>
            ))}
          </div>
          <input type="hidden" name="faqJson" value={JSON.stringify(faq)} />
        </div>

        {/* Citations / Authority Links */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex justify-between items-center">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              GEO Authority References / Citations
            </label>
            <button
              type="button"
              onClick={() =>
                setCitations([...citations, { title: "", url: "" }])
              }
              className="font-mono text-[9px] uppercase tracking-wider text-accent border border-accent/25 hover:border-accent/80 hover:bg-accent/5 px-3 py-1.5 transition-all"
            >
              + Add Citation
            </button>
          </div>

          <div className="space-y-4">
            {citations.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 border border-border/40 bg-[#0A0905]/50 rounded-lg relative pr-12"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCitations(citations.filter((_, i) => i !== idx))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] text-[#ef4444] hover:underline"
                >
                  Remove
                </button>
                <div className="md:col-span-5">
                  <input
                    type="text"
                    placeholder="Source Title (e.g., IS 10322 Chandelier Safety Standard)"
                    value={item.title}
                    onChange={(e) => {
                      const next = [...citations];
                      next[idx].title = e.target.value;
                      setCitations(next);
                    }}
                    className="w-full bg-background border border-border px-3 py-2 text-[12px] text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="md:col-span-7">
                  <input
                    type="url"
                    placeholder="Source URL (e.g., https://bis.gov.in/standards)"
                    value={item.url}
                    onChange={(e) => {
                      const next = [...citations];
                      next[idx].url = e.target.value;
                      setCitations(next);
                    }}
                    className="w-full bg-background border border-border px-3 py-2 text-[12px] text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            ))}
          </div>
          <input
            type="hidden"
            name="citationsJson"
            value={JSON.stringify(citations)}
          />
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">
          Publishing Settings
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isDraft"
            name="isDraft"
            value="true"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
            className="w-4 h-4 accent-accent bg-background border-border"
          />
          <label
            htmlFor="isDraft"
            className="font-body text-[13px] text-secondary cursor-pointer select-none"
          >
            Save as Draft
          </label>
        </div>
      </div>
    </form>
  );
}
