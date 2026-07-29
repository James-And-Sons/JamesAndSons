/**
 * James & Sons Admin — Service Worker
 * Strategy:
 *   - Static assets (_next/static, fonts, images): Cache-First
 *   - API routes (/api/): Network-First with 3s timeout fallback
 *   - Page navigations: Stale-While-Revalidate with offline shell
 */

const CACHE_NAME = 'jas-admin-v1';
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

  // 1. Cache-First: _next/static (hashed filenames never change)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/images/')) {
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
    if (response.ok) {
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
    if (response.ok) {
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
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
