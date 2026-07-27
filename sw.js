'use strict';
const CACHE_PREFIX='second-brain-os-';
const CACHE_NAME='second-brain-os-v96-stable-core-r1';
const CORE=[
  './index.html',
  './offline.html',
  './manifest.webmanifest?v=v96-r1',
  './src/app/version.js?v=v96-r1',
  './src/storage/backup.js?v=v96-r1',
  './src/app/bootstrap.js?v=v96-r1',
  './src/styles/core.css?v=v96-r1',
  './firebase-config.js?v=v96-r1',
  './cloud-sync.js?v=v96-r1',
  './pwa-v88.js?v=v96-r1',
  './styles-v884-finance.css?v=v885-r1',
  './styles-v91-stability.css?v=v96-r1',
  './styles-v93-assistant.css?v=v96-r1',
  './app-v91-stability.js?v=v96-r1',
  './app-v93-assistant.js?v=v96-r1',
  './icon-192-v84.png',
  './icon-512-v84.png',
  './maskable-512-v84.png'
];

async function precache(){
  const cache=await caches.open(CACHE_NAME);
  for(const url of CORE){
    try{
      const response=await fetch(url,{cache:'reload'});
      if(response.ok)await cache.put(url,response.clone());
    }catch(error){console.warn('[SW V96] precache skipped',url,error?.message||error);}
  }
}

self.addEventListener('install',event=>{event.waitUntil(precache());});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});

async function navigationResponse(request){
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok){
      const cache=await caches.open(CACHE_NAME);
      await cache.put('./index.html',response.clone());
    }
    return response;
  }catch(_){
    return await caches.match('./index.html')||await caches.match('./offline.html')||new Response('Second Brain OS offline',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }
}

async function assetResponse(request){
  const cached=await caches.match(request);
  if(cached){
    fetch(request,{cache:'no-store'}).then(async response=>{
      if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());}
    }).catch(()=>undefined);
    return cached;
  }
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());}
    return response;
  }catch(_){return Response.error();}
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){event.respondWith(navigationResponse(event.request));return;}
  event.respondWith(assetResponse(event.request));
});
