"use client";
import Link from "next/link";
import { createBlogPost } from "../actions";
import { useState, useEffect, useRef } from "react";
import { useSidebar } from "@/lib/context/SidebarContext";
import BlogProductPickerModal, {
  SimpleProduct,
} from "@/components/BlogProductPickerModal";
import BlogContentRenderer from "@/components/BlogContentRenderer";

export default function NewBlogFormClient({
  products,
}: {
  products: SimpleProduct[];
}) {
  const { setIsPageDirty } = useSidebar();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImg, setFeaturedImg] = useState("");
  const [isDraft, setIsDraft] = useState(true);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [geoTakeaway, setGeoTakeaway] = useState("");
  const [faq, setFaq] = useState<{ q: string; a: string }[]>([]);
  const [citations, setCitations] = useState<{ title: string; url: string }[]>(
    [],
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Picker Modal State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"card" | "photo">("card");

  const isDirty =
    title !== "" ||
    slug !== "" ||
    excerpt !== "" ||
    content !== "" ||
    featuredImg !== "" ||
    metaTitle !== "" ||
    metaDesc !== "" ||
    geoTakeaway !== "" ||
    faq.length > 0 ||
    citations.length > 0;

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

  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) {
      setContent((prev) => prev + snippet);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const prev = content;
    const next = prev.substring(0, start) + snippet + prev.substring(end);
    setContent(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  // Build product map for preview renderer
  const productsMap: Record<string, any> = {};
  products.forEach((p) => {
    productsMap[p.slug.toLowerCase()] = p;
  });

  // Find all products currently embedded in content
  const detectedSlugs = Array.from(
    content.matchAll(
      /\[product:([a-zA-Z0-9-]+)\]|#(?:product:)?([a-zA-Z0-9-]+)/gi,
    ),
  )
    .map((m) => (m[1] || m[2]).toLowerCase())
    .filter(Boolean);

  const linkedProducts = products.filter((p) =>
    detectedSlugs.includes(p.slug.toLowerCase()),
  );

  return (
    <>
      <form
        action={async (formData) => {
          setIsPageDirty(false);
          await createBlogPost(formData);
        }}
        className="space-y-6"
      >
        {/* Sticky Header Actions */}
        <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/80 py-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
              Create New Post
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">
              Publish a new article to the store blog
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
              Publish Post
            </button>
          </div>
        </div>

        <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
          <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">
            Article Meta &amp; Cover Image
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
                placeholder="Enter post title..."
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="slug"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
              >
                Slug (Optional)
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3 font-mono text-[12px] text-primary focus:outline-none focus:border-accent transition-colors"
                placeholder="my-post-slug"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
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
                placeholder="A short summary of the post..."
              ></textarea>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="featuredImg"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1"
              >
                Featured Cover Image URL (Optional)
              </label>
              <input
                type="url"
                id="featuredImg"
                name="featuredImg"
                value={featuredImg}
                onChange={(e) => setFeaturedImg(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3 font-mono text-[12px] text-primary focus:outline-none focus:border-accent transition-colors"
                placeholder="https://res.cloudinary.com/..."
              />
              <p className="font-mono text-[9px] text-muted mt-1">
                Leave empty to hide top cover box on the article page.
              </p>
            </div>
          </div>

          {/* Content Editor with Formatting Toolbar & Live Preview Toggle */}
          <div className="space-y-3 pt-4 border-t border-border/40">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block">
                  Content Editor *
                </label>
                {/* Editor Mode Tabs */}
                <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5 ml-3">
                  <button
                    type="button"
                    onClick={() => setEditorMode("write")}
                    className={`font-mono text-[9.5px] uppercase tracking-wider px-3 py-1 rounded transition-all cursor-pointer ${
                      editorMode === "write"
                        ? "bg-accent text-black font-bold"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    ✏️ Edit Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode("preview")}
                    className={`font-mono text-[9.5px] uppercase tracking-wider px-3 py-1 rounded transition-all cursor-pointer ${
                      editorMode === "preview"
                        ? "bg-accent text-black font-bold"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    👁️ Live Preview
                  </button>
                </div>
              </div>

              {/* Product Insertion Modals Trigger */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPickerMode("card");
                    setPickerOpen(true);
                  }}
                  className="font-mono text-[9.5px] uppercase tracking-wider text-black bg-accent font-bold hover:bg-accent-hover px-3 py-1.5 rounded transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Search catalog & embed interactive Shoppable Product Card"
                >
                  <span>🛍️</span>
                  <span>+ Link Product Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPickerMode("photo");
                    setPickerOpen(true);
                  }}
                  className="font-mono text-[9.5px] uppercase tracking-wider text-accent border border-accent/40 bg-accent/5 hover:bg-accent/15 px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Pick product photo to embed as clickable link"
                >
                  <span>📸</span>
                  <span>+ Link Clickable Photo</span>
                </button>
              </div>
            </div>

            {/* Writer Formatting Toolbar */}
            {editorMode === "write" && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-black/60 border border-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => insertSnippet("\n\n## Subheading Title\n\n")}
                  className="px-2.5 py-1 font-mono text-[10px] uppercase font-bold text-accent border border-accent/30 rounded hover:bg-accent/10"
                  title="Insert Section Subheading (H2)"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("\n\n### Section Title\n\n")}
                  className="px-2.5 py-1 font-mono text-[10px] uppercase font-bold text-accent border border-accent/30 rounded hover:bg-accent/10"
                  title="Insert Subsection Title (H3)"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("**bold text**")}
                  className="px-2.5 py-1 font-mono text-[10px] font-bold text-primary border border-white/10 rounded hover:border-accent"
                  title="Bold Text"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("*italic text*")}
                  className="px-2.5 py-1 font-mono text-[10px] italic text-primary border border-white/10 rounded hover:border-accent"
                  title="Italic Text"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertSnippet("\n* List item 1\n* List item 2\n")
                  }
                  className="px-2.5 py-1 font-mono text-[10px] text-primary border border-white/10 rounded hover:border-accent"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("\n> Key takeaway quote...\n")}
                  className="px-2.5 py-1 font-mono text-[10px] text-primary border border-white/10 rounded hover:border-accent"
                  title="Quote Callout"
                >
                  ❝ Quote
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("\n\n---\n\n")}
                  className="px-2.5 py-1 font-mono text-[10px] text-primary border border-white/10 rounded hover:border-accent"
                  title="Horizontal Divider"
                >
                  — Divider
                </button>
              </div>
            )}

            {/* Live Linked Products Chips Bar */}
            {linkedProducts.length > 0 && (
              <div className="p-3 bg-[#0D0B08] border border-accent/30 rounded-xl space-y-1.5">
                <div className="font-mono text-[9px] uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
                  <span>✨</span>
                  <span>
                    Linked Products in this Post ({linkedProducts.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {linkedProducts.map((lp) => {
                    const thumb =
                      lp.images?.[0] || lp.whiteBackgroundImages?.[0];
                    return (
                      <div
                        key={lp.id}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-xs font-mono"
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={lp.name}
                            className="w-5 h-5 rounded object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-accent">JS</span>
                        )}
                        <span className="text-primary truncate max-w-[140px]">
                          {lp.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Write Mode vs Preview Mode */}
            {editorMode === "write" ? (
              <textarea
                ref={textareaRef}
                id="content"
                name="content"
                required
                rows={18}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] leading-relaxed"
                placeholder="Write your article content here... Use toolbar buttons above to format headings, bold text, lists, and embedded products."
              ></textarea>
            ) : (
              <div className="p-6 rounded-xl border border-accent/40 bg-black/80 min-h-[400px] space-y-4">
                <div className="font-mono text-[9px] uppercase tracking-widest text-accent font-bold border-b border-accent/30 pb-2 flex items-center gap-2">
                  <span>👁️</span>
                  <span>Live Storefront Preview Rendering</span>
                </div>
                {title && (
                  <h1 className="font-serif text-3xl text-primary font-light">
                    {title}
                  </h1>
                )}
                {featuredImg && (
                  <img
                    src={featuredImg}
                    alt="Cover Preview"
                    className="w-full h-48 object-cover rounded-xl border border-white/10"
                  />
                )}
                <BlogContentRenderer
                  content={content}
                  productsMap={productsMap}
                  featuredImg={featuredImg}
                />
              </div>
            )}
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
              placeholder="A direct, concise summary of the article's core findings."
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
                      placeholder="Question..."
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
                      placeholder="Answer..."
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
                      placeholder="Source Title..."
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
                      placeholder="Source URL..."
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

      {/* Visual Product Picker Modal */}
      <BlogProductPickerModal
        isOpen={pickerOpen}
        mode={pickerMode}
        products={products}
        onSelectProductCard={(p) => {
          insertSnippet(`\n\n[product:${p.slug}]\n\n`);
        }}
        onSelectProductPhoto={(p, photoUrl) => {
          insertSnippet(`\n\n![${p.name}](${photoUrl}#product:${p.slug})\n\n`);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
