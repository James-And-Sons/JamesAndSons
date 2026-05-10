'use server';

import { prisma } from '@/lib/prisma';
import { sendInvoiceEmail } from '@/lib/email';

type CartItem = {
  product: {
    id: string;
    name: string;
    d2cPrice: number;
    mrp: number;
    gstRate: number;
    weight?: number | null;
    length?: number | null;
    breadth?: number | null;
    height?: number | null;
  };
  quantity: number;
};

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  companyName?: string;
};

import { createRazorpayOrder } from '@/lib/razorpay';

export async function createOrder(
  form: CheckoutForm,
  cartItems: CartItem[],
  subtotal: number,
  gst: number,
  shipping: number
) {
  try {
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanPhone = form.phone.replace(/\D/g, '').slice(-10);
    const firstName = form.name.trim().split(' ')[0] || '';
    const lastName = form.name.trim().split(' ').slice(1).join(' ') || '.'; // Use a dot as default for Shiprocket compatibility

    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          firstName,
          lastName,
          password: 'guest',
          phone: cleanPhone,
          role: 'CUSTOMER',
        },
      });
    }

    const cleanAddress = form.address.trim().replace(/[^\w\s,.-]/g, '');
    const shippingAddress = `${cleanAddress}, ${form.city.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`;
    const orderNumber = `JNS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
    const totalAmount = subtotal + gst + shipping;

    // 1. Create order as PENDING
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: 'PENDING',
        totalAmount,
        taxAmount: gst,
        shippingAmount: shipping,
        shippingAddress: `${cleanAddress}, ${form.city.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`,
        shippingCity: form.city.trim(),
        shippingState: form.state.trim(),
        shippingPincode: form.pincode.trim(),
        billingAddress: `${cleanAddress}, ${form.city.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`,
        gstin: form.gstin?.trim() || null,
        companyName: form.companyName?.trim() || null,
        items: {
          create: cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.d2cPrice,
            total: item.product.d2cPrice * item.quantity,
          })),
        },
      },
    });

    // 2. Generate Razorpay Order
    const rpOrder = await createRazorpayOrder(totalAmount * 100, order.id);

    // 3. Link Razorpay Order to Prisma
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rpOrder.id },
    });

    return { 
      success: true, 
      orderNumber: order.orderNumber, 
      orderId: order.id,
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    };
  } catch (error: any) {
    console.error('CRITICAL: Order creation failed:', error);
    // Return the actual error message to the client for debugging
    return { 
      success: false, 
      error: error.message || 'An internal error occurred during order creation.' 
    };
  }
}

import crypto from 'crypto';

export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  internalOrderId: string
) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      throw new Error('Invalid payment signature');
    }

    await prisma.order.update({
      where: { id: internalOrderId },
      data: {
        status: 'PAID',
        razorpayPaymentId,
        razorpaySignature,
      },
    });

    // === AUTOMATION: Create Shiprocket Shipment immediately ===
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: internalOrderId },
        include: { 
          items: { include: { product: true } },
          user: true
        }
      });

      if (fullOrder) {
        // Trigger Invoice Email
        await sendInvoiceEmail(fullOrder);

        const shiprocketParams = {
          order_id: fullOrder.orderNumber,
          order_date: fullOrder.createdAt.toISOString().split('T')[0],
          pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
          billing_customer_name: fullOrder.user.firstName,
          billing_last_name: fullOrder.user.lastName,
          billing_address: fullOrder.shippingAddress.split(',').slice(0, -2).join(', ') || fullOrder.shippingAddress,
          billing_city: fullOrder.shippingCity || '',
          billing_pincode: fullOrder.shippingPincode || '',
          billing_state: fullOrder.shippingState || '',
          billing_country: "India",
          billing_email: fullOrder.user.email.trim().toLowerCase(),
          billing_phone: fullOrder.user.phone?.replace(/\D/g, '').slice(-10) || '',
          shipping_is_billing: true,
          order_items: fullOrder.items.map(item => ({
            name: item.product.name,
            sku: item.product.sku,
            units: item.quantity,
            selling_price: item.unitPrice,
          })),
          payment_method: "Prepaid",
          sub_total: fullOrder.totalAmount - fullOrder.taxAmount - fullOrder.shippingAmount,
          length: 10, breadth: 10, height: 10, // Default for now
          weight: 0.5,
        };

        console.log('--- Shiprocket Automation Debug ---');
        console.log('Payload:', JSON.stringify(shiprocketParams, null, 2));

        const shipRes = await createShiprocketOrder(shiprocketParams);
        
        console.log('Shiprocket Response:', JSON.stringify(shipRes, null, 2));

        if (shipRes.success) {
          // STEP 2: Automatically assign AWB (Courier)
          const awbRes = await assignAWB(shipRes.shipment_id);
          
          await prisma.order.update({
            where: { id: internalOrderId },
            data: {
              trackingNumber: awbRes.success ? awbRes.awb_code : null,
              awbNumber: shipRes.shipment_id?.toString(),
              fulfillmentError: awbRes.success ? null : `Order created, but AWB failed: ${awbRes.message}`
            }
          });
          
          if (awbRes.success) {
            console.log(`Order pushed and AWB assigned: ${awbRes.awb_code}`);
          }
        } else {
          console.error('Shiprocket Order Sync Failed:', shipRes.message);
          await prisma.order.update({
            where: { id: internalOrderId },
            data: {
              fulfillmentError: typeof shipRes.message === 'object' 
                ? JSON.stringify(shipRes.message) 
                : shipRes.message || 'Unknown Shiprocket Error'
            }
          });
        }
      }
    } catch (automationError) {
      console.error('Shiprocket Automation Error:', automationError);
      // Don't fail the user payment if automation fails
    }

    return { success: true };
  } catch (error: any) {
    console.error('Payment verification failed:', error);
    return { success: false, error: error.message };
  }
}

import { checkPincodeServiceability, getShippingRates, createShiprocketOrder, assignAWB } from '@/lib/shiprocket';

export async function validatePincodeDelivery(pincode: string) {
  try {
    // Default pickup zip or from ENV
    const pickupPincode = process.env.STORE_PICKUP_PINCODE || '110030';
    const result = await checkPincodeServiceability(pickupPincode, pincode, 5.0);
    return result;
  } catch (error: any) {
    console.error('Pincode validation action error:', error);
    return { status: 500, serviceable: false, message: error.message };
  }
}

export async function calculateShippingRateAction(pincode: string, weightKg: number, subtotal: number) {
  try {
    return await getShippingRates(pincode, weightKg, subtotal);
  } catch (error: any) {
    console.error('Shipping rate action error:', error);
    return null;
  }
}
