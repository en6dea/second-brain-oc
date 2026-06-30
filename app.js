'use strict';

const APP_NAME = 'Second Brain OS';
const BUILD = 'life-polish-light-tech-20260630';
const BUILD_LABEL = 'Life Polish + Smart Goals';
const STORE_KEY = 'secondBrainOS.v1';
const META_KEY = 'secondBrainOS.meta.v1';
const SNAPSHOT_KEY = 'secondBrainOS.dataSnapshots.v1';

const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const uid = () => 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0,10);
const monthKey = () => todayKey().slice(0,7);
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const num = v => Number(String(v ?? '').replace(/\s/g,'').replace(',','.')) || 0;
const money = v => `${Math.round(num(v)).toLocaleString('ru-RU')} ₽`;
const clamp = (v,a=0,b=100)=>Math.max(a,Math.min(b,v));

window.SecondBrainOS = {appName:APP_NAME, build:BUILD, label:BUILD_LABEL};
document.title = APP_NAME;
const meta = document.querySelector('meta[name="second-brain-build"]'); if(meta) meta.content = BUILD;
if(location.search){ history.replaceState(null,'', location.pathname + (location.hash || '')); }

const navItems = [
  ['dashboard','⌂','Обзор'], ['finance','◔','Финансы'], ['budget','◉','Бюджет'], ['roadmap','◎','Дорожная карта'],
  ['tasks','☑','Задачи'], ['spheres','✣','Сферы жизни'], ['calendar','☷','Календарь'], ['notes','✎','Заметки'], ['files','▣','Файлы'], ['import','⇣','Импорт'], ['diagnostics','⚙','Диагностика']
];
const mobileItems = [['dashboard','⌂','Обзор'],['finance','◔','Финансы'],['spheres','✣','Сферы'],['calendar','☷','Календарь'],['budget','◉','Бюджет']];
let page = location.hash ? location.hash.slice(1) : 'dashboard';
let state = loadState();
let csvRows = [];
let csvHeaders = [];

function defaultState(){
  return {
    settings:{currentMonth:monthKey(), currency:'₽', monthlyPlan:300000, openingBalance:0, currentBalance:0, savingsRate:10},
    operations:[
      {id:uid(), date:todayKey(), type:'income', amount:210000, category:'Доход', note:'Зарплата'},
      {id:uid(), date:todayKey(), type:'expense', amount:2450, category:'Продукты', note:'Магазин'},
      {id:uid(), date:todayKey(), type:'expense', amount:1250, category:'Кафе', note:'Кофе и обед'}
    ],
    plannedExpenses:[
      {id:uid(), title:'Жильё', amount:25000, day:5, month:monthKey(), active:true},
      {id:uid(), title:'Связь и интернет', amount:2500, day:10, month:monthKey(), active:true}
    ],
    budgets:[
      {id:'b_food', category:'Продукты', limit:35000, group:'base'},
      {id:'b_home', category:'Дом', limit:25000, group:'base'},
      {id:'b_transport', category:'Транспорт', limit:15000, group:'base'},
      {id:'b_cafe', category:'Кафе', limit:12000, group:'wants'},
      {id:'b_health', category:'Здоровье', limit:10000, group:'future'}
    ],
    debts:[{id:'d_bank', direction:'owe', person:'Кредит / карта', amount:45000, due:todayKey(), status:'Активен', note:'Первый долг к закрытию'}],
    tasks:[
      {id:uid(), title:'Проверить бюджет на неделю', area:'Финансы', due:todayKey(), time:'10:00', status:'В работе', priority:'Средний'},
      {id:uid(), title:'Тренировка', area:'Здоровье', due:todayKey(), time:'12:00', status:'В работе', priority:'Средний'},
      {id:uid(), title:'Оплатить страховку', area:'Документы', due:todayKey(), time:'15:00', status:'В работе', priority:'Высокий'}
    ],
    goals:[
      {id:'g_safety', title:'Подушка безопасности', area:'Финансы', targetValue:600000, currentValue:450000, deadline:'2026-12-31', status:'Активна', nextAction:'Отложить 10% с ближайшего дохода'},
      {id:'g_income', title:'Увеличить доход', area:'Финансы', targetValue:300000, currentValue:210000, deadline:'2026-12-31', status:'Активна', nextAction:'Найти один дополнительный источник дохода'}
    ],
    habits:[
      {id:'h_money', name:'Записать расходы', area:'Финансы', active:true},
      {id:'h_sleep', name:'Сон 7+ часов', area:'Здоровье', active:true},
      {id:'h_plan', name:'План дня', area:'Фокус', active:true}
    ],
    notes:[
      {id:uid(), title:'Фокус дня', text:'Минимум лишнего, максимум ясности.', tags:['фокус'], createdAt:todayKey(), folder:'Личное'},
      {id:uid(), title:'Идеи доп. дохода', text:'Консультации, онлайн-продукт, партнёрские программы.', tags:['идея','доход'], createdAt:todayKey(), folder:'Финансы'}
    ],
    people:[
      {id:'p_polina', name:'Полина', relation:'близкий человек', birthday:'1999-08-23', likes:'кофе, море, украшения', talkIdeas:'обсудить планы на июль', gifts:'сертификат / украшение', notes:'важный человек'}
    ],
    books:[
      {id:'b_money_psychology', title:'Психология денег', author:'Морган Хаузел', status:'Хочу прочитать', insight:'Деньги — это запас спокойствия и свободы решений.', createdAt:todayKey()},
      {id:'b_babylon', title:'Самый богатый человек в Вавилоне', author:'Джордж Клейсон', status:'В списке', insight:'Сначала заплати себе.', createdAt:todayKey()}
    ],
    trips:[
      {id:'trip_mountains', title:'Поездка в горы', direction:'Любое направление', start:'', end:'', budget:100000, saved:0, transport:25000, hotel:45000, food:20000, activities:10000, notes:'Свободное планирование маршрута и бюджета', status:'Идея'}
    ],
    calendarEvents:[
      {id:uid(), title:'Планирование бюджета', date:todayKey(), time:'16:00', area:'Финансы', note:'Сверить факт, план и лимиты'},
      {id:uid(), title:'Проверить документы', date:todayKey(), time:'18:00', area:'Документы', note:'Паспорт, страховки, сроки'}
    ],
    files:[],
    spheres:[
      {id:'life_health', title:'Здоровье', icon:'♡', progress:85, note:'Сон, движение, врачи'},
      {id:'life_home', title:'Дом', icon:'⌂', progress:72, note:'Быт и порядок'},
      {id:'life_car', title:'Машина', icon:'▱', progress:60, note:'ТО, страховка, расходы'},
      {id:'life_docs', title:'Документы', icon:'▣', progress:90, note:'Сроки и хранение'},
      {id:'life_trips', title:'Путешествия', icon:'✈', progress:48, note:'Планы поездок и бюджеты'},
      {id:'life_people', title:'Люди', icon:'◌', progress:70, note:'Контакты, подарки, дни рождения'},
      {id:'life_books', title:'Книги', icon:'◧', progress:45, note:'Чтение и инсайты'}
    ],
    dataCore:{schema:4700, updatedAt:new Date().toISOString()}
  };
}
function essentialArrays(){return ['operations','plannedExpenses','budgets','debts','tasks','goals','habits','notes','people','books','trips','calendarEvents','files','spheres'];}
function normalizeState(raw){
  const base = defaultState(); const s = raw && typeof raw === 'object' ? raw : {};
  const merged = {...base, ...s, settings:{...base.settings, ...(s.settings||{})}, dataCore:{...base.dataCore, ...(s.dataCore||{})}};
  essentialArrays().forEach(k=>{ if(!Array.isArray(merged[k])) merged[k]=base[k] || []; });
  if(!merged.spheres.length) merged.spheres = base.spheres;
  if(!merged.budgets.length) merged.budgets = base.budgets;
  merged.settings.currentMonth = merged.settings.currentMonth || monthKey();
  merged.settings.lifeFolder = merged.settings.lifeFolder || 'overview';
  merged.dataCore.schema = 4700; merged.dataCore.updatedAt = new Date().toISOString();
  return merged;
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return normalizeState(defaultState());
    const parsed = JSON.parse(raw);
    return normalizeState(parsed.state || parsed);
  }catch(e){ console.warn('load state failed', e); return normalizeState(defaultState()); }
}
function save(snapshot=false){
  state = normalizeState(state); localStorage.setItem(STORE_KEY, JSON.stringify(state));
  localStorage.setItem(META_KEY, JSON.stringify({app:APP_NAME, build:BUILD, updatedAt:new Date().toISOString()}));
  if(snapshot) saveSnapshot('manual');
}
function saveSnapshot(reason='auto'){
  try{
    const list = JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'[]');
    list.unshift({app:APP_NAME, build:BUILD, reason, createdAt:new Date().toISOString(), state});
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list.slice(0,8)));
  }catch(e){}
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
function go(p){ page=p; location.hash=p; render(); }
window.addEventListener('hashchange',()=>{page=location.hash.slice(1)||'dashboard'; render();});

function monthLabel(m=state.settings.currentMonth){ const [y,mo]=String(m).split('-'); return new Date(Number(y), Number(mo||1)-1, 1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}); }
function monthOps(type){ return state.operations.filter(o=>String(o.date||'').startsWith(state.settings.currentMonth) && (!type || o.type===type)); }
function total(list){ return list.reduce((s,x)=>s+num(x.amount),0); }
function summary(){
  const income = total(monthOps('income')), expenses = total(monthOps('expense'));
  const planned = total(state.plannedExpenses.filter(p=>p.active!==false && (!p.month || p.month===state.settings.currentMonth)));
  const balance = income - expenses - planned + num(state.settings.openingBalance);
  const plan = num(state.settings.monthlyPlan) || income || 1;
  const days = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
  const remainingDays = Math.max(1, days - new Date().getDate() + 1);
  const dailyLimit = Math.max(0, Math.floor((income-expenses-planned)/remainingDays));
  const byCat = {};
  monthOps('expense').forEach(o=>{ byCat[o.category||'Без категории']=(byCat[o.category||'Без категории']||0)+num(o.amount); });
  const topCats = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const safetyGoal = state.goals.find(g=>/подуш/i.test(g.title)) || state.goals[0];
  return {income, expenses, planned, balance, plan, progress:clamp(Math.round(income/plan*100)), dailyLimit, topCats, safetyGoal};
}
function goalProgress(g){ return num(g?.targetValue) ? clamp(Math.round(num(g.currentValue)/num(g.targetValue)*100)) : 0; }
function budgetStats(){
  const s=summary();
  return state.budgets.map(b=>{ const spent=s.topCats.find(([c])=>c===b.category)?.[1] || 0; const limit=num(b.limit); const pct=limit?clamp(Math.round(spent/limit*100)):0; return {...b, spent, limit, pct, left:limit-spent}; });
}
function taskStatus(t){ return t.status || 'В работе'; }
function openTasks(){return state.tasks.filter(t=>taskStatus(t)!=='Готово').sort((a,b)=>String(a.due+a.time).localeCompare(String(b.due+b.time)));}
function todayTasks(){return openTasks().filter(t=>t.due===todayKey()).slice(0,6);}

