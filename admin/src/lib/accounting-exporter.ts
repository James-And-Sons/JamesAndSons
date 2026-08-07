import ExcelJS from "exceljs";
import { prisma } from "@james-andsons/db";

export interface ExportOptions {
  startDate?: string | Date;
  endDate?: string | Date;
  allTime?: boolean;
  format?: "xlsx" | "csv";
}

export const COMPANY_HOME_STATE = "Uttar Pradesh";
export const COMPANY_HOME_STATE_CODE = "09";
export const TARGET_ACCOUNTS_EMAIL = "accounts@jamesandsons.in";

/**
 * Determines tax breakdown (CGST, SGST, IGST) based on customer state vs company home state
 */
export function calculateGstBreakdown(
  taxAmount: number,
  shippingState?: string | null,
) {
  const isIntraState =
    !shippingState ||
    shippingState.trim().toLowerCase() === COMPANY_HOME_STATE.toLowerCase() ||
    shippingState.trim() === COMPANY_HOME_STATE_CODE;

  if (isIntraState) {
    const cgst = Math.round((taxAmount / 2) * 100) / 100;
    const sgst = Math.round((taxAmount / 2) * 100) / 100;
    return { cgst, sgst, igst: 0, isIntraState: true };
  } else {
    const igst = Math.round(taxAmount * 100) / 100;
    return { cgst: 0, sgst: 0, igst, isIntraState: false };
  }
}

/**
 * Generates a 4-sheet formatted Excel workbook (.xlsx) for CAs and Accounts team
 */
