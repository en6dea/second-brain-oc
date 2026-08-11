/* Действия: создание и правка записей.

   Формы описываются полями, значения читает modal.js. Числовые поля
   возвращают null, если оставлены пустыми, — это сохраняет разницу между
   «не заполнено» и «ноль». */

import {
  getState, update, uid, nowIso, num,
  exportState, importState, createBackup, restoreBackup
} from './store.js?v=2.4.0';
import { openModal } from './modal.js?v=2.4.0';
import { todayKey } from './format.js?v=2.4.0';

const find = (name, id) => (getState()[name] || []).find((x) => x && x.id === id) || null;

function upsert(name, id, patch) {
  update((state) => {
    if (!Array.isArray(state[name])) state[name] = [];
    const existing = state[name].find((x) => x && x.id === id);
    if (existing) Object.assign(existing, patch, { updatedAt: nowIso() });
    else state[name].unshift(Object.assign({ id: uid(), createdAt: nowIso() }, patch, { updatedAt: nowIso() }));
  }, `${name}-save`);
}

/* -------------------------------- Долги --------------------------------- */

const DEBT_TYPES = [
  ['microloan', 'Займ / микрозайм'], ['bank_credit', 'Банковский кредит'],
  ['credit_card', 'Кредитная карта'], ['installment', 'Рассрочка'],
  ['person', 'Долг человеку'], ['other', 'Другое обязательство']
];
const DEBT_STATUS = [
  ['active', 'Активен'], ['soon', 'Платёж скоро'], ['overdue', 'Просрочен'],
  ['restructured', 'Реструктурирован'], ['frozen', 'Заморожен'], ['closed', 'Закрыт']
];

export function editDebt(id = '') {
  const debt = find('debts', id) || {};
  openModal({
    title: id ? 'Обязательство' : 'Новое обязательство',
    subtitle: 'Тело, проценты и штрафы указываются отдельно — тогда прогноз погашения считается честно',
    fields: [
      { id: 'creditor', label: 'Кредитор или название', value: debt.creditor || debt.person || '', required: true, span: true },
      { id: 'type', label: 'Тип', type: 'select', value: debt.type || 'microloan',
        options: DEBT_TYPES.map(([value, label]) => ({ value, label })) },
      { id: 'status', label: 'Состояние', type: 'select', value: debt.status || 'active',
        options: DEBT_STATUS.map(([value, label]) => ({ value, label })) },
      { id: 'initialAmount', label: 'Первоначальная сумма', type: 'number', min: 0, value: debt.initialAmount },
      { id: 'currentBalance', label: 'Текущий остаток', type: 'number', min: 0, value: debt.currentBalance,
        hint: 'Оставьте пустым, если неизвестен' },
      { id: 'principalBalance', label: 'Тело долга', type: 'number', min: 0, value: debt.principalBalance },
      { id: 'accruedInterest', label: 'Начисленные проценты', type: 'number', min: 0, value: debt.accruedInterest },
      { id: 'penalties', label: 'Штрафы и пени', type: 'number', min: 0, value: debt.penalties },
      { id: 'interestRate', label: 'Ставка, % годовых', type: 'number', min: 0, value: debt.interestRate },
      { id: 'minimumPayment', label: 'Минимальный платёж', type: 'number', min: 0, value: debt.minimumPayment },
      { id: 'nextPaymentDate', label: 'Ближайший платёж', type: 'date', value: debt.nextPaymentDate || '' },
      { id: 'daysOverdue', label: 'Дней просрочки', type: 'number', min: 0, value: debt.daysOverdue },
      { id: 'note', label: 'Комментарий', type: 'textarea', value: debt.note || '', span: true }
    ],
    danger: id ? {
      text: 'Закрыть долг',
      confirm: 'Закрыть долг? Запись останется, история платежей сохранится.',
      run: () => update((state) => {
        const row = (state.debts || []).find((x) => x.id === id);
        if (row) { row.status = 'closed'; row.currentBalance = 0; row.closedAt = nowIso(); }
      }, 'debt-close')
    } : null,
    onSubmit: (values) => {
      if (values.interestRate !== null && values.interestRate < 0) return 'Ставка не может быть отрицательной';
      upsert('debts', id, Object.assign({ direction: 'out' }, values));
    }
  });
}

