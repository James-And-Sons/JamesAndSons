import { describe, it, expect } from "vitest";
import {
  cn,
  formatPrice,
  formatPriceFull,
  formatDate,
  validateGstinFormat,
  calculateGstinChecksum,
} from "./index";

describe("@james-andsons/utils", () => {
  describe("cn()", () => {
    it("should merge class names correctly", () => {
      const result = cn("px-4 py-2", "bg-blue-500", {
        "text-white": true,
        hidden: false,
      });
      expect(result).toBe("px-4 py-2 bg-blue-500 text-white");
    });

    it("should handle Tailwind class conflicts correctly", () => {
      const result = cn("px-2 px-4", "bg-red-500 bg-blue-500");
      expect(result).toBe("px-4 bg-blue-500");
    });
  });

  describe("formatPrice()", () => {
    it("should return ₹0 when null or undefined is passed", () => {
      expect(formatPrice(null)).toBe("₹0");
      expect(formatPrice(undefined)).toBe("₹0");
    });

    it("should format numbers below 100,000 using en-IN locale format", () => {
      expect(formatPrice(500)).toBe("₹500");
      expect(formatPrice(12500)).toBe("₹12,500");
    });

    it("should format numbers >= 100,000 in Lakhs (L)", () => {
      expect(formatPrice(100000)).toBe("₹1L");
      expect(formatPrice(150000)).toBe("₹1.5L");
      expect(formatPrice(200000)).toBe("₹2L");
    });
  });

  describe("formatPriceFull()", () => {
    it("should format full currency values with INR symbol", () => {
      const formatted = formatPriceFull(15000);
      expect(formatted).toMatch(/₹\s?15,000/);
    });
  });

  describe("formatDate()", () => {
    it("should format a valid date string or object to DD MMM YYYY", () => {
      const date = new Date("2026-07-31T00:00:00Z");
      const formatted = formatDate(date);
      expect(formatted).toMatch(/31 Jul 2026|Jul 31, 2026/i);
    });
  });

  describe("Automated GSTIN Verification", () => {
    it("should validate correct Indian GSTIN format and checksum", () => {
      const validGstin = "09AABCJ8243A1ZT";
      const result = validateGstinFormat(validGstin);

      expect(result.isValid).toBe(true);
      expect(result.stateCode).toBe("09");
      expect(result.stateName).toBe("Uttar Pradesh");
      expect(result.pan).toBe("AABCJ8243A");
      expect(result.checksumValid).toBe(true);
    });

    it("should calculate Modulus-36 checksum correctly", () => {
      const gstin14 = "09AABCJ8243A1Z";
      const checksumChar = calculateGstinChecksum(gstin14);
      expect(checksumChar).toBe("T");
    });

    it("should reject GSTIN with invalid length or characters", () => {
      const shortGstin = "09AABCJ8243A1Z";
      const result = validateGstinFormat(shortGstin);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("15 characters");
    });

    it("should reject GSTIN with invalid checksum", () => {
      const invalidChecksumGstin = "09AABCJ8243A1ZY";
      const result = validateGstinFormat(invalidChecksumGstin);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Checksum verification failed");
    });

    it("should reject GSTIN with invalid state code", () => {
      const invalidStateGstin = "00AABCJ8243A1ZT";
      const result = validateGstinFormat(invalidStateGstin);
      expect(result.isValid).toBe(false);
    });
  });
});
