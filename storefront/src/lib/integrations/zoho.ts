import { prisma } from '../prisma';

async function getZohoAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Zoho credentials in storefront environment variables.');
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token'
  });

  const res = await fetch(`https://${accountsDomain}/oauth/v2/token`, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Failed to refresh Zoho token: ${errorData.error || res.statusText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function syncOrderToZoho(orderId: string) {
  console.log(`[Zoho Integration] Starting order sync for order ID: ${orderId}`);
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: true
    }
  });

  if (!order) throw new Error(`Order ${orderId} not found in database.`);

  const accessToken = await getZohoAccessToken();
  const orgId = process.env.ZOHO_INVENTORY_ORG_ID || process.env.NEXT_PUBLIC_ZOHO_DESK_ORG_ID || '';
  
  // Build correct base URL for Zoho Inventory API (supporting new zohoapis domains)
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
  const isIndia = accountsDomain.endsWith('.in');
  const apiBase = isIndia 
    ? 'https://www.zohoapis.in/inventory/v1' 
    : 'https://www.zohoapis.com/inventory/v1';

  // Parse addresses
  const billingParts = order.billingAddress.split(', ');
  const shippingParts = order.shippingAddress.split(', ');

  const billingZip = billingParts.pop()?.split(' - ')[1] || order.shippingPincode || '';
  const billingState = billingParts.pop() || order.shippingState || '';
  const billingCity = billingParts.pop() || order.shippingCity || '';
  const billingAddr = billingParts.join(', ') || order.billingAddress;

  const shippingZip = shippingParts.pop()?.split(' - ')[1] || order.shippingPincode || '';
  const shippingState = shippingParts.pop() || order.shippingState || '';
  const shippingCity = shippingParts.pop() || order.shippingCity || '';
  const shippingAddr = shippingParts.join(', ') || order.shippingAddress;

  const customerId = order.b2bFlag 
    ? (process.env.ZOHO_B2B_CONTACT_ID || '3919589000000083001')
    : (process.env.ZOHO_RETAIL_CONTACT_ID || '3919589000000083001');

  // Build the payload
  const salesOrderPayload = {
    customer_id: customerId,
    salesorder_number: order.orderNumber,
    date: new Date(order.createdAt).toISOString().split('T')[0],
    shipment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    
    custom_fields: [
      { label: "Channel Origin", value: "Storefront Web" },
      { label: "B2B flag", value: String(order.b2bFlag) },
      { label: "GSTIN", value: order.gstin || "" }
    ],

    line_items: order.items.map(item => ({
      sku: item.product.sku,
      name: item.product.name,
      rate: Number(item.unitPrice),
      quantity: Number(item.quantity),
      tax_percentage: Number(item.product.gstRate || 18.0),
      description: item.warrantyPlanSku ? `Warranty: ${item.warrantyPlanName}` : undefined
    })),

    shipping_charge: Number(order.shippingAmount),
    discount: Number(order.discountAmount),

    billing_address: {
      address: billingAddr,
      city: billingCity,
      state: billingState,
      zip: billingZip,
      country: "India"
    },

    shipping_address: {
      address: shippingAddr,
      city: shippingCity,
      state: shippingState,
      zip: shippingZip,
      country: "India"
    }
  };

  if (order.b2bFlag && order.zohoPricebookId) {
    (salesOrderPayload as any).pricebook_id = order.zohoPricebookId;
  }

  const res = await fetch(`${apiBase}/salesorders`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'X-com-zoho-organizationid': orgId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(salesOrderPayload)
  });

  const resData = await res.json();
  if (!res.ok) {
    throw new Error(`Zoho API error: ${resData.message || res.statusText}`);
  }

  console.log(`[Zoho Integration] Successfully created Zoho Sales Order: ${resData.salesorder.salesorder_id}`);
  
  // Save Zoho Sales Order ID to DB
  await prisma.order.update({
    where: { id: order.id },
    data: { zohoSalesOrderId: resData.salesorder.salesorder_id }
  });

  return resData.salesorder.salesorder_id;
}
