/* Second Brain OS — QA Polish Private V40.1 */
'use strict';

const RELEASE = 'v40-1-qa-polish-private-20260626';
const DATA_VERSION = 401;
const STORE_KEY = 'secondBrainOS.v1';
const META_KEY = 'secondBrainOS.meta.v1';
const SNAPSHOT_KEY = 'secondBrainOS.dataSnapshots.v1';
const MAX_SNAPSHOTS = 8;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const uid = () => 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0,10);
const monthKey = () => todayKey().slice(0,7);
const num = v => Number(String(v ?? '').replace(/\s/g,'').replace(',', '.')) || 0;
const money = v => `${Math.round(num(v)).toLocaleString('ru-RU')} ₽`;
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

let activePage = new URLSearchParams(location.search).get('page') || 'dashboard';
let modalSave = null;
let state = loadState();
let searchQuery = '';
let lastAutoSnapshotAt = 0;

const navGroups = [
  ['Главная', [['dashboard','⌂','Главная']]],
  ['День', [['today','▣','Сегодня'],['week','◫','Неделя'],['tasks','☑','Задачи'],['habits','♡','Привычки']]],
  ['Деньги', [['finance','◔','Финансы'],['debts','⌁','Долги'],['payments','◫','Платежи'],['import','⇣','Импорт']]],
  ['Рост', [['goals','◎','SMART-цели'],['books','◧','Книги'],['notes','✦','Инсайты']]],
  ['Люди', [['people','◌','Контакты'],['birthdays','◍','Дни рождения'],['gifts','◦','Подарки']]],
  ['Система', [['control','◇','Контроль'],['sync','⟳','Данные'],['settings','⚙','Настройки']]]
];
const pageTitles = Object.fromEntries(navGroups.flatMap(g=>g[1]).map(x=>[x[0],x[2]]));

function defaultState(){
  return {
    settings:{currentMonth:monthKey(), currency:'₽', theme:'warm', weekNoList:'Прокрастинировать по мелочам\nТратить на импульсивные покупки\nБрать новые задачи без оценки'},
    operations:[
      {id:uid(), date:todayKey(), type:'expense', amount:4000, category:'Обучение', note:'Оплата урока'},
      {id:uid(), date:todayKey(), type:'income', amount:0, category:'Проект', note:''}
    ],
    plannedExpenses:[{id:uid(), title:'Аренда квартиры', amount:25000, day:28, month:monthKey(), active:true},{id:uid(), title:'Сервис Notion', amount:850, day:29, month:monthKey(), active:true}],
    debts:[
      {id:'d_bank', direction:'owe', person:'Банк / кредитка', amount:45000, due:todayKey(), status:'Активен', note:'Обязательство, влияет на чистую позицию'},
      {id:'d_friend', direction:'owed_to_me', person:'Друг / клиент', amount:12000, due:todayKey(), status:'Ожидаю', note:'Должны вернуть'}
    ],
    tasks:[
      {id:uid(), title:'Посчитать конверсию всех ордеров, что реализовались', area:'Обучение', due:todayKey(), time:'13:00', priority:'Высокий', status:'В работе', goalId:'g_income', nextAction:'Собрать данные по всем ордерам'},
      {id:uid(), title:'Ответить на вопрос дня', area:'Личное', due:todayKey(), time:'18:00', priority:'Средний', status:'В работе', goalId:'', nextAction:'Записать честный ответ'}
    ],
    habits:[
      {id:'h_expenses', name:'Записать расходы', area:'Финансы', active:true, targetPerWeek:7},
      {id:'h_impulse', name:'Без импульсных покупок', area:'Финансы', active:true, targetPerWeek:5},
      {id:'h_sleep', name:'Сон 7+ часов', area:'Здоровье', active:true, targetPerWeek:5},
      {id:'h_move', name:'Движение / прогулка', area:'Здоровье', active:true, targetPerWeek:4},
      {id:'h_plan', name:'План дня', area:'Личное', active:true, targetPerWeek:5}
    ],
    habitLogs:{[todayKey()]:{h_expenses:true,h_impulse:true,h_move:true}},
    goals:[
      {id:'g_income', title:'Я зарабатываю от 300 000 рублей ежемесячно', area:'Финансы', metric:'₽/мес', targetValue:300000, currentValue:225000, status:'Активна', deadline:'2026-12-31', nextAction:'Проанализировать ситуацию текущую, подумать какие варианты доп. дохода могут быть рассмотрены и раскидать задачи на этом месяце и на следующий.', why:'Хочу финансовую свободу и системный рост дохода.'},
      {id:'g_trading', title:'Я зарабатываю на трейдинге от 30 000 рублей каждый месяц', area:'Финансы', metric:'₽/мес', targetValue:30000, currentValue:0, status:'Активна', deadline:'2026-12-31', nextAction:'Посчитать конверсию всех ордеров, что реализовались.', why:'Собрать навык системной торговли.'}
    ],
    notes:[{id:uid(), title:'Идеи доп. дохода', text:'Консультации\nОнлайн-курс\nПартнёрские программы', goalId:'g_income', personId:'p_polina', tags:['идея','доход','фокус'], createdAt:todayKey()}],
    goalNotes:[{id:uid(), goalId:'g_income', title:'Заметка по цели', text:'Рассмотреть консультации, онлайн-курс и партнёрские программы как доп. доход.', date:todayKey(), tags:['цель']}],
    people:[{id:'p_polina', name:'Полина', relation:'близкий человек', birthday:'1999-08-23', likes:'кофе, море, украшения', talkIdeas:'обсудить планы на июль', gifts:'сертификат / украшение', notes:'важный человек'}],
    states:[{date:todayKey(), sleep:7, energy:7, mood:8, stress:4}],
    journal:[{id:uid(), date:todayKey(), prompt:'Вопрос дня', answer:'Какой один маленький шаг даст мне ощущение контроля?', insight:'Фокус на 1–2 ключевых действия в день даёт лучший результат, чем 10 дел без приоритета.'}],
    books:[], weeklyReviews:[], rpg:{class:'Архитектор жизни', rank:'Стратег'}, dataCore:{schema:DATA_VERSION, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), migratedFrom:'fresh', lastBackupAt:'', lastSnapshotAt:''}
  };
}
function essentialArrays(){ return ['operations','plannedExpenses','debts','tasks','habits','goals','notes','goalNotes','people','states','journal','books','weeklyReviews']; }
function normalizeState(input, source='runtime'){
  const base = defaultState();
  const raw = (input && typeof input === 'object') ? input : {};
  const merged = {...base, ...raw, settings:{...base.settings,...(raw.settings||{})}, rpg:{...base.rpg,...(raw.rpg||{})}};
  for(const k of essentialArrays()) merged[k] = Array.isArray(merged[k]) ? merged[k] : [];
  merged.habitLogs = (merged.habitLogs && typeof merged.habitLogs === 'object') ? merged.habitLogs : {};
  merged.settings.currentMonth = merged.settings.currentMonth || monthKey();
  merged.dataCore = {...base.dataCore, ...(raw.dataCore||{}), schema:DATA_VERSION, updatedAt:(raw.dataCore&&raw.dataCore.updatedAt)||new Date().toISOString(), migratedFrom:(raw.dataCore&&raw.dataCore.schema) ? `v${raw.dataCore.schema}` : source};
  return merged;
}
function unpackBackupPayload(raw){
  if(raw && raw.state && typeof raw.state === 'object') return raw.state;
  return raw;
}
function loadState(){
  const base = normalizeState(defaultState(), 'fresh');
  let rawText = '';
  try{
    rawText = localStorage.getItem(STORE_KEY) || '';
    if(!rawText){
      localStorage.setItem(META_KEY, JSON.stringify({release:RELEASE, dataVersion:DATA_VERSION, createdAt:new Date().toISOString()}));
      return base;
    }
    const raw = unpackBackupPayload(JSON.parse(rawText));
    const migrated = normalizeState(raw, 'migration');
    migrated.dataCore.schema = DATA_VERSION;
    migrated.dataCore.updatedAt = new Date().toISOString();
    return migrated;
  }catch(e){
    console.warn('Data Core load failed', e);
    try{ if(rawText) localStorage.setItem(`${STORE_KEY}.corrupt.${Date.now()}`, rawText); }catch(_e){}
    return base;
  }
}
function checksumString(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
  return ('00000000'+(h>>>0).toString(16)).slice(-8);
}
function stateSizeBytes(){ try{ return new Blob([JSON.stringify(state)]).size; }catch(e){ return JSON.stringify(state).length; } }
function backupPayload(reason='manual'){
  const clean = normalizeState(state, 'backup');
  clean.dataCore.updatedAt = new Date().toISOString();
  const stateText = JSON.stringify(clean);
  return {app:'Second Brain OS', kind:'full-backup', release:RELEASE, dataVersion:DATA_VERSION, createdAt:new Date().toISOString(), reason, checksum:checksumString(stateText), state:clean};
}
function localSnapshots(){
  try{ const list=JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'[]'); return Array.isArray(list)?list:[]; }catch(e){ return []; }
}
function saveLocalSnapshot(reason='auto'){
  try{
    const payload = backupPayload(reason);
    const list = localSnapshots();
    list.unshift(payload);
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list.slice(0, MAX_SNAPSHOTS)));
    state.dataCore.lastSnapshotAt = payload.createdAt;
    lastAutoSnapshotAt = Date.now();
    return payload;
  }catch(e){ console.warn('Snapshot failed', e); return null; }
}
function save(options={}){
  state = normalizeState(state, 'save');
  state.dataCore.updatedAt = new Date().toISOString();
  const text = JSON.stringify(state);
  localStorage.setItem(STORE_KEY, text);
  localStorage.setItem(META_KEY, JSON.stringify({release:RELEASE, dataVersion:DATA_VERSION, updatedAt:state.dataCore.updatedAt, checksum:checksumString(text), bytes:stateSizeBytes()}));
  if(options.snapshot || Date.now()-lastAutoSnapshotAt > 180000) saveLocalSnapshot(options.snapshot ? 'manual-snapshot' : 'auto');
}
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
function go(page){ activePage=page; history.replaceState(null,'',`${location.pathname}?v=${RELEASE}&page=${page}`); render(); }
function monthLabel(m=state.settings.currentMonth){ const [y,mo]=String(m).split('-'); return new Date(Number(y), Number(mo||1)-1, 1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}); }
function total(list){ return (list||[]).reduce((s,x)=>s+num(x.amount),0); }
function goalProgress(g){ const t=num(g?.targetValue), c=num(g?.currentValue); return t ? clamp(Math.round(c/t*100),0,100) : 0; }
function activeGoals(){ return (state.goals||[]).filter(g=>!['Готово','Отменена','Закрыта'].includes(g.status)); }
function currentGoal(){ const saved=localStorage.getItem('secondBrainOS.currentGoal') || localStorage.getItem('secondBrainOS.v36.currentGoal') || localStorage.getItem('secondBrainOS.v35.currentGoal'); return activeGoals().find(g=>g.id===saved) || activeGoals().sort((a,b)=>goalProgress(b)-goalProgress(a))[0] || state.goals[0] || null; }
function setCurrentGoal(id){ localStorage.setItem('secondBrainOS.currentGoal',id); localStorage.setItem('secondBrainOS.v36.currentGoal',id); render(); }
function goalTab(){ return localStorage.getItem('secondBrainOS.v36.goalTab') || 'overview'; }
function setGoalTab(v){ localStorage.setItem('secondBrainOS.v36.goalTab',v); render(); }
function taskSort(a,b){ const ak=(a.due||'9999')+(a.time||'99'), bk=(b.due||'9999')+(b.time||'99'); return ak.localeCompare(bk); }
function linkedTasks(g){ return (state.tasks||[]).filter(t=>g&&t.goalId===g.id).sort(taskSort); }
function linkedNotes(g){ const a=(state.notes||[]).filter(n=>g&&n.goalId===g.id).map(n=>({...n,date:n.createdAt||n.date||todayKey()})); const b=(state.goalNotes||[]).filter(n=>g&&n.goalId===g.id).map(n=>({...n,title:n.title||'Заметка по цели',tags:n.tags||['цель']})); return [...a,...b].sort((x,y)=>String(y.date||'').localeCompare(String(x.date||''))); }
function linkedPeople(g){ const ids=new Set(linkedTasks(g).map(t=>t.personId).filter(Boolean)); return (state.people||[]).filter(p=>ids.has(p.id)); }
function todayTasks(){ return (state.tasks||[]).filter(t=>t.status!=='Готово' && t.due===todayKey()).sort(taskSort); }
function todayHabits(){ return (state.habits||[]).filter(h=>h.active!==false); }
function monthOps(type){ return (state.operations||[]).filter(o=>o.type===type && String(o.date||'').startsWith(state.settings.currentMonth)); }
function monthSummary(){
  const income=total(monthOps('income')), expenses=total(monthOps('expense'));
  const planned=total((state.plannedExpenses||[]).filter(p=>p.active!==false && (!p.month || p.month===state.settings.currentMonth)));
  const left=income-expenses-planned;
  const d=new Date(); const days=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(); const remaining=Math.max(1, days-d.getDate()+1);
  return {income,expenses,planned,left,dailyLimit:Math.max(0,Math.floor(left/remaining))};
}
function lifeScore(){
  const habits=todayHabits(), done=Object.keys(state.habitLogs?.[todayKey()]||{}).length;
  const hp=habits.length?done/habits.length:0;
  const t=todayTasks(), tp=t.length ? t.filter(x=>x.status==='Готово').length/t.length : .4;
  const gp=activeGoals().length?activeGoals().reduce((s,g)=>s+goalProgress(g),0)/(activeGoals().length*100):.3;
  const s=monthSummary(); const fp=s.income?Math.max(0,Math.min(1,(s.income-s.expenses)/s.income)):.3;
  return Math.round((hp*.30+tp*.20+gp*.30+fp*.20)*100);
}
function weekSeries(type){
  const out=[]; for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const key=d.toISOString().slice(0,10); out.push({label:key.slice(8),value:total((state.operations||[]).filter(o=>o.type===type&&o.date===key))}); } return out;
}
function categoryTotals(){ const map={}; monthOps('expense').forEach(o=>map[o.category||'Другое']=(map[o.category||'Другое']||0)+num(o.amount)); return Object.entries(map).sort((a,b)=>b[1]-a[1]); }
function rpgStats(g){ const tasks=linkedTasks(g), done=tasks.filter(t=>t.status==='Готово').length, notes=linkedNotes(g).length, progress=goalProgress(g); const xp=Math.round(progress*4+done*35+notes*12); return {xp,level:Math.max(1,Math.floor(xp/120)+1),current:xp%120,next:120,done,notes,streak:Math.max(1,done+notes),progress}; }
function daysLeft(date){ if(!date) return '—'; return Math.max(0,Math.ceil((new Date(date)-new Date(todayKey()))/86400000)); }
function valFmt(g,v){ if(v===undefined||v===null||v==='') return '—'; return /₽|руб|доход|финанс/i.test(`${g?.metric||''} ${g?.area||''}`) ? money(v) : `${v} ${g?.metric||''}`.trim(); }
function attentionItems(){ const out=[]; const overdue=(state.tasks||[]).filter(t=>t.status!=='Готово'&&t.due&&t.due<todayKey()).length; if(overdue) out.push(['red','⏰',`${overdue} просроченные задачи`]); const q=(state.tasks||[]).some(t=>/вопрос дня/i.test(t.title||'')&&t.status!=='Готово'); if(q) out.push(['warn','?',`Вопрос дня не заполнен`]); const g=activeGoals().filter(x=>!(x.nextAction||'').trim()).length; if(g) out.push(['warn','🎯',`${g} целей без следующего шага`]); if(!out.length) out.push(['green','✓','Критичных зон нет']); return out.slice(0,3); }

function spark(vals,color='var(--green)'){
  vals=(vals||[]).map(x=>num(x)); const w=220,h=68,p=6,max=Math.max(...vals,1),min=Math.min(...vals,0),span=Math.max(1,max-min); const pts=vals.map((v,i)=>[p+(w-p*2)*(vals.length===1?0:i/(vals.length-1)), h-p-((v-min)/span)*(h-p*2)]); const poly=pts.map(a=>a.map(x=>x.toFixed(1)).join(',')).join(' '); const area=`M ${p},${h-p} L ${pts.map(a=>a.map(x=>x.toFixed(1)).join(',')).join(' L ')} L ${w-p},${h-p} Z`; return `<svg class="svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${area}" fill="${color}" opacity=".10"></path><polyline points="${poly}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>`;
}
function barChart(rows){ const max=Math.max(...rows.map(r=>num(r.value)),1); return `<div class="bar-chart">${rows.map(r=>`<div><i style="height:${Math.max(10,num(r.value)/max*120)}px"></i><span>${esc(r.label)}</span></div>`).join('')}</div>`; }
function donut(rows){ const total=rows.reduce((s,x)=>s+num(x[1]),0)||1, colors=['#6c95d8','#74b57f','#f0c15a','#c28bd2','#d98b33']; let acc=0; const seg=rows.slice(0,5).map((x,i)=>{ const a=acc/total*360; acc+=num(x[1]); return `${colors[i]} ${a}deg ${acc/total*360}deg`;}).join(','); return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${seg})"></div><div class="legend">${rows.slice(0,5).map((x,i)=>`<div><i style="background:${colors[i]}"></i><span>${esc(x[0])}</span><b>${Math.round(num(x[1])/total*100)}%</b></div>`).join('')}</div></div>`; }
function heatmap(){ const habits=todayHabits().slice(0,4), days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10)}); return `<div class="heatmap"><span></span>${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<span>${d}</span>`).join('')}${habits.map(h=>`<span>${esc(h.name.split(' ')[0])}</span>${days.map(d=>`<i class="${state.habitLogs?.[d]?.[h.id]?'on':''}"></i>`).join('')}`).join('')}</div>`; }
function lineChart(g){ const p=goalProgress(g), vals=[12,22,34,46,58,67,p].map(x=>Math.min(100,Math.max(4,x))); const w=440,h=190,pad=20; const pts=vals.map((v,i)=>[pad+(w-pad*2)*i/(vals.length-1),h-pad-v/100*(h-pad*2)]); const poly=pts.map(x=>x.map(y=>y.toFixed(1)).join(',')).join(' '); const area=`M ${pad},${h-pad} L ${pts.map(x=>x.map(y=>y.toFixed(1)).join(',')).join(' L ')} L ${w-pad},${h-pad} Z`; return `<svg class="svg" style="height:210px" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${area}" fill="var(--green)" opacity=".10"></path><polyline points="${poly}" fill="none" stroke="var(--green)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${i===pts.length-1?5:3}" fill="var(--green)"></circle>`).join('')}</svg>`; }

