import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/messaging';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin email whitelist
    const whitelisted = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const adminEmails = [
      'abhishikt@growth-ho.com',
      'admin@jamesandsons.in',
      'vishal@jamesandsons.in',
      'james@jamesandsons.in',
      ...whitelisted
    ];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, isInternalNote, attachments } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // 1. Fetch current ticket along with customer info
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // 2. Perform DB updates in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the ticket message
      const msg = await tx.ticketMessage.create({
        data: {
          ticketId: id,
          authorId: user.id,
          message: message.trim(),
          isAdmin: true,
          isInternalNote: !!isInternalNote,
          attachments: attachments || []
        }
      });

      // Update ticket status & read flag
      await tx.ticket.update({
        where: { id },
        data: {
          readByAdmin: true,
          status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status
        }
      });

      // Add audit log entry
      await tx.ticketAuditLog.create({
        data: {
          ticketId: id,
          actorId: user.id,
          actionType: isInternalNote ? 'INTERNAL_NOTE' : 'STATUS_CHANGE',
          details: isInternalNote 
            ? 'Added an internal note' 
            : `Sent a public reply (Auto set status to In Progress)`
        }
      });

      return msg;
    });

    // 3. Send email notification if public reply
    if (!isInternalNote) {
      try {
        const customerName = `${ticket.user.firstName} ${ticket.user.lastName}`.trim();
        const subject = `Re: [${ticket.ticketNumber}] ${ticket.subject}`;
        const emailHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <h2 style="font-weight: 300; color: #C4A05A; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              Support Update: ${ticket.ticketNumber}
            </h2>
            <p>Dear ${customerName || 'Customer'},</p>
            <p>Our support team has updated your ticket <strong>${ticket.ticketNumber}</strong> (Subject: "${ticket.subject}").</p>
            
            <div style="background: #fdfaf4; padding: 20px; border-left: 3px solid #C4A05A; margin: 20px 0; white-space: pre-wrap; font-size: 14px; font-family: inherit;">
              ${message.trim()}
            </div>
            
            <p>You can view the full thread and reply online by clicking the link below:</p>
            <div style="margin: 25px 0;">
              <a href="https://jamesandsons.in/account/tickets/${id}" style="background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; display: inline-block;">
                View Ticket Thread
              </a>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px;">
              Alternatively, you can reply directly to this email, and it will be threaded back into your ticket.
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 11px; color: #bbb; text-align: center;">
              James & Sons &middot; Excellence in every detail &middot; support@jamesandsons.in
            </p>
          </div>
        `;

        await sendEmail({
          to: ticket.user.email,
          from: 'James & Sons Support <support@jamesandsons.in>',
          subject,
          html: emailHtml
        });
        console.log(`Dispatched reply notification email to ${ticket.user.email}`);
      } catch (emailErr) {
        console.error('Failed to send customer notification email:', emailErr);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to create ticket reply:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
