import { createHash } from "crypto";

export function hashValue(val?: string | null): string | null {
  if (!val) return null;
  return createHash("sha256").update(val.trim().toLowerCase()).digest("hex");
}

export interface MetaCapiEvent {
  eventName:
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "Purchase"
    | "Search"
    | "AddToWishlist"
    | "Lead"
    | "Contact"
    | "CompleteRegistration";
  eventId: string;
  eventSourceUrl: string;
  clientIp?: string;
  clientUserAgent?: string;
  rawUserData?: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
    fbp?: string | null;
    fbc?: string | null;
    externalId?: string | null;
  };
  customData?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  };
  testEventCode?: string | null;
}

export async function sendMetaCapiEvent(event: MetaCapiEvent) {
  const pixelId =
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.FACEBOOK_PIXEL_ID;
  const accessToken =
    process.env.FACEBOOK_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!pixelId) {
    console.warn(
      "[Meta CAPI] NEXT_PUBLIC_FACEBOOK_PIXEL_ID is not configured.",
    );
    return { success: false, reason: "Pixel ID missing" };
  }

  if (!accessToken) {
    console.warn("[Meta CAPI] FACEBOOK_ACCESS_TOKEN is not configured.");
    return { success: false, reason: "Access Token missing" };
  }

  try {
    const clientIp = event.clientIp || "127.0.0.1";
    const clientUserAgent = event.clientUserAgent || "";

    const hashedUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
    };

    if (event.rawUserData) {
      const {
        email,
        phone,
        firstName,
        lastName,
        city,
        state,
        zipCode,
        country,
        fbp,
        fbc,
        externalId,
      } = event.rawUserData;

      if (email) hashedUserData.em = hashValue(email);
      if (phone) hashedUserData.ph = hashValue(phone);
      if (firstName) hashedUserData.fn = hashValue(firstName);
      if (lastName) hashedUserData.ln = hashValue(lastName);
      if (city) hashedUserData.ct = hashValue(city);
      if (state) hashedUserData.st = hashValue(state);
      if (zipCode) hashedUserData.zp = hashValue(zipCode);
      if (country) hashedUserData.country = hashValue(country);
      if (fbp) hashedUserData.fbp = fbp;
      if (fbc) hashedUserData.fbc = fbc;
      if (externalId) hashedUserData.external_id = hashValue(externalId);
    }

    const payload: Record<string, any> = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl,
          action_source: "website",
          user_data: hashedUserData,
          custom_data: event.customData,
        },
      ],
    };

    const testCode = event.testEventCode || process.env.META_TEST_EVENT_CODE;
    if (testCode) {
      payload.test_event_code = testCode;
    }

    const res = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[Meta CAPI Request Failed]", {
        status: res.status,
        pixelId,
        error: data?.error?.message || "Unknown Graph API Error",
      });
      return {
        success: false,
        error: {
          message: data?.error?.message || "Meta CAPI request failed",
          code: data?.error?.code || "META_API_ERROR",
        },
      };
    }

    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Meta CAPI Network Exception]", { error: errorMessage });
    return {
      success: false,
      error: {
        message: "Network request to Meta CAPI failed",
        code: "NETWORK_ERROR",
      },
    };
  }
}
