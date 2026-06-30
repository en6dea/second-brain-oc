const CACHE_NAME = 'second-brain-os-clean-light-tech';
const APP_SHELL = ['./','./index.html','./app.js','./manifest.webmanifest','./offline.html'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(()=>{})));
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME && /second-brain|sbos/i.test(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(req.mode === 'navigate' || url.pathname.endsWith('/index.html')){
    event.respondWith(fetch(req, {cache:'no-store'}).then(res=>res).catch(()=>caches.match('./offline.html')));
    return;
  }
  if(url.pathname.endsWith('/app.js') || url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/sw.js')){
    event.respondWith(fetch(req, {cache:'no-store'}).then(res=>{
      const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req, copy)); return res;
    }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res=>{
    const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req, copy)); return res;
  }).catch(()=>caches.match('./offline.html'))));
});
