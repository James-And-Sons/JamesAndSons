import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to clean signatures and original email quote blocks
function cleanEmailBody(text: string): string {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  const cleanLines = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Stop reading lines if we hit standard email quoting or original message boundaries
    if (
      (trimmed.toLowerCase().startsWith('on ') && trimmed.toLowerCase().includes(' wrote:')) ||
      trimmed.startsWith('-----Original Message-----') ||
      trimmed.startsWith('From:') && trimmed.includes('@') ||
      trimmed.startsWith('=== Write your reply above this line ===') ||
      trimmed === '________________________________' ||
      trimmed.startsWith('To:') && trimmed.includes('@')
    ) {
      break;
    }
    cleanLines.push(line);
  }
  
  let body = cleanLines.join('\n').trim();
  // Strip common "Sent from my iPhone/Android" signatures
  body = body.replace(/Sent from my iPhone.*/i, '');
  body = body.replace(/Sent from my Android.*/i, '');
  return body.trim();
}

// Helper to extract email address from "Name <email@domain.com>" format
function extractEmail(fromString: string): string {
  if (!fromString) return '';
  const match = fromString.match(/<([^>]+)>/);
  return match ? match[1].trim().toLowerCase() : fromString.trim().toLowerCase();
}

// Helper to extract recipient emails array from Resend payload ('to' field)
function extractRecipients(payloadData: any): string[] {
  const toRaw = payloadData.to;
  if (!toRaw) return [];
  const list = Array.isArray(toRaw) ? toRaw : [toRaw];
  return list.map((item: any) => {
    if (typeof item === 'string') return extractEmail(item);
    if (item && item.email) return item.email.trim().toLowerCase();
    return '';
  }).filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('Received Inbound Resend Webhook:', JSON.stringify(payload, null, 2));

    // Resend delivers email payloads inside the event 'data' field or direct root
    const emailData = payload.data || payload;
    if (!emailData || !emailData.from) {
      return NextResponse.json({ success: true, message: 'Invalid or empty email payload' });
    }

    const fromRaw = emailData.from;
    const senderEmail = extractEmail(fromRaw);
    const recipients = extractRecipients(emailData);
    const subject = emailData.subject || '';
    const textContent = emailData.text || '';
    const cleanBody = cleanEmailBody(textContent) || 'Empty reply message.';

    // Define inbox routing groups
    const supportInboxes = ['support@jamesandsons.in', 'order@jamesandsons.in'];
    const inquiryInboxes = ['sales@jamesandsons.in', 'connect@jamesandsons.in'];

    const isSupportRecipient = recipients.some(r => supportInboxes.includes(r));
    const isInquiryRecipient = recipients.some(r => inquiryInboxes.includes(r));

    // 1. OUT OF SCOPE GUARD: If not matching support or inquiry inboxes (e.g. operations@), ignore
    if (!isSupportRecipient && !isInquiryRecipient) {
      console.log(`Webhook: Ignored email sent to out-of-scope recipient(s): [${recipients.join(', ')}]. Zero DB operations performed.`);
      return NextResponse.json({ success: true, message: 'Ignored out-of-scope recipient' }, { status: 200 });
    }

    // 2. INQUIRY FLOW: sent to sales@ or connect@
    if (isInquiryRecipient && !isSupportRecipient) {
      const recipientMatched = recipients.find(r => inquiryInboxes.includes(r)) || 'sales@jamesandsons.in';
      const name = fromRaw.includes('<') ? fromRaw.split('<')[0].trim() : null;

      const inquiry = await prisma.inquiry.create({
        data: {
          email: senderEmail,
          name,
          subject: subject || 'New Inquiry',
          message: cleanBody,
          recipient: recipientMatched,
          status: 'NEW'
        }
      });

      console.log(`Webhook: Saved new Inquiry (${inquiry.id}) sent to ${recipientMatched} from ${senderEmail}`);
      return NextResponse.json({ success: true, inquiryId: inquiry.id });
    }

    // 3. SUPPORT FLOW: sent to support@ or order@

    // Look for ticket number pattern: [TKT-XXXXXX] in subject
    const ticketMatch = subject.match(/\[TKT-([A-Z0-9]{6})\]/i);
    const matchedTicketNumber = ticketMatch ? `TKT-${ticketMatch[1].toUpperCase()}` : null;

    // Define admin whitelists
    const whitelisted = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    const adminEmails = [
      'abhishikt@growth-ho.com',
      'admin@jamesandsons.in',
      'vishal@jamesandsons.in',
      'james@jamesandsons.in',
      ...whitelisted
    ];

    if (matchedTicketNumber) {
      // 1. Thread reply to an existing ticket
      const ticket = await prisma.ticket.findUnique({
        where: { ticketNumber: matchedTicketNumber },
        include: { user: true }
      });

      if (ticket) {
        const isAdminSender = adminEmails.includes(senderEmail);

        // Find the exact user matching this sender email address, or fall back
        let authorUser = await prisma.user.findUnique({ where: { email: senderEmail } });
        if (!authorUser && isAdminSender) {
          authorUser = await prisma.user.findUnique({ where: { id: 'ADMIN' } });
        }

        const authorId = authorUser ? authorUser.id : (isAdminSender ? 'ADMIN' : ticket.userId);

        await prisma.$transaction(async (tx) => {
          // Add comment to ticket message thread
          await tx.ticketMessage.create({
            data: {
              ticketId: ticket.id,
              authorId,
              message: cleanBody,
              isAdmin: isAdminSender
            }
          });

          // Update ticket meta status based on who replied
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              readByAdmin: isAdminSender, // Mark as read if admin replied, unread if customer replied
              status: ticket.status === 'CLOSED' || ticket.status === 'RESOLVED' 
                ? 'OPEN' // Reopen resolved/closed tickets if customer replies
                : (isAdminSender ? 'IN_PROGRESS' : ticket.status)
            }
          });

          // Log action in audit logs
          await tx.ticketAuditLog.create({
            data: {
              ticketId: ticket.id,
              actorId: authorId,
              actionType: isAdminSender ? 'STATUS_CHANGE' : 'REPLY_RECEIVED',
              details: isAdminSender ? `Support replied via email (${senderEmail})` : `Customer replied via email (${senderEmail})`
            }
          });
        });

        console.log(`Successfully threaded incoming email from ${senderEmail} to Ticket #${matchedTicketNumber}`);
        return NextResponse.json({ success: true, threaded: true });
      } else {
        console.warn(`Webhook: Pattern matched ticket ${matchedTicketNumber} but ticket was not found in database.`);
      }
    }

    // 2. No matching ticket found or subject has no pattern -> Spawn a new support ticket
    // Find or create customer user
    let userRecord = await prisma.user.findUnique({ where: { email: senderEmail } });
    if (!userRecord) {
      const generatedId = `usr_${Math.random().toString(36).substr(2, 9)}`;
      userRecord = await prisma.user.create({
        data: {
          id: generatedId,
          email: senderEmail,
          firstName: fromRaw.split('<')[0].split(' ')[0].trim() || 'Email',
          lastName: fromRaw.split('<')[0].split(' ').slice(1).join(' ').trim() || 'Customer',
          password: 'EMAIL_AUTO_GENERATED',
          role: 'CUSTOMER'
        }
      });
      console.log(`Auto-created Customer user profile for ${senderEmail}`);
    }

    const ticketNumber = `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create the ticket and first message in a transaction
    const newTicket = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.create({
        data: {
          ticketNumber,
          userId: userRecord!.id,
          subject: subject || 'Support Request via Email',
          description: cleanBody,
          status: 'OPEN',
          category: 'GENERAL',
          priority: 'MEDIUM',
          readByAdmin: false, // Lights up for admin review
          ticketMessages: {
            create: {
              authorId: userRecord!.id,
              message: cleanBody,
              isAdmin: false
            }
          }
        }
      });

      await tx.ticketAuditLog.create({
        data: {
          ticketId: t.id,
          actorId: userRecord!.id,
          actionType: 'TICKET_CREATED',
          details: `Ticket created via email ingestion from ${senderEmail}`
        }
      });

      return t;
    });

    console.log(`Successfully created Ticket #${ticketNumber} from inbound email ${senderEmail}`);

    // Send confirmation auto-responder email back to customer
    if (process.env.RESEND_API_KEY) {
      try {
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'James & Sons Support <support@jamesandsons.in>';
        await resend.emails.send({
          from: fromAddress,
          to: [senderEmail],
          subject: `[${ticketNumber}] Ticket Received: ${subject}`,
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
              <h2 style="font-weight: 300; color: #C4A05A; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                Support Request Received
              </h2>
              <p>Dear ${userRecord.firstName},</p>
              <p>Thank you for contacting James & Sons Support. We have successfully registered your request and assigned ticket number <strong>${ticketNumber}</strong>.</p>
              
              <p><strong>Your Message:</strong></p>
              <div style="background: #fdfaf4; padding: 20px; border-left: 3px solid #C4A05A; margin: 20px 0; white-space: pre-wrap; font-size: 14px; font-family: inherit;">
                ${cleanBody}
              </div>
              
              <p>A member of our concierge support team will review your query and reply within 24 business hours.</p>
              
              <p>To add details or reply to this ticket, simply respond directly to this email without changing the subject line.</p>
              
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
              <p style="font-size: 11px; color: #bbb; text-align: center;">
                James & Sons &middot; Excellence in every detail &middot; support@jamesandsons.in
              </p>
            </div>
          `
        });
        console.log(`Dispatched auto-responder email confirmation to ${senderEmail}`);
      } catch (autoResponderErr) {
        console.error('Failed to send auto-responder email confirmation:', autoResponderErr);
      }
    }

    return NextResponse.json({ success: true, created: true, ticketNumber });
  } catch (error: any) {
    console.error('Failed to process inbound Resend email webhook:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
