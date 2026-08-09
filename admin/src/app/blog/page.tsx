import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteBlogButton from "./DeleteBlogButton";
import ClickableRow from "@/components/ClickableRow";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
            Blog Posts
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-1 m-0">
            {posts.length} published articles &amp; drafts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blog/import"
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-secondary border border-border px-5 py-2.5 hover:text-primary hover:border-accent transition-colors bg-background rounded-sm"
          >
            📄 Import Word Doc
          </Link>
          <Link
            href="/blog/new"
            className="btn-primary font-mono text-[9px] uppercase tracking-[0.15em] px-6 py-2.5 shadow-lg shadow-accent/20"
          >
            + Create New Post
          </Link>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-border bg-surface-muted/30">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Title
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Author
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Status
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Date
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {posts.map((post) => (
              <ClickableRow
                key={post.id}
                href={`/blog/${post.id}/edit`}
                className="hover:bg-surface-muted/50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-5">
                  <Link
                    href={`/blog/${post.id}/edit`}
                    className="font-serif text-[17px] text-primary hover:text-accent transition-colors font-medium block"
                  >
                    {post.title}
                  </Link>
                  <div className="font-mono text-[11px] text-muted mt-1">
                    /{post.slug}
                  </div>
                </td>
                <td className="px-6 py-5 font-body text-[13px] text-secondary">
                  {post.author?.firstName || "Admin"}
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1 rounded-full border ${
                      post.isDraft
                        ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                        : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                    }`}
                  >
                    {post.isDraft ? "Draft" : "Published"}
                  </span>
                </td>
                <td className="px-6 py-5 font-mono text-[12px] text-muted">
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right flex gap-4 justify-end items-center">
                  <Link
                    href={`/blog/${post.id}/edit`}
                    className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent hover:text-white transition-colors font-semibold"
                  >
                    Edit →
                  </Link>
                  <DeleteBlogButton id={post.id} />
                </td>
              </ClickableRow>
            ))}
            {posts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest"
                >
                  No blog posts yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
