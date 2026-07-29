/* Second Brain OS V104 — full package: durable storage, unified identity and responsive UX. */
'use strict';
((root) => {
  const build = Object.freeze({
    version: '104.0.0',
    major: 104,
    label: 'V104 · UNIFIED LIFE OS',
    id: 'second-brain-os-v104-unified-life-os-20260729-r5',
    dataSchemaVersion: 1,
    cacheVersion: 'v104-r5',
    cacheName: 'second-brain-os-v104-unified-life-os-r5',
    builtAt: '2026-07-29T12:00:00+03:00',
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
