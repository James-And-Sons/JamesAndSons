'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    trackMetaEvent: (
      eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Search' | 'AddToWishlist' | 'Lead' | 'Contact' | 'CompleteRegistration',
      customData?: Record<string, any>,
      rawUserData?: Record<string, any>
    ) => string;
  }
}

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '2422495261493848'; // Falling back to the Pixel ID: 2422495261493848

  useEffect(() => {
    if (!pixelId) return;

    // 1. Initialize Facebook Pixel
    if (!window.fbq) {
      /* eslint-disable */
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */

      window.fbq('init', pixelId);
    }

    // 2. Define global trackMetaEvent helper for browser + server event deduplication
    window.trackMetaEvent = (eventName, customData = {}, rawUserData = {}) => {
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // A. Track via Browser Pixel
      if (typeof window.fbq === 'function') {
        window.fbq('track', eventName, customData, { eventID: eventId });
      }

      // Read test event code if it exists in sessionStorage
      const testEventCode = typeof window !== 'undefined' ? sessionStorage.getItem('fb_test_code') : null;

      // B. Track via Server Conversions API (CAPI)
      fetch('/api/meta-capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          eventId,
          eventSourceUrl: window.location.href,
          customData,
          rawUserData,
          testEventCode
        })
      }).catch(err => {
        console.warn('[Meta CAPI Client] Failed to send server event:', err);
      });

      return eventId;
    };

  }, [pixelId]);

  // 3. Capture test event code from query params and persist in sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      const code = searchParams.get('test_code') || searchParams.get('test_event_code') || searchParams.get('fb_test');
      if (code) {
        sessionStorage.setItem('fb_test_code', code);
        console.log(`[Meta CAPI] Saved Test Event Code to sessionStorage: ${code}`);
      }
    }
  }, [searchParams]);

  // 4. Track PageView automatically on route changes
  useEffect(() => {
    if (typeof window.trackMetaEvent === 'function') {
      window.trackMetaEvent('PageView');
    }
  }, [pathname, searchParams]);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
