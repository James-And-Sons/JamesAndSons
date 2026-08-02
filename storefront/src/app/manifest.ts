import { MetadataRoute } from "next";
import { BRAND_CONFIG } from "@james-andsons/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: BRAND_CONFIG.name,
    short_name: BRAND_CONFIG.shortName,
    description: "Luxury Illumination Ecosystem",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf7f2",
    theme_color: "#0a0a0b",
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
