# Сохранность данных V96

## Неизменённый источник данных

- localStorage key: `secondBrainOS.v1`
- IndexedDB: `SecondBrainOSDurableStorage`
- object store: `records`

## Автоматический снимок

Ключ IndexedDB:

`backup:v96-before-stable-core:<ISO_DATE>`

Маркер:

`secondBrainOS.v96.backupCreated`

Дополнительная raw-копия, если исходная строка не больше 1,5 МБ:

`secondBrainOS.v96.rawLocalBackup`

## Что V96 не делает

- не очищает localStorage;
- не очищает IndexedDB;
- не меняет основной ключ;
- не подставляет демоданные;
- не применяет облачную копию без подтверждения;
- не объединяет финансовые операции автоматически;
- не очищает чужие Cache Storage-кэши.

## Ручной rollback

1. До загрузки V96 скачайте JSON в «Настройки → Резервная копия JSON».
2. Сохраните текущий V95 ZIP.
3. Для отката загрузите файлы V95 в GitHub с заменой.
4. Откройте приложение с новым query-параметром.
5. При необходимости импортируйте JSON-копию.
