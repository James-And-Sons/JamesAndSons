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
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/blog" className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-primary transition-colors flex items-center gap-2 mb-4">
            ← Back to Blog
          </Link>
          <h1 className="font-serif text-[32px] font-light text-primary tracking-wide">Edit Post</h1>
        </div>
      </div>

      <div className="bg-surface border border-border p-8">
        <form action={updatePostWithId} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="title" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                defaultValue={post.title}
                className="w-full bg-[#16161a] border border-border px-4 py-3 font-body text-[14px] text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="slug" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Slug</label>
              <input
                type="text"
                id="slug"
                name="slug"
                required
                defaultValue={post.slug}
                className="w-full bg-[#16161a] border border-border px-4 py-3 font-body text-[14px] text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="excerpt" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={post.excerpt || ''}
              className="w-full bg-[#16161a] border border-border px-4 py-3 font-body text-[14px] text-primary focus:outline-none focus:border-accent transition-colors resize-none"
            ></textarea>
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Content</label>
            <textarea
              id="content"
              name="content"
              required
              rows={15}
              defaultValue={post.content}
              className="w-full bg-[#16161a] border border-border px-4 py-3 font-body text-[14px] text-primary focus:outline-none focus:border-accent transition-colors font-mono"
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDraft"
                name="isDraft"
                value="true"
                defaultChecked={post.isDraft}
                className="w-4 h-4 accent-accent bg-[#16161a] border-border"
              />
              <label htmlFor="isDraft" className="font-body text-[13px] text-secondary cursor-pointer">Save as Draft</label>
            </div>
            <div className="flex gap-4">
              <Link href="/blog" className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-muted hover:text-primary transition-colors">
                Cancel
              </Link>
              <button type="submit" className="btn-primary px-8">
                Update Post
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
