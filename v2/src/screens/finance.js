/* Экран денег.
   Принципиальное отличие от прошлой версии: счёт без подтверждённого остатка
   показывается словами «не заполнено», а не нулём, и не участвует в сумме.
   Молчаливый ноль создаёт ложное ощущение, что денег известно сколько. */

import { getState, num, numberOrNull } from '../store.js?v=2.4.0';
import { money, monthKey, monthTitle, todayKey, esc, plural, percent } from '../format.js?v=2.4.0';
import { totalBalance, accountsWithBalance, accountsUnfilled, monthTotals, categorySpend } from '../calc.js?v=2.4.0';
import { pageHead, metricStrip, card, label, button, empty } from '../ui.js?v=2.4.0';

const ACCOUNT_TYPES = {
  card: 'карта', account: 'счёт', cash: 'наличные',
  savings: 'накопительный', credit_card: 'кредитная карта', other: 'счёт'
};

function accountCard(account) {
  const balance = numberOrNull(account.actualBalance);
  const unfilled = balance === null;
  const name = account.name || 'Счёт';
  const type = ACCOUNT_TYPES[account.type] || 'счёт';
  /* Не повторяем тип, если он уже сказан в названии («Наличные · наличные») */
  const heading = name.toLowerCase() === type.toLowerCase() ? name : `${name} · ${type}`;
  return `<div class="card pad acc ${unfilled ? 'warn' : ''}">
    ${label(heading)}
    <div class="acc-sum ${unfilled ? 'dim' : ''}">${unfilled ? 'не заполнено' : money(balance)}</div>
    <div class="acc-note ${unfilled ? 'warn-text' : 'ok-text'}">
      ${unfilled ? 'это не ноль — остаток неизвестен' : 'остаток подтверждён'}
    </div>
  </div>`;
}

export function render() {
  const state = getState();
  const month = monthKey(todayKey());
  const balance = totalBalance(state);
  const totals = monthTotals(state, month);
  const accounts = (state.financeAccounts || []).filter((a) => a && a.active !== false);
  const categories = categorySpend(state, month);

  const head = pageHead({
    eyebrow: monthTitle(month),
    title: 'Финансы',
    subtitle: 'Счета, операции и лимиты категорий',
    actions: `${button('Сверить остатки', { action: 'reconcile' })}${button('Операция', { action: 'operation-new', primary: true })}`
  });

  if (!accounts.length) {
    return `${head}${empty(
      'Счетов пока нет. Добавьте счёт с фактическим остатком — после этого появятся дневной лимит и разбор расходов.',
      button('Добавить счёт', { action: 'account-new', primary: true })
    )}`;
  }

  const accountsBlock = `<div class="grid3">${accounts.slice(0, 6).map(accountCard).join('')}</div>`;

  const warning = balance.unfilledCount
    ? `<div class="callout warn-callout">
         Не подтверждён остаток по ${balance.unfilledCount}
         ${plural(balance.unfilledCount, 'счёту', 'счетам', 'счетам')}.
         Пока это так, общая сумма и дневной лимит считаются по неполным данным.
       </div>`
    : '';

  const categoriesBlock = categories.length
    ? card(`
        ${label(`Расходы по категориям · ${monthTitle(month)}`)}
        ${categories.slice(0, 8).map((row) => {
          const width = row.limit ? Math.min(120, (row.spent / row.limit) * 100) : 0;
          return `<div class="catbar">
            <span class="cn">${esc(row.name)}</span>
            <span class="cb"><i class="${row.over ? 'over' : ''}" style="width:${width.toFixed(0)}%"></i></span>
            <span class="cv">${money(row.spent)}${row.limit ? ` <em>/ ${money(row.limit)}</em>` : ''}</span>
          </div>`;
        }).join('')}
      `)
    : card(`${label('Расходы по категориям')}<p class="muted">В этом месяце расходов ещё нет.</p>`);

  const metrics = metricStrip([
    { label: 'Доходы', value: money(totals.income), tone: totals.income ? 'pos' : '' },
    { label: 'Расходы', value: money(totals.expense), tone: totals.expense ? 'neg' : '' },
    { label: 'Остаток по счетам', value: money(balance.total), hint: `подтверждено: ${balance.filledCount} из ${accounts.length}` },
    { label: 'Операций за месяц', value: String(totals.count) }
  ]);

  return `${head}${warning}${accountsBlock}${categoriesBlock}${metrics}`;
}
