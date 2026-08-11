/* Экран привычек.
   Отметки хранятся словарём дата→значение (см. DATA-MODEL.md). История не
   переписывается: отметка ставится на конкретную дату, а не «сдвигается». */

import { getState, update, nowIso } from '../store.js?v=2.4.0';
import { esc, weekdayShort, parseKey, todayKey, weekEndingToday, percent, plural } from '../format.js?v=2.4.0';
import { activeHabits, isHabitDone, habitStreak, weekCompletion, habitsToday } from '../calc.js?v=2.4.0';
import { pageHead, card, label, ring, button, empty, metricStrip } from '../ui.js?v=2.4.0';

/** Переключает отметку привычки за дату. Формат значения сохраняем простым. */
export function toggleMark(habitId, dateKey) {
  update((state) => {
    const habit = (state.habits || []).find((h) => h && h.id === habitId);
    if (!habit) return;
    if (!habit.marks || typeof habit.marks !== 'object') habit.marks = {};
    if (isHabitDone(habit, dateKey)) delete habit.marks[dateKey];
    else habit.marks[dateKey] = true;
    habit.updatedAt = nowIso();
  }, 'habit-toggle');
}

export function render() {
  const state = getState();
  const days = weekEndingToday();
  const habits = activeHabits(state);
  const today = todayKey();

  const head = pageHead({
    eyebrow: `Неделя ${parseKey(days[0]).getDate()}–${parseKey(days[6]).getDate()} ${['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][parseKey(days[6]).getMonth()]}`,
    title: 'Привычки',
    subtitle: 'Отметки хранятся по датам — история не переписывается',
    actions: button('Добавить привычку', { action: 'habit-new', primary: true })
  });

  if (!habits.length) {
    const wishlist = state.habitWishlist || [];
    return `${head}${empty(
      wishlist.length
        ? `Активных привычек нет, но в списке задуманных их ${wishlist.length}. Заведите первую — и здесь появится сетка недели и серии.`
        : 'Привычек пока нет. Заведите первую — и здесь появится сетка недели, серии и доля выполнения.',
      button('Добавить привычку', { action: 'habit-new', primary: true })
    )}`;
  }

  const grid = card(`
    <div class="week head">
      <span></span>
      ${days.map((d) => `<span class="hd">${weekdayShort(d)}<i>${parseKey(d).getDate()}</i></span>`).join('')}
    </div>
    ${habits.map((habit) => `
      <div class="week">
        <span class="nm">${esc(habit.name || 'Привычка')}</span>
        ${days.map((day) => {
          const done = isHabitDone(habit, day);
          const isToday = day === today;
          const future = day > today;
          return `<button class="cell ${done ? 'on' : future ? 'fut' : 'miss'} ${isToday ? 'today' : ''}"
            type="button" data-act="habit-toggle" data-id="${esc(habit.id)}" data-day="${esc(day)}"
            aria-pressed="${done}" aria-label="${esc(habit.name)} — ${esc(day)}"
            ${future ? 'disabled' : ''}>${done ? '✓' : '·'}</button>`;
        }).join('')}
      </div>`).join('')}
  `);

  const completion = weekCompletion(state, days);
  const todayStats = habitsToday(state, today);

  const streaks = card(`
    ${label('Серии')}
    ${habits
      .map((h) => ({ habit: h, streak: habitStreak(h, today) }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 4)
      .map(({ habit, streak }) => `
        <div class="row ${streak >= 7 ? 'good' : ''}">
          <div class="n"><b>${esc(habit.name || 'Привычка')}</b>
            <span>${streak ? `${streak} ${plural(streak, 'день', 'дня', 'дней')} подряд` : 'серия прервана'}</span></div>
          <div class="amt ${streak >= 7 ? 'pos' : ''}">${streak}</div>
        </div>`).join('')}
  `);

  const ringCard = card(`
    ${label('Выполнено за неделю')}
    ${ring(completion, `${Math.round(completion * 100)}%`, 'Неделя')}
    <p class="center muted">${todayStats.done} из ${todayStats.total} сегодня</p>
  `);

  const metrics = metricStrip([
    { label: 'Активных привычек', value: String(habits.length) },
    { label: 'Сегодня', value: `${todayStats.done} / ${todayStats.total}`, tone: todayStats.done === todayStats.total ? 'pos' : '' },
    { label: 'За неделю', value: percent(completion * 100) },
    { label: 'Лучшая серия', value: String(Math.max(...habits.map((h) => habitStreak(h, today)), 0)) }
  ]);

  return `${head}${grid}<div class="grid2">${streaks}${ringCard}</div>${metrics}`;
}
