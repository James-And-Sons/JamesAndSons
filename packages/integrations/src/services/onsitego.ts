/**
 * Onsitego Protection & Warranty Plan Integration
 */

import { prisma } from "@james-andsons/db";

export async function registerOnsitegoWarranty(orderId: string): Promise<void> {
  console.log(
    `[Onsitego Integration] Checking warranties for order ID: ${orderId}`,
  );

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: true,
    },
  });

  if (!order) return;

  const itemsWithWarranty = order.items.filter((item) => item.warrantyPlanSku);

  if (itemsWithWarranty.length === 0) {
    console.log(
      `[Onsitego Integration] No warranties to register for order ${order.orderNumber}.`,
    );
    return;
  }

  const apiKey = process.env.ONSITEGO_API_KEY || "onsitego_mock_key";
  const endpoint =
    process.env.ONSITEGO_API_ENDPOINT ||
    "https://api.onsitego.com/v1/salespro/register-plan";

  for (const item of itemsWithWarranty) {
    console.log(
      `[Onsitego Integration] Registering warranty plan ${item.warrantyPlanSku} for item ${item.product.sku}...`,
    );

    try {
      const payload = {
        customer: {
          name: order.shippingPhone
            ? order.billingAddress.split(", ")[0]
            : `${order.user.firstName} ${order.user.lastName}`,
          email: order.user.email,
          phone: order.shippingPhone || order.user.phone || "",
        },
        product: {
          sku: item.product.sku,
          name: item.product.name,
          invoice_price: item.unitPrice,
          purchase_date: order.createdAt.toISOString().split("T")[0],
        },
        warranty: {
          plan_sku: item.warrantyPlanSku,
          plan_name: item.warrantyPlanName,
          price: item.warrantyPrice,
        },
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Onsitego API status: ${res.statusText}`);
      }

      const resData = await res.json().catch(() => ({}));
      const certificateUrl =
        resData.certificate_url ||
        `https://onsitego.com/certificates/mock-${item.id}`;

      console.log(
        `[Onsitego Integration] Registered successfully. Certificate: ${certificateUrl}`,
      );

      await prisma.order.update({
        where: { id: order.id },
        data: { onsitegoCertificateUrl: certificateUrl },
      });
    } catch (err) {
      console.error(
        `[Onsitego Integration] Failed to register warranty for item ${item.product.sku}:`,
        err,
      );
    }
  }
}
