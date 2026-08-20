import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleMerchantPromotionsService } from "@/lib/services/googleMerchantPromotionsService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const isDownload = req.nextUrl.searchParams.get("download") === "true";

    const coupons = await (prisma as any).coupon.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    const tsv = GoogleMerchantPromotionsService.generateTsvFeed(coupons);

    const headers: Record<string, string> = {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    };

    if (isDownload) {
      headers["Content-Disposition"] =
        'attachment; filename="google_merchant_promotions_jamesandsons.tsv"';
    }

    return new NextResponse(tsv, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Failed to generate Google Merchant TSV feed:", error);
    return new NextResponse("Failed to generate Google Merchant TSV feed", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
