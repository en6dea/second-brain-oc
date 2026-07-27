/* Second Brain OS V97 — single build source for page and service worker. */
'use strict';
((root) => {
  const build = Object.freeze({
    version: '97.0.0',
    major: 97,
    label: 'V97 · PUBLISH & VISUAL',
    id: 'second-brain-os-v97-publish-visual-20260727-r1',
    dataSchemaVersion: 1,
    cacheVersion: 'v97-r1',
    cacheName: 'second-brain-os-v97-publish-visual-r1',
    builtAt: '2026-07-27T09:30:00+03:00',
    criticalFiles: [
      './index.html',
      './offline.html',
      './manifest.webmanifest',
      './version-v97.js',
      './bootstrap-v97.js',
      './backup-v97.js',
      './styles-v97-core.css'
    ]
  });
  root.SecondBrainBuild = build;
  root.SECOND_BRAIN_BUILD = build;
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.sbosVersion = build.version;
  const apply = () => {
    const meta = document.querySelector('meta[name="second-brain-build"]');
    if (meta) meta.setAttribute('content', build.id);
    document.body?.setAttribute('data-sbos-build', build.id);
    document.querySelectorAll('.v78-build,[data-sbos-build-label]').forEach(node => {
      node.textContent = build.label;
      node.setAttribute('title', build.id);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  else apply();
  new MutationObserver(apply).observe(document.documentElement,{subtree:true,childList:true});
})(typeof self !== 'undefined' ? self : globalThis);
