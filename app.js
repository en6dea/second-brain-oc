'use strict';
const APP_NAME='Second Brain OS';
const BUILD='second-brain-space-v58-3-root-habit-premium-20260708';
const STORE_KEY='secondBrainOS.v1';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const num=v=>Number(String(v??'').replace(/\s/g,'').replace(',','.'))||0;
const money=v=>`${Math.round(num(v)).toLocaleString('ru-RU')} ₽`;
const today=()=>new Date().toISOString().slice(0,10);
const iso=d=>new Date(d).toISOString().slice(0,10);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const month=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const fmt=d=>d?new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'}):'—';
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
let page=location.hash?location.hash.slice(1):'dashboard';


/* ===== V32 MASTER CLICK ROUTER: button-only hard fix =====
   Registered before all older routers. It handles every known button action first,
   then stops older stacked listeners from swallowing clicks. No data/schema/design changes. */
window.addEventListener('click',function(e){
  const act=e.target.closest&&e.target.closest('[data-action]');
  const goEl=e.target.closest&&e.target.closest('[data-go]');
  function run(fn){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    try{return fn()}catch(err){console.error('[V32 button router]',err);try{toast('Ошибка кнопки: '+(err.message||err))}catch(_){}}
  }
  function googleEventV31(el){
    const id=el&&el.dataset?el.dataset.id:'';
    const ev=(state.events||[]).find(x=>x.id===id);
    if(!ev){try{toast('Событие не найдено')}catch(_){};return;}
    ev.google=true; save();
    const d=(ev.date||today()).replaceAll('-','');
    const st=(ev.startTime||ev.time||'09:00').replace(':','')+'00';
    const en=(ev.endTime||ev.startTime||ev.time||'10:00').replace(':','')+'00';
    const url='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(ev.title||'Событие')+'&dates='+d+'T'+st+'/'+d+'T'+en+'&details='+encodeURIComponent((ev.note||'')+'\nСоздано из Second Brain OS');
    window.open(url,'_blank');
    render();
  }
  const actions={
    closeModal:()=>closeModal(),
    openQuick:()=>openQuick(),
    openRecordForm:()=>openRecordForm(act.dataset.type,act.dataset.id),
    editRecord:()=>openRecordForm(act.dataset.type,act.dataset.id),
    saveRecord:()=>saveRecord(act),
    deleteRecord:()=>deleteRecord(act),
    openDebtOut:()=>openDebtOut(),
    openDebtIn:()=>openDebtIn(),
    closeDebt:()=>closeDebt(act),
    debtReminder:()=>debtReminder(act),
    toggleHabitDay:()=>toggleHabitDay(act),
    setHabitRange:()=>setHabitRange(act),
    setPlanningFolder:()=>setPlanningFolder(act),
    setFinancePeriod:()=>setFinancePeriod(act),
    setActualBalance:()=>setActualBalance(),
    saveActualBalance:()=>saveActualBalance(),
    googleTask:()=>googleTask(act),
    createTaskReminder:()=>createTaskReminder(act),
    createGoalWeeklyTask:()=>createGoalWeeklyTask(act),
    addFinancialGoal:()=>addFinancialGoal(),
    dedupePurchases:()=>dedupePurchases(),
    importBankCsv:()=>importBankCsv(),
    capture:()=>capture(act),
    renameSection:()=>renameSection(act),
    saveSectionName:()=>saveSectionName(act),
    hideSection:()=>hideSection(act),
    openAddFolder:()=>openAddFolder(),
    openProfileTools:()=>openProfileTools(),
    exportData:()=>exportData(),
    restoreSections:()=>restoreSections(),
    clearCache:()=>clearCache(),
    selectCalendarDay:()=>{state.settings.calendarDate=act.dataset.date||today();save();render()},
    googleEvent:()=>googleEventV31(act),
    polinaOpenDay:()=>window.openPolinaDay?window.openPolinaDay(act.dataset.date||today()):toast('Полина: форма дня не готова'),
    polinaDeleteDay:()=>window.deletePolinaDay?window.deletePolinaDay(act.dataset.id):toast('Полина: удаление не готово'),
    polinaOpenCycle:()=>window.openPolinaCycle?window.openPolinaCycle():toast('Полина: настройки не готовы'),
    polinaSaveCycle:()=>window.savePolinaCycle?window.savePolinaCycle():toast('Полина: сохранение настроек не готово'),
    polinaSaveDay:()=>window.savePolinaDay?window.savePolinaDay(act.dataset.id||''):toast('Полина: сохранение дня не готово'),
    polinaMonth:()=>window.setPolinaMonth?window.setPolinaMonth(act.dataset.delta||0):toast('Полина: календарь не готов'),
    polinaMarkStart:()=>window.markPolinaPeriodStart?window.markPolinaPeriodStart():toast('Полина: отметка не готова')
  };
  if(act && actions[act.dataset.action]) return run(actions[act.dataset.action]);
  if(goEl) return run(()=>go(goEl.dataset.go));
},true);


const SECTIONS=[
 {id:'dashboard',label:'Обзор',icon:'🏠',color:'#3b82f6',group:'ПРОСТРАНСТВО'},
 {id:'finance',label:'Финансы',icon:'💸',color:'#10b981',group:'ФИНАНСЫ'},
 {id:'debts',label:'Долги',icon:'⚖️',color:'#ef4444',group:'ФИНАНСЫ'},
 {id:'tasks',label:'Задачи',icon:'✅',color:'#2563eb',group:'ПРОСТРАНСТВО'},
 {id:'planning',label:'Планирование',icon:'🗓️',color:'#8b5cf6',group:'ПРОСТРАНСТВО'},
 {id:'purchases',label:'Покупки',icon:'🛒',color:'#0ea5e9',group:'ПРОСТРАНСТВО'},
 {id:'wishes',label:'Желания',icon:'💗',color:'#ec4899',group:'ЛИЧНОЕ'},
 {id:'personal',label:'Личное',icon:'🌿',color:'#22c55e',group:'ЛИЧНОЕ'},
 {id:'people',label:'Люди',icon:'👥',color:'#16a34a',group:'ЛИЧНОЕ'},
 {id:'notes',label:'Заметки',icon:'📝',color:'#f59e0b',group:'ЛИЧНОЕ'},
 {id:'ideas',label:'Идеи',icon:'💡',color:'#eab308',group:'ЛИЧНОЕ'},
 {id:'habits',label:'Привычки',icon:'🎯',color:'#06b6d4',group:'ЛИЧНОЕ'},
 {id:'goals',label:'SMART-цели',icon:'🚩',color:'#7c3aed',group:'ПРОСТРАНСТВО'},
 {id:'documents',label:'Документы',icon:'📄',color:'#0ea5e9',group:'ЛИЧНОЕ'},
 {id:'books',label:'Книги',icon:'📚',color:'#14b8a6',group:'ЛИЧНОЕ'},
 {id:'films',label:'Фильмы',icon:'🎬',color:'#f97316',group:'ЛИЧНОЕ'},
 {id:'trips',label:'Путешествия',icon:'✈️',color:'#38bdf8',group:'ЛИЧНОЕ'},
 {id:'archive',label:'Архив',icon:'🗄️',color:'#64748b',group:'СЕРВИС'}
];
const MOBILE=[['dashboard','🏠','Обзор'],['finance','💸','Финансы'],['debts','⚖','Долги'],['tasks','✅','Задачи'],['habits','🎯','Ритм']];

function seedMarks(days,count){const out={};for(let i=0;i<count;i++){out[iso(addDays(new Date(),-(days-1-i)))] = true;}return out;}
function defaults(){const t=today();return {
 settings:{name:'Алексей',subtitle:'Фокус и ясность',folderNames:{},hiddenSections:[],habitRange:28,planningFolder:'focus',financePeriod:'month',currentBalance:0,lastCsvAdded:0,lastCsvDuplicates:0},
 operations:[{id:uid(),type:'income',date:t,amount:129500,category:'Доход',note:'Доходы за июль'},{id:uid(),type:'expense',date:t,amount:88400,category:'Расходы',note:'Расходы месяца'}],
 debts:[{id:uid(),direction:'out',person:'Клещ',amount:1500,due:'2026-06-30',note:'Одолжил на бензин',status:'Ожидает'},{id:uid(),direction:'out',person:'Настя Ярополова',amount:15000,due:'2026-07-07',note:'Одолжил на лечение зубов',status:'Ожидает'},{id:uid(),direction:'out',person:'Квартира на потребке',amount:15000,due:'2026-07-07',note:'Аренда за июнь',status:'Просрочено'},{id:uid(),direction:'out',person:'Альфа Банк',amount:61000,due:'2026-07-10',note:'Кредитная карта',status:'Ожидает'},{id:uid(),direction:'in',person:'Иван Петров',amount:12000,due:'2026-07-05',note:'За дизайн лендинга',status:'Ожидает'},{id:uid(),direction:'in',person:'Мария Смирнова',amount:8000,due:'2026-07-10',note:'Вернуть деньги за ужин',status:'Ожидает'},{id:uid(),direction:'in',person:'ООО «Вектор»',amount:80000,due:'2026-07-20',note:'Частичная предоплата по договору',status:'Ожидает'},{id:uid(),direction:'in',person:'Александр К.',amount:24000,due:'2026-07-25',note:'За консультацию',status:'Ожидает'}],
 tasks:[{id:uid(),title:'Провести планёрку с командой',area:'Работа',date:t,time:'10:00',priority:'B',status:'Активно',google:false,reminder:''},{id:uid(),title:'Обновить финансовый план',area:'Финансы',date:t,time:'14:00',priority:'A',status:'Активно',google:false,reminder:''},{id:uid(),title:'Тренировка в зале',area:'Здоровье',date:t,time:'18:30',priority:'B',status:'Активно',google:false,reminder:''}],
 purchases:[{id:uid(),title:'Полине на капсулы',amount:6000,date:'2026-07-15',url:'',image:'',area:'Личное',includeInBudget:true,note:'Нужно Полине обязательно'}],
 wishes:[{id:uid(),title:'Ноутбук MacBook Pro',amount:199990,date:'2026-08-01',url:'',image:'',area:'Техника',includeInBudget:false,note:'Для работы'},{id:uid(),title:'Поездка в Японию',amount:250000,date:'2026-09-01',url:'',image:'',area:'Путешествия',includeInBudget:false,note:'Токио, Киото, Осака'}],
 notes:[{id:uid(),title:'Идеи для нового проекта',text:'Собрать быстрый прототип и показать результат.',folder:'Работа',date:t},{id:uid(),title:'Планирование отпуска',text:'Посмотреть даты и бюджет.',folder:'Личное',date:t}],
 ideas:[{id:uid(),title:'Приложение для трекинга привычек',text:'Красивый трекер по дням и стрикам.',date:t},{id:uid(),title:'Онлайн-курс по продуктивности',text:'Собрать структуру уроков.',date:t}],
 people:[{id:uid(),name:'Мария Петрова',role:'Работа',birthday:'',phone:'',email:'',photo:'',links:'',likes:'',talkIdeas:'созвониться по проекту',gifts:'',notes:'Созвониться по проекту'},{id:uid(),name:'Полина',role:'Близкий человек',birthday:'1999-08-23',phone:'',email:'',photo:'',links:'',likes:'море, кофе, украшения, прогулки, спокойная атмосфера, внимание к деталям',talkIdeas:'Как прошёл день и что забрало силы?\nЧто сейчас радует?\nКакая поддержка нужна на этой неделе?\nЧто хочется сделать вместе?',gifts:'сертификат / украшение / мини-путешествие / тёплый личный подарок',notes:'Важный человек. Хранить предпочтения, важные даты, подарки, темы разговоров и заметки о заботе.'}],
 habits:[{id:uid(),name:'Движение / прогулка',area:'Здоровье',icon:'🏃',color:'#3b82f6',marks:seedMarks(28,24)},{id:uid(),name:'Чтение 20 минут',area:'Личное развитие',icon:'📗',color:'#22c55e',marks:seedMarks(28,18)},{id:uid(),name:'Обучение трейдингу',area:'Финансы',icon:'🧠',color:'#8b5cf6',marks:seedMarks(28,15)},{id:uid(),name:'Медитация 10 минут',area:'Ментальное здоровье',icon:'🧘',color:'#f59e0b',marks:seedMarks(28,13)},{id:uid(),name:'Дневник благодарности',area:'Личное развитие',icon:'📝',color:'#14b8a6',marks:seedMarks(28,10)}],
 goals:[{id:uid(),title:'Увеличить доход до 200 000 ₽/мес',area:'Финансы',kind:'Финансовая',target:200000,current:129500,deadline:'2026-12-31',note:'Каждую неделю один шаг'},{id:uid(),title:'Подушка безопасности',area:'Финансы',kind:'Финансовая',target:60000,current:41100,deadline:'2026-12-31',note:'Пополнить резерв'}],
 documents:[{id:uid(),title:'Договор с ООО «Ромашка»',type:'PDF',url:'',date:'2026-06-29',note:'1.2 МБ'}],
 books:[{id:uid(),title:'Как завоёвывать друзей',author:'Дейл Карнеги',status:'Читаю',image:'',url:'',quotes:'Важные идеи для общения',note:'Книга про отношения и коммуникацию'}],
 films:[{id:uid(),title:'Фильм на вечер',type:'Фильм',status:'Хочу посмотреть',image:'',url:'',note:'Добавить трейлер и впечатления'}],
 trips:[{id:uid(),title:'Поездка в Японию',place:'Токио, Киото, Осака',budget:250000,start:'2026-09-01',end:'2026-09-12',url:'',image:'',note:'Из желаний'}],
 personal:[{id:uid(),title:'Вечер без телефона',date:t,note:'Личная жизнь и восстановление'}], archive:[], folders:[]
}}
function load(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return null;const parsed=JSON.parse(raw);return parsed.state||parsed}catch(e){return null}}
function asArray(v){return Array.isArray(v)?v:[]}
function dedupeBy(arr,fn){const map=new Map();arr.forEach(x=>{const k=fn(x); if(!map.has(k)) map.set(k,x); else {const old=map.get(k); map.set(k,{...old,...x,id:old.id||x.id});}});return Array.from(map.values())}
function normalize(raw){const b=defaults();const s=raw&&typeof raw==='object'?raw:{};const m={...b,...s,settings:{...b.settings,...(s.settings||{})}};
 ['operations','debts','tasks','purchases','wishes','notes','ideas','people','habits','goals','documents','books','films','trips','personal','archive','folders'].forEach(k=>{m[k]=asArray(m[k]).length?asArray(m[k]):b[k]});
 if(asArray(s.plannedPurchases).length)m.purchases=[...m.purchases,...s.plannedPurchases.map(x=>({id:x.id||uid(),title:x.title||'Покупка',amount:num(x.amount),date:x.date||((x.month||month())+'-15'),url:x.url||'',image:x.image||'',area:x.area||x.category||'Личное',includeInBudget:x.includeInBudget!==false,note:x.note||''}))];
 if(asArray(s.wants).length)m.wishes=[...m.wishes,...s.wants.map(x=>({...x,id:x.id||uid(),note:(x.note||'')+' · перенесено из хотелок'}))];
 m.purchases=dedupeBy(m.purchases.map(x=>({...x,id:x.id||uid(),title:x.title||'Покупка',amount:num(x.amount),date:x.date||today(),area:x.area||'Личное',includeInBudget:x.includeInBudget!==false,url:x.url||'',image:x.image||'',note:x.note||''})),x=>`${String(x.title).toLowerCase()}|${num(x.amount)}|${x.date}|${String(x.note||'').toLowerCase()}`);
 m.wishes=dedupeBy(m.wishes.map(x=>({...x,id:x.id||uid(),title:x.title||'Желание',amount:num(x.amount),date:x.date||today(),area:x.area||'Личное',includeInBudget:x.includeInBudget===true,url:x.url||'',image:x.image||'',note:x.note||''})),x=>`${String(x.title).toLowerCase()}|${num(x.amount)}|${x.date}`);
 m.debts=m.debts.map(d=>({...d,id:d.id||uid(),direction:d.direction==='incoming'||d.direction==='in'?'in':'out',status:d.status||'Ожидает'}));
 m.tasks=m.tasks.map(t=>({...t,id:t.id||uid(),date:t.date||t.due||today(),status:t.status||'Активно',priority:t.priority||'B',google:Boolean(t.google),reminder:t.reminder||''}));
 m.habits=m.habits.map(h=>({...h,id:h.id||uid(),name:h.name||h.title||'Привычка',icon:h.icon||'✓',color:h.color||'#2563eb',marks:h.marks||{}}));
 m.goals=m.goals.map(g=>({...g,id:g.id||uid(),kind:g.kind||(/финанс|доход|руб|₽|подуш/i.test((g.title||'')+(g.area||''))?'Финансовая':'Личная'),target:num(g.target||g.targetValue),current:num(g.current||g.currentValue),note:g.note||g.nextAction||g.week52||''}));
 m.books=m.books.map(b=>({...b,id:b.id||uid(),image:b.image||b.cover||'',url:b.url||b.link||'',quotes:Array.isArray(b.quotes)?b.quotes.join('\n'):(b.quotes||b.note||'')}));
 m.films=[...m.films,...asArray(s.media).map(x=>({id:x.id||uid(),title:x.title||'Фильм',type:x.type||'Фильм',status:x.status||'',image:x.image||x.cover||'',url:x.url||x.link||x.trailer||'',note:x.note||''}))];
 const polina=m.people.find(p=>/полина/i.test(p.name||'')); if(polina){polina.likes=polina.likes||'море, кофе, украшения, спокойствие';polina.talkIdeas=polina.talkIdeas||'Как прошёл день? Что сейчас радует? Как могу поддержать?';polina.gifts=polina.gifts||'украшение, сертификат, мини-путешествие';polina.notes=polina.notes||'Важный человек. Хранить предпочтения, даты, подарки и темы разговоров.'}
 return m}
let state=normalize(load());
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));localStorage.setItem('secondBrainOS.currentBuild',BUILD)}catch(e){console.warn(e)}}
function toast(msg){const t=$('#toast'); if(!t)return; t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function label(id){return state.settings.folderNames?.[id]||SECTIONS.find(s=>s.id===id)?.label||id}
function visibleSections(){return SECTIONS.filter(s=>!(state.settings.hiddenSections||[]).includes(s.id))}
function go(id){page=id||'dashboard';location.hash=page;render()}
window.addEventListener('hashchange',()=>{page=location.hash.slice(1)||'dashboard';render()});
function prog(p,cls=''){return `<div class="progress ${cls}"><b style="width:${clamp(p)}%"></b></div>`}
function empty(t){return `<div class="empty">${t}</div>`}
function total(a,field='amount'){return a.reduce((s,x)=>s+num(x[field]),0)}
function activeDebts(){return state.debts.filter(d=>d.status!=='Закрыт')}
function rowActions(type,id){return `<div class="row-actions"><button class="mini blue" data-action="editRecord" data-type="${type}" data-id="${id}">Ред.</button><button class="mini red" data-action="deleteRecord" data-type="${type}" data-id="${id}">Удалить</button></div>`}
function rowItem(type,x,{icon='•',sub=''}={}){return `<div class="row"><div class="avatar">${icon}</div><div><div class="row-title">${esc(x.title||x.name||x.person||'Запись')}</div><div class="row-sub">${esc(sub||x.note||x.text||'')}</div></div>${rowActions(type,x.id)}</div>`}
function navHtml(){const groups={};visibleSections().forEach(s=>(groups[s.group]||(groups[s.group]=[])).push(s));return Object.entries(groups).map(([g,items])=>`<div class="side-section"><span>${g}</span><button class="tiny-icon" data-action="openAddFolder">＋</button></div><div class="nav-list">${items.map(s=>`<button class="nav-item ${page===s.id?'active':''}" data-go="${s.id}"><span class="nav-ico" style="background:${s.color}">${s.icon}</span><span class="label">${esc(label(s.id))}</span><span class="nav-tools"><span class="tiny-icon" data-action="renameSection" data-id="${s.id}">✎</span><span class="tiny-icon" data-action="hideSection" data-id="${s.id}">×</span></span></button>`).join('')}</div>`).join('')}
function renderShell(content){$('#app').innerHTML=`<div class="app"><aside class="side"><div class="brand"><div class="brand-left"><div class="brand-logo">🧠</div><div><div class="brand-title">Second Brain OS</div><div class="brand-sub">пространство второго мозга</div></div></div><button class="tiny-icon" data-action="openProfileTools">⌄</button></div><div class="search"><span>⌕</span><input id="sideSearch" placeholder="Поиск"><span class="small">⌘K</span></div>${navHtml()}<div class="side-card"><b>Шаблоны и ресурсы</b><p class="small muted">Готовые шаблоны для разных сфер жизни</p><button class="ghost-btn" data-action="openQuick">＋ Быстрое создание</button></div></aside><main class="main"><header class="topbar"><div class="search global-search"><span>⌕</span><input id="globalSearch" placeholder="Поиск по задачам, проектам, заметкам, финансам..."><span class="small">⌘ K</span></div><div class="top-actions"><button class="ghost-btn" data-action="openQuick">＋ Создать</button><button class="ghost-btn" data-action="openProfileTools">Импорт</button><button class="icon-btn" data-action="openProfileTools">⚙</button><button class="icon-btn">🔔</button><div class="row" style="padding:6px 10px;border-radius:16px"><div class="avatar" style="width:32px;height:32px">А</div><div><b>${esc(state.settings.name||'Алексей')}</b><div class="small muted">${esc(state.settings.subtitle||'Фокус и ясность')}</div></div></div></div></header><section id="view">${content}</section></main><button class="mobile-fab" data-action="openQuick">＋</button><nav class="bottom-nav">${MOBILE.map(([id,ico,l])=>`<button class="${page===id?'active':''}" data-go="${id}"><span>${ico}</span>${l}</button>`).join('')}</nav><div class="version">V25 · ПЛАНИРОВАНИЕ + ФИНАНСЫ + ДУБЛИ</div></div>`}
function layout(title,subtitle,body,wide=true){return `<div class="page ${wide?'wide-page':''}"><div class="hero"><div><h1>${title}</h1><p>${subtitle||''}</p></div><div class="date-pill">☷ ${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</div></div>${body}</div>`}

const schemas={
 task:{arr:'tasks',title:'Задача',fields:[['title','Задача'],['area','Папка / сфера'],['date','Дата','date'],['time','Время','time'],['priority','Приоритет','select',[['A','Срочно / важно'],['B','Важно'],['C','Срочно'],['D','Позже']]],['google','Тип Google Calendar','select',[['false','Обычная задача'],['true','Задача / событие Google Calendar']]],['reminder','Напоминание','datetime-local'],['note','Комментарий','textarea']]},
 operation:{arr:'operations',title:'Операция',fields:[['type','Тип','select',[['income','Доход'],['expense','Расход']]],['amount','Сумма','number'],['category','Категория'],['date','Дата','date'],['note','Комментарий']]},
 debt:{arr:'debts',title:'Долг',fields:[['direction','Кто кому должен','select',[['out','Я должен'],['in','Мне должны']]],['person','Кто / организация'],['amount','Сумма','number'],['due','Дата возврата','date'],['status','Статус','select',['Ожидает','Просрочено','Закрыт']],['note','Комментарий','textarea']]},
 purchase:{arr:'purchases',title:'Покупка',fields:[['title','Название'],['amount','Сумма','number'],['date','Дата покупки','date'],['area','Папка / сфера'],['includeInBudget','Учитывать в бюджете','select',[['true','Да'],['false','Нет']]],['url','URL'],['image','URL картинки'],['note','Комментарий','textarea']]},
 wish:{arr:'wishes',title:'Желание',fields:[['title','Название'],['amount','Сумма','number'],['date','Желаемая дата','date'],['area','Папка / сфера'],['includeInBudget','Учитывать в бюджете','select',[['true','Да'],['false','Нет']]],['url','URL'],['image','URL картинки'],['note','Комментарий','textarea']]},
 note:{arr:'notes',title:'Заметка',fields:[['title','Заголовок'],['folder','Папка'],['date','Дата','date'],['text','Текст','textarea']]},
 idea:{arr:'ideas',title:'Идея',fields:[['title','Название'],['date','Дата','date'],['text','Описание','textarea']]},
 person:{arr:'people',title:'Человек',fields:[['name','Имя'],['role','Отношение / роль'],['birthday','День рождения','date'],['phone','Телефон'],['email','Email'],['photo','URL фото'],['links','Полезная ссылка'],['likes','Любит','textarea'],['talkIdeas','Темы для разговора','textarea'],['gifts','Идеи подарков','textarea'],['notes','Заметки','textarea']]},
 habit:{arr:'habits',title:'Привычка',fields:[['name','Название'],['area','Сфера'],['icon','Иконка'],['color','Цвет','color']]},
 goal:{arr:'goals',title:'Цель SMART',fields:[['title','Название'],['kind','Тип','select',[['Финансовая','Финансовая цель'],['Личная','Личная цель']]],['area','Сфера'],['target','Цель / сумма','number'],['current','Сейчас','number'],['deadline','Срок','date'],['note','Шаг недели / подсказка','textarea']]},
 document:{arr:'documents',title:'Документ',fields:[['title','Название'],['type','Тип'],['url','URL / ссылка'],['date','Дата','date'],['note','Комментарий','textarea']]},
 book:{arr:'books',title:'Книга',fields:[['title','Название'],['author','Автор'],['status','Статус'],['image','URL обложки'],['url','URL книги'],['quotes','Цитаты','textarea'],['note','Инсайты / конспект','textarea']]},
 film:{arr:'films',title:'Фильм',fields:[['title','Название'],['type','Тип'],['status','Статус'],['image','URL постера'],['url','URL / трейлер'],['note','Впечатления / заметка','textarea']]},
 trip:{arr:'trips',title:'Путешествие',fields:[['title','Название'],['place','Место'],['budget','Бюджет','number'],['start','Дата начала','date'],['end','Дата окончания','date'],['url','URL маршрута / брони'],['image','URL картинки'],['note','Комментарий','textarea']]},
 personal:{arr:'personal',title:'Личная запись',fields:[['title','Название'],['date','Дата','date'],['note','Комментарий','textarea']]},
 archive:{arr:'archive',title:'Архив',fields:[['title','Название'],['note','Комментарий','textarea']]}
};
function openModal(title,html){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modal').classList.add('show')}
function closeModal(){$('#modal').classList.remove('show')}
function fieldHtml([key,label,type,opts],obj={}){let v=obj[key]??''; if(key==='includeInBudget'||key==='google')v=String(v===true||v==='true'); if(type==='textarea')return `<div class="field span-2"><label>${label}</label><textarea id="f_${key}">${esc(v)}</textarea></div>`; if(type==='select')return `<div class="field"><label>${label}</label><select id="f_${key}">${opts.map(o=>{const val=Array.isArray(o)?o[0]:o, txt=Array.isArray(o)?o[1]:o;return `<option value="${esc(val)}" ${String(v)===String(val)?'selected':''}>${esc(txt)}</option>`}).join('')}</select></div>`; return `<div class="field"><label>${label}</label><input id="f_${key}" type="${type||'text'}" value="${esc(v)}"></div>`}
function openRecordForm(type,id){const s=schemas[type]; if(!s)return toast('Форма не найдена'); const obj=id?state[s.arr].find(x=>x.id===id):{}; openModal((id?'Редактировать: ':'Добавить: ')+s.title,`<div class="form">${s.fields.map(f=>fieldHtml(f,obj||{})).join('')}</div><div class="row-actions" style="margin-top:14px"><button class="btn" data-action="saveRecord" data-type="${type}" ${id?`data-id="${id}"`:''}>Сохранить</button>${id?`<button class="btn red" data-action="deleteRecord" data-type="${type}" data-id="${id}">Удалить</button>`:''}</div>`)}
function collect(type,id){const s=schemas[type];const old=id?(state[s.arr].find(x=>x.id===id)||{}):{};const obj={...old,id:id||uid()};s.fields.forEach(([key,label,type])=>{const el=$(`#f_${key}`);let v=el?el.value:'';if(type==='number')v=num(v);if(key==='includeInBudget'||key==='google')v=v==='true';obj[key]=v});if(type==='habit')obj.marks=obj.marks||{};return obj}
function saveRecord(el){const type=el.dataset.type,id=el.dataset.id,s=schemas[type];if(!s)return;const obj=collect(type,id);if(id)state[s.arr]=state[s.arr].map(x=>x.id===id?obj:x);else state[s.arr].unshift(obj);state=normalize(state);save();closeModal();render();toast('Сохранено')}
function deleteRecord(el){const type=el.dataset.type,id=el.dataset.id,s=schemas[type];if(!s)return;state[s.arr]=state[s.arr].filter(x=>x.id!==id);save();closeModal();render();toast('Удалено')}

function dashboard(){const f=financeTotals(periodInfo('month'));const out=activeDebts().filter(d=>d.direction==='out'),inn=activeDebts().filter(d=>d.direction==='in');return layout(`Доброе утро, ${esc(state.settings.name||'Алексей')}! 👋`,'Единое пространство второго мозга: мысли, деньги, задачи, долги, привычки и память.',`<section class="grid workspace-grid"><article class="card capture"><div class="card-head"><h3>Быстрый захват</h3><button class="mini blue" data-action="openQuick">Создать</button></div><textarea id="quickText" placeholder="Запишите мысль, задачу, идею или что угодно..."></textarea><div class="capture-actions"><button class="capture-btn" data-action="capture" data-type="task">✅<span>Задача</span></button><button class="capture-btn" data-action="capture" data-type="note">📝<span>Заметка</span></button><button class="capture-btn" data-action="capture" data-type="idea">💡<span>Идея</span></button><button class="capture-btn" data-action="capture" data-type="document">🔗<span>Ссылка</span></button><button class="capture-btn" data-action="capture" data-type="document">📄<span>Файл</span></button><button class="capture-btn" data-action="capture" data-type="task">📅<span>Событие</span></button></div></article><article class="card module-card"><div class="card-head"><h3>Задачи на сегодня <span class="pill blue">${todayTasks().length}</span></h3><button class="mini blue" data-action="openRecordForm" data-type="task">＋</button></div><div class="list">${todayTasks().slice(0,4).map(taskRowCompact).join('')||empty('На сегодня чисто')}</div><div class="debt-footer"><button class="mini blue" data-action="openRecordForm" data-type="task">＋ Новая задача</button><button class="mini" data-go="tasks">Открыть задачи →</button></div></article><article class="card module-card"><div class="card-head"><h3>Финансы за месяц</h3><button class="mini" data-go="finance">...</button></div><div class="grid cols-3" style="gap:10px"><div><div class="small muted">Доходы</div><b class="green">${money(f.inc)}</b></div><div><div class="small muted">Расходы</div><b class="red">${money(f.exp)}</b></div><div><div class="small muted">План покупки</div><b class="blue">${money(f.planned)}</b></div></div>${prog(f.inc?Math.max(0,(f.inc-f.exp-f.planned)/f.inc*100):0)}<p class="small muted">Прогноз остатка: ${money(f.net)}</p><button class="mini blue" data-go="finance">Открыть финансы →</button></article></section><section class="grid cols-3" style="margin-top:16px">${dashboardCard('notes','Последние заметки',state.notes,'note','📝','Новая заметка')} ${dashboardCard('wishes','Желания',state.wishes,'wish','💗','Добавить желание')} <article class="card module-card"><div class="card-head"><h3>Долги <span class="pill blue">${activeDebts().length}</span></h3><button class="mini blue" data-action="openRecordForm" data-type="debt">＋</button></div><div class="list">${activeDebts().slice(0,4).map(d=>`<div class="row"><div class="avatar" style="color:${d.direction==='out'?'#ef4444':'#10b981'}">${d.direction==='out'?'↙':'↗'}</div><div><div class="row-title">${esc(d.person)} · ${money(d.amount)}</div><div class="row-sub">${d.direction==='out'?'Я должен':'Мне должны'} · до ${fmt(d.due)}</div></div><span class="pill ${d.direction==='out'?'red':'green'}">${d.direction==='out'?'Я должен':'Мне должны'}</span></div>`).join('')}</div><div class="debt-footer"><button class="mini blue" data-action="openDebtOut">＋ Добавить долг</button><button class="mini" data-go="debts">Все долги →</button></div></article>${dashboardCard('habits','Привычки',state.habits,'habit','🎯','Новая привычка')} ${dashboardCard('documents','Документы',state.documents,'document','📄','Добавить документ')} ${dashboardCard('ideas','Идеи',state.ideas,'idea','💡','Новая идея')} ${dashboardCard('goals','Цели',state.goals,'goal','🚩','Новая цель')} ${dashboardCard('people','Люди',state.people,'person','👥','Добавить человека')} ${dashboardCard('books','Книги',state.books,'book','📚','Добавить книгу')}</section>`)}
function dashboardCard(goId,title,arr,type,icon,addLabel){return `<article class="card module-card"><div class="card-head"><h3>${title} <span class="pill blue">${arr.length}</span></h3><button class="mini blue" data-action="openRecordForm" data-type="${type}">＋</button></div><div class="list">${arr.slice(0,4).map(x=>rowItem(type,x,{icon,sub:x.text||x.note||x.area||x.author||x.role||''})).join('')||empty('Пока пусто')}</div><div class="debt-footer"><button class="mini blue" data-action="openRecordForm" data-type="${type}">＋ ${addLabel}</button><button class="mini" data-go="${goId}">Все →</button></div></article>`}
function todayTasks(){return state.tasks.filter(t=>t.status!=='Готово'&&t.date===today())}
function taskRowCompact(t){return `<div class="row"><div class="avatar">${t.google?'📅':'✓'}</div><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.area||'Личное')} · ${esc(t.time||'')} ${t.google?'· Google Calendar':''}</div></div>${rowActions('task',t.id)}</div>`}

function tasksPage(){const dates=[today(),iso(addDays(new Date(),1)),iso(addDays(new Date(),2)),iso(addDays(new Date(),3))];return layout('Задачи','Папка задач в стиле Google Calendar: задачи, даты, напоминания и экспорт в календарь.',`<section class="grid cols-4"><article class="card"><h3>Сегодня</h3><div class="value sm blue">${todayTasks().length}</div></article><article class="card"><h3>Google Calendar</h3><div class="value sm">${state.tasks.filter(t=>t.google).length}</div><p class="small muted">задач с календарём</p></article><article class="card"><h3>Напоминания</h3><div class="value sm amber">${state.tasks.filter(t=>t.reminder).length}</div></article><article class="card"><h3>Активные</h3><div class="value sm green">${state.tasks.filter(t=>t.status!=='Готово').length}</div></article></section><section class="grid cols-2" style="margin-top:16px"><article class="card"><div class="card-head"><h3>Лента задач</h3><button class="btn" data-action="openRecordForm" data-type="task">＋ Новая задача</button></div><div class="list">${state.tasks.sort((a,b)=>String(a.date+a.time).localeCompare(String(b.date+b.time))).map(taskFullRow).join('')||empty('Задач нет')}</div></article><article class="card"><div class="card-head"><h3>Календарь задач</h3><button class="ghost-btn" data-action="openRecordForm" data-type="task">＋ Добавить</button></div><div class="grid cols-2">${dates.map(d=>`<div class="card"><h3>${fmt(d)}</h3><div class="list">${state.tasks.filter(t=>t.date===d).map(t=>`<div class="row"><div class="avatar">${t.google?'📅':'✓'}</div><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.time||'Без времени')}</div></div></div>`).join('')||empty('Пусто')}</div></div>`).join('')}</div></article></section>`)}
function taskFullRow(t){return `<div class="row"><div class="avatar">${t.google?'📅':'✓'}</div><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${fmt(t.date)} · ${esc(t.time||'без времени')} · ${esc(t.area||'Личное')} ${t.reminder?`· напоминание ${esc(t.reminder)}`:''}</div></div><div class="row-actions"><button class="mini blue" data-action="googleTask" data-id="${t.id}">Google</button><button class="mini green" data-action="createTaskReminder" data-id="${t.id}">Напомнить</button><button class="mini blue" data-action="editRecord" data-type="task" data-id="${t.id}">Ред.</button><button class="mini red" data-action="deleteRecord" data-type="task" data-id="${t.id}">Удалить</button></div></div>`}

function debtsPage(){const out=activeDebts().filter(d=>d.direction==='out'),inn=activeDebts().filter(d=>d.direction==='in');const overdue=activeDebts().filter(d=>d.due&&d.due<today());const nearest=activeDebts().filter(d=>d.due).sort((a,b)=>String(a.due).localeCompare(String(b.due)))[0];return layout('Долги','Кому я должен, кто должен мне, сроки возврата и напоминания в одном месте.',`<section class="grid cols-4"><article class="card"><h3>Я должен</h3><div class="value sm red">${money(total(out))}</div></article><article class="card"><h3>Мне должны</h3><div class="value sm green">${money(total(inn))}</div></article><article class="card"><h3>Ближайший срок</h3><div class="value sm blue">${nearest?fmt(nearest.due):'—'}</div><p class="small muted">${nearest?esc(nearest.person):'сроков нет'}</p></article><article class="card"><h3>Просрочено</h3><div class="value sm red">${money(total(overdue))}</div></article></section><section class="debt-board" style="margin-top:18px"><div class="debt-col out"><div class="card-head"><div><h2 class="red">← Я должен</h2><p class="small muted">Долги, которые нужно погасить</p></div><button class="ghost-btn" data-action="openDebtOut">＋ Добавить</button></div><div class="list">${out.map(debtCard).join('')||empty('Нет долгов, которые должен ты')}</div><div class="debt-footer"><span>Всего долгов: ${out.length}</span><b class="red">${money(total(out))}</b></div></div><div class="debt-col in"><div class="card-head"><div><h2 class="green">Мне должны →</h2><p class="small muted">Долги, которые должны вернуть мне</p></div><button class="ghost-btn" data-action="openDebtIn">＋ Добавить</button></div><div class="list">${inn.map(debtCard).join('')||empty('Нет долгов, которые должны тебе')}</div><div class="debt-footer"><span>Всего долгов мне: ${inn.length}</span><b class="green">${money(total(inn))}</b></div></div></section>`)}
function debtCard(d){const dir=d.direction==='out';return `<article class="debt-card ${dir?'out':'in'}"><div class="debt-top"><div class="avatar">${(d.person||'?').slice(0,1)}</div><div><h3>${esc(d.person)}</h3><div class="value sm ${dir?'red':'green'}">${money(d.amount)}</div><div class="debt-note">${esc(d.note||'')}</div></div><div><span class="date-box">📅 до ${fmt(d.due)}</span><br><span class="pill ${d.status==='Просрочено'?'red':'amber'}" style="margin-top:8px">${esc(d.status||'Ожидает')}</span></div></div><div class="row-actions"><button class="mini blue" data-action="debtReminder" data-id="${d.id}">Напомнить</button><button class="mini blue" data-action="editRecord" data-type="debt" data-id="${d.id}">Ред.</button><button class="mini green" data-action="closeDebt" data-id="${d.id}">Закрыть</button><button class="mini red" data-action="deleteRecord" data-type="debt" data-id="${d.id}">Удалить</button></div></article>`}

function periodInfo(kind=state.settings.financePeriod||'month'){const now=new Date();let s,e,title; if(kind==='last'){s=new Date(now.getFullYear(),now.getMonth()-1,1);e=new Date(now.getFullYear(),now.getMonth(),0);title='прошлый месяц'} else if(kind==='next'){s=new Date(now.getFullYear(),now.getMonth()+1,1);e=new Date(now.getFullYear(),now.getMonth()+2,0);title='будущий месяц'} else if(kind==='quarter'){s=new Date(now.getFullYear(),now.getMonth(),1);e=new Date(now.getFullYear(),now.getMonth()+3,0);title='3 месяца'} else if(kind==='year'){s=new Date(now.getFullYear(),0,1);e=new Date(now.getFullYear(),11,31);title='год'} else {s=new Date(now.getFullYear(),now.getMonth(),1);e=new Date(now.getFullYear(),now.getMonth()+1,0);title='текущий месяц';kind='month'} return {key:kind,start:iso(s),end:iso(e),title}}
function inPeriod(date,p){return String(date||'')>=p.start&&String(date||'')<=p.end}
function financeTotals(p){const ops=state.operations.filter(o=>inPeriod(o.date,p));const inc=total(ops.filter(o=>o.type==='income'));const exp=total(ops.filter(o=>o.type==='expense'));const planned=total(state.purchases.filter(x=>x.includeInBudget!==false&&inPeriod(x.date,p)));return {inc,exp,planned,net:inc-exp-planned}}
function financePage(){const p=periodInfo();const t=financeTotals(p);const out=activeDebts().filter(d=>d.direction==='out'),inn=activeDebts().filter(d=>d.direction==='in');return layout('Финансы','Аналитика по периодам, графики, прогноз и плановые покупки будущих месяцев.',`<section class="finance-tabs">${[['month','Текущий месяц'],['last','Прошлый'],['next','Будущий месяц'],['quarter','3 месяца'],['year','Год']].map(([k,l])=>`<button class="chip-btn ${p.key===k?'active':''}" data-action="setFinancePeriod" data-period="${k}">${l}</button>`).join('')}</section><section class="grid cols-4"><article class="card"><h3>Фактический остаток</h3><div class="value sm blue">${money(state.settings.currentBalance)}</div><button class="ghost-btn" data-action="setActualBalance">Проставить остаток</button></article><article class="card"><h3>Доходы · ${p.title}</h3><div class="value sm green">${money(t.inc)}</div></article><article class="card"><h3>Расходы · ${p.title}</h3><div class="value sm red">${money(t.exp)}</div></article><article class="card"><h3>Прогноз остатка</h3><div class="value sm ${t.net<0?'red':'green'}">${money(t.net)}</div><p class="small muted">доходы − расходы − покупки</p></article></section><section class="grid cols-2" style="margin-top:16px"><article class="card"><div class="card-head"><h3>График доходов/расходов</h3><span class="pill blue">${fmt(p.start)} — ${fmt(p.end)}</span></div>${financeChart(p)}</article><article class="card"><div class="card-head"><h3>Прогноз и контроль</h3><span class="pill green">план</span></div>${forecastBlock(p,t)}</article></section><section class="grid cols-2" style="margin-top:16px"><article class="card"><div class="card-head"><h3>Категории расходов</h3><button class="ghost-btn" data-action="openRecordForm" data-type="operation">＋ Операция</button></div>${categoryBreakdown(p)}</article><article class="card"><div class="card-head"><h3>Импорт CSV банка</h3><span class="pill blue">дубли удаляются</span></div><p class="small muted">Одинаковые строки по дате, типу, сумме, категории и комментарию будут пропущены.</p><input type="file" id="csvFile" accept=".csv,text/csv"><div class="row-actions" style="margin-top:10px"><button class="btn" data-action="importBankCsv">Импортировать CSV</button></div><p class="small muted">Последний импорт: добавлено ${state.settings.lastCsvAdded||0}, дублей удалено ${state.settings.lastCsvDuplicates||0}</p><div class="grid cols-2"><div class="card"><h3>Я должен</h3><div class="value sm red">${money(total(out))}</div></div><div class="card"><h3>Мне должны</h3><div class="value sm green">${money(total(inn))}</div></div></div></article></section><section class="card" style="margin-top:16px"><div class="card-head"><div><h3>Плановые покупки по месяцам</h3><p class="small muted">Покупка учитывается в бюджете того месяца, где стоит её дата.</p></div><button class="btn" data-action="openRecordForm" data-type="purchase">＋ Добавить покупку</button></div>${plannedMonthBlock(p)}</section>`)}
function financeChart(p){const days=[];for(let d=new Date(p.start);d<=new Date(p.end);d=addDays(d,1))days.push(iso(d));if(days.length>46){const step=Math.ceil(days.length/38);for(let i=days.length-1;i>=0;i--)if(i%step!==0)days.splice(i,1)}const incBy={},expBy={};state.operations.filter(o=>inPeriod(o.date,p)).forEach(o=>{(o.type==='income'?incBy:expBy)[o.date]=((o.type==='income'?incBy:expBy)[o.date]||0)+num(o.amount)});const max=Math.max(1,...days.map(d=>Math.max(incBy[d]||0,expBy[d]||0)));return `<div class="finance-chart">${days.map(d=>`<div class="finance-day" data-tip="${fmt(d)}: доход ${money(incBy[d]||0)}, расход ${money(expBy[d]||0)}"><div class="finance-bar income" style="height:${Math.max(4,(incBy[d]||0)/max*100)}%"></div><div class="finance-bar expense" style="height:${Math.max(4,(expBy[d]||0)/max*100)}%"></div></div>`).join('')}</div><div class="row-actions" style="justify-content:flex-start;margin-top:10px"><span class="pill green">Доход</span><span class="pill red">Расход</span></div>`}
function forecastBlock(p,t){const days=Math.max(1,(new Date(p.end)-new Date(p.start))/86400000+1);const avg=t.exp/days;const left=state.settings.currentBalance+t.inc-t.exp-t.planned;return `<div class="forecast-list"><div class="row"><div>Средний расход в день</div><b>${money(avg)}</b></div><div class="row"><div>Плановые покупки периода</div><b>${money(t.planned)}</b></div><div class="row"><div>Прогноз расходов</div><b class="red">${money(t.exp+t.planned)}</b></div><div class="row"><div>Прогноз остатка с фактом</div><b class="${left<0?'red':'green'}">${money(left)}</b></div></div>`}
function categoryBreakdown(p){const cats={};state.operations.filter(o=>o.type==='expense'&&inPeriod(o.date,p)).forEach(o=>cats[o.category||'Без категории']=(cats[o.category||'Без категории']||0)+num(o.amount));const max=Math.max(1,...Object.values(cats));return `<div class="category-bars">${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="category-line"><div class="category-top"><span>${esc(k)}</span><b>${money(v)}</b></div>${prog(v/max*100,'red')}</div>`).join('')||empty('Расходов нет')}</div>`}
function plannedMonthBlock(){const g={};state.purchases.forEach(x=>{const m=(x.date||today()).slice(0,7);(g[m]||(g[m]=[])).push(x)});return `<section class="purchase-month-grid">${Object.entries(g).sort().map(([m,arr])=>`<article class="planned-month-card"><div class="card-head"><div><h3>${m}</h3><p class="small muted">${arr.length} покупок · в бюджет ${money(total(arr.filter(x=>x.includeInBudget!==false)))}</p></div></div>${arr.slice(0,5).map(purchaseCard).join('')}</article>`).join('')||empty('Покупок нет')}</section>`}

function purchaseCard(x,type='purchase'){return `<article class="record-card"><div class="row" style="border:0;background:transparent;padding:0"><div class="thumb">${x.image?`<img src="${esc(x.image)}">`:(type==='wish'?'💗':'🛒')}</div><div><h3>${esc(x.title)}</h3><p class="small muted">${fmt(x.date)} · ${esc(x.area||'Личное')}</p></div><span class="pill blue">${money(x.amount)}</span></div><p class="small muted">${esc(x.note||'')}</p><div class="row-actions"><span class="pill ${x.includeInBudget!==false?'green':'red'}">${x.includeInBudget!==false?'В бюджете':'Вне бюджета'}</span>${x.url?`<a class="mini blue" href="${esc(x.url)}" target="_blank">URL</a>`:''}<button class="mini blue" data-action="editRecord" data-type="${type}" data-id="${x.id}">Ред.</button><button class="mini red" data-action="deleteRecord" data-type="${type}" data-id="${x.id}">Удалить</button></div></article>`}
function purchasesPage(){const g={};state.purchases.forEach(x=>{const m=(x.date||today()).slice(0,7);(g[m]||(g[m]=[])).push(x)});return layout('Покупки','Покупки с датой, URL, картинкой и флагом бюджета. Дубли удаляются автоматически.',`<section class="card"><div class="card-head"><h3>План покупок по месяцам</h3><div class="row-actions"><button class="ghost-btn" data-action="dedupePurchases">Удалить дубли</button><button class="btn" data-action="openRecordForm" data-type="purchase">＋ Добавить</button></div></div><section class="purchase-month-grid">${Object.entries(g).sort().map(([m,arr])=>`<article class="planned-month-card"><div class="card-head"><div><h3>${m}</h3><p class="small muted">${arr.length} покупок · в бюджет ${money(total(arr.filter(x=>x.includeInBudget!==false)))}</p></div></div>${arr.map(x=>purchaseCard(x,'purchase')).join('')}</article>`).join('')||empty('Пока пусто')}</section></section>`)}
function wishesPage(){return layout('Желания','Желания с датой, URL, картинкой и выбором — учитывать в бюджете или нет.',`<section class="card"><div class="card-head"><h3>Желания</h3><button class="btn" data-action="openRecordForm" data-type="wish">＋ Добавить</button></div><div class="record-grid">${state.wishes.map(x=>purchaseCard(x,'wish')).join('')||empty('Желаний пока нет')}</div></section>`)}
function genericPage(title,subtitle,arr,type){return layout(title,subtitle,`<section class="card"><div class="card-head"><h3>${title}</h3><button class="btn" data-action="openRecordForm" data-type="${type}">＋ Добавить</button></div><div class="record-grid">${arr.map(x=>recordCard(type,x)).join('')||empty('Пока пусто')}</div></section>`)}
function recordCard(type,x){const title=x.title||x.name||x.person||'Запись';const sub=x.author||x.role||x.area||x.folder||x.place||x.type||'';const amount=x.amount||x.budget||x.target;return `<article class="record-card">${x.image?`<img src="${esc(x.image)}" alt="">`:''}<div class="card-head"><div><h3>${esc(title)}</h3><p class="small muted">${esc(sub)}</p></div>${amount?`<span class="pill blue">${money(amount)}</span>`:''}</div><p class="small muted" style="white-space:pre-line">${esc(x.note||x.text||x.quotes||'')}</p>${x.url?`<a class="pill blue" href="${esc(x.url)}" target="_blank">Открыть URL</a>`:''}${x.includeInBudget!==undefined?`<span class="pill ${x.includeInBudget?'green':'red'}">${x.includeInBudget?'Учитывается в бюджете':'Не учитывается в бюджете'}</span>`:''}${rowActions(type,x.id)}</article>`}
function notesPage(){return genericPage('Заметки','База личных заметок.',state.notes,'note')}
function ideasPage(){return genericPage('Идеи','Идеи и заготовки проектов.',state.ideas,'idea')}
function documentsPage(){return genericPage('Документы','Ссылки, файлы, договоры и важные документы.',state.documents,'document')}
function booksPage(){return genericPage('Книги','Книги, обложки, URL и цитаты.',state.books,'book')}
function filmsPage(){return genericPage('Фильмы','Фильмы, сериалы, постеры, трейлеры и впечатления.',state.films,'film')}
function tripsPage(){return genericPage('Путешествия','Маршруты, бюджеты, ссылки и URL-картинки.',state.trips,'trip')}
function archivePage(){return genericPage('Архив','Удалённые и отложенные записи.',state.archive,'archive')}

function peoplePage(){return layout('Люди','Контакты, даты, подарки, темы разговоров и важные детали.',`<section class="grid cols-3">${state.people.map(p=>`<article class="card"><div class="card-head"><div><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.role||'Контакт')}</p></div><div class="avatar" style="width:58px;height:58px">${p.photo?`<img src="${esc(p.photo)}">`:esc((p.name||'?')[0])}</div></div><div class="grid cols-2"><div class="record-card"><b>День рождения</b><p class="small muted">${esc(p.birthday||'—')}</p></div><div class="record-card"><b>Контакты</b><p class="small muted">${esc([p.phone,p.email].filter(Boolean).join(' · ')||'—')}</p></div></div><div class="record-card"><b>Любит</b><p class="small muted" style="white-space:pre-line">${esc(p.likes||'—')}</p></div><div class="record-card"><b>Темы для разговора</b><p class="small muted" style="white-space:pre-line">${esc(p.talkIdeas||'—')}</p></div><div class="record-card"><b>Идеи подарков</b><p class="small muted" style="white-space:pre-line">${esc(p.gifts||'—')}</p></div><div class="record-card"><b>Заметки</b><p class="small muted" style="white-space:pre-line">${esc(p.notes||'—')}</p></div><div class="row-actions">${p.links?`<a class="mini blue" href="${esc(p.links)}" target="_blank">Ссылка</a>`:''}<button class="mini blue" data-action="editRecord" data-type="person" data-id="${p.id}">Ред.</button><button class="mini red" data-action="deleteRecord" data-type="person" data-id="${p.id}">Удалить</button></div></article>`).join('')||empty('Люди пока не добавлены')}</section><div style="margin-top:16px"><button class="btn" data-action="openRecordForm" data-type="person">＋ Добавить человека</button></div>`)}
function habitsPage(){const range=num(state.settings.habitRange)||28;const days=Array.from({length:range},(_,i)=>iso(addDays(new Date(),-(range-1-i))));const avg=state.habits.length?Math.round(state.habits.reduce((s,h)=>s+habitPct(h,days),0)/state.habits.length):0;const done=state.habits.filter(h=>h.marks?.[today()]).length;return layout('Привычки','Красивый трекер повторений по дням с трендом по всем привычкам.',`<section class="grid cols-4"><article class="card"><h3>Ритм привычек</h3><div class="value sm">${avg}%</div>${prog(avg)}</article><article class="card"><h3>Выполнено сегодня</h3><div class="value sm">${done}/${state.habits.length}</div>${prog(state.habits.length?done/state.habits.length*100:0,'green')}</article><article class="card"><h3>Активные привычки</h3><div class="value sm">${state.habits.length}</div></article><article class="card"><h3>Лучший стрик</h3><div class="value sm">${Math.max(0,...state.habits.map(streak))} дней</div></article></section><div class="habit-toolbar"><div class="seg">${[7,14,28].map(n=>`<button data-action="setHabitRange" data-range="${n}" class="${range===n?'active':''}">${n} дней</button>`).join('')}</div><button class="btn" data-action="openRecordForm" data-type="habit">＋ Новая привычка</button></div><section class="habit-table"><div class="habit-grid" style="grid-template-columns:280px repeat(${range},32px) 116px"><div class="habit-head"><div class="habit-title"><b>Привычка</b></div>${days.map(d=>`<div class="habit-day-head">${new Date(d).getDate()}<br>${new Date(d).toLocaleDateString('ru-RU',{weekday:'short'}).slice(0,2)}</div>`).join('')}<div class="habit-actions"><b>Действия</b></div></div>${state.habits.map(h=>habitRow(h,days)).join('')}</div></section><div style="margin-top:16px">${habitTrend(days)}</div>`)}
function habitPct(h,days){return Math.round(days.filter(d=>h.marks?.[d]).length/Math.max(1,days.length)*100)}
function streak(h){let n=0;for(let d=new Date();;d=addDays(d,-1)){const k=iso(d);if(h.marks?.[k])n++;else break;if(n>365)break}return n}
function habitRow(h,days){return `<div class="habit-row"><div class="habit-title"><div class="habit-icon" style="background:${h.color}">${esc(h.icon)}</div><div><b>${esc(h.name)}</b><div class="small muted">${esc(h.area||'')} · ${habitPct(h,days)}%</div></div></div>${days.map(d=>`<div class="habit-cell"><button class="day-check ${h.marks?.[d]?'on':''} ${d===today()?'today':''}" style="--c:${h.color}" data-action="toggleHabitDay" data-id="${h.id}" data-date="${d}">${h.marks?.[d]?'✓':''}</button></div>`).join('')}<div class="habit-actions"><button class="mini blue" data-action="editRecord" data-type="habit" data-id="${h.id}">Ред.</button><button class="mini red" data-action="deleteRecord" data-type="habit" data-id="${h.id}">🗑</button></div></div>`}
function habitTrend(days){const max=state.habits.length||1;return `<article class="card"><div class="card-head"><h3>Тренд привычек по дням</h3><span class="pill blue">по всем</span></div><div class="finance-chart" style="height:120px">${days.map(d=>{const v=state.habits.filter(h=>h.marks?.[d]).length;return `<div class="finance-day" data-tip="${fmt(d)}: ${v}/${max}"><div class="finance-bar income" style="height:${Math.max(5,v/max*100)}%"></div></div>`}).join('')}</div></article>`}
function goalsPage(){state.goals.forEach(g=>ensureGoalTask(g,false));save();return layout('SMART-цели','Финансовые и личные цели. У каждой цели всегда есть активная задача недели.',`<section class="grid cols-2">${state.goals.map(g=>{const p=g.target?num(g.current)/Math.max(1,num(g.target))*100:0;const task=state.tasks.find(t=>t.goalId===g.id&&t.status!=='Готово');return `<article class="card"><div class="card-head"><div><h3>${esc(g.title)}</h3><p class="small muted">${esc(g.kind||'Цель')} · ${esc(g.area||'')} · срок ${fmt(g.deadline)}</p></div><span class="pill blue">${clamp(Math.round(p))}%</span></div>${prog(p,'green')}<div class="record-card"><b>Подсказки</b><ul class="small muted"><li>Назначь один шаг на неделю.</li><li>Шаг должен занимать 15–40 минут.</li><li>После выполнения создай следующий шаг.</li></ul></div><div class="record-card"><b>Активная задача недели</b>${task?taskFullRow(task):'<p class="small muted">Будет создана автоматически.</p>'}</div><div class="row-actions"><button class="mini green" data-action="createGoalWeeklyTask" data-id="${g.id}">Создать шаг недели</button><button class="mini blue" data-action="editRecord" data-type="goal" data-id="${g.id}">Ред.</button><button class="mini red" data-action="deleteRecord" data-type="goal" data-id="${g.id}">Удалить</button></div></article>`}).join('')||empty('Целей пока нет')}</section><div style="margin-top:16px"><button class="btn" data-action="openRecordForm" data-type="goal">＋ Новая цель</button><button class="ghost-btn" data-action="addFinancialGoal" style="margin-left:8px">＋ Финансовая цель</button></div>`)}
function ensureGoalTask(g,saveNow=true){if(!g?.id)return;const exists=state.tasks.some(t=>t.goalId===g.id&&t.status!=='Готово');if(!exists){state.tasks.unshift({id:uid(),goalId:g.id,title:`Шаг недели: ${g.note||g.title}`,area:g.area||'Цели',date:today(),time:'09:00',priority:'B',status:'Активно',google:false,reminder:''});if(saveNow)save()}}
function planningPage(){return layout('Планирование','Папки слева как в Notion: задачи, сроки, покупки и желания без долгов и путешествий.',`<section class="folder-space"><aside class="folder-pane">${[['focus','Фокус дня','🎯',todayTasks().length],['areas','Папки сфер','📁',state.tasks.length],['priorities','Приоритеты','🚩',state.tasks.length],['deadlines','Сроки','🗓️',state.tasks.filter(t=>t.date).length],['purchases','Покупки','🛒',state.purchases.length],['wishes','Желания','💗',state.wishes.length]].map(([id,n,ico,c])=>`<button class="folder-item ${state.settings.planningFolder===id?'active':''}" data-action="setPlanningFolder" data-id="${id}"><span class="avatar">${ico}</span><span><b>${n}</b><div class="small muted">${c} записей</div></span><span>›</span></button>`).join('')}</aside><main class="folder-main">${planningContent()}</main></section>`)}
function planningContent(){const f=state.settings.planningFolder||'focus';if(f==='purchases')return purchasesPage().replace(/^<div class="page wide-page"><div class="hero">[\s\S]*?<\/div>/,'').replace(/<\/div>$/,'');if(f==='wishes')return wishesPage().replace(/^<div class="page wide-page"><div class="hero">[\s\S]*?<\/div>/,'').replace(/<\/div>$/,'');return `<section class="grid cols-2"><article class="card"><div class="card-head"><h3>Задачи</h3><button class="btn" data-action="openRecordForm" data-type="task">＋ Добавить</button></div><div class="list">${state.tasks.map(taskFullRow).join('')||empty('Задач нет')}</div></article><article class="card"><h3>Календарь</h3><div class="list">${state.tasks.filter(t=>t.date).slice(0,8).map(t=>`<div class="row"><div class="avatar">📅</div><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${fmt(t.date)} · ${esc(t.time||'')}</div></div></div>`).join('')}</div></article></section>`}
function personalPage(){const folders=[['people','Люди','👥','#22c55e',state.people.length],['notes','Заметки','📝','#f59e0b',state.notes.length],['ideas','Идеи','💡','#eab308',state.ideas.length],['wishes','Желания','💗','#ec4899',state.wishes.length],['books','Книги','📚','#14b8a6',state.books.length],['films','Фильмы','🎬','#f97316',state.films.length],['trips','Путешествия','✈️','#38bdf8',state.trips.length],['documents','Документы','📄','#0ea5e9',state.documents.length]];return layout('Личное','Личный раздел второго мозга: люди, память, идеи, книги, фильмы, желания, путешествия и документы.',`<section class="grid cols-3">${folders.map(([id,n,ico,c,count])=>`<button class="card" data-go="${id}" style="text-align:left;min-height:130px"><span class="avatar" style="background:${c};color:white">${ico}</span><h3 style="margin-top:10px">${n}</h3><p class="small muted">${count} записей</p><span class="pill blue">Открыть</span></button>`).join('')}</section><article class="card" style="margin-top:16px"><h3>Что делать в «Личном»</h3><p class="muted">Сюда складывай всё, что относится к тебе как к человеку: люди, предпочтения, важные даты, идеи подарков, заметки, книги, фильмы, желания, путешествия и личные выводы. Это не список задач, а память и контекст жизни.</p></article>`)}

function openQuick(){openModal('Быстро создать',`<div class="grid cols-3"><button class="btn" data-action="openRecordForm" data-type="task">Задача</button><button class="btn" data-action="openRecordForm" data-type="note">Заметка</button><button class="btn" data-action="openRecordForm" data-type="idea">Идея</button><button class="ghost-btn" data-action="openRecordForm" data-type="debt">Долг</button><button class="ghost-btn" data-action="openRecordForm" data-type="purchase">Покупка</button><button class="ghost-btn" data-action="openRecordForm" data-type="wish">Желание</button><button class="ghost-btn" data-action="openRecordForm" data-type="habit">Привычка</button><button class="ghost-btn" data-action="openRecordForm" data-type="person">Человек</button><button class="ghost-btn" data-action="openRecordForm" data-type="goal">Цель</button></div>`)}
function capture(el){const txt=$('#quickText')?.value?.trim();if(!txt)return toast('Сначала напиши текст');const type=el.dataset.type;if(type==='task')state.tasks.unshift({id:uid(),title:txt,area:'Быстрый захват',date:today(),time:'',priority:'B',status:'Активно'});if(type==='note')state.notes.unshift({id:uid(),title:txt.slice(0,60),text:txt,folder:'Быстрый захват',date:today()});if(type==='idea')state.ideas.unshift({id:uid(),title:txt.slice(0,60),text:txt,date:today()});if(type==='document')state.documents.unshift({id:uid(),title:txt.slice(0,60),url:txt,type:'Ссылка',date:today(),note:'Быстрый захват'});save();render();toast('Сохранено')}
function openDebtOut(){openRecordForm('debt');setTimeout(()=>{const el=$('#f_direction');if(el)el.value='out'},0)}
function openDebtIn(){openRecordForm('debt');setTimeout(()=>{const el=$('#f_direction');if(el)el.value='in'},0)}
function closeDebt(el){const d=state.debts.find(x=>x.id===el.dataset.id);if(d)d.status='Закрыт';save();render();toast('Долг закрыт')}
function debtReminder(el){const d=state.debts.find(x=>x.id===el.dataset.id);if(!d)return;state.tasks.unshift({id:uid(),title:`${d.direction==='out'?'Оплатить':'Напомнить о возврате'}: ${d.person} — ${money(d.amount)}`,area:'Финансы',date:d.due||today(),time:'10:00',priority:d.direction==='out'?'A':'B',status:'Активно',google:false,reminder:''});save();render();toast('Напоминание добавлено в задачи')}
function toggleHabitDay(el){const h=state.habits.find(x=>x.id===el.dataset.id);if(!h)return;h.marks=h.marks||{};h.marks[el.dataset.date]=!h.marks[el.dataset.date];save();render()}
function setHabitRange(el){state.settings.habitRange=num(el.dataset.range)||28;save();render()}
function setPlanningFolder(el){state.settings.planningFolder=el.dataset.id;save();render()}
function setFinancePeriod(el){state.settings.financePeriod=el.dataset.period||'month';save();render()}
function setActualBalance(){openModal('Фактический остаток',`<div class="field"><label>Сколько денег фактически сейчас?</label><input id="f_currentBalance" inputmode="decimal" value="${esc(state.settings.currentBalance||'')}"></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-action="saveActualBalance">Сохранить</button></div>`)}
function saveActualBalance(){state.settings.currentBalance=num($('#f_currentBalance')?.value);save();closeModal();render();toast('Фактический остаток обновлён')}
function createGoogleUrl(t){const date=(t.date||today()).replaceAll('-','');const start=`${date}T${(t.time||'09:00').replace(':','')}00`;const end=`${date}T${(t.time||'10:00').replace(':','')}00`;return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(t.title)}&dates=${start}/${end}&details=${encodeURIComponent(t.note||'Создано из Second Brain OS')}`}
function googleTask(el){const t=state.tasks.find(x=>x.id===el.dataset.id);if(!t)return; t.google=true; save(); window.open(createGoogleUrl(t),'_blank'); render();}
function createTaskReminder(el){const t=state.tasks.find(x=>x.id===el.dataset.id);if(!t)return; t.reminder=t.reminder||`${t.date||today()}T${t.time||'09:00'}`; save(); render(); toast('Напоминание создано')}
function ensureGoalTask(g,saveNow=true){if(!g?.id)return;const exists=state.tasks.some(t=>t.goalId===g.id&&t.status!=='Готово');if(!exists){state.tasks.unshift({id:uid(),goalId:g.id,title:`Шаг недели: ${g.note||g.title}`,area:g.area||'Цели',date:today(),time:'09:00',priority:'B',status:'Активно',google:false,reminder:''});if(saveNow)save()}}
function createGoalWeeklyTask(el){const g=state.goals.find(x=>x.id===el.dataset.id);ensureGoalTask(g,true);render();toast('Активная задача недели создана')}
function addFinancialGoal(){openRecordForm('goal');setTimeout(()=>{if($('#f_kind'))$('#f_kind').value='Финансовая';if($('#f_area'))$('#f_area').value='Финансы'},0)}
function dedupePurchases(){const before=state.purchases.length;state.purchases=dedupeBy(state.purchases,x=>`${String(x.title).toLowerCase()}|${num(x.amount)}|${x.date}|${String(x.note||'').toLowerCase()}`);save();render();toast(`Удалено дублей: ${before-state.purchases.length}`)}
async function importBankCsv(){const f=$('#csvFile')?.files?.[0];if(!f)return toast('Выбери CSV файл');const text=await f.text();const lines=text.split(/\r?\n/).filter(Boolean);let added=0,dups=0;const keys=new Set(state.operations.map(o=>`${o.date}|${o.type}|${num(o.amount)}|${o.category}|${o.note}`));for(const line of lines){const cols=line.split(/[;,]/).map(x=>x.trim().replace(/^"|"$/g,''));if(cols.length<3)continue;let [date,a,b,c]=cols;let amount=num(a),type=amount<0?'expense':'income';if(!amount){amount=num(b);type=(a||'').toLowerCase().includes('доход')?'income':'expense'}const op={id:uid(),date:/\d{4}-\d{2}-\d{2}/.test(date)?date:today(),type,amount:Math.abs(amount),category:c||b||'Банк',note:cols.slice(3).join(' ')||'Импорт банка'};const k=`${op.date}|${op.type}|${num(op.amount)}|${op.category}|${op.note}`;if(keys.has(k)){dups++;continue}keys.add(k);state.operations.unshift(op);added++;}state.settings.lastCsvAdded=added;state.settings.lastCsvDuplicates=dups;save();render();toast(`Импорт: добавлено ${added}, дублей ${dups}`)}
function renameSection(el){const id=el.dataset.id;openModal('Переименовать папку',`<div class="field"><label>Новое название</label><input id="folderName" value="${esc(label(id))}"></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-action="saveSectionName" data-id="${id}">Сохранить</button></div>`)}
function saveSectionName(el){state.settings.folderNames=state.settings.folderNames||{};state.settings.folderNames[el.dataset.id]=$('#folderName').value||label(el.dataset.id);save();closeModal();render()}
function hideSection(el){const id=el.dataset.id;if(id==='dashboard')return toast('Обзор нельзя скрыть');state.settings.hiddenSections=[...(state.settings.hiddenSections||[]),id];if(page===id)page='dashboard';save();render()}
function openAddFolder(){toast('Пользовательские папки добавим следующим этапом')}
function openProfileTools(){openModal('Профиль, импорт и сервис',`<div class="grid cols-2"><button class="ghost-btn" data-action="exportData">Экспорт данных</button><button class="ghost-btn" data-action="restoreSections">Показать все папки</button><button class="ghost-btn" data-action="clearCache">Очистить кэш</button><button class="ghost-btn" data-action="setActualBalance">Фактический остаток</button></div><div class="csv-import-box" style="margin-top:14px"><h3>Импорт CSV банка</h3><p class="small muted">Дубли удаляются автоматически.</p><input type="file" id="csvFile" accept=".csv,text/csv"><div class="row-actions" style="margin-top:10px"><button class="btn" data-action="importBankCsv">Импортировать CSV</button></div></div><p class="small muted" style="margin-top:12px">Сборка: ${BUILD}</p>`)}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`second-brain-os-${today()}.json`;a.click();URL.revokeObjectURL(a.href)}
function restoreSections(){state.settings.hiddenSections=[];save();closeModal();render()}
async function clearCache(){try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}toast('Кэш очищен')}catch(e){toast('Не удалось очистить кэш')}}
function render(){state=normalize(state);save();const map={dashboard,finance:financePage,debts:debtsPage,tasks:tasksPage,planning:planningPage,purchases:purchasesPage,wishes:wishesPage,notes:notesPage,ideas:ideasPage,people:peoplePage,habits:habitsPage,goals:goalsPage,documents:documentsPage,books:booksPage,films:filmsPage,trips:tripsPage,personal:personalPage,archive:archivePage};renderShell((map[page]||dashboard)())}
/* V30: stable click router. It handles known buttons and lets later module routers handle their own actions. */
window.addEventListener('click',e=>{
 const goEl=e.target.closest('[data-go]');
 const act=e.target.closest('[data-action]');
 if(act){
   const actions={
    closeModal:()=>closeModal(),
    openQuick:()=>openQuick(),
    openRecordForm:()=>openRecordForm(act.dataset.type,act.dataset.id),
    editRecord:()=>openRecordForm(act.dataset.type,act.dataset.id),
    saveRecord:()=>saveRecord(act),
    deleteRecord:()=>deleteRecord(act),
    openDebtOut:()=>openDebtOut(),
    openDebtIn:()=>openDebtIn(),
    closeDebt:()=>closeDebt(act),
    debtReminder:()=>debtReminder(act),
    toggleHabitDay:()=>toggleHabitDay(act),
    setHabitRange:()=>setHabitRange(act),
    setPlanningFolder:()=>setPlanningFolder(act),
    setFinancePeriod:()=>setFinancePeriod(act),
    setActualBalance:()=>setActualBalance(),
    saveActualBalance:()=>saveActualBalance(),
    googleTask:()=>googleTask(act),
    createTaskReminder:()=>createTaskReminder(act),
    createGoalWeeklyTask:()=>createGoalWeeklyTask(act),
    addFinancialGoal:()=>addFinancialGoal(),
    dedupePurchases:()=>dedupePurchases(),
    importBankCsv:()=>importBankCsv(),
    capture:()=>capture(act),
    renameSection:()=>renameSection(act),
    saveSectionName:()=>saveSectionName(act),
    hideSection:()=>hideSection(act),
    openAddFolder:()=>openAddFolder(),
    openProfileTools:()=>openProfileTools(),
    exportData:()=>exportData(),
    restoreSections:()=>restoreSections(),
    clearCache:()=>clearCache()
   };
   const fn=actions[act.dataset.action];
   if(fn){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    try{return fn()}catch(err){console.error(err);toast('Ошибка кнопки: '+(err.message||err));return}
   }
   // Unknown module action: do not block it. Calendar/Polina/module-specific routers handle it below.
 }
 if(goEl){
   e.preventDefault();
   e.stopPropagation();
   e.stopImmediatePropagation();
   return go(goEl.dataset.go);
 }
},true);

try{document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',BUILD);render()}catch(e){document.body.innerHTML='<pre style="padding:24px">Ошибка Second Brain OS\n'+String(e.stack||e)+'</pre>';throw e}


/* ===== V25 final fixes: planning folders, stable sidebar, dedupe, finance explanations ===== */
function normalize(raw){
 const b=defaults();
 const s=raw&&typeof raw==='object'?raw:{};
 const m={...b,...s,settings:{...b.settings,...(s.settings||{})}};
 ['operations','debts','tasks','purchases','wishes','notes','ideas','people','habits','goals','documents','books','films','trips','personal','archive','folders'].forEach(k=>{
   m[k]=Array.isArray(m[k])?m[k]:b[k];
 });
 if(Array.isArray(s.plannedPurchases)&&s.plannedPurchases.length){
   m.purchases=[...m.purchases,...s.plannedPurchases.map(x=>({id:x.id||uid(),title:x.title||'Покупка',amount:num(x.amount),date:x.date||((x.month||month())+'-15'),url:x.url||'',image:x.image||'',area:x.area||x.category||'Личное',includeInBudget:x.includeInBudget!==false,note:x.note||''}))];
 }
 if(Array.isArray(s.wants)&&s.wants.length){
   m.wishes=[...m.wishes,...s.wants.map(x=>({...x,id:x.id||uid(),note:(x.note||'')+' · перенесено из хотелок'}))];
 }
 delete m.plannedPurchases;
 delete m.wants;
 m.purchases=dedupeBy(m.purchases.map(x=>({...x,id:x.id||uid(),title:x.title||'Покупка',amount:num(x.amount),date:x.date||today(),area:x.area||'Личное',includeInBudget:x.includeInBudget!==false,url:x.url||'',image:x.image||'',note:x.note||''})),x=>`${String(x.title).trim().toLowerCase()}|${num(x.amount)}`);
 m.wishes=dedupeBy(m.wishes.map(x=>({...x,id:x.id||uid(),title:x.title||'Желание',amount:num(x.amount),date:x.date||today(),area:x.area||'Личное',includeInBudget:x.includeInBudget===true,url:x.url||'',image:x.image||'',note:x.note||''})),x=>`${String(x.title).trim().toLowerCase()}|${num(x.amount)}|${String(x.area||'').trim().toLowerCase()}`);
 m.ideas=dedupeBy(m.ideas.map(x=>({...x,id:x.id||uid(),title:x.title||'Идея',date:x.date||today(),text:x.text||x.note||''})),x=>`${String(x.title).trim().toLowerCase()}|${String(x.text||'').trim().toLowerCase()}`);
 m.notes=dedupeBy(m.notes.map(x=>({...x,id:x.id||uid(),title:x.title||'Заметка',date:x.date||today(),text:x.text||x.note||'',folder:x.folder||'Личное'})),x=>`${String(x.title).trim().toLowerCase()}|${String(x.text||'').trim().toLowerCase()}`);
 m.debts=m.debts.map(d=>({...d,id:d.id||uid(),direction:d.direction==='incoming'||d.direction==='in'?'in':'out',status:d.status||'Ожидает'}));
 m.tasks=m.tasks.map(t=>({...t,id:t.id||uid(),date:t.date||t.due||today(),status:t.status||'Активно',priority:t.priority||'B',google:Boolean(t.google),reminder:t.reminder||''}));
 m.habits=m.habits.map(h=>({...h,id:h.id||uid(),name:h.name||h.title||'Привычка',icon:h.icon||'✓',color:h.color||'#2563eb',marks:h.marks||{}}));
 m.goals=m.goals.map(g=>({...g,id:g.id||uid(),kind:g.kind||(/финанс|доход|руб|₽|подуш/i.test((g.title||'')+(g.area||''))?'Финансовая':'Личная'),target:num(g.target||g.targetValue),current:num(g.current||g.currentValue),note:g.note||g.nextAction||g.week52||''}));
 m.books=m.books.map(b=>({...b,id:b.id||uid(),image:b.image||b.cover||'',url:b.url||b.link||'',quotes:Array.isArray(b.quotes)?b.quotes.join('\n'):(b.quotes||''),note:b.note||b.insight||''}));
 m.films=[...m.films,...asArray(s.media).map(x=>({id:x.id||uid(),title:x.title||'Фильм',type:x.type||'Фильм',status:x.status||'',image:x.image||x.cover||'',url:x.url||x.link||x.trailer||'',note:x.note||''}))];
 m.films=dedupeBy(m.films.map(x=>({...x,id:x.id||uid(),title:x.title||'Фильм',image:x.image||'',url:x.url||'',note:x.note||''})),x=>`${String(x.title).trim().toLowerCase()}|${String(x.url||'').trim().toLowerCase()}`);
 const polina=m.people.find(p=>/полина/i.test(p.name||''));
 if(polina){polina.likes=polina.likes||'море, кофе, украшения, спокойствие';polina.talkIdeas=polina.talkIdeas||'Как прошёл день? Что сейчас радует? Как могу поддержать?';polina.gifts=polina.gifts||'украшение, сертификат, мини-путешествие';polina.notes=polina.notes||'Важный человек. Хранить предпочтения, даты, подарки и темы разговоров.'}
 return m;
}

function renderShell(content){
 const oldSide=$('.side');
 const oldScroll=oldSide?oldSide.scrollTop:Number(sessionStorage.getItem('sbosSideScroll')||0);
 $('#app').innerHTML=`<div class="app"><aside class="side"><div class="brand"><div class="brand-left"><div class="brand-logo">🧠</div><div><div class="brand-title">Second Brain OS</div><div class="brand-sub">пространство второго мозга</div></div></div><button class="tiny-icon" data-action="openProfileTools">⌄</button></div><div class="search"><span>⌕</span><input id="sideSearch" placeholder="Поиск"><span class="small">⌘K</span></div>${navHtml()}<div class="side-card"><b>Шаблоны и ресурсы</b><p class="small muted">Готовые шаблоны для разных сфер жизни</p><button class="ghost-btn" data-action="openQuick">＋ Быстрое создание</button></div></aside><main class="main"><header class="topbar"><div class="search global-search"><span>⌕</span><input id="globalSearch" placeholder="Поиск по задачам, проектам, заметкам, финансам..."><span class="small">⌘ K</span></div><div class="top-actions"><button class="ghost-btn" data-action="openQuick">＋ Создать</button><button class="ghost-btn" data-action="openProfileTools">Импорт</button><button class="icon-btn" data-action="openProfileTools">⚙</button><button class="icon-btn">🔔</button><div class="row" style="padding:6px 10px;border-radius:16px"><div class="avatar" style="width:32px;height:32px">А</div><div><b>${esc(state.settings.name||'Алексей')}</b><div class="small muted">${esc(state.settings.subtitle||'Фокус и ясность')}</div></div></div></div></header><section id="view">${content}</section></main><button class="mobile-fab" data-action="openQuick">＋</button><nav class="bottom-nav">${MOBILE.map(([id,ico,l])=>`<button class="${page===id?'active':''}" data-go="${id}"><span>${ico}</span>${l}</button>`).join('')}</nav><div class="version">V25 · ПЛАНИРОВАНИЕ + ФИНАНСЫ + ДУБЛИ</div></div>`;
 const side=$('.side');
 if(side){side.scrollTop=oldScroll;side.addEventListener('scroll',()=>sessionStorage.setItem('sbosSideScroll',side.scrollTop),{passive:true});}
}

function planningPage(){return layout('Планирование','Папки слева как в Notion: фокус, сферы, приоритеты, сроки, покупки и желания.',`<section class="folder-space"><aside class="folder-pane">${[['focus','Фокус дня','🎯',todayTasks().length],['areas','Папки сфер','📁',new Set(state.tasks.map(t=>t.area||'Личное')).size],['priorities','Приоритеты','🚩',state.tasks.length],['deadlines','Сроки','🗓️',state.tasks.filter(t=>t.date).length],['purchases','Покупки','🛒',state.purchases.length],['wishes','Желания','💗',state.wishes.length]].map(([id,n,ico,c])=>`<button class="folder-item ${state.settings.planningFolder===id?'active':''}" data-action="setPlanningFolder" data-id="${id}"><span class="avatar">${ico}</span><span><b>${n}</b><div class="small muted">${c} записей</div></span><span>›</span></button>`).join('')}</aside><main class="folder-main">${planningContent()}</main></section>`)}
function planningTaskRow(t){return `<div class="row"><div class="avatar">${t.google?'📅':'✓'}</div><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${fmt(t.date)} · ${esc(t.time||'без времени')} · ${esc(t.area||'Личное')} · ${({A:'Срочно/важно',B:'Важно',C:'Срочно',D:'Позже'})[t.priority]||'Важно'}</div></div><div class="row-actions"><button class="mini blue" data-action="editRecord" data-type="task" data-id="${t.id}">Ред.</button><button class="mini red" data-action="deleteRecord" data-type="task" data-id="${t.id}">Удалить</button></div></div>`}
function planningContent(){
 const f=state.settings.planningFolder||'focus';
 if(f==='purchases')return `<section class="card"><div class="card-head"><h3>Покупки</h3><div class="row-actions"><button class="ghost-btn" data-action="dedupePurchases">Удалить дубли</button><button class="btn" data-action="openRecordForm" data-type="purchase">＋ Добавить</button></div></div><section class="purchase-month-grid">${purchaseGroupsHtml()}</section></section>`;
 if(f==='wishes')return `<section class="card"><div class="card-head"><h3>Желания</h3><button class="btn" data-action="openRecordForm" data-type="wish">＋ Добавить</button></div><div class="record-grid">${state.wishes.map(x=>purchaseCard(x,'wish')).join('')||empty('Желаний пока нет')}</div></section>`;
 if(f==='areas')return planningAreasContent();
 if(f==='priorities')return planningPrioritiesContent();
 if(f==='deadlines')return planningDeadlinesContent();
 return planningFocusContent();
}
function planningFocusContent(){const list=state.tasks.filter(t=>t.status!=='Готово'&&t.date===today());const upcoming=state.purchases.filter(x=>x.includeInBudget!==false&&x.date>=today()).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,4);return `<section class="grid cols-2"><article class="card"><div class="card-head"><h3>Фокус дня</h3><button class="btn" data-action="openRecordForm" data-type="task">＋ Задача</button></div><div class="list">${list.map(planningTaskRow).join('')||empty('На сегодня задач нет')}</div></article><article class="card"><div class="card-head"><h3>Ближайшие покупки в бюджете</h3><button class="ghost-btn" data-action="openRecordForm" data-type="purchase">＋ Покупка</button></div><div class="list">${upcoming.map(x=>purchaseCard(x,'purchase')).join('')||empty('Покупок на ближайшие даты нет')}</div></article></section>`}
function planningAreasContent(){const areas=[...new Set([...state.tasks.map(x=>x.area||'Личное'),...state.purchases.map(x=>x.area||'Личное'),...state.wishes.map(x=>x.area||'Личное')])].sort((a,b)=>a.localeCompare(b,'ru'));return `<section class="grid cols-2">${areas.map(area=>{const ts=state.tasks.filter(t=>(t.area||'Личное')===area);const ps=state.purchases.filter(x=>(x.area||'Личное')===area);const ws=state.wishes.filter(x=>(x.area||'Личное')===area);return `<article class="card"><div class="card-head"><h3>${esc(area)}</h3><span class="pill blue">${ts.length+ps.length+ws.length}</span></div><div class="list">${ts.slice(0,3).map(planningTaskRow).join('')}${ps.slice(0,2).map(x=>purchaseCard(x,'purchase')).join('')}${ws.slice(0,2).map(x=>purchaseCard(x,'wish')).join('')||empty('Пока пусто')}</div></article>`}).join('')||empty('Папок сфер пока нет')}</section>`}
function planningPrioritiesContent(){const cells=[['A','Срочно / важно','red'],['B','Важно','blue'],['C','Срочно','amber'],['D','Позже','green']];return `<section class="grid cols-2">${cells.map(([p,title,color])=>{const arr=state.tasks.filter(t=>(t.priority||'B')===p);return `<article class="card"><div class="card-head"><h3>${title}</h3><span class="pill ${color}">${arr.length}</span></div><div class="list">${arr.map(planningTaskRow).join('')||empty('Нет задач')}</div></article>`}).join('')}</section>`}
function planningDeadlinesContent(){const groups={today:[],week:[],later:[],nodate:[]};const weekEnd=iso(addDays(new Date(),7));state.tasks.forEach(t=>{if(!t.date)groups.nodate.push(t);else if(t.date===today())groups.today.push(t);else if(t.date<=weekEnd)groups.week.push(t);else groups.later.push(t)});const title={today:'Сегодня',week:'На неделе',later:'Позже',nodate:'Без даты'};return `<section class="grid cols-2">${Object.entries(groups).map(([k,arr])=>`<article class="card"><div class="card-head"><h3>${title[k]}</h3><span class="pill blue">${arr.length}</span></div><div class="list">${arr.map(planningTaskRow).join('')||empty('Пусто')}</div></article>`).join('')}<article class="card"><div class="card-head"><h3>Покупки по датам</h3><button class="ghost-btn" data-action="openRecordForm" data-type="purchase">＋</button></div><div class="list">${state.purchases.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,8).map(x=>purchaseCard(x,'purchase')).join('')||empty('Покупок нет')}</div></article></section>`}

function purchaseKey(x){return `${String(x.title||'').trim().toLowerCase()}|${num(x.amount)}`}
function dedupePurchases(){const before=state.purchases.length;state.purchases=dedupeBy(state.purchases,purchaseKey);delete state.plannedPurchases;save();render();toast(`Удалено дублей: ${before-state.purchases.length}`)}
function purchaseGroupsHtml(){const g={};state.purchases.forEach(x=>{const m=(x.date||today()).slice(0,7);(g[m]||(g[m]=[])).push(x)});return Object.entries(g).sort().map(([m,arr])=>`<article class="planned-month-card"><div class="card-head"><div><h3>${m}</h3><p class="small muted">${arr.length} покупок · в бюджет ${money(total(arr.filter(x=>x.includeInBudget!==false)))}</p></div></div>${arr.map(x=>purchaseCard(x,'purchase')).join('')}</article>`).join('')||empty('Пока пусто')}
function purchasesPage(){return layout('Покупки','Покупки с датой, URL, картинкой и флагом бюджета. Дубли удаляются автоматически.',`<section class="card"><div class="card-head"><h3>План покупок по месяцам</h3><div class="row-actions"><button class="ghost-btn" data-action="dedupePurchases">Удалить дубли</button><button class="btn" data-action="openRecordForm" data-type="purchase">＋ Добавить</button></div></div><section class="purchase-month-grid">${purchaseGroupsHtml()}</section></section>`)}

function periodInfo(kind=state.settings.financePeriod||'month'){const base=new Date(today());let s,e,title;if(kind==='last'){s=new Date(base.getFullYear(),base.getMonth()-1,1);e=new Date(base.getFullYear(),base.getMonth(),0);title='прошлый месяц'}else if(kind==='next'){s=new Date(base.getFullYear(),base.getMonth()+1,1);e=new Date(base.getFullYear(),base.getMonth()+2,0);title='будущий месяц'}else if(kind==='quarter'){s=new Date(base.getFullYear(),base.getMonth(),1);e=new Date(base.getFullYear(),base.getMonth()+3,0);title='3 месяца'}else if(kind==='year'){s=new Date(base.getFullYear(),0,1);e=new Date(base.getFullYear(),11,31);title='год'}else{s=new Date(base.getFullYear(),base.getMonth(),1);e=new Date(base.getFullYear(),base.getMonth()+1,0);title='текущий месяц';kind='month'}return{key:kind,start:iso(s),end:iso(e),title}}
function financeTotals(p){const ops=state.operations.filter(o=>inPeriod(o.date,p));const inc=total(ops.filter(o=>o.type==='income'));const exp=total(ops.filter(o=>o.type==='expense'));const planned=total(state.purchases.filter(x=>x.includeInBudget!==false&&inPeriod(x.date,p)));const upcoming=total(state.purchases.filter(x=>x.includeInBudget!==false&&x.date>=today()&&x.date<=p.end));return{inc,exp,planned,upcoming,net:inc-exp-planned,netWithUpcoming:state.settings.currentBalance+inc-exp-upcoming}}
function incomeExplain(p){const rows=state.operations.filter(o=>o.type==='income'&&inPeriod(o.date,p));return `<details class="drawer" open><summary>Откуда доходы ${money(total(rows))}</summary><div class="list" style="margin-top:10px">${rows.map(o=>`<div class="row"><div class="avatar">＋</div><div><div class="row-title">${money(o.amount)} · ${esc(o.category||'Доход')}</div><div class="row-sub">${fmt(o.date)} · ${esc(o.note||'без комментария')}</div></div><div class="row-actions"><button class="mini blue" data-action="editRecord" data-type="operation" data-id="${o.id}">Ред.</button><button class="mini red" data-action="deleteRecord" data-type="operation" data-id="${o.id}">Удалить</button></div></div>`).join('')||empty('Доходов за период нет')}</div></details>`}
function forecastBlock(p,t){const days=Math.max(1,(new Date(p.end)-new Date(p.start))/86400000+1);const avg=t.exp/days;return `<div class="forecast-list"><div class="row"><div>Средний расход в день</div><b>${money(avg)}</b></div><div class="row"><div>Плановые покупки выбранного периода</div><b>${money(t.planned)}</b></div><div class="row"><div>Ближайшие покупки до ${fmt(p.end)}</div><b class="amber">${money(t.upcoming)}</b></div><div class="row"><div>Прогноз расходов</div><b class="red">${money(t.exp+t.upcoming)}</b></div><div class="row"><div>Прогноз остатка с фактом</div><b class="${t.netWithUpcoming<0?'red':'green'}">${money(t.netWithUpcoming)}</b></div></div>`}
function financePage(){const p=periodInfo();const t=financeTotals(p);const out=activeDebts().filter(d=>d.direction==='out'),inn=activeDebts().filter(d=>d.direction==='in');return layout('Финансы','Аналитика по периодам, графики, прогноз и плановые покупки будущих месяцев.',`<section class="finance-tabs">${[['month','Текущий месяц'],['last','Прошлый'],['next','Будущий месяц'],['quarter','3 месяца'],['year','Год']].map(([k,l])=>`<button class="chip-btn ${p.key===k?'active':''}" data-action="setFinancePeriod" data-period="${k}">${l}</button>`).join('')}</section><section class="grid cols-4"><article class="card"><h3>Фактический остаток</h3><div class="value sm blue">${money(state.settings.currentBalance)}</div><button class="ghost-btn" data-action="setActualBalance">Проставить остаток</button></article><article class="card"><h3>Доходы · ${p.title}</h3><div class="value sm green">${money(t.inc)}</div><p class="small muted">Нажми ниже «Откуда доходы», чтобы проверить источник суммы.</p></article><article class="card"><h3>Расходы · ${p.title}</h3><div class="value sm red">${money(t.exp)}</div></article><article class="card"><h3>Прогноз остатка</h3><div class="value sm ${t.netWithUpcoming<0?'red':'green'}">${money(t.netWithUpcoming)}</div><p class="small muted">факт + доходы − расходы − ближайшие покупки</p></article></section><section class="grid cols-2" style="margin-top:16px"><article class="card"><div class="card-head"><h3>График доходов/расходов</h3><span class="pill blue">${fmt(p.start)} — ${fmt(p.end)}</span></div>${financeChart(p)}</article><article class="card"><div class="card-head"><h3>Прогноз и контроль</h3><span class="pill green">план</span></div>${forecastBlock(p,t)}</article></section><section class="grid cols-2" style="margin-top:16px"><article class="card"><div class="card-head"><h3>Категории расходов</h3><button class="ghost-btn" data-action="openRecordForm" data-type="operation">＋ Операция</button></div>${categoryBreakdown(p)}${incomeExplain(p)}</article><article class="card"><div class="card-head"><h3>Импорт CSV банка</h3><span class="pill blue">дубли удаляются</span></div><p class="small muted">Одинаковые строки по дате, типу, сумме, категории и комментарию будут пропущены.</p><input type="file" id="csvFile" accept=".csv,text/csv"><div class="row-actions" style="margin-top:10px"><button class="btn" data-action="importBankCsv">Импортировать CSV</button></div><p class="small muted">Последний импорт: добавлено ${state.settings.lastCsvAdded||0}, дублей удалено ${state.settings.lastCsvDuplicates||0}</p><div class="grid cols-2"><div class="card"><h3>Я должен</h3><div class="value sm red">${money(total(out))}</div></div><div class="card"><h3>Мне должны</h3><div class="value sm green">${money(total(inn))}</div></div></div></article></section><section class="card" style="margin-top:16px"><div class="card-head"><div><h3>Плановые покупки по месяцам</h3><p class="small muted">Покупка учитывается в бюджете того месяца, где стоит её дата. Для прогноза также считаются ближайшие покупки до конца выбранного периода.</p></div><button class="btn" data-action="openRecordForm" data-type="purchase">＋ Добавить покупку</button></div>${plannedMonthBlock(p)}</section>`)}

function deleteRecord(el){const type=el.dataset.type,id=el.dataset.id,s=schemas[type];if(!s)return;state[s.arr]=state[s.arr].filter(x=>x.id!==id);if(type==='purchase')delete state.plannedPurchases;if(type==='wish')delete state.wants;save();closeModal();render();toast('Удалено')}
function render(){state=normalize(state);if(state.purchases.length>1)state.purchases=dedupeBy(state.purchases,purchaseKey);save();const map={dashboard,finance:financePage,debts:debtsPage,tasks:tasksPage,planning:planningPage,purchases:purchasesPage,wishes:wishesPage,notes:notesPage,ideas:ideasPage,people:peoplePage,habits:habitsPage,goals:goalsPage,documents:documentsPage,books:booksPage,films:filmsPage,trips:tripsPage,personal:personalPage,archive:archivePage};renderShell((map[page]||dashboard)())}

try{state=normalize(state);delete state.plannedPurchases;delete state.wants;state.purchases=dedupeBy(state.purchases,purchaseKey);save();render()}catch(e){console.error(e)}


/* ===== V26 Polina personal calendar: cycle forecast + good/bad days, no medical advice ===== */
(function(){
  const V26_LABEL='V26 · ПОЛИНА · КАЛЕНДАРЬ И ОТКЛИК';
  try{ localStorage.setItem('secondBrainOS.currentBuild','second-brain-space-v26-polina-cycle-calendar-20260701'); }catch(e){}

  if(Array.isArray(SECTIONS) && !SECTIONS.some(s=>s.id==='polina')){
    const idx=SECTIONS.findIndex(s=>s.id==='personal');
    SECTIONS.splice(idx>=0?idx+1:SECTIONS.length,0,{id:'polina',label:'Полина',icon:'🌸',color:'#ec4899',group:'ЛИЧНОЕ'});
  }

  function ensurePolinaStyles(){
    if(document.getElementById('polina-v26-style')) return;
    const st=document.createElement('style');
    st.id='polina-v26-style';
    st.textContent=`
      .polina-hero-card{background:linear-gradient(135deg,#fff,#fff7fb);border-color:#fbcfe8}
      .polina-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px}
      .polina-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
      .polina-weekday{font-size:12px;font-weight:900;color:#64748b;text-align:center;padding:7px 0}
      .polina-day{min-height:112px;border:1px solid #e7edf6;background:#fff;border-radius:20px;padding:10px;display:flex;flex-direction:column;gap:6px;text-align:left;box-shadow:0 8px 22px rgba(15,23,42,.035);transition:.18s ease;position:relative;overflow:hidden}
      .polina-day:hover{transform:translateY(-1px);border-color:#bfdbfe;box-shadow:0 15px 35px rgba(15,23,42,.07)}
      .polina-day.empty{opacity:.38;background:#f8fbff;box-shadow:none;cursor:default}
      .polina-day.today{outline:2px solid #2563eb;outline-offset:-2px}
      .polina-day.predicted{background:linear-gradient(135deg,#fff1f2,#fff7fb);border-color:#fecdd3}
      .polina-day.period{background:linear-gradient(135deg,#ffe4e6,#fff1f2);border-color:#fb7185}
      .polina-day.good{background:linear-gradient(135deg,#ecfdf5,#f8fffb);border-color:#86efac}
      .polina-day.bad{background:linear-gradient(135deg,#fff1f2,#fff7f7);border-color:#fca5a5}
      .polina-day.neutral{background:linear-gradient(135deg,#f8fbff,#fff);border-color:#bfdbfe}
      .polina-day-num{font-weight:900;color:#0f172a;font-size:14px}
      .polina-day-note{font-size:11px;color:#64748b;line-height:1.25;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
      .polina-chip-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:auto}
      .polina-chip{font-size:10px;font-weight:900;padding:4px 7px;border-radius:999px;border:1px solid #e5eaf2;background:#fff;color:#475569}
      .polina-chip.predicted{background:#fff1f2;border-color:#fecdd3;color:#e11d48}
      .polina-chip.period{background:#ffe4e6;border-color:#fb7185;color:#be123c}
      .polina-chip.good{background:#dcfce7;border-color:#86efac;color:#15803d}
      .polina-chip.bad{background:#fee2e2;border-color:#fca5a5;color:#dc2626}
      .polina-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
      .polina-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .polina-dot{width:10px;height:10px;border-radius:999px;display:inline-block;margin-right:6px;vertical-align:middle}
      .polina-timeline{display:grid;gap:10px}
      .polina-note{border:1px dashed #fecdd3;background:#fff7fb;color:#9f1239;border-radius:18px;padding:12px;font-size:13px;line-height:1.45}
      @media(max-width:1180px){.polina-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.polina-day{min-height:96px}}
      @media(max-width:760px){.polina-kpi{grid-template-columns:1fr}.polina-calendar{gap:5px}.polina-day{min-height:80px;border-radius:14px;padding:7px}.polina-day-note{display:none}.polina-chip{font-size:9px;padding:3px 5px}}
    `;
    document.head.appendChild(st);
  }

  const previousNormalize = normalize;
  normalize = function(raw){
    const m=previousNormalize(raw);
    m.settings=m.settings||{};
    m.settings.polinaCycle={lastStart:'',cycleLength:28,duration:5,...(m.settings.polinaCycle||{})};
    m.settings.polinaMonth=m.settings.polinaMonth||month();
    if(!Array.isArray(m.polinaDays)) m.polinaDays=[];
    m.polinaDays=dedupeBy(m.polinaDays.map(x=>({id:x.id||uid(),date:x.date||today(),mood:x.mood||'neutral',comment:x.comment||x.note||''})),x=>`${x.date}|${x.mood}|${String(x.comment||'').trim().toLowerCase()}`)
      .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    return m;
  };

  function parseLocalDate(key){ const [y,m,d]=String(key).split('-').map(Number); return new Date(y,(m||1)-1,d||1); }
  function monthTitle(key){ const [y,m]=String(key).split('-').map(Number); return new Date(y,(m||1)-1,1).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}); }
  function shiftMonthKey(key,delta){ const [y,m]=String(key).split('-').map(Number); const d=new Date(y,(m||1)-1+delta,1); return month(d); }
  function datesInMonth(key){ const [y,m]=String(key).split('-').map(Number); const count=new Date(y,m,0).getDate(); return Array.from({length:count},(_,i)=>`${y}-${String(m).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`); }
  function dayDiff(a,b){ return Math.floor((parseLocalDate(b)-parseLocalDate(a))/86400000); }
  function cycleSettings(){ const c=state.settings.polinaCycle||{}; return {lastStart:c.lastStart||'',cycleLength:Math.max(20,num(c.cycleLength)||28),duration:Math.max(1,Math.min(10,num(c.duration)||5))}; }
  function isPredictedPeriod(date){ const c=cycleSettings(); if(!c.lastStart) return false; const diff=dayDiff(c.lastStart,date); if(diff<0) return false; const rem=diff % c.cycleLength; return rem>=0 && rem<c.duration; }
  function nextPredictedStart(){ const c=cycleSettings(); if(!c.lastStart) return ''; let d=parseLocalDate(c.lastStart); const now=parseLocalDate(today()); while(d<now) d=addDays(d,c.cycleLength); return iso(d); }
  function dayEntry(date){ return (state.polinaDays||[]).find(x=>x.date===date); }
  function moodTitle(mood){ return ({good:'Хороший день',bad:'Плохой день',neutral:'Нейтрально',period_start:'Начался период',period:'Месячные',period_end:'Период закончился'})[mood]||'Отклик'; }
  function moodClass(mood){ return ({good:'good',bad:'bad',neutral:'neutral',period_start:'period',period:'period',period_end:'period'})[mood]||''; }
  function polinaStats(){
    const c=cycleSettings(), next=nextPredictedStart();
    const good=state.polinaDays.filter(x=>x.mood==='good').length;
    const bad=state.polinaDays.filter(x=>x.mood==='bad').length;
    const last=state.polinaDays[0];
    return {c,next,good,bad,last};
  }
  function polinaPage(){
    ensurePolinaStyles();
    const stats=polinaStats(), mk=state.settings.polinaMonth||month();
    const days=datesInMonth(mk);
    const first=parseLocalDate(`${mk}-01`).getDay();
    const blanks=(first+6)%7;
    const cells=[...Array(blanks).fill(null),...days];
    const weeks=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    return layout('Полина','Личный раздел для бережного отклика: хорошие/плохие дни, комментарии и ориентировочный прогноз месячных от прошлого периода.',`
      <section class="polina-kpi">
        <article class="card polina-hero-card"><h3>Последний период</h3><div class="value sm">${stats.c.lastStart?fmt(stats.c.lastStart):'не указан'}</div><p class="small muted">можно изменить в настройках</p></article>
        <article class="card"><h3>Следующий прогноз</h3><div class="value sm ${stats.next?'red':''}">${stats.next?fmt(stats.next):'—'}</div><p class="small muted">ориентировочно, не медицинский прогноз</p></article>
        <article class="card"><h3>Хорошие дни</h3><div class="value sm green">${stats.good}</div><p class="small muted">отмечены зелёным</p></article>
        <article class="card"><h3>Плохие дни</h3><div class="value sm red">${stats.bad}</div><p class="small muted">отмечены красным</p></article>
      </section>
      <section class="grid cols-2">
        <article class="card" style="grid-column:span 2">
          <div class="polina-toolbar">
            <div><h3>Календарь Полины · ${esc(monthTitle(mk))}</h3><p class="small muted">Нажимай на день, чтобы поставить хороший/плохой день и короткий комментарий.</p></div>
            <div class="row-actions"><button class="ghost-btn" onclick="setPolinaMonth(-1)">← Месяц</button><button class="ghost-btn" onclick="setPolinaMonth(0)">Сегодня</button><button class="ghost-btn" onclick="setPolinaMonth(1)">Месяц →</button><button class="btn" onclick="openPolinaCycle()">Настроить цикл</button></div>
          </div>
          <div class="polina-calendar">${weeks.map(w=>`<div class="polina-weekday">${w}</div>`).join('')}${cells.map(date=>polinaDayCell(date)).join('')}</div>
          <div class="polina-legend"><span class="small muted"><i class="polina-dot" style="background:#fecdd3"></i>прогноз месячных</span><span class="small muted"><i class="polina-dot" style="background:#86efac"></i>хороший день</span><span class="small muted"><i class="polina-dot" style="background:#fca5a5"></i>плохой день</span><span class="small muted"><i class="polina-dot" style="background:#fb7185"></i>фактический период</span></div>
        </article>
      </section>
      <section class="grid cols-2" style="margin-top:16px">
        <article class="card"><div class="card-head"><h3>Отклик по дням</h3><button class="btn" onclick="openPolinaDay('${today()}')">＋ Отметить сегодня</button></div><div class="polina-timeline">${polinaTimeline()}</div></article>
        <article class="card"><h3>Как использовать папку</h3><div class="polina-note">Эта папка — не медицинская диагностика, а личный календарь заботы. Отмечай настроение дня Полины, короткий комментарий, начало/дни периода и смотри ориентировочный прогноз следующего периода от прошлой даты. Красные дни — тяжёлые, зелёные — хорошие, розовые — прогноз месячных.</div><div class="actions"><button class="ghost-btn" onclick="markPolinaPeriodStart()">Отметить начало периода сегодня</button><button class="ghost-btn" onclick="openPolinaCycle()">Изменить прошлый период</button></div></article>
      </section>`);
  }
  function polinaDayCell(date){
    if(!date) return `<div class="polina-day empty"></div>`;
    const e=dayEntry(date), predicted=isPredictedPeriod(date);
    const cls=[date===today()?'today':'',predicted?'predicted':'',e?moodClass(e.mood):''].filter(Boolean).join(' ');
    const chips=[];
    if(predicted) chips.push(`<span class="polina-chip predicted">прогноз</span>`);
    if(e) chips.push(`<span class="polina-chip ${moodClass(e.mood)}">${esc(moodTitle(e.mood))}</span>`);
    return `<button class="polina-day ${cls}" onclick="openPolinaDay('${date}')"><span class="polina-day-num">${Number(date.slice(8,10))}</span>${e?.comment?`<span class="polina-day-note">${esc(e.comment)}</span>`:''}<span class="polina-chip-row">${chips.join('')}</span></button>`;
  }
  function polinaTimeline(){
    const rows=(state.polinaDays||[]).slice(0,12);
    if(!rows.length) return empty('Пока нет отметок. Нажми на день в календаре или «Отметить сегодня».');
    return rows.map(x=>`<div class="row"><div class="avatar" style="background:${x.mood==='good'?'#dcfce7':x.mood==='bad'?'#fee2e2':'#fff1f2'}">${x.mood==='good'?'😊':x.mood==='bad'?'🧡':'🌸'}</div><div><div class="row-title">${fmt(x.date)} · ${esc(moodTitle(x.mood))}</div><div class="row-sub">${esc(x.comment||'без комментария')}</div></div><div class="row-actions"><button class="mini blue" onclick="openPolinaDay('${x.date}')">Ред.</button><button class="mini red" onclick="deletePolinaDay('${x.id}')">Удалить</button></div></div>`).join('');
  }
  window.openPolinaCycle=function(){
    const c=cycleSettings();
    openModal('Настройки цикла Полины',`<div class="form"><div class="field"><label>Дата начала прошлого периода</label><input id="pol_lastStart" type="date" value="${esc(c.lastStart)}"></div><div class="field"><label>Длина цикла, дней</label><input id="pol_cycleLength" type="number" value="${esc(c.cycleLength)}"></div><div class="field"><label>Длительность периода, дней</label><input id="pol_duration" type="number" value="${esc(c.duration)}"></div><div class="field span-2"><label>Комментарий</label><textarea disabled>Прогноз считается ориентировочно от прошлого периода. Это не медицинская рекомендация.</textarea></div></div><div class="row-actions" style="margin-top:14px"><button class="btn" onclick="savePolinaCycle()">Сохранить</button><button class="ghost-btn" onclick="closeModal()">Отмена</button></div>`);
  };
  window.savePolinaCycle=function(){
    state.settings.polinaCycle={lastStart:$('#pol_lastStart')?.value||'',cycleLength:num($('#pol_cycleLength')?.value)||28,duration:num($('#pol_duration')?.value)||5};
    save(); closeModal(); render(); toast('Настройки Полины сохранены');
  };
  window.openPolinaDay=function(date){
    const found=dayEntry(date);
    openModal(`Отклик Полины · ${fmt(date)}`,`<div class="form"><div class="field"><label>Дата</label><input id="pol_day_date" type="date" value="${esc(date)}"></div><div class="field"><label>Тип дня</label><select id="pol_day_mood"><option value="good" ${found?.mood==='good'?'selected':''}>Хороший день</option><option value="bad" ${found?.mood==='bad'?'selected':''}>Плохой день</option><option value="neutral" ${!found||found?.mood==='neutral'?'selected':''}>Нейтрально</option><option value="period_start" ${found?.mood==='period_start'?'selected':''}>Начался период</option><option value="period" ${found?.mood==='period'?'selected':''}>Месячные</option><option value="period_end" ${found?.mood==='period_end'?'selected':''}>Период закончился</option></select></div><div class="field span-2"><label>Краткий комментарий</label><textarea id="pol_day_comment" placeholder="Что было важного в этот день? Как лучше поддержать?">${esc(found?.comment||'')}</textarea></div></div><div class="row-actions" style="margin-top:14px"><button class="btn" onclick="savePolinaDay('${found?.id||''}')">Сохранить</button>${found?`<button class="btn red" onclick="deletePolinaDay('${found.id}')">Удалить</button>`:''}<button class="ghost-btn" onclick="closeModal()">Отмена</button></div>`);
  };
  window.savePolinaDay=function(id){
    const date=$('#pol_day_date')?.value||today();
    const mood=$('#pol_day_mood')?.value||'neutral';
    const comment=$('#pol_day_comment')?.value||'';
    const obj={id:id||uid(),date,mood,comment};
    if(id) state.polinaDays=state.polinaDays.map(x=>x.id===id?obj:x); else {state.polinaDays=(state.polinaDays||[]).filter(x=>x.date!==date); state.polinaDays.unshift(obj);}
    if(mood==='period_start') state.settings.polinaCycle={...cycleSettings(),lastStart:date};
    state=normalize(state); save(); closeModal(); render(); toast('День Полины сохранён');
  };
  window.deletePolinaDay=function(id){
    state.polinaDays=(state.polinaDays||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Отметка удалена');
  };
  window.setPolinaMonth=function(delta){
    if(delta===0) state.settings.polinaMonth=month(); else state.settings.polinaMonth=shiftMonthKey(state.settings.polinaMonth||month(),delta);
    save(); render();
  };
  window.markPolinaPeriodStart=function(){
    state.settings.polinaCycle={...cycleSettings(),lastStart:today()};
    const existing=dayEntry(today());
    const obj={id:existing?.id||uid(),date:today(),mood:'period_start',comment:existing?.comment||'Отмечено начало периода'};
    if(existing) state.polinaDays=state.polinaDays.map(x=>x.id===existing.id?obj:x); else state.polinaDays.unshift(obj);
    save(); render(); toast('Начало периода отмечено');
  };

  const previousPersonalPage=personalPage;
  personalPage=function(){
    const folders=[['polina','Полина','🌸','#ec4899',(state.polinaDays||[]).length],['people','Люди','👥','#22c55e',state.people.length],['notes','Заметки','📝','#f59e0b',state.notes.length],['ideas','Идеи','💡','#eab308',state.ideas.length],['wishes','Желания','💗','#ec4899',state.wishes.length],['books','Книги','📚','#14b8a6',state.books.length],['films','Фильмы','🎬','#f97316',state.films.length],['trips','Путешествия','✈️','#38bdf8',state.trips.length],['documents','Документы','📄','#0ea5e9',state.documents.length]];
    return layout('Личное','Личный раздел второго мозга: Полина, люди, память, идеи, книги, фильмы, желания, путешествия и документы.',`<section class="grid cols-3">${folders.map(([id,n,ico,c,count])=>`<button class="card" data-go="${id}" style="text-align:left;min-height:130px"><span class="avatar" style="background:${c};color:white">${ico}</span><h3 style="margin-top:10px">${n}</h3><p class="small muted">${count} записей</p><span class="pill blue">Открыть</span></button>`).join('')}</section><article class="card" style="margin-top:16px"><h3>Что делать в «Личном»</h3><p class="muted">Сюда складывай всё, что относится к тебе как к человеку: люди, предпочтения, важные даты, идеи подарков, заметки, книги, фильмы, желания, путешествия и личные выводы. Папка «Полина» — отдельный календарь отклика и заботы.</p></article>`);
  };

  render=function(){
    ensurePolinaStyles();
    state=normalize(state);
    if(state.purchases?.length>1)state.purchases=dedupeBy(state.purchases,purchaseKey);
    save();
    const map={dashboard,finance:financePage,debts:debtsPage,tasks:tasksPage,planning:planningPage,purchases:purchasesPage,wishes:wishesPage,notes:notesPage,ideas:ideasPage,people:peoplePage,habits:habitsPage,goals:goalsPage,documents:documentsPage,books:booksPage,films:filmsPage,trips:tripsPage,personal:personalPage,polina:(typeof polinaPage==='function'?polinaPage:(window.polinaPage||personalPage)),archive:archivePage};
    renderShell((map[page]||dashboard)());
    const v=$('.version'); if(v) v.textContent=V26_LABEL;
  };

  try{ state=normalize(state); save(); render(); }catch(e){console.error(e)}
})();


/* ===== V27 finance & debts overhaul: keep current visual, improve literacy flow ===== */
(function(){
  try{ localStorage.setItem('secondBrainOS.currentBuild','second-brain-space-v27-finance-debts-20260701'); }catch(e){}

  function ensureFinanceDebtV27Styles(){
    if(document.getElementById('finance-debts-v27-style')) return;
    const st=document.createElement('style');
    st.id='finance-debts-v27-style';
    st.textContent=`
      .finance-kpi-grid{grid-template-columns:repeat(5,minmax(0,1fr))}
      .v27-kpi-card{position:relative;overflow:hidden}
      .v27-kpi-card:before{content:'';position:absolute;inset:auto -10% 0 auto;width:130px;height:130px;border-radius:999px;background:radial-gradient(circle,rgba(59,130,246,.08),transparent 68%);pointer-events:none}
      .v27-card-sub{margin-top:6px;font-size:12px;color:#64748b}
      .v27-health-grid,.v27-rules-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .v27-health{border:1px solid #e7edf6;border-radius:18px;padding:14px;background:linear-gradient(180deg,#fff,#fbfdff)}
      .v27-health h4{margin:0 0 6px;font-size:13px;color:#0f172a}
      .v27-health .value{font-size:28px;margin:0 0 6px}
      .v27-focus-list,.v27-debt-plan{display:flex;flex-direction:column;gap:10px}
      .v27-step,.v27-debt-step{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:1px solid #e7edf6;border-radius:18px;background:#fff}
      .v27-step .num,.v27-debt-step .num{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;font-weight:900;background:#eff6ff;color:#2563eb;flex:0 0 28px}
      .v27-debt-step .num.red{background:#fee2e2;color:#dc2626}
      .v27-debt-step .num.green{background:#dcfce7;color:#16a34a}
      .v27-mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .v27-line{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #eef2f7}
      .v27-line:last-child{border-bottom:0}
      .v27-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
      .v27-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800;border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8}
      .v27-badge.red{border-color:#fecaca;background:#fff1f2;color:#dc2626}
      .v27-badge.green{border-color:#bbf7d0;background:#ecfdf5;color:#15803d}
      .v27-badge.amber{border-color:#fde68a;background:#fffbeb;color:#b45309}
      .v27-category-bars{display:flex;flex-direction:column;gap:10px;margin-top:12px}
      .v27-cat-row{display:grid;grid-template-columns:minmax(0,1fr) 88px;gap:12px;align-items:center}
      .v27-cat-row .track{height:10px;background:#eef2ff;border-radius:999px;overflow:hidden}
      .v27-cat-row .track b{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#60a5fa,#2563eb)}
      .v27-goals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .v27-goal{border:1px solid #e7edf6;border-radius:18px;padding:14px;background:#fff}
      .v27-grid-3{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:16px}
      .v27-debt-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
      .v27-timeline{display:flex;flex-direction:column;gap:10px}
      .v27-timeline-item{border:1px solid #e7edf6;border-radius:18px;padding:12px 14px;background:#fff}
      .v27-empty-tip{padding:14px;border:1px dashed #d8e1ee;border-radius:18px;background:#fbfdff;color:#64748b}
      @media (max-width:1180px){.finance-kpi-grid,.v27-health-grid,.v27-rules-grid,.v27-goals,.v27-grid-3,.v27-debt-columns{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function daysBetween(a,b){
    return Math.ceil((new Date(b)-new Date(a))/86400000);
  }

  function financialGoalsOnly(){
    return state.goals.filter(g=>String(g.kind||'').toLowerCase().includes('фин'));
  }

  function currentReserveGoal(){
    return financialGoalsOnly().find(g=>/подуш|резерв/i.test(g.title||''));
  }

  function debtPayoffOrder(list){
    return list.slice().sort((a,b)=>{
      const ao=(a.due&&a.due<today())?0:1;
      const bo=(b.due&&b.due<today())?0:1;
      if(ao!==bo) return ao-bo;
      const ad=a.due?daysBetween(today(),a.due):9999;
      const bd=b.due?daysBetween(today(),b.due):9999;
      if(ad!==bd) return ad-bd;
      return num(a.amount)-num(b.amount);
    });
  }

  function financeModel(p){
    const t=financeTotals(p);
    const out=activeDebts().filter(d=>d.direction==='out');
    const incoming=activeDebts().filter(d=>d.direction==='in');
    const overdue=out.filter(d=>d.due && d.due<today());
    const due7=out.filter(d=>d.due && daysBetween(today(),d.due)>=0 && daysBetween(today(),d.due)<=7);
    const due30=out.filter(d=>d.due && daysBetween(today(),d.due)>=0 && daysBetween(today(),d.due)<=30);
    const minDebtNeed=total(overdue)+total(due7);
    const freeCash=Math.max(0, state.settings.currentBalance + t.inc - t.exp - t.upcoming);
    const reserveGoal=currentReserveGoal();
    const reserveTarget = reserveGoal ? Math.max(0,num(reserveGoal.target)) : Math.max(30000, Math.round((t.exp||15000)*1.5/1000)*1000);
    const reserveCurrent = reserveGoal ? Math.max(num(reserveGoal.current), state.settings.currentBalance||0) : Math.max(0,state.settings.currentBalance||0);
    const reserveProgress = reserveTarget ? clamp(Math.round(reserveCurrent/reserveTarget*100)) : 0;
    const debtLoad = t.inc ? clamp(Math.round(total(out)/Math.max(1,t.inc)*100),0,999) : 0;
    const recommendedReserve = total(out)>0 ? Math.min(Math.max(3000, Math.round(Math.max(0,freeCash-minDebtNeed)*0.2/1000)*1000), Math.max(0,freeCash-minDebtNeed)) : Math.round(Math.max(0,freeCash)*0.2/1000)*1000;
    const recommendedDebtPayment = Math.max(minDebtNeed, Math.round(Math.max(0,freeCash-recommendedReserve)/1000)*1000);
    const safeToSpend = Math.max(0, freeCash - recommendedDebtPayment - recommendedReserve);
    const monthlyPurchasePressure = t.planned;
    const inflowSoon = total(incoming.filter(d=>d.due && daysBetween(today(),d.due)>=0 && daysBetween(today(),d.due)<=14));
    return {t,out,incoming,overdue,due7,due30,minDebtNeed,freeCash,reserveTarget,reserveCurrent,reserveProgress,debtLoad,recommendedReserve,recommendedDebtPayment,safeToSpend,monthlyPurchasePressure,inflowSoon};
  }

  function financeHealthCard(title, value, sub, progress, cls='blue'){
    return `<div class="v27-health"><h4>${title}</h4><div class="value sm ${cls}">${value}</div>${progress!=null?prog(progress,cls==='green'?'green':cls==='red'?'red':''):'<div style="height:8px"></div>'}<div class="v27-card-sub">${sub}</div></div>`;
  }

  function financeActionPlan(model){
    const lines=[];
    if(model.overdue.length) lines.push(`Закрыть или частично погасить просрочку на ${money(total(model.overdue))}.`);
    if(model.inflowSoon>0) lines.push(`Напомнить тем, кто должен тебе, о возврате ${money(model.inflowSoon)} в ближайшие 14 дней.`);
    lines.push(`Сразу после обязательных расходов направить ${money(model.recommendedDebtPayment)} на долги.`);
    lines.push(`Отложить ${money(model.recommendedReserve)} в подушку / резерв, даже если сумма небольшая.`);
    if(model.monthlyPurchasePressure>0) lines.push(`Проверить покупки на ${money(model.monthlyPurchasePressure)} и оставить только реально нужные.`);
    return `<div class="v27-focus-list">${lines.slice(0,5).map((x,i)=>`<div class="v27-step"><div class="num">${i+1}</div><div><b>${x}</b><div class="small muted">Небольшие регулярные шаги быстрее выводят из долгов, чем редкие резкие рывки.</div></div></div>`).join('')}</div>`;
  }

  function moneyRoute(model){
    return `<div class="forecast-list">
      <div class="row"><div>Факт на руках</div><b class="blue">${money(state.settings.currentBalance)}</b></div>
      <div class="row"><div>+ Доходы периода</div><b class="green">${money(model.t.inc)}</b></div>
      <div class="row"><div>− Расходы периода</div><b class="red">${money(model.t.exp)}</b></div>
      <div class="row"><div>− Ближайшие покупки</div><b class="amber">${money(model.t.upcoming)}</b></div>
      <div class="row"><div>= Доступно после базы</div><b>${money(model.freeCash)}</b></div>
      <div class="row"><div>→ На долги</div><b class="red">${money(model.recommendedDebtPayment)}</b></div>
      <div class="row"><div>→ В накопления</div><b class="green">${money(model.recommendedReserve)}</b></div>
      <div class="row"><div>Свободный остаток</div><b class="${model.safeToSpend>0?'blue':'red'}">${money(model.safeToSpend)}</b></div>
    </div><p class="small muted" style="margin-top:10px">Логика простая: сначала база и сроки, затем долги, после этого — накопления и только потом свободные траты.</p>`;
  }

  function expenseShareBars(p){
    const ex=state.operations.filter(o=>o.type==='expense'&&inPeriod(o.date,p));
    if(!ex.length) return empty('Расходов пока нет');
    const m={}; ex.forEach(o=>m[o.category||'Без категории']=(m[o.category||'Без категории']||0)+num(o.amount));
    const rows=Object.entries(m).sort((a,b)=>b[1]-a[1]);
    const max=rows[0][1]||1;
    return `<div class="v27-category-bars">${rows.slice(0,6).map(([k,v])=>`<div class="v27-cat-row"><div><div class="small"><b>${esc(k)}</b></div><div class="track"><b style="width:${clamp(v/max*100)}%"></b></div></div><div class="small" style="text-align:right"><b>${money(v)}</b></div></div>`).join('')}</div>`;
  }

  function financeGoalsBlock(){
    const goals=financialGoalsOnly();
    return `<section class="card" style="margin-top:16px"><div class="card-head"><div><h3>Финансовые цели и накопления</h3><p class="small muted">Чтобы не только закрывать долги, но и строить запас и большие суммы.</p></div><div class="row-actions"><button class="ghost-btn" data-action="addFinancialGoal">＋ Фин. цель</button><button class="ghost-btn" data-go="goals">Открыть цели →</button></div></div>${goals.length?`<div class="v27-goals">${goals.map(g=>{const p=g.target?clamp(Math.round(num(g.current)/Math.max(1,num(g.target))*100)):0;return `<div class="v27-goal"><div class="card-head"><div><h3>${esc(g.title)}</h3><p class="small muted">${esc(g.area||'Финансы')} · срок ${fmt(g.deadline)}</p></div><span class="pill blue">${p}%</span></div>${prog(p,'green')}<div class="v27-line"><span>Сейчас</span><b>${money(g.current)}</b></div><div class="v27-line"><span>Цель</span><b>${money(g.target)}</b></div><div class="v27-line"><span>Шаг недели</span><b>${esc((g.note||'Один конкретный шаг на неделю').slice(0,60))}</b></div><div class="row-actions" style="margin-top:10px"><button class="mini green" data-action="createGoalWeeklyTask" data-id="${g.id}">Шаг недели</button><button class="mini blue" data-action="editRecord" data-type="goal" data-id="${g.id}">Ред.</button></div></div>`}).join('')}</div>`:`<div class="v27-empty-tip">Добавь хотя бы 2 финансовые цели: <b>подушка безопасности</b> и <b>сумма для накопления</b>. Так приложение будет показывать не только долги, но и твой прогресс к финансовой свободе.</div>`}</section>`;
  }

  function debtRepayPlan(out){
    return debtPayoffOrder(out).map((d,i)=>{
      const dd=d.due?daysBetween(today(),d.due):null;
      const tone = d.due && d.due<today() ? 'red' : dd!=null && dd<=7 ? 'amber' : 'green';
      const note = d.due && d.due<today() ? 'Просрочено — закрыть в первую очередь' : dd!=null && dd<=7 ? `Срок через ${dd} дн.` : d.due ? `До ${fmt(d.due)}` : 'Без срока';
      return {debt:d,tone,note,index:i+1};
    });
  }

  function debtPlanBlock(rows){
    return rows.length?`<div class="v27-debt-plan">${rows.map(r=>`<div class="v27-debt-step"><div class="num ${r.tone==='red'?'red':r.tone==='green'?'green':''}">${r.index}</div><div style="flex:1"><div class="card-head" style="margin-bottom:4px"><div><h3>${esc(r.debt.person)}</h3><p class="small muted">${r.note}</p></div><span class="pill ${r.debt.direction==='out'?'red':'green'}">${money(r.debt.amount)}</span></div><div class="small muted">${esc(r.debt.note||'Без комментария')}</div><div class="row-actions" style="margin-top:10px"><button class="mini blue" data-action="editRecord" data-type="debt" data-id="${r.debt.id}">Ред.</button><button class="mini ${r.debt.direction==='out'?'red':'green'}" data-action="debtReminder" data-id="${r.debt.id}">${r.debt.direction==='out'?'Напомнить себе':'Напомнить'}</button><button class="mini green" data-action="closeDebt" data-id="${r.debt.id}">Закрыть</button></div></div></div>`).join('')}</div>`:empty('Нет активных долгов');
  }

  function dueTimeline(list, title, emptyText){
    return `<article class="card"><div class="card-head"><h3>${title}</h3></div><div class="v27-timeline">${list.length?list.map(d=>`<div class="v27-timeline-item"><div class="card-head"><div><b>${esc(d.person)}</b><div class="small muted">${d.direction==='out'?'Я должен':'Мне должны'} · ${fmt(d.due)}</div></div><span class="pill ${d.direction==='out'?'red':'green'}">${money(d.amount)}</span></div><div class="small muted">${esc(d.note||'Без комментария')}</div></div>`).join(''):`<div class="v27-empty-tip">${emptyText}</div>`}</div></article>`;
  }

  financePage = function(){
    ensureFinanceDebtV27Styles();
    const p=periodInfo();
    const model=financeModel(p);
    const nextDebt = debtPayoffOrder(model.out)[0];
    return layout('Финансы','Деньги под контролем: сначала порядок, затем закрытие долгов и накопление сумм.',`
      <section class="finance-tabs">${[['month','Текущий месяц'],['last','Прошлый'],['next','Будущий месяц'],['quarter','3 месяца'],['year','Год']].map(([k,l])=>`<button class="chip-btn ${p.key===k?'active':''}" data-action="setFinancePeriod" data-period="${k}">${l}</button>`).join('')}</section>
      <section class="grid finance-kpi-grid">
        <article class="card v27-kpi-card"><h3>Фактический остаток</h3><div class="value sm blue">${money(state.settings.currentBalance)}</div><button class="ghost-btn" data-action="setActualBalance">Проставить остаток</button><div class="v27-card-sub">Точка отсчёта для всех прогнозов.</div></article>
        <article class="card v27-kpi-card"><h3>Доходы · ${p.title}</h3><div class="value sm green">${money(model.t.inc)}</div><div class="v27-card-sub">Все доходы за выбранный период.</div></article>
        <article class="card v27-kpi-card"><h3>Расходы · ${p.title}</h3><div class="value sm red">${money(model.t.exp)}</div><div class="v27-card-sub">Фактические траты за период.</div></article>
        <article class="card v27-kpi-card"><h3>Покупки в плане</h3><div class="value sm amber">${money(model.t.upcoming)}</div><div class="v27-card-sub">Плановые покупки до ${fmt(p.end)}.</div></article>
        <article class="card v27-kpi-card"><h3>Прогноз остатка</h3><div class="value sm ${model.freeCash>=0?'green':'red'}">${money(model.freeCash)}</div><div class="v27-card-sub">Что останется после базы и ближайших покупок.</div></article>
      </section>

      <section class="grid cols-2" style="margin-top:16px">
        <article class="card">
          <div class="card-head"><div><h3>Финансовый фокус периода</h3><p class="small muted">Система, которая помогает одновременно сокращать долги и накапливать суммы.</p></div><div class="row-actions"><button class="ghost-btn" data-action="openRecordForm" data-type="operation">＋ Операция</button><button class="ghost-btn" data-action="addFinancialGoal">＋ Фин. цель</button></div></div>
          <div class="v27-health-grid">
            ${financeHealthCard('Подушка / резерв', money(model.reserveCurrent), `Цель: ${money(model.reserveTarget)}`, model.reserveProgress, 'green')}
            ${financeHealthCard('Долговая нагрузка', `${model.debtLoad}%`, 'Чем ниже, тем легче выйти в плюс.', Math.min(model.debtLoad,100), model.debtLoad>50?'red':'blue')}
            ${financeHealthCard('Рекомендовано на долги', money(model.recommendedDebtPayment), nextDebt?`Следующий приоритет: ${esc(nextDebt.person)}`:'Долгов нет — можно копить быстрее.', null, 'red')}
            ${financeHealthCard('Рекомендовано в накопления', money(model.recommendedReserve), 'Даже небольшой резерв снижает риск новых долгов.', null, 'green')}
          </div>
          <div style="margin-top:14px">${financeActionPlan(model)}</div>
        </article>

        <article class="card">
          <div class="card-head"><div><h3>Маршрут денег</h3><p class="small muted">Понятная последовательность, чтобы деньги не растворялись.</p></div><span class="v27-badge">автопилот</span></div>
          ${moneyRoute(model)}
          <div class="record-card" style="margin-top:14px"><b>Почему это эффективно</b><ul class="small muted"><li>Сначала закрываются обязательные платежи и срочные долги — уменьшается давление.</li><li>Плановые покупки заранее учитываются в бюджете, поэтому не ломают месяц.</li><li>Часть денег сразу идёт в резерв, чтобы не пришлось снова занимать.</li></ul></div>
        </article>
      </section>

      <section class="grid cols-2" style="margin-top:16px">
        <article class="card"><div class="card-head"><h3>График доходов и расходов</h3><span class="pill blue">${fmt(p.start)} — ${fmt(p.end)}</span></div>${financeChart(p)}<div class="v27-legend"><span class="v27-badge green">Доходы</span><span class="v27-badge red">Расходы</span><span class="v27-badge amber">Покупки в прогнозе ${money(model.t.upcoming)}</span></div></article>
        <article class="card"><div class="card-head"><div><h3>Категории и точки контроля</h3><p class="small muted">Показывает, куда уходит большая часть денег.</p></div><button class="ghost-btn" data-action="openRecordForm" data-type="operation">＋ Операция</button></div>${categoryBreakdown(p)}${expenseShareBars(p)}${incomeExplain(p)}</article>
      </section>

      <section class="grid cols-2" style="margin-top:16px">
        <article class="card">
          <div class="card-head"><div><h3>Долги и возвраты</h3><p class="small muted">Всё, что влияет на чистый финансовый результат.</p></div><button class="ghost-btn" data-go="debts">Открыть долги →</button></div>
          <div class="v27-mini-grid">
            <div class="v27-health"><h4>Я должен</h4><div class="value sm red">${money(total(model.out))}</div><div class="v27-card-sub">Активных долгов: ${model.out.length}</div></div>
            <div class="v27-health"><h4>Мне должны</h4><div class="value sm green">${money(total(model.incoming))}</div><div class="v27-card-sub">Можно ускорить возвраты.</div></div>
          </div>
          <div style="margin-top:12px">${debtPlanBlock(debtRepayPlan(model.out).slice(0,3))}</div>
        </article>
        <article class="card">
          <div class="card-head"><div><h3>Импорт банка и фактический контроль</h3><p class="small muted">Обновляй факт, чтобы прогноз был точным.</p></div><span class="pill blue">дубли удаляются</span></div>
          <p class="small muted">Одинаковые строки по дате, типу, сумме, категории и комментарию будут пропущены.</p>
          <input type="file" id="csvFile" accept=".csv,text/csv">
          <div class="row-actions" style="margin-top:10px"><button class="btn" data-action="importBankCsv">Импортировать CSV</button><button class="ghost-btn" data-action="setActualBalance">Обновить остаток</button></div>
          <div class="record-card" style="margin-top:12px"><b>Последний импорт</b><div class="small muted">Добавлено ${state.settings.lastCsvAdded||0}, дублей удалено ${state.settings.lastCsvDuplicates||0}</div></div>
          <div class="record-card" style="margin-top:12px"><b>Если сумма в доходах кажется странной</b><div class="small muted">Открой блок «Откуда доходы» выше. Там видны все операции, из которых сложилась сумма.</div></div>
        </article>
      </section>

      ${financeGoalsBlock()}

      <section class="card" style="margin-top:16px"><div class="card-head"><div><h3>Плановые покупки по месяцам</h3><p class="small muted">Покупки автоматически влияют на прогноз того периода, в котором указана их дата.</p></div><button class="btn" data-action="openRecordForm" data-type="purchase">＋ Добавить покупку</button></div>${plannedMonthBlock(p)}</section>
    `);
  }

  debtsPage = function(){
    ensureFinanceDebtV27Styles();
    const all=activeDebts();
    const out=all.filter(d=>d.direction==='out');
    const incoming=all.filter(d=>d.direction==='in');
    const overdue=out.filter(d=>d.due && d.due<today());
    const due7=out.filter(d=>d.due && daysBetween(today(),d.due)>=0 && daysBetween(today(),d.due)<=7);
    const nextIn = incoming.filter(d=>d.due).sort((a,b)=>String(a.due).localeCompare(String(b.due)))[0];
    const payoffRows=debtRepayPlan(out);
    const potentialNet=Math.max(0,total(incoming)-total(out));
    return layout('Долги','Чёткая карта: что закрывать первым, что вернуть себе и как перестать жить в кассовом разрыве.',`
      <section class="grid finance-kpi-grid">
        <article class="card v27-kpi-card"><h3>Я должен</h3><div class="value sm red">${money(total(out))}</div><div class="v27-card-sub">Всего активных долгов: ${out.length}</div></article>
        <article class="card v27-kpi-card"><h3>Мне должны</h3><div class="value sm green">${money(total(incoming))}</div><div class="v27-card-sub">Можно ускорить возвраты.</div></article>
        <article class="card v27-kpi-card"><h3>Просрочено</h3><div class="value sm red">${money(total(overdue))}</div><div class="v27-card-sub">Это зона №1 для внимания.</div></article>
        <article class="card v27-kpi-card"><h3>Срок 7 дней</h3><div class="value sm amber">${money(total(due7))}</div><div class="v27-card-sub">То, что может стать новой просрочкой.</div></article>
        <article class="card v27-kpi-card"><h3>Ближайший возврат мне</h3><div class="value sm green">${nextIn?money(nextIn.amount):money(0)}</div><div class="v27-card-sub">${nextIn?`${esc(nextIn.person)} · ${fmt(nextIn.due)}`:'Пока без ближайших возвратов'}</div></article>
      </section>

      <section class="grid cols-2" style="margin-top:16px">
        <article class="card">
          <div class="card-head"><div><h3>План выхода из долгов</h3><p class="small muted">Приоритет: просрочки → ближайшие сроки → мелкие быстрые закрытия.</p></div><div class="row-actions"><button class="ghost-btn" data-action="openDebtOut">＋ Я должен</button><button class="ghost-btn" data-action="openDebtIn">＋ Мне должны</button></div></div>
          ${debtPlanBlock(payoffRows)}
        </article>

        <article class="card">
          <div class="card-head"><div><h3>Тактика на этот месяц</h3><p class="small muted">Простой алгоритм, чтобы долги уменьшались, а не крутились по кругу.</p></div><span class="v27-badge green">эффективно</span></div>
          <div class="forecast-list">
            <div class="row"><div>Сначала закрыть</div><b class="red">${money(total(overdue)+total(due7))}</b></div>
            <div class="row"><div>Запросить возвраты у других</div><b class="green">${money(total(incoming))}</b></div>
            <div class="row"><div>Минимум оставить в резерве</div><b class="blue">${money(Math.max(3000,Math.round((state.settings.currentBalance||0)*0.15/1000)*1000))}</b></div>
            <div class="row"><div>Потенциал после возвратов</div><b class="${potentialNet>=0?'green':'red'}">${money(potentialNet)}</b></div>
          </div>
          <div class="record-card" style="margin-top:14px"><b>Правила, которые помогают</b><ul class="small muted"><li>Не брать новый долг, пока не понятен план закрытия текущего.</li><li>Просрочки и ближайшие сроки — всегда впереди крупных дальних долгов.</li><li>Деньги, которые должны тебе, лучше направлять на закрытие срочных обязательств.</li><li>Даже маленький резерв уменьшает риск снова занимать.</li></ul></div>
        </article>
      </section>

      <section class="v27-debt-columns" style="margin-top:16px">
        <article class="card"><div class="card-head"><div><h3 class="red">← Я должен</h3><p class="small muted">Все обязательства, которые нужно закрыть.</p></div><button class="ghost-btn" data-action="openDebtOut">＋ Добавить</button></div><div class="list">${out.map(debtCard).join('')||empty('Нет активных долгов')}</div><div class="debt-footer"><span>Итого</span><b class="red">${money(total(out))}</b></div></article>
        <article class="card"><div class="card-head"><div><h3 class="green">Мне должны →</h3><p class="small muted">Возвраты, которые можно использовать себе на пользу.</p></div><button class="ghost-btn" data-action="openDebtIn">＋ Добавить</button></div><div class="list">${incoming.map(debtCard).join('')||empty('Тебе пока никто не должен')}</div><div class="debt-footer"><span>Итого</span><b class="green">${money(total(incoming))}</b></div></article>
      </section>

      <section class="grid cols-2" style="margin-top:16px">
        ${dueTimeline(out.filter(d=>d.due).sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,6),'Ближайшие обязательства','На ближайшие даты обязательств нет')}
        ${dueTimeline(incoming.filter(d=>d.due).sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,6),'Ближайшие возвраты мне','Возвратов по датам пока нет')}
      </section>
    `);
  }

  try{ render(); }catch(e){ console.error(e); }
})();


/* ===== V28 Space Calendar: events, reminders, load, Google Calendar ===== */
(function(){
  const V28_BUILD='second-brain-space-v32-buttons-root-cause-fix-20260701';
  try{ localStorage.setItem('secondBrainOS.currentBuild',V28_BUILD); }catch(e){}

  function ensureCalendarV28(){
    if(Array.isArray(SECTIONS) && !SECTIONS.some(s=>s.id==='calendar')){
      const idx=SECTIONS.findIndex(s=>s.id==='tasks');
      SECTIONS.splice(idx>=0?idx:SECTIONS.length,0,{id:'calendar',label:'Календарь',icon:'📅',color:'#38bdf8',group:'ПРОСТРАНСТВО'});
    }
    state.events = Array.isArray(state.events) ? state.events : [];
    state.events = state.events.map(e=>({
      id:e.id||uid(),
      title:e.title||'Событие',
      area:e.area||'Личное',
      date:e.date||today(),
      startTime:e.startTime||e.time||'09:00',
      endTime:e.endTime||'',
      type:e.type||'Событие',
      google:Boolean(e.google),
      reminder:e.reminder||'',
      load:e.load||'Средняя',
      note:e.note||''
    }));
    schemas.event={arr:'events',title:'Событие / напоминание',fields:[
      ['title','Название'],
      ['area','Сфера / папка'],
      ['date','Дата','date'],
      ['startTime','Начало','time'],
      ['endTime','Окончание','time'],
      ['type','Тип','select',[['Событие','Событие'],['Напоминание','Напоминание'],['Фокус','Фокус'],['Дедлайн','Дедлайн']]],
      ['google','Добавить в Google Calendar','select',[['false','Не сейчас'],['true','Да']]],
      ['load','Нагрузка','select',[['Низкая','Низкая'],['Средняя','Средняя'],['Высокая','Высокая']]],
      ['reminder','Напоминание','datetime-local'],
      ['note','Комментарий','textarea']
    ]};
  }

  function ensureCalendarStylesV28(){
    if(document.getElementById('calendar-v28-style')) return;
    const st=document.createElement('style');
    st.id='calendar-v28-style';
    st.textContent=`
      .calendar-v28-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(360px,.85fr);gap:16px;margin-top:16px}
      .calendar-kpi-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
      .calendar-month{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
      .calendar-weekday{text-align:center;font-size:12px;font-weight:900;color:#64748b;padding:6px 0}
      .calendar-day{min-height:126px;border:1px solid #e7edf6;border-radius:20px;background:linear-gradient(180deg,#fff,#fbfdff);padding:10px;display:flex;flex-direction:column;gap:7px;cursor:pointer;transition:.16s ease;position:relative;overflow:hidden}
      .calendar-day:hover{border-color:#bfdbfe;box-shadow:0 16px 34px rgba(15,23,42,.07);transform:translateY(-1px)}
      .calendar-day.empty{opacity:.34;cursor:default;background:#f8fbff;box-shadow:none}
      .calendar-day.today{outline:2px solid #2563eb;outline-offset:-2px}
      .calendar-day.low{background:linear-gradient(135deg,#f8fbff,#ffffff)}
      .calendar-day.medium{background:linear-gradient(135deg,#eff6ff,#ffffff);border-color:#bfdbfe}
      .calendar-day.high{background:linear-gradient(135deg,#fff7ed,#ffffff);border-color:#fed7aa}
      .calendar-day.overload{background:linear-gradient(135deg,#fff1f2,#ffffff);border-color:#fca5a5}
      .calendar-day-num{font-weight:900;color:#0f172a;font-size:14px}
      .calendar-load{height:8px;background:#eef2ff;border-radius:999px;overflow:hidden;margin-top:auto}
      .calendar-load b{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#2563eb)}
      .calendar-load.high b{background:linear-gradient(90deg,#f59e0b,#ef4444)}
      .calendar-dots{display:flex;gap:4px;flex-wrap:wrap}
      .calendar-dot{width:7px;height:7px;border-radius:99px;background:#2563eb}
      .calendar-dot.event{background:#38bdf8}.calendar-dot.task{background:#8b5cf6}.calendar-dot.reminder{background:#f59e0b}.calendar-dot.google{background:#22c55e}.calendar-dot.deadline{background:#ef4444}
      .calendar-chipline{display:flex;flex-wrap:wrap;gap:5px}
      .calendar-mini-chip{font-size:10px;font-weight:900;padding:3px 6px;border-radius:999px;background:#eff6ff;color:#2563eb;border:1px solid #dbeafe;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .calendar-agenda{display:flex;flex-direction:column;gap:10px}
      .calendar-event-card{border:1px solid #e7edf6;border-radius:18px;background:#fff;padding:12px;display:flex;gap:12px;align-items:flex-start}
      .calendar-event-icon{width:38px;height:38px;border-radius:14px;display:grid;place-items:center;background:#eff6ff;color:#2563eb;font-weight:900;flex:0 0 38px}
      .calendar-event-card.reminder .calendar-event-icon{background:#fffbeb;color:#b45309}
      .calendar-event-card.deadline .calendar-event-icon{background:#fff1f2;color:#dc2626}
      .calendar-event-card.google .calendar-event-icon{background:#ecfdf5;color:#15803d}
      .calendar-area-pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .calendar-area-pill{border:1px solid #e7edf6;background:#fff;border-radius:999px;padding:7px 10px;font-weight:800;color:#334155;font-size:12px}
      .calendar-area-pill b{color:#2563eb}
      .calendar-load-bars{display:flex;align-items:end;gap:7px;height:130px;padding:12px;border:1px solid #e7edf6;border-radius:18px;background:#fbfdff;margin-top:10px}
      .calendar-load-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
      .calendar-load-col b{width:100%;min-height:6px;border-radius:999px;background:linear-gradient(180deg,#38bdf8,#2563eb)}
      .calendar-load-col.high b{background:linear-gradient(180deg,#f59e0b,#ef4444)}
      .calendar-load-col span{font-size:10px;color:#64748b;font-weight:800;white-space:nowrap}
      @media(max-width:1180px){.calendar-v28-grid,.calendar-kpi-grid{grid-template-columns:1fr}.calendar-day{min-height:104px}}
    `;
    document.head.appendChild(st);
  }

  function monthRange(base=new Date()){
    const s=new Date(base.getFullYear(),base.getMonth(),1);
    const e=new Date(base.getFullYear(),base.getMonth()+1,0);
    return {start:s,end:e,key:`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}`};
  }
  function calendarEntries(){
    ensureCalendarV28();
    const taskEntries=state.tasks.filter(t=>t.date).map(t=>({
      id:t.id,source:'task',title:t.title,area:t.area||'Личное',date:t.date,time:t.time||'',type:t.reminder?'Напоминание':'Задача',google:Boolean(t.google),reminder:t.reminder||'',note:t.note||'',priority:t.priority||'B'
    }));
    const eventEntries=state.events.map(e=>({
      id:e.id,source:'event',title:e.title,area:e.area||'Личное',date:e.date,time:e.startTime||'',endTime:e.endTime||'',type:e.type||'Событие',google:Boolean(e.google),reminder:e.reminder||'',load:e.load||'Средняя',note:e.note||''
    }));
    const debtReminders=state.debts.filter(d=>d.due&&d.status!=='Закрыт').map(d=>({
      id:d.id,source:'debt',title:`${d.direction==='out'?'Оплатить':'Напомнить'}: ${d.person}`,area:'Финансы',date:d.due,time:'10:00',type:'Напоминание',google:false,reminder:'',note:`${d.direction==='out'?'Я должен':'Мне должны'} · ${money(d.amount)}`
    }));
    const purchaseEntries=state.purchases.filter(p=>p.date&&p.includeInBudget!==false).map(p=>({
      id:p.id,source:'purchase',title:`Покупка: ${p.title}`,area:p.area||'Личное',date:p.date,time:'',type:'Дедлайн',google:false,reminder:'',note:`${money(p.amount)} · учитывается в бюджете`
    }));
    return [...taskEntries,...eventEntries,...debtReminders,...purchaseEntries].sort((a,b)=>String(a.date+(a.time||'')).localeCompare(String(b.date+(b.time||''))));
  }
  function entriesOn(date){return calendarEntries().filter(e=>e.date===date)}
  function loadClass(count){return count>=7?'overload':count>=5?'high':count>=3?'medium':count?'low':''}
  function entryIcon(e){
    if(e.source==='task') return e.google?'📅':'✅';
    if(e.source==='debt') return '⚖️';
    if(e.source==='purchase') return '🛒';
    if(e.type==='Напоминание') return '🔔';
    if(e.type==='Дедлайн') return '🚩';
    if(e.type==='Фокус') return '🎯';
    return '🗓️';
  }
  function entryCss(e){
    if(e.google) return 'google';
    if(e.type==='Напоминание') return 'reminder';
    if(e.type==='Дедлайн'||e.source==='purchase') return 'deadline';
    return 'event';
  }
  function calendarDayCell(date,inMonth){
    const es=entriesOn(date); const cls=loadClass(es.length);
    return `<button class="calendar-day ${!inMonth?'empty':''} ${date===today()?'today':''} ${cls}" data-action="selectCalendarDay" data-date="${date}">
      <div class="calendar-day-num">${new Date(date).getDate()}</div>
      <div class="calendar-dots">${es.slice(0,8).map(e=>`<span class="calendar-dot ${entryCss(e)}"></span>`).join('')}</div>
      <div class="calendar-chipline">${es.slice(0,2).map(e=>`<span class="calendar-mini-chip">${esc(e.title)}</span>`).join('')}</div>
      <div class="calendar-load ${es.length>=5?'high':''}"><b style="width:${Math.min(100,es.length*18)}%"></b></div>
      <div class="small muted">${es.length?`${es.length} записей`:'свободно'}</div>
    </button>`;
  }
  function calendarMonthGrid(){
    const m=monthRange();
    const cells=[];
    const startPad=(m.start.getDay()+6)%7;
    for(let i=startPad;i>0;i--) cells.push({d:iso(addDays(m.start,-i)),inMonth:false});
    for(let d=new Date(m.start);d<=m.end;d=addDays(d,1)) cells.push({d:iso(d),inMonth:true});
    while(cells.length%7!==0) cells.push({d:iso(addDays(new Date(cells[cells.length-1].d),1)),inMonth:false});
    const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    return `<div class="calendar-month">${weekdays.map(w=>`<div class="calendar-weekday">${w}</div>`).join('')}${cells.map(c=>calendarDayCell(c.d,c.inMonth)).join('')}</div>`;
  }
  function calendarKpis(){
    const es=calendarEntries();
    const todayCount=entriesOn(today()).length;
    const weekEnd=iso(addDays(new Date(),7));
    const week=es.filter(e=>e.date>=today()&&e.date<=weekEnd);
    const reminders=es.filter(e=>e.type==='Напоминание'||e.reminder);
    const google=es.filter(e=>e.google);
    return `<section class="grid calendar-kpi-grid">
      <article class="card"><h3>Сегодня</h3><div class="value sm blue">${todayCount}</div><p class="small muted">событий, задач и напоминаний</p></article>
      <article class="card"><h3>Нагрузка недели</h3><div class="value sm ${week.length>18?'red':week.length>10?'amber':'green'}">${week.length}</div><p class="small muted">записей на 7 дней</p></article>
      <article class="card"><h3>Напоминания</h3><div class="value sm amber">${reminders.length}</div><p class="small muted">внутренние и долговые</p></article>
      <article class="card"><h3>Google Calendar</h3><div class="value sm green">${google.length}</div><p class="small muted">готово к добавлению / уже отмечено</p></article>
    </section>`;
  }
  function calendarAgenda(date=state.settings.calendarDate||today()){
    const es=entriesOn(date);
    return `<div class="calendar-agenda">${es.map(e=>`<article class="calendar-event-card ${entryCss(e)}"><div class="calendar-event-icon">${entryIcon(e)}</div><div style="flex:1;min-width:0"><div class="card-head" style="margin-bottom:3px"><div><h3>${esc(e.title)}</h3><p class="small muted">${esc(e.area)} · ${esc(e.type)} ${e.time?`· ${esc(e.time)}`:''}</p></div><span class="pill ${e.source==='debt'?'red':e.google?'green':'blue'}">${e.source==='task'?'задача':e.source==='event'?'событие':e.source==='debt'?'долг':'покупка'}</span></div>${e.note?`<div class="small muted">${esc(e.note)}</div>`:''}<div class="row-actions" style="margin-top:10px">${e.source==='task'?`<button class="mini blue" data-action="editRecord" data-type="task" data-id="${e.id}">Ред.</button><button class="mini green" data-action="googleTask" data-id="${e.id}">Google</button><button class="mini red" data-action="deleteRecord" data-type="task" data-id="${e.id}">Удалить</button>`:''}${e.source==='event'?`<button class="mini blue" data-action="editRecord" data-type="event" data-id="${e.id}">Ред.</button><button class="mini green" data-action="googleEvent" data-id="${e.id}">Google</button><button class="mini red" data-action="deleteRecord" data-type="event" data-id="${e.id}">Удалить</button>`:''}${e.source==='debt'?`<button class="mini blue" data-action="editRecord" data-type="debt" data-id="${e.id}">Долг</button><button class="mini green" data-action="debtReminder" data-id="${e.id}">Напомнить</button>`:''}${e.source==='purchase'?`<button class="mini blue" data-action="editRecord" data-type="purchase" data-id="${e.id}">Покупка</button>`:''}</div></div></article>`).join('')||empty('На выбранный день записей нет')}</div>`;
  }
  function calendarAreasLoad(){
    const upcoming=calendarEntries().filter(e=>e.date>=today()&&e.date<=iso(addDays(new Date(),14)));
    const m={}; upcoming.forEach(e=>m[e.area]=(m[e.area]||0)+1);
    return `<div class="calendar-area-pills">${Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>`<span class="calendar-area-pill">${esc(k)} <b>${v}</b></span>`).join('')||'<span class="calendar-area-pill">Пока нет нагрузки</span>'}</div>`;
  }
  function calendarLoadBars(){
    const days=Array.from({length:14},(_,i)=>iso(addDays(new Date(),i)));
    const max=Math.max(1,...days.map(d=>entriesOn(d).length));
    return `<div class="calendar-load-bars">${days.map(d=>{const c=entriesOn(d).length;return `<div class="calendar-load-col ${c>=5?'high':''}"><b style="height:${Math.max(6,c/max*100)}%"></b><span>${new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</span></div>`}).join('')}</div>`;
  }
  function calendarPage(){
    ensureCalendarV28(); ensureCalendarStylesV28();
    const selected=state.settings.calendarDate||today();
    return layout('Календарь','События, напоминания, задачи и нагрузка по дням. Можно добавить запись в Google Calendar. V29 force update.',`
      ${calendarKpis()}
      <section class="calendar-v28-grid">
        <article class="card"><div class="card-head"><div><h3>Календарь месяца</h3><p class="small muted">Цвет и заполнение показывают нагрузку дня.</p></div><div class="row-actions"><button class="ghost-btn" data-action="openRecordForm" data-type="event">＋ Событие</button><button class="ghost-btn" data-action="openRecordForm" data-type="task">＋ Задача</button></div></div>${calendarMonthGrid()}</article>
        <div style="display:grid;gap:16px">
          <article class="card"><div class="card-head"><div><h3>День: ${fmt(selected)}</h3><p class="small muted">События, напоминания, задачи и дедлайны.</p></div><button class="btn" data-action="openRecordForm" data-type="event">＋ Добавить</button></div>${calendarAgenda(selected)}</article>
          <article class="card"><div class="card-head"><h3>Нагрузка по сферам</h3><span class="pill blue">14 дней</span></div>${calendarAreasLoad()}${calendarLoadBars()}</article>
        </div>
      </section>
    `);
  }
  function selectCalendarDay(el){state.settings.calendarDate=el.dataset.date||today();save();render()}
  function googleEvent(el){
    const e=state.events.find(x=>x.id===el.dataset.id); if(!e) return;
    e.google=true; save();
    const date=(e.date||today()).replaceAll('-','');
    const start=`${date}T${(e.startTime||'09:00').replace(':','')}00`;
    const endTime=e.endTime||e.startTime||'10:00';
    const end=`${date}T${endTime.replace(':','')}00`;
    const url=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${start}/${end}&details=${encodeURIComponent((e.note||'')+'\nСоздано из Second Brain OS')}`;
    window.open(url,'_blank'); render();
  }

  const oldSaveRecord=saveRecord;
  saveRecord=function(el){
    oldSaveRecord(el);
    try{
      if(el.dataset.type==='event'){
        const id=el.dataset.id;
        const last=id?state.events.find(x=>x.id===id):state.events[0];
        if(last && last.google) setTimeout(()=>googleEvent({dataset:{id:last.id}}),50);
      }
    }catch(e){console.error(e)}
  };

  const oldDeleteRecord=deleteRecord;
  deleteRecord=function(el){
    oldDeleteRecord(el);
  };

  const prevRenderV28=render;
  render=function(){
    ensureCalendarV28();
    state=normalize(state);
    ensureCalendarV28();
    if(state.purchases&&state.purchases.length>1) state.purchases=dedupeBy(state.purchases,x=>`${String(x.title||'').toLowerCase()}|${num(x.amount)}|${x.date}|${String(x.note||'').toLowerCase()}`);
    save();
    const map={dashboard,finance:financePage,debts:debtsPage,calendar:calendarPage,tasks:tasksPage,planning:planningPage,purchases:purchasesPage,wishes:wishesPage,notes:notesPage,ideas:ideasPage,people:peoplePage,habits:habitsPage,goals:goalsPage,documents:documentsPage,books:booksPage,films:filmsPage,trips:tripsPage,personal:personalPage,polina:(typeof polinaPage==='function'?polinaPage:(window.polinaPage||personalPage)),archive:archivePage};
    renderShell((map[page]||dashboard)());
    const v=document.querySelector('.version'); if(v) v.textContent='V32 · КНОПКИ · ROOT FIX';
  };

  window.addEventListener('click',e=>{
    const act=e.target.closest('[data-action]'); if(!act) return;
    if(act.dataset.action==='selectCalendarDay'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return selectCalendarDay(act)}
    if(act.dataset.action==='googleEvent'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return googleEvent(act)}
  },true);

  try{ensureCalendarV28();save();render()}catch(e){console.error(e)}
})();


/* ===== V33 Polina page root fix: self-contained page + router ===== */
(function(){
  const V33_BUILD='second-brain-space-v33-polina-root-fix-20260701';
  try{ localStorage.setItem('secondBrainOS.currentBuild',V33_BUILD); }catch(e){}

  function ensurePolinaV33(){
    if(Array.isArray(SECTIONS) && !SECTIONS.some(s=>s.id==='polina')){
      const idx=SECTIONS.findIndex(s=>s.id==='personal');
      SECTIONS.splice(idx>=0?idx+1:SECTIONS.length,0,{id:'polina',label:'Полина',icon:'🌸',color:'#ec4899',group:'ЛИЧНОЕ'});
    }
    state.settings=state.settings||{};
    state.settings.polinaCycle={lastStart:'',cycleLength:28,duration:5,...(state.settings.polinaCycle||{})};
    state.settings.polinaMonth=state.settings.polinaMonth||month();
    state.polinaDays=Array.isArray(state.polinaDays)?state.polinaDays:[];
    state.polinaDays=dedupeBy(state.polinaDays.map(x=>({
      id:x.id||uid(),
      date:x.date||today(),
      mood:x.mood||'neutral',
      comment:x.comment||x.note||''
    })),x=>`${x.date}|${x.mood}|${String(x.comment||'').trim().toLowerCase()}`)
      .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }

  function ensurePolinaV33Styles(){
    if(document.getElementById('polina-v33-style')) return;
    const st=document.createElement('style');
    st.id='polina-v33-style';
    st.textContent=`
      .polina-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px}
      .polina-soft{background:linear-gradient(135deg,#fff,#fff7fb);border-color:#fbcfe8}
      .polina-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
      .polina-weekday{font-size:12px;font-weight:900;color:#64748b;text-align:center;padding:7px 0}
      .polina-day{min-height:112px;border:1px solid #e7edf6;background:#fff;border-radius:20px;padding:10px;display:flex;flex-direction:column;gap:6px;text-align:left;box-shadow:0 8px 22px rgba(15,23,42,.035);transition:.18s ease;position:relative;overflow:hidden;cursor:pointer}
      .polina-day:hover{transform:translateY(-1px);border-color:#bfdbfe;box-shadow:0 15px 35px rgba(15,23,42,.07)}
      .polina-day.empty{opacity:.38;background:#f8fbff;box-shadow:none;cursor:default}
      .polina-day.today{outline:2px solid #2563eb;outline-offset:-2px}
      .polina-day.predicted{background:linear-gradient(135deg,#fff1f2,#fff7fb);border-color:#fecdd3}
      .polina-day.period{background:linear-gradient(135deg,#ffe4e6,#fff1f2);border-color:#fb7185}
      .polina-day.good{background:linear-gradient(135deg,#ecfdf5,#f8fffb);border-color:#86efac}
      .polina-day.bad{background:linear-gradient(135deg,#fff1f2,#fff7f7);border-color:#fca5a5}
      .polina-day.neutral{background:linear-gradient(135deg,#f8fbff,#fff);border-color:#bfdbfe}
      .polina-day-num{font-weight:900;color:#0f172a;font-size:14px}
      .polina-day-note{font-size:11px;color:#64748b;line-height:1.25;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
      .polina-chip-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:auto}
      .polina-chip{font-size:10px;font-weight:900;padding:4px 7px;border-radius:999px;border:1px solid #e5eaf2;background:#fff;color:#475569}
      .polina-chip.predicted{background:#fff1f2;border-color:#fecdd3;color:#e11d48}
      .polina-chip.period{background:#ffe4e6;border-color:#fb7185;color:#be123c}
      .polina-chip.good{background:#dcfce7;border-color:#86efac;color:#15803d}
      .polina-chip.bad{background:#fee2e2;border-color:#fca5a5;color:#dc2626}
      .polina-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
      .polina-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .polina-dot{width:10px;height:10px;border-radius:999px;display:inline-block;margin-right:6px;vertical-align:middle}
      .polina-timeline{display:grid;gap:10px}
      .polina-note{border:1px dashed #fecdd3;background:#fff7fb;color:#9f1239;border-radius:18px;padding:12px;font-size:13px;line-height:1.45}
      @media(max-width:1180px){.polina-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.polina-day{min-height:96px}}
      @media(max-width:760px){.polina-kpi{grid-template-columns:1fr}.polina-calendar{gap:5px}.polina-day{min-height:80px;border-radius:14px;padding:7px}.polina-day-note{display:none}.polina-chip{font-size:9px;padding:3px 5px}}
    `;
    document.head.appendChild(st);
  }

  function polinaCycle(){
    ensurePolinaV33();
    const c=state.settings.polinaCycle||{};
    return {lastStart:c.lastStart||'',cycleLength:Math.max(20,num(c.cycleLength)||28),duration:Math.max(1,Math.min(10,num(c.duration)||5))};
  }
  function polinaDateDiff(a,b){return Math.floor((new Date(a)-new Date(b))/86400000)}
  function isPredictedPolinaDay(date){
    const c=polinaCycle(); if(!c.lastStart) return false;
    const diff=polinaDateDiff(date,c.lastStart); if(diff<0) return false;
    const rem=diff%c.cycleLength;
    return rem>=0 && rem<c.duration;
  }
  function polinaShiftMonth(key,delta){
    const [y,m]=String(key||month()).split('-').map(Number);
    const d=new Date(y,m-1+delta,1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }
  function polinaMonthCells(key){
    const [y,m]=String(key||month()).split('-').map(Number);
    const start=new Date(y,m-1,1), end=new Date(y,m,0);
    const cells=[];
    const pad=(start.getDay()+6)%7;
    for(let i=pad;i>0;i--) cells.push('');
    for(let d=new Date(start);d<=end;d=addDays(d,1)) cells.push(iso(d));
    while(cells.length%7!==0) cells.push('');
    return cells;
  }
  function polinaEntry(date){ return (state.polinaDays||[]).find(x=>x.date===date); }
  function polinaMoodTitle(m){ return ({good:'Хороший день',bad:'Плохой день',neutral:'Нейтрально',period_start:'Начало периода',period:'Месячные',period_end:'Конец периода'})[m]||'Отклик'; }
  function polinaMoodClass(m){ return m==='good'?'good':m==='bad'?'bad':String(m||'').startsWith('period')?'period':'neutral'; }
  function polinaStats(){
    ensurePolinaV33();
    const c=polinaCycle();
    const good=state.polinaDays.filter(x=>x.mood==='good').length;
    const bad=state.polinaDays.filter(x=>x.mood==='bad').length;
    const last=state.polinaDays[0];
    let next='—';
    if(c.lastStart){let d=new Date(c.lastStart); while(iso(d)<today()) d=addDays(d,c.cycleLength); next=fmt(iso(d));}
    return {c,good,bad,last,next};
  }
  function polinaDayCell(date){
    if(!date) return `<div class="polina-day empty"></div>`;
    const e=polinaEntry(date), predicted=isPredictedPolinaDay(date), mood=e?polinaMoodClass(e.mood):'';
    const cls=[date===today()?'today':'',predicted?'predicted':'',mood].filter(Boolean).join(' ');
    const chips=[];
    if(predicted) chips.push(`<span class="polina-chip predicted">прогноз</span>`);
    if(e) chips.push(`<span class="polina-chip ${mood}">${esc(polinaMoodTitle(e.mood))}</span>`);
    return `<button class="polina-day ${cls}" data-action="polinaOpenDay" data-date="${date}"><span class="polina-day-num">${Number(date.slice(8,10))}</span>${e?.comment?`<span class="polina-day-note">${esc(e.comment)}</span>`:''}<span class="polina-chip-row">${chips.join('')}</span></button>`;
  }
  function polinaTimeline(){
    const rows=(state.polinaDays||[]).slice(0,12);
    if(!rows.length) return empty('Пока нет отметок. Нажми на день в календаре или отметь сегодня.');
    return rows.map(x=>`<div class="row"><div class="avatar" style="background:${x.mood==='good'?'#dcfce7':x.mood==='bad'?'#fee2e2':'#fff1f2'}">${x.mood==='good'?'😊':x.mood==='bad'?'🧡':'🌸'}</div><div><div class="row-title">${fmt(x.date)} · ${esc(polinaMoodTitle(x.mood))}</div><div class="row-sub">${esc(x.comment||'без комментария')}</div></div><div class="row-actions"><button class="mini blue" data-action="polinaOpenDay" data-date="${x.date}">Ред.</button><button class="mini red" data-action="polinaDeleteDay" data-id="${x.id}">Удалить</button></div></div>`).join('');
  }

  window.polinaPage=function(){
    ensurePolinaV33(); ensurePolinaV33Styles();
    const s=polinaStats(), mk=state.settings.polinaMonth||month();
    const cells=polinaMonthCells(mk), weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    return layout('Полина','Личный календарь отклика: хорошие/плохие дни, комментарии и ориентировочный прогноз периода.',`
      <section class="polina-kpi">
        <article class="card polina-soft"><h3>Последний период</h3><div class="value sm">${s.c.lastStart?fmt(s.c.lastStart):'не указан'}</div><p class="small muted">можно изменить в настройках</p></article>
        <article class="card"><h3>Следующий прогноз</h3><div class="value sm blue">${s.next}</div><p class="small muted">ориентир от прошлого периода</p></article>
        <article class="card"><h3>Хорошие дни</h3><div class="value sm green">${s.good}</div><p class="small muted">отмечены зелёным</p></article>
        <article class="card"><h3>Плохие дни</h3><div class="value sm red">${s.bad}</div><p class="small muted">отмечены красным</p></article>
      </section>
      <section class="grid cols-2" style="grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:16px">
        <article class="card">
          <div class="polina-toolbar">
            <div><h3>Календарь отклика · ${esc(mk)}</h3><p class="small muted">Нажми на любой день, чтобы оставить комментарий.</p></div>
            <div class="row-actions"><button class="ghost-btn" data-action="polinaMonth" data-delta="-1">← Месяц</button><button class="ghost-btn" data-action="polinaMonth" data-delta="0">Сегодня</button><button class="ghost-btn" data-action="polinaMonth" data-delta="1">Месяц →</button><button class="btn" data-action="polinaOpenCycle">Настроить цикл</button></div>
          </div>
          <div class="polina-calendar">${weekdays.map(w=>`<div class="polina-weekday">${w}</div>`).join('')}${cells.map(polinaDayCell).join('')}</div>
          <div class="polina-legend"><span class="small muted"><i class="polina-dot" style="background:#fecdd3"></i>прогноз месячных</span><span class="small muted"><i class="polina-dot" style="background:#86efac"></i>хороший день</span><span class="small muted"><i class="polina-dot" style="background:#fca5a5"></i>плохой день</span><span class="small muted"><i class="polina-dot" style="background:#fb7185"></i>фактический период</span></div>
        </article>
        <div style="display:grid;gap:16px">
          <article class="card"><div class="card-head"><h3>Отклик по дням</h3><button class="btn" data-action="polinaOpenDay" data-date="${today()}">＋ Сегодня</button></div><div class="polina-timeline">${polinaTimeline()}</div></article>
          <article class="card"><h3>Как использовать</h3><div class="polina-note">Это личный календарь заботы, не медицинская диагностика. Отмечай хорошие и плохие дни Полины, короткий комментарий и фактические дни периода. Прогноз строится ориентировочно от прошлого периода.</div><div class="row-actions" style="margin-top:12px"><button class="ghost-btn" data-action="polinaMarkStart">Отметить начало периода сегодня</button><button class="ghost-btn" data-action="polinaOpenCycle">Изменить прошлый период</button></div></article>
        </div>
      </section>
    `);
  };

  window.openPolinaCycle=function(){
    const c=polinaCycle();
    openModal('Настройки цикла Полины',`<div class="form"><div class="field"><label>Дата начала прошлого периода</label><input id="pol_lastStart" type="date" value="${esc(c.lastStart)}"></div><div class="field"><label>Длина цикла, дней</label><input id="pol_cycleLength" type="number" value="${esc(c.cycleLength)}"></div><div class="field"><label>Длительность периода, дней</label><input id="pol_duration" type="number" value="${esc(c.duration)}"></div><div class="field span-2"><label>Комментарий</label><textarea disabled>Прогноз считается ориентировочно от прошлого периода. Это не медицинская рекомендация.</textarea></div></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-action="polinaSaveCycle">Сохранить</button><button class="ghost-btn" data-action="closeModal">Отмена</button></div>`);
  };
  window.savePolinaCycle=function(){
    ensurePolinaV33();
    state.settings.polinaCycle={lastStart:$('#pol_lastStart')?.value||'',cycleLength:num($('#pol_cycleLength')?.value)||28,duration:num($('#pol_duration')?.value)||5};
    save(); closeModal(); render(); toast('Настройки Полины сохранены');
  };
  window.openPolinaDay=function(date){
    ensurePolinaV33();
    const found=polinaEntry(date);
    openModal(`Отклик Полины · ${fmt(date)}`,`<div class="form"><div class="field"><label>Дата</label><input id="pol_day_date" type="date" value="${esc(date)}"></div><div class="field"><label>Тип дня</label><select id="pol_day_mood"><option value="good" ${found?.mood==='good'?'selected':''}>Хороший день</option><option value="bad" ${found?.mood==='bad'?'selected':''}>Плохой день</option><option value="neutral" ${!found||found?.mood==='neutral'?'selected':''}>Нейтрально</option><option value="period_start" ${found?.mood==='period_start'?'selected':''}>Начался период</option><option value="period" ${found?.mood==='period'?'selected':''}>Месячные</option><option value="period_end" ${found?.mood==='period_end'?'selected':''}>Период закончился</option></select></div><div class="field span-2"><label>Краткий комментарий</label><textarea id="pol_day_comment" placeholder="Что было важного в этот день? Как лучше поддержать?">${esc(found?.comment||'')}</textarea></div></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-action="polinaSaveDay" data-id="${found?.id||''}">Сохранить</button>${found?`<button class="btn red" data-action="polinaDeleteDay" data-id="${found.id}">Удалить</button>`:''}<button class="ghost-btn" data-action="closeModal">Отмена</button></div>`);
  };
  window.savePolinaDay=function(id){
    ensurePolinaV33();
    const date=$('#pol_day_date')?.value||today(), mood=$('#pol_day_mood')?.value||'neutral', comment=$('#pol_day_comment')?.value||'';
    const obj={id:id||uid(),date,mood,comment};
    if(id) state.polinaDays=state.polinaDays.map(x=>x.id===id?obj:x); else {state.polinaDays=(state.polinaDays||[]).filter(x=>x.date!==date);state.polinaDays.unshift(obj)}
    if(mood==='period_start') state.settings.polinaCycle={...polinaCycle(),lastStart:date};
    save(); closeModal(); render(); toast('Отклик Полины сохранён');
  };
  window.deletePolinaDay=function(id){
    ensurePolinaV33();
    state.polinaDays=(state.polinaDays||[]).filter(x=>x.id!==id); save(); closeModal(); render(); toast('Отметка удалена');
  };
  window.setPolinaMonth=function(delta){
    ensurePolinaV33();
    state.settings.polinaMonth=Number(delta)===0?month():polinaShiftMonth(state.settings.polinaMonth||month(),Number(delta)||0);
    save(); render();
  };
  window.markPolinaPeriodStart=function(){
    ensurePolinaV33();
    const date=today();
    state.settings.polinaCycle={...polinaCycle(),lastStart:date};
    const existing=polinaEntry(date);
    const obj={id:existing?.id||uid(),date,mood:'period_start',comment:'Начало периода'};
    if(existing) state.polinaDays=state.polinaDays.map(x=>x.id===existing.id?obj:x); else state.polinaDays.unshift(obj);
    save(); render(); toast('Начало периода отмечено');
  };

  const previousPersonalPage=personalPage;
  personalPage=function(){
    ensurePolinaV33();
    const folders=[['polina','Полина','🌸','#ec4899',(state.polinaDays||[]).length],['people','Люди','👥','#22c55e',state.people.length],['notes','Заметки','📝','#f59e0b',state.notes.length],['ideas','Идеи','💡','#eab308',state.ideas.length],['wishes','Желания','💗','#ec4899',state.wishes.length],['books','Книги','📚','#14b8a6',state.books.length],['films','Фильмы','🎬','#f97316',state.films.length],['trips','Путешествия','✈️','#38bdf8',state.trips.length],['documents','Документы','📄','#0ea5e9',state.documents.length]];
    return layout('Личное','Личная база: люди, заметки, идеи, желания, книги, фильмы, путешествия, документы и Полина.',`<section class="folder-grid personal-grid">${folders.map(([id,n,ico,color,c])=>`<article class="folder-card" data-go="${id}"><div class="folder-icon" style="background:${color}18;color:${color}">${ico}</div><div><h3>${n}</h3><p class="small muted">${c} записей</p></div><span>›</span></article>`).join('')}</section>`);
  };

  const prevRenderV33=render;
  render=function(){
    ensurePolinaV33();
    state=normalize(state);
    ensurePolinaV33();
    save();
    const map={dashboard,finance:financePage,debts:debtsPage,calendar:(typeof calendarPage==='function'?calendarPage:tasksPage),tasks:tasksPage,planning:planningPage,purchases:purchasesPage,wishes:wishesPage,notes:notesPage,ideas:ideasPage,people:peoplePage,habits:habitsPage,goals:goalsPage,documents:documentsPage,books:booksPage,films:filmsPage,trips:tripsPage,personal:personalPage,polina:window.polinaPage,archive:archivePage};
    renderShell((map[page]||dashboard)());
    const v=document.querySelector('.version'); if(v) v.textContent='V33 · ПОЛИНА · ROOT FIX';
  };

  window.addEventListener('click',e=>{
    const act=e.target.closest('[data-action]'); if(!act) return;
    const a=act.dataset.action;
    const handlers={
      polinaOpenDay:()=>openPolinaDay(act.dataset.date||today()),
      polinaDeleteDay:()=>deletePolinaDay(act.dataset.id),
      polinaOpenCycle:()=>openPolinaCycle(),
      polinaSaveCycle:()=>savePolinaCycle(),
      polinaSaveDay:()=>savePolinaDay(act.dataset.id||''),
      polinaMonth:()=>setPolinaMonth(act.dataset.delta||0),
      polinaMarkStart:()=>markPolinaPeriodStart()
    };
    if(handlers[a]){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();try{return handlers[a]()}catch(err){console.error(err);toast('Ошибка Полина: '+(err.message||err));}}
  },true);

  try{ensurePolinaV33();save();render()}catch(e){console.error(e);toast('Ошибка Полина: '+(e.message||e));}
})();


/* ===== V34 Polina inline button fix: root cause is old master router intercepting polina actions ===== */
(function(){
  const V34_LABEL='V34 · ПОЛИНА · INLINE FIX';
  try{ localStorage.setItem('secondBrainOS.currentBuild','second-brain-space-v34-polina-inline-buttons-fix-20260701'); }catch(e){}

  function ensurePolinaSectionV34(){
    try{
      if(Array.isArray(SECTIONS) && !SECTIONS.some(s=>s.id==='polina')){
        const idx=SECTIONS.findIndex(s=>s.id==='personal');
        SECTIONS.splice(idx>=0?idx+1:SECTIONS.length,0,{id:'polina',label:'Полина',icon:'🌸',color:'#ec4899',group:'ЛИЧНОЕ'});
      }
      state=settingsSafeStateV34(state);
    }catch(e){console.error('[V34 Polina ensure]',e)}
  }

  function settingsSafeStateV34(st){
    st=st||{};
    st.settings=st.settings||{};
    st.settings.polinaCycle={lastStart:'',cycleLength:28,duration:5,...(st.settings.polinaCycle||{})};
    st.settings.polinaMonth=st.settings.polinaMonth||month();
    if(!Array.isArray(st.polinaDays)) st.polinaDays=[];
    return st;
  }

  function updatePolinaVersionV34(){
    const v=document.querySelector('.version');
    if(v) v.textContent=V34_LABEL;
  }

  const prevRenderV34=typeof render==='function'?render:null;
  if(prevRenderV34){
    render=function(){
      ensurePolinaSectionV34();
      const res=prevRenderV34();
      updatePolinaVersionV34();
      return res;
    };
  }

  // Direct route guard: even if an older layer misses the route, #polina always opens Polina page.
  function forceOpenPolinaV34(){
    if((location.hash||'').replace('#','')!=='polina') return;
    ensurePolinaSectionV34();
    if(typeof window.polinaPage==='function'){
      try{
        page='polina';
        if(document.querySelector('#view')){
          document.querySelector('#view').innerHTML=window.polinaPage();
          updatePolinaVersionV34();
        } else if(typeof renderShell==='function'){
          renderShell(window.polinaPage());
          updatePolinaVersionV34();
        }
      }catch(e){console.error('[V34 force Polina]',e);try{toast('Ошибка Полина V34: '+(e.message||e))}catch(_){}}
    }
  }

  // Handle navigation to Polina before old routers can redirect or swallow it.
  window.addEventListener('click',function(e){
    const goEl=e.target.closest&&e.target.closest('[data-go="polina"]');
    if(!goEl) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    try{
      page='polina';
      if(location.hash!=='#polina') history.pushState(null,'','#polina');
      forceOpenPolinaV34();
    }catch(err){console.error('[V34 Polina go]',err);try{toast('Ошибка Полина: '+(err.message||err))}catch(_){}}
  },true);

  window.addEventListener('hashchange',()=>setTimeout(forceOpenPolinaV34,0));
  try{ ensurePolinaSectionV34(); if((location.hash||'').replace('#','')==='polina') setTimeout(forceOpenPolinaV34,0); setTimeout(updatePolinaVersionV34,0); }catch(e){console.error(e)}
})();


/* ===== V35 Personal page visual polish + optional cloud sync across devices ===== */
(function(){
  const V35_LABEL='V35 · ЛИЧНОЕ + СИНХРОНИЗАЦИЯ';
  const V35_BUILD='second-brain-space-v35-personal-sync-20260703';
  let syncBusy=false;
  let syncPulling=false;
  let syncTimer=null;

  try{ localStorage.setItem('secondBrainOS.currentBuild',V35_BUILD); }catch(e){}

  function ensureV35State(){
    state=state||{};
    state.settings=state.settings||{};
    state.settings.sync=Object.assign({provider:'github-gist',gistId:'',token:'',filename:'second-brain-os-sync.json',auto:false,lastPull:'',lastPush:'',lastError:'',updatedAt:''},state.settings.sync||{});
    return state;
  }

  function syncCfg(){ensureV35State();return state.settings.sync||{};}
  function isoNow(){return new Date().toISOString();}
  function syncStatusText(){
    const c=syncCfg();
    if(c.lastError) return `Ошибка: ${esc(c.lastError)}`;
    if(c.lastPush || c.lastPull) return `Выгрузка: ${c.lastPush?new Date(c.lastPush).toLocaleString('ru-RU'):'—'} · загрузка: ${c.lastPull?new Date(c.lastPull).toLocaleString('ru-RU'):'—'}`;
    return 'Синхронизация ещё не выполнялась';
  }

  function ensureV35Styles(){
    if(document.getElementById('v35-personal-sync-style')) return;
    const st=document.createElement('style');
    st.id='v35-personal-sync-style';
    st.textContent=`
      .personal-v35-wrap{max-width:1180px;display:grid;gap:10px;margin-top:18px}
      .personal-v35-row{width:100%;border:1px solid rgba(226,232,240,.96);background:rgba(255,255,255,.9);border-radius:20px;box-shadow:0 10px 24px rgba(15,23,42,.035);padding:16px 18px;display:grid;grid-template-columns:58px minmax(0,1fr) auto;align-items:center;gap:16px;text-align:left;min-height:82px;transition:.16s ease;position:relative;overflow:hidden;color:#0f172a}
      .personal-v35-row:before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(37,99,235,.025),transparent 45%);pointer-events:none}
      .personal-v35-row:hover{transform:translateY(-1px);border-color:#bfdbfe;background:#fff;box-shadow:0 16px 34px rgba(15,23,42,.06)}
      .personal-v35-icon{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;font-size:20px;font-weight:900;position:relative;z-index:1}
      .personal-v35-row h3{margin:0;font-size:17px;letter-spacing:-.035em;position:relative;z-index:1}
      .personal-v35-row p{margin:5px 0 0;position:relative;z-index:1}
      .personal-v35-chevron{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;color:#0f172a;background:rgba(248,250,252,.75);border:1px solid #edf2f7;font-weight:900;position:relative;z-index:1}
      .personal-v35-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:1180px;margin-top:8px;flex-wrap:wrap}
      .sync-v35-panel{border:1px solid #e7edf6;background:linear-gradient(180deg,#fff,#f8fbff);border-radius:22px;padding:14px;display:grid;gap:10px}
      .sync-v35-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .sync-v35-note{border:1px dashed #bfdbfe;background:#f8fbff;border-radius:18px;padding:12px;color:#64748b;font-size:13px;line-height:1.45}
      .sync-v35-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #dbeafe;background:#eef5ff;color:#2563eb;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900}
      @media(max-width:760px){.personal-v35-row{grid-template-columns:50px minmax(0,1fr) auto;padding:14px;min-height:74px}.personal-v35-icon{width:42px;height:42px}.sync-v35-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  const personalFoldersV35=()=>[
    ['polina','Полина','🌸','#ec4899',Array.isArray(state.polinaDays)?state.polinaDays.length:0],
    ['people','Люди','👥','#7c3aed',state.people?.length||0],
    ['notes','Заметки','📝','#f97316',state.notes?.length||0],
    ['ideas','Идеи','💡','#eab308',state.ideas?.length||0],
    ['wishes','Желания','💗','#ec4899',state.wishes?.length||0],
    ['books','Книги','🚩','#22c55e',state.books?.length||0],
    ['films','Фильмы','🎬','#8b5cf6',state.films?.length||0],
    ['trips','Путешествия','✈️','#38bdf8',state.trips?.length||0],
    ['documents','Документы','📄','#0ea5e9',state.documents?.length||0]
  ];

  personalPage=function(){
    ensureV35State(); ensureV35Styles();
    const c=syncCfg();
    return layout('Личное','Личная база: люди, заметки, идеи, желания, книги, фильмы, путешествия, документы и Полина.',`
      <section class="personal-v35-actions">
        <div class="sync-v35-pill">${c.auto&&c.gistId?'☁️ Синхронизация включена':'☁️ Синхронизация не настроена'}</div>
        <div class="row-actions">
          <button class="ghost-btn" data-sync-action="syncSettings">Настроить синхронизацию</button>
          <button class="ghost-btn" data-sync-action="syncPull">Загрузить из облака</button>
          <button class="btn" data-sync-action="syncPush">Сохранить в облако</button>
        </div>
      </section>
      <section class="personal-v35-wrap">
        ${personalFoldersV35().map(([id,title,icon,color,count])=>`<button class="personal-v35-row" data-go="${id}"><span class="personal-v35-icon" style="background:${color}18;color:${color}">${icon}</span><span><h3>${esc(title)}</h3><p class="small muted">${count} записей</p></span><span class="personal-v35-chevron">›</span></button>`).join('')}
      </section>
    `);
  };

  function cloudSnapshot(){
    ensureV35State();
    const clean=JSON.parse(JSON.stringify(state));
    if(clean.settings&&clean.settings.sync&&clean.settings.sync.token) clean.settings.sync.token='';
    return {app:'Second Brain OS',format:1,build:V35_BUILD,updatedAt:syncCfg().updatedAt||isoNow(),state:clean};
  }

  function authHeaders(){
    const c=syncCfg();
    const h={'Accept':'application/vnd.github+json','Content-Type':'application/json'};
    if(c.token) h.Authorization='Bearer '+c.token.trim();
    return h;
  }

  async function createSyncGist(){
    ensureV35State();
    const c=syncCfg();
    if(!c.token) return toast('Для создания облака нужен GitHub token с доступом gist');
    const filename=c.filename||'second-brain-os-sync.json';
    c.lastError=''; save();
    try{
      syncBusy=true; toast('Создаю облачное хранилище...');
      const res=await fetch('https://api.github.com/gists',{method:'POST',headers:authHeaders(),body:JSON.stringify({description:'Second Brain OS sync storage',public:false,files:{[filename]:{content:JSON.stringify(cloudSnapshot(),null,2)}}})});
      if(!res.ok) throw new Error('GitHub Gist: '+res.status);
      const data=await res.json();
      state.settings.sync.gistId=data.id;
      state.settings.sync.lastPush=isoNow();
      state.settings.sync.lastError='';
      save(); closeModal(); render(); toast('Облако создано и сохранено');
    }catch(e){state.settings.sync.lastError=e.message||String(e);save();toast('Ошибка синхронизации: '+state.settings.sync.lastError)}
    finally{syncBusy=false;}
  }

  async function pushCloudSync(showToast=true){
    ensureV35State();
    const c=syncCfg();
    if(!c.gistId || !c.token){ if(showToast) openSyncSettings(); return; }
    if(syncBusy) return;
    try{
      syncBusy=true; c.lastError='';
      if(showToast) toast('Сохраняю в облако...');
      const filename=c.filename||'second-brain-os-sync.json';
      const snap=cloudSnapshot();
      const res=await fetch(`https://api.github.com/gists/${encodeURIComponent(c.gistId.trim())}`,{method:'PATCH',headers:authHeaders(),body:JSON.stringify({files:{[filename]:{content:JSON.stringify(snap,null,2)}}})});
      if(!res.ok) throw new Error('GitHub Gist: '+res.status);
      state.settings.sync.lastPush=isoNow();
      state.settings.sync.lastError='';
      save();
      if(showToast) toast('Данные сохранены в облако');
    }catch(e){state.settings.sync.lastError=e.message||String(e);save();if(showToast)toast('Ошибка синхронизации: '+state.settings.sync.lastError)}
    finally{syncBusy=false;}
  }

  async function pullCloudSync(showToast=true){
    ensureV35State();
    const localCfg={...syncCfg()};
    if(!localCfg.gistId){ if(showToast) openSyncSettings(); return; }
    if(syncBusy) return;
    try{
      syncBusy=true; syncPulling=true; localCfg.lastError='';
      if(showToast) toast('Загружаю из облака...');
      const res=await fetch(`https://api.github.com/gists/${encodeURIComponent(localCfg.gistId.trim())}`,{headers:authHeaders()});
      if(!res.ok) throw new Error('GitHub Gist: '+res.status);
      const data=await res.json();
      const filename=localCfg.filename||'second-brain-os-sync.json';
      const file=data.files?.[filename] || Object.values(data.files||{}).find(f=>f.filename===filename) || Object.values(data.files||{})[0];
      if(!file || !file.content) throw new Error('Файл синхронизации не найден');
      const parsed=JSON.parse(file.content);
      const incoming=parsed.state||parsed;
      const keepToken=localCfg.token||'';
      state=normalize(incoming);
      state.settings=state.settings||{};
      state.settings.sync={...localCfg,...(state.settings.sync||{}),gistId:localCfg.gistId,token:keepToken,filename,lastPull:isoNow(),lastError:''};
      save(); closeModal(); render();
      if(showToast) toast('Данные загружены из облака');
    }catch(e){state.settings.sync={...localCfg,lastError:e.message||String(e)};save();if(showToast)toast('Ошибка синхронизации: '+state.settings.sync.lastError)}
    finally{syncBusy=false;syncPulling=false;}
  }

  function openSyncSettings(){
    ensureV35State();
    const c=syncCfg();
    openModal('Синхронизация на разных устройствах',`
      <div class="sync-v35-panel">
        <div class="sync-v35-note"><b>Как работает:</b> приложение остаётся на GitHub Pages, а данные синхронизируются через приватный GitHub Gist. На каждом устройстве нужно один раз вставить одинаковый Gist ID и token. Token хранится только в браузере этого устройства.</div>
        <div class="form">
          <div class="field"><label>GitHub Gist ID</label><input id="sync_gistId" value="${esc(c.gistId||'')}" placeholder="например: a1b2c3..."></div>
          <div class="field"><label>GitHub token</label><input id="sync_token" type="password" value="${esc(c.token||'')}" placeholder="token с доступом gist"></div>
          <div class="field"><label>Имя файла</label><input id="sync_filename" value="${esc(c.filename||'second-brain-os-sync.json')}"></div>
          <div class="field"><label>Автосинхронизация</label><select id="sync_auto"><option value="false" ${!c.auto?'selected':''}>Выключена</option><option value="true" ${c.auto?'selected':''}>Включена</option></select></div>
        </div>
        <div class="small muted">${syncStatusText()}</div>
        <div class="row-actions"><button class="ghost-btn" data-sync-action="syncCreateGist">Создать облако</button><button class="ghost-btn" data-sync-action="syncPull">Загрузить из облака</button><button class="ghost-btn" data-sync-action="syncPush">Сохранить в облако</button><button class="btn" data-sync-action="syncSaveSettings">Сохранить настройки</button></div>
      </div>`);
  }

  function saveSyncSettings(){
    ensureV35State();
    state.settings.sync={...syncCfg(),gistId:$('#sync_gistId')?.value.trim()||'',token:$('#sync_token')?.value.trim()||'',filename:$('#sync_filename')?.value.trim()||'second-brain-os-sync.json',auto:($('#sync_auto')?.value==='true'),lastError:''};
    save(); closeModal(); render(); toast('Настройки синхронизации сохранены');
  }

  const oldOpenProfileToolsV35=typeof openProfileTools==='function'?openProfileTools:null;
  openProfileTools=function(){
    ensureV35State();
    openModal('Профиль, импорт и сервис',`
      <div class="grid cols-2"><button class="ghost-btn" data-action="exportData">Экспорт данных</button><button class="ghost-btn" data-action="restoreSections">Показать все папки</button><button class="ghost-btn" data-action="clearCache">Очистить кэш</button><button class="ghost-btn" data-action="setActualBalance">Фактический остаток</button></div>
      <div class="sync-v35-panel" style="margin-top:14px"><div class="card-head"><div><h3>Синхронизация устройств</h3><p class="small muted">GitHub Gist: ${syncCfg().gistId?'настроен':'не настроен'} · ${syncStatusText()}</p></div><span class="pill ${syncCfg().auto?'green':'blue'}">${syncCfg().auto?'авто':'ручной режим'}</span></div><div class="row-actions"><button class="ghost-btn" data-sync-action="syncSettings">Настроить</button><button class="ghost-btn" data-sync-action="syncPull">Загрузить</button><button class="btn" data-sync-action="syncPush">Сохранить</button></div></div>
      <div class="csv-import-box" style="margin-top:14px"><h3>Импорт CSV банка</h3><p class="small muted">Дубли удаляются автоматически.</p><input type="file" id="csvFile" accept=".csv,text/csv"><div class="row-actions" style="margin-top:10px"><button class="btn" data-action="importBankCsv">Импортировать CSV</button></div></div>
      <p class="small muted" style="margin-top:12px">Сборка: ${V35_BUILD}</p>`);
  };

  const oldSaveV35=typeof save==='function'?save:null;
  if(oldSaveV35){
    save=function(){
      ensureV35State();
      if(!syncPulling) state.settings.sync.updatedAt=isoNow();
      const res=oldSaveV35();
      try{ localStorage.setItem('secondBrainOS.currentBuild',V35_BUILD); }catch(e){}
      const c=syncCfg();
      if(c.auto && c.gistId && c.token && !syncPulling){
        clearTimeout(syncTimer);
        syncTimer=setTimeout(()=>pushCloudSync(false),1500);
      }
      return res;
    };
  }

  const oldRenderV35=typeof render==='function'?render:null;
  if(oldRenderV35){
    render=function(){
      ensureV35State();
      const res=oldRenderV35();
      ensureV35Styles();
      const v=document.querySelector('.version'); if(v) v.textContent=V35_LABEL;
      return res;
    };
  }

  window.addEventListener('click',function(e){
    const el=e.target.closest&&e.target.closest('[data-sync-action]');
    if(!el) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const a=el.dataset.syncAction;
    try{
      if(a==='syncSettings') return openSyncSettings();
      if(a==='syncSaveSettings') return saveSyncSettings();
      if(a==='syncCreateGist') return createSyncGist();
      if(a==='syncPush') return pushCloudSync(true);
      if(a==='syncPull') return pullCloudSync(true);
    }catch(err){console.error('[V35 sync action]',err);toast('Ошибка синхронизации: '+(err.message||err));}
  },true);

  async function autoPullOnLoad(){
    ensureV35State();
    const c=syncCfg();
    if(!c.auto||!c.gistId) return;
    const last=Date.parse(c.lastPull||0)||0;
    if(Date.now()-last<60000) return;
    await pullCloudSync(false);
  }

  try{ensureV35State();ensureV35Styles();save();render();setTimeout(autoPullOnLoad,1200);}catch(e){console.error('[V35]',e);try{toast('Ошибка V35: '+(e.message||e))}catch(_){}}
})();


/* ===== V36 Personal hard layout fix: stable cards for Личное, no broken pastel bars ===== */
(function(){
  const V36_LABEL='V36 · ЛИЧНОЕ · HARD LAYOUT FIX';
  const V36_BUILD='second-brain-space-v36-personal-layout-hard-fix-20260703';
  try{ localStorage.setItem('secondBrainOS.currentBuild',V36_BUILD); }catch(e){}

  function v36Count(arr){return Array.isArray(arr)?arr.length:0}
  function v36PolinaCount(){
    try{
      const a=v36Count(state.polinaDays);
      const b=v36Count(state.polina?.days)+v36Count(state.polina?.entries)+v36Count(state.polinaCalendar);
      return Math.max(a,b,2);
    }catch(e){return 2}
  }
  function v36Folders(){
    state=state||{};
    return [
      ['polina','Полина','🌸','rgba(236,72,153,.12)','#ec4899',v36PolinaCount()],
      ['people','Люди','👥','rgba(124,58,237,.12)','#7c3aed',v36Count(state.people)],
      ['notes','Заметки','✏️','rgba(249,115,22,.12)','#f97316',v36Count(state.notes)],
      ['ideas','Идеи','💡','rgba(234,179,8,.14)','#eab308',v36Count(state.ideas)],
      ['wishes','Желания','💗','rgba(236,72,153,.12)','#ec4899',v36Count(state.wishes)],
      ['books','Книги','🚩','rgba(34,197,94,.12)','#22c55e',v36Count(state.books)],
      ['films','Фильмы','🎬','rgba(139,92,246,.12)','#8b5cf6',v36Count(state.films)],
      ['trips','Путешествия','✈️','rgba(14,165,233,.12)','#0ea5e9',v36Count(state.trips)],
      ['documents','Документы','📄','rgba(6,182,212,.12)','#06b6d4',v36Count(state.documents)]
    ];
  }
  function ensureV36PersonalStyles(){
    if(document.getElementById('v36-personal-hard-layout-style')) return;
    const st=document.createElement('style');
    st.id='v36-personal-hard-layout-style';
    st.textContent=`
      #view .personal-v36-list{max-width:1180px!important;display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-top:18px!important;padding:0!important;align-items:stretch!important}
      #view .personal-v36-row{all:unset!important;box-sizing:border-box!important;width:100%!important;min-height:84px!important;display:grid!important;grid-template-columns:58px minmax(0,1fr) 36px!important;align-items:center!important;gap:16px!important;padding:16px 18px!important;border:1px solid rgba(226,232,240,.96)!important;border-radius:20px!important;background:rgba(255,255,255,.92)!important;box-shadow:0 10px 24px rgba(15,23,42,.035)!important;color:#0f172a!important;cursor:pointer!important;position:relative!important;overflow:hidden!important;text-align:left!important;font:inherit!important;line-height:normal!important;white-space:normal!important;appearance:none!important;-webkit-appearance:none!important}
      #view .personal-v36-row:hover{transform:translateY(-1px)!important;border-color:#bfdbfe!important;background:#fff!important;box-shadow:0 16px 34px rgba(15,23,42,.06)!important}
      #view .personal-v36-row::before{content:''!important;position:absolute!important;inset:0!important;background:linear-gradient(135deg,rgba(37,99,235,.025),transparent 45%)!important;pointer-events:none!important}
      #view .personal-v36-icon{box-sizing:border-box!important;width:48px!important;height:48px!important;border-radius:16px!important;display:grid!important;place-items:center!important;font-size:20px!important;font-weight:900!important;position:relative!important;z-index:1!important;line-height:1!important;flex:none!important}
      #view .personal-v36-text{position:relative!important;z-index:1!important;display:grid!important;gap:4px!important;min-width:0!important;background:transparent!important;padding:0!important;margin:0!important}
      #view .personal-v36-text h3{margin:0!important;font-size:17px!important;line-height:1.2!important;font-weight:900!important;letter-spacing:-.035em!important;color:#0f172a!important;background:transparent!important;padding:0!important;border:0!important}
      #view .personal-v36-text p{margin:0!important;font-size:12px!important;line-height:1.25!important;color:#64748b!important;font-weight:700!important;background:transparent!important;padding:0!important;border:0!important}
      #view .personal-v36-chevron{box-sizing:border-box!important;width:34px!important;height:34px!important;border-radius:12px!important;display:grid!important;place-items:center!important;color:#0f172a!important;background:rgba(248,250,252,.75)!important;border:1px solid #edf2f7!important;font-weight:900!important;position:relative!important;z-index:1!important;font-size:22px!important;line-height:1!important}
      #view .personal-v36-actions{max-width:1180px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex-wrap:wrap!important;margin-top:8px!important}
      #view .personal-v36-sync-pill{display:inline-flex!important;align-items:center!important;gap:6px!important;border:1px solid #dbeafe!important;background:#eef5ff!important;color:#2563eb!important;border-radius:999px!important;padding:7px 10px!important;font-size:12px!important;font-weight:900!important;line-height:1!important}
      #view .personal-v36-sync-pill.green{background:#ecfdf5!important;border-color:#bbf7d0!important;color:#10b981!important}
      @media(max-width:760px){#view .personal-v36-row{grid-template-columns:50px minmax(0,1fr) 32px!important;min-height:74px!important;padding:14px!important;gap:12px!important}#view .personal-v36-icon{width:42px!important;height:42px!important}.personal-v36-actions{align-items:stretch!important}.personal-v36-actions .row-actions{width:100%!important;justify-content:flex-start!important}}
    `;
    document.head.appendChild(st);
  }
  function v36SyncConfigured(){
    try{return Boolean(state?.settings?.sync?.gistId)}catch(e){return false}
  }
  function v36PersonalInner(){
    const sync = v36SyncConfigured();
    return `
      <section class="personal-v36-actions">
        <div class="personal-v36-sync-pill ${sync?'green':''}">${sync?'☁️ Синхронизация настроена':'☁️ Синхронизация не настроена'}</div>
        <div class="row-actions">
          <button class="ghost-btn" data-sync-action="syncSettings">Настроить синхронизацию</button>
          <button class="ghost-btn" data-sync-action="syncPull">Загрузить из облака</button>
          <button class="btn" data-sync-action="syncPush">Сохранить в облако</button>
        </div>
      </section>
      <section class="personal-v36-list">
        ${v36Folders().map(([id,title,icon,bg,color,count])=>`<button type="button" class="personal-v36-row" data-go="${id}" aria-label="Открыть ${esc(title)}"><span class="personal-v36-icon" style="background:${bg};color:${color}">${icon}</span><div class="personal-v36-text"><h3>${esc(title)}</h3><p>${count} записей</p></div><span class="personal-v36-chevron">›</span></button>`).join('')}
      </section>`;
  }
  function v36PersonalPage(){
    ensureV36PersonalStyles();
    return layout('Личное','Личная база: люди, заметки, идеи, желания, книги, фильмы, путешествия, документы и Полина.',v36PersonalInner());
  }
  function forcePersonalV36(){
    try{
      ensureV36PersonalStyles();
      const isPersonal=(location.hash||'').replace('#','')==='personal'||page==='personal';
      if(!isPersonal) return;
      const view=document.querySelector('#view');
      if(!view) return;
      const hasGood=view.querySelector('.personal-v36-list');
      const text=(view.textContent||'').slice(0,300);
      if(hasGood && !view.querySelector('.personal-v35-row')) return;
      view.innerHTML=v36PersonalPage();
      const v=document.querySelector('.version'); if(v) v.textContent=V36_LABEL;
    }catch(e){console.error('[V36 personal force]',e);try{toast('Ошибка Личного: '+(e.message||e))}catch(_){}}
  }

  try{ personalPage=v36PersonalPage; }catch(e){ console.warn('[V36] personalPage override skipped',e); }

  const oldRenderV36=typeof render==='function'?render:null;
  if(oldRenderV36){
    render=function(){
      const res=oldRenderV36();
      const v=document.querySelector('.version'); if(v) v.textContent=V36_LABEL;
      setTimeout(forcePersonalV36,0);
      return res;
    };
  }

  window.addEventListener('click',function(e){
    const go=e.target.closest&&e.target.closest('[data-go="personal"], .nav-item[data-go="personal"], button[data-go="personal"]');
    if(!go) return;
    setTimeout(forcePersonalV36,0);
    setTimeout(forcePersonalV36,80);
  },true);
  window.addEventListener('hashchange',()=>{setTimeout(forcePersonalV36,0);setTimeout(forcePersonalV36,80);});
  const mo=new MutationObserver(()=>forcePersonalV36());
  try{mo.observe(document.documentElement,{childList:true,subtree:true});}catch(e){}
  try{ensureV36PersonalStyles(); if((location.hash||'').replace('#','')==='personal') setTimeout(forcePersonalV36,0); setTimeout(()=>{const v=document.querySelector('.version'); if(v) v.textContent=V36_LABEL;},0);}catch(e){console.error(e)}
})();


/* ===== V37 Stability kit: diagnostics, backup, sync clarity, finance/calendar polish ===== */
(function(){
  const V37_BUILD='second-brain-space-v37-stability-kit-20260706';
  const V37_LABEL='V37 · ДИАГНОСТИКА + БЭКАП + ПОЛИШ';
  try{ localStorage.setItem('secondBrainOS.currentBuild',V37_BUILD); }catch(e){}

  function v37EnsureState(){
    state.settings = state.settings || {};
    state.settings.v37 = state.settings.v37 || {dailyLimit:0,lastBackupAt:'',lastRestoreAt:''};
    state.settings.sync = state.settings.sync || {gistId:'',token:'',filename:'second-brain-os-sync.json',auto:false,lastPush:'',lastPull:'',lastError:''};
  }
  function v37EnsureSections(){
    try{
      if(Array.isArray(SECTIONS) && !SECTIONS.some(s=>s.id==='diagnostics')){
        const idx=SECTIONS.findIndex(s=>s.id==='archive');
        SECTIONS.splice(idx>=0?idx:SECTIONS.length,0,{id:'diagnostics',label:'Диагностика',icon:'🛠️',color:'#64748b',group:'СЕРВИС'});
      }
    }catch(e){console.warn('[V37 sections]',e)}
  }
  function v37EnsureStyles(){
    if(document.getElementById('v37-stability-kit-style')) return;
    const st=document.createElement('style');
    st.id='v37-stability-kit-style';
    st.textContent=`
      :root{--v37-line:#e7edf6;--v37-soft:#f8fbff;--v37-blue:#2563eb;--v37-green:#10b981;--v37-red:#ef4444;--v37-amber:#f59e0b}
      #view .card{transition:box-shadow .18s ease,transform .18s ease,border-color .18s ease!important}
      #view .card:hover{box-shadow:0 16px 38px rgba(15,23,42,.055)!important;border-color:#dbeafe!important}
      #view .empty{border:1px dashed #d8e1ee!important;background:rgba(248,251,255,.8)!important;border-radius:18px!important;padding:18px!important;color:#64748b!important;font-weight:700!important;text-align:center!important}
      #view .btn,#view .ghost-btn,#view .mini,#view .chip-btn{transition:transform .15s ease,box-shadow .15s ease,background .15s ease!important}
      #view .btn:hover,#view .ghost-btn:hover,#view .mini:hover,#view .chip-btn:hover{transform:translateY(-1px)!important}
      .v37-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:16px}
      .v37-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
      .v37-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}
      .v37-kpi{position:relative;overflow:hidden}
      .v37-kpi:before{content:'';position:absolute;right:-42px;bottom:-46px;width:138px;height:138px;border-radius:999px;background:radial-gradient(circle,rgba(37,99,235,.09),transparent 68%);pointer-events:none}
      .v37-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #eef2f7}
      .v37-row:last-child{border-bottom:0}
      .v37-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8;white-space:nowrap}
      .v37-badge.green{background:#ecfdf5;border-color:#bbf7d0;color:#15803d}.v37-badge.red{background:#fff1f2;border-color:#fecaca;color:#dc2626}.v37-badge.amber{background:#fffbeb;border-color:#fde68a;color:#b45309}.v37-badge.gray{background:#f8fafc;border-color:#e2e8f0;color:#475569}
      .v37-matrix{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .v37-tile{border:1px solid var(--v37-line);background:#fff;border-radius:18px;padding:14px;min-height:110px}
      .v37-tile h4{margin:0 0 6px;font-size:13px;color:#0f172a}.v37-tile p{margin:0;color:#64748b;font-size:12px;line-height:1.35}
      .v37-good{background:linear-gradient(135deg,#ecfdf5,#fff);border-color:#bbf7d0}.v37-warn{background:linear-gradient(135deg,#fffbeb,#fff);border-color:#fde68a}.v37-danger{background:linear-gradient(135deg,#fff1f2,#fff);border-color:#fecaca}.v37-info{background:linear-gradient(135deg,#eff6ff,#fff);border-color:#bfdbfe}
      .v37-status-dot{width:9px;height:9px;border-radius:99px;background:#94a3b8;display:inline-block}.v37-status-dot.ok{background:#10b981}.v37-status-dot.bad{background:#ef4444}.v37-status-dot.warn{background:#f59e0b}
      .v37-backup-zone{border:1px dashed #cbd5e1;border-radius:20px;padding:16px;background:linear-gradient(180deg,#fff,#fbfdff)}
      .v37-finance-addon,.v37-calendar-addon{margin-top:16px!important}
      .v37-week-checks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .v37-check{border:1px solid var(--v37-line);background:#fff;border-radius:18px;padding:14px;display:flex;gap:12px;align-items:flex-start}.v37-check input{margin-top:3px;transform:scale(1.1)}
      .v37-load-meter{height:13px;background:#eef2ff;border-radius:999px;overflow:hidden}.v37-load-meter b{height:100%;display:block;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#2563eb)}.v37-load-meter b.warn{background:linear-gradient(90deg,#f59e0b,#ef4444)}.v37-load-meter b.good{background:linear-gradient(90deg,#34d399,#10b981)}
      .v37-legend{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .v37-color{width:10px;height:10px;border-radius:99px;display:inline-block}.v37-color.green{background:#10b981}.v37-color.yellow{background:#f59e0b}.v37-color.red{background:#ef4444}.v37-color.blue{background:#2563eb}.v37-color.pink{background:#ec4899}.v37-color.purple{background:#8b5cf6}
      @media(max-width:1180px){.v37-grid,.v37-grid.two,.v37-grid.four,.v37-week-checks,.v37-matrix{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(st);
  }
  function v37Now(){return new Date().toLocaleString('ru-RU')}
  function v37Bytes(str){return new Blob([str||'']).size}
  function v37LocalSize(){let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n+=v37Bytes(k)+v37Bytes(localStorage.getItem(k));}}catch(e){}return n}
  function v37Kb(v){return (v/1024).toFixed(1)+' КБ'}
  function v37CountArray(k){return Array.isArray(state?.[k])?state[k].length:0}
  function v37SyncCfg(){v37EnsureState();return state.settings.sync||{}}
  function v37SyncState(){
    const c=v37SyncCfg();
    if(c.lastError) return ['bad','Ошибка: '+c.lastError];
    if(c.gistId && c.token && c.auto) return ['ok','Подключена · авто'];
    if(c.gistId && c.token) return ['ok','Подключена · вручную'];
    if(c.gistId) return ['warn','Нужен token на этом устройстве'];
    return ['warn','Не настроена'];
  }
  function v37StateSnapshot(){return {version:V37_BUILD,createdAt:new Date().toISOString(),state};}
  function v37DownloadBackup(){
    v37EnsureState();
    state.settings.v37.lastBackupAt=new Date().toISOString();
    try{save();}catch(e){}
    const blob=new Blob([JSON.stringify(v37StateSnapshot(),null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`second-brain-os-backup-${today()}-v37.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    try{toast('Резервная копия скачана')}catch(e){}
  }
  function v37OpenRestore(){
    openModal('Восстановить из резервной копии',`
      <div class="v37-backup-zone">
        <h3>Загрузить JSON-файл Second Brain OS</h3>
        <p class="small muted">Перед восстановлением текущие данные будут заменены данными из файла. Лучше сначала скачать свежую резервную копию.</p>
        <input id="v37_backup_file" type="file" accept=".json,application/json">
        <div class="row-actions" style="margin-top:12px"><button class="ghost-btn" data-v37-action="downloadBackup">Сначала скачать текущие данные</button><button class="btn" data-v37-action="restoreBackup">Восстановить из файла</button></div>
      </div>`);
  }
  async function v37RestoreBackup(){
    const file=document.querySelector('#v37_backup_file')?.files?.[0];
    if(!file){try{toast('Выбери JSON-файл')}catch(e){} return;}
    try{
      const data=JSON.parse(await file.text());
      const incoming=data.state||data;
      state=normalize(incoming);
      v37EnsureState();
      state.settings.v37.lastRestoreAt=new Date().toISOString();
      save(); closeModal(); render();
      try{toast('Данные восстановлены')}catch(e){}
    }catch(e){console.error(e);try{toast('Не удалось восстановить: '+(e.message||e))}catch(_){}}
  }
  function v37DiagnosticsPage(){
    v37EnsureState(); v37EnsureStyles();
    const sync=v37SyncState();
    const arrays=[['Операции',v37CountArray('operations')],['Долги',v37CountArray('debts')],['Задачи',v37CountArray('tasks')],['События',v37CountArray('events')],['Покупки',v37CountArray('purchases')],['Люди',v37CountArray('people')],['Полина',(v37CountArray('polinaDays')||0)],['Идеи',v37CountArray('ideas')],['Цели',v37CountArray('goals')]];
    const currentBuild=localStorage.getItem('secondBrainOS.currentBuild')||V37_BUILD;
    return layout('Диагностика','Проверка версии, кэша, данных, ошибок, синхронизации и резервных копий.',`
      <section class="v37-grid four">
        <article class="card v37-kpi"><h3>Версия</h3><div class="value sm blue">V37</div><p class="small muted">${esc(currentBuild)}</p></article>
        <article class="card v37-kpi"><h3>Данные</h3><div class="value sm green">${arrays.reduce((s,x)=>s+x[1],0)}</div><p class="small muted">записей в основных разделах</p></article>
        <article class="card v37-kpi"><h3>localStorage</h3><div class="value sm amber">${v37Kb(v37LocalSize())}</div><p class="small muted">примерный размер локальной базы</p></article>
        <article class="card v37-kpi"><h3>Синхронизация</h3><div class="value sm ${sync[0]==='ok'?'green':sync[0]==='bad'?'red':'amber'}">${sync[0]==='ok'?'OK':sync[0]==='bad'?'ERR':'WAIT'}</div><p class="small muted">${esc(sync[1])}</p></article>
      </section>
      <section class="v37-grid two">
        <article class="card"><div class="card-head"><div><h3>Проверки загрузки</h3><p class="small muted">Помогает понять, почему сайт не обновился или кнопки сломались.</p></div><span class="v37-badge green">активно</span></div>
          <div class="v37-row"><span><span class="v37-status-dot ok"></span> BUILD в браузере</span><b>${esc(currentBuild)}</b></div>
          <div class="v37-row"><span><span id="v37_sw_dot" class="v37-status-dot warn"></span> Service Worker</span><b id="v37_sw_text">проверяю...</b></div>
          <div class="v37-row"><span><span id="v37_js_dot" class="v37-status-dot ok"></span> JS-ошибки текущей загрузки</span><b id="v37_js_text">нет данных</b></div>
          <div class="v37-row"><span>Текущий раздел</span><b>${esc(page||location.hash||'dashboard')}</b></div>
          <div class="row-actions" style="margin-top:12px"><button class="ghost-btn" data-action="clearCache">Очистить кэш</button><button class="ghost-btn" data-go="personal">Проверить Личное</button><button class="ghost-btn" data-go="calendar">Проверить Календарь</button></div>
        </article>
        <article class="card"><div class="card-head"><div><h3>Резервная копия</h3><p class="small muted">Перед крупными правками сохраняй файл с данными.</p></div><span class="v37-badge blue">безопасно</span></div>
          <div class="v37-row"><span>Последний бэкап</span><b>${state.settings.v37.lastBackupAt?new Date(state.settings.v37.lastBackupAt).toLocaleString('ru-RU'):'ещё не скачивался'}</b></div>
          <div class="v37-row"><span>Последнее восстановление</span><b>${state.settings.v37.lastRestoreAt?new Date(state.settings.v37.lastRestoreAt).toLocaleString('ru-RU'):'не было'}</b></div>
          <div class="row-actions" style="margin-top:12px"><button class="btn" data-v37-action="downloadBackup">Скачать резервную копию</button><button class="ghost-btn" data-v37-action="openRestore">Восстановить из файла</button></div>
        </article>
      </section>
      <section class="v37-grid two">
        <article class="card"><div class="card-head"><div><h3>Синхронизация устройств</h3><p class="small muted">GitHub Gist используется как облако данных между устройствами.</p></div><span class="v37-badge ${sync[0]==='ok'?'green':sync[0]==='bad'?'red':'amber'}">${esc(sync[1])}</span></div>
          <div class="v37-row"><span>Gist ID</span><b>${v37SyncCfg().gistId?'задан':'не задан'}</b></div>
          <div class="v37-row"><span>Token на этом устройстве</span><b>${v37SyncCfg().token?'задан':'не задан'}</b></div>
          <div class="v37-row"><span>Последнее сохранение в облако</span><b>${v37SyncCfg().lastPush?new Date(v37SyncCfg().lastPush).toLocaleString('ru-RU'):'—'}</b></div>
          <div class="v37-row"><span>Последняя загрузка из облака</span><b>${v37SyncCfg().lastPull?new Date(v37SyncCfg().lastPull).toLocaleString('ru-RU'):'—'}</b></div>
          <div class="row-actions" style="margin-top:12px"><button class="ghost-btn" data-sync-action="syncSettings">Настроить</button><button class="ghost-btn" data-sync-action="syncPull">Загрузить</button><button class="btn" data-sync-action="syncPush">Сохранить</button></div>
        </article>
        <article class="card"><div class="card-head"><h3>Структура данных</h3><span class="v37-badge gray">localStorage</span></div>
          ${arrays.map(([k,v])=>`<div class="v37-row"><span>${esc(k)}</span><b>${v}</b></div>`).join('')}
        </article>
      </section>
    `);
  }
  function v37FillDiagnostics(){
    if((page||'')!=='diagnostics' && (location.hash||'').replace('#','')!=='diagnostics') return;
    try{
      const jsErrors=window.__sbosV37Errors||[];
      const jsText=document.getElementById('v37_js_text'); const jsDot=document.getElementById('v37_js_dot');
      if(jsText){jsText.textContent=jsErrors.length?`${jsErrors.length} ошибок`:'ошибок не поймано';}
      if(jsDot){jsDot.className='v37-status-dot '+(jsErrors.length?'bad':'ok');}
      const swText=document.getElementById('v37_sw_text'); const swDot=document.getElementById('v37_sw_dot');
      if('serviceWorker' in navigator){
        navigator.serviceWorker.getRegistrations().then(r=>{if(swText)swText.textContent=r.length?`активен: ${r.length}`:'не активен'; if(swDot)swDot.className='v37-status-dot '+(r.length?'ok':'warn');}).catch(()=>{if(swText)swText.textContent='ошибка проверки'; if(swDot)swDot.className='v37-status-dot bad';});
      }else{ if(swText)swText.textContent='не поддерживается'; if(swDot)swDot.className='v37-status-dot warn'; }
    }catch(e){}
  }

  function v37FinanceStats(){
    const p=periodInfo();
    const t=financeTotals(p);
    const out=activeDebts().filter(d=>d.direction==='out');
    const debtTotal=total(out);
    const daysLeft=Math.max(1,Math.ceil((new Date(p.end)-new Date(today()))/86400000)+1);
    const cashAfterBase=Math.max(0,(state.settings.currentBalance||0)+t.inc-t.exp-(t.upcoming||t.planned||0));
    const recommendedDebt=Math.max(0,Math.min(cashAfterBase,Math.round(cashAfterBase*.65/1000)*1000));
    const recommendedReserve=Math.max(0,Math.round((cashAfterBase-recommendedDebt)*.5/1000)*1000);
    const dailyLimit=state.settings.v37?.dailyLimit||Math.max(0,Math.floor((cashAfterBase-recommendedDebt-recommendedReserve)/daysLeft));
    return {p,t,out,debtTotal,daysLeft,cashAfterBase,recommendedDebt,recommendedReserve,dailyLimit};
  }
  function v37FirstDebt(out){
    return out.slice().sort((a,b)=>{
      const ao=a.due&&a.due<today()?0:1, bo=b.due&&b.due<today()?0:1; if(ao!==bo)return ao-bo;
      const ad=a.due?new Date(a.due)-new Date(today()):9e15, bd=b.due?new Date(b.due)-new Date(today()):9e15; if(ad!==bd)return ad-bd;
      return num(a.amount)-num(b.amount);
    })[0];
  }
  function v37PayoffMonths(totalDebt,pay){return pay>0?Math.ceil(totalDebt/pay):0}
  function v37FinanceAddonHtml(){
    const s=v37FinanceStats(); const first=v37FirstDebt(s.out);
    return `<section class="v37-finance-addon card" data-v37-addon="finance">
      <div class="card-head"><div><h3>План недели по деньгам</h3><p class="small muted">Маленький контроль, который помогает закрывать долги и не ломать месяц.</p></div><span class="v37-badge green">дисциплина</span></div>
      <div class="v37-grid four" style="margin-top:0">
        <div class="v37-tile v37-info"><h4>Лимит дня</h4><div class="value sm blue">${money(s.dailyLimit)}</div><p>Ориентир свободных трат до конца периода.</p></div>
        <div class="v37-tile v37-danger"><h4>На долги</h4><div class="value sm red">${money(s.recommendedDebt)}</div><p>${first?`Первый приоритет: ${esc(first.person)}`:'Активных долгов нет.'}</p></div>
        <div class="v37-tile v37-good"><h4>В резерв</h4><div class="value sm green">${money(s.recommendedReserve)}</div><p>Чтобы не возвращаться к новым займам.</p></div>
        <div class="v37-tile v37-warn"><h4>Дней до конца периода</h4><div class="value sm amber">${s.daysLeft}</div><p>Лимит считается от этого срока.</p></div>
      </div>
      <div class="v37-week-checks" style="margin-top:14px">
        <label class="v37-check"><input type="checkbox"><span><b>${first?`Закрыть/погасить ${esc(first.person)}`:'Не брать новый долг'}</b><div class="small muted">Приоритет недели</div></span></label>
        <label class="v37-check"><input type="checkbox"><span><b>Отложить ${money(s.recommendedReserve)}</b><div class="small muted">Даже если маленькая сумма</div></span></label>
        <label class="v37-check"><input type="checkbox"><span><b>Не выходить за ${money(s.dailyLimit)} в день</b><div class="small muted">Контроль свободных трат</div></span></label>
      </div>
      <div class="v37-grid two"><article class="v37-tile"><h4>Сценарии выхода из долгов</h4><div class="v37-row"><span>по 5 000 ₽ / мес</span><b>${v37PayoffMonths(s.debtTotal,5000)||'—'} мес.</b></div><div class="v37-row"><span>по 10 000 ₽ / мес</span><b>${v37PayoffMonths(s.debtTotal,10000)||'—'} мес.</b></div><div class="v37-row"><span>по 15 000 ₽ / мес</span><b>${v37PayoffMonths(s.debtTotal,15000)||'—'} мес.</b></div></article><article class="v37-tile"><h4>Настройка лимита</h4><p>Можно вручную задать дневной лимит, если хочешь жёстче контролировать расходы.</p><div class="row-actions" style="margin-top:10px"><button class="ghost-btn" data-v37-action="setDailyLimit">Задать лимит дня</button></div></article></div>
    </section>`;
  }
  function v37InjectFinance(){
    try{
      if((page||'')!=='finance' && (location.hash||'').replace('#','')!=='finance') return;
      if(document.querySelector('[data-v37-addon="finance"]')) return;
      const view=document.querySelector('#view'); if(!view) return;
      view.insertAdjacentHTML('beforeend',v37FinanceAddonHtml());
    }catch(e){console.error('[V37 finance addon]',e)}
  }
  function v37SetDailyLimit(){
    v37EnsureState();
    const old=state.settings.v37.dailyLimit||'';
    const v=prompt('Дневной лимит свободных трат, ₽',old);
    if(v===null) return;
    state.settings.v37.dailyLimit=Math.max(0,num(v)); save(); render(); try{toast('Лимит дня сохранён')}catch(e){}
  }

  function v37CalendarEntries(){
    const events=Array.isArray(state.events)?state.events.map(e=>({date:e.date,area:e.area||'Личное',type:e.type||'Событие',source:'event'})):[];
    const tasks=Array.isArray(state.tasks)?state.tasks.filter(t=>t.date).map(t=>({date:t.date,area:t.area||'Личное',type:'Задача',source:'task'})):[];
    const debts=Array.isArray(state.debts)?state.debts.filter(d=>d.due&&d.status!=='Закрыт').map(d=>({date:d.due,area:'Финансы',type:'Долг',source:'debt'})):[];
    const purchases=Array.isArray(state.purchases)?state.purchases.filter(p=>p.date&&p.includeInBudget!==false).map(p=>({date:p.date,area:p.area||'Личное',type:'Покупка',source:'purchase'})):[];
    return [...events,...tasks,...debts,...purchases];
  }
  function v37CalendarAddonHtml(){
    const days=Array.from({length:7},(_,i)=>iso(addDays(new Date(),i)));
    const counts=days.map(d=>v37CalendarEntries().filter(e=>e.date===d).length);
    const totalWeek=counts.reduce((a,b)=>a+b,0);
    const percent=clamp(Math.round(totalWeek/21*100));
    const cls=percent>75?'warn':percent<45?'good':'';
    const byArea={}; v37CalendarEntries().filter(e=>e.date>=today()&&e.date<=iso(addDays(new Date(),7))).forEach(e=>byArea[e.area]=(byArea[e.area]||0)+1);
    return `<section class="v37-calendar-addon card" data-v37-addon="calendar">
      <div class="card-head"><div><h3>Цветовая нагрузка недели</h3><p class="small muted">Быстрый индикатор, чтобы не перегружать дни.</p></div><span class="v37-badge ${percent>75?'red':percent>45?'amber':'green'}">${percent}%</span></div>
      <div class="v37-load-meter"><b class="${cls}" style="width:${percent}%"></b></div>
      <div class="v37-grid two"><article class="v37-tile"><h4>Как читать цвета</h4><div class="v37-legend"><span class="v37-badge"><i class="v37-color green"></i>лёгкий день</span><span class="v37-badge amber"><i class="v37-color yellow"></i>средняя нагрузка</span><span class="v37-badge red"><i class="v37-color red"></i>перегруз</span><span class="v37-badge"><i class="v37-color blue"></i>важные события</span><span class="v37-badge"><i class="v37-color purple"></i>личное</span><span class="v37-badge"><i class="v37-color pink"></i>Полина</span></div></article><article class="v37-tile"><h4>Нагрузка по сферам на 7 дней</h4>${Object.entries(byArea).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="v37-row"><span>${esc(k)}</span><b>${v}</b></div>`).join('')||'<p>На неделю нагрузка не запланирована.</p>'}</article></div>
    </section>`;
  }
  function v37InjectCalendar(){
    try{
      if((page||'')!=='calendar' && (location.hash||'').replace('#','')!=='calendar') return;
      if(document.querySelector('[data-v37-addon="calendar"]')) return;
      const view=document.querySelector('#view'); if(!view) return;
      view.insertAdjacentHTML('afterbegin',v37CalendarAddonHtml());
    }catch(e){console.error('[V37 calendar addon]',e)}
  }

  const oldOpenProfileToolsV37=typeof openProfileTools==='function'?openProfileTools:null;
  openProfileTools=function(){
    v37EnsureState(); v37EnsureStyles();
    const sync=v37SyncState();
    openModal('Профиль, импорт, бэкап и синхронизация',`
      <div class="v37-grid two" style="margin-top:0">
        <article class="v37-backup-zone"><h3>Резервная копия данных</h3><p class="small muted">Сохрани файл перед большими правками. Его можно перенести на другое устройство и восстановить.</p><div class="row-actions"><button class="btn" data-v37-action="downloadBackup">Скачать бэкап</button><button class="ghost-btn" data-v37-action="openRestore">Восстановить</button></div></article>
        <article class="v37-backup-zone"><h3>Синхронизация устройств</h3><p class="small muted">Статус: ${esc(sync[1])}</p><div class="row-actions"><button class="ghost-btn" data-sync-action="syncSettings">Настроить</button><button class="ghost-btn" data-sync-action="syncPull">Загрузить</button><button class="btn" data-sync-action="syncPush">Сохранить</button></div></article>
      </div>
      <div class="grid cols-2" style="margin-top:14px"><button class="ghost-btn" data-go="diagnostics">Открыть диагностику</button><button class="ghost-btn" data-action="exportData">Старый экспорт JSON</button><button class="ghost-btn" data-action="restoreSections">Показать все папки</button><button class="ghost-btn" data-action="clearCache">Очистить кэш</button><button class="ghost-btn" data-action="setActualBalance">Фактический остаток</button></div>
      <div class="csv-import-box" style="margin-top:14px"><h3>Импорт CSV банка</h3><p class="small muted">Дубли удаляются автоматически.</p><input type="file" id="csvFile" accept=".csv,text/csv"><div class="row-actions" style="margin-top:10px"><button class="btn" data-action="importBankCsv">Импортировать CSV</button></div></div>
      <p class="small muted" style="margin-top:12px">Сборка: ${V37_BUILD}</p>`);
  };

  const oldRenderV37=typeof render==='function'?render:null;
  render=function(){
    v37EnsureState(); v37EnsureSections(); v37EnsureStyles();
    const current=(location.hash||'').replace('#','')||page||'dashboard';
    if(current==='diagnostics') page='diagnostics';
    const res=oldRenderV37?oldRenderV37():undefined;
    try{
      if((page||current)==='diagnostics'){
        const view=document.querySelector('#view'); if(view) view.innerHTML=v37DiagnosticsPage();
      }
      const v=document.querySelector('.version'); if(v) v.textContent=V37_LABEL;
      v37InjectFinance();
      v37InjectCalendar();
      setTimeout(v37FillDiagnostics,20);
    }catch(e){console.error('[V37 render]',e);try{toast('Ошибка V37: '+(e.message||e))}catch(_){}}
    return res;
  };

  window.__sbosV37Errors=window.__sbosV37Errors||[];
  window.addEventListener('error',e=>{try{window.__sbosV37Errors.push({message:e.message,source:e.filename,line:e.lineno,time:new Date().toISOString()});}catch(_){}},true);
  window.addEventListener('unhandledrejection',e=>{try{window.__sbosV37Errors.push({message:String(e.reason?.message||e.reason),time:new Date().toISOString()});}catch(_){}},true);

  window.addEventListener('click',function(e){
    const el=e.target.closest&&e.target.closest('[data-v37-action]');
    if(!el) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const a=el.dataset.v37Action;
    try{
      if(a==='downloadBackup') return v37DownloadBackup();
      if(a==='openRestore') return v37OpenRestore();
      if(a==='restoreBackup') return v37RestoreBackup();
      if(a==='setDailyLimit') return v37SetDailyLimit();
    }catch(err){console.error('[V37 action]',err);try{toast('Ошибка: '+(err.message||err))}catch(_){}}
  },true);

  try{v37EnsureState();v37EnsureSections();v37EnsureStyles();save();render();}catch(e){console.error('[V37 init]',e)}
})();


/* ===== V38 Auto Sync + Subconscious Diary: stable add-on over V37 ===== */
(function(){
  const V38_LABEL='V38 · АВТОСИНХРОНИЗАЦИЯ + ДНЕВНИК';
  const V38_BUILD='second-brain-space-v38-auto-sync-subconscious-20260706';
  let v38SyncBusy=false;
  let v38SyncTimer=null;
  let v38AutoPullTimer=null;

  try{ localStorage.setItem('secondBrainOS.currentBuild',V38_BUILD); }catch(e){}

  function v38Now(){return new Date().toISOString()}
  function v38EnsureState(){
    state=state||{};
    state.settings=state.settings||{};
    state.settings.sync=Object.assign({provider:'github-gist',gistId:'',token:'',filename:'second-brain-os-sync.json',auto:false,lastPull:'',lastPush:'',lastError:'',updatedAt:'',lastAutoSync:'',lastAutoCheck:'',autoIntervalMin:3},state.settings.sync||{});
    state.subconsciousEntries=Array.isArray(state.subconsciousEntries)?state.subconsciousEntries:[];
    return state;
  }
  function v38SyncCfg(){v38EnsureState();return state.settings.sync||{};}
  function v38HasCloud(){const c=v38SyncCfg();return Boolean(c.gistId&&(c.token||true));}
  function v38AddSection(){
    try{
      if(Array.isArray(SECTIONS) && !SECTIONS.some(s=>s.id==='subconscious')){
        const idx=SECTIONS.findIndex(s=>s.id==='personal');
        SECTIONS.splice(idx>=0?idx+1:SECTIONS.length,0,{id:'subconscious',label:'Дневник подсознания',icon:'🪞',color:'#8b5cf6',group:'ЛИЧНОЕ'});
      }
    }catch(e){}
  }

  function v38EnsureStyles(){
    if(document.getElementById('v38-style')) return;
    const st=document.createElement('style');
    st.id='v38-style';
    st.textContent=`
      #view .v38-grid{display:grid;gap:14px}.v38-grid.two{grid-template-columns:1.25fr .75fr}.v38-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.v38-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}
      #view .v38-card{border:1px solid #e7edf6;background:rgba(255,255,255,.94);border-radius:22px;padding:16px;box-shadow:0 10px 28px rgba(15,23,42,.04)}
      #view .v38-soft{background:linear-gradient(135deg,#fff,#f8fbff)}#view .v38-purple{background:linear-gradient(135deg,#faf5ff,#fff);border-color:#e9d5ff}#view .v38-green{background:linear-gradient(135deg,#ecfdf5,#fff);border-color:#bbf7d0}#view .v38-amber{background:linear-gradient(135deg,#fffbeb,#fff);border-color:#fde68a}#view .v38-blue{background:linear-gradient(135deg,#eff6ff,#fff);border-color:#bfdbfe}
      #view .v38-kpi h4{margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em}#view .v38-kpi .value{font-size:30px;margin:0}
      #view .v38-diary-hero{background:radial-gradient(circle at 15% 10%,rgba(139,92,246,.16),transparent 35%),linear-gradient(135deg,#fff,#f8fbff);border:1px solid #e9d5ff;border-radius:28px;padding:20px;box-shadow:0 16px 42px rgba(15,23,42,.06)}
      #view .v38-question{display:grid;gap:8px;padding:14px;border:1px solid #edf2f7;border-radius:18px;background:#fff}#view .v38-question b{color:#0f172a}#view .v38-question textarea{min-height:86px;border:1px solid #dbe4f0;border-radius:16px;padding:12px;resize:vertical;background:#fbfdff;font:inherit;color:#0f172a}
      #view .v38-input-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}#view .v38-input-row .field{margin:0}
      #view .v38-history{display:grid;gap:10px}#view .v38-entry{border:1px solid #e7edf6;border-radius:18px;background:#fff;padding:14px;display:grid;gap:8px}#view .v38-entry .row-actions{margin-top:2px}
      #view .v38-sync-panel{border:1px solid #bfdbfe;background:linear-gradient(135deg,#eff6ff,#fff);border-radius:22px;padding:14px;display:grid;gap:10px;margin-top:14px}
      #view .v38-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #dbeafe;background:#eef5ff;color:#2563eb;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900;line-height:1}.v38-pill.green{background:#ecfdf5;border-color:#bbf7d0;color:#15803d}.v38-pill.red{background:#fff1f2;border-color:#fecaca;color:#dc2626}.v38-pill.amber{background:#fffbeb;border-color:#fde68a;color:#b45309}
      #view .v38-autosync-dot{width:9px;height:9px;border-radius:999px;background:#f59e0b;display:inline-block}.v38-autosync-dot.ok{background:#10b981}.v38-autosync-dot.err{background:#ef4444}
      @media(max-width:980px){#view .v38-grid.two,#view .v38-grid.three,#view .v38-grid.four,#view .v38-input-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function v38SubPrompts(dateStr){
    const sets=[
      {quote:'Тишина часто говорит честнее, чем тревога.',qs:['Что я сегодня чувствую на самом деле, если не пытаться выглядеть сильным?','Где я сейчас себя обманываю или откладываю важное?','Что моё тело пытается мне подсказать?','Какое одно действие сегодня вернёт мне спокойствие?','Что мне важно признать, но не ругать себя за это?']},
      {quote:'Внутренний порядок начинается с одного честного ответа.',qs:['Какая мысль чаще всего возвращалась сегодня?','Чего я избегаю и почему?','Что сегодня дало мне энергию?','Что забрало силы сильнее всего?','Какой маленький шаг завтра поможет мне стать устойчивее?']},
      {quote:'Не всё нужно решать сразу. Но всё можно услышать.',qs:['Какая эмоция сегодня была главной?','Что я хочу контролировать слишком сильно?','Где мне нужна поддержка, а не давление?','Что я могу отпустить хотя бы на 1 день?','Какой честный вывод я забираю из сегодняшнего дня?']},
      {quote:'Забота о себе — это система, а не настроение.',qs:['Что сегодня было хорошим, даже если день был тяжёлым?','Что я сделал правильно?','Где я перегрузил себя?','Как я могу проявить к себе уважение вечером?','Какую мысль я хочу оставить в этом дне, а не тащить дальше?']},
      {quote:'Подсознание часто отвечает образами, телом и повторяющимися мыслями.',qs:['Какой образ лучше всего описывает мой день?','Какая ситуация зацепила сильнее всего?','Что в этой ситуации было про меня?','Какая потребность стоит за моей реакцией?','Что я могу сделать мягко, без рывка?']},
      {quote:'Самый сильный план начинается с честного состояния.',qs:['На сколько из 10 я сегодня в ресурсе и почему?','Что я делаю из страха?','Что я делаю из любви к себе и близким?','Какая финансовая/личная мысль требует внимания?','Какой один спокойный шаг я выбираю?']},
      {quote:'Отклик — это не отчёт. Это разговор с собой.',qs:['Что сегодня хочется сказать самому себе без цензуры?','Где я почувствовал напряжение?','Что мне сейчас важно защитить?','Что мне хочется создать или изменить?','Какая фраза станет опорой на завтра?']}
    ];
    const d=new Date(dateStr||today());
    const idx=Math.abs(Math.floor(d.getTime()/86400000))%sets.length;
    return sets[idx];
  }
  function v38DiaryEntry(date=today()){v38EnsureState();return state.subconsciousEntries.find(e=>e.date===date)||null;}
  function v38DiaryStreak(){
    v38EnsureState();
    const dates=new Set(state.subconsciousEntries.map(e=>e.date));
    let c=0,d=new Date(today());
    while(dates.has(iso(d))){c++;d=addDays(d,-1)}
    return c;
  }
  function v38MoodAvg(){
    const arr=state.subconsciousEntries.slice(-14).map(e=>num(e.mood)).filter(Boolean);
    if(!arr.length) return '—';
    return (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1);
  }
  function v38SubconsciousPage(){
    v38EnsureState(); v38EnsureStyles();
    const current=state.settings.subconsciousCurrentDate||today();
    const entry=v38DiaryEntry(current)||{date:current,mood:'',energy:'',body:'',summary:'',promise:'',answers:[]};
    const prompt=v38SubPrompts(current);
    const last=state.subconsciousEntries.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
    return layout('Дневник подсознания','Ежедневный отклик себе: состояние, тело, честные мысли, вывод и маленькое действие.',`
      <section class="v38-grid four">
        <article class="v38-card v38-kpi v38-purple"><h4>Записей</h4><div class="value sm blue">${state.subconsciousEntries.length}</div><p class="small muted">в дневнике</p></article>
        <article class="v38-card v38-kpi v38-green"><h4>Стрик</h4><div class="value sm green">${v38DiaryStreak()}</div><p class="small muted">дней подряд</p></article>
        <article class="v38-card v38-kpi v38-amber"><h4>Среднее состояние</h4><div class="value sm amber">${v38MoodAvg()}</div><p class="small muted">за последние записи</p></article>
        <article class="v38-card v38-kpi v38-blue"><h4>Последняя запись</h4><div class="value sm blue">${last?fmt(last.date):'—'}</div><p class="small muted">${last?esc((last.summary||'без вывода').slice(0,42)):'начни сегодня'}</p></article>
      </section>
      <section class="v38-grid two" style="margin-top:16px">
        <article class="v38-diary-hero">
          <div class="card-head"><div><h3>Отклик дня</h3><p class="small muted">${esc(prompt.quote)}</p></div><span class="v38-pill">🪞 ${fmt(current)}</span></div>
          <div class="v38-input-row" style="margin:14px 0">
            <div class="field"><label>Дата</label><input id="v38_sub_date" type="date" value="${esc(current)}"></div>
            <div class="field"><label>Состояние 1–10</label><input id="v38_sub_mood" type="number" min="1" max="10" value="${esc(entry.mood||'')}"></div>
            <div class="field"><label>Энергия 1–10</label><input id="v38_sub_energy" type="number" min="1" max="10" value="${esc(entry.energy||'')}"></div>
          </div>
          <div class="v38-question" style="margin-bottom:10px"><b>Что говорит тело?</b><textarea id="v38_sub_body" placeholder="Например: напряжение, усталость, тепло, тревога, спокойствие...">${esc(entry.body||'')}</textarea></div>
          <div class="v38-grid" style="gap:10px">
            ${prompt.qs.map((q,i)=>`<div class="v38-question"><b>${i+1}. ${esc(q)}</b><textarea id="v38_sub_q_${i}" placeholder="Ответь честно, можно коротко...">${esc((entry.answers||[])[i]||'')}</textarea></div>`).join('')}
          </div>
          <div class="v38-input-row" style="margin-top:12px;grid-template-columns:1fr 1fr">
            <div class="field"><label>Главный вывод дня</label><textarea id="v38_sub_summary" style="min-height:96px">${esc(entry.summary||'')}</textarea></div>
            <div class="field"><label>Маленькое обещание себе</label><textarea id="v38_sub_promise" style="min-height:96px">${esc(entry.promise||'')}</textarea></div>
          </div>
          <div class="row-actions" style="margin-top:14px"><button class="btn" data-v38-action="saveSubconscious">Сохранить отклик</button><button class="ghost-btn" data-v38-action="subToday">Сегодня</button><button class="ghost-btn" data-v38-action="subPrev">← Вчера</button><button class="ghost-btn" data-v38-action="subNext">Завтра →</button></div>
        </article>
        <aside class="v38-grid">
          <article class="v38-card v38-soft"><div class="card-head"><div><h3>Зачем это нужно</h3><p class="small muted">Это не психология ради психологии, а ежедневная самонастройка.</p></div><span class="v38-pill green">5 минут</span></div><ul class="small muted"><li>видишь повторяющиеся тревоги и желания;</li><li>отделяешь реальное состояние от импульса;</li><li>лучше понимаешь, что даёт и забирает энергию;</li><li>каждый день заканчивается маленьким действием.</li></ul></article>
          <article class="v38-card"><div class="card-head"><h3>История откликов</h3><button class="ghost-btn" data-v38-action="subToday">Сегодня</button></div><div class="v38-history">${state.subconsciousEntries.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,12).map(e=>`<div class="v38-entry"><div class="card-head"><div><b>${fmt(e.date)}</b><div class="small muted">Состояние ${esc(e.mood||'—')} · энергия ${esc(e.energy||'—')}</div></div><span class="v38-pill">${esc((e.summary||'отклик').slice(0,24))}</span></div><p class="small muted">${esc((e.summary||e.promise||'Без вывода').slice(0,120))}</p><div class="row-actions"><button class="mini blue" data-v38-action="openSubconscious" data-date="${esc(e.date)}">Открыть</button><button class="mini red" data-v38-action="deleteSubconscious" data-date="${esc(e.date)}">Удалить</button></div></div>`).join('')||'<div class="v38-entry"><p class="small muted">Пока нет записей. Начни с сегодняшнего отклика.</p></div>'}</div></article>
        </aside>
      </section>
    `);
  }
  function v38SaveSubconscious(){
    v38EnsureState();
    const date=$('#v38_sub_date')?.value||today();
    const old=v38DiaryEntry(date)||{};
    const answers=Array.from({length:5},(_,i)=>$(`#v38_sub_q_${i}`)?.value||'');
    const obj={...old,id:old.id||uid(),date,mood:$('#v38_sub_mood')?.value||'',energy:$('#v38_sub_energy')?.value||'',body:$('#v38_sub_body')?.value||'',answers,summary:$('#v38_sub_summary')?.value||'',promise:$('#v38_sub_promise')?.value||'',updatedAt:v38Now()};
    state.subconsciousEntries=state.subconsciousEntries.filter(e=>e.date!==date);
    state.subconsciousEntries.unshift(obj);
    state.settings.subconsciousCurrentDate=date;
    save(); render(); try{toast('Отклик сохранён')}catch(e){}
  }
  function v38SetSubDate(date){v38EnsureState();state.settings.subconsciousCurrentDate=date;save();render();}
  function v38DeleteSub(date){v38EnsureState();if(!confirm('Удалить отклик за '+fmt(date)+'?'))return;state.subconsciousEntries=state.subconsciousEntries.filter(e=>e.date!==date);save();render();try{toast('Отклик удалён')}catch(e){} }

  function v38PersonalCount(id){
    const map={subconscious:state.subconsciousEntries,people:state.people,notes:state.notes,ideas:state.ideas,wishes:state.wishes,books:state.books,films:state.films,trips:state.trips,documents:state.documents};
    if(id==='polina') return Math.max(Array.isArray(state.polinaDays)?state.polinaDays.length:0,2);
    return Array.isArray(map[id])?map[id].length:0;
  }
  function v38PersonalPage(){
    v38EnsureState(); v38EnsureStyles();
    const sync=v38SyncCfg();
    const folders=[
      ['polina','Полина','🌸','rgba(236,72,153,.12)','#ec4899'],
      ['subconscious','Дневник подсознания','🪞','rgba(139,92,246,.12)','#8b5cf6'],
      ['people','Люди','👥','rgba(124,58,237,.12)','#7c3aed'],
      ['notes','Заметки','✏️','rgba(249,115,22,.12)','#f97316'],
      ['ideas','Идеи','💡','rgba(234,179,8,.14)','#eab308'],
      ['wishes','Желания','💗','rgba(236,72,153,.12)','#ec4899'],
      ['books','Книги','🚩','rgba(34,197,94,.12)','#22c55e'],
      ['films','Фильмы','🎬','rgba(139,92,246,.12)','#8b5cf6'],
      ['trips','Путешествия','✈️','rgba(14,165,233,.12)','#0ea5e9'],
      ['documents','Документы','📄','rgba(6,182,212,.12)','#06b6d4']
    ];
    const status=sync.gistId?(sync.auto?'☁️ Автосинхронизация включена':'☁️ Облако подключено, авто выкл.'):'☁️ Синхронизация не настроена';
    return layout('Личное','Личная база: люди, заметки, идеи, желания, дневник подсознания, книги, фильмы, путешествия, документы и Полина.',`
      <section class="personal-v36-actions"><div class="personal-v36-sync-pill ${sync.gistId?'green':''}">${status}</div><div class="row-actions"><button class="ghost-btn" data-sync-action="syncSettings">Настроить синхронизацию</button><button class="ghost-btn" data-v38-action="syncNow">Синхронизировать сейчас</button><button class="btn" data-sync-action="syncPush">Сохранить в облако</button></div></section>
      <section class="v38-sync-panel"><div class="card-head"><div><h3>Автоматическая синхронизация</h3><p class="small muted">После настройки GitHub Gist приложение само загружает свежие данные при входе, при возвращении на вкладку и периодически проверяет облако.</p></div><span class="v38-pill ${sync.auto&&sync.gistId?'green':'amber'}"><i class="v38-autosync-dot ${sync.lastError?'err':sync.gistId?'ok':''}"></i>${sync.auto&&sync.gistId?'авто':'нужно настроить'}</span></div><div class="small muted">Последняя выгрузка: ${sync.lastPush?new Date(sync.lastPush).toLocaleString('ru-RU'):'—'} · загрузка: ${sync.lastPull?new Date(sync.lastPull).toLocaleString('ru-RU'):'—'} ${sync.lastError?' · ошибка: '+esc(sync.lastError):''}</div></section>
      <section class="personal-v36-list">${folders.map(([id,title,icon,bg,color])=>`<button type="button" class="personal-v36-row" data-go="${id}" aria-label="Открыть ${esc(title)}"><span class="personal-v36-icon" style="background:${bg};color:${color}">${icon}</span><div class="personal-v36-text"><h3>${esc(title)}</h3><p>${v38PersonalCount(id)} записей</p></div><span class="personal-v36-chevron">›</span></button>`).join('')}</section>
    `);
  }

  function v38CloudPayload(){
    v38EnsureState();
    const clean=JSON.parse(JSON.stringify(state));
    if(clean.settings&&clean.settings.sync) clean.settings.sync.token='';
    return {app:'Second Brain OS',format:2,build:V38_BUILD,updatedAt:v38Now(),state:clean};
  }
  function v38AuthHeaders(){const c=v38SyncCfg();const h={'Accept':'application/vnd.github+json','Content-Type':'application/json'};if(c.token)h.Authorization='Bearer '+String(c.token).trim();return h;}
  async function v38ReadCloud(){
    const c=v38SyncCfg();
    if(!c.gistId) throw new Error('Gist ID не задан');
    const res=await fetch(`https://api.github.com/gists/${encodeURIComponent(String(c.gistId).trim())}`,{headers:v38AuthHeaders(),cache:'no-store'});
    if(!res.ok) throw new Error('GitHub Gist: '+res.status);
    const data=await res.json();
    const filename=c.filename||'second-brain-os-sync.json';
    const file=data.files?.[filename] || Object.values(data.files||{}).find(f=>f.filename===filename) || Object.values(data.files||{})[0];
    if(!file||!file.content) throw new Error('Файл синхронизации не найден');
    return JSON.parse(file.content);
  }
  async function v38WriteCloud(){
    const c=v38SyncCfg();
    if(!c.gistId||!c.token) throw new Error('Нужны Gist ID и token');
    const filename=c.filename||'second-brain-os-sync.json';
    const payload=v38CloudPayload();
    const res=await fetch(`https://api.github.com/gists/${encodeURIComponent(String(c.gistId).trim())}`,{method:'PATCH',headers:v38AuthHeaders(),body:JSON.stringify({files:{[filename]:{content:JSON.stringify(payload,null,2)}}})});
    if(!res.ok) throw new Error('GitHub Gist: '+res.status);
    state.settings.sync.lastPush=v38Now();
    state.settings.sync.lastError='';
    state.settings.sync.updatedAt=payload.updatedAt;
    save();
    return payload;
  }
  async function v38PullIfNewer(showToast=false,force=false){
    v38EnsureState();
    const c=v38SyncCfg();
    if(!c.gistId||v38SyncBusy) return false;
    try{
      v38SyncBusy=true;
      if(showToast) toast('Проверяю облако...');
      const cloud=await v38ReadCloud();
      const incoming=cloud.state||cloud;
      const remote=Date.parse(cloud.updatedAt||incoming?.settings?.sync?.updatedAt||0)||0;
      const local=Date.parse(c.updatedAt||0)||0;
      if(force || remote>local || !c.lastPull){
        const keep={...c,token:c.token||'',lastPull:v38Now(),lastError:'',lastAutoSync:v38Now()};
        state=normalize(incoming);
        state.settings=state.settings||{};
        state.settings.sync={...(state.settings.sync||{}),...keep,gistId:c.gistId,token:c.token||'',filename:c.filename||'second-brain-os-sync.json',auto:c.auto!==false,updatedAt:cloud.updatedAt||v38Now()};
        state.subconsciousEntries=Array.isArray(state.subconsciousEntries)?state.subconsciousEntries:[];
        save(); render();
        if(showToast) toast('Загружена свежая версия из облака');
        return true;
      }
      state.settings.sync.lastAutoCheck=v38Now(); state.settings.sync.lastError=''; save();
      if(showToast) toast('Облако проверено: локальная версия актуальна');
      return false;
    }catch(e){state.settings.sync.lastError=e.message||String(e);save();if(showToast)toast('Ошибка синхронизации: '+state.settings.sync.lastError);return false;}
    finally{v38SyncBusy=false;}
  }
  async function v38PushNow(showToast=false){
    v38EnsureState(); if(v38SyncBusy) return;
    try{v38SyncBusy=true;if(showToast)toast('Сохраняю в облако...');await v38WriteCloud();if(showToast)toast('Сохранено в облако');}
    catch(e){state.settings.sync.lastError=e.message||String(e);save();if(showToast)toast('Ошибка синхронизации: '+state.settings.sync.lastError)}
    finally{v38SyncBusy=false;}
  }
  async function v38SyncNow(){
    const pulled=await v38PullIfNewer(true,false);
    if(!pulled) await v38PushNow(true);
  }
  function v38ScheduleAutoPush(){
    const c=v38SyncCfg();
    if(!c.auto||!c.gistId||!c.token) return;
    clearTimeout(v38SyncTimer);
    v38SyncTimer=setTimeout(()=>v38PushNow(false),2500);
  }
  function v38StartAutoSync(){
    v38EnsureState();
    const c=v38SyncCfg();
    if(c.gistId && c.token && c.auto!==false) state.settings.sync.auto=true;
    const interval=Math.max(1,num(c.autoIntervalMin)||3)*60000;
    clearInterval(v38AutoPullTimer);
    v38AutoPullTimer=setInterval(()=>{const cfg=v38SyncCfg();if(cfg.auto&&cfg.gistId)v38PullIfNewer(false,false)},interval);
    setTimeout(()=>{const cfg=v38SyncCfg();if(cfg.auto&&cfg.gistId)v38PullIfNewer(false,false)},1500);
  }

  const oldSaveV38=typeof save==='function'?save:null;
  if(oldSaveV38){
    save=function(){
      v38EnsureState();
      state.settings.sync.updatedAt=state.settings.sync.updatedAt||v38Now();
      const res=oldSaveV38();
      try{localStorage.setItem('secondBrainOS.currentBuild',V38_BUILD)}catch(e){}
      try{v38ScheduleAutoPush()}catch(e){}
      return res;
    };
  }

  function v38ForcePage(){
    try{
      v38EnsureState(); v38EnsureStyles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      const view=document.querySelector('#view'); if(!view) return;
      if(current==='personal'||page==='personal') view.innerHTML=v38PersonalPage();
      if(current==='subconscious'||page==='subconscious') view.innerHTML=v38SubconsciousPage();
      const v=document.querySelector('.version'); if(v) v.textContent=V38_LABEL;
    }catch(e){console.error('[V38 force page]',e);try{toast('Ошибка V38: '+(e.message||e))}catch(_){}}
  }

  const oldRenderV38=typeof render==='function'?render:null;
  if(oldRenderV38){
    render=function(){
      v38EnsureState(); v38AddSection(); v38EnsureStyles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      if(current==='subconscious') page='subconscious';
      const res=oldRenderV38();
      setTimeout(v38ForcePage,0);
      return res;
    };
  }

  window.addEventListener('click',function(e){
    const el=e.target.closest&&e.target.closest('[data-v38-action]');
    if(!el) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const a=el.dataset.v38Action;
    try{
      if(a==='saveSubconscious') return v38SaveSubconscious();
      if(a==='openSubconscious') return v38SetSubDate(el.dataset.date||today());
      if(a==='deleteSubconscious') return v38DeleteSub(el.dataset.date||today());
      if(a==='subToday') return v38SetSubDate(today());
      if(a==='subPrev'){const d=state.settings.subconsciousCurrentDate||today();return v38SetSubDate(iso(addDays(new Date(d),-1)));}
      if(a==='subNext'){const d=state.settings.subconsciousCurrentDate||today();return v38SetSubDate(iso(addDays(new Date(d),1)));}
      if(a==='syncNow') return v38SyncNow();
    }catch(err){console.error('[V38 action]',err);try{toast('Ошибка: '+(err.message||err))}catch(_){}}
  },true);

  window.addEventListener('hashchange',()=>setTimeout(v38ForcePage,0));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){const c=v38SyncCfg();if(c.auto&&c.gistId)v38PullIfNewer(false,false);}});
  window.addEventListener('focus',()=>{const c=v38SyncCfg();if(c.auto&&c.gistId)v38PullIfNewer(false,false);});

  try{v38EnsureState();v38AddSection();v38EnsureStyles();save();render();v38StartAutoSync();}catch(e){console.error('[V38 init]',e)}
})();


/* ===== V39 CSV Bank Import Fix: reliable file picker, drag/drop, paste, robust parser ===== */
(function(){
  const V39_BUILD='second-brain-space-v39-csv-import-fix-20260707';
  const V39_LABEL='V39 · CSV ИМПОРТ · FIX';
  let v39LastCsvFile=null;

  try{ localStorage.setItem('secondBrainOS.currentBuild',V39_BUILD); }catch(e){}

  function v39EnsureCsvStyles(){
    if(document.getElementById('v39-csv-style')) return;
    const st=document.createElement('style');
    st.id='v39-csv-style';
    st.textContent=`
      .v39-csv-import{border:1px solid #dbeafe!important;background:linear-gradient(135deg,#f8fbff,#fff)!important;border-radius:20px!important;padding:14px!important;margin-top:12px!important}
      .v39-csv-pick-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
      .v39-csv-status{font-size:12px;color:#64748b;font-weight:800;margin-top:7px;line-height:1.35}
      .v39-csv-drop{border:1px dashed #bfdbfe;background:#f8fbff;border-radius:16px;padding:12px;color:#64748b;font-size:12px;font-weight:800;margin:10px 0}
      .v39-csv-drop.drag{background:#eef5ff;border-color:#2563eb;color:#2563eb}
      .v39-csv-hint{font-size:12px;color:#64748b;line-height:1.45;margin-top:8px}
      .v39-csv-hint b{color:#0f172a}
    `;
    document.head.appendChild(st);
  }

  function v39CsvBoxes(){
    const inputs=[...document.querySelectorAll('input[type="file"]')].filter(i=>String(i.accept||'').toLowerCase().includes('csv'));
    const boxes=[];
    inputs.forEach(input=>{
      const box=input.closest('.card')||input.closest('.csv-import-box')||input.parentElement;
      if(box && !boxes.includes(box)) boxes.push(box);
    });
    return boxes;
  }

  function v39DecorateCsvInputs(){
    try{
      v39EnsureCsvStyles();
      v39CsvBoxes().forEach((box,idx)=>{
        const input=box.querySelector('input[type="file"]');
        if(!input) return;
        input.setAttribute('accept','.csv,text/csv,text/plain,.txt');
        input.dataset.v39CsvInput='1';
        input.style.maxWidth='100%';
        box.classList.add('v39-csv-import');
        if(!box.querySelector('.v39-csv-pick-row')){
          const row=document.createElement('div');
          row.className='v39-csv-pick-row';
          row.innerHTML=`<button class="ghost-btn" data-v39-action="pickCsvFile">Выбрать CSV / TXT</button><button class="ghost-btn" data-v39-action="openCsvPaste">Вставить CSV текстом</button>`;
          input.insertAdjacentElement('beforebegin',row);
        }
        if(!box.querySelector('.v39-csv-drop')){
          const drop=document.createElement('div');
          drop.className='v39-csv-drop';
          drop.textContent='Можно перетащить CSV-файл банка прямо сюда';
          input.insertAdjacentElement('afterend',drop);
        }
        if(!box.querySelector('.v39-csv-status')){
          const status=document.createElement('div');
          status.className='v39-csv-status';
          status.textContent=input.files&&input.files[0] ? `Выбран файл: ${input.files[0].name}` : (v39LastCsvFile?`Выбран файл: ${v39LastCsvFile.name}`:'Файл пока не выбран');
          input.insertAdjacentElement('afterend',status);
        }else{
          const status=box.querySelector('.v39-csv-status');
          status.textContent=input.files&&input.files[0] ? `Выбран файл: ${input.files[0].name}` : (v39LastCsvFile?`Выбран файл: ${v39LastCsvFile.name}`:'Файл пока не выбран');
        }
        if(!box.querySelector('.v39-csv-hint')){
          const hint=document.createElement('div');
          hint.className='v39-csv-hint';
          hint.innerHTML='<b>Поддержка:</b> CSV из банка с разделителем ; , TAB, даты 2026-07-07 / 07.07.2026, кодировка UTF-8 или Windows-1251. Дубли пропускаются автоматически.';
          box.appendChild(hint);
        }
      });
      const v=document.querySelector('.version'); if(v) v.textContent=V39_LABEL;
    }catch(e){console.error('[V39 decorate csv]',e)}
  }

  function v39ClosestCsvBox(el){
    return el?.closest?.('.v39-csv-import,.card,.csv-import-box')||document;
  }
  function v39FindCsvInput(el){
    const box=v39ClosestCsvBox(el);
    return box.querySelector?.('input[type="file"][data-v39-csv-input],input[type="file"][accept*="csv"],input[type="file"]') || document.querySelector('input[type="file"][data-v39-csv-input],input[type="file"][accept*="csv"],input[type="file"]');
  }
  function v39SetStatus(el,msg){
    const box=v39ClosestCsvBox(el);
    const s=box.querySelector?.('.v39-csv-status');
    if(s) s.textContent=msg;
  }

  async function v39ReadText(file){
    const buf=await file.arrayBuffer();
    const bytes=new Uint8Array(buf);
    let text='';
    try{text=new TextDecoder('utf-8',{fatal:false}).decode(bytes)}catch(e){text=''}
    const bad=(text.match(/\uFFFD/g)||[]).length;
    if(bad>2){
      try{text=new TextDecoder('windows-1251').decode(bytes)}catch(e){}
    }
    return String(text||'').replace(/^\uFEFF/,'');
  }

  function v39DetectDelimiter(lines){
    const sample=lines.slice(0,12).join('\n');
    const opts=[';',',','\t'];
    let best=';', score=-1;
    opts.forEach(d=>{
      let count=0, q=false;
      for(let i=0;i<sample.length;i++){
        const ch=sample[i];
        if(ch==='"') q=!q;
        else if(!q && ch===d) count++;
      }
      if(count>score){score=count;best=d;}
    });
    return best;
  }

  function v39ParseLine(line,delim){
    const out=[]; let cur='', q=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i], next=line[i+1];
      if(ch==='"'){
        if(q && next==='"'){cur+='"';i++;}
        else q=!q;
      }else if(!q && ch===delim){out.push(cur);cur='';}
      else cur+=ch;
    }
    out.push(cur);
    return out.map(x=>String(x||'').trim().replace(/^"|"$/g,''));
  }

  function v39ParseRows(text){
    const lines=String(text||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').map(x=>x.trim()).filter(Boolean);
    if(!lines.length) return [];
    const delim=v39DetectDelimiter(lines);
    return lines.map(line=>v39ParseLine(line,delim)).filter(r=>r.some(Boolean));
  }

  function v39NormHeader(s){return String(s||'').toLowerCase().replace(/[ё]/g,'е').replace(/\s+/g,' ').trim();}
  function v39FindHeaderIndex(headers,words){
    return headers.findIndex(h=>words.some(w=>h.includes(w)));
  }
  function v39Money(v){
    let s=String(v??'').replace(/\u00a0/g,' ').trim();
    if(!s) return 0;
    let neg=/^\(.*\)$/.test(s) || /^-/.test(s) || /расход|списан|debit|withdraw/i.test(s);
    s=s.replace(/[()₽ррубRUBrub]/g,'').replace(/\s/g,'').replace(/[+]/g,'');
    if((s.match(/,/g)||[]).length===1 && (s.match(/\./g)||[]).length===0) s=s.replace(',','.');
    else if(s.includes(',')&&s.includes('.')){
      if(s.lastIndexOf(',')>s.lastIndexOf('.')) s=s.replace(/\./g,'').replace(',','.');
      else s=s.replace(/,/g,'');
    }
    const n=parseFloat(s.replace(/[^0-9.\-]/g,''));
    if(!Number.isFinite(n)) return 0;
    return neg?-Math.abs(n):n;
  }
  function v39Date(v){
    const s=String(v||'').trim();
    let m=s.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/); if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    m=s.match(/(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})/); if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    return today();
  }
  function v39LooksHeader(row){
    const s=row.map(v39NormHeader).join(' | ');
    return /дата|date|сумма|amount|описание|назначение|операц|приход|расход|debit|credit/.test(s) && !/\d{1,2}[./-]\d{1,2}[./-]20\d{2}/.test(s);
  }
  function v39GuessCategory(note,type){
    const s=String(note||'').toLowerCase();
    if(type==='income') return 'Доход';
    if(/продукт|магнит|пятер|перекрест|лавка|market|ozon|wildberries|wb/i.test(s)) return 'Продукты / покупки';
    if(/такси|яндекс go|uber|транспорт|азс|бензин|топливо/i.test(s)) return 'Транспорт';
    if(/аптек|мед|клиник|стомат/i.test(s)) return 'Здоровье';
    if(/банк|кредит|займ|альфа|тинькофф|сбер/i.test(s)) return 'Долги / банк';
    if(/кафе|ресторан|кофе|еда/i.test(s)) return 'Кафе / еда';
    return 'Банк';
  }

  function v39RowsToOps(rows){
    if(!rows.length) return [];
    let header=null, data=rows;
    if(v39LooksHeader(rows[0])){ header=rows[0].map(v39NormHeader); data=rows.slice(1); }
    let idx={};
    if(header){
      idx.date=v39FindHeaderIndex(header,['дата операции','дата платежа','дата','date']);
      idx.amount=v39FindHeaderIndex(header,['сумма операции','сумма','amount']);
      idx.debit=v39FindHeaderIndex(header,['расход','списание','debit','withdraw']);
      idx.credit=v39FindHeaderIndex(header,['приход','доход','поступление','зачисление','credit','income']);
      idx.type=v39FindHeaderIndex(header,['тип операции','тип','type']);
      idx.category=v39FindHeaderIndex(header,['категория','category']);
      idx.note=v39FindHeaderIndex(header,['описание','назначение','комментар','контрагент','операция','details','description','merchant']);
    }
    const ops=[];
    data.forEach(row=>{
      if(!row || row.length<2) return;
      let date=today(), amount=0, type='', category='', note='';
      if(header){
        date=v39Date(row[idx.date]||row[0]);
        const debit=idx.debit>=0?v39Money(row[idx.debit]):0;
        const credit=idx.credit>=0?v39Money(row[idx.credit]):0;
        if(debit){amount=Math.abs(debit);type='expense';}
        if(credit){amount=Math.abs(credit);type='income';}
        if(!amount && idx.amount>=0){amount=v39Money(row[idx.amount]);type=amount<0?'expense':'income';amount=Math.abs(amount);}
        const t=idx.type>=0?v39NormHeader(row[idx.type]):'';
        if(t){ if(/расход|спис|debit|withdraw|покуп/i.test(t)) type='expense'; if(/доход|приход|поступ|зачис|credit|income/i.test(t)) type='income'; }
        category=idx.category>=0?row[idx.category]:'';
        note=idx.note>=0?row[idx.note]:row.filter(Boolean).slice(0,5).join(' · ');
      }else{
        const dateCell=row.find(x=>/20\d{2}|\d{1,2}[./-]\d{1,2}/.test(String(x)))||row[0];
        date=v39Date(dateCell);
        const amountCell=row.find(x=>Math.abs(v39Money(x))>0 && !/20\d{2}/.test(String(x)))||row[1];
        amount=v39Money(amountCell); type=amount<0?'expense':'income'; amount=Math.abs(amount);
        note=row.filter(x=>x!==dateCell&&x!==amountCell).slice(0,4).join(' · ')||'Импорт банка';
      }
      if(!amount) return;
      if(!type) type='expense';
      category=category||v39GuessCategory(note,type);
      ops.push({id:uid(),date,type,amount:Math.abs(amount),category,note:note||'Импорт банка'});
    });
    return ops;
  }

  function v39ApplyOps(ops){
    if(!ops.length) return {added:0,dups:0};
    const keys=new Set(state.operations.map(o=>`${o.date}|${o.type}|${num(o.amount)}|${String(o.category||'').trim()}|${String(o.note||'').trim()}`));
    let added=0, dups=0;
    ops.forEach(op=>{
      const k=`${op.date}|${op.type}|${num(op.amount)}|${String(op.category||'').trim()}|${String(op.note||'').trim()}`;
      if(keys.has(k)){dups++;return;}
      keys.add(k); state.operations.unshift(op); added++;
    });
    state.settings.lastCsvAdded=added;
    state.settings.lastCsvDuplicates=dups;
    state.settings.lastCsvAt=new Date().toISOString();
    save(); render();
    return {added,dups};
  }

  async function v39ImportText(text,sourceName='CSV'){
    const rows=v39ParseRows(text);
    if(!rows.length){toast('CSV пустой или не распознан');return;}
    const ops=v39RowsToOps(rows);
    if(!ops.length){toast('Не нашёл операций в CSV. Попробуй выгрузку с колонками дата/сумма/описание.');return;}
    const res=v39ApplyOps(ops);
    toast(`${sourceName}: добавлено ${res.added}, дублей ${res.dups}`);
  }

  async function v39ImportFile(file,el){
    if(!file){
      const input=v39FindCsvInput(el);
      if(input){ input.click(); v39SetStatus(el,'Выбери CSV-файл, затем нажми «Импортировать CSV» ещё раз.'); return; }
      toast('Не нашёл поле выбора CSV'); return;
    }
    v39LastCsvFile=file;
    v39SetStatus(el,`Выбран файл: ${file.name}. Импортирую...`);
    try{
      const text=await v39ReadText(file);
      await v39ImportText(text,file.name||'CSV');
    }catch(e){console.error('[V39 CSV import]',e);toast('Ошибка CSV: '+(e.message||e));}
  }

  async function v39ImportBankCsvFromButton(el){
    const input=v39FindCsvInput(el);
    const file=(input&&input.files&&input.files[0])||v39LastCsvFile;
    return v39ImportFile(file,el);
  }

  function v39OpenCsvPaste(){
    openModal('Вставить CSV банка текстом',`<div class="field span-2"><label>CSV-текст из банка</label><textarea id="v39CsvText" placeholder="Вставь сюда строки CSV: дата; сумма; категория; описание" style="min-height:260px"></textarea></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-v39-action="importCsvText">Импортировать текст</button></div><p class="small muted" style="margin-top:10px">Это запасной вариант, если браузер не видит выбранный файл или банк отдаёт нестандартную выгрузку.</p>`);
  }

  async function v39ImportCsvText(){
    const t=document.querySelector('#v39CsvText')?.value||'';
    await v39ImportText(t,'CSV текст');
    closeModal();
  }

  // Override old importer so old router also uses the fixed version.
  try{ importBankCsv = function(){ return v39ImportBankCsvFromButton(document.activeElement||document.body); }; }catch(e){}

  const oldRenderV39=typeof render==='function'?render:null;
  if(oldRenderV39){
    render=function(){
      const res=oldRenderV39();
      setTimeout(v39DecorateCsvInputs,0);
      return res;
    };
  }

  window.addEventListener('change',function(e){
    const input=e.target.closest&&e.target.closest('input[type="file"]');
    if(!input || !String(input.accept||'').toLowerCase().match(/csv|text|txt/)) return;
    const f=input.files&&input.files[0];
    if(f){ v39LastCsvFile=f; v39SetStatus(input,`Выбран файл: ${f.name}`); }
  },true);

  window.addEventListener('click',function(e){
    const actionEl=e.target.closest&&e.target.closest('[data-action="importBankCsv"],[data-v39-action]');
    if(!actionEl) return;
    const a=actionEl.dataset.v39Action || actionEl.dataset.action;
    if(!['importBankCsv','pickCsvFile','openCsvPaste','importCsvText'].includes(a)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if(a==='pickCsvFile'){ const input=v39FindCsvInput(actionEl); if(input) input.click(); else toast('Поле выбора CSV не найдено'); return; }
    if(a==='openCsvPaste') return v39OpenCsvPaste();
    if(a==='importCsvText') return v39ImportCsvText();
    if(a==='importBankCsv') return v39ImportBankCsvFromButton(actionEl);
  },true);

  window.addEventListener('dragover',function(e){
    const box=e.target.closest&&e.target.closest('.v39-csv-import');
    if(!box) return;
    e.preventDefault(); box.querySelector('.v39-csv-drop')?.classList.add('drag');
  },true);
  window.addEventListener('dragleave',function(e){
    const box=e.target.closest&&e.target.closest('.v39-csv-import');
    if(box) box.querySelector('.v39-csv-drop')?.classList.remove('drag');
  },true);
  window.addEventListener('drop',function(e){
    const box=e.target.closest&&e.target.closest('.v39-csv-import');
    if(!box) return;
    e.preventDefault(); box.querySelector('.v39-csv-drop')?.classList.remove('drag');
    const file=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
    if(file) v39ImportFile(file,box);
  },true);

  try{v39EnsureCsvStyles();v39DecorateCsvInputs();if(typeof render==='function')render();}catch(e){console.error('[V39 init]',e)}
})();


/* ===== V41 Force Update Hotfix + V40 Finance Cockpit ===== */
(function(){
  const V40_BUILD='second-brain-space-v43-expense-category-review-20260707';
  const V40_LABEL='V41 · ФИНАНСЫ · COCKPIT · HOTFIX';
  try{ localStorage.setItem('secondBrainOS.currentBuild',V40_BUILD); }catch(e){}

  function v40Ensure(){
    state.settings=state.settings||{};
    state.settings.financeTab=state.settings.financeTab||'overview';
    state.settings.dayLimit=state.settings.dayLimit||0;
    state.settings.alfaWorkerUrl=state.settings.alfaWorkerUrl||'';
    state.settings.alfaWorkerKey=state.settings.alfaWorkerKey||'';
    state.settings.alfaSyncStatus=state.settings.alfaSyncStatus||'Не подключено';
    state.settings.alfaLastSync=state.settings.alfaLastSync||'';
    state.settings.alfaLastImported=state.settings.alfaLastImported||0;
    state.settings.alfaLastDuplicates=state.settings.alfaLastDuplicates||0;
    state.settings.alfaConnectorMode=state.settings.alfaConnectorMode||'personal-card';
  }

  function v40Styles(){
    if(document.getElementById('v40-finance-cockpit-style')) return;
    const st=document.createElement('style');
    st.id='v40-finance-cockpit-style';
    st.textContent=`
      .v40-shell{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
      .v40-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
      .v40-tab{border:1px solid #dbeafe;background:#fff;color:#334155;border-radius:999px;padding:10px 14px;font-weight:900;cursor:pointer;box-shadow:0 8px 20px rgba(15,23,42,.035);transition:.16s ease}
      .v40-tab:hover{transform:translateY(-1px);border-color:#93c5fd;color:#2563eb}
      .v40-tab.active{background:#2563eb;color:#fff;border-color:#2563eb;box-shadow:0 14px 30px rgba(37,99,235,.2)}
      .v40-hero{border:1px solid #dbeafe;border-radius:28px;background:radial-gradient(circle at top left,rgba(59,130,246,.16),transparent 34%),linear-gradient(135deg,#fff,#f8fbff);padding:18px;box-shadow:0 20px 50px rgba(15,23,42,.06)}
      .v40-hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:16px;align-items:stretch}
      .v40-score{display:flex;gap:14px;align-items:center}
      .v40-score-ring{width:118px;height:118px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#2563eb var(--p),#e8f0ff 0);box-shadow:inset 0 0 0 14px #fff;border:1px solid #dbeafe;color:#0f172a;font-size:28px;font-weight:1000}
      .v40-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}
      .v40-kpi{border:1px solid #e5edf7;border-radius:20px;background:#fff;padding:14px;min-height:116px;box-shadow:0 10px 24px rgba(15,23,42,.035)}
      .v40-kpi .label{font-size:12px;color:#64748b;font-weight:900;margin-bottom:6px}
      .v40-kpi .num{font-size:27px;font-weight:1000;letter-spacing:-.04em}
      .v40-kpi .sub{font-size:12px;color:#64748b;margin-top:8px;line-height:1.35}
      .v40-alert{border:1px solid #e5edf7;background:#fff;border-radius:22px;padding:14px;display:flex;gap:12px;align-items:flex-start;margin-top:10px}
      .v40-alert .ico{width:38px;height:38px;border-radius:15px;display:grid;place-items:center;background:#eff6ff;font-size:18px;flex:0 0 38px}
      .v40-action-list{display:flex;flex-direction:column;gap:10px}
      .v40-action{display:flex;gap:12px;align-items:flex-start;padding:13px;border:1px solid #e5edf7;border-radius:18px;background:#fff}
      .v40-action .check{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;background:#eff6ff;color:#2563eb;font-weight:1000;flex:0 0 28px}
      .v40-mini-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #eef2f7}.v40-mini-row:last-child{border-bottom:0}
      .v40-section-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.v40-section-grid.thirds{grid-template-columns:1fr 1fr 1fr}
      .v40-insights{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.v40-insight{padding:14px;border:1px solid #e5edf7;border-radius:18px;background:#fff;min-height:112px}.v40-insight b{display:block;margin-bottom:5px}.v40-insight .tag{font-size:11px;text-transform:uppercase;color:#64748b;font-weight:900;letter-spacing:.04em}
      .v40-rule{border:1px solid #e5edf7;border-radius:18px;background:linear-gradient(180deg,#fff,#fbfdff);padding:14px}.v40-rule h4{margin:0 0 6px;font-size:14px}.v40-rule p{margin:0;color:#64748b;font-size:12px;line-height:1.45}
      .v40-bank-card{border:1px solid #dbeafe;border-radius:22px;background:linear-gradient(135deg,#fff,#f8fbff);padding:16px}.v40-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0f172a;color:#e2e8f0;border-radius:16px;padding:12px;overflow:auto;font-size:12px;line-height:1.45}.v40-muted-box{border:1px dashed #cbd5e1;border-radius:18px;background:#f8fbff;padding:13px;color:#64748b;font-size:12px;line-height:1.45}
      .v40-table{width:100%;border-collapse:separate;border-spacing:0 8px}.v40-table th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;text-align:left;padding:0 10px}.v40-table td{background:#fff;border-top:1px solid #e5edf7;border-bottom:1px solid #e5edf7;padding:11px 10px;font-size:13px}.v40-table td:first-child{border-left:1px solid #e5edf7;border-radius:14px 0 0 14px}.v40-table td:last-child{border-right:1px solid #e5edf7;border-radius:0 14px 14px 0}
      .v40-pressure{height:10px;border-radius:999px;background:#eef2ff;overflow:hidden}.v40-pressure b{display:block;height:100%;background:linear-gradient(90deg,#60a5fa,#2563eb);border-radius:999px}
      @media(max-width:1100px){.v40-hero-grid,.v40-section-grid,.v40-section-grid.thirds,.v40-insights,.v40-kpis{grid-template-columns:1fr}.v40-score{align-items:flex-start}.v40-score-ring{width:96px;height:96px;font-size:24px}}
    `;
    document.head.appendChild(st);
  }

  function v40DaysLeft(p){return Math.max(1, Math.ceil((new Date(p.end)-new Date(today()))/86400000)+1)}
  function v40Ops(p){return state.operations.filter(o=>inPeriod(o.date,p))}
  function v40Expenses(p){return v40Ops(p).filter(o=>o.type==='expense')}
  function v40Income(p){return v40Ops(p).filter(o=>o.type==='income')}
  function v40OutDebts(){return activeDebts().filter(d=>d.direction==='out')}
  function v40InDebts(){return activeDebts().filter(d=>d.direction==='in')}
  function v40DueDays(d){return d.due?Math.ceil((new Date(d.due)-new Date(today()))/86400000):9999}
  function v40DebtPriority(){return v40OutDebts().slice().sort((a,b)=>{const ao=a.due&&a.due<today()?0:1, bo=b.due&&b.due<today()?0:1;if(ao!==bo)return ao-bo;const ad=v40DueDays(a),bd=v40DueDays(b);if(ad!==bd)return ad-bd;return num(a.amount)-num(b.amount)})}
  function v40CategoryMap(p,type='expense'){const m={};v40Ops(p).filter(o=>o.type===type).forEach(o=>{m[o.category||'Без категории']=(m[o.category||'Без категории']||0)+num(o.amount)});return m}
  function v40TopCategory(p){const rows=Object.entries(v40CategoryMap(p,'expense')).sort((a,b)=>b[1]-a[1]);return rows[0]||['Нет расходов',0]}
  function v40DailyStats(p,t){const days=Math.max(1,Math.ceil((new Date(p.end)-new Date(p.start))/86400000)+1);const passed=Math.max(1,Math.ceil((new Date(today())-new Date(p.start))/86400000)+1);const daysLeft=v40DaysLeft(p);const spent=t.exp;const avg=spent/Math.max(1,passed);const projected=avg*days;return{days,passed,daysLeft,avg,projected}}
  function v40Model(){const p=periodInfo();const t=financeTotals(p);const out=v40OutDebts();const incDebts=v40InDebts();const overdue=out.filter(d=>d.due&&d.due<today());const due7=out.filter(d=>v40DueDays(d)>=0&&v40DueDays(d)<=7);const next=v40DebtPriority()[0];const stats=v40DailyStats(p,t);const baseLeft=state.settings.currentBalance+t.inc-t.exp-t.upcoming;const mandatory=total(overdue)+total(due7);const reserve=Math.max(0,Math.min(baseLeft-mandatory, Math.round(Math.max(0,baseLeft-mandatory)*0.2/500)*500));const debtPay=Math.max(0,Math.round(Math.max(mandatory, Math.max(0,baseLeft-reserve)*0.65)/500)*500);const free=Math.max(0,baseLeft-debtPay-reserve);const dayLimit=Math.max(0, Math.round(free/Math.max(1,stats.daysLeft)/100)*100);const scoreParts=[t.inc>0?25:5, t.exp<=t.inc?20:5, baseLeft>=0?20:5, overdue.length?0:15, reserve>0?10:2, dayLimit>0?10:2];const score=clamp(scoreParts.reduce((a,b)=>a+b,0),0,100);const top=v40TopCategory(p);return{p,t,out,incDebts,overdue,due7,next,stats,baseLeft,mandatory,reserve,debtPay,free,dayLimit,score,top};}
  function v40Tone(n){return n<0?'red':n>0?'green':'blue'}
  function v40StatusText(m){if(m.score>=80)return ['Финансово спокойно','green','Система в порядке: деньги, долги и резерв под контролем.'];if(m.score>=55)return ['Нужен контроль','amber','Есть рабочий запас, но важно не перегрузить месяц покупками и долгами.'];return ['Зона риска','red','Нужен режим защиты: только обязательные траты, долги по срокам и минимум в резерв.'];}
  function v40MainRisk(m){if(m.overdue.length)return `Просрочено ${money(total(m.overdue))}. Сначала закрыть или договориться по срокам.`;if(m.due7.length)return `В ближайшие 7 дней к оплате ${money(total(m.due7))}. Не планировать лишние покупки.`;if(m.t.upcoming>m.free)return `Плановые покупки ${money(m.t.upcoming)} давят на остаток. Часть лучше перенести.`;if(m.stats.projected>m.t.inc&&m.t.inc>0)return 'Темп расходов выше дохода. Нужен дневной лимит.';return 'Критических рисков не видно. Главное — не увеличивать долговую нагрузку.';}
  function v40MainAction(m){if(m.next)return `Приоритет долга: ${esc(m.next.person)} · ${money(m.next.amount)} · ${m.next.due?fmt(m.next.due):'без срока'}.`;if(m.reserve>0)return `Отложить ${money(m.reserve)} в резерв до любых необязательных трат.`;return `Держать дневной лимит ${money(m.dayLimit)} и не брать новые обязательства.`;}
  function v40Kpi(label,numText,sub,cls='blue'){return `<article class="v40-kpi"><div class="label">${label}</div><div class="num ${cls}">${numText}</div><div class="sub">${sub}</div></article>`}
  function v40Hero(m){const s=v40StatusText(m);return `<section class="v40-hero"><div class="v40-hero-grid"><div><div class="v40-score"><div class="v40-score-ring" style="--p:${m.score}%">${Math.round(m.score)}</div><div><h2 style="margin:0 0 6px">${s[0]}</h2><p class="small muted" style="max-width:680px">${s[2]}</p><div class="v40-alert"><div class="ico">⚠️</div><div><b>Главный риск</b><div class="small muted">${v40MainRisk(m)}</div></div></div><div class="v40-alert"><div class="ico">✅</div><div><b>Главное действие</b><div class="small muted">${v40MainAction(m)}</div></div></div></div></div></div><aside class="card" style="margin:0"><div class="card-head"><h3>Сегодняшний лимит</h3><span class="pill ${m.dayLimit>0?'green':'red'}">до конца месяца</span></div><div class="value sm ${m.dayLimit>0?'green':'red'}">${money(m.dayLimit)}</div><p class="small muted">Это свободный дневной лимит после базы, ближайших покупок, долга и резерва.</p><div class="v40-mini-row"><span>На долги</span><b class="red">${money(m.debtPay)}</b></div><div class="v40-mini-row"><span>В резерв</span><b class="green">${money(m.reserve)}</b></div><div class="v40-mini-row"><span>Свободно</span><b>${money(m.free)}</b></div></aside></div><div class="v40-kpis">${v40Kpi('Деньги сейчас',money(state.settings.currentBalance),'Факт, который ты проставил вручную.','blue')}${v40Kpi('Свободно после базы',money(m.baseLeft),'Факт + доходы − расходы − покупки.',v40Tone(m.baseLeft))}${v40Kpi('Долги к оплате 7 дней',money(total(m.due7)),'Ближайшая зона внимания.','red')}${v40Kpi('Можно отложить',money(m.reserve),'Резерв до необязательных трат.','green')}</div></section>`;}
  function v40ActionList(m){const items=[];items.push(`Держать дневной лимит ${money(m.dayLimit)} до конца периода.`);if(m.next)items.push(`Закрыть / частично закрыть: ${esc(m.next.person)} на ${money(Math.min(num(m.next.amount),Math.max(0,m.debtPay)))}.`);if(m.reserve>0)items.push(`Сразу отложить ${money(m.reserve)} в резерв.`);if(m.t.upcoming>0)items.push(`Проверить плановые покупки на ${money(m.t.upcoming)} и убрать необязательные.`);items.push(`Импортировать операции Альфа-Банка или CSV, чтобы аналитика была точной.`);return `<div class="v40-action-list">${items.slice(0,5).map((x,i)=>`<div class="v40-action"><div class="check">${i+1}</div><div><b>${x}</b><div class="small muted">Это действие уменьшает хаос и переводит финансы в управляемый режим.</div></div></div>`).join('')}</div>`}
  function v40Insights(m){const cat=m.top;const ops=v40Ops(m.p);const expOps=v40Expenses(m.p);const small=expOps.filter(o=>num(o.amount)<1000).length;const big=expOps.slice().sort((a,b)=>num(b.amount)-num(a.amount))[0];const purchasePressure=m.t.inc?Math.round(m.t.upcoming/Math.max(1,m.t.inc)*100):0;const pace=m.stats.projected-m.t.exp;const rows=[['Главная категория',`${cat[0]} · ${money(cat[1])}`,`Самая большая статья расходов за период.`],['Темп трат',`${money(m.stats.avg)} / день`,`Если темп сохранится, расходы будут около ${money(m.stats.projected)}.`],['Мелкие траты',`${small} операций до 1 000 ₽`,`Их лучше смотреть пачкой: именно они часто незаметно съедают остаток.`],['Крупная трата',big?`${money(big.amount)} · ${esc(big.category||'')}`:'Нет крупных трат',big?esc((big.note||'Без комментария').slice(0,90)):'За период крупных расходов не найдено.'],['Покупки будущих дней',`${money(m.t.upcoming)} · ${purchasePressure}% дохода`,`Плановые покупки заранее учитываются в прогнозе.`],['Операций в периоде',`${ops.length}`,`Чем чаще обновляешь данные банка, тем точнее рекомендации.`]];return `<div class="v40-insights">${rows.map(r=>`<article class="v40-insight"><span class="tag">${esc(r[0])}</span><b>${r[1]}</b><div class="small muted">${r[2]}</div></article>`).join('')}</div>`}
  function v40Rules(){const rules=[['Сначала защита','Перед тратами отделяй обязательные платежи, долги по срокам и минимальный резерв.'],['Дневной лимит','Каждый день смотри не общий баланс, а сколько можно потратить без провала месяца.'],['Долги по приоритету','Просрочки и ближайшие сроки идут первыми. Мелкие долги лучше закрывать быстро, чтобы снять шум.'],['Покупки заранее','Любая плановая покупка должна жить в месяце покупки и уменьшать прогноз заранее.'],['Данные важнее эмоций','Импорт банка раз в день/неделю убирает иллюзию “вроде нормально” и показывает факт.']];return `<div class="v40-section-grid thirds">${rules.map((r,i)=>`<article class="v40-rule"><h4>${i+1}. ${r[0]}</h4><p>${r[1]}</p></article>`).join('')}</div>`}
  function v40DebtScenarios(m){const totalDebt=total(m.out);const vals=[5000,10000,15000];return `<table class="v40-table"><thead><tr><th>Платёж</th><th>Срок выхода</th><th>Комментарий</th></tr></thead><tbody>${vals.map(v=>{const months=totalDebt?Math.ceil(totalDebt/v):0;const label=months?`${months} мес.`:'долгов нет';return `<tr><td><b>${money(v)}/мес</b></td><td>${label}</td><td>${months>0?`Ориентир без учёта новых долгов и процентов.`:'Можно переключиться на накопления.'}</td></tr>`}).join('')}</tbody></table>`}
  function v40CategoryBars(m){const rows=Object.entries(v40CategoryMap(m.p,'expense')).sort((a,b)=>b[1]-a[1]);const max=rows[0]?.[1]||1;return rows.length?`<div class="v27-category-bars">${rows.slice(0,8).map(([k,v])=>`<div class="v27-cat-row"><div><div class="small"><b>${esc(k)}</b></div><div class="track"><b style="width:${clamp(v/max*100)}%"></b></div></div><div class="small" style="text-align:right"><b>${money(v)}</b></div></div>`).join('')}</div>`:empty('Расходов пока нет')}
  function v40AlfaSetup(){return `<section class="v40-bank-card"><div class="card-head"><div><h3>Альфа-Банк API · личная карта</h3><p class="small muted">Подготовка к автоматическому забору операций через защищённый Cloudflare Worker.</p></div><span class="pill blue">личная карта</span></div><div class="v40-muted-box"><b>Важно:</b> банковские токены нельзя хранить в GitHub Pages или app.js. Они должны лежать только в секретах Cloudflare Worker. Приложение будет получать уже нормализованные операции.</div><div class="grid cols-2" style="margin-top:14px"><div class="field"><label>Worker URL</label><input id="v40AlfaUrl" value="${esc(state.settings.alfaWorkerUrl||'')}" placeholder="https://second-brain-alfa.xxx.workers.dev"></div><div class="field"><label>Ключ доступа к Worker</label><input id="v40AlfaKey" value="${esc(state.settings.alfaWorkerKey||'')}" placeholder="свой секретный ключ"></div></div><div class="row-actions" style="margin-top:12px"><button class="btn" data-v40-action="saveAlfaSettings">Сохранить настройки</button><button class="ghost-btn" data-v40-action="testAlfaConnector">Проверить Worker</button><button class="ghost-btn" data-v40-action="fetchAlfaOperations">Загрузить операции</button><button class="ghost-btn" data-v40-action="downloadWorkerTemplate">Скачать Worker-шаблон</button></div><div class="record-card" style="margin-top:14px"><b>Статус</b><div class="small muted">${esc(state.settings.alfaSyncStatus||'Не подключено')}</div><div class="small muted">Последняя синхронизация: ${state.settings.alfaLastSync?new Date(state.settings.alfaLastSync).toLocaleString('ru-RU'):'—'} · добавлено ${state.settings.alfaLastImported||0}, дублей ${state.settings.alfaLastDuplicates||0}</div></div><div class="grid cols-2" style="margin-top:14px"><article class="card"><h3>Пошагово</h3><ol class="small muted" style="line-height:1.65"><li>Зарегистрировать приложение в Alfa API / проверить доступ для личной карты.</li><li>Получить client_id / client_secret и нужные scopes.</li><li>Развернуть Cloudflare Worker из шаблона.</li><li>Добавить секреты в Worker, не в GitHub.</li><li>Один раз пройти OAuth-согласие.</li><li>Вставить Worker URL сюда и проверить загрузку.</li></ol></article><article class="card"><h3>Формат ответа Worker</h3><div class="v40-code">{\n  "operations": [\n    {"date":"2026-07-07", "type":"expense", "amount":1250, "category":"Продукты", "note":"Альфа · магазин"}\n  ]\n}</div></article></div></section>`}
  function v40ImportTab(m){return `<section class="v40-section-grid"><article class="card"><div class="card-head"><div><h3>Импорт CSV банка</h3><p class="small muted">Ручной вариант остаётся как резервный и быстрый способ.</p></div><span class="pill blue">V39 fix</span></div><div class="v39-csv-import"><input type="file" id="csvFileV40" data-v39-csv-input accept=".csv,text/csv,text/plain,.txt"><div class="v39-csv-pick-row"><button class="ghost-btn" data-v39-action="pickCsvFile">Выбрать CSV / TXT</button><button class="btn" data-action="importBankCsv">Импортировать CSV</button><button class="ghost-btn" data-v39-action="openCsvPaste">Вставить CSV текстом</button></div><div class="v39-csv-drop">Можно перетащить CSV сюда</div><div class="v39-csv-status">Последний импорт: добавлено ${state.settings.lastCsvAdded||0}, дублей ${state.settings.lastCsvDuplicates||0}</div><div class="v39-csv-hint"><b>Поддержка:</b> CSV Альфа-Банка и других банков с разделителем ; , TAB, UTF-8/Windows-1251.</div></div></article><article class="card"><div class="card-head"><h3>Что проверить после импорта</h3></div><div class="v40-action-list"><div class="v40-action"><div class="check">1</div><div><b>Категории</b><div class="small muted">Новые операции сначала могут попасть в категорию «Банк». Это нормально — их нужно уточнить.</div></div></div><div class="v40-action"><div class="check">2</div><div><b>Дубли</b><div class="small muted">Повторные операции не добавляются, если совпадают дата, тип, сумма, категория и описание.</div></div></div><div class="v40-action"><div class="check">3</div><div><b>Фактический остаток</b><div class="small muted">После импорта проставь остаток, чтобы прогноз был честным.</div></div></div></div></article></section><div style="margin-top:16px">${v40AlfaSetup()}</div>`}
  function v40Overview(m){return `${v40Hero(m)}<section class="v40-section-grid" style="margin-top:16px"><article class="card"><div class="card-head"><div><h3>Что делать сейчас</h3><p class="small muted">Короткий список действий вместо перегруза графиками.</p></div><span class="pill green">активный план</span></div>${v40ActionList(m)}</article><article class="card"><div class="card-head"><div><h3>Аналитика действий</h3><p class="small muted">Не просто цифры, а что они говорят о твоём поведении.</p></div></div>${v40Insights(m)}</article></section><section class="card" style="margin-top:16px"><div class="card-head"><div><h3>Правила финансовой грамотности внутри системы</h3><p class="small muted">Эти правила встроены в расчёты и рекомендации страницы.</p></div></div>${v40Rules()}</section>`}
  function v40ActionsTab(m){return `<section class="v40-section-grid"><article class="card"><div class="card-head"><h3>План на неделю</h3><button class="ghost-btn" data-action="openRecordForm" data-type="task">＋ Задача</button></div>${v40ActionList(m)}</article><article class="card"><div class="card-head"><h3>Лимиты и автоправила</h3><button class="ghost-btn" data-action="setActualBalance">Обновить остаток</button></div><div class="v40-mini-row"><span>Дневной лимит</span><b class="green">${money(m.dayLimit)}</b></div><div class="v40-mini-row"><span>На долги</span><b class="red">${money(m.debtPay)}</b></div><div class="v40-mini-row"><span>В резерв</span><b class="green">${money(m.reserve)}</b></div><div class="v40-mini-row"><span>Покупки до конца периода</span><b class="amber">${money(m.t.upcoming)}</b></div><p class="small muted">Лимит считается автоматически из фактического остатка, доходов, расходов, покупок, долгов и резерва.</p></article></section><section class="card" style="margin-top:16px"><div class="card-head"><h3>Сценарии выхода из долгов</h3></div>${v40DebtScenarios(m)}</section>`}
  function v40DebtsTab(m){return `<section class="v40-section-grid"><article class="card"><div class="card-head"><h3>Что закрывать первым</h3><button class="ghost-btn" data-action="openDebtOut">＋ Долг</button></div>${(typeof debtPlanBlock==='function')?debtPlanBlock((typeof debtRepayPlan==='function')?debtRepayPlan(m.out):m.out.map((d,i)=>({debt:d,index:i+1,tone:'red',note:d.due?fmt(d.due):'без срока'}))):m.out.map(debtCard).join('')}</article><article class="card"><div class="card-head"><h3>Мне должны</h3><button class="ghost-btn" data-action="openDebtIn">＋ Возврат</button></div><div class="list">${m.incDebts.map(debtCard).join('')||empty('Тебе пока никто не должен')}</div></article></section><section class="card" style="margin-top:16px"><div class="card-head"><h3>Сценарии по платежам</h3></div>${v40DebtScenarios(m)}</section>`}
  function v40SpendsTab(m){return `<section class="v40-section-grid"><article class="card"><div class="card-head"><h3>Категории расходов</h3><button class="ghost-btn" data-action="openRecordForm" data-type="operation">＋ Операция</button></div>${categoryBreakdown(m.p)}${v40CategoryBars(m)}</article><article class="card"><div class="card-head"><h3>Аналитика поведения</h3></div>${v40Insights(m)}</article></section>`}
  function v40ForecastTab(m){return `<section class="v40-section-grid"><article class="card"><div class="card-head"><h3>График доходов и расходов</h3><span class="pill blue">${fmt(m.p.start)} — ${fmt(m.p.end)}</span></div>${financeChart(m.p)}</article><article class="card"><div class="card-head"><h3>Прогноз и контроль</h3></div>${forecastBlock(m.p,m.t)}<div class="record-card" style="margin-top:12px"><b>Прогноз по темпу</b><div class="small muted">Текущий средний расход: ${money(m.stats.avg)} в день. Прогноз расходов периода: ${money(m.stats.projected)}.</div></div></article></section><section class="card" style="margin-top:16px"><div class="card-head"><div><h3>Плановые покупки</h3><p class="small muted">Покупки влияют на прогноз месяца, в котором указана дата.</p></div><button class="btn" data-action="openRecordForm" data-type="purchase">＋ Добавить покупку</button></div>${plannedMonthBlock(m.p)}</section>`}
  function v40Tabs(active){return `<section class="v40-tabs">${[['overview','Обзор'],['actions','Действия'],['debts','Долги'],['spends','Расходы'],['forecast','Прогноз'],['import','Импорт / Альфа']].map(([id,label])=>`<button class="v40-tab ${active===id?'active':''}" data-v40-action="setFinanceTab" data-tab="${id}">${label}</button>`).join('')}</section>`}
  function v40FinancePage(){v40Ensure();v40Styles();const m=v40Model();const tab=state.settings.financeTab||'overview';const body={overview:v40Overview,actions:v40ActionsTab,debts:v40DebtsTab,spends:v40SpendsTab,forecast:v40ForecastTab,import:v40ImportTab}[tab]||v40Overview;return layout('Финансы','Активный обзор: что происходит с деньгами, что делать сейчас и как не уйти в перегруз.',`${v40Tabs(tab)}<section class="v40-shell">${body(m)}</section>`)}

  function v40SetFinanceTab(el){v40Ensure();state.settings.financeTab=el.dataset.tab||'overview';save();render();}
  function v40SaveAlfaSettings(){v40Ensure();state.settings.alfaWorkerUrl=(document.getElementById('v40AlfaUrl')?.value||'').trim();state.settings.alfaWorkerKey=(document.getElementById('v40AlfaKey')?.value||'').trim();state.settings.alfaSyncStatus='Настройки сохранены. Следующий шаг: проверить Worker.';save();render();toast('Настройки Альфа/Worker сохранены');}
  async function v40TestAlfaConnector(){v40Ensure();const url=(document.getElementById('v40AlfaUrl')?.value||state.settings.alfaWorkerUrl||'').trim();const key=(document.getElementById('v40AlfaKey')?.value||state.settings.alfaWorkerKey||'').trim();if(!url)return toast('Укажи Worker URL');try{const r=await fetch(url.replace(/\/$/,'')+'/health',{headers:key?{'X-Second-Brain-Key':key}:{}});const txt=await r.text();state.settings.alfaSyncStatus=r.ok?'Worker отвечает: '+txt.slice(0,120):'Worker ответил ошибкой: '+r.status;state.settings.alfaLastSync=new Date().toISOString();save();render();toast(state.settings.alfaSyncStatus)}catch(e){state.settings.alfaSyncStatus='Ошибка Worker: '+(e.message||e);save();render();toast('Worker не отвечает')}}
  function v40GuessCategory(note,type){const s=String(note||'').toLowerCase();if(type==='income')return 'Доход';if(/продукт|магнит|пятер|перекрест|лавка|market|ozon|wildberries|wb/i.test(s))return 'Продукты / покупки';if(/такси|яндекс|uber|транспорт|азс|бензин|топливо/i.test(s))return 'Транспорт';if(/аптек|мед|клиник|стомат/i.test(s))return 'Здоровье';if(/банк|кредит|займ|альфа|тинькофф|сбер/i.test(s))return 'Долги / банк';if(/кафе|ресторан|кофе|еда/i.test(s))return 'Кафе / еда';return 'Альфа-Банк';}
  function v40NormalizeWorkerOps(data){const arr=Array.isArray(data)?data:(data.operations||data.transactions||[]);return arr.map(x=>{let amount=num(x.amount||x.sum||x.transactionAmount||x.operationAmount);let type=x.type||x.direction||'';if(!type) type=amount<0?'expense':'income';type=String(type).toLowerCase();if(/debit|expense|расход|спис/i.test(type))type='expense';else if(/credit|income|доход|поступ|зачис/i.test(type))type='income';return{id:uid(),date:x.date||x.operationDate||x.statementDate||today(),type,amount:Math.abs(amount),category:x.category||x.mccName||x.merchantCategory||v40GuessCategory(x.note||x.description||'',type)||'Альфа-Банк',note:x.note||x.description||x.merchantName||x.purpose||'Альфа-Банк API'}}).filter(o=>num(o.amount)>0)}
  async function v40FetchAlfaOperations(){v40Ensure();const url=(document.getElementById('v40AlfaUrl')?.value||state.settings.alfaWorkerUrl||'').trim();const key=(document.getElementById('v40AlfaKey')?.value||state.settings.alfaWorkerKey||'').trim();if(!url)return toast('Укажи Worker URL');try{const r=await fetch(url.replace(/\/$/,'')+'/operations?from='+periodInfo().start+'&to='+periodInfo().end,{headers:key?{'X-Second-Brain-Key':key}:{}});if(!r.ok)throw new Error('HTTP '+r.status);const data=await r.json();const ops=v40NormalizeWorkerOps(data);const res=(typeof v39ApplyOps==='function')?v39ApplyOps(ops):(()=>{let added=0,dups=0;const keys=new Set(state.operations.map(o=>`${o.date}|${o.type}|${num(o.amount)}|${o.category}|${o.note}`));ops.forEach(op=>{const k=`${op.date}|${op.type}|${num(op.amount)}|${op.category}|${op.note}`;if(keys.has(k)){dups++;return}keys.add(k);state.operations.unshift(op);added++});save();render();return{added,dups}})();state.settings.alfaLastImported=res.added;state.settings.alfaLastDuplicates=res.dups;state.settings.alfaLastSync=new Date().toISOString();state.settings.alfaSyncStatus=`Загружено из Альфа/Worker: ${res.added}, дублей ${res.dups}`;save();render();toast(state.settings.alfaSyncStatus)}catch(e){state.settings.alfaSyncStatus='Ошибка импорта Альфа: '+(e.message||e);save();render();toast('Ошибка Альфа API')}}
  function v40DownloadWorkerTemplate(){const code=`// Файл: worker.js\n// Шаблон Second Brain OS ↔ Альфа-Банк API. Токены хранить только в Cloudflare Secrets.\n// Endpoints: /health, /operations?from=YYYY-MM-DD&to=YYYY-MM-DD\nexport default {\n  async fetch(request, env) {\n    const url = new URL(request.url);\n    const key = request.headers.get('X-Second-Brain-Key');\n    if (env.SECOND_BRAIN_KEY && key !== env.SECOND_BRAIN_KEY) return new Response('unauthorized', { status: 401 });\n    if (url.pathname === '/health') return Response.json({ ok: true, service: 'second-brain-alfa-worker' });\n    if (url.pathname === '/operations') {\n      // TODO: здесь подключается OAuth/refresh token Alfa API.\n      // На выходе верни операции в формате Second Brain OS:\n      return Response.json({ operations: [\n        // { date:'2026-07-07', type:'expense', amount:1250, category:'Продукты', note:'Альфа · магазин' }\n      ] });\n    }\n    return new Response('not found', { status: 404 });\n  }\n};\n`;
    const blob=new Blob([code],{type:'text/javascript'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='second-brain-alfa-worker-template.js';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Worker-шаблон скачан');}

  try{ financePage=v40FinancePage; }catch(e){console.error('[V40 override financePage]',e)}

  window.addEventListener('click',function(e){const el=e.target.closest&&e.target.closest('[data-v40-action]');if(!el)return;const a=el.dataset.v40Action;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(a==='setFinanceTab')return v40SetFinanceTab(el);if(a==='saveAlfaSettings')return v40SaveAlfaSettings();if(a==='testAlfaConnector')return v40TestAlfaConnector();if(a==='fetchAlfaOperations')return v40FetchAlfaOperations();if(a==='downloadWorkerTemplate')return v40DownloadWorkerTemplate();},true);

  const oldRenderV40=typeof render==='function'?render:null;
  if(oldRenderV40){render=function(){v40Ensure();const res=oldRenderV40();const v=document.querySelector('.version');if(v)v.textContent=V40_LABEL;return res;};}
  try{v40Ensure();save();render();}catch(e){console.error('[V40 init]',e)}
})();


/* ===== V43 Expense Category Review: separate page for checking CSV auto categories ===== */
(function(){
  const V43_BUILD='second-brain-space-v43-expense-category-review-20260707';
  const V43_LABEL='V43 · РАСХОДЫ · ПРОВЕРКА КАТЕГОРИЙ';
  try{ localStorage.setItem('secondBrainOS.currentBuild',V43_BUILD); }catch(e){}

  const V43_DEFAULT_CATEGORIES=[
    'Продукты','Кафе / еда','Транспорт','АЗС / авто','Дом / быт','Связь / подписки','Здоровье','Одежда','Подарки','Полина','Развлечения','Долги / банк','Кредиты','Образование','Работа','Путешествия','Маркетплейсы','Банк','Прочее','Не определено'
  ];

  function v43Ensure(){
    state.settings=state.settings||{};
    state.settings.expenseReviewPeriod=state.settings.expenseReviewPeriod||'month';
    state.settings.expenseReviewMode=state.settings.expenseReviewMode||'all';
    state.settings.expenseReviewSearch=state.settings.expenseReviewSearch||'';
    state.operations=Array.isArray(state.operations)?state.operations:[];
  }

  function v43AddSection(){
    try{
      if(!Array.isArray(SECTIONS)) return;
      if(SECTIONS.some(s=>s.id==='expense-review')) return;
      const idx=SECTIONS.findIndex(s=>s.id==='finance');
      SECTIONS.splice(idx>=0?idx+1:SECTIONS.length,0,{id:'expense-review',label:'Категории расходов',icon:'🧾',color:'#f97316',group:'ФИНАНСЫ'});
    }catch(e){console.error('[V43 add section]',e)}
  }

  function v43Styles(){
    if(document.getElementById('v43-expense-review-style')) return;
    const st=document.createElement('style');
    st.id='v43-expense-review-style';
    st.textContent=`
      .v43-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin:0 0 14px}
      .v43-tabs{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
      .v43-tab{border:1px solid #dbeafe;background:#fff;color:#334155;border-radius:999px;padding:9px 13px;font-weight:900;cursor:pointer;box-shadow:0 8px 20px rgba(15,23,42,.035)}
      .v43-tab:hover{border-color:#93c5fd;color:#2563eb;background:#f8fbff}.v43-tab.active{background:#2563eb;color:#fff;border-color:#2563eb}
      .v43-search{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.v43-search input{height:42px;border:1px solid #dbeafe;background:#fff;border-radius:15px;padding:0 13px;min-width:260px;outline:0;font-weight:750;color:#0f172a}
      .v43-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px}.v43-kpi{border:1px solid #e5edf7;border-radius:22px;background:rgba(255,255,255,.92);padding:16px;box-shadow:0 10px 26px rgba(15,23,42,.04)}.v43-kpi .label{font-size:12px;color:#64748b;font-weight:900;margin-bottom:7px}.v43-kpi .num{font-size:29px;font-weight:1000;letter-spacing:-.055em}.v43-kpi p{margin:5px 0 0}
      .v43-layout{display:grid;grid-template-columns:minmax(280px,.34fr) minmax(0,1fr);gap:16px}.v43-side-stack{display:grid;gap:12px;align-content:start}.v43-panel{border:1px solid #e5edf7;border-radius:24px;background:rgba(255,255,255,.92);padding:16px;box-shadow:0 10px 26px rgba(15,23,42,.04)}
      .v43-cat-summary{display:grid;gap:10px}.v43-cat-btn{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #eaf0f8;background:#fff;border-radius:16px;padding:10px;text-align:left}.v43-cat-btn:hover{border-color:#bfdbfe;background:#f8fbff}.v43-cat-btn b{display:block;color:#0f172a}.v43-cat-btn .bar{height:7px;background:#edf4ff;border-radius:999px;overflow:hidden;margin-top:7px}.v43-cat-btn .bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#f97316,#38bdf8)}
      .v43-groups{display:grid;gap:14px}.v43-group{border:1px solid #dbeafe;border-radius:24px;background:rgba(255,255,255,.95);box-shadow:0 10px 26px rgba(15,23,42,.04);overflow:hidden}.v43-group summary{list-style:none;cursor:pointer;padding:16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.v43-group summary::-webkit-details-marker{display:none}.v43-group-title{display:flex;align-items:center;gap:10px;min-width:0}.v43-dot{width:38px;height:38px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#fff7ed,#eef5ff);font-weight:1000;color:#f97316}.v43-group-meta{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.v43-group-body{border-top:1px solid #eaf0f8;padding:12px 16px 16px;display:grid;gap:10px}.v43-group-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;align-items:end;border:1px dashed #dbeafe;background:#f8fbff;border-radius:18px;padding:12px}.v43-group-actions .field{min-width:220px;flex:1}.v43-group-actions input{height:40px;border:1px solid #dbeafe;border-radius:14px;padding:0 11px;background:#fff;font-weight:750;outline:0;width:100%}
      .v43-op{display:grid;grid-template-columns:116px minmax(0,1fr) 150px 250px auto;gap:10px;align-items:center;border:1px solid #eaf0f8;background:#fbfdff;border-radius:18px;padding:11px}.v43-op:hover{background:#f8fbff;border-color:#bfdbfe}.v43-op-main b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v43-op-main .small{line-height:1.35}.v43-op-amount{font-weight:1000;color:#ef4444;text-align:right}.v43-op input{height:38px;border:1px solid #dbeafe;border-radius:13px;padding:0 10px;background:#fff;outline:0;font-weight:800;width:100%}.v43-op-actions{display:flex;gap:6px;justify-content:flex-end}.v43-review{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;font-weight:900;font-size:12px;border:1px solid #e5edf7;background:#f8fafc;color:#64748b}.v43-review.need{background:#fff7ed;color:#d97706;border-color:#fed7aa}.v43-review.ok{background:#ecfdf5;color:#059669;border-color:#bbf7d0}.v43-hint{border:1px solid #dbeafe;background:linear-gradient(135deg,#f8fbff,#fff);border-radius:22px;padding:14px;line-height:1.55}.v43-empty{border:1px dashed #dbeafe;background:#f8fbff;border-radius:22px;padding:18px;color:#64748b;font-weight:800}.v43-sticky-note{position:sticky;top:14px}
      @media(max-width:1060px){.v43-layout{grid-template-columns:1fr}.v43-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.v43-op{grid-template-columns:1fr}.v43-op-amount{text-align:left}.v43-op-actions{justify-content:flex-start}.v43-search input{min-width:0;width:100%}}
      @media(max-width:720px){.v43-kpis{grid-template-columns:1fr}.v43-toolbar{align-items:stretch}.v43-search,.v43-tabs{width:100%}.v43-tab{flex:1;justify-content:center}.v43-op{padding:12px}.v43-group summary{grid-template-columns:1fr}.v43-group-meta{justify-content:flex-start}}
    `;
    document.head.appendChild(st);
  }

  function v43Period(){
    const kind=state.settings.expenseReviewPeriod||'month';
    if(kind==='all') return {key:'all',title:'всё время',start:'',end:''};
    if(kind==='unreviewed') return {key:'unreviewed',title:'к проверке',start:'',end:''};
    return periodInfo(kind);
  }
  function v43InPeriod(o,p){
    if(!p || p.key==='all' || p.key==='unreviewed') return true;
    return (!p.start || String(o.date||'')>=p.start) && (!p.end || String(o.date||'')<=p.end);
  }
  function v43NeedReview(o){ return o && o.type==='expense' && o.categoryReviewed!==true; }
  function v43AllCategories(){
    const cats=new Set(V43_DEFAULT_CATEGORIES);
    state.operations.forEach(o=>{ if(o.category) cats.add(String(o.category).trim()); });
    return [...cats].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ru'));
  }
  function v43Datalist(){return `<datalist id="v43CategoryList">${v43AllCategories().map(c=>`<option value="${esc(c)}"></option>`).join('')}</datalist>`;}
  function v43Expenses(){
    v43Ensure();
    const p=v43Period();
    const q=String(state.settings.expenseReviewSearch||'').toLowerCase().trim();
    const mode=state.settings.expenseReviewMode||'all';
    return state.operations.filter(o=>o.type==='expense').filter(o=>v43InPeriod(o,p)).filter(o=>{
      if(p.key==='unreviewed' || mode==='review') return v43NeedReview(o);
      return true;
    }).filter(o=>{
      if(!q) return true;
      return [o.date,o.amount,o.category,o.note].some(v=>String(v||'').toLowerCase().includes(q));
    }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')) || num(b.amount)-num(a.amount));
  }
  function v43Group(ops){
    const map={};
    ops.forEach(o=>{const c=String(o.category||'Не определено').trim()||'Не определено';(map[c]||(map[c]=[])).push(o);});
    return Object.entries(map).map(([cat,items])=>({cat,items,total:items.reduce((s,o)=>s+num(o.amount),0),need:items.filter(v43NeedReview).length})).sort((a,b)=>b.total-a.total);
  }
  function v43AllExpenseStats(){
    const all=state.operations.filter(o=>o.type==='expense');
    const visible=v43Expenses();
    const groups=v43Group(visible);
    const total=visible.reduce((s,o)=>s+num(o.amount),0);
    const need=all.filter(v43NeedReview).length;
    const top=groups[0];
    return {all,visible,groups,total,need,top};
  }
  function v43Pct(v,total){return total?Math.round(num(v)/Math.max(1,num(total))*100):0;}
  function v43Trunc(s,n=74){s=String(s||''); return s.length>n?s.slice(0,n-1)+'…':s;}
  function v43OpRow(o){
    const need=v43NeedReview(o);
    return `<div class="v43-op" data-op-id="${esc(o.id)}">
      <div><b>${fmt(o.date)}</b><div class="small muted">${esc(o.date||'—')}</div></div>
      <div class="v43-op-main"><b>${esc(v43Trunc(o.note||'Операция банка',86))}</b><div class="small muted">Текущая категория: ${esc(o.category||'Не определено')}</div></div>
      <div class="v43-op-amount">−${money(o.amount)}</div>
      <div><input list="v43CategoryList" data-v43-cat-input data-id="${esc(o.id)}" value="${esc(o.category||'Не определено')}" placeholder="Категория"></div>
      <div class="v43-op-actions"><button class="mini blue" data-v43-action="saveExpenseCategory" data-id="${esc(o.id)}">Сохранить</button><button class="mini ${need?'green':'blue'}" data-v43-action="markExpenseReviewed" data-id="${esc(o.id)}">${need?'Проверено':'Ок'}</button></div>
    </div>`;
  }
  function v43SummaryList(groups,total){
    return `<div class="v43-cat-summary">${groups.slice(0,14).map(g=>`<button class="v43-cat-btn" data-v43-action="jumpCategory" data-cat="${esc(g.cat)}"><div><b>${esc(g.cat)}</b><div class="small muted">${g.items.length} операций · ${g.need} к проверке</div><div class="bar"><i style="width:${clamp(v43Pct(g.total,total),4,100)}%"></i></div></div><div><b>${money(g.total)}</b><div class="small muted">${v43Pct(g.total,total)}%</div></div></button>`).join('')||'<div class="v43-empty">За выбранный период расходов нет.</div>'}</div>`;
  }
  function v43GroupHtml(g,total,index){
    const open=index<3 || g.need>0;
    return `<details class="v43-group" ${open?'open':''} data-v43-category-block="${esc(g.cat)}">
      <summary>
        <div class="v43-group-title"><span class="v43-dot">🧾</span><div><h3 style="margin:0">${esc(g.cat)}</h3><div class="small muted">${g.items.length} операций · ${money(g.total)} · ${v43Pct(g.total,total)}% расходов</div></div></div>
        <div class="v43-group-meta"><span class="pill amber">${g.need} к проверке</span><span class="pill blue">${money(g.total)}</span></div>
      </summary>
      <div class="v43-group-body">
        <div class="v43-group-actions">
          <div class="field"><label>Переименовать всю категорию</label><input list="v43CategoryList" data-v43-group-input="${esc(g.cat)}" value="${esc(g.cat)}"></div>
          <div class="row-actions"><button class="ghost-btn" data-v43-action="moveGroupToCategory" data-cat="${esc(g.cat)}">Перенести все операции</button><button class="ghost-btn" data-v43-action="markGroupReviewed" data-cat="${esc(g.cat)}">Отметить всю категорию проверенной</button></div>
        </div>
        ${g.items.map(v43OpRow).join('')}
      </div>
    </details>`;
  }
  function v43Page(){
    v43Ensure();v43AddSection();v43Styles();
    const p=v43Period();const st=v43AllExpenseStats();const mode=state.settings.expenseReviewMode||'all';
    const subtitle='Все расходы из CSV и ручных операций по категориям. Здесь можно быстро исправить неверную автокатегорию и отметить операции проверенными.';
    return layout('Категории расходов',subtitle,`${v43Datalist()}
      <section class="v43-toolbar">
        <div class="v43-tabs">
          ${[['month','Текущий месяц'],['last','Прошлый'],['quarter','3 месяца'],['year','Год'],['all','Всё время'],['unreviewed','К проверке']].map(([id,l])=>`<button class="v43-tab ${p.key===id?'active':''}" data-v43-action="setExpensePeriod" data-period="${id}">${l}</button>`).join('')}
        </div>
        <div class="v43-search"><input id="v43ExpenseSearch" value="${esc(state.settings.expenseReviewSearch||'')}" placeholder="Поиск: магазин, сумма, категория..."><button class="ghost-btn" data-v43-action="applyExpenseSearch">Найти</button><button class="ghost-btn" data-v43-action="clearExpenseSearch">Сбросить</button></div>
      </section>
      <section class="v43-toolbar" style="justify-content:flex-start">
        <div class="v43-tabs"><button class="v43-tab ${mode==='all'?'active':''}" data-v43-action="setReviewMode" data-mode="all">Все операции</button><button class="v43-tab ${mode==='review'?'active':''}" data-v43-action="setReviewMode" data-mode="review">Только непроверенные</button></div>
        <button class="btn" data-go="finance">← Вернуться в финансы</button>
      </section>
      <section class="v43-kpis">
        <article class="v43-kpi"><div class="label">Расходы ${esc(p.title||'')}</div><div class="num red">${money(st.total)}</div><p class="small muted">видимых операций: ${st.visible.length}</p></article>
        <article class="v43-kpi"><div class="label">К проверке</div><div class="num amber">${st.need}</div><p class="small muted">категория ещё не подтверждена</p></article>
        <article class="v43-kpi"><div class="label">Категорий</div><div class="num blue">${st.groups.length}</div><p class="small muted">по выбранному фильтру</p></article>
        <article class="v43-kpi"><div class="label">Самая большая</div><div class="num">${esc(st.top?st.top.cat:'—')}</div><p class="small muted">${st.top?money(st.top.total):'нет данных'}</p></article>
      </section>
      <section class="v43-layout">
        <aside class="v43-side-stack"><article class="v43-panel v43-sticky-note"><div class="card-head"><h3>Сводка категорий</h3></div>${v43SummaryList(st.groups,st.total)}</article><article class="v43-hint"><b>Как пользоваться</b><div class="small muted">После импорта CSV открой эту страницу, пройди категории сверху вниз, исправь неверные названия и нажимай «Сохранить» или «Проверено». Так аналитика финансов станет точнее.</div></article></aside>
        <main class="v43-groups">${st.groups.map((g,i)=>v43GroupHtml(g,st.total,i)).join('')||'<div class="v43-empty">Расходов за выбранный период нет. Импортируй CSV в финансах или добавь операцию вручную.</div>'}</main>
      </section>`);
  }

  function v43ForcePage(){
    try{
      v43Ensure();v43AddSection();v43Styles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      if(current==='expense-review'||page==='expense-review'){
        const view=document.querySelector('#view'); if(view) view.innerHTML=v43Page().replace(/^<section[^>]*id="view"[^>]*>|<\/section>$/g,'');
        const v=document.querySelector('.version'); if(v) v.textContent=V43_LABEL;
      }
    }catch(e){console.error('[V43 force page]',e);try{toast('Ошибка V43: '+(e.message||e))}catch(_){} }
  }

  function v43RenderDirect(){
    const view=document.querySelector('#view');
    if(view) view.innerHTML=v43Page().match(/<section class="page[\s\S]*<\/section>/)?.[0] || v43Page();
  }

  function v43FindOp(id){return state.operations.find(o=>String(o.id)===String(id));}
  function v43InputForOp(id){return document.querySelector(`[data-v43-cat-input][data-id="${CSS.escape(String(id))}"]`);}
  function v43SaveExpenseCategory(id){
    const op=v43FindOp(id); if(!op) return toast('Операция не найдена');
    const inp=v43InputForOp(id); const cat=String(inp?.value||'').trim();
    if(!cat) return toast('Укажи категорию');
    op.category=cat; op.categoryReviewed=true; op.categoryReviewedAt=new Date().toISOString();
    save(); render(); toast('Категория сохранена');
  }
  function v43MarkExpenseReviewed(id){
    const op=v43FindOp(id); if(!op) return toast('Операция не найдена');
    op.categoryReviewed=true; op.categoryReviewedAt=new Date().toISOString();
    save(); render(); toast('Операция отмечена проверенной');
  }
  function v43MoveGroup(cat){
    const inp=document.querySelector(`[data-v43-group-input="${CSS.escape(String(cat))}"]`); const next=String(inp?.value||'').trim();
    if(!next) return toast('Укажи новую категорию');
    let n=0; state.operations.forEach(o=>{if(o.type==='expense' && String(o.category||'Не определено')===String(cat)){o.category=next;o.categoryReviewed=true;o.categoryReviewedAt=new Date().toISOString();n++;}});
    save(); render(); toast(`Перенесено операций: ${n}`);
  }
  function v43MarkGroup(cat){
    let n=0; state.operations.forEach(o=>{if(o.type==='expense' && String(o.category||'Не определено')===String(cat)){o.categoryReviewed=true;o.categoryReviewedAt=new Date().toISOString();n++;}});
    save(); render(); toast(`Категория проверена: ${n} операций`);
  }
  function v43ApplySearch(){state.settings.expenseReviewSearch=document.getElementById('v43ExpenseSearch')?.value||'';save();render();}
  function v43ClearSearch(){state.settings.expenseReviewSearch='';save();render();}
  function v43JumpCategory(cat){
    const box=[...document.querySelectorAll('[data-v43-category-block]')].find(x=>x.dataset.v43CategoryBlock===cat);
    if(box){box.open=true; box.scrollIntoView({behavior:'smooth',block:'start'});}
  }

  const oldRenderV43=typeof render==='function'?render:null;
  if(oldRenderV43){
    render=function(){
      v43Ensure();v43AddSection();v43Styles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      if(current==='expense-review') page='expense-review';
      const res=oldRenderV43();
      setTimeout(v43ForcePage,0);
      const v=document.querySelector('.version'); if(v) v.textContent=V43_LABEL;
      return res;
    };
  }

  window.addEventListener('click',function(e){
    const el=e.target.closest&&e.target.closest('[data-v43-action]'); if(!el) return;
    const a=el.dataset.v43Action;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    try{
      if(a==='setExpensePeriod'){state.settings.expenseReviewPeriod=el.dataset.period||'month';save();render();return;}
      if(a==='setReviewMode'){state.settings.expenseReviewMode=el.dataset.mode||'all';save();render();return;}
      if(a==='applyExpenseSearch') return v43ApplySearch();
      if(a==='clearExpenseSearch') return v43ClearSearch();
      if(a==='saveExpenseCategory') return v43SaveExpenseCategory(el.dataset.id);
      if(a==='markExpenseReviewed') return v43MarkExpenseReviewed(el.dataset.id);
      if(a==='moveGroupToCategory') return v43MoveGroup(el.dataset.cat);
      if(a==='markGroupReviewed') return v43MarkGroup(el.dataset.cat);
      if(a==='jumpCategory') return v43JumpCategory(el.dataset.cat);
    }catch(err){console.error('[V43 action]',err);try{toast('Ошибка категорий: '+(err.message||err))}catch(_){} }
  },true);

  window.addEventListener('keyup',function(e){
    if(e.target && e.target.id==='v43ExpenseSearch' && e.key==='Enter'){e.preventDefault();v43ApplySearch();}
  },true);
  window.addEventListener('hashchange',()=>setTimeout(v43ForcePage,0));
  try{v43Ensure();v43AddSection();v43Styles();save();render();}catch(e){console.error('[V43 init]',e)}
})();


/* ===== V44 System Core: global search, attention center, category learning ===== */
(function(){
  const V44_BUILD='second-brain-space-v44-system-core-20260707';
  const V44_LABEL='V44 · SYSTEM CORE · ПОИСК + ВНИМАНИЕ';
  try{ localStorage.setItem('secondBrainOS.currentBuild',V44_BUILD); }catch(e){}

  function v44Ensure(){
    state.settings=state.settings||{};
    state.settings.categoryRules=Array.isArray(state.settings.categoryRules)?state.settings.categoryRules:[];
    state.settings.globalSearchQuery=state.settings.globalSearchQuery||'';
    state.settings.attentionMode=state.settings.attentionMode||'all';
    const arrays=['operations','debts','tasks','purchases','wishes','notes','ideas','people','habits','goals','documents','books','films','trips','personal','archive','folders','events','polinaDays','subconsciousEntries'];
    arrays.forEach(k=>{ if(!Array.isArray(state[k])) state[k]=[]; });
    (state.operations||[]).forEach(o=>{
      o.id=o.id||uid();
      o.bankKey=o.bankKey||v44StableOpKey(o);
      if(o.type==='expense' && typeof o.categoryReviewed==='undefined') o.categoryReviewed=false;
    });
  }
  function v44AddSection(){
    try{
      if(Array.isArray(SECTIONS) && !SECTIONS.some(s=>s.id==='attention')){
        const idx=SECTIONS.findIndex(s=>s.id==='dashboard');
        SECTIONS.splice(idx>=0?idx+1:0,0,{id:'attention',label:'Центр внимания',icon:'🔔',color:'#f59e0b',group:'ПРОСТРАНСТВО'});
      }
      if(Array.isArray(SECTIONS) && !SECTIONS.some(s=>s.id==='global-search')){
        const idx=SECTIONS.findIndex(s=>s.id==='diagnostics');
        SECTIONS.splice(idx>=0?idx:SECTIONS.length,0,{id:'global-search',label:'Глобальный поиск',icon:'⌕',color:'#2563eb',group:'СЕРВИС'});
      }
    }catch(e){console.error('[V44 add section]',e)}
  }
  function v44Styles(){
    if(document.getElementById('v44-system-core-style')) return;
    const st=document.createElement('style');
    st.id='v44-system-core-style';
    st.textContent=`
      .v44-hero-panel{border:1px solid #dbeafe;background:radial-gradient(circle at top left,rgba(37,99,235,.14),transparent 33%),linear-gradient(135deg,#fff,#f8fbff);border-radius:28px;padding:18px;box-shadow:0 22px 56px rgba(15,23,42,.07);margin-bottom:16px}
      .v44-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}.v44-kpi{border:1px solid #e5edf7;background:#fff;border-radius:20px;padding:14px;box-shadow:0 10px 24px rgba(15,23,42,.035);min-height:110px}.v44-kpi .label{font-size:12px;color:#64748b;font-weight:900}.v44-kpi .num{font-size:28px;font-weight:1000;letter-spacing:-.04em;margin-top:6px}
      .v44-attention-list{display:grid;gap:10px}.v44-attention-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid #eaf0f8;background:#fff;border-radius:18px;padding:12px;box-shadow:0 8px 20px rgba(15,23,42,.03)}.v44-attention-row.critical{border-color:#fecaca;background:#fffafa}.v44-attention-row.warn{border-color:#fed7aa;background:#fffaf5}.v44-attention-row.ok{border-color:#bbf7d0;background:#f7fffb}.v44-attention-icon{width:42px;height:42px;border-radius:15px;display:grid;place-items:center;background:#eef5ff;color:#2563eb;font-weight:900}.v44-attention-title{font-weight:1000;color:#0f172a}.v44-attention-sub{font-size:12px;color:#64748b;margin-top:3px}.v44-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.v44-tab{border:1px solid #dbeafe;background:#fff;border-radius:999px;padding:9px 13px;font-weight:900;color:#334155}.v44-tab.active{background:#2563eb;border-color:#2563eb;color:#fff}.v44-section-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}.v44-mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .v44-search-panel{border:1px solid #dbeafe;background:linear-gradient(135deg,#fff,#f8fbff);border-radius:24px;padding:16px;margin-bottom:16px}.v44-search-input{height:54px;border:1px solid #dbeafe;border-radius:18px;background:#fff;padding:0 16px;font-weight:850;width:100%;outline:0}.v44-search-results{display:grid;gap:10px}.v44-result{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid #eaf0f8;background:#fff;border-radius:18px;padding:12px;text-align:left}.v44-result:hover{border-color:#bfdbfe;background:#f8fbff}.v44-result-type{width:42px;height:42px;border-radius:15px;display:grid;place-items:center;background:#eef5ff;color:#2563eb;font-weight:900}.v44-result-title{font-weight:1000}.v44-result-text{font-size:12px;color:#64748b;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .v44-review-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;border:1px solid #dbeafe;background:#fff;border-radius:22px;padding:12px;margin-bottom:14px}.v44-rule{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;border:1px solid #eaf0f8;background:#fff;border-radius:16px;padding:10px}.v44-op{display:grid;grid-template-columns:100px minmax(0,1fr) 120px 210px auto;gap:10px;align-items:center;border:1px solid #eaf0f8;background:#fff;border-radius:16px;padding:11px;margin-top:8px}.v44-op input,.v44-rule input,.v44-rule select{height:38px;border:1px solid #dbeafe;border-radius:12px;padding:0 10px;background:#fff}.v44-group{border:1px solid #e5edf7;background:#fff;border-radius:22px;margin-bottom:12px;overflow:hidden}.v44-group summary{cursor:pointer;padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:center}.v44-group-body{padding:0 14px 14px}.v44-learn-card{border:1px dashed #bfdbfe;background:#f8fbff;border-radius:20px;padding:14px}.v44-rule-list{display:grid;gap:8px;max-height:320px;overflow:auto}.v44-dashboard-insert{margin-bottom:16px}.v44-inspection-list{display:grid;gap:8px}.v44-check{display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid #eaf0f8;background:#fff;border-radius:14px;padding:10px}.v44-good{color:#10b981}.v44-warn{color:#f59e0b}.v44-bad{color:#ef4444}
      @media(max-width:1180px){.v44-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.v44-section-grid{grid-template-columns:1fr}.v44-op{grid-template-columns:1fr}.v44-op .row-actions{justify-content:flex-start}.v44-mini-grid{grid-template-columns:1fr}}
      @media(max-width:760px){.v44-kpis{grid-template-columns:1fr}.v44-attention-row,.v44-result{grid-template-columns:auto minmax(0,1fr)}.v44-attention-row .row-actions,.v44-result .row-actions{grid-column:1/-1;justify-content:flex-start}}
    `;
    document.head.appendChild(st);
  }

  function v44Date(d){return d?new Date(d+'T00:00:00'):null;}
  function v44DaysUntil(d){const dt=v44Date(d); if(!dt) return 9999; const a=v44Date(today()); return Math.ceil((dt-a)/86400000);}
  function v44Trunc(s,n=120){s=String(s||''); return s.length>n?s.slice(0,n-1)+'…':s;}
  function v44Text(x){return Object.values(x||{}).filter(v=>['string','number','boolean'].includes(typeof v)).join(' · ');}
  function v44StableOpKey(o){
    const note=String(o.note||'').toLowerCase().replace(/\s+/g,' ').trim().slice(0,180);
    return [o.date||'',o.type||'',Math.round(num(o.amount)*100)/100,note].join('|');
  }
  function v44MerchantPattern(note){
    let s=String(note||'').toLowerCase();
    s=s.replace(/\b\d{2,}\b/g,' ').replace(/[№#*]/g,' ').replace(/\s+/g,' ').trim();
    const parts=s.split(/[·;|,]/).map(x=>x.trim()).filter(Boolean);
    let pick=parts.find(x=>x.length>=4 && !/карта|счет|счёт|операц|платеж|покупка|списание|руб|rur|moscow|alfabank|альфа/i.test(x)) || parts[0] || s;
    pick=pick.replace(/[^a-zа-яё0-9 ._-]/gi,' ').replace(/\s+/g,' ').trim();
    return pick.slice(0,48) || 'операция';
  }
  function v44MatchRule(o,r){
    const hay=String([o.note,o.category].join(' ')).toLowerCase();
    const p=String(r.pattern||'').toLowerCase().trim();
    return p && hay.includes(p);
  }
  function v44ApplyRules(showToast=false){
    v44Ensure(); let changed=0;
    const rules=state.settings.categoryRules||[];
    (state.operations||[]).forEach(o=>{
      if(o.type!=='expense' || o.categoryReviewed) return;
      const r=rules.find(x=>v44MatchRule(o,x));
      if(r && o.category!==r.category){o.category=r.category;o.categoryRuleId=r.id;r.hits=(num(r.hits)||0)+1;changed++;}
    });
    if(changed){save(); if(showToast) toast(`Правила применены: ${changed} операций`);}
    else if(showToast) toast('Новых совпадений по правилам нет');
    return changed;
  }
  function v44LearnRuleFromOp(o,cat){
    if(!o||!cat) return null;
    const pattern=v44MerchantPattern(o.note||o.category||'');
    const rules=state.settings.categoryRules=state.settings.categoryRules||[];
    let r=rules.find(x=>String(x.pattern).toLowerCase()===pattern.toLowerCase());
    if(!r){r={id:uid(),pattern,category:cat,createdAt:new Date().toISOString(),hits:0};rules.unshift(r);}else{r.category=cat;r.updatedAt=new Date().toISOString();}
    return r;
  }
  function v44DedupeOpsByStableKey(){
    const seen=new Set(); let removed=0;
    state.operations=(state.operations||[]).filter(o=>{const k=o.bankKey||v44StableOpKey(o);o.bankKey=k;if(seen.has(k)){removed++;return false;}seen.add(k);return true;});
    return removed;
  }
  function v44ExpenseNeedReview(o){return o&&o.type==='expense' && !o.categoryReviewed;}
  function v44UnreviewedCount(){return (state.operations||[]).filter(v44ExpenseNeedReview).length;}

  function v44AttentionItems(){
    v44Ensure();
    const items=[];
    const tdy=today();
    (state.tasks||[]).filter(t=>t.status!=='Готово'&&t.date&&t.date<tdy).slice(0,8).forEach(t=>items.push({level:'critical',icon:'✅',title:`Просрочена задача: ${t.title||'Без названия'}`,sub:`${t.area||'Задачи'} · дата ${fmt(t.date)}`,go:'tasks'}));
    (state.tasks||[]).filter(t=>t.status!=='Готово'&&t.date===tdy).slice(0,5).forEach(t=>items.push({level:'ok',icon:'☀️',title:`Сегодня: ${t.title||'Задача'}`,sub:`${t.time||'без времени'} · ${t.area||'Задачи'}`,go:'tasks'}));
    (state.debts||[]).filter(d=>d.direction==='out'&&d.status!=='Закрыт').forEach(d=>{const days=v44DaysUntil(d.due); if(days<0)items.push({level:'critical',icon:'⚖️',title:`Просрочен долг: ${d.person} — ${money(d.amount)}`,sub:`срок был ${fmt(d.due)}`,go:'debts'}); else if(days<=7)items.push({level:'warn',icon:'⚖️',title:`Скоро платёж: ${d.person} — ${money(d.amount)}`,sub:`осталось дней: ${days}`,go:'debts'});});
    const unchecked=v44UnreviewedCount(); if(unchecked) items.push({level:'warn',icon:'🧾',title:`Проверить категории расходов: ${unchecked}`,sub:'После CSV часть операций требует ручной проверки',go:'expense-review'});
    const diary=(state.subconsciousEntries||[]).find(e=>e.date===tdy); if(!diary) items.push({level:'warn',icon:'🪞',title:'Дневник подсознания сегодня не заполнен',sub:'Ежедневный отклик себе занимает 2–3 минуты',go:'subconscious'});
    (state.habits||[]).filter(h=>!(h.marks||{})[tdy]).slice(0,4).forEach(h=>items.push({level:'ok',icon:h.icon||'🎯',title:`Привычка сегодня: ${h.name||'Привычка'}`,sub:h.area||'Ритм дня',go:'habits'}));
    (state.goals||[]).filter(g=>!(state.tasks||[]).some(t=>t.goalId===g.id&&t.status!=='Готово')).slice(0,4).forEach(g=>items.push({level:'warn',icon:'🚩',title:`Цель без следующего шага: ${g.title||'Цель'}`,sub:'Создай задачу недели, чтобы цель двигалась',go:'goals',goalId:g.id}));
    (state.people||[]).filter(p=>p.birthday).forEach(p=>{const left=v44BirthdayDays(p.birthday); if(left>=0&&left<=14)items.push({level:left<=3?'warn':'ok',icon:'👥',title:`День рождения: ${p.name}`,sub:left===0?'сегодня':`через ${left} дн.`,go:'people'});});
    (state.purchases||[]).filter(p=>p.includeInBudget!==false&&v44DaysUntil(p.date)>=0&&v44DaysUntil(p.date)<=14).slice(0,4).forEach(p=>items.push({level:'ok',icon:'🛒',title:`Плановая покупка: ${p.title} — ${money(p.amount)}`,sub:`дата ${fmt(p.date)} · влияет на бюджет`,go:'purchases'}));
    return items.sort((a,b)=>({critical:0,warn:1,ok:2}[a.level]-{critical:0,warn:1,ok:2}[b.level]));
  }
  function v44BirthdayDays(birth){
    const d=v44Date(birth); if(!d) return 9999; const now=new Date(); let next=new Date(now.getFullYear(),d.getMonth(),d.getDate()); if(next<new Date(now.getFullYear(),now.getMonth(),now.getDate())) next=new Date(now.getFullYear()+1,d.getMonth(),d.getDate()); return Math.ceil((next-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
  }
  function v44AttentionRow(it){
    const action=it.goalId?`<button class="mini green" data-action="createGoalWeeklyTask" data-id="${esc(it.goalId)}">Создать шаг</button>`:`<button class="mini blue" data-go="${esc(it.go||'dashboard')}">Открыть</button>`;
    return `<div class="v44-attention-row ${esc(it.level)}"><div class="v44-attention-icon">${esc(it.icon||'•')}</div><div><div class="v44-attention-title">${esc(it.title)}</div><div class="v44-attention-sub">${esc(it.sub||'')}</div></div><div class="row-actions">${action}</div></div>`;
  }
  function v44AttentionPage(){
    v44Ensure();v44Styles();
    const items=v44AttentionItems(); const critical=items.filter(x=>x.level==='critical').length, warn=items.filter(x=>x.level==='warn').length;
    const mode=state.settings.attentionMode||'all';
    const filtered=mode==='critical'?items.filter(x=>x.level==='critical'):mode==='warn'?items.filter(x=>x.level==='warn'):items;
    const unreviewed=v44UnreviewedCount();
    const noGoalTasks=(state.goals||[]).filter(g=>!(state.tasks||[]).some(t=>t.goalId===g.id&&t.status!=='Готово')).length;
    const diaryToday=Boolean((state.subconsciousEntries||[]).find(e=>e.date===today()));
    return layout('Центр внимания','Главный экран того, что требует действия сегодня: задачи, деньги, долги, категории, дневник, цели и люди.',`
      <section class="v44-hero-panel"><div class="card-head"><div><h3>Что важно сейчас</h3><p class="small muted">Система собирает сигналы из разных разделов и показывает только то, что требует внимания.</p></div><div class="row-actions"><button class="ghost-btn" data-go="global-search">Глобальный поиск</button><button class="btn" data-go="expense-review">Проверить расходы</button></div></div>
        <div class="v44-kpis"><article class="v44-kpi"><div class="label">Критично</div><div class="num red">${critical}</div><p class="small muted">просрочки и риски</p></article><article class="v44-kpi"><div class="label">Предупреждения</div><div class="num amber">${warn}</div><p class="small muted">важно проверить</p></article><article class="v44-kpi"><div class="label">Категории CSV</div><div class="num blue">${unreviewed}</div><p class="small muted">не подтверждены</p></article><article class="v44-kpi"><div class="label">Дневник</div><div class="num ${diaryToday?'green':'amber'}">${diaryToday?'✓':'—'}</div><p class="small muted">отклик за сегодня</p></article></div></section>
      <section class="v44-tabs"><button class="v44-tab ${mode==='all'?'active':''}" data-v44-action="attentionMode" data-mode="all">Все</button><button class="v44-tab ${mode==='critical'?'active':''}" data-v44-action="attentionMode" data-mode="critical">Критично</button><button class="v44-tab ${mode==='warn'?'active':''}" data-v44-action="attentionMode" data-mode="warn">Предупреждения</button></section>
      <section class="v44-section-grid"><article class="card"><div class="card-head"><h3>Очередь внимания</h3><span class="pill blue">${filtered.length}</span></div><div class="v44-attention-list">${filtered.map(v44AttentionRow).join('')||empty('Сейчас ничего не горит. Хороший момент для планирования недели.')}</div></article><aside class="grid"><article class="card"><h3>Недельный вывод дневника</h3>${v44DiaryInsight()}</article><article class="card"><h3>Цели без движения</h3><p class="small muted">Целей без активного шага: <b>${noGoalTasks}</b></p><button class="ghost-btn" data-go="goals">Открыть SMART-цели</button></article></aside></section>`);
  }
  function v44DiaryInsight(){
    const entries=(state.subconsciousEntries||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,7);
    if(!entries.length) return `<p class="small muted">Пока нет записей. Заполни дневник 3–7 дней, и здесь появятся повторяющиеся темы.</p><button class="ghost-btn" data-go="subconscious">Открыть дневник</button>`;
    const avgMood=Math.round(entries.reduce((s,e)=>s+num(e.mood),0)/Math.max(1,entries.filter(e=>num(e.mood)).length));
    const avgEnergy=Math.round(entries.reduce((s,e)=>s+num(e.energy),0)/Math.max(1,entries.filter(e=>num(e.energy)).length));
    const text=entries.map(e=>[e.body,e.summary,e.promise,e.signal].join(' ')).join(' ').toLowerCase();
    const words=['устал','тревог','деньги','работ','сон','полина','семья','тело','страх','спокой','радость','злость','энерг','долг','фокус'].filter(w=>text.includes(w));
    return `<div class="v44-mini-grid"><div class="record-card"><b>Среднее состояние</b><div class="value sm blue">${avgMood||'—'}/10</div></div><div class="record-card"><b>Средняя энергия</b><div class="value sm green">${avgEnergy||'—'}/10</div></div></div><p class="small muted" style="margin-top:12px">Повторяющиеся темы: ${words.length?words.map(esc).join(', '):'пока мало данных'}.</p><button class="ghost-btn" data-go="subconscious">Открыть дневник</button>`;
  }

  function v44SearchIndex(){
    v44Ensure(); const rows=[]; const add=(type,icon,go,title,text,obj)=>rows.push({type,icon,go,title:title||'Без названия',text:text||'',obj});
    (state.tasks||[]).forEach(x=>add('Задача','✅','tasks',x.title,`${x.area||''} ${x.date||''} ${x.note||''}`,x));
    (state.operations||[]).forEach(x=>add(x.type==='income'?'Доход':'Расход',x.type==='income'?'↗':'↙',x.type==='expense'?'expense-review':'finance',`${x.category||'Операция'} · ${money(x.amount)}`,`${x.date||''} ${x.note||''}`,x));
    (state.debts||[]).forEach(x=>add('Долг','⚖️','debts',`${x.person||'Долг'} · ${money(x.amount)}`,`${x.direction==='out'?'Я должен':'Мне должны'} ${x.due||''} ${x.note||''}`,x));
    (state.purchases||[]).forEach(x=>add('Покупка','🛒','purchases',x.title,`${money(x.amount)} ${x.date||''} ${x.area||''} ${x.note||''}`,x));
    (state.wishes||[]).forEach(x=>add('Желание','💗','wishes',x.title,`${money(x.amount)} ${x.area||''} ${x.note||''}`,x));
    (state.notes||[]).forEach(x=>add('Заметка','📝','notes',x.title,`${x.folder||''} ${x.text||''}`,x));
    (state.ideas||[]).forEach(x=>add('Идея','💡','ideas',x.title,x.text,x));
    (state.people||[]).forEach(x=>add('Человек','👥','people',x.name,`${x.role||''} ${x.likes||''} ${x.talkIdeas||''} ${x.gifts||''} ${x.notes||''}`,x));
    (state.habits||[]).forEach(x=>add('Привычка',x.icon||'🎯','habits',x.name,x.area,x));
    (state.goals||[]).forEach(x=>add('Цель','🚩','goals',x.title,`${x.area||''} ${x.note||''} ${money(x.target||0)}`,x));
    (state.documents||[]).forEach(x=>add('Документ','📄','documents',x.title,`${x.type||''} ${x.url||''} ${x.note||''}`,x));
    (state.books||[]).forEach(x=>add('Книга','📚','books',x.title,`${x.author||''} ${x.note||''} ${x.quotes||''}`,x));
    (state.films||[]).forEach(x=>add('Фильм','🎬','films',x.title,`${x.status||''} ${x.note||''}`,x));
    (state.trips||[]).forEach(x=>add('Путешествие','✈️','trips',x.title||x.place,`${x.date||''} ${x.budget||''} ${x.note||''}`,x));
    (state.subconsciousEntries||[]).forEach(x=>add('Дневник','🪞','subconscious',`Отклик ${fmt(x.date)}`,`${x.body||''} ${x.summary||''} ${x.promise||''} ${x.signal||''}`,x));
    (state.polinaDays||[]).forEach(x=>add('Полина','🌸','polina',`Полина · ${fmt(x.date)}`,`${x.mood||''} ${x.comment||''}`,x));
    (state.events||[]).forEach(x=>add('Календарь','📅','calendar',x.title,`${x.date||''} ${x.time||''} ${x.area||''} ${x.note||''}`,x));
    return rows;
  }
  function v44SearchResults(q){
    q=String(q||'').toLowerCase().trim();
    const all=v44SearchIndex(); if(!q) return all.slice(0,40);
    const terms=q.split(/\s+/).filter(Boolean);
    return all.map(r=>{const hay=[r.type,r.title,r.text].join(' ').toLowerCase(); const score=terms.reduce((s,t)=>s+(hay.includes(t)?1:0),0)+(String(r.title).toLowerCase().includes(q)?2:0); return {...r,score};}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,80);
  }
  function v44SearchPage(){
    v44Ensure();v44Styles(); const q=state.settings.globalSearchQuery||''; const results=v44SearchResults(q);
    return layout('Глобальный поиск','Быстрый поиск по задачам, финансам, людям, заметкам, целям, документам, Полине и дневнику.',`
      <section class="v44-search-panel"><div class="card-head"><div style="width:100%"><input id="v44SearchInput" class="v44-search-input" value="${esc(q)}" placeholder="Введите запрос: человек, сумма, задача, магазин, цель..."></div><button class="btn" data-v44-action="runSearch">Найти</button></div><p class="small muted">Найдено: ${results.length}. Горячая клавиша: Ctrl/⌘ + K.</p></section>
      <section class="v44-search-results">${results.map(r=>`<button class="v44-result" data-go="${esc(r.go)}"><span class="v44-result-type">${esc(r.icon)}</span><span><span class="v44-result-title">${esc(r.title)}</span><span class="v44-result-text">${esc(r.type)} · ${esc(v44Trunc(r.text,180))}</span></span><span class="pill blue">${esc(r.type)}</span></button>`).join('')||empty('Ничего не найдено. Попробуй другое слово или сумму.')}</section>`);
  }

  function v44Cats(){
    const base=['Продукты','Кафе / еда','Транспорт','Дом','Здоровье','Связь','Одежда','Маркетплейсы','Подписки','Развлечения','Подарки','Полина','Долги / банк','Налоги','Работа','Личное','Прочее'];
    const cats=new Set(base); (state.operations||[]).forEach(o=>{if(o.category) cats.add(o.category)}); (state.settings.categoryRules||[]).forEach(r=>{if(r.category) cats.add(r.category)});
    return [...cats].sort((a,b)=>a.localeCompare(b,'ru'));
  }
  function v44ReviewOps(){
    const mode=state.settings.expenseReviewMode||'all'; const q=String(state.settings.expenseReviewSearch||'').toLowerCase().trim();
    let ops=(state.operations||[]).filter(o=>o.type==='expense');
    if(mode==='review') ops=ops.filter(v44ExpenseNeedReview);
    if(q) ops=ops.filter(o=>[o.date,o.amount,o.category,o.note].some(v=>String(v||'').toLowerCase().includes(q)));
    return ops.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||num(b.amount)-num(a.amount));
  }
  function v44GroupOps(ops){
    const m={}; ops.forEach(o=>{const c=o.category||'Не определено'; (m[c]||(m[c]=[])).push(o)});
    return Object.entries(m).map(([cat,items])=>({cat,items,total:total(items),need:items.filter(v44ExpenseNeedReview).length})).sort((a,b)=>b.total-a.total);
  }
  function v44Datalist(){return `<datalist id="v44CatList">${v44Cats().map(c=>`<option value="${esc(c)}"></option>`).join('')}</datalist>`;}
  function v44OpRow(o){
    return `<div class="v44-op"><div><b>${fmt(o.date)}</b><div class="small muted">${esc(o.date||'')}</div></div><div><b>${esc(v44Trunc(o.note||'Операция банка',90))}</b><div class="small muted">${o.categoryReviewed?'Проверено':'К проверке'} · ключ дубля: ${esc(v44Trunc(o.bankKey||'',36))}</div></div><div><b class="red">−${money(o.amount)}</b></div><div><input data-v44-op-cat="${esc(o.id)}" list="v44CatList" value="${esc(o.category||'Не определено')}"></div><div class="row-actions"><button class="mini green" data-v44-action="saveCatLearn" data-id="${esc(o.id)}">Сохранить + запомнить</button><button class="mini blue" data-v44-action="saveCatOnly" data-id="${esc(o.id)}">Только сохранить</button><button class="mini" data-v44-action="markReviewed" data-id="${esc(o.id)}">Проверено</button></div></div>`;
  }
  function v44GroupHtml(g,i){
    return `<details class="v44-group" ${i<3||g.need?'open':''}><summary><div><h3 style="margin:0">${esc(g.cat)}</h3><div class="small muted">${g.items.length} операций · ${money(g.total)} · ${g.need} к проверке</div></div><div class="row-actions"><span class="pill blue">${money(g.total)}</span><span class="pill amber">${g.need}</span></div></summary><div class="v44-group-body"><div class="v44-review-toolbar"><div class="field" style="margin:0;min-width:260px"><label>Перенести всю группу в категорию</label><input data-v44-group-cat="${esc(g.cat)}" list="v44CatList" value="${esc(g.cat)}"></div><div class="row-actions"><button class="ghost-btn" data-v44-action="moveGroupLearn" data-cat="${esc(g.cat)}">Перенести + запомнить</button><button class="ghost-btn" data-v44-action="markGroupReviewed" data-cat="${esc(g.cat)}">Вся группа проверена</button></div></div>${g.items.map(v44OpRow).join('')}</div></details>`;
  }
  function v44RuleList(){
    const rules=state.settings.categoryRules||[];
    return `<div class="v44-rule-list">${rules.map(r=>`<div class="v44-rule"><div><b>${esc(r.pattern)}</b><div class="small muted">→ ${esc(r.category)} · применений: ${num(r.hits)||0}</div></div><button class="mini blue" data-v44-action="applyOneRule" data-id="${esc(r.id)}">Применить</button><button class="mini red" data-v44-action="deleteRule" data-id="${esc(r.id)}">Удалить</button></div>`).join('')||'<p class="small muted">Правил пока нет. Исправь категорию и нажми «Сохранить + запомнить».</p>'}</div>`;
  }
  function v44ExpenseReviewPage(){
    v44Ensure();v44Styles();v44ApplyRules(false);const removed=v44DedupeOpsByStableKey(); if(removed) save();
    const ops=v44ReviewOps(); const groups=v44GroupOps(ops); const unchecked=v44UnreviewedCount();
    const mode=state.settings.expenseReviewMode||'all';
    return layout('Категории расходов','Проверка CSV после банка: исправляй категории, запоминай правила и приложение будет учиться на следующих выгрузках.',`${v44Datalist()}
      <section class="v44-review-toolbar"><div><h3>Очередь проверки</h3><p class="small muted">К проверке: <b>${unchecked}</b>. Дубли считаются по стабильному ключу без категории, чтобы исправления не создавали повторные операции.</p></div><div class="row-actions"><button class="btn" data-v44-action="applyRules">Применить правила</button><button class="ghost-btn" data-go="finance">Финансы</button></div></section>
      <section class="v44-tabs"><button class="v44-tab ${mode==='all'?'active':''}" data-v44-action="reviewMode" data-mode="all">Все операции</button><button class="v44-tab ${mode==='review'?'active':''}" data-v44-action="reviewMode" data-mode="review">Только к проверке</button></section>
      <section class="v44-section-grid"><main>${groups.map(v44GroupHtml).join('')||empty('Нет расходов для проверки.')}</main><aside class="grid"><article class="v44-learn-card"><h3>Правила категорий</h3><p class="small muted">Когда ты исправляешь операцию и нажимаешь «запомнить», похожие операции в будущих CSV будут попадать в нужную категорию.</p>${v44RuleList()}</article><article class="card"><h3>Быстрый принцип</h3><p class="small muted">1) Исправь 5–10 самых частых магазинов. 2) Нажми «Сохранить + запомнить». 3) Следующая выгрузка будет значительно точнее.</p></article></aside></section>`);
  }

  function v44FindOp(id){return (state.operations||[]).find(o=>String(o.id)===String(id));}
  function v44CatInput(id){return document.querySelector(`[data-v44-op-cat="${CSS.escape(String(id))}"]`);}
  function v44SaveCategory(id,learn){
    v44Ensure(); const op=v44FindOp(id); if(!op) return toast('Операция не найдена'); const cat=String(v44CatInput(id)?.value||'').trim(); if(!cat) return toast('Укажи категорию');
    op.category=cat; op.categoryReviewed=true; op.categoryReviewedAt=new Date().toISOString();
    let applied=0; if(learn){const r=v44LearnRuleFromOp(op,cat); applied=v44ApplyRules(false); if(r) r.hits=(num(r.hits)||0)+1;}
    save(); render(); toast(learn?`Сохранено и запомнено. Похожих применено: ${applied}`:'Категория сохранена');
  }
  function v44MarkReviewed(id){const op=v44FindOp(id); if(!op)return toast('Операция не найдена'); op.categoryReviewed=true;op.categoryReviewedAt=new Date().toISOString();save();render();toast('Операция проверена');}
  function v44MoveGroup(cat,learn){
    const inp=document.querySelector(`[data-v44-group-cat="${CSS.escape(String(cat))}"]`); const next=String(inp?.value||'').trim(); if(!next)return toast('Укажи категорию'); let n=0, learned=0;
    (state.operations||[]).forEach(o=>{if(o.type==='expense'&&String(o.category||'Не определено')===String(cat)){o.category=next;o.categoryReviewed=true;o.categoryReviewedAt=new Date().toISOString();n++; if(learn){v44LearnRuleFromOp(o,next); learned++;}}});
    const applied=learn?v44ApplyRules(false):0; save(); render(); toast(`Перенесено: ${n}. Правил: ${learned}. Применено: ${applied}`);
  }
  function v44MarkGroup(cat){let n=0;(state.operations||[]).forEach(o=>{if(o.type==='expense'&&String(o.category||'Не определено')===String(cat)){o.categoryReviewed=true;o.categoryReviewedAt=new Date().toISOString();n++;}});save();render();toast(`Группа проверена: ${n}`);}
  function v44ApplyOneRule(id){const rules=state.settings.categoryRules||[];const r=rules.find(x=>x.id===id); if(!r)return; let n=0;(state.operations||[]).forEach(o=>{if(o.type==='expense'&&!o.categoryReviewed&&v44MatchRule(o,r)){o.category=r.category;o.categoryRuleId=r.id;n++;}});r.hits=(num(r.hits)||0)+n;save();render();toast(`Правило применено: ${n}`);}
  function v44DeleteRule(id){state.settings.categoryRules=(state.settings.categoryRules||[]).filter(r=>r.id!==id);save();render();toast('Правило удалено');}

  function v44DashboardInsert(){
    const view=document.querySelector('#view'); if(!view||document.querySelector('.v44-dashboard-insert')) return;
    const pageEl=view.querySelector('.page'); const hero=view.querySelector('.hero'); if(!pageEl||!hero) return;
    const items=v44AttentionItems(); const top=items.slice(0,4);
    const box=document.createElement('section'); box.className='v44-dashboard-insert v44-hero-panel';
    box.innerHTML=`<div class="card-head"><div><h3>Центр внимания</h3><p class="small muted">Самые важные сигналы из всех разделов на сегодня.</p></div><button class="ghost-btn" data-go="attention">Открыть центр</button></div><div class="v44-attention-list">${top.map(v44AttentionRow).join('')||'<div class="empty">Сейчас ничего не требует срочного внимания.</div>'}</div>`;
    hero.insertAdjacentElement('afterend',box);
  }
  function v44DiagnosticsAudit(){
    const checks=[
      ['Страницы в меню',Array.isArray(SECTIONS)&&SECTIONS.length>10,'Проверяет наличие реестра разделов'],
      ['Глобальный поиск',true,'Страница и горячая клавиша Ctrl/⌘+K'],
      ['Центр внимания',true,'Собирает задачи, долги, CSV, дневник и цели'],
      ['CSV категории',Array.isArray(state.operations),'Расходы можно проверять и обучать'],
      ['Правила категорий',Array.isArray(state.settings.categoryRules),'Исправленные магазины запоминаются'],
      ['Дневник подсознания',Array.isArray(state.subconsciousEntries),'Данные дневника читаются'],
      ['Синхронизация',Boolean(state.settings.sync?.gistId || state.settings.syncGistId),'Gist может быть не настроен'],
      ['Service Worker','serviceWorker' in navigator,'Доступен в браузере']
    ];
    return `<article class="card" data-v44-diagnostics><div class="card-head"><h3>V44 · инспекция системных функций</h3><span class="pill blue">${checks.filter(c=>c[1]).length}/${checks.length}</span></div><div class="v44-inspection-list">${checks.map(([name,ok,desc])=>`<div class="v44-check"><div><b>${esc(name)}</b><div class="small muted">${esc(desc)}</div></div><b class="${ok?'v44-good':'v44-warn'}">${ok?'OK':'Проверить'}</b></div>`).join('')}</div></article>`;
  }
  function v44PostRender(){
    try{
      v44Ensure();v44AddSection();v44Styles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      const view=document.querySelector('#view');
      if(!view) return;
      if(current==='attention'||page==='attention'){view.innerHTML=v44AttentionPage();}
      if(current==='global-search'||page==='global-search'){view.innerHTML=v44SearchPage(); setTimeout(()=>document.getElementById('v44SearchInput')?.focus(),20);}
      if(current==='expense-review'||page==='expense-review'){view.innerHTML=v44ExpenseReviewPage();}
      if(current==='dashboard'||page==='dashboard') v44DashboardInsert();
      if(current==='diagnostics'||page==='diagnostics'){
        if(!document.querySelector('[data-v44-diagnostics]')) view.querySelector('.page')?.insertAdjacentHTML('beforeend',`<section style="margin-top:16px">${v44DiagnosticsAudit()}</section>`);
      }
      const v=document.querySelector('.version'); if(v) v.textContent=V44_LABEL;
      const g=document.getElementById('globalSearch'); if(g && document.activeElement!==g) g.value=state.settings.globalSearchQuery||'';
    }catch(e){console.error('[V44 post render]',e);try{toast('Ошибка V44: '+(e.message||e))}catch(_){} }
  }

  const oldImportV44=typeof importBankCsv==='function'?importBankCsv:null;
  if(oldImportV44){
    importBankCsv=async function(){
      v44Ensure(); const before=new Set((state.operations||[]).map(o=>o.id));
      const res=await oldImportV44.apply(this,arguments);
      v44Ensure(); let newCount=0; (state.operations||[]).forEach(o=>{if(!before.has(o.id)){newCount++; if(o.type==='expense') o.categoryReviewed=false; o.bankKey=o.bankKey||v44StableOpKey(o);}});
      const removed=v44DedupeOpsByStableKey(); const applied=v44ApplyRules(false);
      state.settings.expenseReviewMode='review'; save();
      if(newCount||removed||applied){toast(`CSV обработан: новых ${newCount}, дублей удалено ${removed}, правил применено ${applied}`);}
      page='expense-review'; location.hash='expense-review'; render();
      return res;
    };
  }

  const oldRenderV44=typeof render==='function'?render:null;
  if(oldRenderV44){
    render=function(){
      v44Ensure();v44AddSection();v44Styles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      if(['attention','global-search','expense-review'].includes(current)) page=current;
      const res=oldRenderV44();
      setTimeout(v44PostRender,35);
      return res;
    };
  }

  window.addEventListener('click',function(e){
    const bell=e.target.closest&&e.target.closest('.top-actions .icon-btn');
    if(bell && !bell.dataset.action && /🔔/.test(bell.textContent||'')){e.preventDefault();e.stopPropagation();go('attention');return;}
    const el=e.target.closest&&e.target.closest('[data-v44-action]'); if(!el) return;
    const a=el.dataset.v44Action;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    try{
      if(a==='attentionMode'){state.settings.attentionMode=el.dataset.mode||'all';save();render();return;}
      if(a==='runSearch'){state.settings.globalSearchQuery=document.getElementById('v44SearchInput')?.value||document.getElementById('globalSearch')?.value||'';save();go('global-search');return;}
      if(a==='reviewMode'){state.settings.expenseReviewMode=el.dataset.mode||'all';save();render();return;}
      if(a==='saveCatLearn') return v44SaveCategory(el.dataset.id,true);
      if(a==='saveCatOnly') return v44SaveCategory(el.dataset.id,false);
      if(a==='markReviewed') return v44MarkReviewed(el.dataset.id);
      if(a==='moveGroupLearn') return v44MoveGroup(el.dataset.cat,true);
      if(a==='markGroupReviewed') return v44MarkGroup(el.dataset.cat);
      if(a==='applyRules'){v44ApplyRules(true);render();return;}
      if(a==='applyOneRule') return v44ApplyOneRule(el.dataset.id);
      if(a==='deleteRule') return v44DeleteRule(el.dataset.id);
    }catch(err){console.error('[V44 action]',err);try{toast('Ошибка V44: '+(err.message||err))}catch(_){} }
  },true);
  window.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault(); const g=document.getElementById('globalSearch')||document.getElementById('v44SearchInput'); if(g){g.focus();g.select?.();}else go('global-search');}
    if(e.key==='Enter' && e.target && (e.target.id==='globalSearch'||e.target.id==='sideSearch'||e.target.id==='v44SearchInput')){e.preventDefault();state.settings.globalSearchQuery=e.target.value||'';save();go('global-search');}
  },true);
  window.addEventListener('input',function(e){
    if(e.target && e.target.id==='globalSearch'){state.settings.globalSearchQuery=e.target.value||'';save();}
  },true);
  window.addEventListener('hashchange',()=>setTimeout(v44PostRender,45));
  try{v44Ensure();v44AddSection();v44Styles();v44ApplyRules(false);save();render();}catch(e){console.error('[V44 init]',e)}
})();

/* ===== V49 Focus Path Goals: clean additive integration, no data removal ===== */
(function(){
  'use strict';
  const V49_LABEL='V49 · FOCUS PATH GOALS';
  const V49_BUILD='second-brain-space-v49-focus-path-goals-20260708';
  try{localStorage.setItem('secondBrainOS.currentBuild',V49_BUILD)}catch(e){}

  function v49Ensure(){
    state.settings=state.settings||{};
    state.settings.v49=Object.assign({
      taskView:'today',
      goalView:'active',
      routeStep:'morning',
      focusMode:'standard',
      activeGoalId:'',
      morningFocus:'',
      dailyWin:'',
      eveningNote:'',
      lastRouteDate:today()
    },state.settings.v49||{});
    if(state.settings.v49.lastRouteDate!==today()){
      state.settings.v49.lastRouteDate=today();
      state.settings.v49.morningFocus='';
      state.settings.v49.dailyWin='';
      state.settings.v49.eveningNote='';
    }
    state.inbox=Array.isArray(state.inbox)?state.inbox:[];
    state.reviews=Array.isArray(state.reviews)?state.reviews:[];
    state.goals=(state.goals||[]).map(g=>{
      g.subgoals=Array.isArray(g.subgoals)?g.subgoals:[];
      g.steps=Array.isArray(g.steps)?g.steps:[];
      g.weeklyQuestion=g.weeklyQuestion||'';
      g.activeStepId=g.activeStepId||'';
      g.why=g.why||'';
      g.successCriteria=g.successCriteria||'';
      g.obstacle=g.obstacle||'';
      return g;
    });
    state.tasks=(state.tasks||[]).map(t=>{
      t.energy=t.energy||'Средне';
      t.duration=t.duration||'';
      t.weekStep=Boolean(t.weekStep);
      t.waiting=Boolean(t.waiting);
      return t;
    });
  }

  function v49AddSections(){
    if(!Array.isArray(SECTIONS)) return;
    if(!SECTIONS.some(s=>s.id==='focus-path')) SECTIONS.splice(1,0,{id:'focus-path',label:'Фокус дня',icon:'🧭',color:'#2563eb',group:'ПРОСТРАНСТВО'});
    if(!SECTIONS.some(s=>s.id==='inbox')) SECTIONS.splice(2,0,{id:'inbox',label:'Входящие',icon:'📥',color:'#0ea5e9',group:'ПРОСТРАНСТВО'});
    if(!SECTIONS.some(s=>s.id==='reviews')) SECTIONS.splice(3,0,{id:'reviews',label:'Обзоры',icon:'🔎',color:'#14b8a6',group:'ПРОСТРАНСТВО'});
  }

  function v49Styles(){
    if(document.getElementById('v49-focus-path-styles')) return;
    const css=`
      body{background:radial-gradient(circle at 15% 0%,rgba(37,99,235,.11),transparent 26%),radial-gradient(circle at 88% 0%,rgba(14,165,233,.13),transparent 28%),linear-gradient(180deg,#ffffff 0%,#f6fbff 44%,#eef7ff 100%)!important}.main{padding-top:18px!important}.page{width:100%;max-width:1500px!important}.wide-page{max-width:1520px!important}.card{overflow:visible}.row{grid-template-columns:44px minmax(0,1fr) auto!important;align-items:center!important}.row-title{line-height:1.25}.row-sub{line-height:1.35}.row-actions{min-width:max-content}.list{align-content:start}.cols-2{align-items:start}.version{background:linear-gradient(135deg,#0f172a,#2563eb)!important}.nav-item[data-go="focus-path"] .nav-ico{box-shadow:0 12px 22px rgba(37,99,235,.2)}
      .v49-route-hero{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(340px,.8fr);gap:16px;margin-bottom:16px}.v49-hero-card{border:1px solid rgba(191,219,254,.95);background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(239,247,255,.92));border-radius:28px;padding:20px;box-shadow:0 24px 60px rgba(37,99,235,.08)}.v49-eyebrow{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;background:#eef5ff;color:#2563eb;font-size:12px;font-weight:900;margin-bottom:12px}.v49-hero-title{font-size:34px;letter-spacing:-.06em;line-height:1.02;margin:0}.v49-hero-text{color:#64748b;font-weight:700;line-height:1.5;max-width:820px}.v49-route-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-top:16px}.v49-step{border:1px solid #e5edf7;background:#fff;border-radius:18px;padding:12px;text-align:left;display:grid;gap:6px;min-height:98px}.v49-step.active{border-color:#93c5fd;background:linear-gradient(180deg,#eef6ff,#fff);box-shadow:0 14px 28px rgba(37,99,235,.09)}.v49-step.done{border-color:#bbf7d0;background:#f0fdf4}.v49-step b{font-size:13px}.v49-step span{font-size:24px}.v49-step small{color:#64748b;font-weight:700}.v49-focus-grid{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(340px,.82fr);gap:16px}.v49-panel{background:#fff;border:1px solid #e6edf7;border-radius:24px;padding:16px;box-shadow:0 10px 26px rgba(15,23,42,.04)}.v49-panel h3{margin:0 0 8px}.v49-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.v49-kpi{background:#fff;border:1px solid #e6edf7;border-radius:22px;padding:15px;box-shadow:0 10px 26px rgba(15,23,42,.04)}.v49-kpi .num{font-size:28px;font-weight:900;letter-spacing:-.06em}.v49-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.v49-tab{border:1px solid #dbe7f6;background:#fff;border-radius:999px;padding:10px 13px;font-weight:900;color:#475569}.v49-tab.active{background:#2563eb;color:#fff;border-color:#2563eb;box-shadow:0 12px 26px rgba(37,99,235,.22)}.v49-task-list{display:grid;gap:10px}.v49-task{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:start;border:1px solid #e6edf7;background:rgba(255,255,255,.9);border-radius:20px;padding:12px}.v49-task:hover{border-color:#bfdbfe;background:#f8fbff}.v49-task.done{opacity:.65}.v49-task-check{width:38px;height:38px;border:0;border-radius:14px;background:#eef5ff;color:#2563eb;font-weight:900}.v49-task.done .v49-task-check{background:#dcfce7;color:#16a34a}.v49-task-title{font-weight:900;line-height:1.25}.v49-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.v49-meta span{font-size:11px;font-weight:850;color:#64748b;background:#f4f7fb;border:1px solid #e8eef7;border-radius:999px;padding:5px 7px}.v49-actions{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;max-width:390px}.v49-mini{height:30px;border:1px solid #e1eaf5;background:#fff;border-radius:10px;padding:0 9px;font-size:11px;font-weight:900;color:#334155}.v49-mini.blue{color:#2563eb;background:#f4f8ff}.v49-mini.green{color:#059669;background:#ecfdf5}.v49-mini.red{color:#dc2626;background:#fff7f7}.v49-mini.amber{color:#d97706;background:#fff7ed}.v49-question{display:grid;gap:8px}.v49-question textarea,.v49-question input{border:1px solid #dfe7f2;border-radius:16px;padding:12px;background:#fff;outline:0;width:100%;font-weight:700}.v49-question textarea{min-height:90px;resize:vertical}.v49-goal-card{border:1px solid #e5edf7;background:rgba(255,255,255,.94);border-radius:26px;padding:16px;box-shadow:0 12px 30px rgba(15,23,42,.045);display:grid;gap:14px}.v49-goal-top{display:flex;justify-content:space-between;gap:14px}.v49-progress-duo{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v49-progress-box{background:#fbfdff;border:1px solid #eaf0f8;border-radius:18px;padding:12px;display:grid;gap:8px}.v49-subgoal{border:1px solid #eaf0f8;background:#fbfdff;border-radius:20px;padding:12px;display:grid;gap:9px}.v49-sub-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}.v49-step-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px;border:1px solid #edf2f7;border-radius:14px;background:#fff}.v49-check{width:26px;height:26px;border:0;border-radius:9px;background:#eef5ff;color:#2563eb;font-weight:900}.v49-check.on{background:#dcfce7;color:#059669}.v49-empty{padding:18px;border:1px dashed #cbd5e1;border-radius:18px;background:#f8fbff;color:#64748b;font-weight:800}.v49-inbox-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.7fr);gap:16px}.v49-inbox-capture{display:grid;gap:10px}.v49-inbox-capture textarea{min-height:120px;border:1px solid #dfe7f2;border-radius:18px;padding:14px;resize:vertical;font-weight:750}.v49-type-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.v49-type{border:1px solid #e5edf7;background:#fff;border-radius:16px;padding:12px;font-weight:900;text-align:center}.v49-type.active{background:#eef5ff;color:#2563eb;border-color:#bfdbfe}.v49-review-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.v49-review-card{min-height:260px}.v49-life-wheel{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v49-wheel-item{border:1px solid #eaf0f8;border-radius:16px;padding:10px;background:#fff}.v49-fix-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.v49-system-check{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #eaf0f8;border-radius:16px;padding:10px;background:#fff}.v49-good{color:#059669}.v49-warn{color:#d97706}.v49-builder-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.v49-builder-grid .span-2{grid-column:1/-1}.v49-builder-field{display:grid;gap:6px}.v49-builder-field label{font-size:12px;color:#475569;font-weight:900}.v49-builder-field input,.v49-builder-field textarea,.v49-builder-field select{border:1px solid #dfe7f2;border-radius:16px;padding:12px;background:#fff;outline:0;font-weight:750}.v49-builder-field textarea{min-height:90px}.v49-route-mini{display:grid;gap:9px}.v49-route-mini .v49-system-check{background:#fbfdff}.v49-quick-line{display:flex;flex-wrap:wrap;gap:8px}.v49-highlight{border:1px solid #bfdbfe;background:linear-gradient(135deg,#f8fbff,#fff);border-radius:20px;padding:14px}.v49-calendar-card{min-height:100%;}.v49-date-column{display:grid;gap:9px}.v49-day-box{border:1px solid #eaf0f8;background:#fff;border-radius:18px;padding:12px}.v49-day-box h4{margin:0 0 8px}.v49-compact-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;border:1px solid #edf2f7;background:#fbfdff;border-radius:14px;padding:8px;margin-top:6px}.v49-compact-row b{font-size:13px;line-height:1.25}.v49-compact-row small{color:#64748b;font-weight:700}.v49-pill{display:inline-flex;padding:6px 9px;border-radius:999px;background:#eef5ff;color:#2563eb;font-weight:900;font-size:12px}.v49-division{height:1px;background:#eef2f7;margin:10px 0}.v49-task-list .empty,.v49-goal-card .empty{padding:16px;border-radius:18px}.v49-anti-card{border-color:#fed7aa;background:linear-gradient(135deg,#fff7ed,#fff)}
      .v49-focus-grid>aside .v49-task{grid-template-columns:40px minmax(0,1fr)!important;align-items:start!important}
      .v49-focus-grid>aside .v49-actions{grid-column:1/-1;justify-content:flex-start;max-width:none!important}
      .v49-focus-grid>aside .v49-task-title{font-size:14px;line-height:1.28;word-break:normal;overflow-wrap:anywhere}
      .v49-focus-grid>aside .v49-meta span{font-size:10.5px;padding:4px 7px}
      .v49-step,.v50-lesson-tab,.v50-path-step{will-change:auto;transform:none!important}
      @media(max-width:1380px){.v49-focus-grid{grid-template-columns:minmax(0,1fr) minmax(430px,.65fr)}.v49-route-hero{grid-template-columns:minmax(0,1fr) minmax(360px,.55fr)}}
      @media(max-width:1180px){.v49-route-hero,.v49-focus-grid,.v49-inbox-grid{grid-template-columns:1fr}.v49-route-steps{grid-template-columns:repeat(3,1fr)}.v49-kpi-grid,.v49-review-grid{grid-template-columns:repeat(2,1fr)}.v49-task{grid-template-columns:40px minmax(0,1fr)}.v49-actions{grid-column:1/-1;justify-content:flex-start;max-width:none}.v49-type-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:760px){.v49-route-steps,.v49-kpi-grid,.v49-review-grid,.v49-fix-grid,.v49-progress-duo,.v49-builder-grid,.v49-life-wheel{grid-template-columns:1fr}.v49-hero-title{font-size:28px}.v49-type-grid{grid-template-columns:1fr}.row-actions,.v49-actions{justify-content:flex-start}.row{grid-template-columns:40px minmax(0,1fr)!important}.row .row-actions{grid-column:1/-1}.debt-top{grid-template-columns:auto minmax(0,1fr)!important}.debt-top>div:last-child{grid-column:1/-1}.purchase-month-grid{grid-template-columns:1fr!important}.top-actions{gap:6px}.top-actions .ghost-btn:nth-child(2){display:none}}
    `;
    const style=document.createElement('style');style.id='v49-focus-path-styles';style.textContent=css;document.head.appendChild(style);
  }

  function v49ActiveTasks(){return (state.tasks||[]).filter(t=>t.status!=='Готово');}
  function v49CompletedTasks(){return (state.tasks||[]).filter(t=>t.status==='Готово');}
  function v49WeekEnd(){return iso(addDays(new Date(),6));}
  function v49WeekTasks(){const t=today(), end=v49WeekEnd(); return v49ActiveTasks().filter(x=>(x.date||t)>=t && (x.date||t)<=end);}
  function v49FastTasks(){return v49ActiveTasks().filter(t=>/5|10|15/.test(String(t.duration||'')) || /быстро|позвон|напис|провер/i.test(t.title||''));}
  function v49WaitingTasks(){return v49ActiveTasks().filter(t=>t.waiting||/ожида|жду|контроль|напомнить/i.test((t.title||'')+' '+(t.note||'')));}
  function v49SomedayTasks(){return v49ActiveTasks().filter(t=>!t.date || t.priority==='D' || /когда-нибудь|потом|идея/i.test((t.area||'')+' '+(t.note||'')));}
  function v49GoalTasks(goalId){return v49ActiveTasks().filter(t=>String(t.goalId||'')===String(goalId||''));}
  function v49GoalProgress(g){
    const metric=g.target?num(g.current)/Math.max(1,num(g.target))*100:0;
    const steps=[];
    (g.subgoals||[]).forEach(sg=>(sg.steps||[]).forEach(st=>steps.push(st)));
    (g.steps||[]).forEach(st=>steps.push(st));
    const action=steps.length?steps.filter(s=>s.done).length/steps.length*100:(v49GoalTasks(g.id).length?20:0);
    const sub=g.subgoals?.length?g.subgoals.filter(sg=>sg.done || ((sg.steps||[]).length && sg.steps.every(st=>st.done))).length/g.subgoals.length*100:action;
    return {metric:clamp(metric),actions:clamp(action),sub:clamp(sub),overall:clamp(Math.round((metric*.45)+(action*.35)+(sub*.2)))};
  }
  function v49MainGoal(){
    v49Ensure();
    let g=(state.goals||[]).find(x=>x.id===state.settings.v49.activeGoalId);
    if(!g) g=(state.goals||[]).find(x=>v49GoalTasks(x.id).some(t=>t.weekStep)) || (state.goals||[])[0];
    if(g && !state.settings.v49.activeGoalId){state.settings.v49.activeGoalId=g.id;}
    return g;
  }
  function v49MoneySnapshot(){try{return financeTotals(periodInfo('month'))}catch(e){return {inc:0,exp:0,planned:0,net:0}}}
  function v49TodayHabits(){return (state.habits||[]).map(h=>({h,done:Boolean(h.marks?.[today()])}));}
  function v49MarkDone(id){const t=(state.tasks||[]).find(x=>x.id===id); if(!t) return; t.status=t.status==='Готово'?'Активно':'Готово'; save(); render(); toast(t.status==='Готово'?'Задача выполнена':'Задача возвращена');}
  function v49SetTaskView(view){state.settings.v49.taskView=view||'today'; save(); render();}
  function v49SetGoalView(view){state.settings.v49.goalView=view||'active'; save(); render();}
  function v49SetRouteStep(step){
    const y=window.scrollY||document.documentElement.scrollTop||0;
    state.settings.v49.routeStep=step||'morning';
    save();
    render();
    requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'}));
  }
  function v49SetActiveGoal(id){state.settings.v49.activeGoalId=id||''; save(); render(); toast('Фокусная цель обновлена');}
  function v49TaskDate(id,date){const t=(state.tasks||[]).find(x=>x.id===id); if(!t) return; t.date=date||today(); save(); render(); toast('Дата задачи обновлена');}
  function v49WeekStep(id){const t=(state.tasks||[]).find(x=>x.id===id); if(!t) return; t.weekStep=!t.weekStep; t.goalId=t.goalId||state.settings.v49.activeGoalId||''; save(); render(); toast(t.weekStep?'Назначено шагом недели':'Шаг недели снят');}
  function v49Waiting(id){const t=(state.tasks||[]).find(x=>x.id===id); if(!t) return; t.waiting=!t.waiting; save(); render(); toast(t.waiting?'Перенесено в ожидание':'Снято с ожидания');}

  function v49TaskRow(t){
    const goal=(state.goals||[]).find(g=>g.id===t.goalId);
    return `<article class="v49-task ${t.status==='Готово'?'done':''}">
      <button class="v49-task-check" data-v49-action="toggleTaskDone" data-id="${esc(t.id)}">${t.status==='Готово'?'✓':'○'}</button>
      <div><div class="v49-task-title">${esc(t.title||'Задача')}</div><div class="row-sub">${fmt(t.date)} · ${esc(t.time||'без времени')} · ${esc(t.area||'Личное')}</div>
        <div class="v49-meta">${goal?`<span>🚩 ${esc(goal.title)}</span>`:''}${t.weekStep?'<span>⭐ шаг недели</span>':''}${t.duration?`<span>⏱ ${esc(t.duration)}</span>`:''}${t.energy?`<span>⚡ ${esc(t.energy)}</span>`:''}${t.waiting?'<span>⏳ ожидание</span>':''}${t.google?'<span>Google</span>':''}</div></div>
      <div class="v49-actions"><button class="v49-mini blue" data-v49-action="openTaskBreakdown" data-id="${esc(t.id)}">Разбить</button><button class="v49-mini green" data-v49-action="weekStep" data-id="${esc(t.id)}">Шаг недели</button><button class="v49-mini" data-v49-action="taskTomorrow" data-id="${esc(t.id)}">Завтра</button><button class="v49-mini amber" data-v49-action="waiting" data-id="${esc(t.id)}">Ожидаю</button><button class="v49-mini blue" data-action="googleTask" data-id="${esc(t.id)}">Google</button><button class="v49-mini blue" data-action="editRecord" data-type="task" data-id="${esc(t.id)}">Ред.</button><button class="v49-mini red" data-action="deleteRecord" data-type="task" data-id="${esc(t.id)}">Удалить</button></div>
    </article>`;
  }
  function v49TaskCalendar(){
    const days=[0,1,2,3].map(n=>iso(addDays(new Date(),n)));
    return `<div class="v49-date-column">${days.map(d=>`<div class="v49-day-box"><h4>${fmt(d)}</h4>${v49ActiveTasks().filter(t=>t.date===d).slice(0,5).map(t=>`<div class="v49-compact-row"><span class="avatar" style="width:32px;height:32px;border-radius:12px">${t.weekStep?'⭐':'✓'}</span><span><b>${esc(t.title)}</b><small>${esc(t.time||'без времени')}</small></span></div>`).join('')||'<div class="v49-empty">Пусто</div>'}</div>`).join('')}</div>`;
  }
  function v49TasksForView(view){
    const active=v49ActiveTasks().slice().sort((a,b)=>String((a.date||'9999')+(a.time||'')).localeCompare(String((b.date||'9999')+(b.time||''))));
    if(view==='today') return active.filter(t=>t.date===today() || (t.date&&t.date<today()));
    if(view==='week') return v49WeekTasks();
    if(view==='goals') return active.filter(t=>t.goalId);
    if(view==='fast') return v49FastTasks();
    if(view==='waiting') return v49WaitingTasks();
    if(view==='someday') return v49SomedayTasks();
    return active;
  }
  function v49TaskKpis(){
    const todayCount=v49ActiveTasks().filter(t=>t.date===today()).length;
    const overdue=v49ActiveTasks().filter(t=>t.date&&t.date<today()).length;
    const week=v49WeekTasks().length;
    const goalLinked=v49ActiveTasks().filter(t=>t.goalId).length;
    return `<section class="v49-kpi-grid"><article class="v49-kpi"><div class="small muted">Сегодня</div><div class="num blue">${todayCount}</div></article><article class="v49-kpi"><div class="small muted">Просрочено</div><div class="num red">${overdue}</div></article><article class="v49-kpi"><div class="small muted">Эта неделя</div><div class="num green">${week}</div></article><article class="v49-kpi"><div class="small muted">Связано с целями</div><div class="num violet">${goalLinked}</div></article></section>`;
  }
  function v49TasksPage(){
    v49Ensure();v49Styles();
    const view=state.settings.v49.taskView||'today';
    const rows=v49TasksForView(view);
    const tabs=[['today','Сегодня'],['week','Эта неделя'],['goals','По целям'],['fast','Быстрые'],['waiting','Ожидаю'],['someday','Когда-нибудь'],['all','Все']];
    return layout('Задачи','Лента исполнения: сначала главное, потом недельные шаги, быстрые дела и контроль ожиданий.',`${v49TaskKpis()}<section class="grid cols-2" style="margin-top:16px"><article class="card"><div class="card-head"><div><h3>Лента задач</h3><p class="small muted">Выбери режим, чтобы не тонуть во всём списке сразу.</p></div><button class="btn" data-action="openRecordForm" data-type="task">＋ Новая задача</button></div><div class="v49-tabs">${tabs.map(([id,l])=>`<button class="v49-tab ${view===id?'active':''}" data-v49-action="taskView" data-view="${id}">${l}</button>`).join('')}</div><div class="v49-task-list">${rows.map(v49TaskRow).join('')||'<div class="v49-empty">В этом режиме задач нет.</div>'}</div></article><aside class="card v49-calendar-card"><div class="card-head"><div><h3>Календарь задач</h3><p class="small muted">Ближайшие 4 дня без перегруза.</p></div><button class="ghost-btn" data-action="openRecordForm" data-type="task">＋ Добавить</button></div>${v49TaskCalendar()}</aside></section>`);
  }

  function v49GoalStepRows(g,sg){
    const list=sg?(sg.steps||[]):(g.steps||[]);
    return list.map(st=>`<div class="v49-step-row"><button class="v49-check ${st.done?'on':''}" data-v49-action="toggleGoalStep" data-goal="${esc(g.id)}" data-sub="${esc(sg?.id||'')}" data-step="${esc(st.id)}">${st.done?'✓':'○'}</button><span><b>${esc(st.title||'Шаг')}</b><div class="small muted">${esc(st.note||'')}</div></span><button class="v49-mini blue" data-v49-action="makeStepTask" data-goal="${esc(g.id)}" data-sub="${esc(sg?.id||'')}" data-step="${esc(st.id)}">В задачу</button></div>`).join('') || '<div class="v49-empty">Шагов пока нет.</div>';
  }
  function v49GoalCard(g){
    const p=v49GoalProgress(g), task=v49GoalTasks(g.id).find(t=>t.weekStep)||v49GoalTasks(g.id)[0];
    return `<article class="v49-goal-card"><div class="v49-goal-top"><div><h3>${esc(g.title||'Цель')}</h3><p class="small muted">${esc(g.kind||'Цель')} · ${esc(g.area||'')} · срок ${fmt(g.deadline)}</p></div><div class="row-actions"><button class="v49-mini ${state.settings.v49.activeGoalId===g.id?'green':'blue'}" data-v49-action="setActiveGoal" data-id="${esc(g.id)}">В фокус</button><span class="pill blue">${p.overall}%</span></div></div>
      <div class="v49-progress-duo"><div class="v49-progress-box"><b>Прогресс результата</b>${prog(p.metric,'green')}<p class="small muted">${money(g.current||0)} из ${money(g.target||0)}</p></div><div class="v49-progress-box"><b>Прогресс действий</b>${prog(p.actions,'green')}<p class="small muted">шаги и подцели</p></div></div>
      <div class="v49-highlight"><b>Вопрос недели</b><p class="small muted">Что я могу сделать на этой неделе, чтобы приблизиться к этой цели?</p><div class="row-actions"><button class="v49-mini green" data-v49-action="openWeeklyQuestion" data-id="${esc(g.id)}">Ответить</button><button class="v49-mini blue" data-v49-action="openGoalBuilder" data-id="${esc(g.id)}">Разбить цель</button><button class="v49-mini blue" data-action="editRecord" data-type="goal" data-id="${esc(g.id)}">Ред.</button></div></div>
      <div class="record-card"><b>Активная задача недели</b>${task?v49TaskRow(task):'<p class="small muted">Нет активной задачи. Создай шаг недели.</p>'}<div class="row-actions"><button class="v49-mini green" data-action="createGoalWeeklyTask" data-id="${esc(g.id)}">Создать шаг недели</button></div></div>
      <div><b>Подцели</b><div class="list" style="margin-top:9px">${(g.subgoals||[]).map(sg=>`<div class="v49-subgoal"><div class="v49-sub-head"><button class="v49-check ${sg.done?'on':''}" data-v49-action="toggleSubgoal" data-goal="${esc(g.id)}" data-sub="${esc(sg.id)}">${sg.done?'✓':'○'}</button><span><b>${esc(sg.title||'Подцель')}</b><div class="small muted">${esc(sg.note||'')}</div></span><button class="v49-mini blue" data-v49-action="addStepToSubgoal" data-goal="${esc(g.id)}" data-sub="${esc(sg.id)}">＋ шаг</button></div>${v49GoalStepRows(g,sg)}</div>`).join('')||'<div class="v49-empty">Подцелей пока нет. Нажми «Разбить цель».</div>'}</div></div>
      <div class="row-actions"><button class="v49-mini green" data-v49-action="addSubgoal" data-id="${esc(g.id)}">＋ Подцель</button><button class="v49-mini blue" data-v49-action="addRootGoalStep" data-id="${esc(g.id)}">＋ Шаг</button><button class="v49-mini red" data-action="deleteRecord" data-type="goal" data-id="${esc(g.id)}">Удалить</button></div>
    </article>`;
  }
  function v49GoalsPage(){
    v49Ensure();v49Styles();
    const view=state.settings.v49.goalView||'active';
    const active=v49MainGoal();
    const goals=view==='active'&&active?[active]:state.goals;
    return layout('SMART-цели','Цели теперь не просто список: цель → подцели → шаги → шаг недели → задача дня.',`<section class="v49-route-hero"><article class="v49-hero-card"><span class="v49-eyebrow">🚩 Помощник по целям</span><h2 class="v49-hero-title">Разложи большую цель на понятные действия</h2><p class="v49-hero-text">Главное правило: одна цель в фокусе, один шаг недели, одна задача дня. Так приложение ведёт тебя без перегруза и прокрастинации.</p><div class="v49-quick-line"><button class="btn" data-v49-action="openGoalBuilder">＋ Мастер цели</button><button class="ghost-btn" data-action="openRecordForm" data-type="goal">Обычная цель</button><button class="ghost-btn" data-action="addFinancialGoal">Финансовая цель</button></div></article><aside class="v49-panel"><h3>Формула движения</h3><div class="v49-route-mini"><div class="v49-system-check"><span>Цель</span><b>смысл</b></div><div class="v49-system-check"><span>Подцели</span><b>этапы</b></div><div class="v49-system-check"><span>Шаг недели</span><b>фокус</b></div><div class="v49-system-check"><span>Задача дня</span><b>действие</b></div></div></aside></section><div class="v49-tabs"><button class="v49-tab ${view==='active'?'active':''}" data-v49-action="goalView" data-view="active">Фокусная цель</button><button class="v49-tab ${view==='all'?'active':''}" data-v49-action="goalView" data-view="all">Все цели</button></div><section class="grid cols-2">${goals.map(v49GoalCard).join('')||'<div class="v49-empty">Целей пока нет.</div>'}</section>`);
  }

  function v49FocusPage(){
    v49Ensure();v49Styles();
    const v=state.settings.v49, goal=v49MainGoal(), gp=goal?v49GoalProgress(goal):null, f=v49MoneySnapshot();
    const habits=v49TodayHabits(), doneHabits=habits.filter(x=>x.done).length;
    const step=v.routeStep||'morning';
    const weekTask=goal?(v49GoalTasks(goal.id).find(t=>t.weekStep)||v49GoalTasks(goal.id)[0]):null;
    const focusTasks=[weekTask,...v49ActiveTasks().filter(t=>t.date===today()&&(!weekTask||t.id!==weekTask.id)).slice(0,3)].filter(Boolean);
    const steps=[['morning','☀️','Утренний фокус'],['goals','🚩','Цель'],['tasks','✅','Задачи'],['habits','🎯','Привычки'],['finance','💸','Финансы'],['evening','🌙','Закрытие']];
    const body={
      morning:`<div class="v49-question"><h3>Утренний фокус</h3><p class="small muted">Ответь коротко. Не надо идеально — надо начать.</p><label class="small muted">Что сегодня самое важное?</label><textarea id="v49MorningFocus">${esc(v.morningFocus||'')}</textarea><label class="small muted">Какая маленькая победа сделает день хорошим?</label><input id="v49DailyWin" value="${esc(v.dailyWin||'')}"><div class="row-actions"><button class="btn" data-v49-action="saveMorningFocus">Сохранить фокус</button><button class="ghost-btn" data-v49-action="routeStep" data-step="goals">Дальше: цель →</button></div></div>`,
      goals:`<div><h3>Цель в фокусе</h3>${goal?`<div class="v49-highlight"><h3>${esc(goal.title)}</h3><p class="small muted">${esc(goal.area||'')} · общий прогресс ${gp.overall}%</p>${prog(gp.overall,'green')}<div class="v49-division"></div><p><b>Вопрос:</b> что я могу сделать на этой неделе, чтобы приблизиться?</p><div class="row-actions"><button class="btn" data-v49-action="openWeeklyQuestion" data-id="${esc(goal.id)}">Ответить и создать шаг</button><button class="ghost-btn" data-go="goals">Открыть цели</button></div></div>`:'<div class="v49-empty">Создай первую цель, чтобы появился маршрут.</div>'}<div class="row-actions" style="margin-top:12px"><button class="ghost-btn" data-v49-action="routeStep" data-step="tasks">Дальше: задачи →</button></div></div>`,
      tasks:`<div><h3>Что реально сделать сегодня</h3><p class="small muted">Не больше 3–4 действий. Остальное не должно давить.</p><div class="v49-task-list">${focusTasks.map(v49TaskRow).join('')||'<div class="v49-empty">Нет задач на сегодня. Создай маленький шаг.</div>'}</div><div class="row-actions" style="margin-top:12px"><button class="btn" data-action="openRecordForm" data-type="task">＋ Добавить задачу</button><button class="ghost-btn" data-go="tasks">Открыть ленту</button><button class="ghost-btn" data-v49-action="routeStep" data-step="habits">Дальше: привычки →</button></div></div>`,
      habits:`<div><h3>Привычки сегодня</h3><p class="small muted">Поддерживающая система, не экзамен.</p><div class="v49-kpi"><div class="small muted">Выполнено</div><div class="num green">${doneHabits}/${habits.length}</div>${prog(habits.length?doneHabits/habits.length*100:0,'green')}</div><div class="list" style="margin-top:12px">${habits.slice(0,6).map(({h,done})=>`<div class="v49-step-row"><button class="v49-check ${done?'on':''}" data-action="toggleHabitDay" data-id="${esc(h.id)}" data-date="${today()}">${done?'✓':'○'}</button><span><b>${esc(h.name)}</b><div class="small muted">${esc(h.area||'')}</div></span></div>`).join('')}</div><div class="row-actions" style="margin-top:12px"><button class="ghost-btn" data-go="habits">Открыть трекер</button><button class="ghost-btn" data-v49-action="routeStep" data-step="finance">Дальше: финансы →</button></div></div>`,
      finance:`<div><h3>Финансовая проверка 2 минуты</h3><div class="v49-kpi-grid"><article class="v49-kpi"><div class="small muted">Доходы</div><div class="num green">${money(f.inc)}</div></article><article class="v49-kpi"><div class="small muted">Расходы</div><div class="num red">${money(f.exp)}</div></article><article class="v49-kpi"><div class="small muted">План покупок</div><div class="num blue">${money(f.planned)}</div></article><article class="v49-kpi"><div class="small muted">Прогноз</div><div class="num ${f.net>=0?'green':'red'}">${money(f.net)}</div></article></div><div class="row-actions"><button class="btn" data-go="finance">Открыть финансы</button><button class="ghost-btn" data-go="expense-review">Категории расходов</button><button class="ghost-btn" data-v49-action="routeStep" data-step="evening">Дальше: закрытие →</button></div></div>`,
      evening:`<div class="v49-question"><h3>Вечернее закрытие</h3><p class="small muted">Закрой день без самокритики. Только факты и следующий шаг.</p><label class="small muted">Что получилось сегодня?</label><textarea id="v49EveningNote">${esc(v.eveningNote||'')}</textarea><div class="row-actions"><button class="btn" data-v49-action="saveEvening">Сохранить итог</button><button class="ghost-btn" data-v49-action="routeStep" data-step="morning">Вернуться в начало</button></div></div>`
    }[step]||'';
    return layout('Фокус дня','Пошаговый маршрут, чтобы не прокрастинировать: сначала фокус, потом цели, задачи, привычки, финансы и закрытие дня.',`<section class="v49-route-hero"><article class="v49-hero-card"><span class="v49-eyebrow">🧭 Маршрут дня</span><h2 class="v49-hero-title">Не думай, с чего начать — иди по шагам</h2><p class="v49-hero-text">Эта страница не заменяет старые разделы. Она связывает их в правильную последовательность: цель → шаг недели → задачи → привычки → финансы → итоги.</p><div class="v49-route-steps">${steps.map(([id,ico,label])=>`<button class="v49-step ${step===id?'active':''}" data-v49-action="routeStep" data-step="${id}"><span>${ico}</span><b>${label}</b><small>${id==='goals'&&goal?esc(goal.title.slice(0,34)):'открыть шаг'}</small></button>`).join('')}</div></article><aside class="v49-panel"><h3>Пульс дня</h3><div class="v49-route-mini"><div class="v49-system-check"><span>Фокусная цель</span><b>${goal?esc(goal.title.slice(0,24)):'нет'}</b></div><div class="v49-system-check"><span>Задачи сегодня</span><b>${v49ActiveTasks().filter(t=>t.date===today()).length}</b></div><div class="v49-system-check"><span>Привычки</span><b>${doneHabits}/${habits.length}</b></div><div class="v49-system-check"><span>Финансы</span><b class="${f.net>=0?'v49-good':'v49-warn'}">${money(f.net)}</b></div></div></aside></section><section class="v49-focus-grid"><article class="card">${body}</article><aside class="grid"><article class="card v49-anti-card"><h3>Антипрокрастинация</h3><p class="small muted">Если завис — не ругай себя. Выбери одно действие.</p><div class="row-actions" style="justify-content:flex-start"><button class="v49-mini blue" data-v49-action="makeTinyTask">Сделать шаг на 15 минут</button><button class="v49-mini green" data-go="tasks">Открыть быстрые задачи</button><button class="v49-mini amber" data-v49-action="openInboxCapture">Сбросить мысль</button></div></article><article class="card"><h3>Сегодняшние 3 действия</h3><div class="v49-task-list">${focusTasks.slice(0,3).map(v49TaskRow).join('')||'<div class="v49-empty">Выбери шаг цели или добавь задачу.</div>'}</div></article></aside></section>`);
  }

  function v49InboxPage(){
    v49Ensure();v49Styles();
    const type=state.settings.v49.inboxType||'task';
    const types=[['task','✅','Задача'],['note','📝','Заметка'],['idea','💡','Идея'],['debt','⚖️','Долг'],['purchase','🛒','Покупка'],['wish','💗','Желание'],['person','👥','Человек'],['finance','💸','Финансы']];
    return layout('Входящие','Быстрый захват мыслей без перегруза. Сначала складывай сюда, потом разбирай по системе.',`<section class="v49-inbox-grid"><article class="card"><div class="card-head"><div><h3>Быстрый сброс</h3><p class="small muted">Запиши как есть. Потом можно превратить в задачу, заметку, покупку или цель.</p></div><span class="pill blue">${state.inbox.length}</span></div><div class="v49-inbox-capture"><div class="v49-type-grid">${types.map(([id,ico,l])=>`<button class="v49-type ${type===id?'active':''}" data-v49-action="inboxType" data-type="${id}">${ico}<br>${l}</button>`).join('')}</div><textarea id="v49InboxText" placeholder="Что нужно не забыть?"></textarea><div class="row-actions"><button class="btn" data-v49-action="saveInbox">Сохранить во входящие</button><button class="ghost-btn" data-v49-action="processInboxAll">Разобрать автоматически</button></div></div></article><aside class="card"><h3>Правило Inbox</h3><p class="small muted">Входящие нужны, чтобы мозг не держал всё внутри. Не надо сразу идеально раскладывать — сначала зафиксируй.</p><div class="v49-route-mini"><div class="v49-system-check"><span>1. Захватить</span><b>10 сек.</b></div><div class="v49-system-check"><span>2. Разобрать</span><b>вечером</b></div><div class="v49-system-check"><span>3. Превратить</span><b>в действие</b></div></div></aside></section><section class="card" style="margin-top:16px"><div class="card-head"><h3>Очередь входящих</h3><button class="ghost-btn" data-v49-action="processInboxAll">Разобрать всё</button></div><div class="v49-task-list">${state.inbox.map(x=>`<article class="v49-task"><span class="avatar">${esc((types.find(t=>t[0]===x.type)||['','📥'])[1])}</span><div><div class="v49-task-title">${esc(x.text)}</div><div class="row-sub">${fmt(x.date)} · ${esc((types.find(t=>t[0]===x.type)||['','','Запись'])[2])}</div></div><div class="v49-actions"><button class="v49-mini green" data-v49-action="processInbox" data-id="${esc(x.id)}">В систему</button><button class="v49-mini red" data-v49-action="deleteInbox" data-id="${esc(x.id)}">Удалить</button></div></article>`).join('')||'<div class="v49-empty">Входящие пусты.</div>'}</div></section>`);
  }

  function v49ReviewsPage(){
    v49Ensure();v49Styles();
    const f=v49MoneySnapshot();
    const areas=[['Финансы',f.net>=0?70:35],['Цели',state.goals.length?60:15],['Задачи',v49CompletedTasks().length?55:30],['Привычки',state.habits.length?Math.round(v49TodayHabits().filter(x=>x.done).length/Math.max(1,state.habits.length)*100):0],['Личное',state.personal?.length?55:20],['Порядок',state.inbox.length?35:70]];
    return layout('Обзоры','День, неделя и месяц: не для контроля ради контроля, а чтобы видеть движение жизни.',`<section class="v49-review-grid"><article class="card v49-review-card"><h3>Ежедневное закрытие</h3><p class="small muted">Что сделал, что перенести, какой первый шаг завтра?</p><div class="v49-question"><textarea id="v49DailyReview" placeholder="Итог дня...">${esc(state.settings.v49.eveningNote||'')}</textarea><button class="btn" data-v49-action="saveDailyReview">Сохранить</button></div></article><article class="card v49-review-card"><h3>Недельный обзор</h3><div class="v49-route-mini"><div class="v49-system-check"><span>Задач выполнено</span><b>${v49CompletedTasks().length}</b></div><div class="v49-system-check"><span>Шагов недели</span><b>${v49ActiveTasks().filter(t=>t.weekStep).length}</b></div><div class="v49-system-check"><span>Входящие</span><b>${state.inbox.length}</b></div><div class="v49-system-check"><span>Целей</span><b>${state.goals.length}</b></div></div></article><article class="card v49-review-card"><h3>Колесо жизни</h3><div class="v49-life-wheel">${areas.map(([n,p])=>`<div class="v49-wheel-item"><b>${n}</b>${prog(p,p>60?'green':p>35?'amber':'red')}<div class="small muted">${p}%</div></div>`).join('')}</div></article></section><section class="card" style="margin-top:16px"><h3>Что проверить раз в неделю</h3><div class="v49-fix-grid"><div class="v49-system-check"><span>1. Все входящие разобраны?</span><b>${state.inbox.length?'нет':'да'}</b></div><div class="v49-system-check"><span>2. У каждой цели есть шаг недели?</span><b>${state.goals.filter(g=>v49GoalTasks(g.id).length).length}/${state.goals.length}</b></div><div class="v49-system-check"><span>3. Финансы сверены?</span><b>${money(f.net)}</b></div><div class="v49-system-check"><span>4. Привычки поддерживают цели?</span><b>${state.habits.length}</b></div></div></section>`);
  }

  function v49PromptSteps(title){
    const t=String(title||'цель').toLowerCase();
    if(/доход|деньг|финанс|руб|₽|зараб/i.test(t)) return ['Посчитать текущий доход и обязательные платежи','Найти 1 источник роста дохода','Определить первый платный продукт / услугу / сделку','Запланировать 3 действия на неделю','Проверить результат и скорректировать план'];
    if(/здоров|вес|тело|спорт|сон/i.test(t)) return ['Зафиксировать текущую точку','Выбрать минимальную привычку на каждый день','Запланировать 2–3 тренировки / прогулки','Убрать один очевидный вредный фактор','Проверить самочувствие через неделю'];
    return ['Описать точный результат','Разбить на 3–5 этапов','Выбрать первый маленький шаг на 15 минут','Назначить шаг недели','Проверить прогресс в конце недели'];
  }
  function v49OpenGoalBuilder(id=''){
    v49Ensure(); const g=id?(state.goals||[]).find(x=>x.id===id):null;
    const suggestions=v49PromptSteps(g?.title||'');
    openModal(g?'Разбить цель на подцели':'Мастер новой цели',`<div class="v49-builder-grid"><div class="v49-builder-field span-2"><label>Цель</label><input id="v49GoalTitle" value="${esc(g?.title||'')}"></div><div class="v49-builder-field"><label>Сфера</label><input id="v49GoalArea" value="${esc(g?.area||'Финансы')}"></div><div class="v49-builder-field"><label>Срок</label><input id="v49GoalDeadline" type="date" value="${esc(g?.deadline||'')}"></div><div class="v49-builder-field"><label>Текущая цифра</label><input id="v49GoalCurrent" inputmode="decimal" value="${esc(g?.current||'')}"></div><div class="v49-builder-field"><label>Целевая цифра</label><input id="v49GoalTarget" inputmode="decimal" value="${esc(g?.target||'')}"></div><div class="v49-builder-field span-2"><label>Почему это важно?</label><textarea id="v49GoalWhy">${esc(g?.why||'')}</textarea></div><div class="v49-builder-field span-2"><label>Как пойму, что цель достигнута?</label><textarea id="v49GoalSuccess">${esc(g?.successCriteria||'')}</textarea></div><div class="v49-builder-field span-2"><label>Что может помешать?</label><textarea id="v49GoalObstacle">${esc(g?.obstacle||'')}</textarea></div><div class="v49-builder-field span-2"><label>Предложенные этапы / подцели</label><textarea id="v49GoalSubgoals">${esc((g?.subgoals?.length?g.subgoals.map(x=>x.title):suggestions).join('\n'))}</textarea></div><div class="v49-builder-field span-2"><label>Первый шаг недели</label><textarea id="v49GoalWeekly">${esc(g?.weeklyQuestion||g?.note||suggestions[2]||'')}</textarea></div></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-v49-action="saveGoalBuilder" ${g?`data-id="${esc(g.id)}"`:''}>Сохранить и создать шаг</button><button class="ghost-btn" data-action="closeModal">Отмена</button></div>`);
  }
  function v49SaveGoalBuilder(id){
    const title=$('#v49GoalTitle')?.value?.trim(); if(!title) return toast('Назови цель');
    let g=id?(state.goals||[]).find(x=>x.id===id):null;
    if(!g){g={id:uid(),title,kind:/доход|деньг|финанс|руб|₽/i.test(title)?'Финансовая':'Личная',area:'Финансы',target:0,current:0,deadline:'',note:'',subgoals:[],steps:[]}; state.goals.unshift(g);}
    g.title=title; g.area=$('#v49GoalArea')?.value||g.area||'Цели'; g.deadline=$('#v49GoalDeadline')?.value||g.deadline||''; g.current=num($('#v49GoalCurrent')?.value||g.current); g.target=num($('#v49GoalTarget')?.value||g.target); g.why=$('#v49GoalWhy')?.value||''; g.successCriteria=$('#v49GoalSuccess')?.value||''; g.obstacle=$('#v49GoalObstacle')?.value||''; g.weeklyQuestion=$('#v49GoalWeekly')?.value||''; g.note=g.weeklyQuestion||g.note||'';
    const lines=($('#v49GoalSubgoals')?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
    if(lines.length){
      const old=g.subgoals||[];
      g.subgoals=lines.map((line,i)=>old[i]?Object.assign(old[i],{title:line}):{id:uid(),title:line,note:'',done:false,steps:[]});
    }
    state.settings.v49.activeGoalId=g.id;
    if(g.weeklyQuestion){state.tasks.unshift({id:uid(),goalId:g.id,title:`Шаг недели: ${g.weeklyQuestion}`,area:g.area||'Цели',date:today(),time:'09:00',priority:'B',status:'Активно',google:false,reminder:'',duration:'15–40 минут',energy:'Средне',weekStep:true});}
    closeModal(); save(); render(); toast('Цель сохранена и связана с шагом недели');
  }
  function v49OpenWeeklyQuestion(id){
    const g=(state.goals||[]).find(x=>x.id===id); if(!g) return;
    openModal('Шаг недели по цели',`<div class="v49-question"><h3>${esc(g.title)}</h3><p class="small muted">Что я могу сделать на этой неделе, чтобы приблизиться к цели?</p><textarea id="v49WeeklyAnswer">${esc(g.weeklyQuestion||g.note||'')}</textarea><label class="small muted">Сколько времени займёт?</label><input id="v49WeeklyDuration" value="15–40 минут"></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-v49-action="saveWeeklyQuestion" data-id="${esc(g.id)}">Создать задачу недели</button><button class="ghost-btn" data-action="closeModal">Отмена</button></div>`);
  }
  function v49SaveWeeklyQuestion(id){
    const g=(state.goals||[]).find(x=>x.id===id); if(!g) return;
    const txt=$('#v49WeeklyAnswer')?.value?.trim(); if(!txt) return toast('Напиши шаг недели');
    g.weeklyQuestion=txt; g.note=txt;
    state.tasks.unshift({id:uid(),goalId:g.id,title:`Шаг недели: ${txt}`,area:g.area||'Цели',date:today(),time:'09:00',priority:'B',status:'Активно',google:false,reminder:'',duration:$('#v49WeeklyDuration')?.value||'15–40 минут',energy:'Средне',weekStep:true});
    closeModal(); save(); render(); toast('Шаг недели создан');
  }
  function v49AddSubgoal(id){
    const g=(state.goals||[]).find(x=>x.id===id); if(!g) return;
    openModal('Новая подцель',`<div class="field"><label>Название подцели</label><input id="v49SubgoalTitle" placeholder="Например: навести порядок в финансах"></div><div class="field" style="margin-top:10px"><label>Комментарий</label><textarea id="v49SubgoalNote"></textarea></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-v49-action="saveSubgoal" data-id="${esc(id)}">Сохранить</button></div>`);
  }
  function v49SaveSubgoal(id){const g=(state.goals||[]).find(x=>x.id===id); if(!g) return; const title=$('#v49SubgoalTitle')?.value?.trim(); if(!title) return toast('Назови подцель'); g.subgoals=g.subgoals||[]; g.subgoals.push({id:uid(),title,note:$('#v49SubgoalNote')?.value||'',done:false,steps:[]}); closeModal(); save(); render(); toast('Подцель добавлена');}
  function v49AddStep(goalId,subId=''){
    const g=(state.goals||[]).find(x=>x.id===goalId); if(!g) return;
    openModal('Новый шаг',`<div class="field"><label>Шаг</label><input id="v49StepTitle" placeholder="Например: проверить расходы за неделю"></div><div class="field" style="margin-top:10px"><label>Комментарий</label><textarea id="v49StepNote"></textarea></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-v49-action="saveGoalStep" data-goal="${esc(goalId)}" data-sub="${esc(subId)}">Сохранить</button></div>`);
  }
  function v49SaveStep(goalId,subId=''){
    const g=(state.goals||[]).find(x=>x.id===goalId); if(!g) return; const title=$('#v49StepTitle')?.value?.trim(); if(!title) return toast('Назови шаг');
    const st={id:uid(),title,note:$('#v49StepNote')?.value||'',done:false};
    if(subId){const sg=(g.subgoals||[]).find(x=>x.id===subId); if(sg){sg.steps=sg.steps||[]; sg.steps.push(st);}}
    else {g.steps=g.steps||[]; g.steps.push(st);}
    closeModal(); save(); render(); toast('Шаг добавлен');
  }
  function v49FindStep(g,subId,stepId){const list=subId?((g.subgoals||[]).find(s=>s.id===subId)?.steps||[]):(g.steps||[]); return list.find(st=>st.id===stepId);}
  function v49ToggleSubgoal(goalId,subId){const g=(state.goals||[]).find(x=>x.id===goalId); const sg=g?.subgoals?.find(x=>x.id===subId); if(!sg) return; sg.done=!sg.done; save(); render();}
  function v49ToggleGoalStep(goalId,subId,stepId){const g=(state.goals||[]).find(x=>x.id===goalId); const st=g&&v49FindStep(g,subId,stepId); if(!st) return; st.done=!st.done; save(); render();}
  function v49MakeStepTask(goalId,subId,stepId){const g=(state.goals||[]).find(x=>x.id===goalId); const st=g&&v49FindStep(g,subId,stepId); if(!g||!st) return; state.tasks.unshift({id:uid(),goalId:g.id,title:st.title,area:g.area||'Цели',date:today(),time:'09:00',priority:'B',status:'Активно',google:false,reminder:'',duration:'15–40 минут',energy:'Средне',weekStep:false,note:st.note||''}); save(); render(); toast('Шаг превращён в задачу');}
  function v49OpenTaskBreakdown(id){const t=(state.tasks||[]).find(x=>x.id===id); if(!t)return; openModal('Разбить задачу',`<div class="v49-question"><h3>${esc(t.title)}</h3><p class="small muted">Какие 2–5 маленьких действия помогут начать?</p><textarea id="v49TaskBreakdown">Открыть нужные материалы\nСделать первый шаг на 15 минут\nПроверить результат</textarea></div><div class="row-actions" style="margin-top:14px"><button class="btn" data-v49-action="saveTaskBreakdown" data-id="${esc(id)}">Создать подзадачи</button></div>`);}
  function v49SaveTaskBreakdown(id){const parent=(state.tasks||[]).find(x=>x.id===id); if(!parent)return; const lines=($('#v49TaskBreakdown')?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean); lines.reverse().forEach(line=>state.tasks.unshift({id:uid(),parentId:id,goalId:parent.goalId||'',title:line,area:parent.area||'Задачи',date:today(),time:'',priority:parent.priority||'B',status:'Активно',google:false,reminder:'',duration:'15 минут',energy:'Легко'})); closeModal(); save(); render(); toast('Подзадачи созданы');}
  function v49MakeTinyTask(){const g=v49MainGoal(); state.tasks.unshift({id:uid(),goalId:g?.id||'',title:g?`15 минут для цели: ${g.title}`:'Маленький шаг на 15 минут',area:g?.area||'Фокус',date:today(),time:'',priority:'B',status:'Активно',duration:'15 минут',energy:'Легко',weekStep:Boolean(g)}); save(); render(); toast('Маленький шаг создан');}
  function v49OpenInboxCapture(){go('inbox'); setTimeout(()=>document.getElementById('v49InboxText')?.focus(),80);}
  function v49InboxType(type){state.settings.v49.inboxType=type||'task'; save(); render();}
  function v49SaveInbox(){const txt=$('#v49InboxText')?.value?.trim(); if(!txt)return toast('Напиши мысль'); state.inbox.unshift({id:uid(),type:state.settings.v49.inboxType||'task',text:txt,date:today(),createdAt:new Date().toISOString()}); save(); render(); toast('Сохранено во входящие');}
  function v49DeleteInbox(id){state.inbox=(state.inbox||[]).filter(x=>x.id!==id); save(); render();}
  function v49ProcessInbox(id){const x=(state.inbox||[]).find(i=>i.id===id); if(!x)return; const txt=x.text||''; if(x.type==='task'||x.type==='finance') state.tasks.unshift({id:uid(),title:txt,area:x.type==='finance'?'Финансы':'Inbox',date:today(),time:'',priority:'B',status:'Активно'}); else if(x.type==='note') state.notes.unshift({id:uid(),title:txt.slice(0,60),text:txt,folder:'Inbox',date:today()}); else if(x.type==='idea') state.ideas.unshift({id:uid(),title:txt.slice(0,60),text:txt,date:today()}); else if(x.type==='purchase') state.purchases.unshift({id:uid(),title:txt,amount:0,date:today(),area:'Inbox',includeInBudget:true,note:''}); else if(x.type==='wish') state.wishes.unshift({id:uid(),title:txt,amount:0,date:today(),area:'Inbox',includeInBudget:false,note:''}); else if(x.type==='debt') state.debts.unshift({id:uid(),direction:'out',person:txt,amount:0,due:today(),status:'Ожидает',note:'из Inbox'}); else if(x.type==='person') state.people.unshift({id:uid(),name:txt,role:'Inbox',birthday:'',phone:'',email:'',photo:'',links:'',likes:'',talkIdeas:'',gifts:'',notes:''}); v49DeleteInbox(id); toast('Запись перенесена в систему');}
  function v49ProcessInboxAll(){[...(state.inbox||[])].forEach(x=>v49ProcessInbox(x.id)); save(); render(); toast('Входящие разобраны');}
  function v49SaveMorningFocus(){state.settings.v49.morningFocus=$('#v49MorningFocus')?.value||''; state.settings.v49.dailyWin=$('#v49DailyWin')?.value||''; state.settings.v49.routeStep='goals'; save(); render(); toast('Фокус сохранён');}
  function v49SaveEvening(){state.settings.v49.eveningNote=$('#v49EveningNote')?.value||''; state.reviews.unshift({id:uid(),type:'daily',date:today(),text:state.settings.v49.eveningNote}); save(); render(); toast('Итог дня сохранён');}
  function v49SaveDailyReview(){state.settings.v49.eveningNote=$('#v49DailyReview')?.value||''; state.reviews.unshift({id:uid(),type:'daily',date:today(),text:state.settings.v49.eveningNote}); save(); render(); toast('Обзор сохранён');}

  const oldTasksPageV49=typeof tasksPage==='function'?tasksPage:null;
  const oldGoalsPageV49=typeof goalsPage==='function'?goalsPage:null;
  if(oldTasksPageV49) tasksPage=v49TasksPage;
  if(oldGoalsPageV49) goalsPage=v49GoalsPage;
  const oldOpenQuickV49=typeof openQuick==='function'?openQuick:null;
  if(oldOpenQuickV49){openQuick=function(){openModal('Быстро создать',`<div class="grid cols-3"><button class="btn" data-go="focus-path">🧭 Фокус дня</button><button class="btn" data-v49-action="openGoalBuilder">🚩 Мастер цели</button><button class="btn" data-go="inbox">📥 Входящие</button><button class="ghost-btn" data-action="openRecordForm" data-type="task">Задача</button><button class="ghost-btn" data-action="openRecordForm" data-type="note">Заметка</button><button class="ghost-btn" data-action="openRecordForm" data-type="idea">Идея</button><button class="ghost-btn" data-action="openRecordForm" data-type="debt">Долг</button><button class="ghost-btn" data-action="openRecordForm" data-type="purchase">Покупка</button><button class="ghost-btn" data-action="openRecordForm" data-type="wish">Желание</button><button class="ghost-btn" data-action="openRecordForm" data-type="habit">Привычка</button><button class="ghost-btn" data-action="openRecordForm" data-type="person">Человек</button><button class="ghost-btn" data-action="openRecordForm" data-type="goal">Цель</button></div>`)};}

  const oldRenderV49=typeof render==='function'?render:null;
  if(oldRenderV49){
    render=function(){
      v49Ensure();v49AddSections();v49Styles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      if(['focus-path','inbox','reviews'].includes(current)){
        page=current;
        state=normalize(state); save();
        const content=current==='focus-path'?v49FocusPage():(current==='inbox'?v49InboxPage():v49ReviewsPage());
        renderShell(content);
        const badge=document.querySelector('.version'); if(badge) badge.textContent=V49_LABEL;
        document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V49_BUILD);
        return;
      }
      const res=oldRenderV49();
      setTimeout(()=>{
        try{
          const cur=(location.hash||'').replace('#','')||page||'dashboard';
          const view=document.querySelector('#view');
          if(cur==='dashboard'){
            const pageEl=view?.querySelector('.page'); const hero=view?.querySelector('.hero');
            if(pageEl && hero && !view.querySelector('.v49-dashboard-route')){
              hero.insertAdjacentHTML('afterend',`<section class="v49-dashboard-route v49-hero-card" style="margin-bottom:16px"><div class="card-head"><div><span class="v49-eyebrow">🧭 Новый маршрут</span><h3>Фокус дня: цели, задачи, привычки и финансы в правильной последовательности</h3><p class="small muted">Старые разделы сохранены. Эта панель просто ведёт тебя пошагово.</p></div><button class="btn" data-go="focus-path">Открыть маршрут</button></div></section>`);
            }
          }
          const badge=document.querySelector('.version'); if(badge) badge.textContent=V49_LABEL;
          document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V49_BUILD);
        }catch(e){console.error('[V49 post render]',e)}
      },45);
      return res;
    };
  }

  window.addEventListener('click',function(e){
    const el=e.target.closest&&e.target.closest('[data-v49-action]'); if(!el) return;
    const a=el.dataset.v49Action;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    try{
      if(a==='taskView') return v49SetTaskView(el.dataset.view);
      if(a==='goalView') return v49SetGoalView(el.dataset.view);
      if(a==='routeStep') return v49SetRouteStep(el.dataset.step);
      if(a==='toggleTaskDone') return v49MarkDone(el.dataset.id);
      if(a==='taskTomorrow') return v49TaskDate(el.dataset.id,iso(addDays(new Date(),1)));
      if(a==='weekStep') return v49WeekStep(el.dataset.id);
      if(a==='waiting') return v49Waiting(el.dataset.id);
      if(a==='setActiveGoal') return v49SetActiveGoal(el.dataset.id);
      if(a==='openGoalBuilder') return v49OpenGoalBuilder(el.dataset.id||'');
      if(a==='saveGoalBuilder') return v49SaveGoalBuilder(el.dataset.id||'');
      if(a==='openWeeklyQuestion') return v49OpenWeeklyQuestion(el.dataset.id);
      if(a==='saveWeeklyQuestion') return v49SaveWeeklyQuestion(el.dataset.id);
      if(a==='addSubgoal') return v49AddSubgoal(el.dataset.id);
      if(a==='saveSubgoal') return v49SaveSubgoal(el.dataset.id);
      if(a==='addStepToSubgoal') return v49AddStep(el.dataset.goal,el.dataset.sub);
      if(a==='addRootGoalStep') return v49AddStep(el.dataset.id,'');
      if(a==='saveGoalStep') return v49SaveStep(el.dataset.goal,el.dataset.sub||'');
      if(a==='toggleSubgoal') return v49ToggleSubgoal(el.dataset.goal,el.dataset.sub);
      if(a==='toggleGoalStep') return v49ToggleGoalStep(el.dataset.goal,el.dataset.sub||'',el.dataset.step);
      if(a==='makeStepTask') return v49MakeStepTask(el.dataset.goal,el.dataset.sub||'',el.dataset.step);
      if(a==='openTaskBreakdown') return v49OpenTaskBreakdown(el.dataset.id);
      if(a==='saveTaskBreakdown') return v49SaveTaskBreakdown(el.dataset.id);
      if(a==='makeTinyTask') return v49MakeTinyTask();
      if(a==='openInboxCapture') return v49OpenInboxCapture();
      if(a==='inboxType') return v49InboxType(el.dataset.type);
      if(a==='saveInbox') return v49SaveInbox();
      if(a==='deleteInbox') return v49DeleteInbox(el.dataset.id);
      if(a==='processInbox') return v49ProcessInbox(el.dataset.id);
      if(a==='processInboxAll') return v49ProcessInboxAll();
      if(a==='saveMorningFocus') return v49SaveMorningFocus();
      if(a==='saveEvening') return v49SaveEvening();
      if(a==='saveDailyReview') return v49SaveDailyReview();
    }catch(err){console.error('[V49 action]',err);try{toast('Ошибка V49: '+(err.message||err))}catch(_){} }
  },true);

  try{v49Ensure();v49AddSections();v49Styles();save();render();}catch(e){console.error('[V49 init]',e)}
})();

/* ===== V50 Learning Guide: additive tutorial page, no data removal ===== */
(function(){
  'use strict';
  const V50_LABEL='V50.1 · ОБУЧЕНИЕ + СТАБИЛЬНЫЕ ПЛАШКИ';
  const V50_BUILD='second-brain-space-v50-1-learning-stability-hotfix-20260708';
  try{localStorage.setItem('secondBrainOS.currentBuild',V50_BUILD)}catch(e){}

  const LESSONS=[
    ['start','🚀','Быстрый старт','Собери основу за 10 минут: Inbox, Фокус дня, первая цель и первый шаг.'],
    ['day','🧭','Как вести день','Утро → цель → 3 задачи → привычки → финансы → вечернее закрытие.'],
    ['goals','🚩','Как работать с целями','Разложи цель на подцели, шаги недели и задачи дня.'],
    ['finance','💸','Как вести финансы','Разнос расходов, долги, бюджет, покупки и ежедневный финансовый чек.'],
    ['review','🔎','Обзоры и порядок','Ежедневное закрытие, недельный обзор, чистка входящих и корректировка целей.']
  ];
  const CHECKLIST=[
    ['inbox','Открыть Входящие и сбросить всё, что держишь в голове','Записать задачи, мысли, покупки, долги, идеи без сортировки.','inbox'],
    ['focus','Открыть Фокус дня','Пройти маршрут: утро, цель, задачи, привычки, финансы, вечер.','focus-path'],
    ['goal','Выбрать одну главную цель','Не все цели сразу. Одна цель должна вести неделю.','goals'],
    ['week','Создать шаг недели','Ответить: что я могу сделать на этой неделе, чтобы приблизиться?','goals'],
    ['tasks','Оставить 3 действия на сегодня','Остальное убрать в неделю, ожидание или когда-нибудь.','tasks'],
    ['habits','Отметить поддерживающие привычки','Привычки должны помогать целям, а не быть отдельным наказанием.','habits'],
    ['money','Проверить финансы 2 минуты','Расходы, долги, лимит, ближайшие покупки.','finance'],
    ['review','Закрыть день','Что сделано, что перенести, какой первый шаг завтра.','reviews']
  ];

  function v50Ensure(){
    state.settings=state.settings||{};
    state.settings.v50=Object.assign({lesson:'start',done:{},mode:'normal',firstOpen:true},state.settings.v50||{});
  }
  function v50AddSection(){
    if(!Array.isArray(SECTIONS)) return;
    if(!SECTIONS.some(s=>s.id==='learning')){
      const idx=SECTIONS.findIndex(s=>s.id==='focus-path');
      SECTIONS.splice(idx>=0?idx+1:1,0,{id:'learning',label:'Обучение',icon:'🎓',color:'#7c3aed',group:'ПРОСТРАНСТВО'});
    }
  }
  function v50Styles(){
    if(document.getElementById('v50-learning-styles')) return;
    const css=`
      .v50-learn-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(330px,.75fr);gap:16px;margin-bottom:16px}.v50-learn-card{border:1px solid rgba(196,181,253,.9);background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(245,243,255,.9));border-radius:30px;padding:22px;box-shadow:0 24px 60px rgba(124,58,237,.08)}.v50-learn-title{font-size:36px;line-height:1.02;letter-spacing:-.065em;margin:0}.v50-learn-text{color:#64748b;font-weight:700;line-height:1.55;max-width:820px}.v50-learn-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,.72fr);gap:16px;align-items:start}.v50-lessons{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-top:16px}.v50-lesson-tab{border:1px solid #e5edf7;background:#fff;border-radius:18px;padding:12px;text-align:left;display:grid;gap:6px;min-height:112px}.v50-lesson-tab.active{border-color:#c4b5fd;background:linear-gradient(180deg,#f5f3ff,#fff);box-shadow:0 14px 28px rgba(124,58,237,.1)}.v50-lesson-tab span{font-size:24px}.v50-lesson-tab b{font-size:13px;line-height:1.2}.v50-lesson-tab small{color:#64748b;font-weight:700;line-height:1.3}.v50-check-list{display:grid;gap:10px}.v50-check-row{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:12px;align-items:start;border:1px solid #e6edf7;background:#fff;border-radius:20px;padding:12px}.v50-check-row.done{background:#f0fdf4;border-color:#bbf7d0}.v50-check-btn{width:38px;height:38px;border:0;border-radius:14px;background:#eef5ff;color:#2563eb;font-weight:900}.v50-check-row.done .v50-check-btn{background:#dcfce7;color:#059669}.v50-check-row h4{margin:0;font-size:14px;line-height:1.25}.v50-check-row p{margin:4px 0 0;color:#64748b;font-size:12px;font-weight:700;line-height:1.4}.v50-path-map{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.v50-path-step{border:1px solid #e6edf7;background:#fff;border-radius:18px;padding:12px;min-height:112px;display:grid;gap:6px}.v50-path-step span{font-size:25px}.v50-path-step b{font-size:13px;line-height:1.2}.v50-path-step small{color:#64748b;font-weight:700;line-height:1.3}.v50-script{display:grid;gap:10px}.v50-script-block{border:1px solid #eaf0f8;background:#fbfdff;border-radius:20px;padding:14px}.v50-script-block h4{margin:0 0 6px}.v50-script-block ul{margin:8px 0 0;padding-left:18px;color:#475569;font-weight:700;line-height:1.55}.v50-command{border:1px solid #dbeafe;background:#f8fbff;border-radius:18px;padding:12px;display:grid;gap:9px}.v50-command textarea{width:100%;min-height:82px;border:1px solid #dfe7f2;background:#fff;border-radius:15px;padding:11px;resize:vertical;font-weight:750;outline:0}.v50-day-plan{display:grid;gap:8px}.v50-day{display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:start;border:1px solid #eaf0f8;background:#fff;border-radius:18px;padding:11px}.v50-day .num{width:34px;height:34px;border-radius:13px;background:#eef5ff;color:#2563eb;display:grid;place-items:center;font-weight:900}.v50-side-note{border:1px solid #fed7aa;background:linear-gradient(135deg,#fff7ed,#fff);border-radius:22px;padding:15px}.v50-guide-mini{display:grid;gap:8px}.v50-guide-mini .v49-system-check{background:#fff}.v50-progress-ring{width:118px;height:118px;border-radius:50%;background:conic-gradient(#7c3aed var(--p,0%),#eef2f7 0);display:grid;place-items:center;margin:auto}.v50-progress-ring b{width:86px;height:86px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:22px}.v50-mode{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.v50-mode button{border:1px solid #e5edf7;background:#fff;border-radius:999px;padding:9px 12px;font-weight:900;color:#475569}.v50-mode button.active{background:#7c3aed;color:#fff;border-color:#7c3aed}.v50-read-card{border:1px solid #e5edf7;background:#fff;border-radius:22px;padding:15px;display:grid;gap:8px}.v50-read-card h3{margin:0}.v50-read-card p{margin:0;color:#64748b;font-weight:700;line-height:1.5}.v50-learning-link{margin-top:10px}.v50-learning-link .btn{white-space:nowrap}
      @media(max-width:1180px){.v50-learn-hero,.v50-learn-grid{grid-template-columns:1fr}.v50-lessons,.v50-path-map{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:760px){.v50-learn-title{font-size:29px}.v50-lessons,.v50-path-map{grid-template-columns:1fr}.v50-check-row{grid-template-columns:38px minmax(0,1fr)}.v50-check-row .row-actions{grid-column:1/-1;justify-content:flex-start}}
    `;
    const style=document.createElement('style');style.id='v50-learning-styles';style.textContent=css;document.head.appendChild(style);
  }
  function v50DoneCount(){v50Ensure();return Object.values(state.settings.v50.done||{}).filter(Boolean).length;}
  function v50Pct(){return Math.round(v50DoneCount()/CHECKLIST.length*100);}
  function v50LessonContent(id){
    if(id==='day') return `<div class="v50-script"><div class="v50-script-block"><h4>Утро: 5 минут</h4><ul><li>Открой «Фокус дня».</li><li>Запиши один главный фокус.</li><li>Выбери одну цель, которая сегодня важнее остальных.</li></ul></div><div class="v50-script-block"><h4>Рабочий блок: 10 минут</h4><ul><li>Оставь максимум 3 задачи.</li><li>Большие задачи разбей на шаги 15 минут.</li><li>Всё лишнее перенеси в «Эта неделя» или «Когда-нибудь».</li></ul></div><div class="v50-script-block"><h4>Вечер: 3 минуты</h4><ul><li>Отметь сделанное.</li><li>Перенеси зависшее без чувства вины.</li><li>Запиши первый шаг на завтра.</li></ul></div></div>`;
    if(id==='goals') return `<div class="v50-script"><div class="v50-script-block"><h4>Формула цели</h4><ul><li>Цель → 3–5 подцелей.</li><li>Подцель → 3–7 маленьких шагов.</li><li>Неделя → один главный шаг.</li><li>День → одна конкретная задача.</li></ul></div><div class="v50-command"><b>Главный вопрос недели</b><textarea id="v50GoalQuestion">Что я могу сделать на этой неделе, чтобы приблизиться к главной цели?</textarea><div class="row-actions"><button class="btn" data-v50-action="createQuestionTask" data-kind="goal">Сделать задачей</button><button class="ghost-btn" data-go="goals">Открыть цели</button></div></div><div class="v50-script-block"><h4>Когда цель кажется слишком большой</h4><ul><li>Спроси: какой самый маленький видимый шаг?</li><li>Спроси: что можно сделать за 15 минут?</li><li>Спроси: что мешает прямо сейчас?</li></ul></div></div>`;
    if(id==='finance') return `<div class="v50-script"><div class="v50-script-block"><h4>Ежедневный финансовый чек</h4><ul><li>Добавить новые расходы.</li><li>Проверить долги и сроки.</li><li>Посмотреть ближайшие покупки.</li><li>Понять: сегодня я в лимите или нет?</li></ul></div><div class="v50-command"><b>Финансовый вопрос дня</b><textarea id="v50FinanceQuestion">Что сегодня может незаметно увести деньги, и какое одно решение поможет сохранить контроль?</textarea><div class="row-actions"><button class="btn" data-v50-action="createQuestionTask" data-kind="finance">Сделать задачей</button><button class="ghost-btn" data-go="finance">Открыть финансы</button></div></div><div class="v50-script-block"><h4>Раз в неделю</h4><ul><li>Проверить категории расходов.</li><li>Сверить фактический остаток.</li><li>Обновить план покупок.</li></ul></div></div>`;
    if(id==='review') return `<div class="v50-script"><div class="v50-script-block"><h4>Ежедневное закрытие</h4><ul><li>Что я сделал сегодня?</li><li>Что нужно перенести?</li><li>Что было лишним?</li><li>Какой первый шаг завтра?</li></ul></div><div class="v50-script-block"><h4>Недельный обзор</h4><ul><li>Разобрать Inbox.</li><li>Посмотреть прогресс целей.</li><li>Выбрать шаг недели.</li><li>Проверить финансы и привычки.</li></ul></div><div class="row-actions" style="justify-content:flex-start"><button class="btn" data-go="reviews">Открыть обзоры</button><button class="ghost-btn" data-v50-action="createStarterTasks">Создать задачи обучения</button></div></div>`;
    return `<div class="v50-script"><div class="v50-script-block"><h4>Минимальный сценарий на сегодня</h4><ul><li>Сбрось мысли во «Входящие».</li><li>Открой «Фокус дня».</li><li>Выбери одну цель.</li><li>Сделай один шаг на 15 минут.</li><li>Вечером закрой день.</li></ul></div><div class="v50-day-plan">${['День 1: входящие и фокус','День 2: одна главная цель','День 3: разложить цель на подцели','День 4: финансы и долги','День 5: привычки под цели','День 6: чистка задач','День 7: недельный обзор'].map((x,i)=>`<div class="v50-day"><div class="num">${i+1}</div><div><b>${x}</b><div class="small muted">Не больше 10–20 минут. Система должна помогать, а не давить.</div></div></div>`).join('')}</div><div class="row-actions" style="justify-content:flex-start"><button class="btn" data-v50-action="createStarterTasks">Создать задачи на 7 дней</button><button class="ghost-btn" data-go="focus-path">Открыть Фокус дня</button></div></div>`;
  }
  function v50TrainingPage(){
    v50Ensure();
    const lesson=state.settings.v50.lesson||'start';
    const pct=v50Pct();
    const mode=state.settings.v50.mode||'normal';
    const paths=[['🧠','Сбросить','Входящие'],['🎯','Выбрать','Цель'],['🧩','Разбить','Шаг недели'],['✅','Сделать','3 задачи'],['🌿','Поддержать','Привычки'],['🌙','Закрыть','День']];
    return layout('Обучение','Отдельный лист с понятной инструкцией: как пользоваться приложением каждый день, без перегруза и прокрастинации.',`<section class="v50-learn-hero"><article class="v50-learn-card"><span class="v49-eyebrow">🎓 Обучение Second Brain OS</span><h2 class="v50-learn-title">Приложение должно вести тебя, а не грузить</h2><p class="v50-learn-text">Здесь собрана инструкция по работе с системой: как начинать день, как разбирать цели, как не тонуть в задачах, как вести финансы и как закрывать неделю. Текущие разделы сохранены — этот лист просто учит пользоваться ими в правильной последовательности.</p><div class="v50-lessons">${LESSONS.map(([id,ico,t,txt])=>`<button class="v50-lesson-tab ${lesson===id?'active':''}" data-v50-action="lesson" data-lesson="${id}"><span>${ico}</span><b>${t}</b><small>${txt}</small></button>`).join('')}</div></article><aside class="v50-learn-card"><div class="v50-progress-ring" style="--p:${pct}%"><b>${pct}%</b></div><h3 style="text-align:center;margin:12px 0 4px">Освоение системы</h3><p class="small muted" style="text-align:center">Отмечай шаги по мере внедрения. Не надо идеально — нужна регулярность.</p><div class="v50-mode"><button class="${mode==='minimal'?'active':''}" data-v50-action="mode" data-mode="minimal">Минимум</button><button class="${mode==='normal'?'active':''}" data-v50-action="mode" data-mode="normal">Стандарт</button><button class="${mode==='deep'?'active':''}" data-v50-action="mode" data-mode="deep">Глубоко</button></div></aside></section><section class="v50-learn-grid"><main class="grid"><article class="card"><div class="card-head"><div><h3>Учебный блок: ${(LESSONS.find(x=>x[0]===lesson)||LESSONS[0])[2]}</h3><p class="small muted">Работай маленькими шагами. Лучше 10 минут каждый день, чем идеальная система раз в месяц.</p></div><button class="ghost-btn" data-go="focus-path">К маршруту</button></div>${v50LessonContent(lesson)}</article><article class="card"><div class="card-head"><div><h3>Карта ежедневного маршрута</h3><p class="small muted">Вот правильная последовательность, чтобы не зависать перед выбором.</p></div></div><div class="v50-path-map">${paths.map(([ico,a,b])=>`<div class="v50-path-step"><span>${ico}</span><b>${a}</b><small>${b}</small></div>`).join('')}</div></article><article class="card"><div class="card-head"><div><h3>Чек-лист внедрения</h3><p class="small muted">Отмечай, что уже стало частью твоей системы.</p></div><span class="pill violet">${v50DoneCount()}/${CHECKLIST.length}</span></div><div class="v50-check-list">${CHECKLIST.map(([id,title,txt,go])=>`<div class="v50-check-row ${state.settings.v50.done[id]?'done':''}"><button class="v50-check-btn" data-v50-action="toggle" data-id="${id}">${state.settings.v50.done[id]?'✓':'○'}</button><div><h4>${title}</h4><p>${txt}</p></div><div class="row-actions"><button class="v49-mini blue" data-go="${go}">Открыть</button></div></div>`).join('')}</div></article></main><aside class="grid"><article class="v50-side-note"><h3>Когда начинается прокрастинация</h3><p class="small muted">Не спрашивай «как сделать всё?». Спроси: «какой следующий шаг на 15 минут?»</p><div class="row-actions" style="justify-content:flex-start"><button class="btn" data-v49-action="makeTinyTask">Создать шаг 15 минут</button><button class="ghost-btn" data-go="inbox">Сбросить мысль</button></div></article><article class="card"><h3>Три режима работы</h3><div class="v50-guide-mini"><div class="v49-system-check"><span>Минимум</span><b>Inbox + 1 шаг</b></div><div class="v49-system-check"><span>Стандарт</span><b>Фокус + 3 задачи</b></div><div class="v49-system-check"><span>Глубоко</span><b>Цели + обзор</b></div></div></article><article class="v50-read-card"><h3>Главное правило</h3><p>Second Brain OS — это не место, где нужно всё идеально заполнить. Это система, которая помогает каждый день возвращаться к важному: деньги, цели, задачи, привычки, люди, заметки и спокойствие.</p></article><article class="card"><h3>Быстрые переходы</h3><div class="list"><button class="ghost-btn" data-go="focus-path">🧭 Фокус дня</button><button class="ghost-btn" data-go="goals">🚩 SMART-цели</button><button class="ghost-btn" data-go="tasks">✅ Задачи</button><button class="ghost-btn" data-go="finance">💸 Финансы</button><button class="ghost-btn" data-go="reviews">🔎 Обзоры</button></div></article></aside></section>`);
  }
  function v50StableRender(){
    const y=window.scrollY||document.documentElement.scrollTop||0;
    render();
    requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'}));
  }
  function v50SetLesson(id){state.settings.v50.lesson=id||'start';save();v50StableRender();}
  function v50SetMode(id){state.settings.v50.mode=id||'normal';save();v50StableRender();toast('Режим обучения обновлён');}
  function v50Toggle(id){state.settings.v50.done=state.settings.v50.done||{};state.settings.v50.done[id]=!state.settings.v50.done[id];save();v50StableRender();}
  function v50CreateStarterTasks(){
    const t=today();
    const items=[
      ['День 1: разобрать Входящие 10 минут','Inbox',0],
      ['День 2: выбрать одну главную цель','Цели',1],
      ['День 3: разбить цель на подцели','Цели',2],
      ['День 4: проверить финансы и долги','Финансы',3],
      ['День 5: выбрать привычки, которые поддерживают цели','Привычки',4],
      ['День 6: почистить ленту задач','Задачи',5],
      ['День 7: сделать недельный обзор','Обзоры',6]
    ];
    items.reverse().forEach(([title,area,delta])=>state.tasks.unshift({id:uid(),title,area,date:iso(addDays(new Date(t),delta)),time:'10:00',priority:'B',status:'Активно',duration:'10–20 минут',energy:'Легко',note:'Создано из раздела Обучение'}));
    save();render();toast('Созданы задачи обучения на 7 дней');
  }
  function v50CreateQuestionTask(kind){
    const val=(kind==='finance'?document.getElementById('v50FinanceQuestion'):document.getElementById('v50GoalQuestion'))?.value?.trim();
    const title=val|| (kind==='finance'?'Финансовый вопрос дня':'Вопрос недели по цели');
    state.tasks.unshift({id:uid(),title,area:kind==='finance'?'Финансы':'Цели',date:today(),time:'',priority:'B',status:'Активно',duration:'15 минут',energy:'Легко',note:'Создано из обучения'});
    save();render();toast('Вопрос превращён в задачу');
  }

  const oldOpenQuickV50=typeof openQuick==='function'?openQuick:null;
  if(oldOpenQuickV50){openQuick=function(){openModal('Быстро создать',`<div class="grid cols-3"><button class="btn" data-go="focus-path">🧭 Фокус дня</button><button class="btn" data-go="learning">🎓 Обучение</button><button class="btn" data-v49-action="openGoalBuilder">🚩 Мастер цели</button><button class="btn" data-go="inbox">📥 Входящие</button><button class="ghost-btn" data-action="openRecordForm" data-type="task">Задача</button><button class="ghost-btn" data-action="openRecordForm" data-type="note">Заметка</button><button class="ghost-btn" data-action="openRecordForm" data-type="idea">Идея</button><button class="ghost-btn" data-action="openRecordForm" data-type="debt">Долг</button><button class="ghost-btn" data-action="openRecordForm" data-type="purchase">Покупка</button><button class="ghost-btn" data-action="openRecordForm" data-type="wish">Желание</button><button class="ghost-btn" data-action="openRecordForm" data-type="habit">Привычка</button><button class="ghost-btn" data-action="openRecordForm" data-type="person">Человек</button><button class="ghost-btn" data-action="openRecordForm" data-type="goal">Цель</button></div>`)};}

  const oldRenderV50=typeof render==='function'?render:null;
  if(oldRenderV50){
    render=function(){
      v50Ensure();v50AddSection();v50Styles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      if(current==='learning'){
        page=current;
        state=normalize(state); save();
        renderShell(v50TrainingPage());
        const badge=document.querySelector('.version'); if(badge) badge.textContent=V50_LABEL;
        document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V50_BUILD);
        return;
      }
      const res=oldRenderV50();
      setTimeout(()=>{
        try{
          v50Ensure();v50AddSection();v50Styles();
          const cur=(location.hash||'').replace('#','')||page||'dashboard';
          const view=document.querySelector('#view');
          if(cur==='dashboard'){
            const hero=view?.querySelector('.hero');
            if(hero && !view.querySelector('.v50-learning-link')){
              hero.insertAdjacentHTML('afterend',`<section class="v50-learning-link v50-learn-card" style="margin-bottom:16px"><div class="card-head"><div><span class="v49-eyebrow">🎓 Обучение</span><h3>Как пользоваться Second Brain OS без прокрастинации</h3><p class="small muted">Новый отдельный лист: ежедневный маршрут, чек-лист внедрения, работа с целями, финансами и обзорами.</p></div><button class="btn" data-go="learning">Открыть обучение</button></div></section>`);
            }
          }
          const badge=document.querySelector('.version'); if(badge) badge.textContent=V50_LABEL;
          document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V50_BUILD);
        }catch(e){console.error('[V50 post render]',e)}
      },40);
      return res;
    };
  }
  window.addEventListener('click',function(e){
    const el=e.target.closest&&e.target.closest('[data-v50-action]'); if(!el) return;
    const a=el.dataset.v50Action;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{
      if(a==='lesson') return v50SetLesson(el.dataset.lesson);
      if(a==='mode') return v50SetMode(el.dataset.mode);
      if(a==='toggle') return v50Toggle(el.dataset.id);
      if(a==='createStarterTasks') return v50CreateStarterTasks();
      if(a==='createQuestionTask') return v50CreateQuestionTask(el.dataset.kind);
    }catch(err){console.error('[V50 action]',err);try{toast('Ошибка V50: '+(err.message||err))}catch(_){} }
  },true);
  try{v50Ensure();v50AddSection();v50Styles();save();render();}catch(e){console.error('[V50 init]',e)}
})();



/* ===== V52 Living Premium UI: smooth whole-app visual system, stable clicks ===== */
(function(){
  'use strict';
  const V52_BUILD='second-brain-space-v52-living-premium-ui-20260708';
  const V52_LABEL='V52 · LIVING PREMIUM UI';
  try{localStorage.setItem('secondBrainOS.currentBuild',V52_BUILD)}catch(e){}

  function v52Ensure(){
    state.settings=state.settings||{};
    state.settings.v52=Object.assign({motion:true,skin:'living-premium'}, state.settings.v52||{});
  }
  function v52Money(v){return typeof money==='function'?money(v):`${Math.round(Number(v)||0).toLocaleString('ru-RU')} ₽`}
  function v52Pct(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
  function v52DaysBetween(a,b){return Math.ceil((new Date(b)-new Date(a))/86400000)}
  function v52Period(){return typeof periodInfo==='function'?periodInfo():{key:'month',title:'месяц',start:today(),end:today()}}
  function v52Totals(p){
    const base=typeof financeTotals==='function'?financeTotals(p):{inc:0,exp:0,planned:0,upcoming:0,net:0};
    const upcoming=base.upcoming!=null?base.upcoming:total((state.purchases||[]).filter(x=>x.includeInBudget!==false&&x.date>=today()&&x.date<=p.end));
    return {...base, upcoming};
  }
  function v52OutDebts(){return (typeof activeDebts==='function'?activeDebts():state.debts||[]).filter(d=>d.direction==='out'&&d.status!=='Закрыт')}
  function v52InDebts(){return (typeof activeDebts==='function'?activeDebts():state.debts||[]).filter(d=>d.direction==='in'&&d.status!=='Закрыт')}
  function v52DebtOrder(list){return list.slice().sort((a,b)=>{const ao=a.due&&a.due<today()?0:1,bo=b.due&&b.due<today()?0:1;if(ao!==bo)return ao-bo;const ad=a.due?v52DaysBetween(today(),a.due):9999,bd=b.due?v52DaysBetween(today(),b.due):9999;if(ad!==bd)return ad-bd;return num(a.amount)-num(b.amount)})}
  function v52FinanceModel(){
    const p=v52Period(), t=v52Totals(p), out=v52OutDebts(), incoming=v52InDebts();
    const overdue=out.filter(d=>d.due&&d.due<today());
    const due7=out.filter(d=>d.due&&v52DaysBetween(today(),d.due)>=0&&v52DaysBetween(today(),d.due)<=7);
    const due30=out.filter(d=>d.due&&v52DaysBetween(today(),d.due)>=0&&v52DaysBetween(today(),d.due)<=30);
    const balance=num(state.settings.currentBalance);
    const baseLeft=balance+t.inc-t.exp-t.upcoming;
    const mandatory=total(overdue)+total(due7);
    const reserve=Math.max(0,Math.min(baseLeft-mandatory, Math.round(Math.max(0,baseLeft-mandatory)*0.2/500)*500));
    const debtPay=Math.max(0,Math.round(Math.max(mandatory,Math.max(0,baseLeft-reserve)*0.65)/500)*500);
    const free=Math.max(0,baseLeft-debtPay-reserve);
    const daysLeft=Math.max(1,Math.ceil((new Date(p.end)-new Date(today()))/86400000)+1);
    const dayLimit=Math.max(0,Math.round(free/daysLeft/100)*100);
    const score=v52Pct((t.inc>0?22:6)+(t.exp<=t.inc?18:5)+(baseLeft>=0?20:6)+(overdue.length?0:14)+(reserve>0?12:4)+(dayLimit>0?14:4));
    const goals=(state.goals||[]).filter(g=>String(g.kind||'').toLowerCase().includes('фин')||/деньг|доход|долг|резерв|руб|₽/i.test(g.title||''));
    const monthGoal=goals[0];
    const goalPct=monthGoal&&num(monthGoal.target)?v52Pct(num(monthGoal.current)/Math.max(1,num(monthGoal.target))*100):64;
    const topCat=(()=>{const m={};(state.operations||[]).filter(o=>o.type==='expense'&&inPeriod(o.date,p)).forEach(o=>m[o.category||'Нет расходов']=(m[o.category||'Нет расходов']||0)+num(o.amount));return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]||['Нет расходов',0]})();
    return {p,t,out,incoming,overdue,due7,due30,balance,baseLeft,mandatory,reserve,debtPay,free,daysLeft,dayLimit,score,goals,monthGoal,goalPct,topCat,next:v52DebtOrder(out)[0]};
  }
  function v52Spark(kind='up', color='#2563eb'){
    const d=kind==='down'?'M6 34 C22 18 35 40 52 27 S82 42 101 20':kind==='flat'?'M6 28 C28 25 45 31 66 27 S88 25 104 28':'M6 39 C18 34 27 36 38 24 S61 31 72 17 S92 17 106 10';
    return `<svg class="v52-spark" viewBox="0 0 112 48" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/><circle cx="106" cy="10" r="4" fill="${color}"/></svg>`;
  }
  function v52MiniChart(){
    return `<svg class="v52-balance-chart" viewBox="0 0 420 190" aria-hidden="true"><defs><linearGradient id="v52ChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2563eb" stop-opacity=".22"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs><path d="M10 156 C45 150 51 114 82 124 S128 133 149 94 S200 96 226 73 S268 86 299 48 S350 62 404 28 L404 180 L10 180 Z" fill="url(#v52ChartFill)"/><path d="M10 156 C45 150 51 114 82 124 S128 133 149 94 S200 96 226 73 S268 86 299 48 S350 62 404 28" fill="none" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/><g fill="#fff" stroke="#2563eb" stroke-width="4"><circle cx="10" cy="156" r="7"/><circle cx="82" cy="124" r="7"/><circle cx="149" cy="94" r="7"/><circle cx="226" cy="73" r="7"/><circle cx="299" cy="48" r="7"/><circle cx="404" cy="28" r="7"/></g></svg>`;
  }
  function v52Crystal(type='large'){
    return `<div class="v52-crystal v52-${type}" aria-hidden="true"><i></i><b></b><em></em><span></span></div>`;
  }
  function v52MetricCard(label,value,sub,icon,cls='blue',spark='up'){
    const color=cls==='green'?'#10b981':cls==='red'?'#ef4444':cls==='amber'?'#f59e0b':cls==='violet'?'#7c3aed':'#2563eb';
    return `<article class="v52-metric ${cls}"><div><span>${esc(label)}</span><strong>${esc(String(value))}</strong><small>${esc(sub||'')}</small></div><i>${icon}</i>${v52Spark(spark,color)}</article>`;
  }
  function v52FinanceTabs(active){return `<section class="v52-tabs">${[['overview','Обзор'],['actions','Действия'],['debts','Долги'],['spends','Расходы'],['forecast','Прогноз'],['import','Импорт / Альфа']].map(([id,label])=>`<button class="v52-tab ${active===id?'active':''}" data-v40-action="setFinanceTab" data-tab="${id}">${label}</button>`).join('')}<button class="v52-view-settings" data-action="openProfileTools">⚙ Настроить вид</button></section>`}
  function v52RiskCard(m){return `<article class="v52-panel v52-risk"><div class="v52-panel-head"><div><span class="v52-ico">🛡️</span><h3>Зона риска</h3><p>Нужен режим защиты: только обязательные траты, долги по срокам и минимум в резерве.</p></div></div><div class="v52-risk-grid"><div class="v52-ring" style="--p:${m.score}%"><b>${Math.round(m.score)}</b><small>из 100</small></div><div class="v52-risk-list"><div class="v52-risk-row"><i>⚠️</i><div><b>Главный риск</b><span>${m.due7.length?`В ближайшие 7 дней к оплате ${v52Money(total(m.due7))}. Не планировать лишние покупки.`:m.overdue.length?`Есть просрочка ${v52Money(total(m.overdue))}. Сначала договориться или закрыть.`:'Критических рисков не видно. Важно не увеличивать долговую нагрузку.'}</span></div></div><div class="v52-risk-row"><i class="ok">✅</i><div><b>Главное действие</b><span>${m.next?`Приоритет долга: ${esc(m.next.person)} · ${v52Money(m.next.amount)} · ${m.next.due?fmt(m.next.due):'без срока'}.`:`Держать дневной лимит ${v52Money(m.dayLimit)} до конца периода.`}</span></div></div></div></div><div class="v52-tip">Совет: отложите желаемые траты и закройте ближайший долг.</div></article>`}
  function v52LimitCard(m){return `<article class="v52-panel v52-limit"><div class="v52-panel-head"><div><span class="v52-ico">🔒</span><h3>Сегодняшний лимит</h3></div><span class="v52-pill red">до конца месяца</span></div><div class="v52-limit-value ${m.dayLimit>0?'green':'red'}">${v52Money(m.dayLimit)}</div><p>Свободный дневной лимит после базовых обязательств.</p><div class="v52-money-lines"><div><span>На долги</span><b class="red">${v52Money(m.debtPay||m.mandatory)}</b></div><div><span>В резерв</span><b class="green">${v52Money(m.reserve)}</b></div><div><span>Свободно</span><b>${v52Money(m.free)}</b></div></div></article>`}
  function v52BalanceCard(m){return `<article class="v52-panel v52-chart-card"><div class="v52-panel-head"><div><span>Динамика баланса</span><h3>${v52Money(m.balance + m.t.inc - m.t.exp)}</h3><p>+2 340 ₽ (55%) за период</p></div><button class="v52-small-select">30 дней⌄</button></div>${v52MiniChart()}<div class="v52-chart-labels"><span>10 июн</span><span>20 июн</span><span>30 июн</span><span>Сегодня</span></div></article>`}
  function v52ActionList(m){const items=[];items.push(`Держать дневной лимит ${v52Money(m.dayLimit)} до конца периода.`);if(m.next)items.push(`Оплатить ближайший долг: ${esc(m.next.person)} — ${v52Money(m.next.amount)}.`);if(m.incoming.length)items.push(`Напомнить о возврате: ${esc(m.incoming[0].person)} — ${v52Money(m.incoming[0].amount)}.`);if(items.length<3)items.push('Обновить фактический остаток и проверить прогноз.');return `<article class="v52-panel"><div class="v52-panel-head"><div><h3>Что делать сейчас</h3><p>Короткий список действий вместо перегруза графиками.</p></div><span class="v52-pill green">активный план</span></div><div class="v52-action-list">${items.slice(0,3).map((x,i)=>`<button class="v52-action-line" data-action="openRecordForm" data-type="task"><span>${i+1}</span><b>${x}</b><i>□</i></button>`).join('')}</div></article>`}
  function v52Analytics(m){return `<article class="v52-panel"><div class="v52-panel-head"><div><h3>Аналитика действий</h3><p>Не просто цифры, а что они говорят о твоём поведении.</p></div></div><div class="v52-analytics-grid"><div><span>Главная категория</span><b>${esc(m.topCat[0])} · ${v52Money(m.topCat[1])}</b><small>Держи фокус на базовых обязательствах.</small></div><div><span>Темп трат</span><b>${v52Money(m.t.exp/Math.max(1,Math.ceil((new Date(today())-new Date(m.p.start))/86400000)+1))} / день</b><small>Низкая активность — это шанс на перезапуск стратегии.</small></div></div></article>`}
  function v52DebtsTab(m){return `<section class="v52-content-grid two"><article class="v52-panel"><div class="v52-panel-head"><div><h3>Что закрывать первым</h3><p>Долги отсортированы по сроку и риску.</p></div><button class="ghost-btn" data-action="openDebtOut">＋ Долг</button></div><div class="v52-action-list">${v52DebtOrder(m.out).map((d,i)=>`<button class="v52-action-line" data-action="editRecord" data-type="debt" data-id="${esc(d.id)}"><span>${i+1}</span><b>${esc(d.person)} — ${v52Money(d.amount)}<small>${d.due?fmt(d.due):'без срока'} · ${esc(d.note||'без комментария')}</small></b><i>›</i></button>`).join('')||'<div class="v52-empty">Активных долгов нет.</div>'}</div></article><article class="v52-panel"><div class="v52-panel-head"><div><h3>Мне должны</h3><p>Возвраты, которые можно ускорить.</p></div><button class="ghost-btn" data-action="openDebtIn">＋ Возврат</button></div><div class="v52-action-list">${m.incoming.map((d,i)=>`<button class="v52-action-line" data-action="editRecord" data-type="debt" data-id="${esc(d.id)}"><span>${i+1}</span><b>${esc(d.person)} — ${v52Money(d.amount)}<small>${d.due?fmt(d.due):'без срока'}</small></b><i>›</i></button>`).join('')||'<div class="v52-empty">Возвратов нет.</div>'}</div></article></section>`}
  function v52SpendsTab(m){return `<section class="v52-content-grid two"><article class="v52-panel"><div class="v52-panel-head"><div><h3>Категории расходов</h3><p>Куда уходит основная часть денег.</p></div><button class="ghost-btn" data-action="openRecordForm" data-type="operation">＋ Операция</button></div>${categoryBreakdown(m.p)}</article><article class="v52-panel"><div class="v52-panel-head"><h3>Доходы и объяснение сумм</h3></div>${typeof incomeExplain==='function'?incomeExplain(m.p):'<p class="muted">Доходы появятся после добавления операций.</p>'}</article></section>`}
  function v52ForecastTab(m){return `<section class="v52-content-grid two"><article class="v52-panel"><div class="v52-panel-head"><div><h3>График доходов и расходов</h3><p>${fmt(m.p.start)} — ${fmt(m.p.end)}</p></div></div>${financeChart(m.p)}</article><article class="v52-panel"><div class="v52-panel-head"><h3>Прогноз и контроль</h3></div>${forecastBlock(m.p,m.t)}</article></section><section class="v52-panel" style="margin-top:16px"><div class="v52-panel-head"><div><h3>Плановые покупки</h3><p>Покупки автоматически влияют на прогноз периода.</p></div><button class="btn" data-action="openRecordForm" data-type="purchase">＋ Добавить покупку</button></div>${plannedMonthBlock(m.p)}</section>`}
  function v52ImportTab(m){return `<section class="v52-content-grid two"><article class="v52-panel"><div class="v52-panel-head"><div><h3>Импорт CSV банка</h3><p>Дубли удаляются, категории можно обучать.</p></div><span class="v52-pill blue">CSV</span></div><input type="file" id="csvFile" accept=".csv,text/csv"><div class="row-actions" style="margin-top:12px"><button class="btn" data-action="importBankCsv">Импортировать CSV</button><button class="ghost-btn" data-action="setActualBalance">Обновить остаток</button></div><div class="v52-tip">Последний импорт: добавлено ${state.settings.lastCsvAdded||0}, дублей удалено ${state.settings.lastCsvDuplicates||0}</div></article><article class="v52-panel"><div class="v52-panel-head"><h3>Альфа / Worker</h3></div><p class="muted">Если подключён Worker, операции можно подтягивать автоматически. Старые настройки сохранены.</p><div class="row-actions"><button class="ghost-btn" data-v40-action="testAlfaConnector">Проверить Worker</button><button class="ghost-btn" data-v40-action="fetchAlfaOperations">Загрузить операции</button></div></article></section>`}
  function v52FinanceOverview(m){return `<section class="v52-finance-hero"><div class="v52-hero-visual">${v52Crystal('hero')}</div><div class="v52-hero-copy"><h2>Финансы под контролем</h2><p>Глубокая иерархия, чистые остатки и акценты на важном. Принимайте решения на основе фактов, а не эмоций.</p><div class="v52-feature-row"><div><i>✦</i><b>Ясность</b><span>Понимайте картину в любой момент</span></div><div><i>◎</i><b>Контроль</b><span>Отслеживайте долги и обязательства</span></div><div><i>↗</i><b>Рост</b><span>Планируйте и создавайте будущее</span></div></div></div><div class="v52-hero-metrics">${v52MetricCard('Баланс',v52Money(m.balance+m.t.inc-m.t.exp),'Обновлён сегодня','💼','green','up')}${v52MetricCard('Открытые долги',m.out.length,`Сумма долга ${v52Money(total(m.out))}`,'🧾','amber','flat')}${v52MetricCard('Желания',(state.wishes||[]).length,`На сумму ${v52Money(total(state.wishes||[]))}`,'💜','violet','up')}<article class="v52-goal-card"><div class="v52-small-ring" style="--p:${m.goalPct}%"><b>${m.goalPct}%</b></div><div><span>Цель на месяц</span><strong>${v52Money(m.monthGoal?.current||80000)} / ${v52Money(m.monthGoal?.target||126000)}</strong></div>${v52Crystal('mini')}</article></div></section>${v52FinanceTabs(state.settings.financeTab||'overview')}<section class="v52-finance-main"><div class="v52-content-grid three">${v52RiskCard(m)}${v52LimitCard(m)}${v52BalanceCard(m)}</div><div class="v52-kpi-row">${v52MetricCard('Деньги сейчас',v52Money(m.balance),'Факт, который ты проставил вручную','💼','blue','up')}${v52MetricCard('Свободно после базы',v52Money(m.baseLeft),'Факт + доходы − расходы − покупки','🐷',m.baseLeft>=0?'green':'red',m.baseLeft>=0?'up':'down')}${v52MetricCard('Долги к оплате 7 дней',v52Money(total(m.due7)),'Ближайшая зона внимания','🗓️','red','down')}${v52MetricCard('Можно отложить',v52Money(m.reserve),'Резерв до необязательных трат','◔','green','up')}<article class="v52-discipline">Дисциплина сегодня —<br>свобода завтра <button data-go="focus-path">›</button>${v52Crystal('tiny')}</article></div><div class="v52-content-grid two">${v52ActionList(m)}${v52Analytics(m)}</div></section>`}
  function v52FinancePage(){
    v52Ensure(); v52Styles(); const m=v52FinanceModel(); const tab=state.settings.financeTab||'overview';
    const bodies={overview:v52FinanceOverview,actions:(m)=>`${v52FinanceTabs(tab)}<section class="v52-finance-main"><div class="v52-content-grid two">${v52ActionList(m)}${v52RiskCard(m)}</div></section>`,debts:(m)=>`${v52FinanceTabs(tab)}<section class="v52-finance-main">${v52DebtsTab(m)}</section>`,spends:(m)=>`${v52FinanceTabs(tab)}<section class="v52-finance-main">${v52SpendsTab(m)}</section>`,forecast:(m)=>`${v52FinanceTabs(tab)}<section class="v52-finance-main">${v52ForecastTab(m)}</section>`,import:(m)=>`${v52FinanceTabs(tab)}<section class="v52-finance-main">${v52ImportTab(m)}</section>`};
    return layout('Финансы','Полный контроль над деньгами. Ясность, план и действия.', (bodies[tab]||v52FinanceOverview)(m));
  }
  function v52RenderShell(content){
    const dateLabel=typeof fmt==='function'?fmt(today()):today();
    const mobile=(typeof MOBILE!=='undefined'?MOBILE:[]);
    document.getElementById('app').innerHTML=`<div class="app v52-app"><aside class="side v52-side"><div class="brand v52-brand"><div class="brand-left"><div class="brand-logo v52-logo">◆</div><div><div class="brand-title">Second Brain OS</div><div class="brand-sub">Ваше мышление. Система. Результат.</div></div></div><button class="tiny-icon v52-collapse" data-action="openProfileTools">‹</button></div>${typeof navHtml==='function'?navHtml():''}<div class="v52-side-focus"><div class="v52-side-focus-ico">🚀</div><b>Фокус дня</b><p>Сделайте важное сегодня — чтобы завтра двигаться быстрее.</p><span>2 из 3 задач</span><div class="v52-side-progress"><i></i></div></div><div class="v52-ai-card"><span>✦</span><div><b>Нейро-помощник</b><small>Готов помочь</small></div><i></i></div></aside><main class="main v52-main"><header class="topbar v52-topbar"><div class="search global-search v52-search"><span>⌕</span><input id="globalSearch" placeholder="Поиск по задачам, проектам, заметкам, финансам..."><span class="small">⌘K</span></div><div class="top-actions v52-actions"><button class="btn v52-create" data-action="openQuick">＋ Создать</button><button class="ghost-btn" data-action="openProfileTools">▣ Импорт</button><button class="icon-btn" data-action="openProfileTools">⚙</button><button class="icon-btn">🔔</button><div class="row v52-profile"><div class="avatar" style="width:32px;height:32px">А</div><div><b>${esc(state.settings.name||'Алексей')}</b><div class="small muted">${esc(state.settings.subtitle||'Фокус и ясность')}</div></div></div></div></header><section id="view" class="v52-view">${content}</section></main><button class="mobile-fab v52-fab" data-action="openQuick">＋</button><nav class="bottom-nav v52-bottom">${mobile.map(([id,ico,l])=>`<button class="${page===id?'active':''}" data-go="${id}"><span>${ico}</span>${l}</button>`).join('')}</nav><div class="version v52-version">${V52_LABEL}</div></div>`;
    const hero=document.querySelector('.hero');
    if(hero&&!hero.querySelector('.v52-date-chip')) hero.insertAdjacentHTML('beforeend',`<div class="date-pill v52-date-chip">▦ ${dateLabel}</div>`);
  }
  function v52Styles(){
    if(document.getElementById('v52-living-premium-style')) return;
    const st=document.createElement('style'); st.id='v52-living-premium-style'; st.textContent=`
      :root{--v52-blue:#2563eb;--v52-blue2:#60a5fa;--v52-ink:#102044;--v52-muted:#667594;--v52-line:#dfe9f8;--v52-glow:0 26px 70px rgba(37,99,235,.14);--v52-shadow:0 18px 44px rgba(15,23,42,.075)}
      html{scroll-behavior:smooth} body{background:radial-gradient(circle at 18% -8%,rgba(37,99,235,.16),transparent 30%),radial-gradient(circle at 82% 4%,rgba(96,165,250,.16),transparent 28%),linear-gradient(180deg,#fafdff 0%,#f3f8ff 46%,#edf6ff 100%)!important;color:var(--v52-ink)}
      .v52-app{grid-template-columns:292px minmax(0,1fr)}.v52-side{background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(247,251,255,.90));border-right:1px solid rgba(218,229,246,.95);box-shadow:inset -1px 0 0 rgba(255,255,255,.8);gap:10px;overflow-x:hidden}.v52-brand{padding-bottom:18px}.v52-logo{background:linear-gradient(135deg,#2563eb,#60a5fa 48%,#8b5cf6);box-shadow:0 18px 36px rgba(37,99,235,.24);font-size:18px}.v52-collapse{border:1px solid var(--v52-line);background:#fff;box-shadow:0 10px 24px rgba(15,23,42,.05)}
      .v52-side .nav-item{height:48px;border-radius:16px;padding:9px 10px;color:#52627c;transition:transform .22s cubic-bezier(.2,.8,.2,1),background .22s,box-shadow .22s,color .22s}.v52-side .nav-item:hover{transform:translateX(3px);background:rgba(239,246,255,.92);box-shadow:0 12px 26px rgba(37,99,235,.08)}.v52-side .nav-item.active{background:linear-gradient(135deg,#edf5ff,#f8fbff);color:#155ee7;box-shadow:inset 0 0 0 1px rgba(37,99,235,.16),0 14px 30px rgba(37,99,235,.10)}.v52-side .nav-item.active:after{content:'';width:7px;height:7px;border-radius:50%;background:#2563eb;box-shadow:0 0 0 6px rgba(37,99,235,.10);position:absolute;right:12px;top:50%;transform:translateY(-50%)}.v52-side .nav-ico{background:transparent!important;color:#7d8da8!important;box-shadow:none!important}.v52-side .nav-item.active .nav-ico{color:#2563eb!important}
      .v52-side-focus{margin:20px 8px 0;padding:18px;border:1px solid rgba(220,232,250,.94);border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(245,250,255,.92));box-shadow:var(--v52-shadow);overflow:hidden;position:relative}.v52-side-focus:before{content:'';position:absolute;right:-32px;top:-42px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.14),transparent 70%)}.v52-side-focus-ico{width:38px;height:38px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#eef6ff,#fff);border:1px solid #dbeafe;box-shadow:0 12px 28px rgba(37,99,235,.10);margin-bottom:12px}.v52-side-focus b{display:block}.v52-side-focus p{margin:8px 0 12px;color:#53627b;line-height:1.45;font-weight:700}.v52-side-focus span{font-size:12px;font-weight:900;color:#64748b}.v52-side-progress{height:8px;border-radius:999px;background:#e3ecfb;margin-top:8px;overflow:hidden}.v52-side-progress i{display:block;width:66%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2563eb,#60a5fa)}.v52-ai-card{margin:18px 8px 0;padding:14px;border-radius:22px;background:#fff;border:1px solid var(--v52-line);display:flex;gap:12px;align-items:center;box-shadow:var(--v52-shadow)}.v52-ai-card>span{width:36px;height:36px;border-radius:14px;display:grid;place-items:center;background:#eef6ff;color:#2563eb}.v52-ai-card small{display:block;color:#2563eb;font-weight:900}.v52-ai-card>i{margin-left:auto;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 5px rgba(34,197,94,.12)}
      .v52-main{padding:20px 30px 54px}.v52-topbar{height:58px;background:rgba(255,255,255,.78);backdrop-filter:blur(20px);border:1px solid rgba(222,233,250,.92);border-radius:0 0 26px 26px;margin:-20px -30px 26px;padding:10px 30px;box-shadow:0 18px 42px rgba(15,23,42,.06)}.v52-search{max-width:660px;border-radius:18px;background:rgba(255,255,255,.94);border:1px solid #dfe9f8;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 10px 28px rgba(15,23,42,.04)}.v52-actions{gap:12px}.v52-profile{background:#fff;border:1px solid #e1eaf7;border-radius:18px;box-shadow:0 12px 24px rgba(15,23,42,.05)}.v52-create{min-width:122px;background:linear-gradient(135deg,#155ee7,#2563eb 60%,#60a5fa)!important;border-radius:17px;box-shadow:0 20px 38px rgba(37,99,235,.25)!important}
      .hero.v52-page-hero,.v52-view .hero{align-items:flex-start;margin-bottom:22px}.v52-view .hero h1,.hero.v52-page-hero h1{font-size:42px;letter-spacing:-.07em;color:#071b49}.v52-view .hero p{font-size:15px;color:#5c6d89;font-weight:800}.v52-date-chip{margin-left:auto;background:rgba(255,255,255,.82)!important;box-shadow:0 16px 34px rgba(15,23,42,.07)!important;border:1px solid #dfe9f8!important}
      .card,.table-card,.v49-hero-card,.v49-panel,.v50-learn-card,.v52-panel{border:1px solid rgba(222,233,250,.96)!important;background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(249,252,255,.94))!important;border-radius:26px!important;box-shadow:var(--v52-shadow)!important;transition:transform .24s cubic-bezier(.2,.8,.2,1),box-shadow .24s,border-color .24s,background .24s;will-change:transform}.card:hover,.table-card:hover,.v49-hero-card:hover,.v49-panel:hover,.v50-learn-card:hover,.v52-panel:hover{transform:translateY(-2px);box-shadow:0 24px 64px rgba(37,99,235,.12)!important;border-color:#cfe0fb!important}.btn,.ghost-btn,.icon-btn,.chip-btn,.v40-tab,.v49-step,.v50-lesson-tab,.v52-tab,.v52-action-line,.nav-item{transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s,background .2s,border-color .2s,color .2s,opacity .2s}.btn:hover,.ghost-btn:hover,.icon-btn:hover,.chip-btn:hover,.v40-tab:hover,.v52-tab:hover{transform:translateY(-1px)}.btn:active,.ghost-btn:active,.icon-btn:active,.chip-btn:active,.v52-tab:active,.v52-action-line:active{transform:scale(.985)}.ghost-btn,.icon-btn,.chip-btn{border-color:#dfe9f8!important;background:rgba(255,255,255,.92)!important;border-radius:17px!important}.ghost-btn:hover,.icon-btn:hover,.chip-btn:hover{border-color:#b7d1ff!important;color:#155ee7!important;box-shadow:0 14px 34px rgba(37,99,235,.10)!important}
      .v52-view{animation:v52PageIn .28s cubic-bezier(.2,.8,.2,1);transform-origin:50% 18px}.v52-view.is-rendering{opacity:.96}.v52-view *{scroll-margin-top:88px}@keyframes v52PageIn{from{opacity:.0;transform:translateY(10px) scale(.997)}to{opacity:1;transform:translateY(0) scale(1)}}.v52-ripple{position:absolute;border-radius:50%;transform:scale(0);background:rgba(37,99,235,.18);pointer-events:none;animation:v52Ripple .55s ease-out}.v52-ripple-host{position:relative;overflow:hidden!important}@keyframes v52Ripple{to{transform:scale(4);opacity:0}}
      .v52-finance-hero{display:grid;grid-template-columns:260px minmax(0,1fr) 520px;gap:18px;align-items:center;min-height:250px;padding:22px;border-radius:30px;border:1px solid rgba(201,220,252,.96);background:radial-gradient(circle at 6% 30%,rgba(37,99,235,.12),transparent 26%),radial-gradient(circle at 70% -10%,rgba(96,165,250,.18),transparent 32%),linear-gradient(135deg,rgba(255,255,255,.96),rgba(239,247,255,.92));box-shadow:var(--v52-glow);overflow:hidden;position:relative}.v52-finance-hero:after{content:'';position:absolute;inset:-60% -20% auto 35%;height:320px;background:linear-gradient(105deg,transparent,rgba(255,255,255,.64),transparent);transform:rotate(8deg);animation:v52Shine 7s linear infinite}@keyframes v52Shine{from{translate:-40% 0}to{translate:85% 0}}.v52-hero-copy h2{margin:0 0 10px;font-size:28px;letter-spacing:-.055em;color:#071b49}.v52-hero-copy p{max-width:560px;margin:0;color:#536786;font-weight:760;line-height:1.55}.v52-feature-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:24px}.v52-feature-row div{padding:13px;border:1px solid #dfe9f8;border-radius:18px;background:rgba(255,255,255,.76);display:grid;grid-template-columns:34px 1fr;gap:2px 8px;align-items:center}.v52-feature-row i{grid-row:1/3;width:34px;height:34px;border-radius:13px;background:#eef6ff;display:grid;place-items:center;color:#2563eb;font-style:normal}.v52-feature-row b{font-size:13px}.v52-feature-row span{font-size:11px;color:#64748b;font-weight:800;line-height:1.25}.v52-hero-metrics{display:grid;grid-template-columns:1fr 1fr;gap:12px}.v52-hero-metrics .v52-metric{min-height:88px}.v52-goal-card{position:relative;grid-column:span 1;min-height:88px;border:1px solid #dfe9f8;border-radius:22px;background:rgba(255,255,255,.76);padding:14px;display:flex;gap:12px;align-items:center;overflow:hidden}.v52-goal-card span{font-size:11px;color:#64748b;font-weight:900}.v52-goal-card strong{display:block;font-size:13px;margin-top:4px}.v52-small-ring{--p:0%;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#2563eb var(--p),#e6eefb 0);box-shadow:inset 0 0 0 8px #fff}.v52-small-ring b{font-size:13px}.v52-crystal{position:relative;isolation:isolate}.v52-crystal.v52-hero{height:210px;border-radius:26px;background:radial-gradient(circle at 50% 76%,rgba(37,99,235,.22),transparent 38%)}.v52-crystal i{position:absolute;left:50%;top:26%;width:116px;height:130px;transform:translateX(-50%) rotate(45deg) skew(-7deg,-7deg);background:linear-gradient(135deg,#155ee7,#60a5fa 55%,#a78bfa);clip-path:polygon(50% 0,100% 44%,72% 100%,28% 100%,0 44%);box-shadow:0 28px 60px rgba(37,99,235,.26)}.v52-crystal b{position:absolute;left:50%;top:55%;width:180px;height:54px;border:3px solid rgba(96,165,250,.34);border-radius:50%;transform:translate(-50%,-50%);animation:v52Orbit 7s linear infinite}.v52-crystal em{position:absolute;left:24%;top:48%;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#fff,#60a5fa);box-shadow:0 0 24px #60a5fa;animation:v52Float 3.8s ease-in-out infinite}.v52-crystal span{position:absolute;right:24%;bottom:28%;width:24px;height:24px;border-radius:50%;background:radial-gradient(circle,#fff,#a78bfa);box-shadow:0 0 24px #a78bfa;animation:v52Float 4.6s ease-in-out infinite reverse}.v52-crystal.v52-mini,.v52-crystal.v52-tiny{position:absolute;right:10px;bottom:8px;width:64px;height:64px;opacity:.9}.v52-crystal.v52-mini i,.v52-crystal.v52-tiny i{width:32px;height:38px}.v52-crystal.v52-mini b,.v52-crystal.v52-tiny b{width:50px;height:18px;border-width:2px}@keyframes v52Orbit{to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes v52Float{50%{transform:translateY(-12px)}}
      .v52-tabs{display:flex;align-items:center;gap:8px;margin:18px 0 16px;flex-wrap:wrap}.v52-tab{border:1px solid #dfe9f8;background:rgba(255,255,255,.88);border-radius:999px;padding:12px 20px;font-weight:950;color:#233452;box-shadow:0 10px 24px rgba(15,23,42,.04)}.v52-tab.active{background:linear-gradient(135deg,#155ee7,#2563eb);color:white;border-color:#2563eb;box-shadow:0 18px 36px rgba(37,99,235,.24)}.v52-view-settings{margin-left:auto;border:1px solid #dfe9f8;background:rgba(255,255,255,.88);border-radius:16px;padding:11px 15px;font-weight:900;color:#334155;box-shadow:0 10px 24px rgba(15,23,42,.04)}.v52-finance-main{display:grid;gap:16px}.v52-content-grid{display:grid;gap:16px}.v52-content-grid.three{grid-template-columns:1.15fr .82fr .9fr}.v52-content-grid.two{grid-template-columns:1fr 1fr}.v52-panel{padding:20px;position:relative;overflow:hidden}.v52-panel:before{content:'';position:absolute;right:-60px;top:-60px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.09),transparent 68%);pointer-events:none}.v52-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.v52-panel h3{margin:0 0 6px;font-size:20px;letter-spacing:-.045em}.v52-panel p{margin:0;color:#65738c;font-size:13px;font-weight:760;line-height:1.45}.v52-ico{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:10px;background:#eef6ff;margin-bottom:8px}.v52-pill{display:inline-flex;align-items:center;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:1000;text-transform:lowercase}.v52-pill.red{background:#fff1f2;color:#e11d48}.v52-pill.green{background:#ecfdf5;color:#059669}.v52-pill.blue{background:#eef6ff;color:#2563eb}.v52-risk-grid{display:grid;grid-template-columns:150px minmax(0,1fr);gap:18px;align-items:center}.v52-ring{--p:0%;width:126px;height:126px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#2563eb var(--p),#e7effb 0);box-shadow:inset 0 0 0 14px #fff,0 16px 34px rgba(37,99,235,.12)}.v52-ring b{font-size:34px;letter-spacing:-.06em}.v52-ring small{font-size:11px;color:#64748b;font-weight:900;margin-top:-22px}.v52-risk-list{display:grid;gap:10px}.v52-risk-row{display:flex;gap:12px;align-items:flex-start;border:1px solid #e1eaf7;border-radius:17px;padding:12px;background:rgba(255,255,255,.78)}.v52-risk-row i{width:34px;height:34px;border-radius:13px;display:grid;place-items:center;background:#fff7ed;font-style:normal}.v52-risk-row i.ok{background:#ecfdf5}.v52-risk-row b{display:block;margin-bottom:3px}.v52-risk-row span{font-size:12px;color:#64748b;font-weight:800;line-height:1.35}.v52-tip{margin-top:12px;border:1px solid #dfe9f8;background:#f8fbff;border-radius:15px;padding:10px 12px;color:#64748b;font-size:12px;font-weight:800}.v52-limit-value{font-size:34px;font-weight:1000;letter-spacing:-.06em;margin:6px 0}.v52-limit-value.red{color:#ef4444}.v52-limit-value.green{color:#10b981}.v52-money-lines{display:grid;gap:13px;margin-top:18px}.v52-money-lines div{display:flex;justify-content:space-between;border-bottom:1px solid #e7eef8;padding-bottom:10px}.v52-money-lines div:last-child{border-bottom:0}.v52-money-lines span{color:#334155;font-weight:850}.v52-money-lines b.red{color:#ef4444}.v52-money-lines b.green{color:#10b981}.v52-chart-card{background:radial-gradient(circle at 70% 20%,rgba(37,99,235,.11),transparent 38%),linear-gradient(180deg,#f8fbff,#fff)!important}.v52-chart-card h3{font-size:26px;color:#2563eb}.v52-panel-head span{color:#64748b;font-weight:900;font-size:12px}.v52-small-select{border:1px solid #dbeafe;background:#fff;border-radius:999px;padding:7px 10px;color:#334155;font-weight:900}.v52-balance-chart{width:100%;height:150px}.v52-chart-labels{display:flex;justify-content:space-between;color:#64748b;font-size:11px;font-weight:900}.v52-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) 1.2fr;gap:14px}.v52-metric{position:relative;min-height:114px;border:1px solid #dfe9f8;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(249,252,255,.92));padding:16px;overflow:hidden;box-shadow:var(--v52-shadow);transition:transform .24s,box-shadow .24s}.v52-metric:hover{transform:translateY(-2px);box-shadow:0 24px 54px rgba(37,99,235,.13)}.v52-metric span{display:block;font-size:12px;color:#64748b;font-weight:950}.v52-metric strong{display:block;font-size:24px;margin-top:7px;letter-spacing:-.05em}.v52-metric small{display:block;color:#64748b;font-weight:800;margin-top:4px;line-height:1.25}.v52-metric i{position:absolute;right:14px;top:14px;width:40px;height:40px;border-radius:16px;display:grid;place-items:center;background:#eef6ff;font-style:normal}.v52-metric.green strong{color:#10b981}.v52-metric.red strong{color:#ef4444}.v52-metric.amber strong{color:#f97316}.v52-metric.violet strong{color:#7c3aed}.v52-spark{position:absolute;right:14px;bottom:14px;width:96px;height:42px;opacity:.88}.v52-discipline{position:relative;overflow:hidden;min-height:114px;border-radius:22px;border:1px solid rgba(96,165,250,.35);background:linear-gradient(135deg,#2563eb,#7c3aed 58%,#60a5fa);color:white;padding:18px;font-size:19px;font-weight:1000;letter-spacing:-.03em;box-shadow:0 20px 44px rgba(37,99,235,.22)}.v52-discipline button{position:absolute;right:88px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#2563eb;font-size:22px}.v52-action-list{display:grid;gap:10px}.v52-action-line{width:100%;border:1px solid #e1eaf7;background:rgba(255,255,255,.82);border-radius:18px;padding:13px;display:grid;grid-template-columns:34px minmax(0,1fr) 28px;gap:12px;align-items:center;text-align:left;color:#102044}.v52-action-line:hover{border-color:#b7d1ff;background:#f8fbff;box-shadow:0 15px 34px rgba(37,99,235,.10);transform:translateY(-1px)}.v52-action-line span{width:32px;height:32px;border-radius:12px;background:#eef6ff;color:#2563eb;display:grid;place-items:center;font-weight:1000}.v52-action-line b{font-size:14px;line-height:1.25}.v52-action-line small{display:block;color:#64748b;font-weight:800;margin-top:4px}.v52-action-line i{font-style:normal;color:#94a3b8}.v52-analytics-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.v52-analytics-grid div{border:1px solid #e1eaf7;background:#fff;border-radius:18px;padding:16px;min-height:112px}.v52-analytics-grid span{display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.07em;font-weight:1000}.v52-analytics-grid b{display:block;margin:8px 0 5px}.v52-analytics-grid small{display:block;color:#64748b;font-weight:800;line-height:1.35}.v52-empty{padding:18px;border:1px dashed #d7e3f6;border-radius:18px;color:#64748b;background:#f8fbff;font-weight:850}
      @media(max-width:1280px){.v52-finance-hero{grid-template-columns:1fr}.v52-hero-visual{height:180px}.v52-content-grid.three,.v52-content-grid.two,.v52-kpi-row{grid-template-columns:1fr 1fr}.v52-discipline{grid-column:1/-1}}@media(max-width:880px){.v52-app{display:block}.v52-side{display:none}.v52-main{padding:12px}.v52-topbar{margin:-12px -12px 18px;padding:10px 12px;flex-wrap:wrap;height:auto}.v52-search{order:5;flex-basis:100%;max-width:none}.v52-actions .ghost-btn,.v52-actions .icon-btn{display:none}.v52-view .hero h1{font-size:32px}.v52-hero-metrics,.v52-feature-row,.v52-content-grid.three,.v52-content-grid.two,.v52-kpi-row,.v52-analytics-grid{grid-template-columns:1fr}.v52-risk-grid{grid-template-columns:1fr}.v52-ring{margin:auto}.v52-tabs{overflow:auto;flex-wrap:nowrap;padding-bottom:4px}.v52-view-settings{display:none}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    `; document.head.appendChild(st);
  }

  const oldRenderShell=typeof renderShell==='function'?renderShell:null;
  if(oldRenderShell){try{renderShell=v52RenderShell}catch(e){console.error('[V52 renderShell override]',e)}}
  const oldFinancePage=typeof financePage==='function'?financePage:null;
  if(oldFinancePage){try{financePage=v52FinancePage}catch(e){console.error('[V52 financePage override]',e)}}

  let lastPage=(location.hash||'').replace('#','')||page||'dashboard';
  let restoreScrollY=0;
  const oldRender=typeof render==='function'?render:null;
  if(oldRender){
    render=function(){
      v52Ensure(); v52Styles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      const same=current===lastPage;
      restoreScrollY=same?window.scrollY:0;
      const bodyMin=Math.max(document.body.scrollHeight,window.innerHeight);
      document.body.style.minHeight=bodyMin+'px';
      document.body.classList.add('v52-rendering');
      const res=oldRender.apply(this,arguments);
      const after=()=>{
        const version=document.querySelector('.version'); if(version) version.textContent=V52_LABEL;
        document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V52_BUILD);
        if(same) window.scrollTo(0,restoreScrollY); else window.scrollTo(0,0);
        setTimeout(()=>{if(same) window.scrollTo(0,restoreScrollY); document.body.classList.remove('v52-rendering'); document.body.style.minHeight='';},180);
        setTimeout(()=>{if(same) window.scrollTo(0,restoreScrollY);},360);
        lastPage=current;
      };
      requestAnimationFrame(after);
      return res;
    }
  }
  window.addEventListener('click',function(e){
    const host=e.target.closest&&e.target.closest('button,.btn,.ghost-btn,.icon-btn,.chip-btn,.nav-item,.v52-action-line,.v52-tab,[data-go]');
    if(!host) return;
    try{
      host.classList.add('v52-ripple-host');
      const r=document.createElement('span'); r.className='v52-ripple';
      const rect=host.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); r.style.width=r.style.height=size+'px'; r.style.left=(e.clientX-rect.left-size/2)+'px'; r.style.top=(e.clientY-rect.top-size/2)+'px';
      host.appendChild(r); setTimeout(()=>r.remove(),650);
    }catch(_){ }
  },true);
  try{v52Ensure();v52Styles();save();render();}catch(e){console.error('[V52 init]',e)}
})();



/* ===== V56 UNIFIED VISUAL UI: global visual rollout, categories, planning, tracker ===== */
(function(){
  const V56_BUILD='second-brain-space-v56-unified-visual-ui-20260708';
  const V56_LABEL='V56 · UNIFIED VISUAL UI';
  try{localStorage.setItem('secondBrainOS.currentBuild',V56_BUILD);}catch(e){}

  function v56Styles(){
    if(document.getElementById('v56-unified-style')) return;
    const st=document.createElement('style');
    st.id='v56-unified-style';
    st.textContent=`
      .card,.folder-pane,.habit-table,.record-card,.module-card,.debt-col,.debt-card,.v44-learn-card,.v44-group,.v43-panel,.v43-group,.v50-side-note,.v50-read-card{border-color:rgba(219,231,246,.92)!important;box-shadow:0 18px 44px rgba(37,99,235,.08)!important;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,251,255,.96))!important}
      .row{background:linear-gradient(180deg,#ffffff,#f8fbff)!important;border-color:#dde8f6!important}
      .row:hover,.folder-item:hover,.record-card:hover{box-shadow:0 16px 34px rgba(37,99,235,.08)}
      .folder-pane{position:sticky;top:94px;max-height:calc(100vh - 118px);overflow:auto;scrollbar-gutter:stable;overscroll-behavior:contain}
      .folder-item{margin-bottom:10px;border-radius:18px;padding:12px 12px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease}
      .folder-item:hover{transform:translateY(-1px);border-color:#c7ddff;background:#f8fbff}
      .folder-item.active{background:linear-gradient(135deg,#edf4ff,#ffffff)!important;border-color:#b6d2ff!important;box-shadow:0 16px 32px rgba(37,99,235,.10)}
      .v56-plan-layout{display:grid;grid-template-columns:320px minmax(0,1fr);gap:18px}
      .v56-folder-side{display:grid;gap:12px;align-self:start}
      .v56-folder-card{padding:18px}
      .v56-folder-card h3{margin:0 0 6px;font-size:20px;letter-spacing:-.04em}
      .v56-folder-card p{margin:0;color:#64748b;font-size:13px;font-weight:760;line-height:1.45}
      .v56-folder-main{display:grid;gap:16px;align-self:start}
      .v56-folder-mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .v56-mini-stat{border:1px solid #dbe7f6;border-radius:18px;padding:14px;background:linear-gradient(180deg,#fff,#f8fbff)}
      .v56-mini-stat span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#7b8aa4;font-weight:1000}
      .v56-mini-stat b{display:block;margin-top:8px;font-size:20px;letter-spacing:-.04em}
      .v56-expense-shell{display:grid;gap:16px}
      .v56-expense-top{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:stretch}
      .v56-expense-queue,.v56-expense-side-card,.v56-expense-main,.v56-expense-group,.v56-habit-panel{position:relative;overflow:hidden;border:1px solid #dbe7f6;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(247,250,255,.97));box-shadow:0 22px 48px rgba(37,99,235,.09)}
      .v56-expense-queue:before,.v56-expense-side-card:before,.v56-expense-main:before,.v56-expense-group:before,.v56-habit-panel:before{content:'';position:absolute;right:-50px;top:-50px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.08),transparent 70%);pointer-events:none}
      .v56-expense-queue,.v56-expense-side-card,.v56-expense-main,.v56-expense-group,.v56-habit-panel,.v56-folder-card{padding:18px}
      .v56-expense-top h3,.v56-expense-main h3,.v56-expense-side-card h3,.v56-expense-group h3,.v56-habit-panel h3{margin:0;font-size:20px;letter-spacing:-.04em}
      .v56-expense-top p,.v56-expense-main p,.v56-expense-side-card p,.v56-expense-group p,.v56-habit-panel p{margin:6px 0 0;color:#64748b;font-size:13px;font-weight:760;line-height:1.5}
      .v56-expense-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}
      .v56-expense-kpi{border:1px solid #dbe7f6;border-radius:20px;padding:14px;background:linear-gradient(180deg,#fff,#f8fbff)}
      .v56-expense-kpi span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#7b8aa4;font-weight:1000}
      .v56-expense-kpi b{display:block;font-size:23px;letter-spacing:-.05em;margin-top:9px}
      .v56-expense-kpi small{display:block;margin-top:6px;color:#64748b;font-weight:800;line-height:1.35}
      .v56-expense-tabs{display:flex;flex-wrap:wrap;gap:8px}
      .v56-expense-tab{border:1px solid #dbe7f6;background:#fff;border-radius:999px;padding:10px 14px;font-weight:950;color:#334155}
      .v56-expense-tab.active{background:linear-gradient(135deg,#155ee7,#2563eb);border-color:#2563eb;color:#fff;box-shadow:0 16px 32px rgba(37,99,235,.22)}
      .v56-expense-layout{display:grid;grid-template-columns:minmax(0,1.5fr) 410px;gap:16px;align-items:start}
      .v56-expense-main{display:grid;gap:14px}
      .v56-expense-group{padding:16px}
      .v56-group-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
      .v56-group-head .meta{color:#64748b;font-size:13px;font-weight:800;margin-top:4px;line-height:1.4}
      .v56-group-actions{display:grid;grid-template-columns:minmax(220px,340px) auto;gap:12px;align-items:end;border:1px solid #e4ecf8;border-radius:20px;padding:14px;background:rgba(255,255,255,.78)}
      .v56-op-list{display:grid;gap:12px}
      .v56-op-row{display:grid;grid-template-columns:110px minmax(200px,1.2fr) 120px minmax(170px,220px) auto;gap:12px;align-items:center;border:1px solid #e4ecf8;border-radius:20px;padding:14px;background:linear-gradient(180deg,#fff,#f8fbff)}
      .v56-op-date{align-self:start}
      .v56-op-date b{display:block;font-size:14px;line-height:1.2}
      .v56-op-title b{display:block;font-size:15px;line-height:1.32}
      .v56-op-title .small{margin-top:4px;line-height:1.38;word-break:break-word}
      .v56-op-amount{font-weight:1000;font-size:18px;white-space:nowrap;text-align:right}
      .v56-op-row input,.v56-group-actions input{width:100%;height:44px;border:1px solid #d9e5f7;background:#fff;border-radius:14px;padding:0 12px;outline:0;font-weight:850;color:#233452}
      .v56-op-row .row-actions,.v56-group-actions .row-actions{justify-content:flex-start;align-items:center}
      .v56-op-row .mini{height:34px;border-radius:12px;padding:0 10px}
      .v56-expense-side-stack{display:grid;gap:16px;position:sticky;top:94px}
      .v56-rule-list{display:grid;gap:10px;margin-top:12px}
      .v56-rule{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #e4ecf8;border-radius:18px;padding:12px;background:#fff}
      .v56-rule .row-actions{justify-content:flex-end}
      .v56-help-steps{display:grid;gap:10px;margin-top:10px}
      .v56-help-step{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #e8eff8}
      .v56-help-step:last-child{border-bottom:0}
      .v56-help-step b{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#eef6ff;color:#2563eb;font-size:14px}
      .v56-habit-layout{display:grid;grid-template-columns:minmax(0,1.25fr) 360px;gap:16px;align-items:start;margin-top:16px}
      .v56-habit-panel{display:grid;gap:14px}
      .v56-habit-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
      .v56-habit-chart-wrap{position:relative;border:1px solid #dbe7f6;border-radius:24px;background:linear-gradient(180deg,#ffffff,#f6fbff);padding:16px;overflow:hidden}
      .v56-habit-chart-wrap:before{content:'';position:absolute;inset:auto -20px -40px auto;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,.14),transparent 70%)}
      .v56-habit-chart-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:8px}
      .v56-habit-chart-svg{width:100%;height:220px;display:block}
      .v56-habit-legend{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:#64748b;font-size:12px;font-weight:850}
      .v56-habit-legend b{color:#102044}
      .v56-habit-insight{display:grid;gap:12px}
      .v56-habit-insight .v56-expense-kpi{min-height:auto}
      .v56-habit-table .habit-title,.v56-habit-table .habit-actions{background:rgba(255,255,255,.96)}
      .v56-habit-table .habit-day-head.weekend{background:#f4f8ff}
      .v56-habit-table .day-check{border-radius:9px}
      .v56-soft-note{border:1px solid #dce8f7;border-radius:18px;padding:13px;background:#f8fbff;color:#55657f;font-size:13px;font-weight:800;line-height:1.45}
      @media(max-width:1380px){.v56-expense-layout{grid-template-columns:1fr}.v56-expense-side-stack{position:static}.v56-habit-layout{grid-template-columns:1fr}.v56-plan-layout{grid-template-columns:1fr}.folder-pane{position:relative;top:auto;max-height:none}.v56-expense-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.v56-folder-mini{grid-template-columns:1fr 1fr 1fr}}
      @media(max-width:980px){.v56-op-row{grid-template-columns:1fr;align-items:start}.v56-op-amount{text-align:left}.v56-group-actions{grid-template-columns:1fr}.v56-expense-kpis,.v56-folder-mini{grid-template-columns:1fr 1fr}.v56-expense-top{grid-template-columns:1fr}.v56-habit-toolbar{align-items:flex-start}}
      @media(max-width:760px){.v56-expense-kpis,.v56-folder-mini{grid-template-columns:1fr}.v56-expense-tabs{overflow:auto;flex-wrap:nowrap;padding-bottom:4px}.v56-op-row .row-actions{flex-wrap:wrap}.v56-habit-chart-svg{height:190px}}
    `;
    document.head.appendChild(st);
  }

  function v56CategoryList(){
    const base=['Еда','Кафе / рестораны','Транспорт','Авто','Дом','Коммунальные услуги','Связь','Подписки','Здоровье','Красота','Одежда','Подарки','Развлечения','Путешествия','Образование','Работа','Семья','Долг / возврат','Переводы','Наличные','Другое'];
    const set=new Set(base);
    (state.operations||[]).forEach(o=>{if(o.category) set.add(o.category)});
    ((state.settings||{}).categoryRules||[]).forEach(r=>{if(r.category) set.add(r.category)});
    return [...set].sort((a,b)=>String(a).localeCompare(String(b),'ru'));
  }
  function v56NeedReview(o){return o && o.type==='expense' && !o.categoryReviewed;}
  function v56ReviewOps(){
    const mode=(state.settings||{}).expenseReviewMode||'all';
    let ops=(state.operations||[]).filter(o=>o.type==='expense');
    if(mode==='review') ops=ops.filter(v56NeedReview);
    return ops.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||num(b.amount)-num(a.amount));
  }
  function v56GroupOps(ops){
    const map={};
    ops.forEach(o=>{const cat=o.category||'Не определено'; (map[cat]||(map[cat]=[])).push(o)});
    return Object.entries(map).map(([cat,items])=>({cat,items,total:total(items),need:items.filter(v56NeedReview).length})).sort((a,b)=>b.total-a.total);
  }
  function v56RuleList(){
    const rules=((state.settings||{}).categoryRules||[]).slice().sort((a,b)=>(num(b.hits)||0)-(num(a.hits)||0));
    return `<div class="v56-rule-list">${rules.map(r=>`<div class="v56-rule"><div><b>${esc(r.pattern)}</b><div class="small muted">→ ${esc(r.category)} · применений: ${num(r.hits)||0}</div></div><div class="row-actions"><button class="mini blue" data-v44-action="applyOneRule" data-id="${esc(r.id)}">Применить</button><button class="mini red" data-v44-action="deleteRule" data-id="${esc(r.id)}">Удалить</button></div></div>`).join('')||'<p class="small muted">Правил пока нет. Исправь категорию и нажми «Сохранить + запомнить».</p>'}</div>`;
  }
  function v56OpRow(o){
    return `<div class="v56-op-row"><div class="v56-op-date"><b>${fmt(o.date)}</b><div class="small muted">${esc(o.date||'')}</div></div><div class="v56-op-title"><b>${esc((o.note||'Операция банка').slice(0,120))}</b><div class="small muted">${o.categoryReviewed?'Проверено':'К проверке'} · ключ: ${esc(String(o.bankKey||'').slice(0,42)||'—')}</div></div><div class="v56-op-amount red">−${money(o.amount)}</div><div><input data-v44-op-cat="${esc(o.id)}" list="v44CatList" value="${esc(o.category||'Не определено')}"></div><div class="row-actions"><button class="mini green" data-v44-action="saveCatLearn" data-id="${esc(o.id)}">Сохранить + запомнить</button><button class="mini blue" data-v44-action="saveCatOnly" data-id="${esc(o.id)}">Только сохранить</button><button class="mini" data-v44-action="markReviewed" data-id="${esc(o.id)}">Проверено</button></div></div>`;
  }
  function v56GroupHtml(g,i){
    return `<article class="v56-expense-group"><div class="v56-group-head"><div><h3>${esc(g.cat)}</h3><div class="meta">${g.items.length} операций · ${money(g.total)} · ${g.need} к проверке</div></div><div class="row-actions"><span class="pill blue">${money(g.total)}</span><span class="pill amber">${g.need}</span></div></div><div class="v56-group-actions"><div class="field" style="margin:0"><label>Перенести всю группу в категорию</label><input data-v44-group-cat="${esc(g.cat)}" list="v44CatList" value="${esc(g.cat)}"></div><div class="row-actions"><button class="ghost-btn" data-v44-action="moveGroupLearn" data-cat="${esc(g.cat)}">Перенести + запомнить</button><button class="ghost-btn" data-v44-action="markGroupReviewed" data-cat="${esc(g.cat)}">Вся группа проверена</button></div></div><div class="v56-op-list" style="margin-top:12px">${g.items.map(v56OpRow).join('')}</div></article>`;
  }
  function v56ExpenseReviewPage(){
    const ops=v56ReviewOps();
    const groups=v56GroupOps(ops);
    const unchecked=(state.operations||[]).filter(v56NeedReview).length;
    const mode=(state.settings||{}).expenseReviewMode||'all';
    const totalVisible=total(ops);
    const top=groups[0];
    return layout('Категории расходов','Проверка CSV после банка: исправляй категории, запоминай правила и приложение будет учиться на следующих выгрузках.',`<datalist id="v44CatList">${v56CategoryList().map(c=>`<option value="${esc(c)}"></option>`).join('')}</datalist><section class="v56-expense-shell"><section class="v56-expense-top"><article class="v56-expense-queue"><div class="card-head" style="margin-bottom:0"><div><h3>Очередь проверки</h3><p>К проверке: <b>${unchecked}</b>. Дубли считаются по стабильному ключу без категории, чтобы исправления не создавали повторные операции.</p></div><div class="row-actions"><button class="btn" data-v44-action="applyRules">Применить правила</button><button class="ghost-btn" data-go="finance">Финансы</button></div></div><div class="v56-expense-kpis"><div class="v56-expense-kpi"><span>Видимых расходов</span><b class="red">${money(totalVisible)}</b><small>${ops.length} операций в текущем фильтре</small></div><div class="v56-expense-kpi"><span>К проверке</span><b class="amber">${unchecked}</b><small>операции ещё не подтверждены вручную</small></div><div class="v56-expense-kpi"><span>Категорий</span><b class="blue">${groups.length}</b><small>групп для просмотра и обучения</small></div><div class="v56-expense-kpi"><span>Главная категория</span><b>${esc(top?top.cat:'—')}</b><small>${top?money(top.total):'нет данных'}</small></div></div></article><div class="v56-expense-tabs"><button class="v56-expense-tab ${mode==='all'?'active':''}" data-v44-action="reviewMode" data-mode="all">Все операции</button><button class="v56-expense-tab ${mode==='review'?'active':''}" data-v44-action="reviewMode" data-mode="review">Только к проверке</button></div></section><section class="v56-expense-layout"><main class="v56-expense-main">${groups.map(v56GroupHtml).join('')||empty('Нет расходов для проверки.')}</main><aside class="v56-expense-side-stack"><article class="v56-expense-side-card"><h3>Правила категорий</h3><p>Когда ты исправляешь операцию и нажимаешь «запомнить», похожие операции в будущих CSV будут сразу попадать в нужную категорию.</p>${v56RuleList()}</article><article class="v56-expense-side-card"><h3>Как проходить быстрее</h3><div class="v56-help-steps"><div class="v56-help-step"><b>1</b><div><strong>Исправь частые магазины</strong><div class="small muted">Начни с самых повторяющихся списаний — это даёт максимальный эффект.</div></div></div><div class="v56-help-step"><b>2</b><div><strong>Жми «Сохранить + запомнить»</strong><div class="small muted">Так правило создаётся сразу и следующая выгрузка будет чище.</div></div></div><div class="v56-help-step"><b>3</b><div><strong>Отмечай всю группу</strong><div class="small muted">Если внутри категории всё верно, закрывай её одним действием.</div></div></div></div></article></aside></section></section>`);
  }

  function v56PlanningPage(){
    const folder=state.settings.planningFolder||'focus';
    const items=[['focus','Фокус дня','🎯',todayTasks().length],['areas','Папки сфер','📁',new Set((state.tasks||[]).map(t=>t.area||'Личное')).size],['priorities','Приоритеты','🚩',(state.tasks||[]).length],['deadlines','Сроки','🗓️',(state.tasks||[]).filter(t=>t.date).length],['purchases','Покупки','🛒',(state.purchases||[]).length],['wishes','Желания','💗',(state.wishes||[]).length]];
    const totalTasks=(state.tasks||[]).length;
    const dueSoon=(state.tasks||[]).filter(t=>t.date && t.date<=iso(addDays(new Date(),7)) && t.status!=='Сделано').length;
    const focused=todayTasks().length;
    return layout('Планирование','Единый premium-визуал для папок: спокойная навигация слева, подробный контент справа и без дёргания при переключении.',`<section class="v56-plan-layout"><aside class="folder-pane v56-folder-side"><article class="v56-folder-card"><h3>Папки планирования</h3><p>Переключай контексты без потери позиции. Навигация остаётся стабильной, а контент меняется справа.</p></article>${items.map(([id,n,ico,c])=>`<button class="folder-item ${folder===id?'active':''}" data-action="setPlanningFolder" data-id="${id}"><span class="avatar">${ico}</span><span><b>${n}</b><div class="small muted">${c} записей</div></span><span>›</span></button>`).join('')}</aside><main class="v56-folder-main"><section class="v56-folder-mini"><article class="v56-mini-stat"><span>Фокус сегодня</span><b>${focused}</b></article><article class="v56-mini-stat"><span>Всего задач</span><b>${totalTasks}</b></article><article class="v56-mini-stat"><span>Сроки 7 дней</span><b>${dueSoon}</b></article></section>${planningContent()}</main></section>`);
  }

  function v56HabitTrend(days){
    const max=Math.max(1,(state.habits||[]).length);
    const vals=days.map(d=>(state.habits||[]).filter(h=>h.marks?.[d]).length);
    const totalMarks=vals.reduce((a,b)=>a+b,0);
    const avgDay=vals.length?Math.round(totalMarks/vals.length):0;
    const best=Math.max(0,...vals);
    const width=100, height=180;
    const step=days.length>1?width/(days.length-1):width;
    const points=vals.map((v,i)=>`${(i*step).toFixed(2)},${(height-18)-((height-36)*(v/max)).toFixed(2)}`).join(' ');
    const area=`0,${height-18} ${points} ${width},${height-18}`;
    const last=vals[vals.length-1]||0;
    const firstLabel=days[0]?new Date(days[0]).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    const midLabel=days[Math.floor(days.length/2)]?new Date(days[Math.floor(days.length/2)]).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    const lastLabel=days[days.length-1]?new Date(days[days.length-1]).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    return `<article class="v56-habit-panel"><div class="v56-habit-chart-wrap"><div class="v56-habit-chart-head"><div><h3>Тренд привычек по дням</h3><p>Чем выше линия, тем больше привычек было выполнено в день.</p></div><span class="pill green">сегодня ${last}/${max}</span></div><svg class="v56-habit-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Тренд привычек">${[.25,.5,.75,1].map(p=>`<line x1="0" y1="${(height-18)-((height-36)*p).toFixed(2)}" x2="${width}" y2="${(height-18)-((height-36)*p).toFixed(2)}" stroke="rgba(148,163,184,.25)" stroke-dasharray="2 3"/>`).join('')}<polyline fill="rgba(16,185,129,.16)" stroke="none" points="${area}"/><polyline fill="none" stroke="#10b981" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" points="${points}"/>${vals.map((v,i)=>{const x=(i*step).toFixed(2),y=(height-18)-((height-36)*(v/max)).toFixed(2);return `<circle cx="${x}" cy="${y}" r="${i===vals.length-1?2.8:1.7}" fill="#ffffff" stroke="#10b981" stroke-width="${i===vals.length-1?2.2:1.5}"><title>${fmt(days[i])}: ${v}/${max}</title></circle>`}).join('')}</svg><div class="v56-habit-legend"><span><b>${firstLabel}</b> старт периода</span><span><b>${midLabel}</b> середина</span><span><b>${lastLabel}</b> сегодня</span></div></div><div class="v56-habit-insight"><div class="v56-expense-kpis" style="margin-top:0"><div class="v56-expense-kpi"><span>Среднее / день</span><b class="green">${avgDay}</b><small>из ${max} привычек</small></div><div class="v56-expense-kpi"><span>Лучший день</span><b>${best}</b><small>максимум отметок за период</small></div><div class="v56-expense-kpi"><span>Всего отметок</span><b class="blue">${totalMarks}</b><small>суммарная активность</small></div><div class="v56-expense-kpi"><span>Ритм сегодня</span><b>${last}/${max}</b><small>${last>=avgDay?'выше среднего':'ниже среднего'}</small></div></div></div></article>`;
  }

  function v56HabitsPage(){
    const range=num(state.settings.habitRange)||28;
    const days=Array.from({length:range},(_,i)=>iso(addDays(new Date(),-(range-1-i))));
    const avg=(state.habits||[]).length?Math.round((state.habits||[]).reduce((s,h)=>s+habitPct(h,days),0)/(state.habits||[]).length):0;
    const done=(state.habits||[]).filter(h=>h.marks?.[today()]).length;
    const best=Math.max(0,...(state.habits||[]).map(streak));
    const consistency=(state.habits||[]).length?Math.round(((state.habits||[]).filter(h=>habitPct(h,days)>=70).length/(state.habits||[]).length)*100):0;
    return layout('Привычки','Трекер в едином light-tech стиле: сильный тренд, понятные цифры и спокойная таблица повторений.',`<section class="grid cols-4"><article class="card"><h3>Ритм привычек</h3><div class="value sm">${avg}%</div>${prog(avg)}</article><article class="card"><h3>Выполнено сегодня</h3><div class="value sm">${done}/${(state.habits||[]).length}</div>${prog((state.habits||[]).length?done/(state.habits||[]).length*100:0,'green')}</article><article class="card"><h3>Активные привычки</h3><div class="value sm">${(state.habits||[]).length}</div></article><article class="card"><h3>Лучший стрик</h3><div class="value sm">${best} дней</div></article></section><div class="habit-toolbar v56-habit-toolbar"><div class="seg">${[7,14,28].map(n=>`<button data-action="setHabitRange" data-range="${n}" class="${range===n?'active':''}">${n} дней</button>`).join('')}</div><div class="row-actions"><button class="ghost-btn">Стабильность: ${consistency}%</button><button class="btn" data-action="openRecordForm" data-type="habit">＋ Новая привычка</button></div></div><section class="v56-habit-layout"><div>${v56HabitTrend(days)}</div><aside class="v56-habit-panel"><div><h3>Что показывает график</h3><p>Теперь график читает не просто столбцы, а общий темп: когда привычки росли, где просели и какой уровень удалось удержать.</p></div><div class="v56-soft-note">Совет: держи 2–3 якорные привычки, которые проще всего выполнить даже в тяжёлый день. Именно они стабилизируют линию графика.</div><div class="v56-expense-kpis" style="margin-top:0;grid-template-columns:1fr"><div class="v56-expense-kpi"><span>Стабильные привычки</span><b>${(state.habits||[]).filter(h=>habitPct(h,days)>=70).length}</b><small>выполнение не ниже 70% за период</small></div><div class="v56-expense-kpi"><span>Нужны в фокусе</span><b class="amber">${(state.habits||[]).filter(h=>habitPct(h,days)<40).length}</b><small>привычки с низким процентом выполнения</small></div></div></aside></section><section class="habit-table v56-habit-table" style="margin-top:16px"><div class="habit-grid" style="grid-template-columns:280px repeat(${range},32px) 116px"><div class="habit-head"><div class="habit-title"><b>Привычка</b></div>${days.map(d=>`<div class="habit-day-head ${[0,6].includes(new Date(d).getDay())?'weekend':''}">${new Date(d).getDate()}<br>${new Date(d).toLocaleDateString('ru-RU',{weekday:'short'}).slice(0,2)}</div>`).join('')}<div class="habit-actions"><b>Действия</b></div></div>${(state.habits||[]).map(h=>habitRow(h,days)).join('')}</div></section>`);
  }

  const oldSetPlanningFolder=typeof setPlanningFolder==='function'?setPlanningFolder:null;
  if(oldSetPlanningFolder){
    setPlanningFolder=function(el){
      const pageY=window.scrollY||document.documentElement.scrollTop||0;
      const pane=document.querySelector('.v56-folder-side,.folder-pane');
      const paneY=pane?pane.scrollTop:0;
      state.settings.planningFolder=el.dataset.id;
      save();
      render();
      [0,80,220].forEach(t=>setTimeout(()=>{window.scrollTo(0,pageY); const next=document.querySelector('.v56-folder-side,.folder-pane'); if(next) next.scrollTop=paneY;},t));
    };
  }

  if(typeof planningPage==='function'){ planningPage=v56PlanningPage; }
  if(typeof habitsPage==='function'){ habitsPage=v56HabitsPage; }
  if(typeof habitTrend==='function'){ habitTrend=v56HabitTrend; }

  function v56PostRender(){
    try{
      v56Styles();
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      const view=document.querySelector('#view');
      if(view && (current==='expense-review' || page==='expense-review')) view.innerHTML=v56ExpenseReviewPage();
      const version=document.querySelector('.version'); if(version) version.textContent=V56_LABEL;
      document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V56_BUILD);
    }catch(e){console.error('[V56 post render]',e)}
  }

  const oldRenderV56=typeof render==='function'?render:null;
  if(oldRenderV56){
    render=function(){
      v56Styles();
      const res=oldRenderV56.apply(this,arguments);
      setTimeout(v56PostRender,60);
      return res;
    };
  }

  try{v56Styles();save();render();}catch(e){console.error('[V56 init]',e)}
})();


/* ===== V57 CALENDAR + SIDEBAR + AI FIX ===== */
(function(){
  const V57_BUILD='second-brain-space-v58-sidebar-nojump-20260708';
  const V57_LABEL='V58 · SIDEBAR NO-JUMP FIX';
  try{localStorage.setItem('secondBrainOS.currentBuild',V57_BUILD);}catch(e){}

  function v57Ensure(){
    state.settings=state.settings||{};
    state.settings.v57=Object.assign({calendarFilter:'all'},state.settings.v57||{});
  }
  function v57Styles(){
    if(document.getElementById('v57-fix-style')) return;
    const st=document.createElement('style');
    st.id='v57-fix-style';
    st.textContent=`
      html,body,.app,.side,.v52-side,#view,.v52-view{overflow-anchor:none!important}
      .side,.v52-side{scroll-behavior:auto!important;scrollbar-gutter:stable;overscroll-behavior:contain}
      .nav-item{min-height:48px;flex-shrink:0}.side-section{min-height:22px;flex-shrink:0}
      .forecast-list{display:grid;gap:12px!important}.forecast-list .row{display:flex!important;grid-template-columns:none!important;justify-content:space-between!important;align-items:center!important;gap:16px!important;min-height:66px;padding:14px 16px!important;border-radius:20px!important}.forecast-list .row>div{font-weight:900;line-height:1.28;max-width:70%;word-break:normal}.forecast-list .row>b{font-size:18px;white-space:nowrap;text-align:right}.record-card ul{line-height:1.55}
      .v52-ai-card{cursor:pointer!important;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease;position:relative}.v52-ai-card:hover{transform:translateY(-2px);box-shadow:0 18px 38px rgba(37,99,235,.16);border-color:#bcd3ff!important;background:linear-gradient(135deg,#f8fbff,#eef6ff)!important}.v52-ai-card:after{content:'Открыть';position:absolute;right:12px;bottom:10px;font-size:10px;font-weight:1000;color:#2563eb;background:#eef6ff;border-radius:999px;padding:4px 7px}.v52-ai-card[data-v57-ready="true"] small{color:#2563eb!important;font-weight:900}.v57-ai-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.v57-ai-action{border:1px solid #dbe7f6;background:linear-gradient(180deg,#fff,#f8fbff);border-radius:20px;padding:16px;text-align:left;display:grid;gap:7px;color:#102044}.v57-ai-action b{font-size:15px}.v57-ai-action small{color:#64748b;font-weight:800;line-height:1.35}.v57-ai-action:hover{border-color:#bcd3ff;box-shadow:0 16px 34px rgba(37,99,235,.10);transform:translateY(-1px)}
      .v57-calendar-load{border:1px solid #dbe7f6;border-radius:30px;background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(247,251,255,.97));box-shadow:0 22px 54px rgba(37,99,235,.10);padding:18px;margin-bottom:16px;position:relative;overflow:hidden}.v57-calendar-load:before{content:'';position:absolute;right:-90px;top:-90px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.10),transparent 68%);pointer-events:none}.v57-calendar-load>*{position:relative}.v57-load-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.v57-load-head h3{margin:0;font-size:22px;letter-spacing:-.045em}.v57-load-head p{margin:6px 0 0;color:#64748b;font-size:13px;font-weight:780}.v57-load-score{border-radius:999px;padding:8px 12px;font-weight:1000;border:1px solid #dbeafe;background:#eef6ff;color:#2563eb}.v57-load-score.red{background:#fff1f2;color:#ef4444;border-color:#fecdd3}.v57-load-score.amber{background:#fff7ed;color:#f97316;border-color:#fed7aa}.v57-load-score.green{background:#ecfdf5;color:#059669;border-color:#bbf7d0}.v57-load-meter{height:12px;background:#edf4ff;border-radius:999px;overflow:hidden;margin-bottom:14px}.v57-load-meter b{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#10b981,#f59e0b,#ef4444)}.v57-load-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:14px}.v57-filter-list{display:flex;flex-wrap:wrap;gap:8px}.v57-filter{border:1px solid #dbe7f6;background:#fff;border-radius:999px;padding:9px 12px;font-weight:950;color:#334155;display:inline-flex;gap:7px;align-items:center}.v57-filter i{width:9px;height:9px;border-radius:50%;display:inline-block}.v57-filter.active{background:linear-gradient(135deg,#155ee7,#2563eb);border-color:#2563eb;color:#fff;box-shadow:0 14px 30px rgba(37,99,235,.22)}.v57-filter.active i{background:#fff!important}.v57-load-bars{display:flex;align-items:end;gap:8px;height:112px;border:1px solid #e3ecf8;border-radius:20px;background:rgba(255,255,255,.72);padding:12px}.v57-load-day{flex:1;min-width:0;border:0;background:transparent;display:flex;flex-direction:column;gap:7px;align-items:center;color:#64748b;font-size:10px;font-weight:850}.v57-load-day b{width:100%;min-height:7px;border-radius:999px;background:linear-gradient(180deg,#38bdf8,#2563eb);transition:height .22s ease,transform .18s ease}.v57-load-day:hover b{transform:scaleY(1.05)}.v57-load-day.medium b{background:linear-gradient(180deg,#fbbf24,#f97316)}.v57-load-day.overload b{background:linear-gradient(180deg,#fb7185,#ef4444)}.v57-load-areas{display:grid;gap:8px;margin-top:12px}.v57-area-row{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #e8eff8;padding:9px 0;font-weight:900}.v57-area-row span{color:#334155}.v57-area-row b{color:#2563eb}.v57-calendar-day{position:relative}.v57-calendar-day.dim{opacity:.38}.v57-calendar-day.match{box-shadow:inset 0 0 0 2px rgba(37,99,235,.22),0 14px 30px rgba(37,99,235,.10)!important}.v57-calendar-day.load-light{background:linear-gradient(135deg,#ecfdf5,#fff)!important}.v57-calendar-day.load-medium{background:linear-gradient(135deg,#fff7ed,#fff)!important}.v57-calendar-day.load-overload{background:linear-gradient(135deg,#fff1f2,#fff)!important;border-color:#fecdd3!important}.v57-calendar-note{margin-top:10px;border:1px dashed #cfe0f7;border-radius:18px;background:#f8fbff;padding:12px;color:#64748b;font-weight:800;font-size:13px;line-height:1.45}.v57-calendar-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(360px,.8fr);gap:16px}.v57-calendar-side{display:grid;gap:16px}.v57-calendar-agenda .calendar-event-card{border-radius:18px}.v57-calendar-empty{opacity:.72}
      @media(max-width:1180px){.v57-load-grid,.v57-calendar-grid{grid-template-columns:1fr}.v57-ai-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }
  function v57Entries(){try{return typeof calendarEntries==='function'?calendarEntries():[]}catch(e){return []}}
  function v57EntriesOn(date){return v57Entries().filter(e=>e.date===date)}
  function v57DayLevel(date){const c=v57EntriesOn(date).length;return c>=7?'overload':c>=3?'medium':c>0?'light':'empty'}
  function v57MatchEntry(e,filter){
    if(filter==='all') return true;
    const text=[e.title,e.area,e.type,e.note,e.source].map(x=>String(x||'').toLowerCase()).join(' ');
    if(filter==='finance') return /финанс|долг|кредит|банк|оплат/.test(text)||e.source==='debt';
    if(filter==='personal') return /личн|дом|семь|здоров|покупк|желан/.test(text)||e.source==='purchase';
    if(filter==='polina') return /полин/.test(text);
    if(filter==='important') return e.source==='debt'||e.type==='Дедлайн'||e.type==='Напоминание'||e.priority==='A'||/срочно|важн|дедлайн|просроч/.test(text);
    return true;
  }
  function v57FilteredEntriesOn(date){
    v57Ensure(); const f=state.settings.v57.calendarFilter||'all'; const level=v57DayLevel(date);
    if(['light','medium','overload'].includes(f)) return level===f?v57EntriesOn(date):[];
    return v57EntriesOn(date).filter(e=>v57MatchEntry(e,f));
  }
  function v57FilterLabel(f){return {all:'все записи',light:'лёгкие дни',medium:'средняя нагрузка',overload:'перегруз',finance:'финансы',personal:'личное',polina:'Полина',important:'важное'}[f]||'все'}
  function v57LoadPanel(){
    v57Ensure();
    const days=Array.from({length:7},(_,i)=>iso(addDays(new Date(),i)));
    const counts=days.map(d=>v57EntriesOn(d).length);
    const totalWeek=counts.reduce((a,b)=>a+b,0);
    const percent=clamp(Math.round(totalWeek/21*100));
    const max=Math.max(1,...counts);
    const filter=state.settings.v57.calendarFilter||'all';
    const byArea={}; v57Entries().filter(e=>e.date>=today()&&e.date<=iso(addDays(new Date(),7))).forEach(e=>byArea[e.area||'Личное']=(byArea[e.area||'Личное']||0)+1);
    const filters=[['all','Все','#2563eb'],['light','Лёгкие дни','#10b981'],['medium','Средняя','#f59e0b'],['overload','Перегруз','#ef4444'],['important','Важное','#2563eb'],['finance','Финансы','#14b8a6'],['personal','Личное','#7c3aed'],['polina','Полина','#ec4899']];
    return `<section class="v57-calendar-load" data-v57-load-panel><div class="v57-load-head"><div><h3>Цветовая нагрузка недели</h3><p>Теперь блок рабочий: кликай по фильтрам или столбикам, чтобы увидеть нужные дни и записи.</p></div><span class="v57-load-score ${percent>75?'red':percent>45?'amber':'green'}">${percent}%</span></div><div class="v57-load-meter"><b style="width:${percent}%"></b></div><div class="v57-load-grid"><article><h4 style="margin:0 0 10px">Фильтр календаря</h4><div class="v57-filter-list">${filters.map(([id,label,color])=>`<button class="v57-filter ${filter===id?'active':''}" data-v57-filter="${id}"><i style="background:${color}"></i>${label}</button>`).join('')}</div><div class="v57-calendar-note">Активно: <b>${v57FilterLabel(filter)}</b>. Дни без совпадений приглушаются, совпадающие подсвечиваются.</div></article><article><h4 style="margin:0 0 10px">Следующие 7 дней</h4><div class="v57-load-bars">${days.map((d,i)=>`<button class="v57-load-day ${v57DayLevel(d)}" data-v57-day="${d}" title="${fmt(d)}: ${counts[i]} записей"><b style="height:${Math.max(8,counts[i]/max*100)}%"></b><span>${new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</span></button>`).join('')}</div><div class="v57-load-areas">${Object.entries(byArea).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`<div class="v57-area-row"><span>${esc(k)}</span><b>${v}</b></div>`).join('')||'<div class="v57-calendar-note">На неделю нагрузка не запланирована.</div>'}</div></article></div></section>`;
  }
  function v57CalendarDayCell(date,inMonth){
    const es=v57EntriesOn(date), filtered=v57FilteredEntriesOn(date); const level=v57DayLevel(date); const f=state.settings.v57?.calendarFilter||'all'; const match=f==='all'||filtered.length>0;
    return `<button class="calendar-day v57-calendar-day ${!inMonth?'empty':''} ${date===today()?'today':''} load-${level} ${match?'match':'dim'}" data-action="selectCalendarDay" data-date="${date}"><div class="calendar-day-num">${new Date(date).getDate()}</div><div class="calendar-dots">${es.slice(0,8).map(e=>`<span class="calendar-dot ${typeof entryCss==='function'?entryCss(e):'event'}"></span>`).join('')}</div><div class="calendar-chipline">${(f==='all'?es:filtered).slice(0,2).map(e=>`<span class="calendar-mini-chip">${esc(e.title)}</span>`).join('')}</div><div class="calendar-load ${es.length>=5?'high':''}"><b style="width:${Math.min(100,es.length*18)}%"></b></div><div class="small muted">${es.length?`${es.length} записей`:'свободно'}</div></button>`;
  }
  function v57CalendarMonthGrid(){
    const m=monthRange(); const cells=[]; const startPad=(m.start.getDay()+6)%7;
    for(let i=startPad;i>0;i--) cells.push({d:iso(addDays(m.start,-i)),inMonth:false});
    for(let d=new Date(m.start);d<=m.end;d=addDays(d,1)) cells.push({d:iso(d),inMonth:true});
    while(cells.length%7!==0) cells.push({d:iso(addDays(new Date(cells[cells.length-1].d),1)),inMonth:false});
    const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    return `<div class="calendar-month">${weekdays.map(w=>`<div class="calendar-weekday">${w}</div>`).join('')}${cells.map(c=>v57CalendarDayCell(c.d,c.inMonth)).join('')}</div>`;
  }
  function v57CalendarAgenda(date=state.settings.calendarDate||today()){
    const es=v57FilteredEntriesOn(date);
    const f=state.settings.v57?.calendarFilter||'all';
    return `<div class="calendar-agenda v57-calendar-agenda">${f!=='all'?`<div class="v57-calendar-note">Показан фильтр: <b>${v57FilterLabel(f)}</b>. <button class="mini blue" data-v57-filter="all">Сбросить</button></div>`:''}${es.map(e=>`<article class="calendar-event-card ${typeof entryCss==='function'?entryCss(e):'event'}"><div class="calendar-event-icon">${typeof entryIcon==='function'?entryIcon(e):'•'}</div><div style="flex:1;min-width:0"><div class="card-head" style="margin-bottom:3px"><div><h3>${esc(e.title)}</h3><p class="small muted">${esc(e.area)} · ${esc(e.type)} ${e.time?`· ${esc(e.time)}`:''}</p></div><span class="pill ${e.source==='debt'?'red':e.google?'green':'blue'}">${e.source==='task'?'задача':e.source==='event'?'событие':e.source==='debt'?'долг':'покупка'}</span></div>${e.note?`<div class="small muted">${esc(e.note)}</div>`:''}<div class="row-actions" style="margin-top:10px">${e.source==='task'?`<button class="mini blue" data-action="editRecord" data-type="task" data-id="${e.id}">Ред.</button><button class="mini green" data-action="googleTask" data-id="${e.id}">Google</button><button class="mini red" data-action="deleteRecord" data-type="task" data-id="${e.id}">Удалить</button>`:''}${e.source==='event'?`<button class="mini blue" data-action="editRecord" data-type="event" data-id="${e.id}">Ред.</button><button class="mini green" data-action="googleEvent" data-id="${e.id}">Google</button><button class="mini red" data-action="deleteRecord" data-type="event" data-id="${e.id}">Удалить</button>`:''}${e.source==='debt'?`<button class="mini blue" data-action="editRecord" data-type="debt" data-id="${e.id}">Долг</button><button class="mini green" data-action="debtReminder" data-id="${e.id}">Напомнить</button>`:''}${e.source==='purchase'?`<button class="mini blue" data-action="editRecord" data-type="purchase" data-id="${e.id}">Покупка</button>`:''}</div></div></article>`).join('')||empty('На выбранный день нет записей по текущему фильтру.')}</div>`;
  }
  function v57CalendarPage(){
    v57Ensure(); if(typeof ensureCalendarV28==='function') ensureCalendarV28(); if(typeof ensureCalendarStylesV28==='function') ensureCalendarStylesV28();
    const selected=state.settings.calendarDate||today();
    return layout('Календарь','События, напоминания, задачи и рабочая цветовая нагрузка по дням.',`${typeof calendarKpis==='function'?calendarKpis():''}${v57LoadPanel()}<section class="v57-calendar-grid"><article class="card"><div class="card-head"><div><h3>Календарь месяца</h3><p class="small muted">Цвета теперь связаны с реальными записями и фильтрами нагрузки.</p></div><div class="row-actions"><button class="ghost-btn" data-action="openRecordForm" data-type="event">＋ Событие</button><button class="ghost-btn" data-action="openRecordForm" data-type="task">＋ Задача</button></div></div>${v57CalendarMonthGrid()}</article><div class="v57-calendar-side"><article class="card"><div class="card-head"><div><h3>День: ${fmt(selected)}</h3><p class="small muted">События, напоминания, задачи и дедлайны.</p></div><button class="btn" data-action="openRecordForm" data-type="event">＋ Добавить</button></div>${v57CalendarAgenda(selected)}</article><article class="card"><div class="card-head"><h3>Нагрузка по сферам</h3><span class="pill blue">14 дней</span></div>${typeof calendarAreasLoad==='function'?calendarAreasLoad():''}${typeof calendarLoadBars==='function'?calendarLoadBars():''}</article></div></section>`);
  }
  if(typeof calendarPage==='function') calendarPage=v57CalendarPage;

  function v57OpenAI(){
    if(typeof openModal!=='function') return;
    openModal('Нейро-помощник Second Brain OS',`<p class="muted" style="margin-top:0">Это быстрый помощник по разделам: открывает нужное место и помогает быстрее принять решение. Полноценный чат можно добавить следующим модулем.</p><div class="v57-ai-grid"><button class="v57-ai-action" data-go="focus-path"><b>🎯 Собрать фокус дня</b><small>Открыть маршрут дня и выбрать главное действие.</small></button><button class="v57-ai-action" data-go="tasks"><b>✅ Разобрать задачи</b><small>Перейти к задачам, срокам и недельным шагам.</small></button><button class="v57-ai-action" data-go="finance"><b>💸 Проверить финансы</b><small>Открыть финансовый контроль, лимит и прогноз.</small></button><button class="v57-ai-action" data-go="debts"><b>⚖️ Разложить долги</b><small>Посмотреть приоритеты, сроки и ближайшие выплаты.</small></button><button class="v57-ai-action" data-go="calendar"><b>🗓️ Проверить нагрузку</b><small>Открыть календарь с цветовой нагрузкой недели.</small></button><button class="v57-ai-action" data-go="habits"><b>🌿 Посмотреть привычки</b><small>Оценить ритм и слабые места недели.</small></button></div>`);
  }
  function v57PostRender(){
    try{
      v57Ensure(); v57Styles();
      document.querySelectorAll('[data-v37-addon="calendar"]').forEach(x=>x.remove());
      const ai=document.querySelector('.v52-ai-card');
      if(ai){ai.dataset.v57Ready='true';ai.setAttribute('role','button');ai.setAttribute('tabindex','0');ai.setAttribute('title','Открыть нейро-помощника');}
      const version=document.querySelector('.version'); if(version) version.textContent=V57_LABEL;
      document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V57_BUILD);
    }catch(e){console.error('[V57 post render]',e)}
  }

  const oldRenderV57=typeof render==='function'?render:null;
  if(oldRenderV57){
    render=function(){
      v57Ensure(); v57Styles();
      const side=document.querySelector('.side,.v52-side');
      const sideTop=side?side.scrollTop:0;
      const mainTop=window.scrollY||document.documentElement.scrollTop||0;
      const current=(location.hash||'').replace('#','')||page||'dashboard';
      const res=oldRenderV57.apply(this,arguments);
      [0,60,160,320].forEach(t=>setTimeout(()=>{
        const nextSide=document.querySelector('.side,.v52-side');
        if(nextSide) nextSide.scrollTop=sideTop;
        const next=(location.hash||'').replace('#','')||page||'dashboard';
        if(next===current) window.scrollTo(0,mainTop);
        v57PostRender();
      },t));
      return res;
    };
  }

  window.addEventListener('click',function(e){
    const ai=e.target.closest&&e.target.closest('.v52-ai-card');
    if(ai){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return v57OpenAI();}
    const filter=e.target.closest&&e.target.closest('[data-v57-filter]');
    if(filter){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();v57Ensure();state.settings.v57.calendarFilter=filter.dataset.v57Filter||'all';save();render();return;}
    const day=e.target.closest&&e.target.closest('[data-v57-day]');
    if(day){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();state.settings.calendarDate=day.dataset.v57Day||today();save();render();return;}
  },true);
  window.addEventListener('keydown',function(e){const ai=e.target&&e.target.closest&&e.target.closest('.v52-ai-card'); if(ai&&(e.key==='Enter'||e.key===' ')){e.preventDefault();v57OpenAI();}},true);
  try{v57Ensure();v57Styles();save();render();}catch(e){console.error('[V57 init]',e)}
})();


/* ===== V58 SIDEBAR NO-JUMP FIX ===== */
(function(){
  const V58_BUILD='second-brain-space-v58-sidebar-nojump-20260708';
  const V58_LABEL='V58 · SIDEBAR NO-JUMP FIX';
  try{localStorage.setItem('secondBrainOS.currentBuild',V58_BUILD);}catch(e){}
  let v58NavScroll=Number(sessionStorage.getItem('sbos.v58.navScroll')||0)||0;
  let v58FolderScroll=Number(sessionStorage.getItem('sbos.v58.folderScroll')||0)||0;

  function v58Styles(){
    if(document.getElementById('v58-sidebar-nojump-style')) return;
    const st=document.createElement('style');
    st.id='v58-sidebar-nojump-style';
    st.textContent=`
      html,body,.app,.side,.v52-side,.v58-nav-scroll,.folder-pane,.v56-folder-side{overflow-anchor:none!important;scroll-behavior:auto!important}
      .side.v52-side,.side{overflow:hidden!important;display:flex!important;flex-direction:column!important;height:100vh!important;min-height:100vh!important;max-height:100vh!important;gap:0!important;padding-bottom:12px!important;contain:layout style!important}
      .v52-brand,.brand{flex:0 0 auto!important;margin-bottom:8px!important}
      .v58-nav-scroll{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-gutter:stable!important;overscroll-behavior:contain!important;padding:0 0 12px!important;display:block!important;contain:layout paint!important}
      .v58-side-bottom{flex:0 0 auto!important;display:grid!important;gap:10px!important;padding-top:8px!important;background:linear-gradient(180deg,rgba(247,251,255,.65),rgba(247,251,255,.96))!important;border-top:1px solid rgba(219,231,246,.78)!important;position:relative!important;z-index:4!important}
      .v58-side-bottom .v52-side-focus{margin:0 8px!important;max-height:118px!important;padding:12px 14px!important;border-radius:20px!important;overflow:hidden!important}
      .v58-side-bottom .v52-side-focus p{display:none!important}.v58-side-bottom .v52-side-focus-ico{width:30px!important;height:30px!important;margin-bottom:6px!important}.v58-side-bottom .v52-side-focus span{font-size:11px!important}.v58-side-bottom .v52-side-progress{height:6px!important;margin-top:6px!important}
      .v58-side-bottom .v52-ai-card{margin:0 8px!important;min-height:58px!important;padding:12px!important;flex:0 0 auto!important}
      .v58-side-bottom .side-card{margin:0 8px!important;flex:0 0 auto!important}
      .v52-side .nav-item,.nav-item,.folder-item{transform:none!important;transition:background .16s ease,border-color .16s ease,box-shadow .16s ease,color .16s ease!important;will-change:auto!important;outline:none!important}
      .v52-side .nav-item:hover,.nav-item:hover,.folder-item:hover{transform:none!important}
      .v52-side .nav-list,.nav-list{display:grid!important;gap:4px!important;min-height:auto!important}.side-section{margin-top:10px!important;margin-bottom:4px!important;flex:0 0 auto!important}.nav-item{min-height:46px!important;height:46px!important;flex:0 0 46px!important}.nav-tools{flex:0 0 auto!important}
      .folder-pane,.v56-folder-side{overflow-y:auto!important;overflow-x:hidden!important;scrollbar-gutter:stable!important;overscroll-behavior:contain!important;contain:layout paint!important;scroll-behavior:auto!important}.folder-item{min-height:64px!important;flex:0 0 auto!important}.folder-item:focus,.nav-item:focus{box-shadow:inset 0 0 0 1px rgba(37,99,235,.20),0 10px 24px rgba(37,99,235,.08)!important}
      .v52-version,.version{z-index:120!important;pointer-events:none!important}
      @media(max-height:820px){.v58-side-bottom .v52-side-focus{display:none!important}.v58-side-bottom .v52-ai-card{min-height:52px!important}.v58-side-bottom .v52-ai-card:after{display:none!important}}
      @media(max-width:880px){.side.v52-side,.side{display:none!important}.v58-nav-scroll,.v58-side-bottom{display:none!important}}
    `;
    document.head.appendChild(st);
  }

  function v58WrapSidebar(){
    const side=document.querySelector('.side.v52-side,.side');
    if(!side || side.dataset.v58Ready==='true') return;
    side.dataset.v58Ready='true';
    const children=[...side.children];
    const bottomNames=new Set(['v52-side-focus','v52-ai-card','side-card']);
    const navWrap=document.createElement('div');
    navWrap.className='v58-nav-scroll';
    const bottomWrap=document.createElement('div');
    bottomWrap.className='v58-side-bottom';
    children.forEach(ch=>{
      const isBrand=ch.classList.contains('brand')||ch.classList.contains('v52-brand');
      const isBottom=[...bottomNames].some(c=>ch.classList.contains(c));
      if(isBrand){return;}
      if(isBottom){bottomWrap.appendChild(ch);return;}
      navWrap.appendChild(ch);
    });
    const brand=side.querySelector('.brand,.v52-brand');
    side.innerHTML='';
    if(brand) side.appendChild(brand);
    side.appendChild(navWrap);
    if(bottomWrap.children.length) side.appendChild(bottomWrap);
    navWrap.scrollTop=v58NavScroll;
    navWrap.addEventListener('scroll',()=>{v58NavScroll=navWrap.scrollTop;try{sessionStorage.setItem('sbos.v58.navScroll',String(v58NavScroll));}catch(e){}},{passive:true});
  }

  function v58RestorePositions(){
    v58Styles();
    v58WrapSidebar();
    const nav=document.querySelector('.v58-nav-scroll');
    if(nav) nav.scrollTop=v58NavScroll;
    const folder=document.querySelector('.folder-pane,.v56-folder-side');
    if(folder) folder.scrollTop=v58FolderScroll;
    const version=document.querySelector('.version'); if(version) version.textContent=V58_LABEL;
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V58_BUILD);
  }

  function v58CapturePositions(){
    const nav=document.querySelector('.v58-nav-scroll')||document.querySelector('.side,.v52-side');
    if(nav){v58NavScroll=nav.scrollTop;try{sessionStorage.setItem('sbos.v58.navScroll',String(v58NavScroll));}catch(e){}}
    const folder=document.querySelector('.folder-pane,.v56-folder-side');
    if(folder){v58FolderScroll=folder.scrollTop;try{sessionStorage.setItem('sbos.v58.folderScroll',String(v58FolderScroll));}catch(e){}}
  }

  const oldRenderV58=typeof render==='function'?render:null;
  if(oldRenderV58){
    render=function(){
      v58CapturePositions();
      const active=document.activeElement;
      if(active && active.blur && (active.closest?.('.side,.v52-side,.folder-pane,.v56-folder-side'))) active.blur();
      v58Styles();
      const res=oldRenderV58.apply(this,arguments);
      [0,30,80,180,360,650].forEach(t=>setTimeout(v58RestorePositions,t));
      return res;
    };
  }

  window.addEventListener('pointerdown',function(e){
    if(e.target.closest&&e.target.closest('.side,.v52-side,.folder-pane,.v56-folder-side')) v58CapturePositions();
  },true);
  window.addEventListener('click',function(e){
    const inside=e.target.closest&&e.target.closest('.side,.v52-side,.folder-pane,.v56-folder-side');
    if(inside){v58CapturePositions(); if(e.target.blur) setTimeout(()=>{try{e.target.blur()}catch(_){ }},0);}
  },true);
  window.addEventListener('scroll',()=>{const nav=document.querySelector('.v58-nav-scroll'); if(nav) nav.scrollTop=v58NavScroll;},{passive:true});
  try{v58Styles();v58RestorePositions();save();render();}catch(e){console.error('[V58 init]',e)}
})();


/* ===== V58.1 TRACKER POLISH: premium habit chart visual ===== */
(function(){
  const V581_BUILD='second-brain-space-v58-1-tracker-polish-20260708';
  const V581_LABEL='V58.1 · TRACKER POLISH';
  try{localStorage.setItem('secondBrainOS.currentBuild',V581_BUILD);}catch(e){}

  function v581Styles(){
    if(document.getElementById('v581-tracker-polish-style')) return;
    const st=document.createElement('style');
    st.id='v581-tracker-polish-style';
    st.textContent=`
      .v581-habit-top{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px}
      .v581-kpi{position:relative;overflow:hidden;border:1px solid #dbe7f6;border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,251,255,.98));box-shadow:0 18px 44px rgba(37,99,235,.08);padding:18px;min-height:116px}
      .v581-kpi:after{content:'';position:absolute;right:-34px;top:-42px;width:112px;height:112px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.10),transparent 70%)}
      .v581-kpi span{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8090aa;font-weight:1000}
      .v581-kpi b{display:block;margin-top:9px;font-size:30px;letter-spacing:-.06em;color:#102044}
      .v581-kpi small{display:block;margin-top:6px;color:#64748b;font-size:12px;font-weight:850;line-height:1.35}
      .v581-habit-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0;flex-wrap:wrap}
      .v581-range{display:inline-flex;gap:4px;background:rgba(255,255,255,.86);border:1px solid #dbe7f6;border-radius:18px;padding:5px;box-shadow:0 12px 28px rgba(37,99,235,.06)}
      .v581-range button{border:0;background:transparent;border-radius:14px;padding:10px 18px;font-weight:950;color:#64748b}
      .v581-range button.active{background:linear-gradient(135deg,#155ee7,#2563eb);color:#fff;box-shadow:0 14px 28px rgba(37,99,235,.22)}
      .v581-habit-board{display:grid;grid-template-columns:minmax(0,1.58fr) 390px;gap:16px;align-items:stretch;margin-top:16px}
      .v581-chart-card,.v581-coach-card{position:relative;overflow:hidden;border:1px solid #dbe7f6;border-radius:30px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(247,251,255,.98));box-shadow:0 22px 58px rgba(37,99,235,.09);padding:22px}
      .v581-chart-card:before,.v581-coach-card:before{content:'';position:absolute;right:-80px;top:-90px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,.12),transparent 68%);pointer-events:none}
      .v581-chart-head{position:relative;display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}
      .v581-chart-head h3,.v581-coach-card h3{margin:0;font-size:22px;letter-spacing:-.045em;color:#102044}
      .v581-chart-head p,.v581-coach-card p{margin:7px 0 0;color:#64748b;font-size:13px;font-weight:800;line-height:1.45}
      .v581-status-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid #bbf7d0;background:#ecfdf5;color:#059669;border-radius:999px;padding:8px 11px;font-weight:1000;font-size:12px;white-space:nowrap}
      .v581-chart-shell{position:relative;border:1px solid #e2ebf7;border-radius:26px;background:linear-gradient(180deg,#ffffff 0%,#f7fbff 100%);padding:14px 14px 10px;overflow:hidden}
      .v581-chart-shell:after{content:'';position:absolute;left:0;right:0;bottom:0;height:44%;background:linear-gradient(180deg,transparent,rgba(16,185,129,.06));pointer-events:none}
      .v581-svg{position:relative;z-index:1;width:100%;height:260px;display:block;overflow:visible}
      .v581-axis{display:flex;justify-content:space-between;gap:10px;margin-top:7px;color:#64748b;font-size:12px;font-weight:900}
      .v581-chart-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}
      .v581-stat{border:1px solid #e2ebf7;background:#fff;border-radius:20px;padding:14px;min-height:88px}
      .v581-stat span{display:block;font-size:11px;color:#8090aa;letter-spacing:.07em;text-transform:uppercase;font-weight:1000}
      .v581-stat b{display:block;margin-top:7px;font-size:24px;letter-spacing:-.045em;color:#102044}
      .v581-stat small{display:block;margin-top:4px;color:#64748b;font-size:12px;font-weight:850;line-height:1.3}
      .v581-coach-card{display:flex;flex-direction:column;gap:14px}
      .v581-coach-note{border:1px solid #dbe7f6;border-radius:22px;background:linear-gradient(180deg,#fff,#f8fbff);padding:16px;color:#475569;font-size:13px;font-weight:850;line-height:1.5}
      .v581-coach-list{display:grid;gap:10px}
      .v581-coach-item{display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;align-items:flex-start;border:1px solid #e2ebf7;border-radius:20px;background:#fff;padding:13px}
      .v581-coach-item i{width:34px;height:34px;border-radius:13px;display:grid;place-items:center;background:#eef6ff;font-style:normal;color:#2563eb;font-weight:1000}
      .v581-coach-item b{display:block;font-size:14px;color:#102044;margin-bottom:3px}
      .v581-coach-item span{display:block;color:#64748b;font-size:12px;font-weight:820;line-height:1.35}
      .v581-table-wrap{margin-top:16px;border-radius:28px;overflow:hidden;box-shadow:0 22px 58px rgba(37,99,235,.08)}
      .v581-table-wrap .habit-table{margin:0!important;border-radius:28px!important;box-shadow:none!important}
      .v581-table-wrap .habit-title,.v581-table-wrap .habit-actions{background:rgba(255,255,255,.98)!important}
      .v581-table-wrap .habit-day-head.weekend{background:#f3f8ff!important}
      .v581-table-wrap .day-check{border-radius:10px;transition:transform .12s ease,box-shadow .12s ease}
      .v581-table-wrap .day-check:hover{transform:scale(1.08);box-shadow:0 0 0 4px rgba(37,99,235,.10)}
      @media(max-width:1280px){.v581-habit-board{grid-template-columns:1fr}.v581-habit-top,.v581-chart-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:720px){.v581-habit-top,.v581-chart-stats{grid-template-columns:1fr}.v581-chart-head{flex-direction:column}.v581-svg{height:220px}.v581-chart-card,.v581-coach-card{padding:16px;border-radius:24px}}
    `;
    document.head.appendChild(st);
  }

  function v581SmoothPath(points){
    if(!points.length) return '';
    if(points.length===1) return `M ${points[0][0]} ${points[0][1]}`;
    let d=`M ${points[0][0]} ${points[0][1]}`;
    for(let i=0;i<points.length-1;i++){
      const p0=points[i-1]||points[i];
      const p1=points[i];
      const p2=points[i+1];
      const p3=points[i+2]||p2;
      const cp1x=p1[0]+(p2[0]-p0[0])/6;
      const cp1y=p1[1]+(p2[1]-p0[1])/6;
      const cp2x=p2[0]-(p3[0]-p1[0])/6;
      const cp2y=p2[1]-(p3[1]-p1[1])/6;
      d+=` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  }
  function v581HabitChart(days){
    const habits=state.habits||[];
    const max=Math.max(1,habits.length);
    const vals=days.map(d=>habits.filter(h=>h.marks?.[d]).length);
    const totalMarks=vals.reduce((a,b)=>a+b,0);
    const avgDay=vals.length?Math.round(totalMarks/vals.length):0;
    const best=Math.max(0,...vals);
    const last=vals[vals.length-1]||0;
    const w=760,h=250,pad=22;
    const usableW=w-pad*2, usableH=h-42;
    const step=days.length>1?usableW/(days.length-1):usableW;
    const pts=vals.map((v,i)=>[Math.round(pad+i*step),Math.round(pad+usableH-(usableH*(v/max)))]);
    const path=v581SmoothPath(pts);
    const area=`M ${pad} ${pad+usableH} L ${pts.map(p=>p.join(' ')).join(' L ')} L ${pad+usableW} ${pad+usableH} Z`;
    const firstLabel=days[0]?new Date(days[0]).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    const midLabel=days[Math.floor(days.length/2)]?new Date(days[Math.floor(days.length/2)]).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    const lastLabel=days[days.length-1]?new Date(days[days.length-1]).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    const bars=vals.map((v,i)=>{const x=pad+i*step-5; const bh=Math.max(4,usableH*(v/max)); const y=pad+usableH-bh; const opacity=.25+.55*(v/max); return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="10" height="${bh.toFixed(2)}" rx="5" fill="rgba(16,185,129,${opacity.toFixed(2)})"><title>${fmt(days[i])}: ${v}/${max}</title></rect>`}).join('');
    return `<article class="v581-chart-card"><div class="v581-chart-head"><div><h3>Пульс привычек</h3><p>Аккуратный график без визуального шума: зелёные бары показывают дни, линия — общий ритм.</p></div><span class="v581-status-pill">сегодня ${last}/${max}</span></div><div class="v581-chart-shell"><svg class="v581-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Пульс привычек">${[0,.25,.5,.75,1].map(t=>`<line x1="${pad}" y1="${(pad+usableH-usableH*t).toFixed(2)}" x2="${pad+usableW}" y2="${(pad+usableH-usableH*t).toFixed(2)}" stroke="rgba(148,163,184,.22)" stroke-dasharray="6 10"/>`).join('')}<path d="${area}" fill="rgba(16,185,129,.12)"></path>${bars}<path d="${path}" fill="none" stroke="#0fb981" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path><path d="${path}" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>${pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${i===pts.length-1?7:4.5}" fill="#fff" stroke="#0fb981" stroke-width="${i===pts.length-1?4:2.5}"><title>${fmt(days[i])}: ${vals[i]}/${max}</title></circle>`).join('')}</svg><div class="v581-axis"><span>${firstLabel} · старт</span><span>${midLabel} · середина</span><span>${lastLabel} · сегодня</span></div></div><div class="v581-chart-stats"><div class="v581-stat"><span>Среднее / день</span><b class="green">${avgDay}</b><small>из ${max} привычек</small></div><div class="v581-stat"><span>Лучший день</span><b>${best}</b><small>максимум отметок</small></div><div class="v581-stat"><span>Всего отметок</span><b class="blue">${totalMarks}</b><small>сумма за период</small></div><div class="v581-stat"><span>Ритм сегодня</span><b>${last}/${max}</b><small>${last>=avgDay?'выше среднего':'можно подтянуть'}</small></div></div></article>`;
  }
  function v581HabitsPage(){
    v581Styles();
    const range=num(state.settings.habitRange)||28;
    const days=Array.from({length:range},(_,i)=>iso(addDays(new Date(),-(range-1-i))));
    const habits=state.habits||[];
    const avg=habits.length?Math.round(habits.reduce((s,h)=>s+habitPct(h,days),0)/habits.length):0;
    const done=habits.filter(h=>h.marks?.[today()]).length;
    const best=Math.max(0,...habits.map(streak));
    const stable=habits.filter(h=>habitPct(h,days)>=70).length;
    const focus=habits.filter(h=>habitPct(h,days)<40).length;
    const weak=habits.slice().sort((a,b)=>habitPct(a,days)-habitPct(b,days))[0];
    return layout('Привычки','Премиальный трекер ритма: понятно, где держишь темп, а где нужна мягкая поддержка.',`<section class="v581-habit-top"><article class="v581-kpi"><span>Ритм периода</span><b>${avg}%</b><small>среднее выполнение всех привычек</small></article><article class="v581-kpi"><span>Сегодня</span><b>${done}/${habits.length}</b><small>отмечено на текущий день</small></article><article class="v581-kpi"><span>Лучший стрик</span><b>${best}</b><small>дней подряд</small></article><article class="v581-kpi"><span>Стабильные</span><b>${stable}</b><small>привычки выше 70%</small></article></section><div class="v581-habit-toolbar"><div class="v581-range">${[7,14,28].map(n=>`<button data-action="setHabitRange" data-range="${n}" class="${range===n?'active':''}">${n} дней</button>`).join('')}</div><div class="row-actions"><button class="ghost-btn">Нужны в фокусе: ${focus}</button><button class="btn" data-action="openRecordForm" data-type="habit">＋ Новая привычка</button></div></div><section class="v581-habit-board">${v581HabitChart(days)}<aside class="v581-coach-card"><div><h3>Что делать с ритмом</h3><p>График стал спокойнее: без резких визуальных провалов и с понятной подсказкой по следующему шагу.</p></div><div class="v581-coach-note">Главная задача — не идеальность, а повторяемость. Лучше удерживать 2–3 привычки каждый день, чем разгоняться и бросать.</div><div class="v581-coach-list"><div class="v581-coach-item"><i>1</i><div><b>Якорная привычка</b><span>${weak?`Подтяни: ${esc(weak.name)}.`:'Выбери одну привычку на завтра.'}</span></div></div><div class="v581-coach-item"><i>2</i><div><b>Минимум на день</b><span>Оставь маленькую версию привычки, которую реально сделать даже в плохой день.</span></div></div><div class="v581-coach-item"><i>3</i><div><b>Не перегружай график</b><span>Если день уже плотный, цель — сохранить базовый ритм, а не добавить всё сразу.</span></div></div></div></aside></section><section class="v581-table-wrap"><section class="habit-table"><div class="habit-grid" style="grid-template-columns:280px repeat(${range},32px) 116px"><div class="habit-head"><div class="habit-title"><b>Привычка</b></div>${days.map(d=>`<div class="habit-day-head ${[0,6].includes(new Date(d).getDay())?'weekend':''}">${new Date(d).getDate()}<br>${new Date(d).toLocaleDateString('ru-RU',{weekday:'short'}).slice(0,2)}</div>`).join('')}<div class="habit-actions"><b>Действия</b></div></div>${habits.map(h=>habitRow(h,days)).join('')}</div></section></section>`);
  }

  if(typeof habitsPage==='function') habitsPage=v581HabitsPage;
  if(typeof habitTrend==='function') habitTrend=v581HabitChart;

  function v581Post(){
    v581Styles();
    const version=document.querySelector('.version'); if(version) version.textContent=V581_LABEL;
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V581_BUILD);
  }
  const oldRenderV581=typeof render==='function'?render:null;
  if(oldRenderV581){render=function(){v581Styles(); const r=oldRenderV581.apply(this,arguments); setTimeout(v581Post,80); return r;};}
  try{v581Styles();save();render();}catch(e){console.error('[V58.1 tracker polish init]',e)}
})();


/* ===== V58.2 HABIT CHART PREMIUM: refined visual tracker ===== */
(function(){
  const V582_BUILD='second-brain-space-v58-3-root-habit-premium-20260708';
  const V582_LABEL='V58.3 · ROOT HABIT PREMIUM';
  try{localStorage.setItem('secondBrainOS.currentBuild',V582_BUILD);}catch(e){}

  function v582Styles(){
    if(document.getElementById('v582-habit-chart-premium-style')) return;
    const st=document.createElement('style');
    st.id='v582-habit-chart-premium-style';
    st.textContent=`
      .v582-wrap{display:grid;gap:18px}
      .v582-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:6px}
      .v582-range{display:inline-flex;gap:6px;background:rgba(255,255,255,.82);border:1px solid #dbe7f6;border-radius:22px;padding:6px;box-shadow:0 18px 40px rgba(37,99,235,.07)}
      .v582-range button{border:0;background:transparent;color:#53637d;font-weight:950;padding:12px 22px;border-radius:17px;font-size:15px;letter-spacing:-.02em}
      .v582-range button.active{background:linear-gradient(180deg,#ffffff,#f1f6ff);color:#2563eb;box-shadow:inset 0 0 0 1px rgba(191,219,254,.95),0 12px 28px rgba(37,99,235,.09)}
      .v582-toolbar-actions{display:flex;gap:10px;flex-wrap:wrap}
      .v582-action-lite{display:inline-flex;align-items:center;gap:9px;background:rgba(255,255,255,.88);border:1px solid #dbe7f6;border-radius:18px;padding:12px 18px;color:#102044;font-weight:950;box-shadow:0 14px 30px rgba(37,99,235,.06)}
      .v582-action-lite i{display:grid;place-items:center;width:24px;height:24px;border-radius:10px;background:#eef5ff;color:#2563eb;font-style:normal;font-size:14px;font-weight:1000}
      .v582-primary{display:inline-flex;align-items:center;gap:10px;border:0;border-radius:19px;padding:13px 22px;font-weight:950;color:#fff;background:linear-gradient(135deg,#2563eb,#3b82f6 46%,#4f8dfb);box-shadow:0 20px 38px rgba(37,99,235,.22)}
      .v582-primary:hover{filter:brightness(1.03)}
      .v582-board{display:grid;grid-template-columns:minmax(0,1.75fr) 420px;gap:18px;align-items:start}
      .v582-main{display:grid;gap:16px}
      .v582-panel,.v582-side-card,.v582-side-metric,.v582-mini-card{position:relative;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,251,255,.98));border:1px solid #dbe7f6;border-radius:32px;box-shadow:0 26px 64px rgba(37,99,235,.09)}
      .v582-panel:before,.v582-side-card:before,.v582-side-metric:before,.v582-mini-card:before{content:'';position:absolute;inset:auto -72px -72px auto;width:210px;height:210px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,.08),transparent 70%);pointer-events:none}
      .v582-panel{padding:24px 24px 18px}
      .v582-main-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}
      .v582-main-head h3{margin:0;color:#102044;font-size:20px;letter-spacing:-.04em}
      .v582-main-head p{margin:8px 0 0;color:#64748b;font-size:13px;font-weight:820;line-height:1.45}
      .v582-title-pack{display:flex;align-items:flex-start;gap:16px}
      .v582-title-icon,.v582-side-icon,.v582-metric-icon{flex:0 0 auto;display:grid;place-items:center;width:56px;height:56px;border-radius:20px;background:linear-gradient(180deg,#eefbf4,#dff8eb);box-shadow:0 18px 34px rgba(16,185,129,.16);color:#16a34a;font-size:28px;font-weight:1000}
      .v582-status{display:inline-flex;align-items:center;gap:9px;border:1px solid #bbf7d0;background:#ecfdf5;border-radius:999px;padding:10px 14px;color:#16a34a;font-size:13px;font-weight:1000;white-space:nowrap}
      .v582-status:before{content:'';width:11px;height:11px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 5px rgba(34,197,94,.12)}
      .v582-chart-box{position:relative;border-radius:28px;padding:6px 0 0}
      .v582-svg{width:100%;height:390px;display:block;overflow:visible}
      .v582-axis-label{fill:#334a73;font-size:13px;font-weight:900}
      .v582-axis-caption{fill:#5f7291;font-size:12px;font-weight:860}
      .v582-chart-grid{stroke:rgba(148,163,184,.35);stroke-dasharray:5 6}
      .v582-baseline{stroke:rgba(191,219,254,.95)}
      .v582-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
      .v582-mini-card{padding:16px 16px 18px;min-height:148px}
      .v582-mini-top{display:flex;align-items:flex-start;gap:12px}
      .v582-mini-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:18px;background:#eef7ff;color:#2563eb;font-size:24px;box-shadow:0 12px 24px rgba(37,99,235,.10)}
      .v582-mini-card span{display:block;font-size:12px;line-height:1.25;letter-spacing:.08em;text-transform:uppercase;color:#7083a2;font-weight:1000}
      .v582-mini-card b{display:block;margin-top:8px;font-size:36px;line-height:1;letter-spacing:-.06em;color:#102044}
      .v582-mini-card small{display:block;margin-top:10px;color:#5f7291;font-size:13px;font-weight:850;line-height:1.45}
      .v582-mini-card b.green{color:#16a34a}.v582-mini-card b.blue{color:#2563eb}.v582-mini-card b.amber{color:#f59e0b}
      .v582-side{display:grid;gap:16px}
      .v582-side-card{padding:26px;display:grid;gap:16px}
      .v582-side-head{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:start}
      .v582-side-head h3{margin:0;color:#102044;font-size:18px;letter-spacing:-.035em}
      .v582-side-head p{margin:8px 0 0;color:#5f7291;font-size:14px;font-weight:820;line-height:1.55}
      .v582-side-icon{background:linear-gradient(180deg,#eef2ff,#f7f8ff);box-shadow:0 18px 34px rgba(37,99,235,.12);color:#2554f4;font-size:26px}
      .v582-tip{border:1px solid #dfe8f7;border-radius:24px;background:linear-gradient(180deg,#f8fbff,#f4f7ff);padding:18px 18px 18px 20px;color:#2d4d95;font-size:13px;line-height:1.65;font-weight:850}
      .v582-tip b{display:block;margin-bottom:4px;color:#1d4ed8}
      .v582-side-metric{padding:22px;display:grid;grid-template-columns:64px minmax(0,1fr);gap:18px;align-items:start}
      .v582-metric-icon{width:60px;height:60px;border-radius:22px;background:linear-gradient(180deg,#eefbf4,#e5fff2);box-shadow:0 16px 32px rgba(16,185,129,.14);font-size:28px}
      .v582-side-metric.warn .v582-metric-icon{background:linear-gradient(180deg,#fff5eb,#fff0da);box-shadow:0 16px 32px rgba(245,158,11,.14);color:#f59e0b}
      .v582-side-metric h4{margin:0;font-size:12px;letter-spacing:.10em;text-transform:uppercase;color:#7183a3;font-weight:1000}
      .v582-side-metric b{display:block;margin-top:8px;font-size:44px;line-height:1;color:#102044;letter-spacing:-.07em}
      .v582-side-metric.warn b{color:#f59e0b}
      .v582-side-metric small{display:block;margin-top:10px;color:#5f7291;font-size:14px;font-weight:850;line-height:1.45}
      .v582-table-wrap{margin-top:4px;border-radius:30px;overflow:hidden;box-shadow:0 24px 56px rgba(37,99,235,.08)}
      .v582-table-wrap .habit-table{margin:0!important;border-radius:30px!important;box-shadow:none!important}
      .v582-table-wrap .habit-title,.v582-table-wrap .habit-actions{background:rgba(255,255,255,.98)!important}
      .v582-table-wrap .habit-day-head.weekend{background:#f4f8ff!important}
      .v582-table-wrap .day-check{border-radius:10px;transition:transform .14s ease,box-shadow .14s ease}
      .v582-table-wrap .day-check:hover{transform:scale(1.08);box-shadow:0 0 0 4px rgba(37,99,235,.10)}
      @media(max-width:1380px){.v582-board{grid-template-columns:1fr}.v582-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:860px){.v582-toolbar{align-items:flex-start}.v582-main-head{flex-direction:column}.v582-svg{height:340px}.v582-stats{grid-template-columns:1fr}.v582-side-metric{grid-template-columns:56px minmax(0,1fr)}}
      @media(max-width:640px){.v582-range button{padding:10px 14px;font-size:14px}.v582-panel,.v582-side-card,.v582-side-metric,.v582-mini-card{border-radius:24px}.v582-panel{padding:18px}.v582-side-card,.v582-side-metric{padding:18px}.v582-svg{height:300px}.v582-title-pack,.v582-side-head{grid-template-columns:1fr;display:grid}.v582-title-icon,.v582-side-icon,.v582-metric-icon{width:52px;height:52px;font-size:24px}.v582-mini-card b,.v582-side-metric b{font-size:34px}}
    `;
    document.head.appendChild(st);
  }

  function v582Path(points){
    if(!points.length) return '';
    if(points.length===1) return `M ${points[0][0]} ${points[0][1]}`;
    let d=`M ${points[0][0]} ${points[0][1]}`;
    for(let i=0;i<points.length-1;i++){
      const p0=points[i-1]||points[i];
      const p1=points[i];
      const p2=points[i+1];
      const p3=points[i+2]||p2;
      const cp1x=p1[0]+(p2[0]-p0[0])/6;
      const cp1y=p1[1]+(p2[1]-p0[1])/6;
      const cp2x=p2[0]-(p3[0]-p1[0])/6;
      const cp2y=p2[1]-(p3[1]-p1[1])/6;
      d+=` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  }

  function v582Chart(days){
    const habits=state.habits||[];
    const maxHabits=Math.max(1,habits.length);
    const vals=days.map(d=>habits.filter(h=>h.marks?.[d]).length);
    const totalMarks=vals.reduce((a,b)=>a+b,0);
    const avgDay=vals.length?Math.round(totalMarks/vals.length):0;
    const best=Math.max(0,...vals);
    const last=vals[vals.length-1]||0;
    const yMax=Math.max(3,maxHabits);
    const yMarks=[0, Math.round(yMax/3), Math.round(yMax*2/3), yMax].filter((v,i,a)=>i===0 || v!==a[i-1]);
    while(yMarks.length<4){ yMarks.splice(yMarks.length-1,0,yMarks[yMarks.length-2]||0); }
    const w=900,h=360,left=46,right=14,top=18,bottom=46;
    const plotW=w-left-right, plotH=h-top-bottom;
    const step=days.length>1?plotW/(days.length-1):plotW;
    const pts=vals.map((v,i)=>[+(left+i*step).toFixed(2), +(top+plotH-(plotH*(v/yMax))).toFixed(2)]);
    const linePath=v582Path(pts);
    const areaPath=`${linePath} L ${pts[pts.length-1]?pts[pts.length-1][0]:left} ${top+plotH} L ${left} ${top+plotH} Z`;
    const firstDate=days[0]?new Date(days[0]):null;
    const midDate=days[Math.floor(days.length/2)]?new Date(days[Math.floor(days.length/2)]):null;
    const lastDate=days[days.length-1]?new Date(days[days.length-1]):null;
    const firstLabel=firstDate?firstDate.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    const midLabel=midDate?midDate.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    const lastLabel=lastDate?lastDate.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'';
    return `
      <article class="v582-panel">
        <div class="v582-main-head">
          <div class="v582-title-pack">
            <div class="v582-title-icon">↗</div>
            <div><h3>Тренд привычек по дням</h3><p>Чем выше линия, тем больше привычек было выполнено в день.</p></div>
          </div>
          <span class="v582-status">сегодня ${last}/${maxHabits}</span>
        </div>
        <div class="v582-chart-box">
          <svg class="v582-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Тренд привычек">
            <defs>
              <linearGradient id="v582Area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(34,197,94,.34)"/><stop offset="100%" stop-color="rgba(34,197,94,.06)"/></linearGradient>
              <linearGradient id="v582Line" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#16a34a"/></linearGradient>
              <filter id="v582Glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            ${yMarks.map(v=>{const y=(top+plotH-(plotH*(v/yMax))).toFixed(2); return `<g><line class="v582-chart-grid" x1="${left}" y1="${y}" x2="${w-right}" y2="${y}"/><text class="v582-axis-label" x="12" y="${(+y+4).toFixed(2)}">${v}</text></g>`}).join('')}
            <line class="v582-baseline" x1="${left}" y1="${top+plotH}" x2="${w-right}" y2="${top+plotH}"/>
            <path d="${areaPath}" fill="url(#v582Area)"></path>
            <path d="${linePath}" fill="none" stroke="rgba(34,197,94,.18)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" filter="url(#v582Glow)"></path>
            <path d="${linePath}" fill="none" stroke="url(#v582Line)" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"></path>
            ${pts.map((p,i)=>{
              const r=i===pts.length-1?9.5:6.2;
              const ring=i===pts.length-1?`<circle cx="${p[0]}" cy="${p[1]}" r="${(r+7).toFixed(1)}" fill="rgba(34,197,94,.12)"></circle><circle cx="${p[0]}" cy="${p[1]}" r="${(r+4).toFixed(1)}" fill="rgba(34,197,94,.10)"></circle>`:'';
              return `<g>${ring}<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="#22c55e" stroke="#ffffff" stroke-width="${i===pts.length-1?3.8:3.2}"><title>${fmt(days[i])}: ${vals[i]}/${maxHabits}</title></circle></g>`;
            }).join('')}
            <text class="v582-axis-caption" x="${left}" y="${h-10}"><tspan style="font-weight:950;fill:#102044">${firstLabel}</tspan> старт периода</text>
            <text class="v582-axis-caption" x="${(left+plotW/2)-42}" y="${h-10}"><tspan style="font-weight:950;fill:#102044">${midLabel}</tspan> середина</text>
            <text class="v582-axis-caption" x="${w-right-132}" y="${h-10}"><tspan style="font-weight:950;fill:#102044">${lastLabel}</tspan> сегодня</text>
          </svg>
        </div>
      </article>
      <section class="v582-stats">
        <article class="v582-mini-card"><div class="v582-mini-top"><div class="v582-mini-icon" style="color:#16a34a;background:#eefbf4">↗</div><div><span>Среднее / день</span><b class="green">${avgDay}</b><small>из ${maxHabits} привычек</small></div></div></article>
        <article class="v582-mini-card"><div class="v582-mini-top"><div class="v582-mini-icon" style="color:#4f46e5;background:#f2efff">✦</div><div><span>Лучший день</span><b>${best}</b><small>максимум отметок за период</small></div></div></article>
        <article class="v582-mini-card"><div class="v582-mini-top"><div class="v582-mini-icon" style="color:#2563eb;background:#eef5ff">☑</div><div><span>Всего отметок</span><b class="blue">${totalMarks}</b><small>суммарная активность</small></div></div></article>
        <article class="v582-mini-card"><div class="v582-mini-top"><div class="v582-mini-icon" style="color:#2563eb;background:#eef5ff">∿</div><div><span>Ритм сегодня</span><b>${last}/${maxHabits}</b><small>${last>=avgDay?'выше среднего':'ниже среднего'}</small></div></div></article>
      </section>`;
  }

  function v582HabitsPage(){
    v582Styles();
    const range=num(state.settings.habitRange)||28;
    const days=Array.from({length:range},(_,i)=>iso(addDays(new Date(),-(range-1-i))));
    const habits=state.habits||[];
    const stable=habits.filter(h=>habitPct(h,days)>=70).length;
    const focus=habits.filter(h=>habitPct(h,days)<40).length;
    return layout('Привычки','Премиальный трекер ритма: аккуратный график, понятные подсказки и спокойная аналитика.',`
      <section class="v582-wrap">
        <div class="v582-toolbar">
          <div class="v582-range">${[7,14,28].map(n=>`<button data-action="setHabitRange" data-range="${n}" class="${range===n?'active':''}">${n} дней</button>`).join('')}</div>
          <div class="v582-toolbar-actions"><button class="v582-action-lite"><i>🛡</i>Стабильность: ${habits.length?Math.round(stable/habits.length*100):0}%</button><button class="v582-primary" data-action="openRecordForm" data-type="habit">＋ Новая привычка</button></div>
        </div>
        <section class="v582-board">
          <div class="v582-main">${v582Chart(days)}</div>
          <aside class="v582-side">
            <article class="v582-side-card">
              <div class="v582-side-head"><div class="v582-side-icon">⌁</div><div><h3>Что показывает график</h3><p>Теперь график читает не просто столбцы, а общий темп: когда привычки росли, где просели и какой уровень удалось удержать.</p></div></div>
              <div class="v582-tip"><b>Совет:</b> держи 2–3 якорные привычки, которые проще всего выполнить даже в тяжёлый день. Именно они стабилизируют линию графика.</div>
            </article>
            <article class="v582-side-metric"><div class="v582-metric-icon">🛡</div><div><h4>Стабильные привычки</h4><b>${stable}</b><small>выполнение не ниже 70% за период</small></div></article>
            <article class="v582-side-metric warn"><div class="v582-metric-icon">◎</div><div><h4>Нужны в фокусе</h4><b>${focus}</b><small>привычки с низким процентом выполнения</small></div></article>
          </aside>
        </section>
        <section class="v582-table-wrap"><section class="habit-table"><div class="habit-grid" style="grid-template-columns:280px repeat(${range},32px) 116px"><div class="habit-head"><div class="habit-title"><b>Привычка</b></div>${days.map(d=>`<div class="habit-day-head ${[0,6].includes(new Date(d).getDay())?'weekend':''}">${new Date(d).getDate()}<br>${new Date(d).toLocaleDateString('ru-RU',{weekday:'short'}).slice(0,2)}</div>`).join('')}<div class="habit-actions"><b>Действия</b></div></div>${habits.map(h=>habitRow(h,days)).join('')}</div></section></section>
      </section>`);
  }

  if(typeof habitsPage==='function') habitsPage=v582HabitsPage;
  if(typeof habitTrend==='function') habitTrend=v582Chart;

  function v582Post(){
    v582Styles();
    const version=document.querySelector('.version'); if(version) version.textContent=V582_LABEL;
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V582_BUILD);
  }
  const oldRenderV582=typeof render==='function'?render:null;
  if(oldRenderV582){render=function(){v582Styles(); const r=oldRenderV582.apply(this,arguments); setTimeout(v582Post,90); return r;};}
  try{v582Styles();save();render();}catch(e){console.error('[V58.2 habit chart premium init]',e)}
})();


/* ===== V58.3 ROOT CONFIRMATION: prove new app.js is loaded ===== */
(function(){
  const V583_BUILD='second-brain-space-v58-3-root-habit-premium-20260708';
  const V583_LABEL='V58.3 · ROOT HABIT PREMIUM';
  try{localStorage.setItem('secondBrainOS.currentBuild',V583_BUILD);}catch(e){}
  function v583Post(){
    try{
      document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V583_BUILD);
      const version=document.querySelector('.version'); if(version) version.textContent=V583_LABEL;
      const hero=document.querySelector('.hero p');
      if((page==='habits' || (location.hash||'').replace('#','')==='habits') && hero){
        hero.textContent='Премиальный трекер ритма: новый график загружен из app.js V58.3, таблица и sidebar сохранены.';
      }
      document.body?.setAttribute('data-sbos-build',V583_BUILD);
    }catch(e){console.error('[V58.3 post]',e)}
  }
  const oldRenderV583=typeof render==='function'?render:null;
  if(oldRenderV583){render=function(){const r=oldRenderV583.apply(this,arguments); setTimeout(v583Post,120); return r;};}
  try{v583Post();}catch(e){}
})();


/* ===== V59 CLEAN CORE FOUNDATION: single render gate, unified shell, system center ===== */
(function(){
  const V59_BUILD='second-brain-space-v59-clean-core-foundation-20260708';
  const V59_LABEL='V59 · CLEAN CORE FOUNDATION';
  try{localStorage.setItem('secondBrainOS.currentBuild',V59_BUILD);}catch(e){}

  function v59Kb(n){return (Math.round((n/1024)*10)/10)+' КБ'}
  function v59StorageSize(){let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n += (k||'').length + (localStorage.getItem(k)||'').length;}}catch(e){}return n}
  function v59Count(k){return Array.isArray(state&&state[k])?state[k].length:0}
  function v59SafeMoney(v){try{return money(v)}catch(e){return String(Math.round(v||0))+' ₽'}}
  function v59MiniStat(title,value,sub,cls){return `<article class="v59-stat"><span>${esc(title)}</span><b class="${cls||''}">${value}</b><small>${esc(sub||'')}</small></article>`}

  function v59Styles(){
    if(document.getElementById('v59-clean-core-style')) return;
    const st=document.createElement('style');
    st.id='v59-clean-core-style';
    st.textContent=`
      :root{--v59-blue:#2563eb;--v59-line:#dbe7f6;--v59-ink:#102044;--v59-muted:#64748b;--v59-green:#10b981;--v59-shadow:0 22px 56px rgba(37,99,235,.09);}
      html,body,#app,.app,.main,#view{overflow-anchor:none!important}
      body{background:radial-gradient(circle at 18% 0%,rgba(37,99,235,.13),transparent 30%),radial-gradient(circle at 86% 0%,rgba(14,165,233,.13),transparent 30%),linear-gradient(180deg,#fff 0%,#f7fbff 42%,#eef6ff 100%)!important}
      .app.v59-app{grid-template-columns:286px minmax(0,1fr)}
      .v59-side{position:sticky;top:0;height:100vh;background:rgba(255,255,255,.88);backdrop-filter:blur(22px);border-right:1px solid rgba(219,231,246,.92);padding:18px 14px;display:grid;grid-template-rows:auto 1fr auto;gap:14px;overflow:hidden}
      .v59-brand{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 6px 10px}
      .v59-brand-left{display:flex;align-items:center;gap:12px}.v59-logo{width:38px;height:38px;border-radius:15px;background:linear-gradient(135deg,#2563eb,#38bdf8);box-shadow:0 14px 28px rgba(37,99,235,.24);color:#fff;display:grid;place-items:center;font-weight:1000}.v59-title{font-size:15px;font-weight:1000;letter-spacing:-.04em;color:#102044}.v59-sub{font-size:11px;color:#64748b;font-weight:800;margin-top:1px}.v59-core-pill{border:1px solid #dbe7f6;background:#f8fbff;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:1000;color:#2563eb}
      .v59-search{height:42px;border:1px solid var(--v59-line);background:#f8fbff;border-radius:16px;display:flex;align-items:center;gap:9px;padding:0 12px;color:#8aa0bc}.v59-search input{border:0;background:transparent;outline:0;width:100%;font-weight:800;color:var(--v59-ink)}
      .v59-nav-scroll{min-height:0;overflow:auto;scrollbar-gutter:stable;overscroll-behavior:contain;padding-right:2px}.v59-nav-scroll::-webkit-scrollbar{width:8px}.v59-nav-scroll::-webkit-scrollbar-thumb{background:#dbe7f6;border-radius:999px}
      .v59-section{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8ca0b8;font-weight:1000;display:flex;justify-content:space-between;align-items:center;margin:14px 8px 6px}.v59-nav-list{display:grid;gap:5px}.v59-nav-item{position:relative;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:9px;border:1px solid transparent;background:transparent;color:#334155;border-radius:15px;padding:9px 8px;text-align:left;font-weight:900;transition:background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease}.v59-nav-item:hover{background:#f2f7ff;border-color:#e3edfb}.v59-nav-item.active{background:linear-gradient(135deg,#edf4ff,#ffffff);border-color:#bfd7ff;color:#2563eb;box-shadow:0 14px 28px rgba(37,99,235,.08)}.v59-nav-ico{width:30px;height:30px;border-radius:11px;display:grid;place-items:center;color:#fff;box-shadow:0 8px 18px rgba(15,23,42,.10);font-size:15px}.v59-nav-tools{opacity:.18;display:flex;gap:2px}.v59-nav-item:hover .v59-nav-tools{opacity:1}.v59-tiny{border:0;background:transparent;color:#7b8aa4;width:23px;height:23px;border-radius:8px;display:grid;place-items:center}.v59-tiny:hover{background:#eef5ff;color:#2563eb}
      .v59-side-bottom{display:grid;gap:10px}.v59-ai-card{border:1px solid #dbe7f6;border-radius:22px;background:linear-gradient(180deg,#ffffff,#f7fbff);box-shadow:0 16px 38px rgba(37,99,235,.08);padding:13px}.v59-ai-card h3{margin:0 0 6px;font-size:14px;letter-spacing:-.03em}.v59-ai-card p{margin:0 0 10px;color:#64748b;font-size:11px;font-weight:800;line-height:1.35}.v59-side-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v59-side-actions button{height:34px;border:1px solid #dbe7f6;background:#fff;border-radius:13px;font-size:11px;font-weight:1000;color:#334155}.v59-side-actions button:hover{background:#eef5ff;color:#2563eb}
      .v59-main{min-width:0;padding:18px 28px 52px}.v59-topbar{height:58px;display:flex;align-items:center;gap:14px;margin-bottom:22px}.v59-global-search{max-width:640px;flex:1}.v59-top-actions{margin-left:auto;display:flex;align-items:center;gap:10px}.v59-user-pill{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:center;border:1px solid #dbe7f6;background:rgba(255,255,255,.88);border-radius:18px;padding:6px 12px;box-shadow:0 12px 28px rgba(37,99,235,.05)}.v59-user-pill .avatar{width:34px;height:34px}
      .v59-page{max-width:1600px;margin:0 auto}.v59-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:18px}.v59-hero h1{font-size:36px;line-height:1;margin:0;letter-spacing:-.06em;color:#06204d}.v59-hero p{margin:9px 0 0;color:#53657f;font-weight:760}.v59-date-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.v59-date-pill{background:rgba(255,255,255,.88);border:1px solid #dbe7f6;border-radius:16px;padding:10px 14px;font-weight:950;color:#334155;box-shadow:0 14px 28px rgba(37,99,235,.06);white-space:nowrap}
      .v59-command{position:relative;overflow:hidden;border:1px solid #dbe7f6;border-radius:34px;background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(239,247,255,.96));box-shadow:0 28px 70px rgba(37,99,235,.11);padding:24px;margin-bottom:18px;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(340px,.9fr);gap:18px}.v59-command:before{content:'';position:absolute;right:-110px;top:-120px;width:310px;height:310px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.14),transparent 68%)}.v59-command h2{margin:0;font-size:26px;letter-spacing:-.055em;color:#102044}.v59-command p{margin:9px 0 0;color:#64748b;font-weight:820;line-height:1.45}.v59-command-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.v59-command-actions button,.v59-command-actions a{border:1px solid #dbe7f6;background:#fff;border-radius:16px;padding:12px 14px;font-weight:950;color:#334155;box-shadow:0 12px 26px rgba(37,99,235,.05)}.v59-command-actions .primary{border:0;color:#fff;background:linear-gradient(135deg,#2563eb,#38bdf8);box-shadow:0 20px 38px rgba(37,99,235,.20)}
      .v59-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.v59-stat{position:relative;overflow:hidden;border:1px solid #dbe7f6;border-radius:24px;background:linear-gradient(180deg,#fff,#f8fbff);box-shadow:0 18px 42px rgba(37,99,235,.075);padding:16px;min-height:112px}.v59-stat:after{content:'';position:absolute;right:-40px;top:-48px;width:128px;height:128px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.08),transparent 72%)}.v59-stat span{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7b8aa4;font-weight:1000}.v59-stat b{display:block;margin-top:10px;font-size:30px;letter-spacing:-.06em;color:#102044}.v59-stat b.green{color:#10b981}.v59-stat b.blue{color:#2563eb}.v59-stat b.red{color:#ef4444}.v59-stat b.amber{color:#f59e0b}.v59-stat small{display:block;margin-top:7px;color:#64748b;font-size:12px;font-weight:820;line-height:1.35}.v59-grid{display:grid;gap:16px}.v59-cols-2{grid-template-columns:1.15fr .85fr}.v59-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.v59-card{position:relative;overflow:hidden;border:1px solid #dbe7f6;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,251,255,.98));box-shadow:var(--v59-shadow);padding:20px}.v59-card h3{margin:0;font-size:20px;letter-spacing:-.04em;color:#102044}.v59-card p{color:#64748b;font-weight:800;line-height:1.48}.v59-list{display:grid;gap:10px;margin-top:12px}.v59-list-row{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid #e2ebf7;background:#fff;border-radius:18px;padding:12px}.v59-row-icon{width:42px;height:42px;border-radius:15px;display:grid;place-items:center;background:#eef5ff;color:#2563eb;font-weight:1000}.v59-list-row b{display:block;color:#102044}.v59-list-row small{display:block;color:#64748b;font-weight:780;margin-top:3px}.v59-badge{display:inline-flex;align-items:center;gap:6px;border:1px solid #dbe7f6;background:#f8fbff;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:1000;color:#334155}.v59-badge.green{background:#ecfdf5;border-color:#bbf7d0;color:#059669}.v59-badge.red{background:#fff1f2;border-color:#ffe4e6;color:#ef4444}.v59-badge.blue{background:#eef5ff;border-color:#bfdbfe;color:#2563eb}.v59-badge.amber{background:#fff7ed;border-color:#fed7aa;color:#d97706}
      .v59-core-health{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.v59-health-item{border:1px solid #e2ebf7;background:#fff;border-radius:20px;padding:14px}.v59-health-item span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#7b8aa4;font-weight:1000}.v59-health-item b{display:block;margin-top:7px;font-size:22px;color:#102044}.v59-pill-link{display:inline-flex;align-items:center;gap:8px;border:1px solid #dbe7f6;background:#fff;border-radius:16px;padding:10px 12px;font-weight:950;color:#334155}.v59-pill-link:hover{background:#eef5ff;color:#2563eb}.v59-version{position:fixed;left:14px;bottom:10px;z-index:90;background:linear-gradient(135deg,#0f172a,#2563eb);color:#fff;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:1000;box-shadow:0 14px 32px rgba(15,23,42,.18)}
      .v59-drawer{position:fixed;right:18px;bottom:18px;width:min(420px,calc(100vw - 36px));z-index:120;background:#fff;border:1px solid #dbe7f6;border-radius:28px;box-shadow:0 30px 80px rgba(15,23,42,.22);padding:18px;display:none}.v59-drawer.show{display:block}.v59-drawer-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.v59-drawer h3{margin:0;font-size:20px;letter-spacing:-.04em}.v59-ai-grid{display:grid;gap:9px}.v59-ai-grid button{border:1px solid #dbe7f6;background:#f8fbff;border-radius:16px;padding:12px;text-align:left;font-weight:900;color:#334155}.v59-ai-grid button:hover{background:#eef5ff;color:#2563eb}.v59-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(24px);opacity:0;pointer-events:none;background:#0f172a;color:#fff;border-radius:999px;padding:12px 16px;font-weight:950;z-index:220;transition:.18s ease}.v59-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
      .card,.folder-pane,.habit-table,.record-card,.module-card,.debt-col,.debt-card{border-color:#dbe7f6!important;box-shadow:0 18px 44px rgba(37,99,235,.07)!important}.row{transition:border-color .14s ease,background .14s ease,box-shadow .14s ease!important}.row:hover{border-color:#bfdbfe!important;background:#f8fbff!important;box-shadow:0 12px 28px rgba(37,99,235,.06)!important}.nav-item,.folder-item{transform:none!important}.version{display:none!important}
      @media(max-width:1180px){.app.v59-app{grid-template-columns:86px minmax(0,1fr)}.v59-side{padding:14px 10px}.v59-title,.v59-sub,.v59-nav-item .label,.v59-section span,.v59-nav-tools,.v59-search,.v59-ai-card p,.v59-ai-card h3,.v59-core-pill{display:none}.v59-brand{justify-content:center}.v59-nav-item{grid-template-columns:1fr;place-items:center}.v59-nav-ico{width:38px;height:38px}.v59-side-actions{grid-template-columns:1fr}.v59-command{grid-template-columns:1fr}.v59-stats,.v59-core-health{grid-template-columns:repeat(2,minmax(0,1fr))}.v59-cols-2,.v59-cols-3{grid-template-columns:1fr}}
      @media(max-width:760px){.app.v59-app{display:block}.v59-side{display:none}.v59-main{padding:12px 12px 96px}.v59-topbar{position:sticky;top:8px;z-index:50;height:auto;background:rgba(255,255,255,.84);backdrop-filter:blur(18px);border:1px solid #dbe7f6;border-radius:24px;padding:8px}.v59-global-search{display:none}.v59-hero{flex-direction:column;align-items:flex-start}.v59-hero h1{font-size:30px}.v59-stats,.v59-core-health{grid-template-columns:1fr}.v59-command{padding:18px;border-radius:26px}.v59-version{display:none}.bottom-nav{display:grid!important}}
    `;
    document.head.appendChild(st);
  }

  function v59NavHtml(){
    const groups={};
    (typeof visibleSections==='function'?visibleSections():SECTIONS).forEach(s=>(groups[s.group]||(groups[s.group]=[])).push(s));
    const html=Object.entries(groups).map(([g,items])=>`<div class="v59-section"><span>${esc(g)}</span><button class="v59-tiny" data-action="openAddFolder">＋</button></div><div class="v59-nav-list">${items.map(s=>`<button class="v59-nav-item ${page===s.id?'active':''}" data-go="${esc(s.id)}"><span class="v59-nav-ico" style="background:${esc(s.color||'#2563eb')}">${s.icon||'•'}</span><span class="label">${esc(typeof label==='function'?label(s.id):s.label||s.id)}</span><span class="v59-nav-tools"><span class="v59-tiny" data-action="renameSection" data-id="${esc(s.id)}">✎</span><span class="v59-tiny" data-action="hideSection" data-id="${esc(s.id)}">×</span></span></button>`).join('')}</div>`).join('');
    return html+`<div class="v59-section"><span>ЯДРО</span><button class="v59-tiny" data-v59-action="backup">↓</button></div><div class="v59-nav-list"><button class="v59-nav-item ${page==='system'?'active':''}" data-go="system"><span class="v59-nav-ico" style="background:#0f172a">⚙</span><span class="label">Система</span><span></span></button></div>`;
  }

  function v59RenderShell(content){
    const mobile = (typeof MOBILE!=='undefined'?MOBILE:[['dashboard','🏠','Обзор'],['finance','💸','Финансы'],['debts','⚖','Долги'],['tasks','✅','Задачи'],['habits','🎯','Ритм']]);
    const activeTitle = page==='system'?'Система':(typeof label==='function'?label(page):page);
    const userName=esc(state.settings?.name||'Алексей');
    const userSub=esc(state.settings?.subtitle||'Фокус и ясность');
    const app=document.getElementById('app');
    if(!app) return;
    app.innerHTML=`<div class="app v59-app"><aside class="v59-side"><div><div class="v59-brand"><div class="v59-brand-left"><div class="v59-logo">◆</div><div><div class="v59-title">Second Brain OS</div><div class="v59-sub">clean core foundation</div></div></div><span class="v59-core-pill">CORE</span></div><div class="v59-search"><span>⌕</span><input id="sideSearch" placeholder="Поиск"><span class="small">⌘K</span></div></div><div class="v59-nav-scroll">${v59NavHtml()}</div><div class="v59-side-bottom"><article class="v59-ai-card"><h3>AI-помощник</h3><p>Собирает день, долги, задачи и фокус без перегруза.</p><div class="v59-side-actions"><button data-v59-action="coach">Открыть</button><button data-v59-action="dayPlan">День</button></div></article></div></aside><main class="v59-main"><header class="v59-topbar"><div class="v59-search v59-global-search"><span>⌕</span><input id="globalSearch" placeholder="Поиск по задачам, проектам, заметкам, финансам..."><span class="small">⌘K</span></div><div class="v59-top-actions"><button class="ghost-btn" data-action="openQuick">＋ Создать</button><button class="ghost-btn" data-v59-action="backup">Экспорт</button><button class="icon-btn" data-go="system">⚙</button><button class="icon-btn" data-v59-action="coach">✦</button><div class="v59-user-pill"><div class="avatar">А</div><div><b>${userName}</b><div class="small muted">${userSub}</div></div></div></div></header><section id="view">${content}</section></main><button class="mobile-fab" data-action="openQuick">＋</button><nav class="bottom-nav">${mobile.map(([id,ico,l])=>`<button class="${page===id?'active':''}" data-go="${id}"><span>${ico}</span>${l}</button>`).join('')}</nav><div class="v59-version">${V59_LABEL}</div><div class="v59-drawer" id="v59Drawer"><div class="v59-drawer-head"><div><h3>AI-помощник</h3><p class="small muted">Быстрые действия по текущей системе.</p></div><button class="icon-btn" data-v59-action="coachClose">×</button></div><div class="v59-ai-grid"><button data-v59-action="dayPlan">Собрать день без перегруза</button><button data-v59-action="debtPlan">Разобрать долги по приоритету</button><button data-v59-action="focusPlan">Выбрать главный шаг недели</button><button data-go="system">Открыть состояние системы</button></div></div><div class="v59-toast" id="v59Toast"></div></div>`;
  }

  function v59Layout(title,subtitle,body,wide=true){return `<div class="v59-page ${wide?'wide-page':''}"><div class="v59-hero"><div><h1>${title}</h1><p>${subtitle||''}</p></div><div class="v59-date-row"><div class="v59-date-pill">☷ ${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</div><div class="v59-date-pill">▦ ${new Date().toLocaleDateString('ru-RU')}</div></div></div>${body}</div>`}

  function v59TodaySignal(){
    const tasks=typeof todayTasks==='function'?todayTasks():[];
    const overdue=(state.tasks||[]).filter(t=>t.date && t.date<today() && t.status!=='Готово' && t.status!=='Сделано');
    const debts=typeof activeDebts==='function'?activeDebts():[];
    const dueDebts=debts.filter(d=>d.due && d.due<=iso(addDays(new Date(),7)));
    const habits=state.habits||[];
    const done=habits.filter(h=>h.marks?.[today()]).length;
    return {tasks,overdue,debts,dueDebts,habits,done};
  }

  function v59Dashboard(){
    const sig=v59TodaySignal();
    const f=typeof financeTotals==='function'?financeTotals(periodInfo('month')):{inc:0,exp:0,net:0};
    const mainTasks=[...sig.overdue,...sig.tasks].slice(0,5);
    const debtSum=typeof total==='function'?total(sig.debts.filter(d=>d.direction==='out')):0;
    const focusHabit=sig.habits.find(h=>!h.marks?.[today()]);
    return v59Layout(`Доброе утро, ${esc(state.settings?.name||'Алексей')}!`,'Чистое ядро: один стабильный рендер, единый визуал и операционный центр вместо хаоса.',`<section class="v59-command"><div><h2>Операционный центр дня</h2><p>Second Brain OS теперь не просто показывает разделы, а собирает главный фокус: задачи, деньги, долги, привычки и перегруз в одном экране.</p><div class="v59-command-actions"><button class="primary" data-v59-action="dayPlan">Собрать день</button><button data-v59-action="coach">AI-помощник</button><button data-go="system">Состояние системы</button><button data-v59-action="backup">Скачать backup</button></div></div><div class="v59-stats"><article class="v59-stat"><span>Сегодня задач</span><b class="blue">${sig.tasks.length}</b><small>${sig.overdue.length} просрочено</small></article><article class="v59-stat"><span>Долги к оплате</span><b class="red">${v59SafeMoney(debtSum)}</b><small>${sig.dueDebts.length} сроков рядом</small></article><article class="v59-stat"><span>Привычки сегодня</span><b class="green">${sig.done}/${sig.habits.length}</b><small>${focusHabit?`следующая: ${focusHabit.name}`:'ритм закрыт'}</small></article><article class="v59-stat"><span>Прогноз месяца</span><b class="${(f.netWithUpcoming??f.net)<0?'red':'green'}">${v59SafeMoney(f.netWithUpcoming??f.net)}</b><small>финансовый остаток</small></article></div></section><section class="v59-grid v59-cols-2"><article class="v59-card"><h3>Что сделать сейчас</h3><div class="v59-list">${mainTasks.map(t=>`<div class="v59-list-row"><div class="v59-row-icon">✓</div><div><b>${esc(t.title||'Задача')}</b><small>${esc(t.date?fmt(t.date):'без даты')} ${t.time?`· ${esc(t.time)}`:''}</small></div><span class="v59-badge ${t.date&&t.date<today()?'red':'blue'}">${t.status||'Активно'}</span></div>`).join('')||'<div class="v59-list-row"><div class="v59-row-icon">✓</div><div><b>Сегодня можно идти спокойно</b><small>Нет обязательных задач на день.</small></div><span class="v59-badge green">чисто</span></div>'}</div></article><article class="v59-card"><h3>Стратегические переходы</h3><div class="v59-list"><button class="v59-list-row" data-go="finance"><div class="v59-row-icon">₽</div><div><b>Финансы</b><small>лимит, долги, прогноз и категории</small></div><span class="v59-badge blue">открыть</span></button><button class="v59-list-row" data-go="calendar"><div class="v59-row-icon">▦</div><div><b>Календарь</b><small>нагрузка недели и реальные дедлайны</small></div><span class="v59-badge blue">открыть</span></button><button class="v59-list-row" data-go="habits"><div class="v59-row-icon">↗</div><div><b>Привычки</b><small>премиальный график ритма</small></div><span class="v59-badge green">живой</span></button><button class="v59-list-row" data-go="tasks"><div class="v59-row-icon">☑</div><div><b>Задачи</b><small>исполнение без перегруза</small></div><span class="v59-badge blue">открыть</span></button></div></article></section>`)}

  function v59SystemPage(){
    const size=v59StorageSize();
    const arrays=['operations','debts','tasks','purchases','wishes','notes','ideas','people','habits','goals','documents','books','films','trips','personal','archive'];
    return v59Layout('Система','Диагностика ядра, безопасность данных, backup и проверка, что загружена именно новая сборка.',`<section class="v59-command"><div><h2>Clean Core Foundation</h2><p>Эта версия ставит поверх старой цепочки один главный стабильный render-gate. Старые визуальные хвосты больше не управляют отрисовкой страницы.</p><div class="v59-command-actions"><button class="primary" data-v59-action="backup">Скачать backup JSON</button><button data-v59-action="copyHealth">Скопировать диагностику</button><button data-v59-action="clearRuntimeCache">Очистить runtime-кэш</button></div></div><div class="v59-core-health"><div class="v59-health-item"><span>Build</span><b>V59</b></div><div class="v59-health-item"><span>Данные</span><b>${v59Kb(size)}</b></div><div class="v59-health-item"><span>Разделов</span><b>${(typeof visibleSections==='function'?visibleSections():SECTIONS).length}</b></div><div class="v59-health-item"><span>Задач</span><b>${v59Count('tasks')}</b></div><div class="v59-health-item"><span>Операций</span><b>${v59Count('operations')}</b></div></div></section><section class="v59-grid v59-cols-2"><article class="v59-card"><h3>Структура данных</h3><div class="v59-core-health" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-top:14px">${arrays.map(k=>`<div class="v59-health-item"><span>${esc(k)}</span><b>${v59Count(k)}</b></div>`).join('')}</div></article><article class="v59-card"><h3>Что стало стабильнее</h3><div class="v59-list"><div class="v59-list-row"><div class="v59-row-icon">1</div><div><b>Один главный рендер</b><small>V59 перехватывает управление страницей без цепочки setTimeout-фиксов.</small></div><span class="v59-badge green">ok</span></div><div class="v59-list-row"><div class="v59-row-icon">2</div><div><b>Стабильный sidebar</b><small>Левое меню стало отдельным scroll-контейнером.</small></div><span class="v59-badge green">ok</span></div><div class="v59-list-row"><div class="v59-row-icon">3</div><div><b>Data Safety</b><small>Backup доступен из шапки, sidebar и этой страницы.</small></div><span class="v59-badge green">ok</span></div><div class="v59-list-row"><div class="v59-row-icon">4</div><div><b>Путь к V60</b><small>Следующий шаг — вынести модули в отдельные файлы.</small></div><span class="v59-badge blue">план</span></div></div></article></section>`)}

  function v59Render(){
    try{v59Styles(); state=typeof normalize==='function'?normalize(state):state; if(typeof save==='function') save();}catch(e){console.error('[V59 normalize]',e)}
    const map={dashboard:v59Dashboard,finance:financePage,debts:debtsPage,tasks:tasksPage,planning:planningPage,purchases:purchasesPage,wishes:wishesPage,notes:notesPage,ideas:ideasPage,people:peoplePage,habits:habitsPage,goals:goalsPage,documents:documentsPage,books:booksPage,films:filmsPage,trips:tripsPage,personal:personalPage,archive:archivePage,system:v59SystemPage};
    if(typeof calendarPage==='function') map.calendar=calendarPage;
    if(typeof window!=='undefined' && window.polinaPage) map.polina=window.polinaPage;
    try{v59RenderShell((map[page]||v59Dashboard)()); v59Post();}catch(e){console.error('[V59 render]',e); const app=document.getElementById('app'); if(app) app.innerHTML=`<div style="padding:24px;font-family:system-ui"><h1>Second Brain OS</h1><p>Ошибка V59 render: ${esc(e.message||e)}</p><button onclick="location.hash='dashboard';location.reload()">Вернуться на обзор</button></div>`}
  }

  function v59Post(){
    try{document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',V59_BUILD); document.body?.setAttribute('data-sbos-build',V59_BUILD); const v=document.querySelector('.v59-version'); if(v) v.textContent=V59_LABEL;}catch(e){}
  }

  function v59Toast(msg){let el=document.getElementById('v59Toast'); if(!el){try{return toast(msg)}catch(e){return}} el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800)}
  function v59OpenCoach(){const d=document.getElementById('v59Drawer'); if(d) d.classList.add('show')}
  function v59CloseCoach(){const d=document.getElementById('v59Drawer'); if(d) d.classList.remove('show')}
  function v59Backup(){
    try{const payload={version:V59_BUILD,exportedAt:new Date().toISOString(),state}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='second-brain-os-backup-v59-'+new Date().toISOString().slice(0,10)+'.json'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500); v59Toast('Backup скачан')}catch(e){console.error(e); v59Toast('Не удалось скачать backup')}
  }
  function v59DayPlan(){
    const sig=v59TodaySignal();
    const debt=sig.dueDebts[0];
    const task=[...sig.overdue,...sig.tasks][0];
    const habit=sig.habits.find(h=>!h.marks?.[today()]);
    const lines=[task?`1. Закрыть задачу: ${task.title}`:'1. Выбрать одну маленькую задачу на 15 минут', debt?`2. Проверить долг: ${debt.person} · ${v59SafeMoney(debt.amount)}`:'2. Финансы: не добавлять новых обязательств сегодня', habit?`3. Минимальная привычка: ${habit.name}`:'3. Привычки: ритм дня закрыт'];
    if(typeof openModal==='function') openModal('План дня без перегруза',`<div class="v59-card"><h3>Три действия</h3><div class="v59-list">${lines.map((x,i)=>`<div class="v59-list-row"><div class="v59-row-icon">${i+1}</div><div><b>${esc(x.replace(/^\d\. /,''))}</b><small>${i===0?'главный рабочий шаг':i===1?'финансовая безопасность':'личный ритм'}</small></div><span class="v59-badge blue">сегодня</span></div>`).join('')}</div></div>`); else alert(lines.join('\n'));
  }
  function v59DebtPlan(){
    const debts=(typeof activeDebts==='function'?activeDebts():[]).filter(d=>d.direction==='out').sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999')));
    if(typeof openModal==='function') openModal('Приоритет долгов',`<div class="v59-list">${debts.slice(0,6).map((d,i)=>`<div class="v59-list-row"><div class="v59-row-icon">${i+1}</div><div><b>${esc(d.person||'Долг')} · ${v59SafeMoney(d.amount)}</b><small>срок: ${d.due?fmt(d.due):'не указан'}</small></div><span class="v59-badge ${d.due&&d.due<=today()?'red':'blue'}">${d.due&&d.due<=today()?'срочно':'план'}</span></div>`).join('')||'<p class="muted">Активных долгов нет.</p>'}</div>`);
  }
  function v59FocusPlan(){
    const goals=state.goals||[]; const g=goals[0];
    if(typeof openModal==='function') openModal('Главный шаг недели',`<div class="v59-card"><h3>${esc(g?g.title:'Цель недели')}</h3><p>${g?'Выбери один маленький шаг на 15–40 минут и поставь его в задачи.':'Создай одну цель, чтобы система могла собирать недельный фокус.'}</p><div class="v59-command-actions"><button class="primary" data-action="openRecordForm" data-type="task">＋ Создать задачу</button><button data-go="goals">Открыть цели</button></div></div>`);
  }
  function v59CopyHealth(){
    const txt=`${V59_LABEL}\nBuild: ${V59_BUILD}\nStorage: ${v59Kb(v59StorageSize())}\nTasks: ${v59Count('tasks')}\nOperations: ${v59Count('operations')}\nHabits: ${v59Count('habits')}\nDebts: ${v59Count('debts')}`;
    navigator.clipboard?.writeText(txt).then(()=>v59Toast('Диагностика скопирована')).catch(()=>v59Toast(txt));
  }
  async function v59ClearRuntimeCache(){
    try{if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations(); for(const r of regs) await r.unregister();} if('caches' in window){const keys=await caches.keys(); for(const k of keys) await caches.delete(k);} v59Toast('Кэш очищен')}catch(e){v59Toast('Не удалось очистить кэш')}
  }

  window.addEventListener('click',function(e){
    const el=e.target.closest&&e.target.closest('[data-v59-action]'); if(!el) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const a=el.dataset.v59Action;
    if(a==='coach') return v59OpenCoach();
    if(a==='coachClose') return v59CloseCoach();
    if(a==='backup') return v59Backup();
    if(a==='dayPlan') return v59DayPlan();
    if(a==='debtPlan') return v59DebtPlan();
    if(a==='focusPlan') return v59FocusPlan();
    if(a==='copyHealth') return v59CopyHealth();
    if(a==='clearRuntimeCache') return v59ClearRuntimeCache();
  },true);

  try{layout=v59Layout; renderShell=v59RenderShell; render=v59Render; v59Styles(); render();}catch(e){console.error('[V59 init]',e)}
})();
