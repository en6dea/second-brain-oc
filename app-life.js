/* ============================================================================
   Second Brain OS — модель жизни.

   Замысел: в жизни происходят не «разделы», а события. Покупка, платёж,
   отметка привычки, прочитанная книга, день рождения, шаг к цели — всё это
   одно и то же по природе, просто хранится в разных коллекциях.

   Поэтому здесь события не заменяют записи, а выводятся из них. Коллекции
   остаются источником правды, лента — производное представление. Ошибка в
   этом файле не может испортить данные: он только читает.

   Раздел отвечает на вопрос, на который до сих пор ответить было нельзя:
   «что вообще происходило в моей жизни за последнее время».
   ========================================================================== */
'use strict';

(() => {
  const state = () => window.SecondBrainApp?.getState?.() || null;
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (v) => `${Math.round(num(v)).toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;

  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const WEEK = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => dayKey(new Date());
  const parse = (v) => {
    const raw = String(v || '');
    if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
    const [y, m, d] = raw.slice(0, 10).split('-').map(Number);
    const date = new Date(y, m - 1, d, 12);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const dateOf = (row, ...keys) => {
    for (const k of keys) {
      const v = row && row[k];
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    }
    return '';
  };

  /* ----------------------------------------------------------------- СБОР --
     Каждая коллекция описывается тем, как из её записи получается событие.
     Добавить новый источник — значит дописать сюда строку, а не менять код. */

  const SOURCES = [
    { key: 'operations', domain: 'money', icon: 'wallet',
      map: (r) => ({
        date: dateOf(r, 'date', 'createdAt'),
        title: r.category || (r.type === 'income' ? 'Доход' : 'Расход'),
        detail: [r.note, r.account].filter(Boolean).join(' · '),
        amount: r.type === 'income' ? num(r.amount) : -num(r.amount),
        kind: r.type === 'income' ? 'Доход' : r.type === 'transfer' ? 'Перевод' : 'Расход',
        route: 'finance-operations'
      }) },

    { key: 'debtPayments', domain: 'money', icon: 'debt',
      map: (r) => ({
        date: dateOf(r, 'date', 'createdAt'),
        title: 'Платёж по обязательству',
        detail: r.principal ? `тело ${money(r.principal)}${r.interest ? `, проценты ${money(r.interest)}` : ''}` : '',
        amount: -num(r.amount), kind: 'Платёж', route: 'debts'
      }) },

    { key: 'debts', domain: 'money', icon: 'debt',
      map: (r) => ({
        date: dateOf(r, 'createdAt'),
        title: `Заведено обязательство · ${r.creditor || r.person || 'без названия'}`,
        detail: r.interestRate ? `ставка ${r.interestRate}%` : '',
        amount: -num(r.initialAmount || r.currentBalance), kind: 'Обязательство', route: 'debts'
      }) },

    { key: 'tasks', domain: 'time', icon: 'check',
      map: (r) => ({
        date: dateOf(r, 'completedAt', 'date', 'createdAt'),
        title: r.title || 'Задача',
        detail: r.time || '',
        kind: r.completedAt || r.status === 'done' ? 'Задача выполнена' : 'Задача',
        done: Boolean(r.completedAt || r.status === 'done'),
        route: 'today'
      }) },

    { key: 'goals', domain: 'meaning', icon: 'target',
      map: (r) => ({
        date: dateOf(r, 'createdAt'),
        title: `Цель · ${r.title || 'без названия'}`,
        detail: r.nextAction || '',
        kind: 'Цель', route: 'goals'
      }) },

    { key: 'notes', domain: 'knowledge', icon: 'note',
      map: (r) => ({ date: dateOf(r, 'createdAt'), title: r.title || 'Заметка',
        detail: (r.text || '').slice(0, 90), kind: 'Заметка', route: 'information' }) },
    { key: 'ideas', domain: 'knowledge', icon: 'bulb',
      map: (r) => ({ date: dateOf(r, 'createdAt'), title: r.title || 'Идея',
        detail: (r.text || '').slice(0, 90), kind: 'Идея', route: 'information' }) },
    { key: 'books', domain: 'knowledge', icon: 'book',
      map: (r) => ({ date: dateOf(r, 'createdAt'), title: r.title || 'Книга',
        detail: r.author || '', kind: 'Книга', route: 'information' }) },
    { key: 'wishes', domain: 'meaning', icon: 'heart',
      map: (r) => ({ date: dateOf(r, 'createdAt'), title: r.title || 'Желание',
        detail: r.price ? money(r.price) : '', kind: 'Желание', route: 'information' }) },

    { key: 'people', domain: 'people', icon: 'user',
      map: (r) => ({ date: dateOf(r, 'createdAt'), title: r.name || 'Человек',
        detail: r.relation || r.role || '', kind: 'Человек', route: 'information' }) },

    { key: 'subconsciousEntries', domain: 'self', icon: 'spark',
      map: (r) => ({ date: dateOf(r, 'date', 'createdAt'),
        title: 'Запись дневника', detail: (r.conclusion || r.thought || '').slice(0, 90),
        kind: 'Дневник', route: 'subconscious' }) },

    { key: 'deferredPurchases', domain: 'money', icon: 'pause',
      map: (r) => ({ date: dateOf(r, 'createdAt'), title: `Покупка на паузе · ${r.title || ''}`,
        detail: r.status === 'approved' ? 'подтверждена' : r.status === 'declined' ? 'отменена' : 'ждёт решения',
        amount: r.amount ? -num(r.amount) : undefined, kind: 'Покупка', route: 'finance-planning' }) }
  ];

  /** Отметки привычек — не записи, а словарь дат внутри привычки. */
  function habitEvents(s) {
    const out = [];
    (s.habits || []).forEach((habit) => {
      const marks = habit && habit.marks && typeof habit.marks === 'object' ? habit.marks : {};
      Object.keys(marks).forEach((date) => {
        const value = marks[date];
        if (value === false || value === null || value === undefined) return;
        out.push({ date, domain: 'rhythm', icon: 'check', done: true,
          title: habit.name || 'Привычка', detail: '', kind: 'Привычка', route: 'habits' });
      });
    });
    return out;
  }

  /** Собирает все события. Читает состояние, ничего не меняет. */
  function collect(s) {
    if (!s) return [];
    const events = [];
    SOURCES.forEach((source) => {
      (s[source.key] || []).forEach((row) => {
        if (!row) return;
        let event;
        try { event = source.map(row); } catch (_) { return; }
        if (!event || !event.date) return;
        events.push(Object.assign({ domain: source.domain, icon: source.icon, id: row.id }, event));
      });
    });
    events.push(...habitEvents(s));
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }

  /* --------------------------------------------------------------- ЛЕНТА -- */

  const DOMAINS = {
    money:     { label: 'Деньги',  tone: 'money' },
    time:      { label: 'Время',   tone: 'time' },
    rhythm:    { label: 'Ритм',    tone: 'rhythm' },
    meaning:   { label: 'Смысл',   tone: 'meaning' },
    knowledge: { label: 'Знания',  tone: 'knowledge' },
    people:    { label: 'Люди',    tone: 'people' },
    self:      { label: 'Личное',  tone: 'self' }
  };

  const ICONS = {
    wallet: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18"/>',
    debt: '<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h5M8 17h8"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M8 12h8M8 16h6"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M8.2 14.5A6 6 0 1 1 15.8 14.5C14.7 15.3 14 16.1 14 18h-4c0-1.9-.7-2.7-1.8-3.5Z"/>',
    book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23V5.5Z"/>',
    heart: '<path d="M20.8 5.8a5.3 5.3 0 0 0-7.5 0L12 7.1l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 22l8.8-8.7a5.3 5.3 0 0 0 0-7.5Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    spark: '<path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/>',
    pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>'
  };

  const icon = (name) => `<svg class="sbos-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.spark}</svg>`;

  function dayTitle(dateKey) {
    const date = parse(dateKey);
    if (!date) return dateKey;
    const t = parse(today());
    const diff = Math.round((t - date) / 86_400_000);
    if (diff === 0) return 'Сегодня';
    if (diff === 1) return 'Вчера';
    if (diff === 2) return 'Позавчера';
    const weekday = WEEK[date.getDay()];
    return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${weekday}`;
  }

  let activeFilter = 'all';

  function page() {
    const s = state();
    const all = collect(s);
    const filtered = activeFilter === 'all' ? all : all.filter((e) => e.domain === activeFilter);
    const counts = {};
    all.forEach((e) => { counts[e.domain] = (counts[e.domain] || 0) + 1; });

    const head = `<header class="v78-page-head">
      <div>
        <span>Всё, что происходило</span>
        <h1>Лента жизни</h1>
        <p>Один поток вместо девятнадцати разделов. Записи остаются на своих местах — здесь они просто собраны по времени.</p>
      </div>
    </header>`;

    const filters = `<nav class="sbos-life-filters">
      <button class="${activeFilter === 'all' ? 'active' : ''}" type="button" data-sbos-life="all">
        Всё<i>${all.length}</i></button>
      ${Object.entries(DOMAINS).filter(([k]) => counts[k]).map(([k, d]) => `
        <button class="${activeFilter === k ? 'active' : ''}" type="button" data-sbos-life="${k}">
          ${esc(d.label)}<i>${counts[k]}</i></button>`).join('')}
    </nav>`;

    if (!all.length) {
      return `<section class="v78-page sbos-life-page">${head}
        <div class="v78-empty-big">Событий пока нет. Как только появятся операции, задачи или отметки привычек — они соберутся здесь в один поток.</div>
      </section>`;
    }

    /* Группируем по дням: человек помнит жизнь днями, а не записями. */
    const byDay = new Map();
    filtered.slice(0, 400).forEach((e) => {
      if (!byDay.has(e.date)) byDay.set(e.date, []);
      byDay.get(e.date).push(e);
    });

    const days = [...byDay.entries()].map(([date, events]) => {
      const spent = events.reduce((sum, e) => sum + (e.amount < 0 ? -e.amount : 0), 0);
      const earned = events.reduce((sum, e) => sum + (e.amount > 0 ? e.amount : 0), 0);
      return `<section class="sbos-life-day">
        <header>
          <h2>${esc(dayTitle(date))}</h2>
          <span>${events.length} ${events.length === 1 ? 'событие' : events.length < 5 ? 'события' : 'событий'}${
            spent ? ` · −${esc(money(spent))}` : ''}${earned ? ` · +${esc(money(earned))}` : ''}</span>
        </header>
        <div class="sbos-life-items">
          ${events.map((e) => `
            <button class="sbos-life-item" type="button" data-v78-route="${esc(e.route || 'today')}"
                data-tone="${esc(DOMAINS[e.domain]?.tone || 'time')}">
              <span class="ico">${icon(e.icon)}</span>
              <span class="txt">
                <b>${esc(e.title)}</b>
                <small>${esc(e.kind)}${e.detail ? ` · ${esc(e.detail)}` : ''}</small>
              </span>
              ${e.amount !== undefined && e.amount !== 0
                ? `<span class="amt ${e.amount < 0 ? 'out' : 'in'}">${e.amount < 0 ? '−' : '+'}${esc(money(Math.abs(e.amount)))}</span>`
                : e.done ? '<span class="amt done">✓</span>' : ''}
            </button>`).join('')}
        </div>
      </section>`;
    }).join('');

    return `<section class="v78-page sbos-life-page">${head}${filters}${days}</section>`;
  }

  /* ------------------------------------------------------------ ВСТРАИВАНИЕ */

  function addNavLink() {
    const nav = document.querySelector('.v78-sidebar .v78-side-nav, .v78-sidebar nav');
    if (!nav || nav.querySelector('[data-v78-route="life"]')) return;
    const first = nav.querySelector('.v78-side-link');
    if (!first) return;
    const link = document.createElement('a');
    link.className = 'v78-side-link';
    link.dataset.v78Route = 'life';
    link.href = '#life';
    link.innerHTML = `<i></i><span>Лента жизни</span>`;
    first.after(link);
  }

  function boot() {
    const router = window.SecondBrainRouter;
    if (!router) return;
    router.registerRoute('life');
    router.extendPage((route, base) => (route === 'life' ? page() : base(route)));

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sbos-life]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      activeFilter = button.dataset.sbosLife;
      router.navigate('life');
    }, true);

    const root = document.getElementById('app');
    if (root) new MutationObserver(() => addNavLink()).observe(root, { childList: true, subtree: true });
    addNavLink();
  }

  window.SecondBrainLife = { collect, page };

  /* Ждём приложение: точка расширения появляется вместе с ним. */
  const ready = () => {
    if (window.SecondBrainRouter) { boot(); return true; }
    return false;
  };
  if (!ready()) {
    window.addEventListener('second-brain-booted', () => { ready(); }, { once: true });
    let tries = 0;
    const timer = setInterval(() => { if (ready() || ++tries > 40) clearInterval(timer); }, 250);
  }
})();
