import { prisma } from './prisma';
import { sendInvoiceEmail } from './email';
import { generateSequentialInvoiceNumber } from './invoice';
import { createShiprocketOrder, assignAWB } from './shiprocket';

export interface FulfillOrderParams {
  orderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

/**
 * Unifies the payment fulfillment logic for both client-side verification
 * and webhook notification. Ensures operations are idempotent and consistent.
 */
export async function fulfillPaidOrder({
  orderId,
  razorpayPaymentId,
  razorpaySignature,
}: FulfillOrderParams) {
  console.log(`[FulfillPaidOrder] Initializing fulfillment for Order ID: ${orderId}`);

  // 1. Fetch order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: true,
    },
  });

  if (!order) {
    console.error(`[FulfillPaidOrder] Order not found: ${orderId}`);
    return { success: false, error: 'Order not found' };
  }

  // Idempotency check: If already paid or processing, skip re-fulfillment
  if (order.status === 'PAID' || order.status === 'PROCESSING') {
    console.log(`[FulfillPaidOrder] Order ${order.orderNumber} is already marked as ${order.status}. Skipping fulfillment.`);
    return { success: true, alreadyProcessed: true };
  }

  // 2. Generate sequential invoice number if not already present
  const invoiceNumber = order.invoiceNumber || (await generateSequentialInvoiceNumber());

  // 3. Update order payment details & status in DB to PAID
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PAID',
      razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
      razorpaySignature: razorpaySignature || order.razorpaySignature,
      invoiceNumber,
    },
    include: {
      items: { include: { product: true } },
      user: true,
    },
  });

  console.log(`[FulfillPaidOrder] Order ${order.orderNumber} status set to PAID. Invoice: ${invoiceNumber}`);

  // Decrement inventory for each item in the order
  try {
    for (const item of updatedOrder.items) {
      if (item.variantId) {
        console.log(`[FulfillPaidOrder] Decrementing variant ${item.variantId} inventory by ${item.quantity}`);
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });
        // Keeping parent product stock in sync
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });
      } else {
        console.log(`[FulfillPaidOrder] Decrementing product ${item.productId} inventory by ${item.quantity}`);
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });
      }
    }
  } catch (stockError) {
    console.error(`[FulfillPaidOrder] Failed to decrement inventory for order ${updatedOrder.orderNumber}:`, stockError);
  }

  // 4. Send invoice email with PDF attachment
  try {
    await sendInvoiceEmail(updatedOrder);
  } catch (emailError) {
    console.error(`[FulfillPaidOrder] Failed to send invoice email for order ${order.orderNumber}:`, emailError);
  }

  // 5. Automate Shiprocket shipment push & assign AWB (Prepaid)
  let trackingNumber = updatedOrder.trackingNumber;
  let awbNumber = updatedOrder.awbNumber;
  let fulfillmentError = updatedOrder.fulfillmentError;
  let finalStatus = updatedOrder.status;

  try {
    // Parse address: split by comma, extract pin/state/city for Shiprocket
    const parts = updatedOrder.shippingAddress.split(', ');
    const pincodeStr = parts.pop()?.split(' - ')[1] || updatedOrder.shippingPincode || '110030';
    const stateStr = parts.pop() || updatedOrder.shippingState || '';
    const cityStr = parts.pop() || updatedOrder.shippingCity || '';
    const addrStr = parts.join(', ') || updatedOrder.shippingAddress;

    // Weight/dimensions defaults from first item or fallback to shipping box defaults
    const firstProduct = updatedOrder.items[0]?.product;
    const length = firstProduct?.length || 10;
    const breadth = firstProduct?.breadth || 10;
    const height = firstProduct?.height || 10;
    const weight = firstProduct?.weight || 0.5;

    const shiprocketParams = {
      order_id: updatedOrder.orderNumber,
      order_date: updatedOrder.createdAt.toISOString().split('T')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      billing_customer_name: updatedOrder.user.firstName,
      billing_last_name: updatedOrder.user.lastName,
      billing_address: addrStr,
      billing_city: cityStr,
      billing_pincode: pincodeStr,
      billing_state: stateStr,
      billing_country: "India",
      billing_email: updatedOrder.user.email.trim().toLowerCase(),
      billing_phone: (updatedOrder.shippingPhone || updatedOrder.user.phone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999',
      shipping_is_billing: true,
      order_items: updatedOrder.items.map(item => ({
        name: item.product.name,
        sku: item.product.sku,
        units: item.quantity,
        selling_price: item.unitPrice,
      })),
      payment_method: "Prepaid",
      sub_total: updatedOrder.totalAmount - updatedOrder.taxAmount - updatedOrder.shippingAmount,
      length,
      breadth,
      height,
      weight,
    };

    console.log(`[FulfillPaidOrder] Pushing order ${updatedOrder.orderNumber} to Shiprocket...`);
    const shipRes = await createShiprocketOrder(shiprocketParams);

    if (shipRes.success) {
      console.log(`[FulfillPaidOrder] Shiprocket order created successfully. Shipment ID: ${shipRes.shipment_id}`);
      
      // Auto assign AWB (courier)
      const awbRes = await assignAWB(shipRes.shipment_id);

      if (awbRes.success) {
        trackingNumber = awbRes.awb_code;
        awbNumber = shipRes.shipment_id?.toString();
        fulfillmentError = null;
        finalStatus = 'PROCESSING';
        console.log(`[FulfillPaidOrder] AWB Assigned: ${awbRes.awb_code}`);
      } else {
        awbNumber = shipRes.shipment_id?.toString();
        fulfillmentError = `Order created, but AWB failed: ${awbRes.message}`;
        console.warn(`[FulfillPaidOrder] AWB assignment failed: ${awbRes.message}`);
      }
    } else {
      fulfillmentError = typeof shipRes.message === 'object'
        ? JSON.stringify(shipRes.message)
        : shipRes.message || 'Unknown Shiprocket Error';
      console.error(`[FulfillPaidOrder] Shiprocket Order Sync Failed: ${fulfillmentError}`);
    }

    // Save Shiprocket status back to the order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber,
        awbNumber,
        fulfillmentError,
        status: finalStatus,
      },
    });
  } catch (shiprocketError) {
    console.error(`[FulfillPaidOrder] Shiprocket Automation Error for order ${updatedOrder.orderNumber}:`, shiprocketError);
  }

  // 6. Record Promotions, Coupons & Affiliate Conversions
  try {
    if (updatedOrder.couponCode) {
      const { applyCouponToOrder } = await import('@/app/promotions/actions');
      const coupon = await prisma.coupon.findUnique({ where: { code: updatedOrder.couponCode } });
      if (coupon) {
        await applyCouponToOrder(updatedOrder.id, coupon.id, updatedOrder.discountAmount, updatedOrder.userId);
        console.log(`[FulfillPaidOrder] Coupon ${updatedOrder.couponCode} marked as used.`);
      }
    }

    if (updatedOrder.affiliateCode) {
      const { recordAffiliateConversion } = await import('@/app/promotions/actions');
      const orderSubtotal = updatedOrder.totalAmount - updatedOrder.taxAmount - updatedOrder.shippingAmount + updatedOrder.discountAmount;
      await recordAffiliateConversion(updatedOrder.id, updatedOrder.affiliateCode, orderSubtotal);
      console.log(`[FulfillPaidOrder] Affiliate conversion recorded for code: ${updatedOrder.affiliateCode}`);
    }
  } catch (promoError) {
    console.error(`[FulfillPaidOrder] Failed to record promotions for order ${updatedOrder.orderNumber}:`, promoError);
  }

  // Trigger Serverless Integrations (Zoho Sales Order, Onsitego Registration, Urban Company Dispatch)
  // Run asynchronously in background so checkout response is instant and does not block client UI
  try {
    const { runOrderIntegrations } = await import('./integrations/orchestrator');
    runOrderIntegrations(updatedOrder.id).catch(err => {
      console.error(`[FulfillPaidOrder] Integrations run failed for order ${updatedOrder.orderNumber}:`, err);
    });
  } catch (integrationImportError) {
    console.error(`[FulfillPaidOrder] Failed to import integrations orchestrator:`, integrationImportError);
  }

  return { success: true };
}
