import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function NewTicketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/account/tickets/new')
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  async function createTicket(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const subject = formData.get('subject') as string
    const description = formData.get('description') as string
    const orderId = formData.get('orderId') as string

    const ticketNumber = `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        userId: user.id,
        subject,
        description,
        orderId: orderId || null,
        ticketMessages: {
          create: {
            authorId: user.id,
            message: description
          }
        }
      }
    })

    revalidatePath('/account/tickets')
    redirect(`/account/tickets/${ticket.id}`)
  }

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--obsidian)' }}>
        <div style={{ background: 'var(--void)', borderBottom: '1px solid var(--border)', padding: '40px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/account/tickets" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}>
              ← Back to Tickets
            </Link>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,3vw,42px)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1 }}>
              Raise a Request
            </h1>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 40px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px' }}>
            <form action={createTicket} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Subject *
                </label>
                <input 
                  type="text" 
                  name="subject" 
                  required
                  placeholder="E.g. Damaged part replacement, Installation help"
                  style={{ width: '100%', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '15px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Related Order (Optional)
                </label>
                <select 
                  name="orderId" 
                  style={{ width: '100%', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '15px', outline: 'none' }}
                >
                  <option value="">-- No specific order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>Order #{o.orderNumber} - {new Date(o.createdAt).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Description *
                </label>
                <textarea 
                  name="description" 
                  required
                  rows={6}
                  placeholder="Please describe your issue or request in detail..."
                  style={{ width: '100%', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '15px', resize: 'vertical' }}
                />
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <Link href="/account/tickets" className="btn-outline" style={{ padding: '14px 28px', textDecoration: 'none' }}>
                  Cancel
                </Link>
                <button type="submit" className="btn-primary" style={{ padding: '14px 28px' }}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
