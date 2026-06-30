const CACHE_NAME = 'second-brain-os-v47-1-life-load-hotfix-private-20260630';
const STATIC_ASSETS = ['./offline.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(()=>null))); });
self.addEventListener('activate', event => { event.waitUntil((async()=>{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))); await self.clients.claim(); })()); });
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.pathname.endsWith('/index.html') || url.pathname.endsWith('/second-brain-oc/') || url.pathname.endsWith('/second-brain-oc')) {
    event.respondWith(fetch(req, {cache:'no-store'}).catch(()=>caches.match('./offline.html')));
    return;
  }
  event.respondWith(fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(req, copy)).catch(()=>null); return res; }).catch(()=>caches.match(req).then(r=>r || caches.match('./offline.html'))));
});
