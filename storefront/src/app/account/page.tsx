import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/account')
  }

  // Fetch from Prisma for B2B status (Source of Truth)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { company: true }
  })

  const meta = user.user_metadata || {}
  
  // Use Prisma role or Supabase metadata as fallback
  const isB2B = dbUser?.role === 'B2B_BUYER' || dbUser?.role === 'B2B_APPROVER' || meta.accountType === 'business'
  const isVerifiedB2B = dbUser?.role === 'B2B_BUYER' || dbUser?.role === 'B2B_APPROVER'
  const isPendingB2B = isB2B && !isVerifiedB2B
  
  const displayName = isB2B
    ? (dbUser?.firstName || meta.contact_name || user.email?.split('@')[0])
    : (dbUser?.firstName ? `${dbUser.firstName} ${dbUser.lastName || ''}`.trim() : (meta.first_name ? `${meta.first_name} ${meta.last_name || ''}`.trim() : user.email?.split('@')[0]))

  const quickLinks = [
    { label: 'My Orders', href: '/account/orders', icon: '📦' },
    ...(isB2B ? [{ label: 'My RFQs', href: '/account/rfqs', icon: '📋' }] : []),
    { label: 'Saved Items', href: '/account/wishlist', icon: '♡' },
    { label: 'Address Book', href: '/account/addresses', icon: '📍' },
    { label: 'Support Tickets', href: '/account/tickets', icon: '🎟️' },
  ]

  return (
    <>
      <Navigation />

      <style>{`
        .account-link:hover { color: var(--gold) !important; }
      `}</style>

      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>

        {/* ── Header Banner ── */}
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '64px 40px 48px', position: 'relative', overflow: 'hidden' }}>
          <svg viewBox="0 0 200 260" style={{ position: 'absolute', right: '-60px', top: '-20px', width: '340px', opacity: 0.045, pointerEvents: 'none' }} stroke="var(--gold)" fill="none" strokeWidth="0.8">
            <line x1="100" y1="0" x2="100" y2="260" />
            <ellipse cx="100" cy="60" rx="70" ry="10" strokeWidth="0.4" />
            <ellipse cx="100" cy="110" rx="50" ry="8" strokeWidth="0.4" />
            <ellipse cx="100" cy="160" rx="30" ry="6" strokeWidth="0.4" />
            {[50,70,100,130,150].map((x,i) => <line key={i} x1="100" y1="60" x2={x} y2="118" strokeDasharray="3 3" strokeWidth="0.4" />)}
            {[70,85,100,115,130].map((x,i) => <line key={i} x1="100" y1="110" x2={x} y2="168" strokeDasharray="2 3" strokeWidth="0.4" />)}
          </svg>

          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
            <div>
              <div className="section-label">Account Portal</div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.05, marginTop: '8px' }}>
                {displayName}
              </h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                {isB2B ? `B2B Client · ${dbUser?.company?.name || meta.company_name || ''}` : 'Personal Account'}
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                Member since {new Date(user.created_at).getFullYear()}
              </p>
            </div>
            <form action="/auth/signout" method="post">
              <button className="btn-outline" style={{ padding: '10px 24px' }}>Sign Out</button>
            </form>
          </div>
        </div>

        {/* ── Grid ── */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2px', alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
              <div className="section-label" style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Profile</div>
              <InfoRow label="Email" value={user.email || ''} />
              {isB2B && (dbUser?.company?.name || meta.company_name) && <InfoRow label="Company" value={dbUser?.company?.name || meta.company_name} bold />}
              {isB2B && (dbUser?.company?.gstin || meta.gstin) && <InfoRow label="GSTIN" value={dbUser?.company?.gstin || meta.gstin} mono />}
              {isB2B && (
                <InfoRow
                  label="B2B Status"
                  value={isVerifiedB2B ? '✓ Verified' : '⏳ Pending Approval'}
                  highlight={isVerifiedB2B ? 'ok' : 'warn'}
                />
              )}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
              <div className="section-label" style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Quick Links</div>
              {quickLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="account-link"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 0',
                    fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                >
                  <span>{link.icon}&nbsp;&nbsp;{link.label}</span>
                  <span>→</span>
                </a>
              ))}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '28px' }}>
              <div className="section-label" style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Support</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
                Questions about an order or custom design? Our concierge team is with you.
              </p>
              <a href="mailto:hello@jamesandsons.com" className="btn-outline" style={{ display: 'block', textAlign: 'center', padding: '10px', textDecoration: 'none' }}>
                Contact Concierge
              </a>
            </div>
          </div>

          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '2px' }}>

            {isPendingB2B && (
              <div style={{ padding: '20px 24px', background: 'rgba(196,160,90,0.05)', border: '1px solid var(--border-gold)', marginBottom: '2px' }}>
                <div className="section-label" style={{ marginBottom: '8px' }}>B2B Account Under Review</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Your application is being reviewed. Once approved you'll unlock wholesale pricing, bulk RFQ submissions and priority delivery for hospitality &amp; trade orders.
                </p>
              </div>
            )}

            <ContentPanel label="Recent Orders">
              <EmptyState
                svgPath="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                title="No orders yet"
                body="Your order history will appear here once you make your first purchase."
              >
                <Link href="/collections" className="btn-primary" style={{ display: 'inline-block', padding: '12px 32px', textDecoration: 'none' }}>
                  Browse Collections
                </Link>
              </EmptyState>
            </ContentPanel>

            {isB2B && (
              <ContentPanel label="Requests for Quotation">
                <EmptyState
                  svgPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  title="No active RFQs"
                  body="Submit bulk order requests, custom design queries, or hospitality briefs to receive exclusive B2B pricing."
                >
                  <Link href="/rfq" style={{ textDecoration: 'none' }}>
                    <button
                      className="btn-primary"
                      style={{ padding: '12px 32px', opacity: isPendingB2B ? 0.4 : 1, cursor: isPendingB2B ? 'not-allowed' : 'pointer' }}
                    >
                      {isPendingB2B ? 'Approval Pending' : 'Start New RFQ'}
                    </button>
                  </Link>
                </EmptyState>
              </ContentPanel>
            )}

            <ContentPanel label="Saved Items">
              <EmptyState
                svgPath="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                title="Wishlist is empty"
                body="Save pieces you love to revisit or share with your interior designer."
              >
                <Link href="/collections" className="btn-outline" style={{ display: 'inline-block', padding: '12px 32px', textDecoration: 'none' }}>
                  Explore Designs
                </Link>
              </EmptyState>
            </ContentPanel>

          </div>
        </div>

        {/* ── Preferences ── */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 60px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px' }}>
            <div className="section-label" style={{ marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Preferences</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Theme</div>
            <ThemeToggle />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.7 }}>
              &ldquo;System Default&rdquo; matches your device&rsquo;s dark or light preference automatically.
            </p>
          </div>
        </div>

      </main>
    </>
  )
}

function ContentPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px' }}>
      <div className="section-label" style={{ marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>{label}</div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, bold, mono, highlight }: { label: string; value: string; bold?: boolean; mono?: boolean; highlight?: 'ok' | 'warn' }) {
  const color = highlight === 'ok' ? 'var(--green)' : highlight === 'warn' ? 'var(--gold)' : 'var(--text)'
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)', fontSize: mono ? '12px' : '14px', color, fontWeight: bold ? 500 : 400 }}>{value}</div>
    </div>
  )
}

function EmptyState({ svgPath, title, body, children }: { svgPath: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 20px', textAlign: 'center', border: '1px dashed var(--border)' }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1" style={{ opacity: 0.35, marginBottom: '20px' }}>
        <path d={svgPath} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 300, color: 'var(--cream)', marginBottom: '10px' }}>{title}</div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: 1.8, marginBottom: '24px' }}>{body}</p>
      {children}
    </div>
  )
}
