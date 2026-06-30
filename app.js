/* Second Brain OS — compatibility copy. Main runtime is inline in index.html. */
'use strict';
const APP_NAME='Second Brain OS';
const BUILD='unified-planning-monthly-forecast-20260630';
const STORE_KEY='secondBrainOS.v1';
const SNAPSHOT_KEY='secondBrainOS.snapshots';
const META_KEY='secondBrainOS.meta';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const todayKey=()=>new Date().toISOString().slice(0,10);
const monthKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const num=v=>Number(String(v??'').replace(/\s/g,'').replace(',','.'))||0;
const money=v=>`${Math.round(num(v)).toLocaleString('ru-RU')} ₽`;
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const fmtDate=d=>new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
const iso=d=>new Date(d).toISOString().slice(0,10);
let page=location.hash?location.hash.slice(1):'dashboard';
let state=normalizeState(loadRawState());
let csvRows=[];
let csvDuplicateRemoved=0;

document.title=APP_NAME;
try{const m=document.querySelector('meta[name="second-brain-build"]'); if(m)m.content=BUILD; localStorage.setItem('secondBrainOS.currentBuild',BUILD);}catch(e){}
if(location.search) history.replaceState(null,'',location.pathname+(location.hash||''));

const navItems=[
 ['dashboard','⌂','Обзор'],['finance','◔','Финансы'],['budget','◉','Бюджет'],['goals','◎','Цели SMART'],['planning','☷','Планирование'],['spheres','✣','Сферы жизни'],['import','⇣','Импорт'],['diagnostics','⚙','Диагностика']
];
const mobileItems=[['dashboard','⌂','Обзор'],['finance','◔','Финансы'],['planning','☷','План'],['spheres','✣','Сферы'],['budget','◉','Бюджет']];

function defaultState(){
 const t=todayKey(), m=monthKey();
 return {
  settings:{currentMonth:m, currentBalance:0, importActualBalance:'', monthlyPlan:300000, salaryMain:150000, salaryAdvance:50000, paydayMain:10, paydayAdvance:25, savingsRate:10, lifeFolder:'overview', taskScope:'today'},
  categories:[
    {id:uid(),name:'Продукты',type:'expense',limit:35000},{id:uid(),name:'Дом',type:'expense',limit:25000},{id:uid(),name:'Транспорт',type:'expense',limit:15000},{id:uid(),name:'Кафе',type:'expense',limit:12000},{id:uid(),name:'Одежда',type:'expense',limit:15000},{id:uid(),name:'Здоровье',type:'expense',limit:10000},{id:uid(),name:'Доход',type:'income',limit:0}
  ],
  operations:[{id:uid(),date:t,type:'income',amount:210000,category:'Доход',note:'Зарплата'},{id:uid(),date:t,type:'expense',amount:2450,category:'Продукты',note:'Магазин'},{id:uid(),date:t,type:'expense',amount:1250,category:'Кафе',note:'Кофе'}],
  tasks:[{id:uid(),title:'Проверить бюджет на неделю',area:'Финансы',due:t,time:'10:00',status:'В работе',priority:'B'},{id:uid(),title:'Тренировка',area:'Здоровье',due:t,time:'12:00',status:'В работе',priority:'B'}],
  calendarEvents:[{id:uid(),title:'Планирование бюджета',date:t,time:'16:00',area:'Финансы',note:'Сверить факт, план и лимиты'}],
  debts:[{id:uid(),person:'Кредит / карта',amount:45000,due:t,status:'Активен',note:'Первый долг к закрытию',reminder:false}],
  plannedPurchases:[{id:uid(),title:'Одежда на сезон',category:'Одежда',amount:12000,month:m,importance:'Важно',includeInBudget:true,note:'Поставить в лимит, если есть свободный бюджет'}],
  goals:[{id:uid(),title:'Увеличить доход',area:'Финансы',targetValue:300000,currentValue:210000,deadline:'2026-12-31',specific:'Увеличить доход до 300 000 ₽',measurable:'300 000 ₽/мес',achievable:'1 новый источник дохода',relevant:'Больше свободы и спокойствия',timebound:'До конца года',nextAction:'Определить один шаг на этой неделе',week52:'Сделай один встречный шаг в эту неделю'}],
  safetyFund:{current:450000,target:600000,note:'Отдельно от целей. Это запас спокойствия, а не цель.'},
  habits:[{id:uid(),name:'Записать расходы',area:'Финансы',target:'ежедневно',marks:{[t]:true}},{id:uid(),name:'План дня',area:'Фокус',target:'ежедневно',marks:{}}],
  notes:[{id:uid(),title:'Фокус дня',text:'Минимум лишнего, максимум ясности.',folder:'Личное',tags:['фокус'],createdAt:t}],
  people:[{id:uid(),name:'Полина',relation:'близкий человек',birthday:'1999-08-23',photo:'',likes:'море, кофе, украшения',talkIdeas:'обсудить планы',gifts:'сертификат / украшение',links:'',notes:'важный человек'}],
  books:[{id:uid(),title:'Психология денег',author:'Морган Хаузел',status:'Хочу прочитать',insight:'Деньги — это запас спокойствия и свободы решений.',quotes:['Свобода — лучший дивиденд.'],cover:''}],
  media:[{id:uid(),title:'Фильм на вечер',type:'Фильм',status:'Хочу посмотреть',link:'',trailer:'',note:'Добавь ссылку на трейлер'}],
  ideas:[{id:uid(),title:'Идея для проекта',text:'Сделать один маленький шаг.',createdAt:t}],
  trips:[{id:uid(),title:'Поездка в горы',direction:'Любое направление',start:'',end:'',budget:100000,saved:0,transport:25000,hotel:45000,food:20000,activities:10000,notes:'Свободное планирование маршрута и бюджета',status:'Идея'}],
  files:[],
  spheres:[{id:'life_people',title:'Люди',icon:'◌',progress:70,note:'Контакты, даты, подарки'},{id:'life_planning',title:'Планирование',icon:'☷',progress:60,note:'Задачи, календарь, покупки'},{id:'life_habits',title:'Привычки',icon:'◷',progress:65,note:'Повторы и ритм'},{id:'life_books',title:'Книги',icon:'◧',progress:45,note:'Чтение и цитаты'},{id:'life_ideas',title:'Идеи',icon:'✦',progress:50,note:'Мысли и проекты'},{id:'life_personal',title:'Личная жизнь',icon:'♡',progress:55,note:'Фильмы, сериалы, память'}],
  dataCore:{schema:4801,updatedAt:new Date().toISOString()}
 };
}
function loadRawState(){try{const raw=localStorage.getItem(STORE_KEY); if(!raw)return null; const parsed=JSON.parse(raw); return parsed.state||parsed;}catch(e){return null}}
function normalizeState(raw){
 const base=defaultState(); const s=raw&&typeof raw==='object'?raw:{}; const merged={...base,...s,settings:{...base.settings,...(s.settings||{})},dataCore:{...base.dataCore,...(s.dataCore||{})}};
 ['operations','tasks','calendarEvents','debts','plannedPurchases','goals','habits','notes','people','books','media','ideas','trips','files','spheres','categories'].forEach(k=>{if(!Array.isArray(merged[k])) merged[k]=base[k]||[]});
 if(!merged.safetyFund||typeof merged.safetyFund!=='object') merged.safetyFund=base.safetyFund;
 merged.settings.currentMonth=merged.settings.currentMonth||monthKey();
 merged.settings.lifeFolder=merged.settings.lifeFolder||'overview';
 merged.settings.taskScope=merged.settings.taskScope||'today';
 merged.settings.paydayMain=num(merged.settings.paydayMain)||10; merged.settings.paydayAdvance=num(merged.settings.paydayAdvance)||25;
 merged.categories=dedupeCategories([...(merged.categories||[]),...deriveCategories(merged)]);
 merged.spheres=dedupeSpheres(merged.spheres.length?merged.spheres:base.spheres);
 if(!merged.media.length) merged.media=base.media;
 merged.dataCore.schema=4801; merged.dataCore.updatedAt=new Date().toISOString();
 return merged;
}
function dedupeSpheres(arr){const keep=['Люди','Планирование','Привычки','Книги','Идеи','Личная жизнь']; const map=new Map(); [...arr,...defaultState().spheres].forEach(x=>{const key=(x.title||'').trim().toLowerCase(); if(keep.map(k=>k.toLowerCase()).includes(key)&&!map.has(key))map.set(key,{...x,id:x.id||uid()});}); return Array.from(map.values());}
function deriveCategories(s){const out=[];(s.operations||[]).forEach(o=>{if(o.category)out.push({id:uid(),name:o.category,type:o.type||'expense',limit:0})});(s.budgets||[]).forEach(b=>{if(b.category)out.push({id:uid(),name:b.category,type:'expense',limit:num(b.limit)})});return out;}
function dedupeCategories(arr){const map=new Map(); arr.forEach(c=>{if(!c.name)return; const k=c.name.trim().toLowerCase()+'|'+(c.type||'expense'); if(!map.has(k))map.set(k,{id:c.id||uid(),name:c.name.trim(),type:c.type||'expense',limit:num(c.limit)}); else if(num(c.limit)) map.get(k).limit=num(c.limit);}); return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name,'ru'));}
function save(snapshot=false){state=normalizeState(state);localStorage.setItem(STORE_KEY,JSON.stringify(state));localStorage.setItem(META_KEY,JSON.stringify({app:APP_NAME,build:BUILD,updatedAt:new Date().toISOString()}));if(snapshot)saveSnapshot('manual')}
function saveSnapshot(reason='auto'){try{const list=JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'[]'); list.unshift({app:APP_NAME,build:BUILD,reason,createdAt:new Date().toISOString(),state}); localStorage.setItem(SNAPSHOT_KEY,JSON.stringify(list.slice(0,8)));}catch(e){}}
function toast(msg){const t=$('#toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200)}
function go(p){page=p;location.hash=p;render()} window.addEventListener('hashchange',()=>{page=location.hash.slice(1)||'dashboard';render()});
function layout(title,subtitle,body){return `<div class="page"><div class="hero"><div><h1>${title}</h1><p>${subtitle||''}</p></div><div class="date-pill">☷ ${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</div></div>${body}</div>`}
function progressBar(p,cls=''){return `<div class="progress ${cls}"><b style="width:${clamp(p)}%"></b></div>`}
function empty(t){return `<div class="mini-box muted">${t}</div>`}
function monthOps(type){return state.operations.filter(o=>String(o.date||'').startsWith(state.settings.currentMonth)&&(!type||o.type===type))}
function total(list){return list.reduce((s,x)=>s+num(x.amount),0)}
function currentCycle(){const now=new Date(); const start=new Date(now.getFullYear(),now.getMonth(),10); if(now.getDate()<10) start.setMonth(start.getMonth()-1); const end=new Date(start.getFullYear(),start.getMonth()+1,9); return {start:iso(start),end:iso(end)}}
function cycleOps(type){const c=currentCycle();return state.operations.filter(o=>String(o.date||'')>=c.start&&String(o.date||'')<=c.end&&(!type||o.type===type))}
function plannedInMonth(){return state.plannedPurchases.filter(p=>p.month===state.settings.currentMonth&&p.includeInBudget!==false)}
function activeDebts(){return state.debts.filter(d=>d.status!=='Закрыт')}
function summary(){
 const income=total(monthOps('income')), expenses=total(monthOps('expense')), cycleIncome=total(cycleOps('income')), cycleExpenses=total(cycleOps('expense'));
 const planned=total(plannedInMonth()); const debtDue=total(activeDebts().filter(d=>String(d.due||'').startsWith(state.settings.currentMonth)));
 const calcBalance=income-expenses-planned-debtDue; const actual=num(state.settings.currentBalance)||calcBalance; const plan=num(state.settings.monthlyPlan)||income||1;
 const next=nextSalaryDate(); const days=Math.max(1,Math.ceil((new Date(next.date)-new Date())/86400000)); const obligations=dueUntil(next.date); const toNext=actual-obligations; const dailyLimit=Math.max(0,Math.floor(toNext/days));
 const byCat={}; monthOps('expense').forEach(o=>{byCat[o.category||'Без категории']=(byCat[o.category||'Без категории']||0)+num(o.amount)}); const topCats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
 return {income,expenses,cycleIncome,cycleExpenses,planned,debtDue,calcBalance,actual,plan,progress:clamp(Math.round(income/plan*100)),nextSalary:next,daysToSalary:days,obligations,toNext,dailyLimit,topCats};
}
function adjustedPayday(year,monthIndex,day){const d=new Date(year,monthIndex,day); const w=d.getDay(); if(w===6)d.setDate(d.getDate()-1); if(w===0)d.setDate(d.getDate()-2); return d}
function nextSalaryDate(){const now=new Date(); const candidates=[]; for(let add=0;add<3;add++){const d=new Date(now.getFullYear(),now.getMonth()+add,1); candidates.push({date:iso(adjustedPayday(d.getFullYear(),d.getMonth(),state.settings.paydayMain)),type:'Основная зарплата',amount:num(state.settings.salaryMain)}); candidates.push({date:iso(adjustedPayday(d.getFullYear(),d.getMonth(),state.settings.paydayAdvance)),type:'Аванс',amount:num(state.settings.salaryAdvance)});} return candidates.filter(x=>new Date(x.date)>=new Date(todayKey())).sort((a,b)=>a.date.localeCompare(b.date))[0]||candidates[0];}
function dueUntil(date){const p=state.plannedPurchases.filter(x=>x.includeInBudget!==false&&(!x.due||x.due<=date)&&(!x.month||x.month<=monthKey(new Date(date)))).reduce((a,b)=>a+num(b.amount),0); const d=activeDebts().filter(x=>x.due&&x.due<=date).reduce((a,b)=>a+num(b.amount),0); return p+d;}
function goalProgress(g){return num(g?.targetValue)?clamp(Math.round(num(g.currentValue)/num(g.targetValue)*100)):0}
function safetyProgress(){return num(state.safetyFund.target)?clamp(Math.round(num(state.safetyFund.current)/num(state.safetyFund.target)*100)):0}
function budgetStats(){const s=summary(); return state.categories.filter(c=>c.type!=='income').map(c=>{const spent=s.topCats.find(([cat])=>cat===c.name)?.[1]||0; const limit=num(c.limit); const pct=limit?clamp(Math.round(spent/limit*100),0,999):0; return {...c,spent,limit,pct,left:limit-spent}})}
function openTasks(){return state.tasks.filter(t=>(t.status||'В работе')!=='Готово').sort((a,b)=>String((a.due||'')+(a.time||'')).localeCompare(String((b.due||'')+(b.time||''))))}
function tasksByScope(){const scope=state.settings.taskScope||'today'; const now=new Date(todayKey()); const week=iso(addDays(now,7)); const month=iso(addDays(now,31)); const list=openTasks(); if(scope==='today')return list.filter(t=>t.due===todayKey()); if(scope==='week')return list.filter(t=>t.due&&t.due>=todayKey()&&t.due<=week); if(scope==='month')return list.filter(t=>t.due&&t.due>=todayKey()&&t.due<=month); return list.filter(t=>!t.due||t.due>month)}
function taskPill(t){const m={A:['Срочно/важно','red'],B:['Важно','blue'],C:['Делегировать','amber'],D:['Позже','']}; const v=m[t.priority]||m.B; return `<span class="pill ${v[1]}">${v[0]}</span>`}
function rowTask(t){return `<div class="list-row"><button class="check ${(t.status==='Готово')?'done':''}" data-action="toggleTask" data-id="${t.id}"></button><button class="mini-btn" data-action="editTask" data-id="${t.id}" style="text-align:left;background:transparent;border:0;min-width:0"><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.area||'Личное')} · ${esc(t.due||'')} ${esc(t.time||'')}</div></button><div class="button-row">${taskPill(t)}<button class="mini-btn blue" data-action="googleTask" data-id="${t.id}">Google</button></div></div>`}
function rowOperation(o){return `<div class="list-row"><span class="pill ${o.type==='income'?'green':'blue'}">${o.type==='income'?'＋':'−'}</span><button class="mini-btn" data-action="editOperation" data-id="${o.id}" style="text-align:left;background:transparent;border:0;min-width:0"><div class="row-title">${esc(o.category||'Без категории')}</div><div class="row-sub">${esc(o.note||'')} · ${esc(o.date||'')}</div></button><b class="${o.type==='income'?'green':''}">${o.type==='income'?'+':'−'} ${money(o.amount)}</b></div>`}
function rowEvent(e){return `<div class="list-row"><span>☷</span><div><div class="row-title">${esc(e.title)}</div><div class="row-sub">${esc(e.date)} ${esc(e.time||'')} · ${esc(e.area||'Личное')}</div></div><div class="button-row"><button class="mini-btn blue" data-action="googleEvent" data-id="${e.id}">Google</button><button class="mini-btn" data-action="editEvent" data-id="${e.id}">Ред.</button></div></div>`}
function financeSpark(){return `<div class="spark"><svg viewBox="0 0 280 80" preserveAspectRatio="none"><defs><linearGradient id="gblue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".18"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs><path class="area-blue" d="M0 70 L0 54 C30 48 40 58 62 48 C80 38 95 44 112 30 C132 12 150 40 170 24 C190 8 205 18 222 11 C245 2 260 -5 280 -20 L280 70 Z"/><path class="stroke-blue" d="M0 54 C30 48 40 58 62 48 C80 38 95 44 112 30 C132 12 150 40 170 24 C190 8 205 18 222 11 C245 2 260 -5 280 -20"/></svg></div>`}
function dailyQuote(){const qs=[['Порядок в деньгах начинается с честного взгляда на реальность.','Я не ругаю себя за прошлые траты. Я вижу картину и выбираю следующий шаг.'],['Сначала заплати себе — потом распределяй остальное.','Моя свобода начинается не с суммы, а с привычки откладывать регулярно.'],['Маленькие действия, повторённые много раз, становятся системой.','Сегодня мне достаточно одного ясного действия, а не идеального плана.'],['Цель без следующего шага остаётся мечтой.','Я превращаю желание в маленькое действие на этой неделе.']];const i=new Date().getDate()%qs.length;return {quote:qs[i][0],thought:qs[i][1]}}
function quoteCard(){const q=dailyQuote(); return `<article class="card quote-card"><div class="card-head"><h3>Цитата дня</h3><span class="pill blue">рефлексия</span></div><p style="font-size:17px;line-height:1.45;margin:0 0 10px">“${esc(q.quote)}”</p><div class="small muted"><b>Что я думаю:</b> ${esc(q.thought)}</div><textarea id="dailyReflection" placeholder="Моя мысль на сегодня...">${esc(state.settings.dailyReflection||'')}</textarea><div class="actions"><button class="btn secondary" data-action="saveDailyReflection">Сохранить в заметки</button></div></article>`}
function dashboard(){const s=summary();return layout('Обзор','Деньги, задачи и жизнь — на одном чистом экране.',`<section class="grid dashboard"><article class="card premium-hero-card"><div class="card-head"><h3>Фактический остаток</h3><button class="link" data-go="finance">Финансы →</button></div><div class="value">${money(s.actual)}</div><div class="small muted">основной показатель. Расчётный баланс: ${money(s.calcBalance)}</div>${financeSpark()}</article><article class="card"><div class="card-head"><h3>До зарплаты</h3><button class="link" data-go="planning">План →</button></div><div class="value sm">${s.daysToSalary} дн.</div><p class="muted small">${s.nextSalary.type}: ${fmtDate(s.nextSalary.date)} · ${money(s.nextSalary.amount)}</p><div class="alert">Прогноз: ${money(s.toNext)} до ближайшей выплаты</div></article><article class="card"><div class="card-head"><h3>Бюджет на день</h3><button class="link" data-go="budget">Бюджет →</button></div><div class="ring" style="--p:${Math.min(100,s.progress)}"><span>${Math.min(100,s.progress)}%</span></div><div class="stat-row"><span class="small muted">можно тратить</span><b>${money(s.dailyLimit)}</b></div></article></section><section class="grid cols-3" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Сегодня / неделя / месяц</h3><button class="link" data-go="planning">Открыть →</button></div>${taskScopeButtons()}<div class="task-list">${tasksByScope().slice(0,4).map(rowTask).join('')||empty('Нет задач')}</div></article><article class="card"><div class="card-head"><h3>Цели SMART</h3><button class="link" data-go="goals">Все цели →</button></div>${state.goals.filter(g=>!/подуш/i.test(g.title)).slice(0,3).map(g=>`<div class="mini-box" style="margin-bottom:10px"><div class="stat-row"><strong>${esc(g.title)}</strong><span class="pill blue">${goalProgress(g)}%</span></div>${progressBar(goalProgress(g))}<p class="small muted">${esc(g.nextAction||'Следующий шаг')}</p></div>`).join('')||empty('Создай цель')}</article>${quoteCard()}</section><section class="grid bottom" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Операции</h3><button class="link" data-go="finance">Все →</button></div><div class="op-list">${state.operations.slice(0,5).map(rowOperation).join('')}</div></article><article class="card"><div class="card-head"><h3>Долги и обязательства</h3><button class="link" data-go="finance">Долги →</button></div>${activeDebts().slice(0,4).map(d=>`<div class="mini-box" style="margin-bottom:8px"><div class="stat-row"><strong>${esc(d.person)}</strong><span class="pill ${d.due&&d.due<=todayKey()?'red':'amber'}">${money(d.amount)}</span></div><p class="small muted">отдать до ${esc(d.due||'—')}</p></div>`).join('')||empty('Активных долгов нет')}</article><article class="card"><div class="card-head"><h3>Папки жизни</h3><button class="link" data-go="spheres">Все →</button></div><div class="folder-list" style="grid-template-columns:repeat(2,minmax(0,1fr))">${lifeFolders().slice(0,4).map(f=>folderButton(f.id,f.title,f.ico,lifeFolderCount(f.id))).join('')}</div></article></section>`)}
function taskScopeButtons(){const s=state.settings.taskScope||'today';return `<div class="button-row" style="margin:0 0 10px"><button class="tab-btn ${s==='today'?'active':''}" data-action="setTaskScope" data-scope="today">Сегодня</button><button class="tab-btn ${s==='week'?'active':''}" data-action="setTaskScope" data-scope="week">Неделя</button><button class="tab-btn ${s==='month'?'active':''}" data-action="setTaskScope" data-scope="month">Месяц</button><button class="tab-btn ${s==='later'?'active':''}" data-action="setTaskScope" data-scope="later">Позже</button></div>`}
function financePage(){const s=summary(); const diff=s.actual-s.calcBalance; return layout('Финансы','Фактический остаток — главный. Прогноз до зарплаты и спокойный контроль категорий.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Фактический остаток</h3><div class="value">${money(s.actual)}</div><button class="btn secondary" data-action="editActualBalance">Изменить</button></article><article class="card"><h3>Прогноз до зарплаты</h3><div class="value sm ${s.toNext<0?'red':'blue'}">${money(s.toNext)}</div><p class="muted small">до ${fmtDate(s.nextSalary.date)} · ${s.nextSalary.type}</p></article><article class="card"><h3>Расхождение</h3><div class="value sm ${Math.abs(diff)>0?'amber':''}">${money(diff)}</div><p class="muted small">факт минус расчёт</p></article><article class="card"><h3>Подушка</h3><div class="value sm">${money(state.safetyFund.current)}</div>${progressBar(safetyProgress(),'green')}<p class="muted small">отдельно от целей · ${safetyProgress()}%</p></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Категории доходов/расходов</h3><button class="btn secondary" data-action="addCategory">Категория</button></div><div class="note-list">${state.categories.map(c=>`<div class="list-row"><span class="pill ${c.type==='income'?'green':'blue'}">${c.type==='income'?'Доход':'Расход'}</span><div><div class="row-title">${esc(c.name)}</div><div class="row-sub">Лимит: ${c.limit?money(c.limit):'—'}</div></div><div class="button-row"><button class="mini-btn" data-action="editCategory" data-id="${c.id}">Ред.</button><button class="mini-btn red" data-action="deleteCategory" data-id="${c.id}">Удалить</button></div></div>`).join('')}</div></article><article class="card"><div class="card-head"><h3>Финансовые принципы</h3><span class="pill blue">книги без перегруза</span></div>${financePrinciples()}</article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Долги</h3><button class="btn secondary" data-action="addDebt">Добавить долг</button></div><div class="note-list">${activeDebts().map(rowDebt).join('')||empty('Активных долгов нет')}</div></article><article class="card"><div class="card-head"><h3>Операции</h3><div class="button-row"><button class="btn secondary" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button></div></div><div class="op-list">${state.operations.slice(0,12).map(rowOperation).join('')}</div></article></section>`)}
function financePrinciples(){return `<div class="finance-principles"><div class="mini-box"><b>Заплати себе сначала</b><p class="small muted">Сразу после дохода отдели деньги на будущее.</p></div><div class="mini-box"><b>Не покупай эмоцией</b><p class="small muted">Для импульсивной покупки — пауза 24 часа.</p></div><div class="mini-box"><b>Деньги = запас спокойствия</b><p class="small muted">Подушка снижает тревогу и даёт выбор.</p></div></div>`}
function rowDebt(d){return `<div class="list-row"><span class="pill ${d.due&&d.due<=todayKey()?'red':'amber'}">долг</span><div><div class="row-title">${esc(d.person)} · ${money(d.amount)}</div><div class="row-sub">до ${esc(d.due||'—')} · ${esc(d.note||'')}</div></div><div class="button-row"><button class="mini-btn blue" data-action="debtTask" data-id="${d.id}">Напомнить</button><button class="mini-btn" data-action="editDebt" data-id="${d.id}">Ред.</button><button class="mini-btn green" data-action="closeDebt" data-id="${d.id}">Закрыт</button></div></div>`}
function budgetPage(){const s=summary(), items=budgetStats(), used=items.reduce((a,b)=>a+b.spent,0), limit=items.reduce((a,b)=>a+b.limit,0); const top=dailySpendSeries().sort((a,b)=>b.amount-a.amount).filter(x=>x.amount>0).slice(0,5); return layout('Бюджет','Расчёт по зарплатному циклу от 10 числа: лимиты, дни и плановые покупки.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Цикл бюджета</h3><div class="value sm">10 → 9</div><p class="muted small">основа расчёта месяца</p></article><article class="card"><h3>Можно тратить в день</h3><div class="value blue">${money(s.dailyLimit)}</div></article><article class="card"><h3>Плановые покупки</h3><div class="value sm">${money(total(plannedInMonth()))}</div><p class="muted small">включены в бюджет</p></article><article class="card"><h3>Лимиты</h3><div class="value sm">${limit?Math.round(used/limit*100):0}%</div>${progressBar(limit?used/limit*100:0)}</article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>График трат по дням</h3><span class="pill blue">выделены пики</span></div>${renderDailySpendChart()}</article><article class="card"><h3>Дни с максимальными тратами</h3><div class="note-list">${top.map(x=>`<div class="list-row"><span class="pill ${x.hot?'red':x.warn?'amber':'blue'}">${x.day}</span><div><div class="row-title">${money(x.amount)}</div><div class="row-sub">${x.hot?'пик трат':'контрольный день'}</div></div><button class="mini-btn" data-action="filterDayOps" data-day="${x.day}">Операции</button></div>`).join('')||empty('Расходов нет')}</div></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Лимиты категорий</h3><button class="btn secondary" data-action="addCategory">Добавить лимит</button></div><div class="grid cols-2">${items.map(b=>`<div class="mini-box"><div class="stat-row"><strong>${esc(b.name)}</strong><span class="pill ${b.pct>100?'red':b.pct>80?'amber':'blue'}">${b.pct}%</span></div><div class="small muted">${money(b.spent)} из ${money(b.limit)}</div>${progressBar(b.pct,b.pct>100?'red':b.pct>80?'amber':'green')}<div class="small muted" style="margin-top:8px">Осталось: ${money(b.left)}</div></div>`).join('')}</div></article><article class="card"><div class="card-head"><h3>Плановые покупки</h3><button class="btn secondary" data-action="addPurchase">Добавить покупку</button></div>${purchaseAdvice()}<div class="note-list" style="margin-top:10px">${state.plannedPurchases.map(rowPurchase).join('')||empty('Покупок пока нет')}</div></article></section>`)}
function purchaseAdvice(){const s=summary(), need=total(plannedInMonth()); const free=s.income-s.expenses-s.debtDue; if(!need)return `<div class="ok">Плановых покупок на этот месяц нет.</div>`; if(free<need)return `<div class="alert">Свободного бюджета не хватает: нужно ${money(need)}, доступно примерно ${money(free)}. Перенеси часть покупок на следующий месяц.</div>`; return `<div class="ok">Покупки помещаются в бюджет. Рекомендуем откладывать ${money(Math.ceil(need/4))} в неделю.</div>`}
function rowPurchase(p){return `<div class="list-row"><span class="pill ${p.importance==='Очень важно'?'red':p.importance==='Важно'?'amber':'blue'}">${esc(p.importance||'Важно')}</span><div><div class="row-title">${esc(p.title)} · ${money(p.amount)}</div><div class="row-sub">${esc(p.category)} · ${esc(p.month)} · ${p.includeInBudget!==false?'в лимит':'вне лимита'}</div></div><div class="button-row"><button class="mini-btn" data-action="editPurchase" data-id="${p.id}">Ред.</button><button class="mini-btn red" data-action="deletePurchase" data-id="${p.id}">Удалить</button></div></div>`}
function dailySpendSeries(){const days=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();const map={};monthOps('expense').forEach(o=>{const d=Number(String(o.date||'').slice(8,10))||1;map[d]=(map[d]||0)+num(o.amount)});const max=Math.max(1,...Object.values(map));const avg=Object.values(map).reduce((a,b)=>a+b,0)/Math.max(1,Object.keys(map).length);return Array.from({length:days},(_,i)=>{const day=i+1, amount=map[day]||0;return {day,amount,h:Math.max(6,Math.round(amount/max*100)),hot:amount>avg*1.6&&amount>0,warn:amount>avg&&amount>0}})}
function renderDailySpendChart(){return `<div class="day-chart">${dailySpendSeries().map(x=>`<div class="day-bar ${x.hot?'hot':x.warn?'warn':''}" style="--h:${x.h}%" data-tip="${x.day}: ${money(x.amount)}"></div>`).join('')}</div><div class="small muted">Красным выделены дни с пиковыми тратами.</div>`}
function goalsPage(){const goals=state.goals.filter(g=>!/подуш/i.test(g.title));return layout('Цели SMART','Финансовые и личные цели в одном формате: S M A R T + шаг недели.',`<section class="grid cols-3"><article class="card premium-hero-card"><h3>52 недели</h3><p class="muted">Каждая цель должна иметь встречный шаг на текущую неделю.</p><button class="btn" data-action="addGoal">Новая цель</button></article><article class="card"><h3>Активные цели</h3><div class="value sm">${goals.length}</div></article><article class="card"><h3>Подушка</h3><p class="muted small">Не связана с целями. Это отдельный запас безопасности.</p><div class="value sm">${safetyProgress()}%</div>${progressBar(safetyProgress(),'green')}</article></section><section class="grid cols-2" style="margin-top:18px">${goals.map(goalCard).join('')||empty('Целей пока нет')}</section>`)}
function goalCard(g){return `<article class="card"><div class="card-head"><h3>${esc(g.title)}</h3><span class="pill blue">${goalProgress(g)}%</span></div>${progressBar(goalProgress(g))}<div class="grid cols-2" style="margin-top:12px"><div class="mini-box"><b>S</b><p class="small muted">${esc(g.specific||'что именно?')}</p></div><div class="mini-box"><b>M</b><p class="small muted">${esc(g.measurable||money(g.targetValue))}</p></div><div class="mini-box"><b>A</b><p class="small muted">${esc(g.achievable||'реалистично')}</p></div><div class="mini-box"><b>R/T</b><p class="small muted">${esc(g.relevant||'важно')} · ${esc(g.timebound||g.deadline||'срок')}</p></div></div><div class="alert" style="margin-top:12px">Шаг недели: ${esc(g.week52||g.nextAction||'назначить следующий шаг')}</div><div class="button-row"><button class="mini-btn" data-action="editGoal" data-id="${g.id}">Редактировать</button><button class="mini-btn red" data-action="deleteGoal" data-id="${g.id}">Удалить</button></div></article>`}
function planningPage(){return layout('Планирование','Задачи и календарь в одной папке: сегодня, неделя, месяц + матрица Эйзенхауэра.',`<section class="grid cols-3"><button class="folder-card" data-action="setTaskScope" data-scope="today"><div class="folder-ico">1</div><strong>Сегодня</strong><small>${openTasks().filter(t=>t.due===todayKey()).length} задач</small></button><button class="folder-card" data-action="setTaskScope" data-scope="week"><div class="folder-ico">7</div><strong>Неделя</strong><small>ближайшие действия</small></button><button class="folder-card" data-action="setTaskScope" data-scope="month"><div class="folder-ico">30</div><strong>Месяц</strong><small>план без перегруза</small></button></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Задачи</h3><button class="btn secondary" data-action="addTask">Добавить</button></div>${taskScopeButtons()}<div class="task-list">${tasksByScope().map(rowTask).join('')||empty('Нет задач')}</div></article><article class="card"><div class="card-head"><h3>Календарь</h3><button class="btn secondary" data-action="addEvent">Событие</button></div><div class="note-list">${upcomingEvents().slice(0,8).map(rowEvent).join('')||empty('Нет событий')}</div></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Матрица Эйзенхауэра</h3><span class="pill blue">приоритеты</span></div>${eisenhowerMatrix()}</section>`)}
function upcomingEvents(){return state.calendarEvents.slice().filter(e=>!e.date||e.date>=todayKey()).sort((a,b)=>String((a.date||'')+(a.time||'')).localeCompare(String((b.date||'')+(b.time||''))))}
function eisenhowerMatrix(){const cells=[['A','Срочно и важно','urgent important'],['B','Важно, не срочно','important'],['C','Срочно, не важно','urgent'],['D','Позже / убрать','']];return `<div class="matrix">${cells.map(([p,t,cl])=>`<div class="matrix-cell ${cl}"><h3>${t}</h3>${openTasks().filter(x=>(x.priority||'B')===p).slice(0,4).map(x=>`<p class="small"><b>${esc(x.title)}</b><br><span class="muted">${esc(x.due||'')} ${esc(x.time||'')}</span></p>`).join('')||'<p class="muted small">Пусто</p>'}</div>`).join('')}</div>`}
function spheresPage(){const folder=state.settings.lifeFolder||'overview';return layout('Сферы жизни','Папки без дублей: люди, заметки, планирование, привычки, книги, идеи и личная жизнь.',`<section class="folder-list">${lifeFolders().map(f=>folderButton(f.id,f.title,f.ico,lifeFolderCount(f.id))).join('')}</section><section style="margin-top:18px">${folder==='overview'?lifeOverview():folder==='people'?peopleFolder():folder==='notes'?notesFolder():folder==='planning'?planningPageInner():folder==='habits'?habitsFolder():folder==='books'?booksFolder():folder==='ideas'?ideasFolder():personalFolder()}</section>`)}
function lifeFolders(){return [{id:'people',title:'Люди',ico:'◌'},{id:'notes',title:'Заметки',ico:'✎'},{id:'planning',title:'Планирование',ico:'☷'},{id:'habits',title:'Привычки',ico:'◷'},{id:'books',title:'Книги',ico:'◧'},{id:'ideas',title:'Идеи',ico:'✦'},{id:'personal',title:'Личная жизнь',ico:'♡'}]}
function lifeFolderCount(id){return ({people:state.people.length,notes:state.notes.length,planning:openTasks().length+upcomingEvents().length,habits:state.habits.length,books:state.books.length,ideas:state.ideas.length,personal:state.media.length}[id]||0)}
function folderButton(id,title,ico,count){return `<button class="folder-card ${state.settings.lifeFolder===id?'active':''}" data-life-folder="${id}"><div class="folder-ico">${ico}</div><strong>${title}</strong><small>${count} записей</small><span class="pill blue">Открыть</span></button>`}
function lifeOverview(){return `<section class="card"><div class="card-head"><h3>Список сфер</h3><button class="btn secondary" data-action="addSphere">Добавить сферу</button></div><div class="life-grid">${state.spheres.map(s=>`<div class="life-tile"><div class="life-ico">${esc(s.icon||'✣')}</div><strong>${esc(s.title)}</strong><small class="muted">${esc(s.note||'')}</small>${progressBar(num(s.progress),num(s.progress)>75?'green':'')}<div class="button-row"><button class="mini-btn" data-action="editSphere" data-id="${s.id}">Ред.</button><button class="mini-btn red" data-action="deleteSphere" data-id="${s.id}">Удалить</button></div></div>`).join('')}</div></section>`}
function peopleFolder(){return `<section class="card"><div class="card-head"><h3>Люди</h3><button class="btn" data-action="addPerson">Добавить человека</button></div><div class="grid cols-3">${state.people.map(p=>`<article class="person-card"><div class="person-top"><div class="person-avatar">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc((p.name||'?').slice(0,1))}</div><div><strong>${esc(p.name)}</strong><p class="muted small">${esc(p.relation||'контакт')}</p></div></div><p class="small muted">ДР: ${esc(p.birthday||'—')}</p><p class="small"><b>Любит:</b> ${esc(p.likes||'—')}</p><p class="small"><b>Разговор:</b> ${esc(p.talkIdeas||'—')}</p><p class="small"><b>Подарки:</b> ${esc(p.gifts||'—')}</p><div class="button-row"><button class="mini-btn" data-action="editPerson" data-id="${p.id}">Ред.</button>${p.links?`<a class="mini-btn blue" href="${esc(p.links)}" target="_blank">Ссылка</a>`:''}<button class="mini-btn red" data-action="deletePerson" data-id="${p.id}">Удалить</button></div></article>`).join('')||empty('Люди пока не добавлены')}</div></section>`}
function notesFolder(){return `<section class="card"><div class="card-head"><h3>Заметки</h3><button class="btn" data-action="addNote">Новая заметка</button></div><div class="note-list">${state.notes.map(n=>`<div class="list-row"><span class="pill ${n.tags&&n.tags.includes('рефлексия')?'violet':'blue'}">${n.tags&&n.tags.includes('рефлексия')?'рефлексия':'заметка'}</span><div><div class="row-title">${esc(n.title)}</div><div class="row-sub">${esc(n.folder||'Личное')} · ${esc(n.createdAt||'')} · ${esc(n.text||'')}</div></div><div class="button-row"><button class="mini-btn" data-action="editNote" data-id="${n.id}">Ред.</button><button class="mini-btn red" data-action="deleteNote" data-id="${n.id}">Удалить</button></div></div>`).join('')||empty('Нет заметок')}</div></section>`}
function planningPageInner(){return `<div>${planningPage().replace(/^<div class="page">|<\/div>$/g,'')}</div>`}
function habitsFolder(){const avg=state.habits.length?Math.round(state.habits.reduce((a,h)=>a+habitPct(h),0)/state.habits.length):0;return `<section class="grid cols-3"><article class="card premium-hero-card"><h3>Ритм привычек</h3><div class="value">${avg}%</div><p class="muted small">за 28 дней</p>${progressBar(avg)}</article><article class="card"><h3>Сегодня</h3><div class="value sm">${state.habits.filter(h=>h.marks&&h.marks[todayKey()]).length}/${state.habits.length}</div></article><article class="card"><h3>Новая привычка</h3><button class="btn" data-action="addHabit">Добавить</button></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>График повторений</h3><span class="pill blue">28 дней</span></div><div class="grid cols-2">${state.habits.map(habitCard).join('')||empty('Нет привычек')}</div></section>`}
function habitPct(h){const days=lastDays(28);return Math.round(days.filter(d=>h.marks&&h.marks[d]).length/28*100)}
function lastDays(n){const out=[];for(let i=n-1;i>=0;i--)out.push(iso(addDays(new Date(),-i)));return out}
function habitCard(h){return `<div class="mini-box"><div class="stat-row"><strong>${esc(h.name)}</strong><span class="pill blue">${habitPct(h)}%</span></div><p class="small muted">${esc(h.area||'Личное')} · ${esc(h.target||'ежедневно')}</p><div class="habit-grid">${lastDays(28).map(d=>`<button class="habit-cell ${h.marks&&h.marks[d]?'on':''}" data-action="toggleHabitDate" data-id="${h.id}" data-date="${d}" title="${d}"></button>`).join('')}</div><div class="button-row"><button class="mini-btn" data-action="editHabit" data-id="${h.id}">Ред.</button><button class="mini-btn red" data-action="deleteHabit" data-id="${h.id}">Удалить</button></div></div>`}
function booksFolder(){return `<section class="card"><div class="card-head"><h3>Книги</h3><button class="btn" data-action="addBook">Добавить книгу</button></div><div class="grid cols-2">${state.books.map(b=>`<article class="mini-box"><div class="stat-row"><strong>${esc(b.title)}</strong><span class="pill blue">${esc(b.status||'В списке')}</span></div><p class="small muted">${esc(b.author||'Автор')}</p><p class="small"><b>Инсайт:</b> ${esc(b.insight||'')}</p><p class="small"><b>Цитаты:</b> ${(b.quotes||[]).map(esc).join(' · ')}</p><div class="button-row"><button class="mini-btn" data-action="editBook" data-id="${b.id}">Ред.</button><button class="mini-btn red" data-action="deleteBook" data-id="${b.id}">Удалить</button></div></article>`).join('')||empty('Книг нет')}</div></section>`}
function ideasFolder(){return `<section class="card"><div class="card-head"><h3>Идеи</h3><button class="btn" data-action="addIdea">Новая идея</button></div><div class="note-list">${state.ideas.map(i=>`<div class="list-row"><span>✦</span><div><div class="row-title">${esc(i.title)}</div><div class="row-sub">${esc(i.text||'')} · ${esc(i.createdAt||'')}</div></div><div class="button-row"><button class="mini-btn" data-action="editIdea" data-id="${i.id}">Ред.</button><button class="mini-btn red" data-action="deleteIdea" data-id="${i.id}">Удалить</button></div></div>`).join('')||empty('Идей нет')}</div></section>`}
function personalFolder(){return `<section class="card"><div class="card-head"><h3>Что посмотреть</h3><button class="btn" data-action="addMedia">Добавить фильм/сериал</button></div><div class="grid cols-2">${state.media.map(m=>`<article class="mini-box"><div class="stat-row"><strong>${esc(m.title)}</strong><span class="pill blue">${esc(m.type||'Фильм')}</span></div><p class="small muted">${esc(m.status||'Хочу посмотреть')}</p><p class="small">${esc(m.note||'')}</p><div class="button-row">${m.link?`<a class="mini-btn blue" href="${esc(m.link)}" target="_blank">Фильм</a>`:''}${m.trailer?`<a class="mini-btn blue" href="${esc(m.trailer)}" target="_blank">Трейлер</a>`:''}<button class="mini-btn" data-action="editMedia" data-id="${m.id}">Ред.</button><button class="mini-btn red" data-action="deleteMedia" data-id="${m.id}">Удалить</button></div></article>`).join('')||empty('Список пуст')}</div></section>`}
function calendarPage(){return planningPage()}
function importPage(){const s=summary(), actual=num(state.settings.importActualBalance||state.settings.currentBalance), diff=actual-s.calcBalance;return layout('Импорт банка','Дубли убираются сразу. Перед сохранением можно изменить тип, сумму, категорию и комментарий.',`<section class="grid cols-3"><article class="card premium-hero-card"><h3>CSV-импорт</h3><p class="muted">Выбери файл. Предпросмотр покажет только новые строки.</p><input type="file" id="csvFile" accept=".csv,text/csv" class="field"><div class="actions"><button class="btn" data-action="loadCsv">Предпросмотр</button><button class="btn secondary" data-action="confirmCsv" ${csvRows.length?'':'disabled'}>Сохранить</button></div></article><article class="card"><h3>Фактический остаток</h3><div class="field"><input id="importActualBalance" inputmode="decimal" placeholder="Например: 125000" value="${esc(state.settings.importActualBalance||state.settings.currentBalance||'')}"></div><button class="btn secondary" data-action="saveImportBalance">Сохранить остаток</button></article><article class="card"><h3>Сверка</h3><div class="value sm">${actual?money(actual):'не указан'}</div><p class="muted small">Расчёт: ${money(s.calcBalance)}<br>Расхождение: ${actual?money(diff):'—'}<br>Дубли убраны: ${csvDuplicateRemoved}</p></article></section>${csvRows.length?`<section class="card" style="margin-top:18px"><div class="card-head"><h3>Предпросмотр</h3><span class="pill blue">${csvRows.length} новых строк</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Импорт</th><th>Дата</th><th>Тип</th><th>Категория</th><th>Сумма</th><th>Комментарий</th></tr></thead><tbody>${csvRows.map((r,i)=>`<tr><td><input type="checkbox" data-action="csvInclude" data-row="${i}" checked></td><td><input data-action="csvDateInput" data-row="${i}" value="${esc(r.date)}"></td><td><select data-action="csvTypeInput" data-row="${i}"><option value="expense" ${r.type==='expense'?'selected':''}>Расход</option><option value="income" ${r.type==='income'?'selected':''}>Доход</option></select></td><td><input data-action="csvCategoryInput" data-row="${i}" value="${esc(r.category)}"></td><td><input data-action="csvAmountInput" data-row="${i}" value="${esc(r.amount)}"></td><td><input data-action="csvNoteInput" data-row="${i}" value="${esc(r.note)}"></td></tr>`).join('')}</tbody></table></div></section>`:''}`)}
function diagnosticsPage(){return layout('Диагностика','Техническая информация отдельно от названия продукта.',`<section class="grid cols-2"><article class="card"><h3>Название</h3><div class="value sm">Second Brain OS</div><p class="muted">Домен и название не меняются от сборок.</p></article><article class="card"><h3>Сборка</h3><p class="muted small">${BUILD}</p></article><article class="card"><h3>Данные</h3><p class="muted small">Операции: ${state.operations.length}<br>Задачи: ${state.tasks.length}<br>Люди: ${state.people.length}<br>Заметки: ${state.notes.length}<br>Привычки: ${state.habits.length}<br>Долги: ${activeDebts().length}</p><div class="actions"><button class="btn" data-action="exportData">Экспорт</button><button class="btn secondary" data-action="snapshot">Снимок</button></div></article><article class="card"><h3>Кэш</h3><button class="btn secondary" data-action="clearCaches">Очистить кэш сайта</button></article></section>`)}
function upcomingTasks(){return openTasks().filter(t=>t.due&&t.due>=todayKey())}
function renderNav(){$('#sidebarNav').innerHTML=`<div class="nav-label">Навигация</div>`+navItems.map(([id,ico,label])=>`<button class="nav-btn ${page===id?'active':''}" data-go="${id}"><span class="nav-ico">${ico}</span>${label}</button>`).join('');$('#bottomNav').innerHTML=mobileItems.map(([id,ico,label])=>`<button class="${page===id?'active':''}" data-go="${id}"><i>${ico}</i>${label}</button>`).join('')}
function render(){renderNav();const map={dashboard,finance:financePage,budget:budgetPage,goals:goalsPage,planning:planningPage,spheres:spheresPage,calendar:calendarPage,import:importPage,diagnostics:diagnosticsPage};$('#view').innerHTML=(map[page]||dashboard)()}
function openModal(title,html){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modal').classList.add('show')}
function closeModal(){$('#modal').classList.remove('show')}
function formVal(id){return $('#'+id)?.value||''}
function field(label,id,val='',type='text'){return `<div class="field"><label>${label}</label><input id="${id}" type="${type}" value="${esc(val)}"></div>`}
function area(label,id,val=''){return `<div class="field" style="grid-column:1/-1"><label>${label}</label><textarea id="${id}">${esc(val)}</textarea></div>`}
function openQuick(){openModal('Быстро добавить',`<div class="grid cols-2"><button class="btn" data-action="addTask">Задача</button><button class="btn" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button><button class="btn secondary" data-action="addNote">Заметка</button><button class="btn secondary" data-action="addGoal">Цель SMART</button><button class="btn secondary" data-action="addHabit">Привычка</button><button class="btn secondary" data-action="addPerson">Человек</button><button class="btn secondary" data-action="addPurchase">Покупка</button></div>`)}
function modalButtons(action){return `<div class="actions"><button class="btn" data-action="${action}">Сохранить</button></div>`}
function addTask(){openModal('Новая задача',`<div class="form-grid">${field('Задача','f_title')}${field('Сфера','f_area','Личное')}${field('Дата','f_due',todayKey(),'date')}${field('Время','f_time','','time')}<div class="field"><label>Приоритет</label><select id="f_priority"><option value="A">Срочно и важно</option><option value="B" selected>Важно, не срочно</option><option value="C">Срочно, не важно</option><option value="D">Позже / убрать</option></select></div></div>${modalButtons('saveTask')}`)}
function saveTask(){state.tasks.unshift({id:uid(),title:formVal('f_title')||'Новая задача',area:formVal('f_area')||'Личное',due:formVal('f_due')||todayKey(),time:formVal('f_time'),priority:formVal('f_priority')||'B',status:'В работе'});save(true);closeModal();toast('Задача добавлена');render()}
function editTask(id){const t=state.tasks.find(x=>x.id===id);if(!t)return;openModal('Редактировать задачу',`<div class="form-grid">${field('Задача','f_title',t.title)}${field('Сфера','f_area',t.area)}${field('Дата','f_due',t.due,'date')}${field('Время','f_time',t.time,'time')}<div class="field"><label>Приоритет</label><select id="f_priority"><option value="A" ${t.priority==='A'?'selected':''}>Срочно и важно</option><option value="B" ${t.priority==='B'?'selected':''}>Важно, не срочно</option><option value="C" ${t.priority==='C'?'selected':''}>Срочно, не важно</option><option value="D" ${t.priority==='D'?'selected':''}>Позже</option></select></div></div><div class="actions"><button class="btn" data-action="saveEditedTask" data-id="${id}">Сохранить</button><button class="btn red" data-action="deleteTask" data-id="${id}">Удалить</button></div>`)}
function saveEditedTask(id){const t=state.tasks.find(x=>x.id===id);if(t){t.title=formVal('f_title');t.area=formVal('f_area');t.due=formVal('f_due');t.time=formVal('f_time');t.priority=formVal('f_priority')}save(true);closeModal();render()}
function toggleTask(id){const t=state.tasks.find(x=>x.id===id);if(t)t.status=t.status==='Готово'?'В работе':'Готово';save(true);render()}
function deleteTask(id){state.tasks=state.tasks.filter(x=>x.id!==id);save(true);closeModal();render()}
function setTaskScope(){state.settings.taskScope=this?.dataset?.scope||'today';save();render()}
function addOperationModal(type,o=null){openModal(type==='income'?'Доход':'Расход',`<div class="form-grid">${field('Сумма','f_amount',o?.amount||'')}${field('Категория','f_category',o?.category||(type==='income'?'Доход':'Продукты'))}${field('Дата','f_date',o?.date||todayKey(),'date')}${field('Комментарий','f_note',o?.note||'')}</div><div class="actions"><button class="btn" data-action="${o?'saveEditedOperation':'saveOperation'}" data-type="${type}" ${o?`data-id="${o.id}"`:''}>Сохранить</button></div>`)}
function addExpense(){addOperationModal('expense')} function addIncome(){addOperationModal('income')}
function saveOperation(){const type=this.dataset.type;state.operations.unshift({id:uid(),type,amount:num(formVal('f_amount')),category:formVal('f_category')||'Без категории',date:formVal('f_date')||todayKey(),note:formVal('f_note')});save(true);closeModal();render()}
function editOperation(id){const o=state.operations.find(x=>x.id===id); if(o)addOperationModal(o.type,o)}
function saveEditedOperation(){const o=state.operations.find(x=>x.id===this.dataset.id); if(o){o.amount=num(formVal('f_amount'));o.category=formVal('f_category');o.date=formVal('f_date');o.note=formVal('f_note');o.type=this.dataset.type}save(true);closeModal();render()}
function editActualBalance(){openModal('Фактический остаток',`<div class="field"><label>Сколько денег фактически сейчас?</label><input id="f_balance" inputmode="decimal" value="${esc(state.settings.currentBalance||'')}"></div><div class="actions"><button class="btn" data-action="saveActualBalance">Сохранить</button></div>`)}
function saveActualBalance(){state.settings.currentBalance=num(formVal('f_balance'));state.settings.importActualBalance=state.settings.currentBalance;save(true);closeModal();render()}
function addCategory(){openModal('Категория',`<div class="form-grid">${field('Название','f_name')}<div class="field"><label>Тип</label><select id="f_type"><option value="expense">Расход</option><option value="income">Доход</option></select></div>${field('Лимит в месяц','f_limit')}</div>${modalButtons('saveCategory')}`)}
function saveCategory(){state.categories.push({id:uid(),name:formVal('f_name')||'Категория',type:formVal('f_type')||'expense',limit:num(formVal('f_limit'))});save(true);closeModal();render()}
function editCategory(id){const c=state.categories.find(x=>x.id===id);if(!c)return;openModal('Редактировать категорию',`<div class="form-grid">${field('Название','f_name',c.name)}<div class="field"><label>Тип</label><select id="f_type"><option value="expense" ${c.type==='expense'?'selected':''}>Расход</option><option value="income" ${c.type==='income'?'selected':''}>Доход</option></select></div>${field('Лимит в месяц','f_limit',c.limit)}</div><div class="actions"><button class="btn" data-action="saveEditedCategory" data-id="${id}">Сохранить</button></div>`)}
function saveEditedCategory(id){const c=state.categories.find(x=>x.id===id);const old=c?.name;if(c){c.name=formVal('f_name');c.type=formVal('f_type');c.limit=num(formVal('f_limit'));state.operations.forEach(o=>{if(o.category===old)o.category=c.name});state.plannedPurchases.forEach(p=>{if(p.category===old)p.category=c.name})}save(true);closeModal();render()}
function deleteCategory(id){
 const c=state.categories.find(x=>x.id===id);
 if(!c)return;
 const usedOps=state.operations.filter(o=>String(o.category||'')===String(c.name||'')).length;
 const usedPurch=state.plannedPurchases.filter(p=>String(p.category||'')===String(c.name||'')).length;
 const ok=confirm(`Удалить категорию «${c.name}»?${usedOps+usedPurch?`\nОна используется в ${usedOps+usedPurch} записях. Они будут переведены в «Без категории».`:''}`);
 if(!ok)return;
 state.operations.forEach(o=>{if(String(o.category||'')===String(c.name||''))o.category='Без категории'});
 state.plannedPurchases.forEach(p=>{if(String(p.category||'')===String(c.name||''))p.category='Без категории'});
 state.categories=state.categories.filter(x=>x.id!==id);
 save(true);
 toast('Категория удалена');
 render();
}
function addDebt(){openModal('Долг',`<div class="form-grid">${field('Кому / что','f_person')}${field('Сумма','f_amount')}${field('Когда отдать','f_due',todayKey(),'date')}${field('Комментарий','f_note')}</div>${modalButtons('saveDebt')}`)}
function saveDebt(){state.debts.unshift({id:uid(),person:formVal('f_person')||'Долг',amount:num(formVal('f_amount')),due:formVal('f_due'),status:'Активен',note:formVal('f_note')});save(true);closeModal();render()}
function editDebt(id){const d=state.debts.find(x=>x.id===id);if(!d)return;openModal('Редактировать долг',`<div class="form-grid">${field('Кому / что','f_person',d.person)}${field('Сумма','f_amount',d.amount)}${field('Когда отдать','f_due',d.due,'date')}${field('Комментарий','f_note',d.note)}</div><div class="actions"><button class="btn" data-action="saveEditedDebt" data-id="${id}">Сохранить</button></div>`)}
function saveEditedDebt(id){const d=state.debts.find(x=>x.id===id);if(d){d.person=formVal('f_person');d.amount=num(formVal('f_amount'));d.due=formVal('f_due');d.note=formVal('f_note')}save(true);closeModal();render()}
function closeDebt(id){const d=state.debts.find(x=>x.id===id);if(d)d.status='Закрыт';save(true);render()}
function debtTask(id){const d=state.debts.find(x=>x.id===id); if(d){state.tasks.unshift({id:uid(),title:`Отдать долг: ${d.person} — ${money(d.amount)}`,area:'Финансы',due:d.due||todayKey(),time:'10:00',priority:'A',status:'В работе'});d.reminder=true;save(true);toast('Задача-напоминание создана');render()}}
function addPurchase(){openModal('Плановая покупка',`<div class="form-grid">${field('Что купить','f_title')}${field('Категория','f_category','Одежда')}${field('Сумма','f_amount')}${field('Месяц','f_month',state.settings.currentMonth)}<div class="field"><label>Важность</label><select id="f_importance"><option>Очень важно</option><option selected>Важно</option><option>Можно позже</option></select></div><div class="field"><label>Учитывать в лимите</label><select id="f_include"><option value="true">Да</option><option value="false">Нет</option></select></div>${area('Комментарий','f_note')}</div>${modalButtons('savePurchase')}`)}
function savePurchase(){state.plannedPurchases.unshift({id:uid(),title:formVal('f_title')||'Покупка',category:formVal('f_category')||'Покупки',amount:num(formVal('f_amount')),month:formVal('f_month')||state.settings.currentMonth,importance:formVal('f_importance'),includeInBudget:formVal('f_include')!=='false',note:formVal('f_note')});save(true);closeModal();render()}
function editPurchase(id){const p=state.plannedPurchases.find(x=>x.id===id);if(!p)return;openModal('Редактировать покупку',`<div class="form-grid">${field('Что купить','f_title',p.title)}${field('Категория','f_category',p.category)}${field('Сумма','f_amount',p.amount)}${field('Месяц','f_month',p.month)}<div class="field"><label>Важность</label><select id="f_importance"><option ${p.importance==='Очень важно'?'selected':''}>Очень важно</option><option ${p.importance==='Важно'?'selected':''}>Важно</option><option ${p.importance==='Можно позже'?'selected':''}>Можно позже</option></select></div><div class="field"><label>Учитывать в лимите</label><select id="f_include"><option value="true" ${p.includeInBudget!==false?'selected':''}>Да</option><option value="false" ${p.includeInBudget===false?'selected':''}>Нет</option></select></div>${area('Комментарий','f_note',p.note)}</div><div class="actions"><button class="btn" data-action="saveEditedPurchase" data-id="${id}">Сохранить</button></div>`)}
function saveEditedPurchase(id){const p=state.plannedPurchases.find(x=>x.id===id);if(p){p.title=formVal('f_title');p.category=formVal('f_category');p.amount=num(formVal('f_amount'));p.month=formVal('f_month');p.importance=formVal('f_importance');p.includeInBudget=formVal('f_include')!=='false';p.note=formVal('f_note')}save(true);closeModal();render()}
function deletePurchase(id){state.plannedPurchases=state.plannedPurchases.filter(x=>x.id!==id);save(true);render()}
function addGoal(){openModal('Цель SMART',`<div class="form-grid">${field('Название','f_title')}${field('Сфера','f_area','Личное')}${field('Цель, ₽/число','f_target')}${field('Сейчас','f_current')}${field('Срок','f_deadline','','date')}${field('Шаг недели','f_week52')}${area('S — конкретика','f_specific')}${area('M — измерение','f_measurable')}${area('A — достижимость','f_achievable')}${area('R — зачем это важно','f_relevant')}${area('T — срок','f_timebound')}</div>${modalButtons('saveGoal')}`)}
function saveGoal(){state.goals.unshift({id:uid(),title:formVal('f_title')||'Цель',area:formVal('f_area'),targetValue:num(formVal('f_target')),currentValue:num(formVal('f_current')),deadline:formVal('f_deadline'),specific:formVal('f_specific'),measurable:formVal('f_measurable'),achievable:formVal('f_achievable'),relevant:formVal('f_relevant'),timebound:formVal('f_timebound'),week52:formVal('f_week52'),nextAction:formVal('f_week52'),status:'Активна'});save(true);closeModal();render()}
function editGoal(id){const g=state.goals.find(x=>x.id===id);if(!g)return;openModal('Редактировать цель SMART',`<div class="form-grid">${field('Название','f_title',g.title)}${field('Сфера','f_area',g.area)}${field('Цель, ₽/число','f_target',g.targetValue)}${field('Сейчас','f_current',g.currentValue)}${field('Срок','f_deadline',g.deadline,'date')}${field('Шаг недели','f_week52',g.week52||g.nextAction)}${area('S — конкретика','f_specific',g.specific)}${area('M — измерение','f_measurable',g.measurable)}${area('A — достижимость','f_achievable',g.achievable)}${area('R — зачем это важно','f_relevant',g.relevant)}${area('T — срок','f_timebound',g.timebound)}</div><div class="actions"><button class="btn" data-action="saveEditedGoal" data-id="${id}">Сохранить</button></div>`)}
function saveEditedGoal(id){const g=state.goals.find(x=>x.id===id);if(g){['title','area','deadline','specific','measurable','achievable','relevant','timebound'].forEach(k=>g[k]=formVal('f_'+k));g.targetValue=num(formVal('f_target'));g.currentValue=num(formVal('f_current'));g.week52=formVal('f_week52');g.nextAction=g.week52}save(true);closeModal();render()}
function deleteGoal(id){state.goals=state.goals.filter(x=>x.id!==id);save(true);render()}
function addNote(){openModal('Заметка',`<div class="form-grid">${field('Заголовок','f_title')}${field('Папка','f_folder','Личное')}${area('Текст','f_text')}</div>${modalButtons('saveNote')}`)}
function saveNote(){state.notes.unshift({id:uid(),title:formVal('f_title')||'Заметка',folder:formVal('f_folder')||'Личное',text:formVal('f_text'),tags:[],createdAt:todayKey()});save(true);closeModal();render()}
function editNote(id){const n=state.notes.find(x=>x.id===id);if(!n)return;openModal('Редактировать заметку',`<div class="form-grid">${field('Заголовок','f_title',n.title)}${field('Папка','f_folder',n.folder)}${area('Текст','f_text',n.text)}</div><div class="actions"><button class="btn" data-action="saveEditedNote" data-id="${id}">Сохранить</button></div>`)}
function saveEditedNote(id){const n=state.notes.find(x=>x.id===id);if(n){n.title=formVal('f_title');n.folder=formVal('f_folder');n.text=formVal('f_text')}save(true);closeModal();render()}
function deleteNote(id){state.notes=state.notes.filter(x=>x.id!==id);save(true);render()}
function saveDailyReflection(){const text=formVal('dailyReflection')||$('#dailyReflection')?.value||''; if(text.trim()){state.notes.unshift({id:uid(),title:'Рефлексия дня',text,folder:'Рефлексия',tags:['рефлексия'],createdAt:todayKey()});state.settings.dailyReflection='';save(true);toast('Рефлексия сохранена в заметки');render()}}
function addPerson(){openModal('Человек',`<div class="form-grid">${field('Имя','f_name')}${field('Отношение','f_relation')}${field('День рождения','f_birthday','','date')}${field('Фото URL','f_photo')}${field('Любит','f_likes')}${field('Полезная ссылка','f_links')}${field('Темы для разговора','f_talk')}${field('Идеи подарков','f_gifts')}${area('Памятка','f_notes')}</div>${modalButtons('savePerson')}`)}
function savePerson(){state.people.unshift({id:uid(),name:formVal('f_name')||'Человек',relation:formVal('f_relation'),birthday:formVal('f_birthday'),photo:formVal('f_photo'),likes:formVal('f_likes'),links:formVal('f_links'),talkIdeas:formVal('f_talk'),gifts:formVal('f_gifts'),notes:formVal('f_notes')});save(true);closeModal();render()}
function editPerson(id){const p=state.people.find(x=>x.id===id);if(!p)return;openModal('Редактировать человека',`<div class="form-grid">${field('Имя','f_name',p.name)}${field('Отношение','f_relation',p.relation)}${field('День рождения','f_birthday',p.birthday,'date')}${field('Фото URL','f_photo',p.photo)}${field('Любит','f_likes',p.likes)}${field('Полезная ссылка','f_links',p.links)}${field('Темы для разговора','f_talk',p.talkIdeas)}${field('Идеи подарков','f_gifts',p.gifts)}${area('Памятка','f_notes',p.notes)}</div><div class="actions"><button class="btn" data-action="saveEditedPerson" data-id="${id}">Сохранить</button></div>`)}
function saveEditedPerson(id){const p=state.people.find(x=>x.id===id);if(p){p.name=formVal('f_name');p.relation=formVal('f_relation');p.birthday=formVal('f_birthday');p.photo=formVal('f_photo');p.likes=formVal('f_likes');p.links=formVal('f_links');p.talkIdeas=formVal('f_talk');p.gifts=formVal('f_gifts');p.notes=formVal('f_notes')}save(true);closeModal();render()}
function deletePerson(id){state.people=state.people.filter(x=>x.id!==id);save(true);render()}
function addHabit(){openModal('Привычка',`<div class="form-grid">${field('Название','f_name')}${field('Сфера','f_area','Личное')}${field('Цель','f_target','ежедневно')}</div>${modalButtons('saveHabit')}`)}
function saveHabit(){state.habits.unshift({id:uid(),name:formVal('f_name')||'Привычка',area:formVal('f_area'),target:formVal('f_target'),marks:{}});save(true);closeModal();render()}
function editHabit(id){const h=state.habits.find(x=>x.id===id);if(!h)return;openModal('Редактировать привычку',`<div class="form-grid">${field('Название','f_name',h.name)}${field('Сфера','f_area',h.area)}${field('Цель','f_target',h.target)}</div><div class="actions"><button class="btn" data-action="saveEditedHabit" data-id="${id}">Сохранить</button></div>`)}
function saveEditedHabit(id){const h=state.habits.find(x=>x.id===id);if(h){h.name=formVal('f_name');h.area=formVal('f_area');h.target=formVal('f_target')}save(true);closeModal();render()}
function deleteHabit(id){state.habits=state.habits.filter(x=>x.id!==id);save(true);render()} function toggleHabitDate(id,date){const h=state.habits.find(x=>x.id===id);if(h){h.marks=h.marks||{};h.marks[date]=!h.marks[date]}save(true);render()}
function addBook(){openModal('Книга',`<div class="form-grid">${field('Название','f_title')}${field('Автор','f_author')}${field('Статус','f_status','Хочу прочитать')}${field('Обложка URL','f_cover')}${area('Инсайт','f_insight')}${area('Цитаты, которые запомнились','f_quotes')}</div>${modalButtons('saveBook')}`)}
function saveBook(){state.books.unshift({id:uid(),title:formVal('f_title')||'Книга',author:formVal('f_author'),status:formVal('f_status'),cover:formVal('f_cover'),insight:formVal('f_insight'),quotes:formVal('f_quotes').split('\n').filter(Boolean)});save(true);closeModal();render()}
function editBook(id){const b=state.books.find(x=>x.id===id);if(!b)return;openModal('Редактировать книгу',`<div class="form-grid">${field('Название','f_title',b.title)}${field('Автор','f_author',b.author)}${field('Статус','f_status',b.status)}${field('Обложка URL','f_cover',b.cover)}${area('Инсайт','f_insight',b.insight)}${area('Цитаты, которые запомнились','f_quotes',(b.quotes||[]).join('\n'))}</div><div class="actions"><button class="btn" data-action="saveEditedBook" data-id="${id}">Сохранить</button></div>`)}
function saveEditedBook(id){const b=state.books.find(x=>x.id===id);if(b){b.title=formVal('f_title');b.author=formVal('f_author');b.status=formVal('f_status');b.cover=formVal('f_cover');b.insight=formVal('f_insight');b.quotes=formVal('f_quotes').split('\n').filter(Boolean)}save(true);closeModal();render()} function deleteBook(id){state.books=state.books.filter(x=>x.id!==id);save(true);render()}
function addIdea(){openModal('Идея',`${field('Название','f_title')}${area('Описание','f_text')}${modalButtons('saveIdea')}`)}
function saveIdea(){state.ideas.unshift({id:uid(),title:formVal('f_title')||'Идея',text:formVal('f_text'),createdAt:todayKey()});save(true);closeModal();render()} function editIdea(id){const x=state.ideas.find(i=>i.id===id);if(!x)return;openModal('Идея',`${field('Название','f_title',x.title)}${area('Описание','f_text',x.text)}<div class="actions"><button class="btn" data-action="saveEditedIdea" data-id="${id}">Сохранить</button></div>`)} function saveEditedIdea(id){const x=state.ideas.find(i=>i.id===id);if(x){x.title=formVal('f_title');x.text=formVal('f_text')}save(true);closeModal();render()} function deleteIdea(id){state.ideas=state.ideas.filter(x=>x.id!==id);save(true);render()}
function addMedia(){openModal('Фильм / сериал',`<div class="form-grid">${field('Название','f_title')}${field('Тип','f_type','Фильм')}${field('Статус','f_status','Хочу посмотреть')}${field('Ссылка на фильм','f_link')}${field('Ссылка на трейлер','f_trailer')}${area('Заметка','f_note')}</div>${modalButtons('saveMedia')}`)}
function saveMedia(){state.media.unshift({id:uid(),title:formVal('f_title')||'Фильм',type:formVal('f_type'),status:formVal('f_status'),link:formVal('f_link'),trailer:formVal('f_trailer'),note:formVal('f_note')});save(true);closeModal();render()} function editMedia(id){const m=state.media.find(x=>x.id===id);if(!m)return;openModal('Фильм / сериал',`<div class="form-grid">${field('Название','f_title',m.title)}${field('Тип','f_type',m.type)}${field('Статус','f_status',m.status)}${field('Ссылка на фильм','f_link',m.link)}${field('Ссылка на трейлер','f_trailer',m.trailer)}${area('Заметка','f_note',m.note)}</div><div class="actions"><button class="btn" data-action="saveEditedMedia" data-id="${id}">Сохранить</button></div>`)} function saveEditedMedia(id){const m=state.media.find(x=>x.id===id);if(m){m.title=formVal('f_title');m.type=formVal('f_type');m.status=formVal('f_status');m.link=formVal('f_link');m.trailer=formVal('f_trailer');m.note=formVal('f_note')}save(true);closeModal();render()} function deleteMedia(id){state.media=state.media.filter(x=>x.id!==id);save(true);render()}
function addSphere(){openModal('Сфера',`<div class="form-grid">${field('Название','f_title')}${field('Иконка','f_icon','✣')}${field('Прогресс %','f_progress','50')}${field('Комментарий','f_note')}</div>${modalButtons('saveSphere')}`)}
function saveSphere(){state.spheres.push({id:uid(),title:formVal('f_title')||'Сфера',icon:formVal('f_icon')||'✣',progress:clamp(num(formVal('f_progress'))),note:formVal('f_note')});save(true);closeModal();render()} function editSphere(id){const s=state.spheres.find(x=>x.id===id);if(!s)return;openModal('Сфера',`<div class="form-grid">${field('Название','f_title',s.title)}${field('Иконка','f_icon',s.icon)}${field('Прогресс %','f_progress',s.progress)}${field('Комментарий','f_note',s.note)}</div><div class="actions"><button class="btn" data-action="saveEditedSphere" data-id="${id}">Сохранить</button></div>`)} function saveEditedSphere(id){const s=state.spheres.find(x=>x.id===id);if(s){s.title=formVal('f_title');s.icon=formVal('f_icon');s.progress=clamp(num(formVal('f_progress')));s.note=formVal('f_note')}save(true);closeModal();render()} function deleteSphere(id){state.spheres=state.spheres.filter(x=>x.id!==id);save(true);render()}
function addEvent(){openModal('Событие',`<div class="form-grid">${field('Название','f_title')}${field('Дата','f_date',todayKey(),'date')}${field('Время','f_time','','time')}${field('Сфера','f_area','Личное')}${area('Заметка','f_note')}</div>${modalButtons('saveEvent')}`)} function saveEvent(){state.calendarEvents.unshift({id:uid(),title:formVal('f_title')||'Событие',date:formVal('f_date'),time:formVal('f_time'),area:formVal('f_area'),note:formVal('f_note')});save(true);closeModal();render()} function editEvent(id){const e=state.calendarEvents.find(x=>x.id===id);if(!e)return;openModal('Событие',`<div class="form-grid">${field('Название','f_title',e.title)}${field('Дата','f_date',e.date,'date')}${field('Время','f_time',e.time,'time')}${field('Сфера','f_area',e.area)}${area('Заметка','f_note',e.note)}</div><div class="actions"><button class="btn" data-action="saveEditedEvent" data-id="${id}">Сохранить</button></div>`)} function saveEditedEvent(id){const e=state.calendarEvents.find(x=>x.id===id);if(e){e.title=formVal('f_title');e.date=formVal('f_date');e.time=formVal('f_time');e.area=formVal('f_area');e.note=formVal('f_note')}save(true);closeModal();render()}
function googleUrl(title,date,time,note=''){const start=(date||todayKey()).replace(/-/g,'')+'T'+String(time||'10:00').replace(':','')+'00';const end=(date||todayKey()).replace(/-/g,'')+'T'+String(time||'11:00').replace(':','')+'00';return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(note)}`}
function googleTask(id){const t=state.tasks.find(x=>x.id===id);if(t)window.open(googleUrl(t.title,t.due,t.time,t.area),'_blank')} function googleEvent(id){const e=state.calendarEvents.find(x=>x.id===id);if(e)window.open(googleUrl(e.title,e.date,e.time,e.note),'_blank')}
function parseCsv(text){const sep=(text.split('\n')[0].match(/;/g)||[]).length>(text.split('\n')[0].match(/,/g)||[]).length?';':',';const rows=[];let row=[],cur='',q=false;for(let i=0;i<text.length;i++){const ch=text[i],n=text[i+1];if(ch==='"'&&q&&n==='"'){cur+='"';i++;continue}if(ch==='"'){q=!q;continue}if(ch===sep&&!q){row.push(cur.trim());cur='';continue}if((ch==='\n'||ch==='\r')&&!q){if(cur||row.length){row.push(cur.trim());rows.push(row);row=[];cur=''}continue}cur+=ch}if(cur||row.length){row.push(cur.trim());rows.push(row)}const heads=rows.shift()||[];return {heads,rows:rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(heads.map((h,i)=>[h,r[i]||''])))} }
function guessRowDate(r){const vals=Object.values(r).map(String);for(const v of vals){let m=v.match(/(20\d{2})[-.\/](\d{1,2})[-.\/](\d{1,2})/);if(m)return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;m=v.match(/(\d{1,2})[.\/](\d{1,2})[.\/](20\d{2})/);if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`}return todayKey()}
function guessRowAmount(r){const nums=Object.values(r).map(v=>Number(String(v).replace(/\s/g,'').replace(',','.'))).filter(v=>!Number.isNaN(v)&&v!==0);if(!nums.length)return 0;return Math.abs(nums.sort((a,b)=>Math.abs(b)-Math.abs(a))[0])}
function guessRowType(r){const text=Object.entries(r).map(([k,v])=>`${k} ${v}`).join(' ').toLowerCase();return /доход|income|поступ|зачисл|зарплат|пополн/.test(text)?'income':'expense'}
function opKey(date,type,amount,note){return [date,type,Math.round(num(amount)*100),String(note||'').toLowerCase().replace(/\s+/g,' ').slice(0,80)].join('|')}
function loadCsv(){const input=$('#csvFile');const f=input?.files?.[0];if(!f){toast('Выбери CSV');return}f.text().then(text=>{const p=parseCsv(text);const keys=new Set(state.operations.map(o=>opKey(o.date,o.type,o.amount,o.note||o.category)));csvDuplicateRemoved=0;const seen=new Set();csvRows=[];p.rows.forEach(r=>{const row={raw:r,date:guessRowDate(r),amount:guessRowAmount(r),type:guessRowType(r),category:r['Категория']||r.category||'Импорт',note:Object.values(r).filter(Boolean).slice(0,4).join(' · ').slice(0,160)};const k=opKey(row.date,row.type,row.amount,row.note);if(keys.has(k)||seen.has(k)){csvDuplicateRemoved++;return}seen.add(k);csvRows.push(row)});toast(`Новых строк: ${csvRows.length}, дублей убрано: ${csvDuplicateRemoved}`);render()})}
function confirmCsv(){const keys=new Set(state.operations.map(o=>opKey(o.date,o.type,o.amount,o.note||o.category)));let added=0;csvRows.forEach((r,i)=>{if(!document.querySelector(`[data-action="csvInclude"][data-row="${i}"]`)?.checked)return;const date=document.querySelector(`[data-action="csvDateInput"][data-row="${i}"]`)?.value||r.date;const type=document.querySelector(`[data-action="csvTypeInput"][data-row="${i}"]`)?.value||r.type;const amount=num(document.querySelector(`[data-action="csvAmountInput"][data-row="${i}"]`)?.value??r.amount);const category=document.querySelector(`[data-action="csvCategoryInput"][data-row="${i}"]`)?.value||r.category;const note=document.querySelector(`[data-action="csvNoteInput"][data-row="${i}"]`)?.value||r.note;const k=opKey(date,type,amount,note);if(keys.has(k))return;keys.add(k);state.operations.unshift({id:uid(),date,type,amount,category,note,importBatch:BUILD});added++});const v=$('#importActualBalance')?.value;if(v!==''){state.settings.importActualBalance=v;state.settings.currentBalance=num(v)}csvRows=[];save(true);toast(`Импортировано: ${added}`);render()}
function saveImportBalance(){state.settings.importActualBalance=num($('#importActualBalance')?.value);state.settings.currentBalance=state.settings.importActualBalance;save(true);toast('Фактический остаток сохранён');render()}
function filterDayOps(day){const d=String(day).padStart(2,'0');const list=monthOps('expense').filter(o=>String(o.date||'').slice(8,10)===d);openModal(`Расходы ${day} числа`,list.map(rowOperation).join('')||empty('Расходов нет'))}
function setLifeFolder(id){state.settings.lifeFolder=id;save();render()}
function exportData(){const blob=new Blob([JSON.stringify({app:APP_NAME,build:BUILD,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`second-brain-os-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href);toast('Экспорт готов')}
function snapshot(){saveSnapshot('manual');toast('Снимок сохранён')}
async function clearCaches(){try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}toast('Кэш очищен');setTimeout(()=>location.reload(),700)}catch(e){toast('Не удалось очистить кэш')}}
/* primary click router replaced by final capture router */
const windowActions={openQuick,closeModal,exportData,snapshot,clearCaches,addTask,saveTask,editTask,saveEditedTask,toggleTask,deleteTask,setTaskScope,addExpense,addIncome,saveOperation,editOperation,saveEditedOperation,editActualBalance,saveActualBalance,addCategory,saveCategory,editCategory,saveEditedCategory,deleteCategory,addDebt,saveDebt,editDebt,saveEditedDebt,closeDebt,debtTask,addPurchase,savePurchase,editPurchase,saveEditedPurchase,deletePurchase,addGoal,saveGoal,editGoal,saveEditedGoal,deleteGoal,addNote,saveNote,editNote,saveEditedNote,deleteNote,saveDailyReflection,addPerson,savePerson,editPerson,saveEditedPerson,deletePerson,addHabit,saveHabit,editHabit,saveEditedHabit,deleteHabit,toggleHabitDate,addBook,saveBook,editBook,saveEditedBook,deleteBook,addIdea,saveIdea,editIdea,saveEditedIdea,deleteIdea,addMedia,saveMedia,editMedia,saveEditedMedia,deleteMedia,addSphere,saveSphere,editSphere,saveEditedSphere,deleteSphere,addEvent,saveEvent,editEvent,saveEditedEvent,googleTask,googleEvent,loadCsv,confirmCsv,saveImportBalance,filterDayOps};
function googleCompat(){return true}
function filesPage(){return diagnosticsPage()}
try{state=normalizeState(state);save();render()}catch(e){document.body.innerHTML='<pre style="padding:24px;font-family:monospace">Second Brain OS: ошибка загрузки\n'+String(e.stack||e)+'</pre>';throw e}

/* ===== Final overrides: planning trips, cycle charts, event routing ===== */
function cycleExpenseByDate(){const c=currentCycle();const map={};cycleOps('expense').forEach(o=>{map[o.date]=(map[o.date]||0)+num(o.amount)});return {map,start:new Date(c.start),end:new Date(c.end)}}
function dailySpendSeries(){const {map,start,end}=cycleExpenseByDate();const arr=[];let d=new Date(start);while(d<=end){const key=iso(d);const amount=map[key]||0;arr.push({date:key,day:d.getDate(),label:fmtDate(key),amount});d=addDays(d,1)}const max=Math.max(1,...arr.map(x=>x.amount));const active=arr.filter(x=>x.amount>0);const avg=active.reduce((a,b)=>a+b.amount,0)/Math.max(1,active.length);return arr.map(x=>({...x,h:Math.max(6,Math.round(x.amount/max*100)),hot:x.amount>avg*1.6&&x.amount>0,warn:x.amount>avg&&x.amount>0}))}
function renderDailySpendChart(){return `<div class="day-chart">${dailySpendSeries().map(x=>`<div class="day-bar ${x.hot?'hot':x.warn?'warn':''}" style="--h:${x.h}%" data-tip="${x.label}: ${money(x.amount)}"></div>`).join('')}</div><div class="small muted">График рассчитан по зарплатному циклу 10 → 9. Красным выделены пики трат.</div>`}
function summary(){
 const income=total(monthOps('income')), expenses=total(monthOps('expense')), cycleIncome=total(cycleOps('income')), cycleExpenses=total(cycleOps('expense'));
 const planned=total(plannedInMonth()); const debtDue=total(activeDebts().filter(d=>String(d.due||'').startsWith(state.settings.currentMonth)));
 const calcBalance=income-expenses-planned-debtDue; const actual=num(state.settings.currentBalance)||calcBalance; const plan=num(state.settings.monthlyPlan)||income||1;
 const next=nextSalaryDate(); const days=Math.max(1,Math.ceil((new Date(next.date)-new Date())/86400000)); const obligations=dueUntil(next.date); const toNext=actual-obligations; const dailyLimit=Math.max(0,Math.floor(toNext/days));
 const byCat={}; cycleOps('expense').forEach(o=>{byCat[o.category||'Без категории']=(byCat[o.category||'Без категории']||0)+num(o.amount)}); const topCats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
 return {income,expenses,cycleIncome,cycleExpenses,planned,debtDue,calcBalance,actual,plan,progress:clamp(Math.round(income/plan*100)),nextSalary:next,daysToSalary:days,obligations,toNext,dailyLimit,topCats};
}
function travelTotal(t){return num(t.transport)+num(t.hotel)+num(t.food)+num(t.activities)}
function tripProgress(t){return num(t.budget)?clamp(Math.round(num(t.saved)/num(t.budget)*100)):0}
function tripsPanel(){return `<section class="card" style="margin-top:18px"><div class="card-head"><h3>Путешествия и поездки</h3><button class="btn secondary" data-action="addTrip">Запланировать</button></div><div class="grid cols-2">${state.trips.map(t=>`<article class="mini-box"><div class="stat-row"><strong>${esc(t.title)}</strong><span class="pill blue">${esc(t.status||'План')}</span></div><p class="small muted">${esc(t.direction||'Любое направление')} ${t.start?`· ${esc(t.start)} — ${esc(t.end||'')}`:''}</p><div class="value sm">${money(t.budget)}</div>${progressBar(tripProgress(t))}<p class="small muted">Накоплено ${money(t.saved)} · расчёт ${money(travelTotal(t))}</p><p class="small muted">Транспорт ${money(t.transport)} · Жильё ${money(t.hotel)} · Еда ${money(t.food)} · Активности ${money(t.activities)}</p><div class="button-row"><button class="mini-btn" data-action="editTrip" data-id="${t.id}">Ред.</button><button class="mini-btn blue" data-action="tripToBudget" data-id="${t.id}">В бюджет</button><button class="mini-btn red" data-action="deleteTrip" data-id="${t.id}">Удалить</button></div></article>`).join('')||empty('Поездок пока нет')}</div></section>`}
function planningPage(){return layout('Планирование','Задачи и календарь в одной папке: сегодня, неделя, месяц + матрица Эйзенхауэра.',`<section class="grid cols-3"><button class="folder-card" data-action="setTaskScope" data-scope="today"><div class="folder-ico">1</div><strong>Сегодня</strong><small>${openTasks().filter(t=>t.due===todayKey()).length} задач</small></button><button class="folder-card" data-action="setTaskScope" data-scope="week"><div class="folder-ico">7</div><strong>Неделя</strong><small>ближайшие действия</small></button><button class="folder-card" data-action="setTaskScope" data-scope="month"><div class="folder-ico">30</div><strong>Месяц</strong><small>план без перегруза</small></button></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Задачи</h3><button class="btn secondary" data-action="addTask">Добавить</button></div>${taskScopeButtons()}<div class="task-list">${tasksByScope().map(rowTask).join('')||empty('Нет задач')}</div></article><article class="card"><div class="card-head"><h3>Календарь</h3><button class="btn secondary" data-action="addEvent">Событие</button></div><div class="note-list">${upcomingEvents().slice(0,8).map(rowEvent).join('')||empty('Нет событий')}</div></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Матрица Эйзенхауэра</h3><span class="pill blue">приоритеты</span></div>${eisenhowerMatrix()}</section>${tripsPanel()}`)}
function planningPageInner(){return `<section class="grid cols-3"><button class="folder-card" data-go="planning"><div class="folder-ico">☑</div><strong>Задачи</strong><small>${openTasks().length} открытых</small></button><button class="folder-card" data-go="planning"><div class="folder-ico">☷</div><strong>Календарь</strong><small>${upcomingEvents().length} событий</small></button><button class="folder-card" data-action="addTrip"><div class="folder-ico">✈</div><strong>Поездка</strong><small>план + бюджет</small></button></section>${tripsPanel()}`}
function addTrip(){openModal('Запланировать поездку',`<div class="form-grid">${field('Название','f_title')}${field('Направление','f_direction','Любое направление')}${field('Дата начала','f_start','','date')}${field('Дата окончания','f_end','','date')}${field('Общий бюджет','f_budget')}${field('Уже накоплено','f_saved')}${field('Транспорт','f_transport')}${field('Жильё','f_hotel')}${field('Еда','f_food')}${field('Активности','f_activities')}${area('Маршрут и заметки','f_notes')}</div>${modalButtons('saveTrip')}`)}
function saveTrip(){state.trips.unshift({id:uid(),title:formVal('f_title')||'Поездка',direction:formVal('f_direction'),start:formVal('f_start'),end:formVal('f_end'),budget:num(formVal('f_budget')),saved:num(formVal('f_saved')),transport:num(formVal('f_transport')),hotel:num(formVal('f_hotel')),food:num(formVal('f_food')),activities:num(formVal('f_activities')),notes:formVal('f_notes'),status:'План'});save(true);closeModal();render()}
function editTrip(id){const t=state.trips.find(x=>x.id===id);if(!t)return;openModal('Редактировать поездку',`<div class="form-grid">${field('Название','f_title',t.title)}${field('Направление','f_direction',t.direction)}${field('Дата начала','f_start',t.start,'date')}${field('Дата окончания','f_end',t.end,'date')}${field('Общий бюджет','f_budget',t.budget)}${field('Уже накоплено','f_saved',t.saved)}${field('Транспорт','f_transport',t.transport)}${field('Жильё','f_hotel',t.hotel)}${field('Еда','f_food',t.food)}${field('Активности','f_activities',t.activities)}${area('Маршрут и заметки','f_notes',t.notes)}</div><div class="actions"><button class="btn" data-action="saveEditedTrip" data-id="${id}">Сохранить</button></div>`)}
function saveEditedTrip(id){const t=state.trips.find(x=>x.id===id);if(t){t.title=formVal('f_title');t.direction=formVal('f_direction');t.start=formVal('f_start');t.end=formVal('f_end');t.budget=num(formVal('f_budget'));t.saved=num(formVal('f_saved'));t.transport=num(formVal('f_transport'));t.hotel=num(formVal('f_hotel'));t.food=num(formVal('f_food'));t.activities=num(formVal('f_activities'));t.notes=formVal('f_notes')}save(true);closeModal();render()}
function deleteTrip(id){state.trips=state.trips.filter(x=>x.id!==id);save(true);render()}
function tripToBudget(id){const t=state.trips.find(x=>x.id===id);if(!t)return;state.plannedPurchases.unshift({id:uid(),title:`Поездка: ${t.title}`,category:'Путешествия',amount:num(t.budget)-num(t.saved),month:state.settings.currentMonth,importance:'Важно',includeInBudget:true,note:'Добавлено из планирования поездки'});save(true);toast('Поездка добавлена в бюджет');render()}
// extend action map after trip overrides
Object.assign(windowActions,{addTrip,saveTrip,editTrip,saveEditedTrip,deleteTrip,tripToBudget});
// replace click router so actions can receive dataset fields too — NUCLEAR FIX
function runActionFromElement(el, event){
  if(!el) return false;
  const ds=el.dataset||{};
  const action=ds.action;
  if(!action) return false;
  if(event){ event.preventDefault(); event.stopPropagation(); }
  try{
    const direct={
      openQuick,closeModal,exportData,snapshot,clearCaches,
      addTask,saveTask,editTask,saveEditedTask,toggleTask,deleteTask,setTaskScope,
      addExpense,addIncome,saveOperation,editOperation,saveEditedOperation,editActualBalance,saveActualBalance,
      addCategory,saveCategory,editCategory,saveEditedCategory,deleteCategory,
      addDebt,saveDebt,editDebt,saveEditedDebt,closeDebt,debtTask,deleteDebt,
      addPurchase,savePurchase,editPurchase,saveEditedPurchase,deletePurchase,
      addGoal,saveGoal,editGoal,saveEditedGoal,deleteGoal,
      addNote,saveNote,editNote,saveEditedNote,deleteNote,saveDailyReflection,
      addPerson,savePerson,editPerson,saveEditedPerson,deletePerson,
      addHabit,saveHabit,editHabit,saveEditedHabit,deleteHabit,toggleHabitDate,
      addBook,saveBook,editBook,saveEditedBook,deleteBook,
      addIdea,saveIdea,editIdea,saveEditedIdea,deleteIdea,
      addMedia,saveMedia,editMedia,saveEditedMedia,deleteMedia,
      addSphere,saveSphere,editSphere,saveEditedSphere,deleteSphere,
      addEvent,saveEvent,editEvent,saveEditedEvent,googleTask,googleEvent,
      loadCsv,confirmCsv,saveImportBalance,filterDayOps,
      addTrip,saveTrip,editTrip,saveEditedTrip,deleteTrip,tripToBudget
    };
    if(action==='filterDayOps') { filterDayOps(ds.day); return true; }
    if(action==='toggleHabitDate') { toggleHabitDate(ds.id, ds.date); return true; }
    if(action==='setTaskScope') { setTaskScope.call(el, ds.scope||ds.id||'today'); return true; }
    if(action==='addDebt') { addDebt.call(el, ds.direction||ds.id||'owe'); return true; }
    const fn=direct[action] || (typeof windowActions!=='undefined'&&windowActions[action]) || window[action];
    if(typeof fn==='function'){
      const arg=ds.id ?? ds.row ?? ds.day ?? ds.scope ?? ds.type ?? '';
      fn.call(el,arg);
      return true;
    }
    console.warn('[Second Brain OS] Неизвестное действие:', action, ds);
    toast('Действие пока не подключено: '+action);
    return false;
  }catch(err){
    console.error('[Second Brain OS] Ошибка действия', action, err);
    toast('Ошибка кнопки: '+(err && err.message ? err.message : action));
    return false;
  }
}
function runGoFromElement(el,event){
  if(!el) return false;
  if(event){event.preventDefault();event.stopPropagation();}
  go(el.dataset.go);
  return true;
}
function runLifeFolderFromElement(el,event){
  if(!el) return false;
  if(event){event.preventDefault();event.stopPropagation();}
  setLifeFolder(el.dataset.lifeFolder);
  return true;
}
// Capture handler: срабатывает до любых старых/вложенных обработчиков.
document.addEventListener('click', e=>{
  const actionEl=e.target.closest('[data-action]');
  if(actionEl) return runActionFromElement(actionEl,e);
  const goEl=e.target.closest('[data-go]');
  if(goEl) return runGoFromElement(goEl,e);
  const lf=e.target.closest('[data-life-folder]');
  if(lf) return runLifeFolderFromElement(lf,e);
}, true);
// Target onclick safety belt: если браузер/кэш/старый слой перебьёт delegation, кнопки всё равно оживут.
function patchClickableButtons(){
  document.querySelectorAll('[data-action]').forEach(el=>{
    if(el.__sbosPatched) return;
    el.__sbosPatched=true;
    el.onclick=function(ev){ return runActionFromElement(el,ev), false; };
  });
  document.querySelectorAll('[data-go]').forEach(el=>{
    if(el.__sbosGoPatched) return;
    el.__sbosGoPatched=true;
    el.onclick=function(ev){ return runGoFromElement(el,ev), false; };
  });
  document.querySelectorAll('[data-life-folder]').forEach(el=>{
    if(el.__sbosLifePatched) return;
    el.__sbosLifePatched=true;
    el.onclick=function(ev){ return runLifeFolderFromElement(el,ev), false; };
  });
}
const __sbosRender=render;
render=function(){
  const out=__sbosRender.apply(this,arguments);
  setTimeout(patchClickableButtons,0);
  return out;
};
try{render();setTimeout(patchClickableButtons,0)}catch(e){console.error(e)}

/* ===== Timeline Focus Polish Fix — categories preserved, logic clarified ===== */
try{ localStorage.setItem('secondBrainOS.currentBuild','timeline-focus-polish-light-tech-20260630'); }catch(e){}

// Keep the same categories, only expose existing hidden sections more clearly.
try{
  const desiredNav=[
    ['dashboard','⌂','Обзор'],['finance','◔','Финансы'],['budget','◉','Бюджет'],['goals','◎','Цели SMART'],['planning','☷','Планирование'],['spheres','✣','Сферы жизни'],['habits','◷','Привычки'],['debts','▣','Долги'],['trips','✈','Путешествия'],['import','⇣','Импорт'],['diagnostics','⚙','Диагностика']
  ];
  navItems.splice(0,navItems.length,...desiredNav);
}catch(e){}

function hasActualBalance(){ return String(state.settings.currentBalance ?? '').trim() !== '' || String(state.settings.importActualBalance ?? '').trim() !== ''; }
function discrepancyDetails(){
  const s=summary();
  const diff=s.actual-s.calcBalance;
  const cls=Math.abs(diff)>0?'amber':'green';
  return `<details class="drawer" open>
    <summary>Как считается расхождение</summary>
    <div class="drawer-body">
      <div class="stat-row"><span>Фактический остаток</span><b>${money(s.actual)}</b></div>
      <div class="stat-row"><span>Расчётный остаток</span><b>${money(s.calcBalance)}</b></div>
      <div class="stat-row"><span>Доходы месяца</span><b class="green">${money(s.income)}</b></div>
      <div class="stat-row"><span>Расходы месяца</span><b>${money(s.expenses)}</b></div>
      <div class="stat-row"><span>Плановые покупки</span><b>${money(s.planned)}</b></div>
      <div class="stat-row"><span>Долги к оплате в месяце</span><b>${money(s.debtDue)}</b></div>
      <div class="alert" style="margin-top:10px">Расхождение = факт − расчёт. Если сумма непонятна, проверь импорт банка, дубли, долги и фактический остаток.</div>
      <div class="actions"><button class="btn secondary" data-action="editActualBalance">Изменить фактический остаток</button><button class="btn secondary" data-go="import">Проверить импорт</button></div>
    </div>
  </details>`;
}
function safetyFundCard(){
  const p=safetyProgress();
  return `<article class="card"><div class="card-head"><h3>Подушка безопасности</h3><button class="mini-btn" data-action="editSafetyFund">Изменить</button></div><div class="value sm">${p}%</div>${progressBar(p,'green')}<p class="muted small">${money(state.safetyFund.current)} из ${money(state.safetyFund.target)}. Отдельный запас безопасности, не цель.</p><details class="drawer"><summary>Откуда процент</summary><div class="drawer-body">${money(state.safetyFund.current)} ÷ ${money(state.safetyFund.target)} × 100 = ${p}%. Если цифры не твои — нажми «Изменить».</div></details></article>`;
}
function editSafetyFund(){openModal('Подушка безопасности',`<div class="form-grid">${field('Сейчас накоплено','f_current',state.safetyFund.current)}${field('Цель подушки','f_target',state.safetyFund.target)}${area('Комментарий','f_note',state.safetyFund.note||'')}</div><div class="actions"><button class="btn" data-action="saveSafetyFund">Сохранить</button></div>`)}
function saveSafetyFund(){state.safetyFund.current=num(formVal('f_current'));state.safetyFund.target=num(formVal('f_target'))||1;state.safetyFund.note=formVal('f_note');save(true);closeModal();render();toast('Подушка обновлена')}

function dailyQuote(){
  const qs=[
    ['Маленькие действия, повторённые много раз, становятся системой.','Сегодня мне достаточно одного ясного действия, а не идеального плана.'],
    ['Фокус — это не делать больше. Фокус — это убрать лишнее.','Я выбираю один главный шаг и не распыляюсь.'],
    ['Деньги любят ясность: факт, план и честный взгляд на остаток.','Я смотрю на цифры спокойно и принимаю лучшее решение.'],
    ['Система освобождает голову для жизни.','Я строю порядок не ради контроля, а ради свободы.']
  ]; const i=new Date().getDate()%qs.length;return {quote:qs[i][0],thought:qs[i][1]}
}
function quoteCard(){const q=dailyQuote(); const last=state.notes.filter(n=>(n.tags||[]).includes('рефлексия')).slice(0,2); return `<article class="card quote-card quote-polish"><div class="card-head"><h3>Цитата дня</h3><span class="pill blue">рефлексия → заметки</span></div><div class="quote-big">“${esc(q.quote)}”</div><div class="reflection-hint"><b>Что я думаю:</b> ${esc(q.thought)}</div><textarea id="dailyReflection" placeholder="Коротко: что я думаю об этой цитате и какой шаг сделаю?">${esc(state.settings.dailyReflection||'')}</textarea><div class="actions"><button class="btn" data-action="saveDailyReflection">Сохранить в заметки</button><button class="btn secondary" data-life-folder="notes">Открыть рефлексии</button></div>${last.length?`<div class="note-list" style="margin-top:10px">${last.map(n=>`<div class="mini-box"><strong>${esc(n.title)}</strong><p class="small muted">${esc(n.text).slice(0,110)}</p></div>`).join('')}</div>`:''}</article>`}
function saveDailyReflection(){const text=$('#dailyReflection')?.value||''; if(text.trim()){state.notes.unshift({id:uid(),title:'Рефлексия дня',text,folder:'Рефлексия',tags:['рефлексия'],createdAt:todayKey()});state.settings.dailyReflection='';save(true);toast('Рефлексия сохранена в заметки');render()}else toast('Напиши мысль перед сохранением')}

function rowTask(t){return `<div class="list-row task-row-polish"><button class="check ${(t.status==='Готово')?'done':''}" data-action="toggleTask" data-id="${t.id}"></button>${t.image?`<img class="task-thumb" src="${esc(t.image)}" alt="">`:''}<button class="mini-btn" data-action="editTask" data-id="${t.id}" style="text-align:left;background:transparent;border:0;min-width:0"><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.area||'Личное')} · ${esc(t.due||'')} ${esc(t.time||'')}</div></button><div class="button-row">${taskPill(t)}<button class="mini-btn blue" data-action="googleTask" data-id="${t.id}">Google</button></div></div>`}
function addTask(){openModal('Новая задача',`<div class="form-grid">${field('Задача','f_title')}${field('Сфера','f_area','Личное')}${field('Дата','f_due',todayKey(),'date')}${field('Время','f_time','','time')}${field('Картинка URL','f_image','')}<div class="field"><label>Приоритет</label><select id="f_priority"><option value="A">Срочно и важно</option><option value="B" selected>Важно, не срочно</option><option value="C">Срочно, не важно</option><option value="D">Позже / убрать</option></select></div></div>${modalButtons('saveTask')}`)}
function saveTask(){state.tasks.unshift({id:uid(),title:formVal('f_title')||'Новая задача',area:formVal('f_area')||'Личное',due:formVal('f_due')||todayKey(),time:formVal('f_time'),image:formVal('f_image'),priority:formVal('f_priority')||'B',status:'В работе'});save(true);closeModal();toast('Задача добавлена');render()}
function editTask(id){const t=state.tasks.find(x=>x.id===id);if(!t)return;openModal('Редактировать задачу',`<div class="form-grid">${field('Задача','f_title',t.title)}${field('Сфера','f_area',t.area)}${field('Дата','f_due',t.due,'date')}${field('Время','f_time',t.time,'time')}${field('Картинка URL','f_image',t.image||'')}<div class="field"><label>Приоритет / Эйзенхауэр</label><select id="f_priority"><option value="A" ${t.priority==='A'?'selected':''}>Срочно и важно</option><option value="B" ${t.priority==='B'?'selected':''}>Важно, не срочно</option><option value="C" ${t.priority==='C'?'selected':''}>Срочно, не важно</option><option value="D" ${t.priority==='D'?'selected':''}>Позже / убрать</option></select></div></div>${t.image?`<img src="${esc(t.image)}" style="max-width:100%;border-radius:18px;margin:12px 0;border:1px solid #eaf0f8">`:''}<div class="actions"><button class="btn" data-action="saveEditedTask" data-id="${id}">Сохранить</button><button class="btn red" data-action="deleteTask" data-id="${id}">Удалить</button></div>`)}
function saveEditedTask(id){const t=state.tasks.find(x=>x.id===id);if(t){t.title=formVal('f_title');t.area=formVal('f_area');t.due=formVal('f_due');t.time=formVal('f_time');t.image=formVal('f_image');t.priority=formVal('f_priority')}save(true);closeModal();render()}
function eisenhowerMatrix(){const cells=[['A','Важно / Срочно','urgent important','red'],['B','Важно / Не срочно','important','green'],['C','Не важно / Срочно','urgent','amber'],['D','Не важно / Не срочно','','']];return `<div class="matrix">${cells.map(([p,t,cl,color])=>{const list=openTasks().filter(x=>(x.priority||'B')===p);return `<div class="matrix-cell ${cl}"><div class="stat-row"><h3>${t}</h3><span class="pill ${color}">${list.length}</span></div>${list.slice(0,5).map(x=>`<button class="matrix-task" data-action="editTask" data-id="${x.id}"><b>${esc(x.title)}</b><small>${esc(x.due||'')} ${esc(x.time||'')}</small></button>`).join('')||'<p class="muted small">Пусто</p>'}<button class="mini-btn blue" data-action="addTask">Добавить</button></div>`}).join('')}</div>`}

function lifeFolders(){return [{id:'people',title:'Люди',ico:'◌'},{id:'notes',title:'Заметки',ico:'✎'},{id:'planning',title:'Планирование',ico:'☷'},{id:'habits',title:'Привычки',ico:'◷'},{id:'books',title:'Книги',ico:'◧'},{id:'ideas',title:'Идеи',ico:'✦'},{id:'personal',title:'Личная жизнь',ico:'♡'},{id:'documents',title:'Документы',ico:'▣'},{id:'trips',title:'Путешествия',ico:'✈'}]}
function lifeFolderCount(id){return ({people:state.people.length,notes:state.notes.length,planning:openTasks().length,habits:state.habits.length,books:state.books.length,ideas:state.ideas.length,personal:state.media.length,documents:state.files.length,trips:state.trips.length}[id]||0)}
function folderButton(id,title,ico,count){const label=id==='planning'?'открытых задач':id==='documents'?'файлов':'записей';return `<button class="folder-card ${state.settings.lifeFolder===id?'active':''}" data-life-folder="${id}"><div class="folder-ico">${ico}</div><strong>${title}</strong><small>${count} ${label}</small><span class="pill blue">Открыть</span></button>`}
function lifeOverview(){return `<section class="card"><div class="card-head"><h3>Папки жизни</h3><span class="pill blue">без дублей</span></div><p class="muted">Папки выше — основной вход в личные разделы. Здесь нет повторного списка, чтобы экран не перегружался.</p><div class="grid cols-3" style="margin-top:12px"><div class="mini-box"><strong>Сегодня</strong><p class="small muted">${openTasks().filter(t=>t.due===todayKey()).length} задач · ${upcomingEvents().filter(e=>e.date===todayKey()).length} событий</p></div><div class="mini-box"><strong>Память</strong><p class="small muted">${state.people.length} людей · ${state.books.length} книг · ${state.notes.length} заметок</p></div><div class="mini-box"><strong>Ритм</strong><p class="small muted">${state.habits.length} привычек · ${state.trips.length} поездок</p></div></div></section>`}
function spheresPage(){const folder=state.settings.lifeFolder||'overview';return layout('Сферы жизни','Папки без дублей: люди, заметки, планирование, привычки, книги, идеи, документы и путешествия.',`<section class="folder-list">${lifeFolders().map(f=>folderButton(f.id,f.title,f.ico,lifeFolderCount(f.id))).join('')}</section><section style="margin-top:18px">${folder==='overview'?lifeOverview():folder==='people'?peopleFolder():folder==='notes'?notesFolder():folder==='planning'?planningPageInner():folder==='habits'?habitsFolder():folder==='books'?booksFolder():folder==='ideas'?ideasFolder():folder==='documents'?documentsFolder():folder==='trips'?tripsPanel():personalFolder()}</section>`)}
function documentsFolder(){return `<section class="card"><div class="card-head"><h3>Документы</h3><button class="btn secondary" data-action="addFileNote">Добавить запись</button></div>${state.files.length?state.files.map(f=>`<div class="list-row"><span class="pill blue">файл</span><div><div class="row-title">${esc(f.title||f.name||'Документ')}</div><div class="row-sub">${esc(f.note||f.url||'')}</div></div></div>`).join(''):empty('Документы пока не добавлены')}</section>`}
function addFileNote(){openModal('Документ / ссылка',`<div class="form-grid">${field('Название','f_title')}${field('Ссылка или путь','f_url')}${area('Комментарий','f_note')}</div>${modalButtons('saveFileNote')}`)}
function saveFileNote(){state.files.unshift({id:uid(),title:formVal('f_title')||'Документ',url:formVal('f_url'),note:formVal('f_note'),createdAt:todayKey()});save(true);closeModal();render()}

function financePage(){const s=summary(); const diff=s.actual-s.calcBalance; return layout('Финансы','Фактический остаток — главный. Все непонятные цифры раскрываются в деталях.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Фактический остаток</h3><div class="value">${hasActualBalance()?money(s.actual):'Не внесён'}</div><p class="muted small">Основной показатель. Вносится вручную после импорта банка.</p><button class="btn secondary" data-action="editActualBalance">Изменить</button></article><article class="card"><h3>Прогноз до зарплаты</h3><div class="value sm ${s.toNext<0?'red':'blue'}">${money(s.toNext)}</div><p class="muted small">до ${fmtDate(s.nextSalary.date)} · ${s.nextSalary.type}</p></article><article class="card"><h3>Расхождение</h3><div class="value sm ${Math.abs(diff)>0?'amber':'green'}">${money(diff)}</div><p class="muted small">факт минус расчёт</p>${discrepancyDetails()}</article>${safetyFundCard()}</section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Долги</h3><button class="btn secondary" data-action="addDebt">Добавить долг</button></div><div class="note-list">${activeDebts().map(rowDebt).join('')||empty('Активных долгов нет')}</div></article><article class="card"><div class="card-head"><h3>Категории доходов/расходов</h3><button class="btn secondary" data-action="addCategory">Категория</button></div><div class="note-list">${state.categories.map(c=>`<div class="list-row"><span class="pill ${c.type==='income'?'green':'blue'}">${c.type==='income'?'Доход':'Расход'}</span><div><div class="row-title">${esc(c.name)}</div><div class="row-sub">Лимит: ${c.limit?money(c.limit):'—'}</div></div><div class="button-row"><button class="mini-btn" data-action="editCategory" data-id="${c.id}">Ред.</button><button class="mini-btn red" data-action="deleteCategory" data-id="${c.id}">Удалить</button></div></div>`).join('')}</div></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Операции</h3><div class="button-row"><button class="btn secondary" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button></div></div><div class="op-list">${state.operations.slice(0,12).map(rowOperation).join('')}</div></article><article class="card"><div class="card-head"><h3>Финансовые принципы</h3><span class="pill blue">без перегруза</span></div>${financePrinciples()}</article></section>`)}
function debtsPage(){return layout('Долги','Суммы, сроки возврата и напоминания в одном месте.',`<section class="grid cols-3"><article class="card premium-hero-card"><h3>Активные долги</h3><div class="value sm">${money(total(activeDebts()))}</div><button class="btn" data-action="addDebt">Добавить долг</button></article><article class="card"><h3>Ближайший срок</h3>${activeDebts().sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,1).map(d=>`<div class="value sm">${esc(d.due||'—')}</div><p class="muted small">${esc(d.person)} · ${money(d.amount)}</p>`).join('')||empty('Сроков нет')}</article><article class="card"><h3>Задачи-напоминания</h3><p class="muted small">Нажимай «Напомнить», чтобы долг попал в планирование.</p></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Все долги</h3><button class="btn secondary" data-action="addDebt">Добавить</button></div><div class="note-list">${activeDebts().map(rowDebt).join('')||empty('Активных долгов нет')}</div></section>`)}
function habitsPage(){return layout('Привычки','Красивый трекер повторений и ритма.',habitsFolder())}
function tripsPage(){return layout('Путешествия','Планирование поездок и бюджета.',tripsPanel())}

function dashboard(){const s=summary();return layout('Обзор','День, деньги и фокус — на одной временной линии.',`<section class="timeline-strip"><div><b>Сегодня</b><span>${new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</span></div><div><b>Зарплата</b><span>${fmtDate(s.nextSalary.date)} · ${s.nextSalary.type}</span></div><div><b>Факт</b><span>${money(s.actual)}</span></div><div><b>План</b><span>${openTasks().filter(t=>t.due===todayKey()).length} задач сегодня</span></div></section><section class="grid cols-4"><article class="card premium-hero-card"><h3>Фактический остаток</h3><div class="value">${money(s.actual)}</div><p class="muted small">до зарплаты ${s.daysToSalary} дн.</p>${financeSpark()}</article><article class="card"><h3>Бюджет на день</h3><div class="value sm">${money(s.dailyLimit)}</div>${renderDailySpendChart().replace('day-chart','day-chart compact')}</article><article class="card"><h3>Цели SMART</h3><div class="ring" style="--p:${Math.min(100,s.progress)}"><span>${Math.min(100,s.progress)}%</span></div><p class="muted small">до плана месяца</p></article><article class="card"><h3>План на сегодня</h3><div class="task-list">${openTasks().filter(t=>t.due===todayKey()).slice(0,3).map(rowTask).join('')||empty('Нет задач')}</div><button class="link" data-go="planning">Все задачи →</button></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Планирование</h3><button class="link" data-go="planning">Открыть →</button></div>${taskScopeButtons()}<div class="task-list">${tasksByScope().slice(0,4).map(rowTask).join('')||empty('Нет задач')}</div></article><article class="card"><div class="card-head"><h3>Матрица Эйзенхауэра</h3><button class="link" data-go="planning">Редактировать →</button></div>${eisenhowerMatrix()}</article></section><section class="grid bottom" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Сферы жизни</h3><button class="link" data-go="spheres">Все →</button></div><div class="life-grid">${lifeFolders().slice(0,9).map(f=>folderButton(f.id,f.title,f.ico,lifeFolderCount(f.id))).join('')}</div></article><article class="card"><div class="card-head"><h3>Привычки</h3><button class="link" data-go="habits">Все →</button></div>${habitsFolder().replace(/<section class="grid cols-3">[\s\S]*?<\/section><section class="card" style="margin-top:18px">/,'<div>').replace(/<\/section>$/,'</div>')}</article><article class="card"><div class="card-head"><h3>Долги</h3><button class="link" data-go="debts">Все →</button></div>${activeDebts().slice(0,4).map(rowDebt).join('')||empty('Активных долгов нет')}</article></section><section class="grid cols-3" style="margin-top:18px">${quoteCard()}<article class="card"><div class="card-head"><h3>Люди</h3><button class="link" data-life-folder="people">Открыть →</button></div>${state.people.slice(0,3).map(p=>`<div class="person-top" style="margin-bottom:10px"><div class="person-avatar">${p.photo?`<img src="${esc(p.photo)}">`:esc((p.name||'?')[0])}</div><div><strong>${esc(p.name)}</strong><p class="small muted">${p.birthday?`ДР: ${esc(p.birthday)}`:'добавь дату рождения'}</p></div></div>`).join('')||empty('Добавь людей')}</article><article class="card"><div class="card-head"><h3>Книги</h3><button class="link" data-life-folder="books">Открыть →</button></div>${state.books.slice(0,2).map(b=>`<div class="mini-box"><strong>${esc(b.title)}</strong><p class="small muted">${esc((b.quotes||[])[0]||b.insight||'Цитата, которая запомнилась')}</p></div>`).join('')||empty('Добавь книгу')}</article></section>`)}

function renderNav(){$('#sidebarNav').innerHTML=`<div class="nav-label">Навигация</div>`+navItems.map(([id,ico,label])=>`<button class="nav-btn ${page===id?'active':''}" data-go="${id}"><span class="nav-ico">${ico}</span>${label}</button>`).join('');$('#bottomNav').innerHTML=mobileItems.map(([id,ico,label])=>`<button class="${page===id?'active':''}" data-go="${id}"><i>${ico}</i>${label}</button>`).join('')}
function render(){renderNav();const map={dashboard,finance:financePage,budget:budgetPage,goals:goalsPage,planning:planningPage,spheres:spheresPage,habits:habitsPage,debts:debtsPage,trips:tripsPage,import:importPage,diagnostics:diagnosticsPage};$('#view').innerHTML=(map[page]||dashboard)()}

Object.assign(windowActions,{editSafetyFund,saveSafetyFund,saveDailyReflection,addTask,saveTask,editTask,saveEditedTask,addFileNote,saveFileNote,debtsPage,habitsPage,tripsPage});

try{state=normalizeState(state);save();render()}catch(e){console.error(e)}


/* ===== TIMELINE FOCUS UI2 — final visual + logic patch ===== */
try{ localStorage.setItem('secondBrainOS.currentBuild','timeline-focus-ui2-20260630'); }catch(e){}

try{
  const desiredNav=[
    ['dashboard','⌂','Обзор'],
    ['finance','◔','Финансы'],
    ['debts','▣','Долги'],
    ['budget','◉','Бюджет'],
    ['goals','◎','Цели SMART'],
    ['planning','☷','Планирование'],
    ['spheres','✣','Сферы жизни'],
    ['habits','◷','Привычки'],
    ['trips','✈','Путешествия'],
    ['import','⇣','Импорт'],
    ['diagnostics','⚙','Диагностика']
  ];
  navItems.splice(0,navItems.length,...desiredNav);
}catch(e){}

function safeActualBalance(){
  const rawA=String(state.settings.currentBalance??'').trim();
  const rawB=String(state.settings.importActualBalance??'').trim();
  if(rawB!=='' || rawA!=='') return num(rawB!==''?rawB:rawA);
  return null;
}
function hasActualBalance(){return safeActualBalance()!==null;}
function activeDebts(){
  const explicit=Array.isArray(state.debts)?state.debts:[];
  const normalized=explicit.filter(d=>String(d.status||'Активен')!=='Закрыт').map(d=>({direction:d.direction||'owe',...d}));
  const debtOps=(state.operations||[]).filter(o=>/долг|за[её]м|займ|вернуть|одолж|кредит|ипотек/i.test(`${o.category||''} ${o.note||''}`)).map(o=>({id:'op_'+o.id,direction:o.type==='income'?'owed_to_me':'owe',person:o.note||o.category||'Долг из операции',amount:num(o.amount),due:o.date,status:'Активен',note:'Определено по операции'}));
  const map=new Map();
  [...normalized,...debtOps].forEach(d=>{const k=[d.person,d.amount,d.due,d.direction].join('|'); if(!map.has(k))map.set(k,d)});
  return Array.from(map.values());
}
function activeOwe(){return activeDebts().filter(d=>String(d.direction||'owe')==='owe')}
function activeOwed(){return activeDebts().filter(d=>String(d.direction||'owe')==='owed_to_me')}
function summary(){
  const income=total(monthOps('income'));
  const expenses=total(monthOps('expense'));
  const cycleIncome=total(cycleOps('income'));
  const cycleExpenses=total(cycleOps('expense'));
  const planned=total(plannedInMonth());
  const debtDue=total(activeOwe().filter(d=>String(d.due||'').startsWith(state.settings.currentMonth)));
  const calcBalance=income-expenses;
  const actualFromUser=safeActualBalance();
  const actual=actualFromUser===null?calcBalance:actualFromUser;
  const plan=num(state.settings.monthlyPlan)||Math.max(income,1);
  const next=nextSalaryDate();
  const days=Math.max(1,Math.ceil((new Date(next.date)-new Date(todayKey()))/86400000));
  const obligations=dueUntil(next.date);
  const availableUntilSalary=actual-obligations;
  const dayByFact=Math.floor(Math.max(0,availableUntilSalary)/days);
  const daysToCycleEnd=Math.max(1,Math.ceil((new Date(currentCycle().end)-new Date(todayKey()))/86400000));
  const budgetLeft=Math.max(0,plan-expenses-planned-debtDue);
  const dayByBudget=Math.floor(budgetLeft/daysToCycleEnd);
  const dailyLimit=actualFromUser===null?dayByBudget:dayByFact;
  const dailyLimitReason=actualFromUser===null?'расчёт по плану месяца, пока фактический остаток не внесён':(dayByFact===0?'свободного остатка до зарплаты нет: проверь долги, плановые покупки или фактический остаток':'расчёт от фактического остатка до ближайшей зарплаты');
  const topCats=Object.entries(monthOps('expense').reduce((m,o)=>{m[o.category||'Без категории']=(m[o.category||'Без категории']||0)+num(o.amount);return m},{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
  return {income,expenses,cycleIncome,cycleExpenses,planned,debtDue,calcBalance,actual,plan,progress:clamp(Math.round(income/plan*100)),nextSalary:next,daysToSalary:days,obligations,toNext:availableUntilSalary,dailyLimit,dailyLimitReason,dayByFact,dayByBudget,topCats,budgetLeft,daysToCycleEnd};
}
function dueUntil(date){
  const p=state.plannedPurchases.filter(x=>x.includeInBudget!==false&&(!x.due||x.due<=date)&&(!x.month||x.month<=monthKey(new Date(date)))).reduce((a,b)=>a+num(b.amount),0);
  const d=activeOwe().filter(x=>x.due&&x.due<=date).reduce((a,b)=>a+num(b.amount),0);
  return p+d;
}
function debtAmountTotal(list){return list.reduce((s,d)=>s+num(d.amount),0)}

function rowTask(t){
  const img=t.image?`<img class="task-thumb" src="${esc(t.image)}" alt="">`:'';
  const google=`<button class="mini-btn blue compact-action" data-action="googleTask" data-id="${t.id}">Google</button>`;
  return `<div class="task-card-row">
    <button class="check ${(t.status==='Готово')?'done':''}" data-action="toggleTask" data-id="${t.id}" title="Готово"></button>
    ${img}
    <button class="task-main" data-action="editTask" data-id="${t.id}">
      <span class="row-title">${esc(t.title)}</span>
      <span class="row-sub">${esc(t.area||'Личное')} · ${esc(t.due||'')} ${esc(t.time||'')}</span>
    </button>
    <div class="task-actions">${taskPill(t)}${google}</div>
  </div>`;
}
function rowDebt(d){
  const overdue=d.due&&d.due<todayKey();
  const incoming=String(d.direction||'owe')==='owed_to_me';
  return `<div class="debt-row ${overdue?'danger':''}">
    <div class="debt-icon ${incoming?'green':'red'}">${incoming?'↙':'↗'}</div>
    <div class="debt-main"><div class="row-title">${esc(d.person||'Долг')} · ${money(d.amount)}</div><div class="row-sub">${incoming?'мне должны':'я должен'} · срок ${esc(d.due||'—')} · ${esc(d.note||'')}</div></div>
    <div class="debt-actions"><button class="mini-btn blue" data-action="debtTask" data-id="${d.id}">Напомнить</button><button class="mini-btn" data-action="editDebt" data-id="${d.id}">Ред.</button><button class="mini-btn green" data-action="closeDebt" data-id="${d.id}">Закрыть</button></div>
  </div>`;
}
function addDebt(direction='owe'){
  openModal(direction==='owed_to_me'?'Мне должны':'Долг',`<div class="form-grid"><div class="field"><label>Тип</label><select id="f_direction"><option value="owe" ${direction==='owe'?'selected':''}>Я должен</option><option value="owed_to_me" ${direction==='owed_to_me'?'selected':''}>Мне должны</option></select></div>${field('Кто / кому','f_person')}${field('Сумма','f_amount','','number')}${field('Дата возврата','f_due',todayKey(),'date')}<div class="field"><label>Статус</label><select id="f_status"><option>Активен</option><option>Ожидаю</option><option>Закрыт</option></select></div>${area('Комментарий','f_note')}</div>${modalButtons('saveDebt')}`)
}
function saveDebt(){state.debts.unshift({id:uid(),direction:formVal('f_direction')||'owe',person:formVal('f_person')||'Долг',amount:num(formVal('f_amount')),due:formVal('f_due'),status:formVal('f_status')||'Активен',note:formVal('f_note')});save(true);closeModal();toast('Долг добавлен');render()}
function editDebt(id){const d=state.debts.find(x=>x.id===id);if(!d)return;openModal('Редактировать долг',`<div class="form-grid"><div class="field"><label>Тип</label><select id="f_direction"><option value="owe" ${(d.direction||'owe')==='owe'?'selected':''}>Я должен</option><option value="owed_to_me" ${d.direction==='owed_to_me'?'selected':''}>Мне должны</option></select></div>${field('Кто / кому','f_person',d.person)}${field('Сумма','f_amount',d.amount,'number')}${field('Дата возврата','f_due',d.due,'date')}<div class="field"><label>Статус</label><select id="f_status"><option ${d.status==='Активен'?'selected':''}>Активен</option><option ${d.status==='Ожидаю'?'selected':''}>Ожидаю</option><option ${d.status==='Закрыт'?'selected':''}>Закрыт</option></select></div>${area('Комментарий','f_note',d.note)}</div><div class="actions"><button class="btn" data-action="saveEditedDebt" data-id="${id}">Сохранить</button><button class="btn secondary" data-action="debtTask" data-id="${id}">Создать напоминание</button><button class="mini-btn red" data-action="deleteDebt" data-id="${id}">Удалить</button></div>`)}
function saveEditedDebt(id){const d=state.debts.find(x=>x.id===id);if(d){d.direction=formVal('f_direction');d.person=formVal('f_person');d.amount=num(formVal('f_amount'));d.due=formVal('f_due');d.status=formVal('f_status');d.note=formVal('f_note')}save(true);closeModal();render()}
function deleteDebt(id){state.debts=state.debts.filter(x=>x.id!==id);save(true);closeModal();render()}

function addGoal(){openModal('Цель SMART',`<div class="form-grid">${field('Название','f_title')}${field('Сфера','f_area','Личное')}${field('Картинка / URL','f_image')}${field('Цель, ₽/число','f_target')}${field('Сейчас','f_current')}${field('Срок','f_deadline','','date')}${field('Шаг недели','f_week52')}${area('S — конкретика','f_specific')}${area('M — измерение','f_measurable')}${area('A — достижимость','f_achievable')}${area('R — зачем это важно','f_relevant')}${area('T — срок','f_timebound')}</div>${modalButtons('saveGoal')}`)}
function saveGoal(){state.goals.unshift({id:uid(),title:formVal('f_title')||'Цель',area:formVal('f_area'),image:formVal('f_image'),targetValue:num(formVal('f_target')),currentValue:num(formVal('f_current')),deadline:formVal('f_deadline'),specific:formVal('f_specific'),measurable:formVal('f_measurable'),achievable:formVal('f_achievable'),relevant:formVal('f_relevant'),timebound:formVal('f_timebound'),week52:formVal('f_week52'),nextAction:formVal('f_week52'),status:'Активна'});save(true);closeModal();render()}
function editGoal(id){const g=state.goals.find(x=>x.id===id);if(!g)return;openModal('Редактировать цель SMART',`<div class="form-grid">${field('Название','f_title',g.title)}${field('Сфера','f_area',g.area)}${field('Картинка / URL','f_image',g.image||'')}${field('Цель, ₽/число','f_target',g.targetValue)}${field('Сейчас','f_current',g.currentValue)}${field('Срок','f_deadline',g.deadline,'date')}${field('Шаг недели','f_week52',g.week52||g.nextAction)}${area('S — конкретика','f_specific',g.specific)}${area('M — измерение','f_measurable',g.measurable)}${area('A — достижимость','f_achievable',g.achievable)}${area('R — зачем это важно','f_relevant',g.relevant)}${area('T — срок','f_timebound',g.timebound)}</div><div class="actions"><button class="btn" data-action="saveEditedGoal" data-id="${id}">Сохранить</button></div>`)}
function saveEditedGoal(id){const g=state.goals.find(x=>x.id===id);if(g){g.title=formVal('f_title');g.area=formVal('f_area');g.image=formVal('f_image');g.targetValue=num(formVal('f_target'));g.currentValue=num(formVal('f_current'));g.deadline=formVal('f_deadline');g.week52=formVal('f_week52');g.nextAction=g.week52;g.specific=formVal('f_specific');g.measurable=formVal('f_measurable');g.achievable=formVal('f_achievable');g.relevant=formVal('f_relevant');g.timebound=formVal('f_timebound')}save(true);closeModal();render()}
function goalCard(g){return `<article class="card goal-card-ui">${g.image?`<img class="goal-image" src="${esc(g.image)}" alt="">`:''}<div class="card-head"><h3>${esc(g.title)}</h3><span class="pill blue">${goalProgress(g)}%</span></div>${progressBar(goalProgress(g))}<div class="grid cols-2" style="margin-top:12px"><div class="mini-box"><b>S</b><p class="small muted">${esc(g.specific||'что именно?')}</p></div><div class="mini-box"><b>M</b><p class="small muted">${esc(g.measurable||money(g.targetValue))}</p></div><div class="mini-box"><b>A</b><p class="small muted">${esc(g.achievable||'реалистично')}</p></div><div class="mini-box"><b>R/T</b><p class="small muted">${esc(g.relevant||'важно')} · ${esc(g.timebound||g.deadline||'срок')}</p></div></div><div class="alert" style="margin-top:12px">Шаг недели: ${esc(g.week52||g.nextAction||'назначить следующий шаг')}</div><div class="button-row"><button class="mini-btn" data-action="editGoal" data-id="${g.id}">Редактировать</button><button class="mini-btn red" data-action="deleteGoal" data-id="${g.id}">Удалить</button></div></article>`}

function monthDays(d=new Date()){const y=d.getFullYear(),m=d.getMonth();return Array.from({length:new Date(y,m+1,0).getDate()},(_,i)=>iso(new Date(y,m,i+1)))}
function habitsFolder(){
  const days=monthDays(new Date()); const avg=state.habits.length?Math.round(state.habits.reduce((a,h)=>a+habitMonthPct(h,days),0)/state.habits.length):0;
  return `<section class="habit-hero-grid"><article class="card premium-hero-card habit-hero"><h3>Ритм привычек</h3><div class="value">${avg}%</div><p class="muted small">текущий месяц · ${new Date().toLocaleDateString('ru-RU',{month:'long'})}</p>${progressBar(avg)}</article><article class="card habit-calendar-card"><div class="card-head"><h3>Календарь месяца</h3><button class="btn secondary" data-action="addHabit">Добавить</button></div>${habitMonthLegend(days)}</article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Привычки</h3><span class="pill blue">яркий трекер</span></div><div class="habit-cards-grid">${state.habits.map(h=>habitCard(h,days)).join('')||empty('Нет привычек')}</div></section>`
}
function habitMonthPct(h,days){return Math.round(days.filter(d=>h.marks&&h.marks[d]).length/Math.max(1,days.length)*100)}
function habitMonthLegend(days){return `<div class="habit-month-head">${days.map(d=>`<span class="${d===todayKey()?'today':''}">${new Date(d).getDate()}</span>`).join('')}</div>`}
function habitCard(h,days=monthDays(new Date())){const p=habitMonthPct(h,days);return `<div class="habit-card"><div class="habit-title"><div class="habit-badge">${habitIcon(h)}</div><div><strong>${esc(h.name)}</strong><p class="small muted">${esc(h.area||'Личное')} · ${esc(h.target||'ежедневно')}</p></div><span class="pill blue">${p}%</span></div><div class="habit-month-grid">${days.map(d=>`<button class="habit-day ${h.marks&&h.marks[d]?'on':''} ${d===todayKey()?'today':''}" data-action="toggleHabitDate" data-id="${h.id}" data-date="${d}" title="${d}">${new Date(d).getDate()}</button>`).join('')}</div><div class="button-row"><button class="mini-btn" data-action="editHabit" data-id="${h.id}">Ред.</button><button class="mini-btn red" data-action="deleteHabit" data-id="${h.id}">Удалить</button></div></div>`}
function habitIcon(h){const s=(h.name+' '+(h.area||'')).toLowerCase(); if(/трен|спорт|зал/.test(s))return '🏃'; if(/чтен|книг/.test(s))return '📘'; if(/вода/.test(s))return '💧'; if(/сон|подъ/.test(s))return '☀️'; if(/медит/.test(s))return '🧘'; return '✓'}

function dailyLimitBlock(s){
  if(s.dailyLimit>0) return `<div class="value sm">${money(s.dailyLimit)}</div><p class="muted small">${esc(s.dailyLimitReason)}</p>`;
  return `<div class="value sm amber">0 ₽</div><p class="muted small">${esc(s.dailyLimitReason)}</p><div class="alert" style="margin-top:10px">Чтобы появилась сумма: проверь фактический остаток, долги до зарплаты и плановые покупки.</div>`;
}
function budgetPage(){const s=summary(), items=budgetStats(), used=items.reduce((a,b)=>a+b.spent,0), limit=items.reduce((a,b)=>a+b.limit,0); const top=dailySpendSeries().sort((a,b)=>b.amount-a.amount).filter(x=>x.amount>0).slice(0,5); return layout('Бюджет','Расчёт по зарплатному циклу от 10 числа: лимиты, дни и плановые покупки.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Цикл бюджета</h3><div class="value sm">10 → 9</div><p class="muted small">расчёт от основной зарплаты</p></article><article class="card"><h3>Можно тратить в день</h3>${dailyLimitBlock(s)}</article><article class="card"><h3>Плановые покупки</h3><div class="value sm">${money(total(plannedInMonth()))}</div><p class="muted small">включены в бюджет</p></article><article class="card"><h3>Лимиты</h3><div class="value sm">${limit?Math.round(used/limit*100):0}%</div>${progressBar(limit?used/limit*100:0,used>limit?'red':'')}</article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>График трат по дням</h3><span class="pill blue">пики выделены</span></div>${renderDailySpendChart()}${top.length?`<div class="drawer" style="margin-top:12px"><b>Самые дорогие дни</b>${top.map(x=>`<div class="stat-row"><span>${x.day} число</span><b>${money(x.amount)}</b></div>`).join('')}</div>`:''}</article><article class="card"><div class="card-head"><h3>Лимиты по категориям</h3><button class="btn secondary" data-action="addCategory">Категория</button></div>${items.map(budgetRow).join('')||empty('Нет категорий')}</article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Плановые покупки</h3><button class="btn secondary" data-action="addPurchase">Добавить покупку</button></div><div class="note-list">${state.plannedPurchases.map(rowPurchase).join('')||empty('Покупок нет')}</div></section>`)}

function financePage(){const s=summary(); const diff=s.actual-s.calcBalance; return layout('Финансы','Фактический остаток — главный. Долги подняты рядом с финансами.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Фактический остаток</h3><div class="value">${hasActualBalance()?money(s.actual):'Не внесён'}</div><p class="muted small">Основной показатель. Вносится вручную после импорта банка.</p><button class="btn secondary" data-action="editActualBalance">Изменить</button></article><article class="card"><h3>Прогноз до зарплаты</h3><div class="value sm ${s.toNext<0?'red':'blue'}">${money(s.toNext)}</div><p class="muted small">до ${fmtDate(s.nextSalary.date)} · ${s.nextSalary.type}</p></article><article class="card"><h3>Должен я</h3><div class="value sm red">${money(debtAmountTotal(activeOwe()))}</div><button class="link" data-go="debts">Открыть долги →</button></article><article class="card"><h3>Мне должны</h3><div class="value sm green">${money(debtAmountTotal(activeOwed()))}</div><button class="link" data-go="debts">Открыть →</button></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Расхождение</h3><button class="mini-btn" data-action="editActualBalance">Изменить факт</button></div><div class="value sm ${Math.abs(diff)>0?'amber':'green'}">${money(diff)}</div>${discrepancyDetails()}</article>${safetyFundCard()}</section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Долги</h3><button class="btn secondary" data-action="addDebt">Добавить долг</button></div><div class="note-list">${activeDebts().map(rowDebt).join('')||empty('Активных долгов нет')}</div></article><article class="card"><div class="card-head"><h3>Категории доходов/расходов</h3><button class="btn secondary" data-action="addCategory">Категория</button></div><div class="note-list">${state.categories.map(c=>`<div class="list-row category-row"><span class="pill ${c.type==='income'?'green':'blue'}">${c.type==='income'?'Доход':'Расход'}</span><div><div class="row-title">${esc(c.name)}</div><div class="row-sub">Лимит: ${c.limit?money(c.limit):'—'}</div></div><div class="button-row"><button class="mini-btn" data-action="editCategory" data-id="${c.id}">Ред.</button><button class="mini-btn red" data-action="deleteCategory" data-id="${c.id}">Удалить</button></div></div>`).join('')}</div></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Операции</h3><div class="button-row"><button class="btn secondary" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button></div></div><div class="op-list">${state.operations.slice(0,12).map(rowOperation).join('')}</div></article><article class="card"><div class="card-head"><h3>Финансовые принципы</h3><span class="pill blue">без перегруза</span></div>${financePrinciples()}</article></section>`)}
function debtsPage(){return layout('Долги','Суммы, сроки возврата и напоминания. Раздел поднят рядом с финансами.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Я должен</h3><div class="value sm red">${money(debtAmountTotal(activeOwe()))}</div><button class="btn" data-action="addDebt">Добавить</button></article><article class="card"><h3>Мне должны</h3><div class="value sm green">${money(debtAmountTotal(activeOwed()))}</div><button class="btn secondary" data-action="addDebt" data-id="owed_to_me">Добавить</button></article><article class="card"><h3>Ближайший срок</h3>${activeDebts().sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,1).map(d=>`<div class="value sm">${esc(d.due||'—')}</div><p class="muted small">${esc(d.person)} · ${money(d.amount)}</p>`).join('')||empty('Сроков нет')}</article><article class="card"><h3>Напоминания</h3><p class="muted small">Создавай задачу по каждому долгу в один клик.</p></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Кому я должен</h3><button class="btn secondary" data-action="addDebt">Добавить</button></div>${activeOwe().map(rowDebt).join('')||empty('Активных долгов нет')}</article><article class="card"><div class="card-head"><h3>Кто должен мне</h3><button class="btn secondary" data-action="addDebt" data-id="owed_to_me">Добавить</button></div>${activeOwed().map(rowDebt).join('')||empty('Тебе пока никто не должен')}</article></section>`)}
function quoteCard(){const q=dailyQuote();return `<article class="card quote-polish"><div class="card-head"><h3>Цитата дня</h3><span class="pill violet">рефлексия</span></div><div class="quote-big">“${esc(q.quote)}”</div><div class="reflection-hint"><b>Что я думаю:</b> ${esc(q.thought)}</div><textarea id="dailyReflection" placeholder="Напиши свою мысль — сохраню в заметки с тегом рефлексия"></textarea><button class="btn secondary" data-action="saveDailyReflection">Сохранить в заметки</button></article>`}

function dashboard(){const s=summary();return layout('Обзор','Timeline Focus: день, деньги и фокус — на одной чистой линии.',`<section class="timeline-strip"><div><b>Сегодня</b><span>${new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</span></div><div><b>Зарплата</b><span>${fmtDate(s.nextSalary.date)} · ${s.nextSalary.type}</span></div><div><b>Факт</b><span>${money(s.actual)}</span></div><div><b>План</b><span>${openTasks().filter(t=>t.due===todayKey()).length} задач сегодня</span></div></section><section class="grid cols-4"><article class="card premium-hero-card"><h3>Фактический остаток</h3><div class="value">${money(s.actual)}</div><p class="muted small">до зарплаты ${s.daysToSalary} дн.</p>${financeSpark()}</article><article class="card"><h3>Бюджет на день</h3>${dailyLimitBlock(s)}${renderDailySpendChart().replace('day-chart','day-chart compact')}</article><article class="card"><h3>Цели SMART</h3><div class="ring" style="--p:${Math.min(100,s.progress)}"><span>${Math.min(100,s.progress)}%</span></div><p class="muted small">до плана месяца</p></article><article class="card"><h3>План на сегодня</h3><div class="task-list">${openTasks().filter(t=>t.due===todayKey()).slice(0,3).map(rowTask).join('')||empty('Нет задач')}</div><button class="link" data-go="planning">Все задачи →</button></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Планирование</h3><button class="link" data-go="planning">Открыть →</button></div>${taskScopeButtons()}<div class="task-list">${tasksByScope().slice(0,4).map(rowTask).join('')||empty('Нет задач')}</div></article><article class="card"><div class="card-head"><h3>Матрица Эйзенхауэра</h3><button class="link" data-go="planning">Редактировать →</button></div>${eisenhowerMatrix()}</article></section><section class="grid bottom" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Сферы жизни</h3><button class="link" data-go="spheres">Все →</button></div><div class="life-grid">${lifeFolders().slice(0,9).map(f=>folderButton(f.id,f.title,f.ico,lifeFolderCount(f.id))).join('')}</div></article><article class="card"><div class="card-head"><h3>Привычки</h3><button class="link" data-go="habits">Все →</button></div>${habitsFolder().replace(/<section class="habit-hero-grid">[\s\S]*?<\/section><section class="card" style="margin-top:18px">/,'<div>').replace(/<\/section>$/,'</div>')}</article><article class="card"><div class="card-head"><h3>Долги</h3><button class="link" data-go="debts">Все →</button></div>${activeDebts().slice(0,4).map(rowDebt).join('')||empty('Активных долгов нет')}</article></section><section class="grid cols-3" style="margin-top:18px">${quoteCard()}<article class="card"><div class="card-head"><h3>Люди</h3><button class="link" data-life-folder="people">Открыть →</button></div>${state.people.slice(0,3).map(p=>`<div class="person-top" style="margin-bottom:10px"><div class="person-avatar">${p.photo?`<img src="${esc(p.photo)}">`:esc((p.name||'?')[0])}</div><div><strong>${esc(p.name)}</strong><p class="small muted">${p.birthday?`ДР: ${esc(p.birthday)}`:'добавь дату рождения'}</p></div></div>`).join('')||empty('Добавь людей')}</article><article class="card"><div class="card-head"><h3>Книги</h3><button class="link" data-life-folder="books">Открыть →</button></div>${state.books.slice(0,2).map(b=>`<div class="mini-box"><strong>${esc(b.title)}</strong><p class="small muted">${esc((b.quotes||[])[0]||b.insight||'Цитата, которая запомнилась')}</p></div>`).join('')||empty('Добавь книгу')}</article></section>`)}

Object.assign(windowActions,{addDebt,saveDebt,editDebt,saveEditedDebt,deleteDebt,addGoal,saveGoal,editGoal,saveEditedGoal,addCategory,editCategory,saveEditedCategory,deleteCategory});
try{render()}catch(e){console.error(e)}


/* ===== BUTTONS WIRE FINAL FIX — hard inline + capture + cache-safe ===== */
(function(){
  const BUILD_FINAL='buttons-wire-final-20260630-2';
  try{localStorage.setItem('secondBrainOS.currentBuild', BUILD_FINAL);}catch(e){}

  function safeToast(msg){
    try{ if(typeof toast==='function') toast(msg); else console.log('[SBOS]', msg); }catch(e){ console.log('[SBOS]', msg); }
  }
  function safeSaveRender(){
    try{ if(typeof save==='function') save(true); }catch(e){}
    try{ if(typeof render==='function') render(); }catch(e){ console.error(e); }
  }
  function getId(el){ return el && el.dataset ? (el.dataset.id || el.getAttribute('data-id') || '') : ''; }
  function getAction(el){ return el && el.dataset ? (el.dataset.action || el.getAttribute('data-action') || '') : ''; }

  window.SBOS_FORCE_ACTION = function(action, id, el){
    try{
      action = action || getAction(el);
      id = id || getId(el);
      if(!action) return false;
      // categories — direct state-level fallback, no dependency on old router
      if(action==='deleteCategory'){
        const c=(state.categories||[]).find(x=>String(x.id)===String(id));
        if(!c){ safeToast('Категория не найдена'); return true; }
        const used=(state.operations||[]).filter(o=>String(o.category||'')===String(c.name||'')).length + (state.plannedPurchases||[]).filter(p=>String(p.category||'')===String(c.name||'')).length;
        if(!confirm(`Удалить категорию «${c.name}»?${used?`\nСвязанные записи будут переведены в «Без категории».`:''}`)) return true;
        state.settings = state.settings || {};
        state.settings.deletedCategories = Array.isArray(state.settings.deletedCategories) ? state.settings.deletedCategories : [];
        const key=String(c.name||'').trim().toLowerCase()+'|'+String(c.type||'expense');
        if(!state.settings.deletedCategories.includes(key)) state.settings.deletedCategories.push(key);
        (state.operations||[]).forEach(o=>{ if(String(o.category||'')===String(c.name||'')) o.category='Без категории'; });
        (state.plannedPurchases||[]).forEach(p=>{ if(String(p.category||'')===String(c.name||'')) p.category='Без категории'; });
        state.categories=(state.categories||[]).filter(x=>String(x.id)!==String(id));
        safeSaveRender();
        safeToast('Категория удалена');
        return true;
      }
      if(action==='editCategory'){
        const c=(state.categories||[]).find(x=>String(x.id)===String(id));
        if(!c){ safeToast('Категория не найдена'); return true; }
        if(typeof openModal==='function'){
          openModal('Редактировать категорию',`<div class="form-grid">${field('Название','f_name',c.name)}<div class="field"><label>Тип</label><select id="f_type"><option value="expense" ${c.type==='expense'?'selected':''}>Расход</option><option value="income" ${c.type==='income'?'selected':''}>Доход</option></select></div>${field('Лимит в месяц','f_limit',c.limit)}</div><div class="actions"><button type="button" class="btn" data-action="saveEditedCategory" data-id="${id}" onclick="return window.SBOS_FORCE_ACTION('saveEditedCategory','${id}',this),false">Сохранить</button></div>`);
          return true;
        }
      }
      if(action==='saveEditedCategory'){
        const c=(state.categories||[]).find(x=>String(x.id)===String(id));
        if(!c){ safeToast('Категория не найдена'); return true; }
        const old=c.name;
        const newName=(document.getElementById('f_name')||{}).value || c.name;
        c.name=newName;
        c.type=(document.getElementById('f_type')||{}).value || c.type || 'expense';
        c.limit=num((document.getElementById('f_limit')||{}).value || 0);
        (state.operations||[]).forEach(o=>{ if(String(o.category||'')===String(old||'')) o.category=newName; });
        (state.plannedPurchases||[]).forEach(p=>{ if(String(p.category||'')===String(old||'')) p.category=newName; });
        try{ closeModal(); }catch(e){}
        safeSaveRender();
        safeToast('Категория сохранена');
        return true;
      }

      // debts — direct state-level fallback
      if(action==='closeDebt'){
        const d=(state.debts||[]).find(x=>String(x.id)===String(id));
        if(!d){ safeToast('Долг не найден'); return true; }
        d.status='Закрыт';
        safeSaveRender();
        safeToast('Долг закрыт');
        return true;
      }
      if(action==='debtTask'){
        const d=(state.debts||[]).find(x=>String(x.id)===String(id));
        if(!d){ safeToast('Долг не найден'); return true; }
        state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
        state.tasks.unshift({id:uid(),title:`Напоминание по долгу: ${d.person} — ${money(d.amount)}`,area:'Финансы',due:d.due||todayKey(),time:'10:00',priority:'A',status:'В работе'});
        d.reminder=true;
        safeSaveRender();
        safeToast('Напоминание создано в задачах');
        return true;
      }
      if(action==='editDebt'){
        if(typeof editDebt==='function'){ editDebt(id); return true; }
      }
      if(action==='deleteDebt'){
        if(!confirm('Удалить долг?')) return true;
        state.debts=(state.debts||[]).filter(x=>String(x.id)!==String(id));
        safeSaveRender();
        safeToast('Долг удалён');
        return true;
      }

      // generic fallback to app function/router
      const fn = (typeof windowActions!=='undefined' && windowActions[action]) || window[action];
      if(typeof fn==='function'){
        if(action==='setTaskScope') fn.call(el, el?.dataset?.scope || id || 'today');
        else if(action==='toggleHabitDate') fn.call(el, id, el?.dataset?.date);
        else if(action==='filterDayOps') fn.call(el, el?.dataset?.day || id);
        else fn.call(el, id);
        return true;
      }
      safeToast('Кнопка не подключена: '+action);
      return true;
    }catch(err){
      console.error('[SBOS_FORCE_ACTION]', action, id, err);
      safeToast('Ошибка кнопки: '+(err&&err.message?err.message:action));
      return true;
    }
  };

  function wireButtons(){
    try{
      document.querySelectorAll('[data-action]').forEach(btn=>{
        btn.setAttribute('type','button');
        if(btn.__sbosWireFinal) return;
        btn.__sbosWireFinal=true;
        btn.addEventListener('click', function(ev){
          ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
          return window.SBOS_FORCE_ACTION(getAction(this), getId(this), this), false;
        }, true);
        const a=getAction(btn), id=getId(btn);
        if(['deleteCategory','editCategory','saveEditedCategory','closeDebt','debtTask','editDebt','deleteDebt'].includes(a)){
          btn.setAttribute('onclick', `return window.SBOS_FORCE_ACTION('${a.replace(/'/g,'')}', '${String(id).replace(/'/g,'\\\'')}', this), false`);
        }
      });
    }catch(e){console.error('[SBOS wireButtons]',e)}
  }

  // Patch render so every newly rendered card receives real button listeners.
  try{
    const oldRender=window.render || render;
    window.render=function(){
      const out=oldRender.apply(this,arguments);
      setTimeout(wireButtons,0);
      setTimeout(wireButtons,80);
      return out;
    };
    if(typeof render==='function') render=window.render;
  }catch(e){}
  document.addEventListener('click', function(ev){
    const btn=ev.target && ev.target.closest ? ev.target.closest('[data-action]') : null;
    if(!btn) return;
    const a=getAction(btn);
    if(['deleteCategory','editCategory','saveEditedCategory','closeDebt','debtTask','editDebt','deleteDebt'].includes(a)){
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      window.SBOS_FORCE_ACTION(a,getId(btn),btn);
    }
  }, true);
  setTimeout(wireButtons,0);
  setInterval(wireButtons,1200);
})();

  

/* ===== DEBT + CATEGORY REAL FIX — operation-derived debts + persistent category delete ===== */
(function(){
  const BUILD='category-delete-final-fix-20260630-1';
  try{localStorage.setItem('secondBrainOS.currentBuild', BUILD);}catch(e){}

  function sbosMsg(msg){ try{toast(msg)}catch(e){ console.log('[SBOS]', msg); } }
  function ensureArrays(){
    state.settings = state.settings || {};
    state.debts = Array.isArray(state.debts) ? state.debts : [];
    state.operations = Array.isArray(state.operations) ? state.operations : [];
    state.categories = Array.isArray(state.categories) ? state.categories : [];
    state.plannedPurchases = Array.isArray(state.plannedPurchases) ? state.plannedPurchases : [];
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.settings.deletedCategories = Array.isArray(state.settings.deletedCategories) ? state.settings.deletedCategories : [];
    state.settings.hiddenDebtIds = Array.isArray(state.settings.hiddenDebtIds) ? state.settings.hiddenDebtIds : [];
    state.debts.forEach(d=>{ if(!d.id) d.id=uid(); if(!d.status) d.status='Активен'; if(!d.direction) d.direction='owe'; });
    state.categories.forEach(c=>{ if(!c.id) c.id=uid(); if(!c.type) c.type='expense'; });
  }
  function catKey(name,type){ return String(name||'').trim().toLowerCase()+'|'+String(type||'expense'); }
  function isDeletedCategory(name,type){ ensureArrays(); return state.settings.deletedCategories.includes(catKey(name,type)); }
  function removeDeletedCategoryMarker(name,type){ ensureArrays(); const k=catKey(name,type); state.settings.deletedCategories=state.settings.deletedCategories.filter(x=>x!==k); }
  function hideDebtId(id){ ensureArrays(); id=String(id||''); if(id && !state.settings.hiddenDebtIds.includes(id)) state.settings.hiddenDebtIds.push(id); }
  function debtHidden(id){ ensureArrays(); return state.settings.hiddenDebtIds.includes(String(id||'')); }
  function derivedDebtFromOperation(o){
    const text=`${o.category||''} ${o.note||''}`;
    if(!/долг|за[её]м|займ|вернуть|вернул|вернули|одолж|кредит|ипотек/i.test(text)) return null;
    const incoming = String(o.type||'expense')==='income';
    return {
      id:'op_'+(o.id||uid()),
      source:'operation',
      operationId:o.id,
      direction: incoming ? 'owed_to_me' : 'owe',
      person: o.note || o.category || 'Долг из операции',
      amount: num(o.amount),
      due: o.date || todayKey(),
      status:'Активен',
      note:'Определено по операции'
    };
  }
  function findDebtAny(id){
    ensureArrays(); id=String(id||'');
    let d=state.debts.find(x=>String(x.id)===id);
    if(d) return {debt:d, explicit:true};
    for(const o of state.operations){
      const dd=derivedDebtFromOperation(o);
      if(dd && String(dd.id)===id) return {debt:dd, explicit:false, operation:o};
    }
    return {debt:null, explicit:false};
  }

  // Prevent removed categories from reappearing after save/normalize from operations or old budgets.
  try{
    const __oldDeriveCategories = deriveCategories;
    deriveCategories = function(s){
      const arr = __oldDeriveCategories(s)||[];
      const deleted = new Set(((state&&state.settings&&state.settings.deletedCategories)||[]).map(String));
      return arr.filter(c=>!deleted.has(catKey(c.name,c.type)));
    };
  }catch(e){}
  try{
    const __oldDedupeCategories = dedupeCategories;
    dedupeCategories = function(arr){
      const deleted = new Set(((state&&state.settings&&state.settings.deletedCategories)||[]).map(String));
      return (__oldDedupeCategories(arr)||[]).filter(c=>!deleted.has(catKey(c.name,c.type)));
    };
  }catch(e){}

  // Replace activeDebts so generated debts from bank operations can be reminded/edited/closed too.
  activeDebts = function(){
    ensureArrays();
    const rows=[];
    state.debts.forEach(d=>{
      if(String(d.status||'Активен')==='Закрыт') return;
      if(debtHidden(d.id)) return;
      rows.push({direction:d.direction||'owe',...d});
    });
    state.operations.forEach(o=>{
      const d=derivedDebtFromOperation(o);
      if(!d || debtHidden(d.id)) return;
      rows.push(d);
    });
    const map=new Map();
    rows.forEach(d=>{
      const key = d.id && String(d.id).startsWith('op_') ? d.id : [d.person,d.amount,d.due,d.direction].join('|');
      if(!map.has(key)) map.set(key,d);
    });
    return Array.from(map.values());
  };
  activeOwe = function(){ return activeDebts().filter(d=>String(d.direction||'owe')==='owe'); };
  activeOwed = function(){ return activeDebts().filter(d=>String(d.direction||'owe')==='owed_to_me'); };

  function saveAndRender(message){
    ensureArrays();
    try{ save(true); }catch(e){ try{localStorage.setItem(STORE_KEY,JSON.stringify({state}))}catch(_){} }
    try{ render(); }catch(e){ console.error(e); }
    if(message) sbosMsg(message);
  }

  function editDebtAny(id){
    const found=findDebtAny(id); const d=found.debt;
    if(!d){ sbosMsg('Долг не найден'); return true; }
    openModal(found.explicit?'Редактировать долг':'Долг из операции',`<div class="form-grid"><div class="field"><label>Тип</label><select id="f_direction"><option value="owe" ${(d.direction||'owe')==='owe'?'selected':''}>Я должен</option><option value="owed_to_me" ${d.direction==='owed_to_me'?'selected':''}>Мне должны</option></select></div>${field('Кто / кому','f_person',d.person)}${field('Сумма','f_amount',d.amount,'number')}${field('Дата возврата','f_due',d.due,'date')}<div class="field"><label>Статус</label><select id="f_status"><option ${d.status==='Активен'?'selected':''}>Активен</option><option ${d.status==='Ожидаю'?'selected':''}>Ожидаю</option><option ${d.status==='Закрыт'?'selected':''}>Закрыт</option></select></div>${area('Комментарий','f_note',d.note||'')}</div><div class="actions"><button type="button" class="btn" data-action="saveDebtAny" data-id="${esc(id)}">Сохранить</button><button type="button" class="mini-btn red" data-action="deleteDebt" data-id="${esc(id)}">Удалить</button></div>`);
    return true;
  }
  function saveDebtAny(id){
    const found=findDebtAny(id); const d=found.debt;
    if(!d){ sbosMsg('Долг не найден'); return true; }
    if(found.explicit){
      d.direction=formVal('f_direction')||'owe'; d.person=formVal('f_person')||'Долг'; d.amount=num(formVal('f_amount')); d.due=formVal('f_due'); d.status=formVal('f_status')||'Активен'; d.note=formVal('f_note');
    }else{
      hideDebtId(id);
      state.debts.unshift({id:uid(),direction:formVal('f_direction')||d.direction||'owe',person:formVal('f_person')||d.person||'Долг',amount:num(formVal('f_amount')||d.amount),due:formVal('f_due')||d.due,status:formVal('f_status')||'Активен',note:formVal('f_note')||'Создано из банковской операции'});
    }
    try{closeModal()}catch(e){}
    saveAndRender('Долг сохранён');
    return true;
  }
  function closeDebtAny(id){
    const found=findDebtAny(id); const d=found.debt;
    if(!d){ sbosMsg('Долг не найден'); return true; }
    if(found.explicit) d.status='Закрыт'; else hideDebtId(id);
    saveAndRender('Долг закрыт');
    return true;
  }
  function deleteDebtAny(id){
    const found=findDebtAny(id); const d=found.debt;
    if(!d){ sbosMsg('Долг не найден'); return true; }
    if(!confirm('Удалить этот долг из списка?')) return true;
    if(found.explicit) state.debts=state.debts.filter(x=>String(x.id)!==String(id)); else hideDebtId(id);
    saveAndRender('Долг удалён из списка');
    return true;
  }
  function debtTaskAny(id){
    const found=findDebtAny(id); const d=found.debt;
    if(!d){ sbosMsg('Долг не найден'); return true; }
    state.tasks.unshift({id:uid(),title:`Напоминание по долгу: ${d.person} — ${money(d.amount)}`,area:'Финансы',due:d.due||todayKey(),time:'10:00',priority:'A',status:'В работе',note:d.note||''});
    if(found.explicit) d.reminder=true;
    saveAndRender('Напоминание создано в задачах');
    return true;
  }
  function deleteCategoryAny(id){
    ensureArrays();
    const c=state.categories.find(x=>String(x.id)===String(id));
    if(!c){ sbosMsg('Категория не найдена'); return true; }
    const used=(state.operations||[]).filter(o=>String(o.category||'')===String(c.name||'')).length + (state.plannedPurchases||[]).filter(p=>String(p.category||'')===String(c.name||'')).length;
    if(!confirm(`Удалить категорию «${c.name}»?${used?`\nСвязанные записи будут переведены в «Без категории».`:''}`)) return true;
    const k=catKey(c.name,c.type);
    if(!state.settings.deletedCategories.includes(k)) state.settings.deletedCategories.push(k);
    state.operations.forEach(o=>{ if(String(o.category||'')===String(c.name||'')) o.category='Без категории'; });
    state.plannedPurchases.forEach(p=>{ if(String(p.category||'')===String(c.name||'')) p.category='Без категории'; });
    state.categories=state.categories.filter(x=>String(x.id)!==String(id) && catKey(x.name,x.type)!==k);
    saveAndRender('Категория удалена');
    return true;
  }
  function saveCategoryAny(){
    ensureArrays();
    const name=formVal('f_name')||'Категория'; const type=formVal('f_type')||'expense';
    removeDeletedCategoryMarker(name,type);
    state.categories.push({id:uid(),name,type,limit:num(formVal('f_limit'))});
    try{closeModal()}catch(e){}
    saveAndRender('Категория добавлена');
    return true;
  }
  function saveEditedCategoryAny(id){
    ensureArrays();
    const c=state.categories.find(x=>String(x.id)===String(id));
    if(!c){ sbosMsg('Категория не найдена'); return true; }
    const oldName=c.name, oldType=c.type;
    const newName=formVal('f_name')||c.name, newType=formVal('f_type')||c.type||'expense';
    removeDeletedCategoryMarker(newName,newType);
    c.name=newName; c.type=newType; c.limit=num(formVal('f_limit'));
    state.operations.forEach(o=>{ if(String(o.category||'')===String(oldName||'')) o.category=newName; });
    state.plannedPurchases.forEach(p=>{ if(String(p.category||'')===String(oldName||'')) p.category=newName; });
    const oldKey=catKey(oldName,oldType); state.settings.deletedCategories=state.settings.deletedCategories.filter(x=>x!==oldKey);
    try{closeModal()}catch(e){}
    saveAndRender('Категория сохранена');
    return true;
  }

  const previousForce = window.SBOS_FORCE_ACTION;
  window.SBOS_FORCE_ACTION=function(action,id,el){
    try{
      action=action || (el&&el.dataset&&el.dataset.action) || '';
      id=id || (el&&el.dataset&&el.dataset.id) || '';
      if(action==='closeDebt') return closeDebtAny(id);
      if(action==='debtTask') return debtTaskAny(id);
      if(action==='editDebt') return editDebtAny(id);
      if(action==='saveDebtAny') return saveDebtAny(id);
      if(action==='deleteDebt') return deleteDebtAny(id);
      if(action==='deleteCategory') return deleteCategoryAny(id);
      if(action==='saveCategory') return saveCategoryAny();
      if(action==='saveEditedCategory') return saveEditedCategoryAny(id);
      if(action==='addDebt') return addDebt(id==='owed_to_me'?'owed_to_me':'owe'), true;
      return previousForce ? previousForce(action,id,el) : false;
    }catch(err){ console.error('[SBOS data-actions-real-fix]', action,id,err); sbosMsg('Ошибка кнопки: '+(err.message||action)); return true; }
  };

  // Strong click wire after the old handlers: old handlers call the current window.SBOS_FORCE_ACTION too.
  function wireRealButtons(){
    document.querySelectorAll('[data-action]').forEach(btn=>{
      btn.setAttribute('type','button');
      const a=btn.dataset.action||'';
      if(!/Debt|Category|saveDebtAny/.test(a)) return;
      if(btn.__sbosRealFix) return;
      btn.__sbosRealFix=true;
      btn.addEventListener('click',function(ev){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        window.SBOS_FORCE_ACTION(this.dataset.action,this.dataset.id,this);
        return false;
      },true);
    });
  }
  try{
    const previousRender=render;
    render=function(){ const out=previousRender.apply(this,arguments); setTimeout(wireRealButtons,0); setTimeout(wireRealButtons,100); return out; };
    window.render=render;
  }catch(e){}
  ensureArrays();
  save(false);
  setTimeout(()=>{try{render(); wireRealButtons();}catch(e){console.error(e)}},0);
})();



/* ===== BUDGET OPEN FIX — missing category budget row renderer ===== */
function budgetRow(b){
  const pct = Number.isFinite(+b.pct) ? +b.pct : 0;
  const tone = pct > 100 ? 'red' : pct > 80 ? 'amber' : 'blue';
  const leftText = (Number(b.limit||0) > 0) ? `Осталось: ${money(Number(b.left||0))}` : 'Лимит не задан';
  return `<div class="list-row category-row budget-row" data-cat-name="${esc(b.name||'')}" data-cat-type="${esc(b.type||'expense')}">
    <span class="pill ${tone}">${pct}%</span>
    <div>
      <div class="row-title">${esc(b.name||'Категория')}</div>
      <div class="row-sub">${money(Number(b.spent||0))} из ${Number(b.limit||0)?money(Number(b.limit||0)):'—'} · ${leftText}</div>
      ${progressBar(pct, pct>100?'red':pct>80?'amber':'green')}
    </div>
    <div class="button-row">
      <button type="button" class="mini-btn" data-action="editCategory" data-id="${esc(b.id||'')}" data-name="${esc(b.name||'')}">Ред.</button>
      <button type="button" class="mini-btn red" data-action="deleteCategory" data-id="${esc(b.id||'')}" data-name="${esc(b.name||'')}">Удалить</button>
    </div>
  </div>`;
}
window.budgetRow = budgetRow;
(function(){
  const oldRender = window.render || render;
  window.SBOS_BUDGET_FIX_BUILD = 'budget-open-fix-20260630';
  function hardGoBudget(){ try{ page='budget'; location.hash='budget'; oldRender(); }catch(e){ console.error('[budget open fix]',e); try{toast('Ошибка бюджета: '+(e.message||e))}catch(_){alert('Ошибка бюджета: '+(e.message||e))} } }
  document.addEventListener('click', function(ev){
    const btn = ev.target.closest && ev.target.closest('[data-go="budget"], .nav-btn[data-go="budget"], #bottomNav button[data-go="budget"]');
    if(!btn) return;
    ev.preventDefault(); ev.stopPropagation();
    hardGoBudget();
  }, true);
})();

/* ===== CATEGORY DELETE FINAL FIX — name-based persistent deletion ===== */
(function(){
  const BUILD_CAT_FINAL = 'category-delete-final-fix-20260630-1';
  try{ localStorage.setItem('secondBrainOS.currentBuild', BUILD_CAT_FINAL); }catch(e){}

  function msg(text){ try{ toast(text); }catch(e){ console.log('[SBOS]', text); } }
  function normName(v){ return String(v||'').trim().replace(/\s+/g,' ').toLowerCase(); }
  function typeNorm(v){ return (String(v||'').toLowerCase()==='income' || String(v||'').toLowerCase()==='доход') ? 'income' : 'expense'; }
  function catNameKey(v){ return normName(v); }
  function catFullKey(name,type){ return catNameKey(name)+'|'+typeNorm(type); }
  function ensureCategoryState(){
    state = state || {};
    state.settings = state.settings || {};
    state.categories = Array.isArray(state.categories) ? state.categories : [];
    state.operations = Array.isArray(state.operations) ? state.operations : [];
    state.plannedPurchases = Array.isArray(state.plannedPurchases) ? state.plannedPurchases : [];
    state.budgets = Array.isArray(state.budgets) ? state.budgets : [];
    state.settings.deletedCategories = Array.isArray(state.settings.deletedCategories) ? state.settings.deletedCategories : [];
    state.settings.deletedCategoryNames = Array.isArray(state.settings.deletedCategoryNames) ? state.settings.deletedCategoryNames : [];
  }
  function isNameDeleted(name){
    ensureCategoryState();
    const k=catNameKey(name);
    if(!k) return false;
    return state.settings.deletedCategoryNames.map(String).includes(k) || state.settings.deletedCategories.map(String).some(x=>String(x).split('|')[0]===k);
  }
  function rememberDeletedCategory(name,type){
    ensureCategoryState();
    const nk=catNameKey(name), fk=catFullKey(name,type);
    if(nk && !state.settings.deletedCategoryNames.includes(nk)) state.settings.deletedCategoryNames.push(nk);
    if(fk && !state.settings.deletedCategories.includes(fk)) state.settings.deletedCategories.push(fk);
  }
  function unrememberDeletedCategory(name,type){
    ensureCategoryState();
    const nk=catNameKey(name), fk=catFullKey(name,type);
    state.settings.deletedCategoryNames = state.settings.deletedCategoryNames.filter(x=>String(x)!==nk);
    state.settings.deletedCategories = state.settings.deletedCategories.filter(x=>String(x)!==fk && String(x).split('|')[0]!==nk);
  }
  function cleanupDeletedCategories(){
    ensureCategoryState();
    const deletedNames = new Set((state.settings.deletedCategoryNames||[]).map(String));
    const deletedFull = new Set((state.settings.deletedCategories||[]).map(String));
    state.categories = (state.categories||[])
      .map(c=>({...c,type:typeNorm(c.type),name:String(c.name||'').trim()}))
      .filter(c=>c.name && !deletedNames.has(catNameKey(c.name)) && !deletedFull.has(catFullKey(c.name,c.type)));
    const seen=new Set();
    state.categories = state.categories.filter(c=>{
      const k=catFullKey(c.name,c.type);
      if(seen.has(k)) return false;
      seen.add(k); return true;
    });
  }
  function reassignCategoryEverywhere(oldName,newName='Без категории'){
    ensureCategoryState();
    const oldK=catNameKey(oldName);
    [state.operations,state.plannedPurchases,state.budgets].forEach(arr=>{
      (arr||[]).forEach(x=>{
        if(catNameKey(x.category)===oldK) x.category=newName;
      });
    });
  }
  function hardPersistAndRender(text){
    cleanupDeletedCategories();
    try{
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      localStorage.setItem(META_KEY, JSON.stringify({app:APP_NAME,build:BUILD_CAT_FINAL,updatedAt:new Date().toISOString()}));
    }catch(e){ console.error(e); }
    try{ render(); }catch(e){ console.error(e); }
    if(text) msg(text);
  }

  // Global protection: normalize can no longer recreate a deleted category from old operations/budgets.
  try{
    const oldNormalize = normalizeState;
    normalizeState = function(raw){
      const next = oldNormalize(raw);
      try{
        const deletedNames = new Set([...
          (((raw&&raw.settings&&raw.settings.deletedCategoryNames)||[]).map(String)),
          ...(((state&&state.settings&&state.settings.deletedCategoryNames)||[]).map(String))
        ]);
        const deletedFull = new Set([...
          (((raw&&raw.settings&&raw.settings.deletedCategories)||[]).map(String)),
          ...(((state&&state.settings&&state.settings.deletedCategories)||[]).map(String))
        ]);
        next.settings = next.settings || {};
        next.settings.deletedCategoryNames = Array.from(new Set([...(next.settings.deletedCategoryNames||[]),...deletedNames]));
        next.settings.deletedCategories = Array.from(new Set([...(next.settings.deletedCategories||[]),...deletedFull]));
        next.categories = (next.categories||[])
          .map(c=>({...c,type:typeNorm(c.type),name:String(c.name||'').trim()}))
          .filter(c=>c.name && !next.settings.deletedCategoryNames.includes(catNameKey(c.name)) && !next.settings.deletedCategories.includes(catFullKey(c.name,c.type)));
        const seen = new Set();
        next.categories = next.categories.filter(c=>{ const k=catFullKey(c.name,c.type); if(seen.has(k)) return false; seen.add(k); return true; });
      }catch(e){ console.error('[category normalize protection]',e); }
      return next;
    };
    window.normalizeState = normalizeState;
  }catch(e){}

  try{
    const oldDerive = deriveCategories;
    deriveCategories = function(s){
      const arr = oldDerive(s)||[];
      const deletedNames = new Set([...
        (((s&&s.settings&&s.settings.deletedCategoryNames)||[]).map(String)),
        ...(((state&&state.settings&&state.settings.deletedCategoryNames)||[]).map(String))
      ]);
      return arr.filter(c=>!deletedNames.has(catNameKey(c.name)) && !isNameDeleted(c.name));
    };
    window.deriveCategories = deriveCategories;
  }catch(e){}

  function findCategoryByIdOrName(id, el){
    ensureCategoryState();
    let c = (state.categories||[]).find(x=>String(x.id)===String(id));
    if(c) return c;
    const row = el && el.closest ? el.closest('.category-row,.list-row') : null;
    const name = row ? (row.querySelector('.row-title')?.textContent || '') : '';
    if(name) c = (state.categories||[]).find(x=>catNameKey(x.name)===catNameKey(name));
    return c || null;
  }

  function deleteCategoryFinal(id, el){
    ensureCategoryState();
    const c = findCategoryByIdOrName(id, el);
    if(!c){ msg('Категория не найдена. Обнови страницу через force-update и попробуй ещё раз.'); return true; }
    const name = String(c.name||'').trim();
    if(catNameKey(name)==='без категории') { msg('«Без категории» — служебная категория, её лучше оставить.'); return true; }
    const used = (state.operations||[]).filter(o=>catNameKey(o.category)===catNameKey(name)).length + (state.plannedPurchases||[]).filter(p=>catNameKey(p.category)===catNameKey(name)).length + (state.budgets||[]).filter(b=>catNameKey(b.category)===catNameKey(name)).length;
    const ok = confirm(`Удалить категорию «${name}»?${used?`\n${used} связанных записей будут переведены в «Без категории».`:''}`);
    if(!ok) return true;
    rememberDeletedCategory(name,c.type);
    reassignCategoryEverywhere(name,'Без категории');
    state.categories = (state.categories||[]).filter(x=>catNameKey(x.name)!==catNameKey(name));
    hardPersistAndRender('Категория удалена');
    return true;
  }

  function editCategoryFinal(id, el){
    ensureCategoryState();
    const c = findCategoryByIdOrName(id, el);
    if(!c){ msg('Категория не найдена'); return true; }
    openModal('Редактировать категорию',`<div class="form-grid">${field('Название','f_name',c.name)}<div class="field"><label>Тип</label><select id="f_type"><option value="expense" ${typeNorm(c.type)==='expense'?'selected':''}>Расход</option><option value="income" ${typeNorm(c.type)==='income'?'selected':''}>Доход</option></select></div>${field('Лимит в месяц','f_limit',c.limit)}</div><div class="actions"><button type="button" class="btn" data-action="saveEditedCategory" data-id="${esc(c.id)}">Сохранить</button></div>`);
    return true;
  }
  function saveEditedCategoryFinal(id){
    ensureCategoryState();
    const c=(state.categories||[]).find(x=>String(x.id)===String(id));
    if(!c){ msg('Категория не найдена'); return true; }
    const oldName=c.name;
    const newName=(formVal('f_name')||c.name||'Категория').trim();
    const newType=typeNorm(formVal('f_type')||c.type);
    unrememberDeletedCategory(newName,newType);
    c.name=newName; c.type=newType; c.limit=num(formVal('f_limit'));
    [state.operations,state.plannedPurchases,state.budgets].forEach(arr=>(arr||[]).forEach(x=>{ if(catNameKey(x.category)===catNameKey(oldName)) x.category=newName; }));
    try{closeModal()}catch(e){}
    hardPersistAndRender('Категория сохранена');
    return true;
  }
  function saveCategoryFinal(){
    ensureCategoryState();
    const name=(formVal('f_name')||'Категория').trim();
    const type=typeNorm(formVal('f_type')||'expense');
    unrememberDeletedCategory(name,type);
    const existing=state.categories.find(c=>catFullKey(c.name,c.type)===catFullKey(name,type));
    if(existing){ existing.limit=num(formVal('f_limit')); }
    else state.categories.push({id:uid(),name,type,limit:num(formVal('f_limit'))});
    try{closeModal()}catch(e){}
    hardPersistAndRender('Категория добавлена');
    return true;
  }

  const prevForce = window.SBOS_FORCE_ACTION;
  window.SBOS_FORCE_ACTION = function(action,id,el){
    try{
      action = action || (el&&el.dataset&&el.dataset.action) || '';
      id = id || (el&&el.dataset&&el.dataset.id) || '';
      if(action==='deleteCategory') return deleteCategoryFinal(id,el);
      if(action==='editCategory') return editCategoryFinal(id,el);
      if(action==='saveEditedCategory') return saveEditedCategoryFinal(id);
      if(action==='saveCategory') return saveCategoryFinal();
      return prevForce ? prevForce(action,id,el) : false;
    }catch(err){ console.error('[SBOS category final]',err); msg('Ошибка категории: '+(err.message||action)); return true; }
  };

  // Strong direct hooks on every render; previous document handlers call the current SBOS_FORCE_ACTION.
  function wireCategoryButtons(){
    document.querySelectorAll('[data-action="deleteCategory"],[data-action="editCategory"],[data-action="saveEditedCategory"],[data-action="saveCategory"]').forEach(btn=>{
      btn.setAttribute('type','button');
      if(btn.__sbosCatFinal) return;
      btn.__sbosCatFinal=true;
      btn.addEventListener('click',function(ev){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        window.SBOS_FORCE_ACTION(this.dataset.action,this.dataset.id,this);
        return false;
      }, true);
      const a=btn.dataset.action||'', id=String(btn.dataset.id||'').replace(/'/g,"\\'");
      btn.setAttribute('onclick',`return window.SBOS_FORCE_ACTION('${a}','${id}',this), false`);
    });
  }
  try{
    const oldRender = render;
    render = function(){ const out=oldRender.apply(this,arguments); setTimeout(wireCategoryButtons,0); setTimeout(wireCategoryButtons,80); return out; };
    window.render = render;
  }catch(e){}
  ensureCategoryState();
  cleanupDeletedCategories();
  hardPersistAndRender();
  setInterval(wireCategoryButtons,1000);
})();


/* Life Addons: subconscious diary + Polina planning + hidden archive. */
(function(){
  const ADDON_BUILD='life-addons-subconscious-polina-20260630';
  try{localStorage.setItem('secondBrainOS.addonBuild',ADDON_BUILD)}catch(e){}
  const safeArr = k => { if(!Array.isArray(state[k])) state[k]=[]; return state[k]; };
  function ensureLifeAddons(){
    if(!state.settings) state.settings={};
    safeArr('subconsciousDiary');
    safeArr('polinaWishes');
    safeArr('polinaPayments');
    safeArr('archive');
    if(!state.polinaWishes.length){
      state.polinaWishes.push({id:uid(),title:'Подарок Полине',amount:7000,category:'Подарки',priority:'Важно',month:state.settings.currentMonth||monthKey(),includeInBudget:true,link:'',note:'Пример хотелки. Можно удалить или заменить.'});
    }
    if(!state.polinaPayments.length){
      state.polinaPayments.push({id:uid(),title:'Обязательный платёж Полины',amount:0,category:'Обязательные платежи',dueDay:10,month:state.settings.currentMonth||monthKey(),active:true,note:'Добавь реальные платежи Полины для прогноза.'});
    }
    state.settings.lifeFolder = state.settings.lifeFolder || 'overview';
  }
  function addonMoney(v){ try{return money(v)}catch(e){return `${Math.round(Number(v)||0).toLocaleString('ru-RU')} ₽`;} }
  function currentMonth(){return (state.settings&&state.settings.currentMonth)||monthKey()}
  function polinaWishesInMonth(m=currentMonth()){return safeArr('polinaWishes').filter(x=>(x.month||m)===m && x.includeInBudget!==false)}
  function polinaPaymentsInMonth(m=currentMonth()){return safeArr('polinaPayments').filter(x=>(x.month||m)===m && x.active!==false)}
  function polinaForecastMonth(m=currentMonth()){return polinaWishesInMonth(m).reduce((a,b)=>a+num(b.amount),0)+polinaPaymentsInMonth(m).reduce((a,b)=>a+num(b.amount),0)}
  function polinaDueUntil(date){
    const target = new Date(date); if(String(target)==='Invalid Date') return 0;
    return polinaPaymentsInMonth(monthKey(target)).filter(p=>{
      const day=Math.max(1,Math.min(31,num(p.dueDay)||1));
      const due=new Date(target.getFullYear(),target.getMonth(),day);
      return due<=target;
    }).reduce((a,b)=>a+num(b.amount),0) + polinaWishesInMonth(monthKey(target)).reduce((a,b)=>a+num(b.amount),0);
  }

  try{
    const oldDueUntil=dueUntil;
    dueUntil=function(date){return (oldDueUntil?oldDueUntil(date):0)+polinaDueUntil(date)};
    window.dueUntil=dueUntil;
  }catch(e){}

  try{
    const oldSummary=summary;
    summary=function(){
      const s=oldSummary();
      const extra=polinaForecastMonth();
      s.polinaForecast=extra;
      s.toNext=(s.toNext||0)-polinaDueUntil(s.nextSalary&&s.nextSalary.date? s.nextSalary.date : todayKey());
      s.dailyLimit=Math.max(0,Math.floor((s.toNext||0)/Math.max(1,s.daysToSalary||1)));
      return s;
    };
    window.summary=summary;
  }catch(e){}

  function noteFromDiary(entry){
    const text = [
      `Самочувствие: ${entry.feeling||'—'}`,
      `Чего избегаю: ${entry.avoid||'—'}`,
      `Что уже знаю: ${entry.truth||'—'}`,
      `Один шаг: ${entry.step||'—'}`,
      entry.extra?`Дополнительно: ${entry.extra}`:''
    ].filter(Boolean).join('\n');
    return {id:entry.noteId||uid(),title:`Интервью с подсознанием · ${entry.date||todayKey()}`,text,folder:'Дневник',tags:['рефлексия','подсознание','интервью'],createdAt:entry.date||todayKey()};
  }
  function diaryCard(e){return `<article class="mini-box"><div class="stat-row"><strong>${esc(e.date||'')}</strong><span class="pill violet">подсознание</span></div><p class="small"><b>Чувствую:</b> ${esc(e.feeling||'—')}</p><p class="small"><b>Избегаю:</b> ${esc(e.avoid||'—')}</p><p class="small"><b>Знаю:</b> ${esc(e.truth||'—')}</p><p class="small"><b>Шаг:</b> ${esc(e.step||'—')}</p><div class="button-row"><button class="mini-btn" data-action="editSubconsciousEntry" data-id="${esc(e.id)}">Ред.</button><button class="mini-btn red" data-action="deleteSubconsciousEntry" data-id="${esc(e.id)}">Удалить</button></div></article>`}
  function subconsciousFolder(){ensureLifeAddons(); const latest=safeArr('subconsciousDiary').slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); return `<section class="grid cols-3"><article class="card premium-hero-card"><div class="card-head"><h3>Интервью с подсознанием</h3><span class="pill violet">дневник</span></div><p class="muted">4 вопроса помогают достать честный ответ и превратить мысль в действие. Ответы сохраняются в заметки с тегом «подсознание».</p><button class="btn" data-action="addSubconsciousEntry">Начать интервью</button></article><article class="card"><h3>Записей</h3><div class="value sm">${latest.length}</div><p class="muted small">последняя: ${esc(latest[0]?.date||'—')}</p></article><article class="card"><h3>Вопрос дня</h3><p class="quote-big" style="font-size:18px">Что я уже знаю, но пока не хочу признать?</p></article></section><section class="grid cols-2" style="margin-top:18px">${latest.map(diaryCard).join('')||empty('Записей дневника пока нет')}</section>`}
  function openSubconsciousModal(e={}){openModal(e.id?'Редактировать интервью':'Интервью с подсознанием',`<div class="form-grid">${field('Дата','f_date',e.date||todayKey(),'date')}${area('1. Что я сейчас чувствую?','f_feeling',e.feeling||'')}${area('2. Чего я избегаю или откладываю?','f_avoid',e.avoid||'')}${area('3. Что я уже знаю, но не признаю?','f_truth',e.truth||'')}${area('4. Какой один маленький шаг я сделаю?','f_step',e.step||'')}${area('Дополнительно','f_extra',e.extra||'')}</div><div class="actions"><button class="btn" data-action="${e.id?'saveEditedSubconsciousEntry':'saveSubconsciousEntry'}" ${e.id?`data-id="${esc(e.id)}"`:''}>Сохранить в дневник и заметки</button></div>`)}
  function addSubconsciousEntry(){openSubconsciousModal()}
  function saveSubconsciousEntry(){const entry={id:uid(),date:formVal('f_date')||todayKey(),feeling:formVal('f_feeling'),avoid:formVal('f_avoid'),truth:formVal('f_truth'),step:formVal('f_step'),extra:formVal('f_extra')}; const note=noteFromDiary(entry); entry.noteId=note.id; state.subconsciousDiary.unshift(entry); state.notes.unshift(note); save(true); closeModal(); toast('Интервью сохранено в дневник и заметки'); render()}
  function editSubconsciousEntry(id){const e=state.subconsciousDiary.find(x=>String(x.id)===String(id)); if(e)openSubconsciousModal(e)}
  function saveEditedSubconsciousEntry(id){const e=state.subconsciousDiary.find(x=>String(x.id)===String(id)); if(!e)return; e.date=formVal('f_date')||todayKey(); e.feeling=formVal('f_feeling'); e.avoid=formVal('f_avoid'); e.truth=formVal('f_truth'); e.step=formVal('f_step'); e.extra=formVal('f_extra'); const note=noteFromDiary(e); const idx=state.notes.findIndex(n=>String(n.id)===String(e.noteId)); if(idx>=0) state.notes[idx]=note; else state.notes.unshift(note); save(true); closeModal(); render()}
  function deleteSubconsciousEntry(id){const e=state.subconsciousDiary.find(x=>String(x.id)===String(id)); if(!e)return; if(!confirm('Удалить запись дневника? Заметка тоже будет удалена.'))return; state.subconsciousDiary=state.subconsciousDiary.filter(x=>String(x.id)!==String(id)); if(e.noteId) state.notes=state.notes.filter(n=>String(n.id)!==String(e.noteId)); save(true); render()}

  function polinaWishRow(w){return `<div class="list-row"><span class="pill ${w.priority==='Очень важно'?'red':w.priority==='Важно'?'amber':'blue'}">${esc(w.priority||'Важно')}</span><div><div class="row-title">${esc(w.title)} · ${addonMoney(w.amount)}</div><div class="row-sub">${esc(w.category||'Без категории')} · ${esc(w.month||currentMonth())} · ${w.includeInBudget!==false?'в прогнозе':'вне прогноза'}</div></div><div class="button-row">${w.link?`<a class="mini-btn blue" href="${esc(w.link)}" target="_blank">Ссылка</a>`:''}<button class="mini-btn" data-action="editPolinaWish" data-id="${esc(w.id)}">Ред.</button><button class="mini-btn red" data-action="deletePolinaWish" data-id="${esc(w.id)}">Удалить</button></div></div>`}
  function polinaPaymentRow(p){return `<div class="list-row"><span class="pill ${p.active===false?'':'blue'}">${p.active===false?'пауза':'платёж'}</span><div><div class="row-title">${esc(p.title)} · ${addonMoney(p.amount)}</div><div class="row-sub">${esc(p.category||'Обязательные')} · день ${esc(p.dueDay||'—')} · ${esc(p.month||currentMonth())}</div></div><div class="button-row"><button class="mini-btn" data-action="editPolinaPayment" data-id="${esc(p.id)}">Ред.</button><button class="mini-btn red" data-action="deletePolinaPayment" data-id="${esc(p.id)}">Удалить</button></div></div>`}
  function polinaWishesFolder(){ensureLifeAddons(); const sum=polinaWishesInMonth().reduce((a,b)=>a+num(b.amount),0); return `<section class="grid cols-3"><article class="card premium-hero-card"><h3>Хотелки Полины</h3><div class="value sm">${addonMoney(sum)}</div><p class="muted small">учитываются в прогнозе, если включены в бюджет</p><button class="btn" data-action="addPolinaWish">Добавить хотелку</button></article><article class="card"><h3>Приоритет</h3><p class="muted">Отмечай «Очень важно», чтобы не потерять главное и не перегрузить месяц.</p></article><article class="card"><h3>Прогноз</h3><p class="muted">Сумма попадает в расчёт «до зарплаты» и помогает заранее видеть расход.</p></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Список хотелок</h3><button class="btn secondary" data-action="addPolinaWish">Добавить</button></div><div class="note-list">${safeArr('polinaWishes').map(polinaWishRow).join('')||empty('Пока пусто')}</div></section>`}
  function polinaPaymentsFolder(){ensureLifeAddons(); const sum=polinaPaymentsInMonth().reduce((a,b)=>a+num(b.amount),0); return `<section class="grid cols-3"><article class="card premium-hero-card"><h3>Обязательные платежи Полины</h3><div class="value sm">${addonMoney(sum)}</div><p class="muted small">ежемесячный прогноз расходов</p><button class="btn" data-action="addPolinaPayment">Добавить платёж</button></article><article class="card"><h3>Ближайшие</h3><p class="muted">Платежи с датой до зарплаты уменьшают дневной лимит.</p></article><article class="card"><h3>Совет</h3><p class="muted">Лучше заносить регулярные платежи один раз и корректировать сумму при изменении.</p></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Список платежей</h3><button class="btn secondary" data-action="addPolinaPayment">Добавить</button></div><div class="note-list">${safeArr('polinaPayments').map(polinaPaymentRow).join('')||empty('Пока пусто')}</div></section>`}
  function openPolinaWishModal(w={}){openModal(w.id?'Редактировать хотелку Полины':'Хотелка Полины',`<div class="form-grid">${field('Что хочет / нужно','f_title',w.title||'')}${field('Сумма','f_amount',w.amount||'', 'number')}${field('Категория','f_category',w.category||'Подарки')}${field('Месяц','f_month',w.month||currentMonth())}<div class="field"><label>Важность</label><select id="f_priority"><option ${w.priority==='Очень важно'?'selected':''}>Очень важно</option><option ${w.priority==='Важно'?'selected':''}>Важно</option><option ${w.priority==='Можно позже'?'selected':''}>Можно позже</option></select></div><div class="field"><label>Включать в прогноз</label><select id="f_include"><option value="yes" ${w.includeInBudget!==false?'selected':''}>Да</option><option value="no" ${w.includeInBudget===false?'selected':''}>Нет</option></select></div>${field('Ссылка','f_link',w.link||'')}${area('Комментарий','f_note',w.note||'')}</div><div class="actions"><button class="btn" data-action="${w.id?'saveEditedPolinaWish':'savePolinaWish'}" ${w.id?`data-id="${esc(w.id)}"`:''}>Сохранить</button></div>`)}
  function addPolinaWish(){openPolinaWishModal()}
  function savePolinaWish(){state.polinaWishes.unshift({id:uid(),title:formVal('f_title')||'Хотелка Полины',amount:num(formVal('f_amount')),category:formVal('f_category')||'Подарки',month:formVal('f_month')||currentMonth(),priority:formVal('f_priority')||'Важно',includeInBudget:formVal('f_include')!=='no',link:formVal('f_link'),note:formVal('f_note')}); save(true); closeModal(); render()}
  function editPolinaWish(id){const w=state.polinaWishes.find(x=>String(x.id)===String(id)); if(w)openPolinaWishModal(w)}
  function saveEditedPolinaWish(id){const w=state.polinaWishes.find(x=>String(x.id)===String(id)); if(!w)return; w.title=formVal('f_title'); w.amount=num(formVal('f_amount')); w.category=formVal('f_category'); w.month=formVal('f_month')||currentMonth(); w.priority=formVal('f_priority'); w.includeInBudget=formVal('f_include')!=='no'; w.link=formVal('f_link'); w.note=formVal('f_note'); save(true); closeModal(); render()}
  function deletePolinaWish(id){state.polinaWishes=state.polinaWishes.filter(x=>String(x.id)!==String(id)); save(true); render()}
  function openPolinaPaymentModal(p={}){openModal(p.id?'Редактировать платёж Полины':'Обязательный платёж Полины',`<div class="form-grid">${field('Название','f_title',p.title||'')}${field('Сумма','f_amount',p.amount||'', 'number')}${field('Категория','f_category',p.category||'Обязательные платежи')}${field('День месяца','f_dueDay',p.dueDay||10,'number')}${field('Месяц','f_month',p.month||currentMonth())}<div class="field"><label>Статус</label><select id="f_active"><option value="yes" ${p.active!==false?'selected':''}>Активен</option><option value="no" ${p.active===false?'selected':''}>Пауза</option></select></div>${area('Комментарий','f_note',p.note||'')}</div><div class="actions"><button class="btn" data-action="${p.id?'saveEditedPolinaPayment':'savePolinaPayment'}" ${p.id?`data-id="${esc(p.id)}"`:''}>Сохранить</button></div>`)}
  function addPolinaPayment(){openPolinaPaymentModal()}
  function savePolinaPayment(){state.polinaPayments.unshift({id:uid(),title:formVal('f_title')||'Платёж Полины',amount:num(formVal('f_amount')),category:formVal('f_category')||'Обязательные платежи',dueDay:num(formVal('f_dueDay'))||10,month:formVal('f_month')||currentMonth(),active:formVal('f_active')!=='no',note:formVal('f_note')}); save(true); closeModal(); render()}
  function editPolinaPayment(id){const p=state.polinaPayments.find(x=>String(x.id)===String(id)); if(p)openPolinaPaymentModal(p)}
  function saveEditedPolinaPayment(id){const p=state.polinaPayments.find(x=>String(x.id)===String(id)); if(!p)return; p.title=formVal('f_title'); p.amount=num(formVal('f_amount')); p.category=formVal('f_category'); p.dueDay=num(formVal('f_dueDay'))||10; p.month=formVal('f_month')||currentMonth(); p.active=formVal('f_active')!=='no'; p.note=formVal('f_note'); save(true); closeModal(); render()}
  function deletePolinaPayment(id){state.polinaPayments=state.polinaPayments.filter(x=>String(x.id)!==String(id)); save(true); render()}

  function archivePage(){ensureLifeAddons(); return layout('Архив','Скрытое место для закрытых задач, долгов и старых записей. Не перегружает основной экран.',`<section class="grid cols-3"><article class="card premium-hero-card"><h3>Архив</h3><div class="value sm">${safeArr('archive').length}</div><p class="muted small">ручные архивные записи</p></article><article class="card"><h3>Закрытые задачи</h3><div class="value sm">${state.tasks.filter(t=>t.status==='Готово').length}</div></article><article class="card"><h3>Закрытые долги</h3><div class="value sm">${state.debts.filter(d=>d.status==='Закрыт').length}</div></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Архивные записи</h3><span class="pill blue">скрытый раздел</span></div><div class="note-list">${safeArr('archive').map(a=>`<div class="list-row"><span class="pill blue">архив</span><div><div class="row-title">${esc(a.title||'Запись')}</div><div class="row-sub">${esc(a.note||'')} · ${esc(a.date||'')}</div></div></div>`).join('')||empty('Архив пока пуст')}</div></section>`)}

  const oldLifeFolders = lifeFolders;
  lifeFolders=function(){
    const base=(oldLifeFolders?oldLifeFolders():[]).filter(f=>!['subconscious','polinaWishes','polinaPayments'].includes(f.id));
    const insert=[{id:'subconscious',title:'Дневник',ico:'◑'},{id:'polinaWishes',title:'Хотелки Полины',ico:'♡'},{id:'polinaPayments',title:'Платежи Полины',ico:'₽'}];
    const existing=new Set(base.map(f=>f.id));
    return [...base,...insert.filter(f=>!existing.has(f.id))];
  };
  window.lifeFolders=lifeFolders;
  const oldLifeFolderCount=lifeFolderCount;
  lifeFolderCount=function(id){ensureLifeAddons(); if(id==='subconscious')return state.subconsciousDiary.length; if(id==='polinaWishes')return state.polinaWishes.length; if(id==='polinaPayments')return state.polinaPayments.length; return oldLifeFolderCount?oldLifeFolderCount(id):0};
  window.lifeFolderCount=lifeFolderCount;
  const oldSpheresPage=spheresPage;
  spheresPage=function(){ensureLifeAddons(); const folder=state.settings.lifeFolder||'overview'; let content=''; if(folder==='subconscious')content=subconsciousFolder(); else if(folder==='polinaWishes')content=polinaWishesFolder(); else if(folder==='polinaPayments')content=polinaPaymentsFolder(); else return oldSpheresPage(); return layout('Сферы жизни','Папки жизни, память, отношения и прогноз расходов.',`<section class="folder-list">${lifeFolders().map(f=>folderButton(f.id,f.title,f.ico,lifeFolderCount(f.id))).join('')}</section><section style="margin-top:18px">${content}</section>`)};
  window.spheresPage=spheresPage;

  const oldBudgetPage=budgetPage;
  budgetPage=function(){ensureLifeAddons(); let html=oldBudgetPage(); const extra=`<section class="card" style="margin-top:18px"><div class="card-head"><h3>Прогноз Полины</h3><span class="pill violet">${addonMoney(polinaForecastMonth())}</span></div><div class="grid cols-2"><div>${polinaWishesInMonth().slice(0,4).map(polinaWishRow).join('')||empty('Хотелок нет')}</div><div>${polinaPaymentsInMonth().slice(0,4).map(polinaPaymentRow).join('')||empty('Обязательных платежей нет')}</div></div><div class="actions"><button class="btn secondary" data-life-folder="polinaWishes">Хотелки</button><button class="btn secondary" data-life-folder="polinaPayments">Платежи</button></div></section>`; const idx=html.lastIndexOf('</div>'); return idx>0?html.slice(0,idx)+extra+html.slice(idx):html+extra};
  window.budgetPage=budgetPage;

  const oldDiagnostics=diagnosticsPage;
  diagnosticsPage=function(){let html=oldDiagnostics(); const extra=`<section class="card" style="margin-top:18px"><div class="card-head"><h3>Скрытые разделы</h3><span class="pill blue">не перегружают меню</span></div><div class="actions"><button class="btn secondary" data-go="archive">Архив</button><button class="btn secondary" data-life-folder="subconscious">Дневник подсознания</button><button class="btn secondary" data-life-folder="polinaWishes">Хотелки Полины</button><button class="btn secondary" data-life-folder="polinaPayments">Платежи Полины</button></div></section>`; const idx=html.lastIndexOf('</div>'); return idx>0?html.slice(0,idx)+extra+html.slice(idx):html+extra};
  window.diagnosticsPage=diagnosticsPage;
  const prevRender=render;
  render=function(){ensureLifeAddons(); if(page==='archive'){renderNav(); $('#view').innerHTML=archivePage(); setTimeout(patchClickableButtons,0); return;} return prevRender.apply(this,arguments)};
  window.render=render;

  const oldRun=runActionFromElement;
  runActionFromElement=function(el,event){
    const action=el&&el.dataset?el.dataset.action:''; const id=el&&el.dataset?el.dataset.id:'';
    const map={addSubconsciousEntry,saveSubconsciousEntry,editSubconsciousEntry,saveEditedSubconsciousEntry,deleteSubconsciousEntry,addPolinaWish,savePolinaWish,editPolinaWish,saveEditedPolinaWish,deletePolinaWish,addPolinaPayment,savePolinaPayment,editPolinaPayment,saveEditedPolinaPayment,deletePolinaPayment};
    if(map[action]){if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();} map[action](id); return true;}
    return oldRun?oldRun(el,event):false;
  };
  window.runActionFromElement=runActionFromElement;
  if(window.SBOS_FORCE_ACTION){const prev=window.SBOS_FORCE_ACTION; window.SBOS_FORCE_ACTION=function(action,id,el){const map={addSubconsciousEntry,saveSubconsciousEntry,editSubconsciousEntry,saveEditedSubconsciousEntry,deleteSubconsciousEntry,addPolinaWish,savePolinaWish,editPolinaWish,saveEditedPolinaWish,deletePolinaWish,addPolinaPayment,savePolinaPayment,editPolinaPayment,saveEditedPolinaPayment,deletePolinaPayment}; if(map[action]){map[action](id); return true;} return prev(action,id,el);};}
  ensureLifeAddons();
  try{save()}catch(e){}
  try{render()}catch(e){}
})();

/* ===== PLANNING IMAGE + POLINA BUDGET VISIBLE FIX ===== */
(function(){
  const FIX_BUILD='planning-images-polina-budget-visible-20260630';
  try{localStorage.setItem('secondBrainOS.currentBuild',FIX_BUILD);}catch(e){}
  function polinaMonth(){return (state.settings&&state.settings.currentMonth)||monthKey();}
  function ensurePolinaBudgetState(){
    state.polinaWishes=Array.isArray(state.polinaWishes)?state.polinaWishes:[];
    state.polinaPayments=Array.isArray(state.polinaPayments)?state.polinaPayments:[];
    state.settings=state.settings||{};
    if(!Array.isArray(state.settings.hiddenArchiveIds)) state.settings.hiddenArchiveIds=[];
  }
  function polinaWishesForBudget(m=polinaMonth()){ensurePolinaBudgetState();return state.polinaWishes.filter(x=>(x.month||m)===m && x.includeInBudget!==false);}
  function polinaPaymentsForBudget(m=polinaMonth()){ensurePolinaBudgetState();return state.polinaPayments.filter(x=>(x.month||m)===m && x.active!==false);}
  function polinaWishesTotal(m=polinaMonth()){return polinaWishesForBudget(m).reduce((a,b)=>a+num(b.amount),0);}
  function polinaPaymentsTotal(m=polinaMonth()){return polinaPaymentsForBudget(m).reduce((a,b)=>a+num(b.amount),0);}
  function polinaBudgetTotal(m=polinaMonth()){return polinaWishesTotal(m)+polinaPaymentsTotal(m);}
  function polinaDueUntilDate(date){
    ensurePolinaBudgetState();
    const target=new Date(date||todayKey());
    const m=monthKey(target);
    const day=target.getDate();
    const payments=polinaPaymentsForBudget(m).filter(p=>!p.dueDay || num(p.dueDay)<=day).reduce((a,b)=>a+num(b.amount),0);
    const wishes=polinaWishesForBudget(m).reduce((a,b)=>a+num(b.amount),0);
    return payments+wishes;
  }
  function rowPolinaWishBudget(w){
    const tone=w.priority==='Очень важно'?'red':w.priority==='Важно'?'amber':'violet';
    return `<div class="list-row polina-budget-row"><span class="pill ${tone}">${esc(w.priority||'Важно')}</span><div><div class="row-title">${esc(w.title||'Хотелка Полины')} · ${money(w.amount)}</div><div class="row-sub">${esc(w.category||'Без категории')} · ${esc(w.month||polinaMonth())}</div></div><div class="button-row">${w.link?`<a class="mini-btn blue" href="${esc(w.link)}" target="_blank" rel="noopener">Ссылка</a>`:''}<button class="mini-btn" data-action="editPolinaWish" data-id="${esc(w.id)}">Ред.</button></div></div>`;
  }
  function rowPolinaPaymentBudget(p){
    return `<div class="list-row polina-budget-row"><span class="pill blue">${p.active===false?'пауза':'платёж'}</span><div><div class="row-title">${esc(p.title||'Платёж Полины')} · ${money(p.amount)}</div><div class="row-sub">${esc(p.category||'Обязательные')} · день ${esc(p.dueDay||'—')} · ${esc(p.month||polinaMonth())}</div></div><div class="button-row"><button class="mini-btn" data-action="editPolinaPayment" data-id="${esc(p.id)}">Ред.</button></div></div>`;
  }
  function goPolinaWishes(){ensurePolinaBudgetState();state.settings.lifeFolder='polinaWishes';save();go('spheres');}
  function goPolinaPayments(){ensurePolinaBudgetState();state.settings.lifeFolder='polinaPayments';save();go('spheres');}
  window.goPolinaWishes=goPolinaWishes;
  window.goPolinaPayments=goPolinaPayments;
  try{Object.assign(windowActions,{goPolinaWishes,goPolinaPayments});}catch(e){}

  // If the previous Polina forecast patch did not touch the financial summary, add it once.
  try{
    const probe=summary();
    const alreadyPatched=Object.prototype.hasOwnProperty.call(probe,'polinaForecast');
    if(!alreadyPatched && !window.SBOS_POLINA_DUE_PATCHED){
      const prevDue=dueUntil;
      dueUntil=function(date){return prevDue(date)+polinaDueUntilDate(date);};
      window.SBOS_POLINA_DUE_PATCHED=true;
      const prevSummary=summary;
      summary=function(){const s=prevSummary();s.polinaForecast=polinaBudgetTotal();return s;};
    }else{
      const prevSummary=summary;
      summary=function(){const s=prevSummary();s.polinaForecast=polinaBudgetTotal();return s;};
    }
  }catch(e){}

  function polinaBudgetPanel(){
    ensurePolinaBudgetState();
    const wishes=polinaWishesForBudget();
    const payments=polinaPaymentsForBudget();
    const wSum=polinaWishesTotal();
    const pSum=polinaPaymentsTotal();
    const total=wSum+pSum;
    return `<section class="card polina-budget-visible"><div class="card-head"><div><h3>Полина в бюджете</h3><p class="muted small">хотелки и обязательные платежи, которые влияют на прогноз расхода</p></div><span class="pill violet">${money(total)}</span></div><div class="grid cols-3 polina-budget-summary"><div class="mini-box"><strong>Хотелки</strong><div class="value sm">${money(wSum)}</div><p class="small muted">включены в прогноз месяца</p></div><div class="mini-box"><strong>Обязательные платежи</strong><div class="value sm">${money(pSum)}</div><p class="small muted">учитываются по дню месяца</p></div><div class="mini-box"><strong>Итого Полина</strong><div class="value sm">${money(total)}</div><p class="small muted">эта сумма видна отдельно</p></div></div><div class="grid cols-2" style="margin-top:14px"><div><div class="stat-row"><b>Хотелки Полины</b><button class="mini-btn blue" data-action="goPolinaWishes">Открыть</button></div><div class="note-list">${wishes.slice(0,4).map(rowPolinaWishBudget).join('')||empty('Хотелок в этом месяце пока нет')}</div></div><div><div class="stat-row"><b>Платежи Полины</b><button class="mini-btn blue" data-action="goPolinaPayments">Открыть</button></div><div class="note-list">${payments.slice(0,4).map(rowPolinaPaymentBudget).join('')||empty('Платежей в этом месяце пока нет')}</div></div></div><div class="actions"><button class="btn secondary" data-action="addPolinaWish">Добавить хотелку</button><button class="btn secondary" data-action="addPolinaPayment">Добавить платёж</button></div></section>`;
  }
  window.polinaBudgetPanel=polinaBudgetPanel;

  budgetPage=function(){
    ensurePolinaBudgetState();
    const s=summary();
    const items=budgetStats();
    const used=items.reduce((a,b)=>a+b.spent,0);
    const limit=items.reduce((a,b)=>a+b.limit,0);
    const top=dailySpendSeries().sort((a,b)=>b.amount-a.amount).filter(x=>x.amount>0).slice(0,5);
    const polTotal=polinaBudgetTotal();
    return layout('Бюджет','Расчёт по зарплатному циклу от 10 числа: лимиты, плановые покупки и прогноз Полины.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Цикл бюджета</h3><div class="value sm">10 → 9</div><p class="muted small">расчёт от основной зарплаты</p></article><article class="card"><h3>Можно тратить в день</h3>${dailyLimitBlock(s)}</article><article class="card polina-top-budget"><h3>Полина</h3><div class="value sm">${money(polTotal)}</div><p class="muted small">хотелки + платежи в прогнозе</p><button class="link" data-action="goPolinaWishes">Открыть →</button></article><article class="card"><h3>Плановые покупки</h3><div class="value sm">${money(total(plannedInMonth()))}</div><p class="muted small">включены в бюджет</p></article><article class="card"><h3>Лимиты</h3><div class="value sm">${limit?Math.round(used/limit*100):0}%</div>${progressBar(limit?used/limit*100:0,used>limit?'red':'')}</article></section>${polinaBudgetPanel()}<section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>График трат по дням</h3><span class="pill blue">пики выделены</span></div>${renderDailySpendChart()}${top.length?`<div class="drawer" style="margin-top:12px"><b>Самые дорогие дни</b>${top.map(x=>`<div class="stat-row"><span>${x.day} число</span><b>${money(x.amount)}</b></div>`).join('')}</div>`:''}</article><article class="card"><div class="card-head"><h3>Лимиты по категориям</h3><button class="btn secondary" data-action="addCategory">Категория</button></div>${items.map(budgetRow).join('')||empty('Нет категорий')}</article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Плановые покупки</h3><button class="btn secondary" data-action="addPurchase">Добавить покупку</button></div>${typeof purchaseAdvice==='function'?purchaseAdvice():''}<div class="note-list" style="margin-top:10px">${state.plannedPurchases.map(rowPurchase).join('')||empty('Покупок нет')}</div></section>`);
  };
  window.budgetPage=budgetPage;

  function imageUrlValue(){return String(formVal('f_image')||'').trim();}
  const addTaskImageFix=function(){openModal('Новая задача',`<div class="form-grid">${field('Задача','f_title')}${field('Сфера','f_area','Личное')}${field('Дата','f_due',todayKey(),'date')}${field('Время','f_time','','time')}${field('URL картинки из интернета','f_image','')}<div class="field"><label>Приоритет</label><select id="f_priority"><option value="A">Срочно и важно</option><option value="B" selected>Важно, не срочно</option><option value="C">Срочно, не важно</option><option value="D">Позже / убрать</option></select></div></div><p class="muted small">Картинка будет показана в планировании средним красивым превью.</p>${modalButtons('saveTask')}`)}
  const saveTaskImageFix=function(){state.tasks.unshift({id:uid(),title:formVal('f_title')||'Новая задача',area:formVal('f_area')||'Личное',due:formVal('f_due')||todayKey(),time:formVal('f_time'),image:imageUrlValue(),priority:formVal('f_priority')||'B',status:'В работе'});save(true);closeModal();toast('Задача добавлена');render()}
  const editTaskImageFix=function(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(!t)return;openModal('Редактировать задачу',`<div class="form-grid">${field('Задача','f_title',t.title)}${field('Сфера','f_area',t.area)}${field('Дата','f_due',t.due,'date')}${field('Время','f_time',t.time,'time')}${field('URL картинки из интернета','f_image',t.image||'')}<div class="field"><label>Приоритет / Эйзенхауэр</label><select id="f_priority"><option value="A" ${t.priority==='A'?'selected':''}>Срочно и важно</option><option value="B" ${t.priority==='B'?'selected':''}>Важно, не срочно</option><option value="C" ${t.priority==='C'?'selected':''}>Срочно, не важно</option><option value="D" ${t.priority==='D'?'selected':''}>Позже / убрать</option></select></div></div>${t.image?`<img class="modal-image-preview" src="${esc(t.image)}" alt="" onerror="this.remove()">`:''}<div class="actions"><button class="btn" data-action="saveEditedTask" data-id="${esc(id)}">Сохранить</button><button class="btn red" data-action="deleteTask" data-id="${esc(id)}">Удалить</button></div>`)}
  const saveEditedTaskImageFix=function(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(t){t.title=formVal('f_title');t.area=formVal('f_area');t.due=formVal('f_due');t.time=formVal('f_time');t.image=imageUrlValue();t.priority=formVal('f_priority')}save(true);closeModal();render()}
  const rowTaskImageFix=function(t){
    const hasImg=String(t.image||'').trim();
    const img=hasImg?`<button class="task-cover-button" data-action="editTask" data-id="${esc(t.id)}"><img class="planning-task-image" src="${esc(t.image)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></button>`:'';
    return `<div class="task-card-row planning-image-card ${hasImg?'has-image':''}">${img}<button class="check ${(t.status==='Готово')?'done':''}" data-action="toggleTask" data-id="${esc(t.id)}" title="Готово"></button><button class="task-main" data-action="editTask" data-id="${esc(t.id)}"><span class="row-title">${esc(t.title)}</span><span class="row-sub">${esc(t.area||'Личное')} · ${esc(t.due||'')} ${esc(t.time||'')}</span></button><div class="task-actions">${taskPill(t)}<button class="mini-btn blue compact-action" data-action="googleTask" data-id="${esc(t.id)}">Google</button></div></div>`;
  };
  addTask=addTaskImageFix; saveTask=saveTaskImageFix; editTask=editTaskImageFix; saveEditedTask=saveEditedTaskImageFix; rowTask=rowTaskImageFix;
  window.addTask=addTask; window.saveTask=saveTask; window.editTask=editTask; window.saveEditedTask=saveEditedTask; window.rowTask=rowTask;
  try{Object.assign(windowActions,{addTask,saveTask,editTask,saveEditedTask,goPolinaWishes,goPolinaPayments});}catch(e){}

  const previousRender=render;
  render=function(){ensurePolinaBudgetState(); const out=previousRender.apply(this,arguments); setTimeout(()=>{try{patchClickableButtons()}catch(e){}},0); return out;};
  window.render=render;
  try{save(false);render();}catch(e){console.error('[planning images / polina budget visible fix]',e)}
})();


/* ===== UNIFIED PLANNING + MONTHLY FORECAST — tasks, future spends, wishes, Polina ===== */
(function(){
  const UNIFIED_BUILD='unified-planning-monthly-forecast-20260630';
  try{localStorage.setItem('secondBrainOS.currentBuild',UNIFIED_BUILD);}catch(e){}

  function ensureUnifiedState(){
    state.settings = state.settings || {};
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.calendarEvents = Array.isArray(state.calendarEvents) ? state.calendarEvents : [];
    state.plannedPurchases = Array.isArray(state.plannedPurchases) ? state.plannedPurchases : [];
    state.polinaWishes = Array.isArray(state.polinaWishes) ? state.polinaWishes : [];
    state.polinaPayments = Array.isArray(state.polinaPayments) ? state.polinaPayments : [];
    state.settings.planningOwner = state.settings.planningOwner || 'all';
    state.settings.planningMonth = state.settings.planningMonth || state.settings.currentMonth || monthKey();
    state.plannedPurchases.forEach(p=>{
      if(!p.owner) p.owner='Я';
      if(!p.kind) p.kind='Покупка';
      if(!p.month) p.month=state.settings.currentMonth||monthKey();
    });
    state.polinaWishes.forEach(w=>{w.owner='Полина'; if(!w.month) w.month=state.settings.currentMonth||monthKey();});
    state.polinaPayments.forEach(p=>{p.owner='Полина'; if(!p.month) p.month=state.settings.currentMonth||monthKey();});
  }
  function monthNow(){return state.settings.currentMonth || monthKey();}
  function monthTitle(m){
    const [y,mm]=String(m||monthNow()).split('-').map(Number);
    if(!y||!mm)return esc(m||'—');
    return new Date(y,mm-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
  }
  function addMonth(m,n){
    const [y,mm]=String(m||monthNow()).split('-').map(Number);
    const d=new Date(y||new Date().getFullYear(),(mm||new Date().getMonth()+1)-1+n,1);
    return monthKey(d);
  }
  function monthInput(id,val){return `<div class="field"><label>Месяц</label><input id="${id}" type="month" value="${esc(val||monthNow())}"></div>`;}
  function ownerSelect(id,val='Я'){
    const owners=['Я','Полина','Общее'];
    return `<div class="field"><label>Кому</label><select id="${id}">${owners.map(o=>`<option value="${esc(o)}" ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
  }
  function ownerPill(owner){
    owner=owner||'Я';
    const cls=owner==='Полина'?'violet':owner==='Общее'?'green':'blue';
    return `<span class="pill ${cls}">${esc(owner)}</span>`;
  }
  function includeText(x){return x.includeInBudget===false?'вне прогноза':'в прогнозе';}
  function planningOwnerFilter(){return state.settings.planningOwner||'all';}
  function planningMonthFilter(){return state.settings.planningMonth||monthNow();}
  function setPlanningOwner(owner){state.settings.planningOwner=owner||'all';save(false);render();}
  function setPlanningMonth(){const v=formVal('planningMonthSelect')||monthNow(); state.settings.planningMonth=v; save(false); render();}
  function planOwnerButtons(){
    const cur=planningOwnerFilter();
    return `<div class="button-row plan-tabs"><button class="tab-btn ${cur==='all'?'active':''}" data-action="setPlanningOwner" data-id="all">Все</button><button class="tab-btn ${cur==='Я'?'active':''}" data-action="setPlanningOwner" data-id="Я">Я</button><button class="tab-btn ${cur==='Полина'?'active':''}" data-action="setPlanningOwner" data-id="Полина">Полина</button><button class="tab-btn ${cur==='Общее'?'active':''}" data-action="setPlanningOwner" data-id="Общее">Общее</button></div>`;
  }
  function plannedUnifiedItems(month=planningMonthFilter(), owner=planningOwnerFilter()){
    ensureUnifiedState();
    const items=[];
    state.tasks.filter(t=>!month || String(t.due||'').startsWith(month)).forEach(t=>items.push({source:'task',id:t.id,title:t.title,owner:t.owner||'Я',amount:0,month:String(t.due||'').slice(0,7)||monthNow(),date:t.due,sort:t.due||'9999-99-99',meta:`${t.area||'Личное'} · ${t.time||''}`,kind:'Задача',priority:t.priority||'B',image:t.image||'',include:true}));
    state.calendarEvents.filter(e=>!month || String(e.date||'').startsWith(month)).forEach(e=>items.push({source:'event',id:e.id,title:e.title,owner:e.owner||'Я',amount:0,month:String(e.date||'').slice(0,7)||monthNow(),date:e.date,sort:e.date||'9999-99-99',meta:`${e.area||'Личное'} · ${e.time||''}`,kind:'Событие',priority:'B',include:true}));
    state.plannedPurchases.filter(p=>!month || (p.month||monthNow())===month).forEach(p=>items.push({source:'purchase',id:p.id,title:p.title,owner:p.owner||'Я',amount:num(p.amount),month:p.month||monthNow(),date:p.due||'',sort:p.due||`${p.month||monthNow()}-28`,meta:`${p.category||'Покупки'} · ${includeText(p)}`,kind:p.kind||'Покупка',priority:p.importance||p.priority||'Важно',link:p.link||'',image:p.image||'',include:p.includeInBudget!==false}));
    state.polinaWishes.filter(w=>!month || (w.month||monthNow())===month).forEach(w=>items.push({source:'polinaWish',id:w.id,title:w.title,owner:'Полина',amount:num(w.amount),month:w.month||monthNow(),date:'',sort:`${w.month||monthNow()}-27`,meta:`${w.category||'Хотелка'} · ${includeText(w)}`,kind:'Хотелка',priority:w.priority||'Важно',link:w.link||'',image:w.image||'',include:w.includeInBudget!==false}));
    state.polinaPayments.filter(p=>!month || (p.month||monthNow())===month).forEach(p=>items.push({source:'polinaPayment',id:p.id,title:p.title,owner:'Полина',amount:num(p.amount),month:p.month||monthNow(),date:`${p.month||monthNow()}-${String(num(p.dueDay)||1).padStart(2,'0')}`,sort:`${p.month||monthNow()}-${String(num(p.dueDay)||1).padStart(2,'0')}`,meta:`${p.category||'Обязательный платёж'} · день ${p.dueDay||'—'} · ${p.active===false?'пауза':'активен'}`,kind:'Обязательный платёж',priority:p.active===false?'Пауза':'Важно',include:p.active!==false}));
    return items.filter(x=>owner==='all'||x.owner===owner).sort((a,b)=>String(a.sort).localeCompare(String(b.sort))||String(a.owner).localeCompare(String(b.owner),'ru'));
  }
  function plannedMonthlyTotals(){
    ensureUnifiedState();
    const map=new Map();
    function take(month,owner,amount,type,include=true){
      if(!include || !month) return;
      const row=map.get(month)||{month,total:0,self:0,polina:0,common:0,purchases:0,wishes:0,payments:0};
      const a=num(amount); row.total+=a;
      if(owner==='Полина') row.polina+=a; else if(owner==='Общее') row.common+=a; else row.self+=a;
      if(type==='payment') row.payments+=a; else if(type==='wish') row.wishes+=a; else row.purchases+=a;
      map.set(month,row);
    }
    (state.plannedPurchases||[]).forEach(p=>take(p.month||monthNow(),p.owner||'Я',p.amount,'purchase',p.includeInBudget!==false));
    (state.polinaWishes||[]).forEach(w=>take(w.month||monthNow(),'Полина',w.amount,'wish',w.includeInBudget!==false));
    (state.polinaPayments||[]).forEach(p=>take(p.month||monthNow(),'Полина',p.amount,'payment',p.active!==false));
    // Show current + next 5 months even if empty, then add any manual future months.
    for(let i=0;i<6;i++){const m=addMonth(monthNow(),i); if(!map.has(m))map.set(m,{month:m,total:0,self:0,polina:0,common:0,purchases:0,wishes:0,payments:0});}
    return Array.from(map.values()).sort((a,b)=>String(a.month).localeCompare(String(b.month)));
  }
  function plannedAmountForMonth(m=monthNow()){const row=plannedMonthlyTotals().find(x=>x.month===m); return row?row.total:0;}
  function plannedMonthlyForecastBlock(){
    const rows=plannedMonthlyTotals().slice(0,9);
    return `<section class="card monthly-plan-card"><div class="card-head"><div><h3>Запланированные расходы по месяцам</h3><p class="muted small">Покупки, будущие траты, личные хотелки, хотелки и платежи Полины.</p></div><span class="pill blue">прогноз</span></div><div class="monthly-plan-grid">${rows.map(r=>`<div class="monthly-plan-row ${r.month===monthNow()?'current':''}"><div><strong>${monthTitle(r.month)}</strong><div class="row-sub">Я: ${money(r.self)} · Полина: ${money(r.polina)} · Общее: ${money(r.common)}</div></div><div class="monthly-total">${money(r.total)}</div></div>`).join('')}</div></section>`;
  }
  function sourceTone(source,priority){
    if(source==='polinaPayment') return 'violet';
    if(source==='polinaWish') return 'violet';
    if(priority==='Очень важно'||priority==='A') return 'red';
    if(priority==='Важно'||priority==='B') return 'amber';
    return 'blue';
  }
  function rowUnifiedPlanItem(x){
    const img=x.image?`<img class="unified-plan-image" src="${esc(x.image)}" loading="lazy" alt="" onerror="this.remove()">`:'';
    const action=x.source==='task'?'editTask':x.source==='event'?'editEvent':x.source==='purchase'?'editPurchase':x.source==='polinaWish'?'editPolinaWish':'editPolinaPayment';
    const dateLine=x.date?`${esc(x.date)} · `:'';
    const link=x.link?`<a class="mini-btn blue" href="${esc(x.link)}" target="_blank" rel="noopener">Ссылка</a>`:'';
    return `<div class="unified-plan-item ${x.source}">${img}<div class="unified-plan-main"><div class="unified-plan-top"><span class="pill ${sourceTone(x.source,x.priority)}">${esc(x.kind)}</span>${ownerPill(x.owner)}${x.amount?`<span class="pill green">${money(x.amount)}</span>`:''}</div><div class="row-title">${esc(x.title||'Пункт плана')}</div><div class="row-sub">${dateLine}${esc(monthTitle(x.month))} · ${esc(x.meta||'')}</div></div><div class="button-row unified-plan-actions">${link}<button class="mini-btn" data-action="${action}" data-id="${esc(x.id)}">Ред.</button></div></div>`;
  }
  function unifiedPlanningPanel(){
    ensureUnifiedState();
    const m=planningMonthFilter();
    const owner=planningOwnerFilter();
    const items=plannedUnifiedItems(m,owner);
    const moneyTotal=items.reduce((a,b)=>a+(b.include?num(b.amount):0),0);
    const taskCount=items.filter(x=>x.source==='task'||x.source==='event').length;
    return `<section class="grid cols-4 planning-summary"><article class="card premium-hero-card"><h3>Единая папка планирования</h3><div class="value sm">${items.length}</div><p class="muted small">задачи, события, покупки, хотелки и платежи</p></article><article class="card"><h3>План расходов</h3><div class="value sm blue">${money(moneyTotal)}</div><p class="muted small">на ${monthTitle(m)}</p></article><article class="card"><h3>Дела</h3><div class="value sm">${taskCount}</div><p class="muted small">задачи + календарь</p></article><article class="card"><h3>Фильтр</h3><div class="field" style="margin:0"><input id="planningMonthSelect" type="month" value="${esc(m)}" data-action="setPlanningMonth"></div>${planOwnerButtons()}</article></section><section class="card" style="margin-top:18px"><div class="card-head"><div><h3>Все запланированное</h3><p class="muted small">У каждого пункта есть пометка, кому он относится: Я, Полина или Общее.</p></div><div class="button-row" style="margin-top:0"><button class="btn secondary" data-action="addTask">Задача</button><button class="btn secondary" data-action="addPurchase">Покупка / трата</button><button class="btn secondary" data-action="addPolinaWish">Хотелка Полины</button><button class="btn secondary" data-action="addPolinaPayment">Платёж Полины</button></div></div><div class="unified-plan-list">${items.map(rowUnifiedPlanItem).join('')||empty('На этот месяц ничего не запланировано')}</div></section>`;
  }

  // Purchases now carry owner + optional link/image and stay compatible with the old budget section.
  addPurchase=function(){openModal('Плановая покупка / будущая трата',`<div class="form-grid">${field('Что купить / оплатить','f_title')}${ownerSelect('f_owner','Я')}${field('Категория','f_category','Покупки')}${field('Сумма','f_amount','','number')}${monthInput('f_month',monthNow())}<div class="field"><label>Тип</label><select id="f_kind"><option>Покупка</option><option>Хотелка</option><option>Будущая трата</option><option>Обязательный платёж</option></select></div><div class="field"><label>Важность</label><select id="f_importance"><option>Очень важно</option><option selected>Важно</option><option>Можно позже</option></select></div><div class="field"><label>Учитывать в прогнозе</label><select id="f_include"><option value="true">Да</option><option value="false">Нет</option></select></div>${field('Ссылка','f_link','')}${field('URL картинки','f_image','')}${area('Комментарий','f_note')}</div>${modalButtons('savePurchase')}`)};
  savePurchase=function(){
    const owner=formVal('f_owner')||'Я';
    if(owner==='Полина' && formVal('f_kind')==='Хотелка'){
      state.polinaWishes.unshift({id:uid(),title:formVal('f_title')||'Хотелка Полины',amount:num(formVal('f_amount')),category:formVal('f_category')||'Подарки',month:formVal('f_month')||monthNow(),priority:formVal('f_importance')||'Важно',includeInBudget:formVal('f_include')!=='false',link:formVal('f_link'),image:formVal('f_image'),note:formVal('f_note'),owner:'Полина'});
    }else{
      state.plannedPurchases.unshift({id:uid(),title:formVal('f_title')||'Покупка',owner,kind:formVal('f_kind')||'Покупка',category:formVal('f_category')||'Покупки',amount:num(formVal('f_amount')),month:formVal('f_month')||monthNow(),importance:formVal('f_importance')||'Важно',includeInBudget:formVal('f_include')!=='false',link:formVal('f_link'),image:formVal('f_image'),note:formVal('f_note')});
    }
    save(true);closeModal();toast('Пункт добавлен в планирование');render();
  };
  editPurchase=function(id){const p=state.plannedPurchases.find(x=>String(x.id)===String(id));if(!p)return;openModal('Редактировать покупку / будущую трату',`<div class="form-grid">${field('Что купить / оплатить','f_title',p.title)}${ownerSelect('f_owner',p.owner||'Я')}${field('Категория','f_category',p.category)}${field('Сумма','f_amount',p.amount,'number')}${monthInput('f_month',p.month||monthNow())}<div class="field"><label>Тип</label><select id="f_kind"><option ${p.kind==='Покупка'?'selected':''}>Покупка</option><option ${p.kind==='Хотелка'?'selected':''}>Хотелка</option><option ${p.kind==='Будущая трата'?'selected':''}>Будущая трата</option><option ${p.kind==='Обязательный платёж'?'selected':''}>Обязательный платёж</option></select></div><div class="field"><label>Важность</label><select id="f_importance"><option ${p.importance==='Очень важно'?'selected':''}>Очень важно</option><option ${p.importance==='Важно'?'selected':''}>Важно</option><option ${p.importance==='Можно позже'?'selected':''}>Можно позже</option></select></div><div class="field"><label>Учитывать в прогнозе</label><select id="f_include"><option value="true" ${p.includeInBudget!==false?'selected':''}>Да</option><option value="false" ${p.includeInBudget===false?'selected':''}>Нет</option></select></div>${field('Ссылка','f_link',p.link||'')}${field('URL картинки','f_image',p.image||'')}${area('Комментарий','f_note',p.note||'')}</div>${p.image?`<img class="modal-image-preview" src="${esc(p.image)}" alt="" onerror="this.remove()">`:''}<div class="actions"><button class="btn" data-action="saveEditedPurchase" data-id="${esc(id)}">Сохранить</button><button class="btn red" data-action="deletePurchase" data-id="${esc(id)}">Удалить</button></div>`)};
  saveEditedPurchase=function(id){const p=state.plannedPurchases.find(x=>String(x.id)===String(id));if(p){p.title=formVal('f_title');p.owner=formVal('f_owner')||'Я';p.kind=formVal('f_kind')||'Покупка';p.category=formVal('f_category');p.amount=num(formVal('f_amount'));p.month=formVal('f_month')||monthNow();p.importance=formVal('f_importance');p.includeInBudget=formVal('f_include')!=='false';p.link=formVal('f_link');p.image=formVal('f_image');p.note=formVal('f_note')}save(true);closeModal();render()};
  rowPurchase=function(p){return `<div class="list-row"><span class="pill ${p.importance==='Очень важно'?'red':p.importance==='Важно'?'amber':'blue'}">${esc(p.importance||'Важно')}</span>${ownerPill(p.owner||'Я')}<div><div class="row-title">${esc(p.title)} · ${money(p.amount)}</div><div class="row-sub">${esc(p.kind||'Покупка')} · ${esc(p.category)} · ${esc(p.month)} · ${p.includeInBudget!==false?'в прогнозе':'вне прогноза'}</div></div><div class="button-row">${p.link?`<a class="mini-btn blue" href="${esc(p.link)}" target="_blank" rel="noopener">Ссылка</a>`:''}<button class="mini-btn" data-action="editPurchase" data-id="${esc(p.id)}">Ред.</button><button class="mini-btn red" data-action="deletePurchase" data-id="${esc(p.id)}">Удалить</button></div></div>`};

  const oldAddPolinaWish = typeof addPolinaWish==='function' ? addPolinaWish : null;
  // Keep existing Polina modal, but add a tiny guarantee that new wishes have owner.
  const oldSavePolinaWish = typeof savePolinaWish==='function' ? savePolinaWish : null;
  if(oldSavePolinaWish){
    savePolinaWish=function(){oldSavePolinaWish(); try{(state.polinaWishes||[])[0].owner='Полина'; save(false);}catch(e){}};
  }

  planningPage=function(){ensureUnifiedState();return layout('Планирование','Единая папка: дела, календарь, будущие траты, желания и обязательные платежи с пометкой кому.',`${unifiedPlanningPanel()}<section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Матрица Эйзенхауэра</h3><span class="pill blue">задачи</span></div>${eisenhowerMatrix()}</article>${plannedMonthlyForecastBlock()}</section>`)};
  planningPageInner=function(){ensureUnifiedState(); return `<div>${unifiedPlanningPanel()}${plannedMonthlyForecastBlock()}</div>`;};

  const previousFinancePage = financePage;
  financePage=function(){ensureUnifiedState(); let html=previousFinancePage(); const block=plannedMonthlyForecastBlock(); const idx=html.lastIndexOf('</div>'); return idx>0?html.slice(0,idx)+block+html.slice(idx):html+block;};

  const previousBudgetPage = budgetPage;
  budgetPage=function(){ensureUnifiedState(); let html=previousBudgetPage(); const block=`<section class="card" style="margin-top:18px"><div class="card-head"><div><h3>План расходов месяца</h3><p class="muted small">Единая сумма из планирования: личные покупки, хотелки, траты, Полина и общие пункты.</p></div><span class="pill green">${money(plannedAmountForMonth(monthNow()))}</span></div>${plannedMonthlyForecastBlock().replace('<section class="card monthly-plan-card">','<div class="monthly-plan-card-inner">').replace('</section>','</div>')}</section>`; const idx=html.lastIndexOf('</div>'); return idx>0?html.slice(0,idx)+block+html.slice(idx):html+block;};

  window.setPlanningOwner=setPlanningOwner; window.setPlanningMonth=setPlanningMonth; window.addPurchase=addPurchase; window.savePurchase=savePurchase; window.editPurchase=editPurchase; window.saveEditedPurchase=saveEditedPurchase; window.rowPurchase=rowPurchase; window.planningPage=planningPage; window.planningPageInner=planningPageInner; window.financePage=financePage; window.budgetPage=budgetPage;
  try{Object.assign(windowActions,{setPlanningOwner,setPlanningMonth,addPurchase,savePurchase,editPurchase,saveEditedPurchase});}catch(e){}
  if(window.SBOS_FORCE_ACTION){
    const prevForce=window.SBOS_FORCE_ACTION;
    window.SBOS_FORCE_ACTION=function(action,id,el){
      if(action==='setPlanningOwner'){setPlanningOwner(id || el?.dataset?.id || 'all');return true;}
      if(action==='setPlanningMonth'){setPlanningMonth();return true;}
      return prevForce(action,id,el);
    };
  }
  document.addEventListener('change',function(ev){const el=ev.target;if(el&&el.id==='planningMonthSelect')setPlanningMonth();},true);
  try{ensureUnifiedState();save(false);render();}catch(e){console.error('[unified planning forecast]',e)}
})();

/* ===== UNIFIED PLANNING OWNER MARKERS FOR TASKS ===== */
(function(){
  function ownerSelectTask(id,val='Я'){
    const owners=['Я','Полина','Общее'];
    return `<div class="field"><label>Кому</label><select id="${id}">${owners.map(o=>`<option value="${esc(o)}" ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
  }
  function ownerPillTask(owner){owner=owner||'Я'; const cls=owner==='Полина'?'violet':owner==='Общее'?'green':'blue'; return `<span class="pill ${cls}">${esc(owner)}</span>`;}
  function imageUrlValueTask(){return String(formVal('f_image')||'').trim();}
  addTask=function(){openModal('Новая задача',`<div class="form-grid">${field('Задача','f_title')}${ownerSelectTask('f_owner','Я')}${field('Сфера','f_area','Личное')}${field('Дата','f_due',todayKey(),'date')}${field('Время','f_time','','time')}${field('URL картинки из интернета','f_image','')}<div class="field"><label>Приоритет</label><select id="f_priority"><option value="A">Срочно и важно</option><option value="B" selected>Важно, не срочно</option><option value="C">Срочно, не важно</option><option value="D">Позже / убрать</option></select></div></div><p class="muted small">Картинка будет показана в планировании средним красивым превью.</p>${modalButtons('saveTask')}`)};
  saveTask=function(){state.tasks.unshift({id:uid(),title:formVal('f_title')||'Новая задача',owner:formVal('f_owner')||'Я',area:formVal('f_area')||'Личное',due:formVal('f_due')||todayKey(),time:formVal('f_time'),image:imageUrlValueTask(),priority:formVal('f_priority')||'B',status:'В работе'});save(true);closeModal();toast('Задача добавлена');render()};
  editTask=function(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(!t)return;openModal('Редактировать задачу',`<div class="form-grid">${field('Задача','f_title',t.title)}${ownerSelectTask('f_owner',t.owner||'Я')}${field('Сфера','f_area',t.area)}${field('Дата','f_due',t.due,'date')}${field('Время','f_time',t.time,'time')}${field('URL картинки из интернета','f_image',t.image||'')}<div class="field"><label>Приоритет / Эйзенхауэр</label><select id="f_priority"><option value="A" ${t.priority==='A'?'selected':''}>Срочно и важно</option><option value="B" ${t.priority==='B'?'selected':''}>Важно, не срочно</option><option value="C" ${t.priority==='C'?'selected':''}>Срочно, не важно</option><option value="D" ${t.priority==='D'?'selected':''}>Позже / убрать</option></select></div></div>${t.image?`<img class="modal-image-preview" src="${esc(t.image)}" alt="" onerror="this.remove()">`:''}<div class="actions"><button class="btn" data-action="saveEditedTask" data-id="${esc(id)}">Сохранить</button><button class="btn red" data-action="deleteTask" data-id="${esc(id)}">Удалить</button></div>`)};
  saveEditedTask=function(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(t){t.title=formVal('f_title');t.owner=formVal('f_owner')||'Я';t.area=formVal('f_area');t.due=formVal('f_due');t.time=formVal('f_time');t.image=imageUrlValueTask();t.priority=formVal('f_priority')}save(true);closeModal();render()};
  rowTask=function(t){
    const hasImg=String(t.image||'').trim();
    const img=hasImg?`<button class="task-cover-button" data-action="editTask" data-id="${esc(t.id)}"><img class="planning-task-image" src="${esc(t.image)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></button>`:'';
    return `<div class="task-card-row planning-image-card ${hasImg?'has-image':''}">${img}<button class="check ${(t.status==='Готово')?'done':''}" data-action="toggleTask" data-id="${esc(t.id)}" title="Готово"></button><button class="task-main" data-action="editTask" data-id="${esc(t.id)}"><span class="row-title">${esc(t.title)}</span><span class="row-sub">${esc(t.area||'Личное')} · ${esc(t.due||'')} ${esc(t.time||'')}</span></button><div class="task-actions">${ownerPillTask(t.owner||'Я')}${taskPill(t)}<button class="mini-btn blue compact-action" data-action="googleTask" data-id="${esc(t.id)}">Google</button></div></div>`;
  };
  window.addTask=addTask; window.saveTask=saveTask; window.editTask=editTask; window.saveEditedTask=saveEditedTask; window.rowTask=rowTask;
  try{Object.assign(windowActions,{addTask,saveTask,editTask,saveEditedTask});}catch(e){}
  try{render();}catch(e){}
})();

/* ===== FINAL WISHLIST + PAYMENTS + DAILY INTERVIEW NOTEBOOK — no Polina category ===== */
(function(){
  const FINAL_BUILD='wishlist-payments-daily-interview-20260630';
  try{localStorage.setItem('secondBrainOS.currentBuild',FINAL_BUILD);localStorage.setItem('secondBrainOS.finalAddonBuild',FINAL_BUILD);}catch(e){}

  function arr(k){ if(!Array.isArray(state[k])) state[k]=[]; return state[k]; }
  function txt(v){ return String(v||'').trim(); }
  function curMonth(){ return (state.settings&&state.settings.currentMonth) || monthKey(); }
  function asMoney(v){ try{return money(v)}catch(e){return `${Math.round(Number(v)||0).toLocaleString('ru-RU')} ₽`; } }
  function byId(id){ return state.plannedPurchases.find(x=>String(x.id)===String(id)); }
  function finalKind(v){ v=String(v||'').trim(); if(/хотел/i.test(v))return 'Вишлист'; if(!v)return 'Покупка'; return v; }
  function isTemplateItem(x){
    const s=`${x.title||''} ${x.note||''}`.toLowerCase();
    return s.includes('пример хотелки') || s.includes('добавь реальные платежи полины') || (s.includes('обязательный платёж полины') && !num(x.amount));
  }
  function planItems(){ return arr('plannedPurchases'); }
  function includedPlanItems(m){ return planItems().filter(p=>(!m || (p.month||curMonth())===m) && p.includeInBudget!==false && p.active!==false); }
  function planTotal(m){ return includedPlanItems(m).reduce((a,b)=>a+num(b.amount),0); }
  function wishItems(m){ return planItems().filter(p=>finalKind(p.kind)==='Вишлист' && (!m || (p.month||curMonth())===m)); }
  function paymentItems(m){ return planItems().filter(p=>finalKind(p.kind)==='Обязательный платёж' && (!m || (p.month||curMonth())===m)); }

  function normalizeFinalPlanningState(){
    state.settings=state.settings||{};
    arr('plannedPurchases'); arr('polinaWishes'); arr('polinaPayments'); arr('subconsciousDiary'); arr('notes'); arr('habits');
    state.plannedPurchases=state.plannedPurchases.filter(p=>!isTemplateItem(p)).map(p=>{
      if(!p.id)p.id=uid();
      p.kind=finalKind(p.kind);
      if(!p.owner)p.owner='Я';
      if(!p.month)p.month=curMonth();
      if(p.includeInBudget===undefined)p.includeInBudget=true;
      if(p.kind==='Обязательный платёж' && !p.category)p.category='Обязательные платежи';
      if(p.kind==='Вишлист' && !p.category)p.category='Вишлист';
      return p;
    });
    const existing=new Set(state.plannedPurchases.map(p=>String(p.legacyKey||p.id)));
    state.polinaWishes.filter(w=>!isTemplateItem(w)).forEach(w=>{
      const key='polinaWish:'+String(w.id||`${w.title}|${w.amount}|${w.month}`);
      if(existing.has(key))return;
      state.plannedPurchases.unshift({id:uid(),legacyKey:key,title:w.title||'Пункт вишлиста',owner:w.owner||'Полина',kind:'Вишлист',category:w.category||'Вишлист',amount:num(w.amount),month:w.month||curMonth(),importance:w.priority||w.importance||'Важно',includeInBudget:w.includeInBudget!==false,link:w.link||'',image:w.image||'',note:w.note||''});
      existing.add(key);
    });
    state.polinaPayments.filter(p=>!isTemplateItem(p)).forEach(p=>{
      const key='polinaPayment:'+String(p.id||`${p.title}|${p.amount}|${p.month}`);
      if(existing.has(key))return;
      state.plannedPurchases.unshift({id:uid(),legacyKey:key,title:p.title||'Обязательный платёж',owner:p.owner||'Полина',kind:'Обязательный платёж',category:p.category||'Обязательные платежи',amount:num(p.amount),month:p.month||curMonth(),dueDay:num(p.dueDay)||10,importance:'Важно',includeInBudget:p.active!==false,active:p.active!==false,note:p.note||''});
      existing.add(key);
    });
    // Старые отдельные массивы очищаем, чтобы шаблоны «Полины» не возвращались и не двоили прогноз.
    state.polinaWishes=[];
    state.polinaPayments=[];
    dailyInterviewHabit();
  }

  function finalPlannedInMonth(m=curMonth()){ normalizeFinalPlanningState(); return includedPlanItems(m); }
  plannedInMonth=function(){ return finalPlannedInMonth(curMonth()); };
  window.plannedInMonth=plannedInMonth;

  dueUntil=function(date){
    normalizeFinalPlanningState();
    const d=new Date(date||todayKey());
    const m=monthKey(d);
    const p=planItems().filter(x=>x.includeInBudget!==false && x.active!==false && (!x.due || x.due<=date) && (!x.month || x.month<=m)).reduce((a,b)=>a+num(b.amount),0);
    const debts=(typeof activeOwe==='function'?activeOwe():activeDebts().filter(x=>String(x.direction||'owe')==='owe')).filter(x=>x.due&&x.due<=date).reduce((a,b)=>a+num(b.amount),0);
    return p+debts;
  };
  window.dueUntil=dueUntil;

  const prevSummaryFinal=summary;
  summary=function(){
    normalizeFinalPlanningState();
    const s=prevSummaryFinal?prevSummaryFinal():{};
    s.planned=planTotal(curMonth());
    s.polinaForecast=0;
    if(s.nextSalary&&s.nextSalary.date){
      s.obligations=dueUntil(s.nextSalary.date);
      s.toNext=(s.actual||0)-s.obligations;
      s.dailyLimit=Math.max(0,Math.floor((s.toNext||0)/Math.max(1,s.daysToSalary||1)));
      s.dailyLimitReason=s.dailyLimit===0?'свободного остатка до зарплаты нет: учтены долги и все пункты планирования':'расчёт от фактического остатка, долгов и единого планирования';
    }
    return s;
  };
  window.summary=summary;

  function ownerSelectFinal(id,val='Я'){
    const owners=['Я','Полина','Общее'];
    return `<div class="field"><label>Кому принадлежит</label><select id="${id}">${owners.map(o=>`<option value="${esc(o)}" ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
  }
  function monthField(id,val){ return `<div class="field"><label>Месяц</label><input id="${id}" type="month" value="${esc(val||curMonth())}"></div>`; }
  function kindSelectFinal(val='Покупка'){
    const kinds=['Покупка','Вишлист','Будущая трата','Обязательный платёж'];
    return `<div class="field"><label>Тип</label><select id="f_kind">${kinds.map(k=>`<option value="${esc(k)}" ${k===finalKind(val)?'selected':''}>${esc(k)}</option>`).join('')}</select></div>`;
  }
  function prioritySelect(val='Важно'){
    const list=['Очень важно','Важно','Можно позже'];
    return `<div class="field"><label>Важность</label><select id="f_importance">${list.map(x=>`<option ${x===val?'selected':''}>${esc(x)}</option>`).join('')}</select></div>`;
  }
  function includeSelect(val=true){ return `<div class="field"><label>Учитывать в прогнозе</label><select id="f_include"><option value="true" ${val!==false?'selected':''}>Да</option><option value="false" ${val===false?'selected':''}>Нет</option></select></div>`; }
  function imagePicker(id='f_image',value=''){
    value=String(value||'');
    return `<div class="field image-picker-field"><label>Картинка</label><input id="${id}" type="hidden" value="${esc(value)}"><div class="image-picker-box ${value?'has-image':''}" data-image-box="${id}"><div class="image-picker-preview" data-image-preview="${id}">${value?`<img src="${esc(value)}" alt="" onerror="this.remove()">`:`<div class="image-picker-empty"><b>＋</b><span>Добавить картинку</span><small>с устройства, не ссылкой</small></div>`}</div><div class="button-row"><label class="mini-btn blue image-upload-label">＋ Загрузить<input type="file" accept="image/*" data-image-file="${id}"></label><button class="mini-btn" data-action="clearImageField" data-id="${id}" type="button">− Убрать</button></div></div></div>`;
  }
  function setImageField(id,value){
    const input=document.getElementById(id); if(input) input.value=value||'';
    const preview=document.querySelector(`[data-image-preview="${id}"]`);
    const box=document.querySelector(`[data-image-box="${id}"]`);
    if(preview){ preview.innerHTML=value?`<img src="${value}" alt="">`:`<div class="image-picker-empty"><b>＋</b><span>Добавить картинку</span><small>с устройства, не ссылкой</small></div>`; }
    if(box) box.classList.toggle('has-image',!!value);
  }
  function clearImageField(id){ setImageField(id,''); }
  window.clearImageField=clearImageField;

  function compressImageFile(file,cb){
    if(!file || !file.type || !file.type.startsWith('image/'))return;
    const reader=new FileReader();
    reader.onload=function(){
      const img=new Image();
      img.onload=function(){
        const max=1100;
        let w=img.width,h=img.height;
        if(w>max || h>max){ const k=Math.min(max/w,max/h); w=Math.round(w*k); h=Math.round(h*k); }
        const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
        cb(canvas.toDataURL('image/jpeg',0.84));
      };
      img.onerror=function(){ cb(String(reader.result||'')); };
      img.src=String(reader.result||'');
    };
    reader.readAsDataURL(file);
  }
  document.addEventListener('change',function(ev){
    const el=ev.target&&ev.target.closest?ev.target.closest('[data-image-file]'):null;
    if(!el||!el.files||!el.files[0])return;
    const id=el.dataset.imageFile;
    compressImageFile(el.files[0],function(data){ setImageField(id,data); });
  },true);

  function openPlanItemModal(item={},presetKind){
    const e=item||{};
    const kind=finalKind(presetKind||e.kind||'Покупка');
    openModal(e.id?'Редактировать пункт планирования':(kind==='Вишлист'?'Добавить вишлист':kind==='Обязательный платёж'?'Добавить обязательный платёж':'Добавить покупку / трату'),
      `<div class="form-grid">${field(kind==='Вишлист'?'Что хочется / нужно':'Название','f_title',e.title||'')}${ownerSelectFinal('f_owner',e.owner||'Я')}${kindSelectFinal(kind)}${field('Категория / подпапка','f_category',e.category||(kind==='Вишлист'?'Вишлист':kind==='Обязательный платёж'?'Обязательные платежи':'Покупки'))}${field('Сумма','f_amount',e.amount||'', 'number')}${monthField('f_month',e.month||curMonth())}${field('День месяца для платежа','f_dueDay',e.dueDay||'', 'number')}${prioritySelect(e.importance||e.priority||'Важно')}${includeSelect(e.includeInBudget!==false)}${field('Ссылка на товар / страницу','f_link',e.link||'')}${imagePicker('f_image',e.image||'')}${area('Комментарий','f_note',e.note||'')}</div><div class="actions"><button class="btn" data-action="${e.id?'saveEditedPurchase':'savePurchase'}" ${e.id?`data-id="${esc(e.id)}"`:''}>Сохранить</button>${e.id?`<button class="btn red" data-action="deletePurchase" data-id="${esc(e.id)}">Удалить</button>`:''}</div>`
    );
  }
  addPurchase=function(){ openPlanItemModal({},'Покупка'); };
  function addWishlistItem(){ openPlanItemModal({},'Вишлист'); }
  function addPaymentItem(){ openPlanItemModal({},'Обязательный платёж'); }
  savePurchase=function(){
    normalizeFinalPlanningState();
    const kind=finalKind(formVal('f_kind'));
    state.plannedPurchases.unshift({id:uid(),title:formVal('f_title')||(kind==='Вишлист'?'Пункт вишлиста':'Пункт плана'),owner:formVal('f_owner')||'Я',kind,category:formVal('f_category')||(kind==='Вишлист'?'Вишлист':'Покупки'),amount:num(formVal('f_amount')),month:formVal('f_month')||curMonth(),dueDay:num(formVal('f_dueDay'))||'',importance:formVal('f_importance')||'Важно',includeInBudget:formVal('f_include')!=='false',active:formVal('f_include')!=='false',link:formVal('f_link'),image:formVal('f_image'),note:formVal('f_note')});
    save(true); closeModal(); toast('Добавлено в единое планирование'); render();
  };
  editPurchase=function(id){ const p=byId(id); if(!p)return toast('Пункт не найден'); openPlanItemModal(p); };
  saveEditedPurchase=function(id){
    normalizeFinalPlanningState();
    const p=byId(id); if(!p)return toast('Пункт не найден');
    p.title=formVal('f_title')||p.title; p.owner=formVal('f_owner')||'Я'; p.kind=finalKind(formVal('f_kind')); p.category=formVal('f_category'); p.amount=num(formVal('f_amount')); p.month=formVal('f_month')||curMonth(); p.dueDay=num(formVal('f_dueDay'))||''; p.importance=formVal('f_importance')||'Важно'; p.includeInBudget=formVal('f_include')!=='false'; p.active=p.includeInBudget; p.link=formVal('f_link'); p.image=formVal('f_image'); p.note=formVal('f_note');
    save(true); closeModal(); render();
  };
  deletePurchase=function(id){
    normalizeFinalPlanningState();
    const before=state.plannedPurchases.length;
    state.plannedPurchases=state.plannedPurchases.filter(x=>String(x.id)!==String(id));
    if(state.plannedPurchases.length===before)return toast('Пункт не найден');
    save(true); toast('Удалено из планирования'); render();
  };
  // Старые действия оставляем как совместимые алиасы, но они больше не создают отдельную категорию Полины.
  addPolinaWish=function(){ openPlanItemModal({owner:'Полина'},'Вишлист'); };
  savePolinaWish=savePurchase;
  editPolinaWish=editPurchase;
  saveEditedPolinaWish=saveEditedPurchase;
  deletePolinaWish=deletePurchase;
  addPolinaPayment=function(){ openPlanItemModal({owner:'Полина'},'Обязательный платёж'); };
  savePolinaPayment=savePurchase;
  editPolinaPayment=editPurchase;
  saveEditedPolinaPayment=saveEditedPurchase;
  deletePolinaPayment=deletePurchase;

  function ownerPillFinal(owner){ owner=owner||'Я'; const cls=owner==='Полина'?'violet':owner==='Общее'?'green':'blue'; return `<span class="pill ${cls}">${esc(owner)}</span>`; }
  function kindTone(kind){ kind=finalKind(kind); return kind==='Вишлист'?'violet':kind==='Обязательный платёж'?'red':kind==='Будущая трата'?'amber':'green'; }
  function rowPurchase(p){
    p.kind=finalKind(p.kind);
    const img=p.image?`<img class="unified-plan-image" src="${esc(p.image)}" loading="lazy" alt="" onerror="this.remove()">`:'';
    return `<div class="unified-plan-item final-plan-row ${p.kind==='Вишлист'?'wishlist':p.kind==='Обязательный платёж'?'payment':'purchase'}">${img}<div class="unified-plan-main"><div class="unified-plan-top"><span class="pill ${kindTone(p.kind)}">${esc(p.kind)}</span>${ownerPillFinal(p.owner)}${p.amount?`<span class="pill green">${asMoney(p.amount)}</span>`:''}</div><div class="row-title">${esc(p.title||'Пункт плана')}</div><div class="row-sub">${esc(p.category||'Без категории')} · ${esc(monthTitleFinal(p.month||curMonth()))} · ${p.includeInBudget!==false?'в прогнозе':'вне прогноза'}${p.dueDay?` · день ${esc(p.dueDay)}`:''}</div></div><div class="button-row unified-plan-actions">${p.link?`<a class="mini-btn blue" href="${esc(p.link)}" target="_blank" rel="noopener">Ссылка</a>`:''}<button class="mini-btn" data-action="editPurchase" data-id="${esc(p.id)}">Ред.</button><button class="mini-btn red" data-action="deletePurchase" data-id="${esc(p.id)}">Удалить</button></div></div>`;
  }
  window.rowPurchase=rowPurchase;

  function monthTitleFinal(m){
    const [y,mm]=String(m||curMonth()).split('-').map(Number);
    if(!y||!mm)return esc(m||'—');
    return new Date(y,mm-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
  }
  function addMonthFinal(m,shift){ const [y,mm]=String(m||curMonth()).split('-').map(Number); const d=new Date(y||new Date().getFullYear(),(mm||new Date().getMonth()+1)-1+shift,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
  function monthlyPlanRows(){
    normalizeFinalPlanningState();
    const map=new Map();
    const take=(p)=>{
      if(p.includeInBudget===false || p.active===false)return;
      const m=p.month||curMonth();
      if(!map.has(m))map.set(m,{month:m,total:0,self:0,polina:0,common:0,wishlist:0,payments:0,purchases:0});
      const r=map.get(m), a=num(p.amount); r.total+=a;
      if(p.owner==='Полина')r.polina+=a; else if(p.owner==='Общее')r.common+=a; else r.self+=a;
      if(finalKind(p.kind)==='Вишлист')r.wishlist+=a; else if(finalKind(p.kind)==='Обязательный платёж')r.payments+=a; else r.purchases+=a;
    };
    planItems().forEach(take);
    for(let i=0;i<6;i++){const m=addMonthFinal(curMonth(),i); if(!map.has(m))map.set(m,{month:m,total:0,self:0,polina:0,common:0,wishlist:0,payments:0,purchases:0});}
    return Array.from(map.values()).sort((a,b)=>a.month.localeCompare(b.month));
  }
  function monthlyForecastBlock(){
    const rows=monthlyPlanRows();
    return `<section class="card monthly-plan-card"><div class="card-head"><div><h3>Запланированные расходы по месяцам</h3><p class="muted small">Единая сумма: покупки, вишлист, будущие траты и обязательные платежи. У каждого пункта есть владелец.</p></div><span class="pill green">${asMoney(planTotal(curMonth()))}</span></div><div class="monthly-plan-grid">${rows.map(r=>`<div class="monthly-plan-row ${r.month===curMonth()?'current':''}"><div><strong>${monthTitleFinal(r.month)}</strong><div class="row-sub">Я: ${asMoney(r.self)} · Полина: ${asMoney(r.polina)} · Общее: ${asMoney(r.common)}</div><div class="row-sub">Вишлист: ${asMoney(r.wishlist)} · Платежи: ${asMoney(r.payments)} · Покупки/траты: ${asMoney(r.purchases)}</div></div><div class="monthly-total">${asMoney(r.total)}</div></div>`).join('')}</div></section>`;
  }

  function getUnifiedItems(){
    normalizeFinalPlanningState();
    const m=state.settings.planningMonth||curMonth();
    const owner=state.settings.planningOwner||'all';
    const kind=state.settings.planningKind||'all';
    const items=[];
    arr('tasks').forEach(t=>items.push({source:'task',id:t.id,title:t.title,owner:t.owner||'Я',kind:'Задача',amount:0,month:(t.due||curMonth()).slice(0,7)||curMonth(),date:t.due||'',time:t.time||'',meta:t.area||'Личное',image:t.image||'',include:true,priority:t.priority||'B'}));
    arr('calendarEvents').forEach(e=>items.push({source:'event',id:e.id,title:e.title,owner:e.owner||'Общее',kind:'Событие',amount:0,month:(e.date||curMonth()).slice(0,7)||curMonth(),date:e.date||'',time:e.time||'',meta:e.area||'Календарь',image:e.image||'',include:true,priority:'B'}));
    planItems().forEach(p=>items.push({source:'purchase',id:p.id,title:p.title,owner:p.owner||'Я',kind:finalKind(p.kind),amount:num(p.amount),month:p.month||curMonth(),date:p.due||'',time:'',meta:`${p.category||'Без категории'} · ${p.includeInBudget!==false?'в прогнозе':'вне прогноза'}`,image:p.image||'',link:p.link||'',include:p.includeInBudget!==false,priority:p.importance||'Важно'}));
    return items.filter(x=>(!m || x.month===m) && (owner==='all' || x.owner===owner) && (kind==='all' || x.kind===kind));
  }
  function setPlanningKind(id){ state.settings.planningKind=id||'all'; save(true); render(); }
  function planKindTabs(){ const cur=state.settings.planningKind||'all'; const tabs=[['all','Все'],['Задача','Задачи'],['Событие','Календарь'],['Вишлист','Вишлист'],['Обязательный платёж','Платежи'],['Будущая трата','Будущие траты'],['Покупка','Покупки']]; return `<div class="button-row plan-tabs subfolder-tabs">${tabs.map(([id,label])=>`<button class="tab-btn ${cur===id?'active':''}" data-action="setPlanningKind" data-id="${esc(id)}">${esc(label)}</button>`).join('')}</div>`; }
  function rowUnifiedFinal(x){
    const img=x.image?`<img class="unified-plan-image" src="${esc(x.image)}" loading="lazy" alt="" onerror="this.remove()">`:'';
    const action=x.source==='task'?'editTask':x.source==='event'?'editEvent':'editPurchase';
    const del=x.source==='purchase'?`<button class="mini-btn red" data-action="deletePurchase" data-id="${esc(x.id)}">Удалить</button>`:'';
    const link=x.link?`<a class="mini-btn blue" href="${esc(x.link)}" target="_blank" rel="noopener">Ссылка</a>`:'';
    const dateLine=x.date?`${esc(x.date)} ${esc(x.time||'')} · `:'';
    return `<div class="unified-plan-item ${x.kind==='Вишлист'?'wishlist':x.kind==='Обязательный платёж'?'payment':x.source}">${img}<div class="unified-plan-main"><div class="unified-plan-top"><span class="pill ${kindTone(x.kind)}">${esc(x.kind)}</span>${ownerPillFinal(x.owner)}${x.amount?`<span class="pill green">${asMoney(x.amount)}</span>`:''}</div><div class="row-title">${esc(x.title||'Пункт')}</div><div class="row-sub">${dateLine}${esc(monthTitleFinal(x.month))} · ${esc(x.meta||'')}</div></div><div class="button-row unified-plan-actions">${link}<button class="mini-btn" data-action="${action}" data-id="${esc(x.id)}">Ред.</button>${del}</div></div>`;
  }
  function ownerTabsFinal(){ const cur=state.settings.planningOwner||'all'; const tabs=[['all','Все'],['Я','Я'],['Полина','Полина'],['Общее','Общее']]; return `<div class="button-row plan-tabs">${tabs.map(([id,label])=>`<button class="tab-btn ${cur===id?'active':''}" data-action="setPlanningOwner" data-id="${esc(id)}">${esc(label)}</button>`).join('')}</div>`; }
  function setPlanningOwner(id){ state.settings.planningOwner=id||'all'; save(true); render(); }
  function setPlanningMonth(){ const el=document.getElementById('planningMonthSelect'); state.settings.planningMonth=(el&&el.value)||curMonth(); save(true); render(); }
  function unifiedPlanningPanelFinal(){
    normalizeFinalPlanningState();
    const m=state.settings.planningMonth||curMonth();
    const items=getUnifiedItems();
    const totalSpend=items.filter(x=>x.amount&&x.include!==false).reduce((a,b)=>a+num(b.amount),0);
    const taskCount=items.filter(x=>x.kind==='Задача'||x.kind==='Событие').length;
    return `<section class="grid cols-4 planning-summary"><article class="card premium-hero-card"><h3>Единое планирование</h3><div class="value sm">${items.length}</div><p class="muted small">дела, календарь, вишлист, покупки и платежи</p></article><article class="card"><h3>План расходов</h3><div class="value sm blue">${asMoney(totalSpend)}</div><p class="muted small">на ${monthTitleFinal(m)}</p></article><article class="card"><h3>Дела</h3><div class="value sm">${taskCount}</div><p class="muted small">задачи + события</p></article><article class="card"><h3>Месяц и владелец</h3><div class="field" style="margin:0"><input id="planningMonthSelect" type="month" value="${esc(m)}"></div>${ownerTabsFinal()}</article></section><section class="card" style="margin-top:18px"><div class="card-head"><div><h3>Подпапки планирования</h3><p class="muted small">Одна папка, но внутри удобные подпапки по типам.</p></div><div class="button-row" style="margin-top:0"><button class="btn secondary" data-action="addTask">Задача</button><button class="btn secondary" data-action="addPurchase">Покупка / трата</button><button class="btn secondary" data-action="addWishlistItem">Вишлист</button><button class="btn secondary" data-action="addPaymentItem">Платёж</button></div></div>${planKindTabs()}<div class="unified-plan-list">${items.map(rowUnifiedFinal).join('')||empty('В этой подпапке пока пусто')}</div></section>`;
  }

  // Задачи: картинка с устройства.
  function imageValue(){ return String(formVal('f_image')||'').trim(); }
  function taskOwnerSelect(id,val='Я'){ return ownerSelectFinal(id,val); }
  addTask=function(){openModal('Новая задача',`<div class="form-grid">${field('Задача','f_title')}${taskOwnerSelect('f_owner','Я')}${field('Сфера / подпапка','f_area','Личное')}${field('Дата','f_due',todayKey(),'date')}${field('Время','f_time','','time')}${imagePicker('f_image','')}<div class="field"><label>Приоритет</label><select id="f_priority"><option value="A">Срочно и важно</option><option value="B" selected>Важно, не срочно</option><option value="C">Срочно, не важно</option><option value="D">Позже / убрать</option></select></div></div><p class="muted small">Картинка загружается с устройства и показывается средним превью в планировании.</p>${modalButtons('saveTask')}`)};
  saveTask=function(){state.tasks.unshift({id:uid(),title:formVal('f_title')||'Новая задача',owner:formVal('f_owner')||'Я',area:formVal('f_area')||'Личное',due:formVal('f_due')||todayKey(),time:formVal('f_time'),image:imageValue(),priority:formVal('f_priority')||'B',status:'В работе'});save(true);closeModal();toast('Задача добавлена');render()};
  editTask=function(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(!t)return;openModal('Редактировать задачу',`<div class="form-grid">${field('Задача','f_title',t.title)}${taskOwnerSelect('f_owner',t.owner||'Я')}${field('Сфера / подпапка','f_area',t.area)}${field('Дата','f_due',t.due,'date')}${field('Время','f_time',t.time,'time')}${imagePicker('f_image',t.image||'')}<div class="field"><label>Приоритет / Эйзенхауэр</label><select id="f_priority"><option value="A" ${t.priority==='A'?'selected':''}>Срочно и важно</option><option value="B" ${t.priority==='B'?'selected':''}>Важно, не срочно</option><option value="C" ${t.priority==='C'?'selected':''}>Срочно, не важно</option><option value="D" ${t.priority==='D'?'selected':''}>Позже / убрать</option></select></div></div><div class="actions"><button class="btn" data-action="saveEditedTask" data-id="${esc(id)}">Сохранить</button><button class="btn red" data-action="deleteTask" data-id="${esc(id)}">Удалить</button></div>`)};
  saveEditedTask=function(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(t){t.title=formVal('f_title');t.owner=formVal('f_owner')||'Я';t.area=formVal('f_area');t.due=formVal('f_due');t.time=formVal('f_time');t.image=imageValue();t.priority=formVal('f_priority')}save(true);closeModal();render()};
  rowTask=function(t){const img=t.image?`<button class="task-cover-button" data-action="editTask" data-id="${esc(t.id)}"><img class="planning-task-image" src="${esc(t.image)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></button>`:'';return `<div class="task-card-row planning-image-card ${t.image?'has-image':''}">${img}<button class="check ${(t.status==='Готово')?'done':''}" data-action="toggleTask" data-id="${esc(t.id)}" title="Готово"></button><button class="task-main" data-action="editTask" data-id="${esc(t.id)}"><span class="row-title">${esc(t.title)}</span><span class="row-sub">${esc(t.area||'Личное')} · ${esc(t.due||'')} ${esc(t.time||'')}</span></button><div class="task-actions">${ownerPillFinal(t.owner||'Я')}${taskPill(t)}<button class="mini-btn blue compact-action" data-action="googleTask" data-id="${esc(t.id)}">Google</button></div></div>`};

  function questionOfDay(){ const q=['Что я сейчас на самом деле чувствую?','Чего я избегаю, потому что уже знаю ответ?','Что я хочу, но запрещаю себе признать?','Какой маленький шаг даст мне спокойствие сегодня?','Где я трачу энергию не туда?']; return q[new Date().getDate()%q.length]; }
  function notebookQuote(){ const q=typeof dailyQuote==='function'?dailyQuote():{quote:'Система освобождает голову для жизни.',thought:'Я выбираю один честный шаг.'}; return q; }
  function dailyInterviewHabit(){
    arr('habits');
    let h=state.habits.find(x=>String(x.systemKey||'')==='subconsciousInterview')||state.habits.find(x=>/интервью\s+с\s+подсознанием/i.test(String(x.name||'')));
    if(!h){ h={id:'habit_subconscious_interview',systemKey:'subconsciousInterview',name:'Интервью с подсознанием',area:'Рефлексия',target:'ежедневно',marks:{}}; state.habits.unshift(h); }
    h.systemKey='subconsciousInterview'; h.name='Интервью с подсознанием'; h.area=h.area||'Рефлексия'; h.target='ежедневно'; h.marks=h.marks||{}; return h;
  }
  function todayInterview(){ return arr('subconsciousDiary').find(x=>String(x.date||'')===todayKey())||null; }
  function markInterview(date=todayKey()){ const h=dailyInterviewHabit(); h.marks=h.marks||{}; h.marks[date]=true; }
  function noteFromInterview(e){
    const text=[
      'Интервью с подсознанием — ежедневная рефлексия', '',
      `Дата: ${e.date||todayKey()}`,'',
      `Цитата: ${e.quote||'—'}`,
      `Вопрос дня: ${e.dayQuestion||'—'}`,
      `Рефлексия как в блокноте: ${e.notebook||'—'}`,'',
      `1. Что я сейчас чувствую: ${e.feeling||'—'}`,
      `2. Чего я избегаю: ${e.avoid||'—'}`,
      `3. Что я уже знаю, но не признаю: ${e.truth||'—'}`,
      `4. Один маленький шаг: ${e.step||'—'}`,
      e.extra?`Дополнительно: ${e.extra}`:''
    ].filter(Boolean).join('\n');
    return {id:e.noteId||uid(),title:`Интервью с подсознанием · ${e.date||todayKey()}`,text,folder:'Дневник',tags:['рефлексия','подсознание','интервью','цитата','привычка'],createdAt:e.date||todayKey(),updatedAt:new Date().toISOString(),sourceType:'dailySubconsciousInterview',sourceDate:e.date||todayKey()};
  }
  function interviewStreak(){ const h=dailyInterviewHabit(); let n=0; const ds=lastDays(90).reverse(); for(const d of ds){ if(h.marks&&h.marks[d])n++; else break; } return n; }
  function dailyInterviewCard(){
    const h=dailyInterviewHabit(); const done=!!todayInterview(); const q=notebookQuote(); const days=monthDays(new Date()); const recent=arr('subconsciousDiary').slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,3);
    return `<section class="card daily-subconscious-card notebook-card"><div class="card-head"><div><h3>Ежедневное интервью с подсознанием</h3><p class="muted small">Заполняется как привычка каждый день и сохраняется в заметки.</p></div><span class="pill ${done?'green':'violet'}">${done?'сегодня заполнено':'ждёт ответа'}</span></div><div class="daily-sub-grid"><article class="daily-sub-main"><div class="notebook-quote"><span>Цитата</span><b>“${esc(q.quote)}”</b></div><div class="notebook-question"><span>Вопрос дня</span><b>${esc(questionOfDay())}</b></div><div class="actions"><button class="btn" data-action="openDailySubconsciousInterview">Начать интервью</button><button class="btn secondary" data-life-folder="subconscious">Все записи</button></div></article><article class="daily-sub-stats"><div class="stat-row"><span>Серия</span><b>${interviewStreak()} дн.</b></div><div class="habit-month-grid compact-interview-grid">${days.map(d=>`<button class="habit-day ${h.marks&&h.marks[d]?'on':''} ${d===todayKey()?'today':''}" data-action="openDailySubconsciousInterview" title="${esc(d)}">${new Date(d).getDate()}</button>`).join('')}</div></article></div>${recent.length?`<div class="daily-sub-recent">${recent.map(e=>`<button class="mini-box daily-sub-note" data-action="editDailySubconsciousInterview" data-id="${esc(e.id)}"><strong>${esc(e.date||'')}</strong><span>${esc((e.step||e.notebook||e.truth||'Открыть запись').slice(0,90))}</span></button>`).join('')}</div>`:''}</section>`;
  }
  function openInterviewModal(entry){
    const e=entry||todayInterview()||{}; const q=notebookQuote(); const dq=e.dayQuestion||questionOfDay();
    openModal(e.id?'Интервью с подсознанием — редактирование':'Начать интервью',`<div class="daily-modal-intro notebook-modal"><b>Вопрос дня: ${esc(dq)}</b><span>Ответы сохраняются в дневник, заметки и отмечают привычку.</span></div><div class="notebook-paper"><div class="notebook-quote-line">“${esc(e.quote||q.quote)}”</div>${area('Рефлексия как в блокноте','f_notebook',e.notebook||'')}</div><div class="form-grid">${field('Дата','f_date',e.date||todayKey(),'date')}${area('1. Что я сейчас чувствую?','f_feeling',e.feeling||'')}${area('2. Чего я избегаю или откладываю?','f_avoid',e.avoid||'')}${area('3. Что я уже знаю, но не признаю?','f_truth',e.truth||'')}${area('4. Какой один маленький шаг я сделаю сегодня?','f_step',e.step||'')}${area('Дополнительно','f_extra',e.extra||'')}</div><div class="actions"><button class="btn" data-action="saveDailySubconsciousInterview" ${e.id?`data-id="${esc(e.id)}"`:''}>Сохранить в привычки и заметки</button></div>`);
  }
  function openDailySubconsciousInterview(){ openInterviewModal(todayInterview()); }
  function editDailySubconsciousInterview(id){ const e=arr('subconsciousDiary').find(x=>String(x.id)===String(id)); openInterviewModal(e||todayInterview()); }
  function saveDailySubconsciousInterview(id){
    const date=formVal('f_date')||todayKey();
    let e=(id&&state.subconsciousDiary.find(x=>String(x.id)===String(id))) || state.subconsciousDiary.find(x=>String(x.date||'')===String(date));
    if(!e){ e={id:uid(),createdAt:new Date().toISOString()}; state.subconsciousDiary.unshift(e); }
    const q=notebookQuote();
    e.date=date; e.quote=q.quote; e.dayQuestion=questionOfDay(); e.notebook=txt(formVal('f_notebook')); e.feeling=txt(formVal('f_feeling')); e.avoid=txt(formVal('f_avoid')); e.truth=txt(formVal('f_truth')); e.step=txt(formVal('f_step')); e.extra=txt(formVal('f_extra')); e.kind='dailyHabitInterview'; e.updatedAt=new Date().toISOString();
    const note=noteFromInterview(e); e.noteId=note.id;
    const ni=state.notes.findIndex(n=>String(n.id)===String(note.id) || (String(n.sourceType||'')==='dailySubconsciousInterview' && String(n.sourceDate||'')===String(date)));
    if(ni>=0)state.notes[ni]=note; else state.notes.unshift(note);
    markInterview(date); save(true); closeModal(); toast('Интервью сохранено в привычки и заметки'); render();
  }
  function deleteDailySubconsciousInterview(id){ const e=state.subconsciousDiary.find(x=>String(x.id)===String(id)); if(!e)return; if(!confirm('Удалить запись интервью?'))return; state.subconsciousDiary=state.subconsciousDiary.filter(x=>String(x.id)!==String(id)); if(e.noteId)state.notes=state.notes.filter(n=>String(n.id)!==String(e.noteId)); save(true); render(); }
  function subconsciousFolderFinal(){
    const latest=arr('subconsciousDiary').slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    return `<section class="grid cols-3"><article class="card premium-hero-card"><div class="card-head"><h3>Дневник</h3><span class="pill violet">подсознание</span></div><p class="muted">Интервью, цитаты и рефлексия как в блокноте. Каждая запись уходит в заметки.</p><button class="btn" data-action="openDailySubconsciousInterview">Начать интервью</button></article><article class="card"><h3>Записей</h3><div class="value sm">${latest.length}</div><p class="muted small">последняя: ${esc(latest[0]?.date||'—')}</p></article><article class="card"><h3>Вопрос дня</h3><p class="quote-big" style="font-size:18px">${esc(questionOfDay())}</p></article></section><section class="grid cols-2" style="margin-top:18px">${latest.map(e=>`<article class="mini-box notebook-entry"><div class="stat-row"><strong>${esc(e.date||'')}</strong><span class="pill violet">интервью</span></div><p class="small"><b>Вопрос:</b> ${esc(e.dayQuestion||questionOfDay())}</p><p class="small"><b>Блокнот:</b> ${esc(e.notebook||'—')}</p><p class="small"><b>Шаг:</b> ${esc(e.step||'—')}</p><div class="button-row"><button class="mini-btn" data-action="editDailySubconsciousInterview" data-id="${esc(e.id)}">Ред.</button><button class="mini-btn red" data-action="deleteDailySubconsciousInterview" data-id="${esc(e.id)}">Удалить</button></div></article>`).join('')||empty('Записей дневника пока нет')}</section>`;
  }

  quoteCard=function(){ const q=notebookQuote(); const last=arr('notes').filter(n=>(n.tags||[]).includes('рефлексия')).slice(0,2); return `<article class="card quote-card quote-polish notebook-card"><div class="card-head"><h3>Цитата и рефлексия</h3><span class="pill blue">блокнот</span></div><div class="quote-big">“${esc(q.quote)}”</div><div class="reflection-hint"><b>Вопрос дня:</b> ${esc(questionOfDay())}</div><textarea id="dailyReflection" placeholder="Напиши рефлексию как в блокноте: что я понял, что чувствую, какой шаг сделаю?">${esc(state.settings.dailyReflection||'')}</textarea><div class="actions"><button class="btn" data-action="saveDailyReflection">Сохранить в заметки</button><button class="btn secondary" data-action="openDailySubconsciousInterview">Начать интервью</button></div>${last.length?`<div class="note-list" style="margin-top:10px">${last.map(n=>`<div class="mini-box"><strong>${esc(n.title)}</strong><p class="small muted">${esc(n.text||'').slice(0,120)}</p></div>`).join('')}</div>`:''}</article>`; };
  saveDailyReflection=function(){ const text=document.getElementById('dailyReflection')?.value||''; const q=notebookQuote(); if(!text.trim())return toast('Напиши рефлексию перед сохранением'); state.notes.unshift({id:uid(),title:'Цитата и рефлексия дня',text:`Цитата: ${q.quote}\nВопрос дня: ${questionOfDay()}\n\n${text}`,folder:'Рефлексия',tags:['рефлексия','цитата','блокнот'],createdAt:todayKey()}); state.settings.dailyReflection=''; save(true); toast('Рефлексия сохранена'); render(); };

  function wishlistFolder(){ normalizeFinalPlanningState(); const items=wishItems(); return `<section class="grid cols-3"><article class="card premium-hero-card"><h3>Вишлист</h3><div class="value sm">${items.length}</div><p class="muted small">желания для себя, Полины или общие</p><button class="btn" data-action="addWishlistItem">Добавить</button></article><article class="card"><h3>В прогнозе</h3><div class="value sm">${asMoney(wishItems(curMonth()).filter(x=>x.includeInBudget!==false).reduce((a,b)=>a+num(b.amount),0))}</div></article><article class="card"><h3>Принцип</h3><p class="muted">У каждой хотелки есть владелец: Я, Полина или Общее.</p></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Все пункты вишлиста</h3><button class="btn secondary" data-action="addWishlistItem">Добавить</button></div><div class="unified-plan-list">${items.map(rowPurchase).join('')||empty('Вишлист пока пуст')}</div></section>`; }
  function paymentsFolder(){ normalizeFinalPlanningState(); const items=paymentItems(); return `<section class="grid cols-3"><article class="card premium-hero-card"><h3>Обязательные платежи</h3><div class="value sm">${asMoney(items.filter(x=>x.includeInBudget!==false).reduce((a,b)=>a+num(b.amount),0))}</div><p class="muted small">все платежи в одной папке с владельцем</p><button class="btn" data-action="addPaymentItem">Добавить платёж</button></article><article class="card"><h3>В этом месяце</h3><div class="value sm">${paymentItems(curMonth()).length}</div></article><article class="card"><h3>Прогноз</h3><p class="muted">Платежи участвуют в месячном прогнозе финансов.</p></article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Список платежей</h3><button class="btn secondary" data-action="addPaymentItem">Добавить</button></div><div class="unified-plan-list">${items.map(rowPurchase).join('')||empty('Платежей пока нет')}</div></section>`; }

  const folderSubMap={
    planning:['Задачи','Календарь','Вишлист','Платежи','Покупки','Будущие траты'],
    finance:['Операции','Категории','Лимиты','Долги','Прогноз'],
    notes:['Все заметки','Рефлексия','Цитаты','Дневник'],
    habits:['Интервью','Трекер','Месяц','Серии'],
    people:['Контакты','Дни рождения','Подарки','Темы'],
    books:['Читаю','Цитаты','Идеи','Применить'],
    personal:['Фильмы','Сериалы','События','Память'],
    documents:['Паспорта','Договоры','Файлы','Ссылки'],
    trips:['Идеи','Билеты','Бюджет','Документы'],
    wishlist:['Я','Полина','Общее','В прогнозе'],
    payments:['Я','Полина','Общее','По месяцам'],
    subconscious:['Сегодня','Архив','Цитаты','Заметки']
  };
  const oldLifeFoldersFinal=lifeFolders;
  lifeFolders=function(){
    const base=(oldLifeFoldersFinal?oldLifeFoldersFinal():[]).filter(f=>!['polinaWishes','polinaPayments'].includes(f.id));
    const add=[{id:'subconscious',title:'Дневник',ico:'◑'},{id:'wishlist',title:'Вишлист',ico:'✦'},{id:'payments',title:'Платежи',ico:'₽'}];
    const seen=new Set(base.map(f=>f.id));
    return [...base,...add.filter(f=>!seen.has(f.id))];
  };
  lifeFolderCount=function(id){ normalizeFinalPlanningState(); const map={people:state.people.length,notes:state.notes.length,planning:openTasks().length+upcomingEvents().length+planItems().length,habits:state.habits.length,books:state.books.length,ideas:state.ideas.length,personal:state.media.length,documents:(state.files||[]).length,trips:(state.trips||[]).length,subconscious:state.subconsciousDiary.length,wishlist:wishItems().length,payments:paymentItems().length}; return map[id]||0; };
  function smartFolderCard(f){ const subs=folderSubMap[f.id]||[]; return `<button class="folder-card smart-folder-card" data-life-folder="${esc(f.id)}"><div class="folder-ico">${f.ico}</div><strong>${esc(f.title)}</strong><small>${lifeFolderCount(f.id)} записей</small>${subs.length?`<div class="subfolder-chips">${subs.map(s=>`<span>${esc(s)}</span>`).join('')}</div>`:''}</button>`; }
  function lifeOverview(){ const folders=lifeFolders(); return `<section class="card"><div class="card-head"><div><h3>Папки и подпапки</h3><p class="muted small">Каждая сфера теперь раскрывается на понятные подпапки.</p></div><span class="pill blue">структура</span></div><div class="life-grid smart-life-grid">${folders.map(smartFolderCard).join('')}</div></section>`; }
  window.lifeOverview=lifeOverview;
  spheresPage=function(){ normalizeFinalPlanningState(); const folder=state.settings.lifeFolder||'overview'; let content=''; if(folder==='overview')content=lifeOverview(); else if(folder==='subconscious')content=subconsciousFolderFinal(); else if(folder==='wishlist')content=wishlistFolder(); else if(folder==='payments')content=paymentsFolder(); else if(folder==='people')content=peopleFolder(); else if(folder==='notes')content=notesFolder(); else if(folder==='planning')content=`${unifiedPlanningPanelFinal()}${monthlyForecastBlock()}`; else if(folder==='habits')content=`${dailyInterviewCard()}${habitsFolder()}`; else if(folder==='books')content=booksFolder(); else if(folder==='ideas')content=ideasFolder(); else if(folder==='documents')content=typeof documentsFolder==='function'?documentsFolder():empty('Документов нет'); else if(folder==='trips')content=typeof tripsPanel==='function'?tripsPanel():empty('Поездок нет'); else content=personalFolder(); return layout('Сферы жизни','Папки жизни с подпапками: планирование, вишлист, платежи, дневник и привычки.',`<section class="folder-list">${lifeFolders().map(f=>folderButton(f.id,f.title,f.ico,lifeFolderCount(f.id))).join('')}</section><section style="margin-top:18px">${content}</section>`); };

  habitsPage=function(){ normalizeFinalPlanningState(); return layout('Привычки','Ежедневные ритуалы, месячный трекер и интервью с подсознанием.',`${dailyInterviewCard()}${habitsFolder()}`); };
  planningPage=function(){ normalizeFinalPlanningState(); return layout('Планирование','Одна папка для задач, календаря, вишлиста, покупок, будущих трат и платежей.',`${unifiedPlanningPanelFinal()}<section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Матрица Эйзенхауэра</h3><span class="pill blue">задачи</span></div>${eisenhowerMatrix()}</article>${monthlyForecastBlock()}</section>`); };
  planningPageInner=function(){ return `<div>${unifiedPlanningPanelFinal()}${monthlyForecastBlock()}</div>`; };
  financePage=function(){
    normalizeFinalPlanningState(); const s=summary(); const diff=(s.actual||0)-(s.calcBalance||0);
    return layout('Финансы','Фактический остаток, операции и запланированные расходы по месяцам.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Фактический остаток</h3><div class="value">${asMoney(s.actual)}</div><button class="btn secondary" data-action="editActualBalance">Изменить</button></article><article class="card"><h3>Прогноз до зарплаты</h3><div class="value sm ${(s.toNext||0)<0?'red':'blue'}">${asMoney(s.toNext)}</div><p class="muted small">до ${fmtDate(s.nextSalary.date)} · учтено планирование</p></article><article class="card"><h3>Запланировано в месяце</h3><div class="value sm">${asMoney(planTotal(curMonth()))}</div><p class="muted small">покупки, вишлист и платежи</p></article><article class="card"><h3>Расхождение</h3><div class="value sm ${Math.abs(diff)>0?'amber':''}">${asMoney(diff)}</div><p class="muted small">факт минус расчёт</p></article></section>${monthlyForecastBlock()}<section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Категории доходов/расходов</h3><button class="btn secondary" data-action="addCategory">Категория</button></div><div class="note-list">${state.categories.map(c=>`<div class="list-row"><span class="pill ${c.type==='income'?'green':'blue'}">${c.type==='income'?'Доход':'Расход'}</span><div><div class="row-title">${esc(c.name)}</div><div class="row-sub">Лимит: ${c.limit?asMoney(c.limit):'—'}</div></div><div class="button-row"><button class="mini-btn" data-action="editCategory" data-id="${esc(c.id)}">Ред.</button><button class="mini-btn red" data-action="deleteCategory" data-id="${esc(c.id)}">Удалить</button></div></div>`).join('')}</div></article><article class="card"><div class="card-head"><h3>Операции</h3><div class="button-row"><button class="btn secondary" data-action="addExpense">Расход</button><button class="btn secondary" data-action="addIncome">Доход</button></div></div><div class="op-list">${state.operations.slice(0,12).map(rowOperation).join('')}</div></article></section><section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>Долги</h3><button class="btn secondary" data-action="addDebt">Добавить долг</button></div><div class="note-list">${activeDebts().map(rowDebt).join('')||empty('Активных долгов нет')}</div></article><article class="card"><div class="card-head"><h3>Планирование расходов</h3><button class="btn secondary" data-go="planning">Открыть план</button></div><div class="unified-plan-list">${planItems().filter(p=>(p.month||curMonth())===curMonth()).slice(0,5).map(rowPurchase).join('')||empty('Запланированных расходов нет')}</div></article></section>`);
  };
  budgetPage=function(){
    normalizeFinalPlanningState(); const s=summary(), items=budgetStats(), used=items.reduce((a,b)=>a+b.spent,0), limit=items.reduce((a,b)=>a+b.limit,0); const top=dailySpendSeries().sort((a,b)=>b.amount-a.amount).filter(x=>x.amount>0).slice(0,5);
    return layout('Бюджет','Лимиты, график трат и единый план будущих расходов.',`<section class="grid cols-4"><article class="card premium-hero-card"><h3>Цикл бюджета</h3><div class="value sm">10 → 9</div><p class="muted small">расчёт от основной зарплаты</p></article><article class="card"><h3>Можно тратить в день</h3>${typeof dailyLimitBlock==='function'?dailyLimitBlock(s):`<div class="value sm blue">${asMoney(s.dailyLimit)}</div>`}</article><article class="card"><h3>План расходов</h3><div class="value sm">${asMoney(planTotal(curMonth()))}</div><p class="muted small">единое планирование</p></article><article class="card"><h3>Лимиты</h3><div class="value sm">${limit?Math.round(used/limit*100):0}%</div>${progressBar(limit?used/limit*100:0,used>limit?'red':'')}</article></section>${monthlyForecastBlock()}<section class="grid cols-2" style="margin-top:18px"><article class="card"><div class="card-head"><h3>График трат по дням</h3><span class="pill blue">пики выделены</span></div>${renderDailySpendChart()}${top.length?`<div class="drawer" style="margin-top:12px"><b>Самые дорогие дни</b>${top.map(x=>`<div class="stat-row"><span>${x.day} число</span><b>${asMoney(x.amount)}</b></div>`).join('')}</div>`:''}</article><article class="card"><div class="card-head"><h3>Лимиты по категориям</h3><button class="btn secondary" data-action="addCategory">Категория</button></div>${items.map(budgetRow).join('')||empty('Нет категорий')}</article></section><section class="card" style="margin-top:18px"><div class="card-head"><h3>Будущие расходы, вишлист и платежи</h3><div class="button-row"><button class="btn secondary" data-action="addPurchase">Покупка</button><button class="btn secondary" data-action="addWishlistItem">Вишлист</button><button class="btn secondary" data-action="addPaymentItem">Платёж</button></div></div><div class="unified-plan-list">${planItems().filter(p=>(p.month||curMonth())===curMonth()).map(rowPurchase).join('')||empty('Запланированных расходов пока нет')}</div></section>`);
  };

  window.addPurchase=addPurchase; window.savePurchase=savePurchase; window.editPurchase=editPurchase; window.saveEditedPurchase=saveEditedPurchase; window.deletePurchase=deletePurchase; window.addWishlistItem=addWishlistItem; window.addPaymentItem=addPaymentItem; window.setPlanningOwner=setPlanningOwner; window.setPlanningMonth=setPlanningMonth; window.setPlanningKind=setPlanningKind; window.openDailySubconsciousInterview=openDailySubconsciousInterview; window.editDailySubconsciousInterview=editDailySubconsciousInterview; window.saveDailySubconsciousInterview=saveDailySubconsciousInterview; window.deleteDailySubconsciousInterview=deleteDailySubconsciousInterview; window.habitsPage=habitsPage; window.planningPage=planningPage; window.financePage=financePage; window.budgetPage=budgetPage; window.spheresPage=spheresPage; window.quoteCard=quoteCard;
  try{Object.assign(windowActions,{clearImageField,addPurchase,savePurchase,editPurchase,saveEditedPurchase,deletePurchase,addWishlistItem,addPaymentItem,addPolinaWish,savePolinaWish,editPolinaWish,saveEditedPolinaWish,deletePolinaWish,addPolinaPayment,savePolinaPayment,editPolinaPayment,saveEditedPolinaPayment,deletePolinaPayment,setPlanningOwner,setPlanningMonth,setPlanningKind,addTask,saveTask,editTask,saveEditedTask,openDailySubconsciousInterview,editDailySubconsciousInterview,saveDailySubconsciousInterview,deleteDailySubconsciousInterview,saveDailyReflection});}catch(e){}
  const prevRunFinal=runActionFromElement;
  runActionFromElement=function(el,event){ const action=el&&el.dataset?el.dataset.action:''; const id=el&&el.dataset?el.dataset.id:''; const map={clearImageField,addPurchase,savePurchase,editPurchase,saveEditedPurchase,deletePurchase,addWishlistItem,addPaymentItem,addPolinaWish,savePolinaWish,editPolinaWish,saveEditedPolinaWish,deletePolinaWish,addPolinaPayment,savePolinaPayment,editPolinaPayment,saveEditedPolinaPayment,deletePolinaPayment,setPlanningOwner,setPlanningMonth,setPlanningKind,addTask,saveTask,editTask,saveEditedTask,openDailySubconsciousInterview,editDailySubconsciousInterview,saveDailySubconsciousInterview,deleteDailySubconsciousInterview,saveDailyReflection}; if(map[action]){ if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();} map[action](id); return true;} return prevRunFinal?prevRunFinal(el,event):false; };
  window.runActionFromElement=runActionFromElement;
  document.addEventListener('change',function(ev){ if(ev.target&&ev.target.id==='planningMonthSelect')setPlanningMonth(); },true);
  const prevRenderFinal=render;
  render=function(){ normalizeFinalPlanningState(); const out=prevRenderFinal.apply(this,arguments); normalizeFinalPlanningState(); setTimeout(()=>{try{patchClickableButtons()}catch(e){}},0); return out; };
  window.render=render;
  try{normalizeFinalPlanningState(); save(false); render();}catch(e){console.error('[wishlist/payments/diary final]',e)}
})();

/* ===== Folder Subpages Final — папка → подпапки → отдельная страница ===== */
(function(){
  const BUILD='folder-subpages-final-20260630';
  function q(v){try{return typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}catch(e){return String(v??'')}}
  function arr2(k){ if(!state[k] || !Array.isArray(state[k])) state[k]=[]; return state[k]; }
  function n(v){ return Number(String(v??0).replace(/[^0-9,.-]/g,'').replace(',','.'))||0; }
  function rub(v){ try{return typeof money==='function'?money(v):`${Math.round(n(v)).toLocaleString('ru-RU')} ₽`}catch(e){return `${Math.round(n(v)).toLocaleString('ru-RU')} ₽`;}}
  function monthNow(){ try{return (state.settings&&state.settings.currentMonth)||monthKey()}catch(e){return new Date().toISOString().slice(0,7)} }
  function today(){ try{return todayKey()}catch(e){return new Date().toISOString().slice(0,10)} }
  function em(t){ try{return empty(t)}catch(e){return `<div class="mini-box muted">${q(t)}</div>`} }
  function saveSoft(){try{save(true)}catch(e){try{save()}catch(_){}}}
  function titleMonth(m){ try{return new Date(String(m||monthNow())+'-01T12:00:00').toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}catch(e){return m||monthNow()} }
  function kindName(v){ v=String(v||'').trim(); if(/хотел|wish|виш/i.test(v))return 'Вишлист'; if(/обяз|плат/i.test(v))return 'Обязательный платёж'; if(/будущ/i.test(v))return 'Будущая трата'; if(/покуп/i.test(v))return 'Покупка'; return v||'Покупка'; }
  function typeIdFromKind(v){ const k=kindName(v); if(k==='Вишлист')return 'wishlist'; if(k==='Обязательный платёж')return 'payments'; if(k==='Будущая трата')return 'future'; if(k==='Покупка')return 'purchases'; return 'purchases'; }
  function ensureFolderState(){
    state.settings=state.settings||{};
    if(!state.settings.planningFolder) state.settings.planningFolder='overview';
    if(!state.settings.planningOwner) state.settings.planningOwner='all';
    if(!state.settings.planningMonth) state.settings.planningMonth=monthNow();
    if(!state.settings.lifeFolder) state.settings.lifeFolder='overview';
    if(state.settings.lifeSubfolder===undefined) state.settings.lifeSubfolder='';
    arr2('plannedPurchases'); arr2('tasks'); arr2('calendarEvents'); arr2('notes'); arr2('people'); arr2('habits'); arr2('books'); arr2('ideas'); arr2('media'); arr2('files'); arr2('trips'); arr2('subconsciousDiary');
    migrateOldPolinaToUnified();
  }
  function oldPolinaKey(x,kind){return [kind,x.title||x.name||'',x.amount||'',x.month||x.due||'',x.day||''].join('|').toLowerCase()}
  function migrateOldPolinaToUnified(){
    if(state.settings.__polinaUnifiedMergedFinal) return;
    const existing=new Set(arr2('plannedPurchases').map(x=>oldPolinaKey(x,kindName(x.kind))));
    arr2('polinaWishes').forEach(w=>{const item={id:w.id||uid(),title:w.title||w.name||'Вишлист Полины',amount:n(w.amount),category:w.category||'Вишлист',month:w.month||monthNow(),kind:'Вишлист',owner:'Полина',importance:w.importance||'Важно',link:w.link||'',image:w.image||'',note:w.note||'',includeInBudget:w.includeInBudget!==false}; const key=oldPolinaKey(item,'Вишлист'); if(!existing.has(key)){state.plannedPurchases.unshift(item); existing.add(key)}});
    arr2('polinaPayments').forEach(p=>{const item={id:p.id||uid(),title:p.title||p.name||'Платёж Полины',amount:n(p.amount),category:p.category||'Обязательные платежи',month:p.month||monthNow(),kind:'Обязательный платёж',owner:'Полина',day:p.day||p.dueDay||'',importance:'Обязательно',note:p.note||'',includeInBudget:p.active!==false,active:p.active!==false}; const key=oldPolinaKey(item,'Обязательный платёж'); if(!existing.has(key)){state.plannedPurchases.unshift(item); existing.add(key)}});
    state.settings.__polinaUnifiedMergedFinal=true;
  }

  function allUnifiedItems(){
    ensureFolderState();
    const out=[];
    arr2('tasks').forEach(t=>out.push({source:'task',id:t.id,title:t.title||'Задача',owner:t.owner||'Я',kind:'Задача',amount:0,month:String(t.due||monthNow()).slice(0,7)||monthNow(),date:t.due||'',time:t.time||'',meta:t.area||'Личное',image:t.image||'',include:true,priority:t.priority||'B'}));
    arr2('calendarEvents').forEach(e=>out.push({source:'event',id:e.id,title:e.title||'Событие',owner:e.owner||'Общее',kind:'Календарь',amount:0,month:String(e.date||monthNow()).slice(0,7)||monthNow(),date:e.date||'',time:e.time||'',meta:e.area||'Календарь',image:e.image||'',include:true,priority:'B'}));
    arr2('plannedPurchases').forEach(p=>out.push({source:'purchase',id:p.id,title:p.title||'Пункт',owner:p.owner||'Я',kind:kindName(p.kind),amount:n(p.amount),month:p.month||monthNow(),date:p.due||'',time:'',meta:`${p.category||'Без категории'} · ${p.includeInBudget!==false?'в прогнозе':'вне прогноза'}`,image:p.image||'',link:p.link||'',include:p.includeInBudget!==false && p.active!==false,priority:p.importance||'Важно'}));
    return out;
  }
  function currentPlanItems(){
    const m=state.settings.planningMonth||monthNow(); const owner=state.settings.planningOwner||'all';
    return allUnifiedItems().filter(x=>(!m || x.month===m) && (owner==='all' || x.owner===owner));
  }
  function itemsForPlanningFolder(id){
    const items=currentPlanItems();
    if(id==='tasks')return items.filter(x=>x.kind==='Задача');
    if(id==='calendar')return items.filter(x=>x.kind==='Календарь');
    if(id==='wishlist')return items.filter(x=>x.kind==='Вишлист');
    if(id==='payments')return items.filter(x=>x.kind==='Обязательный платёж');
    if(id==='future')return items.filter(x=>x.kind==='Будущая трата');
    if(id==='purchases')return items.filter(x=>x.kind==='Покупка');
    return items;
  }
  function countPlanFolder(id){ return itemsForPlanningFolder(id).length; }
  function sumPlanFolder(id){ return itemsForPlanningFolder(id).filter(x=>x.include!==false).reduce((a,b)=>a+n(b.amount),0); }
  const planFolders=[
    {id:'tasks',ico:'✓',title:'Задачи',desc:'дела, личные и рабочие шаги',add:'addTask'},
    {id:'calendar',ico:'◷',title:'Календарь',desc:'события и даты',add:'addEvent'},
    {id:'wishlist',ico:'✦',title:'Вишлист',desc:'желания: Я, Полина, Общее',add:'addWishlistItem'},
    {id:'payments',ico:'₽',title:'Платежи',desc:'регулярные обязательства',add:'addPaymentItem'},
    {id:'future',ico:'↗',title:'Будущие траты',desc:'то, что предстоит оплатить',add:'addPurchase'},
    {id:'purchases',ico:'◇',title:'Покупки',desc:'покупки с суммой и картинкой',add:'addPurchase'},
    {id:'all',ico:'☷',title:'Все пункты',desc:'единая лента без перегруза',add:'addPurchase'}
  ];
  function planFolderById(id){return planFolders.find(f=>f.id===id)||planFolders[0]}
  function ownerPill(owner){ const cls=owner==='Полина'?'violet':owner==='Общее'?'green':'blue'; return `<span class="pill ${cls}">${q(owner||'Я')}</span>`; }
  function kindTone(k){ if(k==='Вишлист')return 'violet'; if(k==='Обязательный платёж')return 'red'; if(k==='Будущая трата')return 'amber'; if(k==='Календарь')return 'green'; return 'blue'; }
  function monthOwnerControls(){
    const m=state.settings.planningMonth||monthNow(); const owner=state.settings.planningOwner||'all';
    const tabs=[['all','Все'],['Я','Я'],['Полина','Полина'],['Общее','Общее']];
    return `<div class="folder-filter-card"><div class="field" style="margin:0"><label>Месяц</label><input id="folderPlanningMonth" type="month" value="${q(m)}"></div><div class="button-row plan-tabs">${tabs.map(([id,label])=>`<button class="tab-btn ${owner===id?'active':''}" data-action="setPlanningOwnerFolder" data-id="${q(id)}">${q(label)}</button>`).join('')}</div></div>`;
  }
  function setPlanningOwnerFolder(id){ state.settings.planningOwner=id||'all'; saveSoft(); render(); }
  function setPlanningMonthFolder(){ const el=document.getElementById('folderPlanningMonth'); state.settings.planningMonth=(el&&el.value)||monthNow(); saveSoft(); render(); }
  function setPlanningFolder(id){ ensureFolderState(); state.settings.planningFolder=id||'overview'; saveSoft(); render(); }
  function planFolderCard(f){ const total=sumPlanFolder(f.id); return `<button class="folder-card subpage-folder-card" data-action="setPlanningFolder" data-id="${q(f.id)}"><div class="folder-ico color-${q(f.id)}">${q(f.ico)}</div><strong>${q(f.title)}</strong><small>${countPlanFolder(f.id)} пунктов${total?` · ${rub(total)}`:''}</small><p>${q(f.desc)}</p><span class="pill blue">Открыть</span></button>`; }
  function rowUnifiedSub(x){
    const img=x.image?`<img class="unified-plan-image" src="${q(x.image)}" loading="lazy" alt="" onerror="this.remove()">`:'';
    const action=x.source==='task'?'editTask':x.source==='event'?'editEvent':'editPurchase';
    const del=x.source==='purchase'?`<button class="mini-btn red" data-action="deletePurchase" data-id="${q(x.id)}">Удалить</button>`:'';
    const link=x.link?`<a class="mini-btn blue" href="${q(x.link)}" target="_blank" rel="noopener">Ссылка</a>`:'';
    const dateLine=x.date?`${q(x.date)} ${q(x.time||'')} · `:'';
    return `<div class="unified-plan-item clean-folder-row ${typeIdFromKind(x.kind)}">${img}<div class="unified-plan-main"><div class="unified-plan-top"><span class="pill ${kindTone(x.kind)}">${q(x.kind)}</span>${ownerPill(x.owner)}${x.amount?`<span class="pill green">${rub(x.amount)}</span>`:''}</div><div class="row-title">${q(x.title)}</div><div class="row-sub">${dateLine}${q(titleMonth(x.month))} · ${q(x.meta||'')}</div></div><div class="button-row unified-plan-actions">${link}<button class="mini-btn" data-action="${action}" data-id="${q(x.id)}">Ред.</button>${del}</div></div>`;
  }
  function planningLanding(){
    const total=currentPlanItems().filter(x=>x.amount&&x.include!==false).reduce((a,b)=>a+n(b.amount),0);
    return `<section class="grid cols-4 planning-summary"><article class="card premium-hero-card"><h3>Папка планирования</h3><div class="value sm">${currentPlanItems().length}</div><p class="muted small">все пункты разнесены по подпапкам</p></article><article class="card"><h3>План расходов</h3><div class="value sm blue">${rub(total)}</div><p class="muted small">${q(titleMonth(state.settings.planningMonth||monthNow()))}</p></article><article class="card"><h3>Дела</h3><div class="value sm">${countPlanFolder('tasks')+countPlanFolder('calendar')}</div><p class="muted small">задачи + календарь</p></article>${monthOwnerControls()}</section><section class="card folder-home-section" style="margin-top:18px"><div class="card-head"><div><h3>Подпапки планирования</h3><p class="muted small">Открываешь папку — внутри только нужная категория, без длинной перегруженной страницы.</p></div><span class="pill blue">папка → подпапки</span></div><div class="folder-list smart-subfolder-grid">${planFolders.map(planFolderCard).join('')}</div></section>${typeof monthlyForecastBlock==='function'?monthlyForecastBlock():''}`;
  }
  function planningSubpage(id){
    const f=planFolderById(id); const items=itemsForPlanningFolder(id); const total=items.filter(x=>x.amount&&x.include!==false).reduce((a,b)=>a+n(b.amount),0);
    return `<section class="subpage-head card"><div><button class="mini-btn" data-action="setPlanningFolder" data-id="overview">← Все подпапки</button><h3>${q(f.title)}</h3><p class="muted small">${q(f.desc)} · ${q(titleMonth(state.settings.planningMonth||monthNow()))}</p></div><div class="button-row"><button class="btn secondary" data-action="${q(f.add)}">Добавить</button></div></section><section class="grid cols-3" style="margin-top:14px"><article class="card"><h3>Пунктов</h3><div class="value sm">${items.length}</div></article><article class="card"><h3>Сумма</h3><div class="value sm blue">${rub(total)}</div></article>${monthOwnerControls()}</section><section class="card" style="margin-top:18px"><div class="card-head"><h3>${q(f.title)}</h3><span class="pill ${kindTone(f.title)}">${items.length}</span></div><div class="unified-plan-list">${items.map(rowUnifiedSub).join('')||em('В этой подпапке пока пусто')}</div></section>`;
  }
  planningPage=function(){ ensureFolderState(); const id=state.settings.planningFolder||'overview'; return layout('Планирование','Открываешь основную папку — внутри подпапки: задачи, календарь, вишлист, платежи, будущие траты и покупки.', id==='overview'?planningLanding():planningSubpage(id)); };
  planningPageInner=function(){ ensureFolderState(); return state.settings.planningFolder==='overview'?planningLanding():planningSubpage(state.settings.planningFolder); };

  // Сферы жизни: папка → подпапки → отдельное содержимое.
  function baseLifeFolders(){return [
    {id:'people',title:'Люди',ico:'◌'},{id:'notes',title:'Заметки',ico:'✎'},{id:'planning',title:'Планирование',ico:'☷'},{id:'habits',title:'Привычки',ico:'◷'},
    {id:'subconscious',title:'Дневник',ico:'◑'},{id:'wishlist',title:'Вишлист',ico:'✦'},{id:'payments',title:'Платежи',ico:'₽'},
    {id:'books',title:'Книги',ico:'◧'},{id:'ideas',title:'Идеи',ico:'✦'},{id:'personal',title:'Личная жизнь',ico:'♡'},{id:'documents',title:'Документы',ico:'▣'},{id:'trips',title:'Путешествия',ico:'✈'}
  ]}
  lifeFolders=function(){ return baseLifeFolders(); };
  function wishListItems(owner){ return arr2('plannedPurchases').filter(p=>kindName(p.kind)==='Вишлист' && (!owner || p.owner===owner)); }
  function payListItems(owner){ return arr2('plannedPurchases').filter(p=>kindName(p.kind)==='Обязательный платёж' && (!owner || p.owner===owner)); }
  lifeFolderCount=function(id){ ensureFolderState(); const map={people:arr2('people').length,notes:arr2('notes').length,planning:allUnifiedItems().length,habits:arr2('habits').length,subconscious:arr2('subconsciousDiary').length,wishlist:wishListItems().length,payments:payListItems().length,books:arr2('books').length,ideas:arr2('ideas').length,personal:arr2('media').length,documents:arr2('files').length,trips:arr2('trips').length}; return map[id]||0; };
  const lifeSubMap={
    people:[['all','Все люди','контакты и отношения'],['birthdays','Дни рождения','кого поздравить'],['gifts','Подарки','идеи подарков'],['talks','Темы разговора','о чём поговорить']],
    notes:[['all','Все заметки','общая база'],['diary','Дневник','личные записи'],['reflection','Рефлексия','ответы и выводы'],['links','Ссылки/идеи','что сохранить']],
    planning:[['tasks','Задачи','дела'],['calendar','Календарь','события'],['wishlist','Вишлист','желания'],['payments','Платежи','обязательства'],['future','Будущие траты','расходы впереди'],['purchases','Покупки','что купить']],
    habits:[['tracker','Трекер привычек','месячный ритм'],['interview','Интервью с подсознанием','ежедневная привычка'],['month','Календарь месяца','отметки по дням']],
    subconscious:[['today','Начать интервью','вопрос дня + цитата'],['entries','Все записи','архив дневника'],['reflection','Рефлексия','мысли и шаги']],
    wishlist:[['all','Весь вишлист','Я, Полина, Общее'],['Я','Мои хотелки','только мои'],['Полина','Вишлист Полины','что хочет Полина'],['Общее','Общие желания','для нас']],
    payments:[['all','Все платежи','все владельцы'],['Я','Мои платежи','личные'],['Полина','Платежи Полины','её обязательства'],['Общее','Общие платежи','общие расходы']],
    books:[['all','Все книги','список чтения'],['quotes','Цитаты','что зацепило'],['insights','Выводы','что применить']],
    ideas:[['all','Все идеи','входящие мысли'],['projects','Проекты','что можно развить'],['quick','Быстрые мысли','короткие заметки']],
    personal:[['watch','Фильмы и сериалы','что посмотреть'],['relations','Отношения','личная жизнь'],['memory','Память','важные моменты']],
    documents:[['all','Все документы','файлы и ссылки'],['contracts','Договоры','важные бумаги'],['personal','Личные','паспорт/страховки']],
    trips:[['all','Все поездки','планы'],['budget','Бюджет поездок','расходы'],['ideas','Идеи маршрутов','куда поехать']]
  };
  function setLifeFolderFinal(id){ ensureFolderState(); state.settings.lifeFolder=id||'overview'; state.settings.lifeSubfolder=''; saveSoft(); render(); }
  setLifeFolder=setLifeFolderFinal;
  function setLifeSubfolder(id){ ensureFolderState(); state.settings.lifeSubfolder=id||''; saveSoft(); render(); }
  function lifeCard(f){ const subs=lifeSubMap[f.id]||[]; return `<button class="folder-card subpage-folder-card" data-action="setLifeFolderFinal" data-id="${q(f.id)}"><div class="folder-ico">${q(f.ico)}</div><strong>${q(f.title)}</strong><small>${lifeFolderCount(f.id)} записей</small>${subs.length?`<div class="subfolder-chips">${subs.slice(0,4).map(s=>`<span>${q(s[1])}</span>`).join('')}</div>`:''}<span class="pill blue">Открыть</span></button>`; }
  function lifeHome(){ return `<section class="card folder-home-section"><div class="card-head"><div><h3>Основные папки</h3><p class="muted small">Теперь каждая папка открывается отдельно, а внутри лежат подпапки-категории.</p></div><span class="pill blue">не перегружено</span></div><div class="folder-list smart-subfolder-grid">${lifeFolders().map(lifeCard).join('')}</div></section>`; }
  function subCard(folder,s){ const count=countLifeSub(folder,s[0]); return `<button class="folder-card subpage-folder-card" data-action="setLifeSubfolder" data-id="${q(s[0])}"><div class="folder-ico">${q((s[1]||'?').slice(0,1))}</div><strong>${q(s[1])}</strong><small>${count} записей</small><p>${q(s[2]||'')}</p><span class="pill blue">Открыть</span></button>`; }
  function lifeFolderLanding(folder){ const f=lifeFolders().find(x=>x.id===folder)||lifeFolders()[0]; const subs=lifeSubMap[folder]||[['all','Все записи','содержимое папки']]; return `<section class="subpage-head card"><div><button class="mini-btn" data-action="setLifeFolderFinal" data-id="overview">← Все сферы</button><h3>${q(f.title)}</h3><p class="muted small">Выбери подпапку — на странице останется только нужная категория.</p></div></section><section class="folder-list smart-subfolder-grid" style="margin-top:18px">${subs.map(s=>subCard(folder,s)).join('')}</section>`; }
  function countLifeSub(folder,sub){
    if(folder==='planning') return itemsForPlanningFolder(sub).length;
    if(folder==='wishlist') return sub==='all'?wishListItems().length:wishListItems(sub).length;
    if(folder==='payments') return sub==='all'?payListItems().length:payListItems(sub).length;
    if(folder==='subconscious') return sub==='today'?1:arr2('subconsciousDiary').length;
    if(folder==='notes'){ const notes=arr2('notes'); if(sub==='reflection')return notes.filter(x=>(x.tags||[]).includes('рефлексия')).length; if(sub==='diary')return notes.filter(x=>/дневник|подсознан|интервью/i.test([x.folder,x.title,(x.tags||[]).join(' ')].join(' '))).length; return notes.length; }
    if(folder==='people'){ if(sub==='birthdays')return arr2('people').filter(p=>p.birthday).length; if(sub==='gifts')return arr2('people').filter(p=>p.gifts).length; if(sub==='talks')return arr2('people').filter(p=>p.talkIdeas).length; return arr2('people').length; }
    return lifeFolderCount(folder);
  }
  function lifeSubHeader(folder,sub,title){ const f=lifeFolders().find(x=>x.id===folder)||{}; return `<section class="subpage-head card"><div><button class="mini-btn" data-action="setLifeSubfolder" data-id="">← Подпапки</button><h3>${q(f.title||'Папка')} · ${q(title||sub||'Все')}</h3><p class="muted small">Отдельная страница подпапки, без общей перегрузки.</p></div></section>`; }
  function genericList(title,rows,addAction){ return `<section class="card" style="margin-top:18px"><div class="card-head"><h3>${q(title)}</h3>${addAction?`<button class="btn secondary" data-action="${q(addAction)}">Добавить</button>`:''}</div><div class="note-list">${rows.join('')||em('Пока пусто')}</div></section>`; }
  function simpleRow(label,title,sub,action,id){ return `<div class="list-row"><span class="pill blue">${q(label)}</span><div><div class="row-title">${q(title)}</div><div class="row-sub">${q(sub||'')}</div></div>${action?`<div class="button-row"><button class="mini-btn" data-action="${q(action)}" data-id="${q(id)}">Ред.</button></div>`:''}</div>`; }
  function renderPlanSubAsLife(sub){ const old=state.settings.planningFolder; state.settings.planningFolder=sub; const html=planningSubpage(sub); state.settings.planningFolder=old; return html; }
  function renderWishlistOwner(owner){ const rows=(owner==='all'?wishListItems():wishListItems(owner)).map(p=>rowUnifiedSub({source:'purchase',id:p.id,title:p.title||'Вишлист',owner:p.owner||'Я',kind:'Вишлист',amount:n(p.amount),month:p.month||monthNow(),meta:p.category||'Вишлист',image:p.image||'',link:p.link||'',include:p.includeInBudget!==false})); return `<section class="card" style="margin-top:18px"><div class="card-head"><h3>${owner==='all'?'Весь вишлист':'Вишлист · '+owner}</h3><button class="btn secondary" data-action="addWishlistItem">Добавить</button></div><div class="unified-plan-list">${rows.join('')||em('Вишлист пока пуст')}</div></section>`; }
  function renderPaymentsOwner(owner){ const rows=(owner==='all'?payListItems():payListItems(owner)).map(p=>rowUnifiedSub({source:'purchase',id:p.id,title:p.title||'Платёж',owner:p.owner||'Я',kind:'Обязательный платёж',amount:n(p.amount),month:p.month||monthNow(),meta:p.category||'Платежи',image:p.image||'',link:p.link||'',include:p.includeInBudget!==false})); return `<section class="card" style="margin-top:18px"><div class="card-head"><h3>${owner==='all'?'Все платежи':'Платежи · '+owner}</h3><button class="btn secondary" data-action="addPaymentItem">Добавить</button></div><div class="unified-plan-list">${rows.join('')||em('Платежей пока нет')}</div></section>`; }
  function renderLifeSubContent(folder,sub){
    const title=(lifeSubMap[folder]||[]).find(x=>x[0]===sub)?.[1]||'Все';
    let body='';
    if(folder==='planning') body=renderPlanSubAsLife(sub||'all');
    else if(folder==='wishlist') body=renderWishlistOwner(sub||'all');
    else if(folder==='payments') body=renderPaymentsOwner(sub||'all');
    else if(folder==='habits'){ if(sub==='interview') body=typeof dailyInterviewCard==='function'?dailyInterviewCard():em('Интервью не найдено'); else body=typeof habitsFolder==='function'?habitsFolder():em('Привычек нет'); }
    else if(folder==='subconscious'){ if(sub==='today') body=typeof dailyInterviewCard==='function'?dailyInterviewCard():em('Интервью не найдено'); else body=typeof subconsciousFolderFinal==='function'?subconsciousFolderFinal():(typeof subconsciousFolder==='function'?subconsciousFolder():em('Записей нет')); }
    else if(folder==='people'){
      const people=arr2('people');
      let rows=[]; if(sub==='birthdays') rows=people.filter(p=>p.birthday).map(p=>simpleRow('ДР',p.name,p.birthday,'editPerson',p.id)); else if(sub==='gifts') rows=people.filter(p=>p.gifts).map(p=>simpleRow('Подарки',p.name,p.gifts,'editPerson',p.id)); else if(sub==='talks') rows=people.filter(p=>p.talkIdeas).map(p=>simpleRow('Разговор',p.name,p.talkIdeas,'editPerson',p.id)); else { body=typeof peopleFolder==='function'?peopleFolder():em('Люди не найдены'); }
      if(!body) body=genericList(title,rows,'addPerson');
    }
    else if(folder==='notes'){
      const notes=arr2('notes'); let list=notes;
      if(sub==='reflection') list=notes.filter(x=>(x.tags||[]).includes('рефлексия'));
      if(sub==='diary') list=notes.filter(x=>/дневник|подсознан|интервью/i.test([x.folder,x.title,(x.tags||[]).join(' ')].join(' ')));
      const rows=list.map(x=>simpleRow((x.tags||[])[0]||'Заметка',x.title,x.text,'editNote',x.id)); body=genericList(title,rows,'addNote');
    }
    else if(folder==='books'){
      if(sub==='quotes'){ const rows=arr2('books').flatMap(b=>(b.quotes||[]).map(x=>simpleRow('Цитата',b.title,x,'editBook',b.id))); body=genericList('Цитаты из книг',rows,'addBook'); }
      else if(sub==='insights'){ const rows=arr2('books').filter(b=>b.insight).map(b=>simpleRow('Вывод',b.title,b.insight,'editBook',b.id)); body=genericList('Выводы из книг',rows,'addBook'); }
      else body=typeof booksFolder==='function'?booksFolder():em('Книг нет');
    }
    else if(folder==='ideas') body=typeof ideasFolder==='function'?ideasFolder():em('Идей нет');
    else if(folder==='personal') body=typeof personalFolder==='function'?personalFolder():em('Список пуст');
    else if(folder==='documents') body=typeof documentsFolder==='function'?documentsFolder():em('Документов нет');
    else if(folder==='trips') body=typeof tripsPanel==='function'?tripsPanel():em('Поездок нет');
    return lifeSubHeader(folder,sub,title)+body;
  }
  spheresPage=function(){ ensureFolderState(); const folder=state.settings.lifeFolder||'overview'; const sub=state.settings.lifeSubfolder||''; let content= folder==='overview'?lifeHome():(!sub?lifeFolderLanding(folder):renderLifeSubContent(folder,sub)); return layout('Сферы жизни','Папка → подпапки → отдельная страница. Ничего лишнего на одном экране.',content); };

  // Финансы и бюджет оставляем рабочими, но ссылку на план отправляем в подпапки.
  const oldFinanceFolderFinal=financePage;
  financePage=function(){ ensureFolderState(); try{return oldFinanceFolderFinal()}catch(e){return layout('Финансы','Деньги и прогноз.',`${typeof monthlyForecastBlock==='function'?monthlyForecastBlock():''}`)} };
  const oldBudgetFolderFinal=budgetPage;
  budgetPage=function(){ ensureFolderState(); try{return oldBudgetFolderFinal()}catch(e){return layout('Бюджет','Лимиты и план расходов.',`${typeof monthlyForecastBlock==='function'?monthlyForecastBlock():''}`)} };

  function injectFolderCss(){ if(document.getElementById('folderSubpagesFinalCss'))return; const st=document.createElement('style'); st.id='folderSubpagesFinalCss'; st.textContent=`
    .smart-subfolder-grid{grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.subpage-folder-card{align-items:flex-start;text-align:left;min-height:154px;padding:18px;position:relative;overflow:hidden}.subpage-folder-card p{margin:8px 0 0;color:#6f7f99;font-size:13px;line-height:1.35}.subpage-folder-card:after{content:'';position:absolute;right:-18px;bottom:-28px;width:92px;height:92px;border-radius:50%;background:linear-gradient(135deg,rgba(45,128,255,.13),rgba(48,209,255,.08));pointer-events:none}.subfolder-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.subfolder-chips span{font-size:11px;border:1px solid #dce9ff;background:#f4f8ff;color:#2d6bce;border-radius:999px;padding:5px 8px}.folder-home-section{background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(240,247,255,.82))}.subpage-head{display:flex;align-items:center;justify-content:space-between;gap:14px}.subpage-head h3{font-size:24px;margin:10px 0 4px}.folder-filter-card{padding:16px;border:1px solid #dce8f7;border-radius:22px;background:rgba(255,255,255,.72)}.clean-folder-row{border-radius:20px}.color-wishlist{background:#f3e8ff!important;color:#7c3aed!important}.color-payments{background:#ffe7eb!important;color:#e11d48!important}.color-future{background:#fff4d8!important;color:#d97706!important}.color-calendar{background:#dcfce7!important;color:#059669!important}.unified-plan-image{width:156px;height:92px;object-fit:cover;border-radius:16px;border:1px solid #deebfb;background:#eef6ff}@media(max-width:760px){.subpage-head{align-items:flex-start;flex-direction:column}.smart-subfolder-grid{grid-template-columns:1fr}.unified-plan-image{width:100%;height:150px}.folder-filter-card{width:100%}}
  `; document.head.appendChild(st); }
  window.setPlanningFolder=setPlanningFolder;
  window.setPlanningOwnerFolder=setPlanningOwnerFolder;
  window.setPlanningMonthFolder=setPlanningMonthFolder;
  window.setLifeFolderFinal=setLifeFolderFinal;
  window.setLifeSubfolder=setLifeSubfolder;
  try{Object.assign(windowActions||{}, {setPlanningFolder,setPlanningOwnerFolder,setPlanningMonthFolder,setLifeFolderFinal,setLifeSubfolder});}catch(e){}
  const prevRun=runActionFromElement;
  runActionFromElement=function(el,event){ const a=el&&el.dataset?el.dataset.action:''; const id=el&&el.dataset?el.dataset.id:''; const map={setPlanningFolder,setPlanningOwnerFolder,setPlanningMonthFolder,setLifeFolderFinal,setLifeSubfolder}; if(map[a]){ if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();} map[a](id); return true;} return prevRun?prevRun(el,event):false; };
  window.runActionFromElement=runActionFromElement;
  document.addEventListener('change',function(ev){ if(ev.target&&ev.target.id==='folderPlanningMonth')setPlanningMonthFolder(); },true);
  const prevRender=render;
  render=function(){ ensureFolderState(); const out=prevRender.apply(this,arguments); setTimeout(()=>{try{injectFolderCss(); patchClickableButtons&&patchClickableButtons()}catch(e){}},0); return out; };
  window.render=render;
  try{ensureFolderState(); save(false); injectFolderCss(); render(); console.log('[Second Brain OS]',BUILD);}catch(e){console.error('[folder subpages final]',e)}
})();
