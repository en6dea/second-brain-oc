'use strict';

/* Second Brain OS V68 — one explainable decision across personal life.
   No recommendation mutates records until the user presses an action. */
(() => {
  const BUILD = 'second-brain-space-v68-unified-assistant-20260715';
  const LABEL = 'V68 · UNIFIED PERSONAL OS';
  let postTimer = 0;

  const array = key => Array.isArray(state?.[key]) ? state[key] : [];
  const number = value => typeof num === 'function' ? num(value) : Number(String(value ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
  const clean = value => String(value ?? '').trim();
  const lower = value => clean(value).toLocaleLowerCase('ru-RU');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const dateToday = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  const currency = value => typeof money === 'function' ? money(value) : `${Math.round(number(value)).toLocaleString('ru-RU')} ₽`;
  const complete = item => ['готово', 'сделано', 'закрыт', 'закрыто', 'done', 'выполнено'].includes(lower(item?.status));
  const fixed = item => item?.fixed === true || item?.fixed === 'true' || item?.fixed === 1 || item?.fixed === '1';

  function personal(item) {
    const area = lower(item?.area);
    const text = `${item?.title || ''} ${item?.name || ''} ${item?.role || ''} ${item?.folder || ''}`;
    return area !== 'работа' && !/работа по найму|по найму|зарплат|оклад|работодател|офисн(?:ая|ые|ый) работ|рабоч(?:ая|ие|ий|ую) задач/i.test(text);
  }

  function dayDifference(left, right) {
    return Math.round((new Date(`${right}T12:00:00`) - new Date(`${left}T12:00:00`)) / 86400000);
  }

  function startOfWeek(value = dateToday()) {
    const date = new Date(`${value}T12:00:00`);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    return date.toISOString().slice(0, 10);
  }

  function priority(item) {
    return ({ A: 1, B: 2, C: 3, D: 4 }[item?.priority] || 9);
  }

  function incomeSource(item) {
    const explicit = lower(item?.incomeSource);
    if (explicit === 'trading' || explicit === 'side') return explicit;
    if (explicit === 'wage' || explicit === 'personal') return '';
    const text = lower(`${item?.category || ''} ${item?.note || ''}`);
    if (/трейд|forex|форекс/.test(text)) return 'trading';
    if (/подработ|фриланс|заказ|проект/.test(text) && !/найм|зарплат|оклад/.test(text)) return 'side';
    return '';
  }

  function financeModel() {
    const now = new Date(`${dateToday()}T12:00:00`);
    const monthKey = dateToday().slice(0, 7);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12);
    const daysLeft = Math.max(1, Math.round((monthEnd - now) / 86400000) + 1);
    const operations = array('operations').filter(item => String(item.date || '').startsWith(monthKey));
    const expenses = operations.filter(item => item.type === 'expense').reduce((sum, item) => sum + number(item.amount), 0);
    const incomes = operations.filter(item => item.type === 'income');
    const tracked = incomes.filter(item => incomeSource(item));
    const tradingIncome = tracked.filter(item => incomeSource(item) === 'trading').reduce((sum, item) => sum + number(item.amount), 0);
    const sideIncome = tracked.filter(item => incomeSource(item) === 'side').reduce((sum, item) => sum + number(item.amount), 0);
    const income = tradingIncome + sideIncome;
    const goal = Math.max(1, number(state.settings?.v65?.incomeGoal) || 300000);
    const elapsedDays = now.getDate();
    const daysInMonth = monthEnd.getDate();
    const expectedPace = goal * elapsedDays / daysInMonth;
    const outgoing = array('debts').filter(item => item.direction === 'out' && !complete(item));
    const obligations = outgoing.reduce((sum, item) => sum + (number(item.minPayment) || number(item.amount)), 0);
    const planned = array('purchases').filter(item => item.includeInBudget !== false && (!item.date || String(item.date).startsWith(monthKey))).reduce((sum, item) => sum + number(item.amount), 0);
    const balance = number(state.settings?.currentBalance);
    const autoDaily = Math.max(0, (balance - obligations - planned) / daysLeft);
    const manualDaily = Math.max(0, number(state.settings?.v67?.manualDailyLimit));
    const limitMode = state.settings?.v67?.financeLimitMode === 'manual' ? 'manual' : 'auto';
    const dailyLimit = limitMode === 'manual' ? manualDaily : autoDaily;
    const unclassified = incomes.filter(item => !clean(item.incomeSource) && !incomeSource(item) && !/найм|зарплат|оклад/i.test(`${item.category || ''} ${item.note || ''}`)).length;
    const hasFacts = operations.length > 0 || balance !== 0 || outgoing.length > 0;
    return { monthKey, daysLeft, operations, expenses, income, tradingIncome, sideIncome, goal, expectedPace, paceGap: Math.max(0, expectedPace - income), obligations, planned, balance, dailyLimit, limitMode, unclassified, hasFacts };
  }

  function debtModel() {
    const items = array('debts').filter(item => item.direction === 'out' && !complete(item));
    const scored = items.map(item => {
      const days = item.due ? dayDifference(dateToday(), item.due) : null;
      const overdue = days !== null && days < 0;
      let score = overdue ? 100000 : 0;
      if (days !== null && days <= 7) score += 50000 - Math.max(0, days) * 1000;
      score += Math.min(30000, number(item.rate) * 700);
      score += Math.max(0, 10000 - number(item.amount) / 10);
      return { item, days, overdue, score };
    }).sort((a, b) => b.score - a.score);
    return { items, scored, overdue: scored.filter(entry => entry.overdue), due7: scored.filter(entry => entry.days !== null && entry.days >= 0 && entry.days <= 7), first: scored[0] || null };
  }

  function taskModel() {
    const open = array('tasks').filter(personal).filter(item => !complete(item));
    const relevant = open.filter(item => !item.date || item.date <= dateToday()).sort((a, b) => {
      const overdueA = a.date && a.date < dateToday() ? 0 : 1;
      const overdueB = b.date && b.date < dateToday() ? 0 : 1;
      return overdueA - overdueB || Number(fixed(b)) - Number(fixed(a)) || priority(a) - priority(b) || String(a.date || '').localeCompare(String(b.date || ''));
    });
    const overdue = open.filter(item => item.date && item.date < dateToday());
    const todayItems = open.filter(item => item.date === dateToday());
    const stuck = open.filter(item => number(item.postponeCount) >= Math.max(2, number(state.settings?.v65?.taskPostponeWarning) || 3));
    const movable = todayItems.filter(item => !fixed(item) && ['C', 'D'].includes(item.priority || 'B'));
    return { open, relevant, overdue, todayItems, stuck, movable, overloaded: relevant.length > 6 };
  }

  function goalModel() {
    const goals = array('goals').filter(personal).filter(item => !complete(item));
    const tasks = array('tasks').filter(item => personal(item) || goals.some(goal => String(goal.id) === String(item.goalId || ''))).filter(item => !complete(item));
    const withoutStep = goals.filter(goal => !tasks.some(task => String(task.goalId || '') === String(goal.id)));
    return { goals, withoutStep, linked: goals.length - withoutStep.length };
  }

  function wellbeingModel() {
    const habits = array('habits').filter(personal);
    const pendingHabits = habits.filter(item => !item.marks?.[dateToday()]);
    const sleep = array('sleepEntries').slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;
    const target = Math.max(4, number(state.settings?.v66?.sleepTarget) || 6);
    const sleepRecent = sleep?.date && dayDifference(sleep.date, dateToday()) <= 2;
    const lowSleep = Boolean(sleepRecent && number(sleep.hours) > 0 && number(sleep.hours) < target);
    return { habits, pendingHabits, sleep, target, lowSleep };
  }

  function tradingModel(wellbeing) {
    const trades = array('trades');
    const real = trades.filter(item => item.mode === 'real');
    const pendingReview = real.find(item => item.lossReviewRequired || (number(item.resultAmount) < 0 && !item.lossReview?.completedAt));
    const risk = state.settings?.v66?.tradingRisk || {};
    const balance = Math.max(0, number(risk.accountBalance));
    const dayLoss = real.filter(item => item.date === dateToday() && number(item.resultAmount) < 0).reduce((sum, item) => sum + Math.abs(number(item.resultAmount)), 0);
    const weekStart = startOfWeek();
    const weekLoss = real.filter(item => item.date >= weekStart && item.date <= dateToday() && number(item.resultAmount) < 0).reduce((sum, item) => sum + Math.abs(number(item.resultAmount)), 0);
    const dayLimit = balance * (number(risk.dailyPct) || 2) / 100;
    const weekLimit = balance * (number(risk.weeklyPct) || 5) / 100;
    const course = state.settings?.v67?.tradingCourse?.completed || [];
    const demo = trades.filter(item => item.mode === 'demo').slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    let disciplined = 0;
    for (const trade of demo) {
      if (!(trade.followedPlan === true || trade.followedPlan === 'true') || trade.riskViolation) break;
      disciplined += 1;
    }
    const manual = state.settings?.v67?.tradingReadiness?.manual === true;
    const ready = manual || (new Set(course).size >= 8 && disciplined >= 20);
    const realMode = state.settings?.v66?.tradeView === 'real';
    const stopDay = balance > 0 && dayLoss >= dayLimit;
    const stopWeek = balance > 0 && weekLoss >= weekLimit;
    let block = '';
    if (pendingReview) block = 'сначала завершите разбор прошлой убыточной сделки';
    else if (stopDay) block = 'достигнут дневной стоп риска';
    else if (stopWeek) block = 'достигнут недельный стоп риска';
    else if (realMode && wellbeing.lowSleep) block = `сон ниже личного минимума ${wellbeing.target} ч`;
    else if (realMode && !ready) block = `готовность ${new Set(course).size}/8 уроков и ${Math.min(20, disciplined)}/20 демо-сделок`;
    return { realMode, pendingReview, balance, dayLoss, weekLoss, dayLimit, weekLimit, stopDay, stopWeek, ready, disciplined, course: new Set(course).size, block };
  }

  function signal(id, severity, icon, title, detail, directive, route, rank) {
    return { id, severity, icon, title, detail, directive, route, rank };
  }

  function assistantModel() {
    const finance = financeModel();
    const debts = debtModel();
    const tasks = taskModel();
    const goals = goalModel();
    const wellbeing = wellbeingModel();
    const trading = tradingModel(wellbeing);
    const signals = [];

    if (trading.block) signals.push(signal('trading', 3, '⛨', 'Реальный Forex на паузе', trading.block, 'Сегодня не открывайте новую реальную сделку.', 'trading', 1));
    if (debts.overdue.length) signals.push(signal('debts', 3, '₽', 'Есть просроченное обязательство', `${debts.overdue.length} долгов · приоритет: ${debts.first?.item?.person || 'ближайший платёж'}`, 'Сначала обязательный платёж. Не планируйте необязательные покупки.', 'debts', 2));
    else if (debts.due7.length) signals.push(signal('debts', 2, '₽', 'Платёж в ближайшие 7 дней', `${debts.due7.length} обязательств · резерв ${currency(finance.obligations)}`, 'Сначала зарезервируйте обязательный платёж.', 'debts', 3));
    if (finance.hasFacts && finance.dailyLimit <= 0) signals.push(signal('finance', 3, '◒', 'Свободного дневного лимита нет', `обязательства ${currency(finance.obligations)} · покупки ${currency(finance.planned)}`, 'Сегодня не покупайте необязательное.', 'finance', 4));
    if (tasks.overloaded) signals.push(signal('tasks', 2, '✓', 'День перегружен', `${tasks.relevant.length} личных задач требуют внимания`, 'Сократите план до трёх главных пунктов.', 'tasks', 5));
    else if (tasks.overdue.length) signals.push(signal('tasks', 2, '!', 'Есть просроченные задачи', `${tasks.overdue.length} задач остаются открытыми`, 'Выберите одну просроченную задачу: сделать, упростить или назначить новую дату.', 'tasks', 6));
    if (wellbeing.lowSleep) signals.push(signal('sleep', 2, '☾', 'Сон ниже личного минимума', `${number(wellbeing.sleep.hours).toFixed(1)} ч при минимуме ${wellbeing.target} ч`, 'Снизьте нагрузку и не компенсируйте усталость рискованными решениями.', 'sleep', 7));
    if (finance.hasFacts && finance.paceGap > finance.goal * 0.05) signals.push(signal('income', 2, '↗', 'Доход отстаёт от темпа месяца', `${currency(finance.income)} при темпе ${currency(finance.expectedPace)}`, 'Добавьте один конкретный шаг к трейдингу или подработке — без работы по найму.', 'finance', 8));
    if (finance.unclassified) signals.push(signal('income-source', 1, '≡', 'Доходы без источника', `${finance.unclassified} операций не участвуют в цели 300 000 ₽`, 'Уточните источник: трейдинг или подработка.', 'finance', 9));
    if (goals.withoutStep.length) signals.push(signal('goals', 1, '↗', 'Цели без следующего шага', `${goals.withoutStep.length} целей не связаны с активной задачей`, 'Создайте один шаг на 15–40 минут.', 'goals', 10));
    if (wellbeing.pendingHabits.length) signals.push(signal('habits', 1, '↻', 'Ритм дня ещё открыт', `${wellbeing.pendingHabits.length}/${wellbeing.habits.length} привычек не отмечено`, 'Оставьте только минимально выполнимую версию привычки.', 'habits', 11));
    if (!finance.hasFacts) signals.push(signal('finance-setup', 1, '₽', 'Финансам не хватает фактов', 'остаток и операции пока не дают надёжного прогноза', 'Укажите остаток или загрузите банковскую выписку.', 'finance', 12));
    if (!goals.goals.length) signals.push(signal('goal-setup', 1, '◇', 'Активная цель не выбрана', 'помощнику не к чему привязать следующий шаг', 'Добавьте один измеримый личный ориентир.', 'goals', 13));

    signals.sort((a, b) => b.severity - a.severity || a.rank - b.rank);
    const main = signals[0] || signal('calm', 0, '✦', 'Критичных сигналов нет', 'данные дня не показывают перегрузки или финансового риска', 'Одного важного шага сегодня достаточно.', 'dashboard', 99);
    const actions = [];
    for (const item of signals) {
      if (actions.some(action => action.route === item.route)) continue;
      actions.push(item);
      if (actions.length === 3) break;
    }
    const facts = [
      { label: 'Свободный лимит', value: finance.hasFacts ? `${currency(finance.dailyLimit)} / день` : 'нужны данные', tone: finance.hasFacts && finance.dailyLimit <= 0 ? 'red' : 'blue' },
      { label: 'Обязательства', value: finance.obligations ? currency(finance.obligations) : 'нет минимума', tone: debts.overdue.length ? 'red' : 'amber' },
      { label: 'Доход месяца', value: `${currency(finance.income)} / ${currency(finance.goal)}`, tone: finance.paceGap > finance.goal * .05 ? 'amber' : 'green' },
      { label: 'Задачи к сегодня', value: String(tasks.relevant.length), tone: tasks.overloaded ? 'red' : 'blue' },
      { label: 'Сон', value: wellbeing.sleep ? `${number(wellbeing.sleep.hours).toFixed(1)} ч` : 'не заполнен', tone: wellbeing.lowSleep ? 'red' : 'violet' }
    ];
    const tone = main.severity >= 3 ? 'direct' : main.severity === 2 ? 'supportive' : 'calm';
    return { finance, debts, tasks, goals, wellbeing, trading, signals, main, actions, facts, tone };
  }

  function commandHtml(model) {
    return `<section class="v68-command is-${model.tone}"><div class="v68-command-main"><span>${model.main.icon}</span><div><small>${model.tone === 'direct' ? 'Прямой сигнал' : model.tone === 'supportive' ? 'Поддержка и порядок' : 'Спокойный режим'}</small><h3>${escape(model.main.directive)}</h3><p>${escape(model.main.title)} · ${escape(model.main.detail)}</p></div></div><div class="v68-command-facts">${model.facts.slice(0, 4).map(fact => `<article class="is-${fact.tone}"><span>${escape(fact.label)}</span><b>${escape(fact.value)}</b></article>`).join('')}</div><div class="v68-command-actions"><button class="is-primary" data-v68-action="open-assistant" type="button">Разобрать решение</button><button data-v68-action="open-section" data-route="${escape(model.main.route)}" type="button">Открыть главное</button>${model.tasks.relevant.length ? '<button data-v68-action="open-day-plan" type="button">Порядок задач</button>' : ''}</div></section>`;
  }

  function injectDashboard(view) {
    if (view.querySelector('.v68-command')) return;
    const old = view.querySelector('.v65-assistant-strip');
    const anchor = old || view.querySelector('.v67-dashboard-guide');
    if (!anchor) return;
    const html = commandHtml(assistantModel());
    if (old) { old.insertAdjacentHTML('beforebegin', html); old.remove(); }
    else anchor.insertAdjacentHTML('afterend', html);
  }

  function openAssistant() {
    const model = assistantModel();
    const signalRows = model.signals.slice(0, 8).map(item => `<button data-v68-action="open-section" data-route="${escape(item.route)}" type="button"><span class="is-${item.severity >= 3 ? 'red' : item.severity === 2 ? 'amber' : 'blue'}">${item.icon}</span><div><b>${escape(item.title)}</b><small>${escape(item.detail)}</small><p>${escape(item.directive)}</p></div><i>→</i></button>`).join('');
    const planRows = (model.actions.length ? model.actions : [model.main]).map((item, index) => `<article><span>${index + 1}</span><div><b>${escape(item.directive)}</b><small>${escape(item.title)}</small></div><button data-v68-action="open-section" data-route="${escape(item.route)}" type="button">Открыть</button></article>`).join('');
    openModal('Внутренний помощник', `<div class="v68-assistant"><section class="v68-assistant-hero is-${model.tone}"><span>${model.main.icon}</span><div><small>Решение по сохранённым фактам</small><h3>${escape(model.main.directive)}</h3><p>${escape(model.main.title)} · ${escape(model.main.detail)}</p></div></section><div class="v68-assistant-facts">${model.facts.map(fact => `<article class="is-${fact.tone}"><span>${escape(fact.label)}</span><b>${escape(fact.value)}</b></article>`).join('')}</div><section class="v68-assistant-plan"><header><div><small>Сейчас</small><h3>Три шага вместо длинного списка</h3></div>${model.tasks.overloaded ? '<em>день перегружен</em>' : '<em class="is-ok">без скрытых перестановок</em>'}</header><div>${planRows}</div></section><section class="v68-assistant-signals"><header><small>Почему такой порядок</small><h3>Сигналы и ограничения</h3></header><div>${signalRows || '<p>Критичных сигналов нет.</p>'}</div></section><div class="v68-assistant-actions"><button class="is-primary" data-v68-action="open-day-plan" type="button">Показать порядок задач</button><button data-v68-action="close" type="button">Закрыть</button></div><p class="v68-assistant-note">Помощник не переносит задачи, не совершает платежи и не открывает сделки самостоятельно. Любое изменение требует вашего действия или подтверждения.</p></div>`);
  }

  function openDayPlan() {
    closeModal();
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.dataset.v65Action = 'openDayPlan';
    trigger.hidden = true;
    document.body.appendChild(trigger);
    trigger.click();
    trigger.remove();
  }

  function ensureGoalField() {
    const fields = typeof schemas === 'object' ? schemas?.task?.fields : null;
    if (!Array.isArray(fields)) return;
    const options = [['', 'Не связывать с целью'], ...array('goals').filter(personal).map(goal => [String(goal.id), clean(goal.title) || 'Цель'])];
    const field = fields.find(item => item[0] === 'goalId');
    if (field) field[3] = options;
    else {
      const noteIndex = fields.findIndex(item => item[0] === 'note');
      fields.splice(noteIndex < 0 ? fields.length : noteIndex, 0, ['goalId', 'Связать с целью', 'select', options]);
    }
  }

  function injectGoalBridge(view) {
    if (view.querySelector('.v68-goal-bridge')) return;
    const hero = view.querySelector('.hero,.v59-hero');
    if (!hero) return;
    const model = goalModel();
    if (!model.goals.length) return;
    const count = model.withoutStep.length;
    const goalNoun = count % 10 === 1 && count % 100 !== 11 ? 'цель' : (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? 'цели' : 'целей');
    const rows = model.withoutStep.slice(0, 5).map(goal => `<article><span>◇</span><div><b>${escape(goal.title || 'Цель')}</b><small>${escape(goal.note || 'Следующий шаг пока не задан')}</small></div><button data-v68-action="create-goal-step" data-id="${escape(goal.id)}" type="button">Создать шаг</button></article>`).join('');
    hero.insertAdjacentHTML('afterend', `<section class="v68-goal-bridge"><header><div><span>↗</span><div><small>Цель → действие</small><h3>${count ? `${count} ${goalNoun} без активного шага` : 'Все цели связаны с действиями'}</h3></div></div><div><b>${model.linked}/${model.goals.length}</b><small>есть активная задача</small></div></header>${rows ? `<div class="v68-goal-bridge-list">${rows}</div>` : '<p>Помощник видит связь целей с задачами и не создаёт новые записи без вашего нажатия.</p>'}</section>`);
  }

  function createGoalStep(id) {
    const goal = array('goals').find(item => String(item.id) === String(id));
    if (!goal) return toast('Цель не найдена');
    const exists = array('tasks').some(task => String(task.goalId || '') === String(goal.id) && !complete(task));
    if (exists) return toast('У этой цели уже есть активная задача');
    state.tasks = array('tasks');
    state.tasks.unshift({ id: uid(), goalId: goal.id, title: `Шаг к цели: ${clean(goal.title) || 'следующее действие'}`, area: goal.area || 'Цели', date: dateToday(), time: '', priority: 'B', status: 'Активно', fixed: false, reminder: '', createdAt: new Date().toISOString() });
    save(); render(); toast('Следующий шаг создан и связан с целью');
  }

  function injectSystemCard(view) {
    const grid = view.querySelector('.v66-system-grid');
    if (!grid || grid.querySelector('[data-v68-assistant-card]')) return;
    const model = assistantModel();
    grid.insertAdjacentHTML('beforeend', `<article data-v68-assistant-card><span>✦</span><div><b>Единый помощник</b><small>${escape(model.main.directive)} · решения объясняются фактами</small></div><button data-v68-action="open-assistant" type="button">Открыть</button></article>`);
  }

  function normalizeInformationalControls() {
    document.querySelectorAll('button.v582-action-lite,button.ghost-btn').forEach(button => {
      if (!/стабильност/i.test(button.textContent || '') || button.attributes.length > 1 && button.hasAttribute('data-action')) return;
      const status = document.createElement('span');
      status.className = button.className;
      status.setAttribute('role', 'status');
      status.innerHTML = button.innerHTML;
      button.replaceWith(status);
    });
  }

  function navRoute(button) {
    if (button.dataset.v68Action === 'open-assistant' || button.dataset.v65Action === 'openAssistant') return 'assistant';
    return button.dataset.go || '';
  }

  function persistOpenNavFolders(shell) {
    try {
      const open = [...shell.querySelectorAll('.v68-nav-folder[open]')].map(item => item.dataset.folder);
      localStorage.setItem('secondBrainOS.v68.openNavFolders', JSON.stringify(open));
    } catch (error) {}
  }

  function savedOpenNavFolders() {
    try {
      const value = JSON.parse(localStorage.getItem('secondBrainOS.v68.openNavFolders') || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }

  function organizeNavigation() {
    const nav = document.querySelector('.v59-nav-scroll');
    if (!nav) return;
    nav.classList.add('v68-nav-ready');
    nav.closest('.v59-side,.side')?.querySelector('.v59-ai-card')?.classList.add('v68-sidebar-card-hidden');

    document.querySelectorAll('[data-v65-action="openAssistant"],.v59-nav-item[data-go="coach"]').forEach(button => {
      button.removeAttribute('data-v65-action');
      button.removeAttribute('data-go');
      button.dataset.v68Action = 'open-assistant';
      const label = button.querySelector('.label');
      if (label) label.textContent = 'Помощник';
    });

    const current = (location.hash || '').replace('#', '') || 'dashboard';
    let shell = nav.querySelector(':scope > .v68-nav-shell');
    if (shell) {
      const quick = shell.querySelector('.v68-nav-quick');
      const assistantButton = nav.querySelector('.v59-nav-item[data-v68-action="open-assistant"]') || [...nav.querySelectorAll('.v59-nav-item')].find(button => clean(button.querySelector('.label')?.textContent) === 'Помощник');
      if (quick && assistantButton && assistantButton.parentElement !== quick) quick.appendChild(assistantButton);
      shell.querySelectorAll('.v59-nav-item').forEach(button => button.classList.toggle('active', navRoute(button) === current));
      const activeFolder = shell.querySelector(`.v68-nav-folder [data-go="${CSS.escape(current)}"]`)?.closest('.v68-nav-folder');
      if (activeFolder) activeFolder.open = true;
      const activeSubfolder = shell.querySelector(`.v68-nav-subfolder [data-go="${CSS.escape(current)}"]`)?.closest('.v68-nav-subfolder');
      if (activeSubfolder) activeSubfolder.open = true;
      return;
    }

    const buttons = [...nav.querySelectorAll('.v59-nav-item')];
    if (!buttons.length) return;
    shell = document.createElement('div');
    shell.className = 'v68-nav-shell';
    shell.innerHTML = '<div class="v68-nav-caption"><span>Личная система</span><small>разделы собраны по смыслу</small></div><div class="v68-nav-quick"></div><div class="v68-nav-folders"></div>';

    const quick = shell.querySelector('.v68-nav-quick');
    const folders = shell.querySelector('.v68-nav-folders');
    const byRoute = new Map(buttons.map(button => [navRoute(button), button]));
    const dashboardButton = byRoute.get('dashboard');
    const assistantButton = byRoute.get('assistant') || buttons.find(button => clean(button.querySelector('.label')?.textContent) === 'Помощник');
    [dashboardButton, assistantButton].filter(Boolean).forEach(button => { button.hidden = false; quick.appendChild(button); });

    const groups = [
      { id: 'life', icon: '◫', title: 'Дела и развитие', sections: [
        { title: 'План и дела', routes: ['tasks', 'calendar', 'planning'] },
        { title: 'Развитие', routes: ['goals', 'habits', 'sleep'] }
      ] },
      { id: 'money', icon: '₽', title: 'Деньги', sections: [
        { title: 'Учёт и обязательства', routes: ['finance', 'debts', 'purchases'] },
        { title: 'Forex', routes: ['trading', 'trading-course'] }
      ] },
      { id: 'memory', icon: '◇', title: 'Личная память', sections: [
        { title: 'Я и люди', routes: ['subconscious', 'people', 'personal'] },
        { title: 'Мысли и знания', routes: ['inbox', 'notes', 'ideas', 'documents', 'books', 'films'] },
        { title: 'Желания и опыт', routes: ['wishes', 'trips'] }
      ] },
      { id: 'system', icon: '·', title: 'Ещё и настройки', routes: ['archive', 'system'] }
    ];
    const saved = savedOpenNavFolders();
    groups.forEach(group => {
      const routes = [...(group.routes || []), ...(group.sections || []).flatMap(section => section.routes)];
      const children = routes.map(route => byRoute.get(route)).filter(Boolean);
      if (!children.length) return;
      const details = document.createElement('details');
      details.className = 'v68-nav-folder';
      details.dataset.folder = group.id;
      details.open = children.some(button => navRoute(button) === current) || saved.includes(group.id);
      details.innerHTML = `<summary><span><i>${group.icon}</i><b>${escape(group.title)}</b></span><em>${children.length}</em><strong>⌄</strong></summary><div class="v68-nav-folder-items"></div>`;
      const list = details.querySelector('.v68-nav-folder-items');
      (group.routes || []).map(route => byRoute.get(route)).filter(Boolean).forEach(button => { button.hidden = false; list.appendChild(button); });
      (group.sections || []).forEach(section => {
        const sectionButtons = section.routes.map(route => byRoute.get(route)).filter(Boolean);
        if (!sectionButtons.length) return;
        const subfolder = document.createElement('details');
        subfolder.className = 'v68-nav-subfolder';
        subfolder.open = sectionButtons.some(button => navRoute(button) === current);
        subfolder.innerHTML = `<summary><span>${escape(section.title)}</span><em>${sectionButtons.length}</em><strong>⌄</strong></summary><div></div>`;
        sectionButtons.forEach(button => { button.hidden = false; subfolder.lastElementChild.appendChild(button); });
        list.appendChild(subfolder);
      });
      details.addEventListener('toggle', () => persistOpenNavFolders(shell));
      folders.appendChild(details);
    });

    nav.querySelectorAll(':scope > .v59-section,:scope > .v59-nav-list').forEach(element => { element.hidden = true; });
    nav.appendChild(shell);
  }

  function assistantSelfTest() {
    const checks = {
      sideGigIncluded: personal({ area: 'Подработка', title: 'Заказ' }),
      employmentExcluded: !personal({ area: 'Работа', title: 'Отчёт работодателю' }),
      incomeTrading: incomeSource({ incomeSource: 'trading' }) === 'trading',
      incomeWageExcluded: incomeSource({ incomeSource: 'wage' }) === '',
      directSeverity: signal('x', 3, '!', 'x', 'x', 'x', 'tasks', 1).severity === 3
    };
    return { ok: Object.values(checks).every(Boolean), checks };
  }

  function postRender() {
    const v70Active = Boolean(document.querySelector('script[src*="app-v70-living.js"]'));
    const v69Active = Boolean(document.querySelector('script[src*="app-v69-calm.js"]'));
    const activeBuild = v70Active ? 'second-brain-space-v70-living-personal-os-20260715' : (v69Active ? 'second-brain-space-v69-calm-intelligence-20260715' : BUILD);
    const activeLabel = v70Active ? 'V70 · LIVING PERSONAL OS' : (v69Active ? 'V69 · CALM INTELLIGENCE' : LABEL);
    const goalStatus = goalModel();
    document.body.dataset.sbosBuild = activeBuild;
    document.body.dataset.v68AssistantSelftest = assistantSelfTest().ok ? 'pass' : 'fail';
    document.body.dataset.v68GoalCount = String(goalStatus.goals.length);
    document.body.dataset.v68GoalsWithoutStep = String(goalStatus.withoutStep.length);
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', activeBuild);
    try { localStorage.setItem('secondBrainOS.currentBuild', activeBuild); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version && version.textContent !== activeLabel) version.textContent = activeLabel;
    const core = document.querySelector('.v59-core-pill');
    if (core && core.textContent !== (v70Active ? 'V70' : (v69Active ? 'V69' : 'V68'))) core.textContent = v70Active ? 'V70' : (v69Active ? 'V69' : 'V68');
    ensureGoalField();
    organizeNavigation();
    normalizeInformationalControls();
    const view = document.getElementById('view');
    if (!view) return;
    const route = (location.hash || '').replace('#', '') || 'dashboard';
    if (route === 'dashboard') injectDashboard(view);
    if (route === 'goals') injectGoalBridge(view);
    if (route === 'system') injectSystemCard(view);
  }

  function schedulePost() {
    clearTimeout(postTimer);
    postTimer = setTimeout(postRender, 55);
  }

  const priorRender = typeof render === 'function' ? render : null;
  if (priorRender) {
    render = function () {
      const result = priorRender.apply(this, arguments);
      requestAnimationFrame(postRender);
      return result;
    };
  }

  window.SecondBrainAssistant = { model: assistantModel, open: openAssistant, selfTest: assistantSelfTest, postRender };

  window.addEventListener('click', event => {
    const button = event.target.closest?.('[data-v68-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const action = button.dataset.v68Action;
    if (action === 'open-assistant') return openAssistant();
    if (action === 'open-day-plan') return openDayPlan();
    if (action === 'open-section') { closeModal(); return go(button.dataset.route || 'dashboard'); }
    if (action === 'create-goal-step') return createGoalStep(button.dataset.id || '');
    if (action === 'close') return closeModal();
  }, true);

  window.addEventListener('hashchange', () => [0, 100, 260].forEach(delay => setTimeout(postRender, delay)));
  const app = document.getElementById('app');
  if (app) new MutationObserver(schedulePost).observe(app, { childList: true, subtree: true });
  if (document.body) new MutationObserver(() => {
    const expectedBuild = document.querySelector('script[src*="app-v70-living.js"]') ? 'second-brain-space-v70-living-personal-os-20260715' : (document.querySelector('script[src*="app-v69-calm.js"]') ? 'second-brain-space-v69-calm-intelligence-20260715' : BUILD);
    if (document.body.dataset.sbosBuild !== expectedBuild) schedulePost();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-sbos-build'] });

  postRender();
  [140, 650, 1900, 3550, 5350].forEach(delay => setTimeout(postRender, delay));
  setInterval(() => { if (document.visibilityState === 'visible') postRender(); }, 1200);
})();
