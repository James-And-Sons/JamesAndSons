declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq: any;
    _fbq: any;
    dataLayer?: any[];
  }
}

export interface TrackItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
}

export interface TrackOrderPayload {
  orderNumber: string;
  totalAmount: number;
  taxAmount?: number;
  shippingAmount?: number;
  currency?: string;
  items: TrackItem[];
}

/**
 * Unified Analytics Tracking Engine
 * Simultaneously dispatches standard e-commerce events to:
 * 1. Google Analytics 4 (GA4 - gtag / dataLayer)
 * 2. Meta Pixel (Facebook / Instagram Ads - fbq)
 */

/**
 * Track Product View (ViewContent)
 */
export function trackViewContent(item: TrackItem) {
  if (typeof window === "undefined") return;

  const currency = "INR";

  // 1. Google Analytics 4 (GA4)
  if (typeof window.gtag === "function") {
    window.gtag("event", "view_item", {
      currency,
      value: item.price,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category || "Luxury Lighting",
          price: item.price,
          quantity: 1,
        },
      ],
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "ViewContent", {
      content_name: item.name,
      content_category: item.category || "Luxury Lighting",
      content_ids: [item.id],
      content_type: "product",
      value: item.price,
      currency,
    });
  }
}

/**
 * Track Add to Cart (AddToCart)
 */
export function trackAddToCart(item: TrackItem, quantity = 1) {
  if (typeof window === "undefined") return;

  const currency = "INR";
  const totalValue = item.price * quantity;

  // 1. Google Analytics 4 (GA4)
  if (typeof window.gtag === "function") {
    window.gtag("event", "add_to_cart", {
      currency,
      value: totalValue,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category || "Luxury Lighting",
          price: item.price,
          quantity,
        },
      ],
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "AddToCart", {
      content_name: item.name,
      content_ids: [item.id],
      content_type: "product",
      value: totalValue,
      currency,
    });
  }
}

/**
 * Track Initiate Checkout (InitiateCheckout)
 */
export function trackInitiateCheckout(items: TrackItem[], totalAmount: number) {
  if (typeof window === "undefined") return;

  const currency = "INR";

  // 1. Google Analytics 4 (GA4)
  if (typeof window.gtag === "function") {
    window.gtag("event", "begin_checkout", {
      currency,
      value: totalAmount,
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || "Luxury Lighting",
        price: item.price,
        quantity: item.quantity || 1,
      })),
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      content_ids: items.map((i) => i.id),
      content_type: "product",
      num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      value: totalAmount,
      currency,
    });
  }
}

/**
 * Track Purchase / Order Conversion (Purchase)
 */
export function trackPurchase(payload: TrackOrderPayload) {
  if (typeof window === "undefined") return;

  const currency = payload.currency || "INR";

  // 1. Google Analytics 4 (GA4)
  if (typeof window.gtag === "function") {
    window.gtag("event", "purchase", {
      transaction_id: payload.orderNumber,
      value: payload.totalAmount,
      tax: payload.taxAmount || 0,
      shipping: payload.shippingAmount || 0,
      currency,
      items: payload.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || "Luxury Lighting",
        price: item.price,
        quantity: item.quantity || 1,
      })),
    });
  }

  // 2. Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      content_ids: payload.items.map((i) => i.id),
      content_type: "product",
      num_items: payload.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      value: payload.totalAmount,
      currency,
    });
  }
}
