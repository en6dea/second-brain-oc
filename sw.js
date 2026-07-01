// Second Brain OS — no stale cache service worker
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => { event.waitUntil((async()=>{ if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.disable(); } catch(e){} } const keys = await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); await self.clients.claim(); })()); });
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request).catch(()=>caches.match(event.request))); });
