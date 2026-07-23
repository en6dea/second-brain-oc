'use strict';

(() => {
  const V66_BUILD = 'second-brain-space-v66-trading-balance-20260716-r1';
  const V66_LABEL = 'V66 · SAFE PERSONAL OS';
  const CUSTOM_ROUTES = new Set(['trading', 'sleep']);
  const arr = key => Array.isArray(state?.[key]) ? state[key] : [];
  const cleanText = value => String(value ?? '').trim();
  const done = item => ['готово', 'сделано', 'закрыто', 'done', 'closed', 'выполнено'].includes(cleanText(item?.status).toLocaleLowerCase('ru-RU'));
  let pendingRestore = null;
  let postQueued = false;

  state.settings = state.settings || {};
  state.settings.v66 = Object.assign({
    sleepTarget: 6,
    tradeView: 'demo',
    tradingRisk: { accountBalance: 0, perTradePct: 0.5, dailyPct: 2, weeklyPct: 5 },
    security: { pinEnabled: false, pinSalt: '', pinHash: '', pinLength: 4, autoLockMinutes: 15, failedAttempts: 0, lockedUntil: 0 },
    notifications: { morning: '09:00', evening: '20:00', channel: 'iphone', enabled: false }
  }, state.settings.v66 || {});
  state.settings.v66.tradingRisk = Object.assign({ accountBalance: 0, perTradePct: 0.5, dailyPct: 2, weeklyPct: 5 }, state.settings.v66.tradingRisk || {});
  state.settings.v66.security = Object.assign({ pinEnabled: false, pinSalt: '', pinHash: '', pinLength: 4, autoLockMinutes: 15, failedAttempts: 0, lockedUntil: 0 }, state.settings.v66.security || {});
  state.settings.v66.notifications = Object.assign({ morning: '09:00', evening: '20:00', channel: 'iphone', enabled: false }, state.settings.v66.notifications || {});
  state.sleepEntries = arr('sleepEntries');
  state.trades = arr('trades');

  const COLLECTIONS = [
    ['people', 'Люди', true], ['goals', 'Цели', true], ['habits', 'Привычки', true], ['tasks', 'Задачи', true],
    ['notes', 'Заметки', true], ['ideas', 'Идеи', true], ['personal', 'Личная память', true], ['subconsciousEntries', 'Дневник подсознания', true],
    ['documents', 'Документы', true], ['books', 'Книги', true], ['films', 'Фильмы', true], ['trips', 'Путешествия', true],
    ['wishes', 'Желания', true], ['purchases', 'Покупки', true], ['events', 'События', true], ['inbox', 'Входящие', true],
    ['reviews', 'Обзоры', true], ['dailyReviews', 'Итоги дня', true], ['sleepEntries', 'Сон', true], ['trades', 'Торговый журнал', true],
    ['folders', 'Папки', true], ['archive', 'Архив', true], ['operations', 'Финансовые операции', false], ['debts', 'Долги', false]
  ];

  function v66DownloadSnapshot(suffix = 'backup') {
    const copy = typeof exportableState === 'function' ? exportableState() : JSON.parse(JSON.stringify(state));
    if (copy.settings?.sync) delete copy.settings.sync.token;
    if (copy.settings) delete copy.settings.alfaWorkerKey;
    if (copy.settings?.v66) delete copy.settings.v66.security;
    const blob = new Blob([JSON.stringify({ version: V66_BUILD, createdAt: new Date().toISOString(), state: copy }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `second-brain-${suffix}-${today()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1200);
  }

  function v66OpenVault() {
    pendingRestore = null;
    openModal('Хранилище и безопасное восстановление', `<div class="v66-vault"><section class="v66-vault-intro"><span>⛨</span><div><h3>Личные данные не заменяются вслепую</h3><p>Сначала приложение покажет только количество записей. По умолчанию выбран режим объединения, а финансы и долги выключены.</p></div></section><div class="v66-vault-actions"><button data-v66-action="downloadBackup" type="button">Скачать текущую копию</button><label class="v66-file-picker"><span>Выбрать JSON-копию</span><input id="v66_restore_file" type="file" accept=".json,application/json"></label><button class="is-primary" data-v66-action="previewBackup" type="button">Показать состав</button></div><p class="v66-vault-note">Файл читается только в браузере и никуда не отправляется.</p></div>`);
  }

  function v66CollectionRows(incoming) {
    return COLLECTIONS.map(([key, label, selected]) => {
      const incomingCount = Array.isArray(incoming[key]) ? incoming[key].length : 0;
      const currentCount = arr(key).length;
      return `<label class="v66-restore-row ${incomingCount ? '' : 'is-empty'}"><input class="v66-restore-check" type="checkbox" value="${esc(key)}" ${selected && incomingCount ? 'checked' : ''} ${incomingCount ? '' : 'disabled'}><span><b>${esc(label)}</b><small>сейчас ${currentCount} · в копии ${incomingCount}</small></span><em>${selected ? 'личное' : 'вручную'}</em></label>`;
    }).join('');
  }

  async function v66PreviewBackup() {
    const file = document.getElementById('v66_restore_file')?.files?.[0];
    if (!file) return toast('Выберите JSON-копию');
    if (file.size > 25 * 1024 * 1024) return toast('Файл больше 25 МБ — проверьте, что это копия приложения');
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = parsed?.state || parsed;
      if (!incoming || typeof incoming !== 'object') throw new Error('Некорректная структура');
      const total = COLLECTIONS.reduce((sum, [key]) => sum + (Array.isArray(incoming[key]) ? incoming[key].length : 0), 0);
      if (!total) throw new Error('В копии не найдены поддерживаемые разделы');
      pendingRestore = { incoming, fileName: file.name, version: parsed?.version || 'без версии', createdAt: parsed?.createdAt || '' };
      openModal('Предпросмотр резервной копии', `<div class="v66-vault"><section class="v66-vault-intro is-ready"><span>✓</span><div><h3>${esc(file.name)}</h3><p>${total} записей в поддерживаемых разделах · ${esc(pendingRestore.version)}</p></div></section><div class="v66-restore-mode"><label><input type="radio" name="v66_restore_mode" value="merge" checked><span><b>Объединить безопасно</b><small>Текущие записи сохраняются, недостающие добавляются</small></span></label><label><input type="radio" name="v66_restore_mode" value="replace"><span><b>Заменить выбранные разделы</b><small>Только отмеченные коллекции будут заменены</small></span></label></div><div class="v66-restore-list">${v66CollectionRows(incoming)}</div><div class="v66-vault-actions"><button data-v66-action="openVault" type="button">Выбрать другой файл</button><button class="is-primary" data-v66-action="applyRestore" type="button">Восстановить выбранное</button></div><p class="v66-vault-note">Перед применением приложение автоматически скачает копию текущего состояния.</p></div>`);
    } catch (error) {
      pendingRestore = null;
      toast(`Не удалось прочитать копию: ${error.message || error}`);
    }
  }

  function v66RecordKey(collection, item) {
    if (item?.id) return `id:${item.id}`;
    const base = collection === 'people' ? [item?.name, item?.birthday, item?.phone]
      : collection === 'goals' ? [item?.title, item?.deadline]
        : collection === 'habits' ? [item?.name]
          : collection === 'tasks' ? [item?.title, item?.date, item?.time]
            : collection === 'sleepEntries' ? [item?.date]
              : collection === 'subconsciousEntries' ? [item?.date]
                : collection === 'trades' ? [item?.date, item?.pair, item?.entry, item?.direction]
                  : [item?.title || item?.name || item?.person, item?.date || item?.due, item?.type || item?.area];
    return `sig:${base.map(value => cleanText(value).toLocaleLowerCase('ru-RU')).join('|')}`;
  }

  function v66MergeCollection(collection, current, incoming) {
    const result = current.map(item => ({ ...item }));
    const index = new Map(result.map((item, position) => [v66RecordKey(collection, item), position]));
    incoming.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const key = v66RecordKey(collection, item);
      if (index.has(key)) {
        const position = index.get(key);
        result[position] = { ...item, ...result[position] };
      } else {
        index.set(key, result.length);
        result.push({ ...item, id: item.id || uid() });
      }
    });
    return result;
  }

  function v66ApplyRestore() {
    if (!pendingRestore) return toast('Сначала выберите и проверьте копию');
    const selected = [...document.querySelectorAll('.v66-restore-check:checked')].map(input => input.value);
    if (!selected.length) return toast('Выберите хотя бы один раздел');
    const mode = document.querySelector('input[name="v66_restore_mode"]:checked')?.value || 'merge';
    const question = mode === 'replace'
      ? `Заменить выбранные разделы (${selected.length}) данными из копии? Текущее состояние сначала будет скачано.`
      : `Объединить выбранные разделы (${selected.length}) с текущими данными?`;
    if (!window.confirm(question)) return;
    v66DownloadSnapshot('before-restore');
    selected.forEach(collection => {
      const incoming = Array.isArray(pendingRestore.incoming[collection]) ? pendingRestore.incoming[collection] : [];
      state[collection] = mode === 'replace' ? incoming.map(item => ({ ...item, id: item?.id || uid() })) : v66MergeCollection(collection, arr(collection), incoming);
    });
    state = typeof normalize === 'function' ? normalize(state) : state;
    state.settings = state.settings || {};
    state.settings.v66 = state.settings.v66 || {};
    state.settings.v66.lastRestore = { at: new Date().toISOString(), fileName: pendingRestore.fileName, mode, collections: selected };
    pendingRestore = null;
    save(); closeModal(); render(); toast('Выбранные данные восстановлены');
  }

  const bytesToBase64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const base64ToBytes = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));

  async function v66PinHash(pin, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
    return bytesToBase64(bits);
  }

  function v66OpenSecurity() {
    const security = state.settings.v66.security;
    const pinLength = num(security.pinLength) || 4;
    if (!security.pinEnabled) {
      openModal('PIN-защита устройства', `<div class="v66-security"><section><span>●</span><div><h3>Четырёхзначный PIN</h3><p>PIN блокирует интерфейс на этом устройстве. Это дополнительная защита, но не замена серверному шифрованию.</p></div></section><label><span>Новый PIN</span><input id="v66_pin_first" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password"></label><label><span>Повторите PIN</span><input id="v66_pin_second" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password"></label><label><span>Автоблокировка</span><select id="v66_pin_timeout"><option value="5">через 5 минут</option><option value="15" selected>через 15 минут</option><option value="30">через 30 минут</option><option value="60">через 1 час</option></select></label><div class="v66-vault-actions"><button class="is-primary" data-v66-action="setupPin" type="button">Включить PIN</button><button data-v66-action="closeModal" type="button">Отмена</button></div></div>`);
      return;
    }
    openModal('PIN-защита устройства', `<div class="v66-security"><section class="is-enabled"><span>✓</span><div><h3>PIN включён</h3><p>${pinLength} цифры · автоблокировка через ${num(security.autoLockMinutes) || 15} минут бездействия.</p></div></section><label><span>Текущий PIN для отключения</span><input id="v66_pin_current" type="password" inputmode="numeric" maxlength="${pinLength}" autocomplete="current-password"></label><label><span>Автоблокировка</span><select id="v66_pin_timeout">${[5, 15, 30, 60].map(minutes => `<option value="${minutes}" ${num(security.autoLockMinutes) === minutes ? 'selected' : ''}>${minutes === 60 ? 'через 1 час' : `через ${minutes} минут`}</option>`).join('')}</select></label><div class="v66-vault-actions"><button data-v66-action="savePinTimeout" type="button">Сохранить интервал</button><button class="is-primary" data-v66-action="lockNow" type="button">Заблокировать сейчас</button><button class="is-danger" data-v66-action="disablePin" type="button">Отключить PIN</button></div></div>`);
  }

  async function v66SetupPin() {
    const first = document.getElementById('v66_pin_first')?.value || '';
    const second = document.getElementById('v66_pin_second')?.value || '';
    if (!/^\d{4}$/.test(first)) return toast('PIN должен состоять из 4 цифр');
    if (first !== second) return toast('PIN-коды не совпадают');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await v66PinHash(first, salt);
    state.settings.v66.security = { pinEnabled: true, pinSalt: bytesToBase64(salt), pinHash: hash, pinLength: 4, autoLockMinutes: num(document.getElementById('v66_pin_timeout')?.value) || 15, failedAttempts: 0, lockedUntil: 0 };
    sessionStorage.setItem('secondBrainOS.v66.pinUnlockedAt', String(Date.now()));
    save(); closeModal(); render(); toast('PIN-защита включена');
  }

  async function v66CheckPin(pin) {
    const security = state.settings.v66.security;
    if (!security.pinEnabled || !security.pinSalt || !security.pinHash) return false;
    const actual = await v66PinHash(pin, base64ToBytes(security.pinSalt));
    return actual === security.pinHash;
  }

  function v66ShowLock() {
    if (document.querySelector('.v66-lock')) return;
    const pinLength = num(state.settings?.v66?.security?.pinLength) || 4;
    const overlay = document.createElement('section');
    overlay.className = 'v66-lock';
    overlay.innerHTML = `<div><span class="v66-lock-mark">◆</span><small>Second Brain OS</small><h1>Личные данные защищены</h1><p>Введите ${pinLength === 4 ? 'четырёхзначный' : `${pinLength}-значный`} PIN этого устройства.</p><input id="v66_unlock_pin" type="password" inputmode="numeric" maxlength="${pinLength}" autocomplete="current-password" aria-label="PIN устройства"><button data-v66-action="unlockPin" type="button">Открыть приложение</button><em id="v66_unlock_error"></em></div>`;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('v66_unlock_pin')?.focus(), 0);
  }

  function v66EnsureLock(force = false) {
    const security = state.settings?.v66?.security || {};
    if (!security.pinEnabled) return document.querySelector('.v66-lock')?.remove();
    const unlockedAt = num(sessionStorage.getItem('secondBrainOS.v66.pinUnlockedAt'));
    const expired = !unlockedAt || Date.now() - unlockedAt > (num(security.autoLockMinutes) || 15) * 60000;
    if (force || expired) v66ShowLock();
  }

  async function v66UnlockPin() {
    const input = document.getElementById('v66_unlock_pin');
    const error = document.getElementById('v66_unlock_error');
    const security = state.settings.v66.security;
    if (num(security.lockedUntil) > Date.now()) {
      const seconds = Math.ceil((num(security.lockedUntil) - Date.now()) / 1000);
      if (error) error.textContent = `Слишком много попыток · подождите ${seconds} сек.`;
      return;
    }
    const pinLength = num(state.settings?.v66?.security?.pinLength) || 4;
    if (!(new RegExp(`^\\d{${pinLength}}$`)).test(input?.value || '')) { if (error) error.textContent = `Введите ${pinLength} цифры`; return; }
    if (await v66CheckPin(input.value)) {
      state.settings.v66.security.failedAttempts = 0;
      state.settings.v66.security.lockedUntil = 0;
      sessionStorage.setItem('secondBrainOS.v66.pinUnlockedAt', String(Date.now()));
      save(); document.querySelector('.v66-lock')?.remove(); toast('Приложение разблокировано');
    } else {
      const failedAttempts = num(state.settings.v66.security.failedAttempts) + 1;
      state.settings.v66.security.failedAttempts = failedAttempts;
      if (failedAttempts >= 5) state.settings.v66.security.lockedUntil = Date.now() + Math.min(300000, 30000 * Math.pow(2, Math.floor((failedAttempts - 5) / 5)));
      save(); input.value = '';
      if (error) error.textContent = failedAttempts >= 5 ? 'Слишком много попыток · пауза 30 секунд' : 'Неверный PIN';
    }
  }

  async function v66DisablePin() {
    const pin = document.getElementById('v66_pin_current')?.value || '';
    if (!(await v66CheckPin(pin))) return toast('Текущий PIN не подходит');
    if (!window.confirm('Отключить PIN-защиту на этом устройстве?')) return;
    state.settings.v66.security = { pinEnabled: false, pinSalt: '', pinHash: '', pinLength: 4, autoLockMinutes: 15, failedAttempts: 0, lockedUntil: 0 };
    sessionStorage.removeItem('secondBrainOS.v66.pinUnlockedAt');
    save(); closeModal(); render(); toast('PIN-защита отключена');
  }

  function v66SavePinTimeout() {
    state.settings.v66.security.autoLockMinutes = num(document.getElementById('v66_pin_timeout')?.value) || 15;
    sessionStorage.setItem('secondBrainOS.v66.pinUnlockedAt', String(Date.now()));
    save(); closeModal(); render(); toast('Интервал сохранён');
  }

  function v66SleepPage() {
    state.sleepEntries = arr('sleepEntries');
    const target = num(state.settings.v66.sleepTarget) || 6;
    const days = Array.from({ length: 14 }, (_, index) => iso(addDays(new Date(), index - 13)));
    const map = new Map(state.sleepEntries.map(entry => [entry.date, entry]));
    const last7 = days.slice(-7).map(date => map.get(date)).filter(entry => num(entry?.hours) > 0);
    const average = last7.length ? last7.reduce((sum, entry) => sum + num(entry.hours), 0) / last7.length : 0;
    const stable = last7.filter(entry => Math.abs(num(entry.hours) - target) <= 1).length;
    const todayEntry = map.get(today()) || {};
    const debt = last7.reduce((sum, entry) => sum + Math.max(0, target - num(entry.hours)), 0);
    return layout('Сон', 'Количество часов, недельная динамика и спокойная рекомендация без выдуманных показателей.', `<section class="v66-sleep-page"><div class="v66-sleep-kpis"><article><span>Среднее · 7 дней</span><b>${average ? `${average.toFixed(1)} ч` : '—'}</b><small>${last7.length} ночей с данными</small></article><article><span>Минимальная цель</span><b>от ${target} ч</b><small>можно изменить ниже</small></article><article><span>Не ниже минимума</span><b>${last7.length ? `${last7.filter(entry => num(entry.hours) >= target).length}/${last7.length}` : '—'}</b><small>ритм важнее идеальности</small></article><article><span>Недобор · 7 дней</span><b>${last7.length ? `${debt.toFixed(1)} ч` : '—'}</b><small>сумма относительно минимума</small></article></div><div class="v66-sleep-layout"><article class="v66-panel"><div class="v66-panel-head"><div><span class="v65-overline">Сегодня</span><h3>Зафиксировать сон</h3><p>Достаточно количества часов. Комментарий необязателен.</p></div></div><div class="v66-sleep-form"><label><span>Дата</span><input id="v66_sleep_date" type="date" value="${today()}"></label><label><span>Часов сна</span><input id="v66_sleep_hours" type="number" min="0.25" max="24" step="0.25" value="${esc(todayEntry.hours || '')}" placeholder="Например, 7.5"></label><label><span>Минимум, часов</span><input id="v66_sleep_target" type="number" min="4" max="12" step="0.25" value="${target}"></label><label class="is-wide"><span>Короткая заметка</span><input id="v66_sleep_note" value="${esc(todayEntry.note || '')}" placeholder="Например: поздно лёг, проснулся спокойно"></label></div><button class="v66-primary" data-v66-action="saveSleep" type="button">Сохранить сон</button><p class="v66-fineprint">Оценки самочувствия и медицинские выводы приложение не придумывает.</p></article><article class="v66-panel"><div class="v66-panel-head"><div><span class="v65-overline">14 дней</span><h3>Динамика часов</h3><p>Пунктирный минимум — ${target} часов.</p></div></div><div class="v66-sleep-chart" style="--sleep-target:${Math.min(100, target / 12 * 100)}%">${days.map(date => { const hours = num(map.get(date)?.hours); return `<div title="${fmt(date)} · ${hours || 'нет данных'}"><span><i style="height:${hours ? Math.min(100, hours / 12 * 100) : 3}%"></i></span><small>${new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2)}</small></div>`; }).join('')}</div><div class="v66-sleep-history">${state.sleepEntries.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 7).map(entry => `<article><span>${fmt(entry.date)}</span><b>${num(entry.hours).toFixed(1)} ч</b><small>${esc(entry.note || 'без заметки')}</small></article>`).join('') || '<p>Пока нет записей сна.</p>'}</div></article></div></section>`);
  }

  function v66SaveSleep() {
    const date = document.getElementById('v66_sleep_date')?.value || today();
    const hours = num(document.getElementById('v66_sleep_hours')?.value);
    const target = num(document.getElementById('v66_sleep_target')?.value);
    if (hours <= 0 || hours > 24) return toast('Укажите сон от 0,25 до 24 часов');
    if (target < 4 || target > 12) return toast('Цель сна должна быть от 4 до 12 часов');
    const existing = arr('sleepEntries').find(entry => entry.date === date) || {};
    const record = { ...existing, id: existing.id || uid(), date, hours, note: cleanText(document.getElementById('v66_sleep_note')?.value), updatedAt: new Date().toISOString() };
    state.sleepEntries = [record, ...arr('sleepEntries').filter(entry => entry.date !== date)];
    state.settings.v66.sleepTarget = target;
    save(); render(); toast('Сон сохранён');
  }

  const tradeRisk = () => state.settings.v66.tradingRisk;
  const monday = date => { const value = new Date(`${date}T12:00:00`); return iso(addDays(value, -((value.getDay() + 6) % 7))); };

  function v66TradeStats(mode) {
    const trades = arr('trades').filter(trade => trade.mode === mode);
    const closed = trades.filter(trade => num(trade.resultAmount) !== 0);
    const wins = closed.filter(trade => num(trade.resultAmount) > 0);
    const net = closed.reduce((sum, trade) => sum + num(trade.resultAmount), 0);
    const followed = trades.filter(trade => trade.followedPlan === true || trade.followedPlan === 'true').length;
    const violations = trades.filter(trade => trade.riskViolation).length;
    return { trades, closed, wins, net, followed, violations, winRate: closed.length ? Math.round(wins.length / closed.length * 100) : 0 };
  }

  function v66TradingPage() {
    state.trades = arr('trades');
    const mode = state.settings.v66.tradeView === 'real' ? 'real' : 'demo';
    const stats = v66TradeStats(mode);
    const risk = tradeRisk();
    const balance = num(risk.accountBalance);
    const maxTrade = balance * num(risk.perTradePct) / 100;
    const realTrades = arr('trades').filter(trade => trade.mode === 'real');
    const dayLoss = realTrades.filter(trade => trade.date === today() && num(trade.resultAmount) < 0).reduce((sum, trade) => sum + Math.abs(num(trade.resultAmount)), 0);
    const weekStart = monday(today());
    const weekLoss = realTrades.filter(trade => trade.date >= weekStart && trade.date <= today() && num(trade.resultAmount) < 0).reduce((sum, trade) => sum + Math.abs(num(trade.resultAmount)), 0);
    const dayLimit = balance * num(risk.dailyPct) / 100;
    const weekLimit = balance * num(risk.weeklyPct) / 100;
    return layout('Forex-журнал', 'Демо и реальные сделки разделены. Журнал оценивает соблюдение ваших правил, но не выдаёт торговых сигналов.', `<section class="v66-trading-page"><div class="v66-trade-hero"><div><span class="v65-overline">Контроль процесса</span><h2>${mode === 'demo' ? 'Демо-счёт' : 'Реальный счёт'}</h2><p>${mode === 'demo' ? 'Учитесь исполнять план без смешивания с реальными результатами.' : 'Перед каждой сделкой сверяйте риск и дневной лимит.'}</p><div class="v66-trade-tabs"><button class="${mode === 'demo' ? 'active' : ''}" data-v66-action="tradeMode" data-mode="demo" type="button">Демо</button><button class="${mode === 'real' ? 'active' : ''}" data-v66-action="tradeMode" data-mode="real" type="button">Реальный</button></div></div><div class="v66-trade-hero-actions"><button data-v66-action="openRisk" type="button">Лимиты риска</button><button class="v66-primary" data-v66-action="openTrade" type="button">＋ Записать сделку</button></div></div>${mode === 'real' ? `<div class="v66-risk-strip ${balance && dayLoss <= dayLimit && weekLoss <= weekLimit ? 'is-ok' : 'is-warn'}"><article class="v66-balance-cell"><span>Фактический баланс до сделок</span><div class="v66-inline-balance"><input id="v66_inline_balance" type="number" min="0.01" step="0.01" inputmode="decimal" value="${balance || ''}" placeholder="Введите баланс"><button data-v66-action="saveBalance" type="button">Сохранить</button></div><small>${balance ? `Сейчас: ${money(balance)}` : 'Нужен для расчёта лимитов риска'}</small></article><article><span>Макс. риск / сделка</span><b>${balance ? money(maxTrade) : '—'}</b></article><article><span>Убыток сегодня</span><b>${money(dayLoss)} / ${balance ? money(dayLimit) : '—'}</b></article><article><span>Убыток недели</span><b>${money(weekLoss)} / ${balance ? money(weekLimit) : '—'}</b></article></div>` : ''}<div class="v66-trade-kpis"><article><span>Сделок</span><b>${stats.trades.length}</b><small>${mode === 'demo' ? 'демо' : 'реальных'}</small></article><article><span>Результат</span><b class="${stats.net > 0 ? 'is-positive' : stats.net < 0 ? 'is-negative' : ''}">${stats.closed.length ? money(stats.net) : '—'}</b><small>по закрытым записям</small></article><article><span>Win rate</span><b>${stats.closed.length ? `${stats.winRate}%` : '—'}</b><small>${stats.closed.length} закрытых</small></article><article><span>Следование плану</span><b>${stats.trades.length ? `${stats.followed}/${stats.trades.length}` : '—'}</b><small>${stats.violations ? `${stats.violations} нарушений риска` : 'нарушений риска нет'}</small></article></div><div class="v66-trade-layout"><article class="v66-panel"><div class="v66-panel-head"><div><span class="v65-overline">История</span><h3>${mode === 'demo' ? 'Демо-сделки' : 'Реальные сделки'}</h3></div><button data-v66-action="openTrade" type="button">＋ Добавить</button></div><div class="v66-trade-list">${stats.trades.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).map(trade => `<article class="${trade.riskViolation ? 'is-violation' : ''}"><div><span>${trade.direction === 'sell' ? '↓' : '↑'}</span><div><b>${esc(trade.pair || 'FOREX')}</b><small>${fmt(trade.date)} · ${trade.direction === 'sell' ? 'Sell' : 'Buy'} · риск ${money(trade.riskAmount)}</small></div></div><strong class="${num(trade.resultAmount) > 0 ? 'is-positive' : num(trade.resultAmount) < 0 ? 'is-negative' : ''}">${num(trade.resultAmount) ? money(trade.resultAmount) : 'без результата'}</strong><em>${trade.followedPlan === true || trade.followedPlan === 'true' ? 'план соблюдён' : 'план нарушен'}${trade.riskViolation ? ' · риск превышен' : ''}${trade.screenshotsComplete ? ' · фото до/после' : (num(trade.resultAmount) ? ' · нужны фото' : '')}</em><div><button data-v66-action="openTrade" data-id="${esc(trade.id)}" type="button">Открыть</button><button data-v66-action="deleteTrade" data-id="${esc(trade.id)}" type="button">Удалить</button></div></article>`).join('') || '<p class="v66-empty">Сделок в этом режиме пока нет.</p>'}</div></article><aside class="v66-panel v66-trade-rules"><div class="v66-panel-head"><div><span class="v65-overline">Правила</span><h3>Перед реальной сделкой</h3></div></div><ol><li><b>План</b><span>Пара, направление, вход, Stop Loss и Take Profit записаны заранее.</span></li><li><b>Скриншоты</b><span>Сохраняйте график до входа и после выхода для честного разбора.</span></li><li><b>Риск</b><span>Не выше ${num(risk.perTradePct)}% баланса на одну сделку.</span></li><li><b>Стоп дня</b><span>После убытка ${num(risk.dailyPct)}% новые реальные сделки не открываются.</span></li><li><b>Стоп недели</b><span>После убытка ${num(risk.weeklyPct)}% — разбор, а не попытка отыграться.</span></li></ol><p class="v66-fineprint">Это журнал дисциплины и финансовой грамотности, а не инвестиционная рекомендация.</p></aside></div></section>`);
  }

  function v66SaveInlineBalance() {
    const input = document.getElementById('v66_inline_balance');
    const accountBalance = num(input?.value);
    if (accountBalance <= 0) {
      input?.focus();
      return toast('Введите фактический баланс больше нуля');
    }
    state.settings.v66.tradingRisk = Object.assign({}, tradeRisk(), { accountBalance });
    save();
    render();
    toast('Фактический баланс сохранён');
  }

  function v66OpenRisk() {
    const risk = tradeRisk();
    openModal('Лимиты риска Forex', `<div class="v66-risk-form"><p>Значения используются только для предупреждений и статистики. По умолчанию установлены осторожные лимиты, их нужно подтвердить под вашу стратегию.</p><label><span>Баланс реального счёта, ₽</span><input id="v66_risk_balance" type="number" min="0" value="${num(risk.accountBalance) || ''}"></label><label><span>Максимум на сделку, %</span><input id="v66_risk_trade" type="number" min="0.1" max="10" step="0.1" value="${num(risk.perTradePct)}"></label><label><span>Стоп на день, %</span><input id="v66_risk_day" type="number" min="0.1" max="20" step="0.1" value="${num(risk.dailyPct)}"></label><label><span>Стоп на неделю, %</span><input id="v66_risk_week" type="number" min="0.1" max="30" step="0.1" value="${num(risk.weeklyPct)}"></label><div class="v66-vault-actions"><button class="is-primary" data-v66-action="saveRisk" type="button">Сохранить лимиты</button><button data-v66-action="closeModal" type="button">Отмена</button></div></div>`);
  }

  function v66SaveRisk() {
    const values = { accountBalance: num(document.getElementById('v66_risk_balance')?.value), perTradePct: num(document.getElementById('v66_risk_trade')?.value), dailyPct: num(document.getElementById('v66_risk_day')?.value), weeklyPct: num(document.getElementById('v66_risk_week')?.value) };
    if (values.accountBalance < 0 || values.perTradePct <= 0 || values.dailyPct <= 0 || values.weeklyPct <= 0) return toast('Проверьте баланс и проценты');
    if (values.perTradePct > values.dailyPct || values.dailyPct > values.weeklyPct) return toast('Лимиты должны расти: сделка ≤ день ≤ неделя');
    state.settings.v66.tradingRisk = values;
    save(); closeModal(); render(); toast('Лимиты риска сохранены');
  }

  const v66ReadAsDataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    reader.readAsDataURL(file);
  });

  async function v66CompressTradeImage(inputId) {
    const file = document.getElementById(inputId)?.files?.[0];
    if (!file) return '';
    if (!/^image\//i.test(file.type)) throw new Error('Выберите изображение');
    if (file.size > 12 * 1024 * 1024) throw new Error('Скриншот больше 12 МБ');
    if (typeof createImageBitmap !== 'function') {
      if (file.size > 450 * 1024) throw new Error('На этом устройстве выберите скриншот меньше 450 КБ');
      return v66ReadAsDataUrl(file);
    }
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .68));
    if (!blob) throw new Error('Не удалось сжать скриншот');
    if (blob.size > 500 * 1024) throw new Error('После сжатия скриншот всё ещё слишком большой');
    return v66ReadAsDataUrl(blob);
  }

  function v66OpenTrade(id = '') {
    if (!id && window.SecondBrainLife?.beforeOpenTrade && window.SecondBrainLife.beforeOpenTrade(state.settings.v66.tradeView || 'demo') === false) return;
    const trade = id ? arr('trades').find(item => String(item.id) === String(id)) || {} : { date: today(), mode: state.settings.v66.tradeView || 'demo', direction: 'buy', followedPlan: 'true' };
    openModal(id ? 'Редактировать сделку' : 'Записать сделку', `<div class="v66-trade-form"><label><span>Режим</span><select id="v66_trade_mode"><option value="demo" ${trade.mode !== 'real' ? 'selected' : ''}>Демо</option><option value="real" ${trade.mode === 'real' ? 'selected' : ''}>Реальный</option></select></label><label><span>Дата</span><input id="v66_trade_date" type="date" value="${esc(trade.date || today())}"></label><label><span>Валютная пара</span><input id="v66_trade_pair" value="${esc(trade.pair || '')}" placeholder="EUR/USD"></label><label><span>Направление</span><select id="v66_trade_direction"><option value="buy" ${trade.direction !== 'sell' ? 'selected' : ''}>Buy</option><option value="sell" ${trade.direction === 'sell' ? 'selected' : ''}>Sell</option></select></label><label><span>Вход</span><input id="v66_trade_entry" type="number" step="any" value="${esc(trade.entry || '')}"></label><label><span>Stop Loss</span><input id="v66_trade_stop" type="number" step="any" value="${esc(trade.stopLoss || '')}"></label><label><span>Take Profit</span><input id="v66_trade_take" type="number" step="any" value="${esc(trade.takeProfit || '')}"></label><label><span>Риск, ₽</span><input id="v66_trade_risk" type="number" min="0" step="any" value="${esc(trade.riskAmount || '')}"></label><label><span>Результат, ₽</span><input id="v66_trade_result" type="number" step="any" value="${esc(trade.resultAmount ?? '')}" placeholder="Можно заполнить после закрытия"></label><label><span>План соблюдён?</span><select id="v66_trade_plan"><option value="true" ${trade.followedPlan !== false && trade.followedPlan !== 'false' ? 'selected' : ''}>Да</option><option value="false" ${trade.followedPlan === false || trade.followedPlan === 'false' ? 'selected' : ''}>Нет</option></select></label><label class="is-wide"><span>Сетап / причина входа</span><textarea id="v66_trade_setup" placeholder="Что должно было произойти по плану?">${esc(trade.setup || '')}</textarea></label><label><span>Эмоция</span><input id="v66_trade_emotion" value="${esc(trade.emotion || '')}" placeholder="Спокойствие, страх, FOMO…"></label><label><span>Короткий разбор</span><textarea id="v66_trade_note" placeholder="Что повторить или изменить?">${esc(trade.note || '')}</textarea></label><section class="v66-trade-images is-wide"><article><span>Скриншот до сделки</span>${trade.beforeImage ? `<img src="${esc(trade.beforeImage)}" alt="Скриншот до сделки"><label><input id="v66_trade_remove_before" type="checkbox"> удалить текущий</label>` : '<small>План и контекст графика</small>'}<input id="v66_trade_before" type="file" accept="image/*"></article><article><span>Скриншот после сделки</span>${trade.afterImage ? `<img src="${esc(trade.afterImage)}" alt="Скриншот после сделки"><label><input id="v66_trade_remove_after" type="checkbox"> удалить текущий</label>` : '<small>Результат и точка выхода</small>'}<input id="v66_trade_after" type="file" accept="image/*"></article></section></div><div class="v66-vault-actions"><button class="is-primary" data-v66-action="saveTrade" data-id="${esc(id)}" type="button">Сохранить сделку</button><button data-v66-action="closeModal" type="button">Отмена</button></div>`);
  }

  async function v66SaveTrade(id = '') {
    const value = field => document.getElementById(field)?.value || '';
    const existing = id ? arr('trades').find(item => String(item.id) === String(id)) || {} : {};
    const mode = value('v66_trade_mode') === 'real' ? 'real' : 'demo';
    if (!id && mode === 'real' && window.SecondBrainLife?.canSaveRealTrade && window.SecondBrainLife.canSaveRealTrade(mode) === false) return;
    const pair = cleanText(value('v66_trade_pair')).toUpperCase();
    const riskAmount = num(value('v66_trade_risk'));
    if (!pair || !value('v66_trade_date')) return toast('Укажите валютную пару и дату');
    const risk = tradeRisk();
    if (mode === 'real' && num(risk.accountBalance) <= 0) return toast('Сначала укажите баланс реального счёта в лимитах риска');
    if (mode === 'real' && riskAmount <= 0) return toast('Для реальной сделки укажите риск');
    const maxRisk = num(risk.accountBalance) * num(risk.perTradePct) / 100;
    if (mode === 'real') {
      const realTrades = arr('trades').filter(trade => trade.mode === 'real' && String(trade.id) !== String(existing.id || ''));
      const dayLoss = realTrades.filter(trade => trade.date === value('v66_trade_date') && num(trade.resultAmount) < 0).reduce((sum, trade) => sum + Math.abs(num(trade.resultAmount)), 0);
      const weekStart = monday(value('v66_trade_date'));
      const weekLoss = realTrades.filter(trade => trade.date >= weekStart && trade.date <= value('v66_trade_date') && num(trade.resultAmount) < 0).reduce((sum, trade) => sum + Math.abs(num(trade.resultAmount)), 0);
      const warnings = [];
      if (riskAmount > maxRisk) warnings.push(`риск сделки ${money(riskAmount)} выше лимита ${money(maxRisk)}`);
      if (dayLoss >= num(risk.accountBalance) * num(risk.dailyPct) / 100) warnings.push('дневной стоп уже достигнут');
      if (weekLoss >= num(risk.accountBalance) * num(risk.weeklyPct) / 100) warnings.push('недельный стоп уже достигнут');
      if (warnings.length && !window.confirm(`Нарушение правил риска:\n\n• ${warnings.join('\n• ')}\n\nСохранить запись реальной сделки после дополнительного подтверждения?`)) return;
    }
    let beforeImage = document.getElementById('v66_trade_remove_before')?.checked ? '' : (existing.beforeImage || '');
    let afterImage = document.getElementById('v66_trade_remove_after')?.checked ? '' : (existing.afterImage || '');
    try {
      beforeImage = await v66CompressTradeImage('v66_trade_before') || beforeImage;
      afterImage = await v66CompressTradeImage('v66_trade_after') || afterImage;
    } catch (error) { return toast(error.message || 'Не удалось обработать скриншот'); }
    const resultAmount = num(value('v66_trade_result'));
    const record = { ...existing, id: existing.id || uid(), mode, date: value('v66_trade_date'), pair, direction: value('v66_trade_direction') === 'sell' ? 'sell' : 'buy', entry: num(value('v66_trade_entry')), stopLoss: num(value('v66_trade_stop')), takeProfit: num(value('v66_trade_take')), riskAmount, resultAmount, followedPlan: value('v66_trade_plan') === 'true', setup: cleanText(value('v66_trade_setup')), emotion: cleanText(value('v66_trade_emotion')), note: cleanText(value('v66_trade_note')), beforeImage, afterImage, screenshotsComplete: Boolean(beforeImage && afterImage), riskLimitAtEntry: maxRisk, riskViolation: mode === 'real' && riskAmount > maxRisk, lossReviewRequired: mode === 'real' && resultAmount < 0 && !existing.lossReview?.completedAt, updatedAt: new Date().toISOString(), createdAt: existing.createdAt || new Date().toISOString() };
    state.trades = [record, ...arr('trades').filter(item => String(item.id) !== String(record.id))];
    state.settings.v66.tradeView = mode;
    save(); closeModal(); render();
    toast(record.riskViolation ? 'Сделка сохранена с предупреждением о риске' : (resultAmount && !record.screenshotsComplete ? 'Сделка сохранена · добавьте скриншоты до и после' : 'Сделка сохранена'));
  }

  function v66DeleteTrade(id) {
    const trade = arr('trades').find(item => String(item.id) === String(id));
    if (!trade || !window.confirm(`Удалить запись ${trade.pair || 'FOREX'} за ${fmt(trade.date)}?`)) return;
    state.trades = arr('trades').filter(item => String(item.id) !== String(id));
    save(); render(); toast('Запись сделки удалена');
  }

  function v66OpenAccountInfo() {
    if (window.SecondBrainCloud?.openAccount) return window.SecondBrainCloud.openAccount();
    openModal('Аккаунт и синхронизация', `<div class="v66-account-info"><section><span>◎</span><div><h3>Windows + iPhone</h3><p>Для настоящего входа и синхронизации нужен серверный проект, HTTPS-домен и настройки OAuth. Интерфейс не будет имитировать подключение, которого нет.</p></div></section><div><article><b>Email</b><small>требует почтового подтверждения и восстановления доступа</small><em>готовится</em></article><article><b>Google</b><small>требует OAuth Client ID и разрешённых доменов</small><em>готовится</em></article><article><b>Apple</b><small>требует Apple Developer Service ID и private key на сервере</small><em>готовится</em></article></div><p>До подключения сервера используйте локальный PIN и резервные копии. Токены нельзя хранить в ZIP или клиентском JavaScript.</p></div>`);
  }

  function v66OpenNotifications() {
    const settings = state.settings.v66.notifications;
    const permission = typeof Notification === 'undefined' ? 'не поддерживается' : ({ granted: 'разрешены', denied: 'запрещены', default: 'не запрошены' }[Notification.permission] || Notification.permission);
    openModal('Ритм уведомлений', `<div class="v66-notifications"><section><span>◷</span><div><h3>iPhone — основной канал</h3><p>Утренний план в ${esc(settings.morning)} и короткий итог в ${esc(settings.evening)}. Пока сервер не подключён, уведомления сработают только когда PWA или вкладка активны.</p></div></section><label><span>Утренний план</span><input id="v66_notify_morning" type="time" value="${esc(settings.morning || '09:00')}"></label><label><span>Вечерний итог</span><input id="v66_notify_evening" type="time" value="${esc(settings.evening || '20:00')}"></label><div class="v66-notification-status"><span>Разрешение браузера</span><b>${esc(permission)}</b></div><div class="v66-vault-actions"><button data-v66-action="requestNotifications" type="button">Разрешить уведомления</button><button class="is-primary" data-v66-action="saveNotifications" type="button">Сохранить время</button></div><p class="v66-vault-note">Для фоновых push-уведомлений на закрытом iPhone потребуется серверная подписка Web Push и установленное PWA.</p></div>`);
  }

  async function v66RequestNotifications() {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return toast('Уведомления не поддерживаются в этом браузере');
    const permission = await Notification.requestPermission();
    state.settings.v66.notifications.enabled = permission === 'granted';
    save();
    if (permission !== 'granted') return toast('Разрешение не выдано');
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Second Brain OS', { body: 'Уведомления включены. План — 09:00, итог — 20:00.', tag: 'sbos-notification-test', icon: './icon-192-v71.png' });
    } catch (error) {}
    v66OpenNotifications();
  }

  function v66SaveNotifications() {
    const morning = document.getElementById('v66_notify_morning')?.value || '09:00';
    const evening = document.getElementById('v66_notify_evening')?.value || '20:00';
    state.settings.v66.notifications = { ...state.settings.v66.notifications, morning, evening, channel: 'iphone' };
    save(); closeModal(); render(); toast('Время уведомлений сохранено');
  }

  async function v66NotificationTick() {
    if (window.SecondBrainLife?.notificationTick) return window.SecondBrainLife.notificationTick();
    const settings = state.settings?.v66?.notifications || {};
    if (!settings.enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const kind = time === settings.morning ? 'morning' : time === settings.evening ? 'evening' : '';
    if (!kind) return;
    const key = `secondBrainOS.v66.notification.${today()}.${kind}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, new Date().toISOString());
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(kind === 'morning' ? 'План утра' : 'Итог вечера', {
      body: kind === 'morning' ? 'Откройте короткий порядок дня и выберите главный шаг.' : 'Зафиксируйте результат дня и первый шаг на завтра.',
      tag: `sbos-${kind}-${today()}`, icon: './icon-192-v71.png', data: { url: kind === 'morning' ? './#dashboard' : './#dashboard' }
    });
  }

  function v66DebtAdviceHtml() {
    const outgoing = (typeof activeDebts === 'function' ? activeDebts() : arr('debts')).filter(item => item.direction === 'out');
    const budget = num(state.settings?.v65?.debtMonthlyBudget);
    const minimumTotal = outgoing.reduce((sum, item) => sum + num(item.minPayment), 0);
    const overdue = outgoing.filter(item => item.due && item.due < today());
    const highRate = outgoing.slice().sort((a, b) => num(b.rate) - num(a.rate))[0];
    const soon = outgoing.filter(item => item.due && item.due >= today() && item.due <= iso(addDays(new Date(), 14))).sort((a, b) => String(a.due).localeCompare(String(b.due)))[0];
    const smallest = outgoing.slice().sort((a, b) => num(a.amount) - num(b.amount))[0];
    let title = 'Добавьте долги для рекомендации';
    let detail = 'Помощник сравнит просрочку, обязательные платежи, ставку, срок и психологическую нагрузку.';
    let method = 'ожидаю данные';
    if (overdue.length) {
      title = `Сначала остановить просрочку: ${overdue[0].person || 'долг'}`;
      detail = 'Просрочка важнее экономии по ставке: уточните сумму, штрафы и минимальный платёж, затем пересчитайте план.';
      method = 'защита от штрафов';
    } else if (budget && minimumTotal > budget) {
      title = 'Бюджета не хватает на минимальные платежи';
      detail = `Не хватает ${money(minimumTotal - budget)}. Приоритет — обязательные минимумы и ранний контакт с кредиторами, а не досрочное погашение.`;
      method = 'стабилизация';
    } else if (highRate && num(highRate.rate) > 0) {
      title = `Основной удар по ставке: ${highRate.person || 'долг'}`;
      detail = `${num(highRate.rate)}% годовых — после всех минимумов направляйте свободный бюджет сюда, если рядом нет критичного срока.`;
      method = 'лавина';
    } else if (soon) {
      title = `Ближайший срок: ${soon.person || 'долг'}`;
      detail = `Срок ${fmt(soon.due)}. Сначала обеспечьте этот платёж, затем распределяйте остаток.`;
      method = 'по сроку';
    } else if (smallest) {
      title = `Можно быстро закрыть: ${smallest.person || 'долг'}`;
      detail = 'При одинаковых рисках небольшой долг можно закрыть первым, чтобы освободить внимание и один обязательный платёж.';
      method = 'маленькая победа';
    }
    return `<section class="v66-debt-advice"><span>✦</span><div><small>Динамическая рекомендация · ${esc(method)}</small><h3>${esc(title)}</h3><p>${esc(detail)}</p></div><button data-v66-action="openDebtMethod" type="button">Как выбрано</button></section>`;
  }

  function v66OpenDebtMethod() {
    openModal('Как помощник выбирает приоритет долга', '<div class="v66-debt-method"><p>Рекомендация пересчитывается при изменении данных и не использует один метод всегда.</p><ol><li><b>1. Просрочка и штрафы</b><span>Сначала убирается риск ухудшения ситуации.</span></li><li><b>2. Минимальные платежи</b><span>План должен покрывать обязательный минимум.</span></li><li><b>3. Высокая ставка</b><span>Экономия процентов методом лавины.</span></li><li><b>4. Близкий срок</b><span>Платёж, который нельзя отложить.</span></li><li><b>5. Небольшой долг</b><span>Быстрое закрытие, если финансовые риски сопоставимы.</span></li></ol><p>Перед фактическим платежом сверяйте сумму и условия с банком или кредитором.</p></div>');
  }

  function v66SystemCards() {
    const security = state.settings.v66.security;
    const lastRestore = state.settings.v66.lastRestore;
    const notifications = state.settings.v66.notifications;
    return `<section class="v66-system-grid"><article><span>⛨</span><div><b>Хранилище данных</b><small>${lastRestore ? `последнее восстановление ${new Date(lastRestore.at).toLocaleString('ru-RU')}` : 'предпросмотр, выбор разделов и безопасное объединение'}</small></div><button data-v66-action="openVault" type="button">Открыть</button></article><article><span>●</span><div><b>PIN устройства</b><small>${security.pinEnabled ? `включён · блокировка через ${num(security.autoLockMinutes)} минут` : 'пока выключен · PIN хранится только в виде хеша'}</small></div><button data-v66-action="openSecurity" type="button">${security.pinEnabled ? 'Настроить' : 'Включить'}</button></article><article><span>◷</span><div><b>Ритм уведомлений</b><small>${notifications.morning} план · ${notifications.evening} итог · iPhone</small></div><button data-v66-action="openNotifications" type="button">Настроить</button></article><article data-v66-account-card><span>◎</span><div><b>Вход по аккаунту</b><small>Email, Google и Apple · проверяем подключение</small></div><button data-v66-action="openAccountInfo" type="button">Статус</button></article></section>`;
  }

  function v66NavButton(route, icon, label, color) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `v59-nav-item v66-nav-item ${(location.hash || '').replace('#', '') === route ? 'active' : ''}`;
    button.dataset.go = route;
    button.innerHTML = `<span class="v59-nav-ico" style="background:${color}">${icon}</span><span class="label">${label}</span><span></span>`;
    return button;
  }

  function v66InjectNavigation() {
    const nav = document.querySelector('.v59-nav-scroll');
    if (!nav) return;
    if (!nav.querySelector('[data-go="trading"]')) {
      const finance = nav.querySelector('.v59-nav-item[data-go="finance"]');
      finance?.insertAdjacentElement('afterend', v66NavButton('trading', '↗', 'Трейдинг', 'linear-gradient(135deg,#5b49d8,#8b5cf6)'));
    }
    if (!nav.querySelector('[data-go="sleep"]')) {
      const habits = nav.querySelector('.v59-nav-item[data-go="habits"]');
      habits?.insertAdjacentElement('afterend', v66NavButton('sleep', '☾', 'Сон', 'linear-gradient(135deg,#2864a8,#38bdf8)'));
    }
    const route = (location.hash || '').replace('#', '') || page || 'dashboard';
    nav.querySelectorAll('.v59-nav-item').forEach(button => button.classList.toggle('active', button.dataset.go === route));
  }

  function v66PostRender() {
    document.body.classList.add('v66-safe-core');
    const v70Active = Boolean(document.querySelector('script[src*="app-v70-living.js"]'));
    const v69Active = Boolean(document.querySelector('script[src*="app-v69-calm.js"]'));
    const v68Active = Boolean(document.querySelector('script[src*="app-v68-assistant.js"]'));
    const v67Active = document.body.classList.contains('v67-cloud-safe');
    if (!v67Active) {
      document.body.dataset.sbosBuild = V66_BUILD;
      document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', V66_BUILD);
    }
    const version = document.querySelector('.v59-version,.version');
    if (version) version.textContent = v70Active ? 'V70 · LIVING PERSONAL OS' : (v69Active ? 'V69 · CALM INTELLIGENCE' : (v68Active ? 'V68 · UNIFIED PERSONAL OS' : (v67Active ? 'V67.8 · LIVING PERSONAL OS' : V66_LABEL)));
    const core = document.querySelector('.v59-core-pill');
    if (core) core.textContent = v70Active ? 'V70' : (v69Active ? 'V69' : (v68Active ? 'V68' : (v67Active ? 'V67.8' : 'V66')));
    v66InjectNavigation();
    const route = (location.hash || '').replace('#', '') || page || 'dashboard';
    const view = document.getElementById('view');
    if (!view) return;
    if (route === 'trading' && !view.querySelector('.v66-trading-page')) view.innerHTML = v66TradingPage();
    if (route === 'sleep' && !view.querySelector('.v66-sleep-page')) view.innerHTML = v66SleepPage();
    const hero = view.querySelector('.hero,.v59-hero,.v60-hero');
    if (route === 'system' && hero && !view.querySelector('.v66-system-grid')) {
      const anchor = view.querySelector('.v65-sync-card') || hero;
      anchor.insertAdjacentHTML('afterend', v66SystemCards());
    }
    if (route === 'debts' && hero && !view.querySelector('.v66-debt-advice')) hero.insertAdjacentHTML('afterend', v66DebtAdviceHtml());
    if (route === 'finance' && hero && !view.querySelector('.v66-route-card')) hero.insertAdjacentHTML('afterend', '<section class="v66-route-card"><span>↗</span><div><b>Forex-журнал</b><small>Демо и реальные сделки, дисциплина и лимиты риска</small></div><button data-go="trading" type="button">Открыть</button></section>');
    if (route === 'habits' && hero && !view.querySelector('.v66-route-card')) hero.insertAdjacentHTML('afterend', '<section class="v66-route-card"><span>☾</span><div><b>Сон в часах</b><small>Короткая фиксация и динамика за 14 дней</small></div><button data-go="sleep" type="button">Открыть</button></section>');
    v66EnsureLock();
  }

  function v66SchedulePost() {
    if (postQueued) return;
    postQueued = true;
    requestAnimationFrame(() => { postQueued = false; v66PostRender(); });
  }

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      const result = previousRender.apply(this, arguments);
      v66SchedulePost();
      return result;
    };
  }

  const previousSave = typeof save === 'function' ? save : null;
  if (previousSave) {
    save = function () {
      const result = previousSave.apply(this, arguments);
      if (!document.body.classList.contains('v67-cloud-safe')) {
        try { localStorage.setItem('secondBrainOS.currentBuild', V66_BUILD); } catch (error) {}
      }
      return result;
    };
  }

  window.addEventListener('click', event => {
    const action = event.target.closest?.('[data-v66-action]');
    if (!action) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    const name = action.dataset.v66Action;
    if (name === 'openVault') return v66OpenVault();
    if (name === 'downloadBackup') { v66DownloadSnapshot('backup'); return toast('Резервная копия подготовлена'); }
    if (name === 'previewBackup') return v66PreviewBackup();
    if (name === 'applyRestore') return v66ApplyRestore();
    if (name === 'openSecurity') return v66OpenSecurity();
    if (name === 'setupPin') return v66SetupPin();
    if (name === 'unlockPin') return v66UnlockPin();
    if (name === 'lockNow') { closeModal(); sessionStorage.removeItem('secondBrainOS.v66.pinUnlockedAt'); return v66EnsureLock(true); }
    if (name === 'disablePin') return v66DisablePin();
    if (name === 'savePinTimeout') return v66SavePinTimeout();
    if (name === 'saveSleep') return v66SaveSleep();
    if (name === 'tradeMode') { state.settings.v66.tradeView = action.dataset.mode === 'real' ? 'real' : 'demo'; save(); return render(); }
    if (name === 'saveBalance') return v66SaveInlineBalance();
    if (name === 'openRisk') return v66OpenRisk();
    if (name === 'saveRisk') return v66SaveRisk();
    if (name === 'openTrade') return v66OpenTrade(action.dataset.id || '');
    if (name === 'saveTrade') return v66SaveTrade(action.dataset.id || '');
    if (name === 'deleteTrade') return v66DeleteTrade(action.dataset.id || '');
    if (name === 'openAccountInfo') return v66OpenAccountInfo();
    if (name === 'openNotifications') return v66OpenNotifications();
    if (name === 'requestNotifications') return v66RequestNotifications();
    if (name === 'saveNotifications') return v66SaveNotifications();
    if (name === 'openDebtMethod') return v66OpenDebtMethod();
    if (name === 'closeModal') return closeModal();
  }, true);

  window.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target?.id === 'v66_unlock_pin') { event.preventDefault(); v66UnlockPin(); }
    if (event.key === 'Enter' && event.target?.id === 'v66_inline_balance') { event.preventDefault(); v66SaveInlineBalance(); }
  }, true);
  let lastPinTouch = 0;
  const v66TouchPinSession = () => {
    if (!state.settings?.v66?.security?.pinEnabled || document.querySelector('.v66-lock')) return;
    if (Date.now() - lastPinTouch < 10000) return;
    lastPinTouch = Date.now();
    sessionStorage.setItem('secondBrainOS.v66.pinUnlockedAt', String(lastPinTouch));
  };
  window.addEventListener('pointerdown', v66TouchPinSession, { capture: true, passive: true });
  window.addEventListener('keydown', v66TouchPinSession, true);
  window.addEventListener('hashchange', () => [0, 80, 240].forEach(delay => setTimeout(v66PostRender, delay)));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') v66EnsureLock(); });
  const app = document.getElementById('app');
  if (app) new MutationObserver(v66SchedulePost).observe(app, { childList: true, subtree: true });
  setInterval(() => { v66EnsureLock(); v66NotificationTick().catch(() => {}); }, 30000);

  try { render(); } catch (error) { console.error('[V66 render]', error); }
  v66PostRender();
  [150, 600, 1800].forEach(delay => setTimeout(v66PostRender, delay));
})();
