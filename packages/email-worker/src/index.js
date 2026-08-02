/**
 * James & Sons — Cloudflare Email Worker
 *
 * Receives ALL inbound email for jamesandsons.in (configured as catch-all).
 * Routes ticket reply emails to the admin portal webhook.
 * All other emails are forwarded to the main admin inbox (Zoho).
 *
 * Deploy via: wrangler deploy
 */

export default {
  async email(message, env, ctx) {
    const toAddress = message.to || '';
    const fromAddress = message.from || '';

    // ── Ticket reply detection ──────────────────────────────────────────────
    // Matches: ticket+TKT-XXXXXX@jamesandsons.in
    const isTicketReply = toAddress.toLowerCase().includes('ticket+');

    if (isTicketReply) {
      try {
        // Parse email headers
        const subject = message.headers.get('subject') || '';
        const messageId = message.headers.get('message-id') || '';
        const inReplyTo = message.headers.get('in-reply-to') || '';
        const references = message.headers.get('references') || '';

        // Read email body (text)
        let body = '';
        try {
          // Use the stream reader to get text content
          const reader = message.raw.getReader();
          const chunks = [];
          let done = false;
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
          }
          const fullRaw = new TextDecoder().decode(
            chunks.reduce((a, b) => {
              const merged = new Uint8Array(a.length + b.length);
              merged.set(a, 0);
              merged.set(b, a.length);
              return merged;
            })
          );

          // Extract plain text from raw email (after the headers section)
          const bodyStart = fullRaw.indexOf('\r\n\r\n');
          body = bodyStart !== -1 ? fullRaw.slice(bodyStart + 4) : fullRaw;
          // Remove quoted-printable soft line breaks
          body = body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          );
        } catch (parseErr) {
          console.error('Body parse error:', parseErr);
          body = '(Could not parse email body)';
        }

        // POST to the admin portal inbound webhook
        const webhookUrl = env.ADMIN_WEBHOOK_URL || 'https://admin.jamesandsons.in/api/webhooks/inbound-email';
        const secret = env.WEBHOOK_SECRET || '';

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': secret,
            'x-resend-signature': secret, // also set as resend-style header for compat
          },
          body: JSON.stringify({
            from: fromAddress,
            to: toAddress,
            subject,
            text: body,
            messageId,
            inReplyTo,
            references,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Webhook rejected [${response.status}]:`, errText);
        } else {
          console.log(`Ticket reply from ${fromAddress} routed to webhook successfully`);
        }

        return; // Don't forward to inbox — handled
      } catch (err) {
        console.error('Failed to route ticket reply:', err);
        // Fall through to forward as a safety net
      }
    }

    // ── All other emails → forward to main admin inbox ──────────────────────
    // This preserves your existing distribution list behaviour.
    // Add more addresses below to replicate your Zoho distribution list members.
    const forwardTargets = (env.FORWARD_TARGETS || 'admin@jamesandsons.in').split(',');

    for (const target of forwardTargets) {
      try {
        await message.forward(target.trim());
      } catch (fwdErr) {
        console.error(`Failed to forward to ${target}:`, fwdErr);
      }
    }
  },
};