function layout(title, subtitle, body){
  return `<div class="page"><div class="hero"><div><h1>${title}</h1><p>${subtitle||''}</p></div><div class="date-pill">☷ ${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</div></div>${body}</div>`;
}
function financeSpark(){return `<div class="spark"><svg viewBox="0 0 280 80" preserveAspectRatio="none"><defs><linearGradient id="gblue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".18"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs><path class="area-blue" d="M0 70 L0 54 C30 48 40 58 62 48 C80 38 95 44 112 30 C132 12 150 40 170 24 C190 8 205 18 222 11 C245 2 260 -5 280 -20 L280 70 Z"/><path class="stroke-blue" d="M0 54 C30 48 40 58 62 48 C80 38 95 44 112 30 C132 12 150 40 170 24 C190 8 205 18 222 11 C245 2 260 -5 280 -20"/></svg></div>`;}
function progressBar(p, cls=''){return `<div class="progress ${cls}"><b style="width:${clamp(p)}%"></b></div>`;}
function dashboard(){
  const s=summary(); const tasks=todayTasks(); const safe=s.safetyGoal; const safeP=goalProgress(safe);
  return layout('Обзор', 'Доброе утро! Всё важное — на одном чистом экране.', `
    <section class="grid dashboard">
      <article class="card"><div class="card-head"><h3>Финансы</h3><button class="link" data-go="finance">Подробнее →</button></div><div class="muted small">Общий баланс</div><div class="value">${money(s.balance)}</div><div class="metric-row"><div><div class="small muted">Доходы</div><div class="green strong">+ ${money(s.income)}</div></div><div><div class="small muted">Расходы</div><div class="strong">− ${money(s.expenses)}</div></div></div>${financeSpark()}</article>
      <article class="card"><div class="card-head"><h3>Бюджет на сегодня</h3><button class="link" data-go="budget">Подробнее →</button></div><div class="split"><div class="ring" style="--p:${s.progress}"><span>${s.progress}%</span></div><div><div class="small muted">Лимит на день</div><div class="value sm">${money(s.dailyLimit)}</div><div class="small muted">План месяца</div><div class="strong">${money(s.plan)}</div></div></div></article>
      <article class="card"><div class="card-head"><h3>Подушка безопасности</h3><button class="link" data-go="roadmap">Подробнее →</button></div><div class="value sm">${money(safe?.currentValue||0)}</div><div class="small muted">из ${money(safe?.targetValue||0)}</div>${progressBar(safeP)}<div class="stat-row"><span class="small muted">${safeP}% вашей цели</span><span class="pill blue">Защита</span></div></article>
    </section>
    <section class="grid cols-3" style="margin-top:18px">
      <article class="card"><div class="card-head"><h3>Дорожная карта</h3><button class="link" data-go="roadmap">Все цели →</button></div><div class="road-list">${state.goals.slice(0,4).map((g,i)=>`<div class="road-item ${goalProgress(g)>=70?'done':''}"><div class="dot"></div><div><strong>${esc(g.title)}</strong><span>${esc(g.nextAction||g.area||'Следующий шаг')}</span>${progressBar(goalProgress(g), i===0?'green':'')}</div><b class="small">${goalProgress(g)}%</b></div>`).join('')}</div></article>
      <article class="card"><div class="card-head"><h3>Задачи</h3><button class="link" data-action="addTask">Новая +</button></div><div class="actions" style="margin:0 0 10px"><span class="pill blue">Сегодня</span><span class="pill">Предстоящие ${openTasks().length}</span><span class="pill red">Просроченные ${openTasks().filter(t=>t.due<todayKey()).length}</span></div><div class="task-list">${(tasks.length?tasks:openTasks().slice(0,4)).map(t=>rowTask(t)).join('')||empty('Нет задач на сегодня')}</div></article>
      <article class="card"><div class="card-head"><h3>Сферы жизни</h3><button class="link" data-go="spheres">Все папки →</button></div><div class="life-grid">${state.spheres.slice(0,5).map(sphereTile).join('')}<button class="life-tile add" data-go="spheres">＋<br>Папки жизни</button></div><div class="metric-row" style="margin-top:12px"><div class="mini-box"><div class="small muted">Люди</div><b>${(state.people||[]).length}</b></div><div class="mini-box"><div class="small muted">Поездки</div><b>${(state.trips||[]).length}</b></div></div></article>
    </section>
    <section class="grid bottom" style="margin-top:18px">
      <article class="card"><div class="card-head"><h3>Последние операции</h3><button class="link" data-go="finance">Все операции</button></div><div class="op-list">${state.operations.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5).map(rowOperation).join('')}</div></article>
      <article class="card"><div class="card-head"><h3>Календарь</h3><button class="link" data-go="calendar">Все события</button></div><div class="note-list">${upcomingEvents().slice(0,4).map(e=>`<div class="list-row"><span>☷</span><div><div class="row-title">${esc(e.title)}</div><div class="row-sub">${esc(e.date||'')} ${esc(e.time||'')}</div></div><span class="pill">${esc(e.area||'Личное')}</span></div>`).join('')||empty('Пока нет событий')}</div></article>
      <article class="card"><div class="card-head"><h3>Заметки</h3><button class="link" data-go="notes">Все заметки</button></div><div class="note-list">${state.notes.slice(0,3).map(n=>`<div class="list-row"><span>✎</span><div><div class="row-title">${esc(n.title)}</div><div class="row-sub">${esc(n.createdAt||'')}</div></div><span></span></div>`).join('')}${coachCard()}</div></article>
    </section>`);
}
function empty(text){return `<div class="mini-box muted">${text}</div>`;}
function rowTask(t){ return `<div class="list-row"><button class="check ${taskStatus(t)==='Готово'?'done':''}" data-action="toggleTask" data-id="${t.id}" title="Готово"></button><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.area||'Личное')} • ${esc(t.due||'')} ${esc(t.time||'')}</div></div><span class="small muted">${esc(t.time||'')}</span></div>`; }
function rowOperation(o){ const isInc=o.type==='income'; return `<div class="list-row"><span>${isInc?'↗':'↘'}</span><div><div class="row-title">${esc(o.category||'Без категории')}</div><div class="row-sub">${esc(o.note||'Операция')} • ${esc(o.date||'')}</div></div><span class="amount ${isInc?'green':''}">${isInc?'+':'−'} ${money(o.amount)}</span></div>`; }
function sphereTile(s){ return `<div class="life-tile"><div class="ico">${esc(s.icon||'✣')}</div><strong>${esc(s.title)}</strong><span>${num(s.progress)}%</span>${progressBar(num(s.progress), num(s.progress)>75?'green':'')}</div>`; }
function coachCard(){return `<div class="mini-box" style="margin-top:8px"><div class="small amber strong">✦ Фокус дня</div><div class="small muted">Ясность в приоритетах создаёт свободу действий.</div></div>`;}

