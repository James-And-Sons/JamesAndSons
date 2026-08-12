/**
 * James & Sons Admin — Service Worker
 * Strategy:
 *   - Static assets (_next/static, fonts, images): Cache-First
 *   - Page navigations: Network-First with offline fallback (satisfies Chrome PWA requirement)
 *   - API routes (/api/): Network-Only (bypassed)
 *   - Next.js RSC requests (_rsc=...): Network-Only (bypassed)
 *   - Service Worker script (/sw.js): Network-Only (bypassed)
 */

const CACHE_NAME = "jas-admin-1786516210336";
const STATIC_CACHE = "jas-admin-static-v1";

const STATIC_ASSETS = [
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.png",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-maskable-512.png",
  "/images/logo-dark.png",
  "/images/logo-light.png",
];

// ── Install: Pre-cache static shell ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {
        // Don't fail install if assets aren't available
      }),
    ),
  );
  self.skipWaiting();
});

// ── Activate: Clean stale caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── BYPASS ALL NON-CACHEABLE & DYNAMIC ROUTER REQUESTS ──
  // Bypasses /api/, /sw.js, and Next.js App Router RSC payload prefetching
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname === "/sw.js" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.startsWith("/_next/on-demand-entries-ping") ||
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-State-Tree") ||
    request.headers.get("Next-Url")
  ) {
    return;
  }

  // 1. Cache-First: static assets ONLY (JS, CSS, static images, fonts)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 2. Page Navigations: MUST call event.respondWith to satisfy Chrome PWA Installability requirements
  if (
    request.mode === "navigate" ||
    (request.headers.get("accept")?.includes("text/html") &&
      !url.searchParams.has("_rsc"))
  ) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/login");
        return (
          cached ||
          new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/html" },
          })
        );
      }),
    );
    return;
  }
});

// ── Strategy Helpers ─────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected && response.url === request.url) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

// ── Web Push Event: Receives server push notifications ──────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const options = {
      body: payload.body || "New update available on James & Sons Admin",
      icon: "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      tag: payload.type || "jas-notification",
      data: {
        url: payload.url || "/",
      },
      vibrate: [100, 50, 100],
      actions: [
        { action: "open", title: "Open Panel" },
        { action: "close", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(
        payload.title || "James & Sons Admin",
        options,
      ),
    );
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("James & Sons Admin Update", {
        body: text,
        icon: "/pwa-icon-192.png",
        badge: "/pwa-icon-192.png",
        data: { url: "/" },
      }),
    );
  }
});

// ── Notification Click: Navigates PWA window to deep link ───────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(urlToOpen);
            }
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
});

// ── Periodic Background Sync ─────────────────────────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-new-items") {
    event.waitUntil(checkNewItemsAndNotify());
  }
});

async function checkNewItemsAndNotify() {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const response = await fetch(
      `/api/notifications/summary?since=${encodeURIComponent(since)}`,
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.total > 0) {
        let msg = "";
        if (data.tickets > 0) msg += `${data.tickets} ticket(s) `;
        if (data.orders > 0) msg += `${data.orders} order(s) `;
        if (data.rfqs > 0) msg += `${data.rfqs} RFQ(s) `;
        if (data.inquiries > 0) msg += `${data.inquiries} inquiry(s) `;

        await self.registration.showNotification("Activity Alert", {
          body: `Pending items needing review: ${msg}`,
          icon: "/pwa-icon-192.png",
          badge: "/pwa-icon-192.png",
          data: { url: "/" },
        });
      }
    }
  } catch (err) {
    console.error("Failed to run periodic background sync item check:", err);
  }
}
