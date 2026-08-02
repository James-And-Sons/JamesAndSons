import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { RazorpayProvider, getRazorpayInstance } from './index';

describe('@james-andsons/razorpay', () => {
  const mockKeyId = 'rzp_test_mockKeyId123';
  const mockKeySecret = 'mockKeySecret456789';

  describe('getRazorpayInstance()', () => {
    it('should throw an error if keyId or keySecret is missing', () => {
      const originalKeyId = process.env.RAZORPAY_KEY_ID;
      const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      expect(() => getRazorpayInstance({})).toThrow('Razorpay keys are missing.');

      process.env.RAZORPAY_KEY_ID = originalKeyId;
      process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    });

    it('should return a Razorpay instance when config is provided', () => {
      const instance = getRazorpayInstance({ keyId: mockKeyId, keySecret: mockKeySecret });
      expect(instance).toBeDefined();
    });
  });

  describe('RazorpayProvider.verifySignature()', () => {
    it('should correctly verify valid payment signature HMAC SHA256', () => {
      const provider = new RazorpayProvider({ keyId: mockKeyId, keySecret: mockKeySecret });
      const orderId = 'order_MOCK123456';
      const paymentId = 'pay_MOCK789012';
      
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', mockKeySecret)
        .update(payload)
        .digest('hex');

      const isValid = provider.verifySignature({
        orderId,
        paymentId,
        signature: validSignature,
      });

      expect(isValid).toBe(true);
    });

    it('should reject invalid payment signatures', () => {
      const provider = new RazorpayProvider({ keyId: mockKeyId, keySecret: mockKeySecret });
      const isValid = provider.verifySignature({
        orderId: 'order_MOCK123456',
        paymentId: 'pay_MOCK789012',
        signature: 'invalid_forged_signature_hex_string',
      });

      expect(isValid).toBe(false);
    });
  });
});
