/* Экран обязательств.
   Главная мысль, вынесенная в интерфейс: платёж делится на тело, проценты и
   штрафы, и уменьшает долг только частью «тело». Поэтому здесь отдельно
   показано тело долга, а сценарии доплаты считаются амортизацией, а не
   делением остатка на платёж. */

import { getState, num } from '../store.js?v=2.4.0';
import { money, dateShort, plural, esc, monthTitle } from '../format.js?v=2.4.0';
import { debtSummary, debtOrder, payoff, debtBalance, debtMinimum, debtDue, isOverdue } from '../calc.js?v=2.4.0';
import { pageHead, metricStrip, card, label, listRow, areaChart, axis, button, empty } from '../ui.js?v=2.4.0';

const SCENARIOS = [10_000, 30_000, 50_000];

/* Подписи оси: «сейчас» и три равноотстоящие точки до закрытия. Пустые
   ячейки, которые были здесь раньше, ничего не сообщали. */
function monthTicks(count, horizon) {
  const now = new Date();
  const label = (offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1, 12);
    return `${['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'][date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
  };
  const last = Math.max(1, count - 1);
  return ['Сейчас', label(Math.round(last / 3)), label(Math.round((last * 2) / 3)),
    horizon ? dateShort(horizon) : label(last)];
}

const TYPE_LABELS = {
  microloan: 'займ', bank_credit: 'кредит', credit_card: 'кредитная карта',
  installment: 'рассрочка', person: 'долг человеку', other: 'обязательство'
};

/** Траектория остатка по месяцам — для графика. */
function trajectory(state, extra) {
  const { rows } = debtSummary(state);
  if (!rows.length) return [];
  const points = [];
  const balances = rows.map((d) => ({
    balance: debtBalance(d),
    rate: num(d.interestRate) / 100 / 12,
    payment: debtMinimum(d)
  }));
  const perMonthExtra = num(extra);

  for (let month = 0; month < 60; month += 1) {
    const total = balances.reduce((sum, b) => sum + Math.max(0, b.balance), 0);
    points.push(Math.round(total));
    if (total <= 0) break;
    let extraLeft = perMonthExtra;
    balances.forEach((b) => {
      if (b.balance <= 0) return;
      const pay = b.payment + extraLeft;
      extraLeft = 0;
      b.balance = b.balance + b.balance * b.rate - pay;
    });
  }
  return points;
}

export function render() {
  const state = getState();
  const settings = (state.settings && state.settings.v884) || {};
  const extra = num(settings.extraDebtPayment) || 10_000;
  const summary = debtSummary(state, extra);
  const strategy = settings.debtStrategy || 'urgent';

  const head = pageHead({
    eyebrow: 'Единый реестр обязательств',
    title: 'Долги',
    subtitle: 'Платёж делится на тело, проценты и штрафы — весь платёж не уменьшает основной долг',
    actions: `${button('Стратегия', { action: 'debt-strategy' })}${button('Добавить долг', { action: 'debt-new', primary: true })}`
  });

  if (!summary.count) {
    return `${head}${empty(
      'Обязательств нет. Добавьте кредит, займ, рассрочку или долг человеку — и здесь появятся сроки, порядок погашения и сценарии доплаты.',
      button('Добавить долг', { action: 'debt-new', primary: true })
    )}`;
  }

  const points = trajectory(state, extra);
  const horizon = summary.horizon;

  const hero = card(`
    ${label('Общая сумма долгов')}
    <div class="big">${money(summary.total)}</div>
    <div class="meta">
      <span>${summary.count} ${plural(summary.count, 'обязательство', 'обязательства', 'обязательств')}</span>
      <i class="d"></i><span>минимум ${money(summary.minimum)} в месяц</span>
      ${horizon ? `<i class="d"></i><span class="g">выход ${dateShort(horizon)}</span>` : ''}
    </div>
    ${points.length > 1 ? areaChart(points, { id: 'debt' }) : ''}
    ${points.length > 1 ? axis(monthTicks(points.length, horizon)) : ''}
  `);

  const scenarios = card(`
    ${label('Сценарии досрочного погашения')}
    <div class="scen">
      ${SCENARIOS.map((sum) => {
        /* Считаем по самому длинному сроку: пока не закрыт последний долг,
           обязательства не сняты. */
        let latest = null;
        let base = null;
        summary.rows.forEach((debt) => {
          const withExtra = payoff(debt, sum);
          const without = payoff(debt, 0);
          if (withExtra.date && (!latest || withExtra.date > latest)) latest = withExtra.date;
          if (without.months !== null && (base === null || without.months > base)) base = without.months;
        });
        const withMonths = latest ? summary.rows.reduce((max, d) => {
          const r = payoff(d, sum);
          return r.months !== null ? Math.max(max, r.months) : max;
        }, 0) : null;
        const saved = base !== null && withMonths !== null ? base - withMonths : null;
        return `<div class="scen-row">
          <div class="scen-k">+${money(sum)} в месяц</div>
          <div class="scen-v">${latest ? dateShort(latest) : '—'}
            ${saved && saved > 0 ? `<em>−${saved} ${plural(saved, 'месяц', 'месяца', 'месяцев')}</em>` : ''}</div>
        </div>`;
      }).join('')}
    </div>
  `);

  const metrics = metricStrip([
    { label: 'Минимум в месяц', value: money(summary.minimum) },
    { label: 'Просрочка', value: money(summary.overdue), tone: summary.overdue > 0 ? 'neg' : '' },
    { label: 'Тело долга', value: summary.principal > 0 ? money(summary.principal) : '—' },
    {
      label: 'Ближайший платёж',
      value: summary.nearest ? dateShort(debtDue(summary.nearest)) : '—',
      hint: summary.nearest ? summary.nearest.creditor || summary.nearest.person : 'даты не указаны'
    }
  ]);

  const ordered = debtOrder(summary.rows, strategy);
  const strategyText = {
    urgent: 'сначала срочные и просроченные',
    rate: 'сначала дорогие по ставке',
    small: 'сначала маленькие',
    custom: 'ручной порядок'
  }[strategy] || 'сначала срочные';

  const list = ordered.map((debt, index) => {
    const balance = debtBalance(debt);
    const initial = num(debt.initialAmount) || balance;
    const repaid = initial > 0 ? Math.max(0, Math.min(1, 1 - balance / initial)) : 0;
    const forecast = payoff(debt, index === 0 ? extra : 0);
    const principal = num(debt.principalBalance);
    const parts = [
      TYPE_LABELS[debt.type] || 'обязательство',
      debt.interestRate ? `ставка ${debt.interestRate}%` : null,
      debtMinimum(debt) ? `минимум ${money(debtMinimum(debt))}` : null,
      principal > 0 ? `тело ${money(principal)}` : null,
      forecast.date ? `закрытие ${dateShort(forecast.date)}` : forecast.reason
    ].filter(Boolean);

    return listRow({
      rank: index + 1,
      title: debt.creditor || debt.person || 'Без названия',
      subtitle: parts.join(' · '),
      progress: repaid,
      progressLabel: `погашено ${Math.round(repaid * 100)}%`,
      amount: money(balance),
      tone: 'neg',
      danger: isOverdue(debt),
      actions: [
        { action: 'debt-pay', id: debt.id, icon: '₽', title: 'Внести платёж' },
        { action: 'debt-edit', id: debt.id, icon: '✎', title: 'Изменить' }
      ]
    });
  }).join('');

  return `${head}
    <div class="grid2">${hero}${scenarios}</div>
    ${metrics}
    <div class="section-head">${label(`Порядок погашения · ${strategyText}`)}</div>
    ${list}`;
}
