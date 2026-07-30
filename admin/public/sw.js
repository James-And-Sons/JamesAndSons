/**
 * James & Sons Admin — Service Worker
 * Strategy:
 *   - Static assets (_next/static, fonts, images): Cache-First
 *   - API routes (/api/): Network-First with 3s timeout fallback
 *   - Page navigations: Stale-While-Revalidate with offline shell
 */

const CACHE_NAME = 'jas-admin-1785416903379';
const STATIC_CACHE = 'jas-admin-static-v1';
const OFFLINE_URL = '/login';

const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/images/logo-dark.png',
  '/images/logo-light.png',
];

// ── Install: Pre-cache static shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {
        // Don't fail install if assets aren't available
      })
    )
  );
  self.skipWaiting();
});

// ── Activate: Clean stale caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Routing strategies ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, non-same-origin, and Next.js HMR requests
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/_next/on-demand-entries-ping')
  ) {
    return;
  }

  // 1. Cache-First: _next/static, images, and pre-cached root assets
  if (
    url.pathname.startsWith('/_next/static/') || 
    url.pathname.startsWith('/images/') ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 2. Network-First: API routes (fresh data is always preferred)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithTimeout(request, 4000));
    return;
  }

  // 3. Stale-While-Revalidate: HTML pages (shell loads instantly, updates in bg)
  event.respondWith(staleWhileRevalidate(request));
});

// ── Strategy Helpers ─────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    // Only cache actual successful same-url responses (avoid caching login redirects)
    if (response.ok && !response.redirected && response.url === request.url) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok && !response.redirected) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timeout);
    const cached = await caches.match(request);
    return (
      cached ||
      new Response(JSON.stringify({ error: 'Offline', offline: true }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      // Avoid caching redirect responses as page HTML
      if (response.ok && !response.redirected && response.url === request.url) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
    });

  return cached || fetchPromise;
}


// ── Web Push Event: Receives server push notifications ──────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const options = {
      body: payload.body || 'New update available on James & Sons Admin',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: payload.type || 'jas-notification',
      data: {
        url: payload.url || '/'
      },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Open Panel' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'James & Sons Admin', options)
    );
  } catch (err) {
    // Non-JSON fallback
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('James & Sons Admin Update', {
        body: text,
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: { url: '/' }
      })
    );
  }
});

// ── Notification Click: Navigates PWA window to deep link ───────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If PWA window is already open, navigate & focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(urlToOpen);
          }
        }
      }
      // Otherwise open a new standalone window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// ── Periodic Background Sync: Checks for notifications silently ───────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-new-items') {
    event.waitUntil(checkNewItemsAndNotify());
  }
});

async function checkNewItemsAndNotify() {
  try {
    // Fetch count summary since last hour
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const response = await fetch(`/api/notifications/summary?since=${encodeURIComponent(since)}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.total > 0) {
        let msg = '';
        if (data.tickets > 0) msg += `${data.tickets} ticket(s) `;
        if (data.orders > 0) msg += `${data.orders} order(s) `;
        if (data.rfqs > 0) msg += `${data.rfqs} RFQ(s) `;
        if (data.inquiries > 0) msg += `${data.inquiries} inquiry(s) `;
        
        await self.registration.showNotification('Activity Alert', {
          body: `Pending items needing review: ${msg}`,
          icon: '/favicon.png',
          badge: '/favicon.png',
          data: { url: '/' }
        });
      }
    }
  } catch (err) {
    console.error('Failed to run periodic background sync item check:', err);
  }
}

