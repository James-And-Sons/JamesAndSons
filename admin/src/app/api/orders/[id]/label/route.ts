import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const totalWeight = order.items.reduce(
      (sum, item) => sum + item.quantity * (item.product.weight || 0.5),
      0,
    );

    const maxLen = Math.max(
      ...order.items.map((i) => i.product.length || 20),
      20,
    );
    const maxWid = Math.max(
      ...order.items.map((i) => i.product.breadth || 20),
      20,
    );
    const totalHgt = order.items.reduce(
      (sum, item) => sum + item.quantity * (item.product.height || 10),
      0,
    );

    const tracking =
      order.trackingNumber || `ATS-${Date.now().toString().slice(-10)}`;
    const amazonOrderId = order.amazonOrderId || order.orderNumber;
    const isAmazon = order.channel === "AMAZON" || !!order.amazonOrderId;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shipping Label - ${order.orderNumber}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #000;
      background: #fff;
    }
    .label-box {
      width: 148mm;
      min-height: 210mm;
      border: 2px solid #000;
      padding: 16px;
      box-sizing: border-box;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .logo {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .badge {
      background: #000;
      color: #fff;
      padding: 4px 8px;
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
    }
    .barcode-section {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .barcode {
      font-family: "Courier New", Courier, monospace;
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 4px;
      background: #f0f0f0;
      padding: 10px;
      display: inline-block;
      border: 1px dashed #000;
      margin-top: 6px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 10px;
      text-transform: uppercase;
      color: #555;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .address {
      font-size: 12px;
      line-height: 1.4;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 11px;
    }
    .details-table th, .details-table td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      text-align: left;
    }
    .details-table th {
      background: #f5f5f5;
    }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d97706;
      color: #fff;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    @media print {
      .print-btn { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print Label</button>

  <div class="label-box">
    <div class="header">
      <div class="logo">${isAmazon ? "amazon easy ship" : "JAMES &amp; SONS"}</div>
      <div class="badge">${isAmazon ? "PRE-PAID" : "STANDARD"}</div>
    </div>

    <div class="barcode-section">
      <div class="title">Courier AWB / Tracking ID</div>
      <div class="barcode">${tracking}</div>
      <div style="font-size: 11px; margin-top: 4px;">Carrier: ${isAmazon ? "Amazon Transportation Services (ATS)" : "Delhivery Direct"}</div>
    </div>

    <div class="grid">
      <div>
        <div class="title">SHIP TO (Buyer Address)</div>
        <div class="address">
          <strong>${order.user ? `${order.user.firstName} ${order.user.lastName}` : "Amazon Customer"}</strong><br>
          ${order.shippingAddress || "Address on Amazon File"}<br>
          ${order.shippingCity || ""}, ${order.shippingState || ""} - ${order.shippingPincode || ""}<br>
          Phone: ${order.shippingPhone || "Verified"}
        </div>
      </div>
      <div>
        <div class="title">SHIP FROM (Warehouse)</div>
        <div class="address">
          <strong>James &amp; Sons Operations</strong><br>
          3/28 CNI Church Compound, Civil Lines<br>
          Opposite Ghanta Ghar, Aligarh, UP - 202001<br>
          Phone: 9045808115
        </div>
      </div>
    </div>

    <div class="grid" style="border-bottom: none; margin-bottom: 0;">
      <div>
        <div class="title">Order Information</div>
        <div class="address">
          <strong>Order ID:</strong> ${amazonOrderId}<br>
          <strong>JNS Order #:</strong> ${order.orderNumber}<br>
          <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div>
        <div class="title">Package Specifications</div>
        <div class="address">
          <strong>Total Weight:</strong> ${totalWeight.toFixed(2)} kg<br>
          <strong>Dimensions:</strong> ${maxLen} x ${maxWid} x ${totalHgt} cm<br>
          <strong>Total Items:</strong> ${order.items.reduce((s, i) => s + i.quantity, 0)} units
        </div>
      </div>
    </div>

    <div style="margin-top: 16px;">
      <div class="title">Package Contents / Items</div>
      <table class="details-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
            <tr>
              <td>${item.product.name}</td>
              <td>${item.product.sku}</td>
              <td>${item.quantity}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error: any) {
    console.error("Error generating shipping label:", error);
    return new NextResponse("Error generating shipping label", { status: 500 });
  }
}
