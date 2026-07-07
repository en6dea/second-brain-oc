# Cloudflare Worker для Альфа-Банк API → Second Brain OS

Это шаблон защищённого сервера-посредника. Он нужен, потому что банковские `client_secret`, `refresh_token` и другие секреты нельзя хранить в браузере или GitHub Pages.

## Что делает Worker

1. Получает запрос от Second Brain OS.
2. Проверяет `X-Second-Brain-Key`.
3. На своей стороне обращается к Альфа-Банк API.
4. Нормализует операции к формату:

```json
{
  "operations": [
    { "date": "2026-07-07", "type": "expense", "amount": 1250, "category": "Продукты", "note": "Альфа · магазин" }
  ]
}
```

## Пошагово

1. Создать Cloudflare аккаунт.
2. Создать Worker.
3. Вставить код из `second-brain-alfa-worker-template.js`.
4. Добавить Secrets:
   - `SECOND_BRAIN_KEY`
   - `ALFA_CLIENT_ID`
   - `ALFA_CLIENT_SECRET`
   - `ALFA_REFRESH_TOKEN`
   - `ALFA_ACCOUNT_ID`, если потребуется
5. Проверить `/health`.
6. В Second Brain OS открыть `Финансы → Импорт / Альфа`.
7. Вставить Worker URL и ключ.
8. Нажать `Проверить Worker`.
9. Нажать `Загрузить операции`.

## Важно для личной карты

Для личной карты доступ зависит от того, даст ли Альфа-Банк нужные scopes для истории операций физлица. Если scope недоступен, fallback — CSV, email-выписка или ручная выгрузка.
