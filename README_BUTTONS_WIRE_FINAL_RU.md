# Second Brain OS — Buttons Wire Final Fix

Точечный фикс кнопок без изменения дизайна.

Что сделано:
- `index.html` теперь подключает `app.js` с cache-busting query: `app.js?v=buttons-wire-final-20260630-2`.
- `sw.js` больше не кэширует старый `app.js` как основной shell-файл.
- Добавлен жёсткий `SBOS_FORCE_ACTION` для кнопок категорий и долгов.
- Кнопки получают `type=button`, capture-listener и inline fallback.
- Удаление категории переводит связанные операции/покупки в «Без категории».
- Дизайн Timeline Focus / light tech не менялся.

После загрузки откройте `/force-update.html`, затем обычный домен.
