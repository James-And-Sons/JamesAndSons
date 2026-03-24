import Link from 'next/link';
import { createBlogPost } from '../actions';

export default function NewBlogPostPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/blog" className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-primary transition-colors flex items-center gap-2 mb-4">
            ← Back to Blog
          </Link>
          <h1 className="font-serif text-[32px] font-light text-primary tracking-wide">Create New Post</h1>
        </div>
      </div>

      <div className="bg-surface border border-border p-8">
        <form action={createBlogPost} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="title" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full bg-[#16161a] border border-border px-4 py-3 font-body text-[14px] text-primary focus:outline-none focus:border-accent transition-colors"
                placeholder="Enter post title..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="slug" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Slug (Optional)</label>
              <input
                type="text"
                id="slug"
                name="slug"
                className="w-full bg-[#16161a] border border-border px-4 py-3 font-body text-[14px] text-primary focus:outline-none focus:border-accent transition-colors"
                placeholder="my-post-slug"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="excerpt" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              className="w-full bg-[#16161a] border border-border px-4 py-3 font-body text-[14px] text-primary focus:outline-none focus:border-accent transition-colors resize-none"
              placeholder="A short summary of the post..."
            ></textarea>
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Content</label>
            <textarea
              id="content"
              name="content"
              required
              rows={15}
              className="w-full bg-[#16161a] border border-border px-4 py-3 font-body text-[14px] text-primary focus:outline-none focus:border-accent transition-colors font-mono"
              placeholder="Write your content here..."
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDraft"
                name="isDraft"
                value="true"
                className="w-4 h-4 accent-accent bg-[#16161a] border-border"
              />
              <label htmlFor="isDraft" className="font-body text-[13px] text-secondary cursor-pointer">Save as Draft</label>
            </div>
            <div className="flex gap-4">
              <Link href="/blog" className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-muted hover:text-primary transition-colors">
                Cancel
              </Link>
              <button type="submit" className="btn-primary px-8">
                Publish Post
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
