import { DEFAULT_TENANT_CONFIG } from "@james-andsons/config";

export interface QuotePrintData {
  rfqNumber: string;
  date: string;
  validUntil?: string;
  customerName: string;
  email: string;
  phone?: string;
  companyName?: string;
  projectName?: string;
  notes?: string;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: {
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
    customSpecs?: any;
  }[];
}

export function printPdfQuotation(data: QuotePrintData) {
  const brand = DEFAULT_TENANT_CONFIG.brand;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate and print the quotation PDF.");
    return;
  }

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="font-weight: 600; color: #1a1a1a; font-size: 14px;">${item.productName}</div>
        <div style="font-family: monospace; font-size: 11px; color: #777; margin-top: 2px;">SKU: ${item.sku}</div>
        ${item.customSpecs?.notes ? `<div style="font-size: 11px; color: #b08940; margin-top: 4px; font-style: italic;">Specs: ${item.customSpecs.notes}</div>` : ""}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-family: monospace;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">${brand.currencySymbol}${item.unitPrice.toLocaleString("en-IN")}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace; font-weight: 600;">${brand.currencySymbol}${item.total.toLocaleString("en-IN")}</td>
    </tr>
  `,
    )
    .join("");

  const subtotal = data.items.reduce((acc, curr) => acc + curr.total, 0);

  const htmlContent = `
    <!DOCTYPE html>

    <html>
      <head>
        <title>Quotation_${data.rfqNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Mono&family=Libre+Baskerville&display=swap');
          body {
            font-family: 'Libre Baskerville', Georgia, serif;
            color: #222;
            margin: 0;
            padding: 40px;
            background: #fff;
            font-size: 13px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #b08940;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .brand {
            font-family: 'Cormorant Garamond', serif;
            font-size: 28px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #1a1a1a;
          }
          .brand-sub {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            color: #b08940;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .quote-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 24px;
            color: #b08940;
            text-align: right;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .section-title {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #b08940;
            margin-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #555;
            background: #f9f8f6;
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            margin-bottom: 40px;
          }
          .totals-table td {
            padding: 6px 12px;
            font-size: 12px;
          }
          .totals-table tr.grand-total td {
            font-weight: bold;
            font-size: 16px;
            color: #b08940;
            border-top: 2px solid #b08940;
            padding-top: 10px;
          }
          .footer-terms {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #777;
            line-height: 1.6;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">James & Sons</div>
            <div class="brand-sub">Luxury Architectural Lighting</div>
          </div>
          <div>
            <div class="quote-title">COMMERCIAL QUOTATION</div>
            <div style="font-family: 'DM Mono', monospace; font-size: 12px; color: #444; margin-top: 6px; text-align: right;">No: ${data.rfqNumber}</div>
            <div style="font-size: 11px; color: #777; margin-top: 2px; text-align: right;">Date: ${data.date}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <div class="section-title">Prepared For</div>
            <div style="font-weight: 600; font-size: 15px;">${data.companyName || data.customerName}</div>
            <div>Attn: ${data.customerName}</div>
            <div>Email: ${data.email}</div>
            ${data.phone ? `<div>Phone: ${data.phone}</div>` : ""}
          </div>
          <div style="text-align: right;">
            <div class="section-title">Project & Timeline</div>
            ${data.projectName ? `<div style="font-weight: 600;">Project: ${data.projectName}</div>` : ""}
            <div>Validity: 30 Days</div>
            <div>Payment Terms: 50% Advance, 50% Before Dispatch</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item Description & Custom Specs</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price (₹)</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right; font-family: monospace;">₹${subtotal.toLocaleString("en-IN")}</td>
          </tr>
          ${
            data.discountAmount > 0
              ? `
          <tr>
            <td style="color: #c0392b;">Trade Discount:</td>
            <td style="text-align: right; font-family: monospace; color: #c0392b;">-₹${data.discountAmount.toLocaleString("en-IN")}</td>
          </tr>
          `
              : ""
          }
          ${
            data.taxAmount > 0
              ? `
          <tr>
            <td>GST (18%):</td>
            <td style="text-align: right; font-family: monospace;">₹${data.taxAmount.toLocaleString("en-IN")}</td>
          </tr>
          `
              : ""
          }
          ${
            data.shippingAmount > 0
              ? `
          <tr>
            <td>Freight & Logistics:</td>
            <td style="text-align: right; font-family: monospace;">₹${data.shippingAmount.toLocaleString("en-IN")}</td>
          </tr>
          `
              : ""
          }
          <tr class="grand-total">
            <td>Total Offered:</td>
            <td style="text-align: right; font-family: monospace;">₹${data.totalAmount.toLocaleString("en-IN")}</td>
          </tr>
        </table>

        <div class="footer-terms">
          <strong>Terms & Conditions:</strong><br>
          1. All prices are in INR. Goods once sold are subject to James & Sons standard warranty rules.<br>
          2. Delivery lead time starts after receipt of advance payment and technical sign-off.<br>
          3. For assistance, contact trade@jamesandsons.com.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