/** Платёж по долгу: сумма делится на тело, проценты и штрафы. */
export function payDebt(id) {
  const debt = find('debts', id);
  if (!debt) return;
  openModal({
    title: `Платёж · ${debt.creditor || debt.person || 'долг'}`,
    subtitle: 'Основной долг уменьшит только часть «тело» — остальное уходит банку',
    fields: [
      { id: 'date', label: 'Дата', type: 'date', value: todayKey(), required: true },
      { id: 'amount', label: 'Общая сумма платежа', type: 'number', min: 0, value: debt.minimumPayment, required: true },
      { id: 'principal', label: 'Из них тело долга', type: 'number', min: 0 },
      { id: 'interest', label: 'Проценты', type: 'number', min: 0 },
      { id: 'penalties', label: 'Штрафы', type: 'number', min: 0 },
      { id: 'note', label: 'Комментарий', type: 'textarea', span: true }
    ],
    submitText: 'Внести платёж',
    onSubmit: (values) => {
      const total = num(values.amount);
      if (total <= 0) return 'Укажите сумму платежа';
      const parts = num(values.principal) + num(values.interest) + num(values.penalties);
      if (parts > 0 && Math.abs(parts - total) > 0.5) {
        return `Части (${parts} ₽) не сходятся с общей суммой (${total} ₽)`;
      }
      /* Если разбивка не указана — весь платёж считаем телом долга, но
         честно помечаем это, чтобы позже было видно происхождение цифры. */
      const principal = parts > 0 ? num(values.principal) : total;

      update((state) => {
        const row = (state.debts || []).find((x) => x.id === id);
        if (!row) return;
        const balance = num(row.currentBalance) || num(row.principalBalance) + num(row.accruedInterest) + num(row.penalties);
        row.currentBalance = Math.max(0, balance - total);
        row.principalBalance = Math.max(0, num(row.principalBalance) - principal);
        if (num(values.interest)) row.accruedInterest = Math.max(0, num(row.accruedInterest) - num(values.interest));
        if (num(values.penalties)) row.penalties = Math.max(0, num(row.penalties) - num(values.penalties));
        if (row.currentBalance === 0) row.status = 'closed';

        if (!Array.isArray(state.debtPayments)) state.debtPayments = [];
        state.debtPayments.unshift({
          id: uid(), debtId: id, date: values.date, amount: total,
          principal, interest: num(values.interest), penalties: num(values.penalties),
          split: parts > 0 ? 'explicit' : 'assumed-principal',
          note: values.note || '', createdAt: nowIso()
        });
      }, 'debt-payment');
    }
  });
}

export function debtStrategy() {
  const settings = (getState().settings && getState().settings.v884) || {};
  openModal({
    title: 'Стратегия погашения',
    fields: [
      { id: 'debtStrategy', label: 'Порядок', type: 'select', span: true, value: settings.debtStrategy || 'urgent',
        options: [
          { value: 'urgent', label: 'Сначала срочные и просроченные' },
          { value: 'rate', label: 'Сначала дорогие по ставке' },
          { value: 'small', label: 'Сначала самые маленькие' }
        ] },
      { id: 'extraDebtPayment', label: 'Доплата сверх минимума, в месяц', type: 'number', min: 0, span: true,
        value: settings.extraDebtPayment ?? 10000, hint: 'Используется в прогнозе и сценариях' }
    ],
    onSubmit: (values) => update((state) => {
      state.settings = state.settings || {};
      state.settings.v884 = Object.assign({}, state.settings.v884, {
        debtStrategy: values.debtStrategy,
        extraDebtPayment: values.extraDebtPayment ?? 0
      });
    }, 'debt-strategy')
  });
}

/* -------------------------------- Счета --------------------------------- */

const ACCOUNT_TYPES = [
  ['account', 'Счёт'], ['card', 'Карта'], ['cash', 'Наличные'],
  ['savings', 'Накопительный'], ['credit_card', 'Кредитная карта'], ['other', 'Другое']
];

