/* Second Brain OS V97 — non-destructive pre-update backup. */
'use strict';
(() => {
  const STORE_KEY='secondBrainOS.v1';
  const build=window.SecondBrainBuild||{major:97,id:'second-brain-os-v97',label:'V97'};
  const MARKER_KEY=`secondBrainOS.v${build.major}.backupCreated`;
  const RAW_BACKUP_KEY=`secondBrainOS.v${build.major}.rawLocalBackup`;
  const DB_NAME='SecondBrainOSDurableStorage';
  const DB_STORE='records';
  const status={attempted:false,created:false,createdAt:'',error:'',counts:{}};
  const openDb=()=>new Promise((resolve,reject)=>{try{const request=indexedDB.open(DB_NAME);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DB_STORE))request.result.createObjectStore(DB_STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB недоступна'));}catch(error){reject(error)}});
  const put=async(key,value)=>{const db=await openDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Не удалось сохранить backup'));tx.onabort=()=>reject(tx.error||new Error('Backup отменён'));});}finally{db.close()}};
  const counts=state=>{const out={};if(!state||typeof state!=='object')return out;for(const [key,value] of Object.entries(state))if(Array.isArray(value))out[key]=value.length;return out};
  async function create(){status.attempted=true;try{const existing=localStorage.getItem(MARKER_KEY);if(existing){status.created=true;status.createdAt=existing;return {...status,reused:true}}let raw=localStorage.getItem(STORE_KEY);let parsed=null;if(raw){try{parsed=JSON.parse(raw)}catch(_){parsed=null}}else{const live=window.SecondBrainApp?.getState?.()||window.state||null;if(live&&typeof live==='object'&&Object.keys(live).length){parsed=live;try{raw=JSON.stringify(live)}catch(_){raw=null}}}if(!raw){status.error='Данные ещё не загружены';return {...status,retryable:true}}const createdAt=new Date().toISOString();status.counts=counts(parsed);if(raw.length<=1500000&&!localStorage.getItem(RAW_BACKUP_KEY))localStorage.setItem(RAW_BACKUP_KEY,raw);await put(`backup:v${build.major}-before-update:${createdAt}`,{version:build.major,buildId:build.id,dataSchemaVersion:parsed?.schemaVersion||1,createdAt,reason:`automatic-before-${build.id}`,sourceKey:STORE_KEY,raw,counts:status.counts});localStorage.setItem(MARKER_KEY,createdAt);status.created=true;status.createdAt=createdAt;window.dispatchEvent(new CustomEvent('second-brain-backup-created',{detail:{createdAt,counts:status.counts}}));return {...status};}catch(error){status.error=error?.message||String(error);console.warn('[Second Brain V97 backup]',error);return {...status}}}
  window.SecondBrainBackup={create,getStatus:()=>({...status})};
  const schedule=()=>{setTimeout(create,350);setTimeout(()=>{if(!status.created)create()},1800);setTimeout(()=>{if(!status.created)create()},5000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
