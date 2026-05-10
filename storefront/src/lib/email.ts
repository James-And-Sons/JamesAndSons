import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(order: any) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Skipping invoice email: RESEND_API_KEY not set.');
    return;
  }

  const { orderNumber, totalAmount, user, items, gstin, companyName, shippingAddress, taxAmount, shippingAmount } = order;
  const date = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

  // --- 1. Generate PDF ---
  const doc = new jsPDF() as any;
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(196, 160, 90); // James & Sons Gold
  doc.text('JAMES & SONS', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('TAX INVOICE', 160, 25);
  
  doc.setDrawColor(196, 160, 90);
  doc.line(20, 30, 190, 30);

  // Order Info
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('ORDER NUMBER', 20, 45);
  doc.text('DATE', 160, 45);
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(orderNumber, 20, 52);
  doc.text(date, 160, 52);

  // Billing & Shipping
  doc.setFontSize(9);
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
    doc.setFontSize(9);
    doc.setTextColor(140, 115, 65);
    doc.text('GST DETAILS', 25, currentY + 2);
    doc.setTextColor(0);
    doc.text(`${companyName || 'Registered Entity'}  |  GSTIN: ${gstin}`, 25, currentY + 10);
    currentY += 30;
  }

  // Items Table
  const tableData = items.map((item: any) => [
    item.product.name,
    item.quantity,
    `INR ${item.unitPrice.toLocaleString('en-IN')}`,
    `INR ${item.total.toLocaleString('en-IN')}`
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
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

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Subtotal:', 140, finalY);
  doc.text('Tax:', 140, finalY + 7);
  doc.text('Shipping:', 140, finalY + 14);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Grand Total:', 140, finalY + 25);
  
  doc.setFontSize(10);
  doc.text(`INR ${(totalAmount - taxAmount - shippingAmount).toLocaleString('en-IN')}`, 175, finalY, { align: 'right' });
  doc.text(`INR ${taxAmount.toLocaleString('en-IN')}`, 175, finalY + 7, { align: 'right' });
  doc.text(shippingAmount === 0 ? 'FREE' : `INR ${shippingAmount.toLocaleString('en-IN')}`, 175, finalY + 14, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setTextColor(196, 160, 90);
  doc.text(`INR ${totalAmount.toLocaleString('en-IN')}`, 175, finalY + 25, { align: 'right' });

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
      subject: `Invoice for Order ${orderNumber} - James & Sons`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>Thank you for your order!</h2>
          <p>Dear ${user.firstName},</p>
          <p>We've received your order <strong>${orderNumber}</strong>. Please find your official tax invoice attached to this email as a PDF.</p>
          <p>Our concierge team will reach out to you shortly to coordinate the delivery and installation of your items.</p>
          <br />
          <p>Warm regards,<br />The James & Sons Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice_${orderNumber}.pdf`,
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
