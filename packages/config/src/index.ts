export interface IBrandConfig {
  name: string;
  shortName: string;
  adminPwaName: string;
  legalName: string;
  tagline: string;
  domain: string;
  storefrontUrl: string;
  supportEmail: string;
  ordersEmail: string;
  phone: string;
  address: string;
  social?: {
    instagram?: string;
    pinterest?: string;
    linkedin?: string;
    twitter?: string;
  };
  currencySymbol: string;
  currencyCode: string;
  defaultGstRate: number;
}

export interface IColorPalette {
  primary: string;
  primaryLight: string;
  primaryPale: string;
  background: string;
  surface: string;
  surface2: string;
  text: string;
  textMuted: string;
  textDim: string;
  border: string;
  borderAccent: string;
}

export interface ITenantThemeConfig {
  preset: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryPale: string;
    background: string;
    surface: string;
    surface2: string;
    text: string;
    textMuted: string;
    textDim: string;
    border: string;
    borderAccent: string;
    light?: Partial<IColorPalette>;
    dark?: Partial<IColorPalette>;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    googleFontsUrl?: string;
  };
  borderRadius: {
    button: string;
    card: string;
    input: string;
  };
}

export interface ITenantFeatureFlags {
  enableB2bPortal: boolean;
  enableInquiryMode: boolean;
  enableCartCheckout: boolean;
  enableReviews: boolean;
  enableNdrPortal: boolean;
  enableCustomQuotePdf: boolean;
}

export interface ITenantAssets {
  logoLight?: string;
  logoDark?: string;
  favicon?: string;
  appleTouchIcon?: string;
  qrWebsiteLogo?: string;
  placeholderImage?: string;
}

export interface ITenantConfig {
  id: string;
  brand: IBrandConfig;
  theme: ITenantThemeConfig;
  featureFlags: ITenantFeatureFlags;
  assets: ITenantAssets;
  dictionary: Record<string, string>;
}

export const DEFAULT_DICTIONARY: Record<string, string> = {
  "common.brand_name": "James & Sons",
  "common.tagline": "Let your light shine before others",
  "common.tagline_citation": "Matthew 5:16",
  "common.cta.shop_collection": "Shop Collection",
  "common.cta.b2b_portal": "B2B Portal",
  "common.cta.enquire_whatsapp": "Enquire on WhatsApp",
  "common.cta.add_to_cart": "Add to Cart",
  "common.cta.raise_ticket": "Raise a Ticket",
  "common.cta.checkout": "Proceed to Checkout",
  "common.cta.submit": "Submit Request",
  "hero.eyebrow": "The 2026 Collection",
  "hero.title_line1": "Illuminate",
  "hero.title_line2": "with Purpose",
  "hero.sub":
    "Explore India's premier B2B & D2C ecosystem for luxury lighting. Masterfully crafted chandeliers engineered for sustainable brilliance.",
  "hero.stat_1_num": "90+",
  "hero.stat_1_label": "CRI Rating",
  "hero.stat_2_num": "100%",
  "hero.stat_2_label": "Handcrafted",
  "footer.company_desc":
    "Curators of luxury illumination. Elevating spaces with heritage craftsmanship.",
  "footer.copyright": "© {year} {brandName}. All rights reserved.",
  "footer.support": "Customer Support & Concierge",
  "cart.title": "Your Cart",
  "cart.empty": "Your cart is empty",
  "cart.free_shipping_qualify": "You qualify for Free Express Shipping!",
  "pdp.inquire_price": "Request Custom B2B Quote",
  "pdp.specs_title": "Technical Specifications & Compliance",
  "pdp.warranty_badge": "Official Warranty & BIS Certified",
};

