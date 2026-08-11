/* Second Brain OS V114 — Lumen service worker. */
'use strict';
importScripts('./version.js?v=v114-r3');
const BUILD = self.SecondBrainBuild;
const CACHE_PREFIX = 'second-brain-os-';
const CACHE_NAME = BUILD.cacheName;
const INDEX_KEY = `./index.html?build=${BUILD.cacheVersion}`;
const CRITICAL = [
  INDEX_KEY,
  './offline.html',
  './manifest.webmanifest',
  './version.js',
  './styles-dark-base.css',
  './styles-lumen.css',
  './app.js'
];
const OPTIONAL = [
  './firebase-config.js','./app-cloud.js',
  './icon-192-v84.png','./icon-512-v84.png','./maskable-512-v84.png'
];
async function fetchRequired(url){const response=await fetch(url,{cache:'reload'});if(!response.ok)throw new Error(`Critical asset ${url}: HTTP ${response.status}`);return response;}
async function precache(){await caches.delete(CACHE_NAME);const cache=await caches.open(CACHE_NAME);for(const url of CRITICAL){const response=await fetchRequired(url);await cache.put(url,response.clone());}await Promise.allSettled(OPTIONAL.map(async url=>{const response=await fetch(url,{cache:'reload'});if(response.ok)await cache.put(url,response.clone());}));}
self.addEventListener('install',event=>event.waitUntil(precache()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>(key.startsWith(CACHE_PREFIX)||key.startsWith('second-brain-space-'))&&key!==CACHE_NAME).map(key=>caches.delete(key)));await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data?.type==='GET_VERSION')event.source?.postMessage?.({type:'SBOS_VERSION',build:BUILD});});
async function navigationResponse(request){try{const response=await fetch(request,{cache:'no-store'});if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(INDEX_KEY,response.clone());}return response;}catch(_){return await caches.match(INDEX_KEY)||await caches.match('./offline.html')||new Response('Second Brain OS offline',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}}
async function assetResponse(request){const cache=await caches.open(CACHE_NAME);const cached=await cache.match(request,{ignoreSearch:false});if(cached){fetch(request,{cache:'no-store'}).then(response=>{if(response.ok)cache.put(request,response.clone());}).catch(()=>undefined);return cached;}try{const response=await fetch(request,{cache:'no-store'});if(response.ok)await cache.put(request,response.clone());return response;}catch(_){return Response.error();}}
/* Всё под /v2/ обслуживает собственный service worker второй версии.
   Если перехватывать эти запросы здесь, два кэша начнут спорить за одни и те
   же файлы, и после обновления часть кода придёт старая. */
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;if(url.pathname.includes('/v2/'))return;if(event.request.mode==='navigate'){event.respondWith(navigationResponse(event.request));return;}event.respondWith(assetResponse(event.request));});