function lifeFolders(){return [
  ['overview','Все папки','✣'],['people','Люди','◌'],['notes','Заметки','✎'],['books','Книги','◧'],['trips','Путешествия','✈'],['calendar','Календарь','☷'],['docs','Документы','▣']
];}
function currentLifeFolder(){return state.settings.lifeFolder || 'overview';}
function lifeFolderSelect(){ const cur=currentLifeFolder(); return `<div class="life-folder-select"><label class="field"><span>Папка сферы жизни</span><select id="lifeFolderPicker">${lifeFolders().map(([id,label,ico])=>`<option value="${id}" ${cur===id?'selected':''}>${ico} ${label}</option>`).join('')}</select></label></div>`; }
function lifeCounts(){return {people:(state.people||[]).length,notes:(state.notes||[]).length,books:(state.books||[]).length,trips:(state.trips||[]).length,events:(state.calendarEvents||[]).length};}
function travelTotal(t){return num(t.transport)+num(t.hotel)+num(t.food)+num(t.activities);}
function tripProgress(t){return num(t.budget)?clamp(Math.round(num(t.saved)/num(t.budget)*100)):0;}
function folderButton(id,label,ico,count){return `<button class="folder-card ${currentLifeFolder()===id?'active':''}" data-life-folder="${id}"><span class="folder-ico">${ico}</span><strong>${label}</strong><small>${count||0} записей</small></button>`;}
function renderLifeOverview(){ const c=lifeCounts(); return `<section class="grid cols-3 life-folder-grid">${folderButton('people','Люди','◌',c.people)}${folderButton('notes','Заметки','✎',c.notes)}${folderButton('books','Книги','◧',c.books)}${folderButton('trips','Путешествия','✈',c.trips)}${folderButton('calendar','Календарь','☷',c.events)}${folderButton('docs','Документы','▣',(state.files||[]).length)}</section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Сферы жизни</h3><button class="btn secondary" data-action="addSphere">Добавить сферу</button></div><div class="life-grid">${state.spheres.map(sphereTile).join('')}</div></section>`;}
function renderPeopleFolder(){return `<section class="card"><div class="card-head"><h3>Люди</h3><button class="btn" data-action="addPerson">Добавить человека</button></div><div class="grid cols-3">${(state.people||[]).map(p=>`<article class="mini-box"><div class="stat-row"><strong>${esc(p.name)}</strong><span class="pill blue">${esc(p.relation||'контакт')}</span></div><p class="small muted">ДР: ${esc(p.birthday||'—')}</p><p class="small"><b>Любит:</b> ${esc(p.likes||'—')}</p><p class="small"><b>Темы:</b> ${esc(p.talkIdeas||'—')}</p><p class="small"><b>Подарки:</b> ${esc(p.gifts||'—')}</p></article>`).join('')||empty('Люди пока не добавлены')}</div></section>`;}
function renderNotesFolder(){return `<section class="card"><div class="card-head"><h3>Заметки</h3><button class="btn" data-action="addNote">Новая заметка</button></div><div class="note-list">${(state.notes||[]).map(n=>`<div class="list-row"><span>✎</span><div><div class="row-title">${esc(n.title)}</div><div class="row-sub">${esc(n.folder||'Личное')} • ${esc(n.text||'')}</div></div><span class="small muted">${esc(n.createdAt||'')}</span></div>`).join('')||empty('Пока нет заметок')}</div></section>`;}
function renderBooksFolder(){return `<section class="card"><div class="card-head"><h3>Книги</h3><button class="btn" data-action="addBook">Добавить книгу</button></div><div class="grid cols-2">${(state.books||[]).map(b=>`<article class="mini-box"><div class="stat-row"><strong>${esc(b.title)}</strong><span class="pill blue">${esc(b.status||'В списке')}</span></div><p class="small muted">${esc(b.author||'Автор не указан')}</p><p class="small">${esc(b.insight||'Главный инсайт появится здесь')}</p></article>`).join('')||empty('Книг пока нет')}</div></section>`;}
function renderTripsFolder(){ const trips=state.trips||[]; return `<section class="card"><div class="card-head"><h3>Путешествия и поездки</h3><button class="btn" data-action="addTrip">Запланировать поездку</button></div><p class="muted small">Любое направление: город, море, горы, командировка, поездка на машине. У каждой поездки есть свой бюджет.</p><div class="grid cols-2" style="margin-top:14px">${trips.map(t=>`<article class="mini-box"><div class="stat-row"><strong>${esc(t.title)}</strong><span class="pill blue">${esc(t.status||'План')}</span></div><p class="small muted">${esc(t.direction||'Направление свободное')} ${t.start?`• ${esc(t.start)} — ${esc(t.end||'')}`:''}</p><div class="value sm">${money(t.budget)}</div><div class="small muted">Транспорт ${money(t.transport)} · Жильё ${money(t.hotel)} · Еда ${money(t.food)} · Активности ${money(t.activities)}</div>${progressBar(tripProgress(t))}<p class="small muted">Накоплено: ${money(t.saved)} · Расчёт расходов: ${money(travelTotal(t))}</p></article>`).join('')||empty('Путешествия пока не запланированы')}</div></section>`;}
function renderCalendarFolder(){return `<section class="card"><div class="card-head"><h3>Ближайшие события</h3><button class="btn" data-action="addCalendarEvent">Добавить событие</button></div><div class="note-list">${upcomingEvents().slice(0,8).map(e=>`<div class="list-row"><span>☷</span><div><div class="row-title">${esc(e.title)}</div><div class="row-sub">${esc(e.date)} ${esc(e.time||'')} • ${esc(e.area||'Личное')}</div></div><span class="pill">${esc(e.area||'')}</span></div>`).join('')||empty('Событий пока нет')}</div></section>`;}
function renderDocsFolder(){return `<section class="card"><div class="card-head"><h3>Документы</h3><button class="btn secondary" data-go="files">Открыть файлы</button></div><p class="muted">Здесь будут паспорта, страховки, чеки, анализы, документы по машине и поездкам. Сейчас раздел связан с файлами и календарём.</p></section>`;}
function upcomingEvents(){ const ev=[...(state.calendarEvents||[]), ...openTasks().map(t=>({id:t.id,title:t.title,date:t.due,time:t.time,area:t.area,note:'Задача'})), ...(state.trips||[]).filter(t=>t.start).map(t=>({id:t.id,title:'Поездка: '+t.title,date:t.start,time:'',area:'Путешествия',note:t.direction}))]; return ev.filter(e=>e.date).sort((a,b)=>String(a.date+a.time).localeCompare(String(b.date+b.time)));}
function calendarPage(){ const now=new Date(); const y=now.getFullYear(), m=now.getMonth(); const first=new Date(y,m,1); const start=(first.getDay()+6)%7; const days=new Date(y,m+1,0).getDate(); const cells=[]; for(let i=0;i<start;i++) cells.push(`<div class="calendar-cell muted"></div>`); for(let d=1; d<=days; d++){ const date=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const ev=upcomingEvents().filter(e=>e.date===date); cells.push(`<button class="calendar-cell ${date===todayKey()?'today':''}"><strong>${d}</strong><div class="calendar-badges">${ev.slice(0,3).map(e=>`<span>${esc(e.area||'•')}</span>`).join('')}</div></button>`);} return layout('Календарь', 'Задачи, люди, документы и путешествия в одном расписании.', `<section class="grid cols-2"><article class="card"><div class="card-head"><h3>${new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</h3><button class="btn" data-action="addCalendarEvent">Событие</button></div><div class="calendar-weekdays"><b>Пн</b><b>Вт</b><b>Ср</b><b>Чт</b><b>Пт</b><b>Сб</b><b>Вс</b></div><div class="calendar-cells">${cells.join('')}</div></article><article class="card"><div class="card-head"><h3>Ближайшее</h3><button class="btn secondary" data-action="addTrip">Поездка</button></div><div class="note-list">${upcomingEvents().slice(0,10).map(e=>`<div class="list-row"><span>☷</span><div><div class="row-title">${esc(e.title)}</div><div class="row-sub">${esc(e.date)} ${esc(e.time||'')} • ${esc(e.note||'')}</div></div><span class="pill blue">${esc(e.area||'')}</span></div>`).join('')||empty('Ближайших событий нет')}</div></article></section>`);}

function financePage(){
  const s=summary();
  return layout('Финансы', 'Баланс, доходы, расходы и последние операции без визуального шума.', `
    <section class="grid cols-3"><article class="card"><h3>Денежная позиция</h3><div class="value">${money(s.balance)}</div><div class="small muted">доходы − расходы − планы + стартовый баланс</div>${financeSpark()}</article><article class="card"><h3>Доходы месяца</h3><div class="value green">${money(s.income)}</div><button class="btn secondary" data-action="addIncome">Добавить доход</button></article><article class="card"><h3>Расходы месяца</h3><div class="value">${money(s.expenses)}</div><button class="btn secondary" data-action="addExpense">Добавить расход</button></article></section>
    <section class="grid cols-2" style="margin-top:18px"><article class="card"><h3>Категории расходов</h3><div class="note-list" style="margin-top:14px">${s.topCats.map(([cat,amount])=>`<div class="list-row"><span>◔</span><div><div class="row-title">${esc(cat)}</div>${progressBar(s.expenses?amount/s.expenses*100:0)}</div><b>${money(amount)}</b></div>`).join('')||empty('Расходов пока нет')}</div></article><article class="card"><h3>Последние операции</h3><div class="actions"><button class="btn" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button><button class="btn secondary" data-go="import">Импорт</button></div><div class="op-list" style="margin-top:14px">${state.operations.slice().reverse().slice(0,10).map(rowOperation).join('')}</div></article></section>`);
}
function budgetPage(){
  const s=summary(); const items=budgetStats(); const used=items.reduce((a,b)=>a+b.spent,0), limit=items.reduce((a,b)=>a+b.limit,0);
  return layout('Бюджет', 'Конверты, лимиты и спокойный контроль расходов.', `
    <section class="grid cols-3"><article class="card"><h3>Деньги до конца месяца</h3><div class="value">${money(Math.max(0, s.income-s.expenses-s.planned))}</div><div class="small muted">плановый остаток</div></article><article class="card"><h3>Можно тратить в день</h3><div class="value blue">${money(s.dailyLimit)}</div><div class="small muted">чтобы остаться в плане</div></article><article class="card"><h3>Лимиты категорий</h3><div class="value sm">${limit?Math.round(used/limit*100):0}%</div>${progressBar(limit?used/limit*100:0)}</article></section>
    <section class="card" style="margin-top:18px"><div class="card-head"><h3>Конверты по категориям</h3><button class="btn secondary" data-action="addBudget">Добавить лимит</button></div><div class="grid cols-2">${items.map(b=>`<div class="mini-box"><div class="stat-row"><strong>${esc(b.category)}</strong><span class="pill ${b.pct>100?'red':b.pct>80?'':'blue'}">${b.pct}%</span></div><div class="small muted">${money(b.spent)} из ${money(b.limit)}</div>${progressBar(b.pct, b.pct>100?'':b.pct>80?'amber':'green')}<div class="small muted" style="margin-top:8px">Осталось: ${money(b.left)}</div></div>`).join('')}</div></section>`);
}
function roadmapPage(){ return layout('Дорожная карта', 'Большие цели становятся понятными, когда разбиты на шаги.', `<section class="grid cols-2">${state.goals.map(g=>`<article class="card"><div class="card-head"><h3>${esc(g.title)}</h3><span class="pill blue">${goalProgress(g)}%</span></div><div class="value sm">${money(g.currentValue)} / ${money(g.targetValue)}</div>${progressBar(goalProgress(g), goalProgress(g)>70?'green':'')}<p class="muted small">Следующий шаг: ${esc(g.nextAction||'Определить действие')}</p></article>`).join('')}<article class="card"><h3>Новая цель</h3><p class="muted">Создай цель, чтобы приложение связывало её с задачами и деньгами.</p><button class="btn" data-action="addGoal">Добавить цель</button></article></section>`); }
function tasksPage(){ return layout('Задачи', 'Один понятный список дел на сегодня и ближайшие дни.', `<section class="card"><div class="card-head"><h3>Открытые задачи</h3><button class="btn" data-action="addTask">Новая задача</button></div><div class="task-list">${openTasks().map(rowTask).join('')||empty('Нет открытых задач')}</div></section>`); }
function spheresPage(){ const folder=currentLifeFolder(); const map={overview:renderLifeOverview,people:renderPeopleFolder,notes:renderNotesFolder,books:renderBooksFolder,trips:renderTripsFolder,calendar:renderCalendarFolder,docs:renderDocsFolder}; return layout('Сферы жизни', 'Папки для людей, заметок, книг, путешествий, документов и календаря.', `<section class="card life-folder-head"><div class="card-head"><div><h3>Папки жизни</h3><p class="muted small">Выбирай папку из списка: всё хранится в едином стиле Second Brain OS.</p></div>${lifeFolderSelect()}</div></section><div style="margin-top:18px">${(map[folder]||renderLifeOverview)()}</div>`); }
function notesPage(){ return layout('Заметки', 'Идеи, инсайты и важные мысли в одном месте.', `<section class="card"><div class="card-head"><h3>Все заметки</h3><button class="btn" data-action="addNote">Новая заметка</button></div><div class="note-list">${state.notes.map(n=>`<div class="list-row"><span>✎</span><div><div class="row-title">${esc(n.title)}</div><div class="row-sub">${esc(n.text||'')}</div></div><span class="small muted">${esc(n.createdAt||'')}</span></div>`).join('')||empty('Пока нет заметок')}</div></section>`); }
function filesPage(){ return layout('Файлы', 'Документы, чеки, страховки, анализы и материалы поездок.', `<section class="grid cols-3"><article class="card"><h3>Документы</h3><p class="muted">Паспорта, страховки, договоры, сканы и важные сроки.</p><button class="btn secondary" data-go="calendar">Календарь сроков</button></article><article class="card"><h3>Поездки</h3><p class="muted">Билеты, брони, маршруты и бюджет путешествий.</p><button class="btn secondary" data-go="spheres">Открыть папки</button></article><article class="card"><h3>Экспорт</h3><p class="muted">Перед заменой файлов лучше делать экспорт данных.</p><button class="btn" data-action="exportData">Экспорт</button></article></section>`); }
function importPage(){ return layout('Импорт', 'Спокойная загрузка операций без изменения домена и старых версий.', `
  <section class="card"><div class="card-head"><h3>Мастер импорта</h3><span class="pill blue">CSV</span></div><p class="muted">Выбери CSV-файл. Перед сохранением приложение покажет предпросмотр.</p><input type="file" id="csvFile" accept=".csv,text/csv" class="field" /><div class="actions"><button class="btn" data-action="loadCsv">Предпросмотр</button><button class="btn secondary" data-action="confirmCsv" ${csvRows.length?'':'disabled'}>Сохранить импорт</button><button class="btn secondary" data-action="exportData">Экспорт данных</button></div></section>
  ${csvRows.length?`<section class="card" style="margin-top:18px"><h3>Предпросмотр</h3><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr>${csvHeaders.map(h=>`<th>${esc(h)}</th>`).join('')}<th>Категория</th><th>Сумма</th></tr></thead><tbody>${csvRows.slice(0,30).map(r=>`<tr>${csvHeaders.map(h=>`<td>${esc(r[h])}</td>`).join('')}<td>${esc(r.category||'Импорт')}</td><td>${money(r.amount)}</td></tr>`).join('')}</tbody></table></div></section>`:''}`);
}
function diagnosticsPage(){ const meta=localStorage.getItem(META_KEY); return layout('Диагностика', 'Техническая информация отдельно от названия продукта.', `<section class="grid cols-2"><article class="card"><h3>Название приложения</h3><div class="value sm">Second Brain OS</div><p class="muted">Название не меняется от сборки к сборке. Версия не добавляется в домен.</p></article><article class="card"><h3>Сборка</h3><div class="value sm">Light Tech</div><p class="muted small">${BUILD}</p></article><article class="card"><h3>Данные</h3><p class="muted small">Операции: ${state.operations.length}<br>Задачи: ${state.tasks.length}<br>Цели: ${state.goals.length}<br>Сферы: ${state.spheres.length}<br>Люди: ${(state.people||[]).length}<br>Книги: ${(state.books||[]).length}<br>Поездки: ${(state.trips||[]).length}<br>События: ${(state.calendarEvents||[]).length}</p><div class="actions"><button class="btn" data-action="exportData">Экспорт</button><button class="btn secondary" data-action="snapshot">Снимок</button></div></article><article class="card"><h3>Кэш</h3><p class="muted small">Старые service worker и cache будут очищены новым sw.js.</p><button class="btn secondary" data-action="clearCaches">Очистить кэш сайта</button></article></section>`); }

