import { describe, it, expect, beforeAll } from "vitest";
import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
dotenv.config({ path: envPath });
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@localhost:5432/postgres";
}

describe("Accounts & CA Financial System", () => {
  let calculateGstBreakdown: any;
  let TARGET_ACCOUNTS_EMAIL: string;

  beforeAll(async () => {
    const mod = await import("./accounting-exporter");
    calculateGstBreakdown = mod.calculateGstBreakdown;
    TARGET_ACCOUNTS_EMAIL = mod.TARGET_ACCOUNTS_EMAIL;
  });

  describe("calculateGstBreakdown()", () => {
    it("should calculate CGST and SGST for intra-state sales (Uttar Pradesh)", () => {
      const taxAmount = 1800;
      const res = calculateGstBreakdown(taxAmount, "Uttar Pradesh");
      expect(res.isIntraState).toBe(true);
      expect(res.cgst).toBe(900);
      expect(res.sgst).toBe(900);
      expect(res.igst).toBe(0);
    });

    it("should calculate CGST and SGST when shippingState is state code 09", () => {
      const taxAmount = 500;
      const res = calculateGstBreakdown(taxAmount, "09");
      expect(res.isIntraState).toBe(true);
      expect(res.cgst).toBe(250);
      expect(res.sgst).toBe(250);
      expect(res.igst).toBe(0);
    });

    it("should calculate IGST for inter-state sales (e.g. Maharashtra / Delhi)", () => {
      const taxAmount = 3600;
      const res = calculateGstBreakdown(taxAmount, "Maharashtra");
      expect(res.isIntraState).toBe(false);
      expect(res.cgst).toBe(0);
      expect(res.sgst).toBe(0);
      expect(res.igst).toBe(3600);
    });

    it("should default to intra-state if shipping state is missing", () => {
      const taxAmount = 1000;
      const res = calculateGstBreakdown(taxAmount, null);
      expect(res.isIntraState).toBe(true);
      expect(res.cgst).toBe(500);
      expect(res.sgst).toBe(500);
    });
  });

  describe("Automated GST Filing Configuration", () => {
    it("should target accounts@jamesandsons.in for automated zero-human-intervention emails", () => {
      expect(TARGET_ACCOUNTS_EMAIL).toBe("accounts@jamesandsons.in");
    });
  });
});
