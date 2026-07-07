# Second Brain OS · V43 Expense Category Review

Версия V43 сделана поверх V41/V40 без внедрения V42 hard-reset в рабочую базу.

## Что добавлено

- Отдельная страница `Категории расходов` в блоке `ФИНАНСЫ`.
- Все расходы группируются по категориям.
- По каждой категории видно сумму, количество операций и процент от расходов.
- Каждую операцию можно быстро перенести в правильную категорию.
- Операции можно отмечать как проверенные.
- Можно показать только непроверенные операции.
- Можно переименовать/перенести всю категорию целиком.
- Добавлен поиск по магазину, описанию, сумме и категории.
- Сохранена текущая логика Finance Cockpit, CSV-импорта, синхронизации, дневника и диагностики.

## Что заменить

Заменить в корне GitHub:

```text
app.js
index.html
sw.js
force-update.html
version-check.html
README_SECOND_BRAIN_SPACE_V43_RU.md
```

## Проверка

```text
https://en6dea.github.io/second-brain-oc/version-check.html?v=v43
```

```text
https://en6dea.github.io/second-brain-oc/force-update.html?v=v43-expense-category-review
```

```text
https://en6dea.github.io/second-brain-oc/?v=second-brain-space-v43-expense-category-review-20260707#expense-review
```

Бейдж внизу:

```text
V43 · РАСХОДЫ · ПРОВЕРКА КАТЕГОРИЙ
```
