'use strict';

/* Second Brain OS V69 — Calm Intelligence.
   A warm, private and practical visual system. Rendering never changes user records. */
(() => {
  const BUILD = 'second-brain-space-v69-calm-intelligence-20260715';
  const LABEL = 'V69 · CALM INTELLIGENCE';
  let scheduled = 0;

  const list = key => Array.isArray(state?.[key]) ? state[key] : [];
  const text = value => String(value ?? '').trim();
  const lower = value => text(value).toLocaleLowerCase('ru-RU');
  const number = value => typeof num === 'function' ? num(value) : Number(String(value ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
  const rubles = value => typeof money === 'function' ? money(value) : `${Math.round(number(value)).toLocaleString('ru-RU')} ₽`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const day = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  const done = item => ['готово', 'сделано', 'закрыт', 'закрыто', 'done', 'выполнено'].includes(lower(item?.status));

  function personal(item) {
    const area = lower(item?.area);
    const structural = `${item?.title || ''} ${item?.name || ''} ${item?.role || ''} ${item?.folder || ''}`;
    return area !== 'работа' && !/работа по найму|по найму|зарплат|оклад|работодател|офисн(?:ая|ые|ый) работ|рабоч(?:ая|ие|ий|ую) задач/i.test(structural);
  }

  function percentage(value) {
    return Math.max(0, Math.min(100, Math.round(number(value))));
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  }

  function monthOperations() {
    const prefix = day().slice(0, 7);
    return list('operations').filter(item => String(item.date || '').startsWith(prefix));
  }

  function financeSnapshot() {
    const operations = monthOperations();
    const todaySpend = operations.filter(item => item.type === 'expense' && item.date === day()).reduce((sum, item) => sum + number(item.amount), 0);
    const monthSpend = operations.filter(item => item.type === 'expense').reduce((sum, item) => sum + number(item.amount), 0);
    const balance = number(state.settings?.currentBalance);
    const settings = state.settings?.v67 || {};
    const monthEnd = new Date(new Date(`${day()}T12:00:00`).getFullYear(), new Date(`${day()}T12:00:00`).getMonth() + 1, 0, 12);
    const daysLeft = Math.max(1, Math.round((monthEnd - new Date(`${day()}T12:00:00`)) / 86400000) + 1);
    const debts = list('debts').filter(item => item.direction === 'out' && !done(item));
    const obligations = debts.reduce((sum, item) => sum + (number(item.minPayment) || number(item.amount)), 0);
    const planned = list('purchases').filter(item => item.includeInBudget !== false && (!item.date || String(item.date).startsWith(day().slice(0, 7)))).reduce((sum, item) => sum + number(item.amount), 0);
    const autoLimit = Math.max(0, (balance - obligations - planned) / daysLeft);
    const limit = settings.financeLimitMode === 'manual' ? Math.max(0, number(settings.manualDailyLimit)) : autoLimit;
    const overdue = debts.filter(item => item.due && item.due < day());
    return { balance, limit, todaySpend, monthSpend, obligations, debts, overdue, daysLeft };
  }

  function taskSnapshot() {
    const tasks = list('tasks').filter(personal);
    const open = tasks.filter(item => !done(item));
    const relevant = open.filter(item => !item.date || item.date <= day()).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || ({ A: 1, B: 2, C: 3, D: 4 }[a.priority] || 9) - ({ A: 1, B: 2, C: 3, D: 4 }[b.priority] || 9));
    const completedToday = tasks.filter(item => done(item) && (item.completedAt || item.date) === day()).length;
    return { open, relevant, completedToday, next: relevant[0] || null };
  }

  function habitSnapshot() {
    const habits = list('habits').filter(personal);
    const completed = habits.filter(item => item.marks?.[day()]);
    const sleep = list('sleepEntries').slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;
    const sleepHours = number(sleep?.hours || sleep?.duration);
    return { habits, completed, sleep, sleepHours };
  }

  function goalSnapshot() {
    const goals = list('goals').filter(personal).filter(item => !done(item));
    const configured = state.settings?.v49?.activeGoalId;
    const active = goals.find(item => String(item.id) === String(configured)) || goals[0] || null;
    if (!active) return { goals, active: null, progress: 0, nextTask: null };
    const linked = list('tasks').filter(task => String(task.goalId || '') === String(active.id));
    const actionProgress = linked.length ? linked.filter(done).length / linked.length * 100 : 0;
    const metricProgress = number(active.target) ? number(active.current) / Math.max(1, number(active.target)) * 100 : 0;
    const progress = percentage(metricProgress || actionProgress);
    const nextTask = linked.find(task => !done(task)) || null;
    return { goals, active, progress, nextTask };
  }

  function diarySnapshot() {
    const entries = list('subconsciousEntries');
    return entries.find(entry => entry.date === day()) || null;
  }

  function assistantSnapshot() {
    try {
      const model = window.SecondBrainAssistant?.model?.();
      if (model?.main) return { directive: model.main.directive, detail: `${model.main.title} · ${model.main.detail}`, route: model.main.route || 'dashboard', tone: model.tone || 'calm', icon: model.main.icon || '✦' };
    } catch (error) {}
    const tasks = taskSnapshot();
    if (tasks.next) return { directive: `Начните с «${tasks.next.title}».`, detail: 'Это первый личный пункт по сроку и приоритету.', route: 'tasks', tone: 'supportive', icon: '→' };
    return { directive: 'Выберите один небольшой шаг.', detail: 'Сегодня нет обязательного личного пункта.', route: 'tasks', tone: 'calm', icon: '✦' };
  }

  function progressBar(value) {
    return `<span class="v69-progress"><i style="--v69-progress:${percentage(value)}%"></i></span>`;
  }

  function calmDashboard() {
    const finance = financeSnapshot();
    const tasks = taskSnapshot();
    const habits = habitSnapshot();
    const goals = goalSnapshot();
    const diary = diarySnapshot();
    const assistant = assistantSnapshot();
    const people = list('people').slice(0, 5);
    const name = text(state.settings?.name) || 'Пользователь';
    const prettyDate = new Date(`${day()}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    const habitProgress = habits.habits.length ? habits.completed.length / habits.habits.length * 100 : 0;
    const taskTotal = Math.max(1, tasks.relevant.length + tasks.completedToday);
    const taskProgress = tasks.completedToday / taskTotal * 100;
    const limitProgress = finance.limit ? finance.todaySpend / finance.limit * 100 : 0;
    const financeCaption = finance.limit ? `${rubles(finance.todaySpend)} из ${rubles(finance.limit)}` : 'укажите остаток для расчёта';
    const taskCaption = tasks.relevant.length ? `${tasks.relevant.length} осталось на сегодня` : 'обязательных пунктов нет';
    const sleepCaption = habits.sleepHours ? `сон ${habits.sleepHours.toLocaleString('ru-RU')} ч` : 'сон ещё не заполнен';
    const goalCaption = goals.active ? (goals.nextTask?.title || goals.active.note || 'задайте следующий шаг') : 'добавьте первый ориентир';
    const debtWarning = finance.overdue.length ? `${finance.overdue.length} просрочено` : (finance.debts.length ? `${rubles(finance.obligations)} обязательств` : 'активных долгов нет');

    return `<section class="v69-dashboard">
      <header class="v69-day-head">
        <div><small>Мой день · ${escape(prettyDate)}</small><h1>${escape(greeting())}, ${escape(name)}</h1><p>Важное видно сразу. Остальное можно открыть, когда понадобится.</p></div>
        <div><button data-v68-action="open-assistant" class="v69-soft-button" type="button">✦ Помощник</button><button data-action="openQuick" class="v69-primary-button" type="button">＋ Добавить</button></div>
      </header>

      <section class="v69-life-grid">
        <button class="v69-life-card is-finance" data-go="finance" type="button">
          <header><span>₽</span><b>Финансы</b><i>→</i></header>
          <div class="v69-card-value"><small>Лимит дня</small><strong>${finance.limit ? rubles(finance.limit) : '—'}</strong></div>
          ${progressBar(limitProgress)}
          <footer><span>${escape(financeCaption)}</span><em class="${finance.overdue.length ? 'is-alert' : ''}">${escape(debtWarning)}</em></footer>
        </button>
        <button class="v69-life-card is-tasks" data-go="tasks" type="button">
          <header><span>✓</span><b>Задачи</b><i>→</i></header>
          <div class="v69-card-value"><small>План на день</small><strong>${tasks.completedToday}/${tasks.completedToday + tasks.relevant.length}</strong></div>
          ${progressBar(taskProgress)}
          <footer><span>${escape(taskCaption)}</span><em>${escape(tasks.next?.title || 'спокойный день')}</em></footer>
        </button>
        <button class="v69-life-card is-habits" data-go="habits" type="button">
          <header><span>◇</span><b>Привычки</b><i>→</i></header>
          <div class="v69-card-value"><small>Ритм сегодня</small><strong>${habits.completed.length}/${habits.habits.length}</strong></div>
          ${progressBar(habitProgress)}
          <footer><span>${escape(sleepCaption)}</span><em>${habits.habits.length ? `${Math.round(habitProgress)}% ритма` : 'добавьте якоря'}</em></footer>
        </button>
        <button class="v69-life-card is-goals" data-go="goals" type="button">
          <header><span>◎</span><b>Цели</b><i>→</i></header>
          <div class="v69-card-value"><small>${escape(goals.active?.title || 'Фокусная цель')}</small><strong>${goals.active ? `${goals.progress}%` : '—'}</strong></div>
          ${progressBar(goals.progress)}
          <footer><span>${goals.goals.length ? `${goals.goals.length} активных` : 'целей пока нет'}</span><em>${escape(goalCaption)}</em></footer>
        </button>
      </section>

      <section class="v69-next is-${escape(assistant.tone)}">
        <div class="v69-next-icon">${escape(assistant.icon)}</div>
        <div><small>Следующий шаг</small><h2>${escape(assistant.directive)}</h2><p>${escape(assistant.detail)}</p></div>
        <div><button data-v68-action="open-assistant" class="v69-primary-button" type="button">Почему так?</button><button data-go="${escape(assistant.route)}" class="v69-soft-button" type="button">Открыть</button></div>
      </section>

      <section class="v69-lower-grid">
        <article class="v69-journal-card">
          <div><small>Вечерняя рефлексия</small><h3>${diary ? 'Сегодняшний отклик сохранён' : 'Что вы выбираете для себя?'}</h3><p>${escape(diary?.summary || diary?.emotion || 'Короткая запись помогает увидеть не только события, но и повторяющийся внутренний сценарий.')}</p></div>
          <button data-go="subconscious" type="button">${diary ? 'Открыть дневник' : 'Записать'}</button>
        </article>
        <article class="v69-people-card">
          <header><div><small>Люди</small><h3>Близкие на связи</h3></div><button data-go="people" type="button">Все →</button></header>
          <div>${people.map(person => `<button data-go="people" type="button"><span>${person.photo ? `<img src="${escape(person.photo)}" alt="">` : escape((person.name || '?').slice(0, 1).toUpperCase())}</span><b>${escape(person.name || 'Человек')}</b><small>${escape(person.role || 'личный контакт')}</small></button>`).join('') || '<p>Добавьте людей, важные даты и темы для разговора.</p>'}</div>
        </article>
      </section>
    </section>`;
  }

  function renderDashboard(view) {
    if (document.querySelector('script[src*="app-v70-living.js"]')) return;
    if (!view || (location.hash || '#dashboard').replace('#', '') !== 'dashboard') return;
    if (view.querySelector('.v69-dashboard')) return;
    view.innerHTML = calmDashboard();
  }

  function goalBuilder(id = '') {
    const goal = list('goals').find(item => String(item.id) === String(id)) || {};
    openModal(id ? 'Разобрать цель' : 'Новая цель', `<div class="v69-goal-builder">
      <section><small>Цель → понятное действие</small><h3>${id ? 'Уточните результат и следующий шаг' : 'Сформулируйте результат без перегруза'}</h3><p>Новая задача создастся только если вы явно включите эту опцию.</p></section>
      <div class="v69-builder-grid">
        <label class="span-2"><span>Название цели</span><input id="v69_goal_title" value="${escape(goal.title || '')}" placeholder="Например: создать личный доход 300 000 ₽"></label>
        <label><span>Сфера</span><input id="v69_goal_area" value="${escape(goal.area || 'Личное развитие')}" placeholder="Финансы, здоровье, отношения…"></label>
        <label><span>Срок</span><input id="v69_goal_deadline" type="date" value="${escape(goal.deadline || '')}"></label>
        <label class="span-2"><span>Почему это важно</span><textarea id="v69_goal_why" placeholder="Коротко и лично">${escape(goal.why || goal.note || '')}</textarea></label>
        <label><span>Измеримый результат</span><input id="v69_goal_target" type="number" min="0" value="${escape(goal.target || '')}" placeholder="Например, 300000"></label>
        <label><span>Первый небольшой шаг</span><input id="v69_goal_step" value="${escape(goal.nextStep || '')}" placeholder="Одно действие на 15–40 минут"></label>
      </div>
      <label class="v69-confirm-row"><input id="v69_goal_create_task" type="checkbox"><span><b>Создать задачу из первого шага</b><small>Только после нажатия «Сохранить»; автоматических изменений нет.</small></span></label>
      <div class="v69-builder-actions"><button data-v69-action="save-goal" data-id="${escape(id)}" class="v69-primary-button" type="button">Сохранить</button><button data-v69-action="close-modal" class="v69-soft-button" type="button">Отмена</button></div>
    </div>`);
  }

  function saveGoal(id = '') {
    const title = text(document.getElementById('v69_goal_title')?.value);
    if (!title) return toast('Укажите название цели');
    const existing = list('goals').find(item => String(item.id) === String(id));
    const goal = existing || { id: uid(), current: 0, status: 'Активно', subgoals: [], steps: [] };
    goal.title = title;
    goal.area = text(document.getElementById('v69_goal_area')?.value) || 'Личное развитие';
    goal.deadline = document.getElementById('v69_goal_deadline')?.value || '';
    goal.why = text(document.getElementById('v69_goal_why')?.value);
    goal.note = goal.why;
    goal.target = number(document.getElementById('v69_goal_target')?.value);
    goal.nextStep = text(document.getElementById('v69_goal_step')?.value);
    if (!existing) {
      state.goals = list('goals');
      state.goals.unshift(goal);
    }
    const createTask = document.getElementById('v69_goal_create_task')?.checked;
    if (createTask && goal.nextStep && !list('tasks').some(task => String(task.goalId || '') === String(goal.id) && !done(task) && lower(task.title) === lower(goal.nextStep))) {
      state.tasks = list('tasks');
      state.tasks.unshift({ id: uid(), goalId: goal.id, title: goal.nextStep, area: goal.area, date: day(), time: '', priority: 'B', status: 'Активно', fixed: false, reminder: '', createdAt: new Date().toISOString() });
    }
    closeModal(); save(); render(); toast(existing ? 'Цель обновлена' : 'Цель сохранена');
  }

  function taskView(view) {
    state.settings = state.settings || {};
    state.settings.v49 = state.settings.v49 || {};
    state.settings.v49.taskView = view || 'today';
    save(); render();
  }

  function goalView(view) {
    state.settings = state.settings || {};
    state.settings.v49 = state.settings.v49 || {};
    state.settings.v49.goalView = view || 'active';
    save(); render();
  }

  function financeLimitMode(mode) {
    state.settings = state.settings || {};
    state.settings.v67 = Object.assign({ financeLimitMode: 'auto', manualDailyLimit: 0 }, state.settings.v67 || {});
    state.settings.v67.financeLimitMode = mode === 'manual' ? 'manual' : 'auto';
    save(); render();
    if (mode === 'manual' && !number(state.settings.v67.manualDailyLimit)) {
      setTimeout(() => document.getElementById('v67_manual_daily_limit')?.focus(), 120);
      toast('Введите ручной дневной лимит');
    }
  }

  function saveManualLimit() {
    const value = number(document.getElementById('v67_manual_daily_limit')?.value);
    if (value <= 0) return toast('Укажите лимит больше нуля');
    state.settings = state.settings || {};
    state.settings.v67 = Object.assign({}, state.settings.v67 || {}, { financeLimitMode: 'manual', manualDailyLimit: value });
    save(); render(); toast('Ручной лимит сохранён');
  }

  function normalizeControls() {
    const transforms = [
      ['[data-v49-action="taskView"]', 'task-view'],
      ['[data-v49-action="goalView"]', 'goal-view'],
      ['[data-v49-action="openGoalBuilder"]', 'goal-builder'],
      ['[data-v67-action="finance-limit-mode"]', 'finance-limit-mode'],
      ['[data-v67-action="save-manual-limit"]', 'save-manual-limit']
    ];
    transforms.forEach(([selector, action]) => document.querySelectorAll(selector).forEach(button => {
      button.removeAttribute(selector.includes('v49') ? 'data-v49-action' : 'data-v67-action');
      button.dataset.v69Action = action;
    }));
    document.querySelectorAll('button.v582-action-lite,button.ghost-btn').forEach(button => {
      if (!/стабильност/i.test(button.textContent || '') || button.hasAttribute('data-action')) return;
      const status = document.createElement('span');
      status.className = button.className;
      status.setAttribute('role', 'status');
      status.innerHTML = button.innerHTML;
      button.replaceWith(status);
    });
  }

  function polishChrome() {
    const v70Active = Boolean(document.querySelector('script[src*="app-v70-living.js"]'));
    const activeBuild = v70Active ? 'second-brain-space-v70-living-personal-os-20260715' : BUILD;
    const activeLabel = v70Active ? 'V70 · LIVING PERSONAL OS' : LABEL;
    document.body.classList.add('v69-calm-intelligence');
    document.body.dataset.sbosBuild = activeBuild;
    document.body.dataset.v69Route = (location.hash || '').replace('#', '') || 'dashboard';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', activeBuild);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v70Active ? (document.documentElement.classList.contains('v70-theme-light') ? '#f3f6fa' : '#07111f') : '#f2eee5');
    try { localStorage.setItem('secondBrainOS.currentBuild', activeBuild); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version && version.textContent !== activeLabel) version.textContent = activeLabel;
    const core = document.querySelector('.v59-core-pill');
    if (core && core.textContent !== (v70Active ? 'V70' : 'V69')) core.textContent = v70Active ? 'V70' : 'V69';
    const dashboardLabel = document.querySelector('.v68-nav-quick [data-go="dashboard"] .label');
    if (dashboardLabel) dashboardLabel.textContent = 'Мой день';
    const systemFolder = document.querySelector('.v68-nav-folder[data-folder="system"] > summary b');
    if (systemFolder) systemFolder.textContent = 'Настройки';
    const caption = document.querySelector('.v68-nav-caption');
    if (caption) caption.innerHTML = '<span>Личная система</span><small>только важное</small>';
    document.querySelector('.v59-sub')?.replaceChildren(document.createTextNode('личная операционная система'));
  }

  function postRender() {
    polishChrome();
    normalizeControls();
    const view = document.getElementById('view');
    renderDashboard(view);
  }

  function schedulePost() {
    clearTimeout(scheduled);
    scheduled = setTimeout(postRender, 45);
  }

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      const result = previousRender.apply(this, arguments);
      requestAnimationFrame(postRender);
      return result;
    };
  }

  window.addEventListener('click', event => {
    const button = event.target.closest?.('[data-v69-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const action = button.dataset.v69Action;
    if (action === 'task-view') return taskView(button.dataset.view);
    if (action === 'goal-view') return goalView(button.dataset.view);
    if (action === 'goal-builder') return goalBuilder(button.dataset.id || '');
    if (action === 'save-goal') return saveGoal(button.dataset.id || '');
    if (action === 'finance-limit-mode') return financeLimitMode(button.dataset.mode || 'auto');
    if (action === 'save-manual-limit') return saveManualLimit();
    if (action === 'close-modal') return closeModal();
  }, true);

  window.addEventListener('hashchange', () => [0, 100, 300].forEach(delay => setTimeout(postRender, delay)));
  const app = document.getElementById('app');
  if (app) new MutationObserver(schedulePost).observe(app, { childList: true, subtree: true });
  const modal = document.getElementById('modal');
  if (modal) new MutationObserver(schedulePost).observe(modal, { childList: true, subtree: true });
  if (document.body) new MutationObserver(() => {
    const expectedBuild = document.querySelector('script[src*="app-v70-living.js"]') ? 'second-brain-space-v70-living-personal-os-20260715' : BUILD;
    if (document.body.dataset.sbosBuild !== expectedBuild) schedulePost();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-sbos-build'] });

  window.SecondBrainCalm = { postRender, dashboard: calmDashboard };
  postRender();
  [120, 500, 1400, 3000, 5200].forEach(delay => setTimeout(postRender, delay));
  setInterval(() => { if (document.visibilityState === 'visible') postRender(); }, 1800);
})();
