import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const checks=[];
const check=(name,fn)=>{try{const detail=fn();checks.push({name,ok:true,detail:detail??''});}catch(error){checks.push({name,ok:false,detail:error.message});}};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const index=read('index.html');

check('index.html существует',()=>assert(index.includes('<!doctype html>'),'doctype отсутствует'));
check('единая версия V96 подключена первой',()=>assert(index.indexOf('src/app/version.js?v=v96-r1')<index.indexOf('<body'),'version.js должен быть в head'));
check('основной ключ данных не изменён',()=>assert(index.includes("secondBrainOS.v1")&&read('src/storage/backup.js').includes("secondBrainOS.v1"),'ключ данных не найден'));
check('дублирующий CSS V91 удалён',()=>assert((index.match(/styles-v91-stability\.css/g)||[]).length===1,'styles-v91 подключён не один раз'));
check('V93 CSS загружается в head',()=>assert(index.indexOf('styles-v93-assistant.css')<index.indexOf('</head>'),'V93 CSS не в head'));
check('Firebase SDK не загружается без настройки',()=>assert(!index.includes('gstatic.com/firebasejs'),'Firebase SDK всё ещё подключён безусловно'));
check('cloud-sync.js является JavaScript',()=>assert(read('cloud-sync.js').startsWith("'use strict';"),'cloud-sync не JS'));
check('cloud UI не собирает пароль без конфигурации',()=>assert(index.includes('Синхронизация отключена.')&&index.includes('cloud.configured?'),'нет безопасного состояния cloud UI'));
check('Firestore rules owner-only',()=>{const rules=read('firestore.rules');assert(rules.includes('request.auth.uid == userId'),'нет owner-only правила');assert(rules.includes("rules_version = '2'"),'нет rules v2');});
check('firebase.json валиден',()=>JSON.parse(read('firebase.json')));
check('manifest валиден',()=>{const data=JSON.parse(read('manifest.webmanifest'));assert(data.version==='96.0.0','не V96');assert(data.start_url.includes('v=96'),'start_url не V96');});
check('version.json валиден',()=>{const data=JSON.parse(read('version.json'));assert(data.version==='96.0.0','версия неверна');});
check('Service Worker использует V96 cache',()=>assert(read('sw.js').includes("second-brain-os-v96-stable-core-r1"),'cache V96 отсутствует'));
check('Service Worker удаляет только кэши приложения',()=>{const sw=read('sw.js');assert(sw.includes('key.startsWith(CACHE_PREFIX)'),'нет фильтра префикса');assert(!sw.includes('key!==CACHE_NAME).map(key=>caches.delete(key))')||sw.includes('startsWith(CACHE_PREFIX)'), 'опасное удаление кэша');});
check('index cache-clear удаляет только кэши приложения',()=>assert(index.includes("filter(k=>k.startsWith('second-brain-os-'))"),'опасная очистка кэша в UI'));
check('index.html входит в precache',()=>assert(read('sw.js').includes("'./index.html'"),'index.html не в precache'));
check('обновление PWA требует подтверждения',()=>{const pwa=read('pwa-v88.js');assert(pwa.includes("registration.waiting.postMessage({type:'SKIP_WAITING'})"),'нет applyUpdate');assert(!read('sw.js').includes("install',event=>{self.skipWaiting"),'skipWaiting на install остался');});
check('backup V96 пишет снимок в IndexedDB',()=>{const code=read('src/storage/backup.js');assert(code.includes('backup:v96-before-stable-core'),'ключ backup отсутствует');assert(code.includes('indexedDB.open'),'IndexedDB backup отсутствует');});
check('диагностика не включает содержимое личных записей',()=>{const code=read('src/app/bootstrap.js');assert(code.includes('counts'),'counts отсутствуют');assert(!code.includes('rawLocalBackup'),'диагностика читает raw backup');});
check('нет открытых Firebase API keys',()=>{
 const files=[];
 const walk=dir=>{for(const name of fs.readdirSync(dir)){if(['.git','node_modules'].includes(name)||name==='qa-v96-static.mjs'||name.endsWith('.patch'))continue;const full=path.join(dir,name);const st=fs.statSync(full);if(st.isDirectory())walk(full);else if(!/\.(png|jpg|jpeg|webp|zip)$/i.test(name))files.push(full);}};walk(root);
 for(const file of files){const text=fs.readFileSync(file,'utf8');assert(!text.includes('AIzaSy'),`ключ найден: ${path.relative(root,file)}`);}
});
check('активные локальные ресурсы существуют',()=>{
 const refs=[...index.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)].map(m=>m[1]).filter(ref=>!/^https?:|^data:|^#/.test(ref)&&!ref.includes('${'));
 const missing=[...new Set(refs)].filter(ref=>!fs.existsSync(path.join(root,ref)));
 assert(!missing.length,`не найдены: ${missing.join(', ')}`);
 return `${new Set(refs).size} ресурсов`;
});
check('inline JavaScript index.html проходит node --check',()=>{
 const blocks=[...index.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match=>!/[\s]src=/.test(match[1])).map(match=>match[2]).filter(code=>code.trim());
 const temp=path.join(root,'.qa-v96-inline.js');
 for(const [i,code] of blocks.entries()){fs.writeFileSync(temp,code);const r=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});assert(r.status===0,`inline ${i+1}: ${r.stderr}`);}
 if(fs.existsSync(temp))fs.unlinkSync(temp);
 return `${blocks.length} блоков`;
});
check('в активном runtime нет старой публичной версии',()=>{
 const active=[index,read('pwa-v88.js'),read('sw.js'),read('app-v91-stability.js'),read('app-v93-assistant.js')].join('\n');
 assert(!active.includes('V95 · FINANCE ACTIVE'),'остался V95 label');
 assert(!active.includes('second-brain-space-v95-finance-active'),'остался V95 build id');
});
check('активные JS файлы проходят node --check',()=>{
 const files=['cloud-sync.js','pwa-v88.js','sw.js','app-v91-stability.js','app-v93-assistant.js','src/app/version.js','src/storage/backup.js','src/app/bootstrap.js'];
 for(const file of files){const r=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});assert(r.status===0,`${file}: ${r.stderr}`);}
 return `${files.length} файлов`;
});
check('cloud module корректно отключён без конфигурации',async()=>{
 const storage=new Map();
 const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
 const sandbox={console,localStorage,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},document:{scripts:[],head:{appendChild(){}},createElement(){return{};}},window:{dispatchEvent(){},SecondBrainApp:{render(){},toast(){}}},setTimeout,clearTimeout,confirm:()=>false};
 sandbox.window.window=sandbox.window;sandbox.window.localStorage=localStorage;
 vm.runInNewContext(read('cloud-sync.js'),sandbox,{filename:'cloud-sync.js'});
 const status=await sandbox.window.SecondBrainCloud.init();
 assert(status.configured===false,'cloud ошибочно configured');
 assert(status.status==='Синхронизация не настроена','нечестный cloud status');
});
check('публичный build label V96',()=>{assert(index.includes('V96 · STABLE CORE'),'label V96 отсутствует');assert(read('sbos-build.txt').includes('Second Brain OS V96'),'sbos-build старый');});

for(const item of checks){if(item.detail instanceof Promise){try{item.detail=await item.detail;}catch(error){item.ok=false;item.detail=error.message;}}}
const passed=checks.filter(x=>x.ok).length;
console.log(`Second Brain OS V96 static QA: ${passed}/${checks.length}`);
for(const item of checks)console.log(`${item.ok?'PASS':'FAIL'} | ${item.name}${item.detail?` | ${item.detail}`:''}`);
if(passed!==checks.length)process.exit(1);
