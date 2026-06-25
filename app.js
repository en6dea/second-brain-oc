'use strict';

const RU_MONTHS = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const STORE_KEY = 'secondBrainOS.v1';

const defaultData = () => ({
  settings: {
    currentMonth: toMonthKey(new Date()),
    currency: '₽',
    allocation: { savings: 0, cushion: 0, goal: 0, life: 0 },
    transferDay: 10,
    categories: ['Продукты','Кафе','Транспорт','Дом','Здоровье','Одежда','Подписки','Подарки','Обучение','Развлечения','Путешествия','Импульсные','Финансовая цель','Сбережения','Подушка'],
    expenseCategories: ['Продукты','Кафе','Транспорт','Дом','Здоровье','Одежда','Подписки','Подарки','Обучение','Развлечения','Путешествия','Импульсные','Финансовая цель','Сбережения','Подушка','Другое'],
    incomeCategories: ['Зарплата','Проект','Фриланс','Возврат','Подарок','Продажа','Кэшбэк','Проценты','Кредитные средства','Взял в долг','Другое'],
    areas: ['Финансы','Здоровье','Работа','Обучение','Дом','Личное','Отдых','Отношения'],
  },
  operations: [],
  importRows: [],
  recurring: [],
  habits: [
    { id: uid(), name: 'Записать расходы', area: 'Финансы', active: true, targetPerWeek: 7 },
    { id: uid(), name: 'Без импульсных покупок', area: 'Финансы', active: true, targetPerWeek: 5 },
    { id: uid(), name: 'Сон 7+ часов', area: 'Здоровье', active: true, targetPerWeek: 5 },
    { id: uid(), name: 'Движение / прогулка', area: 'Здоровье', active: true, targetPerWeek: 4 },
    { id: uid(), name: 'План дня', area: 'Личное', active: true, targetPerWeek: 5 },
    { id: uid(), name: 'Обучение / чтение', area: 'Обучение', active: true, targetPerWeek: 4 },
  ],
  habitLogs: {},
  goals: [],
  tasks: [],
  states: [],
  journal: [],
  reports: [],
  achievements: [],
});

let state = load();
let activePage = 'dashboard';
let activePanelTab = 'period';
let lastDeletedOperation = null;
let financeView = { page: 1, perPage: 50, type: 'all', query: '', from: '', to: '' };
const ALLOCATION_CATEGORIES = ['Сбережения', 'Подушка', 'Финансовая цель'];
const LOAN_INCOME_CATEGORIES = ['Кредитные средства', 'Взял в долг'];

const pages = [
  ['dashboard', '🏠', 'Главная'],
  ['today', '🌤', 'Сегодня'],
  ['quick', '⚡', 'Быстрый ввод'],
  ['finance', '💸', 'Деньги'],
  ['bank', '🏦', 'Банк-импорт'],
  ['panel', '🎛', 'Панель анализа'],
  ['goals', '🎯', 'SMART-цели'],
  ['habits', '✅', 'Привычки'],
  ['tasks', '📌', 'Задачи'],
  ['calendar', '🔔', 'Календарь'],
  ['state', '🌿', 'Состояние'],
  ['insights', '✨', 'Инсайты'],
  ['sync', '☁️', 'Синхронизация'],
  ['settings', '⚙️', 'Настройки'],
];

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function todayKey() { return toDateKey(new Date()); }
function toDateKey(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0,10); }
function toMonthKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
function monthLabel(key) { const [y,m] = key.split('-').map(Number); return `${RU_MONTHS[m-1]} ${y}`; }
function money(n) { return `${Math.round(Number(n || 0)).toLocaleString('ru-RU')} ${state.settings.currency}`; }
function num(n) { return Number(String(n || '').replace(/\s/g,'').replace(',', '.')) || 0; }
function clamp(n, min=0, max=100) { return Math.max(min, Math.min(max, n)); }
function parseDate(value) {
  if (!value) return todayKey();
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0,10);
  const m = raw.match(/(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})/);
  if (m) {
    const y = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    return `${y}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return toDateKey(d);
  return todayKey();
}
function inMonth(dateKey, monthKey = state.settings.currentMonth) { return String(dateKey || '').startsWith(monthKey); }
function dateBetween(dateKey, from, to) { return (!from || dateKey >= from) && (!to || dateKey <= to); }
function daysLeftInMonth(monthKey = state.settings.currentMonth) {
  const [y,m] = monthKey.split('-').map(Number);
  const last = new Date(y, m, 0);
  const today = new Date();
  const current = today.getFullYear() === y && today.getMonth()+1 === m ? today : new Date(y, m-1, 1);
  return Math.max(1, Math.ceil((last - new Date(current.getFullYear(), current.getMonth(), current.getDate())) / 86400000) + 1);
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : defaultData();
    return migrate(data);
  } catch (e) {
    console.error(e);
    return defaultData();
  }
}
function migrate(data) {
  const base = defaultData();
  const incomingSettings = data.settings || {};
  const settings = {
    ...base.settings,
    ...incomingSettings,
    allocation: { ...base.settings.allocation, ...((incomingSettings || {}).allocation || {}) }
  };

  // Старые версии хранили один общий список categories.
  // Новая версия разделяет категории доходов и расходов, но оставляет categories для совместимости.
  if (!Array.isArray(settings.expenseCategories) || !settings.expenseCategories.length) {
    settings.expenseCategories = Array.isArray(incomingSettings.categories) && incomingSettings.categories.length
      ? [...incomingSettings.categories]
      : [...base.settings.expenseCategories];
  }
  if (!Array.isArray(settings.incomeCategories) || !settings.incomeCategories.length) {
    settings.incomeCategories = [...base.settings.incomeCategories];
  }
  settings.expenseCategories = uniqueClean(settings.expenseCategories);
  settings.incomeCategories = uniqueClean([
    ...settings.incomeCategories,
    'Кредитные средства',
    'Взял в долг'
  ]);
  settings.transferDay = Number(settings.transferDay || base.settings.transferDay || 10);
  settings.categories = uniqueClean([...settings.expenseCategories, ...settings.incomeCategories]);

  return { ...base, ...data, settings };
}
function save(options = {}) {
  state.meta = state.meta || {};
  state.meta.updatedAtLocal = new Date().toISOString();
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  if (!options.skipCloud && window.SecondBrainCloud) {
    window.SecondBrainCloud.schedulePush(state);
  }
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.style.display = 'none', 2600);
}

function monthOps(monthKey = state.settings.currentMonth) { return state.operations.filter(o => inMonth(o.date, monthKey)); }
function expenseOps(monthKey = state.settings.currentMonth) { return monthOps(monthKey).filter(o => o.type === 'expense'); }
function incomeOps(monthKey = state.settings.currentMonth) { return monthOps(monthKey).filter(o => o.type === 'income'); }
function total(list) { return list.reduce((s, x) => s + num(x.amount), 0); }
function operationTypeLabel(type) { return type === 'income' ? 'Доход' : 'Расход'; }
function uniqueClean(list) {
  return [...new Set((list || []).map(x => String(x || '').trim()).filter(Boolean))];
}
function categoryList(type = 'expense') {
  const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
  state.settings[key] = uniqueClean(state.settings[key] || []);
  if (!state.settings[key].length) {
    state.settings[key] = [...(defaultData().settings[key] || ['Другое'])];
  }
  state.settings.categories = uniqueClean([...(state.settings.expenseCategories || []), ...(state.settings.incomeCategories || [])]);
  return state.settings[key];
}
function categoryOptions(type = 'expense', selected = '') {
  return categoryList(type)
    .map(c => `<option value="${escapeAttr(c)}" ${c === selected ? 'selected' : ''}>${escapeHtml(c)}</option>`)
    .join('');
}
function addCategory(kind, name) {
  const category = String(name || '').trim();
  if (!category) return false;
  const type = kind === 'income' ? 'income' : 'expense';
  const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
  state.settings[key] = uniqueClean([...(state.settings[key] || []), category]);
  state.settings.categories = uniqueClean([...(state.settings.expenseCategories || []), ...(state.settings.incomeCategories || [])]);
  return true;
}
function removeCategory(kind, name) {
  const type = kind === 'income' ? 'income' : 'expense';
  const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
  const category = String(name || '').trim();
  if (!category) return false;
  state.settings[key] = uniqueClean(state.settings[key] || []).filter(c => c !== category);
  state.settings.categories = uniqueClean([...(state.settings.expenseCategories || []), ...(state.settings.incomeCategories || [])]);
  return true;
}
function categoryChips(kind) {
  const type = kind === 'income' ? 'income' : 'expense';
  return `<div class="category-chip-list">${categoryList(type).map(c => `<span class="category-chip"><span>${escapeHtml(c)}</span><button title="Удалить категорию" data-delete-category="${escapeAttr(type)}" data-category-name="${escapeAttr(c)}">×</button></span>`).join('')}</div>`;
}
function operationLabel(o) { return `${operationTypeLabel(o.type)} ${money(o.amount)}${o.category ? ' / ' + o.category : ''}${o.date ? ' / ' + o.date : ''}`; }
function deleteOperation(id) {
  const op = state.operations.find(o => o.id === id);
  if (!op) return;
  const msg = `Удалить операцию: ${operationLabel(op)}?`;
  if (!confirm(msg)) return;
  lastDeletedOperation = { ...op, deletedAt: new Date().toISOString() };
  state.operations = state.operations.filter(o => o.id !== id);
  save();
  render();
  toast('Операция удалена. Можно восстановить на странице Деньги.');
}
function undoLastDelete() {
  if (!lastDeletedOperation) return toast('Нет операции для восстановления');
  const { deletedAt, ...op } = lastDeletedOperation;
  state.operations.push(op);
  lastDeletedOperation = null;
  save();
  render();
  toast('Операция восстановлена');
}
function monthSummary(monthKey = state.settings.currentMonth) {
  const income = total(incomeOps(monthKey));
  const expensesList = expenseOps(monthKey);
  const savings = total(expensesList.filter(o => o.category === 'Сбережения'));
  const cushion = total(expensesList.filter(o => o.category === 'Подушка'));
  const goal = total(expensesList.filter(o => o.category === 'Финансовая цель'));
  const allocations = savings + cushion + goal;
  const expenses = total(expensesList.filter(o => !ALLOCATION_CATEGORIES.includes(o.category || '')));
  const allOut = expenses + allocations;
  const left = income - allOut;
  const dailyLimit = Math.max(0, left / daysLeftInMonth(monthKey));
  return { income, expenses, savings, cushion, goal, allocations, allOut, left, dailyLimit };
}
function manualAllocationStatus(monthKey = state.settings.currentMonth) {
  const s = monthSummary(monthKey);
  const [y, m] = monthKey.split('-').map(Number);
  const day = Number(state.settings.transferDay || 10);
  const due = `${monthKey}-${String(Math.min(day, new Date(y, m, 0).getDate())).padStart(2, '0')}`;
  const done = s.allocations > 0;
  const overdue = !done && todayKey() > due;
  const today = !done && todayKey() === due;
  return { ...s, due, done, overdue, today, day };
}
function allocationStatusCard() {
  const a = manualAllocationStatus();
  const tone = a.done ? 'green' : a.overdue ? 'danger' : a.today ? 'warn' : 'blue';
  const title = a.done ? 'Распределение сделано' : a.overdue ? 'Распределение просрочено' : a.today ? 'Сегодня финансовый день' : `Финансовый день ${a.day} числа`;
  const body = a.done
    ? `Уже отложено: ${money(a.allocations)} · Сбережения ${money(a.savings)} · Подушка ${money(a.cushion)} · Финцель ${money(a.goal)}`
    : `Запланируй ручной перевод 10-го числа. Автосписаний больше нет — ты сам контролируешь суммы.`;
  return `<div class="card allocation-card ${tone}"><div><span class="tag ${tone}">${title}</span><h3>🏦 Ручное распределение</h3><p class="sub">${body}</p></div><button class="primary-btn" data-open-modal="manualAllocation">Внести переводы</button></div>`;
}
function categoryTotals(from, to) {
  const ops = state.operations.filter(o => o.type === 'expense' && dateBetween(o.date, from, to));
  const map = {};
  ops.forEach(o => map[o.category || 'Без категории'] = (map[o.category || 'Без категории'] || 0) + num(o.amount));
  return Object.entries(map).sort((a,b) => b[1]-a[1]);
}
function habitMonthStats(monthKey = state.settings.currentMonth) {
  const active = state.habits.filter(h => h.active);
  const [y,m] = monthKey.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const done = active.reduce((sum, h) => {
    let c = 0;
    for (let d=1; d<=days; d++) {
      const key = `${monthKey}-${String(d).padStart(2,'0')}`;
      if (state.habitLogs[key]?.[h.id]) c++;
    }
    return sum + c;
  }, 0);
  const max = active.length * days || 1;
  return { active: active.length, done, max, percent: Math.round(done / max * 100) };
}
function goalsStats() {
  const active = state.goals.filter(g => g.status !== 'Готово' && g.status !== 'Отменена');
  const avg = active.length ? active.reduce((s,g)=>s+goalProgress(g),0)/active.length : 0;
  return { count: active.length, avg: Math.round(avg) };
}
function goalProgress(goal) {
  const metricProgress = goal.targetValue ? clamp(num(goal.currentValue) / num(goal.targetValue) * 100) : 0;
  const related = state.tasks.filter(t => t.goalId === goal.id);
  const done = related.filter(t => t.status === 'Готово').length;
  const taskProgress = related.length ? done / related.length * 100 : 0;
  if (goal.targetValue && related.length) return Math.round((metricProgress + taskProgress) / 2);
  return Math.round(goal.targetValue ? metricProgress : taskProgress);
}
function tasksStats() {
  const open = state.tasks.filter(t => t.status !== 'Готово' && t.status !== 'Отменена');
  const overdue = open.filter(t => t.due && t.due < todayKey()).length;
  const today = open.filter(t => t.due === todayKey()).length;
  return { open: open.length, overdue, today };
}
function stateStats(days = 7) {
  const from = new Date(); from.setDate(from.getDate() - days + 1);
  const fromKey = toDateKey(from);
  const rows = state.states.filter(s => s.date >= fromKey).sort((a,b)=>a.date.localeCompare(b.date));
  const avg = key => rows.length ? rows.reduce((s,r)=>s+num(r[key]),0)/rows.length : 0;
  return { rows, sleep: avg('sleep'), energy: avg('energy'), mood: avg('mood'), stress: avg('stress') };
}
function lifeScore() {
  const s = monthSummary();
  const finance = s.income ? clamp((s.left / Math.max(1, s.income * .2)) * 100) : 50;
  const habits = habitMonthStats().percent;
  const goals = goalsStats().avg || 40;
  const ts = tasksStats();
  const tasks = clamp(100 - ts.overdue * 20 - Math.max(0, ts.open - 10) * 2);
  const st = stateStats();
  const condition = st.rows.length ? clamp(((st.energy + st.mood) / 2 * 10) - st.stress * 3) : 60;
  return Math.round(finance*.3 + habits*.25 + goals*.2 + condition*.15 + tasks*.1);
}


function applyMobileMode() {
  const ua = navigator.userAgent || '';
  const byWidth = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
  const byTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const byUA = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
  const isMobile = Boolean(byWidth || (byTouch && window.innerWidth < 1100) || byUA);
  document.documentElement.classList.toggle('mobile-os', isMobile);
  document.body.classList.toggle('mobile-os', isMobile);
  document.documentElement.style.setProperty('--vvh', `${window.innerHeight}px`);
}

function init() {
  applyMobileMode();
  window.addEventListener('resize', applyMobileMode);
  window.addEventListener('orientationchange', () => setTimeout(applyMobileMode, 250));
  renderNav();
  bindGlobal();
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js?v=life-addons-v14-20260625').catch(console.warn);
  }
}
function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = pages.map(([id, icon, label]) => `<button data-page="${id}" class="${activePage===id?'active':''}"><span>${icon}</span>${label}</button>`).join('');
  nav.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => { activePage = btn.dataset.page; render(); }));
}
function bindGlobal() {
  document.querySelector('[data-action="quick"]').onclick = () => { activePage = 'quick'; render(); };
  document.querySelector('[data-action="backup"]').onclick = exportBackup;
  const fab = document.getElementById('fabAdd');
  if (fab) fab.onclick = () => openModal('quickExpense');
  document.getElementById('globalSearch').oninput = (e) => {
    if (activePage !== 'panel') activePage = 'panel';
    activePanelTab = 'search';
    render({ search: e.target.value });
  };
}
function render(opts = {}) {
  renderNav();
  const page = pages.find(p => p[0] === activePage);
  document.getElementById('pageTitle').textContent = page ? page[2] : 'Главная';
  document.getElementById('todayMini').innerHTML = `${new Date().toLocaleDateString('ru-RU')}<br>${monthLabel(state.settings.currentMonth)}<br><span class="tag green">Life Score ${lifeScore()}/100</span>`;
  const view = document.getElementById('view');
  const map = { dashboard, today: todayView, quick, finance, bank: bankImport, panel, goals, habits, tasks, calendar: calendarView, state: stateView, insights, sync: syncView, settings };
  view.innerHTML = (map[activePage] || dashboard)(opts);
  bindView();
}

function dashboard() {
  const s = monthSummary();
  const h = habitMonthStats();
  const g = goalsStats();
  const t = tasksStats();
  const sc = lifeScore();
  const cats = categoryTotals(`${state.settings.currentMonth}-01`, `${state.settings.currentMonth}-31`).slice(0,5);
  return `
    <div class="hero">
      <div class="hero-main">
        <div class="tiny-label">${monthLabel(state.settings.currentMonth)}</div>
        <h2>Твоя жизнь в одном экране</h2>
        <p>Вноси только главное: деньги, привычки, состояние, задачи и шаги к целям. Остальное система посчитает сама.</p>
        <div class="big-score">${sc}/100</div>
        <div class="sub">${scoreText(sc)}</div>
        <div class="actions-row">
          <button class="primary-btn" data-open-modal="quickExpense">💸 Добавить расход</button>
          <button class="soft-btn" data-page-jump="today">🌤 Сегодня</button>
          <button class="soft-btn" data-page-jump="habits">✅ Отметить привычки</button>
          <button class="soft-btn" data-open-modal="closeDay">🌙 Закрыть день</button>
        </div>
      </div>
      <div class="card">
        <h3>🆘 Антихаос</h3>
        <p class="sub">Минимум дня, когда нет сил.</p>
        <div class="pill-list">
          <span class="tag">1 расход</span><span class="tag">1 привычка</span><span class="tag">1 задача</span><span class="tag">сон</span>
        </div>
        <button class="soft-btn" data-action="antiChaos" style="margin-top:18px;width:100%">Показать минимум</button>
      </div>
    </div>
    <div class="grid cards" style="margin-top:16px">
      ${kpi('💰','Доход', money(s.income), 'Факт по операциям')}
      ${kpi('💸','Расходы на жизнь', money(s.expenses), `Остаток: ${money(s.left)}`)}
      ${kpi('📆','Лимит/день', money(s.dailyLimit), `До конца месяца: ${daysLeftInMonth()} дн.`)}
      ${kpi('✅','Привычки', `${h.percent}%`, `${h.done} отметок за месяц`)}
    </div>
    ${allocationStatusCard()}
    <div class="grid two" style="margin-top:16px">
      <div class="card">
        <h3>🎛 Категории месяца</h3>
        ${cats.length ? cats.map(([name, amount]) => categoryBar(name, amount, s.expenses)).join('') : empty('Пока нет расходов за месяц')}
      </div>
      <div class="card">
        <h3>🎯 Цели и задачи</h3>
        <div class="grid" style="gap:10px">
          <div><span class="tag green">Целей активных: ${g.count}</span></div>
          <div><span class="tag blue">Средний прогресс: ${g.avg}%</span></div>
          <div><span class="tag ${t.overdue?'danger':'green'}">Просрочено задач: ${t.overdue}</span></div>
          <div><span class="tag warn">Сегодня задач: ${t.today}</span></div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
        <h3>🧾 Последние операции</h3>
        <button class="soft-btn" data-page-jump="finance">Открыть журнал</button>
      </div>
      ${recentOperationsTable(8)}
    </div>`;
}
function scoreText(sc) {
  if (sc >= 85) return 'Система летит. Главное — не перегружай себя лишними задачами.';
  if (sc >= 70) return 'Стабильно. Есть зона роста, но общий ритм хороший.';
  if (sc >= 50) return 'Нормальная база. Нужен фокус на одной сфере, не на всех сразу.';
  return 'Режим восстановления. Включи антихаос и делай минимум.';
}
function kpi(icon, title, value, sub) { return `<div class="card"><div class="kpi-icon">${icon}</div><div class="metric">${value}</div><div class="sub"><b>${title}</b><br>${sub}</div></div>`; }
function categoryBar(name, amount, totalAmount) { const pct = totalAmount ? amount/totalAmount*100 : 0; return `<div class="category-bar"><b>${name}</b><div class="bar"><span style="width:${clamp(pct)}%"></span></div><span>${money(amount)}</span></div>`; }
function empty(text) { return `<div class="empty">${text}</div>`; }

function quick() {
  return `<div class="grid two">
    <div class="card"><h3>⚡ Быстрый ввод</h3><p class="sub">Основная идея: не ходить по листам. Добавляй события жизни отсюда.</p><div class="actions-row">
      <button class="primary-btn" data-open-modal="quickExpense">💸 Расход</button>
      <button class="soft-btn" data-page-jump="bank">🏦 Импорт банка</button>
      <button class="soft-btn" data-open-modal="quickIncome">💰 Доход</button>
      <button class="soft-btn" data-open-modal="manualAllocation">🏦 Распределение</button>
      <button class="soft-btn" data-open-modal="quickTask">📌 Задача</button>
      <button class="soft-btn" data-page-jump="calendar">🔔 Календарь</button>
      <button class="soft-btn" data-open-modal="quickGoal">🎯 SMART-цель</button>
      <button class="soft-btn" data-open-modal="closeDay">🌙 Закрыть день</button>
      <button class="soft-btn" data-open-modal="wantBuy">🛒 Хочу купить</button>
    </div></div>
    <div class="card"><h3>📌 Сегодня достаточно</h3><div class="pill-list"><span class="tag">Записать расходы</span><span class="tag">Отметить привычки</span><span class="tag">Закрыть день</span></div><p class="sub" style="margin-top:14px">Не надо вести всё идеально. Система должна помогать, а не давить.</p></div>
    <div class="card"><h3>🧾 Последние записи</h3>${recentOperationsTable(6)}</div>
  </div>`;
}

function finance() {
  const rowsAll = filteredFinanceOperations();
  const totalPages = Math.max(1, Math.ceil(rowsAll.length / financeView.perPage));
  financeView.page = clamp(financeView.page || 1, 1, totalPages);
  const start = (financeView.page - 1) * financeView.perPage;
  const rows = rowsAll.slice(start, start + financeView.perPage);
  const s = monthSummary();
  const undo = lastDeletedOperation ? `<div class="card" style="margin-top:16px;background:#fff8eb"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><h3>↩️ Последнее удаление</h3><p class="sub">${operationLabel(lastDeletedOperation)}</p></div><button class="soft-btn" data-action="undoDeleteOp">Восстановить</button></div></div>` : '';
  return `<div class="grid cards">
    ${kpi('💰','Доход месяца', money(s.income), 'Факт по операциям')}
    ${kpi('💸','Расходы на жизнь', money(s.expenses), 'Без сбережений и финцели')}
    ${kpi('🏦','Отложено вручную', money(s.allocations), `Сбережения / подушка / финцель`)}
    ${kpi('📆','Лимит/день', money(s.dailyLimit), `Остаток: ${money(s.left)}`)}
  </div>
  ${allocationStatusCard()}
  ${undo}
  <div class="card finance-ledger" style="margin-top:16px">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
      <h3>💸 Операции</h3>
      <div class="actions-row" style="margin:0">
        <button class="soft-btn" data-page-jump="bank">🏦 Импорт банка</button>
        <button class="soft-btn" data-open-modal="manualAllocation">🏦 Распределение</button>
        <button class="primary-btn" data-open-modal="quickExpense">Добавить</button>
      </div>
    </div>
    <div class="finance-toolbar">
      <label>Поиск<input id="financeQuery" value="${escapeAttr(financeView.query || '')}" placeholder="кафе, долг, банк"></label>
      <label>Тип<select id="financeType"><option value="all" ${financeView.type==='all'?'selected':''}>Все</option><option value="expense" ${financeView.type==='expense'?'selected':''}>Расходы</option><option value="income" ${financeView.type==='income'?'selected':''}>Доходы</option></select></label>
      <label>С даты<input id="financeFrom" type="date" value="${financeView.from || ''}"></label>
      <label>По дату<input id="financeTo" type="date" value="${financeView.to || ''}"></label>
      <label>На странице<select id="financePerPage"><option ${financeView.perPage==50?'selected':''}>50</option><option ${financeView.perPage==100?'selected':''}>100</option><option value="9999" ${financeView.perPage==9999?'selected':''}>Все</option></select></label>
    </div>
    <div class="ledger-meta">Показано ${rows.length} из ${rowsAll.length} операций · страница ${financeView.page} / ${totalPages}</div>
    ${table(['Дата','Тип','Сумма','Категория','Комментарий',''], rows.map(operationRow))}
    <div class="pagination-row">
      <button class="soft-btn" data-action="financePrev" ${financeView.page<=1?'disabled':''}>← Назад</button>
      <button class="soft-btn" data-action="financeNext" ${financeView.page>=totalPages?'disabled':''}>Вперёд →</button>
    </div>
  </div>`;
}
function filteredFinanceOperations() {
  const q = String(financeView.query || '').toLowerCase().trim();
  return [...state.operations]
    .filter(o => financeView.type === 'all' || o.type === financeView.type)
    .filter(o => !financeView.from || o.date >= financeView.from)
    .filter(o => !financeView.to || o.date <= financeView.to)
    .filter(o => !q || JSON.stringify(o).toLowerCase().includes(q))
    .sort((a,b)=>String(b.date || '').localeCompare(String(a.date || '')) || String(b.id || '').localeCompare(String(a.id || '')));
}
function operationRow(o) {
  return [
    o.date,
    operationTypeLabel(o.type),
    money(o.amount),
    o.category || '',
    o.note || '',
    `<button class="danger-btn" data-delete-op="${o.id}">Удалить</button>`
  ];
}
function recentOperationsTable(limit = 8) {
  const rows = [...state.operations].sort((a,b)=>b.date.localeCompare(a.date)).slice(0, limit);
  return table(['Дата','Тип','Сумма','Категория','Комментарий',''], rows.map(operationRow));
}

function bankImport() {
  const rows = state.importRows || [];
  const stats = bankImportStats(rows);
  const ready = rows.filter(r => r.selected && !r.duplicate && r.category).length;
  const notReady = rows.filter(r => r.selected && !r.category && !r.duplicate).length;
  return `
  <div class="bank-hero">
    <div>
      <div class="tiny-label">Банк-импорт Pro</div>
      <h2>Загрузи выписку — система сама разберёт операции</h2>
      <p>Самый безопасный вариант без доступа к банку: скачал CSV или Excel-выписку → загрузил сюда → назначил категории вручную → перенёс в операции. Дубли подсвечиваются и не выбираются автоматически.</p>
      <div class="actions-row">
        <label class="primary-btn bank-file-btn">📥 Выбрать CSV / Excel<input id="bankCsvFile" type="file" accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label>
        <button class="soft-btn" data-action="parseBankFile">Разобрать файл</button>
        <button class="soft-btn" data-action="clearBankImport">Очистить импорт</button>
      </div>
    </div>
    <div class="card bank-help-card">
      <h3>Как пользоваться</h3>
      <p>1. Скачай выписку из банка в CSV, XLSX или XLS.</p>
      <p>2. Загрузи файл сюда.</p>
      <p>3. Проверь дату/сумму, назначь категории.</p>
      <p>4. Перенеси готовые строки в «Деньги».</p>
    </div>
  </div>
  <div class="grid cards" style="margin-top:16px">
    ${kpi('📄','Строк в импорте', stats.total, 'разобрано из файла')}
    ${kpi('✅','Готово к переносу', ready, 'выбрано + категория')}
    ${kpi('🏷','Без категории', notReady, 'нужно назначить вручную')}
    ${kpi('🧯','Дубли', stats.duplicates, 'автоматически сняты')}
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-head">
      <div><h3>⚙️ Настройки разбора</h3><p class="sub">Для CSV оставь «авто». Если кракозябры — попробуй Windows-1251. Для Excel эти настройки почти не нужны.</p></div>
    </div>
    <div class="form-grid">
      <label>Кодировка<select id="bankEncoding"><option value="auto">Авто</option><option value="utf-8">UTF-8</option><option value="windows-1251">Windows-1251</option></select></label>
      <label>Разделитель<select id="bankDelimiter"><option value="auto">Авто</option><option value=";">Точка с запятой ;</option><option value=",">Запятая ,</option><option value="tab">Tab</option></select></label>
      <label>Тип по умолчанию<select id="bankDefaultType"><option value="expense">Расход</option><option value="income">Доход</option></select></label>
      <label>Дубли<select id="bankDuplicateMode"><option value="skip">Не переносить</option><option value="allow">Разрешить вручную</option></select></label>
    </div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-head">
      <div><h3>🏷 Подготовка операций</h3><p class="sub">Категории специально не ставятся автоматически — ты контролируешь каждую сумму сам.</p></div>
      <div class="actions-row" style="margin:0">
        <button class="soft-btn" data-action="selectBankRows">Выбрать готовые</button>
        <button class="soft-btn" data-action="unselectBankRows">Снять выбор</button>
        <button class="soft-btn" data-open-modal="addCategory">+ Категория</button><button class="primary-btn" data-action="transferBankRows">Перенести готовые</button>
      </div>
    </div>
    ${bankImportTable(rows)}
  </div>`;
}

function bankImportStats(rows = state.importRows || []) {
  return {
    total: rows.length,
    duplicates: rows.filter(r => r.duplicate).length,
    selected: rows.filter(r => r.selected).length,
    ready: rows.filter(r => r.selected && r.category && !r.duplicate).length
  };
}

function bankImportTable(rows) {
  if (!rows.length) return empty('Пока нет загруженной выписки. Загрузи CSV или Excel-файл банка, и здесь появятся операции для проверки.');
  const visible = rows.slice(0, 180);
  return table(['✓','Статус','Дата','Тип','Сумма','Категория','Описание'], visible.map(r => {
    const status = r.duplicate ? '<span class="tag danger">Дубль</span>' : (r.category ? '<span class="tag green">Готово</span>' : '<span class="tag warn">Категория</span>');
    return [
      `<input type="checkbox" data-import-sel="${r.id}" ${r.selected ? 'checked' : ''}>`,
      status,
      `<input class="mini-input" type="date" data-import-date="${r.id}" value="${escapeAttr(r.date || todayKey())}">`,
      `<select class="mini-input" data-import-type="${r.id}"><option value="expense" ${r.type==='expense'?'selected':''}>Расход</option><option value="income" ${r.type==='income'?'selected':''}>Доход</option></select>`,
      money(r.amount),
      `<select class="mini-input" data-import-cat="${r.id}"><option value="">Выбери</option>${categoryOptions(r.type || 'expense', r.category || '')}</select>`,
      `<div class="import-note">${escapeHtml(r.note || '')}</div>`
    ];
  }));
}

function bindImportControls() {
  document.querySelectorAll('[data-import-sel]').forEach(ch => ch.onchange = () => { const r = state.importRows.find(x=>x.id===ch.dataset.importSel); if(r) { r.selected = ch.checked; save(); render(); } });
  document.querySelectorAll('[data-import-cat]').forEach(sel => {
    const r = state.importRows.find(x=>x.id===sel.dataset.importCat);
    if (r && r.category) sel.value = r.category;
    sel.onchange = () => { const row = state.importRows.find(x=>x.id===sel.dataset.importCat); if(row) { row.category = sel.value; save(); render(); } };
  });
  document.querySelectorAll('[data-import-type]').forEach(sel => sel.onchange = () => { const r = state.importRows.find(x=>x.id===sel.dataset.importType); if(r) { r.type = sel.value; if (r.category && !categoryList(r.type).includes(r.category)) r.category = ''; save(); render(); } });
  document.querySelectorAll('[data-import-date]').forEach(inp => inp.onchange = () => { const r = state.importRows.find(x=>x.id===inp.dataset.importDate); if(r) { r.date = inp.value; r.duplicate = isDuplicateImportRow(r); if (r.duplicate) r.selected = false; save(); render(); } });
}

async function parseBankFile() {
  const input = document.getElementById('bankCsvFile') || document.getElementById('csvFile');
  const file = input?.files?.[0];
  if (!file) return toast('Выбери CSV или Excel-файл');
  try {
    const encoding = document.getElementById('bankEncoding')?.value || 'auto';
    const delimiter = document.getElementById('bankDelimiter')?.value || 'auto';
    const defaultType = document.getElementById('bankDefaultType')?.value || 'expense';
    const shouldUseExcelParser = await isLikelyExcelWorkbook(file);
    const parsed = shouldUseExcelParser
      ? await parseBankExcelFile(file, { defaultType })
      : parseBankCsvText(await readBankFileText(file, encoding), { delimiter, defaultType });
    state.importRows = parsed;
    save();
    render();
    toast(`Разобрано строк: ${parsed.length}`);
  } catch (err) {
    console.error(err);
    toast('Не удалось разобрать файл');
  }
}



async function isLikelyExcelWorkbook(file) {
  if (isExcelFile(file)) return true;
  try {
    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    // XLSX/XLSM/XLSB are ZIP containers. Some banks download them with .csv extension.
    const isZipWorkbook = head[0] === 0x50 && head[1] === 0x4B;
    // Old .xls files use OLE Compound File magic: D0 CF 11 E0 A1 B1 1A E1.
    const isOldXls = head[0] === 0xD0 && head[1] === 0xCF && head[2] === 0x11 && head[3] === 0xE0;
    return Boolean(isZipWorkbook || isOldXls);
  } catch (e) {
    return false;
  }
}

function isExcelFile(file) {
  const name = String(file?.name || '').toLowerCase();
  const type = String(file?.type || '').toLowerCase();
  return /\.(xlsx|xls|xlsm|xlsb)$/i.test(name) || /spreadsheet|excel/.test(type);
}

async function parseBankExcelFile(file, opts = {}) {
  if (!window.XLSX) {
    throw new Error('библиотека Excel не загрузилась. Обнови страницу или попробуй CSV');
  }
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array', cellDates: true, raw: true });
  const sheets = workbook.SheetNames
    .map(name => ({ name, rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '', raw: true }) }))
    .filter(s => s.rows && s.rows.length);

  if (!sheets.length) return [];

  const best = sheets
    .map(s => ({ ...s, score: scoreBankSheet(s.rows) }))
    .sort((a, b) => b.score - a.score)[0];

  const rows = normalizeExcelRows(best.rows).filter(r => r.some(c => String(c || '').trim() !== ''));
  let parsed = parseBankRowsAuto(rows, { defaultType: opts.defaultType || 'expense', source: 'bank-excel' });

  if (!parsed.length) {
    parsed = parseBankRowsWithoutHeaders(rows, { defaultType: opts.defaultType || 'expense', source: 'bank-excel' });
  }

  if (!parsed.length) {
    const sample = rows.slice(0, 8).map(r => r.join(' | ')).join('\n');
    console.warn('Excel import: no parsed rows. Sheet:', best.name, 'sample:', sample);
  }

  return parsed;
}

function normalizeExcelRows(rows) {
  return rows.map(row => row.map(cell => {
    if (cell instanceof Date && !Number.isNaN(cell.getTime())) return toDateKey(cell);
    if (typeof cell === 'number') return cell;
    return String(cell ?? '').replace(/\u00A0/g, ' ').trim();
  }));
}

function scoreBankSheet(rows) {
  const sample = normalizeExcelRows(rows.slice(0, 80));
  const text = sample.map(r => r.join(' ').toLowerCase()).join(' ');
  let score = 0;
  if (/дата|date|операц|транзакц|платеж|покупк|списан|зачисл/.test(text)) score += 8;
  if (/сумм|amount|debit|credit|расход|приход|руб|rur|₽/.test(text)) score += 8;
  if (/опис|назнач|детал|контрагент|получатель|merchant|description|mcc/.test(text)) score += 4;
  let dateLike = 0, amountLike = 0;
  sample.forEach(r => r.forEach(c => {
    if (parseBankDate(c)) dateLike++;
    if (Math.abs(parseMoneyValue(c)) > 0) amountLike++;
  }));
  score += Math.min(dateLike, 20) + Math.min(amountLike, 20);
  return score;
}

function parseBankRowsAuto(rows, opts = {}) {
  const headerIndex = findHeaderRow(rows);
  const headers = headerIndex >= 0 ? rows[headerIndex].map(normalizeHeader) : [];
  const dataRows = rows.slice(headerIndex >= 0 ? headerIndex + 1 : 0);
  const idx = detectBankColumns(headers);
  const parsed = [];
  dataRows.slice(0, 1200).forEach(cols => {
    const row = parseBankRow(cols, idx, headers, opts.defaultType || 'expense');
    if (!row || !row.amount || !row.date) return;
    row.source = opts.source || 'bank-excel';
    row.duplicate = isDuplicateImportRow(row);
    row.selected = !row.duplicate;
    parsed.push(row);
  });
  return parsed;
}

function parseBankRowsWithoutHeaders(rows, opts = {}) {
  const parsed = [];
  rows.slice(0, 1200).forEach(cols => {
    const dateCell = cols.find(c => parseBankDate(c));
    const date = parseBankDate(dateCell);
    if (!date) return;

    const moneyCells = cols
      .map((c, i) => ({ cell: c, i, value: parseMoneyValue(c) }))
      .filter(x => Math.abs(x.value) > 0)
      .filter(x => !parseBankDate(x.cell));
    if (!moneyCells.length) return;

    let chosen = moneyCells.find(x => /[-−]/.test(String(x.cell))) || moneyCells.sort((a,b)=>Math.abs(b.value)-Math.abs(a.value))[0];
    const signed = chosen.value;
    const amount = Math.abs(signed);
    if (!amount) return;

    const rowText = cols.map(c => String(c || '').trim()).filter(Boolean).join(' · ');
    const typeText = rowText.toLowerCase();
    let type = opts.defaultType || 'expense';
    if (signed < 0 || /списан|расход|покупк|оплат|debit|withdraw/.test(typeText)) type = 'expense';
    if (signed > 0 && /зачисл|поступл|приход|credit|income|пополн/.test(typeText)) type = 'income';

    const row = {
      id: uid(),
      date,
      type,
      amount,
      category: '',
      note: rowText.slice(0, 220),
      raw: cols,
      selected: true,
      duplicate: false,
      source: opts.source || 'bank-excel'
    };
    row.duplicate = isDuplicateImportRow(row);
    row.selected = !row.duplicate;
    parsed.push(row);
  });
  return parsed;
}

async function readBankFileText(file, encoding = 'auto') {
  const buf = await file.arrayBuffer();
  if (encoding !== 'auto') return new TextDecoder(encoding).decode(buf);
  const utf = new TextDecoder('utf-8').decode(buf);
  let cp = '';
  try { cp = new TextDecoder('windows-1251').decode(buf); } catch { cp = utf; }
  const score = (txt) => {
    const bad = (txt.match(/�/g) || []).length * 10;
    const cyr = (txt.match(/[А-Яа-яЁё]/g) || []).length;
    const delims = (txt.match(/[;,\t]/g) || []).length;
    return cyr + delims - bad;
  };
  return score(cp) > score(utf) ? cp : utf;
}

function parseBankCsvText(text, opts = {}) {
  const delimiter = opts.delimiter === 'tab' ? '\t' : (opts.delimiter && opts.delimiter !== 'auto' ? opts.delimiter : detectDelimiter(text));
  const rows = parseDelimited(text.replace(/^\uFEFF/, ''), delimiter).filter(r => r.some(c => String(c || '').trim()));
  if (!rows.length) return [];
  const headerIndex = findHeaderRow(rows);
  const headers = headerIndex >= 0 ? rows[headerIndex].map(normalizeHeader) : [];
  const dataRows = rows.slice(headerIndex >= 0 ? headerIndex + 1 : 0);
  const idx = detectBankColumns(headers);
  const parsed = [];
  dataRows.slice(0, 600).forEach(cols => {
    const row = parseBankRow(cols, idx, headers, opts.defaultType || 'expense');
    if (!row || !row.amount || !row.date) return;
    row.duplicate = isDuplicateImportRow(row);
    row.selected = !row.duplicate;
    parsed.push(row);
  });
  return parsed;
}

function detectDelimiter(text) {
  const sample = text.split(/\r?\n/).slice(0, 15).join('\n');
  const candidates = [';', ',', '\t'];
  let best = ';', bestScore = -1;
  candidates.forEach(d => {
    const rows = sample.split(/\r?\n/).map(line => parseDelimitedLine(line, d).length);
    const score = rows.reduce((s,n)=>s+n,0) - Math.abs(Math.max(...rows) - Math.min(...rows));
    if (score > bestScore) { bestScore = score; best = d; }
  });
  return best;
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [], cell = '', quote = false;
  for (let i=0; i<text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quote && text[i+1] === '"') { cell += '"'; i++; }
      else quote = !quote;
    } else if (ch === delimiter && !quote) { row.push(cell.trim()); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quote) {
      if (ch === '\r' && text[i+1] === '\n') i++;
      row.push(cell.trim()); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows;
}
function parseDelimitedLine(line, delimiter) { return parseDelimited(line, delimiter)[0] || []; }
function normalizeHeader(h) { return String(h || '').toLowerCase().replace(/\s+/g,' ').replace(/["']/g,'').trim(); }
function findHeaderRow(rows) {
  let best = -1, scoreBest = 0;
  rows.slice(0, 80).forEach((r, i) => {
    const text = r.map(normalizeHeader).join(' ');
    let score = 0;
    if (/дата|date/.test(text)) score += 2;
    if (/сумм|amount|debit|credit|расход|приход|списан|зачисл/.test(text)) score += 2;
    if (/опис|назнач|операц|merchant|description|контрагент|получатель|детал/.test(text)) score += 1;
    if (score > scoreBest) { scoreBest = score; best = i; }
  });
  return scoreBest >= 3 ? best : -1;
}
function detectBankColumns(headers) {
  const find = (pred) => headers.findIndex(pred);
  const date = find(h => (/дата|date/.test(h) && !/валют|value/.test(h)));
  const debit = find(h => /расход|debit|списан|withdraw|outcome|снятие/.test(h) && !/катег/.test(h));
  const credit = find(h => /приход|credit|зачисл|income|поступл|пополн/.test(h) && !/катег/.test(h));
  let amount = find(h => /сумм|amount|операц/.test(h) && !/остат|баланс|balance/.test(h));
  if (amount < 0) amount = find(h => /руб|rub|rur|₽/.test(h) && !/остат|баланс/.test(h));
  const desc = headers.map((h,i)=>({h,i})).filter(x => /опис|назнач|детал|операц|merchant|description|контрагент|получатель|отправитель|коммент|mcc|категория/.test(x.h) && !/сумм|amount|дата|date|остат|баланс/.test(x.h)).map(x=>x.i);
  return { date, amount, debit, credit, desc };
}
function parseBankRow(cols, idx, headers, defaultType) {
  let date = idx.date >= 0 ? parseBankDate(cols[idx.date]) : parseBankDate(cols.find(c => parseBankDate(c)));
  let type = defaultType;
  let amount = 0;
  if (idx.debit >= 0 || idx.credit >= 0) {
    const debit = idx.debit >= 0 ? Math.abs(parseMoneyValue(cols[idx.debit])) : 0;
    const credit = idx.credit >= 0 ? Math.abs(parseMoneyValue(cols[idx.credit])) : 0;
    if (credit && credit >= debit) { amount = credit; type = 'income'; }
    else if (debit) { amount = debit; type = 'expense'; }
  }
  if (!amount) {
    const amountCell = idx.amount >= 0 ? cols[idx.amount] : findAmountCell(cols);
    const signed = parseMoneyValue(amountCell);
    amount = Math.abs(signed);
    if (signed < 0) type = 'expense';
    else if (signed > 0 && /приход|зачисл|поступл|credit|income/i.test(cols.join(' '))) type = 'income';
  }
  if (!date) return null;
  const noteParts = [];
  if (idx.desc && idx.desc.length) idx.desc.forEach(i => { if (cols[i]) noteParts.push(cols[i]); });
  if (!noteParts.length) noteParts.push(...cols.filter(c => String(c).trim()).slice(0, 5));
  const note = noteParts.join(' · ').replace(/\s+/g, ' ').slice(0, 220);
  return { id: uid(), date, type, amount, category: '', note, raw: cols, selected: true, duplicate: false, source: 'bank-csv' };
}

function parseBankDate(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0,10);
  if (/\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4}/.test(raw)) return parseDate(raw);
  const serial = Number(raw.replace(',', '.'));
  if (Number.isFinite(serial) && serial > 25000 && serial < 80000) {
    const ms = Math.round((serial - 25569) * 86400000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime()) && d.getFullYear() > 2000) return toDateKey(d);
  return '';
}

function findAmountCell(cols) {
  const candidates = cols.filter(c => {
    const str = String(c || '');
    if (!/[-−+]?\(?\d[\d\s.,]*\)?/.test(str)) return false;
    if (/\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}/.test(str)) return false;
    const digits = str.replace(/\D/g, '');
    if (digits.length > 14 && !/[,.]/.test(str)) return false; // card/account numbers, not money
    return true;
  });
  return candidates.sort((a,b)=>Math.abs(parseMoneyValue(b))-Math.abs(parseMoneyValue(a)))[0] || '';
}
function parseMoneyValue(raw) {
  let source = String(raw ?? '').trim();
  const negative = /[-−]/.test(source) || /^\(.*\)$/.test(source);
  let s = source.replace(/[\s\u00A0]/g,'').replace(/[₽рРрубRUBa-zA-Z]/g,'').replace(/[()−+]/g,'').replace(/[^\d,.]/g,'');
  if (!s) return 0;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  const dec = Math.max(lastComma, lastDot);
  if (dec >= 0) {
    const intPart = s.slice(0, dec).replace(/[,.]/g,'');
    const frac = s.slice(dec+1).replace(/[,.]/g,'');
    s = `${intPart}.${frac}`;
  }
  const n = Number(s);
  return Number.isFinite(n) ? (negative ? -n : n) : 0;
}
function normalizeNote(note) { return String(note || '').toLowerCase().replace(/[^a-zа-яё0-9]+/gi,' ').trim().slice(0, 48); }
function importSignatureLike(date, type, amount, note) { return `${date}|${type}|${Math.round(num(amount)*100)}|${normalizeNote(note)}`; }
function isDuplicateImportRow(row) {
  const sig = importSignatureLike(row.date, row.type, row.amount, row.note);
  return state.operations.some(o => importSignatureLike(o.date, o.type, o.amount, o.note) === sig);
}
function selectBankRows() {
  state.importRows.forEach(r => { r.duplicate = isDuplicateImportRow(r); r.selected = !r.duplicate && Boolean(r.category); });
  save(); render(); toast('Выбраны строки с категориями без дублей');
}
function unselectBankRows() { state.importRows.forEach(r => r.selected = false); save(); render(); }
function clearBankImport() { if(confirm('Очистить текущий импорт?')) { state.importRows = []; save(); render(); } }
function transferBankRows() {
  const duplicateMode = document.getElementById('bankDuplicateMode')?.value || 'skip';
  const ready = state.importRows.filter(r => r.selected && r.category && (duplicateMode === 'allow' || !r.duplicate));
  if (!ready.length) return toast('Нет готовых строк: выбери операции и назначь категории');
  ready.forEach(r => state.operations.push({ id: uid(), date: r.date, type: r.type || 'expense', amount: Math.abs(num(r.amount)), category: r.category, note: r.note || 'Импорт банка', emotion: r.source === 'bank-excel' ? 'Банк Excel' : 'Банк CSV', importedAt: new Date().toISOString(), importSource: r.source || 'bank-import' }));
  const ids = new Set(ready.map(r => r.id));
  state.importRows = state.importRows.filter(r => !ids.has(r.id));
  save(); render(); toast(`Перенесено операций: ${ready.length}`);
}

function panel(opts = {}) {
  const search = opts.search || document.getElementById('globalSearch')?.value || '';
  const from = localStorage.getItem('panel.from') || `${state.settings.currentMonth}-01`;
  const to = localStorage.getItem('panel.to') || `${state.settings.currentMonth}-31`;
  const cats = categoryTotals(from, to);
  const ops = state.operations.filter(o => dateBetween(o.date, from, to) && (!search || JSON.stringify(o).toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date));
  return `<div class="card"><h3>🎛 Панель управления</h3><p class="sub">Подними любой период, посмотри категории и найди старые операции.</p><div class="form-grid"><label>С даты<input id="panelFrom" type="date" value="${from}"></label><label>По дату<input id="panelTo" type="date" value="${to}"></label></div><div class="actions-row"><button class="primary-btn" data-action="applyPeriod">Показать период</button><button class="soft-btn" data-action="currentMonthPeriod">Текущий месяц</button><button class="soft-btn" data-open-modal="weeklyReport">📅 Собрать неделю</button></div></div>
  <div class="grid two" style="margin-top:16px"><div class="card"><h3>Категории периода</h3>${cats.length ? cats.map(([n,a]) => categoryBar(n, a, total(cats.map(x => ({ amount: x[1] }))))).join('') : empty('Нет расходов')}</div><div class="card"><h3>Поиск операций</h3><input id="panelSearch" class="search" style="width:100%" placeholder="Например: кафе, ozon, такси" value="${search}"><div class="ledger-meta" style="margin-top:12px">Найдено операций: ${ops.length}</div><div style="margin-top:12px">${table(['Дата','Тип','Сумма','Категория','Комментарий',''], ops.map(operationRow))}</div></div></div>`;
}

function goals() {
  const rows = state.goals.map(g => {
    const related = state.tasks.filter(t => t.goalId === g.id);
    const done = related.filter(t => t.status === 'Готово').length;
    const overdue = related.filter(t => t.status !== 'Готово' && t.due && t.due < todayKey()).length;
    const p = goalProgress(g);
    return [g.title, g.area, `<div class="progress"><span style="width:${p}%"></span></div>${p}%`, `${done}/${related.length}`, overdue ? `<span class="tag danger">${overdue} проср.</span>` : '<span class="tag green">OK</span>', g.deadline || '', g.nextAction || '', `<button class="ghost-btn" data-delete-goal="${g.id}">Скрыть</button>`];
  });
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>🎯 SMART-цели</h3><button class="primary-btn" data-open-modal="quickGoal">Добавить цель</button></div>${table(['Цель','Сфера','Прогресс','Задачи','Контроль','Дедлайн','Следующий шаг',''], rows)}</div>`;
}

function habits() {
  const key = todayKey();
  const active = state.habits.filter(h => h.active);
  return `<div class="grid two"><div class="card"><h3>✅ Привычки сегодня</h3><div class="checkbox-grid">${active.map(h => `<label class="check-card"><span><b>${h.name}</b><br><span class="sub">${h.area}</span></span><input type="checkbox" data-habit="${h.id}" ${state.habitLogs[key]?.[h.id] ? 'checked' : ''}></label>`).join('')}</div></div><div class="card"><h3>Управление</h3><div class="actions-row"><button class="primary-btn" data-open-modal="addHabit">Добавить привычку</button></div><p class="sub">Удаление скрывает привычку, но история остаётся в данных.</p>${table(['Привычка','Сфера','Цель/нед.',''], state.habits.map(h=>[h.name, h.area, h.targetPerWeek, h.active ? `<button class="ghost-btn" data-hide-habit="${h.id}">Скрыть</button>` : '<span class="tag">Скрыта</span>']))}</div></div>`;
}

function tasks() {
  const open = state.tasks
    .filter(t => t.status !== 'Готово' && t.status !== 'Отменена')
    .sort(taskSort);
  const done = state.tasks
    .filter(t => t.status === 'Готово')
    .sort(taskSort)
    .slice(0, 12);
  return `<div class="calendar-hero task-hero">
    <div>
      <div class="tiny-label">Google Calendar Lite</div>
      <h2>Задачи с напоминаниями</h2>
      <p>Добавляй дату и время, открывай задачу в Google Calendar и получай уведомления уже средствами календаря.</p>
      <div class="pill-list">
        <span class="tag green">Сегодня: ${tasksForDay(todayKey()).length}</span>
        <span class="tag warn">Просрочено: ${tasksStats().overdue}</span>
        <span class="tag blue">Без даты: ${undatedTasks().length}</span>
      </div>
    </div>
    <div class="calendar-hero-actions">
      <button class="primary-btn" data-open-modal="quickTask">📌 Добавить задачу</button>
      <button class="soft-btn" data-page-jump="calendar">🔔 Открыть календарь</button>
    </div>
  </div>
  <div class="task-board" style="margin-top:16px">
    ${taskColumn('🔥 Просрочено', overdueTasks(), 'danger')}
    ${taskColumn('🌤 Сегодня', tasksForDay(todayKey()), 'green')}
    ${taskColumn('🗓 Неделя', weekTasks(), 'blue')}
    ${taskColumn('🌫 Без даты', undatedTasks(), 'warn')}
  </div>
  <div class="card" style="margin-top:16px"><h3>📚 Все активные задачи</h3>${open.length ? `<div class="task-list">${open.map(taskCard).join('')}</div>` : empty('Активных задач нет')}</div>
  <div class="card" style="margin-top:16px"><h3>✅ Завершённые</h3>${done.length ? `<div class="task-list compact">${done.map(taskCard).join('')}</div>` : empty('Пока нет завершённых задач')}</div>`;
}

function todayView() {
  const s = monthSummary();
  const date = todayKey();
  const habits = state.habits.filter(h => h.active);
  const todayTasks = tasksForDay(date).slice(0, 5);
  const cats = categoryTotals(date, date).slice(0, 4);
  const st = state.states.find(x => x.date === date);
  return `<div class="today-screen">
    <div class="today-hero">
      <div>
        <div class="tiny-label">${new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</div>
        <h2>Сегодня</h2>
        <p>${todayIntro()}</p>
      </div>
      <div class="today-score-ring"><span>${lifeScore()}</span><small>Life Score</small></div>
    </div>
    <div class="grid cards" style="margin-top:16px">
      ${kpi('📆','Лимит сегодня', money(s.dailyLimit), 'безопасная трата до конца месяца')}
      ${kpi('📌','Задачи', `${todayTasks.length}`, `${tasksStats().overdue} просрочено`)}
      ${kpi('✅','Привычки', `${todayHabitCount()}/${habits.length}`, 'отмечено сегодня')}
      ${kpi('🌿','Состояние', st ? `${st.energy}/10` : '—', st ? 'энергия сегодня' : 'день ещё не закрыт')}
    </div>
    ${allocationStatusCard()}
    <div class="grid two" style="margin-top:16px">
      <div class="card"><div class="section-head"><h3>📌 Фокус дня</h3><button class="soft-btn" data-open-modal="quickTask">Добавить</button></div>${todayTasks.length ? todayTasks.map(taskCard).join('') : empty('Нет задач на сегодня. Выбери 1 главный фокус.')}</div>
      <div class="card"><div class="section-head"><h3>✅ Привычки</h3><button class="soft-btn" data-page-jump="habits">Открыть</button></div><div class="checkbox-grid">${habits.slice(0,8).map(h => `<label class="check-card"><span><b>${h.name}</b><br><span class="sub">${h.area}</span></span><input type="checkbox" data-habit="${h.id}" ${state.habitLogs[date]?.[h.id] ? 'checked' : ''}></label>`).join('')}</div></div>
    </div>
    ${allocationStatusCard()}
    <div class="grid two" style="margin-top:16px">
      <div class="card"><div class="section-head"><h3>💸 Деньги сегодня</h3><button class="primary-btn" data-open-modal="quickExpense">Расход</button></div>${cats.length ? cats.map(([n,a]) => categoryBar(n, a, total(cats.map(x => ({ amount: x[1] }))))).join('') : empty('Сегодня ещё нет расходов')}</div>
      <div class="card"><h3>🌙 Закрытие дня</h3><p class="sub">Вечером отметь сон, энергию, настроение, стресс и короткий вывод. Это даст нормальную аналитику по жизни.</p><button class="primary-btn" data-open-modal="closeDay" style="width:100%">Закрыть день</button></div>
    </div>
  </div>`;
}

function calendarView() {
  const today = todayKey();
  const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate()+1);
  const tomorrow = toDateKey(tomorrowDate);
  const upcoming = weekTasks().filter(t => t.due !== today).slice(0, 10);
  return `<div class="calendar-hero">
    <div>
      <div class="tiny-label">Calendar Lite</div>
      <h2>Календарь и напоминания</h2>
      <p>Без сложной интеграции: задача открывается в Google Calendar с заполненными полями. Ты нажимаешь «Сохранить», а уведомления уже делает календарь на ПК и iPhone.</p>
      <div class="pill-list"><span class="tag green">Сегодня ${tasksForDay(today).length}</span><span class="tag blue">Завтра ${tasksForDay(tomorrow).length}</span><span class="tag warn">Без даты ${undatedTasks().length}</span></div>
    </div>
    <div class="calendar-hero-actions"><button class="primary-btn" data-open-modal="quickTask">📌 Новая задача</button><button class="soft-btn" data-page-jump="tasks">Все задачи</button></div>
  </div>
  <div class="grid two" style="margin-top:16px">
    <div class="card"><h3>🌤 Сегодня</h3>${tasksForDay(today).length ? tasksForDay(today).map(taskCard).join('') : empty('На сегодня задач нет')}</div>
    <div class="card"><h3>🌅 Завтра</h3>${tasksForDay(tomorrow).length ? tasksForDay(tomorrow).map(taskCard).join('') : empty('На завтра задач нет')}</div>
  </div>
  <div class="card" style="margin-top:16px"><h3>🗓 Ближайшая неделя</h3>${upcoming.length ? `<div class="task-list">${upcoming.map(taskCard).join('')}</div>` : empty('На неделю задач пока нет')}</div>
  <div class="card" style="margin-top:16px"><h3>🌫 Без даты</h3>${undatedTasks().length ? `<div class="task-list">${undatedTasks().map(taskCard).join('')}</div>` : empty('Все задачи запланированы')}</div>`;
}

function stateView() {
  const rows = [...state.states].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,40).map(s=>[s.date, s.sleep, s.energy, s.mood, s.stress, s.note || '']);
  const st = stateStats();
  return `<div class="grid cards">${kpi('😴','Сон 7 дней', st.sleep.toFixed(1), 'часов в среднем')}${kpi('⚡','Энергия', st.energy.toFixed(1), 'из 10')}${kpi('🙂','Настроение', st.mood.toFixed(1), 'из 10')}${kpi('🔥','Стресс', st.stress.toFixed(1), 'из 10')}</div><div class="card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><h3>🌿 Состояние</h3><button class="primary-btn" data-open-modal="closeDay">Закрыть день</button></div>${table(['Дата','Сон','Энергия','Настроение','Стресс','Итог'], rows)}</div>`;
}

function insights() {
  const s = monthSummary();
  const cats = categoryTotals(`${state.settings.currentMonth}-01`, `${state.settings.currentMonth}-31`);
  const top = cats[0];
  const h = habitMonthStats();
  const t = tasksStats();
  const st = stateStats();
  const list = [];
  if (top) list.push(`Главная категория расходов: ${top[0]} — ${money(top[1])}.`);
  if (s.dailyLimit < 500 && s.income) list.push('Дневной лимит низкий: лучше включить режим экономии до конца месяца.');
  if (manualAllocationStatus().overdue) list.push('Ручное распределение 10-го числа ещё не внесено: сбережения, подушка или финцель требуют внимания.');
  if (h.percent < 55) list.push('Привычки просели. Оставь 2–3 ключевые и не дави на себя всем списком.');
  if (t.overdue) list.push(`Есть просроченные задачи: ${t.overdue}. Закрой одну маленькую сегодня.`);
  if (st.rows.length && st.energy < 5) list.push('Энергия ниже нормы. Лучше включить антихаос и снизить нагрузку.');
  if (!list.length) list.push('Система стабильная. Продолжай в том же ритме и не перегружай список привычек.');
  return `<div class="grid two"><div class="card"><h3>✨ Инсайты месяца</h3>${list.map(x=>`<p class="sub" style="font-size:16px">• ${x}</p>`).join('')}<button class="soft-btn" data-open-modal="weeklyReport">📅 Собрать недельный отчёт</button></div><div class="card"><h3>🏆 Достижения</h3>${achievementsHtml()}</div></div>`;
}
function achievementsHtml() {
  const s = monthSummary();
  const h = habitMonthStats();
  const ach = [];
  if (s.income > 0) ach.push('💰 Доход внесён');
  if (s.left > 0) ach.push('🏦 Месяц в плюсе');
  if (h.percent >= 70) ach.push('✅ Привычки держатся');
  if (state.states.length >= 7) ach.push('🌙 7 дней состояния');
  if (!tasksStats().overdue) ach.push('📌 Нет просрочек');
  return ach.length ? `<div class="pill-list">${ach.map(a=>`<span class="tag green">${a}</span>`).join('')}</div>` : empty('Достижения появятся после заполнения');
}

function syncView() {
  const cloud = window.SecondBrainCloud;
  const st = cloud ? cloud.getStatus() : { configured:false, ready:false, user:null, status:'Модуль не загружен', lastSync:'', lastError:'' };
  const configured = !!(st.configured || (window.SECOND_BRAIN_FIREBASE_CONFIG && window.SECOND_BRAIN_FIREBASE_CONFIG.apiKey));
  const onlineTag = configured ? '<span class="tag green">Firebase подключён</span>' : '<span class="tag warn">Нужна настройка Firebase</span>';
  const userBlock = st.user
    ? `<div class="card"><h3>☁️ Облако активно</h3><p class="sub">Вход выполнен: <b>${st.user.email || st.user.uid}</b></p><div class="pill-list"><span class="tag green">${st.status || 'Готово'}</span>${st.lastSync ? `<span class="tag blue">Последняя синхронизация: ${new Date(st.lastSync).toLocaleString('ru-RU')}</span>` : ''}</div><div class="actions-row"><button class="primary-btn" data-action="cloudPush">⬆️ Отправить это устройство в облако</button><button class="soft-btn" data-action="cloudPull">⬇️ Загрузить из облака</button><button class="soft-btn" data-action="cloudRefresh">🔄 Обновить статус</button><button class="danger-btn" data-action="cloudLogout">Выйти</button></div><p class="sub">Автосохранение включено: после изменений данные отправляются в облако с небольшой задержкой. Для первого запуска на новом устройстве нажми «Загрузить из облака».</p></div>`
    : `<div class="card"><h3>🔐 Вход для синхронизации</h3><p class="sub">Создай личный аккаунт один раз. Потом зайди с тем же email на ПК и iPhone.</p><div class="form-grid"><label>Email<input id="cloudEmail" type="email" placeholder="you@example.com"></label><label>Пароль<input id="cloudPassword" type="password" placeholder="минимум 6 символов"></label></div><div class="actions-row"><button class="primary-btn" data-action="cloudLogin">Войти</button><button class="soft-btn" data-action="cloudRegister">Создать аккаунт</button></div>${st.lastError ? `<p class="tag danger">${st.lastError}</p>` : ''}</div>`;
  const notConfigured = configured ? '' : `<div class="card"><h3>⚙️ Firebase ещё не настроен</h3><p class="sub">Локально приложение работает уже сейчас. Для синхронизации создай Firebase-проект и вставь конфиг в файл <b>firebase-config.js</b>.</p><pre class="code-block">window.SECOND_BRAIN_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...firebaseapp.com",
  projectId: "...",
  storageBucket: "...appspot.com",
  messagingSenderId: "...",
  appId: "..."
};</pre><p class="sub">Подробная инструкция лежит в архиве: <b>README_CLOUD_SYNC_RU.md</b>.</p></div>`;
  return `<div class="grid two"><div class="card"><h3>☁️ Синхронизация ПК + iPhone</h3><p class="sub">Статус: ${onlineTag}</p><div class="grid cards" style="margin-top:12px">${kpi('📱','iPhone','PWA','через Safari')}${kpi('💻','ПК','Web','браузер')}${kpi('🔐','Доступ','личный','email + пароль')}${kpi('🧯','Резерв','JSON','бэкап остаётся')}</div><p class="sub" style="margin-top:14px">Рекомендованный поток: ПК → «Отправить в облако», iPhone → вход → «Загрузить из облака». Дальше изменения автосохраняются.</p></div>${userBlock}</div>${notConfigured}`;
}

function settings() {
  const a = state.settings.allocation;
  return `<div class="grid two">
    <div class="card">
      <h3>⚙️ Настройки системы</h3>
      <div class="form-grid">
        <label>Текущий месяц<input id="setMonth" type="month" value="${state.settings.currentMonth}"></label>
        <label>Валюта<input id="setCurrency" value="${state.settings.currency}"></label>
        <label>День ручного распределения<input id="setTransferDay" type="number" min="1" max="28" value="${state.settings.transferDay || 10}"></label>
        <label class="full">Правило<input value="Автораспределение отключено. Сбережения, подушка и финцель вносятся вручную." disabled></label>
      </div>
      <div class="actions-row">
        <button class="primary-btn" data-action="saveSettings">Сохранить</button>
        <button class="soft-btn" data-action="repair">Проверить систему</button>
      </div>
    </div>
    <div class="card">
      <h3>🏷 Категории</h3>
      <p class="sub">Теперь категории разделены: расходы отдельно, доходы отдельно. Старые операции не ломаются.</p>
      <div class="actions-row">
        <button class="primary-btn" data-open-modal="addCategory">+ Добавить категорию</button>
      </div>
      <h4>Расходы</h4>
      ${categoryChips('expense')}
      <h4 style="margin-top:16px">Доходы</h4>
      ${categoryChips('income')}
    </div>
    <div class="card">
      <h3>📦 Данные</h3>
      <p class="sub">Всё хранится локально в браузере и синхронизируется с облаком. Для безопасности периодически делай бэкап.</p>
      <div class="actions-row">
        <button class="soft-btn" data-action="backup">Скачать бэкап</button>
        <label class="soft-btn">Загрузить бэкап<input id="backupInput" type="file" accept=".json" hidden></label>
        <button class="danger-btn" data-action="resetAll">Очистить всё</button>
      </div>
    </div>
  </div>`;
}

function table(headers, rows) {
  if (!rows.length) return empty('Пока пусто');
  const safeHeaders = headers.map((h, i) => (h && String(h).trim()) ? String(h).trim() : (i === headers.length - 1 ? 'Действие' : ''));
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c, i)=>`<td data-label="${escapeAttr(safeHeaders[i] || '')}">${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('\"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}


function todayIntro() {
  const t = tasksStats();
  const s = monthSummary();
  if (t.overdue) return `Есть ${t.overdue} просроч. задача. Не геройствуй: закрой одну маленькую.`;
  if (s.dailyLimit && s.dailyLimit < 700) return 'Денежный режим аккуратный: держи дневной лимит и не покупай на эмоциях.';
  return 'Держи ритм: деньги, 1–3 задачи, привычки и короткое закрытие дня.';
}
function todayHabitCount() {
  const log = state.habitLogs[todayKey()] || {};
  return state.habits.filter(h => h.active && log[h.id]).length;
}
function taskIsOpen(t) { return t.status !== 'Готово' && t.status !== 'Отменена'; }
function taskSort(a,b) {
  const da = a.due || '9999-99-99';
  const db = b.due || '9999-99-99';
  if (da !== db) return da.localeCompare(db);
  const p = { 'Высокий': 1, 'Средний': 2, 'Низкий': 3 };
  return (p[a.priority] || 2) - (p[b.priority] || 2);
}
function tasksForDay(dateKey) { return state.tasks.filter(t => taskIsOpen(t) && t.due === dateKey).sort(taskSort); }
function overdueTasks() { return state.tasks.filter(t => taskIsOpen(t) && t.due && t.due < todayKey()).sort(taskSort); }
function undatedTasks() { return state.tasks.filter(t => taskIsOpen(t) && !t.due).sort(taskSort); }
function weekTasks() {
  const start = new Date();
  const end = new Date(); end.setDate(end.getDate() + 7);
  const from = toDateKey(start), to = toDateKey(end);
  return state.tasks.filter(t => taskIsOpen(t) && t.due && t.due >= from && t.due <= to).sort(taskSort);
}
function taskColumn(title, list, tone) {
  return `<div class="task-column"><h3>${title}</h3>${list.length ? list.slice(0,4).map(taskCard).join('') : `<div class="mini-empty">Пусто</div>`}</div>`;
}
function taskCard(t) {
  const goal = state.goals.find(g => g.id === t.goalId);
  const danger = taskIsOpen(t) && t.due && t.due < todayKey();
  const added = t.calendarAdded ? '<span class="tag green">В календаре</span>' : '';
  const calUrl = buildGoogleCalendarUrl(t);
  return `<article class="task-card ${danger ? 'danger-zone' : ''}">
    <div class="task-main">
      <div class="task-title">${escapeHtml(t.title || 'Без названия')}</div>
      <div class="task-meta">
        ${t.due ? `<span class="tag ${danger ? 'danger' : 'blue'}">${formatTaskDate(t)}</span>` : '<span class="tag warn">Без даты</span>'}
        <span class="tag">${escapeHtml(t.priority || 'Средний')}</span>
        ${goal ? `<span class="tag green">${escapeHtml(goal.title)}</span>` : ''}
        ${added}
      </div>
      ${t.nextAction ? `<p class="sub">Следующий шаг: ${escapeHtml(t.nextAction)}</p>` : ''}
    </div>
    <div class="task-actions">
      <a class="soft-btn" href="${calUrl}" target="_blank" rel="noopener" data-calendar-task="${t.id}">📅 В календарь</a>
      <button class="ghost-btn" data-toggle-task="${t.id}">${t.status === 'Готово' ? 'Вернуть' : 'Готово'}</button>
    </div>
  </article>`;
}
function formatTaskDate(t) {
  if (!t.due) return 'Без даты';
  const d = new Date(`${t.due}T00:00:00`);
  const base = d.toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
  return `${base}${t.time ? ' · ' + t.time : ''}`;
}
function buildGoogleCalendarUrl(t) {
  const title = encodeURIComponent(t.title || 'Задача Second Brain OS');
  const due = t.due || todayKey();
  const startTime = t.time || '09:00';
  const duration = Math.max(15, num(t.duration || 30));
  const start = new Date(`${due}T${startTime}:00`);
  const end = new Date(start.getTime() + duration * 60000);
  const fmt = d => d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const details = encodeURIComponent([
    t.nextAction ? `Следующий шаг: ${t.nextAction}` : '',
    t.area ? `Сфера: ${t.area}` : '',
    'Создано в Second Brain OS'
  ].filter(Boolean).join('\n'));
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function bindFinanceControls() {
  const q = document.getElementById('financeQuery');
  const type = document.getElementById('financeType');
  const from = document.getElementById('financeFrom');
  const to = document.getElementById('financeTo');
  const per = document.getElementById('financePerPage');
  const apply = () => { financeView.page = 1; render(); };
  if (q) q.oninput = e => { financeView.query = e.target.value; apply(); };
  if (type) type.onchange = e => { financeView.type = e.target.value; apply(); };
  if (from) from.onchange = e => { financeView.from = e.target.value; apply(); };
  if (to) to.onchange = e => { financeView.to = e.target.value; apply(); };
  if (per) per.onchange = e => { financeView.perPage = Number(e.target.value) || 50; apply(); };
}

function bindView() {
  document.querySelectorAll('[data-page-jump]').forEach(b => b.onclick = () => { activePage = b.dataset.pageJump; render(); });
  document.querySelectorAll('[data-open-modal]').forEach(b => b.onclick = () => openModal(b.dataset.openModal));
  document.querySelectorAll('[data-delete-op]').forEach(b => b.onclick = () => deleteOperation(b.dataset.deleteOp));
  document.querySelectorAll('[data-delete-category]').forEach(b => b.onclick = () => { const type = b.dataset.deleteCategory; const name = b.dataset.categoryName; if (!confirm(`Удалить категорию «${name}» из списка? Старые операции останутся как есть.`)) return; removeCategory(type, name); save(); render(); toast('Категория удалена из списка'); });
  document.querySelectorAll('[data-delete-goal]').forEach(b => b.onclick = () => { const g = state.goals.find(x=>x.id===b.dataset.deleteGoal); if(g) g.status = 'Отменена'; save(); render(); });
  document.querySelectorAll('[data-hide-habit]').forEach(b => b.onclick = () => { const h = state.habits.find(x=>x.id===b.dataset.hideHabit); if(h) h.active = false; save(); render(); });
  document.querySelectorAll('[data-toggle-task]').forEach(b => b.onclick = () => { const t = state.tasks.find(x=>x.id===b.dataset.toggleTask); if(t) t.status = t.status === 'Готово' ? 'В работе' : 'Готово'; save(); render(); });
  document.querySelectorAll('[data-calendar-task]').forEach(a => a.onclick = () => { const t = state.tasks.find(x=>x.id===a.dataset.calendarTask); if(t) { t.calendarAdded = true; t.calendarLink = buildGoogleCalendarUrl(t); save(); setTimeout(render, 500); } });
  bindFinanceControls();
  document.querySelectorAll('[data-habit]').forEach(ch => ch.onchange = () => {
    const key = todayKey();
    state.habitLogs[key] = state.habitLogs[key] || {};
    state.habitLogs[key][ch.dataset.habit] = ch.checked;
    save(); toast('Привычка обновлена');
  });
  document.querySelectorAll('[data-action]').forEach(b => b.onclick = actionHandler);
  const panelSearch = document.getElementById('panelSearch');
  if (panelSearch) panelSearch.oninput = (e) => { document.getElementById('globalSearch').value = e.target.value; render({ search: e.target.value }); };
  const backupInput = document.getElementById('backupInput');
  if (backupInput) backupInput.onchange = importBackup;
  const bankFile = document.getElementById('bankCsvFile');
  if (bankFile) bankFile.onchange = () => toast('Файл выбран. Нажми «Разобрать файл»');
  bindImportControls();
}
function actionHandler(e) {
  const a = e.currentTarget.dataset.action;
  if (a === 'applyPeriod') { localStorage.setItem('panel.from', document.getElementById('panelFrom').value); localStorage.setItem('panel.to', document.getElementById('panelTo').value); render(); }
  if (a === 'currentMonthPeriod') { localStorage.setItem('panel.from', `${state.settings.currentMonth}-01`); localStorage.setItem('panel.to', `${state.settings.currentMonth}-31`); render(); }
  if (a === 'financePrev') { financeView.page = Math.max(1, (financeView.page || 1) - 1); render(); }
  if (a === 'financeNext') { financeView.page = (financeView.page || 1) + 1; render(); }
  if (a === 'parseBankFile') parseBankFile();
  if (a === 'transferBankRows') transferBankRows();
  if (a === 'clearBankImport') clearBankImport();
  if (a === 'selectBankRows') selectBankRows();
  if (a === 'unselectBankRows') unselectBankRows();
  if (a === 'undoDeleteOp') undoLastDelete();
  if (a === 'saveSettings') saveSettings();
  if (a === 'backup') exportBackup();
  if (a === 'resetAll') { if(confirm('Точно очистить все данные?')) { state = defaultData(); save(); render(); } }
  if (a === 'repair') { save(); toast('Система проверена: локальные данные сохранены'); }
  if (a === 'cloudRegister') cloudRegister();
  if (a === 'cloudLogin') cloudLogin();
  if (a === 'cloudLogout') window.SecondBrainCloud?.logout();
  if (a === 'cloudPush') window.SecondBrainCloud?.pushNow(state);
  if (a === 'cloudPull') window.SecondBrainCloud?.pullNow();
  if (a === 'cloudRefresh') { window.SecondBrainCloud?.refreshStatus(); render(); }
  if (a === 'antiChaos') openAntiChaos();
  if (a === 'fabQuick') openModal('quickExpense');
}
function cloudCredentials() {
  return {
    email: document.getElementById('cloudEmail')?.value?.trim() || '',
    password: document.getElementById('cloudPassword')?.value || ''
  };
}
async function cloudRegister() {
  const c = cloudCredentials();
  if (!c.email || !c.password) return toast('Введи email и пароль');
  if (window.SecondBrainCloud?.init) await window.SecondBrainCloud.init();
  window.SecondBrainCloud?.register(c.email, c.password);
}
async function cloudLogin() {
  const c = cloudCredentials();
  if (!c.email || !c.password) return toast('Введи email и пароль');
  if (window.SecondBrainCloud?.init) await window.SecondBrainCloud.init();
  window.SecondBrainCloud?.login(c.email, c.password);
}

function saveSettings() {
  state.settings.currentMonth = document.getElementById('setMonth').value || toMonthKey(new Date());
  state.settings.currency = document.getElementById('setCurrency').value || '₽';
  state.settings.transferDay = num(document.getElementById('setTransferDay')?.value) || 10;
  state.settings.allocation = { savings: 0, cushion: 0, goal: 0, life: 0 };
  save(); toast('Настройки сохранены'); render();
}

function openModal(type) {
  const html = modalContent(type);
  document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop"><div class="modal"><header><h3>${html.title}</h3><button class="ghost-btn" data-close-modal>✕</button></header>${html.body}</div></div>`;
  document.querySelector('[data-close-modal]').onclick = closeModal;
  bindModal(type);
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }
function modalContent(type) {
  const expenseCatOptions = categoryOptions('expense');
  const incomeCatOptions = categoryOptions('income');
  const areaOptions = state.settings.areas.map(c=>`<option>${c}</option>`).join('');
  const goalOptions = ['<option value="">Без цели</option>', ...state.goals.filter(g=>g.status!=='Готово'&&g.status!=='Отменена').map(g=>`<option value="${g.id}">${g.title}</option>`)].join('');
  if (type === 'quickExpense') return { title:'💸 Добавить расход', body:`<div class="form-grid"><label>Дата<input id="mDate" type="date" value="${todayKey()}"></label><label>Сумма<input id="mAmount" type="number" placeholder="0"></label><label>Категория<select id="mCategory">${expenseCatOptions}</select></label><label>Эмоция<select id="mEmotion"><option>Нейтрально</option><option>Нужно</option><option>Стресс</option><option>Импульс</option><option>Радость</option></select></label><label class="full">Комментарий<input id="mNote" placeholder="Например: кофе, продукты, такси"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="expense">Добавить</button></div>` };
  if (type === 'quickIncome') return { title:'💰 Добавить доход', body:`<div class="form-grid"><label>Дата<input id="mDate" type="date" value="${todayKey()}"></label><label>Сумма<input id="mAmount" type="number" placeholder="0"></label><label>Категория<select id="mCategory">${incomeCatOptions}</select></label><label>Вернуть до, если это долг<input id="mDebtDue" type="date"></label><label class="full">Источник / кто дал / комментарий<input id="mNote" placeholder="Зарплата, проект, кредит, кто дал в долг"></label></div><div class="calendar-note">Если выберешь «Кредитные средства» или «Взял в долг» и укажешь дату возврата, система сама создаст задачу.</div><div class="actions-row"><button class="primary-btn" data-modal-save="income">Добавить доход</button></div>` };
  if (type === 'quickTask') return { title:'📌 Добавить задачу', body:`<div class="form-grid"><label class="full">Задача<input id="tTitle" placeholder="Что сделать?"></label><label>Сфера<select id="tArea">${areaOptions}</select></label><label>Цель<select id="tGoal">${goalOptions}</select></label><label>Дедлайн<input id="tDue" type="date"></label><label>Время<input id="tTime" type="time" value="09:00"></label><label>Длительность, мин<input id="tDuration" type="number" value="30"></label><label>Напоминание<select id="tReminder"><option>В Google Calendar</option><option>За 10 минут</option><option>За 30 минут</option><option>За 1 час</option></select></label><label>Приоритет<select id="tPriority"><option>Средний</option><option>Высокий</option><option>Низкий</option></select></label><label class="full">Следующий шаг<input id="tNext" placeholder="Самое маленькое действие"></label></div><div class="calendar-note">После добавления открой задачу и нажми «📅 В календарь» — Google Calendar сам даст уведомления на ПК и iPhone.</div><div class="actions-row"><button class="primary-btn" data-modal-save="task">Добавить</button></div>` };
  if (type === 'quickGoal') return { title:'🎯 SMART-цель', body:`<div class="form-grid"><label class="full">Название цели<input id="gTitle" placeholder="Например: накопить 150 000 ₽"></label><label>Сфера<select id="gArea">${areaOptions}</select></label><label>Метрика<input id="gMetric" placeholder="₽, тренировки, часы"></label><label>Цель в цифре<input id="gTarget" type="number" placeholder="150000"></label><label>Текущее значение<input id="gCurrent" type="number" placeholder="0"></label><label>Дедлайн<input id="gDeadline" type="date"></label><label class="full">Почему важно<textarea id="gWhy" placeholder="Зачем мне эта цель?"></textarea></label><label class="full">Следующий шаг<input id="gNext" placeholder="Первое действие"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="goal">Добавить цель</button></div>` };
  if (type === 'addHabit') return { title:'✅ Новая привычка', body:`<div class="form-grid"><label class="full">Название<input id="hName" placeholder="Например: 20 минут ходьбы"></label><label>Сфера<select id="hArea">${areaOptions}</select></label><label>Цель раз в неделю<input id="hTarget" type="number" value="5"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="habit">Добавить</button></div>` };
  if (type === 'closeDay') return { title:'🌙 Закрыть день', body:`<div class="form-grid"><label>Дата<input id="dDate" type="date" value="${todayKey()}"></label><label>Сон, часов<input id="dSleep" type="number" step="0.5" value="7"></label><label>Энергия 1–10<input id="dEnergy" type="number" min="1" max="10" value="7"></label><label>Настроение 1–10<input id="dMood" type="number" min="1" max="10" value="7"></label><label>Стресс 1–10<input id="dStress" type="number" min="1" max="10" value="4"></label><label class="full">Итог дня<textarea id="dNote" placeholder="Что получилось? Что понял?"></textarea></label></div><h3 style="margin-top:18px">Привычки</h3><div class="checkbox-grid">${state.habits.filter(h=>h.active).map(h=>`<label class="check-card"><span>${h.name}</span><input type="checkbox" data-day-habit="${h.id}"></label>`).join('')}</div><div class="actions-row"><button class="primary-btn" data-modal-save="day">Закрыть день</button></div>` };
  if (type === 'wantBuy') return { title:'🛒 Хочу купить', body:`<div class="form-grid"><label class="full">Что купить<input id="bName" placeholder="Например: кроссовки"></label><label>Сумма<input id="bAmount" type="number" placeholder="0"></label><label>Категория<select id="bCategory">${expenseCatOptions}</select></label><label>Эмоция<select id="bEmotion"><option>Нужно</option><option>Хочу</option><option>Стресс</option><option>Импульс</option></select></label></div><div id="buyResult" class="empty" style="margin-top:14px">Заполни сумму, и система оценит покупку.</div><div class="actions-row"><button class="soft-btn" data-modal-action="checkBuy">Проверить</button><button class="primary-btn" data-modal-save="buyExpense">Купить и записать</button></div>` };
  if (type === 'manualAllocation') { const d = `${state.settings.currentMonth}-${String(state.settings.transferDay || 10).padStart(2,'0')}`; return { title:'🏦 Ручное распределение денег', body:`<div class="form-grid"><label>Дата<input id="aDate" type="date" value="${d}"></label><label>Сбережения<input id="aSavings" type="number" placeholder="0"></label><label>Подушка<input id="aCushion" type="number" placeholder="0"></label><label>Финансовая цель<input id="aGoal" type="number" placeholder="0"></label><label class="full">Комментарий<input id="aNote" placeholder="Например: распределение зарплаты за месяц"></label></div><div class="calendar-note">Автоматических списаний нет. Эти суммы будут записаны как ручные финансовые переводы и помогут контролировать 10-е число.</div><div class="actions-row"><button class="primary-btn" data-modal-save="manualAllocation">Записать распределение</button></div>` }; }

  if (type === 'addCategory') return { title:'🏷 Добавить категорию', body:`<div class="form-grid"><label>Тип<select id="catType"><option value="expense">Расход</option><option value="income">Доход</option></select></label><label class="full">Название категории<input id="catName" placeholder="Например: Маркетплейсы / Зарплата / Возврат"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="category">Добавить категорию</button></div>` };
  if (type === 'weeklyReport') return { title:'📅 Недельный отчёт', body:`<div class="empty">Собрать отчёт за последние 7 дней?</div><div class="actions-row"><button class="primary-btn" data-modal-save="week">Собрать</button></div>` };
  if (type === 'csvImport') return { title:'🏦 Банк-импорт', body:`<p class="sub">Лучше открыть полноценный экран банка: там есть дубли, кодировки и категории.</p><div class="actions-row"><button class="primary-btn" data-modal-action="goBankImport">Открыть банк-импорт</button></div>` };
  return { title:'Окно', body:'' };
}
function bindModal(type) {
  document.querySelectorAll('[data-modal-save]').forEach(b => b.onclick = () => saveModal(b.dataset.modalSave));
  document.querySelectorAll('[data-modal-action]').forEach(b => b.onclick = () => modalAction(b.dataset.modalAction));
}
function saveModal(kind) {
  if (kind === 'expense' || kind === 'income') {
    const amount = num(document.getElementById('mAmount').value);
    if (!amount) return toast('Введи сумму');
    const category = document.getElementById('mCategory')?.value || 'Другое';
    const note = document.getElementById('mNote')?.value || '';
    const op = { id: uid(), date: document.getElementById('mDate').value || todayKey(), type: kind, amount, category, note, emotion: document.getElementById('mEmotion')?.value || '' };
    if (kind === 'income') {
      const debtDue = document.getElementById('mDebtDue')?.value || '';
      if (debtDue) op.debtDue = debtDue;
      if (LOAN_INCOME_CATEGORIES.includes(category) && debtDue) {
        state.tasks.push({ id: uid(), title: `Вернуть ${money(amount)}${note ? ' — ' + note : ''}`, area: 'Финансы', due: debtDue, time: '10:00', duration: 30, reminder: 'В Google Calendar', priority: 'Высокий', status: 'В работе', nextAction: 'Вернуть заемные средства', linkedOperationId: op.id });
      }
    }
    state.operations.push(op);
  }
  if (kind === 'manualAllocation') {
    const date = val('aDate') || todayKey();
    const note = val('aNote') || 'Ручное распределение 10 числа';
    const items = [
      ['Сбережения', num(val('aSavings'))],
      ['Подушка', num(val('aCushion'))],
      ['Финансовая цель', num(val('aGoal'))],
    ].filter(x => x[1] > 0);
    if (!items.length) return toast('Введи хотя бы одну сумму');
    items.forEach(([category, amount]) => state.operations.push({ id: uid(), date, type: 'expense', amount, category, note, emotion: 'Ручное распределение' }));
  }
  if (kind === 'task') state.tasks.push({ id: uid(), title: val('tTitle'), area: val('tArea'), goalId: val('tGoal'), due: val('tDue'), time: val('tTime'), duration: num(val('tDuration')) || 30, reminder: val('tReminder'), priority: val('tPriority'), status: 'В работе', nextAction: val('tNext'), calendarAdded: false });
  if (kind === 'goal') state.goals.push({ id: uid(), title: val('gTitle'), area: val('gArea'), metric: val('gMetric'), targetValue: num(val('gTarget')), currentValue: num(val('gCurrent')), deadline: val('gDeadline'), why: val('gWhy'), nextAction: val('gNext'), status: 'Активна' });
  if (kind === 'category') {
    if (!addCategory(val('catType'), val('catName'))) return toast('Введи название категории');
  }
  if (kind === 'habit') state.habits.push({ id: uid(), name: val('hName'), area: val('hArea'), targetPerWeek: num(val('hTarget')) || 5, active: true });
  if (kind === 'day') closeDaySave();
  if (kind === 'buyExpense') {
    const amount = num(val('bAmount'));
    if (!amount) return toast('Введи сумму');
    state.operations.push({ id: uid(), date: todayKey(), type: 'expense', amount, category: val('bCategory'), note: val('bName'), emotion: val('bEmotion') });
  }
  if (kind === 'week') generateWeeklyReport();
  if (kind === 'csvTransfer') transferCsvRows();
  save(); closeModal(); render(); toast('Готово');
}
function val(id) { return document.getElementById(id)?.value || ''; }
function createAllocationOperations(amount, date) {
  // Автораспределение отключено: пользователь вручную записывает переводы через модальное окно «Ручное распределение».
  return null;
}
function closeDaySave() {
  const date = val('dDate') || todayKey();
  state.states = state.states.filter(s => s.date !== date);
  state.states.push({ date, sleep: num(val('dSleep')), energy: num(val('dEnergy')), mood: num(val('dMood')), stress: num(val('dStress')), note: val('dNote') });
  state.journal.push({ id: uid(), date, text: val('dNote'), tags: 'итог дня' });
  state.habitLogs[date] = state.habitLogs[date] || {};
  document.querySelectorAll('[data-day-habit]').forEach(ch => state.habitLogs[date][ch.dataset.dayHabit] = ch.checked);
}
function modalAction(action) {
  if (action === 'checkBuy') {
    const amount = num(val('bAmount'));
    const s = monthSummary();
    const after = s.left - amount;
    let verdict = 'Можно купить'; let cls = 'green';
    if (amount > s.dailyLimit * 2 || after < 0) { verdict = 'Лучше отложить: покупка ломает план'; cls = 'danger'; }
    else if (amount > s.dailyLimit) { verdict = 'Можно, но это выше дневного лимита'; cls = 'warn'; }
    document.getElementById('buyResult').innerHTML = `<span class="tag ${cls}">${verdict}</span><p>После покупки останется: <b>${money(after)}</b>. Новый дневной лимит: <b>${money(Math.max(0, after / daysLeftInMonth()))}</b>.</p>`;
  }
  if (action === 'parseCsv') parseBankFile();
  if (action === 'goBankImport') { closeModal(); activePage = 'bank'; render(); }
}
function parseCsv() { parseBankFile(); }
function renderCsvPreview() { render(); }
function transferCsvRows() { transferBankRows(); }
function generateWeeklyReport() {
  const to = todayKey();
  const d = new Date(); d.setDate(d.getDate() - 6);
  const from = toDateKey(d);
  const ops = state.operations.filter(o=>dateBetween(o.date, from, to));
  const expenses = total(ops.filter(o=>o.type==='expense'));
  const income = total(ops.filter(o=>o.type==='income'));
  const cats = categoryTotals(from, to);
  const st = stateStats(7);
  const report = { id: uid(), date: to, from, to, text: `Доход: ${money(income)}. Расход: ${money(expenses)}. Главная категория: ${cats[0]?.[0] || 'нет'}. Энергия: ${st.energy.toFixed(1)}. Фокус: ${cats[0] ? 'контроль категории ' + cats[0][0] : 'поддерживать ритм'}.` };
  state.reports.push(report);
  state.journal.push({ id: uid(), date: to, text: report.text, tags: 'недельный отчёт' });
}
function openAntiChaos() {
  const t = state.tasks.find(x => x.status !== 'Готово') || {};
  openCustomModal('🆘 Антихаос-режим', `<div class="grid"><div class="card"><h3>Сегодня минимум</h3><p>1. Запиши один расход или доход.</p><p>2. Отметь одну привычку: <b>${state.habits.find(h=>h.active)?.name || 'любую'}</b>.</p><p>3. Закрой одну маленькую задачу: <b>${t.title || 'создай простую задачу'}</b>.</p><p>4. Вечером закрой день и ложись без героизма.</p></div></div>`);
}
function openCustomModal(title, body) {
  document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop"><div class="modal"><header><h3>${title}</h3><button class="ghost-btn" data-close-modal>✕</button></header>${body}</div></div>`;
  document.querySelector('[data-close-modal]').onclick = closeModal;
}
function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `second-brain-backup-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try { state = migrate(JSON.parse(reader.result)); save(); render(); toast('Бэкап загружен'); } catch { toast('Не удалось загрузить JSON'); } };
  reader.readAsText(file);
}


/* === FINANCE & UX PRO PATCH 2026-06-17 ===
   Банковская лента, долги, финансовые дни 10/25, подсказки категорий, темы. */

function enhanceFinanceUXProState() {
  state.settings = state.settings || {};
  state.settings.theme = state.settings.theme || 'latte';
  state.settings.payDays = Array.isArray(state.settings.payDays) && state.settings.payDays.length ? state.settings.payDays : [10, 25];
  state.settings.categoryRules = Array.isArray(state.settings.categoryRules) ? state.settings.categoryRules : [];
  state.settings.categoryColors = state.settings.categoryColors || defaultCategoryColors();
  state.settings.expenseCategories = uniqueClean([...(state.settings.expenseCategories || []), 'Связь', 'Коммунальные услуги', 'Дал в долг', 'Отдал долг', 'Маркетплейсы']);
  state.settings.incomeCategories = uniqueClean([...(state.settings.incomeCategories || []), 'Вернули долг', 'Кредитные средства', 'Взял в долг']);
  state.debts = Array.isArray(state.debts) ? state.debts : [];
  financeView.mode = financeView.mode || 'feed';
}

function defaultCategoryColors() {
  return {
    'Продукты': '#9caf88', 'Кафе': '#c89f73', 'Транспорт': '#9bb7c9', 'Дом': '#b8a28f',
    'Здоровье': '#b991a8', 'Одежда': '#d3a68c', 'Подписки': '#a49ac7', 'Подарки': '#d6a7a2',
    'Обучение': '#8faeaa', 'Развлечения': '#c8a2c8', 'Путешествия': '#8daec6', 'Импульсные': '#d18f85',
    'Финансовая цель': '#8e9f7f', 'Сбережения': '#7f9a81', 'Подушка': '#8296a8', 'Связь': '#94a8c8',
    'Коммунальные услуги': '#b7a28b', 'Дал в долг': '#a68178', 'Отдал долг': '#7d6f66', 'Маркетплейсы': '#c19a83',
    'Зарплата': '#7f9a81', 'Проект': '#8faeaa', 'Фриланс': '#9bb7c9', 'Возврат': '#a8b8a0',
    'Подарок': '#d6a7a2', 'Продажа': '#b99079', 'Кэшбэк': '#c99750', 'Проценты': '#8e9f7f',
    'Кредитные средства': '#7f8798', 'Взял в долг': '#9b7d72', 'Вернули долг': '#9caf88', 'Другое': '#b5a89f'
  };
}

enhanceFinanceUXProState();
if (!pages.some(p => p[0] === 'debts')) pages.splice(5, 0, ['debts', '💳', 'Долги']);

function applyTheme() {
  const theme = state.settings?.theme || 'latte';
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
}

function render(opts = {}) {
  enhanceFinanceUXProState();
  applyTheme();
  renderNav();
  const page = pages.find(p => p[0] === activePage);
  document.getElementById('pageTitle').textContent = page ? page[2] : 'Главная';
  document.getElementById('todayMini').innerHTML = `${new Date().toLocaleDateString('ru-RU')}<br>${monthLabel(state.settings.currentMonth)}<br><span class="tag green">Life Score ${lifeScore()}/100</span>`;
  const view = document.getElementById('view');
  const map = { dashboard, today: todayView, quick, finance, bank: bankImport, debts, panel, goals, habits, tasks, calendar: calendarView, state: stateView, insights, sync: syncView, settings };
  view.innerHTML = (map[activePage] || dashboard)(opts);
  bindView();
}

function lifeScore() {
  const s = monthSummary();
  const baseFinance = s.income ? clamp((s.left / Math.max(1, s.income * .2)) * 100) : 50;
  const debt = debtSummary();
  const debtPressure = s.income ? clamp(100 - (debt.openOwe / Math.max(1, s.income)) * 80, 10, 100) : (debt.openOwe ? 45 : 70);
  const finance = Math.round(baseFinance * .72 + debtPressure * .28);
  const habits = habitMonthStats().percent;
  const goals = goalsStats().avg || 40;
  const ts = tasksStats();
  const tasks = clamp(100 - ts.overdue * 20 - Math.max(0, ts.open - 10) * 2);
  const st = stateStats();
  const condition = st.rows.length ? clamp(((st.energy + st.mood) / 2 * 10) - st.stress * 3) : 60;
  return Math.round(finance*.34 + habits*.22 + goals*.18 + condition*.14 + tasks*.12);
}

function dashboard() {
  const s = monthSummary();
  const h = habitMonthStats();
  const g = goalsStats();
  const t = tasksStats();
  const sc = lifeScore();
  const debt = debtSummary();
  const att = attentionItems();
  const cats = categoryTotals(`${state.settings.currentMonth}-01`, `${state.settings.currentMonth}-31`).slice(0,5);
  return `
    <div class="os-home">
      <section class="home-hero-pro card">
        <div>
          <div class="tiny-label">${new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</div>
          <h2>Финансы и жизнь в одном ритме</h2>
          <p class="sub">Notion/Pinterest-стиль: банковская лента, долги, финансовые дни, привычки и состояние. Фокус — меньше ручной рутины, больше контроля.</p>
          <div class="actions-row">
            <button class="primary-btn" data-open-modal="quickExpense">💸 Расход</button>
            <button class="soft-btn" data-open-modal="quickIncome">💰 Доход</button>
            <button class="soft-btn" data-action="openDebtModal">💳 Долг</button>
            <button class="soft-btn" data-page-jump="today">🌤 Сегодня</button>
          </div>
        </div>
        <div class="score-orbit">
          <div class="score-ring" style="--score:${sc}"><span>${sc}</span><small>Life Score</small></div>
          <div class="sub">${scoreText(sc)}</div>
        </div>
      </section>
      <div class="grid cards" style="margin-top:16px">
        ${kpi('📆','Можно тратить сегодня', money(s.dailyLimit), `Остаток месяца: ${money(s.left)}`)}
        ${kpi('💳','Долги к возврату', money(debt.openOwe), `${debt.oweCount} активных`)}
        ${kpi('✅','Привычки', `${h.percent}%`, `${h.done} отметок за месяц`)}
        ${kpi('📌','Задачи', `${t.today} сегодня`, `${t.overdue} просрочено`)}
      </div>
      ${financialDayCard()}
      <div class="grid two" style="margin-top:16px">
        <div class="card"><h3>🔔 Центр внимания</h3>${att.length ? att.map(x => `<div class="attention-item ${x.tone || ''}"><b>${x.title}</b><span>${x.text}</span></div>`).join('') : empty('Система спокойна. Продолжай в том же ритме.')}</div>
        <div class="card"><h3>🎛 Категории месяца</h3>${cats.length ? cats.map(([name, amount]) => categoryBar(name, amount, s.expenses)).join('') : empty('Пока нет расходов за месяц')}</div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="section-head"><div><h3>🧾 Последние операции</h3><p class="sub">Лента теперь сгруппирована как в банковском приложении.</p></div><button class="soft-btn" data-page-jump="finance">Открыть журнал</button></div>
        ${bankingFeed([...state.operations].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,12), { compact:true })}
      </div>
    </div>`;
}

function attentionItems() {
  const items = [];
  const f = financialDayStatus();
  const debt = debtSummary();
  const t = tasksStats();
  const s = monthSummary();
  const goalsNoAction = state.goals.filter(g => g.status !== 'Готово' && g.status !== 'Отменена' && !String(g.nextAction || '').trim()).length;
  if (f.today) items.push({ tone:'warn', title:'Сегодня финансовый день', text:'Проверь зарплату/аванс и вручную сделай распределение.' });
  if (f.overdue) items.push({ tone:'danger', title:'Финансовый день пропущен', text:`Распределение просрочено: ${f.label}.` });
  if (debt.dueSoon.length) items.push({ tone:'danger', title:'Долги рядом', text:`Ближайший возврат: ${debt.dueSoon[0].title} · ${debt.dueSoon[0].due}.` });
  if (t.overdue) items.push({ tone:'danger', title:'Просроченные задачи', text:`Открыто просрочек: ${t.overdue}. Закрой одну маленькую.` });
  if (s.dailyLimit && s.dailyLimit < 700) items.push({ tone:'warn', title:'Низкий дневной лимит', text:`Безопасно тратить около ${money(s.dailyLimit)} в день.` });
  if (goalsNoAction) items.push({ tone:'warn', title:'Цели без следующего шага', text:`Добавь действие для ${goalsNoAction} цели.` });
  if (!items.length && state.operations.length) items.push({ tone:'green', title:'База стабильная', text:'Можно смотреть категории и держать ритм.' });
  return items.slice(0, 6);
}

function finance() {
  enhanceFinanceUXProState();
  const rowsAll = filteredFinanceOperations();
  const totalPages = Math.max(1, Math.ceil(rowsAll.length / financeView.perPage));
  financeView.page = clamp(financeView.page || 1, 1, totalPages);
  const start = (financeView.page - 1) * financeView.perPage;
  const rows = rowsAll.slice(start, start + financeView.perPage);
  const s = monthSummary();
  const debt = debtSummary();
  const undo = lastDeletedOperation ? `<div class="card" style="margin-top:16px;background:#fff8eb"><div class="section-head"><div><h3>↩️ Последнее удаление</h3><p class="sub">${operationLabel(lastDeletedOperation)}</p></div><button class="soft-btn" data-action="undoDeleteOp">Восстановить</button></div></div>` : '';
  const ledger = financeView.mode === 'table'
    ? table(['Дата','Тип','Сумма','Категория','Комментарий',''], rows.map(operationRow))
    : bankingFeed(rows);
  return `<div class="grid cards">
    ${kpi('💰','Доход месяца', money(s.income), 'Факт по операциям')}
    ${kpi('💸','Расходы', money(s.expenses), 'Без ручных накоплений')}
    ${kpi('🏦','Отложено вручную', money(s.allocations), 'Сбережения / подушка / финцель')}
    ${kpi('💳','Открытые долги', money(debt.openOwe), `${debt.oweCount} к возврату`)}
  </div>
  ${financialDayCard()}
  ${undo}
  <div class="card finance-ledger banking-panel" style="margin-top:16px">
    <div class="section-head">
      <div><h3>💸 Банковская лента</h3><p class="sub">Операции сгруппированы по дням. На ПК — как банковский журнал, на телефоне — карточки.</p></div>
      <div class="actions-row" style="margin:0">
        <button class="soft-btn" data-page-jump="bank">🏦 Импорт банка</button>
        <button class="soft-btn" data-open-modal="manualAllocation">🏦 Распределение</button>
        <button class="soft-btn" data-action="openDebtModal">💳 Долг</button>
        <button class="primary-btn" data-open-modal="quickExpense">Добавить</button>
      </div>
    </div>
    <div class="finance-toolbar pro-toolbar">
      <label>Поиск<input id="financeQuery" value="${escapeAttr(financeView.query || '')}" placeholder="кафе, долг, банк"></label>
      <label>Тип<select id="financeType"><option value="all" ${financeView.type==='all'?'selected':''}>Все</option><option value="expense" ${financeView.type==='expense'?'selected':''}>Расходы</option><option value="income" ${financeView.type==='income'?'selected':''}>Доходы</option></select></label>
      <label>С даты<input id="financeFrom" type="date" value="${financeView.from || ''}"></label>
      <label>По дату<input id="financeTo" type="date" value="${financeView.to || ''}"></label>
      <label>Вид<select id="financeMode"><option value="feed" ${financeView.mode!=='table'?'selected':''}>Банковская лента</option><option value="table" ${financeView.mode==='table'?'selected':''}>Таблица</option></select></label>
      <label>На странице<select id="financePerPage"><option ${financeView.perPage==50?'selected':''}>50</option><option ${financeView.perPage==100?'selected':''}>100</option><option value="9999" ${financeView.perPage==9999?'selected':''}>Все</option></select></label>
    </div>
    <div class="ledger-meta">Показано ${rows.length} из ${rowsAll.length} операций · страница ${financeView.page} / ${totalPages}</div>
    ${ledger}
    <div class="pagination-row">
      <button class="soft-btn" data-action="financePrev" ${financeView.page<=1?'disabled':''}>← Назад</button>
      <button class="soft-btn" data-action="financeNext" ${financeView.page>=totalPages?'disabled':''}>Вперёд →</button>
    </div>
  </div>`;
}

function bankingFeed(rows, opts = {}) {
  if (!rows.length) return empty('Пока нет операций');
  const groups = {};
  rows.forEach(o => { const key = o.date || 'Без даты'; groups[key] = groups[key] || []; groups[key].push(o); });
  return `<div class="bank-feed ${opts.compact ? 'compact' : ''}">${Object.entries(groups).sort((a,b)=>b[0].localeCompare(a[0])).map(([date, list]) => {
    const inc = total(list.filter(o=>o.type === 'income'));
    const exp = total(list.filter(o=>o.type === 'expense'));
    return `<section class="feed-day"><header><div><b>${formatFeedDate(date)}</b><span>${list.length} опер.</span></div><div class="feed-totals">${inc ? `<span class="income">+${money(inc)}</span>` : ''}${exp ? `<span class="expense">−${money(exp)}</span>` : ''}</div></header>${list.map(feedOperationCard).join('')}</section>`;
  }).join('')}</div>`;
}

function formatFeedDate(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  const today = todayKey();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === today) return 'Сегодня';
  if (dateKey === toDateKey(yesterday)) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day:'numeric', month:'long', weekday:'short' });
}

function feedOperationCard(o) {
  const cls = o.type === 'income' ? 'income' : 'expense';
  return `<article class="op-card ${cls}">
    <div class="op-left"><div class="op-icon">${o.type === 'income' ? '↗' : '↘'}</div><div><b>${escapeHtml(o.note || o.category || 'Операция')}</b><div class="op-meta">${categoryChip(o.category || 'Без категории')} <span>${operationTypeLabel(o.type)}</span></div></div></div>
    <div class="op-right"><strong>${o.type === 'income' ? '+' : '−'}${money(o.amount)}</strong><button class="danger-btn mini-danger" data-delete-op="${o.id}">Удалить</button></div>
  </article>`;
}

function operationRow(o) {
  return [
    o.date,
    operationTypeLabel(o.type),
    `<b class="${o.type === 'income' ? 'income-text' : 'expense-text'}">${o.type === 'income' ? '+' : '−'}${money(o.amount)}</b>`,
    categoryChip(o.category || ''),
    o.note || '',
    `<button class="danger-btn" data-delete-op="${o.id}">Удалить</button>`
  ];
}

function categoryChip(name) {
  if (!name) return '';
  const color = categoryColor(name);
  return `<span class="cat-chip" style="--cat:${color}">${escapeHtml(name)}</span>`;
}
function categoryColor(name) {
  state.settings.categoryColors = state.settings.categoryColors || defaultCategoryColors();
  if (!state.settings.categoryColors[name]) {
    const palette = ['#b99079','#a8b8a0','#dcb9ae','#aebdca','#c99750','#9caf88','#c89f73','#8faeaa','#a49ac7','#d18f85'];
    const idx = Math.abs(String(name).split('').reduce((s,ch)=>s+ch.charCodeAt(0),0)) % palette.length;
    state.settings.categoryColors[name] = palette[idx];
  }
  return state.settings.categoryColors[name];
}

function bindFinanceControls() {
  const q = document.getElementById('financeQuery');
  const type = document.getElementById('financeType');
  const from = document.getElementById('financeFrom');
  const to = document.getElementById('financeTo');
  const per = document.getElementById('financePerPage');
  const mode = document.getElementById('financeMode');
  const apply = () => { financeView.page = 1; render(); };
  if (q) q.oninput = e => { financeView.query = e.target.value; apply(); };
  if (type) type.onchange = e => { financeView.type = e.target.value; apply(); };
  if (from) from.onchange = e => { financeView.from = e.target.value; apply(); };
  if (to) to.onchange = e => { financeView.to = e.target.value; apply(); };
  if (per) per.onchange = e => { financeView.perPage = Number(e.target.value) || 50; apply(); };
  if (mode) mode.onchange = e => { financeView.mode = e.target.value; apply(); };
}

function bankImportTable(rows) {
  if (!rows.length) return empty('Пока нет загруженной выписки. Загрузи CSV или Excel-файл банка, и здесь появятся операции для проверки.');
  const visible = rows.slice(0, 300);
  return table(['✓','Статус','Дата','Тип','Сумма','Категория','Подсказка','Описание'], visible.map(r => {
    const suggestion = categorySuggestion(r.note || '', r.type || 'expense');
    const status = r.duplicate ? '<span class="tag danger">Дубль</span>' : (r.category ? '<span class="tag green">Готово</span>' : '<span class="tag warn">Категория</span>');
    return [
      `<input type="checkbox" data-import-sel="${r.id}" ${r.selected ? 'checked' : ''}>`,
      status,
      `<input class="mini-input" type="date" data-import-date="${r.id}" value="${escapeAttr(r.date || todayKey())}">`,
      `<select class="mini-input" data-import-type="${r.id}"><option value="expense" ${r.type==='expense'?'selected':''}>Расход</option><option value="income" ${r.type==='income'?'selected':''}>Доход</option></select>`,
      money(r.amount),
      `<select class="mini-input" data-import-cat="${r.id}"><option value="">Выбери</option>${categoryOptions(r.type || 'expense', r.category || '')}</select>`,
      suggestion && !r.category ? `<button class="soft-btn mini-soft" data-apply-suggestion="${r.id}" data-suggest-cat="${escapeAttr(suggestion)}">${categoryChip(suggestion)} применить</button>` : (r.category ? '<span class="tag green">Выбрано</span>' : '<span class="sub">нет</span>'),
      `<div class="import-note">${escapeHtml(r.note || '')}</div>`
    ];
  }));
}

function bindImportControls() {
  document.querySelectorAll('[data-import-sel]').forEach(ch => ch.onchange = () => { const r = state.importRows.find(x=>x.id===ch.dataset.importSel); if(r) { r.selected = ch.checked; save(); render(); } });
  document.querySelectorAll('[data-import-cat]').forEach(sel => {
    const r = state.importRows.find(x=>x.id===sel.dataset.importCat);
    if (r && r.category) sel.value = r.category;
    sel.onchange = () => {
      const row = state.importRows.find(x=>x.id===sel.dataset.importCat);
      if(row) {
        row.category = sel.value;
        if (row.category) learnCategoryRule(row.note || '', row.category, row.type || 'expense');
        save(); render();
      }
    };
  });
  document.querySelectorAll('[data-apply-suggestion]').forEach(btn => btn.onclick = () => {
    const row = state.importRows.find(x => x.id === btn.dataset.applySuggestion);
    if (row) {
      row.category = btn.dataset.suggestCat;
      row.selected = !row.duplicate;
      learnCategoryRule(row.note || '', row.category, row.type || 'expense');
      save(); render(); toast('Категория применена и правило запомнено');
    }
  });
  document.querySelectorAll('[data-import-type]').forEach(sel => sel.onchange = () => { const r = state.importRows.find(x=>x.id===sel.dataset.importType); if(r) { r.type = sel.value; if (r.category && !categoryList(r.type).includes(r.category)) r.category = ''; save(); render(); } });
  document.querySelectorAll('[data-import-date]').forEach(inp => inp.onchange = () => { const r = state.importRows.find(x=>x.id===inp.dataset.importDate); if(r) { r.date = inp.value; r.duplicate = isDuplicateImportRow(r); if (r.duplicate) r.selected = false; save(); render(); } });
}

function categorySuggestion(note, type = 'expense') {
  const text = normalizeMerchantText(note);
  const rules = state.settings.categoryRules || [];
  const hit = rules.find(r => r.type === type && r.keyword && text.includes(r.keyword));
  if (hit && categoryList(type).includes(hit.category)) return hit.category;
  const patterns = [
    ['продукты', 'Продукты', /самокат|пятер|магнит|лента|перекрест|globus|spar|metro|bristol|fix price|sber 5411|еда|food/i],
    ['кафе', 'Кафе', /coffee|кофе|cafe|бар|restaurant|kfc|burger|суши|пицц/i],
    ['связь', 'Связь', /yota|мтс|megafon|tele2|beeline|телефон|интернет/i],
    ['транспорт', 'Транспорт', /taxi|такси|yandex go|транспорт|metro/i],
    ['здоровье', 'Здоровье', /аптек|pharm|clinic|мед/i],
    ['развлечения', 'Развлечения', /fonbet|кино|game|steam|развлеч/i],
    ['маркетплейсы', 'Маркетплейсы', /ozon|wildberries|wb|market|яндекс маркет/i],
    ['долг', type === 'income' ? 'Вернули долг' : 'Дал в долг', /долг|перевод|сбп|копилка/i],
  ];
  for (const [, cat, re] of patterns) {
    if (re.test(text) && categoryList(type).includes(cat)) return cat;
  }
  return '';
}

function learnCategoryRule(note, category, type = 'expense') {
  const keyword = merchantKeyword(note);
  if (!keyword || !category) return;
  state.settings.categoryRules = state.settings.categoryRules || [];
  const exists = state.settings.categoryRules.some(r => r.type === type && r.keyword === keyword && r.category === category);
  if (!exists) state.settings.categoryRules.unshift({ keyword, category, type, createdAt: new Date().toISOString() });
  state.settings.categoryRules = state.settings.categoryRules.slice(0, 250);
}
function normalizeMerchantText(note) { return String(note || '').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,' ').trim(); }
function merchantKeyword(note) {
  const text = normalizeMerchantText(note);
  const ru = text.match(/ru\s+([a-zа-я0-9]{3,}(?:\s+[a-zа-я0-9]{3,})?)/i);
  if (ru) return ru[1].trim().slice(0, 42);
  const known = ['samokat','sber','fonbet','yota','bristol','globus','ozon','wildberries','пятерочка','магнит','мтс','кофе','такси'];
  const hit = known.find(k => text.includes(k));
  if (hit) return hit;
  return text.split(' ').filter(w => w.length > 4 && !/^\d+$/.test(w)).slice(0,2).join(' ').slice(0, 42);
}

function transferBankRows() {
  const duplicateMode = document.getElementById('bankDuplicateMode')?.value || 'skip';
  const ready = state.importRows.filter(r => r.selected && r.category && (duplicateMode === 'allow' || !r.duplicate));
  if (!ready.length) return toast('Нет готовых строк: выбери операции и назначь категории');
  ready.forEach(r => {
    learnCategoryRule(r.note || '', r.category, r.type || 'expense');
    state.operations.push({ id: uid(), date: r.date, type: r.type || 'expense', amount: Math.abs(num(r.amount)), category: r.category, note: r.note || 'Импорт банка', emotion: r.source === 'bank-excel' ? 'Банк Excel' : 'Банк CSV', importedAt: new Date().toISOString(), importSource: r.source || 'bank-import' });
  });
  const ids = new Set(ready.map(r => r.id));
  state.importRows = state.importRows.filter(r => !ids.has(r.id));
  save(); render(); toast(`Перенесено операций: ${ready.length}`);
}

function businessPayDate(monthKey, day) {
  const [y, m] = monthKey.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const d = new Date(y, m - 1, Math.min(Number(day || 1), last));
  const wd = d.getDay();
  if (wd === 6) d.setDate(d.getDate() - 1);
  if (wd === 0) d.setDate(d.getDate() - 2);
  return toDateKey(d);
}
function financialDays(monthKey = state.settings.currentMonth) {
  return (state.settings.payDays || [10,25]).map(day => ({ day: Number(day), date: businessPayDate(monthKey, Number(day)), label: `${Number(day)} число` }));
}
function allocationOps(monthKey = state.settings.currentMonth) {
  return expenseOps(monthKey).filter(o => ALLOCATION_CATEGORIES.includes(o.category || ''));
}
function financialDayStatus(monthKey = state.settings.currentMonth) {
  const days = financialDays(monthKey);
  const ops = allocationOps(monthKey);
  const today = todayKey();
  const statuses = days.map((d, idx) => {
    const nextDate = days[idx+1]?.date || `${monthKey}-31`;
    const done = ops.some(o => o.date >= d.date && o.date < nextDate);
    return { ...d, done, today: today === d.date && !done, overdue: today > d.date && !done };
  });
  const active = statuses.find(x => x.today || x.overdue) || statuses.find(x => !x.done) || statuses[statuses.length - 1];
  return { statuses, active, today: statuses.some(x=>x.today), overdue: statuses.some(x=>x.overdue), label: active?.date || '' };
}
function financialDayCard() {
  const fd = financialDayStatus();
  const s = monthSummary();
  const tone = fd.overdue ? 'danger' : fd.today ? 'warn' : fd.statuses.every(x=>x.done) ? 'green' : 'blue';
  const title = fd.overdue ? 'Финансовый день просрочен' : fd.today ? 'Сегодня финансовый день' : fd.statuses.every(x=>x.done) ? 'Распределение закрыто' : 'Следи за зарплатой и авансом';
  return `<div class="card allocation-card ${tone}"><div><span class="tag ${tone}">${title}</span><h3>🏦 Ручное распределение</h3><p class="sub">Плановые дни: ${fd.statuses.map(x => `${x.date}${x.done ? ' ✓' : ''}`).join(' · ')}. Уже отложено: <b>${money(s.allocations)}</b>.</p></div><button class="primary-btn" data-open-modal="manualAllocation">Внести переводы</button></div>`;
}

function debtItems() {
  const fromOps = state.operations
    .filter(o => (o.type === 'income' && LOAN_INCOME_CATEGORIES.includes(o.category || '')) || (o.type === 'expense' && ['Дал в долг','Займ выдан'].includes(o.category || '')))
    .map(o => ({
      id: o.id,
      title: o.type === 'income' ? (o.note || 'Взял в долг') : (o.note || 'Мне должны'),
      direction: o.type === 'income' ? 'owe' : 'receivable',
      amount: num(o.amount),
      due: o.debtDue || '',
      sourceOperationId: o.id,
      note: o.note || '',
      createdAt: o.date
    }));
  const manual = (state.debts || []).filter(d => !fromOps.some(x => x.id === d.id));
  const all = [...fromOps, ...manual];
  return all.map(d => {
    const paid = state.operations
      .filter(o => o.linkedDebtId === d.id || o.linkedDebtId === d.sourceOperationId)
      .reduce((sum, o) => sum + num(o.amount), 0);
    const remaining = Math.max(0, num(d.amount) - paid);
    return { ...d, paid, remaining, status: remaining <= 0 ? 'Закрыт' : 'Активен' };
  }).sort((a,b)=>(a.due || '9999-99-99').localeCompare(b.due || '9999-99-99'));
}
function debtSummary() {
  const active = debtItems().filter(d => d.status !== 'Закрыт');
  const openOwe = active.filter(d => d.direction === 'owe').reduce((s,d)=>s+d.remaining,0);
  const openReceivable = active.filter(d => d.direction === 'receivable').reduce((s,d)=>s+d.remaining,0);
  const soonTo = new Date(); soonTo.setDate(soonTo.getDate() + 7);
  const dueSoon = active.filter(d => d.due && d.due <= toDateKey(soonTo)).sort((a,b)=>a.due.localeCompare(b.due));
  return { active, openOwe, openReceivable, oweCount: active.filter(d=>d.direction==='owe').length, receivableCount: active.filter(d=>d.direction==='receivable').length, dueSoon };
}
function debts() {
  const sum = debtSummary();
  const items = debtItems();
  const owe = items.filter(d => d.direction === 'owe');
  const receivable = items.filter(d => d.direction === 'receivable');
  return `<div class="grid cards">
    ${kpi('📉','Я должен', money(sum.openOwe), `${sum.oweCount} активных`)}
    ${kpi('📈','Мне должны', money(sum.openReceivable), `${sum.receivableCount} активных`)}
    ${kpi('⏰','Ближайшие 7 дней', sum.dueSoon.length, 'возвратов рядом')}
    ${kpi('✅','Закрыто', items.filter(d=>d.status==='Закрыт').length, 'долгов')}
  </div>
  <div class="card" style="margin-top:16px"><div class="section-head"><div><h3>💳 Долговой центр</h3><p class="sub">Долги влияют на Life Score. Цель — постепенно исключить их из жизни.</p></div><button class="primary-btn" data-action="openDebtModal">+ Добавить долг</button></div></div>
  <div class="grid two" style="margin-top:16px">
    <div class="card"><h3>Я должен</h3>${owe.length ? owe.map(debtCard).join('') : empty('Нет открытых долгов')}</div>
    <div class="card"><h3>Мне должны</h3>${receivable.length ? receivable.map(debtCard).join('') : empty('Нет долгов в твою пользу')}</div>
  </div>`;
}
function debtCard(d) {
  const pct = d.amount ? clamp((d.paid / d.amount) * 100) : 0;
  const danger = d.status !== 'Закрыт' && d.due && d.due < todayKey();
  const near = d.status !== 'Закрыт' && d.due && d.due <= toDateKey(new Date(Date.now()+7*86400000));
  return `<article class="debt-card ${danger ? 'danger-zone' : near ? 'warn-zone' : ''}">
    <div class="section-head"><div><b>${escapeHtml(d.title)}</b><p class="sub">${d.direction === 'owe' ? 'Нужно вернуть' : 'Должны вернуть тебе'} · ${d.due || 'без даты'}</p></div><span class="tag ${d.status==='Закрыт'?'green':danger?'danger':near?'warn':'blue'}">${d.status}</span></div>
    <div class="metric">${money(d.remaining)}</div>
    <div class="progress"><span style="width:${pct}%"></span></div>
    <p class="sub">Всего: ${money(d.amount)} · Уже закрыто: ${money(d.paid)}</p>
    <div class="actions-row"><button class="soft-btn" data-action="repayDebt" data-debt-id="${d.id}">${d.direction === 'owe' ? 'Записать возврат' : 'Мне вернули'}</button><a class="soft-btn" href="${buildDebtCalendarUrl(d)}" target="_blank" rel="noopener">📅 В календарь</a></div>
  </article>`;
}
function buildDebtCalendarUrl(d) {
  const title = encodeURIComponent(`${d.direction === 'owe' ? 'Вернуть долг' : 'Напомнить о долге'}: ${d.title}`);
  const due = d.due || todayKey();
  const start = new Date(`${due}T10:00:00`);
  const end = new Date(start.getTime() + 30 * 60000);
  const fmt = x => x.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const details = encodeURIComponent(`Сумма: ${money(d.remaining)}\nСоздано в Second Brain OS`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}
function openDebtModal() {
  openCustomModal('💳 Добавить долг', `<div class="form-grid">
    <label>Тип<select id="debtDirection"><option value="owe">Я взял в долг / кредит</option><option value="receivable">Я дал в долг</option></select></label>
    <label>Сумма<input id="debtAmount" type="number" placeholder="0"></label>
    <label>Дата операции<input id="debtDate" type="date" value="${todayKey()}"></label>
    <label>Вернуть до<input id="debtDue" type="date"></label>
    <label class="full">Кому / от кого / комментарий<input id="debtTitle" placeholder="Например: Алексей / кредитка / займ"></label>
  </div><div class="actions-row"><button class="primary-btn" id="saveDebtManualBtn">Сохранить долг</button></div>`);
  const btn = document.getElementById('saveDebtManualBtn');
  if (btn) btn.onclick = saveDebtManual;
}
function saveDebtManual() {
  const amount = num(val('debtAmount'));
  if (!amount) return toast('Введи сумму долга');
  const direction = val('debtDirection') || 'owe';
  const date = val('debtDate') || todayKey();
  const due = val('debtDue') || '';
  const title = val('debtTitle') || (direction === 'owe' ? 'Взял в долг' : 'Дал в долг');
  const category = direction === 'owe' ? 'Взял в долг' : 'Дал в долг';
  const type = direction === 'owe' ? 'income' : 'expense';
  const op = { id: uid(), date, type, amount, category, note: title, debtDue: due, debtDirection: direction, emotion: 'Долг' };
  state.operations.push(op);
  if (due) state.tasks.push({ id: uid(), title: `${direction === 'owe' ? 'Вернуть' : 'Проверить возврат'} ${money(amount)} — ${title}`, area:'Финансы', due, time:'10:00', duration:30, priority:'Высокий', status:'В работе', nextAction:'Закрыть долг', linkedOperationId: op.id });
  save(); closeModal(); render(); toast('Долг добавлен');
}
function openRepayDebtModal(id) {
  const d = debtItems().find(x => x.id === id);
  if (!d) return;
  openCustomModal(d.direction === 'owe' ? '↩️ Записать возврат долга' : '↪️ Мне вернули долг', `<div class="form-grid">
    <label>Дата<input id="repayDate" type="date" value="${todayKey()}"></label>
    <label>Сумма<input id="repayAmount" type="number" value="${Math.round(d.remaining)}"></label>
    <label class="full">Комментарий<input id="repayNote" value="${escapeAttr(d.title)}"></label>
  </div><div class="actions-row"><button class="primary-btn" id="saveDebtPaymentBtn">Записать</button></div>`);
  const btn = document.getElementById('saveDebtPaymentBtn');
  if (btn) btn.onclick = () => saveDebtPayment(d.id);
}
function saveDebtPayment(id) {
  const d = debtItems().find(x => x.id === id);
  if (!d) return;
  const amount = num(val('repayAmount'));
  if (!amount) return toast('Введи сумму');
  state.operations.push({ id: uid(), date: val('repayDate') || todayKey(), type: d.direction === 'owe' ? 'expense' : 'income', amount, category: d.direction === 'owe' ? 'Отдал долг' : 'Вернули долг', note: val('repayNote') || d.title, linkedDebtId: d.id, emotion:'Долг' });
  save(); closeModal(); render(); toast('Платёж по долгу записан');
}

function settings() {
  const payDays = (state.settings.payDays || [10,25]).join(', ');
  const rules = state.settings.categoryRules || [];
  return `<div class="grid two">
    <div class="card">
      <h3>⚙️ Настройки системы</h3>
      <div class="form-grid">
        <label>Текущий месяц<input id="setMonth" type="month" value="${state.settings.currentMonth}"></label>
        <label>Валюта<input id="setCurrency" value="${state.settings.currency}"></label>
        <label>Финансовые дни<input id="setPayDays" value="${escapeAttr(payDays)}" placeholder="10, 25"></label>
        <label>Тема<select id="setTheme"><option value="latte" ${state.settings.theme==='latte'?'selected':''}>Latte / Pinterest</option><option value="dark" ${state.settings.theme==='dark'?'selected':''}>Graphite Dark</option><option value="sage" ${state.settings.theme==='sage'?'selected':''}>Sage Soft</option></select></label>
        <label class="full">Правило<input value="Автораспределение отключено. Сбережения, подушка и финцель вносятся вручную в финансовые дни." disabled></label>
      </div>
      <div class="actions-row"><button class="primary-btn" data-action="saveSettings">Сохранить</button><button class="soft-btn" data-action="repair">Проверить систему</button></div>
    </div>
    <div class="card"><h3>🎨 Визуал</h3><p class="sub">Тема применяется сразу и синхронизируется между ПК и iPhone.</p><div class="theme-preview"><button class="theme-dot latte" data-action="setTheme" data-theme-value="latte">Latte</button><button class="theme-dot dark" data-action="setTheme" data-theme-value="dark">Dark</button><button class="theme-dot sage" data-action="setTheme" data-theme-value="sage">Sage</button></div></div>
    <div class="card"><h3>🏷 Категории</h3><p class="sub">Цвета назначаются автоматически в Notion/Pinterest стиле.</p><div class="actions-row"><button class="primary-btn" data-open-modal="addCategory">+ Добавить категорию</button></div><h4>Расходы</h4>${categoryChips('expense')}<h4 style="margin-top:16px">Доходы</h4>${categoryChips('income')}</div>
    <div class="card"><h3>🧠 Правила категорий</h3><p class="sub">Приложение запоминает твои ручные назначения из банк-импорта и потом предлагает категорию.</p><div class="ledger-meta">Правил: ${rules.length}</div>${rules.length ? `<div class="rule-list">${rules.slice(0,25).map(r=>`<div><b>${escapeHtml(r.keyword)}</b><span>${categoryChip(r.category)} · ${r.type === 'income' ? 'доход' : 'расход'}</span></div>`).join('')}</div>` : empty('Правила появятся после назначения категорий в импорте')}<div class="actions-row"><button class="danger-btn" data-action="resetCategoryRules">Сбросить правила</button></div></div>
    <div class="card"><h3>📦 Данные</h3><p class="sub">Всё хранится локально и синхронизируется с Firebase.</p><div class="actions-row"><button class="soft-btn" data-action="backup">Скачать бэкап</button><label class="soft-btn">Загрузить бэкап<input id="backupInput" type="file" accept=".json" hidden></label><button class="danger-btn" data-action="resetAll">Очистить всё</button></div></div>
  </div>`;
}

function saveSettings() {
  state.settings.currentMonth = document.getElementById('setMonth').value || toMonthKey(new Date());
  state.settings.currency = document.getElementById('setCurrency').value || '₽';
  const rawDays = document.getElementById('setPayDays')?.value || '10,25';
  state.settings.payDays = uniqueClean(rawDays.split(/[;,\s]+/)).map(Number).filter(d => d >= 1 && d <= 28);
  if (!state.settings.payDays.length) state.settings.payDays = [10,25];
  state.settings.transferDay = state.settings.payDays[0] || 10;
  state.settings.theme = document.getElementById('setTheme')?.value || state.settings.theme || 'latte';
  state.settings.allocation = { savings: 0, cushion: 0, goal: 0, life: 0 };
  save(); toast('Настройки сохранены'); render();
}

function actionHandler(e) {
  const a = e.currentTarget.dataset.action;
  if (a === 'applyPeriod') { localStorage.setItem('panel.from', document.getElementById('panelFrom').value); localStorage.setItem('panel.to', document.getElementById('panelTo').value); render(); }
  if (a === 'currentMonthPeriod') { localStorage.setItem('panel.from', `${state.settings.currentMonth}-01`); localStorage.setItem('panel.to', `${state.settings.currentMonth}-31`); render(); }
  if (a === 'financePrev') { financeView.page = Math.max(1, (financeView.page || 1) - 1); render(); }
  if (a === 'financeNext') { financeView.page = (financeView.page || 1) + 1; render(); }
  if (a === 'parseBankFile') parseBankFile();
  if (a === 'transferBankRows') transferBankRows();
  if (a === 'clearBankImport') clearBankImport();
  if (a === 'selectBankRows') selectBankRows();
  if (a === 'unselectBankRows') unselectBankRows();
  if (a === 'undoDeleteOp') undoLastDelete();
  if (a === 'saveSettings') saveSettings();
  if (a === 'backup') exportBackup();
  if (a === 'resetAll') { if(confirm('Точно очистить все данные?')) { state = defaultData(); enhanceFinanceUXProState(); save(); render(); } }
  if (a === 'repair') { enhanceFinanceUXProState(); save(); toast('Система проверена и мигрирована'); render(); }
  if (a === 'cloudRegister') cloudRegister();
  if (a === 'cloudLogin') cloudLogin();
  if (a === 'cloudLogout') window.SecondBrainCloud?.logout();
  if (a === 'cloudPush') window.SecondBrainCloud?.pushNow(state);
  if (a === 'cloudPull') window.SecondBrainCloud?.pullNow();
  if (a === 'cloudRefresh') { window.SecondBrainCloud?.refreshStatus(); render(); }
  if (a === 'antiChaos') openAntiChaos();
  if (a === 'fabQuick') openModal('quickExpense');
  if (a === 'openDebtModal') openDebtModal();
  if (a === 'saveDebtManual') saveDebtManual();
  if (a === 'repayDebt') openRepayDebtModal(e.currentTarget.dataset.debtId);
  if (a === 'saveDebtPayment') saveDebtPayment(e.currentTarget.dataset.debtId);
  if (a === 'setTheme') { state.settings.theme = e.currentTarget.dataset.themeValue || 'latte'; save(); render(); }
  if (a === 'resetCategoryRules') { if(confirm('Сбросить все обученные правила категорий?')) { state.settings.categoryRules = []; save(); render(); toast('Правила категорий сброшены'); } }
}



/* =========================
   STABILITY & DELIGHT PACK
   ========================= */

// Fix: local date keys without UTC shift. This fixes “today shows tomorrow” on +UTC timezones.
function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayKey() { return toDateKey(new Date()); }

function enhanceDelightState() {
  enhanceFinanceUXProState();
  state.undoStack = Array.isArray(state.undoStack) ? state.undoStack : [];
  state.reports = Array.isArray(state.reports) ? state.reports : [];
  state.recurring = Array.isArray(state.recurring) ? state.recurring : [];
  state.settings.categoryRules = Array.isArray(state.settings.categoryRules) ? state.settings.categoryRules : [];
  state.settings.categoryColors = state.settings.categoryColors || defaultCategoryColors();
  state.settings.visualDensity = state.settings.visualDensity || 'comfortable';
  state.settings.showSmartActions = state.settings.showSmartActions !== false;
  state.settings.expenseCategories = uniqueClean([...(state.settings.expenseCategories || []), 'Кредиты', 'Регулярные платежи']);
  state.settings.incomeCategories = uniqueClean([...(state.settings.incomeCategories || []), 'Аванс']);
}

enhanceDelightState();

function pushUndo(label) {
  try {
    state.undoStack = Array.isArray(state.undoStack) ? state.undoStack : [];
    const snap = JSON.stringify({ ...state, undoStack: [] });
    state.undoStack.unshift({ id: uid(), label: label || 'действие', at: new Date().toISOString(), snapshot: snap });
    state.undoStack = state.undoStack.slice(0, 8);
  } catch (e) { console.warn('undo snapshot failed', e); }
}
function undoLastAction() {
  const item = state.undoStack?.shift();
  if (!item) return toast('Нет действий для отмены');
  try {
    const previous = JSON.parse(item.snapshot);
    const rest = state.undoStack || [];
    state = migrate(previous);
    enhanceDelightState();
    state.undoStack = rest;
    save();
    render();
    toast(`Отменено: ${item.label}`);
  } catch (e) {
    console.error(e);
    toast('Не удалось отменить действие');
  }
}
function undoBar() {
  const item = state.undoStack?.[0];
  if (!item) return '';
  return `<div class="undo-bar"><span>Последнее действие: <b>${escapeHtml(item.label)}</b></span><button class="soft-btn" data-action="undoLastAction">↩️ Отменить</button></div>`;
}

function lifeScoreDetails() {
  const s = monthSummary();
  const baseFinance = s.income ? clamp((s.left / Math.max(1, s.income * .2)) * 100) : 50;
  const debt = debtSummary();
  const debtPressure = s.income ? clamp(100 - (debt.openOwe / Math.max(1, s.income)) * 80, 10, 100) : (debt.openOwe ? 45 : 70);
  const finance = Math.round(baseFinance * .72 + debtPressure * .28);
  const habits = habitMonthStats().percent;
  const goals = goalsStats().avg || 40;
  const ts = tasksStats();
  const tasksScore = clamp(100 - ts.overdue * 20 - Math.max(0, ts.open - 10) * 2);
  const st = stateStats();
  const condition = st.rows.length ? clamp(((st.energy + st.mood) / 2 * 10) - st.stress * 3) : 60;
  return {
    total: Math.round(finance*.34 + habits*.22 + goals*.18 + condition*.14 + tasksScore*.12),
    finance: Math.round(finance), debtPressure: Math.round(debtPressure), habits: Math.round(habits), goals: Math.round(goals), tasks: Math.round(tasksScore), condition: Math.round(condition)
  };
}
function lifeScoreCard() {
  const d = lifeScoreDetails();
  const rows = [
    ['Финансы', d.finance, 'доход / остаток / лимит'],
    ['Долговая нагрузка', d.debtPressure, 'давление долгов'],
    ['Привычки', d.habits, 'месячное выполнение'],
    ['Цели', d.goals, 'прогресс и действия'],
    ['Задачи', d.tasks, 'просрочки и объём'],
    ['Состояние', d.condition, 'энергия / настроение / стресс'],
  ];
  return `<div class="card score-detail-card"><div class="section-head"><div><h3>🧠 Расшифровка Life Score</h3><p class="sub">Понятно, что влияет на общую оценку.</p></div><span class="tag green">${d.total}/100</span></div>${rows.map(([n,v,sub])=>`<div class="score-row"><div><b>${n}</b><span>${sub}</span></div><div class="score-mini"><div class="progress"><span style="width:${clamp(v)}%"></span></div><b>${v}</b></div></div>`).join('')}</div>`;
}

function smartActions() {
  const items = [];
  const fd = financialDayStatus();
  const cleanup = monthCleanup(false);
  const debt = debtSummary();
  const t = tasksStats();
  const now = new Date();
  const hour = now.getHours();
  const importedNoCat = state.importRows.filter(r => r.selected && !r.duplicate && !r.category).length;
  const goalsNoAction = state.goals.filter(g => g.status !== 'Готово' && g.status !== 'Отменена' && !String(g.nextAction || '').trim()).length;
  if (fd.today || fd.overdue) items.push({ icon:'🏦', title: fd.overdue ? 'Закрыть финансовый день' : 'Сегодня финансовый день', text:'Проверь ЗП/аванс и внеси ручное распределение.', action:'manualAllocation', kind:'modal', tone:fd.overdue?'danger':'warn' });
  if (importedNoCat) items.push({ icon:'🏷', title:'Назначить категории', text:`В импорте ${importedNoCat} строк без категории.`, action:'bank', kind:'page', tone:'warn' });
  if (debt.dueSoon.length) items.push({ icon:'💳', title:'Проверить долги', text:`Ближайший срок: ${debt.dueSoon[0].due} · ${money(debt.dueSoon[0].remaining)}.`, action:'debts', kind:'page', tone:'danger' });
  if (t.overdue) items.push({ icon:'📌', title:'Разгрести просрочки', text:`Просрочено задач: ${t.overdue}. Начни с одной.`, action:'tasks', kind:'page', tone:'danger' });
  if (goalsNoAction) items.push({ icon:'🎯', title:'Добавить шаг к цели', text:`Целей без следующего действия: ${goalsNoAction}.`, action:'goals', kind:'page', tone:'warn' });
  if (cleanup.count) items.push({ icon:'🧹', title:'Чистка месяца', text:`Найдено замечаний: ${cleanup.count}.`, action:'monthCleanup', kind:'action', tone:'blue' });
  if (hour >= 19 && !state.states.some(x => x.date === todayKey())) items.push({ icon:'🌙', title:'Закрыть день', text:'Сон, энергия, настроение и короткий вывод.', action:'closeDay', kind:'modal', tone:'green' });
  if (!items.length) items.push({ icon:'✨', title:'Система спокойна', text:'Можно просто добавить расход или закрыть день.', action:'quickExpense', kind:'modal', tone:'green' });
  return items.slice(0, 6);
}
function smartActionsCard() {
  const items = smartActions();
  return `<div class="card smart-actions-card"><div class="section-head"><div><h3>⚡ Что сделать сейчас</h3><p class="sub">Приложение само поднимает то, что важно именно сейчас.</p></div><button class="soft-btn" data-action="monthCleanup">🧹 Проверить месяц</button></div><div class="smart-action-grid">${items.map(x=>`<button class="smart-action ${x.tone || ''}" ${x.kind==='page'?`data-page-jump="${x.action}"`:x.kind==='modal'?`data-open-modal="${x.action}"`:`data-action="${x.action}"`}><span>${x.icon}</span><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.text)}</small></button>`).join('')}</div></div>`;
}

function dashboard() {
  enhanceDelightState();
  const s = monthSummary();
  const h = habitMonthStats();
  const g = goalsStats();
  const t = tasksStats();
  const sc = lifeScore();
  const debt = debtSummary();
  const att = attentionItems();
  const cats = categoryTotals(`${state.settings.currentMonth}-01`, `${state.settings.currentMonth}-31`).slice(0,5);
  return `
    ${undoBar()}
    <div class="os-home">
      <section class="home-hero-pro card">
        <div>
          <div class="tiny-label">${new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</div>
          <h2>Финансы и жизнь в одном ритме</h2>
          <p class="sub">Система подсказывает действия, следит за долгами, категориями, задачами и состоянием. Твоя рутина — минимум кликов.</p>
          <div class="actions-row">
            <button class="primary-btn" data-open-modal="quickExpense">💸 Расход</button>
            <button class="soft-btn" data-open-modal="quickIncome">💰 Доход</button>
            <button class="soft-btn" data-action="openDebtModal">💳 Долг</button>
            <button class="soft-btn" data-open-modal="closeDay">🌙 Закрыть день</button>
          </div>
        </div>
        <div class="score-orbit">
          <div class="score-ring" style="--score:${sc}"><span>${sc}</span><small>Life Score</small></div>
          <div class="sub">${scoreText(sc)}</div>
        </div>
      </section>
      ${smartActionsCard()}
      <div class="grid cards" style="margin-top:16px">
        ${kpi('📆','Можно тратить сегодня', money(s.dailyLimit), `Остаток месяца: ${money(s.left)}`)}
        ${kpi('💳','Долги к возврату', money(debt.openOwe), `${debt.oweCount} активных`)}
        ${kpi('✅','Привычки', `${h.percent}%`, `${h.done} отметок за месяц`)}
        ${kpi('📌','Задачи', `${t.today} сегодня`, `${t.overdue} просрочено`)}
      </div>
      ${financialDayCard()}
      <div class="grid two" style="margin-top:16px">
        <div class="card"><h3>🔔 Центр внимания</h3>${att.length ? att.map(x => `<div class="attention-item ${x.tone || ''}"><b>${x.title}</b><span>${x.text}</span></div>`).join('') : empty('Система спокойна. Продолжай в том же ритме.')}</div>
        <div class="card"><h3>🎛 Категории месяца</h3>${cats.length ? cats.map(([name, amount]) => categoryBar(name, amount, s.expenses)).join('') : empty('Пока нет расходов за месяц')}</div>
      </div>
      <div class="grid two" style="margin-top:16px">${lifeScoreCard()}${financialCalendarCard()}</div>
      <div class="card" style="margin-top:16px">
        <div class="section-head"><div><h3>🧾 Последние операции</h3><p class="sub">Банковская лента по дням.</p></div><button class="soft-btn" data-page-jump="finance">Открыть журнал</button></div>
        ${bankingFeed([...state.operations].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,12), { compact:true })}
      </div>
    </div>`;
}

function financialCalendarItems(monthKey = state.settings.currentMonth) {
  const items = [];
  financialDays(monthKey).forEach(x => items.push({ date:x.date, icon:'🏦', title:`Финансовый день (${x.day})`, type:'money' }));
  debtSummary().active.forEach(d => { if (d.due && inMonth(d.due, monthKey)) items.push({ date:d.due, icon:'💳', title:`${d.direction === 'owe' ? 'Вернуть' : 'Получить'} ${money(d.remaining)}`, type:'debt' }); });
  state.tasks.filter(t => taskIsOpen(t) && t.due && inMonth(t.due, monthKey)).forEach(t => items.push({ date:t.due, icon:'📌', title:t.title, type:'task' }));
  state.recurring.filter(r => r.active !== false).forEach(r => { const d = recurringDateForMonth(r, monthKey); if (d) items.push({ date:d, icon:'🔁', title:r.title || r.category || 'Регулярный платёж', type:'recurring' }); });
  return items.sort((a,b)=>a.date.localeCompare(b.date));
}
function recurringDateForMonth(r, monthKey) {
  const day = Math.min(Number(r.day || 1), 28);
  if (!day) return '';
  return `${monthKey}-${String(day).padStart(2,'0')}`;
}
function financialCalendarCard() {
  const items = financialCalendarItems().slice(0, 9);
  return `<div class="card finance-calendar-card"><div class="section-head"><div><h3>🗓 Финансовый календарь</h3><p class="sub">ЗП/аванс, долги, регулярные платежи и задачи месяца.</p></div><button class="soft-btn" data-open-modal="recurringOperation">+ Регулярное</button></div>${items.length ? `<div class="mini-timeline">${items.map(i=>`<div class="timeline-item ${i.type}"><span>${i.date.slice(8,10)}</span><b>${i.icon} ${escapeHtml(i.title)}</b><small>${formatFeedDate(i.date)}</small></div>`).join('')}</div>` : empty('Пока нет важных дат')}</div>`;
}

function monthCleanup(showToast = true) {
  const month = state.settings.currentMonth;
  const issues = [];
  const monthOpsList = monthOps(month);
  const noCat = monthOpsList.filter(o => !o.category).length;
  const suspicious = findSuspiciousDuplicates(monthOpsList).length;
  const debtNoDue = debtItems().filter(d => d.status !== 'Закрыт' && !d.due).length;
  const goalNoNext = state.goals.filter(g => g.status !== 'Готово' && g.status !== 'Отменена' && !String(g.nextAction || '').trim()).length;
  const taskNoDue = state.tasks.filter(t => taskIsOpen(t) && !t.due).length;
  const statesThisMonth = state.states.filter(s => inMonth(s.date, month)).length;
  const [y,m] = month.split('-').map(Number);
  const passedDays = Math.min(new Date().getDate(), new Date(y, m, 0).getDate());
  if (noCat) issues.push(['Операции без категории', noCat, 'Назначить категории']);
  if (suspicious) issues.push(['Похожие операции / возможные дубли', suspicious, 'Проверить журнал']);
  if (debtNoDue) issues.push(['Долги без даты возврата', debtNoDue, 'Добавить срок']);
  if (goalNoNext) issues.push(['Цели без следующего шага', goalNoNext, 'Добавить действие']);
  if (taskNoDue) issues.push(['Задачи без даты', taskNoDue, 'Запланировать']);
  if (statesThisMonth < Math.max(1, Math.floor(passedDays * .35))) issues.push(['Мало закрытых дней', Math.max(0, passedDays - statesThisMonth), 'Закрывать день чаще']);
  const result = { issues, count: issues.reduce((s,x)=>s+x[1],0) };
  if (showToast) openMonthCleanupModal(result);
  return result;
}
function findSuspiciousDuplicates(list) {
  const seen = new Map(), dup = [];
  list.forEach(o => {
    const sig = `${o.date}|${o.type}|${Math.round(num(o.amount)*100)}|${normalizeNote(o.note || o.category)}`;
    if (seen.has(sig)) dup.push(o); else seen.set(sig, o.id);
  });
  return dup;
}
function openMonthCleanupModal(result = monthCleanup(false)) {
  openCustomModal('🧹 Чистка месяца', `<div class="cleanup-modal"><p class="sub">Быстрая проверка аккуратности данных за ${monthLabel(state.settings.currentMonth)}.</p>${result.issues.length ? `<div class="cleanup-list">${result.issues.map(([name,count,action])=>`<div><b>${escapeHtml(name)}</b><span>${count}</span><small>${escapeHtml(action)}</small></div>`).join('')}</div>` : empty('Всё аккуратно. Замечаний нет.')}</div><div class="actions-row"><button class="primary-btn" id="goCleanupFinance">Открыть деньги</button><button class="soft-btn" id="goCleanupGoals">Открыть цели</button></div>`);
  const f = document.getElementById('goCleanupFinance'); if (f) f.onclick = () => { closeModal(); activePage = 'finance'; render(); };
  const g = document.getElementById('goCleanupGoals'); if (g) g.onclick = () => { closeModal(); activePage = 'goals'; render(); };
}

function periodComparison(from, to) {
  const start = new Date(`${from}T00:00:00`), end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const days = Math.max(1, Math.round((end-start)/86400000)+1);
  const prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate()-1);
  const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate()-days+1);
  const pk = { from: toDateKey(prevStart), to: toDateKey(prevEnd) };
  const curOps = state.operations.filter(o => dateBetween(o.date, from, to));
  const prevOps = state.operations.filter(o => dateBetween(o.date, pk.from, pk.to));
  const sumBy = (ops, type) => total(ops.filter(o=>o.type===type));
  const curExpense = sumBy(curOps, 'expense'), prevExpense = sumBy(prevOps, 'expense');
  const curIncome = sumBy(curOps, 'income'), prevIncome = sumBy(prevOps, 'income');
  const diff = curExpense - prevExpense;
  return { days, prevFrom: pk.from, prevTo: pk.to, curExpense, prevExpense, curIncome, prevIncome, diff, pct: prevExpense ? Math.round(diff/prevExpense*100) : null };
}
function comparisonCard(from, to) {
  const c = periodComparison(from, to);
  if (!c) return '';
  const tone = c.diff > 0 ? 'danger' : c.diff < 0 ? 'green' : 'blue';
  return `<div class="card comparison-card"><h3>📊 Сравнение периодов</h3><p class="sub">Текущий период сравнен с предыдущими ${c.days} днями (${c.prevFrom} — ${c.prevTo}).</p><div class="grid cards"><div class="mini-kpi"><span>Расходы сейчас</span><b>${money(c.curExpense)}</b></div><div class="mini-kpi"><span>Расходы раньше</span><b>${money(c.prevExpense)}</b></div><div class="mini-kpi"><span>Разница</span><b class="${tone}-text">${c.diff>0?'+':''}${money(c.diff)}</b></div><div class="mini-kpi"><span>Изменение</span><b>${c.pct===null?'—':(c.pct>0?'+':'')+c.pct+'%'}</b></div></div></div>`;
}

function panel(opts = {}) {
  const search = opts.search || document.getElementById('globalSearch')?.value || '';
  const from = localStorage.getItem('panel.from') || `${state.settings.currentMonth}-01`;
  const to = localStorage.getItem('panel.to') || `${state.settings.currentMonth}-31`;
  const cats = categoryTotals(from, to);
  const ops = state.operations.filter(o => dateBetween(o.date, from, to) && (!search || JSON.stringify(o).toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date));
  return `${undoBar()}<div class="card"><h3>🎛 Панель управления</h3><p class="sub">Периоды, категории, сравнение и поиск старых операций.</p><div class="form-grid"><label>С даты<input id="panelFrom" type="date" value="${from}"></label><label>По дату<input id="panelTo" type="date" value="${to}"></label></div><div class="actions-row"><button class="primary-btn" data-action="applyPeriod">Показать период</button><button class="soft-btn" data-action="currentMonthPeriod">Текущий месяц</button><button class="soft-btn" data-open-modal="weeklyReport">📅 Собрать неделю</button><button class="soft-btn" data-action="createMonthlyReport">🏁 Итог месяца</button></div></div>
  <div style="margin-top:16px">${comparisonCard(from,to)}</div>
  <div class="grid two" style="margin-top:16px"><div class="card"><h3>Категории периода</h3>${cats.length ? cats.map(([n,a]) => categoryBar(n, a, total(cats.map(x => ({ amount: x[1] }))))).join('') : empty('Нет расходов')}</div><div class="card"><h3>Поиск операций</h3><input id="panelSearch" class="search" style="width:100%" placeholder="Например: кафе, ozon, такси" value="${escapeAttr(search)}"><div class="ledger-meta" style="margin-top:12px">Найдено операций: ${ops.length}</div><div style="margin-top:12px">${bankingFeed(ops.slice(0,80), { compact:true })}</div></div></div>`;
}

function buildMonthlyReport(monthKey = state.settings.currentMonth) {
  const s = monthSummary(monthKey);
  const cats = categoryTotals(`${monthKey}-01`, `${monthKey}-31`);
  const h = habitMonthStats(monthKey);
  const d = debtSummary();
  const bestCat = cats[0] || ['—', 0];
  const score = lifeScore();
  return {
    id: `report-${monthKey}`,
    month: monthKey,
    createdAt: new Date().toISOString(),
    income: s.income,
    expenses: s.expenses,
    allocations: s.allocations,
    left: s.left,
    bestCategory: bestCat[0],
    bestCategoryAmount: bestCat[1],
    habitsPercent: h.percent,
    openDebt: d.openOwe,
    lifeScore: score,
    conclusion: s.left >= 0 ? 'Месяц держится в плюсе. Продолжай ручное распределение и контроль долгов.' : 'Месяц ушёл в минус. Нужна чистка категорий и ограничение необязательных расходов.'
  };
}
function createMonthlyReport() {
  const r = buildMonthlyReport();
  pushUndo('создание месячного отчёта');
  state.reports = state.reports.filter(x => x.id !== r.id);
  state.reports.unshift(r);
  save();
  openCustomModal('🏁 Месячный отчёт', monthlyReportCard(r) + `<div class="actions-row"><button class="primary-btn" id="closeMonthlyReport">Готово</button></div>`);
  const btn = document.getElementById('closeMonthlyReport'); if (btn) btn.onclick = closeModal;
}
function monthlyReportCard(r) {
  return `<div class="month-report-card"><div class="tiny-label">${monthLabel(r.month)}</div><h2>${r.lifeScore}/100 · Итог месяца</h2><div class="grid cards"><div class="mini-kpi"><span>Доход</span><b>${money(r.income)}</b></div><div class="mini-kpi"><span>Расход</span><b>${money(r.expenses)}</b></div><div class="mini-kpi"><span>Отложено</span><b>${money(r.allocations)}</b></div><div class="mini-kpi"><span>Долги</span><b>${money(r.openDebt)}</b></div></div><p class="sub">Главная категория: <b>${escapeHtml(r.bestCategory)}</b> · ${money(r.bestCategoryAmount)}. Привычки: ${r.habitsPercent}%.</p><div class="attention-item green"><b>Вывод</b><span>${escapeHtml(r.conclusion)}</span></div></div>`;
}

function bankImport() {
  enhanceDelightState();
  const rows = state.importRows || [];
  const stats = bankImportStats(rows);
  const ready = rows.filter(r => r.selected && !r.duplicate && r.category).length;
  const notReady = rows.filter(r => r.selected && !r.category && !r.duplicate).length;
  return `${undoBar()}
  <div class="bank-hero">
    <div>
      <div class="tiny-label">Банк-импорт Pro</div>
      <h2>Загрузи выписку — система сама разберёт операции</h2>
      <p>Категории остаются под твоим контролем, но приложение подсказывает и запоминает правила.</p>
      <div class="actions-row">
        <label class="primary-btn bank-file-btn">📥 Выбрать CSV / Excel<input id="bankCsvFile" type="file" accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label>
        <button class="soft-btn" data-action="parseBankFile">Разобрать файл</button>
        <button class="soft-btn" data-action="clearBankImport">Очистить импорт</button>
      </div>
    </div>
    <div class="card bank-help-card"><h3>Логика</h3><p>1. Разобрал файл.</p><p>2. Назначил категории вручную или массово.</p><p>3. Подтвердил перенос.</p></div>
  </div>
  <div class="grid cards" style="margin-top:16px">
    ${kpi('📄','Строк в импорте', stats.total, 'разобрано из файла')}
    ${kpi('✅','Готово к переносу', ready, 'выбрано + категория')}
    ${kpi('🏷','Без категории', notReady, 'нужно назначить вручную')}
    ${kpi('🧯','Дубли', stats.duplicates, 'автоматически сняты')}
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-head"><div><h3>⚙️ Настройки и массовые действия</h3><p class="sub">Ускоряет разбор выписки, не забирая контроль.</p></div></div>
    <div class="form-grid">
      <label>Кодировка<select id="bankEncoding"><option value="auto">Авто</option><option value="utf-8">UTF-8</option><option value="windows-1251">Windows-1251</option></select></label>
      <label>Разделитель<select id="bankDelimiter"><option value="auto">Авто</option><option value=";">Точка с запятой ;</option><option value=",">Запятая ,</option><option value="tab">Tab</option></select></label>
      <label>Тип по умолчанию<select id="bankDefaultType"><option value="expense">Расход</option><option value="income">Доход</option></select></label>
      <label>Дубли<select id="bankDuplicateMode"><option value="skip">Не переносить</option><option value="allow">Разрешить вручную</option></select></label>
      <label>Массовая категория<select id="bulkCategory"><option value="">Выбери</option>${categoryOptions('expense')}</select></label>
      <label>Поиск похожих<input id="similarText" placeholder="например SAMOKAT / YOTA / FONBET"></label>
    </div>
    <div class="actions-row"><button class="soft-btn" data-action="applyBulkCategory">Назначить выбранным</button><button class="soft-btn" data-action="applySuggestionsAll">Применить все подсказки</button><button class="soft-btn" data-action="selectSimilarImport">Выбрать похожие</button><button class="soft-btn" data-action="rememberRulesForSelected">Запомнить правила</button></div>
  </div>
  <div class="card" style="margin-top:16px"><div class="section-head"><div><h3>🏷 Подготовка операций</h3><p class="sub">Выбери категории и перенеси готовые операции.</p></div><div class="actions-row" style="margin:0"><button class="soft-btn" data-action="selectBankRows">Выбрать готовые</button><button class="soft-btn" data-action="unselectBankRows">Снять выбор</button><button class="soft-btn" data-open-modal="addCategory">+ Категория</button><button class="primary-btn" data-action="transferBankRows">Перенести готовые</button></div></div>${bankImportTable(rows)}</div>`;
}

function applyBulkCategory() {
  const cat = document.getElementById('bulkCategory')?.value || '';
  if (!cat) return toast('Выбери массовую категорию');
  pushUndo('массовое назначение категории');
  let count = 0;
  state.importRows.forEach(r => { if (r.selected && !r.duplicate) { r.category = cat; count++; learnCategoryRule(r.note || '', cat, r.type || 'expense'); } });
  save(); render(); toast(`Категория применена: ${count}`);
}
function applySuggestionsAll() {
  pushUndo('применение подсказок категорий');
  let count = 0;
  state.importRows.forEach(r => { if (!r.category && !r.duplicate) { const s = categorySuggestion(r.note || '', r.type || 'expense'); if (s) { r.category = s; r.selected = true; count++; learnCategoryRule(r.note || '', s, r.type || 'expense'); } } });
  save(); render(); toast(`Подсказки применены: ${count}`);
}
function selectSimilarImport() {
  const q = normalizeMerchantText(document.getElementById('similarText')?.value || '');
  if (!q) return toast('Введи текст для поиска похожих');
  let count = 0;
  state.importRows.forEach(r => { const hit = normalizeMerchantText(r.note || '').includes(q); if (hit && !r.duplicate) { r.selected = true; count++; } });
  save(); render(); toast(`Выбрано похожих: ${count}`);
}
function rememberRulesForSelected() {
  let count = 0;
  state.importRows.forEach(r => { if (r.selected && r.category) { learnCategoryRule(r.note || '', r.category, r.type || 'expense'); count++; } });
  save(); render(); toast(`Правил обновлено: ${count}`);
}

function bankImportTable(rows) {
  if (!rows.length) return empty('Пока нет загруженной выписки. Загрузи CSV или Excel-файл банка, и здесь появятся операции для проверки.');
  const visible = rows.slice(0, 600);
  return table(['✓','Статус','Дата','Тип','Сумма','Категория','Подсказка','Описание'], visible.map(r => {
    const suggestion = categorySuggestion(r.note || '', r.type || 'expense');
    const status = r.duplicate ? '<span class="tag danger">Дубль</span>' : (r.category ? '<span class="tag green">Готово</span>' : '<span class="tag warn">Категория</span>');
    return [
      `<input type="checkbox" data-import-sel="${r.id}" ${r.selected ? 'checked' : ''}>`,
      status,
      `<input class="mini-input" type="date" data-import-date="${r.id}" value="${escapeAttr(r.date || todayKey())}">`,
      `<select class="mini-input" data-import-type="${r.id}"><option value="expense" ${r.type==='expense'?'selected':''}>Расход</option><option value="income" ${r.type==='income'?'selected':''}>Доход</option></select>`,
      money(r.amount),
      `<select class="mini-input" data-import-cat="${r.id}"><option value="">Выбери</option>${categoryOptions(r.type || 'expense', r.category || '')}</select>`,
      suggestion && !r.category ? `<button class="soft-btn mini-soft" data-apply-suggestion="${r.id}" data-suggest-cat="${escapeAttr(suggestion)}">${categoryChip(suggestion)} применить</button>` : (r.category ? '<span class="tag green">Выбрано</span>' : '<span class="sub">нет</span>'),
      `<div class="import-note">${escapeHtml(r.note || '')}</div>`
    ];
  }));
}

function taskCard(t) {
  const goal = state.goals.find(g => g.id === t.goalId);
  const danger = taskIsOpen(t) && t.due && t.due < todayKey();
  const added = t.calendarAdded ? '<span class="tag green">В календаре</span>' : '';
  const calUrl = buildGoogleCalendarUrl(t);
  return `<article class="task-card ${danger ? 'danger-zone' : ''}">
    <div class="task-main"><div class="task-title">${escapeHtml(t.title || 'Без названия')}</div><div class="task-meta">${t.due ? `<span class="tag ${danger ? 'danger' : 'blue'}">${formatTaskDate(t)}</span>` : '<span class="tag warn">Без даты</span>'}<span class="tag">${escapeHtml(t.priority || 'Средний')}</span>${goal ? `<span class="tag green">${escapeHtml(goal.title)}</span>` : ''}${added}</div>${t.nextAction ? `<p class="sub">Следующий шаг: ${escapeHtml(t.nextAction)}</p>` : ''}</div>
    <div class="task-actions"><a class="soft-btn" href="${calUrl}" target="_blank" rel="noopener" data-calendar-task="${t.id}">📅 В календарь</a><button class="soft-btn" data-edit-task="${t.id}">Редактировать</button><button class="ghost-btn" data-toggle-task="${t.id}">${t.status === 'Готово' ? 'Вернуть' : 'Готово'}</button></div>
  </article>`;
}
function openEditTaskModal(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  const areaOptions = state.settings.areas.map(c=>`<option ${t.area===c?'selected':''}>${c}</option>`).join('');
  const goalOptions = ['<option value="">Без цели</option>', ...state.goals.filter(g=>g.status!=='Готово'&&g.status!=='Отменена').map(g=>`<option value="${g.id}" ${t.goalId===g.id?'selected':''}>${escapeHtml(g.title)}</option>`)].join('');
  openCustomModal('✏️ Редактировать задачу', `<div class="form-grid"><label class="full">Задача<input id="editTaskTitle" value="${escapeAttr(t.title || '')}"></label><label>Сфера<select id="editTaskArea">${areaOptions}</select></label><label>Цель<select id="editTaskGoal">${goalOptions}</select></label><label>Дедлайн<input id="editTaskDue" type="date" value="${escapeAttr(t.due || '')}"></label><label>Время<input id="editTaskTime" type="time" value="${escapeAttr(t.time || '09:00')}"></label><label>Длительность, мин<input id="editTaskDuration" type="number" value="${escapeAttr(t.duration || 30)}"></label><label>Приоритет<select id="editTaskPriority"><option ${t.priority==='Средний'?'selected':''}>Средний</option><option ${t.priority==='Высокий'?'selected':''}>Высокий</option><option ${t.priority==='Низкий'?'selected':''}>Низкий</option></select></label><label>Статус<select id="editTaskStatus"><option ${t.status==='В работе'?'selected':''}>В работе</option><option ${t.status==='Готово'?'selected':''}>Готово</option><option ${t.status==='Отменена'?'selected':''}>Отменена</option></select></label><label class="full">Следующий шаг<input id="editTaskNext" value="${escapeAttr(t.nextAction || '')}"></label></div><div class="actions-row"><button class="primary-btn" id="saveEditTaskBtn">Сохранить</button><button class="danger-btn" id="deleteEditTaskBtn">Удалить</button></div>`);
  const saveBtn = document.getElementById('saveEditTaskBtn'); if (saveBtn) saveBtn.onclick = () => saveEditedTask(id);
  const delBtn = document.getElementById('deleteEditTaskBtn'); if (delBtn) delBtn.onclick = () => { if(confirm('Удалить задачу?')) { pushUndo('удаление задачи'); state.tasks = state.tasks.filter(x=>x.id!==id); save(); closeModal(); render(); toast('Задача удалена'); } };
}
function saveEditedTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  pushUndo('редактирование задачи');
  t.title = val('editTaskTitle') || t.title;
  t.area = val('editTaskArea') || t.area;
  t.goalId = val('editTaskGoal') || '';
  t.due = val('editTaskDue') || '';
  t.time = val('editTaskTime') || '';
  t.duration = num(val('editTaskDuration')) || 30;
  t.priority = val('editTaskPriority') || 'Средний';
  t.status = val('editTaskStatus') || 'В работе';
  t.nextAction = val('editTaskNext') || '';
  t.calendarAdded = false;
  save(); closeModal(); render(); toast('Задача обновлена');
}

function deleteOperation(id) {
  const op = state.operations.find(o => o.id === id);
  if (!op) return;
  const msg = `Удалить операцию: ${operationLabel(op)}?`;
  if (!confirm(msg)) return;
  pushUndo('удаление операции');
  lastDeletedOperation = { ...op, deletedAt: new Date().toISOString() };
  state.operations = state.operations.filter(o => o.id !== id);
  save(); render(); toast('Операция удалена. Можно отменить действие.');
}
function transferBankRows() {
  const duplicateMode = document.getElementById('bankDuplicateMode')?.value || 'skip';
  const ready = state.importRows.filter(r => r.selected && r.category && (duplicateMode === 'allow' || !r.duplicate));
  if (!ready.length) return toast('Нет готовых строк: выбери операции и назначь категории');
  pushUndo('перенос банковского импорта');
  ready.forEach(r => { learnCategoryRule(r.note || '', r.category, r.type || 'expense'); state.operations.push({ id: uid(), date: r.date, type: r.type || 'expense', amount: Math.abs(num(r.amount)), category: r.category, note: r.note || 'Импорт банка', emotion: r.source === 'bank-excel' ? 'Банк Excel' : 'Банк CSV', importedAt: new Date().toISOString(), importSource: r.source || 'bank-import' }); });
  const ids = new Set(ready.map(r => r.id));
  state.importRows = state.importRows.filter(r => !ids.has(r.id));
  save(); render(); toast(`Перенесено операций: ${ready.length}`);
}

function openCustomModal(title, body) {
  document.getElementById('modalRoot').innerHTML = `<div class="modal-backdrop"><div class="modal"><header><h3>${title}</h3><button class="ghost-btn" data-close-modal>✕</button></header>${body}</div></div>`;
  const close = document.querySelector('[data-close-modal]'); if (close) close.onclick = closeModal;
}

function modalContent(type) {
  const expenseCatOptions = categoryOptions('expense');
  const incomeCatOptions = categoryOptions('income');
  const areaOptions = state.settings.areas.map(c=>`<option>${c}</option>`).join('');
  const goalOptions = ['<option value="">Без цели</option>', ...state.goals.filter(g=>g.status!=='Готово'&&g.status!=='Отменена').map(g=>`<option value="${g.id}">${escapeHtml(g.title)}</option>`)].join('');
  if (type === 'recurringOperation') return { title:'🔁 Регулярная операция', body:`<div class="form-grid"><label>Название<input id="rTitle" placeholder="Интернет, подписка, кредит"></label><label>Тип<select id="rType"><option value="expense">Расход</option><option value="income">Доход</option></select></label><label>Сумма<input id="rAmount" type="number" placeholder="0"></label><label>День месяца<input id="rDay" type="number" min="1" max="28" value="1"></label><label>Категория<select id="rCategory">${expenseCatOptions}</select></label><label class="full">Комментарий<input id="rNote" placeholder="Будет отображаться в финансовом календаре"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="recurring">Сохранить</button></div>` };
  if (type === 'quickExpense') return { title:'💸 Добавить расход', body:`<div class="form-grid"><label>Дата<input id="mDate" type="date" value="${todayKey()}"></label><label>Сумма<input id="mAmount" type="number" placeholder="0"></label><label>Категория<select id="mCategory">${expenseCatOptions}</select></label><label>Эмоция<select id="mEmotion"><option>Нейтрально</option><option>Нужно</option><option>Стресс</option><option>Импульс</option><option>Радость</option></select></label><label class="full">Комментарий<input id="mNote" placeholder="Например: кофе, продукты, такси"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="expense">Добавить</button></div>` };
  if (type === 'quickIncome') return { title:'💰 Добавить доход', body:`<div class="form-grid"><label>Дата<input id="mDate" type="date" value="${todayKey()}"></label><label>Сумма<input id="mAmount" type="number" placeholder="0"></label><label>Категория<select id="mCategory">${incomeCatOptions}</select></label><label>Вернуть до, если это долг<input id="mDebtDue" type="date"></label><label class="full">Источник / кто дал / комментарий<input id="mNote" placeholder="Зарплата, аванс, кредит, кто дал в долг"></label></div><div class="calendar-note">Если выберешь «Кредитные средства» или «Взял в долг» и укажешь дату возврата, система сама создаст задачу.</div><div class="actions-row"><button class="primary-btn" data-modal-save="income">Добавить доход</button></div>` };
  if (type === 'quickTask') return { title:'📌 Добавить задачу', body:`<div class="form-grid"><label class="full">Задача<input id="tTitle" placeholder="Что сделать?"></label><label>Сфера<select id="tArea">${areaOptions}</select></label><label>Цель<select id="tGoal">${goalOptions}</select></label><label>Дедлайн<input id="tDue" type="date"></label><label>Время<input id="tTime" type="time" value="09:00"></label><label>Длительность, мин<input id="tDuration" type="number" value="30"></label><label>Напоминание<select id="tReminder"><option>В Google Calendar</option><option>За 10 минут</option><option>За 30 минут</option><option>За 1 час</option></select></label><label>Приоритет<select id="tPriority"><option>Средний</option><option>Высокий</option><option>Низкий</option></select></label><label class="full">Следующий шаг<input id="tNext" placeholder="Самое маленькое действие"></label></div><div class="calendar-note">После добавления нажми «📅 В календарь» — Google Calendar даст уведомления.</div><div class="actions-row"><button class="primary-btn" data-modal-save="task">Добавить</button></div>` };
  if (type === 'quickGoal') return { title:'🎯 SMART-цель', body:`<div class="form-grid"><label class="full">Название цели<input id="gTitle" placeholder="Например: накопить 150 000 ₽"></label><label>Сфера<select id="gArea">${areaOptions}</select></label><label>Метрика<input id="gMetric" placeholder="₽, тренировки, часы"></label><label>Цель в цифре<input id="gTarget" type="number" placeholder="150000"></label><label>Текущее значение<input id="gCurrent" type="number" placeholder="0"></label><label>Дедлайн<input id="gDeadline" type="date"></label><label class="full">Почему важно<textarea id="gWhy" placeholder="Зачем мне эта цель?"></textarea></label><label class="full">Следующий шаг<input id="gNext" placeholder="Первое действие"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="goal">Добавить цель</button></div>` };
  if (type === 'addHabit') return { title:'✅ Новая привычка', body:`<div class="form-grid"><label class="full">Название<input id="hName" placeholder="Например: 20 минут ходьбы"></label><label>Сфера<select id="hArea">${areaOptions}</select></label><label>Цель раз в неделю<input id="hTarget" type="number" value="5"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="habit">Добавить</button></div>` };
  if (type === 'closeDay') return { title:'🌙 Закрыть день', body:`<div class="form-grid"><label>Дата<input id="dDate" type="date" value="${todayKey()}"></label><label>Сон, часов<input id="dSleep" type="number" step="0.5" value="7"></label><label>Энергия 1–10<input id="dEnergy" type="number" min="1" max="10" value="7"></label><label>Настроение 1–10<input id="dMood" type="number" min="1" max="10" value="7"></label><label>Стресс 1–10<input id="dStress" type="number" min="1" max="10" value="4"></label><label class="full">Итог дня<textarea id="dNote" placeholder="Что получилось? Что понял?"></textarea></label></div><h3 style="margin-top:18px">Привычки</h3><div class="checkbox-grid">${state.habits.filter(h=>h.active).map(h=>`<label class="check-card"><span>${escapeHtml(h.name)}</span><input type="checkbox" data-day-habit="${h.id}"></label>`).join('')}</div><div class="actions-row"><button class="primary-btn" data-modal-save="day">Закрыть день</button></div>` };
  if (type === 'wantBuy') return { title:'🛒 Хочу купить', body:`<div class="form-grid"><label class="full">Что купить<input id="bName" placeholder="Например: кроссовки"></label><label>Сумма<input id="bAmount" type="number" placeholder="0"></label><label>Категория<select id="bCategory">${expenseCatOptions}</select></label><label>Эмоция<select id="bEmotion"><option>Нужно</option><option>Хочу</option><option>Стресс</option><option>Импульс</option></select></label></div><div id="buyResult" class="empty" style="margin-top:14px">Заполни сумму, и система оценит покупку.</div><div class="actions-row"><button class="soft-btn" data-modal-action="checkBuy">Проверить</button><button class="primary-btn" data-modal-save="buyExpense">Купить и записать</button></div>` };
  if (type === 'manualAllocation') { const fd = financialDayStatus().active?.date || `${state.settings.currentMonth}-10`; return { title:'🏦 Ручное распределение денег', body:`<div class="form-grid"><label>Дата<input id="aDate" type="date" value="${fd}"></label><label>Сбережения<input id="aSavings" type="number" placeholder="0"></label><label>Подушка<input id="aCushion" type="number" placeholder="0"></label><label>Финансовая цель<input id="aGoal" type="number" placeholder="0"></label><label class="full">Комментарий<input id="aNote" placeholder="Например: распределение зарплаты/аванса"></label></div><div class="calendar-note">Автоматических списаний нет. Эти суммы будут записаны как ручные финансовые переводы.</div><div class="actions-row"><button class="primary-btn" data-modal-save="manualAllocation">Записать распределение</button></div>` }; }
  if (type === 'addCategory') return { title:'🏷 Добавить категорию', body:`<div class="form-grid"><label>Тип<select id="catType"><option value="expense">Расход</option><option value="income">Доход</option></select></label><label class="full">Название категории<input id="catName" placeholder="Например: Маркетплейсы / Зарплата / Возврат"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="category">Добавить категорию</button></div>` };
  if (type === 'weeklyReport') return { title:'📅 Недельный отчёт', body:`<div class="empty">Собрать отчёт за последние 7 дней?</div><div class="actions-row"><button class="primary-btn" data-modal-save="week">Собрать</button></div>` };
  if (type === 'csvImport') return { title:'🏦 Банк-импорт', body:`<p class="sub">Лучше открыть полноценный экран банка: там есть дубли, кодировки и категории.</p><div class="actions-row"><button class="primary-btn" data-modal-action="goBankImport">Открыть банк-импорт</button></div>` };
  return { title:'Окно', body:'' };
}

function saveModal(kind) {
  if (kind === 'expense' || kind === 'income') {
    const amount = num(document.getElementById('mAmount').value);
    if (!amount) return toast('Введи сумму');
    pushUndo(kind === 'income' ? 'добавление дохода' : 'добавление расхода');
    const category = document.getElementById('mCategory')?.value || 'Другое';
    const note = document.getElementById('mNote')?.value || '';
    const op = { id: uid(), date: document.getElementById('mDate').value || todayKey(), type: kind, amount, category, note, emotion: document.getElementById('mEmotion')?.value || '' };
    if (kind === 'income') {
      const debtDue = document.getElementById('mDebtDue')?.value || '';
      if (debtDue) op.debtDue = debtDue;
      if (LOAN_INCOME_CATEGORIES.includes(category) && debtDue) state.tasks.push({ id: uid(), title: `Вернуть ${money(amount)}${note ? ' — ' + note : ''}`, area: 'Финансы', due: debtDue, time: '10:00', duration: 30, reminder: 'В Google Calendar', priority: 'Высокий', status: 'В работе', nextAction: 'Вернуть заемные средства', linkedOperationId: op.id });
    }
    state.operations.push(op); save(); closeModal(); render(); toast('Операция добавлена');
  }
  if (kind === 'task') { pushUndo('добавление задачи'); state.tasks.push({ id: uid(), title: val('tTitle'), area: val('tArea'), goalId: val('tGoal'), due: val('tDue'), time: val('tTime'), duration: num(val('tDuration')) || 30, reminder: val('tReminder'), priority: val('tPriority'), status: 'В работе', nextAction: val('tNext'), calendarAdded: false }); save(); closeModal(); render(); toast('Задача добавлена'); }
  if (kind === 'goal') { pushUndo('добавление цели'); state.goals.push({ id: uid(), title: val('gTitle'), area: val('gArea'), metric: val('gMetric'), targetValue: num(val('gTarget')), currentValue: num(val('gCurrent')), deadline: val('gDeadline'), why: val('gWhy'), nextAction: val('gNext'), status:'В работе' }); save(); closeModal(); render(); toast('Цель добавлена'); }
  if (kind === 'habit') { pushUndo('добавление привычки'); state.habits.push({ id: uid(), name: val('hName'), area: val('hArea'), targetPerWeek: num(val('hTarget')) || 5, active: true }); save(); closeModal(); render(); toast('Привычка добавлена'); }
  if (kind === 'day') { pushUndo('закрытие дня'); const date = val('dDate') || todayKey(); state.states = state.states.filter(s => s.date !== date); state.states.push({ date, sleep:num(val('dSleep')), energy:num(val('dEnergy')), mood:num(val('dMood')), stress:num(val('dStress')), note:val('dNote') }); state.habitLogs[date] = state.habitLogs[date] || {}; document.querySelectorAll('[data-day-habit]').forEach(ch => state.habitLogs[date][ch.dataset.dayHabit] = ch.checked); save(); closeModal(); render(); toast('День закрыт'); }
  if (kind === 'buyExpense') { pushUndo('покупка'); state.operations.push({ id: uid(), date: todayKey(), type:'expense', amount:num(val('bAmount')), category:val('bCategory'), note:val('bName'), emotion:val('bEmotion') }); save(); closeModal(); render(); }
  if (kind === 'manualAllocation') { pushUndo('ручное распределение денег'); const date = val('aDate') || todayKey(); const note = val('aNote') || 'Ручное распределение'; const entries = [['Сбережения', num(val('aSavings'))], ['Подушка', num(val('aCushion'))], ['Финансовая цель', num(val('aGoal'))]].filter(x => x[1] > 0); if (!entries.length) return toast('Введи хотя бы одну сумму'); entries.forEach(([category, amount]) => state.operations.push({ id: uid(), date, type: 'expense', amount, category, note, emotion: 'Распределение', manualAllocation: true, allocationKind: 'manual', source: 'manualAllocation', manualAllocationAt: new Date().toISOString() })); save(); closeModal(); render(); toast('Распределение записано'); }
  if (kind === 'category') { const type = val('catType') || 'expense'; const name = val('catName'); if (!name) return toast('Введи название категории'); pushUndo('добавление категории'); addCategory(type, name); save(); closeModal(); render(); toast('Категория добавлена'); }
  if (kind === 'week') { pushUndo('недельный отчёт'); createWeekReport(); closeModal(); render(); }
  if (kind === 'recurring') { pushUndo('регулярная операция'); state.recurring.push({ id: uid(), title: val('rTitle'), type: val('rType') || 'expense', amount: num(val('rAmount')), day: num(val('rDay')) || 1, category: val('rCategory') || 'Регулярные платежи', note: val('rNote'), active: true }); save(); closeModal(); render(); toast('Регулярная операция добавлена'); }
}

function bindView() {
  document.querySelectorAll('[data-page-jump]').forEach(b => b.onclick = () => { activePage = b.dataset.pageJump; render(); });
  document.querySelectorAll('[data-open-modal]').forEach(b => b.onclick = () => openModal(b.dataset.openModal));
  document.querySelectorAll('[data-delete-op]').forEach(b => b.onclick = () => deleteOperation(b.dataset.deleteOp));
  document.querySelectorAll('[data-delete-category]').forEach(b => b.onclick = () => { const type = b.dataset.deleteCategory; const name = b.dataset.categoryName; if (!confirm(`Удалить категорию «${name}» из списка? Старые операции останутся как есть.`)) return; pushUndo('удаление категории'); removeCategory(type, name); save(); render(); toast('Категория удалена из списка'); });
  document.querySelectorAll('[data-delete-goal]').forEach(b => b.onclick = () => { const g = state.goals.find(x=>x.id===b.dataset.deleteGoal); if(g) { pushUndo('скрытие цели'); g.status = 'Отменена'; save(); render(); } });
  document.querySelectorAll('[data-hide-habit]').forEach(b => b.onclick = () => { const h = state.habits.find(x=>x.id===b.dataset.hideHabit); if(h) { pushUndo('скрытие привычки'); h.active = false; save(); render(); } });
  document.querySelectorAll('[data-toggle-task]').forEach(b => b.onclick = () => { const t = state.tasks.find(x=>x.id===b.dataset.toggleTask); if(t) { pushUndo('изменение статуса задачи'); t.status = t.status === 'Готово' ? 'В работе' : 'Готово'; save(); render(); } });
  document.querySelectorAll('[data-edit-task]').forEach(b => b.onclick = () => openEditTaskModal(b.dataset.editTask));
  document.querySelectorAll('[data-calendar-task]').forEach(a => a.onclick = () => { const t = state.tasks.find(x=>x.id===a.dataset.calendarTask); if(t) { t.calendarAdded = true; t.calendarLink = buildGoogleCalendarUrl(t); save(); setTimeout(render, 500); } });
  bindFinanceControls();
  document.querySelectorAll('[data-habit]').forEach(ch => ch.onchange = () => { pushUndo('отметка привычки'); const key = todayKey(); state.habitLogs[key] = state.habitLogs[key] || {}; state.habitLogs[key][ch.dataset.habit] = ch.checked; save(); toast('Привычка обновлена'); });
  document.querySelectorAll('[data-action]').forEach(b => b.onclick = actionHandler);
  const panelSearch = document.getElementById('panelSearch'); if (panelSearch) panelSearch.oninput = (e) => { document.getElementById('globalSearch').value = e.target.value; render({ search: e.target.value }); };
  const backupInput = document.getElementById('backupInput'); if (backupInput) backupInput.onchange = importBackup;
  const bankFile = document.getElementById('bankCsvFile'); if (bankFile) bankFile.onchange = () => toast('Файл выбран. Нажми «Разобрать файл»');
  bindImportControls();
}

function actionHandler(e) {
  const a = e.currentTarget.dataset.action;
  if (a === 'applyPeriod') { localStorage.setItem('panel.from', document.getElementById('panelFrom').value); localStorage.setItem('panel.to', document.getElementById('panelTo').value); render(); }
  if (a === 'currentMonthPeriod') { localStorage.setItem('panel.from', `${state.settings.currentMonth}-01`); localStorage.setItem('panel.to', `${state.settings.currentMonth}-31`); render(); }
  if (a === 'financePrev') { financeView.page = Math.max(1, (financeView.page || 1) - 1); render(); }
  if (a === 'financeNext') { financeView.page = (financeView.page || 1) + 1; render(); }
  if (a === 'parseBankFile') parseBankFile();
  if (a === 'transferBankRows') transferBankRows();
  if (a === 'clearBankImport') { pushUndo('очистка импорта'); clearBankImport(); }
  if (a === 'selectBankRows') selectBankRows();
  if (a === 'unselectBankRows') unselectBankRows();
  if (a === 'applyBulkCategory') applyBulkCategory();
  if (a === 'applySuggestionsAll') applySuggestionsAll();
  if (a === 'selectSimilarImport') selectSimilarImport();
  if (a === 'rememberRulesForSelected') rememberRulesForSelected();
  if (a === 'undoDeleteOp') undoLastDelete();
  if (a === 'undoLastAction') undoLastAction();
  if (a === 'saveSettings') saveSettings();
  if (a === 'backup') exportBackup();
  if (a === 'resetAll') { if(confirm('Точно очистить все данные?')) { pushUndo('полная очистка'); state = defaultData(); enhanceDelightState(); save(); render(); } }
  if (a === 'repair') { enhanceDelightState(); save(); toast('Система проверена и мигрирована'); render(); }
  if (a === 'cloudRegister') cloudRegister();
  if (a === 'cloudLogin') cloudLogin();
  if (a === 'cloudLogout') window.SecondBrainCloud?.logout();
  if (a === 'cloudPush') window.SecondBrainCloud?.pushNow(state);
  if (a === 'cloudPull') window.SecondBrainCloud?.pullNow();
  if (a === 'cloudRefresh') { window.SecondBrainCloud?.refreshStatus(); render(); }
  if (a === 'antiChaos') openAntiChaos();
  if (a === 'fabQuick') openModal('quickExpense');
  if (a === 'openDebtModal') openDebtModal();
  if (a === 'repayDebt') openRepayDebtModal(e.currentTarget.dataset.debtId);
  if (a === 'setTheme') { state.settings.theme = e.currentTarget.dataset.themeValue || 'latte'; save(); render(); }
  if (a === 'resetCategoryRules') { if(confirm('Сбросить все обученные правила категорий?')) { pushUndo('сброс правил категорий'); state.settings.categoryRules = []; save(); render(); toast('Правила категорий сброшены'); } }
  if (a === 'monthCleanup') monthCleanup(true);
  if (a === 'createMonthlyReport') createMonthlyReport();
}




/* =========================
   GOALS GAME & FORECAST PACK
   ========================= */

function enhanceGoalGameState() {
  enhanceDelightState();
  state.goalNotes = Array.isArray(state.goalNotes) ? state.goalNotes : [];
  state.insightReports = Array.isArray(state.insightReports) ? state.insightReports : [];
  state.plannedExpenses = Array.isArray(state.plannedExpenses) ? state.plannedExpenses : [];
  state.rewardLedger = Array.isArray(state.rewardLedger) ? state.rewardLedger : [];
  state.rewards = state.rewards || { points: 0, rubPerPoint: 100, spent: 0 };
  state.rewards.points = Number(state.rewards.points || 0);
  state.rewards.rubPerPoint = Number(state.rewards.rubPerPoint || 100);
  state.rewards.spent = Number(state.rewards.spent || 0);
  state.settings.expenseCategories = uniqueClean([...(state.settings.expenseCategories || []), 'Запланированные расходы','Обязательные платежи','Бонус себе']);
  state.goals.forEach(g => {
    g.status = g.status || 'В работе';
    g.notes = g.notes || '';
    g.rewardPoints = Number(g.rewardPoints || 0);
  });
}

enhanceGoalGameState();

function rewardBalance() {
  enhanceGoalGameState();
  const earned = state.rewardLedger.filter(x => x.type !== 'spend').reduce((s,x)=>s+num(x.points),0);
  const spentPts = state.rewardLedger.filter(x => x.type === 'spend').reduce((s,x)=>s+num(x.points),0);
  state.rewards.points = Math.max(0, earned - spentPts);
  state.rewards.spent = spentPts;
  return { points: state.rewards.points, rub: state.rewards.points * (state.rewards.rubPerPoint || 100), earned, spentPts };
}
function addReward(points, reason, sourceId = '') {
  points = Number(points || 0);
  if (!points) return;
  enhanceGoalGameState();
  if (sourceId && state.rewardLedger.some(x => x.sourceId === sourceId && x.reason === reason)) return;
  state.rewardLedger.unshift({ id: uid(), date: todayKey(), points, reason, sourceId, type: 'earn', createdAt: new Date().toISOString() });
  state.rewardLedger = state.rewardLedger.slice(0, 500);
  rewardBalance();
}
function spendReward(points, note) {
  points = Number(points || 0);
  const bal = rewardBalance();
  if (!points || points > bal.points) return toast('Недостаточно бонусов');
  pushUndo('списание бонусов');
  state.rewardLedger.unshift({ id: uid(), date: todayKey(), points, reason: note || 'Бонус себе', type:'spend', createdAt: new Date().toISOString() });
  state.operations.push({ id: uid(), date: todayKey(), type:'expense', amount: points * (state.rewards.rubPerPoint || 100), category:'Бонус себе', note: note || 'Материальная награда за прогресс', emotion:'Награда' });
  rewardBalance(); save(); closeModal(); render(); toast('Бонус списан и добавлен как расход');
}
function rewardsCard() {
  const b = rewardBalance();
  return `<div class="card rewards-card"><div class="section-head"><div><h3>🎮 Бонусы за прогресс</h3><p class="sub">Выполняешь действия по целям, закрываешь дни и долги — копишь баллы. Баллы можно конвертировать в сумму на себя.</p></div><span class="tag green">${b.points} баллов</span></div><div class="reward-hero"><div><div class="metric">${money(b.rub)}</div><p class="sub">Доступно на себя · курс ${money(state.rewards.rubPerPoint || 100)} за 1 балл</p></div><div class="actions-row"><button class="primary-btn" data-open-modal="spendReward">Потратить на себя</button><button class="soft-btn" data-open-modal="rewardSettings">Настроить курс</button></div></div>${state.rewardLedger.length ? `<div class="reward-log">${state.rewardLedger.slice(0,6).map(r=>`<div><span>${r.type==='spend'?'−':'+'}${r.points}</span><b>${escapeHtml(r.reason)}</b><small>${r.date}</small></div>`).join('')}</div>` : empty('Бонусы появятся после выполнения задач и закрытия дней.')}</div>`;
}

function goalTasks(goalId) { return state.tasks.filter(t => t.goalId === goalId && t.status !== 'Отменена'); }
function goalNotes(goalId) { return (state.goalNotes || []).filter(n => n.goalId === goalId).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))); }
function goalProgressDetails(goal) {
  const tasks = goalTasks(goal.id);
  const doneTasks = tasks.filter(t => t.status === 'Готово').length;
  const taskPct = tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0;
  const metricPct = num(goal.targetValue) ? Math.round(clamp(num(goal.currentValue) / Math.max(1, num(goal.targetValue)) * 100)) : null;
  let pct = metricPct === null ? taskPct : (tasks.length ? Math.round(metricPct * .65 + taskPct * .35) : metricPct);
  pct = clamp(pct);
  const missing = [];
  if (!tasks.length) missing.push('нет задач');
  if (!String(goal.nextAction || '').trim()) missing.push('нет следующего действия');
  if (!goal.deadline) missing.push('нет срока');
  return { pct, taskPct, metricPct, tasks: tasks.length, doneTasks, missing };
}
function smartGoalSuggestions(goal) {
  const title = goal.title || 'цель';
  const due = goal.deadline || '';
  const area = goal.area || 'Личное';
  const base = [
    `Сформулировать результат по цели «${title}» в 1 строку`,
    `Разбить цель «${title}» на 3 маленьких шага`,
    `Сделать первое действие по цели «${title}»`,
    `Проверить прогресс цели «${title}»`,
    `Записать следующий шаг по цели «${title}»`
  ];
  if (area === 'Финансы' || /долг|накоп|день|фин|кредит/i.test(title)) {
    base.splice(2,0,`Запланировать сумму/платёж по цели «${title}»`);
  }
  if (area === 'Здоровье') base.splice(2,0,`Назначить минимальное действие на 15 минут по цели «${title}»`);
  return base.slice(0,6).map((x,i)=>({ title:x, due: due || toDateKey(new Date(Date.now() + (i+1)*86400000)), area }));
}

function goalsStats() {
  const active = state.goals.filter(g => g.status !== 'Готово' && g.status !== 'Отменена');
  const avg = active.length ? Math.round(active.reduce((s,g)=>s+goalProgressDetails(g).pct,0)/active.length) : 0;
  return { active: active.length, avg, done: state.goals.filter(g=>g.status==='Готово').length };
}

function goals() {
  enhanceGoalGameState();
  const active = state.goals.filter(g => g.status !== 'Готово' && g.status !== 'Отменена');
  const done = state.goals.filter(g => g.status === 'Готово');
  const needs = active.filter(g => goalProgressDetails(g).missing.length);
  return `${undoBar()}<div class="goals-pro-layout">
    <div class="grid cards">${kpi('🎯','Активные цели', active.length, `${goalsStats().avg}% средний прогресс`)}${kpi('🪜','Действия по целям', state.tasks.filter(t=>t.goalId && t.status!=='Отменена').length, 'задачи привязаны к целям')}${kpi('⚠️','Требуют внимания', needs.length, 'нет задачи/шага/срока')}${kpi('🏁','Закрыто', done.length, 'целей')}</div>
    <div style="margin-top:16px">${rewardsCard()}</div>
    <div class="card" style="margin-top:16px"><div class="section-head"><div><h3>🎯 SMART-цели</h3><p class="sub">Цель не должна жить одна: у неё должны быть действия, задачи, заметки и прогресс.</p></div><button class="primary-btn" data-open-modal="quickGoal">+ Цель</button></div>${active.length ? active.map(goalCardPro).join('') : empty('Добавь первую цель и сразу создай действия.')}</div>
    <div class="card" style="margin-top:16px"><h3>📦 Архив целей</h3>${done.length ? done.map(goalCardPro).join('') : empty('Закрытых целей пока нет')}</div>
  </div>`;
}
function goalCardPro(g) {
  const p = goalProgressDetails(g);
  const tasks = goalTasks(g.id);
  const notes = goalNotes(g.id);
  const danger = p.missing.length;
  return `<article class="goal-pro-card ${danger?'warn-zone':''}">
    <div class="section-head"><div><div class="goal-title-row"><b>${escapeHtml(g.title || 'Без названия')}</b><span class="tag ${danger?'warn':'green'}">${p.pct}%</span></div><p class="sub">${escapeHtml(g.area || 'Личное')} · ${g.deadline ? 'до ' + g.deadline : 'без срока'} · ${escapeHtml(g.metric || 'метрика не задана')}</p></div><button class="soft-btn" data-action="completeGoal" data-goal-id="${g.id}">${g.status==='Готово'?'Вернуть':'Закрыть'}</button></div>
    <div class="progress"><span style="width:${p.pct}%"></span></div>
    <div class="goal-meta-grid"><span>Метрика: ${p.metricPct===null?'—':p.metricPct+'%'}</span><span>Действия: ${p.doneTasks}/${p.tasks}</span><span>Заметки: ${notes.length}</span></div>
    ${p.missing.length ? `<div class="attention-item warn"><b>Нужно усилить</b><span>${p.missing.join(' · ')}</span></div>` : ''}
    ${g.why ? `<p class="goal-note-preview"><b>Зачем:</b> ${escapeHtml(g.why)}</p>` : ''}
    ${g.nextAction ? `<p class="goal-note-preview"><b>Следующий шаг:</b> ${escapeHtml(g.nextAction)}</p>` : ''}
    ${notes[0] ? `<div class="goal-last-note"><small>Последняя заметка</small><span>${escapeHtml(notes[0].text)}</span></div>` : ''}
    <div class="goal-task-strip">${tasks.slice(0,4).map(t=>`<button class="goal-task-pill ${t.status==='Готово'?'done':''}" data-edit-task="${t.id}">${t.status==='Готово'?'✓':'•'} ${escapeHtml(t.title)}</button>`).join('')}${tasks.length>4?`<span class="tag">+${tasks.length-4}</span>`:''}</div>
    <div class="actions-row"><button class="soft-btn" data-action="goalAction" data-goal-id="${g.id}">+ Действие</button><button class="soft-btn" data-action="goalSmartPlan" data-goal-id="${g.id}">🪜 SMART-план</button><button class="soft-btn" data-action="goalNote" data-goal-id="${g.id}">📝 Заметка</button><button class="soft-btn" data-action="goalProgress" data-goal-id="${g.id}">📈 Прогресс</button></div>
  </article>`;
}

function debts() {
  const sum = debtSummary();
  const items = debtItems();
  const active = items.filter(d => d.status !== 'Закрыт').sort((a,b)=>(a.due || '9999-99-99').localeCompare(b.due || '9999-99-99'));
  const closed = items.filter(d => d.status === 'Закрыт').sort((a,b)=>(b.due || b.createdAt || '').localeCompare(a.due || a.createdAt || ''));
  const owe = active.filter(d => d.direction === 'owe');
  const receivable = active.filter(d => d.direction === 'receivable');
  return `${undoBar()}<div class="grid cards">
    ${kpi('📉','Я должен', money(sum.openOwe), `${sum.oweCount} активных`)}
    ${kpi('📈','Мне должны', money(sum.openReceivable), `${sum.receivableCount} активных`)}
    ${kpi('⏰','Ближайшие 7 дней', sum.dueSoon.length, 'возвратов рядом')}
    ${kpi('✅','В архиве', closed.length, 'закрытых долгов')}
  </div>
  <div class="card" style="margin-top:16px"><div class="section-head"><div><h3>💳 Долговой центр</h3><p class="sub">Активные долги всегда сверху. Закрытые уходят в архив, чтобы не мешать.</p></div><button class="primary-btn" data-action="openDebtModal">+ Добавить долг</button></div></div>
  <div class="grid two" style="margin-top:16px">
    <div class="card"><h3>Я должен</h3>${owe.length ? owe.map(debtCard).join('') : empty('Нет открытых долгов')}</div>
    <div class="card"><h3>Мне должны</h3>${receivable.length ? receivable.map(debtCard).join('') : empty('Нет долгов в твою пользу')}</div>
  </div>
  <div class="card" style="margin-top:16px"><h3>🗂 Архив закрытых долгов</h3>${closed.length ? closed.slice(0,30).map(debtCard).join('') : empty('Закрытых долгов пока нет')}</div>`;
}

function plannedForMonth(monthKey = state.settings.currentMonth) {
  enhanceGoalGameState();
  return state.plannedExpenses.filter(p => p.active !== false && (p.recurring || p.month === monthKey));
}
function plannedSummary(monthKey = state.settings.currentMonth) {
  const list = plannedForMonth(monthKey);
  return { list, total: list.reduce((s,x)=>s+num(x.amount),0), mandatory: list.filter(x=>x.mandatory).reduce((s,x)=>s+num(x.amount),0) };
}
function nextMonthKey(monthKey = state.settings.currentMonth) {
  const [y,m] = monthKey.split('-').map(Number);
  return toMonthKey(new Date(y, m, 1));
}
function plannedExpensesCard() {
  const cur = plannedSummary();
  const next = plannedSummary(nextMonthKey());
  return `<div class="card planned-card"><div class="section-head"><div><h3>📌 Запланированные расходы</h3><p class="sub">Обязательные платежи и прогноз следующего месяца без сложного планирования.</p></div><button class="primary-btn" data-open-modal="plannedExpense">+ Плановый расход</button></div><div class="grid cards"><div class="mini-kpi"><span>Этот месяц</span><b>${money(cur.total)}</b><small>${cur.list.length} платежей</small></div><div class="mini-kpi"><span>Следующий месяц</span><b>${money(next.total)}</b><small>${next.list.length} платежей</small></div><div class="mini-kpi"><span>Обязательные</span><b>${money(cur.mandatory)}</b><small>в текущем месяце</small></div></div>${cur.list.length ? `<div class="mini-timeline">${cur.list.slice(0,8).map(p=>`<div class="timeline-item recurring"><span>${String(p.day || 1).padStart(2,'0')}</span><b>${escapeHtml(p.title || p.category)} · ${money(p.amount)}</b><small>${p.recurring?'каждый месяц':'разово'} · ${escapeHtml(p.category || '')}</small></div>`).join('')}</div>` : empty('Добавь аренду, связь, кредит, подписки или крупный плановый расход.')}</div>`;
}
function financialCalendarCard() {
  const items = financialCalendarItems().slice(0, 9);
  return `<div class="card finance-calendar-card"><div class="section-head"><div><h3>🗓 Финансовый календарь</h3><p class="sub">ЗП/аванс, долги, регулярные и плановые платежи.</p></div><div class="actions-row"><button class="soft-btn" data-open-modal="recurringOperation">+ Регулярное</button><button class="primary-btn" data-open-modal="plannedExpense">+ Плановый расход</button></div></div>${items.length ? `<div class="mini-timeline">${items.map(i=>`<div class="timeline-item ${i.type}"><span>${i.date.slice(8,10)}</span><b>${i.icon} ${escapeHtml(i.title)}</b><small>${formatFeedDate(i.date)}</small></div>`).join('')}</div>` : empty('Пока нет важных дат')}</div>`;
}
function financialCalendarItems(monthKey = state.settings.currentMonth) {
  const items = [];
  financialDays(monthKey).forEach(x => items.push({ date:x.date, icon:'🏦', title:`Финансовый день (${x.day})`, type:'money' }));
  debtSummary().active.forEach(d => { if (d.due && inMonth(d.due, monthKey)) items.push({ date:d.due, icon:'💳', title:`${d.direction === 'owe' ? 'Вернуть' : 'Получить'} ${money(d.remaining)}`, type:'debt' }); });
  state.tasks.filter(t => taskIsOpen(t) && t.due && inMonth(t.due, monthKey)).forEach(t => items.push({ date:t.due, icon:'📌', title:t.title, type:'task' }));
  state.recurring.filter(r => r.active !== false).forEach(r => { const d = recurringDateForMonth(r, monthKey); if (d) items.push({ date:d, icon:'🔁', title:r.title || r.category || 'Регулярный платёж', type:'recurring' }); });
  plannedForMonth(monthKey).forEach(p => { const day = Math.min(num(p.day) || 1, 28); const d = `${monthKey}-${String(day).padStart(2,'0')}`; items.push({ date:d, icon:p.mandatory?'📍':'📌', title:`${p.title || p.category} · ${money(p.amount)}`, type:'planned' }); });
  return items.sort((a,b)=>a.date.localeCompare(b.date));
}

function insights() {
  enhanceGoalGameState();
  const from = localStorage.getItem('panel.from') || `${state.settings.currentMonth}-01`;
  const to = localStorage.getItem('panel.to') || `${state.settings.currentMonth}-31`;
  const reports = state.insightReports || [];
  return `${undoBar()}<div class="card"><div class="section-head"><div><h3>✨ Инсайты и отчёты</h3><p class="sub">Теперь отчёт не просто показывается — он сохраняется в историю.</p></div><button class="primary-btn" data-action="createInsightReport">Сформировать отчёт</button></div><div class="form-grid"><label>С даты<input id="insightFrom" type="date" value="${from}"></label><label>По дату<input id="insightTo" type="date" value="${to}"></label></div><div class="actions-row"><button class="soft-btn" data-action="setInsightPeriod">Применить период</button><button class="soft-btn" data-action="createMonthlyReport">🏁 Итог месяца</button></div></div>
  <div class="grid two" style="margin-top:16px"><div>${insightLiveCard(from,to)}</div><div>${plannedExpensesCard()}</div></div>
  <div class="card" style="margin-top:16px"><h3>📚 Хранилище отчётов</h3>${reports.length ? reports.slice(0,20).map(insightReportCard).join('') : empty('Нажми «Сформировать отчёт», и здесь появится история аналитики.')}</div>`;
}
function insightLiveCard(from, to) {
  const r = buildInsightReport(from,to,false);
  return `<div class="card insight-live-card"><h3>🧠 Разбор периода</h3><p class="sub">${from} — ${to}</p><div class="grid cards"><div class="mini-kpi"><span>Доход</span><b>${money(r.income)}</b></div><div class="mini-kpi"><span>Расход</span><b>${money(r.expense)}</b></div><div class="mini-kpi"><span>Долги</span><b>${money(r.debts)}</b></div></div>${r.insights.map(x=>`<div class="attention-item ${x.tone}"><b>${escapeHtml(x.title)}</b><span>${escapeHtml(x.text)}</span></div>`).join('')}</div>`;
}
function buildInsightReport(from, to, store = true) {
  const ops = state.operations.filter(o => dateBetween(o.date, from, to));
  const income = total(ops.filter(o=>o.type==='income'));
  const expense = total(ops.filter(o=>o.type==='expense'));
  const cats = categoryTotals(from, to);
  const top = cats[0] || ['—',0];
  const debts = debtSummary().openOwe;
  const goalsNeed = state.goals.filter(g=>g.status!=='Готово'&&g.status!=='Отменена'&&goalProgressDetails(g).missing.length).length;
  const insights = [];
  insights.push({ tone: expense > income ? 'danger':'green', title: expense > income ? 'Период в минусе':'Период под контролем', text: `Доход ${money(income)}, расход ${money(expense)}.` });
  if (top[1]) insights.push({ tone:'blue', title:'Главная категория', text:`${top[0]} — ${money(top[1])}.` });
  if (debts) insights.push({ tone:'warn', title:'Долговая нагрузка', text:`Открытые долги к возврату: ${money(debts)}.` });
  if (goalsNeed) insights.push({ tone:'warn', title:'Цели требуют действий', text:`Целей без задачи/шага/срока: ${goalsNeed}.` });
  const report = { id: uid(), from, to, createdAt: new Date().toISOString(), income, expense, debts, topCategory: top[0], topAmount: top[1], lifeScore: lifeScore(), insights };
  if (store) { state.insightReports.unshift(report); state.insightReports = state.insightReports.slice(0,60); }
  return report;
}
function insightReportCard(r) {
  return `<article class="insight-report-card"><div class="section-head"><div><b>${r.from} — ${r.to}</b><p class="sub">Создан: ${new Date(r.createdAt).toLocaleString('ru-RU')}</p></div><span class="tag green">${r.lifeScore}/100</span></div><div class="grid cards"><div class="mini-kpi"><span>Доход</span><b>${money(r.income)}</b></div><div class="mini-kpi"><span>Расход</span><b>${money(r.expense)}</b></div><div class="mini-kpi"><span>Топ</span><b>${escapeHtml(r.topCategory)}</b></div></div>${(r.insights||[]).slice(0,3).map(x=>`<p class="sub"><b>${escapeHtml(x.title)}:</b> ${escapeHtml(x.text)}</p>`).join('')}</article>`;
}
function createInsightReport() {
  const from = document.getElementById('insightFrom')?.value || localStorage.getItem('panel.from') || `${state.settings.currentMonth}-01`;
  const to = document.getElementById('insightTo')?.value || localStorage.getItem('panel.to') || `${state.settings.currentMonth}-31`;
  pushUndo('создание отчёта инсайтов');
  const r = buildInsightReport(from,to,true);
  save(); render(); toast(`Отчёт сохранён: ${r.from} — ${r.to}`);
}

function monthCleanup(showToast = true) {
  const month = state.settings.currentMonth;
  const issues = [];
  const monthOpsList = monthOps(month);
  const noCat = monthOpsList.filter(o => !o.category).length;
  const suspicious = findSuspiciousDuplicates(monthOpsList).length;
  const debtNoDue = debtItems().filter(d => d.status !== 'Закрыт' && !d.due).length;
  const goalNoNext = state.goals.filter(g => g.status !== 'Готово' && g.status !== 'Отменена' && goalProgressDetails(g).missing.length).length;
  const taskNoDue = state.tasks.filter(t => taskIsOpen(t) && !t.due).length;
  const plannedMissing = plannedForMonth(month).length ? 0 : 1;
  const statesThisMonth = state.states.filter(s => inMonth(s.date, month)).length;
  const [y,m] = month.split('-').map(Number);
  const passedDays = Math.min(new Date().getDate(), new Date(y, m, 0).getDate());
  if (noCat) issues.push({ key:'finance-nocat', name:'Операции без категории', count:noCat, action:'Назначить категории', page:'finance' });
  if (suspicious) issues.push({ key:'finance-dupes', name:'Похожие операции / возможные дубли', count:suspicious, action:'Проверить журнал', page:'finance' });
  if (debtNoDue) issues.push({ key:'debts-nodue', name:'Долги без даты возврата', count:debtNoDue, action:'Добавить срок', page:'debts' });
  if (goalNoNext) issues.push({ key:'goals-actions', name:'Цели без нормальной системы действий', count:goalNoNext, action:'Создать действия', page:'goals' });
  if (taskNoDue) issues.push({ key:'tasks-nodue', name:'Задачи без даты', count:taskNoDue, action:'Запланировать', page:'tasks' });
  if (plannedMissing) issues.push({ key:'planned-empty', name:'Нет плановых расходов', count:1, action:'Добавить обязательные платежи', page:'insights' });
  if (statesThisMonth < Math.max(1, Math.floor(passedDays * .35))) issues.push({ key:'state-low', name:'Мало закрытых дней', count:Math.max(0, passedDays - statesThisMonth), action:'Закрывать день чаще', page:'today' });
  const result = { issues, count: issues.reduce((s,x)=>s+x.count,0) };
  if (showToast) openMonthCleanupModal(result);
  return result;
}
function openMonthCleanupModal(result = monthCleanup(false)) {
  openCustomModal('🧹 Чистка месяца', `<div class="cleanup-modal"><p class="sub">Каждое замечание теперь кликабельное: можно сразу перейти к месту исправления.</p>${result.issues.length ? `<div class="cleanup-list clickable">${result.issues.map(x=>`<button class="cleanup-jump" data-cleanup-page="${x.page}"><b>${escapeHtml(x.name)}</b><span>${x.count}</span><small>${escapeHtml(x.action)}</small></button>`).join('')}</div>` : empty('Всё аккуратно. Замечаний нет.')}</div>`);
  document.querySelectorAll('[data-cleanup-page]').forEach(b => b.onclick = () => { closeModal(); activePage = b.dataset.cleanupPage; render(); });
}

function dashboard() {
  enhanceGoalGameState();
  const s = monthSummary();
  const h = habitMonthStats();
  const t = tasksStats();
  const sc = lifeScore();
  const debt = debtSummary();
  const att = attentionItems();
  const cats = categoryTotals(`${state.settings.currentMonth}-01`, `${state.settings.currentMonth}-31`).slice(0,5);
  return `
    ${undoBar()}
    <div class="os-home">
      <section class="home-hero-pro card">
        <div><div class="tiny-label">${new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</div><h2>Финансы и жизнь в одном ритме</h2><p class="sub">Система подсказывает действия, следит за долгами, категориями, целями, задачами и наградами.</p><div class="actions-row"><button class="primary-btn" data-open-modal="quickExpense">💸 Расход</button><button class="soft-btn" data-open-modal="quickIncome">💰 Доход</button><button class="soft-btn" data-action="openDebtModal">💳 Долг</button><button class="soft-btn" data-open-modal="closeDay">🌙 Закрыть день</button></div></div>
        <div class="score-orbit"><div class="score-ring" style="--score:${sc}"><span>${sc}</span><small>Life Score</small></div><div class="sub">${scoreText(sc)}</div></div>
      </section>
      ${smartActionsCard()}
      <div class="grid cards" style="margin-top:16px">${kpi('📆','Можно тратить сегодня', money(s.dailyLimit), `Остаток месяца: ${money(s.left)}`)}${kpi('💳','Долги к возврату', money(debt.openOwe), `${debt.oweCount} активных`)}${kpi('🎮','Бонусы', `${rewardBalance().points}`, `${money(rewardBalance().rub)} на себя`)}${kpi('📌','Задачи', `${t.today} сегодня`, `${t.overdue} просрочено`)}</div>
      ${financialDayCard()}
      <div class="grid two" style="margin-top:16px"><div class="card"><h3>🔔 Центр внимания</h3>${att.length ? att.map(x => `<div class="attention-item ${x.tone || ''}"><b>${x.title}</b><span>${x.text}</span></div>`).join('') : empty('Система спокойна. Продолжай в том же ритме.')}</div><div class="card"><h3>🎛 Категории месяца</h3>${cats.length ? cats.map(([name, amount]) => categoryBar(name, amount, s.expenses)).join('') : empty('Пока нет расходов за месяц')}</div></div>
      <div class="grid two" style="margin-top:16px">${lifeScoreCard()}${financialCalendarCard()}</div>
      <div style="margin-top:16px">${plannedExpensesCard()}</div>
      <div class="card" style="margin-top:16px"><div class="section-head"><div><h3>🧾 Последние операции</h3><p class="sub">Банковская лента по дням.</p></div><button class="soft-btn" data-page-jump="finance">Открыть журнал</button></div>${bankingFeed([...state.operations].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,12), { compact:true })}</div>
    </div>`;
}

function openGoalActionModal(goalId) {
  const g = state.goals.find(x=>x.id===goalId); if (!g) return;
  openCustomModal('🪜 Действие по цели', `<div class="form-grid"><label class="full">Действие<input id="goalActTitle" placeholder="Что конкретно сделать?" value="${escapeAttr(g.nextAction || '')}"></label><label>Дата<input id="goalActDue" type="date" value="${todayKey()}"></label><label>Время<input id="goalActTime" type="time" value="10:00"></label><label>Приоритет<select id="goalActPriority"><option>Средний</option><option>Высокий</option><option>Низкий</option></select></label></div><div class="actions-row"><button class="primary-btn" id="saveGoalActionBtn">Добавить действие</button></div>`);
  document.getElementById('saveGoalActionBtn').onclick = () => { const title = val('goalActTitle'); if(!title) return toast('Введи действие'); pushUndo('действие по цели'); state.tasks.push({ id:uid(), title, area:g.area || 'Личное', goalId:g.id, due:val('goalActDue') || todayKey(), time:val('goalActTime') || '', duration:30, priority:val('goalActPriority') || 'Средний', status:'В работе', nextAction:title, calendarAdded:false }); g.nextAction = title; save(); closeModal(); render(); toast('Действие добавлено к цели'); };
}
function openSmartGoalActionsModal(goalId) {
  const g = state.goals.find(x=>x.id===goalId); if (!g) return;
  const suggestions = smartGoalSuggestions(g).map(x=>x.title).join('\n');
  openCustomModal('🪜 SMART-план действий', `<p class="sub">Отредактируй список. Каждая строка станет задачей, привязанной к цели.</p><textarea id="smartGoalLines" class="note-area" rows="7">${escapeHtml(suggestions)}</textarea><div class="form-grid"><label>Первый срок<input id="smartGoalStart" type="date" value="${todayKey()}"></label><label>Шаг между задачами, дней<input id="smartGoalStep" type="number" value="2"></label></div><div class="actions-row"><button class="primary-btn" id="saveSmartGoalBtn">Создать действия</button></div>`);
  document.getElementById('saveSmartGoalBtn').onclick = () => createSmartGoalActions(goalId);
}
function createSmartGoalActions(goalId) {
  const g = state.goals.find(x=>x.id===goalId); if (!g) return;
  const lines = String(document.getElementById('smartGoalLines')?.value || '').split('\n').map(x=>x.trim()).filter(Boolean);
  if (!lines.length) return toast('Нет действий');
  pushUndo('создание SMART-плана');
  const start = new Date((val('smartGoalStart') || todayKey()) + 'T00:00:00');
  const step = Math.max(1, num(val('smartGoalStep')) || 2);
  lines.forEach((title,i)=>{ const d = new Date(start); d.setDate(start.getDate() + i*step); state.tasks.push({ id:uid(), title, area:g.area || 'Личное', goalId:g.id, due:toDateKey(d), time:'10:00', duration:30, priority:i===0?'Высокий':'Средний', status:'В работе', nextAction:title, calendarAdded:false }); });
  g.nextAction = lines[0];
  save(); closeModal(); render(); toast(`Создано действий: ${lines.length}`);
}
function openGoalNoteModal(goalId) {
  const g = state.goals.find(x=>x.id===goalId); if (!g) return;
  openCustomModal('📝 Заметка по цели', `<p class="sub">Отдельное место для мыслей, решений и прогресса по цели.</p><textarea id="goalNoteText" class="note-area" rows="6" placeholder="Что понял? Что мешает? Какой следующий шаг?"></textarea><div class="actions-row"><button class="primary-btn" id="saveGoalNoteBtn">Сохранить заметку</button></div>`);
  document.getElementById('saveGoalNoteBtn').onclick = () => { const text = val('goalNoteText'); if(!text) return toast('Напиши заметку'); pushUndo('заметка по цели'); state.goalNotes.unshift({ id:uid(), goalId, text, date:todayKey(), createdAt:new Date().toISOString() }); save(); closeModal(); render(); toast('Заметка сохранена'); };
}
function openGoalProgressModal(goalId) {
  const g = state.goals.find(x=>x.id===goalId); if (!g) return;
  openCustomModal('📈 Обновить прогресс', `<div class="form-grid"><label>Текущее значение<input id="goalProgressCurrent" type="number" value="${escapeAttr(g.currentValue || 0)}"></label><label>Целевое значение<input id="goalProgressTarget" type="number" value="${escapeAttr(g.targetValue || 0)}"></label><label class="full">Следующее действие<input id="goalProgressNext" value="${escapeAttr(g.nextAction || '')}"></label></div><div class="actions-row"><button class="primary-btn" id="saveGoalProgressBtn">Сохранить прогресс</button></div>`);
  document.getElementById('saveGoalProgressBtn').onclick = () => { pushUndo('прогресс цели'); g.currentValue = num(val('goalProgressCurrent')); g.targetValue = num(val('goalProgressTarget')); g.nextAction = val('goalProgressNext') || g.nextAction || ''; save(); closeModal(); render(); toast('Прогресс обновлён'); };
}
function openSpendRewardModal() {
  const b = rewardBalance();
  openCustomModal('🎁 Потратить бонусы на себя', `<p class="sub">Доступно: ${b.points} баллов · ${money(b.rub)}.</p><div class="form-grid"><label>Сколько баллов списать<input id="spendRewardPoints" type="number" max="${b.points}" value="${Math.min(b.points, 10)}"></label><label class="full">На что<input id="spendRewardNote" placeholder="Например: кофе, книга, маленький подарок"></label></div><div class="actions-row"><button class="primary-btn" id="saveSpendRewardBtn">Списать и записать расход</button></div>`);
  document.getElementById('saveSpendRewardBtn').onclick = () => spendReward(num(val('spendRewardPoints')), val('spendRewardNote'));
}
function openRewardSettingsModal() {
  openCustomModal('⚙️ Настройка бонусов', `<div class="form-grid"><label>₽ за 1 балл<input id="rewardRubPerPoint" type="number" value="${state.rewards.rubPerPoint || 100}"></label></div><div class="actions-row"><button class="primary-btn" id="saveRewardSettingsBtn">Сохранить</button></div>`);
  document.getElementById('saveRewardSettingsBtn').onclick = () => { pushUndo('настройка бонусов'); state.rewards.rubPerPoint = num(val('rewardRubPerPoint')) || 100; rewardBalance(); save(); closeModal(); render(); toast('Курс бонусов сохранён'); };
}
function openPlannedExpenseModal() {
  openCustomModal('📌 Плановый расход', `<div class="form-grid"><label>Название<input id="plannedTitle" placeholder="Аренда, связь, кредит, покупка"></label><label>Сумма<input id="plannedAmount" type="number"></label><label>Категория<select id="plannedCategory">${categoryOptions('expense')}</select></label><label>День месяца<input id="plannedDay" type="number" min="1" max="28" value="1"></label><label>Месяц<input id="plannedMonth" type="month" value="${nextMonthKey()}"></label><label>Тип<select id="plannedType"><option value="mandatory">Обязательный</option><option value="optional">Плановый</option></select></label><label><input id="plannedRecurring" type="checkbox"> Повторять каждый месяц</label></div><div class="actions-row"><button class="primary-btn" id="savePlannedExpenseBtn">Сохранить</button></div>`);
  document.getElementById('savePlannedExpenseBtn').onclick = () => { const amount=num(val('plannedAmount')); if(!amount) return toast('Введи сумму'); pushUndo('плановый расход'); state.plannedExpenses.push({ id:uid(), title:val('plannedTitle') || val('plannedCategory') || 'Плановый расход', amount, category:val('plannedCategory') || 'Запланированные расходы', day:num(val('plannedDay')) || 1, month:val('plannedMonth') || nextMonthKey(), mandatory:val('plannedType') === 'mandatory', recurring:document.getElementById('plannedRecurring')?.checked || false, active:true }); save(); closeModal(); render(); toast('Плановый расход добавлен'); };
}

const __baseModalContent = modalContent;
modalContent = function(type) {
  if (type === 'spendReward') return { title:'🎁 Потратить бонусы', body:`<div id="spendRewardMount"></div>` };
  if (type === 'rewardSettings') return { title:'⚙️ Бонусы', body:`<div id="rewardSettingsMount"></div>` };
  if (type === 'plannedExpense') return { title:'📌 Плановый расход', body:`<div id="plannedExpenseMount"></div>` };
  return __baseModalContent(type);
};
const __baseOpenModal = openModal;
openModal = function(type) {
  if (type === 'spendReward') return openSpendRewardModal();
  if (type === 'rewardSettings') return openRewardSettingsModal();
  if (type === 'plannedExpense') return openPlannedExpenseModal();
  return __baseOpenModal(type);
};

const __baseSaveModal_GOAL_GAME = saveModal;
function handleModalSave(kind) {
  __baseSaveModal_GOAL_GAME(kind);
  if (kind === 'day') { addReward(3, 'Закрытие дня', 'day-' + todayKey()); save(); }
}
saveModal = handleModalSave;

const __baseBindView_GOAL_GAME = bindView;
bindView = function() {
  __baseBindView_GOAL_GAME();
  document.querySelectorAll('[data-toggle-task]').forEach(b => b.onclick = () => {
    const t = state.tasks.find(x=>x.id===b.dataset.toggleTask);
    if (!t) return;
    pushUndo('изменение статуса задачи');
    const wasDone = t.status === 'Готово';
    t.status = wasDone ? 'В работе' : 'Готово';
    if (!wasDone) addReward(t.goalId ? 5 : 2, t.goalId ? 'Действие по цели выполнено' : 'Задача выполнена', 'task-' + t.id);
    save(); render();
  });
  document.querySelectorAll('[data-edit-task]').forEach(b => b.onclick = () => openEditTaskModal(b.dataset.editTask));
}

/* =========================
   FINAL BUTTONS + UX REPAIR V4
   Единый слой кликов: кнопки больше не зависят от старых bindView/onClick.
   ========================= */

function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayKey() { return toDateKey(new Date()); }

function safeCall(label, fn) {
  try { return fn(); }
  catch (err) {
    console.error('Second Brain action error:', label, err);
    toast('Ошибка действия: ' + label + '. Открой консоль, если повторится.');
  }
}

function goPage(page, message) {
  activePage = page;
  render();
  if (message) setTimeout(() => toast(message), 50);
}

function explainTodayLimit() {
  const s = monthSummary();
  const planned = plannedSummary ? plannedSummary(state.settings.currentMonth) : { total: 0, mandatory: 0 };
  const leftAfterPlanned = Math.max(0, num(s.left) - num(planned.mandatory));
  const limitAfterPlanned = Math.floor(leftAfterPlanned / daysLeftInMonth());
  openCustomModal('📆 Почему лимит на сегодня такой', `
    <div class="grid cards">
      <div class="mini-kpi"><span>Остаток месяца</span><b>${money(s.left)}</b></div>
      <div class="mini-kpi"><span>Дней до конца</span><b>${daysLeftInMonth()}</b></div>
      <div class="mini-kpi"><span>Лимит без плановых</span><b>${money(s.dailyLimit)}</b></div>
      <div class="mini-kpi"><span>Обязательные платежи</span><b>${money(planned.mandatory)}</b></div>
    </div>
    <p class="sub" style="margin-top:12px">Базовый лимит = остаток денег на месяц / количество дней до конца месяца.</p>
    <p class="sub">Если учитывать обязательные платежи, безопасный лимит примерно: <b>${money(limitAfterPlanned)}</b> в день.</p>
    <div class="actions-row"><button class="primary-btn" data-page-jump="finance">Открыть деньги</button><button class="soft-btn" data-open-modal="plannedExpense">+ Плановый расход</button></div>
  `);
}

function jumpOverdueTasks() {
  localStorage.setItem('task.focus', 'overdue');
  goPage('tasks', 'Открыл задачи. Просрочки — первый блок сверху.');
}

const __baseTodayView_V4 = todayView;
function todayKpiButton(icon, title, value, sub, action, tone='') {
  return `<button class="kpi clickable-kpi ${tone}" data-action="${action}"><span>${icon}</span><b>${value}</b><small>${escapeHtml(title)}</small><em>${escapeHtml(sub)}</em></button>`;
}
function todayView() {
  const s = monthSummary();
  const date = todayKey();
  const habits = state.habits.filter(h => h.active);
  const todayTasks = tasksForDay(date).slice(0, 5);
  const cats = categoryTotals(date, date).slice(0, 4);
  const st = state.states.find(x => x.date === date);
  const ts = tasksStats();
  const rb = rewardBalance ? rewardBalance() : { points: 0, rub: 0 };
  const overdueTone = ts.overdue ? 'danger' : '';
  return `<div class="today-screen">
    <div class="today-hero">
      <div>
        <div class="tiny-label">${new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</div>
        <h2>Сегодня</h2>
        <p>${todayIntro()}</p>
      </div>
      <div class="today-score-ring"><span>${lifeScore()}</span><small>Life Score</small></div>
    </div>
    <div class="grid cards" style="margin-top:16px">
      ${todayKpiButton('📆','Лимит сегодня', money(s.dailyLimit), 'нажми — покажу расчёт', 'todayLimit')}
      ${todayKpiButton('📌','Задачи', `${todayTasks.length}`, `${ts.overdue} просрочено`, 'jumpOverdueTasks', overdueTone)}
      ${todayKpiButton('✅','Привычки', `${todayHabitCount()}/${habits.length}`, 'открыть привычки', 'jumpHabits')}
      ${kpi('🌿','Состояние', st ? `${st.energy}/10` : '—', st ? 'энергия сегодня' : 'день ещё не закрыт')}
    </div>
    ${allocationStatusCard()}
    <div class="grid two" style="margin-top:16px">
      <div class="card"><div class="section-head"><h3>📌 Фокус дня</h3><button class="soft-btn" data-open-modal="quickTask">Добавить</button></div>${todayTasks.length ? todayTasks.map(taskCard).join('') : empty('Нет задач на сегодня. Выбери 1 главный фокус.')}</div>
      <div class="card"><div class="section-head"><h3>✅ Привычки</h3><button class="soft-btn" data-page-jump="habits">Открыть</button></div><div class="checkbox-grid">${habits.slice(0,8).map(h => `<label class="check-card"><span><b>${escapeHtml(h.name)}</b><br><span class="sub">${escapeHtml(h.area)}</span></span><input type="checkbox" data-habit="${h.id}" ${state.habitLogs[date]?.[h.id] ? 'checked' : ''}></label>`).join('')}</div></div>
    </div>
    <div class="grid two" style="margin-top:16px">
      <div class="card"><div class="section-head"><h3>💸 Деньги сегодня</h3><button class="primary-btn" data-open-modal="quickExpense">Расход</button></div>${cats.length ? cats.map(([n,a]) => categoryBar(n, a, total(cats.map(x => ({ amount: x[1] }))))).join('') : empty('Сегодня ещё нет расходов')}</div>
      <div class="card"><h3>🌙 Закрытие дня</h3><p class="sub">Вечером отметь сон, энергию, настроение, стресс и короткий вывод. Это даст нормальную аналитику по жизни.</p><div class="pill-list"><span class="tag green">🎮 ${rb.points || 0} баллов</span><span class="tag blue">${money(rb.rub || 0)} на себя</span></div><button class="primary-btn" data-open-modal="closeDay" style="width:100%;margin-top:12px">Закрыть день</button></div>
    </div>
  </div>`;
}

const __baseBindViewBeforeV4 = bindView;
bindView = function() {
  // Только поля и чекбоксы. Все клики ловит единый обработчик ниже.
  safeCall('bindView/base', () => __baseBindViewBeforeV4());
  document.querySelectorAll('[data-habit]').forEach(ch => ch.onchange = () => {
    pushUndo?.('отметка привычки');
    const key = todayKey();
    state.habitLogs[key] = state.habitLogs[key] || {};
    state.habitLogs[key][ch.dataset.habit] = ch.checked;
    save(); toast('Привычка обновлена');
  });
  const panelSearch = document.getElementById('panelSearch');
  if (panelSearch) panelSearch.oninput = (e) => { const gs = document.getElementById('globalSearch'); if (gs) gs.value = e.target.value; render({ search: e.target.value }); };
  const backupInput = document.getElementById('backupInput');
  if (backupInput) backupInput.onchange = importBackup;
  const bankFile = document.getElementById('bankCsvFile');
  if (bankFile) bankFile.onchange = () => toast('Файл выбран. Нажми «Разобрать файл»');
  if (typeof bindFinanceControls === 'function') bindFinanceControls();
  if (typeof bindImportControls === 'function') bindImportControls();
};

function actionHandler(e) {
  const el = e.currentTarget || e.target?.closest?.('[data-action]');
  const a = el?.dataset?.action;
  if (!a) return;
  return routeAction(a, el, e);
}

function routeAction(a, el, e) {
  return safeCall(a, () => {
    if (a === 'quick') return goPage('quick');
    if (a === 'backup') return exportBackup();
    if (a === 'todayLimit') return explainTodayLimit();
    if (a === 'jumpOverdueTasks') return jumpOverdueTasks();
    if (a === 'jumpHabits') return goPage('habits', 'Открыл привычки.');
    if (a === 'jumpTasks') return goPage('tasks');
    if (a === 'applyPeriod') { localStorage.setItem('panel.from', document.getElementById('panelFrom')?.value || ''); localStorage.setItem('panel.to', document.getElementById('panelTo')?.value || ''); return render(); }
    if (a === 'currentMonthPeriod') { localStorage.setItem('panel.from', `${state.settings.currentMonth}-01`); localStorage.setItem('panel.to', `${state.settings.currentMonth}-31`); return render(); }
    if (a === 'financePrev') { financeView.page = Math.max(1, (financeView.page || 1) - 1); return render(); }
    if (a === 'financeNext') { financeView.page = (financeView.page || 1) + 1; return render(); }
    if (a === 'parseBankFile') return parseBankFile();
    if (a === 'transferBankRows') return transferBankRows();
    if (a === 'clearBankImport') { pushUndo?.('очистка импорта'); return clearBankImport(); }
    if (a === 'selectBankRows') return selectBankRows();
    if (a === 'unselectBankRows') return unselectBankRows();
    if (a === 'applyBulkCategory') return applyBulkCategory();
    if (a === 'applySuggestionsAll') return applySuggestionsAll();
    if (a === 'selectSimilarImport') return selectSimilarImport();
    if (a === 'rememberRulesForSelected') return rememberRulesForSelected();
    if (a === 'undoDeleteOp') return undoLastDelete();
    if (a === 'undoLastAction') return undoLastAction();
    if (a === 'saveSettings') return saveSettings();
    if (a === 'resetAll') { if(confirm('Точно очистить все данные?')) { pushUndo?.('полная очистка'); state = defaultData(); enhanceGoalGameState?.(); save(); render(); } return; }
    if (a === 'repair') { enhanceGoalGameState?.(); save(); toast('Система проверена и мигрирована'); return render(); }
    if (a === 'cloudRegister') return cloudRegister();
    if (a === 'cloudLogin') return cloudLogin();
    if (a === 'cloudLogout') return window.SecondBrainCloud?.logout();
    if (a === 'cloudPush') return window.SecondBrainCloud?.pushNow(state);
    if (a === 'cloudPull') return window.SecondBrainCloud?.pullNow();
    if (a === 'cloudRefresh') { window.SecondBrainCloud?.refreshStatus(); return render(); }
    if (a === 'antiChaos') return openAntiChaos();
    if (a === 'fabQuick') return openModal('quickExpense');
    if (a === 'openDebtModal') return openDebtModal();
    if (a === 'repayDebt') return openRepayDebtModal(el.dataset.debtId);
    if (a === 'setTheme') { state.settings.theme = el.dataset.themeValue || 'latte'; save(); return render(); }
    if (a === 'resetCategoryRules') { if(confirm('Сбросить все обученные правила категорий?')) { pushUndo?.('сброс правил категорий'); state.settings.categoryRules = []; save(); render(); toast('Правила категорий сброшены'); } return; }
    if (a === 'monthCleanup') return monthCleanup(true);
    if (a === 'createMonthlyReport') return createMonthlyReport();
    if (a === 'goalAction') return openGoalActionModal(el.dataset.goalId);
    if (a === 'goalSmartPlan') return openSmartGoalActionsModal(el.dataset.goalId);
    if (a === 'goalNote') return openGoalNoteModal(el.dataset.goalId);
    if (a === 'goalProgress') return openGoalProgressModal(el.dataset.goalId);
    if (a === 'completeGoal') {
      const g = state.goals.find(x=>x.id===el.dataset.goalId);
      if (g) { pushUndo?.('статус цели'); const done = g.status !== 'Готово'; g.status = done ? 'Готово' : 'В работе'; if (done) addReward?.(20, 'Цель закрыта', 'goal-' + g.id); save(); render(); }
      return;
    }
    if (a === 'createInsightReport') return createInsightReport();
    if (a === 'setInsightPeriod') { localStorage.setItem('panel.from', document.getElementById('insightFrom')?.value || `${state.settings.currentMonth}-01`); localStorage.setItem('panel.to', document.getElementById('insightTo')?.value || `${state.settings.currentMonth}-31`); return render(); }
    toast('Действие пока не подключено: ' + a);
  });
}

function installUniversalClickRouter() {
  if (window.__SECOND_BRAIN_V4_CLICK_ROUTER__) return;
  window.__SECOND_BRAIN_V4_CLICK_ROUTER__ = true;
  document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-page-jump],[data-open-modal],[data-action],[data-delete-op],[data-delete-category],[data-delete-goal],[data-hide-habit],[data-toggle-task],[data-edit-task],[data-calendar-task],[data-cleanup-page]');
    if (!target) return;

    // V12 fix: ссылки Google Calendar должны открываться как обычные ссылки.
    // Раньше универсальный роутер перехватывал data-calendar-task, делал preventDefault(),
    // поэтому кнопка «В календарь» визуально нажималась, но календарь не открывался.
    if (target.dataset.calendarTask && target.matches('a[href]')) {
      safeCall('calendar-link-mark', () => {
        const t = state.tasks.find(x => x.id === target.dataset.calendarTask);
        if (t) {
          t.calendarAdded = true;
          t.calendarLink = target.href || buildGoogleCalendarUrl(t);
          save();
          setTimeout(render, 800);
        }
      });
      return; // не блокируем href/target="_blank"
    }

    if (target.matches('a[href]') && !target.dataset.action) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    safeCall('universal-click', () => {
      if (target.dataset.pageJump) return goPage(target.dataset.pageJump);
      if (target.dataset.openModal) return openModal(target.dataset.openModal);
      if (target.dataset.deleteOp) return deleteOperation(target.dataset.deleteOp);
      if (target.dataset.deleteCategory) { const type = target.dataset.deleteCategory; const name = target.dataset.categoryName; if (!confirm(`Удалить категорию «${name}» из списка? Старые операции останутся как есть.`)) return; pushUndo?.('удаление категории'); removeCategory(type, name); save(); render(); return; }
      if (target.dataset.deleteGoal) { const g = state.goals.find(x=>x.id===target.dataset.deleteGoal); if(g) { pushUndo?.('скрытие цели'); g.status = 'Отменена'; save(); render(); } return; }
      if (target.dataset.hideHabit) { const h = state.habits.find(x=>x.id===target.dataset.hideHabit); if(h) { pushUndo?.('скрытие привычки'); h.active = false; save(); render(); } return; }
      if (target.dataset.toggleTask) { const t = state.tasks.find(x=>x.id===target.dataset.toggleTask); if(t) { pushUndo?.('изменение статуса задачи'); const wasDone = t.status === 'Готово'; t.status = wasDone ? 'В работе' : 'Готово'; if (!wasDone) addReward?.(t.goalId ? 5 : 2, t.goalId ? 'Действие по цели выполнено' : 'Задача выполнена', 'task-' + t.id); save(); render(); } return; }
      if (target.dataset.editTask) return openEditTaskModal(target.dataset.editTask);
      if (target.dataset.calendarTask) { const t = state.tasks.find(x=>x.id===target.dataset.calendarTask); if(t) { const url = buildGoogleCalendarUrl(t); t.calendarAdded = true; t.calendarLink = url; save(); window.open(url, '_blank', 'noopener'); setTimeout(render, 800); } return; }
      if (target.dataset.cleanupPage) { closeModal(); return goPage(target.dataset.cleanupPage); }
      if (target.dataset.action) return routeAction(target.dataset.action, target, e);
    });
  }, true);
}
installUniversalClickRouter();


// V6 rescue: старый слой вызывал createWeekReport(), а в базовом коде функция называется generateWeeklyReport().
function createWeekReport() {
  if (typeof generateWeeklyReport === 'function') return generateWeeklyReport();
  toast('Недельный отчёт пока недоступен');
}



/* PREMIUM UI V7 — visual polish only + clear manual allocation logic.
   Не ломаем бизнес-логику: меняем только тексты/разметку Today и ручного распределения. */
function premiumMiniKpi(icon, title, value, sub, action = '', tone = '') {
  const tag = action ? 'button' : 'div';
  const actionAttr = action ? ` data-action="${action}"` : '';
  return `<${tag} class="premium-today-card ${tone || ''}"${actionAttr}>
    <span class="premium-card-icon">${icon}</span>
    <div class="premium-card-copy"><b>${value}</b><small>${escapeHtml(title)}</small><em>${escapeHtml(sub)}</em></div>
  </${tag}>`;
}

function allocationStatusCard() {
  const a = manualAllocationStatus();
  const segments = [
    ['Сбережения', a.savings || 0, 'save'],
    ['Подушка', a.cushion || 0, 'cushion'],
    ['Финцель', a.goal || 0, 'goal']
  ];
  const totalPlan = Math.max(1, a.allocations || 1);
  const tone = a.done ? 'green' : a.overdue ? 'danger' : a.today ? 'warn' : 'blue';
  const title = a.done ? 'Распределение уже учтено' : a.overdue ? 'Нужно распределить деньги' : a.today ? 'Сегодня день распределения' : 'Ручное распределение';
  const body = a.done
    ? `Система уже нашла переводы в категории накоплений и вычла их из доступного остатка. Это помогает не потратить деньги, которые ты решил отложить.`
    : `Это не автоперевод. Это контрольный блок: в день зарплаты ты сам вносишь суммы, а приложение сразу пересчитывает безопасный остаток и лимит дня.`;
  return `<div class="card allocation-card premium-allocation ${tone}">
    <div class="allocation-main">
      <div class="allocation-eyebrow"><span class="tag ${tone}">${title}</span><span class="allocation-date">контрольная дата: ${a.due}</span></div>
      <h3>🏦 Сейф-распределение</h3>
      <p class="sub">${body}</p>
      <div class="allocation-segments">
        ${segments.map(([name, amount, cls]) => `<div class="alloc-segment ${cls}"><span>${name}</span><b>${money(amount)}</b><i style="width:${clamp(amount / totalPlan * 100, 5, 100)}%"></i></div>`).join('')}
      </div>
    </div>
    <div class="allocation-side">
      <div class="alloc-total"><span>Уже отложено</span><b>${money(a.allocations || 0)}</b><small>эта сумма уже не входит в свободный остаток</small></div>
      <button class="primary-btn" data-open-modal="manualAllocation">Внести переводы</button>
    </div>
  </div>`;
}

function todayView() {
  const s = monthSummary();
  const date = todayKey();
  const habits = state.habits.filter(h => h.active);
  const todayTasks = tasksForDay(date).slice(0, 5);
  const cats = categoryTotals(date, date).slice(0, 4);
  const st = state.states.find(x => x.date === date);
  const ts = tasksStats();
  const rb = rewardBalance ? rewardBalance() : { points: 0, rub: 0 };
  const overdueTone = ts.overdue ? 'danger' : '';
  return `<div class="today-screen premium-today-screen">
    <div class="today-hero premium-hero">
      <div>
        <div class="tiny-label">${new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</div>
        <h2>Сегодня</h2>
        <p>Держи ритм: деньги, 1–3 задачи, привычки и короткое закрытие дня.</p>
      </div>
      <div class="today-score-ring"><span>${lifeScore()}</span><small>Life Score</small></div>
    </div>
    <div class="today-kpi-grid">
      ${premiumMiniKpi('📆','Лимит сегодня', money(s.dailyLimit), 'нажми — покажу расчёт', 'todayLimit')}
      ${premiumMiniKpi('📌','Задачи', `${todayTasks.length}`, `${ts.overdue} просрочено`, 'jumpOverdueTasks', overdueTone)}
      ${premiumMiniKpi('✅','Привычки', `${todayHabitCount()}/${habits.length}`, 'открыть привычки', 'jumpHabits')}
      ${premiumMiniKpi('🌿','Состояние', st ? `${st.energy}/10` : '—', st ? 'энергия сегодня' : 'день ещё не закрыт')}
    </div>
    ${allocationStatusCard()}
    <div class="grid two premium-content-grid" style="margin-top:18px">
      <div class="card"><div class="section-head"><h3>📌 Фокус дня</h3><button class="soft-btn" data-open-modal="quickTask">Добавить</button></div>${todayTasks.length ? todayTasks.map(taskCard).join('') : empty('Нет задач на сегодня. Выбери 1 главный фокус.')}</div>
      <div class="card"><div class="section-head"><h3>✅ Привычки</h3><button class="soft-btn" data-page-jump="habits">Открыть</button></div><div class="checkbox-grid">${habits.slice(0,8).map(h => `<label class="check-card"><span><b>${escapeHtml(h.name)}</b><br><span class="sub">${escapeHtml(h.area)}</span></span><input type="checkbox" data-habit="${h.id}" ${state.habitLogs[date]?.[h.id] ? 'checked' : ''}></label>`).join('')}</div></div>
    </div>
    <div class="grid two premium-content-grid" style="margin-top:18px">
      <div class="card"><div class="section-head"><h3>💸 Деньги сегодня</h3><button class="primary-btn" data-open-modal="quickExpense">Расход</button></div>${cats.length ? cats.map(([n,a]) => categoryBar(n, a, total(cats.map(x => ({ amount: x[1] }))))).join('') : empty('Сегодня ещё нет расходов')}</div>
      <div class="card close-day-card"><h3>🌙 Закрытие дня</h3><p class="sub">Вечером отметь сон, энергию, настроение, стресс и короткий вывод. Это даст нормальную аналитику по жизни.</p><div class="pill-list"><span class="tag green">🎮 ${rb.points || 0} баллов</span><span class="tag blue">${money(rb.rub || 0)} на себя</span></div><button class="primary-btn" data-open-modal="closeDay" style="width:100%;margin-top:12px">Закрыть день</button></div>
    </div>
  </div>`;
}



/* PREMIUM UI V8 — zero allocation logic fix.
   Ручное распределение считается только если операция создана через модалку ручного распределения
   и имеет явную метку manualAllocation. Старые операции в категориях Сбережения/Подушка/Финцель
   не должны автоматически превращаться в "сейф" и не должны показывать, будто пользователь что-то внёс. */
function isAllocationCategoryOperation(o) {
  return o && o.type === 'expense' && ALLOCATION_CATEGORIES.includes(o.category || '');
}

function isManualAllocationOperation(o) {
  return isAllocationCategoryOperation(o) && (
    o.manualAllocation === true ||
    o.allocationKind === 'manual' ||
    o.source === 'manualAllocation'
  );
}

function allocationOps(monthKey = state.settings.currentMonth) {
  return expenseOps(monthKey).filter(isManualAllocationOperation);
}

function legacyAllocationOps(monthKey = state.settings.currentMonth) {
  return expenseOps(monthKey).filter(o => isAllocationCategoryOperation(o) && !isManualAllocationOperation(o));
}

function monthSummary(monthKey = state.settings.currentMonth) {
  const income = total(incomeOps(monthKey));
  const expensesList = expenseOps(monthKey);
  const manual = allocationOps(monthKey);
  const legacy = legacyAllocationOps(monthKey);
  const savings = total(manual.filter(o => o.category === 'Сбережения'));
  const cushion = total(manual.filter(o => o.category === 'Подушка'));
  const goal = total(manual.filter(o => o.category === 'Финансовая цель'));
  const allocations = savings + cushion + goal;

  // Жизненные расходы не включают категории сейфа. Сейф учитывается отдельно и только через ручной ввод.
  const expenses = total(expensesList.filter(o => !isAllocationCategoryOperation(o)));
  const legacyAllocations = total(legacy);
  const allOut = expenses + allocations;
  const left = income - allOut;
  const dailyLimit = Math.max(0, left / daysLeftInMonth(monthKey));
  return { income, expenses, savings, cushion, goal, allocations, legacyAllocations, allOut, left, dailyLimit };
}

function manualAllocationStatus(monthKey = state.settings.currentMonth) {
  const s = monthSummary(monthKey);
  const [y, m] = monthKey.split('-').map(Number);
  const days = financialDays ? financialDays(monthKey) : [{ day: Number(state.settings.transferDay || 10), date: `${monthKey}-${String(state.settings.transferDay || 10).padStart(2, '0')}` }];
  const activeDay = days.find(d => todayKey() <= d.date) || days[days.length - 1];
  const due = activeDay?.date || `${monthKey}-10`;
  const done = s.allocations > 0;
  const overdue = !done && todayKey() > due;
  const today = !done && todayKey() === due;
  return { ...s, due, done, overdue, today, day: activeDay?.day || Number(state.settings.transferDay || 10) };
}

function financialDayStatus(monthKey = state.settings.currentMonth) {
  const days = financialDays(monthKey);
  const ops = allocationOps(monthKey);
  const today = todayKey();
  const statuses = days.map((d, idx) => {
    const nextDate = days[idx+1]?.date || `${monthKey}-31`;
    const done = ops.some(o => o.date >= d.date && o.date < nextDate);
    return { ...d, done, today: today === d.date && !done, overdue: today > d.date && !done };
  });
  const active = statuses.find(x => x.today || x.overdue) || statuses.find(x => !x.done) || statuses[statuses.length - 1];
  return { statuses, active, today: statuses.some(x=>x.today), overdue: statuses.some(x=>x.overdue), label: active?.date || '' };
}

function allocationNoticeText(a) {
  if (a.allocations > 0) {
    return `Вручную учтено ${money(a.allocations)}. Эти деньги вычтены из свободного остатка и не считаются доступными для трат.`;
  }
  return 'Вручную учтено 0 ₽. Ты ничего не вносил — значит сейф не уменьшает лимит. Так и должно быть.';
}

function allocationStatusCard() {
  const a = manualAllocationStatus();
  const segments = [
    ['Сбережения', a.savings ?? 0, 'save'],
    ['Подушка', a.cushion ?? 0, 'cushion'],
    ['Финцель', a.goal ?? 0, 'goal']
  ];
  const totalPlan = Math.max(1, a.allocations || 0);
  const tone = a.done ? 'green' : a.overdue ? 'warn' : a.today ? 'warn' : 'blue';
  const title = a.done ? 'Сейф учтён вручную' : '0 ₽ распределено вручную';
  const body = a.done
    ? 'Приложение учитывает только те суммы, которые ты сам внёс через эту кнопку. Поэтому расчёт лимита честный и без скрытых автосписаний.'
    : 'Автоматических списаний нет. Пока ты не внесёшь суммы сам, в сейфе считается 0 ₽ — даже если раньше были старые категории сбережений.';
  const legacyNote = a.legacyAllocations > 0
    ? `<div class="allocation-legacy-note">Найдено старых записей в категориях сейфа: <b>${money(a.legacyAllocations)}</b>. Я не считаю их ручным распределением, чтобы не врать по цифрам.</div>`
    : '';
  return `<div class="card allocation-card premium-allocation ${tone}">
    <div class="allocation-main">
      <div class="allocation-eyebrow"><span class="tag ${tone}">${title}</span><span class="allocation-date">контрольная дата: ${a.due}</span></div>
      <h3>🏦 Сейф-распределение</h3>
      <p class="sub">${body}</p>
      <div class="allocation-segments">
        ${segments.map(([name, amount, cls]) => `<div class="alloc-segment ${cls}"><span>${name}</span><b>${money(amount)}</b><i style="width:${a.allocations ? clamp(amount / totalPlan * 100, 0, 100) : 0}%"></i></div>`).join('')}
      </div>
      ${legacyNote}
    </div>
    <div class="allocation-side">
      <div class="alloc-total"><span>Вручную учтено</span><b>${money(a.allocations ?? 0)}</b><small>${allocationNoticeText(a)}</small></div>
      <button class="primary-btn" data-open-modal="manualAllocation">Внести переводы</button>
    </div>
  </div>`;
}

function financialDayCard() {
  const fd = financialDayStatus();
  const s = monthSummary();
  const allDone = fd.statuses.every(x=>x.done);
  const tone = s.allocations > 0 ? 'green' : fd.overdue || fd.today ? 'warn' : 'blue';
  const title = s.allocations > 0 ? 'Распределение учтено' : 'Ручное распределение: 0 ₽';
  const note = s.allocations > 0
    ? `Вручную внесено: <b>${money(s.allocations)}</b>. Сейф уже вычтен из свободного остатка.`
    : `Пока вручную внесено: <b>0 ₽</b>. Лимит не уменьшается сейфом, пока ты сам не внесёшь суммы.`;
  const legacy = s.legacyAllocations > 0 ? `<br><span class="subtle-warning">Старые записи в категориях сейфа: ${money(s.legacyAllocations)} — не считаю ручным распределением.</span>` : '';
  return `<div class="card allocation-card ${tone}"><div><span class="tag ${tone}">${title}</span><h3>🏦 Ручное распределение</h3><p class="sub">Плановые дни: ${fd.statuses.map(x => `${x.date}${x.done ? ' ✓' : ''}`).join(' · ')}. ${note}${legacy}</p></div><button class="primary-btn" data-open-modal="manualAllocation">Внести переводы</button></div>`;
}

function todayView() {
  const s = monthSummary();
  const date = todayKey();
  const habits = state.habits.filter(h => h.active);
  const todayTasks = tasksForDay(date).slice(0, 5);
  const cats = categoryTotals(date, date).slice(0, 4);
  const st = state.states.find(x => x.date === date);
  const ts = tasksStats();
  const rb = typeof rewardBalance === 'function' ? rewardBalance() : { points: 0, rub: 0 };
  const overdueTone = ts.overdue ? 'danger' : '';
  return `<div class="today-screen premium-today-screen">
    <div class="today-hero premium-hero">
      <div>
        <div class="tiny-label">${new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</div>
        <h2>Сегодня</h2>
        <p>Держи ритм: деньги, 1–3 задачи, привычки и короткое закрытие дня.</p>
      </div>
      <div class="today-score-ring"><span>${lifeScore()}</span><small>Life Score</small></div>
    </div>
    <div class="today-kpi-grid">
      ${premiumMiniKpi('📆','Лимит сегодня', money(s.dailyLimit), 'нажми — покажу расчёт', 'todayLimit')}
      ${premiumMiniKpi('📌','Задачи', `${todayTasks.length}`, `${ts.overdue} просрочено`, 'jumpOverdueTasks', overdueTone)}
      ${premiumMiniKpi('✅','Привычки', `${todayHabitCount()}/${habits.length}`, 'открыть привычки', 'jumpHabits')}
      ${premiumMiniKpi('🌿','Состояние', st ? `${st.energy}/10` : '—', st ? 'энергия сегодня' : 'день ещё не закрыт')}
    </div>
    ${allocationStatusCard()}
    <div class="grid two premium-content-grid" style="margin-top:18px">
      <div class="card"><div class="section-head"><h3>📌 Фокус дня</h3><button class="soft-btn" data-open-modal="quickTask">Добавить</button></div>${todayTasks.length ? todayTasks.map(taskCard).join('') : empty('Нет задач на сегодня. Выбери 1 главный фокус.')}</div>
      <div class="card"><div class="section-head"><h3>✅ Привычки</h3><button class="soft-btn" data-page-jump="habits">Открыть</button></div><div class="checkbox-grid">${habits.slice(0,8).map(h => `<label class="check-card"><span><b>${escapeHtml(h.name)}</b><br><span class="sub">${escapeHtml(h.area)}</span></span><input type="checkbox" data-habit="${h.id}" ${state.habitLogs[date]?.[h.id] ? 'checked' : ''}></label>`).join('')}</div></div>
    </div>
    <div class="grid two premium-content-grid" style="margin-top:18px">
      <div class="card"><div class="section-head"><h3>💸 Деньги сегодня</h3><button class="primary-btn" data-open-modal="quickExpense">Расход</button></div>${cats.length ? cats.map(([n,a]) => categoryBar(n, a, total(cats.map(x => ({ amount: x[1] }))))).join('') : empty('Сегодня ещё нет расходов')}</div>
      <div class="card close-day-card"><h3>🌙 Закрытие дня</h3><p class="sub">Вечером отметь сон, энергию, настроение, стресс и короткий вывод. Это даст нормальную аналитику по жизни.</p><div class="pill-list"><span class="tag green">🎮 ${rb.points || 0} баллов</span><span class="tag blue">${money(rb.rub || 0)} на себя</span></div><button class="primary-btn" data-open-modal="closeDay" style="width:100%;margin-top:12px">Закрыть день</button></div>
    </div>
  </div>`;
}



/* =========================
   PREMIUM FINANCE UI V9
   PlanFact x Apple x Notion x Pinterest visual layer
   Логика сохранена: меняем подачу, кликабельные плитки и премиум-дашборд.
   ========================= */

function v9IconTile(icon, title, sub, attrs = '', tone = 'white') {
  return `<button class="v9-action-tile ${tone}" ${attrs}>
    <span class="v9-action-icon">${icon}</span>
    <span class="v9-action-text"><b>${escapeHtml(title)}</b><small>${escapeHtml(sub || '')}</small></span>
    <span class="v9-action-arrow">↗</span>
  </button>`;
}

function v9MoneyChip(icon, label, value, sub = '', tone = '') {
  return `<div class="v9-money-chip ${tone}">
    <span class="v9-chip-icon">${icon}</span>
    <div><small>${escapeHtml(label)}</small><b>${value}</b>${sub ? `<em>${escapeHtml(sub)}</em>` : ''}</div>
  </div>`;
}

function v9QuickActions() {
  return `<div class="v9-action-grid">
    ${v9IconTile('💸', 'Расход', 'быстро записать', 'data-open-modal="quickExpense"', 'black')}
    ${v9IconTile('💰', 'Доход', 'зарплата / проект', 'data-open-modal="quickIncome"', 'yellow')}
    ${v9IconTile('🧾', 'Долг', 'взял / отдал', 'data-action="openDebtModal"', 'white')}
    ${v9IconTile('🎯', 'Цель', 'SMART-план', 'data-open-modal="quickGoal"', 'white')}
    ${v9IconTile('✅', 'Привычки', 'отметить день', 'data-page-jump="habits"', 'white')}
    ${v9IconTile('✨', 'Инсайты', 'отчёт и план', 'data-page-jump="insights"', 'white')}
  </div>`;
}

function dashboard() {
  const s = monthSummary();
  const h = habitMonthStats();
  const g = goalsStats();
  const t = tasksStats();
  const sc = lifeScore();
  const rb = typeof rewardBalance === 'function' ? rewardBalance() : { points: 0, rub: 0 };
  const cats = categoryTotals(`${state.settings.currentMonth}-01`, `${state.settings.currentMonth}-31`).slice(0,5);
  const latest = [...state.operations].sort((a,b)=>String(b.date || '').localeCompare(String(a.date || ''))).slice(0,6);
  const safeText = s.allocations > 0 ? `В сейфе вручную учтено ${money(s.allocations)}` : 'Сейф пока 0 ₽ — лимит не уменьшен';

  return `<div class="v9-dashboard">
    <section class="v9-hero-shell">
      <div class="v9-balance-card">
        <div class="v9-card-top"><span class="v9-logo-dot">●</span><span>Second Brain Finance</span></div>
        <small>Свободный остаток месяца</small>
        <strong>${money(s.left)}</strong>
        <div class="v9-spend-track"><i style="width:${clamp(s.income ? (s.expenses / Math.max(1, s.income) * 100) : 0, 0, 100)}%"></i></div>
        <div class="v9-balance-meta"><span>Расходы: ${money(s.expenses)}</span><span>Доход: ${money(s.income)}</span></div>
        <div class="v9-mini-actions">
          <button data-open-modal="quickExpense">−</button>
          <button data-open-modal="quickIncome">＋</button>
          <button data-page-jump="bank">⇅</button>
          <button data-page-jump="finance">⋯</button>
        </div>
      </div>

      <div class="v9-hero-main">
        <div class="tiny-label">${monthLabel(state.settings.currentMonth)}</div>
        <h2>Финансы и жизнь<br>в одном ритме</h2>
        <p>Премиальный центр управления: деньги, цели, задачи, привычки, долги и решения на день — без серости и ощущения Excel.</p>
        <div class="v9-hero-kpis">
          ${v9MoneyChip('📆', 'Лимит сегодня', money(s.dailyLimit), `${daysLeftInMonth()} дн. до конца месяца`, 'yellow')}
          ${v9MoneyChip('🎮', 'Бонусы', `${rb.points || 0}`, `${money(rb.rub || 0)} на себя`, 'soft')}
          ${v9MoneyChip('📌', 'Задачи', `${t.today} сегодня`, `${t.overdue} просрочено`, t.overdue ? 'danger' : 'soft')}
        </div>
      </div>

      <div class="v9-score-card">
        <div class="v9-score-ring"><span>${sc}</span><small>Life Score</small></div>
        <p>${scoreText(sc)}</p>
        <button class="soft-btn" data-page-jump="today">Открыть день</button>
      </div>
    </section>

    <section class="v9-section-grid">
      <div class="card v9-card-wide">
        <div class="section-head"><div><h3>⚡ Быстрые действия</h3><p class="sub">Каждая плитка кликабельна и ведёт сразу в действие.</p></div></div>
        ${v9QuickActions()}
      </div>
      <div class="card v9-safe-card">
        <div class="section-head"><div><h3>🏦 Сейф месяца</h3><p class="sub">${safeText}</p></div><button class="primary-btn" data-open-modal="manualAllocation">Внести</button></div>
        <div class="v9-safe-row"><span>Сбережения</span><b>${money(s.savings ?? 0)}</b></div>
        <div class="v9-safe-row"><span>Подушка</span><b>${money(s.cushion ?? 0)}</b></div>
        <div class="v9-safe-row"><span>Финцель</span><b>${money(s.goal ?? 0)}</b></div>
      </div>
    </section>

    <section class="grid two v9-lower-grid" style="margin-top:18px">
      <div class="card">
        <div class="section-head"><div><h3>📊 Категории месяца</h3><p class="sub">Куда реально уходит жизнь и деньги.</p></div><button class="soft-btn" data-page-jump="finance">Журнал</button></div>
        ${cats.length ? cats.map(([name, amount]) => categoryBar(name, amount, s.expenses)).join('') : empty('Пока нет расходов за месяц')}
      </div>
      <div class="card">
        <div class="section-head"><div><h3>🧾 Последние операции</h3><p class="sub">Свежая лента финансов.</p></div><button class="soft-btn" data-open-modal="quickExpense">Добавить</button></div>
        ${latest.length ? `<div class="v9-feed">${latest.map(o => `<button class="v9-feed-row" data-page-jump="finance"><span>${o.type === 'income' ? '💰' : '💸'}</span><b>${escapeHtml(o.category || 'Без категории')}</b><small>${escapeHtml(o.note || o.date || '')}</small><em>${money(o.amount)}</em></button>`).join('')}</div>` : empty('Операций пока нет')}
      </div>
    </section>
  </div>`;
}

console.log('Second Brain PREMIUM FINANCE V9 visual layer loaded');

console.log('Second Brain PREMIUM UI V8 zero allocation layer loaded');



/* =========================
   SMART SIMPLICITY PACK V10
   Цель: больше пользы без перегруза. Не трогаем Firebase/облако, добавляем понятные блоки.
   ========================= */

function v10EnsureState() {
  if (typeof enhanceGoalGameState === 'function') enhanceGoalGameState();
  state.plannedExpenses = Array.isArray(state.plannedExpenses) ? state.plannedExpenses : [];
  state.debts = Array.isArray(state.debts) ? state.debts : [];
  state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
  state.goals = Array.isArray(state.goals) ? state.goals : [];
  state.habits = Array.isArray(state.habits) ? state.habits : [];
}

function v10DaysUntil(dateKey) {
  if (!dateKey) return 999;
  const today = new Date(todayKey() + 'T00:00:00');
  const target = new Date(String(dateKey).slice(0,10) + 'T00:00:00');
  if (Number.isNaN(target.getTime())) return 999;
  return Math.ceil((target - today) / 86400000);
}

function v10PlannedDate(p, monthKey = state.settings.currentMonth) {
  const day = String(Math.min(Math.max(num(p.day) || 1, 1), 28)).padStart(2, '0');
  return `${p.month && !p.recurring ? p.month : monthKey}-${day}`;
}

function v10UpcomingPlanned(limit = 5) {
  v10EnsureState();
  const current = plannedForMonth ? plannedForMonth(state.settings.currentMonth) : [];
  return current
    .map(p => ({ ...p, date: v10PlannedDate(p), daysLeft: v10DaysUntil(v10PlannedDate(p)) }))
    .filter(p => p.daysLeft >= 0)
    .sort((a,b) => a.daysLeft - b.daysLeft)
    .slice(0, limit);
}

function v10MandatoryPlannedTotal(monthKey = state.settings.currentMonth) {
  const summary = typeof plannedSummary === 'function' ? plannedSummary(monthKey) : { mandatory: 0, total: 0 };
  return summary.mandatory || 0;
}

function v10SafeDailyLimit(monthKey = state.settings.currentMonth) {
  const s = monthSummary(monthKey);
  const mandatory = v10MandatoryPlannedTotal(monthKey);
  const leftAfterMandatory = Math.max(0, num(s.left) - num(mandatory));
  return {
    baseLimit: s.dailyLimit,
    safeLimit: leftAfterMandatory / daysLeftInMonth(monthKey),
    leftAfterMandatory,
    mandatory,
    summary: s
  };
}

function v10PrimaryGoal() {
  v10EnsureState();
  const active = state.goals.filter(g => g.status !== 'Готово' && g.status !== 'Отменена');
  if (!active.length) return null;
  return active
    .map(g => ({ g, details: typeof goalProgressDetails === 'function' ? goalProgressDetails(g) : { pct: goalProgress(g), missing: [] } }))
    .sort((a,b) => (a.details.pct || 0) - (b.details.pct || 0))[0];
}

function v10FocusItems() {
  v10EnsureState();
  const items = [];
  const today = todayKey();
  const ts = tasksStats();
  const dailyMoneyLogged = state.operations.some(o => o.date === today);
  const habits = state.habits.filter(h => h.active);
  const habitDone = todayHabitCount ? todayHabitCount() : 0;
  const st = state.states.find(x => x.date === today);
  const debt = typeof debtSummary === 'function' ? debtSummary() : { dueSoon: [], openOwe: 0 };
  const planned = v10UpcomingPlanned(1)[0];
  const primaryGoal = v10PrimaryGoal();
  const limit = v10SafeDailyLimit();

  if (!dailyMoneyLogged) items.push({ icon:'💸', tone:'black', title:'Записать деньги', text:'Добавь расход или доход, чтобы лимит был честным.', kind:'modal', action:'quickExpense' });
  if (ts.overdue > 0) items.push({ icon:'📌', tone:'danger', title:'Просроченные задачи', text:`Есть ${ts.overdue} просроч. — открой список и закрой одну.`, kind:'action', action:'jumpOverdueTasks' });
  if (debt.dueSoon && debt.dueSoon.length) items.push({ icon:'💳', tone:'danger', title:'Ближайший долг', text:`${debt.dueSoon[0].due}: ${money(debt.dueSoon[0].remaining)}.`, kind:'page', action:'debts' });
  if (planned) items.push({ icon:'📅', tone:'warn', title:'Плановый платёж', text:`${planned.date}: ${planned.title || planned.category} · ${money(planned.amount)}.`, kind:'modal', action:'plannedExpense' });
  if (primaryGoal && primaryGoal.g.nextAction) items.push({ icon:'🎯', tone:'yellow', title:'Шаг по цели', text:primaryGoal.g.nextAction, kind:'page', action:'goals' });
  if (habits.length && habitDone < Math.min(2, habits.length)) items.push({ icon:'✅', tone:'green', title:'Отметить привычку', text:'Сделай хотя бы одну отметку, чтобы день не выпал.', kind:'page', action:'habits' });
  if (!st) items.push({ icon:'🌙', tone:'soft', title:'Закрыть день', text:'Вечером отметь состояние и короткий вывод.', kind:'modal', action:'closeDay' });
  if (limit.safeLimit <= 300 && limit.summary.income > 0) items.push({ icon:'⚠️', tone:'warn', title:'Лимит низкий', text:'Проверь обязательные платежи и траты до конца месяца.', kind:'action', action:'todayLimit' });

  if (!items.length) items.push({ icon:'✨', tone:'green', title:'День под контролем', text:'Отклонений нет. Поддерживай ритм и не перегружай себя.', kind:'page', action:'today' });
  return items.slice(0, 5);
}

function v10ActionAttrs(item) {
  if (item.kind === 'modal') return `data-open-modal="${escapeAttr(item.action)}"`;
  if (item.kind === 'page') return `data-page-jump="${escapeAttr(item.action)}"`;
  return `data-action="${escapeAttr(item.action)}"`;
}

function v10FocusCenter() {
  const items = v10FocusItems();
  return `<section class="card v10-focus-card">
    <div class="section-head">
      <div><div class="tiny-label">Smart Simplicity</div><h3>🔥 Центр внимания</h3><p class="sub">Не всё приложение сразу — только 3–5 действий, которые реально двигают день.</p></div>
      <button class="soft-btn" data-action="antiChaos">🆘 Антихаос</button>
    </div>
    <div class="v10-focus-grid">
      ${items.map((item, idx) => `<button class="v10-focus-item ${item.tone || ''}" ${v10ActionAttrs(item)}>
        <span class="v10-focus-index">${idx + 1}</span><i>${item.icon}</i><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.text || '')}</small><em>Открыть</em>
      </button>`).join('')}
    </div>
  </section>`;
}

function v10LimitCard() {
  const l = v10SafeDailyLimit();
  return `<div class="card v10-limit-card">
    <div class="section-head"><div><h3>📆 Лимит дня</h3><p class="sub">Базовый лимит + вариант с учётом обязательных платежей.</p></div><button class="primary-btn" data-action="todayLimit">Почему такой?</button></div>
    <div class="v10-limit-row"><span>Базовый</span><b>${money(l.baseLimit)}</b></div>
    <div class="v10-limit-row accent"><span>Безопасный после обязательных</span><b>${money(l.safeLimit)}</b></div>
    <div class="v10-limit-math"><span>Остаток</span><span>${money(l.summary.left)}</span><span>− обязательные</span><span>${money(l.mandatory)}</span><span>= запас</span><span>${money(l.leftAfterMandatory)}</span></div>
  </div>`;
}

function v10PlannedPaymentsCard() {
  v10EnsureState();
  const cur = typeof plannedSummary === 'function' ? plannedSummary(state.settings.currentMonth) : { list: [], total: 0, mandatory: 0 };
  const upcoming = v10UpcomingPlanned(6);
  return `<div class="card v10-simple-card">
    <div class="section-head"><div><h3>📅 Плановые платежи</h3><p class="sub">Без сложного бюджета: дата, сумма, статус ожидания.</p></div><button class="primary-btn" data-open-modal="plannedExpense">+ Платёж</button></div>
    <div class="v10-stats-line"><span>Всего: <b>${money(cur.total)}</b></span><span>Обязательные: <b>${money(cur.mandatory)}</b></span><span>${cur.list.length} шт.</span></div>
    ${upcoming.length ? `<div class="v10-pay-list">${upcoming.map(p => `<button class="v10-pay-row" data-open-modal="plannedExpense"><i>${p.mandatory ? '📍' : '📌'}</i><b>${escapeHtml(p.title || p.category || 'Платёж')}</b><span>${p.date}</span><em>${money(p.amount)}</em></button>`).join('')}</div>` : v10EmptyState('📅','Плановых платежей нет','Добавь аренду, кредит, связь или подписки — они будут влиять на прогноз лимита.','+ Добавить платёж','data-open-modal="plannedExpense"')}
  </div>`;
}

function v10DebtPriorityCard() {
  const sum = typeof debtSummary === 'function' ? debtSummary() : { active: [], openOwe: 0, dueSoon: [] };
  const active = (sum.active || []).sort((a,b)=>(a.due || '9999-99-99').localeCompare(b.due || '9999-99-99'));
  const next = active[0];
  const closedCount = typeof debtItems === 'function' ? debtItems().filter(d => d.status === 'Закрыт').length : 0;
  return `<div class="card v10-simple-card v10-debt-priority">
    <div class="section-head"><div><h3>💳 Долги</h3><p class="sub">Активные сверху, закрытые — в архиве.</p></div><button class="primary-btn" data-action="openDebtModal">+ Долг</button></div>
    <div class="v10-stats-line"><span>К возврату: <b>${money(sum.openOwe || 0)}</b></span><span>Активные: <b>${active.length}</b></span><span>Архив: <b>${closedCount}</b></span></div>
    ${next ? `<button class="v10-priority-row ${next.due && next.due < todayKey() ? 'danger' : ''}" data-page-jump="debts"><i>⏰</i><b>${escapeHtml(next.title)}</b><small>${next.due || 'без даты'}</small><em>${money(next.remaining)}</em></button>` : v10EmptyState('💳','Активных долгов нет','Красота. Долговая нагрузка не давит на Life Score.','Добавить долг','data-action="openDebtModal"')}
  </div>`;
}

function v10GoalNextCard() {
  const primary = v10PrimaryGoal();
  const rb = typeof rewardBalance === 'function' ? rewardBalance() : { points: 0, rub: 0 };
  if (!primary) return `<div class="card v10-simple-card">${v10EmptyState('🎯','Целей пока нет','Создай одну цель и добавь к ней первое действие. Без действия цель не считается живой.','Создать цель','data-open-modal="quickGoal"')}</div>`;
  const g = primary.g;
  const d = primary.details;
  const next = g.nextAction || (d.missing && d.missing.length ? 'Добавь ближайшее действие' : 'Проверь прогресс');
  return `<div class="card v10-simple-card v10-goal-next">
    <div class="section-head"><div><h3>🎯 Ближайшее действие цели</h3><p class="sub">Цель → действие → бонус. Без перегруза.</p></div><button class="soft-btn" data-page-jump="goals">Все цели</button></div>
    <button class="v10-goal-row" data-page-jump="goals"><i>🎯</i><b>${escapeHtml(g.title || 'Цель')}</b><span>${d.pct || 0}%</span></button>
    <div class="progress"><span style="width:${clamp(d.pct || 0)}%"></span></div>
    <div class="v10-next-action"><span>Следующий шаг</span><b>${escapeHtml(next)}</b></div>
    <div class="v10-stats-line"><span>Бонусы: <b>${rb.points || 0}</b></span><span>На себя: <b>${money(rb.rub || 0)}</b></span></div>
    <div class="actions-row"><button class="primary-btn" data-action="goalAction" data-goal-id="${g.id}">+ Действие</button><button class="soft-btn" data-action="goalSmartPlan" data-goal-id="${g.id}">SMART-план</button></div>
  </div>`;
}

function v10AntiChaosStrip() {
  return `<section class="card v10-anti-card">
    <div><span class="tag warn">режим минимум</span><h3>🆘 Антихаос-режим</h3><p class="sub">Когда нет сил: один расход, одна задача, одна привычка и закрытие дня. Система не должна давить.</p></div>
    <button class="primary-btn" data-action="antiChaos">Включить минимум</button>
  </section>`;
}

function v10EmptyState(icon, title, text, button, attrs) {
  return `<div class="v10-empty"><i>${icon}</i><b>${escapeHtml(title)}</b><small>${escapeHtml(text)}</small>${button ? `<button class="soft-btn" ${attrs || ''}>${escapeHtml(button)}</button>` : ''}</div>`;
}

function dashboard() {
  v10EnsureState();
  const s = monthSummary();
  const t = tasksStats();
  const sc = lifeScore();
  const rb = typeof rewardBalance === 'function' ? rewardBalance() : { points: 0, rub: 0 };
  const cats = categoryTotals(`${state.settings.currentMonth}-01`, `${state.settings.currentMonth}-31`).slice(0,5);
  const latest = [...state.operations].sort((a,b)=>String(b.date || '').localeCompare(String(a.date || ''))).slice(0,6);
  const limit = v10SafeDailyLimit();

  return `<div class="v10-dashboard v9-dashboard">
    <section class="v9-hero-shell v10-hero-shell">
      <div class="v9-balance-card">
        <div class="v9-card-top"><span class="v9-logo-dot">●</span><span>Second Brain OS</span></div>
        <small>Свободный остаток месяца</small>
        <strong>${money(s.left)}</strong>
        <div class="v9-spend-track"><i style="width:${clamp(s.income ? (s.expenses / Math.max(1, s.income) * 100) : 0, 0, 100)}%"></i></div>
        <div class="v9-balance-meta"><span>Расходы: ${money(s.expenses)}</span><span>Доход: ${money(s.income)}</span></div>
        <div class="v9-mini-actions"><button data-open-modal="quickExpense">−</button><button data-open-modal="quickIncome">＋</button><button data-page-jump="bank">⇅</button><button data-page-jump="finance">⋯</button></div>
      </div>
      <div class="v9-hero-main">
        <div class="tiny-label">${monthLabel(state.settings.currentMonth)} · V11 Inspection Fix</div>
        <h2>Управляй днём,<br>а не десятками таблиц</h2>
        <p>Главная показывает только то, что влияет на деньги, фокус и спокойствие сегодня.</p>
        <div class="v9-hero-kpis">
          ${v9MoneyChip('📆', 'Безопасный лимит', money(limit.safeLimit), `с учётом обязательных`, 'yellow')}
          ${v9MoneyChip('🎮', 'Бонусы', `${rb.points || 0}`, `${money(rb.rub || 0)} на себя`, 'soft')}
          ${v9MoneyChip('📌', 'Задачи', `${t.today} сегодня`, `${t.overdue} просрочено`, t.overdue ? 'danger' : 'soft')}
        </div>
      </div>
      <div class="v9-score-card">
        <div class="v9-score-ring"><span>${sc}</span><small>Life Score</small></div>
        <p>${scoreText(sc)}</p>
        <button class="soft-btn" data-page-jump="today">Открыть день</button>
      </div>
    </section>

    ${v10FocusCenter()}

    <section class="v10-compact-grid">
      ${v10LimitCard()}
      ${v10PlannedPaymentsCard()}
      ${v10DebtPriorityCard()}
      ${v10GoalNextCard()}
    </section>

    ${allocationStatusCard()}
    ${v10AntiChaosStrip()}

    <section class="grid two v9-lower-grid" style="margin-top:18px">
      <div class="card">
        <div class="section-head"><div><h3>📊 Категории месяца</h3><p class="sub">Только крупные направления, без перегруза графиками.</p></div><button class="soft-btn" data-page-jump="finance">Журнал</button></div>
        ${cats.length ? cats.map(([name, amount]) => categoryBar(name, amount, s.expenses)).join('') : v10EmptyState('📊','Расходов пока нет','Добавь первую операцию, и здесь появятся категории месяца.','Добавить расход','data-open-modal="quickExpense"')}
      </div>
      <div class="card">
        <div class="section-head"><div><h3>🧾 Последние операции</h3><p class="sub">Свежая лента, чтобы быстро проверить порядок.</p></div><button class="soft-btn" data-open-modal="quickExpense">Добавить</button></div>
        ${latest.length ? `<div class="v9-feed">${latest.map(o => `<button class="v9-feed-row" data-page-jump="finance"><span>${o.type === 'income' ? '💰' : '💸'}</span><b>${escapeHtml(o.category || 'Без категории')}</b><small>${escapeHtml(o.note || o.date || '')}</small><em>${money(o.amount)}</em></button>`).join('')}</div>` : v10EmptyState('🧾','Операций пока нет','Начни с одного дохода или расхода.','Быстрый ввод','data-page-jump="quick"')}
      </div>
    </section>
  </div>`;
}

function todayView() {
  v10EnsureState();
  const s = monthSummary();
  const date = todayKey();
  const habits = state.habits.filter(h => h.active);
  const todayTasks = tasksForDay(date).slice(0, 5);
  const cats = categoryTotals(date, date).slice(0, 4);
  const st = state.states.find(x => x.date === date);
  const ts = tasksStats();
  const rb = typeof rewardBalance === 'function' ? rewardBalance() : { points: 0, rub: 0 };
  const limit = v10SafeDailyLimit();
  return `<div class="today-screen premium-today-screen v10-today-screen">
    <div class="today-hero premium-hero">
      <div><div class="tiny-label">${new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}</div><h2>Сегодня</h2><p>Не ведём всё подряд. Держим минимум: деньги, фокус, привычки, состояние.</p></div>
      <div class="today-score-ring"><span>${lifeScore()}</span><small>Life Score</small></div>
    </div>
    ${v10FocusCenter()}
    <div class="today-kpi-grid">
      ${premiumMiniKpi('📆','Безопасный лимит', money(limit.safeLimit), 'нажми — покажу расчёт', 'todayLimit')}
      ${premiumMiniKpi('📌','Задачи', `${todayTasks.length}`, `${ts.overdue} просрочено`, 'jumpOverdueTasks', ts.overdue ? 'danger' : '')}
      ${premiumMiniKpi('✅','Привычки', `${todayHabitCount()}/${habits.length}`, 'открыть привычки', 'jumpHabits')}
      ${premiumMiniKpi('🌿','Состояние', st ? `${st.energy}/10` : '—', st ? 'энергия сегодня' : 'день ещё не закрыт')}
    </div>
    <div class="grid two premium-content-grid" style="margin-top:18px">
      <div class="card"><div class="section-head"><h3>📌 Фокус дня</h3><button class="soft-btn" data-open-modal="quickTask">Добавить</button></div>${todayTasks.length ? todayTasks.map(taskCard).join('') : v10EmptyState('📌','Задач на сегодня нет','Добавь одну главную задачу или включи антихаос-режим.','Добавить задачу','data-open-modal="quickTask"')}</div>
      <div class="card"><div class="section-head"><h3>✅ Привычки</h3><button class="soft-btn" data-page-jump="habits">Открыть</button></div>${habits.length ? `<div class="checkbox-grid">${habits.slice(0,8).map(h => `<label class="check-card"><span><b>${escapeHtml(h.name)}</b><br><span class="sub">${escapeHtml(h.area)}</span></span><input type="checkbox" data-habit="${h.id}" ${state.habitLogs[date]?.[h.id] ? 'checked' : ''}></label>`).join('')}</div>` : v10EmptyState('✅','Привычек пока нет','Добавь одну привычку, которую реально хочется поддерживать.','Добавить привычку','data-open-modal="addHabit"')}</div>
    </div>
    <div class="grid two premium-content-grid" style="margin-top:18px">
      <div class="card"><div class="section-head"><h3>💸 Деньги сегодня</h3><button class="primary-btn" data-open-modal="quickExpense">Расход</button></div>${cats.length ? cats.map(([n,a]) => categoryBar(n, a, total(cats.map(x => ({ amount: x[1] }))))).join('') : v10EmptyState('💸','Сегодня расходов нет','Это хорошо. Или просто ещё не записал.','Записать расход','data-open-modal="quickExpense"')}</div>
      <div class="card close-day-card"><h3>🌙 Закрытие дня</h3><p class="sub">Вечером отметь сон, энергию, настроение, стресс и короткий вывод.</p><div class="pill-list"><span class="tag green">🎮 ${rb.points || 0} баллов</span><span class="tag blue">${money(rb.rub || 0)} на себя</span></div><button class="primary-btn" data-open-modal="closeDay" style="width:100%;margin-top:12px">Закрыть день</button></div>
    </div>
  </div>`;
}

function explainTodayLimit() {
  const s = monthSummary();
  const planned = typeof plannedSummary === 'function' ? plannedSummary(state.settings.currentMonth) : { total: 0, mandatory: 0 };
  const debts = typeof debtSummary === 'function' ? debtSummary() : { openOwe: 0 };
  const leftAfterMandatory = Math.max(0, num(s.left) - num(planned.mandatory));
  const safeLimit = Math.floor(leftAfterMandatory / daysLeftInMonth());
  openCustomModal('📆 Как рассчитан лимит', `
    <div class="v10-limit-explain">
      <div><span>Доходы месяца</span><b>${money(s.income)}</b></div>
      <div><span>Минус расходы на жизнь</span><b>${money(s.expenses)}</b></div>
      <div><span>Минус сейф месяца</span><b>${money(s.allocations || 0)}</b></div>
      <div><span>Остаток месяца</span><b>${money(s.left)}</b></div>
      <div><span>Обязательные платежи впереди</span><b>${money(planned.mandatory)}</b></div>
      <div><span>Долги к возврату</span><b>${money(debts.openOwe || 0)}</b></div>
      <div class="accent"><span>Безопасный лимит на день</span><b>${money(safeLimit)}</b></div>
    </div>
    <p class="sub" style="margin-top:12px">Система не усложняет бюджет: она показывает, сколько можно тратить спокойно, учитывая обязательные платежи и уже внесённый сейф.</p>
    <div class="actions-row"><button class="primary-btn" data-open-modal="plannedExpense">+ Плановый платёж</button><button class="soft-btn" data-page-jump="finance">Открыть деньги</button></div>
  `);
}

function openAntiChaos() {
  const task = state.tasks.find(x => x.status !== 'Готово' && x.status !== 'Отменена');
  const habit = state.habits.find(h => h.active);
  openCustomModal('🆘 Антихаос-режим', `<div class="v10-anti-modal">
    <p class="sub">Не надо идеально. Нужно сохранить контакт с системой.</p>
    <button class="v10-focus-item black" data-open-modal="quickExpense"><i>💸</i><b>Записать 1 расход</b><small>или доход, если был</small></button>
    <button class="v10-focus-item yellow" data-open-modal="quickTask"><i>📌</i><b>${escapeHtml(task?.title || 'Создать маленькую задачу')}</b><small>один минимальный шаг</small></button>
    <button class="v10-focus-item green" data-page-jump="habits"><i>✅</i><b>${escapeHtml(habit?.name || 'Отметить привычку')}</b><small>одна отметка уже победа</small></button>
    <button class="v10-focus-item soft" data-open-modal="closeDay"><i>🌙</i><b>Закрыть день</b><small>сон, энергия, настроение</small></button>
  </div>`);
}


/* =========================
   V14 LIFE ADD-ONS LITE
   Добавляем модули как надстройку к стабильной V12: люди, хотелки, дневник, книги,
   лёгкий трейдинг-журнал, быстрый текстовый ввод и флаг плановых платежей.
   Firebase/cloud-sync не трогаем.
   ========================= */

(function installV14LifeAddons(){
  if (window.__SECOND_BRAIN_V14_LIFE_ADDONS__) return;
  window.__SECOND_BRAIN_V14_LIFE_ADDONS__ = true;

  const V14_VERSION = 'life-addons-lite-v14-20260625';

  function v14EnsureState() {
    state.people = Array.isArray(state.people) ? state.people : [];
    state.wishes = Array.isArray(state.wishes) ? state.wishes : [];
    state.journalEntries = Array.isArray(state.journalEntries) ? state.journalEntries : [];
    state.books = Array.isArray(state.books) ? state.books : [];
    state.tradingAccounts = Array.isArray(state.tradingAccounts) ? state.tradingAccounts : [
      { id: uid(), title: 'Demo', kind: 'demo', balance: 0, active: true },
      { id: uid(), title: 'Real', kind: 'real', balance: 0, active: true }
    ];
    state.trades = Array.isArray(state.trades) ? state.trades : [];
    state.plannedExpenses = Array.isArray(state.plannedExpenses) ? state.plannedExpenses : [];
    state.plannedExpenses.forEach(p => {
      if (p.countInLimit === undefined) p.countInLimit = p.mandatory !== false;
    });
  }

  function v14PushUndo(label) {
    if (typeof pushUndo === 'function') pushUndo(label);
  }

  function v14PageExists(id) { return pages.some(p => p[0] === id); }
  function v14AddPage(afterId, pageDef) {
    if (v14PageExists(pageDef[0])) return;
    const idx = pages.findIndex(p => p[0] === afterId);
    if (idx >= 0) pages.splice(idx + 1, 0, pageDef);
    else pages.push(pageDef);
  }

  v14AddPage('calendar', ['people', '👥', 'Люди']);
  v14AddPage('people', ['wishes', '💛', 'Хотелки']);
  v14AddPage('wishes', ['journal', '🧠', 'Дневник']);
  v14AddPage('journal', ['books', '📚', 'Книги']);
  v14AddPage('books', ['trading', '📈', 'Трейдинг']);

  function v14Empty(icon, title, text, actionText, actionAttr) {
    return `<div class="v14-empty"><i>${icon}</i><b>${escapeHtml(title)}</b><small>${escapeHtml(text)}</small>${actionText ? `<button class="primary-btn" ${actionAttr || ''}>${escapeHtml(actionText)}</button>` : ''}</div>`;
  }

  function v14IsoFromBirthday(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const m = raw.match(/^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?$/);
    if (m) {
      const y = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : '2000';
      return `${y}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;
    }
    return '';
  }

  function v14NextBirthdayDate(iso) {
    const normalized = v14IsoFromBirthday(iso);
    if (!normalized) return '';
    const [, mm, dd] = normalized.split('-');
    const now = new Date();
    let y = now.getFullYear();
    let candidate = new Date(`${y}-${mm}-${dd}T00:00:00`);
    if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      y += 1;
      candidate = new Date(`${y}-${mm}-${dd}T00:00:00`);
    }
    return toDateKey(candidate);
  }

  function v14BirthdayText(iso) {
    const normalized = v14IsoFromBirthday(iso);
    if (!normalized) return 'ДР не указан';
    const [, mm, dd] = normalized.split('-');
    return `${dd}.${mm}`;
  }

  function v14BuildBirthdayCalendarUrl(person) {
    const next = v14NextBirthdayDate(person.birthday) || todayKey();
    const start = new Date(`${next}T10:00:00`);
    const end = new Date(start.getTime() + 30 * 60000);
    const fmt = d => d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const title = encodeURIComponent(`День рождения: ${person.name || 'человек'}`);
    const details = encodeURIComponent([
      person.likes ? `Любит: ${person.likes}` : '',
      person.gifts ? `Идеи подарков: ${person.gifts}` : '',
      person.talkIdeas ? `О чём поговорить: ${person.talkIdeas}` : '',
      'Создано в Second Brain OS'
    ].filter(Boolean).join('\n'));
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&recur=RRULE:FREQ=YEARLY`;
  }

  function v14PriorityValue(p) {
    const map = { 'Высокий': 3, 'Средний': 2, 'Низкий': 1 };
    return map[p] || Number(p || 0) || 0;
  }

  function v14OwnerLabel(owner) {
    if (owner === 'polina') return 'Полина';
    if (owner === 'common') return 'Общее';
    return 'Я';
  }

  const V14_PROMPTS = [
    'Что я сегодня избегаю, хотя это важно?',
    'Какой один маленький шаг даст мне ощущение контроля?',
    'Где я сейчас обманываю себя словами «потом»?',
    'Что я хочу на самом деле, но не формулирую вслух?',
    'Какая трата или привычка сегодня покупает мне спокойствие, а какая — тревогу?',
    'Что я могу сделать сегодня для будущего себя?',
    'С каким человеком мне стоит восстановить контакт или поговорить теплее?',
    'Что я понял о себе за последние сутки?',
    'Что сегодня будет победой, даже если день тяжёлый?',
    'Какой страх мешает мне действовать проще?'
  ];
  function v14DailyPrompt(dateKey = todayKey()) {
    const sum = String(dateKey).split('').reduce((s,ch)=>s+ch.charCodeAt(0),0);
    return V14_PROMPTS[sum % V14_PROMPTS.length];
  }

  function v14PeopleStats() {
    v14EnsureState();
    const total = state.people.length;
    const withBirthday = state.people.filter(p => p.birthday).length;
    const gifts = state.people.filter(p => p.gifts).length;
    return { total, withBirthday, gifts };
  }

  function peopleView() {
    v14EnsureState();
    const sorted = [...state.people].sort((a,b) => (v14NextBirthdayDate(a.birthday) || '9999-99-99').localeCompare(v14NextBirthdayDate(b.birthday) || '9999-99-99'));
    const st = v14PeopleStats();
    return `<div class="v14-page">
      <section class="v14-hero"><div><div class="tiny-label">Life Add-ons</div><h2>Люди</h2><p>Личная база: о чём поговорить, что подарить, когда день рождения и что человек любит.</p></div><button class="primary-btn" data-open-modal="person">+ Человек</button></section>
      <div class="v14-metric-grid">
        ${kpi('👥','Людей', st.total, 'контактов в базе')}
        ${kpi('🎂','ДР указано', st.withBirthday, 'можно добавить в календарь')}
        ${kpi('🎁','Есть подарки', st.gifts, 'идеи подарков')}
      </div>
      <div class="v14-card-grid people-grid">${sorted.length ? sorted.map(v14PersonCard).join('') : v14Empty('👥','Людей пока нет','Добавь Полину, близких, друзей или рабочих контактов.','Добавить человека','data-open-modal="person"')}</div>
    </div>`;
  }

  function v14PersonCard(p) {
    const bday = v14NextBirthdayDate(p.birthday);
    const cal = v14BuildBirthdayCalendarUrl(p);
    return `<article class="card v14-person-card">
      <div class="section-head"><div><h3>${escapeHtml(p.name || 'Без имени')}</h3><p class="sub">${escapeHtml(p.relation || 'человек')} · ${v14BirthdayText(p.birthday)}</p></div><span class="v14-avatar">${escapeHtml((p.name || '?').slice(0,1).toUpperCase())}</span></div>
      <div class="v14-note-block"><b>О чём поговорить</b><p>${escapeHtml(p.talkIdeas || 'Пока нет идей для общения.')}</p></div>
      <div class="v14-tags">
        ${p.likes ? `<span>💛 ${escapeHtml(p.likes)}</span>` : ''}
        ${p.gifts ? `<span>🎁 ${escapeHtml(p.gifts)}</span>` : ''}
        ${bday ? `<span>🎂 ${bday}</span>` : ''}
      </div>
      ${p.notes ? `<p class="sub">${escapeHtml(p.notes)}</p>` : ''}
      <div class="actions-row"><button class="soft-btn" data-action="editPerson" data-person-id="${p.id}">Редактировать</button>${p.birthday ? `<a class="soft-btn" href="${cal}" target="_blank" rel="noopener">📅 ДР в календарь</a>` : ''}<button class="ghost-btn" data-action="deletePerson" data-person-id="${p.id}">Удалить</button></div>
    </article>`;
  }

  function wishesView() {
    v14EnsureState();
    const active = state.wishes.filter(w => w.status !== 'done').sort((a,b)=>v14PriorityValue(b.priority)-v14PriorityValue(a.priority));
    const done = state.wishes.filter(w => w.status === 'done').slice(0,12);
    const top = active.slice(0,3);
    return `<div class="v14-page"><section class="v14-hero"><div><div class="tiny-label">Wishlist</div><h2>Хотелки и мечты</h2><p>Твои, Полины и общие желания. Приоритеты сверху, необязательные идеи не давят на лимит.</p></div><button class="primary-btn" data-open-modal="wish">+ Хотелка</button></section>
      <div class="grid two" style="margin-top:16px"><div class="card"><h3>🔥 Топ приоритетов</h3>${top.length ? top.map(v14WishRow).join('') : v14Empty('💛','Топ пока пуст','Добавь 1–3 желания, чтобы видеть приоритеты.','Добавить хотелку','data-open-modal="wish"')}</div><div class="card"><h3>✅ Исполнено</h3>${done.length ? done.map(v14WishRow).join('') : v14Empty('✅','Архив пуст','Здесь будут исполненные желания.','','')}</div></div>
      <div class="card" style="margin-top:16px"><div class="section-head"><h3>Все активные желания</h3><button class="soft-btn" data-open-modal="wish">Добавить</button></div>${active.length ? `<div class="v14-list">${active.map(v14WishRow).join('')}</div>` : v14Empty('💛','Желаний пока нет','Можно добавить покупку, мечту, подарок или общую идею.','Добавить','data-open-modal="wish"')}</div>
    </div>`;
  }

  function v14WishRow(w) {
    const tone = w.countInLimit ? 'yellow' : 'soft';
    return `<button class="v14-row ${tone}" data-action="editWish" data-wish-id="${w.id}"><i>${w.owner === 'polina' ? '💛' : w.owner === 'common' ? '🤝' : '✨'}</i><b>${escapeHtml(w.title || 'Без названия')}</b><small>${v14OwnerLabel(w.owner)} · ${escapeHtml(w.type || 'идея')} · ${escapeHtml(w.priority || 'Средний')}</small><em>${num(w.price) ? money(w.price) : 'без цены'}</em>${w.countInLimit ? '<span>учитывать</span>' : '<span>не в лимите</span>'}</button>`;
  }

  function journalView() {
    v14EnsureState();
    const prompt = v14DailyPrompt();
    const todayEntry = state.journalEntries.find(x => x.date === todayKey() && x.kind === 'subconscious');
    const entries = [...state.journalEntries].sort((a,b)=>String(b.createdAt||b.date).localeCompare(String(a.createdAt||a.date))).slice(0,20);
    return `<div class="v14-page"><section class="v14-hero v14-journal-hero"><div><div class="tiny-label">Интервью с подсознанием</div><h2>Вопрос дня</h2><p>${escapeHtml(prompt)}</p></div><button class="primary-btn" data-open-modal="journalEntry">Ответить</button></section>
      ${todayEntry ? `<div class="card"><h3>Сегодняшний ответ</h3><p>${escapeHtml(todayEntry.answer)}</p>${todayEntry.insight ? `<p class="sub"><b>Вывод:</b> ${escapeHtml(todayEntry.insight)}</p>` : ''}</div>` : ''}
      <div class="card" style="margin-top:16px"><div class="section-head"><h3>История ответов</h3><button class="soft-btn" data-open-modal="journalEntry">+ Запись</button></div>${entries.length ? `<div class="v14-list">${entries.map(e=>`<div class="v14-history-item"><b>${escapeHtml(e.date || '')}</b><span>${escapeHtml(e.prompt || 'Запись')}</span><p>${escapeHtml(e.answer || '')}</p></div>`).join('')}</div>` : v14Empty('🧠','Записей пока нет','Ответь на один вопрос дня — история начнёт собираться.','Ответить','data-open-modal="journalEntry"')}</div>
    </div>`;
  }

  function booksView() {
    v14EnsureState();
    const reading = state.books.filter(b => b.status !== 'Прочитано').sort((a,b)=>String(b.status).localeCompare(String(a.status)));
    const done = state.books.filter(b => b.status === 'Прочитано');
    return `<div class="v14-page"><section class="v14-hero"><div><div class="tiny-label">Reading OS</div><h2>Книги</h2><p>Не просто список книг: мысли, цитаты и что реально применить в жизни.</p></div><button class="primary-btn" data-open-modal="book">+ Книга</button></section>
      <div class="grid two" style="margin-top:16px"><div class="card"><h3>Читаю / хочу</h3>${reading.length ? reading.map(v14BookCard).join('') : v14Empty('📚','Книг пока нет','Добавь книгу, которую читаешь или хочешь прочитать.','Добавить книгу','data-open-modal="book"')}</div><div class="card"><h3>Прочитано</h3>${done.length ? done.slice(0,12).map(v14BookCard).join('') : v14Empty('✅','Прочитанных пока нет','После завершения книги она попадёт сюда.','','')}</div></div>
    </div>`;
  }

  function v14BookCard(b) {
    const pct = clamp(num(b.progress), 0, 100);
    return `<article class="v14-book-card"><div class="section-head"><div><b>${escapeHtml(b.title || 'Без названия')}</b><p class="sub">${escapeHtml(b.author || 'автор не указан')} · ${escapeHtml(b.status || 'Хочу прочитать')}</p></div><button class="soft-btn" data-action="editBook" data-book-id="${b.id}">Редактировать</button></div><div class="progress"><span style="width:${pct}%"></span></div><p class="sub">${pct}% · ${escapeHtml(b.idea || 'Мыслей пока нет')}</p></article>`;
  }

  function tradingView() {
    v14EnsureState();
    const accounts = state.tradingAccounts.filter(a => a.active !== false);
    const trades = [...state.trades].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    const pnl = trades.reduce((s,t)=>s+num(t.resultRub),0);
    const wins = trades.filter(t=>num(t.resultRub)>0).length;
    const closed = trades.filter(t=>t.status !== 'План');
    const winrate = closed.length ? Math.round(wins/closed.length*100) : 0;
    return `<div class="v14-page"><section class="v14-hero"><div><div class="tiny-label">Trading Lite</div><h2>Дневник трейдера</h2><p>Demo и Real отдельно. Фиксируем сделку, причину входа, ошибку и вывод — без перегруза терминалом.</p></div><div class="actions-row"><button class="soft-btn" data-open-modal="tradingAccount">+ Счёт</button><button class="primary-btn" data-open-modal="trade">+ Сделка</button></div></section>
      <div class="v14-metric-grid">${kpi('📊','PnL', money(pnl), 'по закрытым сделкам')}${kpi('🎯','Winrate', `${winrate}%`, `${closed.length} сделок`)}${kpi('🧪','Счета', accounts.length, 'demo / real')}</div>
      <div class="grid two" style="margin-top:16px"><div class="card"><h3>Счета</h3>${accounts.length ? accounts.map(a=>`<div class="v14-history-item"><b>${escapeHtml(a.title)}</b><span>${a.kind === 'real' ? 'Real' : 'Demo'} · ${money(a.balance)}</span></div>`).join('') : v14Empty('📈','Счетов нет','Создай Demo и Real счёт.','Добавить счёт','data-open-modal="tradingAccount"')}</div><div class="card"><h3>Последние сделки</h3>${trades.length ? trades.slice(0,12).map(v14TradeRow).join('') : v14Empty('📈','Сделок пока нет','Запиши первую сделку с причиной входа и выводом.','Добавить сделку','data-open-modal="trade"')}</div></div>
    </div>`;
  }

  function v14TradeRow(t) {
    return `<button class="v14-row ${num(t.resultRub) >= 0 ? 'green' : 'danger'}" data-action="editTrade" data-trade-id="${t.id}"><i>${t.side === 'sell' ? '🔻' : '🔺'}</i><b>${escapeHtml(t.instrument || 'Инструмент')}</b><small>${escapeHtml(t.accountKind || '')} · ${escapeHtml(t.date || '')} · риск ${escapeHtml(t.risk || '—')}%</small><em>${money(t.resultRub)}</em></button>`;
  }

  function quickCaptureCard() {
    return `<div class="card v14-quick-capture"><div class="section-head"><div><h3>⚡ Быстрая строка</h3><p class="sub">Подготовлено под iPhone Shortcut: формат <b>-500 кафе</b> или <b>+30000 аванс</b>. Telegram подключим отдельным безопасным слоем, без токена в GitHub.</p></div><button class="soft-btn" data-action="quickCaptureHelp">Как писать?</button></div><div class="v14-inline-form"><input id="v14QuickText" placeholder="-500 кофе / +30000 аванс"><button class="primary-btn" data-action="quickCaptureSave">Записать</button></div></div>`;
  }

  const __v14BaseQuick = quick;
  quick = function() {
    return quickCaptureCard() + __v14BaseQuick();
  };

  function v14ParseQuickText(raw) {
    const text = String(raw || '').trim();
    const m = text.match(/^([+-])\s*([0-9]+(?:[\s.,][0-9]+)?)\s*(.*)$/);
    if (!m) return null;
    const sign = m[1];
    const amount = num(m[2]);
    const note = (m[3] || '').trim() || (sign === '+' ? 'Быстрый доход' : 'Быстрый расход');
    return { type: sign === '+' ? 'income' : 'expense', amount, note };
  }

  function v14SaveQuickText(text, source = 'quick-line') {
    v14EnsureState();
    const parsed = v14ParseQuickText(text);
    if (!parsed || !parsed.amount) return toast('Формат: -500 кафе или +30000 аванс');
    const category = parsed.type === 'income' ? 'Другое' : 'Другое';
    v14PushUndo('быстрый ввод');
    state.operations.push({ id: uid(), date: todayKey(), type: parsed.type, amount: parsed.amount, category, note: parsed.note, emotion: source });
    save();
    render();
    toast(`${parsed.type === 'income' ? 'Доход' : 'Расход'} записан: ${money(parsed.amount)}`);
  }

  function v14HandleQuickUrl() {
    try {
      const url = new URL(location.href);
      const raw = url.searchParams.get('quick') || (location.hash.startsWith('#quick=') ? decodeURIComponent(location.hash.slice(7)) : '');
      if (!raw) return;
      const key = 'v14quick:' + raw;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      v14SaveQuickText(raw, 'iPhone Shortcut');
      url.searchParams.delete('quick');
      history.replaceState(null, '', url.pathname + url.search + (location.hash.startsWith('#quick=') ? '' : location.hash));
    } catch(e) { console.warn(e); }
  }

  function v14ModalPerson(existingId='') {
    const p = state.people.find(x => x.id === existingId) || {};
    openCustomModal(existingId ? '👥 Редактировать человека' : '👥 Добавить человека', `<div class="form-grid"><label>Имя<input id="v14PersonName" value="${escapeAttr(p.name || '')}" placeholder="Полина, друг, коллега"></label><label>Кто это<input id="v14PersonRelation" value="${escapeAttr(p.relation || '')}" placeholder="девушка / друг / работа"></label><label>День рождения<input id="v14PersonBirthday" type="date" value="${escapeAttr(v14IsoFromBirthday(p.birthday) || '')}"></label><label class="full">Что любит<input id="v14PersonLikes" value="${escapeAttr(p.likes || '')}" placeholder="кофе, море, украшения, книги"></label><label class="full">О чём поговорить<textarea id="v14PersonTalk" rows="3" class="note-area">${escapeHtml(p.talkIdeas || '')}</textarea></label><label class="full">Идеи подарков<textarea id="v14PersonGifts" rows="3" class="note-area">${escapeHtml(p.gifts || '')}</textarea></label><label class="full">Заметки<textarea id="v14PersonNotes" rows="3" class="note-area">${escapeHtml(p.notes || '')}</textarea></label></div><div class="actions-row"><button class="primary-btn" id="v14SavePerson">Сохранить</button></div>`);
    document.getElementById('v14SavePerson').onclick = () => {
      const name = val('v14PersonName').trim();
      if (!name) return toast('Введи имя');
      v14PushUndo(existingId ? 'редактирование человека' : 'добавление человека');
      const data = { name, relation: val('v14PersonRelation'), birthday: val('v14PersonBirthday'), likes: val('v14PersonLikes'), talkIdeas: val('v14PersonTalk'), gifts: val('v14PersonGifts'), notes: val('v14PersonNotes'), updatedAt: new Date().toISOString() };
      if (existingId && p.id) Object.assign(p, data);
      else state.people.push({ id: uid(), ...data, createdAt: new Date().toISOString() });
      save(); closeModal(); activePage = 'people'; render(); toast('Человек сохранён');
    };
  }

  function v14ModalWish(existingId='') {
    const w = state.wishes.find(x => x.id === existingId) || { owner:'self', priority:'Средний', type:'покупка', countInLimit:false };
    openCustomModal(existingId ? '💛 Редактировать хотелку' : '💛 Добавить хотелку', `<div class="form-grid"><label class="full">Название<input id="v14WishTitle" value="${escapeAttr(w.title || '')}" placeholder="Что хочется / мечта / подарок"></label><label>Кому<select id="v14WishOwner"><option value="self" ${w.owner==='self'?'selected':''}>Мне</option><option value="polina" ${w.owner==='polina'?'selected':''}>Полине</option><option value="common" ${w.owner==='common'?'selected':''}>Общее</option></select></label><label>Тип<input id="v14WishType" value="${escapeAttr(w.type || 'покупка')}"></label><label>Приоритет<select id="v14WishPriority"><option ${w.priority==='Высокий'?'selected':''}>Высокий</option><option ${w.priority==='Средний'?'selected':''}>Средний</option><option ${w.priority==='Низкий'?'selected':''}>Низкий</option></select></label><label>Цена<input id="v14WishPrice" type="number" value="${escapeAttr(w.price || '')}"></label><label class="full"><input id="v14WishCount" type="checkbox" ${w.countInLimit ? 'checked' : ''}> Учитывать в планировании лимита</label><label class="full">Заметка<textarea id="v14WishNote" rows="3" class="note-area">${escapeHtml(w.note || '')}</textarea></label></div><div class="actions-row"><button class="primary-btn" id="v14SaveWish">Сохранить</button>${existingId ? '<button class="soft-btn" id="v14DoneWish">Исполнено</button>' : ''}</div>`);
    document.getElementById('v14SaveWish').onclick = () => {
      const title = val('v14WishTitle').trim();
      if (!title) return toast('Введи название');
      v14PushUndo(existingId ? 'редактирование хотелки' : 'добавление хотелки');
      const data = { title, owner: val('v14WishOwner') || 'self', type: val('v14WishType') || 'идея', priority: val('v14WishPriority') || 'Средний', price: num(val('v14WishPrice')), countInLimit: document.getElementById('v14WishCount')?.checked || false, note: val('v14WishNote'), updatedAt: new Date().toISOString() };
      if (existingId && w.id) Object.assign(w, data);
      else state.wishes.push({ id: uid(), ...data, status:'active', createdAt: new Date().toISOString() });
      save(); closeModal(); activePage='wishes'; render(); toast('Хотелка сохранена');
    };
    const done = document.getElementById('v14DoneWish');
    if (done) done.onclick = () => { w.status = 'done'; w.doneAt = todayKey(); save(); closeModal(); render(); toast('Хотелка перенесена в исполненные'); };
  }

  function v14ModalJournal() {
    const prompt = v14DailyPrompt();
    const existing = state.journalEntries.find(x => x.date === todayKey() && x.kind === 'subconscious') || {};
    openCustomModal('🧠 Интервью с подсознанием', `<p class="sub"><b>Вопрос дня:</b> ${escapeHtml(prompt)}</p><div class="form-grid"><label class="full">Ответ<textarea id="v14JournalAnswer" rows="6" class="note-area" placeholder="Пиши свободно, без цензуры">${escapeHtml(existing.answer || '')}</textarea></label><label class="full">Главный вывод<input id="v14JournalInsight" value="${escapeAttr(existing.insight || '')}" placeholder="Что я понял?"></label></div><div class="actions-row"><button class="primary-btn" id="v14SaveJournal">Сохранить</button></div>`);
    document.getElementById('v14SaveJournal').onclick = () => {
      const answer = val('v14JournalAnswer').trim();
      if (!answer) return toast('Напиши ответ');
      v14PushUndo('запись дневника');
      const data = { kind:'subconscious', date: todayKey(), prompt, answer, insight: val('v14JournalInsight'), updatedAt:new Date().toISOString(), createdAt: existing.createdAt || new Date().toISOString() };
      if (existing.id) Object.assign(existing, data);
      else state.journalEntries.unshift({ id:uid(), ...data });
      save(); closeModal(); activePage='journal'; render(); toast('Запись сохранена');
    };
  }

  function v14ModalBook(existingId='') {
    const b = state.books.find(x => x.id === existingId) || { status:'Хочу прочитать', progress:0 };
    openCustomModal(existingId ? '📚 Редактировать книгу' : '📚 Добавить книгу', `<div class="form-grid"><label>Название<input id="v14BookTitle" value="${escapeAttr(b.title || '')}"></label><label>Автор<input id="v14BookAuthor" value="${escapeAttr(b.author || '')}"></label><label>Статус<select id="v14BookStatus"><option ${b.status==='Хочу прочитать'?'selected':''}>Хочу прочитать</option><option ${b.status==='Читаю'?'selected':''}>Читаю</option><option ${b.status==='Прочитано'?'selected':''}>Прочитано</option></select></label><label>Прогресс %<input id="v14BookProgress" type="number" min="0" max="100" value="${escapeAttr(b.progress || 0)}"></label><label class="full">Главная мысль<input id="v14BookIdea" value="${escapeAttr(b.idea || '')}" placeholder="Что забираю в жизнь?"></label><label class="full">Цитаты / заметки<textarea id="v14BookNotes" rows="4" class="note-area">${escapeHtml(b.notes || '')}</textarea></label></div><div class="actions-row"><button class="primary-btn" id="v14SaveBook">Сохранить</button></div>`);
    document.getElementById('v14SaveBook').onclick = () => {
      const title = val('v14BookTitle').trim(); if (!title) return toast('Введи название книги');
      v14PushUndo(existingId ? 'редактирование книги' : 'добавление книги');
      const data = { title, author: val('v14BookAuthor'), status: val('v14BookStatus'), progress: clamp(num(val('v14BookProgress')),0,100), idea: val('v14BookIdea'), notes: val('v14BookNotes'), updatedAt: new Date().toISOString() };
      if (existingId && b.id) Object.assign(b, data);
      else state.books.push({ id:uid(), ...data, createdAt:new Date().toISOString() });
      save(); closeModal(); activePage='books'; render(); toast('Книга сохранена');
    };
  }

  function v14ModalTradingAccount() {
    openCustomModal('📈 Добавить торговый счёт', `<div class="form-grid"><label>Название<input id="v14AccTitle" placeholder="Demo / Real / FTMO"></label><label>Тип<select id="v14AccKind"><option value="demo">Demo</option><option value="real">Real</option></select></label><label>Баланс<input id="v14AccBalance" type="number"></label></div><div class="actions-row"><button class="primary-btn" id="v14SaveAcc">Сохранить</button></div>`);
    document.getElementById('v14SaveAcc').onclick = () => {
      v14PushUndo('торговый счёт');
      state.tradingAccounts.push({ id:uid(), title: val('v14AccTitle') || 'Trading Account', kind: val('v14AccKind') || 'demo', balance: num(val('v14AccBalance')), active:true });
      save(); closeModal(); activePage='trading'; render(); toast('Счёт добавлен');
    };
  }

  function v14ModalTrade(existingId='') {
    const t = state.trades.find(x => x.id === existingId) || { date:todayKey(), side:'buy', status:'Закрыта' };
    const accountOptions = state.tradingAccounts.filter(a=>a.active!==false).map(a=>`<option value="${a.id}" ${t.accountId===a.id?'selected':''}>${escapeHtml(a.title)} · ${a.kind}</option>`).join('');
    openCustomModal(existingId ? '📈 Редактировать сделку' : '📈 Добавить сделку', `<div class="form-grid"><label>Дата<input id="v14TradeDate" type="date" value="${escapeAttr(t.date || todayKey())}"></label><label>Счёт<select id="v14TradeAccount">${accountOptions}</select></label><label>Инструмент<input id="v14TradeInstrument" value="${escapeAttr(t.instrument || '')}" placeholder="EURUSD / XAUUSD"></label><label>Тип<select id="v14TradeSide"><option value="buy" ${t.side==='buy'?'selected':''}>Buy / Long</option><option value="sell" ${t.side==='sell'?'selected':''}>Sell / Short</option></select></label><label>Риск %<input id="v14TradeRisk" type="number" value="${escapeAttr(t.risk || '')}"></label><label>Результат ₽<input id="v14TradeResult" type="number" value="${escapeAttr(t.resultRub || '')}"></label><label class="full">Причина входа<textarea id="v14TradeReason" rows="3" class="note-area">${escapeHtml(t.reason || '')}</textarea></label><label class="full">Ошибка / вывод<textarea id="v14TradeLesson" rows="3" class="note-area">${escapeHtml(t.lesson || '')}</textarea></label></div><div class="actions-row"><button class="primary-btn" id="v14SaveTrade">Сохранить</button></div>`);
    document.getElementById('v14SaveTrade').onclick = () => {
      const acc = state.tradingAccounts.find(a=>a.id===val('v14TradeAccount')) || {};
      v14PushUndo(existingId ? 'редактирование сделки' : 'добавление сделки');
      const data = { date: val('v14TradeDate') || todayKey(), accountId: acc.id || '', accountKind: acc.kind || '', instrument: val('v14TradeInstrument'), side: val('v14TradeSide') || 'buy', risk: num(val('v14TradeRisk')), resultRub: num(val('v14TradeResult')), reason: val('v14TradeReason'), lesson: val('v14TradeLesson'), status:'Закрыта', updatedAt:new Date().toISOString() };
      if (existingId && t.id) Object.assign(t, data);
      else state.trades.unshift({ id:uid(), ...data, createdAt:new Date().toISOString() });
      save(); closeModal(); activePage='trading'; render(); toast('Сделка сохранена');
    };
  }

  // Плановые платежи: добавляем флаг «учитывать в лимите / не учитывать».
  plannedSummary = function(monthKey = state.settings.currentMonth) {
    v14EnsureState();
    const list = plannedForMonth(monthKey);
    const counted = list.filter(x => x.countInLimit !== false);
    return {
      list,
      total: list.reduce((s,x)=>s+num(x.amount),0),
      counted: counted.reduce((s,x)=>s+num(x.amount),0),
      ignored: list.filter(x => x.countInLimit === false).reduce((s,x)=>s+num(x.amount),0),
      mandatory: counted.filter(x=>x.mandatory).reduce((s,x)=>s+num(x.amount),0)
    };
  };

  openPlannedExpenseModal = function() {
    openCustomModal('📌 Плановый расход', `<div class="form-grid"><label>Название<input id="plannedTitle" placeholder="Аренда, связь, кредит, покупка"></label><label>Сумма<input id="plannedAmount" type="number"></label><label>Категория<select id="plannedCategory">${categoryOptions('expense')}</select></label><label>День месяца<input id="plannedDay" type="number" min="1" max="28" value="1"></label><label>Месяц<input id="plannedMonth" type="month" value="${nextMonthKey()}"></label><label>Тип<select id="plannedType"><option value="mandatory">Обязательный</option><option value="optional">Плановый</option></select></label><label><input id="plannedRecurring" type="checkbox"> Повторять каждый месяц</label><label class="full"><input id="plannedCountInLimit" type="checkbox" checked> Учитывать в лимите и прогнозе</label><p class="sub full">Сними галочку, если это просто идея/хотелка и она не должна уменьшать дневной лимит.</p></div><div class="actions-row"><button class="primary-btn" id="savePlannedExpenseBtn">Сохранить</button></div>`);
    document.getElementById('savePlannedExpenseBtn').onclick = () => { const amount=num(val('plannedAmount')); if(!amount) return toast('Введи сумму'); v14PushUndo('плановый расход'); state.plannedExpenses.push({ id:uid(), title:val('plannedTitle') || val('plannedCategory') || 'Плановый расход', amount, category:val('plannedCategory') || 'Запланированные расходы', day:num(val('plannedDay')) || 1, month:val('plannedMonth') || nextMonthKey(), mandatory:val('plannedType') === 'mandatory', recurring:document.getElementById('plannedRecurring')?.checked || false, countInLimit: document.getElementById('plannedCountInLimit')?.checked !== false, active:true }); save(); closeModal(); render(); toast('Плановый расход добавлен'); };
  };

  const __v14OpenModal = openModal;
  openModal = function(type) {
    v14EnsureState();
    if (type === 'person') return v14ModalPerson();
    if (type === 'wish') return v14ModalWish();
    if (type === 'journalEntry') return v14ModalJournal();
    if (type === 'book') return v14ModalBook();
    if (type === 'tradingAccount') return v14ModalTradingAccount();
    if (type === 'trade') return v14ModalTrade();
    return __v14OpenModal(type);
  };

  const __v14RouteAction = routeAction;
  routeAction = function(a, el, e) {
    v14EnsureState();
    if (a === 'quickCaptureSave') return v14SaveQuickText(document.getElementById('v14QuickText')?.value || '');
    if (a === 'quickCaptureHelp') return openCustomModal('⚡ Быстрая строка', `<p class="sub">Пиши одну строку:</p><div class="v14-codebox">-500 кофе<br>+30000 аванс<br>-1200 такси<br>+4500 возврат</div><p class="sub">Для iPhone Shortcut можно открыть ссылку приложения с параметром <b>&quick=-500%20кофе</b>. Telegram подключим отдельным безопасным серверным слоем, чтобы не хранить токен бота в GitHub.</p>`);
    if (a === 'editPerson') return v14ModalPerson(el.dataset.personId);
    if (a === 'deletePerson') { const id = el.dataset.personId; if(confirm('Удалить человека из базы?')) { v14PushUndo('удаление человека'); state.people = state.people.filter(p=>p.id!==id); save(); render(); } return; }
    if (a === 'editWish') return v14ModalWish(el.dataset.wishId);
    if (a === 'editBook') return v14ModalBook(el.dataset.bookId);
    if (a === 'editTrade') return v14ModalTrade(el.dataset.tradeId);
    return __v14RouteAction(a, el, e);
  };

  const v14Views = { people: peopleView, wishes: wishesView, journal: journalView, books: booksView, trading: tradingView };
  const __v14BaseRender = render;
  render = function(opts = {}) {
    v14EnsureState();
    if (!v14Views[activePage]) return __v14BaseRender(opts);
    renderNav();
    const page = pages.find(p => p[0] === activePage);
    document.getElementById('pageTitle').textContent = page ? page[2] : 'Second Brain';
    document.getElementById('todayMini').innerHTML = `${new Date().toLocaleDateString('ru-RU')}<br>${monthLabel(state.settings.currentMonth)}<br><span class="tag green">Life Score ${lifeScore()}/100</span>`;
    document.getElementById('view').innerHTML = v14Views[activePage](opts);
    bindView();
  };

  const __v14SetStateFromCloud = window.SecondBrainApp?.setStateFromCloud;

  const __v14Init = init;
  init = function() {
    v14EnsureState();
    __v14Init();
    setTimeout(v14HandleQuickUrl, 250);
  };

  v14EnsureState();
  console.log('Second Brain LIFE ADD-ONS V14 loaded');
})();

console.log('Second Brain INSPECTION FIX V11 loaded');

window.SecondBrainApp = {
  getState: () => state,
  setStateFromCloud: (cloudState) => {
    if (!cloudState || typeof cloudState !== 'object') return;
    state = migrate(cloudState);
    enhanceGoalGameState();
    save({ skipCloud: true });
    render();
    toast('Данные загружены из облака');
  },
  toast,
  render,
  migrate,
  exportBackup
};

enhanceGoalGameState();
console.log('Second Brain PREMIUM FINANCE V9 app.js loaded');
init();
if (window.SecondBrainCloud) {
  window.SecondBrainCloud.init().then(() => {
    try { if (activePage === 'sync') render(); } catch(e) {}
  });
}

console.log('Second Brain LIFE ADD-ONS V14 app.js loaded');