export function editAccount(id = '') {
  const account = find('financeAccounts', id) || {};
  openModal({
    title: id ? 'Счёт' : 'Новый счёт',
    fields: [
      { id: 'name', label: 'Название', value: account.name || '', required: true, span: true },
      { id: 'type', label: 'Тип', type: 'select', value: account.type || 'account',
        options: ACCOUNT_TYPES.map(([value, label]) => ({ value, label })) },
      { id: 'actualBalance', label: 'Фактический остаток', type: 'number', value: account.actualBalance,
        hint: 'Пустое поле означает «неизвестен», а не ноль' }
    ],
    onSubmit: (values) => upsert('financeAccounts', id, {
      name: values.name,
      type: values.type,
      currency: account.currency || 'RUB',
      actualBalance: values.actualBalance,      /* null сохраняем как null */
      calculatedBalance: values.actualBalance,
      active: true
    })
  });
}

/** Сверка остатков: одно окно на все счета. */
export function reconcile() {
  const accounts = (getState().financeAccounts || []).filter((a) => a && a.active !== false);
  if (!accounts.length) return editAccount();
  openModal({
    title: 'Сверка остатков',
    subtitle: 'Укажите фактические суммы. Пустое поле оставит остаток неподтверждённым.',
    fields: accounts.map((a) => ({
      id: `acc_${a.id}`, label: a.name || 'Счёт', type: 'number', value: a.actualBalance
    })),
    submitText: 'Подтвердить',
    onSubmit: (values) => update((state) => {
      (state.financeAccounts || []).forEach((a) => {
        if (!(`acc_${a.id}` in values)) return;
        a.actualBalance = values[`acc_${a.id}`];
        a.calculatedBalance = a.actualBalance;
        a.reconciledAt = nowIso();
        a.updatedAt = nowIso();
      });
    }, 'reconcile')
  });
}

/* ------------------------------- Операции ------------------------------- */

export function editOperation(id = '') {
  const state = getState();
  const operation = find('operations', id) || {};
  const accounts = (state.financeAccounts || []).filter((a) => a && a.active !== false);
  const categories = (state.financeCategories || []).filter((c) => c && c.archived !== true);

  openModal({
    title: id ? 'Операция' : 'Новая операция',
    fields: [
      { id: 'type', label: 'Тип', type: 'select', value: operation.type || 'expense',
        options: [
          { value: 'expense', label: 'Расход' },
          { value: 'income', label: 'Доход' },
          { value: 'transfer', label: 'Перевод' }
        ] },
      { id: 'date', label: 'Дата', type: 'date', value: operation.date || todayKey(), required: true },
      { id: 'amount', label: 'Сумма', type: 'number', min: 0, value: operation.amount, required: true },
      { id: 'category', label: 'Категория', type: 'select', value: operation.category || (categories[0] && categories[0].name) || '',
        options: categories.length
          ? categories.map((c) => ({ value: c.name, label: c.name }))
          : [{ value: '', label: 'Категорий пока нет' }] },
      { id: 'accountId', label: 'Счёт', type: 'select', value: operation.accountId || (accounts[0] && accounts[0].id) || '',
        options: accounts.length
          ? accounts.map((a) => ({ value: a.id, label: a.name || 'Счёт' }))
          : [{ value: '', label: 'Счетов пока нет' }] },
      { id: 'note', label: 'Комментарий', type: 'textarea', value: operation.note || '', span: true }
    ],
    onSubmit: (values) => {
      if (!num(values.amount)) return 'Укажите сумму больше нуля';
      const account = accounts.find((a) => a.id === values.accountId);
      upsert('operations', id, {
        type: values.type, date: values.date, amount: num(values.amount),
        category: values.category, accountId: values.accountId,
        account: account ? account.name : '', note: values.note
      });
      /* Остаток счёта двигаем только если он был подтверждён: иначе
         неизвестное значение превратилось бы в вычисленное. */
      if (account && account.actualBalance !== null && account.actualBalance !== undefined) {
        update((s) => {
          const row = (s.financeAccounts || []).find((a) => a.id === values.accountId);
          if (!row) return;
          const delta = values.type === 'income' ? num(values.amount) : -num(values.amount);
          if (values.type !== 'transfer') {
            row.actualBalance = num(row.actualBalance) + delta;
            row.calculatedBalance = row.actualBalance;
          }
        }, 'operation-balance');
      }
    }
  });
}

/* ------------------------------- Привычки ------------------------------- */

