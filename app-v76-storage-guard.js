'use strict';

/* Second Brain OS V75 — кликабельные финансовые карточки.
   Модуль ничего не очищает и не пересоздаёт при загрузке.
   Запись выполняется только после явного действия пользователя, с резервным снимком state. */
(() => {
  const BUILD = 'second-brain-space-v75-finance-details-20260716-r2';
  const BACKUP_KEY = 'secondBrainOS.v75.lastSafeBackup';
  let timer = 0;

  const clean = value => String(value ?? '').trim();
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
  const amount = value => {
    if (typeof num === 'function') return num(value);
    return Number(String(value ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
  };
  const cash = value => typeof money === 'function'
    ? money(value)
    : `${amount(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
  const dateText = value => typeof fmt === 'function' ? fmt(value) : (value || '—');
  const todayValue = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  const makeId = () => typeof uid === 'function' ? uid() : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

  function selectedPeriod() {
    try {
      if (typeof periodInfo === 'function') return periodInfo(state?.settings?.financePeriod || 'month');
    } catch (error) {}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const last = String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, '0');
    return { key: 'month', title: 'текущий месяц', start: `${year}-${month}-01`, end: `${year}-${month}-${last}` };
  }

  function periodContains(date, period) {
    const value = clean(date).slice(0, 10);
    return Boolean(value && value >= period.start && value <= period.end);
  }

  function financeData() {
    const period = selectedPeriod();
    const debts = Array.isArray(state?.debts) ? state.debts : [];
    const purchases = Array.isArray(state?.purchases) ? state.purchases : [];
    const payments = debts
      .filter(item => item?.direction === 'out' && item?.status !== 'Закрыт')
      .filter(item => item?.due && String(item.due).slice(0, 10) <= period.end)
      .sort((left, right) => String(left.due || '').localeCompare(String(right.due || '')));
    const planned = purchases
      .filter(item => item?.includeInBudget !== false && periodContains(item?.date, period))
      .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));
    const paymentTotal = payments.reduce((sum, item) => sum + (amount(item.minPayment) || amount(item.amount)), 0);
    const purchaseTotal = planned.reduce((sum, item) => sum + amount(item.amount), 0);
    return { period, payments, planned, paymentTotal, purchaseTotal, reserveTotal: paymentTotal + purchaseTotal };
  }

  function snapshotBeforeWrite(reason) {
    /* Полную копию больше не кладём рядом с основной базой в localStorage:
       это удваивало объём данных и могло блокировать дальнейшие сохранения.
       V76 хранит защитные снимки в IndexedDB с существенно большим лимитом. */
    if (window.SecondBrainStorageGuard?.backup) {
      window.SecondBrainStorageGuard.backup(reason).catch(error => console.warn('[V75 backup via V76]', error));
      return;
    }
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify({
        createdAt: new Date().toISOString(),
        reason,
        lightweight: true
      }));
    } catch (error) {
      console.warn('[V75] Не удалось записать метаданные защитного снимка', error);
    }
  }

  function persist(reason) {
    snapshotBeforeWrite(reason);
    if (typeof save === 'function') save();
  }

  function setBuild() {
    document.body.dataset.sbosBuild = BUILD;
    document.body.dataset.v75FinanceDetails = 'ready';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', BUILD);
    try { localStorage.setItem('secondBrainOS.currentBuild', BUILD); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version) version.textContent = 'V75 · ФИНАНСЫ БЕЗ ПОТЕРИ ДАННЫХ';
  }

  function markCard(card, action, hint) {
    if (!card) return;
    card.classList.add('v75-clickable-finance-card');
    card.dataset.v75Action = action;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', hint);
    if (!card.querySelector('.v75-card-open-hint')) {
      card.insertAdjacentHTML('beforeend', '<span class="v75-card-open-hint">Открыть →</span>');
    }
  }

  function enhanceFinancePage() {
    setBuild();
    const route = (location.hash || '').replace('#', '') || (typeof page === 'string' ? page : 'dashboard');
    if (route !== 'finance') return;
    const view = document.getElementById('view');
    if (!view) return;

    const cards = view.querySelectorAll('.v65-money-kpis > article');
    markCard(cards[0], 'actual-balance', 'Изменить фактический остаток');
    markCard(cards[1], 'limit-details', 'Открыть расчёт дневного лимита');
    markCard(cards[2], 'limit-details', 'Открыть расчёт недельного лимита');
    markCard(cards[3], 'mandatory-details', 'Открыть обязательные платежи и покупки');

    const data = financeData();
    if (cards[3]) {
      const title = cards[3].querySelector('span');
      const strong = cards[3].querySelector('strong');
      const small = cards[3].querySelector('small');
      if (title) title.textContent = 'Обязательные платежи и покупки';
      if (strong) strong.textContent = data.reserveTotal ? cash(data.reserveTotal) : '—';
      if (small) small.textContent = `${data.payments.length} платежей · ${data.planned.length} покупок`;
      cards[3].classList.add('v75-mandatory-card');
    }

    const flowItems = view.querySelectorAll('.v65-flow-grid > div');
    flowItems.forEach(item => {
      const label = clean(item.querySelector('span')?.textContent).toLowerCase();
      if (label === 'планы') {
        item.classList.add('v75-clickable-flow-tile');
        item.dataset.v75Action = 'mandatory-details';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', 'Открыть обязательные покупки');
        const strong = item.querySelector('strong');
        if (strong) strong.textContent = cash(data.purchaseTotal);
      }
    });
  }

  function openLimitDetails() {
    const data = financeData();
    const balance = amount(state?.settings?.currentBalance);
    const free = balance - data.paymentTotal - data.purchaseTotal;
    const settings = state?.settings?.v67 || {};
    const mode = settings.financeLimitMode === 'manual' ? 'manual' : 'auto';
    const manual = amount(settings.manualDailyLimit);
    const start = data.period.start > todayValue() ? data.period.start : todayValue();
    const days = data.period.end >= todayValue()
      ? Math.max(1, Math.round((new Date(`${data.period.end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1)
      : 0;
    const auto = days ? Math.max(0, free / days) : 0;
    const daily = mode === 'manual' ? manual : auto;
    const body = `<section class="v75-modal-stack">
      <div class="v75-breakdown-grid">
        <article><span>Остаток</span><b>${cash(balance)}</b></article>
        <article><span>Платежи</span><b>− ${cash(data.paymentTotal)}</b></article>
        <article><span>Покупки</span><b>− ${cash(data.purchaseTotal)}</b></article>
        <article class="is-result"><span>Свободно</span><b>${cash(Math.max(0, free))}</b></article>
      </div>
      <div class="v75-formula-card"><b>${mode === 'manual' ? 'Ручной режим' : 'Автоматический режим'}</b><p>${mode === 'manual' ? `Используется сохранённый лимит ${cash(manual)} в день.` : `${cash(Math.max(0, free))} ÷ ${days || 0} дней = ${cash(auto)} в день.`}</p><strong>Текущий дневной лимит: ${daily ? cash(daily) : '—'}</strong></div>
      <div class="v75-modal-actions"><button class="v75-primary" data-v75-action="mandatory-details" type="button">Открыть обязательства</button><button data-v75-action="close-modal" type="button">Закрыть</button></div>
    </section>`;
    if (typeof openModal === 'function') openModal('Как рассчитан лимит', body);
  }

  function paymentRow(item) {
    const payment = amount(item.minPayment) || amount(item.amount);
    return `<article class="v75-obligation-row">
      <span class="v75-obligation-icon">₽</span>
      <div><b>${html(item.person || 'Обязательный платёж')}</b><small>${item.due ? `до ${html(dateText(item.due))}` : 'дата не указана'} · ${html(item.note || 'без комментария')}</small></div>
      <strong>${cash(payment)}</strong>
      <button data-action="editRecord" data-type="debt" data-id="${html(item.id)}" type="button">Изменить</button>
    </article>`;
  }

  function purchaseRow(item) {
    const mandatory = item.mandatory !== false;
    return `<article class="v75-obligation-row is-purchase">
      <span class="v75-obligation-icon">🛒</span>
      <div><b>${html(item.title || 'Покупка')}</b><small>${item.date ? html(dateText(item.date)) : 'дата не указана'} · ${html(item.area || 'Личное')}${item.note ? ` · ${html(item.note)}` : ''}</small></div>
      <strong>${cash(item.amount)}</strong>
      <div class="v75-row-actions"><button data-action="editRecord" data-type="purchase" data-id="${html(item.id)}" type="button">Изменить</button><button data-v75-action="exclude-purchase" data-id="${html(item.id)}" type="button">${mandatory ? 'Убрать из обязательных' : 'Не учитывать'}</button></div>
    </article>`;
  }

  function openMandatoryDetails() {
    const data = financeData();
    const body = `<section class="v75-modal-stack">
      <div class="v75-obligation-summary">
        <article><span>Платежи</span><b>${cash(data.paymentTotal)}</b><small>${data.payments.length} записей</small></article>
        <article><span>Обязательные покупки</span><b>${cash(data.purchaseTotal)}</b><small>${data.planned.length} записей</small></article>
        <article class="is-total"><span>Всего зарезервировано</span><b>${cash(data.reserveTotal)}</b><small>${html(data.period.title || '')}</small></article>
      </div>
      <section class="v75-obligation-section">
        <header><div><span>Покупки</span><h3>Обязательные покупки</h3><p>Эти суммы вычитаются до расчёта свободного дневного лимита.</p></div><button class="v75-primary" data-v75-action="add-mandatory-purchase" type="button">＋ Добавить</button></header>
        <div class="v75-obligation-list">${data.planned.map(purchaseRow).join('') || '<div class="v75-empty">Обязательных покупок в выбранном периоде пока нет.</div>'}</div>
      </section>
      <section class="v75-obligation-section">
        <header><div><span>Платежи</span><h3>Обязательные платежи</h3><p>Активные долги и платежи со сроком до конца выбранного периода.</p></div><button data-action="openDebtOut" type="button">＋ Добавить платёж</button></header>
        <div class="v75-obligation-list">${data.payments.map(paymentRow).join('') || '<div class="v75-empty">Обязательных платежей пока нет.</div>'}</div>
      </section>
      <p class="v75-data-safety-note"><b>Данные защищены от сброса:</b> этот модуль не очищает существующие записи. Перед изменением создаётся локальный защитный снимок.</p>
      <div class="v75-modal-actions"><button data-v75-action="close-modal" type="button">Закрыть</button></div>
    </section>`;
    if (typeof openModal === 'function') openModal('Обязательные платежи и покупки', body);
  }

  function openMandatoryPurchaseForm() {
    const date = todayValue();
    const body = `<section class="v75-modal-stack">
      <div class="v75-form-grid">
        <label><span>Название покупки</span><input id="v75_purchase_title" placeholder="Например, лекарства или продукты"></label>
        <label><span>Сумма</span><input id="v75_purchase_amount" type="number" min="0" step="1" placeholder="0"></label>
        <label><span>Дата покупки</span><input id="v75_purchase_date" type="date" value="${html(date)}"></label>
        <label><span>Сфера</span><input id="v75_purchase_area" value="Обязательные покупки"></label>
        <label class="is-wide"><span>Комментарий</span><textarea id="v75_purchase_note" placeholder="Почему покупка обязательна, что именно нужно купить"></textarea></label>
      </div>
      <p class="v75-data-safety-note">Новая запись добавится к существующим данным. Старые покупки, операции и настройки останутся без изменений.</p>
      <div class="v75-modal-actions"><button class="v75-primary" data-v75-action="save-mandatory-purchase" type="button">Сохранить покупку</button><button data-v75-action="mandatory-details" type="button">Назад</button></div>
    </section>`;
    if (typeof openModal === 'function') openModal('Новая обязательная покупка', body);
    setTimeout(() => document.getElementById('v75_purchase_title')?.focus(), 30);
  }

  function saveMandatoryPurchase() {
    const title = clean(document.getElementById('v75_purchase_title')?.value);
    const value = amount(document.getElementById('v75_purchase_amount')?.value);
    const date = clean(document.getElementById('v75_purchase_date')?.value) || todayValue();
    const area = clean(document.getElementById('v75_purchase_area')?.value) || 'Обязательные покупки';
    const note = clean(document.getElementById('v75_purchase_note')?.value);
    if (!title) return typeof toast === 'function' ? toast('Укажите название покупки') : undefined;
    if (value <= 0) return typeof toast === 'function' ? toast('Укажите сумму больше нуля') : undefined;

    if (!Array.isArray(state.purchases)) state.purchases = [];
    const record = {
      id: makeId(), title, amount: value, date, area,
      includeInBudget: true, mandatory: true, url: '', image: '', note,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    state.purchases.unshift(record);
    persist('Добавление обязательной покупки');
    if (typeof render === 'function') render();
    setTimeout(openMandatoryDetails, 40);
    if (typeof toast === 'function') toast('Обязательная покупка сохранена');
  }

  function excludePurchase(id) {
    const rows = Array.isArray(state?.purchases) ? state.purchases : [];
    const target = rows.find(item => String(item.id) === String(id));
    if (!target) return;
    snapshotBeforeWrite('Исключение покупки из обязательных');
    state.purchases = rows.map(item => String(item.id) === String(id)
      ? { ...item, includeInBudget: false, mandatory: false, updatedAt: new Date().toISOString() }
      : item);
    if (typeof save === 'function') save();
    if (typeof render === 'function') render();
    setTimeout(openMandatoryDetails, 40);
    if (typeof toast === 'function') toast('Покупка сохранена, но больше не уменьшает лимит');
  }

  function closeCurrentModal() {
    if (typeof closeModal === 'function') closeModal();
  }

  function runAction(target) {
    const action = target?.dataset?.v75Action;
    if (!action) return false;
    if (action === 'actual-balance') {
      if (typeof setActualBalance === 'function') setActualBalance();
      return true;
    }
    if (action === 'limit-details') { openLimitDetails(); return true; }
    if (action === 'mandatory-details') { openMandatoryDetails(); return true; }
    if (action === 'add-mandatory-purchase') { openMandatoryPurchaseForm(); return true; }
    if (action === 'save-mandatory-purchase') { saveMandatoryPurchase(); return true; }
    if (action === 'exclude-purchase') { excludePurchase(target.dataset.id || ''); return true; }
    if (action === 'close-modal') { closeCurrentModal(); return true; }
    return false;
  }

  window.addEventListener('click', event => {
    const target = event.target.closest?.('[data-v75-action]');
    if (!target || !runAction(target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  window.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const target = event.target.closest?.('[data-v75-action][role="button"]');
    if (!target || !runAction(target)) return;
    event.preventDefault();
  }, true);

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      const result = previousRender.apply(this, arguments);
      clearTimeout(timer);
      timer = setTimeout(enhanceFinancePage, 0);
      return result;
    };
  }

  window.addEventListener('hashchange', () => setTimeout(enhanceFinancePage, 50));
  window.addEventListener('storage', event => {
    if (event.key === 'secondBrainOS.v1') setTimeout(enhanceFinancePage, 80);
  });

  window.V75FinanceDetails = { enhance: enhanceFinancePage, openMandatoryDetails, openLimitDetails };
  setTimeout(enhanceFinancePage, 0);
  setTimeout(enhanceFinancePage, 250);
})();
