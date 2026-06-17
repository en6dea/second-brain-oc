'use strict';

const RU_MONTHS = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const STORE_KEY = 'secondBrainOS.v1';

const defaultData = () => ({
  settings: {
    currentMonth: toMonthKey(new Date()),
    currency: '₽',
    allocation: { savings: 10, cushion: 10, goal: 10, life: 70 },
    categories: ['Продукты','Кафе','Транспорт','Дом','Здоровье','Одежда','Подписки','Подарки','Обучение','Развлечения','Путешествия','Импульсные','Финансовая цель','Сбережения','Подушка'],
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

const pages = [
  ['dashboard', '🏠', 'Главная'],
  ['quick', '⚡', 'Быстрый ввод'],
  ['finance', '💸', 'Деньги'],
  ['panel', '🎛', 'Панель анализа'],
  ['goals', '🎯', 'SMART-цели'],
  ['habits', '✅', 'Привычки'],
  ['tasks', '📌', 'Задачи'],
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
  return { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}), allocation: { ...base.settings.allocation, ...((data.settings||{}).allocation||{}) } } };
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
  const expenses = total(expenseOps(monthKey));
  const a = state.settings.allocation;
  const savings = income * a.savings / 100;
  const cushion = income * a.cushion / 100;
  const goal = income * a.goal / 100;
  const life = income * a.life / 100;
  const left = income - savings - cushion - goal - expenses;
  const dailyLimit = Math.max(0, left / daysLeftInMonth(monthKey));
  return { income, expenses, savings, cushion, goal, life, left, dailyLimit };
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

function init() {
  renderNav();
  bindGlobal();
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
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
  const map = { dashboard, quick, finance, panel, goals, habits, tasks, state: stateView, insights, sync: syncView, settings };
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
      ${kpi('💰','Доход', money(s.income), `Распределение 10/10/10/${state.settings.allocation.life}`)}
      ${kpi('💸','Расходы', money(s.expenses), `Остаток: ${money(s.left)}`)}
      ${kpi('📆','Лимит/день', money(s.dailyLimit), `До конца месяца: ${daysLeftInMonth()} дн.`)}
      ${kpi('✅','Привычки', `${h.percent}%`, `${h.done} отметок за месяц`)}
    </div>
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
      <button class="soft-btn" data-open-modal="quickIncome">💰 Доход</button>
      <button class="soft-btn" data-open-modal="quickTask">📌 Задача</button>
      <button class="soft-btn" data-open-modal="quickGoal">🎯 SMART-цель</button>
      <button class="soft-btn" data-open-modal="closeDay">🌙 Закрыть день</button>
      <button class="soft-btn" data-open-modal="wantBuy">🛒 Хочу купить</button>
    </div></div>
    <div class="card"><h3>📌 Сегодня достаточно</h3><div class="pill-list"><span class="tag">Записать расходы</span><span class="tag">Отметить привычки</span><span class="tag">Закрыть день</span></div><p class="sub" style="margin-top:14px">Не надо вести всё идеально. Система должна помогать, а не давить.</p></div>
    <div class="card"><h3>🧾 Последние записи</h3>${recentOperationsTable(6)}</div>
  </div>`;
}

function finance() {
  const rows = [...state.operations].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,80);
  const s = monthSummary();
  const undo = lastDeletedOperation ? `<div class="card" style="margin-top:16px;background:#fff8eb"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><h3>↩️ Последнее удаление</h3><p class="sub">${operationLabel(lastDeletedOperation)}</p></div><button class="soft-btn" data-action="undoDeleteOp">Восстановить</button></div></div>` : '';
  return `<div class="grid cards">
    ${kpi('💰','Доход месяца', money(s.income), 'Факт по операциям')}
    ${kpi('💸','Расход месяца', money(s.expenses), 'Факт по операциям')}
    ${kpi('🏦','Сбережения 10%', money(s.savings), 'Автораспределение')}
    ${kpi('🎯','Финцель 10%', money(s.goal), 'Автораспределение')}
  </div>
  ${undo}
  <div class="card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><h3>💸 Операции</h3><div class="actions-row" style="margin:0"><button class="soft-btn" data-open-modal="csvImport">📥 CSV импорт</button><button class="primary-btn" data-open-modal="quickExpense">Добавить</button></div></div>${table(['Дата','Тип','Сумма','Категория','Комментарий',''], rows.map(operationRow))}</div>`;
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

function panel(opts = {}) {
  const search = opts.search || document.getElementById('globalSearch')?.value || '';
  const from = localStorage.getItem('panel.from') || `${state.settings.currentMonth}-01`;
  const to = localStorage.getItem('panel.to') || `${state.settings.currentMonth}-31`;
  const cats = categoryTotals(from, to);
  const ops = state.operations.filter(o => dateBetween(o.date, from, to) && (!search || JSON.stringify(o).toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date));
  return `<div class="card"><h3>🎛 Панель управления</h3><p class="sub">Подними любой период, посмотри категории и найди старые операции.</p><div class="form-grid"><label>С даты<input id="panelFrom" type="date" value="${from}"></label><label>По дату<input id="panelTo" type="date" value="${to}"></label></div><div class="actions-row"><button class="primary-btn" data-action="applyPeriod">Показать период</button><button class="soft-btn" data-action="currentMonthPeriod">Текущий месяц</button><button class="soft-btn" data-open-modal="weeklyReport">📅 Собрать неделю</button></div></div>
  <div class="grid two" style="margin-top:16px"><div class="card"><h3>Категории периода</h3>${cats.length ? cats.map(([n,a]) => categoryBar(n,a,total(cats.map(x=>({amount:x[1]}))))).join('') : empty('Нет расходов')}</div><div class="card"><h3>Поиск операций</h3><input id="panelSearch" class="search" style="width:100%" placeholder="Например: кафе, ozon, такси" value="${search}"><div style="margin-top:12px">${table(['Дата','Тип','Сумма','Категория','Комментарий',''], ops.slice(0,20).map(operationRow))}</div></div></div>`;
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
  const rows = state.tasks.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).map(t => {
    const goal = state.goals.find(g => g.id === t.goalId);
    const danger = t.status !== 'Готово' && t.due && t.due < todayKey();
    return [t.title, goal?.title || '', t.area, t.priority, t.due || '', danger ? '<span class="tag danger">Просрочено</span>' : t.status, t.nextAction || '', `<button class="ghost-btn" data-toggle-task="${t.id}">${t.status === 'Готово' ? 'Вернуть' : 'Готово'}</button>`];
  });
  return `<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><h3>📌 Задачи</h3><button class="primary-btn" data-open-modal="quickTask">Добавить задачу</button></div>${table(['Задача','Цель','Сфера','Приоритет','Дедлайн','Статус','Следующий шаг',''], rows)}</div>`;
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
  const configured = !!st.configured;
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
  return `<div class="grid two"><div class="card"><h3>⚙️ Настройки системы</h3><div class="form-grid"><label>Текущий месяц<input id="setMonth" type="month" value="${state.settings.currentMonth}"></label><label>Валюта<input id="setCurrency" value="${state.settings.currency}"></label><label>Сбережения %<input id="setSavings" type="number" value="${a.savings}"></label><label>Подушка %<input id="setCushion" type="number" value="${a.cushion}"></label><label>Финцель %<input id="setGoal" type="number" value="${a.goal}"></label><label>На жизнь %<input id="setLife" type="number" value="${a.life}"></label></div><div class="actions-row"><button class="primary-btn" data-action="saveSettings">Сохранить</button><button class="soft-btn" data-action="repair">Проверить систему</button></div></div><div class="card"><h3>📦 Данные</h3><p class="sub">Всё хранится локально в браузере. Для безопасности периодически делай бэкап.</p><div class="actions-row"><button class="soft-btn" data-action="backup">Скачать бэкап</button><label class="soft-btn">Загрузить бэкап<input id="backupInput" type="file" accept=".json" hidden></label><button class="danger-btn" data-action="resetAll">Очистить всё</button></div></div></div>`;
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

function bindView() {
  document.querySelectorAll('[data-page-jump]').forEach(b => b.onclick = () => { activePage = b.dataset.pageJump; render(); });
  document.querySelectorAll('[data-open-modal]').forEach(b => b.onclick = () => openModal(b.dataset.openModal));
  document.querySelectorAll('[data-delete-op]').forEach(b => b.onclick = () => deleteOperation(b.dataset.deleteOp));
  document.querySelectorAll('[data-delete-goal]').forEach(b => b.onclick = () => { const g = state.goals.find(x=>x.id===b.dataset.deleteGoal); if(g) g.status = 'Отменена'; save(); render(); });
  document.querySelectorAll('[data-hide-habit]').forEach(b => b.onclick = () => { const h = state.habits.find(x=>x.id===b.dataset.hideHabit); if(h) h.active = false; save(); render(); });
  document.querySelectorAll('[data-toggle-task]').forEach(b => b.onclick = () => { const t = state.tasks.find(x=>x.id===b.dataset.toggleTask); if(t) t.status = t.status === 'Готово' ? 'В работе' : 'Готово'; save(); render(); });
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
}
function actionHandler(e) {
  const a = e.currentTarget.dataset.action;
  if (a === 'applyPeriod') { localStorage.setItem('panel.from', document.getElementById('panelFrom').value); localStorage.setItem('panel.to', document.getElementById('panelTo').value); render(); }
  if (a === 'currentMonthPeriod') { localStorage.setItem('panel.from', `${state.settings.currentMonth}-01`); localStorage.setItem('panel.to', `${state.settings.currentMonth}-31`); render(); }
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
}
function cloudCredentials() {
  return {
    email: document.getElementById('cloudEmail')?.value?.trim() || '',
    password: document.getElementById('cloudPassword')?.value || ''
  };
}
function cloudRegister() {
  const c = cloudCredentials();
  if (!c.email || !c.password) return toast('Введи email и пароль');
  window.SecondBrainCloud?.register(c.email, c.password);
}
function cloudLogin() {
  const c = cloudCredentials();
  if (!c.email || !c.password) return toast('Введи email и пароль');
  window.SecondBrainCloud?.login(c.email, c.password);
}

function saveSettings() {
  state.settings.currentMonth = document.getElementById('setMonth').value || toMonthKey(new Date());
  state.settings.currency = document.getElementById('setCurrency').value || '₽';
  state.settings.allocation = {
    savings: num(document.getElementById('setSavings').value),
    cushion: num(document.getElementById('setCushion').value),
    goal: num(document.getElementById('setGoal').value),
    life: num(document.getElementById('setLife').value),
  };
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
  const catOptions = state.settings.categories.map(c=>`<option>${c}</option>`).join('');
  const areaOptions = state.settings.areas.map(c=>`<option>${c}</option>`).join('');
  const goalOptions = ['<option value="">Без цели</option>', ...state.goals.filter(g=>g.status!=='Готово'&&g.status!=='Отменена').map(g=>`<option value="${g.id}">${g.title}</option>`)].join('');
  if (type === 'quickExpense') return { title:'💸 Добавить расход', body:`<div class="form-grid"><label>Дата<input id="mDate" type="date" value="${todayKey()}"></label><label>Сумма<input id="mAmount" type="number" placeholder="0"></label><label>Категория<select id="mCategory">${catOptions}</select></label><label>Эмоция<select id="mEmotion"><option>Нейтрально</option><option>Нужно</option><option>Стресс</option><option>Импульс</option><option>Радость</option></select></label><label class="full">Комментарий<input id="mNote" placeholder="Например: кофе, продукты, такси"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="expense">Добавить</button></div>` };
  if (type === 'quickIncome') return { title:'💰 Добавить доход', body:`<div class="form-grid"><label>Дата<input id="mDate" type="date" value="${todayKey()}"></label><label>Сумма<input id="mAmount" type="number" placeholder="0"></label><label class="full">Источник<input id="mNote" placeholder="Зарплата, проект, подарок"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="income">Добавить и распределить</button></div>` };
  if (type === 'quickTask') return { title:'📌 Добавить задачу', body:`<div class="form-grid"><label class="full">Задача<input id="tTitle" placeholder="Что сделать?"></label><label>Сфера<select id="tArea">${areaOptions}</select></label><label>Цель<select id="tGoal">${goalOptions}</select></label><label>Дедлайн<input id="tDue" type="date"></label><label>Приоритет<select id="tPriority"><option>Средний</option><option>Высокий</option><option>Низкий</option></select></label><label class="full">Следующий шаг<input id="tNext" placeholder="Самое маленькое действие"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="task">Добавить</button></div>` };
  if (type === 'quickGoal') return { title:'🎯 SMART-цель', body:`<div class="form-grid"><label class="full">Название цели<input id="gTitle" placeholder="Например: накопить 150 000 ₽"></label><label>Сфера<select id="gArea">${areaOptions}</select></label><label>Метрика<input id="gMetric" placeholder="₽, тренировки, часы"></label><label>Цель в цифре<input id="gTarget" type="number" placeholder="150000"></label><label>Текущее значение<input id="gCurrent" type="number" placeholder="0"></label><label>Дедлайн<input id="gDeadline" type="date"></label><label class="full">Почему важно<textarea id="gWhy" placeholder="Зачем мне эта цель?"></textarea></label><label class="full">Следующий шаг<input id="gNext" placeholder="Первое действие"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="goal">Добавить цель</button></div>` };
  if (type === 'addHabit') return { title:'✅ Новая привычка', body:`<div class="form-grid"><label class="full">Название<input id="hName" placeholder="Например: 20 минут ходьбы"></label><label>Сфера<select id="hArea">${areaOptions}</select></label><label>Цель раз в неделю<input id="hTarget" type="number" value="5"></label></div><div class="actions-row"><button class="primary-btn" data-modal-save="habit">Добавить</button></div>` };
  if (type === 'closeDay') return { title:'🌙 Закрыть день', body:`<div class="form-grid"><label>Дата<input id="dDate" type="date" value="${todayKey()}"></label><label>Сон, часов<input id="dSleep" type="number" step="0.5" value="7"></label><label>Энергия 1–10<input id="dEnergy" type="number" min="1" max="10" value="7"></label><label>Настроение 1–10<input id="dMood" type="number" min="1" max="10" value="7"></label><label>Стресс 1–10<input id="dStress" type="number" min="1" max="10" value="4"></label><label class="full">Итог дня<textarea id="dNote" placeholder="Что получилось? Что понял?"></textarea></label></div><h3 style="margin-top:18px">Привычки</h3><div class="checkbox-grid">${state.habits.filter(h=>h.active).map(h=>`<label class="check-card"><span>${h.name}</span><input type="checkbox" data-day-habit="${h.id}"></label>`).join('')}</div><div class="actions-row"><button class="primary-btn" data-modal-save="day">Закрыть день</button></div>` };
  if (type === 'wantBuy') return { title:'🛒 Хочу купить', body:`<div class="form-grid"><label class="full">Что купить<input id="bName" placeholder="Например: кроссовки"></label><label>Сумма<input id="bAmount" type="number" placeholder="0"></label><label>Категория<select id="bCategory">${catOptions}</select></label><label>Эмоция<select id="bEmotion"><option>Нужно</option><option>Хочу</option><option>Стресс</option><option>Импульс</option></select></label></div><div id="buyResult" class="empty" style="margin-top:14px">Заполни сумму, и система оценит покупку.</div><div class="actions-row"><button class="soft-btn" data-modal-action="checkBuy">Проверить</button><button class="primary-btn" data-modal-save="buyExpense">Купить и записать</button></div>` };
  if (type === 'weeklyReport') return { title:'📅 Недельный отчёт', body:`<div class="empty">Собрать отчёт за последние 7 дней?</div><div class="actions-row"><button class="primary-btn" data-modal-save="week">Собрать</button></div>` };
  if (type === 'csvImport') return { title:'📥 CSV импорт', body:`<p class="sub">Загрузи CSV-выписку. После импорта вручную назначь категории и перенеси в операции.</p><input id="csvFile" type="file" accept=".csv,text/csv"><div id="csvPreview" style="margin-top:14px"></div><div class="actions-row"><button class="primary-btn" data-modal-action="parseCsv">Разобрать CSV</button><button class="soft-btn" data-modal-save="csvTransfer">Перенести отмеченное</button></div>` };
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
    state.operations.push({ id: uid(), date: document.getElementById('mDate').value || todayKey(), type: kind, amount, category: kind === 'income' ? 'Доход' : document.getElementById('mCategory')?.value, note: document.getElementById('mNote')?.value || '', emotion: document.getElementById('mEmotion')?.value || '' });
    if (kind === 'income') createAllocationOperations(amount, document.getElementById('mDate').value || todayKey());
  }
  if (kind === 'task') state.tasks.push({ id: uid(), title: val('tTitle'), area: val('tArea'), goalId: val('tGoal'), due: val('tDue'), priority: val('tPriority'), status: 'В работе', nextAction: val('tNext') });
  if (kind === 'goal') state.goals.push({ id: uid(), title: val('gTitle'), area: val('gArea'), metric: val('gMetric'), targetValue: num(val('gTarget')), currentValue: num(val('gCurrent')), deadline: val('gDeadline'), why: val('gWhy'), nextAction: val('gNext'), status: 'Активна' });
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
  const a = state.settings.allocation;
  const items = [['Сбережения', a.savings], ['Подушка', a.cushion], ['Финансовая цель', a.goal]];
  items.forEach(([category, pct]) => { if (pct) state.operations.push({ id: uid(), date, type: 'expense', amount: amount*pct/100, category, note: `Автораспределение ${pct}%`, emotion: 'Система' }); });
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
  if (action === 'parseCsv') parseCsv();
}
function parseCsv() {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return toast('Выбери CSV-файл');
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    const lines = text.split(/\r?\n/).filter(Boolean);
    const sep = lines[0].includes(';') ? ';' : ',';
    const rows = lines.slice(0, 200).map(line => line.split(sep).map(x => x.trim().replace(/^"|"$/g,'')));
    const parsed = rows.map(cols => {
      const joined = cols.join(' ');
      const date = parseDate(cols.find(c => /\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}/.test(c)) || cols[0]);
      const amountCell = [...cols].reverse().find(c => /-?\d+[\s\d]*(,|\.)?\d*/.test(c));
      const amount = Math.abs(num(amountCell));
      return { id: uid(), date, amount, note: joined.slice(0, 120), category: '', selected: true };
    }).filter(r => r.amount);
    state.importRows = parsed;
    save();
    renderCsvPreview();
  };
  reader.readAsText(file, 'UTF-8');
}
function renderCsvPreview() {
  const cats = state.settings.categories.map(c=>`<option>${c}</option>`).join('');
  document.getElementById('csvPreview').innerHTML = table(['✓','Дата','Сумма','Категория','Описание'], state.importRows.slice(0,50).map(r => [`<input type="checkbox" data-import-sel="${r.id}" checked>`, r.date, money(r.amount), `<select data-import-cat="${r.id}"><option value="">Выбери</option>${cats}</select>`, r.note]));
  document.querySelectorAll('[data-import-sel]').forEach(ch => ch.onchange = () => { const r = state.importRows.find(x=>x.id===ch.dataset.importSel); if(r) r.selected = ch.checked; save(); });
  document.querySelectorAll('[data-import-cat]').forEach(sel => sel.onchange = () => { const r = state.importRows.find(x=>x.id===sel.dataset.importCat); if(r) r.category = sel.value; save(); });
}
function transferCsvRows() {
  state.importRows.filter(r => r.selected && r.category).forEach(r => state.operations.push({ id: uid(), date: r.date, type: 'expense', amount: r.amount, category: r.category, note: r.note, emotion: 'CSV' }));
  state.importRows = state.importRows.filter(r => !(r.selected && r.category));
}
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

window.SecondBrainApp = {
  getState: () => state,
  setStateFromCloud: (cloudState) => {
    if (!cloudState || typeof cloudState !== 'object') return;
    state = migrate(cloudState);
    save({ skipCloud: true });
    render();
    toast('Данные загружены из облака');
  },
  toast,
  render,
  migrate,
  exportBackup
};

init();
if (window.SecondBrainCloud) window.SecondBrainCloud.init();
