import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

// Generate public/sw.js from template on load (dev and build)
try {
  const templatePath = path.join(process.cwd(), "public", "sw.template.js");
  const swPath = path.join(process.cwd(), "public", "sw.js");
  if (fs.existsSync(templatePath)) {
    let content = fs.readFileSync(templatePath, "utf8");
    const buildTs = Date.now().toString();
    content = content.replace("__BUILD_TS__", buildTs);
    fs.writeFileSync(swPath, content, "utf8");
    console.log(`Generated public/sw.js with build timestamp: ${buildTs}`);
  }
} catch (err) {
  console.error("Failed to generate service worker with versioning:", err);
}

const nextConfig: NextConfig = {
  transpilePackages: ["@james-andsons/blog-editor"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "your-sentry-org-slug",
  project: "your-sentry-project-slug",
  silent: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
