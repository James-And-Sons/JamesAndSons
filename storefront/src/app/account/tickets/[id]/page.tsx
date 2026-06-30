import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import TicketDetailClient from './TicketDetailClient'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/account/tickets/${params.id}`)
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

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true
        }
      },
      ticketMessages: { orderBy: { createdAt: 'asc' } }
    }
  })

  // Security check: ensure user owns this ticket
  if (!ticket || ticket.userId !== user.id) {
    redirect('/account/tickets')
  }

  // Server Action to add a reply to the conversation thread
  async function addReplyAction(message: string, attachments: string[]) {
    'use server'
    if (!message.trim()) return { success: false, error: 'Message cannot be empty' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Create the conversation reply message
        await tx.ticketMessage.create({
          data: {
            ticketId: params.id,
            authorId: user.id,
            message,
            attachments
          }
        })

        // 2. If the ticket was resolved, automatically reopen it
        const currentTicket = await tx.ticket.findUnique({ where: { id: params.id } })
        if (currentTicket && currentTicket.status === 'RESOLVED') {
          await tx.ticket.update({
            where: { id: params.id },
            data: { status: 'OPEN' }
          })
        }
      })
    } catch (e) {
      console.error('Error adding reply:', e)
      return { success: false, error: 'Database transaction failed' }
    }

    revalidatePath(`/account/tickets/${params.id}`)
    return { success: true }
  }

  // Server Action to mark the ticket as resolved
  async function resolveTicketAction() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    try {
      await prisma.ticket.update({
        where: { id: params.id },
        data: { status: 'RESOLVED' }
      })
    } catch (e) {
      console.error('Error resolving ticket:', e)
      return { success: false, error: 'Database update failed' }
    }

    revalidatePath(`/account/tickets/${params.id}`)
    return { success: true }
  }

  return (
    <>
      <Navigation />
      <TicketDetailClient
        ticket={ticket as any}
        userId={user.id}
        addReplyAction={addReplyAction}
        resolveTicketAction={resolveTicketAction}
      />
    </>
  )
}
