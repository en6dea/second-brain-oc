/* Доменные расчёты. Чистые функции без обращения к DOM и хранилищу —
   единственное место, где ошибка даёт неверные числа, а не просто неудачный вид.

   Смысл, зашитый здесь и вынесенный из старой версии (см. DATA-MODEL.md):
   платёж по долгу делится на тело, проценты и штрафы, и уменьшает основной
   долг только частью «тело». Поэтому срок погашения нельзя считать делением
   остатка на платёж. */

import { num, numberOrNull } from './store.js?v=2.1.1';
import { monthKey, todayKey, parseKey, toKey } from './format.js?v=2.1.1';

/* ------------------------------- Долги ---------------------------------- */

export const debtBalance = (debt) => {
  const explicit = numberOrNull(debt.currentBalance);
  if (explicit !== null) return explicit;
  const parts = num(debt.principalBalance) + num(debt.accruedInterest) + num(debt.penalties);
  if (parts > 0) return parts;
  return num(debt.amount) || num(debt.initialAmount);
};

export const debtMinimum = (debt) => num(debt.minimumPayment) || num(debt.paymentAmount);

export const debtDue = (debt) => debt.nextPaymentDate || debt.due || debt.endDate || '';

export const isOverdue = (debt) => debt.status === 'overdue' || num(debt.daysOverdue) > 0;

export const activeDebts = (state) => (state.debts || [])
  .filter((d) => d && d.status !== 'closed' && (d.direction || 'out') === 'out');

/**
 * Погашение аннуитетом: сколько месяцев до нуля при заданном платеже.
 * Возвращает {months, date, reason} — reason объясняет, почему не считается.
 */
export function payoff(debt, extraPerMonth = 0) {
  let balance = debtBalance(debt);
  const payment = debtMinimum(debt) + Math.max(0, num(extraPerMonth));
  const monthlyRate = num(debt.interestRate) / 100 / 12;

  if (balance <= 0) return { months: 0, date: null, reason: 'долг закрыт' };
  if (payment <= 0) return { months: null, date: null, reason: 'не указан платёж' };

  const firstInterest = balance * monthlyRate;
  if (payment <= firstInterest) {
    return { months: null, date: null, reason: 'платёж не покрывает проценты' };
  }

  let months = 0;
  /* 600 месяцев — предохранитель от бесконечного цикла на странных данных. */
  while (balance > 0 && months < 600) {
    balance = balance + balance * monthlyRate - payment;
    months += 1;
  }
  if (months >= 600) return { months: null, date: null, reason: 'срок больше 50 лет' };

  const start = parseKey(debtDue(debt)) || new Date();
  const date = new Date(start.getFullYear(), start.getMonth() + months, start.getDate(), 12);
  return { months, date: toKey(date), reason: '' };
}

/** Сводка по всем обязательствам. */
export function debtSummary(state, extraPerMonth = 0) {
  const rows = activeDebts(state);
  const total = rows.reduce((sum, d) => sum + debtBalance(d), 0);
  const minimum = rows.reduce((sum, d) => sum + debtMinimum(d), 0);
  const overdue = rows.filter(isOverdue)
    .reduce((sum, d) => sum + Math.max(debtMinimum(d), num(d.overdueAmount)), 0);
  const withDates = rows.filter((d) => debtDue(d)).sort((a, b) => debtDue(a).localeCompare(debtDue(b)));
  const principal = rows.reduce((sum, d) => sum + num(d.principalBalance), 0);

  /* Прогноз выхода: по самому длинному сроку среди долгов. */
  let horizon = null;
  rows.forEach((d) => {
    const result = payoff(d, extraPerMonth);
    if (result.date && (!horizon || result.date > horizon)) horizon = result.date;
  });

  return {
    rows, total, minimum, overdue, principal,
    count: rows.length,
    nearest: withDates[0] || null,
    horizon
  };
}

/** Порядок погашения. Стратегия по умолчанию — сначала срочные и просроченные. */
export function debtOrder(rows, strategy = 'urgent') {
  const copy = [...rows];
  const byRate = (a, b) => num(b.interestRate) - num(a.interestRate);
  const bySize = (a, b) => debtBalance(a) - debtBalance(b);
  const byUrgency = (a, b) => {
    const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a));
    if (overdueDiff) return overdueDiff;
    const dueA = debtDue(a) || '9999';
    const dueB = debtDue(b) || '9999';
    return dueA.localeCompare(dueB);
  };
  if (strategy === 'rate') return copy.sort(byRate);
  if (strategy === 'small') return copy.sort(bySize);
  return copy.sort(byUrgency);
}

