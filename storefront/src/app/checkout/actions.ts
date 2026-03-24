'use server';

import { prisma } from '@/lib/prisma';

type CartItem = {
  product: {
    id: string;
    name: string;
    d2cPrice: number;
    mrp: number;
    gstRate: number;
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
};

export async function createOrder(
  form: CheckoutForm,
  cartItems: CartItem[],
  subtotal: number,
  gst: number,
  shipping: number
) {
  try {
    // Try to find an existing user by email, or use a guest placeholder
    let user = await prisma.user.findUnique({ where: { email: form.email } });

    if (!user) {
      // Create a lightweight guest user record for order tracking
      user = await prisma.user.create({
        data: {
          email: form.email,
          firstName: form.name.split(' ')[0] || form.name,
          lastName: form.name.split(' ').slice(1).join(' ') || '',
          password: 'guest', // Not used for auth, just satisfies the schema
          phone: form.phone,
          role: 'CUSTOMER',
        },
      });
    }

    const shippingAddress = `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`;
    const orderNumber = `JNS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: 'PAID',
        totalAmount: subtotal + gst + shipping,
        taxAmount: gst,
        shippingAmount: shipping,
        shippingAddress,
        billingAddress: shippingAddress,
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

    return { success: true, orderNumber: order.orderNumber, orderId: order.id };
  } catch (error: any) {
    console.error('Order creation error:', error);
    return { success: false, error: error.message };
  }
}
