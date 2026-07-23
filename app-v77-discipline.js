'use strict';

/* Second Brain OS V76 — надёжное локальное сохранение без сброса данных.
   Полное состояние хранится в IndexedDB, а localStorage остаётся совместимым зеркалом.
   При переполнении localStorage тяжёлые вложения остаются в IndexedDB и восстанавливаются при запуске. */
(() => {
  const BUILD = 'second-brain-space-v76-durable-storage-20260717-r1';
  const STORE_KEY = 'secondBrainOS.v1';
  const LEGACY_V75_BACKUP = 'secondBrainOS.v75.lastSafeBackup';
  const DB_NAME = 'SecondBrainOSDurableStorage';
  const DB_VERSION = 1;
  const OBJECT_STORE = 'records';
  const MAIN_KEY = 'main-state';
  const MAX_BACKUPS = 8;

  let dbPromise = null;
  let writeChain = Promise.resolve();
  let restoring = false;
  let initialized = false;
  let lastError = '';

  const clone = value => JSON.parse(JSON.stringify(value ?? null));
  const nowIso = () => new Date().toISOString();
  const byteLength = text => new Blob([String(text || '')]).size;

  function openDatabase() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB не поддерживается'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(OBJECT_STORE)) db.createObjectStore(OBJECT_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Не удалось открыть IndexedDB'));
      request.onblocked = () => reject(new Error('Обновление хранилища заблокировано другой вкладкой'));
    });
    return dbPromise;
  }

  async function dbGet(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE, 'readonly');
      const request = tx.objectStore(OBJECT_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Ошибка чтения IndexedDB'));
    });
  }

  async function dbPut(key, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE, 'readwrite');
      tx.objectStore(OBJECT_STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Ошибка записи IndexedDB'));
      tx.onabort = () => reject(tx.error || new Error('Запись IndexedDB отменена'));
    });
  }

  async function dbDelete(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE, 'readwrite');
      tx.objectStore(OBJECT_STORE).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Ошибка удаления IndexedDB'));
    });
  }

  async function dbKeys() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE, 'readonly');
      const request = tx.objectStore(OBJECT_STORE).getAllKeys();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Ошибка чтения ключей IndexedDB'));
    });
  }

  function storageMeta(source = state) {
    const settings = source?.settings && typeof source.settings === 'object' ? source.settings : {};
    return settings.storageGuard && typeof settings.storageGuard === 'object' ? settings.storageGuard : {};
  }

  function stampState(reason = 'save') {
    if (!state || typeof state !== 'object') return '';
    state.settings = state.settings && typeof state.settings === 'object' ? state.settings : {};
    const updatedAt = nowIso();
    state.settings.storageGuard = {
      ...(state.settings.storageGuard || {}),
      version: 76,
      updatedAt,
      reason,
      fullStateInIndexedDB: false
    };
    return updatedAt;
  }

  function writeLocal(serialized) {
    try {
      localStorage.setItem(STORE_KEY, serialized);
      return localStorage.getItem(STORE_KEY) === serialized;
    } catch (error) {
      lastError = String(error?.message || error || 'localStorage write failed');
      console.warn('[V76 localStorage]', error);
      return false;
    }
  }

  function compactState(source, aggressive = false) {
    const serialized = JSON.stringify(source, (key, value) => {
      if (typeof value !== 'string') return value;
      if (/^data:(?:image|video|audio|application)\//i.test(value) && value.length > 16000) return '';
      if (aggressive && value.length > 120000) return '';
      return value;
    });
    const compact = JSON.parse(serialized);
    compact.settings = compact.settings && typeof compact.settings === 'object' ? compact.settings : {};
    compact.settings.storageGuard = {
      ...(compact.settings.storageGuard || {}),
      version: 76,
      updatedAt: storageMeta(source).updatedAt || nowIso(),
      fullStateInIndexedDB: true,
      compactMirror: true
    };
    return compact;
  }

  async function migrateLegacyV75Backup() {
    let raw = '';
    try { raw = localStorage.getItem(LEGACY_V75_BACKUP) || ''; }
    catch (error) { return false; }
    if (!raw) return false;
    try {
      await dbPut(`legacy-backup:${Date.now()}`, {
        createdAt: nowIso(),
        sourceKey: LEGACY_V75_BACKUP,
        raw
      });
      localStorage.removeItem(LEGACY_V75_BACKUP);
      return true;
    } catch (error) {
      console.warn('[V76 legacy backup migration]', error);
      return false;
    }
  }

  async function pruneBackups() {
    try {
      const keys = (await dbKeys()).filter(key => String(key).startsWith('backup:')).sort().reverse();
      await Promise.all(keys.slice(MAX_BACKUPS).map(key => dbDelete(key)));
    } catch (error) {
      console.warn('[V76 backup prune]', error);
    }
  }

  async function backup(reason = 'manual') {
    const snapshot = {
      version: 76,
      createdAt: nowIso(),
      reason,
      state: clone(state)
    };
    const key = `backup:${snapshot.createdAt}:${Math.random().toString(36).slice(2, 8)}`;
    await dbPut(key, snapshot);
    pruneBackups();
    return key;
  }

  async function persistCurrent(reason = 'save') {
    if (!state || typeof state !== 'object') return { local: false, indexedDb: false };
    const updatedAt = storageMeta(state).updatedAt || stampState(reason);
    const fullState = clone(state);
    const fullSerialized = JSON.stringify(fullState);

    let indexedDbOk = false;
    try {
      await dbPut(MAIN_KEY, {
        version: 76,
        updatedAt,
        reason,
        bytes: byteLength(fullSerialized),
        state: fullState
      });
      indexedDbOk = true;
    } catch (error) {
      lastError = String(error?.message || error || 'IndexedDB write failed');
      console.error('[V76 IndexedDB]', error);
    }

    let localOk = writeLocal(fullSerialized);
    if (!localOk) {
      await migrateLegacyV75Backup();
      localOk = writeLocal(fullSerialized);
    }
    if (!localOk && indexedDbOk) {
      const compact = compactState(fullState, false);
      localOk = writeLocal(JSON.stringify(compact));
    }
    if (!localOk && indexedDbOk) {
      const compact = compactState(fullState, true);
      localOk = writeLocal(JSON.stringify(compact));
    }

    document.body.dataset.sbosStorage = indexedDbOk ? (localOk ? 'durable' : 'indexeddb-only') : (localOk ? 'local-only' : 'failed');
    if (!localOk && indexedDbOk) console.warn('[V76] Полное состояние сохранено в IndexedDB; localStorage оставлен компактным или недоступен.');
    if (!localOk && !indexedDbOk && typeof toast === 'function') toast('Не удалось сохранить данные. Не закрывайте вкладку и сделайте экспорт.');
    return { local: localOk, indexedDb: indexedDbOk };
  }

  function enqueuePersist(reason = 'save') {
    writeChain = writeChain
      .catch(() => undefined)
      .then(() => persistCurrent(reason));
    return writeChain;
  }

  function parseLocalState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state && typeof parsed.state === 'object' ? parsed.state : parsed;
    } catch (error) { return null; }
  }

  function newerThan(left, right) {
    if (!left) return false;
    if (!right) return true;
    return String(left) > String(right);
  }

  async function restoreFromDurableStore() {
    const snapshot = await dbGet(MAIN_KEY);
    const localState = parseLocalState() || state;
    const localMeta = storageMeta(localState);
    const durableMeta = storageMeta(snapshot?.state);
    const localNeedsFull = Boolean(localMeta.fullStateInIndexedDB || localMeta.compactMirror);
    const durableIsNewer = newerThan(snapshot?.updatedAt || durableMeta.updatedAt, localMeta.updatedAt);

    if (snapshot?.state && (localNeedsFull || durableIsNewer)) {
      restoring = true;
      try {
        state = typeof normalize === 'function' ? normalize(snapshot.state) : clone(snapshot.state);
        if (typeof render === 'function') render();
        await persistCurrent('restore-from-indexeddb');
        console.info('[V76] Полное состояние восстановлено из IndexedDB');
      } finally {
        restoring = false;
      }
      return true;
    }

    if (!snapshot?.state && state && typeof state === 'object') {
      stampState('initial-indexeddb-copy');
      await persistCurrent('initial-indexeddb-copy');
    } else if (snapshot?.state && newerThan(localMeta.updatedAt, snapshot.updatedAt || durableMeta.updatedAt)) {
      await persistCurrent('local-newer-than-indexeddb');
    }
    return false;
  }

  async function requestPersistentStorage() {
    try {
      if (navigator.storage?.persist) await navigator.storage.persist();
    } catch (error) {}
  }

  const previousSave = typeof save === 'function' ? save : null;
  if (previousSave) {
    save = function () {
      if (!restoring) stampState('app-save');
      const result = previousSave.apply(this, arguments);
      if (!restoring) enqueuePersist('app-save');
      return result;
    };
  }

  function setBuild() {
    document.body.dataset.sbosBuild = BUILD;
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', BUILD);
    try { localStorage.setItem('secondBrainOS.currentBuild', BUILD); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version) version.textContent = 'V76 · НАДЁЖНОЕ ХРАНИЛИЩЕ';
  }

  async function diagnostics() {
    let estimate = {};
    try { estimate = await navigator.storage?.estimate?.() || {}; } catch (error) {}
    const durable = await dbGet(MAIN_KEY).catch(() => null);
    return {
      initialized,
      mode: document.body.dataset.sbosStorage || 'checking',
      lastError,
      durableUpdatedAt: durable?.updatedAt || '',
      durableBytes: durable?.bytes || 0,
      quota: estimate.quota || 0,
      usage: estimate.usage || 0
    };
  }

  window.SecondBrainStorageGuard = {
    backup,
    saveNow: reason => {
      stampState(reason || 'manual-save');
      return enqueuePersist(reason || 'manual-save');
    },
    diagnostics
  };

  window.addEventListener('pagehide', () => {
    try {
      const serialized = JSON.stringify(state);
      writeLocal(serialized);
    } catch (error) {}
  });

  (async () => {
    setBuild();
    try {
      await openDatabase();
      await migrateLegacyV75Backup();
      await restoreFromDurableStore();
      requestPersistentStorage();
      initialized = true;
      document.body.dataset.sbosStorageReady = 'true';
    } catch (error) {
      lastError = String(error?.message || error || 'storage initialization failed');
      document.body.dataset.sbosStorage = 'local-only';
      console.error('[V76 init]', error);
    }
  })();
})();
