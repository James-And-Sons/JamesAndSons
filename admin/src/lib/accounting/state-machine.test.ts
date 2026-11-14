import { describe, it, expect } from "vitest";
import {
  OrderState,
  validateStateTransition,
  canCancelEInvoiceIRN,
  validateSection34CreditNoteEligibility,
} from "./state-machine";

describe("GST Accounting State Machine Unit Tests", () => {
  describe("State Transition Guards", () => {
    it("should allow valid legal state transitions", () => {
      expect(validateStateTransition(OrderState.PENDING, OrderState.PAID)).toBe(
        true,
      );
      expect(
        validateStateTransition(OrderState.PAID, OrderState.INVOICED),
      ).toBe(true);
      expect(
        validateStateTransition(OrderState.INVOICED, OrderState.PROCESSING),
      ).toBe(true);
      expect(
        validateStateTransition(OrderState.PROCESSING, OrderState.SHIPPED),
      ).toBe(true);
      expect(
        validateStateTransition(OrderState.SHIPPED, OrderState.DELIVERED),
      ).toBe(true);
      expect(
        validateStateTransition(OrderState.SHIPPED, OrderState.RTO_INITIATED),
      ).toBe(true);
      expect(
        validateStateTransition(
          OrderState.DELIVERED,
          OrderState.RETURN_REQUESTED,
        ),
      ).toBe(true);
      expect(
        validateStateTransition(
          OrderState.RETURNED,
          OrderState.CREDIT_NOTE_ISSUED,
        ),
      ).toBe(true);
    });

    it("should block illegal state jumps that violate GST rules", () => {
      // Dispatched / Delivered orders cannot jump directly to CANCELLED without RTO or Return flow
      expect(
        validateStateTransition(OrderState.DELIVERED, OrderState.CANCELLED),
      ).toBe(false);
      expect(
        validateStateTransition(OrderState.SHIPPED, OrderState.RETURNED),
      ).toBe(false);
      expect(
        validateStateTransition(OrderState.CREDIT_NOTE_ISSUED, OrderState.PAID),
      ).toBe(false);
      expect(
        validateStateTransition(
          OrderState.CANCELLED_PRE_INVOICE,
          OrderState.DELIVERED,
        ),
      ).toBe(false);
    });

    it("should allow identity transitions (same state to same state)", () => {
      expect(validateStateTransition(OrderState.PAID, OrderState.PAID)).toBe(
        true,
      );
      expect(
        validateStateTransition(OrderState.SHIPPED, OrderState.SHIPPED),
      ).toBe(true);
    });
  });

  describe("E-Invoicing 24-Hour Cancellation Window", () => {
    it("should return true if IRN was generated within 24 hours", () => {
      const recentTime = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      expect(canCancelEInvoiceIRN(recentTime)).toBe(true);
    });

    it("should return false if IRN was generated more than 24 hours ago", () => {
      const oldTime = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30 hours ago
      expect(canCancelEInvoiceIRN(oldTime)).toBe(false);
    });

    it("should return false if irnGeneratedAt is null or undefined", () => {
      expect(canCancelEInvoiceIRN(null)).toBe(false);
      expect(canCancelEInvoiceIRN(undefined)).toBe(false);
    });
  });

  describe("Section 34 Statutory Credit Note Cutoff Validator", () => {
    it("should approve GST Tax Credit Note if reference date is before November 30th of subsequent FY", () => {
      // Invoice issued May 10, 2025 (FY 2025-26)
      const invoiceDate = new Date("2025-05-10");
      // Current reference date: July 15, 2026 (Before cutoff Nov 30, 2026)
      const currentRefDate = new Date("2026-07-15");

      const result = validateSection34CreditNoteEligibility(
        invoiceDate,
        currentRefDate,
      );
      expect(result.isGstCreditNoteAllowed).toBe(true);
      expect(result.reason).toContain(
        "Invoice within Section 34 filing window",
      );
    });

    it("should reject GST Tax Credit Note and enforce Commercial Non-GST Credit Note if past November 30th of subsequent FY", () => {
      // Invoice issued May 10, 2025 (FY 2025-26)
      const invoiceDate = new Date("2025-05-10");
      // Current reference date: December 15, 2026 (AFTER cutoff Nov 30, 2026)
      const currentRefDate = new Date("2026-12-15");

      const result = validateSection34CreditNoteEligibility(
        invoiceDate,
        currentRefDate,
      );
      expect(result.isGstCreditNoteAllowed).toBe(false);
      expect(result.reason).toContain("EXPIRED: Section 34 deadline");
    });

    it("should correctly handle January invoice FY calculation (FY runs April to March)", () => {
      // Invoice issued Jan 15, 2025 (FY 2024-25) -> Cutoff is Nov 30, 2025
      const invoiceDate = new Date("2025-01-15");
      const refDateWithin = new Date("2025-10-01");
      const refDateExpired = new Date("2025-12-05");

      expect(
        validateSection34CreditNoteEligibility(invoiceDate, refDateWithin)
          .isGstCreditNoteAllowed,
      ).toBe(true);
      expect(
        validateSection34CreditNoteEligibility(invoiceDate, refDateExpired)
          .isGstCreditNoteAllowed,
      ).toBe(false);
    });
  });
});
