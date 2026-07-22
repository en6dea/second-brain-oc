const CACHE_NAME='second-brain-os-v88-constellation-r1';
const CORE=['./','./index.html','./manifest.webmanifest','./offline.html','./icon-192-v84.png','./icon-512-v84.png','./maskable-512-v84.png','./pwa-v88.js','./cloud-sync.js','./firebase-config.js','./styles-v87-obsidian.css','./styles-v88-obsidian.css','./app-v88-visual.js'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).catch(()=>undefined));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));}return response;}).catch(async()=>await caches.match('./index.html')||await caches.match('./offline.html')));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request,{ignoreSearch:true})));
});
