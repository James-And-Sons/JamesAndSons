import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  runPageSpeedScan,
  getProductPublicUrl,
  validateProductSchema,
  inspectUrlStatus,
  querySearchAnalytics,
} from "@james-andsons/seo";

export async function GET(request: Request) {
  try {
    await requireAdmin("seo");
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId required" },
        { status: 400 },
      );
    }

    const health = await prisma.seoProductHealth.findUnique({
      where: { productId },
    });

    return NextResponse.json({ health });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("seo");
    const body = await request.json();
    const { productId } = body;

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

    // Run scans concurrently
    const [pageSpeedResult, inspectionResult, analyticsData] =
      await Promise.all([
        runPageSpeedScan({ targetUrl }),
        inspectUrlStatus(targetUrl),
        querySearchAnalytics(28),
      ]);

    const schemaResult = validateProductSchema(product as any);

    // Calculate missing ALT text
    const missingAltCount = (product.images || []).length === 0 ? 1 : 0;

    const health = await prisma.seoProductHealth.upsert({
      where: { productId },
      create: {
        productId,
        indexingStatus: inspectionResult.indexingStatus,
        indexingCoverageState: inspectionResult.coverageState,
        lastInspectedAt: new Date(inspectionResult.lastInspectedAt),
        mobileLighthouseScore: pageSpeedResult.mobileLighthouseScore,
        desktopLighthouseScore: pageSpeedResult.desktopLighthouseScore,
        mobileLcp: pageSpeedResult.mobileLcp,
        mobileCls: pageSpeedResult.mobileCls,
        mobileInp: pageSpeedResult.mobileInp,
        desktopLcp: pageSpeedResult.desktopLcp,
        desktopCls: pageSpeedResult.desktopCls,
        desktopInp: pageSpeedResult.desktopInp,
        pageSpeedAuditWarnings: pageSpeedResult.warnings as any,
        schemaValidation: schemaResult as any,
        serpTitle: product.name,
        serpDescription: product.description.slice(0, 160),
        missingAltCount,
        topKeywords: analyticsData.topKeywords as any,
        lastScannedAt: new Date(),
      },
      update: {
        indexingStatus: inspectionResult.indexingStatus,
        indexingCoverageState: inspectionResult.coverageState,
        lastInspectedAt: new Date(inspectionResult.lastInspectedAt),
        mobileLighthouseScore: pageSpeedResult.mobileLighthouseScore,
        desktopLighthouseScore: pageSpeedResult.desktopLighthouseScore,
        mobileLcp: pageSpeedResult.mobileLcp,
        mobileCls: pageSpeedResult.mobileCls,
        mobileInp: pageSpeedResult.mobileInp,
        desktopLcp: pageSpeedResult.desktopLcp,
        desktopCls: pageSpeedResult.desktopCls,
        desktopInp: pageSpeedResult.desktopInp,
        pageSpeedAuditWarnings: pageSpeedResult.warnings as any,
        schemaValidation: schemaResult as any,
        serpTitle: product.name,
        serpDescription: product.description.slice(0, 160),
        missingAltCount,
        topKeywords: analyticsData.topKeywords as any,
        lastScannedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, health });
  } catch (error: any) {
    console.error("SEO Scan error:", error);
    return NextResponse.json(
      { error: error.message || "Scan failed" },
      { status: 500 },
    );
  }
}
