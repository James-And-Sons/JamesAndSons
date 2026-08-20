import { getRazorpayInstance } from '@james-andsons/razorpay';
export const razorpay = getRazorpayInstance();
export {
  getRazorpayInstance,
  createRazorpayOrder,
  createPaymentLink,
  refundRazorpayPayment,
  RazorpayProvider
} from '@james-andsons/razorpay';
