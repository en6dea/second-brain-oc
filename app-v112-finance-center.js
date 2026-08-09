/* Second Brain OS V112 — connected finance center. */
'use strict';

((root) => {
  const VERSION = '112.0.0';
  const ROUTES = [
    ['finance', 'wallet', 'Сегодня'],
    ['finance-accounts', 'accounts', 'Счета и резервы'],
    ['finance-planning', 'calendar', 'План'],
    ['finance-operations', 'receipt', 'Операции'],
    ['debts', 'shield', 'Долги'],
    ['finance-calendar', 'flow', 'Календарь'],
    ['finance-weekly', 'review', 'Разбор недели']
  ];
  const OWN_TYPES = new Set(['cash', 'bank_card', 'deposit', 'savings', 'other']);
  const coreCalculate = root.V884Finance?.calculate?.bind(root.V884Finance);
  let scheduled = false;

  const stateNow = () => root.SecondBrainApp?.getState?.() || root.state || null;
  const rows = (state, key) => Array.isArray(state?.[key]) ? state[key] : [];
  const clean = value => String(value ?? '').trim();
  const num = value => {
    const parsed = Number(String(value ?? '').replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const hasNumber = value => value !== null && value !== undefined && clean(value) !== '' && Number.isFinite(Number(String(value).replace(/\s/g, '').replace(',', '.')));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const money = value => `${num(value).toLocaleString('ru-RU', {maximumFractionDigits: 2})} ₽`;
  const routeNow = () => decodeURIComponent((location.hash || '#today').replace(/^#/, '').split('?')[0] || 'today');
  const nowIso = () => new Date().toISOString();
  const uid = () => root.crypto?.randomUUID?.() || `v112-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const today = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const monthNow = () => today().slice(0, 7);

  const ICONS = {
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v11H6.5A2.5 2.5 0 0 1 4 15.5z"/><path d="M4 9h14"/><path d="M16 12h4v3h-4a1.5 1.5 0 0 1 0-3Z"/>',
    accounts: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M7 9h10M8 14h3M15 14h1"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17M8 14h3M8 17h6"/>',
    receipt: '<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    shield: '<path d="M12 3 20 6v5c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6z"/><path d="M9 12h6M12 9v6"/>',
    flow: '<path d="M4 7h12M13 4l3 3-3 3M20 17H8M11 14l-3 3 3 3"/>',
    review: '<path d="M6 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 9h8M8 13h5M8 17h7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>'
  };
  const icon = (name, label = '') => `<svg class="v112-line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>${ICONS[name] || ICONS.info}</svg>`;

  function calculate() {
    if (coreCalculate) return coreCalculate();
    const state = stateNow();
    if (!state) return null;
    const accounts = rows(state, 'financeAccounts').filter(account => account?.active !== false && OWN_TYPES.has(clean(account.type)) && account.includeAvailable !== false && hasNumber(account.actualBalance));
    const own = accounts.length ? accounts.reduce((sum, account) => sum + num(account.actualBalance), 0) : null;
    const reservations = rows(state, 'financeReservations').filter(item => item && item.active !== false && !['completed', 'cancelled'].includes(clean(item.status)));
    const reserved = reservations.reduce((sum, item) => sum + Math.max(0, num(item.amount)), 0);
    const reserve = Math.max(0, num(state.settings?.v884?.minimumReserve));
    return {status: own === null ? 'missing' : 'ok', own, reserved, reserve, obligations: [], obligationTotal: 0, obligationGross: 0, linkedCoverage: 0, free: own === null ? null : own - reserved - reserve, todayAvailable: own === null ? null : Math.max(0, own - reserved - reserve), missing: own === null ? ['фактический остаток хотя бы по одному собственному счёту'] : [], stale: []};
  }

  function navigate(route) {
    if (root.V85Premium?.navigate) return root.V85Premium.navigate(route);
    location.hash = route;
  }

  function financeNav(route) {
    return `<nav class="v884-finance-nav v112-finance-nav" aria-label="Разделы финансов">${ROUTES.map(([target, iconName, label]) => `<button class="${target === route ? 'active' : ''}" data-v78-route="${target}" type="button">${icon(iconName)}<span>${label}</span></button>`).join('')}</nav>`;
  }

  function ensureNav(route) {
    if (!ROUTES.some(([target]) => target === route)) return;
    const page = document.querySelector('#app .v78-page');
    if (!page) return;
    const existing = page.querySelector(':scope > .v884-finance-nav');
    if (existing) {
      existing.classList.add('v112-finance-nav');
      [...existing.querySelectorAll('button')].forEach((button, index) => {
        const [target, iconName] = ROUTES[index] || [];
        button.classList.toggle('active', target === route);
        if (!button.querySelector('.v112-line-icon')) button.insertAdjacentHTML('afterbegin', icon(iconName || 'wallet'));
      });
      return;
    }
    const header = page.querySelector(':scope > .v78-page-head');
    if (header) header.insertAdjacentHTML('afterend', financeNav(route));
  }

  function ensureLogicStrip(route) {
    if (!['finance-planning', 'finance-operations'].includes(route)) return;
    const page = document.querySelector('#app .v78-page');
    const nav = page?.querySelector(':scope > .v884-finance-nav');
    if (!page || !nav || page.querySelector(':scope > .v112-finance-logic')) return;
    const planning = route === 'finance-planning';
    nav.insertAdjacentHTML('afterend', `<section class="v112-finance-logic" aria-label="Связь финансовых данных"><span class="v112-icon-box">${icon('link')}</span><div><b>${planning ? 'План — это намерение, а не списание денег' : 'Операция — это подтверждённый факт'}</b><p>${planning ? 'Дата и сумма попадают в календарь денежного потока. После оплаты нажмите «Провести»: только тогда расход появится в операциях и аналитике.' : 'Категория направляет запись в аналитику. Перевод между своими счетами остаётся нейтральным и не увеличивает расходы.'}</p></div><button data-v78-route="${planning ? 'finance-calendar' : 'finance-analytics'}" type="button">${planning ? 'Открыть календарь' : 'Открыть аналитику'} ${icon('arrow')}</button></section>`);
  }

  function setUnknown(article, value, note) {
    if (!article) return;
    article.classList.add('v112-unknown');
    const strong = article.querySelector('b, strong');
    const caption = article.querySelector('span');
    if (strong) strong.textContent = value;
    if (caption && note) caption.textContent = note;
  }

  function monthConfigured(period) {
    const raw = stateNow()?.financeMonthBudgets?.[period];
    if (!raw) return false;
    const limits = raw.categoryLimits && typeof raw.categoryLimits === 'object' ? Object.values(raw.categoryLimits) : [];
    return num(raw.expectedIncome) > 0 || num(raw.reserveTarget) > 0 || Boolean(clean(raw.note)) || limits.some(value => num(value) > 0);
  }

  function decoratePlanningUnknown(route) {
    if (route !== 'finance-planning') return;
    const period = document.querySelector('[data-v869-plan-month]')?.value || monthNow();
    if (monthConfigured(period)) return;
    const incomeCards = [...document.querySelectorAll('.v8611-month-income-grid > article')];
    setUnknown(incomeCards[0], 'Нет данных', 'сначала укажите ожидаемый доход');
    setUnknown(incomeCards[2], 'Не задан', 'сумма резерва ещё не выбрана');
    setUnknown(incomeCards[3], 'Не рассчитано', 'появится после настройки месяца');
    const allocation = document.querySelector('.v8611-month-allocation');
    if (allocation) {
      const title = allocation.querySelector('header h2');
      const description = allocation.querySelector('header p');
      if (title) title.textContent = 'Не рассчитано';
      if (description) description.textContent = 'Укажите доход и резерв — после этого лимиты будут объяснимыми.';
      const firstRow = allocation.querySelector('.v8611-allocation-row');
      if (firstRow) setUnknown(firstRow, 'Нет данных');
      const auto = allocation.querySelector('[data-v8611-action="auto-allocate-limits"]');
      if (auto) {
        auto.disabled = true;
        auto.title = 'Сначала укажите ожидаемый доход и резерв';
      }
    }
    document.querySelectorAll('.v8611-plan-budget-summary > article').forEach(article => {
      const label = clean(article.querySelector('small')?.textContent).toLowerCase();
      if (label.includes('бюджет') || label.includes('нераспредел')) setUnknown(article, 'Нет данных', 'до настройки месяца');
    });
  }

  function decorateAccountUnknown(route, calc) {
    if (route !== 'finance-accounts' || !calc || calc.own !== null) return;
    const cards = [...document.querySelectorAll('.v884-kpis > article')];
    setUnknown(cards[0], 'Нет данных', 'введите фактический остаток');
    setUnknown(cards[2], 'Не рассчитано', 'нужен хотя бы один остаток');
    setUnknown(cards[4], 'Не рассчитано', 'нужны собственные деньги и долги');
  }

  function decorateMainFinance(route, calc) {
    if (route !== 'finance' || !calc) return;
    const safeCard = document.querySelector('.v884-safe-card');
    const header = safeCard?.querySelector(':scope > header');
    if (header && !header.querySelector('[data-v112-action="explain-finance"]')) {
      header.insertAdjacentHTML('beforeend', `<button class="v112-source-button" data-v112-action="explain-finance" type="button">${icon('info')}<span>Как посчитано</span></button>`);
    }
    const cards = [...document.querySelectorAll('.v884-kpis > article')];
    cards.forEach((card, index) => {
      if (card.querySelector('[data-v112-action="explain-finance"]')) return;
      card.insertAdjacentHTML('beforeend', `<button class="v112-kpi-source" data-v112-action="explain-finance" data-kind="${index}" type="button" aria-label="Показать источник показателя">${icon('info')}<span>Источник</span></button>`);
    });
    if (calc.own === null) setUnknown(cards[2], 'Не рассчитано', 'нужны остатки и обязательства');
  }

  function showModal(title, html, wide = false) {
    const modal = document.getElementById('modal');
    if (!modal) return;
    const titleNode = modal.querySelector('#modalTitle');
    const body = modal.querySelector('#modalBody');
    if (titleNode) titleNode.textContent = title;
    if (body) body.innerHTML = html;
    modal.querySelector('.modal-card')?.classList.toggle('v112-finance-modal', true);
    modal.querySelector('.modal-card')?.classList.toggle('v112-finance-modal-wide', wide);
    modal.classList.add('show');
    document.body.classList.add('v107-modal-open');
    setTimeout(() => modal.querySelector('input, select, textarea, button')?.focus?.({preventScroll: true}), 20);
  }

  function closeModal() {
    const modal = document.getElementById('modal');
    modal?.classList.remove('show');
    document.body.classList.remove('v107-modal-open');
  }

  function explanationHtml(calc) {
    const state = stateNow();
    const accounts = rows(state, 'financeAccounts').filter(account => account?.active !== false && OWN_TYPES.has(clean(account.type)) && account.includeAvailable !== false && hasNumber(account.actualBalance));
    const credit = rows(state, 'financeAccounts').filter(account => account?.active !== false && clean(account.type) === 'credit_card').reduce((sum, account) => sum + Math.max(0, num(account.creditLimit) - num(account.creditDebt)), 0);
    const reservations = rows(state, 'financeReservations').filter(item => item && item.active !== false && !['completed', 'cancelled'].includes(clean(item.status)));
    const obligations = Array.isArray(calc.obligations) ? calc.obligations : [];
    const formula = calc.status === 'missing'
      ? `<div class="v112-finance-missing"><b>Расчёт пока не выполняется</b><p>${(calc.missing || ['Не хватает обязательных данных.']).map(esc).join('; ')}.</p></div>`
      : `<div class="v112-finance-formula"><span><small>Собственные деньги</small><b>${money(calc.own)}</b></span><i>−</i><span><small>Резервы</small><b>${money(calc.reserved)}</b></span><i>−</i><span><small>Непокрытые платежи</small><b>${money(calc.obligationTotal)}</b></span><i>−</i><span><small>Минимальная подушка</small><b>${money(calc.reserve)}</b></span><i>=</i><span class="result"><small>Свободный остаток</small><b>${money(calc.free)}</b></span></div>`;
    return `<section class="v112-finance-explanation">${formula}<div class="v112-source-grid"><article><header>${icon('accounts')}<div><b>Собственные счета</b><small>Кредитные лимиты сюда не входят</small></div></header>${accounts.length ? accounts.map(account => `<p><span>${esc(account.name || 'Счёт')}</span><b>${money(account.actualBalance)}</b></p>`).join('') : '<p class="empty">Фактические остатки не указаны.</p>'}<footer><span>Кредитные средства отдельно</span><b>${money(credit)}</b></footer></article><article><header>${icon('shield')}<div><b>Резервы</b><small>Деньги остаются на счетах, но недоступны для трат</small></div></header>${reservations.length ? reservations.map(item => `<p><span>${esc(item.title || 'Резерв')}${item.sourceId ? ' · связан' : ''}</span><b>${money(item.amount)}</b></p>`).join('') : '<p class="empty">Активных резервов нет.</p>'}<footer><span>Всего зарезервировано</span><b>${money(calc.reserved)}</b></footer></article><article><header>${icon('calendar')}<div><b>Платежи до дохода</b><small>Планы, долги и обязательные покупки</small></div></header>${obligations.length ? obligations.map(item => `<p><span>${esc(item.title || 'Платёж')}<small>${esc(item.date || '')}</small></span><b>${money(item.amount)}</b></p>`).join('') : '<p class="empty">Платежей на горизонте расчёта нет.</p>'}<footer><span>Покрыто связанными резервами</span><b>${money(calc.linkedCoverage || 0)}</b></footer></article></div><div class="v112-modal-note">${icon('info')}<p><b>Почему сумма честная:</b> связанный резерв вычитается один раз. План становится фактическим расходом только после действия «Провести».</p></div><div class="v79-modal-actions"><button class="v78-primary" data-v78-route="finance-accounts" type="button">Проверить счета и резервы</button><button data-v78-action="close-modal" type="button">Закрыть</button></div></section>`;
  }

  function explainFinance() {
    const calc = calculate();
    if (calc) showModal('Из чего складывается сумма', explanationHtml(calc), true);
  }

  function categoryOptions(selected = '') {
    const state = stateNow();
    const categories = rows(state, 'financeCategories').filter(item => item?.active !== false && clean(item.type) === 'expense');
    const names = [...new Set(categories.map(item => clean(item.name)).filter(Boolean))];
    if (!names.length) names.push('Другое');
    return names.map(name => `<option value="${esc(name)}" ${name === selected ? 'selected' : ''}>${esc(name)}</option>`).join('');
  }

  function openDeferredPlan(id) {
    const item = rows(stateNow(), 'deferredPurchases').find(row => clean(row?.id) === clean(id));
    if (!item) return;
    const date = new Date();
    const day = date.getDate();
    showModal('Добавить покупку в финансовый план', `<section class="v112-deferred-plan"><div class="v112-modal-note">${icon('calendar')}<p><b>Это ещё не покупка.</b> Сумма попадёт в план и календарь. В операции она перейдёт только после фактической оплаты.</p></div><div class="v79-form-grid"><label class="v79-field span-2"><span>Название</span><input id="v112_deferred_title" value="${esc(item.title || '')}"></label><label class="v79-field"><span>Сумма</span><input id="v112_deferred_amount" type="number" min="0" step="0.01" value="${num(item.amount) || ''}"></label><label class="v79-field"><span>Категория</span><select id="v112_deferred_category">${categoryOptions()}</select></label><label class="v79-field"><span>Месяц</span><input id="v112_deferred_month" type="month" value="${monthNow()}"></label><label class="v79-field"><span>День оплаты</span><input id="v112_deferred_day" type="number" min="1" max="31" value="${day}"></label><label class="v79-field span-2"><span>Характер расхода</span><select id="v112_deferred_class"><option value="optional">Необязательный — можно перенести</option><option value="mandatory">Обязательный — нельзя безопасно пропустить</option></select></label></div><div class="v79-modal-actions"><button class="v78-primary" data-v112-action="save-deferred-plan" data-id="${esc(id)}" type="button">Добавить в план</button><button data-v78-action="close-modal" type="button">Отмена</button></div></section>`);
  }

  function saveDeferredPlan(id) {
    const state = stateNow();
    const deferred = rows(state, 'deferredPurchases').find(row => clean(row?.id) === clean(id));
    if (!state || !deferred) return;
    const title = clean(document.getElementById('v112_deferred_title')?.value);
    const amount = Math.max(0, num(document.getElementById('v112_deferred_amount')?.value));
    const month = clean(document.getElementById('v112_deferred_month')?.value);
    const category = clean(document.getElementById('v112_deferred_category')?.value);
    const dueDay = Math.min(31, Math.max(1, Math.floor(num(document.getElementById('v112_deferred_day')?.value) || 1)));
    const expenseClass = clean(document.getElementById('v112_deferred_class')?.value) === 'mandatory' ? 'mandatory' : 'optional';
    if (!title) return root.SecondBrainApp?.toast?.('Введите название покупки');
    if (!amount) return root.SecondBrainApp?.toast?.('Укажите сумму больше нуля');
    if (!/^\d{4}-\d{2}$/.test(month)) return root.SecondBrainApp?.toast?.('Выберите месяц');
    const stamp = nowIso();
    const plan = {id: uid(), title, month, dueDay, amount, category: category || 'Другое', expenseClass, note: `Добавлено после паузы на решение${deferred.note ? ` · ${clean(deferred.note)}` : ''}`, status: 'planned', sourceDeferredId: deferred.id, createdAt: stamp, updatedAt: stamp};
    state.financePlans = rows(state, 'financePlans');
    state.financePlans.unshift(plan);
    deferred.status = 'planned';
    deferred.financePlanId = plan.id;
    deferred.resolvedAt = stamp;
    deferred.updatedAt = stamp;
    state.settings = state.settings || {};
    state.settings.v869 = Object.assign({}, state.settings.v869 || {}, {planMonth: month});
    root.save?.();
    closeModal();
    root.SecondBrainApp?.toast?.('Покупка добавлена в план. Деньги ещё не списаны.');
    navigate('finance-planning');
  }

  function confirmPostedPlan(id) {
    const state = stateNow();
    const plan = rows(state, 'financePlans').find(item => clean(item?.id) === clean(id));
    if (!state || !plan || clean(plan.status) !== 'planned') return;
    const date = clean(document.getElementById('v112_post_date')?.value);
    const amount = Math.max(0, num(document.getElementById('v112_post_amount')?.value));
    const accountId = clean(document.getElementById('v112_post_account')?.value);
    const account = rows(state, 'financeAccounts').find(item => clean(item?.id) === accountId);
    const note = clean(document.getElementById('v112_post_note')?.value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return root.SecondBrainApp?.toast?.('Укажите фактическую дату');
    if (!amount) return root.SecondBrainApp?.toast?.('Укажите фактическую сумму');
    if (!account || !hasNumber(account.actualBalance)) return root.SecondBrainApp?.toast?.('Выберите собственный счёт');
    const stamp = nowIso();
    const operation = {id: uid(), date, type: 'expense', amount, category: clean(plan.category) || 'Другое', expenseClass: clean(plan.expenseClass) === 'mandatory' ? 'mandatory' : 'optional', account: clean(account.name), accountId: account.id, incomeSource: '', note: note || `По плану: ${clean(plan.title)}`, planId: plan.id, createdAt: stamp, updatedAt: stamp};
    state.operations = rows(state, 'operations');
    state.operations.unshift(operation);
    account.actualBalance = num(account.actualBalance) - amount;
    account.calculatedBalance = account.actualBalance;
    account.updatedAt = stamp;
    plan.status = 'paid';
    plan.actualAmount = amount;
    plan.actualOperationId = operation.id;
    plan.updatedAt = stamp;
    rows(state, 'financeReservations').filter(reservation => reservation && reservation.active !== false && clean(reservation.sourceType) === 'plan' && clean(reservation.sourceId) === clean(plan.id)).forEach(reservation => {
      reservation.status = 'completed';
      reservation.active = false;
      reservation.completedAt = stamp;
      reservation.updatedAt = stamp;
    });
    const ownAccounts = rows(state, 'financeAccounts').filter(item => item?.active !== false && OWN_TYPES.has(clean(item.type)) && item.includeAvailable !== false && hasNumber(item.actualBalance));
    state.settings = state.settings || {};
    if (ownAccounts.length) state.settings.currentBalance = ownAccounts.reduce((sum, item) => sum + num(item.actualBalance), 0);
    root.save?.();
    closeModal();
    root.V85Premium?.render?.();
    root.SecondBrainApp?.toast?.('Расход списан со счёта, операция и связанный резерв обновлены');
  }

  function decorateDeferred() {
    document.querySelectorAll('[data-v884-action="resolve-deferred"][data-status="approved"]').forEach(button => {
      button.removeAttribute('data-v884-action');
      button.removeAttribute('data-status');
      button.dataset.v112Action = 'plan-deferred';
      button.textContent = 'Добавить в план';
    });
  }

  function decoratePostModal() {
    document.querySelectorAll('[data-v869-action="confirm-post-plan"]').forEach(button => {
      button.removeAttribute('data-v869-action');
      button.dataset.v112Action = 'confirm-post-plan';
    });
  }

  function decorate() {
    scheduled = false;
    const route = routeNow();
    if (!ROUTES.some(([target]) => target === route)) return;
    const calc = calculate();
    ensureNav(route);
    ensureLogicStrip(route);
    decoratePlanningUnknown(route);
    decorateAccountUnknown(route, calc);
    decorateMainFinance(route, calc);
    decorateDeferred();
    decoratePostModal();
    root.SecondBrainIcons?.apply?.(document.querySelector('#app'));
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(decorate);
  }

  document.addEventListener('click', event => {
    const control = event.target.closest?.('[data-v112-action],[data-v869-action="confirm-post-plan"]');
    if (!control) return;
    const action = control.dataset.v112Action || control.dataset.v869Action;
    if (!['explain-finance', 'plan-deferred', 'save-deferred-plan', 'confirm-post-plan'].includes(action)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (action === 'explain-finance') explainFinance();
    if (action === 'plan-deferred') openDeferredPlan(control.dataset.id);
    if (action === 'save-deferred-plan') saveDeferredPlan(control.dataset.id);
    if (action === 'confirm-post-plan') confirmPostedPlan(control.dataset.id);
  }, true);

  root.addEventListener('click', event => {
    const control = event.target.closest?.('[data-v869-action="confirm-post-plan"]');
    if (!control) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    confirmPostedPlan(control.dataset.id);
  }, true);

  const start = () => {
    if (root.V884Finance) root.V884Finance.calculate = calculate;
    root.SecondBrainFinanceV112 = Object.freeze({version: VERSION, calculate, decorate: schedule});
    const app = document.getElementById('app');
    if (app) new MutationObserver(records => { if (records.some(record => record.addedNodes.length)) schedule(); }).observe(app, {subtree: true, childList: true});
    const modal = document.getElementById('modal');
    if (modal) new MutationObserver(records => { if (records.some(record => record.addedNodes.length)) schedule(); }).observe(modal, {subtree: true, childList: true});
    root.addEventListener('hashchange', schedule);
    root.addEventListener('pageshow', schedule);
    root.addEventListener('second-brain-booted', schedule);
    root.addEventListener('second-brain-v104-saved', schedule);
    schedule();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})(window);