export function editHabit(id = '') {
  const habit = find('habits', id) || {};
  openModal({
    title: id ? 'Привычка' : 'Новая привычка',
    fields: [
      { id: 'name', label: 'Название', value: habit.name || '', required: true, span: true },
      { id: 'frequency', label: 'Частота', type: 'select', value: habit.frequency || 'daily',
        options: [
          { value: 'daily', label: 'Каждый день' },
          { value: 'weekdays', label: 'По будням' },
          { value: 'weekly', label: 'Несколько раз в неделю' }
        ] },
      { id: 'target', label: 'Цель (например, минут)', type: 'number', min: 0, value: habit.target },
      { id: 'note', label: 'Зачем она мне', type: 'textarea', value: habit.note || '', span: true }
    ],
    danger: id ? {
      text: 'В архив',
      confirm: 'Убрать привычку из активных? Отметки сохранятся.',
      run: () => update((state) => {
        const row = (state.habits || []).find((x) => x.id === id);
        if (row) row.active = false;
      }, 'habit-archive')
    } : null,
    onSubmit: (values) => upsert('habits', id, {
      name: values.name, frequency: values.frequency,
      target: values.target, note: values.note,
      active: true, marks: habit.marks || {}   /* отметки не трогаем */
    })
  });
}

/* -------------------------------- Задачи -------------------------------- */

export function editTask(id = '', presetDate = '') {
  const task = find('tasks', id) || {};
  openModal({
    title: id ? 'Задача' : 'Новая задача',
    fields: [
      { id: 'title', label: 'Что сделать', value: task.title || '', required: true, span: true },
      { id: 'date', label: 'Дата', type: 'date', value: task.date || presetDate || todayKey() },
      { id: 'time', label: 'Время', type: 'time', value: task.time || '' },
      { id: 'priority', label: 'Приоритет', type: 'select', value: task.priority || 'B',
        options: [
          { value: 'A', label: 'A — важно и срочно' },
          { value: 'B', label: 'B — важно' },
          { value: 'C', label: 'C — можно отложить' }
        ] },
      { id: 'note', label: 'Заметка', type: 'textarea', value: task.note || '', span: true }
    ],
    danger: id ? {
      text: 'Выполнено',
      run: () => update((state) => {
        const row = (state.tasks || []).find((x) => x.id === id);
        if (row) { row.status = 'done'; row.completedAt = nowIso(); }
      }, 'task-done')
    } : null,
    onSubmit: (values) => upsert('tasks', id, {
      title: values.title, date: values.date, time: values.time,
      priority: values.priority, note: values.note, status: task.status || 'open'
    })
  });
}

/* --------------------------------- Цели --------------------------------- */

export function editGoal(id = '') {
  const goal = find('goals', id) || {};
  const habits = (getState().habits || []).filter((h) => h && h.active !== false);
  const stagesText = Array.isArray(goal.stages)
    ? goal.stages.map((s) => (s && s.done ? '+ ' : '') + (s.title || '')).join('\n')
    : '';

  openModal({
    title: id ? 'Цель' : 'Новая цель',
    subtitle: 'Следующий шаг обязателен: без него цель остаётся намерением',
    fields: [
      { id: 'title', label: 'Цель', value: goal.title || '', required: true, span: true },
      { id: 'nextAction', label: 'Следующий шаг', value: goal.nextAction || '', required: true, span: true,
        hint: 'Одно конкретное действие, которое можно сделать на этой неделе' },
      { id: 'due', label: 'Срок', type: 'date', value: goal.due || goal.date || '' },
      { id: 'status', label: 'Состояние', type: 'select', value: goal.status || 'active',
        options: [
          { value: 'active', label: 'В работе' },
          { value: 'paused', label: 'На паузе' },
          { value: 'done', label: 'Достигнута' }
        ] },
      { id: 'stages', label: 'Этапы, по одному в строке', type: 'textarea', value: stagesText, span: true,
        hint: 'Строку, начинающуюся со знака +, считаю выполненной' },
      { id: 'habitIds', label: 'Привычки, ведущие к цели', type: 'select', span: true,
        value: (goal.habitIds || [])[0] || '',
        options: [{ value: '', label: 'Без привычки' }]
          .concat(habits.map((h) => ({ value: h.id, label: h.name || 'Привычка' }))) },
      { id: 'note', label: 'Зачем это мне', type: 'textarea', value: goal.note || '', span: true }
    ],
    danger: id ? {
      text: 'В архив',
      confirm: 'Убрать цель из активных? Запись сохранится.',
      run: () => update((state) => {
        const row = (state.goals || []).find((x) => x.id === id);
        if (row) row.status = 'archived';
      }, 'goal-archive')
    } : null,
    onSubmit: (values) => {
      /* Этапы разбираем построчно, сохраняя прежний формат {id,title,done,order} */
      const previous = Array.isArray(goal.stages) ? goal.stages : [];
      const stages = String(values.stages || '')
        .split('\n').map((line) => line.trim()).filter(Boolean)
        .map((line, index) => {
          const done = line.startsWith('+');
          const title = done ? line.slice(1).trim() : line;
          const old = previous.find((s) => s && s.title === title);
          return { id: (old && old.id) || uid(), title, done: done || Boolean(old && old.done), order: index };
        });
      upsert('goals', id, {
        title: values.title, nextAction: values.nextAction,
        due: values.due, date: values.due,
        status: values.status, stages,
        habitIds: values.habitIds ? [values.habitIds] : [],
        note: values.note
      });
    }
  });
}

