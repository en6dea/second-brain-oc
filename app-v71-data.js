'use strict';

/* Second Brain OS V71 — safe personal backup restore and legacy migration.
   Personal records remain outside the public application bundle. */
(() => {
  const BUILD = 'second-brain-space-v71-personal-data-restore-20260716-r26';
  const STORE_KEY = 'secondBrainOS.v1';
  const ROLLBACK_KEY = 'secondBrainOS.v71.preRestore';
  let pendingRestore = null;

  const clone = value => JSON.parse(JSON.stringify(value ?? null));
  const list = value => Array.isArray(value) ? value : [];
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const todayStamp = () => new Date().toISOString().slice(0, 10);

  function installStyles() {
    if (document.getElementById('v71-data-style')) return;
    const style = document.createElement('style');
    style.id = 'v71-data-style';
    style.textContent = `
      .v71-data-trigger{white-space:nowrap}
      .v71-restore{display:grid;gap:14px;color:inherit}
      .v71-restore-hero,.v71-restore-safe,.v71-restore-preview{border:1px solid rgba(125,155,195,.24);border-radius:22px;padding:16px;background:linear-gradient(135deg,rgba(49,103,255,.10),rgba(21,189,166,.05))}
      .v71-restore-hero{display:grid;grid-template-columns:52px minmax(0,1fr);gap:14px;align-items:center}
      .v71-restore-hero>span{width:52px;height:52px;border-radius:18px;display:grid;place-items:center;color:#fff;font-size:24px;background:linear-gradient(135deg,#2f6df6,#7559f4);box-shadow:0 14px 30px rgba(47,109,246,.25)}
      .v71-restore h3,.v71-restore p{margin:0}.v71-restore p{margin-top:5px;color:#8da0b9;line-height:1.55}
      .v71-restore-actions{display:flex;flex-wrap:wrap;gap:9px}.v71-restore-actions button{min-height:42px}
      .v71-restore-safe{display:grid;grid-template-columns:auto minmax(0,1fr);gap:11px;background:rgba(16,185,129,.07);border-color:rgba(16,185,129,.22)}
      .v71-restore-safe>span{font-size:20px}.v71-restore-safe b{display:block;margin-bottom:3px}
      .v71-preview-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}
      .v71-preview-grid article{border:1px solid rgba(125,155,195,.20);border-radius:16px;padding:11px;background:rgba(255,255,255,.05)}
      .v71-preview-grid span{display:block;color:#8da0b9;font-size:11px}.v71-preview-grid b{display:block;margin-top:4px;font-size:20px;font-weight:650}
      .v71-restore-status{min-height:20px;color:#8da0b9;font-size:12px}
      .v71-paste{display:grid;gap:9px}.v71-paste[hidden]{display:none}.v71-paste textarea{width:100%;min-height:130px;resize:vertical;border:1px solid rgba(125,155,195,.28);border-radius:16px;padding:12px;background:rgba(7,17,31,.46);color:inherit;outline:none}
      .v71-system-card{margin-top:16px;border:1px solid rgba(89,139,255,.23);border-radius:22px;padding:16px;background:linear-gradient(135deg,rgba(47,109,246,.10),rgba(255,184,92,.05));display:flex;align-items:center;justify-content:space-between;gap:16px}
      .v71-system-card h3,.v71-system-card p{margin:0}.v71-system-card p{margin-top:5px;color:#8da0b9;line-height:1.45}
      html.v70-theme-light .v71-restore-hero,html.v70-theme-light .v71-restore-preview,html.v70-theme-light .v71-system-card{background:linear-gradient(135deg,#eef4ff,#fffaf2);color:#172334}
      html.v70-theme-light .v71-restore-safe{background:#effbf6;color:#172334}
      html.v70-theme-light .v71-preview-grid article{background:#fff;border-color:#dbe5f2}
      @media(max-width:760px){.v71-data-trigger{padding-inline:10px}.v71-preview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v71-system-card{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function scrubSecrets(source) {
    const clean = clone(source) || {};
    if (clean.settings?.sync) delete clean.settings.sync.token;
    if (clean.settings) delete clean.settings.alfaWorkerKey;
    if (clean.settings?.v66) delete clean.settings.v66.security;
    return clean;
  }

  function recordKey(item, index) {
    if (item && typeof item === 'object') {
      if (item.id != null && item.id !== '') return `id:${item.id}`;
      const compact = [item.date, item.title, item.name, item.person, item.amount, item.category, item.text, item.type].map(value => String(value ?? '').trim()).join('|');
      if (compact.replaceAll('|', '')) return `fields:${compact}`;
    }
    return `json:${index}:${JSON.stringify(item)}`;
  }

  function mergeArrays(imported, current) {
    const map = new Map();
    list(imported).forEach((item, index) => map.set(recordKey(item, index), item));
    list(current).forEach((item, index) => map.set(recordKey(item, index), item));
    return Array.from(map.values());
  }

  function mergeWithCurrent(imported, current) {
    const source = object(imported);
    const local = object(current);
    const merged = { ...local, ...source };
    const keys = new Set([...Object.keys(local), ...Object.keys(source)]);
    keys.forEach(key => {
      if (Array.isArray(source[key]) || Array.isArray(local[key])) merged[key] = mergeArrays(source[key], local[key]);
    });
    merged.settings = { ...object(local.settings), ...object(source.settings) };
    if (local.settings?.v67) merged.settings.v67 = { ...object(source.settings?.v67), ...object(local.settings.v67) };
    if (local.settings?.v70) merged.settings.v70 = { ...object(source.settings?.v70), ...object(local.settings.v70) };
    return scrubSecrets(merged);
  }

  function prepareExactRestore(imported, current) {
    const restored = scrubSecrets(imported);
    restored.settings = { ...object(restored.settings) };
    const currentTheme = current?.settings?.v67?.theme;
    if (currentTheme) restored.settings.v67 = { ...object(restored.settings.v67), theme: currentTheme };
    if (current?.settings?.v70) restored.settings.v70 = { ...object(restored.settings.v70), ...object(current.settings.v70) };
    return restored;
  }

  function readable(value, depth = 0) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (depth > 3) return JSON.stringify(value);
    if (Array.isArray(value)) return value.map(item => readable(item, depth + 1)).filter(Boolean).join('\n');
    return Object.entries(value).map(([key, item]) => `${key}: ${readable(item, depth + 1)}`).join('\n');
  }

  function migrateLegacy(source) {
    const next = clone(source) || {};
    next.subconsciousEntries = list(next.subconsciousEntries);
    next.sleepEntries = list(next.sleepEntries);
    next.notes = list(next.notes);
    next.habits = list(next.habits);

    const stateByDate = new Map(list(next.states).filter(item => item?.date).map(item => [String(item.date), item]));
    const diaryByDate = new Map(next.subconsciousEntries.filter(item => item?.date).map(item => [String(item.date), item]));

    function addDiary(date, sourceId, fields) {
      if (!date) return;
      const key = String(date);
      const marker = String(sourceId);
      const existing = diaryByDate.get(key);
      if (existing) {
        const sources = new Set(list(existing.legacySources));
        if (!sources.has(marker)) {
          sources.add(marker);
          existing.legacySources = Array.from(sources);
          const addition = fields.body || '';
          if (addition && !String(existing.body || '').includes(addition)) existing.body = [existing.body, addition].filter(Boolean).join('\n\n');
          existing.summary = existing.summary || fields.summary || '';
          existing.signal = existing.signal || fields.signal || '';
          existing.promise = existing.promise || fields.promise || '';
        }
        return;
      }
      const wellbeing = stateByDate.get(key) || {};
      const record = {
        id: `legacy-${marker}`,
        date: key,
        mood: fields.mood || wellbeing.mood || '',
        energy: fields.energy || wellbeing.energy || '',
        summary: fields.summary || '',
        body: fields.body || '',
        signal: fields.signal || '',
        promise: fields.promise || '',
        legacySources: [marker]
      };
      next.subconsciousEntries.push(record);
      diaryByDate.set(key, record);
    }

    list(next.subconsciousDiary).forEach((entry, index) => {
      const id = `subconsciousDiary:${entry?.id || index}`;
      const body = [
        entry?.feeling ? `Что чувствовал: ${entry.feeling}` : '',
        entry?.avoid ? `Чего избегал: ${entry.avoid}` : '',
        entry?.truth ? `Что признал правдой: ${entry.truth}` : '',
        entry?.step ? `Следующий шаг: ${entry.step}` : '',
        entry?.extra ? `Дополнение: ${entry.extra}` : ''
      ].filter(Boolean).join('\n');
      addDiary(entry?.date, id, { summary: entry?.feeling || entry?.truth || 'Запись дневника подсознания', body, signal: entry?.truth || '', promise: entry?.step || '' });
    });

    list(next.interviews).forEach((entry, index) => {
      const id = `interview:${entry?.id || index}`;
      const body = [entry?.quote ? `Главная мысль: ${entry.quote}` : '', readable(entry?.answers)].filter(Boolean).join('\n\n');
      addDiary(entry?.date, id, { summary: entry?.title || 'Интервью с подсознанием', body, signal: entry?.quote || '', promise: '' });
    });

    const sleepDates = new Set(next.sleepEntries.map(entry => String(entry?.date || '')));
    list(next.states).forEach(entry => {
      const match = String(entry?.sleep ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/);
      const hours = match ? Number(match[0]) : 0;
      const date = String(entry?.date || '');
      if (!date || !hours || hours <= 0 || hours > 24 || sleepDates.has(date)) return;
      next.sleepEntries.push({ id: `legacy-sleep-${date}`, date, hours, note: entry?.note || '', source: 'states' });
      sleepDates.add(date);
    });

    const habitMap = new Map(next.habits.map(item => [String(item?.id || ''), item]));
    list(next.habitLogs).forEach(log => {
      if (!log?.done || !log?.date) return;
      const habit = habitMap.get(String(log.habitId || ''));
      if (!habit) return;
      habit.marks = object(habit.marks);
      habit.marks[String(log.date)] = true;
    });

    const noteIds = new Set(next.notes.map(item => String(item?.id || '')));
    function addLegacyNote(entry, index, kind) {
      const id = `legacy-${kind}-${entry?.id || index}`;
      if (noteIds.has(id)) return;
      const text = kind === 'journal' ? entry?.text : [entry?.prompt, entry?.answer].filter(Boolean).join('\n\n');
      if (!text) return;
      next.notes.push({ id, title: kind === 'journal' ? `Дневник · ${entry?.date || ''}` : `Личная запись · ${entry?.date || ''}`, date: entry?.date || todayStamp(), text, note: text, folder: 'Дневник', tags: entry?.tags || '', source: kind });
      noteIds.add(id);
    }
    list(next.journal).forEach((entry, index) => addLegacyNote(entry, index, 'journal'));
    list(next.journalEntries).forEach((entry, index) => addLegacyNote(entry, index, 'journalEntries'));

    next.meta = { ...object(next.meta), v71PersonalMigration: { migratedAt: new Date().toISOString(), subconsciousDiary: list(next.subconsciousDiary).length, interviews: list(next.interviews).length, journal: list(next.journal).length, journalEntries: list(next.journalEntries).length, sleepFromStates: next.sleepEntries.filter(item => item?.source === 'states').length } };
    return next;
  }

  function summaryOf(source) {
    const data = object(source);
    const subconscious = Math.max(list(data.subconsciousEntries).length, list(data.subconsciousDiary).length + list(data.interviews).length);
    return {
      operations: list(data.operations).length,
      debts: list(data.debts).length,
      tasks: list(data.tasks).length,
      habits: list(data.habits).length,
      people: list(data.people).length,
      goals: list(data.goals).length,
      notes: list(data.notes).length,
      sleep: list(data.sleepEntries).length || list(data.states).filter(item => /\d/.test(String(item?.sleep ?? ''))).length,
      subconscious,
      journals: list(data.journal).length + list(data.journalEntries).length,
      nonEmptyCollections: Object.values(data).filter(value => Array.isArray(value) && value.length).length
    };
  }

  function previewHtml(summary) {
    const rows = [
      ['Финансовые операции', summary.operations], ['Долги', summary.debts], ['Задачи', summary.tasks],
      ['Привычки', summary.habits], ['Люди', summary.people], ['Цели', summary.goals], ['Сон', summary.sleep],
      ['Подсознание и интервью', summary.subconscious], ['Другие дневники', summary.journals], ['Заполненных разделов', summary.nonEmptyCollections]
    ];
    return `<div class="v71-preview-grid">${rows.map(([label, count]) => `<article><span>${html(label)}</span><b>${Number(count) || 0}</b></article>`).join('')}</div>`;
  }

  function openRestore() {
    pendingRestore = null;
    if (typeof openModal !== 'function') return;
    openModal('Восстановление личных данных', `<div class="v71-restore"><section class="v71-restore-hero"><span>↥</span><div><h3>Вернуть заполненную личную базу</h3><p>Выберите резервную копию Second Brain OS. Сначала появится только предпросмотр — приложение ничего не изменит без подтверждения.</p></div></section><section class="v71-restore-safe"><span>⛨</span><div><b>Личные данные не попадут в публичный GitHub</b><p>Перед восстановлением текущее состояние сохранится отдельно. Токены синхронизации, банковские ключи и PIN из старой копии не импортируются.</p></div></section><input id="v71_restore_file" type="file" accept=".json,application/json" hidden><div class="v71-restore-actions"><button class="btn" data-v71-action="choose-restore" type="button">Выбрать backup JSON</button><button class="ghost-btn" data-v71-action="toggle-paste" type="button">Вставить JSON текстом</button><button class="ghost-btn" data-action="closeModal" type="button">Отмена</button></div><div id="v71_paste_wrap" class="v71-paste" hidden><textarea id="v71_restore_text" autocomplete="off" spellcheck="false" placeholder="Вставьте содержимое резервной копии JSON"></textarea><button class="btn" data-v71-action="read-pasted" type="button">Показать предпросмотр</button></div><div id="v71_restore_status" class="v71-restore-status">Файл ещё не выбран.</div><div id="v71_restore_preview"></div></div>`);
  }

  function acceptRestorePayload(payload, fileName) {
    const status = document.getElementById('v71_restore_status');
    const preview = document.getElementById('v71_restore_preview');
    try {
      const source = payload?.state && typeof payload.state === 'object' ? payload.state : payload;
      if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('В файле нет объекта state');
      const summary = summaryOf(source);
      if (!summary.nonEmptyCollections) throw new Error('Не найдено заполненных разделов');
      pendingRestore = { source: scrubSecrets(source), fileName, summary };
      if (status) status.textContent = `Копия «${fileName}» прочитана. Проверьте количества и подтвердите восстановление.`;
      if (preview) preview.innerHTML = `<section class="v71-restore-preview"><h3>Предпросмотр без изменений</h3><p>После подтверждения эта копия станет основной локальной базой. Текущее состояние автоматически сохранится отдельно.</p>${previewHtml(summary)}<div class="v71-restore-actions" style="margin-top:14px"><button class="btn" data-v71-action="confirm-restore" type="button">Сохранить текущее и восстановить</button><button class="ghost-btn" data-v71-action="choose-restore" type="button">Выбрать другой файл</button></div></section>`;
    } catch (error) {
      pendingRestore = null;
      if (status) status.textContent = `Не удалось прочитать резервную копию: ${error.message || error}`;
      if (preview) preview.innerHTML = '';
    }
  }

  async function readRestoreFile(file) {
    const status = document.getElementById('v71_restore_status');
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      if (status) status.textContent = 'Файл больше 20 МБ — восстановление остановлено.';
      return;
    }
    try { acceptRestorePayload(JSON.parse(await file.text()), file.name); }
    catch (error) { acceptRestorePayload(null, file.name); }
  }

  function readPastedRestore() {
    const text = document.getElementById('v71_restore_text')?.value || '';
    const status = document.getElementById('v71_restore_status');
    if (!text.trim()) {
      if (status) status.textContent = 'Вставьте содержимое JSON-копии.';
      return;
    }
    try { acceptRestorePayload(JSON.parse(text), 'вставленная резервная копия'); }
    catch (error) {
      pendingRestore = null;
      if (status) status.textContent = `Не удалось прочитать JSON: ${error.message || error}`;
    }
  }

  function downloadBeforeRestore(beforeState) {
    try {
      const payload = { format: 'second-brain-os-backup', version: 71, createdAt: new Date().toISOString(), reason: 'before-personal-restore', state: scrubSecrets(beforeState) };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `second-brain-before-personal-restore-${todayStamp()}.json`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 1000);
    } catch (error) { console.warn('[V71 backup before restore]', error); }
  }

  function confirmRestore() {
    if (!pendingRestore) return;
    const current = typeof exportableState === 'function' ? exportableState() : clone(state);
    downloadBeforeRestore(current);
    try { localStorage.setItem(ROLLBACK_KEY, JSON.stringify({ createdAt: new Date().toISOString(), state: scrubSecrets(current) })); }
    catch (error) { console.warn('[V71 rollback]', error); }

    const restored = prepareExactRestore(pendingRestore.source, current);
    const migrated = migrateLegacy(restored);
    state = typeof normalize === 'function' ? normalize(migrated) : migrated;
    state.settings = { ...object(state.settings), v71Restore: { restoredAt: new Date().toISOString(), sourceFile: pendingRestore.fileName, summary: summaryOf(state) } };
    if (typeof save === 'function') save();
    else localStorage.setItem(STORE_KEY, JSON.stringify(state));

    const persistedRaw = localStorage.getItem(STORE_KEY);
    const persistedPayload = persistedRaw ? JSON.parse(persistedRaw) : null;
    const persisted = persistedPayload?.state || persistedPayload;
    const verified = summaryOf(persisted || {});
    document.body.dataset.v71RestoreSelftest = verified.operations >= pendingRestore.summary.operations && verified.debts >= pendingRestore.summary.debts && verified.people >= pendingRestore.summary.people && verified.habits >= pendingRestore.summary.habits ? 'pass' : 'review';
    pendingRestore = null;
    if (typeof closeModal === 'function') closeModal();
    try { location.hash = 'dashboard'; } catch (error) {}
    if (typeof render === 'function') render();
    if (typeof toast === 'function') toast('Личная база восстановлена и сохранена');
    setTimeout(() => location.reload(), 650);
  }

  function injectControls() {
    installStyles();
    document.body.dataset.sbosBuild = BUILD;
    document.body.dataset.v71DataRestore = 'ready';
    const currentSummary = summaryOf(typeof state === 'object' ? state : {});
    document.body.dataset.v71Operations = String(currentSummary.operations);
    document.body.dataset.v71Debts = String(currentSummary.debts);
    document.body.dataset.v71Tasks = String(currentSummary.tasks);
    document.body.dataset.v71Habits = String(currentSummary.habits);
    document.body.dataset.v71People = String(currentSummary.people);
    document.body.dataset.v71Goals = String(currentSummary.goals);
    document.body.dataset.v71Notes = String(currentSummary.notes);
    document.body.dataset.v71Sleep = String(currentSummary.sleep);
    document.body.dataset.v71Subconscious = String(currentSummary.subconscious);
    document.body.dataset.v71Journals = String(currentSummary.journals);
    const topActions = document.querySelector('.v59-top-actions,.v52-actions,.top-actions');
    if (topActions && !topActions.querySelector('[data-v71-action="open-restore"]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ghost-btn v71-data-trigger';
      button.dataset.v71Action = 'open-restore';
      button.textContent = '↥ Данные';
      const exportButton = Array.from(topActions.querySelectorAll('button')).find(item => /экспорт|backup/i.test(item.textContent || ''));
      if (exportButton?.nextSibling) topActions.insertBefore(button, exportButton.nextSibling);
      else topActions.appendChild(button);
    }
    const route = (location.hash || '').replace('#', '') || 'dashboard';
    const view = document.getElementById('view');
    if (route === 'system' && view && !view.querySelector('.v71-system-card')) {
      view.insertAdjacentHTML('beforeend', `<section class="v71-system-card"><div><h3>Личная база и перенос между устройствами</h3><p>Импортируйте backup после установки или открытия нового онлайн-адреса. Публичные файлы приложения остаются без персональных записей.</p></div><button class="btn" data-v71-action="open-restore" type="button">Восстановить данные</button></section>`);
    }
  }

  window.addEventListener('click', event => {
    const action = event.target.closest?.('[data-v71-action]');
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (action.dataset.v71Action === 'open-restore') return openRestore();
    if (action.dataset.v71Action === 'choose-restore') return document.getElementById('v71_restore_file')?.click();
    if (action.dataset.v71Action === 'toggle-paste') {
      const wrap = document.getElementById('v71_paste_wrap');
      if (wrap) wrap.hidden = !wrap.hidden;
      return;
    }
    if (action.dataset.v71Action === 'read-pasted') return readPastedRestore();
    if (action.dataset.v71Action === 'confirm-restore') return confirmRestore();
  }, true);

  window.addEventListener('change', event => {
    if (event.target?.id === 'v71_restore_file') readRestoreFile(event.target.files?.[0]);
  }, true);

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      const result = previousRender.apply(this, arguments);
      setTimeout(injectControls, 180);
      return result;
    };
  }
  window.addEventListener('hashchange', () => setTimeout(injectControls, 220));
  document.body.dataset.sbosBuild = BUILD;
  setTimeout(injectControls, 220);
})();
