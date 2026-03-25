import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Ticket } from '@prisma/client'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/account/tickets')
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { order: true, _count: { select: { ticketMessages: true } } }
  })

  // Also fetch orders for the dropdown if they want to link a ticket to an order
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'color: var(--gold)'
      case 'IN_PROGRESS': return 'color: #60a5fa'
      case 'RESOLVED': return 'color: #4ade80'
      case 'CLOSED': return 'color: var(--text-muted)'
      default: return 'color: var(--text)'
    }
  }

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Link href="/account" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
                ← Back to Account
              </Link>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,3vw,42px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1 }}>
                Support Tickets
              </h1>
            </div>
            <Link href="/account/tickets/new" className="btn-primary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
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
                Need help with an order, part replacement, or installation? Our concierge team is ready to assist you.
              </p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    {['Ticket ID', 'Subject', 'Status', 'Date', 'Order'].map(h => (
                      <th key={h} style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                   {tickets.map((ticket: any) => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <Link href={`/account/tickets/${ticket.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', textDecoration: 'none' }}>
                          #{ticket.ticketNumber}
                        </Link>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
                          {ticket.subject}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                        {ticket._count.ticketMessages} messages
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '4px 8px', border: '1px solid currentColor', opacity: 0.8, ...({ [getStatusColor(ticket.status).split(':')[0]]: getStatusColor(ticket.status).split(':')[1].trim() } as any) }}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '20px 24px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {ticket.order?.orderNumber || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
