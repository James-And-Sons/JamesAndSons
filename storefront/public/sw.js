/**
 * James & Sons Storefront — Progressive Web App Service Worker
 */

const CACHE_NAME = "jas-storefront-v1";
const STATIC_CACHE = "jas-storefront-static-v1";

const STATIC_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {
        // Best-effort static pre-caching
      }),
    ),
  );
  self.skipWaiting();
});

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

// ── Web Push Event Listener ───────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const options = {
      body:
        payload.body || "Exclusive update from James & Sons Bespoke Lighting",
      icon: payload.icon || "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      image: payload.image || null, // High-res product photo / banner
      tag: payload.tag || "jas-marketing-push",
      data: {
        url: payload.url || "/",
      },
      vibrate: [100, 50, 100],
      actions: [
        { action: "explore", title: "View Collection" },
        { action: "close", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(
        payload.title || "James & Sons",
        options,
      ),
    );
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("James & Sons Lighting", {
        body: text,
        icon: "/pwa-icon-192.png",
        badge: "/pwa-icon-192.png",
        data: { url: "/" },
      }),
    );
  }
});

// ── Notification Click Listener ──────────────────────────────────────────────
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
