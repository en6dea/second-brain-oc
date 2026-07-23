'use strict';

/* Obsidian Constellation: decorative runtime only. */
(() => {
  const VISUAL_BUILD = 'obsidian-constellation-v87-r1';
  const THEME_KEY = 'secondBrainOS.visualTheme';
  let frame = 0;

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
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    morning:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M20 12h2M17.7 6.3l1.4-1.4"/>',
    evening:'<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    folders:'<path d="M3 6h7l2 2h9v11H3V6Z"/>'
  };

  const svg = name => `<svg class="v87-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.sparkle}</svg>`;

  function iconFor(value) {
    const text = String(value || '').toLocaleLowerCase('ru-RU');
    if (/главн|сегодня/.test(text)) return 'home';
    if (/gamelife|подсказ|помощ/.test(text)) return 'sparkle';
    if (/цел/.test(text)) return 'target';
    if (/разоб|очеред/.test(text)) return 'review';
    if (/календар|недел/.test(text)) return 'calendar';
    if (/финанс|операц|расход|доход/.test(text)) return 'wallet';
    if (/привыч/.test(text)) return 'habit';
    if (/информац/.test(text)) return 'info';
    if (/архив/.test(text)) return 'archive';
    if (/настрой|систем/.test(text)) return 'settings';
    if (/профил/.test(text)) return 'user';
    if (/check|утр/.test(text)) return 'morning';
    if (/итог дня|вечер/.test(text)) return 'evening';
    if (/разбор недели|аналит/.test(text)) return 'chart';
    if (/папк/.test(text)) return 'folders';
    return 'sparkle';
  }

  function toneFor(value) {
    const text = String(value || '').toLocaleLowerCase('ru-RU');
    if (/финанс|привыч/.test(text)) return 'green';
    if (/разоб|обяз/.test(text)) return 'coral';
    if (/gamelife|информац|архив/.test(text)) return 'violet';
    if (/подсказ|календар/.test(text)) return 'amber';
    return 'blue';
  }

  function setIcon(host, name) {
    if (!host || host.dataset.v87Icon === name) return;
    host.innerHTML = svg(name);
    host.dataset.v87Icon = name;
  }

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; }
  }

  function applyTheme(theme, persist = false) {
    const dark = theme === 'dark';
    document.documentElement.classList.toggle('v87-dark', dark);
    document.documentElement.classList.toggle('v87-light', !dark);
    document.body?.classList.add('v87-constellation');
    document.body?.classList.add('v87-theme-changing');
    document.body?.setAttribute('data-visual-build', VISUAL_BUILD);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#07111d' : '#f5f7fb');
    if (persist) try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (_) {}
    window.setTimeout(() => document.body?.classList.remove('v87-theme-changing'), 450);
    decorateThemeButton();
  }

  function decorateThemeButton() {
    const actions = document.querySelector('.v78-top-actions');
    if (!actions) return;
    let button = actions.querySelector('.v87-theme-toggle');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'v87-theme-toggle';
      actions.prepend(button);
      button.addEventListener('click', () => applyTheme(document.documentElement.classList.contains('v87-dark') ? 'light' : 'dark', true));
    }
    const dark = document.documentElement.classList.contains('v87-dark');
    button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    setIcon(button, dark ? 'sun' : 'moon');
  }

  function decorateNavigation() {
    document.querySelectorAll('.v78-side-link,.v78-top-tab,.v78-mobile-nav a').forEach(item => {
      const label = item.querySelector('span')?.textContent || item.textContent;
      item.dataset.v87Tone = toneFor(label);
      setIcon(item.querySelector(':scope > i'), iconFor(label));
    });
    document.querySelectorAll('.v85-automation-strip button').forEach(button => setIcon(button.querySelector(':scope > i'), iconFor(button.textContent)));
    document.querySelectorAll('.v78-top-actions > button').forEach(button => {
      const label = button.getAttribute('aria-label') || '';
      if (/поиск/i.test(label)) setIcon(button, 'search');
      if (/подсказ/i.test(label)) {
        const badge = button.querySelector('em')?.outerHTML || '';
        button.innerHTML = `${svg('sparkle')}${badge}`;
        button.dataset.v87Icon = 'sparkle';
      }
    });
  }

  function decorateHero() {
    const hero = document.querySelector('.v83-today-game');
    if (hero && !hero.querySelector('.v87-live-map')) {
      hero.insertAdjacentHTML('beforeend', `<span class="v87-live-map" aria-hidden="true"><svg viewBox="0 0 360 220" fill="none"><g class="v87-map-lines" stroke="currentColor"><path d="M18 146 72 112 122 137 171 78 226 104 276 55 342 82"/><path d="M72 112 98 45 171 78 203 170 279 187 342 82"/><path d="M122 137 203 170 226 104 304 129"/><path d="M98 45 154 23 226 104"/></g><g class="v87-map-points" fill="currentColor"><circle cx="18" cy="146" r="2"/><circle cx="72" cy="112" r="2.8"/><circle cx="98" cy="45" r="2.2"/><circle cx="122" cy="137" r="2.1"/><circle cx="154" cy="23" r="1.8"/><circle class="v87-map-core" cx="171" cy="78" r="4.4"/><circle cx="203" cy="170" r="2.5"/><circle cx="226" cy="104" r="2.3"/><circle cx="276" cy="55" r="2.1"/><circle cx="279" cy="187" r="2.2"/><circle cx="304" cy="129" r="1.9"/><circle cx="342" cy="82" r="2.6"/></g></svg></span>`);
    }
    document.querySelectorAll('.v78-assistant-card,.v78-interview-card').forEach(card => {
      if (!card.querySelector('.v87-assistant-orb')) card.insertAdjacentHTML('beforeend','<span class="v87-assistant-orb" aria-hidden="true"></span>');
    });
    const badge = document.querySelector('.v78-build');
    if (badge) badge.textContent = 'V86.12 · OBSIDIAN';
  }

  function apply() {
    document.body?.classList.add('v87-constellation');
    document.body?.setAttribute('data-visual-build', VISUAL_BUILD);
    decorateThemeButton();
    decorateNavigation();
    decorateHero();
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; apply(); });
  }

  const initial = storedTheme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {childList:true,subtree:true});
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule);
  applyTheme(initial);
  apply();
  [120,480,1200].forEach(delay => setTimeout(schedule, delay));
  window.SecondBrainVisual = {apply, setTheme:theme => applyTheme(theme, true), build:VISUAL_BUILD};
})();
