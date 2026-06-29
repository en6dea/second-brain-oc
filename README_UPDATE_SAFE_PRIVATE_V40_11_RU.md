# Second Brain OS — V40.11 Update Safe Private

Эта сборка исправляет проблему, когда после загрузки новой версии приложение продолжало показывать старую V40.9/V40.10 из PWA-кэша.

## Что исправлено

- видимый статус версии теперь V40.11, а не старый V40.9;
- service worker больше не держит старый `index.html`;
- добавлен `force-update.html` для жёсткого обновления без удаления данных;
- регистрация service worker идёт с `updateViaCache: 'none'`;
- добавлена кнопка «Жёстко обновить приложение» в разделе «Данные»;
- данные операций, бэкапы и localStorage не очищаются при обновлении кэша.

## Как обновить

1. Залить все файлы из архива в корень `second-brain-oc`.
2. Открыть:

`https://en6dea.github.io/second-brain-oc/force-update.html?v=v40-11-update-safe-private-20260629`

3. После автоочистки откроется новая версия:

`https://en6dea.github.io/second-brain-oc/?v=v40-11-update-safe-private-20260629`

## Важно

`force-update.html` очищает только кэш и service worker. Операции, финансы и данные в localStorage не удаляются.
