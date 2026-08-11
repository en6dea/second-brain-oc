/* Генератор тестовых данных — только для отладки вёрстки и расчётов.
   В приложение не подключён: вызывается вручную из консоли браузера.

   Пишет в то же хранилище, что и оба приложения, поэтому на устройстве
   с настоящими записями запускать не нужно. Перед записью store.js делает
   резервную копию, так что откат возможен. */

import { getState, save, uid, nowIso } from './store.js?v=2.3.0';
import { todayKey, toKey, parseKey, monthKey } from './format.js?v=2.3.0';

export function seed() {
  const state = getState();
  const today = parseKey(todayKey());
  const dayBefore = (n) => toKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n, 12));

  state.settings = state.settings || {};
  state.settings.name = state.settings.name || 'Алексей';
  state.settings.subtitle = 'Фокус на рост';

  state.financeAccounts = [
    { id: uid(), name: 'Тинькофф', type: 'account', currency: 'RUB',
      actualBalance: 128400, calculatedBalance: 128400, active: true, createdAt: nowIso() },
    { id: uid(), name: 'Сбер', type: 'card', currency: 'RUB',
      actualBalance: 55800, calculatedBalance: 55800, active: true, createdAt: nowIso() },
    /* Незаполненный остаток — проверяем, что интерфейс не превращает его в ноль */
    { id: uid(), name: 'Наличные', type: 'cash', currency: 'RUB',
      actualBalance: null, calculatedBalance: null, active: true, createdAt: nowIso() }
  ];

  const cat = (name, limit) => ({
    id: uid(), name, type: 'expense', active: true, archived: false,
    monthlyLimit: limit, createdAt: nowIso()
  });
  state.financeCategories = [
    cat('Продукты', 30000), cat('Кафе', 10000), cat('Транспорт', 15000),
    cat('Жильё', 25000), cat('Здоровье', 8000)
  ];

  const op = (daysAgo, type, amount, category, note) => ({
    id: uid(), date: dayBefore(daysAgo), type, amount, category,
    account: 'Тинькофф', note: note || '', createdAt: nowIso(), updatedAt: nowIso()
  });
  state.operations = [
    op(1, 'expense', 4200, 'Продукты'), op(2, 'expense', 1800, 'Кафе'),
    op(3, 'expense', 12000, 'Жильё'), op(4, 'expense', 900, 'Транспорт'),
    op(5, 'expense', 6400, 'Продукты'), op(6, 'expense', 3100, 'Кафе'),
    op(7, 'expense', 2400, 'Здоровье'), op(9, 'expense', 10000, 'Жильё'),
    op(11, 'expense', 5600, 'Продукты'), op(12, 'expense', 2900, 'Транспорт'),
    op(13, 'expense', 5500, 'Кафе'),
    op(3, 'income', 142000, 'Зарплата')
  ];

  state.debts = [
    { id: uid(), direction: 'out', creditor: 'Альфа-банк', type: 'bank_credit', status: 'active',
      initialAmount: 300000, currentBalance: 214000, principalBalance: 198400,
      accruedInterest: 12600, penalties: 3000, interestRate: 19.9, minimumPayment: 12000,
      nextPaymentDate: dayBefore(-5), priority: 1, createdAt: nowIso(), updatedAt: nowIso() },
    { id: uid(), direction: 'out', creditor: 'Рассрочка · техника', type: 'installment', status: 'active',
      initialAmount: 90000, currentBalance: 42000, principalBalance: 42000,
      accruedInterest: 0, penalties: 0, interestRate: 0, minimumPayment: 7000,
      nextPaymentDate: dayBefore(-12), priority: 2, createdAt: nowIso(), updatedAt: nowIso() }
  ];

  const marks = (pattern) => {
    const out = {};
    pattern.forEach((done, i) => { if (done) out[dayBefore(6 - i)] = true; });
    return out;
  };
  state.habits = [
    { id: uid(), name: 'Чтение 20 минут', icon: '📖', active: true, frequency: 'daily',
      marks: marks([1, 1, 0, 1, 1, 0, 0]), createdAt: nowIso() },
    { id: uid(), name: 'Планка 1 минута', icon: '💪', active: true, frequency: 'daily',
      marks: marks([1, 0, 1, 1, 0, 1, 1]), createdAt: nowIso() },
    { id: uid(), name: 'Дневник благодарности', icon: '✍️', active: true, frequency: 'daily',
      marks: marks([1, 1, 1, 1, 1, 1, 1]), createdAt: nowIso() }
  ];

  state.tasks = [
    { id: uid(), title: 'Созвон по проекту', date: todayKey(), time: '11:00',
      status: 'open', priority: 'B', createdAt: nowIso() },
    { id: uid(), title: 'Забрать документы', date: todayKey(), time: '16:00',
      status: 'open', priority: 'A', createdAt: nowIso() },
    { id: uid(), title: 'Недельный разбор', date: todayKey(), time: '20:00',
      status: 'open', priority: 'C', createdAt: nowIso() }
  ];

  state.financeMonthBudgets = state.financeMonthBudgets || {};
  state.financeMonthBudgets[monthKey(todayKey())] = {
    'Продукты': 30000, 'Кафе': 10000, 'Транспорт': 15000, 'Жильё': 25000, 'Здоровье': 8000
  };

  state.settings.v884 = Object.assign({}, state.settings.v884, {
    debtStrategy: 'urgent', extraDebtPayment: 10000
  });

  return save('seed-test-data').then(() => {
    console.info('[seed] тестовые данные записаны, перезагрузите страницу');
    return true;
  });
}

window.seedSecondBrain = seed;
