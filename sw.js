const CACHE_NAME = 'second-brain-os-v40-11-update-safe-private-20260629';
const RELEASE = 'v40-11-update-safe-private-20260629';
const STATIC_ASSETS = [
  './offline.html',
  './manifest.webmanifest?v=' + RELEASE,
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => null))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => null));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: 'SBOS_SW_READY', release: RELEASE });
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SBOS_SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'SBOS_CLEAR_CACHES') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // HTML/navigation is always network-first and is never written back as stale index.
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('./offline.html'))
    );
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok && !url.pathname.endsWith('/index.html')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => null);
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
