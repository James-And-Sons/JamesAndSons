import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * GET / POST /api/accounting/quarterly-gst
 * Compiles GST quarterly report and emails to accounts@jamesandsons.in + CA email ID
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const quarter = body.quarter || calculateCurrentQuarter();
    const year = body.year || new Date().getFullYear();

    const { startDate, endDate } = getQuarterDateRange(quarter, year);

    // Fetch all orders in the date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
      },
      include: {
        items: { include: { product: true } },
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch CA Email from SystemConfig
    const caEmailConfig = await prisma.systemConfig.findUnique({
      where: { key: "ca_email" },
    });
    const caEmail = (caEmailConfig?.value as any)?.email || "";

    // Calculate GST metrics
    let totalTaxableValue = 0;
    let totalTaxAmount = 0;
    let totalGrossSales = 0;
    let b2cCount = 0;
    let b2bCount = 0;

    const itemsSummary: Array<{
      orderNumber: string;
      date: string;
      channel: string;
      customer: string;
      gstin: string;
      taxable: number;
      cgst: number;
      sgst: number;
      igst: number;
      total: number;
    }> = [];

    orders.forEach((o) => {
      const taxable = o.totalAmount - o.taxAmount - o.shippingAmount;
      const isInterstate =
        o.shippingState && o.shippingState.toLowerCase() !== "delhi"; // Assumption: Delhi HQ
      const cgst = isInterstate ? 0 : o.taxAmount / 2;
      const sgst = isInterstate ? 0 : o.taxAmount / 2;
      const igst = isInterstate ? o.taxAmount : 0;

      totalTaxableValue += taxable;
      totalTaxAmount += o.taxAmount;
      totalGrossSales += o.totalAmount;

      if (o.channel === "B2B") b2bCount++;
      else b2cCount++;

      itemsSummary.push({
        orderNumber: o.orderNumber,
        date: o.createdAt.toISOString().split("T")[0],
        channel: o.channel || "D2C",
        customer: `${o.user.firstName} ${o.user.lastName}`.trim(),
        gstin: "N/A",
        taxable: Math.round(taxable * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        total: Math.round(o.totalAmount * 100) / 100,
      });
    });

    // Send emails to accounts@jamesandsons.in and CA email if configured
    const recipientEmails = ["accounts@jamesandsons.in"];
    if (caEmail && caEmail.includes("@")) {
      recipientEmails.push(caEmail.trim());
    }

    if (resend) {
      const reportHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
          <h2 style="color: #4c6ef5; border-bottom: 2px solid #4c6ef5; padding-bottom: 8px;">
            📄 GST Quarterly Report — ${quarter} ${year}
          </h2>
          <p>Official Tax Return Sales Compilation for <strong>James & Sons</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f4f5f7;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Quarter Period:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Invoices:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${orders.length} (B2C: ${b2cCount}, B2B: ${b2bCount})</td>
            </tr>
            <tr style="background: #f4f5f7;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Taxable Value:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹${totalTaxableValue.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total GST Tax Collected:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹${totalTaxAmount.toLocaleString("en-IN")}</td>
            </tr>
            <tr style="background: #eef2ff;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Gross Sales Value:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #4c6ef5;">₹${totalGrossSales.toLocaleString("en-IN")}</td>
            </tr>
          </table>

          <p style="font-size: 12px; color: #666;">
            Report compiled automatically on ${new Date().toLocaleString("en-IN")}. Recipients: ${recipientEmails.join(", ")}
          </p>
        </div>
      `;

      await resend.emails.send({
        from: "James & Sons Accounting <accounting@jamesandsons.in>",
        to: recipientEmails,
        subject: `[GST Report] ${quarter} ${year} Tax Return Summary — James & Sons`,
        html: reportHtml,
      });
    }

    return NextResponse.json({
      success: true,
      quarter,
      year,
      recipients: recipientEmails,
      ordersCount: orders.length,
      totalTaxableValue,
      totalTaxAmount,
      totalGrossSales,
    });
  } catch (error: any) {
    console.error("[GST Quarterly Report Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

function calculateCurrentQuarter(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 4 && month <= 6) return "Q1";
  if (month >= 7 && month <= 9) return "Q2";
  if (month >= 10 && month <= 12) return "Q3";
  return "Q4";
}

function getQuarterDateRange(quarter: string, year: number) {
  let startMonth = 3; // April (0-indexed 3)
  let endMonth = 5; // June
  let startYear = year;
  let endYear = year;

  if (quarter === "Q2") {
    startMonth = 6;
    endMonth = 8;
  } else if (quarter === "Q3") {
    startMonth = 9;
    endMonth = 11;
  } else if (quarter === "Q4") {
    startMonth = 0;
    endMonth = 2;
    endYear = year + 1;
  }

  const startDate = new Date(Date.UTC(startYear, startMonth, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(endYear, endMonth + 1, 0, 23, 59, 59));
  return { startDate, endDate };
}
