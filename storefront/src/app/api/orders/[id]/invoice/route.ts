import { NextResponse } from "next/server";
import { prisma } from "@james-andsons/db";
import { generateInvoicePdfBuffer } from "@/lib/pdf-invoice";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pdfBuffer = generateInvoicePdfBuffer(order);
    const filename = `Invoice_${order.invoiceNumber || order.orderNumber}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF invoice download:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF invoice" },
      { status: 500 },
    );
  }
}
