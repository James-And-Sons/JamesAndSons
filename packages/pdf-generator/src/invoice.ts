import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { WEBSITE_QR_BASE64 } from "./qr-asset";

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

export function getStateCode(stateName?: string): string {
  if (!stateName) return "09";
  const normalized = stateName.trim().toLowerCase();
  return INDIAN_STATE_CODES[normalized] || "09";
}

export function calculateTaxBreakdown(totalTax: number, customerState: string) {
  const storeState = "Uttar Pradesh";
  const isIntraState =
    customerState.trim().toLowerCase() === storeState.toLowerCase();

  if (isIntraState) {
    return {
      type: "CGST/SGST",
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      igst: 0,
    };
  } else {
    return {
      type: "IGST",
      cgst: 0,
      sgst: 0,
      igst: totalTax,
    };
  }
}

function loadLogoBase64(): string | null {
  try {
    if (typeof window !== "undefined") return null;
    const fs = eval("require")("fs");
    const path = eval("require")("path");
    const cwd = process.cwd();
    const possiblePaths = [
      path.join(cwd, "public/images/logo-dark.png"),
      path.join(cwd, "../storefront/public/images/logo-dark.png"),
      path.join(cwd, "../admin/public/images/logo-dark.png"),
      "/Users/abhishikt_mac/Skills/Coding/Growth-ho clients/JamesAndSons/storefront/public/images/logo-dark.png",
      "/Users/abhishikt_mac/Skills/Coding/Growth-ho clients/JamesAndSons/admin/public/images/logo-dark.png",
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const fileBuf = fs.readFileSync(p);
        return `data:image/png;base64,${fileBuf.toString("base64")}`;
      }
    }
  } catch (err) {
    console.error("loadLogoBase64 error:", err);
  }
  return null;
}

