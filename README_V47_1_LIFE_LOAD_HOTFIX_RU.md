# Second Brain OS V47.1 — Life Load Hotfix

Точечный hotfix для ситуации, когда V47 функционально загружена не полностью или GitHub Pages/service worker держит старую версию.

## Что исправлено

- Ранний сброс service worker и Cache Storage при `?hard=1`.
- Принудительное обновление видимой плашки версии на V47.1.
- Перезапись `document.title`, `meta second-brain-build`, `window.SecondBrainBuild`.
- Сохранение меток последней хорошей сборки в localStorage.
- Сохранены все функции V47: раздел «Жизнь», lifeEntries, универсальный быстрый ввод, диагностика жизни.

## Заменить на GitHub

- `index.html`
- `app.js`
- `sw.js`
- `README_V47_1_LIFE_LOAD_HOTFIX_RU.md`

После загрузки открыть:

```
https://en6dea.github.io/second-brain-oc/?v=v47-1-life-load-hotfix-private-20260630&hard=1
```

Если браузер сам перезагрузит страницу на `harddone=1` — это нормально.
