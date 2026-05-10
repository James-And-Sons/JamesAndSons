import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateTaxBreakdown } from './invoice';
import { prisma } from './prisma';
import { generateDiscountCode } from '@/app/checkout/actions';

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

  autoTable(doc, {
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
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'James & Sons <onboarding@resend.dev>';
    const { data, error } = await resend.emails.send({
      from: fromAddress,
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
      console.error('RESEND ERROR:', JSON.stringify(error, null, 2));
    } else {
      console.log('Invoice email with PDF sent successfully:', data?.id);
    }
  } catch (err) {
    console.error('Unexpected error sending invoice email:', err);
  }
}

export async function sendAbandonedCartNudge(email: string, cartData: any) {
  if (!process.env.RESEND_API_KEY) return;

  const discountCode = await generateDiscountCode(5); // Generate a 5% discount code

  try {
    await resend.emails.send({
      from: 'James & Sons < concierge@jamesandsons.in >',
      to: [email],
      subject: 'A Masterpiece Awaits You (and a 5% gift)',
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
      `
    });

    await prisma.abandonedCart.update({
      where: { id: email },
      data: { nudgeSent: true }
    });

    console.log(`Abandoned cart nudge sent to ${email}`);
  } catch (error) {
    console.error('Failed to send abandoned cart nudge:', error);
  }
}
