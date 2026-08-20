"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Globe,
  HelpCircle,
  Link2,
  Layers,
  Loader2,
  Check,
} from "lucide-react";
import {
  ParsedBlogPost,
  ParsedFaqItem,
  ParsedCitationItem,
} from "@/lib/docx-parser";

export default function DocxImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [parsedPosts, setParsedPosts] = useState<ParsedBlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter((f) =>
        f.name.endsWith(".docx"),
      );
      if (selected.length === 0) {
        setErrorMsg("Please select valid .docx document files.");
        return;
      }
      setFiles((prev) => [...prev, ...selected]);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.endsWith(".docx"),
      );
      if (selected.length === 0) {
        setErrorMsg("Please drop valid .docx document files.");
        return;
      }
      setFiles((prev) => [...prev, ...selected]);
      setErrorMsg(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const parseFiles = async () => {
    if (files.length === 0) return;
    setIsParsing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/blog/import-docx", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse DOCX files.");
      }

      setParsedPosts(data.posts || []);
      setActiveTab(0);
      setSuccessMsg(
        `Successfully parsed ${data.posts.length} editorial document(s)! Inspect details below before publishing.`,
      );
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during parsing.");
    } finally {
      setIsParsing(false);
    }
  };

  const updatePostField = (
    index: number,
    field: keyof ParsedBlogPost,
    value: any,
  ) => {
    setParsedPosts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateFaq = (
    postIdx: number,
    faqIdx: number,
    key: "q" | "a",
    value: string,
  ) => {
    setParsedPosts((prev) => {
      const updated = [...prev];
      const newFaq = [...updated[postIdx].faq];
      newFaq[faqIdx] = { ...newFaq[faqIdx], [key]: value };
      updated[postIdx].faq = newFaq;
      return updated;
    });
  };

  const addFaq = (postIdx: number) => {
    setParsedPosts((prev) => {
      const updated = [...prev];
      updated[postIdx].faq = [...updated[postIdx].faq, { q: "", a: "" }];
      return updated;
    });
  };

  const removeFaq = (postIdx: number, faqIdx: number) => {
    setParsedPosts((prev) => {
      const updated = [...prev];
      updated[postIdx].faq = updated[postIdx].faq.filter(
        (_, i) => i !== faqIdx,
      );
      return updated;
    });
  };

  const updateCitation = (
    postIdx: number,
    citIdx: number,
    key: "label" | "url",
    value: string,
  ) => {
    setParsedPosts((prev) => {
      const updated = [...prev];
      const newCitations = [...updated[postIdx].citations];
      newCitations[citIdx] = { ...newCitations[citIdx], [key]: value };
      updated[postIdx].citations = newCitations;
      return updated;
    });
  };

  const addCitation = (postIdx: number) => {
    setParsedPosts((prev) => {
      const updated = [...prev];
      updated[postIdx].citations = [
        ...updated[postIdx].citations,
        { label: "", url: "" },
      ];
      return updated;
    });
  };

  const removeCitation = (postIdx: number, citIdx: number) => {
    setParsedPosts((prev) => {
      const updated = [...prev];
      updated[postIdx].citations = updated[postIdx].citations.filter(
        (_, i) => i !== citIdx,
      );
      return updated;
    });
  };

  const publishSinglePost = async (index: number) => {
    setIsPublishing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const post = parsedPosts[index];

    try {
      const formData = new FormData();
      formData.append("title", post.title);
      formData.append("slug", post.slug);
      formData.append("content", post.content);
      formData.append("excerpt", post.excerpt);
      formData.append("isDraft", post.isDraft ? "true" : "false");
      formData.append("metaTitle", post.metaTitle);
      formData.append("metaDesc", post.metaDesc);
      formData.append("geoTakeaway", post.geoTakeaway || "");
      formData.append("faqJson", JSON.stringify(post.faq));
      formData.append("citationsJson", JSON.stringify(post.citations));

      const res = await fetch("/api/blog/import-docx?saveImmediately=true", {
        method: "POST",
        body: (() => {
          // Send via Server Action or API
          const fd = new FormData();
          return fd;
        })(),
      });

      // Instead of raw fetch, we use our Server Action or API route directly
      const actionRes = await fetch("/api/blog/import-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post }),
      }).catch(() => null);

      // Or fallback: execute via standard endpoint with form payload
      const formPayload = new FormData();
      formPayload.append("title", post.title);
      formPayload.append("slug", post.slug);
      formPayload.append("content", post.content);
      formPayload.append("excerpt", post.excerpt);
      formPayload.append("isDraft", post.isDraft ? "true" : "false");
      formPayload.append("metaTitle", post.metaTitle);
      formPayload.append("metaDesc", post.metaDesc);
      formPayload.append("geoTakeaway", post.geoTakeaway || "");
      formPayload.append("faqJson", JSON.stringify(post.faq));
      formPayload.append("citationsJson", JSON.stringify(post.citations));
      if (post.featuredImg) formPayload.append("featuredImg", post.featuredImg);

      const saveRes = await fetch("/api/blog/import-docx/save", {
        method: "POST",
        body: formPayload,
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || "Failed to save blog post.");
      }

      setSuccessMsg(
        `🎉 Successfully published "${post.title}" to store database! Redirecting to blog index...`,
      );
      setTimeout(() => {
        router.push("/blog");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish post.");
    } finally {
      setIsPublishing(false);
    }
  };

  const publishAllPosts = async () => {
    setIsPublishing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    let count = 0;
    try {
      for (const post of parsedPosts) {
        const formPayload = new FormData();
        formPayload.append("title", post.title);
        formPayload.append("slug", post.slug);
        formPayload.append("content", post.content);
        formPayload.append("excerpt", post.excerpt);
        formPayload.append("isDraft", post.isDraft ? "true" : "false");
        formPayload.append("metaTitle", post.metaTitle);
        formPayload.append("metaDesc", post.metaDesc);
        formPayload.append("geoTakeaway", post.geoTakeaway || "");
        formPayload.append("faqJson", JSON.stringify(post.faq));
        formPayload.append("citationsJson", JSON.stringify(post.citations));
        if (post.featuredImg)
          formPayload.append("featuredImg", post.featuredImg);

        const saveRes = await fetch("/api/blog/import-docx/save", {
          method: "POST",
          body: formPayload,
        });

        if (!saveRes.ok) {
          const errData = await saveRes.json();
          throw new Error(
            errData.error || `Failed to save post "${post.title}".`,
          );
        }
        count++;
      }

      setSuccessMsg(
        `🎉 Successfully published all ${count} blog posts to store database!`,
      );
      setTimeout(() => {
        router.push("/blog");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish posts.");
    } finally {
      setIsPublishing(false);
    }
  };

  const currentPost = parsedPosts[activeTab];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 premium-card p-6">
        <div>
          <div className="flex items-center gap-2 text-muted font-mono text-[11px] uppercase tracking-widest mb-1">
            <Link
              href="/blog"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Blog Management
            </Link>
            <span>/</span>
            <span className="text-accent font-semibold">DOCX Importer</span>
          </div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-accent" /> Automated DOCX Importer
          </h1>
          <p className="font-sans text-[13px] text-muted mt-1">
            Parse Word (.docx) editorial manuscripts into formatted,
            SEO-optimized blog posts with live schema validation.
          </p>
        </div>

        {parsedPosts.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => publishSinglePost(activeTab)}
              disabled={isPublishing}
              className="btn-secondary font-mono text-[10px] uppercase tracking-widest px-5 py-3 flex items-center gap-2"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
              Publish Current Article
            </button>
            <button
              onClick={publishAllPosts}
              disabled={isPublishing}
              className="btn-primary font-mono text-[10px] uppercase tracking-widest px-6 py-3 shadow-lg shadow-accent/20 flex items-center gap-2"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Publish All ({parsedPosts.length})
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-sans text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-sans text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Dropzone Container */}
      <div className="premium-card p-8">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-accent/50 transition-all rounded-xl p-8 text-center cursor-pointer bg-surface-muted/20 hover:bg-surface-muted/40 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".docx"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-serif text-[18px] text-primary font-normal mb-1">
            Drop your .docx editorial manuscripts here
          </h3>
          <p className="font-mono text-[11px] text-muted uppercase tracking-widest">
            or click to browse from your computer (Multiple files supported)
          </p>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Selected Documents ({files.length})
              </h4>
              <button
                onClick={parseFiles}
                disabled={isParsing}
                className="btn-primary font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 flex items-center gap-2"
              >
                {isParsing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isParsing
                  ? "Parsing DOCX Files..."
                  : "Parse & Extract Manuscripts"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/60 font-mono text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="truncate text-primary">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-muted hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Parsed Inspection & Editorial Workbench */}
      {parsedPosts.length > 0 && currentPost && (
        <div className="space-y-6">
          {/* Post Tabs */}
          <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
            {parsedPosts.map((post, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`font-mono text-[11px] uppercase tracking-wider px-5 py-3 rounded-t-xl border-t border-x transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === idx
                    ? "bg-surface border-border text-accent border-b-2 border-b-accent font-semibold"
                    : "bg-surface-muted/30 border-transparent text-muted hover:text-primary"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="max-w-[200px] truncate">
                  {post.title || `Article ${idx + 1}`}
                </span>
              </button>
            ))}
          </div>

          {/* Workbench Card */}
          <div className="premium-card p-8 space-y-8">
            {/* Action Bar inside card */}
            <div className="flex justify-between items-center border-b border-border/60 pb-6">
              <div className="flex items-center gap-4">
                <span className="font-serif text-[20px] text-primary">
                  {currentPost.title}
                </span>
                <span
                  className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1 rounded-full border ${
                    currentPost.isDraft
                      ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                      : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                  }`}
                >
                  {currentPost.isDraft ? "Draft" : "Ready to Publish"}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-surface-muted p-1 rounded-lg border border-border">
                <button
                  onClick={() => setViewMode("edit")}
                  className={`font-mono text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === "edit"
                      ? "bg-accent text-background font-bold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  <Edit3 className="w-3 h-3" /> Edit Fields
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  className={`font-mono text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === "preview"
                      ? "bg-accent text-background font-bold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  <Eye className="w-3 h-3" /> Live Markdown
                </button>
              </div>
            </div>

            {viewMode === "edit" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metadata & SEO (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                        Article Title
                      </label>
                      <input
                        type="text"
                        value={currentPost.title}
                        onChange={(e) =>
                          updatePostField(activeTab, "title", e.target.value)
                        }
                        className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-accent outline-none font-serif"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                        URL Slug
                      </label>
                      <div className="flex items-center bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted">
                        <span className="text-muted/60 mr-1">/blog/</span>
                        <input
                          type="text"
                          value={currentPost.slug}
                          onChange={(e) =>
                            updatePostField(activeTab, "slug", e.target.value)
                          }
                          className="w-full bg-transparent text-accent outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                      Article Excerpt
                    </label>
                    <textarea
                      rows={3}
                      value={currentPost.excerpt}
                      onChange={(e) =>
                        updatePostField(activeTab, "excerpt", e.target.value)
                      }
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-xs text-primary focus:border-accent outline-none font-sans"
                    />
                  </div>

                  {/* SEO Section */}
                  <div className="p-5 rounded-xl bg-surface-muted/30 border border-border/70 space-y-4">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest text-accent flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Search Engine
                      Optimization (SEO)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="font-mono text-[9px] uppercase tracking-widest text-muted">
                            Meta Title
                          </label>
                          <span className="font-mono text-[9px] text-muted">
                            {currentPost.metaTitle.length}/70
                          </span>
                        </div>
                        <input
                          type="text"
                          value={currentPost.metaTitle}
                          onChange={(e) =>
                            updatePostField(
                              activeTab,
                              "metaTitle",
                              e.target.value,
                            )
                          }
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-primary focus:border-accent outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="font-mono text-[9px] uppercase tracking-widest text-muted">
                            Meta Description
                          </label>
                          <span className="font-mono text-[9px] text-muted">
                            {currentPost.metaDesc.length}/160
                          </span>
                        </div>
                        <input
                          type="text"
                          value={currentPost.metaDesc}
                          onChange={(e) =>
                            updatePostField(
                              activeTab,
                              "metaDesc",
                              e.target.value,
                            )
                          }
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-primary focus:border-accent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-widest text-muted mb-1.5">
                        GEO Key Takeaway (AI Overview Optimization)
                      </label>
                      <textarea
                        rows={2}
                        value={currentPost.geoTakeaway || ""}
                        onChange={(e) =>
                          updatePostField(
                            activeTab,
                            "geoTakeaway",
                            e.target.value,
                          )
                        }
                        placeholder="Key architectural lighting takeaways for Indian homeowners..."
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-primary focus:border-accent outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Body Content Editor */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                      Body Content (Markdown)
                    </label>
                    <textarea
                      rows={12}
                      value={currentPost.content}
                      onChange={(e) =>
                        updatePostField(activeTab, "content", e.target.value)
                      }
                      className="w-full bg-surface border border-border rounded-lg p-4 text-xs font-mono text-primary focus:border-accent outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Right Column: Featured Img, FAQs, Citations (1 col) */}
                <div className="space-y-6">
                  {/* Featured Image */}
                  <div className="p-5 rounded-xl bg-surface-muted/30 border border-border/70 space-y-3">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted">
                      Featured Image URL
                    </label>
                    <input
                      type="text"
                      value={currentPost.featuredImg || ""}
                      onChange={(e) =>
                        updatePostField(
                          activeTab,
                          "featuredImg",
                          e.target.value,
                        )
                      }
                      placeholder="https://res.cloudinary.com/..."
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-primary focus:border-accent outline-none font-mono"
                    />
                    {currentPost.featuredImg && (
                      <div className="rounded-lg overflow-hidden border border-border h-36 bg-black/40 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentPost.featuredImg}
                          alt="Featured Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="p-5 rounded-xl bg-surface-muted/30 border border-border/70 space-y-3">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted">
                      Publishing Status
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-primary">
                        <input
                          type="radio"
                          name={`status-${activeTab}`}
                          checked={!currentPost.isDraft}
                          onChange={() =>
                            updatePostField(activeTab, "isDraft", false)
                          }
                          className="accent-accent"
                        />
                        <span>Published</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-primary">
                        <input
                          type="radio"
                          name={`status-${activeTab}`}
                          checked={currentPost.isDraft}
                          onChange={() =>
                            updatePostField(activeTab, "isDraft", true)
                          }
                          className="accent-accent"
                        />
                        <span>Draft</span>
                      </label>
                    </div>
                  </div>

                  {/* FAQs Editor */}
                  <div className="p-5 rounded-xl bg-surface-muted/30 border border-border/70 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-accent flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5" /> FAQs Schema (
                        {currentPost.faq.length})
                      </h4>
                      <button
                        onClick={() => addFaq(activeTab)}
                        className="font-mono text-[9px] uppercase tracking-wider text-accent hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add FAQ
                      </button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {currentPost.faq.map((faq, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-3 rounded-lg bg-surface border border-border space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[9px] uppercase text-muted">
                              Q#{fIdx + 1}
                            </span>
                            <button
                              onClick={() => removeFaq(activeTab, fIdx)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Question"
                            value={faq.q}
                            onChange={(e) =>
                              updateFaq(activeTab, fIdx, "q", e.target.value)
                            }
                            className="w-full bg-surface-muted/40 border border-border/60 rounded px-2.5 py-1.5 text-xs text-primary outline-none"
                          />
                          <textarea
                            rows={2}
                            placeholder="Answer"
                            value={faq.a}
                            onChange={(e) =>
                              updateFaq(activeTab, fIdx, "a", e.target.value)
                            }
                            className="w-full bg-surface-muted/40 border border-border/60 rounded px-2.5 py-1.5 text-xs text-primary outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Citations Editor */}
                  <div className="p-5 rounded-xl bg-surface-muted/30 border border-border/70 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-accent flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5" /> Citations (
                        {currentPost.citations.length})
                      </h4>
                      <button
                        onClick={() => addCitation(activeTab)}
                        className="font-mono text-[9px] uppercase tracking-wider text-accent hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Citation
                      </button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {currentPost.citations.map((cit, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 rounded-lg bg-surface border border-border space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[9px] uppercase text-muted">
                              Source #{cIdx + 1}
                            </span>
                            <button
                              onClick={() => removeCitation(activeTab, cIdx)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Label (e.g. Catalogue Source)"
                            value={cit.label}
                            onChange={(e) =>
                              updateCitation(
                                activeTab,
                                cIdx,
                                "label",
                                e.target.value,
                              )
                            }
                            className="w-full bg-surface-muted/40 border border-border/60 rounded px-2.5 py-1.5 text-xs text-primary outline-none"
                          />
                          <input
                            type="text"
                            placeholder="URL (https://...)"
                            value={cit.url}
                            onChange={(e) =>
                              updateCitation(
                                activeTab,
                                cIdx,
                                "url",
                                e.target.value,
                              )
                            }
                            className="w-full bg-surface-muted/40 border border-border/60 rounded px-2.5 py-1.5 text-xs font-mono text-accent outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Markdown Preview View */
              <div className="prose prose-invert max-w-none bg-surface/50 p-6 rounded-xl border border-border leading-relaxed font-sans text-sm">
                <h1 className="font-serif text-3xl font-light text-primary mb-4">
                  {currentPost.title}
                </h1>
                <p className="text-muted italic border-l-2 border-accent pl-4 my-4">
                  {currentPost.excerpt}
                </p>
                <div className="whitespace-pre-wrap font-sans text-secondary leading-relaxed mt-6">
                  {currentPost.content}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
