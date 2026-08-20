import { Resend } from "resend";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateTaxBreakdown } from "./invoice";
import { prisma } from "./prisma";
import { generateDiscountCode } from "../app/checkout/actions";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(order: any) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Skipping invoice email: RESEND_API_KEY not set.");
    return;
  }

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
  } = order;
  const date = new Date().toLocaleDateString("en-IN", { dateStyle: "long" });

  // Calculate Tax Breakdown
  const taxBreakdown = calculateTaxBreakdown(taxAmount, shippingState || "");

  // --- 1. Generate PDF ---
  const doc = new jsPDF() as any;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(196, 160, 90);
  doc.text("JAMES & SONS", 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("TAX INVOICE", 160, 25);

  doc.setDrawColor(196, 160, 90);
  doc.line(20, 30, 190, 30);

  // Invoice & Order Info
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("INVOICE NUMBER", 20, 45);
  doc.text("ORDER NUMBER", 90, 45);
  doc.text("DATE", 160, 45);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(invoiceNumber || "PENDING", 20, 52);
  doc.text(orderNumber, 90, 52);
  doc.text(date, 160, 52);

  // Billing & Shipping
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("BILLED TO", 20, 70);
  doc.text("SHIPPING ADDRESS", 110, 70);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`${user.firstName} ${user.lastName}`, 20, 77);
  doc.setFontSize(9);
  doc.text(user.email, 20, 82);

  const splitAddress = doc.splitTextToSize(shippingAddress, 80);
  doc.text(splitAddress, 110, 77);

  // GST Info
  let currentY = 105;
  if (gstin) {
    doc.setFillColor(253, 250, 244);
    doc.rect(20, currentY - 5, 170, 20, "F");
    doc.setFontSize(8);
    doc.setTextColor(140, 115, 65);
    doc.text("CUSTOMER GST DETAILS", 25, currentY + 2);
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(
      `${companyName || "Registered Entity"}  |  GSTIN: ${gstin}`,
      25,
      currentY + 10,
    );
    currentY += 30;
  }

  // Items Table with HSN
  const tableData = items.map((item: any) => [
    {
      content: item.product.name + `\nHSN: ${item.product.hsnCode || "N/A"}`,
      styles: { fontSize: 9 },
    },
    item.quantity,
    `INR ${item.unitPrice.toLocaleString("en-IN")}`,
    `INR ${item.total.toLocaleString("en-IN")}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Description & HSN", "Qty", "Unit Price", "Total"]],
    body: tableData,
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [100, 100, 100],
      fontSize: 8,
      fontStyle: "normal",
    },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  // Totals & Tax Breakdown
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(100);

  let y = finalY;
  const leftX = 130;
  const rightX = 185;

  doc.text("Subtotal:", leftX, y);
  doc.text(
    `INR ${(totalAmount - taxAmount - shippingAmount).toLocaleString("en-IN")}`,
    rightX,
    y,
    { align: "right" },
  );

  y += 7;
  if (taxBreakdown.type === "CGST/SGST") {
    doc.text("CGST:", leftX, y);
    doc.text(`INR ${taxBreakdown.cgst.toLocaleString("en-IN")}`, rightX, y, {
      align: "right",
    });
    y += 7;
    doc.text("SGST:", leftX, y);
    doc.text(`INR ${taxBreakdown.sgst.toLocaleString("en-IN")}`, rightX, y, {
      align: "right",
    });
  } else {
    doc.text("IGST:", leftX, y);
    doc.text(`INR ${taxBreakdown.igst.toLocaleString("en-IN")}`, rightX, y, {
      align: "right",
    });
  }

  y += 7;
  doc.text("Shipping:", leftX, y);
  doc.text(
    shippingAmount === 0
      ? "FREE"
      : `INR ${shippingAmount.toLocaleString("en-IN")}`,
    rightX,
    y,
    { align: "right" },
  );

  y += 12;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Grand Total:", leftX, y);
  doc.setTextColor(196, 160, 90);
  doc.text(`INR ${totalAmount.toLocaleString("en-IN")}`, rightX, y, {
    align: "right",
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(180);
  doc.text(
    "Thank you for choosing James & Sons. Excellence in every detail.",
    105,
    280,
    { align: "center" },
  );

  const pdfOutput = doc.output("arraybuffer");
  const buffer = Buffer.from(pdfOutput);

  // --- 2. Send Email ---
  try {
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || "James & Sons <orders@jamesandsons.in>";
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [user.email],
      subject: `Tax Invoice for Order ${orderNumber} - James & Sons`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>Thank you for your purchase!</h2>
          <p>Dear ${user.firstName},</p>
          <p>Your order <strong>${orderNumber}</strong> has been successfully processed. Please find your official Tax Invoice attached (Invoice: ${invoiceNumber || "N/A"}).</p>
          <p>Our concierge team is already preparing your shipment. You can track your masterpieces in real-time as they journey to your space:</p>
          <div style="margin: 30px 0;">
            <a href="https://jamesandsons.in/track/${orderNumber}" style="background: #C4A05A; color: #fff; padding: 14px 28px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; font-weight: 500;">Track My Order</a>
          </div>
          <p>We will notify you again as soon as the courier is assigned.</p>
          <br />
          <p>Warm regards,<br />The James & Sons Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber || orderNumber}.pdf`,
          content: buffer,
        },
      ],
    });

    if (error) {
      console.error("RESEND ERROR:", JSON.stringify(error, null, 2));
    } else {
      console.log("Invoice email with PDF sent successfully:", data?.id);
    }
  } catch (err) {
    console.error("Unexpected error sending invoice email:", err);
  }
}

