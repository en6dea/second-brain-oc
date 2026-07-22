'use strict';

/* Second Brain OS V88 — visual runtime only. Reads state, never migrates or deletes data. */
(() => {
  const VISUAL_BUILD = 'obsidian-constellation-v88-r1';
  const BUILD_LABEL = 'V88 · CONSTELLATION';
  const THEME_KEY = 'secondBrainOS.visualThemeMode';
  const LEGACY_THEME_KEY = 'secondBrainOS.visualTheme';
  const MOTION_KEY = 'secondBrainOS.visualMotion';
  const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  let themeMode = readPreference(THEME_KEY) || readPreference(LEGACY_THEME_KEY) || 'system';
  let motionMode = readPreference(MOTION_KEY) || 'full';
  let scheduledFrame = 0;
  let applyCount = 0;
  let writeCount = 0;

  const icons = {
    home:'<path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/>',
    sparkle:'<path d="m12 2 1.45 4.55L18 8l-4.55 1.45L12 14l-1.45-4.55L6 8l4.55-1.45L12 2Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/>',
    target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 7-7M16 5h3v3"/>',
    review:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    wallet:'<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M4 8h15M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z"/>',
    habit:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 8.5"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    archive:'<path d="M4 7h16v14H4zM3 3h18v4H3zM9 11h6"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l-2.86 2.86A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1.4 1.6H9.55A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-2.86-2.86A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-1.6-1v-4A1.7 1.7 0 0 0 4.1 9a1.7 1.7 0 0 0-.34-1.88L6.62 4.26A1.7 1.7 0 0 0 8.5 4.6 1.7 1.7 0 0 0 9.55 3h4.05A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l2.86 2.86A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.1 1v4a1.7 1.7 0 0 0-1.1 1Z"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    moon:'<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
    system:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4M7 8h10"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
    back:'<path d="M19 12H5M10 7l-5 5 5 5"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3.5 3.5 0 0 1 0 7M17 15a6 6 0 0 1 4.5 5"/>',
    morning:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M20 12h2M17.7 6.3l1.4-1.4"/>',
    evening:'<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    folders:'<path d="M3 6h7l2 2h9v11H3V6Z"/>',
    note:'<path d="M5 3h10l4 4v14H5V3Z"/><path d="M14 3v5h5M8 12h8M8 16h6"/>',
    heart:'<path d="M20.8 5.8a5.3 5.3 0 0 0-7.5 0L12 7.1l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 22l8.8-8.7a5.3 5.3 0 0 0 0-7.5Z"/>',
    bulb:'<path d="M9 18h6M10 22h4"/><path d="M8.2 14.5A6 6 0 1 1 15.8 14.5C14.7 15.3 14 16.1 14 18h-4c0-1.9-.7-2.7-1.8-3.5Z"/>',
    leaf:'<path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-7 10-16Z"/><path d="M4 21c3-6 7-9 13-12"/>',
    flower:'<circle cx="12" cy="12" r="2"/><path d="M12 10C7 8 8 3 12 3s5 5 2 8c5-2 8 2 6 5s-6 2-7-2c0 5-5 6-7 3s0-6 4-6c-4-2-3-7 1-8"/>',
    document:'<path d="M5 3h10l4 4v14H5V3Z"/><path d="M14 3v5h5M8 12h8M8 16h8"/>',
    book:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23V5.5Z"/>',
    film:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M17 9h4M3 15h4M17 15h4"/>',
    plane:'<path d="m22 2-9 20-2-9-9-2 20-9Z"/><path d="m11 13 5-5"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    inbox:'<path d="M4 4h16v16H4z"/><path d="M4 14h5l2 3h2l2-3h5"/>',
    operations:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    analytics:'<path d="M4 19V9M10 19V4M16 19v-7M22 19H2"/>',
    planning:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    export:'<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 14v6h14v-6"/>',
    debt:'<path d="M4 5.5h12a3 3 0 0 1 3 3v10H7a3 3 0 0 1-3-3v-10Z"/><path d="M4 9h15M15 13h6v4h-6a2 2 0 1 1 0-4Z"/>',
    transfer:'<path d="m7 7-4 4 4 4M3 11h14M17 9l4 4-4 4M21 13H7"/>',
    edit:'<path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z"/><path d="m13.5 7 3.5 3.5"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    water:'<path d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13Z"/>',
    movement:'<path d="M13 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/><path d="m9 9 3-2 3 3 3 1M12 7l-1 6-4 5M11 13l5 6"/>',
    training:'<path d="M3 9v6M7 7v10M17 7v10M21 9v6M7 12h10"/>',
    meditation:'<circle cx="12" cy="5" r="2"/><path d="M12 8v6M8 11l4 3 4-3M5 20c2-4 5-6 7-6s5 2 7 6M7 20h10"/>',
    food:'<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3c-3 3-3 8 0 10v8M17 3v10h3"/>',
    focus:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    walk:'<circle cx="13" cy="4" r="2"/><path d="m10 22 2-7-3-3 2-5 4 3 3 1M12 15l4 7M8 12l-4 4"/>',
    clean:'<path d="m4 20 10-10M14 4l6 6-4 4-6-6 4-4ZM3 21l5-1-4-4-1 5Z"/>',
    detox:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 18h4M3 3l18 18"/>',
    health:'<path d="M8 3v6a4 4 0 0 0 8 0V3M12 13v2a5 5 0 0 0 10 0v-2M20 11v4"/>',
    learning:'<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 3 9 3 12 0v-5"/>',
    art:'<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h3a6 6 0 0 0-3-10Z"/><circle cx="7" cy="10" r="1"/><circle cx="9" cy="6" r="1"/><circle cx="14" cy="6" r="1"/>',
    timer:'<circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 5v3M12 13l3-3"/>',
    shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m8 12 2.5 2.5L16 9"/>'
  };

  const svg = (name, className = 'v88-icon') => `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name] || icons.sparkle}</svg>`;

  function readPreference(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function savePreference(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function textKey(value) { return String(value || '').trim().toLocaleLowerCase('ru-RU'); }

  function iconFor(value) {
    const text = textKey(value);
    if (/главн|сегодня/.test(text)) return 'home';
    if (/gamelife|подсказ|помощ/.test(text)) return 'sparkle';
    if (/цел|фокус/.test(text)) return 'target';
    if (/разоб|очеред/.test(text)) return 'review';
    if (/календар|недел|событ/.test(text)) return 'calendar';
    if (/финанс|кошел|баланс/.test(text)) return 'wallet';
    if (/привыч|дисциплин/.test(text)) return 'habit';
    if (/информац/.test(text)) return 'info';
    if (/архив/.test(text)) return 'archive';
    if (/настрой|систем/.test(text)) return 'settings';
    if (/профил/.test(text)) return 'user';
    if (/люди|контакт/.test(text)) return 'users';
    if (/замет|дневник/.test(text)) return 'note';
    if (/желан|отношен|полин/.test(text)) return 'heart';
    if (/иде/.test(text)) return 'bulb';
    if (/личная память|спокой/.test(text)) return 'leaf';
    if (/документ/.test(text)) return 'document';
    if (/книг|чтен/.test(text)) return 'book';
    if (/фильм|кино/.test(text)) return 'film';
    if (/путеше|поезд/.test(text)) return 'plane';
    if (/парол|доступ/.test(text)) return 'lock';
    if (/входящ/.test(text)) return 'inbox';
    if (/операц|запис/.test(text)) return 'operations';
    if (/аналит|категор/.test(text)) return 'analytics';
    if (/план|время|итог дня|вечер/.test(text)) return 'planning';
    if (/экспорт|csv|выгруз|импорт/.test(text)) return 'export';
    if (/долг|обязательств|источник/.test(text)) return 'debt';
    if (/перевод/.test(text)) return 'transfer';
    if (/check|утр/.test(text)) return 'morning';
    if (/разбор недели/.test(text)) return 'chart';
    if (/папк/.test(text)) return 'folders';
    if (/измен|настроить|редакт/.test(text)) return 'edit';
    if (/удал|закрыть/.test(text)) return 'close';
    if (/добав|создать|новая|зафикс/.test(text)) return 'plus';
    if (/доход/.test(text)) return 'arrow';
    if (/расход/.test(text)) return 'back';
    return 'sparkle';
  }

  function iconForStored(value, label = '') {
    const icon = String(value || '');
    const map = {
      '📖':'book','🧠':'bulb','💧':'water','🏃':'movement','🏋️':'training','🧘':'meditation','🌙':'evening','☀️':'morning',
      '🥗':'food','💰':'wallet','📝':'note','🎯':'focus','🚶':'walk','🧹':'clean','📵':'detox','❤️':'heart','💗':'heart','💊':'health',
      '🎓':'learning','🎨':'art','🌿':'leaf','⏱️':'timer','✅':'habit','🛡️':'shield','✨':'sparkle','👥':'users','💡':'bulb',
      '🌸':'flower','📄':'document','📚':'book','🎬':'film','✈️':'plane','🔐':'lock','📥':'inbox','▦':'operations','◌':'analytics',
      '◷':'planning','⇩':'export','!':'debt','⇄':'transfer','↗':'arrow','↘':'back','✎':'edit','×':'close','＋':'plus','◇':'review'
    };
    return map[icon] || iconFor(label || icon);
  }

  function toneFor(value) {
    const text = textKey(value);
    if (/финанс|привыч|здоров|вода/.test(text)) return 'green';
    if (/разоб|долг|обяз|удал/.test(text)) return 'coral';
    if (/gamelife|информац|архив|книг/.test(text)) return 'violet';
    if (/подсказ|календар|иде/.test(text)) return 'amber';
    return 'blue';
  }

  function setIcon(host, name, preserveBadge = false) {
    if (!host || host.dataset.v88Icon === name) return false;
    const badge = preserveBadge ? host.querySelector('em')?.outerHTML || '' : '';
    host.innerHTML = `${svg(name)}${badge}`;
    host.dataset.v88Icon = name;
    writeCount++;
    return true;
  }

  function resolvedTheme() { return themeMode === 'system' ? (themeMedia.matches ? 'dark' : 'light') : themeMode; }
  function resolvedMotion() { return reducedMedia.matches ? 'off' : motionMode; }

  function setTheme(mode, persist = true) {
    if (!['light','dark','system'].includes(mode)) mode = 'system';
    themeMode = mode;
    if (persist) savePreference(THEME_KEY, mode);
    applyPreferences();
  }

  function setMotion(mode, persist = true) {
    if (!['full','calm','off'].includes(mode)) mode = 'full';
    motionMode = mode;
    if (persist) savePreference(MOTION_KEY, mode);
    applyPreferences();
  }

  function applyPreferences() {
    const theme = resolvedTheme();
    const motion = resolvedMotion();
    const root = document.documentElement;
    root.classList.remove('v87-light','v87-dark','v88-light','v88-dark');
    root.classList.add(`v87-${theme}`,`v88-${theme}`);
    if (document.body) {
      document.body.classList.add('v87-constellation','v88-constellation');
      document.body.classList.toggle('v88-motion-calm',motion === 'calm');
      document.body.classList.toggle('v88-motion-off',motion === 'off');
      document.body.dataset.visualBuild = VISUAL_BUILD;
      document.body.dataset.themeMode = themeMode;
      document.body.dataset.motionMode = motionMode;
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme === 'dark' ? '#07111d' : '#f5f7fb');
    updateControlState();
  }

  function controlPanelHtml() {
    return `<section class="v88-control-panel" aria-label="Внешний вид" hidden>
      <header><span>${svg('sparkle')}<b>Внешний вид</b></span><small>${BUILD_LABEL}</small></header>
      <div class="v88-control-group"><span>Тема</span><div role="group" aria-label="Тема интерфейса">
        <button type="button" data-v88-theme="light">${svg('sun')}<span>Светлая</span></button>
        <button type="button" data-v88-theme="dark">${svg('moon')}<span>Тёмная</span></button>
        <button type="button" data-v88-theme="system">${svg('system')}<span>Системная</span></button>
      </div></div>
      <div class="v88-control-group"><span>Движение</span><div role="group" aria-label="Интенсивность движения">
        <button type="button" data-v88-motion="full">${svg('sparkle')}<span>Живое</span></button>
        <button type="button" data-v88-motion="calm">${svg('planning')}<span>Спокойное</span></button>
        <button type="button" data-v88-motion="off">${svg('close')}<span>Выключено</span></button>
      </div></div>
      <p>Системное ограничение движения всегда имеет приоритет.</p>
    </section>`;
  }

  function ensureControls() {
    const actions = document.querySelector('.v78-top-actions');
    if (!actions) return;
    let toggle = actions.querySelector('.v88-theme-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'v88-theme-toggle';
      toggle.setAttribute('aria-haspopup','dialog');
      toggle.setAttribute('aria-expanded','false');
      actions.prepend(toggle);
      writeCount++;
      toggle.addEventListener('click',event => {
        event.stopPropagation();
        const panel = document.querySelector('.v88-control-panel');
        if (!panel) return;
        panel.hidden = !panel.hidden;
        toggle.setAttribute('aria-expanded',String(!panel.hidden));
      });
    }
    if (!document.querySelector('.v88-control-panel')) {
      document.body.insertAdjacentHTML('beforeend',controlPanelHtml());
      writeCount++;
      const panel = document.querySelector('.v88-control-panel');
      panel.addEventListener('click',event => {
        const themeButton = event.target.closest('[data-v88-theme]');
        const motionButton = event.target.closest('[data-v88-motion]');
        if (themeButton) setTheme(themeButton.dataset.v88Theme);
        if (motionButton) setMotion(motionButton.dataset.v88Motion);
      });
    }
    updateControlState();
  }

  function updateControlState() {
    const toggle = document.querySelector('.v88-theme-toggle');
    const theme = resolvedTheme();
    if (toggle) {
      const iconName = themeMode === 'system' ? 'system' : theme === 'dark' ? 'sun' : 'moon';
      setIcon(toggle,iconName);
      toggle.setAttribute('aria-label',`Внешний вид: ${themeMode === 'system' ? 'системная тема' : theme === 'dark' ? 'тёмная тема' : 'светлая тема'}`);
      toggle.title = 'Тема и движение';
    }
    document.querySelectorAll('[data-v88-theme]').forEach(button => {
      const active = button.dataset.v88Theme === themeMode;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    document.querySelectorAll('[data-v88-motion]').forEach(button => {
      const active = button.dataset.v88Motion === motionMode;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  function decorateNavigation() {
    document.querySelectorAll('.v78-side-link,.v78-top-tab,.v78-mobile-nav a').forEach(item => {
      const label = item.querySelector('span')?.textContent || item.textContent;
      item.dataset.v88Tone = toneFor(label);
      setIcon(item.querySelector(':scope > i'),iconFor(label));
    });
  }

  function decorateChrome() {
    document.querySelectorAll('.v78-top-actions > button').forEach(button => {
      if (button.classList.contains('v88-theme-toggle') || button.classList.contains('v78-profile-top')) return;
      const label = button.getAttribute('aria-label') || button.textContent;
      if (/поиск/i.test(label)) setIcon(button,'search');
      else if (/подсказ/i.test(label)) setIcon(button,'sparkle',true);
    });
    const fab = document.querySelector('.v86-capture-fab');
    if (fab && !fab.querySelector('.v88-button-icon')) fab.insertAdjacentHTML('afterbegin',`<span class="v88-button-icon">${svg('plus')}</span>`);
  }

  function decorateInterfaceIcons() {
    document.querySelectorAll('.v85-automation-strip button').forEach(button => setIcon(button.querySelector(':scope > i'),iconFor(button.textContent)));
    document.querySelectorAll('.v85-routine-card>i,.v83-quests article>i,.v83-skills article>i,.v85-achievements article>i').forEach(host => setIcon(host,iconForStored(host.textContent,host.parentElement?.textContent)));
    document.querySelectorAll('.v78-info-folder').forEach(button => setIcon(button.querySelector(':scope > i'),iconFor(button.textContent)));
    document.querySelectorAll('.v78-finance-folder').forEach(button => setIcon(button.querySelector(':scope > i'),iconFor(button.textContent)));
    document.querySelectorAll('.v78-operation-folder button').forEach(button => setIcon(button.querySelector(':scope > i'),iconFor(button.textContent)));
    document.querySelectorAll('.v82-habit-settings,[data-v85-action="edit-reward"]').forEach(button => {
      button.setAttribute('aria-label',button.getAttribute('aria-label') || 'Редактировать');
      setIcon(button,'edit');
    });
    document.querySelectorAll('[data-v85-action="delete-reward"]').forEach(button => {
      button.setAttribute('aria-label',button.getAttribute('aria-label') || 'Удалить');
      setIcon(button,'close');
    });
    document.querySelectorAll('.v82-calendar-nav button').forEach(button => {
      const text = button.textContent.trim();
      if (text === '←') { button.setAttribute('aria-label','Предыдущий период'); setIcon(button,'back'); }
      if (text === '→') { button.setAttribute('aria-label','Следующий период'); setIcon(button,'arrow'); }
    });
    document.querySelectorAll('.v82-habit-icon,.v78-habit-chip>i').forEach(host => setIcon(host,iconForStored(host.textContent,host.parentElement?.textContent)));
    document.querySelectorAll('.v82-icon-picker [data-v82-action="select-habit-icon"]').forEach(button => {
      const host = button.querySelector('i');
      setIcon(host,iconForStored(button.dataset.icon,button.textContent));
    });
    const habitPreview = document.querySelector('#v82_icon_preview');
    if (habitPreview && !habitPreview.querySelector('.v88-icon')) setIcon(habitPreview,iconForStored(document.querySelector('#v78_habit_icon')?.value,habitPreview.textContent));
  }

  function ensureFinanceIconPicker() {
    const select = document.querySelector('#v866_category_icon');
    if (!select || document.querySelector('.v88-finance-icon-picker')) return;
    const options = [...select.options].filter(option => option.value).slice(0,30);
    if (!options.length) return;
    const picker = document.createElement('div');
    picker.className = 'v88-finance-icon-picker';
    picker.setAttribute('role','group');
    picker.setAttribute('aria-label','Фирменная иконка категории');
    picker.innerHTML = `<header><b>Фирменная иконка</b><small>Сохранение совместимо с текущими категориями</small></header><div>${options.map(option => `<button type="button" data-v88-finance-icon="${escapeAttribute(option.value)}" title="${escapeAttribute(option.textContent)}">${svg(iconForStored(option.value,option.textContent))}</button>`).join('')}</div>`;
    select.closest('label')?.insertAdjacentElement('afterend',picker);
    writeCount++;
    picker.addEventListener('click',event => {
      const button = event.target.closest('[data-v88-finance-icon]');
      if (!button) return;
      select.value = button.dataset.v88FinanceIcon;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      updateFinancePicker(select,picker);
    });
    select.addEventListener('change',() => updateFinancePicker(select,picker));
    updateFinancePicker(select,picker);
  }

  function updateFinancePicker(select,picker) {
    picker.querySelectorAll('[data-v88-finance-icon]').forEach(button => {
      const active = button.dataset.v88FinanceIcon === select.value;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  function escapeAttribute(value) {
    return String(value || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  function visibleState() {
    const state = window.state || {};
    const list = key => Array.isArray(state[key]) ? state[key] : [];
    const goals = list('goals').filter(item => item && !['done','archived'].includes(String(item.status)));
    const habits = list('habits').filter(item => item && item.active !== false);
    const tasks = list('tasks').filter(item => item && !item.done && item.status !== 'done' && item.status !== 'archived');
    const today = new Date().toISOString().slice(0,10);
    const habitsDone = habits.filter(item => Boolean(item.marks?.[today])).length;
    return {goals,habits,tasks,habitsDone};
  }

  function hashSeed(value) {
    let hash = 2166136261;
    for (const char of String(value || '')) { hash ^= char.charCodeAt(0); hash = Math.imul(hash,16777619); }
    return hash >>> 0;
  }

  function constellationData() {
    const data = visibleState();
    const entries = [
      ...data.goals.slice(0,6).map(item => ({type:'goal',id:item.id || item.title,done:false})),
      ...data.habits.slice(0,7).map(item => ({type:'habit',id:item.id || item.name,done:Boolean(item.marks?.[new Date().toISOString().slice(0,10)] )})),
      ...data.tasks.slice(0,5).map(item => ({type:'task',id:item.id || item.title,done:false}))
    ];
    if (!entries.length) entries.push({type:'goal',id:'focus'},{type:'habit',id:'rhythm'},{type:'task',id:'next'});
    const nodes = entries.map((entry,index) => {
      const seed = hashSeed(`${entry.type}:${entry.id}:${index}`);
      return {...entry,x:28 + seed % 306,y:24 + Math.floor(seed / 97) % 166,r:entry.done ? 4.6 : entry.type === 'goal' ? 3.8 : 2.7};
    });
    const lines = [];
    nodes.forEach((node,index) => { if (index) lines.push([nodes[Math.max(0,index - 1)],node]); if (index > 3 && index % 3 === 0) lines.push([nodes[index - 3],node]); });
    const signature = `${data.goals.length}|${data.habits.length}|${data.tasks.length}|${data.habitsDone}|${nodes.map(node => `${node.type}:${node.id}:${node.done}`).join(',')}`;
    return {...data,nodes,lines,signature};
  }

  function ensureConstellation() {
    const hero = document.querySelector('.v83-today-game');
    if (!hero) return;
    const data = constellationData();
    let map = hero.querySelector('.v88-live-map');
    if (map?.dataset.signature === data.signature) return;
    const html = `<span class="v88-live-map" data-signature="${escapeAttribute(data.signature)}" aria-hidden="true"><svg viewBox="0 0 360 220" fill="none"><g class="v88-map-lines">${data.lines.map(([a,b]) => `<path d="M${a.x} ${a.y} ${b.x} ${b.y}"/>`).join('')}</g><g class="v88-map-points">${data.nodes.map(node => `<circle class="${node.type}${node.done?' done':''}" cx="${node.x}" cy="${node.y}" r="${node.r}"/>`).join('')}</g></svg></span><span class="v88-constellation-legend" aria-label="Активные связи: целей ${data.goals.length}, привычек ${data.habits.length}, задач ${data.tasks.length}"><i class="goal"></i>${data.goals.length}<i class="habit"></i>${data.habits.length}<i class="task"></i>${data.tasks.length}</span>`;
    map?.remove();
    hero.querySelector('.v88-constellation-legend')?.remove();
    hero.insertAdjacentHTML('beforeend',html);
    hero.classList.add('v88-live-hero');
    writeCount++;
  }

  function decorateAssistant() {
    document.querySelectorAll('.v78-assistant-card,.v78-interview-card').forEach(card => {
      if (!card.querySelector('.v88-assistant-orb')) { card.insertAdjacentHTML('beforeend','<span class="v88-assistant-orb" aria-hidden="true"></span>'); writeCount++; }
    });
  }

  function setBuildBadge() {
    const badge = document.querySelector('.v78-build');
    if (badge && badge.textContent !== BUILD_LABEL) { badge.textContent = BUILD_LABEL; writeCount++; }
  }

  function ensureUpdateBanner() {
    if (document.querySelector('.v88-update-banner')) return document.querySelector('.v88-update-banner');
    const banner = document.createElement('aside');
    banner.className = 'v88-update-banner';
    banner.hidden = true;
    banner.innerHTML = `${svg('export')}<span><b>Доступно обновление</b><small>Данные останутся на месте</small></span><button type="button">Обновить</button>`;
    document.body.append(banner);
    banner.querySelector('button').addEventListener('click',() => window.SecondBrainPWA?.applyUpdate?.() || location.reload());
    return banner;
  }

  function showUpdateBanner() { const banner = ensureUpdateBanner(); banner.hidden = false; }

  function apply() {
    applyCount++;
    applyPreferences();
    ensureControls();
    decorateNavigation();
    decorateChrome();
    decorateInterfaceIcons();
    ensureFinanceIconPicker();
    ensureConstellation();
    decorateAssistant();
    setBuildBadge();
  }

  function schedule() {
    if (scheduledFrame) return;
    scheduledFrame = requestAnimationFrame(() => { scheduledFrame = 0; apply(); });
  }

  function routeChanged() {
    document.body?.classList.add('v88-route-changing');
    schedule();
    window.setTimeout(() => { document.body?.classList.remove('v88-route-changing'); schedule(); },220);
  }

  document.addEventListener('click',event => {
    const panel = document.querySelector('.v88-control-panel');
    const toggle = document.querySelector('.v88-theme-toggle');
    if (panel && !panel.hidden && !panel.contains(event.target) && !toggle?.contains(event.target)) {
      panel.hidden = true;
      toggle?.setAttribute('aria-expanded','false');
    }
  });
  document.addEventListener('keydown',event => {
    if (event.key !== 'Escape') return;
    const panel = document.querySelector('.v88-control-panel');
    if (panel && !panel.hidden) { panel.hidden = true; document.querySelector('.v88-theme-toggle')?.setAttribute('aria-expanded','false'); }
  });

  const observer = new MutationObserver(schedule);
  const appRoot = document.getElementById('app');
  const modalRoot = document.getElementById('modal');
  if (appRoot) observer.observe(appRoot,{childList:true,subtree:true});
  if (modalRoot) observer.observe(modalRoot,{childList:true,subtree:true});
  window.addEventListener('hashchange',routeChanged);
  window.addEventListener('pageshow',schedule);
  themeMedia.addEventListener?.('change',() => { if (themeMode === 'system') applyPreferences(); });
  reducedMedia.addEventListener?.('change',applyPreferences);
  navigator.serviceWorker?.addEventListener?.('controllerchange',showUpdateBanner);
  window.addEventListener('second-brain-update-ready',showUpdateBanner);
  window.setInterval(() => { if (window.SecondBrainPWA?.getStatus?.().updateReady) showUpdateBanner(); },60000);

  apply();
  [100,420,1100,2200].forEach(delay => window.setTimeout(schedule,delay));
  window.SecondBrainVisual = {
    apply,
    setTheme,
    setMotion,
    build:VISUAL_BUILD,
    getSettings:() => ({themeMode,motionMode,resolvedTheme:resolvedTheme(),resolvedMotion:resolvedMotion()}),
    getMetrics:() => ({applyCount,writeCount,scheduled:Boolean(scheduledFrame)})
  };
})();
