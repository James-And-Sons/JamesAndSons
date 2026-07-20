import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DeleteBlogButton from './DeleteBlogButton';
export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center premium-card p-6">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Blog Posts</h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">{posts.length} articles published</p>
        </div>
        <Link href="/blog/new" className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-8 py-3 shadow-lg shadow-accent/20">+ New Post</Link>
      </div>

      <div className="premium-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-muted/30">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Title</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Author</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Status</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Date</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {posts.map(post => (
              <tr key={post.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="font-serif text-[17px] text-primary">{post.title}</div>
                  <div className="font-mono text-[11px] text-muted mt-1">/{post.slug}</div>
                </td>
                <td className="px-6 py-5 font-body text-[13px] text-secondary">{post.author.firstName}</td>
                <td className="px-6 py-5">
                  <span className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1 rounded-full border ${
                    post.isDraft 
                      ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' 
                      : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                  }`}>
                    {post.isDraft ? 'Draft' : 'Published'}
                  </span>
                </td>
                <td className="px-6 py-5 font-mono text-[12px] text-muted">{new Date(post.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-5 text-right flex gap-4 justify-end items-center">
                  <Link href={`/blog/${post.id}/edit`} className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted hover:text-white transition-colors">Edit</Link>
                  <DeleteBlogButton id={post.id} />
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest">No blog posts yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
