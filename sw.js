const CACHE_NAME='second-brain-os-v24-buttons-finance-goals-tasks-20260701';
const ASSETS=['./','./index.html','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./maskable-512.png','./offline.html'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(r=>{const clone=r.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,clone)).catch(()=>{});return r}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./offline.html'))));});
