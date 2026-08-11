/* Экран информации.

   В прошлой версии заметки, идеи, желания, книги, фильмы и документы жили
   отдельными разделами, и каждый выглядел по-своему. Смысл у них один —
   это сохранённое на будущее, — поэтому здесь они собраны в один экран с
   переключением, а коллекции в хранилище остаются прежними. */

import { getState } from '../store.js?v=2.1.1';
import { esc, dateShort, plural } from '../format.js?v=2.1.1';
import { pageHead, card, label, button, empty, metricStrip } from '../ui.js?v=2.1.1';

/* Коллекция → как её называть и что показывать в строке. */
export const SECTIONS = [
  { key: 'notes',     title: 'Заметки',   one: 'заметка',  main: 'title', sub: 'text' },
  { key: 'ideas',     title: 'Идеи',      one: 'идея',     main: 'title', sub: 'text' },
  { key: 'wishes',    title: 'Желания',   one: 'желание',  main: 'title', sub: 'note' },
  { key: 'books',     title: 'Книги',     one: 'книга',    main: 'title', sub: 'author' },
  { key: 'films',     title: 'Фильмы',    one: 'фильм',    main: 'title', sub: 'note' },
  { key: 'documents', title: 'Документы', one: 'документ', main: 'title', sub: 'note' }
];

const pick = (row, ...keys) => {
  for (const key of keys) {
    const value = row && row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const rowsOf = (state, key) => (state[key] || []).filter((r) => r && !r.archived);

export function render(params = {}) {
  const state = getState();
  const current = SECTIONS.find((s) => s.key === params.section) || SECTIONS[0];
  const rows = rowsOf(state, current.key);
  const total = SECTIONS.reduce((sum, s) => sum + rowsOf(state, s.key).length, 0);

  const head = pageHead({
    eyebrow: 'Сохранённое на будущее',
    title: 'Информация',
    subtitle: 'Заметки, идеи, желания и списки — в одном месте, а не в шести разных разделах',
    actions: button(`Добавить в «${current.title}»`, { action: 'info-new', primary: true, extra: `data-section="${current.key}"` })
  });

  const tabs = `<div class="tabs">${SECTIONS.map((section) => {
    const count = rowsOf(state, section.key).length;
    return `<a class="tab ${section.key === current.key ? 'on' : ''}" href="#information?section=${section.key}">
      ${esc(section.title)}${count ? `<i>${count}</i>` : ''}</a>`;
  }).join('')}</div>`;

  const list = rows.length
    ? `<div class="info-list">${rows.slice(0, 60).map((row) => {
        const main = pick(row, current.main, 'name', 'text') || 'Без названия';
        const sub = pick(row, current.sub, 'note', 'text', 'author');
        const date = row.createdAt ? dateShort(row.createdAt.slice(0, 10)) : '';
        return `<button class="info-row" type="button" data-act="info-edit"
            data-id="${esc(row.id)}" data-section="${current.key}">
          <span class="i-main">${esc(main)}</span>
          ${sub && sub !== main ? `<span class="i-sub">${esc(sub)}</span>` : ''}
          ${date ? `<span class="i-date">${esc(date)}</span>` : ''}
        </button>`;
      }).join('')}</div>`
    : empty(
        `В разделе «${current.title}» пока пусто.`,
        button('Добавить', { action: 'info-new', primary: true, extra: `data-section="${current.key}"` })
      );

  const metrics = metricStrip([
    { label: 'Всего записей', value: String(total) },
    { label: current.title, value: String(rows.length) },
    { label: 'Разделов', value: String(SECTIONS.length) },
    { label: 'В архиве', value: String((state.archive || []).length) }
  ]);

  return `${head}${tabs}${list}${metrics}`;
}

/* ------------------------------- Люди ----------------------------------- */

function birthdayIn(person) {
  const raw = person.birthday || person.birthDate || person.bday;
  if (!raw || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  const [, month, day] = raw.slice(0, 10).split('-').map(Number);
  const now = new Date();
  let next = new Date(now.getFullYear(), month - 1, day, 12);
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)) {
    next = new Date(now.getFullYear() + 1, month - 1, day, 12);
  }
  return { date: next, days: Math.round((next - now) / 86_400_000) };
}

export function renderPeople() {
  const state = getState();
  const people = (state.people || []).filter((p) => p && !p.archived);

  const head = pageHead({
    eyebrow: 'Кто рядом',
    title: 'Люди',
    subtitle: 'Дни рождения, обещания и те, с кем давно не общались',
    actions: button('Добавить человека', { action: 'person-new', primary: true })
  });

  if (!people.length) {
    return `${head}${empty(
      'Записей о людях пока нет. Здесь удобно держать дни рождения и данные обещания — то, что легко забыть и неприятно забыть.',
      button('Добавить человека', { action: 'person-new', primary: true })
    )}`;
  }

  const upcoming = people
    .map((person) => ({ person, bd: birthdayIn(person) }))
    .filter((x) => x.bd)
    .sort((a, b) => a.bd.days - b.bd.days)
    .slice(0, 5);

  const birthdays = upcoming.length
    ? card(`
        ${label('Ближайшие дни рождения')}
        ${upcoming.map(({ person, bd }) => `
          <div class="row ${bd.days <= 7 ? 'good' : ''}">
            <div class="n"><b>${esc(person.name || 'Без имени')}</b>
              <span>${bd.days === 0 ? 'сегодня' : `через ${bd.days} ${plural(bd.days, 'день', 'дня', 'дней')}`}</span></div>
            <div class="amt">${esc(dateShort(bd.date))}</div>
          </div>`).join('')}
      `)
    : '';

  const list = `<div class="info-list">${people.slice(0, 60).map((person) => `
    <button class="info-row" type="button" data-act="person-edit" data-id="${esc(person.id)}">
      <span class="i-main">${esc(person.name || 'Без имени')}</span>
      ${person.relation || person.role ? `<span class="i-sub">${esc(person.relation || person.role)}</span>` : ''}
      ${person.phone || person.contact ? `<span class="i-date">${esc(person.phone || person.contact)}</span>` : ''}
    </button>`).join('')}</div>`;

  const metrics = metricStrip([
    { label: 'Людей', value: String(people.length) },
    { label: 'С днями рождения', value: String(people.filter(birthdayIn).length) },
    { label: 'В ближайший месяц', value: String(upcoming.filter((x) => x.bd.days <= 30).length) },
    { label: 'Совместных дел', value: String((state.coupleActivities || []).length) }
  ]);

  return `${head}${birthdays}${list}${metrics}`;
}
