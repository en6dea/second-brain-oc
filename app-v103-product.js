/* Second Brain OS V103 — product-level visual and guidance pass. */
'use strict';
(() => {
  const METRICS = {
    'Доходы': {
      title: 'Доходы',
      short: 'Все операции выбранного периода, отмеченные как доход.',
      formula: 'Сумма доходных операций. Переводы между своими счетами и возвраты не включаются.'
    },
    'Доходы месяца': {
      title: 'Доходы месяца',
      short: 'Все доходные операции текущего месяца.',
      formula: 'Сумма операций типа «Доход» за текущий месяц.'
    },
    'Все расходы': {
      title: 'Все расходы',
      short: 'Реальные списания выбранного периода без внутренних переводов.',
      formula: 'Сумма операций типа «Расход». Переводы между своими счетами не считаются расходами.'
    },
    'Расходы месяца': {
      title: 'Расходы месяца',
      short: 'Реальные списания текущего месяца без внутренних переводов.',
      formula: 'Сумма операций типа «Расход» за текущий месяц.'
    },
    'Чистый поток': {
      title: 'Чистый поток',
      short: 'Сколько денег осталось после реальных расходов.',
      formula: 'Доходы − расходы. Положительное значение означает, что пришло больше, чем потрачено.'
    },
    'Нейтральные движения': {
      title: 'Нейтральные движения',
      short: 'Переводы между своими счетами, возвраты и корректировки.',
      formula: 'Эти операции меняют расположение денег, но не считаются доходом или расходом.'
    },
    'Норма сбережений': {
      title: 'Норма сбережений',
      short: 'Доля доходов, которая осталась после расходов.',
      formula: 'Чистый поток ÷ доходы × 100%. Отрицательное значение означает, что расходы выше доходов.'
    },
    'Обязательные расходы': {
      title: 'Обязательные расходы',
      short: 'Платежи, которые нельзя безопасно пропустить.',
      formula: 'Расходы с признаком «Обязательный»: жильё, долги, связь, необходимые услуги и другие назначенные категории.'
    },
    'Необязательные расходы': {
      title: 'Необязательные расходы',
      short: 'Траты, которые можно сократить, перенести или отменить.',
      formula: 'Расходы с признаком «Необязательный».'
    },
    'Общий лимит категорий': {
      title: 'Общий лимит категорий',
      short: 'Сумма настроенных месячных лимитов.',
      formula: 'Складываются только категории, у которых задан лимит. Категории без лимита в цифру не входят.'
    },
    'Лимиты текущего месяца': {
      title: 'Лимиты текущего месяца',
      short: 'Сумма лимитов расходов, настроенных на текущий месяц.',
      formula: 'Сумма активных лимитов расходных категорий.'
    }
  };

  const toneMap = {
    habits: 'violet', finance: 'green', debts: 'coral', information: 'blue',
    people: 'pink', notes: 'blue', wishes: 'pink', ideas: 'amber', personal: 'violet',
    polina: 'pink', documents: 'blue', books: 'amber', films: 'pink', trips: 'cyan',
    passwords: 'violet', inbox: 'blue'
  };

  let applying = false;
  let queued = false;

  function routeNow() {
    return (location.hash || '#today').replace(/^#/, '').split('?')[0] || 'today';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function normalizeLabel(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function habitTone(name) {
    const value = normalizeLabel(name).toLocaleLowerCase('ru-RU');
    if (/финанс|деньг|бюджет/.test(value)) return 'green';
    if (/англ|язык|обуч/.test(value)) return 'blue';
    if (/интервью|подсознан|дневник|благодар/.test(value)) return 'pink';
    if (/чтен|книг/.test(value)) return 'violet';
    if (/спорт|футбол|трениров/.test(value)) return 'coral';
    return 'violet';
  }

  function decorateIcons(root = document) {
    root.querySelectorAll?.('.v78-folder-card').forEach(card => {
      const route = card.dataset.v78Route || '';
      const icon = card.querySelector('.v78-folder-icon');
      if (icon) icon.dataset.v103Tone = toneMap[route] || 'violet';
    });
    root.querySelectorAll?.('.v78-info-folder').forEach(card => {
      const route = card.dataset.v78Route || '';
      const icon = card.querySelector(':scope > i');
      if (icon) icon.dataset.v103Tone = toneMap[route] || 'violet';
    });
    root.querySelectorAll?.('.v78-habit-chip,.v82-habit-card').forEach(card => {
      const name = card.querySelector('b')?.textContent || '';
      const icon = card.querySelector('.v78-habit-chip>i,.v82-habit-icon');
      if (icon) icon.dataset.v103Tone = habitTone(name);
    });
    root.querySelectorAll?.('.v78-operation-folder button').forEach((button, index) => {
      const icon = button.querySelector(':scope > i');
      if (icon) icon.dataset.v103Tone = ['blue','green','coral','violet'][index % 4];
    });
    root.querySelectorAll?.('.v78-finance-folder').forEach((button, index) => {
      const icon = button.querySelector(':scope > i');
      if (icon) icon.dataset.v103Tone = ['green','blue','violet','cyan','coral'][index % 5];
    });
  }

  function metricDefinition(article) {
    const label = normalizeLabel(article.querySelector('small')?.textContent);
    return METRICS[label] || null;
  }

  function showMetricHelp(definition, article) {
    const period = normalizeLabel(document.querySelector('[data-v78-category-period] option:checked')?.textContent || 'текущий период');
    const value = normalizeLabel(article.querySelector('b,strong')?.textContent || '—');
    const html = `<section class="v103-metric-modal"><p>${escapeHtml(definition.short)}</p><article><small>Текущее значение</small><b>${escapeHtml(value)}</b></article><article><small>Как считается</small><span>${escapeHtml(definition.formula)}</span></article><article><small>Период</small><span>${escapeHtml(period)}</span></article></section><div class="v79-modal-actions"><button type="button" data-v78-action="close-modal">Понятно</button></div>`;
    if (typeof window.openModal === 'function') window.openModal(definition.title, html);
    else alert(`${definition.title}\n\n${definition.short}\n\n${definition.formula}`);
  }

  function decorateFinanceMetrics(root = document) {
    root.querySelectorAll?.('.v867-analytics-kpis>article,.v78-kpi-row>article,.v867-finance-overview>article').forEach(article => {
      if (article.dataset.v103Metric === 'true') return;
      const definition = metricDefinition(article);
      if (!definition) return;
      article.dataset.v103Metric = 'true';
      article.classList.add('v103-explained-metric');
      article.tabIndex = 0;
      article.setAttribute('role', 'button');
      article.setAttribute('aria-label', `Пояснение: ${definition.title}`);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v103-metric-help';
      button.innerHTML = '<span>?</span> Что это';
      button.dataset.v103MetricHelp = 'true';
      button.setAttribute('aria-label', `Что означает «${definition.title}»`);
      button.dataset.v103Tone = 'violet';
      article.appendChild(button);
    });
  }

  function enhanceHabitProgress(root = document) {
    const hero = root.querySelector?.('.v869-habit-overview');
    if (!hero || hero.dataset.v103Enhanced === 'true') return;
    hero.dataset.v103Enhanced = 'true';
    const progressText = normalizeLabel(hero.querySelector('.v869-progress-inner b')?.textContent);
    const [done = 0, total = 0] = progressText.split('/').map(Number);
    const copy = hero.querySelector('.v869-habit-copy');
    if (!copy) return;
    const paragraph = copy.querySelector('p');
    if (paragraph && done === 0 && total > 0) paragraph.textContent = 'День ещё не начат — это не провал. Выберите самую короткую привычку и выполните минимальную версию.';
    if (!copy.querySelector('.v103-next-step')) {
      const next = document.createElement('div');
      next.className = 'v103-next-step';
      next.textContent = done >= total && total > 0 ? 'Ритм дня закреплён. Новые обязательства сегодня не нужны.' : 'Следующий шаг: откройте одну привычку и начните с пяти минут.';
      copy.appendChild(next);
    }
  }

  function enhanceSafeSpend(root = document) {
    const candidates = [...root.querySelectorAll?.('.v884-mini-finance,.v884-safe-card,.v78-finance-hero') || []];
    candidates.forEach(card => {
      if (card.dataset.v103Safe === 'true') return;
      const text = normalizeLabel(card.textContent);
      if (!/Можно потратить/.test(text)) return;
      card.dataset.v103Safe = 'true';
      const valueNode = [...card.querySelectorAll('b,strong')].find(node => /₽|Нет данных|0/.test(node.textContent));
      const isZero = /^\s*0(?:[\s,.]0+)?\s*₽?\s*$/.test(normalizeLabel(valueNode?.textContent)) || /Нет данных/.test(valueNode?.textContent || '');
      const explain = document.createElement('div');
      explain.className = 'v103-safe-spend-explain';
      explain.innerHTML = isZero
        ? '<b>Почему сейчас 0 ₽?</b><span>Сумма может быть нулевой из-за ближайших обязательств, резервов или неполных остатков по счетам. Откройте финансы и проверьте исходные данные — отсутствие данных больше не считается безопасным нулём.</span>'
        : '<b>Как считается?</b><span>Фактический баланс минус ближайшие обязательства, зарезервированные суммы и безопасный остаток.</span>';
      card.appendChild(explain);
    });
  }

  function movePlanningAssistant(root = document) {
    const page = root.querySelector?.('.v78-page');
    const assistant = page?.querySelector('.v869-plan-assistant,.v867-finance-assistant.v869-plan-assistant');
    const header = page?.querySelector(':scope > .v78-page-head');
    if (!assistant || !header || assistant.dataset.v103Moved === 'true') return;
    assistant.dataset.v103Moved = 'true';
    assistant.classList.add('v103-priority-assistant');
    header.insertAdjacentElement('afterend', assistant);
  }

  function tripCards(root = document) {
    if (routeNow() !== 'trips') return;
    root.querySelectorAll?.('.v79-record-card').forEach(card => {
      if (card.dataset.v103Trip === 'true') return;
      const edit = card.querySelector('[data-v79-action="edit-record"][data-type="trip"]');
      if (!edit) return;
      card.dataset.v103Trip = 'true';
      card.classList.add('v103-trip-card');
      const image = card.querySelector('.v80-record-image img');
      if (image) {
        image.addEventListener('error', () => addTripFallback(card, edit), {once:true});
        return;
      }
      addTripFallback(card, edit);
    });
  }

  function addTripFallback(card, edit) {
    if (card.querySelector('.v103-trip-fallback')) return;
    card.querySelector('.v80-record-image')?.remove();
    const title = normalizeLabel(card.querySelector('h2')?.textContent || 'Путешествие');
    const fallback = document.createElement('div');
    fallback.className = 'v103-trip-fallback';
    fallback.innerHTML = `<div><i data-v103-tone="cyan">✈</i><b>${escapeHtml(title)}</b><small>Обложка не найдена — запись и остальные данные сохранены.</small><button type="button">Добавить обложку</button></div>`;
    fallback.querySelector('button')?.addEventListener('click', event => { event.preventDefault(); edit.click(); });
    card.prepend(fallback);
  }

  function categoryAdvice(name, value, share) {
    const category = (window.state?.financeCategories || []).find(row => normalizeLabel(row.name).toLowerCase() === normalizeLabel(name).toLowerCase() && row.type === 'expense');
    const limit = Math.max(0, Number(category?.monthlyLimit || 0));
    if (limit && value > limit) return `Лимит превышен на ${formatMoney(value-limit)}. Сначала откройте операции этой категории и найдите переносимые траты.`;
    if (share >= 25) return `Категория занимает ${share}% расходов — это один из главных рычагов месяца. Проверьте три крупнейшие операции.`;
    if (category?.defaultExpenseClass === 'mandatory') return 'Категория отмечена как обязательная. Проверьте даты платежей и убедитесь, что сумма зарезервирована.';
    return 'Категория находится в нормальном диапазоне. Откройте операции, если хотите уточнить назначение или лимит.';
  }

  function formatMoney(value) {
    return `${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(value||0))} ₽`;
  }

  function financeCategoryChart(root = document) {
    if (routeNow() !== 'finance-analytics') return;
    const page = root.querySelector?.('.v78-page');
    if (!page || page.querySelector('.v103-category-dashboard')) return;
    const state = window.state || {};
    const ops = Array.isArray(state.operations) ? state.operations : [];
    const period = state.settings?.v78?.categoryPeriod || '';
    const rows = new Map();
    for (const item of ops) {
      const type = String(item?.type || '').toLowerCase();
      const date = String(item?.date || item?.createdAt || '').slice(0,7);
      if (!['expense','расход'].includes(type)) continue;
      if (period && date && date !== period) continue;
      const name = normalizeLabel(item.category) || 'Без категории';
      const amount = Math.abs(Number(item.amount || 0));
      rows.set(name, (rows.get(name) || 0) + amount);
    }
    const palette=['#7557e8','#2f7df4','#2dbf87','#ff7469','#f05ca8','#f4a62a','#27b9d6','#8b6de9'];
    const all=[...rows.entries()].sort((a,b)=>b[1]-a[1]);
    const data=all.slice(0,8);
    const total=all.reduce((sum,row)=>sum+row[1],0);
    let cursor=0;
    const parts=data.map(([,value],index)=>{const start=cursor;cursor+=total?value/total*100:0;return `${palette[index%palette.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;});
    if(cursor<100)parts.push(`#ecebf4 ${cursor.toFixed(2)}% 100%`);
    const donut=parts.length?`conic-gradient(${parts.join(',')})`:'conic-gradient(#ecebf4 0 100%)';
    const top=data[0];
    const topShare=top&&total?Math.round(top[1]/total*100):0;
    const section=document.createElement('section');
    section.className='v103-category-dashboard';
    section.innerHTML=`<header><div><h2>Расходы по категориям</h2><p>График показывает, куда ушли реальные деньги выбранного месяца. Переводы между своими счетами не включены.</p></div><span>${data.length} категорий</span></header>${data.length?`<div class="v103-category-viz"><div class="v103-category-donut" style="--v103-donut:${donut}"><span><b>${formatMoney(total)}</b><small>всего расходов</small></span></div><div class="v103-category-bars">${data.map(([name,value],index)=>{const share=total?Math.round(value/total*100):0;return `<button type="button" data-v103-category="${escapeHtml(name)}" data-v103-value="${value}" data-v103-share="${share}" style="--bar:${palette[index%palette.length]}"><i></i><span><b>${escapeHtml(name)}</b><small>${share}% расходов</small></span><strong>${formatMoney(value)}</strong><u><i style="width:${Math.max(3,share)}%"></i></u></button>`}).join('')}</div></div><div class="v103-category-ai"><i>✦</i><span>${top?`Главная категория месяца — «${escapeHtml(top[0])}» (${topShare}%). ${escapeHtml(categoryAdvice(top[0],top[1],topShare))}`:'Категории появятся после добавления расходов.'}</span></div>`:`<div class="v103-analysis-empty"><b>Для анализа пока недостаточно категоризированных расходов</b><span>Проверьте выбранный месяц. После появления расходов здесь будет график и AI-подсказка по каждой категории.</span><button type="button" data-v78-route="finance-operations">Открыть операции</button></div>`}`;
    const anchor=page.querySelector('.v867-analytics-kpis,.v78-kpi-row')||page.querySelector('.sbos-v93-context-assistant');
    anchor?.insertAdjacentElement('afterend',section);
  }

  function syncBrandOrbitPhase(root=document){
    const duration=14000;
    const delay=-(Math.round(performance.now())%duration);
    root.querySelectorAll?.('.v78-brand-orb').forEach(orb=>orb.style.setProperty('--v103-orbit-delay',`${delay}ms`));
  }

  function hideBuildBadge(root=document){
    root.querySelectorAll?.('.v78-build').forEach(node=>node.remove());
  }

  function setRouteState(){
    document.body.dataset.sbosRoute=routeNow();
  }

  function apply(root = document) {
    if (applying) return;
    applying = true;
    try {
      decorateIcons(root);
      decorateFinanceMetrics(root);
      enhanceHabitProgress(root);
      enhanceSafeSpend(root);
      movePlanningAssistant(root);
      tripCards(root);
      financeCategoryChart(root);
      syncBrandOrbitPhase(root);
      hideBuildBadge(root);
      setRouteState();
      document.documentElement.dataset.v103Ready = 'true';
    } catch (error) {
      console.error('[V103 product pass]', error);
    } finally {
      applying = false;
    }
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }

  document.addEventListener('click', event => {
    const help = event.target.closest?.('[data-v103-metric-help]');
    const article = help?.closest('article.v103-explained-metric') || event.target.closest?.('article.v103-explained-metric');
    if (article) {
      if (event.target.closest('a,button:not([data-v103-metric-help])')) return;
      const definition = metricDefinition(article);
      if (definition) {
        event.preventDefault();
        event.stopPropagation();
        showMetricHelp(definition, article);
      }
      return;
    }
    const category = event.target.closest?.('[data-v103-category]');
    if (category) {
      event.preventDefault();
      const name=category.dataset.v103Category||'Категория';
      const value=Number(category.dataset.v103Value||0);
      const share=Number(category.dataset.v103Share||0);
      const html=`<section class="v103-metric-modal"><p>${escapeHtml(categoryAdvice(name,value,share))}</p><article><small>Расходы категории</small><b>${formatMoney(value)}</b></article><article><small>Доля расходов</small><span>${share}% выбранного периода</span></article></section><div class="v79-modal-actions"><button class="v78-primary" type="button" data-v78-route="finance-operations">Открыть операции</button><button type="button" data-v78-action="close-modal">Закрыть</button></div>`;
      if(typeof window.openModal==='function')window.openModal(`AI-разбор · ${name}`,html);
      return;
    }
  }, true);

  document.addEventListener('keydown', event => {
    const article = event.target.closest?.('article.v103-explained-metric');
    if (article && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const definition = metricDefinition(article);
      if (definition) showMetricHelp(definition, article);
    }
  }, true);

  const observer = new MutationObserver(records => {
    if (records.some(record => record.addedNodes.length)) queueApply();
  });

  function boot() {
    apply();
    observer.observe(document.documentElement, {subtree:true,childList:true});
    setTimeout(apply,120);
    setTimeout(apply,500);
    window.addEventListener('hashchange', () => setTimeout(apply, 60));
    window.addEventListener('pageshow', () => setTimeout(apply, 80));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
