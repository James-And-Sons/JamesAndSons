"use client";

import React, { useState } from "react";
import Link from "next/link";
import BlogMetaSection from "./BlogMetaSection";
import { SimpleProduct } from "@/components/BlogProductPickerModal";
import { ArrowLeft, Save, FileCheck } from "lucide-react";

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
}

interface BlogEditorFormProps {
  mode: "create" | "edit";
  post?: BlogPost;
  products: SimpleProduct[];
  action?: (formData: FormData) => Promise<void>;
  createAction?: (formData: FormData) => Promise<void>;
}

export default function BlogEditorForm({
  mode,
  post,
  action,
  createAction,
}: BlogEditorFormProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [featuredImg, setFeaturedImg] = useState(post?.featuredImg || "");
  const [isDraft, setIsDraft] = useState(post?.isDraft ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    if (post?.id) formData.append("id", String(post.id));
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("excerpt", excerpt);
    formData.append("content", content);
    formData.append("featuredImg", featuredImg);
    formData.append("isDraft", String(isDraft));

    try {
      if (mode === "edit" && action) {
        await action(formData);
      } else if (mode === "create" && createAction) {
        await createAction(formData);
      }
    } catch (err) {
      console.error("Save blog post error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/blog"
          className="text-xs text-textMuted hover:text-gold flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Blog Articles</span>
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-gold text-obsidian font-bold text-sm rounded shadow hover:brightness-110 flex items-center gap-2"
        >
          <Save size={16} />
          <span>
            {saving
              ? "Saving Post..."
              : mode === "edit"
                ? "Update Article"
                : "Publish Article"}
          </span>
        </button>
      </div>

      {/* Metadata Section */}
      <BlogMetaSection
        title={title}
        slug={slug}
        excerpt={excerpt}
        featuredImg={featuredImg}
        isDraft={isDraft}
        onTitleChange={setTitle}
        onSlugChange={setSlug}
        onExcerptChange={setExcerpt}
        onFeaturedImgChange={setFeaturedImg}
        onIsDraftChange={setIsDraft}
      />

      {/* Rich Markdown Editor Viewport */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gold uppercase tracking-wider font-mono">
          Article Content Body (Markdown)
        </h3>
        <textarea
          rows={15}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your article content using markdown formatting..."
          className="w-full p-4 bg-background border border-border rounded text-text font-mono text-sm focus:outline-none focus:border-gold leading-relaxed"
        />
      </div>
    </form>
  );
}