function render(){
  renderNav();
  const view=$('#view');
  const map={dashboard,finance:financePage,budget:budgetPage,roadmap:roadmapPage,tasks:tasksPage,spheres:spheresPage,calendar:calendarPage,notes:notesPage,files:filesPage,import:importPage,diagnostics:diagnosticsPage};
  view.innerHTML = (map[page]||dashboard)();
}
function renderNav(){
  $('#sidebarNav').innerHTML = `<div class="nav-label">Навигация</div>` + navItems.map(([id,ico,label])=>`<button class="nav-btn ${page===id?'active':''}" data-go="${id}"><span class="nav-ico">${ico}</span>${label}</button>`).join('');
  $('#bottomNav').innerHTML = mobileItems.map(([id,ico,label])=>`<button class="${page===id?'active':''}" data-go="${id}"><i>${ico}</i>${label}</button>`).join('');
}
function openModal(title, html){ $('#modalTitle').textContent=title; $('#modalBody').innerHTML=html; $('#modal').classList.add('show'); }
function closeModal(){ $('#modal').classList.remove('show'); }
function openQuick(){ openModal('Быстро добавить', `<div class="grid cols-2"><button class="btn" data-action="addTask">Новая задача</button><button class="btn" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button><button class="btn secondary" data-action="addNote">Заметка</button><button class="btn secondary" data-action="addGoal">Цель</button><button class="btn secondary" data-action="addTrip">Поездка</button><button class="btn secondary" data-action="addPerson">Человек</button><button class="btn secondary" data-action="addCalendarEvent">Событие</button></div>`); }
function addTask(){ openModal('Новая задача', `<div class="form-grid"><div class="field"><label>Задача</label><input id="f_title" placeholder="Например: оплатить страховку"></div><div class="field"><label>Сфера</label><input id="f_area" value="Личное"></div><div class="field"><label>Дата</label><input id="f_due" type="date" value="${todayKey()}"></div><div class="field"><label>Время</label><input id="f_time" type="time"></div></div><div class="actions"><button class="btn" data-action="saveTask">Сохранить</button></div>`); }
function saveTask(){ state.tasks.unshift({id:uid(),title:$('#f_title').value||'Новая задача',area:$('#f_area').value||'Личное',due:$('#f_due').value||todayKey(),time:$('#f_time').value,status:'В работе'}); save(true); closeModal(); toast('Задача добавлена'); render(); }
function addExpense(){ addOperationModal('expense'); }
function addIncome(){ addOperationModal('income'); }
function addOperationModal(type){ openModal(type==='income'?'Добавить доход':'Добавить расход', `<div class="form-grid"><div class="field"><label>Сумма</label><input id="f_amount" inputmode="decimal" placeholder="0"></div><div class="field"><label>Категория</label><input id="f_category" value="${type==='income'?'Доход':'Продукты'}"></div><div class="field"><label>Дата</label><input id="f_date" type="date" value="${todayKey()}"></div><div class="field"><label>Комментарий</label><input id="f_note" placeholder="Описание"></div></div><div class="actions"><button class="btn" data-action="saveOperation" data-type="${type}">Сохранить</button></div>`); }
function saveOperation(type){ state.operations.unshift({id:uid(),type,amount:num($('#f_amount').value),category:$('#f_category').value||'Без категории',date:$('#f_date').value||todayKey(),note:$('#f_note').value||''}); save(true); closeModal(); toast('Операция сохранена'); render(); }
function addNote(){ openModal('Новая заметка', `<div class="field"><label>Заголовок</label><input id="f_title" placeholder="Название заметки"></div><div class="field" style="margin-top:12px"><label>Папка</label><select id="f_folder"><option>Личное</option><option>Финансы</option><option>Здоровье</option><option>Дом</option><option>Машина</option><option>Путешествия</option><option>Идеи</option></select></div><div class="field" style="margin-top:12px"><label>Текст</label><textarea id="f_text" placeholder="Мысль, идея, план..."></textarea></div><div class="actions"><button class="btn" data-action="saveNote">Сохранить</button></div>`); }
function saveNote(){ state.notes.unshift({id:uid(),title:$('#f_title').value||'Новая заметка',text:$('#f_text').value||'',createdAt:todayKey(),folder:$('#f_folder')?.value||'Личное',tags:[]}); save(true); closeModal(); toast('Заметка сохранена'); render(); }
function addGoal(){ openModal('Новая цель', `<div class="form-grid"><div class="field"><label>Название</label><input id="f_title" placeholder="Например: отпуск"></div><div class="field"><label>Сфера</label><input id="f_area" value="Финансы"></div><div class="field"><label>Цель, ₽</label><input id="f_target" inputmode="decimal" placeholder="100000"></div><div class="field"><label>Уже есть, ₽</label><input id="f_current" inputmode="decimal" placeholder="0"></div></div><div class="actions"><button class="btn" data-action="saveGoal">Сохранить</button></div>`); }
function saveGoal(){ state.goals.unshift({id:uid(),title:$('#f_title').value||'Новая цель',area:$('#f_area').value||'Финансы',targetValue:num($('#f_target').value),currentValue:num($('#f_current').value),status:'Активна',nextAction:'Определить первый шаг'}); save(true); closeModal(); toast('Цель создана'); render(); }
function addSphere(){ openModal('Новая сфера жизни', `<div class="form-grid"><div class="field"><label>Название</label><input id="f_title" placeholder="Например: Питомцы"></div><div class="field"><label>Иконка</label><input id="f_icon" value="✣"></div><div class="field"><label>Прогресс, %</label><input id="f_progress" type="number" value="50"></div><div class="field"><label>Комментарий</label><input id="f_note" placeholder="Что важно отслеживать"></div></div><div class="actions"><button class="btn" data-action="saveSphere">Сохранить</button></div>`); }
function saveSphere(){ state.spheres.push({id:uid(),title:$('#f_title').value||'Новая сфера',icon:$('#f_icon').value||'✣',progress:clamp(num($('#f_progress').value)),note:$('#f_note').value||''}); save(true); closeModal(); toast('Сфера добавлена'); render(); }
function addBudget(){ openModal('Новый лимит', `<div class="form-grid"><div class="field"><label>Категория</label><input id="f_category" placeholder="Например: Такси"></div><div class="field"><label>Лимит, ₽</label><input id="f_limit" inputmode="decimal" placeholder="10000"></div></div><div class="actions"><button class="btn" data-action="saveBudget">Сохранить</button></div>`); }
function saveBudget(){ state.budgets.push({id:uid(),category:$('#f_category').value||'Категория',limit:num($('#f_limit').value),group:'custom'}); save(true); closeModal(); toast('Лимит добавлен'); render(); }

