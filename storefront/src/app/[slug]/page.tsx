import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
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
      <main 
        style={{ 
          minHeight: '100vh', 
          background: params.slug === 'about' 
            ? 'linear-gradient(to bottom, var(--void), var(--obsidian))' 
            : 'var(--obsidian)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Mobile Layout */}
        <div className="md:hidden" style={{ paddingBottom: '60px' }}>
          <div className="mobile-section-intro">
            <div>
              <div className="section-label" style={{ marginBottom: '2px' }}>{params.slug === 'about' ? 'The Heritage' : 'Information'}</div>
              <div className="section-title" style={{ fontSize: '24px' }}>
                {page.title}
              </div>
            </div>
          </div>
          
          <div 
            className="cms-content"
            style={{ 
              padding: '24px 24px 0',
              fontFamily: 'var(--font-body)', 
              fontSize: '15px', 
              lineHeight: 1.8, 
              color: 'var(--text-muted)',
              animation: 'fadeIn 1.2s ease-out'
            }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          {params.slug === 'about' && (
            <div 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '400px', 
                background: 'radial-gradient(circle at 50% -20%, var(--gold-pale) 0%, transparent 70%)',
                opacity: 0.1,
                pointerEvents: 'none'
              }} 
            />
          )}
          
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 24px 80px', position: 'relative', zIndex: 1 }}>
            <div 
              style={{ 
                textAlign: 'center', 
                marginBottom: '60px',
                animation: 'fadeInUp 1s ease-out' 
              }}
            >
              <div 
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '10px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.4em', 
                  color: 'var(--gold)', 
                  marginBottom: '16px',
                  opacity: 0.8
                }}
              >
                {params.slug === 'about' ? 'The Heritage' : 'Information'}
              </div>
              <h1 
                style={{ 
                  fontFamily: 'var(--font-serif)', 
                  fontSize: params.slug === 'about' ? '64px' : '48px', 
                  fontWeight: 300, 
                  color: 'var(--gold-light)', 
                  margin: 0,
                  lineHeight: 1.1
                }}
              >
                {page.title}
              </h1>
            </div>

            <div 
              className="cms-content"
              style={{ 
                fontFamily: 'var(--font-body)', 
                fontSize: '16px', 
                lineHeight: 1.9, 
                color: 'var(--text-muted)',
                animation: 'fadeIn 1.2s ease-out'
              }}
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          /* Ensure CMS content images are responsive on mobile */
          .cms-content img {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            margin: 24px 0;
          }
          .cms-content p {
            margin-bottom: 20px;
          }
        `}} />
      </main>
    </>
  );
}
