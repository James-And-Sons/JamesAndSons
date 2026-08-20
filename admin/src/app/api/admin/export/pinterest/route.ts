import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { BRAND_CONFIG } from "@james-andsons/config";

function escapeCSV(val: any) {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    str = `"${str}"`;
  }
  return str;
}

function refineGoogleCategory(name: string, category?: string | null): string {
  const cat = (category || "").trim();
  const parts = cat
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 4) return parts.join(" > ");

  const lowerName = name.toLowerCase();
  const lowerCat = cat.toLowerCase();

  if (lowerName.includes("chandelier") || lowerCat.includes("chandelier")) {
    return "Home & Garden > Lighting > Light Fixtures > Chandeliers";
  }
  if (
    lowerName.includes("wall") ||
    lowerCat.includes("wall") ||
    lowerName.includes("sconce") ||
    lowerName.includes("bracket")
  ) {
    return "Home & Garden > Lighting > Light Fixtures > Wall Light Fixtures";
  }
  if (lowerName.includes("lamp") || lowerCat.includes("lamp")) {
    return "Home & Garden > Lighting > Lamps";
  }
  if (
    lowerName.includes("pole") ||
    lowerName.includes("post") ||
    lowerCat.includes("outdoor") ||
    lowerName.includes("gate")
  ) {
    return "Home & Garden > Lighting > Light Fixtures > Outdoor Lighting > Post Lights";
  }
  if (
    lowerName.includes("pendant") ||
    lowerName.includes("dome") ||
    lowerName.includes("cone") ||
    lowerName.includes("ceiling") ||
    lowerName.includes("lantern")
  ) {
    return "Home & Garden > Lighting > Light Fixtures > Ceiling Light Fixtures";
  }

  if (parts.length === 3) {
    return `${parts.join(" > ")} > Ceiling Light Fixtures`;
  }

  return "Home & Garden > Lighting > Light Fixtures > Ceiling Light Fixtures";
}

function optimizeImageUrl(rawUrl?: string | null): string {
  const fallback = `${BRAND_CONFIG.storefrontUrl}/images/brand-placeholder.png`;
  if (!rawUrl || !rawUrl.trim()) return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith("http")) return fallback;

  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/upload/")) {
    if (!trimmed.includes("/f_auto")) {
      return trimmed.replace("/upload/", "/upload/f_auto,q_auto,w_1200/");
    }
  }
  return trimmed;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader
      ? authHeader.split(" ")[1]
      : req.nextUrl.searchParams.get("secret");
    const secret = process.env.INVENTORY_SYNC_WEBHOOK_SECRET;

    if (secret && token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { name: "asc" },
    });

    const headers = [
      "id",
      "title",
      "description",
      "link",
      "image_link",
      "price",
      "availability",
      "condition",
      "brand",
      "google_product_category",
      "color",
      "size",
      "material",
      "country_of_origin",
      "mpn",
    ];

    const rows = [];
    rows.push(headers.join(","));

    for (const p of products) {
      const getAvailability = (qty: number) =>
        qty > 0 ? "in stock" : "out of stock";
      const getProductLink = (slug: string) =>
        `${BRAND_CONFIG.storefrontUrl}/products/${slug}`;
      const getPriceText = (price: number) =>
        `${Math.round(price)} ${BRAND_CONFIG.currencyCode}`;

      const getImages = (v?: any, p?: any) => {
        if (v && v.images && v.images.length > 0) return v.images;
        if (p && p.images && p.images.length > 0) return p.images;
        if (v && v.whiteBackgroundImages && v.whiteBackgroundImages.length > 0)
          return v.whiteBackgroundImages;
        if (p && p.whiteBackgroundImages && p.whiteBackgroundImages.length > 0)
          return p.whiteBackgroundImages;
        return [];
      };

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const vPrice = v.d2cPrice || p.d2cPrice;
          const vImages = getImages(v, p);
          const brandVal = v.brand || p.brand || BRAND_CONFIG.name;
          const googleCatVal = refineGoogleCategory(
            `${p.name} - ${v.name}`,
            v.googleProductCategory || p.googleProductCategory,
          );
          const colorVal = v.color || p.color || "";
          const sizeVal = v.size || p.size || "";
          const materialVal = v.material || p.material || "";
          const originVal = v.countryOfOrigin || p.countryOfOrigin || "India";

          rows.push(
            [
              escapeCSV(v.sku),
              escapeCSV(`${p.name} - ${v.name}`),
              escapeCSV(p.description || p.name),
              escapeCSV(getProductLink(p.slug)),
              escapeCSV(optimizeImageUrl(vImages[0])),
              escapeCSV(getPriceText(vPrice)),
              escapeCSV(getAvailability(v.stockQuantity)),
              escapeCSV("new"),
              escapeCSV(brandVal),
              escapeCSV(googleCatVal),
              escapeCSV(colorVal),
              escapeCSV(sizeVal),
              escapeCSV(materialVal),
              escapeCSV(originVal),
              escapeCSV(v.sku),
            ].join(","),
          );
        }
      } else {
        const brandVal = p.brand || BRAND_CONFIG.name;
        const googleCatVal = refineGoogleCategory(
          p.name,
          p.googleProductCategory,
        );
        const pImages = getImages(undefined, p);
        const colorVal = p.color || "";
        const sizeVal = p.size || "";
        const materialVal = p.material || "";
        const originVal = p.countryOfOrigin || "India";

        rows.push(
          [
            escapeCSV(p.sku),
            escapeCSV(p.name),
            escapeCSV(p.description || p.name),
            escapeCSV(getProductLink(p.slug)),
            escapeCSV(optimizeImageUrl(pImages[0])),
            escapeCSV(getPriceText(p.d2cPrice)),
            escapeCSV(getAvailability(p.stockQuantity)),
            escapeCSV("new"),
            escapeCSV(brandVal),
            escapeCSV(googleCatVal),
            escapeCSV(colorVal),
            escapeCSV(sizeVal),
            escapeCSV(materialVal),
            escapeCSV(originVal),
            escapeCSV(p.sku),
          ].join(","),
        );
      }
    }

    const csvContent = rows.join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="pinterest_catalog_feed.csv"',
      },
    });
  } catch (error: any) {
    console.error("Pinterest CSV export failed:", error);
    return NextResponse.json(
      { error: error.message || "Export failed" },
      { status: 500 },
    );
  }
}
