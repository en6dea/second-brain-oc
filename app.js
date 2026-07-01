'use strict';

const APP_NAME = 'Second Brain OS';
const BUILD = 'ru-light-tech-working-v49-20260701';
const STORE_KEY = 'secondBrainOS.v1';
const META_KEY = 'secondBrainOS.meta';
const SNAPSHOT_KEY = 'secondBrainOS.snapshots';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5);
const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const num = (v) => Number(String(v ?? 0).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, '')) || 0;
const money = (v) => `${Math.round(num(v)).toLocaleString('ru-RU')} ₽`;
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('ru-RU', {day:'numeric', month:'short'}); } catch(e) { return d || '—'; } };
const weekday = (d) => ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'][new Date(d).getDay()] || '—';

const navSections = [
  ['Главное', [
    ['dashboard', '▦', 'Главная'],
    ['timeline', '◷', 'Таймлайн'],
    ['notes', '✎', 'Заметки'],
    ['tasks', '✓', 'Задачи'],
    ['goals', '◎', 'Цели'],
    ['habits', '◌', 'Привычки'],
    ['finance', '₽', 'Финансы'],
    ['links', '⌁', 'Связи'],
    ['calendar', '□', 'Календарь'],
  ]],
  ['Папки', [
    ['folders', '☷', 'Папки'],
    ['resources', '▤', 'Ресурсы'],
    ['people', '○', 'Люди'],
    ['inbox', '↓', 'Входящие'],
    ['import', '⇣', 'Импорт'],
  ]],
  ['Система', [
    ['settings', '⚙', 'Настройки'],
    ['diagnostics', '✦', 'Диагностика'],
  ]]
];
const flatNav = navSections.flatMap(s => s[1]);
const mobileItems = ['dashboard','finance','tasks','notes','settings'];

const memoryStore = new Map();
function storageGet(key){ try { return localStorage.getItem(key); } catch(e) { return memoryStore.has(key) ? memoryStore.get(key) : null; } }
function storageSet(key, value){ try { localStorage.setItem(key, value); } catch(e) { memoryStore.set(key, String(value)); } }

const labelDefaults = {
  appName: 'Second Brain OS',
  appSubtitle: 'Собирай. Связывай. Действуй.',
  greeting: 'Доброе утро.',
  greetingSub: 'Вот что происходит в твоей системе сегодня.',
  quote: 'Ясность — это сила действовать осознанно.',
  todayCard: 'Сегодня',
  calendarCard: 'Календарь',
  goalsCard: 'Цели',
  tasksCard: 'Задачи',
  timelineCard: 'Таймлайн',
  linksCard: 'Связи / граф',
  habitsCard: 'Привычки',
  financeCard: 'Финансы',
  notesCard: 'Заметки',
  quickCard: 'Быстрый захват',
  folderWork: 'Работа',
  folderMoney: 'Деньги',
  folderLife: 'Жизнь',
  folderPeople: 'Люди',
  folderIdeas: 'Идеи',
  folderArchive: 'Архив'
};

function defaultState(){
  const t = todayKey(), m = monthKey();
  return {
    settings: {
      currentMonth: m,
      currentBalance: 24540,
      importActualBalance: '',
      dailyLimit: 4500,
      labels: {...labelDefaults},
      ui: {search:'', timelineMode:'week', importRows:[]}
    },
    categories: [
      {id:uid(), name:'Доход', type:'income', limit:0},
      {id:uid(), name:'Продукты', type:'expense', limit:35000},
      {id:uid(), name:'Дом', type:'expense', limit:25000},
      {id:uid(), name:'Транспорт', type:'expense', limit:15000},
      {id:uid(), name:'Кафе', type:'expense', limit:12000},
      {id:uid(), name:'Здоровье', type:'expense', limit:10000},
      {id:uid(), name:'Без категории', type:'expense', limit:0}
    ],
    operations: [
      {id:uid(), date:t, type:'income', amount:210000, category:'Доход', note:'Зарплата'},
      {id:uid(), date:t, type:'expense', amount:2450, category:'Продукты', note:'Магазин'},
      {id:uid(), date:t, type:'expense', amount:1200, category:'Кафе', note:'Обед'}
    ],
    tasks: [
      {id:uid(), title:'Проверить бюджет на неделю', area:'Финансы', due:t, time:'10:00', priority:'A', status:'В работе'},
      {id:uid(), title:'Разобрать входящие заметки', area:'Система', due:t, time:'13:00', priority:'B', status:'В работе'},
      {id:uid(), title:'Запланировать фокус-блок', area:'Работа', due:t, time:'16:00', priority:'B', status:'В работе'}
    ],
    calendarEvents: [
      {id:uid(), title:'Глубокая работа', date:t, time:'09:00', end:'11:00', color:'blue'},
      {id:uid(), title:'Синхронизация проекта', date:t, time:'11:00', end:'12:00', color:'green'},
      {id:uid(), title:'Созвон по финансам', date:t, time:'14:00', end:'15:00', color:'amber'},
      {id:uid(), title:'Ревью и план', date:t, time:'16:00', end:'17:00', color:'violet'}
    ],
    goals: [
      {id:uid(), title:'Запустить Second Brain OS', area:'Продукт', targetValue:100, currentValue:72, deadline:'2026-09-30', note:'Стабилизировать интерфейс и данные'},
      {id:uid(), title:'Собрать подушку безопасности', area:'Финансы', targetValue:300000, currentValue:165000, deadline:'2026-12-31', note:'Ежемесячный взнос'},
      {id:uid(), title:'Прочитать 24 книги', area:'Развитие', targetValue:24, currentValue:8, deadline:'2026-12-31', note:'2 книги в месяц'}
    ],
    habits: [
      {id:uid(), name:'Утренний план', area:'Фокус', target:'ежедневно', streak:12, marks:{[t]:true}},
      {id:uid(), name:'Учёт расходов', area:'Финансы', target:'ежедневно', streak:8, marks:{[t]:true}},
      {id:uid(), name:'Чтение', area:'Развитие', target:'20 минут', streak:15, marks:{}},
      {id:uid(), name:'Дневник', area:'Память', target:'вечером', streak:6, marks:{}}
    ],
    notes: [
      {id:uid(), title:'Идеи продукта', folder:'Работа', text:'Сделать быстрый захват, граф связей и редактируемые названия.', createdAt:t, tags:['продукт','идея']},
      {id:uid(), title:'Фокус и энергия', folder:'Жизнь', text:'Главная должна показывать только важное на сегодня.', createdAt:t, tags:['фокус']}
    ],
    people: [
      {id:uid(), name:'Полина', relation:'близкий человек', birthday:'1999-08-23', notes:'Идеи подарков и темы для разговоров можно хранить здесь.'}
    ],
    links: [
      {id:uid(), title:'Дорожная карта продукта', type:'Проект', target:'Second Brain OS', note:'Связь с целями и задачами'},
      {id:uid(), title:'Привычки', type:'Сфера', target:'Фокус', note:'Влияют на ежедневный ритм'},
      {id:uid(), title:'Финансовая цель', type:'Цель', target:'Финансы', note:'Связана с бюджетом'}
    ],
    resources: [
      {id:uid(), title:'Инструкция по загрузке на GitHub', type:'Документ', url:'', note:'Хранить чек-лист деплоя'}
    ],
    inbox: [
      {id:uid(), title:'Новая мысль', type:'Идея', text:'Добавить редактирование текстов интерфейса.', createdAt:t, status:'Новое'}
    ],
    folders: [
      {id:'work', labelKey:'folderWork', icon:'▤', note:'Проекты, задачи, заметки по работе'},
      {id:'money', labelKey:'folderMoney', icon:'₽', note:'Финансы, бюджет, долги, платежи'},
      {id:'life', labelKey:'folderLife', icon:'◌', note:'Привычки, здоровье, планы'},
      {id:'people', labelKey:'folderPeople', icon:'○', note:'Люди, связи, дни рождения'},
      {id:'ideas', labelKey:'folderIdeas', icon:'✎', note:'Идеи, ресурсы, входящие'},
      {id:'archive', labelKey:'folderArchive', icon:'□', note:'Старые записи и завершённое'}
    ],
    plannedPurchases: [], debts: [], books: [], media: [], ideas: [], trips: [], files: [], spheres: []
  };
}

function loadState(){
  try { return JSON.parse(storageGet(STORE_KEY) || 'null') || defaultState(); }
  catch(e){ return defaultState(); }
}
let page = location.hash ? location.hash.slice(1) : 'dashboard';
let state = normalize(loadState());

