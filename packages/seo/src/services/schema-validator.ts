import { SchemaValidationResult } from "../types";

interface MinimalProductData {
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  sku?: string | null;
  mrp?: number | null;
  d2cPrice?: number | null;
  stockQuantity?: number | null;
  images?: string[] | null;
  hsnCode?: string | null;
  brand?: string | null;
  specs?: any;
  customAttributes?: any;
}

/**
 * Validates product data against Google Rich Results (JSON-LD) structured data requirements.
 */
export function validateProductSchema(
  product: MinimalProductData,
): SchemaValidationResult {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  // Required Product Fields
  if (!product.name || product.name.trim().length === 0) {
    missingRequired.push("Product Name (`name`)");
  }
  if (!product.images || product.images.length === 0) {
    missingRequired.push("Product Image (`image`)");
  }

  // Offer Schema Fields
  const price = product.d2cPrice || product.mrp;
  if (!price || price <= 0) {
    missingRequired.push("Offer Price (`offers.price`)");
  }

  // Stock / Availability
  const hasInStock =
    product.stockQuantity !== null &&
    product.stockQuantity !== undefined &&
    product.stockQuantity > 0;

  // GTIN / Identifiers (GTIN, MPN, SKU)
  const gtin =
    product.specs?.gtin || product.customAttributes?.gtin || product.hsnCode;
  if (!gtin && !product.sku) {
    missingRequired.push("Product GTIN/MPN or SKU (`gtin` / `sku`)");
  } else if (!gtin) {
    missingRecommended.push("Global Trade Item Number (`gtin`)");
  }

  // Brand
  if (!product.brand && !product.specs?.brand) {
    missingRecommended.push("Brand Name (`brand`)");
  }

  // Description
  if (!product.description || product.description.trim().length < 20) {
    missingRecommended.push("Detailed Description (`description`)");
  }

  const hasProductSchema = !!(
    product.name &&
    product.images &&
    product.images.length > 0
  );
  const hasOfferSchema = !!(price && price > 0);
  const hasAggregateRatingSchema = !!(
    product.specs?.rating || product.customAttributes?.rating
  );

  const isValid = missingRequired.length === 0;

  return {
    hasProductSchema,
    hasOfferSchema,
    hasAggregateRatingSchema,
    hasInStockSchema: hasInStock,
    missingRequiredFields: missingRequired,
    missingRecommendedFields: missingRecommended,
    isValid,
  };
}
