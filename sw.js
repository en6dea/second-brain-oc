const CACHE = 'second-brain-os-v11-goal-game-forecast-20260617';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=goal-game-forecast-20260617',
  './app.js?v=goal-game-forecast-20260617',
  './cloud-sync.js?v=goal-game-forecast-20260617',
  './firebase-config.js?v=live',
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
