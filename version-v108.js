/* Second Brain OS V108.1 — universal planner and structured information hub. */
'use strict';
((root) => {
  const build = Object.freeze({
    version: '108.1.0',
    major: 108,
    label: 'V108.1 · UNIVERSAL PLANNER',
    id: 'second-brain-os-v108-universal-planner-20260803-r5',
    dataSchemaVersion: 2,
    cacheVersion: 'v108-r5',
    cacheName: 'second-brain-os-v108-universal-planner-r5',
    builtAt: '2026-08-03T12:00:00+03:00',
    criticalFiles: [
      './index.html',
      './offline.html',
      './manifest.webmanifest',
      './version-v108.js',
      './compat-v104.js',
      './bootstrap-v104.js',
      './backup-v104.js',
      './styles-v104-full.css',
      './app-v104-full.js',
      './styles-v108-information-actions.css',
      './app-v108-information-actions.js'
    ]
  });
  root.SecondBrainBuild = build;
  root.SECOND_BRAIN_BUILD = build;
  root.__secondBrainRuntimeErrors = root.__secondBrainRuntimeErrors || [];
  root.addEventListener?.('error', (event) => root.__secondBrainRuntimeErrors.push({type:'error',message:String(event?.message||event?.error?.message||'Unknown runtime error'),source:String(event?.filename||''),line:Number(event?.lineno||0),column:Number(event?.colno||0)}));
  root.addEventListener?.('unhandledrejection', (event) => root.__secondBrainRuntimeErrors.push({type:'unhandledrejection',message:String(event?.reason?.message||event?.reason||'Unhandled promise rejection')}));
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.sbosVersion = build.version;
  const apply = () => {
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', build.id);
    if (document.body) document.body.dataset.sbosBuild = build.id;
    document.querySelectorAll('.v78-build,[data-sbos-build-label]').forEach(node => { node.textContent=build.label; node.title=build.id; });
  };
  const start = () => {
    apply();
    const observer = new MutationObserver(records => { if(records.some(record=>record.addedNodes.length)) requestAnimationFrame(apply); });
    observer.observe(document.documentElement,{subtree:true,childList:true});
    root.addEventListener('second-brain-booted',apply);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof self !== 'undefined' ? self : globalThis);
