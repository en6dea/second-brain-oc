/* Second Brain OS V113 — Pair Month Experience. */
'use strict';
((root) => {
  const build = Object.freeze({
    version: '113.0.0',
    major: 113,
    label: 'V113 · PAIR MONTH EXPERIENCE',
    id: 'second-brain-os-v113-pair-month-experience-20260804-r1',
    dataSchemaVersion: 5,
    cacheVersion: 'v113-r1',
    cacheName: 'second-brain-os-v113-pair-month-experience-r1',
    builtAt: '2026-08-04T12:21:00+03:00',
    criticalFiles: [
      './index.html','./offline.html','./manifest.webmanifest','./version-v113.js','./compat-v104.js','./bootstrap-v104.js','./backup-v104.js',
      './styles-v104-full.css','./app-v104-full.js','./styles-v108-information-actions.css','./styles-v109-light-premium.css','./styles-v110-information-center.css','./styles-v111-couple-week.css','./app-v108-information-actions.js',
      './styles-v112-couple-random.css','./styles-v113-month-experience.css','./couple-challenges-v112.js','./app-v113-month-experience.js'
    ]
  });
  root.SecondBrainBuild = build;
  root.SECOND_BRAIN_BUILD = build;
  root.__secondBrainRuntimeErrors = root.__secondBrainRuntimeErrors || [];
  root.addEventListener?.('error', event => root.__secondBrainRuntimeErrors.push({type:'error',message:String(event?.message||event?.error?.message||'Unknown runtime error'),source:String(event?.filename||''),line:Number(event?.lineno||0),column:Number(event?.colno||0)}));
  root.addEventListener?.('unhandledrejection', event => root.__secondBrainRuntimeErrors.push({type:'unhandledrejection',message:String(event?.reason?.message||event?.reason||'Unhandled promise rejection')}));
  if(typeof document==='undefined')return;
  document.documentElement.dataset.sbosVersion=build.version;
  const apply=()=>{
    document.documentElement.classList.remove('v70-theme-dark','v80-dark','v87-dark','v88-dark');
    document.documentElement.classList.add('v70-theme-light','v80-light','v87-light','v88-light');
    document.documentElement.dataset.v104Theme='light';
    document.documentElement.style.colorScheme='light';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content',build.id);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#f4f7fb');
    if(document.body){document.body.dataset.sbosBuild=build.id;document.body.dataset.themeMode='light';}
    document.querySelectorAll('.v78-build,[data-sbos-build-label]').forEach(node=>{node.textContent=build.label;node.title=build.id;});
  };
  const start=()=>{apply();const observer=new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length))requestAnimationFrame(apply);});observer.observe(document.documentElement,{subtree:true,childList:true});root.addEventListener('second-brain-booted',apply);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof self!=='undefined'?self:globalThis);
