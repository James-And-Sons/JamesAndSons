import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/account/tickets/${params.id}`)
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      order: true,
      ticketMessages: { orderBy: { createdAt: 'asc' } }
    }
  })

  // Security check: ensure user owns this ticket
  if (!ticket || ticket.userId !== user.id) {
    redirect('/account/tickets')
  }

  async function addReply(formData: FormData) {
    'use server'
    const message = formData.get('message') as string
    if (!message.trim()) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    await prisma.ticketMessage.create({
      data: {
        ticketId: params.id,
        authorId: user.id,
        message
      }
    })

    // If a user replies to an open/closed ticket, we can just optionally update status
    // (We'll leave status alone here, or we could change to OPEN if it was CLOSED, but let's keep it simple)

    revalidatePath(`/account/tickets/${params.id}`)
  }

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
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Link href="/account/tickets" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
                ← Back to Tickets
              </Link>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.2, marginBottom: '8px' }}>
                {ticket.subject}
              </h1>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                Ticket #{ticket.ticketNumber} · Created on {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
              {ticket.order && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Related Order: #{ticket.order.orderNumber}
                </div>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '6px 12px', border: '1px solid currentColor', opacity: 0.8, ...({ [getStatusColor(ticket.status).split(':')[0]]: getStatusColor(ticket.status).split(':')[1].trim() } as any) }}>
              {ticket.status.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            {/* Messages Area */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '500px', overflowY: 'auto' }}>
              {ticket.ticketMessages.map((msg: any) => {
                const isMine = msg.authorId === user.id
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {isMine ? 'You' : 'Support Team'} · {new Date(msg.createdAt).toLocaleString()}
                    </div>
                    <div style={{ 
                      background: isMine ? 'rgba(196,160,90,0.1)' : 'var(--background)',
                      border: `1px solid ${isMine ? 'var(--gold)' : 'var(--border)'}`,
                      padding: '16px 20px',
                      borderRadius: '4px',
                      borderTopRightRadius: isMine ? '0' : '4px',
                      borderTopLeftRadius: !isMine ? '0' : '4px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: isMine ? 'var(--cream)' : 'var(--text)',
                      lineHeight: 1.6,
                      maxWidth: '85%',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply Input */}
            {ticket.status !== 'CLOSED' ? (
              <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--void)' }}>
                <form action={addReply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <textarea 
                    name="message" 
                    required
                    rows={4}
                    placeholder="Type your reply here..."
                    style={{ width: '100%', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '14px', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontSize: '12px' }}>
                      Send Reply
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ padding: '24px', borderTop: '1px dashed var(--border)', background: 'var(--void)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
                  This ticket has been closed. Please open a new ticket if you need further assistance.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  )
}
