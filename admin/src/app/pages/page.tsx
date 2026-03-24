import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function PagesDashboard() {
  const pages = await prisma.page.findMany({
    orderBy: { createdAt: 'desc' }
  });

  async function togglePublishStatus(id: string, currentStatus: boolean) {
    'use server';
    await prisma.page.update({
      where: { id },
      data: { isPublished: !currentStatus }
    });
    revalidatePath('/pages');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">CMS Pages</h1>
        <Link href="/pages/new" className="btn-primary">Create New Page</Link>
      </div>

      <div className="bg-surface border border-border shadow-sm flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Title</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Slug mapping</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Visibility</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Last Updated</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-surface-muted transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-body text-[14px] text-primary font-medium">{page.title}</div>
                  </td>
                  <td className="px-8 py-5 font-mono text-[12px] text-muted">/{page.slug}</td>
                  <td className="px-8 py-5">
                    <form action={togglePublishStatus.bind(null, page.id, page.isPublished)}>
                      <button 
                        type="submit"
                        className={`font-mono text-[9px] uppercase tracking-wider border px-2 py-1 ${page.isPublished ? 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10' : 'text-muted border-border bg-background'}`}
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </form>
                  </td>
                  <td className="px-8 py-5 font-body text-[13px] text-secondary">
                    {page.updatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-3">
                    <Link href={`/pages/${page.id}`} className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:text-white transition-colors">
                      Edit
                    </Link>
                    <a href={`http://localhost:3000/${page.slug}`} target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted hover:text-white transition-colors">
                      View
                    </a>
                  </td>
                </tr>
              ))}
              
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                    No pages mapped yet. Get started by creating 'about' or 'terms'.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
