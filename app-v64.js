'use strict';
const APP_NAME='Second Brain OS';
const BUILD='second-brain-space-v32-buttons-root-cause-fix-20260701';
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
    googleEvent:()=>googleEventV31(act)
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