export async function sendAbandonedCartNudge(email: string, cartData: any) {
  if (!process.env.RESEND_API_KEY) return;

  const discountCode = await generateDiscountCode(5); // Generate a 5% discount code

  try {
    await resend.emails.send({
      from: "James & Sons < concierge@jamesandsons.in >",
      to: [email],
      subject: "A Masterpiece Awaits You (and a 5% gift)",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="font-weight: 300; color: #C4A05A; text-transform: uppercase; letter-spacing: 0.1em;">Your Selection is Reserved</h1>
          <p>We noticed you left something exquisite in your bag. At James & Sons, we believe every piece find its perfect home.</p>
          <p>To assist you in finalizing your choice, please enjoy a **5% complimentary reduction** on your entire order.</p>
          
          <div style="background: #fdfaf4; padding: 30px; border: 1px solid #f3e6cd; text-align: center; margin: 30px 0;">
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #8c7341; margin-bottom: 10px;">Use Code at Checkout</div>
            <div style="font-size: 24px; font-weight: 600; color: #111; letter-spacing: 0.1em;">${discountCode}</div>
            <div style="font-size: 11px; color: #999; margin-top: 10px;">Valid for 7 days only</div>
          </div>

          <a href="https://jamesandsons.in/checkout" style="display: block; background: #1a1a1a; color: #fff; text-align: center; padding: 18px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.2em; font-size: 12px;">Complete Your Order</a>
          
          <p style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">Our concierge team is available at vishal@jamesandsons.in for any assistance.</p>
        </div>
      `,
    });

    await prisma.abandonedCart.update({
      where: { id: email },
      data: { nudgeSent: true },
    });

    console.log(`Abandoned cart nudge sent to ${email}`);
  } catch (error) {
    console.error("Failed to send abandoned cart nudge:", error);
  }
}

export async function sendOperationsOrderNotification(order: any) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "Skipping operations order notification email: RESEND_API_KEY not set.",
    );
    return;
  }

  const opsEmail = process.env.OPERATIONS_EMAIL || "operations@jamesandsons.in";
  const adminBaseUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.jamesandsons.in";
  const orderId = order.id || order.orderNumber;
  const adminOrderUrl = `${adminBaseUrl}/orders/${orderId}`;
  const channel = (order.channel || "STOREFRONT").toUpperCase();
  const fulfillmentType =
    order.amazonFulfillmentType ||
    (channel === "AMAZON" ? "EASY_SHIP" : "SHIPROCKET");
  const isEasyShip = fulfillmentType === "EASY_SHIP";

  const customerName = order.user
    ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
    : "Customer";
  const customerEmail = order.user?.email || "N/A";
  const customerPhone = order.shippingPhone || order.user?.phone || "N/A";
  const address = order.shippingAddress || "Address details pending";
  const city = order.shippingCity || "";
  const state = order.shippingState || "";
  const pincode = order.shippingPincode || "";

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${item.product?.name || item.name || "Product"}</strong><br/>
        <span style="font-size: 11px; color: #777;">SKU: ${item.product?.sku || item.sku || "N/A"}</span>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">INR ${(item.unitPrice || 0).toLocaleString("en-IN")}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">INR ${(item.total || item.unitPrice * item.quantity || 0).toLocaleString("en-IN")}</td>
    </tr>
  `,
    )
    .join("");

  let instructionsHtml = "";

  if (channel === "AMAZON") {
    instructionsHtml = `
      <div style="background-color: #FFF8E1; border: 1px solid #FFE082; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #B78103; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">⚠️ AMAZON ORDER SPECIFIC INSTRUCTIONS</h3>
        <ul style="padding-left: 20px; margin: 10px 0; font-size: 13px; color: #444; line-height: 1.6;">
          <li style="margin-bottom: 8px;">
            <strong>Amazon PII Notice:</strong> Amazon SP-API restricts buyer personal data. The address/phone displayed above may be partial or missing.
            <br/><strong>Action Required:</strong> Log in to <a href="https://sellercentral.amazon.in" target="_blank" style="color: #C4A05A; font-weight: bold;">Amazon Seller Central</a>, copy the buyer's full name, shipping address, pincode, and contact number, and update them on the <a href="${adminOrderUrl}" target="_blank" style="color: #C4A05A; font-weight: bold;">Admin Order Details Page</a>.
          </li>
          ${
            isEasyShip
              ? `
          <li style="margin-bottom: 8px; color: #D32F2F;">
            <strong>AMAZON EASY SHIP DETECTED:</strong> Do <u>NOT</u> book this shipment on Shiprocket! Log in to Amazon Seller Central &rarr; Orders &rarr; Schedule Easy Ship Pickup, and print the official Amazon Easy Ship barcode label.
          </li>
          `
              : `
          <li style="margin-bottom: 8px;">
            <strong>AMAZON SELF-SHIP:</strong> After updating buyer address in the Admin Portal, assign courier and generate shipping label via Shiprocket on the Admin Order page.
          </li>
          `
          }
          <li><strong>SLA Deadline:</strong> Complete dispatch within 24 hours to avoid Amazon Late Shipment Rate (LSR) penalty.</li>
        </ul>
      </div>
    `;
  } else if (channel === "FLIPKART") {
    instructionsHtml = `
      <div style="background-color: #E3F2FD; border: 1px solid #90CAF9; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1565C0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">📦 FLIPKART ORDER INSTRUCTIONS</h3>
        <ul style="padding-left: 20px; margin: 10px 0; font-size: 13px; color: #444; line-height: 1.6;">
          <li style="margin-bottom: 8px;">Log in to Flipkart Seller Hub to generate Tax Invoice & Transport Manifest label.</li>
          <li style="margin-bottom: 8px;">Verify item SKU match against physical warehouse stock.</li>
          <li>Ensure transport label is taped securely before courier pickup slot.</li>
        </ul>
      </div>
    `;
  } else {
    instructionsHtml = `
      <div style="background-color: #FDFAF4; border: 1px solid #F3E6CD; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #8C7341; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">📋 STOREFRONT OPERATIONAL STEPS</h3>
        <ol style="padding-left: 20px; margin: 10px 0; font-size: 13px; color: #444; line-height: 1.6;">
          <li style="margin-bottom: 6px;"><strong>Pick Inventory:</strong> Retrieve physical SKU items from warehouse rack.</li>
          <li style="margin-bottom: 6px;"><strong>Quality Control (QC):</strong> Check finish quality, wiring, and lamp components before packaging.</li>
          <li style="margin-bottom: 6px;"><strong>White-Glove Packaging:</strong> Pack in luxury double-walled box with protective corner guards.</li>
          <li style="margin-bottom: 6px;"><strong>Documentation & Label:</strong> Print Tax Invoice & Shiprocket Shipping Label from Admin Panel.</li>
          <li><strong>Handover:</strong> Hand over package to assigned courier partner and confirm pickup scan.</li>
        </ol>
      </div>
    `;
  }

  try {
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || "James & Sons <orders@jamesandsons.in>";
    await resend.emails.send({
      from: fromAddress,
      to: [opsEmail],
      subject: `[NEW ORDER ALERT] #${order.orderNumber} (${channel}) - ₹${(order.totalAmount || 0).toLocaleString("en-IN")}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #222; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #1A1A1A; color: #C4A05A; padding: 20px 24px; text-align: left;">
            <h1 style="margin: 0; font-size: 18px; letter-spacing: 0.1em; text-transform: uppercase;">JAMES & SONS — OPERATIONS DISPATCH</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #ccc;">New Order Received via <strong>${channel}</strong></p>
          </div>

          <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
              <div>
                <span style="font-size: 11px; text-transform: uppercase; color: #888;">Order Number</span>
                <div style="font-size: 16px; font-weight: bold; color: #111;">#${order.orderNumber}</div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 11px; text-transform: uppercase; color: #888;">Total Amount</span>
                <div style="font-size: 16px; font-weight: bold; color: #C4A05A;">INR ${(order.totalAmount || 0).toLocaleString("en-IN")}</div>
              </div>
            </div>

            <!-- Customer & Delivery Summary -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                  <strong style="color: #666; text-transform: uppercase; font-size: 11px;">Customer Info</strong><br/>
                  <strong>${customerName}</strong><br/>
                  Phone: ${customerPhone}<br/>
                  Email: ${customerEmail}
                </td>
                <td style="width: 50%; vertical-align: top; padding-left: 12px;">
                  <strong style="color: #666; text-transform: uppercase; font-size: 11px;">Shipping Destination</strong><br/>
                  ${address}<br/>
                  ${city}${city && state ? ", " : ""}${state} ${pincode}
                </td>
              </tr>
            </table>

            <!-- Dynamic Guidelines -->
            ${instructionsHtml}

            <!-- Items Table -->
            <h4 style="margin: 20px 0 10px 0; font-size: 13px; text-transform: uppercase; color: #555;">Order Line Items</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f7f7f7;">
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Product & SKU</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Unit Price</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${adminOrderUrl}" style="background-color: #1A1A1A; color: #FFFFFF; padding: 14px 28px; text-decoration: none; font-size: 12px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block; border-radius: 4px;">Open Order in Admin Portal &rarr;</a>
            </div>
          </div>
          <div style="background-color: #f7f7f7; padding: 12px 24px; text-align: center; font-size: 11px; color: #888;">
            James & Sons Operations Desk • Automated Priority Alert
          </div>
        </div>
      `,
    });
    console.log(
      `[Operations Email] Notification sent successfully for order ${order.orderNumber} to ${opsEmail}`,
    );
  } catch (err) {
    console.error(
      `[Operations Email] Error sending notification for order ${order.orderNumber}:`,
      err,
    );
  }
}
