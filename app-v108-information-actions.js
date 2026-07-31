/* Second Brain OS V108 — planner purchases, Polina quick entry and branded icons. */
'use strict';
(() => {
  const BUILD = window.SecondBrainBuild || { id: 'second-brain-os-v108-information-actions-20260731-r1', label: 'V108 · INFORMATION ACTIONS' };
  const OWNED_ROUTES = new Set(['information','people','notes','ideas','personal','learning','planner']);
  const DETAIL_PREFIXES = ['person-','note-','idea-','memory-','learning-item-','plan-'];
  const RELATION_TYPES = {
    related: 'Связано', created_from: 'Создано из', supports: 'Поддерживает', belongs_to: 'Относится к',
    mentions: 'Упоминает', participant: 'Участник', next_action: 'Следующее действие', source: 'Источник',
    result: 'Результат', inspired_by: 'Вдохновлено'
  };
  const ENTITY = {
    people: {collection:'people', label:'Человек', icon:'people', tone:'violet', title:item=>item?.name||'Без имени', route:item=>`person-${item.id}`},
    notes: {collection:'notes', label:'Заметка', icon:'notes', tone:'blue', title:item=>item?.title||'Без названия', route:item=>`note-${item.id}`},
    ideas: {collection:'ideas', label:'Идея', icon:'ideas', tone:'amber', title:item=>item?.title||'Без названия', route:item=>`idea-${item.id}`},
    goals: {collection:'goals', label:'Цель', icon:'target', tone:'blue', title:item=>item?.title||'Цель', route:item=>`goal-${item.id}`},
    tasks: {collection:'tasks', label:'Задача', icon:'check', tone:'mint', title:item=>item?.title||'Задача', route:()=>`tasks`},
    plans: {collection:'lifePlans', label:'План', icon:'planner', tone:'coral', title:item=>item?.title||'План', route:item=>`plan-${item.id}`},
    learning: {collection:'learningMaterials', label:'Обучение', icon:'learning', tone:'violet', title:item=>item?.title||'Материал', route:item=>`learning-item-${item.id}`},
    personal: {collection:'personal', label:'Воспоминание', icon:'memory', tone:'indigo', title:item=>item?.title||'Воспоминание', route:item=>`memory-${item.id}`},
    trips: {collection:'trips', label:'Поездка', icon:'trips', tone:'cyan', title:item=>item?.title||item?.name||'Поездка', route:()=>`trips`},
    documents: {collection:'documents', label:'Документ', icon:'documents', tone:'slate', title:item=>item?.title||item?.name||'Документ', route:()=>`documents`}
  };
  const ICON_SVGS = {
    people:'<circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="2.5"/><path d="M3.5 20c.5-4 2.4-6 5.5-6s5 2 5.5 6M13 15c3.7-.6 6.1 1.1 7 5"/>',
    notes:'<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6M9 19h4"/>',
    ideas:'<path d="M9 18h6M10 21h4"/><path d="M8.4 14.6A6 6 0 1 1 15.6 14.6c-1 .8-1.6 1.8-1.6 3.4h-4c0-1.6-.6-2.6-1.6-3.4z"/>',
    wishes:'<path d="M12 21S4 16.3 4 9.6A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8 3.6C20 16.3 12 21 12 21z"/>',
    trips:'<path d="m3 11 18-7-7 18-3.5-7.5z"/><path d="m10.5 14.5 4-4"/>',
    memory:'<path d="M12 3l2.2 5.1L20 10l-5.8 1.9L12 17l-2.2-5.1L4 10l5.8-1.9z"/><path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z"/>',
    learning:'<path d="m3 9 9-5 9 5-9 5z"/><path d="M7 12v5c3 2 7 2 10 0v-5M21 9v7"/>',
    planner:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    polina:'<circle cx="12" cy="12" r="2.2"/><path d="M12 9c-4-5-7-1-4 2-5-1-5 4-1 4-2 4 3 6 5 2 2 4 7 2 5-2 4 0 4-5-1-4 3-3 0-7-4-2z"/>',
    books:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23z"/>',
    films:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M16 3v18M4 8h4M4 16h4M16 8h4M16 16h4"/>',
    documents:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>',
    passwords:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    inbox:'<path d="M4 5h16v14H4z"/><path d="M4 14h4l2 3h4l2-3h4M12 4v8M9 9l3 3 3-3"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    purchases:'<path d="M5 8h14l-1 13H6zM9 8a3 3 0 0 1 6 0"/>',
    edit:'<path d="m4 20 4.5-1 10-10-3.5-3.5-10 10zM14 6l3.5 3.5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>'
  };
  function appIcon(name,tone='violet',extra=''){
    const body=ICON_SVGS[name]||ICON_SVGS.memory;
    return `<span class="v108-app-icon tone-${esc(tone)} ${esc(extra)}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${body}</svg></span>`;
  }
  const INFO_FOLDERS = {
    people:['people','violet'],notes:['notes','blue'],ideas:['ideas','amber'],wishes:['wishes','pink'],trips:['trips','cyan'],personal:['memory','indigo'],learning:['learning','violet'],planner:['planner','coral'],polina:['polina','pink'],books:['books','orange'],films:['films','magenta'],documents:['documents','slate'],passwords:['passwords','violet'],inbox:['inbox','blue']
  };
  let pendingLinkSource = null;
  const PLAN_BLOCKS = {
    checklist:'Чек-лист', tasks:'Задачи', purchases:'Покупки', budget:'Бюджет', participants:'Участники',
    calendar:'Календарь', documents:'Документы', links:'Ссылки', route:'Маршрут', bookings:'Бронирования',
    options:'Варианты', comparison:'Сравнение', risks:'Риски', notes:'Заметки', outcome:'Итог'
  };
  const uid = () => globalThis.crypto?.randomUUID?.() || `v107-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
  const today = () => new Date().toISOString().slice(0,10);
  const nowIso = () => new Date().toISOString();
  const clean = value => String(value ?? '').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const nl = value => esc(value).replace(/\n/g,'<br>');
  const num = value => { const parsed=Number(String(value??'').replace(/\s/g,'').replace(',','.')); return Number.isFinite(parsed)?parsed:0; };
  const money = value => `${num(value).toLocaleString('ru-RU',{maximumFractionDigits:2})} ₽`;
  const safeExternalUrl = value => { try { const url=new URL(clean(value),location.href); return ['http:','https:'].includes(url.protocol)?url.href:''; } catch (_) { return ''; } };
  const safeImageUrl = value => { const raw=clean(value); if(/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(raw))return raw; return safeExternalUrl(raw); };
  const list = value => Array.isArray(value) ? value : clean(value).split(/[\n,;]+/).map(clean).filter(Boolean);
  const routeNow = () => decodeURIComponent((location.hash||'#today').replace(/^#/,'').split('?')[0]||'today');
  const stateNow = () => window.SecondBrainApp?.getState?.() || window.state || null;
  const arr = (state,key) => Array.isArray(state?.[key]) ? state[key] : [];
  const formatDate = value => value ? new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}) : '—';
  const formatShort = value => value ? new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}) : '—';
  const plural = (n, one, few, many) => { const x=Math.abs(n)%100,y=x%10; return x>10&&x<20?many:y>1&&y<5?few:y===1?one:many; };
  const toast = message => window.SecondBrainApp?.toast?.(message);
  const renderBase = () => window.V85Premium?.render?.() || window.SecondBrainApp?.render?.();
  const navigate = route => {
    closeModal();
    const next=String(route||'information');
    if(routeNow()===next){ scheduleRender(true); return; }
    try { history.pushState(null,'',`#${encodeURIComponent(next)}`); } catch (_) { location.hash=next; }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    setTimeout(()=>scheduleRender(true),20);
  };

  function normalizeItem(item, defaults) {
    const target = item && typeof item==='object' ? item : {};
    Object.entries(defaults).forEach(([key,value]) => {
      if (target[key] === undefined || target[key] === null) target[key] = Array.isArray(value)?[]:value;
      if (Array.isArray(value) && !Array.isArray(target[key])) target[key]=list(target[key]);
    });
    target.id=clean(target.id)||uid();
    target.updatedAt=target.updatedAt||target.createdAt||nowIso();
    target.createdAt=target.createdAt||target.updatedAt;
    return target;
  }

  function ensureData() {
    const state=stateNow(); if(!state)return null;
    state.settings=state.settings&&typeof state.settings==='object'?state.settings:{};
    state.settings.v107=Object.assign({version:2,memoryView:'timeline',polinaPrivate:true,hidePolinaFromHome:false,excludePolinaCloud:false,confirmPolinaExport:true},state.settings.v107||{});
    state.knowledgeLinks=arr(state,'knowledgeLinks').filter(Boolean).map(link=>normalizeItem(link,{sourceType:'',sourceId:'',targetType:'',targetId:'',relationType:'related'}));
    state.learningMaterials=arr(state,'learningMaterials').filter(Boolean).map(item=>normalizeItem(item,{title:'',type:'video',url:'',author:'',channel:'',topic:'',duration:'',dateStart:'',dateCompleted:'',status:'planned',summary:'',keyPoints:[],terms:[],quotes:[],conclusion:'',applyWhere:'',practiceAction:'',utility:0,reviewDate:'',appliedResult:''}));
    state.lifePlans=arr(state,'lifePlans').filter(Boolean).map(item=>{
      const plan=normalizeItem(item,{title:'',type:'blank',why:'',outcome:'',due:'',status:'planned',priority:'medium',budget:0,actualSpend:0,participants:[],documents:[],externalLinks:[],notes:'',risks:'',nextAction:'',blocks:[],archivedBlocks:[]});
      plan.blocks=Array.isArray(plan.blocks)?plan.blocks:[];
      plan.blocks.forEach(block=>{
        block.id=clean(block.id)||uid(); block.items=Array.isArray(block.items)?block.items:[];
        if(block.type==='purchases') block.items=block.items.map(raw=>Object.assign({},raw,{id:clean(raw?.id)||uid(),title:clean(raw?.title||raw?.text)||'Покупка',category:clean(raw?.category)||'other',plannedBudget:num(raw?.plannedBudget??raw?.amount),actualAmount:num(raw?.actualAmount),due:clean(raw?.due),priority:clean(raw?.priority)||'medium',status:clean(raw?.status)||(raw?.done?'purchased':'planned'),note:clean(raw?.note),url:clean(raw?.url),done:Boolean(raw?.done||raw?.status==='purchased'),createdAt:raw?.createdAt||nowIso(),updatedAt:raw?.updatedAt||raw?.createdAt||nowIso()}));
      });
      return plan;
    });
    state.people=arr(state,'people').filter(Boolean).map(item=>normalizeItem(item,{name:'',avatar:item?.avatar||item?.photo||'',role:item?.role||item?.relation||'',category:'friend',city:'',timezone:'',phone:'',email:'',telegram:'',birthday:'',metDate:'',closeness:'',lastContact:'',contactFrequency:'',nextContact:'',currentContext:'',interests:[],favorites:[],giftIdeas:[],joy:'',avoid:'',importantFacts:'',promisesMine:[],promisesTheirs:[],note:item?.note||item?.about||'',timeline:[]}));
    state.notes=arr(state,'notes').filter(Boolean).map(item=>normalizeItem(item,{title:'',folder:'Личное',date:item?.date||today(),text:item?.text||item?.note||'',noteType:'thought',tags:[],source:'',mainInsight:'',importance:'',nextAction:'',reviewDate:'',pinned:false,status:'active'}));
    state.ideas=arr(state,'ideas').filter(Boolean).map(item=>normalizeItem(item,{title:'',description:item?.description||item?.text||item?.note||'',problem:'',audience:'',origin:'',expectedResult:'',changeAfter:'',experiment:'',resources:'',budget:0,timeRequired:'',risks:'',obstacles:'',status:'inbox',scores:{benefit:0,interest:0,effort:0,urgency:0}}));
    state.personal=arr(state,'personal').filter(Boolean).map(item=>normalizeItem(item,{title:'',memoryType:'moment',date:item?.date||'',period:'',place:'',participants:[],description:item?.description||item?.text||item?.note||'',emotions:'',importance:'',lesson:'',preserve:'',quote:'',imageUrl:item?.imageUrl||item?.photo||'',videoUrl:'',audioUrl:'',privacy:'private'}));
    state.polinaDays=arr(state,'polinaDays').filter(Boolean).map(item=>normalizeItem(item,{date:item?.date||today(),status:'',comment:'',periodMarker:'',mood:'',energy:0,discomfort:0,sleep:'',stress:0,symptoms:[],helped:'',notHelped:'',supportNeeded:'',request:'',plans:'',reminder:''}));
    state.schemaVersion=Math.max(2,num(state.schemaVersion));
    window.state=state;
    return state;
  }

  function persist(message='Сохранено', rerender=true) {
    const state=ensureData(); if(!state)return;
    state.settings.v107.updatedAt=nowIso();
    window.save?.();
    if(message)toast(message);
    if(rerender){ renderBase(); setTimeout(()=>scheduleRender(true),30); }
  }

  function openModal(title, html, wide=false) {
    const modal=document.getElementById('modal'); if(!modal)return;
    const card=modal.querySelector('.modal-card');
    modal.querySelector('#modalTitle').textContent=title||'Окно';
    modal.querySelector('#modalBody').innerHTML=html||'';
    card?.classList.toggle('v107-modal-wide',Boolean(wide));
    modal.classList.add('show');
    document.body.classList.add('v107-modal-open');
    setTimeout(()=>modal.querySelector('input:not([type="hidden"]),textarea,select,button')?.focus?.({preventScroll:true}),30);
  }
  function closeModal(){
    const modal=document.getElementById('modal');
    modal?.classList.remove('show');
    modal?.querySelector('.modal-card')?.classList.remove('v107-modal-wide');
    document.body.classList.remove('v107-modal-open');
  }

  function entityItems(type) { const state=ensureData(), meta=ENTITY[type]; return meta?arr(state,meta.collection):[]; }
  function entityBy(type,id){ return entityItems(type).find(item=>String(item.id)===String(id))||null; }
  function entityTitle(type,id){ const meta=ENTITY[type],item=entityBy(type,id); return item&&meta?meta.title(item):'Запись не найдена'; }
  function entityRoute(type,id){ const meta=ENTITY[type],item=entityBy(type,id); return item&&meta?meta.route(item):({goals:'goals',tasks:'tasks',trips:'trips',documents:'documents'}[type]||'information'); }
  function outgoing(type,id){ return arr(ensureData(),'knowledgeLinks').filter(link=>link.sourceType===type&&link.sourceId===id); }
  function incoming(type,id){ return arr(ensureData(),'knowledgeLinks').filter(link=>link.targetType===type&&link.targetId===id); }
  function linksFor(type,id){ return [...outgoing(type,id),...incoming(type,id)]; }
  function linkedCount(type,id){ return linksFor(type,id).length; }
  function removeEntityLinks(type,id){ const state=ensureData(); state.knowledgeLinks=state.knowledgeLinks.filter(link=>!(link.sourceType===type&&link.sourceId===id)&&!(link.targetType===type&&link.targetId===id)); }

  function field(label,id,value='',type='text',attrs='') {
    if(type==='textarea')return `<label class="v107-field"><span>${esc(label)}</span><textarea id="${id}" ${attrs}>${esc(value)}</textarea></label>`;
    if(type==='select')return `<label class="v107-field"><span>${esc(label)}</span><select id="${id}" ${attrs}>${value}</select></label>`;
    return `<label class="v107-field"><span>${esc(label)}</span><input id="${id}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  }
  const options = (pairs,current) => pairs.map(([value,label])=>`<option value="${esc(value)}" ${String(current)===String(value)?'selected':''}>${esc(label)}</option>`).join('');
  const chips = values => list(values).map(value=>`<span>${esc(value)}</span>`).join('');
  const empty = text => `<div class="v107-empty"><i>✦</i><p>${esc(text)}</p></div>`;
  const backButton = () => `<button class="v78-back" data-v107-info-route="information" type="button">← Информация</button>`;
  const pageHead = (kicker,title,text,actions='') => `<header class="v78-page-head v107-page-head"><div>${backButton()}<span>${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(text)}</p></div><div class="v107-head-actions">${actions}</div></header>`;

  function smartAssistant(title,text,actions=[]) {
    return `<aside class="v107-assistant"><i>✦</i><div><small>AI-ПОДСКАЗЧИК</small><h3>${esc(title)}</h3><p>${esc(text)}</p>${actions.length?`<div>${actions.map(action=>`<button type="button" ${action.route?`data-v107-info-route="${esc(action.route)}"`:`data-v107-action="${esc(action.action)}"`} ${action.data||''}>${esc(action.label)}</button>`).join('')}</div>`:''}</div></aside>`;
  }

  function informationPage() {
    const state=ensureData();
    const folders=[
      ['people','Люди','Отношения, контакты и важный контекст',state.people.length],
      ['notes','Заметки','Мысли, решения, выводы и действия',state.notes.length],
      ['ideas','Идеи','Задумки, эксперименты и будущие проекты',state.ideas.length],
      ['wishes','Желания','Бюджет, ссылки и приоритеты',arr(state,'wishes').length],
      ['trips','Путешествия','Поездки, бронирования и маршруты',arr(state,'trips').length],
      ['personal','Личная память','События, эмоции и история жизни',state.personal.length],
      ['learning','Обучение','Видео, курсы, саммари и практика',state.learningMaterials.length],
      ['planner','Планер','Покупки, поездки и любые ситуации',state.lifePlans.length],
      ['polina','Состояние Полины','Бережный календарь состояния и поддержки',state.polinaDays.length],
      ['books','Книги','Книги, цитаты и прогресс чтения',arr(state,'books').length],
      ['films','Фильмы','Список фильмов и впечатления',arr(state,'films').length],
      ['documents','Документы','Важные файлы и ссылки',arr(state,'documents').length],
      ['passwords','Пароли','Защищённые доступы',0],
      ['inbox','Входящие','Записи, которые ждут решения',arr(state,'inbox').length]
    ];
    const stale=state.people.filter(person=>person.lastContact&&((Date.now()-new Date(`${person.lastContact}T12:00:00`))/86400000)>45).length;
    const practice=state.learningMaterials.filter(item=>item.status==='completed'&&!clean(item.appliedResult)).length;
    return `<section class="v78-page v107-page"><header class="v78-page-head v107-page-head"><div><span>Связанная база знаний</span><h1>Информация</h1><p>Сохраняйте контекст, связывайте записи только когда это полезно и превращайте знания в действия.</p></div><div class="v107-head-actions"><button class="v78-secondary" data-v107-action="open-global-search" type="button">⌕ Найти</button><button class="v78-primary" data-v107-action="open-quick-create" type="button">＋ Добавить</button></div></header>
      <section class="v107-info-grid">${folders.map(([route,title,text,count])=>{const [icon,tone]=INFO_FOLDERS[route]||['memory','violet'];return `<button class="v107-folder" data-v107-info-route="${route}" type="button">${appIcon(icon,tone)}<span><b>${esc(title)}</b><small>${esc(text)}</small></span><em>${count||'—'}</em><u>›</u></button>`;}).join('')}</section>
      ${smartAssistant('База знаний становится полезнее через действия',practice?`${practice} ${plural(practice,'материал изучен','материала изучены','материалов изучены')}, но применение пока не зафиксировано.`:stale?`${stale} ${plural(stale,'человек давно без контакта','человека давно без контакта','людей давно без контакта')}.`:'Добавьте одну осмысленную связь или превратите заметку в задачу — только если это действительно нужно.',[
        practice?{route:'learning',label:'Открыть обучение'}:stale?{route:'people',label:'Проверить людей'}:{route:'notes',label:'Открыть заметки'}
      ])}
    </section>`;
  }

  function peoplePage() {
    const state=ensureData();
    const people=state.people.slice().sort((a,b)=>clean(a.name).localeCompare(clean(b.name),'ru'));
    const upcoming=people.filter(p=>p.birthday).map(p=>({p,days:daysUntil(p.birthday)})).filter(x=>x.days>=0&&x.days<=45).sort((a,b)=>a.days-b.days);
    const duePromises=people.flatMap(p=>list(p.promisesMine).map(text=>({person:p,text}))).slice(0,6);
    return `<section class="v78-page v107-page">${pageHead('Личные связи','Люди','Контакты, отношения, обещания, подарки и хронология общения.',`<button class="v78-primary" data-v107-action="edit-person" type="button">＋ Добавить человека</button>`)}
      ${upcoming.length?`<section class="v107-strip"><header><div><small>БЛИЖАЙШИЕ ДАТЫ</small><h2>Дни рождения</h2></div></header><div>${upcoming.slice(0,6).map(({p,days})=>`<button data-v107-info-route="person-${p.id}" type="button"><i>${avatar(p)}</i><span><b>${esc(p.name)}</b><small>${days===0?'сегодня':days===1?'завтра':`через ${days} дн.`}</small></span></button>`).join('')}</div></section>`:''}
      <section class="v107-card-grid">${people.map(person=>personCard(person)).join('')||empty('Добавьте первого человека — все дополнительные поля можно оставить пустыми.')}</section>
      ${smartAssistant(duePromises.length?'Есть обещания, которые стоит проверить':'Контекст отношений под контролем',duePromises.length?`Зафиксировано ${duePromises.length} обещаний с вашей стороны. Проверьте, что из этого ещё актуально.`:'Добавляйте следующий контакт и важные факты только для тех людей, где это действительно помогает.',duePromises.length?[{route:`person-${duePromises[0].person.id}`,label:'Открыть анкету'}]:[])}
    </section>`;
  }

  function daysUntil(date) {
    if(!date)return 999;
    const source=new Date(`${date}T12:00:00`),now=new Date();
    let next=new Date(now.getFullYear(),source.getMonth(),source.getDate(),12);
    if(next<new Date(now.getFullYear(),now.getMonth(),now.getDate(),12))next.setFullYear(next.getFullYear()+1);
    return Math.ceil((next-now)/86400000);
  }
  function avatar(person){
    const url=safeImageUrl(person.avatar||person.photo||''),initial=(person.name||'?').slice(0,1).toUpperCase();
    if(url)return `<img src="${esc(url)}" alt="" loading="lazy" data-v107-avatar-fallback="${esc(initial)}">`;
    return esc(initial);
  }
  function personCard(person){
    const next=person.nextContact?formatShort(person.nextContact):'не запланирован';
    return `<article class="v107-record-card"><button class="v107-card-open" data-v107-info-route="person-${person.id}" type="button"><span class="v107-avatar">${avatar(person)}</span><span><small>${esc(person.role||person.category||'Человек')}</small><h2>${esc(person.name||'Без имени')}</h2><p>${esc(person.currentContext||person.note||'Добавьте важный контекст об этом человеке.')}</p></span><em>›</em></button><footer><span>Следующий контакт: <b>${esc(next)}</b></span><span>${linkedCount('people',person.id)} связей</span><button data-v107-action="edit-person" data-id="${person.id}" type="button">Изменить</button></footer></article>`;
  }

  function personDetail(id) {
    const person=entityBy('people',id); if(!person)return missingPage('Человек не найден','people');
    const timeline=Array.isArray(person.timeline)?person.timeline.slice().sort((a,b)=>String(b.date||b.createdAt).localeCompare(String(a.date||a.createdAt))):[];
    return `<section class="v78-page v107-page"><header class="v107-detail-head"><div><button class="v78-back" data-v107-info-route="people" type="button">← Люди</button><div class="v107-person-title"><span class="v107-avatar large">${avatar(person)}</span><div><small>${esc(person.role||person.category||'Человек')}</small><h1>${esc(person.name)}</h1><p>${esc(person.currentContext||person.note||'Контекст пока не заполнен.')}</p></div></div></div><div class="v107-head-actions"><button class="v78-secondary" data-v107-action="add-person-event" data-id="${id}" type="button">＋ Событие</button><button class="v78-primary" data-v107-action="edit-person" data-id="${id}" type="button">Редактировать</button></div></header>
      <section class="v107-detail-grid"><div>
        <article class="v107-panel"><header><h2>Контакт и отношения</h2></header><div class="v107-facts">${fact('Категория',person.category)}${fact('Город',person.city)}${fact('Часовой пояс',person.timezone)}${fact('Дата знакомства',formatDate(person.metDate))}${fact('Последнее общение',formatDate(person.lastContact))}${fact('Следующий контакт',formatDate(person.nextContact))}${fact('Желаемая частота',person.contactFrequency)}</div><div class="v107-contact-actions">${person.phone?`<a href="tel:${esc(person.phone)}">Позвонить</a>`:''}${person.email?`<a href="mailto:${esc(person.email)}">Написать email</a>`:''}${person.telegram?`<a href="https://t.me/${esc(person.telegram.replace(/^@/,''))}" target="_blank" rel="noopener">Telegram</a>`:''}<button data-v107-action="create-person-reminder" data-id="${id}" type="button">Напомнить связаться</button></div></article>
        <article class="v107-panel"><header><h2>Что важно помнить</h2></header>${tagGroup('Интересы',person.interests)}${tagGroup('Любимые вещи',person.favorites)}${textGroup('Что радует',person.joy)}${textGroup('Что лучше не предлагать',person.avoid)}${textGroup('Важные факты',person.importantFacts)}${tagGroup('Идеи подарков',person.giftIdeas)}</article>
        <article class="v107-panel"><header><h2>Обещания</h2></header><div class="v107-two-list"><div><small>МОИ ОБЕЩАНИЯ</small>${list(person.promisesMine).map(x=>`<p>• ${esc(x)}</p>`).join('')||'<p class="muted">Нет записей</p>'}</div><div><small>ОБЕЩАНИЯ ЧЕЛОВЕКА</small>${list(person.promisesTheirs).map(x=>`<p>• ${esc(x)}</p>`).join('')||'<p class="muted">Нет записей</p>'}</div></div></article>
        <article class="v107-panel"><header><div><h2>Хронология</h2><p>Важные события и контекст общения.</p></div><button data-v107-action="add-person-event" data-id="${id}" type="button">＋ Добавить</button></header><div class="v107-timeline">${timeline.map(item=>`<div><i></i><span><small>${formatDate(item.date||item.createdAt)}</small><b>${esc(item.title||'Событие')}</b><p>${esc(item.note||'')}</p></span><button data-v107-action="delete-person-event" data-person="${id}" data-event="${item.id}" type="button">×</button></div>`).join('')||empty('Хронология пока пустая.')}</div></article>
      </div><aside>${relationsPanel('people',id)}${smartAssistant(person.nextContact?'Следующий контакт уже запланирован':'Добавьте мягкий следующий шаг',person.nextContact?`Напоминание стоит на ${formatDate(person.nextContact)}. Перед разговором просмотрите важные факты и обещания.`:'Поле необязательное. Используйте его только для отношений, которые важно поддерживать осознанно.',[{action:'create-person-reminder',label:'Создать напоминание',data:`data-id="${id}"`}])}<button class="v107-danger" data-v107-action="delete-entity" data-type="people" data-id="${id}" type="button">Удалить анкету</button></aside></section>
    </section>`;
  }

  function fact(label,value){ if(!clean(value)||value==='—')return''; return `<div><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
  function tagGroup(label,values){ const valuesList=list(values); return `<div class="v107-group"><small>${esc(label)}</small>${valuesList.length?`<div class="v107-chips">${chips(valuesList)}</div>`:'<p class="muted">Не заполнено</p>'}</div>`; }
  function textGroup(label,value){ return `<div class="v107-group"><small>${esc(label)}</small><p>${clean(value)?nl(value):'<span class="muted">Не заполнено</span>'}</p></div>`; }

  function notesPage(){
    const state=ensureData(),items=state.notes.slice().sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||String(b.updatedAt||b.date).localeCompare(String(a.updatedAt||a.date)));
    return recordListPage('Заметки','Мысли, решения и знания, которые можно превратить в действие.','note',items,item=>({title:item.title,subtitle:`${noteTypeLabel(item.noteType)} · ${item.folder||'Без папки'}`,text:item.mainInsight||item.text||'Без текста',status:item.status,badge:item.reviewDate?`Повторить ${formatShort(item.reviewDate)}`:'',route:`note-${item.id}`}),'edit-note');
  }
  function ideasPage(){
    const state=ensureData(),items=state.ideas.slice().sort((a,b)=>ideaPriority(b)-ideaPriority(a));
    return recordListPage('Идеи','Оценивайте ценность, проверяйте гипотезы и запускайте маленькие эксперименты.','idea',items,item=>({title:item.title,subtitle:ideaStatusLabel(item.status),text:item.problem||item.description||'Добавьте проблему, которую решает идея.',status:item.status,badge:`Оценка ${ideaPriority(item)}/20`,route:`idea-${item.id}`}),'edit-idea');
  }
  function personalPage(){
    const state=ensureData(),items=state.personal.slice().sort((a,b)=>String(b.date||b.createdAt).localeCompare(String(a.date||a.createdAt))),view=state.settings.v107.memoryView||'timeline';
    return `<section class="v78-page v107-page">${pageHead('История жизни','Личная память','События, эмоции и смыслы — не копия обычных заметок.',`<div class="v107-view-toggle"><button class="${view==='timeline'?'active':''}" data-v107-action="memory-view" data-view="timeline">Лента</button><button class="${view==='gallery'?'active':''}" data-v107-action="memory-view" data-view="gallery">Галерея</button></div><button class="v78-primary" data-v107-action="edit-memory">＋ Воспоминание</button>`)}
      <section class="${view==='gallery'?'v107-memory-gallery':'v107-memory-timeline'}">${items.map(memoryCard).join('')||empty('Добавьте первое воспоминание: событие, эмоцию и то, почему оно важно.')}</section>
      ${smartAssistant(items.length?'Сохранённые моменты складываются в историю':'Начните с одного важного момента',items.length?`У вас ${items.length} ${plural(items.length,'воспоминание','воспоминания','воспоминаний')}. Дополняйте только те записи, где хочется сохранить смысл, людей или фотографию.`:'Подойдёт достижение, путешествие, смешной случай или важный момент с Полиной.')}
    </section>`;
  }
  function learningPage(){
    const state=ensureData(),items=state.learningMaterials.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return recordListPage('Обучение','Видео, курсы, статьи и саммари с обязательным вопросом: что применено?','learning',items,item=>({title:item.title,subtitle:`${learningTypeLabel(item.type)} · ${learningStatusLabel(item.status)}`,text:item.conclusion||item.summary||'Добавьте главный вывод.',status:item.status,badge:item.reviewDate?`Повторить ${formatShort(item.reviewDate)}`:'',route:`learning-item-${item.id}`}),'edit-learning');
  }
  function plannerPage(){
    const state=ensureData(),items=state.lifePlans.slice().sort((a,b)=>Number(a.status==='done')-Number(b.status==='done')||String(a.due||'9999').localeCompare(String(b.due||'9999')));
    return recordListPage('Планер','Конструктор покупки, поездки, события или любой сложной ситуации.','plan',items,item=>({title:item.title,subtitle:`${planTypeLabel(item.type)} · ${planStatusLabel(item.status)}`,text:item.nextAction||item.outcome||item.why||'Добавьте ожидаемый результат и следующий шаг.',status:item.status,badge:item.budget?money(item.budget):'',route:`plan-${item.id}`}),'edit-plan');
  }

  function recordListPage(title,text,type,items,mapper,action){
    const emptyText={note:'Создайте первую заметку. Связи и дополнительные поля необязательны.',idea:'Зафиксируйте идею и добавьте только те детали, которые помогают решить, что делать дальше.',learning:'Добавьте видео, курс или статью и зафиксируйте практический вывод.',plan:'Создайте первый план из шаблона или начните с пустого конструктора.'}[type]||'Пока пусто.';
    return `<section class="v78-page v107-page">${pageHead('Информация',title,text,`<button class="v78-primary" data-v107-action="${action}" type="button">＋ Добавить</button>`)}<div class="v107-list-toolbar"><label><span>⌕</span><input data-v107-filter-input placeholder="Поиск по разделу"></label><select data-v107-status-filter><option value="">Все статусы</option><option value="active">Активные</option><option value="planned">Запланировано</option><option value="done">Завершено</option><option value="archive">Архив</option></select></div><section class="v107-card-grid v107-filter-grid">${items.map(item=>recordCard(type,item,mapper(item))).join('')||empty(emptyText)}</section>${smartAssistant(title==='Обучение'?'Знание считается усвоенным после применения':title==='Идеи'?'Проверяйте идею маленьким экспериментом':title==='Заметки'?'Полезная заметка ведёт к решению':'Сложный план становится легче после следующего шага',title==='Обучение'?'Зафиксируйте, что вы сделали после просмотра. Если ничего — создайте одну практическую задачу.':title==='Идеи'?'Не обязательно превращать каждую идею в проект. Отложить или отклонить — тоже нормальное решение.':title==='Заметки'?'Связи необязательны. Добавляйте цель, человека или задачу только когда они дают контекст.':'Используйте только нужные блоки конструктора; остальные можно не добавлять.')}</section>`;
  }
  function recordCard(type,item,model){
    return `<article class="v107-record-card" data-v107-filter-card data-status="${esc(model.status||'')}"><button class="v107-card-open" data-v107-info-route="${esc(model.route)}" type="button">${appIcon(ENTITY[type]?.icon||'memory',ENTITY[type]?.tone||'violet','v107-record-icon')}<span><small>${esc(model.subtitle||'')}</small><h2>${esc(model.title||'Без названия')}</h2><p>${esc(String(model.text||'').slice(0,260))}</p><div class="v107-card-meta">${model.badge?`<b>${esc(model.badge)}</b>`:''}<em>${linkedCount(type,item.id)} связей</em></div></span><u>›</u></button></article>`;
  }
  function memoryCard(item){
    const photo=safeImageUrl(item.imageUrl); return `<article class="v107-memory-card"><button data-v107-info-route="memory-${item.id}" type="button">${photo?`<img src="${esc(photo)}" alt="" loading="lazy" data-v107-memory-image>`:`<div class="v107-memory-fallback">◇</div>`}<span><small>${esc(memoryTypeLabel(item.memoryType))} · ${formatDate(item.date)}</small><h2>${esc(item.title||'Воспоминание')}</h2><p>${esc(item.importance||item.description||'')}</p><em>${linkedCount('personal',item.id)} связей</em></span></button></article>`;
  }

  function noteDetail(id){
    const item=entityBy('notes',id); if(!item)return missingPage('Заметка не найдена','notes');
    return detailShell('notes',id,'notes','Заметка',item.title,`${noteTypeLabel(item.noteType)} · ${item.folder||'Без папки'}`,`<article class="v107-panel v107-note-body"><header><div><small>${formatDate(item.date)}</small><h2>${esc(item.mainInsight||'Содержание')}</h2></div>${item.pinned?'<span class="v107-badge">Закреплено</span>':''}</header><div class="v107-prose">${nl(item.text||'Без текста')}</div>${textGroup('Главный вывод',item.mainInsight)}${textGroup('Почему это важно',item.importance)}${textGroup('Следующий шаг',item.nextAction)}${tagGroup('Теги',item.tags)}${safeExternalUrl(item.source)?`<p><a href="${esc(safeExternalUrl(item.source))}" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a></p>`:''}</article>`,[
      {label:'Редактировать',action:'edit-note',primary:true},{label:'Создать задачу',action:'note-to-task'},{label:'Добавить связь',action:'open-link'}
    ],smartAssistant(item.nextAction?'Следующий шаг уже сформулирован':'Заметке можно дать действие',item.nextAction?item.nextAction:'Это необязательно. Создайте задачу только когда заметка действительно требует действия.'));
  }
  function ideaDetail(id){
    const item=entityBy('ideas',id); if(!item)return missingPage('Идея не найдена','ideas');
    const priority=ideaPriority(item),advice=priority>=14?'Сильный кандидат на маленький тест.':priority>=9?'Идею стоит уточнить перед запуском.':'Можно спокойно оставить на потом или отклонить.';
    const score=item.scores||{};
    return detailShell('ideas',id,'ideas','Идея',item.title,ideaStatusLabel(item.status),`<article class="v107-panel"><header><h2>Смысл идеи</h2><span class="v107-score">${priority}/20</span></header>${textGroup('Описание',item.description)}${textGroup('Какую проблему решает',item.problem)}${textGroup('Кому полезна',item.audience)}${textGroup('Ожидаемый результат',item.expectedResult)}${textGroup('Что изменится',item.changeAfter)}</article><article class="v107-panel"><header><h2>Проверка</h2></header>${textGroup('Первый эксперимент',item.experiment)}${textGroup('Ресурсы',item.resources)}${fact('Бюджет',item.budget?money(item.budget):'')}${fact('Время',item.timeRequired)}${textGroup('Риски',item.risks)}${textGroup('Препятствия',item.obstacles)}<div class="v107-score-grid">${[['Польза',score.benefit],['Интерес',score.interest],['Трудозатраты',score.effort],['Срочность',score.urgency]].map(([x,v])=>`<div><small>${x}</small><b>${num(v)||'—'}/5</b></div>`).join('')}</div></article>`,[
      {label:'Редактировать',action:'edit-idea',primary:true},{label:'Создать эксперимент',action:'idea-to-task'},{label:'Создать цель',action:'idea-to-goal'},{label:'Добавить в план',action:'idea-to-plan'},{label:'Добавить связь',action:'open-link'}
    ],smartAssistant('Оценка идеи',advice));
  }
  function memoryDetail(id){
    const item=entityBy('personal',id); if(!item)return missingPage('Воспоминание не найдено','personal');
    return detailShell('personal',id,'personal','Воспоминание',item.title,`${memoryTypeLabel(item.memoryType)} · ${formatDate(item.date)}`,`${safeImageUrl(item.imageUrl)?`<article class="v107-memory-hero"><img src="${esc(safeImageUrl(item.imageUrl))}" alt="${esc(item.title)}" data-v107-memory-image></article>`:''}<article class="v107-panel v107-note-body"><div class="v107-prose">${nl(item.description||'Описание не добавлено')}</div>${textGroup('Эмоции',item.emotions)}${textGroup('Почему это важно',item.importance)}${textGroup('Чему научило',item.lesson)}${textGroup('Что хочется сохранить',item.preserve)}${textGroup('Цитата',item.quote)}${fact('Место',item.place)}${tagGroup('Участники',item.participants)}${fact('Приватность',item.privacy==='private'?'Личное':'Обычная запись')}</article>`,[
      {label:'Редактировать',action:'edit-memory',primary:true},{label:'Добавить связь',action:'open-link'}
    ],smartAssistant('Сохраните смысл, а не только факт',item.importance?'Смысл момента уже зафиксирован. Фотография и связи остаются необязательными.':'Добавьте одну фразу: почему этот момент важно не забыть.'));
  }
  function learningDetail(id){
    const item=entityBy('learning',id); if(!item)return missingPage('Материал не найден','learning');
    return detailShell('learning',id,'learning','Обучение',item.title,`${learningTypeLabel(item.type)} · ${learningStatusLabel(item.status)}`,`<article class="v107-panel"><header><h2>Материал</h2>${safeExternalUrl(item.url)?`<a href="${esc(safeExternalUrl(item.url))}" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a>`:''}</header>${fact('Автор / канал',[item.author,item.channel].filter(Boolean).join(' · '))}${fact('Тема',item.topic)}${fact('Длительность',item.duration)}${textGroup('Саммари',item.summary)}${tagGroup('Главные мысли',item.keyPoints)}${tagGroup('Новые термины',item.terms)}${tagGroup('Цитаты',item.quotes)}</article><article class="v107-panel"><header><h2>Применение</h2></header>${textGroup('Личный вывод',item.conclusion)}${textGroup('Где применить',item.applyWhere)}${textGroup('Практическое действие',item.practiceAction)}${textGroup('Что сделано после обучения',item.appliedResult)}${fact('Полезность',item.utility?`${item.utility}/5`:'')}${fact('Повторить',formatDate(item.reviewDate))}</article>`,[
      {label:'Редактировать',action:'edit-learning',primary:true},{label:'Задача на практику',action:'learning-to-task'},{label:'Повторить через 7 дней',action:'learning-repeat-7'},{label:'Добавить связь',action:'open-link'}
    ],smartAssistant(item.appliedResult?'Материал уже применён':'Просмотр ещё не равен обучению',item.appliedResult?item.appliedResult:'Создайте одно конкретное действие или честно оставьте «пока не применил».'));
  }
  function purchaseBlock(plan,create=false){
    plan.blocks=Array.isArray(plan.blocks)?plan.blocks:[];
    let block=plan.blocks.find(item=>item.type==='purchases');
    if(!block&&create){block={id:uid(),type:'purchases',title:'Список покупок',collapsed:false,items:[]};plan.blocks.unshift(block);}
    return block||null;
  }
  function purchaseItems(plan){return purchaseBlock(plan)?.items||[];}
  function purchaseStatusLabel(value){return ({planned:'Запланировано',searching:'Выбираю',ordered:'Заказано',purchased:'Куплено',paused:'Отложено',cancelled:'Отменено'})[value]||'Запланировано';}
  function purchaseCategoryLabel(value){return ({home:'Дом',tech:'Техника',clothes:'Одежда',travel:'Поездка',gift:'Подарок',food:'Продукты',health:'Здоровье',work:'Работа',other:'Другое'})[value]||'Другое';}
  function purchasePriorityLabel(value){return ({low:'Низкий',medium:'Средний',high:'Высокий',critical:'Критичный'})[value]||'Средний';}
  function purchaseTotals(plan){
    const items=purchaseItems(plan).filter(item=>item.status!=='cancelled');
    const planned=items.reduce((sum,item)=>sum+num(item.plannedBudget??item.amount),0);
    const actual=items.reduce((sum,item)=>sum+num(item.actualAmount),0);
    const purchased=items.filter(item=>item.done||item.status==='purchased').length;
    return {items,planned,actual,remaining:Math.max(0,planned-actual),purchased};
  }
  function purchaseBoard(plan){
    const totals=purchaseTotals(plan);
    return `<article class="v107-panel v108-purchase-board"><header><div><small>ПЛАН ПОКУПОК</small><h2>Список покупок и бюджет</h2><p>Планируйте каждую покупку отдельно: бюджет, фактическую цену, срок и статус.</p></div><button class="v78-primary" data-v107-action="add-purchase" data-id="${plan.id}">＋ Покупка</button></header><section class="v108-purchase-totals"><div><small>Запланировано</small><b>${money(totals.planned)}</b></div><div><small>Потрачено</small><b>${money(totals.actual)}</b></div><div><small>Осталось</small><b>${money(totals.remaining)}</b></div><div><small>Куплено</small><b>${totals.purchased}/${totals.items.length}</b></div></section><div class="v108-purchase-list">${totals.items.length?totals.items.map(item=>purchaseRow(plan,item)).join(''):`<div class="v108-purchase-empty">${appIcon('purchases','coral')}<span><b>Список покупок пока пуст</b><small>Добавьте первую покупку и укажите плановый бюджет.</small></span><button data-v107-action="add-purchase" data-id="${plan.id}">Добавить покупку</button></div>`}</div></article>`;
  }
  function purchaseRow(plan,item){
    const planned=num(item.plannedBudget??item.amount),actual=num(item.actualAmount),status=item.status||(item.done?'purchased':'planned');
    return `<div class="v108-purchase-row ${status==='purchased'||item.done?'done':''}" data-status="${esc(status)}"><button class="v108-purchase-check" data-v107-action="toggle-purchase" data-id="${plan.id}" data-item="${item.id}" aria-label="${status==='purchased'?'Вернуть в план':'Отметить купленной'}">${status==='purchased'||item.done?'✓':''}</button><span class="v108-purchase-main"><small>${esc(purchaseCategoryLabel(item.category))} · ${esc(purchasePriorityLabel(item.priority))}${item.due?` · до ${formatShort(item.due)}`:''}</small><b>${esc(item.title||'Покупка')}</b>${item.note?`<p>${esc(item.note)}</p>`:''}<em>${esc(purchaseStatusLabel(status))}</em></span><span class="v108-purchase-money"><small>План</small><b>${money(planned)}</b><small>Факт</small><b>${actual?money(actual):'—'}</b></span><span class="v108-purchase-actions">${safeExternalUrl(item.url)?`<a href="${esc(safeExternalUrl(item.url))}" target="_blank" rel="noopener noreferrer" title="Открыть ссылку">↗</a>`:''}<button data-v107-action="edit-purchase" data-id="${plan.id}" data-item="${item.id}" title="Редактировать">${appIcon('edit','blue','tiny')}</button><button data-v107-action="delete-purchase" data-id="${plan.id}" data-item="${item.id}" title="Удалить">×</button></span></div>`;
  }
  function planDetail(id){
    const plan=entityBy('plans',id); if(!plan)return missingPage('План не найден','planner');
    const blocks=Array.isArray(plan.blocks)?plan.blocks:[];
    const checklist=blocks.filter(block=>block.type!=='purchases').flatMap(block=>Array.isArray(block.items)?block.items:[]).filter(item=>item&&typeof item==='object'&&'done'in item);
    const progress=checklist.length?Math.round(checklist.filter(x=>x.done).length/checklist.length*100):0;
    return `<section class="v78-page v107-page"><header class="v107-detail-head"><div><button class="v78-back" data-v107-info-route="planner">← Планер</button><small>${planTypeLabel(plan.type)} · ${planStatusLabel(plan.status)}</small><h1>${esc(plan.title)}</h1><p>${esc(plan.why||plan.outcome||'')}</p></div><div class="v107-head-actions"><button class="v78-secondary" data-v107-action="edit-plan" data-id="${id}">Редактировать</button><button class="v78-primary" data-v107-action="add-plan-block" data-id="${id}">＋ Добавить блок</button></div></header>
      <section class="v107-plan-summary"><article><small>Срок</small><b>${formatDate(plan.due)}</b></article><article><small>Бюджет плана</small><b>${plan.budget?money(plan.budget):'—'}</b></article><article><small>Факт по плану</small><b>${plan.actualSpend?money(plan.actualSpend):'—'}</b></article><article><small>Чек-листы</small><b>${progress}%</b></article><article class="wide"><small>Следующий шаг</small><b>${esc(plan.nextAction||'Не определён')}</b></article></section>
      ${purchaseBoard(plan)}
      <section class="v107-detail-grid"><div class="v107-plan-blocks">${blocks.filter(block=>block.type!=='purchases').map((block,index,visible)=>planBlock(plan,block,index,visible.length)).join('')||empty('Добавьте только те блоки, которые нужны для этой ситуации.')}${plan.archivedBlocks?.length?`<button class="v107-restore" data-v107-action="restore-plan-block" data-id="${id}">↶ Восстановить последний удалённый блок</button>`:''}</div><aside>${relationsPanel('plans',id)}${smartAssistant(plan.nextAction?'Следующий шаг определён':'Сделайте план исполнимым',plan.nextAction?plan.nextAction:'Добавьте одно физическое действие: открыть, проверить, позвонить, купить или забронировать.',[{action:'create-plan-task',label:'Создать задачу',data:`data-id="${id}"`}])}<button class="v107-danger" data-v107-action="delete-entity" data-type="plans" data-id="${id}">Удалить план</button></aside></section>
    </section>`;
  }

  function detailShell(type,id,backRoute,kicker,title,subtitle,content,actions,assistant){
    return `<section class="v78-page v107-page"><header class="v107-detail-head"><div><button class="v78-back" data-v107-info-route="${backRoute}">← ${esc(ENTITY[type]?.label==='Воспоминание'?'Личная память':ENTITY[type]?.label||'Назад')}</button><small>${esc(kicker)}</small><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="v107-head-actions">${actions.map(action=>`<button class="${action.primary?'v78-primary':'v78-secondary'}" data-v107-action="${action.action}" data-id="${id}" data-type="${type}">${esc(action.label)}</button>`).join('')}</div></header><section class="v107-detail-grid"><div>${content}</div><aside>${relationsPanel(type,id)}${assistant}<button class="v107-danger" data-v107-action="delete-entity" data-type="${type}" data-id="${id}">Удалить</button></aside></section></section>`;
  }
  function missingPage(title,route){ return `<section class="v78-page v107-page">${pageHead('Запись недоступна',title,'Возможно, запись была удалена или перемещена.',`<button class="v78-primary" data-v107-info-route="${route}">Вернуться</button>`)}</section>`; }

  function relationsPanel(type,id){
    const links=linksFor(type,id);
    return `<article class="v107-panel v107-relations"><header><div><small>СВЯЗИ НЕОБЯЗАТЕЛЬНЫ</small><h2>Связано</h2></div><button data-v107-action="open-link" data-type="${type}" data-id="${id}">＋</button></header><div>${links.length?links.map(link=>relationRow(type,id,link)).join(''):'<p class="muted">Связей пока нет. Запись полностью работает и без них.</p>'}</div>${incoming(type,id).length?`<footer><small>Где используется: ${incoming(type,id).length}</small></footer>`:''}</article>`;
  }
  function relationRow(currentType,currentId,link){
    const outgoingLink=link.sourceType===currentType&&link.sourceId===currentId;
    const type=outgoingLink?link.targetType:link.sourceType,id=outgoingLink?link.targetId:link.sourceId,meta=ENTITY[type];
    return `<div class="v107-relation-row"><button data-v107-info-route="${esc(entityRoute(type,id))}">${appIcon(meta?.icon||'memory',meta?.tone||'violet','small')}<span><small>${esc(meta?.label||type)} · ${esc(RELATION_TYPES[link.relationType]||'Связано')}</small><b>${esc(entityTitle(type,id))}</b></span></button><button data-v107-action="remove-link" data-id="${link.id}" title="Удалить связь">×</button></div>`;
  }

  function planBlock(plan,block,index,visibleCount=plan.blocks.length){
    const items=Array.isArray(block.items)?block.items:[];
    const body=block.type==='purchases'?`<div class="v108-purchase-block-link"><p>Покупки управляются в отдельном блоке «Список покупок и бюджет» выше.</p><button data-v107-action="add-purchase" data-id="${plan.id}">＋ Добавить покупку</button></div>`:block.type==='budget'?`<div class="v107-budget-block"><div><small>План</small><b>${money(plan.budget)}</b></div><div><small>Факт</small><b>${money(plan.actualSpend)}</b></div><div><small>Остаток</small><b>${money(Math.max(0,num(plan.budget)-num(plan.actualSpend)))}</b></div></div>`:items.map(item=>planItem(plan,block,item)).join('')||'<p class="muted">В блоке пока нет пунктов.</p>';
    return `<article class="v107-panel v107-plan-block ${block.collapsed?'collapsed':''}"><header><div><small>${esc(PLAN_BLOCKS[block.type]||block.type)}</small><h2>${esc(block.title||PLAN_BLOCKS[block.type]||'Блок')}</h2></div><div class="v107-block-actions"><button data-v107-action="move-plan-block" data-id="${plan.id}" data-block="${block.id}" data-delta="-1" ${index===0?'disabled':''}>↑</button><button data-v107-action="move-plan-block" data-id="${plan.id}" data-block="${block.id}" data-delta="1" ${index===visibleCount-1?'disabled':''}>↓</button><button data-v107-action="toggle-plan-block" data-id="${plan.id}" data-block="${block.id}">${block.collapsed?'Развернуть':'Свернуть'}</button><button data-v107-action="delete-plan-block" data-id="${plan.id}" data-block="${block.id}">×</button></div></header><div class="v107-block-body">${body}</div>${!['budget','purchases'].includes(block.type)?`<footer><button data-v107-action="add-plan-item" data-id="${plan.id}" data-block="${block.id}">＋ Добавить пункт</button></footer>`:''}</article>`;
  }
  function planItem(plan,block,item){
    if(['checklist','tasks','purchases'].includes(block.type))return `<div class="v107-check-row ${item.done?'done':''}" role="checkbox" tabindex="0" aria-checked="${Boolean(item.done)}" data-v107-action="toggle-plan-item" data-id="${plan.id}" data-block="${block.id}" data-item="${item.id}"><i>${item.done?'✓':''}</i><span><b>${esc(item.title||item.text||'Пункт')}</b>${item.amount?`<small>${money(item.amount)}</small>`:''}${safeExternalUrl(item.url)?`<a href="${esc(safeExternalUrl(item.url))}" target="_blank" rel="noopener noreferrer" data-v107-stop>Открыть ссылку</a>`:''}</span><button data-v107-action="delete-plan-item" data-id="${plan.id}" data-block="${block.id}" data-item="${item.id}">×</button></div>`;
    return `<div class="v107-simple-row"><span><b>${esc(item.title||item.text||'Пункт')}</b>${item.note?`<small>${esc(item.note)}</small>`:''}</span><button data-v107-action="delete-plan-item" data-id="${plan.id}" data-block="${block.id}" data-item="${item.id}">×</button></div>`;
  }

  function openPolinaEditor(date=today()){
    const state=ensureData(),entry=state.polinaDays.find(item=>item.date===date)||{};
    openModal(`Состояние Полины · ${formatDate(date)}`,`<div class="v108-polina-editor-head"><p>Заполните только подтверждённые наблюдения. Любое поле можно оставить пустым.</p></div><div class="v107-form-grid">${field('Дата','v108_polina_date',date,'date')}${field('Общее состояние','v108_polina_status',options([['','Без отметки'],['good','Хорошее'],['neutral','Нейтральное'],['bad','Плохое']],entry.status||''),'select')}${field('Цикл','v108_polina_period',options([['','Нет отметки'],['start','Начало месячных'],['period','Месячные'],['end','Конец месячных']],entry.periodMarker||''),'select')}${field('Настроение','v108_polina_mood',entry.mood)}${field('Энергия 0–10','v108_polina_energy',entry.energy||'','number','min="0" max="10"')}${field('Дискомфорт 0–10','v108_polina_discomfort',entry.discomfort||'','number','min="0" max="10"')}${field('Сон','v108_polina_sleep',entry.sleep)}${field('Стресс 0–10','v108_polina_stress',entry.stress||'','number','min="0" max="10"')}${field('Симптомы через запятую','v108_polina_symptoms',list(entry.symptoms).join(', '))}${field('Напоминание','v108_polina_reminder',entry.reminder)}</div>${field('Комментарий','v108_polina_comment',entry.comment,'textarea')}${field('Что помогло','v108_polina_helped',entry.helped,'textarea')}${field('Что не помогло','v108_polina_not_helped',entry.notHelped,'textarea')}${field('Какая поддержка нужна','v108_polina_support',entry.supportNeeded,'textarea')}${field('Что Полина попросила','v108_polina_request',entry.request,'textarea')}${field('Планы на день','v108_polina_plans',entry.plans,'textarea')}<div class="v107-modal-actions"><button class="v78-primary" data-v107-action="save-polina-entry" data-id="${esc(entry.id||'')}">Сохранить состояние</button><button data-v107-action="close-modal">Отмена</button></div>`,true);
  }
  function savePolinaEntry(existingId=''){
    const state=ensureData(),date=val('v108_polina_date')||today(),existing=state.polinaDays.find(item=>item.id===existingId||item.date===date)||{},status=val('v108_polina_status'),periodMarker=val('v108_polina_period'),comment=val('v108_polina_comment');
    const entry=Object.assign({},existing,{id:existing.id||uid(),date,status,periodMarker,comment,mood:val('v108_polina_mood'),energy:Math.max(0,Math.min(10,num(val('v108_polina_energy')))),discomfort:Math.max(0,Math.min(10,num(val('v108_polina_discomfort')))),sleep:val('v108_polina_sleep'),stress:Math.max(0,Math.min(10,num(val('v108_polina_stress')))),symptoms:list(val('v108_polina_symptoms')),helped:val('v108_polina_helped'),notHelped:val('v108_polina_not_helped'),supportNeeded:val('v108_polina_support'),request:val('v108_polina_request'),plans:val('v108_polina_plans'),reminder:val('v108_polina_reminder'),updatedAt:nowIso(),createdAt:existing.createdAt||nowIso()});
    const meaningful=status||periodMarker||comment||entry.mood||entry.energy||entry.discomfort||entry.sleep||entry.stress||entry.symptoms.length||entry.helped||entry.notHelped||entry.supportNeeded||entry.request||entry.plans||entry.reminder;
    state.polinaDays=state.polinaDays.filter(item=>item.id!==entry.id&&item.date!==date);if(meaningful)state.polinaDays.push(entry);state.polinaDays.sort((a,b)=>String(b.date).localeCompare(String(a.date)));document.getElementById('view')?.removeAttribute('data-v107-polina');closeModal();persist('Состояние Полины сохранено');navigate('polina');
  }
  function polinaEnhance(view){
    const state=ensureData(); if(!view||view.dataset.v107Polina==='true')return;
    if(state.settings.v107.polinaPinHash && sessionStorage.getItem('secondBrainOS.v107.polinaUnlocked')!=='1'){
      view.innerHTML=`<section class="v78-page v107-page v107-polina-lock"><div><i>🌸</i><small>ЛИЧНЫЙ РАЗДЕЛ</small><h1>Состояние Полины защищено</h1><p>Введите PIN, чтобы открыть календарь и записи. Данные остаются на этом устройстве.</p><label class="v107-field"><span>PIN</span><input id="v107_polina_unlock_pin" type="password" inputmode="numeric" autocomplete="off"></label><button class="v78-primary" data-v107-action="unlock-polina">Открыть раздел</button><button class="v78-secondary" data-v107-info-route="information">Вернуться</button></div></section>`;
      view.dataset.v107Polina='locked';return;
    }
    view.dataset.v107Polina='true';
    const latest=state.polinaDays.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||{};
    const entries=state.polinaDays.filter(item=>num(item.energy)||num(item.discomfort)||item.mood).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-14);
    const hero=view.querySelector('.v72-hero,.v78-page-head,.v72-page>header');
    if(hero){
      const summary=document.createElement('section'); summary.className='v107-polina-summary';
      summary.innerHTML=`<article><small>Энергия</small><b>${latest.energy?`${latest.energy}/10`:'—'}</b><button data-v107-action="edit-polina-state" data-date="${esc(latest.date||today())}">${latest.energy?'Изменить':'Добавить'}</button></article><article><small>Дискомфорт</small><b>${latest.discomfort?`${latest.discomfort}/10`:'—'}</b><button data-v107-action="edit-polina-state" data-date="${esc(latest.date||today())}">${latest.discomfort?'Изменить':'Добавить'}</button></article><article><small>Сон</small><b>${esc(latest.sleep||'—')}</b><button data-v107-action="edit-polina-state" data-date="${esc(latest.date||today())}">${latest.sleep?'Изменить':'Добавить'}</button></article><article class="wide"><small>Какая поддержка нужна</small><b>${esc(latest.supportNeeded||latest.request||'Пока не указано')}</b><button data-v107-action="edit-polina-state" data-date="${esc(latest.date||today())}">${latest.supportNeeded||latest.request?'Изменить':'Добавить'}</button></article><article class="v108-polina-cta"><span>${appIcon('polina','pink')}</span><div><small>БЫСТРАЯ ЗАПИСЬ</small><b>Заполнить состояние за сегодня</b><p>Энергия, сон, дискомфорт и поддержка.</p></div><button class="v78-primary" data-v107-action="edit-polina-state" data-date="${today()}">Заполнить состояние</button></article>`;
      hero.insertAdjacentElement('afterend',summary);
    }
    const page=view.querySelector('.v72-page,.v78-page')||view;
    const ext=document.createElement('section'); ext.className='v107-polina-extension';
    ext.innerHTML=`<article class="v107-panel"><header><div><small>ДИНАМИКА · 14 ЗАПИСЕЙ</small><h2>Энергия и самочувствие</h2></div></header><div class="v107-mini-chart">${entries.map(item=>`<div title="${esc(formatDate(item.date))}"><i style="height:${Math.max(8,num(item.energy)*9)}%"></i><em style="height:${Math.max(8,num(item.discomfort)*9)}%"></em><small>${esc(String(item.date||'').slice(8,10))}</small></div>`).join('')||'<p class="muted">Добавьте энергию и дискомфорт в дневной записи.</p>'}</div><footer><span><i class="energy"></i>Энергия</span><span><i class="pain"></i>Дискомфорт</span></footer></article>${smartAssistant('Поддержка без медицинских выводов',latest.helped?`Ранее помогало: ${latest.helped}`:'Фиксируйте только просьбы Полины и то, что реально помогло. Раздел не ставит диагнозы.')}
      <article class="v107-panel v107-privacy"><header><h2>Приватность</h2></header><label><input type="checkbox" data-v107-setting="polinaPrivate" ${state.settings.v107.polinaPrivate?'checked':''}><span>Защищённый личный раздел</span></label><label><input type="checkbox" data-v107-setting="hidePolinaFromHome" ${state.settings.v107.hidePolinaFromHome?'checked':''}><span>Не показывать детали на главной</span></label><label><input type="checkbox" data-v107-setting="excludePolinaCloud" ${state.settings.v107.excludePolinaCloud?'checked':''}><span>Не отправлять записи в облако</span></label><div class="v107-privacy-actions"><button data-v107-action="setup-polina-lock">${state.settings.v107.polinaPinHash?'Изменить PIN':'Настроить PIN'}</button>${state.settings.v107.polinaPinHash?'<button data-v107-action="lock-polina-now">Заблокировать сейчас</button><button data-v107-action="remove-polina-lock">Убрать PIN</button>':''}<button data-v107-action="export-polina">Экспортировать отдельно</button></div></article>`;
    page.appendChild(ext);
  }

  function injectPolinaModal(){
    const modal=document.getElementById('modal'),form=modal?.querySelector('.v72-modal-form'); if(!form||form.dataset.v107Extended==='true')return;
    form.dataset.v107Extended='true';
    const date=modal.querySelector('#v72_day_date')?.value||today(),state=ensureData(),entry=state.polinaDays.find(x=>x.date===date)||{};
    const extra=document.createElement('details'); extra.className='v107-advanced'; extra.open=true;
    extra.innerHTML=`<summary>Самочувствие и поддержка</summary><div class="v107-form-grid">${field('Настроение','v107_polina_mood',entry.mood)}${field('Энергия 0–10','v107_polina_energy',entry.energy||'','number','min="0" max="10"')}${field('Дискомфорт 0–10','v107_polina_discomfort',entry.discomfort||'','number','min="0" max="10"')}${field('Сон','v107_polina_sleep',entry.sleep)}${field('Стресс 0–10','v107_polina_stress',entry.stress||'','number','min="0" max="10"')}${field('Симптомы через запятую','v107_polina_symptoms',list(entry.symptoms).join(', '))}</div>${field('Что помогло','v107_polina_helped',entry.helped,'textarea')}${field('Что не помогло','v107_polina_not_helped',entry.notHelped,'textarea')}${field('Какая поддержка нужна','v107_polina_support',entry.supportNeeded,'textarea')}${field('Что Полина попросила','v107_polina_request',entry.request,'textarea')}${field('Планы на день','v107_polina_plans',entry.plans,'textarea')}${field('Напоминание','v107_polina_reminder',entry.reminder)}</details>`;
    const actions=form.querySelector('.v72-modal-actions'); actions?.before(extra);
    const saveButton=form.querySelector('[data-v72-action="save-day"]');
    if(saveButton){ saveButton.removeAttribute('data-v72-action'); saveButton.dataset.v107Action='save-polina-day'; saveButton.dataset.id=entry.id||saveButton.dataset.id||''; }
  }

  function renderOwned(force=false){
    const route=routeNow(),view=document.getElementById('view'); if(!view)return;
    customizeGlobalSearch();
    if(route==='polina'){ polinaEnhance(view); return; }
    if(!OWNED_ROUTES.has(route)&&!DETAIL_PREFIXES.some(prefix=>route.startsWith(prefix))){ hidePolinaOnHome(); return; }
    const signature=`${route}:${ensureData()?.settings?.v107?.updatedAt||''}`;
    if(!force&&view.dataset.v107Signature===signature&&view.querySelector('.v107-page'))return;
    let html='';
    if(route==='information')html=informationPage();
    else if(route==='people')html=peoplePage();
    else if(route==='notes')html=notesPage();
    else if(route==='ideas')html=ideasPage();
    else if(route==='personal')html=personalPage();
    else if(route==='learning')html=learningPage();
    else if(route==='planner')html=plannerPage();
    else if(route.startsWith('person-'))html=personDetail(route.slice(7));
    else if(route.startsWith('note-'))html=noteDetail(route.slice(5));
    else if(route.startsWith('idea-'))html=ideaDetail(route.slice(5));
    else if(route.startsWith('memory-'))html=memoryDetail(route.slice(7));
    else if(route.startsWith('learning-item-'))html=learningDetail(route.slice(14));
    else if(route.startsWith('plan-'))html=planDetail(route.slice(5));
    if(!html)return;
    view.innerHTML=html;
    view.dataset.route=route;
    view.dataset.v107Signature=signature;
    document.body.dataset.sbosRoute=route;
    document.documentElement.dataset.v107Information='ready';
  }

  let renderQueued=false,queuedForce=false;
  function scheduleRender(force=false){
    queuedForce=queuedForce||force;
    if(renderQueued)return;
    renderQueued=true;
    let ran=false;
    const run=()=>{
      if(ran)return;ran=true;renderQueued=false;
      const shouldForce=queuedForce;queuedForce=false;
      renderOwned(shouldForce);
    };
    requestAnimationFrame(run);
    setTimeout(run,55);
  }
  function customizeGlobalSearch(){
    document.querySelectorAll('[data-v78-action="open-search"]').forEach(button=>{button.removeAttribute('data-v78-action');button.dataset.v107Action='open-global-search';button.setAttribute('aria-label','Поиск по всей базе');});
  }
  function hidePolinaOnHome(){
    const state=ensureData(); if(!state?.settings?.v107?.hidePolinaFromHome||routeNow()!=='today')return;
    document.querySelectorAll('#view article,#view section,#view button').forEach(node=>{if(/состояние полины/i.test(node.textContent||'')&&node.children.length<18)node.hidden=true;});
  }

  function noteTypeLabel(value){return ({thought:'Мысль',decision:'Решение',observation:'Наблюдение',instruction:'Инструкция',meeting:'Встреча',diary:'Дневник',reference:'Справка',summary:'Саммари',idea:'Идея',conclusion:'Вывод'})[value]||'Заметка';}
  function ideaStatusLabel(value){return ({inbox:'Входящая',thinking:'Нужно обдумать',testing:'Проверяется',planned:'Запланирована',active:'В работе',done:'Реализована',paused:'Отложена',rejected:'Отклонена',archive:'Архив'})[value]||'Входящая';}
  function memoryTypeLabel(value){return ({moment:'Важный момент',achievement:'Достижение',decision:'Решение',lesson:'Ошибка и урок',relationship:'Отношения',childhood:'Детство',travel:'Путешествие',family:'Семейная история',funny:'Смешной случай',dream:'Мечта',polina:'Момент с Полиной',period:'Период жизни'})[value]||'Воспоминание';}
  function learningTypeLabel(value){return ({video:'Видео',course:'Курс',podcast:'Подкаст',article:'Статья',webinar:'Вебинар',book:'Книга',lesson:'Собственный урок',instruction:'Инструкция',summary:'Саммари'})[value]||'Материал';}
  function learningStatusLabel(value){return ({planned:'Запланировано',active:'Изучаю',completed:'Завершено',review:'Повторить',archive:'Архив'})[value]||'Запланировано';}
  function planTypeLabel(value){return ({blank:'Пустой план',purchase:'Покупка',trip:'Поездка',event:'Событие',gift:'Подарок',repair:'Ремонт',move:'Переезд',learning:'Обучение',project:'Личный проект',finance:'Финансовый план',important:'Важное мероприятие'})[value]||'План';}
  function planStatusLabel(value){return ({planned:'Запланирован',active:'В работе',paused:'На паузе',done:'Завершён',archive:'Архив'})[value]||'Запланирован';}
  function ideaPriority(item){const s=item.scores||{};return Math.max(0,num(s.benefit))+Math.max(0,num(s.interest))+Math.max(0,6-num(s.effort))+Math.max(0,num(s.urgency));}

  function editPerson(id=''){
    const p=id?entityBy('people',id):{};
    openModal(id?'Редактировать человека':'Добавить человека',`<div class="v107-form-grid">${field('Имя *','v107_person_name',p.name)}${field('Фото URL','v107_person_avatar',p.avatar)}${field('Кем приходится','v107_person_role',p.role)}${field('Категория','v107_person_category',options([['family','Семья'],['relationship','Отношения'],['friend','Друг'],['acquaintance','Знакомый'],['business','Деловой контакт'],['client','Клиент'],['colleague','Коллега']],p.category),'select')}${field('Город','v107_person_city',p.city)}${field('Часовой пояс','v107_person_timezone',p.timezone)}${field('Телефон','v107_person_phone',p.phone)}${field('Email','v107_person_email',p.email,'email')}${field('Telegram','v107_person_telegram',p.telegram)}${field('Дата рождения','v107_person_birthday',p.birthday,'date')}${field('Дата знакомства','v107_person_met',p.metDate,'date')}${field('Степень близости','v107_person_closeness',p.closeness)}${field('Последнее общение','v107_person_last',p.lastContact,'date')}${field('Частота общения','v107_person_frequency',p.contactFrequency)}${field('Следующий контакт','v107_person_next',p.nextContact,'date')}</div><details class="v107-advanced" open><summary>Важный контекст</summary>${field('Что сейчас происходит','v107_person_context',p.currentContext,'textarea')}${field('Интересы через запятую','v107_person_interests',list(p.interests).join(', '))}${field('Любимые вещи','v107_person_favorites',list(p.favorites).join(', '))}${field('Идеи подарков','v107_person_gifts',list(p.giftIdeas).join(', '))}${field('Что радует','v107_person_joy',p.joy,'textarea')}${field('Что лучше не предлагать','v107_person_avoid',p.avoid,'textarea')}${field('Важные факты','v107_person_facts',p.importantFacts,'textarea')}${field('Мои обещания — по строке','v107_person_promises_mine',list(p.promisesMine).join('\n'),'textarea')}${field('Обещания человека — по строке','v107_person_promises_theirs',list(p.promisesTheirs).join('\n'),'textarea')}${field('Личная заметка','v107_person_note',p.note,'textarea')}</details>${formActions('save-person',id)}`,true);
  }
  function savePerson(id){
    const state=ensureData(),old=id?entityBy('people',id):null,name=clean(val('v107_person_name')); if(!name)return toast('Введите имя');
    const item=Object.assign({},old||{}, {id:old?.id||uid(),name,avatar:val('v107_person_avatar'),role:val('v107_person_role'),category:val('v107_person_category')||'friend',city:val('v107_person_city'),timezone:val('v107_person_timezone'),phone:val('v107_person_phone'),email:val('v107_person_email'),telegram:val('v107_person_telegram'),birthday:val('v107_person_birthday'),metDate:val('v107_person_met'),closeness:val('v107_person_closeness'),lastContact:val('v107_person_last'),contactFrequency:val('v107_person_frequency'),nextContact:val('v107_person_next'),currentContext:val('v107_person_context'),interests:list(val('v107_person_interests')),favorites:list(val('v107_person_favorites')),giftIdeas:list(val('v107_person_gifts')),joy:val('v107_person_joy'),avoid:val('v107_person_avoid'),importantFacts:val('v107_person_facts'),promisesMine:list(val('v107_person_promises_mine')),promisesTheirs:list(val('v107_person_promises_theirs')),note:val('v107_person_note'),timeline:Array.isArray(old?.timeline)?old.timeline:[],updatedAt:nowIso(),createdAt:old?.createdAt||nowIso()});
    state.people=old?state.people.map(x=>x.id===id?item:x):[item,...state.people]; connectPending('people',item.id); closeModal(); persist('Анкета сохранена'); navigate(`person-${item.id}`);
  }

  function editNote(id=''){
    const item=id?entityBy('notes',id):{};
    openModal(id?'Редактировать заметку':'Добавить заметку',`<div class="v107-form-grid">${field('Название *','v107_note_title',item.title)}${field('Тип','v107_note_type',options([['thought','Мысль'],['decision','Решение'],['observation','Наблюдение'],['instruction','Инструкция'],['meeting','Встреча'],['diary','Дневник'],['reference','Справка'],['summary','Саммари'],['idea','Идея'],['conclusion','Вывод']],item.noteType),'select')}${field('Папка','v107_note_folder',item.folder||'Личное')}${field('Дата','v107_note_date',item.date||today(),'date')}${field('Статус','v107_note_status',options([['draft','Черновик'],['active','Активная'],['done','Завершена'],['archive','Архив']],item.status),'select')}${field('Теги','v107_note_tags',list(item.tags).join(', '))}${field('Источник','v107_note_source',item.source,'url')}${field('Повторить','v107_note_review',item.reviewDate,'date')}</div>${field('Текст','v107_note_text',item.text,'textarea','rows="8"')}${field('Главный вывод','v107_note_insight',item.mainInsight,'textarea')}${field('Почему это важно','v107_note_importance',item.importance,'textarea')}${field('Следующий шаг','v107_note_next',item.nextAction,'textarea')}<label class="v107-switch"><input id="v107_note_pinned" type="checkbox" ${item.pinned?'checked':''}><span>Закрепить заметку</span></label>${formActions('save-note',id)}`,true);
  }
  function saveNote(id){ const state=ensureData(),old=id?entityBy('notes',id):null,title=val('v107_note_title'); if(!title)return toast('Введите название'); const item=Object.assign({},old||{}, {id:old?.id||uid(),title,noteType:val('v107_note_type')||'thought',folder:val('v107_note_folder')||'Личное',date:val('v107_note_date')||today(),status:val('v107_note_status')||'active',tags:list(val('v107_note_tags')),source:val('v107_note_source'),reviewDate:val('v107_note_review'),text:val('v107_note_text'),mainInsight:val('v107_note_insight'),importance:val('v107_note_importance'),nextAction:val('v107_note_next'),pinned:checked('v107_note_pinned'),updatedAt:nowIso(),createdAt:old?.createdAt||nowIso()}); state.notes=old?state.notes.map(x=>x.id===id?item:x):[item,...state.notes]; connectPending('notes',item.id); closeModal(); persist('Заметка сохранена'); navigate(`note-${item.id}`); }

  function editIdea(id=''){
    const item=id?entityBy('ideas',id):{},s=item.scores||{};
    openModal(id?'Редактировать идею':'Добавить идею',`<div class="v107-form-grid">${field('Название *','v107_idea_title',item.title)}${field('Статус','v107_idea_status',options([['inbox','Входящая'],['thinking','Нужно обдумать'],['testing','Проверяется'],['planned','Запланирована'],['active','В работе'],['done','Реализована'],['paused','Отложена'],['rejected','Отклонена'],['archive','Архив']],item.status),'select')}${field('Бюджет','v107_idea_budget',item.budget||'','number','min="0"')}${field('Необходимое время','v107_idea_time',item.timeRequired)}</div>${field('Краткое описание','v107_idea_description',item.description,'textarea')}${field('Какую проблему решает','v107_idea_problem',item.problem,'textarea')}${field('Кому полезна','v107_idea_audience',item.audience,'textarea')}${field('Почему появилась','v107_idea_origin',item.origin,'textarea')}${field('Ожидаемый результат','v107_idea_result',item.expectedResult,'textarea')}${field('Что изменится после реализации','v107_idea_change',item.changeAfter,'textarea')}${field('Первый минимальный эксперимент','v107_idea_experiment',item.experiment,'textarea')}${field('Необходимые ресурсы','v107_idea_resources',item.resources,'textarea')}${field('Риски','v107_idea_risks',item.risks,'textarea')}${field('Препятствия','v107_idea_obstacles',item.obstacles,'textarea')}<fieldset class="v107-score-fields"><legend>Необязательная оценка 1–5</legend>${[['benefit','Польза'],['interest','Интерес'],['effort','Трудозатраты'],['urgency','Срочность']].map(([key,label])=>field(label,`v107_idea_${key}`,s[key]||'','number','min="0" max="5"')).join('')}</fieldset>${formActions('save-idea',id)}`,true);
  }
  function saveIdea(id){ const state=ensureData(),old=id?entityBy('ideas',id):null,title=val('v107_idea_title'); if(!title)return toast('Введите название'); const item=Object.assign({},old||{}, {id:old?.id||uid(),title,status:val('v107_idea_status')||'inbox',budget:num(val('v107_idea_budget')),timeRequired:val('v107_idea_time'),description:val('v107_idea_description'),problem:val('v107_idea_problem'),audience:val('v107_idea_audience'),origin:val('v107_idea_origin'),expectedResult:val('v107_idea_result'),changeAfter:val('v107_idea_change'),experiment:val('v107_idea_experiment'),resources:val('v107_idea_resources'),risks:val('v107_idea_risks'),obstacles:val('v107_idea_obstacles'),scores:{benefit:num(val('v107_idea_benefit')),interest:num(val('v107_idea_interest')),effort:num(val('v107_idea_effort')),urgency:num(val('v107_idea_urgency'))},updatedAt:nowIso(),createdAt:old?.createdAt||nowIso()}); state.ideas=old?state.ideas.map(x=>x.id===id?item:x):[item,...state.ideas]; connectPending('ideas',item.id); closeModal(); persist('Идея сохранена'); navigate(`idea-${item.id}`); }

  function editMemory(id=''){
    const item=id?entityBy('personal',id):{};
    openModal(id?'Редактировать воспоминание':'Добавить воспоминание',`<div class="v107-form-grid">${field('Название *','v107_memory_title',item.title)}${field('Тип','v107_memory_type',options([['moment','Важный момент'],['achievement','Достижение'],['decision','Решение'],['lesson','Ошибка и урок'],['relationship','Отношения'],['childhood','Детство'],['travel','Путешествие'],['family','Семейная история'],['funny','Смешной случай'],['dream','Мечта'],['polina','Момент с Полиной'],['period','Период жизни']],item.memoryType),'select')}${field('Дата','v107_memory_date',item.date,'date')}${field('Примерный период','v107_memory_period',item.period)}${field('Место','v107_memory_place',item.place)}${field('Участники','v107_memory_participants',list(item.participants).join(', '))}${field('Приватность','v107_memory_privacy',options([['private','Личное'],['normal','Обычная запись']],item.privacy),'select')}</div>${field('Описание','v107_memory_description',item.description,'textarea','rows="7"')}${field('Эмоции','v107_memory_emotions',item.emotions,'textarea')}${field('Почему это важно','v107_memory_importance',item.importance,'textarea')}${field('Чему научило','v107_memory_lesson',item.lesson,'textarea')}${field('Что хочется сохранить','v107_memory_preserve',item.preserve,'textarea')}${field('Цитата','v107_memory_quote',item.quote,'textarea')}<div class="v107-form-grid">${field('Фото URL','v107_memory_image',item.imageUrl,'url')}${field('Видео URL','v107_memory_video',item.videoUrl,'url')}${field('Аудио URL','v107_memory_audio',item.audioUrl,'url')}<label class="v107-field"><span>Или загрузить фото до 3 МБ</span><input id="v107_memory_file" type="file" accept="image/*"></label></div>${formActions('save-memory',id)}`,true);
  }
  async function saveMemory(id){ const state=ensureData(),old=id?entityBy('personal',id):null,title=val('v107_memory_title'); if(!title)return toast('Введите название'); let imageUrl=val('v107_memory_image')||old?.imageUrl||'',file=document.getElementById('v107_memory_file')?.files?.[0]; if(file){if(file.size>3*1024*1024)return toast('Фотография больше 3 МБ'); imageUrl=await fileToData(file);} const item=Object.assign({},old||{}, {id:old?.id||uid(),title,memoryType:val('v107_memory_type')||'moment',date:val('v107_memory_date'),period:val('v107_memory_period'),place:val('v107_memory_place'),participants:list(val('v107_memory_participants')),privacy:val('v107_memory_privacy')||'private',description:val('v107_memory_description'),emotions:val('v107_memory_emotions'),importance:val('v107_memory_importance'),lesson:val('v107_memory_lesson'),preserve:val('v107_memory_preserve'),quote:val('v107_memory_quote'),imageUrl,videoUrl:val('v107_memory_video'),audioUrl:val('v107_memory_audio'),updatedAt:nowIso(),createdAt:old?.createdAt||nowIso()}); state.personal=old?state.personal.map(x=>x.id===id?item:x):[item,...state.personal]; connectPending('personal',item.id); closeModal(); persist('Воспоминание сохранено'); navigate(`memory-${item.id}`); }

  function editLearning(id=''){
    const item=id?entityBy('learning',id):{};
    openModal(id?'Редактировать материал':'Добавить материал',`<div class="v107-form-grid">${field('Название *','v107_learning_title',item.title)}${field('Тип','v107_learning_type',options([['video','Видео'],['course','Курс'],['podcast','Подкаст'],['article','Статья'],['webinar','Вебинар'],['book','Книга'],['lesson','Собственный урок'],['instruction','Инструкция'],['summary','Саммари']],item.type),'select')}${field('Ссылка','v107_learning_url',item.url,'url')}${field('Автор','v107_learning_author',item.author)}${field('Канал','v107_learning_channel',item.channel)}${field('Тема','v107_learning_topic',item.topic)}${field('Длительность','v107_learning_duration',item.duration)}${field('Начал','v107_learning_start',item.dateStart,'date')}${field('Завершил','v107_learning_done',item.dateCompleted,'date')}${field('Статус','v107_learning_status',options([['planned','Запланировано'],['active','Изучаю'],['completed','Завершено'],['review','Повторить'],['archive','Архив']],item.status),'select')}${field('Полезность 1–5','v107_learning_utility',item.utility||'','number','min="0" max="5"')}${field('Повторить','v107_learning_review',item.reviewDate,'date')}</div>${field('Краткое саммари','v107_learning_summary',item.summary,'textarea','rows="6"')}${field('Главные мысли — по строке','v107_learning_points',list(item.keyPoints).join('\n'),'textarea')}${field('Новые термины — по строке','v107_learning_terms',list(item.terms).join('\n'),'textarea')}${field('Важные цитаты — по строке','v107_learning_quotes',list(item.quotes).join('\n'),'textarea')}${field('Личный вывод','v107_learning_conclusion',item.conclusion,'textarea')}${field('Где применить','v107_learning_apply',item.applyWhere,'textarea')}${field('Практическое действие','v107_learning_action',item.practiceAction,'textarea')}${field('Что сделал после обучения','v107_learning_result',item.appliedResult,'textarea')}${formActions('save-learning',id)}`,true);
  }
  function saveLearning(id){ const state=ensureData(),old=id?entityBy('learning',id):null,title=val('v107_learning_title'); if(!title)return toast('Введите название'); const item=Object.assign({},old||{}, {id:old?.id||uid(),title,type:val('v107_learning_type')||'video',url:val('v107_learning_url'),author:val('v107_learning_author'),channel:val('v107_learning_channel'),topic:val('v107_learning_topic'),duration:val('v107_learning_duration'),dateStart:val('v107_learning_start'),dateCompleted:val('v107_learning_done'),status:val('v107_learning_status')||'planned',utility:num(val('v107_learning_utility')),reviewDate:val('v107_learning_review'),summary:val('v107_learning_summary'),keyPoints:list(val('v107_learning_points')),terms:list(val('v107_learning_terms')),quotes:list(val('v107_learning_quotes')),conclusion:val('v107_learning_conclusion'),applyWhere:val('v107_learning_apply'),practiceAction:val('v107_learning_action'),appliedResult:val('v107_learning_result'),updatedAt:nowIso(),createdAt:old?.createdAt||nowIso()}); state.learningMaterials=old?state.learningMaterials.map(x=>x.id===id?item:x):[item,...state.learningMaterials]; connectPending('learning',item.id); closeModal(); persist('Материал сохранён'); navigate(`learning-item-${item.id}`); }

  function editPlan(id=''){
    const item=id?entityBy('plans',id):{};
    openModal(id?'Редактировать план':'Создать план',`<div class="v107-form-grid">${field('Название *','v107_plan_title',item.title)}${field('Шаблон','v107_plan_type',options([['blank','Пустой план'],['purchase','Покупка'],['trip','Поездка'],['event','Событие'],['gift','Подарок'],['repair','Ремонт'],['move','Переезд'],['learning','Обучение'],['project','Личный проект'],['finance','Финансовый план'],['important','Важное мероприятие']],item.type||'blank'),'select')}${field('Срок','v107_plan_due',item.due,'date')}${field('Статус','v107_plan_status',options([['planned','Запланирован'],['active','В работе'],['paused','На паузе'],['done','Завершён'],['archive','Архив']],item.status),'select')}${field('Приоритет','v107_plan_priority',options([['low','Низкий'],['medium','Средний'],['high','Высокий'],['critical','Критичный']],item.priority),'select')}${field('Бюджет','v107_plan_budget',item.budget||'','number','min="0"')}${field('Фактические расходы','v107_plan_actual',item.actualSpend||'','number','min="0"')}</div>${field('Зачем это нужно','v107_plan_why',item.why,'textarea')}${field('Желаемый результат','v107_plan_outcome',item.outcome,'textarea')}${field('Следующий шаг','v107_plan_next',item.nextAction,'textarea')}${field('Участники','v107_plan_people',list(item.participants).join(', '))}${field('Документы','v107_plan_documents',list(item.documents).join('\n'),'textarea')}${field('Ссылки','v107_plan_links',list(item.externalLinks).join('\n'),'textarea')}${field('Риски','v107_plan_risks',item.risks,'textarea')}${field('Заметки','v107_plan_notes',item.notes,'textarea')}${formActions('save-plan',id)}`,true);
  }
  function savePlan(id){ const state=ensureData(),old=id?entityBy('plans',id):null,title=val('v107_plan_title'); if(!title)return toast('Введите название'); const type=val('v107_plan_type')||'blank'; const item=Object.assign({},old||{}, {id:old?.id||uid(),title,type,due:val('v107_plan_due'),status:val('v107_plan_status')||'planned',priority:val('v107_plan_priority')||'medium',budget:num(val('v107_plan_budget')),actualSpend:num(val('v107_plan_actual')),why:val('v107_plan_why'),outcome:val('v107_plan_outcome'),nextAction:val('v107_plan_next'),participants:list(val('v107_plan_people')),documents:list(val('v107_plan_documents')),externalLinks:list(val('v107_plan_links')),risks:val('v107_plan_risks'),notes:val('v107_plan_notes'),blocks:Array.isArray(old?.blocks)?old.blocks:templateBlocks(type),archivedBlocks:Array.isArray(old?.archivedBlocks)?old.archivedBlocks:[],updatedAt:nowIso(),createdAt:old?.createdAt||nowIso()}); state.lifePlans=old?state.lifePlans.map(x=>x.id===id?item:x):[item,...state.lifePlans]; connectPending('plans',item.id); closeModal(); persist('План сохранён'); navigate(`plan-${item.id}`); }

  function templateBlocks(type){
    const map={purchase:['checklist','options','comparison','purchases','budget','documents','outcome'],trip:['checklist','budget','participants','calendar','bookings','route','documents','purchases','outcome'],event:['checklist','tasks','budget','participants','calendar','documents','outcome'],gift:['options','comparison','budget','purchases','checklist','outcome'],repair:['checklist','tasks','purchases','budget','risks','documents','outcome'],move:['checklist','tasks','purchases','budget','calendar','documents','outcome'],learning:['checklist','tasks','calendar','notes','outcome'],project:['tasks','checklist','budget','risks','notes','outcome'],finance:['budget','calendar','risks','notes','outcome'],important:['checklist','tasks','participants','calendar','documents','risks','outcome'],blank:[]};
    return (map[type]||[]).map(blockType=>({id:uid(),type:blockType,title:PLAN_BLOCKS[blockType],collapsed:false,items:[]}));
  }
  function formActions(action,id=''){return `<div class="v107-modal-actions"><button class="v78-primary" data-v107-action="${action}" data-id="${esc(id)}" type="button">Сохранить</button><button data-v107-action="close-modal" type="button">Отмена</button></div>`;}
  function val(id){return clean(document.getElementById(id)?.value);}
  function checked(id){return Boolean(document.getElementById(id)?.checked);}
  function fileToData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});}

  function openLink(type,id){
    const types=Object.entries(ENTITY).filter(([key])=>!(key===type&&entityItems(key).length===1));
    openModal('Связать запись',`<p class="v107-modal-intro">Связь необязательна. Она хранит ссылку на исходную запись и не копирует данные.</p><div class="v107-form-grid">${field('Тип записи','v107_link_type',options(types.map(([key,meta])=>[key,meta.label]),''),'select')}${field('Тип связи','v107_link_relation',options(Object.entries(RELATION_TYPES),'related'),'select')}</div><label class="v107-field"><span>Поиск</span><input id="v107_link_search" placeholder="Начните вводить название"></label><label class="v107-field"><span>Запись</span><select id="v107_link_target"></select></label><div class="v107-link-create"><button data-v107-action="create-linked-entity" data-source-type="${type}" data-source-id="${id}">＋ Создать новую запись выбранного типа</button></div><div class="v107-modal-actions"><button class="v78-primary" data-v107-action="save-link" data-source-type="${type}" data-source-id="${id}">Добавить связь</button><button data-v107-action="close-modal">Отмена</button></div>`,true);
    updateLinkTargets(type,id);
  }
  function updateLinkTargets(sourceType,sourceId){
    const type=val('v107_link_type')||'people',query=val('v107_link_search').toLowerCase(),select=document.getElementById('v107_link_target'); if(!select)return;
    const items=entityItems(type).filter(item=>!(type===sourceType&&item.id===sourceId)).filter(item=>ENTITY[type].title(item).toLowerCase().includes(query));
    select.innerHTML=items.map(item=>`<option value="${esc(item.id)}">${esc(ENTITY[type].title(item))}</option>`).join('')||'<option value="">Нет подходящих записей</option>';
  }
  function saveLink(sourceType,sourceId){
    const state=ensureData(),targetType=val('v107_link_type'),targetId=val('v107_link_target'),relationType=val('v107_link_relation')||'related';
    if(!targetType||!targetId)return toast('Выберите запись');
    if(sourceType===targetType&&sourceId===targetId)return toast('Нельзя связать запись с самой собой');
    const duplicate=state.knowledgeLinks.some(link=>link.sourceType===sourceType&&link.sourceId===sourceId&&link.targetType===targetType&&link.targetId===targetId&&link.relationType===relationType);
    if(duplicate)return toast('Такая связь уже существует');
    state.knowledgeLinks.push({id:uid(),sourceType,sourceId,targetType,targetId,relationType,createdAt:nowIso(),updatedAt:nowIso()}); closeModal(); persist('Связь добавлена');
  }

  function openQuickCreate(){
    openModal('Что добавить?',`<div class="v107-quick-grid">${[['edit-person','people','violet','Человека'],['edit-note','notes','blue','Заметку'],['edit-idea','ideas','amber','Идею'],['edit-memory','memory','indigo','Воспоминание'],['edit-learning','learning','violet','Материал обучения'],['edit-plan','planner','coral','План']].map(([action,icon,tone,label])=>`<button data-v107-action="${action}">${appIcon(icon,tone)}<b>${label}</b></button>`).join('')}</div><div class="v107-modal-actions"><button data-v107-action="close-modal">Отмена</button></div>`);
  }
  function openGlobalSearch(){
    openModal('Поиск по Second Brain OS',`<label class="v107-search-box"><span>⌕</span><input id="v107_global_search" placeholder="Человек, заметка, идея, план, видео…" autocomplete="off"></label><div id="v107_global_results" class="v107-search-results"></div>`,true);
    updateGlobalSearch('');
  }
  function updateGlobalSearch(query){
    const q=clean(query).toLowerCase(),results=[];
    Object.entries(ENTITY).forEach(([type,meta])=>entityItems(type).forEach(item=>{const title=meta.title(item),blob=JSON.stringify(item).toLowerCase();if(!q||title.toLowerCase().includes(q)||blob.includes(q))results.push({type,item,title});}));
    const host=document.getElementById('v107_global_results'); if(!host)return;
    host.innerHTML=results.slice(0,80).map(({type,item,title})=>`<button data-v107-info-route="${esc(entityRoute(type,item.id))}">${appIcon(ENTITY[type].icon,ENTITY[type].tone||'violet','small')}<span><small>${esc(ENTITY[type].label)} · ${linkedCount(type,item.id)} связей</small><b>${esc(title)}</b><p>${esc(searchSnippet(item,q))}</p></span><em>›</em></button>`).join('')||empty('Ничего не найдено.');
  }
  function searchSnippet(item,q){const values=Object.values(item||{}).filter(v=>typeof v==='string').join(' · ');if(!q)return values.slice(0,140);const idx=values.toLowerCase().indexOf(q);return values.slice(Math.max(0,idx-45),idx+100)||values.slice(0,140);}

  function createTask(title,note='',date=today(),extra={}){
    const state=ensureData(),task=Object.assign({id:uid(),title:clean(title)||'Новая задача',note:clean(note),date,status:'planned',priority:'medium',createdAt:nowIso(),updatedAt:nowIso()},extra); state.tasks=[task,...arr(state,'tasks')]; return task;
  }
  function addRelation(sourceType,sourceId,targetType,targetId,relationType='created_from'){
    const state=ensureData(); if(!state.knowledgeLinks.some(link=>link.sourceType===sourceType&&link.sourceId===sourceId&&link.targetType===targetType&&link.targetId===targetId))state.knowledgeLinks.push({id:uid(),sourceType,sourceId,targetType,targetId,relationType,createdAt:nowIso(),updatedAt:nowIso()});
  }
  function connectPending(targetType,targetId){
    if(!pendingLinkSource||pendingLinkSource.targetType!==targetType)return;
    addRelation(pendingLinkSource.sourceType,pendingLinkSource.sourceId,targetType,targetId,'related');
    pendingLinkSource=null;
  }
  function createTaskFrom(type,id,title,note){ const task=createTask(title,note); addRelation(type,id,'tasks',task.id,'created_from'); persist('Задача создана'); navigate('tasks'); }

  function openPersonEvent(personId){openModal('Событие в хронологии',`${field('Дата','v107_event_date',today(),'date')}${field('Название','v107_event_title','')}${field('Комментарий','v107_event_note','','textarea')}${formActions('save-person-event',personId)}`);}
  function savePersonEvent(personId){const person=entityBy('people',personId);if(!person)return;const title=val('v107_event_title');if(!title)return toast('Введите название события');person.timeline=Array.isArray(person.timeline)?person.timeline:[];person.timeline.unshift({id:uid(),date:val('v107_event_date')||today(),title,note:val('v107_event_note'),createdAt:nowIso()});person.updatedAt=nowIso();closeModal();persist('Событие добавлено');}

  function editPurchase(planId,itemId=''){
    const plan=entityBy('plans',planId); if(!plan)return;
    const item=purchaseItems(plan).find(entry=>entry.id===itemId)||{};
    openModal(itemId?'Редактировать покупку':'Добавить покупку',`<div class="v107-form-grid">${field('Название *','v108_purchase_title',item.title)}${field('Категория','v108_purchase_category',options([['home','Дом'],['tech','Техника'],['clothes','Одежда'],['travel','Поездка'],['gift','Подарок'],['food','Продукты'],['health','Здоровье'],['work','Работа'],['other','Другое']],item.category||'other'),'select')}${field('Плановый бюджет','v108_purchase_planned',item.plannedBudget??item.amount??'','number','min="0" step="0.01"')}${field('Фактическая сумма','v108_purchase_actual',item.actualAmount||'','number','min="0" step="0.01"')}${field('Дата покупки','v108_purchase_due',item.due,'date')}${field('Приоритет','v108_purchase_priority',options([['low','Низкий'],['medium','Средний'],['high','Высокий'],['critical','Критичный']],item.priority||'medium'),'select')}${field('Статус','v108_purchase_status',options([['planned','Запланировано'],['searching','Выбираю'],['ordered','Заказано'],['purchased','Куплено'],['paused','Отложено'],['cancelled','Отменено']],item.status||(item.done?'purchased':'planned')),'select')}${field('Ссылка','v108_purchase_url',item.url,'url')}</div>${field('Комментарий','v108_purchase_note',item.note,'textarea')}${formActions('save-purchase',planId)}<input id="v108_purchase_id" type="hidden" value="${esc(itemId)}">`,true);
  }
  function savePurchase(planId){
    const plan=entityBy('plans',planId);if(!plan)return;
    const title=val('v108_purchase_title');if(!title)return toast('Введите название покупки');
    const block=purchaseBlock(plan,true),itemId=val('v108_purchase_id'),old=block.items.find(item=>item.id===itemId),status=val('v108_purchase_status')||'planned';
    const item=Object.assign({},old||{},{id:old?.id||uid(),title,category:val('v108_purchase_category')||'other',plannedBudget:num(val('v108_purchase_planned')),amount:num(val('v108_purchase_planned')),actualAmount:num(val('v108_purchase_actual')),due:val('v108_purchase_due'),priority:val('v108_purchase_priority')||'medium',status,note:val('v108_purchase_note'),url:val('v108_purchase_url'),done:status==='purchased',updatedAt:nowIso(),createdAt:old?.createdAt||nowIso()});
    block.items=old?block.items.map(entry=>entry.id===old.id?item:entry):[item,...block.items];
    plan.updatedAt=nowIso();closeModal();persist(old?'Покупка обновлена':'Покупка добавлена');
  }
  function togglePurchase(planId,itemId){const plan=entityBy('plans',planId),item=purchaseItems(plan).find(entry=>entry.id===itemId);if(!item)return;const completed=item.status==='purchased'||item.done;item.status=completed?'planned':'purchased';item.done=!completed;if(!completed&&!num(item.actualAmount))item.actualAmount=num(item.plannedBudget??item.amount);item.updatedAt=nowIso();plan.updatedAt=nowIso();persist(completed?'Покупка возвращена в план':'Покупка отмечена');}
  function deletePurchase(planId,itemId){const plan=entityBy('plans',planId),block=purchaseBlock(plan);if(!block)return;if(!confirm('Удалить покупку из списка?'))return;block.items=block.items.filter(item=>item.id!==itemId);plan.updatedAt=nowIso();persist('Покупка удалена');}
  function addPlanBlock(planId){
    openModal('Добавить блок',`${field('Тип блока','v107_block_type',options(Object.entries(PLAN_BLOCKS),''),'select')}${field('Название','v107_block_title','')}${formActions('save-plan-block',planId)}`);
  }
  function savePlanBlock(planId){const plan=entityBy('plans',planId);if(!plan)return;const type=val('v107_block_type')||'notes',title=val('v107_block_title')||PLAN_BLOCKS[type];plan.blocks=Array.isArray(plan.blocks)?plan.blocks:[];plan.blocks.push({id:uid(),type,title,collapsed:false,items:[]});plan.updatedAt=nowIso();closeModal();persist('Блок добавлен');}
  function addPlanItem(planId,blockId){const plan=entityBy('plans',planId),block=plan?.blocks?.find(x=>x.id===blockId);if(!block)return;if(block.type==='purchases')return editPurchase(planId);openModal(`Добавить: ${block.title}`,`${field('Название','v107_item_title','')}${['purchases'].includes(block.type)?field('Сумма','v107_item_amount','','number','min="0"'):''}${['purchases','links','bookings','documents'].includes(block.type)?field('Ссылка','v107_item_url','','url'):''}${field('Комментарий','v107_item_note','','textarea')}${formActions('save-plan-item',planId)}<input id="v107_item_block" type="hidden" value="${esc(blockId)}">`);}
  function savePlanItem(planId){const plan=entityBy('plans',planId),block=plan?.blocks?.find(x=>x.id===val('v107_item_block'));if(!block)return;const title=val('v107_item_title');if(!title)return toast('Введите название пункта');block.items=Array.isArray(block.items)?block.items:[];block.items.push({id:uid(),title,note:val('v107_item_note'),amount:num(val('v107_item_amount')),url:val('v107_item_url'),done:false,createdAt:nowIso()});plan.updatedAt=nowIso();closeModal();persist('Пункт добавлен');}

  function deleteEntity(type,id){
    const state=ensureData(),meta=ENTITY[type],item=entityBy(type,id); if(!meta||!item)return;
    if(!confirm(`Удалить «${meta.title(item)}»? Связи будут удалены, остальные записи останутся.`))return;
    state[meta.collection]=arr(state,meta.collection).filter(x=>x.id!==id); removeEntityLinks(type,id); persist('Запись удалена'); navigate({people:'people',notes:'notes',ideas:'ideas',personal:'personal',learning:'learning',plans:'planner'}[type]||'information');
  }

  function savePolinaDay(){
    const state=ensureData(),date=val('v72_day_date')||today(),existing=state.polinaDays.find(x=>x.date===date)||{},id=document.querySelector('[data-v107-action="save-polina-day"]')?.dataset.id||existing.id||uid();
    const entry=Object.assign({},existing,{id,date,status:document.querySelector('input[name="v72_status"]:checked')?.value||'',comment:val('v72_day_comment'),periodMarker:val('v72_period_marker'),mood:val('v107_polina_mood'),energy:Math.max(0,Math.min(10,num(val('v107_polina_energy')))),discomfort:Math.max(0,Math.min(10,num(val('v107_polina_discomfort')))),sleep:val('v107_polina_sleep'),stress:Math.max(0,Math.min(10,num(val('v107_polina_stress')))),symptoms:list(val('v107_polina_symptoms')),helped:val('v107_polina_helped'),notHelped:val('v107_polina_not_helped'),supportNeeded:val('v107_polina_support'),request:val('v107_polina_request'),plans:val('v107_polina_plans'),reminder:val('v107_polina_reminder'),updatedAt:nowIso(),createdAt:existing.createdAt||nowIso()});
    state.polinaDays=state.polinaDays.filter(x=>x.id!==id&&x.date!==date); if(Object.values(entry).some(Boolean))state.polinaDays.push(entry);state.polinaDays.sort((a,b)=>String(b.date).localeCompare(String(a.date)));closeModal();persist('Состояние Полины сохранено');navigate('polina');
  }
  async function pinHash(value){const data=new TextEncoder().encode(String(value||''));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
  function setupPolinaLock(){openModal('Защита раздела',`${field('Новый PIN, минимум 4 цифры','v107_polina_pin','','password','inputmode="numeric" minlength="4"')}${field('Повторите PIN','v107_polina_pin_repeat','','password','inputmode="numeric" minlength="4"')}<div class="v107-modal-actions"><button class="v78-primary" data-v107-action="save-polina-lock">Сохранить PIN</button><button data-v107-action="close-modal">Отмена</button></div>`);}
  async function savePolinaLock(){const pin=val('v107_polina_pin'),repeat=val('v107_polina_pin_repeat');if(!/^\d{4,12}$/.test(pin))return toast('PIN должен содержать от 4 до 12 цифр');if(pin!==repeat)return toast('PIN не совпадает');const state=ensureData();state.settings.v107.polinaPinHash=await pinHash(pin);sessionStorage.setItem('secondBrainOS.v107.polinaUnlocked','1');closeModal();persist('PIN сохранён');}
  async function unlockPolina(){const pin=val('v107_polina_unlock_pin'),state=ensureData();if(await pinHash(pin)!==state.settings.v107.polinaPinHash)return toast('Неверный PIN');sessionStorage.setItem('secondBrainOS.v107.polinaUnlocked','1');renderBase();setTimeout(()=>scheduleRender(true),30);}
  function removePolinaLock(){if(!confirm('Убрать PIN-защиту раздела?'))return;const state=ensureData();state.settings.v107.polinaPinHash='';sessionStorage.removeItem('secondBrainOS.v107.polinaUnlocked');persist('PIN-защита отключена');}
  function exportPolina(){const state=ensureData();if(state.settings.v107.confirmPolinaExport&&!confirm('Экспортировать личные записи «Состояние Полины» отдельным JSON-файлом?'))return;const payload={version:108,exportedAt:nowIso(),polinaDays:state.polinaDays,cycleSettings:state.settings.polinaCycle||{}};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`polina-state-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Экспорт подготовлен');}

  function handleAction(button,event){
    const action=button.dataset.v107Action,id=button.dataset.id||'',type=button.dataset.type||'';
    if(!action)return false;
    if(action==='close-modal'){closeModal();return true;}
    if(action==='open-global-search'){openGlobalSearch();return true;}
    if(action==='open-quick-create'){openQuickCreate();return true;}
    if(action==='edit-person'){closeModal();editPerson(id);return true;}
    if(action==='save-person'){savePerson(id);return true;}
    if(action==='edit-note'){closeModal();editNote(id);return true;}
    if(action==='save-note'){saveNote(id);return true;}
    if(action==='edit-idea'){closeModal();editIdea(id);return true;}
    if(action==='save-idea'){saveIdea(id);return true;}
    if(action==='edit-memory'){closeModal();editMemory(id);return true;}
    if(action==='save-memory'){saveMemory(id).catch(error=>toast(error?.message||'Не удалось сохранить фото'));return true;}
    if(action==='edit-learning'){closeModal();editLearning(id);return true;}
    if(action==='save-learning'){saveLearning(id);return true;}
    if(action==='edit-plan'){closeModal();editPlan(id);return true;}
    if(action==='save-plan'){savePlan(id);return true;}
    if(action==='open-link'){openLink(type||routeType(routeNow()),id||routeId(routeNow()));return true;}
    if(action==='save-link'){saveLink(button.dataset.sourceType,button.dataset.sourceId);return true;}
    if(action==='remove-link'){const state=ensureData();state.knowledgeLinks=state.knowledgeLinks.filter(x=>x.id!==id);persist('Связь удалена');return true;}
    if(action==='delete-entity'){deleteEntity(type,id);return true;}
    if(action==='note-to-task'){const item=entityBy('notes',id);createTaskFrom('notes',id,item?.nextAction||`По заметке: ${item?.title}`,item?.mainInsight||item?.text);return true;}
    if(action==='idea-to-task'){const item=entityBy('ideas',id);createTaskFrom('ideas',id,item?.experiment||`Проверить идею: ${item?.title}`,item?.description);return true;}
    if(action==='idea-to-goal'){const state=ensureData(),item=entityBy('ideas',id),goal={id:uid(),title:item?.title||'Новая цель',why:item?.expectedResult||item?.problem||'',nextAction:item?.experiment||'',status:'active',type:'result',stages:[],habitIds:[],createdAt:nowIso(),updatedAt:nowIso()};state.goals=[goal,...arr(state,'goals')];addRelation('ideas',id,'goals',goal.id,'created_from');persist('Цель создана');navigate(`goal-${goal.id}`);return true;}
    if(action==='idea-to-plan'){const item=entityBy('ideas',id),state=ensureData(),plan={id:uid(),title:item?.title||'План идеи',type:'project',why:item?.problem||'',outcome:item?.expectedResult||'',nextAction:item?.experiment||'',status:'planned',priority:'medium',budget:num(item?.budget),actualSpend:0,participants:[],documents:[],externalLinks:[],notes:item?.description||'',risks:item?.risks||'',blocks:templateBlocks('project'),archivedBlocks:[],createdAt:nowIso(),updatedAt:nowIso()};state.lifePlans.unshift(plan);addRelation('ideas',id,'plans',plan.id,'created_from');persist('План создан');navigate(`plan-${plan.id}`);return true;}
    if(action==='learning-to-task'){const item=entityBy('learning',id);createTaskFrom('learning',id,item?.practiceAction||`Применить: ${item?.title}`,item?.conclusion||item?.summary);return true;}
    if(action==='learning-repeat-7'){const item=entityBy('learning',id);if(item){const d=new Date();d.setDate(d.getDate()+7);item.reviewDate=d.toISOString().slice(0,10);item.status='review';item.updatedAt=nowIso();createTask(`Повторить: ${item.title}`,item.conclusion,item.reviewDate,{sourceLearningId:id});persist('Повторение запланировано');}return true;}
    if(action==='memory-view'){const state=ensureData();state.settings.v107.memoryView=button.dataset.view||'timeline';persist('',false);scheduleRender(true);return true;}
    if(action==='add-person-event'){openPersonEvent(id);return true;}
    if(action==='save-person-event'){savePersonEvent(id);return true;}
    if(action==='delete-person-event'){const person=entityBy('people',button.dataset.person);if(person){person.timeline=(person.timeline||[]).filter(x=>x.id!==button.dataset.event);persist('Событие удалено');}return true;}
    if(action==='create-person-reminder'){const person=entityBy('people',id),date=person?.nextContact||today(),task=createTask(`Связаться: ${person?.name}`,person?.currentContext||person?.note,date,{personId:id});addRelation('people',id,'tasks',task.id,'next_action');persist('Напоминание создано');navigate('calendar');return true;}
    if(action==='add-purchase'){editPurchase(id);return true;}
    if(action==='edit-purchase'){editPurchase(id,button.dataset.item);return true;}
    if(action==='save-purchase'){savePurchase(id);return true;}
    if(action==='toggle-purchase'){togglePurchase(id,button.dataset.item);return true;}
    if(action==='delete-purchase'){deletePurchase(id,button.dataset.item);return true;}
    if(action==='add-plan-block'){addPlanBlock(id);return true;}
    if(action==='save-plan-block'){savePlanBlock(id);return true;}
    if(action==='toggle-plan-block'){const plan=entityBy('plans',id),block=plan?.blocks?.find(x=>x.id===button.dataset.block);if(block){block.collapsed=!block.collapsed;persist('',false);scheduleRender(true);}return true;}
    if(action==='move-plan-block'){const plan=entityBy('plans',id),index=plan?.blocks?.findIndex(x=>x.id===button.dataset.block),next=index+num(button.dataset.delta);if(plan&&index>=0&&next>=0&&next<plan.blocks.length){[plan.blocks[index],plan.blocks[next]]=[plan.blocks[next],plan.blocks[index]];persist('',false);scheduleRender(true);}return true;}
    if(action==='delete-plan-block'){const plan=entityBy('plans',id),index=plan?.blocks?.findIndex(x=>x.id===button.dataset.block);if(plan&&index>=0&&confirm('Скрыть этот блок? Его можно восстановить.')){plan.archivedBlocks=Array.isArray(plan.archivedBlocks)?plan.archivedBlocks:[];plan.archivedBlocks.push(plan.blocks.splice(index,1)[0]);persist('Блок скрыт');}return true;}
    if(action==='restore-plan-block'){const plan=entityBy('plans',id),block=plan?.archivedBlocks?.pop();if(plan&&block){plan.blocks.push(block);persist('Блок восстановлен');}return true;}
    if(action==='add-plan-item'){addPlanItem(id,button.dataset.block);return true;}
    if(action==='save-plan-item'){savePlanItem(id);return true;}
    if(action==='toggle-plan-item'){if(event.target.closest('[data-v107-stop],button'))return true;const plan=entityBy('plans',id),block=plan?.blocks?.find(x=>x.id===button.dataset.block),item=block?.items?.find(x=>x.id===button.dataset.item);if(item){item.done=!item.done;persist('',false);scheduleRender(true);}return true;}
    if(action==='delete-plan-item'){const plan=entityBy('plans',id),block=plan?.blocks?.find(x=>x.id===button.dataset.block);if(block){block.items=block.items.filter(x=>x.id!==button.dataset.item);persist('Пункт удалён');}return true;}
    if(action==='create-plan-task'){const plan=entityBy('plans',id),task=createTask(plan?.nextAction||`Следующий шаг: ${plan?.title}`,plan?.why||'',plan?.due||today(),{planId:id});addRelation('plans',id,'tasks',task.id,'next_action');persist('Задача создана');navigate('calendar');return true;}
    if(action==='edit-polina-state'){openPolinaEditor(button.dataset.date||today());return true;}
    if(action==='save-polina-entry'){savePolinaEntry(id);return true;}
    if(action==='save-polina-day'){savePolinaDay();return true;}
    if(action==='setup-polina-lock'){setupPolinaLock();return true;}
    if(action==='save-polina-lock'){savePolinaLock().catch(()=>toast('Не удалось сохранить PIN'));return true;}
    if(action==='unlock-polina'){unlockPolina().catch(()=>toast('Не удалось проверить PIN'));return true;}
    if(action==='lock-polina-now'){sessionStorage.removeItem('secondBrainOS.v107.polinaUnlocked');renderBase();setTimeout(()=>scheduleRender(true),30);return true;}
    if(action==='remove-polina-lock'){removePolinaLock();return true;}
    if(action==='export-polina'){exportPolina();return true;}
    if(action==='create-linked-entity'){const target=val('v107_link_type');pendingLinkSource={sourceType:button.dataset.sourceType,sourceId:button.dataset.sourceId,targetType:target};closeModal();({people:editPerson,notes:editNote,ideas:editIdea,plans:editPlan,learning:editLearning,personal:editMemory}[target]||openQuickCreate)();return true;}
    return false;
  }

  function routeType(route){if(route.startsWith('person-'))return'people';if(route.startsWith('note-'))return'notes';if(route.startsWith('idea-'))return'ideas';if(route.startsWith('memory-'))return'personal';if(route.startsWith('learning-item-'))return'learning';if(route.startsWith('plan-'))return'plans';return'';}
  function routeId(route){const type=routeType(route);return type==='people'?route.slice(7):type==='notes'?route.slice(5):type==='ideas'?route.slice(5):type==='personal'?route.slice(7):type==='learning'?route.slice(14):type==='plans'?route.slice(5):'';}

  document.addEventListener('error',event=>{
    const image=event.target;
    if(!(image instanceof HTMLImageElement))return;
    if(image.matches('[data-v107-avatar-fallback]')){const span=document.createElement('span');span.textContent=image.dataset.v107AvatarFallback||'?';image.replaceWith(span);return;}
    if(image.matches('[data-v107-memory-image]')){const fallback=document.createElement('div');fallback.className='v107-memory-fallback';fallback.textContent='◇';image.replaceWith(fallback);}
  },true);

  document.addEventListener('click',event=>{
    const legacyPolina=event.target.closest?.('[data-v79-action="open-polina-day"],[data-v72-action="open-day"]');
    if(legacyPolina&&routeNow()==='polina'){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openPolinaEditor(legacyPolina.dataset.date||today());return;}
    if(event.target.closest?.('[data-v107-stop]'))return;
    const routeButton=event.target.closest?.('[data-v107-info-route]');
    if(routeButton){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();navigate(routeButton.dataset.v107InfoRoute);return;}
    const button=event.target.closest?.('[data-v107-action]'); if(!button)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    try{handleAction(button,event);}catch(error){console.error('[V107 action]',error);toast(error?.message||'Не удалось выполнить действие');}
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&document.getElementById('modal')?.classList.contains('show')){event.preventDefault();closeModal();return;}
    const row=event.target.closest?.('.v107-check-row[data-v107-action="toggle-plan-item"]');
    if(row&&(event.key==='Enter'||event.key===' ')){event.preventDefault();row.click();}
  },true);
  document.addEventListener('input',event=>{
    if(event.target.id==='v107_link_search')updateLinkTargets(document.querySelector('[data-v107-action="save-link"]')?.dataset.sourceType,document.querySelector('[data-v107-action="save-link"]')?.dataset.sourceId);
    if(event.target.id==='v107_global_search')updateGlobalSearch(event.target.value);
    if(event.target.matches('[data-v107-filter-input]')){const q=event.target.value.toLowerCase();document.querySelectorAll('.v107-filter-grid [data-v107-filter-card]').forEach(card=>card.hidden=!card.textContent.toLowerCase().includes(q));}
  },true);
  document.addEventListener('change',event=>{
    if(event.target.id==='v107_link_type')updateLinkTargets(document.querySelector('[data-v107-action="save-link"]')?.dataset.sourceType,document.querySelector('[data-v107-action="save-link"]')?.dataset.sourceId);
    if(event.target.matches('[data-v107-status-filter]')){const value=event.target.value;document.querySelectorAll('.v107-filter-grid [data-v107-filter-card]').forEach(card=>card.hidden=Boolean(value&&card.dataset.status!==value));}
    if(event.target.matches('[data-v107-setting]')){const state=ensureData();state.settings.v107[event.target.dataset.v107Setting]=event.target.checked;persist('Настройка сохранена',false);}
    if(event.target.id==='v72_day_date'){const form=document.querySelector('.v72-modal-form');form?.querySelector('details.v107-advanced')?.remove();if(form)form.dataset.v107Extended='false';setTimeout(injectPolinaModal,0);}
  },true);
  document.getElementById('modal')?.addEventListener('mousedown',event=>{if(event.target.id==='modal')closeModal();});

  const observer=new MutationObserver(records=>{
    if(records.some(record=>record.addedNodes.length)){scheduleRender(false);setTimeout(injectPolinaModal,0);}
  });
  async function boot(){
    const rawState=stateNow();
    const needsMigration=Boolean(rawState&&!rawState?.settings?.v107?.migratedAt);
    if(needsMigration){
      try{
        const backupAttempt=Promise.resolve(window.SecondBrainBackup?.create?.({reason:'automatic-before-v108-information-actions'})).catch(error=>console.warn('[V107 backup]',error));
        await Promise.race([backupAttempt,new Promise(resolve=>setTimeout(resolve,900))]);
      }catch(error){console.warn('[V107 backup]',error);}
    }
    const migratedState=ensureData();
    if(migratedState && !migratedState.settings.v107.migratedAt){migratedState.settings.v107.migratedAt=nowIso();window.save?.();}
    observer.observe(document.getElementById('app')||document.documentElement,{childList:true,subtree:true});
    observer.observe(document.getElementById('modal')||document.body,{childList:true,subtree:true});
    window.addEventListener('hashchange',()=>setTimeout(()=>scheduleRender(true),15));
    window.addEventListener('second-brain-booted',()=>{ensureData();scheduleRender(true);});
    customizeGlobalSearch();scheduleRender(true);setTimeout(()=>scheduleRender(true),180);
    window.SecondBrainInformationV107={ensureData,render:()=>renderOwned(true),navigate,search:updateGlobalSearch};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
