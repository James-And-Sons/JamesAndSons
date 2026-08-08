import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateTaxBreakdown } from "./invoice";

const INDIAN_STATE_CODES: Record<string, string> = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  punjab: "03",
  chandigarh: "04",
  uttarakhand: "05",
  haryana: "06",
  delhi: "07",
  rajasthan: "08",
  "uttar pradesh": "09",
  bihar: "10",
  sikkim: "11",
  "arunachal pradesh": "12",
  nagaland: "13",
  manipur: "14",
  mizoram: "15",
  tripura: "16",
  meghalaya: "17",
  assam: "18",
  "west bengal": "19",
  jharkhand: "20",
  odisha: "21",
  chhattisgarh: "22",
  "madhya pradesh": "23",
  gujarat: "24",
  maharashtra: "27",
  karnataka: "29",
  goa: "30",
  kerala: "32",
  "tamil nadu": "33",
  telangana: "36",
  "andhra pradesh": "37",
};

function getStateCode(stateName?: string): string {
  if (!stateName) return "09";
  const normalized = stateName.trim().toLowerCase();
  return INDIAN_STATE_CODES[normalized] || "09";
}

function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return "Rupees Zero Only";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        "Hundred " +
        (n % 100 !== 0 ? inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        "Thousand " +
        (n % 1000 !== 0 ? inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        "Lakh " +
        (n % 100000 !== 0 ? inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      "Crore " +
      (n % 10000000 !== 0 ? inWords(n % 10000000) : "")
    );
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = "Rupees " + (rupees === 0 ? "Zero " : inWords(rupees).trim());
  if (paise > 0) {
    result += " and " + inWords(paise).trim() + " Paise";
  }
  return result.trim() + " Only";
}

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

  const invoiceDate = new Date(createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  const customerState = shippingState || "Uttar Pradesh";
  const customerStateCode = getStateCode(customerState);
  const supplierStateCode = "09"; // Uttar Pradesh
  const supplierGstin =
    process.env.STORE_GSTIN ||
    process.env.NEXT_PUBLIC_STORE_GSTIN ||
    "09AABCJ1234F1Z8";

  const taxBreakdown = calculateTaxBreakdown(taxAmount || 0, customerState);

  const doc = new jsPDF() as any;

  // 1. Header Gold Accent Bar
  doc.setFillColor(196, 160, 90); // Gold
  doc.rect(0, 0, 210, 4, "F");

  // 2. Company Brand & Supplier Contact Information (Left Column)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(196, 160, 90);
  doc.text("JAMES & SONS", 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("LUXURY LIGHTING & ARCHITECTURAL HARDWARE", 14, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("James & Sons Private Limited", 14, 28);
  doc.text(
    "Phase II, Industrial Area, Aligarh, Uttar Pradesh - 202001, India",
    14,
    32,
  );
  doc.text(
    `GSTIN: ${supplierGstin}  |  State: Uttar Pradesh (Code: ${supplierStateCode})`,
    14,
    36,
  );
  doc.text("Phone: +91 98110 00000  |  Email: support@jamesandsons.in", 14, 40);
  doc.setTextColor(196, 160, 90);
  doc.text("Website: https://jamesandsons.in", 14, 44);

  // 3. Tax Invoice Title & Rule 46 Badge (Right Column)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text("TAX INVOICE", 196, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("(Issued under Rule 46 of CGST Rules, 2017)", 196, 23, {
    align: "right",
  });

  doc.setDrawColor(226, 209, 166);
  doc.setLineWidth(0.4);
  doc.line(14, 48, 196, 48);

  // 4. Invoice & Order Metadata Box
  doc.setFillColor(253, 251, 247);
  doc.rect(14, 52, 182, 22, "F");
  doc.setDrawColor(226, 209, 166);
  doc.rect(14, 52, 182, 22, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("INVOICE NUMBER", 18, 57);
  doc.text("INVOICE DATE", 68, 57);
  doc.text("ORDER NUMBER", 114, 57);
  doc.text("PLACE OF SUPPLY", 158, 57);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceNumber || `INV-${orderNumber}`, 18, 63);
  doc.text(invoiceDate, 68, 63);
  doc.text(orderNumber, 114, 63);
  doc.text(`${customerState} (${customerStateCode})`, 158, 63);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Reverse Charge (RCM): No", 18, 69);
  doc.text(`State Code: ${customerStateCode}`, 68, 69);
  doc.text("Currency: INR (₹)", 114, 69);
  doc.text("Supply Type: B2C / B2B", 158, 69);

  // 5. Billing & Shipping Address Box
  const billingY = 80;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("BILLED TO (RECIPIENT)", 14, billingY);
  doc.text("SHIPPED TO (DELIVERY ADDRESS)", 110, billingY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const customerName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "Valued Customer"
    : "Valued Customer";

  // Customer Billed To
  doc.text(customerName, 14, billingY + 5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${user?.email || "N/A"}`, 14, billingY + 9);
  doc.text(
    `Phone: ${user?.phone || order.shippingPhone || "N/A"}`,
    14,
    billingY + 13,
  );

  if (gstin) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(196, 160, 90);
    doc.text(
      `Trade: ${companyName || "Trade Account"} | GSTIN: ${gstin}`,
      14,
      billingY + 17,
    );
    doc.setFont("helvetica", "normal");
  }

  // Customer Shipped To
  doc.setTextColor(15, 23, 42);
  doc.text(customerName, 110, billingY + 5);
  doc.setTextColor(71, 85, 105);
  const splitAddress = doc.splitTextToSize(
    shippingAddress || "Address details on record",
    86,
  );
  doc.text(splitAddress, 110, billingY + 9);
  doc.text(
    `State: ${customerState} (Code: ${customerStateCode})`,
    110,
    billingY + 20,
  );

  // 6. Itemized Products Table
  const tableStartY = billingY + 26;

  const tableData = (items || []).map((item: any, idx: number) => {
    const qty = item.quantity || 1;
    const itemTotal = Number(item.total || item.unitPrice * qty || 0);
    const taxableVal = Math.round((itemTotal / 1.18) * 100) / 100;
    const itemTax = Math.round((itemTotal - taxableVal) * 100) / 100;
    const unitTaxable = taxableVal / qty;

    return [
      idx + 1,
      {
        content: `${item.product?.name || item.name || "Luxury Lighting Item"}\nSKU: ${item.product?.sku || "JNS-LGT-01"}`,
        styles: { fontSize: 8 },
      },
      item.product?.hsnCode || "9405",
      qty,
      `₹${unitTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "18%",
      `₹${itemTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `₹${itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [
      [
        "S.No",
        "Item Description & SKU",
        "HSN",
        "Qty",
        "Taxable Rate",
        "GST %",
        "Tax Amount",
        "Total Amount",
      ],
    ],
    body: tableData,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", cellWidth: 26 },
      5: { halign: "center", cellWidth: 14 },
      6: { halign: "right", cellWidth: 24 },
      7: { halign: "right", cellWidth: 28 },
    },
  });

  // 7. Financial Totals & Tax Breakdown Box
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  let y = finalY;

  // Amount in Words (Left) & Calculation Grid (Right)
  const grandTotal = Number(totalAmount || 0);
  const netGoodsTotal = Math.max(0, grandTotal - (shippingAmount || 0));
  const baseSubtotal = Math.round((netGoodsTotal / 1.18) * 100) / 100;
  const calculatedTax = Math.round((netGoodsTotal - baseSubtotal) * 100) / 100;

  const effectiveTaxBreakdown =
    customerState.trim().toLowerCase() === "uttar pradesh"
      ? {
          type: "CGST/SGST",
          cgst: Math.round((calculatedTax / 2) * 100) / 100,
          sgst: Math.round((calculatedTax / 2) * 100) / 100,
          igst: 0,
        }
      : {
          type: "IGST",
          cgst: 0,
          sgst: 0,
          igst: calculatedTax,
        };

  // Words Box Left
  doc.setFillColor(253, 251, 247);
  doc.rect(14, y, 95, 34, "F");
  doc.setDrawColor(226, 209, 166);
  doc.rect(14, y, 95, 34, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL AMOUNT IN WORDS", 18, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const splitWords = doc.splitTextToSize(numberToWordsINR(grandTotal), 88);
  doc.text(splitWords, 18, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Note: GST tax is charged as per CGST/SGST/IGST rules.", 18, y + 29);

  // Totals Box Right
  const rightLabelX = 114;
  const rightValX = 196;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text("Taxable Subtotal:", rightLabelX, y + 5);
  doc.text(
    `₹${baseSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rightValX,
    y + 5,
    { align: "right" },
  );

  let curY = y + 10;
  if (effectiveTaxBreakdown.type === "CGST/SGST") {
    doc.text("CGST (9%):", rightLabelX, curY);
    doc.text(
      `₹${effectiveTaxBreakdown.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rightValX,
      curY,
      { align: "right" },
    );
    curY += 5;
    doc.text("SGST (9%):", rightLabelX, curY);
    doc.text(
      `₹${effectiveTaxBreakdown.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rightValX,
      curY,
      { align: "right" },
    );
  } else {
    doc.text("IGST (18%):", rightLabelX, curY);
    doc.text(
      `₹${effectiveTaxBreakdown.igst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rightValX,
      curY,
      { align: "right" },
    );
  }

  curY += 5;
  doc.text("Freight & Shipping Charges:", rightLabelX, curY);
  doc.text(
    !shippingAmount || shippingAmount === 0
      ? "FREE"
      : `₹${shippingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rightValX,
    curY,
    { align: "right" },
  );

  curY += 7;
  doc.setDrawColor(226, 209, 166);
  doc.line(rightLabelX, curY - 3, rightValX, curY - 3);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("Grand Total:", rightLabelX, curY);
  doc.setTextColor(196, 160, 90);
  doc.text(
    `₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rightValX,
    curY,
    { align: "right" },
  );

  // 8. Terms & Conditions, Bank Details & Authorised Signatory Block
  const sigY = curY + 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("TERMS & STATUTORY DECLARATION", 14, sigY);
  doc.text("FOR JAMES & SONS PRIVATE LIMITED", 196, sigY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "1. Goods once sold are covered under James & Sons Manufacturer Warranty.",
    14,
    sigY + 5,
  );
  doc.text(
    "2. All disputes are subject to Aligarh, UP Jurisdiction.",
    14,
    sigY + 9,
  );
  doc.text(
    "3. We declare that this invoice shows the actual price of the goods described.",
    14,
    sigY + 13,
  );

  doc.setFont("helvetica", "italic");
  doc.text("Authorised Signatory", 196, sigY + 18, { align: "right" });

  // 9. Gold Accent Footer Bar
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "James & Sons Private Limited · www.jamesandsons.in · support@jamesandsons.in · Customer Care: +91 98110 00000",
    105,
    285,
    { align: "center" },
  );

  doc.setFillColor(196, 160, 90);
  doc.rect(0, 292, 210, 5, "F");

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
