'use client';

import { useActionState } from 'react';
import Link from 'next/link';

interface PageFormProps {
  page: any;
  isNew: boolean;
  action: (prevState: any, formData: FormData) => Promise<any>;
}

export default function PageForm({ page, isNew, action }: PageFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {/* Sticky Header Actions */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/80 py-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
            {isNew ? 'New Custom Page' : 'Edit Custom Page'}
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">
            {isNew ? 'Create brand new CMS listing' : `Editing Page: ${page?.title || 'Unknown'}`}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/pages" className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-6 py-2.5 hover:text-primary hover:bg-surface-muted/30 transition-colors bg-background flex items-center">
            Cancel
          </Link>
          <button type="submit" disabled={isPending} className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50">
            {isPending ? 'Saving...' : (isNew ? 'Create Page' : 'Save Changes')}
          </button>
        </div>
      </div>

      {state?.error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px]">
          {state.error}
        </div>
      )}
      
      <input type="hidden" name="id" value={isNew ? 'new' : page?.id} />
      
      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">Basic Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Page Title *</label>
            <input 
              name="title" 
              defaultValue={page?.title} 
              required 
              type="text" 
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">URL Slug *</label>
            <input 
              name="slug" 
              defaultValue={page?.slug} 
              required 
              type="text" 
              placeholder="e.g. about-us"
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Page Content (HTML/Markdown) *</label>
          <textarea 
            name="content" 
            defaultValue={page?.content} 
            required 
            rows={15}
            className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] leading-relaxed"
          />
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">SEO & Metadata</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">SEO Meta Title (Optional)</label>
            <input 
              name="metaTitle" 
              defaultValue={page?.metaTitle || ''} 
              type="text" 
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">SEO Meta Description (Optional)</label>
            <textarea 
              name="metaDescription" 
              defaultValue={page?.metaDescription || ''} 
              rows={3}
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[12px]"
            />
          </div>
        </div>
      </div>

      <div className="premium-card p-8 space-y-6 bg-surface/90 backdrop-blur">
        <h3 className="font-serif text-[20px] text-primary font-light border-b border-border/40 pb-4">Settings</h3>
        <div className="space-y-1 max-w-md">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Visibility</label>
          <select name="isPublished" defaultValue={page ? String(page.isPublished) : 'true'} className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] uppercase cursor-pointer">
            <option value="true">Published (Public)</option>
            <option value="false">Draft (Hidden)</option>
          </select>
        </div>
      </div>
    </form>
  );
}
