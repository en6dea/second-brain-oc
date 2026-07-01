const CACHE_NAME='second-brain-os-v25-planning-finance-fixes-20260701';
const ASSETS=['./','./index.html','./app.js','./manifest.webmanifest','./offline.html'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request).then(response=>{const clone=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,clone)).catch(()=>{});return response}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./offline.html'))))});
