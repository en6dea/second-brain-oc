const CACHE_NAME = 'second-brain-os-v40-9-data-guard-balance-anchor-private-20260629';
const APP_SHELL = [
  './',
  './index.html?v=v40-9-data-guard-balance-anchor-private-20260629',
  './offline.html',
  './manifest.webmanifest?v=v40-9-data-guard-balance-anchor-private-20260629',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(() => null)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html?v=v40-9-data-guard-balance-anchor-private-20260629', copy)).catch(()=>{});
          return response;
        })
        .catch(() => caches.match('./index.html?v=v40-9-data-guard-balance-anchor-private-20260629').then(r => r || caches.match('./offline.html')))
    );
    return;
  }
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetched = fetch(event.request, { cache: 'no-store' }).then(response => {
          if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone())).catch(()=>{});
          return response;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
  }
});