function graph(g){
  const task=linkedTasks(g)[0], note=linkedNotes(g)[0], habit=todayHabits().find(h=>h.area===g?.area)||todayHabits()[0], person=linkedPeople(g)[0] || state.people[0];
  return `<div class="graph premium-graph"><div class="graph-core"><small>Цель</small><b>${esc(g?.title||'SMART-цель')}</b><span>${goalProgress(g)}%</span></div><button class="graph-node n-top" data-page="tasks"><strong>Задача</strong><span>${esc(task?.title||'Шаг')}</span></button><button class="graph-node n-left" data-page="notes"><strong>Заметка</strong><span>${esc(note?.title||'Идея')}</span></button><button class="graph-node n-right" data-page="finance"><strong>Финансы</strong><span>${money(g?.targetValue||0)}</span></button><button class="graph-node n-bottom-left" data-page="habits"><strong>Привычка</strong><span>${esc(habit?.name||'Ритуал')}</span></button><button class="graph-node n-bottom-right" data-page="people"><strong>Союзник</strong><span>${esc(person?.name||'Полина')}</span></button></div>`;
}


function mobileNav(){
  const items = [
    ['dashboard','⌂','Главная'],
    ['today','◫','Сегодня'],
    ['quick','＋',''],
    ['finance','₽','Финансы'],
    ['more','☷','Ещё']
  ];
  return `<nav class="mobile-tabbar" aria-label="Нижняя навигация">${items.map(([id,ic,label]) => id==='quick'
    ? `<button class="mobile-tab mobile-tab-main" data-action="quickMenu" aria-label="Быстрый ввод"><span>${ic}</span></button>`
    : id==='more'
      ? `<button class="mobile-tab" data-action="mobileMore"><span>${ic}</span><b>${label}</b></button>`
      : `<button class="mobile-tab ${activePage===id?'active':''}" data-page="${id}"><span>${ic}</span><b>${label}</b></button>`
  ).join('')}</nav>`;
}
function mobileMore(){
  const groups = navGroups.map(([title,items]) => `<section class="mobile-menu-section"><h4>${title}</h4><div>${items.map(([id,ic,label])=>`<button data-page="${id}"><span>${ic}</span><b>${label}</b></button>`).join('')}</div></section>`).join('');
  openModal('Меню Second Brain', `<div class="mobile-menu-grid">${groups}</div>`);
}
function mobileHeaderTitle(){
  const found = navGroups.flatMap(g=>g[1]).find(x=>x[0]===activePage);
  return found ? found[2] : 'Second Brain';
}

function shell(){
  const nav=navGroups.map(([title,items])=>`<div class="nav-group"><div class="nav-title">${title}</div>${items.map(([id,ic,label])=>`<button data-page="${id}" class="nav-btn ${activePage===id?'active':''}"><span class="nav-ic">${ic}</span><b>${label}</b></button>`).join('')}</div>`).join('');
  return `<div class="app shell-premium"><aside class="sidebar"><div class="brand"><div class="brand-mark">◔</div><div><b>Second Brain OS</b><span>Life RPG</span></div></div><nav class="nav">${nav}</nav><button class="quick-input" data-action="quickMenu"><span>⚡</span><b>Быстрый ввод</b><small>⌘ K</small></button><div class="sidebar-status"><small>PRIVATE APP</small><b>V40.1</b><span class="sync-dot">QA POLISH OK</span><small>${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small></div></aside><main class="main"><header class="topbar premium-topbar"><div class="topbar-spacer"></div><div class="topbar-tools"><div class="search-box"><span>⌕</span><input id="search" class="search" placeholder="Поиск" value="${esc(searchQuery)}"></div><button class="ghost pwa-only-hide" data-action="installApp">Установить</button><button class="icon-btn" data-page="week" title="Календарь">◫</button><button class="icon-btn bell-btn" data-page="control" title="Уведомления"><span>◌</span><i>${attentionItems().length}</i></button><button class="avatar-btn" data-page="settings" title="Профиль">А</button></div></header><section class="mobile-page-title"><b>${mobileHeaderTitle()}</b><span>${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</span></section><section class="view premium-view">${route()}</section></main>${mobileNav()}</div>`;
}
function route(){
  const map={dashboard,today,week,goals,tasks,finance,habits,notes,people,control,sync,settings,payments,debts,import:importPage,books,birthdays,gifts};
  return (map[activePage]||dashboard)();
}

function dashboard(){
  const s=monthSummary(), life=lifeScore(), goal=currentGoal(), tasks=todayTasks().slice(0,4), habits=todayHabits().slice(0,5), hm=state.habitLogs?.[todayKey()]||{}, expToday=total((state.operations||[]).filter(o=>o.type==='expense'&&o.date===todayKey())), incToday=total((state.operations||[]).filter(o=>o.type==='income'&&o.date===todayKey())), safePct=s.dailyLimit?Math.min(100,Math.round(expToday/Math.max(1,s.dailyLimit)*100)):0, expSeries=weekSeries('expense'), incSeries=weekSeries('income'), cats=categoryTotals().slice(0,5), note=linkedNotes(goal)[0], payments=(state.plannedExpenses||[]).filter(p=>p.active!==false).slice(0,3);
  return `<div class="home-head clean-home-head"><div><div class="page-label">Главная</div><h1>Добрый вечер, Алексей! 👋</h1><p class="sub">${new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</p></div></div><div class="home-grid premium-home-grid"><div class="home-main"><div class="top-grid"><section class="card hero-card day-card"><div class="section-head"><h3>Порядок дня</h3><button class="ghost small" data-page="control">i</button></div><div class="big">${life}%</div><div class="progress"><span style="width:${life}%"></span></div><p class="sub">Отличный прогресс! Продолжай в том же духе.</p><div class="mini-grid"><div><b>${Math.max(tasks.length,1)}</b><span>Главные задачи</span></div><div><b>${Object.keys(hm).length}/${Math.max(habits.length,1)}</b><span>Привычек</span></div><div><b>${money(s.left)}</b><span>Остаток месяца</span></div><div><b>18:00</b><span>Вопрос дня</span></div></div><div class="mountain-decor"></div></section><section class="card hero-card finance-hero"><div class="section-head"><h3>Можно тратить сегодня</h3><button class="ghost small" data-action="todayLimit">i</button></div><div class="big">${money(s.dailyLimit)}</div><span class="sub">из ${money(Math.max(4000,s.dailyLimit+expToday))}</span><div class="progress"><span style="width:${Math.min(100,Math.max(8,46))}%"></span></div><div class="money-list"><p><span>Лимит на сегодня</span><b>${Math.min(100,Math.max(0,Math.round((s.dailyLimit? s.dailyLimit/(Math.max(s.dailyLimit,expToday||1))*100:46))))}%</b></p></div></section><section class="card attention-card"><div class="section-head"><h3>Что требует внимания</h3><span class="tag amber">${attentionItems().length}</span></div><div class="attention-list premium-attention">${attentionItems().map(x=>`<div class="attention-row ${x[0]}"><i>${x[1]}</i><span>${esc(x[2])}</span></div>`).join('')}</div><button class="link-btn" data-page="control">Перейти к контролю →</button></section></div><div class="mid-grid premium-mid-grid"><section class="card"><div class="section-head"><h3>Задачи на сегодня</h3><button class="ghost small" data-action="addTask">＋</button></div>${tasks.length?tasks.map(taskLine).join(''):'<div class="empty">Сегодня пусто — добавь фокус дня</div>'}<button class="link-btn subtle" data-action="addTask">＋ Новая задача</button></section><section class="card"><div class="section-head"><h3>Привычки</h3><button class="ghost small" data-action="addHabit">＋</button></div>${habits.length?habits.map(habitLine).join(''):'<div class="empty">Нет привычек</div>'}</section><section class="card"><div class="section-head"><h3>Финансы сегодня</h3><button class="ghost small" data-action="addExpense">＋</button></div><div class="money-list"><p><span>Расходы</span><b class="red-text">${money(expToday)}</b></p><p><span>Доходы</span><b class="green-text">${money(incToday)}</b></p></div>${spark(expSeries.map(x=>x.value),'var(--green)')}<button class="link-btn subtle" data-page="finance">Смотреть финансы →</button></section><section class="card"><div class="section-head"><h3>Фокус недели</h3><button class="ghost small" data-page="goals">＋</button></div>${goal?`<div class="focus-box"><b>⚑ Главная цель недели</b><p>${esc(goal.title)}</p><div class="progress"><span style="width:${goalProgress(goal)}%"></span></div><div class="money-list"><p><span>${esc(goal.nextAction||'Следующий шаг не указан')}</span><b>${goalProgress(goal)}%</b></p></div></div>`:'<div class="empty">Нет активной цели</div>'}<div class="sub-list"><h4>Что нельзя делать</h4><ul class="no-list">${(state.settings.weekNoList||'').split(/\n+/).slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></section></div><section class="card analytics-card"><div class="section-head"><div><h3>Аналитика недели <small>19 — 26 июня</small></h3><div class="tab-row"><button class="tab active">Обзор</button><button class="tab">Финансы</button><button class="tab">Задачи</button><button class="tab">Привычки</button><button class="tab">Цели</button></div></div><button class="ghost small">Неделя ▾</button></div><div class="metrics premium-metrics"><article class="metric"><b>${money(s.expenses)}</b><span>Расходы</span>${spark(expSeries.map(x=>x.value),'var(--blue)')}</article><article class="metric"><b>${money(s.income)}</b><span>Доходы</span>${spark(incSeries.map(x=>x.value),'var(--green)')}</article><article class="metric"><b>${money(Math.max(0,s.left))}</b><span>Сбережения</span>${spark(incSeries.map((x,i)=>Math.max(0,x.value-(expSeries[i]?.value||0))),'var(--green)')}</article><article class="metric"><b>${life}%</b><span>Порядок дня</span><div class="progress"><span style="width:${life}%"></span></div></article></div><div class="charts premium-charts"><article class="chart-box"><h4>Динамика расходов</h4>${barChart(expSeries)}</article><article class="chart-box"><h4>Расходы по категориям</h4>${cats.length?donut(cats):'<div class="empty">Нет данных</div>'}</article><article class="chart-box"><h4>Динамика привычек</h4>${heatmap()}</article></div></section></div><aside class="rail right-rail"><section class="card"><div class="section-head"><div><h3>Связи как в Obsidian</h3><p class="sub">Двусторонние связи между всеми сущностями: задачи, цели, заметки, финансы, привычки, люди.</p></div><button class="ghost small" data-page="notes">Связи</button></div>${goal?graph(goal):'<div class="empty">Нет цели</div>'}</section><section class="card"><div class="section-head"><h3>Пример страницы заметки</h3><button class="ghost small" data-action="addNote">＋</button></div>${note?`<article class="note-card-preview"><small class="sub">↖ Заметки / ${esc(note.title)}</small><h4>${esc(note.title)}</h4><p class="sub">Связано с</p><p class="link-line">[[${esc(goal?.title||'SMART-цель')}]]</p><p>${esc(note.text||'')}</p><div class="note-tags">${(note.tags||[]).map(t=>`<span>#${esc(t)}</span>`).join('')}</div><div class="top-actions"><button class="ghost">Открыть заметку</button><button class="ghost" data-page="goals">Открыть связи</button></div></article>`:'<div class="empty">Заметок пока нет</div>'}</section><section class="card"><div class="section-head"><h3>Ближайшие платежи</h3><button class="ghost small" data-action="addPayment">＋</button></div>${payments.map(p=>`<div class="pay-row"><span>${esc(p.title||'Платёж')}</span><b>${money(p.amount)}</b><small>${String(p.day||'').padStart(2,'0')} июня</small></div>`).join('') || '<div class="empty">Платежей нет</div>'}<button class="link-btn" data-page="finance">Все платежи →</button></section><section class="card insight-card"><h3>Последний инсайт</h3><p>${esc(state.journal?.[0]?.insight||'Когда я фокусируюсь на главном, я успеваю больше и чувствую себя лучше.')}</p><small class="sub">Сегодня, 09:15</small></section></aside></div>`;
}
function taskLine(t){ return `<div class="task-line"><button class="round-check" data-action="toggleTask" data-id="${t.id}">${t.status==='Готово'?'✓':'○'}</button><div class="task-main"><b>${esc(t.title)}</b><p>${esc(t.nextAction||t.area||'')}</p></div><span class="tag blue">${esc(t.area||'Личное')}</span><time>${esc(t.time||'—')}</time></div>`; }
function habitLine(h){ const done=!!state.habitLogs?.[todayKey()]?.[h.id]; return `<label class="habit-line"><div class="habit-main"><b>${esc(h.name)}</b><p>${esc(h.area||'Личное')}</p></div><em>${done?'сегодня':(h.targetPerWeek||0)+' дней'}</em><input type="checkbox" data-habit="${h.id}" ${done?'checked':''}></label>`; }

