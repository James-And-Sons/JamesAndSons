import { CannibalizationIssue } from "../types";

export interface SearchAnalyticsRowInput {
  query: string;
  pageUrl: string;
  productId?: string;
  productName?: string;
  clicks: number;
  impressions: number;
  position: number;
}

/**
 * Detects keyword cannibalization where 2+ distinct product URLs rank for the exact same query.
 */
export function detectKeywordCannibalization(
  rows: SearchAnalyticsRowInput[],
): CannibalizationIssue[] {
  const queryGroupMap = new Map<string, SearchAnalyticsRowInput[]>();

  rows.forEach((row) => {
    const q = row.query.trim().toLowerCase();
    if (!queryGroupMap.has(q)) {
      queryGroupMap.set(q, []);
    }
    queryGroupMap.get(q)!.push(row);
  });

  const issues: CannibalizationIssue[] = [];

  queryGroupMap.forEach((competingRows, query) => {
    // Deduplicate by URL
    const uniqueUrlMap = new Map<string, SearchAnalyticsRowInput>();
    competingRows.forEach((r) => {
      if (!uniqueUrlMap.has(r.pageUrl)) {
        uniqueUrlMap.set(r.pageUrl, r);
      }
    });

    const uniqueRows = Array.from(uniqueUrlMap.values());

    if (uniqueRows.length >= 2) {
      const totalClicks = uniqueRows.reduce(
        (acc, curr) => acc + curr.clicks,
        0,
      );
      const totalImpressions = uniqueRows.reduce(
        (acc, curr) => acc + curr.impressions,
        0,
      );

      issues.push({
        query,
        totalClicks,
        totalImpressions,
        competingUrls: uniqueRows.map((r) => ({
          url: r.pageUrl,
          productId: r.productId,
          productName: r.productName || r.pageUrl.split("/").pop() || r.pageUrl,
          clicks: r.clicks,
          impressions: r.impressions,
          position: r.position,
        })),
      });
    }
  });

  // Sort by total impressions descending
  return issues.sort((a, b) => b.totalImpressions - a.totalImpressions);
}
