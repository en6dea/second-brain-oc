# Выкладка Second Brain OS V89 в GitHub

Репозиторий: `en6dea/second-brain-oc`

## Перед загрузкой

1. Открой текущую версию приложения.
2. В настройках создай штатный экспорт/backup данных и сохрани файл локально.
3. Не очищай Local Storage, IndexedDB и данные сайта.

## Вариант 1 — заменить файлы через GitHub Web

Загрузи в корень репозитория файлы из архива `second-brain-oc-v89-upload-files.zip` с заменой одноимённых:

- `index.html`
- `styles-v89-critical.css`
- `app-v89-critical.js`
- `manifest.webmanifest`
- `pwa-v88.js`
- `sw.js`
- `sbos-build.txt`
- `README_V89_CRITICAL_STABILITY_RU.md`
- `QA_V89_RESULTS.txt`

Commit message: `Release V89 critical stability`

## Вариант 2 — заменить репозиторий готовой полной сборкой

Распакуй `second-brain-oc-v89-github-ready.zip` и загрузи содержимое папки `second-brain-oc-main` в корень репозитория.

## После публикации

1. Дождись завершения GitHub Pages deployment.
2. Открой: `https://en6dea.github.io/second-brain-oc/?v=89#today`.
3. Дождись сообщения о безопасном обновлении или перезагрузи страницу 1 раз.
4. Проверь бейдж `V89 · CRITICAL STABILITY`.
5. Проверь: календарь, модальное окно, привычку, финансы и очередь «Разобрать».

## Rollback

При критической проблеме верни предыдущие версии `index.html`, `manifest.webmanifest`, `pwa-v88.js`, `sw.js` и удали подключения V89 из `index.html`. Пользовательские хранилища не очищай.