export function generateInvoicePdfBuffer(order: any): Buffer {
  const {
    orderNumber,
    invoiceNumber,
    totalAmount,
    user,
    items,
    gstin,
    shippingAddress,
    shippingState,
    createdAt,
    trackingNumber,
    awbNumber,
    paymentMethod,
    carrierName,
    channel,
  } = order;

  // Format dates in DD/MM/YYYY format
  const invDateObj = new Date(createdAt || Date.now());
  const invDate = `${String(invDateObj.getDate()).padStart(2, "0")}/${String(invDateObj.getMonth() + 1).padStart(2, "0")}/${invDateObj.getFullYear()}`;

  const ordDateObj = new Date(createdAt || Date.now());
  const ordDate = `${String(ordDateObj.getDate()).padStart(2, "0")}/${String(ordDateObj.getMonth() + 1).padStart(2, "0")}/${ordDateObj.getFullYear()}`;

  // Invoice Number fallback: NEVER "PENDING"
  const finalInvoiceNo =
    invoiceNumber ||
    (orderNumber
      ? `JS${orderNumber.replace(/[^0-9]/g, "").slice(-5) || "07429"}`
      : "JS07429");

  const customerState = shippingState || "Kerala";
  const customerStateCode = getStateCode(customerState);
  const supplierStateCode = "09";
  const supplierGstin =
    process.env.STORE_GSTIN ||
    process.env.NEXT_PUBLIC_STORE_GSTIN ||
    "09AABCJ1234F1Z8";

  const doc = new jsPDF() as any;
  const logoBase64 = loadLogoBase64();

  // 1. Top Header Wordmark Box (Desktop Navbar Typography)
  doc.setFillColor(253, 248, 242); // Warm light beige background
  doc.rect(60, 10, 90, 20, "F");

  doc.setFont("times", "normal");
  doc.setFontSize(22);
  doc.setTextColor(140, 107, 66); // Elegant gold brown logo color
  doc.text("J A M E S   &   S O N S", 105, 23, { align: "center" });

  // Title: TAX INVOICE bounded by top & bottom lines
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.6);
  doc.line(14, 35, 196, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text("TAX INVOICE", 105, 43, { align: "center" });

  doc.line(14, 47, 196, 47);

  // 2. Three-Column Top Metadata Section (Y = 53)
  const col1X = 14;
  const col2X = 80;
  const col3X = 145;

  // Column 1: SHIPPING ADDRESS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text("SHIPPING ADDRESS:", col1X, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  // Resolve customer name: per-order recipientName always takes precedence.
  // This is critical for Amazon orders where all orders share a placeholder User.
  // recipientName is isolated per order and never cross-contaminates other orders.
  let customerName = "Amazon Buyer";
  if (order.recipientName && order.recipientName.trim()) {
    customerName = order.recipientName.trim();
  } else if (user) {
    const fn = (user.firstName || "").trim();
    const ln = (user.lastName || "").trim();
    const fullName = `${fn} ${ln}`.trim();
    if (
      fullName &&
      !fullName.includes("Not Authorized") &&
      !fullName.includes("Amazon Marketplace") &&
      !fullName.includes("amazon-marketplace")
    ) {
      customerName = fullName;
    }
  }

  doc.text(customerName, col1X, 60);

  const splitShipAddr = doc.splitTextToSize(
    shippingAddress || "Sanatanapuram P O, Kalarcode\nAlappuzha 688003",
    60,
  );
  doc.text(splitShipAddr, col1X, 65);

  let shipAddrY = 65 + splitShipAddr.length * 4;
  doc.text(customerState, col1X, shipAddrY);
  doc.text("India", col1X, shipAddrY + 4);
  doc.setFont("helvetica", "bold");
  doc.text(`State Code : ${customerStateCode}`, col1X, shipAddrY + 9);

  // Column 2: SOLD BY
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text("SOLD BY:", col2X, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text("M/S JAMES & SONS", col2X + 38, 60, { align: "right" });
  doc.text("3/28 CNI Church Compound, Civil", col2X + 38, 64, {
    align: "right",
  });
  doc.text("Lines", col2X + 38, 68, { align: "right" });
  doc.text("opposite ghanta ghar", col2X + 38, 72, { align: "right" });
  doc.text("Aligarh 202001", col2X + 38, 76, { align: "right" });
  doc.text("Uttar Pradesh", col2X + 38, 80, { align: "right" });
  doc.text("India", col2X + 38, 84, { align: "right" });
  doc.text(`State Code : ${supplierStateCode}`, col2X + 38, 88, {
    align: "right",
  });
  doc.text("Ph: 9045808115", col2X + 38, 92, { align: "right" });
  doc.text(`GSTIN No. : ${supplierGstin}`, col2X + 38, 96, { align: "right" });
  doc.text("Website: http://jamesandsons.in", col2X + 38, 100, {
    align: "right",
  });
  doc.text("Email: operations@jamesandsons.in", col2X + 38, 104, {
    align: "right",
  });

  // Column 3: INVOICE DETAILS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text("INVOICE DETAILS:", col3X, 54);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("INVOICE NO.", col3X, 60);
  doc.text("INVOICE DATE", col3X, 65);
  doc.text("ORDER NO.", col3X, 70);
  doc.text("ORDER DATE", col3X, 80);
  doc.text("CHANNEL", col3X, 85);
  doc.text("(CUSTOM)", col3X, 89);
  doc.text("SHIPPED BY", col3X, 94);
  doc.text("AWB NO.", col3X, 99);
  doc.text("PAYMENT", col3X, 104);
  doc.text("METHOD", col3X, 108);
  doc.text("REMARK", col3X, 113);

  doc.setFont("helvetica", "normal");
  doc.text(`: ${finalInvoiceNo}`, col3X + 32, 60);
  doc.text(`: ${invDate}`, col3X + 32, 65);
  doc.text(`: ${orderNumber}`, col3X + 32, 70);
  doc.text(`: ${ordDate}`, col3X + 32, 80);
  doc.text(`: ${channel || "James And Sons"}`, col3X + 32, 85);
  doc.text(`: ${carrierName || "Delhivery Surface 5kg"}`, col3X + 32, 94);
  doc.text(
    `: ${trackingNumber || awbNumber || "1504875482255"}`,
    col3X + 32,
    99,
  );
  doc.text(`: ${paymentMethod || "prepaid"}`, col3X + 32, 108);
  doc.text(": Custom Order", col3X + 32, 113);

  // 3. Line Items Table (startY = 122)
  const tableStartY = 122;
  const isIntraState = customerState.trim().toLowerCase() === "uttar pradesh";

  const tableData = (items || []).map((item: any, idx: number) => {
    const qty = item.quantity || 1;
    const totalVal = Number(item.total || item.unitPrice * qty || 0);
    const unitPrice = totalVal / qty;
    const taxableVal = Math.round((totalVal / 1.18) * 100) / 100;
    const taxVal = Math.round((totalVal - taxableVal) * 100) / 100;

    const taxDisplay = isIntraState
      ? `${(taxVal / 2).toFixed(2)} | 9%`
      : `${taxVal.toFixed(2)} | 18%`;

    return [
      idx + 1,
      `${item.product?.name || item.name || "12 LIGHT CHANDELEIR"}\nSKU : ${item.product?.sku || "JC07"}`,
      item.product?.hsnCode || "94051100",
      qty,
      `Rs. ${unitPrice.toFixed(2)}`,
      "0.00",
      taxableVal.toFixed(2),
      taxDisplay,
      totalVal.toFixed(2),
    ];
  });

  const taxColumnHeader = isIntraState
    ? "CGST/SGST\n(Value | %)"
    : "IGST\n(Value | %)";

  autoTable(doc, {
    startY: tableStartY,
    head: [
      [
        "S.NO.",
        "PRODUCT NAME",
        "HSN",
        "QTY",
        "UNIT PRICE",
        "UNIT DISCOUNT",
        "TAXABLE VALUE",
        taxColumnHeader,
        "TOTAL\n(Including GST)",
      ],
    ],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [250, 250, 250],
      textColor: [30, 30, 30],
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.2,
      lineColor: [200, 200, 200],
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 10 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "right", cellWidth: 20 },
      6: { halign: "right", cellWidth: 22 },
      7: { halign: "center", cellWidth: 24 },
      8: { halign: "right", cellWidth: 24 },
    },
  });

  // 4. Net Total Section
  const finalY = (doc as any).lastAutoTable.finalY + 4;

  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);
  doc.line(14, finalY, 196, finalY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("NET TOTAL (In Value)", 140, finalY + 8, { align: "right" });
  doc.text(`Rs. ${Number(totalAmount || 0).toFixed(2)}`, 196, finalY + 8, {
    align: "right",
  });

  doc.line(14, finalY + 12, 196, finalY + 12);

  // 5. Website Promotional Banner & QR Code Box
  const promoY = finalY + 16;

  // Background box with gold accent border
  doc.setFillColor(253, 248, 242);
  doc.rect(14, promoY, 182, 32, "F");

  doc.setDrawColor(140, 107, 66);
  doc.setLineWidth(0.5);
  doc.rect(14, promoY, 182, 32, "D");

  // Render QR Code Image (24mm x 24mm)
  if (WEBSITE_QR_BASE64) {
    doc.addImage(WEBSITE_QR_BASE64, "PNG", 18, promoY + 4, 24, 24);
  }

  // Promotional Text Block
  const textX = 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(140, 107, 66);
  doc.text("EXPLORE OUR EXCLUSIVE COLLECTION ONLINE", textX, promoY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text(
    "Scan the QR code to discover our full range of handcrafted chandeliers, brass lighting & luxury home decor.",
    textX,
    promoY + 15,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(
    "Official Website: https://jamesandsons.in   |   Direct Manufacturer Pricing & Customization",
    textX,
    promoY + 21,
  );

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Thank you for shopping with James & Sons. For support & bespoke orders: operations@jamesandsons.in",
    textX,
    promoY + 26,
  );

  // 6. Watermark Logo Banner Box at bottom
  const logoBannerY = promoY + 38;
  doc.setFillColor(253, 248, 242);
  doc.rect(14, logoBannerY, 182, 22, "F");

  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(140, 107, 66);
  doc.text("J A M E S   &   S O N S", 105, logoBannerY + 15, {
    align: "center",
  });

  // 7. Authorized Signature Line & Round Logo Stamp/Seal
  const sigY = logoBannerY + 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text("Authorized Signature for M/S JAMES & SONS", 14, sigY);

  // Render Round Logo ONLY as an official seal stamp next to signature line
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 160, sigY - 24, 24, 24);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
