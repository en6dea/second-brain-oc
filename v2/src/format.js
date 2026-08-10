/* Форматирование значений. Одно место на всё приложение — иначе суммы и даты
   начинают выглядеть по-разному на разных экранах. */

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
/* Родительный падеж — для дат вида «10 августа». */
const MONTHS_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
/* Именительный — для заголовков вида «Август 2026». */
const MONTHS_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

/** Экранирование. Всё, что пришло от пользователя, проходит через него. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

/** Сумма. null означает «не заполнено» и печатается словами, а не нулём —
 *  это инвариант модели данных, а не косметика. */
export function money(value, { emptyText = 'не заполнено' } = {}) {
  if (value === null || value === undefined || value === '') return emptyText;
  const number = Number(value);
  if (!Number.isFinite(number)) return emptyText;
  const rounded = Math.round(number);
  return `${rounded.toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;
}

/** Компактная сумма для тесных мест: 128 400 ₽ → 128,4 тыс. */
export function moneyShort(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  const abs = Math.abs(number);
  if (abs >= 1_000_000) return `${(number / 1_000_000).toFixed(1).replace('.', ',')} млн ₽`;
  if (abs >= 10_000) return `${Math.round(number / 1000)} тыс. ₽`;
  return money(number);
}

export function percent(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${number.toFixed(digits).replace('.', ',')} %`;
}

/** Склонение: plural(5, 'месяц','месяца','месяцев') → 'месяцев' */
export function plural(count, one, few, many) {
  const n = Math.abs(Math.trunc(count)) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}

/* --------------------------------- Даты --------------------------------- */

export const todayKey = () => toKey(new Date());

export function toKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthKey(value) {
  const key = typeof value === 'string' ? value : toKey(value);
  return key ? key.slice(0, 7) : '';
}

export function parseKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}/.test(key)) return null;
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 10 апр. */
export function dateShort(value) {
  const date = value instanceof Date ? value : parseKey(value);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}.`;
}

/** 10 августа 2026 */
export function dateLong(value) {
  const date = value instanceof Date ? value : parseKey(value);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
}

/** Понедельник, 10 августа 2026 */
export function dateWithWeekday(value) {
  const date = value instanceof Date ? value : parseKey(value);
  if (!date) return '—';
  const weekday = WEEKDAYS[date.getDay()];
  return `${weekday[0].toUpperCase()}${weekday.slice(1)}, ${dateLong(date)}`;
}

export function weekdayShort(value) {
  const date = value instanceof Date ? value : parseKey(value);
  return date ? WEEKDAYS_SHORT[date.getDay()] : '';
}

export function monthTitle(key) {
  const [y, m] = String(key || '').split('-').map(Number);
  if (!y || !m) return '';
  return `${MONTHS_NOM[m - 1]} ${y}`;
}

/** Дни от сегодня: отрицательные — в прошлом. */
export function daysFromToday(key) {
  const date = parseKey(key);
  if (!date) return null;
  const today = parseKey(todayKey());
  return Math.round((date - today) / 86_400_000);
}

/** Неделя, заканчивающаяся сегодня: массив из 7 ключей дат. */
export function weekEndingToday() {
  const out = [];
  const today = parseKey(todayKey());
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(toKey(d));
  }
  return out;
}

/** Приветствие по времени суток. */
export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}