function normalize(s){
  const d = defaultState();
  if(!s || typeof s !== 'object' || Array.isArray(s)) s = {};
  s.settings = {...d.settings, ...(s.settings || {})};
  s.settings.labels = {...labelDefaults, ...(s.settings.labels || {})};
  s.settings.ui = {...d.settings.ui, ...(s.settings.ui || {})};
  ['categories','operations','tasks','calendarEvents','goals','habits','notes','people','links','resources','inbox','folders','plannedPurchases','debts','books','media','ideas','trips','files','spheres'].forEach(k => {
    if(!Array.isArray(s[k])) s[k] = d[k] || [];
  });
  if(!s.folders.length) s.folders = d.folders;
  if(!s.links.length) s.links = d.links;
  s.categories = s.categories.map(c => ({id:c.id || uid(), name:c.name || c.title || 'Категория', type:c.type || 'expense', limit:num(c.limit)}));
  s.operations = s.operations.map(o => ({id:o.id || uid(), date:o.date || todayKey(), type:o.type || (num(o.amount) < 0 ? 'expense' : 'income'), amount:Math.abs(num(o.amount)), category:o.category || 'Без категории', note:o.note || o.comment || ''}));
  s.tasks = s.tasks.map(t => ({id:t.id || uid(), title:t.title || t.name || 'Задача', area:t.area || t.folder || 'Общее', due:t.due || t.date || todayKey(), time:t.time || '', priority:t.priority || 'B', status:t.status || 'В работе'}));
  s.notes = s.notes.map(n => ({id:n.id || uid(), title:n.title || n.name || 'Заметка', folder:n.folder || 'Личное', text:n.text || n.note || n.content || '', createdAt:n.createdAt || n.date || todayKey(), tags:Array.isArray(n.tags) ? n.tags : []}));
  s.goals = s.goals.map(g => ({id:g.id || uid(), title:g.title || g.name || 'Цель', area:g.area || 'Общее', targetValue:num(g.targetValue || g.target || 100), currentValue:num(g.currentValue || g.current || 0), deadline:g.deadline || '', note:g.note || g.week52 || ''}));
  s.habits = s.habits.map(h => ({id:h.id || uid(), name:h.name || h.title || 'Привычка', area:h.area || 'Фокус', target:h.target || 'ежедневно', streak:num(h.streak), marks:h.marks || {}}));
  return s;
}
function save(snapshot=false){
  state = normalize(state);
  storageSet(STORE_KEY, JSON.stringify(state));
  storageSet(META_KEY, JSON.stringify({app:APP_NAME, build:BUILD, updatedAt:new Date().toISOString()}));
  storageSet('secondBrainOS.currentBuild', BUILD);
  if(snapshot) saveSnapshot();
}
function saveSnapshot(){
  try { const list = JSON.parse(storageGet(SNAPSHOT_KEY) || '[]'); list.unshift({build:BUILD, createdAt:new Date().toISOString(), state}); storageSet(SNAPSHOT_KEY, JSON.stringify(list.slice(0, 10))); } catch(e){}
}
function arr(k){ if(!Array.isArray(state[k])) state[k] = []; return state[k]; }
function lab(k, fallback){ return state.settings.labels[k] || fallback || labelDefaults[k] || k; }
function ui(k, def){ return state.settings.ui[k] ?? def; }
function setUI(k, v){ state.settings.ui[k] = v; save(); render(); }
function formVal(id){ return $('#'+id)?.value ?? ''; }
function checked(id){ return Boolean($('#'+id)?.checked); }
function field(label,id,val='',type='text',extra=''){ return `<div class="field"><label>${esc(label)}</label><input id="${id}" type="${type}" value="${esc(val)}" ${extra}></div>`; }
function area(label,id,val=''){ return `<div class="field" style="grid-column:1/-1"><label>${esc(label)}</label><textarea id="${id}">${esc(val)}</textarea></div>`; }
function selectField(label,id,options,val=''){
  return `<div class="field"><label>${esc(label)}</label><select id="${id}">${options.map(o => `<option value="${esc(o[0])}" ${String(o[0])===String(val)?'selected':''}>${esc(o[1])}</option>`).join('')}</select></div>`;
}
function toast(msg){ const t = $('#toast'); if(!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }
function openModal(title, html){ $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html; $('#modal').classList.add('show'); $('#modal').setAttribute('aria-hidden','false'); }
function closeModal(){ $('#modal').classList.remove('show'); $('#modal').setAttribute('aria-hidden','true'); }
function go(p){ page = p || 'dashboard'; location.hash = page; render(); }
function pct(cur, target){ target = Math.max(1, num(target)); return Math.max(0, Math.min(100, Math.round(num(cur) / target * 100))); }
function todayEvents(){ return arr('calendarEvents').filter(e => (e.date || todayKey()) === todayKey()).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||''))); }
function openTasks(){ return arr('tasks').filter(t => t.status !== 'Готово'); }
function monthOps(){ const m = monthKey(); return arr('operations').filter(o => String(o.date || '').startsWith(m)); }
function income(){ return monthOps().filter(o => o.type === 'income').reduce((a,o)=>a+num(o.amount),0); }
function expense(){ return monthOps().filter(o => o.type !== 'income').reduce((a,o)=>a+num(o.amount),0); }
function balance(){ return num(state.settings.importActualBalance || state.settings.currentBalance) + income() - expense(); }
function categoryOptions(){ return arr('categories').map(c => [c.name, c.name]); }
function empty(t){ return `<div class="empty-state">${esc(t)}</div>`; }
function pill(t, cls='blue'){ return `<span class="pill ${cls}">${esc(t)}</span>`; }
function progress(p){ return `<div class="progress" style="--p:${Math.max(0,Math.min(100,num(p)))}%"><b></b></div>`; }

function render(){
  document.title = lab('appName','Second Brain OS');
  const app = $('#app');
  app.innerHTML = `${sidebar()}<main class="main">${topbar()}${pageView()}</main>${mobileTabs()}<div class="version-badge">${BUILD}</div>`;
}
function sidebar(){
  return `<aside class="sidebar">
    <div class="brand">
      <div class="logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3c-3.5 0-6.5 2.7-6.5 6.1 0 2.7 1.7 4.7 4 5.7V21l2.8-2.8h.2c3.5 0 6-2.7 6-6.1S15.5 3 12 3Z" stroke="currentColor" stroke-width="1.8"/><path d="M9.2 8.2h5.6M9.2 11.3h5.6M9.2 14.4h3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></div>
      <div><div class="brand-title">${esc(lab('appName'))}</div><div class="brand-sub">${esc(lab('appSubtitle'))}</div></div>
    </div>
    <div class="sidebar-tools">
      <label class="mini-search">⌕<input id="sideSearch" value="${esc(ui('search',''))}" placeholder="Поиск" data-action="liveSearch"></label>
      <button class="icon-btn" data-action="editTexts" title="Редактировать названия">✎</button>
    </div>
    <div class="nav-scroll">${navSections.map(([title, items]) => `<section class="nav-section"><div class="nav-title">${esc(title)}</div>${items.map(navBtn).join('')}</section>`).join('')}</div>
    <section class="sidebar-card">
      <h3>Фокус дня</h3><p>${esc(lab('quote'))}</p><div class="focus-bar"><b style="width:${Math.min(100, Math.max(10, Math.round(openTasks().filter(t=>t.priority==='A').length ? 72 : 45)))}%"></b></div>
    </section>
    <div class="sidebar-bottom"><span>${BUILD}</span><button class="link" data-action="clearCaches">сброс кэша</button></div>
  </aside>`;
}
function navBtn(item){
  const [key, ico, fallback] = item;
  const name = lab('nav_'+key, fallback);
  const badge = key === 'tasks' ? openTasks().length : key === 'inbox' ? arr('inbox').filter(x=>x.status!=='Готово').length : '';
  return `<button class="nav-btn ${page===key?'active':''}" data-go="${key}"><span class="nav-ico">${ico}</span><span class="nav-name">${esc(name)}</span>${badge!==''?`<span class="nav-badge">${badge}</span>`:''}</button>`;
}
function topbar(){
  return `<header class="topbar">
    <div class="topbar-left"><b>${esc(lab('appName'))}</b><span>${new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</span></div>
    <label class="search">⌕<input id="globalSearch" value="${esc(ui('search',''))}" placeholder="Найти задачу, заметку, цель..." data-action="liveSearch"><span class="kbd">Ctrl K</span></label>
    <div class="top-actions">
      <button class="primary-btn" data-action="quickCapture"><span>＋</span><span>Быстрый захват</span></button>
      <button class="icon-btn" data-action="notifications" title="Уведомления">♡</button>
      <button class="icon-btn" data-action="editTexts" title="Редактировать тексты">✎</button>
    </div>
  </header>`;
}
function mobileTabs(){
  return `<nav class="mobile-tabs">${mobileItems.map(k => { const it = flatNav.find(x=>x[0]===k); return `<button class="${page===k?'active':''}" data-go="${k}"><div>${it?.[1]||'•'}</div>${esc(lab('nav_'+k,it?.[2]||k))}</button>`; }).join('')}</nav>`;
}
function pageView(){
  const views = {dashboard, timeline: timelinePage, notes: notesPage, tasks: tasksPage, goals: goalsPage, habits: habitsPage, finance: financePage, links: linksPage, calendar: calendarPage, folders: foldersPage, resources: resourcesPage, people: peoplePage, inbox: inboxPage, import: importPage, settings: settingsPage, diagnostics: diagnosticsPage};
  return (views[page] || dashboard)();
}
function hero(title, sub){ return `<div class="hero"><div><h1>${esc(title)}</h1><p>${esc(sub || '')}</p></div><div class="date-pill">${weekday(todayKey())}, ${fmtDate(todayKey())}</div></div>`; }

