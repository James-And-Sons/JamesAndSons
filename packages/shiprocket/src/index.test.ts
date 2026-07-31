import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getShiprocketToken, ShiprocketProvider } from './index';

describe('@james-andsons/shiprocket', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getShiprocketToken()', () => {
    it('should return null when credentials are missing', async () => {
      const originalEmail = process.env.SHIPROCKET_EMAIL;
      const originalPassword = process.env.SHIPROCKET_PASSWORD;
      delete process.env.SHIPROCKET_EMAIL;
      delete process.env.SHIPROCKET_PASSWORD;

      const token = await getShiprocketToken({});
      expect(token).toBeNull();

      process.env.SHIPROCKET_EMAIL = originalEmail;
      process.env.SHIPROCKET_PASSWORD = originalPassword;
    });

    it('should fetch and cache token successfully when valid credentials are provided', async () => {
      const mockToken = 'mock_jwt_shiprocket_token_98765';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: mockToken }),
      } as Response);

      const token = await getShiprocketToken({
        email: 'test@jamesandsons.in',
        password: 'securepassword123',
      });

      expect(token).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://apiv2.shiprocket.in/v1/external/auth/login',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('ShiprocketProvider', () => {
    it('should initialize with provided config credentials', () => {
      const provider = new ShiprocketProvider({
        email: 'test@jamesandsons.in',
        password: 'securepassword123',
      });
      expect(provider).toBeDefined();
    });
  });
});
