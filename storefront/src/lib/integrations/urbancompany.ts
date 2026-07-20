import { prisma } from '../prisma';

export async function createUcDraftBooking(orderId: string) {
  console.log(`[Urban Company] Checking installation requirements for order ID: ${orderId}`);
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: true
    }
  });

  if (!order || order.ucInstallationStatus !== 'DRAFT_PENDING' || !order.ucInstallationSlot) {
    console.log(`[Urban Company] Installation not requested or already processed for order.`);
    return;
  }

  // Find mapped UC services for order items
  const skus = order.items.map(item => item.product.sku);
  const mappings = await prisma.ucServiceMapping.findMany({
    where: { sku: { in: skus } }
  });

  if (mappings.length === 0) {
    console.log(`[Urban Company] No items require installation in order ${order.orderNumber}.`);
    return;
  }

  const endpoint = process.env.URBANCOMPANY_API_ENDPOINT || 'https://api.urbancompany.com/b2b/enterprise/jobs';
  const apiKey = process.env.URBANCOMPANY_API_KEY || 'uc_mock_key';

  console.log(`[Urban Company] Creating draft job booking for ${mappings.length} items...`);

  try {
    const payload = {
      order_number: order.orderNumber,
      customer: {
        name: order.user?.firstName ? `${order.user.firstName} ${order.user.lastName}` : 'Guest Customer',
        phone: order.shippingPhone || '',
        email: order.user?.email || ''
      },
      address: order.shippingAddress,
      pincode: order.shippingPincode,
      requested_slot: order.ucInstallationSlot, // format: "YYYY-MM-DD HH:MM AM/PM - HH:MM AM/PM"
      services: mappings.map(m => ({
        service_id: m.ucServiceId,
        technician_count: m.technicianCount
      })),
      status: 'DRAFT_PENDING'
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Urban Company API error: ${res.statusText}`);
    }

    const resData = await res.json().catch(() => ({}));
    const ticketId = resData.job_id || `uc-job-mock-${order.id}`;

    console.log(`[Urban Company] Draft booking ticket created: ${ticketId}`);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        ucTicketId: ticketId,
        ucInstallationStatus: 'DRAFT_BOOKED'
      }
    });

  } catch (err) {
    console.error(`[Urban Company] Failed to create draft booking:`, err);
  }
}
