import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import { adminGetSystemConfig } from "@/app/account/config-actions";

/**
 * GET /api/orders/[id]/download-all-docs
 * Bundles all checked compliance & shipping document PDFs into a single ZIP file download.
 * Respects account-level DOC_DOWNLOAD_PREFS settings.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        awbNumber: true,
        trackingNumber: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Load account-level document preferences from database
    const docPrefs = (await adminGetSystemConfig("DOC_DOWNLOAD_PREFS")) || {
      gstInvoice: true,
      shippingLabel: true,
      pickupManifest: true,
      courierInvoice: true,
    };

    const host = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000";
    const zip = new JSZip();
    let fileCount = 0;

    // 1. GST Tax Invoice
    if (docPrefs.gstInvoice) {
      try {
        const invRes = await fetch(`${host}/api/orders/${id}/invoice`, {
          cache: "no-store",
        });
        if (invRes.ok) {
          const invBuffer = await invRes.arrayBuffer();
          zip.file(`GST_Tax_Invoice_${order.orderNumber || id}.pdf`, invBuffer);
          fileCount++;
        }
      } catch (err) {
        console.warn("[DownloadAllDocs] GST Invoice fetch warning:", err);
      }
    }

    // Load Shiprocket PDF URLs if shipment exists
    let labelUrl: string | null = null;
    let manifestUrl: string | null = null;
    let invoiceUrl: string | null = null;

    if (order.awbNumber || order.trackingNumber) {
      try {
        const { getShiprocketDocumentUrlsAction } =
          await import("../../../../orders/[id]/logistics-actions");
        const docs = await getShiprocketDocumentUrlsAction(id);
        if (docs.success) {
          labelUrl = docs.labelUrl || null;
          manifestUrl = docs.manifestUrl || null;
          invoiceUrl = docs.invoiceUrl || null;
        }
      } catch (err) {
        console.warn("[DownloadAllDocs] Logistics docs fetch warning:", err);
      }
    }

    // 2. Shipping Label PDF
    if (docPrefs.shippingLabel && labelUrl) {
      try {
        const labelRes = await fetch(labelUrl, { cache: "no-store" });
        if (labelRes.ok) {
          const labelBuffer = await labelRes.arrayBuffer();
          zip.file(
            `Shipping_Label_${order.orderNumber || id}.pdf`,
            labelBuffer,
          );
          fileCount++;
        }
      } catch (err) {
        console.warn("[DownloadAllDocs] Shipping Label fetch warning:", err);
      }
    }

    // 3. Pickup Manifest PDF
    if (docPrefs.pickupManifest && manifestUrl) {
      try {
        const manifestRes = await fetch(manifestUrl, { cache: "no-store" });
        if (manifestRes.ok) {
          const manifestBuffer = await manifestRes.arrayBuffer();
          zip.file(
            `Pickup_Manifest_${order.orderNumber || id}.pdf`,
            manifestBuffer,
          );
          fileCount++;
        }
      } catch (err) {
        console.warn("[DownloadAllDocs] Manifest fetch warning:", err);
      }
    }

    // 4. Courier / Shiprocket Invoice PDF
    if (docPrefs.courierInvoice && invoiceUrl) {
      try {
        const invRes = await fetch(invoiceUrl, { cache: "no-store" });
        if (invRes.ok) {
          const invBuffer = await invRes.arrayBuffer();
          zip.file(`Courier_Invoice_${order.orderNumber || id}.pdf`, invBuffer);
          fileCount++;
        }
      } catch (err) {
        console.warn("[DownloadAllDocs] Courier Invoice fetch warning:", err);
      }
    }

    if (fileCount === 0) {
      return NextResponse.json(
        { error: "No documents available to download for this order." },
        { status: 400 },
      );
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipUint8 = new Uint8Array(zipBuffer);
    const filename = `Order_Documents_${order.orderNumber || id}.zip`;

    return new NextResponse(zipUint8, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("[DownloadAllDocs] Error generating zip:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate documents package" },
      { status: 500 },
    );
  }
}