function dashboard(){
  const goalsAvg = arr('goals').length ? Math.round(arr('goals').reduce((a,g)=>a+pct(g.currentValue,g.targetValue),0)/arr('goals').length) : 0;
  return `<section class="page">${hero(lab('greeting'), lab('greetingSub'))}
    <section class="grid cols-4">
      ${metricCard(lab('todayCard'), '☼', `${openTasks().length}`, 'задач открыто', `${todayEvents().length} событий сегодня`, 66, 'blue', 'tasks')}
      ${calendarMiniCard()}
      ${metricCard(lab('goalsCard'), '◎', `${goalsAvg}%`, 'средний прогресс', `${arr('goals').length} активных целей`, goalsAvg, 'violet', 'goals')}
      ${tasksMiniCard()}
    </section>
    <section class="dash-grid">
      ${timelineWidget()}
      ${linksWidget()}
    </section>
    <section class="lower-grid">
      ${habitsWidget()}
      ${financeWidget()}
      ${notesQuickWidget()}
    </section>
    <section class="grid cols-3">
      ${quickCaptureWidget()}
      ${folderPreviewWidget()}
      ${inboxWidget()}
    </section>
  </section>`;
}
function metricCard(title, icon, value, sub, foot, p, cls, to){
  return `<article class="card metric-card"><div class="metric-top"><span class="metric-icon">${icon}</span><button class="link" data-go="${to}">Открыть</button></div><div><div class="metric-title">${esc(title)}</div><div class="value ${cls}">${esc(value)}</div><p class="muted small">${esc(sub)}</p></div><div class="metric-lines">${progress(p)}<small class="muted">${esc(foot)}</small></div></article>`;
}
function calendarMiniCard(){
  const ev = todayEvents();
  return `<article class="card metric-card"><div class="card-head"><div><h3>${esc(lab('calendarCard'))}</h3><p class="muted small">Сегодня</p></div><button class="link" data-go="calendar">Весь календарь</button></div><div class="list">${ev.slice(0,4).map(e => `<div class="stat-row"><b>${esc(e.time||'—')}</b><span class="muted small">${esc(e.title)}</span></div>`).join('') || empty('Нет событий')}</div><button class="link" data-action="addEvent">+ Добавить событие</button></article>`;
}
function tasksMiniCard(){
  const tasks = openTasks().slice(0,3);
  return `<article class="card metric-card"><div class="card-head"><div><h3>${esc(lab('tasksCard'))}</h3><p class="muted small">Сегодня / скоро</p></div><button class="link" data-go="tasks">Все</button></div><div class="list">${tasks.map(t => taskLine(t, true)).join('') || empty('Задач нет')}</div><button class="link" data-action="addTask">+ Новая задача</button></article>`;
}
function timelineWidget(){
  const days = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
  const todayIdx = Math.max(0, (new Date().getDay()+6)%7);
  const events = todayEvents();
  const colors = ['blue','green','amber','violet'];
  let cells = `<div class="tl-cell tl-head"></div>` + days.map((d,i)=>`<div class="tl-cell tl-head"><div>${d}</div><span class="${i===todayIdx?'tl-today':''}">${i+1}</span></div>`).join('');
  ['09:00','12:00','15:00','18:00'].forEach((time, r) => {
    cells += `<div class="tl-cell tl-time">${time}</div>`;
    for(let i=0;i<7;i++){
      const ev = i===todayIdx ? events[r] : null;
      cells += `<div class="tl-cell">${ev?`<button class="event-block event-${ev.color||colors[r%4]}" data-action="editEvent" data-id="${ev.id}">${esc(ev.title)}<br><small>${esc(ev.time||'')}</small></button>`:''}</div>`;
    }
  });
  return `<article class="card timeline-card"><div class="card-head"><div><h3>${esc(lab('timelineCard'))}</h3><p class="muted small">Неделя, фокус-блоки и события</p></div><div class="timeline-toolbar"><button class="seg ${ui('timelineMode','week')==='day'?'active':''}" data-action="setTimeline" data-mode="day">День</button><button class="seg ${ui('timelineMode','week')==='week'?'active':''}" data-action="setTimeline" data-mode="week">Неделя</button><button class="seg ${ui('timelineMode','week')==='month'?'active':''}" data-action="setTimeline" data-mode="month">Месяц</button></div></div><div class="timeline">${cells}</div><div class="actions"><button class="btn secondary small" data-action="addEvent">+ Добавить блок</button><button class="btn secondary small" data-go="timeline">Открыть таймлайн</button></div></article>`;
}
function linksWidget(){
  const nodes = [
    [50,50,'Second Brain OS','main'],[27,30,'Цели',''],[69,24,'Заметки',''],[78,58,'Финансы',''],[31,67,'Привычки',''],[17,53,'Задачи',''],[58,78,'Люди',''],[44,20,'Проекты','']
  ];
  const lines = [[50,50,27,30],[50,50,69,24],[50,50,78,58],[50,50,31,67],[50,50,17,53],[50,50,58,78],[50,50,44,20],[27,30,44,20],[69,24,78,58],[31,67,58,78]];
  const lineHtml = lines.map(([x1,y1,x2,y2]) => { const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy), deg=Math.atan2(dy,dx)*180/Math.PI; return `<span class="graph-line" style="left:${x1}%;top:${y1}%;width:${len}%;transform:rotate(${deg}deg)"></span>`; }).join('');
  const nodeHtml = nodes.map(([x,y,t,c]) => `<button class="node ${c}" style="left:calc(${x}% - ${c==='main'?35:9}px);top:calc(${y}% - ${c==='main'?35:9}px)" data-action="addLink">${c==='main'?'☷':''}<small>${esc(t)}</small></button>`).join('');
  return `<article class="card graph-card"><div class="card-head"><div><h3>${esc(lab('linksCard'))}</h3><p class="muted small">Цель → задача → заметка → финансы → человек</p></div><button class="link" data-go="links">Полный граф</button></div><div class="graph">${lineHtml}${nodeHtml}</div><div class="graph-legend">${pill('Проекты','blue')}${pill('Темы','green')}${pill('Ресурсы','violet')}${pill('Заметки','amber')}</div></article>`;
}
function habitsWidget(){
  const days = ['П','В','С','Ч','П','С','В'];
  return `<article class="card"><div class="card-head"><div><h3>${esc(lab('habitsCard'))}</h3><p class="muted small">Ритм недели</p></div><button class="link" data-go="habits">Все</button></div><div class="list">${arr('habits').slice(0,5).map(h => `<div class="item"><span class="metric-icon">◌</span><div class="item-main"><b>${esc(h.name)}</b><small>${esc(h.area)} · серия ${num(h.streak)} дней</small></div><div class="tag-cloud">${days.map((d,i)=>`<button class="check ${h.marks?.[todayKey()]&&i===days.length-1?'done':''}" data-action="toggleHabit" data-id="${h.id}">${h.marks?.[todayKey()]&&i===days.length-1?'✓':''}</button>`).join('')}</div></div>`).join('') || empty('Привычек нет')}</div><button class="link" data-action="addHabit">+ Добавить привычку</button></article>`;
}
function financeWidget(){
  return `<article class="card"><div class="card-head"><div><h3>${esc(lab('financeCard'))}</h3><p class="muted small">Текущий месяц</p></div><button class="link" data-go="finance">Открыть</button></div><div class="value big">${money(balance())}</div><p class="green small">+${money(Math.max(0, income()-expense()))} к плану месяца</p><div class="grid cols-3" style="margin-top:14px"><div><small class="muted">Доход</small><b class="green">${money(income())}</b></div><div><small class="muted">Расходы</small><b>${money(expense())}</b></div><div><small class="muted">Лимит дня</small><b>${money(state.settings.dailyLimit)}</b></div></div><div style="margin-top:16px">${progress(Math.min(100, expense() / Math.max(1, income()) * 100))}</div><div class="actions"><button class="btn small" data-action="addIncome">+ Доход</button><button class="btn secondary small" data-action="addExpense">+ Расход</button></div></article>`;
}
function notesQuickWidget(){
  return `<article class="card"><div class="card-head"><div><h3>${esc(lab('notesCard'))}</h3><p class="muted small">Последние записи</p></div><button class="link" data-go="notes">Все</button></div><div class="list">${arr('notes').slice(0,4).map(n => `<button class="item" data-action="editNote" data-id="${n.id}"><span class="metric-icon">✎</span><span class="item-main"><b>${esc(n.title)}</b><small>${esc(n.folder)} · ${fmtDate(n.createdAt)}</small></span></button>`).join('') || empty('Заметок нет')}</div><button class="link" data-action="addNote">+ Новая заметка</button></article>`;
}
function quickCaptureWidget(){
  return `<article class="card"><div class="card-head"><div><h3>${esc(lab('quickCard'))}</h3><p class="muted small">Создать без лишних шагов</p></div></div><div class="quick-grid"><button class="quick-action" data-action="addNote"><i>✎</i>Заметка</button><button class="quick-action" data-action="addTask"><i>✓</i>Задача</button><button class="quick-action" data-action="addLink"><i>⌁</i>Связь</button><button class="quick-action" data-action="addEvent"><i>□</i>Событие</button></div></article>`;
}
function folderPreviewWidget(){
  return `<article class="card"><div class="card-head"><div><h3>Папки</h3><p class="muted small">Названия можно менять</p></div><button class="link" data-go="folders">Все</button></div><div class="list">${arr('folders').slice(0,4).map(f => `<div class="item"><span class="metric-icon">${esc(f.icon)}</span><div class="item-main"><b>${esc(lab(f.labelKey, f.id))}</b><small>${esc(f.note)}</small></div><button class="icon-btn" data-action="editFolder" data-id="${esc(f.id)}">✎</button></div>`).join('')}</div></article>`;
}
function inboxWidget(){
  return `<article class="card"><div class="card-head"><div><h3>Входящие</h3><p class="muted small">Быстро сохранённое</p></div><button class="link" data-go="inbox">Открыть</button></div><div class="list">${arr('inbox').slice(0,3).map(i => `<div class="item"><span class="metric-icon">↓</span><div class="item-main"><b>${esc(i.title)}</b><small>${esc(i.type)} · ${esc(i.status||'Новое')}</small></div><button class="icon-btn" data-action="inboxToNote" data-id="${i.id}">→</button></div>`).join('') || empty('Входящие пусты')}</div></article>`;
}
function taskLine(t, compact=false){ return `<div class="item"><button class="check ${t.status==='Готово'?'done':''}" data-action="toggleTask" data-id="${t.id}">${t.status==='Готово'?'✓':''}</button><div class="item-main"><b>${esc(t.title)}</b><small>${esc(t.area)} ${t.due?'· '+fmtDate(t.due):''} ${t.time?'· '+esc(t.time):''}</small></div>${!compact?`<div class="item-actions"><button class="icon-btn" data-action="editTask" data-id="${t.id}">✎</button><button class="icon-btn" data-action="deleteTask" data-id="${t.id}">×</button></div>`:''}</div>`; }

