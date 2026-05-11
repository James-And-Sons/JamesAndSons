import Navigation from '@/components/Navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BlogListPage() {
  let posts: any[] = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { isDraft: false },
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
  }

  return (
    <>
      <Navigation />
      <main className="md:pt-16 min-h-screen" style={{ background: 'var(--obsidian)' }}>
        {/* Mobile Layout */}
        <div className="md:hidden" style={{ paddingBottom: '40px' }}>
          <div className="mobile-section-intro">
            <div>
              <div className="section-label" style={{ marginBottom: '2px' }}>Journal</div>
              <div className="section-title" style={{ fontSize: '22px' }}>
                The Collector's <em>Archive</em>
              </div>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', margin: '16px 24px 24px', lineHeight: 1.6 }}>
            Exploring the intersection of historical illumination, artisanal craftsmanship, and modern architectural lighting.
          </p>

          <div style={{ padding: '0 24px' }}>
            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  New stories arriving soon
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {posts.map((post: any, index: number) => {
                  const bgClass = `mobile-sc-${(index % 4) + 1}`;
                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`} className={`mobile-space-card ${bgClass}`} style={{ flexDirection: 'column', padding: 0, overflow: 'hidden', height: 'auto', alignItems: 'stretch' }}>
                      <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--border)', opacity: 0.5 }}>JS</span>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, color: 'var(--cream)', marginBottom: '8px', lineHeight: 1.3 }}>
                          {post.title}
                        </h2>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt}
                        </p>
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          Read Article <i className="ti ti-arrow-right"></i>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '60px 40px', textAlign: 'center', paddingTop: '100px' }}>
            <div className="section-label">Journal</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 300, color: 'var(--cream)', marginTop: '12px' }}>
              The Collector's Archive
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', marginTop: '16px', maxWidth: '600px', margin: '16px auto 0', lineHeight: 1.7 }}>
              Exploring the intersection of historical illumination, artisanal craftsmanship, and modern architectural lighting.
            </p>
          </div>

          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px' }}>
            {posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', border: '1px dashed var(--border)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  New stories arriving soon
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '40px' }}>
                {posts.map((post: any) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                    <article style={{ cursor: 'pointer' }}>
                      <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '20px' }}>
                         <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, var(--void), var(--surface))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', color: 'var(--border)', opacity: 0.5 }}>JS</span>
                         </div>
                      </div>
                      <div className="section-label" style={{ marginBottom: '10px' }}>
                         {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, color: 'var(--cream)', marginBottom: '12px', lineHeight: 1.3 }}>
                        {post.title}
                      </h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.excerpt}
                      </p>
                      <div style={{ marginTop: '20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        Read Article →
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
