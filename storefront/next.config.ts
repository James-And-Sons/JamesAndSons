import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
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

