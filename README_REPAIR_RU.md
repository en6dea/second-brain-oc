# Исправление бесконечного цикла V86

Старый `force-update.html` мог закэшироваться старым Service Worker и перенаправлять приложение по кругу.

## Установка

1. Загрузите в корень репозитория два файла:
   - `repair-v86-20260721.html`
   - `sw-v86-network-only.js`
2. Сделайте Commit changes и дождитесь GitHub Pages.
3. Не открывайте `force-update.html`.
4. Откройте:
   `https://en6dea.github.io/second-brain-oc/repair-v86-20260721.html`
5. Дождитесь трёх зелёных галочек.
6. Нажмите `Открыть V86` один раз.

Страница не очищает localStorage или IndexedDB. Удаляется только Cache Storage интерфейса.
