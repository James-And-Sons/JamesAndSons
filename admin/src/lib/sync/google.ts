import crypto from "crypto";
import fs from "fs";
import path from "path";
import { BRAND_CONFIG } from "@james-andsons/config";

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  // 1. Check for inline JSON string in env
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
        };
      }
    } catch {}
  }

  // 2. Check for explicit email and private key in env
  if (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  // 3. Check for credentials file path across potential working directories (Vercel serverless support)
  const credFilename =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    "jamesandsons-6562df87cb89.json";
  const candidatePaths = [
    path.isAbsolute(credFilename)
      ? credFilename
      : path.join(process.cwd(), credFilename),
    path.join(process.cwd(), "admin", credFilename),
    path.join(process.cwd(), "jamesandsons-6562df87cb89.json"),
    path.join(process.cwd(), "admin", "jamesandsons-6562df87cb89.json"),
    path.join(__dirname, credFilename),
    path.join(__dirname, "..", "..", "..", "jamesandsons-6562df87cb89.json"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, "utf8");
        const parsed = JSON.parse(content);
        if (parsed.client_email && parsed.private_key) {
          return {
            client_email: parsed.client_email,
            private_key: parsed.private_key,
          };
        }
      } catch (err) {
        console.warn(
          `[Google Merchant Sync] Failed to read credentials file at ${p}:`,
          err,
        );
      }
    }
  }

  return null;
}

