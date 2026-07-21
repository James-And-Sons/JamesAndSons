import Razorpay from 'razorpay';
import crypto from 'crypto';
import { IPaymentProvider, CreateOrderParams, OrderResult, VerifySignatureParams } from '@james-andsons/interfaces';

let razorpayInstance: any = null;

export interface IRazorpayConfig {
  keyId?: string;
  keySecret?: string;
}

export function getRazorpayInstance(config: IRazorpayConfig = {}) {
  if (razorpayInstance) return razorpayInstance;

  const key_id = config.keyId || process.env.RAZORPAY_KEY_ID;
  const key_secret = config.keySecret || process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys are missing.');
  }

  razorpayInstance = new Razorpay({ key_id, key_secret });
  return razorpayInstance;
}

/**
 * Creates a new Razorpay Order
 */
export async function createRazorpayOrder(amount: number, receipt: string, config: IRazorpayConfig = {}) {
  try {
    const rzp = getRazorpayInstance(config);
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
export async function createPaymentLink(
  amount: number,
  orderNumber: string,
  customer: { name: string; email: string; phone: string },
  brandName?: string,
  config: IRazorpayConfig = {}
) {
  try {
    const rzp = getRazorpayInstance(config);
    const link = await rzp.paymentLink.create({
      amount: Math.round(amount),
      currency: 'INR',
      accept_partial: false,
      description: `Payment for Order ${orderNumber} ${brandName ? '- ' + brandName : ''}`,
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
 * Initiates a refund for a Razorpay payment.
 */
export async function refundRazorpayPayment(
  paymentId: string,
  amount?: number,
  reason?: string,
  config: IRazorpayConfig = {}
) {
  try {
    const rzp = getRazorpayInstance(config);
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

/**
 * Implement IPaymentProvider interface for white-label, swappable configuration
 */
export class RazorpayProvider implements IPaymentProvider {
  private rzp: any;
  private keyId: string;
  private keySecret: string;

  constructor(config: IRazorpayConfig = {}) {
    this.keyId = config.keyId || process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = config.keySecret || process.env.RAZORPAY_KEY_SECRET || '';
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay credentials are missing.');
    }
    this.rzp = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const order = await this.rzp.orders.create({
      amount: Math.round(params.amount),
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes,
      payment_capture: true,
    });
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      rawResponse: order
    };
  }

  verifySignature(params: VerifySignatureParams): boolean {
    const secret = params.webhookSecret || this.keySecret;
    if (!secret) return false;
    const body = params.orderId + '|' + params.paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');
    return expectedSignature === params.signature;
  }
}
