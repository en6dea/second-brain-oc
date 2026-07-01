const CACHE_NAME='second-brain-os-visual-clarity-hard-refresh-20260701-1';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); await self.clients.claim();})());});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request,{cache:'reload'}).catch(()=>caches.match(event.request)));});
