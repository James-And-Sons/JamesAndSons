import { createHash } from 'crypto';
import { headers } from 'next/headers';

export function hashValue(val?: string | null): string | null {
  if (!val) return null;
  return createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

export interface MetaCapiEvent {
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Search' | 'AddToWishlist' | 'Lead' | 'Contact' | 'CompleteRegistration';
  eventId: string;
  eventSourceUrl: string;
  rawUserData?: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
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
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.FACEBOOK_PIXEL_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!pixelId) {
    console.warn('[Meta CAPI] NEXT_PUBLIC_FACEBOOK_PIXEL_ID is not configured. Skipping CAPI send.');
    return { success: false, reason: 'Pixel ID missing' };
  }

  if (!accessToken) {
    console.warn('[Meta CAPI] FACEBOOK_ACCESS_TOKEN is not configured. Skipping CAPI send.');
    return { success: false, reason: 'Access Token missing' };
  }

  try {
    const headersList = await headers();
    
    // Extract client IP and user agent safely
    let clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    if (clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }
    const clientUserAgent = headersList.get('user-agent') || '';

    // Build hashed user data payload
    const hashedUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
    };

    if (event.rawUserData) {
      const { email, phone, firstName, lastName, city, state, zipCode, country } = event.rawUserData;
      
      if (email) hashedUserData.em = hashValue(email);
      if (phone) hashedUserData.ph = hashValue(phone);
      if (firstName) hashedUserData.fn = hashValue(firstName);
      if (lastName) hashedUserData.ln = hashValue(lastName);
      if (city) hashedUserData.ct = hashValue(city);
      if (state) hashedUserData.st = hashValue(state);
      if (zipCode) hashedUserData.zp = hashValue(zipCode);
      if (country) hashedUserData.country = hashValue(country);
    }

    const payload: Record<string, any> = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl,
          action_source: 'website',
          user_data: hashedUserData,
          custom_data: event.customData,
        }
      ]
    };

    const testCode = event.testEventCode || process.env.META_TEST_EVENT_CODE;
    if (testCode) {
      payload.test_event_code = testCode;
    }

    console.log(`[Meta CAPI] Sending event: ${event.eventName} (Event ID: ${event.eventId}) to Meta...`);

    const res = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error(`[Meta CAPI] Error response from Meta:`, JSON.stringify(data));
      return { success: false, error: data };
    }

    console.log(`[Meta CAPI] Success:`, JSON.stringify(data));
    return { success: true, data };
  } catch (err: any) {
    console.error(`[Meta CAPI] Connection error:`, err);
    return { success: false, error: err.message };
  }
}
