import { ITenantConfig } from "./index";

/**
 * ============================================================================
 * WHITE-LABEL CENTRALIZED CMS CONFIGURATION FILE
 * ============================================================================
 * Edit this single file when deploying the platform for a new client/tenant.
 * All branding, assets, favicons, text copy, contact details, currency,
 * theme colors, and feature toggles are defined here.
 */

export const TENANT_CMS_CONFIG: ITenantConfig = {
  id: process.env.NEXT_PUBLIC_TENANT_ID || "james-andsons",

  brand: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME || "James & Sons",
    shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "James & Sons",
    adminPwaName: "James & Sons Admin",
    legalName: "James & Sons Illumination Pvt. Ltd.",
    tagline: "Let your light shine before others",
    domain: process.env.NEXT_PUBLIC_DOMAIN || "jamesandsons.in",
    storefrontUrl:
      process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in",
    supportEmail:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@jamesandsons.in",
    ordersEmail:
      process.env.NEXT_PUBLIC_ORDERS_EMAIL || "orders@jamesandsons.in",
    phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 98765 43210",
    address:
      "Plot No. 42, Luxury Illumination Estate, Industrial Area, Aligarh, UP - 202001",
    social: {
      instagram: "https://instagram.com/jamesandsons.in",
      pinterest: "https://pinterest.com/jamesandsons",
      linkedin: "https://linkedin.com/company/jamesandsons",
    },
    currencySymbol: "₹",
    currencyCode: "INR",
    defaultGstRate: 18,
  },

  assets: {
    logoLight: "/images/logo-light.png",
    logoDark: "/images/logo-dark.png",
    favicon: "/favicon.ico",
    appleTouchIcon: "/icons/icon-192x192.png",
    qrWebsiteLogo: "/images/qr-brand-logo.png",
    placeholderImage: "/images/product-placeholder.jpg",
  },

  theme: {
    preset: "luxury-gold",
    colors: {
      primary: "#C4A05A",
      primaryLight: "#E2C882",
      primaryPale: "#F5E9C8",
      background: "#0D0B08",
      surface: "#14110C",
      surface2: "#1C1812",
      text: "#F7F4EF",
      textMuted: "#9A9084",
      textDim: "#635B50",
      border: "#2A241B",
      borderAccent: "#C4A05A",
      light: {
        background: "#FDFCFB",
        surface: "#FFFFFF",
        surface2: "#F4F1EA",
        text: "#1A1713",
        textMuted: "#666055",
        textDim: "#999285",
        border: "#E5DEC9",
        borderAccent: "#C4A05A",
      },
      dark: {
        background: "#0D0B08",
        surface: "#14110C",
        surface2: "#1C1812",
        text: "#F7F4EF",
        textMuted: "#9A9084",
        textDim: "#635B50",
        border: "#2A241B",
        borderAccent: "#C4A05A",
      },
    },
    typography: {
      headingFont: "Cinzel, serif",
      bodyFont: "Inter, sans-serif",
      monoFont: "JetBrains Mono, monospace",
    },
    borderRadius: {
      button: "2px",
      card: "4px",
      input: "2px",
    },
  },

  featureFlags: {
    enableB2bPortal: true,
    enableInquiryMode: true,
    enableCartCheckout: true,
    enableReviews: true,
    enableNdrPortal: true,
    enableCustomQuotePdf: true,
  },

  dictionary: {
    // Header & Navigation
    "nav.catalog": "Explore Catalog",
    "nav.collections": "Collections & Categories",
    "nav.spaces": "Shop By Space",
    "nav.b2b": "B2B Trade Portal",
    "nav.contact": "Concierge Contact",
    "nav.cart": "Shopping Bag",
    "nav.account": "My Account",

    // Hero & Home Section
    "home.hero_subtitle": "OUR PUBLICATIONS",
    "home.hero_title": "Heritage Illumination Craftsmanship",
    "home.hero_description":
      "Curating brilliance for grand estates, luxury residences, and architectural spaces.",
    "home.cta_explore": "Explore Collection",
    "home.cta_quote": "Request Custom Quote",

    // Catalog & PDP
    "catalog.filter_title": "Refine Collection",
    "catalog.sort_by": "Sort By",
    "pdp.add_to_cart": "Add to Shopping Bag",
    "pdp.request_b2b_quote": "Request B2B Trade Pricing",
    "pdp.in_stock": "In Stock — Ready to Ship",
    "pdp.gst_inclusive": "Prices inclusive of all applicable GST taxes",

    // Checkout & Cart
    "checkout.title": "Luxury Express Checkout",
    "checkout.address_section": "Shipping & Delivery Address",
    "checkout.payment_section": "Select Payment Gateway",
    "checkout.place_order": "Confirm & Pay Order",

    // Footers & Legal
    "footer.rights_reserved": "All Rights Reserved",
    "footer.tagline": "Let your light shine before others",
  },
};

/**
 * Text translation resolver reading directly from the central CMS configuration file.
 */
export function t(key: string, fallback?: string): string {
  if (TENANT_CMS_CONFIG.dictionary && TENANT_CMS_CONFIG.dictionary[key]) {
    return TENANT_CMS_CONFIG.dictionary[key];
  }
  return fallback || key;
}
