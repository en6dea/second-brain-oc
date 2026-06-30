'use strict';

const APP_NAME = 'Second Brain OS';
const BUILD = 'clean-light-tech-rebuild-20260630';
const BUILD_LABEL = 'Light Tech Clean Rebuild';
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
  ['tasks','☑','Задачи'], ['spheres','✣','Сферы жизни'], ['notes','✎','Заметки'], ['files','▣','Файлы'], ['import','⇣','Импорт'], ['diagnostics','⚙','Диагностика']
];
const mobileItems = [['dashboard','⌂','Обзор'],['finance','◔','Финансы'],['tasks','☑','Задачи'],['spheres','✣','Сферы'],['budget','◉','Бюджет']];
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
    notes:[{id:uid(), title:'Фокус дня', text:'Минимум лишнего, максимум ясности.', tags:['фокус'], createdAt:todayKey()}],
    files:[],
    spheres:[
      {id:'life_health', title:'Здоровье', icon:'♡', progress:85, note:'Сон, движение, врачи'},
      {id:'life_home', title:'Дом', icon:'⌂', progress:72, note:'Быт и порядок'},
      {id:'life_car', title:'Машина', icon:'▱', progress:60, note:'ТО, страховка, расходы'},
      {id:'life_docs', title:'Документы', icon:'▣', progress:90, note:'Сроки и хранение'},
      {id:'life_trips', title:'Поездки', icon:'✈', progress:48, note:'Планы и бюджеты'}
    ],
    dataCore:{schema:4700, updatedAt:new Date().toISOString()}
  };
}
function essentialArrays(){return ['operations','plannedExpenses','budgets','debts','tasks','goals','habits','notes','files','spheres'];}
function normalizeState(raw){
  const base = defaultState(); const s = raw && typeof raw === 'object' ? raw : {};
  const merged = {...base, ...s, settings:{...base.settings, ...(s.settings||{})}, dataCore:{...base.dataCore, ...(s.dataCore||{})}};
  essentialArrays().forEach(k=>{ if(!Array.isArray(merged[k])) merged[k]=base[k] || []; });
  if(!merged.spheres.length) merged.spheres = base.spheres;
  if(!merged.budgets.length) merged.budgets = base.budgets;
  merged.settings.currentMonth = merged.settings.currentMonth || monthKey();
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
      <article class="card"><div class="card-head"><h3>Сферы жизни</h3><button class="link" data-go="spheres">Все сферы →</button></div><div class="life-grid">${state.spheres.slice(0,5).map(sphereTile).join('')}<button class="life-tile add" data-action="addSphere">＋<br>Добавить сферу</button></div></article>
    </section>
    <section class="grid bottom" style="margin-top:18px">
      <article class="card"><div class="card-head"><h3>Последние операции</h3><button class="link" data-go="finance">Все операции</button></div><div class="op-list">${state.operations.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5).map(rowOperation).join('')}</div></article>
      <article class="card"><div class="card-head"><h3>Предстоящие события</h3><button class="link" data-go="tasks">Все задачи</button></div><div class="note-list">${openTasks().slice(0,4).map(t=>`<div class="list-row"><span>☷</span><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.due||'')} ${esc(t.time||'')}</div></div><span class="pill">${esc(t.area||'Личное')}</span></div>`).join('')||empty('Пока нет событий')}</div></article>
      <article class="card"><div class="card-head"><h3>Заметки</h3><button class="link" data-go="notes">Все заметки</button></div><div class="note-list">${state.notes.slice(0,3).map(n=>`<div class="list-row"><span>✎</span><div><div class="row-title">${esc(n.title)}</div><div class="row-sub">${esc(n.createdAt||'')}</div></div><span></span></div>`).join('')}${coachCard()}</div></article>
    </section>`);
}
function empty(text){return `<div class="mini-box muted">${text}</div>`;}
function rowTask(t){ return `<div class="list-row"><button class="check ${taskStatus(t)==='Готово'?'done':''}" data-action="toggleTask" data-id="${t.id}" title="Готово"></button><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.area||'Личное')} • ${esc(t.due||'')} ${esc(t.time||'')}</div></div><span class="small muted">${esc(t.time||'')}</span></div>`; }
function rowOperation(o){ const isInc=o.type==='income'; return `<div class="list-row"><span>${isInc?'↗':'↘'}</span><div><div class="row-title">${esc(o.category||'Без категории')}</div><div class="row-sub">${esc(o.note||'Операция')} • ${esc(o.date||'')}</div></div><span class="amount ${isInc?'green':''}">${isInc?'+':'−'} ${money(o.amount)}</span></div>`; }
function sphereTile(s){ return `<div class="life-tile"><div class="ico">${esc(s.icon||'✣')}</div><strong>${esc(s.title)}</strong><span>${num(s.progress)}%</span>${progressBar(num(s.progress), num(s.progress)>75?'green':'')}</div>`; }
function coachCard(){return `<div class="mini-box" style="margin-top:8px"><div class="small amber strong">✦ Фокус дня</div><div class="small muted">Ясность в приоритетах создаёт свободу действий.</div></div>`;}
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
function spheresPage(){ return layout('Сферы жизни', 'Лёгкая карта важных направлений: здоровье, дом, машина, документы, поездки.', `<section class="grid cols-3">${state.spheres.map(s=>`<article class="card"><div class="card-head"><h3>${esc(s.icon||'✣')} ${esc(s.title)}</h3><span class="pill blue">${num(s.progress)}%</span></div>${progressBar(num(s.progress), num(s.progress)>75?'green':'')}<p class="muted small">${esc(s.note||'Добавьте заметку')}</p></article>`).join('')}<article class="card"><h3>Добавить сферу</h3><p class="muted">Дом, здоровье, машина, документы, обучение, питомцы или поездки.</p><button class="btn" data-action="addSphere">Добавить</button></article></section>`); }
function notesPage(){ return layout('Заметки', 'Идеи, инсайты и важные мысли в одном месте.', `<section class="card"><div class="card-head"><h3>Все заметки</h3><button class="btn" data-action="addNote">Новая заметка</button></div><div class="note-list">${state.notes.map(n=>`<div class="list-row"><span>✎</span><div><div class="row-title">${esc(n.title)}</div><div class="row-sub">${esc(n.text||'')}</div></div><span class="small muted">${esc(n.createdAt||'')}</span></div>`).join('')||empty('Пока нет заметок')}</div></section>`); }
function filesPage(){ return layout('Файлы', 'Место для будущих документов, экспортов и важных вложений.', `<section class="card"><h3>Файлы и документы</h3><p class="muted">Пока раздел работает как чистый экран. Следующим шагом сюда можно добавить документы, чеки, страховки, анализы и файлы поездок.</p><button class="btn secondary" data-go="import">Импорт данных</button></section>`); }
function importPage(){ return layout('Импорт', 'Спокойная загрузка операций без изменения домена и старых версий.', `
  <section class="card"><div class="card-head"><h3>Мастер импорта</h3><span class="pill blue">CSV</span></div><p class="muted">Выбери CSV-файл. Перед сохранением приложение покажет предпросмотр.</p><input type="file" id="csvFile" accept=".csv,text/csv" class="field" /><div class="actions"><button class="btn" data-action="loadCsv">Предпросмотр</button><button class="btn secondary" data-action="confirmCsv" ${csvRows.length?'':'disabled'}>Сохранить импорт</button><button class="btn secondary" data-action="exportData">Экспорт данных</button></div></section>
  ${csvRows.length?`<section class="card" style="margin-top:18px"><h3>Предпросмотр</h3><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr>${csvHeaders.map(h=>`<th>${esc(h)}</th>`).join('')}<th>Категория</th><th>Сумма</th></tr></thead><tbody>${csvRows.slice(0,30).map(r=>`<tr>${csvHeaders.map(h=>`<td>${esc(r[h])}</td>`).join('')}<td>${esc(r.category||'Импорт')}</td><td>${money(r.amount)}</td></tr>`).join('')}</tbody></table></div></section>`:''}`);
}
function diagnosticsPage(){ const meta=localStorage.getItem(META_KEY); return layout('Диагностика', 'Техническая информация отдельно от названия продукта.', `<section class="grid cols-2"><article class="card"><h3>Название приложения</h3><div class="value sm">Second Brain OS</div><p class="muted">Название не меняется от сборки к сборке. Версия не добавляется в домен.</p></article><article class="card"><h3>Сборка</h3><div class="value sm">Light Tech</div><p class="muted small">${BUILD}</p></article><article class="card"><h3>Данные</h3><p class="muted small">Операции: ${state.operations.length}<br>Задачи: ${state.tasks.length}<br>Цели: ${state.goals.length}<br>Сферы: ${state.spheres.length}</p><div class="actions"><button class="btn" data-action="exportData">Экспорт</button><button class="btn secondary" data-action="snapshot">Снимок</button></div></article><article class="card"><h3>Кэш</h3><p class="muted small">Старые service worker и cache будут очищены новым sw.js.</p><button class="btn secondary" data-action="clearCaches">Очистить кэш сайта</button></article></section>`); }

function render(){
  renderNav();
  const view=$('#view');
  const map={dashboard,finance:financePage,budget:budgetPage,roadmap:roadmapPage,tasks:tasksPage,spheres:spheresPage,notes:notesPage,files:filesPage,import:importPage,diagnostics:diagnosticsPage};
  view.innerHTML = (map[page]||dashboard)();
}
function renderNav(){
  $('#sidebarNav').innerHTML = `<div class="nav-label">Навигация</div>` + navItems.map(([id,ico,label])=>`<button class="nav-btn ${page===id?'active':''}" data-go="${id}"><span class="nav-ico">${ico}</span>${label}</button>`).join('');
  $('#bottomNav').innerHTML = mobileItems.map(([id,ico,label])=>`<button class="${page===id?'active':''}" data-go="${id}"><i>${ico}</i>${label}</button>`).join('');
}
function openModal(title, html){ $('#modalTitle').textContent=title; $('#modalBody').innerHTML=html; $('#modal').classList.add('show'); }
function closeModal(){ $('#modal').classList.remove('show'); }
function openQuick(){ openModal('Быстро добавить', `<div class="grid cols-2"><button class="btn" data-action="addTask">Новая задача</button><button class="btn" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button><button class="btn secondary" data-action="addNote">Заметка</button><button class="btn secondary" data-action="addGoal">Цель</button><button class="btn secondary" data-action="addSphere">Сфера жизни</button></div>`); }
function addTask(){ openModal('Новая задача', `<div class="form-grid"><div class="field"><label>Задача</label><input id="f_title" placeholder="Например: оплатить страховку"></div><div class="field"><label>Сфера</label><input id="f_area" value="Личное"></div><div class="field"><label>Дата</label><input id="f_due" type="date" value="${todayKey()}"></div><div class="field"><label>Время</label><input id="f_time" type="time"></div></div><div class="actions"><button class="btn" data-action="saveTask">Сохранить</button></div>`); }
function saveTask(){ state.tasks.unshift({id:uid(),title:$('#f_title').value||'Новая задача',area:$('#f_area').value||'Личное',due:$('#f_due').value||todayKey(),time:$('#f_time').value,status:'В работе'}); save(true); closeModal(); toast('Задача добавлена'); render(); }
function addExpense(){ addOperationModal('expense'); }
function addIncome(){ addOperationModal('income'); }
function addOperationModal(type){ openModal(type==='income'?'Добавить доход':'Добавить расход', `<div class="form-grid"><div class="field"><label>Сумма</label><input id="f_amount" inputmode="decimal" placeholder="0"></div><div class="field"><label>Категория</label><input id="f_category" value="${type==='income'?'Доход':'Продукты'}"></div><div class="field"><label>Дата</label><input id="f_date" type="date" value="${todayKey()}"></div><div class="field"><label>Комментарий</label><input id="f_note" placeholder="Описание"></div></div><div class="actions"><button class="btn" data-action="saveOperation" data-type="${type}">Сохранить</button></div>`); }
function saveOperation(type){ state.operations.unshift({id:uid(),type,amount:num($('#f_amount').value),category:$('#f_category').value||'Без категории',date:$('#f_date').value||todayKey(),note:$('#f_note').value||''}); save(true); closeModal(); toast('Операция сохранена'); render(); }
function addNote(){ openModal('Новая заметка', `<div class="field"><label>Заголовок</label><input id="f_title" placeholder="Название заметки"></div><div class="field" style="margin-top:12px"><label>Текст</label><textarea id="f_text" placeholder="Мысль, идея, план..."></textarea></div><div class="actions"><button class="btn" data-action="saveNote">Сохранить</button></div>`); }
function saveNote(){ state.notes.unshift({id:uid(),title:$('#f_title').value||'Новая заметка',text:$('#f_text').value||'',createdAt:todayKey(),tags:[]}); save(true); closeModal(); toast('Заметка сохранена'); render(); }
function addGoal(){ openModal('Новая цель', `<div class="form-grid"><div class="field"><label>Название</label><input id="f_title" placeholder="Например: отпуск"></div><div class="field"><label>Сфера</label><input id="f_area" value="Финансы"></div><div class="field"><label>Цель, ₽</label><input id="f_target" inputmode="decimal" placeholder="100000"></div><div class="field"><label>Уже есть, ₽</label><input id="f_current" inputmode="decimal" placeholder="0"></div></div><div class="actions"><button class="btn" data-action="saveGoal">Сохранить</button></div>`); }
function saveGoal(){ state.goals.unshift({id:uid(),title:$('#f_title').value||'Новая цель',area:$('#f_area').value||'Финансы',targetValue:num($('#f_target').value),currentValue:num($('#f_current').value),status:'Активна',nextAction:'Определить первый шаг'}); save(true); closeModal(); toast('Цель создана'); render(); }
function addSphere(){ openModal('Новая сфера жизни', `<div class="form-grid"><div class="field"><label>Название</label><input id="f_title" placeholder="Например: Питомцы"></div><div class="field"><label>Иконка</label><input id="f_icon" value="✣"></div><div class="field"><label>Прогресс, %</label><input id="f_progress" type="number" value="50"></div><div class="field"><label>Комментарий</label><input id="f_note" placeholder="Что важно отслеживать"></div></div><div class="actions"><button class="btn" data-action="saveSphere">Сохранить</button></div>`); }
function saveSphere(){ state.spheres.push({id:uid(),title:$('#f_title').value||'Новая сфера',icon:$('#f_icon').value||'✣',progress:clamp(num($('#f_progress').value)),note:$('#f_note').value||''}); save(true); closeModal(); toast('Сфера добавлена'); render(); }
function addBudget(){ openModal('Новый лимит', `<div class="form-grid"><div class="field"><label>Категория</label><input id="f_category" placeholder="Например: Такси"></div><div class="field"><label>Лимит, ₽</label><input id="f_limit" inputmode="decimal" placeholder="10000"></div></div><div class="actions"><button class="btn" data-action="saveBudget">Сохранить</button></div>`); }
function saveBudget(){ state.budgets.push({id:uid(),category:$('#f_category').value||'Категория',limit:num($('#f_limit').value),group:'custom'}); save(true); closeModal(); toast('Лимит добавлен'); render(); }
function toggleTask(id){ const t=state.tasks.find(x=>x.id===id); if(t){t.status = taskStatus(t)==='Готово'?'В работе':'Готово'; save(); render();} }
function exportData(){ const blob=new Blob([JSON.stringify({app:APP_NAME,build:BUILD,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`second-brain-os-backup-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href); toast('Экспорт готов'); }
function snapshot(){ saveSnapshot('manual'); toast('Снимок данных создан'); }
async function clearCaches(){ try{ if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); } if('serviceWorker' in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.update())); } toast('Кэш очищен'); }catch(e){toast('Не удалось очистить кэш');} }
function parseCsv(text){ const lines=text.trim().split(/\r?\n/); if(!lines.length) return []; const split=line=>{ const out=[]; let cur='', q=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){q=!q; continue;} if((ch===','||ch===';')&&!q){out.push(cur.trim()); cur='';} else cur+=ch;} out.push(cur.trim()); return out;}; const heads=split(lines[0]).map((h,i)=>h||`Колонка ${i+1}`); return {heads, rows:lines.slice(1).map(l=>{const vals=split(l); const obj={}; heads.forEach((h,i)=>obj[h]=vals[i]||''); const joined=vals.join(' '); const amount=vals.map(v=>num(v)).find(v=>v>0)||0; obj.amount=amount; obj.category=obj.category||obj['Категория']||obj['category']||'Импорт'; return obj;})}; }
async function loadCsv(){ const input=$('#csvFile'); const f=input?.files?.[0]; if(!f){toast('Выбери CSV-файл'); return;} const text=await f.text(); const parsed=parseCsv(text); csvHeaders=parsed.heads; csvRows=parsed.rows; toast(`Строк: ${csvRows.length}`); render(); }
function confirmCsv(){ csvRows.forEach(r=>state.operations.unshift({id:uid(),date:todayKey(),type:'expense',amount:num(r.amount),category:r.category||'Импорт',note:Object.values(r).slice(0,3).join(' ')})); csvRows=[]; csvHeaders=[]; save(true); toast('Импорт сохранён'); render(); }