function goals(){
  const g=currentGoal(); if(!g) return `<div class="goals-head"><div><div class="page-label">SMART-цели</div><h1>Цели</h1><p class="sub">Создай первую цель — она станет объектной страницей.</p></div><button class="primary" data-action="addGoal">＋ Новая цель</button></div>`;
  const stats=rpgStats(g), tasks=linkedTasks(g), notes=linkedNotes(g), tab=goalTab(), tabs=[['overview','Обзор'],['quests','Задачи'],['knowledge','Заметки'],['links','Связи'],['database','База']];
  let body='';
  if(tab==='quests') body=`<div class="goal-tab"><section class="card panel"><div class="section-head"><div><h3>Главные квесты</h3><p class="sub">Что нужно сделать сейчас.</p></div><button class="primary" data-action="addGoalTask" data-id="${g.id}">＋ Действие</button></div>${tasks.length?tasks.map(questRow).join(''):'<div class="empty">Пока нет действий. Создай первый квест.</div>'}</section><section class="card panel">${graph(g)}</section></div>`;
  else if(tab==='knowledge') body=`<div class="goal-tab"><section class="card panel"><div class="section-head"><div><h3>База знаний</h3><p class="sub">Инсайты, заметки и идеи по цели.</p></div><button class="primary" data-action="addGoalNote" data-id="${g.id}">＋ Заметка</button></div>${notes.length?notes.map(noteRow).join(''):'<div class="empty">Пока нет заметок</div>'}</section><section class="card panel"><div class="section-head"><h3>Прогресс цели</h3><button class="ghost" data-action="progressGoal" data-id="${g.id}">Обновить</button></div>${lineChart(g)}</section></div>`;
  else if(tab==='links') body=`<div class="goal-tab"><section class="card panel"><div class="section-head"><div><h3>Граф связей</h3><p class="sub">Связь цели с задачами, заметками, привычками, людьми и финансами.</p></div><button class="ghost" data-page="notes">Открыть заметки</button></div>${graph(g)}</section><section class="card panel"><div class="section-head"><h3>Связанные сущности</h3></div><div class="line-stack"><div class="line-row"><span class="tag blue">Задачи</span><b>${tasks.length}</b></div><div class="line-row"><span class="tag green">Заметки</span><b>${notes.length}</b></div><div class="line-row"><span class="tag amber">Люди</span><b>${linkedPeople(g).length}</b></div></div></section></div>`;
  else if(tab==='database') body=`<section class="card panel"><div class="section-head"><div><h3>База целей</h3><p class="sub">Коллекция всех активных целей.</p></div><button class="primary" data-action="addGoal">＋ Цель</button></div><div class="goal-switch">${activeGoals().map(x=>`<button class="${x.id===g.id?'active':''}" data-action="pickGoal" data-id="${x.id}"><small>${esc(x.area||'Личное')}</small><b>${esc(x.title)}</b><span>${goalProgress(x)}%</span></button>`).join('')}</div></section>`;
  else body=`<div class="overview-grid"><section class="card mission"><div class="mission-top"><div><div class="page-label">Цель</div><h3>${esc(g.title)}</h3><p>${esc(g.why||'Цель должна быть ясной, измеримой и эмоционально заряженной.')}</p></div><div class="mission-score"><b>${goalProgress(g)}%</b><span>Прогресс</span></div></div><div class="progress"><span style="width:${goalProgress(g)}%"></span></div><div class="mission-kpis"><div><b>${valFmt(g,g.currentValue)}</b><span>Текущее</span></div><div><b>${valFmt(g,g.targetValue)}</b><span>Цель</span></div><div><b>${tasks.filter(t=>t.status==='Готово').length}/${tasks.length}</b><span>Квестов</span></div><div><b>${notes.length}</b><span>Заметок</span></div></div></section><section class="card rpg-card"><div class="section-head"><div><h3>RPG-профиль цели</h3><p class="sub">Каждая цель — миссия с уровнем и XP.</p></div><span class="tag green">Lv.${stats.level}</span></div><div class="avatar-block"><div class="avatar-ring"><b>${stats.level}</b><small>LEVEL</small></div><div><b>${esc(state.rpg?.class||'Архитектор жизни')}</b><p class="sub">${esc(state.rpg?.rank||'Стратег')}</p><div class="xp-bar"><span style="width:${Math.round(stats.current/stats.next*100)}%"></span></div><small class="sub">${stats.current}/${stats.next} XP до следующего уровня</small></div></div><div class="rpg-stats"><div><b>${stats.progress}%</b><span>Прогресс</span></div><div><b>${stats.done}</b><span>Квестов</span></div><div><b>${stats.streak}</b><span>Серия</span></div><div><b>${stats.notes}</b><span>Заметок</span></div></div></section><section class="card panel"><div class="section-head"><div><h3>Главные квесты</h3><p class="sub">Что нужно сделать сейчас.</p></div><button class="primary" data-action="addGoalTask" data-id="${g.id}">＋ Действие</button></div>${tasks.length?tasks.slice(0,4).map(questRow).join(''):'<div class="empty">Пока нет квестов</div>'}</section><section class="card panel"><div class="section-head"><h3>Граф связей</h3><button class="ghost" data-page="notes">Связи</button></div>${graph(g)}</section><section class="card panel"><div class="section-head"><h3>База знаний</h3><button class="primary" data-action="addGoalNote" data-id="${g.id}">＋ Заметка</button></div>${notes.length?notes.slice(0,3).map(noteRow).join(''):'<div class="empty">Пока нет заметок</div>'}</section><section class="card panel"><div class="section-head"><h3>Прогресс цели</h3><button class="ghost" data-action="progressGoal" data-id="${g.id}">Обновить</button></div>${lineChart(g)}</section></div>`;
  return `<div class="goals-head premium-page-head"><div><div class="page-label">SMART-цели</div><h1>${esc(g.title)}</h1><p class="sub">${esc(g.nextAction||'Добавь следующий шаг, и цель станет живой миссией.')}</p></div><div class="top-actions"><button class="ghost" data-action="progressGoal" data-id="${g.id}">Обновить прогресс</button><button class="ghost" data-action="smartPlan" data-id="${g.id}">SMART-план</button><button class="ghost" data-action="addGoalNote" data-id="${g.id}">Заметка</button><button class="primary" data-action="addGoalTask" data-id="${g.id}">＋ Действие</button></div></div><div class="goal-switch">${activeGoals().map(x=>`<button class="${x.id===g.id?'active':''}" data-action="pickGoal" data-id="${x.id}"><small>${esc(x.area||'Личное')}</small><b>${esc(x.title)}</b><span>${goalProgress(x)}%</span></button>`).join('')}</div><section class="card goal-shell"><div class="goal-top"><div><span class="page-label">Объект цели</span><h2>${esc(g.title)}</h2></div><div class="top-actions"><span class="tag green">${goalProgress(g)}%</span><button class="ghost" data-action="completeGoal" data-id="${g.id}">${g.status==='Готово'?'Вернуть':'Закрыть цель'}</button></div></div><div class="tabs">${tabs.map(x=>`<button class="${tab===x[0]?'active':''}" data-action="goalTab" data-tab="${x[0]}">${x[1]}</button>`).join('')}</div>${body}</section>`;
}
function rpgCard(g,s){ const rewards=[25,50,75,100].map(p=>({p,done:s.progress>=p,label:p===25?'Прогрев системы':p===50?'Стабильный ритм':p===75?'Зона роста':'Босс закрыт'})); return `<section class="card rpg-card"><div class="section-head"><div><h3>RPG-профиль цели</h3><p class="sub">Каждая цель — миссия с уровнем, XP и наградами.</p></div><span class="tag green">Lv.${s.level}</span></div><div class="avatar-block"><div class="avatar-ring"><b>${s.level}</b><small>УРОВЕНЬ</small></div><div><b>${esc(state.rpg?.class||'Архитектор жизни')}</b><p class="sub">${esc(state.rpg?.rank||'Стратег')}</p><div class="xp-bar"><span style="width:${Math.round(s.current/s.next*100)}%"></span></div><small class="sub">${s.current}/${s.next} XP до следующего уровня</small></div></div><div class="rpg-stats"><div><b>${s.progress}%</b><span>Прогресс</span></div><div><b>${s.done}</b><span>Квестов</span></div><div><b>${s.streak}</b><span>Серия</span></div><div><b>${s.notes}</b><span>Заметок</span></div></div><div class="loot-list"><b>Награды и этапы</b>${rewards.map(r=>`<div class="loot ${r.done?'done':''}"><i>${r.done?'✓':'○'}</i><span>${r.p}% · ${r.label}</span></div>`).join('')}</div></section>`; }
function questRow(t){ const done=t.status==='Готово'; return `<article class="quest-row ${done?'done':''}"><button class="round-check" data-action="toggleTask" data-id="${t.id}">${done?'✓':'○'}</button><div class="quest-main"><b>${esc(t.title)}</b><p>${esc(t.nextAction||t.area||'Следующее действие')}</p><div class="quest-meta"><span class="tag ${done?'green':'blue'}">${esc(t.priority||'Средний')}</span><span>${esc(t.due||'без даты')} ${esc(t.time||'')}</span></div></div><div class="quest-side"><span class="xp">+${done?30:15} XP</span><button class="ghost" data-action="editTask" data-id="${t.id}">Изменить</button></div></article>`; }
function noteRow(n){ return `<article class="note-row"><b>${esc(n.title||'Заметка')}</b><small class="sub">${esc(n.date||n.createdAt||'')}</small><p>${esc(n.text||'')}</p><div class="note-tags">${(n.tags||[]).map(t=>`<span>#${esc(t)}</span>`).join('')}</div></article>`; }

function tasks(){ const groups={backlog:[],today:[],work:[],done:[]}; (state.tasks||[]).forEach(t=>{ if(t.status==='Готово') groups.done.push(t); else if(t.due===todayKey()) groups.today.push(t); else if(t.status==='В работе') groups.work.push(t); else groups.backlog.push(t); }); const cols=[['backlog','Бэклог'],['today','Сегодня'],['work','В работе'],['done','Готово']]; return `<div class="goals-head"><div><div class="page-label">Панель задач</div><h1>Задачи + календарь</h1><p class="sub">Задачи теперь работают как квесты: каждая может быть связана с целью, человеком и заметкой.</p></div><button class="primary" data-action="addTask">＋ Новая задача</button></div><div class="kanban">${cols.map(([k,l])=>`<section class="kanban-col"><div class="section-head"><h3>${l}</h3><span class="tag">${groups[k].length}</span></div>${groups[k].sort(taskSort).map(t=>`<article class="task-card"><b>${esc(t.title)}</b><p class="sub">${esc(t.area||'Личное')} · ${esc(t.due||'без даты')} ${esc(t.time||'')}</p><div class="top-actions"><button class="ghost" data-action="toggleTask" data-id="${t.id}">${t.status==='Готово'?'Вернуть':'Готово'}</button><button class="ghost" data-action="editTask" data-id="${t.id}">Изм.</button></div></article>`).join('')||'<div class="empty">Пусто</div>'}</section>`).join('')}</div><section class="card"><div class="section-head"><h3>Таблица задач</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Задача</th><th>Статус</th><th>Дата</th><th>Цель</th><th></th></tr></thead><tbody>${(state.tasks||[]).map(t=>`<tr><td><b>${esc(t.title)}</b></td><td>${esc(t.status||'В работе')}</td><td>${esc(t.due||'—')} ${esc(t.time||'')}</td><td>${esc((state.goals||[]).find(g=>g.id===t.goalId)?.title||'—')}</td><td><button class="ghost" data-action="editTask" data-id="${t.id}">Открыть</button></td></tr>`).join('')}</tbody></table></div></section>`; }

function today(){
  const tasks=todayTasks(), habits=todayHabits(), hm=state.habitLogs?.[todayKey()]||{}, s=monthSummary(), goal=currentGoal();
  return `<div class="goals-head premium-page-head"><div><div class="page-label">Сегодня</div><h1>Сегодня</h1><p class="sub">Фокус дня: задачи, привычки, лимит и вопрос дня.</p></div><div class="top-actions"><button class="primary" data-action="addTask">＋ Задача</button><button class="ghost" data-action="addExpense">＋ Расход</button></div></div><div class="today-grid"><section class="card panel"><div class="section-head"><h3>Задачи дня</h3><span class="tag blue">${tasks.length}</span></div>${tasks.length?tasks.map(taskLine).join(''):'<div class="empty">На сегодня задач нет</div>'}</section><section class="card panel"><div class="section-head"><h3>Привычки дня</h3><span class="tag green">${Object.keys(hm).length}/${habits.length}</span></div>${habits.map(habitLine).join('')}</section><section class="card panel"><h3>Лимит дня</h3><div class="big small-big">${money(s.dailyLimit)}</div><div class="progress"><span style="width:${s.dailyLimit?60:0}%"></span></div><button class="link-btn" data-action="todayLimit">Почему такой лимит →</button></section><section class="card panel"><h3>Главный фокус</h3>${goal?`<div class="focus-box"><b>${esc(goal.title)}</b><p>${esc(goal.nextAction||'Следующий шаг не указан')}</p><div class="progress"><span style="width:${goalProgress(goal)}%"></span></div></div>`:'<div class="empty">Нет цели</div>'}</section></div>`;
}
function debtItems(){
  const explicit = Array.isArray(state.debts) ? state.debts : [];
  if(explicit.length) return explicit.map(d=>({id:d.id||uid(), direction:d.direction||'owe', person:d.person||d.name||'Без имени', amount:num(d.amount), due:d.due||'', status:d.status||'Активен', note:d.note||''}));
  const ops=(state.operations||[]).filter(o=>/долг|за[её]м|займ|вернуть|одолж|кредит|ипотек/i.test(`${o.category||''} ${o.note||''}`));
  return ops.map(o=>({id:o.id,direction:o.type==='income'?'owed_to_me':'owe',person:o.note||o.category||'Долг',amount:num(o.amount),due:o.date||'',status:o.type==='income'?'Вернули/доход':'Активен',note:o.category||''}));
}
function financeModel(){
  const s=monthSummary();
  const balance = s.income - s.expenses;
  const debts = debtItems().filter(d=>d.status!=='Закрыт');
  const owe = debts.filter(d=>d.direction==='owe').reduce((sum,d)=>sum+num(d.amount),0);
  const owed = debts.filter(d=>d.direction==='owed_to_me').reduce((sum,d)=>sum+num(d.amount),0);
  const planned = (state.plannedExpenses||[]).filter(p=>p.active!==false).reduce((sum,p)=>sum+num(p.amount),0);
  const net = balance + owed - owe;
  const reserveDays = s.dailyLimit ? Math.max(0, Math.floor(Math.max(0,s.left)/Math.max(1,s.dailyLimit))) : 0;
  return {...s,balance,debts,owe,owed,planned,net,reserveDays};
}
function debtMiniRow(d){
  const isOwe=d.direction==='owe';
  return `<article class="debt-mini-row ${isOwe?'owe':'owed'}"><div><b>${esc(d.person)}</b><p>${esc(d.note||d.status||'')}</p></div><strong class="${isOwe?'red-text':'green-text'}">${isOwe?'-':'+'}${money(d.amount)}</strong><small>${esc(d.due||'без даты')}</small></article>`;
}
function financeHero(f){
  const tone=f.net>=0?'green':'red';
  return `<section class="card finance-command-card"><div class="finance-hero-bg"></div><div class="section-head"><div><div class="page-label">Финансовый центр</div><h3>Текущий баланс</h3></div><span class="tag ${tone==='green'?'green':'warn'}">${f.net>=0?'ресурс в плюсе':'есть нагрузка'}</span></div><div class="finance-balance ${tone}">${money(f.balance)}</div><p class="sub">Чистая позиция с учётом долгов: <b>${money(f.net)}</b></p><div class="finance-hero-grid"><div><span>Должен</span><b class="red-text">${money(f.owe)}</b></div><div><span>Тебе должны</span><b class="green-text">${money(f.owed)}</b></div><div><span>Платежи</span><b>${money(f.planned)}</b></div><div><span>Запас</span><b>${f.reserveDays} дн.</b></div></div></section>`;
}
function debts(){
  const f=financeModel();
  const owe=f.debts.filter(d=>d.direction==='owe');
  const owed=f.debts.filter(d=>d.direction==='owed_to_me');
  return `<div class="goals-head premium-page-head"><div><div class="page-label">Долговая карта</div><h1>Долги</h1><p class="sub">Отдельно видно, кому должен ты, кто должен тебе и как это влияет на чистую позицию.</p></div><div class="top-actions"><button class="primary" data-action="addExpense">＋ Я должен / отдал</button><button class="ghost" data-action="addIncome">＋ Мне вернули</button></div></div><div class="metrics finance-metrics"><article class="metric"><b class="red-text">${money(f.owe)}</b><span>Кому я должен</span></article><article class="metric"><b class="green-text">${money(f.owed)}</b><span>Кто должен мне</span></article><article class="metric"><b>${money(f.net)}</b><span>Чистая позиция</span></article><article class="metric"><b>${f.debts.length}</b><span>Активных записей</span></article></div><div class="finance-debt-grid"><section class="card panel debt-card"><div class="section-head"><h3>Кому я должен</h3><span class="tag warn">${owe.length}</span></div>${owe.length?owe.map(debtMiniRow).join(''):'<div class="empty">Активных долгов нет</div>'}</section><section class="card panel debt-card"><div class="section-head"><h3>Кто должен мне</h3><span class="tag green">${owed.length}</span></div>${owed.length?owed.map(debtMiniRow).join(''):'<div class="empty">Тебе пока никто не должен</div>'}</section></div>`;
}
function payments(){
  const rows=(state.plannedExpenses||[]).filter(p=>p.active!==false).sort((a,b)=>num(a.day)-num(b.day));
  return `<div class="goals-head premium-page-head"><div><div class="page-label">Платежи</div><h1>Платежи</h1><p class="sub">Регулярные и ближайшие платежи отдельно от общего журнала финансов.</p></div><button class="primary" data-action="addPayment">＋ Платёж</button></div><section class="card panel"><div class="section-head"><h3>Ближайшие платежи</h3><span class="tag">${rows.length}</span></div>${rows.length?rows.map(p=>`<div class="pay-row big-pay"><span>${esc(p.title||'Платёж')}</span><b>${money(p.amount)}</b><small>${String(p.day||'').padStart(2,'0')} число</small></div>`).join(''):'<div class="empty">Платежей пока нет</div>'}</section>`;
}
function importPage(){
  return `<div class="goals-head premium-page-head"><div><div class="page-label">Импорт</div><h1>Импорт банка</h1><p class="sub">Загрузка CSV/таблицы банка и разбор операций.</p></div><button class="primary" data-action="addExpense">＋ Добавить вручную</button></div><section class="card panel"><div class="drop-zone"><b>Перетащи CSV сюда</b><p class="sub">В этой сборке импорт подготовлен как отдельная зона, чтобы не смешивать с финансами.</p></div></section><section class="card panel"><h3>Как будем улучшать</h3><ul class="no-list"><li>Распознавание категорий</li><li>Предпросмотр перед загрузкой</li><li>Автоматическое исключение дублей</li></ul></section>`;
}
function birthdays(){
  const rows=(state.people||[]).filter(p=>p.birthday).sort((a,b)=>String(a.birthday).slice(5).localeCompare(String(b.birthday).slice(5)));
  return `<div class="goals-head premium-page-head"><div><div class="page-label">Дни рождения</div><h1>Дни рождения</h1><p class="sub">Календарь важных дат по людям.</p></div><button class="primary" data-action="addPerson">＋ Человек</button></div><section class="card panel">${rows.length?rows.map(p=>`<div class="person-row"><b>${esc(p.name)}</b><span>${esc(p.birthday)}</span><small>${esc(p.relation||'')}</small></div>`).join(''):'<div class="empty">Дней рождения пока нет</div>'}</section>`;
}
function gifts(){
  const rows=(state.people||[]).filter(p=>p.gifts || p.likes);
  return `<div class="goals-head premium-page-head"><div><div class="page-label">Подарки</div><h1>Подарки</h1><p class="sub">Идеи подарков и предпочтения людей.</p></div><button class="primary" data-action="addPerson">＋ Человек</button></div><div class="people-grid">${rows.length?rows.map(p=>`<article class="card"><div class="section-head"><h3>${esc(p.name)}</h3><span class="tag green">${esc(p.relation||'контакт')}</span></div><p><b>Любит:</b> ${esc(p.likes||'—')}</p><p><b>Идеи подарков:</b> ${esc(p.gifts||'—')}</p></article>`).join(''):'<div class="empty">Идей подарков пока нет</div>'}</div>`;
}
function finance(){
  const f=financeModel(), cats=categoryTotals(), rows=[...(state.operations||[])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,40), expSeries=weekSeries('expense'), incSeries=weekSeries('income');
  const owe=f.debts.filter(d=>d.direction==='owe').slice(0,4), owed=f.debts.filter(d=>d.direction==='owed_to_me').slice(0,4), payments=(state.plannedExpenses||[]).filter(p=>p.active!==false).sort((a,b)=>num(a.day)-num(b.day)).slice(0,5);
  const flowMax=Math.max(f.income,f.expenses,1);
  return `<div class="goals-head finance-head"><div><div class="page-label">Финансовый центр</div><h1>Финансы</h1><p class="sub">Баланс, долги, регулярные платежи и денежный поток в одном месте. Финансы = ресурс персонажа.</p></div><div class="top-actions"><button class="primary" data-action="addExpense">＋ Расход</button><button class="ghost" data-action="addIncome">＋ Доход</button><button class="ghost" data-action="addPayment">Платёж</button></div></div><div class="finance-dashboard-grid">${financeHero(f)}<section class="card finance-flow-card"><div class="section-head"><h3>Денежный поток</h3><span class="tag blue">месяц</span></div><div class="flow-row"><span>Доходы</span><b class="green-text">${money(f.income)}</b></div><div class="flow-bar"><i style="width:${Math.max(4,f.income/flowMax*100)}%"></i></div><div class="flow-row"><span>Расходы</span><b class="red-text">${money(f.expenses)}</b></div><div class="flow-bar red"><i style="width:${Math.max(4,f.expenses/flowMax*100)}%"></i></div><div class="flow-divider"></div><div class="flow-row strong"><span>Остаток месяца</span><b>${money(f.left)}</b></div><div class="flow-row"><span>Можно сегодня</span><b>${money(f.dailyLimit)}</b></div></section><section class="card finance-rpg-card"><div class="section-head"><h3>RPG-экономика</h3><span class="tag ${f.net>=0?'green':'warn'}">${f.net>=0?'бафф':'дебафф'}</span></div><div class="resource-orb"><b>${f.net>=0?'+':'−'}</b><span>ресурс</span></div><p class="sub">Закрытие долга = снятие дебаффа. Рост чистой позиции = прокачка финансового уровня.</p><div class="progress"><span style="width:${Math.min(100,Math.max(8,(f.net+f.owe)/(Math.max(1,f.income+f.owed))*100))}%"></span></div></section></div><div class="finance-debt-grid"><section class="card panel debt-card"><div class="section-head"><div><h3>Кому я должен</h3><p class="sub">Активная долговая нагрузка</p></div><button class="ghost small" data-page="debts">Открыть</button></div>${owe.length?owe.map(debtMiniRow).join(''):'<div class="empty">Активных долгов нет</div>'}</section><section class="card panel debt-card"><div class="section-head"><div><h3>Кто должен мне</h3><p class="sub">Ожидаемые возвраты</p></div><button class="ghost small" data-page="debts">Открыть</button></div>${owed.length?owed.map(debtMiniRow).join(''):'<div class="empty">Тебе пока никто не должен</div>'}</section></div><div class="analytics-grid finance-lower-grid"><section class="card"><div class="section-head"><h3>Последние операции</h3><button class="ghost small" data-action="addExpense">＋</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Дата</th><th>Тип</th><th>Категория</th><th>Сумма</th><th>Комментарий</th></tr></thead><tbody>${rows.map(o=>`<tr><td>${esc(o.date)}</td><td><span class="tag ${o.type==='income'?'green':'warn'}">${o.type==='income'?'Доход':'Расход'}</span></td><td>${esc(o.category||'—')}</td><td><b class="${o.type==='income'?'green-text':'red-text'}">${money(o.amount)}</b></td><td>${esc(o.note||'')}</td></tr>`).join('')}</tbody></table></div></section><aside class="rail"><section class="card"><div class="section-head"><h3>Плановые платежи</h3><button class="ghost small" data-page="payments">Все</button></div>${payments.length?payments.map(p=>`<div class="pay-row"><span>${esc(p.title||'Платёж')}</span><b>${money(p.amount)}</b><small>${String(p.day||'').padStart(2,'0')} число</small></div>`).join(''):'<div class="empty">Нет платежей</div>'}</section><section class="card"><h3>Расходы по категориям</h3>${cats.length?donut(cats):'<div class="empty">Нет данных</div>'}</section></aside></div>`;
}
function habits(){ const habits=todayHabits(); return `<div class="goals-head"><div><div class="page-label">Привычки и состояние</div><h1>Привычки + состояние</h1><p class="sub">Привычки — навыки персонажа. Каждая отметка добавляет устойчивость.</p></div><button class="primary" data-action="addHabit">＋ Привычка</button></div><div class="metrics"><article class="metric"><b>${Object.keys(state.habitLogs?.[todayKey()]||{}).length}/${habits.length}</b><span>Сегодня</span></article><article class="metric"><b>${lifeScore()}%</b><span>Порядок дня</span></article><article class="metric"><b>${state.states?.[0]?.energy||'—'}</b><span>Энергия</span></article><article class="metric"><b>18:00</b><span>Вопрос дня</span></article></div><section class="card"><div class="section-head"><h3>Навыки дня</h3></div>${habits.map(habitLine).join('')}</section><section class="card"><div class="section-head"><h3>Динамика привычек</h3></div>${heatmap()}</section>`; }
function notes(){ const all=[...(state.notes||[]),...(state.goalNotes||[])].sort((a,b)=>String(b.createdAt||b.date||'').localeCompare(String(a.createdAt||a.date||''))); const g=currentGoal(); return `<div class="goals-head premium-page-head"><div><div class="page-label">База знаний</div><h1>Инсайты</h1><p class="sub">Заметки работают как база знаний и Obsidian-связи.</p></div><button class="primary" data-action="addNote">＋ Новая заметка</button></div><div class="home-grid premium-home-grid notes-layout"><div class="home-main"><section class="card panel"><div class="section-head"><h3>Все заметки</h3></div>${all.length?all.map(noteRow).join(''):'<div class="empty">Заметок пока нет</div>'}</section></div><aside class="rail"><section class="card"><h3>Граф главной цели</h3>${g?graph(g):'<div class="empty">Нет цели</div>'}</section><section class="card"><h3>Как работает</h3><ul class="no-list"><li>Цель связывается с задачами</li><li>Заметки хранят знания</li><li>Люди становятся союзниками</li><li>Финансы — ресурс</li></ul></section></aside></div>`; }
function books(){ return `<div class="goals-head premium-page-head"><div><div class="page-label">Книги</div><h1>Книги</h1><p class="sub">Твоя библиотека роста и конспекты.</p></div><button class="primary">＋ Новая книга</button></div><section class="card panel"><div class="section-head"><h3>Список книг</h3></div><div class="empty">Книг пока нет</div></section>`; }
function people(){ return `<div class="goals-head premium-page-head"><div><div class="page-label">Люди</div><h1>Контакты</h1><p class="sub">Контакты, идеи разговоров, дни рождения и подарки.</p></div><button class="primary" data-action="addPerson">＋ Человек</button></div><div class="kanban people-grid">${(state.people||[]).map(p=>`<article class="card"><div class="section-head"><h3>${esc(p.name)}</h3><span class="tag green">${esc(p.relation||'контакт')}</span></div><p><b>ДР:</b> ${esc(p.birthday||'—')}</p><p><b>Любит:</b> ${esc(p.likes||'—')}</p><p><b>О чём поговорить:</b> ${esc(p.talkIdeas||'—')}</p><p><b>Подарки:</b> ${esc(p.gifts||'—')}</p></article>`).join('')||'<div class="empty">Людей пока нет</div>'}</div>`; }
function control(){ const items=[]; const q=searchQuery.toLowerCase(); if(q){ for(const t of state.tasks||[]) if(JSON.stringify(t).toLowerCase().includes(q)) items.push(['Задача',t.title,'tasks']); for(const g of state.goals||[]) if(JSON.stringify(g).toLowerCase().includes(q)) items.push(['Цель',g.title,'goals']); for(const n of state.notes||[]) if(JSON.stringify(n).toLowerCase().includes(q)) items.push(['Заметка',n.title,'notes']); } return `<div class="goals-head"><div><div class="page-label">Системный контроль</div><h1>Контроль</h1><p class="sub">Поиск, диагностика системы и быстрые действия по управлению приложением.</p></div><button class="primary" data-action="repair">Проверить систему</button></div><div class="metrics"><article class="metric"><b>${RELEASE.split('-')[0].toUpperCase()}</b><span>Версия</span></article><article class="metric"><b>${state.tasks.length}</b><span>Задач</span></article><article class="metric"><b>${state.goals.length}</b><span>Целей</span></article><article class="metric"><b>${state.notes.length}</b><span>Заметок</span></article></div><section class="card"><h3>Результаты поиска</h3>${q?(items.length?items.map(x=>`<div class="line-row"><span class="tag blue">${x[0]}</span><b>${esc(x[1])}</b><button class="ghost" data-page="${x[2]}">Открыть</button></div>`).join(''):'<div class="empty">Ничего не найдено</div>'):'<div class="empty">Начни писать в поиске сверху</div>'}</section>`; }
function sync(){
  const r = integrityReport();
  const ok = r.status === 'ok';
  const mb = (r.bytes/1024).toFixed(1) + ' КБ';
  return `<div class="goals-head data-head"><div><div class="page-label">Data Core V40.1</div><h1>Данные и резервные копии</h1><p class="sub">Здесь ядро сохранности: бэкап, восстановление, локальные снимки, диагностика и сброс кэша без потери данных.</p></div><div class="top-actions"><button class="primary" data-action="backup">Скачать полный бэкап</button><button class="ghost" data-action="createSnapshot">Создать снимок</button></div></div><div class="metrics data-metrics">${dataMetric('Статус базы', ok?'OK':'Нужна проверка', ok?'структура целая':r.problems.join(', '), ok?'':'warn')} ${dataMetric('Размер данных', mb, 'localStorage')} ${dataMetric('Снимков', r.localSnapshots, 'последние локальные копии')} ${dataMetric('Checksum', r.checksum, 'контрольная сумма')}</div><div class="data-core-grid"><section class="card panel data-card"><div class="section-head"><div><h3>Резервная копия</h3><p class="sub">Перед каждым крупным обновлением скачивай полный JSON. Его можно вернуть обратно кнопкой восстановления.</p></div><span class="tag green">безопасно</span></div><div class="data-action-grid"><button class="primary" data-action="backup">Скачать полный бэкап</button><button class="ghost" data-action="pickBackupFile">Восстановить из файла</button><button class="ghost" data-action="repair">Проверить целостность</button><button class="danger-btn" data-action="resetCaches">Сбросить кэш приложения</button></div><input id="restoreFile" class="hidden-file" type="file" accept="application/json"><p class="sub">Важно: сброс кэша не удаляет твои данные. Данные живут отдельно в Data Core.</p></section><section class="card panel data-card"><div class="section-head"><div><h3>Диагностика</h3><p class="sub">Версия базы, счётчики сущностей и состояние PWA.</p></div><span class="tag blue">v40.1</span></div><pre class="diagnostic-pre">${esc(JSON.stringify({...r, serviceWorker:!!(navigator.serviceWorker&&navigator.serviceWorker.controller), standalone:isStandalone(), online:navigator.onLine}, null, 2))}</pre></section></div><section class="card panel"><div class="section-head"><div><h3>Локальные снимки</h3><p class="sub">Автоматические и ручные точки восстановления внутри приложения.</p></div><button class="ghost small" data-action="clearSnapshots">Очистить снимки</button></div><div class="snapshot-list">${snapshotRows()}</div></section>`;
}
function settings(){ return `<div class="goals-head"><div><div class="page-label">Настройки системы</div><h1>Настройки</h1><p class="sub">Настрой роль, стиль прохождения и антисписок недели.</p></div></div><section class="card"><div class="form-grid"><label>Класс персонажа<input id="rpgClass" value="${esc(state.rpg.class||'')}"></label><label>Ранг<input id="rpgRank" value="${esc(state.rpg.rank||'')}"></label><label class="full">Что нельзя делать на неделе<textarea id="weekNoList">${esc(state.settings.weekNoList||'')}</textarea></label></div><button class="primary" data-action="saveSettings">Сохранить изменения</button></section>`; }
function week(){ return `<div class="goals-head"><div><div class="page-label">План недели</div><h1>Неделя</h1><p class="sub">Фокус недели, ближайшие платежи и квесты.</p></div><button class="primary" data-action="weeklyReview">Сформировать обзор</button></div>${dashboard().split('<div class="home-grid">')[1] ? '<section class="card"><h3>Сводка недели</h3><p class="sub">Используй обзор недели на главной и цели как основной фокус.</p></section>' : ''}`; }


function integrityReport(){
  const problems=[];
  for(const k of essentialArrays()) if(!Array.isArray(state[k])) problems.push(`${k}: не массив`);
  if(!state.settings || typeof state.settings!=='object') problems.push('settings: нет объекта настроек');
  if(!state.rpg || typeof state.rpg!=='object') problems.push('rpg: нет профиля');
  const text = JSON.stringify(normalizeState(state, 'inspect'));
  const snaps = localSnapshots();
  return {
    status: problems.length ? 'needs_repair' : 'ok',
    problems,
    release: RELEASE,
    dataVersion: DATA_VERSION,
    updatedAt: state.dataCore?.updatedAt || '—',
    lastSnapshotAt: state.dataCore?.lastSnapshotAt || '—',
    localSnapshots: snaps.length,
    bytes: stateSizeBytes(),
    checksum: checksumString(text),
    counts: Object.fromEntries(essentialArrays().map(k=>[k,(state[k]||[]).length]))
  };
}
function dataMetric(label, value, hint='', cls=''){
  return `<article class="metric data-metric ${cls}"><b>${esc(value)}</b><span>${esc(label)}</span>${hint?`<small>${esc(hint)}</small>`:''}</article>`;
}
function snapshotRows(){
  const snaps = localSnapshots();
  if(!snaps.length) return '<div class="empty">Локальных снимков пока нет. Нажми «Создать снимок».</div>';
  return snaps.map((s,i)=>`<div class="snapshot-row"><div><b>${esc(new Date(s.createdAt).toLocaleString('ru-RU'))}</b><p>${esc(s.reason||'snapshot')} · ${esc(s.release||'unknown')} · ${esc(s.checksum||'')}</p></div><div class="snapshot-actions"><button class="ghost small" data-action="downloadSnapshot" data-id="${i}">Скачать</button><button class="ghost small" data-action="restoreSnapshot" data-id="${i}">Восстановить</button></div></div>`).join('');
}
function downloadJSON(payload, filename){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 500);
}
function exportBackup(){
  const payload = backupPayload('manual-download');
  state.dataCore.lastBackupAt = payload.createdAt;
  save({snapshot:true});
  downloadJSON(payload, `second-brain-full-backup-${todayKey()}-v40-1.json`);
  toast('Полный бэкап скачан');
}
function createManualSnapshot(){
  const snap = saveLocalSnapshot('manual');
  save();
  render();
  toast(snap ? 'Локальный снимок создан' : 'Не удалось создать снимок');
}
function downloadSnapshot(index){
  const snap = localSnapshots()[Number(index)];
  if(!snap) return toast('Снимок не найден');
  downloadJSON(snap, `second-brain-snapshot-${todayKey()}-${index}.json`);
}
function restoreSnapshot(index){
  const snap = localSnapshots()[Number(index)];
  if(!snap || !snap.state) return toast('Снимок не найден');
  saveLocalSnapshot('before-restore');
  state = normalizeState(snap.state, 'restore-local-snapshot');
  save({snapshot:true});
  activePage='sync';
  render();
  toast('Данные восстановлены из локального снимка');
}
function clearSnapshots(){
  localStorage.setItem(SNAPSHOT_KEY, '[]');
  state.dataCore.lastSnapshotAt = '';
  lastAutoSnapshotAt = Date.now();
  save();
  render();
  toast('Локальные снимки очищены');
}
function pickBackupFile(){ const input=$('#restoreFile'); if(input) input.click(); }
function importBackupFile(event){
  const file = event?.target?.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(String(reader.result||''));
      const incoming = unpackBackupPayload(parsed);
      if(!incoming || typeof incoming !== 'object') throw new Error('Файл не похож на бэкап Second Brain OS');
      saveLocalSnapshot('before-file-import');
      state = normalizeState(incoming, 'file-import');
      save({snapshot:true});
      activePage='sync';
      render();
      toast('Бэкап восстановлен из файла');
    }catch(e){
      console.warn(e);
      toast('Не удалось восстановить: проверь JSON-файл');
    }
  };
  reader.readAsText(file);
}
function runIntegrityRepair(){
  state = normalizeState(state, 'repair');
  save({snapshot:true});
  activePage='sync';
  render();
  toast('Целостность проверена, снимок создан');
}

