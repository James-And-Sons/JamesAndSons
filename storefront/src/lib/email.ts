import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { calculateTaxBreakdown } from './invoice';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(order: any) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Skipping invoice email: RESEND_API_KEY not set.');
    return;
  }

  const { orderNumber, invoiceNumber, totalAmount, user, items, gstin, companyName, shippingAddress, taxAmount, shippingAmount, shippingState } = order;
  const date = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

  // Calculate Tax Breakdown
  const taxBreakdown = calculateTaxBreakdown(taxAmount, shippingState || '');

  // --- 1. Generate PDF ---
  const doc = new jsPDF() as any;
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(196, 160, 90);
  doc.text('JAMES & SONS', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('TAX INVOICE', 160, 25);
  
  doc.setDrawColor(196, 160, 90);
  doc.line(20, 30, 190, 30);

  // Invoice & Order Info
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('INVOICE NUMBER', 20, 45);
  doc.text('ORDER NUMBER', 90, 45);
  doc.text('DATE', 160, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(invoiceNumber || 'PENDING', 20, 52);
  doc.text(orderNumber, 90, 52);
  doc.text(date, 160, 52);

  // Billing & Shipping
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('BILLED TO', 20, 70);
  doc.text('SHIPPING ADDRESS', 110, 70);

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
    doc.rect(20, currentY - 5, 170, 20, 'F');
    doc.setFontSize(8);
    doc.setTextColor(140, 115, 65);
    doc.text('CUSTOMER GST DETAILS', 25, currentY + 2);
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(`${companyName || 'Registered Entity'}  |  GSTIN: ${gstin}`, 25, currentY + 10);
    currentY += 30;
  }

  // Items Table with HSN
  const tableData = items.map((item: any) => [
    { content: item.product.name + `\nHSN: ${item.product.hsnCode || 'N/A'}`, styles: { fontSize: 9 } },
    item.quantity,
    `INR ${item.unitPrice.toLocaleString('en-IN')}`,
    `INR ${item.total.toLocaleString('en-IN')}`
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['Description & HSN', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    headStyles: { fillColor: [240, 240, 240], textColor: [100, 100, 100], fontSize: 8, fontStyle: 'normal' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Totals & Tax Breakdown
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(100);
  
  let y = finalY;
  const leftX = 130;
  const rightX = 185;

  doc.text('Subtotal:', leftX, y);
  doc.text(`INR ${(totalAmount - taxAmount - shippingAmount).toLocaleString('en-IN')}`, rightX, y, { align: 'right' });
  
  y += 7;
  if (taxBreakdown.type === 'CGST/SGST') {
    doc.text('CGST:', leftX, y);
    doc.text(`INR ${taxBreakdown.cgst.toLocaleString('en-IN')}`, rightX, y, { align: 'right' });
    y += 7;
    doc.text('SGST:', leftX, y);
    doc.text(`INR ${taxBreakdown.sgst.toLocaleString('en-IN')}`, rightX, y, { align: 'right' });
  } else {
    doc.text('IGST:', leftX, y);
    doc.text(`INR ${taxBreakdown.igst.toLocaleString('en-IN')}`, rightX, y, { align: 'right' });
  }

  y += 7;
  doc.text('Shipping:', leftX, y);
  doc.text(shippingAmount === 0 ? 'FREE' : `INR ${shippingAmount.toLocaleString('en-IN')}`, rightX, y, { align: 'right' });
  
  y += 12;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text('Grand Total:', leftX, y);
  doc.setTextColor(196, 160, 90);
  doc.text(`INR ${totalAmount.toLocaleString('en-IN')}`, rightX, y, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(180);
  doc.text('Thank you for choosing James & Sons. Excellence in every detail.', 105, 280, { align: 'center' });

  const pdfOutput = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfOutput);

  // --- 2. Send Email ---
  try {
    const { data, error } = await resend.emails.send({
      from: 'James & Sons <orders@jamesandsons.in>',
      to: [user.email],
      subject: `Tax Invoice for Order ${orderNumber} - James & Sons`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>Thank you for your purchase!</h2>
          <p>Dear ${user.firstName},</p>
          <p>Your order <strong>${orderNumber}</strong> has been successfully processed. Please find your official Tax Invoice attached (Invoice: ${invoiceNumber || 'N/A'}).</p>
          <p>Our concierge team is already preparing your shipment. We will notify you as soon as it's on its way.</p>
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
      console.error('Failed to send invoice email:', error);
    } else {
      console.log('Invoice email with PDF sent successfully:', data?.id);
    }
  } catch (err) {
    console.error('Unexpected error sending invoice email:', err);
  }
}
