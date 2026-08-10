/* Second Brain OS — consolidated deferred bundle (cloud sync, backups, bootstrap, PWA). Loaded with defer, same relative order as original.
   Firebase config (window.SECOND_BRAIN_FIREBASE_CONFIG) is provided separately by firebase-config.js, which is gitignored and created locally from firebase-config.example.js. */

/* ===== source: cloud-sync.js ===== */
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

/* ===== source: backup-v104.js ===== */
/* Second Brain OS V104 — full-state backups sourced from IndexedDB or the live state. */
'use strict';
(() => {
  const DB_NAME = 'SecondBrainOSDurableStorage';
  const DB_STORE = 'records';
  const DB_MAIN = 'main-state';
  const build = window.SecondBrainBuild || {major: 104, id: 'second-brain-os-v104'};
  const markerKey = `secondBrainOS.v${build.major}.backupCreated`;
  const status = {attempted: false, created: false, createdAt: '', error: '', counts: {}};

  const openDb = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB недоступен'));
  });

  async function dbGet(key) {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const request = tx.objectStore(DB_STORE).get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  async function dbPut(key, value) {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Не удалось сохранить резервную копию'));
        tx.onabort = () => reject(tx.error || new Error('Резервное копирование отменено'));
      });
    } finally {
      db.close();
    }
  }

  const clone = (value) => {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  };

  const counts = (state) => Object.fromEntries(
    Object.entries(state || {}).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])
  );

  async function fullState() {
    const durable = await dbGet(DB_MAIN).catch(() => null);
    if (durable?.state && typeof durable.state === 'object') return durable.state;
    const live = window.SecondBrainApp?.getState?.() || window.state;
    if (live && typeof live === 'object' && Object.keys(live).length) return live;
    try {
      const local = JSON.parse(localStorage.getItem('secondBrainOS.v1') || 'null');
      if (local?.settings?.storageGuard?.compactMirror) return null;
      return local?.state || local;
    } catch (_) {
      return null;
    }
  }

  async function create({force = false, reason = 'automatic-before-v104'} = {}) {
    status.attempted = true;
    try {
      const existing = localStorage.getItem(markerKey);
      if (existing && !force) {
        status.created = true;
        status.createdAt = existing;
        return {...status, reused: true};
      }
      const source = await fullState();
      if (!source) {
        status.error = 'Полное состояние ещё не загружено';
        return {...status, retryable: true};
      }
      const createdAt = new Date().toISOString();
      const snapshot = clone(source);
      status.counts = counts(snapshot);
      await dbPut(`backup:v104:${createdAt}`, {
        version: 104,
        buildId: build.id,
        dataSchemaVersion: 1,
        createdAt,
        reason,
        state: snapshot,
        counts: status.counts
      });
      localStorage.setItem(markerKey, createdAt);
      status.created = true;
      status.createdAt = createdAt;
      status.error = '';
      window.dispatchEvent(new CustomEvent('second-brain-backup-created', {detail: {createdAt, counts: status.counts}}));
      return {...status};
    } catch (error) {
      status.error = error?.message || String(error);
      console.warn('[Second Brain V104 backup]', error);
      return {...status};
    }
  }

  window.SecondBrainBackup = {create, getStatus: () => ({...status}), fullState};
  const schedule = () => {
    setTimeout(() => create(), 350);
    setTimeout(() => { if (!status.created) create(); }, 1800);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once: true});
  else schedule();
})();

