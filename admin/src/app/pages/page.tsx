import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import ClickableRow from '@/components/ClickableRow';

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
      <div className="flex justify-between items-center premium-card p-6">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">CMS Pages</h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">{pages.length} pages mapped</p>
        </div>
        <Link href="/pages/new" className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-8 py-3 shadow-lg shadow-accent/20">Create New Page</Link>
      </div>

      <div className="premium-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-surface-muted/30">
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
                <ClickableRow key={page.id} href={`/pages/${page.id}`}>
                  <td className="px-8 py-5">
                    <div className="font-serif text-[17px] text-primary">{page.title}</div>
                  </td>
                  <td className="px-8 py-5 font-mono text-[11px] text-muted">/{page.slug}</td>
                  <td className="px-8 py-5">
                    <form action={togglePublishStatus.bind(null, page.id, page.isPublished)}>
                      <button 
                        type="submit"
                        className={`font-mono text-[9px] uppercase tracking-wider border px-3 py-1 rounded-full ${
                          page.isPublished 
                            ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' 
                            : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                        }`}
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </form>
                  </td>
                  <td className="px-8 py-5 font-mono text-[12px] text-secondary">
                    {page.updatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-3 items-center">
                    <Link href={`/pages/${page.id}`} className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-white transition-colors">
                      Edit
                    </Link>
                    <a href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3001'}/${page.slug}`} target="_blank" rel="noreferrer" className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent hover:text-white transition-colors">
                      View
                    </a>
                  </td>
                </ClickableRow>
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
