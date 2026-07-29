import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Sends a reply email directly via Resend with proper threading headers so
 * customer replies come back through inbound.jamesandsons.in and thread into
 * the ticket automatically.
 */
async function sendReplyEmail({
  to,
  customerName,
  ticketNumber,
  ticketId,
  ticketSubject,
  messageBody,
  inReplyToMessageId,
}: {
  to: string;
  customerName: string;
  ticketNumber: string;
  ticketId: string;
  ticketSubject: string;
  messageBody: string;
  inReplyToMessageId?: string | null;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('[Reply] RESEND_API_KEY not set — email not sent');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const subject = `Support Update: [${ticketNumber}] ${ticketSubject}`;
  const noReplyAddress = 'no-reply@jamesandsons.in';

  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;line-height:1.6;background:#fff;padding:20px;">
      <div style="border-bottom:1px solid #eee;padding:10px 0 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.15em;">James &amp; Sons Concierge</p>
        <h2 style="margin:6px 0 0;font-weight:300;color:#C4A05A;font-size:22px;letter-spacing:0.05em;">Support Ticket ${ticketNumber}</h2>
      </div>

      <p style="font-size:15px;color:#333;">Dear ${customerName || 'Valued Customer'},</p>
      <p style="font-size:14px;color:#555;">Our support team has updated your ticket with the following response:</p>

      <div style="background:#fdfaf4;border-left:3px solid #C4A05A;padding:18px 20px;margin:24px 0;border-radius:0 4px 4px 0;">
        <div style="font-size:14.5px;color:#1a1a1a;white-space:pre-wrap;line-height:1.7;font-family:Georgia,serif;">${messageBody.trim()}</div>
      </div>

      <p style="font-size:13.5px;color:#555;margin-bottom:20px;">
        To reply, send attachments, or check your ticket status, please click the button below to open your secure customer portal:
      </p>

      <div style="margin:28px 0; text-align: center;">
        <a href="https://jamesandsons.in/account/tickets/${ticketId}"
           style="background:#C4A05A;color:#000;padding:14px 36px;text-decoration:none;text-transform:uppercase;letter-spacing:0.15em;font-size:11px;font-weight:bold;display:inline-block;border-radius:4px;box-shadow:0 2px 8px rgba(196,160,90,0.25);transition:all 0.2s;">
          Reply in Customer Portal
        </a>
      </div>

      <p style="font-size:11px;color:#888;text-align:center;margin-top:28px;font-style:italic;background:#f9f9f9;padding:10px;border-radius:4px;">
        ⚠️ This is an automated notification. To guarantee your response is delivered and threaded instantly, please do not reply to this email directly. Click the button above to respond in the portal.
      </p>

      <hr style="border:0;border-top:1px solid #eee;margin:32px 0 16px;" />
      <p style="font-size:10px;color:#bbb;text-align:center;margin:0;text-transform:uppercase;letter-spacing:0.05em;">
        James &amp; Sons &middot; Excellence in every detail &middot; support@jamesandsons.in
      </p>
    </div>
  `;

  // Build headers for email threading
  const headers: Record<string, string> = {
    'Reply-To': noReplyAddress,
    'X-Ticket-Number': ticketNumber,
    'X-Ticket-ID': ticketId,
  };
  if (inReplyToMessageId) {
    headers['In-Reply-To'] = inReplyToMessageId;
    headers['References'] = inReplyToMessageId;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'James & Sons Support <support@jamesandsons.in>',
        to: [to],
        reply_to: noReplyAddress,
        subject,
        html,
        headers,
      }),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      // Resend returns Message-ID in format: <id@resend.dev>
      return { success: true, messageId: `<${data.id}@resend.dev>` };
    }
    console.error('[Reply] Resend API error:', data);
    return { success: false, error: data.message || 'Resend dispatch failed' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

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

    // 1. Fetch current ticket with customer info and last outbound message id
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: true,
        ticketMessages: {
          where: { isAdmin: true, externalMessageId: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { externalMessageId: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const lastOutboundMessageId = ticket.ticketMessages[0]?.externalMessageId ?? null;

    // 2. Perform DB updates in transaction
    const result = await prisma.$transaction(async (tx) => {
      const msg = await tx.ticketMessage.create({
        data: {
          ticketId: id,
          authorId: user.id,
          message: message.trim(),
          isAdmin: true,
          isInternalNote: !!isInternalNote,
          attachments: attachments || [],
          // externalMessageId will be updated after email is sent
        },
      });

      await tx.ticket.update({
        where: { id },
        data: {
          readByAdmin: true,
          status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
        },
      });

      await tx.ticketAuditLog.create({
        data: {
          ticketId: id,
          actorId: user.id,
          actionType: isInternalNote ? 'INTERNAL_NOTE' : 'STATUS_CHANGE',
          details: isInternalNote
            ? 'Added an internal note'
            : 'Sent a public reply (status set to In Progress)',
        },
      });

      return msg;
    });

    // 3. Send email and store the Message-ID for threading
    if (!isInternalNote) {
      try {
        const customerName = `${ticket.user.firstName} ${ticket.user.lastName}`.trim();
        const emailResult = await sendReplyEmail({
          to: ticket.user.email,
          customerName,
          ticketNumber: ticket.ticketNumber,
          ticketId: id,
          ticketSubject: ticket.subject,
          messageBody: message,
          inReplyToMessageId: lastOutboundMessageId,
        });

        if (emailResult.success && emailResult.messageId) {
          // Store the outbound Message-ID so future replies can be In-Reply-To threaded
          await prisma.ticketMessage.update({
            where: { id: result.id },
            data: { externalMessageId: emailResult.messageId },
          });
          console.log(`[Reply] Email sent to ${ticket.user.email}, Message-ID: ${emailResult.messageId}`);
        } else {
          console.error('[Reply] Email dispatch failed:', emailResult.error);
        }
      } catch (emailErr) {
        console.error('[Reply] Unexpected email error:', emailErr);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to create ticket reply:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
