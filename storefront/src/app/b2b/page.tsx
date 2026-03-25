import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ApplyB2BForm from './ApplyB2BForm'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export default async function B2BPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch from Prisma for B2B status
  const dbUser = user ? await prisma.user.findUnique({
    where: { id: user.id },
    include: { company: true }
  }) : null

  const meta = user?.user_metadata || {}
  
  const isB2B = dbUser?.role === 'B2B_BUYER' || dbUser?.role === 'B2B_APPROVER' || meta.accountType === 'business'
  const isVerifiedB2B = dbUser?.role === 'B2B_BUYER' || dbUser?.role === 'B2B_APPROVER'
  const isPendingB2B = isB2B && !isVerifiedB2B

  return (
    <>
      <Navigation />

      <style>{`
        .b2b-feature:hover { border-color: var(--border-gold) !important; background: rgba(196,160,90,0.04) !important; }
        .b2b-step-num { font-family: var(--font-serif); font-size: 72px; font-weight: 300; color: var(--border-gold); line-height: 1; }
      `}</style>

      <main style={{ minHeight: '100vh', background: 'var(--obsidian)', paddingTop: '64px' }}>

        {/* ── Hero ── */}
        <section className="hero" style={{ minHeight: '80vh' }}>
          <div className="hero-bg" />

          {/* Chandelier SVG watermark omitted for brevity in diff, but I'll keep it in the real file */}
          <svg className="hero-svg" viewBox="0 0 300 480" fill="none" stroke="var(--gold)" opacity="0.6">
            <line x1="150" y1="0" x2="150" y2="480" strokeWidth="0.5" strokeDasharray="4 4" />
            <ellipse cx="150" cy="120" rx="100" ry="14" strokeWidth="0.5" />
            <ellipse cx="150" cy="200" rx="75" ry="11" strokeWidth="0.5" />
            <ellipse cx="150" cy="280" rx="50" ry="9" strokeWidth="0.5" />
            {[50,90,120,150,180,210,250].map((x,i) => (
              <line key={i} x1="150" y1="120" x2={x} y2="211" strokeWidth="0.4" strokeDasharray="3 4" />
            ))}
            {[80,110,130,150,170,190,220].map((x,i) => (
              <line key={i} x1="150" y1="200" x2={x} y2="289" strokeWidth="0.4" strokeDasharray="2 4" />
            ))}
            {[50,90,120,150,180,210,250].map((x,i) => (
              <circle key={i} cx={x} cy="216" r="2.5" fill="var(--gold)" stroke="none" opacity="0.7" />
            ))}
            {[80,110,130,150,170,190,220].map((x,i) => (
              <circle key={i} cx={x} cy="294" r="2" fill="var(--gold)" stroke="none" opacity="0.5" />
            ))}
            <rect x="135" y="340" width="30" height="80" strokeWidth="0.5" />
            {[140,150,165].map((x,i) => (
              <ellipse key={i} cx={x} cy={360 + i*20} rx="4" ry="6" strokeWidth="0.5" />
            ))}
          </svg>

          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: user && !isB2B ? '1.2fr 1fr' : '1fr', gap: '80px', alignItems: 'center' }}>
              <div>
                <div className="hero-eyebrow">Trade & Wholesale Programme</div>
                <h1 className="hero-title" style={{ fontSize: user && !isB2B ? '48px' : '64px' }}>
                  Light the World,<br />
                  <em>Build Your Business</em>
                </h1>
                <p className="hero-sub" style={{ maxWidth: '500px' }}>
                  James &amp; Sons partners with architects, interior designers, hospitality groups, and procurement teams across India to deliver exclusive B2B pricing, custom manufacturing, and priority fulfilment.
                </p>
                
                {!user && (
                  <div className="hero-ctas">
                    <Link href="/login?accountType=business" className="btn-primary" style={{ textDecoration: 'none' }}>
                      Apply for B2B Access
                    </Link>
                    <a href="#how-it-works" className="btn-outline">How It Works</a>
                  </div>
                )}

                {user && isB2B && isPendingB2B && (
                  <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(196,160,90,0.08)', border: '1px solid var(--border-gold)' }}>
                    <div className="section-label" style={{ marginBottom: '8px' }}>Application Pending Review</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Your B2B application is currently being reviewed. We'll notify you once your trade account is activated.
                    </p>
                  </div>
                )}

                {user && isB2B && !isPendingB2B && (
                  <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(40,167,69,0.08)', border: '1px solid var(--green)' }}>
                    <div className="section-label" style={{ marginBottom: '8px', color: 'var(--green)' }}>Verified B2B Partner</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Welcome back. Your trade account is active. Explore verified collections or submit a new RFQ from your account dashboard.
                    </p>
                    <Link href="/account" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block', textDecoration: 'none' }}>
                      Go to Dashboard
                    </Link>
                  </div>
                )}
              </div>

              {user && !isB2B && (
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <ApplyB2BForm userEmail={user.email!} />
                </div>
              )}
            </div>
          </div>

          <div className="hero-stats">
            {[['230+', 'Trade Partners'], ['₹50L+', 'Avg. B2B Order'], ['48h', 'Quote Turnaround']].map(([n, l]) => (
              <div key={l}>
                <div className="hero-stat-num">{n}</div>
                <div className="hero-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="section" style={{ background: 'var(--void)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section-header">
            <div>
              <div className="section-label">Why Partner With Us</div>
              <h2 className="section-title">Exclusive <em>B2B Privileges</em></h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2px' }}>
            {[
              { icon: '◈', title: 'Tiered Trade Pricing', body: 'Wholesale rates from 20–45% below MRP, scaling with order volume. Dedicated pricing tiers for architects, hospitality, and procurement.' },
              { icon: '◻', title: 'Custom Manufacturing', body: 'Specify dimensions, finishes, crystal types, and light sources. Our Jaipur atelier produces bespoke pieces to your exact brief.' },
              { icon: '◉', title: 'Priority Fulfilment', body: 'Dedicated B2B fulfilment queue. Factory-direct shipping across 18 states with white-glove installation partners available.' },
              { icon: '◫', title: 'RFQ & Bulk Quotation', body: 'Submit project-level Requests for Quotation. Receive itemised quotes within 48 hours including GST-ready pro forma invoices.' },
              { icon: '◑', title: 'GST Invoicing', body: 'All B2B orders ship with full GST compliance — GSTIN-linked tax invoices, e-way bills, and ITC-eligible documentation.' },
              { icon: '◐', title: 'Dedicated Account Manager', body: 'A personal point of contact for every verified trade account. Direct line for site visits, sample requests, and project tracking.' },
            ].map(f => (
              <div
                key={f.title}
                className="b2b-feature"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '36px 28px', transition: 'all 0.2s', cursor: 'default' }}
              >
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--gold)', marginBottom: '16px', lineHeight: 1 }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 300, color: 'var(--cream)', marginBottom: '10px' }}>{f.title}</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="section" id="how-it-works">
          <div className="section-header">
            <div>
              <div className="section-label">The Process</div>
              <h2 className="section-title">How It <em>Works</em></h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2px' }}>
            {[
              { num: '01', title: 'Apply', body: 'Submit your trade application—takes under 2 minutes. Tell us about your business, team size, and typical project types.' },
              { num: '02', title: 'Get Verified', body: 'Our B2B team reviews your application within 24 hours. Once approved, your account unlocks wholesale pricing and RFQ access.' },
              { num: '03', title: 'Submit an RFQ', body: 'Browse our full catalogue, build a project brief, or describe a custom requirement—then submit for a formal quotation.' },
              { num: '04', title: 'Receive & Order', body: 'Get a GST-ready pro forma invoice, approve the quote, and place your order. We manage fulfilment and keep you updated throughout.' },
            ].map(s => (
              <div key={s.num} style={{ padding: '40px 28px', border: '1px solid var(--border)', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
                <div className="b2b-step-num">{s.num}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--cream)', marginTop: '12px', marginBottom: '10px' }}>{s.title}</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Client Types ── */}
        <section className="section" style={{ background: 'var(--void)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section-header">
            <div>
              <div className="section-label">Who We Serve</div>
              <h2 className="section-title">Built for <em>Professionals</em></h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2px' }}>
            {[
              { title: 'Interior Designers', desc: 'Design fee structures, sample loans, and project-based accounts.' },
              { title: 'Architects', desc: 'Specification-grade documentation, shop drawings, and BIM assets.' },
              { title: 'Hospitality Groups', desc: 'Hotel, resort, and restaurant projects with large-scale custom manufacturing.' },
              { title: 'Procurement Teams', desc: 'Corporate and government procurement with bulk discounts and compliance docs.' },
              { title: 'Real Estate Developers', desc: 'Fit-out packages for residential and commercial projects at scale.' },
            ].map(c => (
              <div key={c.title} style={{ padding: '32px 24px', background: 'var(--surface2)', border: '1px solid var(--border)', borderTop: '2px solid var(--border-gold)' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--cream)', marginBottom: '10px', fontWeight: 300 }}>{c.title}</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section" style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ justifyContent: 'center', display: 'flex' }}>Start Today</div>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>Ready to <em>Partner?</em></h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: '480px', margin: '0 auto 40px' }}>
            Join 230+ trade professionals who source India's finest chandeliers through James &amp; Sons. Apply takes less than 2 minutes.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!user ? (
              <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
                Apply for B2B Access
              </Link>
            ) : (
              <Link href={isB2B ? "/account" : "#"} className="btn-primary" style={{ textDecoration: 'none' }}>
                {isB2B ? "Go to Account" : "Apply Above"}
              </Link>
            )}
            <a href="mailto:trade@jamesandsons.com" className="btn-outline">Email Our Trade Team</a>
          </div>
        </section>

      </main>
    </>
  )
}
