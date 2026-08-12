import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  runPageSpeedScan,
  getProductPublicUrl,
  validateProductSchema,
  inspectUrlStatus,
  querySearchAnalytics,
} from "@james-andsons/seo";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max for large catalogs

// Bulk SEO scan using Server-Sent Events for live progress streaming
export async function GET(request: Request) {
  try {
    await requireAdmin("seo");
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchSize = Math.min(
    parseInt(searchParams.get("batchSize") || "5"),
    10,
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // Stream may already be closed
        }
      };

      try {
        // Fetch all active products
        const products = await prisma.product.findMany({
          where: {
            slug: { not: "test" },
          },
          select: {
            id: true,
            slug: true,
            name: true,
            images: true,
            description: true,
          },
          orderBy: { createdAt: "asc" },
        });

        const total = products.length;
        send({
          type: "init",
          total,
          message: `Starting bulk scan of ${total} products...`,
        });

        let completed = 0;
        let failed = 0;
        const errors: { productId: string; name: string; error: string }[] = [];

        // Fetch shared analytics once to avoid rate limits
        let analyticsData: any = { topKeywords: [] };
        try {
          analyticsData = await querySearchAnalytics(28);
        } catch {
          // Analytics may be unavailable
        }

        // Process in batches
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);

          await Promise.allSettled(
            batch.map(async (product) => {
              try {
                const targetUrl = getProductPublicUrl(product.slug);
                const [pageSpeedResult, inspectionResult] =
                  await Promise.allSettled([
                    runPageSpeedScan({ targetUrl }),
                    inspectUrlStatus(targetUrl),
                  ]);

                const psData =
                  pageSpeedResult.status === "fulfilled"
                    ? pageSpeedResult.value
                    : {
                        mobileLighthouseScore: null,
                        desktopLighthouseScore: null,
                        mobileLcp: null,
                        mobileCls: null,
                        mobileInp: null,
                        desktopLcp: null,
                        desktopCls: null,
                        desktopInp: null,
                        warnings: [],
                      };

                const insp =
                  inspectionResult.status === "fulfilled"
                    ? inspectionResult.value
                    : {
                        indexingStatus: "UNKNOWN",
                        coverageState: "UNKNOWN",
                        lastInspectedAt: new Date().toISOString(),
                      };

                const schemaResult = validateProductSchema(product as any);
                const missingAltCount =
                  (product.images || []).length === 0 ? 1 : 0;

                await prisma.seoProductHealth.upsert({
                  where: { productId: product.id },
                  create: {
                    productId: product.id,
                    indexingStatus: insp.indexingStatus,
                    indexingCoverageState: insp.coverageState,
                    lastInspectedAt: new Date(insp.lastInspectedAt),
                    mobileLighthouseScore: psData.mobileLighthouseScore,
                    desktopLighthouseScore: psData.desktopLighthouseScore,
                    mobileLcp: psData.mobileLcp,
                    mobileCls: psData.mobileCls,
                    mobileInp: psData.mobileInp,
                    desktopLcp: psData.desktopLcp,
                    desktopCls: psData.desktopCls,
                    desktopInp: psData.desktopInp,
                    pageSpeedAuditWarnings: psData.warnings as any,
                    schemaValidation: schemaResult as any,
                    serpTitle: product.name,
                    serpDescription: (product.description || "").slice(0, 160),
                    missingAltCount,
                    topKeywords: analyticsData.topKeywords as any,
                    lastScannedAt: new Date(),
                  },
                  update: {
                    indexingStatus: insp.indexingStatus,
                    indexingCoverageState: insp.coverageState,
                    lastInspectedAt: new Date(insp.lastInspectedAt),
                    mobileLighthouseScore: psData.mobileLighthouseScore,
                    desktopLighthouseScore: psData.desktopLighthouseScore,
                    mobileLcp: psData.mobileLcp,
                    mobileCls: psData.mobileCls,
                    mobileInp: psData.mobileInp,
                    desktopLcp: psData.desktopLcp,
                    desktopCls: psData.desktopCls,
                    desktopInp: psData.desktopInp,
                    pageSpeedAuditWarnings: psData.warnings as any,
                    schemaValidation: schemaResult as any,
                    serpTitle: product.name,
                    serpDescription: (product.description || "").slice(0, 160),
                    missingAltCount,
                    topKeywords: analyticsData.topKeywords as any,
                    lastScannedAt: new Date(),
                  },
                });

                completed++;
                send({
                  type: "progress",
                  completed,
                  failed,
                  total,
                  productId: product.id,
                  productName: product.name,
                  status: "success",
                });
              } catch (err: any) {
                failed++;
                errors.push({
                  productId: product.id,
                  name: product.name,
                  error: err.message || "Unknown error",
                });
                send({
                  type: "progress",
                  completed,
                  failed,
                  total,
                  productId: product.id,
                  productName: product.name,
                  status: "error",
                  error: err.message,
                });
              }
            }),
          );

          // Small delay between batches to avoid rate limits
          if (i + batchSize < products.length) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }

        send({
          type: "complete",
          completed,
          failed,
          total,
          errors,
          message: `Bulk scan complete. ${completed} succeeded, ${failed} failed.`,
        });
      } catch (err: any) {
        send({ type: "error", message: err.message || "Scan failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