/* ===== source: bootstrap-v104.js ===== */
/* Second Brain OS V104 — single diagnostics renderer and safe update controls. */
'use strict';
(() => {
  const build = window.SecondBrainBuild || {major: 104, label: 'V104', cacheVersion: 'v104-r1', criticalFiles: []};
  const errors = [];
  let decorating = false;
  let scheduled = 0;

  const addError = (message, source = 'runtime') => {
    errors.unshift({at: new Date().toISOString(), source, message: String(message || 'Неизвестная ошибка').slice(0, 1200)});
    errors.splice(30);
  };
  window.addEventListener('error', (event) => addError(event.error?.message || event.message, 'window.error'));
  window.addEventListener('unhandledrejection', (event) => addError(event.reason?.message || event.reason, 'unhandledrejection'));

  async function checkResources() {
    const results = [];
    for (const file of build.criticalFiles || []) {
      try {
        const response = await fetch(`${file}${file.includes('?') ? '&' : '?'}build=${encodeURIComponent(build.cacheVersion)}`, {cache: 'no-store'});
        results.push({file, status: response.status, ok: response.ok});
      } catch (error) {
        results.push({file, status: 0, ok: false, error: error?.message || String(error)});
      }
    }
    return results;
  }

  async function pwaStatus() {
    if (!('serviceWorker' in navigator)) return {supported: false};
    const registration = await navigator.serviceWorker.getRegistration().catch(() => null);
    return {
      supported: true,
      controlled: Boolean(navigator.serviceWorker.controller),
      registered: Boolean(registration),
      waiting: Boolean(registration?.waiting)
    };
  }

  const storageLabel = () => {
    const mode = document.body?.dataset?.sbosStorage;
    if (mode === 'error') return 'Требует внимания';
    if (mode === 'indexeddb-primary' || mode === 'indexeddb-only') return 'IndexedDB · основное';
    return 'IndexedDB · готово';
  };

  async function report() {
    return {
      build,
      location: {href: location.href, standalone: matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone === true},
      storage: {mode: document.body?.dataset?.sbosStorage || 'booting'},
      backup: window.SecondBrainBackup?.getStatus?.() || null,
      cloud: window.SecondBrainCloud?.getStatus?.() || null,
      pwa: await pwaStatus(),
      resources: await checkResources(),
      errors: [...errors]
    };
  }

  async function copyReport() {
    const text = JSON.stringify(await report(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      window.SecondBrainApp?.toast?.('Технический отчёт скопирован');
    } catch (_) {
      const blob = new Blob([text], {type: 'application/json'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `second-brain-diagnostics-v104-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
  }

  async function clearUiCache() {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('second-brain-os-')).map((name) => caches.delete(name)));
    const registration = await navigator.serviceWorker?.getRegistration?.().catch(() => null);
    await registration?.update?.().catch(() => undefined);
    window.SecondBrainApp?.toast?.('Кэш интерфейса очищен. Данные сохранены.');
    setTimeout(() => location.reload(), 650);
  }

  async function decorateSettings(force = false) {
    const page = document.querySelector('.v78-page');
    if (!page || !/настройки/i.test(page.querySelector('h1')?.textContent || '')) return;
    if (decorating && !force) return;
    if (page.querySelector('[data-v104-diagnostics]') && !force) return;
    decorating = true;
    try {
      const [resources, pwa] = await Promise.all([checkResources(), pwaStatus()]);
      if (!page.isConnected || !/настройки/i.test(page.querySelector('h1')?.textContent || '')) return;
      page.querySelectorAll('[data-v104-diagnostics],[data-v98-diagnostics],[data-v97-diagnostics]').forEach((node) => node.remove());
      const backup = window.SecondBrainBackup?.getStatus?.() || {};
      const failed = resources.filter((item) => !item.ok).length;
      const card = document.createElement('section');
      card.className = 'v98-diagnostics-card v104-diagnostics-card';
      card.dataset.v104Diagnostics = 'true';
      card.innerHTML = `
        <header>
          <div><small>СОСТОЯНИЕ ПРИЛОЖЕНИЯ</small><h2>Хранение, файлы и PWA</h2><p>Один компактный контрольный центр без повторяющихся блоков.</p></div>
          <span>${build.label}</span>
        </header>
        <div class="v98-diagnostics-grid">
          <article><small>Хранение</small><b>${storageLabel()}</b></article>
          <article><small>Резервная копия</small><b>${backup.createdAt ? new Date(backup.createdAt).toLocaleString('ru-RU') : 'Создаётся'}</b></article>
          <article><small>Файлы сборки</small><b>${failed ? `Недоступно: ${failed}` : 'Все доступны'}</b></article>
          <article><small>Service Worker</small><b>${pwa.controlled ? 'Активен' : pwa.registered ? 'Зарегистрирован' : 'Не активен'}</b></article>
        </div>
        <div class="v98-diagnostics-actions">
          <button type="button" data-v104-action="check-resources">Проверить файлы</button>
          <button type="button" data-v104-action="clear-ui-cache">Обновить интерфейс</button>
          <button type="button" data-v104-action="copy-diagnostics">Скопировать отчёт</button>
        </div>
        <details><summary>Проверенные файлы</summary><div class="v98-resource-list">${resources.map((item) => `<span class="${item.ok ? 'ok' : 'bad'}"><b>${item.ok ? '✓' : '!'}</b>${item.file}<em>${item.status || 'ошибка'}</em></span>`).join('')}</div></details>`;
      page.appendChild(card);
    } finally {
      decorating = false;
    }
  }

  function queueDecorate() {
    cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(() => decorateSettings(false));
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('[data-v104-action]');
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.v104Action;
    if (action === 'copy-diagnostics') return copyReport();
    if (action === 'clear-ui-cache') {
      if (confirm('Очистить только кэш интерфейса? Личные данные останутся на месте.')) return clearUiCache();
      return;
    }
    if (action === 'check-resources') {
      button.disabled = true;
      button.textContent = 'Проверяю…';
      await decorateSettings(true);
      window.SecondBrainApp?.toast?.('Проверка завершена');
    }
  });

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length)) queueDecorate();
  });
  const start = () => {
    observer.observe(document.documentElement, {childList: true, subtree: true});
    decorateSettings(false);
    document.documentElement.classList.add('sbos-v104-ready');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();

  window.SecondBrainDiagnostics = {
    report,
    copyReport,
    checkResources,
    clearUiCache,
    addError,
    getErrors: () => [...errors]
  };
})();

/* ===== source: pwa-v98.js ===== */
/* Second Brain OS V98 — controlled PWA updates. */
(function(){'use strict';const build=window.SecondBrainBuild||{cacheVersion:'v98-r1'};let deferredPrompt=null;const state={registered:false,installed:window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true,updateReady:false,error:'',registration:null};const render=()=>window.SecondBrainApp?.render?.();const toast=message=>window.SecondBrainApp?.toast?.(message);function announceUpdate(){state.updateReady=true;window.dispatchEvent(new CustomEvent('second-brain-update-ready',{detail:{build}}));toast('Доступно обновление интерфейса. Данные останутся на месте.');render()}window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;render()});window.addEventListener('appinstalled',()=>{state.installed=true;deferredPrompt=null;toast('Second Brain OS установлен');render()});async function register(){if(!('serviceWorker'in navigator))return;try{const registration=await navigator.serviceWorker.register(`./sw.js?build=${encodeURIComponent(build.cacheVersion)}`,{scope:'./',updateViaCache:'none'});state.registration=registration;state.registered=true;registration.addEventListener('updatefound',()=>{const worker=registration.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)announceUpdate()})});if(registration.waiting&&navigator.serviceWorker.controller)announceUpdate();await registration.update().catch(()=>undefined)}catch(error){state.error=error?.message||String(error);console.warn('[PWA V98]',error)}}async function install(){if(state.installed){toast('Приложение уже установлено');return}if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;return}toast(/iphone|ipad|ipod/i.test(navigator.userAgent)?'Safari → Поделиться → На экран «Домой»':'Нажмите значок установки в адресной строке браузера')}async function applyUpdate(){const registration=state.registration||await navigator.serviceWorker?.getRegistration?.();if(registration?.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});return}await registration?.update?.().catch(()=>undefined);location.reload()}async function checkForUpdate(){const registration=state.registration||await navigator.serviceWorker?.getRegistration?.();await registration?.update?.();if(registration?.waiting)announceUpdate();else toast('Установлена актуальная версия интерфейса')}navigator.serviceWorker?.addEventListener?.('controllerchange',()=>{const key=`sbos-${build.cacheVersion}-reloaded`;try{if(sessionStorage.getItem(key)==='1')return;sessionStorage.setItem(key,'1');location.reload()}catch(_){location.reload()}});window.SecondBrainPWA={install,applyUpdate,checkForUpdate,getStatus:()=>({...state,registration:undefined,canPrompt:Boolean(deferredPrompt)})};window.addEventListener('load',async()=>{await register();setTimeout(()=>window.SecondBrainCloud?.init?.(),250)})})();