/** Переключает этап цели. */
export function toggleStage(goalId, index) {
  update((state) => {
    const goal = (state.goals || []).find((g) => g && g.id === goalId);
    const stage = goal && Array.isArray(goal.stages) ? goal.stages[Number(index)] : null;
    if (stage) { stage.done = !stage.done; goal.updatedAt = nowIso(); }
  }, 'goal-stage');
}

/* ----------------------------- Информация ------------------------------- */

const SECTION_TITLES = {
  notes: 'Заметка', ideas: 'Идея', wishes: 'Желание',
  books: 'Книга', films: 'Фильм', documents: 'Документ'
};

export function editInfo(section, id = '') {
  const collection = SECTION_TITLES[section] ? section : 'notes';
  const row = find(collection, id) || {};
  openModal({
    title: id ? SECTION_TITLES[collection] : `Новая запись · ${SECTION_TITLES[collection]}`,
    fields: [
      { id: 'title', label: 'Название', value: row.title || row.name || '', required: true, span: true },
      ...(collection === 'books' ? [{ id: 'author', label: 'Автор', value: row.author || '' }] : []),
      ...(collection === 'wishes' ? [{ id: 'price', label: 'Примерная цена', type: 'number', min: 0, value: row.price }] : []),
      { id: 'text', label: 'Текст или заметка', type: 'textarea', value: row.text || row.note || '', span: true }
    ],
    danger: id ? {
      text: 'Удалить',
      confirm: 'Удалить запись? Отменить будет нельзя.',
      run: () => update((state) => {
        state[collection] = (state[collection] || []).filter((x) => x.id !== id);
      }, 'info-delete')
    } : null,
    onSubmit: (values) => upsert(collection, id, {
      title: values.title,
      author: values.author,
      price: values.price,
      text: values.text,
      note: values.text
    })
  });
}

/* -------------------------------- Люди ---------------------------------- */

export function editPerson(id = '') {
  const person = find('people', id) || {};
  openModal({
    title: id ? 'Человек' : 'Новый человек',
    fields: [
      { id: 'name', label: 'Имя', value: person.name || '', required: true, span: true },
      { id: 'relation', label: 'Кто это', value: person.relation || person.role || '',
        placeholder: 'друг, коллега, родственник' },
      { id: 'birthday', label: 'День рождения', type: 'date', value: person.birthday || person.birthDate || '' },
      { id: 'phone', label: 'Телефон или контакт', value: person.phone || person.contact || '' },
      { id: 'promise', label: 'Что я обещал', value: person.promise || '' },
      { id: 'note', label: 'Заметка', type: 'textarea', value: person.note || '', span: true }
    ],
    danger: id ? {
      text: 'Удалить',
      confirm: 'Удалить запись о человеке?',
      run: () => update((state) => {
        state.people = (state.people || []).filter((x) => x.id !== id);
      }, 'person-delete')
    } : null,
    onSubmit: (values) => upsert('people', id, values)
  });
}

/* --------------------- Служебные действия с данными --------------------- */