function addPerson(){ openModal('Добавить человека', `<div class="form-grid"><div class="field"><label>Имя</label><input id="f_name" placeholder="Имя"></div><div class="field"><label>Отношение</label><input id="f_relation" placeholder="друг, семья, коллега"></div><div class="field"><label>День рождения</label><input id="f_birthday" type="date"></div><div class="field"><label>Любит</label><input id="f_likes" placeholder="кофе, море, книги"></div><div class="field"><label>Идеи разговоров</label><input id="f_talk" placeholder="о чём не забыть поговорить"></div><div class="field"><label>Подарки</label><input id="f_gifts" placeholder="идеи подарков"></div><div class="field" style="grid-column:1/-1"><label>Заметка</label><textarea id="f_person_note"></textarea></div></div><div class="actions"><button class="btn" data-action="savePerson">Сохранить</button></div>`); }
function savePerson(){ state.people.unshift({id:uid(),name:$('#f_name').value||'Человек',relation:$('#f_relation').value||'',birthday:$('#f_birthday').value||'',likes:$('#f_likes').value||'',talkIdeas:$('#f_talk').value||'',gifts:$('#f_gifts').value||'',notes:$('#f_person_note').value||''}); save(true); closeModal(); toast('Человек добавлен'); render(); }
function addBook(){ openModal('Добавить книгу', `<div class="form-grid"><div class="field"><label>Название</label><input id="f_title" placeholder="Название книги"></div><div class="field"><label>Автор</label><input id="f_author" placeholder="Автор"></div><div class="field"><label>Статус</label><select id="f_status"><option>Хочу прочитать</option><option>Читаю</option><option>Прочитано</option><option>В списке</option></select></div><div class="field"><label>Дата</label><input id="f_date" type="date" value="${todayKey()}"></div><div class="field" style="grid-column:1/-1"><label>Главный инсайт</label><textarea id="f_insight" placeholder="Что важно забрать из книги"></textarea></div></div><div class="actions"><button class="btn" data-action="saveBook">Сохранить</button></div>`); }
function saveBook(){ state.books.unshift({id:uid(),title:$('#f_title').value||'Книга',author:$('#f_author').value||'',status:$('#f_status').value||'В списке',insight:$('#f_insight').value||'',createdAt:$('#f_date').value||todayKey()}); save(true); closeModal(); toast('Книга добавлена'); render(); }
function addTrip(){ openModal('Запланировать поездку', `<div class="form-grid"><div class="field"><label>Название</label><input id="f_title" placeholder="Например: отпуск в Турции"></div><div class="field"><label>Направление</label><input id="f_direction" placeholder="Любое направление"></div><div class="field"><label>Дата начала</label><input id="f_start" type="date"></div><div class="field"><label>Дата окончания</label><input id="f_end" type="date"></div><div class="field"><label>Общий бюджет</label><input id="f_budget" inputmode="decimal" placeholder="150000"></div><div class="field"><label>Уже накоплено</label><input id="f_saved" inputmode="decimal" placeholder="0"></div><div class="field"><label>Транспорт</label><input id="f_transport" inputmode="decimal" placeholder="0"></div><div class="field"><label>Жильё</label><input id="f_hotel" inputmode="decimal" placeholder="0"></div><div class="field"><label>Еда</label><input id="f_food" inputmode="decimal" placeholder="0"></div><div class="field"><label>Развлечения</label><input id="f_activities" inputmode="decimal" placeholder="0"></div><div class="field" style="grid-column:1/-1"><label>Заметки</label><textarea id="f_notes" placeholder="Маршрут, идеи, документы, вещи"></textarea></div></div><div class="actions"><button class="btn" data-action="saveTrip">Сохранить поездку</button></div>`); }
function saveTrip(){ const title=$('#f_title').value||'Новая поездка'; const trip={id:uid(),title,direction:$('#f_direction').value||'Любое направление',start:$('#f_start').value||'',end:$('#f_end').value||'',budget:num($('#f_budget').value),saved:num($('#f_saved').value),transport:num($('#f_transport').value),hotel:num($('#f_hotel').value),food:num($('#f_food').value),activities:num($('#f_activities').value),notes:$('#f_notes').value||'',status:'План'}; state.trips.unshift(trip); if(trip.budget){ state.goals.unshift({id:uid(),title:'Поездка: '+title,area:'Путешествия',targetValue:trip.budget,currentValue:trip.saved,status:'Активна',deadline:trip.start||'',nextAction:'Разложить бюджет поездки'}); } if(trip.start){ state.calendarEvents.push({id:uid(),title:'Старт поездки: '+title,date:trip.start,time:'',area:'Путешествия',note:trip.direction}); } save(true); closeModal(); toast('Поездка добавлена'); render(); }
function addCalendarEvent(){ openModal('Новое событие', `<div class="form-grid"><div class="field"><label>Событие</label><input id="f_title" placeholder="Например: встреча, оплата, запись"></div><div class="field"><label>Сфера</label><select id="f_area"><option>Личное</option><option>Финансы</option><option>Здоровье</option><option>Документы</option><option>Путешествия</option><option>Дом</option><option>Машина</option></select></div><div class="field"><label>Дата</label><input id="f_date" type="date" value="${todayKey()}"></div><div class="field"><label>Время</label><input id="f_time" type="time"></div><div class="field" style="grid-column:1/-1"><label>Комментарий</label><textarea id="f_note"></textarea></div></div><div class="actions"><button class="btn" data-action="saveCalendarEvent">Сохранить</button></div>`); }
function saveCalendarEvent(){ state.calendarEvents.unshift({id:uid(),title:$('#f_title').value||'Событие',area:$('#f_area').value||'Личное',date:$('#f_date').value||todayKey(),time:$('#f_time').value||'',note:$('#f_note').value||''}); save(true); closeModal(); toast('Событие добавлено'); render(); }

