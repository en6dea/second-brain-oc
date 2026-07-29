/* Second Brain OS V104 — single diagnostics renderer and safe update controls. */
'use strict';
(() => {
  const build = window.SecondBrainBuild || {major: 104, label: 'V104', cacheVersion: 'v104-r1', criticalFiles: []};
  const errors = [];
  let decorating = false;
  let scheduled = 0;

  const addError = (message, source = 'runtime') => {
    errors.unshift({at: new Date().toISOString(), source, message: String(message || 'Неизвестная ошибка').slice(0, 1200)});
    errors.splice(30);
  };
  window.addEventListener('error', (event) => addError(event.error?.message || event.message, 'window.error'));
  window.addEventListener('unhandledrejection', (event) => addError(event.reason?.message || event.reason, 'unhandledrejection'));

  async function checkResources() {
    const results = [];
    for (const file of build.criticalFiles || []) {
      try {
        const response = await fetch(`${file}${file.includes('?') ? '&' : '?'}build=${encodeURIComponent(build.cacheVersion)}`, {cache: 'no-store'});
        results.push({file, status: response.status, ok: response.ok});
      } catch (error) {
        results.push({file, status: 0, ok: false, error: error?.message || String(error)});
      }
    }
    return results;
  }

  async function pwaStatus() {
    if (!('serviceWorker' in navigator)) return {supported: false};
    const registration = await navigator.serviceWorker.getRegistration().catch(() => null);
    return {
      supported: true,
      controlled: Boolean(navigator.serviceWorker.controller),
      registered: Boolean(registration),
      waiting: Boolean(registration?.waiting)
    };
  }

  const storageLabel = () => {
    const mode = document.body?.dataset?.sbosStorage;
    if (mode === 'error') return 'Требует внимания';
    if (mode === 'indexeddb-primary' || mode === 'indexeddb-only') return 'IndexedDB · основное';
    return 'IndexedDB · готово';
  };

  async function report() {
    return {
      build,
      location: {href: location.href, standalone: matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone === true},
      storage: {mode: document.body?.dataset?.sbosStorage || 'booting'},
      backup: window.SecondBrainBackup?.getStatus?.() || null,
      cloud: window.SecondBrainCloud?.getStatus?.() || null,
      pwa: await pwaStatus(),
      resources: await checkResources(),
      errors: [...errors]
    };
  }

  async function copyReport() {
    const text = JSON.stringify(await report(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      window.SecondBrainApp?.toast?.('Технический отчёт скопирован');
    } catch (_) {
      const blob = new Blob([text], {type: 'application/json'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `second-brain-diagnostics-v104-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
  }

  async function clearUiCache() {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('second-brain-os-')).map((name) => caches.delete(name)));
    const registration = await navigator.serviceWorker?.getRegistration?.().catch(() => null);
    await registration?.update?.().catch(() => undefined);
    window.SecondBrainApp?.toast?.('Кэш интерфейса очищен. Данные сохранены.');
    setTimeout(() => location.reload(), 650);
  }

  async function decorateSettings(force = false) {
    const page = document.querySelector('.v78-page');
    if (!page || !/настройки/i.test(page.querySelector('h1')?.textContent || '')) return;
    if (decorating && !force) return;
    if (page.querySelector('[data-v104-diagnostics]') && !force) return;
    decorating = true;
    try {
      const [resources, pwa] = await Promise.all([checkResources(), pwaStatus()]);
      if (!page.isConnected || !/настройки/i.test(page.querySelector('h1')?.textContent || '')) return;
      page.querySelectorAll('[data-v104-diagnostics],[data-v98-diagnostics],[data-v97-diagnostics]').forEach((node) => node.remove());
      const backup = window.SecondBrainBackup?.getStatus?.() || {};
      const failed = resources.filter((item) => !item.ok).length;
      const card = document.createElement('section');
      card.className = 'v98-diagnostics-card v104-diagnostics-card';
      card.dataset.v104Diagnostics = 'true';
      card.innerHTML = `
        <header>
          <div><small>СОСТОЯНИЕ ПРИЛОЖЕНИЯ</small><h2>Хранение, файлы и PWA</h2><p>Один компактный контрольный центр без повторяющихся блоков.</p></div>
          <span>${build.label}</span>
        </header>
        <div class="v98-diagnostics-grid">
          <article><small>Хранение</small><b>${storageLabel()}</b></article>
          <article><small>Резервная копия</small><b>${backup.createdAt ? new Date(backup.createdAt).toLocaleString('ru-RU') : 'Создаётся'}</b></article>
          <article><small>Файлы сборки</small><b>${failed ? `Недоступно: ${failed}` : 'Все доступны'}</b></article>
          <article><small>Service Worker</small><b>${pwa.controlled ? 'Активен' : pwa.registered ? 'Зарегистрирован' : 'Не активен'}</b></article>
        </div>
        <div class="v98-diagnostics-actions">
          <button type="button" data-v104-action="check-resources">Проверить файлы</button>
          <button type="button" data-v104-action="clear-ui-cache">Обновить интерфейс</button>
          <button type="button" data-v104-action="copy-diagnostics">Скопировать отчёт</button>
        </div>
        <details><summary>Проверенные файлы</summary><div class="v98-resource-list">${resources.map((item) => `<span class="${item.ok ? 'ok' : 'bad'}"><b>${item.ok ? '✓' : '!'}</b>${item.file}<em>${item.status || 'ошибка'}</em></span>`).join('')}</div></details>`;
      page.appendChild(card);
    } finally {
      decorating = false;
    }
  }

  function queueDecorate() {
    cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(() => decorateSettings(false));
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('[data-v104-action]');
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.v104Action;
    if (action === 'copy-diagnostics') return copyReport();
    if (action === 'clear-ui-cache') {
      if (confirm('Очистить только кэш интерфейса? Личные данные останутся на месте.')) return clearUiCache();
      return;
    }
    if (action === 'check-resources') {
      button.disabled = true;
      button.textContent = 'Проверяю…';
      await decorateSettings(true);
      window.SecondBrainApp?.toast?.('Проверка завершена');
    }
  });

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length)) queueDecorate();
  });
  const start = () => {
    observer.observe(document.documentElement, {childList: true, subtree: true});
    decorateSettings(false);
    document.documentElement.classList.add('sbos-v104-ready');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();

  window.SecondBrainDiagnostics = {
    report,
    copyReport,
    checkResources,
    clearUiCache,
    addError,
    getErrors: () => [...errors]
  };
})();
