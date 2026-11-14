import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import PageForm from '../PageForm';

export const dynamic = 'force-dynamic';

async function savePage(prevState: any, formData: FormData) {
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

  try {
    // Check for slug uniqueness before update/create to provide a better error message
    const existingPage = await prisma.page.findUnique({
      where: { slug }
    });

    if (existingPage && (!id || (id !== 'new' && existingPage.id !== id) || id === 'new')) {
      return { error: `The slug "${slug}" is already in use by another page. Please choose a unique slug.` };
    }

    if (id && id !== 'new') {
      await prisma.page.update({ where: { id }, data });
    } else {
      await prisma.page.create({ data });
    }
  } catch (error: any) {
    console.error('Error saving page:', error);
    if (error.code === 'P2002') {
      return { error: 'A unique constraint violation occurred. This slug might already be in use.' };
    }
    return { error: 'An unexpected error occurred. Please try again.' };
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
        <div className="flex items-center gap-4">
          <Link href="/pages" className="p-2 text-muted hover:text-accent border border-border bg-background transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M5 12L12 19M5 12L12 5" /></svg>
          </Link>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
            {isNew ? 'Create New Page' : 'Edit Page'}
          </h1>
        </div>
      </div>

      <PageForm page={page} isNew={isNew} action={savePage} />
    </div>
  );
}

