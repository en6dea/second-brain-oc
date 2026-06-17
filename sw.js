// Second Brain OS — FINAL REPAIR V3 service worker
// This worker intentionally clears old caches so the app stops serving broken old JS.
const CACHE_NAME = 'second-brain-os-final-repair-v3-20260618';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
