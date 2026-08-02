import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ["@james-andsons/blog-editor"],
  images: {
    loader: "custom",
    loaderFile: "./src/lib/cloudinary.ts",
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "your-sentry-org-slug",
  project: "your-sentry-project-slug",
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