/* ------------------------------- Финансы -------------------------------- */

/** Счета, у которых остаток подтверждён. Незаполненные исключаются из сумм,
 *  но показываются в интерфейсе — молчаливый ноль искажает картину денег. */
export const accountsWithBalance = (state) => (state.financeAccounts || [])
  .filter((a) => a && a.active !== false && numberOrNull(a.actualBalance) !== null);

export const accountsUnfilled = (state) => (state.financeAccounts || [])
  .filter((a) => a && a.active !== false && numberOrNull(a.actualBalance) === null);

export function totalBalance(state) {
  const filled = accountsWithBalance(state);
  return {
    total: filled.reduce((sum, a) => sum + num(a.actualBalance), 0),
    filledCount: filled.length,
    unfilledCount: accountsUnfilled(state).length
  };
}

export const operationsOfMonth = (state, month = monthKey(todayKey())) =>
  (state.operations || []).filter((op) => op && monthKey(op.date) === month);

export function monthTotals(state, month = monthKey(todayKey())) {
  const ops = operationsOfMonth(state, month);
  const sum = (type) => ops.filter((o) => o.type === type).reduce((acc, o) => acc + num(o.amount), 0);
  const income = sum('income');
  const expense = sum('expense');
  return { income, expense, transfer: sum('transfer'), net: income - expense, count: ops.length };
}

/** Расходы по категориям за месяц с лимитами. */
export function categorySpend(state, month = monthKey(todayKey())) {
  const ops = operationsOfMonth(state, month).filter((o) => o.type === 'expense');
  const byName = new Map();
  ops.forEach((op) => {
    const name = op.category || 'Без категории';
    byName.set(name, (byName.get(name) || 0) + num(op.amount));
  });
  const limits = (state.financeMonthBudgets || {})[month] || {};
  const categories = state.financeCategories || [];

  return [...byName.entries()]
    .map(([name, spent]) => {
      const meta = categories.find((c) => c && c.name === name);
      const limit = numberOrNull(limits[name]) ?? numberOrNull(meta && meta.monthlyLimit);
      return {
        name, spent, limit,
        share: limit ? spent / limit : null,
        over: limit !== null && spent > limit
      };
    })
    .sort((a, b) => b.spent - a.spent);
}

/* ------------------------------ Привычки -------------------------------- */

export const activeHabits = (state) => (state.habits || []).filter((h) => h && h.active !== false);

/** Отметка за дату. marks — словарь дата→значение, формат сохраняем как есть. */
export function habitMark(habit, dateKey) {
  const marks = habit && habit.marks && typeof habit.marks === 'object' ? habit.marks : {};
  const value = marks[dateKey];
  if (value === undefined || value === null || value === false) return null;
  return value;
}

export const isHabitDone = (habit, dateKey) => {
  const mark = habitMark(habit, dateKey);
  if (mark === null) return false;
  if (typeof mark === 'number') return mark > 0;
  if (typeof mark === 'object') return Boolean(mark.done ?? mark.value ?? true);
  return Boolean(mark);
};

export function habitStreak(habit, endKey = todayKey()) {
  let streak = 0;
  const date = parseKey(endKey);
  if (!date) return 0;
  for (let i = 0; i < 400; i += 1) {
    const key = toKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - i, 12));
    if (isHabitDone(habit, key)) streak += 1;
    else if (i > 0) break;              /* сегодня ещё не отмечено — серия не рвётся */
  }
  return streak;
}

export function habitsToday(state, dateKey = todayKey()) {
  const habits = activeHabits(state);
  const done = habits.filter((h) => isHabitDone(h, dateKey));
  return { habits, done: done.length, total: habits.length };
}

/** Доля выполнения за последние 7 дней по всем активным привычкам. */
export function weekCompletion(state, days) {
  const habits = activeHabits(state);
  if (!habits.length || !days.length) return 0;
  let done = 0;
  habits.forEach((h) => days.forEach((d) => { if (isHabitDone(h, d)) done += 1; }));
  return done / (habits.length * days.length);
}

/* -------------------------------- Задачи -------------------------------- */

export const openTasks = (state) => (state.tasks || [])
  .filter((t) => t && t.status !== 'done' && !t.completedAt);

export function tasksForDay(state, dateKey = todayKey()) {
  return openTasks(state)
    .filter((t) => t.date === dateKey)
    .sort((a, b) => String(a.time || '99:99').localeCompare(String(b.time || '99:99')));
}

export const overdueTasks = (state, dateKey = todayKey()) =>
  openTasks(state).filter((t) => t.date && t.date < dateKey);