async function getAccessToken(
  credentials: ServiceAccountCredentials,
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claimSet = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/content",
    aud: "https://oauth2.googleapis.com/token",
    exp,
    iat,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    "base64url",
  );
  const encodedClaim = Buffer.from(JSON.stringify(claimSet)).toString(
    "base64url",
  );
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer.sign(credentials.private_key, "base64url");

  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to obtain Google access token: ${res.status} - ${errorText}`,
    );
  }

  const data = await res.json();
  return data.access_token;
}

export async function syncToGoogleMerchant(product: any) {
  const merchantId = process.env.GOOGLE_MERCHANT_ID;
  const credentials = getServiceAccountCredentials();

  if (!merchantId || !credentials) {
    console.warn(
      "[Google Merchant Sync] Missing GOOGLE_MERCHANT_ID or Service Account Credentials. Skipping Google Merchant sync.",
    );
    return { success: false, reason: "Credentials missing" };
  }

  const accessToken = await getAccessToken(credentials);

  const getStorefrontUrl = () => {
    const base =
      process.env.NEXT_PUBLIC_STOREFRONT_URL ||
      BRAND_CONFIG.storefrontUrl ||
      "https://jamesandsons.in";
    if (!base || base.includes("localhost")) {
      return "https://jamesandsons.in";
    }
    return base.replace(/\/+$/, "");
  };

  const resolveImages = (v?: any, p?: any) => {
    if (v && v.images && v.images.length > 0) return v.images;
    if (p && p.images && p.images.length > 0) return p.images;
    if (v && v.whiteBackgroundImages && v.whiteBackgroundImages.length > 0)
      return v.whiteBackgroundImages;
    if (p && p.whiteBackgroundImages && p.whiteBackgroundImages.length > 0)
      return p.whiteBackgroundImages;
    return [];
  };

  // Build payload for new Google Merchant API v1beta
  const buildMerchantApiPayload = (
    sku: string,
    name: string,
    price: number,
    mrp: number,
    images: string[],
    category: string,
    brandName: string,
  ) => {
    const baseUrl = getStorefrontUrl();
    const primaryImage =
      images && images.length > 0
        ? images[0]
        : `${baseUrl}/images/placeholder.png`;
    const additionalImages =
      images && images.length > 1 ? images.slice(1, 10) : [];
    const micros = Math.round(price * 1000000).toString();

    return {
      channel: "ONLINE",
      contentLanguage: "en",
      feedLabel: "IN",
      offerId: sku,
      attributes: {
        title: name,
        description: product.description || name,
        link: `${baseUrl}/products/${product.slug}`,
        imageLink: primaryImage,
        ...(additionalImages.length > 0
          ? { additionalImageLinks: additionalImages }
          : {}),
        availability:
          (product.stockQuantity ?? 1) > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        price: {
          amountMicros: micros,
          currencyCode: BRAND_CONFIG.currencyCode || "INR",
        },
        ...(mrp && price < mrp
          ? {
              salePrice: {
                amountMicros: micros,
                currencyCode: BRAND_CONFIG.currencyCode || "INR",
              },
            }
          : {}),
        brand: brandName || BRAND_CONFIG.name,
        googleProductCategory:
          category || "Home & Garden > Lighting > Light Fixtures",
        condition: "NEW",
      },
    };
  };

  // Build payload for legacy Content API v2.1 fallback
  const formatPriceLegacy = (amount: number) => ({
    value: amount.toFixed(2),
    currency: BRAND_CONFIG.currencyCode || "INR",
  });

  const buildLegacyPayload = (
    sku: string,
    name: string,
    price: number,
    mrp: number,
    images: string[],
    category: string,
    brandName: string,
  ) => {
    const baseUrl = getStorefrontUrl();
    const primaryImage =
      images && images.length > 0
        ? images[0]
        : `${baseUrl}/images/placeholder.png`;
    const additionalImages =
      images && images.length > 1 ? images.slice(1, 10) : [];

    return {
      offerId: sku,
      title: name,
      description: product.description || name,
      link: `${baseUrl}/products/${product.slug}`,
      imageLink: primaryImage,
      ...(additionalImages.length > 0
        ? { additionalImageLinks: additionalImages }
        : {}),
      contentLanguage: "en",
      targetCountry: "IN",
      feedLabel: "IN",
      channel: "online",
      availability:
        (product.stockQuantity ?? 1) > 0 ? "in stock" : "out of stock",
      price: formatPriceLegacy(price),
      ...(mrp && price < mrp ? { salePrice: formatPriceLegacy(price) } : {}),
      brand: brandName || BRAND_CONFIG.name,
      googleProductCategory:
        category || "Home & Garden > Lighting > Light Fixtures",
      condition: "new",
      mpn: sku,
    };
  };

  const v1betaItems: any[] = [];
  const legacyEntries: any[] = [];
  let batchId = 1;

  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      const vPrice = v.d2cPrice || product.d2cPrice;
      const vMrp = v.mrp || product.mrp;
      const vImages = resolveImages(v, product);
      const vCategory =
        v.googleProductCategory ||
        product.googleProductCategory ||
        "Home & Garden > Lighting > Light Fixtures";
      const vBrand = v.brand || product.brand || BRAND_CONFIG.name;
      const title = `${product.name} - ${v.name}`;

      v1betaItems.push(
        buildMerchantApiPayload(
          v.sku,
          title,
          vPrice,
          vMrp,
          vImages,
          vCategory,
          vBrand,
        ),
      );
      legacyEntries.push({
        batchId: batchId++,
        merchantId,
        method: "insert",
        product: buildLegacyPayload(
          v.sku,
          title,
          vPrice,
          vMrp,
          vImages,
          vCategory,
          vBrand,
        ),
      });
    }
  } else {
    const pCategory =
      product.googleProductCategory ||
      "Home & Garden > Lighting > Light Fixtures";
    const pBrand = product.brand || BRAND_CONFIG.name;
    const pImages = resolveImages(undefined, product);

    v1betaItems.push(
      buildMerchantApiPayload(
        product.sku,
        product.name,
        product.d2cPrice,
        product.mrp,
        pImages,
        pCategory,
        pBrand,
      ),
    );
    legacyEntries.push({
      batchId: batchId++,
      merchantId,
      method: "insert",
      product: buildLegacyPayload(
        product.sku,
        product.name,
        product.d2cPrice,
        product.mrp,
        pImages,
        pCategory,
        pBrand,
      ),
    });
  }

  // 1. Primary Attempt: New Google Merchant API v1beta
  try {
    console.log(
      `[Google Merchant Sync] Attempting modern Merchant API v1beta sync for ${v1betaItems.length} items...`,
    );
    const results = [];
    for (const item of v1betaItems) {
      const v1betaEndpoint = `https://merchantapi.googleapis.com/products/v1beta/accounts/${merchantId}/productInputs:insert`;
      const res = await fetch(v1betaEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        const data = await res.json();
        results.push(data);
      } else {
        const errText = await res.text();
        console.warn(
          `[Google Merchant Sync] v1beta response status ${res.status}: ${errText}`,
        );
        throw new Error(`v1beta failed: ${res.status}`);
      }
    }

    console.log(
      "[Google Merchant Sync] Modern Merchant API v1beta sync completed successfully!",
    );
    return { success: true, apiVersion: "v1beta", results };
  } catch (v1betaErr: any) {
    console.warn(
      "[Google Merchant Sync] Modern Merchant API v1beta sync notice:",
      v1betaErr.message,
      ". Falling back to Content API v2.1...",
    );
  }

  // 2. Fallback Attempt: Legacy Content API v2.1 batch endpoint
  const legacyEndpoint =
    "https://shoppingcontent.googleapis.com/content/v2.1/products/batch";
  console.log(
    `[Google Merchant Sync] Pushing ${legacyEntries.length} items to Content API v2.1 fallback...`,
  );

  const response = await fetch(legacyEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ entries: legacyEntries }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Merchant Content API error: ${response.status} - ${errorText}`,
    );
  }

  const result = await response.json();
  console.log(
    "[Google Merchant Sync] Content API v2.1 batch response:",
    JSON.stringify(result),
  );
  return { success: true, apiVersion: "v2.1", result };
}

export async function deleteFromGoogleMerchant(sku: string) {
  const merchantId = process.env.GOOGLE_MERCHANT_ID;
  const credentials = getServiceAccountCredentials();

  if (!merchantId || !credentials) {
    console.warn(
      "[Google Merchant Sync] Missing GOOGLE_MERCHANT_ID or credentials. Skipping deletion.",
    );
    return { success: false, reason: "Credentials missing" };
  }

  const accessToken = await getAccessToken(credentials);

  // 1. Try modern Merchant API v1beta deletion
  try {
    const v1betaProductId = `online~en~IN~${sku}`;
    const v1betaEndpoint = `https://merchantapi.googleapis.com/products/v1beta/accounts/${merchantId}/productInputs/${encodeURIComponent(v1betaProductId)}`;
    const res = await fetch(v1betaEndpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok || res.status === 404) {
      return { success: true, apiVersion: "v1beta" };
    }
  } catch (err) {
    console.warn(
      "[Google Merchant Deletion] v1beta delete notice, trying v2.1 fallback...",
    );
  }

  // 2. Legacy Content API v2.1 fallback
  const productId = `online:en:IN:${sku}`;
  const legacyEndpoint = `https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}/products/${encodeURIComponent(productId)}`;

  const response = await fetch(legacyEndpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(
      `Google Merchant deletion error: ${response.status} - ${errorText}`,
    );
  }

  return { success: true, apiVersion: "v2.1" };
}