export async function generateFinancialStatementWorkbook(
  options: ExportOptions,
): Promise<Buffer> {
  const { startDate, endDate, allTime } = options;

  let whereClause: any = {};
  if (!allTime) {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    whereClause.createdAt = {
      gte: start,
      lte: end,
    };
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "James & Sons Financial System";
  workbook.created = new Date();

  // --- SHEET 1: Master Sales Ledger & Orders Summary ---
  const sheet1 = workbook.addWorksheet("Master Sales Ledger");
  sheet1.columns = [
    { header: "Order No", key: "orderNumber", width: 18 },
    { header: "Invoice No", key: "invoiceNumber", width: 18 },
    { header: "Date", key: "date", width: 14 },
    { header: "Channel", key: "channel", width: 15 },
    { header: "Customer Name", key: "customerName", width: 22 },
    { header: "Customer Email", key: "email", width: 24 },
    { header: "Customer Phone", key: "phone", width: 16 },
    { header: "Account Type", key: "accountType", width: 14 },
    { header: "Company Name", key: "companyName", width: 24 },
    { header: "GSTIN", key: "gstin", width: 18 },
    { header: "Shipping State", key: "state", width: 18 },
    { header: "Status", key: "status", width: 12 },
    { header: "Base Subtotal (₹)", key: "subtotal", width: 16 },
    { header: "Discount (₹)", key: "discount", width: 14 },
    { header: "Shipping (₹)", key: "shipping", width: 14 },
    { header: "CGST (₹)", key: "cgst", width: 14 },
    { header: "SGST (₹)", key: "sgst", width: 14 },
    { header: "IGST (₹)", key: "igst", width: 14 },
    { header: "Total Tax (₹)", key: "totalTax", width: 14 },
    { header: "Total Amount (₹)", key: "totalAmount", width: 18 },
  ];

  sheet1.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet1.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };

  let grandSubtotal = 0;
  let grandDiscount = 0;
  let grandShipping = 0;
  let grandCgst = 0;
  let grandSgst = 0;
  let grandIgst = 0;
  let grandTax = 0;
  let grandTotal = 0;

  for (const o of orders) {
    const gstBreakdown = calculateGstBreakdown(o.taxAmount, o.shippingState);
    const baseSubtotal =
      Math.round(
        (o.totalAmount - o.taxAmount - o.shippingAmount + o.discountAmount) *
          100,
      ) / 100;
    const isB2B = o.b2bFlag || Boolean(o.gstin);

    grandSubtotal += baseSubtotal;
    grandDiscount += o.discountAmount;
    grandShipping += o.shippingAmount;
    grandCgst += gstBreakdown.cgst;
    grandSgst += gstBreakdown.sgst;
    grandIgst += gstBreakdown.igst;
    grandTax += o.taxAmount;
    grandTotal += o.totalAmount;

    sheet1.addRow({
      orderNumber: o.orderNumber,
      invoiceNumber: o.invoiceNumber || "N/A",
      date: new Date(o.createdAt).toISOString().split("T")[0],
      channel: o.channel || "JNS_STOREFRONT",
      customerName: `${o.user.firstName} ${o.user.lastName}`,
      email: o.user.email,
      phone: o.shippingPhone || o.user.phone || "",
      accountType: isB2B ? "B2B Trade" : "Retail B2C",
      companyName: o.companyName || "N/A",
      gstin: o.gstin || "N/A",
      state: o.shippingState || "Uttar Pradesh",
      status: o.status,
      subtotal: baseSubtotal,
      discount: o.discountAmount,
      shipping: o.shippingAmount,
      cgst: gstBreakdown.cgst,
      sgst: gstBreakdown.sgst,
      igst: gstBreakdown.igst,
      totalTax: o.taxAmount,
      totalAmount: o.totalAmount,
    });
  }

  const totalRow1 = sheet1.addRow({
    orderNumber: "TOTALS",
    subtotal: grandSubtotal,
    discount: grandDiscount,
    shipping: grandShipping,
    cgst: grandCgst,
    sgst: grandSgst,
    igst: grandIgst,
    totalTax: grandTax,
    totalAmount: grandTotal,
  });
  totalRow1.font = { bold: true };
  totalRow1.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
  };

  // --- SHEET 2: GSTR-1 B2B Sales Register ---
  const sheet2 = workbook.addWorksheet("GSTR-1 B2B Register");
  sheet2.columns = [
    { header: "GSTIN/UIN of Recipient", key: "gstin", width: 20 },
    { header: "Receiver Name", key: "receiverName", width: 24 },
    { header: "Invoice Number", key: "invoiceNumber", width: 18 },
    { header: "Invoice Date", key: "invoiceDate", width: 14 },
    { header: "Invoice Value (₹)", key: "invoiceValue", width: 16 },
    { header: "Place Of Supply", key: "pos", width: 18 },
    { header: "Reverse Charge", key: "reverseCharge", width: 14 },
    { header: "Applicable % of Tax Rate", key: "taxRate", width: 22 },
    { header: "Invoice Type", key: "invoiceType", width: 16 },
    { header: "E-Commerce GSTIN", key: "ecomGstin", width: 18 },
    { header: "Taxable Value (₹)", key: "taxableValue", width: 16 },
    { header: "Integrated Tax (IGST ₹)", key: "igst", width: 18 },
    { header: "Central Tax (CGST ₹)", key: "cgst", width: 16 },
    { header: "State Tax (SGST ₹)", key: "sgst", width: 16 },
    { header: "Cess Amount (₹)", key: "cess", width: 14 },
  ];
  sheet2.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet2.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F766E" },
  };

  const b2bOrders = orders.filter((o) => o.b2bFlag || Boolean(o.gstin));
  for (const o of b2bOrders) {
    const gstBreakdown = calculateGstBreakdown(o.taxAmount, o.shippingState);
    const taxable =
      Math.round((o.totalAmount - o.taxAmount - o.shippingAmount) * 100) / 100;

    sheet2.addRow({
      gstin: o.gstin || "",
      receiverName: o.companyName || `${o.user.firstName} ${o.user.lastName}`,
      invoiceNumber: o.invoiceNumber || o.orderNumber,
      invoiceDate: new Date(o.createdAt).toISOString().split("T")[0],
      invoiceValue: o.totalAmount,
      pos: o.shippingState ? `${o.shippingState}` : "Uttar Pradesh",
      reverseCharge: "N",
      taxRate: "18%",
      invoiceType: "Regular",
      ecomGstin: "",
      taxableValue: taxable,
      igst: gstBreakdown.igst,
      cgst: gstBreakdown.cgst,
      sgst: gstBreakdown.sgst,
      cess: 0,
    });
  }

  // --- SHEET 3: GSTR-1 B2CS (B2C Small) Register ---
  const sheet3 = workbook.addWorksheet("GSTR-1 B2CS Register");
  sheet3.columns = [
    { header: "Type", key: "type", width: 12 },
    { header: "Place Of Supply", key: "pos", width: 22 },
    { header: "Applicable % of Tax Rate", key: "taxRate", width: 22 },
    { header: "Taxable Value (₹)", key: "taxableValue", width: 18 },
    { header: "IGST (₹)", key: "igst", width: 16 },
    { header: "CGST (₹)", key: "cgst", width: 16 },
    { header: "SGST (₹)", key: "sgst", width: 16 },
    { header: "Cess Amount (₹)", key: "cess", width: 14 },
  ];
  sheet3.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet3.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };

  const b2cOrders = orders.filter((o) => !o.b2bFlag && !o.gstin);
  const stateSummaryMap: Record<
    string,
    { taxable: number; cgst: number; sgst: number; igst: number }
  > = {};

  for (const o of b2cOrders) {
    const pos = o.shippingState || "Uttar Pradesh";
    const gstBreakdown = calculateGstBreakdown(o.taxAmount, o.shippingState);
    const taxable =
      Math.round((o.totalAmount - o.taxAmount - o.shippingAmount) * 100) / 100;

    if (!stateSummaryMap[pos]) {
      stateSummaryMap[pos] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    }
    stateSummaryMap[pos].taxable += taxable;
    stateSummaryMap[pos].cgst += gstBreakdown.cgst;
    stateSummaryMap[pos].sgst += gstBreakdown.sgst;
    stateSummaryMap[pos].igst += gstBreakdown.igst;
  }

  for (const [pos, val] of Object.entries(stateSummaryMap)) {
    sheet3.addRow({
      type: "OE",
      pos,
      taxRate: "18%",
      taxableValue: Math.round(val.taxable * 100) / 100,
      igst: Math.round(val.igst * 100) / 100,
      cgst: Math.round(val.cgst * 100) / 100,
      sgst: Math.round(val.sgst * 100) / 100,
      cess: 0,
    });
  }

  // --- SHEET 4: HSN/SAC Summary ---
  const sheet4 = workbook.addWorksheet("HSN Summary");
  sheet4.columns = [
    { header: "HSN/SAC Code", key: "hsn", width: 16 },
    { header: "Item Description", key: "description", width: 30 },
    { header: "UQC", key: "uqc", width: 10 },
    { header: "Total Quantity", key: "qty", width: 14 },
    { header: "Total Value (₹)", key: "totalValue", width: 16 },
    { header: "Taxable Value (₹)", key: "taxableValue", width: 16 },
    { header: "Integrated Tax (₹)", key: "igst", width: 16 },
    { header: "Central Tax (₹)", key: "cgst", width: 14 },
    { header: "State Tax (₹)", key: "sgst", width: 14 },
  ];
  sheet4.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet4.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB45309" },
  };

  const hsnMap: Record<
    string,
    {
      desc: string;
      qty: number;
      totalVal: number;
      taxableVal: number;
      tax: number;
    }
  > = {};
  for (const o of orders) {
    for (const item of o.items) {
      const hsn = item.product.hsnCode || "9405";
      const itemTaxable = Math.round((item.total / 1.18) * 100) / 100;
      const itemTax = Math.round((item.total - itemTaxable) * 100) / 100;

      if (!hsnMap[hsn]) {
        hsnMap[hsn] = {
          desc: item.product.name,
          qty: 0,
          totalVal: 0,
          taxableVal: 0,
          tax: 0,
        };
      }
      hsnMap[hsn].qty += item.quantity;
      hsnMap[hsn].totalVal += item.total;
      hsnMap[hsn].taxableVal += itemTaxable;
      hsnMap[hsn].tax += itemTax;
    }
  }

  for (const [hsn, val] of Object.entries(hsnMap)) {
    const cgst = Math.round((val.tax / 2) * 100) / 100;
    const sgst = Math.round((val.tax / 2) * 100) / 100;
    sheet4.addRow({
      hsn,
      description: val.desc,
      uqc: "PCS",
      qty: val.qty,
      totalValue: Math.round(val.totalVal * 100) / 100,
      taxableValue: Math.round(val.taxableVal * 100) / 100,
      igst: 0,
      cgst,
      sgst,
    });
  }

  // --- SHEET 5: GSTR-1 Credit Notes & Reversals (Table 9B) ---
  const sheet5 = workbook.addWorksheet("Credit Notes (Table 9B)");
  sheet5.columns = [
    { header: "Credit Note No", key: "cnNumber", width: 22 },
    { header: "Original Invoice No", key: "invoiceNumber", width: 22 },
    { header: "Date Issued", key: "date", width: 14 },
    { header: "Reason", key: "reason", width: 20 },
    { header: "CN Type", key: "cnType", width: 20 },
    { header: "Sec 34 Compliant", key: "sec34", width: 18 },
    { header: "Reversed Taxable (₹)", key: "subtotal", width: 20 },
    { header: "CGST Reversed (₹)", key: "cgst", width: 18 },
    { header: "SGST Reversed (₹)", key: "sgst", width: 18 },
    { header: "IGST Reversed (₹)", key: "igst", width: 18 },
    { header: "Total Tax Reversed (₹)", key: "totalTax", width: 22 },
    { header: "Total Credit Note (₹)", key: "totalAmount", width: 22 },
  ];
  sheet5.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet5.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF991B1B" },
  };

  const creditNotes = await prisma.creditNote.findMany({
    include: {
      invoice: true,
    },
    orderBy: { issuedAt: "asc" },
  });

  for (const cn of creditNotes) {
    sheet5.addRow({
      cnNumber: cn.creditNoteNumber,
      invoiceNumber: cn.invoice?.invoiceNumber || "N/A",
      date: new Date(cn.issuedAt).toISOString().split("T")[0],
      reason: cn.reason,
      cnType: cn.creditNoteType,
      sec34: cn.section34Compliant ? "YES" : "NO (EXPIRED)",
      subtotal: cn.subtotalReversed,
      cgst: cn.cgstReversed,
      sgst: cn.sgstReversed,
      igst: cn.igstReversed,
      totalTax: cn.totalTaxReversed,
      totalAmount: cn.totalCreditNoteAmount,
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates a lightweight CSV string for ledger import
 */
export async function generateFinancialCsv(
  options: ExportOptions,
): Promise<string> {
  const { startDate, endDate, allTime } = options;

  let whereClause: any = {};
  if (!allTime) {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    whereClause.createdAt = {
      gte: start,
      lte: end,
    };
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
    },
  });

  const headers = [
    "Order Number",
    "Invoice Number",
    "Date",
    "Customer Name",
    "Customer Email",
    "Account Type",
    "Company Name",
    "GSTIN",
    "State",
    "Status",
    "Base Subtotal",
    "Discount",
    "Shipping Charge",
    "CGST",
    "SGST",
    "IGST",
    "Total Tax",
    "Total Amount",
  ];

  const rows = orders.map((o) => {
    const gstBreakdown = calculateGstBreakdown(o.taxAmount, o.shippingState);
    const baseSubtotal =
      Math.round(
        (o.totalAmount - o.taxAmount - o.shippingAmount + o.discountAmount) *
          100,
      ) / 100;
    const isB2B = o.b2bFlag || Boolean(o.gstin);

    return [
      `"${o.orderNumber}"`,
      `"${o.invoiceNumber || ""}"`,
      `"${new Date(o.createdAt).toISOString().split("T")[0]}"`,
      `"${o.user.firstName} ${o.user.lastName}"`,
      `"${o.user.email}"`,
      `"${isB2B ? "B2B" : "B2C"}"`,
      `"${o.companyName || ""}"`,
      `"${o.gstin || ""}"`,
      `"${o.shippingState || "Uttar Pradesh"}"`,
      `"${o.status}"`,
      baseSubtotal,
      o.discountAmount,
      o.shippingAmount,
      gstBreakdown.cgst,
      gstBreakdown.sgst,
      gstBreakdown.igst,
      o.taxAmount,
      o.totalAmount,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