/** Выгрузка состояния в файл. Имя с датой, чтобы копии не путались. */
export function exportJson() {
  const data = exportState();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `second-brain-${stamp}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

/** Загрузка из файла. mode: 'merge' добавляет, 'replace' заменяет всё. */
export function importJson(mode = 'merge') {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      /* Файл прежней версии мог быть обёрнут: {state: {...}} */
      const payload = parsed && parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed;

      if (mode === 'replace') {
        const counts = Object.keys(payload).filter((k) => Array.isArray(payload[k])).length;
        const ok = window.confirm(
          `Заменить все данные содержимым файла?\n\nКоллекций в файле: ${counts}.\n` +
          'Текущее состояние будет сохранено отдельной копией, но активными станут данные из файла.'
        );
        if (!ok) return;
      }

      const result = await importState(payload, mode);
      if (mode === 'replace') {
        alert('Данные заменены. Копия прежнего состояния сохранена.');
      } else {
        const added = Object.entries(result || {});
        alert(added.length
          ? `Добавлено:\n${added.map(([k, n]) => `${k}: ${n}`).join('\n')}`
          : 'Новых записей в файле не нашлось — всё это уже есть.');
      }
    } catch (error) {
      alert(`Не удалось прочитать файл: ${error && error.message || error}`);
    }
  };
  input.click();
}

export async function backupNow() {
  try {
    const result = await createBackup('manual');
    alert(`Копия создана: ${result.createdAt.slice(0, 16).replace('T', ' ')}`);
    return result;
  } catch (error) {
    alert(`Не удалось создать копию: ${error && error.message || error}`);
  }
}

export async function restoreFrom(key) {
  if (!window.confirm('Восстановить данные из этой копии?\n\nТекущее состояние будет сохранено отдельной копией.')) return;
  try {
    await restoreBackup(key);
    alert('Данные восстановлены.');
  } catch (error) {
    alert(`Не удалось восстановить: ${error && error.message || error}`);
  }
}

/* -------------------------------- Архив --------------------------------- */

/* Куда возвращать запись — помним в самой записи. Без этого архив
   превращается в свалку, из которой ничего нельзя достать обратно. */

const ARCHIVABLE = {
  notes: 'Заметка', ideas: 'Идея', wishes: 'Желание', books: 'Книга',
  films: 'Фильм', documents: 'Документ', people: 'Человек', tasks: 'Задача'
};

/** Переносит запись в архив, запоминая, откуда она пришла. */
export function archiveRecord(collection, id) {
  if (!ARCHIVABLE[collection]) return;
  update((state) => {
    const list = state[collection] || [];
    const index = list.findIndex((row) => row && row.id === id);
    if (index === -1) return;
    const [row] = list.splice(index, 1);
    if (!Array.isArray(state.archive)) state.archive = [];
    state.archive.unshift(Object.assign({}, row, {
      archivedAt: nowIso(),
      archivedFrom: collection,
      type: ARCHIVABLE[collection]
    }));
  }, 'archive-move');
}

/** Возвращает запись туда, откуда она была убрана. */
export function restoreFromArchive(id) {
  update((state) => {
    const list = state.archive || [];
    const index = list.findIndex((row) => row && row.id === id);
    if (index === -1) return;
    const [row] = list.splice(index, 1);
    const target = ARCHIVABLE[row.archivedFrom] ? row.archivedFrom : 'notes';
    if (!Array.isArray(state[target])) state[target] = [];
    const restored = Object.assign({}, row);
    delete restored.archivedAt;
    delete restored.archivedFrom;
    delete restored.type;
    restored.updatedAt = nowIso();
    state[target].unshift(restored);
  }, 'archive-restore');
}

/* ------------------------------- Профиль -------------------------------- */

export function editProfile() {
  const settings = getState().settings || {};
  const name = typeof settings.name === 'string'
    ? settings.name
    : (settings.profile && settings.profile.name) || '';
  openModal({
    title: 'Профиль',
    subtitle: 'Имя и подпись показываются в приветствии на экране «Сегодня»',
    fields: [
      { id: 'name', label: 'Как к вам обращаться', value: name, span: true,
        placeholder: 'Алексей' },
      { id: 'subtitle', label: 'Подпись под приветствием', value: settings.subtitle || '', span: true,
        placeholder: 'Фокус на рост', hint: 'Короткая фраза, задающая тон дню' }
    ],
    onSubmit: (values) => update((state) => {
      state.settings = state.settings || {};
      state.settings.name = values.name;
      state.settings.subtitle = values.subtitle;
      /* Прежняя версия читает имя ещё и из profile — держим согласованным. */
      if (state.settings.profile && typeof state.settings.profile === 'object') {
        state.settings.profile.name = values.name;
      }
    }, 'profile-save')
  });
}
