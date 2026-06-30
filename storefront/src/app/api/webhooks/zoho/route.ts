import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('Received Zoho Desk Webhook Payload:', JSON.stringify(payload, null, 2));

    // Extract event type, ticket details, and comment details defensively
    const event = (payload.event || payload.eventType || '').toLowerCase();
    
    const ticketData = payload.ticket || payload.data?.ticket || payload.data || {};
    const zohoTicketId = ticketData.id || ticketData.ticketId || payload.ticketId;
    
    if (!zohoTicketId) {
      console.warn('Zoho Desk Webhook skipped: Missing zohoTicketId in payload.');
      return NextResponse.json({ success: true, message: 'No ticket ID found in payload' });
    }

    // Locate the local ticket associated with this Zoho ticket ID
    const localTicket = await prisma.ticket.findUnique({
      where: { zohoId: String(zohoTicketId) }
    });

    if (!localTicket) {
      console.warn(`Zoho Desk Webhook skipped: No matching local ticket in database for zohoId: ${zohoTicketId}`);
      return NextResponse.json({ success: true, message: 'No matching local ticket' });
    }

    // 1. Synchronize Ticket Status
    const zohoStatus = (ticketData.status || '').toUpperCase();
    if (zohoStatus) {
      let nextStatus = localTicket.status;
      if (zohoStatus === 'RESOLVED') {
        nextStatus = 'RESOLVED';
      } else if (zohoStatus === 'CLOSED') {
        nextStatus = 'CLOSED';
      } else if (zohoStatus === 'OPEN' && localTicket.status === 'RESOLVED') {
        nextStatus = 'OPEN'; // Automatically reopen if re-opened in Zoho
      }

      if (nextStatus !== localTicket.status) {
        await prisma.ticket.update({
          where: { id: localTicket.id },
          data: { status: nextStatus }
        });
        console.log(`Synced status for Ticket #${localTicket.ticketNumber}: ${localTicket.status} -> ${nextStatus}`);
      }
    }

    // 2. Synchronize Support Agent Comments / Replies
    const commentData = payload.comment || payload.data?.comment || {};
    const zohoCommentId = commentData.id || commentData.commentId;
    const commentText = commentData.content || commentData.description;
    
    // Ensure the comment is created by a support representative (not a customer portal loopback)
    const isAgentComment = commentData.creator?.type === 'Agent' || commentData.isPublic === true;

    if (zohoCommentId && commentText && isAgentComment) {
      // Prevent duplicate insertions via the comment ID constraint
      const existingMessage = await prisma.ticketMessage.findUnique({
        where: { zohoId: String(zohoCommentId) }
      });

      if (!existingMessage) {
        // Ensure the local ADMIN profile exists in Postgres to satisfy foreign key constraints
        let adminUser = await prisma.user.findUnique({ where: { id: 'ADMIN' } });
        if (!adminUser) {
          await prisma.user.create({
            data: {
              id: 'ADMIN',
              email: 'support@jamesandsons.in',
              role: 'ADMIN',
              firstName: 'Support',
              lastName: 'Concierge',
              password: 'SUPABASE_AUTH'
            }
          });
        }

        // Insert the reply message into the thread
        await prisma.ticketMessage.create({
          data: {
            ticketId: localTicket.id,
            authorId: 'ADMIN',
            message: commentText,
            isAdmin: true,
            zohoId: String(zohoCommentId)
          }
        });

        // Set ticket to IN_PROGRESS if currently OPEN
        if (localTicket.status === 'OPEN') {
          await prisma.ticket.update({
            where: { id: localTicket.id },
            data: { status: 'IN_PROGRESS' }
          });
        }

        console.log(`Successfully synced Zoho Desk comment ${zohoCommentId} into local Ticket #${localTicket.ticketNumber}`);
        revalidatePath(`/account/tickets/${localTicket.id}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process Zoho Desk Webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
