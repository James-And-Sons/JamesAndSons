import Razorpay from 'razorpay';

let razorpayInstance: any = null;

function getRazorpayInstance() {
  if (razorpayInstance) return razorpayInstance;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys are missing in environment variables.');
  }

  razorpayInstance = new Razorpay({ key_id, key_secret });
  return razorpayInstance;
}

/**
 * Creates a new Razorpay Order
 */
export async function createRazorpayOrder(amount: number, receipt: string) {
  try {
    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount: Math.round(amount),
      currency: 'INR',
      receipt: receipt,
      payment_capture: true,
    });
    return order;
  } catch (error) {
    console.error('Razorpay Order Creation Failed:', error);
    throw error;
  }
}

/**
 * Creates a Razorpay Payment Link
 */
export async function createPaymentLink(amount: number, orderNumber: string, customer: { name: string, email: string, phone: string }) {
  try {
    const rzp = getRazorpayInstance();
    const link = await rzp.paymentLink.create({
      amount: Math.round(amount),
      currency: 'INR',
      accept_partial: false,
      description: `Payment for Order ${orderNumber} - James & Sons`,
      customer: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone
      },
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      notes: {
        order_number: orderNumber
      }
    });
    return link;
  } catch (error) {
    console.error('Razorpay Payment Link Creation Failed:', error);
    throw error;
  }
}

/**
 * Initiates a full or partial refund for a Razorpay payment.
 */
export async function refundRazorpayPayment(paymentId: string, amount?: number, reason?: string) {
  try {
    const rzp = getRazorpayInstance();
    const params: any = {
      notes: {
        reason: reason || 'Order fulfillment failed, automated instant refund'
      }
    };
    if (amount !== undefined) {
      params.amount = Math.round(amount);
    }
    console.log(`[Razorpay] Initiating refund for payment ID: ${paymentId}, amount: ${amount || 'FULL'}`);
    const refund = await rzp.payments.refund(paymentId, params);
    console.log(`[Razorpay] Refund initiated successfully: ${refund.id}`);
    return refund;
  } catch (error) {
    console.error('Razorpay Refund Failed:', error);
    throw error;
  }
}

