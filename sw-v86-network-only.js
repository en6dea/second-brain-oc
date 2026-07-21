const REPAIR_VERSION = 'v86-network-only-20260721-2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.allSettled(keys.map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      return await fetch(event.request, {
        cache: 'no-store',
        credentials: 'same-origin',
        redirect: 'follow'
      });
    } catch (error) {
      return new Response(
        '<!doctype html><meta charset="utf-8"><title>Нет соединения</title><body style="font-family:system-ui;padding:32px"><h1>Нет соединения</h1><p>Проверьте интернет и обновите страницу.</p></body>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
  })());

  // После первого открытия самого приложения регистрация больше не нужна.
  if (event.request.mode === 'navigate' && (url.pathname.endsWith('/second-brain-oc/') || url.pathname.endsWith('/second-brain-oc/index.html'))) {
    event.waitUntil(self.registration.unregister());
  }
});