function openModal(title, body, onSave){ modalSave=onSave||null; $('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h3>${title}</h3><button type="button" class="close" aria-label="Закрыть">×</button></div>${body}</div></div>`; const root=$('#modalRoot'); const backdrop=$('.modal-backdrop',root); const box=$('.modal',root); const close=$('.close',root); if(backdrop) backdrop.addEventListener('click', closeModal); if(box) box.addEventListener('click', e=>e.stopPropagation()); if(close) close.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); closeModal(); }); }
function closeModal(){ $('#modalRoot').innerHTML=''; modalSave=null; }
function val(id){ return $('#'+id)?.value || ''; }
function quickMenu(){ openModal('＋ Быстро добавить', `<div class="quick-grid"><button class="quick-tile" data-action="addExpense"><i>💸</i><b>Расход</b><small>кофе 350</small></button><button class="quick-tile" data-action="addIncome"><i>💰</i><b>Доход</b><small>проект 30000</small></button><button class="quick-tile" data-action="addTask"><i>☑️</i><b>Задача</b><small>с датой и целью</small></button><button class="quick-tile" data-action="addGoal"><i>🎯</i><b>Цель</b><small>новая миссия</small></button><button class="quick-tile" data-action="addNote"><i>🧠</i><b>Заметка</b><small>связи Obsidian</small></button><button class="quick-tile" data-action="addPerson"><i>👥</i><b>Человек</b><small>союзник</small></button></div>`); }
function goalOptions(selected=''){ return `<option value="">Без цели</option>${(state.goals||[]).map(g=>`<option value="${g.id}" ${g.id===selected?'selected':''}>${esc(g.title)}</option>`).join('')}`; }
function personOptions(selected=''){ return `<option value="">Без человека</option>${(state.people||[]).map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('')}`; }
function addTask(goalId=''){ openModal('Новая задача / квест', `<div class="form-grid"><label class="full">Название<input id="mTitle" placeholder="Что сделать?"></label><label>Дата<input id="mDue" type="date" value="${todayKey()}"></label><label>Время<input id="mTime" type="time"></label><label>Сфера<input id="mArea" value="Личное"></label><label>Приоритет<select id="mPriority"><option>Средний</option><option>Высокий</option><option>Низкий</option></select></label><label>Цель<select id="mGoal">${goalOptions(goalId)}</select></label><label>Человек<select id="mPerson">${personOptions()}</select></label><label class="full">Следующее действие<textarea id="mNext"></textarea></label></div><div class="top-actions"><button class="primary" data-action="saveTask">Сохранить</button></div>`); }
function saveTask(){ const title=val('mTitle').trim(); if(!title) return toast('Название обязательно'); state.tasks.unshift({id:uid(),title,area:val('mArea')||'Личное',due:val('mDue'),time:val('mTime'),priority:val('mPriority')||'Средний',status:'В работе',goalId:val('mGoal'),personId:val('mPerson'),nextAction:val('mNext')}); save(); closeModal(); render(); toast('Квест создан'); }
function editTask(id){ const t=state.tasks.find(x=>x.id===id); if(!t) return; openModal('Изменить задачу', `<div class="form-grid"><label class="full">Название<input id="mTitle" value="${esc(t.title)}"></label><label>Дата<input id="mDue" type="date" value="${esc(t.due||'')}"></label><label>Время<input id="mTime" type="time" value="${esc(t.time||'')}"></label><label>Сфера<input id="mArea" value="${esc(t.area||'')}"></label><label>Приоритет<select id="mPriority"><option ${t.priority==='Средний'?'selected':''}>Средний</option><option ${t.priority==='Высокий'?'selected':''}>Высокий</option><option ${t.priority==='Низкий'?'selected':''}>Низкий</option></select></label><label>Цель<select id="mGoal">${goalOptions(t.goalId)}</select></label><label>Человек<select id="mPerson">${personOptions(t.personId)}</select></label><label class="full">Следующее действие<textarea id="mNext">${esc(t.nextAction||'')}</textarea></label></div><div class="top-actions"><button class="primary" data-action="saveTaskEdit" data-id="${id}">Сохранить</button><button class="danger-btn" data-action="deleteTask" data-id="${id}">Удалить</button></div>`); }
function saveTaskEdit(id){ const t=state.tasks.find(x=>x.id===id); if(!t) return; Object.assign(t,{title:val('mTitle'),area:val('mArea'),due:val('mDue'),time:val('mTime'),priority:val('mPriority'),goalId:val('mGoal'),personId:val('mPerson'),nextAction:val('mNext')}); save(); closeModal(); render(); toast('Задача обновлена'); }
function addOperation(type){ openModal(type==='income'?'Доход':'Расход', `<div class="form-grid"><label>Дата<input id="mDate" type="date" value="${todayKey()}"></label><label>Сумма<input id="mAmount" type="number" placeholder="0"></label><label>Категория<input id="mCategory" value="${type==='income'?'Проект':'Другое'}"></label><label class="full">Комментарий<input id="mNote"></label></div><div class="top-actions"><button class="primary" data-action="saveOperation" data-type="${type}">Сохранить</button></div>`); }
function saveOperation(type){ if(!num(val('mAmount'))) return toast('Укажи сумму'); state.operations.unshift({id:uid(),date:val('mDate')||todayKey(),type,amount:num(val('mAmount')),category:val('mCategory')||'Другое',note:val('mNote')}); save(); closeModal(); render(); toast('Операция добавлена'); }
function addPayment(){ openModal('Плановый платёж', `<div class="form-grid"><label>Название<input id="mTitle"></label><label>Сумма<input id="mAmount" type="number"></label><label>День месяца<input id="mDay" type="number" min="1" max="31" value="28"></label><label>Месяц<input id="mMonth" type="month" value="${state.settings.currentMonth}"></label></div><div class="top-actions"><button class="primary" data-action="savePayment">Сохранить</button></div>`); }
function savePayment(){ state.plannedExpenses.unshift({id:uid(),title:val('mTitle')||'Платёж',amount:num(val('mAmount')),day:num(val('mDay'))||1,month:val('mMonth')||state.settings.currentMonth,active:true}); save(); closeModal(); render(); toast('Платёж добавлен'); }
function addGoal(){ openModal('Новая SMART-цель', `<div class="form-grid"><label class="full">Название<input id="mTitle" placeholder="Я ..."></label><label>Сфера<input id="mArea" value="Финансы"></label><label>Метрика<input id="mMetric" value="₽/мес"></label><label>Цель<input id="mTarget" type="number"></label><label>Текущее<input id="mCurrent" type="number"></label><label>Дедлайн<input id="mDeadline" type="date"></label><label class="full">Почему важно<textarea id="mWhy"></textarea></label><label class="full">Следующий шаг<textarea id="mNext"></textarea></label></div><div class="top-actions"><button class="primary" data-action="saveGoal">Создать цель</button></div>`); }
function saveGoal(){ const title=val('mTitle').trim(); if(!title) return toast('Название обязательно'); const id=uid(); state.goals.unshift({id,title,area:val('mArea')||'Личное',metric:val('mMetric'),targetValue:num(val('mTarget')),currentValue:num(val('mCurrent')),deadline:val('mDeadline'),why:val('mWhy'),nextAction:val('mNext'),status:'Активна'}); save(); localStorage.setItem('secondBrainOS.v36.currentGoal',id); closeModal(); activePage='goals'; render(); toast('Цель создана'); }
function progressGoal(id){ const g=state.goals.find(x=>x.id===id); if(!g) return; openModal('Обновить прогресс', `<div class="form-grid"><label>Текущее<input id="mCurrent" type="number" value="${num(g.currentValue)}"></label><label>Цель<input id="mTarget" type="number" value="${num(g.targetValue)}"></label><label class="full">Следующий шаг<textarea id="mNext">${esc(g.nextAction||'')}</textarea></label></div><div class="top-actions"><button class="primary" data-action="saveProgress" data-id="${id}">Сохранить</button></div>`); }
function saveProgress(id){ const g=state.goals.find(x=>x.id===id); if(!g) return; g.currentValue=num(val('mCurrent')); g.targetValue=num(val('mTarget')); g.nextAction=val('mNext'); save(); closeModal(); render(); toast('Прогресс обновлён'); }
function addNote(goalId=''){ openModal('Новая заметка', `<div class="form-grid"><label class="full">Название<input id="mTitle" placeholder="Идея / вывод"></label><label>Цель<select id="mGoal">${goalOptions(goalId)}</select></label><label>Человек<select id="mPerson">${personOptions()}</select></label><label class="full">Теги<input id="mTags" placeholder="идея, доход, фокус"></label><label class="full">Текст<textarea id="mText"></textarea></label></div><div class="top-actions"><button class="primary" data-action="saveNote">Сохранить</button></div>`); }
function saveNote(){ const title=val('mTitle')||'Заметка'; state.notes.unshift({id:uid(),title,text:val('mText'),goalId:val('mGoal'),personId:val('mPerson'),tags:val('mTags').split(/[,#;]/).map(x=>x.trim()).filter(Boolean),createdAt:todayKey()}); save(); closeModal(); render(); toast('Заметка сохранена'); }
function addHabit(){ openModal('Новая привычка', `<div class="form-grid"><label>Название<input id="mName"></label><label>Сфера<input id="mArea" value="Личное"></label><label>Цель в неделю<input id="mTarget" type="number" value="5"></label></div><div class="top-actions"><button class="primary" data-action="saveHabit">Сохранить</button></div>`); }
function saveHabit(){ state.habits.unshift({id:uid(),name:val('mName')||'Привычка',area:val('mArea')||'Личное',targetPerWeek:num(val('mTarget'))||5,active:true}); save(); closeModal(); render(); toast('Привычка добавлена'); }
function addPerson(){ openModal('Новый человек', `<div class="form-grid"><label>Имя<input id="mName"></label><label>Тип связи<input id="mRelation" value="контакт"></label><label>День рождения<input id="mBirthday" type="date"></label><label class="full">Что любит<input id="mLikes"></label><label class="full">О чём поговорить<input id="mTalk"></label><label class="full">Идеи подарков<input id="mGifts"></label></div><div class="top-actions"><button class="primary" data-action="savePerson">Сохранить</button></div>`); }
function savePerson(){ state.people.unshift({id:uid(),name:val('mName')||'Человек',relation:val('mRelation'),birthday:val('mBirthday'),likes:val('mLikes'),talkIdeas:val('mTalk'),gifts:val('mGifts')}); save(); closeModal(); render(); toast('Человек добавлен'); }
function smartPlan(id){ const g=state.goals.find(x=>x.id===id); if(!g) return; openModal('SMART-план', `<div class="card"><h3>${esc(g.title)}</h3><ul class="no-list"><li><b>S:</b> ${esc(g.title)}</li><li><b>M:</b> ${esc(valFmt(g,g.currentValue))} / ${esc(valFmt(g,g.targetValue))}</li><li><b>A:</b> следующий шаг — ${esc(g.nextAction||'не указан')}</li><li><b>R:</b> ${esc(g.why||'важность не описана')}</li><li><b>T:</b> дедлайн — ${esc(g.deadline||'не указан')}</li></ul></div>`); }
function weeklyReview(){ const s=monthSummary(); const text=`Итог недели: Life Score ${lifeScore()}%, расходов ${money(s.expenses)}, доходов ${money(s.income)}, активных целей ${activeGoals().length}.`; state.weeklyReviews.unshift({id:uid(),date:todayKey(),text}); save(); openModal('Обзор недели', `<p>${esc(text)}</p>`); }
function todayLimit(){ const s=monthSummary(); openModal('Почему такой лимит', `<p>Доходы месяца: <b>${money(s.income)}</b></p><p>Расходы месяца: <b>${money(s.expenses)}</b></p><p>Плановые платежи: <b>${money(s.planned)}</b></p><p>Остаток: <b>${money(s.left)}</b></p><p>Безопасный дневной лимит: <b>${money(s.dailyLimit)}</b></p>`); }
function repair(){ runIntegrityRepair(); }
function saveSettings(){ state.rpg.class=val('rpgClass')||state.rpg.class; state.rpg.rank=val('rpgRank')||state.rpg.rank; state.settings.weekNoList=val('weekNoList'); save(); toast('Настройки сохранены'); render(); }
function inspect(){ return {...integrityReport(), page:activePage, location:location.href, pwaStandalone:isStandalone(), online:navigator.onLine}; }
async function resetCaches(){ try{ if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); } }catch(e){ console.warn(e); } try{ if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); } }catch(e){ console.warn(e); } location.href=`${location.origin}${location.pathname}?v=${RELEASE}`; }


let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt = e; setTimeout(renderInstallHint, 300); });
window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; localStorage.setItem('secondBrainOS.pwaInstalled','1'); const h=document.getElementById('installHint'); if(h) h.remove(); toast('Приложение установлено'); });
function isStandalone(){ return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function renderInstallHint(){
  if(isStandalone() || localStorage.getItem('secondBrainOS.hideInstallHint')==='1') return;
  if(document.getElementById('installHint')) return;
  const div=document.createElement('div');
  div.id='installHint'; div.className='install-hint pwa-only-hide';
  div.innerHTML='<div><b>Установить Second Brain OS</b><br><span>Будет открываться как приложение на ПК/телефоне</span></div><button class="primary" data-action="installApp">Установить</button><button class="ghost" data-action="hideInstallHint">×</button>';
  document.body.appendChild(div);
}
async function installApp(){
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(()=>null);
    deferredInstallPrompt=null;
    const h=document.getElementById('installHint'); if(h) h.remove();
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const text = ios
    ? 'На iPhone: нажми «Поделиться» → «На экран Домой». Так Second Brain OS появится как приложение.'
    : 'Если кнопка установки не появилась: открой меню браузера → «Установить приложение» или «Добавить на главный экран».';
  openModal('Установка приложения', `<div class="card"><p>${esc(text)}</p><p><span class="pwa-status">PWA-режим готов</span></p></div>`);
}
function hideInstallHint(){ localStorage.setItem('secondBrainOS.hideInstallHint','1'); const h=document.getElementById('installHint'); if(h) h.remove(); }

function handleAction(a, el){
  const id=el?.dataset?.id;
  if(a==='installApp') return installApp(); if(a==='hideInstallHint') return hideInstallHint(); if(a==='theme'){ document.documentElement.dataset.theme = document.documentElement.dataset.theme==='dark'?'':'dark'; localStorage.setItem('secondBrainTheme', document.documentElement.dataset.theme||'warm'); return; }
  if(a==='quickMenu') return quickMenu(); if(a==='mobileMore') return mobileMore(); if(a==='closeModal') return closeModal(); if(a==='backup') return exportBackup(); if(a==='createSnapshot') return createManualSnapshot(); if(a==='downloadSnapshot') return downloadSnapshot(id); if(a==='restoreSnapshot') return restoreSnapshot(id); if(a==='clearSnapshots') return clearSnapshots(); if(a==='pickBackupFile') return pickBackupFile(); if(a==='resetCaches') return resetCaches(); if(a==='repair') return repair(); if(a==='weeklyReview') return weeklyReview(); if(a==='todayLimit') return todayLimit(); if(a==='saveSettings') return saveSettings();
  if(a==='addTask') return addTask(); if(a==='addGoalTask') return addTask(id); if(a==='saveTask') return saveTask(); if(a==='editTask') return editTask(id); if(a==='saveTaskEdit') return saveTaskEdit(id); if(a==='deleteTask'){ state.tasks=state.tasks.filter(t=>t.id!==id); save(); closeModal(); render(); return toast('Удалено'); }
  if(a==='addExpense') return addOperation('expense'); if(a==='addIncome') return addOperation('income'); if(a==='saveOperation') return saveOperation(el.dataset.type); if(a==='addPayment') return addPayment(); if(a==='savePayment') return savePayment();
  if(a==='addGoal') return addGoal(); if(a==='saveGoal') return saveGoal(); if(a==='progressGoal') return progressGoal(id); if(a==='saveProgress') return saveProgress(id); if(a==='smartPlan') return smartPlan(id); if(a==='completeGoal'){ const g=state.goals.find(x=>x.id===id); if(g){g.status=g.status==='Готово'?'Активна':'Готово'; save(); render(); toast('Статус цели изменён');} return; }
  if(a==='addNote') return addNote(); if(a==='addGoalNote') return addNote(id); if(a==='saveNote') return saveNote(); if(a==='addHabit') return addHabit(); if(a==='saveHabit') return saveHabit(); if(a==='addPerson') return addPerson(); if(a==='savePerson') return savePerson();
  if(a==='pickGoal') return setCurrentGoal(id); if(a==='goalTab') return setGoalTab(el.dataset.tab); if(a==='toggleTask'){ const t=state.tasks.find(x=>x.id===id); if(t){t.status=t.status==='Готово'?'В работе':'Готово'; save(); render();} return; }
  toast('Действие не найдено: '+a);
}
function bind(){
  document.body.onclick=e=>{ const el=e.target.closest('[data-page],[data-action]'); if(!el) return; const p=el.dataset.page; const a=el.dataset.action; if(p) return go(p); if(a) return handleAction(a,el); };
  const search=$('#search'); if(search){ search.oninput=e=>{ searchQuery=e.target.value; if(searchQuery.trim() && activePage!=='control'){ activePage='control'; render(); } }; }
  const restoreFile=$('#restoreFile'); if(restoreFile) restoreFile.onchange=importBackupFile;
  $$('[data-habit]').forEach(input=>input.onchange=()=>{ state.habitLogs[todayKey()] ||= {}; state.habitLogs[todayKey()][input.dataset.habit]=input.checked; save(); render(); });
}
function render(){
  try{
    const navScroll=document.querySelector('.nav')?.scrollTop || 0;
    document.documentElement.dataset.theme = localStorage.getItem('secondBrainTheme')==='dark'?'dark':'';
    $('#app').innerHTML=shell();
    $('#releaseBadge').textContent='V40.1 QA POLISH';
    const nav=document.querySelector('.nav'); if(nav) nav.scrollTop=navScroll;
    bind();
  }catch(e){
    console.error('Render failed', e);
    const app=$('#app');
    if(app) app.innerHTML=`<main class="main"><section class="card"><h1>Ошибка интерфейса</h1><p class="sub">Data Core сохранил данные. Скачай бэкап или перезагрузи приложение.</p><pre>${esc(e.stack||e.message||e)}</pre><button class="primary" data-action="backup">Скачать бэкап</button><button class="ghost" onclick="location.reload()">Перезагрузить</button></section></main>`;
    bind();
  }
}

async function installSW(){
  if(!navigator.serviceWorker || location.protocol==='file:') return;
  try{ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(async r=>{ const u=r.active?.scriptURL||''; if(!u.includes(RELEASE)) await r.unregister(); })); await navigator.serviceWorker.register(`./sw.js?v=${RELEASE}`); }catch(e){ console.warn(e); }
}