function timelinePage(){ return `<section class="page">${hero(lab('nav_timeline','Таймлайн'), 'Все события и фокус-блоки в одном месте.')}${timelineWidget()}<section class="card"><div class="card-head"><h3>Список событий</h3><button class="btn" data-action="addEvent">Добавить</button></div><div class="list">${arr('calendarEvents').map(e => `<div class="item"><span class="metric-icon">□</span><div class="item-main"><b>${esc(e.title)}</b><small>${fmtDate(e.date)} · ${esc(e.time||'')}–${esc(e.end||'')}</small></div><button class="icon-btn" data-action="editEvent" data-id="${e.id}">✎</button><button class="icon-btn" data-action="deleteEvent" data-id="${e.id}">×</button></div>`).join('') || empty('Нет событий')}</div></section></section>`; }
function tasksPage(){ const q = ui('search','').toLowerCase(); const list = arr('tasks').filter(t => !q || JSON.stringify(t).toLowerCase().includes(q)); return `<section class="page">${hero(lab('nav_tasks','Задачи'), 'Активные дела, статусы и приоритеты.')}${summaryCards([['Открыто',openTasks().length,'blue'],['Готово',arr('tasks').filter(t=>t.status==='Готово').length,'green'],['Сегодня',arr('tasks').filter(t=>t.due===todayKey()).length,'violet']])}<section class="card"><div class="card-head"><h3>Все задачи</h3><button class="btn" data-action="addTask">Добавить задачу</button></div><div class="list">${list.map(t => taskLine(t)).join('') || empty('Задач нет')}</div></section></section>`; }
function notesPage(){ const q = ui('search','').toLowerCase(); const list = arr('notes').filter(n => !q || JSON.stringify(n).toLowerCase().includes(q)); return `<section class="page">${hero(lab('nav_notes','Заметки'), 'Память, идеи, дневник и рабочие записи.')}${summaryCards([['Заметок',list.length,'blue'],['Папок',new Set(list.map(n=>n.folder)).size,'violet'],['Входящие',arr('inbox').length,'amber']])}<section class="card"><div class="card-head"><h3>Все заметки</h3><button class="btn" data-action="addNote">Добавить заметку</button></div><div class="grid cols-2">${list.map(n => `<article class="card"><div class="card-head"><div><h3>${esc(n.title)}</h3><p class="muted small">${esc(n.folder)} · ${fmtDate(n.createdAt)}</p></div><div class="item-actions"><button class="icon-btn" data-action="editNote" data-id="${n.id}">✎</button><button class="icon-btn" data-action="deleteNote" data-id="${n.id}">×</button></div></div><p>${esc(n.text).slice(0,260)}</p><div class="tag-cloud">${(n.tags||[]).map(t=>pill(t,'blue')).join('')}</div></article>`).join('') || empty('Заметок нет')}</div></section></section>`; }
function goalsPage(){ return `<section class="page">${hero(lab('nav_goals','Цели'), 'SMART-направления и прогресс.')}${summaryCards([['Целей',arr('goals').length,'blue'],['Средний прогресс',arr('goals').length?Math.round(arr('goals').reduce((a,g)=>a+pct(g.currentValue,g.targetValue),0)/arr('goals').length)+'%':'0%','green'],['Дедлайны',arr('goals').filter(g=>g.deadline).length,'violet']])}<section class="grid cols-3">${arr('goals').map(g => `<article class="card"><div class="card-head"><div><h3>${esc(g.title)}</h3><p class="muted small">${esc(g.area)} · дедлайн ${esc(g.deadline||'не указан')}</p></div><button class="icon-btn" data-action="editGoal" data-id="${g.id}">✎</button></div><div class="value">${pct(g.currentValue,g.targetValue)}%</div>${progress(pct(g.currentValue,g.targetValue))}<p class="muted small">${money(g.currentValue)} из ${money(g.targetValue)}</p><p>${esc(g.note||'')}</p></article>`).join('') || empty('Целей нет')}</section><button class="btn" data-action="addGoal">Добавить цель</button></section>`; }
function habitsPage(){ return `<section class="page">${hero(lab('nav_habits','Привычки'), 'Повторения, серии и контроль дня.')}<section class="card"><div class="card-head"><h3>Все привычки</h3><button class="btn" data-action="addHabit">Добавить привычку</button></div><div class="list">${arr('habits').map(h => `<div class="item"><button class="check ${h.marks?.[todayKey()]?'done':''}" data-action="toggleHabit" data-id="${h.id}">${h.marks?.[todayKey()]?'✓':''}</button><div class="item-main"><b>${esc(h.name)}</b><small>${esc(h.area)} · ${esc(h.target)} · серия ${num(h.streak)} дней</small></div><button class="icon-btn" data-action="editHabit" data-id="${h.id}">✎</button><button class="icon-btn" data-action="deleteHabit" data-id="${h.id}">×</button></div>`).join('') || empty('Привычек нет')}</div></section></section>`; }
function financePage(){ return `<section class="page">${hero(lab('nav_finance','Финансы'), 'Доходы, расходы, категории и фактический баланс.')}${summaryCards([['Баланс',money(balance()),'blue'],['Доход',money(income()),'green'],['Расход',money(expense()),'amber']])}<section class="grid cols-2"><article class="card"><div class="card-head"><h3>Операции</h3><div class="actions"><button class="btn small" data-action="addIncome">+ Доход</button><button class="btn secondary small" data-action="addExpense">+ Расход</button></div></div>${operationsTable(arr('operations').slice(0,12))}</article><article class="card"><div class="card-head"><h3>Категории</h3><button class="btn" data-action="addCategory">Добавить</button></div><div class="list">${arr('categories').map(c => `<div class="item"><span class="metric-icon">${c.type==='income'?'＋':'−'}</span><div class="item-main"><b>${esc(c.name)}</b><small>${c.type==='income'?'Доход':'Расход'} · лимит ${money(c.limit)}</small></div><button class="icon-btn" data-action="editCategory" data-id="${c.id}">✎</button><button class="icon-btn" data-action="deleteCategory" data-id="${c.id}">×</button></div>`).join('')}</div></article></section></section>`; }
function operationsTable(list){ return `<div class="table-card"><div class="table-head"><span>Описание</span><span>Категория</span><span>Дата</span><span>Сумма</span><span>Действия</span></div>${list.map(o => `<div class="table-row"><span><b>${esc(o.note||'Операция')}</b><small class="muted">${o.type==='income'?'Доход':'Расход'}</small></span><span>${esc(o.category)}</span><span>${fmtDate(o.date)}</span><span class="${o.type==='income'?'green':'red'}">${o.type==='income'?'+':'−'} ${money(o.amount)}</span><span><button class="btn secondary small" data-action="editOperation" data-id="${o.id}">Изменить</button><button class="btn danger small" data-action="deleteOperation" data-id="${o.id}">Удалить</button></span></div>`).join('') || empty('Операций нет')}</div>`; }
function linksPage(){ return `<section class="page">${hero(lab('nav_links','Связи'), 'Граф смыслов: цели, задачи, заметки, люди и финансы.')}${linksWidget()}<section class="card"><div class="card-head"><h3>Все связи</h3><button class="btn" data-action="addLink">Добавить связь</button></div><div class="list">${arr('links').map(l => `<div class="item"><span class="metric-icon">⌁</span><div class="item-main"><b>${esc(l.title)}</b><small>${esc(l.type)} → ${esc(l.target)}</small></div><button class="icon-btn" data-action="editLink" data-id="${l.id}">✎</button><button class="icon-btn" data-action="deleteLink" data-id="${l.id}">×</button></div>`).join('') || empty('Связей нет')}</div></section></section>`; }
function calendarPage(){ return `<section class="page">${hero(lab('nav_calendar','Календарь'), 'События и фокус-блоки по датам.')}${calendarMiniCard()}<section class="card"><div class="card-head"><h3>События</h3><button class="btn" data-action="addEvent">Добавить</button></div><div class="list">${arr('calendarEvents').map(e => `<div class="item"><span class="metric-icon">□</span><div class="item-main"><b>${esc(e.title)}</b><small>${esc(e.date)} · ${esc(e.time||'')}–${esc(e.end||'')}</small></div><button class="icon-btn" data-action="editEvent" data-id="${e.id}">✎</button><button class="icon-btn" data-action="deleteEvent" data-id="${e.id}">×</button></div>`).join('') || empty('Событий нет')}</div></section></section>`; }
function foldersPage(){ return `<section class="page">${hero(lab('nav_folders','Папки'), 'Здесь можно менять названия папок и описания.')}${summaryCards([['Папок',arr('folders').length,'blue'],['Заметок',arr('notes').length,'violet'],['Связей',arr('links').length,'green']])}<section class="grid cols-3">${arr('folders').map(f => `<article class="card"><div class="card-head"><div><span class="metric-icon">${esc(f.icon)}</span><h3 style="margin-top:10px">${esc(lab(f.labelKey,f.id))}</h3></div><button class="icon-btn" data-action="editFolder" data-id="${esc(f.id)}">✎</button></div><p class="muted">${esc(f.note)}</p><div class="actions"><button class="btn secondary small" data-action="openFolder" data-id="${esc(f.id)}">Открыть</button></div></article>`).join('')}</section></section>`; }
function resourcesPage(){ return `<section class="page">${hero(lab('nav_resources','Ресурсы'), 'Ссылки, документы и полезные материалы.')}<section class="card"><div class="card-head"><h3>Ресурсы</h3><button class="btn" data-action="addResource">Добавить</button></div><div class="list">${arr('resources').map(r => `<div class="item"><span class="metric-icon">▤</span><div class="item-main"><b>${esc(r.title)}</b><small>${esc(r.type)} ${r.url?'· '+esc(r.url):''}</small></div><button class="icon-btn" data-action="editResource" data-id="${r.id}">✎</button><button class="icon-btn" data-action="deleteResource" data-id="${r.id}">×</button></div>`).join('') || empty('Ресурсов нет')}</div></section></section>`; }
function peoplePage(){ return `<section class="page">${hero(lab('nav_people','Люди'), 'Контакты, идеи подарков и темы разговоров.')}<section class="card"><div class="card-head"><h3>Люди</h3><button class="btn" data-action="addPerson">Добавить</button></div><div class="grid cols-3">${arr('people').map(p => `<article class="card"><div class="card-head"><div><h3>${esc(p.name)}</h3><p class="muted small">${esc(p.relation||'')} ${p.birthday?'· '+esc(p.birthday):''}</p></div><button class="icon-btn" data-action="editPerson" data-id="${p.id}">✎</button></div><p>${esc(p.notes||'')}</p></article>`).join('') || empty('Людей нет')}</div></section></section>`; }
function inboxPage(){ return `<section class="page">${hero(lab('nav_inbox','Входящие'), 'Сюда попадает всё, что нужно разобрать.')}<section class="card"><div class="card-head"><h3>Входящие</h3><button class="btn" data-action="quickCapture">Добавить</button></div><div class="list">${arr('inbox').map(i => `<div class="item"><span class="metric-icon">↓</span><div class="item-main"><b>${esc(i.title)}</b><small>${esc(i.type)} · ${fmtDate(i.createdAt)}</small><small>${esc(i.text||'')}</small></div><button class="btn secondary small" data-action="inboxToNote" data-id="${i.id}">В заметку</button><button class="icon-btn" data-action="deleteInbox" data-id="${i.id}">×</button></div>`).join('') || empty('Входящие пусты')}</div></section></section>`; }
function importPage(){ return `<section class="page">${hero(lab('nav_import','Импорт'), 'Импорт операций с проверкой по категориям и фактическим балансом.')}<section class="grid cols-2"><article class="card"><div class="card-head"><h3>Загрузка файла</h3><button class="btn" data-action="pickImportFile">Выбрать файл</button></div><p class="muted">Поддерживаются JSON и простые CSV/текстовые выгрузки. После загрузки каждая строка выпадет для проверки: можно поменять категорию, сумму, тип и удалить лишнее.</p><div class="form-grid">${field('Фактический баланс после импорта','actualBalance',state.settings.importActualBalance || state.settings.currentBalance,'number')}${selectField('Категория по умолчанию','defaultImportCategory',categoryOptions(),'Без категории')}</div><div class="actions"><button class="btn secondary" data-action="saveActualBalance">Сохранить баланс</button><button class="btn secondary" data-action="exportData">Экспорт JSON</button></div></article><article class="card"><div class="card-head"><h3>Проверка строк</h3><button class="btn" data-action="applyImportRows">Импортировать выбранное</button></div>${importPreview()}</article></section></section>`; }
function importPreview(){ const rows = ui('importRows', []); if(!rows.length) return empty('Файл ещё не выбран. После выбора строки появятся здесь.'); return `<div class="import-preview">${rows.map((r,i)=>`<div class="import-row" data-import-index="${i}"><input data-import-field="note" value="${esc(r.note)}"><input data-import-field="amount" value="${esc(r.amount)}"><select data-import-field="category">${categoryOptions().map(c=>`<option value="${esc(c[0])}" ${c[0]===r.category?'selected':''}>${esc(c[1])}</option>`).join('')}</select><select data-import-field="type"><option value="expense" ${r.type==='expense'?'selected':''}>Расход</option><option value="income" ${r.type==='income'?'selected':''}>Доход</option></select><button class="btn danger small" data-action="removeImportRow" data-index="${i}">Удалить</button></div>`).join('')}</div>`; }
function settingsPage(){ return `<section class="page">${hero(lab('nav_settings','Настройки'), 'Русские названия, папки, тексты и обслуживание приложения.')}<section class="grid cols-2"><article class="card"><div class="card-head"><h3>Названия и тексты</h3><button class="btn" data-action="editTexts">Редактировать всё</button></div><p class="muted">Можно менять название приложения, подпись, приветствие, названия карточек, пункты меню и названия папок. Всё сохраняется в браузере.</p></article><article class="card"><div class="card-head"><h3>Данные</h3></div><div class="actions"><button class="btn secondary" data-action="exportData">Экспорт</button><button class="btn secondary" data-action="pickImportFile">Импорт</button><button class="btn danger" data-action="clearCaches">Очистить кэш</button></div></article></section><section class="card"><div class="card-head"><h3>Быстрое редактирование папок</h3><button class="btn secondary" data-go="folders">Открыть папки</button></div><div class="list">${arr('folders').map(f => `<div class="item"><span class="metric-icon">${esc(f.icon)}</span><div class="item-main"><b>${esc(lab(f.labelKey,f.id))}</b><small>${esc(f.note)}</small></div><button class="icon-btn" data-action="editFolder" data-id="${esc(f.id)}">✎</button></div>`).join('')}</div></section></section>`; }
function diagnosticsPage(){ return `<section class="page">${hero(lab('nav_diagnostics','Диагностика'), 'Проверка версии, кэша и данных.')}<section class="grid cols-3">${summaryCards([['Версия',BUILD,'blue'],['Хранилище',storageGet(STORE_KEY)?'OK':'пусто','green'],['Кнопки','делегированы','violet']])}</section><section class="card"><h3>Что проверять после загрузки</h3><div class="list"><div class="item"><span class="check done">✓</span><div class="item-main"><b>Бейдж версии</b><small>${BUILD}</small></div></div><div class="item"><span class="check done">✓</span><div class="item-main"><b>Все пункты меню открываются</b><small>Главная, таймлайн, заметки, задачи, цели, финансы, импорт, настройки</small></div></div><div class="item"><span class="check done">✓</span><div class="item-main"><b>Редактирование текстов</b><small>Кнопка ✎ вверху и в сайдбаре</small></div></div></div><div class="actions"><button class="btn" data-action="runSelfTest">Запустить самопроверку</button><button class="btn secondary" data-action="clearCaches">Очистить кэш</button></div></section></section>`; }
function summaryCards(items){ return `<section class="grid cols-${Math.min(4, Math.max(2, items.length))}">${items.map(([t,v,c]) => `<article class="card"><p class="muted small">${esc(t)}</p><div class="value ${c||'blue'}">${esc(v)}</div></article>`).join('')}</section>`; }

