import { prisma } from "@james-andsons/db";

export enum OrderState {
  PENDING = "PENDING",
  PAID = "PAID",
  INVOICED = "INVOICED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
  CANCELLED_PRE_INVOICE = "CANCELLED_PRE_INVOICE",
  CANCELLED_POST_INVOICE = "CANCELLED_POST_INVOICE",
  RTO_INITIATED = "RTO_INITIATED",
  RTO_INSPECTED = "RTO_INSPECTED",
  RTO_COMPLETED = "RTO_COMPLETED",
  RETURN_REQUESTED = "RETURN_REQUESTED",
  RETURN_INSPECTED = "RETURN_INSPECTED",
  CREDIT_NOTE_ISSUED = "CREDIT_NOTE_ISSUED",
}

// State Transition Matrix
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [OrderState.PENDING]: [
    OrderState.PAID,
    OrderState.CANCELLED,
    OrderState.CANCELLED_PRE_INVOICE,
  ],
  [OrderState.PAID]: [
    OrderState.INVOICED,
    OrderState.PROCESSING,
    OrderState.CANCELLED,
    OrderState.CANCELLED_PRE_INVOICE,
  ],
  [OrderState.INVOICED]: [
    OrderState.PROCESSING,
    OrderState.CANCELLED,
    OrderState.CANCELLED_POST_INVOICE,
  ],
  [OrderState.PROCESSING]: [
    OrderState.SHIPPED,
    OrderState.CANCELLED,
    OrderState.CANCELLED_POST_INVOICE,
  ],
  [OrderState.SHIPPED]: [
    OrderState.DELIVERED,
    OrderState.RTO_INITIATED,
    OrderState.CANCELLED,
  ],
  [OrderState.DELIVERED]: [OrderState.RETURNED, OrderState.RETURN_REQUESTED],
  [OrderState.RTO_INITIATED]: [
    OrderState.RTO_INSPECTED,
    OrderState.RTO_COMPLETED,
  ],
  [OrderState.RTO_INSPECTED]: [
    OrderState.RTO_COMPLETED,
    OrderState.CREDIT_NOTE_ISSUED,
  ],
  [OrderState.RETURN_REQUESTED]: [
    OrderState.RETURN_INSPECTED,
    OrderState.RETURNED,
  ],
  [OrderState.RETURN_INSPECTED]: [
    OrderState.CREDIT_NOTE_ISSUED,
    OrderState.RETURNED,
  ],
  [OrderState.CANCELLED]: [],
  [OrderState.CANCELLED_PRE_INVOICE]: [],
  [OrderState.CANCELLED_POST_INVOICE]: [OrderState.CREDIT_NOTE_ISSUED],
  [OrderState.RTO_COMPLETED]: [OrderState.CREDIT_NOTE_ISSUED],
  [OrderState.RETURNED]: [OrderState.CREDIT_NOTE_ISSUED],
  [OrderState.CREDIT_NOTE_ISSUED]: [],
};

/**
 * Validates if transitioning from currentState to nextState is legally allowed
 */
export function validateStateTransition(
  currentState: string,
  nextState: string,
): boolean {
  if (currentState === nextState) return true;
  const allowed = ALLOWED_TRANSITIONS[currentState] || [];
  return allowed.includes(nextState);
}

/**
 * Checks NIC E-Invoicing 24-Hour Cancellation Window Constraint
 */
export function canCancelEInvoiceIRN(
  irnGeneratedAt: Date | string | null | undefined,
): boolean {
  if (!irnGeneratedAt) return false;
  const generatedTime = new Date(irnGeneratedAt).getTime();
  const currentTime = new Date().getTime();
  const diffHours = (currentTime - generatedTime) / (1000 * 60 * 60);
  return diffHours <= 24.0;
}

/**
 * Section 34(2) Credit Note Statutory Cutoff Validator
 * Statutory Deadline: November 30th of the Financial Year following the invoice FY.
 */
export function validateSection34CreditNoteEligibility(
  invoiceDate: Date | string,
  referenceDate: Date = new Date(),
): {
  isGstCreditNoteAllowed: boolean;
  cutoffDate: Date;
  reason: string;
} {
  const invDate = new Date(invoiceDate);
  const invYear = invDate.getFullYear();
  const invMonth = invDate.getMonth(); // 0-indexed (0 = Jan, 2 = Mar, 3 = Apr)

  // Determine Invoice Financial Year (India FY runs April 1 to March 31)
  const fyStartYear = invMonth >= 3 ? invYear : invYear - 1;
  const subsequentFyYear = fyStartYear + 1;

  // Statutory Cutoff: 30th November of subsequent FY year
  const cutoffDate = new Date(subsequentFyYear, 10, 30, 23, 59, 59, 999);

  if (referenceDate <= cutoffDate) {
    return {
      isGstCreditNoteAllowed: true,
      cutoffDate,
      reason: `Invoice within Section 34 filing window (Cutoff: ${cutoffDate.toISOString().split("T")[0]}).`,
    };
  } else {
    return {
      isGstCreditNoteAllowed: false,
      cutoffDate,
      reason: `EXPIRED: Section 34 deadline (${cutoffDate.toISOString().split("T")[0]}) passed. Must issue Commercial Non-GST Credit Note.`,
    };
  }
}