function toggleTask(id){ const t=state.tasks.find(x=>x.id===id); if(t){t.status = taskStatus(t)==='Готово'?'В работе':'Готово'; save(); render();} }
function exportData(){ const blob=new Blob([JSON.stringify({app:APP_NAME,build:BUILD,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`second-brain-os-backup-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href); toast('Экспорт готов'); }
function snapshot(){ saveSnapshot('manual'); toast('Снимок данных создан'); }
async function clearCaches(){ try{ if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); } if('serviceWorker' in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.update())); } toast('Кэш очищен'); }catch(e){toast('Не удалось очистить кэш');} }
function parseCsv(text){ const lines=text.trim().split(/\r?\n/); if(!lines.length) return []; const split=line=>{ const out=[]; let cur='', q=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){q=!q; continue;} if((ch===','||ch===';')&&!q){out.push(cur.trim()); cur='';} else cur+=ch;} out.push(cur.trim()); return out;}; const heads=split(lines[0]).map((h,i)=>h||`Колонка ${i+1}`); return {heads, rows:lines.slice(1).map(l=>{const vals=split(l); const obj={}; heads.forEach((h,i)=>obj[h]=vals[i]||''); const joined=vals.join(' '); const amount=vals.map(v=>num(v)).find(v=>v>0)||0; obj.amount=amount; obj.category=obj.category||obj['Категория']||obj['category']||'Импорт'; return obj;})}; }
async function loadCsv(){ const input=$('#csvFile'); const f=input?.files?.[0]; if(!f){toast('Выбери CSV-файл'); return;} const text=await f.text(); const parsed=parseCsv(text); csvHeaders=parsed.heads; csvRows=parsed.rows; toast(`Строк: ${csvRows.length}`); render(); }
function confirmCsv(){ csvRows.forEach(r=>state.operations.unshift({id:uid(),date:todayKey(),type:'expense',amount:num(r.amount),category:r.category||'Импорт',note:Object.values(r).slice(0,3).join(' ')})); csvRows=[]; csvHeaders=[]; save(true); toast('Импорт сохранён'); render(); }

document.addEventListener('click', e=>{
  const goBtn=e.target.closest('[data-go]'); if(goBtn) return go(goBtn.dataset.go);
  const folderBtn=e.target.closest('[data-life-folder]'); if(folderBtn){ state.settings.lifeFolder=folderBtn.dataset.lifeFolder; save(); return render(); }
  const a=e.target.closest('[data-action]'); if(!a) return;
  const action=a.dataset.action;
  const map={openQuick,closeModal,addTask,saveTask,addExpense,addIncome,saveNote,addNote,addGoal,saveGoal,addSphere,saveSphere,addBudget,saveBudget,addPerson,savePerson,addBook,saveBook,addTrip,saveTrip,addCalendarEvent,saveCalendarEvent,exportData,snapshot,clearCaches,loadCsv,confirmCsv};
  if(action==='saveOperation') return saveOperation(a.dataset.type);
  if(action==='toggleTask') return toggleTask(a.dataset.id);
  if(map[action]) return map[action]();
});

document.addEventListener('change', e=>{ if(e.target && e.target.id==='lifeFolderPicker'){ state.settings.lifeFolder=e.target.value; save(); render(); } });

document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); $('#globalSearch')?.focus(); }});
$('#globalSearch')?.addEventListener('input', e=>{ const q=e.target.value.trim().toLowerCase(); if(!q) return; const found=[...state.tasks,...state.notes,...state.operations,...(state.people||[]),...(state.books||[]),...(state.trips||[]),...(state.calendarEvents||[])].filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,5); openModal('Поиск', found.map(x=>`<div class="mini-box" style="margin-bottom:8px"><b>${esc(x.title||x.category||x.note||'Результат')}</b><div class="small muted">${esc(x.text||x.note||x.area||'')}</div></div>`).join('')||empty('Ничего не найдено')); });

(async function maintenance(){
  try{ localStorage.setItem('secondBrainOS.currentBuild', BUILD); }catch(e){}
  if('serviceWorker' in navigator){
    try{ const reg=await navigator.serviceWorker.register('sw.js'); reg.update(); }catch(e){}
  }
  if('caches' in window){
    try{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>/second-brain|sbos/i.test(k) && k!=='second-brain-os-life-polish-light-tech').map(k=>caches.delete(k))); }catch(e){}
  }
})();


/* ===== Life Polish Light Tech overrides: notes edit/delete, task buttons, import balance, SMART goals, calendar Google links ===== */
function ensureLifePolishState(){
  state.settings = {...(state.settings||{}), taskFilter: state.settings?.taskFilter || 'today', importActualBalance: state.settings?.importActualBalance ?? '', dailyReflection: state.settings?.dailyReflection || ''};
  if(!Array.isArray(state.ideas)) state.ideas = [
    {id:uid(), title:'Сделать личный финансовый ритуал', text:'Раз в неделю смотреть бюджет, цели и одну сферу жизни.', area:'Фокус', createdAt:todayKey()},
    {id:uid(), title:'Список поездок мечты', text:'Собрать направления, примерный бюджет и сроки.', area:'Планирование', createdAt:todayKey()}
  ];
  if(!Array.isArray(state.people)) state.people=[];
  if(!Array.isArray(state.books)) state.books=[];
  if(!Array.isArray(state.trips)) state.trips=[];
  if(!Array.isArray(state.calendarEvents)) state.calendarEvents=[];
  if(!Array.isArray(state.notes)) state.notes=[];
  state.dataCore = {...(state.dataCore||{}), schema:4800, updatedAt:new Date().toISOString()};
}
ensureLifePolishState(); save();

function dailyQuote(){
  const quotes = [
    ['Порядок в деньгах начинается с честного взгляда на реальность.','Я не ругаю себя за прошлые траты. Я просто вижу картину и выбираю следующий шаг.'],
    ['Сначала заплати себе — потом распределяй остальное.','Моя свобода начинается не с суммы, а с привычки откладывать регулярно.'],
    ['Маленькие действия, повторённые много раз, становятся системой.','Сегодня мне достаточно одного ясного действия, а не идеального плана.'],
    ['Деньги любят внимание, но не тревогу.','Я управляю деньгами спокойно: считаю, планирую, корректирую.'],
    ['Цель без следующего шага остаётся мечтой.','Я превращаю желание в маленькое действие на этой неделе.']
  ];
  const i = new Date().getDate() % quotes.length;
  return {quote:quotes[i][0], thought:quotes[i][1]};
}
function quoteOfDayCard(){
  const q=dailyQuote();
  return `<article class="card quote-card"><div class="card-head"><h3>Цитата дня</h3><span class="pill blue">рефлексия</span></div><p style="font-size:18px;line-height:1.45;margin:0 0 10px">“${esc(q.quote)}”</p><div class="small muted"><b>Что я думаю:</b> ${esc(q.thought)}</div><textarea id="dailyReflection" placeholder="Моя мысль на сегодня...">${esc(state.settings.dailyReflection||'')}</textarea><div class="actions"><button class="btn secondary" data-action="saveDailyReflection">Сохранить мысль</button></div></article>`;
}
function saveDailyReflection(){ state.settings.dailyReflection = $('#dailyReflection')?.value || ''; save(true); toast('Мысль дня сохранена'); render(); }
function taskCounts(){
  const open=openTasks();
  return {today:open.filter(t=>t.due===todayKey()).length, upcoming:open.filter(t=>!t.due || t.due>=todayKey()).length, overdue:open.filter(t=>t.due && t.due<todayKey()).length};
}
function setTaskFilter(kind){ state.settings.taskFilter=kind; save(); render(); }
function filteredTasks(){
  const f=state.settings.taskFilter||'today'; const open=openTasks();
  if(f==='today') return open.filter(t=>t.due===todayKey());
  if(f==='overdue') return open.filter(t=>t.due && t.due<todayKey());
  return open.filter(t=>!t.due || t.due>=todayKey());
}
function rowTaskPro(t){
  return `<div class="list-row"><button class="check ${taskStatus(t)==='Готово'?'done':''}" data-action="toggleTask" data-id="${t.id}" title="Готово"></button><button class="mini-btn" data-action="editTask" data-id="${t.id}" style="text-align:left;background:transparent;border:0;min-width:0"><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.area||'Личное')} • ${esc(t.due||'')} ${esc(t.time||'')}</div></button><div class="button-row"><button class="mini-btn google-btn" data-action="googleTask" data-id="${t.id}">Google</button><button class="mini-btn red" data-action="deleteTask" data-id="${t.id}">Удалить</button></div></div>`;
}
function taskTabs(){ const c=taskCounts(); const f=state.settings.taskFilter||'today'; return `<div class="button-row" style="margin:0 0 10px"><button class="tab-btn ${f==='today'?'active':''}" data-action="setTaskFilter" data-filter="today">Сегодня ${c.today}</button><button class="tab-btn ${f==='upcoming'?'active':''}" data-action="setTaskFilter" data-filter="upcoming">Предстоящие ${c.upcoming}</button><button class="tab-btn danger ${f==='overdue'?'active':''}" data-action="setTaskFilter" data-filter="overdue">Просроченные ${c.overdue}</button></div>`; }

function dashboard(){
  const s=summary(); const safe=s.safetyGoal; const safeP=goalProgress(safe); const shown=filteredTasks().slice(0,5);
  return layout('Обзор','Доброе утро! Деньги, задачи и жизнь — в одном чистом экране.',`
    <section class="grid dashboard">
      <article class="card premium-hero-card"><div class="card-head"><h3>Финансы</h3><button class="link" data-go="finance">Подробнее →</button></div><div class="muted small">Общий баланс</div><div class="value">${money(s.balance)}</div><div class="metric-row"><div><div class="small muted">Доходы</div><div class="green strong">+ ${money(s.income)}</div></div><div><div class="small muted">Расходы</div><div class="strong">− ${money(s.expenses)}</div></div></div>${financeSpark()}</article>
      <article class="card"><div class="card-head"><h3>Бюджет на сегодня</h3><button class="link" data-go="budget">Подробнее →</button></div><div class="split"><div class="ring" style="--p:${s.progress}"><span>${s.progress}%</span></div><div><div class="small muted">Лимит на день</div><div class="value sm">${money(s.dailyLimit)}</div><div class="small muted">Факт. остаток</div><div class="strong">${state.settings.currentBalance?money(state.settings.currentBalance):'не указан'}</div></div></div></article>
      <article class="card"><div class="card-head"><h3>Подушка безопасности</h3><button class="link" data-go="roadmap">Подробнее →</button></div><div class="value sm">${money(safe?.currentValue||0)}</div><div class="small muted">из ${money(safe?.targetValue||0)}</div>${progressBar(safeP)}<div class="stat-row"><span class="small muted">${safeP}% вашей цели</span><span class="pill blue">Защита</span></div></article>
    </section>
    <section class="grid cols-3" style="margin-top:18px">
      <article class="card"><div class="card-head"><h3>Задачи</h3><button class="link" data-action="addTask">Новая +</button></div>${taskTabs()}<div class="task-list">${shown.map(rowTaskPro).join('')||empty('Нет задач в этом фильтре')}</div></article>
      <article class="card"><div class="card-head"><h3>Сферы жизни</h3><button class="link" data-go="spheres">Папки →</button></div><div class="folder-list" style="grid-template-columns:repeat(2,minmax(0,1fr))">${lifeFolders().filter(f=>f[0]!=='overview').slice(0,5).map(([id,label,ico])=>`<button class="folder-card ${currentLifeFolder()===id?'active':''}" data-life-folder="${id}"><div class="folder-ico">${ico}</div><strong>${label}</strong><small>${lifeFolderSubtitle(id)}</small></button>`).join('')}</div></article>
      ${quoteOfDayCard()}
    </section>
    <section class="grid bottom" style="margin-top:18px">
      <article class="card"><div class="card-head"><h3>Последние операции</h3><button class="link" data-go="finance">Все операции</button></div><div class="op-list">${state.operations.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5).map(rowOperation).join('')}</div></article>
      <article class="card"><div class="card-head"><h3>Ближайшее в календаре</h3><button class="link" data-go="calendar">Календарь</button></div><div class="note-list">${upcomingEvents().slice(0,4).map(rowCalendarEvent).join('')||empty('Пока нет событий')}</div></article>
      <article class="card"><div class="card-head"><h3>Планирование</h3><button class="link" data-action="addTrip">Поездка +</button></div>${renderPlanningMini()}</article>
    </section>`);
}
function lifeFolderSubtitle(id){ return ({people:'контакты, подарки, разговоры',notes:'мысли и личные записи',planning:'поездки, бюджет, календарь',books:'чтение и инсайты',ideas:'идеи и проекты'}[id]||'папка'); }
function renderPlanningMini(){ const t=(state.trips||[])[0]; if(!t) return `<p class="muted">Запланируй поездку с бюджетом и датами.</p><button class="btn" data-action="addTrip">Добавить поездку</button>`; const pct=t.budget?clamp(Math.round(num(t.saved)/num(t.budget)*100)):0; return `<div class="value sm">${esc(t.title)}</div><p class="muted small">${esc(t.direction||'Любое направление')} · ${money(t.budget)}</p>${progressBar(pct)}<div class="stat-row"><span class="small muted">накоплено ${money(t.saved)}</span><span class="pill blue">${pct}%</span></div>`; }

function financePrinciples(){ return `<div class="finance-principles"><div class="principle"><b>Заплати себе сначала</b><span>После дохода сразу отложи 10%, а потом распределяй остальное.</span></div><div class="principle"><b>Цена покупки — это часы жизни</b><span>Перед крупной тратой спроси: сколько времени я отдаю за это?</span></div><div class="principle"><b>Подушка важнее идеальности</b><span>Сначала запас спокойствия, потом сложные финансовые решения.</span></div></div>`; }
function financePage(){
  const s=summary(); const actual=num(state.settings.currentBalance); const delta=actual?actual-s.balance:0;
  return layout('Финансы','Красивый контроль денег без перегруза: баланс, факт, категории и принципы.',`
    <section class="grid cols-3"><article class="card premium-hero-card"><h3>Денежная позиция</h3><div class="value">${money(s.balance)}</div><div class="small muted">расчётный баланс</div>${financeSpark()}</article><article class="card"><h3>Фактический остаток</h3><div class="value sm">${actual?money(actual):'не указан'}</div><p class="muted small">Указывается вручную при импорте или сверке.</p><button class="btn secondary" data-go="import">Сверить баланс</button></article><article class="card"><h3>Расхождение</h3><div class="value sm ${Math.abs(delta)>0?'amber':''}">${actual?money(delta):'—'}</div><p class="muted small">Если факт отличается от расчёта — проверь импорт и наличные.</p></article></section>
    <section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Категории расходов</h3><button class="btn secondary" data-action="addExpense">Расход</button></div><div class="note-list" style="margin-top:14px">${s.topCats.map(([cat,amount])=>`<div class="list-row"><span>◔</span><div><div class="row-title">${esc(cat)}</div>${progressBar(s.expenses?amount/s.expenses*100:0, amount===s.topCats[0]?.[1]?'amber':'')}</div><b>${money(amount)}</b></div>`).join('')||empty('Расходов пока нет')}</div></article><article class="card"><div class="card-head"><h3>Финансовые принципы</h3><span class="pill blue">без перегруза</span></div>${financePrinciples()}<div class="soft-divider"></div><details class="drawer"><summary>Что сделать на этой неделе</summary><div class="drawer-body">1) Сверить фактический остаток. 2) Разобрать топ-3 категории. 3) Отложить 10% от ближайшего дохода.</div></details></article></section>
    <section class="card" style="margin-top:18px"><div class="card-head"><h3>Последние операции</h3><div class="button-row"><button class="btn" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button><button class="btn secondary" data-go="import">Импорт</button></div></div><div class="op-list">${state.operations.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,12).map(rowOperation).join('')}</div></section>`);
}
function dailySpendSeries(){
  const now=new Date(); const days=new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(); const arr=Array.from({length:days},(_,i)=>({day:i+1, amount:0}));
  monthOps('expense').forEach(o=>{ const d=Number(String(o.date||'').slice(8,10)); if(d>=1&&d<=days) arr[d-1].amount+=num(o.amount); });
  const max=Math.max(1,...arr.map(x=>x.amount)); const avg=arr.reduce((a,b)=>a+b.amount,0)/Math.max(1,arr.filter(x=>x.amount>0).length);
  return arr.map(x=>({...x, h:Math.max(5, Math.round(x.amount/max*100)), hot:x.amount>avg*1.6 && x.amount>0, warn:x.amount>avg*1.1 && x.amount>0}));
}
function renderDailySpendChart(){ const arr=dailySpendSeries(); return `<div class="day-chart">${arr.map(x=>`<div class="day-bar ${x.hot?'hot':x.warn?'warn':''}" style="--h:${x.h}%" data-tip="${x.day}: ${money(x.amount)}"></div>`).join('')}</div><div class="small muted">Красным выделены дни, где траты выше обычного. Наведи на столбец, чтобы увидеть сумму.</div>`; }
function budgetPage(){
  const s=summary(); const items=budgetStats(); const used=items.reduce((a,b)=>a+b.spent,0), limit=items.reduce((a,b)=>a+b.limit,0);
  return layout('Бюджет','Лимиты, конверты и график трат по дням.',`
    <section class="grid cols-3"><article class="card premium-hero-card"><h3>Деньги до конца месяца</h3><div class="value">${money(Math.max(0, s.income-s.expenses-s.planned))}</div><div class="small muted">плановый остаток</div></article><article class="card"><h3>Можно тратить в день</h3><div class="value blue">${money(s.dailyLimit)}</div><div class="small muted">чтобы остаться в плане</div></article><article class="card"><h3>Лимиты категорий</h3><div class="value sm">${limit?Math.round(used/limit*100):0}%</div>${progressBar(limit?used/limit*100:0)}</article></section>
    <section class="card" style="margin-top:18px"><div class="card-head"><h3>График трат по дням</h3><span class="pill blue">месяц</span></div>${renderDailySpendChart()}</section>
    <section class="card" style="margin-top:18px"><div class="card-head"><h3>Конверты по категориям</h3><button class="btn secondary" data-action="addBudget">Добавить лимит</button></div><div class="grid cols-2">${items.map(b=>`<div class="mini-box"><div class="stat-row"><strong>${esc(b.category)}</strong><span class="pill ${b.pct>100?'red':b.pct>80?'amber':'blue'}">${b.pct}%</span></div><div class="small muted">${money(b.spent)} из ${money(b.limit)}</div>${progressBar(b.pct, b.pct>100?'':b.pct>80?'amber':'green')}<div class="small muted" style="margin-top:8px">Осталось: ${money(b.left)}</div></div>`).join('')}</div></section>`);
}
function roadmapPage(){
  return layout('Дорожная карта','Цели в формате SMART + спокойные шаги по принципу 52 недель.',`<section class="grid cols-2">${state.goals.map(g=>`<article class="card"><div class="card-head"><h3>${esc(g.title)}</h3><span class="pill blue">${goalProgress(g)}%</span></div><div class="value sm">${money(g.currentValue)} / ${money(g.targetValue)}</div>${progressBar(goalProgress(g), goalProgress(g)>70?'green':'')}<div class="smart-grid"><div class="smart-chip"><b>S</b><span>${esc(g.title)}</span></div><div class="smart-chip"><b>M</b><span>${goalProgress(g)}%</span></div><div class="smart-chip"><b>A</b><span>малый шаг</span></div><div class="smart-chip"><b>R</b><span>${esc(g.area||'жизнь')}</span></div><div class="smart-chip"><b>T</b><span>${esc(g.deadline||'дата')}</span></div></div><details class="drawer"><summary>Рекомендация 52 недели</summary><div class="drawer-body">Выбери один встречный шаг на эту неделю: ${esc(g.nextAction||'определить первое действие')}. Не перегружай цель — только один измеримый шаг.</div></details><div class="actions"><button class="btn secondary" data-action="addTaskFromGoal" data-id="${g.id}">Создать шаг</button></div></article>`).join('')}<article class="card"><h3>Новая SMART-цель</h3><p class="muted">Формулируй цель конкретно: что, сколько, зачем и до какого срока.</p><button class="btn" data-action="addGoal">Добавить цель</button></article></section>`);
}
function tasksPage(){ return layout('Задачи','Активные кнопки, фильтры и добавление задач в Google Calendar.',`<section class="card"><div class="card-head"><h3>Открытые задачи</h3><button class="btn" data-action="addTask">Новая задача</button></div>${taskTabs()}<div class="task-list">${filteredTasks().map(rowTaskPro).join('')||empty('Нет задач в этом фильтре')}</div></section>`); }
function lifeFolders(){return [['overview','Все папки','✣'],['people','Люди','◌'],['notes','Заметки','✎'],['planning','Планирование','☷'],['books','Книги','◧'],['ideas','Идеи','✦']];}
function lifeCounts(){return {people:(state.people||[]).length,notes:(state.notes||[]).length,books:(state.books||[]).length,trips:(state.trips||[]).length,events:(state.calendarEvents||[]).length,ideas:(state.ideas||[]).length};}
function renderLifeOverview(){ const c=lifeCounts(); return `<section class="folder-list">${lifeFolders().filter(f=>f[0]!=='overview').map(([id,label,ico])=>`<button class="folder-card" data-life-folder="${id}"><div class="folder-ico">${ico}</div><strong>${label}</strong><small>${lifeFolderSubtitle(id)}</small><span class="pill blue">${id==='people'?c.people:id==='notes'?c.notes:id==='books'?c.books:id==='ideas'?c.ideas:c.trips+c.events}</span></button>`).join('')}</section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Сферы</h3><button class="btn secondary" data-action="addSphere">Добавить сферу</button></div><div class="grid cols-3">${state.spheres.map(renderSphereCard).join('')}</div></section>`; }
function renderSphereCard(s){ return `<article class="mini-box"><div class="stat-row"><strong>${esc(s.icon||'✣')} ${esc(s.title)}</strong><span class="pill blue">${num(s.progress)}%</span></div>${progressBar(num(s.progress), num(s.progress)>75?'green':'')}<p class="small muted">${esc(s.note||'')}</p><div class="button-row"><button class="mini-btn" data-action="editSphere" data-id="${s.id}">Редактировать</button><button class="mini-btn red" data-action="deleteSphere" data-id="${s.id}">Удалить</button></div></article>`; }
function renderNotesFolder(){ return `<section class="card"><div class="card-head"><h3>Заметки</h3><button class="btn" data-action="addNote">Новая заметка</button></div><div class="note-list">${state.notes.map(rowNote).join('')||empty('Нет заметок')}</div></section>`; }
function renderPlanningFolder(){ return `<section class="grid cols-2"><article class="card"><div class="card-head"><h3>Путешествия и планы</h3><button class="btn" data-action="addTrip">Запланировать</button></div><div class="note-list">${(state.trips||[]).map(t=>`<div class="list-row"><span>✈</span><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.direction)} • бюджет ${money(t.budget)} • накоплено ${money(t.saved)}</div>${progressBar(t.budget?num(t.saved)/num(t.budget)*100:0)}</div><div class="button-row"><button class="mini-btn" data-action="addCalendarEventFromTrip" data-id="${t.id}">В календарь</button><button class="mini-btn red" data-action="deleteTrip" data-id="${t.id}">Удалить</button></div></div>`).join('')||empty('Планов поездок пока нет')}</div></article><article class="card"><div class="card-head"><h3>Календарь планов</h3><button class="btn secondary" data-action="addCalendarEvent">Событие</button></div><div class="note-list">${upcomingEvents().slice(0,8).map(rowCalendarEvent).join('')||empty('Нет событий')}</div></article></section>`; }
function renderIdeasFolder(){ return `<section class="card"><div class="card-head"><h3>Идеи</h3><button class="btn" data-action="addIdea">Новая идея</button></div><div class="note-list">${(state.ideas||[]).map(rowIdea).join('')||empty('Идей пока нет')}</div></section>`; }
function spheresPage(){ const folder=currentLifeFolder(); const map={overview:renderLifeOverview,people:renderPeopleFolder,notes:renderNotesFolder,planning:renderPlanningFolder,books:renderBooksFolder,ideas:renderIdeasFolder}; return layout('Сферы жизни','Папки: люди, заметки, планирование, книги и идеи.',`<section class="card life-folder-head"><div class="card-head"><div><h3>Папки жизни</h3><p class="muted small">Выпадающий список и карточки — всё в едином light tech-дизайне.</p></div>${lifeFolderSelect()}</div></section><div style="margin-top:18px">${(map[folder]||renderLifeOverview)()}</div>`); }
function rowNote(n){ return `<div class="list-row"><span>✎</span><button class="mini-btn" data-action="editNote" data-id="${n.id}" style="text-align:left;background:transparent;border:0;min-width:0"><div class="row-title">${esc(n.title)}</div><div class="row-sub">${esc(n.text||'')} • ${esc(n.folder||'')}</div></button><div class="button-row"><button class="mini-btn" data-action="editNote" data-id="${n.id}">Править</button><button class="mini-btn red" data-action="deleteNote" data-id="${n.id}">Удалить</button></div></div>`; }
function rowIdea(i){ return `<div class="list-row"><span>✦</span><div><div class="row-title">${esc(i.title)}</div><div class="row-sub">${esc(i.text||'')} • ${esc(i.area||'')}</div></div><div class="button-row"><button class="mini-btn" data-action="editIdea" data-id="${i.id}">Править</button><button class="mini-btn red" data-action="deleteIdea" data-id="${i.id}">Удалить</button></div></div>`; }
function notesPage(){ return layout('Заметки','Создание, корректировка и удаление заметок.',`<section class="card"><div class="card-head"><h3>Все заметки</h3><button class="btn" data-action="addNote">Новая заметка</button></div><div class="note-list">${state.notes.map(rowNote).join('')||empty('Пока нет заметок')}</div></section>`); }
function rowCalendarEvent(e){ return `<div class="list-row"><span>☷</span><div><div class="row-title">${esc(e.title)}</div><div class="row-sub">${esc(e.date)} ${esc(e.time||'')} • ${esc(e.note||'')}</div></div><div class="button-row"><button class="mini-btn google-btn" data-action="googleEvent" data-id="${e.id}">Google</button><button class="mini-btn red" data-action="deleteCalendarEvent" data-id="${e.id}">Удалить</button></div></div>`; }
function calendarPage(){ const now=new Date(); const y=now.getFullYear(), m=now.getMonth(); const first=new Date(y,m,1); const start=(first.getDay()+6)%7; const days=new Date(y,m+1,0).getDate(); const cells=[]; for(let i=0;i<start;i++) cells.push(`<div class="calendar-cell muted"></div>`); for(let d=1; d<=days; d++){ const date=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const ev=upcomingEvents().filter(e=>e.date===date); cells.push(`<button class="calendar-cell ${date===todayKey()?'today':''}" data-action="addCalendarEvent"><strong>${d}</strong><div class="calendar-badges">${ev.slice(0,3).map(e=>`<span>${esc(e.area||'•')}</span>`).join('')}</div></button>`);} return layout('Календарь','События и задачи можно открыть в Google Calendar.',`<section class="grid cols-2"><article class="card"><div class="card-head"><h3>${new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</h3><button class="btn" data-action="addCalendarEvent">Событие</button></div><div class="calendar-weekdays"><b>Пн</b><b>Вт</b><b>Ср</b><b>Чт</b><b>Пт</b><b>Сб</b><b>Вс</b></div><div class="calendar-cells">${cells.join('')}</div></article><article class="card"><div class="card-head"><h3>Ближайшее</h3><button class="btn secondary" data-action="addTrip">Поездка</button></div><div class="note-list">${upcomingEvents().slice(0,12).map(rowCalendarEvent).join('')||empty('Ближайших событий нет')}</div><div class="soft-divider"></div><p class="small muted">Кнопка Google открывает форму создания события в твоём Google Calendar. После открытия нужно нажать “Сохранить”.</p></article></section>`);}
function importPage(){
  const s=summary(); const actual = state.settings.importActualBalance !== '' ? num(state.settings.importActualBalance) : num(state.settings.currentBalance);
  const diff = actual ? actual - s.balance : 0;
  return layout('Импорт','CSV + ручной фактический остаток для сверки баланса.',`
  <section class="grid cols-2"><article class="card"><div class="card-head"><h3>Мастер импорта CSV</h3><span class="pill blue">без смены домена</span></div><p class="muted">Загрузи CSV, проверь строки и укажи фактический остаток на балансе перед сохранением.</p><input type="file" id="csvFile" accept=".csv,text/csv" class="field" /><div class="form-grid" style="margin-top:12px"><div class="field"><label>Фактический остаток на балансе</label><input id="importActualBalance" inputmode="decimal" placeholder="Например: 125000" value="${esc(state.settings.importActualBalance||state.settings.currentBalance||'')}"></div><div class="field"><label>Категория по умолчанию</label><input id="importDefaultCategory" value="Импорт"></div></div><div class="actions"><button class="btn" data-action="loadCsv">Предпросмотр</button><button class="btn secondary" data-action="saveImportBalance">Сохранить остаток</button><button class="btn secondary" data-action="confirmCsv" ${csvRows.length?'':'disabled'}>Сохранить импорт</button></div></article><article class="card"><h3>Сверка баланса</h3><div class="value sm">${actual?money(actual):'не указан'}</div><p class="muted small">Расчётный баланс: ${money(s.balance)}<br>Расхождение: ${actual?money(diff):'—'}</p><div class="balance-reconcile">Совет: если расхождение большое — проверь дубли, наличные расходы и операции без категории.</div></article></section>
  ${csvRows.length?`<section class="card" style="margin-top:18px"><div class="card-head"><h3>Предпросмотр строк</h3><span class="pill blue">${csvRows.length} строк</span></div><div class="table-wrap"><table class="table"><thead><tr>${csvHeaders.map(h=>`<th>${esc(h)}</th>`).join('')}<th>Категория</th><th>Сумма</th></tr></thead><tbody>${csvRows.slice(0,40).map((r,i)=>`<tr>${csvHeaders.map(h=>`<td>${esc(r[h])}</td>`).join('')}<td><input data-action="csvCategoryInput" data-row="${i}" value="${esc(r.category||'Импорт')}" style="border:1px solid #e5eaf2;border-radius:10px;padding:7px;width:150px"></td><td>${money(r.amount)}</td></tr>`).join('')}</tbody></table></div></section>`:''}`);
}
function saveImportBalance(){ const v=$('#importActualBalance')?.value ?? ''; state.settings.importActualBalance=v; if(v!=='') state.settings.currentBalance=num(v); save(true); toast('Фактический остаток сохранён'); render(); }
function confirmCsv(){ const defaultCat=$('#importDefaultCategory')?.value || 'Импорт'; const v=$('#importActualBalance')?.value ?? ''; if(v!==''){ state.settings.importActualBalance=v; state.settings.currentBalance=num(v); } csvRows.forEach((r,i)=>{ const inp=document.querySelector(`[data-action="csvCategoryInput"][data-row="${i}"]`); const cat=inp?.value || r.category || defaultCat; state.operations.unshift({id:uid(),date:todayKey(),type:'expense',amount:num(r.amount),category:cat,note:Object.values(r).slice(0,3).join(' ')}); }); csvRows=[]; csvHeaders=[]; save(true); toast('Импорт сохранён, баланс сверяется'); render(); }

function googleCalendarUrl(title,date,time,details){ const d=(date||todayKey()).replaceAll('-',''); const start=time?`${d}T${String(time).replace(':','')}00`:`${d}`; const end=time?`${d}T${String(Number(String(time).slice(0,2))+1).padStart(2,'0')}${String(time).slice(3,5)}00`:`${d}`; return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title||'Событие')}&dates=${start}/${end}&details=${encodeURIComponent(details||'Создано из Second Brain OS')}`; }
function openGoogleTask(id){ const t=state.tasks.find(x=>x.id===id); if(!t) return; window.open(googleCalendarUrl(t.title,t.due,t.time,`Сфера: ${t.area||''}`),'_blank'); }
function openGoogleEvent(id){ let ev=state.calendarEvents.find(x=>x.id===id); if(!ev){ const t=state.tasks.find(x=>x.id===id); if(t) ev={title:t.title,date:t.due,time:t.time,note:'Задача: '+(t.area||'')}; } if(!ev){ const tr=state.trips.find(x=>x.id===id); if(tr) ev={title:'Поездка: '+tr.title,date:tr.start||todayKey(),time:'',note:tr.direction||''}; } if(!ev) return; window.open(googleCalendarUrl(ev.title,ev.date,ev.time,ev.note||ev.area),'_blank'); }
function editNote(id){ const n=state.notes.find(x=>x.id===id); if(!n) return; openModal('Редактировать заметку',`<div class="field"><label>Заголовок</label><input id="f_title" value="${esc(n.title)}"></div><div class="field" style="margin-top:12px"><label>Папка</label><input id="f_folder" value="${esc(n.folder||'Личное')}"></div><div class="field" style="margin-top:12px"><label>Текст</label><textarea id="f_text">${esc(n.text||'')}</textarea></div><div class="actions"><button class="btn" data-action="saveEditedNote" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteNote" data-id="${id}">Удалить</button></div>`); }
function saveEditedNote(id){ const n=state.notes.find(x=>x.id===id); if(n){ n.title=$('#f_title').value||n.title; n.folder=$('#f_folder').value||'Личное'; n.text=$('#f_text').value||''; save(true); closeModal(); toast('Заметка обновлена'); render(); } }
function deleteNote(id){ if(confirm('Удалить заметку?')){ state.notes=state.notes.filter(x=>x.id!==id); save(true); closeModal(); toast('Заметка удалена'); render(); } }
function editSphere(id){ const s=state.spheres.find(x=>x.id===id); if(!s) return; openModal('Редактировать сферу',`<div class="form-grid"><div class="field"><label>Название</label><input id="f_title" value="${esc(s.title)}"></div><div class="field"><label>Иконка</label><input id="f_icon" value="${esc(s.icon||'✣')}"></div><div class="field"><label>Прогресс, %</label><input id="f_progress" type="number" value="${num(s.progress)}"></div><div class="field"><label>Комментарий</label><input id="f_note" value="${esc(s.note||'')}"></div></div><div class="actions"><button class="btn" data-action="saveEditedSphere" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteSphere" data-id="${id}">Удалить</button></div>`); }
function saveEditedSphere(id){ const s=state.spheres.find(x=>x.id===id); if(s){ s.title=$('#f_title').value||s.title; s.icon=$('#f_icon').value||'✣'; s.progress=clamp(num($('#f_progress').value)); s.note=$('#f_note').value||''; save(true); closeModal(); toast('Сфера обновлена'); render(); } }
function deleteSphere(id){ if(confirm('Удалить сферу жизни?')){ state.spheres=state.spheres.filter(x=>x.id!==id); save(true); closeModal(); toast('Сфера удалена'); render(); } }
function editTask(id){ const t=state.tasks.find(x=>x.id===id); if(!t) return; openModal('Редактировать задачу',`<div class="form-grid"><div class="field"><label>Задача</label><input id="f_title" value="${esc(t.title)}"></div><div class="field"><label>Сфера</label><input id="f_area" value="${esc(t.area||'Личное')}"></div><div class="field"><label>Дата</label><input id="f_due" type="date" value="${esc(t.due||todayKey())}"></div><div class="field"><label>Время</label><input id="f_time" type="time" value="${esc(t.time||'')}"></div></div><div class="actions"><button class="btn" data-action="saveEditedTask" data-id="${id}">Сохранить</button><button class="btn secondary google-btn" data-action="googleTask" data-id="${id}">В Google Calendar</button><button class="btn danger" data-action="deleteTask" data-id="${id}">Удалить</button></div>`); }
function saveEditedTask(id){ const t=state.tasks.find(x=>x.id===id); if(t){ t.title=$('#f_title').value||t.title; t.area=$('#f_area').value||'Личное'; t.due=$('#f_due').value||todayKey(); t.time=$('#f_time').value||''; save(true); closeModal(); toast('Задача обновлена'); render(); } }
function deleteTask(id){ if(confirm('Удалить задачу?')){ state.tasks=state.tasks.filter(x=>x.id!==id); save(true); closeModal(); toast('Задача удалена'); render(); } }
function addTaskFromGoal(id){ const g=state.goals.find(x=>x.id===id); if(g){ state.tasks.unshift({id:uid(),title:g.nextAction||`Шаг по цели: ${g.title}`,area:g.area||'Цель',due:todayKey(),time:'',status:'В работе',priority:'Средний'}); save(true); toast('Шаг добавлен в задачи'); render(); } }
function addIdea(){ openModal('Новая идея',`<div class="field"><label>Название</label><input id="f_title" placeholder="Идея"></div><div class="field" style="margin-top:12px"><label>Сфера</label><input id="f_area" value="Идеи"></div><div class="field" style="margin-top:12px"><label>Описание</label><textarea id="f_text"></textarea></div><div class="actions"><button class="btn" data-action="saveIdea">Сохранить</button></div>`); }
function saveIdea(){ state.ideas.unshift({id:uid(),title:$('#f_title').value||'Новая идея',area:$('#f_area').value||'Идеи',text:$('#f_text').value||'',createdAt:todayKey()}); save(true); closeModal(); toast('Идея сохранена'); render(); }
function editIdea(id){ const i=state.ideas.find(x=>x.id===id); if(!i) return; openModal('Редактировать идею',`<div class="field"><label>Название</label><input id="f_title" value="${esc(i.title)}"></div><div class="field" style="margin-top:12px"><label>Сфера</label><input id="f_area" value="${esc(i.area||'Идеи')}"></div><div class="field" style="margin-top:12px"><label>Описание</label><textarea id="f_text">${esc(i.text||'')}</textarea></div><div class="actions"><button class="btn" data-action="saveEditedIdea" data-id="${id}">Сохранить</button><button class="btn danger" data-action="deleteIdea" data-id="${id}">Удалить</button></div>`); }
function saveEditedIdea(id){ const i=state.ideas.find(x=>x.id===id); if(i){ i.title=$('#f_title').value||i.title; i.area=$('#f_area').value||'Идеи'; i.text=$('#f_text').value||''; save(true); closeModal(); toast('Идея обновлена'); render(); } }
function deleteIdea(id){ if(confirm('Удалить идею?')){ state.ideas=state.ideas.filter(x=>x.id!==id); save(true); closeModal(); toast('Идея удалена'); render(); } }
function deleteTrip(id){ if(confirm('Удалить поездку?')){ state.trips=state.trips.filter(x=>x.id!==id); save(true); render(); } }
function addCalendarEventFromTrip(id){ const t=state.trips.find(x=>x.id===id); if(t){ state.calendarEvents.unshift({id:uid(),title:'Поездка: '+t.title,date:t.start||todayKey(),time:'',area:'Планирование',note:t.direction||''}); save(true); toast('Поездка добавлена в календарь'); render(); } }
function deleteCalendarEvent(id){ if(confirm('Удалить событие?')){ state.calendarEvents=state.calendarEvents.filter(x=>x.id!==id); save(true); render(); } }

// Extra action listener for new premium actions.
document.addEventListener('click', e=>{
  const a=e.target.closest('[data-action]'); if(!a) return;
  const id=a.dataset.id; const action=a.dataset.action;
  const actions={saveDailyReflection,editNote,saveEditedNote,deleteNote,editSphere,saveEditedSphere,deleteSphere,editTask,saveEditedTask,deleteTask,openGoogleTask,openGoogleEvent,addTaskFromGoal,addIdea,saveIdea,editIdea,saveEditedIdea,deleteIdea,deleteTrip,addCalendarEventFromTrip,deleteCalendarEvent,saveImportBalance,setTaskFilter};
  if(action==='googleTask') return openGoogleTask(id);
  if(action==='googleEvent') return openGoogleEvent(id);
  if(action==='setTaskFilter') return setTaskFilter(a.dataset.filter||'today');
  if(actions[action]) return actions[action](id);
});

render();
