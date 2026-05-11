self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We do not cache anything for offline use as per user request.
  // All parts of the app require a database/network connection.
  return;
});
