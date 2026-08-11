/* Экран целей.

   Смысл, унаследованный от прошлой версии: цель — это не желание, а связка
   «следующий шаг + этапы + привычки, которые к ней ведут». Поля сохраняем
   как были (title, nextAction, due/date, status, stages, habitIds), чтобы
   старое приложение продолжало их понимать. */

import { getState } from '../store.js?v=2.3.0';
import { esc, dateShort, daysFromToday, plural, percent, todayKey } from '../format.js?v=2.3.0';
import { activeHabits, isHabitDone, habitStreak } from '../calc.js?v=2.3.0';
import { pageHead, card, label, ring, button, empty, metricStrip, listRow } from '../ui.js?v=2.3.0';

export const activeGoals = (state) => (state.goals || [])
  .filter((g) => g && g.status !== 'done' && g.status !== 'archived');

/** Доля выполненных этапов. */
export function goalProgress(goal) {
  const stages = Array.isArray(goal.stages) ? goal.stages : [];
  if (!stages.length) return null;
  const done = stages.filter((s) => s && s.done).length;
  return { done, total: stages.length, share: done / stages.length };
}

/** Привычки, привязанные к цели. */
function linkedHabits(state, goal) {
  const ids = Array.isArray(goal.habitIds) ? goal.habitIds : [];
  if (!ids.length) return [];
  return activeHabits(state).filter((h) => ids.includes(h.id));
}

function deadlineText(goal) {
  const due = goal.due || goal.date || goal.deadline;
  if (!due) return 'срок не задан';
  const days = daysFromToday(due);
  if (days === null) return 'срок не задан';
  if (days < 0) return `просрочено на ${Math.abs(days)} ${plural(Math.abs(days), 'день', 'дня', 'дней')}`;
  if (days === 0) return 'срок сегодня';
  return `${days} ${plural(days, 'день', 'дня', 'дней')} до срока · ${dateShort(due)}`;
}

export function render() {
  const state = getState();
  const goals = activeGoals(state);
  const today = todayKey();

  const head = pageHead({
    eyebrow: 'Направление движения',
    title: 'Цели',
    subtitle: 'Цель держится не намерением, а следующим шагом и привычками, которые к ней ведут',
    actions: button('Новая цель', { action: 'goal-new', primary: true })
  });

  if (!goals.length) {
    return `${head}${empty(
      'Целей пока нет. Цель здесь — это название, ближайший шаг и, по желанию, этапы с привычками: тогда видно не только куда идти, но и что сделать сегодня.',
      button('Новая цель', { action: 'goal-new', primary: true })
    )}`;
  }

  /* Сначала те, у кого срок ближе; цели без срока — в конец. */
  const ordered = [...goals].sort((a, b) => {
    const da = daysFromToday(a.due || a.date) ?? 9999;
    const db = daysFromToday(b.due || b.date) ?? 9999;
    return da - db;
  });

  const withStages = goals.filter((g) => goalProgress(g));
  const overallShare = withStages.length
    ? withStages.reduce((sum, g) => sum + goalProgress(g).share, 0) / withStages.length
    : null;

  const cards = ordered.map((goal) => {
    const progress = goalProgress(goal);
    const habits = linkedHabits(state, goal);
    const doneToday = habits.filter((h) => isHabitDone(h, today)).length;
    const overdue = (daysFromToday(goal.due || goal.date) ?? 1) < 0;

    return `<div class="goal ${overdue ? 'overdue' : ''}">
      <div class="goal-head">
        <div>
          <b>${esc(goal.title || 'Без названия')}</b>
          <span>${esc(deadlineText(goal))}</span>
        </div>
        <button class="row-btn" type="button" data-act="goal-edit" data-id="${esc(goal.id)}"
          title="Изменить цель" aria-label="Изменить цель">✎</button>
      </div>

      ${goal.nextAction
        ? `<div class="goal-next"><i>Следующий шаг</i><p>${esc(goal.nextAction)}</p></div>`
        : `<div class="goal-next empty-next"><i>Следующий шаг не назначен</i>
             <p>Пока его нет, цель остаётся намерением.</p></div>`}

      ${progress ? `
        <div class="goal-prog">
          <div class="tr"><i style="width:${(progress.share * 100).toFixed(0)}%"></i></div>
          <small>${progress.done} из ${progress.total} ${plural(progress.total, 'этапа', 'этапов', 'этапов')}</small>
        </div>
        <div class="stages">
          ${goal.stages.slice(0, 6).map((stage, i) => `
            <button class="stage ${stage.done ? 'done' : ''}" type="button"
              data-act="goal-stage" data-id="${esc(goal.id)}" data-stage="${i}">
              <span class="mark">${stage.done ? '✓' : ''}</span>${esc(stage.title || `Этап ${i + 1}`)}
            </button>`).join('')}
        </div>` : ''}

      ${habits.length ? `
        <div class="goal-habits">
          <i>Привычки цели · сегодня ${doneToday} из ${habits.length}</i>
          <div class="chips">
            ${habits.map((h) => `<span class="chip ${isHabitDone(h, today) ? 'on' : ''}">
              ${esc(h.name)}${habitStreak(h, today) ? ` · ${habitStreak(h, today)}` : ''}</span>`).join('')}
          </div>
        </div>` : ''}
    </div>`;
  }).join('');

  const metrics = metricStrip([
    { label: 'Активных целей', value: String(goals.length) },
    { label: 'Со следующим шагом', value: String(goals.filter((g) => g.nextAction).length),
      hint: goals.some((g) => !g.nextAction) ? 'остальные — намерения' : '' },
    { label: 'Просрочено', value: String(goals.filter((g) => (daysFromToday(g.due || g.date) ?? 1) < 0).length),
      tone: goals.some((g) => (daysFromToday(g.due || g.date) ?? 1) < 0) ? 'neg' : '' },
    { label: 'Средний прогресс', value: overallShare === null ? '—' : percent(overallShare * 100) }
  ]);

  return `${head}<div class="goals">${cards}</div>${metrics}`;
}
