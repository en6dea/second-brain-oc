/* Second Brain OS V113 — Pair Month Experience. */
'use strict';
(() => {
  const ROUTE = 'couple-random';
  const VERSION = 3;
  const TABS = [
    ['current','Текущий месяц'],
    ['planner','План по месяцам'],
    ['experiences','Наши опыты'],
    ['inspiration','Вдохновиться'],
    ['history','История'],
    ['categories','Категории'],
    ['settings','Настройки']
  ];
  const EXPERIENCE_TYPES = {
    skill:'Новый навык',
    practice:'Регулярная практика',
    project:'Совместный проект',
    experiment:'Эксперимент месяца'
  };
  const RHYTHMS = {
    daily:'Каждый день',
    weekdays:'По будням',
    three_week:'3 раза в неделю',
    two_week:'2 раза в неделю',
    weekly:'1 раз в неделю',
    flexible:'По своему графику'
  };
  const TONES = ['violet','pink','blue','cyan','mint','green','amber','orange','coral','magenta','indigo','slate'];
  const ICONS = ['heart','spark','palette','music','dance','film','camera','food','cake','sport','walk','plane','home','craft','tools','brain','language','theatre','smile','people','gift','leaf','star','code','style','museum','history','wallet','briefcase','trophy','bolt','season','confetti','cozy','link'];
  const ICON_PATHS = {
    heart:'M12 21S4 16.3 4 9.6A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8 3.6C20 16.3 12 21 12 21z',
    spark:'M12 3l2.2 5.1L20 10l-5.8 1.9L12 17l-2.2-5.1L4 10l5.8-1.9z',
    palette:'M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 1 1 0-4h3a6 6 0 0 0 0-10z',
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
  const DEVELOPMENT_CATEGORIES = new Set(['creative','drawing','music','dance','video','photo','cooking','baking','sport','wellbeing','home','craft','repair','intellectual','languages','skills','acting','digital','content','style','culture','history','psychology','finance','business','nature']);
  const CURATED_INSPIRATION = [
    {id:'curated_english',title:'Месяц разговорного английского',category:'languages',type:'skill',learningGoal:'Свободнее говорить на бытовые темы и выучить 120 полезных фраз',rhythm:'daily',sessionsTarget:24,description:'Каждый день 15–20 минут говорить, слушать и повторять. Раз в неделю проводить мини-разговор только на английском.',finalResult:'Записать пятиминутный разговор на английском и сравнить с первой неделей.',budgetMax:1500,format:'team'},
    {id:'curated_cooking',title:'Каждый день новое блюдо',category:'cooking',type:'practice',learningGoal:'Расширить домашнее меню и освоить новые техники приготовления',rhythm:'daily',sessionsTarget:25,description:'Готовить новое блюдо или новый элемент блюда каждый день, чередуя ответственность.',finalResult:'Собственная подборка из 20–30 рецептов с фотографиями и оценками.',budgetMax:10000,format:'team'},
    {id:'curated_photo',title:'Месяц фотографии и композиции',category:'photo',type:'skill',learningGoal:'Научиться видеть свет, композицию и историю в кадре',rhythm:'three_week',sessionsTarget:12,description:'Три раза в неделю выполнять короткое фотозадание и разбирать лучшие кадры.',finalResult:'Совместная серия из 12 лучших фотографий.',budgetMax:1000,format:'competition'},
    {id:'curated_dance',title:'Освоить один танец за месяц',category:'dance',type:'skill',learningGoal:'Выучить базовые движения и собрать связку на 60–90 секунд',rhythm:'three_week',sessionsTarget:12,description:'Выбрать стиль, регулярно тренироваться и снять финальную связку.',finalResult:'Видео общего танцевального номера.',budgetMax:5000,format:'team'},
    {id:'curated_bread',title:'Научиться печь хлеб',category:'baking',type:'skill',learningGoal:'Понять тесто, ферментацию и выпечку',rhythm:'weekly',sessionsTarget:5,description:'Каждую неделю пробовать новый вид хлеба и фиксировать изменения рецепта.',finalResult:'Свой стабильный рецепт хлеба и фотохронология попыток.',budgetMax:3000,format:'team'},
    {id:'curated_video',title:'Снять мини-фильм за месяц',category:'video',type:'project',learningGoal:'Освоить сценарий, съёмку и базовый монтаж',rhythm:'two_week',sessionsTarget:8,description:'Пройти путь от идеи до короткого фильма длительностью 2–5 минут.',finalResult:'Готовый смонтированный мини-фильм.',budgetMax:5000,format:'team'},
    {id:'curated_music',title:'Освоить одну песню',category:'music',type:'skill',learningGoal:'Разобрать ритм, мелодию или вокальную партию',rhythm:'three_week',sessionsTarget:12,description:'Выбрать песню и регулярно отрабатывать свои партии.',finalResult:'Совместная аудио- или видеозапись.',budgetMax:3000,format:'team'},
    {id:'curated_fitness',title:'Месяц общей физической формы',category:'sport',type:'practice',learningGoal:'Улучшить выносливость и сформировать устойчивый ритм',rhythm:'three_week',sessionsTarget:12,description:'Выбрать безопасную программу и выполнять её вместе три раза в неделю.',finalResult:'Сравнить стартовые и финальные показатели без соревнования друг с другом.',budgetMax:3000,format:'team'},
    {id:'curated_design',title:'Освоить базовый дизайн в Canva или Figma',category:'digital',type:'skill',learningGoal:'Научиться собирать аккуратные макеты и визуальные истории',rhythm:'two_week',sessionsTarget:8,description:'Изучать один принцип дизайна за занятие и применять его в общем проекте.',finalResult:'Совместный мини-альбом или презентация.',budgetMax:1000,format:'team'},
    {id:'curated_history',title:'Изучить историю своего города',category:'history',type:'project',learningGoal:'Узнать ключевые места, события и людей города',rhythm:'weekly',sessionsTarget:5,description:'Раз в неделю изучать одну тему и посещать или отмечать связанное место.',finalResult:'Собственная карта из 10 исторических точек с короткими заметками.',budgetMax:3000,format:'team'},
    {id:'curated_first_aid',title:'Освоить основы первой помощи',category:'skills',type:'skill',learningGoal:'Разобраться в базовых безопасных действиях при типичных ситуациях',rhythm:'weekly',sessionsTarget:5,description:'Изучать материалы только из надёжных источников и отрабатывать безопасные сценарии.',finalResult:'Совместный чек-лист действий и собранная домашняя аптечка.',budgetMax:5000,format:'team'},
    {id:'curated_clothes',title:'Научиться ремонтировать одежду',category:'repair',type:'skill',learningGoal:'Освоить базовые швы, пришивание фурнитуры и мелкий ремонт',rhythm:'weekly',sessionsTarget:5,description:'Каждую неделю осваивать одну технику на реальной вещи.',finalResult:'Отремонтировать минимум четыре вещи и сохранить памятку.',budgetMax:2500,format:'team'},
    {id:'curated_public',title:'Месяц уверенной речи',category:'acting',type:'skill',learningGoal:'Говорить яснее, увереннее и выразительнее',rhythm:'three_week',sessionsTarget:12,description:'Записывать короткие выступления, работать с голосом и давать друг другу бережную обратную связь.',finalResult:'Два финальных выступления по три минуты.',budgetMax:1000,format:'competition'},
    {id:'curated_money',title:'Месяц финансовой осознанности пары',category:'finance',type:'practice',learningGoal:'Лучше понимать общие траты и принимать решения без напряжения',rhythm:'weekly',sessionsTarget:5,description:'Раз в неделю спокойно разбирать одну финансовую тему и фиксировать одно решение.',finalResult:'Понятный общий план на следующий месяц.',budgetMax:0,format:'team'},
    {id:'curated_art',title:'Освоить акварель',category:'drawing',type:'skill',learningGoal:'Понять цвет, воду и базовые приёмы акварели',rhythm:'three_week',sessionsTarget:12,description:'Три коротких занятия в неделю с постепенным усложнением.',finalResult:'Небольшая домашняя выставка из шести работ.',budgetMax:3500,format:'competition'},
    {id:'curated_culture',title:'Месяц новой культуры',category:'culture',type:'experiment',learningGoal:'Погрузиться в язык, кино, музыку и кухню выбранной страны',rhythm:'two_week',sessionsTarget:8,description:'Каждую неделю изучать два аспекта выбранной культуры.',finalResult:'Тематический вечер с блюдом, музыкой и короткой презентацией.',budgetMax:6000,format:'team'}
  ];

  let rawRender = null;
  let modalRoot = null;
  let renderQueued = false;
  let activeTab = 'current';
  let plannerYear = new Date().getFullYear();
  let inspirationPage = 0;

  const esc = (value='') => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const clean = (value='') => String(value ?? '').trim();
  const num = value => { const parsed = Number(String(value ?? '').replace(/\s/g,'').replace(',','.')); return Number.isFinite(parsed) ? parsed : 0; };
  const uid = () => (globalThis.crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);
  const nowIso = () => new Date().toISOString();
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const currentMonthKey = () => today().slice(0,7);
  const stateNow = () => window.state && typeof window.state === 'object' ? window.state : null;
  const challengeDb = () => Array.isArray(window.SecondBrainCoupleChallenges) ? window.SecondBrainCoupleChallenges : [];
  const builtCategories = () => Array.isArray(window.SecondBrainCoupleChallengeCategories) ? window.SecondBrainCoupleChallengeCategories : [];
  const clone = value => JSON.parse(JSON.stringify(value));
  const money = value => `${num(value).toLocaleString('ru-RU',{maximumFractionDigits:2})} ₽`;
  const routeNow = () => decodeURIComponent((location.hash||'').replace(/^#/,'') || 'today');
  const monthLabel = key => new Date(`${key}-01T12:00:00`).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
  const fmtDate = value => value ? new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}) : '—';
  const daysInMonth = key => { const [y,m]=key.split('-').map(Number); return new Date(y,m,0).getDate(); };
  const monthKeysForYear = year => Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`);
  const lastDayOfMonth = key => `${key}-${String(daysInMonth(key)).padStart(2,'0')}`;
  const typeLabel = value => EXPERIENCE_TYPES[value] || EXPERIENCE_TYPES.skill;
  const rhythmLabel = value => RHYTHMS[value] || RHYTHMS.flexible;

  function icon(name='spark',tone='violet',extra='') {
    return `<span class="v112-icon tone-${esc(tone)} ${esc(extra)}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${esc(ICON_PATHS[name]||ICON_PATHS.spark)}"/></svg></span>`;
  }

  function normalizeExperience(item={}) {
    const category = categoryByRaw(item.category);
    return Object.assign(item,{
      id:item.id||uid(),
      title:clean(item.title)||'Новый опыт',
      category:item.category||category.id||'skills',
      experienceType:item.experienceType||item.type||'skill',
      learningGoal:item.learningGoal||item.goal||((item.skills||[])[0] ? `Развить: ${(item.skills||[]).join(', ')}` : 'Получить новый совместный опыт'),
      practiceRhythm:item.practiceRhythm||item.rhythm||'two_week',
      sessionsTarget:Math.max(1,num(item.sessionsTarget)||8),
      description:item.description||'',
      finalResult:item.finalResult||'Зафиксировать результат и выводы в конце месяца.',
      format:item.format||'team',
      alexeyRole:item.alexeyRole||'Участвовать в практике и поддерживать общий результат',
      polinaRole:item.polinaRole||'Участвовать в практике и поддерживать общий результат',
      budgetMin:num(item.budgetMin),
      budgetMax:num(item.budgetMax),
      reward:clean(item.reward||''),
      active:item.active!==false,
      archived:Boolean(item.archived),
      custom:true,
      createdAt:item.createdAt||nowIso(),
      updatedAt:item.updatedAt||nowIso()
    });
  }

  function categoryByRaw(id) {
    return builtCategories().find(c=>c.id===id) || {id:id||'skills',title:'Новые навыки',icon:'spark',tone:'indigo'};
  }

  function ensureStore() {
    const state = stateNow();
    if(!state) return null;
    const defaults = {
      version:VERSION,
      settings:{
        activeTab:'current',
        ritualEnabled:true,
        ritualDay:0,
        ritualTime:'18:00',
        startReminder:true,
        finalReminder:true,
        gentleReminders:true,
        celebrations:true,
        askRewardAtStart:true,
        defaultPlannerYears:2,
        inspirationSearch:'',
        inspirationCategory:'all'
      },
      categories:[],
      currentChallenge:null,
      pendingDraw:null,
      monthPlans:[],
      history:[],
      drawLog:[],
      customChallenges:[],
      rejectedChallenges:[],
      disabledChallenges:[],
      expenses:[],
      media:[],
      reflections:[],
      results:[],
      ritual:{},
      weeklyCheckIns:[]
    };
    if(!state.coupleRandom || typeof state.coupleRandom!=='object') state.coupleRandom=clone(defaults);
    const store=state.coupleRandom;
    store.version=VERSION;
    store.settings=Object.assign({},defaults.settings,store.settings||{});
    if(store.settings.activeTab==='ideas') store.settings.activeTab='experiences';
    ['categories','monthPlans','history','drawLog','customChallenges','rejectedChallenges','disabledChallenges','expenses','media','reflections','results','weeklyCheckIns'].forEach(key=>{if(!Array.isArray(store[key]))store[key]=[];});
    const existingCategories=new Set(store.categories.map(c=>c.id));
    builtCategories().forEach(cat=>{if(!existingCategories.has(cat.id))store.categories.push(Object.assign({},cat,{archived:false,createdAt:nowIso(),updatedAt:nowIso()}));});
    store.categories.forEach(cat=>{cat.active=cat.active!==false;cat.archived=Boolean(cat.archived);cat.custom=Boolean(cat.custom);cat.icon=cat.icon||'spark';cat.tone=cat.tone||'violet';});
    store.customChallenges=store.customChallenges.map(normalizeExperience);

    if(store.pendingDraw?.challenge && !store.migrationV113PendingDone){
      const pending=normalizeExperience(Object.assign({},store.pendingDraw.challenge,{id:`experience_${uid()}`,source:'legacy_random'}));
      if(!store.customChallenges.some(x=>x.title===pending.title)) store.customChallenges.unshift(pending);
      store.drawLog.unshift({id:uid(),type:'legacy_draw_saved',title:pending.title,monthKey:currentMonthKey(),createdAt:nowIso()});
      store.pendingDraw=null;
      store.migrationV113PendingDone=true;
    }
    if(store.currentChallenge){
      const current=normalizeExperience(store.currentChallenge);
      current.currentId=store.currentChallenge.currentId||uid();
      current.monthKey=store.currentChallenge.monthKey||currentMonthKey();
      current.startDate=store.currentChallenge.startDate||`${current.monthKey}-01`;
      current.finalDate=store.currentChallenge.finalDate||lastDayOfMonth(current.monthKey);
      current.reward=clean(store.currentChallenge.reward||'');
      store.currentChallenge=current;
      if(!store.monthPlans.some(p=>p.monthKey===current.monthKey)){
        store.monthPlans.push({id:uid(),monthKey:current.monthKey,experienceId:current.id,experienceSnapshot:clone(current),reward:current.reward,status:'active',createdAt:current.acceptedAt||nowIso(),updatedAt:nowIso()});
      }
    }
    store.monthPlans.forEach(plan=>{
      plan.status=plan.status||'planned';
      plan.reward=clean(plan.reward||'');
      plan.createdAt=plan.createdAt||nowIso();
      plan.updatedAt=plan.updatedAt||nowIso();
    });
    return store;
  }

  function persist(message='') {
    const store=ensureStore();
    if(store) store.updatedAt=nowIso();
    try{window.save?.();}catch(error){console.error('[V113 save]',error);}
    if(message) try{window.toast?.(message);}catch(_){}
  }

  function logEvent(type,details={}) {
    const store=ensureStore(); if(!store)return;
    store.drawLog.unshift(Object.assign({id:uid(),type,monthKey:details.monthKey||currentMonthKey(),createdAt:nowIso()},clone(details)));
  }

  function categoryBy(id) {
    return ensureStore()?.categories.find(c=>c.id===id) || categoryByRaw(id);
  }
  function ownExperiences(store=ensureStore()) {
    return (store?.customChallenges||[]).filter(x=>x.active!==false&&!x.archived).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  }
  function experienceBy(id,store=ensureStore()) {
    return store?.customChallenges.find(x=>x.id===id) || null;
  }
  function planForMonth(key,store=ensureStore()) {
    return store?.monthPlans.find(x=>x.monthKey===key) || null;
  }
  function planExperience(plan,store=ensureStore()) {
    return experienceBy(plan?.experienceId,store) || plan?.experienceSnapshot || null;
  }
  function monthProgress(key=currentMonthKey()) {
    const current=currentMonthKey();
    if(key<current)return{percent:100,day:daysInMonth(key),total:daysInMonth(key),state:'past'};
    if(key>current)return{percent:0,day:0,total:daysInMonth(key),state:'future'};
    const day=new Date().getDate(),total=daysInMonth(key);
    return{percent:Math.min(100,Math.round(day/total*100)),day,total,state:'current'};
  }
  function canFinishMonth(current) {
    if(!current)return false;
    if(current.monthKey<currentMonthKey())return true;
    if(current.monthKey>currentMonthKey())return false;
    return new Date().getDate()>=daysInMonth(current.monthKey)-2;
  }
  function eventLabel(value) {
    return ({
      month_planned:'Опыт запланирован',month_plan_changed:'План месяца изменён',month_plan_removed:'План месяца удалён',experience_started:'Опыт месяца начат',experience_completed:'Месяц завершён',experience_added:'Опыт добавлен',inspiration_added:'Вдохновение добавлено к своим опытам',reward_saved:'Награда сохранена',expense_added:'Добавлен расход',legacy_draw_saved:'Старый результат сохранён в «Наши опыты»',draw_started:'Старый запуск рулетки',draw_result:'Старый результат рулетки',challenge_accepted:'Старый челлендж принят',challenge_rejected:'Старый отказ сохранён'
    })[value]||value;
  }

  function pageHead(store) {
    const own=ownExperiences(store).length;
    return `<header class="v112-page-head v113-page-head"><div><button class="v78-back" data-cr-action="back-information" type="button">← Информация</button><span>ОДИН МЕСЯЦ — ОДИН НОВЫЙ ОПЫТ</span><h1>Парный опыт месяца</h1><p>В начале месяца вы выбираете, чему хотите научиться или что хотите развивать. В конце — сохраняете результат, выводы и собственную награду.</p></div><div class="v112-page-badge">${icon('spark','violet')}<span><b>${own}</b><small>своих опытов</small></span></div></header>`;
  }
  function tabNav() {
    return `<nav class="v112-tabs">${TABS.map(([id,label])=>`<button class="${activeTab===id?'active':''}" data-cr-action="tab" data-tab="${id}" type="button">${esc(label)}</button>`).join('')}</nav>`;
  }
  function renderPage() {
    const store=ensureStore();
    if(!store)return `<div class="v112-empty"><h2>Данные приложения загружаются</h2><p>Подождите секунду и откройте раздел снова.</p></div>`;
    const content = activeTab==='current'?currentTab(store):activeTab==='planner'?plannerTab(store):activeTab==='experiences'?experiencesTab(store):activeTab==='inspiration'?inspirationTab(store):activeTab==='history'?historyTab(store):activeTab==='categories'?categoriesTab(store):settingsTab(store);
    return `<section class="v78-page v112-page v113-page">${pageHead(store)}${tabNav()}${content}</section>`;
  }

  function ritualCard(store) {
    const planned=planForMonth(currentMonthKey(),store);
    const copy=store.currentChallenge?'До конца месяца не нужно заполнять отчёты — просто живите выбранным опытом.':planned?'Опыт уже выбран. Осталось начать его в удобный день.':'Сначала выберите опыт из своей базы или запланируйте будущие месяцы.';
    return `<article class="v112-ritual">${icon('spark','violet')}<div><small>МЯГКИЙ ЕЖЕМЕСЯЧНЫЙ РИТУАЛ</small><h2>Мы развиваемся вместе</h2><p>${copy}</p></div><button data-cr-action="open-ritual" type="button">Настроить напоминания</button></article>`;
  }

  function currentTab(store) {
    const current=store.currentChallenge;
    const plan=planForMonth(currentMonthKey(),store);
    if(current)return `${ritualCard(store)}${activeExperience(store,current)}`;
    if(plan)return `${ritualCard(store)}${scheduledExperience(store,plan)}`;
    return `${ritualCard(store)}${chooseExperience(store)}`;
  }

  function chooseExperience(store) {
    const list=ownExperiences(store).slice(0,6);
    const month=monthLabel(currentMonthKey());
    return `<section class="v113-choice-shell"><header><div><small>${esc(month.toUpperCase())}</small><h2>Выберите опыт в начале месяца</h2><p>В основное планирование попадают только ваши собственные опыты. Встроенные предложения находятся отдельно во вкладке «Вдохновиться».</p></div><button class="v112-primary" data-cr-action="add-experience" type="button">＋ Добавить опыт</button></header>${list.length?`<div class="v113-choice-grid">${list.map(x=>experienceCard(x,{choose:true})).join('')}</div><footer><button data-cr-action="tab" data-tab="planner" type="button">Открыть план по месяцам</button><button data-cr-action="tab" data-tab="inspiration" type="button">Вдохновиться</button></footer>`:`<div class="v112-empty"><h3>Своих опытов пока нет</h3><p>Добавьте то, чему действительно хотите посвятить месяц: английский, новые блюда, танец, фотографию или другой навык.</p><div class="v113-empty-actions"><button data-cr-action="add-experience" type="button">Создать первый опыт</button><button data-cr-action="tab" data-tab="inspiration" type="button">Вдохновиться примерами</button></div></div>`}</section>`;
  }

  function scheduledExperience(store,plan) {
    const exp=planExperience(plan,store); if(!exp)return brokenPlan(plan);
    const cat=categoryBy(exp.category);
    return `<section class="v113-scheduled"><header><div>${icon(cat.icon,cat.tone,'large')}<span><small>ЗАПЛАНИРОВАНО НА ${esc(monthLabel(plan.monthKey).toUpperCase())}</small><h2>${esc(exp.title)}</h2><p>${esc(exp.learningGoal)}</p></span></div><span class="v113-status planned">Выбрано</span></header><div class="v113-summary-grid"><article><small>ТИП ОПЫТА</small><b>${esc(typeLabel(exp.experienceType))}</b></article><article><small>РИТМ</small><b>${esc(rhythmLabel(exp.practiceRhythm))}</b></article><article><small>ЦЕЛЬ МЕСЯЦА</small><b>${esc(exp.finalResult)}</b></article><article><small>НАГРАДА</small><b>${esc(plan.reward||exp.reward||'Придумаете сами позже')}</b></article></div><footer><button class="v112-primary" data-cr-action="start-month" data-month="${esc(plan.monthKey)}" type="button">Начать опыт месяца</button><button data-cr-action="assign-month" data-month="${esc(plan.monthKey)}" data-id="${esc(exp.id)}" type="button">Изменить выбор</button><button data-cr-action="remove-plan" data-month="${esc(plan.monthKey)}" type="button">Убрать из плана</button></footer></section>`;
  }

  function brokenPlan(plan){return `<div class="v112-empty"><h3>Запланированный опыт не найден</h3><p>Сама запись плана сохранена. Выберите другой опыт для ${esc(monthLabel(plan.monthKey))}.</p><button data-cr-action="assign-month" data-month="${esc(plan.monthKey)}" type="button">Выбрать опыт</button></div>`;}

  function activeExperience(store,current) {
    const cat=categoryBy(current.category),progress=monthProgress(current.monthKey);
    const expenses=store.expenses.filter(x=>x.currentId===current.currentId),spent=expenses.reduce((sum,x)=>sum+num(x.amount),0),budget=num(current.budgetMax||current.budgetLimit),canFinish=canFinishMonth(current),media=store.media.filter(x=>x.currentId===current.currentId);
    return `<section class="v113-active"><article class="v113-active-hero"><header><div>${icon(cat.icon,cat.tone,'large')}<span><small>ОПЫТ ${esc(monthLabel(current.monthKey).toUpperCase())}</small><h2>${esc(current.title)}</h2><p>${esc(current.learningGoal)}</p></span></div><button data-cr-action="edit-active" type="button">Изменить детали</button></header><div class="v113-month-progress"><div class="v113-progress-track"><span style="width:${progress.percent}%"></span></div><div><b>${progress.percent}% месяца</b><small>${progress.day}-й день из ${progress.total}</small></div></div><p class="v113-no-report">До конца месяца никаких обязательных чек-инов и отчётов. Приложение показывает только ход месяца, а результат вы фиксируете один раз — в финале.</p></article><div class="v113-active-grid"><div><section class="v113-experience-facts"><article>${icon('brain','indigo')}<span><small>ЧТО РАЗВИВАЕМ</small><b>${esc(current.learningGoal)}</b></span></article><article>${icon('history','blue')}<span><small>РИТМ ПРАКТИКИ</small><b>${esc(rhythmLabel(current.practiceRhythm))}</b><p>Ориентир: ${num(current.sessionsTarget)} занятий за месяц</p></span></article><article>${icon('trophy','amber')}<span><small>РЕЗУЛЬТАТ В КОНЦЕ</small><b>${esc(current.finalResult)}</b></span></article><article>${icon('people','pink')}<span><small>ВКЛАД ПАРЫ</small><b>Алексей: ${esc(current.alexeyRole)}</b><p>Полина: ${esc(current.polinaRole)}</p></span></article></section><section class="v113-month-plan"><header><div><small>ПЛАН БЕЗ ЕЖЕНЕДЕЛЬНЫХ ОТЧЁТОВ</small><h2>Как прожить этот месяц</h2></div></header><div class="v113-plan-strip"><article><b>Начало</b><p>Подготовить материалы и определить удобный ритм.</p></article><article><b>Практика</b><p>${esc(rhythmLabel(current.practiceRhythm))}, без необходимости отмечать каждый шаг.</p></article><article><b>Финал</b><p>В последние три дня месяца заполнить один итоговый отчёт.</p></article></div></section></div><aside><section class="v112-side-card"><header><div><small>БЮДЖЕТ</small><h2>${money(spent)} из ${money(budget)}</h2></div><button data-cr-action="add-expense" type="button">＋ Расход</button></header><div class="v112-budget-bar"><span style="width:${Math.min(100,budget?spent/budget*100:0)}%"></span></div><p>${budget?spent<=budget?`Осталось ${money(budget-spent)}`:`Превышение ${money(spent-budget)}`:'Лимит не задан — расходы всё равно можно фиксировать.'}</p>${expenses.slice(0,5).map(x=>`<article class="v112-expense"><span><b>${esc(x.title)}</b><small>${esc(x.paidBy==='polina'?'Полина':'Алексей')} · ${fmtDate(x.date)}</small></span><strong>${money(x.amount)}</strong></article>`).join('')||'<div class="v112-mini-empty">Расходов пока нет.</div>'}</section><section class="v112-side-card v113-reward-card"><header><div><small>НАГРАДА ПАРЫ</small><h2>${esc(current.reward||'Пока не придумана')}</h2></div><button data-cr-action="open-reward" type="button">${current.reward?'Изменить':'Придумать'}</button></header><p>Награду выбираете сами — в начале месяца или прямо перед завершением.</p></section><section class="v112-side-card v113-final-card ${canFinish?'ready':''}">${icon(canFinish?'trophy':'history',canFinish?'amber':'slate')}<small>ИТОГОВЫЙ ОТЧЁТ</small><h2>${canFinish?'Можно подвести итоги':'Откроется в конце месяца'}</h2><p>${canFinish?'Зафиксируйте результат, выводы, фотографии и награду.':`Доступно с ${daysInMonth(current.monthKey)-2} числа. Сейчас просто проживайте выбранный опыт.`}</p><button data-cr-action="finish" type="button" ${canFinish?'':'disabled'}>Заполнить итог месяца</button>${canFinish?`<button class="v112-media-button" data-cr-action="media" type="button">Прикрепить итоговые материалы</button><input data-cr-media-input type="file" multiple hidden accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt">${media.length?`<small class="v113-media-count">Прикреплено: ${media.length}</small>`:''}`:''}</section></aside></div></section>`;
  }

  function plannerTab(store) {
    const months=monthKeysForYear(plannerYear),experiences=ownExperiences(store);
    return `<section class="v113-planner"><header><div><small>ПЛАНИРОВАНИЕ ПО МЕСЯЦАМ</small><h2>Распределите готовые опыты заранее</h2><p>Один опыт можно запланировать на конкретный месяц. В начале месяца вы подтвердите выбор и начнёте его.</p></div><div class="v113-year-nav"><button data-cr-action="planner-year" data-delta="-1" type="button">←</button><b>${plannerYear}</b><button data-cr-action="planner-year" data-delta="1" type="button">→</button></div></header>${experiences.length?`<div class="v113-month-grid">${months.map(key=>monthPlanCard(key,store)).join('')}</div>`:`<div class="v112-empty"><h3>Сначала добавьте свои опыты</h3><p>Планирование строится только на ваших идеях развития. Вдохновение можно отдельно перенести в свою базу.</p><button data-cr-action="add-experience" type="button">Добавить опыт</button></div>`}</section>`;
  }

  function monthPlanCard(key,store) {
    const plan=planForMonth(key,store),exp=planExperience(plan,store),progress=monthProgress(key),isPast=key<currentMonthKey(),cat=exp?categoryBy(exp.category):null;
    if(plan&&exp)return `<article class="v113-month-card filled ${key===currentMonthKey()?'current':''} ${isPast?'past':''}"><header><span><small>${esc(monthLabel(key))}</small><b>${plan.status==='completed'?'Завершён':plan.status==='active'?'Активен':'Запланирован'}</b></span>${icon(cat.icon,cat.tone)}</header><h3>${esc(exp.title)}</h3><p>${esc(exp.learningGoal)}</p><div class="v113-mini-progress"><span style="width:${progress.percent}%"></span></div><footer>${plan.status==='active'?`<button data-cr-action="tab" data-tab="current" type="button">Текущий опыт</button>`:!isPast&&plan.status!=='completed'?`<button data-cr-action="assign-month" data-month="${esc(key)}" data-id="${esc(exp.id)}" type="button">Изменить</button><button data-cr-action="remove-plan" data-month="${esc(key)}" type="button">Убрать</button>`:`<button data-cr-action="tab" data-tab="history" type="button">История</button>`}</footer></article>`;
    return `<article class="v113-month-card empty ${key===currentMonthKey()?'current':''} ${isPast?'past':''}"><header><span><small>${esc(monthLabel(key))}</small><b>${isPast?'Месяц прошёл':'Свободно'}</b></span>${icon('spark',isPast?'slate':'violet')}</header><h3>${isPast?'Нет сохранённого опыта':'Выберите опыт'}</h3><p>${isPast?'Прошедшие месяцы без результата остаются пустыми.':'Назначьте одну из готовых собственных идей.'}</p>${!isPast?`<button data-cr-action="assign-month" data-month="${esc(key)}" type="button">＋ Запланировать</button>`:''}</article>`;
  }

  function experiencesTab(store) {
    const items=store.customChallenges.slice().sort((a,b)=>Number(a.archived)-Number(b.archived)||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
    return `<section class="v112-ideas v113-experiences"><header><div><small>НАШИ ОПЫТЫ</small><h2>Только то, что вы выбрали сами</h2><p>Каждая запись должна отвечать на вопрос: чему мы научимся, какой ритм выдержим и что покажем в конце месяца.</p></div><button class="v112-primary" data-cr-action="add-experience" type="button">＋ Добавить опыт</button></header><div class="v112-custom-grid">${items.map(x=>experienceCard(x,{manage:true})).join('')||`<div class="v112-empty"><h3>Создайте первый опыт месяца</h3><p>Например: месяц английского, ежедневные новые блюда или освоение одного танца.</p><button data-cr-action="add-experience" type="button">Добавить опыт</button></div>`}</div></section>`;
  }

  function experienceCard(exp,options={}) {
    const cat=categoryBy(exp.category);
    return `<article class="v112-custom-card v113-experience-card ${exp.archived?'disabled':''}"><header>${icon(cat.icon,cat.tone)}<span><small>${esc(typeLabel(exp.experienceType))} · ${esc(cat.title)}</small><h3>${esc(exp.title)}</h3></span></header><p>${esc(exp.learningGoal)}</p><section><span>${esc(rhythmLabel(exp.practiceRhythm))}</span><span>${num(exp.sessionsTarget)} занятий</span><span>до ${money(exp.budgetMax)}</span></section><div class="v113-card-result"><small>ФИНАЛЬНЫЙ РЕЗУЛЬТАТ</small><b>${esc(exp.finalResult)}</b></div><footer>${options.choose?`<button class="v112-primary" data-cr-action="assign-month" data-month="${esc(currentMonthKey())}" data-id="${esc(exp.id)}" type="button">Выбрать на этот месяц</button><button data-cr-action="plan-experience" data-id="${esc(exp.id)}" type="button">Другой месяц</button>`:''}${options.manage?`<button data-cr-action="edit-experience" data-id="${esc(exp.id)}" type="button">Изменить</button><button data-cr-action="plan-experience" data-id="${esc(exp.id)}" type="button">Запланировать</button><button data-cr-action="archive-experience" data-id="${esc(exp.id)}" type="button">${exp.archived?'Восстановить':'В архив'}</button>`:''}</footer></article>`;
  }

  function inspirationItems(store) {
    const curated=CURATED_INSPIRATION.map(x=>Object.assign({source:'curated',budgetMin:0,alexeyRole:'Участвовать в практике и отвечать за свою часть результата',polinaRole:'Участвовать в практике и отвечать за свою часть результата'},x));
    const built=challengeDb().filter(x=>DEVELOPMENT_CATEGORIES.has(x.category)).map(x=>({
      id:x.id,source:'database',title:x.title,category:x.category,type:'skill',learningGoal:(x.skills||[]).length?`Развить: ${(x.skills||[]).join(', ')}`:x.goal,rhythm:x.duration?.includes('вечер')?'weekly':'two_week',sessionsTarget:x.duration?.includes('3–4')?10:8,description:x.description,finalResult:x.finalResult,budgetMin:x.budgetMin,budgetMax:x.budgetMax,format:x.format,alexeyRole:x.alexeyRole,polinaRole:x.polinaRole
    }));
    const query=clean(store.settings.inspirationSearch).toLowerCase(),category=store.settings.inspirationCategory||'all';
    return curated.concat(built).filter(x=>(category==='all'||x.category===category)&&(!query||`${x.title} ${x.learningGoal} ${x.description}`.toLowerCase().includes(query)));
  }

  function inspirationTab(store) {
    const items=inspirationItems(store),pageSize=12,maxPage=Math.max(0,Math.ceil(items.length/pageSize)-1);inspirationPage=Math.min(inspirationPage,maxPage);const page=items.slice(inspirationPage*pageSize,inspirationPage*pageSize+pageSize);
    const cats=store.categories.filter(c=>DEVELOPMENT_CATEGORIES.has(c.id)&&!c.archived);
    return `<section class="v113-inspiration"><header><div><small>ОТДЕЛЬНОЕ ВДОХНОВЕНИЕ</small><h2>Примеры для получения нового опыта</h2><p>Эти варианты никогда не выбираются автоматически. Подходящий пример нужно сначала добавить в «Наши опыты», отредактировать под себя и только потом поставить в план.</p></div></header><div class="v113-inspiration-tools"><label><span>Поиск</span><input type="search" value="${esc(store.settings.inspirationSearch||'')}" data-cr-inspiration-search placeholder="Английский, готовка, фотография…"></label><label><span>Категория</span><select data-cr-inspiration-category><option value="all">Все развивающие категории</option>${cats.map(c=>`<option value="${esc(c.id)}" ${store.settings.inspirationCategory===c.id?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label></div><div class="v113-inspiration-grid">${page.map(inspirationCard).join('')||`<div class="v112-empty"><h3>По выбранным условиям ничего не найдено</h3><p>Измените поиск или категорию.</p></div>`}</div>${items.length>pageSize?`<footer class="v113-pagination"><button data-cr-action="inspiration-page" data-delta="-1" type="button" ${inspirationPage===0?'disabled':''}>← Назад</button><span>${inspirationPage+1} из ${maxPage+1}</span><button data-cr-action="inspiration-page" data-delta="1" type="button" ${inspirationPage===maxPage?'disabled':''}>Дальше →</button></footer>`:''}</section>`;
  }

  function inspirationCard(item) {
    const cat=categoryBy(item.category);
    return `<article class="v113-inspiration-card"><header>${icon(cat.icon,cat.tone)}<span><small>${esc(cat.title)} · ${esc(typeLabel(item.type||'skill'))}</small><h3>${esc(item.title)}</h3></span></header><p>${esc(item.learningGoal)}</p><div><span>${esc(rhythmLabel(item.rhythm||'two_week'))}</span><span>${num(item.sessionsTarget)||8} занятий</span><span>до ${money(item.budgetMax)}</span></div><button data-cr-action="add-inspiration" data-source="${esc(item.source)}" data-id="${esc(item.id)}" type="button">Добавить к нашим опытам</button></article>`;
  }

  function historyTab(store) {
    const items=store.history.slice().sort((a,b)=>String(b.completedAt||'').localeCompare(String(a.completedAt||''))),events=store.drawLog.slice(0,100);
    return `<section class="v112-history"><header><div><small>ИСТОРИЯ ОПЫТА</small><h2>${items.length?`Завершено месяцев: ${items.length}`:'Первый итог ещё впереди'}</h2><p>Здесь сохраняются финальные результаты, выводы, фотографии, расходы и выбранные награды.</p></div></header><div class="v112-history-grid">${items.map(historyCard).join('')||`<div class="v112-empty"><h3>Здесь появятся завершённые месяцы</h3><p>Итоговый отчёт создаётся один раз в конце месяца.</p><button data-cr-action="tab" data-tab="current" type="button">Открыть текущий месяц</button></div>`}</div><section class="v112-draw-archive"><header><div><small>АРХИВ ВЫБОРА И ПЛАНИРОВАНИЯ</small><h2>Все назначения, изменения и результаты</h2><p>Каждое действие сохраняется отдельным событием и не перезаписывает прошлое.</p></div><b>${store.drawLog.length}</b></header><div>${events.map(e=>`<article><i class="tone-${esc(categoryBy(e.category||'skills').tone)}"></i><span><small>${new Date(e.createdAt).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small><b>${esc(eventLabel(e.type))}</b><p>${esc(e.title||e.comment||monthLabel(e.monthKey||currentMonthKey()))}</p></span></article>`).join('')||'<div class="v112-mini-empty">История действий пока пуста.</div>'}</div></section></section>`;
  }

  function historyCard(item) {
    const cat=categoryBy(item.category),cover=item.coverDataUrl||item.media?.find(x=>x.type?.startsWith('image/'))?.dataUrl;
    return `<article class="v112-history-card">${cover?`<img src="${esc(cover)}" alt="">`:`<div class="v112-history-cover">${icon(cat.icon,cat.tone,'large')}</div>`}<div><small>${esc(item.monthLabel||monthLabel(item.monthKey))}</small><h3>${esc(item.title)}</h3><p>${esc(item.memoryPhrase||item.whatLearnedTogether||item.whatWorked||'Совместный опыт сохранён.')}</p><section><span>${esc(typeLabel(item.experienceType))}</span><span>${money(item.totalExpenses||0)}</span><span>★ ${num(item.rating||0)}/10</span></section><button data-cr-action="history-details" data-id="${esc(item.historyId)}" type="button">Открыть итог</button></div></article>`;
  }

  function categoriesTab(store) {
    const cats=store.categories.slice().sort((a,b)=>Number(b.custom)-Number(a.custom)||String(a.title).localeCompare(String(b.title),'ru'));
    return `<section class="v112-categories"><header><div><small>КАТЕГОРИИ ОПЫТА</small><h2>Встроенные и собственные направления</h2><p>Свои категории доступны в опытах, планировании, вдохновении и истории.</p></div><button class="v112-primary" data-cr-action="add-category" type="button">＋ Добавить категорию</button></header><div class="v112-category-grid">${cats.map(cat=>`<article class="${cat.archived?'archived':''}">${icon(cat.icon,cat.tone)}<span><small>${cat.custom?'СВОЯ КАТЕГОРИЯ':'ВСТРОЕННАЯ'}</small><h3>${esc(cat.title)}</h3><p>${esc(cat.description||'Направление для нового опыта и развития.')}</p></span><label class="v112-switch"><input type="checkbox" data-cr-change="category-active" data-id="${esc(cat.id)}" ${cat.active&&!cat.archived?'checked':''}><i></i></label><footer><button data-cr-action="edit-category" data-id="${esc(cat.id)}" type="button">Изменить</button>${cat.custom?`<button data-cr-action="archive-category" data-id="${esc(cat.id)}" type="button">${cat.archived?'Восстановить':'В архив'}</button>`:''}</footer></article>`).join('')}</div></section>`;
  }

  function settingsTab(store) {
    const s=store.settings,checkbox=(key,label,text)=>`<label class="v112-setting"><input type="checkbox" data-cr-setting="${key}" ${s[key]?'checked':''}><span><b>${label}</b><small>${text}</small></span></label>`;
    return `<section class="v112-settings"><header><div><small>НАСТРОЙКИ ОПЫТА МЕСЯЦА</small><h2>Только начало и финал</h2><p>Еженедельные отчёты отключены. Вы выбираете опыт в начале месяца и подводите один итог в конце.</p></div></header><div class="v112-settings-grid"><article><h3>Ежемесячный ритуал</h3>${checkbox('ritualEnabled','Напоминать о выборе месяца','Спокойное уведомление в начале нового месяца')}<label><span>День недели</span><select data-cr-setting-value="ritualDay">${['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'].map((d,i)=>`<option value="${i}" ${s.ritualDay==i?'selected':''}>${d}</option>`).join('')}</select></label><label><span>Время</span><input type="time" value="${esc(s.ritualTime)}" data-cr-setting-value="ritualTime"></label>${checkbox('startReminder','Напоминание в начале месяца','Помочь подтвердить запланированный опыт')}</article><article><h3>Финал месяца</h3>${checkbox('finalReminder','Напомнить об итоговом отчёте','Один раз в последние три дня месяца')}${checkbox('askRewardAtStart','Предлагать награду при выборе','Награда всегда формулируется вами самостоятельно')}${checkbox('celebrations','Праздновать завершение','Небольшая фирменная анимация после сохранения итога')}${checkbox('gentleReminders','Мягкие формулировки','Без чувства вины, серий и давления')}</article><article><h3>Принцип работы</h3><div class="v112-identity"><b>«Один месяц — один новый опыт»</b><p>Сначала собственный выбор, затем спокойная практика и один честный итог.</p></div><div class="v113-setting-note">Встроенные идеи не участвуют в выборе автоматически. Они доступны только во вкладке «Вдохновиться».</div></article><article><h3>Данные и сохранность</h3><div class="v113-setting-note">Планы месяцев, собственные опыты, награды, расходы и история хранятся в существующем состоянии Second Brain. Старые записи не удаляются.</div></article></div></section>`;
  }

  function openModal(title,body,wide=false){ensureModal();modalRoot.className=`v112-modal-root show ${wide?'wide':''}`;modalRoot.innerHTML=`<div class="v112-modal-backdrop" data-cr-action="close-modal"></div><section class="v112-modal"><header><h2>${esc(title)}</h2><button data-cr-action="close-modal" type="button">×</button></header><div>${body}</div></section>`;document.body.classList.add('v112-modal-open');}
  function closeModal(){if(modalRoot){modalRoot.className='v112-modal-root';modalRoot.innerHTML='';}document.body.classList.remove('v112-modal-open');}
  function ensureModal(){if(!modalRoot){modalRoot=document.createElement('div');modalRoot.className='v112-modal-root';modalRoot.id='v113-modal-root';document.body.appendChild(modalRoot);}}
  const field=(label,id,value='',type='text',extra='')=>`<label class="v112-field"><span>${esc(label)}</span>${type==='textarea'?`<textarea id="${id}" ${extra}>${esc(value)}</textarea>`:`<input id="${id}" type="${type}" value="${esc(value)}" ${extra}>`}</label>`;
  const value=id=>document.getElementById(id)?.value?.trim()||'';
  const checked=id=>Boolean(document.getElementById(id)?.checked);

  function openExperience(id='') {
    const store=ensureStore(),item=id?experienceBy(id,store):null,cats=store.categories.filter(c=>c.active&&!c.archived);
    openModal(item?'Изменить опыт':'Добавить свой опыт',`<div class="v112-form v112-two-col">${field('Название опыта','cr_exp_title',item?.title||'')}${field('Чему хотим научиться или что развить','cr_exp_learning',item?.learningGoal||'','textarea','rows="3"')}<label class="v112-field"><span>Тип опыта</span><select id="cr_exp_type">${Object.entries(EXPERIENCE_TYPES).map(([key,label])=>`<option value="${key}" ${item?.experienceType===key?'selected':''}>${label}</option>`).join('')}</select></label><label class="v112-field"><span>Категория</span><select id="cr_exp_category">${cats.map(c=>`<option value="${esc(c.id)}" ${item?.category===c.id?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label>${field('Описание и смысл месяца','cr_exp_description',item?.description||'','textarea','rows="4"')}<label class="v112-field"><span>Ритм практики</span><select id="cr_exp_rhythm">${Object.entries(RHYTHMS).map(([key,label])=>`<option value="${key}" ${item?.practiceRhythm===key?'selected':''}>${label}</option>`).join('')}</select></label>${field('Ориентир по количеству занятий','cr_exp_sessions',item?.sessionsTarget||8,'number','min="1" max="31"')}${field('Бюджет на месяц','cr_exp_budget',item?.budgetMax||0,'number','min="0" step="100"')}${field('Какой результат хотим получить в конце','cr_exp_result',item?.finalResult||'','textarea','rows="3"')}<label class="v112-field"><span>Формат</span><select id="cr_exp_format"><option value="team" ${item?.format!=='competition'?'selected':''}>Общий результат</option><option value="competition" ${item?.format==='competition'?'selected':''}>Два личных результата</option></select></label>${field('Вклад Алексея','cr_exp_alexey',item?.alexeyRole||'')}${field('Вклад Полины','cr_exp_polina',item?.polinaRole||'')}<div class="v112-modal-actions full"><button class="v112-primary" data-cr-action="save-experience" data-id="${esc(item?.id||'')}" type="button">Сохранить опыт</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`,true);
  }

  function saveExperience(id='') {
    const store=ensureStore(),title=value('cr_exp_title'),learningGoal=value('cr_exp_learning');
    if(!title)return window.toast?.('Введите название опыта');
    if(!learningGoal)return window.toast?.('Напишите, чему вы хотите научиться или что развить');
    const payload=normalizeExperience({
      id:id||uid(),title,learningGoal,experienceType:value('cr_exp_type')||'skill',category:value('cr_exp_category')||'skills',description:value('cr_exp_description'),practiceRhythm:value('cr_exp_rhythm')||'two_week',sessionsTarget:num(value('cr_exp_sessions'))||8,budgetMax:num(value('cr_exp_budget')),finalResult:value('cr_exp_result')||'Зафиксировать результат и выводы в конце месяца.',format:value('cr_exp_format')||'team',alexeyRole:value('cr_exp_alexey')||'Участвовать в практике',polinaRole:value('cr_exp_polina')||'Участвовать в практике',reward:(store.customChallenges.find(x=>x.id===id)?.reward||''),createdAt:nowIso(),updatedAt:nowIso(),active:true,custom:true
    });
    const existing=store.customChallenges.find(x=>x.id===id);
    if(existing)Object.assign(existing,payload,{createdAt:existing.createdAt||payload.createdAt});else store.customChallenges.unshift(payload);
    logEvent('experience_added',{title:payload.title,category:payload.category,experienceId:payload.id});
    closeModal();persist(existing?'Опыт обновлён':'Опыт добавлен');renderModule();
  }

  function openAssignMonth(monthKey,experienceId='') {
    const store=ensureStore(),items=ownExperiences(store),plan=planForMonth(monthKey,store),selected=experienceId||plan?.experienceId||'';
    if(!items.length){openExperience();return;}
    openModal(`План на ${monthLabel(monthKey)}`,`<div class="v112-form"><label class="v112-field"><span>Выберите свой опыт</span><select id="cr_plan_experience">${items.map(x=>`<option value="${esc(x.id)}" ${selected===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>${field('Наша награда — можно оставить пустой','cr_plan_reward',plan?.reward||experienceBy(selected,store)?.reward||'')}<p class="v112-form-note">Награда полностью ваша: придумайте её сейчас, позже или только в финальном отчёте.</p><div class="v112-modal-actions"><button class="v112-primary" data-cr-action="save-plan" data-month="${esc(monthKey)}" type="button">Сохранить в плане</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`);
  }

  function savePlan(monthKey) {
    const store=ensureStore(),experience=experienceBy(value('cr_plan_experience'),store);if(!experience)return window.toast?.('Выберите опыт');
    const existing=planForMonth(monthKey,store);if(existing?.status==='active'){window.toast?.('Активный опыт нельзя заменить до завершения месяца');return;}const payload={id:existing?.id||uid(),monthKey,experienceId:experience.id,experienceSnapshot:clone(experience),reward:value('cr_plan_reward'),status:'planned',createdAt:existing?.createdAt||nowIso(),updatedAt:nowIso()};
    if(existing)Object.assign(existing,payload);else store.monthPlans.push(payload);
    logEvent(existing?'month_plan_changed':'month_planned',{monthKey,title:experience.title,category:experience.category,experienceId:experience.id});
    closeModal();persist('Опыт добавлен в план');renderModule();
  }

  function openPlanExperience(id) {
    const start=new Date(),months=Array.from({length:18},(_,i)=>{const d=new Date(start.getFullYear(),start.getMonth()+i,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;});
    openModal('Выберите месяц',`<div class="v113-month-picker">${months.map(key=>`<button data-cr-action="assign-month" data-month="${key}" data-id="${esc(id)}" type="button"><small>${new Date(`${key}-01T12:00:00`).toLocaleDateString('ru-RU',{year:'numeric'})}</small><b>${new Date(`${key}-01T12:00:00`).toLocaleDateString('ru-RU',{month:'long'})}</b>${planForMonth(key)?'<span>занято</span>':'<span>свободно</span>'}</button>`).join('')}</div>`,true);
  }

  function removePlan(monthKey) {
    const store=ensureStore(),plan=planForMonth(monthKey,store);if(!plan)return;
    if(plan.status==='active')return window.toast?.('Активный месяц нельзя удалить до завершения');
    if(!confirm(`Убрать опыт из плана на ${monthLabel(monthKey)}?`))return;
    store.monthPlans=store.monthPlans.filter(x=>x.id!==plan.id);logEvent('month_plan_removed',{monthKey,title:planExperience(plan,store)?.title||''});persist('План месяца очищен');renderModule();
  }

  function startMonth(monthKey) {
    const store=ensureStore(),plan=planForMonth(monthKey,store),exp=planExperience(plan,store);if(!plan||!exp)return;
    if(monthKey!==currentMonthKey())return window.toast?.('Начать можно только опыт текущего месяца');
    if(store.currentChallenge){window.toast?.(`Сначала завершите опыт за ${monthLabel(store.currentChallenge.monthKey)}`);return;}
    store.currentChallenge=Object.assign({},clone(exp),{currentId:uid(),monthKey,startDate:today(),finalDate:lastDayOfMonth(monthKey),acceptedAt:nowIso(),reward:plan.reward||exp.reward||'',budgetLimit:num(exp.budgetMax),sourcePlanId:plan.id});
    plan.status='active';plan.updatedAt=nowIso();
    logEvent('experience_started',{monthKey,title:exp.title,category:exp.category,experienceId:exp.id});persist('Опыт месяца начат');renderModule();
  }

  function openReward() {
    const current=ensureStore()?.currentChallenge;if(!current)return;
    openModal('Наша награда',`<div class="v112-form">${field('Что приятного сделаем после завершения','cr_reward',current.reward||'')}<p class="v112-form-note">Никаких готовых вариантов: награду придумываете только вы. Она может быть бесплатной и символической.</p><div class="v112-modal-actions"><button class="v112-primary" data-cr-action="save-reward" type="button">Сохранить</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`);
  }
  function saveReward(){const current=ensureStore()?.currentChallenge;if(!current)return;current.reward=value('cr_reward');const plan=planForMonth(current.monthKey);if(plan)plan.reward=current.reward;logEvent('reward_saved',{monthKey:current.monthKey,title:current.reward});closeModal();persist('Награда сохранена');renderModule();}

  function openExpense(){openModal('Добавить расход',`<div class="v112-form v112-two-col">${field('Название','cr_expense_title')}${field('Сумма','cr_expense_amount','','number','min="0" step="1"')}<label class="v112-field"><span>Кто оплатил</span><select id="cr_expense_paid"><option value="alexey">Алексей</option><option value="polina">Полина</option></select></label>${field('Дата','cr_expense_date',today(),'date')}${field('Ссылка — необязательно','cr_expense_link','','url')}${field('Комментарий','cr_expense_comment','','textarea','rows="3"')}<div class="v112-modal-actions full"><button class="v112-primary" data-cr-action="save-expense" type="button">Добавить расход</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`);}
  function saveExpense(){const store=ensureStore(),current=store?.currentChallenge,title=value('cr_expense_title'),amount=num(value('cr_expense_amount'));if(!current||!title||amount<=0)return window.toast?.('Заполните название и сумму');store.expenses.unshift({id:uid(),currentId:current.currentId,title,amount,paidBy:value('cr_expense_paid')||'alexey',date:value('cr_expense_date')||today(),link:value('cr_expense_link'),comment:value('cr_expense_comment'),createdAt:nowIso()});logEvent('expense_added',{monthKey:current.monthKey,title,amount});closeModal();persist('Расход добавлен');renderModule();}

  async function saveMedia(files){const store=ensureStore(),current=store?.currentChallenge;if(!current||!files?.length)return;for(const file of Array.from(files)){if(file.size>2*1024*1024){window.toast?.(`Файл ${file.name} больше 2 МБ`);continue;}const dataUrl=await fileToDataUrl(file);store.media.push({id:uid(),currentId:current.currentId,name:file.name,type:file.type||'application/octet-stream',size:file.size,dataUrl,createdAt:nowIso()});}persist('Итоговые материалы сохранены');renderModule();}
  function fileToDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});}

  function openFinish() {
    const current=ensureStore()?.currentChallenge;if(!current||!canFinishMonth(current))return;
    openModal('Итог месяца',`<div class="v112-form v112-two-col"><label class="v112-field"><span>Как завершили опыт?</span><select id="cr_finish_done"><option value="yes">Выполнили</option><option value="partial">Выполнили частично</option><option value="no">Не выполнили, но сохранили вывод</option></select></label>${field('Общая оценка 1–10','cr_finish_rating','8','number','min="1" max="10"')}${field('Чему научились вместе','cr_finish_together','','textarea','rows="3"')}${field('Что получилось','cr_finish_worked','','textarea','rows="3"')}${field('Что не получилось','cr_finish_failed','','textarea','rows="3"')}${field('Вывод Алексея','cr_finish_alexey','','textarea','rows="3"')}${field('Вывод Полины','cr_finish_polina','','textarea','rows="3"')}${field('Какой результат получили','cr_finish_result',current.finalResult||'','textarea','rows="3"')}${field('Хотим ли продолжать это дальше','cr_finish_continue','','textarea','rows="3"')}${field('Памятная фраза месяца','cr_finish_phrase','','textarea','rows="3"')}${field('Наша награда','cr_finish_reward',current.reward||'')}<div class="v112-modal-actions full"><button class="v112-primary" data-cr-action="save-finish" type="button">Сохранить итог месяца</button><button data-cr-action="close-modal" type="button">Вернуться позже</button></div></div>`,true);
  }

  function finishMonth() {
    const store=ensureStore(),current=store?.currentChallenge;if(!current)return;
    const expenses=store.expenses.filter(x=>x.currentId===current.currentId),media=store.media.filter(x=>x.currentId===current.currentId),reward=value('cr_finish_reward')||current.reward||'';
    const history={historyId:uid(),challengeId:current.id,experienceId:current.id,currentId:current.currentId,monthKey:current.monthKey,monthLabel:monthLabel(current.monthKey),title:current.title,category:current.category,experienceType:current.experienceType,learningGoal:current.learningGoal,practiceRhythm:current.practiceRhythm,sessionsTarget:current.sessionsTarget,finalResult:value('cr_finish_result')||current.finalResult,doneStatus:value('cr_finish_done'),rating:num(value('cr_finish_rating')),whatLearnedTogether:value('cr_finish_together'),whatWorked:value('cr_finish_worked'),whatFailed:value('cr_finish_failed'),alexeyLearned:value('cr_finish_alexey'),polinaLearned:value('cr_finish_polina'),continueNext:value('cr_finish_continue'),memoryPhrase:value('cr_finish_phrase'),reward,totalExpenses:expenses.reduce((sum,x)=>sum+num(x.amount),0),expenses:clone(expenses),media:clone(media),completedAt:nowIso()};
    store.history.unshift(history);
    const plan=planForMonth(current.monthKey,store);if(plan){plan.status='completed';plan.reward=reward;plan.updatedAt=nowIso();}
    if(Array.isArray(window.state?.memories))window.state.memories.unshift({id:uid(),title:`Наш опыт — ${monthLabel(current.monthKey)}`,date:today(),type:'moment',description:`${current.title}. ${history.memoryPhrase||history.whatLearnedTogether||history.whatWorked}`,people:['Алексей','Полина'],coupleRandomHistoryId:history.historyId,createdAt:nowIso(),updatedAt:nowIso()});
    logEvent('experience_completed',{monthKey:current.monthKey,title:current.title,category:current.category,rating:history.rating});
    store.currentChallenge=null;closeModal();persist('Итог месяца сохранён');activeTab='history';store.settings.activeTab='history';renderModule();if(store.settings.celebrations)confetti();
  }

  function openHistoryDetails(id) {
    const item=ensureStore()?.history.find(x=>x.historyId===id);if(!item)return;
    openModal(item.title,`<div class="v112-history-detail"><div class="v112-result-grid"><article><small>ЧЕМУ НАУЧИЛИСЬ ВМЕСТЕ</small><p>${esc(item.whatLearnedTogether||'Не заполнено')}</p></article><article><small>ВЫВОД АЛЕКСЕЯ</small><p>${esc(item.alexeyLearned||'Не заполнено')}</p></article><article><small>ВЫВОД ПОЛИНЫ</small><p>${esc(item.polinaLearned||'Не заполнено')}</p></article><article><small>РЕЗУЛЬТАТ</small><p>${esc(item.finalResult||'Не заполнено')}</p></article><article><small>НАГРАДА</small><p>${esc(item.reward||'Не выбрана')}</p></article><article><small>ПАМЯТНАЯ ФРАЗА</small><p>${esc(item.memoryPhrase||'Не заполнено')}</p></article></div><div class="v112-history-metrics"><span><b>${num(item.rating)}/10</b><small>общая оценка</small></span><span><b>${money(item.totalExpenses)}</b><small>расходы</small></span><span><b>${item.media?.length||0}</b><small>материалов</small></span></div>${item.media?.length?`<div class="v112-media-grid">${item.media.map(m=>m.type?.startsWith('image/')?`<img src="${esc(m.dataUrl)}" alt="${esc(m.name)}">`:`<article><b>${esc(m.name)}</b><small>${esc(m.type)}</small></article>`).join('')}</div>`:''}<div class="v112-modal-actions"><button data-cr-action="close-modal" type="button">Закрыть</button></div></div>`,true);
  }

  function inspirationSource(source,id) {
    if(source==='curated')return CURATED_INSPIRATION.find(x=>x.id===id);
    const x=challengeDb().find(item=>item.id===id);if(!x)return null;
    return {id:x.id,title:x.title,category:x.category,type:'skill',learningGoal:(x.skills||[]).length?`Развить: ${(x.skills||[]).join(', ')}`:x.goal,rhythm:x.duration?.includes('вечер')?'weekly':'two_week',sessionsTarget:x.duration?.includes('3–4')?10:8,description:x.description,finalResult:x.finalResult,budgetMin:x.budgetMin,budgetMax:x.budgetMax,format:x.format,alexeyRole:x.alexeyRole,polinaRole:x.polinaRole};
  }
  function addInspiration(source,id) {
    const store=ensureStore(),item=inspirationSource(source,id);if(!item)return;
    if(store.customChallenges.some(x=>x.sourceId===id)){window.toast?.('Этот вариант уже добавлен в ваши опыты');return;}
    const exp=normalizeExperience({id:uid(),source:'inspiration',sourceId:id,title:item.title,category:item.category,experienceType:item.type||'skill',learningGoal:item.learningGoal,practiceRhythm:item.rhythm||'two_week',sessionsTarget:item.sessionsTarget||8,description:item.description,finalResult:item.finalResult,budgetMin:item.budgetMin,budgetMax:item.budgetMax,format:item.format,alexeyRole:item.alexeyRole,polinaRole:item.polinaRole});
    store.customChallenges.unshift(exp);logEvent('inspiration_added',{title:exp.title,category:exp.category,experienceId:exp.id});persist('Вариант добавлен в «Наши опыты»');activeTab='experiences';store.settings.activeTab='experiences';renderModule();
  }

  function openCategory(id='') {
    const store=ensureStore(),item=id?store.categories.find(x=>x.id===id):null;
    openModal(item?'Изменить категорию':'Добавить свою категорию',`<div class="v112-form">${field('Название','cr_cat_title',item?.title||'')}${field('Описание','cr_cat_description',item?.description||'','textarea','rows="3"')}<label class="v112-field"><span>Цветовой акцент</span><div class="v112-tone-picker">${TONES.map(t=>`<label class="tone-${t}"><input type="radio" name="cr_cat_tone" value="${t}" ${item?.tone===t||(!item&&t==='violet')?'checked':''}><i></i></label>`).join('')}</div></label><label class="v112-field"><span>Фирменная иконка</span><div class="v112-icon-picker">${ICONS.map(name=>`<label><input type="radio" name="cr_cat_icon" value="${name}" ${item?.icon===name||(!item&&name==='spark')?'checked':''}>${icon(name,item?.tone||'violet')}</label>`).join('')}</div></label><div class="v112-modal-actions"><button class="v112-primary" data-cr-action="save-category" data-id="${esc(item?.id||'')}" type="button">Сохранить категорию</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`,true);
  }
  function saveCategory(id='') {
    const store=ensureStore(),title=value('cr_cat_title');if(!title)return window.toast?.('Введите название категории');
    const duplicate=store.categories.find(x=>x.id!==id&&x.title.toLowerCase()===title.toLowerCase()&&!x.archived);if(duplicate&&!confirm(`Категория «${duplicate.title}» уже существует. Всё равно сохранить?`))return;
    const payload={id:id||`category_custom_${uid()}`,title,description:value('cr_cat_description'),tone:document.querySelector('input[name="cr_cat_tone"]:checked')?.value||'violet',icon:document.querySelector('input[name="cr_cat_icon"]:checked')?.value||'spark',active:true,archived:false,custom:true,createdAt:nowIso(),updatedAt:nowIso()};
    const existing=store.categories.find(x=>x.id===id);if(existing)Object.assign(existing,payload,{createdAt:existing.createdAt||payload.createdAt});else store.categories.push(payload);closeModal();persist('Категория сохранена');renderModule();
  }

  function openRitual() {
    const s=ensureStore()?.settings;
    openModal('Ежемесячный ритуал',`<div class="v112-form"><label class="v112-setting"><input id="cr_ritual_enabled" type="checkbox" ${s.ritualEnabled?'checked':''}><span><b>Напоминать о выборе опыта</b><small>Только в начале нового месяца.</small></span></label><label class="v112-field"><span>День недели</span><select id="cr_ritual_day">${['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'].map((d,i)=>`<option value="${i}" ${s.ritualDay==i?'selected':''}>${d}</option>`).join('')}</select></label>${field('Время','cr_ritual_time',s.ritualTime||'18:00','time')}<label class="v112-setting"><input id="cr_final_reminder" type="checkbox" ${s.finalReminder?'checked':''}><span><b>Напомнить об итогах</b><small>Один раз в последние три дня месяца.</small></span></label><div class="v112-modal-actions"><button class="v112-primary" data-cr-action="save-ritual" type="button">Сохранить</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`);
  }
  function saveRitual(){const s=ensureStore()?.settings;s.ritualEnabled=checked('cr_ritual_enabled');s.ritualDay=num(value('cr_ritual_day'));s.ritualTime=value('cr_ritual_time')||'18:00';s.finalReminder=checked('cr_final_reminder');closeModal();persist('Настройки сохранены');renderModule();}

  function editActive() {
    const current=ensureStore()?.currentChallenge;if(!current)return;
    openModal('Детали активного опыта',`<div class="v112-form v112-two-col">${field('Чему хотим научиться','cr_active_learning',current.learningGoal,'textarea','rows="3"')}<label class="v112-field"><span>Ритм практики</span><select id="cr_active_rhythm">${Object.entries(RHYTHMS).map(([key,label])=>`<option value="${key}" ${current.practiceRhythm===key?'selected':''}>${label}</option>`).join('')}</select></label>${field('Ориентир занятий','cr_active_sessions',current.sessionsTarget,'number','min="1" max="31"')}${field('Итоговый результат','cr_active_result',current.finalResult,'textarea','rows="3"')}${field('Вклад Алексея','cr_active_alexey',current.alexeyRole)}${field('Вклад Полины','cr_active_polina',current.polinaRole)}<div class="v112-modal-actions full"><button class="v112-primary" data-cr-action="save-active" type="button">Сохранить</button><button data-cr-action="close-modal" type="button">Отмена</button></div></div>`,true);
  }
  function saveActive(){const current=ensureStore()?.currentChallenge;if(!current)return;current.learningGoal=value('cr_active_learning')||current.learningGoal;current.practiceRhythm=value('cr_active_rhythm')||current.practiceRhythm;current.sessionsTarget=num(value('cr_active_sessions'))||current.sessionsTarget;current.finalResult=value('cr_active_result')||current.finalResult;current.alexeyRole=value('cr_active_alexey')||current.alexeyRole;current.polinaRole=value('cr_active_polina')||current.polinaRole;closeModal();persist('Детали обновлены');renderModule();}

  function confetti(){const host=document.createElement('div');host.className='v112-confetti';host.innerHTML=Array.from({length:32},()=>`<i style="--x:${Math.random()*100}%;--d:${Math.random()*.8}s;--r:${Math.random()*360}deg"></i>`).join('');document.body.appendChild(host);setTimeout(()=>host.remove(),2200);}

  function renderModule(){if(routeNow()!==ROUTE)return;const view=document.getElementById('view');if(!view)return;view.dataset.route=ROUTE;view.innerHTML=renderPage();decorateNavigation();}
  function augmentInformation(){if(routeNow()!=='information')return;const grid=document.querySelector('.v107-info-grid,.v78-information-grid');if(!grid)return;const store=ensureStore(),current=store?.currentChallenge;let button=grid.querySelector('[data-cr-open]');if(!button){button=document.createElement('button');button.type='button';button.className='v107-folder v112-info-folder';button.dataset.crOpen='true';grid.appendChild(button);}button.innerHTML=`${icon('spark','violet')}<span><b>Опыт месяца</b><small>${current?'Активный опыт месяца':'Выбор, развитие и итог'}</small></span><em>${store?.monthPlans?.length||'—'}</em><u>›</u>`;}
  function decorateNavigation(){const nav=document.querySelector('.v78-side-nav');if(nav){let a=nav.querySelector('[data-cr-nav]');if(!a){a=document.createElement('a');a.href='#couple-random';a.className='v78-side-link';a.dataset.crNav='true';const info=nav.querySelector('[data-v78-route="information"]');info?.before(a);}a.innerHTML=`<i>${icon('spark','violet','tiny')}</i><span>Опыт месяца</span>`;}document.querySelectorAll('[data-cr-nav]').forEach(a=>a.classList.toggle('active',routeNow()===ROUTE));}
  function schedule(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;if(routeNow()===ROUTE){if(!document.querySelector('#view > .v113-page'))renderModule();else decorateNavigation();}else{augmentInformation();decorateNavigation();}});}
  function navigate(route){closeModal();try{history.pushState(null,'',`#${encodeURIComponent(route)}`);}catch(_){location.hash=route;}try{rawRender?.();}catch(_){}setTimeout(schedule,10);}

  function handleClick(event) {
    const open=event.target.closest('[data-cr-open]');if(open){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();navigate(ROUTE);return;}
    const nav=event.target.closest('[data-cr-nav]');if(nav){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();navigate(ROUTE);return;}
    const btn=event.target.closest('[data-cr-action]');if(!btn)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const action=btn.dataset.crAction,id=btn.dataset.id;
    try{
      if(action==='back-information')navigate('information');
      else if(action==='tab'){activeTab=btn.dataset.tab;const store=ensureStore();store.settings.activeTab=activeTab;persist();renderModule();}
      else if(action==='add-experience')openExperience();
      else if(action==='edit-experience')openExperience(id);
      else if(action==='save-experience')saveExperience(id);
      else if(action==='archive-experience'){const x=experienceBy(id);if(x){x.archived=!x.archived;x.active=!x.archived;x.updatedAt=nowIso();persist(x.archived?'Опыт перемещён в архив':'Опыт восстановлен');renderModule();}}
      else if(action==='plan-experience')openPlanExperience(id);
      else if(action==='assign-month'){closeModal();openAssignMonth(btn.dataset.month,id);}
      else if(action==='save-plan')savePlan(btn.dataset.month);
      else if(action==='remove-plan')removePlan(btn.dataset.month);
      else if(action==='start-month')startMonth(btn.dataset.month);
      else if(action==='planner-year'){plannerYear+=num(btn.dataset.delta);renderModule();}
      else if(action==='inspiration-page'){inspirationPage=Math.max(0,inspirationPage+num(btn.dataset.delta));renderModule();}
      else if(action==='add-inspiration')addInspiration(btn.dataset.source,id);
      else if(action==='open-reward')openReward();
      else if(action==='save-reward')saveReward();
      else if(action==='add-expense')openExpense();
      else if(action==='save-expense')saveExpense();
      else if(action==='media')document.querySelector('[data-cr-media-input]')?.click();
      else if(action==='finish')openFinish();
      else if(action==='save-finish')finishMonth();
      else if(action==='history-details')openHistoryDetails(id);
      else if(action==='add-category')openCategory();
      else if(action==='edit-category')openCategory(id);
      else if(action==='save-category')saveCategory(id);
      else if(action==='archive-category'){const c=ensureStore()?.categories.find(x=>x.id===id);if(c){c.archived=!c.archived;c.active=!c.archived;persist(c.archived?'Категория в архиве':'Категория восстановлена');renderModule();}}
      else if(action==='open-ritual')openRitual();
      else if(action==='save-ritual')saveRitual();
      else if(action==='edit-active')editActive();
      else if(action==='save-active')saveActive();
      else if(action==='close-modal')closeModal();
    }catch(error){console.error('[V113 action]',action,error);window.toast?.(error?.message||'Не удалось выполнить действие');}
  }

  function handleChange(event) {
    const el=event.target,store=ensureStore();if(!store)return;
    if(el.matches('[data-cr-media-input]')){saveMedia(el.files).catch(error=>console.error('[V113 media]',error));return;}
    if(el.matches('[data-cr-inspiration-search]')){store.settings.inspirationSearch=el.value;inspirationPage=0;persist();renderModule();return;}
    if(el.matches('[data-cr-inspiration-category]')){store.settings.inspirationCategory=el.value;inspirationPage=0;persist();renderModule();return;}
    if(el.dataset.crChange==='category-active'){const c=store.categories.find(x=>x.id===el.dataset.id);if(c){c.active=el.checked;c.archived=false;persist();renderModule();}return;}
    if(el.dataset.crSetting){store.settings[el.dataset.crSetting]=el.checked;persist('Настройка сохранена');return;}
    if(el.dataset.crSettingValue){store.settings[el.dataset.crSettingValue]=el.type==='number'?num(el.value):el.value;persist('Настройка сохранена');return;}
  }

  function boot() {
    const store=ensureStore();activeTab=store?.settings?.activeTab||'current';ensureModal();rawRender=window.renderPremium;
    if(typeof rawRender==='function')window.renderPremium=function(...args){const result=rawRender.apply(this,args);setTimeout(schedule,12);return result;};
    document.addEventListener('click',handleClick,true);document.addEventListener('change',handleChange,true);document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modalRoot?.classList.contains('show')){event.preventDefault();closeModal();}},true);window.addEventListener('hashchange',()=>setTimeout(schedule,20));
    const observer=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))schedule();});observer.observe(document.getElementById('app')||document.body,{subtree:true,childList:true});schedule();setTimeout(schedule,180);
    window.SecondBrainMonthExperienceV113={ensureStore,render:renderModule,navigate,monthProgress,ownExperienceCount:()=>ownExperiences().length};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
