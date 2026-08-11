/* Хранилище. Работает с тем же местом, что и первая версия приложения:
   IndexedDB → SecondBrainOSDurableStorage → records → main-state.

   Данные не копируются и не переносятся — они общие. Поэтому старая версия
   продолжает работать на тех же записях, а откат не требует миграции обратно.

   Три правила, которым здесь подчинено всё:
   1. Резервная копия создаётся до первой записи.
   2. Неизвестные поля сохраняются как есть — см. DATA-MODEL.md.
   3. Пустое значение (null) не превращается в ноль. */

const DB_NAME = 'SecondBrainOSDurableStorage';
const DB_STORE = 'records';
const MAIN_KEY = 'main-state';
const MIRROR_KEY = 'secondBrainOS.v1';
const BUILD_ID = 'second-brain-os-v2';

/* Коллекции из DATA-MODEL.md. Список нужен только чтобы гарантировать
   существование массивов — лишнего он не добавляет и данных не трогает. */
export const COLLECTIONS = [
  'tasks', 'inbox', 'planTemplates', 'lifePlans',
  'financeAccounts', 'operations', 'financeCategories', 'financePlans',
  'financeReservations', 'financeWeeklyReviews', 'deferredPurchases', 'purchases',
  'debts', 'debtPayments',
  'habits', 'habitWishlist',
  'goals',
  'notes', 'ideas', 'documents', 'books', 'bookSessions', 'films',
  'learningMaterials', 'knowledgeLinks',
  'people', 'polinaDays', 'coupleActivities',
  'personal', 'subconsciousEntries',
  'wishes', 'trips', 'archive'
];

let state = null;
let saveChain = Promise.resolve();
let backupDone = false;
const listeners = new Set();

/* ------------------------------ IndexedDB ------------------------------ */

function openRaw(version) {
  return new Promise((resolve, reject) => {
    const request = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME);
    /* Хранилище создаётся без keyPath — ровно так же, как в первой версии.
       Разойдись мы здесь, версии перестали бы читать записи друг друга. */
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB недоступна'));
  });
}

/**
 * Версию намеренно не навязываем: базу мог создать старый код, и повышение
 * версии спровоцировало бы у него upgrade. Но на чистом устройстве базы нет
 * вовсе, и открытие без версии создаёт её пустой, без хранилища — тогда
 * поднимаем версию один раз, только чтобы создать хранилище.
 */
async function openDb() {
  let db = await openRaw();
  if (db.objectStoreNames.contains(DB_STORE)) return db;
  const nextVersion = db.version + 1;
  db.close();
  db = await openRaw(nextVersion);
  if (!db.objectStoreNames.contains(DB_STORE)) {
    db.close();
    throw new Error('Не удалось создать хранилище записей');
  }
  return db;
}

