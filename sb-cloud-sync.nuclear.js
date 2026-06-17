(function () {
  'use strict';

  const DEVICE_KEY = 'secondBrainOS.deviceId';
  const deviceId = localStorage.getItem(DEVICE_KEY) || ('dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  localStorage.setItem(DEVICE_KEY, deviceId);

  let app = null;
  let auth = null;
  let db = null;
  let unsubAuth = null;
  let pushTimer = null;
  let isPushing = false;

  const cloudState = {
    configured: false,
    ready: false,
    user: null,
    status: 'Облако не настроено',
    lastSync: localStorage.getItem('secondBrainOS.lastSync') || '',
    lastError: ''
  };

  function hasConfig() {
    const cfg = window.SECOND_BRAIN_FIREBASE_CONFIG || {};
    return !!(cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('PASTE') && !String(cfg.projectId).includes('PASTE'));
  }

  function setStatus(text, error) {
    cloudState.status = text;
    cloudState.lastError = error || '';
    if (window.SecondBrainApp && window.SecondBrainApp.render) {
      if (document.getElementById('pageTitle')?.textContent === 'Синхронизация') window.SecondBrainApp.render();
    }
  }

  function docRef() {
    if (!db || !cloudState.user) return null;
    return db.collection('users').doc(cloudState.user.uid).collection('sync').doc('app');
  }

  async function init() {
    try {
      cloudState.configured = hasConfig();
      if (!cloudState.configured) {
        setStatus('Нужен firebase-config.js');
        return;
      }
      if (!window.firebase) {
        setStatus('Firebase SDK не загрузился', 'Проверь интернет и CDN-скрипты');
        return;
      }
      if (!firebase.apps.length) app = firebase.initializeApp(window.SECOND_BRAIN_FIREBASE_CONFIG);
      else app = firebase.app();
      auth = firebase.auth();
      db = firebase.firestore();
      cloudState.ready = true;
      setStatus('Готово к входу');
      unsubAuth = auth.onAuthStateChanged(async (user) => {
        cloudState.user = user ? { uid: user.uid, email: user.email } : null;
        if (user) {
          setStatus('Вход выполнен');
          await pullIfCloudNewer();
        } else {
          setStatus('Не выполнен вход');
        }
      });
    } catch (err) {
      console.error(err);
      setStatus('Ошибка инициализации облака', humanError(err));
    }
  }

  function schedulePush(data) {
    if (!cloudState.ready || !cloudState.user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushNow(data), 1400);
  }

  async function pushNow(data) {
    try {
      if (!cloudState.ready || !cloudState.user) return setStatus('Сначала войди в облако');
      isPushing = true;
      const payload = JSON.parse(JSON.stringify(data || window.SecondBrainApp.getState()));
      payload.meta = payload.meta || {};
      payload.meta.updatedAtLocal = new Date().toISOString();
      await docRef().set({
        state: payload,
        updatedAtLocal: payload.meta.updatedAtLocal,
        deviceId,
        appVersion: 'cloud-sync-1.0',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      cloudState.lastSync = payload.meta.updatedAtLocal;
      localStorage.setItem('secondBrainOS.lastSync', cloudState.lastSync);
      setStatus('Сохранено в облако');
      window.SecondBrainApp?.toast?.('☁️ Сохранено в облако');
    } catch (err) {
      console.error(err);
      setStatus('Не удалось отправить в облако', humanError(err));
    } finally {
      isPushing = false;
    }
  }

  async function pullNow() {
    try {
      if (!cloudState.ready || !cloudState.user) return setStatus('Сначала войди в облако');
      const snap = await docRef().get();
      if (!snap.exists) {
        setStatus('В облаке пока пусто. Нажми «Отправить это устройство в облако»');
        return;
      }
      const data = snap.data();
      if (!data || !data.state) {
        setStatus('В облаке нет данных приложения');
        return;
      }
      cloudState.lastSync = data.updatedAtLocal || new Date().toISOString();
      localStorage.setItem('secondBrainOS.lastSync', cloudState.lastSync);
      window.SecondBrainApp.setStateFromCloud(data.state);
      setStatus('Загружено из облака');
    } catch (err) {
      console.error(err);
      setStatus('Не удалось загрузить из облака', humanError(err));
    }
  }

  async function pullIfCloudNewer() {
    try {
      const snap = await docRef().get();
      if (!snap.exists) {
        await pushNow(window.SecondBrainApp.getState());
        return;
      }
      const cloud = snap.data();
      const local = window.SecondBrainApp.getState();
      const cloudTime = cloud.updatedAtLocal || '';
      const localTime = (local.meta && local.meta.updatedAtLocal) || '';
      if (cloud.state && cloudTime && cloudTime > localTime && cloud.deviceId !== deviceId) {
        window.SecondBrainApp.setStateFromCloud(cloud.state);
        setStatus('Автоматически загружена более свежая версия из облака');
      } else {
        setStatus('Синхронизация активна');
      }
    } catch (err) {
      console.warn(err);
      setStatus('Вход выполнен, но автозагрузка не удалась', humanError(err));
    }
  }

  async function register(email, password) {
    try {
      if (!cloudState.ready) return setStatus('Сначала настрой Firebase');
      await auth.createUserWithEmailAndPassword(email, password);
      await pushNow(window.SecondBrainApp.getState());
      window.SecondBrainApp?.toast?.('Аккаунт создан, данные отправлены в облако');
    } catch (err) {
      console.error(err);
      setStatus('Не удалось создать аккаунт', humanError(err));
    }
  }

  async function login(email, password) {
    try {
      if (!cloudState.ready) return setStatus('Сначала настрой Firebase');
      await auth.signInWithEmailAndPassword(email, password);
      window.SecondBrainApp?.toast?.('Вход выполнен');
    } catch (err) {
      console.error(err);
      setStatus('Не удалось войти', humanError(err));
    }
  }

  async function logout() {
    try {
      if (auth) await auth.signOut();
      cloudState.user = null;
      setStatus('Вы вышли из облака');
      window.SecondBrainApp?.render?.();
    } catch (err) {
      setStatus('Не удалось выйти', humanError(err));
    }
  }

  function refreshStatus() {
    if (!hasConfig()) {
      cloudState.configured = false;
      cloudState.ready = false;
      setStatus('Нужен firebase-config.js');
      return;
    }
    setStatus(cloudState.user ? 'Синхронизация активна' : 'Готово к входу');
  }

  function humanError(err) {
    const code = err && err.code ? String(err.code) : '';
    const map = {
      'auth/email-already-in-use': 'Такой email уже зарегистрирован. Нажми «Войти».',
      'auth/invalid-email': 'Некорректный email.',
      'auth/weak-password': 'Пароль слишком короткий. Нужно минимум 6 символов.',
      'auth/user-not-found': 'Пользователь не найден. Сначала создай аккаунт.',
      'auth/wrong-password': 'Неверный пароль.',
      'permission-denied': 'Firestore Rules не дают доступ. Проверь правила безопасности.',
      'unavailable': 'Нет соединения с Firebase.'
    };
    return map[code] || code || (err && err.message) || 'Неизвестная ошибка';
  }

  window.SecondBrainCloud = {
    init,
    getStatus: () => ({ ...cloudState }),
    register,
    login,
    logout,
    pushNow,
    pullNow,
    schedulePush,
    refreshStatus
  };
})();
