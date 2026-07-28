/* Second Brain OS V104 — GameLife route recovery and cache integrity. */
'use strict';
((root) => {
  const build = Object.freeze({
    version: '104.0.0',
    major: 104,
    label: 'V104 · GAMELIFE RECOVERY',
    id: 'second-brain-os-v104-gamelife-recovery-20260728-r1',
    dataSchemaVersion: 1,
    cacheVersion: 'v104-r1',
    cacheName: 'second-brain-os-v104-gamelife-recovery-r1',
    builtAt: '2026-07-28T19:20:00+03:00',
    criticalFiles: [
      './index.html',
      './offline.html',
      './manifest.webmanifest',
      './version-v104.js',
      './bootstrap-v98.js',
      './backup-v98.js',
      './styles-v98-core.css',
      './styles-v103-product.css',
      './app-v103-product.js'
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
