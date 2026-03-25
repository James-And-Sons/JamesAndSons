import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function savePage(formData: FormData) {
  'use server';
  
  const id = formData.get('id') as string | null;
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const metaTitle = formData.get('metaTitle') as string;
  const metaDescription = formData.get('metaDescription') as string;
  const isPublished = formData.get('isPublished') === 'true';

  const data = {
    title,
    slug,
    content,
    metaTitle: metaTitle || null,
    metaDescription: metaDescription || null,
    isPublished,
  };

  if (id && id !== 'new') {
    await prisma.page.update({ where: { id }, data });
  } else {
    await prisma.page.create({ data });
  }

  revalidatePath('/pages');
  redirect('/pages');
}

export default async function PageEditor(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === 'new';
  
  let page = null;
  if (!isNew) {
    page = await prisma.page.findUnique({ where: { id: params.id } });
    if (!page) return <div>Page not found</div>;
  }

  return (
    <div className="max-w-[800px] w-full mx-auto space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
          {isNew ? 'Create New Page' : 'Edit Page'}
        </h1>
      </div>

      <form action={savePage} className="bg-surface border border-border p-6 space-y-6">
        <input type="hidden" name="id" value={params.id} />
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Page Title</label>
            <input 
              name="title" 
              defaultValue={page?.title} 
              required 
              type="text" 
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[14px]"
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">URL Slug</label>
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

        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Page Content (HTML/Markdown)</label>
          <textarea 
            name="content" 
            defaultValue={page?.content} 
            required 
            rows={15}
            className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[13px] leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">SEO Meta Title (Optional)</label>
            <input 
              name="metaTitle" 
              defaultValue={page?.metaTitle || ''} 
              type="text" 
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[14px]"
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">SEO Meta Description (Optional)</label>
            <textarea 
              name="metaDescription" 
              defaultValue={page?.metaDescription || ''} 
              rows={3}
              className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-body text-[13px]"
            />
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Visibility</label>
          <select name="isPublished" defaultValue={page ? String(page.isPublished) : 'true'} className="w-full bg-background border border-border px-4 py-3 text-primary focus:outline-none focus:border-accent transition-colors font-mono text-[12px] uppercase">
            <option value="true">Published (Public)</option>
            <option value="false">Draft (Hidden)</option>
          </select>
        </div>

        <div className="pt-8 flex justify-end gap-4">
          <Link href="/pages" className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-3 hover:bg-surface-muted transition-colors">
            Cancel
          </Link>
          <button type="submit" className="btn-primary">
            {isNew ? 'Create Page' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
