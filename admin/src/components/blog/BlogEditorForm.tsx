"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSidebar } from "@/lib/context/SidebarContext";
import BlogProductPickerModal, {
  SimpleProduct,
} from "@/components/BlogProductPickerModal";
import { BlogMarkdownRenderer } from "@james-andsons/blog-editor";
import { CldUploadWidget } from "next-cloudinary";
import { pickImageFiles } from "@/lib/fileSystemAccess";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface BlogPost {
  id?: number;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  content?: string;
  featuredImg?: string | null;
  isDraft?: boolean;
  metaTitle?: string | null;
  metaDesc?: string | null;
  geoTakeaway?: string | null;
  faq?: any;
  citations?: any;
}

interface BlogEditorFormProps {
  mode: "create" | "edit";
  post?: BlogPost;
  products: SimpleProduct[];
  action?: (formData: FormData) => Promise<void>;
  /** Only used in create mode */
  createAction?: (formData: FormData) => Promise<void>;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function parseJson<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function readingTime(wc: number): string {
  const mins = Math.max(1, Math.round(wc / 200));
  return `${mins} min read`;
}

/* ─── Toolbar definitions ────────────────────────────────────────────────── */
type ToolbarGroup = {
  label: string;
  items: ToolbarItem[];
};

type ToolbarItem = {
  id: string;
  label: string;
  title: string;
  action: (
    insert: (s: string, offset?: number) => void,
    getSelection: () => { text: string; start: number; end: number },
  ) => void;
};

const TOOLBAR_GROUPS: ToolbarGroup[] = [
  {
    label: "Headings",
    items: [
      {
        id: "h1",
        label: "H1",
        title: "Heading 1",
        action: (ins) => ins("\n\n# "),
      },
      {
        id: "h2",
        label: "H2",
        title: "Heading 2",
        action: (ins) => ins("\n\n## "),
      },
      {
        id: "h3",
        label: "H3",
        title: "Heading 3",
        action: (ins) => ins("\n\n### "),
      },
      {
        id: "h4",
        label: "H4",
        title: "Heading 4",
        action: (ins) => ins("\n\n#### "),
      },
    ],
  },
  {
    label: "Format",
    items: [
      {
        id: "bold",
        label: "B",
        title: "Bold (⌘B)",
        action: (ins, getSel) => {
          const { text } = getSel();
          ins(text ? `**${text}**` : "**bold text**");
        },
      },
      {
        id: "italic",
        label: "I",
        title: "Italic (⌘I)",
        action: (ins, getSel) => {
          const { text } = getSel();
          ins(text ? `*${text}*` : "*italic text*");
        },
      },
      {
        id: "strike",
        label: "S̶",
        title: "Strikethrough",
        action: (ins, getSel) => {
          const { text } = getSel();
          ins(text ? `~~${text}~~` : "~~text~~");
        },
      },
      {
        id: "code",
        label: "</>",
        title: "Inline Code",
        action: (ins, getSel) => {
          const { text } = getSel();
          ins(text ? "`" + text + "`" : "`code`");
        },
      },
    ],
  },
  {
    label: "Blocks",
    items: [
      {
        id: "codeblock",
        label: "{ }",
        title: "Code Block",
        action: (ins) => ins("\n\n```\ncode here\n```\n"),
      },
      {
        id: "quote",
        label: "❝",
        title: "Blockquote",
        action: (ins) => ins("\n\n> Key takeaway...\n"),
      },
      {
        id: "ul",
        label: "• List",
        title: "Bullet List",
        action: (ins) => ins("\n\n- Item one\n- Item two\n- Item three\n"),
      },
      {
        id: "ol",
        label: "1. List",
        title: "Numbered List",
        action: (ins) => ins("\n\n1. First\n2. Second\n3. Third\n"),
      },
      {
        id: "hr",
        label: "—",
        title: "Horizontal Rule",
        action: (ins) => ins("\n\n---\n\n"),
      },
      {
        id: "link",
        label: "🔗 Link",
        title: "Insert Link (⌘K)",
        action: (ins, getSel) => {
          const { text } = getSel();
          ins(text ? `[${text}](url)` : "[link text](url)");
        },
      },
      {
        id: "table",
        label: "⊞ Table",
        title: "Insert Table",
        action: (ins) =>
          ins(
            "\n\n| Column A | Column B | Column C |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n",
          ),
      },
    ],
  },
];

/* ─── Cover Image Upload Zone ────────────────────────────────────────────── */
function CoverImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasFSA, setHasFSA] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasFSA(typeof window !== "undefined" && "showOpenFilePicker" in window);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);
      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
        const timestamp = Math.round(Date.now() / 1000);

        const sigRes = await fetch("/api/sign-cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paramsToSign: { timestamp, upload_preset: uploadPreset },
          }),
        });
        const { signature } = await sigRes.json();

        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", apiKey!);
        fd.append("timestamp", String(timestamp));
        fd.append("signature", signature);
        fd.append("upload_preset", uploadPreset!);

        setProgress(40);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: fd },
        );
        const data = await res.json();
        setProgress(100);
        onChange(data.secure_url);
      } catch (e) {
        console.error(e);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onChange],
  );

  const handleNativePick = async () => {
    const files = await pickImageFiles({ multiple: false });
    if (files.length) await uploadFile(files[0]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) await uploadFile(file);
  };

  const handleClose = () => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
  };

  const handleCloudinaryUpload = (result: any) => {
    if (result.event === "success") {
      onChange(result.info.secure_url);
    }
    handleClose();
  };

  return (
    <div className="space-y-2">
      <div
        className={`blog-cover-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="relative group">
            <img
              src={value}
              alt="Cover preview"
              className="blog-cover-img-preview"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-[8px]">
              {hasFSA ? (
                <button
                  type="button"
                  onClick={handleNativePick}
                  className="font-mono text-[10px] uppercase tracking-widest bg-accent text-black px-4 py-2 rounded hover:bg-accent-hover transition-colors"
                >
                  Change Image
                </button>
              ) : (
                <CldUploadWidget
                  signatureEndpoint="/api/sign-cloudinary"
                  uploadPreset={
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
                  }
                  onSuccess={handleCloudinaryUpload}
                  onClose={handleClose}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="font-mono text-[10px] uppercase tracking-widest bg-accent text-black px-4 py-2 rounded hover:bg-accent-hover transition-colors"
                    >
                      Change Image
                    </button>
                  )}
                </CldUploadWidget>
              )}
              <button
                type="button"
                onClick={() => onChange("")}
                className="font-mono text-[10px] uppercase tracking-widest bg-red-500/80 text-white px-4 py-2 rounded hover:bg-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
            {uploading && (
              <div
                className="absolute bottom-0 left-0 h-[3px] bg-accent transition-all rounded-b-[8px]"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-muted border border-border flex items-center justify-center text-2xl">
              🖼️
            </div>
            <div>
              <p className="font-serif text-[15px] text-primary font-light">
                Upload a cover image
              </p>
              <p className="font-mono text-[10px] text-muted uppercase tracking-widest mt-1">
                Drag & drop · Click to browse · Paste URL below
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              {hasFSA ? (
                <button
                  type="button"
                  onClick={handleNativePick}
                  disabled={uploading}
                  className="font-mono text-[10px] uppercase tracking-widest bg-accent text-black px-4 py-2 rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {uploading ? `${progress}%` : "Browse Files"}
                </button>
              ) : (
                <CldUploadWidget
                  signatureEndpoint="/api/sign-cloudinary"
                  uploadPreset={
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
                  }
                  onSuccess={handleCloudinaryUpload}
                  onClose={handleClose}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="font-mono text-[10px] uppercase tracking-widest bg-accent text-black px-4 py-2 rounded hover:bg-accent-hover transition-colors"
                    >
                      Browse Files
                    </button>
                  )}
                </CldUploadWidget>
              )}
            </div>
          </div>
        )}
      </div>

      {/* URL fallback */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste an image URL..."
          className="flex-1 bg-background border border-border px-3 py-2 font-mono text-[11px] text-primary focus:outline-none focus:border-accent transition-colors rounded"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-3 py-2 font-mono text-[10px] text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <input type="hidden" name="featuredImg" value={value} />
    </div>
  );
}

/* ─── Preview Modal ──────────────────────────────────────────────────────── */
function PreviewModal({
  open,
  onClose,
  title,
  featuredImg,
  content,
  productsMap,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  featuredImg: string;
  content: string;
  productsMap: Record<string, SimpleProduct>;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="blog-preview-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="blog-preview-modal">
        <div className="blog-preview-modal-header">
          <div className="flex items-center gap-2">
            <span className="text-accent text-sm">👁️</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Live Preview
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-primary border border-border px-3 py-1.5 rounded transition-colors"
          >
            ✕ Close
          </button>
        </div>
        <div className="blog-preview-modal-body">
          {title && (
            <h1 className="font-serif text-3xl font-light text-primary mb-4 leading-tight">
              {title}
            </h1>
          )}
          {featuredImg && (
            <div className="rounded-xl overflow-hidden border border-accent/20 mb-6">
              <img
                src={featuredImg}
                alt="Cover"
                className="w-full h-56 object-cover"
              />
            </div>
          )}
          <BlogMarkdownRenderer
            content={content}
            productsMap={productsMap}
            featuredImg={featuredImg}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── AI Format Panel ────────────────────────────────────────────────────── */
function AiFormatPanel({
  content,
  onApply,
}: {
  content: string;
  onApply: (formatted: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  const handleFormat = async () => {
    if (!content.trim()) {
      setError("Nothing to format — write some content first.");
      return;
    }
    setLoading(true);
    setError("");
    setPreview("");
    try {
      const res = await fetch("/api/blog/ai-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: content, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI formatting failed");
      setPreview(data.formatted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(preview);
    setPreview("");
    setIsOpen(false);
    setInstruction("");
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg border transition-all"
        style={{
          background: isOpen ? "var(--color-accent)" : "transparent",
          color: isOpen ? "var(--color-background)" : "var(--color-accent)",
          borderColor: "var(--color-accent)",
        }}
      >
        <span>✨</span>
        <span>AI Format</span>
      </button>

      {isOpen && (
        <div className="blog-ai-panel mt-3 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✨</span>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-accent font-bold">
                AI Markdown Formatter
              </div>
              <div className="font-body text-[12px] text-muted mt-0.5">
                Send your content to Gemini AI and get it formatted as clean,
                structured markdown.
              </div>
            </div>
          </div>

          <textarea
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Optional extra instruction: e.g. 'Make it more formal' or 'Add a comparison table for the products mentioned'"
            className="w-full bg-background border border-border px-3 py-2.5 font-body text-[12px] text-primary focus:outline-none focus:border-accent transition-colors resize-none rounded"
          />

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleFormat}
              disabled={loading}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest bg-accent text-black px-4 py-2 rounded hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-black/30 border-t-black rounded-full" />
                  Formatting...
                </>
              ) : (
                <>✨ Format with AI</>
              )}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleApply}
                className="font-mono text-[10px] uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded transition-colors"
              >
                ✓ Apply Result
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setPreview("");
                setError("");
              }}
              className="font-mono text-[10px] uppercase tracking-widest text-muted border border-border px-3 py-2 rounded hover:text-primary transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded font-mono text-[11px] text-red-400">
              ⚠ {error}
            </div>
          )}

          {preview && (
            <div className="space-y-2">
              <div className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                <span>✓</span>
                <span>AI Result — review before applying</span>
              </div>
              <div className="bg-background border border-emerald-500/25 rounded p-4 max-h-64 overflow-y-auto">
                <pre className="font-mono text-[11px] text-primary/80 leading-relaxed whitespace-pre-wrap">
                  {preview}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main BlogEditorForm ────────────────────────────────────────────────── */
export default function BlogEditorForm({
  mode,
  post = {},
  products,
  action,
  createAction,
}: BlogEditorFormProps) {
  const { setIsPageDirty } = useSidebar();

  const [title, setTitle] = useState(post.title || "");
  const [slug, setSlug] = useState(post.slug || "");
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [content, setContent] = useState(post.content || "");
  const [featuredImg, setFeaturedImg] = useState(post.featuredImg || "");
  const [isDraft, setIsDraft] = useState(post.isDraft ?? true);
  const [metaTitle, setMetaTitle] = useState(post.metaTitle || "");
  const [metaDesc, setMetaDesc] = useState(post.metaDesc || "");
  const [geoTakeaway, setGeoTakeaway] = useState(post.geoTakeaway || "");
  const [faq, setFaq] = useState<{ q: string; a: string }[]>(
    parseJson(post.faq, []),
  );
  const [citations, setCitations] = useState<{ title: string; url: string }[]>(
    parseJson(post.citations, []),
  );

  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "meta" | "content" | "seo" | "publish"
  >("content");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Dirty tracking */
  const isDirty =
    title !== (post.title || "") ||
    slug !== (post.slug || "") ||
    excerpt !== (post.excerpt || "") ||
    content !== (post.content || "") ||
    featuredImg !== (post.featuredImg || "") ||
    isDraft !== (post.isDraft ?? true) ||
    metaTitle !== (post.metaTitle || "") ||
    metaDesc !== (post.metaDesc || "") ||
    geoTakeaway !== (post.geoTakeaway || "");

  useEffect(() => {
    setIsPageDirty(isDirty);
    return () => setIsPageDirty(false);
  }, [isDirty, setIsPageDirty]);

  /* Auto slug from title (create mode) */
  useEffect(() => {
    if (mode === "create" && title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-"),
      );
    }
  }, [title, mode, slug]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (document.activeElement !== textareaRef.current) return;
      if (e.key === "b") {
        e.preventDefault();
        insertSnippet("**bold text**");
      }
      if (e.key === "i") {
        e.preventDefault();
        insertSnippet("*italic text*");
      }
      if (e.key === "k") {
        e.preventDefault();
        insertSnippet("[link text](url)");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [content]);

  /* Picker modal */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"card" | "photo">("card");

  /* Product map */
  const productsMap: Record<string, SimpleProduct> = {};
  products.forEach((p) => {
    productsMap[p.slug.toLowerCase()] = p;
  });

  /* Linked products in content */
  const detectedSlugs = Array.from(
    (content || "").matchAll(
      /\[product:([a-zA-Z0-9-]+)\]|#(?:product:)?([a-zA-Z0-9-]+)/gi,
    ),
  )
    .map((m) => (m[1] || m[2]).toLowerCase())
    .filter(Boolean);
  const linkedProducts = products.filter((p) =>
    detectedSlugs.includes(p.slug.toLowerCase()),
  );

  /* Snippet insertion */
  const getSelection = () => {
    const el = textareaRef.current;
    if (!el) return { text: "", start: 0, end: 0 };
    return {
      text: el.value.substring(el.selectionStart, el.selectionEnd),
      start: el.selectionStart,
      end: el.selectionEnd,
    };
  };

  const insertSnippet = (snippet: string, cursorOffset?: number) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => prev + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setContent(
      (prev) => prev.substring(0, start) + snippet + prev.substring(end),
    );
    const cursor =
      cursorOffset !== undefined
        ? start + cursorOffset
        : start + snippet.length;
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    }, 20);
  };

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(420, el.scrollHeight)}px`;
  }, [content]);

  /* Handle form submit */
  const handleCancel = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDirty && !confirm("You have unsaved changes. Leave anyway?")) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  /* Stats */
  const wc = wordCount(content);
  const rt = readingTime(wc);

  /* Section nav tabs */
  const SECTIONS = [
    { id: "meta", label: "📰 Details" },
    { id: "content", label: "✏️ Content" },
    { id: "seo", label: "🔍 SEO & GEO" },
    { id: "publish", label: "🚀 Publish" },
  ] as const;

  return (
    <>
      <form
        action={async (formData) => {
          setIsPageDirty(false);
          if (mode === "create" && createAction) {
            await createAction(formData);
          } else if (action) {
            await action(formData);
          }
        }}
        className="min-h-screen"
      >
        {/* ── Sticky Top Bar ───────────────────────────────────────────── */}
        <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-[22px] sm:text-[26px] font-light text-primary tracking-wide leading-tight truncate">
                {mode === "create"
                  ? "New Post"
                  : title || `Edit Post #${post.id}`}
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-0.5 hidden sm:block">
                {mode === "create"
                  ? "Craft a new article for the store blog"
                  : "Update article content & SEO metadata"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Preview */}
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="hidden sm:flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-3 py-2 rounded hover:text-primary hover:border-primary/40 transition-colors"
              >
                <span>👁️</span>
                <span>Preview</span>
              </button>

              {/* Draft / Publish toggle pill */}
              <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setIsDraft(true)}
                  className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded transition-all ${
                    isDraft
                      ? "bg-amber-500/90 text-black font-bold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setIsDraft(false)}
                  className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded transition-all ${
                    !isDraft
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Publish
                </button>
              </div>
              <input type="hidden" name="isDraft" value={String(isDraft)} />

              <Link
                href="/blog"
                onClick={handleCancel}
                className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-3 py-2 rounded hover:text-primary hover:bg-surface-muted/30 transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="font-mono text-[9.5px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold px-4 py-2 rounded shadow-lg shadow-accent/20"
              >
                {mode === "create" ? "Publish" : "Save"}
              </button>
            </div>
          </div>

          {/* Section tabs */}
          <div className="px-4 sm:px-6 flex gap-1 pb-0 overflow-x-auto scrollbar-none">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`font-mono text-[9.5px] uppercase tracking-widest px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeSection === s.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-primary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ── SECTION: Meta & Cover ─────────────────────────────────── */}
          {activeSection === "meta" && (
            <div className="premium-card p-5 sm:p-8 space-y-6 bg-surface/90 backdrop-blur animate-in fade-in-0 duration-200">
              <div className="flex items-center gap-2 pb-4 border-b border-border/40">
                <span className="text-xl">📰</span>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-primary font-light">
                  Article Details & Cover
                </h2>
              </div>

              {/* Title + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label
                    htmlFor="title"
                    className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block"
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
                    className="w-full bg-background border border-border px-4 py-3 font-serif text-[18px] font-light text-primary focus:outline-none focus:border-accent transition-colors rounded"
                    placeholder="Enter an engaging post title..."
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="slug"
                    className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block"
                  >
                    URL Slug {mode === "edit" && "*"}
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    required={mode === "edit"}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 font-mono text-[12px] text-primary focus:outline-none focus:border-accent transition-colors rounded"
                    placeholder="my-post-slug"
                  />
                  <p className="font-mono text-[9px] text-muted">
                    /blog/{slug || "auto-generated"}
                  </p>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="excerpt"
                    className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block"
                  >
                    Excerpt / Summary
                  </label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    rows={3}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors resize-none rounded"
                    placeholder="A short, compelling summary shown in blog listings..."
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-2 pt-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block">
                  Cover Image
                </label>
                <CoverImageUpload
                  value={featuredImg}
                  onChange={setFeaturedImg}
                />
              </div>
            </div>
          )}

          {/* ── SECTION: Content Editor ───────────────────────────────── */}
          {activeSection === "content" && (
            <div className="space-y-4 animate-in fade-in-0 duration-200">
              {/* Top bar: AI + product buttons + preview */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <AiFormatPanel
                    content={content}
                    onApply={(formatted) => setContent(formatted)}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setPickerMode("card");
                      setPickerOpen(true);
                    }}
                    className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-black bg-accent font-bold hover:bg-accent-hover px-3 py-2 rounded transition-all shadow-sm"
                    title="Embed product card shortcode"
                  >
                    <span>🛍️</span>
                    <span className="hidden sm:inline">Product Card</span>
                    <span className="sm:hidden">+ Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPickerMode("photo");
                      setPickerOpen(true);
                    }}
                    className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-accent border border-accent/40 bg-accent/5 hover:bg-accent/15 px-3 py-2 rounded transition-all"
                    title="Embed product photo"
                  >
                    <span>📸</span>
                    <span className="hidden sm:inline">Product Photo</span>
                    <span className="sm:hidden">+ Photo</span>
                  </button>
                </div>

                {/* Mobile preview button */}
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="sm:hidden flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-widest text-muted border border-border px-3 py-2 rounded hover:text-primary transition-colors"
                >
                  <span>👁️</span>
                  <span>Preview</span>
                </button>
              </div>

              {/* Formatting toolbar */}
              <div className="premium-card p-3 bg-surface">
                <div className="flex flex-wrap gap-1.5 items-center">
                  {TOOLBAR_GROUPS.map((group, gi) => (
                    <React.Fragment key={group.label}>
                      {gi > 0 && (
                        <div className="w-px h-5 bg-border mx-1 self-center" />
                      )}
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          title={item.title}
                          onClick={() =>
                            item.action(insertSnippet, getSelection)
                          }
                          className={`blog-editor-toolbar-btn ${
                            item.id === "bold"
                              ? "font-bold"
                              : item.id === "italic"
                                ? "italic"
                                : ""
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </React.Fragment>
                  ))}

                  {/* Shortcut hint */}
                  <div className="ml-auto font-mono text-[9px] text-muted hidden sm:flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-muted border border-border text-[9px]">
                      ⌘B
                    </kbd>
                    bold ·
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-muted border border-border text-[9px]">
                      ⌘I
                    </kbd>
                    italic ·
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-muted border border-border text-[9px]">
                      ⌘K
                    </kbd>
                    link
                  </div>
                </div>
              </div>

              {/* Word count bar */}
              <div className="blog-wordcount-bar">
                <span>📝 {wc.toLocaleString()} words</span>
                <span>⏱ {rt}</span>
                {content.length > 0 && (
                  <span>{content.length.toLocaleString()} chars</span>
                )}
              </div>

              {/* Linked products chips */}
              {linkedProducts.length > 0 && (
                <div className="p-3 rounded-xl border border-accent/25 bg-surface/60">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-accent font-bold mb-2 flex items-center gap-1.5">
                    ✨ {linkedProducts.length} linked product
                    {linkedProducts.length !== 1 ? "s" : ""}
                  </div>
                  <div className="blog-linked-chips">
                    {linkedProducts.map((lp) => {
                      const thumb =
                        lp.images?.[0] || lp.whiteBackgroundImages?.[0];
                      return (
                        <div key={lp.id} className="blog-linked-chip">
                          {thumb ? (
                            <img src={thumb} alt={lp.name} />
                          ) : (
                            <span className="text-[9px] text-accent">JS</span>
                          )}
                          <span className="truncate max-w-[120px]">
                            {lp.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="content"
                  name="content"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="blog-editor-textarea rounded-lg"
                  placeholder={
                    "Start writing your article here...\n\nTips:\n• Use ## for headings, **bold**, *italic*\n• Use the toolbar above for quick formatting\n• Paste a table with | col | col | syntax\n• Use ✨ AI Format to clean up raw text\n• Preview your article with 👁️ Preview"
                  }
                  spellCheck
                />
              </div>
            </div>
          )}

          {/* ── SECTION: SEO & GEO ───────────────────────────────────── */}
          {activeSection === "seo" && (
            <div className="premium-card p-5 sm:p-8 space-y-6 bg-surface/90 backdrop-blur animate-in fade-in-0 duration-200">
              <div className="flex items-center gap-2 pb-4 border-b border-border/40">
                <span className="text-xl">🔍</span>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-primary font-light">
                  SEO & Generative Engine Optimization
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label
                    htmlFor="metaTitle"
                    className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block"
                  >
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={70}
                    className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors rounded"
                    placeholder="Recommended: under 60 characters"
                  />
                  <p className="font-mono text-[9px] text-muted text-right">
                    {metaTitle.length}/70
                  </p>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="metaDesc"
                    className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block"
                  >
                    Meta Description
                  </label>
                  <textarea
                    id="metaDesc"
                    name="metaDesc"
                    rows={3}
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    maxLength={180}
                    className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors resize-none rounded"
                    placeholder="Recommended: under 160 characters"
                  />
                  <p className="font-mono text-[9px] text-muted text-right">
                    {metaDesc.length}/180
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="geoTakeaway"
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block"
                >
                  GEO Summary / AI Snippet
                </label>
                <textarea
                  id="geoTakeaway"
                  name="geoTakeaway"
                  rows={3}
                  value={geoTakeaway}
                  onChange={(e) => setGeoTakeaway(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors resize-none rounded"
                  placeholder="A concise, direct summary optimised for AI search engines..."
                />
              </div>

              {/* FAQs */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                    Structured FAQs
                  </label>
                  <button
                    type="button"
                    onClick={() => setFaq([...faq, { q: "", a: "" }])}
                    className="font-mono text-[9px] uppercase tracking-wider text-accent border border-accent/25 hover:border-accent/70 hover:bg-accent/5 px-3 py-1.5 rounded transition-all"
                  >
                    + Add FAQ
                  </button>
                </div>

                <div className="space-y-3">
                  {faq.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-border/40 bg-background/50 rounded-lg space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => setFaq(faq.filter((_, i) => i !== idx))}
                        className="absolute top-3 right-3 font-mono text-[9px] text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                      <input
                        type="text"
                        placeholder="Question..."
                        value={item.q}
                        onChange={(e) => {
                          const next = [...faq];
                          next[idx].q = e.target.value;
                          setFaq(next);
                        }}
                        className="w-full bg-background border border-border px-3 py-2.5 text-[13px] text-primary focus:outline-none focus:border-accent rounded pr-10"
                      />
                      <textarea
                        placeholder="Answer..."
                        rows={2}
                        value={item.a}
                        onChange={(e) => {
                          const next = [...faq];
                          next[idx].a = e.target.value;
                          setFaq(next);
                        }}
                        className="w-full bg-background border border-border px-3 py-2.5 text-[13px] text-primary focus:outline-none focus:border-accent resize-none rounded"
                      />
                    </div>
                  ))}
                  {faq.length === 0 && (
                    <p className="font-mono text-[10px] text-muted italic">
                      No FAQs added yet. FAQs improve structured data for search
                      engines.
                    </p>
                  )}
                </div>
                <input
                  type="hidden"
                  name="faqJson"
                  value={JSON.stringify(faq)}
                />
              </div>

              {/* Citations */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                    Authority Citations
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCitations([...citations, { title: "", url: "" }])
                    }
                    className="font-mono text-[9px] uppercase tracking-wider text-accent border border-accent/25 hover:border-accent/70 hover:bg-accent/5 px-3 py-1.5 rounded transition-all"
                  >
                    + Add Citation
                  </button>
                </div>

                <div className="space-y-3">
                  {citations.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 border border-border/40 bg-background/50 rounded-lg relative pr-10"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCitations(citations.filter((_, i) => i !== idx))
                        }
                        className="absolute right-3 top-3 font-mono text-[9px] text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          placeholder="Source title..."
                          value={item.title}
                          onChange={(e) => {
                            const next = [...citations];
                            next[idx].title = e.target.value;
                            setCitations(next);
                          }}
                          className="w-full bg-background border border-border px-3 py-2.5 text-[12px] text-primary focus:outline-none focus:border-accent rounded"
                        />
                      </div>
                      <div className="sm:col-span-7">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={item.url}
                          onChange={(e) => {
                            const next = [...citations];
                            next[idx].url = e.target.value;
                            setCitations(next);
                          }}
                          className="w-full bg-background border border-border px-3 py-2.5 text-[12px] text-primary focus:outline-none focus:border-accent rounded"
                        />
                      </div>
                    </div>
                  ))}
                  {citations.length === 0 && (
                    <p className="font-mono text-[10px] text-muted italic">
                      Add authoritative sources to boost content credibility.
                    </p>
                  )}
                </div>
                <input
                  type="hidden"
                  name="citationsJson"
                  value={JSON.stringify(citations)}
                />
              </div>
            </div>
          )}

          {/* ── SECTION: Publish ─────────────────────────────────────── */}
          {activeSection === "publish" && (
            <div className="premium-card p-5 sm:p-8 space-y-6 bg-surface/90 backdrop-blur animate-in fade-in-0 duration-200">
              <div className="flex items-center gap-2 pb-4 border-b border-border/40">
                <span className="text-xl">🚀</span>
                <h2 className="font-serif text-[18px] sm:text-[20px] text-primary font-light">
                  Publishing Settings
                </h2>
              </div>

              {/* Status visual */}
              <div
                className={`p-5 rounded-xl border transition-all ${
                  isDraft
                    ? "bg-amber-500/8 border-amber-500/25"
                    : "bg-emerald-500/8 border-emerald-500/25"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      isDraft ? "bg-amber-500/15" : "bg-emerald-500/15"
                    }`}
                  >
                    {isDraft ? "📝" : "🌐"}
                  </div>
                  <div>
                    <div
                      className={`font-mono text-[11px] uppercase tracking-widest font-bold ${
                        isDraft ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {isDraft ? "Draft" : "Published"}
                    </div>
                    <div className="font-body text-[13px] text-secondary mt-0.5">
                      {isDraft
                        ? "Only visible to admins. Not publicly accessible."
                        : "Visible to everyone on the storefront blog."}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsDraft(true)}
                    className={`flex-1 font-mono text-[10px] uppercase tracking-wider py-2.5 rounded border transition-all ${
                      isDraft
                        ? "bg-amber-500/90 text-black border-amber-500 font-bold"
                        : "text-muted border-border hover:text-amber-400 hover:border-amber-400/50"
                    }`}
                  >
                    📝 Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDraft(false)}
                    className={`flex-1 font-mono text-[10px] uppercase tracking-wider py-2.5 rounded border transition-all ${
                      !isDraft
                        ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                        : "text-muted border-border hover:text-emerald-400 hover:border-emerald-400/50"
                    }`}
                  >
                    🌐 Publish Now
                  </button>
                </div>
              </div>

              {/* Article summary */}
              <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">
                  Article Summary
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Words", value: wc.toLocaleString() },
                    { label: "Read Time", value: rt },
                    { label: "Products", value: linkedProducts.length },
                    {
                      label: "Status",
                      value: isDraft ? "Draft" : "Live",
                      color: isDraft ? "text-amber-400" : "text-emerald-400",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="text-center p-3 rounded-lg bg-surface border border-border"
                    >
                      <div
                        className={`font-mono text-[15px] font-bold ${stat.color || "text-accent"}`}
                      >
                        {stat.value}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-muted mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final submit */}
              <button
                type="submit"
                className="w-full py-4 font-mono text-[12px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold rounded-xl shadow-xl shadow-accent/20"
              >
                {mode === "create"
                  ? isDraft
                    ? "💾 Save Draft"
                    : "🚀 Publish Post"
                  : isDraft
                    ? "💾 Save Changes"
                    : "✓ Update & Publish"}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Preview modal */}
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        featuredImg={featuredImg}
        content={content}
        productsMap={productsMap}
      />

      {/* Product picker modal */}
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