document.addEventListener('click', e=>{
  const goBtn=e.target.closest('[data-go]'); if(goBtn) return go(goBtn.dataset.go);
  const a=e.target.closest('[data-action]'); if(!a) return;
  const action=a.dataset.action;
  const map={openQuick,closeModal,addTask,saveTask,addExpense,addIncome,saveNote,addNote,addGoal,saveGoal,addSphere,saveSphere,addBudget,saveBudget,exportData,snapshot,clearCaches,loadCsv,confirmCsv};
  if(action==='saveOperation') return saveOperation(a.dataset.type);
  if(action==='toggleTask') return toggleTask(a.dataset.id);
  if(map[action]) return map[action]();
});

document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); $('#globalSearch')?.focus(); }});
$('#globalSearch')?.addEventListener('input', e=>{ const q=e.target.value.trim().toLowerCase(); if(!q) return; const found=[...state.tasks,...state.notes,...state.operations].filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,5); openModal('Поиск', found.map(x=>`<div class="mini-box" style="margin-bottom:8px"><b>${esc(x.title||x.category||x.note||'Результат')}</b><div class="small muted">${esc(x.text||x.note||x.area||'')}</div></div>`).join('')||empty('Ничего не найдено')); });

(async function maintenance(){
  try{ localStorage.setItem('secondBrainOS.currentBuild', BUILD); }catch(e){}
  if('serviceWorker' in navigator){
    try{ const reg=await navigator.serviceWorker.register('sw.js'); reg.update(); }catch(e){}
  }
  if('caches' in window){
    try{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>/second-brain|sbos/i.test(k) && k!=='second-brain-os-clean-light-tech').map(k=>caches.delete(k))); }catch(e){}
  }
})();

render();
