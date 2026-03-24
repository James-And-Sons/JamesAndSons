import Navigation from '@/components/Navigation';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: true }
  });

  if (!post || post.isDraft) {
    notFound();
  }

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <article style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
          <div style={{ marginBottom: '40px' }}>
            <Link href="/blog" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ← Return to Archive
            </Link>
          </div>

          <header style={{ marginBottom: '60px' }}>
            <div className="section-label" style={{ marginBottom: '20px' }}>
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.2, marginBottom: '24px' }}>
              {post.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                 <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>{post.author.firstName[0]}</span>
               </div>
               <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--cream)', opacity: 0.8 }}>{post.author.firstName} {post.author.lastName}</span>
            </div>
          </header>

          <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: '60px', overflow: 'hidden' }}>
             <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, var(--void), var(--surface))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '64px', color: 'var(--border)', opacity: 0.3 }}>JS</span>
             </div>
          </div>

          <div 
            style={{ 
              fontFamily: 'var(--font-body)', 
              fontSize: '17px', 
              color: 'var(--cream)', 
              lineHeight: 1.8,
              opacity: 0.9,
              whiteSpace: 'pre-wrap'
            }}
          >
            {post.content}
          </div>

          <footer style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
             <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--cream)', fontStyle: 'italic', marginBottom: '24px' }}>
                  A curation of brilliance for grand spaces.
                </p>
                <Link href="/collections" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Explore Collections
                </Link>
             </div>
          </footer>
        </article>
      </main>
    </>
  );
}
