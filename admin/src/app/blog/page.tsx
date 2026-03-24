import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Blog Posts</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-2">{posts.length} articles published</p>
        </div>
        <Link href="/blog/new" className="btn-primary">+ New Post</Link>
      </div>

      <div className="bg-surface border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#16161a] border-b border-border">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Title</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Author</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Status</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Date</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className="border-b border-border hover:bg-[#1a1a1f]">
                <td className="px-6 py-5">
                  <div className="font-body text-[14px] text-primary font-medium">{post.title}</div>
                  <div className="font-mono text-[11px] text-muted mt-1">/{post.slug}</div>
                </td>
                <td className="px-6 py-5 font-body text-[13px] text-secondary">{post.author.firstName}</td>
                <td className="px-6 py-5">
                  <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border ${post.isDraft ? 'text-muted border-border' : 'text-accent border-accent/30'}`}>
                    {post.isDraft ? 'Draft' : 'Published'}
                  </span>
                </td>
                <td className="px-6 py-5 font-mono text-[12px] text-muted">{new Date(post.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-5 text-right flex gap-4 justify-end">
                   <Link href={`/blog/${post.id}/edit`} className="font-mono text-[10px] text-accent hover:underline lowercase">Edit</Link>
                   <button className="font-mono text-[10px] text-red-500/70 hover:text-red-500 lowercase">Delete</button>
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
