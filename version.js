/* Second Brain OS V116 — графики, табличные цифры, движение интерфейса. */
'use strict';
((root) => {
  const build = Object.freeze({
    version: '116.0.0',
    major: 116,
    label: 'V116 · ГРАФИКИ И ДВИЖЕНИЕ',
    id: 'second-brain-os-v116-charts-20260811-r5',
    dataSchemaVersion: 3,
    cacheVersion: 'v116-r5',
    cacheName: 'second-brain-os-v116-charts-r5',
    builtAt: '2026-08-11T12:00:00+03:00',
    criticalFiles: [
      './index.html',
      './offline.html',
      './manifest.webmanifest',
      './version.js',
      './styles.css',
      './styles-motion.css',
      './app.js',
      './app-charts.js'
    ]
  });
  root.SecondBrainBuild = build;
  root.SECOND_BRAIN_BUILD = build;
  root.__secondBrainRuntimeErrors = root.__secondBrainRuntimeErrors || [];
  root.addEventListener?.('error', event => root.__secondBrainRuntimeErrors.push({type: 'error', message: String(event?.message || event?.error?.message || 'Unknown runtime error'), source: String(event?.filename || ''), line: Number(event?.lineno || 0), column: Number(event?.colno || 0)}));
  root.addEventListener?.('unhandledrejection', event => root.__secondBrainRuntimeErrors.push({type: 'unhandledrejection', message: String(event?.reason?.message || event?.reason || 'Unhandled promise rejection')}));
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.sbosVersion = build.version;
  /* Темой владеет контроллер внешнего вида в app.js: он читает выбор
     пользователя и переключает таблицы стилей. Здесь тему не навязываем —
     иначе два механизма начинают спорить, и побеждает тот, кто отработал
     последним. Ставим только подписи сборки. */
  const apply = () => {
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', build.id);
    if (document.body) document.body.dataset.sbosBuild = build.id;
    document.querySelectorAll('.v78-build,[data-sbos-build-label]').forEach(node => { node.textContent = build.label; node.title = build.id; });
  };
  const start = () => {
    apply();
    const observer = new MutationObserver(records => { if (records.some(record => record.addedNodes.length)) requestAnimationFrame(apply); });
    observer.observe(document.documentElement, {subtree: true, childList: true});
    root.addEventListener('second-brain-booted', apply);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})(typeof self !== 'undefined' ? self : globalThis);
