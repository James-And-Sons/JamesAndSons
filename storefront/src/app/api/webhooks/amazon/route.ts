/**
 * Amazon SP-API Notifications Webhook - AWS SNS Receiver
 *
 * This route receives webhook notifications pushed from Amazon via AWS SNS
 * (Simple Notification Service). It supports two types of requests:
 *
 *   1. SubscriptionConfirmation:
 *      Amazon registers the hook by sending a confirmation request.
 *      We confirm the subscription by fetching the `SubscribeURL`.
 *
 *   2. Notification:
 *      Order update events (e.g. ORDER_CHANGE). We parse the Amazon Order ID
 *      and trigger ingestion immediately.
 *
 * POST /api/webhooks/amazon
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60; // Max timeout for functions

export async function POST(request: Request) {
  console.log('[Amazon Webhook] Received webhook call.');
  
  try {
    const rawBody = await request.text();
    let body: any;
    
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('[Amazon Webhook] Received invalid JSON body.');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const messageType = request.headers.get('x-amz-sns-message-type') || body.Type;
    console.log(`[Amazon Webhook] Message Type: ${messageType}`);

    // ── 1. Handle AWS SNS Subscription Confirmation ─────────────────────────
    if (messageType === 'SubscriptionConfirmation') {
      const subscribeUrl = body.SubscribeURL;
      if (!subscribeUrl) {
        console.error('[Amazon Webhook] Missing SubscribeURL in SubscriptionConfirmation request.');
        return NextResponse.json({ error: 'Missing SubscribeURL' }, { status: 400 });
      }

      console.log(`[Amazon Webhook] Fetching SubscribeURL to confirm webhook: ${subscribeUrl}`);
      const confirmRes = await fetch(subscribeUrl);
      
      if (confirmRes.ok) {
        console.log('[Amazon Webhook] ✅ SNS Webhook Subscription confirmed successfully!');
        return new Response('Subscription Confirmed', { status: 200 });
      } else {
        const confirmErr = await confirmRes.text();
        console.error(`[Amazon Webhook] Failed to confirm subscription: ${confirmRes.status} — ${confirmErr}`);
        return NextResponse.json({ error: 'Subscription confirmation fetch failed' }, { status: 500 });
      }
    }

    // ── 2. Handle Real-time SP-API Event Notifications ───────────────────────
    if (messageType === 'Notification') {
      const innerMessageStr = body.Message;
      if (!innerMessageStr) {
        console.error('[Amazon Webhook] Notification request missing Message body.');
        return NextResponse.json({ error: 'Missing Message body' }, { status: 400 });
      }

      let eventPayload: any;
      try {
        eventPayload = JSON.parse(innerMessageStr);
      } catch {
        console.error('[Amazon Webhook] Notification Message is not valid JSON:', innerMessageStr);
        return NextResponse.json({ error: 'Message payload is not JSON' }, { status: 400 });
      }

      const notificationType = eventPayload.notificationType || eventPayload.NotificationType;
      console.log(`[Amazon Webhook] Processing notification: ${notificationType}`);

      if (notificationType === 'ORDER_CHANGE') {
        const orderChange = eventPayload.payload?.orderChangeNotification || eventPayload.Payload?.OrderChangeNotification;
        const amazonOrderId = orderChange?.amazonOrderId || orderChange?.AmazonOrderId;
        
        if (!amazonOrderId) {
          console.warn('[Amazon Webhook] ORDER_CHANGE event is missing amazonOrderId.');
          return NextResponse.json({ error: 'Missing amazonOrderId' }, { status: 400 });
        }

        console.log(`[Amazon Webhook] Real-time ORDER_CHANGE event received for order: ${amazonOrderId}`);

        // Ingest the order asynchronously in the background so webhook responds instantly
        const { processNewAmazonOrders } = await import('@/lib/integrations/amazon-orders');
        
        // Fetch specific order details (using minutesLookback fallback or SP-API direct order fetch)
        // Since we got the order ID directly, we trigger a fast cron sync run with a targeted lookback or
        // a standard order fetch.
        // We will call the standard process pipeline for safety, but lookback 60 minutes.
        processNewAmazonOrders(60).catch(err => {
          console.error(`[Amazon Webhook] Background ingestion failed for Amazon order ${amazonOrderId}:`, err);
        });

        return NextResponse.json({ status: 'queued', amazonOrderId });
      }

      // Handle order cancellation updates (Unshipped -> Cancelled)
      if (notificationType === 'MFN_ORDER_STATUS_CHANGE') {
        const statusChange = eventPayload.payload?.mfnOrderStatusChangeNotification || eventPayload.Payload?.MfnOrderStatusChangeNotification;
        const amazonOrderId = statusChange?.amazonOrderId || statusChange?.AmazonOrderId;
        const newStatus = statusChange?.orderStatus || statusChange?.OrderStatus;

        if (amazonOrderId && newStatus === 'Cancelled') {
          const { cancelAmazonOrder } = await import('@/lib/integrations/amazon-fulfillment');
          cancelAmazonOrder(amazonOrderId).catch(err => {
            console.error(`[Amazon Webhook] Background cancel order failed for Amazon order ${amazonOrderId}:`, err);
          });
        }
      }

      return NextResponse.json({ status: 'processed', notificationType });
    }

    console.warn(`[Amazon Webhook] Unhandled message type: ${messageType}`);
    return NextResponse.json({ status: 'ignored' });

  } catch (error: any) {
    console.error('[Amazon Webhook] Webhook error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
