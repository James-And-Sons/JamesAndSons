export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export type CouponStatus = "ACTIVE" | "PAUSED" | "EXPIRED" | "EXHAUSTED";

export interface Affiliate {
  id: string;
  name: string;
  affiliateCode: string;
}

export interface ChannelSyncStatus {
  googleMerchant: "SYNCED" | "PENDING_REVIEW" | "FAILED" | "OFF";
  metaCommerce: "SYNCED" | "PENDING" | "OFF";
  emailBlast: "SENT" | "SCHEDULED" | "OFF";
  webPush: "SENT" | "SCHEDULED" | "OFF";
  lastSyncedAt?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  status: CouponStatus;
  minOrderAmount: number | null;
  maxDiscountCap: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  source: string | null; // Stores target channels e.g. "google_merchant,meta,email,internal"
  affiliateId: string | null;
  affiliate?: { name: string } | null;
  createdAt?: string;
  updatedAt?: string;
  channelSync?: ChannelSyncStatus;
}

export interface PrebuiltPromotionPreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeBg: string;
  codePrefix: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountCap?: number;
  durationDays?: number;
  usageLimitPerUser?: number;
  targetChannels: {
    googleMerchant: boolean;
    metaCommerce: boolean;
    emailBlast: boolean;
    webPush: boolean;
  };
  iconName: string;
}

export interface OrderStats {
  totalDiscountSaved: number;
  totalRevenueGenerated: number;
  orderCount: number;
}

export interface PromotionFilterState {
  search: string;
  status: string;
  type: string;
  channel: string;
}

export interface GoogleMerchantPromotionPayload {
  promotionId: string;
  targetCountry: string;
  contentLanguage: string;
  redemptionChannel: "ONLINE" | "IN_STORE" | "BOTH";
  promotionTitle: string;
  couponValueType:
    "MONEY_OFF" | "PERCENT_OFF" | "FREE_SHIPPING" | "BUY_M_GET_N";
  getPercentOff?: number;
  getMoneyOffAmount?: {
    value: number;
    currency: string;
  };
  minimumPurchaseAmount?: {
    value: number;
    currency: string;
  };
  genericRedemptionCode?: string;
  promotionEffectiveTimePeriod: {
    startTime: string;
    endTime?: string;
  };
}
