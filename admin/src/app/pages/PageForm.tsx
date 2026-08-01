"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import CloudinaryUpload from "@/components/CloudinaryUpload";

interface PageFormProps {
  page: any;
  isNew: boolean;
  action: (prevState: any, formData: FormData) => Promise<any>;
}

export default function PageForm({ page, isNew, action }: PageFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [content, setContent] = useState(page?.content || "");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const insertImageTag = (url: string, altText: string) => {
    const alt = altText.trim() || "James & Sons";
    const tag = `\n<p><img src="${url}" alt="${alt}" style="max-width: 100%; border-radius: 12px; margin: 24px 0;" /></p>\n`;
    setContent((prev) => prev + tag);
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Sticky Header Actions */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/80 py-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
            {isNew ? "New Custom Page" : "Edit Custom Page"}
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">
            {isNew
              ? "Create brand new CMS listing"
              : `Editing Page: ${page?.title || "Unknown"}`}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/pages"
            className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-6 py-2.5 hover:text-primary hover:bg-surface-muted/30 transition-colors bg-background flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50"
          >
            {isPending ? "Saving..." : isNew ? "Create Page" : "Save Changes"}
          </button>
        </div>
      </div>

      {state?.error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px]">
          {state.error}
        </div>
      )}

      <input type="hidden" name="id" value={isNew ? "new" : page?.id} />

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
              Page Title *
            </label>
            <input
              name="title"
              defaultValue={page?.title}
              required
              type="text"
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
              URL Slug *
            </label>
            <input
              name="slug"
              defaultValue={page?.slug}
              required
              type="text"
              placeholder="e.g. about"
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block">
              Page Content (HTML/Markdown) *
            </label>
            <button
              type="button"
              onClick={() => {
                setUploadedUrl("");
                setImageAlt("");
                setUploadModalOpen(true);
              }}
              className="font-mono text-[9.5px] uppercase tracking-wider text-accent border border-accent/40 bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
            >
              <span>🖼️</span>
              <span>Upload Photo &amp; Insert</span>
            </button>
          </div>

          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={16}
            className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] leading-relaxed"
          />
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">
          SEO & Metadata
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
              SEO Meta Title (Optional)
            </label>
            <input
              name="metaTitle"
              defaultValue={page?.metaTitle || ""}
              type="text"
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
              SEO Meta Description (Optional)
            </label>
            <textarea
              name="metaDescription"
              defaultValue={page?.metaDescription || ""}
              rows={3}
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[12px]"
            />
          </div>
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">
          Settings
        </h3>
        <div className="space-y-1 max-w-md">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">
            Visibility
          </label>
          <select
            name="isPublished"
            defaultValue={page ? String(page.isPublished) : "true"}
            className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] uppercase cursor-pointer"
          >
            <option value="true">Published (Public)</option>
            <option value="false">Draft (Hidden)</option>
          </select>
        </div>
      </div>

      {/* Photo Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-serif text-lg text-primary font-light flex items-center gap-2">
                <span>🖼️</span> Upload &amp; Insert Photo
              </h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-muted hover:text-primary text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-2">
                  1. Choose / Upload Image File
                </label>
                <CloudinaryUpload
                  multiple={false}
                  label="Upload Image"
                  defaultImages={uploadedUrl ? [uploadedUrl] : []}
                  onUpload={(urls) => {
                    if (urls.length > 0) setUploadedUrl(urls[0]);
                  }}
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                  2. Caption / Alt Description (Optional)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g. James & Sons Artisanal Workshop"
                  className="w-full bg-background border border-border px-3 py-2 rounded text-xs font-mono text-primary outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 rounded border border-border font-mono text-[10px] uppercase tracking-wider text-muted hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!uploadedUrl}
                onClick={() => {
                  insertImageTag(uploadedUrl, imageAlt);
                  setUploadModalOpen(false);
                }}
                className="px-5 py-2 rounded bg-accent text-black font-mono text-[10px] uppercase tracking-wider font-bold hover:brightness-110 disabled:opacity-40"
              >
                Insert Photo →
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
