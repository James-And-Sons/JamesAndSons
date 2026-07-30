/**
 * Amazon SP-API — Order Fulfillment
 *
 * 1. Routes an Amazon-sourced JNS order through the standard fulfillment
 *    pipeline (Shiprocket shipment + AWB + invoice email + Zoho).
 * 2. After AWB is assigned, pushes a shipment-confirmation Feed to Amazon
 *    so the order shows as "Shipped" in Seller Central.
 * 3. Handles Amazon-initiated cancellations.
 *
 * SP-API references:
 *   POST /feeds/2021-06-30/feeds           — submit a feed document
 *   GET  /feeds/2021-06-30/feeds/{feedId}  — poll feed status
 */
import { prisma } from '../prisma';
import { getLwaAccessToken, getAmazonConfig, signedSpApiFetch } from '../amazon-sp-api';
import { fulfillPaidOrder } from '../fulfillment';

// ---------------------------------------------------------------------------
// fulfillAmazonOrder
// Routes an ingested Amazon order through the standard fulfillment pipeline
// (Shiprocket, email, Zoho), then confirms shipment back to Amazon.
// ---------------------------------------------------------------------------

export async function fulfillAmazonOrder(orderId: string): Promise<void> {
  console.log(`[Amazon Fulfillment] Starting fulfillment for JNS order ${orderId}...`);

  // Run standard fulfillment (Shiprocket AWB + invoice email + Zoho sales order)
  const result = await fulfillPaidOrder({ orderId });

  if (!result.success) {
    console.error(`[Amazon Fulfillment] Standard fulfillment failed for order ${orderId}:`, (result as any).error);
    return;
  }

  if ((result as any).alreadyProcessed) {
    console.log(`[Amazon Fulfillment] Order ${orderId} already processed. Skipping shipment confirm.`);
    return;
  }

  // Re-fetch order to get the tracking number assigned by Shiprocket
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, user: true },
  });

  if (!order || !order.amazonOrderId) {
    console.warn(`[Amazon Fulfillment] Order ${orderId} not found or has no amazonOrderId.`);
    return;
  }

  if (!order.trackingNumber) {
    console.warn(`[Amazon Fulfillment] No tracking number on order ${orderId} — skipping Amazon shipment confirm.`);
    await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentError: (order.fulfillmentError || '') + ' | Amazon shipment NOT confirmed: no tracking number.' },
    });
    return;
  }

  // Push shipment confirmation to Amazon
  await confirmAmazonShipment(order);
}

// ---------------------------------------------------------------------------
// confirmAmazonShipment
// Submits a POST_ORDER_FULFILLMENT_DATA feed to Amazon with AWB tracking info.
// ---------------------------------------------------------------------------

interface OrderForConfirm {
  id: string;
  amazonOrderId: string | null;
  orderNumber: string;
  trackingNumber: string | null;
  items: { quantity: number; product: { sku: string } }[];
}

