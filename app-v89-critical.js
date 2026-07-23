'use strict';
/* Second Brain OS V89 — critical, non-destructive interaction runtime. */
(() => {
  const BUILD = 'V89 · CRITICAL STABILITY';
  const BACKUP_MARKER = 'secondBrainOS.v89.backupCreated';
  const STORE_KEY = 'secondBrainOS.v1';
  const DB_NAME = 'SecondBrainOSDurableStorage';
  const DB_STORE = 'records';
  const DB_MAIN = 'main-state';
  const SVG = {
    home:'M4 11.5 12 4l8 7.5M6 10.5V20h12v-9.5M10 20v-6h4v6',
    spark:'M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z',
    target:'M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0Zm4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0Zm4 0 7-7',
    wallet:'M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11ZM4 8h15M15 12h6v5h-6a2.5 2.5 0 1 1 0-5Z',
    habit:'M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0Zm4 0 2.5 2.5L16 9',
    calendar:'M3 6h18v15H3V6m5-3v6m8-6v6M3 11h18',
    note:'M5 3h10l4 4v14H5V3M14 3v5h5M8 12h8M8 16h6',
    book:'M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23V5.5Z',
    settings:'M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6Zm8 3 2-1-2-4-2 1-2-2 1-2-4-2-1 2-3 1v4l3 1 1 3-1 2 3 3 2-1 3 1v4l-3 1-2-1-3 3-2-1-3 1v-4l-3-1-1-3 1-2-3-3-2 1-3-1v-4l3-1 2 1 3-3 2 1 3-1v4l3 1 1 3-1 2 2 2Z',
    chart:'M4 20V10m6 10V4m6 16v-7m5 7H2',
    people:'M8 11a4 4 0 1 0 0-8 4 4 0 1 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 1 0 0 6ZM2 21a6 6 0 0 1 12 0m0 0a5 5 0 0 1 8 0',
    lock:'M6 10h12v11H6V10Zm3 0V7a3 3 0 0 1 6 0v3m-3 4v3'
  };
  const ROUTES = {
    today:['home','blue'],dashboard:['home','blue'],gamelife:['spark','violet'],goals:['target','amber'],
    finance:['wallet','green'],'finance-operations':['wallet','green'],'finance-analytics':['chart','green'],'finance-planning':['chart','cyan'],'finance-export':['chart','cyan'],debts:['wallet','coral'],
    habits:['habit','cyan'],calendar:['calendar','pink'],'review-queue':['note','coral'],information:['book','violet'],archive:['note','blue'],coach:['spark','amber'],system:['settings','blue'],
    people:['people','pink'],passwords:['lock','violet'],notes:['note','blue'],books:['book','amber']
  };
  let modalOpener = null;
  let dragTaskId = '';
  let observerQueued = false;

  const safe = (fn, ...args) => { try { return typeof fn === 'function' ? fn(...args) : undefined; } catch (error) { console.error('[V89]', error); return undefined; } };
  const toast = message => safe(window.toast, message);
  const clone = value => {
    try { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
    catch (_) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; } }
  };

  function dbPut(key,value){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB)return resolve(false);
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE);};
      request.onerror=()=>reject(request.error);
      request.onsuccess=()=>{const db=request.result;const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(value,key);tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=()=>{db.close();reject(tx.error);};};
    });
  }

  async function createSafetyBackup(){
    try{
      if(localStorage.getItem(BACKUP_MARKER))return;
      const createdAt=new Date().toISOString();
      const raw=localStorage.getItem(STORE_KEY);
      if(raw&&!localStorage.getItem('secondBrainOS.v89.rawLocalBackup'))localStorage.setItem('secondBrainOS.v89.rawLocalBackup',raw);
      const snapshot=clone(window.state||null);
      if(snapshot)await dbPut(`backup:v89-before-critical:${createdAt}`,{version:89,createdAt,reason:'automatic-before-v89-critical-stability',state:snapshot});
      localStorage.setItem(BACKUP_MARKER,createdAt);
    }catch(error){console.warn('[V89 backup]',error);}
  }

  function modalRoot(){
    const modal=document.getElementById('modal');
    if(!modal)return null;
    if(modal.parentElement!==document.body)document.body.appendChild(modal);
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-hidden',modal.classList.contains('show')?'false':'true');
    return modal;
  }
  function focusables(root){return [...root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);}
  function syncModal(){
    const modal=modalRoot();if(!modal)return;
    const open=modal.classList.contains('show');
    document.documentElement.classList.toggle('sbos-v89-modal-open',open);document.body.classList.toggle('sbos-v89-modal-open',open);
    modal.setAttribute('aria-hidden',open?'false':'true');
    if(open){
      if(!modalOpener)modalOpener=document.activeElement instanceof HTMLElement?document.activeElement:null;
      requestAnimationFrame(()=>{const autofocus=modal.querySelector('[autofocus]');const first=focusables(modal)[0];safe((autofocus||first)?.focus?.bind(autofocus||first),{preventScroll:true});});
    }else if(modalOpener){safe(modalOpener.focus?.bind(modalOpener),{preventScroll:true});modalOpener=null;}
  }
  function closeModalSafe(){safe(window.closeModal);const modal=modalRoot();modal?.classList.remove('show');syncModal();}
  function installModalManager(){
    modalRoot();
    const originalOpen=window.openModal;
    if(typeof originalOpen==='function'&&!originalOpen.__sbosV89){
      const wrapped=function(...args){modalOpener=document.activeElement instanceof HTMLElement?document.activeElement:null;const result=originalOpen.apply(this,args);modalRoot();syncModal();return result;};wrapped.__sbosV89=true;window.openModal=wrapped;
    }
    const originalClose=window.closeModal;
    if(typeof originalClose==='function'&&!originalClose.__sbosV89){
      const wrapped=function(...args){const result=originalClose.apply(this,args);syncModal();return result;};wrapped.__sbosV89=true;window.closeModal=wrapped;
    }
  }

  function routeMeta(route){return ROUTES[route]||ROUTES[String(route||'').split('-')[0]]||['spark','blue'];}
  function iconMarkup(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${SVG[name]||SVG.spark}"></path></svg>`;}
  function decorateNav(){
    document.querySelectorAll('.v78-side-link,.v78-top-tab,.v78-mobile-nav a').forEach(item=>{
      const route=String(item.dataset.v78Route||'');const [icon,tone]=routeMeta(route);const host=item.querySelector(':scope>i');if(!host)return;
      item.dataset.sbosTone=tone;
      const key=`${icon}:${tone}`;
      if(host.dataset.sbosV89Icon!==key){host.dataset.sbosV89Icon=key;host.classList.add('v883-icon-host');host.innerHTML=iconMarkup(icon);}
    });
  }

  function taskById(id){return (window.state?.tasks||[]).find(item=>String(item.id)===String(id));}
  function persistAndRender(message){safe(window.save);safe(window.renderPremium);if(message)toast(message);}
  function shiftDate(date,days){const d=new Date(`${date||new Date().toISOString().slice(0,10)}T12:00:00`);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
  function moveTask(id,{date,time}={}){
    const task=taskById(id);if(!task)return toast('Событие не найдено');
    if(date)task.date=date;if(time!==undefined)task.time=time;task.updatedAt=new Date().toISOString();persistAndRender('Событие перенесено');
  }
  function deleteTask(id){
    const task=taskById(id);if(!task)return toast('Событие не найдено');
    if(!window.confirm(`Удалить событие «${task.title||'Без названия'}»? Копия останется в архиве.`))return;
    if(typeof window.archiveSnapshot==='function')safe(window.archiveSnapshot,`Удалено: ${task.title||'Событие'}`,'deleted-task',task);
    else {
      window.state.archive=Array.isArray(window.state.archive)?window.state.archive:[];
      window.state.archive.unshift({id:`v89-archive-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title:`Удалено: ${task.title||'Событие'}`,date:new Date().toISOString().slice(0,10),type:'deleted-task',note:'Автоматическая архивная копия перед удалением из календаря',snapshot:clone(task),createdAt:new Date().toISOString()});
    }
    window.state.tasks=(window.state.tasks||[]).filter(item=>String(item.id)!==String(id));persistAndRender('Событие удалено, копия сохранена');
  }

  function decorateCalendar(){
    const page=document.querySelector('.v82-calendar-page');if(!page)return;
    if(!page.querySelector('.sbos-calendar-drag-hint')){
      const toolbar=page.querySelector('.v82-calendar-toolbar');
      const hint=document.createElement('div');hint.className='sbos-calendar-drag-hint';hint.innerHTML='<span>↕</span><span>Перетаскивайте события между днями. Открытие, изменение и удаление доступны в карточке.</span>';
      toolbar?.insertAdjacentElement('afterend',hint);
    }
    document.querySelectorAll('.v82-week-column').forEach((column,index)=>{
      const head=document.querySelectorAll('.v82-week-head button[data-date]')[index];if(head?.dataset.date)column.dataset.sbosCalendarDate=head.dataset.date;
    });
    document.querySelectorAll('.v82-month-calendar>div>article').forEach(article=>{const day=article.querySelector('header button[data-date]');if(day?.dataset.date)article.dataset.sbosCalendarDate=day.dataset.date;});
    document.querySelectorAll('.v82-time-row').forEach(row=>{const time=row.querySelector('time')?.textContent?.trim();if(time)row.dataset.sbosCalendarTime=time;});
    document.querySelectorAll('.v82-calendar-event').forEach(card=>{
      const edit=card.querySelector('[data-v79-action="edit-record"][data-type="task"]');const id=edit?.dataset.id||'';if(!id)return;
      card.draggable=true;card.dataset.sbosTaskId=id;card.setAttribute('aria-grabbed','false');
      const actions=card.querySelector('.v82-event-actions');if(!actions)return;
      let group=actions.querySelector('.sbos-calendar-inline-actions');
      if(!group){group=document.createElement('span');group.className='sbos-calendar-inline-actions';group.innerHTML=`<button data-sbos-v89-action="task-prev" data-id="${id}" type="button" title="На день раньше" aria-label="Перенести на день раньше">←</button><button data-sbos-v89-action="task-next" data-id="${id}" type="button" title="На день позже" aria-label="Перенести на день позже">→</button><button class="danger" data-sbos-v89-action="task-delete" data-id="${id}" type="button" title="Удалить" aria-label="Удалить событие">×</button>`;actions.appendChild(group);}
    });
  }

  function patchBuild(){const badge=document.querySelector('.v78-build');if(badge)badge.textContent=BUILD;document.body.dataset.sbosBuild='v89-critical-stability';}
  function stabilize(){patchBuild();installModalManager();syncModal();decorateNav();decorateCalendar();}
  function queueStabilize(){if(observerQueued)return;observerQueued=true;requestAnimationFrame(()=>{observerQueued=false;stabilize();});}

  document.addEventListener('click',event=>{
    const control=event.target.closest?.('[data-sbos-v89-action]');if(!control)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const id=control.dataset.id||'';const action=control.dataset.sbosV89Action;
    if(action==='task-prev')return moveTask(id,{date:shiftDate(taskById(id)?.date,-1)});
    if(action==='task-next')return moveTask(id,{date:shiftDate(taskById(id)?.date,1)});
    if(action==='task-delete')return deleteTask(id);
  },true);

  document.addEventListener('keydown',event=>{
    const modal=modalRoot();if(!modal?.classList.contains('show'))return;
    if(event.key==='Escape'){event.preventDefault();return closeModalSafe();}
    if(event.key==='Tab'){
      const items=focusables(modal);if(!items.length)return;const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  },true);
  document.addEventListener('pointerdown',event=>{const modal=modalRoot();if(modal?.classList.contains('show')&&event.target===modal){event.preventDefault();closeModalSafe();}},true);

  document.addEventListener('dragstart',event=>{
    const card=event.target.closest?.('.v82-calendar-event[data-sbos-task-id]');if(!card)return;dragTaskId=card.dataset.sbosTaskId||'';card.setAttribute('aria-grabbed','true');event.dataTransfer?.setData('text/plain',dragTaskId);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
  },true);
  document.addEventListener('dragend',event=>{event.target.closest?.('.v82-calendar-event')?.setAttribute('aria-grabbed','false');dragTaskId='';document.querySelectorAll('.sbos-calendar-drop-target').forEach(el=>el.classList.remove('sbos-calendar-drop-target'));},true);
  document.addEventListener('dragover',event=>{const target=event.target.closest?.('[data-sbos-calendar-date],[data-sbos-calendar-time]');if(!target||!dragTaskId)return;event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';document.querySelectorAll('.sbos-calendar-drop-target').forEach(el=>el!==target&&el.classList.remove('sbos-calendar-drop-target'));target.classList.add('sbos-calendar-drop-target');},true);
  document.addEventListener('dragleave',event=>{const target=event.target.closest?.('.sbos-calendar-drop-target');if(target&&!target.contains(event.relatedTarget))target.classList.remove('sbos-calendar-drop-target');},true);
  document.addEventListener('drop',event=>{
    const target=event.target.closest?.('[data-sbos-calendar-date],[data-sbos-calendar-time]');if(!target)return;event.preventDefault();target.classList.remove('sbos-calendar-drop-target');
    const id=dragTaskId||event.dataTransfer?.getData('text/plain');if(!id)return;
    const date=target.dataset.sbosCalendarDate||window.state?.settings?.v82?.calendarAnchor||new Date().toISOString().slice(0,10);
    const time=target.dataset.sbosCalendarTime;moveTask(id,{date,time:time||taskById(id)?.time||''});dragTaskId='';
  },true);

  const observer=new MutationObserver(queueStabilize);
  const modalObserver=new MutationObserver(()=>syncModal());
  function boot(){
    createSafetyBackup();setTimeout(createSafetyBackup,500);setTimeout(createSafetyBackup,1800);stabilize();observer.observe(document.documentElement,{childList:true,subtree:true});const modal=modalRoot();if(modal)modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
    setTimeout(stabilize,80);setTimeout(stabilize,250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
