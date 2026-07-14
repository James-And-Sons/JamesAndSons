import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { updateBlogPost } from '../../actions';

export const dynamic = 'force-dynamic';

interface EditBlogPostPageProps {
  params: {
    id: string;
  };
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;

  const blogPostId = parseInt(id);

  const post = await prisma.blogPost.findUnique({
    where: { id: blogPostId },
    include: { author: true }
  });

  if (!post) {
    notFound();
  }

  // Bind the updateBlogPost action with the ID
  const updatePostWithId = updateBlogPost.bind(null, blogPostId);

  return (
    <form action={updatePostWithId} className="space-y-6">
      {/* Sticky Header Actions */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/80 py-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Edit Blog Post</h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">Editing: {post.title}</p>
        </div>
        <div className="flex gap-4">
          <Link href="/blog" className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-6 py-2.5 hover:text-primary hover:bg-surface-muted/30 transition-colors bg-background flex items-center">
            Cancel
          </Link>
          <button type="submit" className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold shadow-lg shadow-accent/15">
            Update Post
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
              defaultValue={post.title}
              className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="slug" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Slug *</label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              defaultValue={post.slug}
              className="w-full bg-background border border-border px-4 py-3 font-mono text-[12px] text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="excerpt" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Excerpt</label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            defaultValue={post.excerpt || ''}
            className="w-full bg-background border border-border px-4 py-3 font-body text-[13px] text-primary focus:outline-none focus:border-accent transition-colors resize-none"
            placeholder="A brief summary..."
          ></textarea>
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Content *</label>
          <textarea
            id="content"
            name="content"
            required
            rows={18}
            defaultValue={post.content}
            className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] leading-relaxed"
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
            defaultChecked={post.isDraft}
            className="w-4 h-4 accent-accent bg-background border-border"
          />
          <label htmlFor="isDraft" className="font-body text-[13px] text-secondary cursor-pointer select-none">Save as Draft</label>
        </div>
      </div>
    </form>
  );
}
