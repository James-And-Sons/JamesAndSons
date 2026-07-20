// Service worker placeholder to prevent 404 logs
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Clean active caches if any
});
