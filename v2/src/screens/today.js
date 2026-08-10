/* Экран дня.
   Отличие от прошлой версии: наверху ровно одно действие с объяснением
   «почему сейчас», а не десяток равнозначных карточек. Всё остальное ниже
   и тише. Главный шаг выбирается по фактам, а не случайно. */

import { getState, num, numberOrNull } from '../store.js';
import { greeting, dateWithWeekday, todayKey, money, esc, plural, dateShort } from '../format.js';
import {
  totalBalance, accountsUnfilled, monthTotals, habitsToday, activeHabits,
  isHabitDone, tasksForDay, overdueTasks, debtSummary, debtDue
} from '../calc.js';
import { pageHead, card, label, ring, button, metricStrip, empty } from '../ui.js';

/**
 * Главный шаг дня. Порядок проверок — это приоритет: просроченное важнее
 * неподтверждённого, неподтверждённое важнее рутины.
 */
function mainStep(state) {
  const today = todayKey();
  const overdue = overdueTasks(state, today);
  if (overdue.length) {
    return {
      tag: 'Просрочено',
      title: overdue[0].title || 'Просроченная задача',
      text: overdue.length > 1
        ? `Ещё ${overdue.length - 1} ${plural(overdue.length - 1, 'задача', 'задачи', 'задач')} с прошедшим сроком.`
        : 'Задача с прошедшим сроком.',
      why: `Срок был ${dateShort(overdue[0].date)}`,
      action: 'goto-tasks',
      actionText: 'Открыть задачи'
    };
  }

  const summary = debtSummary(state);
  if (summary.overdue > 0) {
    return {
      tag: 'Обязательства',
      title: 'Просроченный платёж по долгу',
      text: `Просроченная сумма ${money(summary.overdue)}. Штрафы растут быстрее процентов.`,
      why: 'Просрочка меняет порядок погашения',
      action: 'goto-debts',
      actionText: 'Открыть долги'
    };
  }

  const unfilled = accountsUnfilled(state);
  if (unfilled.length) {
    const nearest = summary.nearest ? debtDue(summary.nearest) : '';
    return {
      tag: 'Главный шаг',
      title: 'Сверить фактические остатки',
      text: `Не подтверждён остаток по ${unfilled.length} ${plural(unfilled.length, 'счёту', 'счетам', 'счетам')}. Без этого дневной лимит считается по неполным данным.`,
      why: nearest ? `До ближайшего платежа ${dateShort(nearest)}` : 'Остатки не подтверждены',
      action: 'goto-finance',
      actionText: 'Открыть счета'
    };
  }

  const habits = habitsToday(state, today);
  if (habits.total && habits.done < habits.total) {
    const left = activeHabits(state).find((h) => !isHabitDone(h, today));
    return {
      tag: 'Ритм дня',
      title: left ? left.name : 'Отметить привычки',
      text: `Сегодня выполнено ${habits.done} из ${habits.total}.`,
      why: 'Небольшое действие удерживает серию',
      action: 'goto-habits',
      actionText: 'Открыть привычки'
    };
  }

  const tasks = tasksForDay(state, today);
  if (tasks.length) {
    return {
      tag: 'Расписание',
      title: tasks[0].title || 'Задача дня',
      text: tasks.length > 1 ? `Сегодня ещё ${tasks.length - 1} ${plural(tasks.length - 1, 'задача', 'задачи', 'задач')}.` : 'Единственная задача на сегодня.',
      why: tasks[0].time ? `Запланировано на ${tasks[0].time}` : 'Без точного времени',
      action: 'goto-tasks',
      actionText: 'Открыть задачи'
    };
  }

  return {
    tag: 'День свободен',
    title: 'Обязательных действий нет',
    text: 'Счета сверены, привычки отмечены, просроченного нет.',
    why: 'Хорошее время заняться целями',
    action: 'goto-finance',
    actionText: 'Посмотреть финансы'
  };
}

export function render() {
  const state = getState();
  const today = todayKey();
  const profile = (state.settings && (state.settings.name || state.settings.profile)) || '';
  const name = typeof profile === 'string' ? profile : (profile && profile.name) || '';

  const step = mainStep(state);
  const habits = habitsToday(state, today);
  const balance = totalBalance(state);
  const totals = monthTotals(state);
  const summary = debtSummary(state);
  const tasks = tasksForDay(state, today);

  const head = pageHead({
    eyebrow: dateWithWeekday(today),
    title: `${greeting()}${name ? `, ${name}` : ''}`,
    subtitle: (state.settings && state.settings.subtitle) || 'Фокус на рост'
  });

  const stepBlock = `<div class="step">
    <span class="tag acc">${esc(step.tag)}</span>
    <h3>${esc(step.title)}</h3>
    <p>${esc(step.text)}</p>
    <div class="why">Почему сейчас: ${esc(step.why)}</div>
    <div class="acts">${button(step.actionText, { action: step.action, primary: true })}</div>
  </div>`;

  const schedule = card(`
    ${label('Расписание')}
    ${tasks.length
      ? `<div class="sched">${tasks.slice(0, 5).map((t) => `
          <div><time>${esc(t.time || '—')}</time><span>${esc(t.title || 'Задача')}</span></div>`).join('')}</div>`
      : '<p class="muted">День свободен.</p>'}
  `);

  const rhythm = card(`
    ${label('Ритм дня')}
    ${habits.total
      ? ring(habits.done / habits.total, `${habits.done}/${habits.total}`, 'Привычки')
      : '<p class="muted center">Привычек пока нет.</p>'}
    ${habits.total && habits.done < habits.total
      ? `<p class="center muted">Осталось: ${esc((activeHabits(state).find((h) => !isHabitDone(h, today)) || {}).name || '')}</p>`
      : habits.total ? '<p class="center g">Всё отмечено</p>' : ''}
  `);

  /* Три разных состояния, которые нельзя смешивать: счетов нет вовсе,
     счета есть но остатки не подтверждены, и остатки подтверждены. */
  const totalAccounts = balance.filledCount + balance.unfilledCount;
  const moneyCard = card(`
    ${label('Остаток по счетам')}
    <div class="big small ${balance.filledCount ? '' : 'dim'}">
      ${balance.filledCount ? money(balance.total) : totalAccounts ? 'не подтверждено' : 'счетов нет'}
    </div>
    <div class="meta">
      ${!totalAccounts
        ? '<span>добавьте счёт, чтобы видеть остаток</span>'
        : balance.unfilledCount
          ? `<span class="w">не подтверждено: ${balance.unfilledCount} из ${totalAccounts}</span>`
          : '<span class="g">подтверждено полностью</span>'}
    </div>
  `);

  const metrics = metricStrip([
    { label: 'Расходы за месяц', value: money(totals.expense), tone: totals.expense ? 'neg' : '' },
    { label: 'Доходы за месяц', value: money(totals.income), tone: totals.income ? 'pos' : '' },
    { label: 'Обязательства', value: summary.count ? money(summary.total) : '—', tone: summary.total ? 'neg' : '' },
    { label: 'Привычки', value: habits.total ? `${habits.done} / ${habits.total}` : '—',
      tone: habits.total && habits.done === habits.total ? 'pos' : '' }
  ]);

  return `${head}
    <div class="grid2">
      <div>${stepBlock}${schedule}</div>
      <div>${rhythm}${moneyCard}</div>
    </div>
    ${metrics}`;
}
