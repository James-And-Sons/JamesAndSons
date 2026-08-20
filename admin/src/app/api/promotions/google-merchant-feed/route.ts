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

    const xml = GoogleMerchantPromotionsService.generateXmlFeed(coupons);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate Google Merchant Promotions feed:", error);
    return NextResponse.json(
      { error: "Failed to generate Google Merchant Promotions feed" },
      { status: 500 },
    );
  }
}
