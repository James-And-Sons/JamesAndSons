import { NextRequest, NextResponse } from "next/server";
import { getTenantConfig } from "@james-andsons/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const tenantConfig = getTenantConfig();

  // If slug matches a known route, redirect or generate branded target
  let targetUrl = tenantConfig.brand.storefrontUrl;

  if (slug.startsWith("p-") || slug.startsWith("prod-")) {
    const productSlug = slug.replace(/^(p-|prod-)/, "");
    targetUrl = `${tenantConfig.brand.storefrontUrl}/products/${productSlug}`;
  } else if (slug.startsWith("c-") || slug.startsWith("cat-")) {
    const catSlug = slug.replace(/^(c-|cat-)/, "");
    targetUrl = `${tenantConfig.brand.storefrontUrl}/collections?category=${catSlug}`;
  } else if (slug === "b2b") {
    targetUrl = `${tenantConfig.brand.storefrontUrl}/b2b`;
  } else if (slug === "catalog") {
    targetUrl = `${tenantConfig.brand.storefrontUrl}/collections`;
  }

  const format = request.nextUrl.searchParams.get("format");

  if (format === "json") {
    return NextResponse.json({
      tenantId: tenantConfig.id,
      brandName: tenantConfig.brand.name,
      slug,
      targetUrl,
      qrLogo: tenantConfig.assets.qrWebsiteLogo || tenantConfig.assets.logoDark,
    });
  }

  // Redirect to target branded URL
  return NextResponse.redirect(targetUrl, { status: 307 });
}
