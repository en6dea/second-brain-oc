'use strict';

/* Second Brain OS V77 — постепенное внедрение дисциплины.
   Важно: модуль только добавляет данные в state.discipline и не очищает существующие коллекции. */
(() => {
  const BUILD = 'second-brain-space-v77-discipline-20260720-r1';
  const LABEL = 'V77 · DISCIPLINE MODE';
  const CUSTOM_ROUTES = new Set(['today', 'discipline', 'library']);
  const LIBRARY_ROUTES = new Set(['library', 'wishes', 'notes', 'ideas', 'people', 'personal', 'polina', 'subconscious', 'inbox', 'documents', 'books', 'films', 'trips', 'passwords']);
  const DAY = 86400000;
  let timerTickId = 0;
  let postRenderTimer = 0;

  const clean = value => String(value ?? '').trim();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const numeric = value => Number(String(value ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
  const todayKey = () => typeof today === 'function' ? today() : localDateKey(new Date());
  const localDateKey = date => {
    const value = new Date(date);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };
  const localDate = value => new Date(`${String(value).slice(0, 10)}T12:00:00`);
  const addDaysKey = (value, amount) => {
    const date = localDate(value);
    date.setDate(date.getDate() + Number(amount || 0));
    return localDateKey(date);
  };
  const diffDays = (from, to) => Math.round((localDate(to) - localDate(from)) / DAY);
  const formatDate = value => value ? localDate(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '—';
  const formatShort = value => value ? localDate(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—';
  const formatMoney = value => typeof money === 'function' ? money(value) : `${numeric(value).toLocaleString('ru-RU')} ₽`;
  const makeId = () => typeof uid === 'function' ? uid() : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const nowIso = () => new Date().toISOString();
  const routeNow = () => (location.hash || '').replace('#', '') || 'today';
  const plural = (number, one, few, many) => {
    const value = Math.abs(Number(number || 0)) % 100;
    const last = value % 10;
    if (value > 10 && value < 20) return many;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
  };

  function defaultDiscipline() {
    const start = todayKey();
    return {
      version: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      activeHabit: {
        id: 'reading-20',
        title: 'Чтение',
        fullMinutes: 20,
        minimumMinutes: 5,
        cue: 'После ужина',
        place: 'В спокойном месте, телефон экраном вниз',
        startDate: start,
        targetDays: 42,
        reviewEveryDays: 7,
        status: 'active'
      },
      sessions: [],
      financeChecks: {},
      reviews: [],
      timer: null,
      xp: 0,
      level: 1,
      lastInteractionAt: nowIso(),
      libraryOpenedAt: '',
      migration: { from: 'v76', appliedAt: nowIso() }
    };
  }

  function ensureData() {
    if (typeof state !== 'object' || !state) return null;
    const base = defaultDiscipline();
    const previous = state.discipline && typeof state.discipline === 'object' ? state.discipline : {};
    state.discipline = {
      ...base,
      ...previous,
      activeHabit: { ...base.activeHabit, ...(previous.activeHabit || {}) },
      sessions: Array.isArray(previous.sessions) ? previous.sessions : [],
      financeChecks: previous.financeChecks && typeof previous.financeChecks === 'object' ? previous.financeChecks : {},
      reviews: Array.isArray(previous.reviews) ? previous.reviews : [],
      migration: { ...base.migration, ...(previous.migration || {}) }
    };
    state.discipline.sessions = state.discipline.sessions
      .filter(item => item && item.date)
      .map(item => ({
        id: clean(item.id) || makeId(),
        date: String(item.date).slice(0, 10),
        minutes: Math.max(1, numeric(item.minutes)),
        mode: item.mode === 'minimum' ? 'minimum' : 'full',
        resistance: Math.max(0, Math.min(10, numeric(item.resistance))),
        note: clean(item.note),
        completedAt: clean(item.completedAt) || nowIso()
      }))
      .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
    return state.discipline;
  }

  function persist(message = '') {
    const data = ensureData();
    if (!data) return;
    data.updatedAt = nowIso();
    data.lastInteractionAt = nowIso();
    if (typeof save === 'function') save();
    if (message && typeof toast === 'function') toast(message);
  }

  function uniqueSessionDays() {
    const data = ensureData();
    return new Set(data.sessions.map(item => item.date));
  }

  function sessionsForDate(date) {
    return ensureData().sessions.filter(item => item.date === date);
  }

  function minutesForDate(date) {
    return sessionsForDate(date).reduce((sum, item) => sum + numeric(item.minutes), 0);
  }

  function completedOn(date) {
    return minutesForDate(date) >= ensureData().activeHabit.minimumMinutes;
  }

  function fullCompletedOn(date) {
    return minutesForDate(date) >= ensureData().activeHabit.fullMinutes;
  }

  function lastNDays(count) {
    return Array.from({ length: count }, (_, index) => addDaysKey(todayKey(), -(count - 1 - index)));
  }

  function completionStats() {
    const data = ensureData();
    const start = data.activeHabit.startDate || todayKey();
    const elapsed = Math.max(1, Math.min(data.activeHabit.targetDays, diffDays(start, todayKey()) + 1));
    const allDays = Array.from({ length: elapsed }, (_, index) => addDaysKey(start, index));
    const completed = allDays.filter(completedOn).length;
    const full = allDays.filter(fullCompletedOn).length;
    const minimum = completed - full;
    const weekDays = lastNDays(7);
    const weekCompleted = weekDays.filter(completedOn).length;
    const totalMinutes = data.sessions.reduce((sum, item) => sum + numeric(item.minutes), 0);
    const averageResistance = data.sessions.length
      ? data.sessions.reduce((sum, item) => sum + numeric(item.resistance), 0) / data.sessions.length
      : 0;
    return { start, elapsed, completed, full, minimum, weekCompleted, totalMinutes, averageResistance, allDays, weekDays };
  }

  function financeSnapshot() {
    ensureData();
    const balance = numeric(state.settings?.currentBalance);
    const debts = Array.isArray(state.debts) ? state.debts : [];
    const purchases = Array.isArray(state.purchases) ? state.purchases : [];
    const activeDebts = debts.filter(item => item && item.direction === 'out' && !['Закрыто', 'Погашено', 'closed'].includes(clean(item.status)));
    const monthKey = todayKey().slice(0, 7);
    const mandatoryPurchases = purchases.filter(item => item && item.includeInBudget !== false && String(item.date || '').slice(0, 7) === monthKey);
    const obligations = activeDebts.reduce((sum, item) => sum + numeric(item.amount), 0);
    const planned = mandatoryPurchases.reduce((sum, item) => sum + numeric(item.amount), 0);
    const checked = Boolean(ensureData().financeChecks[todayKey()]);
    return { balance, obligations, planned, checked, activeDebts: activeDebts.length, mandatoryPurchases: mandatoryPurchases.length };
  }

  function currentTimer() {
    const timer = ensureData().timer;
    if (!timer || !timer.startedAt || !timer.durationSeconds) return null;
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000));
    const remaining = Math.max(0, numeric(timer.durationSeconds) - elapsed);
    return { ...timer, elapsed, remaining, complete: remaining <= 0 };
  }

  function formatClock(seconds) {
    const value = Math.max(0, Number(seconds || 0));
    const minutes = Math.floor(value / 60);
    const rest = value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  }

  function guidance() {
    const data = ensureData();
    const stats = completionStats();
    const finance = financeSnapshot();
    const timer = currentTimer();
    const completedToday = completedOn(todayKey());
    const hour = new Date().getHours();
    const sessionDates = [...uniqueSessionDays()].sort();
    const lastDate = sessionDates.at(-1) || '';
    const missedYesterday = !completedOn(addDaysKey(todayKey(), -1));

    if (timer && !timer.complete) return { tone: 'focus', icon: '▶', title: 'Действие уже начато', text: `Осталось ${formatClock(timer.remaining)}. Не переключайтесь на настройку системы.`, action: 'timer' };
    if (timer?.complete) return { tone: 'success', icon: '✓', title: 'Таймер завершён', text: 'Зафиксируйте результат — это важнее идеальной заметки.', action: 'finish' };
    if (completedToday) return { tone: 'success', icon: '✓', title: 'Главное действие дня выполнено', text: 'Сегодня не нужно увеличивать нагрузку. Закрепляйте повторяемость.', action: 'done' };
    if (lastDate && diffDays(lastDate, todayKey()) >= 2) return { tone: 'recovery', icon: '↻', title: 'Режим возвращения', text: 'Не наверстывайте пропущенное. Сегодня достаточно минимальных 5 минут.', action: 'minimum' };
    if (missedYesterday && sessionDates.length) return { tone: 'recovery', icon: '↻', title: 'Не пропускаем дважды', text: 'Вчерашний пропуск не нужно компенсировать. Просто вернитесь сегодня.', action: 'minimum' };
    if (stats.elapsed >= 7 && stats.weekCompleted < 4) return { tone: 'support', icon: '◇', title: 'Снизьте сопротивление', text: `За 7 дней выполнено ${stats.weekCompleted}/7. Сохраните сигнал «${data.activeHabit.cue}» и начните с 5 минут.`, action: 'minimum' };
    if (hour >= 18) return { tone: 'support', icon: '◷', title: 'День подходит к концу', text: 'Не обсуждайте с собой 20 минут. Запустите минимальную версию на 5 минут.', action: 'minimum' };
    if (!finance.checked && hour >= 12) return { tone: 'finance', icon: '₽', title: 'Финансовая проверка ещё не выполнена', text: 'Достаточно 2 минут: сверить остаток и обязательные расходы.', action: 'finance' };
    return { tone: 'calm', icon: '→', title: 'Одна привычка, один сигнал', text: `${data.activeHabit.cue} → ${data.activeHabit.fullMinutes} минут чтения. Минимум на трудный день — ${data.activeHabit.minimumMinutes} минут.`, action: 'full' };
  }

  function progressPercent(value, total) {
    return Math.max(0, Math.min(100, total ? Math.round(value / total * 100) : 0));
  }

  function renderGuidanceCard(item) {
    const actionButton = item.action === 'finance'
      ? '<button class="v77-primary" data-v77-action="finance-check" type="button">Проверить финансы</button>'
      : item.action === 'finish'
        ? '<button class="v77-primary" data-v77-action="finish-timer" type="button">Зафиксировать чтение</button>'
        : item.action === 'done'
          ? '<button data-v77-route="discipline" type="button">Посмотреть прогресс</button>'
          : item.action === 'timer'
            ? '<button class="v77-primary" data-v77-action="finish-timer" type="button">Завершить досрочно</button>'
            : `<button class="v77-primary" data-v77-action="start-timer" data-mode="${item.action === 'minimum' ? 'minimum' : 'full'}" type="button">Начать ${item.action === 'minimum' ? '5' : '20'} минут</button>`;
    return `<section class="v77-guidance is-${item.tone}"><div class="v77-guidance-icon">${item.icon}</div><div><span>Подсказка по текущим данным</span><h2>${escape(item.title)}</h2><p>${escape(item.text)}</p><div class="v77-guidance-actions">${actionButton}<button data-v77-action="edit-habit-cue" type="button">Настроить сигнал</button></div></div></section>`;
  }

  function todayPage() {
    const data = ensureData();
    const stats = completionStats();
    const finance = financeSnapshot();
    const guide = guidance();
    const timer = currentTimer();
    const todayMinutes = minutesForDate(todayKey());
    const review = reviewStatus();
    const target = data.activeHabit.targetDays;
    const dayNumber = Math.min(target, Math.max(1, diffDays(data.activeHabit.startDate, todayKey()) + 1));
    const weekPercent = progressPercent(stats.weekCompleted, 7);
    const experimentPercent = progressPercent(stats.completed, target);

    return `<section class="v77-page">
      <header class="v77-hero"><div><span>ПОСТЕПЕННАЯ ДИСЦИПЛИНА</span><h1>Сегодня</h1><p>Главный экран показывает только действия, которые сейчас действительно важны.</p></div><div class="v77-day-chip">День ${dayNumber} из ${target}</div></header>
      ${renderGuidanceCard(guide)}
      <section class="v77-today-grid">
        <article class="v77-card v77-habit-card">
          <header><div><span>АКТИВНАЯ ПРИВЫЧКА</span><h2>${escape(data.activeHabit.title)} · ${data.activeHabit.fullMinutes} минут</h2><p>${escape(data.activeHabit.cue)} · ${escape(data.activeHabit.place)}</p></div><i>1</i></header>
          ${timer ? `<div class="v77-timer" data-v77-timer><span>${timer.complete ? 'Готово' : 'Осталось'}</span><strong data-v77-timer-clock>${formatClock(timer.remaining)}</strong><div class="v77-progress"><b data-v77-timer-progress style="width:${progressPercent(timer.elapsed, timer.durationSeconds)}%"></b></div><div class="v77-row-actions"><button class="v77-primary" data-v77-action="finish-timer" type="button">${timer.complete ? 'Зафиксировать' : 'Завершить'}</button><button data-v77-action="cancel-timer" type="button">Отменить таймер</button></div></div>` : `<div class="v77-start-panel"><div><b>${todayMinutes ? `${todayMinutes} мин. уже сегодня` : 'Ещё не начато'}</b><small>Полная версия — ${data.activeHabit.fullMinutes} мин. · минимальная — ${data.activeHabit.minimumMinutes} мин.</small></div><div class="v77-row-actions"><button class="v77-primary" data-v77-action="start-timer" data-mode="full" type="button">▶ Начать 20 минут</button><button data-v77-action="start-timer" data-mode="minimum" type="button">Начать 5 минут</button><button data-v77-action="manual-complete" data-mode="full" type="button">Уже прочитал</button></div></div>`}
          <div class="v77-mini-stats"><div><span>Последние 7 дней</span><b>${stats.weekCompleted}/7</b><small>${weekPercent}% ритма</small></div><div><span>Эксперимент</span><b>${stats.completed}/${target}</b><small>${experimentPercent}% пути</small></div><div><span>Всего чтения</span><b>${stats.totalMinutes}</b><small>минут</small></div></div>
        </article>

        <article class="v77-card v77-finance-card">
          <header><div><span>ФИНАНСОВАЯ ОСОЗНАННОСТЬ</span><h2>Проверка на 2 минуты</h2><p>Не планирование бюджета, а короткая сверка фактов.</p></div><i class="${finance.checked ? 'is-done' : ''}">${finance.checked ? '✓' : '2'}</i></header>
          <div class="v77-finance-numbers"><div><span>Фактический остаток</span><b>${formatMoney(finance.balance)}</b></div><div><span>Долги и обязательства</span><b>${formatMoney(finance.obligations)}</b></div><div><span>Обязательные покупки месяца</span><b>${formatMoney(finance.planned)}</b></div></div>
          <div class="v77-row-actions"><button class="${finance.checked ? '' : 'v77-primary'}" data-v77-action="finance-check" type="button">${finance.checked ? 'Проверка выполнена · изменить' : 'Проверить финансы'}</button><button data-v77-route="finance" type="button">Открыть финансы</button></div>
        </article>
      </section>

      <section class="v77-secondary-grid">
        <article class="v77-card"><header><div><span>НЕДЕЛЬНЫЙ РАЗБОР</span><h2>${review.due ? 'Пора скорректировать систему' : `Следующий разбор через ${review.daysLeft} ${plural(review.daysLeft, 'день', 'дня', 'дней')}`}</h2></div><i>${review.due ? '!' : '◇'}</i></header><p>Три вопроса: что получилось, что мешало начать и как упростить следующую неделю.</p><button class="${review.due ? 'v77-primary' : ''}" data-v77-action="open-review" type="button">${review.due ? 'Пройти разбор' : 'Открыть текущий разбор'}</button></article>
        <article class="v77-card v77-locked"><header><div><span>СЛЕДУЮЩАЯ ПРИВЫЧКА</span><h2>Финансовая фиксация расходов</h2></div><i>🔒</i></header><p>Новая привычка не добавляется автоматически. Сначала анализируем ритм чтения и сопротивление.</p><div class="v77-lock-line"><b style="width:${experimentPercent}%"></b></div><small>Решение принимается после измеряемого периода, а не после одной удачной недели.</small></article>
      </section>
    </section>`;
  }

  function disciplinePage() {
    const data = ensureData();
    const stats = completionStats();
    const days = lastNDays(42);
    const reviews = data.reviews.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const sessions = data.sessions.slice(0, 20);
    return `<section class="v77-page">
      <header class="v77-hero"><div><span>СИСТЕМА ДИСЦИПЛИНЫ</span><h1>Привычка: ${escape(data.activeHabit.title)}</h1><p>Одна активная привычка, стабильный сигнал и измерение реального поведения.</p></div><div class="v77-hero-actions"><button data-v77-action="edit-habit-cue" type="button">Настроить сигнал</button><button class="v77-primary" data-v77-route="today" type="button">Вернуться в сегодня</button></div></header>
      <section class="v77-kpis"><article><span>Дней выполнено</span><b>${stats.completed}/${data.activeHabit.targetDays}</b><small>${stats.full} полноценных · ${stats.minimum} минимальных</small></article><article><span>Последние 7 дней</span><b>${stats.weekCompleted}/7</b><small>цель — устойчивость, а не серия</small></article><article><span>Среднее сопротивление</span><b>${stats.averageResistance ? stats.averageResistance.toFixed(1) : '—'}/10</b><small>должно снижаться со временем</small></article><article><span>Опыт дисциплины</span><b>${numeric(data.xp)} XP</b><small>уровень ${numeric(data.level) || 1}</small></article></section>
      <section class="v77-card v77-calendar-card"><header><div><span>42-ДНЕВНЫЙ ЭКСПЕРИМЕНТ</span><h2>Карта повторений</h2><p>Зелёный — 20 минут, голубой — минимальные 5 минут, пустой — без выполнения.</p></div></header><div class="v77-discipline-calendar">${days.map(date => { const minutes = minutesForDate(date); const cls = minutes >= data.activeHabit.fullMinutes ? 'is-full' : minutes >= data.activeHabit.minimumMinutes ? 'is-minimum' : ''; return `<button class="${cls} ${date === todayKey() ? 'is-today' : ''}" data-v77-action="manual-complete" data-mode="${cls === 'is-full' ? 'full' : 'minimum'}" data-date="${date}" type="button"><b>${Number(date.slice(8, 10))}</b><small>${minutes ? `${minutes} мин` : '—'}</small></button>`; }).join('')}</div></section>
      <section class="v77-detail-grid">
        <article class="v77-card"><header><div><span>ПОСЛЕДНИЕ СЕССИИ</span><h2>Фактические действия</h2></div></header><div class="v77-history">${sessions.length ? sessions.map(item => `<div><span class="${item.mode === 'full' ? 'is-full' : 'is-minimum'}">${item.mode === 'full' ? '20' : '5'}</span><div><b>${escape(formatDate(item.date))} · ${item.minutes} мин.</b><small>Сопротивление ${item.resistance}/10${item.note ? ` · ${escape(item.note)}` : ''}</small></div></div>`).join('') : '<p class="v77-empty">Первая сессия появится после чтения.</p>'}</div></article>
        <article class="v77-card"><header><div><span>НЕДЕЛЬНЫЕ РАЗБОРЫ</span><h2>Что менялось</h2></div><button data-v77-action="open-review" type="button">Добавить</button></header><div class="v77-review-list">${reviews.length ? reviews.map(item => `<article><b>${escape(formatDate(item.date || item.createdAt))}</b><p><strong>Мешало:</strong> ${escape(item.obstacle || '—')}</p><p><strong>Упростить:</strong> ${escape(item.simplify || '—')}</p></article>`).join('') : '<p class="v77-empty">Разбор появится после первой недели.</p>'}</div></article>
      </section>
    </section>`;
  }

  const LIBRARY_GROUPS = [
    { title: 'Мысли и знания', description: 'Заметки, идеи, документы, книги и доступы', items: [
      ['notes', 'Заметки', '📝', 'notes'], ['ideas', 'Идеи', '💡', 'ideas'], ['documents', 'Документы', '📄', 'documents'], ['books', 'Книги', '📚', 'books'], ['films', 'Фильмы', '🎬', 'films'], ['passwords', 'Пароли и доступы', '🔐', 'passwordVault']
    ] },
    { title: 'Я и люди', description: 'Контакты, личные записи и отношения', items: [
      ['people', 'Люди', '👥', 'people'], ['personal', 'Личное', '🌿', 'personal'], ['polina', 'Состояние Полины', '🌸', 'polinaDays'], ['subconscious', 'Подсознание', '◌', 'subconscious']
    ] },
    { title: 'Желания и опыт', description: 'Необязательные планы и сохранённые впечатления', items: [
      ['wishes', 'Желания', '💗', 'wishes'], ['trips', 'Путешествия', '✈️', 'trips']
    ] }
  ];

  function collectionCount(key) {
    const value = state?.[key];
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === 'object') return Object.keys(value).length;
    return 0;
  }

  function libraryRecords() {
    const configs = [
      ['notes', 'Заметка', 'notes'], ['ideas', 'Идея', 'ideas'], ['documents', 'Документ', 'documents'], ['books', 'Книга', 'books'], ['films', 'Фильм', 'films'], ['people', 'Человек', 'people'], ['personal', 'Личное', 'personal'], ['wishes', 'Желание', 'wishes'], ['trips', 'Путешествие', 'trips']
    ];
    const rows = [];
    configs.forEach(([route, kind, key]) => {
      const items = Array.isArray(state?.[key]) ? state[key] : [];
      items.forEach(item => rows.push({
        route,
        kind,
        title: clean(item.title || item.name || item.person || item.place || kind),
        text: clean(item.note || item.text || item.author || item.role || item.area || item.likes || item.quotes || '')
      }));
    });
    return rows;
  }

  function libraryResultHtml(query) {
    const text = clean(query).toLowerCase();
    if (!text) return '<p class="v77-library-hint">Начните вводить название, человека, идею или фрагмент заметки.</p>';
    const results = libraryRecords().filter(item => `${item.title} ${item.text} ${item.kind}`.toLowerCase().includes(text)).slice(0, 30);
    if (!results.length) return '<p class="v77-library-hint">Совпадений нет. Данные не удалены — попробуйте другое слово.</p>';
    return results.map(item => `<button class="v77-library-result" data-v77-route="${item.route}" type="button"><span>${escape(item.kind)}</span><div><b>${escape(item.title)}</b><small>${escape(item.text || 'Открыть раздел')}</small></div><i>→</i></button>`).join('');
  }

  function libraryPage() {
    const data = ensureData();
    data.libraryOpenedAt = nowIso();
    return `<section class="v77-page">
      <header class="v77-hero"><div><span>ЕДИНАЯ БИБЛИОТЕКА</span><h1>Материалы и личная память</h1><p>Необязательные разделы собраны в одном месте: их не нужно заполнять для ежедневной дисциплины.</p></div><div class="v77-day-chip">Данные сохранены</div></header>
      <section class="v77-card v77-library-search-card"><label><span>Быстрый поиск по материалам</span><div><i>⌕</i><input data-v77-library-search type="search" placeholder="Например: Полина, книга, идея, документ…" autocomplete="off"></div></label><div class="v77-library-results" data-v77-library-results>${libraryResultHtml('')}</div></section>
      <section class="v77-library-groups">${LIBRARY_GROUPS.map(group => `<article class="v77-card"><header><div><span>БИБЛИОТЕКА</span><h2>${escape(group.title)}</h2><p>${escape(group.description)}</p></div></header><div class="v77-library-tiles">${group.items.map(([route, label, icon, key]) => `<button data-v77-route="${route}" type="button"><i>${icon}</i><span><b>${escape(label)}</b><small>${collectionCount(key)} ${plural(collectionCount(key), 'запись', 'записи', 'записей')}</small></span><em>→</em></button>`).join('')}</div></article>`).join('')}</section>
    </section>`;
  }

  function reviewStatus() {
    const data = ensureData();
    const start = data.activeHabit.startDate || todayKey();
    const elapsed = Math.max(0, diffDays(start, todayKey()));
    const week = Math.floor(elapsed / Math.max(1, data.activeHabit.reviewEveryDays || 7));
    const currentKey = `${start}-w${week}`;
    const completed = data.reviews.some(item => item.key === currentKey);
    const remainder = elapsed % Math.max(1, data.activeHabit.reviewEveryDays || 7);
    const due = elapsed >= 6 && !completed;
    const daysLeft = completed ? Math.max(1, 7 - remainder) : Math.max(0, 6 - remainder);
    return { due, daysLeft, week, key: currentKey, completed };
  }

  function openCompletion(mode = 'full', date = todayKey(), timer = null) {
    const data = ensureData();
    const minutes = mode === 'minimum' ? data.activeHabit.minimumMinutes : data.activeHabit.fullMinutes;
    const actualMinutes = timer ? Math.max(1, Math.round(Math.min(timer.durationSeconds, timer.elapsed || timer.durationSeconds) / 60)) : minutes;
    const html = `<div class="v77-modal-form"><div class="v77-modal-summary"><span>${mode === 'minimum' ? 'Минимальная версия' : 'Полное выполнение'}</span><b>${actualMinutes} ${plural(actualMinutes, 'минута', 'минуты', 'минут')}</b><small>${escape(formatDate(date))}</small></div><label><span>Насколько трудно было начать? 0–10</span><input id="v77_resistance" type="number" min="0" max="10" value="5"></label><label><span>Одна короткая мысль или наблюдение</span><textarea id="v77_session_note" placeholder="Необязательно. Например: после первых двух минут стало легче."></textarea></label><div class="v77-modal-actions"><button class="v77-primary" data-v77-action="save-session" data-mode="${mode}" data-date="${date}" data-minutes="${actualMinutes}" type="button">Сохранить выполнение</button><button data-v77-action="close-modal" type="button">Отмена</button></div></div>`;
    if (typeof openModal === 'function') openModal('Зафиксировать чтение', html);
  }

  function saveSession(button) {
    const data = ensureData();
    const date = clean(button.dataset.date) || todayKey();
    const mode = button.dataset.mode === 'minimum' ? 'minimum' : 'full';
    const minutes = Math.max(1, numeric(button.dataset.minutes) || (mode === 'minimum' ? data.activeHabit.minimumMinutes : data.activeHabit.fullMinutes));
    const resistance = Math.max(0, Math.min(10, numeric(document.getElementById('v77_resistance')?.value)));
    const note = clean(document.getElementById('v77_session_note')?.value);
    const firstCompletionToday = !completedOn(date);
    data.sessions.unshift({ id: makeId(), date, minutes, mode, resistance, note, completedAt: nowIso() });
    if (firstCompletionToday) data.xp = numeric(data.xp) + (mode === 'minimum' ? 4 : 10) + (note ? 2 : 0);
    data.level = 1 + Math.floor(numeric(data.xp) / 100);
    data.timer = null;
    persist('Выполнение сохранено');
    if (typeof closeModal === 'function') closeModal();
    renderCustomRoute();
  }

  function startTimer(mode) {
    const data = ensureData();
    const minutes = mode === 'minimum' ? data.activeHabit.minimumMinutes : data.activeHabit.fullMinutes;
    data.timer = { startedAt: nowIso(), durationSeconds: minutes * 60, mode: mode === 'minimum' ? 'minimum' : 'full' };
    persist(`Таймер на ${minutes} минут запущен`);
    renderCustomRoute();
  }

  function cancelTimer() {
    ensureData().timer = null;
    persist('Таймер отменён, данные привычки сохранены');
    renderCustomRoute();
  }

  function finishTimer() {
    const timer = currentTimer();
    if (!timer) return openCompletion('full');
    return openCompletion(timer.mode, todayKey(), timer);
  }

  function openFinanceCheck() {
    const finance = financeSnapshot();
    const existing = ensureData().financeChecks[todayKey()] || {};
    const html = `<div class="v77-modal-form"><p class="v77-modal-note">Задача — сверить факты за 2 минуты, а не составлять идеальный бюджет.</p><label><span>Фактический остаток сейчас</span><input id="v77_finance_balance" type="number" step="0.01" value="${numeric(existing.balance ?? finance.balance)}"></label><div class="v77-modal-facts"><div><span>Активные обязательства</span><b>${formatMoney(finance.obligations)}</b></div><div><span>Обязательные покупки месяца</span><b>${formatMoney(finance.planned)}</b></div></div><label><span>Короткая заметка</span><textarea id="v77_finance_note" placeholder="Например: до зарплаты не покупать необязательное">${escape(existing.note || '')}</textarea></label><div class="v77-modal-actions"><button class="v77-primary" data-v77-action="save-finance-check" type="button">Сохранить проверку</button><button data-v77-action="close-modal" type="button">Отмена</button></div></div>`;
    if (typeof openModal === 'function') openModal('Ежедневная проверка финансов', html);
  }

  function saveFinanceCheck() {
    const data = ensureData();
    const wasChecked = Boolean(data.financeChecks[todayKey()]);
    const balance = numeric(document.getElementById('v77_finance_balance')?.value);
    const note = clean(document.getElementById('v77_finance_note')?.value);
    state.settings = state.settings || {};
    state.settings.currentBalance = balance;
    data.financeChecks[todayKey()] = { date: todayKey(), balance, note, completedAt: nowIso() };
    if (!wasChecked) data.xp = numeric(data.xp) + 5;
    persist('Финансовая проверка сохранена');
    if (typeof closeModal === 'function') closeModal();
    renderCustomRoute();
  }

  function openHabitCue() {
    const habit = ensureData().activeHabit;
    const html = `<div class="v77-modal-form"><p class="v77-modal-note">Стабильный контекст важнее мотивации. Выберите конкретный момент и место.</p><label><span>Сигнал «после чего?»</span><input id="v77_habit_cue" value="${escape(habit.cue)}" placeholder="После ужина"></label><label><span>Где и при каких условиях?</span><textarea id="v77_habit_place" placeholder="В кресле, книга уже лежит рядом, телефон экраном вниз">${escape(habit.place)}</textarea></label><div class="v77-modal-actions"><button class="v77-primary" data-v77-action="save-habit-cue" type="button">Сохранить сигнал</button><button data-v77-action="close-modal" type="button">Отмена</button></div></div>`;
    if (typeof openModal === 'function') openModal('Сигнал привычки', html);
  }

  function saveHabitCue() {
    const data = ensureData();
    data.activeHabit.cue = clean(document.getElementById('v77_habit_cue')?.value) || 'После ужина';
    data.activeHabit.place = clean(document.getElementById('v77_habit_place')?.value) || 'В спокойном месте';
    persist('Сигнал привычки сохранён');
    if (typeof closeModal === 'function') closeModal();
    renderCustomRoute();
  }

  function openReview() {
    const status = reviewStatus();
    const existing = ensureData().reviews.find(item => item.key === status.key) || {};
    const stats = completionStats();
    const html = `<div class="v77-modal-form"><div class="v77-modal-summary"><span>Последние 7 дней</span><b>${stats.weekCompleted}/7 выполнений</b><small>Разбор нужен для настройки системы, а не для оценки себя.</small></div><label><span>Что чаще всего мешало начать?</span><textarea id="v77_review_obstacle" placeholder="Усталость, телефон, позднее время, книга была не рядом…">${escape(existing.obstacle || '')}</textarea></label><label><span>Как сделать следующую неделю проще?</span><textarea id="v77_review_simplify" placeholder="Перенести время, подготовить книгу заранее, начать с 5 минут…">${escape(existing.simplify || '')}</textarea></label><label><span>Что сработало?</span><textarea id="v77_review_worked" placeholder="Конкретный сигнал, удобное место, короткий таймер…">${escape(existing.worked || '')}</textarea></label><div class="v77-modal-actions"><button class="v77-primary" data-v77-action="save-review" data-key="${escape(status.key)}" type="button">Сохранить разбор</button><button data-v77-action="close-modal" type="button">Отмена</button></div></div>`;
    if (typeof openModal === 'function') openModal('Недельный разбор', html);
  }

  function saveReview(button) {
    const data = ensureData();
    const key = clean(button.dataset.key) || reviewStatus().key;
    const next = {
      key,
      date: todayKey(),
      obstacle: clean(document.getElementById('v77_review_obstacle')?.value),
      simplify: clean(document.getElementById('v77_review_simplify')?.value),
      worked: clean(document.getElementById('v77_review_worked')?.value),
      createdAt: nowIso()
    };
    data.reviews = data.reviews.filter(item => item.key !== key);
    data.reviews.unshift(next);
    data.xp = numeric(data.xp) + 10;
    persist('Недельный разбор сохранён');
    if (typeof closeModal === 'function') closeModal();
    renderCustomRoute();
  }

  function routeLabel(route) {
    const labels = {
      today: 'Сегодня', finance: 'Финансы', discipline: 'Привычка', debts: 'Обязательства', tasks: 'Задачи', planning: 'Планирование', goals: 'Цели', purchases: 'Покупки', library: 'Библиотека', trading: 'Трейдинг', 'trading-course': 'Обучение трейдингу', calendar: 'Календарь', sleep: 'Сон', archive: 'Архив', system: 'Настройки'
    };
    return labels[route] || route;
  }

  function navButton(route, icon, label, note = '') {
    const current = routeNow();
    const active = route === current || (route === 'library' && LIBRARY_ROUTES.has(current));
    return `<button class="v77-nav-item ${active ? 'active' : ''}" data-v77-route="${route}" type="button"><i>${icon}</i><span><b>${escape(label)}</b>${note ? `<small>${escape(note)}</small>` : ''}</span></button>`;
  }

  function buildNavigation() {
    const nav = document.querySelector('.v59-nav-scroll');
    if (!nav) return;
    nav.querySelectorAll(':scope > .v68-nav-shell,:scope > .v59-section,:scope > .v59-nav-list').forEach(item => item.classList.add('v77-hidden-old-nav'));
    let shell = nav.querySelector(':scope > .v77-nav-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.className = 'v77-nav-shell';
      nav.appendChild(shell);
    }
    const openState = (() => { try { return JSON.parse(localStorage.getItem('secondBrainOS.v77.navOpen') || '{}'); } catch (error) { return {}; } })();
    const finance = financeSnapshot();
    const stats = completionStats();
    shell.innerHTML = `<div class="v77-nav-caption"><span>Фокус системы</span><small>сначала дисциплина и деньги</small></div><div class="v77-nav-main">${navButton('today', '◉', 'Сегодня', completedOn(todayKey()) ? 'главное выполнено' : 'одно главное действие')}${navButton('finance', '₽', 'Финансы', finance.checked ? 'проверено сегодня' : 'нужна короткая сверка')}${navButton('discipline', '↻', 'Привычка', `${stats.weekCompleted}/7 за неделю`)}${navButton('debts', '!', 'Обязательства', finance.activeDebts ? `${finance.activeDebts} активных` : 'нет активных')}</div><div class="v77-nav-folders"><details data-v77-folder="actions" ${openState.actions !== false ? 'open' : ''}><summary><span>Действия и планы</span><i>⌄</i></summary><div>${navButton('tasks', '✓', 'Задачи')}${navButton('planning', '▦', 'Планирование')}${navButton('goals', '◇', 'Цели')}${navButton('purchases', '◫', 'Покупки')}</div></details><details data-v77-folder="library" ${openState.library ? 'open' : ''}><summary><span>Материалы и память</span><i>⌄</i></summary><div>${navButton('library', '⌕', 'Библиотека', 'все необязательные разделы')}</div></details><details data-v77-folder="later" ${openState.later ? 'open' : ''}><summary><span>Позже и настройки</span><i>⌄</i></summary><div>${navButton('trading', '⌁', 'Трейдинг')}${navButton('calendar', '□', 'Календарь')}${navButton('sleep', '☾', 'Сон')}${navButton('archive', '▣', 'Архив')}${navButton('system', '·', 'Настройки')}</div></details></div>`;
    shell.querySelectorAll('details[data-v77-folder]').forEach(details => details.addEventListener('toggle', () => {
      const all = {};
      shell.querySelectorAll('details[data-v77-folder]').forEach(item => { all[item.dataset.v77Folder] = item.open; });
      try { localStorage.setItem('secondBrainOS.v77.navOpen', JSON.stringify(all)); } catch (error) {}
    }));
    buildMobileNav();
  }

  function buildMobileNav() {
    let nav = document.querySelector('.v77-bottom-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'v77-bottom-nav';
      document.body.appendChild(nav);
    }
    const current = routeNow();
    const items = [['today', '◉', 'Сегодня'], ['finance', '₽', 'Финансы'], ['discipline', '↻', 'Привычка'], ['library', '⌕', 'Библиотека']];
    nav.innerHTML = items.map(([route, icon, label]) => `<button class="${route === current || (route === 'library' && LIBRARY_ROUTES.has(current)) ? 'active' : ''}" data-v77-route="${route}" type="button"><i>${icon}</i><span>${label}</span></button>`).join('');
  }

  function setBuild() {
    document.body.dataset.sbosBuild = BUILD;
    document.body.dataset.v77Discipline = 'ready';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', BUILD);
    try { localStorage.setItem('secondBrainOS.currentBuild', BUILD); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version) version.textContent = LABEL;
    const core = document.querySelector('.v59-core-pill');
    if (core) core.textContent = 'V77';
  }

  function renderCustomRoute() {
    clearTimeout(postRenderTimer);
    ensureData();
    setBuild();
    buildNavigation();
    const route = routeNow();
    if (!CUSTOM_ROUTES.has(route)) return;
    const view = document.getElementById('view');
    if (!view) return;
    document.body.classList.toggle('v77-today-route', route === 'today');
    document.body.classList.toggle('v77-discipline-route', route === 'discipline');
    document.body.classList.toggle('v77-library-route', route === 'library');
    view.innerHTML = route === 'today' ? todayPage() : route === 'discipline' ? disciplinePage() : libraryPage();
    buildNavigation();
    startTimerTicker();
  }

  function schedulePostRender(delay = 20) {
    clearTimeout(postRenderTimer);
    postRenderTimer = setTimeout(renderCustomRoute, delay);
  }

  function startTimerTicker() {
    clearInterval(timerTickId);
    timerTickId = setInterval(() => {
      const timer = currentTimer();
      const root = document.querySelector('[data-v77-timer]');
      if (!root || !timer) return;
      const clock = root.querySelector('[data-v77-timer-clock]');
      const progress = root.querySelector('[data-v77-timer-progress]');
      if (clock) clock.textContent = formatClock(timer.remaining);
      if (progress) progress.style.width = `${progressPercent(timer.elapsed, timer.durationSeconds)}%`;
      if (timer.complete) {
        clearInterval(timerTickId);
        schedulePostRender(0);
      }
    }, 1000);
  }

  function navigateCustom(route) {
    ensureData().lastInteractionAt = nowIso();
    try { page = route; } catch (error) {}
    try { history.pushState(null, '', `#${route}`); }
    catch (error) { location.hash = route; }
    if (CUSTOM_ROUTES.has(route)) return renderCustomRoute();
    return null;
  }

  const previousNavigate = typeof window.v70Navigate === 'function' ? window.v70Navigate : null;
  window.v70Navigate = function (route) {
    const target = clean(route);
    if (CUSTOM_ROUTES.has(target)) return navigateCustom(target);
    return previousNavigate ? previousNavigate.apply(this, arguments) : (typeof go === 'function' ? go(target) : undefined);
  };

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      ensureData();
      const result = previousRender.apply(this, arguments);
      requestAnimationFrame(() => schedulePostRender(0));
      return result;
    };
  }

  window.addEventListener('click', event => {
    const routeButton = event.target.closest?.('[data-v77-route]');
    if (routeButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const route = routeButton.dataset.v77Route;
      if (CUSTOM_ROUTES.has(route)) return navigateCustom(route);
      ensureData().lastInteractionAt = nowIso();
      if (previousNavigate) return previousNavigate(route);
      if (typeof go === 'function') return go(route);
      return;
    }
    const button = event.target.closest?.('[data-v77-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const action = button.dataset.v77Action;
    if (action === 'start-timer') return startTimer(button.dataset.mode || 'full');
    if (action === 'finish-timer') return finishTimer();
    if (action === 'cancel-timer') return cancelTimer();
    if (action === 'manual-complete') return openCompletion(button.dataset.mode || 'full', button.dataset.date || todayKey());
    if (action === 'save-session') return saveSession(button);
    if (action === 'finance-check') return openFinanceCheck();
    if (action === 'save-finance-check') return saveFinanceCheck();
    if (action === 'edit-habit-cue') return openHabitCue();
    if (action === 'save-habit-cue') return saveHabitCue();
    if (action === 'open-review') return openReview();
    if (action === 'save-review') return saveReview(button);
    if (action === 'close-modal') return typeof closeModal === 'function' ? closeModal() : undefined;
  }, true);

  window.addEventListener('input', event => {
    const input = event.target.closest?.('[data-v77-library-search]');
    if (!input) return;
    const results = document.querySelector('[data-v77-library-results]');
    if (results) results.innerHTML = libraryResultHtml(input.value);
  });

  window.addEventListener('hashchange', () => schedulePostRender(10));
  window.addEventListener('storage', event => {
    if (event.key === 'secondBrainOS.v1') schedulePostRender(80);
  });

  window.V77Discipline = { ensureData, todayPage, disciplinePage, libraryPage, render: renderCustomRoute, startTimer, completionStats };

  try {
    ensureData();
    if (!location.hash || routeNow() === 'dashboard') {
      history.replaceState(null, '', '#today');
      try { page = 'today'; } catch (error) {}
    }
    schedulePostRender(0);
    schedulePostRender(180);
  } catch (error) {
    console.error('[V77 Discipline]', error);
  }
})();
