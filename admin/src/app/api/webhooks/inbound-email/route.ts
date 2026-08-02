import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotificationToAllAdmins } from '@/lib/push';

/**
 * Inbound Email Webhook
 *
 * Receives parsed inbound emails from Resend (or any compatible provider)
 * and threads them back into the matching ticket as a customer reply.
 *
 * Resend format: https://resend.com/docs/email/inbound-email
 * Also handles Mailgun, Postmark, SendGrid inbound parse formats.
 *
 * Ticket matching strategy (in order of priority):
 *   1. Reply-To tagged address:  ticket+TKT-XXXXXX@inbound.jamesandsons.in
 *   2. Subject line:             Re: [TKT-XXXXXX] Original subject
 *   3. In-Reply-To header:       matches stored externalMessageId
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify webhook secret to prevent spoofing ─────────────────────────
    const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
    if (secret) {
      const authHeader = req.headers.get('x-resend-signature') ||
                         req.headers.get('x-webhook-secret') ||
                         req.headers.get('authorization');
      if (!authHeader || !authHeader.includes(secret)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // ── 2. Parse the inbound email payload ───────────────────────────────────
    const contentType = req.headers.get('content-type') || '';
    let payload: any = {};

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      // Convert FormData to plain object
      formData.forEach((value, key) => {
        payload[key] = value;
      });
    }

    // Normalise across providers
    // Resend: { from, to, subject, text, html, headers, ... }
    // Mailgun: { sender, recipient, subject, stripped-text, ... }
    // Postmark: { From, To, Subject, TextBody, ... }
    const fromEmail: string =
      payload.from || payload.sender || payload.From || '';
    const toAddress: string =
      payload.to || payload.recipient || payload.To || '';
    const subject: string =
      payload.subject || payload.Subject || '';
    const body: string =
      payload.text || payload['stripped-text'] || payload.TextBody || payload.html || payload.HtmlBody || '';
    const inReplyTo: string =
      payload.inReplyTo || payload['In-Reply-To'] || payload.InReplyTo || '';
    const messageId: string =
      payload.messageId || payload['Message-Id'] || payload.MessageID || '';

    if (!fromEmail && !body) {
      return NextResponse.json({ error: 'No parseable email payload' }, { status: 400 });
    }

    // ── 3. Match to a ticket ─────────────────────────────────────────────────
    let ticketId: string | null = null;

    // Strategy 1: Tagged reply-to address like ticket+TKT-RAT3BW@inbound.jamesandsons.in
    const taggedMatch = toAddress.match(/ticket\+([A-Z0-9-]+)@/i);
    if (taggedMatch) {
      const ticketNumber = taggedMatch[1].toUpperCase();
      const found = await prisma.ticket.findFirst({ where: { ticketNumber } });
      if (found) ticketId = found.id;
    }

    // Strategy 2: Ticket number in subject line: [TKT-XXXXXX]
    if (!ticketId) {
      const subjectMatch = subject.match(/\[([A-Z0-9]{3}-[A-Z0-9]+)\]/i);
      if (subjectMatch) {
        const ticketNumber = subjectMatch[1].toUpperCase();
        const found = await prisma.ticket.findFirst({ where: { ticketNumber } });
        if (found) ticketId = found.id;
      }
    }

    // Strategy 3: Match by externalMessageId stored from a previous outbound email
    if (!ticketId && inReplyTo) {
      const foundMsg = await prisma.ticketMessage.findFirst({
        where: { externalMessageId: inReplyTo },
        select: { ticketId: true },
      });
      if (foundMsg) ticketId = foundMsg.ticketId;
    }

    if (!ticketId) {
      // Can't match to a ticket — log and return 200 so provider doesn't retry
      console.warn('[Inbound Email] Could not match to any ticket:', { fromEmail, subject, toAddress });
      return NextResponse.json({ ok: true, matched: false });
    }

    // ── 4. Prevent duplicate ingestion ───────────────────────────────────────
    if (messageId) {
      const existing = await prisma.ticketMessage.findFirst({
        where: { externalMessageId: messageId },
      });
      if (existing) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
    }

    // ── 5. Clean up quoted reply body ────────────────────────────────────────
    // Strip everything after "---" or "On <date> ... wrote:" in replies
    const cleanBody = stripQuotedText(body);

    // ── 6. Create the inbound message in the ticket thread ───────────────────
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });
    if (!ticket) {
      return NextResponse.json({ ok: true, matched: false });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticketMessage.create({
        data: {
          ticketId,
          authorId: ticket.userId, // attribute to the ticket owner (customer)
          message: cleanBody.trim() || body.trim(),
          isAdmin: false,
          isInternalNote: false,
          attachments: [],
          externalMessageId: messageId || undefined,
        },
      });

      // Re-open ticket if it was resolved/closed
      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
        await tx.ticket.update({
          where: { id: ticketId! },
          data: { status: 'OPEN', readByAdmin: false },
        });
      } else {
        // Mark as unread for the admin
        await tx.ticket.update({
          where: { id: ticketId! },
          data: { readByAdmin: false },
        });
      }
    });

    // ── 7. Notify admins via push ─────────────────────────────────────────────
    try {
      await sendNotificationToAllAdmins({
        title: `Customer replied: ${ticket.ticketNumber}`,
        body: cleanBody.trim().substring(0, 100),
        url: `/tickets/${ticketId}`,
        type: 'TICKET',
      });
    } catch (pushErr) {
      console.warn('[Inbound Email] Push notification failed (non-critical):', pushErr);
    }

    console.log(`[Inbound Email] Threaded reply from ${fromEmail} into ticket ${ticket.ticketNumber}`);
    return NextResponse.json({ ok: true, matched: true, ticketId });

  } catch (err: any) {
    console.error('[Inbound Email] Webhook error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * Strip quoted email text (everything after a reply divider)
 */
function stripQuotedText(text: string): string {
  const lines = text.split('\n');
  const cutoff = lines.findIndex((line) => {
    const t = line.trim();
    return (
      t.startsWith('On ') && t.endsWith('wrote:') ||
      t === '---' ||
      t === '--' ||
      t.startsWith('From:') && lines.indexOf(line) > 2 ||
      t.startsWith('> ') && lines.indexOf(line) > 2
    );
  });
  return cutoff > 0 ? lines.slice(0, cutoff).join('\n') : text;
}
