/* Second Brain OS V100 — emergency load recovery and single build source. */
'use strict';
((root) => {
  const build = Object.freeze({
    version: '100.0.0',
    major: 100,
    label: 'V100 · VISUAL & DATA CORE',
    id: 'second-brain-os-v100-visual-data-core-20260727-r1',
    dataSchemaVersion: 1,
    cacheVersion: 'v100-r1',
    cacheName: 'second-brain-os-v100-visual-data-core-r1',
    builtAt: '2026-07-27T17:30:00+03:00',
    criticalFiles: [
      './index.html',
      './offline.html',
      './manifest.webmanifest',
      './version-v100.js',
      './bootstrap-v98.js',
      './backup-v98.js',
      './styles-v98-core.css'
    ]
  });

  root.SecondBrainBuild = build;
  root.SECOND_BRAIN_BUILD = build;
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.sbosVersion = build.version;

  const updateNode = (node) => {
    if (!(node instanceof Element)) return;
    if (node.matches('.v78-build,[data-sbos-build-label]')) {
      if (node.textContent !== build.label) node.textContent = build.label;
      if (node.getAttribute('title') !== build.id) node.setAttribute('title', build.id);
    }
    node.querySelectorAll?.('.v78-build,[data-sbos-build-label]').forEach((item) => {
      if (item.textContent !== build.label) item.textContent = build.label;
      if (item.getAttribute('title') !== build.id) item.setAttribute('title', build.id);
    });
  };

  const applyStatic = () => {
    const meta = document.querySelector('meta[name="second-brain-build"]');
    if (meta && meta.getAttribute('content') !== build.id) meta.setAttribute('content', build.id);
    if (document.body?.getAttribute('data-sbos-build') !== build.id) {
      document.body?.setAttribute('data-sbos-build', build.id);
    }
    updateNode(document.documentElement);
  };

  let scheduled = false;
  const observer = new MutationObserver((records) => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) updateNode(node);
        }
      }
    });
  });

  const start = () => {
    applyStatic();
    observer.observe(document.documentElement, {subtree: true, childList: true});
    window.addEventListener('second-brain-booted', applyStatic);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})(typeof self !== 'undefined' ? self : globalThis);
