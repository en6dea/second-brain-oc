'use strict';

/* Second Brain OS V67 — opt-in account and record-level cloud sync.
   Local data stays authoritative until the user explicitly enables sync. */
(() => {
  const BUILD = 'second-brain-space-v67-8-reminder-center-20260714';
  const SDK_VERSION = '12.16.0';
  const KEY = {
    prefs: 'secondBrainOS.cloud.v67.prefs',
    queue: 'secondBrainOS.cloud.v67.queue',
    meta: 'secondBrainOS.cloud.v67.meta',
    mirror: 'secondBrainOS.cloud.v67.mirror',
    known: 'secondBrainOS.cloud.v67.known',
    conflicts: 'secondBrainOS.cloud.v67.conflicts',
    device: 'secondBrainOS.cloud.v67.device',
    rollback: 'secondBrainOS.cloud.v67.rollback'
  };
  const COLLECTIONS = [
    ['settings', 'Настройки и профиль', 'single', true],
    ['tasks', 'Задачи', 'array', true],
    ['habits', 'Привычки', 'array', true],
    ['goals', 'Цели', 'array', true],
    ['sleepEntries', 'Сон', 'array', true],
    ['subconsciousEntries', 'Дневник подсознания', 'array', true],
    ['dailyReviews', 'Утренние и вечерние разборы', 'array', true],
    ['reviews', 'Рефлексия', 'array', true],
    ['people', 'Люди', 'array', true],
    ['personal', 'Личная память', 'array', true],
    ['notes', 'Заметки', 'array', true],
    ['ideas', 'Идеи', 'array', true],
    ['inbox', 'Входящие', 'array', true],
    ['events', 'Календарь', 'array', true],
    ['purchases', 'Покупки', 'array', true],
    ['wishes', 'Желания', 'array', true],
    ['documents', 'Документы', 'array', true],
    ['books', 'Книги', 'array', true],
    ['films', 'Фильмы', 'array', true],
    ['trips', 'Путешествия', 'array', true],
    ['polina', 'Личное пространство Полины', 'single', true],
    ['polinaDays', 'Календарь Полины', 'array', true],
    ['polinaCalendar', 'Настройки календаря Полины', 'single', true],
    ['archive', 'Архив', 'array', true],
    ['folders', 'Папки', 'array', true],
    ['operations', 'Финансовые операции', 'array', false],
    ['debts', 'Долги', 'array', false],
    ['trades', 'Forex-журнал', 'array', true]
  ];
  const COLLECTION_MAP = Object.fromEntries(COLLECTIONS.map(item => [item[0], { name: item[0], label: item[1], kind: item[2], defaultEnabled: item[3] }]));

  const jsonRead = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) { return fallback; }
  };
  const jsonWrite = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { console.warn('[V67 local store]', error); return false; }
  };
  const clone = value => JSON.parse(JSON.stringify(value ?? null));
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const nowIso = () => new Date().toISOString();
  const dateStamp = () => new Date().toISOString().slice(0, 10);
  const fastHash = text => {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  };
  const stableStringify = value => {
    if (value === null || typeof value !== 'object') return JSON.stringify(value === undefined ? null : value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  };
  async function digest(text) {
    if (crypto?.subtle) {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return fastHash(text).padEnd(64, '0');
  }
  function base64Url(value) {
    const bytes = new TextEncoder().encode(String(value));
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '').slice(0, 900) || 'main';
  }
  const pairKey = (collectionName, recordId) => `${collectionName}::${recordId}`;
  const getDescriptor = name => COLLECTION_MAP[name] || { name, label: name, kind: Array.isArray(state?.[name]) ? 'array' : 'single', defaultEnabled: true };

  let prefs = Object.assign({ enabled: false, uid: '', collections: [], lastSync: '', lastError: '', phase: 'checking' }, jsonRead(KEY.prefs, {}));
  let queue = jsonRead(KEY.queue, {});
  let meta = jsonRead(KEY.meta, {});
  let mirror = jsonRead(KEY.mirror, {});
  let known = jsonRead(KEY.known, {});
  let conflicts = jsonRead(KEY.conflicts, []);
  let deviceId = localStorage.getItem(KEY.device);
  if (!deviceId) {
    deviceId = `device_${crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
    localStorage.setItem(KEY.device, deviceId);
  }

  let modules = null;
  let firebaseApp = null;
  let auth = null;
  let db = null;
  let storage = null;
  let currentUser = null;
  let bootPromise = null;
  let applyingRemote = false;
  let syncing = false;
  let diffTimer = 0;
  let syncTimer = 0;
  let cardTimer = 0;

  function persistSyncState() {
    jsonWrite(KEY.prefs, prefs);
    jsonWrite(KEY.queue, queue);
    jsonWrite(KEY.meta, meta);
    jsonWrite(KEY.mirror, mirror);
    jsonWrite(KEY.known, known);
    jsonWrite(KEY.conflicts, conflicts.slice(0, 100));
    updateAccountCardSoon();
  }

  function sanitizeSettings(source) {
    const cloud = clone(source || {});
    delete cloud.alfaWorkerKey;
    if (cloud.sync) delete cloud.sync.token;
    if (cloud.v66?.security) delete cloud.v66.security;
    if (cloud.v66?.notifications) delete cloud.v66.notifications.enabled;
    return cloud;
  }

  function mergeCloudSettings(remote) {
    const local = clone(state.settings || {});
    const merged = Object.assign({}, local, clone(remote || {}));
    merged.v66 = Object.assign({}, local.v66 || {}, remote?.v66 || {});
    if (local.v66?.security) merged.v66.security = local.v66.security;
    if (merged.v66.notifications || local.v66?.notifications) {
      merged.v66.notifications = Object.assign({}, remote?.v66?.notifications || {}, local.v66?.notifications || {});
      if (local.v66?.notifications && Object.prototype.hasOwnProperty.call(local.v66.notifications, 'enabled')) merged.v66.notifications.enabled = local.v66.notifications.enabled;
    }
    if (Object.prototype.hasOwnProperty.call(local, 'alfaWorkerKey')) merged.alfaWorkerKey = local.alfaWorkerKey;
    if (local.sync?.token) merged.sync = Object.assign({}, merged.sync || {}, { token: local.sync.token });
    return merged;
  }

  function recordIdFor(record, index) {
    const candidate = record?.id ?? record?.key ?? record?.date ?? record?.title ?? record?.name;
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) return String(candidate);
    return `legacy_${index}_${fastHash(stableStringify(record))}`;
  }

  function entriesFor(collectionName, source = state) {
    const descriptor = getDescriptor(collectionName);
    if (descriptor.kind === 'single') {
      const raw = collectionName === 'settings' ? sanitizeSettings(source?.settings) : clone(source?.[collectionName] || {});
      if (collectionName !== 'settings' && (!raw || typeof raw !== 'object' || !Object.keys(raw).length)) return [];
      return [{ id: 'main', data: raw }];
    }
    const records = Array.isArray(source?.[collectionName]) ? source[collectionName] : [];
    return records.map((record, index) => ({ id: recordIdFor(record, index), data: clone(record) }));
  }

  async function canonicalRecord(collectionName, data) {
    const clean = clone(data);
    if (collectionName !== 'trades' || !clean) return clean;
    for (const field of ['beforeImage', 'afterImage']) {
      const digestField = field === 'beforeImage' ? 'beforeImageDigest' : 'afterImageDigest';
      const value = clean[field] || '';
      if (/^data:image\//i.test(value)) clean[field] = `image:${await digest(value)}`;
      else if (value && clean[digestField]) clean[field] = `image:${clean[digestField]}`;
      else clean[field] = value;
      if (!value) delete clean[digestField];
    }
    return clean;
  }

  async function recordHash(collectionName, data) {
    return digest(stableStringify(await canonicalRecord(collectionName, data)));
  }

  function findLocalRecord(collectionName, id) {
    const descriptor = getDescriptor(collectionName);
    if (descriptor.kind === 'single') return collectionName === 'settings' ? sanitizeSettings(state.settings) : clone(state[collectionName] || {});
    return entriesFor(collectionName).find(entry => entry.id === String(id))?.data ?? null;
  }

  function replaceLocalRecord(collectionName, id, remoteData, deleted = false) {
    const descriptor = getDescriptor(collectionName);
    if (descriptor.kind === 'single') {
      if (deleted) return;
      if (collectionName === 'settings') state.settings = mergeCloudSettings(remoteData);
      else state[collectionName] = clone(remoteData || {});
      return;
    }
    const current = Array.isArray(state[collectionName]) ? state[collectionName] : [];
    const next = current.filter((record, index) => recordIdFor(record, index) !== String(id));
    if (!deleted && remoteData) next.unshift(clone(remoteData));
    state[collectionName] = next;
  }

  function safeExportState() {
    try { return typeof exportableState === 'function' ? exportableState() : clone(state); }
    catch (error) { return clone(state); }
  }

  function downloadBackup(reason = 'cloud') {
    const payload = { format: 'second-brain-os-backup', version: 67, createdAt: nowIso(), reason, state: safeExportState() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `second-brain-before-${reason}-${dateStamp()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function saveRollback(reason) {
    const payload = { createdAt: nowIso(), reason, state: safeExportState() };
    if (!jsonWrite(KEY.rollback, payload)) console.warn('[V67 rollback] Local rollback snapshot did not fit in storage');
  }

  function applyStateAndRender(nextState, reason = 'cloud') {
    applyingRemote = true;
    try {
      state = typeof normalize === 'function' ? normalize(nextState) : nextState;
      if (typeof save === 'function') save();
      if (typeof render === 'function') render();
      console.info(`[V67] Local state applied: ${reason}`);
    } finally {
      setTimeout(() => { applyingRemote = false; }, 0);
    }
  }

  async function loadLocalFirebaseConfig() {
    if (window.SECOND_BRAIN_FIREBASE_CONFIG?.projectId) return window.SECOND_BRAIN_FIREBASE_CONFIG;
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `./firebase-config.js?v=${encodeURIComponent(BUILD)}-${Date.now()}`;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      return window.SECOND_BRAIN_FIREBASE_CONFIG?.projectId ? window.SECOND_BRAIN_FIREBASE_CONFIG : null;
    } catch (error) { return null; }
  }

  async function ensureFirebase() {
    if (bootPromise) return bootPromise;
    bootPromise = (async () => {
      const config = await loadLocalFirebaseConfig();
      if (!config) {
        prefs.phase = 'config-missing';
        persistSyncState();
        return false;
      }
      try {
        const base = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
        const [appModule, authModule, firestoreModule, storageModule] = await Promise.all([
          import(`${base}/firebase-app.js`),
          import(`${base}/firebase-auth.js`),
          import(`${base}/firebase-firestore.js`),
          import(`${base}/firebase-storage.js`)
        ]);
        modules = { app: appModule, auth: authModule, firestore: firestoreModule, storage: storageModule };
        firebaseApp = appModule.getApps().find(item => item.name === 'second-brain-v67') || appModule.initializeApp(config, 'second-brain-v67');
        auth = authModule.getAuth(firebaseApp);
        await authModule.setPersistence(auth, authModule.browserLocalPersistence);
        db = firestoreModule.getFirestore(firebaseApp);
        storage = storageModule.getStorage(firebaseApp);
        authModule.onAuthStateChanged(auth, user => {
          currentUser = user || null;
          prefs.phase = currentUser ? (prefs.enabled && prefs.uid === currentUser.uid ? 'connected' : 'signed-in') : 'ready';
          prefs.lastError = '';
          persistSyncState();
          if (currentUser && prefs.enabled && prefs.uid === currentUser.uid) scheduleSync(800);
        });
        try { await authModule.getRedirectResult(auth); } catch (error) { prefs.lastError = authErrorMessage(error); }
        prefs.phase = auth.currentUser ? 'signed-in' : 'ready';
        currentUser = auth.currentUser || null;
        persistSyncState();
        return true;
      } catch (error) {
        prefs.phase = 'error';
        prefs.lastError = `Не удалось загрузить облачный модуль: ${error.message || error}`;
        persistSyncState();
        console.error('[V67 Firebase init]', error);
        return false;
      }
    })();
    return bootPromise;
  }

  function authErrorMessage(error) {
    const code = error?.code || '';
    const map = {
      'auth/email-already-in-use': 'Этот email уже зарегистрирован — используйте «Войти».',
      'auth/invalid-email': 'Проверьте адрес электронной почты.',
      'auth/invalid-credential': 'Неверный email или пароль.',
      'auth/user-not-found': 'Аккаунт не найден.',
      'auth/wrong-password': 'Неверный пароль.',
      'auth/weak-password': 'Используйте пароль не короче восьми символов.',
      'auth/popup-closed-by-user': 'Окно входа было закрыто.',
      'auth/popup-blocked': 'Браузер заблокировал окно входа. Разрешите всплывающие окна.',
      'auth/operation-not-allowed': 'Этот способ входа ещё не включён в Firebase.',
      'auth/unauthorized-domain': 'Этот домен ещё не добавлен в список разрешённых Firebase.',
      'auth/account-exists-with-different-credential': 'Этот email уже связан с другим способом входа.'
    };
    return map[code] || error?.message || 'Не удалось выполнить вход.';
  }

  async function runAuthAction(action) {
    if (!await ensureFirebase()) return openAccount();
    prefs.lastError = '';
    try {
      if (action === 'email-signin' || action === 'email-signup') {
        const email = document.getElementById('v67_email')?.value.trim() || '';
        const password = document.getElementById('v67_password')?.value || '';
        if (!email || !password) throw new Error('Укажите email и пароль.');
        if (action === 'email-signup' && password.length < 8) throw new Error('Для нового аккаунта нужен пароль не короче восьми символов.');
        const result = action === 'email-signup'
          ? await modules.auth.createUserWithEmailAndPassword(auth, email, password)
          : await modules.auth.signInWithEmailAndPassword(auth, email, password);
        currentUser = result.user;
        if (action === 'email-signup' && !result.user.emailVerified) await modules.auth.sendEmailVerification(result.user);
      }
      if (action === 'google' || action === 'apple') {
        const provider = action === 'google' ? new modules.auth.GoogleAuthProvider() : new modules.auth.OAuthProvider('apple.com');
        if (action === 'apple') { provider.addScope('email'); provider.addScope('name'); }
        const useRedirect = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (useRedirect) return modules.auth.signInWithRedirect(auth, provider);
        const result = await modules.auth.signInWithPopup(auth, provider);
        currentUser = result.user;
      }
      prefs.phase = 'signed-in';
      persistSyncState();
      openAccount();
    } catch (error) {
      prefs.lastError = authErrorMessage(error);
      prefs.phase = currentUser ? 'signed-in' : 'ready';
      persistSyncState();
      openAccount();
    }
  }

  async function resetPassword() {
    if (!await ensureFirebase()) return openAccount();
    const email = document.getElementById('v67_email')?.value.trim() || '';
    if (!email) { prefs.lastError = 'Сначала укажите email.'; return openAccount(); }
    try {
      await modules.auth.sendPasswordResetEmail(auth, email);
      prefs.lastError = '';
      toast('Письмо для восстановления отправлено');
      openAccount();
    } catch (error) { prefs.lastError = authErrorMessage(error); openAccount(); }
  }

  async function signOutAccount() {
    if (auth) await modules.auth.signOut(auth);
    currentUser = null;
    prefs.phase = 'ready';
    persistSyncState();
    openAccount();
  }

  function enabledCollections() {
    return (prefs.collections || []).filter(name => COLLECTION_MAP[name]);
  }

  async function queueDiff(options = {}) {
    if (!prefs.enabled || !prefs.uid || applyingRemote) return 0;
    let changed = 0;
    for (const collectionName of enabledCollections()) {
      const entries = entriesFor(collectionName);
      const currentIds = new Set(entries.map(entry => entry.id));
      const knownIds = new Set(Array.isArray(known[collectionName]) ? known[collectionName] : []);
      for (const entry of entries) {
        const key = pairKey(collectionName, entry.id);
        const hash = await recordHash(collectionName, entry.data);
        if (options.force || mirror[key] !== hash) {
          const existing = queue[key];
          queue[key] = { collection: collectionName, id: entry.id, op: 'upsert', hash, baseRevision: existing?.baseRevision ?? meta[key]?.revision ?? 0, queuedAt: nowIso() };
          changed += 1;
        }
        knownIds.add(entry.id);
      }
      for (const id of knownIds) {
        if (currentIds.has(id)) continue;
        const key = pairKey(collectionName, id);
        if (meta[key] || mirror[key] || queue[key]) {
          queue[key] = { collection: collectionName, id, op: 'delete', hash: '__deleted__', baseRevision: queue[key]?.baseRevision ?? meta[key]?.revision ?? 0, queuedAt: nowIso() };
          changed += 1;
        }
      }
      known[collectionName] = Array.from(currentIds);
    }
    persistSyncState();
    return changed;
  }

  function scheduleDiff() {
    if (!prefs.enabled || applyingRemote) return;
    clearTimeout(diffTimer);
    diffTimer = setTimeout(() => queueDiff().then(changed => { if (changed && navigator.onLine) scheduleSync(1800); }).catch(error => console.warn('[V67 diff]', error)), 260);
  }

  function scheduleSync(delay = 1500) {
    if (!prefs.enabled || !currentUser || prefs.uid !== currentUser.uid || syncing) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncNow({ quiet: true }).catch(error => console.warn('[V67 scheduled sync]', error)), delay);
  }

  async function uploadTradeImages(record, recordId) {
    const prepared = clone(record);
    if (!storage || !modules?.storage) return prepared;
    for (const field of ['beforeImage', 'afterImage']) {
      const value = prepared[field] || '';
      const prefix = field === 'beforeImage' ? 'before' : 'after';
      const digestField = field === 'beforeImage' ? 'beforeImageDigest' : 'afterImageDigest';
      const pathField = field === 'beforeImage' ? 'beforeImagePath' : 'afterImagePath';
      if (!value) { delete prepared[digestField]; delete prepared[pathField]; continue; }
      if (!/^data:image\//i.test(value)) continue;
      const imageDigest = await digest(value);
      const path = `users/${currentUser.uid}/trades/${base64Url(recordId)}/${prefix}-${imageDigest.slice(0, 24)}.jpg`;
      const reference = modules.storage.ref(storage, path);
      await modules.storage.uploadString(reference, value, 'data_url', { contentType: 'image/jpeg', customMetadata: { recordId: String(recordId), deviceId } });
      prepared[field] = await modules.storage.getDownloadURL(reference);
      prepared[digestField] = imageDigest;
      prepared[pathField] = path;
    }
    return prepared;
  }

  async function prepareCloudData(collectionName, id, record) {
    const prepared = collectionName === 'settings' ? sanitizeSettings(record) : clone(record);
    const result = collectionName === 'trades' ? await uploadTradeImages(prepared, id) : prepared;
    const bytes = new TextEncoder().encode(JSON.stringify(result)).length;
    if (bytes > 700 * 1024) throw new Error(`${getDescriptor(collectionName).label}: одна запись слишком большая для безопасной синхронизации`);
    return result;
  }

  function addConflict(details) {
    const key = pairKey(details.collection, details.id);
    conflicts = conflicts.filter(item => pairKey(item.collection, item.id) !== key);
    conflicts.unshift(Object.assign({ conflictId: `${Date.now()}_${Math.random().toString(36).slice(2)}`, detectedAt: nowIso() }, clone(details)));
    persistSyncState();
  }

  async function flushQueue() {
    if (!currentUser || !db || currentUser.uid !== prefs.uid) return { sent: 0, conflicts: 0 };
    let sent = 0;
    let conflictCount = 0;
    const pending = Object.values(queue).sort((a, b) => String(a.queuedAt).localeCompare(String(b.queuedAt)));
    for (const item of pending) {
      const key = pairKey(item.collection, item.id);
      if (!queue[key]) continue;
      let localData = item.op === 'delete' ? null : findLocalRecord(item.collection, item.id);
      if (item.op !== 'delete' && !localData) {
        queue[key] = Object.assign({}, item, { op: 'delete', hash: '__deleted__' });
        localData = null;
      }
      const localHash = item.op === 'delete' ? '__deleted__' : await recordHash(item.collection, localData);
      const prepared = item.op === 'delete' ? null : await prepareCloudData(item.collection, item.id, localData);
      const reference = modules.firestore.doc(db, 'users', currentUser.uid, 'collections', item.collection, 'items', base64Url(item.id));
      const outcome = await modules.firestore.runTransaction(db, async transaction => {
        const snapshot = await transaction.get(reference);
        const remote = snapshot.exists() ? snapshot.data() : null;
        const remoteRevision = Number(remote?.revision || 0);
        const baseRevision = Number(item.baseRevision || 0);
        const remoteHash = remote?.deletedAt ? '__deleted__' : (remote?.contentHash || '');
        if (remote && remoteRevision > baseRevision && remoteHash === localHash) return { kind: 'same', remote };
        if (remote && remoteRevision > baseRevision && remoteHash !== localHash) return { kind: 'conflict', remote };
        const revision = remoteRevision + 1;
        transaction.set(reference, {
          schemaVersion: 1,
          collection: item.collection,
          recordId: String(item.id),
          data: item.op === 'delete' ? null : prepared,
          contentHash: localHash,
          revision,
          deviceId,
          updatedAtClient: nowIso(),
          updatedAt: modules.firestore.serverTimestamp(),
          deletedAt: item.op === 'delete' ? modules.firestore.serverTimestamp() : null
        });
        return { kind: 'written', revision, contentHash: localHash, prepared };
      });
      if (outcome.kind === 'conflict') {
        addConflict({ collection: item.collection, id: item.id, local: localData, localDeleted: item.op === 'delete', localHash, remote: outcome.remote.data, remoteDeleted: Boolean(outcome.remote.deletedAt), remoteHash: outcome.remote.deletedAt ? '__deleted__' : outcome.remote.contentHash, remoteRevision: Number(outcome.remote.revision || 0), remoteDeviceId: outcome.remote.deviceId || '' });
        delete queue[key];
        conflictCount += 1;
        continue;
      }
      const remoteRevision = Number(outcome.remote?.revision || outcome.revision || item.baseRevision || 0);
      const effectiveHash = outcome.remote?.deletedAt ? '__deleted__' : (outcome.remote?.contentHash || outcome.contentHash || localHash);
      meta[key] = { revision: remoteRevision, contentHash: effectiveHash, deviceId: outcome.remote?.deviceId || deviceId, syncedAt: nowIso() };
      mirror[key] = effectiveHash;
      delete queue[key];
      sent += 1;
    }
    persistSyncState();
    return { sent, conflicts: conflictCount };
  }

  async function pullRemote() {
    if (!currentUser || !db || currentUser.uid !== prefs.uid) return { received: 0, conflicts: 0 };
    let received = 0;
    let conflictCount = 0;
    let changedState = false;
    const nextState = clone(state);
    for (const collectionName of enabledCollections()) {
      const reference = modules.firestore.collection(db, 'users', currentUser.uid, 'collections', collectionName, 'items');
      const snapshot = await modules.firestore.getDocs(reference);
      for (const documentSnapshot of snapshot.docs) {
        const remote = documentSnapshot.data();
        const id = String(remote.recordId || documentSnapshot.id);
        const key = pairKey(collectionName, id);
        const remoteRevision = Number(remote.revision || 0);
        const remoteHash = remote.deletedAt ? '__deleted__' : (remote.contentHash || '');
        const pending = queue[key];
        if (pending) {
          if (pending.hash === remoteHash) {
            meta[key] = { revision: remoteRevision, contentHash: remoteHash, deviceId: remote.deviceId || '', syncedAt: nowIso() };
            mirror[key] = remoteHash;
            delete queue[key];
            continue;
          }
          addConflict({ collection: collectionName, id, local: pending.op === 'delete' ? null : findLocalRecord(collectionName, id), localDeleted: pending.op === 'delete', localHash: pending.hash, remote: remote.data, remoteDeleted: Boolean(remote.deletedAt), remoteHash, remoteRevision, remoteDeviceId: remote.deviceId || '' });
          delete queue[key];
          conflictCount += 1;
          continue;
        }
        if (remoteRevision <= Number(meta[key]?.revision || 0) && mirror[key] === remoteHash) continue;
        const previousState = state;
        state = nextState;
        replaceLocalRecord(collectionName, id, remote.data, Boolean(remote.deletedAt));
        state = previousState;
        meta[key] = { revision: remoteRevision, contentHash: remoteHash, deviceId: remote.deviceId || '', syncedAt: nowIso() };
        mirror[key] = remoteHash;
        const ids = new Set(Array.isArray(known[collectionName]) ? known[collectionName] : []);
        if (remote.deletedAt) ids.delete(id); else ids.add(id);
        known[collectionName] = Array.from(ids);
        changedState = true;
        received += 1;
      }
    }
    if (changedState) {
      saveRollback('before-cloud-pull');
      applyStateAndRender(nextState, 'cloud-pull');
    }
    persistSyncState();
    return { received, conflicts: conflictCount };
  }

  async function syncNow(options = {}) {
    if (syncing) return;
    if (!navigator.onLine) {
      prefs.phase = 'offline';
      prefs.lastError = 'Нет сети — изменения сохранены в локальной очереди.';
      persistSyncState();
      if (!options.quiet) openAccount();
      return;
    }
    if (!await ensureFirebase() || !currentUser) {
      prefs.lastError = 'Сначала войдите в аккаунт.';
      persistSyncState();
      if (!options.quiet) openAccount();
      return;
    }
    if (!prefs.enabled || prefs.uid !== currentUser.uid) {
      if (!options.quiet) openFirstSync();
      return;
    }
    syncing = true;
    prefs.phase = 'syncing';
    prefs.lastError = '';
    persistSyncState();
    try {
      await queueDiff();
      const pulled = await pullRemote();
      const pushed = await flushQueue();
      const secondPull = await pullRemote();
      prefs.lastSync = nowIso();
      prefs.phase = 'connected';
      prefs.lastError = '';
      persistSyncState();
      if (!options.quiet) toast(`Синхронизация: отправлено ${pushed.sent}, получено ${pulled.received + secondPull.received}`);
    } catch (error) {
      prefs.phase = navigator.onLine ? 'error' : 'offline';
      prefs.lastError = navigator.onLine ? (error.message || 'Ошибка синхронизации.') : 'Нет сети — изменения остаются на устройстве.';
      persistSyncState();
      console.error('[V67 sync]', error);
    } finally {
      syncing = false;
      if (!options.quiet) openAccount();
    }
  }

  function countFor(name) {
    return entriesFor(name).length;
  }

  function openFirstSync() {
    if (!currentUser) return openAccount();
    const choices = COLLECTIONS.map(([name, label, kind, enabled]) => {
      const count = countFor(name);
      return `<label class="v67-sync-choice ${enabled ? '' : 'is-sensitive'}"><input type="checkbox" data-v67-sync-collection="${html(name)}" ${enabled ? 'checked' : ''}><span><b>${html(label)}</b><small>${kind === 'single' ? 'настройка' : `${count} записей`}${enabled ? '' : ' · выключено по умолчанию'}</small></span></label>`;
    }).join('');
    openModal('Первая синхронизация', `<div class="v67-first-sync"><section class="v67-safety-banner"><span>⛨</span><div><h3>Сначала резервная копия</h3><p>После подтверждения приложение автоматически скачает текущие данные. Облако ничего не заменит молча: параллельные версии попадут в раздел конфликтов.</p></div></section><div class="v67-sensitive-note"><b>Финансы и долги выключены по умолчанию</b><span>Вы сможете включить их позже, когда заново загрузите банковские данные.</span></div><div class="v67-sync-choices">${choices}</div><label class="v67-consent"><input id="v67_sync_consent" type="checkbox"><span>Я понимаю, что выбранные разделы будут храниться в моём Firebase-аккаунте и синхронизироваться между устройствами.</span></label><div class="v67-modal-actions"><button data-v67-action="confirm-first-sync" class="is-primary" type="button">Скачать копию и включить</button><button data-v67-action="open-account" type="button">Отмена</button></div></div>`);
  }

  async function enableFirstSync() {
    if (!currentUser) return openAccount();
    if (!document.getElementById('v67_sync_consent')?.checked) return toast('Подтвердите хранение выбранных данных в облаке');
    const selected = Array.from(document.querySelectorAll('[data-v67-sync-collection]:checked')).map(input => input.dataset.v67SyncCollection).filter(Boolean);
    if (!selected.length) return toast('Выберите хотя бы один раздел');
    downloadBackup('cloud-sync');
    saveRollback('before-first-cloud-sync');
    const switchingAccount = prefs.uid && prefs.uid !== currentUser.uid;
    prefs = Object.assign({}, prefs, { enabled: true, uid: currentUser.uid, collections: selected, phase: 'syncing', lastError: '' });
    if (switchingAccount) { queue = {}; meta = {}; mirror = {}; known = {}; conflicts = []; }
    for (const collectionName of selected) known[collectionName] = entriesFor(collectionName).map(entry => entry.id);
    persistSyncState();
    await queueDiff({ force: true });
    closeModal();
    await syncNow();
  }

  function disableSyncOnDevice() {
    prefs.enabled = false;
    prefs.phase = currentUser ? 'signed-in' : 'ready';
    prefs.lastError = '';
    persistSyncState();
    toast('Синхронизация на этом устройстве остановлена');
    openAccount();
  }

  async function resumeSync() {
    if (!currentUser || !prefs.uid || prefs.uid !== currentUser.uid || !prefs.collections?.length) return openFirstSync();
    prefs.enabled = true;
    prefs.phase = 'connected';
    persistSyncState();
    await syncNow();
  }

  function conflictSummary(item, side) {
    const data = side === 'local' ? item.local : item.remote;
    const deleted = side === 'local' ? item.localDeleted : item.remoteDeleted;
    if (deleted) return 'Запись удалена';
    if (!data) return 'Нет данных';
    return String(data.title || data.name || data.person || data.pair || data.date || 'Изменённая запись').slice(0, 100);
  }

  function openConflicts() {
    const body = conflicts.length ? conflicts.map(item => `<article class="v67-conflict"><header><div><span>${html(getDescriptor(item.collection).label)}</span><b>${html(conflictSummary(item, 'local'))}</b></div><time>${new Date(item.detectedAt).toLocaleString('ru-RU')}</time></header><div class="v67-conflict-versions"><section><small>Это устройство</small><p>${html(conflictSummary(item, 'local'))}</p></section><section><small>Облако</small><p>${html(conflictSummary(item, 'remote'))}</p></section></div><div class="v67-conflict-actions"><button data-v67-action="resolve-conflict" data-choice="local" data-conflict-id="${html(item.conflictId)}" type="button">Оставить мою</button><button data-v67-action="resolve-conflict" data-choice="remote" data-conflict-id="${html(item.conflictId)}" type="button">Взять облачную</button>${getDescriptor(item.collection).kind === 'array' && !item.localDeleted && !item.remoteDeleted ? `<button data-v67-action="resolve-conflict" data-choice="both" data-conflict-id="${html(item.conflictId)}" type="button">Сохранить обе</button>` : ''}</div></article>`).join('') : '<div class="v67-empty"><span>✓</span><h3>Конфликтов нет</h3><p>Изменения устройств объединяются безопасно.</p></div>';
    openModal('Конфликты синхронизации', `<div class="v67-conflicts">${body}<div class="v67-modal-actions"><button data-v67-action="open-account" type="button">Назад к аккаунту</button></div></div>`);
  }

  async function resolveConflict(conflictId, choice) {
    const item = conflicts.find(entry => entry.conflictId === conflictId);
    if (!item) return openConflicts();
    saveRollback('before-conflict-resolution');
    const key = pairKey(item.collection, item.id);
    applyingRemote = true;
    try {
      if (choice === 'remote') {
        replaceLocalRecord(item.collection, item.id, item.remote, item.remoteDeleted);
        meta[key] = { revision: item.remoteRevision, contentHash: item.remoteHash, deviceId: item.remoteDeviceId || '', syncedAt: nowIso() };
        mirror[key] = item.remoteHash;
        delete queue[key];
      }
      if (choice === 'local') {
        queue[key] = { collection: item.collection, id: item.id, op: item.localDeleted ? 'delete' : 'upsert', hash: item.localHash, baseRevision: item.remoteRevision, queuedAt: nowIso() };
        meta[key] = { revision: item.remoteRevision, contentHash: item.remoteHash, deviceId: item.remoteDeviceId || '', syncedAt: nowIso() };
        mirror[key] = item.remoteHash;
      }
      if (choice === 'both') {
        replaceLocalRecord(item.collection, item.id, item.remote, false);
        const copy = clone(item.local);
        copy.id = `${copy.id || item.id}-copy-${Date.now().toString(36)}`;
        state[item.collection] = [copy, ...(Array.isArray(state[item.collection]) ? state[item.collection] : [])];
        const copyId = String(copy.id);
        const copyKey = pairKey(item.collection, copyId);
        queue[copyKey] = { collection: item.collection, id: copyId, op: 'upsert', hash: await recordHash(item.collection, copy), baseRevision: 0, queuedAt: nowIso() };
        meta[key] = { revision: item.remoteRevision, contentHash: item.remoteHash, deviceId: item.remoteDeviceId || '', syncedAt: nowIso() };
        mirror[key] = item.remoteHash;
      }
      if (typeof save === 'function') save();
      if (typeof render === 'function') render();
    } finally { setTimeout(() => { applyingRemote = false; }, 0); }
    conflicts = conflicts.filter(entry => entry.conflictId !== conflictId);
    persistSyncState();
    openConflicts();
    scheduleSync(300);
  }

  function restoreRollback() {
    const rollback = jsonRead(KEY.rollback, null);
    if (!rollback?.state) return toast('Локальная точка восстановления не найдена');
    if (!window.confirm(`Вернуть состояние до синхронизации от ${new Date(rollback.createdAt).toLocaleString('ru-RU')}? Синхронизация на этом устройстве будет остановлена.`)) return;
    downloadBackup('before-rollback');
    prefs.enabled = false;
    prefs.phase = currentUser ? 'signed-in' : 'ready';
    applyStateAndRender(rollback.state, 'rollback');
    persistSyncState();
    toast('Состояние восстановлено, синхронизация остановлена');
    openAccount();
  }

  function accountStateText() {
    if (prefs.phase === 'config-missing') return ['Нужна настройка Firebase', 'локальные данные в безопасности'];
    if (prefs.phase === 'error') return ['Требуется внимание', prefs.lastError || 'ошибка подключения'];
    if (prefs.phase === 'offline') return ['Офлайн-режим', `${Object.keys(queue).length} изменений ждут сеть`];
    if (!currentUser) return ['Готов к входу', 'Email, Google или Apple'];
    if (!prefs.enabled || prefs.uid !== currentUser.uid) return ['Аккаунт подключён', 'синхронизация ещё не включена'];
    if (prefs.phase === 'syncing' || syncing) return ['Синхронизация…', `${Object.keys(queue).length} изменений в очереди`];
    if (conflicts.length) return [`Нужно разобрать: ${conflicts.length}`, 'обе версии сохранены'];
    return ['Синхронизация включена', prefs.lastSync ? `обновлено ${new Date(prefs.lastSync).toLocaleString('ru-RU')}` : 'готова к первой отправке'];
  }

  function updateAccountCard() {
    const card = document.querySelector('[data-v66-account-card]');
    if (!card) return;
    const [title, detail] = accountStateText();
    const bold = card.querySelector('b');
    const small = card.querySelector('small');
    const button = card.querySelector('button');
    if (bold && bold.textContent !== title) bold.textContent = title;
    if (small && small.textContent !== detail) small.textContent = detail;
    if (button) button.textContent = conflicts.length ? 'Разобрать' : (currentUser ? 'Управление' : 'Войти');
    card.classList.toggle('v67-needs-attention', Boolean(conflicts.length || prefs.lastError));
  }

  function updateAccountCardSoon() {
    clearTimeout(cardTimer);
    cardTimer = setTimeout(updateAccountCard, 80);
  }

  function ensureV67Settings() {
    state.settings = state.settings || {};
    state.settings.v67 = Object.assign({ financeLimitMode: 'auto', manualDailyLimit: 0, livelyDesign: true }, state.settings.v67 || {});
    return state.settings.v67;
  }

  function financeLimitModel() {
    const settings = ensureV67Settings();
    const period = typeof periodInfo === 'function' ? periodInfo(state.settings.financePeriod || 'month') : { start: today(), end: today() };
    const currentBalance = num(state.settings.currentBalance);
    const outgoing = (Array.isArray(state.debts) ? state.debts : []).filter(item => item.direction === 'out' && item.status !== 'Закрыт');
    const obligations = outgoing.filter(item => item.due && item.due <= period.end);
    const obligationTotal = obligations.reduce((sum, item) => sum + (num(item.minPayment) || num(item.amount)), 0);
    const planned = (Array.isArray(state.purchases) ? state.purchases : []).filter(item => item.includeInBudget !== false && (!item.date || (item.date >= period.start && item.date <= period.end)));
    const plannedTotal = planned.reduce((sum, item) => sum + num(item.amount), 0);
    const start = period.start > today() ? period.start : today();
    const daysLeft = period.end >= today() ? Math.max(1, Math.round((new Date(`${period.end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1) : 0;
    const autoDaily = daysLeft ? Math.max(0, (currentBalance - obligationTotal - plannedTotal) / daysLeft) : 0;
    const manualDaily = Math.max(0, num(settings.manualDailyLimit));
    const mode = settings.financeLimitMode === 'manual' ? 'manual' : 'auto';
    return { mode, autoDaily, manualDaily, selectedDaily: mode === 'manual' ? manualDaily : autoDaily, daysLeft, obligationTotal, plannedTotal };
  }

  function injectFinanceLimitControl(view) {
    const hero = view.querySelector('.v65-finance-hero') || view.querySelector('.hero,.v59-hero');
    const kpis = view.querySelector('.v65-money-kpis');
    if (!hero || !kpis) return;
    const heroActions = hero.querySelector('.v65-finance-actions');
    if (heroActions && !heroActions.querySelector('[data-v67-action="open-bank-import"]')) {
      heroActions.insertAdjacentHTML('beforeend', '<button data-v67-action="open-bank-import" type="button">Импорт выписки</button>');
    }
    const model = financeLimitModel();
    if (!view.querySelector('.v67-limit-control')) {
      kpis.insertAdjacentHTML('beforebegin', `<section class="v67-limit-control"><div><span class="v65-overline">Лимит расходов</span><h3>Автоматический и ручной режим</h3><p>Авто сначала резервирует обязательные платежи и покупки, затем делит свободный остаток по дням. Ручной режим использует заданную вами сумму.</p></div><div class="v67-limit-modes"><button class="${model.mode === 'auto' ? 'active' : ''}" data-v67-action="finance-limit-mode" data-mode="auto" type="button">Авто · ${money(model.autoDaily)}</button><button class="${model.mode === 'manual' ? 'active' : ''}" data-v67-action="finance-limit-mode" data-mode="manual" type="button">Вручную</button></div><label><span>Ручной лимит на день</span><input id="v67_manual_daily_limit" type="number" min="0" step="100" value="${model.manualDaily || ''}" placeholder="Например, 3 000"><button data-v67-action="save-manual-limit" type="button">Сохранить</button></label></section>`);
    }
    const cards = kpis.querySelectorAll(':scope > article');
    if (cards[1]) {
      const strong = cards[1].querySelector('strong');
      const small = cards[1].querySelector('small');
      if (strong) strong.textContent = model.selectedDaily ? money(model.selectedDaily) : '—';
      if (small) small.textContent = model.mode === 'manual' ? 'задан вручную' : (model.daysLeft ? `${model.daysLeft} дней · рассчитан автоматически` : 'автоматический расчёт недоступен');
    }
    if (cards[2]) {
      const strong = cards[2].querySelector('strong');
      const small = cards[2].querySelector('small');
      if (strong) strong.textContent = model.selectedDaily ? money(model.selectedDaily * 7) : '—';
      if (small) small.textContent = model.mode === 'manual' ? '7 × ручной дневной лимит' : '7 × автоматический дневной лимит';
    }
  }

  function openBankImport() {
    openModal('Импорт банковской выписки', `<div class="v39-csv-import v67-bank-import"><section class="v67-safety-banner"><span>₽</span><div><h3>Сначала предпросмотр</h3><p>Выберите CSV или TXT из банка. Приложение покажет операции, суммы и найденные дубли, но ничего не добавит без вашего подтверждения.</p></div></section><input id="v67_bank_csv" type="file" data-v39-csv-input accept=".csv,text/csv,text/plain,.txt"><div class="v39-csv-pick-row"><button class="ghost-btn" data-v39-action="pickCsvFile" type="button">Выбрать CSV / TXT</button><button class="btn" data-action="importBankCsv" type="button">Показать операции</button><button class="ghost-btn" data-v39-action="openCsvPaste" type="button">Вставить CSV текстом</button></div><div class="v39-csv-drop">Можно перетащить выписку сюда</div><div class="v39-csv-status">Файл пока не выбран</div><div class="v39-csv-hint"><b>Поддержка:</b> Альфа-Банк и другие CSV с разделителями ; , TAB, датами ДД.ММ.ГГГГ и кодировкой UTF-8/Windows-1251.</div></div>`);
  }

  function saveManualLimit() {
    const value = num(document.getElementById('v67_manual_daily_limit')?.value);
    if (value <= 0) return toast('Укажите ручной дневной лимит больше нуля');
    const settings = ensureV67Settings();
    settings.manualDailyLimit = value;
    settings.financeLimitMode = 'manual';
    save(); render(); toast('Ручной лимит сохранён');
  }

  function setFinanceLimitMode(mode) {
    const settings = ensureV67Settings();
    if (mode === 'manual' && num(settings.manualDailyLimit) <= 0) {
      settings.financeLimitMode = 'manual';
      save(); render();
      setTimeout(() => document.getElementById('v67_manual_daily_limit')?.focus(), 100);
      return toast('Введите ручной дневной лимит');
    }
    settings.financeLimitMode = mode === 'manual' ? 'manual' : 'auto';
    save(); render(); toast(settings.financeLimitMode === 'auto' ? 'Включён автоматический лимит' : 'Включён ручной лимит');
  }

  function dayAtmosphere() {
    const hour = new Date().getHours();
    if (hour < 11) return { key: 'morning', label: 'Спокойное утро', next: hour < 9 ? 'План дня в 09:00' : 'Один главный шаг уже можно выбрать' };
    if (hour < 18) return { key: 'day', label: 'Дневной фокус', next: 'Сохраняйте только важное' };
    return { key: 'evening', label: 'Мягкое завершение', next: hour < 20 ? 'Короткий итог в 20:00' : 'Подведите итог и отпустите день' };
  }

  function isEmploymentItem(item) {
    const area = String(item?.area || '').trim().toLocaleLowerCase('ru-RU');
    const text = `${item?.title || ''} ${item?.name || ''} ${item?.note || ''}`;
    return area === 'работа' || /работа по найму|по найму|зарплат|оклад|работодател|офисн(?:ая|ые|ый) работ|рабоч(?:ая|ие|ий|ую) задач/i.test(text);
  }

  function injectLivingDashboard(view) {
    const hero = view.querySelector('.v65-prime,.v59-hero,.hero');
    if (!hero || view.querySelector('.v67-living-strip')) return;
    const atmosphere = dayAtmosphere();
    const habits = (Array.isArray(state.habits) ? state.habits : []).filter(item => !isEmploymentItem(item));
    const habitsDone = habits.filter(item => item.marks?.[today()]).length;
    const tasks = (Array.isArray(state.tasks) ? state.tasks : []).filter(item => !isEmploymentItem(item) && !['Готово', 'Выполнено', 'Закрыто'].includes(item.status));
    const urgent = tasks.filter(item => item.date && item.date <= today()).length;
    const [cloudTitle] = accountStateText();
    const habitProgress = habits.length ? Math.round(habitsDone / habits.length * 100) : 0;
    hero.insertAdjacentHTML('afterend', `<section class="v67-living-strip"><div class="v67-live-now"><span class="v67-live-orbit"></span><div><small>${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · ${atmosphere.label}</small><b>${atmosphere.next}</b></div></div><button data-go="habits" type="button"><span class="v67-mini-ring" style="--v67-progress:${habitProgress}%">${habitProgress}%</span><div><small>Привычки</small><b>${habitsDone}/${habits.length || 0} сегодня</b></div></button><button data-go="tasks" type="button"><span>✓</span><div><small>Личный план</small><b>${urgent ? `${urgent} требуют внимания` : 'срочных пунктов нет'}</b></div></button><button data-v66-action="openAccountInfo" type="button"><span>◎</span><div><small>Данные</small><b>${html(cloudTitle)}</b></div></button></section>`);
  }

  function injectHabitRule(view) {
    const hero = view.querySelector('.hero,.v59-hero');
    if (!hero || view.querySelector('.v67-habit-rule')) return;
    hero.insertAdjacentHTML('afterend', '<section class="v67-habit-rule"><span>↻</span><div><b>Честная серия</b><small>Пропущенный день обнуляет текущую серию, но вся история отметок сохраняется.</small></div></section>');
  }

  function injectDiaryMap(view) {
    const hero = view.querySelector('.hero,.v59-hero');
    if (!hero || view.querySelector('.v67-diary-map')) return;
    hero.insertAdjacentHTML('afterend', '<section class="v67-diary-map"><span>Ситуация</span><i>→</i><span>Мысль</span><i>→</i><span>Эмоция</span><i>→</i><span>Страх</span><i>→</i><span>Причина</span><i>→</i><span>Сценарий</span><i>→</i><strong>Вывод + действие</strong></section>');
  }

  function injectStuckTasks(view) {
    const hero = view.querySelector('.hero,.v59-hero');
    if (!hero || view.querySelector('.v67-stuck-overview')) return;
    const stuck = (Array.isArray(state.tasks) ? state.tasks : []).filter(item => num(item.postponeCount) >= 3 && !['Готово', 'Выполнено', 'Закрыто'].includes(item.status));
    if (!stuck.length) return;
    hero.insertAdjacentHTML('afterend', `<section class="v67-stuck-overview"><div><span>↻</span><div><b>${stuck.length} ${stuck.length === 1 ? 'задача переносится' : 'задачи переносятся'} снова</b><small>Помощник предложит упростить, разбить, назначить дату или убрать в архив.</small></div></div><button data-v65-action="openDayPlan" type="button">Разобрать</button></section>`);
  }

  function stageLiveCards(view) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    view.querySelectorAll('.v65-card,.v66-panel,.v67-limit-control,.v67-living-strip,.v65-money-kpis>article,.v66-trade-kpis>article').forEach((element, index) => {
      if (element.dataset.v67Staged) return;
      element.dataset.v67Staged = '1';
      element.style.setProperty('--v67-delay', `${Math.min(index, 12) * 34}ms`);
      element.classList.add('v67-live-in');
    });
  }

  function livePostRender() {
    const atmosphere = dayAtmosphere();
    const v70Active = Boolean(document.querySelector('script[src*="app-v70-living.js"]'));
    const v69Active = Boolean(document.querySelector('script[src*="app-v69-calm.js"]'));
    const v68Active = Boolean(document.querySelector('script[src*="app-v68-assistant.js"]'));
    const activeBuild = v70Active ? 'second-brain-space-v71-personal-data-restore-20260716-r26' : (v69Active ? 'second-brain-space-v69-calm-intelligence-20260715' : (v68Active ? 'second-brain-space-v68-unified-assistant-20260715' : BUILD));
    document.body.classList.remove('v67-time-morning', 'v67-time-day', 'v67-time-evening');
    document.body.classList.add(`v67-time-${atmosphere.key}`);
    document.body.dataset.sbosBuild = activeBuild;
    const version = document.querySelector('.v59-version,.version');
    if (version && version.textContent !== (v70Active ? 'V70 · LIVING PERSONAL OS' : (v69Active ? 'V69 · CALM INTELLIGENCE' : (v68Active ? 'V68 · UNIFIED PERSONAL OS' : 'V67 · LIVING PERSONAL OS')))) version.textContent = v70Active ? 'V70 · LIVING PERSONAL OS' : (v69Active ? 'V69 · CALM INTELLIGENCE' : (v68Active ? 'V68 · UNIFIED PERSONAL OS' : 'V67 · LIVING PERSONAL OS'));
    const core = document.querySelector('.v59-core-pill');
    if (core && core.textContent !== (v70Active ? 'V70' : (v69Active ? 'V69' : (v68Active ? 'V68' : 'V67')))) core.textContent = v70Active ? 'V70' : (v69Active ? 'V69' : (v68Active ? 'V68' : 'V67'));
    const view = document.getElementById('view');
    if (!view) return;
    const route = (location.hash || '').replace('#', '') || 'dashboard';
    if (route === 'dashboard') injectLivingDashboard(view);
    if (route === 'finance') injectFinanceLimitControl(view);
    if (route === 'habits') injectHabitRule(view);
    if (route === 'subconscious') injectDiaryMap(view);
    if (route === 'tasks') injectStuckTasks(view);
    stageLiveCards(view);
    updateAccountCardSoon();
  }

  function providerLabel(user) {
    const ids = (user?.providerData || []).map(item => item.providerId);
    if (ids.includes('apple.com')) return 'Apple';
    if (ids.includes('google.com')) return 'Google';
    return 'Email';
  }

  function openAccount() {
    ensureFirebase().then(() => {
      const rollback = jsonRead(KEY.rollback, null);
      if (!currentUser) {
        const unavailable = prefs.phase === 'config-missing';
        openModal('Аккаунт и синхронизация', `<div class="v67-account"><section class="v67-account-hero"><span>◎</span><div><small>Windows + iPhone</small><h3>${unavailable ? 'Облачный проект ещё не настроен' : 'Один личный аккаунт'}</h3><p>${unavailable ? 'Приложение продолжает полностью работать локально. Добавьте firebase-config.js только на защищённом домене.' : 'Вход не загружает данные автоматически. Синхронизация включается отдельным подтверждением после резервной копии.'}</p></div></section>${prefs.lastError ? `<div class="v67-error">${html(prefs.lastError)}</div>` : ''}${unavailable ? '<div class="v67-setup-list"><b>Для запуска облака</b><ol><li>Развернуть приложение на HTTPS-домене.</li><li>Добавить домен в Firebase Authentication.</li><li>Развернуть Firestore и Storage rules.</li><li>Положить firebase-config.js только в окружение развертывания.</li></ol></div>' : `<div class="v67-email-form"><label><span>Email</span><input id="v67_email" type="email" autocomplete="email" placeholder="name@example.com"></label><label><span>Пароль</span><input id="v67_password" type="password" autocomplete="current-password" placeholder="Минимум 8 символов"></label><div class="v67-email-actions"><button data-v67-action="email-signin" class="is-primary" type="button">Войти</button><button data-v67-action="email-signup" type="button">Создать аккаунт</button><button data-v67-action="reset-password" class="is-link" type="button">Забыли пароль?</button></div></div><div class="v67-divider"><span>или</span></div><div class="v67-provider-actions"><button data-v67-action="google" type="button"><b>G</b> Продолжить с Google</button><button data-v67-action="apple" type="button"><b>●</b> Продолжить с Apple</button></div>`}<p class="v67-privacy">PIN остаётся только на устройстве. Пароли и OAuth-токены приложение не сохраняет в резервные копии.</p></div>`);
        return;
      }
      const [statusTitle, statusDetail] = accountStateText();
      const queueCount = Object.keys(queue).length;
      const syncReadyForUser = prefs.uid === currentUser.uid && prefs.collections?.length;
      openModal('Аккаунт и синхронизация', `<div class="v67-account"><section class="v67-user-card"><div class="v67-user-avatar">${html((currentUser.displayName || currentUser.email || 'A').slice(0, 1).toUpperCase())}</div><div><small>${html(providerLabel(currentUser))}</small><h3>${html(currentUser.displayName || currentUser.email || 'Личный аккаунт')}</h3><p>${currentUser.email ? html(currentUser.email) : 'Приватный адрес Apple'}${currentUser.emailVerified ? ' · email подтверждён' : ''}</p></div><span class="v67-user-status">${html(statusTitle)}</span></section>${prefs.lastError ? `<div class="v67-error">${html(prefs.lastError)}</div>` : ''}<section class="v67-sync-status"><article><span>Состояние</span><b>${html(statusTitle)}</b><small>${html(statusDetail)}</small></article><article><span>Очередь</span><b>${queueCount}</b><small>изменений на отправку</small></article><article><span>Конфликты</span><b>${conflicts.length}</b><small>ничего не перезаписывается молча</small></article><article><span>Разделы</span><b>${prefs.enabled && prefs.uid === currentUser.uid ? enabledCollections().length : '—'}</b><small>выбрано для синхронизации</small></article></section><div class="v67-account-actions">${prefs.enabled && prefs.uid === currentUser.uid ? `<button data-v67-action="sync-now" class="is-primary" type="button" ${syncing ? 'disabled' : ''}>${syncing ? 'Синхронизация…' : 'Синхронизировать сейчас'}</button><button data-v67-action="open-conflicts" type="button">Конфликты${conflicts.length ? ` · ${conflicts.length}` : ''}</button><button data-v67-action="open-first-sync" type="button">Изменить разделы</button><button data-v67-action="disable-sync" type="button">Остановить на устройстве</button>` : `<button data-v67-action="${syncReadyForUser ? 'resume-sync' : 'open-first-sync'}" class="is-primary" type="button">${syncReadyForUser ? 'Возобновить синхронизацию' : 'Включить синхронизацию'}</button>`}${rollback ? '<button data-v67-action="restore-rollback" type="button">Вернуться к состоянию до синхронизации</button>' : ''}<button data-v67-action="download-cloud-backup" type="button">Скачать резервную копию</button><button data-v67-action="signout" class="is-danger" type="button">Выйти из аккаунта</button></div><p class="v67-privacy">PIN и банковские ключи не отправляются в облако. Скриншоты Forex хранятся отдельно от записей сделок.</p></div>`);
    });
  }

  function diagnostics() {
    return {
      build: BUILD,
      sdk: SDK_VERSION,
      phase: prefs.phase,
      configured: Boolean(window.SECOND_BRAIN_FIREBASE_CONFIG?.projectId),
      signedIn: Boolean(currentUser),
      syncEnabled: Boolean(prefs.enabled),
      queue: Object.keys(queue).length,
      conflicts: conflicts.length,
      collections: enabledCollections(),
      deviceId: `${deviceId.slice(0, 12)}…`,
      applyingRemote,
      syncing
    };
  }

  function conflictDecision(baseRevision, localHash, remote) {
    const remoteRevision = Number(remote?.revision || 0);
    const remoteHash = remote?.deletedAt ? '__deleted__' : (remote?.contentHash || '');
    if (!remote) return 'write';
    if (remoteRevision <= Number(baseRevision || 0)) return 'write';
    if (remoteHash === localHash) return 'same';
    return 'conflict';
  }

  function selfTest() {
    const cases = [
      conflictDecision(0, 'A', null) === 'write',
      conflictDecision(2, 'A', { revision: 2, contentHash: 'B' }) === 'write',
      conflictDecision(1, 'A', { revision: 2, contentHash: 'A' }) === 'same',
      conflictDecision(1, 'A', { revision: 2, contentHash: 'B' }) === 'conflict',
      conflictDecision(1, '__deleted__', { revision: 2, deletedAt: true }) === 'same'
    ];
    return { ok: cases.every(Boolean), cases, invariant: 'a concurrent different revision is never overwritten' };
  }

  const previousSave = typeof save === 'function' ? save : null;
  if (previousSave) {
    save = function () {
      const result = previousSave.apply(this, arguments);
      scheduleDiff();
      return result;
    };
  }

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      const result = previousRender.apply(this, arguments);
      updateAccountCardSoon();
      requestAnimationFrame(livePostRender);
      return result;
    };
  }

  window.SecondBrainCloud = { openAccount, syncNow, diagnostics, selfTest, conflictDecision };
  document.body.dataset.v67CloudSelftest = selfTest().ok ? 'pass' : 'fail';

  window.addEventListener('click', event => {
    const button = event.target.closest?.('[data-v67-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const action = button.dataset.v67Action;
    if (action === 'open-account') return openAccount();
    if (action === 'email-signin' || action === 'email-signup' || action === 'google' || action === 'apple') return runAuthAction(action);
    if (action === 'reset-password') return resetPassword();
    if (action === 'signout') return signOutAccount();
    if (action === 'open-first-sync') return openFirstSync();
    if (action === 'confirm-first-sync') return enableFirstSync();
    if (action === 'sync-now') return syncNow();
    if (action === 'resume-sync') return resumeSync();
    if (action === 'disable-sync') return disableSyncOnDevice();
    if (action === 'open-conflicts') return openConflicts();
    if (action === 'resolve-conflict') return resolveConflict(button.dataset.conflictId || '', button.dataset.choice || 'remote');
    if (action === 'restore-rollback') return restoreRollback();
    if (action === 'download-cloud-backup') { downloadBackup('manual'); return toast('Резервная копия подготовлена'); }
    if (action === 'open-bank-import') return openBankImport();
    if (action === 'finance-limit-mode') return setFinanceLimitMode(button.dataset.mode || 'auto');
    if (action === 'save-manual-limit') return saveManualLimit();
  }, true);

  window.addEventListener('online', () => { prefs.phase = currentUser && prefs.enabled ? 'connected' : prefs.phase; persistSyncState(); scheduleSync(500); });
  window.addEventListener('offline', () => { prefs.phase = 'offline'; persistSyncState(); });
  window.addEventListener('hashchange', () => [0, 100, 260].forEach(delay => setTimeout(livePostRender, delay)));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleSync(700); });
  setInterval(() => { if (document.visibilityState === 'visible') { scheduleSync(0); livePostRender(); } }, 5 * 60 * 1000);

  document.body.classList.add('v67-cloud-safe');
  document.body.dataset.sbosBuild = BUILD;
  document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', BUILD);
  try { localStorage.setItem('secondBrainOS.currentBuild', BUILD); } catch (error) {}
  updateAccountCardSoon();
  livePostRender();
  [120, 500, 1400, 2300, 4200, 6200].forEach(delay => setTimeout(livePostRender, delay));
  ensureFirebase().catch(error => console.warn('[V67 bootstrap]', error));
})();
