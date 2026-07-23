'use strict';

/* Second Brain OS V78 — единый премиальный интерфейс, профиль, привычки и прозрачные финансы.
   Миграция только дополняет state. Существующие коллекции и записи не очищаются. */
(() => {
  const BUILD = 'second-brain-space-v78-premium-unified-20260720-r1';
  const LABEL = 'V78 · PREMIUM UNIFIED';
  const CUSTOM_ROUTES = new Set([
    'today', 'dashboard', 'habits', 'discipline', 'information', 'library', 'profile',
    'finance', 'finance-operations', 'finance-analytics', 'finance-export', 'debts',
    'habit-wishlist'
  ]);
  const LEGACY_ALIASES = { dashboard: 'today', discipline: 'habits', library: 'information' };
  const DAY = 86400000;
  const PAGE_SIZE = 25;
  let pendingAvatar = '';
  let operationPage = 1;
  let operationType = 'all';
  let operationQuery = '';
  let renderTimer = 0;

  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  const clean = value => String(value ?? '').trim();
  const number = value => Number(String(value ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
  const makeId = () => typeof uid === 'function' ? uid() : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const todayKey = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  const dateAtNoon = value => new Date(`${String(value || todayKey()).slice(0, 10)}T12:00:00`);
  const addDaysKey = (value, amount) => { const d = dateAtNoon(value); d.setDate(d.getDate() + Number(amount || 0)); return d.toISOString().slice(0, 10); };
  const formatDate = value => value ? dateAtNoon(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const formatShort = value => value ? dateAtNoon(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—';
  const moneyText = value => typeof money === 'function' ? money(value) : `${number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
  const routeNow = () => decodeURIComponent((location.hash || '').replace(/^#/, '') || 'today');
  const nowIso = () => new Date().toISOString();
  const array = key => Array.isArray(state?.[key]) ? state[key] : [];
  const isClosedDebt = item => ['закрыт', 'закрыто', 'оплачен', 'оплачено', 'возвращен', 'возвращено', 'готово'].includes(clean(item?.status).toLowerCase());
  const activeDebtsOut = () => array('debts').filter(item => !isClosedDebt(item) && item.direction !== 'in' && item.direction !== 'incoming');
  const activeDebtsIn = () => array('debts').filter(item => !isClosedDebt(item) && (item.direction === 'in' || item.direction === 'incoming'));
  const total = items => items.reduce((sum, item) => sum + number(item.amount), 0);
  const operationSigned = item => item.type === 'income' ? number(item.amount) : -number(item.amount);
  const monthKey = value => String(value || todayKey()).slice(0, 7);
  const initial = name => clean(name).slice(0, 1).toUpperCase() || 'А';
  const plural = (n, one, few, many) => { const v = Math.abs(Number(n || 0)) % 100; const l = v % 10; if (v > 10 && v < 20) return many; if (l === 1) return one; if (l >= 2 && l <= 4) return few; return many; };

  function persist(message = '') {
    state.settings.v78.updatedAt = nowIso();
    if (typeof save === 'function') save();
    if (message && typeof toast === 'function') toast(message);
  }

  function ensureData() {
    if (!state || typeof state !== 'object') return;
    state.settings = state.settings || {};
    const oldName = clean(state.settings.name) || 'Алексей';
    const oldSubtitle = clean(state.settings.subtitle) || 'Фокус на рост';
    state.settings.profile = Object.assign({
      name: oldName,
      lastName: '',
      birthDate: '',
      city: '',
      email: '',
      phone: '',
      subtitle: oldSubtitle,
      bio: '',
      avatar: ''
    }, state.settings.profile || {});
    state.settings.name = clean(state.settings.profile.name) || oldName;
    state.settings.subtitle = clean(state.settings.profile.subtitle) || oldSubtitle;
    state.settings.v78 = Object.assign({
      version: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      migration: { from: 'v77', appliedAt: nowIso() },
      operationPage: 1,
      operationType: 'all',
      categoryPeriod: monthKey(todayKey())
    }, state.settings.v78 || {});

    state.habits = array('habits');
    state.habitWishlist = Array.isArray(state.habitWishlist) ? state.habitWishlist : [];
    state.subconsciousEntries = Array.isArray(state.subconsciousEntries) ? state.subconsciousEntries : [];
    state.inbox = Array.isArray(state.inbox) ? state.inbox : [];

    if (!state.discipline || typeof state.discipline !== 'object') {
      state.discipline = {
        version: 1,
        createdAt: nowIso(), updatedAt: nowIso(),
        activeHabit: { id: 'reading-20', title: 'Чтение', fullMinutes: 20, minimumMinutes: 5, cue: 'После ужина', place: 'В спокойном месте, телефон экраном вниз', startDate: todayKey(), targetDays: 42, reviewEveryDays: 7, status: 'active' },
        sessions: [], financeChecks: {}, reviews: [], timer: null, xp: 0, level: 1, lastInteractionAt: nowIso()
      };
    }
    state.discipline.sessions = Array.isArray(state.discipline.sessions) ? state.discipline.sessions : [];
    state.discipline.reviews = Array.isArray(state.discipline.reviews) ? state.discipline.reviews : [];
    state.discipline.financeChecks = state.discipline.financeChecks && typeof state.discipline.financeChecks === 'object' ? state.discipline.financeChecks : {};

    const reading = state.habits.find(h => /чтен/i.test(clean(h.name || h.title)));
    if (!reading) {
      state.habits.unshift({
        id: 'reading-20', name: 'Чтение 20 минут', icon: '📖', color: '#8b5cf6', marks: {},
        target: 20, unit: 'мин', frequency: 'Ежедневно', active: true, createdAt: nowIso(),
        note: '42-дневный эксперимент постепенного внедрения.'
      });
    } else {
      reading.marks = reading.marks && typeof reading.marks === 'object' ? reading.marks : {};
      reading.active = reading.active !== false;
    }

    state.habits.forEach(habit => {
      habit.id = clean(habit.id) || makeId();
      habit.name = clean(habit.name || habit.title) || 'Привычка';
      habit.icon = clean(habit.icon) || '✓';
      habit.color = clean(habit.color) || '#8b5cf6';
      habit.marks = habit.marks && typeof habit.marks === 'object' ? habit.marks : {};
      habit.target = number(habit.target) || (/чтен/i.test(habit.name) ? 20 : 1);
      habit.unit = clean(habit.unit) || (/чтен|медит|спорт|тренир|прогул/i.test(habit.name) ? 'мин' : 'раз');
      habit.frequency = clean(habit.frequency) || 'Ежедневно';
      habit.active = habit.active !== false;
    });

    if (!state.habitWishlist.length) {
      state.habitWishlist = [
        { id: makeId(), title: 'Планка 1 минута', icon: '🧘', schedule: '3 раза в неделю', note: '', createdAt: nowIso() },
        { id: makeId(), title: 'Дневник благодарности', icon: '💗', schedule: 'Каждый день', note: '', createdAt: nowIso() },
        { id: makeId(), title: 'Цифровой детокс вечером', icon: '📱', schedule: '2 дня в неделю', note: '', createdAt: nowIso() }
      ];
    }
    operationPage = Math.max(1, number(state.settings.v78.operationPage) || 1);
    operationType = ['all', 'income', 'expense'].includes(state.settings.v78.operationType) ? state.settings.v78.operationType : 'all';
  }

  function ageFromBirth(value) {
    if (!value) return '';
    const birth = dateAtNoon(value);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age >= 0 && age < 130 ? age : '';
  }

  function profile() { ensureData(); return state.settings.profile; }
  function avatarHtml(size = 'md') {
    const p = profile();
    return p.avatar ? `<img class="v78-avatar v78-avatar-${size}" src="${safe(p.avatar)}" alt="${safe(p.name)}">` : `<span class="v78-avatar v78-avatar-${size} v78-avatar-fallback">${safe(initial(p.name))}</span>`;
  }

  function routeLabel(route) {
    if (route.startsWith('habit-')) return 'Привычка';
    return ({ today: 'Сегодня', finance: 'Финансы', 'finance-operations': 'Операции', 'finance-analytics': 'Анализ', 'finance-export': 'Экспорт CSV', habits: 'Привычки', information: 'Информация', profile: 'Профиль', debts: 'Обязательства', calendar: 'Календарь', archive: 'Архив', coach: 'Подсказчик', system: 'Настройки' })[route] || route;
  }

  function navItem(route, icon, label) {
    const current = routeNow();
    const active = current === route || (route === 'habits' && (current.startsWith('habit-') || current === 'habit-wishlist')) || (route === 'finance' && current.startsWith('finance-'));
    return `<button class="v78-side-link ${active ? 'active' : ''}" data-v78-route="${safe(route)}" type="button"><i>${icon}</i><span>${safe(label)}</span></button>`;
  }

  function topTab(route, icon, label) {
    const current = routeNow();
    const active = current === route || (route === 'habits' && (current.startsWith('habit-') || current === 'habit-wishlist')) || (route === 'finance' && current.startsWith('finance-'));
    return `<button class="v78-top-tab ${active ? 'active' : ''}" data-v78-route="${route}" type="button"><i>${icon}</i>${label}</button>`;
  }

  function premiumShell(content) {
    ensureData();
    const app = document.getElementById('app');
    if (!app) return;
    const p = profile();
    const current = routeNow();
    app.innerHTML = `<div class="v78-app">
      <aside class="v78-sidebar">
        <button class="v78-brand" data-v78-route="today" type="button"><span class="v78-brand-orb"></span><span><b>Second Brain OS</b><small>Ваш день. Ваш рост.</small></span></button>
        <nav class="v78-side-nav">
          ${navItem('today', '⌂', 'Главная')}
          ${navItem('calendar', '▦', 'Календарь')}
          ${navItem('finance', '₽', 'Финансы')}
          ${navItem('habits', '✓', 'Привычки')}
          ${navItem('information', 'i', 'Информация')}
          ${navItem('archive', '▣', 'Архив')}
          ${navItem('coach', '✦', 'Подсказчик')}
          ${navItem('system', '⚙', 'Настройки')}
        </nav>
        <article class="v78-motivation"><div><b>Ты сегодня<br>на 1% лучше,<br>чем вчера</b><span>♥</span></div><div class="v78-liquid-art"><i></i><i></i><i></i></div></article>
        <button class="v78-profile-mini" data-v78-route="profile" type="button">${avatarHtml('sm')}<span><b>${safe(p.name || 'Алексей')}</b><small>${safe(p.subtitle || 'Фокус на рост')}</small></span><i>›</i></button>
      </aside>
      <main class="v78-main">
        <header class="v78-topbar">
          <div class="v78-greeting"><span class="v78-brand-orb v78-brand-orb-sm"></span><div><b>Доброе утро, ${safe(p.name || 'Алексей')} <em>✦</em></b><small>${safe(p.subtitle || 'Ваш день. Ваш рост. Ваши результаты.')}</small></div></div>
          <nav class="v78-top-tabs">${topTab('today', '☼', 'Сегодня')}${topTab('finance', '₽', 'Финансы')}${topTab('habits', '✓', 'Привычки')}${topTab('information', '▣', 'Информация')}</nav>
          <div class="v78-top-actions"><button data-v78-action="open-search" aria-label="Поиск" type="button">⌕</button><button data-v78-action="show-suggestion" aria-label="Подсказка" type="button">♧<em>${todaySuggestionCount()}</em></button><button class="v78-profile-top" data-v78-route="profile" type="button">${avatarHtml('sm')}</button></div>
        </header>
        <section id="view" class="v78-content" data-route="${safe(current)}">${content}</section>
      </main>
      <nav class="v78-mobile-nav">${[['today','⌂','Сегодня'],['habits','✓','Привычки'],['finance','₽','Финансы'],['information','▣','Информация'],['profile','●','Профиль']].map(([r,i,l])=>`<button class="${current===r||(r==='habits'&&current.startsWith('habit-'))||(r==='finance'&&current.startsWith('finance-'))?'active':''}" data-v78-route="${r}" type="button"><i>${i}</i><span>${l}</span></button>`).join('')}</nav>
      <div class="v78-build">${LABEL}</div>
    </div>`;
    document.body.classList.remove('v78-booting', 'v70-booting', 'v67-theme-dark');
    document.documentElement.classList.remove('v70-theme-dark');
    document.documentElement.classList.add('v70-theme-light');
    document.documentElement.dataset.v70Theme = 'light';
    document.documentElement.style.colorScheme = 'light';
    setBuild();
  }

  function setBuild() {
    document.body.dataset.sbosBuild = BUILD;
    document.body.dataset.v78Premium = 'ready';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', BUILD);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fbf9ff');
    try { localStorage.setItem('secondBrainOS.currentBuild', BUILD); } catch (error) {}
  }

  function card(title, subtitle, body, className = '', action = '') {
    return `<article class="v78-card ${className}"><header><div><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${action}</header>${body}</article>`;
  }

  function habitsActive() { return array('habits').filter(h => h.active !== false); }
  function completedHabit(habit, date = todayKey()) { return Boolean(habit?.marks?.[date]); }
  function habitsDone(date = todayKey()) { return habitsActive().filter(h => completedHabit(h, date)).length; }
  function recentDates(days = 7) { return Array.from({ length: days }, (_, index) => addDaysKey(todayKey(), index - (days - 1))); }
  function habitWeekDone(habit) { return recentDates(7).filter(date => completedHabit(habit, date)).length; }
  function todaySuggestionCount() { return habitsDone() < habitsActive().length || !state.discipline.financeChecks?.[todayKey()] ? 1 : 0; }

  function financeSnapshot() {
    const ops = array('operations');
    const key = monthKey(todayKey());
    const monthOps = ops.filter(item => monthKey(item.date) === key);
    const income = monthOps.filter(item => item.type === 'income').reduce((s, item) => s + number(item.amount), 0);
    const expense = monthOps.filter(item => item.type !== 'income').reduce((s, item) => s + number(item.amount), 0);
    const balance = number(state.settings.currentBalance);
    const debts = activeDebtsOut();
    const planned = array('purchases').filter(item => item.includeInBudget !== false && monthKey(item.date) === key).reduce((s, item) => s + number(item.amount), 0);
    return { income, expense, balance, debts, debtTotal: total(debts), planned, available: balance - planned };
  }

  function categoryData(period = state.settings.v78.categoryPeriod || monthKey(todayKey())) {
    const expenses = array('operations').filter(item => item.type !== 'income' && monthKey(item.date) === period);
    const map = new Map();
    expenses.forEach(item => { const key = clean(item.category) || 'Другое'; map.set(key, (map.get(key) || 0) + number(item.amount)); });
    const rows = [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const sum = rows.reduce((s, row) => s + row.value, 0);
    return { rows, sum, period };
  }

  function donutStyle(rows, sum) {
    if (!sum || !rows.length) return 'background:conic-gradient(#eee 0 100%)';
    const colors = ['#8b5cf6','#44c7b1','#ff9b73','#ffc857','#6aa9ff','#f783ac','#7fd1ae','#a6a1ff'];
    let cursor = 0;
    const parts = rows.slice(0, 8).map((row, index) => { const start = cursor; cursor += row.value / sum * 100; return `${colors[index % colors.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`; });
    if (cursor < 100) parts.push(`#edf0f7 ${cursor.toFixed(2)}% 100%`);
    return `background:conic-gradient(${parts.join(',')})`;
  }

  function habitChips(limit = 9) {
    const habits = habitsActive().slice(0, limit);
    return `<div class="v78-habit-chip-grid">${habits.map(habit => `<button class="v78-habit-chip ${completedHabit(habit) ? 'done' : ''}" data-v78-action="toggle-habit" data-id="${safe(habit.id)}" type="button"><i style="--habit:${safe(habit.color)}">${safe(habit.icon)}</i><span><b>${safe(habit.name)}</b><small>${completedHabit(habit) ? 'выполнено сегодня' : `${habit.target} ${safe(habit.unit)}`}</small></span><em>${completedHabit(habit) ? '✓' : '○'}</em></button>`).join('')}<button class="v78-habit-chip add" data-v78-action="open-habit-form" type="button"><i>＋</i><span><b>Добавить привычку</b><small>новая страница и отметки</small></span></button></div>`;
  }

  function foldersPanel() {
    const finance = financeSnapshot();
    const infoCount = array('people').length + array('notes').length + array('wishes').length + array('books').length;
    return `<article class="v78-folder-panel"><header><h2>Мои папки</h2><button data-v78-action="open-search" type="button">＋</button></header><div class="v78-folder-stack">
      ${folderCard('habits', 'folder-violet', 'Привычки', 'Дисциплина · Привычки · Интервью', `<span><small>Сегодня</small><b>${habitsDone()}/${habitsActive().length}</b></span><span><small>Неделя</small><b>${habitsActive().length ? Math.round(habitsActive().reduce((s,h)=>s+habitWeekDone(h),0)/(habitsActive().length*7)*100) : 0}%</b></span>`, '✓')}
      ${folderCard('finance', 'folder-green', 'Финансы', 'Операции · Аналитика · Цели', `<span><small>Баланс</small><b>${safe(moneyText(finance.balance))}</b></span><span><small>Расходы</small><b>${safe(moneyText(finance.expense))}</b></span>`, '₽')}
      ${folderCard('debts', 'folder-coral', 'Обязательства', 'Долги · Платежи · Источники', `<span><small>К оплате</small><b>${finance.debts.length}</b></span><span><small>Сумма</small><b>${safe(moneyText(finance.debtTotal))}</b></span>`, '!')}
      ${folderCard('information', 'folder-blue', 'Информация', 'Люди · Заметки · Желания · Библиотека', `<span><small>Люди</small><b>${array('people').length}</b></span><span><small>Заметки</small><b>${array('notes').length}</b></span><span><small>Желания</small><b>${array('wishes').length}</b></span><span><small>Всего</small><b>${infoCount}</b></span>`, 'i')}
      <button class="v78-archive-row" data-v78-route="archive" type="button"><i>▣</i><span>Архив</span><b>${array('archive').length} ${plural(array('archive').length,'запись','записи','записей')}</b><em>›</em></button>
    </div></article>`;
  }

  function folderCard(route, tone, title, subtitle, stats, icon) {
    return `<button class="v78-folder-card ${tone}" data-v78-route="${route}" type="button"><i class="v78-folder-icon"><span>${icon}</span></i><span class="v78-folder-copy"><b>${title}</b><small>${subtitle}</small><em class="v78-folder-stats">${stats}</em></span><strong>›</strong></button>`;
  }

  function obligationsMini() {
    const debts = activeDebtsOut();
    const rows = debts.slice(0, 2).map(item => `<div class="v78-obligation-row"><i>${/банк|кредит|займ/i.test(clean(item.person || item.note)) ? '▱' : '◇'}</i><span><b>${safe(item.person || 'Обязательство')}</b><small>${item.due ? `до ${formatShort(item.due)}` : 'срок не указан'}</small></span><em>${safe(moneyText(item.amount))}</em></div>`).join('');
    return card('Мои обязательства', `${debts.length} ${plural(debts.length,'активное','активных','активных')}`, `${rows || '<div class="v78-empty">Активных обязательств нет.</div>'}<button class="v78-link-button" data-v78-route="debts" type="button">Все обязательства →</button>`, 'v78-obligations-card');
  }

  function interviewCard() {
    const latest = array('subconsciousEntries').slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];
    return card('Интервью с подсознанием', 'Ответьте на 3 вопроса и получите ясный инсайт дня', `<div class="v78-interview-body"><div><p>${safe(latest?.answer || latest?.note || 'Что я могу отпустить, чтобы стать свободнее уже сейчас?')}</p><button class="v78-primary" data-v78-route="subconscious" type="button">Начать интервью <i>→</i></button></div><div class="v78-pearl-art"><i></i><b></b><em></em></div></div>`, 'v78-interview-card');
  }

  function assistantCard() {
    const undone = habitsActive().filter(h => !completedHabit(h));
    const suggestion = undone.length ? `Сегодня достаточно одного маленького шага: ${undone[0].name}.` : 'Привычки на сегодня закрыты. Можно спокойно подвести итог дня.';
    return card('Подсказчик AI', 'Ваш личный советник', `<div class="v78-assistant-body"><div><p>${safe(suggestion)}</p><button class="v78-primary" data-v78-route="coach" type="button">Спросить совет <i>→</i></button></div><div class="v78-robot"><i></i><b>••</b><em></em></div></div>`, 'v78-assistant-card');
  }

  function wishlistCard() {
    const rows = state.habitWishlist.slice(0, 4).map(item => `<div class="v78-wish-row"><i>${safe(item.icon || '✦')}</i><span><b>${safe(item.title)}</b><small>${safe(item.schedule || 'На следующую неделю')}</small></span><button data-v78-action="promote-wishlist" data-id="${safe(item.id)}" type="button">＋</button></div>`).join('');
    return card('Вишлист привычек', 'Следующие 4 недели', `${rows || '<div class="v78-empty">Вишлист пока пуст.</div>'}<button class="v78-link-button" data-v78-route="habit-wishlist" type="button">Смотреть все идеи →</button>`, 'v78-wishlist-card');
  }

  function categoryMini() {
    const data = categoryData();
    return card('Анализ по категориям', new Date(`${data.period}-01T12:00:00`).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}), `<div class="v78-category-layout"><div class="v78-donut" style="${donutStyle(data.rows,data.sum)}"><span><b>${safe(moneyText(data.sum))}</b><small>расходы</small></span></div><div class="v78-category-list">${data.rows.slice(0,6).map((row,index)=>`<div><i class="c${index}"></i><span>${safe(row.name)}</span><b>${data.sum?Math.round(row.value/data.sum*100):0}%</b></div>`).join('') || '<p>Расходов пока нет.</p>'}</div></div><button class="v78-link-button" data-v78-route="finance-analytics" type="button">Полный анализ →</button>`, 'v78-category-card');
  }

  function operationsFolderMini() {
    const ops = array('operations');
    const income = ops.filter(item => item.type === 'income').length;
    const expense = ops.length - income;
    return card('Папка операций', 'Все финансовые записи в одном месте', `<div class="v78-operation-folder"><button data-v78-route="finance-operations" type="button"><i>▦</i><span>Все операции</span><b>${ops.length}</b></button><button data-v78-route="finance-operations" data-v78-filter="income" type="button"><i>↗</i><span>Доходы</span><b>${income}</b></button><button data-v78-route="finance-operations" data-v78-filter="expense" type="button"><i>↘</i><span>Расходы</span><b>${expense}</b></button><button data-action="openRecordForm" data-type="operation" type="button"><i>＋</i><span>Новая операция</span><b>добавить</b></button></div>`, 'v78-operations-folder');
  }

  function financeHero() {
    const f = financeSnapshot();
    return `<article class="v78-card v78-finance-hero"><header><div><h2>Финансы сегодня</h2><p>Факты, операции и понятная структура денег</p></div><div class="v78-chip-actions"><button data-v78-route="finance-operations" type="button">Операции</button><button data-v78-route="finance-export" type="button">Экспорт CSV</button></div></header><div class="v78-finance-hero-body"><div class="v78-finance-numbers"><div><b class="positive">+ ${safe(moneyText(f.income))}</b><small>Доходы месяца</small></div><div><b class="negative">− ${safe(moneyText(f.expense))}</b><small>Расходы месяца</small></div><div class="balance"><small>Фактический баланс</small><strong>${safe(moneyText(f.balance))}</strong><button data-action="setActualBalance" type="button">Изменить</button></div></div><div class="v78-pie-art"><i></i><i></i><i></i><i></i></div></div></article>`;
  }

  function todayPage() {
    const done = habitsDone();
    const habits = habitsActive();
    return `<section class="v78-dashboard">
      <div class="v78-dashboard-main">
        ${card('Все привычки', `${habits.length} активных · можно отметить прямо здесь`, `<div class="v78-week-strip">${recentDates(7).map(date=>`<span class="${date===todayKey()?'today':''}"><small>${dateAtNoon(date).toLocaleDateString('ru-RU',{weekday:'short'}).toUpperCase()}</small><b>${dateAtNoon(date).getDate()}</b></span>`).join('')}</div>${habitChips(9)}<div class="v78-card-footer"><span>${done}/${habits.length} выполнено сегодня</span><button data-v78-action="mark-all-habits" type="button">Отметить все</button><button data-v78-route="habits" type="button">Открыть все привычки →</button></div>`, 'v78-all-habits')}
        <div class="v78-dashboard-lower"><div>${foldersPanel()}</div><div class="v78-center-stack">${interviewCard()}${obligationsMini()}</div><div class="v78-center-stack">${wishlistCard()}${assistantCard()}</div></div>
      </div>
      <aside class="v78-dashboard-side">${financeHero()}<div class="v78-side-duo">${operationsFolderMini()}${categoryMini()}</div>${wishlistWeekGrid()}</aside>
    </section>`;
  }

  function wishlistWeekGrid() {
    const items = state.habitWishlist.slice(0, 4);
    return card('Привычки на следующую неделю', `${items.length} запланировано`, `<div class="v78-week-wishlist">${items.map((item,index)=>`<button data-v78-route="habit-wishlist" type="button"><small>${['ПН','ВТ','СР','ЧТ'][index] || '•'}</small><i>${safe(item.icon||'✦')}</i><b>${safe(item.title)}</b><span>${safe(item.schedule||'')}</span></button>`).join('') || '<div class="v78-empty">Добавьте идеи во вишлист.</div>'}</div><button class="v78-link-button" data-v78-route="habit-wishlist" type="button">Настроить следующую неделю →</button>`, 'v78-next-week');
  }

  function habitsPage() {
    const habits = habitsActive();
    const done = habitsDone();
    return `<section class="v78-page"><header class="v78-page-head"><div><span>Система дисциплины</span><h1>Привычки</h1><p>Одна основная страница со всеми привычками и отдельная страница для каждой.</p></div><div><button class="v78-secondary" data-v78-action="open-habit-form" type="button">＋ Новая привычка</button><button class="v78-primary" data-v78-action="mark-all-habits" type="button">Отметить все сегодня</button></div></header>
      <section class="v78-habit-summary"><div class="v78-progress-ring" style="--progress:${habits.length?Math.round(done/habits.length*100):0}"><b>${done}/${habits.length}</b><small>сегодня</small></div><div><h2>Мои привычки</h2><p>Нажмите на карточку, чтобы открыть отдельную страницу. Галочка отмечает выполнение без перехода.</p></div></section>
      <section class="v78-habit-cards">${habits.map(habitCard).join('')}</section>
      <section class="v78-habit-support-grid">${interviewCard()}${assistantCard()}${wishlistCard()}</section>
    </section>`;
  }

  function habitCard(habit) {
    const week = habitWeekDone(habit);
    return `<article class="v78-habit-tile" style="--habit:${safe(habit.color)}"><button class="v78-habit-open" data-v78-route="habit-${encodeURIComponent(habit.id)}" type="button"><i>${safe(habit.icon)}</i><span><b>${safe(habit.name)}</b><small>${safe(habit.frequency)} · цель ${habit.target} ${safe(habit.unit)}</small></span><em>›</em></button><div class="v78-habit-tile-bottom"><span><b>${week}/7</b><small>за неделю</small></span><button class="${completedHabit(habit)?'done':''}" data-v78-action="toggle-habit" data-id="${safe(habit.id)}" type="button">${completedHabit(habit)?'✓ Выполнено':'○ Отметить'}</button></div></article>`;
  }

  function habitPage(id) {
    const habit = array('habits').find(item => item.id === id);
    if (!habit) return `<section class="v78-page"><div class="v78-empty-big">Привычка не найдена.<button data-v78-route="habits">Вернуться к привычкам</button></div></section>`;
    const days = /чтен/i.test(habit.name) ? 42 : 28;
    const dates = Array.from({length:days},(_,index)=>addDaysKey(todayKey(), index-(days-1)));
    const completed = dates.filter(date=>completedHabit(habit,date)).length;
    const best = longestStreak(habit);
    const reading = /чтен/i.test(habit.name);
    const sessions = reading ? state.discipline.sessions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))) : [];
    return `<section class="v78-page"><header class="v78-page-head"><div><button class="v78-back" data-v78-route="habits" type="button">← Все привычки</button><span>Отдельная страница привычки</span><h1>${safe(habit.icon)} ${safe(habit.name)}</h1><p>${safe(habit.note || 'Последовательное повторение и честная фиксация результата.')}</p></div><div><button class="v78-secondary" data-v78-action="edit-habit" data-id="${safe(habit.id)}" type="button">Настроить</button><button class="v78-primary" data-v78-action="toggle-habit" data-id="${safe(habit.id)}" type="button">${completedHabit(habit)?'✓ Выполнено сегодня':'Отметить сегодня'}</button></div></header>
      <section class="v78-kpi-row"><article><small>Выполнено</small><b>${completed}/${days}</b><span>за выбранный период</span></article><article><small>Последние 7 дней</small><b>${habitWeekDone(habit)}/7</b><span>стабильность, не серия</span></article><article><small>Лучшая серия</small><b>${best} дн.</b><span>без обнуления мотивации</span></article><article><small>Цель</small><b>${habit.target} ${safe(habit.unit)}</b><span>${safe(habit.frequency)}</span></article></section>
      ${card(`Карта повторений · ${days} дней`, 'Нажмите на любой день, чтобы изменить отметку.', `<div class="v78-habit-calendar">${dates.map(date=>`<button class="${completedHabit(habit,date)?'done':''} ${date===todayKey()?'today':''}" data-v78-action="toggle-habit-date" data-id="${safe(habit.id)}" data-date="${date}" type="button"><b>${dateAtNoon(date).getDate()}</b><small>${dateAtNoon(date).toLocaleDateString('ru-RU',{month:'short'})}</small></button>`).join('')}</div>`, 'v78-habit-calendar-card')}
      <section class="v78-two-cols">${reading ? readingDetailCard(habit, sessions) : habitNotesCard(habit)}${wishlistCard()}</section>
    </section>`;
  }

  function longestStreak(habit) {
    const dates = Object.keys(habit.marks || {}).filter(date => habit.marks[date]).sort();
    let best = 0, current = 0, previous = '';
    dates.forEach(date => { if (previous && Math.round((dateAtNoon(date)-dateAtNoon(previous))/DAY)===1) current += 1; else current = 1; best = Math.max(best,current); previous=date; });
    return best;
  }

  function readingDetailCard(habit, sessions) {
    const totalMinutes = sessions.reduce((s,item)=>s+number(item.minutes),0);
    const resistance = sessions.filter(item=>item.resistance!==''&&item.resistance!=null).map(item=>number(item.resistance));
    const avg = resistance.length ? (resistance.reduce((s,v)=>s+v,0)/resistance.length).toFixed(1) : '—';
    return card('Эксперимент: чтение', '42 дня · фактические действия', `<div class="v78-reading-stats"><div><small>Общее время</small><b>${Math.floor(totalMinutes/60)} ч ${totalMinutes%60} мин</b></div><div><small>Среднее сопротивление</small><b>${avg}/10</b></div><div><small>Сессий</small><b>${sessions.length}</b></div></div><div class="v78-session-list">${sessions.slice(0,6).map(item=>`<div><i>${item.mode==='minimum'?'5':'20'}</i><span><b>${formatShort(item.date)} · ${number(item.minutes)} мин</b><small>${safe(item.note||'Без заметки')}</small></span></div>`).join('') || '<div class="v78-empty">Первая сессия появится после отметки.</div>'}</div>`, 'v78-reading-detail');
  }

  function habitNotesCard(habit) {
    return card('Контекст привычки', 'Сделайте начало максимально простым', `<div class="v78-context-list"><div><small>Когда</small><b>${safe(habit.cue || 'Укажите сигнал в настройках')}</b></div><div><small>Где</small><b>${safe(habit.place || 'Укажите место в настройках')}</b></div><div><small>Минимальная версия</small><b>${Math.max(1,Math.round(habit.target/4))} ${safe(habit.unit)}</b></div></div>`, 'v78-context-card');
  }

  function informationPage() {
    const groups = [
      ['people','👥','Люди','Контакты, отношения и важный контекст',array('people')],
      ['notes','📝','Заметки','Мысли, решения, планы и наблюдения',array('notes')],
      ['wishes','💗','Желания','Мечты, цели и идеи для будущего',array('wishes')],
      ['ideas','💡','Идеи','Все задумки и возможные проекты',array('ideas')],
      ['personal','🌿','Личная память','Дневник, события и личные записи',array('personal')],
      ['polina','🌸','Состояние Полины','Календарь состояния и цикла',array('polinaDays')],
      ['documents','📄','Документы','Файлы, ссылки и важные материалы',array('documents')],
      ['books','📚','Книги','Книги, цитаты и конспекты',array('books')],
      ['films','🎬','Фильмы','Фильмы, сериалы и список просмотра',array('films')],
      ['trips','✈️','Путешествия','Маршруты, поездки и идеи',array('trips')],
      ['passwords','🔐','Пароли и доступы','Зашифрованное личное хранилище',Array.isArray(state.passwordVault)?state.passwordVault:[]],
      ['inbox','📥','Входящие','Несортированные мысли на разбор',array('inbox')]
    ];
    return `<section class="v78-page"><header class="v78-page-head"><div><span>Архив и необязательные разделы</span><h1>Информация</h1><p>На каждой карточке сразу видно, что лежит внутри. Открывать всё подряд больше не нужно.</p></div><div><button class="v78-secondary" data-v78-action="open-search" type="button">⌕ Найти информацию</button><button class="v78-primary" data-action="openQuick" type="button">＋ Добавить</button></div></header><section class="v78-information-grid">${groups.map(infoFolder).join('')}</section></section>`;
  }

  function infoFolder([route,icon,title,subtitle,items]) {
    const previews = items.slice(0,3).map(item=>clean(item.title||item.name||item.person||item.text||item.note||item.date)).filter(Boolean);
    return `<button class="v78-info-folder" data-v78-route="${route}" type="button"><i>${icon}</i><span><b>${title}</b><small>${subtitle}</small><em>${previews.length ? previews.map(value=>`<mark>${safe(value.slice(0,34))}</mark>`).join('') : '<mark>Пока пусто</mark>'}</em></span><strong>${items.length}<small>${plural(items.length,'элемент','элемента','элементов')}</small></strong><u>›</u></button>`;
  }

  function financePage() {
    const f = financeSnapshot();
    return `<section class="v78-page"><header class="v78-page-head"><div><span>Финансовая осознанность</span><h1>Финансы</h1><p>Все суммы строятся только из фактических операций, покупок и обязательств.</p></div><div><button class="v78-secondary" data-action="setActualBalance" type="button">Изменить баланс</button><button class="v78-primary" data-action="openRecordForm" data-type="operation" type="button">＋ Операция</button></div></header>
      <section class="v78-finance-folders">${financeFolder('finance-operations','▦','Операции',`${array('operations').length} записей`,`Доходы, расходы, переводы и полный многостраничный список`)}${financeFolder('finance-analytics','◌','Анализ категорий',safe(moneyText(categoryData().sum)),'Структура расходов и доля каждой категории')}${financeFolder('finance-export','⇩','Экспорт CSV','Все операции','Выгрузка абсолютно всех записей в UTF-8')}${financeFolder('debts','!','Источники долгов',safe(moneyText(f.debtTotal)),`${f.debts.length} активных обязательств — каждая сумма объяснена`)}</section>
      <section class="v78-kpi-row"><article><small>Фактический баланс</small><b>${safe(moneyText(f.balance))}</b><span>указанный остаток</span></article><article><small>Доходы месяца</small><b class="positive">${safe(moneyText(f.income))}</b><span>по операциям</span></article><article><small>Расходы месяца</small><b class="negative">${safe(moneyText(f.expense))}</b><span>по операциям</span></article><article><small>Обязательные покупки</small><b>${safe(moneyText(f.planned))}</b><span>в текущем месяце</span></article></section>
      <section class="v78-two-cols">${operationsFolderMini()}${categoryMini()}</section>
      ${card('Прозрачные обязательства', 'Сумма не берётся из воздуха — ниже показаны все источники.', debtSourceRows(), 'v78-debt-source')}
    </section>`;
  }

  function financeFolder(route, icon, title, value, subtitle) {
    return `<button class="v78-finance-folder" data-v78-route="${route}" type="button"><i>${icon}</i><span><small>${title}</small><b>${value}</b><em>${subtitle}</em></span><strong>›</strong></button>`;
  }

  function debtSourceRows() {
    const debts = activeDebtsOut();
    return `<div class="v78-source-list">${debts.map(item=>`<button data-v78-route="debts" type="button"><i>!</i><span><b>${safe(item.person||'Обязательство')}</b><small>${safe(item.note||'Без комментария')}${item.due?` · срок ${formatShort(item.due)}`:''}</small></span><em>${safe(moneyText(item.amount))}</em></button>`).join('') || '<div class="v78-empty">Активных долгов и обязательств нет.</div>'}</div><div class="v78-source-total"><span>Итого из ${debts.length} ${plural(debts.length,'источника','источников','источников')}</span><b>${safe(moneyText(total(debts)))}</b></div>`;
  }

  function financeOperationsPage() {
    const all = array('operations').slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')) || String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    let filtered = all.filter(item => operationType === 'all' || item.type === operationType);
    if (operationQuery) {
      const q = operationQuery.toLowerCase();
      filtered = filtered.filter(item => [item.date,item.type,item.amount,item.category,item.account,item.note,item.incomeSource].some(value=>String(value||'').toLowerCase().includes(q)));
    }
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    operationPage = Math.min(operationPage, pages);
    const start = (operationPage - 1) * PAGE_SIZE;
    const visible = filtered.slice(start, start + PAGE_SIZE);
    state.settings.v78.operationPage = operationPage;
    state.settings.v78.operationType = operationType;
    return `<section class="v78-page"><header class="v78-page-head"><div><button class="v78-back" data-v78-route="finance" type="button">← Финансы</button><span>Папка финансов</span><h1>Операции</h1><p>Полный список без обрезания. На одной странице отображается ${PAGE_SIZE} операций.</p></div><div><button class="v78-secondary" data-v78-action="export-csv" data-scope="filtered" type="button">⇩ Экспорт списка</button><button class="v78-primary" data-action="openRecordForm" data-type="operation" type="button">＋ Операция</button></div></header>
      <section class="v78-operation-toolbar"><div class="v78-segment">${[['all','Все'],['income','Доходы'],['expense','Расходы']].map(([key,label])=>`<button class="${operationType===key?'active':''}" data-v78-action="operation-type" data-type="${key}" type="button">${label}</button>`).join('')}</div><label>⌕<input data-v78-operation-search value="${safe(operationQuery)}" placeholder="Категория, сумма, комментарий..."></label><span>${filtered.length} ${plural(filtered.length,'операция','операции','операций')}</span></section>
      <section class="v78-operation-table"><header><span>Дата</span><span>Тип</span><span>Категория</span><span>Комментарий / счёт</span><span>Сумма</span><span></span></header>${visible.map(operationRow).join('') || '<div class="v78-empty-big">Операций по выбранному фильтру нет.</div>'}</section>
      <footer class="v78-pagination"><span>Страница ${operationPage} из ${pages}</span><div><button data-v78-action="operation-page" data-page="${Math.max(1,operationPage-1)}" ${operationPage===1?'disabled':''} type="button">←</button>${paginationButtons(operationPage,pages).map(page=>`<button class="${page===operationPage?'active':''}" data-v78-action="operation-page" data-page="${page}" type="button">${page}</button>`).join('')}<button data-v78-action="operation-page" data-page="${Math.min(pages,operationPage+1)}" ${operationPage===pages?'disabled':''} type="button">→</button></div></footer>
    </section>`;
  }

  function paginationButtons(current, pages) {
    const set = new Set([1,pages,current-1,current,current+1]);
    return [...set].filter(page=>page>=1&&page<=pages).sort((a,b)=>a-b);
  }

  function operationRow(item) {
    const income = item.type === 'income';
    return `<article><span>${safe(formatShort(item.date))}</span><span><i class="${income?'income':'expense'}">${income?'↗':'↘'}</i>${income?'Доход':'Расход'}</span><span>${safe(item.category||'Без категории')}</span><span><b>${safe(item.note||'Без комментария')}</b><small>${safe(item.account||item.incomeSource||'')}</small></span><strong class="${income?'positive':'negative'}">${income?'+':'−'} ${safe(moneyText(item.amount))}</strong><span class="v78-row-menu"><button data-action="editRecord" data-type="operation" data-id="${safe(item.id)}" type="button">✎</button><button data-action="deleteRecord" data-type="operation" data-id="${safe(item.id)}" type="button">×</button></span></article>`;
  }

  function financeAnalyticsPage() {
    const data = categoryData();
    const months = [...new Set(array('operations').map(item=>monthKey(item.date)).filter(Boolean))].sort().reverse();
    return `<section class="v78-page"><header class="v78-page-head"><div><button class="v78-back" data-v78-route="finance" type="button">← Финансы</button><span>Финансовая аналитика</span><h1>Анализ по категориям</h1><p>Каждая категория рассчитывается только из фактических расходных операций.</p></div><div><select class="v78-select" data-v78-category-period>${months.map(key=>`<option value="${key}" ${key===data.period?'selected':''}>${new Date(`${key}-01T12:00:00`).toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</option>`).join('') || `<option value="${monthKey(todayKey())}">Текущий месяц</option>`}</select><button class="v78-primary" data-v78-route="finance-operations" type="button">Открыть операции</button></div></header>
      <section class="v78-analysis-hero"><div class="v78-donut large" style="${donutStyle(data.rows,data.sum)}"><span><b>${safe(moneyText(data.sum))}</b><small>расходы</small></span></div><div><h2>Структура расходов</h2><p>${data.rows.length ? 'Категории отсортированы от крупнейшей к меньшей.' : 'Добавьте расходные операции, чтобы появился анализ.'}</p><div class="v78-analysis-list">${data.rows.map((row,index)=>`<article><i class="c${index}"></i><span><b>${safe(row.name)}</b><small>${safe(moneyText(row.value))}</small></span><em>${data.sum?Math.round(row.value/data.sum*100):0}%</em><u><b style="width:${data.sum?row.value/data.sum*100:0}%"></b></u></article>`).join('')}</div></div></section>
      ${card('Что изменилось по сравнению с предыдущим месяцем', 'Сравнение строится по тем же категориям.', categoryComparison(data.period), 'v78-comparison-card')}
    </section>`;
  }

  function categoryComparison(period) {
    const d = new Date(`${period}-01T12:00:00`); d.setMonth(d.getMonth()-1); const previous = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const currentData = categoryData(period); const prevData = categoryData(previous); const prevMap = new Map(prevData.rows.map(row=>[row.name,row.value]));
    return `<div class="v78-comparison-list">${currentData.rows.slice(0,8).map(row=>{const old=prevMap.get(row.name)||0; const diff=row.value-old; return `<div><span><b>${safe(row.name)}</b><small>было ${safe(moneyText(old))}</small></span><em class="${diff>0?'negative':diff<0?'positive':''}">${diff>0?'+':''}${safe(moneyText(diff))}</em></div>`}).join('') || '<div class="v78-empty">Недостаточно операций для сравнения.</div>'}</div>`;
  }

  function financeExportPage() {
    const ops = array('operations');
    return `<section class="v78-page"><header class="v78-page-head"><div><button class="v78-back" data-v78-route="finance" type="button">← Финансы</button><span>Выгрузка данных</span><h1>Экспорт CSV</h1><p>В файл войдут абсолютно все операции, а не только текущая страница списка.</p></div></header>
      <section class="v78-export-card"><div class="v78-export-icon">⇩</div><div><h2>${ops.length} ${plural(ops.length,'операция','операции','операций')} готовы к экспорту</h2><p>Формат CSV UTF-8 с разделителем «;». Содержит дату, тип, сумму, категорию, счёт, источник дохода и комментарий.</p><div class="v78-export-checks"><span>✓ Все страницы</span><span>✓ Все даты</span><span>✓ Все категории</span><span>✓ Совместимо с Excel</span></div><button class="v78-primary" data-v78-action="export-csv" data-scope="all" type="button">Скачать полный CSV</button></div></section>
      ${card('Предпросмотр последних операций', 'Сам файл будет содержать весь список.', `<div class="v78-export-preview">${ops.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,8).map(item=>`<div><span>${formatShort(item.date)}</span><b>${safe(item.category||'Без категории')}</b><em class="${item.type==='income'?'positive':'negative'}">${item.type==='income'?'+':'−'} ${safe(moneyText(item.amount))}</em></div>`).join('') || '<div class="v78-empty">Операций нет.</div>'}</div>`, 'v78-export-preview-card')}
    </section>`;
  }

  function debtsPage() {
    const out = activeDebtsOut(); const incoming = activeDebtsIn();
    return `<section class="v78-page"><header class="v78-page-head"><div><span>Прозрачные источники суммы</span><h1>Долги и обязательства</h1><p>Итог всегда равен сумме конкретных записей ниже. Никаких скрытых расчётов.</p></div><div><button class="v78-secondary" data-action="openDebtIn" type="button">＋ Мне должны</button><button class="v78-primary" data-action="openDebtOut" type="button">＋ Я должен</button></div></header>
      <section class="v78-kpi-row"><article><small>Я должен</small><b class="negative">${safe(moneyText(total(out)))}</b><span>${out.length} активных записей</span></article><article><small>Мне должны</small><b class="positive">${safe(moneyText(total(incoming)))}</b><span>${incoming.length} активных записей</span></article><article><small>Чистая позиция</small><b>${safe(moneyText(total(incoming)-total(out)))}</b><span>возвраты минус обязательства</span></article><article><small>Ближайший срок</small><b>${safe(formatShort(out.filter(item=>item.due).sort((a,b)=>String(a.due).localeCompare(String(b.due)))[0]?.due))}</b><span>по активным обязательствам</span></article></section>
      <section class="v78-two-cols">${debtColumn('Я должен',out,'negative')}${debtColumn('Мне должны',incoming,'positive')}</section>
    </section>`;
  }

  function debtColumn(title, items, tone) {
    return card(title, `Итого ${moneyText(total(items))}`, `<div class="v78-debt-list">${items.map(item=>`<article><i>${tone==='negative'?'↘':'↗'}</i><span><b>${safe(item.person||'Без названия')}</b><small>${safe(item.note||'Без комментария')}${item.due?` · ${formatShort(item.due)}`:''}</small></span><strong class="${tone}">${safe(moneyText(item.amount))}</strong><div><button data-action="editRecord" data-type="debt" data-id="${safe(item.id)}" type="button">Изменить</button><button data-action="closeDebt" data-id="${safe(item.id)}" type="button">Закрыть</button></div></article>`).join('') || '<div class="v78-empty">Записей нет.</div>'}</div>`, `v78-debt-column ${tone}`);
  }

  function profilePage() {
    const p = profile(); const age = ageFromBirth(p.birthDate);
    return `<section class="v78-page"><header class="v78-page-head"><div><span>Персонализация системы</span><h1>Мой профиль</h1><p>Имя и фотография отображаются во всём приложении.</p></div><div><button class="v78-secondary" data-action="exportData" type="button">Экспорт данных</button><button class="v78-primary" data-v78-action="edit-profile" type="button">Редактировать профиль</button></div></header>
      <section class="v78-profile-hero"><div class="v78-profile-visual">${avatarHtml('xl')}<span class="v78-brand-orb"></span></div><div><span>Персональный профиль</span><h2>${safe([p.name,p.lastName].filter(Boolean).join(' ') || 'Алексей')}</h2><p>${safe(p.subtitle || 'Фокус на рост')}</p><div class="v78-profile-tags">${age!==''?`<span>${age} ${plural(age,'год','года','лет')}</span>`:''}${p.birthDate?`<span>🎂 ${formatDate(p.birthDate)}</span>`:''}${p.city?`<span>⌖ ${safe(p.city)}</span>`:''}</div></div></section>
      <section class="v78-profile-grid"><article><small>О себе</small><p>${safe(p.bio || 'Добавьте короткое описание, чтобы профиль стал по-настоящему вашим.')}</p></article><article><small>Email</small><p>${safe(p.email || 'Не указан')}</p></article><article><small>Телефон</small><p>${safe(p.phone || 'Не указан')}</p></article><article><small>Дата рождения</small><p>${safe(p.birthDate ? formatDate(p.birthDate) : 'Не указана')}</p></article></section>
      ${card('Безопасность данных', 'Профиль сохраняется вместе с общей базой приложения.', `<div class="v78-security-list"><span>✓ Обновление не очищает существующие записи</span><span>✓ Фотография уменьшается перед сохранением</span><span>✓ Профиль входит в JSON-экспорт</span><span>✓ Работает с защитным хранилищем V76</span></div>`, 'v78-security-card')}
    </section>`;
  }

  function wishlistPage() {
    return `<section class="v78-page"><header class="v78-page-head"><div><button class="v78-back" data-v78-route="habits" type="button">← Привычки</button><span>Следующие этапы дисциплины</span><h1>Вишлист привычек</h1><p>Храните идеи здесь и внедряйте только одну следующую привычку за раз.</p></div><button class="v78-primary" data-v78-action="open-wishlist-form" type="button">＋ Добавить идею</button></header><section class="v78-wishlist-full">${state.habitWishlist.map(item=>`<article><i>${safe(item.icon||'✦')}</i><span><b>${safe(item.title)}</b><small>${safe(item.schedule||'Без графика')}</small><p>${safe(item.note||'')}</p></span><div><button data-v78-action="promote-wishlist" data-id="${safe(item.id)}" type="button">Внедрить</button><button data-v78-action="edit-wishlist" data-id="${safe(item.id)}" type="button">✎</button><button data-v78-action="delete-wishlist" data-id="${safe(item.id)}" type="button">×</button></div></article>`).join('') || '<div class="v78-empty-big">Вишлист пока пуст.</div>'}</section></section>`;
  }

  function customPage(route) {
    const normalized = LEGACY_ALIASES[route] || route;
    if (normalized === 'today') return todayPage();
    if (normalized === 'habits') return habitsPage();
    if (normalized === 'information') return informationPage();
    if (normalized === 'finance') return financePage();
    if (normalized === 'finance-operations') return financeOperationsPage();
    if (normalized === 'finance-analytics') return financeAnalyticsPage();
    if (normalized === 'finance-export') return financeExportPage();
    if (normalized === 'debts') return debtsPage();
    if (normalized === 'profile') return profilePage();
    if (normalized === 'habit-wishlist') return wishlistPage();
    if (normalized.startsWith('habit-')) return habitPage(decodeURIComponent(normalized.slice(6)));
    return todayPage();
  }

  function isCustom(route) { const normalized = LEGACY_ALIASES[route] || route; return CUSTOM_ROUTES.has(route) || CUSTOM_ROUTES.has(normalized) || normalized.startsWith('habit-'); }

  const legacyRender = typeof render === 'function' ? render : null;
  const legacyGo = typeof go === 'function' ? go : null;
  const legacyV70Navigate = typeof window.v70Navigate === 'function' ? window.v70Navigate : null;

  function renderPremium() {
    clearTimeout(renderTimer);
    ensureData();
    const route = routeNow();
    const normalized = LEGACY_ALIASES[route] || route;
    try { page = normalized; } catch (error) {}
    if (isCustom(route)) {
      premiumShell(customPage(route));
      afterRender();
      return;
    }
    if (legacyRender) {
      try { legacyRender(); }
      catch (error) { console.error('[V78 legacy render]', error); premiumShell(`<section class="v78-page"><div class="v78-empty-big">Раздел не удалось открыть.<button data-v78-route="today">Вернуться на главную</button></div></section>`); }
      afterRender();
      return;
    }
    premiumShell(customPage('today'));
  }

  function afterRender() {
    setBuild();
    document.body.classList.remove('v78-booting', 'v70-booting', 'v67-theme-dark');
    document.documentElement.classList.remove('v70-theme-dark');
    document.documentElement.classList.add('v70-theme-light');
    document.querySelectorAll('.v59-version,.version,.v77-bottom-nav,.bottom-nav').forEach(el => { if (!el.classList.contains('v78-mobile-nav')) el.style.display = 'none'; });
    try { window.scrollTo(0, 0); } catch (error) {}
  }

  function navigate(route, options = {}) {
    const target = LEGACY_ALIASES[route] || route || 'today';
    if (target === 'coach') {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.dataset.v65Action = 'openAssistant';
      trigger.hidden = true;
      document.body.appendChild(trigger);
      trigger.click();
      trigger.remove();
      return;
    }
    if (options.filter) operationType = options.filter;
    try { page = target; } catch (error) {}
    try { history.pushState(null, '', `#${encodeURIComponent(target)}`); } catch (error) { location.hash = target; }
    renderPremium();
  }

  renderShell = premiumShell;
  render = renderPremium;
  go = navigate;
  window.v70Navigate = navigate;

  function toggleHabit(id, date = todayKey(), force) {
    const habit = array('habits').find(item => item.id === id);
    if (!habit) return;
    habit.marks = habit.marks || {};
    const next = force === undefined ? !habit.marks[date] : Boolean(force);
    habit.marks[date] = next;
    if (/чтен/i.test(habit.name)) syncReadingSession(habit, date, next);
    persist(next ? 'Привычка отмечена' : 'Отметка снята');
    renderPremium();
  }

  function syncReadingSession(habit, date, completed) {
    const sessions = state.discipline.sessions;
    const sourceId = `habit-quick-${habit.id}-${date}`;
    state.discipline.sessions = sessions.filter(item => item.sourceId !== sourceId);
    if (completed) state.discipline.sessions.unshift({ id: makeId(), sourceId, date, mode: 'full', minutes: number(habit.target)||20, resistance: '', note: 'Отмечено на странице привычки', createdAt: nowIso() });
  }

  function markAllHabits() {
    habitsActive().forEach(habit => { if (!completedHabit(habit)) { habit.marks[todayKey()] = true; if (/чтен/i.test(habit.name)) syncReadingSession(habit,todayKey(),true); } });
    persist('Все активные привычки отмечены');
    renderPremium();
  }

  function openHabitForm(id = '') {
    const existing = array('habits').find(item => item.id === id) || {};
    const html = `<div class="v78-modal-form"><label><span>Название</span><input id="v78_habit_name" value="${safe(existing.name||'')}"></label><div class="v78-form-grid"><label><span>Иконка</span><input id="v78_habit_icon" value="${safe(existing.icon||'✨')}" maxlength="4"></label><label><span>Цвет</span><input id="v78_habit_color" type="color" value="${safe(existing.color||'#8b5cf6')}"></label><label><span>Цель</span><input id="v78_habit_target" type="number" min="1" value="${number(existing.target)||1}"></label><label><span>Единица</span><input id="v78_habit_unit" value="${safe(existing.unit||'раз')}"></label></div><label><span>График</span><input id="v78_habit_frequency" value="${safe(existing.frequency||'Ежедневно')}"></label><label><span>Описание</span><textarea id="v78_habit_note">${safe(existing.note||'')}</textarea></label><div class="v78-modal-actions"><button class="v78-primary" data-v78-action="save-habit" data-id="${safe(existing.id||'')}" type="button">Сохранить</button><button data-v78-action="close-modal" type="button">Отмена</button></div></div>`;
    if (typeof openModal === 'function') openModal(existing.id ? 'Настроить привычку' : 'Новая привычка', html);
  }

  function saveHabit(id) {
    const existing = array('habits').find(item => item.id === id);
    const item = existing || { id: makeId(), marks: {}, active: true, createdAt: nowIso() };
    item.name = clean(document.getElementById('v78_habit_name')?.value) || 'Новая привычка';
    item.icon = clean(document.getElementById('v78_habit_icon')?.value) || '✨';
    item.color = clean(document.getElementById('v78_habit_color')?.value) || '#8b5cf6';
    item.target = Math.max(1, number(document.getElementById('v78_habit_target')?.value) || 1);
    item.unit = clean(document.getElementById('v78_habit_unit')?.value) || 'раз';
    item.frequency = clean(document.getElementById('v78_habit_frequency')?.value) || 'Ежедневно';
    item.note = clean(document.getElementById('v78_habit_note')?.value);
    item.updatedAt = nowIso();
    if (!existing) state.habits.unshift(item);
    persist('Привычка сохранена');
    if (typeof closeModal === 'function') closeModal();
    navigate(`habit-${encodeURIComponent(item.id)}`);
  }

  function openWishlistForm(id = '') {
    const existing = state.habitWishlist.find(item => item.id === id) || {};
    const html = `<div class="v78-modal-form"><div class="v78-form-grid"><label><span>Иконка</span><input id="v78_wish_icon" value="${safe(existing.icon||'✦')}" maxlength="4"></label><label><span>Название</span><input id="v78_wish_title" value="${safe(existing.title||'')}"></label></div><label><span>План / частота</span><input id="v78_wish_schedule" value="${safe(existing.schedule||'')}"></label><label><span>Заметка</span><textarea id="v78_wish_note">${safe(existing.note||'')}</textarea></label><div class="v78-modal-actions"><button class="v78-primary" data-v78-action="save-wishlist" data-id="${safe(existing.id||'')}" type="button">Сохранить</button><button data-v78-action="close-modal" type="button">Отмена</button></div></div>`;
    if (typeof openModal === 'function') openModal(existing.id ? 'Изменить идею привычки' : 'Добавить в вишлист', html);
  }

  function saveWishlist(id) {
    const existing = state.habitWishlist.find(item => item.id === id);
    const item = existing || { id: makeId(), createdAt: nowIso() };
    item.icon = clean(document.getElementById('v78_wish_icon')?.value) || '✦';
    item.title = clean(document.getElementById('v78_wish_title')?.value) || 'Новая привычка';
    item.schedule = clean(document.getElementById('v78_wish_schedule')?.value) || 'На следующую неделю';
    item.note = clean(document.getElementById('v78_wish_note')?.value);
    if (!existing) state.habitWishlist.unshift(item);
    persist('Вишлист сохранён');
    if (typeof closeModal === 'function') closeModal();
    renderPremium();
  }

  function promoteWishlist(id) {
    const item = state.habitWishlist.find(row => row.id === id);
    if (!item) return;
    const existing = array('habits').find(h => clean(h.name).toLowerCase() === clean(item.title).toLowerCase());
    if (!existing) state.habits.unshift({ id: makeId(), name: item.title, icon: item.icon || '✦', color: '#8b5cf6', target: 1, unit: 'раз', frequency: item.schedule || 'Ежедневно', marks: {}, active: true, note: item.note || 'Добавлено из вишлиста', createdAt: nowIso() });
    persist(existing ? 'Такая привычка уже есть' : 'Привычка добавлена из вишлиста');
    renderPremium();
  }

  function openProfileForm() {
    const p = profile(); pendingAvatar = p.avatar || '';
    const preview = pendingAvatar ? `<img src="${safe(pendingAvatar)}">` : `<span>${safe(initial(p.name))}</span>`;
    const html = `<div class="v78-modal-form"><div class="v78-avatar-editor"><div id="v78_avatar_preview">${preview}</div><label><input id="v78_avatar_file" type="file" accept="image/*"><span>Загрузить фотографию</span></label><small>Изображение автоматически уменьшается до 320 × 320.</small></div><div class="v78-form-grid"><label><span>Имя</span><input id="v78_profile_name" value="${safe(p.name||'')}"></label><label><span>Фамилия</span><input id="v78_profile_lastname" value="${safe(p.lastName||'')}"></label><label><span>Дата рождения</span><input id="v78_profile_birth" type="date" value="${safe(p.birthDate||'')}"></label><label><span>Город</span><input id="v78_profile_city" value="${safe(p.city||'')}"></label><label><span>Email</span><input id="v78_profile_email" type="email" value="${safe(p.email||'')}"></label><label><span>Телефон</span><input id="v78_profile_phone" value="${safe(p.phone||'')}"></label></div><label><span>Подпись / фокус</span><input id="v78_profile_subtitle" value="${safe(p.subtitle||'')}"></label><label><span>О себе</span><textarea id="v78_profile_bio">${safe(p.bio||'')}</textarea></label><div class="v78-modal-actions"><button class="v78-primary" data-v78-action="save-profile" type="button">Сохранить профиль</button><button data-v78-action="close-modal" type="button">Отмена</button></div></div>`;
    if (typeof openModal === 'function') openModal('Персональный профиль', html);
  }

  function saveProfile() {
    const p = profile();
    p.name = clean(document.getElementById('v78_profile_name')?.value) || 'Алексей';
    p.lastName = clean(document.getElementById('v78_profile_lastname')?.value);
    p.birthDate = clean(document.getElementById('v78_profile_birth')?.value);
    p.city = clean(document.getElementById('v78_profile_city')?.value);
    p.email = clean(document.getElementById('v78_profile_email')?.value);
    p.phone = clean(document.getElementById('v78_profile_phone')?.value);
    p.subtitle = clean(document.getElementById('v78_profile_subtitle')?.value) || 'Фокус на рост';
    p.bio = clean(document.getElementById('v78_profile_bio')?.value);
    p.avatar = pendingAvatar || '';
    state.settings.name = p.name;
    state.settings.subtitle = p.subtitle;
    persist('Профиль сохранён');
    if (typeof closeModal === 'function') closeModal();
    renderPremium();
  }

  async function compressAvatar(file) {
    if (!file) return;
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    const img = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = dataUrl; });
    const size = 320; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const ctx = canvas.getContext('2d');
    const scale = Math.max(size / img.width, size / img.height); const w = img.width * scale; const h = img.height * scale; ctx.drawImage(img, (size-w)/2, (size-h)/2, w, h);
    pendingAvatar = canvas.toDataURL('image/jpeg', 0.82);
    const preview = document.getElementById('v78_avatar_preview'); if (preview) preview.innerHTML = `<img src="${safe(pendingAvatar)}">`;
  }

  function exportCsv(scope = 'all') {
    let rows = array('operations').slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    if (scope === 'filtered') {
      rows = rows.filter(item => operationType === 'all' || item.type === operationType);
      if (operationQuery) { const q=operationQuery.toLowerCase(); rows=rows.filter(item=>JSON.stringify(item).toLowerCase().includes(q)); }
    }
    const columns = ['ID','Дата','Тип','Сумма','Категория','Счёт','Источник дохода','Комментарий','Создано'];
    const quote = value => `"${String(value ?? '').replace(/"/g,'""')}"`;
    const csv = '\uFEFF' + [columns.map(quote).join(';'), ...rows.map(item => [item.id,item.date,item.type==='income'?'Доход':'Расход',number(item.amount),item.category||'',item.account||'',item.incomeSource||'',item.note||'',item.createdAt||''].map(quote).join(';'))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `second-brain-operations-${todayKey()}.csv`; link.click(); setTimeout(()=>URL.revokeObjectURL(link.href),1000);
    if (typeof toast === 'function') toast(`Экспортировано операций: ${rows.length}`);
  }

  function showSuggestion() {
    const undone = habitsActive().filter(h=>!completedHabit(h)); const financeDone = Boolean(state.discipline.financeChecks?.[todayKey()]);
    const lines = [];
    if (undone.length) lines.push(`<div class="v78-suggestion-row"><i>✓</i><span><b>Маленький шаг</b><small>Отметьте «${safe(undone[0].name)}» или выполните минимальную версию.</small></span><button data-v78-route="habit-${encodeURIComponent(undone[0].id)}">Открыть</button></div>`);
    if (!financeDone) lines.push(`<div class="v78-suggestion-row"><i>₽</i><span><b>Проверка финансов</b><small>Сверьте фактический баланс и ближайшие обязательства.</small></span><button data-v78-route="finance">Открыть</button></div>`);
    if (!lines.length) lines.push('<div class="v78-empty">На сегодня всё главное выполнено. Можно спокойно завершать день.</div>');
    if (typeof openModal === 'function') openModal('Подсказчик по текущим данным', `<div class="v78-suggestion-list">${lines.join('')}</div>`);
  }

  function openSearch() {
    if (typeof openModal !== 'function') return;
    openModal('Поиск по Second Brain OS', `<div class="v78-search-modal"><label>⌕<input data-v78-global-search autofocus placeholder="Начните вводить название, человека или текст..."></label><div data-v78-search-results><p class="v78-empty">Результаты появятся здесь.</p></div></div>`);
    setTimeout(()=>document.querySelector('[data-v78-global-search]')?.focus(),50);
  }

  function searchResults(query) {
    const q = clean(query).toLowerCase(); if (q.length < 2) return '<p class="v78-empty">Введите минимум 2 символа.</p>';
    const sources = [
      ['notes','Заметки','📝',array('notes')],['ideas','Идеи','💡',array('ideas')],['people','Люди','👥',array('people')],['wishes','Желания','💗',array('wishes')],['books','Книги','📚',array('books')],['documents','Документы','📄',array('documents')],['tasks','Задачи','✓',array('tasks')],['habits','Привычки','◉',array('habits')],['finance-operations','Операции','₽',array('operations')]
    ];
    const found=[]; sources.forEach(([route,label,icon,items])=>items.forEach(item=>{const text=[item.title,item.name,item.person,item.text,item.note,item.category,item.author,item.role,item.amount,item.date].join(' ').toLowerCase(); if(text.includes(q))found.push({route,label,icon,item});}));
    return `<div class="v78-search-results">${found.slice(0,30).map(({route,label,icon,item})=>`<button data-v78-route="${route}" type="button"><i>${icon}</i><span><b>${safe(item.title||item.name||item.person||item.category||label)}</b><small>${safe(label)} · ${safe((item.text||item.note||item.author||item.date||'').slice(0,80))}</small></span><em>›</em></button>`).join('') || '<p class="v78-empty">Ничего не найдено.</p>'}</div>`;
  }

  window.addEventListener('click', event => {
    const routeButton = event.target.closest?.('[data-v78-route]');
    if (routeButton) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      const filter = routeButton.dataset.v78Filter || '';
      if (filter) { operationType = filter; operationPage = 1; }
      return navigate(routeButton.dataset.v78Route, { filter });
    }
    const button = event.target.closest?.('[data-v78-action]');
    if (!button) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    const action = button.dataset.v78Action;
    if (action === 'toggle-habit') return toggleHabit(button.dataset.id);
    if (action === 'toggle-habit-date') return toggleHabit(button.dataset.id, button.dataset.date);
    if (action === 'mark-all-habits') return markAllHabits();
    if (action === 'open-habit-form') return openHabitForm();
    if (action === 'edit-habit') return openHabitForm(button.dataset.id);
    if (action === 'save-habit') return saveHabit(button.dataset.id || '');
    if (action === 'open-wishlist-form') return openWishlistForm();
    if (action === 'edit-wishlist') return openWishlistForm(button.dataset.id);
    if (action === 'save-wishlist') return saveWishlist(button.dataset.id || '');
    if (action === 'delete-wishlist') { state.habitWishlist = state.habitWishlist.filter(item=>item.id!==button.dataset.id); persist('Идея удалена'); return renderPremium(); }
    if (action === 'promote-wishlist') return promoteWishlist(button.dataset.id);
    if (action === 'edit-profile') return openProfileForm();
    if (action === 'save-profile') return saveProfile();
    if (action === 'operation-type') { operationType = button.dataset.type; operationPage = 1; state.settings.v78.operationType=operationType; return renderPremium(); }
    if (action === 'operation-page') { operationPage = Math.max(1,number(button.dataset.page)||1); state.settings.v78.operationPage=operationPage; return renderPremium(); }
    if (action === 'export-csv') return exportCsv(button.dataset.scope || 'all');
    if (action === 'open-search') return openSearch();
    if (action === 'show-suggestion') return showSuggestion();
    if (action === 'close-modal') return typeof closeModal === 'function' ? closeModal() : undefined;
  }, true);

  window.addEventListener('input', event => {
    const operationSearch = event.target.closest?.('[data-v78-operation-search]');
    if (operationSearch) { operationQuery = operationSearch.value; operationPage = 1; return; }
    const globalSearch = event.target.closest?.('[data-v78-global-search]');
    if (globalSearch) { const target=document.querySelector('[data-v78-search-results]'); if(target)target.innerHTML=searchResults(globalSearch.value); }
  });

  window.addEventListener('keydown', event => {
    const operationSearch = event.target.closest?.('[data-v78-operation-search]');
    if (operationSearch && event.key === 'Enter') { event.preventDefault(); renderPremium(); }
  });

  window.addEventListener('change', event => {
    const operationSearch = event.target.closest?.('[data-v78-operation-search]');
    if (operationSearch) { operationQuery = operationSearch.value; operationPage = 1; renderPremium(); return; }
    const avatar = event.target.closest?.('#v78_avatar_file'); if (avatar?.files?.[0]) compressAvatar(avatar.files[0]).catch(error=>{console.error(error); if(typeof toast==='function')toast('Не удалось обработать изображение');});
    const period = event.target.closest?.('[data-v78-category-period]'); if(period){state.settings.v78.categoryPeriod=period.value;persist();renderPremium();}
  });

  window.addEventListener('popstate', renderPremium);
  window.addEventListener('hashchange', () => { clearTimeout(renderTimer); renderTimer = setTimeout(renderPremium, 10); });
  window.addEventListener('storage', event => { if (event.key === 'secondBrainOS.v1') { clearTimeout(renderTimer); renderTimer=setTimeout(renderPremium,80); } });

  window.V78Premium = { render: renderPremium, navigate, ensureData, exportCsv, profilePage, habitsPage, informationPage };

  try {
    ensureData();
    const initialRoute = routeNow();
    if (!location.hash || ['dashboard','focus-path'].includes(initialRoute)) history.replaceState(null, '', '#today');
    renderPremium();
  } catch (error) {
    console.error('[V78 Premium]', error);
    document.body.classList.remove('v78-booting');
  }
})();
