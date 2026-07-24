'use strict';
/* Second Brain OS V93 — assistant UX, finance wizard and visual consistency layer. */
(() => {
  const BUILD = 'V93 · PERSONAL ASSISTANT';
  const VERSION = 'second-brain-space-v93-personal-assistant-20260724-r1';
  const STORE_KEY = 'secondBrainOS.v1';
  const BACKUP_MARK = 'secondBrainOS.v93.backupCreated';
  const RAW_BACKUP = 'secondBrainOS.v93.rawLocalBackup';
  const DB_NAME = 'SecondBrainOSDurableStorage';
  const DB_STORE = 'records';
  const DAY = 86400000;

  let queued = false;
  let applying = false;
  let wizardStep = 1;
  let wizardOrigin = '';
  let syncInProgress = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
  const clone = value => {
    try { return structuredClone(value); }
    catch (_) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }
  };
  const num = value => {
    const parsed = Number(String(value ?? '').replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const money = value => `${Math.round(num(value)).toLocaleString('ru-RU')} ₽`;
  const today = () => new Date().toISOString().slice(0, 10);
  const now = () => new Date().toISOString();
  const state = () => window.state || window.SecondBrainApp?.getState?.() || {};
  const isDone = item => ['done', 'completed', 'complete', 'finished'].includes(String(item?.status || '').toLowerCase()) || item?.done === true;
  const activeDebts = () => (state().debts || []).filter(item => item && !['closed', 'paid', 'archived'].includes(String(item.status || '').toLowerCase()) && num(item.currentBalance ?? item.amount ?? item.balance) > 0);
  const ownAccounts = () => (state().financeAccounts || []).filter(item => item && item.active !== false && item.type !== 'credit_card' && item.includeAvailable !== false);
  const toast = message => {
    try {
      if (typeof window.toast === 'function') window.toast(message);
      else window.SecondBrainApp?.toast?.(message);
    } catch (_) {}
  };
  const render = () => {
    try {
      if (typeof window.renderPremium === 'function') window.renderPremium();
      else if (typeof window.V85Premium?.render === 'function') window.V85Premium.render();
      else window.SecondBrainApp?.render?.();
    } catch (error) { console.error('[V93 render]', error); }
  };
  const saveOnly = () => {
    try {
      if (typeof window.save === 'function') window.save();
      else localStorage.setItem(STORE_KEY, JSON.stringify(state()));
    } catch (error) { console.warn('[V93 save]', error); }
  };
  const persist = (message = '', shouldRender = true) => {
    saveOnly();
    if (shouldRender) render();
    if (message) toast(message);
  };
  const navigate = route => {
    try {
      if (typeof window.V85Premium?.navigate === 'function') window.V85Premium.navigate(route);
      else {
        window.location.hash = `#${route}`;
        render();
      }
    } catch (_) {
      window.location.hash = `#${route}`;
      render();
    }
  };

  function dbPut(key, value) {
    return new Promise(resolve => {
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
        };
        request.onerror = () => resolve(false);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(DB_STORE, 'readwrite');
          transaction.objectStore(DB_STORE).put(value, key);
          transaction.oncomplete = () => { db.close(); resolve(true); };
          transaction.onerror = () => { db.close(); resolve(false); };
        };
      } catch (_) { resolve(false); }
    });
  }

  async function createBackup() {
    try {
      if (localStorage.getItem(BACKUP_MARK)) return;
      const at = now();
      const raw = localStorage.getItem(STORE_KEY);
      if (raw && !localStorage.getItem(RAW_BACKUP)) localStorage.setItem(RAW_BACKUP, raw);
      const snapshot = clone(state());
      if (snapshot) {
        await dbPut(`backup:v93-before-personal-assistant:${at}`, {
          version: 93,
          createdAt: at,
          reason: 'automatic-before-v93-personal-assistant',
          state: snapshot
        });
      }
      localStorage.setItem(BACKUP_MARK, at);
    } catch (error) { console.warn('[V93 backup]', error); }
  }

  function ensureV93State() {
    const s = state();
    s.settings = s.settings || {};
    s.settings.v93 = s.settings.v93 || {};
    s.settings.v93.syncedGoalTasks = s.settings.v93.syncedGoalTasks || {};
    s.settings.v93.gameCollapsed = s.settings.v93.gameCollapsed || {
      skills: true,
      achievements: true,
      hpLog: true,
      automation: true
    };
    s.discipline = s.discipline || {};
    s.discipline.financeChecks = s.discipline.financeChecks || {};
    s.gameLife = s.gameLife || { xp: 0, coins: 0, logs: [], skillXp: {}, achievements: [], captures: [], rewards: [] };
    s.gameLife.logs = Array.isArray(s.gameLife.logs) ? s.gameLife.logs : [];
    s.gameLife.skillXp = s.gameLife.skillXp || {};
    s.financeAccounts = Array.isArray(s.financeAccounts) ? s.financeAccounts : [];
    s.financeReservations = Array.isArray(s.financeReservations) ? s.financeReservations : [];
    s.debts = Array.isArray(s.debts) ? s.debts : [];
    s.tasks = Array.isArray(s.tasks) ? s.tasks : [];
    s.goals = Array.isArray(s.goals) ? s.goals : [];
    s.habits = Array.isArray(s.habits) ? s.habits : [];
    s.habitWishlist = Array.isArray(s.habitWishlist) ? s.habitWishlist : [];

    if (!s.settings.v93.habitWishlistUnified) {
      s.settings.v93.nextWeekHabitIdeas = s.habitWishlist.map((item, index) => ({
        id: item.id,
        sourceId: item.id,
        title: item.title || item.name || 'Привычка',
        frequency: item.frequency || item.schedule || '',
        icon: item.icon || '✦',
        status: item.status || 'planned',
        order: index
      }));
      s.settings.v93.habitWishlistUnified = true;
      s.settings.v93.habitWishlistUnifiedAt = now();
      saveOnly();
    }
  }

  function currentRoute() {
    return String(window.location.hash || '#today').replace(/^#/, '').split('?')[0] || 'today';
  }

  function buildMark() {
    document.body.classList.add('sbos-v93-ready');
    document.body.dataset.sbosBuild = VERSION;
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', VERSION);
    const badge = document.querySelector('.v78-build');
    if (badge) badge.textContent = BUILD;
  }

  function financeGaps() {
    const s = state();
    const accountMissing = !ownAccounts().some(account => account.actualBalance !== null && account.actualBalance !== undefined && Number.isFinite(Number(account.actualBalance)));
    const income = s.settings?.v884?.income || {};
    const incomeMissing = !/^\d{4}-\d{2}-\d{2}$/.test(String(income.nextGuaranteedDate || ''));
    const debtRows = activeDebts();
    const debtMissing = debtRows.filter(item => !num(item.minimumPayment || item.minPayment) || !/^\d{4}-\d{2}-\d{2}$/.test(String(item.nextPaymentDate || item.due || '')));
    const missing = [];
    if (accountMissing) missing.push('фактический остаток хотя бы по одному собственному счёту');
    if (debtMissing.length) missing.push(`минимальные платежи и даты по ${debtMissing.length} ${debtMissing.length === 1 ? 'долгу' : 'долгам'}`);
    if (incomeMissing) missing.push('дату следующего гарантированного дохода');
    return { accountMissing, incomeMissing, debtMissing, missing };
  }

  function financeSummary() {
    const s = state();
    const own = ownAccounts().reduce((sum, account) => sum + num(account.actualBalance), 0);
    const reservations = (s.financeReservations || []).filter(item => item && item.active !== false && item.status !== 'completed').reduce((sum, item) => sum + num(item.amount), 0);
    const debts = activeDebts();
    const due = debts.reduce((sum, item) => sum + num(item.minimumPayment || item.minPayment), 0);
    const reserve = num(s.settings?.v884?.minimumReserve);
    const nearest = debts
      .map(item => item.nextPaymentDate || item.due || '')
      .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value))
      .sort()[0] || '';
    return { own, reservations, due, reserve, safe: own - reservations - due - reserve, nearest, debts };
  }

  function openModal(title, content, className = '') {
    const root = document.getElementById('modal');
    if (!root) return;
    if (root.parentElement !== document.body) document.body.appendChild(root);
    root.innerHTML = `<div class="modal-card sbos-v93-modal-card ${className}"><header class="sbos-v93-modal-head"><div><small>SECOND BRAIN OS</small><h2>${esc(title)}</h2></div><button type="button" data-v93-action="close-modal" aria-label="Закрыть">×</button></header>${content}</div>`;
    root.classList.add('show');
    root.style.display = 'flex';
    root.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('sbos-v93-modal-open');
    document.body.classList.add('sbos-v93-modal-open');
    requestAnimationFrame(() => root.querySelector('input,select,textarea,button')?.focus({ preventScroll: true }));
  }

  function closeModal() {
    const root = document.getElementById('modal');
    if (!root) return;
    root.classList.remove('show');
    root.style.display = '';
    root.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('sbos-v93-modal-open');
    document.body.classList.remove('sbos-v93-modal-open');
  }

  function wizardProgress() {
    return `<div class="sbos-v93-wizard-progress">${[1, 2, 3, 4].map(index => `<span class="${index === wizardStep ? 'active' : index < wizardStep ? 'done' : ''}"><i>${index < wizardStep ? '✓' : index}</i><b>${['Пояснение', 'Счета и долги', 'Доход', 'Результат'][index - 1]}</b></span>`).join('')}</div>`;
  }

  function debtWizardRows() {
    const rows = activeDebts();
    if (!rows.length) return `<div class="sbos-v93-empty-good"><b>Активных долгов не найдено</b><span>Этот шаг можно пропустить. Если долг существует, добавьте его в разделе «Долги».</span><button type="button" data-v93-action="route" data-route="debts">Открыть долги</button></div>`;
    return `<div class="sbos-v93-debt-wizard-list">${rows.map(item => {
      const id = esc(item.id || '');
      const creditor = esc(item.creditor || item.person || item.title || 'Долг');
      const balance = num(item.currentBalance ?? item.amount ?? item.balance);
      return `<article data-debt-id="${id}"><header><div><b>${creditor}</b><small>Остаток: ${money(balance)}</small></div><span class="${num(item.daysOverdue) > 0 ? 'danger' : ''}">${num(item.daysOverdue) > 0 ? `${num(item.daysOverdue)} дн. просрочки` : 'Активен'}</span></header><div><label><span>Минимальный платёж <em title="Сумма, которую нужно внести, чтобы не возникла новая просрочка">i</em></span><input data-v93-debt-min="${id}" type="number" min="0" step="1" value="${num(item.minimumPayment || item.minPayment) || ''}" placeholder="Например, 5 000"></label><label><span>Дата ближайшего платежа <em title="До этой даты платёж должен быть внесён">i</em></span><input data-v93-debt-date="${id}" type="date" value="${esc(item.nextPaymentDate || item.due || '')}"></label></div></article>`;
    }).join('')}</div>`;
  }

  function accountWizardRows() {
    const rows = ownAccounts();
    if (!rows.length) {
      return `<div class="sbos-v93-new-account"><label><span>Название счёта</span><input id="v93_new_account_name" value="Основная карта"></label><label><span>Фактический остаток <em title="Деньги, которыми вы реально располагаете сейчас, без кредитного лимита">i</em></span><input id="v93_new_account_balance" type="number" step="0.01" placeholder="Например, 45 000"></label></div>`;
    }
    return `<div class="sbos-v93-account-list">${rows.map(account => `<label><span>${esc(account.name || 'Счёт')} <small>${account.type === 'cash' ? 'наличные' : 'собственные деньги'}</small></span><input data-v93-account-balance="${esc(account.id || '')}" type="number" step="0.01" value="${account.actualBalance ?? ''}" placeholder="Укажите остаток"></label>`).join('')}</div>`;
  }

  function financeWizardHtml() {
    const gaps = financeGaps();
    const summary = financeSummary();
    const income = state().settings?.v884?.income || {};
    let body = '';
    if (wizardStep === 1) {
      body = `<section class="sbos-v93-wizard-intro"><span class="sbos-v93-time">≈ ${Math.max(2, gaps.missing.length * 2)} минуты</span><h3>Заполним только то, чего не хватает</h3><p>После заполнения приложение рассчитает безопасную сумму, ближайший платёж, резерв под обязательства и риск кассового разрыва.</p><div class="sbos-v93-gap-list">${gaps.missing.length ? gaps.missing.map(item => `<div><i>!</i><span>${esc(item)}</span></div>`).join('') : '<div class="ok"><i>✓</i><span>Критичные данные уже заполнены. Можно выполнить контрольную сверку.</span></div>'}</div><aside><b>Что сформируется</b><span>• безопасно потратить до следующего дохода</span><span>• сумма обязательных платежей</span><span>• ближайшая дата риска</span><span>• одно конкретное действие</span></aside></section>`;
    } else if (wizardStep === 2) {
      body = `<section class="sbos-v93-wizard-section"><header><span>Шаг 2</span><h3>Фактические деньги и обязательства</h3><p>Кредитный лимит не считается собственными деньгами. По долгам нужны минимальный платёж и ближайшая дата.</p></header><h4>Счета</h4>${accountWizardRows()}<h4>Долги</h4>${debtWizardRows()}<div id="v93_wizard_error" class="sbos-v93-inline-error" hidden></div></section>`;
    } else if (wizardStep === 3) {
      body = `<section class="sbos-v93-wizard-section"><header><span>Шаг 3</span><h3>Следующий гарантированный доход</h3><p>Дата нужна, чтобы ограничить горизонт расчёта и не считать будущие деньги доступными раньше времени.</p></header><div class="sbos-v93-income-grid"><label><span>Гарантированный доход</span><input id="v93_income_amount" type="number" min="0" value="${income.guaranteed ?? ''}" placeholder="Сумма"></label><label><span>Дата следующего поступления</span><input id="v93_income_date" type="date" value="${esc(income.nextGuaranteedDate || '')}"></label><label><span>Минимальный резерв</span><input id="v93_min_reserve" type="number" min="0" value="${num(state().settings?.v884?.minimumReserve) || ''}" placeholder="Например, 10 000"></label></div><div class="sbos-v93-help"><b>Минимальный резерв</b><span>Деньги, которые не участвуют в свободных тратах даже после оплаты ближайших обязательств.</span></div><div id="v93_wizard_error" class="sbos-v93-inline-error" hidden></div></section>`;
    } else {
      body = `<section class="sbos-v93-wizard-result"><span class="sbos-v93-result-icon">✓</span><h3>Финансовая картина сформирована</h3><p>Расчёт основан на фактических счетах, введённых платежах и ближайшем доходе.</p><div class="sbos-v93-result-grid"><article><small>Собственные деньги</small><b>${money(summary.own)}</b><span>без кредитных лимитов</span></article><article><small>Обязательные платежи</small><b>${money(summary.due)}</b><span>${summary.debts.length} активных долгов</span></article><article><small>Зарезервировано</small><b>${money(summary.reservations + summary.reserve)}</b><span>резервы и минимальная подушка</span></article><article class="primary"><small>Предварительно безопасно</small><b>${money(summary.safe)}</b><span>${summary.nearest ? `ближайший платёж ${new Date(`${summary.nearest}T12:00:00`).toLocaleDateString('ru-RU')}` : 'нет платежей с датой'}</span></article></div><div class="sbos-v93-next-action"><b>${summary.safe < 0 ? 'Следующее действие: сократить кассовый разрыв' : 'Следующее действие: зарезервировать ближайшие платежи'}</b><span>${summary.safe < 0 ? `Не хватает ${money(Math.abs(summary.safe))}. Откройте долги и определите, какой платёж можно согласовать.` : `Отложите ${money(summary.due)} под обязательства, чтобы свободная сумма оставалась честной.`}</span></div></section>`;
    }

    const prev = wizardStep > 1 ? '<button type="button" class="secondary" data-v93-action="wizard-prev">← Назад</button>' : '';
    const next = wizardStep < 4
      ? `<button type="button" class="primary" data-v93-action="wizard-next">${wizardStep === 1 ? 'Начать заполнение' : wizardStep === 3 ? 'Сформировать результат' : 'Сохранить и продолжить'} →</button>`
      : '<button type="button" class="primary" data-v93-action="wizard-finish">Завершить сверку</button>';
    return `${wizardProgress()}${body}<footer class="sbos-v93-wizard-actions">${prev}<button type="button" data-v93-action="close-modal">Закрыть</button>${next}</footer>`;
  }

  function openFinanceWizard(origin = '') {
    wizardOrigin = origin;
    wizardStep = 1;
    openModal('Финансовая сверка', financeWizardHtml(), 'sbos-v93-finance-wizard');
  }

  function redrawWizard() {
    const card = document.querySelector('#modal .sbos-v93-finance-wizard');
    if (!card) return openFinanceWizard(wizardOrigin);
    card.innerHTML = `<header class="sbos-v93-modal-head"><div><small>SECOND BRAIN OS</small><h2>Финансовая сверка</h2></div><button type="button" data-v93-action="close-modal" aria-label="Закрыть">×</button></header>${financeWizardHtml()}`;
    requestAnimationFrame(() => card.querySelector('input,button')?.focus({ preventScroll: true }));
  }

  function wizardError(message, selector = '') {
    const error = document.getElementById('v93_wizard_error');
    if (error) { error.hidden = false; error.textContent = message; }
    if (selector) document.querySelector(selector)?.focus();
    toast(message);
    return false;
  }

  function saveAccountsAndDebts() {
    const s = state();
    let hasBalance = false;
    const existing = [...document.querySelectorAll('[data-v93-account-balance]')];
    if (existing.length) {
      existing.forEach(input => {
        const account = s.financeAccounts.find(item => String(item.id) === String(input.dataset.v93AccountBalance));
        if (!account || input.value === '') return;
        account.actualBalance = num(input.value);
        account.calculatedBalance = account.actualBalance;
        account.reconciledAt = now();
        account.updatedAt = now();
        hasBalance = true;
      });
    } else {
      const balanceField = document.getElementById('v93_new_account_balance');
      if (balanceField?.value !== '') {
        const id = `v93-account-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        s.financeAccounts.unshift({
          id,
          name: document.getElementById('v93_new_account_name')?.value.trim() || 'Основная карта',
          type: 'bank_card',
          actualBalance: num(balanceField.value),
          calculatedBalance: num(balanceField.value),
          currency: 'RUB',
          includeAvailable: true,
          includeNetWorth: true,
          active: true,
          reconciledAt: now(),
          createdAt: now(),
          updatedAt: now()
        });
        hasBalance = true;
      }
    }
    if (!hasBalance && !ownAccounts().some(account => account.actualBalance !== null && account.actualBalance !== undefined)) {
      return wizardError('Укажите фактический остаток хотя бы по одному счёту.', '#v93_new_account_balance,[data-v93-account-balance]');
    }

    for (const debt of activeDebts()) {
      const id = String(debt.id || '');
      const minField = document.querySelector(`[data-v93-debt-min="${CSS.escape(id)}"]`);
      const dateField = document.querySelector(`[data-v93-debt-date="${CSS.escape(id)}"]`);
      if (!minField || !dateField) continue;
      if (!num(minField.value)) return wizardError(`Укажите минимальный платёж: ${debt.creditor || debt.person || 'долг'}.`, `[data-v93-debt-min="${CSS.escape(id)}"]`);
      if (!dateField.value) return wizardError(`Укажите ближайшую дату платежа: ${debt.creditor || debt.person || 'долг'}.`, `[data-v93-debt-date="${CSS.escape(id)}"]`);
      debt.minimumPayment = num(minField.value);
      debt.nextPaymentDate = dateField.value;
      debt.due = dateField.value;
      debt.lastInfoUpdate = now();
      debt.updatedAt = now();
    }
    s.settings.currentBalance = ownAccounts().reduce((sum, account) => sum + num(account.actualBalance), 0);
    s.settings.v93.lastAccountDebtWizardSave = now();
    saveOnly();
    return true;
  }

  function saveIncomeStep() {
    const s = state();
    const date = document.getElementById('v93_income_date')?.value || '';
    if (!date) return wizardError('Укажите дату следующего гарантированного дохода.', '#v93_income_date');
    s.settings.v884 = s.settings.v884 || {};
    s.settings.v884.income = s.settings.v884.income || {};
    const income = s.settings.v884.income;
    const amountField = document.getElementById('v93_income_amount');
    income.guaranteed = amountField?.value === '' ? null : num(amountField?.value);
    income.nextGuaranteedDate = date;
    s.settings.v884.minimumReserve = num(document.getElementById('v93_min_reserve')?.value);
    s.settings.v93.lastIncomeWizardSave = now();
    saveOnly();
    return true;
  }

  function award(source, xp, hp, skill, title) {
    try {
      if (typeof window.V85Premium?.awardGame === 'function') return window.V85Premium.awardGame(source, xp, hp, skill, { title });
      const s = state();
      if (s.gameLife.logs.some(log => log.source === source)) return false;
      s.gameLife.xp = num(s.gameLife.xp) + xp;
      s.gameLife.coins = num(s.gameLife.coins) + hp;
      s.gameLife.skillXp[skill] = num(s.gameLife.skillXp[skill]) + xp;
      s.gameLife.logs.unshift({ id: `v93-log-${Date.now()}`, source, date: today(), xp, coins: hp, skill, title, createdAt: now() });
      return true;
    } catch (error) { console.warn('[V93 award]', error); return false; }
  }

  function finishFinanceQuest(message = 'Финансовая сверка выполнена') {
    const s = state();
    s.discipline.financeChecks[today()] = true;
    s.settings.v93.financeLastReconciledAt = now();
    award(`finance-check:${today()}`, 5, 1, 'finance', 'Финансовая сверка');
    persist(message);
  }

  function financeQuestAction() {
    const gaps = financeGaps();
    if (gaps.missing.length) return openFinanceWizard('gamelife');
    finishFinanceQuest();
  }

  function syncCompletedGoalTasks() {
    if (syncInProgress) return;
    const s = state();
    let changed = false;
    for (const task of s.tasks) {
      if (!task?.id || !task.goalId || !isDone(task) || s.settings.v93.syncedGoalTasks[task.id]) continue;
      const goal = s.goals.find(item => String(item.id) === String(task.goalId));
      if (!goal) continue;
      const stage = (goal.stages || []).find(item => String(item.id) === String(task.stageId));
      if (stage && !stage.done) stage.done = true;
      goal.lastActivityAt = now();
      goal.updatedAt = now();
      goal.lastCompletedTaskId = task.id;
      s.settings.v93.syncedGoalTasks[task.id] = { goalId: goal.id, stageId: task.stageId || '', at: now() };
      award(`v93-linked-goal-task:${task.id}`, 8, 2, 'discipline', `Шаг цели: ${task.title || goal.title}`);
      changed = true;
    }
    if (changed) {
      syncInProgress = true;
      saveOnly();
      setTimeout(() => { syncInProgress = false; render(); }, 20);
    }
  }

  function translateGameLife() {
    const map = new Map([
      ['Awareness', 'Осознанность'], ['Discipline', 'Дисциплина'], ['Focus', 'Фокус'],
      ['Energy', 'Энергия'], ['Resilience', 'Устойчивость'], ['Finance', 'Финансовая устойчивость'],
      ['Health', 'Здоровье'], ['Social', 'Отношения'], ['Life simulator без обнуления прогресса', 'Игровая система без потери прогресса'],
      ['Утренний check-in', 'Утренняя сверка'], ['Сохранить check-in', 'Сохранить сверку']
    ]);
    document.querySelectorAll('.v83-game-page :is(h1,h2,h3,b,small,span,p,em)').forEach(node => {
      const text = node.textContent?.trim();
      if (map.has(text) && node.children.length === 0) node.textContent = map.get(text);
    });
  }

  function collapseGameCard(card, key, label) {
    if (!card || card.dataset.v93CollapseReady) return;
    card.dataset.v93CollapseReady = '1';
    card.dataset.v93CollapseKey = key;
    const header = card.querySelector(':scope > header');
    if (!header) return;
    let button = header.querySelector('[data-v93-action="toggle-game-card"]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'sbos-v93-collapse-button';
      button.dataset.v93Action = 'toggle-game-card';
      button.dataset.key = key;
      header.appendChild(button);
    }
    const collapsed = state().settings.v93.gameCollapsed[key] !== false;
    card.classList.toggle('sbos-v93-collapsed', collapsed);
    button.textContent = collapsed ? `Показать ${label}` : 'Свернуть';
    button.setAttribute('aria-expanded', String(!collapsed));
  }

  function decorateGameLife() {
    const page = document.querySelector('.v83-game-page');
    if (!page) return;
    translateGameLife();
    const financeButton = [...page.querySelectorAll('button')].find(button => /финансовая сверка/i.test(button.closest('article')?.textContent || ''));
    if (financeButton) {
      financeButton.dataset.v93Action = 'finance-check';
      financeButton.removeAttribute('data-v85-action');
      financeButton.removeAttribute('data-v83-action');
      financeButton.type = 'button';
    }

    const synced = state().settings.v93.syncedGoalTasks || {};
    page.querySelectorAll('.v83-quests article').forEach(article => {
      const title = article.querySelector('b')?.textContent || '';
      if (!/^Кампания:/i.test(title)) return;
      const goalName = title.replace(/^Кампания:\s*/i, '').trim();
      const goal = state().goals.find(item => String(item.title || '').trim() === goalName);
      const done = goal && Object.values(synced).some(item => String(item.goalId) === String(goal.id));
      if (!done) return;
      article.classList.add('done');
      article.querySelector('button')?.remove();
      if (!article.querySelector(':scope > strong')) article.insertAdjacentHTML('beforeend', '<strong>✓</strong>');
      const text = article.querySelector('small');
      if (text) text.textContent = 'Связанный физический шаг выполнен и отражён в кампании.';
    });

    collapseGameCard(page.querySelector('.v83-skills-card'), 'skills', 'характеристики');
    collapseGameCard(page.querySelector('.v85-achievements-card'), 'achievements', 'достижения');
    collapseGameCard(page.querySelector('.v83-log-card'), 'hpLog', 'журнал');
    collapseGameCard(page.querySelector('.v85-goal-automation-card'), 'automation', 'автоматизацию');
  }

  function decorateWishlist() {
    const nextWeek = document.querySelector('.v78-next-week');
    if (nextWeek) document.querySelectorAll('.v78-wishlist-card').forEach(card => card.remove());
    const habitsPage = document.querySelector('.v82-habits-page');
    if (habitsPage) {
      habitsPage.querySelectorAll('.v78-wishlist-card').forEach(card => {
        const title = card.querySelector('h2');
        const subtitle = card.querySelector('header p');
        const link = card.querySelector('.v78-link-button');
        if (title) title.textContent = 'Привычки на следующую неделю';
        if (subtitle) subtitle.textContent = 'Единый список без дублирования';
        if (link) link.textContent = 'Настроить следующую неделю →';
        card.classList.add('sbos-v93-next-week-card');
      });
    }
    if (currentRoute() === 'habit-wishlist') {
      document.querySelectorAll('.v78-content h1,.v78-content h2').forEach(node => {
        if (/вишлист привычек/i.test(node.textContent || '')) node.textContent = 'Привычки на следующую неделю';
      });
    }
  }

  function decorateBadge() {
    document.querySelectorAll('.v78-top-actions button em').forEach(badge => {
      badge.classList.add('sbos-v93-notification-badge');
      const value = num(badge.textContent);
      badge.textContent = value > 99 ? '99+' : String(value || badge.textContent || '');
      badge.setAttribute('aria-label', `${badge.textContent} новых подсказок`);
    });
  }

  function decoratePlusButtons() {
    document.querySelectorAll('button').forEach(button => {
      const text = (button.textContent || '').trim();
      if (text === '+' || text === '＋' || (text.length <= 2 && /[+＋]/.test(text))) button.classList.add('sbos-v93-plus-button');
    });
    const capture = document.querySelector('.v86-capture-fab');
    if (capture) {
      capture.classList.add('sbos-v93-capture-fab');
      capture.setAttribute('aria-label', 'Зафиксировать мысль, расход или задачу');
      capture.setAttribute('title', 'Зафиксировать мысль, расход или задачу');
    }
  }

  function decorateFolderCards() {
    document.querySelectorAll('.v78-folder-card').forEach(card => {
      card.classList.add('sbos-v93-folder-card');
      const copy = card.querySelector('.v78-folder-copy');
      if (copy) copy.setAttribute('title', copy.querySelector('small')?.textContent || '');
    });
    document.querySelectorAll('.v78-operation-folder button').forEach(button => {
      button.classList.add('sbos-v93-operation-tile');
      const label = button.querySelector('span')?.textContent || button.textContent;
      button.setAttribute('aria-label', label.trim());
    });
  }

  function decorateOperations() {
    const page = document.querySelector('.v78-operation-toolbar')?.closest('.v78-page');
    if (!page) return;
    page.classList.add('sbos-v93-operations-page');
    page.querySelectorAll('.v78-segment button').forEach(button => button.setAttribute('title', button.textContent.trim()));
  }

  function detailRows(type) {
    const s = state();
    if (type === 'balance') {
      const rows = (s.financeAccounts || []).filter(item => item && item.active !== false);
      return { title: 'Из чего состоит баланс', intro: 'Показываются фактические остатки. Кредитный лимит не считается собственными деньгами.', rows: rows.map(item => ({ title: item.name || 'Счёт', value: item.actualBalance === null || item.actualBalance === undefined ? 'Нет данных' : money(item.actualBalance), note: item.type === 'credit_card' ? `кредитная карта · долг ${money(item.creditDebt)}` : `обновлено ${item.reconciledAt ? new Date(item.reconciledAt).toLocaleString('ru-RU') : 'не сверялось'}` })), route: 'finance-accounts' };
    }
    if (type === 'obligations') {
      const rows = activeDebts();
      return { title: 'Из чего состоят обязательства', intro: 'Каждая сумма должна иметь источник, остаток, ближайший платёж и дату.', rows: rows.map(item => ({ title: item.creditor || item.person || 'Долг', value: money(item.currentBalance ?? item.amount), note: `${num(item.minimumPayment) ? `платёж ${money(item.minimumPayment)}` : 'минимальный платёж не заполнен'} · ${item.nextPaymentDate || item.due ? new Date(`${item.nextPaymentDate || item.due}T12:00:00`).toLocaleDateString('ru-RU') : 'дата не заполнена'}` })), route: 'debts' };
    }
    if (type === 'habits') {
      const key = today();
      const rows = (s.habits || []).filter(item => item && item.archived !== true).map(item => ({ title: item.name || 'Привычка', value: item.marks?.[key] ? 'Выполнено' : 'Не выполнено', note: item.target ? `${item.target} ${item.unit || ''}` : 'минимальная версия не указана' }));
      return { title: 'Привычки сегодня', intro: 'Список показывает, что уже закрыто и какое действие можно выполнить прямо сейчас.', rows, route: 'habits' };
    }
    const rows = [...document.querySelectorAll('.v82-coach-queue button')].map(button => ({ title: button.querySelector('b')?.textContent || 'Шаг', value: button.querySelector('strong')?.textContent || '', note: button.querySelector('em')?.textContent || '' }));
    return { title: 'Оставшиеся шаги', intro: 'Это конкретные действия текущего плана, а не абстрактный счётчик.', rows, route: 'coach' };
  }

  function openMetricDetail(type) {
    const data = detailRows(type);
    openModal(data.title, `<section class="sbos-v93-detail-modal"><p>${esc(data.intro)}</p><div>${data.rows.length ? data.rows.map(row => `<article><span><b>${esc(row.title)}</b><small>${esc(row.note)}</small></span><strong>${esc(row.value)}</strong></article>`).join('') : '<div class="sbos-v93-empty-good"><b>Записей пока нет</b><span>Добавьте данные, чтобы показатель стал прозрачным.</span></div>'}</div><footer><button type="button" data-v93-action="route" data-route="${esc(data.route)}">Открыть раздел →</button></footer></section>`);
  }

  function decorateCoach() {
    const row = document.querySelector('.v82-coach-page .v78-kpi-row');
    if (!row) return;
    ['balance', 'obligations', 'habits', 'steps'].forEach((type, index) => {
      const card = row.children[index];
      if (!card) return;
      card.classList.add('sbos-v93-clickable-kpi');
      card.dataset.v93Action = 'metric-detail';
      card.dataset.metric = type;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      if (!card.querySelector('.sbos-v93-more')) card.insertAdjacentHTML('beforeend', '<small class="sbos-v93-more">Подробнее →</small>');
    });
  }

  function insightForRoute(route) {
    const s = state();
    const gaps = financeGaps();
    const incompleteHabit = (s.habits || []).find(item => item && item.archived !== true && !item.marks?.[today()]);
    const overdue = (s.tasks || []).filter(item => item && !isDone(item) && item.date && item.date < today());
    const uncategorized = (s.operations || []).filter(item => item && item.type === 'expense' && (!item.category || item.needsCategoryReview));
    const staleGoal = (s.goals || []).find(item => item && item.status === 'active' && (!item.nextAction || (item.lastActivityAt && Date.now() - new Date(item.lastActivityAt).getTime() > 3 * DAY)));
    const routeData = (icon, title, text, target, label) => ({ icon, title, text, route: target, label });

    if (route === 'finance-operations') {
      if (uncategorized.length) return routeData('◇', `${uncategorized.length} операций требуют категории`, 'После назначения категории операция уйдёт из очереди разбора и попадёт в правильную аналитику.', 'review-queue', 'Разобрать одну');
      return routeData('▦', 'Операции распределены по типам', 'Используйте фильтры «Доходы», «Расходы» и «Переводы», чтобы быстро проверить движение денег.', 'finance-analytics', 'Открыть аналитику');
    }
    if (route === 'finance' || route.startsWith('finance-') || route === 'debts') {
      if (gaps.missing.length) return { icon: '₽', title: 'Финансовый расчёт пока неполный', text: `Не хватает: ${gaps.missing.join(', ')}. Заполнение займёт около ${Math.max(2, gaps.missing.length * 2)} минут.`, action: 'finance-wizard', label: 'Заполнить данные' };
      return routeData('✓', 'Финансовые данные готовы к сверке', 'Проверьте ближайший платёж и зарезервируйте сумму под обязательства.', 'finance-calendar', 'Открыть календарь платежей');
    }
    if (route === 'review-queue') {
      const count = uncategorized.length || Number(document.querySelector('.v78-side-nav [data-v78-route="review-queue"]')?.textContent.match(/\d+/)?.[0] || 0);
      return routeData('◇', count ? `Сегодня достаточно разобрать один элемент из ${count}` : 'Очередь разбора под контролем', count ? 'Не пытайтесь закрыть всё сразу: назначьте категорию одной записи и вернитесь к основному дню.' : 'Новых спорных записей нет. Следующая проверка появится автоматически.', count ? 'review-queue' : 'today', count ? 'Разобрать одну' : 'Вернуться к дню');
    }
    if (route === 'gamelife') {
      if (gaps.missing.length) return { icon: '₽', title: 'Сейчас важнее всего финансовая сверка', text: 'Она разблокирует честную безопасную сумму и завершит квест GameLife.', action: 'finance-wizard', label: 'Выполнить за несколько минут' };
      if (incompleteHabit) return routeData('✓', `Минимальный шаг: ${incompleteHabit.name}`, 'Не нужно выполнять идеальную версию. Начните с пяти минут, чтобы сохранить ритм.', `habit-${encodeURIComponent(incompleteHabit.id)}`, 'Открыть привычку');
      return routeData('✦', 'Квесты дня собраны', 'Сначала закройте один главный квест, затем переходите к дополнительным действиям.', 'gamelife', 'Посмотреть квесты');
    }
    if (route === 'goals' || route.startsWith('goal-')) {
      if (staleGoal) return routeData('🎯', 'Цель требует следующего физического шага', `${staleGoal.title}: сформулируйте действие, которое начинается с глагола и занимает 5–20 минут.`, `goal-${encodeURIComponent(staleGoal.id)}`, 'Открыть цель');
      return routeData('🎯', 'У каждой активной цели должен быть следующий шаг', 'Проверьте, что ближайшее действие можно выполнить за 5–20 минут и оно связано с задачей.', 'goals', 'Проверить цели');
    }
    if (route === 'habits' || route === 'habit-wishlist' || route.startsWith('habit-')) {
      if (incompleteHabit) return routeData('✓', `Сегодня осталась привычка «${incompleteHabit.name}»`, 'При низкой энергии уменьшите действие до пяти минут — это лучше, чем обнулить день.', `habit-${encodeURIComponent(incompleteHabit.id)}`, 'Сделать минимальную версию');
      return routeData('✓', 'Ритм привычек сохранён', 'Не добавляйте новое обязательство автоматически. Проверьте идеи только для следующей недели.', 'habit-wishlist', 'Открыть следующую неделю');
    }
    if (route === 'calendar') {
      if (overdue.length) return routeData('◷', `${overdue.length} просроченных задач`, 'Перенесите одну низкоприоритетную задачу или уменьшите её до физического шага на пять минут.', 'calendar', 'Разобрать календарь');
      return routeData('▦', 'Календарь показывает реальную загрузку', 'Проверьте свободные окна и не ставьте больше задач, чем помещается во времени.', 'calendar', 'Посмотреть день');
    }
    if (route === 'coach') return routeData('✦', 'Подсказчик ведёт по одному шагу', 'Нажмите на баланс, обязательства, привычки или оставшиеся шаги, чтобы увидеть источник показателя.', 'coach', 'Открыть первый шаг');
    if (route === 'information') {
      const inboxCount = (s.inbox || []).length;
      return routeData('i', inboxCount ? `${inboxCount} записей ожидают разбора` : 'Информация собрана по смысловым папкам', inboxCount ? 'Превратите одну входящую запись в задачу, заметку, идею или финансовое действие.' : 'Откройте папку, в которой давно не было обновлений, и проверьте актуальность контекста.', inboxCount ? 'inbox' : 'notes', inboxCount ? 'Разобрать одну' : 'Открыть заметки');
    }
    if (route === 'archive') return routeData('▣', 'Архив защищает от случайной потери', 'Проверьте последнюю резервную копию и восстановите запись только после просмотра её содержимого.', 'system', 'Проверить backup');
    if (route === 'system') return routeData('⚙', 'Проверьте качество базы', 'Обратите внимание на долги без дат, цели без следующего шага и записи без категории.', 'system', 'Открыть диагностику');
    if (route === 'people') return routeData('👥', 'Отношения требуют следующего контакта', 'Проверьте, у кого давно не было общения, есть обещание или приближается важная дата.', 'people', 'Открыть людей');
    if (route === 'polina') return routeData('♡', 'Сохраняйте только подтверждённые наблюдения', 'Прогнозные дни должны отличаться от фактических, а комментарии — оставаться деликатными и приватными.', 'polina', 'Открыть календарь');
    if (route === 'passwords') return routeData('🔒', 'Доступы должны оставаться защищёнными', 'Не показывайте пароль без явного действия и проверьте, что резервная копия данных актуальна.', 'passwords', 'Проверить хранилище');
    if (route === 'books') return routeData('📚', 'Следующая сессия чтения должна быть конкретной', 'Выберите одну книгу и запланируйте количество минут или страниц на ближайшую сессию.', 'books', 'Открыть библиотеку');
    if (route === 'notes') return routeData('📝', 'Заметка полезна, когда связана с решением', 'Закрепите важную запись или свяжите её с целью, задачей или человеком.', 'notes', 'Открыть заметки');
    if (route === 'ideas') return routeData('💡', 'У идеи должен быть первый проверяемый шаг', 'Выберите одну идею и сформулируйте действие, которое можно выполнить за 15 минут.', 'ideas', 'Открыть идеи');
    if (route === 'wishes') return routeData('♡', 'Желания можно связать с финансовым планом', 'Укажите цену, приоритет и сколько уже накоплено, чтобы желание стало достижимым.', 'wishes', 'Открыть желания');
    if (route === 'documents') return routeData('📄', 'Документы требуют сроков и напоминаний', 'Проверьте, есть ли у важных файлов дата окончания, тег и понятное название.', 'documents', 'Открыть документы');
    if (route === 'films') return routeData('🎬', 'Список просмотра лучше держать коротким', 'Выберите один фильм на ближайший просмотр вместо накопления большого списка.', 'films', 'Открыть фильмы');
    if (route === 'trips') return routeData('✈', 'Поездка работает как мини-проект', 'Проверьте бюджет, документы, билеты, жильё и один ближайший шаг подготовки.', 'trips', 'Открыть поездки');
    if (route === 'inbox') return routeData('📥', 'Разберите одну запись, а не всю очередь', 'Определите тип записи и сразу назначьте ей следующий раздел или действие.', 'inbox', 'Разобрать входящие');
    if (route === 'profile') return routeData('●', 'Профиль задаёт персональный контекст', 'Проверьте основные направления и приоритеты, чтобы подсказки оставались актуальными.', 'profile', 'Открыть профиль');
    if (route === 'today') {
      if (gaps.missing.length) return { icon: '₽', title: 'Что сейчас важнее всего: заполнить финансовые данные', text: 'После этого появится безопасная сумма и понятный ближайший платёж.', action: 'finance-wizard', label: 'Начать' };
      if (overdue.length) return routeData('◷', 'Что сейчас важнее всего: одна просроченная задача', 'Не разбирайте весь список. Выберите одну и уменьшите до действия на пять минут.', 'calendar', 'Открыть задачи');
      if (incompleteHabit) return routeData('✓', `Что сейчас важнее всего: ${incompleteHabit.name}`, 'Минимальная версия сохранит ритм дня и снимет лишнее давление.', `habit-${encodeURIComponent(incompleteHabit.id)}`, 'Открыть');
      return routeData('✦', 'Сегодня достаточно одного главного действия', 'Выберите один квест, завершите его и только затем добавляйте новые обязательства.', 'gamelife', 'Открыть GameLife');
    }
    return routeData('✦', 'Следующий шаг должен быть понятным', 'Откройте текущую запись и сформулируйте одно физическое действие на 5–20 минут.', 'today', 'Вернуться к дню');
  }

  function decorateContextAssistant() {
    const root = document.querySelector('.v78-content');
    const page = root?.querySelector(':scope > .v78-page, :scope > .v78-dashboard');
    if (!root || !page || root.querySelector(':scope > .sbos-v93-context-assistant') || page.querySelector(':scope > .sbos-v93-context-assistant')) return;
    const insight = insightForRoute(currentRoute());
    if (!insight) return;
    const card = document.createElement('section');
    card.className = 'sbos-v93-context-assistant';
    card.innerHTML = `<i>${esc(insight.icon)}</i><div><small>ПЕРСОНАЛЬНЫЙ ПОМОЩНИК</small><h2>${esc(insight.title)}</h2><p>${esc(insight.text)}</p></div><button type="button" ${insight.action ? `data-v93-action="${esc(insight.action)}"` : `data-v93-action="route" data-route="${esc(insight.route)}"`}>${esc(insight.label)} →</button>`;
    if (currentRoute() === 'today') page.insertAdjacentElement('beforebegin', card);
    else {
      const header = page.querySelector(':scope > .v78-page-head, :scope > .v78-topbar') || page.firstElementChild;
      header?.insertAdjacentElement('afterend', card);
    }
  }

  function decorateFinance() {
    const page = document.querySelector('.v884-finance-page');
    if (!page) return;
    const gaps = financeGaps();
    const safeCard = page.querySelector('.v884-safe-card.missing');
    if (safeCard) {
      const button = safeCard.querySelector('button');
      if (button) {
        button.dataset.v93Action = 'finance-wizard';
        button.removeAttribute('data-v884-action');
        button.textContent = 'Заполнить по шагам';
      }
      const missing = safeCard.querySelector('.v884-missing');
      if (missing && !missing.querySelector('.sbos-v93-missing-explain')) {
        missing.insertAdjacentHTML('beforeend', `<div class="sbos-v93-missing-explain"><b>После заполнения появится:</b><span>безопасная сумма до следующего дохода · ближайший платёж · риск кассового разрыва · одно действие</span><em>Около ${Math.max(2, gaps.missing.length * 2)} минут</em></div>`);
      }
    }
    const action = page.querySelector('.v884-action-now button');
    if (action) {
      action.dataset.v93Action = 'finance-wizard';
      action.removeAttribute('data-v78-route');
      action.textContent = 'Выполнить по шагам';
    }
  }

  function decorateSystemQuality() {
    const page = document.querySelector('.v8612-system-grid')?.closest('.v78-page');
    if (!page || page.querySelector('.sbos-v93-quality-card')) return;
    const s = state();
    const counts = {
      operations: (s.operations || []).filter(item => item && item.type === 'expense' && (!item.category || item.needsCategoryReview)).length,
      goals: (s.goals || []).filter(item => item && item.status === 'active' && !item.nextAction).length,
      debts: activeDebts().filter(item => !item.minimumPayment || !(item.nextPaymentDate || item.due)).length,
      habits: (s.habits || []).filter(item => item && item.archived !== true && !(s.goals || []).some(goal => (goal.habitIds || []).includes(item.id))).length,
      overdue: (s.tasks || []).filter(item => item && !isDone(item) && item.date && item.date < today()).length
    };
    const backupAt = (() => { try { return localStorage.getItem(BACKUP_MARK); } catch (_) { return ''; } })();
    page.insertAdjacentHTML('beforeend', `<section class="sbos-v93-quality-card"><header><div><small>КАЧЕСТВО СИСТЕМЫ</small><h2>Где базе не хватает ясности</h2><p>Показатели помогают контролировать не только задачи, но и качество самого Second Brain.</p></div></header><div><article><b>${counts.operations}</b><span>операций без категории</span></article><article><b>${counts.goals}</b><span>целей без следующего шага</span></article><article><b>${counts.debts}</b><span>долгов без даты или платежа</span></article><article><b>${counts.habits}</b><span>привычек без связи с целью</span></article><article><b>${counts.overdue}</b><span>просроченных задач</span></article><article><b>${backupAt ? new Date(backupAt).toLocaleDateString('ru-RU') : '—'}</b><span>последний backup V93</span></article></div></section>`);
  }

  function decorateRoundedSurfaces() {
    document.querySelectorAll('.v78-card,.v78-folder-panel,.v83-player-hero,.v884-panel,.v884-safe-card,.v82-coach-hero,.v78-operation-table,.v78-info-folder,.v78-finance-folder').forEach(element => element.classList.add('sbos-v93-surface'));
  }

  function toggleGameCard(button) {
    const card = button.closest('[data-v93-collapse-key]');
    if (!card) return;
    const key = button.dataset.key;
    const nextCollapsed = !card.classList.contains('sbos-v93-collapsed');
    state().settings.v93.gameCollapsed[key] = nextCollapsed;
    card.classList.toggle('sbos-v93-collapsed', nextCollapsed);
    button.textContent = nextCollapsed ? `Показать ${key === 'hpLog' ? 'журнал' : key === 'skills' ? 'характеристики' : key === 'achievements' ? 'достижения' : 'автоматизацию'}` : 'Свернуть';
    button.setAttribute('aria-expanded', String(!nextCollapsed));
    saveOnly();
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      ensureV93State();
      buildMark();
      syncCompletedGoalTasks();
      decorateBadge();
      decoratePlusButtons();
      decorateFolderCards();
      decorateWishlist();
      decorateOperations();
      decorateGameLife();
      decorateCoach();
      decorateFinance();
      decorateContextAssistant();
      decorateSystemQuality();
      decorateRoundedSurfaces();
    } catch (error) { console.error('[V93 apply]', error); }
    finally { applying = false; }
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }

  document.addEventListener('click', event => {
    const control = event.target.closest?.('[data-v93-action]');
    if (!control) return;
    const action = control.dataset.v93Action;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (action === 'close-modal') return closeModal();
    if (action === 'route') { closeModal(); return navigate(control.dataset.route || 'today'); }
    if (action === 'finance-wizard') return openFinanceWizard(currentRoute());
    if (action === 'finance-check') return financeQuestAction();
    if (action === 'metric-detail') return openMetricDetail(control.dataset.metric || 'steps');
    if (action === 'toggle-game-card') return toggleGameCard(control);
    if (action === 'wizard-prev') { wizardStep = Math.max(1, wizardStep - 1); return redrawWizard(); }
    if (action === 'wizard-next') {
      if (wizardStep === 2 && !saveAccountsAndDebts()) return;
      if (wizardStep === 3 && !saveIncomeStep()) return;
      wizardStep = Math.min(4, wizardStep + 1);
      return redrawWizard();
    }
    if (action === 'wizard-finish') {
      closeModal();
      finishFinanceQuest('Финансовая сверка завершена. Отчёт обновлён.');
      if (wizardOrigin === 'gamelife') setTimeout(() => navigate('gamelife'), 30);
    }
  }, true);

  document.addEventListener('keydown', event => {
    const card = event.target.closest?.('[data-v93-action="metric-detail"]');
    if (card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openMetricDetail(card.dataset.metric || 'steps');
      return;
    }
    if (event.key === 'Escape' && document.getElementById('modal')?.classList.contains('show')) closeModal();
  }, true);

  document.addEventListener('click', event => {
    const financeQuest = event.target.closest?.('[data-v85-action="finance-check"],[data-v83-action="finance-check"]');
    if (!financeQuest) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    financeQuestAction();
  }, true);

  const observer = new MutationObserver(queueApply);
  function boot() {
    ensureV93State();
    createBackup();
    apply();
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    setTimeout(apply, 80);
    setTimeout(apply, 400);
    setTimeout(buildMark, 700);
    setTimeout(buildMark, 1400);
    setTimeout(createBackup, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.SecondBrainV93 = {
    apply,
    backup: createBackup,
    openFinanceWizard,
    financeGaps,
    financeSummary,
    syncCompletedGoalTasks,
    version: VERSION
  };
})();