export async function confirmAmazonShipment(order: OrderForConfirm): Promise<void> {
  if (!order.amazonOrderId || !order.trackingNumber) {
    throw new Error('[Amazon Fulfillment] confirmAmazonShipment called without amazonOrderId or trackingNumber');
  }

  const config      = getAmazonConfig();
  const accessToken = await getLwaAccessToken();

  console.log(`[Amazon Fulfillment] Confirming shipment for Amazon order ${order.amazonOrderId} with AWB ${order.trackingNumber}...`);

  // Step 1: Create a feed document (get upload URL)
  const createDocPath = '/feeds/2021-06-30/documents';
  const createDocRes  = await signedSpApiFetch(createDocPath, accessToken, config, {
    method: 'POST',
    body:   JSON.stringify({ contentType: 'text/xml; charset=UTF-8' }),
  });

  if (!createDocRes.ok) {
    const text = await createDocRes.text();
    throw new Error(`[Amazon Fulfillment] Failed to create feed document: ${createDocRes.status} — ${text}`);
  }

  const { feedDocumentId, url: uploadUrl } = await createDocRes.json();

  // Step 2: Build the XML shipment confirmation feed (UBF format)
  const shipDate = new Date().toISOString().split('.')[0];
  const feedXml  = buildShipmentFeedXml({
    amazonOrderId:  order.amazonOrderId,
    trackingNumber: order.trackingNumber,
    carrierCode:    'Other',              // Shiprocket uses partner carriers
    carrierName:    'Shiprocket',
    shipDate,
    items: order.items.map(i => ({
      sku:      i.product.sku,
      quantity: i.quantity,
    })),
  });

  // Step 3: Upload XML to the pre-signed S3 URL provided by Amazon
  const uploadRes = await fetch(uploadUrl, {
    method:  'PUT',
    headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
    body:    feedXml,
  });

  if (!uploadRes.ok) {
    throw new Error(`[Amazon Fulfillment] Feed document upload failed: ${uploadRes.status}`);
  }

  console.log(`[Amazon Fulfillment] Uploaded shipment XML to Amazon feed document ${feedDocumentId}.`);

  // Step 4: Submit the feed
  const submitPath = '/feeds/2021-06-30/feeds';
  const submitRes  = await signedSpApiFetch(submitPath, accessToken, config, {
    method: 'POST',
    body:   JSON.stringify({
      feedType:        'POST_ORDER_FULFILLMENT_DATA',
      marketplaceIds:  [config.marketplaceId],
      inputFeedDocumentId: feedDocumentId,
    }),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text();
    throw new Error(`[Amazon Fulfillment] Feed submission failed: ${submitRes.status} — ${text}`);
  }

  const { feedId } = await submitRes.json();
  console.log(`[Amazon Fulfillment] ✅ Shipment feed submitted. Feed ID: ${feedId}`);

  // Save feed ID so we can check processing status later
  await prisma.order.update({
    where: { id: order.id },
    data:  { amazonShipmentFeedId: feedId, amazonOrderStatus: 'Shipped' },
  });
}

// ---------------------------------------------------------------------------
// cancelAmazonOrder
// Called when Amazon cancels an order (e.g. buyer-cancelled before shipment).
// Marks the JNS order as CANCELLED.
// ---------------------------------------------------------------------------

export async function cancelAmazonOrder(amazonOrderId: string): Promise<void> {
  console.log(`[Amazon Fulfillment] Processing cancellation for Amazon order ${amazonOrderId}...`);

  const order = await prisma.order.findUnique({ where: { amazonOrderId } });
  if (!order) {
    console.warn(`[Amazon Fulfillment] No JNS order found for Amazon order ${amazonOrderId}.`);
    return;
  }

  if (order.status === 'CANCELLED') {
    console.log(`[Amazon Fulfillment] Order ${order.orderNumber} already cancelled.`);
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status:           'CANCELLED',
      amazonOrderStatus: 'Cancelled',
      fulfillmentError: 'Cancelled by Amazon Marketplace.',
    },
  });

  console.log(`[Amazon Fulfillment] ✅ JNS order ${order.orderNumber} marked CANCELLED.`);
}

// ---------------------------------------------------------------------------
// checkFeedStatus
// Polls the Feed Processing Status for a previously submitted feed.
// Returns the processing status string (e.g. 'DONE', 'IN_PROGRESS', 'FATAL').
// ---------------------------------------------------------------------------

export async function checkFeedStatus(feedId: string): Promise<string> {
  const config      = getAmazonConfig();
  const accessToken = await getLwaAccessToken();

  const res = await signedSpApiFetch(`/feeds/2021-06-30/feeds/${feedId}`, accessToken, config);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Amazon Fulfillment] Feed status check failed: ${res.status} — ${text}`);
  }

  const data = await res.json();
  return data.processingStatus || 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// buildShipmentFeedXml — generates UBF POST_ORDER_FULFILLMENT_DATA XML
// ---------------------------------------------------------------------------

interface ShipmentFeedParams {
  amazonOrderId:  string;
  trackingNumber: string;
  carrierCode:    string;
  carrierName:    string;
  shipDate:       string;  // ISO 8601 without milliseconds
  items: { sku: string; quantity: number }[];
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function buildShipmentFeedXml(params: ShipmentFeedParams): string {
  const itemsXml = params.items
    .map(
      (item) => `
    <Item>
      <AmazonOrderItemCode>${escapeXml(item.sku)}</AmazonOrderItemCode>
      <Quantity>${item.quantity}</Quantity>
    </Item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
  <Header>
    <DocumentVersion>1.01</DocumentVersion>
    <MerchantIdentifier>${process.env.AMAZON_SELLER_ID}</MerchantIdentifier>
  </Header>
  <MessageType>OrderFulfillment</MessageType>
  <Message>
    <MessageID>1</MessageID>
    <OrderFulfillment>
      <AmazonOrderID>${escapeXml(params.amazonOrderId)}</AmazonOrderID>
      <FulfillmentDate>${escapeXml(params.shipDate)}</FulfillmentDate>
      <FulfillmentData>
        <CarrierCode>${escapeXml(params.carrierCode)}</CarrierCode>
        <CarrierName>${escapeXml(params.carrierName)}</CarrierName>
        <ShippingMethod>Standard</ShippingMethod>
        <ShipperTrackingNumber>${escapeXml(params.trackingNumber)}</ShipperTrackingNumber>
      </FulfillmentData>
      ${itemsXml}
    </OrderFulfillment>
  </Message>
</AmazonEnvelope>`;
}

