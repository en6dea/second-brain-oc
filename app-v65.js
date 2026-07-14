'use strict';

(() => {
  const V65_BUILD = 'second-brain-space-v65-premium-life-20260714-5';
  const V65_LABEL = 'V65 · PREMIUM LIFE OS';
  let polishQueued = false;
  const HIDDEN_ROUTES = new Set(['daily', 'command', 'focus-path', 'attention', 'learning', 'reviews', 'expense-review', 'global-search', 'diagnostics', 'polina']);

  const list = key => Array.isArray(state?.[key]) ? state[key] : [];
  const text = value => String(value || '').trim();
  const lower = value => text(value).toLocaleLowerCase('ru-RU');
  const statusDone = item => ['готово', 'сделано', 'закрыт', 'закрыто', 'done', 'выполнено'].includes(lower(item?.status));
  const personalOnly = item => !/(^|\s)(работа|работы|работе|работу|рабоч\w*|найм\w*)(\s|$)/i.test(`${item?.area || ''} ${item?.role || ''} ${item?.kind || ''} ${item?.folder || ''}`);
  const matches = (item, pattern) => pattern.test(`${item?.title || ''} ${item?.name || ''} ${item?.area || ''} ${item?.category || ''} ${item?.note || ''}`);
  const uniq = items => items.filter((item, index, all) => all.findIndex(other => String(other?.id) === String(item?.id)) === index);
  state.settings = state.settings || {};
  state.settings.v65 = Object.assign({ incomeGoal: 300000, incomeGoalDeadline: '2026-12-31', debtMonthlyBudget: 0, syncPreference: 'devices', taskPostponeWarning: 3 }, state.settings.v65 || {});
  try {
    const debtFields = schemas?.debt?.fields;
    if (Array.isArray(debtFields) && !debtFields.some(field => field[0] === 'rate')) debtFields.splice(5, 0, ['rate', 'Ставка, % годовых', 'number']);
    if (Array.isArray(debtFields) && !debtFields.some(field => field[0] === 'minPayment')) debtFields.splice(6, 0, ['minPayment', 'Минимальный платёж', 'number']);
    const taskFields = schemas?.task?.fields;
    if (Array.isArray(taskFields) && !taskFields.some(field => field[0] === 'fixed')) {
      const noteIndex = taskFields.findIndex(field => field[0] === 'note');
      taskFields.splice(noteIndex < 0 ? taskFields.length : noteIndex, 0, ['fixed', 'Можно ли переносить', 'select', [['false', 'Да, помощник может предложить перенос'], ['true', 'Нет, задача закреплена']]]);
    }
  } catch (error) {}
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };
  const shortDate = date => date ? new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'без даты';
  const escapeId = value => esc(String(value || ''));
  const countLabel = (value, one, few, many) => {
    const number = Math.abs(Number(value) || 0) % 100;
    const last = number % 10;
    if (number > 10 && number < 20) return `${value} ${many}`;
    if (last === 1) return `${value} ${one}`;
    if (last > 1 && last < 5) return `${value} ${few}`;
    return `${value} ${many}`;
  };

  function taskPriority(item) {
    return ({ A: 1, B: 2, C: 3, D: 4 }[item?.priority] || 9) * 100000 + (item?.time ? Number(item.time.replace(':', '')) || 9999 : 9999);
  }

  const taskFixed = item => item?.fixed === true || item?.fixed === 'true' || item?.fixed === 1 || item?.fixed === '1';
  const postponeThreshold = () => Math.max(2, num(state.settings?.v65?.taskPostponeWarning) || 3);

  function v65Sphere({ id, icon, title, value, detail, tone }) {
    return `<button class="v65-sphere ${tone}" data-go="${id}" type="button">
      <span class="v65-sphere-icon" aria-hidden="true">${icon}</span>
      <span class="v65-sphere-copy"><b>${esc(title)}</b><small>${esc(detail)}</small></span>
      <strong>${esc(value)}</strong>
      <span class="v65-sphere-arrow" aria-hidden="true">↗</span>
    </button>`;
  }

  function v65TimelineRow(item) {
    const overdue = item.date && item.date < today() && !statusDone(item);
    const time = item.time || (overdue ? 'сейчас' : 'в течение дня');
    return `<button class="v65-timeline-row ${overdue ? 'is-overdue' : ''}" data-action="editRecord" data-type="task" data-id="${escapeId(item.id)}" type="button">
      <time>${esc(time)}</time>
      <span class="v65-timeline-mark" aria-hidden="true"></span>
      <span class="v65-timeline-copy"><b>${esc(item.title || 'Задача')}</b><small>${esc(item.area || 'Личное')} · ${shortDate(item.date)}</small></span>
      <span class="v65-row-status">${overdue ? 'просрочено' : (item.priority === 'A' ? 'важно' : 'план')}</span>
    </button>`;
  }

  function v65WeekRhythm(habits, tasks) {
    const days = Array.from({ length: 7 }, (_, index) => iso(addDays(new Date(), index - 6)));
    const max = Math.max(1, ...days.map(date => habits.filter(habit => habit.marks?.[date]).length + tasks.filter(task => task.date === date && statusDone(task)).length));
    return days.map(date => {
      const doneHabits = habits.filter(habit => habit.marks?.[date]).length;
      const doneTasks = tasks.filter(task => task.date === date && statusDone(task)).length;
      const activity = doneHabits + doneTasks;
      const height = activity ? Math.max(18, Math.round(activity / max * 100)) : 8;
      const label = new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', '');
      return `<div class="v65-week-day ${date === today() ? 'is-today' : ''}" aria-label="${esc(label)}: ${activity} выполнено"><span><i style="height:${height}%"></i></span><small>${esc(label)}</small></div>`;
    }).join('');
  }

  function v65AssistantModel() {
    const habits = list('habits').filter(personalOnly);
    const pendingHabits = habits.filter(item => !item.marks?.[today()]);
    const operations = list('operations');
    const debts = activeDebts();
    const outgoing = debts.filter(item => item.direction === 'out');
    const overdueDebts = outgoing.filter(item => item.due && item.due < today());
    const weekEnd = iso(addDays(new Date(), 7));
    const dueSoon = outgoing.filter(item => item.due && item.due >= today() && item.due <= weekEnd);
    const goals = list('goals').filter(personalOnly).filter(item => !statusDone(item));
    const goalsWithoutStep = goals.filter(goal => !list('tasks').some(task => String(task.goalId || '') === String(goal.id) && !statusDone(task)));
    const openTasks = list('tasks').filter(personalOnly).filter(item => !statusDone(item));
    const overdueTasks = openTasks.filter(item => item.date && item.date < today());
    const todayOpen = openTasks.filter(item => item.date === today());
    const taskLoad = uniq([...overdueTasks, ...todayOpen]);
    const stuckTasks = openTasks.filter(item => num(item.postponeCount) >= postponeThreshold());
    const financeReady = operations.length > 0 || num(state.settings?.currentBalance) !== 0 || debts.length > 0;
    const finance = financeTotals(periodInfo('month'));
    const forecast = finance.netWithUpcoming ?? finance.net ?? 0;
    const diaryToday = list('subconsciousEntries').some(entry => entry.date === today());
    const items = [
      {
        id: 'finance', icon: '₽', title: 'Финансы', route: 'finance',
        value: financeReady ? money(forecast) : '—',
        detail: financeReady ? (forecast < 0 ? 'прогноз месяца ниже нуля' : 'прогноз по внесённым данным') : 'ожидают вашей выгрузки',
        tone: financeReady && forecast < 0 ? 'alert' : 'calm'
      },
      {
        id: 'debts', icon: '↙', title: 'Долги', route: 'debts',
        value: outgoing.length ? money(outgoing.reduce((sum, item) => sum + num(item.amount), 0)) : '—',
        detail: overdueDebts.length ? `${overdueDebts.length} просрочено` : (dueSoon.length ? `${dueSoon.length} сроков в ближайшие 7 дней` : (outgoing.length ? 'ближайших сроков нет' : 'активных долгов нет')),
        tone: overdueDebts.length ? 'alert' : (dueSoon.length ? 'warn' : 'ok')
      },
      {
        id: 'habits', icon: '◎', title: 'Привычки', route: 'habits',
        value: habits.length ? `${habits.length - pendingHabits.length}/${habits.length}` : '—',
        detail: habits.length ? (pendingHabits.length ? `${pendingHabits.length} ещё не отмечено сегодня` : 'ритм на сегодня выполнен') : 'ритм пока не задан',
        tone: habits.length && !pendingHabits.length ? 'ok' : 'calm'
      },
      {
        id: 'tasks', icon: '✓', title: 'Задачи', route: 'tasks',
        value: String(taskLoad.length),
        detail: overdueTasks.length ? `${overdueTasks.length} просрочено — сначала критичное` : (stuckTasks.length ? `${countLabel(stuckTasks.length, 'задача переносилась', 'задачи переносились', 'задач переносились')} ${postponeThreshold()}+ раз` : (taskLoad.length > 6 ? 'день перегружен — предлагаю сократить план' : (taskLoad.length ? 'нагрузка дня выглядит выполнимой' : 'обязательных задач на сегодня нет'))),
        tone: overdueTasks.length ? 'alert' : (stuckTasks.length || taskLoad.length > 6 ? 'warn' : 'calm')
      },
      {
        id: 'goals', icon: '↗', title: 'Цели', route: 'goals',
        value: String(goals.length),
        detail: goalsWithoutStep.length ? `${goalsWithoutStep.length} без следующего шага` : (goals.length ? 'у каждой есть активный шаг' : 'можно добавить первую цель'),
        tone: goalsWithoutStep.length ? 'warn' : 'calm'
      }
    ];
    const priority = items.find(item => item.tone === 'alert') || items.find(item => item.tone === 'warn') || items.find(item => item.id === 'habits' && pendingHabits.length) || items[0];
    const voice = items.some(item => item.tone === 'alert')
      ? 'Сейчас говорю прямо: сначала закрываем риск, затем возвращаемся к обычному ритму.'
      : taskLoad.length > 6
        ? 'День выглядит перегруженным. Я предложу убрать менее важное, но ничего не переставлю без подтверждения.'
        : 'Темп спокойный: можно двигаться без давления и добавить только один следующий шаг.';
    return { items, priority, diaryToday, taskLoad, voice };
  }

  function v65AssistantStrip(model) {
    return `<section class="v65-assistant-strip">
      <div class="v65-assistant-lead"><span class="v65-assistant-orb" aria-hidden="true">✦</span><div><span class="v65-overline">Внутренний помощник</span><h3>${esc(model.priority.title)} · ${esc(model.priority.detail)}</h3><p>${esc(model.voice)}</p></div></div>
      <div class="v65-assistant-actions"><button data-v65-action="openAssistant" type="button">Разобрать всё</button><button data-v65-action="openDayPlan" type="button">План утра</button><button data-v65-action="openEveningReview" type="button">Итог вечера</button></div>
    </section>`;
  }

  function v65OpenAssistant() {
    const model = v65AssistantModel();
    openModal('Внутренний помощник', `<div class="v65-assistant-modal">
      <div class="v65-assistant-intro"><span>✦</span><div><h3>Пять главных контуров</h3><p>${esc(model.voice)} Выводы построены только на ваших сохранённых данных.</p></div><button data-v65-action="openDayPlan" type="button">Предложить порядок дня</button></div>
      <div class="v65-assistant-grid">${model.items.map(item => `<article class="v65-assistant-signal is-${item.tone}"><div><span>${item.icon}</span><small>${esc(item.title)}</small></div><strong>${esc(item.value)}</strong><p>${esc(item.detail)}</p><button data-v65-action="openSection" data-route="${esc(item.route)}" type="button">Открыть раздел</button></article>`).join('')}</div>
      <article class="v65-assistant-diary"><div><span>🪞</span><div><b>Дневник подсознания</b><small>${model.diaryToday ? 'сегодняшний отклик сохранён' : 'сегодняшнего отклика пока нет'}</small></div></div><button data-v65-action="openSection" data-route="subconscious" type="button">${model.diaryToday ? 'Открыть' : 'Записать отклик'}</button></article>
      <p class="v65-assistant-disclaimer">Это инструмент самоанализа и планирования, а не медицинская или психологическая диагностика.</p>
    </div>`);
  }

  function v65OpenDayPlan() {
    const tasks = list('tasks').filter(personalOnly).filter(item => !statusDone(item));
    const relevant = tasks.filter(item => !item.date || item.date <= today()).sort((a, b) => {
      const aOverdue = a.date && a.date < today() ? 0 : 1;
      const bOverdue = b.date && b.date < today() ? 0 : 1;
      return aOverdue - bOverdue || Number(taskFixed(b)) - Number(taskFixed(a)) || taskPriority(a) - taskPriority(b) || String(a.date || '').localeCompare(String(b.date || ''));
    });
    const overload = relevant.length > 6;
    const candidates = overload ? relevant.filter((item, index) => index >= 6 && item.date === today() && !taskFixed(item) && ['C', 'D'].includes(item.priority || 'B')) : [];
    const planRows = relevant.slice(0, 6).map((item, index) => `<article><span>${index + 1}</span><div><b>${esc(item.title || 'Задача')}</b><small>${item.date && item.date < today() ? 'просрочено · ' : ''}${esc(item.priority || 'B')} · ${esc(item.area || 'Личное')} · ${shortDate(item.date)}${taskFixed(item) ? ' · закреплена' : ''}${num(item.postponeCount) ? ` · переносов: ${num(item.postponeCount)}` : ''}</small></div></article>`).join('') || '<p>На сегодня обязательных задач нет.</p>';
    const postponeRows = candidates.length ? `<section class="v65-postpone"><div><span class="v65-overline">Можно убрать из перегруженного дня</span><h3>Перенести выбранное на завтра</h3><p>Помощник выбрал только незакреплённые задачи с низким приоритетом C/D. Вы можете снять любую галочку.</p></div><div class="v65-postpone-list">${candidates.map(item => `<label><input class="v65-postpone-check" type="checkbox" value="${escapeId(item.id)}" checked><span><b>${esc(item.title || 'Задача')}</b><small>${esc(item.priority || 'D')} · ${esc(item.area || 'Личное')}${num(item.postponeCount) ? ` · уже переносилась ${num(item.postponeCount)} раз` : ''}</small></span></label>`).join('')}</div></section>` : (overload ? '<section class="v65-postpone is-empty"><b>Безопасных кандидатов на перенос нет</b><p>Просроченные, закреплённые и задачи A/B помощник оставил на месте. Изменить их можно вручную в разделе задач.</p></section>' : '');
    openModal('Предлагаемый порядок дня', `<div class="v65-plan-modal"><div class="v65-plan-summary ${overload ? 'is-warn' : ''}"><span>${overload ? '!' : '✓'}</span><div><h3>${overload ? 'День стоит сократить' : 'Нагрузка выглядит выполнимой'}</h3><p>${overload ? 'Показываю шесть первых пунктов по сроку и приоритету. Ничего не переношу без вашего подтверждения.' : 'Сначала просроченное и закреплённое, затем приоритет A и остальные личные задачи.'}</p></div></div><div class="v65-plan-list">${planRows}</div>${postponeRows}<p class="v65-assistant-disclaimer">Каждый перенос сохраняется в истории задачи. После ${postponeThreshold()} переносов помощник отдельно предупредит, что задача застряла.</p><div class="v65-plan-actions">${candidates.length ? '<button data-v65-action="applyPostponements" type="button">Перенести выбранные</button>' : '<button data-v65-action="openSection" data-route="tasks" type="button">Открыть задачи</button>'}<button data-v65-action="closeModal" type="button">Оставить как есть</button></div></div>`);
  }

  function v65ApplyPostponements() {
    const selected = [...document.querySelectorAll('.v65-postpone-check:checked')].map(input => input.value);
    if (!selected.length) return toast('Выберите хотя бы одну задачу');
    const destination = iso(addDays(new Date(), 1));
    if (!window.confirm(`Перенести выбранные задачи (${selected.length}) на ${fmt(destination)}?`)) return;
    const at = new Date().toISOString();
    const warnedIds = [];
    state.tasks = list('tasks').map(item => {
      if (!selected.includes(String(item.id)) || taskFixed(item) || item.date !== today()) return item;
      const postponeCount = num(item.postponeCount) + 1;
      if (postponeCount >= postponeThreshold()) warnedIds.push(String(item.id));
      return {
        ...item,
        date: destination,
        postponeCount,
        lastPostponedAt: at,
        postponeHistory: [...(Array.isArray(item.postponeHistory) ? item.postponeHistory : []), { from: item.date, to: destination, at }].slice(-20)
      };
    });
    save(); closeModal(); render();
    toast(warnedIds.length ? `Перенесено. ${warnedIds.length} задач требуют решения` : `Перенесено задач: ${selected.length}`);
    if (warnedIds.length) setTimeout(() => v65OpenStuckTask(warnedIds[0], warnedIds.length), 120);
  }

  function v65OpenStuckTask(id, total = 1) {
    const task = list('tasks').find(item => String(item.id) === String(id));
    if (!task) return;
    const nextDate = task.date || iso(addDays(new Date(), 1));
    openModal('Задача переносится снова', `<div class="v65-stuck-task"><section><span>↻</span><div><small>${num(task.postponeCount)} переносов${total > 1 ? ` · ещё ${total - 1}` : ''}</small><h3>${esc(task.title || 'Задача')}</h3><p>Помощник не принимает решение без подтверждения. Выберите, что действительно поможет.</p></div></section><label><span>Минимальная версия или первый шаг</span><input id="v65_stuck_step" value="" placeholder="Например: открыть урок и пройти 15 минут"></label><label><span>Новая конкретная дата</span><input id="v65_stuck_date" type="date" value="${esc(nextDate)}"></label><div class="v65-stuck-actions"><button data-v65-action="resolveStuckTask" data-mode="simplify" data-id="${esc(task.id)}" type="button">Упростить</button><button data-v65-action="resolveStuckTask" data-mode="split" data-id="${esc(task.id)}" type="button">Разбить на шаги</button><button data-v65-action="resolveStuckTask" data-mode="date" data-id="${esc(task.id)}" type="button">Назначить дату</button><button class="is-danger" data-v65-action="resolveStuckTask" data-mode="archive" data-id="${esc(task.id)}" type="button">Убрать в архив</button></div><p class="v65-assistant-disclaimer">При удалении задача сначала сохраняется в архиве, поэтому данные не теряются.</p></div>`);
  }

  function v65ResolveStuckTask(id, mode) {
    const task = list('tasks').find(item => String(item.id) === String(id));
    if (!task) return closeModal();
    const originalTitle = task.title || 'Задача';
    const step = document.getElementById('v65_stuck_step')?.value?.trim() || '';
    const newDate = document.getElementById('v65_stuck_date')?.value || task.date || today();
    if ((mode === 'simplify' || mode === 'split') && !step) return toast('Запишите минимальную версию или первый шаг');
    if (mode === 'simplify') {
      task.title = step;
      task.priority = ['A', 'B'].includes(task.priority) ? task.priority : 'B';
      task.postponeResolution = { type: 'simplified', at: new Date().toISOString(), previousTitle: originalTitle };
    }
    if (mode === 'split') {
      state.tasks.unshift({ id: uid(), title: step, area: task.area || 'Личное', date: newDate, time: task.time || '', priority: task.priority || 'B', status: 'Активно', fixed: false, parentTaskId: task.id, note: `Первый шаг для: ${task.title}`, createdAt: new Date().toISOString() });
      task.note = `${task.note || ''}${task.note ? '\n' : ''}Разбита на шаги ${new Date().toLocaleDateString('ru-RU')}`;
    }
    if (mode === 'date') task.date = newDate;
    if (mode === 'archive') {
      if (!window.confirm('Убрать задачу из активного списка? Копия останется в архиве.')) return;
      state.archive = list('archive');
      state.archive.unshift({ ...task, id: `archived-${task.id}-${Date.now().toString(36)}`, archivedFrom: 'tasks', originalId: task.id, archivedAt: new Date().toISOString() });
      state.tasks = list('tasks').filter(item => String(item.id) !== String(id));
    } else {
      task.postponeResolvedAt = new Date().toISOString();
      task.postponeResolutionType = mode;
    }
    save(); closeModal(); render(); toast(mode === 'archive' ? 'Задача сохранена в архиве' : 'Решение по задаче сохранено');
  }

  function v65OpenEveningReview() {
    state.dailyReviews = list('dailyReviews');
    const existing = state.dailyReviews.find(item => item.date === today()) || {};
    const completed = list('tasks').filter(personalOnly).filter(item => item.date === today() && statusDone(item)).length;
    const habits = list('habits').filter(personalOnly);
    const habitsDone = habits.filter(item => item.marks?.[today()]).length;
    const expenses = list('operations').filter(item => item.type === 'expense' && item.date === today()).reduce((sum, item) => sum + num(item.amount), 0);
    openModal('Короткий итог вечера', `<div class="v65-evening-review"><section><span class="v65-overline">Только факты · 2–3 минуты</span><h3>Закрыть день без длинного отчёта</h3><p>Помощник сохранит итог отдельно от дневника подсознания.</p></section><div class="v65-evening-facts"><article><span>Задачи</span><b>${completed}</b><small>выполнено сегодня</small></article><article><span>Привычки</span><b>${habitsDone}/${habits.length}</b><small>отмечено сегодня</small></article><article><span>Расходы</span><b>${expenses ? money(expenses) : '—'}</b><small>по внесённым операциям</small></article></div><label class="v65-evening-score"><span>Оценка дня · 1–10</span><input id="v65_evening_score" type="number" min="1" max="10" step="1" value="${esc(existing.score || '')}" placeholder="Например, 7"><small>Это ваша субъективная оценка, а не рейтинг продуктивности.</small></label><label><span>Что сегодня получилось?</span><textarea id="v65_evening_win" placeholder="Один короткий факт…">${esc(existing.win || '')}</textarea></label><label><span>Что перенеслось и почему?</span><textarea id="v65_evening_move" placeholder="Без самокритики: причина и решение…">${esc(existing.moved || '')}</textarea></label><label><span>Первый шаг завтра</span><input id="v65_evening_first" value="${esc(existing.firstStep || '')}" placeholder="Одно конкретное действие"></label><div class="v65-plan-actions"><button data-v65-action="saveEveningReview" type="button">Сохранить итог</button><button data-v65-action="closeModal" type="button">Закрыть</button></div></div>`);
  }

  function v65SaveEveningReview() {
    state.dailyReviews = list('dailyReviews');
    const value = id => document.getElementById(id)?.value?.trim() || '';
    const existing = state.dailyReviews.find(item => item.date === today()) || {};
    const score = num(value('v65_evening_score'));
    if (score < 1 || score > 10) return toast('Оцените день от 1 до 10');
    const review = { ...existing, id: existing.id || uid(), date: today(), score, win: value('v65_evening_win'), moved: value('v65_evening_move'), firstStep: value('v65_evening_first'), updatedAt: new Date().toISOString() };
    if (!review.win && !review.moved && !review.firstStep) return toast('Добавьте хотя бы один короткий итог');
    state.dailyReviews = [review, ...state.dailyReviews.filter(item => item.date !== today())];
    save(); closeModal(); render(); toast('Итог дня сохранён');
  }

  const DIARY_STOP_WORDS = new Set('который которая которые этого чтобы потому очень просто сегодня сейчас потом только когда если меня тебе себя было были будет этот эта еще уже как для про что чем или при без над под мой моя мои ваше наш там тут где день дней один одна'.split(' '));
  const diaryText = entry => [entry.trigger, entry.emotion, entry.body, entry.thought, entry.fear, entry.cause, entry.pattern, entry.need, entry.summary, entry.nextStep, entry.promise, ...(Array.isArray(entry.answers) ? entry.answers : [])].filter(Boolean).join(' ');

  function v65DiaryThemes(entries) {
    const counts = new Map();
    entries.forEach(entry => diaryText(entry).toLocaleLowerCase('ru-RU').match(/[а-яёa-z]{4,}/giu)?.forEach(word => {
      if (!DIARY_STOP_WORDS.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
    }));
    return [...counts.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru')).slice(0, 6);
  }

  function v65DiaryStats(entries) {
    const dates = new Set(entries.map(entry => entry.date));
    let streak = 0;
    let date = new Date(`${today()}T12:00:00`);
    while (dates.has(iso(date))) { streak += 1; date = addDays(date, -1); }
    const moods = entries.map(entry => num(entry.mood)).filter(value => value > 0);
    return { streak, average: moods.length ? (moods.reduce((sum, value) => sum + value, 0) / moods.length).toFixed(1) : '—' };
  }

  function v65SubconsciousPage() {
    state.settings = state.settings || {};
    state.subconsciousEntries = list('subconsciousEntries');
    const entries = state.subconsciousEntries.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const currentDate = state.settings.subconsciousCurrentDate || today();
    const entry = entries.find(item => item.date === currentDate) || { date: currentDate };
    const stats = v65DiaryStats(entries);
    const themes = v65DiaryThemes(entries.slice(0, 30));
    const legacyAnswers = Array.isArray(entry.answers) ? entry.answers.filter(Boolean) : [];
    return layout('Дневник подсознания', 'Спокойная фиксация состояния, повторяющихся тем и одного бережного следующего шага.', `
      <section class="v65-diary-page">
        <div class="v65-diary-stats"><article><span>Записей</span><strong>${entries.length}</strong><small>вся история сохранена</small></article><article><span>Ритм</span><strong>${stats.streak}</strong><small>дней подряд</small></article><article><span>Состояние</span><strong>${stats.average}</strong><small>среднее по записям</small></article><article><span>Сегодня</span><strong>${entries.some(item => item.date === today()) ? '✓' : '—'}</strong><small>${entries.some(item => item.date === today()) ? 'отклик есть' : 'можно заполнить'}</small></article></div>
        <div class="v65-diary-layout">
          <article class="v65-diary-editor">
            <div class="v65-diary-head"><div><span class="v65-overline">Отклик дня</span><h2>${fmt(currentDate)}</h2><p>Можно отвечать коротко. Важна честная фиксация, а не идеальная формулировка.</p></div><span class="v65-diary-time">5–7 минут</span></div>
            <div class="v65-diary-fields v65-diary-fields-three"><label><span>Дата</span><input id="v65_diary_date" type="date" value="${esc(currentDate)}"></label><label><span>Состояние · 1–10</span><input id="v65_diary_mood" type="number" min="1" max="10" value="${esc(entry.mood || '')}"></label><label><span>Энергия · 1–10</span><input id="v65_diary_energy" type="number" min="1" max="10" value="${esc(entry.energy || '')}"></label></div>
            <div class="v65-diary-fields"><label><span>Главная эмоция</span><input id="v65_diary_emotion" value="${esc(entry.emotion || '')}" placeholder="Например: спокойствие, тревога, радость"></label><label><span>Что произошло или зацепило?</span><textarea id="v65_diary_trigger" placeholder="Ситуация без оценки и обвинений…">${esc(entry.trigger || '')}</textarea></label><label><span>Что я заметил в теле?</span><textarea id="v65_diary_body" placeholder="Напряжение, лёгкость, усталость, тепло…">${esc(entry.body || '')}</textarea></label><label><span>Какая мысль появилась автоматически?</span><textarea id="v65_diary_thought" placeholder="Запишите мысль как она прозвучала…">${esc(entry.thought || '')}</textarea></label><label><span>Чего я боялся или избегал?</span><textarea id="v65_diary_fear" placeholder="Страх, ожидание или то, от чего хотелось уйти…">${esc(entry.fear || '')}</textarea></label><label><span>Почему я мог так отреагировать?</span><textarea id="v65_diary_cause" placeholder="Возможная причина своими словами, без диагноза…">${esc(entry.cause || '')}</textarea></label><label><span>Какой сценарий повторяется?</span><textarea id="v65_diary_pattern" placeholder="Например: откладываю разговор, когда боюсь конфликта…">${esc(entry.pattern || '')}</textarea></label><label><span>Какая потребность за этим стоит?</span><textarea id="v65_diary_need" placeholder="Безопасность, отдых, ясность, близость, свобода…">${esc(entry.need || '')}</textarea></label><label class="v65-diary-required"><span>Что я понял? · обязательно</span><textarea id="v65_diary_summary" placeholder="Один честный практический вывод…">${esc(entry.summary || '')}</textarea></label><label class="v65-diary-required"><span>Одно действие · обязательно</span><textarea id="v65_diary_next" placeholder="Что конкретно сделать без перегруза?">${esc(entry.nextStep || entry.promise || '')}</textarea></label></div>
            ${legacyAnswers.length ? `<details class="v65-diary-legacy"><summary>Ранее сохранённые ответы (${legacyAnswers.length})</summary>${legacyAnswers.map((answer, index) => `<p><b>${index + 1}.</b> ${esc(answer)}</p>`).join('')}</details>` : ''}
            <div class="v65-diary-actions"><button class="v65-primary-action" data-v65-action="saveDiary" type="button">Сохранить отклик</button><button data-v65-action="diaryDate" data-direction="-1" type="button">← Предыдущий день</button><button data-v65-action="diaryToday" type="button">Сегодня</button><button data-v65-action="diaryDate" data-direction="1" type="button">Следующий день →</button>${entry.id ? '<button class="is-danger" data-v65-action="deleteDiary" type="button">Удалить запись</button>' : ''}</div>
          </article>
          <aside class="v65-diary-rail">
            <article class="v65-diary-insight"><span class="v65-overline">Повторяющиеся темы</span><h3>Слова из ваших записей</h3>${themes.length ? `<div class="v65-theme-list">${themes.map(([word, count]) => `<span>${esc(word)} <b>${count}</b></span>`).join('')}</div><p>Показаны часто повторяющиеся слова без интерпретации и диагнозов.</p>` : '<p>После нескольких содержательных записей здесь появятся повторяющиеся темы.</p>'}</article>
            <article class="v65-diary-history"><div class="v65-diary-history-head"><div><span class="v65-overline">История</span><h3>Последние отклики</h3></div><span>${entries.length}</span></div><div>${entries.slice(0, 12).map(item => `<button data-v65-action="openDiary" data-date="${esc(item.date)}" type="button"><span><b>${fmt(item.date)}</b><small>состояние ${esc(item.mood || '—')} · энергия ${esc(item.energy || '—')}</small></span><em>${esc((item.summary || item.emotion || 'отклик').slice(0, 48))}</em></button>`).join('') || '<p class="v65-diary-empty">Пока нет записей. Начните с сегодняшнего состояния.</p>'}</div></article>
            <article class="v65-diary-note"><b>Важно</b><p>Дневник помогает замечать собственные закономерности, но не ставит диагнозы. При тяжёлом или длительном состоянии лучше обратиться к квалифицированному специалисту.</p></article>
          </aside>
        </div>
      </section>`);
  }

  function v65ShowDiary() {
    const route = (location.hash || '').replace('#', '') || page || 'dashboard';
    if (route !== 'subconscious') return;
    const view = document.getElementById('view');
    if (view && !view.querySelector('.v65-diary-page')) view.innerHTML = v65SubconsciousPage();
  }

  function v65SaveDiary() {
    state.settings = state.settings || {};
    state.subconsciousEntries = list('subconsciousEntries');
    const date = document.getElementById('v65_diary_date')?.value || today();
    const existing = state.subconsciousEntries.find(item => item.date === date) || {};
    const value = id => document.getElementById(id)?.value?.trim() || '';
    const record = { ...existing, id: existing.id || uid(), date, mood: value('v65_diary_mood'), energy: value('v65_diary_energy'), emotion: value('v65_diary_emotion'), trigger: value('v65_diary_trigger'), body: value('v65_diary_body'), thought: value('v65_diary_thought'), fear: value('v65_diary_fear'), cause: value('v65_diary_cause'), pattern: value('v65_diary_pattern'), need: value('v65_diary_need'), summary: value('v65_diary_summary'), nextStep: value('v65_diary_next'), promise: value('v65_diary_next'), updatedAt: new Date().toISOString() };
    if (!record.summary || !record.nextStep) return toast('Добавьте один вывод и одно конкретное действие');
    state.subconsciousEntries = [record, ...state.subconsciousEntries.filter(item => item.date !== date)];
    state.settings.subconsciousCurrentDate = date;
    save(); render(); setTimeout(v65ShowDiary, 0); toast('Отклик сохранён');
  }

  function v65SetDiaryDate(date) {
    state.settings = state.settings || {};
    state.settings.subconsciousCurrentDate = date;
    save(); render(); setTimeout(v65ShowDiary, 0);
  }

  function v65DeleteDiary() {
    const date = state.settings?.subconsciousCurrentDate || today();
    if (!window.confirm(`Удалить отклик за ${fmt(date)}? Остальные записи останутся без изменений.`)) return;
    state.subconsciousEntries = list('subconsciousEntries').filter(item => item.date !== date);
    save(); render(); setTimeout(v65ShowDiary, 0); toast('Отклик удалён');
  }

  function v65PreviousPeriod(period) {
    const start = new Date(`${period.start}T12:00:00`);
    const end = new Date(`${period.end}T12:00:00`);
    const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
    const previousEnd = addDays(start, -1);
    const previousStart = addDays(previousEnd, -(days - 1));
    return { start: iso(previousStart), end: iso(previousEnd), title: 'предыдущий равный период' };
  }

  function v65CategoryTotals(period) {
    const result = {};
    list('operations').filter(item => item.type === 'expense' && inPeriod(item.date, period)).forEach(item => {
      const category = text(item.category) || 'Без категории';
      result[category] = (result[category] || 0) + num(item.amount);
    });
    return result;
  }

  function v65FinancePage() {
    const period = periodInfo(state.settings.financePeriod || 'month');
    const previous = v65PreviousPeriod(period);
    const totals = financeTotals(period);
    const currentBalance = num(state.settings.currentBalance);
    const outgoing = activeDebts().filter(item => item.direction === 'out');
    const obligations = outgoing.filter(item => item.due && item.due <= period.end);
    const obligationTotal = obligations.reduce((sum, item) => sum + num(item.amount), 0);
    const planned = list('purchases').filter(item => item.includeInBudget !== false && inPeriod(item.date, period));
    const plannedTotal = planned.reduce((sum, item) => sum + num(item.amount), 0);
    const hasFacts = list('operations').length > 0 || currentBalance !== 0 || outgoing.length > 0 || planned.length > 0;
    const periodStillOpen = period.end >= today();
    const budgetStart = period.start > today() ? period.start : today();
    const daysLeft = periodStillOpen ? Math.max(1, Math.round((new Date(`${period.end}T12:00:00`) - new Date(`${budgetStart}T12:00:00`)) / 86400000) + 1) : 0;
    const freeAfterPlans = currentBalance - obligationTotal - plannedTotal;
    const dayLimit = hasFacts && daysLeft ? Math.max(0, freeAfterPlans / daysLeft) : null;
    const weekLimit = dayLimit === null ? null : dayLimit * 7;
    const forecast = totals.netWithUpcoming ?? (currentBalance + totals.inc - totals.exp - plannedTotal);
    const currentCategories = v65CategoryTotals(period);
    const previousCategories = v65CategoryTotals(previous);
    const categoryRows = Object.entries(currentCategories).map(([name, amount]) => ({ name, amount, previous: previousCategories[name] || 0, delta: amount - (previousCategories[name] || 0) })).sort((a, b) => b.amount - a.amount).slice(0, 7);
    const hasPreviousExpenses = Object.values(previousCategories).some(Boolean);
    const operations = list('operations').slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 8);
    const goal = num(state.settings.v65?.incomeGoal) || 300000;
    const goalDeadline = state.settings.v65?.incomeGoalDeadline || '2026-12-31';
    return layout('Финансы', 'Остаток, безопасные лимиты, обязательства и причины изменений по категориям — без выдуманных цифр.', `
      <section class="v65-finance-hero">
        <div><span class="v65-kicker">₽ Финансовая ясность</span><h2>${hasFacts ? (forecast < 0 ? 'План периода требует корректировки' : 'Цифры собраны в один понятный прогноз') : 'Загрузите фактические данные'}</h2><p>${hasFacts ? 'Лимиты рассчитаны консервативно: из текущего остатка вычтены обязательства и запланированные покупки.' : 'Сначала укажите остаток и загрузите операции. До этого приложение показывает прочерки и ничего не додумывает.'}</p><div class="v65-finance-actions"><button class="v65-primary-action" data-action="setActualBalance" type="button">Указать остаток</button><button data-action="openRecordForm" data-type="operation" type="button">＋ Операция</button><button data-go="debts" type="button">План долгов</button></div></div>
        <aside><span>Цель дохода</span><strong>${money(goal)} / месяц</strong><small>до ${fmt(goalDeadline)} · трейдинг и подработки, без найма</small><button data-v65-action="addStarterGoal" data-key="income" type="button">Добавить в цели</button></aside>
      </section>
      <section class="v65-finance-tabs">${[['month', 'Месяц'], ['last', 'Прошлый'], ['next', 'Следующий'], ['quarter', '3 месяца'], ['year', 'Год']].map(([key, label]) => `<button class="${period.key === key ? 'active' : ''}" data-action="setFinancePeriod" data-period="${key}" type="button">${label}</button>`).join('')}</section>
      <section class="v65-money-kpis">
        <article><span>Остаток сейчас</span><strong>${hasFacts ? money(currentBalance) : '—'}</strong><small>указанный фактический остаток</small></article>
        <article><span>Лимит дня</span><strong>${dayLimit === null ? '—' : money(dayLimit)}</strong><small>${daysLeft ? `${daysLeft} дней до конца периода` : 'для прошедшего периода не считается'}</small></article>
        <article><span>Лимит недели</span><strong>${weekLimit === null ? '—' : money(weekLimit)}</strong><small>7 × безопасный дневной лимит</small></article>
        <article><span>Обязательные платежи</span><strong>${outgoing.length ? money(obligationTotal) : '—'}</strong><small>${obligations.length ? countLabel(obligations.length, 'платёж', 'платежа', 'платежей') : 'в выбранном периоде нет'}</small></article>
      </section>
      <section class="v65-finance-layout">
        <article class="v65-card v65-finance-flow"><div class="v65-card-head"><div><span class="v65-overline">Движение денег</span><h3>${period.title}</h3><p>${fmt(period.start)} — ${fmt(period.end)}</p></div><span class="v65-fact-chip">факт</span></div><div class="v65-flow-grid"><div><span>Доходы</span><strong class="is-income">${money(totals.inc)}</strong></div><div><span>Расходы</span><strong class="is-expense">${money(totals.exp)}</strong></div><div><span>Планы</span><strong>${money(plannedTotal)}</strong></div><div><span>Прогноз</span><strong class="${forecast < 0 ? 'is-expense' : 'is-income'}">${hasFacts ? money(forecast) : '—'}</strong></div></div><p class="v65-finance-formula">Безопасный лимит = остаток − обязательства − покупки, разделённые на оставшиеся дни.</p></article>
        <article class="v65-card v65-category-change"><div class="v65-card-head"><div><span class="v65-overline">Причины просадки</span><h3>Категории и изменение</h3><p>${hasPreviousExpenses ? 'Сравнение с предыдущим равным периодом.' : 'Пока показана структура; для причин нужен прошлый период.'}</p></div></div><div>${categoryRows.map(row => `<div class="v65-category-row"><span><b>${esc(row.name)}</b><small>${money(row.amount)} за период</small></span><strong class="${row.delta > 0 ? 'up' : row.delta < 0 ? 'down' : ''}">${hasPreviousExpenses ? `${row.delta > 0 ? '+' : ''}${money(row.delta)}` : '—'}</strong></div>`).join('') || '<p class="v65-finance-empty">Расходов за период пока нет.</p>'}</div></article>
        <article class="v65-card v65-finance-operations"><div class="v65-card-head"><div><span class="v65-overline">Последние записи</span><h3>Операции</h3></div><button data-action="openRecordForm" data-type="operation" type="button">＋ Добавить</button></div><div>${operations.map(item => `<div class="v65-operation-row"><span class="${item.type === 'income' ? 'income' : 'expense'}">${item.type === 'income' ? '↗' : '↘'}</span><div><b>${esc(item.category || (item.type === 'income' ? 'Доход' : 'Расход'))}</b><small>${fmt(item.date)} · ${esc(item.note || 'без комментария')}</small></div><strong class="${item.type === 'income' ? 'is-income' : 'is-expense'}">${item.type === 'income' ? '+' : '−'}${money(item.amount)}</strong><button data-action="editRecord" data-type="operation" data-id="${esc(item.id)}" type="button">Изменить</button></div>`).join('') || '<p class="v65-finance-empty">Операций пока нет.</p>'}</div></article>
        <aside class="v65-card v65-finance-learning"><span class="v65-overline">Финансовая грамотность</span><h3>Что проверять каждую неделю</h3><ol><li><b>Остаток</b><span>совпадает ли он с банком</span></li><li><b>Обязательства</b><span>нет ли срока в ближайшие 7 дней</span></li><li><b>Просадка</b><span>какая категория выросла и почему</span></li><li><b>Доход</b><span>какой шаг приближает к 300 000 ₽</span></li></ol><details><summary>Импорт выписки</summary><input type="file" id="csvFile" accept=".csv,text/csv"><button data-action="importBankCsv" type="button">Импортировать CSV</button><small>Повторяющиеся строки будут пропущены.</small></details></aside>
      </section>`);
  }

  function v65DebtOrder(items) {
    return items.slice().sort((a, b) => {
      const aOverdue = a.due && a.due < today() ? 0 : 1;
      const bOverdue = b.due && b.due < today() ? 0 : 1;
      return aOverdue - bOverdue || num(b.rate) - num(a.rate) || String(a.due || '9999').localeCompare(String(b.due || '9999')) || num(b.amount) - num(a.amount);
    });
  }

  function v65DebtReason(item) {
    if (item.due && item.due < today()) return 'просрочен — первый приоритет';
    if (num(item.rate) > 0) return `ставка ${num(item.rate)}% · затем срок`;
    if (item.due) return `ближайший срок ${fmt(item.due)}`;
    return 'добавьте срок или ставку для точного приоритета';
  }

  function v65DebtsPage() {
    const outgoing = v65DebtOrder(activeDebts().filter(item => item.direction === 'out'));
    const incoming = activeDebts().filter(item => item.direction === 'in').slice().sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')));
    const totalOut = outgoing.reduce((sum, item) => sum + num(item.amount), 0);
    const totalIn = incoming.reduce((sum, item) => sum + num(item.amount), 0);
    const overdue = outgoing.filter(item => item.due && item.due < today());
    const weekEnd = iso(addDays(new Date(), 7));
    const dueSoon = outgoing.filter(item => item.due && item.due >= today() && item.due <= weekEnd);
    const monthlyBudget = num(state.settings.v65?.debtMonthlyBudget);
    const minimumTotal = outgoing.reduce((sum, item) => sum + num(item.minPayment), 0);
    const extra = Math.max(0, monthlyBudget - minimumTotal);
    return layout('Долги', 'Учёт, приоритеты, предупреждения и план погашения без скрытых допущений.', `
      <section class="v65-debt-hero"><div><span class="v65-kicker">↙ План обязательств</span><h2>${overdue.length ? 'Сначала закрываем просроченное' : dueSoon.length ? 'Есть сроки в ближайшие 7 дней' : outgoing.length ? 'План можно выполнять спокойно' : 'Активных долгов нет'}</h2><p>Приоритет: просрочка → высокая ставка → ближайший срок. Если ставка или минимальный платёж не заполнены, система прямо сообщает об этом.</p><div class="v65-finance-actions"><button class="v65-primary-action" data-action="openDebtOut" type="button">＋ Я должен</button><button data-action="openDebtIn" type="button">＋ Мне должны</button></div></div><aside><span>Общий долг</span><strong>${outgoing.length ? money(totalOut) : '—'}</strong><small>${overdue.length ? `${overdue.length} просрочено` : dueSoon.length ? `${dueSoon.length} скоро` : 'критичных сроков нет'}</small></aside></section>
      <section class="v65-money-kpis"><article><span>Я должен</span><strong>${outgoing.length ? money(totalOut) : '—'}</strong><small>${outgoing.length} активных</small></article><article><span>Мне должны</span><strong>${incoming.length ? money(totalIn) : '—'}</strong><small>${incoming.length} активных</small></article><article><span>Просрочено</span><strong>${overdue.length ? money(overdue.reduce((sum, item) => sum + num(item.amount), 0)) : '—'}</strong><small>${overdue.length} обязательств</small></article><article><span>7 дней</span><strong>${dueSoon.length ? money(dueSoon.reduce((sum, item) => sum + num(item.amount), 0)) : '—'}</strong><small>${dueSoon.length} ближайших сроков</small></article></section>
      <section class="v65-debt-layout"><article class="v65-card v65-debt-plan"><div class="v65-card-head"><div><span class="v65-overline">План погашения</span><h3>Приоритеты и платёж месяца</h3><p>${monthlyBudget && minimumTotal > monthlyBudget ? `Бюджет ниже суммы минимальных платежей на ${money(minimumTotal - monthlyBudget)}.` : 'Укажите сумму, которую реально готовы направлять на долги.'}</p></div></div><div class="v65-debt-budget"><label><span>Бюджет на погашение в месяц</span><input id="v65_debt_budget" type="number" min="0" value="${monthlyBudget || ''}" placeholder="Например, 30 000"></label><button data-v65-action="saveDebtBudget" type="button">Сохранить</button></div><div class="v65-debt-priority-list">${outgoing.map((item, index) => { const minimum = num(item.minPayment); const suggested = monthlyBudget ? (minimumTotal && monthlyBudget < minimumTotal ? monthlyBudget * minimum / minimumTotal : minimum + (index === 0 ? extra : 0)) : 0; return `<article class="${item.due && item.due < today() ? 'is-overdue' : ''}"><span class="v65-debt-rank">${index + 1}</span><div><b>${esc(item.person || 'Долг')}</b><small>${esc(v65DebtReason(item))}</small><em>${minimum ? `минимум ${money(minimum)}` : 'минимальный платёж не указан'}</em></div><strong>${money(item.amount)}</strong><div class="v65-debt-suggest"><span>План месяца</span><b>${suggested ? money(Math.min(num(item.amount), suggested)) : '—'}</b></div><div class="v65-debt-tools"><button data-action="editRecord" data-type="debt" data-id="${esc(item.id)}" type="button">Изменить</button><button data-action="debtReminder" data-id="${esc(item.id)}" type="button">Напомнить</button><button data-action="closeDebt" data-id="${esc(item.id)}" type="button">Закрыть</button></div></article>`; }).join('') || '<p class="v65-finance-empty">Добавьте долг, чтобы построить план.</p>'}</div><p class="v65-assistant-disclaimer">План не учитывает проценты, если ставка не заполнена. Перед платежом сверяйте сумму с банком или кредитором.</p></article><aside class="v65-card v65-debt-incoming"><div class="v65-card-head"><div><span class="v65-overline">Возвраты</span><h3>Мне должны</h3></div><button data-action="openDebtIn" type="button">＋ Добавить</button></div><div>${incoming.map(item => `<article><div><b>${esc(item.person || 'Человек')}</b><small>${item.due ? `до ${fmt(item.due)}` : 'срок не указан'}</small></div><strong>${money(item.amount)}</strong><button data-action="debtReminder" data-id="${esc(item.id)}" type="button">Напомнить</button></article>`).join('') || '<p class="v65-finance-empty">Активных возвратов нет.</p>'}</div></aside></section>`);
  }

  function v65SaveDebtBudget() {
    state.settings.v65 = state.settings.v65 || {};
    state.settings.v65.debtMonthlyBudget = Math.max(0, num(document.getElementById('v65_debt_budget')?.value));
    save(); render(); toast('Бюджет погашения сохранён');
  }

  const V65_HABIT_STARTERS = {
    sleep: { name: 'Сон по режиму', area: 'Здоровье', icon: '☾', color: '#446fd7' },
    plan: { name: 'План дня', area: 'Самоорганизация', icon: '☷', color: '#2f7ee9' },
    clean: { name: 'Без алкоголя и наркотиков', area: 'Здоровье', icon: '◇', color: '#18a779' },
    reading: { name: 'Чтение', area: 'Личное развитие', icon: '▤', color: '#7c5bd6' },
    trading: { name: 'Обучение трейдингу', area: 'Финансовая грамотность', icon: '↗', color: '#d89428' }
  };

  const V65_GOAL_STARTERS = {
    income: { title: 'Доход 300 000 ₽ в месяц', area: 'Финансы', kind: 'Финансовая', target: 300000, current: 0, deadline: '2026-12-31', note: 'Источники: трейдинг и подработки. Работу по найму в расчёт не включать.' },
    trading: { title: 'Обучиться трейдингу и получить первый доход', area: 'Трейдинг', kind: 'Личная', target: 1, current: 0, deadline: '2026-12-31', note: 'Сначала обучение и риск-менеджмент, затем только подтверждённый результат.' }
  };

  function v65AddStarterHabit(key) {
    const starter = V65_HABIT_STARTERS[key];
    if (!starter) return;
    if (list('habits').some(item => lower(item.name) === lower(starter.name))) return toast('Такая привычка уже есть');
    state.habits = list('habits');
    state.habits.push({ id: uid(), ...starter, marks: {} });
    save(); render(); toast(`Добавлена привычка «${starter.name}»`);
  }

  function v65AddStarterGoal(key) {
    const starter = V65_GOAL_STARTERS[key];
    if (!starter) return;
    if (list('goals').some(item => lower(item.title) === lower(starter.title))) return toast('Такая цель уже есть');
    state.goals = list('goals');
    state.goals.unshift({ id: uid(), ...starter });
    save(); render(); toast(`Добавлена цель «${starter.title}»`);
  }

  function v65InjectPersonalSetup() {
    const route = (location.hash || '').replace('#', '') || page || 'dashboard';
    const view = document.getElementById('view');
    const hero = view?.querySelector('.v59-hero,.hero');
    if (!view || !hero) return;
    if (route === 'habits' && !view.querySelector('.v65-habit-starters')) {
      hero.insertAdjacentHTML('afterend', `<section class="v65-habit-starters"><div><span class="v65-overline">Ваш основной ритм</span><h3>Привычки, которые вы назвали главными</h3><p>Добавляются только по нажатию. Существующие привычки не меняются.</p></div><div>${Object.entries(V65_HABIT_STARTERS).map(([key, starter]) => { const exists = list('habits').some(item => lower(item.name) === lower(starter.name)); return `<button ${exists ? 'disabled' : `data-v65-action="addStarterHabit" data-key="${key}"`} type="button"><span style="--starter:${starter.color}">${starter.icon}</span><b>${esc(starter.name)}</b><small>${exists ? 'уже добавлена' : 'добавить'}</small></button>`; }).join('')}</div></section>`);
    }
    if (route === 'goals' && !view.querySelector('.v65-goal-starters')) {
      hero.insertAdjacentHTML('afterend', `<section class="v65-goal-starters"><div><span class="v65-overline">Ориентиры до конца 2026 года</span><h3>Доход и трейдинг</h3><p>Цели появятся в системе только после вашего нажатия.</p></div>${Object.entries(V65_GOAL_STARTERS).map(([key, starter]) => { const exists = list('goals').some(item => lower(item.title) === lower(starter.title)); return `<article><span>${key === 'income' ? '₽' : '↗'}</span><div><b>${esc(starter.title)}</b><small>до ${fmt(starter.deadline)} · ${esc(starter.note)}</small></div><button ${exists ? 'disabled' : `data-v65-action="addStarterGoal" data-key="${key}"`} type="button">${exists ? 'Добавлена' : 'Добавить цель'}</button></article>`; }).join('')}</section>`);
    }
    if (route === 'system' && !view.querySelector('.v65-sync-card')) {
      const sync = state.settings?.sync || {};
      hero.insertAdjacentHTML('afterend', `<section class="v65-sync-card"><div><span>⇄</span><div><b>Синхронизация между устройствами</b><small>${sync.gistId ? (sync.auto ? 'автоматическая синхронизация включена' : 'подключение настроено, автоматический режим выключен') : 'пока не настроена — локальные данные продолжают работать'}</small></div></div><button data-go="personal" type="button">Настроить</button></section>`);
    }
  }

  function v65Dashboard() {
    const allTasks = list('tasks').filter(personalOnly);
    const openTasks = allTasks.filter(item => !statusDone(item));
    const todayTasks = openTasks.filter(item => item.date === today()).sort((a, b) => taskPriority(a) - taskPriority(b));
    const overdue = openTasks.filter(item => item.date && item.date < today()).sort((a, b) => String(a.date).localeCompare(String(b.date)) || taskPriority(a) - taskPriority(b));
    const timeline = uniq([...overdue, ...todayTasks]).slice(0, 5);
    const focus = timeline[0] || openTasks.slice().sort((a, b) => taskPriority(a) - taskPriority(b))[0];
    const habits = list('habits').filter(personalOnly);
    const habitsDone = habits.filter(item => item.marks?.[today()]).length;
    const goals = list('goals').filter(personalOnly).filter(item => !statusDone(item));
    const people = list('people').filter(personalOnly);
    const purchases = list('purchases').filter(personalOnly);
    const operations = list('operations');
    const debts = activeDebts();
    const outgoingDebts = debts.filter(item => item.direction === 'out');
    const outgoingDebtTotal = outgoingDebts.reduce((sum, item) => sum + num(item.amount), 0);
    const monthPeriod = periodInfo('month');
    const finance = financeTotals(monthPeriod);
    const financeReady = operations.length > 0 || num(state.settings?.currentBalance) !== 0 || debts.length > 0;
    const forecast = finance.netWithUpcoming ?? finance.net ?? 0;
    const name = state.settings?.name || 'Алексей';
    const dailyLoad = timeline.length;
    const energyMode = overdue.length > 2 || dailyLoad > 6
      ? ['Насыщенный день', 'Сначала обязательное, остальное можно перенести']
      : dailyLoad > 3
        ? ['Сбалансированный день', 'Темп нормальный — не добавляйте лишнего']
        : ['Спокойный день', 'Есть место для одного осознанного шага'];

    const healthHabits = habits.filter(item => matches(item, /здоров|спорт|движ|прогул|сон|медитац|вода|йог|дых/i));
    const healthDone = healthHabits.filter(item => item.marks?.[today()]).length;
    const homeItems = [...openTasks.filter(item => matches(item, /дом|быт|ремонт|квартир|уборк|продукт/i)), ...purchases.filter(item => matches(item, /дом|быт|ремонт|квартир|мебел|техник/i))];
    const relationTasks = openTasks.filter(item => matches(item, /семь|мам|пап|родител|отношен|друг|встреч|позвон/i));
    const growthItems = [...goals, ...list('books').filter(personalOnly)];
    const impressions = [...list('trips').filter(personalOnly), ...list('wishes').filter(personalOnly), ...list('films').filter(personalOnly)];
    const sphereRows = [
      v65Sphere({ id: 'habits', icon: '♡', title: 'Здоровье', value: healthHabits.length ? `${healthDone}/${healthHabits.length}` : '—', detail: healthHabits.length ? 'привычек выполнено сегодня' : 'добавьте первый ритм', tone: 'tone-health' }),
      v65Sphere({ id: 'finance', icon: '₽', title: 'Финансы', value: financeReady ? money(forecast) : '—', detail: financeReady ? 'прогноз текущего месяца' : 'ожидают вашей выгрузки', tone: 'tone-money' }),
      v65Sphere({ id: 'planning', icon: '⌂', title: 'Дом и быт', value: String(homeItems.length), detail: countLabel(homeItems.length, 'активный пункт', 'активных пункта', 'активных пунктов'), tone: 'tone-home' }),
      v65Sphere({ id: 'people', icon: '∞', title: 'Отношения', value: String(people.length), detail: relationTasks.length ? countLabel(relationTasks.length, 'важное действие', 'важных действия', 'важных действий') : 'важные люди и даты', tone: 'tone-people' }),
      v65Sphere({ id: 'goals', icon: '↗', title: 'Развитие', value: String(growthItems.length), detail: goals.length ? countLabel(goals.length, 'активная цель', 'активные цели', 'активных целей') : 'цели, книги и обучение', tone: 'tone-growth' }),
      v65Sphere({ id: 'wishes', icon: '✦', title: 'Впечатления', value: String(impressions.length), detail: 'желания, поездки и фильмы', tone: 'tone-life' })
    ].join('');

    const nextGoal = goals[0];
    const goalProgress = nextGoal?.target ? clamp(num(nextGoal.current) / Math.max(1, num(nextGoal.target)) * 100) : 0;
    const focusButton = focus
      ? `<button class="v65-primary-action" data-action="editRecord" data-type="task" data-id="${escapeId(focus.id)}" type="button">Открыть задачу</button>`
      : '<button class="v65-primary-action" data-action="openRecordForm" data-type="task" type="button">Создать первый шаг</button>';

    const assistant = v65AssistantModel();

    return layout(`${greeting()}, ${esc(name)}`, 'Личная жизнь без информационного шума: один фокус, честные данные и спокойный ритм.', `
      <section class="v65-prime">
        <div class="v65-prime-copy">
          <span class="v65-kicker">◆ Личный фокус</span>
          <h2>${focus ? esc(focus.title) : 'Выберите один хороший шаг'}</h2>
          <p>${focus ? 'Система подняла эту задачу по сроку и приоритету. Остальное останется на своих местах.' : 'Сегодня нет обязательного пункта. Зафиксируйте то, что действительно улучшит день.'}</p>
          <div class="v65-prime-actions">${focusButton}<button data-action="openQuick" type="button">＋ Зафиксировать</button><button data-go="tasks" type="button">План дня</button></div>
        </div>
        <div class="v65-prime-stats">
          <article><span>Финансы</span><strong>${financeReady ? money(forecast) : '—'}</strong><small>${financeReady ? 'прогноз месяца' : 'данные не загружены'}</small></article>
          <article><span>Долги</span><strong>${outgoingDebts.length ? money(outgoingDebtTotal) : '—'}</strong><small>${outgoingDebts.length ? countLabel(outgoingDebts.length, 'активный долг', 'активных долга', 'активных долгов') : 'активных долгов нет'}</small></article>
          <article><span>Привычки</span><strong>${habitsDone}/${habits.length}</strong><small>${habits.length ? 'выполнено сегодня' : 'ритм ещё не задан'}</small></article>
          <article><span>Цели</span><strong>${goals.length}</strong><small>${goals.length ? 'в активном фокусе' : 'можно добавить позже'}</small></article>
        </div>
      </section>

      ${v65AssistantStrip(assistant)}

      <section class="v65-life-layout">
        <div class="v65-life-main">
          <article class="v65-card v65-day-stream">
            <div class="v65-card-head"><div><span class="v65-overline">Лента дня</span><h3>${energyMode[0]}</h3><p>${energyMode[1]}</p></div><button data-go="tasks" type="button">Все задачи</button></div>
            <div class="v65-timeline">${timeline.map(v65TimelineRow).join('') || '<div class="v65-empty"><span>✓</span><div><b>Обязательных пунктов нет</b><small>Можно выбрать один небольшой шаг или оставить день свободным.</small></div></div>'}</div>
          </article>

          <article class="v65-card v65-spheres-card">
            <div class="v65-card-head"><div><span class="v65-overline">Сферы жизни</span><h3>Всё личное — на одном экране</h3><p>Только фактические записи, без искусственного рейтинга баланса.</p></div><span class="v65-fact-chip">без работы</span></div>
            <div class="v65-spheres">${sphereRows}</div>
          </article>
        </div>

        <aside class="v65-life-rail">
          <article class="v65-card v65-capture-card">
            <div class="v65-card-head"><div><span class="v65-overline">Быстрый захват</span><h3>Не держите в голове</h3></div></div>
            <textarea id="quickText" aria-label="Быстрый захват" placeholder="Мысль, задача, идея или ссылка…"></textarea>
            <div class="v65-capture-grid"><button data-action="capture" data-type="task" type="button"><span>✓</span>Задача</button><button data-action="capture" data-type="note" type="button"><span>⌁</span>Заметка</button><button data-action="capture" data-type="idea" type="button"><span>✦</span>Идея</button><button data-action="openRecordForm" data-type="operation" type="button"><span>₽</span>Операция</button></div>
          </article>

          <article class="v65-card v65-week-card">
            <div class="v65-card-head"><div><span class="v65-overline">Ритм недели</span><h3>Фактическая активность</h3></div><span class="v65-fact-chip">7 дней</span></div>
            <div class="v65-week-chart">${v65WeekRhythm(habits, allTasks)}</div>
            <p>Столбцы учитывают только выполненные задачи и отмеченные привычки.</p>
          </article>

          <article class="v65-card v65-goal-card">
            <div class="v65-card-head"><div><span class="v65-overline">Ближайший горизонт</span><h3>${nextGoal ? esc(nextGoal.title) : 'Цель ещё не выбрана'}</h3></div><button data-go="goals" type="button">Цели</button></div>
            ${nextGoal ? `${prog(goalProgress)}<p>${Math.round(goalProgress)}% · ${esc(nextGoal.note || 'задайте следующий конкретный шаг')}</p>` : '<p>Добавьте результат, к которому хотите прийти, и один следующий шаг.</p>'}
          </article>
        </aside>
      </section>
    `);
  }

  const previousSave = typeof save === 'function' ? save : null;
  if (previousSave) {
    save = function () {
      const result = previousSave.apply(this, arguments);
      if (!document.body.classList.contains('v66-safe-core') && !document.body.classList.contains('v67-cloud-safe')) {
        try { localStorage.setItem('secondBrainOS.currentBuild', V65_BUILD); } catch (error) {}
      }
      return result;
    };
  }

  dashboard = v65Dashboard;
  financePage = v65FinancePage;
  debtsPage = v65DebtsPage;

  const previousGo = typeof go === 'function' ? go : null;
  if (previousGo) {
    go = function (id) {
      if (id === 'coach') return v65OpenAssistant();
      return previousGo(HIDDEN_ROUTES.has(id) ? 'dashboard' : id);
    };
  }

  const initialRoute = (location.hash || '').replace('#', '') || page || 'dashboard';
  if (HIDDEN_ROUTES.has(initialRoute)) {
    page = 'dashboard';
    try { history.replaceState(null, '', '#dashboard'); } catch (error) {}
  }

  function setText(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }

  function tidyNavigation() {
    const nav = document.querySelector('.v59-nav-scroll');
    if (!nav) return;
    const labels = { dashboard: 'Главная', coach: 'Помощник', habits: 'Привычки', finance: 'Финансы', debts: 'Долги', goals: 'Цели', subconscious: 'Дневник', tasks: 'Задачи', planning: 'Планы', personal: 'Личная память' };
    nav.querySelectorAll('.v59-nav-item[data-go]').forEach(button => {
      const route = button.dataset.go;
      button.hidden = HIDDEN_ROUTES.has(route);
      if (labels[route]) setText(button.querySelector('.label'), labels[route]);
    });

    const mainList = nav.querySelector('.v59-nav-list');
    if (mainList) {
      const priorityButtons = ['dashboard', 'coach', 'finance', 'debts', 'habits', 'tasks', 'goals', 'subconscious']
        .map(route => route === 'coach'
          ? nav.querySelector('.v59-nav-item[data-go="coach"],.v59-nav-item[data-v65-action="openAssistant"]')
          : nav.querySelector(`.v59-nav-item[data-go="${route}"]`))
        .filter(button => button && !button.hidden);
      mainList.prepend(...priorityButtons);
      const heading = mainList.previousElementSibling?.querySelector('span');
      setText(heading, 'ГЛАВНОЕ');
    }

    nav.querySelectorAll('.v59-nav-list').forEach(listElement => {
      const hasVisible = [...listElement.querySelectorAll(':scope > .v59-nav-item')].some(button => !button.hidden);
      listElement.hidden = !hasVisible;
      const heading = listElement.previousElementSibling;
      if (heading?.classList.contains('v59-section')) heading.hidden = !hasVisible;
    });
  }

  function replaceLegacyAssistantControls() {
    document.querySelectorAll('[data-v59-action="coach"],[data-go="coach"]').forEach(button => {
      button.removeAttribute('data-v59-action');
      button.removeAttribute('data-go');
      button.dataset.v65Action = 'openAssistant';
      if (button.closest('.v59-ai-card')) setText(button, 'Разобрать');
    });
    document.querySelectorAll('.v59-ai-card [data-v59-action="dayPlan"],.v59-ai-card [data-go="command"]').forEach(button => {
      button.removeAttribute('data-v59-action');
      button.removeAttribute('data-go');
      button.dataset.v65Action = 'openSection';
      button.dataset.route = 'subconscious';
      setText(button, 'Дневник');
    });
  }

  function applyPremiumPolish() {
    const currentRoute = (location.hash || '').replace('#', '') || page || 'dashboard';
    if (HIDDEN_ROUTES.has(currentRoute)) {
      page = 'dashboard';
      try { history.replaceState(null, '', `${location.pathname}${location.search}#dashboard`); } catch (error) {}
      try { previousGo?.('dashboard'); } catch (error) {}
      return;
    }
    document.body.classList.add('v65-premium');
    const v67Active = document.body.classList.contains('v67-cloud-safe');
    const v66Active = document.body.classList.contains('v66-safe-core');
    if (!v67Active && !v66Active) document.body.dataset.sbosBuild = V65_BUILD;
    document.documentElement.lang = 'ru';
    document.title = 'Second Brain OS — личная жизнь в порядке';
    if (!v67Active && !v66Active) document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', V65_BUILD);
    if (!v67Active) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0b1530');
    setText(document.querySelector('.v59-version,.version'), v67Active ? 'V67.7 · LIVING PERSONAL OS' : (v66Active ? 'V66 · SAFE PERSONAL OS' : V65_LABEL));
    setText(document.querySelector('.v59-core-pill'), v67Active ? 'V67.7' : (v66Active ? 'V66' : 'V65'));
    setText(document.querySelector('.v59-sub'), 'личная операционная система');
    setText(document.querySelector('.v59-ai-card h3'), 'Личный помощник');
    const helperText = document.querySelector('.v59-ai-card p');
    setText(helperText, 'Собирает личный день без рабочих задач и перегруза.');
    tidyNavigation();
    replaceLegacyAssistantControls();
    document.querySelectorAll('.v63-injected').forEach(element => element.remove());
    v65ShowDiary();
    v65InjectPersonalSetup();

    const profile = document.querySelector('.v59-user-pill');
    if (profile) {
      profile.setAttribute('aria-label', `Личный профиль: ${state.settings?.name || 'Алексей'}`);
      profile.title = 'Личный профиль';
    }

    document.querySelectorAll('.v65-timeline-row').forEach(row => {
      const title = row.querySelector('b')?.textContent?.trim() || 'задачу';
      row.setAttribute('aria-label', `Открыть: ${title}`);
    });
    document.querySelectorAll('.v65-sphere').forEach(row => {
      const title = row.querySelector('b')?.textContent?.trim() || 'сферу';
      row.setAttribute('aria-label', `Открыть сферу: ${title}`);
    });
    document.querySelectorAll('.v65-card button,.v65-prime button').forEach(button => {
      if (!button.hasAttribute('type')) button.type = 'button';
    });
  }

  function schedulePremiumPolish() {
    if (polishQueued) return;
    polishQueued = true;
    requestAnimationFrame(() => {
      polishQueued = false;
      applyPremiumPolish();
    });
  }

  const app = document.getElementById('app');
  if (app) new MutationObserver(schedulePremiumPolish).observe(app, { childList: true, subtree: true });

  window.addEventListener('click', event => {
    const action = event.target.closest?.('[data-v65-action]');
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const name = action.dataset.v65Action;
    if (name === 'openAssistant') return v65OpenAssistant();
    if (name === 'openDayPlan') return v65OpenDayPlan();
    if (name === 'applyPostponements') return v65ApplyPostponements();
    if (name === 'resolveStuckTask') return v65ResolveStuckTask(action.dataset.id || '', action.dataset.mode || 'date');
    if (name === 'openEveningReview') return v65OpenEveningReview();
    if (name === 'saveEveningReview') return v65SaveEveningReview();
    if (name === 'closeModal') return closeModal();
    if (name === 'openSection') {
      closeModal();
      return go(action.dataset.route || 'dashboard');
    }
    if (name === 'saveDiary') return v65SaveDiary();
    if (name === 'saveDebtBudget') return v65SaveDebtBudget();
    if (name === 'addStarterHabit') return v65AddStarterHabit(action.dataset.key);
    if (name === 'addStarterGoal') return v65AddStarterGoal(action.dataset.key);
    if (name === 'diaryToday') return v65SetDiaryDate(today());
    if (name === 'openDiary') return v65SetDiaryDate(action.dataset.date || today());
    if (name === 'deleteDiary') return v65DeleteDiary();
    if (name === 'diaryDate') {
      const current = state.settings?.subconsciousCurrentDate || today();
      return v65SetDiaryDate(iso(addDays(new Date(`${current}T12:00:00`), Number(action.dataset.direction) || 0)));
    }
  }, true);

  window.addEventListener('hashchange', () => [0, 120, 260].forEach(delay => setTimeout(applyPremiumPolish, delay)));

  try { render(); } catch (error) { console.error('[V65 render]', error); }
  applyPremiumPolish();
  [150, 600, 1800, 3400, 5200].forEach(delay => setTimeout(applyPremiumPolish, delay));
})();
