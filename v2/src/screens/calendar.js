/* Календарь месяца.

   Показывает не только задачи, но и даты платежей по долгам: они и есть
   самые дорогие по последствиям события месяца, а раньше их приходилось
   искать в другом разделе. */

import { getState, num } from '../store.js?v=2.1.1';
import { esc, toKey, parseKey, todayKey, monthTitle, monthKey, money, plural } from '../format.js?v=2.1.1';
import { openTasks, activeDebts, debtDue, debtMinimum } from '../calc.js?v=2.1.1';
import { pageHead, card, label, button, metricStrip } from '../ui.js?v=2.1.1';

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/** Сетка месяца: недели по 7 дней, с добивкой соседними месяцами. */
function monthGrid(year, month) {
  const first = new Date(year, month, 1, 12);
  /* В России неделя начинается с понедельника: getDay() 0=вс → сдвигаем. */
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset, 12);
  const weeks = [];
  for (let w = 0; w < 6; w += 1) {
    const days = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d, 12);
      days.push({ key: toKey(date), date, outside: date.getMonth() !== month });
    }
    weeks.push(days);
    const last = days[6].date;
    if (last.getMonth() !== month && last > first) break;
  }
  return weeks;
}

export function render(params = {}) {
  const state = getState();
  const today = todayKey();
  const base = /^\d{4}-\d{2}$/.test(params.month || '') ? params.month : monthKey(today);
  const [year, month] = base.split('-').map(Number);

  const tasks = openTasks(state).filter((t) => t.date && monthKey(t.date) === base);
  const payments = activeDebts(state)
    .map((debt) => ({ debt, due: debtDue(debt) }))
    .filter((x) => x.due && monthKey(x.due) === base);

  const tasksByDay = new Map();
  tasks.forEach((task) => {
    if (!tasksByDay.has(task.date)) tasksByDay.set(task.date, []);
    tasksByDay.get(task.date).push(task);
  });
  const paymentsByDay = new Map();
  payments.forEach(({ debt, due }) => {
    if (!paymentsByDay.has(due)) paymentsByDay.set(due, []);
    paymentsByDay.get(due).push(debt);
  });

  const prev = monthKey(toKey(new Date(year, month - 2, 1, 12)));
  const next = monthKey(toKey(new Date(year, month, 1, 12)));

  const head = pageHead({
    eyebrow: 'Месяц целиком',
    title: monthTitle(base),
    subtitle: 'Задачи и даты платежей по обязательствам вместе — последствия у них разные, а день один',
    actions: `
      <a class="btn sec" href="#calendar?month=${prev}">←</a>
      <a class="btn sec" href="#calendar?month=${next}">→</a>
      ${button('Новая задача', { action: 'task-new', primary: true })}`
  });

  const grid = card(`
    <div class="cal-head">${WEEK.map((d) => `<span>${d}</span>`).join('')}</div>
    ${monthGrid(year, month - 1).map((week) => `
      <div class="cal-week">
        ${week.map((day) => {
          const dayTasks = tasksByDay.get(day.key) || [];
          const dayPayments = paymentsByDay.get(day.key) || [];
          return `<button class="cal-day ${day.outside ? 'out' : ''} ${day.key === today ? 'today' : ''}"
              type="button" data-act="task-new-on" data-day="${esc(day.key)}"
              aria-label="${esc(day.key)}">
            <span class="d">${day.date.getDate()}</span>
            ${dayPayments.map((debt) => `<span class="ev pay" title="${esc(debt.creditor || 'платёж')}">
              ${esc(money(debtMinimum(debt)))}</span>`).join('')}
            ${dayTasks.slice(0, 2).map((task) => `<span class="ev">${esc(task.time ? `${task.time} ` : '')}${esc(task.title || 'Задача')}</span>`).join('')}
            ${dayTasks.length > 2 ? `<span class="ev more">ещё ${dayTasks.length - 2}</span>` : ''}
          </button>`;
        }).join('')}
      </div>`).join('')}
  `, { pad: false, cls: 'cal' });

  const paymentTotal = payments.reduce((sum, x) => sum + debtMinimum(x.debt), 0);

  const metrics = metricStrip([
    { label: 'Задач в месяце', value: String(tasks.length) },
    { label: 'Платежей', value: String(payments.length),
      hint: payments.length ? `на ${money(paymentTotal)}` : '' },
    { label: 'Сегодня', value: String((tasksByDay.get(today) || []).length) },
    { label: 'Без даты', value: String(openTasks(state).filter((t) => !t.date).length) }
  ]);

  return `${head}${grid}${metrics}`;
}
