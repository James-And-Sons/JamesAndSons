'use client';
import Link from 'next/link';
import { createBlogPost } from '../actions';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/lib/context/SidebarContext';

export default function NewBlogPostPage() {
  const { setIsPageDirty } = useSidebar();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(true);

  const isDirty = title !== '' || slug !== '' || excerpt !== '' || content !== '';

  useEffect(() => {
    setIsPageDirty(isDirty);
    return () => setIsPageDirty(false);
  }, [isDirty, setIsPageDirty]);

  const handleCancel = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  return (
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
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Create New Post</h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">Publish a new article to the store blog</p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/blog" 
            onClick={handleCancel}
            className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-6 py-2.5 hover:text-primary hover:bg-surface-muted/30 transition-colors bg-background flex items-center"
          >
            Cancel
          </Link>
          <button type="submit" className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold shadow-lg shadow-accent/15">
            Publish Post
          </button>
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">Article Content</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="title" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="Enter post title..."
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="slug" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Slug (Optional)</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 font-mono text-[12px] text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="my-post-slug"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="excerpt" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Excerpt</label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors resize-none"
            placeholder="A short summary of the post..."
          ></textarea>
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Content *</label>
          <textarea
            id="content"
            name="content"
            required
            rows={18}
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] leading-relaxed"
            placeholder="Write your content here..."
          ></textarea>
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">Publishing Settings</h3>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isDraft"
            name="isDraft"
            value="true"
            checked={isDraft}
            onChange={e => setIsDraft(e.target.checked)}
            className="w-4 h-4 accent-accent bg-background border-border"
          />
          <label htmlFor="isDraft" className="font-body text-[13px] text-secondary cursor-pointer select-none">Save as Draft</label>
        </div>
      </div>
    </form>
  );
}
