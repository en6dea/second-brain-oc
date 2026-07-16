'use strict';

/* Second Brain OS V73 — encrypted password and access vault.
   Secrets are encrypted in the browser before they are placed into app state. */
(() => {
  const BUILD = 'second-brain-space-v73-password-vault-20260716-r1';
  const LABEL = 'V73 · ПАРОЛИ И ДОСТУПЫ';
  const ROUTE = 'passwords';
  const AUTO_LOCK_MS = 15 * 60 * 1000;
  const DEFAULT_ITERATIONS = 310000;

  let postTimer = 0;
  let vaultQuery = '';
  let lastActivityAt = Date.now();
  const revealedIds = new Set();
  const session = { key: null, entries: [], unlocked: false };

  const clean = value => String(value ?? '').trim();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const makeId = () => typeof uid === 'function' ? uid() : `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const nowIso = () => new Date().toISOString();
  const formatDate = value => value ? new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const bytesToB64 = bytes => {
    let binary = '';
    new Uint8Array(bytes).forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };
  const b64ToBytes = value => {
    const binary = atob(String(value || ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  };
  const randomBytes = length => crypto.getRandomValues(new Uint8Array(length));
  const encode = value => new TextEncoder().encode(String(value));
  const decode = value => new TextDecoder().decode(value);

  function ensureState() {
    if (typeof state !== 'object' || !state) return;
    state.settings = state.settings || {};
    state.settings.passwordVault = Object.assign({ autoLockMinutes: 15 }, state.settings.passwordVault || {});
  }

  function vaultData() {
    ensureState();
    return state.passwordVault && typeof state.passwordVault === 'object' ? state.passwordVault : null;
  }

  function supported() {
    return Boolean(window.crypto?.subtle && window.TextEncoder && window.TextDecoder);
  }

  async function deriveKey(masterPassword, salt, iterations = DEFAULT_ITERATIONS) {
    const source = await crypto.subtle.importKey('raw', encode(masterPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      source,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptEntries(entries, key, salt, iterations = DEFAULT_ITERATIONS) {
    const iv = randomBytes(12);
    const payload = encode(JSON.stringify({ version: 1, entries }));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload);
    return {
      version: 1,
      cipher: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256',
      iterations,
      salt: bytesToB64(salt),
      iv: bytesToB64(iv),
      ciphertext: bytesToB64(ciphertext),
      updatedAt: nowIso()
    };
  }

  async function decryptEntries(vault, key) {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(vault.iv) },
      key,
      b64ToBytes(vault.ciphertext)
    );
    const parsed = JSON.parse(decode(plaintext));
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  }

  function normalizeEntry(raw) {
    return {
      id: clean(raw?.id) || makeId(),
      title: clean(raw?.title) || 'Без названия',
      category: clean(raw?.category) || 'Другое',
      login: clean(raw?.login),
      secret: String(raw?.secret ?? ''),
      url: clean(raw?.url),
      note: clean(raw?.note),
      createdAt: clean(raw?.createdAt) || nowIso(),
      updatedAt: clean(raw?.updatedAt) || nowIso()
    };
  }

  function safeUrl(value) {
    const raw = clean(value);
    if (!raw) return '';
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (error) { return ''; }
  }

  function touch() {
    lastActivityAt = Date.now();
  }

  function lockVault(showToast = true) {
    session.key = null;
    session.entries = [];
    session.unlocked = false;
    revealedIds.clear();
    vaultQuery = '';
    if (showToast && typeof toast === 'function') toast('Хранилище заблокировано');
    renderRoute();
  }

  async function persistEntries() {
    const current = vaultData();
    if (!session.unlocked || !session.key || !current) throw new Error('Vault is locked');
    const salt = b64ToBytes(current.salt);
    const encrypted = await encryptEntries(session.entries.map(normalizeEntry), session.key, salt, Number(current.iterations) || DEFAULT_ITERATIONS);
    state.passwordVault = encrypted;
    state.settings.passwordVault = Object.assign({}, state.settings.passwordVault || {}, { lastUpdatedAt: encrypted.updatedAt });
    if (typeof save === 'function') save();
    touch();
  }

  function createVaultPage() {
    return `<section class="v73-page">
      <header class="v73-hero">
        <div><span class="v73-eyebrow">Мысли и знания · защищённая папка</span><h1>Пароли и доступы</h1><p>Логины, пароли, PIN-коды, ссылки и личные данные в одном зашифрованном хранилище.</p></div>
      </header>
      <article class="v73-card v73-onboarding">
        <div class="v73-lock-icon">🔐</div>
        <div><span>Первичная настройка</span><h2>Создайте мастер-пароль</h2><p>Он будет использоваться только для расшифровки данных на вашем устройстве. Сам мастер-пароль нигде не сохраняется.</p></div>
        <div class="v73-form-stack">
          <label><span>Мастер-пароль</span><input id="v73_master_new" type="password" autocomplete="new-password" placeholder="Минимум 10 символов"></label>
          <label><span>Повторите пароль</span><input id="v73_master_repeat" type="password" autocomplete="new-password" placeholder="Повторите мастер-пароль"></label>
          <button class="is-primary" data-v73-action="create-vault" type="button">Создать защищённое хранилище</button>
        </div>
        <p class="v73-warning">Если мастер-пароль будет потерян, восстановить зашифрованные записи технически невозможно. Сохраните его в надёжном месте.</p>
      </article>
    </section>`;
  }

  function lockedPage() {
    const vault = vaultData();
    return `<section class="v73-page">
      <header class="v73-hero">
        <div><span class="v73-eyebrow">Мысли и знания · защищённая папка</span><h1>Пароли и доступы</h1><p>Хранилище заблокировано. Для просмотра записей нужен мастер-пароль.</p></div>
      </header>
      <article class="v73-card v73-unlock-card">
        <div class="v73-lock-icon">🔒</div>
        <div><span>Зашифровано</span><h2>Разблокировать хранилище</h2><p>Последнее обновление: ${escape(formatDate(vault?.updatedAt))}</p></div>
        <div class="v73-unlock-row"><input id="v73_master_unlock" type="password" autocomplete="current-password" placeholder="Введите мастер-пароль"><button class="is-primary" data-v73-action="unlock-vault" type="button">Открыть</button></div>
        <p class="v73-security-line">AES-GCM · ключ выводится из мастер-пароля · автоматическая блокировка через 15 минут</p>
      </article>
    </section>`;
  }

  function filteredEntries() {
    const query = clean(vaultQuery).toLowerCase();
    const rows = session.entries.map(normalizeEntry).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    if (!query) return rows;
    return rows.filter(item => [item.title, item.category, item.login, item.url, item.note].join(' ').toLowerCase().includes(query));
  }

  function entryCard(entry) {
    const revealed = revealedIds.has(entry.id);
    const url = safeUrl(entry.url);
    return `<article class="v73-entry-card">
      <header><div class="v73-entry-icon">🔑</div><div><span>${escape(entry.category)}</span><h3>${escape(entry.title)}</h3></div><button data-v73-action="edit-entry" data-id="${escape(entry.id)}" type="button">✎</button></header>
      <div class="v73-entry-data">
        <div><span>Логин</span><b>${escape(entry.login || '—')}</b>${entry.login ? `<button data-v73-action="copy-login" data-id="${escape(entry.id)}" type="button">Копировать</button>` : ''}</div>
        <div><span>Пароль / секрет</span><b class="is-secret">${revealed ? escape(entry.secret || '—') : (entry.secret ? '••••••••••••' : '—')}</b>${entry.secret ? `<span class="v73-inline-actions"><button data-v73-action="toggle-secret" data-id="${escape(entry.id)}" type="button">${revealed ? 'Скрыть' : 'Показать'}</button><button data-v73-action="copy-secret" data-id="${escape(entry.id)}" type="button">Копировать</button></span>` : ''}</div>
      </div>
      ${entry.note ? `<p>${escape(entry.note)}</p>` : ''}
      <footer>${url ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">Открыть сайт ↗</a>` : '<span>Без ссылки</span>'}<small>Обновлено ${escape(formatDate(entry.updatedAt))}</small></footer>
    </article>`;
  }

  function unlockedPage() {
    const rows = filteredEntries();
    const total = session.entries.length;
    const categories = new Set(session.entries.map(item => clean(item.category)).filter(Boolean)).size;
    return `<section class="v73-page">
      <header class="v73-hero">
        <div><span class="v73-eyebrow">Мысли и знания · защищённая папка</span><h1>Пароли и доступы</h1><p>Записывайте данные от сервисов, аккаунтов, карт, устройств и любых других доступов.</p></div>
        <div class="v73-hero-actions"><button class="is-primary" data-v73-action="add-entry" type="button">＋ Добавить запись</button><button data-v73-action="lock-vault" type="button">🔒 Заблокировать</button></div>
      </header>
      <section class="v73-stats"><article><span>Записей</span><b>${total}</b><small>зашифровано</small></article><article><span>Категорий</span><b>${categories}</b><small>для быстрого поиска</small></article><article><span>Автоблокировка</span><b>15 мин.</b><small>после бездействия</small></article></section>
      <article class="v73-card v73-toolbar"><div class="v73-search"><span>⌕</span><input id="v73_search" value="${escape(vaultQuery)}" placeholder="Поиск по сервису, логину или комментарию"></div><button data-v73-action="add-entry" type="button">＋ Новая запись</button></article>
      <section class="v73-entry-grid">${rows.map(entryCard).join('') || `<article class="v73-card v73-empty"><div>🔑</div><h3>${vaultQuery ? 'Ничего не найдено' : 'Хранилище пока пустое'}</h3><p>${vaultQuery ? 'Попробуйте изменить поисковый запрос.' : 'Добавьте первый сервис, логин, пароль или любую другую личную информацию.'}</p>${vaultQuery ? '' : '<button class="is-primary" data-v73-action="add-entry" type="button">Добавить первую запись</button>'}</article>`}</section>
      <article class="v73-security-note"><b>Важно:</b> записи шифруются перед сохранением и синхронизацией. Мастер-пароль не сохраняется, но для самых критичных аккаунтов отдельный специализированный менеджер паролей всё равно надёжнее.</article>
    </section>`;
  }

  function pageHtml() {
    ensureState();
    if (!supported()) return `<section class="v73-page"><article class="v73-card v73-empty"><div>⚠️</div><h3>Шифрование не поддерживается</h3><p>Откройте приложение в современном браузере через HTTPS.</p></article></section>`;
    if (!vaultData()) return createVaultPage();
    if (!session.unlocked) return lockedPage();
    return unlockedPage();
  }

  async function createVault() {
    if (!supported()) return;
    const password = String(document.getElementById('v73_master_new')?.value || '');
    const repeat = String(document.getElementById('v73_master_repeat')?.value || '');
    if (password.length < 10) return typeof toast === 'function' ? toast('Мастер-пароль должен содержать минимум 10 символов') : undefined;
    if (password !== repeat) return typeof toast === 'function' ? toast('Пароли не совпадают') : undefined;
    try {
      const salt = randomBytes(16);
      const key = await deriveKey(password, salt, DEFAULT_ITERATIONS);
      state.passwordVault = await encryptEntries([], key, salt, DEFAULT_ITERATIONS);
      session.key = key;
      session.entries = [];
      session.unlocked = true;
      touch();
      if (typeof save === 'function') save();
      renderRoute();
      if (typeof toast === 'function') toast('Защищённое хранилище создано');
    } catch (error) {
      console.error('[V73 vault create]', error);
      if (typeof toast === 'function') toast('Не удалось создать хранилище');
    }
  }

  async function unlockVault() {
    const password = String(document.getElementById('v73_master_unlock')?.value || '');
    const vault = vaultData();
    if (!password || !vault) return typeof toast === 'function' ? toast('Введите мастер-пароль') : undefined;
    try {
      const key = await deriveKey(password, b64ToBytes(vault.salt), Number(vault.iterations) || DEFAULT_ITERATIONS);
      const entries = await decryptEntries(vault, key);
      session.key = key;
      session.entries = entries.map(normalizeEntry);
      session.unlocked = true;
      touch();
      renderRoute();
      if (typeof toast === 'function') toast('Хранилище разблокировано');
    } catch (error) {
      session.key = null;
      session.entries = [];
      session.unlocked = false;
      if (typeof toast === 'function') toast('Неверный мастер-пароль');
    }
  }

  function openEntry(id = '') {
    if (!session.unlocked) return;
    const entry = session.entries.map(normalizeEntry).find(item => item.id === id) || null;
    const html = `<div class="v73-modal-form">
      <label><span>Что это</span><input id="v73_entry_title" value="${escape(entry?.title || '')}" placeholder="Например: Gmail, банк, Wi-Fi, телефон"></label>
      <div class="v73-modal-grid"><label><span>Категория</span><input id="v73_entry_category" value="${escape(entry?.category || '')}" placeholder="Почта, банк, соцсети..."></label><label><span>Логин / email / телефон</span><input id="v73_entry_login" value="${escape(entry?.login || '')}" autocomplete="off" placeholder="Логин или номер"></label></div>
      <label><span>Пароль / PIN / секрет</span><div class="v73-secret-input"><input id="v73_entry_secret" type="password" value="${escape(entry?.secret || '')}" autocomplete="new-password" placeholder="Введите секретные данные"><button data-v73-action="toggle-form-secret" type="button">Показать</button></div></label>
      <label><span>Ссылка</span><input id="v73_entry_url" value="${escape(entry?.url || '')}" placeholder="example.com"></label>
      <label><span>Комментарий и дополнительные данные</span><textarea id="v73_entry_note" placeholder="Куда приходит код, контрольные вопросы, номер договора и другие детали">${escape(entry?.note || '')}</textarea></label>
      <div class="v73-modal-actions"><button class="is-primary" data-v73-action="save-entry" data-id="${escape(entry?.id || '')}" type="button">Сохранить</button>${entry ? `<button class="is-danger" data-v73-action="delete-entry" data-id="${escape(entry.id)}" type="button">Удалить</button>` : ''}<button data-v73-action="close-modal" type="button">Отмена</button></div>
    </div>`;
    if (typeof openModal === 'function') openModal(entry ? 'Изменить доступ' : 'Новая запись', html);
  }

  async function saveEntry(id) {
    if (!session.unlocked) return;
    const title = clean(document.getElementById('v73_entry_title')?.value);
    const category = clean(document.getElementById('v73_entry_category')?.value) || 'Другое';
    const login = clean(document.getElementById('v73_entry_login')?.value);
    const secret = String(document.getElementById('v73_entry_secret')?.value || '');
    const url = clean(document.getElementById('v73_entry_url')?.value);
    const note = clean(document.getElementById('v73_entry_note')?.value);
    if (!title) return typeof toast === 'function' ? toast('Укажите, к чему относятся данные') : undefined;
    const previous = session.entries.map(normalizeEntry).find(item => item.id === id) || null;
    const next = normalizeEntry({ id: previous?.id || makeId(), title, category, login, secret, url, note, createdAt: previous?.createdAt || nowIso(), updatedAt: nowIso() });
    session.entries = session.entries.filter(item => clean(item.id) !== next.id);
    session.entries.unshift(next);
    try {
      await persistEntries();
      if (typeof closeModal === 'function') closeModal();
      renderRoute();
      if (typeof toast === 'function') toast('Запись зашифрована и сохранена');
    } catch (error) {
      console.error('[V73 vault save]', error);
      if (typeof toast === 'function') toast('Не удалось сохранить запись');
    }
  }

  async function deleteEntry(id) {
    const entry = session.entries.map(normalizeEntry).find(item => item.id === id);
    if (!entry) return;
    if (!window.confirm(`Удалить запись «${entry.title}»?`)) return;
    session.entries = session.entries.filter(item => clean(item.id) !== id);
    revealedIds.delete(id);
    try {
      await persistEntries();
      if (typeof closeModal === 'function') closeModal();
      renderRoute();
      if (typeof toast === 'function') toast('Запись удалена');
    } catch (error) {
      if (typeof toast === 'function') toast('Не удалось удалить запись');
    }
  }

  async function copyValue(value, label) {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      touch();
      if (typeof toast === 'function') toast(`${label} скопирован`);
    } catch (error) {
      if (typeof toast === 'function') toast('Не удалось скопировать');
    }
  }

  function entryById(id) {
    return session.entries.map(normalizeEntry).find(item => item.id === id) || null;
  }

  function updateNavigation() {
    const shell = document.querySelector('.v68-nav-shell');
    if (!shell) return;
    let button = shell.querySelector('[data-v73-nav="passwords"]');
    if (!button) {
      button = document.createElement('button');
      button.className = 'v59-nav-item';
      button.type = 'button';
      button.dataset.v73Nav = ROUTE;
      button.innerHTML = '<span class="v59-nav-ico" style="background:#8b5cf6">🔐</span><span class="label">Пароли и доступы</span><span class="v59-nav-tools"></span>';
    }
    const knowledgeFolder = [...shell.querySelectorAll('.v68-nav-subfolder')].find(folder => clean(folder.querySelector(':scope > summary span')?.textContent) === 'Мысли и знания');
    if (knowledgeFolder) {
      const list = knowledgeFolder.lastElementChild;
      if (button.parentElement !== list) list.appendChild(button);
      const count = knowledgeFolder.querySelector(':scope > summary em');
      if (count) count.textContent = String(list.querySelectorAll('.v59-nav-item').length);
      if ((location.hash || '').replace('#', '') === ROUTE) knowledgeFolder.open = true;
      const memoryFolder = knowledgeFolder.closest('.v68-nav-folder');
      if (memoryFolder) {
        const memoryCount = memoryFolder.querySelector(':scope > summary em');
        if (memoryCount) memoryCount.textContent = String(memoryFolder.querySelectorAll('.v59-nav-item').length);
        if ((location.hash || '').replace('#', '') === ROUTE) memoryFolder.open = true;
      }
    }
    const active = (location.hash || '').replace('#', '') === ROUTE;
    button.classList.toggle('active', active);
  }

  function setBuild() {
    document.body.dataset.sbosBuild = BUILD;
    document.body.dataset.v73PasswordVault = 'ready';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', BUILD);
    try { localStorage.setItem('secondBrainOS.currentBuild', BUILD); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version) version.textContent = LABEL;
    const core = document.querySelector('.v59-core-pill');
    if (core) core.textContent = 'V73';
  }

  function renderRoute() {
    ensureState();
    const route = (location.hash || '').replace('#', '') || 'dashboard';
    document.body.classList.toggle('v73-passwords-route', route === ROUTE);
    updateNavigation();
    setBuild();
    if (route !== ROUTE) return;
    const view = document.getElementById('view');
    if (!view) return;
    view.innerHTML = pageHtml();
    document.querySelectorAll('.v59-nav-item').forEach(button => button.classList.toggle('active', button.dataset.v73Nav === ROUTE));
    updateNavigation();
    requestAnimationFrame(() => document.getElementById('v73_master_unlock')?.focus());
  }

  function navigate() {
    try { page = ROUTE; } catch (error) {}
    try { history.pushState(null, '', `#${ROUTE}`); }
    catch (error) { location.hash = ROUTE; }
    renderRoute();
  }

  function schedulePost(delay = 30) {
    clearTimeout(postTimer);
    postTimer = setTimeout(renderRoute, delay);
  }

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      const result = previousRender.apply(this, arguments);
      requestAnimationFrame(renderRoute);
      return result;
    };
  }

  window.PasswordVault = { navigate, render: renderRoute, lock: lockVault };

  window.addEventListener('click', event => {
    const navButton = event.target.closest?.('[data-v73-nav="passwords"]');
    if (navButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      touch();
      return navigate();
    }
    const button = event.target.closest?.('[data-v73-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    touch();
    const action = button.dataset.v73Action;
    if (action === 'create-vault') return createVault();
    if (action === 'unlock-vault') return unlockVault();
    if (action === 'lock-vault') return lockVault();
    if (action === 'add-entry') return openEntry();
    if (action === 'edit-entry') return openEntry(button.dataset.id || '');
    if (action === 'save-entry') return saveEntry(button.dataset.id || '');
    if (action === 'delete-entry') return deleteEntry(button.dataset.id || '');
    if (action === 'close-modal') return typeof closeModal === 'function' ? closeModal() : undefined;
    if (action === 'toggle-form-secret') {
      const input = document.getElementById('v73_entry_secret');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        button.textContent = input.type === 'password' ? 'Показать' : 'Скрыть';
      }
      return;
    }
    const entry = entryById(button.dataset.id || '');
    if (action === 'copy-login' && entry) return copyValue(entry.login, 'Логин');
    if (action === 'copy-secret' && entry) return copyValue(entry.secret, 'Пароль');
    if (action === 'toggle-secret' && entry) {
      revealedIds.has(entry.id) ? revealedIds.delete(entry.id) : revealedIds.add(entry.id);
      return renderRoute();
    }
  }, true);

  window.addEventListener('input', event => {
    if (event.target?.id !== 'v73_search') return;
    vaultQuery = event.target.value || '';
    touch();
    const grid = document.querySelector('.v73-entry-grid');
    if (grid) grid.innerHTML = filteredEntries().map(entryCard).join('') || '<article class="v73-card v73-empty"><div>⌕</div><h3>Ничего не найдено</h3><p>Попробуйте изменить поисковый запрос.</p></article>';
  });

  window.addEventListener('keydown', event => {
    if ((location.hash || '').replace('#', '') !== ROUTE) return;
    touch();
    if (event.key === 'Enter' && event.target?.id === 'v73_master_unlock') unlockVault();
  });

  window.addEventListener('hashchange', () => [0, 80, 220].forEach(delay => setTimeout(renderRoute, delay)));
  window.addEventListener('storage', event => {
    if (event.key === 'secondBrainOS.v1') {
      if (session.unlocked) lockVault(false);
      schedulePost(80);
    }
  });

  setInterval(() => {
    if (!session.unlocked) return;
    if (Date.now() - lastActivityAt >= AUTO_LOCK_MS) lockVault(true);
  }, 30000);

  try {
    ensureState();
    schedulePost(0);
    schedulePost(200);
  } catch (error) {
    console.error('[V73 Password Vault]', error);
  }
})();
