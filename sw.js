
const CACHE_NAME = 'second-brain-os-buttons-wire-final-20260630-2';
const APP_SHELL = ['./','index.html','manifest.webmanifest','offline.html'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(()=>{})); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('second-brain-os')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/app.js') || url.pathname.endsWith('/index.html') || url.search.includes('buttons-wire-final')) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(res => { const copy=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{}); return res; }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html') || caches.match('offline.html'))));
});
