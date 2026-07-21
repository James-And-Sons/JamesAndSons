export interface IBrandConfig {
  name: string;
  legalName: string;
  tagline: string;
  domain: string;
  storefrontUrl: string;
  supportEmail: string;
  ordersEmail: string;
  currencySymbol: string;
  currencyCode: string;
  defaultGstRate: number;
}

export const BRAND_CONFIG: IBrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || process.env.BRAND_NAME || "James & Sons",
  legalName: process.env.BRAND_LEGAL_NAME || "James and Sons Bespoke Interiors",
  tagline: process.env.BRAND_TAGLINE || "Luxury Artisanal Lighting & Home Accessories",
  domain: process.env.NEXT_PUBLIC_BRAND_DOMAIN || "jamesandsons.in",
  storefrontUrl: process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in",
  supportEmail: process.env.SUPPORT_EMAIL || "support@jamesandsons.in",
  ordersEmail: process.env.RESEND_FROM_EMAIL || "orders@jamesandsons.in",
  currencySymbol: process.env.CURRENCY_SYMBOL || "₹",
  currencyCode: process.env.CURRENCY_CODE || "INR",
  defaultGstRate: Number(process.env.DEFAULT_GST_RATE || 18.0)
};
