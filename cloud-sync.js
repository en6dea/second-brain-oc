'use strict';
/* Second Brain OS V96 — optional owner-only Firebase synchronization. */
(() => {
  const SCRIPT_URLS = [
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
  ];
  const DEVICE_KEY = 'secondBrainOS.deviceId';
  const LAST_SYNC_KEY = 'secondBrainOS.cloud.lastSync';
  const state = {
    configured: false,
    ready: false,
    loading: false,
    user: null,
    status: 'Синхронизация не настроена',
    lastSync: localStorage.getItem(LAST_SYNC_KEY) || '',
    error: ''
  };
  let initPromise = null;
  let unsubscribeAuth = null;

  const toast = message => {
    try { window.SecondBrainApp?.toast?.(message); }
    catch (_) { console.info(message); }
  };
  const render = () => {
    try { window.SecondBrainApp?.render?.(); }
    catch (_) {}
  };
  const config = () => window.SECOND_BRAIN_FIREBASE_CONFIG || null;
  const validConfig = value => Boolean(
    value && typeof value === 'object' &&
    value.apiKey && value.projectId && value.authDomain && value.appId &&
    !Object.values(value).some(item => /YOUR_|CHANGE_ME|example/i.test(String(item || '')))
  );
  const deviceId = () => {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  };
  const setStatus = (patch = {}) => {
    Object.assign(state, patch);
    window.dispatchEvent(new CustomEvent('second-brain-cloud-status', { detail: getStatus() }));
    render();
  };
  const getStatus = () => ({
    configured: state.configured,
    ready: state.ready,
    loading: state.loading,
    user: state.user ? { uid: state.user.uid, email: state.user.email || '' } : null,
    status: state.status,
    lastSync: state.lastSync,
    error: state.error
  });

  const loadScript = src => new Promise((resolve, reject) => {
    if ([...document.scripts].some(script => script.src === src)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Не удалось загрузить ${src.split('/').pop()}`));
    document.head.appendChild(script);
  });

  async function loadFirebase() {
    if (window.firebase?.auth && window.firebase?.firestore) return;
    for (const src of SCRIPT_URLS) await loadScript(src);
    if (!window.firebase?.auth || !window.firebase?.firestore) throw new Error('Firebase SDK загрузился не полностью');
  }

  const documentRef = uid => window.firebase.firestore().collection('users').doc(uid).collection('state').doc('main');
  const localState = () => window.SecondBrainApp?.getState?.() || window.state || null;
  const localUpdatedAt = value => value?.updatedAt || value?.settings?.updatedAt || '';
  const cloneState = value => { try { return structuredClone(value); } catch (_) { return JSON.parse(JSON.stringify(value)); } };
  const cloudPayload = value => {
    const copy = cloneState(value || {});
    copy.settings = copy.settings && typeof copy.settings === 'object' ? copy.settings : {};
    delete copy.settings.v107CloudOmissions;
    const privacy = copy.settings.v107 || {};
    if (privacy.excludePolinaCloud) {
      copy.polinaDays = [];
      copy.settings.v107CloudOmissions = ['polinaDays'];
    }
    return copy;
  };

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const cfg = config();
      state.configured = validConfig(cfg);
      if (!state.configured) {
        setStatus({ ready: false, loading: false, status: 'Синхронизация не настроена', error: '' });
        return getStatus();
      }
      setStatus({ loading: true, status: 'Подключение к облаку…', error: '' });
      try {
        await loadFirebase();
        if (!window.firebase.apps.length) window.firebase.initializeApp(cfg);
        const auth = window.firebase.auth();
        if (unsubscribeAuth) unsubscribeAuth();
        unsubscribeAuth = auth.onAuthStateChanged(user => {
          setStatus({
            ready: true,
            loading: false,
            user: user || null,
            status: user ? `Подключено: ${user.email || 'аккаунт'}` : 'Облако готово — требуется вход',
            error: ''
          });
        });
        return getStatus();
      } catch (error) {
        setStatus({ ready: false, loading: false, status: 'Ошибка подключения к облаку', error: error?.message || String(error) });
        console.warn('[Second Brain Cloud V96]', error);
        return getStatus();
      }
    })();
    return initPromise;
  }

  async function requireReady() {
    await init();
    if (!state.configured) {
      toast('Облачная синхронизация не настроена. Сначала заполните firebase-config.js.');
      return null;
    }
    if (!state.ready || !window.firebase?.auth) {
      toast(state.error || 'Облако пока недоступно');
      return null;
    }
    return window.firebase.auth();
  }

  async function login(email, password) {
    const auth = await requireReady();
    if (!auth) return false;
    if (!email || !password) return toast('Введите email и пароль'), false;
    try {
      setStatus({ loading: true, status: 'Вход…', error: '' });
      await auth.signInWithEmailAndPassword(email, password);
      toast('Вход выполнен');
      return true;
    } catch (error) {
      setStatus({ loading: false, status: 'Не удалось войти', error: error?.message || String(error) });
      toast('Не удалось войти: проверьте email и пароль');
      return false;
    }
  }

  async function register(email, password) {
    const auth = await requireReady();
    if (!auth) return false;
    if (!email || password.length < 6) return toast('Введите email и пароль минимум из 6 символов'), false;
    try {
      setStatus({ loading: true, status: 'Создание аккаунта…', error: '' });
      await auth.createUserWithEmailAndPassword(email, password);
      toast('Аккаунт создан');
      return true;
    } catch (error) {
      setStatus({ loading: false, status: 'Не удалось создать аккаунт', error: error?.message || String(error) });
      toast('Не удалось создать аккаунт');
      return false;
    }
  }

  async function logout() {
    const auth = await requireReady();
    if (!auth) return false;
    await auth.signOut();
    toast('Вы вышли из облака');
    return true;
  }

  async function pushNow(explicitState) {
    const auth = await requireReady();
    const user = auth?.currentUser;
    if (!user) return toast('Сначала войдите в аккаунт'), false;
    const sourceData = explicitState || localState();
    if (!sourceData || typeof sourceData !== 'object') return toast('Локальные данные не найдены'), false;
    const data = cloudPayload(sourceData);
    try {
      setStatus({ loading: true, status: 'Отправка данных…', error: '' });
      const syncedAt = new Date().toISOString();
      await documentRef(user.uid).set({
        state: data,
        schemaVersion: data.schemaVersion || 1,
        clientUpdatedAt: localUpdatedAt(data) || syncedAt,
        syncedAt,
        deviceId: deviceId(),
        serverUpdatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
      localStorage.setItem(LAST_SYNC_KEY, syncedAt);
      setStatus({ loading: false, lastSync: syncedAt, status: 'Данные отправлены', error: '' });
      toast('☁️ Данные отправлены в облако');
      return true;
    } catch (error) {
      setStatus({ loading: false, status: 'Ошибка отправки', error: error?.message || String(error) });
      toast('Не удалось отправить данные');
      return false;
    }
  }

  async function pullNow() {
    const auth = await requireReady();
    const user = auth?.currentUser;
    if (!user) return toast('Сначала войдите в аккаунт'), false;
    try {
      setStatus({ loading: true, status: 'Загрузка данных…', error: '' });
      const snapshot = await documentRef(user.uid).get();
      if (!snapshot.exists) {
        setStatus({ loading: false, status: 'В облаке пока нет данных', error: '' });
        toast('В облаке пока нет сохранённой базы');
        return false;
      }
      const remote = snapshot.data() || {};
      if (!remote.state || typeof remote.state !== 'object') throw new Error('Облачная копия повреждена');
      const accepted = window.confirm('Заменить локальную базу облачной копией? Перед заменой будет создан локальный backup.');
      if (!accepted) {
        setStatus({ loading: false, status: 'Загрузка отменена', error: '' });
        return false;
      }
      await window.SecondBrainBackup?.create?.();
      if (typeof window.SecondBrainApp?.setStateFromCloud !== 'function') throw new Error('Приложение не поддерживает безопасное применение облачной копии');
      const incoming = cloneState(remote.state);
      if (Array.isArray(incoming?.settings?.v107CloudOmissions) && incoming.settings.v107CloudOmissions.includes('polinaDays')) {
        incoming.polinaDays = cloneState(localState()?.polinaDays || []);
      }
      if (incoming?.settings && typeof incoming.settings === 'object') delete incoming.settings.v107CloudOmissions;
      window.SecondBrainApp.setStateFromCloud(incoming);
      const syncedAt = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, syncedAt);
      setStatus({ loading: false, lastSync: syncedAt, status: 'Облачная копия загружена', error: '' });
      toast('☁️ Облачная копия применена');
      return true;
    } catch (error) {
      setStatus({ loading: false, status: 'Ошибка загрузки', error: error?.message || String(error) });
      toast('Не удалось загрузить облачную копию');
      return false;
    }
  }

  window.SecondBrainCloud = { init, login, register, logout, pushNow, pullNow, getStatus };
  // Статус конфигурации доступен сразу, SDK загружается только при реальной настройке.
  state.configured = validConfig(config());
  state.status = state.configured ? 'Облако ожидает подключения' : 'Синхронизация не настроена';
})();
