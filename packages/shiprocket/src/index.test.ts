import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getShiprocketToken,
  ShiprocketProvider,
  generateLabel,
  generateManifest,
  generateInvoice,
} from "./index";

describe("@james-andsons/shiprocket", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getShiprocketToken()", () => {
    it("should return null when credentials are missing", async () => {
      const originalEmail = process.env.SHIPROCKET_EMAIL;
      const originalPassword = process.env.SHIPROCKET_PASSWORD;
      delete process.env.SHIPROCKET_EMAIL;
      delete process.env.SHIPROCKET_PASSWORD;

      const token = await getShiprocketToken({});
      expect(token).toBeNull();

      process.env.SHIPROCKET_EMAIL = originalEmail;
      process.env.SHIPROCKET_PASSWORD = originalPassword;
    });

    it("should fetch and cache token successfully when valid credentials are provided", async () => {
      const mockToken = "mock_jwt_shiprocket_token_98765";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: mockToken }),
      } as Response);

      const token = await getShiprocketToken({
        email: "test@jamesandsons.in",
        password: "securepassword123",
      });

      expect(token).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  describe("Document Generation", () => {
    const config = {
      email: "test@jamesandsons.in",
      password: "securepassword123",
    };

    it("generateLabel should POST shipment_id to Shiprocket and return label_url", async () => {
      const mockLabelUrl = "https://s3.amazonaws.com/shiprocket/label_123.pdf";

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/auth/login")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ token: "mock_token" }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ label_url: mockLabelUrl }),
        } as Response);
      });

      const url = await generateLabel(12345, config);
      expect(url).toBe(mockLabelUrl);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/courier/generate/label",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ shipment_id: [12345] }),
        }),
      );
    });

    it("generateManifest should POST shipment_id to Shiprocket and return manifest_url", async () => {
      const mockManifestUrl =
        "https://s3.amazonaws.com/shiprocket/manifest_123.pdf";

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/auth/login")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ token: "mock_token" }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ manifest_url: mockManifestUrl }),
        } as Response);
      });

      const url = await generateManifest([12345], config);
      expect(url).toBe(mockManifestUrl);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/manifests/generate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ shipment_id: [12345] }),
        }),
      );
    });

    it("generateInvoice should POST order db ids to Shiprocket and return invoice_url", async () => {
      const mockInvoiceUrl =
        "https://s3.amazonaws.com/shiprocket/invoice_999.pdf";

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/auth/login")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ token: "mock_token" }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ invoice_url: mockInvoiceUrl }),
        } as Response);
      });

      const url = await generateInvoice(999, config);
      expect(url).toBe(mockInvoiceUrl);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/orders/print/invoice",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ ids: [999] }),
        }),
      );
    });
  });

  describe("ShiprocketProvider", () => {
    it("should initialize with provided config credentials", () => {
      const provider = new ShiprocketProvider({
        email: "test@jamesandsons.in",
        password: "securepassword123",
      });
      expect(provider).toBeDefined();
    });
  });
});
