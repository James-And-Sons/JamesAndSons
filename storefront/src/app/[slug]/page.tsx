import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navigation from '@/components/Navigation';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const page = await prisma.page.findUnique({
    where: { slug: params.slug }
  });

  if (!page || !page.isPublished) return { title: 'Not Found' };

  return {
    title: page.metaTitle || `${page.title} | James & Sons`,
    description: page.metaDescription || '',
  };
}

export default async function CMSPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;

  // We filter out certain protected slugs just in case 
  if (['api', 'static', '_next'].includes(params.slug)) {
    return notFound();
  }

  const page = await prisma.page.findUnique({
    where: { slug: params.slug }
  });

  if (!page || !page.isPublished) {
    return notFound();
  }

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 300, color: 'var(--gold-light)', marginBottom: '40px', textAlign: 'center' }}>
            {page.title}
          </h1>
          <div 
            className="cms-content"
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.8, color: 'var(--text)' }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>
    </>
  );
}
