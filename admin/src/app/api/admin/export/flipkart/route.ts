import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateFlipkartExcelFeed } from "@/lib/export/flipkartFeedGenerator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "all") as "unlisted" | "all";
    const categoryVertical = searchParams.get("vertical") || "Ceiling Lamp";
    const listedSkus = new Set(["JW06", "JW01", "JTF02"]);

    const allProducts = await prisma.product.findMany({
      include: {
        variants: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });

    const products =
      filter === "unlisted"
        ? allProducts.filter((p) => {
            const skus =
              p.variants && p.variants.length > 0
                ? p.variants.map((v) => v.sku)
                : [p.sku];
            return skus.some((s) => s && !listedSkus.has(s));
          })
        : allProducts;

    console.log(
      `[Flipkart Export] Generating Flipkart feed for ${products.length} products (Filter: ${filter}, Vertical: ${categoryVertical})...`,
    );

    const { buffer, filename } = generateFlipkartExcelFeed(products, {
      filter,
      categoryVertical,
    });

    const uint8Array = new Uint8Array(buffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": uint8Array.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("[Flipkart Export] CRITICAL FAILURE:", error);
    return NextResponse.json(
      {
        error: error.message || "Export failed",
      },
      { status: 500 },
    );
  }
}
