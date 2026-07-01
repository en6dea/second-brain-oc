# Second Brain OS V29 — Calendar Force Update

Эта сборка нужна, если V28 не проявилась на GitHub Pages из-за кэша или старого service worker.

Что внутри:
- app.js с явным build `second-brain-space-v29-calendar-force-update-20260701`
- index.html с cache-bust `app.js?v=...`
- sw.js с новым cache name и no-store fetch
- force-update.html для очистки service worker/caches
- version-check.html для проверки загрузки V29 на GitHub

Проверка после загрузки:
- `/version-check.html?v=v29`
- `/force-update.html?v=v29`
- `/?v=second-brain-space-v29-calendar-force-update-20260701#calendar`
