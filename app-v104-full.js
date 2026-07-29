/* Second Brain OS V104 — stability, unified guidance, line icons and responsive behavior. */
'use strict';
(() => {
  const BUILD = window.SecondBrainBuild || {id: 'second-brain-os-v104', label: 'V104 · UNIFIED LIFE OS'};
  const DB_NAME = 'SecondBrainOSDurableStorage';
  const DB_STORE = 'records';
  const DB_MAIN = 'main-state';
  const STORE_KEY = 'secondBrainOS.v1';
  let applying = false;
  let queued = false;
  let saveQueue = Promise.resolve();

  const routeNow = () => (location.hash || '#today').replace(/^#/, '').split('?')[0] || 'today';
  const stateNow = () => window.SecondBrainApp?.getState?.() || window.state || {};
  const cleanText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const clone = (value) => {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  };

  const ICONS = {
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    game: '<path d="M13 2 4.5 13H11l-1 9 8.5-12H12l1-8Z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M15 9 21 3"/>',
    inbox: '<path d="M4 5h16v14H4zM8 9h8M8 13h5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    finance: '<path d="M4 19V9M10 19V5M16 19v-7M22 19V2"/>',
    leaf: '<path d="M4 17c3-7 7-10 16-10-1 9-5 13-12 13"/><path d="M6 20c3-5 6-7 11-9"/>',
    note: '<path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/>',
    archive: '<path d="M4 7h16v13H4zM3 4h18v3H3zM9 11h6"/>',
    coach: '<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a2 2 0 0 0 .4 2.2l.1.1-2.8 2.8-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8V22H10v-.6a2 2 0 0 0-1.2-1.8 2 2 0 0 0-2.2.4l-.1.1-2.8-2.8.1-.1A2 2 0 0 0 4.2 15 2 2 0 0 0 2.4 13H2V9h.4a2 2 0 0 0 1.8-1.2 2 2 0 0 0-.4-2.2l-.1-.1 2.8-2.8.1.1a2 2 0 0 0 2.2.4A2 2 0 0 0 10 1.4V1h4v.4a2 2 0 0 0 1.2 1.8 2 2 0 0 0 2.2-.4l.1-.1 2.8 2.8-.1.1a2 2 0 0 0-.4 2.2A2 2 0 0 0 21.6 9h.4v4h-.4a2 2 0 0 0-2.2 2Z"/>',
    book: '<path d="M4 5h12a4 4 0 0 1 4 4v10H8a4 4 0 0 1-4-4V5Z"/><path d="M8 5v14"/>',
    brain: '<path d="M8 5.5A3.5 3.5 0 0 1 12 3a3.5 3.5 0 0 1 4 2.5A3.5 3.5 0 0 1 18 11a3.5 3.5 0 0 1-2 5.5A3.5 3.5 0 0 1 12 19a3.5 3.5 0 0 1-4-2.5A3.5 3.5 0 0 1 6 11a3.5 3.5 0 0 1 2-5.5Z"/><path d="M12 3v16M8 6c2 1 2 2 2 4M16 6c-2 1-2 2-2 4M8 16c2-1 2-2 2-4M16 16c-2-1-2-2-2-4"/>',
    water: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/>',
    run: '<circle cx="14" cy="4" r="2"/><path d="m8 12 3-4 4 2 2 4M11 8l-2 6-4 3M13 13l-1 4 4 4"/>',
    moon: '<path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
    heart: '<path d="M20.8 5.8a5.4 5.4 0 0 0-7.6 0L12 7l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 22l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z"/>',
    cart: '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 11h10.8l2-7H6"/>',
    food: '<path d="M6 3v8M3 3v5a3 3 0 0 0 6 0V3M6 11v10M16 3v18M16 3c4 2 5 7 0 10"/>',
    transport: '<path d="M5 17h14l-1-8a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3l-1 8Z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/><path d="M7 11h10"/>',
    house: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    medical: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8H7.5a2.5 2.5 0 1 1 4.5-1.5V8Zm0 0h4.5A2.5 2.5 0 1 0 12 6.5V8Z"/>',
    plane: '<path d="m22 2-9 20-2-9-9-2 20-9Z"/><path d="M11 13 22 2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2 2M14 9l2 2"/>',
    coffee: '<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 10h2a3 3 0 0 1 0 6h-2M7 3v2M11 3v2M15 3v2"/>',
    shirt: '<path d="m8 4-5 3 3 5 2-1v10h8V11l2 1 3-5-5-3a4 4 0 0 1-8 0Z"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M11 18h2"/>',
    pet: '<circle cx="12" cy="14" r="5"/><circle cx="5" cy="8" r="2"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="19" cy="8" r="2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>'
  };

  const svg = (name) => `<svg class="v104-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">${ICONS[name] || ICONS.coach}</svg>`;

  function semanticIcon(text) {
    const value = cleanText(text).toLocaleLowerCase('ru-RU');
    if (/главн|сегодня/.test(value)) return 'home';
    if (/gamelife|игр|xp|hp/.test(value)) return 'game';
    if (/цел|фокус/.test(value)) return 'target';
    if (/разоб|входящ/.test(value)) return 'inbox';
    if (/календар|дата|платеж/.test(value)) return 'calendar';
    if (/финанс|деньг|баланс|операц|доход|расход/.test(value)) return 'finance';
    if (/привыч|спокой|медитац/.test(value)) return 'leaf';
    if (/информац|замет|документ/.test(value)) return 'note';
    if (/архив/.test(value)) return 'archive';
    if (/настрой/.test(value)) return 'settings';
    if (/книг|чтен/.test(value)) return 'book';
    if (/англ|обуч|развит|подсозн|дневник/.test(value)) return 'brain';
    if (/вод/.test(value)) return 'water';
    if (/движ|спорт|трен|прогул/.test(value)) return 'run';
    if (/сон|вечер/.test(value)) return 'moon';
    if (/отнош|любов|люди|полин/.test(value)) return 'heart';
    if (/продукт|покуп|магаз/.test(value)) return 'cart';
    if (/еда|кафе|питан/.test(value)) return 'food';
    if (/транспорт|такси|авто/.test(value)) return 'transport';
    if (/жиль|дом|аренд/.test(value)) return 'house';
    if (/здоров|медиц|аптек/.test(value)) return 'medical';
    if (/подар/.test(value)) return 'gift';
    if (/путеше|поезд|самол/.test(value)) return 'plane';
    if (/защит|долг|обязат/.test(value)) return 'shield';
    if (/фильм|кино/.test(value)) return 'film';
    if (/парол/.test(value)) return 'key';
    if (/выполн|готов/.test(value)) return 'check';
    return 'coach';
  }

  function setIcon(host, key) {
    if (!host || host.dataset.v104Icon === key) return;
    host.innerHTML = svg(key);
    host.dataset.v104Icon = key;
    host.setAttribute('aria-hidden', 'true');
  }

  function decorateIcons(root = document) {
    const routeIcons = {
      today: 'home', gamelife: 'game', goals: 'target', 'review-queue': 'inbox',
      calendar: 'calendar', finance: 'finance', habits: 'leaf', information: 'note',
      archive: 'archive', coach: 'coach', system: 'settings'
    };
    root.querySelectorAll?.('[data-v78-route]').forEach((node) => {
      const key = routeIcons[node.dataset.v78Route];
      const host = node.querySelector(':scope > i,.v78-nav-icon,.v104-route-icon');
      if (key && host) setIcon(host, key);
    });
    root.querySelectorAll?.('.v78-info-folder>i,.v78-finance-folder>i,.v78-operation-folder button>i,.v78-folder-icon,.v78-folder-row>i,.v78-library-card>i').forEach((host) => {
      setIcon(host, semanticIcon(host.parentElement?.textContent));
    });
    /* Habit icons are controlled by the saved user choice in app-v91-stability.js.
       Do not infer them from the habit name here: that used to overwrite edits. */
    root.querySelectorAll?.('.v866-category-row>i,.v8612-live-icon,.v8612-category-row>i').forEach((host) => {
      setIcon(host, semanticIcon(host.parentElement?.textContent));
    });
  }

  function polishLinkedGoals(root = document) {
    root.querySelectorAll?.('.v82-icon-picker > .v865-habit-select-list').forEach((list) => {
      const section = list.closest('.v82-icon-picker');
      const title = cleanText(section?.querySelector('header span')?.textContent);
      if (!/связанные цели/i.test(title)) return;
      section.classList.add('v106-linked-goals-picker');
      list.setAttribute('role', 'group');
      list.setAttribute('aria-label', 'Связанные цели');
      const mark = section.querySelector(':scope > header > strong');
      if (mark && !mark.classList.contains('v106-linked-goals-mark')) {
        mark.className = 'v106-linked-goals-mark';
        mark.innerHTML = svg('target');
      }
    });
  }

  function polishDebtScenarios(root = document) {
    const section = root.querySelector?.('.v884-scenarios');
    if (!section || section.dataset.v106Ready === 'true') return;
    const cards = [...section.querySelectorAll(':scope > article')];
    if (!cards.length) return;
    section.dataset.v106Ready = 'true';
    section.classList.add('v106-debt-scenarios');
    section.setAttribute('aria-labelledby', 'v106_debt_scenarios_title');

    const results = cards.map((card) => ({
      label: cleanText(card.querySelector('small')?.textContent),
      date: cleanText(card.querySelector('b')?.textContent),
      term: cleanText(card.querySelector('span')?.textContent)
    }));
    const hasCalculation = results.some((item) => item.date && !/не удалось|нет данных/i.test(item.date));
    const sameResult = hasCalculation && new Set(results.map((item) => `${item.date}|${item.term}`)).size === 1;
    const calculationHint = hasCalculation
      ? (sameResult ? ' При текущем остатке все три варианта дают одинаковый срок.' : '')
      : ' Добавьте остаток долга, ставку и минимальный платёж — после этого появятся даты.';
    const header = document.createElement('header');
    header.className = 'v106-debt-scenarios-head';
    header.innerHTML = `<span>${svg('finance')}</span><div><small>СЦЕНАРИИ ДОСРОЧНОГО ПОГАШЕНИЯ</small><h2 id="v106_debt_scenarios_title">Как доплата изменит срок долга</h2><p>Расчёт использует текущий остаток, процентные ставки и минимальные платежи.${calculationHint}</p></div>`;
    section.prepend(header);

    cards.forEach((card, index) => {
      const item = results[index];
      const amount = item.label.replace(/^Дополнительно\s*/i, '').replace(/\s*\/\s*мес\.?$/i, '').trim() || '—';
      card.classList.add('v106-debt-scenario');
      card.innerHTML = `<span class="v106-debt-scenario-icon">${svg('finance')}</span><div class="v106-debt-scenario-copy"><small>ДОПЛАТА СВЕРХ МИНИМУМА</small><b>+${escapeHtml(amount)} в месяц</b></div><dl><div><dt>Расчётное закрытие</dt><dd>${escapeHtml(item.date || 'Нет данных')}</dd></div><div><dt>Срок погашения</dt><dd>${escapeHtml(item.term || 'Не рассчитан')}</dd></div></dl>`;
    });
  }

  function polishPlanForm(root = document) {
    const title = root.querySelector?.('#v869_plan_title');
    if (!title) return;
    const card = title.closest('.modal-card') || title.closest('[role="dialog"]') || document.querySelector('#modal');
    if (!card) return;
    card.classList.add('v106-plan-modal');
    ['v869_plan_title', 'v869_plan_month', 'v869_plan_amount', 'v869_plan_category'].forEach((id) => {
      document.getElementById(id)?.setAttribute('aria-required', 'true');
    });
    if (!card.querySelector('.v106-plan-form-error')) {
      const error = document.createElement('p');
      error.className = 'v106-plan-form-error';
      error.setAttribute('role', 'alert');
      error.hidden = true;
      const form = card.querySelector('.v79-form-grid');
      form?.before(error);
    }
  }

  function polishCsvPreview(root = document) {
    const table = root.querySelector?.('.v85-preview-table.v867-import-table');
    if (!table) return;
    const card = table.closest('.modal-card');
    card?.classList.add('v106-csv-preview-modal');
    table.querySelectorAll('[data-v85-field="note"]').forEach((input) => {
      if (!input.title) input.title = cleanText(input.value);
      input.setAttribute('aria-label', 'Комментарий банковской операции');
    });
  }

  function polishReviewModals(root = document) {
    const weekly = root.querySelector?.('.v85-weekly-review');
    weekly?.closest('.modal-card')?.classList.add('v106-weekly-review-modal');
    const inboxDecision = root.querySelector?.('[data-v106-inbox-decision]');
    inboxDecision?.closest('.modal-card')?.classList.add('v106-inbox-review-modal');
  }

  function validatePlanForm() {
    const title = document.getElementById('v869_plan_title');
    if (!title) return null;
    const month = document.getElementById('v869_plan_month');
    const amount = document.getElementById('v869_plan_amount');
    const category = document.getElementById('v869_plan_category');
    const checks = [
      [title, cleanText(title.value) ? '' : 'Введите название расхода'],
      [month, /^\d{4}-\d{2}$/.test(month?.value || '') ? '' : 'Выберите месяц'],
      [amount, Number(amount?.value || 0) > 0 ? '' : 'Укажите сумму больше нуля'],
      [category, category?.value && category.value !== '__new__' ? '' : 'Выберите категорию']
    ];
    checks.forEach(([field]) => field?.removeAttribute('aria-invalid'));
    const failed = checks.find(([, message]) => message);
    const card = title.closest('.v106-plan-modal') || title.closest('.modal-card') || document.querySelector('#modal');
    const error = card?.querySelector('.v106-plan-form-error');
    if (!failed) {
      if (error) {
        error.textContent = '';
        error.hidden = true;
      }
      return null;
    }
    const [field, message] = failed;
    field?.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    field?.focus({preventScroll: true});
    field?.scrollIntoView({block: 'center', behavior: 'smooth'});
    return message;
  }

  function decorateFinancePicker(root = document) {
    const picker = root.querySelector?.('.v88-finance-icon-picker');
    if (!picker || picker.dataset.v104Ready === 'true') return;
    picker.dataset.v104Ready = 'true';
    const keys = ['cart','food','transport','house','medical','book','gift','plane','shield','film','heart','finance','calendar','note','leaf','target','water','run','moon','key','home','game','inbox','archive','coach','settings','brain','check','coffee','shirt','phone','pet'];
    picker.querySelectorAll('[data-v88-finance-icon]').forEach((button, index) => {
      button.innerHTML = svg(keys[index % keys.length]);
      button.dataset.v104Symbol = keys[index % keys.length];
    });
  }

  const openDb = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB недоступен'));
  });

  async function dbPut(key, value) {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Ошибка записи IndexedDB'));
        tx.onabort = () => reject(tx.error || new Error('Запись IndexedDB отменена'));
      });
    } finally {
      db.close();
    }
  }

  function compactMirror(updatedAt) {
    const source = stateNow();
    return {
      schemaVersion: Number(source.schemaVersion || 1),
      settings: {
        storageGuard: {
          version: 104,
          updatedAt,
          primary: 'indexeddb',
          compactMirror: true,
          fullStateInIndexedDB: true
        }
      }
    };
  }

  async function persistFull(reason = 'v104-save') {
    const source = stateNow();
    if (!source || typeof source !== 'object') throw new Error('Состояние приложения не загружено');
    source.settings = source.settings && typeof source.settings === 'object' ? source.settings : {};
    const updatedAt = new Date().toISOString();
    source.settings.storageGuard = Object.assign({}, source.settings.storageGuard || {}, {
      version: 104,
      updatedAt,
      primary: 'indexeddb',
      compactMirror: true,
      fullStateInIndexedDB: true
    });
    const snapshot = clone(source);
    await dbPut(DB_MAIN, {version: 104, buildId: BUILD.id, updatedAt, reason, state: snapshot});
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(compactMirror(updatedAt)));
      localStorage.setItem('secondBrainOS.currentBuild', BUILD.id);
      localStorage.setItem('secondBrainOS.lastSuccessfulSave', updatedAt);
      localStorage.removeItem('secondBrainOS.lastSaveError');
    } catch (error) {
      console.warn('[V104 compact mirror]', error);
    }
    document.body.dataset.sbosStorage = 'indexeddb-primary';
    document.body.dataset.v884Save = 'ok';
    window.dispatchEvent(new CustomEvent('second-brain-v104-saved', {detail: {updatedAt, reason}}));
    return true;
  }

  function installDurableSave() {
    window.save = function saveV104() {
      try {
        window.v8612InvalidateFinance?.();
      } catch (_) {}
      saveQueue = saveQueue.catch(() => undefined).then(() => persistFull('v104-runtime-save')).catch((error) => {
        document.body.dataset.sbosStorage = 'error';
        document.body.dataset.v884Save = 'error';
        try {
          localStorage.setItem('secondBrainOS.lastSaveError', String(error?.message || error));
        } catch (_) {}
        console.error('[V104 durable save]', error);
        window.SecondBrainApp?.toast?.('Не удалось подтвердить сохранение. Откройте настройки.');
        return false;
      });
      setTimeout(() => window.SecondBrainCloud?.schedulePush?.(stateNow()), 0);
      return true;
    };
    window.SecondBrainStorageV104 = {
      save: window.save,
      flush: () => saveQueue,
      persistFull,
      mode: () => document.body?.dataset?.sbosStorage || 'booting'
    };
  }

  async function migrateStorage() {
    try {
      await window.SecondBrainBackup?.create?.({reason: 'automatic-before-v104-storage-migration'});
      await persistFull('v104-storage-migration');
    } catch (error) {
      document.body.dataset.sbosStorage = 'error';
      console.error('[V104 storage migration]', error);
    }
  }

  function hpJournal(limit = 120) {
    const logs = Array.isArray(stateNow().gameLife?.logs) ? stateNow().gameLife.logs : [];
    return logs
      .filter(Boolean)
      .slice()
      .sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || '')))
      .slice(0, Math.max(1, Number(limit) || 120));
  }
  window.hpJournal = hpJournal;

  const finiteNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function skillCard(key, icon, title) {
    const value = finiteNumber(stateNow().gameLife?.skillXp?.[key]);
    const level = Math.max(1, Math.floor(value / 60) + 1);
    const progress = Math.max(0, Math.min(100, (value % 60) / 60 * 100));
    return `<article><i>${escapeHtml(icon)}</i><span><small>${escapeHtml(title)}</small><b>Уровень ${level}</b><u><em style="width:${progress}%"></em></u></span><strong>${value} XP</strong></article>`;
  }

  function rewardCooldownRemaining(reward = {}) {
    const cooldownDays = finiteNumber(reward.cooldownDays);
    if (!cooldownDays || !reward.lastRedeemedAt) return 0;
    const redeemed = new Date(reward.lastRedeemedAt);
    if (Number.isNaN(redeemed.getTime())) return 0;
    const readyAt = redeemed.getTime() + cooldownDays * 86400000;
    return Math.max(0, Math.ceil((readyAt - Date.now()) / 86400000));
  }

  function rewardVisual(reward = {}) {
    const image = String(reward.imageUrl || '').trim();
    const fallback = escapeHtml(reward.icon || '🎁');
    if (!/^https?:\/\//i.test(image) && !/^data:image\//i.test(image)) return `<i>${fallback}</i>`;
    return `<span class="v85-reward-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(reward.title || 'Награда')}" loading="lazy" onerror="this.parentElement.textContent='${fallback}'"></span>`;
  }

  function rewardAvailability(reward = {}) {
    const game = stateNow().gameLife || {};
    const levelData = window.gameLevelData?.();
    const level = finiteNumber(levelData?.level || game.level || 1);
    const cooldown = rewardCooldownRemaining(reward);
    if (reward.archived || reward.active === false) return {ok: false, text: 'Неактивна'};
    if (finiteNumber(reward.minLevel) > level) return {ok: false, text: `Нужен LV ${finiteNumber(reward.minLevel)}`};
    if (reward.limit && finiteNumber(reward.redeemedCount) >= finiteNumber(reward.limit)) return {ok: false, text: 'Лимит исчерпан'};
    if (cooldown) return {ok: false, text: `Через ${cooldown} дн.`};
    if (finiteNumber(game.coins) < finiteNumber(reward.cost)) return {ok: false, text: 'Не хватает HP'};
    return {ok: true, text: 'Получить'};
  }

  window.skillCard = skillCard;
  window.rewardCooldownRemaining = rewardCooldownRemaining;
  window.rewardVisual = rewardVisual;
  window.rewardAvailability = rewardAvailability;

  function suppressRedundantGuidance(root = document) {
    const page = root.querySelector?.('.v78-page');
    if (!page) return;
    const route = routeNow();
    const assistants = [...page.querySelectorAll('.sbos-v93-context-assistant,.v78-assistant-strip,.v867-finance-assistant')];
    assistants.forEach((card, index) => {
      const text = cleanText(card.textContent);
      const zeroCategory = /^0\s+операц/i.test(text) && /категор/i.test(text);
      const zeroQueue = /^0\s+/i.test(text) && /разбор/i.test(text);
      card.hidden = zeroCategory || zeroQueue || index > 0;
    });
    if (route === 'habits') {
      page.querySelectorAll('article,section').forEach((card) => {
        const heading = cleanText(card.querySelector(':scope h2')?.textContent);
        if (/^Подсказчик AI$/i.test(heading)) card.classList.add('v104-redundant-guidance');
      });
    }
    if (route === 'review-queue' && /очередь полностью разобрана/i.test(page.textContent)) {
      assistants.forEach((card) => { card.hidden = true; });
      page.querySelectorAll('button').forEach((button) => {
        if (/разобрать\s+(одну|0)/i.test(cleanText(button.textContent))) button.hidden = true;
      });
    }
    page.querySelectorAll('.v103-next-step').forEach((node) => node.classList.add('v104-redundant-guidance'));
  }

  function makeCardsAccessible(root = document) {
    root.querySelectorAll?.('.v884-check-row').forEach((row) => {
      row.classList.add('v104-full-click');
      row.setAttribute('aria-label', cleanText(row.textContent));
    });
    root.querySelectorAll?.('button,[role="button"],a[href],input,select,textarea').forEach((control) => {
      if (!control.hasAttribute('tabindex') && control.tagName !== 'INPUT' && control.tagName !== 'SELECT' && control.tagName !== 'TEXTAREA') {
        control.tabIndex = 0;
      }
    });
  }

  function normalizePolina(root = document) {
    if (routeNow() !== 'polina') return;
    root.querySelectorAll?.('.v72-calendar-day,.v72-polina-day,.v79-record-card,.v80-record-card').forEach((card) => card.classList.add('v104-equal-tile'));
    root.querySelectorAll?.('.v72-forecast,.v72-polina-forecast').forEach((node) => {
      if (!node.querySelector('.v104-forecast-label')) {
        const label = document.createElement('small');
        label.className = 'v104-forecast-label';
        label.textContent = 'Прогноз · ориентир';
        node.prepend(label);
      }
    });
  }

  function preferDayCalendarOnMobile(root = document) {
    if (routeNow() !== 'calendar' || window.innerWidth > 760) return;
    const key = 'secondBrainOS.v104.mobileCalendarInitialized';
    let initialized = false;
    try { initialized = sessionStorage.getItem(key) === '1'; } catch (_) {}
    if (initialized) return;
    const dayButton = root.querySelector?.('[data-v82-action="calendar-view"][data-view="day"]');
    if (!dayButton || dayButton.classList.contains('active')) return;
    try { sessionStorage.setItem(key, '1'); } catch (_) {}
    setTimeout(() => dayButton.click(), 0);
  }

  function restoreTheme() {
    const preferences = window.SecondBrainVisual?.getSettings?.();
    const resolved = preferences?.resolvedTheme || (
      document.body?.dataset?.themeMode === 'dark' ? 'dark' : 'light'
    );
    const dark = resolved === 'dark';
    const root = document.documentElement;
    const incorrect = !root.classList.contains(`v88-${resolved}`) ||
      !root.classList.contains(`v87-${resolved}`) ||
      root.classList.contains(`v88-${dark ? 'light' : 'dark'}`) ||
      root.classList.contains(`v87-${dark ? 'light' : 'dark'}`);
    if (incorrect) {
      root.classList.remove('v87-light', 'v87-dark', 'v88-light', 'v88-dark');
      root.classList.add(`v87-${resolved}`, `v88-${resolved}`);
      document.body?.classList.add('v87-constellation', 'v88-constellation');
      if (document.body && preferences?.themeMode) document.body.dataset.themeMode = preferences.themeMode;
    }
    if (root.style.colorScheme !== resolved) root.style.colorScheme = resolved;
    return dark;
  }

  function updateThemeMeta() {
    const dark = restoreTheme();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#08101f' : '#f4f7fb');
    document.documentElement.dataset.v104Theme = dark ? 'dark' : 'light';
  }

  function setRouteState() {
    document.body.dataset.sbosRoute = routeNow();
  }

  function apply(root = document) {
    if (applying) return;
    applying = true;
    try {
      setRouteState();
      updateThemeMeta();
      decorateIcons(root);
      decorateFinancePicker(root);
      polishLinkedGoals(root);
      polishDebtScenarios(root);
      polishPlanForm(root);
      polishCsvPreview(root);
      polishReviewModals(root);
      suppressRedundantGuidance(root);
      makeCardsAccessible(root);
      normalizePolina(root);
      preferDayCalendarOnMobile(root);
      root.querySelectorAll?.('[data-v98-diagnostics],[data-v97-diagnostics]').forEach((node) => node.remove());
      document.documentElement.dataset.v104Ready = 'true';
    } catch (error) {
      console.error('[V104 interface pass]', error);
    } finally {
      applying = false;
    }
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  document.addEventListener('click', (event) => {
    const savePlan = event.target.closest?.('[data-v869-action="save-plan"]');
    if (savePlan) {
      const error = validatePlanForm();
      if (error) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
    }
    const assistantDay = event.target.closest?.('button');
    if (assistantDay && /посмотреть день/i.test(cleanText(assistantDay.textContent))) {
      const dayButton = document.querySelector('[data-v82-action="calendar-view"][data-view="day"]');
      if (dayButton && !dayButton.classList.contains('active')) {
        event.preventDefault();
        event.stopPropagation();
        dayButton.click();
      }
    }
  }, true);

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length || record.attributeName === 'class')) queueApply();
  });

  function boot() {
    installDurableSave();
    apply();
    observer.observe(document.documentElement, {subtree: true, childList: true, attributes: true, attributeFilter: ['class']});
    window.addEventListener('hashchange', () => setTimeout(apply, 40));
    window.addEventListener('pageshow', () => setTimeout(apply, 60));
    setTimeout(migrateStorage, 700);
    setTimeout(apply, 120);
    setTimeout(apply, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once: true});
  else boot();
})();
