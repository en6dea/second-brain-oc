const CACHE_NAME = 'second-brain-os-category-delete-final-fix-20260630';
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate' || new URL(req.url).pathname.endsWith('/index.html')) {
    event.respondWith(fetch(req, {cache:'no-store'}).catch(()=>caches.match('./offline.html')));
    return;
  }
  event.respondWith(fetch(req, {cache:'no-store'}).catch(()=>caches.match(req)));
});
