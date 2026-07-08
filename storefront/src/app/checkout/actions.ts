'use server';

import { prisma } from '@/lib/prisma';
import { sendInvoiceEmail } from '@/lib/email';
import { generateSequentialInvoiceNumber } from '@/lib/invoice';
import { createClient } from '@/utils/supabase/server';
import { UserAddress } from '@prisma/client';
import { calculateShipping } from '@/lib/shiprocket';

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
  warranty?: {
    planSku: string;
    planName: string;
    price: number;
  } | null;
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
  couponCode?: string;      // Applied coupon code
  couponId?: string;        // Resolved coupon ID from validation
  discountAmount?: number;  // Pre-validated discount amount
  affiliateCode?: string;   // From jns_ref cookie
  bookInstallation?: boolean;
  ucSlotDate?: string;
  ucSlotTime?: string;
};

import { createRazorpayOrder, createPaymentLink, refundRazorpayPayment } from '@/lib/razorpay';

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
    const discountAmount = form.discountAmount ?? 0;
    const totalAmount = subtotal + gst + shipping - discountAmount;

    // Validate that all products exist in the database (handles stale carts in localStorage)
    const productIds = cartItems.map(item => item.product.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });
    const dbProductIds = new Set(dbProducts.map(p => p.id));
    const missingProductIds = productIds.filter(id => !dbProductIds.has(id));
    if (missingProductIds.length > 0) {
      throw new Error("Some items in your cart are no longer available. Please clear your cart and try again.");
    }

    // 1. Create order as PENDING
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: 'PENDING',
        totalAmount: Math.max(0, totalAmount),
        taxAmount: gst,
        shippingAmount: shipping,
        discountAmount,
        couponCode: form.couponCode || null,
        affiliateCode: form.affiliateCode || null,
        shippingAddress: `${cleanAddress}, ${form.city.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`,
        shippingPhone: form.phone.trim(),
        shippingCity: form.city.trim(),
        shippingState: form.state.trim(),
        shippingPincode: form.pincode.trim(),
        billingAddress: `${cleanAddress}, ${form.city.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`,
        gstin: form.gstin?.trim() || null,
        companyName: form.companyName?.trim() || null,
        ucInstallationStatus: form.bookInstallation ? 'DRAFT_PENDING' : 'NONE',
        ucInstallationSlot: form.bookInstallation ? `${form.ucSlotDate} ${form.ucSlotTime}` : null,
        items: {
          create: cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.d2cPrice,
            total: (item.product.d2cPrice + (item.warranty?.price || 0)) * item.quantity,
            warrantyPlanSku: item.warranty?.planSku || null,
            warrantyPlanName: item.warranty?.planName || null,
            warrantyPrice: item.warranty?.price || null,
          })),
        },
      },
    });

    // 2. Generate Razorpay Order (on discounted total)
    const rpOrder = await createRazorpayOrder(Math.max(0, totalAmount) * 100, order.id);

    // 3. Link Razorpay Order to Prisma
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rpOrder.id },
    });

    // Save Address to User Profile if it's a new one
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        userId: user.id,
        street: form.address,
        pincode: form.pincode
      }
    });

    if (!existingAddress) {
      // Unset any existing default
      await prisma.userAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });

      await prisma.userAddress.create({
        data: {
          userId: user.id,
          name: 'Home', // Default name
          street: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          phone: form.phone,
          isDefault: true
        }
      });
    }

    // 4. Mark Cart as Recovered
    await prisma.abandonedCart.update({
      where: { email: form.email },
      data: { recovered: true }
    }).catch(() => null); // Ignore if no record exists

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      discountAmount,
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
import { fulfillPaidOrder } from '@/lib/fulfillment';

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

    // Since signature matches, payment is captured. Attempt to fulfill:
    try {
      const fulfillmentResult = await fulfillPaidOrder({
        orderId: internalOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!fulfillmentResult.success) {
        throw new Error(fulfillmentResult.error || 'Fulfillment process failed');
      }
    } catch (fulfillError: any) {
      console.error('[VerifyPayment] Fulfillment failed, initiating automated instant refund:', fulfillError);
      try {
        await refundRazorpayPayment(razorpayPaymentId, undefined, `Fulfillment failed: ${fulfillError.message || 'Unknown Error'}`);
        await prisma.order.update({
          where: { id: internalOrderId },
          data: {
            status: 'CANCELLED',
            fulfillmentError: `Fulfillment failed: ${fulfillError.message || 'Unknown Error'}. Automated instant refund initiated.`,
          }
        });
      } catch (refundError) {
        console.error('[VerifyPayment] CRITICAL: Failed to automatically refund client payment:', refundError);
      }
      throw fulfillError;
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

export async function generatePaymentLinkAction(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) throw new Error('Order not found');

    const link = await createPaymentLink(
      order.totalAmount * 100,
      order.orderNumber,
      {
        name: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phone || ''
      }
    );

    return { success: true, url: link.short_url };
  } catch (error: any) {
    console.error('Payment link generation failed:', error);
    return { success: false, error: error.message };
  }
}

export async function syncAbandonedCartAction(email: string, phone: string, cartItems: any, step: number) {
  try {
    if (!email || email.length < 5) return;

    await prisma.abandonedCart.upsert({
      where: { id: email }, // Using email as ID for simple upserting per user
      update: {
        phone,
        cartData: cartItems,
        step,
        lastSeen: new Date(),
        recovered: false
      },
      create: {
        id: email,
        email,
        phone,
        cartData: cartItems,
        step
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Abandoned cart sync failed:', error);
    return { success: false };
  }
}

// Legacy wrapper — kept for backward compatibility.
// Uses the new Coupon model under the hood.
export async function generateDiscountCode(percentage: number = 5) {
  const code = `JNS${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: 'PERCENTAGE',
      value: percentage,
      usageLimit: 1,
      usageLimitPerUser: 1,
      expiresAt,
      source: 'internal',
    },
  });

  return coupon.code;
}


export async function getUserAddressesAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return [];

  return await prisma.userAddress.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getShippingRateAction(pincode: string, weight: number) {
  if (!pincode || pincode.length < 6) return { success: false, rate: 0 };
  return await calculateShipping(pincode, weight);
}

export async function saveUserAddressAction(address: Omit<UserAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { success: false };

  await prisma.userAddress.create({
    data: {
      ...address,
      userId: user.id
    }
  });
  return { success: true };
}
