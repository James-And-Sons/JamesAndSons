import { MetadataRoute } from "next";
import { BRAND_CONFIG } from "@james-andsons/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: BRAND_CONFIG.name,
    short_name: BRAND_CONFIG.name,
    description: `Bespoke luxury chandeliers & designer lighting by ${BRAND_CONFIG.name}`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    orientation: "any",
    categories: ["shopping", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
