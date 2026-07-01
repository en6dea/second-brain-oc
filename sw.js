const CACHE_NAME='second-brain-os-planning-folders-polish-v17-visible-fix-20260701';
const APP_SHELL=['./','index.html','app.js','manifest.webmanifest','offline.html'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).catch(()=>{}));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('second-brain-os')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request,{cache:'no-store'}).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy)).catch(()=>{});return res;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html')||caches.match('offline.html'))));});
