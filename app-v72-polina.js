'use strict';

/* Second Brain OS V72 — календарь состояния Полины и прогноз цикла.
   Данные остаются в общем state и автоматически попадают в backup / облачную синхронизацию. */
(() => {
  const BUILD = 'second-brain-space-v72-polina-state-20260716-r4';
  const LABEL = 'V72.2 · СОСТОЯНИЕ ПОЛИНЫ';
  const ROUTE = 'polina';
  const STATUS = {
    good: { label: 'Хорошее', short: 'Хорошее', icon: '✓' },
    neutral: { label: 'Нейтральное', short: 'Нейтральное', icon: '•' },
    bad: { label: 'Плохое', short: 'Плохое', icon: '!' }
  };
  let postTimer = 0;

  const clean = value => String(value ?? '').trim();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const todayStamp = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  const makeId = () => typeof uid === 'function' ? uid() : `${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
  const isoDate = value => {
    if (!value) return '';
    const raw = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
  };
  const dateAtNoon = value => new Date(`${isoDate(value)}T12:00:00`);
  const addDateDays = (value, amount) => {
    const date = dateAtNoon(value);
    date.setDate(date.getDate() + Number(amount || 0));
    return date.toISOString().slice(0, 10);
  };
  const diffDays = (from, to) => Math.round((dateAtNoon(to) - dateAtNoon(from)) / 86400000);
  const monthKey = value => (isoDate(value) || todayStamp()).slice(0, 7);
  const currentMonth = () => todayStamp().slice(0, 7);
  const round = value => Math.round(Number(value || 0));
  const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const formatDate = value => value ? dateAtNoon(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const formatShortDate = value => value ? dateAtNoon(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—';
  const formatMonth = key => {
    const match = /^(\d{4})-(\d{2})$/.exec(String(key || ''));
    if (!match) return '';
    const label = new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
  const plural = (number, one, few, many) => {
    const value = Math.abs(Number(number || 0)) % 100;
    const last = value % 10;
    if (value > 10 && value < 20) return many;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
  };

  function normalizeStatus(entry) {
    const explicit = clean(entry?.status).toLowerCase();
    if (STATUS[explicit]) return explicit;
    const legacy = clean(entry?.mood).toLowerCase();
    if (legacy === 'good') return 'good';
    if (legacy === 'neutral') return 'neutral';
    if (legacy === 'excellent') return 'good';
    if (legacy === 'bad') return 'bad';
    return '';
  }

  function normalizePeriodMarker(entry) {
    const explicit = clean(entry?.periodMarker || entry?.cycleMarker).toLowerCase();
    if (explicit === 'start' || explicit === 'end') return explicit;
    const legacy = clean(entry?.mood).toLowerCase();
    if (legacy === 'period_start') return 'start';
    if (legacy === 'period_end') return 'end';
    return '';
  }

  function normalizedEntry(entry) {
    return {
      id: clean(entry?.id) || makeId(),
      date: isoDate(entry?.date) || todayStamp(),
      status: normalizeStatus(entry),
      comment: clean(entry?.comment || entry?.note),
      periodMarker: normalizePeriodMarker(entry),
      updatedAt: clean(entry?.updatedAt) || ''
    };
  }

  function ensureData() {
    if (typeof state !== 'object' || !state) return;
    state.settings = state.settings || {};
    state.settings.polinaCycle = Object.assign({ lastStart: '', cycleLength: 28, duration: 5 }, state.settings.polinaCycle || {});
    state.settings.polinaMonth = /^\d{4}-\d{2}$/.test(String(state.settings.polinaMonth || '')) ? state.settings.polinaMonth : currentMonth();
    state.polinaCalendar = Object.assign({ version: 2 }, state.polinaCalendar || {});

    const rows = Array.isArray(state.polinaDays) ? state.polinaDays : [];
    const byDate = new Map();
    rows.forEach(raw => {
      const item = normalizedEntry(raw);
      const previous = byDate.get(item.date);
      if (!previous) {
        byDate.set(item.date, item);
        return;
      }
      byDate.set(item.date, {
        id: previous.id || item.id,
        date: item.date,
        status: item.status || previous.status,
        comment: item.comment || previous.comment,
        periodMarker: item.periodMarker || previous.periodMarker,
        updatedAt: item.updatedAt || previous.updatedAt
      });
    });
    state.polinaDays = [...byDate.values()].sort((left, right) => right.date.localeCompare(left.date));

    const starts = state.polinaDays.filter(item => item.periodMarker === 'start').map(item => item.date).sort();
    if (!starts.length && isoDate(state.settings.polinaCycle.lastStart)) {
      const date = isoDate(state.settings.polinaCycle.lastStart);
      state.polinaDays.push({ id: makeId(), date, status: '', comment: '', periodMarker: 'start', updatedAt: '' });
      state.polinaDays.sort((left, right) => right.date.localeCompare(left.date));
    }

    const section = typeof SECTIONS !== 'undefined' && Array.isArray(SECTIONS) ? SECTIONS.find(item => item.id === ROUTE) : null;
    if (section) {
      section.label = 'Состояние Полины';
      section.icon = '🌸';
      section.color = '#ec4899';
    }
  }

  function entriesAscending() {
    ensureData();
    return (state.polinaDays || []).map(normalizedEntry).sort((left, right) => left.date.localeCompare(right.date));
  }

  function cycleModel() {
    const entries = entriesAscending();
    const starts = [...new Set(entries.filter(item => item.periodMarker === 'start').map(item => item.date))].sort();
    const ends = [...new Set(entries.filter(item => item.periodMarker === 'end').map(item => item.date))].sort();
    const savedCycle = Math.max(20, Math.min(45, Number(state.settings?.polinaCycle?.cycleLength) || 28));
    const savedDuration = Math.max(1, Math.min(10, Number(state.settings?.polinaCycle?.duration) || 5));

    const intervals = [];
    for (let index = 1; index < starts.length; index += 1) {
      const days = diffDays(starts[index - 1], starts[index]);
      if (days >= 20 && days <= 45) intervals.push(days);
    }

    const durations = [];
    const ranges = [];
    starts.forEach((start, index) => {
      const nextStart = starts[index + 1] || '';
      const end = ends.find(value => value >= start && (!nextStart || value < nextStart) && diffDays(start, value) <= 12) || '';
      if (end) {
        const days = diffDays(start, end) + 1;
        if (days >= 1 && days <= 10) durations.push(days);
        ranges.push({ start, end, open: false });
      } else {
        const maximum = addDateDays(start, 9);
        const openEnd = todayStamp() >= start ? (todayStamp() < maximum ? todayStamp() : maximum) : start;
        ranges.push({ start, end: openEnd, open: true });
      }
    });

    const recentIntervals = intervals.slice(-6);
    const recentDurations = durations.slice(-6);
    const cycleLength = round(average(recentIntervals)) || savedCycle;
    const duration = round(average(recentDurations)) || savedDuration;
    const latestStart = starts.at(-1) || '';
    const latestEnd = latestStart ? (ends.filter(value => value >= latestStart && diffDays(latestStart, value) <= 12).at(0) || '') : '';

    let nextStart = latestStart ? addDateDays(latestStart, cycleLength) : '';
    while (nextStart && nextStart < todayStamp()) nextStart = addDateDays(nextStart, cycleLength);
    const forecasts = [];
    if (nextStart) {
      let cursor = nextStart;
      for (let index = 0; index < 6; index += 1) {
        forecasts.push({ start: cursor, end: addDateDays(cursor, duration - 1) });
        cursor = addDateDays(cursor, cycleLength);
      }
    }

    return {
      entries,
      starts,
      ends,
      ranges,
      intervals,
      durations,
      cycleLength,
      duration,
      latestStart,
      latestEnd,
      nextStart,
      forecasts,
      method: recentIntervals.length ? `среднее по ${recentIntervals.length} ${plural(recentIntervals.length, 'циклу', 'циклам', 'циклам')}` : `базовый ритм ${savedCycle} дней`
    };
  }

  function selectedMonth() {
    ensureData();
    return state.settings.polinaMonth || currentMonth();
  }

  function shiftMonth(key, delta) {
    const [year, month] = String(key || currentMonth()).split('-').map(Number);
    const date = new Date(year, month - 1 + Number(delta || 0), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function monthCells(key) {
    const [year, month] = String(key).split('-').map(Number);
    const first = new Date(year, month - 1, 1, 12);
    const last = new Date(year, month, 0, 12);
    const padding = (first.getDay() + 6) % 7;
    const cells = Array.from({ length: padding }, () => '');
    for (let day = 1; day <= last.getDate(); day += 1) cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    while (cells.length % 7 !== 0) cells.push('');
    return cells;
  }

  function entryByDate(date) {
    return (state.polinaDays || []).map(normalizedEntry).find(item => item.date === date) || null;
  }

  function actualPeriodInfo(date, model) {
    const range = model.ranges.find(item => date >= item.start && date <= item.end);
    if (!range) return null;
    if (date === range.start) return { label: 'Начало', kind: 'start', open: range.open };
    const marker = entryByDate(date)?.periodMarker;
    if (marker === 'end' || date === range.end && !range.open) return { label: 'Конец', kind: 'end', open: false };
    return { label: 'Месячные', kind: 'period', open: range.open };
  }

  function predictedPeriodInfo(date, model) {
    const forecast = model.forecasts.find(item => date >= item.start && date <= item.end);
    if (!forecast) return null;
    return { label: date === forecast.start ? 'Прогноз' : 'Прогноз', kind: 'forecast' };
  }

  function monthStats(key) {
    const entries = entriesAscending().filter(item => monthKey(item.date) === key);
    const result = { total: 0, good: 0, neutral: 0, bad: 0, comments: 0, starts: 0, ends: 0 };
    entries.forEach(item => {
      if (STATUS[item.status]) {
        result.total += 1;
        result[item.status] += 1;
      }
      if (item.comment) result.comments += 1;
      if (item.periodMarker === 'start') result.starts += 1;
      if (item.periodMarker === 'end') result.ends += 1;
    });
    return result;
  }

  function historyMonths() {
    const keys = new Set(entriesAscending().map(item => monthKey(item.date)));
    keys.add(selectedMonth());
    return [...keys].sort((left, right) => right.localeCompare(left)).slice(0, 18);
  }

  function dayCell(date, model) {
    if (!date) return '<div class="v72-day is-empty" aria-hidden="true"></div>';
    const entry = entryByDate(date);
    const status = entry?.status || '';
    const actual = actualPeriodInfo(date, model);
    const predicted = actual ? null : predictedPeriodInfo(date, model);
    const classes = [
      'v72-day',
      status ? `is-${status}` : '',
      date === todayStamp() ? 'is-today' : '',
      actual ? 'is-period' : '',
      predicted ? 'is-predicted' : ''
    ].filter(Boolean).join(' ');
    const stateLabel = status ? STATUS[status].short : '';
    const periodLabel = actual?.label || predicted?.label || '';
    return `<button class="${classes}" data-v72-action="open-day" data-date="${date}" type="button" aria-label="${escape(formatDate(date))}">
      <span class="v72-day-top"><b>${Number(date.slice(8, 10))}</b>${date === todayStamp() ? '<em>сегодня</em>' : ''}</span>
      <span class="v72-day-state">${status ? `<i>${STATUS[status].icon}</i>${escape(stateLabel)}` : '<span>Без отметки</span>'}</span>
      ${entry?.comment ? `<span class="v72-day-comment">${escape(entry.comment)}</span>` : '<span class="v72-day-comment is-placeholder">Добавить комментарий</span>'}
      <span class="v72-day-tags">${periodLabel ? `<small class="${actual ? 'is-actual' : 'is-forecast'}">${actual ? '●' : '○'} ${escape(periodLabel)}</small>` : ''}</span>
    </button>`;
  }

  function monthHistoryRow(key) {
    const stats = monthStats(key);
    const dominant = ['good', 'neutral', 'bad'].sort((left, right) => stats[right] - stats[left])[0];
    const dominantLabel = stats.total ? STATUS[dominant].label : 'Нет состояний';
    return `<button class="v72-history-row ${key === selectedMonth() ? 'is-active' : ''}" data-v72-action="open-month" data-month="${key}" type="button">
      <span><b>${escape(formatMonth(key))}</b><small>${stats.total} ${plural(stats.total, 'день', 'дня', 'дней')} с состоянием · ${stats.comments} ${plural(stats.comments, 'комментарий', 'комментария', 'комментариев')}</small></span>
      <span class="v72-history-pills"><i class="is-good">${stats.good}</i><i class="is-neutral">${stats.neutral}</i><i class="is-bad">${stats.bad}</i>${stats.starts ? `<i class="is-cycle">● ${stats.starts}</i>` : ''}</span>
      <em>${escape(dominantLabel)} ›</em>
    </button>`;
  }

  function pageHtml() {
    ensureData();
    const model = cycleModel();
    const key = selectedMonth();
    const stats = monthStats(key);
    const cells = monthCells(key);
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const latestEntry = entriesAscending().filter(item => item.status || item.comment).at(-1) || null;
    const cycleDay = model.latestStart && todayStamp() >= model.latestStart ? diffDays(model.latestStart, todayStamp()) + 1 : 0;
    const cycleCaption = !model.latestStart ? 'пока не отмечено' : cycleDay > 0 ? `${cycleDay}-й день цикла` : 'начало отмечено заранее';
    const nextForecasts = model.forecasts.slice(0, 3);

    return `<section class="v72-page">
      <header class="v72-hero">
        <div><span class="v72-eyebrow">Я и люди · личная память</span><h1>Состояние Полины</h1><p>Календарь состояния, комментариев и фактических дней цикла. Все записи сохраняются по месяцам.</p></div>
        <div class="v72-hero-actions"><button data-v72-action="open-day" data-date="${todayStamp()}" type="button">＋ Отметить сегодня</button><button class="is-soft" data-v72-action="cycle-settings" type="button">Настройки цикла</button></div>
      </header>

      <section class="v72-kpis">
        <article><span>Последнее начало</span><strong>${model.latestStart ? escape(formatShortDate(model.latestStart)) : '—'}</strong><small>${escape(cycleCaption)}</small></article>
        <article><span>Последний конец</span><strong>${model.latestEnd ? escape(formatShortDate(model.latestEnd)) : '—'}</strong><small>${model.latestEnd && model.latestStart ? `${diffDays(model.latestStart, model.latestEnd) + 1} ${plural(diffDays(model.latestStart, model.latestEnd) + 1, 'день', 'дня', 'дней')}` : 'отметьте фактическую дату'}</small></article>
        <article class="is-accent"><span>Следующий прогноз</span><strong>${model.nextStart ? escape(formatShortDate(model.nextStart)) : '—'}</strong><small>${model.nextStart ? `ориентир · ${model.method}` : 'нужно отметить начало'}</small></article>
        <article><span>Средний цикл</span><strong>${model.cycleLength} дн.</strong><small>период около ${model.duration} ${plural(model.duration, 'дня', 'дней', 'дней')}</small></article>
      </section>

      <section class="v72-layout">
        <article class="v72-card v72-calendar-card">
          <header class="v72-card-head">
            <div><span>Календарь</span><h2>${escape(formatMonth(key))}</h2><p>${stats.total ? `${stats.total} ${plural(stats.total, 'отмеченный день', 'отмеченных дня', 'отмеченных дней')} в этом месяце` : 'В этом месяце пока нет отметок'}</p></div>
            <div class="v72-month-nav"><button data-v72-action="month" data-delta="-1" type="button" aria-label="Предыдущий месяц">←</button><button data-v72-action="today-month" type="button">Сегодня</button><button data-v72-action="month" data-delta="1" type="button" aria-label="Следующий месяц">→</button></div>
          </header>
          <div class="v72-month-summary"><span class="is-good">✓ Хорошее <b>${stats.good}</b></span><span class="is-neutral">• Нейтральное <b>${stats.neutral}</b></span><span class="is-bad">! Плохое <b>${stats.bad}</b></span><span class="is-cycle">● Цикл <b>${stats.starts + stats.ends}</b></span></div>
          <div class="v72-weekdays">${weekdays.map(day => `<span>${day}</span>`).join('')}</div>
          <div class="v72-calendar">${cells.map(date => dayCell(date, model)).join('')}</div>
          <footer class="v72-legend"><span><i class="is-good"></i>Хорошее</span><span><i class="is-neutral"></i>Нейтральное</span><span><i class="is-bad"></i>Плохое</span><span><i class="is-period"></i>Фактические месячные</span><span><i class="is-forecast"></i>Прогноз</span></footer>
        </article>

        <aside class="v72-side-column">
          <article class="v72-card v72-forecast-card">
            <header><div><span>Прогноз цикла</span><h3>${model.nextStart ? 'Следующие даты' : 'Нужны исходные данные'}</h3></div><button data-v72-action="cycle-settings" type="button">⚙</button></header>
            ${nextForecasts.length ? `<div class="v72-forecast-list">${nextForecasts.map((item, index) => `<div><i>${index + 1}</i><span><b>${escape(formatDate(item.start))}</b><small>ориентировочно до ${escape(formatShortDate(item.end))}</small></span></div>`).join('')}</div>` : '<p class="v72-empty-text">Отметьте начало месячных в любом дне календаря. После этого появится первый прогноз.</p>'}
            <p class="v72-note">Прогноз ориентировочный и нужен только для личного планирования, а не для медицинских решений.</p>
          </article>

          <article class="v72-card v72-latest-card">
            <header><div><span>Последняя запись</span><h3>${latestEntry ? escape(formatShortDate(latestEntry.date)) : 'Пока пусто'}</h3></div>${latestEntry ? `<button data-v72-action="open-day" data-date="${latestEntry.date}" type="button">Открыть</button>` : ''}</header>
            ${latestEntry ? `<div class="v72-latest-state is-${latestEntry.status || 'none'}"><b>${latestEntry.status ? STATUS[latestEntry.status].label : 'Без состояния'}</b><p>${escape(latestEntry.comment || 'Комментарий не добавлен')}</p></div>` : '<p class="v72-empty-text">Первая отметка займёт меньше минуты.</p>'}
          </article>
        </aside>
      </section>

      <section class="v72-card v72-history-card">
        <header class="v72-card-head"><div><span>История</span><h2>Состояния по месяцам</h2><p>Каждый месяц хранится отдельно и остаётся доступен в общей резервной копии.</p></div></header>
        <div class="v72-history-list">${historyMonths().map(monthHistoryRow).join('')}</div>
      </section>
    </section>`;
  }

  function openDay(date) {
    ensureData();
    const chosen = isoDate(date) || todayStamp();
    const entry = entryByDate(chosen);
    const checked = value => entry?.status === value ? 'checked' : '';
    const marker = entry?.periodMarker || '';
    const html = `<div class="v72-modal-form">
      <label class="v72-field"><span>Дата</span><input id="v72_day_date" type="date" value="${chosen}"></label>
      <fieldset class="v72-state-field"><legend>Состояние</legend><div class="v72-state-options">
        <label class="is-good"><input type="radio" name="v72_status" value="good" ${checked('good')}><span><i>✓</i><b>Хорошее</b><small>хорошее и спокойное состояние</small></span></label>
        <label class="is-neutral"><input type="radio" name="v72_status" value="neutral" ${checked('neutral')}><span><i>•</i><b>Нейтральное</b><small>ровное состояние без явного перекоса</small></span></label>
        <label class="is-bad"><input type="radio" name="v72_status" value="bad" ${checked('bad')}><span><i>!</i><b>Плохое</b><small>тяжёлый или раздражительный день</small></span></label>
        <label class="is-none"><input type="radio" name="v72_status" value="" ${entry?.status ? '' : 'checked'}><span><i>×</i><b>Без отметки</b><small>оставить только комментарий или цикл</small></span></label>
      </div></fieldset>
      <label class="v72-field"><span>Отметка цикла</span><select id="v72_period_marker"><option value="" ${!marker ? 'selected' : ''}>Нет отметки</option><option value="start" ${marker === 'start' ? 'selected' : ''}>Начало месячных</option><option value="end" ${marker === 'end' ? 'selected' : ''}>Конец месячных</option></select></label>
      <label class="v72-field"><span>Комментарий</span><textarea id="v72_day_comment" placeholder="Как Полина себя чувствовала, что было важно, какая поддержка помогла?">${escape(entry?.comment || '')}</textarea></label>
      <div class="v72-modal-actions"><button class="is-primary" data-v72-action="save-day" data-id="${escape(entry?.id || '')}" type="button">Сохранить</button>${entry ? `<button class="is-danger" data-v72-action="delete-day" data-id="${escape(entry.id)}" type="button">Удалить запись</button>` : ''}<button data-v72-action="close-modal" type="button">Отмена</button></div>
    </div>`;
    if (typeof openModal === 'function') openModal(`Состояние Полины · ${formatDate(chosen)}`, html);
  }

  function saveDay(id) {
    ensureData();
    const date = isoDate(document.getElementById('v72_day_date')?.value) || todayStamp();
    const status = document.querySelector('input[name="v72_status"]:checked')?.value || '';
    const comment = clean(document.getElementById('v72_day_comment')?.value);
    const periodMarker = clean(document.getElementById('v72_period_marker')?.value);
    const existing = (state.polinaDays || []).map(normalizedEntry).find(item => item.id === id) || null;
    const sameDate = entryByDate(date);
    const next = {
      id: existing?.id || sameDate?.id || makeId(),
      date,
      status: STATUS[status] ? status : '',
      comment,
      periodMarker: periodMarker === 'start' || periodMarker === 'end' ? periodMarker : '',
      updatedAt: new Date().toISOString()
    };

    state.polinaDays = (state.polinaDays || []).map(normalizedEntry).filter(item => item.id !== existing?.id && item.date !== date);
    if (next.status || next.comment || next.periodMarker) state.polinaDays.push(next);
    state.polinaDays.sort((left, right) => right.date.localeCompare(left.date));

    const model = cycleModel();
    state.settings.polinaCycle = Object.assign({}, state.settings.polinaCycle || {}, {
      lastStart: model.latestStart || '',
      cycleLength: model.cycleLength,
      duration: model.duration
    });
    state.polinaCalendar = Object.assign({}, state.polinaCalendar || {}, { version: 2, updatedAt: new Date().toISOString() });
    if (typeof save === 'function') save();
    if (typeof closeModal === 'function') closeModal();
    renderRoute();
    if (typeof toast === 'function') toast(next.periodMarker === 'start' ? 'Начало цикла отмечено, прогноз обновлён' : next.periodMarker === 'end' ? 'Конец цикла отмечен, прогноз уточнён' : 'Состояние Полины сохранено');
  }

  function deleteDay(id) {
    ensureData();
    state.polinaDays = (state.polinaDays || []).map(normalizedEntry).filter(item => item.id !== id);
    const model = cycleModel();
    state.settings.polinaCycle = Object.assign({}, state.settings.polinaCycle || {}, {
      lastStart: model.latestStart || '',
      cycleLength: model.cycleLength,
      duration: model.duration
    });
    if (typeof save === 'function') save();
    if (typeof closeModal === 'function') closeModal();
    renderRoute();
    if (typeof toast === 'function') toast('Запись удалена');
  }

  function openCycleSettings() {
    const model = cycleModel();
    const html = `<div class="v72-modal-form">
      <div class="v72-settings-grid">
        <label class="v72-field"><span>Базовая длина цикла</span><input id="v72_cycle_length" type="number" min="20" max="45" value="${model.cycleLength}"><small>Используется, пока недостаточно фактических циклов.</small></label>
        <label class="v72-field"><span>Базовая длительность месячных</span><input id="v72_cycle_duration" type="number" min="1" max="10" value="${model.duration}"><small>Уточняется после отметок начала и конца.</small></label>
      </div>
      <div class="v72-cycle-facts"><div><span>Фактических начал</span><b>${model.starts.length}</b></div><div><span>Полных интервалов</span><b>${model.intervals.length}</b></div><div><span>Средняя длина</span><b>${model.cycleLength} дней</b></div></div>
      <p class="v72-note">После двух и более отметок начала прогноз автоматически опирается на среднее фактических циклов. Отметка конца уточняет длительность месячных.</p>
      <div class="v72-modal-actions"><button class="is-primary" data-v72-action="save-cycle-settings" type="button">Сохранить</button><button data-v72-action="close-modal" type="button">Отмена</button></div>
    </div>`;
    if (typeof openModal === 'function') openModal('Настройки цикла Полины', html);
  }

  function saveCycleSettings() {
    ensureData();
    const cycleLength = Math.max(20, Math.min(45, Number(document.getElementById('v72_cycle_length')?.value) || 28));
    const duration = Math.max(1, Math.min(10, Number(document.getElementById('v72_cycle_duration')?.value) || 5));
    state.settings.polinaCycle = Object.assign({}, state.settings.polinaCycle || {}, { cycleLength, duration });
    if (typeof save === 'function') save();
    if (typeof closeModal === 'function') closeModal();
    renderRoute();
    if (typeof toast === 'function') toast('Настройки цикла сохранены');
  }

  function updateNavigation() {
    ensureData();
    document.querySelectorAll('.v59-nav-item[data-go="polina"] .label,.v59-nav-item[data-v72-nav="polina"] .label').forEach(label => { label.textContent = 'Состояние Полины'; });
    const button = document.querySelector('.v59-nav-item[data-go="polina"],.v59-nav-item[data-v72-nav="polina"]');
    if (button) {
      button.hidden = false;
      button.dataset.v72Nav = ROUTE;
      button.removeAttribute('data-go');
      button.querySelector('.v59-nav-ico')?.setAttribute('style', 'background:#ec4899');
    }

    const shell = document.querySelector('.v68-nav-shell');
    if (!shell || !button) return;
    const peopleFolder = [...shell.querySelectorAll('.v68-nav-subfolder')].find(folder => clean(folder.querySelector(':scope > summary span')?.textContent) === 'Я и люди');
    if (peopleFolder) {
      const list = peopleFolder.lastElementChild;
      if (button.parentElement !== list) list.appendChild(button);
      const count = peopleFolder.querySelector(':scope > summary em');
      if (count) count.textContent = String(list.querySelectorAll('.v59-nav-item').length);
      if ((location.hash || '').replace('#', '') === ROUTE) peopleFolder.open = true;
    }
    const memoryFolder = peopleFolder?.closest('.v68-nav-folder');
    if (memoryFolder) {
      const count = memoryFolder.querySelector(':scope > summary em');
      if (count) count.textContent = String(memoryFolder.querySelectorAll('.v59-nav-item').length);
      if ((location.hash || '').replace('#', '') === ROUTE) memoryFolder.open = true;
    }
  }

  function setBuild() {
    document.body.dataset.sbosBuild = BUILD;
    document.body.dataset.v72Polina = 'ready';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', BUILD);
    try { localStorage.setItem('secondBrainOS.currentBuild', BUILD); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version) version.textContent = LABEL;
    const core = document.querySelector('.v59-core-pill');
    if (core) core.textContent = 'V72.2';
  }

  function renderRoute() {
    ensureData();
    const route = (location.hash || '').replace('#', '') || 'dashboard';
    document.body.classList.toggle('v72-polina-route', route === ROUTE);
    updateNavigation();
    setBuild();
    if (route !== ROUTE) return;
    const view = document.getElementById('view');
    if (!view) return;
    view.innerHTML = pageHtml();
    document.querySelectorAll('.v59-nav-item').forEach(button => button.classList.toggle('active', button.dataset.go === ROUTE || button.dataset.v72Nav === ROUTE));
    updateNavigation();
  }

  function navigate() {
    ensureData();
    try { page = ROUTE; } catch (error) {}
    try { history.pushState(null, '', `#${ROUTE}`); }
    catch (error) { location.hash = ROUTE; }
    renderRoute();
  }

  function schedulePost(delay = 30) {
    clearTimeout(postTimer);
    postTimer = setTimeout(renderRoute, delay);
  }

  const previousGoV72 = typeof go === 'function' ? go : null;
  if (previousGoV72) {
    go = function (id) {
      if (clean(id) === ROUTE) return navigate();
      return previousGoV72.apply(this, arguments);
    };
  }

  const previousV70Navigate = typeof window.v70Navigate === 'function' ? window.v70Navigate : null;
  window.v70Navigate = function (route) {
    if (clean(route) === ROUTE) return navigate();
    return previousV70Navigate ? previousV70Navigate.apply(this, arguments) : (typeof go === 'function' ? go(route) : undefined);
  };

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      ensureData();
      const result = previousRender.apply(this, arguments);
      requestAnimationFrame(renderRoute);
      return result;
    };
  }

  window.polinaPage = pageHtml;
  window.PolinaState = { pageHtml, openDay, cycleModel, render: renderRoute, navigate };

  window.addEventListener('click', event => {
    const navButton = event.target.closest?.('[data-v72-nav="polina"]');
    if (navButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return navigate();
    }
    const button = event.target.closest?.('[data-v72-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const action = button.dataset.v72Action;
    if (action === 'open-day') return openDay(button.dataset.date || todayStamp());
    if (action === 'save-day') return saveDay(button.dataset.id || '');
    if (action === 'delete-day') return deleteDay(button.dataset.id || '');
    if (action === 'cycle-settings') return openCycleSettings();
    if (action === 'save-cycle-settings') return saveCycleSettings();
    if (action === 'close-modal') return typeof closeModal === 'function' ? closeModal() : undefined;
    if (action === 'month') {
      state.settings.polinaMonth = shiftMonth(selectedMonth(), Number(button.dataset.delta || 0));
      if (typeof save === 'function') save();
      return renderRoute();
    }
    if (action === 'today-month') {
      state.settings.polinaMonth = currentMonth();
      if (typeof save === 'function') save();
      return renderRoute();
    }
    if (action === 'open-month') {
      state.settings.polinaMonth = button.dataset.month || currentMonth();
      if (typeof save === 'function') save();
      renderRoute();
      document.querySelector('.v72-calendar-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, true);

  window.addEventListener('hashchange', () => [0, 80, 220].forEach(delay => setTimeout(renderRoute, delay)));
  window.addEventListener('storage', event => {
    if (event.key === 'secondBrainOS.v1') schedulePost(80);
  });

  try {
    ensureData();
    schedulePost(0);
    schedulePost(180);
  } catch (error) {
    console.error('[V72 Polina]', error);
  }
})();
