
const CACHE_NAME = 'second-brain-os-timeline-focus-ui2-20260630';
const APP_SHELL = ['./','index.html','app.js','manifest.webmanifest','offline.html'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(()=>{})); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith('second-brain-os')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(fetch(event.request).then(res => { const copy=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{}); return res; }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html') || caches.match('offline.html')))); });