function dbGet(db, key) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(DB_STORE)) return resolve(null);
    const request = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function dbPut(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    /* keyPath у хранилища может быть задан, а может и нет — поддерживаем оба. */
    const request = store.keyPath ? store.put(value) : store.put(value, key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

/* -------------------------------- Загрузка ------------------------------ */

function ensureShape(raw) {
  const next = raw && typeof raw === 'object' ? raw : {};
  next.settings = next.settings && typeof next.settings === 'object' ? next.settings : {};
  next.schemaVersion = Number(next.schemaVersion) || 3;
  COLLECTIONS.forEach((name) => {
    if (!Array.isArray(next[name])) next[name] = [];
  });
  if (!next.financeMonthBudgets || typeof next.financeMonthBudgets !== 'object') {
    next.financeMonthBudgets = {};
  }
  return next;
}

export async function load() {
  let raw = null;
  try {
    const db = await openDb();
    const record = await dbGet(db, MAIN_KEY);
    db.close();
    /* Запись обёрнута: {version, buildId, updatedAt, reason, state} */
    raw = record && record.state ? record.state : record;
  } catch (error) {
    console.warn('[store] IndexedDB недоступна, читаю зеркало', error);
  }

  if (!raw) {
    /* Зеркало в localStorage с версии 104 данных не содержит — но если
       приложение открыли на старом устройстве, они могут там оказаться. */
    try {
      const mirror = JSON.parse(localStorage.getItem(MIRROR_KEY) || 'null');
      if (mirror && Object.keys(mirror).some((k) => Array.isArray(mirror[k]) && mirror[k].length)) {
        raw = mirror;
      }
    } catch (_) { /* повреждённое зеркало игнорируем: это не источник правды */ }
  }

  state = ensureShape(raw);
  return state;
}

/* ------------------------------- Сохранение ----------------------------- */

async function makeBackupOnce(db) {
  if (backupDone) return;
  backupDone = true;
  const key = `backup:v2-before-first-write:${new Date().toISOString()}`;
  const counts = {};
  COLLECTIONS.forEach((name) => { counts[name] = (state[name] || []).length; });
  try {
    await dbPut(db, key, {
      key,
      version: 2,
      buildId: BUILD_ID,
      createdAt: new Date().toISOString(),
      reason: 'automatic-before-first-v2-write',
      counts,
      state: structuredClone(state)
    });
    localStorage.setItem('secondBrainOS.v2.backupCreated', new Date().toISOString());
  } catch (error) {
    /* Копия не удалась — запись отменяем: терять данные нельзя. */
    backupDone = false;
    throw error;
  }
}

async function persist(reason) {
  const db = await openDb();
  try {
    await makeBackupOnce(db);
    const updatedAt = new Date().toISOString();
    await dbPut(db, MAIN_KEY, {
      key: MAIN_KEY,
      version: 104,           /* формат записи первой версии — она его читает */
      buildId: BUILD_ID,
      updatedAt,
      reason,
      state: structuredClone(state)
    });
    /* Зеркало в том же виде, что пишет первая версия, иначе она посчитает
       хранилище повреждённым. */
    localStorage.setItem(MIRROR_KEY, JSON.stringify({
      schemaVersion: state.schemaVersion,
      settings: {
        storageGuard: {
          version: 104, updatedAt, primary: 'indexeddb',
          compactMirror: true, fullStateInIndexedDB: true
        }
      }
    }));
    localStorage.setItem('secondBrainOS.lastSuccessfulSave', updatedAt);
  } finally {
    db.close();
  }
}

/** Сохраняет состояние и уведомляет подписчиков. Записи выстроены в очередь,
 *  чтобы параллельные вызовы не перезаписывали друг друга. */
export function save(reason = 'v2-save') {
  saveChain = saveChain
    .catch(() => undefined)
    .then(() => persist(reason))
    .catch((error) => {
      console.error('[store] сохранение не удалось', error);
      try { localStorage.setItem('secondBrainOS.lastSaveError', String(error?.message || error)); } catch (_) {}
      notify({ saveError: String(error?.message || error) });
      throw error;
    });
  return saveChain;
}

export const flush = () => saveChain;

/* -------------------------------- Доступ -------------------------------- */

export const getState = () => state;
export const collection = (name) => (Array.isArray(state[name]) ? state[name] : (state[name] = []));

/** Изменяет состояние через функцию, затем сохраняет и перерисовывает. */
export function update(mutator, reason = 'v2-update') {
  const result = mutator(state);
  notify();
  save(reason);
  return result;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(detail) {
  listeners.forEach((fn) => {
    try { fn(state, detail); } catch (error) { console.error('[store] подписчик', error); }
  });
}

/* -------------------------------- Утилиты ------------------------------- */

export const uid = () => (crypto.randomUUID ? crypto.randomUUID()
  : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

export const nowIso = () => new Date().toISOString();

/** Число или null. Пустое поле остаётся пустым — см. инвариант 1 в DATA-MODEL.md. */
export function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Число со значением по умолчанию 0 — для сумм, где пусто действительно ноль. */
export function num(value) {
  const parsed = numberOrNull(value);
  return parsed === null ? 0 : parsed;
}

/* ------------------------- Копии, экспорт, импорт ----------------------- */

/** Список резервных копий в хранилище, свежие сверху. */
export async function listBackups() {
  const db = await openDb();
  try {
    const keys = await new Promise((resolve, reject) => {
      const request = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).getAllKeys();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    return keys
      .filter((key) => String(key).startsWith('backup:') || String(key).startsWith('daily:'))
      .map((key) => {
        const iso = String(key).split(':').slice(-3).join(':');
        return { key: String(key), createdAt: /\d{4}-\d{2}-\d{2}T/.test(iso) ? iso : '' };
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  } finally {
    db.close();
  }
}

/** Копия по требованию — например, перед рискованным действием. */
export async function createBackup(reason = 'manual') {
  const db = await openDb();
  try {
    const createdAt = new Date().toISOString();
    const key = `backup:${reason}:${createdAt}`;
    const counts = {};
    COLLECTIONS.forEach((name) => { counts[name] = (state[name] || []).length; });
    await dbPut(db, key, {
      key, version: 2, buildId: BUILD_ID, createdAt, reason, counts,
      state: structuredClone(state)
    });
    return { key, createdAt, counts };
  } finally {
    db.close();
  }
}

/** Восстановление из копии. Перед заменой делает копию текущего состояния. */
export async function restoreBackup(key) {
  const db = await openDb();
  let record;
  try {
    record = await dbGet(db, key);
  } finally {
    db.close();
  }
  if (!record || !record.state) throw new Error('Копия не найдена или повреждена');
  await createBackup('before-restore');
  state = ensureShape(structuredClone(record.state));
  notify();
  await save('restore-backup');
  return true;
}

/** Полное состояние одним объектом — для файла. */
export const exportState = () => structuredClone(state);

/**
 * Импорт из файла. mode: 'replace' заменяет состояние целиком,
 * 'merge' добавляет только записи с новыми id — существующие не трогает.
 */
export async function importState(incoming, mode = 'merge') {
  if (!incoming || typeof incoming !== 'object') throw new Error('Файл не похож на копию данных');
  await createBackup('before-import');

  if (mode === 'replace') {
    state = ensureShape(structuredClone(incoming));
  } else {
    const added = {};
    COLLECTIONS.forEach((name) => {
      const source = Array.isArray(incoming[name]) ? incoming[name] : [];
      if (!source.length) return;
      const existing = new Set((state[name] || []).map((row) => row && row.id));
      const fresh = source.filter((row) => row && row.id && !existing.has(row.id));
      if (fresh.length) {
        state[name] = (state[name] || []).concat(fresh);
        added[name] = fresh.length;
      }
    });
    /* Настройки при слиянии не перезаписываем: они описывают это устройство. */
    notify();
    await save('import-merge');
    return added;
  }
  notify();
  await save('import-replace');
  return { replaced: true };
}

/** Сколько записей в каждой коллекции — для служебного экрана. */
export function dataCounts() {
  const out = {};
  COLLECTIONS.forEach((name) => { out[name] = (state[name] || []).length; });
  return out;
}
