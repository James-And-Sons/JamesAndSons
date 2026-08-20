import { PageSpeedAuditWarning } from "../types";

export interface PageSpeedScanOptions {
  targetUrl: string;
  apiKey?: string;
}

export interface PageSpeedScanResult {
  mobileLighthouseScore: number;
  desktopLighthouseScore: number;
  mobileLcp: number;
  mobileCls: number;
  mobileInp: number;
  desktopLcp: number;
  desktopCls: number;
  desktopInp: number;
  warnings: PageSpeedAuditWarning[];
}

/**
 * Fetches Google PageSpeed Insights metrics for a target URL across Mobile and Desktop.
 */
export async function runPageSpeedScan(
  options: PageSpeedScanOptions,
): Promise<PageSpeedScanResult> {
  const apiKey = options.apiKey || process.env.GOOGLE_PAGESPEED_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || "";

  // Guard: missing key, or key is the Gemini/AI Studio key (prefix AQ.) mistakenly
  // placed in the PageSpeed slot — fall back to mock immediately, no API call.
  const keyInvalid =
    !apiKey ||
    apiKey.trim().length === 0 ||
    apiKey === geminiKey ||
    apiKey.startsWith("AQ.");

  if (keyInvalid) {
    if (apiKey && (apiKey === geminiKey || apiKey.startsWith("AQ."))) {
      console.error(
        "[SEO] ❌ GOOGLE_PAGESPEED_API_KEY is set to a Gemini/AI Studio key. " +
          "Please create a separate Cloud API key restricted to the PageSpeed Insights API. " +
          "Falling back to mock data.",
      );
    }
    return generateMockPageSpeedResult(options.targetUrl);
  }

  try {
    const [mobileData, desktopData] = await Promise.all([
      fetchStrategyData(options.targetUrl, "mobile", apiKey),
      fetchStrategyData(options.targetUrl, "desktop", apiKey),
    ]);

    // Either strategy returning null means the API rejected us — use mock
    if (!mobileData || !desktopData) {
      return generateMockPageSpeedResult(options.targetUrl);
    }

    const warnings: PageSpeedAuditWarning[] = [
      ...extractAuditWarnings(mobileData, "mobile"),
      ...extractAuditWarnings(desktopData, "desktop"),
    ];

    // Deduplicate warnings by title
    const uniqueWarningsMap = new Map<string, PageSpeedAuditWarning>();
    warnings.forEach((w) => {
      if (!uniqueWarningsMap.has(w.title)) {
        uniqueWarningsMap.set(w.title, w);
      }
    });

    return {
      mobileLighthouseScore: extractLighthouseScore(mobileData),
      desktopLighthouseScore: extractLighthouseScore(desktopData),
      mobileLcp: extractLcp(mobileData),
      mobileCls: extractCls(mobileData),
      mobileInp: extractInp(mobileData),
      desktopLcp: extractLcp(desktopData),
      desktopCls: extractCls(desktopData),
      desktopInp: extractInp(desktopData),
      warnings: Array.from(uniqueWarningsMap.values()),
    };
  } catch (error) {
    console.error("PageSpeed API fetch error:", error);
    return generateMockPageSpeedResult(options.targetUrl);
  }
}

