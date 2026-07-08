const CACHE_NAME='second-brain-space-v53-safe-recovery-living-ui-20260708';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)))});
