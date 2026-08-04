/* Second Brain OS V112 — Pair Random Month. */
'use strict';
(() => {
  const ROUTE = 'couple-random';
  const VERSION = 2;
  const MAX_MEDIA_BYTES = 2 * 1024 * 1024;
  const DRAW_REASONS = [
    'Противопоказано по здоровью',
    'Невозможно выполнить в нашем городе',
    'Невозможно выполнить в текущем месяце',
    'Стоимость выше установленного бюджета',
    'Невозможно достать нужное оборудование',
    'Задание уже выполнялось ранее',
    'Другая объективная причина'
  ];
  const TABS = [
    ['current','Текущий месяц'],
    ['history','Наша история'],
    ['ideas','Наши идеи'],
    ['categories','Категории'],
    ['settings','Настройки']
  ];
  const TONES = ['violet','pink','blue','cyan','mint','green','amber','orange','coral','magenta','indigo','slate'];
  const ICONS = ['heart','spark','palette','music','dance','film','camera','food','cake','sport','walk','plane','home','craft','tools','brain','language','theatre','smile','people','gift','leaf','star','code','style','museum','history','wallet','briefcase','trophy','bolt','season','confetti','cozy','link'];
  const ICON_PATHS = {
    heart:'M12 21S4 16.3 4 9.6A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8 3.6C20 16.3 12 21 12 21z',
    spark:'M12 3l2.2 5.1L20 10l-5.8 1.9L12 17l-2.2-5.1L4 10l5.8-1.9z',
    palette:'M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h3a6 6 0 0 0 0-10z',
    music:'M9 18V6l9-2v12M9 9l9-2M6.5 21A2.5 2.5 0 1 0 6.5 16a2.5 2.5 0 0 0 0 5zM15.5 19A2.5 2.5 0 1 0 15.5 14a2.5 2.5 0 0 0 0 5z',
    dance:'M12 4a2 2 0 1 0 0 .1M10 8l-3 5 4 2-2 5M14 8l3 4-3 3 2 5',
    film:'M4 5h16v14H4zM8 5v14M16 5v14M4 10h4M16 10h4M4 15h4M16 15h4',
    camera:'M4 7h4l2-3h4l2 3h4v13H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    food:'M7 3v8M4 3v5c0 2 1 3 3 3s3-1 3-3V3M7 11v10M16 3c3 3 3 8 0 11v7M16 3v11h3',
    cake:'M4 10h16v11H4zM3 10h18M8 10V6c0-2 2-2 2 0v4M14 10V5c0-2 2-2 2 0v5',
    sport:'M4 8h3l2 8h6l2-8h3M7 5v14M17 5v14',
    walk:'M12 4a2 2 0 1 0 0 .1M10 8l-2 5 3 2-2 6M14 8l3 4-3 3 2 6',
    plane:'M3 11l18-7-7 18-3.5-7.5zM10.5 14.5l4-4',
    home:'M3 11l9-8 9 8M5 10v11h14V10M9 21v-7h6v7',
    craft:'M5 19l5-5M8 6l10 10M15 5l4 4-9 9-5 1 1-5z',
    tools:'M14 6l4-4 4 4-4 4M4 20l10-10 4 4L8 24z',
    brain:'M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 3 5h2M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-3 5h-2M9 4v16M15 4v16M9 9h3M12 14h3',
    language:'M4 5h9v10H8l-4 4zM12 8h8v10h-4l-4 3',
    theatre:'M4 5c3-2 6-2 9 0v8c-2 4-7 4-9 0zM7 9h1M10 9h1M7 12c1 1 2 1 3 0M13 7c3-2 5-1 7 0v8c-1 3-4 4-7 2',
    smile:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 10h.01M16 10h.01M8 14c2 2 6 2 8 0',
    people:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 10a3 3 0 1 0 0-6M2 21c1-5 3-7 6-7s5 2 6 7M14 15c4-1 7 1 8 6',
    gift:'M4 9h16v12H4zM12 9v12M3 9h18v4H3zM12 9c-4 0-5-6-1-6 2 0 2 3 1 6zm0 0c4 0 5-6 1-6-2 0-2 3-1 6z',
    leaf:'M19 4C10 4 5 8 5 15c0 3 2 5 5 5 7 0 9-7 9-16zM5 20c2-5 6-8 11-11',
    star:'M12 3l2.8 5.7L21 9.6l-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z',
    code:'M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14',
    style:'M8 4l4 2 4-2 4 5-4 2v10H8V11L4 9z',
    museum:'M3 9l9-5 9 5M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16',
    history:'M12 3a9 9 0 1 1-8.5 6M3 3v6h6M12 7v6l4 2',
    wallet:'M4 6h14a2 2 0 0 1 2 2v10H4zM4 6l11-3v3M15 11h5v4h-5z',
    briefcase:'M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v2h4v-2',
    trophy:'M8 4h8v5c0 4-2 6-4 6s-4-2-4-6zM8 6H4v2c0 3 2 5 5 5M16 6h4v2c0 3-2 5-5 5M12 15v4M8 21h8',
    bolt:'M13 2L5 14h6l-1 8 9-13h-6z',
    season:'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4',
    confetti:'M4 20l4-10 6 6zM14 4l1 4M20 8l-4 2M16 16l4 1M8 4l2 3',
    cozy:'M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5z',
    link:'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1'
  };

  let renderQueued = false;
  let rawRender = null;
  let activeTab = 'current';
  let pendingDifficulty = 'random';
  let modalRoot = null;

  const esc = (value='') => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const clean = (value='') => String(value ?? '').trim();
  const num = value => { const parsed = Number(String(value ?? '').replace(/\s/g,'').replace(',','.')); return Number.isFinite(parsed) ? parsed : 0; };
  const uid = () => (crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);
  const nowIso = () => new Date().toISOString();
  const today = () => new Date().toISOString().slice(0,10);
  const monthKey = (value=today()) => String(value).slice(0,7);
  const money = value => `${num(value).toLocaleString('ru-RU',{maximumFractionDigits:2})} ₽`;
  const fmtDate = value => value ? new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}) : '—';
  const routeNow = () => decodeURIComponent((location.hash||'').replace(/^#/,'') || 'today');
  const stateNow = () => window.state && typeof window.state === 'object' ? window.state : null;
  const challengeDb = () => Array.isArray(window.SecondBrainCoupleChallenges) ? window.SecondBrainCoupleChallenges : [];
  const builtCategories = () => Array.isArray(window.SecondBrainCoupleChallengeCategories) ? window.SecondBrainCoupleChallengeCategories : [];
  const clone = value => JSON.parse(JSON.stringify(value));
  const randomItem = list => list[Math.floor((crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 : Math.random()) * list.length)];
  const plural = (n,a,b,c) => { const x=Math.abs(n)%100,y=x%10; return x>10&&x<20?c:y===1?a:y>=2&&y<=4?b:c; };

  function icon(name='heart',tone='violet',extra='') {
    return `<span class="v112-icon tone-${esc(tone)} ${esc(extra)}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${esc(ICON_PATHS[name]||ICON_PATHS.heart)}"/></svg></span>`;
  }

  function ensureStore() {
    const state = stateNow();
    if (!state) return null;
    const defaults = {
      version: VERSION,
      settings: {
        maxBudget: 10000,
        allowedDifficulties: ['easy','medium','hard'],
        preferredCategories: [],
        excludedCategories: [],
        physicalActivity: 'any',
        travelAllowed: true,
        homeOnly: false,
        modes: ['team','competition'],
        allowRare: true,
        allowElevatedBudget: false,
        replacementsAllowed: 2,
        animationDuration: 4,
        sounds: false,
        considerSeason: true,
        allowRepeats: false,
        ritualEnabled: true,
        ritualDay: 0,
        ritualTime: '18:00',
        weeklyCheckIn: true,
        gentleReminders: true,
        celebrations: true,
        jointConfirmation: true,
        minimumStep: true,
        rewards: true,
        activeTab: 'current'
      },
      categories: [],
      currentChallenge: null,
      pendingDraw: null,
      monthState: {key: monthKey(), replacementsUsed: 0},
      history: [],
      drawLog: [],
      customChallenges: [],
      rejectedChallenges: [],
      disabledChallenges: [],
      expenses: [],
      media: [],
      reflections: [],
      results: [],
      ritual: {},
      weeklyCheckIns: []
    };
    if (!state.coupleRandom || typeof state.coupleRandom !== 'object') state.coupleRandom = clone(defaults);
    const store = state.coupleRandom;
    store.version = VERSION;
    store.settings = Object.assign({},defaults.settings,store.settings||{});
    ['categories','history','drawLog','customChallenges','rejectedChallenges','disabledChallenges','expenses','media','reflections','results','weeklyCheckIns'].forEach(k=>{ if(!Array.isArray(store[k]))store[k]=[]; });
    store.ritual = store.ritual && typeof store.ritual === 'object' ? store.ritual : {};
    store.monthState = store.monthState && typeof store.monthState === 'object' ? store.monthState : {key:monthKey(),replacementsUsed:0};
    if (store.monthState.key !== monthKey()) store.monthState = {key:monthKey(),replacementsUsed:0};
    const existing = new Set(store.categories.map(c=>c.id));
    builtCategories().forEach(cat=>{ if(!existing.has(cat.id))store.categories.push(Object.assign({},cat,{archived:false,createdAt:nowIso(),updatedAt:nowIso()})); });
    store.categories.forEach(cat=>{ cat.active = cat.active !== false; cat.archived=Boolean(cat.archived); cat.custom=Boolean(cat.custom); cat.icon=cat.icon||'heart'; cat.tone=cat.tone||'violet'; });
    return store;
  }

  function persist(message='') {
    const store = ensureStore();
    if (store) store.updatedAt = nowIso();
    try { window.save?.(); } catch(error) { console.error('[V112 save]',error); }
    if (message) { try { window.toast?.(message); } catch(_) {} }
  }

  function logEvent(type,details={}) {
    const store=ensureStore(); if(!store)return;
    store.drawLog.unshift(Object.assign({id:uid(),type,monthKey:monthKey(),createdAt:nowIso()},clone(details)));
  }

  function categoryBy(id) { return ensureStore()?.categories.find(c=>c.id===id) || builtCategories().find(c=>c.id===id) || {id,title:id||'Без категории',icon:'heart',tone:'violet'}; }
  function challengeBy(id) { return challengeDb().find(c=>c.id===id) || ensureStore()?.customChallenges.find(c=>c.id===id); }
  function difficultyLabel(value) { return ({easy:'Простой',medium:'Средний',hard:'Сложный',random:'Полный рандом'})[value]||value; }
  function formatLabel(value) { return value==='competition'?'Соревновательный':'Командный'; }
  function eventLabel(value) { return ({draw_started:'Запуск рулетки',draw_result:'Выпало задание',challenge_accepted:'Челлендж принят',challenge_rejected:'Отказ от задания',challenge_auto_fixed:'Последний результат зафиксирован',challenge_completed:'Месяц завершён',weekly_checkin:'Еженедельный чек-ин',expense_added:'Добавлен расход',reflection_added:'Добавлен вывод',calendar_linked:'Этапы добавлены в календарь'})[value]||value; }

  function allChallenges() {
    const store=ensureStore();
    return challengeDb().concat(store.customChallenges.filter(x=>x.active!==false)).filter(Boolean);
  }

  function currentSeason() {
    const m=new Date().getMonth()+1;
    if([12,1,2].includes(m))return'winter'; if([3,4,5].includes(m))return'spring'; if([6,7,8].includes(m))return'summer'; return'autumn';
  }

  function filteredChallenges(difficulty=pendingDifficulty) {
    const store=ensureStore(); if(!store)return[];
    const s=store.settings, completedIds=new Set(store.history.map(h=>h.challengeId||h.id));
    const rejectedIds=new Set(store.rejectedChallenges.filter(r=>r.permanent!==false).map(r=>r.challengeId));
    const disabled=new Set(store.disabledChallenges);
    const activeCats=new Set(store.categories.filter(c=>c.active&&!c.archived&&!s.excludedCategories.includes(c.id)).map(c=>c.id));
    const allowedDifficulty = difficulty==='random' ? s.allowedDifficulties : [difficulty];
    return allChallenges().filter(ch=>{
      if(!ch.active||disabled.has(ch.id)||!activeCats.has(ch.category))return false;
      if(!allowedDifficulty.includes(ch.difficulty))return false;
      if(num(ch.budgetMax)>num(s.maxBudget)&&!s.allowElevatedBudget)return false;
      if(ch.rare&&!s.allowRare)return false;
      if(!s.allowRepeats&&!ch.repeatAllowed&&completedIds.has(ch.id))return false;
      if(rejectedIds.has(ch.id))return false;
      if(s.homeOnly&&(!Array.isArray(ch.location)||!ch.location.includes('home')))return false;
      if(!s.travelAllowed&&ch.location?.includes('travel'))return false;
      if(s.modes?.length&&!s.modes.includes(ch.format))return false;
      if(s.physicalActivity!=='any'&&ch.physicalActivity!==s.physicalActivity)return false;
      if(s.considerSeason&&Array.isArray(ch.season)&&!ch.season.includes('all')&&!ch.season.includes(currentSeason()))return false;
      return true;
    });
  }

  function pageHead() {
    return `<header class="v112-page-head"><div><button class="v78-back" data-cr-action="back-information" type="button">← Информация</button><span>ОДИН МЕСЯЦ — ОДИН ОБЩИЙ ОПЫТ</span><h1>Парный рандом месяца</h1><p>Алексей и Полина выбирают новый совместный челлендж, проходят его без давления и сохраняют результат в общей истории.</p></div><div class="v112-page-badge">${icon('heart','pink')}<span><b>${challengeDb().length.toLocaleString('ru-RU')}</b><small>идей в базе</small></span></div></header>`;
  }

  function tabNav() {
    return `<nav class="v112-tabs">${TABS.map(([id,label])=>`<button class="${activeTab===id?'active':''}" data-cr-action="tab" data-tab="${id}" type="button">${esc(label)}</button>`).join('')}</nav>`;
  }

  function renderPage() {
    const store=ensureStore();
    if(!store)return `<div class="v112-empty"><h2>Данные приложения ещё загружаются</h2><p>Подождите секунду и откройте раздел снова.</p></div>`;
    return `<section class="v78-page v112-page">${pageHead()}${tabNav()}${activeTab==='current'?currentTab(store):activeTab==='history'?historyTab(store):activeTab==='ideas'?ideasTab(store):activeTab==='categories'?categoriesTab(store):settingsTab(store)}</section>`;
  }

  function ritualCard(store) {
    const current=store.currentChallenge;
    const copy=current?'Главное не идеальный результат, а совместный опыт.':'Первый шаг — выбрать опыт, который подходит вашему реальному месяцу.';
    return `<article class="v112-ritual">${icon('spark','violet')}<div><small>МЯГКИЙ РИТУАЛ ПАРЫ</small><h2>Мы пробуем новое вместе</h2><p>${copy}</p></div><button data-cr-action="open-ritual" type="button">Настроить ритуал</button></article>`;
  }

  function currentTab(store) {
    if(store.currentChallenge && store.currentChallenge.monthKey===monthKey()) return `${ritualCard(store)}${activeChallenge(store,store.currentChallenge)}`;
    if(store.pendingDraw) return `${ritualCard(store)}${pendingCard(store,store.pendingDraw)}`;
    return `${ritualCard(store)}${wheelCard(store)}`;
  }

  function wheelCard(store) {
    const cats=store.categories.filter(c=>c.active&&!c.archived&&!store.settings.excludedCategories.includes(c.id));
    const available=filteredChallenges(pendingDifficulty);
    const sectors=cats.slice(0,12);
    const gradient=sectors.map((c,i)=>`${toneColor(c.tone)} ${i*(360/sectors.length)}deg ${(i+1)*(360/sectors.length)}deg`).join(',');
    return `<section class="v112-wheel-layout"><article class="v112-wheel-panel"><header><div><small>ТЕКУЩИЙ МЕСЯЦ · ${new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'}).toUpperCase()}</small><h2>Какой опыт выпадет вам?</h2><p>Результат определяется до анимации. Повторный выбор разрешён только по объективной причине.</p></div><span class="v112-replacements">Осталось замен: <b>${Math.max(0,store.settings.replacementsAllowed-store.monthState.replacementsUsed)} из ${store.settings.replacementsAllowed}</b></span></header><div class="v112-wheel-wrap"><div class="v112-pointer"></div><div class="v112-wheel" data-cr-wheel style="--wheel-gradient:conic-gradient(${gradient||'#8064e8 0 360deg'})"><div>${icon('heart','pink','large')}<b>Алексей<br>+ Полина</b><small>нажмите запуск</small></div></div><div class="v112-wheel-shadow"></div></div><div class="v112-difficulty"><span>Уровень сложности</span>${[['easy','Простой'],['medium','Средний'],['hard','Сложный'],['random','Полный рандом']].map(([value,label])=>`<button class="${pendingDifficulty===value?'active':''}" data-cr-action="difficulty" data-value="${value}" type="button">${label}</button>`).join('')}<button data-cr-action="random-difficulty" type="button">🎲 Выбрать случайно</button></div><button class="v112-launch" data-cr-action="draw" type="button" ${available.length?'':'disabled'}><span>Запустить парный рандом</span><small>${available.length?`${available.length} доступных вариантов`:'По текущим фильтрам нет вариантов'}</small></button></article><aside class="v112-month-guide"><article>${icon('link','blue')}<div><small>КАК ЭТО РАБОТАЕТ</small><h3>Один честный выбор</h3><p>Первый результат считается основным. На месяц доступно не более ${store.settings.replacementsAllowed} замен.</p></div></article><article>${icon('spark','mint')}<div><small>СРАЗУ ПОСЛЕ ВЫБОРА</small><h3>Минимальный первый шаг</h3><p>Приложение предложит действие на 5–15 минут, чтобы челлендж не остался красивой идеей.</p></div></article><article>${icon('memory','indigo')}<div><small>В КОНЦЕ МЕСЯЦА</small><h3>Выводы и воспоминание</h3><p>Сохраните фотографии, результаты и одну тёплую фразу месяца.</p></div></article></aside></section>`;
  }

  function toneColor(tone) { return ({violet:'#8568ea',pink:'#ef78ad',blue:'#4b8df4',cyan:'#53bfd4',mint:'#50c2a3',green:'#65bf7a',amber:'#efb64f',orange:'#f48d52',coral:'#f37b72',magenta:'#d86ec4',indigo:'#6f74e8',slate:'#8490a8'})[tone]||'#8568ea'; }

  function pendingCard(store,pending) {
    const ch=pending.challenge,cat=categoryBy(ch.category),left=Math.max(0,store.settings.replacementsAllowed-store.monthState.replacementsUsed);
    return `<section class="v112-result-card"><header><div>${icon(cat.icon,cat.tone,'large')}<span><small>РУЛЕТКА ОСТАНОВИЛАСЬ</small><h2>${esc(ch.title)}</h2><p>${esc(ch.description)}</p></span></div><div class="v112-result-meta"><b>${difficultyLabel(ch.difficulty)}</b><span>${formatLabel(ch.format)}</span><span>${money(ch.budgetMin)}–${money(ch.budgetMax)}</span><span>${esc(ch.duration)}</span></div></header><div class="v112-roles"><article class="alexey"><small>АЛЕКСЕЙ</small><h3>${esc(pending.alexeyRole)}</h3><p>Роль равнозначна по объёму и влияет на общий результат.</p></article><div class="v112-role-orbit">${icon('link','violet','large')}</div><article class="polina"><small>ПОЛИНА</small><h3>${esc(pending.polinaRole)}</h3><p>Можно скорректировать детали после принятия челленджа.</p></article></div><div class="v112-result-grid"><article><small>ЦЕЛЬ</small><p>${esc(ch.goal)}</p></article><article><small>ИТОГ МЕСЯЦА</small><p>${esc(ch.finalResult)}</p></article><article><small>ПОЧЕМУ ВАМ МОЖЕТ БЫТЬ ИНТЕРЕСНО</small><p>${esc(ch.whyInteresting||'Новый совместный навык и общее воспоминание.')}</p></article></div><footer><button class="v112-accept" data-cr-action="accept" type="button">Принимаем челлендж</button><button class="v112-reject" data-cr-action="open-reject" type="button" ${left<=0?'disabled':''}>Есть объективная причина отказаться</button><span>Осталось замен: <b>${left}</b></span></footer></section>`;
  }

  function activeChallenge(store,current) {
    const cat=categoryBy(current.category),stages=Array.isArray(current.stages)?current.stages:[],allItems=stages.flatMap(s=>s.items||[]),done=allItems.filter(i=>i.done).length,progress=allItems.length?Math.round(done/allItems.length*100):0;
    const expenses=store.expenses.filter(x=>x.currentId===current.currentId),spent=expenses.reduce((sum,x)=>sum+num(x.amount),0),budget=num(current.budgetLimit||current.budgetMax),media=store.media.filter(x=>x.currentId===current.currentId),refs=store.reflections.filter(x=>x.currentId===current.currentId);
    return `<section class="v112-active"><article class="v112-active-hero"><header><div>${icon(cat.icon,cat.tone,'large')}<span><small>ЧЕЛЛЕНДЖ ${new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'}).toUpperCase()}</small><h2>${esc(current.title)}</h2><p>${esc(current.description)}</p></span></div><button data-cr-action="open-details" type="button">Подробности</button></header><div class="v112-progress"><div><span style="width:${progress}%"></span></div><b>${progress}%</b><small>${done} из ${allItems.length} шагов</small></div><div class="v112-active-stats"><article><small>Бюджет</small><b>${money(budget)}</b><span>потрачено ${money(spent)}</span></article><article><small>Совместных сессий</small><b>${num(current.sessions)}</b><span>без обнуления после паузы</span></article><article><small>Материалов</small><b>${media.length}</b><span>фото, видео и ссылки</span></article><article><small>Выводов</small><b>${refs.length}</b><span>общих и личных</span></article></div><div class="v112-first-step"><div>${icon('bolt','amber')}<span><small>МИНИМАЛЬНЫЙ ШАГ</small><b>${esc(current.firstStep||'Выберите дату первой короткой практики')}</b><p>Достаточно 5–15 минут, чтобы начать без перегруза.</p></span></div><button data-cr-action="complete-first-step" type="button">${current.firstStepDone?'Готово ✓':'Сделать первый шаг'}</button></div></article><div class="v112-active-grid"><div><section class="v112-role-cards"><article class="alexey"><small>АЛЕКСЕЙ</small><h3>${esc(current.alexeyRole)}</h3><label>Личный прогресс <input type="range" min="0" max="100" value="${num(current.alexeyProgress)}" data-cr-change="personal-progress" data-person="alexey"><b>${num(current.alexeyProgress)}%</b></label></article><article class="polina"><small>ПОЛИНА</small><h3>${esc(current.polinaRole)}</h3><label>Личный прогресс <input type="range" min="0" max="100" value="${num(current.polinaProgress)}" data-cr-change="personal-progress" data-person="polina"><b>${num(current.polinaProgress)}%</b></label></article></section><section class="v112-plan"><header><div><small>ПЛАН НА МЕСЯЦ</small><h2>Четыре спокойных этапа</h2></div><button data-cr-action="calendar" type="button">Добавить в календарь</button></header>${stages.map((stage,index)=>`<article class="v112-stage"><header><span><small>НЕДЕЛЯ ${index+1}</small><h3>${esc(stage.title)}</h3></span><b>${stage.items?.filter(i=>i.done).length||0}/${stage.items?.length||0}</b></header><div>${(stage.items||[]).map(item=>`<button class="v112-check ${item.done?'done':''}" data-cr-action="toggle-step" data-stage="${esc(stage.id)}" data-item="${esc(item.id)}" type="button"><i>${item.done?'✓':''}</i><span>${esc(item.title)}</span></button>`).join('')}</div><button class="v112-add-small" data-cr-action="add-step" data-stage="${esc(stage.id)}" type="button">＋ Добавить шаг</button></article>`).join('')}</section></div><aside><section class="v112-side-card"><header><div><small>БЮДЖЕТ</small><h2>${money(spent)} из ${money(budget)}</h2></div><button data-cr-action="add-expense" type="button">＋ Расход</button></header><div class="v112-budget-bar"><span style="width:${Math.min(100,budget?spent/budget*100:0)}%"></span></div><p>${budget-spent>=0?`Осталось ${money(budget-spent)}`:`Превышение ${money(spent-budget)} — обсудите, нужно ли продолжать расходы.`}</p>${expenses.slice(0,5).map(x=>`<article class="v112-expense"><span><b>${esc(x.title)}</b><small>${esc(x.paidBy==='polina'?'Полина':'Алексей')} · ${fmtDate(x.date)}</small></span><strong>${money(x.amount)}</strong></article>`).join('')||'<div class="v112-mini-empty">Расходов пока нет.</div>'}</section><section class="v112-side-card"><header><div><small>ВЫВОДЫ И РЕЗУЛЬТАТЫ</small><h2>Что вы заметили?</h2></div><button data-cr-action="add-reflection" type="button">＋ Вывод</button></header>${refs.slice(0,4).map(x=>`<article class="v112-reflection"><small>${x.author==='polina'?'ПОЛИНА':x.author==='alexey'?'АЛЕКСЕЙ':'ОБЩИЙ ВЫВОД'}</small><p>${esc(x.best||x.note||'')}</p></article>`).join('')||'<div class="v112-mini-empty">Оставьте хотя бы один короткий вывод за месяц.</div>'}<button class="v112-media-button" data-cr-action="media" type="button">Прикрепить фото, видео или файл</button><input data-cr-media-input type="file" multiple hidden accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"></section><section class="v112-side-card v112-finish"><small>ИТОГ МЕСЯЦА</small><h2>Главное — совместный опыт</h2><p>Завершить можно и в упрощённом формате: честно записать вывод и сохранить то, что получилось.</p><button data-cr-action="finish" type="button">Завершить месяц</button></section></aside></div></section>`;
  }

  function historyTab(store) {
    const items=store.history.slice().sort((a,b)=>String(b.completedAt||'').localeCompare(String(a.completedAt||'')));
    const log=store.drawLog.slice(0,80);
    return `<section class="v112-history"><header><div><small>НАША ИСТОРИЯ</small><h2>${items.length?`${items.length} ${plural(items.length,'завершённый месяц','завершённых месяца','завершённых месяцев')}`:'Первый месяц ещё впереди'}</h2><p>Здесь остаются итоговые фотографии, расходы, оценки, выводы и навыки.</p></div></header><div class="v112-history-grid">${items.map(item=>historyCard(item)).join('')||`<div class="v112-empty"><h3>Здесь появятся ваши завершённые парные челленджи</h3><p>Первый месяц ещё впереди!</p><button data-cr-action="tab" data-tab="current" type="button">Открыть текущий месяц</button></div>`}</div><section class="v112-draw-archive"><header><div><small>АРХИВ РОЗЫГРЫШЕЙ</small><h2>Все запуски, замены и решения</h2><p>История не перезаписывается: каждое действие сохраняется отдельным событием.</p></div><b>${store.drawLog.length}</b></header><div>${log.map(e=>`<article><i class="tone-${esc(categoryBy(e.category||'').tone)}"></i><span><small>${fmtDate(e.createdAt)} · ${new Date(e.createdAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small><b>${esc(eventLabel(e.type))}</b><p>${esc(e.title||e.reason||e.comment||'')}</p></span></article>`).join('')||'<div class="v112-mini-empty">Рулетка ещё не запускалась.</div>'}</div></section></section>`;
  }

  function historyCard(item) {
    const cat=categoryBy(item.category),cover=item.coverDataUrl||item.media?.find(x=>x.type?.startsWith('image/'))?.dataUrl;
    return `<article class="v112-history-card">${cover?`<img src="${esc(cover)}" alt="">`:`<div class="v112-history-cover">${icon(cat.icon,cat.tone,'large')}</div>`}<div><small>${esc(item.monthLabel||item.monthKey)}</small><h3>${esc(item.title)}</h3><p>${esc(item.memoryPhrase||item.whatWorked||'Совместный опыт сохранён.')}</p><section><span>${difficultyLabel(item.difficulty)}</span><span>${money(item.totalExpenses||0)}</span><span>★ ${num(item.rating||0)}/10</span></section><button data-cr-action="history-details" data-id="${esc(item.historyId)}" type="button">Открыть историю</button></div></article>`;
  }

  function ideasTab(store) {
    const custom=store.customChallenges.slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
    return `<section class="v112-ideas"><header><div><small>НАШИ ИДЕИ</small><h2>Собственные задания</h2><p>Добавляйте то, что давно хотели попробовать вместе. Пользовательские задания участвуют в общей рулетке.</p></div><button class="v112-primary" data-cr-action="add-custom" type="button">＋ Добавить своё задание</button></header><div class="v112-custom-grid">${custom.map(ch=>customCard(ch)).join('')||`<div class="v112-empty"><h3>Добавьте занятие, которое однажды хотели попробовать вместе</h3><p>Категория, бюджет и роли можно заполнить за минуту.</p><button data-cr-action="add-custom" type="button">Добавить первую идею</button></div>`}</div></section>`;
  }

  function customCard(ch) {
    const cat=categoryBy(ch.category);
    return `<article class="v112-custom-card ${ch.active===false?'disabled':''}"><header>${icon(cat.icon,cat.tone)}<span><small>${esc(cat.title)} · ${difficultyLabel(ch.difficulty)}</small><h3>${esc(ch.title)}</h3></span></header><p>${esc(ch.description||'Без описания')}</p><section><span>${money(ch.budgetMin)}–${money(ch.budgetMax)}</span><span>${formatLabel(ch.format)}</span><span>${esc(ch.duration||'месяц')}</span></section><footer><button data-cr-action="edit-custom" data-id="${esc(ch.id)}" type="button">Изменить</button><button data-cr-action="toggle-custom" data-id="${esc(ch.id)}" type="button">${ch.active===false?'Включить':'Отключить'}</button><button class="danger" data-cr-action="delete-custom" data-id="${esc(ch.id)}" type="button">Удалить</button></footer></article>`;
  }

  function categoriesTab(store) {
    const cats=store.categories.slice().sort((a,b)=>Number(b.custom)-Number(a.custom)||String(a.title).localeCompare(String(b.title),'ru'));
    return `<section class="v112-categories"><header><div><small>КАТЕГОРИИ РУЛЕТКИ</small><h2>Встроенные и собственные категории</h2><p>Своя категория сразу появляется в форме задания, фильтрах, рулетке, истории и аналитике.</p></div><button class="v112-primary" data-cr-action="add-category" type="button">＋ Добавить категорию</button></header><div class="v112-category-grid">${cats.map(cat=>`<article class="${cat.archived?'archived':''}">${icon(cat.icon,cat.tone)}<span><small>${cat.custom?'СВОЯ КАТЕГОРИЯ':'ВСТРОЕННАЯ'}</small><h3>${esc(cat.title)}</h3><p>${esc(cat.description||'Участвует в умном выборе заданий.')}</p></span><label class="v112-switch"><input type="checkbox" data-cr-change="category-active" data-id="${esc(cat.id)}" ${cat.active&&!cat.archived?'checked':''}><i></i></label><footer><button data-cr-action="edit-category" data-id="${esc(cat.id)}" type="button">Изменить</button>${cat.custom?`<button data-cr-action="archive-category" data-id="${esc(cat.id)}" type="button">${cat.archived?'Восстановить':'В архив'}</button>`:''}</footer></article>`).join('')}</div></section>`;
  }

  function settingsTab(store) {
    const s=store.settings;
    const checkbox=(key,label,text,checkedValue=s[key])=>`<label class="v112-setting"><input type="checkbox" data-cr-setting="${key}" ${checkedValue?'checked':''}><span><b>${label}</b><small>${text}</small></span></label>`;
    return `<section class="v112-settings"><header><div><small>НАСТРОЙКИ РАНДОМА</small><h2>Реалистичный выбор под ваш месяц</h2><p>Фильтры уменьшают риск получить задание, которое невозможно выполнить.</p></div></header><div class="v112-settings-grid"><article><h3>Ограничения</h3><label><span>Максимальный бюджет</span><input type="number" min="0" step="500" value="${num(s.maxBudget)}" data-cr-setting-number="maxBudget"></label><label><span>Длительность анимации</span><select data-cr-setting-value="animationDuration"><option value="3" ${s.animationDuration==3?'selected':''}>3 секунды</option><option value="4" ${s.animationDuration==4?'selected':''}>4 секунды</option><option value="5" ${s.animationDuration==5?'selected':''}>5 секунд</option></select></label><label><span>Допустимых замен</span><select data-cr-setting-value="replacementsAllowed"><option value="0" ${s.replacementsAllowed==0?'selected':''}>Без замен</option><option value="1" ${s.replacementsAllowed==1?'selected':''}>1 замена</option><option value="2" ${s.replacementsAllowed==2?'selected':''}>2 замены</option></select></label>${checkbox('travelAllowed','Разрешить поездки','В выбор могут попасть задания вне дома')}${checkbox('homeOnly','Только домашние задания','Оставить варианты, которые можно выполнить дома')}${checkbox('allowRare','Разрешить редкие задания','Безумные варианты не чаще 3–5%')}${checkbox('allowRepeats','Разрешить повторы','Выполненное задание снова участвует в выборе')}</article><article><h3>Психологическая поддержка</h3>${checkbox('ritualEnabled','Ежемесячный ритуал','Спокойное напоминание выбрать опыт месяца')}${checkbox('weeklyCheckIn','Еженедельный чек-ин','Три вопроса, заполнение меньше минуты')}${checkbox('gentleReminders','Мягкие напоминания','Без давления, красных серий и чувства вины')}${checkbox('minimumStep','Минимальный первый шаг','Сразу предложить действие на 5–15 минут')}${checkbox('jointConfirmation','Совместное подтверждение','Оба выбирают реалистичный вклад')}${checkbox('celebrations','Праздновать этапы','Небольшие анимации и предложение сохранить момент')}${checkbox('rewards','Маленькая награда','Ужин, прогулка или другой приятный вариант')}</article><article><h3>Режимы и сложность</h3><div class="v112-choice-list">${[['easy','Простой'],['medium','Средний'],['hard','Сложный']].map(([v,l])=>`<label><input type="checkbox" data-cr-array-setting="allowedDifficulties" value="${v}" ${s.allowedDifficulties.includes(v)?'checked':''}><span>${l}</span></label>`).join('')}</div><div class="v112-choice-list">${[['team','Командный'],['competition','Соревновательный']].map(([v,l])=>`<label><input type="checkbox" data-cr-array-setting="modes" value="${v}" ${s.modes.includes(v)?'checked':''}><span>${l}</span></label>`).join('')}</div>${checkbox('considerSeason','Учитывать сезон','Не предлагать сезонно неподходящие варианты')}${checkbox('sounds','Звуки рулетки','Звуки включаются только после разрешения')}</article><article><h3>День парного рандома</h3><label><span>День недели</span><select data-cr-setting-value="ritualDay">${['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'].map((d,i)=>`<option value="${i}" ${s.ritualDay==i?'selected':''}>${d}</option>`).join('')}</select></label><label><span>Время</span><input type="time" value="${esc(s.ritualTime)}" data-cr-setting-value="ritualTime"></label><div class="v112-identity"><b>«Мы пробуем новое вместе»</b><p>Модуль не использует формулировки «вы сорвали челлендж» или «серия потеряна».</p></div></article></div></section>`;
  }

  function openModal(title,body,wide=false) {
    ensureModal();
    modalRoot.className=`v112-modal-root show ${wide?'wide':''}`;
    modalRoot.innerHTML=`<div class="v112-modal-backdrop" data-cr-action="close-modal"></div><section class="v112-modal"><header><h2>${esc(title)}</h2><button data-cr-action="close-modal" type="button">×</button></header><div>${body}</div></section>`;
    document.body.classList.add('v112-modal-open');
  }
  function closeModal(){ if(modalRoot){modalRoot.className='v112-modal-root';modalRoot.innerHTML='';}document.body.classList.remove('v112-modal-open'); }
  function ensureModal(){ if(!modalRoot){modalRoot=document.createElement('div');modalRoot.className='v112-modal-root';modalRoot.id='v112-modal-root';document.body.appendChild(modalRoot);} }
  const field=(label,id,value='',type='text',extra='')=>`<label class="v112-field"><span>${esc(label)}</span>${type==='textarea'?`<textarea id="${id}" ${extra}>${esc(value)}</textarea>`:`<input id="${id}" type="${type}" value="${esc(value)}" ${extra}>`}</label>`;
  const value=id=>document.getElementById(id)?.value?.trim()||'';
  const checked=id=>Boolean(document.getElementById(id)?.checked);

  function startDraw() {
    const store=ensureStore(); if(!store||store.currentChallenge)return;
    const pool=filteredChallenges(pendingDifficulty);
    if(!pool.length){window.toast?.('По выбранным условиям не осталось заданий');return;}
    const chosen=clone(randomItem(pool));
    const swap=Math.random()>.5;
    const pending={id:uid(),challenge:chosen,alexeyRole:swap?chosen.polinaRole:chosen.alexeyRole,polinaRole:swap?chosen.alexeyRole:chosen.polinaRole,selectedAt:nowIso(),difficulty:pendingDifficulty};
    logEvent('draw_started',{difficulty:pendingDifficulty,available:pool.length,settingsSnapshot:clone(store.settings)});
    const wheel=document.querySelector('[data-cr-wheel]');
    if(!wheel){store.pendingDraw=pending;persist();renderModule();return;}
    const duration=Math.max(3,Math.min(5,num(store.settings.animationDuration)||4));
    wheel.style.setProperty('--spin-duration',`${duration}s`);
    wheel.style.setProperty('--spin-to',`${1440+Math.floor(Math.random()*720)}deg`);
    wheel.classList.add('spinning');
    document.querySelector('[data-cr-action="draw"]')?.setAttribute('disabled','disabled');
    setTimeout(()=>{
      store.pendingDraw=pending;
      logEvent('draw_result',{challengeId:chosen.id,title:chosen.title,category:chosen.category,difficulty:chosen.difficulty,budgetMax:chosen.budgetMax,roles:{alexey:pending.alexeyRole,polina:pending.polinaRole}});
      if(store.monthState.replacementsUsed>=store.settings.replacementsAllowed){acceptPending(true);return;}
      persist();renderModule();
    },duration*1000+120);
  }

  function acceptPending(auto=false) {
    const store=ensureStore(),pending=store?.pendingDraw;if(!pending)return;
    const ch=pending.challenge;
    const stages=[
      ['Знакомство и подготовка',['Изучить основы','Определить формат и даты','Подготовить материалы','Подтвердить роли']],
      ['Первая практика',['Выполнить первые упражнения','Отметить сложности','Сохранить первый промежуточный результат']],
      ['Улучшение результата',['Продолжить практику','Исправить ошибки','Выполнить основную часть задания']],
      ['Финальный результат',['Закончить работу','Подготовить демонстрацию','Сравнить результаты','Сохранить фото, видео и выводы']]
    ].map(([title,items],i)=>({id:uid(),title,week:i+1,items:items.map(title=>({id:uid(),title,done:false,createdAt:nowIso()}))}));
    store.currentChallenge=Object.assign({},ch,{currentId:uid(),challengeId:ch.id,monthKey:monthKey(),acceptedAt:nowIso(),startDate:today(),finalDate:lastDayOfMonth(),alexeyRole:pending.alexeyRole,polinaRole:pending.polinaRole,alexeyProgress:0,polinaProgress:0,sessions:0,firstStep:'Выбрать дату первой 15-минутной практики',firstStepDone:false,stages,budgetLimit:Math.min(num(store.settings.maxBudget),num(ch.budgetMax)||num(store.settings.maxBudget)),links:{tasks:[],notes:[],finance:[],memory:[]}});
    store.pendingDraw=null;
    logEvent(auto?'challenge_auto_fixed':'challenge_accepted',{challengeId:ch.id,title:ch.title,category:ch.category,difficulty:ch.difficulty,autoFixed:auto});
    persist(auto?'Последний результат автоматически зафиксирован':'Челлендж принят');
    renderModule();
    if(store.settings.celebrations)confetti();
  }
  function lastDayOfMonth(){const d=new Date();return new Date(d.getFullYear(),d.getMonth()+1,0,12).toISOString().slice(0,10);}

  function openReject() {
    const store=ensureStore(); if(!store?.pendingDraw)return;
    openModal('Объективная причина отказа',`<div class="v112-form"><p class="v112-form-note">Замена нужна только тогда, когда задание реально невозможно выполнить. История отказа сохранится в архиве.</p><label class="v112-field"><span>Причина</span><select id="cr_reject_reason"><option value="">Выберите причину</option>${DRAW_REASONS.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label>${field('Короткий комментарий','cr_reject_comment','','textarea','rows="4"')}<div class="v112-modal-actions"><button class="v112-primary" data-cr-action="reject" type="button">Подтвердить замену</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`);
  }
  function rejectPending() {
    const store=ensureStore(),pending=store?.pendingDraw,reason=value('cr_reject_reason'),comment=value('cr_reject_comment');
    if(!pending||!reason)return window.toast?.('Выберите причину отказа');
    if(!comment)return window.toast?.('Добавьте короткий комментарий');
    store.monthState.replacementsUsed+=1;
    store.rejectedChallenges.unshift({id:uid(),challengeId:pending.challenge.id,reason,comment,monthKey:monthKey(),permanent:reason==='Задание уже выполнялось ранее',createdAt:nowIso()});
    logEvent('challenge_rejected',{challengeId:pending.challenge.id,title:pending.challenge.title,category:pending.challenge.category,reason,comment,replacementNumber:store.monthState.replacementsUsed});
    store.pendingDraw=null;
    closeModal();persist('Причина сохранена. Можно запустить следующую попытку');renderModule();
  }

  function toggleStep(stageId,itemId) {
    const current=ensureStore()?.currentChallenge;if(!current)return;
    const stage=current.stages.find(x=>x.id===stageId),item=stage?.items.find(x=>x.id===itemId);if(!item)return;
    item.done=!item.done;item.updatedAt=nowIso();if(item.done)current.sessions=num(current.sessions)+1;persist();renderModule();
  }
  function addStep(stageId) {
    openModal('Добавить шаг',`<div class="v112-form">${field('Что нужно сделать','cr_step_title')}<div class="v112-modal-actions"><button class="v112-primary" data-cr-action="save-step" data-stage="${esc(stageId)}" type="button">Добавить</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`);
  }
  function saveStep(stageId) { const title=value('cr_step_title'),current=ensureStore()?.currentChallenge,stage=current?.stages.find(x=>x.id===stageId);if(!title||!stage)return;stage.items.push({id:uid(),title,done:false,createdAt:nowIso()});closeModal();persist('Шаг добавлен');renderModule(); }

  function openExpense() {
    openModal('Добавить расход',`<div class="v112-form v112-two-col">${field('Название','cr_expense_title')}${field('Сумма','cr_expense_amount','','number','min="0" step="1"')}<label class="v112-field"><span>Категория</span><select id="cr_expense_category"><option>Материалы</option><option>Занятие</option><option>Транспорт</option><option>Еда</option><option>Другое</option></select></label><label class="v112-field"><span>Кто оплатил</span><select id="cr_expense_paid"><option value="alexey">Алексей</option><option value="polina">Полина</option></select></label>${field('Дата','cr_expense_date',today(),'date')}<label class="v112-field"><span>Характер расхода</span><select id="cr_expense_required"><option value="required">Обязательный</option><option value="optional">Необязательный</option></select></label>${field('Ссылка на товар','cr_expense_url','','url')}${field('Комментарий','cr_expense_comment','','textarea','rows="3"')}<label class="v112-setting full"><input id="cr_expense_finance" type="checkbox"><span><b>Добавить в финансовые операции</b><small>Создаст отдельный расход и сохранит связь с челленджем.</small></span></label><div class="v112-modal-actions full"><button class="v112-primary" data-cr-action="save-expense" type="button">Сохранить расход</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`);
  }
  function saveExpense() {
    const store=ensureStore(),current=store?.currentChallenge,title=value('cr_expense_title'),amount=num(value('cr_expense_amount'));if(!current||!title||amount<=0)return window.toast?.('Укажите название и сумму');
    const expense={id:uid(),currentId:current.currentId,title,amount,category:value('cr_expense_category'),paidBy:value('cr_expense_paid'),date:value('cr_expense_date')||today(),required:value('cr_expense_required')==='required',url:value('cr_expense_url'),comment:value('cr_expense_comment'),createdAt:nowIso()};store.expenses.unshift(expense);
    if(checked('cr_expense_finance')){window.state.operations=Array.isArray(window.state.operations)?window.state.operations:[];const op={id:uid(),type:'expense',amount,date:expense.date,category:'Парный рандом',note:`${title} · ${current.title}`,coupleRandomExpenseId:expense.id,createdAt:nowIso()};window.state.operations.unshift(op);current.links.finance.push(op.id);}
    logEvent('expense_added',{challengeId:current.challengeId,title,amount,paidBy:expense.paidBy});closeModal();persist('Расход сохранён');renderModule();
  }

  function openReflection() {
    openModal('Что заметили на этой неделе?',`<div class="v112-form"><label class="v112-field"><span>Автор</span><select id="cr_ref_author"><option value="together">Общий вывод</option><option value="alexey">Алексей</option><option value="polina">Полина</option></select></label>${field('Что получилось лучше всего?','cr_ref_best','','textarea','rows="3"')}${field('Что мешало?','cr_ref_block','','textarea','rows="3"')}${field('Какой один шаг сделаем дальше?','cr_ref_next','','textarea','rows="3"')}${field('Дополнительная заметка','cr_ref_note','','textarea','rows="3"')}<div class="v112-modal-actions"><button class="v112-primary" data-cr-action="save-reflection" type="button">Сохранить вывод</button><button data-cr-action="close-modal" type="button">Позже</button></div></div>`);
  }
  function saveReflection() {
    const store=ensureStore(),current=store?.currentChallenge;if(!current)return;
    const item={id:uid(),currentId:current.currentId,author:value('cr_ref_author'),best:value('cr_ref_best'),block:value('cr_ref_block'),next:value('cr_ref_next'),note:value('cr_ref_note'),createdAt:nowIso()};
    if(!item.best&&!item.block&&!item.next&&!item.note)return window.toast?.('Добавьте хотя бы один короткий вывод');
    store.reflections.unshift(item);store.weeklyCheckIns.unshift(Object.assign({},item,{week:weekOfMonth()}));logEvent('reflection_added',{challengeId:current.challengeId,title:item.best||item.next||item.note,author:item.author});closeModal();persist('Вывод сохранён');renderModule();
  }
  function weekOfMonth(){return Math.min(4,Math.max(1,Math.ceil(new Date().getDate()/7)));}

  async function saveMedia(files) {
    const store=ensureStore(),current=store?.currentChallenge;if(!current||!files?.length)return;
    for(const file of Array.from(files)){
      if(file.size>MAX_MEDIA_BYTES){window.toast?.(`Файл «${file.name}» больше 2 МБ и не добавлен`);continue;}
      const dataUrl=await fileToDataUrl(file);store.media.unshift({id:uid(),currentId:current.currentId,name:file.name,type:file.type||'application/octet-stream',size:file.size,dataUrl,author:'together',stage:'month',final:false,comment:'',createdAt:nowIso()});
    }
    persist('Материалы добавлены');renderModule();
  }
  function fileToDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});}

  function openFinish() {
    const store=ensureStore(),current=store?.currentChallenge;if(!current)return;
    openModal('Итоги месяца',`<div class="v112-form v112-two-col"><label class="v112-field"><span>Челлендж выполнен?</span><select id="cr_finish_done"><option value="yes">Да</option><option value="partial">Частично</option><option value="no">Нет, но мы сохранили вывод</option></select></label>${field('Общая оценка 1–10','cr_finish_rating','8','number','min="1" max="10"')}${field('Оценка Алексея','cr_finish_alexey','8','number','min="1" max="10"')}${field('Оценка Полины','cr_finish_polina','8','number','min="1" max="10"')}${field('Что получилось','cr_finish_worked','','textarea','rows="3"')}${field('Что не получилось','cr_finish_failed','','textarea','rows="3"')}${field('Чему научился Алексей','cr_finish_alexey_learn','','textarea','rows="3"')}${field('Чему научилась Полина','cr_finish_polina_learn','','textarea','rows="3"')}${field('Самый смешной момент','cr_finish_funny','','textarea','rows="3"')}${field('Самый сложный момент','cr_finish_hard','','textarea','rows="3"')}${field('Что хотим продолжить','cr_finish_continue','','textarea','rows="3"')}${field('Памятная фраза месяца','cr_finish_phrase','','textarea','rows="3"')}<label class="v112-field"><span>Хотим повторить?</span><select id="cr_finish_repeat"><option value="no">Нет</option><option value="yes">Да</option><option value="maybe">Возможно</option></select></label><label class="v112-field"><span>Маленькая награда</span><select id="cr_finish_reward"><option>Любимый ужин</option><option>Вечер без дел</option><option>Совместная прогулка</option><option>Распечатать фотографию</option><option>Свой вариант</option></select></label><div class="v112-modal-actions full"><button class="v112-primary" data-cr-action="save-finish" type="button">Завершить месяц</button><button data-cr-action="close-modal" type="button">Вернуться позже</button></div></div>`,true);
  }
  function finishMonth() {
    const store=ensureStore(),current=store?.currentChallenge;if(!current)return;
    const expenses=store.expenses.filter(x=>x.currentId===current.currentId),media=store.media.filter(x=>x.currentId===current.currentId),refs=store.reflections.filter(x=>x.currentId===current.currentId);
    const result={historyId:uid(),challengeId:current.challengeId,currentId:current.currentId,monthKey:current.monthKey,monthLabel:new Date(`${current.monthKey}-01T12:00:00`).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}),title:current.title,category:current.category,difficulty:current.difficulty,format:current.format,status:value('cr_finish_done'),rating:Math.max(1,Math.min(10,num(value('cr_finish_rating'))||8)),alexeyRating:num(value('cr_finish_alexey')),polinaRating:num(value('cr_finish_polina')),whatWorked:value('cr_finish_worked'),whatFailed:value('cr_finish_failed'),alexeyLearned:value('cr_finish_alexey_learn'),polinaLearned:value('cr_finish_polina_learn'),funnyMoment:value('cr_finish_funny'),hardMoment:value('cr_finish_hard'),continue:value('cr_finish_continue'),memoryPhrase:value('cr_finish_phrase'),repeat:value('cr_finish_repeat'),reward:value('cr_finish_reward'),totalExpenses:expenses.reduce((s,x)=>s+num(x.amount),0),hours:num(current.hours),media:clone(media),reflections:clone(refs),completedAt:nowIso()};
    store.history.unshift(result);store.results.unshift(result);
    window.state.personal=Array.isArray(window.state.personal)?window.state.personal:[];
    const memory={id:uid(),title:`Наш парный рандом — ${result.monthLabel}`,memoryType:'moment',date:today(),description:`${current.title}. ${result.whatWorked||result.memoryPhrase||'Совместный опыт завершён.'}`,emotions:'',importance:'Общее воспоминание пары',lesson:[result.alexeyLearned,result.polinaLearned].filter(Boolean).join(' / '),preserve:result.memoryPhrase,participants:['Алексей','Полина'],imageUrl:media.find(x=>x.type?.startsWith('image/'))?.dataUrl||'',privacy:'private',coupleRandomHistoryId:result.historyId,createdAt:nowIso(),updatedAt:nowIso()};window.state.personal.unshift(memory);
    current.links.memory.push(memory.id);logEvent('challenge_completed',{challengeId:current.challengeId,title:current.title,category:current.category,rating:result.rating,totalExpenses:result.totalExpenses});store.currentChallenge=null;store.pendingDraw=null;store.monthState={key:monthKey(),replacementsUsed:0};activeTab='history';store.settings.activeTab=activeTab;closeModal();persist('Месяц завершён и сохранён в истории');renderModule();if(store.settings.celebrations)confetti();
  }

  function openHistoryDetails(id) {
    const item=ensureStore()?.history.find(x=>x.historyId===id);if(!item)return;
    openModal(item.title,`<div class="v112-history-detail"><div class="v112-result-grid"><article><small>ИТОГ</small><p>${esc(item.whatWorked||'Не заполнено')}</p></article><article><small>ВЫВОД АЛЕКСЕЯ</small><p>${esc(item.alexeyLearned||'Не заполнено')}</p></article><article><small>ВЫВОД ПОЛИНЫ</small><p>${esc(item.polinaLearned||'Не заполнено')}</p></article><article><small>САМЫЙ СМЕШНОЙ МОМЕНТ</small><p>${esc(item.funnyMoment||'Не заполнено')}</p></article><article><small>ПАМЯТНАЯ ФРАЗА</small><p>${esc(item.memoryPhrase||'Не заполнено')}</p></article></div><div class="v112-history-metrics"><span><b>${item.rating}/10</b><small>общая оценка</small></span><span><b>${money(item.totalExpenses)}</b><small>расходы</small></span><span><b>${item.media?.length||0}</b><small>материалов</small></span></div>${item.media?.length?`<div class="v112-media-grid">${item.media.map(m=>m.type?.startsWith('image/')?`<img src="${esc(m.dataUrl)}" alt="${esc(m.name)}">`:`<article><b>${esc(m.name)}</b><small>${esc(m.type)}</small></article>`).join('')}</div>`:''}<div class="v112-modal-actions"><button data-cr-action="close-modal" type="button">Закрыть</button></div></div>`,true);
  }

  function openCustom(id='') {
    const item=id?ensureStore()?.customChallenges.find(x=>x.id===id):null,cats=ensureStore()?.categories.filter(c=>!c.archived)||[];
    openModal(item?'Изменить своё задание':'Добавить своё задание',`<div class="v112-form v112-two-col">${field('Название','cr_custom_title',item?.title||'')}${field('Описание','cr_custom_description',item?.description||'','textarea','rows="4"')}<label class="v112-field"><span>Категория</span><select id="cr_custom_category">${cats.map(c=>`<option value="${esc(c.id)}" ${item?.category===c.id?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label><label class="v112-field"><span>Сложность</span><select id="cr_custom_difficulty"><option value="easy" ${item?.difficulty==='easy'?'selected':''}>Простой</option><option value="medium" ${item?.difficulty==='medium'?'selected':''}>Средний</option><option value="hard" ${item?.difficulty==='hard'?'selected':''}>Сложный</option></select></label>${field('Минимальный бюджет','cr_custom_min',item?.budgetMin||0,'number','min="0"')}${field('Максимальный бюджет','cr_custom_max',item?.budgetMax||1500,'number','min="0"')}${field('Продолжительность','cr_custom_duration',item?.duration||'3–4 недели')}<label class="v112-field"><span>Формат</span><select id="cr_custom_format"><option value="team" ${item?.format!=='competition'?'selected':''}>Командный</option><option value="competition" ${item?.format==='competition'?'selected':''}>Соревновательный</option></select></label>${field('Роль Алексея','cr_custom_alexey',item?.alexeyRole||'')}${field('Роль Полины','cr_custom_polina',item?.polinaRole||'')}${field('Итоговый результат','cr_custom_result',item?.finalResult||'','textarea','rows="3"')}${field('Материалы через запятую','cr_custom_materials',(item?.materials||[]).join(', '))}${field('Этапы через перенос строки','cr_custom_steps',(item?.steps||[]).join('\n'),'textarea','rows="4"')}<div class="v112-modal-actions full"><button class="v112-primary" data-cr-action="save-custom" data-id="${esc(item?.id||'')}" type="button">Сохранить задание</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`,true);
  }
  function saveCustom(id='') {
    const store=ensureStore(),title=value('cr_custom_title');if(!title)return window.toast?.('Укажите название задания');
    const item=id?store.customChallenges.find(x=>x.id===id):null,target=item||{id:`custom_${uid()}`,custom:true,createdAt:nowIso(),active:true};
    Object.assign(target,{title,description:value('cr_custom_description'),category:value('cr_custom_category'),difficulty:value('cr_custom_difficulty'),format:value('cr_custom_format'),budgetMin:num(value('cr_custom_min')),budgetMax:num(value('cr_custom_max')),duration:value('cr_custom_duration'),alexeyRole:value('cr_custom_alexey')||'Подготовка и первая половина работы',polinaRole:value('cr_custom_polina')||'Организация и финальное оформление',finalResult:value('cr_custom_result')||'Совместный законченный результат',goal:'Получить новый совместный опыт',materials:value('cr_custom_materials').split(',').map(clean).filter(Boolean),steps:value('cr_custom_steps').split('\n').map(clean).filter(Boolean),skills:['Совместный опыт'],physicalActivity:'low',rare:false,season:['all'],repeatAllowed:false,updatedAt:nowIso(),whyInteresting:'Это ваша собственная идея, которую вы давно хотели попробовать вместе.'});
    if(!item)store.customChallenges.unshift(target);closeModal();persist('Своё задание сохранено');renderModule();
  }

  function openCategory(id='') {
    const item=id?ensureStore()?.categories.find(x=>x.id===id):null;
    openModal(item?'Изменить категорию':'Добавить свою категорию',`<div class="v112-form">${field('Название','cr_cat_title',item?.title||'')}${field('Описание','cr_cat_description',item?.description||'','textarea','rows="3"')}<label class="v112-field"><span>Цветовой акцент</span><div class="v112-tone-picker">${TONES.map(t=>`<label class="tone-${t}"><input type="radio" name="cr_cat_tone" value="${t}" ${item?.tone===t||(!item&&t==='violet')?'checked':''}><i></i></label>`).join('')}</div></label><label class="v112-field"><span>Фирменная иконка</span><div class="v112-icon-picker">${ICONS.map(name=>`<label><input type="radio" name="cr_cat_icon" value="${name}" ${item?.icon===name||(!item&&name==='heart')?'checked':''}>${icon(name,item?.tone||'violet')}</label>`).join('')}</div></label><div class="v112-modal-actions"><button class="v112-primary" data-cr-action="save-category" data-id="${esc(item?.id||'')}" type="button">Сохранить категорию</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`,true);
  }
  function saveCategory(id='') {
    const store=ensureStore(),title=value('cr_cat_title');if(!title)return window.toast?.('Укажите название категории');
    const duplicate=store.categories.find(c=>c.id!==id&&clean(c.title).toLowerCase()===title.toLowerCase());if(duplicate&&!confirm(`Категория «${title}» уже существует. Всё равно сохранить?`))return;
    const item=id?store.categories.find(x=>x.id===id):null,target=item||{id:`category_custom_${uid()}`,custom:true,createdAt:nowIso(),active:true,archived:false};
    target.title=title;target.description=value('cr_cat_description');target.tone=document.querySelector('input[name="cr_cat_tone"]:checked')?.value||'violet';target.icon=document.querySelector('input[name="cr_cat_icon"]:checked')?.value||'heart';target.updatedAt=nowIso();if(!item)store.categories.unshift(target);closeModal();persist('Категория сохранена');renderModule();
  }

  function addCalendar() {
    const store=ensureStore(),current=store?.currentChallenge;if(!current)return;
    window.state.tasks=Array.isArray(window.state.tasks)?window.state.tasks:[];
    const existing=new Set(current.links.tasks||[]);
    current.stages.forEach((stage,index)=>{
      const date=new Date();date.setDate(Math.min(new Date(date.getFullYear(),date.getMonth()+1,0).getDate(),1+index*7));
      const id=uid();if(existing.has(id))return;
      window.state.tasks.unshift({id,title:`Парный рандом · ${stage.title}`,date:date.toISOString().slice(0,10),time:'19:00',status:'planned',note:current.title,coupleRandomCurrentId:current.currentId,createdAt:nowIso(),updatedAt:nowIso()});current.links.tasks.push(id);
    });
    logEvent('calendar_linked',{challengeId:current.challengeId,title:current.title,count:current.stages.length});persist('Этапы добавлены в календарь');renderModule();
  }

  function openDetails() {
    const current=ensureStore()?.currentChallenge;if(!current)return;
    openModal(current.title,`<div class="v112-detail-modal"><div class="v112-result-meta"><b>${difficultyLabel(current.difficulty)}</b><span>${formatLabel(current.format)}</span><span>${money(current.budgetMin)}–${money(current.budgetMax)}</span><span>${esc(current.duration)}</span></div><section><h3>Основная цель</h3><p>${esc(current.goal)}</p><h3>Итоговый результат</h3><p>${esc(current.finalResult)}</p><h3>Материалы</h3><ul>${(current.materials||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>Возможные ограничения</h3><p>Учитывайте здоровье, доступность места, реальный бюджет и согласие обоих. План можно упростить без чувства вины.</p></section><div class="v112-modal-actions"><button data-cr-action="close-modal" type="button">Закрыть</button></div></div>`,true);
  }

  function openRitual() {
    const s=ensureStore()?.settings;
    openModal('День парного рандома',`<div class="v112-form"><label class="v112-setting"><input id="cr_ritual_enabled" type="checkbox" ${s.ritualEnabled?'checked':''}><span><b>Включить ежемесячный ритуал</b><small>Ненавязчивое напоминание выбрать новый опыт.</small></span></label><label class="v112-field"><span>День недели</span><select id="cr_ritual_day">${['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'].map((d,i)=>`<option value="${i}" ${s.ritualDay==i?'selected':''}>${d}</option>`).join('')}</select></label>${field('Время','cr_ritual_time',s.ritualTime||'18:00','time')}<label class="v112-setting"><input id="cr_weekly_enabled" type="checkbox" ${s.weeklyCheckIn?'checked':''}><span><b>Еженедельный чек-ин</b><small>Что получилось, что мешало и какой следующий шаг.</small></span></label><div class="v112-modal-actions"><button class="v112-primary" data-cr-action="save-ritual" type="button">Сохранить</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`);
  }
  function saveRitual(){const s=ensureStore()?.settings;s.ritualEnabled=checked('cr_ritual_enabled');s.ritualDay=num(value('cr_ritual_day'));s.ritualTime=value('cr_ritual_time')||'18:00';s.weeklyCheckIn=checked('cr_weekly_enabled');closeModal();persist('Ритуал сохранён');renderModule();}

  function confetti(){const host=document.createElement('div');host.className='v112-confetti';host.innerHTML=Array.from({length:36},(_,i)=>`<i style="--x:${Math.random()*100}%;--d:${Math.random()*.8}s;--r:${Math.random()*360}deg"></i>`).join('');document.body.appendChild(host);setTimeout(()=>host.remove(),2200);}

  function renderModule() {
    if(routeNow()!==ROUTE)return;
    const view=document.getElementById('view');if(!view)return;
    view.dataset.route=ROUTE;view.innerHTML=renderPage();
    decorateNavigation();
  }

  function augmentInformation() {
    if(routeNow()!=='information')return;
    const grid=document.querySelector('.v107-info-grid,.v78-information-grid');if(!grid||grid.querySelector('[data-cr-open]'))return;
    const store=ensureStore(),current=store?.currentChallenge;
    const button=document.createElement('button');button.type='button';button.className='v107-folder v112-info-folder';button.dataset.crOpen='true';button.innerHTML=`${icon('heart','pink')}<span><b>Парный рандом</b><small>${current?'Активный челлендж месяца':'Один месяц — один общий опыт'}</small></span><em>${store?.history?.length||'—'}</em><u>›</u>`;grid.appendChild(button);
  }

  function decorateNavigation() {
    const nav=document.querySelector('.v78-side-nav');if(nav&&!nav.querySelector('[data-cr-nav]')){const a=document.createElement('a');a.href='#couple-random';a.className='v78-side-link';a.dataset.crNav='true';a.innerHTML=`<i>${icon('heart','pink','tiny')}</i><span>Парный рандом</span>`;const info=nav.querySelector('[data-v78-route="information"]');info?.before(a);}
    document.querySelectorAll('[data-cr-nav]').forEach(a=>a.classList.toggle('active',routeNow()===ROUTE));
  }

  function schedule() { if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;if(routeNow()===ROUTE){if(!document.querySelector('#view > .v112-page'))renderModule();else decorateNavigation();}else{augmentInformation();decorateNavigation();}}); }

  function navigate(route){closeModal();try{history.pushState(null,'',`#${encodeURIComponent(route)}`);}catch(_){location.hash=route;}try{rawRender?.();}catch(_){}setTimeout(schedule,10);}

  function handleClick(event) {
    const open=event.target.closest('[data-cr-open]');if(open){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();navigate(ROUTE);return;}
    const nav=event.target.closest('[data-cr-nav]');if(nav){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();navigate(ROUTE);return;}
    const btn=event.target.closest('[data-cr-action]');if(!btn)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const action=btn.dataset.crAction,id=btn.dataset.id;
    try{
      if(action==='back-information')navigate('information');
      else if(action==='tab'){const store=ensureStore();activeTab=btn.dataset.tab;store.settings.activeTab=activeTab;persist();renderModule();}
      else if(action==='difficulty'){pendingDifficulty=btn.dataset.value;renderModule();}
      else if(action==='random-difficulty'){pendingDifficulty=randomItem(['easy','medium','hard']);renderModule();}
      else if(action==='draw')startDraw();
      else if(action==='accept')acceptPending(false);
      else if(action==='open-reject')openReject();
      else if(action==='reject')rejectPending();
      else if(action==='close-modal')closeModal();
      else if(action==='toggle-step')toggleStep(btn.dataset.stage,btn.dataset.item);
      else if(action==='add-step')addStep(btn.dataset.stage);
      else if(action==='save-step')saveStep(btn.dataset.stage);
      else if(action==='complete-first-step'){const c=ensureStore()?.currentChallenge;if(c){c.firstStepDone=!c.firstStepDone;if(c.firstStepDone)c.sessions=num(c.sessions)+1;persist(c.firstStepDone?'Первый шаг отмечен':'Отметка снята');renderModule();}}
      else if(action==='add-expense')openExpense();
      else if(action==='save-expense')saveExpense();
      else if(action==='add-reflection')openReflection();
      else if(action==='save-reflection')saveReflection();
      else if(action==='media')document.querySelector('[data-cr-media-input]')?.click();
      else if(action==='finish')openFinish();
      else if(action==='save-finish')finishMonth();
      else if(action==='history-details')openHistoryDetails(id);
      else if(action==='add-custom')openCustom();
      else if(action==='edit-custom')openCustom(id);
      else if(action==='save-custom')saveCustom(id);
      else if(action==='toggle-custom'){const x=ensureStore()?.customChallenges.find(c=>c.id===id);if(x){x.active=x.active===false;persist(x.active?'Задание включено':'Задание отключено');renderModule();}}
      else if(action==='delete-custom'){const s=ensureStore(),x=s?.customChallenges.find(c=>c.id===id);if(x&&confirm(`Удалить «${x.title}»?`)){s.customChallenges=s.customChallenges.filter(c=>c.id!==id);persist('Задание удалено');renderModule();}}
      else if(action==='add-category')openCategory();
      else if(action==='edit-category')openCategory(id);
      else if(action==='save-category')saveCategory(id);
      else if(action==='archive-category'){const c=ensureStore()?.categories.find(x=>x.id===id);if(c){c.archived=!c.archived;c.active=!c.archived;persist(c.archived?'Категория перемещена в архив':'Категория восстановлена');renderModule();}}
      else if(action==='calendar')addCalendar();
      else if(action==='open-details')openDetails();
      else if(action==='open-ritual')openRitual();
      else if(action==='save-ritual')saveRitual();
    }catch(error){console.error('[V112 action]',action,error);window.toast?.(error?.message||'Не удалось выполнить действие');}
  }

  function handleChange(event) {
    const el=event.target,store=ensureStore();if(!store)return;
    if(el.matches('[data-cr-media-input]')){saveMedia(el.files).catch(error=>console.error('[V112 media]',error));return;}
    if(el.dataset.crChange==='personal-progress'){const c=store.currentChallenge;if(c){c[`${el.dataset.person}Progress`]=num(el.value);persist();renderModule();}return;}
    if(el.dataset.crChange==='category-active'){const c=store.categories.find(x=>x.id===el.dataset.id);if(c){c.active=el.checked;c.archived=false;persist();renderModule();}return;}
    if(el.dataset.crSetting){store.settings[el.dataset.crSetting]=el.checked;persist('Настройка сохранена');return;}
    if(el.dataset.crSettingNumber){store.settings[el.dataset.crSettingNumber]=num(el.value);persist('Настройка сохранена');return;}
    if(el.dataset.crSettingValue){store.settings[el.dataset.crSettingValue]=el.type==='number'?num(el.value):el.value;persist('Настройка сохранена');return;}
    if(el.dataset.crArraySetting){const key=el.dataset.crArraySetting,list=Array.isArray(store.settings[key])?store.settings[key]:[];store.settings[key]=el.checked?Array.from(new Set(list.concat(el.value))):list.filter(x=>x!==el.value);persist('Настройка сохранена');}
  }

  function boot() {
    const bootStore=ensureStore();activeTab=bootStore?.settings?.activeTab||'current';ensureModal();
    rawRender=window.renderPremium;
    if(typeof rawRender==='function'){
      window.renderPremium=function(...args){const result=rawRender.apply(this,args);setTimeout(schedule,12);return result;};
    }
    document.addEventListener('click',handleClick,true);
    document.addEventListener('change',handleChange,true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modalRoot?.classList.contains('show')){event.preventDefault();closeModal();}},true);
    window.addEventListener('hashchange',()=>setTimeout(schedule,20));
    const observer=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))schedule();});
    observer.observe(document.getElementById('app')||document.body,{subtree:true,childList:true});
    schedule();setTimeout(schedule,180);
    window.SecondBrainPairRandomV112={ensureStore,render:renderModule,draw:startDraw,navigate,challengeCount:()=>challengeDb().length};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
