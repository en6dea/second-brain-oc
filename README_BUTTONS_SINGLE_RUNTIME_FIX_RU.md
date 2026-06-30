# Second Brain OS — Buttons Single Runtime Fix

Цель сборки: устранить проблему, когда визуальный `index.html` обновился, а кнопки продолжают работать через старый/кэшированный `app.js` или не получают обработчики клика.

Что сделано:

- основная логика приложения встроена прямо в `index.html`;
- внешний `app.js` оставлен как совместимая копия, но `index.html` больше от него не зависит;
- `sw.js` переведён в network-first/no-store и очищает старые caches;
- `force-update.html` полностью сбрасывает service worker и cache storage;
- сохранён текущий дизайн Timeline Focus / light tech;
- категории, долги, данные и структура не откатываются.

После загрузки открыть:

```text
https://en6dea.github.io/second-brain-oc/force-update.html
```

Затем обычный домен:

```text
https://en6dea.github.io/second-brain-oc/
```
