# Second Brain OS V31 — Buttons Hard Fix

Изменение только по проблеме кнопок.

Что сделано:
- добавлен ранний мастер-обработчик кликов, который перехватывает все известные кнопки до старых stacked-обработчиков;
- сохранена вся логика, дизайн и данные;
- добавлен уникальный файл `app-v31-buttons-hard-fix.js`, чтобы GitHub Pages / service worker не отдавали старый `app.js`;
- `index.html` теперь подключает уникальный JS-файл с cache-bust;
- `sw.js` обновлён на network-first.

Сборка: `second-brain-space-v31-buttons-only-hard-fix-20260701`
