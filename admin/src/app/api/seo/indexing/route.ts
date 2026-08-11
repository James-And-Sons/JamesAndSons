import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  inspectUrlStatus,
  requestUrlIndexing,
  getProductPublicUrl,
} from "@james-andsons/seo";

export async function POST(request: Request) {
  try {
    await requireAdmin("seo");
    const body = await request.json();
    const { productId, action } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId required" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetUrl = getProductPublicUrl(product.slug);

    if (action === "REQUEST_INDEXING") {
      const result = await requestUrlIndexing(targetUrl);

      await prisma.seoProductHealth.upsert({
        where: { productId },
        create: {
          productId,
          indexingStatus: "DISCOVERED_NOT_INDEXED",
          lastInspectedAt: new Date(),
        },
        update: {
          indexingStatus: "DISCOVERED_NOT_INDEXED",
          lastInspectedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: result.message });
    }

    const inspection = await inspectUrlStatus(targetUrl);

    await prisma.seoProductHealth.upsert({
      where: { productId },
      create: {
        productId,
        indexingStatus: inspection.indexingStatus,
        indexingCoverageState: inspection.coverageState,
        lastInspectedAt: new Date(inspection.lastInspectedAt),
      },
      update: {
        indexingStatus: inspection.indexingStatus,
        indexingCoverageState: inspection.coverageState,
        lastInspectedAt: new Date(inspection.lastInspectedAt),
      },
    });

    return NextResponse.json({ success: true, inspection });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Indexing action failed" },
      { status: 500 },
    );
  }
}
