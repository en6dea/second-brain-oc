# Second Brain OS — CLEAN RPG REBUILD V29

## Главное
Это не очередной патч поверх старых слоёв. V29 — чистая пересборка интерфейса:

- удалена зависимость от старых визуальных патчей V18–V28;
- новый единый renderer для главной, целей, задач, финансов, привычек, заметок, людей и системы;
- новый единый CSS без конфликтующих слоёв;
- новый service worker с актуальной версией;
- встроенная диагностика `SecondBrainBuild.inspect()`;
- встроенный сброс кэша `SecondBrainBuild.resetCaches()`.

## Что реализовано

- Главная в стиле Notion / Warm Premium / Obsidian.
- SMART-цели как RPG-пространство:
  - цель = миссия / boss goal;
  - задачи = квесты;
  - привычки = навыки;
  - финансы = ресурс;
  - люди = союзники;
  - заметки = knowledge base;
  - прогресс = XP / уровень / milestones.
- Obsidian-граф связей.
- Активные кнопки добавления и редактирования.
- Бэкап JSON.
- Тёмная тема.
- Адаптивность.

## Что заменить в GitHub

Заменить строго эти файлы в корне репозитория:

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`

## Как открыть

`https://en6dea.github.io/second-brain-oc/?v=v29-clean-rpg-rebuild-20260626`

Для SMART-целей напрямую:

`https://en6dea.github.io/second-brain-oc/?v=v29-clean-rpg-rebuild-20260626&page=goals`

## Если браузер держит старую версию

В консоли выполнить:

```js
SecondBrainBuild.resetCaches()
```

И заново открыть ссылку с `?v=v29-clean-rpg-rebuild-20260626`.

## Проверка

В консоли:

```js
SecondBrainBuild.inspect()
```

Должно показать:

```text
version: v29-clean-rpg-rebuild-20260626
```