async function fetchStrategyData(
  url: string,
  strategy: "mobile" | "desktop",
  apiKey: string,
): Promise<any | null> {
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url,
  )}&strategy=${strategy}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&key=${apiKey}`;

  const res = await fetch(endpoint, { next: { revalidate: 3600 } } as any);

  // Auth/rate-limit errors: return null so caller falls back to mock (do NOT throw)
  if (res.status === 401 || res.status === 403) {
    console.error(
      `[SEO] ❌ PageSpeed API rejected the request (HTTP ${res.status}) for strategy=${strategy}. ` +
        `Check that GOOGLE_PAGESPEED_API_KEY is a valid Cloud API key with PageSpeed Insights API enabled.`,
    );
    return null;
  }
  if (res.status === 429) {
    console.error(
      `[SEO] ⚠️  PageSpeed API rate-limited (HTTP 429) for strategy=${strategy}. Falling back to mock.`,
    );
    return null;
  }
  if (!res.ok) {
    throw new Error(`PageSpeed API returned HTTP ${res.status}`);
  }
  return res.json();
}

function extractLighthouseScore(data: any): number {
  const score = data?.lighthouseResult?.categories?.performance?.score;
  return score !== undefined && score !== null ? Math.round(score * 100) : 75;
}

function extractLcp(data: any): number {
  const val =
    data?.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue;
  return val ? parseFloat((val / 1000).toFixed(2)) : 2.4;
}

function extractCls(data: any): number {
  const val =
    data?.lighthouseResult?.audits?.["cumulative-layout-shift"]?.numericValue;
  return val ? parseFloat(val.toFixed(3)) : 0.05;
}

function extractInp(data: any): number {
  const val =
    data?.lighthouseResult?.audits?.["interaction-to-next-paint"]?.numericValue;
  return val ? Math.round(val) : 180;
}

function extractAuditWarnings(
  data: any,
  strategy: string,
): PageSpeedAuditWarning[] {
  const warnings: PageSpeedAuditWarning[] = [];
  const audits = data?.lighthouseResult?.audits || {};

  // Image optimization check
  const offscreenImages = audits["offscreen-images"];
  if (
    offscreenImages &&
    offscreenImages.score !== null &&
    offscreenImages.score < 0.9
  ) {
    warnings.push({
      id: "lazy-load-images",
      title: "Defer offscreen images",
      description:
        offscreenImages.description ||
        "Consider lazy-loading offscreen images.",
      displayValue: offscreenImages.displayValue,
      score: offscreenImages.score,
      actionItem: `Enable lazy loading or Next.js Image component for product gallery images on ${strategy}.`,
      category: "PERFORMANCE",
    });
  }

  const uncompressedImages =
    audits["uses-optimized-images"] || audits["uses-webp-images"];
  if (
    uncompressedImages &&
    uncompressedImages.score !== null &&
    uncompressedImages.score < 0.9
  ) {
    warnings.push({
      id: "compress-images",
      title: "Compress & convert images to WebP/AVIF",
      description:
        uncompressedImages.description ||
        "Images should be compressed to modern WebP/AVIF formats.",
      displayValue: uncompressedImages.displayValue,
      score: uncompressedImages.score,
      actionItem: `Re-upload product imagery via CDN image pipeline to automatically serve compressed WebP/AVIF formats.`,
      category: "PERFORMANCE",
    });
  }

  const renderBlocking = audits["render-blocking-resources"];
  if (
    renderBlocking &&
    renderBlocking.score !== null &&
    renderBlocking.score < 0.8
  ) {
    warnings.push({
      id: "render-blocking",
      title: "Eliminate render-blocking resources",
      description:
        renderBlocking.description ||
        "Resources are blocking the first paint of your page.",
      displayValue: renderBlocking.displayValue,
      score: renderBlocking.score,
      actionItem: `Defer secondary script tags and inline critical CSS for above-the-fold content.`,
      category: "PERFORMANCE",
    });
  }

  return warnings;
}

function generateMockPageSpeedResult(targetUrl: string): PageSpeedScanResult {
  return {
    mobileLighthouseScore: 88,
    desktopLighthouseScore: 94,
    mobileLcp: 2.1,
    mobileCls: 0.04,
    mobileInp: 140,
    desktopLcp: 1.4,
    desktopCls: 0.01,
    desktopInp: 85,
    warnings: [
      {
        id: "mock-img-opt",
        title: "Optimize product image assets",
        description:
          "Serve images in next-gen formats like WebP or AVIF to reduce payload size.",
        displayValue: "Potential savings of 420 KB",
        score: 0.72,
        actionItem:
          "Re-compress product gallery photos to WebP format before uploading.",
        category: "PERFORMANCE",
      },
      {
        id: "mock-dom-size",
        title: "Reduce DOM size",
        description:
          "Large DOM trees increase memory usage and cause long layout calculations.",
        displayValue: "850 elements",
        score: 0.85,
        actionItem:
          "Simplify nested product specification tables and review tabs.",
        category: "PERFORMANCE",
      },
    ],
  };
}
