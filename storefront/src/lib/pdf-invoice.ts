import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateTaxBreakdown } from "./invoice";

export function generateInvoicePdfBuffer(order: any): Buffer {
  const {
    orderNumber,
    invoiceNumber,
    totalAmount,
    user,
    items,
    gstin,
    companyName,
    shippingAddress,
    taxAmount,
    shippingAmount,
    shippingState,
    createdAt,
  } = order;

  const date = new Date(createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const taxBreakdown = calculateTaxBreakdown(
    taxAmount || 0,
    shippingState || "",
  );

  const doc = new jsPDF() as any;

  // Gold Header Bar
  doc.setFillColor(196, 160, 90);
  doc.rect(0, 0, 210, 5, "F");

  // Header Title
  doc.setFontSize(22);
  doc.setTextColor(196, 160, 90);
  doc.text("JAMES & SONS", 20, 25);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("LUXURY LIGHTING & ARCHITECTURAL HARDWARE", 20, 31);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("TAX INVOICE", 160, 25);

  doc.setDrawColor(196, 160, 90);
  doc.setLineWidth(0.5);
  doc.line(20, 36, 190, 36);

  // Invoice & Order Information Meta
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("INVOICE NUMBER", 20, 48);
  doc.text("ORDER NUMBER", 90, 48);
  doc.text("DATE", 160, 48);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceNumber || "PENDING", 20, 55);
  doc.text(orderNumber, 90, 55);
  doc.text(date, 160, 55);

  // Billing & Shipping Box
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("BILLED TO", 20, 72);
  doc.text("SHIPPING ADDRESS", 110, 72);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const customerName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "Valued Customer"
    : "Valued Customer";
  doc.text(customerName, 20, 79);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(user?.email || "", 20, 84);

  const splitAddress = doc.splitTextToSize(
    shippingAddress || "Address details on record",
    80,
  );
  doc.text(splitAddress, 110, 79);

  // GST Registration Details Box
  let currentY = 106;
  if (gstin) {
    doc.setFillColor(253, 250, 244);
    doc.rect(20, currentY - 5, 170, 20, "F");
    doc.setFontSize(8);
    doc.setTextColor(196, 160, 90);
    doc.text("RECIPIENT GST DETAILS (B2B TRADE)", 25, currentY + 2);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(
      `${companyName || "Registered Trade Account"}  |  GSTIN: ${gstin}`,
      25,
      currentY + 10,
    );
    currentY += 28;
  }

  // Items Table with HSN Codes
  const tableData = (items || []).map((item: any) => [
    {
      content:
        (item.product?.name || item.name || "Luxury Lighting Item") +
        `\nHSN: ${item.product?.hsnCode || "9405"}`,
      styles: { fontSize: 8.5 },
    },
    item.quantity || 1,
    `INR ${Number(item.unitPrice || item.price || 0).toLocaleString("en-IN")}`,
    `INR ${Number(item.total || item.unitPrice * item.quantity || 0).toLocaleString("en-IN")}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Description & HSN", "Qty", "Unit Price", "Total"]],
    body: tableData,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  // Financial Totals & GST Tax Breakdown
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  let y = finalY;
  const leftX = 125;
  const rightX = 185;

  const baseSubtotal =
    Math.round(
      ((totalAmount || 0) - (taxAmount || 0) - (shippingAmount || 0)) * 100,
    ) / 100;

  doc.setFontSize(9);
  doc.setTextColor(100);

  doc.text("Taxable Subtotal:", leftX, y);
  doc.text(`INR ${baseSubtotal.toLocaleString("en-IN")}`, rightX, y, {
    align: "right",
  });

  y += 6;
  if (taxBreakdown.type === "CGST/SGST") {
    doc.text("CGST (9%):", leftX, y);
    doc.text(`INR ${taxBreakdown.cgst.toLocaleString("en-IN")}`, rightX, y, {
      align: "right",
    });
    y += 6;
    doc.text("SGST (9%):", leftX, y);
    doc.text(`INR ${taxBreakdown.sgst.toLocaleString("en-IN")}`, rightX, y, {
      align: "right",
    });
  } else {
    doc.text("IGST (18%):", leftX, y);
    doc.text(`INR ${taxBreakdown.igst.toLocaleString("en-IN")}`, rightX, y, {
      align: "right",
    });
  }

  y += 6;
  doc.text("Freight & Handling:", leftX, y);
  doc.text(
    !shippingAmount || shippingAmount === 0
      ? "FREE"
      : `INR ${shippingAmount.toLocaleString("en-IN")}`,
    rightX,
    y,
    { align: "right" },
  );

  y += 10;
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Grand Total:", leftX, y);
  doc.setTextColor(196, 160, 90);
  doc.text(
    `INR ${Number(totalAmount || 0).toLocaleString("en-IN")}`,
    rightX,
    y,
    { align: "right" },
  );

  // Gold Footer Line & Fine Print
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Thank you for choosing James & Sons. Excellence in every detail.",
    105,
    280,
    { align: "center" },
  );
  doc.setFillColor(196, 160, 90);
  doc.rect(0, 292, 210, 5, "F");

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
