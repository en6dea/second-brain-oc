'use strict';

(() => {
  const V64_BUILD = 'second-brain-space-v64-personal-os-20260714-4';
  const V64_LABEL = 'V64 · PERSONAL OS';
  let lastModalFocus = null;
  let polishQueued = false;

  const list = key => Array.isArray(state?.[key]) ? state[key] : [];
  const isDone = item => ['готово', 'сделано', 'закрыт', 'закрыто', 'done'].includes(String(item?.status || '').trim().toLowerCase());
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  function v64TaskRow(task) {
    const overdue = task.date && task.date < today() && !isDone(task);
    const meta = [task.date ? fmt(task.date) : 'без даты', task.time || '', task.area || 'Без сферы'].filter(Boolean).join(' · ');
    return `<div class="v64-task-row ${overdue ? 'overdue' : ''}">
      <span class="v64-task-mark" aria-hidden="true">${overdue ? '!' : '✓'}</span>
      <div><b>${esc(task.title || 'Задача')}</b><small>${esc(meta)}</small></div>
      <button class="mini blue" data-action="editRecord" data-type="task" data-id="${esc(task.id)}">Открыть</button>
    </div>`;
  }

  function v64Dashboard() {
    const tasks = list('tasks').filter(item => !isDone(item));
    const todayList = tasks.filter(item => item.date === today());
    const overdue = tasks.filter(item => item.date && item.date < today());
    const focus = [...overdue, ...todayList]
      .filter((item, index, arr) => arr.findIndex(other => other.id === item.id) === index)
      .sort((a, b) => ({ A: 1, B: 2, C: 3, D: 4 }[a.priority] || 9) - ({ A: 1, B: 2, C: 3, D: 4 }[b.priority] || 9))[0];
    const shownTasks = [...overdue, ...todayList]
      .filter((item, index, arr) => arr.findIndex(other => other.id === item.id) === index)
      .slice(0, 4);
    const habits = list('habits');
    const habitsDone = habits.filter(item => item.marks?.[today()]).length;
    const habitPercent = habits.length ? Math.round(habitsDone / habits.length * 100) : 0;
    const goals = list('goals');
    const leadGoal = goals[0];
    const goalPercent = leadGoal?.target ? clamp(num(leadGoal.current) / Math.max(1, num(leadGoal.target)) * 100) : 0;
    const finance = financeTotals(periodInfo('month'));
    const forecast = finance.netWithUpcoming ?? finance.net ?? 0;
    const debts = activeDebts().filter(item => item.direction === 'out');
    const debtTotal = total(debts);
    const weekEnd = iso(addDays(new Date(), 7));
    const dueSoon = debts.filter(item => item.due && item.due <= weekEnd).length;
    const name = state.settings?.name || 'Алексей';
    const collections = [
      ['notes', 'Заметки', '📝', list('notes').length],
      ['ideas', 'Идеи', '💡', list('ideas').length],
      ['wishes', 'Желания', '💗', list('wishes').length],
      ['people', 'Люди', '👥', list('people').length],
      ['documents', 'Документы', '📄', list('documents').length],
      ['books', 'Книги', '📚', list('books').length],
      ['films', 'Фильмы', '🎬', list('films').length],
      ['trips', 'Путешествия', '✈️', list('trips').length]
    ];

    return layout(`${greeting()}, ${esc(name)}!`, 'Спокойный обзор дня: главное действие, деньги, цели и привычки без информационного шума.', `
      <section class="v64-command">
        <div class="v64-command-copy">
          <span class="v64-eyebrow">◆ Личная операционная система</span>
          <h2>${focus ? `Главное сейчас — ${esc(focus.title)}` : 'Начните с одного понятного шага'}</h2>
          <p>${focus ? `Система выбрала задачу по сроку и приоритету. Остальное можно не держать в голове.` : 'Зафиксируйте мысль, создайте первую задачу или соберите спокойный план дня.'}</p>
          <div class="v64-command-actions">
            <button class="primary" data-go="daily">Открыть план дня</button>
            <button data-action="openRecordForm" data-type="task">＋ Новая задача</button>
            <button data-go="command">Командный центр</button>
          </div>
        </div>
        <div class="v64-stats">
          <article class="v64-stat"><span>Сегодня</span><strong>${todayList.length}</strong><small>${overdue.length ? `${overdue.length} просрочено` : 'просрочек нет'}</small></article>
          <article class="v64-stat"><span>Привычки</span><strong>${habitsDone}/${habits.length}</strong><small>${habits.length ? 'отмечено сегодня' : 'добавьте первый ритм'}</small></article>
          <article class="v64-stat"><span>Прогноз месяца</span><strong>${money(forecast)}</strong><small>доходы − расходы − планы</small></article>
          <article class="v64-stat"><span>Обязательства</span><strong>${money(debtTotal)}</strong><small>${dueSoon} сроков в ближайшие 7 дней</small></article>
        </div>
      </section>

      <section class="v64-workspace">
        <article class="card capture v64-capture">
          <div class="card-head"><div><h3>Быстрый захват</h3><p class="small muted">Сначала зафиксируйте — разобрать можно позже.</p></div></div>
          <textarea id="quickText" aria-label="Быстрый захват" placeholder="Мысль, задача, идея или ссылка..."></textarea>
          <div class="v64-capture-actions">
            <button class="capture-btn" data-action="capture" data-type="task">✅<span>Задача</span></button>
            <button class="capture-btn" data-action="capture" data-type="note">📝<span>Заметка</span></button>
            <button class="capture-btn" data-action="capture" data-type="idea">💡<span>Идея</span></button>
            <button class="capture-btn" data-action="openRecordForm" data-type="operation">₽<span>Операция</span></button>
          </div>
        </article>
        <article class="card">
          <div class="card-head"><div><h3>Что требует внимания</h3><p class="small muted">Не больше четырёх пунктов на стартовом экране.</p></div><button class="mini blue" data-go="tasks">Все задачи</button></div>
          <div class="v64-task-list">${shownTasks.map(v64TaskRow).join('') || '<div class="empty">На сегодня нет обязательных задач. Можно выбрать один небольшой шаг.</div>'}</div>
        </article>
      </section>

      <section class="v64-pulse-grid">
        <article class="card v64-pulse-card">
          <div class="card-head"><div><h3>Финансовый пульс</h3><p class="small muted">Ориентир, а не обещание результата.</p></div><span class="pill ${forecast < 0 ? 'red' : 'green'}">месяц</span></div>
          <div class="v64-pulse-value ${forecast < 0 ? 'red' : 'green'}">${money(forecast)}</div>
          <div class="v64-pulse-meta">Доходы ${money(finance.inc)} · расходы ${money(finance.exp)} · покупки ${money(finance.planned)}</div>
          <div class="v64-card-actions"><button class="mini blue" data-go="finance">Открыть финансы</button><button class="mini" data-action="openRecordForm" data-type="operation">＋ Операция</button></div>
        </article>
        <article class="card v64-pulse-card">
          <div class="card-head"><div><h3>Ритм привычек</h3><p class="small muted">Регулярность важнее идеальной серии.</p></div><span class="pill blue">${habitPercent}%</span></div>
          <div class="v64-pulse-value">${habitsDone} из ${habits.length}</div>
          ${prog(habitPercent, 'green')}
          <div class="v64-pulse-meta">${habits.length ? 'Отметьте только то, что действительно сделали сегодня.' : 'Добавьте одну простую привычку, которую реально повторять.'}</div>
          <div class="v64-card-actions"><button class="mini blue" data-go="habits">Открыть привычки</button><button class="mini" data-action="openRecordForm" data-type="habit">＋ Привычка</button></div>
        </article>
        <article class="card v64-pulse-card">
          <div class="card-head"><div><h3>Главная цель</h3><p class="small muted">Цель должна превращаться в следующий шаг.</p></div><span class="pill violet">${goals.length}</span></div>
          <div class="v64-pulse-value">${leadGoal ? esc(leadGoal.title) : 'Цель ещё не выбрана'}</div>
          ${prog(goalPercent)}
          <div class="v64-pulse-meta">${leadGoal ? `${Math.round(goalPercent)}% · ${esc(leadGoal.note || 'задайте следующий шаг')}` : 'Сформулируйте результат, срок и одно действие на неделю.'}</div>
          <div class="v64-card-actions"><button class="mini blue" data-go="goals">Открыть цели</button><button class="mini" data-action="openRecordForm" data-type="goal">＋ Цель</button></div>
        </article>
      </section>

      <details class="card v64-library">
        <summary><div>Остальные разделы</div><span>Память, люди, желания и материалы</span></summary>
        <div class="v64-library-grid">${collections.map(([id, title, icon, count]) => `<button class="v64-library-tile" data-go="${id}"><span class="v64-library-icon">${icon}</span><span>${title}</span><small>${count}</small></button>`).join('')}</div>
      </details>
    `);
  }

  function v64FinancePage() {
    const period = periodInfo('month');
    const totals = financeTotals(period);
    const operations = list('operations')
      .slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 7);
    const outgoingDebts = activeDebts().filter(item => item.direction === 'out');
    const purchases = list('purchases').filter(item => item.includeInBudget !== false && item.date >= today() && item.date <= period.end);
    const currentBalance = num(state.settings?.currentBalance);
    const upcoming = totals.upcoming ?? total(purchases);
    const forecast = totals.netWithUpcoming ?? (currentBalance + totals.inc - totals.exp - upcoming);
    const hasFacts = list('operations').length > 0 || currentBalance !== 0 || outgoingDebts.length > 0 || purchases.length > 0;
    const operationRows = operations.map(operation => {
      const income = operation.type === 'income';
      return `<div class="v64-operation-row">
        <span class="v64-operation-icon ${income ? 'income' : 'expense'}" aria-hidden="true">${income ? '↗' : '↘'}</span>
        <div><b>${esc(operation.category || (income ? 'Доход' : 'Расход'))}</b><small>${esc(operation.note || 'без комментария')} · ${fmt(operation.date)}</small></div>
        <strong class="${income ? 'green' : 'red'}">${income ? '+' : '−'}${money(operation.amount)}</strong>
        <div class="v64-operation-tools"><button class="mini blue" data-action="editRecord" data-type="operation" data-id="${esc(operation.id)}">Изменить</button><button class="mini red" data-action="deleteRecord" data-type="operation" data-id="${esc(operation.id)}">Удалить</button></div>
      </div>`;
    }).join('');

    return layout('Финансы', 'Только факты: текущий остаток, движение денег и ближайшие обязательства.', `
      <section class="v64-finance-hero">
        <div>
          <span class="v64-eyebrow">₽ Финансовая ясность</span>
          <h2>${hasFacts ? (forecast < 0 ? 'Нужно скорректировать план месяца' : 'Финансовый план выглядит устойчиво') : 'Начните с фактического остатка'}</h2>
          <p>${hasFacts ? 'Прогноз рассчитан по внесённым операциям, покупкам и обязательствам. Он не заменяет банковскую выписку.' : 'Укажите, сколько денег доступно сейчас, затем добавляйте доходы и расходы. Система не будет додумывать цифры.'}</p>
          <div class="v64-command-actions">
            <button class="primary" data-action="setActualBalance">Указать остаток</button>
            <button data-action="openRecordForm" data-type="operation">＋ Операция</button>
            <button data-go="debts">Обязательства</button>
          </div>
        </div>
        <div class="v64-finance-forecast">
          <span>Прогноз до конца месяца</span>
          <strong class="${forecast < 0 ? 'negative' : ''}">${money(forecast)}</strong>
          <small>остаток + доходы − расходы − ближайшие покупки</small>
        </div>
      </section>

      <section class="v64-money-grid">
        <article class="card"><span>Доступно сейчас</span><strong>${money(currentBalance)}</strong><small>указанный вами остаток</small></article>
        <article class="card"><span>Доходы за месяц</span><strong class="green">${money(totals.inc)}</strong><small>${list('operations').filter(item => item.type === 'income' && inPeriod(item.date, period)).length} операций</small></article>
        <article class="card"><span>Расходы за месяц</span><strong class="red">${money(totals.exp)}</strong><small>${list('operations').filter(item => item.type === 'expense' && inPeriod(item.date, period)).length} операций</small></article>
        <article class="card"><span>Ближайшие планы</span><strong>${money(upcoming)}</strong><small>${purchases.length} покупок до конца месяца</small></article>
      </section>

      <section class="v64-finance-grid">
        <article class="card">
          <div class="card-head"><div><h3>Последние операции</h3><p class="small muted">Фактические записи без демонстрационных значений.</p></div><button class="mini blue" data-action="openRecordForm" data-type="operation">＋ Добавить</button></div>
          <div class="v64-operation-list">${operationRows || '<div class="empty">Операций пока нет. Добавьте первую запись о доходе или расходе.</div>'}</div>
        </article>
        <article class="card">
          <div class="card-head"><div><h3>Структура расходов</h3><p class="small muted">Категории текущего месяца.</p></div><span class="pill blue">${fmt(period.start)} — ${fmt(period.end)}</span></div>
          ${categoryBreakdown(period)}
          <div class="v64-finance-actions"><button class="mini" data-go="purchases">План покупок</button><button class="mini" data-go="debts">Долги</button></div>
        </article>
      </section>

      <details class="card v64-finance-import">
        <summary><div>Импорт банковской выписки</div><span>CSV · дубли будут пропущены</span></summary>
        <div class="v64-import-body"><input type="file" id="csvFile" accept=".csv,text/csv"><button class="btn" data-action="importBankCsv">Импортировать CSV</button><small>После импорта проверьте категории. Банковские файлы не следует хранить в публичном репозитории.</small></div>
      </details>
    `);
  }

  const baseSave = typeof save === 'function' ? save : null;
  if (baseSave) {
    save = function () {
      const result = baseSave.apply(this, arguments);
      if (!document.body.classList.contains('v65-premium') && !document.body.classList.contains('v66-safe-core') && !document.body.classList.contains('v67-cloud-safe')) {
        try { localStorage.setItem('secondBrainOS.currentBuild', V64_BUILD); } catch (error) {}
      }
      return result;
    };
  }

  const baseDeleteRecord = typeof deleteRecord === 'function' ? deleteRecord : null;
  if (baseDeleteRecord) {
    deleteRecord = function (element) {
      const schema = schemas?.[element?.dataset?.type];
      const record = schema ? list(schema.arr).find(item => String(item.id) === String(element.dataset.id)) : null;
      const title = record?.title || record?.name || record?.person || schema?.title || 'запись';
      if (!window.confirm(`Удалить «${title}»? Это действие нельзя отменить.`)) return;
      return baseDeleteRecord.apply(this, arguments);
    };
  }

  const baseSaveRecord = typeof saveRecord === 'function' ? saveRecord : null;
  if (baseSaveRecord) {
    saveRecord = function (element) {
      const type = element?.dataset?.type;
      const required = {
        task: ['title', 'название задачи'], operation: ['amount', 'сумму операции'], debt: ['person', 'человека или организацию'],
        purchase: ['title', 'название покупки'], wish: ['title', 'название желания'], note: ['title', 'заголовок заметки'],
        idea: ['title', 'название идеи'], person: ['name', 'имя'], habit: ['name', 'название привычки'], goal: ['title', 'название цели'],
        document: ['title', 'название документа'], book: ['title', 'название книги'], film: ['title', 'название фильма'],
        trip: ['title', 'название поездки'], personal: ['title', 'название записи'], archive: ['title', 'название записи']
      }[type];
      if (required) {
        const field = document.getElementById(`f_${required[0]}`);
        if (!String(field?.value || '').trim() || (required[0] === 'amount' && num(field.value) <= 0)) {
          toast(`Укажите ${required[1]}`);
          field?.focus();
          return;
        }
      }
      const amountField = document.getElementById('f_amount');
      if (amountField && num(amountField.value) < 0) {
        toast('Сумма не может быть отрицательной');
        amountField.focus();
        return;
      }
      const urlFields = ['url', 'image', 'photo', 'links'].map(key => document.getElementById(`f_${key}`)).filter(Boolean);
      const invalidUrl = urlFields.find(field => field.value.trim() && !(field.id.includes('image') || field.id.includes('photo') ? safeImageUrl(field.value) : safeUrl(field.value)));
      if (invalidUrl) {
        toast('Проверьте ссылку: используйте полный адрес https://…');
        invalidUrl.focus();
        return;
      }
      return baseSaveRecord.apply(this, arguments);
    };
  }

  const baseOpenModal = typeof openModal === 'function' ? openModal : null;
  if (baseOpenModal) {
    openModal = function (title, html) {
      lastModalFocus = document.activeElement;
      const result = baseOpenModal.apply(this, arguments);
      const modal = document.getElementById('modal');
      modal?.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => modal?.querySelector('input, textarea, select, button')?.focus());
      return result;
    };
  }

  const baseCloseModal = typeof closeModal === 'function' ? closeModal : null;
  if (baseCloseModal) {
    closeModal = function () {
      const result = baseCloseModal.apply(this, arguments);
      document.getElementById('modal')?.setAttribute('aria-hidden', 'true');
      if (lastModalFocus && document.contains(lastModalFocus)) lastModalFocus.focus();
      return result;
    };
  }

  dashboard = v64Dashboard;
  financePage = v64FinancePage;

  function setText(element, text) {
    if (element && element.textContent !== text) element.textContent = text;
  }

  function applyPolish() {
    document.documentElement.lang = 'ru';
    document.title = 'Second Brain OS — личная операционная система';
    const v67Active = document.body.classList.contains('v67-cloud-safe');
    const v66Active = document.body.classList.contains('v66-safe-core');
    const v65Active = document.body.classList.contains('v65-premium');
    if (!v67Active && !v66Active && !v65Active) {
      document.body.dataset.sbosBuild = V64_BUILD;
      document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', V64_BUILD);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#102044');
    }
    setText(document.querySelector('.v59-version,.version'), v67Active ? 'V67.7 · LIVING PERSONAL OS' : (v66Active ? 'V66 · SAFE PERSONAL OS' : (v65Active ? 'V65 · PREMIUM LIFE OS' : V64_LABEL)));
    setText(document.querySelector('.v59-sub'), 'личная операционная система');
    setText(document.querySelector('.v59-core-pill'), v67Active ? 'V67.7' : (v66Active ? 'V66' : (v65Active ? 'V65' : 'V64')));

    const v64View = document.querySelector('.v64-command,.v64-finance-hero')?.closest('#view');
    v64View?.querySelectorAll('.v63-injected').forEach(element => element.remove());

    const coachNav = document.querySelector('.v59-nav-item[data-go="coach"] .label');
    setText(coachNav, 'Помощник');
    document.querySelectorAll('.v59-ai-card h3,.v59-drawer h3').forEach(element => setText(element, 'Помощник дня'));

    const brand = document.querySelector('.v59-brand');
    if (brand && !brand.querySelector('.v64-nav-edit-button')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v64-nav-edit-button';
      button.dataset.v64Action = 'toggleNavEdit';
      button.textContent = '•••';
      button.setAttribute('aria-label', 'Настроить боковое меню');
      button.title = 'Настроить меню';
      brand.appendChild(button);
    }

    const editMode = document.body.classList.contains('sbos-nav-edit');
    document.querySelectorAll('.v59-nav-tools').forEach(tools => {
      tools.setAttribute('aria-hidden', String(!editMode));
      const label = tools.closest('.v59-nav-item')?.querySelector('.label')?.textContent?.trim() || 'раздел';
      const controls = tools.querySelectorAll('[data-action]');
      controls.forEach(control => {
        const rename = control.dataset.action === 'renameSection';
        control.setAttribute('role', 'button');
        control.tabIndex = editMode ? 0 : -1;
        control.setAttribute('aria-label', `${rename ? 'Переименовать' : 'Скрыть'} ${label}`);
        control.title = rename ? 'Переименовать' : 'Скрыть из меню';
      });
    });

    const modal = document.getElementById('modal');
    if (modal) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'modalTitle');
      modal.setAttribute('aria-hidden', String(!modal.classList.contains('show')));
    }

    const actionLabels = {
      openQuick: 'Создать запись', openProfileTools: 'Открыть настройки', closeModal: 'Закрыть окно',
      openAddFolder: 'Добавить раздел', exportData: 'Скачать резервную копию'
    };
    document.querySelectorAll('button').forEach(button => {
      const text = button.textContent.trim();
      const label = actionLabels[button.dataset.action] || (button.dataset.go === 'system' ? 'Открыть систему' : '') || (button.dataset.v59Action === 'coach' ? 'Открыть помощника' : '') || (button.dataset.v59Action === 'coachClose' ? 'Закрыть помощника' : '');
      if (label && (!text || /^[+＋×✦⚙.•••]+$/.test(text))) button.setAttribute('aria-label', label);
      if (!button.hasAttribute('type')) button.type = 'button';
    });
    document.querySelectorAll('input, textarea, select').forEach(field => {
      if (!field.labels?.length && !field.getAttribute('aria-label')) field.setAttribute('aria-label', field.getAttribute('placeholder') || field.id || 'Поле');
    });
    document.querySelectorAll('a[target="_blank"]').forEach(link => link.setAttribute('rel', 'noopener noreferrer'));
    document.querySelectorAll('img').forEach(image => { image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; });
  }

  function schedulePolish() {
    if (polishQueued) return;
    polishQueued = true;
    requestAnimationFrame(() => {
      polishQueued = false;
      applyPolish();
    });
  }

  window.addEventListener('click', event => {
    const action = event.target.closest?.('[data-v64-action]');
    if (action?.dataset.v64Action === 'toggleNavEdit') {
      event.preventDefault();
      document.body.classList.toggle('sbos-nav-edit');
      applyPolish();
      toast(document.body.classList.contains('sbos-nav-edit') ? 'Настройка меню включена' : 'Настройка меню завершена');
      return;
    }
    if (event.target === document.getElementById('modal')) closeModal();
  }, true);

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('modal')?.classList.contains('show')) closeModal();
    const control = event.target.closest?.('.v59-nav-tools [role="button"]');
    if (control && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      control.click();
    }
  }, true);

  const observer = new MutationObserver(schedulePolish);
  const app = document.getElementById('app');
  if (app) observer.observe(app, { childList: true, subtree: true });

  window.addEventListener('online', () => { document.body.classList.remove('is-offline'); });
  window.addEventListener('offline', () => { document.body.classList.add('is-offline'); toast('Нет сети — изменения сохраняются на устройстве'); });
  document.body.classList.toggle('is-offline', !navigator.onLine);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('[PWA]', error)));
  }

  applyPolish();
  try { render(); } catch (error) { console.error('[V64 render]', error); }
  [120, 500, 1500, 3000].forEach(delay => setTimeout(applyPolish, delay));
})();
