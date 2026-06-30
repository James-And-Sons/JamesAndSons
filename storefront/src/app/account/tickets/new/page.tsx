import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import NewTicketForm from './NewTicketForm'

export const dynamic = 'force-dynamic'

export default async function NewTicketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/account/tickets/new')
  }

  // Ensure user exists in the local database (auto-sync if missing)
  let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: user.email! } })
    if (existingByEmail) {
      const oldId = existingByEmail.id
      const newId = user.id
      console.log(`Syncing user ID from ${oldId} to ${newId} for ${user.email}`)
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

  // Fetch recent orders along with their items and products to pass to the client component
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Server Action to create the Ticket and corresponding ReturnRequest
  async function createTicketAction(data: {
    category: string
    subject: string
    description: string
    orderId?: string
    orderItems?: any
    attachments: string[]
  }) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    // Ensure user exists in the local database (auto-sync if missing)
    let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: user.email! } })
      if (existingByEmail) {
        const oldId = existingByEmail.id
        const newId = user.id
        await prisma.$transaction([
          prisma.$executeRaw`UPDATE "User" SET "email" = ${oldId + '@temporary.sync'} WHERE "id" = ${oldId}`,
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
          prisma.$executeRaw`UPDATE "Order" SET "userId" = ${newId} WHERE "userId" = ${oldId}`,
          prisma.$executeRaw`UPDATE "RFQ" SET "userId" = ${newId} WHERE "userId" = ${oldId}`,
          prisma.$executeRaw`UPDATE "Ticket" SET "userId" = ${newId} WHERE "userId" = ${oldId}`,
          prisma.$executeRaw`UPDATE "UserAddress" SET "userId" = ${newId} WHERE "userId" = ${oldId}`,
          prisma.$executeRaw`UPDATE "TicketMessage" SET "authorId" = ${newId} WHERE "authorId" = ${oldId}`,
          prisma.$executeRaw`UPDATE "BlogPost" SET "authorId" = ${newId} WHERE "authorId" = ${oldId}`,
          prisma.$executeRaw`DELETE FROM "User" WHERE "id" = ${oldId}`
        ])
      } else {
        await prisma.user.create({
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

    const ticketNumber = `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    let ticket;
    try {
      ticket = await prisma.$transaction(async (tx) => {
        // 1. Create the Ticket with custom fields
        const t = await tx.ticket.create({
          data: {
            ticketNumber,
            userId: user.id,
            subject: data.subject,
            description: data.description,
            category: data.category,
            attachments: data.attachments,
            orderItems: data.orderItems || null,
            orderId: data.orderId || null,
            ticketMessages: {
              create: {
                authorId: user.id,
                message: data.description,
                attachments: data.attachments
              }
            }
          }
        })

        // 2. If it is a return request, create the ReturnRequest record too
        if (data.category === 'RETURN' && data.orderId) {
          const itemsText = data.orderItems 
            ? data.orderItems.map((it: any) => `${it.name} (QTY: ${it.quantity})`).join(', ')
            : 'All items'
          
          await tx.returnRequest.create({
            data: {
              orderId: data.orderId,
              reason: `Support Ticket Return Request (#${ticketNumber}): ${data.description}. Items: ${itemsText}`,
              status: 'PENDING'
            }
          })
        }

        return t
      })
    } catch (error) {
      console.error("Error creating ticket in Server Action:", error)
      return { success: false, error: 'Database transaction failed' }
    }

    revalidatePath('/account/tickets')
    return { success: true, ticketId: ticket.id }
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
          <NewTicketForm orders={orders as any} createTicketAction={createTicketAction} />
        </div>
      </main>
    </>
  )
}
