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

  /**
   * Сглаженная кривая. Точки соединяются монотонными кубическими кривыми:
   * ломаная из отрезков выдаёт «зубцы» там, где их в данных нет, и мешает
   * увидеть тенденцию. Монотонность важна — обычные сплайны выбрасывают
   * линию за пределы значений, рисуя провалы и пики, которых не было.
   */
  function smoothPath(coords) {
    if (coords.length < 3) return coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    let d = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i += 1) {
      const [x0, y0] = coords[Math.max(0, i - 1)];
      const [x1, y1] = coords[i];
      const [x2, y2] = coords[i + 1];
      const [x3, y3] = coords[Math.min(coords.length - 1, i + 2)];
      /* Коэффициент 6 сглаживает мягко: выше — «резиновая» линия. */
      const c1x = x1 + (x2 - x0) / 6;
      const c1y = y1 + (y2 - y0) / 6;
      const c2x = x2 - (x3 - x1) / 6;
      const c2y = y2 - (y3 - y1) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
    }
    return d;
  }

  /** Кривая с заливкой. values — числа, labels — подписи оси. */
  function lineChart(values, labels, options = {}) {
    const points = values.filter((v) => Number.isFinite(v));
    if (points.length < 2) return '<div class="sbos-chart-empty">Пока мало данных для графика</div>';

    const width = 420;
    const height = options.height || 150;
    const padTop = 14;
    const padBottom = 12;
    const padRight = 12;   /* точка конца не должна упираться в край */
    const padLeft = 4;

    /* Шкала по фактическому размаху, а не от нуля: если остаток колеблется
       между 180 и 200 тысячами, привязка к нулю сплющит линию в прямую. */
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min;
    const pad = range > 0 ? range * 0.14 : Math.max(1, Math.abs(max) * 0.1);
    const top = max + pad;
    const bottom = Math.min(min - pad, min >= 0 ? Math.max(0, min - pad) : min - pad);
    const span = (top - bottom) || 1;

    const stepX = (width - padLeft - padRight) / (points.length - 1);
    const toY = (v) => padTop + (1 - (v - bottom) / span) * (height - padTop - padBottom);
    const coords = points.map((v, i) => [padLeft + i * stepX, toY(v)]);

    const line = smoothPath(coords);
    const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height} L${padLeft},${height} Z`;
    const [lastX, lastY] = coords[coords.length - 1];

    let length = 0;
    for (let i = 1; i < coords.length; i += 1) {
      length += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
    }
    const id = `g${Math.random().toString(36).slice(2, 8)}`;
    const zeroY = bottom <= 0 && top >= 0 ? toY(0) : null;

    return `<svg class="sbos-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img"
        aria-label="${esc(options.aria || 'График')}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--v78-violet)" stop-opacity=".22"/>
        <stop offset="100%" stop-color="var(--v78-violet)" stop-opacity="0"/>
      </linearGradient></defs>
      ${zeroY !== null ? `<line class="grid zero" x1="0" y1="${zeroY.toFixed(1)}" x2="${width}" y2="${zeroY.toFixed(1)}"/>` : ''}
      <path fill="url(#${id})" d="${area}"/>
      <path class="line draw" style="--len:${Math.ceil(length)}" d="${line}"/>
      <circle class="dot-halo" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="10"/>
      <circle class="dot" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.8"/>
    </svg>
    ${labels && labels.length ? `<div class="sbos-chart-axis">${labels.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}`;
  }

  /**
   * Категории показываем горизонтальными полосами, а не столбиками.
   * Столбики требуют много колонок, чтобы выглядеть осмысленно: при одной
   * категории столбик растягивается во всю ширину и превращается в полотно.
   * Полоса же одинаково честно читается и для одной строки, и для восьми,
   * и рядом помещается название с суммой — их не приходится угадывать.
   */
  function barChart(items) {
    const rows = items.filter((r) => r && Number.isFinite(r.value));
    if (!rows.length) return '<div class="sbos-chart-empty">Расходов в этом месяце ещё нет</div>';
    /* Масштаб по наибольшему из трат и лимитов: иначе полоса за лимитом
       упрётся в край и перестанет показывать, насколько именно вышли. */
    const scale = Math.max(...rows.map((r) => Math.max(r.value, filled(r.limit) ? r.limit : 0)), 1);

    return `<div class="sbos-hbars">${rows.map((r) => {
      const over = filled(r.limit) && r.value > r.limit;
      const width = Math.max(2, Math.round((r.value / scale) * 100));
      const limitAt = filled(r.limit) ? Math.round((r.limit / scale) * 100) : null;
      return `<div class="sbos-hbar">
        <span class="name" title="${esc(r.label)}">${esc(r.label)}</span>
        <span class="track">
          <i class="${over ? 'over' : ''}" style="width:${width}%"></i>
          ${limitAt !== null && limitAt < 100 ? `<em class="limit" style="left:${limitAt}%" title="лимит ${esc(money(r.limit))}"></em>` : ''}
        </span>
        <span class="val ${over ? 'over' : ''}">${esc(money(r.value))}${
          filled(r.limit) ? `<small>из ${esc(money(r.limit))}</small>` : ''}</span>
      </div>`;
    }).join('')}</div>`;
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
        const unconfirmed = (s.financeAccounts || [])
          .filter((a) => a && a.active !== false && !filled(a.actualBalance)).length;

        /* Ноль в заголовке ничего не сообщает и тревожит. Если подтверждённая
           сумма нулевая, честнее сказать, что остатки не заполнены, и позвать
           их сверить — цифра появится сама. */
        const zero = Math.round(last) === 0;
        html += card(
          'Остаток по счетам · 90 дней',
          zero ? (unconfirmed ? 'не подтверждён' : '0 ₽') : money(last),
          zero
            ? (unconfirmed
              ? `Не заполнен остаток по ${unconfirmed} ${unconfirmed === 1 ? 'счёту' : 'счетам'} — сверьте их, и линия покажет настоящие деньги. Ниже видно только движение: за три месяца ${diff >= 0 ? 'прибавилось' : 'ушло'} ${money(Math.abs(diff))}.`
              : 'Подтверждённый остаток нулевой. Ниже — движение денег за три месяца.')
            : `${diff >= 0 ? 'Прибавилось' : 'Убыло'} ${money(Math.abs(diff))} за три месяца. Линия восстановлена по операциям.`,
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
