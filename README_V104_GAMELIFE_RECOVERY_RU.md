# Second Brain OS V104 · GameLife Recovery

Исправление вкладки GameLife и смешанного PWA-кэша.

- GameLife рендерится через безопасную обёртку.
- Старые или повреждённые поля GameLife нормализуются без удаления данных.
- При ошибке показывается экран восстановления вместо пустой страницы.
- Обновлены Service Worker, manifest, build ID и recovery-страница.
- `secondBrainOS.v1`, localStorage и IndexedDB не очищаются.