/* ===============================
   V40.1 QA POLISH — final app pass
   Активируем пустые кнопки, календарь, CRUD и единый дизайн-статус.
================================ */
try {
  if (Array.isArray(navGroups)) {
    const dayGroup = navGroups.find(g => g[0] === 'День');
    const weekItem = dayGroup?.[1]?.find(x => x[0] === 'week');
    if (weekItem) weekItem[2] = 'Календарь';
  }
  if (pageTitles) pageTitles.week = 'Календарь';
} catch(_e) {}

function calendarMonthKey(){ return localStorage.getItem('secondBrainOS.calendarMonth') || state.settings.currentMonth || monthKey(); }
function setCalendarMonth(delta){
  const [y,m] = calendarMonthKey().split('-').map(Number);
  const d = new Date(y, (m || 1) - 1 + Number(delta || 0), 1);
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  localStorage.setItem('secondBrainOS.calendarMonth', key);
  state.settings.currentMonth = key;
  save();
  render();
}
function dateFromMonthDay(month, day){ return `${month}-${String(day).padStart(2,'0')}`; }
function sameMonthBirthday(date, birthday){ return birthday && String(birthday).slice(5) === String(date).slice(5); }
function dayEvents(date){
  const d = new Date(date + 'T00:00:00');
  const day = d.getDate();
  return {
    tasks: (state.tasks || []).filter(t => t.due === date),
    payments: (state.plannedExpenses || []).filter(p => p.active !== false && (p.month || calendarMonthKey()) === date.slice(0,7) && Number(p.day) === day),
    birthdays: (state.people || []).filter(p => sameMonthBirthday(date, p.birthday)),
    operations: (state.operations || []).filter(o => o.date === date)
  };
}
function dayBadges(date){
  const ev = dayEvents(date), out = [];
  if(ev.tasks.length) out.push(`<span class="cal-dot task">${ev.tasks.length}</span>`);
  if(ev.payments.length) out.push(`<span class="cal-dot pay">₽</span>`);
  if(ev.birthdays.length) out.push(`<span class="cal-dot bday">🎁</span>`);
  if(ev.operations.length) out.push(`<span class="cal-dot money">${ev.operations.length}</span>`);
  return out.join('');
}
function calendarGrid(){
  const mk = calendarMonthKey();
  const [y,m] = mk.split('-').map(Number);
  const first = new Date(y, m-1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const start = (first.getDay() + 6) % 7;
  const cells = [];
  const prevDays = new Date(y, m-1, 0).getDate();
  for(let i=0;i<start;i++) cells.push({muted:true, day:prevDays-start+i+1, date:''});
  for(let day=1; day<=daysInMonth; day++) cells.push({muted:false, day, date:dateFromMonthDay(mk, day)});
  while(cells.length % 7) cells.push({muted:true, day:cells.length, date:''});
  return `<div class="calendar-grid"><div class="calendar-weekdays">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<b>${x}</b>`).join('')}</div><div class="calendar-cells">${cells.map(c=>c.muted?`<div class="calendar-cell muted"><strong>${c.day}</strong></div>`:`<button class="calendar-cell ${c.date===todayKey()?'today':''}" data-action="openDay" data-date="${c.date}"><strong>${c.day}</strong><div class="calendar-badges">${dayBadges(c.date)}</div></button>`).join('')}</div></div>`;
}
function openDay(date){
  if(!date) return;
  const ev = dayEvents(date);
  openModal(new Date(date+'T00:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long'}), `<div class="day-sheet-grid"><section class="card soft-card"><div class="section-head"><h3>Задачи</h3><button class="ghost small" data-action="addTaskDay" data-date="${date}">＋</button></div>${ev.tasks.length?ev.tasks.map(t=>`<div class="line-row"><button class="round-check" data-action="toggleTask" data-id="${t.id}">${t.status==='Готово'?'✓':'○'}</button><b>${esc(t.title)}</b><button class="ghost small" data-action="editTask" data-id="${t.id}">Открыть</button></div>`).join(''):'<div class="empty">Задач нет</div>'}</section><section class="card soft-card"><h3>Деньги</h3>${ev.payments.map(p=>`<div class="line-row"><span class="tag warn">платёж</span><b>${esc(p.title)}</b><strong>${money(p.amount)}</strong></div>`).join('') || ''}${ev.operations.map(o=>`<div class="line-row"><span class="tag ${o.type==='income'?'green':'warn'}">${o.type==='income'?'доход':'расход'}</span><b>${esc(o.category||'Операция')}</b><strong>${money(o.amount)}</strong></div>`).join('') || '<div class="empty">Операций нет</div>'}</section><section class="card soft-card"><h3>Люди</h3>${ev.birthdays.length?ev.birthdays.map(p=>`<div class="line-row"><span>🎁</span><b>${esc(p.name)}</b><button class="ghost small" data-action="editPerson" data-id="${p.id}">Открыть</button></div>`).join(''):'<div class="empty">Дней рождения нет</div>'}</section></div>`);
}
function addTaskDay(date){ addTask('', date || todayKey()); }
function week(){
  const mk=calendarMonthKey();
  const f=financeModel();
  const dueTasks=(state.tasks||[]).filter(t=>String(t.due||'').startsWith(mk)).sort(taskSort);
  const pay=(state.plannedExpenses||[]).filter(p=>p.active!==false && (p.month||mk)===mk).sort((a,b)=>num(a.day)-num(b.day));
  const bdays=(state.people||[]).filter(p=>p.birthday && String(p.birthday).slice(5,7)===mk.slice(5)).sort((a,b)=>String(a.birthday).slice(5).localeCompare(String(b.birthday).slice(5)));
  return `<div class="goals-head premium-page-head"><div><div class="page-label">Календарь</div><h1>${monthLabel(mk)}</h1><p class="sub">Задачи, платежи, операции и дни рождения в одной сетке. Нажми на день — откроется bottom sheet дня.</p></div><div class="top-actions"><button class="ghost" data-action="calendarPrev">← Месяц</button><button class="ghost" data-action="calendarToday">Сегодня</button><button class="ghost" data-action="calendarNext">Месяц →</button><button class="primary" data-action="addTaskDay" data-date="${todayKey()}">＋ Задача</button></div></div><div class="calendar-layout"><section class="card calendar-card">${calendarGrid()}</section><aside class="calendar-rail"><section class="card panel"><div class="section-head"><h3>Сводка месяца</h3><span class="tag green">${mk}</span></div><div class="finance-hero-grid compact"><div><span>Задачи</span><b>${dueTasks.length}</b></div><div><span>Платежи</span><b>${money(total(pay))}</b></div><div><span>ДР</span><b>${bdays.length}</b></div><div><span>Баланс</span><b>${money(f.balance)}</b></div></div></section><section class="card panel"><h3>Ближайшие задачи</h3>${dueTasks.slice(0,6).map(t=>`<div class="line-row"><b>${esc(t.title)}</b><small>${esc(t.due||'')}</small><button class="ghost small" data-action="editTask" data-id="${t.id}">Открыть</button></div>`).join('') || '<div class="empty">Нет задач в месяце</div>'}</section><section class="card panel"><h3>Платежи и даты</h3>${pay.slice(0,6).map(p=>`<div class="pay-row"><span>${esc(p.title)}</span><b>${money(p.amount)}</b><small>${String(p.day).padStart(2,'0')}</small></div>`).join('') || '<div class="empty">Нет платежей</div>'}</section></aside></div>`;
}

function analyticsTab(){ return localStorage.getItem('secondBrainOS.analyticsTab') || 'overview'; }
function setAnalyticsTab(tab){ localStorage.setItem('secondBrainOS.analyticsTab', tab || 'overview'); render(); }
function analyticsBody(){
  const tab=analyticsTab(), s=monthSummary(), expSeries=weekSeries('expense'), incSeries=weekSeries('income'), cats=categoryTotals().slice(0,5), life=lifeScore();
  if(tab==='finance') return `<div class="metrics premium-metrics"><article class="metric"><b>${money(s.income)}</b><span>Доходы месяца</span></article><article class="metric"><b>${money(s.expenses)}</b><span>Расходы месяца</span></article><article class="metric"><b>${money(s.left)}</b><span>Остаток</span></article><article class="metric"><b>${money(s.dailyLimit)}</b><span>Лимит дня</span></article></div><div class="charts premium-charts"><article class="chart-box"><h4>Расходы по дням</h4>${barChart(expSeries)}</article><article class="chart-box"><h4>Категории</h4>${cats.length?donut(cats):'<div class="empty">Нет данных</div>'}</article></div>`;
  if(tab==='tasks') { const done=(state.tasks||[]).filter(t=>t.status==='Готово').length; return `<div class="metrics premium-metrics"><article class="metric"><b>${state.tasks.length}</b><span>Всего задач</span></article><article class="metric"><b>${done}</b><span>Готово</span></article><article class="metric"><b>${todayTasks().length}</b><span>Сегодня</span></article><article class="metric"><b>${attentionItems().length}</b><span>Внимание</span></article></div><section class="card panel">${(state.tasks||[]).slice(0,6).map(t=>`<div class="line-row"><b>${esc(t.title)}</b><span class="tag ${t.status==='Готово'?'green':'blue'}">${esc(t.status||'В работе')}</span><button class="ghost small" data-action="editTask" data-id="${t.id}">Открыть</button></div>`).join('')}</section>`; }
  if(tab==='habits') return `<div class="metrics premium-metrics"><article class="metric"><b>${Object.keys(state.habitLogs?.[todayKey()]||{}).length}/${todayHabits().length}</b><span>Сегодня</span></article><article class="metric"><b>${life}%</b><span>Порядок дня</span></article><article class="metric"><b>${todayHabits().filter(h=>h.active!==false).length}</b><span>Активные</span></article><article class="metric"><b>${state.states?.[0]?.energy||'—'}</b><span>Энергия</span></article></div><section class="card panel">${heatmap()}</section>`;
  if(tab==='goals') return `<div class="metrics premium-metrics">${activeGoals().slice(0,4).map(g=>`<article class="metric"><b>${goalProgress(g)}%</b><span>${esc(g.title)}</span><div class="progress"><span style="width:${goalProgress(g)}%"></span></div></article>`).join('')}</div>`;
  return `<div class="metrics premium-metrics"><article class="metric"><b>${money(s.expenses)}</b><span>Расходы</span>${spark(expSeries.map(x=>x.value),'var(--blue)')}</article><article class="metric"><b>${money(s.income)}</b><span>Доходы</span>${spark(incSeries.map(x=>x.value),'var(--green)')}</article><article class="metric"><b>${money(Math.max(0,s.left))}</b><span>Сбережения</span>${spark(incSeries.map((x,i)=>Math.max(0,x.value-(expSeries[i]?.value||0))),'var(--green)')}</article><article class="metric"><b>${life}%</b><span>Порядок дня</span><div class="progress"><span style="width:${life}%"></span></div></article></div><div class="charts premium-charts"><article class="chart-box"><h4>Динамика расходов</h4>${barChart(expSeries)}</article><article class="chart-box"><h4>Расходы по категориям</h4>${cats.length?donut(cats):'<div class="empty">Нет данных</div>'}</article><article class="chart-box"><h4>Динамика привычек</h4>${heatmap()}</article></div>`;
}
function weeklyAnalyticsCard(){ const tabs=[['overview','Обзор'],['finance','Финансы'],['tasks','Задачи'],['habits','Привычки'],['goals','Цели']]; return `<section class="card analytics-card"><div class="section-head"><div><h3>Аналитика недели <small>${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</small></h3><div class="tab-row">${tabs.map(t=>`<button class="tab ${analyticsTab()===t[0]?'active':''}" data-action="analyticsTab" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div></div><button class="ghost small" data-page="week">Календарь</button></div>${analyticsBody()}</section>`; }

const __v401_oldDashboard = dashboard;
dashboard = function(){
  let html = __v401_oldDashboard();
  html = html.replace(/<section class="card analytics-card">[\s\S]*?<\/section><\/div><aside class="rail right-rail">/, weeklyAnalyticsCard() + '</div><aside class="rail right-rail">');
  html = html.replace('<button class="ghost">Открыть заметку</button>', '<button class="ghost" data-action="editNote" data-id="'+(linkedNotes(currentGoal())[0]?.id||'')+'">Открыть заметку</button>');
  return html;
};

function shell(){
  const nav=navGroups.map(([title,items])=>`<div class="nav-group"><div class="nav-title">${title}</div>${items.map(([id,ic,label])=>`<button data-page="${id}" class="nav-btn ${activePage===id?'active':''}"><span class="nav-ic">${ic}</span><b>${label}</b></button>`).join('')}</div>`).join('');
  return `<div class="app shell-premium"><aside class="sidebar"><div class="brand"><div class="brand-mark">◔</div><div><b>Second Brain OS</b><span>Private Life RPG</span></div></div><nav class="nav">${nav}</nav><button class="quick-input" data-action="quickMenu"><span>⚡</span><b>Быстрый ввод</b><small>⌘ K</small></button><div class="sidebar-status v401-status"><small>PRIVATE APP</small><b>V40.1</b><span class="sync-dot">QA POLISH OK</span><small>${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small></div></aside><main class="main"><header class="topbar premium-topbar"><div class="topbar-spacer"></div><div class="topbar-tools"><div class="search-box"><span>⌕</span><input id="search" class="search" placeholder="Поиск" value="${esc(searchQuery)}"></div><button class="ghost pwa-only-hide" data-action="installApp">Установить</button><button class="icon-btn" data-page="week" title="Календарь">◫</button><button class="icon-btn bell-btn" data-page="control" title="Уведомления"><span>◌</span><i>${attentionItems().length}</i></button><button class="avatar-btn" data-page="settings" title="Профиль">А</button></div></header><section class="mobile-page-title"><b>${mobileHeaderTitle()}</b><span>${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</span></section><section class="view premium-view">${route()}</section></main>${mobileNav()}</div>`;
}

function editOperation(id){ const o=(state.operations||[]).find(x=>x.id===id); if(!o) return toast('Операция не найдена'); openModal('Изменить операцию', `<div class="form-grid"><label>Дата<input id="mDate" type="date" value="${esc(o.date||todayKey())}"></label><label>Сумма<input id="mAmount" type="number" value="${num(o.amount)}"></label><label>Тип<select id="mType"><option value="expense" ${o.type==='expense'?'selected':''}>Расход</option><option value="income" ${o.type==='income'?'selected':''}>Доход</option></select></label><label>Категория<input id="mCategory" value="${esc(o.category||'')}"></label><label class="full">Комментарий<input id="mNote" value="${esc(o.note||'')}"></label></div><div class="top-actions"><button class="primary" data-action="saveOperationEdit" data-id="${id}">Сохранить</button><button class="danger-btn" data-action="deleteOperation" data-id="${id}">Удалить</button></div>`); }
function saveOperationEdit(id){ const o=(state.operations||[]).find(x=>x.id===id); if(!o) return; Object.assign(o,{date:val('mDate')||todayKey(), type:val('mType')||'expense', amount:num(val('mAmount')), category:val('mCategory')||'Другое', note:val('mNote')}); save(); closeModal(); render(); toast('Операция обновлена'); }
function deleteOperation(id){ state.operations=(state.operations||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Операция удалена'); }

function addDebt(direction='owe'){ openModal(direction==='owed_to_me'?'Мне должны':'Я должен', `<div class="form-grid"><label>Тип<select id="mDirection"><option value="owe" ${direction==='owe'?'selected':''}>Я должен</option><option value="owed_to_me" ${direction==='owed_to_me'?'selected':''}>Мне должны</option></select></label><label>Кто / кому<input id="mPerson"></label><label>Сумма<input id="mAmount" type="number"></label><label>Дата возврата<input id="mDue" type="date" value="${todayKey()}"></label><label>Статус<select id="mStatus"><option>Активен</option><option>Ожидаю</option><option>Закрыт</option></select></label><label class="full">Комментарий<input id="mNote"></label></div><div class="top-actions"><button class="primary" data-action="saveDebt">Сохранить долг</button></div>`); }
function saveDebt(){ state.debts.unshift({id:uid(), direction:val('mDirection')||'owe', person:val('mPerson')||'Без имени', amount:num(val('mAmount')), due:val('mDue'), status:val('mStatus')||'Активен', note:val('mNote')}); save(); closeModal(); render(); toast('Долг добавлен'); }
function editDebt(id){ const d=(state.debts||[]).find(x=>x.id===id); if(!d) return; openModal('Изменить долг', `<div class="form-grid"><label>Тип<select id="mDirection"><option value="owe" ${d.direction==='owe'?'selected':''}>Я должен</option><option value="owed_to_me" ${d.direction==='owed_to_me'?'selected':''}>Мне должны</option></select></label><label>Кто / кому<input id="mPerson" value="${esc(d.person||'')}"></label><label>Сумма<input id="mAmount" type="number" value="${num(d.amount)}"></label><label>Дата возврата<input id="mDue" type="date" value="${esc(d.due||'')}"></label><label>Статус<select id="mStatus"><option ${d.status==='Активен'?'selected':''}>Активен</option><option ${d.status==='Ожидаю'?'selected':''}>Ожидаю</option><option ${d.status==='Закрыт'?'selected':''}>Закрыт</option></select></label><label class="full">Комментарий<input id="mNote" value="${esc(d.note||'')}"></label></div><div class="top-actions"><button class="primary" data-action="saveDebtEdit" data-id="${id}">Сохранить</button><button class="ghost" data-action="closeDebt" data-id="${id}">Закрыть</button><button class="danger-btn" data-action="deleteDebt" data-id="${id}">Удалить</button></div>`); }
function saveDebtEdit(id){ const d=(state.debts||[]).find(x=>x.id===id); if(!d) return; Object.assign(d,{direction:val('mDirection'), person:val('mPerson'), amount:num(val('mAmount')), due:val('mDue'), status:val('mStatus'), note:val('mNote')}); save(); closeModal(); render(); toast('Долг обновлён'); }
function closeDebt(id){ const d=(state.debts||[]).find(x=>x.id===id); if(d){ d.status='Закрыт'; save(); closeModal(); render(); toast('Долг закрыт'); } }
function deleteDebt(id){ state.debts=(state.debts||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Долг удалён'); }

function debtMiniRow(d){ const isOwe=d.direction==='owe'; return `<article class="debt-mini-row ${isOwe?'owe':'owed'}"><div><b>${esc(d.person)}</b><p>${esc(d.note||d.status||'')}</p></div><strong class="${isOwe?'red-text':'green-text'}">${isOwe?'-':'+'}${money(d.amount)}</strong><small>${esc(d.due||'без даты')}</small><button class="ghost small" data-action="editDebt" data-id="${d.id}">Открыть</button></article>`; }
function debts(){ const f=financeModel(); const owe=f.debts.filter(d=>d.direction==='owe'); const owed=f.debts.filter(d=>d.direction==='owed_to_me'); return `<div class="goals-head premium-page-head"><div><div class="page-label">Долговая карта</div><h1>Долги</h1><p class="sub">Теперь это полноценный модуль: добавить, изменить, закрыть или удалить долг.</p></div><div class="top-actions"><button class="primary" data-action="addDebtOwe">＋ Я должен</button><button class="ghost" data-action="addDebtOwed">＋ Мне должны</button></div></div><div class="metrics finance-metrics"><article class="metric"><b class="red-text">${money(f.owe)}</b><span>Кому я должен</span></article><article class="metric"><b class="green-text">${money(f.owed)}</b><span>Кто должен мне</span></article><article class="metric"><b>${money(f.net)}</b><span>Чистая позиция</span></article><article class="metric"><b>${f.debts.length}</b><span>Активных записей</span></article></div><div class="finance-debt-grid"><section class="card panel debt-card"><div class="section-head"><h3>Кому я должен</h3><span class="tag warn">${owe.length}</span></div>${owe.length?owe.map(debtMiniRow).join(''):'<div class="empty">Активных долгов нет</div>'}</section><section class="card panel debt-card"><div class="section-head"><h3>Кто должен мне</h3><span class="tag green">${owed.length}</span></div>${owed.length?owed.map(debtMiniRow).join(''):'<div class="empty">Тебе пока никто не должен</div>'}</section></div>`; }

function finance(){ const f=financeModel(); const ops=(state.operations||[]).filter(o=>String(o.date||'').startsWith(state.settings.currentMonth)).slice(0,8); const cats=categoryTotals().slice(0,5); return `<div class="goals-head premium-page-head"><div><div class="page-label">Финансы</div><h1>Финансовый центр</h1><p class="sub">Баланс, долги, платежи, поток и операции — всё в одном месте.</p></div><div class="top-actions"><button class="primary" data-action="addExpense">＋ Расход</button><button class="ghost" data-action="addIncome">＋ Доход</button><button class="ghost" data-action="addDebtOwe">＋ Долг</button></div></div><div class="finance-dashboard-grid">${financeHero(f)}<section class="card panel"><div class="section-head"><h3>Денежный поток</h3><span class="tag green">${monthLabel()}</span></div><div class="money-list"><p><span>Доходы</span><b class="green-text">${money(f.income)}</b></p><p><span>Расходы</span><b class="red-text">${money(f.expenses)}</b></p><p><span>Плановые платежи</span><b>${money(f.planned)}</b></p><p><span>Остаток</span><b>${money(f.left)}</b></p></div>${spark(weekSeries('expense').map(x=>x.value),'var(--blue)')}</section><section class="card panel"><div class="section-head"><h3>Долги</h3><button class="ghost small" data-page="debts">Открыть</button></div>${f.debts.slice(0,4).map(debtMiniRow).join('') || '<div class="empty">Долгов нет</div>'}</section><section class="card panel"><div class="section-head"><h3>Категории</h3></div>${cats.length?donut(cats):'<div class="empty">Нет расходов</div>'}</section></div><section class="card panel"><div class="section-head"><h3>Последние операции</h3><button class="ghost small" data-page="import">Импорт</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Дата</th><th>Тип</th><th>Категория</th><th>Сумма</th><th></th></tr></thead><tbody>${ops.map(o=>`<tr><td>${esc(o.date||'')}</td><td><span class="tag ${o.type==='income'?'green':'warn'}">${o.type==='income'?'Доход':'Расход'}</span></td><td><b>${esc(o.category||'Другое')}</b><br><small>${esc(o.note||'')}</small></td><td>${money(o.amount)}</td><td><button class="ghost small" data-action="editOperation" data-id="${o.id}">Изм.</button></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">Операций пока нет</div></td></tr>'}</tbody></table></div></section>`; }

function editPayment(id){ const p=(state.plannedExpenses||[]).find(x=>x.id===id); if(!p) return; openModal('Изменить платёж', `<div class="form-grid"><label>Название<input id="mTitle" value="${esc(p.title||'')}"></label><label>Сумма<input id="mAmount" type="number" value="${num(p.amount)}"></label><label>День месяца<input id="mDay" type="number" min="1" max="31" value="${num(p.day)||1}"></label><label>Месяц<input id="mMonth" type="month" value="${esc(p.month||state.settings.currentMonth)}"></label><label>Статус<select id="mActive"><option value="true" ${p.active!==false?'selected':''}>Активен</option><option value="false" ${p.active===false?'selected':''}>Отключён</option></select></label></div><div class="top-actions"><button class="primary" data-action="savePaymentEdit" data-id="${id}">Сохранить</button><button class="danger-btn" data-action="deletePayment" data-id="${id}">Удалить</button></div>`); }
function savePaymentEdit(id){ const p=(state.plannedExpenses||[]).find(x=>x.id===id); if(!p) return; Object.assign(p,{title:val('mTitle')||'Платёж',amount:num(val('mAmount')),day:num(val('mDay'))||1,month:val('mMonth')||state.settings.currentMonth,active:val('mActive')!=='false'}); save(); closeModal(); render(); toast('Платёж обновлён'); }
function deletePayment(id){ state.plannedExpenses=(state.plannedExpenses||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Платёж удалён'); }
function payments(){ const rows=(state.plannedExpenses||[]).sort((a,b)=>num(a.day)-num(b.day)); return `<div class="goals-head premium-page-head"><div><div class="page-label">Платежи</div><h1>Платежи</h1><p class="sub">Регулярные и ближайшие платежи теперь можно редактировать и отключать.</p></div><button class="primary" data-action="addPayment">＋ Платёж</button></div><section class="card panel"><div class="section-head"><h3>Ближайшие платежи</h3><span class="tag">${rows.length}</span></div>${rows.length?rows.map(p=>`<div class="pay-row big-pay ${p.active===false?'muted-line':''}"><span>${esc(p.title||'Платёж')}</span><b>${money(p.amount)}</b><small>${String(p.day||'').padStart(2,'0')} число</small><button class="ghost small" data-action="editPayment" data-id="${p.id}">Изм.</button></div>`).join(''):'<div class="empty">Платежей пока нет</div>'}</section>`; }

function pickCsv(){ const input=$('#csvFile'); if(input) input.click(); }
function parseCsvText(text){
  const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const out=[];
  for(const line of lines){
    const sep=line.includes(';')?';':',';
    const parts=line.split(sep).map(x=>x.trim().replace(/^"|"$/g,''));
    if(parts.length<3 || /date|дата/i.test(parts[0])) continue;
    const [dateRaw,typeRaw,amountRaw,categoryRaw,noteRaw] = parts;
    const type=/income|доход|зачис/i.test(typeRaw)?'income':'expense';
    out.push({id:uid(),date:dateRaw||todayKey(),type,amount:num(amountRaw),category:categoryRaw||'Импорт',note:noteRaw||'CSV'});
  }
  return out.filter(x=>x.amount);
}
function importCsvFile(event){ const file=event?.target?.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ const rows=parseCsvText(reader.result); if(!rows.length) return toast('Не нашёл операции в CSV'); state.operations.unshift(...rows); save(); closeModal(); render(); toast(`Импортировано операций: ${rows.length}`); }; reader.readAsText(file); }
function importPage(){ return `<div class="goals-head premium-page-head"><div><div class="page-label">Импорт</div><h1>Импорт банка</h1><p class="sub">Активирован простой CSV-импорт: date,type,amount,category,note. Раздел больше не заглушка.</p></div><div class="top-actions"><button class="primary" data-action="pickCsv">Загрузить CSV</button><button class="ghost" data-action="addExpense">＋ Вручную</button></div></div><section class="card panel"><input id="csvFile" class="hidden-file" type="file" accept=".csv,text/csv,text/plain"><button class="drop-zone active-drop" data-action="pickCsv"><b>Нажми, чтобы выбрать CSV</b><p class="sub">Поддержка простого формата: дата, тип, сумма, категория, комментарий. Перед импортом скачай бэкап в разделе «Данные».</p></button></section><section class="card panel"><h3>Пример строки</h3><pre class="diagnostic-pre">2026-06-26;expense;450;Кофе;завтрак\n2026-06-26;income;30000;Проект;оплата</pre></section>`; }

function editPerson(id){ const p=(state.people||[]).find(x=>x.id===id); if(!p) return; openModal('Изменить человека', `<div class="form-grid"><label>Имя<input id="mName" value="${esc(p.name||'')}"></label><label>Тип связи<input id="mRelation" value="${esc(p.relation||'')}"></label><label>День рождения<input id="mBirthday" type="date" value="${esc(p.birthday||'')}"></label><label class="full">Что любит<input id="mLikes" value="${esc(p.likes||'')}"></label><label class="full">О чём поговорить<input id="mTalk" value="${esc(p.talkIdeas||'')}"></label><label class="full">Идеи подарков<input id="mGifts" value="${esc(p.gifts||'')}"></label><label class="full">Заметка<textarea id="mNotes">${esc(p.notes||'')}</textarea></label></div><div class="top-actions"><button class="primary" data-action="savePersonEdit" data-id="${id}">Сохранить</button><button class="danger-btn" data-action="deletePerson" data-id="${id}">Удалить</button></div>`); }
function savePersonEdit(id){ const p=(state.people||[]).find(x=>x.id===id); if(!p) return; Object.assign(p,{name:val('mName')||'Человек',relation:val('mRelation'),birthday:val('mBirthday'),likes:val('mLikes'),talkIdeas:val('mTalk'),gifts:val('mGifts'),notes:val('mNotes')}); save(); closeModal(); render(); toast('Контакт обновлён'); }
function deletePerson(id){ state.people=(state.people||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Контакт удалён'); }
function people(){ return `<div class="goals-head premium-page-head"><div><div class="page-label">Люди</div><h1>Контакты</h1><p class="sub">Контакты, идеи разговоров, дни рождения и подарки. Карточки теперь редактируются.</p></div><button class="primary" data-action="addPerson">＋ Человек</button></div><div class="kanban people-grid">${(state.people||[]).map(p=>`<article class="card person-card"><div class="section-head"><h3>${esc(p.name)}</h3><span class="tag green">${esc(p.relation||'контакт')}</span></div><p><b>ДР:</b> ${esc(p.birthday||'—')}</p><p><b>Любит:</b> ${esc(p.likes||'—')}</p><p><b>О чём поговорить:</b> ${esc(p.talkIdeas||'—')}</p><p><b>Подарки:</b> ${esc(p.gifts||'—')}</p><div class="top-actions"><button class="ghost small" data-action="editPerson" data-id="${p.id}">Изменить</button></div></article>`).join('')||'<div class="empty">Людей пока нет</div>'}</div>`; }
function birthdays(){ const rows=(state.people||[]).filter(p=>p.birthday).sort((a,b)=>String(a.birthday).slice(5).localeCompare(String(b.birthday).slice(5))); return `<div class="goals-head premium-page-head"><div><div class="page-label">Дни рождения</div><h1>Дни рождения</h1><p class="sub">Важные даты людей + быстрый переход к карточке.</p></div><button class="primary" data-action="addPerson">＋ Человек</button></div><section class="card panel">${rows.length?rows.map(p=>`<div class="person-row"><b>${esc(p.name)}</b><span>${esc(p.birthday)}</span><small>${esc(p.relation||'')}</small><button class="ghost small" data-action="editPerson" data-id="${p.id}">Открыть</button></div>`).join(''):'<div class="empty">Дней рождения пока нет</div>'}</section>`; }
function gifts(){ const rows=(state.people||[]).filter(p=>p.gifts || p.likes); return `<div class="goals-head premium-page-head"><div><div class="page-label">Подарки</div><h1>Подарки</h1><p class="sub">Идеи подарков и предпочтения людей.</p></div><button class="primary" data-action="addPerson">＋ Человек</button></div><div class="people-grid">${rows.length?rows.map(p=>`<article class="card"><div class="section-head"><h3>${esc(p.name)}</h3><span class="tag green">${esc(p.relation||'контакт')}</span></div><p><b>Любит:</b> ${esc(p.likes||'—')}</p><p><b>Идеи:</b> ${esc(p.gifts||'—')}</p><button class="ghost small" data-action="editPerson" data-id="${p.id}">Изменить</button></article>`).join(''):'<div class="empty">Идей подарков пока нет</div>'}</div>`; }

function editNote(id){ const all=[...(state.notes||[]), ...(state.goalNotes||[])]; const n=all.find(x=>x.id===id); if(!n) return toast('Заметка не найдена'); openModal('Изменить заметку', `<div class="form-grid"><label class="full">Название<input id="mTitle" value="${esc(n.title||'')}"></label><label>Цель<select id="mGoal">${goalOptions(n.goalId)}</select></label><label>Человек<select id="mPerson">${personOptions(n.personId)}</select></label><label class="full">Теги<input id="mTags" value="${esc((n.tags||[]).join(', '))}"></label><label class="full">Текст<textarea id="mText">${esc(n.text||'')}</textarea></label></div><div class="top-actions"><button class="primary" data-action="saveNoteEdit" data-id="${id}">Сохранить</button><button class="danger-btn" data-action="deleteNote" data-id="${id}">Удалить</button></div>`); }
function saveNoteEdit(id){ let n=(state.notes||[]).find(x=>x.id===id) || (state.goalNotes||[]).find(x=>x.id===id); if(!n) return; Object.assign(n,{title:val('mTitle')||'Заметка',text:val('mText'),goalId:val('mGoal'),personId:val('mPerson'),tags:val('mTags').split(/[,#;]/).map(x=>x.trim()).filter(Boolean)}); save(); closeModal(); render(); toast('Заметка обновлена'); }
function deleteNote(id){ state.notes=(state.notes||[]).filter(x=>x.id!==id); state.goalNotes=(state.goalNotes||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Заметка удалена'); }
function noteRow(n){ return `<article class="note-row"><div class="section-head mini-head"><div><b>${esc(n.title||'Заметка')}</b><small class="sub">${esc(n.date||n.createdAt||'')}</small></div><button class="ghost small" data-action="editNote" data-id="${n.id}">Открыть</button></div><p>${esc(n.text||'')}</p><div class="note-tags">${(n.tags||[]).map(t=>`<span>#${esc(t)}</span>`).join('')}</div></article>`; }

function editHabit(id){ const h=(state.habits||[]).find(x=>x.id===id); if(!h) return; openModal('Изменить привычку', `<div class="form-grid"><label>Название<input id="mName" value="${esc(h.name||'')}"></label><label>Сфера<input id="mArea" value="${esc(h.area||'')}"></label><label>Цель в неделю<input id="mTarget" type="number" value="${num(h.targetPerWeek)||5}"></label><label>Статус<select id="mActive"><option value="true" ${h.active!==false?'selected':''}>Активна</option><option value="false" ${h.active===false?'selected':''}>Отключена</option></select></label></div><div class="top-actions"><button class="primary" data-action="saveHabitEdit" data-id="${id}">Сохранить</button><button class="danger-btn" data-action="deleteHabit" data-id="${id}">Удалить</button></div>`); }
function saveHabitEdit(id){ const h=(state.habits||[]).find(x=>x.id===id); if(!h) return; Object.assign(h,{name:val('mName')||'Привычка',area:val('mArea')||'Личное',targetPerWeek:num(val('mTarget'))||5,active:val('mActive')!=='false'}); save(); closeModal(); render(); toast('Привычка обновлена'); }
function deleteHabit(id){ state.habits=(state.habits||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Привычка удалена'); }
function habitLine(h){ const done=!!state.habitLogs?.[todayKey()]?.[h.id]; return `<label class="habit-line ${h.active===false?'muted-line':''}"><div class="habit-main"><b>${esc(h.name)}</b><p>${esc(h.area||'Личное')}</p></div><em>${done?'сегодня':(h.targetPerWeek||0)+' дней'}</em><input type="checkbox" data-habit="${h.id}" ${done?'checked':''}></label>`; }
function habits(){ const habits=(state.habits||[]); return `<div class="goals-head premium-page-head"><div><div class="page-label">Привычки</div><h1>Состояние</h1><p class="sub">Привычки — навыки персонажа. Теперь каждую можно открыть и изменить.</p></div><button class="primary" data-action="addHabit">＋ Привычка</button></div><div class="metrics"><article class="metric"><b>${Object.keys(state.habitLogs?.[todayKey()]||{}).length}/${todayHabits().length}</b><span>Сегодня</span></article><article class="metric"><b>${lifeScore()}%</b><span>Порядок дня</span></article><article class="metric"><b>${state.states?.[0]?.energy||'—'}</b><span>Энергия</span></article><article class="metric"><b>${habits.length}</b><span>Навыков</span></article></div><section class="card"><div class="section-head"><h3>Навыки дня</h3></div>${habits.map(h=>`<div class="habit-manage-row">${habitLine(h)}<button class="ghost small" data-action="editHabit" data-id="${h.id}">Изм.</button></div>`).join('')}</section><section class="card"><div class="section-head"><h3>Динамика привычек</h3></div>${heatmap()}</section>`; }

function editGoalFull(id){ const g=(state.goals||[]).find(x=>x.id===id); if(!g) return; openModal('Изменить цель', `<div class="form-grid"><label class="full">Название<input id="mTitle" value="${esc(g.title||'')}"></label><label>Сфера<input id="mArea" value="${esc(g.area||'')}"></label><label>Метрика<input id="mMetric" value="${esc(g.metric||'')}"></label><label>Цель<input id="mTarget" type="number" value="${num(g.targetValue)}"></label><label>Текущее<input id="mCurrent" type="number" value="${num(g.currentValue)}"></label><label>Дедлайн<input id="mDeadline" type="date" value="${esc(g.deadline||'')}"></label><label>Статус<select id="mStatus"><option ${g.status==='Активна'?'selected':''}>Активна</option><option ${g.status==='Готово'?'selected':''}>Готово</option><option ${g.status==='Архив'?'selected':''}>Архив</option></select></label><label class="full">Почему важно<textarea id="mWhy">${esc(g.why||'')}</textarea></label><label class="full">Следующий шаг<textarea id="mNext">${esc(g.nextAction||'')}</textarea></label></div><div class="top-actions"><button class="primary" data-action="saveGoalEdit" data-id="${id}">Сохранить</button><button class="danger-btn" data-action="deleteGoal" data-id="${id}">Удалить</button></div>`); }
function saveGoalEdit(id){ const g=(state.goals||[]).find(x=>x.id===id); if(!g) return; Object.assign(g,{title:val('mTitle')||'Цель',area:val('mArea'),metric:val('mMetric'),targetValue:num(val('mTarget')),currentValue:num(val('mCurrent')),deadline:val('mDeadline'),why:val('mWhy'),nextAction:val('mNext'),status:val('mStatus')}); save(); closeModal(); render(); toast('Цель обновлена'); }
function deleteGoal(id){ state.goals=(state.goals||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Цель удалена'); }
const __v401_oldGoals = goals;
goals = function(){ let html=__v401_oldGoals(); const g=currentGoal(); if(g) html=html.replace(`<button class="ghost" data-action="completeGoal" data-id="${g.id}">`, `<button class="ghost" data-action="editGoalFull" data-id="${g.id}">Изменить цель</button><button class="ghost" data-action="completeGoal" data-id="${g.id}">`); return html; }

function addBook(){ openModal('Новая книга', `<div class="form-grid"><label class="full">Название<input id="mTitle"></label><label>Автор<input id="mAuthor"></label><label>Статус<select id="mStatus"><option>Хочу прочитать</option><option>Читаю</option><option>Прочитано</option></select></label><label class="full">Главный инсайт<textarea id="mInsight"></textarea></label></div><div class="top-actions"><button class="primary" data-action="saveBook">Сохранить</button></div>`); }
function saveBook(){ state.books.unshift({id:uid(),title:val('mTitle')||'Книга',author:val('mAuthor'),status:val('mStatus'),insight:val('mInsight'),createdAt:todayKey()}); save(); closeModal(); render(); toast('Книга добавлена'); }
function editBook(id){ const b=(state.books||[]).find(x=>x.id===id); if(!b) return; openModal('Изменить книгу', `<div class="form-grid"><label class="full">Название<input id="mTitle" value="${esc(b.title||'')}"></label><label>Автор<input id="mAuthor" value="${esc(b.author||'')}"></label><label>Статус<select id="mStatus"><option ${b.status==='Хочу прочитать'?'selected':''}>Хочу прочитать</option><option ${b.status==='Читаю'?'selected':''}>Читаю</option><option ${b.status==='Прочитано'?'selected':''}>Прочитано</option></select></label><label class="full">Главный инсайт<textarea id="mInsight">${esc(b.insight||'')}</textarea></label></div><div class="top-actions"><button class="primary" data-action="saveBookEdit" data-id="${id}">Сохранить</button><button class="danger-btn" data-action="deleteBook" data-id="${id}">Удалить</button></div>`); }
function saveBookEdit(id){ const b=(state.books||[]).find(x=>x.id===id); if(!b) return; Object.assign(b,{title:val('mTitle')||'Книга',author:val('mAuthor'),status:val('mStatus'),insight:val('mInsight')}); save(); closeModal(); render(); toast('Книга обновлена'); }
function deleteBook(id){ state.books=(state.books||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Книга удалена'); }
function books(){ return `<div class="goals-head premium-page-head"><div><div class="page-label">Книги</div><h1>Книги</h1><p class="sub">Библиотека роста: книги, статус и главный инсайт.</p></div><button class="primary" data-action="addBook">＋ Новая книга</button></div><section class="card panel"><div class="section-head"><h3>Список книг</h3><span class="tag">${state.books.length}</span></div>${state.books.length?state.books.map(b=>`<div class="line-row"><div><b>${esc(b.title)}</b><p class="sub">${esc(b.author||'')} · ${esc(b.status||'')}</p></div><button class="ghost small" data-action="editBook" data-id="${b.id}">Открыть</button></div>`).join(''):'<div class="empty">Книг пока нет</div>'}</section>`; }

function sync(){ const r=integrityReport(); const ok=r.status==='ok'; const mb=(r.bytes/1024).toFixed(1)+' КБ'; return `<div class="goals-head data-head"><div><div class="page-label">Data Core V40.1</div><h1>Данные и резервные копии</h1><p class="sub">Ядро сохранности: бэкап, восстановление, снимки, диагностика и сброс кэша без потери данных.</p></div><div class="top-actions"><button class="primary" data-action="backup">Скачать полный бэкап</button><button class="ghost" data-action="createSnapshot">Создать снимок</button></div></div><div class="metrics data-metrics">${dataMetric('Статус базы', ok?'OK':'Нужна проверка', ok?'структура целая':r.problems.join(', '), ok?'':'warn')} ${dataMetric('Размер данных', mb, 'localStorage')} ${dataMetric('Снимков', r.localSnapshots, 'последние локальные копии')} ${dataMetric('Checksum', r.checksum, 'контрольная сумма')}</div><div class="data-core-grid"><section class="card panel data-card"><div class="section-head"><div><h3>Резервная копия</h3><p class="sub">Перед каждым крупным обновлением скачивай полный JSON. Его можно вернуть обратно кнопкой восстановления.</p></div><span class="tag green">безопасно</span></div><div class="data-action-grid"><button class="primary" data-action="backup">Скачать полный бэкап</button><button class="ghost" data-action="pickBackupFile">Восстановить из файла</button><button class="ghost" data-action="repair">Проверить целостность</button><button class="danger-btn" data-action="resetCaches">Сбросить кэш приложения</button></div><input id="restoreFile" class="hidden-file" type="file" accept="application/json"><p class="sub">Сброс кэша не удаляет данные. Данные живут отдельно в Data Core.</p></section><section class="card panel data-card"><div class="section-head"><div><h3>Диагностика</h3><p class="sub">Версия базы, счётчики сущностей и состояние PWA.</p></div><span class="tag blue">v40.1</span></div><pre class="diagnostic-pre">${esc(JSON.stringify({...r, serviceWorker:!!(navigator.serviceWorker&&navigator.serviceWorker.controller), standalone:isStandalone(), online:navigator.onLine}, null, 2))}</pre></section></div><section class="card panel"><div class="section-head"><div><h3>Локальные снимки</h3><p class="sub">Автоматические и ручные точки восстановления внутри приложения.</p></div><button class="ghost small" data-action="clearSnapshots">Очистить снимки</button></div><div class="snapshot-list">${snapshotRows()}</div></section>`; }

function handleAction(a, el){
  const id=el?.dataset?.id;
  if(a==='installApp') return installApp(); if(a==='hideInstallHint') return hideInstallHint(); if(a==='theme'){ document.documentElement.dataset.theme = document.documentElement.dataset.theme==='dark'?'':'dark'; localStorage.setItem('secondBrainTheme', document.documentElement.dataset.theme||'warm'); return; }
  if(a==='quickMenu') return quickMenu(); if(a==='mobileMore') return mobileMore(); if(a==='closeModal') return closeModal(); if(a==='backup') return exportBackup(); if(a==='createSnapshot') return createManualSnapshot(); if(a==='downloadSnapshot') return downloadSnapshot(id); if(a==='restoreSnapshot') return restoreSnapshot(id); if(a==='clearSnapshots') return clearSnapshots(); if(a==='pickBackupFile') return pickBackupFile(); if(a==='resetCaches') return resetCaches(); if(a==='repair') return repair(); if(a==='weeklyReview') return weeklyReview(); if(a==='todayLimit') return todayLimit(); if(a==='saveSettings') return saveSettings();
  if(a==='calendarPrev') return setCalendarMonth(-1); if(a==='calendarNext') return setCalendarMonth(1); if(a==='calendarToday'){ localStorage.setItem('secondBrainOS.calendarMonth', monthKey()); state.settings.currentMonth=monthKey(); save(); return render(); } if(a==='openDay') return openDay(el.dataset.date); if(a==='addTaskDay') return addTaskDay(el.dataset.date); if(a==='analyticsTab') return setAnalyticsTab(el.dataset.tab);
  if(a==='addTask') return addTask(el?.dataset?.goalId || id || '', el?.dataset?.date || ''); if(a==='addGoalTask') return addTask(id); if(a==='saveTask') return saveTask(); if(a==='editTask') return editTask(id); if(a==='saveTaskEdit') return saveTaskEdit(id); if(a==='deleteTask'){ state.tasks=state.tasks.filter(t=>t.id!==id); save(); closeModal(); render(); return toast('Удалено'); }
  if(a==='addExpense') return addOperation('expense'); if(a==='addIncome') return addOperation('income'); if(a==='saveOperation') return saveOperation(el.dataset.type); if(a==='editOperation') return editOperation(id); if(a==='saveOperationEdit') return saveOperationEdit(id); if(a==='deleteOperation') return deleteOperation(id);
  if(a==='addPayment') return addPayment(); if(a==='savePayment') return savePayment(); if(a==='editPayment') return editPayment(id); if(a==='savePaymentEdit') return savePaymentEdit(id); if(a==='deletePayment') return deletePayment(id);
  if(a==='addDebtOwe') return addDebt('owe'); if(a==='addDebtOwed') return addDebt('owed_to_me'); if(a==='saveDebt') return saveDebt(); if(a==='editDebt') return editDebt(id); if(a==='saveDebtEdit') return saveDebtEdit(id); if(a==='closeDebt') return closeDebt(id); if(a==='deleteDebt') return deleteDebt(id);
  if(a==='addGoal') return addGoal(); if(a==='saveGoal') return saveGoal(); if(a==='progressGoal') return progressGoal(id); if(a==='saveProgress') return saveProgress(id); if(a==='smartPlan') return smartPlan(id); if(a==='editGoalFull') return editGoalFull(id); if(a==='saveGoalEdit') return saveGoalEdit(id); if(a==='deleteGoal') return deleteGoal(id); if(a==='completeGoal'){ const g=state.goals.find(x=>x.id===id); if(g){g.status=g.status==='Готово'?'Активна':'Готово'; save(); render(); toast('Статус цели изменён');} return; }
  if(a==='addNote') return addNote(); if(a==='addGoalNote') return addNote(id); if(a==='saveNote') return saveNote(); if(a==='editNote') return editNote(id); if(a==='saveNoteEdit') return saveNoteEdit(id); if(a==='deleteNote') return deleteNote(id);
  if(a==='addHabit') return addHabit(); if(a==='saveHabit') return saveHabit(); if(a==='editHabit') return editHabit(id); if(a==='saveHabitEdit') return saveHabitEdit(id); if(a==='deleteHabit') return deleteHabit(id);
  if(a==='addPerson') return addPerson(); if(a==='savePerson') return savePerson(); if(a==='editPerson') return editPerson(id); if(a==='savePersonEdit') return savePersonEdit(id); if(a==='deletePerson') return deletePerson(id);
  if(a==='addBook') return addBook(); if(a==='saveBook') return saveBook(); if(a==='editBook') return editBook(id); if(a==='saveBookEdit') return saveBookEdit(id); if(a==='deleteBook') return deleteBook(id);
  if(a==='pickCsv') return pickCsv();
  if(a==='pickGoal') return setCurrentGoal(id); if(a==='goalTab') return setGoalTab(el.dataset.tab); if(a==='toggleTask'){ const t=state.tasks.find(x=>x.id===id); if(t){t.status=t.status==='Готово'?'В работе':'Готово'; save(); render();} return; }
  toast('Действие не найдено: '+a);
}
function bind(){
  document.body.onclick=e=>{ const el=e.target.closest('[data-page],[data-action]'); if(!el) return; const p=el.dataset.page; const a=el.dataset.action; if(p) return go(p); if(a) return handleAction(a,el); };
  const search=$('#search'); if(search){ search.oninput=e=>{ searchQuery=e.target.value; if(searchQuery.trim() && activePage!=='control'){ activePage='control'; render(); } }; }
  const restoreFile=$('#restoreFile'); if(restoreFile) restoreFile.onchange=importBackupFile;
  const csvFile=$('#csvFile'); if(csvFile) csvFile.onchange=importCsvFile;
  $$('[data-habit]').forEach(input=>input.onchange=()=>{ state.habitLogs[todayKey()] ||= {}; state.habitLogs[todayKey()][input.dataset.habit]=input.checked; save(); render(); });
}

const __v401_oldAddTask = addTask;
addTask = function(goalId='', presetDate=''){ openModal('Новая задача / квест', `<div class="form-grid"><label class="full">Название<input id="mTitle" placeholder="Что сделать?"></label><label>Дата<input id="mDue" type="date" value="${presetDate||todayKey()}"></label><label>Время<input id="mTime" type="time"></label><label>Сфера<input id="mArea" value="Личное"></label><label>Приоритет<select id="mPriority"><option>Средний</option><option>Высокий</option><option>Низкий</option></select></label><label>Цель<select id="mGoal">${goalOptions(goalId)}</select></label><label>Человек<select id="mPerson">${personOptions()}</select></label><label class="full">Следующее действие<textarea id="mNext"></textarea></label></div><div class="top-actions"><button class="primary" data-action="saveTask">Сохранить</button></div>`); }

window.SecondBrainBuild={version:RELEASE,inspect,resetCaches,exportBackup,integrityReport,saveLocalSnapshot};
save(); installSW(); render(); setTimeout(renderInstallHint, 700);
