# Установка V85 в GitHub Pages

1. В текущем приложении скачайте JSON через «Экспорт данных».
2. Распакуйте архив `second-brain-oc-v85-automation-hp-update-only.zip`.
3. Загрузите файлы из архива в корень репозитория `second-brain-oc` с заменой.
4. Проверьте, что `index.html` находится рядом с `manifest.webmanifest`, а не во вложенной папке.
5. Выполните Commit changes.
6. Дождитесь завершения публикации GitHub Pages.
7. Один раз откройте:

   `https://en6dea.github.io/second-brain-oc/force-update.html`

Страница удаляет только старый кэш интерфейса. Личные данные браузера не очищаются.

## Откат

Для отката используйте архив `second-brain-oc-backup-v833-before-v85.zip`: загрузите его файлы в корень репозитория с заменой и снова откройте `force-update.html`.
