/* Запуск приложения: роутер, отрисовка, делегирование событий.

   Осознанно без фреймворка: приложение читает и пишет одно состояние,
   экранов немного, а зависимость от сборщика сделала бы правки сложнее,
   чем сама задача. Отрисовка — целиком экран, через строку HTML. */

import { load, subscribe, getState } from './store.js?v=2.4.0';
import { render as renderToday } from './screens/today.js?v=2.4.0';
import { render as renderFinance } from './screens/finance.js?v=2.4.0';
import { render as renderDebts } from './screens/debts.js?v=2.4.0';
import { render as renderHabits, toggleMark } from './screens/habits.js?v=2.4.0';
import { render as renderGoals } from './screens/goals.js?v=2.4.0';
import { render as renderInformation, renderPeople } from './screens/information.js?v=2.4.0';
import { render as renderCalendar } from './screens/calendar.js?v=2.4.0';
import { render as renderGameLife, renderArchive } from './screens/gamelife.js?v=2.4.0';
import { render as renderSystem, loadBackups, invalidateBackups } from './screens/system.js?v=2.4.0';
import {
  editDebt, payDebt, debtStrategy, editAccount, reconcile,
  editOperation, editHabit, editTask,
  editGoal, toggleStage, editInfo, editPerson,
  exportJson, importJson, backupNow, restoreFrom,
  archiveRecord, restoreFromArchive, editProfile
} from './actions.js?v=2.4.0';

const SCREENS = {
  today: { title: 'Сегодня', render: renderToday },
  finance: { title: 'Финансы', render: renderFinance },
  debts: { title: 'Долги', render: renderDebts },
  habits: { title: 'Привычки', render: renderHabits },
  goals: { title: 'Цели', render: renderGoals },
  information: { title: 'Информация', render: renderInformation },
  people: { title: 'Люди', render: renderPeople },
  calendar: { title: 'Календарь', render: renderCalendar },
  gamelife: { title: 'GameLife', render: renderGameLife },
  archive: { title: 'Архив', render: renderArchive },
  system: { title: 'Хранилище', render: renderSystem }
};

/* Экраны, которые ещё не перенесены: ведём в старое приложение, а не в
   тупик. Пользователю важно, чтобы раздел работал, а не чтобы он был новым. */
const LEGACY = {};

const view = document.getElementById('view');
const nav = document.getElementById('nav');

/* Маршрут вида #information?section=books — имя экрана плюс параметры. */
function parseHash() {
  const raw = (location.hash || '#today').replace(/^#/, '');
  const [name, query = ''] = raw.split('?');
  const params = {};
  new URLSearchParams(query).forEach((value, key) => { params[key] = value; });
  const route = SCREENS[name] || LEGACY[name] ? name : 'today';
  return { route, params };
}

const currentRoute = () => parseHash().route;

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
  const { route, params } = parseHash();
  document.body.dataset.route = route;

  nav.querySelectorAll('a[data-route]').forEach((link) => {
    link.classList.toggle('on', link.dataset.route === route);
  });

  try {
    view.innerHTML = SCREENS[route] ? SCREENS[route].render(params) : renderLegacyNotice(route);
  } catch (error) {
    console.error('[app] ошибка отрисовки', error);
    view.innerHTML = `<div class="empty">
      Не удалось построить экран: ${String(error && error.message || error)}.
      Данные при этом не изменялись.
      <div class="acts"><a class="btn" href="../index.html#${route}">Открыть в прежней версии</a></div>
    </div>`;
  }
  view.scrollTop = 0;

  /* Список копий читается из базы асинхронно: рисуем экран сразу,
     а когда список придёт — перерисовываем. */
  if (route === 'system') loadBackups(draw);
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
  'task-edit': (el) => editTask(el.dataset.id),
  'task-new-on': (el) => editTask('', el.dataset.day),

  'goal-new': () => editGoal(),
  'goal-edit': (el) => editGoal(el.dataset.id),
  'goal-stage': (el) => toggleStage(el.dataset.id, el.dataset.stage),

  'info-new': (el) => editInfo(el.dataset.section || 'notes'),
  'info-edit': (el) => editInfo(el.dataset.section || 'notes', el.dataset.id),
  'person-new': () => editPerson(),
  'person-edit': (el) => editPerson(el.dataset.id),

  'export-json': () => exportJson(),
  'import-merge': () => importJson('merge'),
  'import-replace': () => importJson('replace'),
  'backup-now': () => backupNow().then(() => { invalidateBackups(); loadBackups(draw); }),
  'backup-restore': (el) => restoreFrom(el.dataset.id),
  'archive-move': (el) => archiveRecord(el.dataset.section, el.dataset.id),
  'archive-restore': (el) => restoreFromArchive(el.dataset.id),
  'edit-profile': () => editProfile()
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

/* --------------------------------- PWA ---------------------------------- */

/* Регистрируем офлайн-оболочку только на защищённом соединении: на http
   браузер откажет, и в консоли появится ошибка, которая ничего не значит. */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=2.4.0', { scope: './' })
      .catch((error) => console.info('[app] офлайн-режим недоступен:', error && error.message));
  });
}
