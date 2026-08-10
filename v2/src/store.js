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

function openDb() {
  return new Promise((resolve, reject) => {
    /* Версию не указываем: базу создала первая версия приложения, и
       навязывать свою — значит спровоцировать upgrade у неё. */
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB недоступна'));
  });
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