/**
 * Generates an audit-compliant Credit Note for an order
 */
export async function createCreditNoteForOrder(
  orderId: string,
  reason: "PRE_DISPATCH_CANCEL" | "RTO" | "CUSTOMER_RETURN" | "DEFECTIVE",
  gstr1Period?: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Order ID ${orderId} not found`);
  }

  // Find or create an invoice record for this order
  let invoice = await prisma.invoice.findFirst({
    where: { orderId: order.id },
  });

  if (!invoice) {
    // Generate Invoice record retroactively if needed
    const isIntraState =
      !order.shippingState ||
      order.shippingState.trim().toLowerCase() === "uttar pradesh" ||
      order.shippingState.trim() === "09";

    const cgst = isIntraState
      ? Math.round((order.taxAmount / 2) * 100) / 100
      : 0;
    const sgst = isIntraState
      ? Math.round((order.taxAmount / 2) * 100) / 100
      : 0;
    const igst = !isIntraState ? Math.round(order.taxAmount * 100) / 100 : 0;

    const baseSubtotal =
      Math.round(
        (order.totalAmount -
          order.taxAmount -
          order.shippingAmount +
          order.discountAmount) *
          100,
      ) / 100;

    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: order.invoiceNumber || `INV-${order.orderNumber}`,
        orderId: order.id,
        billingName: order.companyName || `${order.userId}`,
        billingGstin: order.gstin,
        shippingState: order.shippingState || "Uttar Pradesh",
        placeOfSupplyCode: isIntraState ? "09" : "99",
        isB2B: order.b2bFlag || Boolean(order.gstin),
        subtotalAmount: baseSubtotal,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalTaxAmount: order.taxAmount,
        totalInvoiceAmount: order.totalAmount,
        irn: order.irn || null,
        isLocked: true,
        lockedAt: new Date(),
      },
    });
  }

  // Verify Section 34 Cutoff eligibility
  const sec34Check = validateSection34CreditNoteEligibility(invoice.createdAt);
  const creditNoteType = sec34Check.isGstCreditNoteAllowed
    ? "GST_TAX"
    : "COMMERCIAL_NON_GST";

  const cnNumber = `CN-${order.orderNumber}-${Date.now().toString().slice(-4)}`;

  const isIntraState =
    !order.shippingState ||
    order.shippingState.trim().toLowerCase() === "uttar pradesh" ||
    order.shippingState.trim() === "09";

  const cgstRev =
    sec34Check.isGstCreditNoteAllowed && isIntraState
      ? Math.round((order.taxAmount / 2) * 100) / 100
      : 0;
  const sgstRev =
    sec34Check.isGstCreditNoteAllowed && isIntraState
      ? Math.round((order.taxAmount / 2) * 100) / 100
      : 0;
  const igstRev =
    sec34Check.isGstCreditNoteAllowed && !isIntraState
      ? Math.round(order.taxAmount * 100) / 100
      : 0;
  const taxRev = sec34Check.isGstCreditNoteAllowed ? order.taxAmount : 0;

  const baseSubtotal =
    Math.round(
      (order.totalAmount -
        order.taxAmount -
        order.shippingAmount +
        order.discountAmount) *
        100,
    ) / 100;

  const filingPeriod = gstr1Period || new Date().toISOString().slice(0, 7);

  const creditNote = await prisma.creditNote.create({
    data: {
      creditNoteNumber: cnNumber,
      invoiceId: invoice.id,
      orderId: order.id,
      reason,
      creditNoteType,
      subtotalReversed: baseSubtotal,
      cgstReversed: cgstRev,
      sgstReversed: sgstRev,
      igstReversed: igstRev,
      totalTaxReversed: taxRev,
      totalCreditNoteAmount: baseSubtotal + taxRev,
      section34Compliant: sec34Check.isGstCreditNoteAllowed,
      issuedAt: new Date(),
      gstr1FilingPeriod: filingPeriod,
      items: {
        create: order.items.map((item) => {
          const taxable = Math.round((item.total / 1.18) * 100) / 100;
          const tax = Math.round((item.total - taxable) * 100) / 100;
          return {
            productId: item.productId,
            variantId: item.variantId,
            hsnCode: item.product?.hsnCode || "9405",
            quantityReturned: item.quantity,
            unitPrice: item.unitPrice,
            taxableValue: taxable,
            taxRate: 18.0,
            cgstAmount: isIntraState ? Math.round((tax / 2) * 100) / 100 : 0,
            sgstAmount: isIntraState ? Math.round((tax / 2) * 100) / 100 : 0,
            igstAmount: !isIntraState ? tax : 0,
          };
        }),
      },
    },
  });

  return creditNote;
}
