import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/account/tickets')
  }

  // Ensure user exists in the local database (auto-sync if missing)
  let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: user.email! } })
    if (existingByEmail) {
      const oldId = existingByEmail.id
      const newId = user.id
      console.log(`Syncing user ID from ${oldId} to ${newId} for ${user.email} on tickets list`)
      await prisma.$transaction([
        // 1. Rename old user's email to release the unique constraint
        prisma.$executeRaw`UPDATE "User" SET "email" = ${oldId + '@temporary.sync'} WHERE "id" = ${oldId}`,
        // 2. Create the new user with the new ID and copy existing fields
        prisma.user.create({
          data: {
            id: newId,
            email: user.email!,
            password: existingByEmail.password,
            firstName: existingByEmail.firstName,
            lastName: existingByEmail.lastName,
            role: existingByEmail.role,
            phone: existingByEmail.phone,
            companyId: existingByEmail.companyId,
            lastPincode: existingByEmail.lastPincode
          }
        }),
        // 3. Migrate all dependent rows to the new ID
        prisma.$executeRaw`UPDATE "Order" SET "userId" = ${newId} WHERE "userId" = ${oldId}`,
        prisma.$executeRaw`UPDATE "RFQ" SET "userId" = ${newId} WHERE "userId" = ${oldId}`,
        prisma.$executeRaw`UPDATE "Ticket" SET "userId" = ${newId} WHERE "userId" = ${oldId}`,
        prisma.$executeRaw`UPDATE "UserAddress" SET "userId" = ${newId} WHERE "userId" = ${oldId}`,
        prisma.$executeRaw`UPDATE "TicketMessage" SET "authorId" = ${newId} WHERE "authorId" = ${oldId}`,
        prisma.$executeRaw`UPDATE "BlogPost" SET "authorId" = ${newId} WHERE "authorId" = ${oldId}`,
        // 4. Delete the old user record
        prisma.$executeRaw`DELETE FROM "User" WHERE "id" = ${oldId}`
      ])
      dbUser = await prisma.user.findUnique({ where: { id: newId } })
    } else {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          firstName: user.user_metadata?.first_name || 'Customer',
          lastName: user.user_metadata?.last_name || 'User',
          password: 'SUPABASE_AUTH',
          role: 'CUSTOMER'
        }
      })
    }
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { order: true, _count: { select: { ticketMessages: true } } }
  })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN': return { color: 'var(--gold)', borderColor: 'var(--border-gold)', background: 'rgba(196,160,90,0.05)' };
      case 'IN_PROGRESS': return { color: '#60a5fa', borderColor: 'rgba(96,165,250,0.4)', background: 'rgba(96,165,250,0.05)' };
      case 'RESOLVED': return { color: '#4ade80', borderColor: 'rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.05)' };
      case 'CLOSED': return { color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' };
      default: return { color: 'var(--text)', borderColor: 'var(--border)', background: 'none' };
    }
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'GENERAL': return 'General Inquiry';
      case 'RETURN': return 'Return Request';
      case 'DAMAGE': return 'Product Defect';
      case 'SHIPPING': return 'Logistics & Delivery';
      case 'BILLING': return 'Billing & Invoice';
      default: return cat;
    }
  }

  return (
    <>
            <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <Link href="/account" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
                ← Back to Account
              </Link>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,3vw,42px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1 }}>
                Support Tickets
              </h1>
            </div>
            <Link href="/account/tickets/new" className="btn-primary" style={{ padding: '12px 24px', textDecoration: 'none', borderRadius: '4px' }}>
              Raise New Ticket
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 40px' }}>
          {tickets.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center', border: '1px dashed var(--border)', background: 'var(--surface)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1" style={{ opacity: 0.35, marginBottom: '20px' }}>
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, color: 'var(--cream)', marginBottom: '12px' }}>No Support Tickets</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.8 }}>
                Need help with an order, return request, part replacement, or installation? Our concierge team is ready to assist you.
              </p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Desktop View */}
              <div className="hidden md:block">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      {['Ticket ID', 'Topic / Subject', 'Status', 'Date', 'Related Order'].map(h => (
                        <th key={h} style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t: any) => {
                      const statusStyle = getStatusStyle(t.status);
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.3s' }}>
                          <td style={{ padding: '20px 24px' }}>
                            <Link href={`/account/tickets/${t.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', textDecoration: 'none' }}>
                              #{t.ticketNumber}
                            </Link>
                          </td>
                          <td style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <Link href={`/account/tickets/${t.id}`} style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--cream)', textDecoration: 'none', fontWeight: 500 }}>
                                {t.subject}
                              </Link>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.05em' }}>
                                  {getCategoryLabel(t.category)}
                                </span>
                                <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>·</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                                  {t._count.ticketMessages} messages
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '20px 24px' }}>
                            <span style={{ 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '9px', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.15em', 
                              padding: '4px 8px', 
                              border: '1px solid', 
                              borderRadius: '3px',
                              color: statusStyle.color,
                              borderColor: statusStyle.borderColor,
                              background: statusStyle.background
                            }}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '20px 24px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '20px 24px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {t.order?.orderNumber ? `#${t.order.orderNumber}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column' }}>
                {tickets.map((t: any) => {
                  const statusStyle = getStatusStyle(t.status);
                  return (
                    <Link 
                      key={t.id}
                      href={`/account/tickets/${t.id}`}
                      style={{ 
                        display: 'block', 
                        padding: '20px', 
                        borderBottom: '1px solid var(--border)', 
                        textDecoration: 'none',
                        background: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)' }}>
                          #{t.ticketNumber}
                        </span>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '8px', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.1em', 
                          padding: '2px 6px', 
                          border: '1px solid', 
                          borderRadius: '3px',
                          color: statusStyle.color,
                          borderColor: statusStyle.borderColor,
                          background: statusStyle.background
                        }}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                        {t.subject}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--text-dim)' }}>
                          {getCategoryLabel(t.category)}
                        </span>
                        <span>
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
