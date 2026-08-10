# Модель данных Second Brain OS

Снята с рабочего приложения (схема версии 3), прошедшего все миграции — это
надёжнее, чем реконструкция по коду. Документ фиксирует смысл данных: новое
приложение обязано его сохранить.

## Где лежат данные

| Что | Где |
|---|---|
| Полное состояние | IndexedDB, база `SecondBrainOSDurableStorage`, хранилище `records`, ключ `main-state` |
| Компактное зеркало | `localStorage['secondBrainOS.v1']` — только `schemaVersion` и `settings.storageGuard` |
| Резервные копии | те же records, ключи `backup:*`, `daily:*` |
| Версия схемы | `state.schemaVersion` = 3 |

Так устроено с версии 104: `localStorage` намеренно не содержит записей —
он мал по объёму. Полагаться на него как на источник данных нельзя.

## Правило миграции: ничего не терять

Коллекций 37, полей в них — сотни, и часть накопилась стихийно. Поэтому
перенос делается **без потерь**: любое поле, которое новая модель не знает,
сохраняется как есть. Неизвестное поле — не мусор, а возможно смысл, который
я не распознал.

## Домены

### Время и действия
| Коллекция | Смысл |
|---|---|
| `tasks` | задачи и события дня |
| `inbox` | быстрый захват, ещё не разобранное |
| `planTemplates`, `lifePlans` | шаблоны и планы |

**task**: `id, title, date, time, durationMinutes, area, status, priority,
note, automationKey, completedAt, createdAt, updatedAt`

### Финансы
| Коллекция | Смысл |
|---|---|
| `financeAccounts` | счета и карты |
| `operations` | движения денег |
| `financeCategories` | категории с месячными лимитами (23 записи) |
| `financePlans` | плановые расходы месяца |
| `financeMonthBudgets` | бюджет по месяцам, ключ `ГГГГ-ММ` |
| `financeReservations` | резервы под обязательства |
| `financeWeeklyReviews` | недельные разборы |
| `deferredPurchases` | покупки на паузе |
| `purchases` | покупки |

**account**: `id, name, type, currency, actualBalance, calculatedBalance,
creditLimit, creditDebt, includeAvailable, createdAt`

Ключевой момент: `actualBalance` может быть `null`. Это **не ноль** — это
«остаток не заполнен». Приложение специально различает эти случаи и не
показывает незаполненное как безопасный ноль.

**operation**: `id, date, type (income|expense|transfer), amount, category,
expenseClass, account, accountId, incomeSource, note, planId, createdAt, updatedAt`

**financeCategory**: `id, name, type, icon, color, active, archived,
monthlyLimit, defaultExpenseClass, order, createdAt, updatedAt`

### Обязательства
| Коллекция | Смысл |
|---|---|
| `debts` | долги и кредиты |
| `debtPayments` | платежи по ним |

**debt**: `id, direction (out|in), creditor, person, type, status,
initialAmount, currentBalance, amount, principalBalance, accruedInterest,
penalties, interestRate, fullCost, minimumPayment, nextPaymentDate, due,
endDate, daysOverdue, priority, canRestructure, canProlong, documents, note,
paymentAmount, paymentFrequency, createdAt, updatedAt, lastInfoUpdate`

Главный смысл раздела, вынесенный в интерфейс: **платёж делится на тело,
проценты и штрафы, и весь платёж не уменьшает основной долг.** Отсюда
раздельные `principalBalance`, `accruedInterest`, `penalties`. Расчёт срока
погашения я проверил на реальных числах — он корректен.

### Привычки и дисциплина
**habit**: `id, name, icon, color, marks (объект: дата → отметка), target,
unit, frequency, active, note, createdAt`

`marks` — словарь по датам, а не массив. При переносе структуру сохранять как есть.

`habitWishlist` — задуманные, но не заведённые привычки.
`discipline` — `activeHabit, sessions, financeChecks, reviews, timer, xp, level`.

### Цели и игра
`goals` — цели, связываются с привычками.
`gameLife` — `xp, coins, logs, captures, achievements, checkIns,
eveningReviews, weeklyReviews, skillXp, rewards`.

### Знания и информация
`notes`, `ideas`, `documents`, `books`, `bookSessions`, `films`,
`learningMaterials`, `knowledgeLinks`.

### Люди и отношения
`people`, `polinaDays`, `coupleActivities`.

### Личное
`personal`, `subconsciousEntries` — дневник; данные чувствительные,
в облачную копию по умолчанию не входят.

### Прочее
`wishes`, `trips`, `archive`, `settings`.

`settings` содержит вложенные разделы по версиям (`v78, v80, … v8612, v107`) —
накопившиеся настройки интерфейса. Смысла данных они почти не несут, но
переносятся целиком: там же лежат `currentBalance`, `profile`, `name`.

## Инварианты, которые нельзя нарушить

1. **Незаполненное ≠ ноль.** `actualBalance: null` и `0 ₽` — разные состояния.
2. **Платёж по долгу расщепляется** на тело, проценты и штрафы.
3. **Отметки привычек — словарь по датам**, порядок и формат ключей значимы.
4. **Схема данных версии 3** — новое приложение читает её без изменения.
5. **Полное состояние в IndexedDB**, не в localStorage.
6. **Резервная копия создаётся до первой записи** новой версии.
