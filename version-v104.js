/* Second Brain OS V104.2.0 — grounded daily command centre and connected weekly review. */
'use strict';
((root) => {
  const build = Object.freeze({
    version: '104.2.0',
    major: 104,
    label: 'V104.2.0 · QUIET LUXURY OS',
    id: 'second-brain-os-v104-quiet-luxury-20260730-r20',
    dataSchemaVersion: 1,
    cacheVersion: 'v104-r20',
    cacheName: 'second-brain-os-v104-quiet-luxury-r20',
    builtAt: '2026-07-30T07:42:51+03:00',
    criticalFiles: [
      './index.html',
      './offline.html',
      './manifest.webmanifest',
      './version-v104.js',
      './compat-v104.js',
      './bootstrap-v104.js',
      './backup-v104.js',
      './styles-v104-full.css',
      './app-v104-full.js'
    ]
  });

  root.SecondBrainBuild = build;
  root.SECOND_BRAIN_BUILD = build;
  root.__secondBrainRuntimeErrors = [];
  root.addEventListener?.('error', (event) => {
    root.__secondBrainRuntimeErrors.push({
      type: 'error',
      message: String(event?.message || event?.error?.message || 'Unknown runtime error'),
      source: String(event?.filename || ''),
      line: Number(event?.lineno || 0),
      column: Number(event?.colno || 0)
    });
  });
  root.addEventListener?.('unhandledrejection', (event) => {
    root.__secondBrainRuntimeErrors.push({
      type: 'unhandledrejection',
      message: String(event?.reason?.message || event?.reason || 'Unhandled promise rejection')
    });
  });

  if (typeof document === 'undefined') return;
  document.documentElement.dataset.sbosVersion = build.version;

  const apply = (node = document) => {
    const meta = document.querySelector('meta[name="second-brain-build"]');
    if (meta) meta.setAttribute('content', build.id);
    if (document.body) document.body.dataset.sbosBuild = build.id;
    node.querySelectorAll?.('.v78-build,[data-sbos-build-label]').forEach((item) => {
      item.textContent = build.label;
      item.title = build.id;
    });
  };

  const start = () => {
    apply();
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.addedNodes.length)) requestAnimationFrame(() => apply());
    });
    observer.observe(document.documentElement, {subtree: true, childList: true});
    window.addEventListener('second-brain-booted', () => apply());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})(typeof self !== 'undefined' ? self : globalThis);
