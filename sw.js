const CACHE_NAME = 'second-brain-space-v73-password-vault-20260716-r1';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './app-v64.js',
  './app-v65.js',
  './app-v66.js',
  './app-v67.js',
  './app-v67-life.js',
  './app-v68-assistant.js',
  './app-v69-calm.js',
  './app-v70-living.js',
  './app-v71-data.js',
  './app-v72-polina.js',
  './app-v73-passwords.js',
  './styles-v64.css',
  './styles-v65.css',
  './styles-v66.css',
  './styles-v67.css',
  './styles-v68.css',
  './styles-v69.css',
  './styles-v70.css',
  './styles-v72-polina.css',
  './styles-v73-passwords.css',
  './manifest.webmanifest',
  './offline.html',
  './icon-192-v71.png',
  './icon-512-v71.png',
  './maskable-512-v71.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(async () => (await caches.match('./index.html')) || caches.match('./offline.html'))
    );
    return;
  }

  if (['script', 'style', 'manifest', 'worker'].includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './#dashboard', self.registration.scope).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      const existing = windows[0];
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return clients.openWindow(target);
    })
  );
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json?.() || {}; }
  catch (error) { payload = { body: event.data?.text?.() || '' }; }
  const title = payload.title || 'Second Brain OS';
  const options = {
    body: payload.body || 'Появился новый личный сигнал.',
    tag: payload.tag || 'sbos-web-push',
    icon: './icon-192-v71.png',
    badge: './icon-192-v71.png',
    data: { url: payload.url || './#dashboard' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
