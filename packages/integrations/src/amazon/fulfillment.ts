/**
 * Amazon SP-API — Order Fulfillment & Shipment Confirmation Feeds
 *
 * Pushes shipment confirmation feeds to Amazon Seller Central when orders are fulfilled.
 */

import { prisma } from "@james-andsons/db";
import { getLwaAccessToken, getAmazonConfig, signedSpApiFetch } from "./sp-api";

export interface OrderForConfirm {
  id: string;
  amazonOrderId: string | null;
  orderNumber: string;
  trackingNumber: string | null;
  items: { quantity: number; product: { sku: string } }[];
}

/**
 * Submits a POST_ORDER_FULFILLMENT_DATA feed to Amazon with AWB tracking info.
 */
export async function confirmAmazonShipment(
  order: OrderForConfirm,
): Promise<void> {
  if (!order.amazonOrderId || !order.trackingNumber) {
    throw new Error(
      "[Amazon Fulfillment] confirmAmazonShipment called without amazonOrderId or trackingNumber",
    );
  }

  const config = getAmazonConfig();
  const accessToken = await getLwaAccessToken();

  console.log(
    `[Amazon Fulfillment] Confirming shipment for Amazon order ${order.amazonOrderId} with AWB ${order.trackingNumber}...`,
  );

  const createDocPath = "/feeds/2021-06-30/documents";
  const createDocRes = await signedSpApiFetch(
    createDocPath,
    accessToken,
    config,
    {
      method: "POST",
      extraHeaders: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "text/xml; charset=UTF-8" }),
    },
  );

  if (!createDocRes.ok) {
    const text = await createDocRes.text();
    throw new Error(
      `[Amazon Fulfillment] Failed to create feed document: ${createDocRes.status} — ${text}`,
    );
  }

  const { feedDocumentId, url: uploadUrl } = await createDocRes.json();

  const shipDate = new Date().toISOString().split(".")[0];
  const feedXml = buildShipmentFeedXml({
    amazonOrderId: order.amazonOrderId,
    trackingNumber: order.trackingNumber,
    carrierCode: "Other",
    carrierName: "Shiprocket",
    shipDate,
    items: order.items.map((i) => ({
      sku: i.product.sku,
      quantity: i.quantity,
    })),
  });

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/xml; charset=UTF-8" },
    body: feedXml,
  });

  if (!uploadRes.ok) {
    throw new Error(
      `[Amazon Fulfillment] Feed document upload failed: ${uploadRes.status}`,
    );
  }

  const submitPath = "/feeds/2021-06-30/feeds";
  const submitRes = await signedSpApiFetch(submitPath, accessToken, config, {
    method: "POST",
    extraHeaders: { "Content-Type": "application/json" },
    body: JSON.stringify({
      feedType: "POST_ORDER_FULFILLMENT_DATA",
      marketplaceIds: [config.marketplaceId],
      inputFeedDocumentId: feedDocumentId,
    }),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text();
    throw new Error(
      `[Amazon Fulfillment] Feed submission failed: ${submitRes.status} — ${text}`,
    );
  }

  const { feedId } = await submitRes.json();
  console.log(
    `[Amazon Fulfillment] ✅ Shipment feed submitted. Feed ID: ${feedId}`,
  );

  await prisma.order.update({
    where: { id: order.id },
    data: { amazonShipmentFeedId: feedId, amazonOrderStatus: "Shipped" },
  });
}

export async function cancelAmazonOrder(amazonOrderId: string): Promise<void> {
  console.log(
    `[Amazon Fulfillment] Processing cancellation for Amazon order ${amazonOrderId}...`,
  );

  const order = await prisma.order.findUnique({ where: { amazonOrderId } });
  if (!order) {
    console.warn(
      `[Amazon Fulfillment] No JNS order found for Amazon order ${amazonOrderId}.`,
    );
    return;
  }

  if (order.status === "CANCELLED") {
    console.log(
      `[Amazon Fulfillment] Order ${order.orderNumber} already cancelled.`,
    );
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "CANCELLED",
      amazonOrderStatus: "Cancelled",
      fulfillmentError: "Cancelled by Amazon Marketplace.",
    },
  });

  console.log(
    `[Amazon Fulfillment] ✅ JNS order ${order.orderNumber} marked CANCELLED.`,
  );
}

export async function checkFeedStatus(feedId: string): Promise<string> {
  const config = getAmazonConfig();
  const accessToken = await getLwaAccessToken();

  const res = await signedSpApiFetch(
    `/feeds/2021-06-30/feeds/${feedId}`,
    accessToken,
    config,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `[Amazon Fulfillment] Feed status check failed: ${res.status} — ${text}`,
    );
  }

  const data = await res.json();
  return data.processingStatus || "UNKNOWN";
}

interface ShipmentFeedParams {
  amazonOrderId: string;
  trackingNumber: string;
  carrierCode: string;
  carrierName: string;
  shipDate: string;
  items: { sku: string; quantity: number }[];
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
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
    </Item>`,
    )
    .join("");

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
