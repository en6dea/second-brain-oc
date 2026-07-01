# Second Brain OS — Hard Refresh Verify

Сборка: `visual-clarity-hard-refresh-20260701-1`

Что добавлено:
- `version-check.html` — проверка, что GitHub Pages реально отдает новые файлы.
- `sbos-build.txt` — текстовый маркер версии.
- `force-update.html` — жесткая очистка service worker/cache и переход на `?v=visual-clarity-hard-refresh-20260701-1`.
- `index.html` помечен комментарием `SBOS_ACTIVE_BUILD` и meta build.

Проверка после загрузки:
1. Открыть `/version-check.html?v=visual-clarity-hard-refresh-20260701-1`.
2. Если видна сборка `visual-clarity-hard-refresh-20260701-1`, файлы загружены правильно.
3. Открыть `/force-update.html?v=visual-clarity-hard-refresh-20260701-1`.
4. Потом обычный домен.

Если `/version-check.html` не появляется или показывает старое — файлы загружены не туда, не в ту ветку или GitHub Pages еще не завершил деплой.
