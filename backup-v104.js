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
