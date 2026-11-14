export interface PageSpeedAuditWarning {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  score?: number | null;
  actionItem: string;
  category: "PERFORMANCE" | "ACCESSIBILITY" | "BEST_PRACTICES" | "SEO";
}

export interface SchemaValidationResult {
  hasProductSchema: boolean;
  hasOfferSchema: boolean;
  hasAggregateRatingSchema: boolean;
  hasInStockSchema: boolean;
  missingRequiredFields: string[];
  missingRecommendedFields: string[];
  isValid: boolean;
}

export interface TopKeywordItem {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  isLowHangingFruit: boolean; // Position 8-20
}

export interface SeoHealthResult {
  indexingStatus:
    | "INDEXED"
    | "DISCOVERED_NOT_INDEXED"
    | "CRAWLED_NOT_INDEXED"
    | "NOT_INDEXED"
    | "UNKNOWN";
  indexingCoverageState?: string;
  lastInspectedAt?: string;
  mobileLighthouseScore?: number;
  desktopLighthouseScore?: number;
  mobileLcp?: number;
  mobileCls?: number;
  mobileInp?: number;
  desktopLcp?: number;
  desktopCls?: number;
  desktopInp?: number;
  pageSpeedAuditWarnings: PageSpeedAuditWarning[];
  schemaValidation: SchemaValidationResult;
  serpTitle: string;
  serpDescription: string;
  missingAltCount: number;
  topKeywords: TopKeywordItem[];
  lastScannedAt?: string;
}

export interface SearchAnalyticsMetric {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface CannibalizationIssue {
  query: string;
  totalClicks: number;
  totalImpressions: number;
  competingUrls: {
    url: string;
    productId?: string;
    productName?: string;
    clicks: number;
    impressions: number;
    position: number;
  }[];
}

export interface TrafficDropAlert {
  productId: string;
  productName: string;
  productSlug: string;
  previousClicks: number;
  currentClicks: number;
  dropPercentage: number;
}
