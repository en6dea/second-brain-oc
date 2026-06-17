const CACHE = 'second-brain-os-auth-stable-20260618';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=auth-stable-20260618',
  './app.js?v=auth-stable-20260618',
  './cloud-sync.js?v=auth-stable-20260618',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS).catch(() => null)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Firebase config must always be fresh; old cached config caused auth to look broken.
  if (url.pathname.endsWith('/firebase-config.js')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  const isRuntimeFile = ['document', 'script', 'style'].includes(req.destination) || /\.(html|js|css)$/.test(url.pathname);
  if (isRuntimeFile) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(cache => cache.put(req, clone)).catch(() => null);
        return resp;
      }).catch(() => caches.match(req).then(resp => resp || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(caches.match(req).then(resp => resp || fetch(req)));
});