export const BRAND_CONFIG: IBrandConfig = {
  name:
    process.env.NEXT_PUBLIC_BRAND_NAME ||
    process.env.BRAND_NAME ||
    "James & Sons",
  shortName:
    process.env.NEXT_PUBLIC_BRAND_SHORT_NAME ||
    process.env.BRAND_SHORT_NAME ||
    "James & Sons",
  adminPwaName:
    process.env.NEXT_PUBLIC_ADMIN_PWA_NAME ||
    process.env.ADMIN_PWA_NAME ||
    "Admin J&S",
  legalName: process.env.BRAND_LEGAL_NAME || "James and Sons Bespoke Interiors",
  tagline:
    process.env.BRAND_TAGLINE || "Luxury Artisanal Lighting & Home Accessories",
  domain: process.env.NEXT_PUBLIC_BRAND_DOMAIN || "jamesandsons.in",
  storefrontUrl:
    process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://jamesandsons.in",
  supportEmail: process.env.SUPPORT_EMAIL || "support@jamesandsons.in",
  ordersEmail: process.env.RESEND_FROM_EMAIL || "orders@jamesandsons.in",
  phone: process.env.BRAND_PHONE || "+91 98765 43210",
  address:
    process.env.BRAND_ADDRESS ||
    "CNI Church Compound Civil Lines, Aligarh, Uttar Pradesh India - 202001",
  social: {
    instagram: "https://instagram.com/jamesandsons",
    pinterest: "https://pin.it/1KZxSIww1",
    linkedin: "https://linkedin.com/company/jamesandsons",
  },
  currencySymbol: process.env.CURRENCY_SYMBOL || "₹",

  currencyCode: process.env.CURRENCY_CODE || "INR",
  defaultGstRate: Number(process.env.DEFAULT_GST_RATE || 18.0),
};

export const DEFAULT_TENANT_CONFIG: ITenantConfig = {
  id: process.env.NEXT_PUBLIC_TENANT_ID || "james-and-sons",
  brand: BRAND_CONFIG,
  theme: {
    preset: "luxury-gold",
    colors: {
      primary: "#c4a05a",
      primaryLight: "#e2c882",
      primaryPale: "#f5e9c8",
      background: "#0a0a0b",
      surface: "#16161a",
      surface2: "#1e1e24",
      text: "#d4cfc4",
      textMuted: "#6b6860",
      textDim: "#3a3a42",
      border: "rgba(255,255,255,0.07)",
      borderAccent: "rgba(196,160,90,0.3)",
      light: {
        primary: "#a88338",
        primaryLight: "#c4a05a",
        primaryPale: "#f7f1e3",
        background: "#faf8f5",
        surface: "#ffffff",
        surface2: "#f3f0e8",
        text: "#1a1a1e",
        textMuted: "#66635b",
        textDim: "#8c887e",
        border: "rgba(0,0,0,0.08)",
        borderAccent: "rgba(168,131,56,0.3)",
      },
      dark: {
        primary: "#c4a05a",
        primaryLight: "#e2c882",
        primaryPale: "#f5e9c8",
        background: "#0a0a0b",
        surface: "#16161a",
        surface2: "#1e1e24",
        text: "#d4cfc4",
        textMuted: "#6b6860",
        textDim: "#3a3a42",
        border: "rgba(255,255,255,0.07)",
        borderAccent: "rgba(196,160,90,0.3)",
      },
    },
    typography: {
      headingFont: "Cormorant Garamond",
      bodyFont: "Outfit",
      monoFont: "DM Mono",
    },
    borderRadius: {
      button: "2px",
      card: "20px",
      input: "4px",
    },
  },
  featureFlags: {
    enableB2bPortal: true,
    enableInquiryMode: false,
    enableCartCheckout: true,
    enableReviews: true,
    enableNdrPortal: true,
    enableCustomQuotePdf: true,
  },
  assets: {
    logoLight: "/images/logo-light.png",
    logoDark: "/images/logo-dark.png",
    favicon: "/favicon.ico",
    appleTouchIcon: "/icons/icon-192x192.png",
    qrWebsiteLogo: "/images/logo-dark.png",
  },
  dictionary: DEFAULT_DICTIONARY,
};

export function getTenantConfig(): ITenantConfig {
  return DEFAULT_TENANT_CONFIG;
}

export * from "./cms.config";
