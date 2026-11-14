/**
 * Dynamically resolves the whitelabeled storefront URL without hardcoding.
 */
export function getStorefrontBaseUrl(overrideUrl?: string): string {
  if (overrideUrl && overrideUrl.trim().length > 0) {
    return overrideUrl.replace(/\/+$/, "");
  }

  const envUrl =
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, "");
  }

  // Fallback to generic origin if available in global browser context
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "https://example-store.com";
}

/**
 * Builds the canonical public product URL for a product slug.
 */
export function getProductPublicUrl(
  slug: string,
  baseUrlOverride?: string,
): string {
  const base = getStorefrontBaseUrl(baseUrlOverride);
  const cleanSlug = slug.replace(/^\/+/, "");
  return `${base}/products/${cleanSlug}`;
}
