import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Strips HTML wrappers from Zoho's comment payloads
const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>/g, '').trim();
};

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    console.log('Received Zoho Desk Webhook Payload:', JSON.stringify(rawPayload, null, 2));

    // Zoho Desk webhooks deliver events inside an array block
    const data = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;
    if (!data) {
      console.warn('Zoho Desk Webhook: Empty payload block.');
      return NextResponse.json({ success: true, message: 'Empty payload block' });
    }

    const event = (data.eventType || data.event || '').toLowerCase();
    const innerPayload = data.payload || {};
    
    // For comment events, Zoho lists the target ticket under payload.ticketId.
    // For ticket updates, the payload represents the ticket, so we check payload.id.
    const zohoTicketId = innerPayload.ticketId || innerPayload.id || data.ticketId;

    if (!zohoTicketId) {
      console.warn('Zoho Desk Webhook skipped: Missing ticket reference ID.');
      return NextResponse.json({ success: true, message: 'Missing ticket ID' });
    }

    // Locate the local ticket associated with this Zoho ticket ID
    const localTicket = await prisma.ticket.findUnique({
      where: { zohoId: String(zohoTicketId) }
    });

    if (!localTicket) {
      console.warn(`Zoho Desk Webhook skipped: No matching local ticket in database for zohoId: ${zohoTicketId}`);
      return NextResponse.json({ success: true, message: 'No matching local ticket' });
    }

    // 1. Synchronize Ticket Status (resolved or closed)
    const zohoStatus = (innerPayload.status || '').toUpperCase();
    if (zohoStatus) {
      let nextStatus = localTicket.status;
      if (zohoStatus === 'RESOLVED') {
        nextStatus = 'RESOLVED';
      } else if (zohoStatus === 'CLOSED') {
        nextStatus = 'CLOSED';
      } else if (zohoStatus === 'OPEN' && localTicket.status === 'RESOLVED') {
        nextStatus = 'OPEN'; // Re-open
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
    const isCommentEvent = event.includes('comment') || innerPayload.content !== undefined;
    const zohoCommentId = innerPayload.id;
    const rawCommentText = innerPayload.content || '';
    
    // Ensure the comment is created by a support representative (not a customer portal loopback)
    const commenterType = (innerPayload.commenter?.type || '').toUpperCase();
    const isAgentComment = commenterType === 'AGENT' || innerPayload.isPublic === true;

    if (isCommentEvent && zohoCommentId && rawCommentText && isAgentComment) {
      // Prevent duplicate insertions via the comment ID constraint
      const existingMessage = await prisma.ticketMessage.findUnique({
        where: { zohoId: String(zohoCommentId) }
      });

      if (!existingMessage) {
        const cleanCommentText = stripHtml(rawCommentText);

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
            message: cleanCommentText,
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

        console.log(`Successfully synced Zoho comment ${zohoCommentId} into local Ticket #${localTicket.ticketNumber}`);
        revalidatePath(`/account/tickets/${localTicket.id}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process Zoho Desk Webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
