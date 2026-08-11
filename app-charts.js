/* ============================================================================
   Second Brain OS — графики.

   Отдельный файл, а не секция в app.js: это новый слой, он не переплетён с
   существующим кодом и его удобно отключить целиком, если понадобится.

   Модуль ничего не записывает в состояние. Он только читает и рисует —
   поэтому ошибка здесь не может испортить данные.

   Ряды строятся из операций: истории остатков приложение не хранит, поэтому
   кривая восстанавливается от текущего подтверждённого остатка назад по
   движениям. Это честнее, чем рисовать выдуманную линию.
   ========================================================================== */
'use strict';

(() => {
  const state = () => window.SecondBrainApp?.getState?.() || null;
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const filled = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  const money = (value) => `${Math.round(num(value)).toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;
  const moneyShort = (value) => {
    const abs = Math.abs(num(value));
    if (abs >= 1_000_000) return `${(num(value) / 1_000_000).toFixed(1).replace('.', ',')} млн`;
    if (abs >= 10_000) return `${Math.round(num(value) / 1000)} тыс.`;
    return String(Math.round(num(value)));
  };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const key = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const monthKey = (value) => String(value || '').slice(0, 7);

  /* ------------------------------- отрисовка ------------------------------ */

  /** Кривая с заливкой. Значения — массив чисел, подписи — массив строк. */
  function lineChart(values, labels, options = {}) {
    const points = values.filter((v) => Number.isFinite(v));
    if (points.length < 2) return '<div class="sbos-chart-empty">Пока мало данных для графика</div>';

    const width = 420;
    const height = options.height || 132;
    const max = Math.max(...points);
    const min = Math.min(...points, 0);
    const span = (max - min) || 1;
    const stepX = (width - 8) / (points.length - 1);
    const toY = (v) => height - 8 - ((v - min) / span) * (height - 26);

    const coords = points.map((v, i) => [4 + i * stepX, toY(v)]);
    const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height} L4,${height} Z`;
    const [lastX, lastY] = coords[coords.length - 1];

    /* Длина линии нужна анимации прочерчивания: без неё штрих не рассчитать. */
    let length = 0;
    for (let i = 1; i < coords.length; i += 1) {
      length += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
    }
    const id = `sbosgrad${Math.random().toString(36).slice(2, 8)}`;

    return `<svg class="sbos-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img"
        aria-label="${esc(options.aria || 'График')}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--v78-violet)" stop-opacity=".26"/>
        <stop offset="100%" stop-color="var(--v78-violet)" stop-opacity="0"/>
      </linearGradient></defs>
      <line class="grid" x1="0" y1="${(height * 0.3).toFixed(0)}" x2="${width}" y2="${(height * 0.3).toFixed(0)}"/>
      <line class="grid" x1="0" y1="${(height * 0.66).toFixed(0)}" x2="${width}" y2="${(height * 0.66).toFixed(0)}"/>
      <path fill="url(#${id})" d="${area}"/>
      <path class="line draw" style="--len:${Math.ceil(length)}" d="${line}"/>
      <circle class="dot-halo" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="9"/>
      <circle class="dot" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.6"/>
    </svg>
    ${labels && labels.length ? `<div class="sbos-chart-axis">${labels.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}`;
  }

  /** Столбики. items: [{label, value, limit}] — превышение лимита краснеет. */
  function barChart(items) {
    const rows = items.filter((r) => r && Number.isFinite(r.value));
    if (!rows.length) return '<div class="sbos-chart-empty">Расходов в этом месяце ещё нет</div>';
    const max = Math.max(...rows.map((r) => Math.max(r.value, r.limit || 0)), 1);
    return `<div class="sbos-bars">${rows.map((r) => {
      const over = filled(r.limit) && r.value > r.limit;
      const share = Math.max(3, Math.round((r.value / max) * 100));
      return `<div class="bar" title="${esc(r.label)}: ${esc(money(r.value))}${r.limit ? ` из ${esc(money(r.limit))}` : ''}">
        <span class="fill ${over ? 'over' : ''}" style="height:${share}%"></span>
      </div>`;
    }).join('')}</div>
    <div class="sbos-bars-labels">${rows.map((r) => `<span>${esc(r.label)}</span>`).join('')}</div>`;
  }

  const card = (title, value, note, body, negative = false) => `
    <section class="sbos-chart-card" data-sbos-chart>
      <div class="sbos-chart-head">
        <div>
          <div class="sbos-chart-title">${esc(title)}</div>
          <div class="sbos-chart-value ${negative ? 'negative' : ''}">${esc(value)}</div>
        </div>
      </div>
      ${note ? `<p class="sbos-chart-note">${esc(note)}</p>` : ''}
      ${body}
    </section>`;

  /* --------------------------------- ряды --------------------------------- */

  const ownAccounts = (s) => (s.financeAccounts || [])
    .filter((a) => a && a.active !== false && a.type !== 'credit_card' && filled(a.actualBalance));

  /** Остаток по дням назад от сегодняшнего: восстанавливаем по операциям. */
  function balanceSeries(s, days = 90) {
    const accounts = ownAccounts(s);
    if (!accounts.length) return null;
    const today = num(accounts.reduce((sum, a) => sum + num(a.actualBalance), 0));

    const byDay = new Map();
    (s.operations || []).forEach((op) => {
      if (!op || !op.date) return;
      const delta = op.type === 'income' ? num(op.amount) : op.type === 'expense' ? -num(op.amount) : 0;
      if (!delta) return;
      byDay.set(op.date, (byDay.get(op.date) || 0) + delta);
    });
    if (!byDay.size) return null;

    const values = [];
    const labels = [];
    let running = today;
    const now = new Date();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12);
      values.unshift(Math.round(running));
      if (i % Math.round(days / 3) === 0) labels.unshift(`${date.getDate()} ${MONTHS[date.getMonth()]}`);
      running -= byDay.get(key(date)) || 0;   /* шаг назад: снимаем движение дня */
    }
    return { values, labels: labels.slice(0, 4) };
  }

  /** Доходы и расходы по месяцам. */
  function monthlySeries(s, months = 6) {
    const now = new Date();
    const out = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1, 12);
      const mk = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const ops = (s.operations || []).filter((op) => op && monthKey(op.date) === mk);
      out.push({
        label: MONTHS[date.getMonth()],
        income: ops.filter((o) => o.type === 'income').reduce((x, o) => x + num(o.amount), 0),
        expense: ops.filter((o) => o.type === 'expense').reduce((x, o) => x + num(o.amount), 0)
      });
    }
    return out.some((m) => m.income || m.expense) ? out : null;
  }

  /** Расходы по категориям текущего месяца с лимитами. */
  function categorySeries(s) {
    const mk = monthKey(key(new Date()));
    const spent = new Map();
    (s.operations || []).forEach((op) => {
      if (!op || op.type !== 'expense' || monthKey(op.date) !== mk) return;
      const name = op.category || 'Без категории';
      spent.set(name, (spent.get(name) || 0) + num(op.amount));
    });
    if (!spent.size) return null;
    const limits = (s.financeMonthBudgets || {})[mk] || {};
    const categories = s.financeCategories || [];
    return [...spent.entries()]
      .map(([label, value]) => {
        const meta = categories.find((c) => c && c.name === label);
        const limit = filled(limits[label]) ? num(limits[label])
          : (meta && filled(meta.monthlyLimit) ? num(meta.monthlyLimit) : null);
        return { label, value, limit };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }

  /** Погашение долгов помесячно: амортизация, а не деление остатка на платёж. */
  function debtSeries(s, extra = 0) {
    const rows = (s.debts || []).filter((d) => d && d.status !== 'closed' && (d.direction || 'out') === 'out');
    if (!rows.length) return null;
    const balances = rows.map((d) => ({
      balance: filled(d.currentBalance) ? num(d.currentBalance)
        : num(d.principalBalance) + num(d.accruedInterest) + num(d.penalties) || num(d.amount),
      rate: num(d.interestRate) / 100 / 12,
      payment: num(d.minimumPayment) || num(d.paymentAmount)
    })).filter((b) => b.balance > 0);
    if (!balances.length) return null;
    if (!balances.some((b) => b.payment > 0)) return null;

    const values = [];
    for (let month = 0; month < 72; month += 1) {
      const total = balances.reduce((sum, b) => sum + Math.max(0, b.balance), 0);
      values.push(Math.round(total));
      if (total <= 0) break;
      let left = num(extra);
      balances.forEach((b) => {
        if (b.balance <= 0) return;
        const pay = b.payment + left;
        left = 0;
        const next = b.balance + b.balance * b.rate - pay;
        b.balance = next >= b.balance ? b.balance : next;   /* платёж не покрывает проценты */
      });
      if (month > 2 && values[month] === values[month - 1]) break;
    }
    if (values.length < 2) return null;

    const now = new Date();
    const labels = [0, Math.round(values.length / 3), Math.round((values.length * 2) / 3), values.length - 1]
      .map((i) => { const d = new Date(now.getFullYear(), now.getMonth() + i, 1, 12);
        return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`; });
    return { values, labels, months: values.length - 1 };
  }

  /* ------------------------------- встраивание ---------------------------- */

  function buildFor(route, s) {
    if (route === 'finance' || route === 'finance-accounts') {
      const series = balanceSeries(s);
      const cats = categorySeries(s);
      let html = '';
      if (series) {
        const last = series.values[series.values.length - 1];
        const first = series.values[0];
        const diff = last - first;
        html += card('Остаток по счетам · 90 дней', money(last),
          `${diff >= 0 ? 'Прибавилось' : 'Убыло'} ${money(Math.abs(diff))} за три месяца. Линия восстановлена по операциям.`,
          lineChart(series.values, series.labels, { aria: 'Динамика остатка по счетам' }));
      }
      if (cats) {
        const over = cats.filter((c) => filled(c.limit) && c.value > c.limit);
        html += card('Расходы по категориям · этот месяц',
          money(cats.reduce((sum, c) => sum + c.value, 0)),
          over.length ? `За лимитом: ${over.map((c) => c.label).join(', ')}` : 'Все категории в пределах лимитов',
          barChart(cats));
      }
      return html;
    }

    if (route === 'finance-analytics') {
      const months = monthlySeries(s);
      if (!months) return '';
      const income = months.map((m) => m.income);
      const expense = months.map((m) => m.expense);
      const net = months.map((m) => m.income - m.expense);
      const lastNet = net[net.length - 1];
      return card('Движение денег · 6 месяцев', money(lastNet),
        lastNet >= 0 ? 'В этом месяце доходы превышают расходы' : 'В этом месяце расходы превышают доходы',
        lineChart(net, months.map((m) => m.label), { aria: 'Разница доходов и расходов по месяцам' }),
        lastNet < 0)
        + card('Расходы по месяцам', money(expense[expense.length - 1]), 'Столбик выше — месяц дороже',
          barChart(months.map((m) => ({ label: m.label, value: m.expense }))));
    }

    if (route === 'debts') {
      const extra = num(s.settings?.v884?.extraDebtPayment);
      const series = debtSeries(s, extra);
      if (!series) return '';
      const start = series.values[0];
      return card('Погашение обязательств', money(start),
        series.months >= 71
          ? 'При текущем платеже долг закрывается дольше шести лет'
          : `При текущем платеже${extra ? ` и доплате ${money(extra)}` : ''} — около ${series.months} мес.`,
        lineChart(series.values, series.labels, { aria: 'Кривая погашения долга' }),
        true);
    }

    return '';
  }

  function inject() {
    const s = state();
    if (!s) return;
    const page = document.querySelector('#app .v78-page');
    if (!page) return;

    const route = (location.hash || '#today').replace('#', '').split('?')[0];
    const html = buildFor(route, s);
    const existing = page.querySelector('[data-sbos-chart]');

    if (!html) { page.querySelectorAll('[data-sbos-chart]').forEach((n) => n.remove()); return; }
    /* Не перерисовываем то же самое: лишняя запись в DOM сбрасывает анимацию
       и заставляет наблюдатель срабатывать снова. */
    if (existing && page.dataset.sbosChartRoute === route) return;

    page.querySelectorAll('[data-sbos-chart]').forEach((n) => n.remove());
    const nav = page.querySelector('.v884-finance-nav');
    const anchor = nav || page.querySelector('.v78-page-head');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    else page.insertAdjacentHTML('afterbegin', html);
    page.dataset.sbosChartRoute = route;
  }

  let scheduledFrame = 0;
  let scheduledTimer = 0;
  function schedule() {
    if (scheduledFrame || scheduledTimer) return;
    const run = () => {
      if (scheduledFrame) cancelAnimationFrame(scheduledFrame);
      if (scheduledTimer) clearTimeout(scheduledTimer);
      scheduledFrame = 0; scheduledTimer = 0;
      try { inject(); } catch (error) { console.warn('[графики]', error); }
    };
    /* Кадр может не наступить в скрытой вкладке — рядом идёт таймер. */
    scheduledFrame = requestAnimationFrame(run);
    scheduledTimer = setTimeout(run, 140);
  }

  function start() {
    schedule();
    const root = document.getElementById('app');
    if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => {
      document.querySelectorAll('[data-sbos-chart]').forEach((n) => n.remove());
      const page = document.querySelector('#app .v78-page');
      if (page) delete page.dataset.sbosChartRoute;
      schedule();
    });
    window.addEventListener('second-brain-v104-saved', schedule);
  }

  window.SecondBrainCharts = { inject, lineChart, barChart, balanceSeries, monthlySeries, categorySeries, debtSeries };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else if (document.body?.dataset.sbosBooted === '1') start();
  else { window.addEventListener('second-brain-booted', start, { once: true }); setTimeout(start, 1500); }
})();
