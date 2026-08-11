/* GameLife.

   В прошлой версии здесь были XP, HP, монеты, квесты и достижения, но всё
   это жило рядом с обычными списками и потому читалось как украшение.
   Смысл раздела в другом: он показывает не «сколько сделано», а держится ли
   ритм — поэтому наверху серия дней, а не очки. */

import { getState, num } from '../store.js?v=2.3.0';
import { esc, todayKey, dateShort, plural, weekEndingToday, parseKey, toKey } from '../format.js?v=2.3.0';
import { activeHabits, isHabitDone, habitsToday, weekCompletion } from '../calc.js?v=2.3.0';
import { pageHead, card, label, ring, metricStrip, empty, button } from '../ui.js?v=2.3.0';

const game = (state) => (state.gameLife && typeof state.gameLife === 'object') ? state.gameLife : {};

/** Уровень из опыта: каждые 1000 очков — следующий. */
function level(xp) {
  const value = Math.max(0, num(xp));
  const current = Math.floor(value / 1000) + 1;
  const intoLevel = value % 1000;
  return { level: current, intoLevel, share: intoLevel / 1000 };
}

/** Сколько дней подряд отмечена хотя бы одна привычка. */
function activeStreak(state, endKey = todayKey()) {
  const habits = activeHabits(state);
  if (!habits.length) return 0;
  const end = parseKey(endKey);
  let streak = 0;
  for (let i = 0; i < 400; i += 1) {
    const key = toKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - i, 12));
    const any = habits.some((habit) => isHabitDone(habit, key));
    if (any) streak += 1;
    else if (i > 0) break;      /* сегодняшний день ещё не потерян */
  }
  return streak;
}

export function render() {
  const state = getState();
  const data = game(state);
  const today = todayKey();
  const days = weekEndingToday();
  const xp = num(data.xp);
  const progress = level(xp);
  const streak = activeStreak(state, today);
  const todayStats = habitsToday(state, today);
  const week = weekCompletion(state, days);

  const head = pageHead({
    eyebrow: 'Ритм, а не очки',
    title: 'GameLife',
    subtitle: 'Опыт начисляется за удержание ритма — важна серия, а не разовый рывок'
  });

  const habits = activeHabits(state);
  if (!habits.length && !xp) {
    return `${head}${empty(
      'Пока нечего считать: опыт начисляется за отмеченные привычки. Заведите первую — и здесь появятся серия, уровень и недельный ритм.',
      button('Открыть привычки', { action: 'goto-habits', primary: true })
    )}`;
  }

  const levelCard = card(`
    ${label('Уровень')}
    <div class="big">${progress.level}</div>
    <div class="meta"><span>${progress.intoLevel} из 1000 до следующего</span></div>
    <div class="goal-prog" style="margin-top:16px">
      <div class="tr"><i style="width:${(progress.share * 100).toFixed(0)}%"></i></div>
      <small>всего ${xp} XP</small>
    </div>
  `);

  const streakCard = card(`
    ${label('Серия')}
    ${ring(Math.min(1, streak / 30), String(streak), 'дней')}
    <p class="center muted">${streak
      ? `${streak} ${plural(streak, 'день', 'дня', 'дней')} подряд хотя бы одна привычка`
      : 'серия прервана — её восстанавливает любая отметка'}</p>
  `);

  /* Неделя в виде полос: видно не сумму, а форму — где провал. */
  const rhythm = card(`
    ${label('Ритм недели')}
    <div class="rhythm">
      ${days.map((day) => {
        const done = habits.filter((habit) => isHabitDone(habit, day)).length;
        const share = habits.length ? done / habits.length : 0;
        return `<div class="rh ${day === today ? 'today' : ''}">
          <div class="bar"><i style="height:${Math.max(4, share * 100).toFixed(0)}%"></i></div>
          <span>${esc(dateShort(day).replace('.', ''))}</span>
        </div>`;
      }).join('')}
    </div>
  `);

  const metrics = metricStrip([
    { label: 'Опыт', value: String(xp) },
    { label: 'Монеты', value: String(num(data.coins)) },
    { label: 'Сегодня', value: `${todayStats.done} / ${todayStats.total}`,
      tone: todayStats.total && todayStats.done === todayStats.total ? 'pos' : '' },
    { label: 'Неделя', value: `${Math.round(week * 100)} %` }
  ]);

  const achievements = Array.isArray(data.achievements) ? data.achievements : [];
  const achieveBlock = achievements.length
    ? card(`${label('Достижения')}<div class="chips">${achievements.slice(0, 12)
        .map((a) => `<span class="chip on">${esc(typeof a === 'string' ? a : (a.title || a.name || 'достижение'))}</span>`)
        .join('')}</div>`)
    : '';

  return `${head}
    <div class="grid2">${levelCard}${streakCard}</div>
    ${rhythm}${achieveBlock}${metrics}`;
}

/* ------------------------------- Архив ---------------------------------- */

export function renderArchive() {
  const state = getState();
  const rows = (state.archive || []).filter(Boolean);

  const head = pageHead({
    eyebrow: 'Убранное с глаз',
    title: 'Архив',
    subtitle: 'Записи не удаляются, а откладываются — нажатие возвращает запись туда, откуда она пришла'
  });

  if (!rows.length) {
    return `${head}${empty('Архив пуст. Сюда попадает всё, что вы убрали из активных списков, — ничего не теряется безвозвратно.')}`;
  }

  const list = `<div class="info-list">${rows.slice(0, 80).map((row) => `
    <div class="info-item">
      <button class="info-row" type="button" data-act="archive-restore" data-id="${esc(row.id || '')}">
        <span class="i-main">${esc(row.title || row.name || 'Запись')}</span>
        ${row.type ? `<span class="i-sub">${esc(row.type)}</span>` : ''}
        ${row.archivedAt ? `<span class="i-date">${esc(dateShort(String(row.archivedAt).slice(0, 10)))}</span>` : ''}
      </button>
      <button class="row-btn" type="button" data-act="archive-restore" data-id="${esc(row.id || '')}"
        title="Вернуть" aria-label="Вернуть из архива">↺</button>
    </div>`).join('')}</div>`;

  const metrics = metricStrip([
    { label: 'В архиве', value: String(rows.length) },
    { label: 'Скрытых привычек', value: String((state.habits || []).filter((h) => h && h.active === false).length) },
    { label: 'Закрытых долгов', value: String((state.debts || []).filter((d) => d && d.status === 'closed').length) },
    { label: 'Целей в архиве', value: String((state.goals || []).filter((g) => g && g.status === 'archived').length) }
  ]);

  return `${head}${list}${metrics}`;
}
