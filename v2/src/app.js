/* Запуск приложения: роутер, отрисовка, делегирование событий.

   Осознанно без фреймворка: приложение читает и пишет одно состояние,
   экранов немного, а зависимость от сборщика сделала бы правки сложнее,
   чем сама задача. Отрисовка — целиком экран, через строку HTML. */

import { load, subscribe, getState } from './store.js';
import { render as renderToday } from './screens/today.js';
import { render as renderFinance } from './screens/finance.js';
import { render as renderDebts } from './screens/debts.js';
import { render as renderHabits, toggleMark } from './screens/habits.js';
import {
  editDebt, payDebt, debtStrategy, editAccount, reconcile,
  editOperation, editHabit, editTask
} from './actions.js';

const SCREENS = {
  today: { title: 'Сегодня', render: renderToday },
  finance: { title: 'Финансы', render: renderFinance },
  debts: { title: 'Долги', render: renderDebts },
  habits: { title: 'Привычки', render: renderHabits }
};

/* Экраны, которые ещё не перенесены: ведём в старое приложение, а не в
   тупик. Пользователю важно, чтобы раздел работал, а не чтобы он был новым. */
const LEGACY = {
  calendar: 'Календарь', goals: 'Цели', information: 'Информация',
  people: 'Люди', gamelife: 'GameLife', archive: 'Архив'
};

const view = document.getElementById('view');
const nav = document.getElementById('nav');

const currentRoute = () => {
  const hash = (location.hash || '#today').replace('#', '').split('?')[0];
  return SCREENS[hash] ? hash : (LEGACY[hash] ? hash : 'today');
};

function renderLegacyNotice(route) {
  return `<div class="top">
      <div class="l"><div class="date">Раздел ещё не перенесён</div><h1>${LEGACY[route]}</h1></div>
    </div>
    <div class="empty">
      Этот раздел пока работает в прежней версии приложения — данные у них общие,
      поэтому записи не потеряются и переключаться можно в любой момент.
      <div class="acts">
        <a class="btn" href="../index.html#${route}">Открыть в прежней версии</a>
      </div>
    </div>`;
}

function draw() {
  const route = currentRoute();
  document.body.dataset.route = route;

  nav.querySelectorAll('a[data-route]').forEach((link) => {
    link.classList.toggle('on', link.dataset.route === route);
  });

  try {
    view.innerHTML = SCREENS[route] ? SCREENS[route].render() : renderLegacyNotice(route);
  } catch (error) {
    console.error('[app] ошибка отрисовки', error);
    view.innerHTML = `<div class="empty">
      Не удалось построить экран: ${String(error && error.message || error)}.
      Данные при этом не изменялись.
      <div class="acts"><a class="btn" href="../index.html#${route}">Открыть в прежней версии</a></div>
    </div>`;
  }
  view.scrollTop = 0;
}

/* ------------------------------- Действия ------------------------------- */

const ACTIONS = {
  'goto-finance': () => { location.hash = '#finance'; },
  'goto-debts': () => { location.hash = '#debts'; },
  'goto-habits': () => { location.hash = '#habits'; },
  'goto-tasks': () => { location.hash = '#today'; },
  'habit-toggle': (el) => toggleMark(el.dataset.id, el.dataset.day),

  'debt-new': () => editDebt(),
  'debt-edit': (el) => editDebt(el.dataset.id),
  'debt-pay': (el) => payDebt(el.dataset.id),
  'debt-strategy': () => debtStrategy(),
  'account-new': () => editAccount(),
  'account-edit': (el) => editAccount(el.dataset.id),
  'reconcile': () => reconcile(),
  'operation-new': () => editOperation(),
  'habit-new': () => editHabit(),
  'habit-edit': (el) => editHabit(el.dataset.id),
  'task-new': () => editTask(),
  'task-edit': (el) => editTask(el.dataset.id)
};

/* Разделы, экраны которых ещё не перенесены. */
const LEGACY_ACTIONS = {};

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-act]');
  if (!el) return;
  const action = el.dataset.act;
  if (ACTIONS[action]) {
    event.preventDefault();
    ACTIONS[action](el);
    return;
  }
  if (LEGACY_ACTIONS[action]) {
    event.preventDefault();
    window.location.href = `../index.html#${LEGACY_ACTIONS[action]}`;
  }
});

/* -------------------------------- Запуск -------------------------------- */

window.addEventListener('hashchange', draw);
subscribe(() => draw());

load()
  .then((state) => {
    document.body.dataset.ready = '1';
    const counts = ['debts', 'habits', 'operations', 'financeAccounts', 'tasks']
      .map((k) => `${k}: ${(state[k] || []).length}`).join(', ');
    console.info(`[Second Brain v2] данные загружены — ${counts}`);
    draw();
  })
  .catch((error) => {
    console.error('[app] не удалось загрузить состояние', error);
    view.innerHTML = `<div class="empty">
      Не удалось прочитать хранилище: ${String(error && error.message || error)}.
      Данные не изменялись — откройте прежнюю версию.
      <div class="acts"><a class="btn" href="../index.html">Открыть прежнюю версию</a></div>
    </div>`;
  });
