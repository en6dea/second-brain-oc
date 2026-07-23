'use strict';

/* Second Brain OS V70 — Living Personal OS, based on the approved dark reference.
   This layer reads existing personal records and never changes them while rendering. */
(() => {
  const BUILD = 'second-brain-space-v71-personal-data-restore-20260716-r26';
  const LABEL = 'V70 · LIVING PERSONAL OS';
  let timer = 0;
  let lastNavRoute = '';

  const list = key => Array.isArray(state?.[key]) ? state[key] : [];
  const text = value => String(value ?? '').trim();
  const lower = value => text(value).toLocaleLowerCase('ru-RU');
  const number = value => typeof num === 'function' ? num(value) : Number(String(value ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
  const rubles = value => typeof money === 'function' ? money(value) : `${Math.round(number(value)).toLocaleString('ru-RU')} ₽`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const day = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  const complete = item => ['готово', 'сделано', 'закрыт', 'закрыто', 'done', 'выполнено'].includes(lower(item?.status));
  const clamp = value => Math.max(0, Math.min(100, Math.round(number(value))));

  function personal(item) {
    const area = lower(item?.area);
    const structural = `${item?.title || ''} ${item?.name || ''} ${item?.role || ''} ${item?.folder || ''}`;
    return area !== 'работа' && !/работа по найму|по найму|зарплат|оклад|работодател|офисн(?:ая|ые|ый) работ|рабоч(?:ая|ие|ий|ую) задач/i.test(structural);
  }

  function snapshots() {
    const today = day();
    const month = today.slice(0, 7);
    const operations = list('operations').filter(item => String(item.date || '').startsWith(month));
    const income = operations.filter(item => item.type === 'income' && !/зарплат|оклад|найм/i.test(`${item.category || ''} ${item.note || ''}`)).reduce((sum, item) => sum + number(item.amount), 0);
    const expense = operations.filter(item => item.type === 'expense').reduce((sum, item) => sum + number(item.amount), 0);
    const balance = number(state.settings?.currentBalance);
    const debts = list('debts').filter(item => item.direction === 'out' && !complete(item));
    const debtTotal = debts.reduce((sum, item) => sum + number(item.amount), 0);
    const overdue = debts.filter(item => item.due && item.due < today);
    const nextDebt = debts.slice().sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')))[0] || null;

    const tasks = list('tasks').filter(personal);
    const openTasks = tasks.filter(item => !complete(item));
    const relevantTasks = openTasks.filter(item => !item.date || item.date <= today).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || ({ A: 1, B: 2, C: 3, D: 4 }[a.priority] || 9) - ({ A: 1, B: 2, C: 3, D: 4 }[b.priority] || 9));
    const doneToday = tasks.filter(item => complete(item) && (item.completedAt || item.date) === today).length;

    const habits = list('habits').filter(personal);
    const doneHabits = habits.filter(item => item.marks?.[today]);
    const sleep = list('sleepEntries').slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;
    const sleepHours = number(sleep?.hours || sleep?.duration);

    const trades = list('trades');
    const realTrades = trades.filter(item => item.mode === 'real');
    const demoTrades = trades.filter(item => item.mode !== 'real');
    const tradeReviews = trades.filter(item => text(item.review || item.lesson || item.note)).length;
    const tradingProgress = clamp(Math.min(100, demoTrades.length * 7 + tradeReviews * 8 + realTrades.length * 3));

    const goals = list('goals').filter(personal).filter(item => !complete(item));
    const activeGoal = goals.find(item => String(item.id) === String(state.settings?.v49?.activeGoalId || '')) || goals[0] || null;
    const goalTasks = activeGoal ? tasks.filter(task => String(task.goalId || '') === String(activeGoal.id)) : [];
    const goalMetric = activeGoal?.target ? number(activeGoal.current) / Math.max(1, number(activeGoal.target)) * 100 : 0;
    const goalActions = goalTasks.length ? goalTasks.filter(complete).length / goalTasks.length * 100 : 0;
    const goalProgress = clamp(goalMetric || goalActions);
    const nextGoalTask = goalTasks.find(task => !complete(task)) || null;

    const taskProgress = clamp((doneToday / Math.max(1, doneToday + relevantTasks.length)) * 100);
    const habitProgress = clamp((doneHabits.length / Math.max(1, habits.length)) * 100);
    const focusProgress = relevantTasks.length ? (relevantTasks[0].priority === 'A' ? 70 : 52) : 100;
    const overall = clamp((taskProgress + habitProgress + goalProgress + Math.max(20, tradingProgress)) / 4);
    return { operations, income, expense, balance, debts, debtTotal, overdue, nextDebt, tasks, openTasks, relevantTasks, doneToday, habits, doneHabits, sleep, sleepHours, trades, realTrades, demoTrades, tradeReviews, tradingProgress, goals, activeGoal, goalTasks, goalProgress, nextGoalTask, taskProgress, habitProgress, focusProgress, overall };
  }

  function assistantModel(snapshot) {
    try {
      const model = window.SecondBrainAssistant?.model?.();
      if (model?.main) return { directive: model.main.directive, detail: `${model.main.title} · ${model.main.detail}`, route: model.main.route || 'dashboard', tone: model.tone || 'calm', icon: model.main.icon || '→', signals: model.signals || [] };
    } catch (error) {}
    const next = snapshot.relevantTasks[0];
    return next
      ? { directive: `Сделайте «${next.title}».`, detail: 'Это первый личный пункт по сроку и приоритету.', route: 'tasks', tone: 'supportive', icon: '→', signals: [] }
      : { directive: 'Выберите один небольшой шаг.', detail: 'Обязательных пунктов на сегодня нет.', route: 'tasks', tone: 'calm', icon: '→', signals: [] };
  }

  function ring(value, label = '') {
    const progress = clamp(value);
    return `<span class="v70-ring" style="--v70-progress:${progress * 3.6}deg"><b>${progress}%</b><small>${escape(label)}</small></span>`;
  }

  function line(value, tone = 'green') {
    return `<span class="v70-line is-${tone}"><i style="--v70-line:${clamp(value)}%"></i></span>`;
  }

  function dashboardHtml() {
    const data = snapshots();
    const assistant = assistantModel(data);
    const mainGoal = data.activeGoal;
    const firstSignal = assistant.signals.find(item => item.severity >= 2) || assistant.signals[0] || null;
    const riskText = data.overdue.length
      ? `${data.overdue.length} просроченных обязательств требуют внимания`
      : (firstSignal?.detail || (data.debts.length ? 'Ближайшие платежи находятся под контролем' : 'Критичных финансовых рисков нет'));
    const nextGoalAction = data.nextGoalTask?.title || mainGoal?.nextStep || mainGoal?.note || 'Задайте один следующий шаг';
    const currentHour = new Date().getHours();
    const phase = currentHour < 12 ? 'Утро' : (currentHour < 18 ? 'День' : 'Вечер');
    const phaseText = phase === 'Утро' ? 'Планируйте. Фокусируйтесь. Создавайте импульс.' : (phase === 'Вечер' ? 'Анализируйте. Благодарите. Отпускайте лишнее.' : 'Держите один фокус и сохраняйте энергию.');
    const dateLabel = new Date(`${day()}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    const recommendations = assistant.signals.slice(0, 3);

    return `<section class="v70-dashboard">
      <header class="v70-page-head"><div><small>${escape(dateLabel)}</small><h1>Главное сейчас</h1></div><div><span class="is-on"></span>Фокус <i>•</i> Ясность <i>•</i> Действие</div></header>
      <div class="v70-dashboard-layout">
        <main class="v70-dashboard-main">
          <section class="v70-focus-grid">
            <article class="v70-focus-card is-${escape(assistant.tone)}">
              <div><small>✦ 1 следующий шаг</small><h2>${escape(assistant.directive)}</h2><p>${escape(assistant.detail)}</p><footer><span>◷ 25 мин</span><span>✦ высокий эффект</span></footer></div>
              <button data-v68-action="open-assistant" type="button" aria-label="Разобрать решение">→</button>
            </article>
            <article class="v70-progress-card">
              ${ring(data.overall, 'выполнено')}
              <div><h3>Прогресс дня</h3><p><span class="is-green"></span>Фокус <b>${Math.round(data.focusProgress / 34)}/3</b></p><p><span class="is-yellow"></span>Действия <b>${data.doneToday}/${data.doneToday + data.relevantTasks.length}</b></p><p><span class="is-blue"></span>Привычки <b>${data.doneHabits.length}/${data.habits.length}</b></p><p><span class="is-violet"></span>Развитие <b>${data.tradingProgress}%</b></p></div>
            </article>
          </section>

          <section class="v70-module-grid">
            <button class="v70-module-card is-finance" data-go="finance" type="button"><header><span>▣</span><b>Финансы</b></header><small>Баланс</small><strong>${data.balance ? rubles(data.balance) : '—'}</strong><div class="v70-duo"><span>Доходы<b>${rubles(data.income)}</b></span><span>Расходы<b>${rubles(data.expense)}</b></span></div>${line(data.balance ? Math.min(100, data.income / Math.max(1, data.expense) * 50) : 0, 'cyan')}<footer>План на месяц <i>→</i></footer></button>
            <button class="v70-module-card is-debt" data-go="debts" type="button"><header><span>▤</span><b>Долги</b>${data.overdue.length ? '<em>Внимание</em>' : ''}</header><small>К погашению</small><strong>${data.debts.length ? rubles(data.debtTotal) : '—'}</strong><div class="v70-duo"><span>Ближайший платёж<b>${data.nextDebt?.due ? new Date(`${data.nextDebt.due}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'не задан'}</b></span><span>Риск просрочки<b class="${data.overdue.length ? 'is-alert' : ''}">${data.overdue.length ? 'Высокий' : 'Низкий'}</b></span></div>${line(data.overdue.length ? 82 : (data.debts.length ? 38 : 0), data.overdue.length ? 'red' : 'green')}<footer>План погашения <i>→</i></footer></button>
            <button class="v70-module-card is-trading" data-go="trading" type="button"><header><span>↗</span><b>Forex</b></header><small>Обучение и журнал</small><strong>${data.tradingProgress}%</strong>${line(data.tradingProgress, 'green')}<div class="v70-trade-fact"><span>Демо ${data.demoTrades.length}</span><span>Реальные ${data.realTrades.length}</span></div><footer>${data.tradingProgress ? 'Продолжить обучение' : 'Начать безопасно'} <i>→</i></footer></button>
            <button class="v70-module-card is-habits" data-go="habits" type="button"><header><span>◌</span><b>Привычки</b></header><div class="v70-habit-ring">${ring(data.habitProgress, `${data.doneHabits.length}/${data.habits.length}`)}</div><div class="v70-sleep-row"><span>Сон</span><b>${data.sleepHours ? `${data.sleepHours.toLocaleString('ru-RU')} ч` : '—'}</b></div><footer>Все привычки <i>→</i></footer></button>
          </section>

          <section class="v70-bottom-grid">
            <article class="v70-goal-card"><header><span>◇</span><h3>Цель → действие</h3></header><div><section><small>Цель</small><b>${escape(mainGoal?.title || 'Выберите фокусную цель')}</b>${line(data.goalProgress, 'green')}<em>${data.goalProgress}%</em></section><section><small>Текущий этап</small><b>${escape(mainGoal?.why || mainGoal?.area || 'Сформулируйте, зачем это важно')}</b></section><section><small>Следующее действие</small><b>${escape(nextGoalAction)}</b><button data-go="goals" type="button">→</button></section></div></article>
            <article class="v70-diary-card"><div><small>Дневник</small><h3>${phase === 'Вечер' ? 'Вечерняя рефлексия' : 'Короткая сверка с собой'}</h3><p>${phase === 'Вечер' ? 'Что получилось сегодня? Что можно улучшить завтра?' : 'Что сейчас действительно важно именно для вас?'}</p><button data-go="subconscious" type="button">Записать</button></div></article>
          </section>
        </main>

        <aside class="v70-assistant-rail">
          <section class="v70-assistant-card"><header><span>✦</span><h3>Ассистент</h3></header><article><small>Вы на верном пути.</small><p>Один фокусный шаг сейчас даст сильный результат завтра.</p></article><div><small>Рекомендации</small>${recommendations.length ? recommendations.map(item => `<button data-go="${escape(item.route || 'dashboard')}" type="button">• ${escape(item.directive || item.title)}</button>`).join('') : '<button data-go="tasks" type="button">• Сфокусируйтесь на одном деле</button><button data-go="debts" type="button">• Проверьте ближайший платёж</button><button data-go="trading-course" type="button">• 15 минут обучения Forex</button>'}</div><button data-v68-action="open-assistant" class="v70-open-assistant" type="button">Разобрать день →</button></section>
          <section class="v70-risk-card ${data.overdue.length ? 'is-alert' : ''}"><header><span>△</span><b>Риски</b></header><p>${escape(riskText)}</p><button data-go="${data.overdue.length ? 'debts' : (firstSignal?.route || 'dashboard')}" type="button">→</button></section>
          <section class="v70-rhythm-card"><header><h3>Ритм дня</h3><span>☀ ····· ☾</span></header><article class="is-active"><b>${escape(phase)}</b><p>${escape(phaseText)}</p></article><article><b>${phase === 'Вечер' ? 'Завтра утром' : 'Вечер'}</b><p>${phase === 'Вечер' ? 'Начните с одного ясного шага.' : 'Подведите итог без самокритики.'}</p></article></section>
        </aside>
      </div>
    </section>`;
  }

  function renderDashboard() {
    const route = (location.hash || '').replace('#', '') || 'dashboard';
    if (route !== 'dashboard') return;
    const view = document.getElementById('view');
    if (!view || view.querySelector('.v70-dashboard')) return;
    view.innerHTML = dashboardHtml();
  }

  function polish() {
    document.documentElement.classList.add('v70-root');
    document.body.classList.add('v70-living-os');
    document.body.dataset.sbosBuild = BUILD;
    document.body.dataset.v70Route = (location.hash || '').replace('#', '') || 'dashboard';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', BUILD);
    const lightTheme = document.documentElement.classList.contains('v70-theme-light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', lightTheme ? '#f3f6fa' : '#07111f');
    try { localStorage.setItem('secondBrainOS.currentBuild', BUILD); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version && version.textContent !== LABEL) version.textContent = LABEL;
    const core = document.querySelector('.v59-core-pill');
    if (core && core.textContent !== 'V70') core.textContent = 'V70';
    const dashboardLabel = document.querySelector('.v68-nav-quick [data-go="dashboard"] .label');
    if (dashboardLabel) dashboardLabel.textContent = 'Главное сейчас';
    const caption = document.querySelector('.v68-nav-caption');
    if (caption) caption.innerHTML = '<span>Мой центр жизни</span><small>личное · без работы по найму</small>';
  }

  function installPopovers() {
    if (document.body.dataset.v70Popovers === 'ready') return;
    document.body.dataset.v70Popovers = 'ready';
    const popover = document.createElement('div');
    popover.id = 'v70TooltipPopover';
    popover.className = 'v70-tooltip-popover';
    popover.setAttribute('role', 'tooltip');
    document.body.appendChild(popover);
    let active = null;

    const resolveTarget = origin => origin?.closest?.('[data-v70-tip],[title],button[aria-label],.v59-nav-item,.v68-nav-folder > summary,.v68-nav-subfolder > summary');
    const resolveText = target => {
      if (!target) return '';
      const nativeTitle = target.getAttribute('title');
      if (nativeTitle) {
        target.dataset.v70NativeTitle = nativeTitle;
        target.removeAttribute('title');
      }
      return text(target.dataset.v70Tip || target.dataset.v70NativeTitle || target.getAttribute('aria-label') || target.querySelector?.('.label,b')?.textContent || '');
    };
    const place = target => {
      const rect = target.getBoundingClientRect();
      const box = popover.getBoundingClientRect();
      const roomRight = innerWidth - rect.right;
      const left = roomRight > box.width + 18
        ? rect.right + 12
        : Math.max(12, Math.min(innerWidth - box.width - 12, rect.left + rect.width / 2 - box.width / 2));
      const top = roomRight > box.width + 18
        ? Math.max(12, Math.min(innerHeight - box.height - 12, rect.top + rect.height / 2 - box.height / 2))
        : Math.max(12, rect.top - box.height - 10);
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    };
    const show = origin => {
      const target = resolveTarget(origin);
      const label = resolveText(target);
      if (!target || !label || (target.matches('.v59-nav-item') && target.querySelector('.label') && innerWidth > 1180)) return;
      active = target;
      popover.textContent = label;
      popover.classList.add('is-visible');
      requestAnimationFrame(() => place(target));
    };
    const hide = origin => {
      if (origin && active && origin.closest?.('[data-v70-tip],[title],button[aria-label],.v59-nav-item,.v68-nav-folder > summary,.v68-nav-subfolder > summary') !== active) return;
      active = null;
      popover.classList.remove('is-visible');
    };
    document.addEventListener('pointerover', event => show(event.target), true);
    document.addEventListener('pointerout', event => {
      if (active && !active.contains(event.relatedTarget)) hide(active);
    }, true);
    document.addEventListener('focusin', event => show(event.target), true);
    document.addEventListener('focusout', event => hide(event.target), true);
    addEventListener('resize', () => active && place(active), { passive: true });
    addEventListener('scroll', () => active && place(active), { passive: true, capture: true });
  }

  function organizeNavigation() {
    const route = (location.hash || '').replace('#', '') || 'dashboard';
    if (lastNavRoute === route) return;
    lastNavRoute = route;
    const folders = [...document.querySelectorAll('.v68-nav-folder')];
    const activeFolder = folders.find(folder => [...folder.querySelectorAll('[data-go]')].some(button => button.dataset.go === route));
    folders.forEach(folder => { folder.open = folder === activeFolder; });
    if (activeFolder) {
      activeFolder.querySelectorAll('.v68-nav-subfolder').forEach(folder => {
        folder.open = [...folder.querySelectorAll('[data-go]')].some(button => button.dataset.go === route);
      });
    }
  }

  function installStableFolders() {
    if (document.body.dataset.v70StableFolders === 'ready') return;
    document.body.dataset.v70StableFolders = 'ready';
    const contentOf = folder => folder.classList.contains('v68-nav-folder')
      ? folder.querySelector(':scope > .v68-nav-folder-items')
      : folder.querySelector(':scope > div');
    const clearMotion = content => ['max-height', 'opacity', 'transform', 'padding-top', 'padding-bottom'].forEach(name => content.style.removeProperty(name));
    const animateFolder = (folder, shouldOpen) => {
      const content = contentOf(folder);
      if (!content || folder.dataset.v70Animating === (shouldOpen ? 'open' : 'close')) return;
      folder.dataset.v70Animating = shouldOpen ? 'open' : 'close';
      const duration = folder.classList.contains('v68-nav-folder') ? 380 : 320;
      if (shouldOpen) {
        folder.open = true;
        content.style.setProperty('max-height', '0px', 'important');
        content.style.setProperty('opacity', '0', 'important');
        content.style.setProperty('transform', 'translateY(-7px)', 'important');
        content.style.setProperty('padding-top', '0px', 'important');
        content.style.setProperty('padding-bottom', '0px', 'important');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          content.style.setProperty('max-height', `${content.scrollHeight + 18}px`, 'important');
          content.style.setProperty('opacity', '1', 'important');
          content.style.setProperty('transform', 'translateY(0)', 'important');
          content.style.setProperty('padding-top', '2px', 'important');
          content.style.setProperty('padding-bottom', '7px', 'important');
        }));
        setTimeout(() => { clearMotion(content); delete folder.dataset.v70Animating; }, duration + 45);
      } else {
        content.style.setProperty('max-height', `${content.getBoundingClientRect().height}px`, 'important');
        content.style.setProperty('opacity', '1', 'important');
        content.style.setProperty('transform', 'translateY(0)', 'important');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          content.style.setProperty('max-height', '0px', 'important');
          content.style.setProperty('opacity', '0', 'important');
          content.style.setProperty('transform', 'translateY(-7px)', 'important');
          content.style.setProperty('padding-top', '0px', 'important');
          content.style.setProperty('padding-bottom', '0px', 'important');
        }));
        setTimeout(() => {
          folder.open = false;
          clearMotion(content);
          delete folder.dataset.v70Animating;
        }, duration + 35);
      }
    };
    document.addEventListener('click', event => {
      const summary = event.target.closest?.('.v68-nav-folder > summary, .v68-nav-subfolder > summary');
      if (!summary) return;
      const folder = summary.parentElement;
      event.preventDefault();
      if (!folder.open) {
        const selector = folder.classList.contains('v68-nav-folder') ? '.v68-nav-folder' : '.v68-nav-subfolder';
        [...folder.parentElement.children].filter(item => item !== folder && item.matches?.(selector) && item.open).forEach(item => animateFolder(item, false));
      }
      animateFolder(folder, !folder.open);
    }, true);
    document.addEventListener('toggle', event => {
      const folder = event.target;
      if (!(folder instanceof HTMLDetailsElement)) return;
      folder.querySelector(':scope > summary')?.setAttribute('aria-expanded', String(folder.open));
    }, true);
  }

  function postRender() {
    polish();
    installPopovers();
    installStableFolders();
    organizeNavigation();
    renderDashboard();
    requestAnimationFrame(() => {
      document.body.classList.add('v70-ready');
      document.body.classList.remove('v70-booting');
    });
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(postRender, 35);
  }

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      const result = previousRender.apply(this, arguments);
      requestAnimationFrame(postRender);
      return result;
    };
  }

  const previousGo = typeof go === 'function' ? go : null;
  if (previousGo) {
    const navigateSmoothly = function (route) {
      const nextRoute = text(route) || 'dashboard';
      const currentRoute = (location.hash || '').replace('#', '') || 'dashboard';
      if (nextRoute === currentRoute) return previousGo.apply(this, arguments);
      if (document.body.classList.contains('v70-route-transitioning')) {
        document.body.classList.remove('v70-route-transitioning', 'v70-route-fallback');
      }
      const context = this;
      const args = arguments;
      const changeRoute = () => previousGo.apply(context, args);
      document.body.classList.add('v70-route-transitioning');
      document.body.classList.add('v70-route-fallback');
      const release = () => document.body.classList.remove('v70-route-fallback', 'v70-route-transitioning');
      const watchdog = setTimeout(release, 720);
      setTimeout(() => {
        changeRoute();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          clearTimeout(watchdog);
          release();
        }));
      }, 105);
    };
    window.v70Navigate = navigateSmoothly;
    go = navigateSmoothly;
  }

  window.addEventListener('hashchange', () => [0, 90, 260].forEach(delay => setTimeout(postRender, delay)));
  const app = document.getElementById('app');
  if (app) new MutationObserver(schedule).observe(app, { childList: true, subtree: true });
  if (document.body) new MutationObserver(() => {
    if (document.body.dataset.sbosBuild !== BUILD) schedule();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-sbos-build'] });

  window.SecondBrainLiving = { postRender, dashboard: dashboardHtml };
  postRender();
  [120, 500, 1400, 3000, 5200].forEach(delay => setTimeout(postRender, delay));
  setInterval(() => { if (document.visibilityState === 'visible') postRender(); }, 1600);
})();
