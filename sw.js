const CACHE_NAME='second-brain-space-v19-20260701';
const ASSETS=['./','./index.html','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./maskable-512.png','./offline.html'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).catch(()=>{}))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});return res}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./offline.html'))))});