function addTask(){ openModal('Новая задача', `<div class="form-grid">${field('Название','taskTitle')}${field('Сфера / папка','taskArea','Общее')}${field('Дата','taskDue',todayKey(),'date')}${field('Время','taskTime','','time')}${selectField('Приоритет','taskPriority',[['A','A — важно'],['B','B — нормально'],['C','C — потом']],'B')}${selectField('Статус','taskStatus',[['В работе','В работе'],['Готово','Готово']],'В работе')}</div><div class="actions"><button class="btn" data-action="saveTask">Сохранить</button></div>`); }
function editTask(id){ const t=arr('tasks').find(x=>x.id===id); if(!t) return; openModal('Редактировать задачу', `<div class="form-grid">${field('Название','taskTitle',t.title)}${field('Сфера / папка','taskArea',t.area)}${field('Дата','taskDue',t.due,'date')}${field('Время','taskTime',t.time,'time')}${selectField('Приоритет','taskPriority',[['A','A — важно'],['B','B — нормально'],['C','C — потом']],t.priority)}${selectField('Статус','taskStatus',[['В работе','В работе'],['Готово','Готово']],t.status)}</div><div class="actions"><button class="btn" data-action="saveTask" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteTask" data-id="${id}">Удалить</button></div>`); }
function saveTask(id){ const obj={id:id||uid(), title:formVal('taskTitle')||'Задача', area:formVal('taskArea')||'Общее', due:formVal('taskDue')||todayKey(), time:formVal('taskTime'), priority:formVal('taskPriority')||'B', status:formVal('taskStatus')||'В работе'}; if(id){ const i=arr('tasks').findIndex(x=>x.id===id); if(i>=0) state.tasks[i]=obj; } else arr('tasks').unshift(obj); save(true); closeModal(); render(); toast('Задача сохранена'); }
function toggleTask(id){ const t=arr('tasks').find(x=>x.id===id); if(t){ t.status=t.status==='Готово'?'В работе':'Готово'; save(true); render(); } }
function deleteTask(id){ state.tasks=arr('tasks').filter(x=>x.id!==id); save(true); closeModal(); render(); toast('Задача удалена'); }
function addNote(){ openModal('Новая заметка', `<div class="form-grid">${field('Название','noteTitle')}${field('Папка','noteFolder','Личное')}${field('Теги через запятую','noteTags')}${area('Текст','noteText')}</div><div class="actions"><button class="btn" data-action="saveNote">Сохранить</button></div>`); }
function editNote(id){ const n=arr('notes').find(x=>x.id===id); if(!n) return; openModal('Редактировать заметку', `<div class="form-grid">${field('Название','noteTitle',n.title)}${field('Папка','noteFolder',n.folder)}${field('Теги через запятую','noteTags',(n.tags||[]).join(', '))}${area('Текст','noteText',n.text)}</div><div class="actions"><button class="btn" data-action="saveNote" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteNote" data-id="${id}">Удалить</button></div>`); }
function saveNote(id){ const obj={id:id||uid(), title:formVal('noteTitle')||'Заметка', folder:formVal('noteFolder')||'Личное', text:formVal('noteText'), createdAt:id?(arr('notes').find(n=>n.id===id)?.createdAt||todayKey()):todayKey(), tags:formVal('noteTags').split(',').map(x=>x.trim()).filter(Boolean)}; if(id){ const i=arr('notes').findIndex(x=>x.id===id); if(i>=0) state.notes[i]=obj; } else arr('notes').unshift(obj); save(true); closeModal(); render(); toast('Заметка сохранена'); }
function deleteNote(id){ state.notes=arr('notes').filter(x=>x.id!==id); save(true); closeModal(); render(); toast('Заметка удалена'); }
function addGoal(){ openModal('Новая цель', `<div class="form-grid">${field('Название','goalTitle')}${field('Сфера','goalArea','Финансы')}${field('Цель / сумма','goalTarget',100,'number')}${field('Сейчас','goalCurrent',0,'number')}${field('Дедлайн','goalDeadline','','date')}${area('Комментарий','goalNote')}</div><div class="actions"><button class="btn" data-action="saveGoal">Сохранить</button></div>`); }
function editGoal(id){ const g=arr('goals').find(x=>x.id===id); if(!g) return; openModal('Редактировать цель', `<div class="form-grid">${field('Название','goalTitle',g.title)}${field('Сфера','goalArea',g.area)}${field('Цель / сумма','goalTarget',g.targetValue,'number')}${field('Сейчас','goalCurrent',g.currentValue,'number')}${field('Дедлайн','goalDeadline',g.deadline,'date')}${area('Комментарий','goalNote',g.note)}</div><div class="actions"><button class="btn" data-action="saveGoal" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteGoal" data-id="${id}">Удалить</button></div>`); }
function saveGoal(id){ const obj={id:id||uid(), title:formVal('goalTitle')||'Цель', area:formVal('goalArea')||'Общее', targetValue:num(formVal('goalTarget')), currentValue:num(formVal('goalCurrent')), deadline:formVal('goalDeadline'), note:formVal('goalNote')}; if(id){ const i=arr('goals').findIndex(x=>x.id===id); if(i>=0) state.goals[i]=obj; } else arr('goals').unshift(obj); save(true); closeModal(); render(); toast('Цель сохранена'); }
function deleteGoal(id){ state.goals=arr('goals').filter(x=>x.id!==id); save(true); closeModal(); render(); }
function addHabit(){ openModal('Новая привычка', `<div class="form-grid">${field('Название','habitName')}${field('Сфера','habitArea','Фокус')}${field('Цель','habitTarget','ежедневно')}${field('Серия дней','habitStreak',0,'number')}</div><div class="actions"><button class="btn" data-action="saveHabit">Сохранить</button></div>`); }
function editHabit(id){ const h=arr('habits').find(x=>x.id===id); if(!h) return; openModal('Редактировать привычку', `<div class="form-grid">${field('Название','habitName',h.name)}${field('Сфера','habitArea',h.area)}${field('Цель','habitTarget',h.target)}${field('Серия дней','habitStreak',h.streak,'number')}</div><div class="actions"><button class="btn" data-action="saveHabit" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteHabit" data-id="${id}">Удалить</button></div>`); }
function saveHabit(id){ const old = arr('habits').find(x=>x.id===id) || {}; const obj={id:id||uid(), name:formVal('habitName')||'Привычка', area:formVal('habitArea')||'Фокус', target:formVal('habitTarget')||'ежедневно', streak:num(formVal('habitStreak')), marks:old.marks||{}}; if(id){ const i=arr('habits').findIndex(x=>x.id===id); if(i>=0) state.habits[i]=obj; } else arr('habits').push(obj); save(true); closeModal(); render(); }
function toggleHabit(id){ const h=arr('habits').find(x=>x.id===id); if(h){ h.marks=h.marks||{}; if(h.marks[todayKey()]){ delete h.marks[todayKey()]; h.streak=Math.max(0,num(h.streak)-1); } else { h.marks[todayKey()]=true; h.streak=num(h.streak)+1; } save(true); render(); } }
function deleteHabit(id){ state.habits=arr('habits').filter(x=>x.id!==id); save(true); closeModal(); render(); }
function addEvent(){ openModal('Новое событие', `<div class="form-grid">${field('Название','eventTitle')}${field('Дата','eventDate',todayKey(),'date')}${field('Начало','eventTime','09:00','time')}${field('Конец','eventEnd','10:00','time')}${selectField('Цвет','eventColor',[['blue','Синий'],['green','Зелёный'],['amber','Жёлтый'],['violet','Фиолетовый']],'blue')}</div><div class="actions"><button class="btn" data-action="saveEvent">Сохранить</button></div>`); }
function editEvent(id){ const e=arr('calendarEvents').find(x=>x.id===id); if(!e) return; openModal('Редактировать событие', `<div class="form-grid">${field('Название','eventTitle',e.title)}${field('Дата','eventDate',e.date,'date')}${field('Начало','eventTime',e.time,'time')}${field('Конец','eventEnd',e.end,'time')}${selectField('Цвет','eventColor',[['blue','Синий'],['green','Зелёный'],['amber','Жёлтый'],['violet','Фиолетовый']],e.color)}</div><div class="actions"><button class="btn" data-action="saveEvent" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteEvent" data-id="${id}">Удалить</button></div>`); }
function saveEvent(id){ const obj={id:id||uid(), title:formVal('eventTitle')||'Событие', date:formVal('eventDate')||todayKey(), time:formVal('eventTime'), end:formVal('eventEnd'), color:formVal('eventColor')||'blue'}; if(id){ const i=arr('calendarEvents').findIndex(x=>x.id===id); if(i>=0) state.calendarEvents[i]=obj; } else arr('calendarEvents').push(obj); save(true); closeModal(); render(); }
function deleteEvent(id){ state.calendarEvents=arr('calendarEvents').filter(x=>x.id!==id); save(true); closeModal(); render(); }
function addOperation(type='expense'){ openModal(type==='income'?'Новый доход':'Новый расход', `<div class="form-grid">${field('Описание','opNote')}${field('Сумма','opAmount','','number')}${field('Дата','opDate',todayKey(),'date')}${selectField('Категория','opCategory',categoryOptions(),type==='income'?'Доход':'Без категории')}</div><div class="actions"><button class="btn" data-action="saveOperation" data-type="${type}">Сохранить</button></div>`); }
function editOperation(id){ const o=arr('operations').find(x=>x.id===id); if(!o) return; openModal('Редактировать операцию', `<div class="form-grid">${field('Описание','opNote',o.note)}${field('Сумма','opAmount',o.amount,'number')}${field('Дата','opDate',o.date,'date')}${selectField('Тип','opType',[['expense','Расход'],['income','Доход']],o.type)}${selectField('Категория','opCategory',categoryOptions(),o.category)}</div><div class="actions"><button class="btn" data-action="saveOperation" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteOperation" data-id="${id}">Удалить</button></div>`); }
function saveOperation(idOrType){ const isExisting = arr('operations').some(x=>x.id===idOrType); const type = isExisting ? formVal('opType') : idOrType; const obj={id:isExisting?idOrType:uid(), note:formVal('opNote')||'Операция', amount:num(formVal('opAmount')), date:formVal('opDate')||todayKey(), type:type||'expense', category:formVal('opCategory')||'Без категории'}; if(isExisting){ const i=arr('operations').findIndex(x=>x.id===idOrType); state.operations[i]=obj; } else arr('operations').unshift(obj); save(true); closeModal(); render(); }
function deleteOperation(id){ state.operations=arr('operations').filter(x=>x.id!==id); save(true); closeModal(); render(); }
function addCategory(){ openModal('Новая категория', `<div class="form-grid">${field('Название','catName')}${selectField('Тип','catType',[['expense','Расход'],['income','Доход']],'expense')}${field('Лимит','catLimit',0,'number')}</div><div class="actions"><button class="btn" data-action="saveCategory">Сохранить</button></div>`); }
function editCategory(id){ const c=arr('categories').find(x=>x.id===id); if(!c) return; openModal('Редактировать категорию', `<div class="form-grid">${field('Название','catName',c.name)}${selectField('Тип','catType',[['expense','Расход'],['income','Доход']],c.type)}${field('Лимит','catLimit',c.limit,'number')}</div><div class="actions"><button class="btn" data-action="saveCategory" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteCategory" data-id="${id}">Удалить</button></div>`); }
function saveCategory(id){ const old=arr('categories').find(x=>x.id===id); const newName=formVal('catName')||'Категория'; if(id && old){ arr('operations').forEach(o=>{ if(o.category===old.name) o.category=newName; }); old.name=newName; old.type=formVal('catType')||'expense'; old.limit=num(formVal('catLimit')); } else arr('categories').push({id:uid(), name:newName, type:formVal('catType')||'expense', limit:num(formVal('catLimit'))}); save(true); closeModal(); render(); }
function deleteCategory(id){ const c=arr('categories').find(x=>x.id===id); state.categories=arr('categories').filter(x=>x.id!==id); if(c) arr('operations').forEach(o=>{ if(o.category===c.name) o.category='Без категории'; }); save(true); closeModal(); render(); }
function addLink(){ openModal('Новая связь', `<div class="form-grid">${field('Название','linkTitle')}${field('Тип','linkType','Заметка')}${field('Связано с','linkTarget','Second Brain OS')}${area('Комментарий','linkNote')}</div><div class="actions"><button class="btn" data-action="saveLink">Сохранить</button></div>`); }
function editLink(id){ const l=arr('links').find(x=>x.id===id); if(!l) return; openModal('Редактировать связь', `<div class="form-grid">${field('Название','linkTitle',l.title)}${field('Тип','linkType',l.type)}${field('Связано с','linkTarget',l.target)}${area('Комментарий','linkNote',l.note)}</div><div class="actions"><button class="btn" data-action="saveLink" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteLink" data-id="${id}">Удалить</button></div>`); }
function saveLink(id){ const obj={id:id||uid(), title:formVal('linkTitle')||'Связь', type:formVal('linkType')||'Заметка', target:formVal('linkTarget')||'', note:formVal('linkNote')}; if(id){ const i=arr('links').findIndex(x=>x.id===id); if(i>=0) state.links[i]=obj; } else arr('links').push(obj); save(true); closeModal(); render(); }
function deleteLink(id){ state.links=arr('links').filter(x=>x.id!==id); save(true); closeModal(); render(); }
function addResource(){ openModal('Новый ресурс', `<div class="form-grid">${field('Название','resTitle')}${field('Тип','resType','Документ')}${field('Ссылка','resUrl')}${area('Комментарий','resNote')}</div><div class="actions"><button class="btn" data-action="saveResource">Сохранить</button></div>`); }
function editResource(id){ const r=arr('resources').find(x=>x.id===id); if(!r) return; openModal('Редактировать ресурс', `<div class="form-grid">${field('Название','resTitle',r.title)}${field('Тип','resType',r.type)}${field('Ссылка','resUrl',r.url)}${area('Комментарий','resNote',r.note)}</div><div class="actions"><button class="btn" data-action="saveResource" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteResource" data-id="${id}">Удалить</button></div>`); }
function saveResource(id){ const obj={id:id||uid(), title:formVal('resTitle')||'Ресурс', type:formVal('resType')||'Документ', url:formVal('resUrl'), note:formVal('resNote')}; if(id){ const i=arr('resources').findIndex(x=>x.id===id); if(i>=0) state.resources[i]=obj; } else arr('resources').push(obj); save(true); closeModal(); render(); }
function deleteResource(id){ state.resources=arr('resources').filter(x=>x.id!==id); save(true); closeModal(); render(); }
function addPerson(){ openModal('Новый человек', `<div class="form-grid">${field('Имя','personName')}${field('Роль / связь','personRelation')}${field('День рождения','personBirthday','','date')}${area('Заметки / подарки / темы','personNotes')}</div><div class="actions"><button class="btn" data-action="savePerson">Сохранить</button></div>`); }
function editPerson(id){ const p=arr('people').find(x=>x.id===id); if(!p) return; openModal('Редактировать человека', `<div class="form-grid">${field('Имя','personName',p.name)}${field('Роль / связь','personRelation',p.relation)}${field('День рождения','personBirthday',p.birthday,'date')}${area('Заметки / подарки / темы','personNotes',p.notes)}</div><div class="actions"><button class="btn" data-action="savePerson" data-id="${id}">Сохранить</button></div>`); }
function savePerson(id){ const obj={id:id||uid(), name:formVal('personName')||'Человек', relation:formVal('personRelation'), birthday:formVal('personBirthday'), notes:formVal('personNotes')}; if(id){ const i=arr('people').findIndex(x=>x.id===id); if(i>=0) state.people[i]=obj; } else arr('people').push(obj); save(true); closeModal(); render(); }
function editFolder(id){ const f=arr('folders').find(x=>String(x.id)===String(id)); if(!f) return; openModal('Редактировать папку', `<div class="form-grid">${field('Название папки','folderName',lab(f.labelKey,f.id))}${field('Иконка','folderIcon',f.icon)}${area('Описание','folderNote',f.note)}</div><div class="actions"><button class="btn" data-action="saveFolder" data-id="${esc(f.id)}">Сохранить</button></div>`); }
function saveFolder(id){ const f=arr('folders').find(x=>String(x.id)===String(id)); if(f){ state.settings.labels[f.labelKey]=formVal('folderName')||lab(f.labelKey,f.id); f.icon=formVal('folderIcon')||f.icon; f.note=formVal('folderNote'); save(true); closeModal(); render(); toast('Папка переименована'); } }
function openFolder(id){ const map={work:'tasks',money:'finance',life:'habits',people:'people',ideas:'notes',archive:'resources'}; go(map[id]||'folders'); }
function editTexts(){
  const keys = [
    ['appName','Название приложения'],['appSubtitle','Подпись приложения'],['greeting','Приветствие на главной'],['greetingSub','Подзаголовок главной'],['quote','Цитата / фокус'],
    ['todayCard','Карточка: сегодня'],['calendarCard','Карточка: календарь'],['goalsCard','Карточка: цели'],['tasksCard','Карточка: задачи'],['timelineCard','Карточка: таймлайн'],['linksCard','Карточка: связи'],['habitsCard','Карточка: привычки'],['financeCard','Карточка: финансы'],['notesCard','Карточка: заметки'],['quickCard','Карточка: быстрый захват'],
    ...flatNav.map(([k,,fallback]) => ['nav_'+k, 'Меню: '+fallback]),
    ...arr('folders').map(f => [f.labelKey, 'Папка: '+lab(f.labelKey,f.id)])
  ];
  openModal('Редактор названий и текстов', `<div class="editor-list">${keys.map(([k,title]) => `<div class="editor-row"><label class="field"><span>${esc(title)}</span></label><input data-label-key="${esc(k)}" value="${esc(lab(k,labelDefaults[k]||''))}"></div>`).join('')}</div><div class="actions"><button class="btn" data-action="saveTexts">Сохранить тексты</button><button class="btn secondary" data-action="resetTexts">Вернуть стандартные</button></div>`);
}
function saveTexts(){ $$('[data-label-key]').forEach(inp => { state.settings.labels[inp.dataset.labelKey] = inp.value; }); save(true); closeModal(); render(); toast('Тексты сохранены'); }
function resetTexts(){ state.settings.labels={...labelDefaults}; save(true); closeModal(); render(); toast('Стандартные названия восстановлены'); }
function quickCapture(){ openModal('Быстрый захват', `<div class="quick-grid"><button class="quick-action" data-action="addNote"><i>✎</i>Заметка</button><button class="quick-action" data-action="addTask"><i>✓</i>Задача</button><button class="quick-action" data-action="addEvent"><i>□</i>Событие</button><button class="quick-action" data-action="addInbox"><i>↓</i>Входящее</button></div>`); }
function addInbox(){ openModal('Новое входящее', `<div class="form-grid">${field('Название','inboxTitle')}${field('Тип','inboxType','Идея')}${area('Текст','inboxText')}</div><div class="actions"><button class="btn" data-action="saveInbox">Сохранить</button></div>`); }
function saveInbox(){ arr('inbox').unshift({id:uid(), title:formVal('inboxTitle')||'Входящее', type:formVal('inboxType')||'Идея', text:formVal('inboxText'), createdAt:todayKey(), status:'Новое'}); save(true); closeModal(); render(); }
function inboxToNote(id){ const i=arr('inbox').find(x=>x.id===id); if(i){ arr('notes').unshift({id:uid(), title:i.title, folder:'Входящие', text:i.text, createdAt:todayKey(), tags:[i.type]}); state.inbox=arr('inbox').filter(x=>x.id!==id); save(true); render(); toast('Перенесено в заметки'); } }
function deleteInbox(id){ state.inbox=arr('inbox').filter(x=>x.id!==id); save(true); render(); }
function notifications(){ toast(`Сегодня: ${openTasks().length} задач и ${todayEvents().length} событий`); }
function setTimeline(mode){ state.settings.ui.timelineMode=mode; save(); render(); toast(`Режим: ${mode==='day'?'день':mode==='month'?'месяц':'неделя'}`); }
function saveActualBalance(){ state.settings.importActualBalance=formVal('actualBalance'); state.settings.currentBalance=num(formVal('actualBalance')); save(true); render(); toast('Фактический баланс сохранён'); }
function pickImportFile(){ $('#hiddenImportFile').click(); }
function parseCsv(text){
  const lines = text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map(x=>x.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split(sep).map(x=>x.trim().replace(/^"|"$/g,''));
    const obj = {}; headers.forEach((h,i)=>obj[h]=cols[i]||'');
    const amount = obj.amount || obj['сумма'] || obj.sum || cols.find(c=>/^-?\d+[\d\s,.]*$/.test(c)) || '0';
    const note = obj.note || obj['описание'] || obj['комментарий'] || obj.title || cols[0] || 'Операция';
    const date = obj.date || obj['дата'] || todayKey();
    return {note, amount:Math.abs(num(amount)), type:num(amount)<0?'expense':'expense', category:formVal('defaultImportCategory')||'Без категории', date};
  });
}
function importFile(file){
  const r = new FileReader();
  r.onload = () => {
    try{
      const text = String(r.result||'');
      let rows=[];
      if(file.name.toLowerCase().endsWith('.json')){
        const data = JSON.parse(text);
        if(Array.isArray(data)) rows = data.map(x => ({note:x.note||x.title||x['Описание']||x['Клиент / лид']||'Импорт', amount:Math.abs(num(x.amount||x['Сумма']||x['Потенциал ₽']||0)), type:(x.type||'expense'), category:x.category||formVal('defaultImportCategory')||'Без категории', date:x.date||x['Дата']||todayKey()}));
        else { state = normalize({...state, ...data}); save(true); render(); toast('JSON состояния импортирован'); return; }
      } else rows = parseCsv(text);
      state.settings.ui.importRows = rows.filter(r=>num(r.amount)>0).slice(0,200);
      save(); go('import'); toast(`Строк к проверке: ${state.settings.ui.importRows.length}`);
    } catch(e){ toast('Ошибка импорта: '+e.message); }
  };
  r.readAsText(file);
}
function syncImportRowsFromDom(){
  const rows=[];
  $$('.import-row').forEach(row => {
    rows.push({
      note: $('[data-import-field="note"]',row)?.value || 'Операция',
      amount: num($('[data-import-field="amount"]',row)?.value),
      category: $('[data-import-field="category"]',row)?.value || 'Без категории',
      type: $('[data-import-field="type"]',row)?.value || 'expense',
      date: todayKey()
    });
  });
  state.settings.ui.importRows = rows;
}
function removeImportRow(i){ syncImportRowsFromDom(); state.settings.ui.importRows.splice(num(i),1); save(); render(); }
function applyImportRows(){ syncImportRowsFromDom(); const rows=ui('importRows',[]).filter(r=>num(r.amount)>0); rows.forEach(r=>arr('operations').unshift({id:uid(), date:r.date||todayKey(), type:r.type, amount:num(r.amount), category:r.category, note:r.note})); state.settings.ui.importRows=[]; save(true); render(); toast(`Импортировано операций: ${rows.length}`); }
function exportData(){ const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`second-brain-os-${BUILD}-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href); }
function clearCaches(){ try{ storageSet('secondBrainOS.currentBuild', BUILD); if('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k))); if(navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())); }catch(e){} toast('Кэш очищен. Обнови страницу.'); }
function runSelfTest(){
  const missing = [];
  ['app','toast','modal'].forEach(id => { if(!$('#'+id)) missing.push(id); });
  flatNav.forEach(([k]) => { if(!pageView) missing.push(k); });
  toast(missing.length ? 'Есть проблемы: '+missing.join(', ') : 'Самопроверка OK: интерфейс и кнопки активны');
}

function handleAction(action, el){
  const id = el.dataset.id;
  switch(action){
    case 'closeModal': closeModal(); break;
    case 'liveSearch': break;
    case 'quickCapture': quickCapture(); break;
    case 'notifications': notifications(); break;
    case 'editTexts': editTexts(); break;
    case 'saveTexts': saveTexts(); break;
    case 'resetTexts': resetTexts(); break;
    case 'clearCaches': clearCaches(); break;
    case 'setTimeline': setTimeline(el.dataset.mode); break;
    case 'addTask': addTask(); break; case 'editTask': editTask(id); break; case 'saveTask': saveTask(id); break; case 'toggleTask': toggleTask(id); break; case 'deleteTask': deleteTask(id); break;
    case 'addNote': addNote(); break; case 'editNote': editNote(id); break; case 'saveNote': saveNote(id); break; case 'deleteNote': deleteNote(id); break;
    case 'addGoal': addGoal(); break; case 'editGoal': editGoal(id); break; case 'saveGoal': saveGoal(id); break; case 'deleteGoal': deleteGoal(id); break;
    case 'addHabit': addHabit(); break; case 'editHabit': editHabit(id); break; case 'saveHabit': saveHabit(id); break; case 'toggleHabit': toggleHabit(id); break; case 'deleteHabit': deleteHabit(id); break;
    case 'addEvent': addEvent(); break; case 'editEvent': editEvent(id); break; case 'saveEvent': saveEvent(id); break; case 'deleteEvent': deleteEvent(id); break;
    case 'addIncome': addOperation('income'); break; case 'addExpense': addOperation('expense'); break; case 'editOperation': editOperation(id); break; case 'saveOperation': saveOperation(id || el.dataset.type); break; case 'deleteOperation': deleteOperation(id); break;
    case 'addCategory': addCategory(); break; case 'editCategory': editCategory(id); break; case 'saveCategory': saveCategory(id); break; case 'deleteCategory': deleteCategory(id); break;
    case 'addLink': addLink(); break; case 'editLink': editLink(id); break; case 'saveLink': saveLink(id); break; case 'deleteLink': deleteLink(id); break;
    case 'addResource': addResource(); break; case 'editResource': editResource(id); break; case 'saveResource': saveResource(id); break; case 'deleteResource': deleteResource(id); break;
    case 'addPerson': addPerson(); break; case 'editPerson': editPerson(id); break; case 'savePerson': savePerson(id); break;
    case 'editFolder': editFolder(id); break; case 'saveFolder': saveFolder(id); break; case 'openFolder': openFolder(id); break;
    case 'addInbox': addInbox(); break; case 'saveInbox': saveInbox(); break; case 'inboxToNote': inboxToNote(id); break; case 'deleteInbox': deleteInbox(id); break;
    case 'pickImportFile': pickImportFile(); break; case 'saveActualBalance': saveActualBalance(); break; case 'removeImportRow': removeImportRow(el.dataset.index); break; case 'applyImportRows': applyImportRows(); break;
    case 'exportData': exportData(); break; case 'runSelfTest': runSelfTest(); break;
    default: toast('Кнопка активна: '+action);
  }
}

document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-go]');
  if(nav){ e.preventDefault(); go(nav.dataset.go); return; }
  const el = e.target.closest('[data-action]');
  if(!el) return;
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) && el.dataset.action === 'liveSearch') return;
  e.preventDefault(); handleAction(el.dataset.action, el);
});
document.addEventListener('input', (e) => {
  if(e.target.matches('#globalSearch,#sideSearch')){
    state.settings.ui.search = e.target.value;
    save();
    $$('#globalSearch,#sideSearch').forEach(inp => { if(inp !== e.target) inp.value = e.target.value; });
  }
});
document.addEventListener('keydown', (e) => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#globalSearch')?.focus(); }
  if(e.key === 'Escape') closeModal();
});
$('#hiddenImportFile')?.addEventListener('change', e => { const file=e.target.files?.[0]; if(file) importFile(file); e.target.value=''; });
window.addEventListener('hashchange', () => { page = location.hash ? location.hash.slice(1) : 'dashboard'; render(); });

try{
  save();
  render();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v='+BUILD).catch(()=>{});
  console.log('[Second Brain OS]', BUILD);
}catch(e){
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="white-space:pre-wrap;color:#b91c1c;background:#fff;padding:20px">${esc(e.stack||e.message)}</pre>`);
}
