const CACHE_NAME = 'second-brain-os-v35-stable-self-contained-fix-20260626';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request))); });
