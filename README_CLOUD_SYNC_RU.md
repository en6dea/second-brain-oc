# Second Brain OS — Cloud Sync

Эта версия синхронизирует данные между ПК и iPhone через Firebase Auth + Cloud Firestore.

## Что получится

- один личный аккаунт по email/паролю;
- данные лежат в Firestore в документе `users/{uid}/sync/app`;
- ПК и iPhone используют один и тот же аккаунт;
- изменения автосохраняются в облако после ввода;
- остаётся ручной JSON-бэкап на всякий случай.

## 1. Создай Firebase project

1. Открой https://console.firebase.google.com/
2. Нажми **Add project / Создать проект**.
3. Назови проект, например `second-brain-os`.
4. Google Analytics можно отключить для личного приложения.

## 2. Включи вход по email и паролю

1. В Firebase Console открой **Build → Authentication**.
2. Нажми **Get started**.
3. Открой вкладку **Sign-in method**.
4. Включи **Email/Password**.
5. Сохрани.

## 3. Создай Cloud Firestore

1. Открой **Build → Firestore Database**.
2. Нажми **Create database**.
3. Выбери **Production mode**.
4. Выбери регион.

## 4. Вставь правила безопасности

В Firestore открой вкладку **Rules** и вставь:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/sync/app {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Нажми **Publish**.

Эти правила дают доступ только владельцу аккаунта: пользователь может читать и писать только свой документ.

## 5. Получи Firebase config

1. Открой **Project settings → General**.
2. В блоке **Your apps** нажми иконку Web `</>`.
3. Назови приложение, например `Second Brain OS`.
4. Скопируй объект `firebaseConfig`.
5. Открой файл `firebase-config.js`.
6. Замени значения `PASTE_...` на свои.

Пример:

```js
window.SECOND_BRAIN_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "second-brain-os.firebaseapp.com",
  projectId: "second-brain-os",
  storageBucket: "second-brain-os.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

## 6. Где разместить приложение

### Вариант А — Firebase Hosting

Нужен Node.js.

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

При `firebase init hosting` выбирай текущий проект и public directory: `.`.

После деплоя Firebase даст ссылку вида:

```text
https://second-brain-os.web.app
```

### Вариант Б — GitHub Pages

Можно загрузить файлы в GitHub Pages. После этого в Firebase Authentication нужно добавить домен GitHub Pages в **Settings → Authorized domains**, например:

```text
your-login.github.io
```

## 7. Первый запуск

### На ПК

1. Открой приложение по ссылке.
2. Перейди в **☁️ Синхронизация**.
3. Создай аккаунт.
4. Нажми **Отправить это устройство в облако**.

### На iPhone

1. Открой ту же ссылку в Safari.
2. Нажми **Поделиться → Добавить на экран Домой**.
3. Открой приложение с домашнего экрана.
4. Войди в тот же аккаунт.
5. Нажми **Загрузить из облака**.

## 8. Как работает синхронизация

- После входа данные автоматически отправляются в облако после изменений.
- При входе приложение проверяет, нет ли в облаке более свежей версии.
- Для безопасного контроля есть ручные кнопки:
  - **Отправить это устройство в облако**;
  - **Загрузить из облака**.

## 9. Важно

Перед первым импортом на новом устройстве скачай JSON-бэкап. Это личные финансовые и жизненные данные, поэтому правила безопасности Firestore обязательны.
