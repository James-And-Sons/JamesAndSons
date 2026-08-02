import { MetadataRoute } from "next";
import { BRAND_CONFIG } from "@james-andsons/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: BRAND_CONFIG.adminPwaName,
    short_name: BRAND_CONFIG.adminPwaName,
    description: `Management portal for ${BRAND_CONFIG.name}`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#0a0a0b",
    orientation: "portrait",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
