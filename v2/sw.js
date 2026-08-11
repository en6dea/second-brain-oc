/* Офлайн-оболочка для второй версии.

   Кэшируется только код приложения. Данные лежат в IndexedDB и сюда не
   попадают — иначе служебная копия страницы могла бы разойтись с настоящим
   состоянием и показать устаревшие цифры как актуальные.

   Стратегия: сеть первым делом, кэш как запасной вариант. Для приложения,
   которое считает деньги, свежий код важнее мгновенного запуска. */

const VERSION = 'v2.2.0';
const CACHE = `second-brain-v2-${VERSION}`;

const SHELL = [
  './index.html',
  './styles.css?v=2.4.0',
  './manifest.webmanifest?v=2.4.0',
  './src/app.js?v=2.4.0',
  './src/store.js?v=2.4.0',
  './src/format.js?v=2.4.0',
  './src/calc.js?v=2.4.0',
  './src/ui.js?v=2.4.0',
  './src/modal.js?v=2.4.0',
  './src/actions.js?v=2.4.0',
  './src/screens/today.js?v=2.4.0',
  './src/screens/finance.js?v=2.4.0',
  './src/screens/debts.js?v=2.4.0',
  './src/screens/habits.js?v=2.4.0',
  './src/screens/goals.js?v=2.4.0',
  './src/screens/information.js?v=2.4.0',
  './src/screens/calendar.js?v=2.4.0',
  './src/screens/gamelife.js?v=2.4.0',
  './src/screens/system.js?v=2.4.0'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* allSettled, а не all: один недоступный файл не должен срывать установку */
    await Promise.allSettled(SHELL.map(async (url) => {
      const response = await fetch(url, { cache: 'reload' });
      if (response.ok) await cache.put(url, response.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith('second-brain-v2-') && key !== CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.includes('/v2/')) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      return new Response('Second Brain OS недоступен офлайн', {
        status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
    }
  })());
});
