import { BRAND_CONFIG } from "@james-andsons/config";

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

export async function syncToPinterest(product: any) {
  const catalogId = process.env.PINTEREST_CATALOG_ID;
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  const adAccountId = process.env.PINTEREST_AD_ACCOUNT_ID;

  if (!catalogId || !accessToken) {
    console.warn(
      "[Pinterest Sync] Missing PINTEREST_CATALOG_ID or PINTEREST_ACCESS_TOKEN. Skipping Pinterest sync.",
    );
    return { success: false, reason: "Credentials missing" };
  }

  const getImages = (v?: any, p?: any) => {
    if (v && v.images && v.images.length > 0) return v.images;
    if (p && p.images && p.images.length > 0) return p.images;
    if (v && v.whiteBackgroundImages && v.whiteBackgroundImages.length > 0)
      return v.whiteBackgroundImages;
    if (p && p.whiteBackgroundImages && p.whiteBackgroundImages.length > 0)
      return p.whiteBackgroundImages;
    return [];
  };

  const items = [];
  const mapItem = (
    sku: string,
    name: string,
    price: number,
    images: string[],
    category?: string | null,
  ) => ({
    item_id: sku,
    attributes: {
      title: name,
      description: product.description || name,
      link: `${BRAND_CONFIG.storefrontUrl}/products/${product.slug}`,
      image_link: optimizeImageUrl(images[0]),
      price: `${Math.round(price)} ${BRAND_CONFIG.currencyCode}`,
      availability: product.stockQuantity > 0 ? "in stock" : "out of stock",
      condition: "new",
      brand: BRAND_CONFIG.name,
      google_product_category: refineGoogleCategory(
        name,
        category || product.googleProductCategory,
      ),
    },
  });

  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      const vPrice = v.d2cPrice || product.d2cPrice;
      const vImages = getImages(v, product);
      items.push(
        mapItem(
          v.sku,
          `${product.name} - ${v.name}`,
          vPrice,
          vImages,
          v.googleProductCategory,
        ),
      );
    }
  } else {
    const pImages = getImages(undefined, product);
    items.push(
      mapItem(
        product.sku,
        product.name,
        product.d2cPrice,
        pImages,
        product.googleProductCategory,
      ),
    );
  }

  const endpoint = `https://api.pinterest.com/v5/catalogs/items/batch`;
  console.log(
    `[Pinterest Sync] Pushing ${items.length} items to Pinterest Catalog...`,
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(adAccountId ? { "x-pinterest-ad-account-id": adAccountId } : {}),
    },
    body: JSON.stringify({
      operation: "UPSERT",
      catalog_id: catalogId,
      items: items,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinterest API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(
    "[Pinterest Sync] Pinterest API response:",
    JSON.stringify(result),
  );
  return { success: true, result };
}
