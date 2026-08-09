import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleMerchantPromotionsService } from "@/lib/services/googleMerchantPromotionsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const coupons = await (prisma as any).coupon.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    const tsv = GoogleMerchantPromotionsService.generateTsvFeed(coupons);

    return new NextResponse(tsv, {
      status: 200,
      headers: {
        "Content-Type": "text/tab-separated-values; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="google_merchant_promotions_jamesandsons.tsv"',
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate Google Merchant TSV feed:", error);
    return NextResponse.json(
      { error: "Failed to generate Google Merchant TSV feed" },
      { status: 500 },
    );
  }
}
