'use strict';

/* Second Brain OS V67 Life layer:
   theme, voice capture, human/debt reminders, PWA install and Forex learning. */
(() => {
  const BUILD = 'second-brain-space-v67-8-reminder-center-20260714';
  const COURSE = [
    {
      id: 'forex-foundation', title: 'Как устроен Forex', time: '12 минут', icon: '◎',
      intro: 'Разобраться в валютной паре, котировке и роли участника рынка — без обещаний доходности.',
      points: ['EUR/USD показывает, сколько долларов стоит один евро.', 'Рост пары означает укрепление базовой валюты относительно котируемой.', 'Цена меняется постоянно; приложение не прогнозирует направление и не выдаёт сигналы.'],
      question: 'Что показывает котировка EUR/USD?', options: ['Сколько евро стоит один доллар', 'Сколько долларов стоит один евро', 'Доходность сделки'], correct: 1,
      explanation: 'EUR — базовая валюта, USD — котируемая. Число показывает стоимость одного евро в долларах.'
    },
    {
      id: 'pips-spread-leverage', title: 'Пункт, спред и плечо', time: '15 минут', icon: '↔',
      intro: 'Понять издержки и почему кредитное плечо усиливает не только прибыль, но и убыток.',
      points: ['Спред — разница между ценой покупки и продажи.', 'Пункт используется для измерения небольшого изменения котировки.', 'Плечо увеличивает размер позиции и способно быстро увеличить убыток.'],
      question: 'Что делает кредитное плечо?', options: ['Гарантирует прибыль', 'Уменьшает спред', 'Усиливает и прибыль, и убыток'], correct: 2,
      explanation: 'Плечо не улучшает вероятность сделки — оно увеличивает финансовый результат в обе стороны.'
    },
    {
      id: 'risk-first', title: 'Риск раньше прибыли', time: '18 минут', icon: '⛨',
      intro: 'Сначала определить допустимый убыток, затем размер позиции — не наоборот.',
      points: ['Ваш базовый лимит — 0,5% счёта на сделку.', 'Дневной стоп — 2%, недельный — 5%.', 'Если лимит достигнут, следующая задача — разбор, а не попытка отыграться.'],
      question: 'При балансе 100 000 ₽ и риске 0,5% максимальный риск сделки равен:', options: ['500 ₽', '5 000 ₽', '50 ₽'], correct: 0,
      explanation: '100 000 × 0,5% = 500 ₽. Это допустимый риск, а не рекомендуемый размер позиции.'
    },
    {
      id: 'trade-plan', title: 'План сделки до входа', time: '14 минут', icon: '☷',
      intro: 'Фиксировать условия заранее, чтобы решение не менялось под влиянием движения цены.',
      points: ['До входа известны причина, точка отмены сценария и допустимый риск.', 'Stop Loss относится к плану управления риском, а не к признанию ошибки.', 'Если условия отсутствуют, запись остаётся наблюдением, а не готовой сделкой.'],
      question: 'Когда должен быть определён Stop Loss?', options: ['После убытка', 'До входа', 'Только при закрытии дня'], correct: 1,
      explanation: 'Точка отмены сценария и риск определяются до открытия позиции.'
    },
    {
      id: 'demo-discipline', title: 'Демо как тренировка процесса', time: '12 минут', icon: '◌',
      intro: 'Использовать демо-счёт для повторяемости правил, а не для погони за красивой доходностью.',
      points: ['Демо и реальный счёт учитываются раздельно.', 'Критерий готовности — соблюдение плана на серии сделок.', 'Одна удачная сделка не подтверждает устойчивый навык.'],
      question: 'Главный критерий полезной демо-практики:', options: ['Одна большая прибыль', 'Количество открытых сделок', 'Стабильное соблюдение правил'], correct: 2,
      explanation: 'Цель демо — сформировать повторяемый процесс и научиться соблюдать риск.'
    },
    {
      id: 'psychology', title: 'FOMO и попытка отыграться', time: '16 минут', icon: '◇',
      intro: 'Научиться замечать эмоциональное решение до того, как оно превращается в новую позицию.',
      points: ['FOMO — страх пропустить движение, а не торговое основание.', 'После убытка желание немедленно вернуть деньги повышает риск нарушения плана.', 'Пауза и письменный разбор создают расстояние между эмоцией и действием.'],
      question: 'Что делать после достижения дневного стопа?', options: ['Увеличить позицию', 'Остановиться и разобрать сделки', 'Сразу сменить стратегию'], correct: 1,
      explanation: 'Дневной стоп означает завершение реальной торговли и переход к разбору.'
    },
    {
      id: 'journal-review', title: 'Журнал и честный разбор', time: '15 минут', icon: '✎',
      intro: 'Оценивать качество исполнения отдельно от денежного результата.',
      points: ['Прибыльная сделка может нарушать план, а убыточная — быть выполнена правильно.', 'Скриншоты до и после помогают проверить реальный контекст.', 'После убытка фиксируется урок и одно изменение следующего действия.'],
      question: 'Какая сделка качественнее?', options: ['Любая прибыльная', 'Та, где соблюдён заранее заданный план', 'Та, где риск был максимальным'], correct: 1,
      explanation: 'Качество процесса определяется соблюдением плана и риска, а не единичным результатом.'
    },
    {
      id: 'real-readiness', title: 'Переход к реальному счёту', time: '18 минут', icon: '✓',
      intro: 'Сформировать личный чек-лист готовности и сохранить осторожный размер риска.',
      points: ['Пройден учебный план и накоплена серия демо-сделок по одним правилам.', 'Лимиты риска подтверждены и не повышаются после убытка.', 'Реальный старт начинается с минимального риска, который психологически легко принять.'],
      question: 'Что подтверждает готовность лучше всего?', options: ['Желание быстрее заработать', 'Серия дисциплинированных демо-сделок и соблюдение лимитов', 'Совет из социальных сетей'], correct: 1,
      explanation: 'Готовность подтверждает повторяемый процесс, а не срочность финансовой цели.'
    }
  ];

  let voiceRecognition = null;
  let voiceStarting = false;
  let voiceSession = 0;
  let voiceBaseText = '';
  let installPrompt = null;
  let postTimer = 0;

  const list = name => Array.isArray(state?.[name]) ? state[name] : [];
  const clean = value => String(value ?? '').trim();
  const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const todayDate = () => typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  const doneStatus = value => ['Готово', 'Выполнено', 'Закрыто'].includes(value);

  function lifeSettings() {
    state.settings = state.settings || {};
    state.settings.v67 = Object.assign({ theme: 'auto', debtReminderDays: [7, 3, 1], peopleCadenceDays: 30, assistantTone: 'supportive', heavyDayDate: '', tradingCourse: { completed: [], answers: {}, current: COURSE[0].id }, tradingReadiness: { manual: false, manualConfirmedAt: '' } }, state.settings.v67 || {});
    state.settings.v67.tradingCourse = Object.assign({ completed: [], answers: {}, current: COURSE[0].id }, state.settings.v67.tradingCourse || {});
    state.settings.v67.tradingReadiness = Object.assign({ manual: false, manualConfirmedAt: '' }, state.settings.v67.tradingReadiness || {});
    return state.settings.v67;
  }

  function ensurePersonFields() {
    const fields = typeof schemas === 'object' ? schemas?.person?.fields : null;
    if (!Array.isArray(fields)) return;
    const additions = [
      ['lastContact', 'Последнее общение', 'date'],
      ['contactCadenceDays', 'Напоминать после паузы, дней', 'number'],
      ['nextPromise', 'Обещание / договорённость', 'textarea'],
      ['promiseDue', 'Срок обещания', 'date']
    ];
    additions.forEach(field => { if (!fields.some(existing => existing[0] === field[0])) fields.push(field); });
  }

  function ensureFinanceFields() {
    const fields = typeof schemas === 'object' ? schemas?.operation?.fields : null;
    if (!Array.isArray(fields) || fields.some(field => field[0] === 'incomeSource')) return;
    const noteIndex = fields.findIndex(field => field[0] === 'note');
    fields.splice(noteIndex < 0 ? fields.length : noteIndex, 0, ['incomeSource', 'Источник дохода (только для доходов)', 'select', [['', 'Не выбрано'], ['trading', 'Трейдинг'], ['side', 'Подработка'], ['personal', 'Другой личный доход'], ['wage', 'Работа по найму — не учитывать в цели']]]);
  }

  function applyTheme() {
    const mode = lifeSettings().theme;
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const dark = mode === 'dark' || (mode === 'auto' && systemDark);
    document.body.classList.toggle('v67-theme-dark', dark);
    document.documentElement.classList.toggle('v70-theme-dark', dark);
    document.documentElement.classList.toggle('v70-theme-light', !dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.documentElement.dataset.v70Theme = dark ? 'dark' : 'light';
    document.body.dataset.v67Theme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#071126' : '#f3f6fa');
    const button = document.querySelector('[data-v67-theme-button]');
    if (button) {
      button.textContent = dark ? '☾' : '◐';
      button.title = `Тема: ${mode === 'auto' ? 'как в системе' : (dark ? 'тёмная' : 'светлая')}`;
      button.setAttribute('aria-label', button.title);
    }
  }

  function openTheme() {
    const mode = lifeSettings().theme;
    openModal('Оформление', `<div class="v67-theme-picker"><section><span>◐</span><div><h3>Светлая, тёмная или системная</h3><p>Атмосфера времени суток продолжает работать внутри выбранной темы.</p></div></section><div>${[['auto','Как в системе','Меняется вместе с настройкой устройства'],['light','Светлая','Воздушная и ясная'],['dark','Тёмная','Спокойная для вечера']].map(([key,title,detail]) => `<button class="${mode === key ? 'active' : ''}" data-v67-life-action="set-theme" data-theme="${key}" type="button"><span>${key === 'dark' ? '☾' : key === 'light' ? '☀' : '◐'}</span><div><b>${title}</b><small>${detail}</small></div><em>${mode === key ? 'выбрано' : ''}</em></button>`).join('')}</div></div>`);
  }

  function setTheme(mode) {
    lifeSettings().theme = ['auto', 'light', 'dark'].includes(mode) ? mode : 'auto';
    save(); applyTheme(); closeModal(); toast('Тема сохранена');
  }

  function injectTopTools() {
    const actions = document.querySelector('.v59-top-actions,.top-actions');
    if (!actions) return;
    const profile = actions.querySelector('.v59-profile,.row');
    if (!actions.querySelector('[data-v67-theme-button]')) {
      const theme = document.createElement('button');
      theme.type = 'button'; theme.className = 'icon-btn v67-top-tool'; theme.dataset.v67ThemeButton = '1'; theme.dataset.v67LifeAction = 'open-theme';
      theme.textContent = '◐';
      actions.insertBefore(theme, profile || null);
    }
    if (!actions.querySelector('[data-v67-voice-button]')) {
      const voice = document.createElement('button');
      voice.type = 'button'; voice.className = 'icon-btn v67-top-tool'; voice.dataset.v67VoiceButton = '1'; voice.dataset.v67LifeAction = 'open-voice';
      voice.textContent = '●'; voice.title = 'Голосовой быстрый ввод'; voice.setAttribute('aria-label', voice.title);
      actions.insertBefore(voice, profile || null);
    }
  }

  function speechApi() { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }

  function voiceCapability() {
    const localHost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
    const secure = window.isSecureContext || localHost;
    return {
      secure,
      speech: Boolean(speechApi()),
      microphone: Boolean(navigator.mediaDevices?.getUserMedia),
      ready: secure && Boolean(speechApi())
    };
  }

  function setVoiceState(message, tone = '') {
    const status = document.getElementById('v67_voice_state');
    const shell = status?.closest('.v67-voice');
    if (status) {
      status.textContent = message;
      status.dataset.tone = tone;
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
    }
    shell?.classList.toggle('is-listening', tone === 'listening');
  }

  async function requestVoiceMicrophone() {
    const capability = voiceCapability();
    if (!capability.secure) throw Object.assign(new Error('insecure-context'), { voiceCode: 'insecure-context' });
    if (!capability.microphone) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      const code = error?.name === 'NotAllowedError' || error?.name === 'SecurityError' ? 'not-allowed'
        : error?.name === 'NotFoundError' ? 'audio-capture'
        : error?.name === 'NotReadableError' ? 'device-busy'
        : 'microphone-error';
      throw Object.assign(error || new Error(code), { voiceCode: code });
    }
  }

  function voiceErrorMessage(code) {
    return ({
      'not-allowed': 'Разрешите микрофон в настройках сайта и нажмите «Начать запись» ещё раз',
      'service-not-allowed': 'Распознавание заблокировано браузером — проверьте разрешение микрофона',
      'audio-capture': 'Микрофон не найден — проверьте подключение устройства',
      'device-busy': 'Микрофон занят другим приложением',
      'network': 'Для распознавания речи браузеру сейчас требуется интернет',
      'no-speech': 'Речь не услышана — приблизьтесь к микрофону и повторите',
      'insecure-context': 'Голосовой ввод работает только в установленном приложении или на защищённом адресе',
      'microphone-error': 'Не удалось открыть микрофон — проверьте разрешение Windows или iPhone',
      'aborted': 'Запись остановлена'
    })[code] || 'Не удалось распознать речь — нажмите «Начать запись» и повторите';
  }

  async function startVoiceReliable() {
    if (voiceStarting) return;
    const Speech = speechApi();
    const capability = voiceCapability();
    if (!Speech || !capability.secure) {
      setVoiceState(voiceErrorMessage(capability.secure ? 'unsupported' : 'insecure-context'), 'error');
      document.getElementById('v67_voice_text')?.focus();
      return toast('На этом устройстве используйте диктовку клавиатуры в поле текста');
    }

    voiceStarting = true;
    setVoiceState('Готовлю микрофон…', 'pending');
    try {
      if (navigator.permissions?.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          if (permission.state === 'denied') throw Object.assign(new Error('not-allowed'), { voiceCode: 'not-allowed' });
        } catch (error) {
          if (error?.voiceCode) throw error;
        }
      }
      try { voiceRecognition?.abort?.(); } catch (error) {}

      const session = ++voiceSession;
      const field = document.getElementById('v67_voice_text');
      voiceBaseText = clean(field?.value);
      const recognition = new Speech();
      voiceRecognition = recognition;
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        if (session !== voiceSession) return;
        setVoiceState('Слушаю… говорите естественно', 'listening');
      };
      recognition.onaudiostart = () => {
        if (session === voiceSession) setVoiceState('Микрофон включён — слушаю…', 'listening');
      };
      recognition.onresult = event => {
        if (session !== voiceSession) return;
        let finalText = '';
        let interimText = '';
        for (let index = 0; index < event.results.length; index += 1) {
          const transcript = clean(event.results[index]?.[0]?.transcript);
          if (event.results[index].isFinal) finalText += `${transcript} `;
          else interimText += `${transcript} `;
        }
        const output = [voiceBaseText, clean(finalText), clean(interimText)].filter(Boolean).join(' ');
        const target = document.getElementById('v67_voice_text');
        if (target) {
          target.value = output;
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
        setVoiceState(interimText ? 'Распознаю речь…' : 'Фраза распознана', interimText ? 'listening' : 'success');
      };
      recognition.onerror = event => {
        if (session !== voiceSession) return;
        const code = event?.error || 'recognition-error';
        if (code !== 'aborted') setVoiceState(voiceErrorMessage(code), 'error');
      };
      recognition.onend = () => {
        if (session !== voiceSession) return;
        const status = document.getElementById('v67_voice_state');
        document.querySelector('.v67-voice')?.classList.remove('is-listening');
        if (status && !['error', 'success'].includes(status.dataset.tone || '')) setVoiceState('Готово — проверьте текст и выберите тип записи', 'success');
      };
      recognition.start();
      setTimeout(() => {
        if (session !== voiceSession) return;
        const status = document.getElementById('v67_voice_state');
        if (status?.dataset.tone === 'pending') setVoiceState('Разрешите доступ к микрофону в запросе браузера', 'pending');
      }, 1600);
    } catch (error) {
      setVoiceState(voiceErrorMessage(error?.voiceCode || error?.name || 'microphone-error'), 'error');
    } finally {
      voiceStarting = false;
    }
  }

  function openVoiceCapture(autoStart = true) {
    const supported = voiceCapability().ready;
    openModal('Голосовой быстрый ввод', `<div class="v67-voice"><section><span class="v67-voice-dot"></span><div><small>Задача · заметка · расход · дневник</small><h3>${supported ? 'Говорите естественно' : 'Голосовой API недоступен'}</h3><p>${supported ? 'Текст останется на устройстве до выбора типа записи.' : 'Можно ввести текст вручную или использовать микрофон клавиатуры iPhone.'}</p></div></section><textarea id="v67_voice_text" placeholder="Например: записать расход 1250 рублей на продукты"></textarea><div class="v67-voice-state" id="v67_voice_state">${supported ? 'Готов слушать' : 'Ручной режим'}</div><div class="v67-voice-controls"><button data-v67-life-action="start-voice" type="button" ${supported ? '' : 'disabled'}>● Начать запись</button><button data-v67-life-action="stop-voice" type="button">Остановить</button></div><div class="v67-voice-save"><button data-v67-life-action="save-voice" data-type="task" type="button">✓ Задача</button><button data-v67-life-action="save-voice" data-type="note" type="button">⌁ Заметка</button><button data-v67-life-action="save-voice" data-type="expense" type="button">₽ Расход</button><button data-v67-life-action="save-voice" data-type="diary" type="button">◇ В дневник</button></div></div>`);
    if (supported && autoStart) startVoice();
  }

  function startVoice() {
    return startVoiceReliable();
    /* Legacy implementation remains below as a compatibility fallback for old cached builds. */
    const Speech = speechApi();
    if (!Speech) return toast('Используйте микрофон клавиатуры или ручной ввод');
    try { voiceRecognition?.stop?.(); } catch (error) {}
    voiceRecognition = new Speech();
    voiceRecognition.lang = 'ru-RU';
    voiceRecognition.continuous = false;
    voiceRecognition.interimResults = true;
    voiceRecognition.onstart = () => { const status = document.getElementById('v67_voice_state'); if (status) status.textContent = 'Слушаю…'; };
    voiceRecognition.onresult = event => {
      let text = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) text += event.results[index][0].transcript;
      const field = document.getElementById('v67_voice_text');
      if (field) field.value = `${field.value ? `${field.value} ` : ''}${text}`.trim();
    };
    voiceRecognition.onerror = event => { const status = document.getElementById('v67_voice_state'); if (status) status.textContent = event.error === 'not-allowed' ? 'Нет разрешения на микрофон' : 'Не удалось распознать — можно повторить'; };
    voiceRecognition.onend = () => { const status = document.getElementById('v67_voice_state'); if (status && status.textContent === 'Слушаю…') status.textContent = 'Готово — выберите тип записи'; };
    voiceRecognition.start();
  }

  function stopVoice() {
    voiceSession += 1;
    try { voiceRecognition?.stop?.(); } catch (error) {}
    voiceRecognition = null;
    document.querySelector('.v67-voice')?.classList.remove('is-listening');
    const status = document.getElementById('v67_voice_state');
    if (status) status.textContent = 'Запись остановлена';
  }

  function voiceAmount(text) {
    const matches = text.match(/(?:^|\s)(\d[\d\s]*(?:[,.]\d{1,2})?)(?:\s*(?:₽|руб|рублей|р\b))/i);
    return matches ? num(matches[1]) : 0;
  }

  function openVoiceExpenseConfirm(text, amount) {
    openModal('Проверьте расход', `<div class="v67-voice-confirm"><section><span>₽</span><div><small>Перед сохранением</small><h3>Сумма и категория требуют подтверждения</h3><p>Голосовой ввод ничего не добавит в финансы, пока вы не нажмёте «Подтвердить расход».</p></div></section><label><span>Сумма, ₽</span><input id="v67_voice_expense_amount" type="number" min="0.01" step="0.01" value="${e(amount)}"></label><label><span>Категория</span><input id="v67_voice_expense_category" value="Нужно проверить" placeholder="Например: Продукты"></label><label class="is-wide"><span>Исходный текст</span><textarea id="v67_voice_expense_note">${e(text)}</textarea></label><div class="v67-course-actions"><button class="is-primary" data-v67-life-action="confirm-voice-expense" type="button">Подтвердить расход</button><button data-v67-life-action="open-voice" type="button">Назад</button></div></div>`);
  }

  function confirmVoiceExpense() {
    const amount = num(document.getElementById('v67_voice_expense_amount')?.value);
    const category = clean(document.getElementById('v67_voice_expense_category')?.value);
    const note = clean(document.getElementById('v67_voice_expense_note')?.value);
    if (amount <= 0) return toast('Проверьте сумму расхода');
    if (!category) return toast('Укажите категорию');
    state.operations = list('operations');
    state.operations.unshift({ id: uid(), type: 'expense', amount, category, date: todayDate(), note, source: 'voice-confirmed', createdAt: new Date().toISOString() });
    save(); closeModal(); render(); toast('Расход подтверждён и сохранён');
  }

  function saveVoice(type) {
    const text = clean(document.getElementById('v67_voice_text')?.value);
    if (!text) return toast('Сначала продиктуйте или введите текст');
    stopVoice();
    if (type === 'task') {
      state.tasks = list('tasks');
      state.tasks.unshift({ id: uid(), title: text, area: 'Личное', date: todayDate(), time: '', priority: 'B', status: 'Активно', fixed: false, note: 'Создано голосом', createdAt: new Date().toISOString() });
    }
    if (type === 'note') {
      state.notes = list('notes');
      state.notes.unshift({ id: uid(), title: text.slice(0, 72), text, folder: 'Личное', date: todayDate(), createdAt: new Date().toISOString() });
    }
    if (type === 'expense') {
      const amount = voiceAmount(text);
      if (!amount) return toast('Назовите сумму со словом «рублей» или введите её текстом');
      return openVoiceExpenseConfirm(text, amount);
    }
    if (type === 'diary') {
      state.subconsciousEntries = list('subconsciousEntries');
      const existing = state.subconsciousEntries.find(item => item.date === todayDate()) || {};
      const record = { ...existing, id: existing.id || uid(), date: todayDate(), trigger: existing.trigger ? `${existing.trigger}\n${text}` : text, voiceDraft: true, updatedAt: new Date().toISOString() };
      state.subconsciousEntries = [record, ...state.subconsciousEntries.filter(item => item.date !== todayDate())];
      state.settings.subconsciousCurrentDate = todayDate();
    }
    save(); closeModal(); render();
    if (type === 'diary') go('subconscious');
    toast(type === 'diary' ? 'Черновик добавлен — завершите выводом и действием' : 'Запись сохранена');
  }

  function dayDiff(date) {
    if (!date) return null;
    const left = new Date(`${date}T12:00:00`) - new Date(`${todayDate()}T12:00:00`);
    return Math.round(left / 86400000);
  }

  function birthdayDiff(date) {
    if (!date) return null;
    const parts = String(date).split('-').map(Number);
    if (parts.length < 3) return null;
    const now = new Date(`${todayDate()}T12:00:00`);
    let target = new Date(now.getFullYear(), parts[1] - 1, parts[2], 12);
    if (target < now) target = new Date(now.getFullYear() + 1, parts[1] - 1, parts[2], 12);
    return Math.round((target - now) / 86400000);
  }

  function debtReminderItems() {
    const days = lifeSettings().debtReminderDays;
    return list('debts').filter(item => item.direction === 'out' && !doneStatus(item.status) && item.due).map(item => ({ item, days: dayDiff(item.due) })).filter(entry => entry.days !== null && (entry.days < 0 || days.includes(entry.days))).sort((a, b) => a.days - b.days);
  }

  function peopleReminderItems() {
    const defaultCadence = num(lifeSettings().peopleCadenceDays) || 30;
    const reminders = [];
    list('people').forEach(person => {
      const birthday = birthdayDiff(person.birthday);
      if (birthday !== null && birthday <= 30) reminders.push({ type: 'birthday', person, days: birthday, title: birthday === 0 ? 'День рождения сегодня' : `День рождения через ${birthday} дн.`, detail: person.gifts ? `Идеи: ${person.gifts}` : 'Добавьте идеи подарка' });
      const promise = dayDiff(person.promiseDue);
      if (person.nextPromise && promise !== null && promise <= 14) reminders.push({ type: 'promise', person, days: promise, title: promise < 0 ? 'Обещание просрочено' : (promise === 0 ? 'Обещание на сегодня' : `Обещание через ${promise} дн.`), detail: person.nextPromise });
      const cadence = num(person.contactCadenceDays) || defaultCadence;
      const since = person.lastContact ? -dayDiff(person.lastContact) : null;
      if (since === null || since >= cadence) reminders.push({ type: 'contact', person, days: since, title: since === null ? 'Общение ещё не отмечалось' : `Не общались ${since} дн.`, detail: person.talkIdeas || 'Можно написать короткое тёплое сообщение' });
    });
    return reminders;
  }

  function injectDebtReminders(view) {
    const hero = view.querySelector('.hero,.v59-hero,.v65-debt-hero');
    if (!hero || view.querySelector('.v67-debt-reminders')) return;
    const items = debtReminderItems();
    const upcoming = items.filter(entry => entry.days >= 0);
    hero.insertAdjacentHTML('afterend', `<section class="v67-debt-reminders"><div><span>◷</span><div><b>Напоминания за 7, 3 и 1 день</b><small>${upcoming.length ? `${upcoming.length} ближайших обязательств требуют внимания` : 'На контрольных датах платежей нет'}</small></div></div><div>${upcoming.slice(0, 4).map(entry => `<article><span>${entry.days}</span><div><b>${e(entry.item.person || 'Долг')}</b><small>${entry.days === 1 ? 'завтра' : `через ${entry.days} дн.`} · ${money(entry.item.amount)}</small></div></article>`).join('') || '<p>Следующее напоминание появится автоматически.</p>'}</div></section>`);
  }

  function injectPeopleReminders(view) {
    const hero = view.querySelector('.hero,.v59-hero');
    if (!hero || view.querySelector('.v67-people-reminders')) return;
    const items = peopleReminderItems();
    hero.insertAdjacentHTML('afterend', `<section class="v67-people-reminders"><header><div><span>♡</span><div><b>Забота без необходимости помнить всё</b><small>Дни рождения, обещания, подарки и паузы в общении</small></div></div><em>${items.length}</em></header><div>${items.slice(0, 8).map(entry => `<article><span class="is-${entry.type}">${entry.type === 'birthday' ? '✦' : entry.type === 'promise' ? '✓' : '↗'}</span><div><b>${e(entry.person.name || 'Человек')}</b><small>${e(entry.title)} · ${e(entry.detail).slice(0, 110)}</small></div>${entry.type === 'contact' ? `<button data-v67-life-action="mark-contact" data-id="${e(entry.person.id)}" type="button">Общались сегодня</button>` : `<button data-action="editRecord" data-type="person" data-id="${e(entry.person.id)}" type="button">Открыть</button>`}</article>`).join('') || '<p>Напоминаний пока нет. В карточке человека можно указать даты и ритм общения.</p>'}</div></section>`);
  }

  function markContact(id) {
    const person = list('people').find(item => String(item.id) === String(id));
    if (!person) return;
    person.lastContact = todayDate();
    save(); render(); toast(`Общение с ${person.name || 'человеком'} отмечено`);
  }

  function trackedIncomeSource(item) {
    const explicit = clean(item.incomeSource);
    if (explicit === 'trading' || explicit === 'side') return explicit;
    if (explicit === 'wage' || explicit === 'personal') return '';
    const haystack = `${item.category || ''} ${item.note || ''}`.toLocaleLowerCase('ru-RU');
    if (/трейд|forex|форекс/.test(haystack)) return 'trading';
    if (/подработ|фриланс|заказ|проект/.test(haystack) && !/найм|зарплат|оклад/.test(haystack)) return 'side';
    return '';
  }

  function incomeGoalModel() {
    const month = todayDate().slice(0, 7);
    const incomes = list('operations').filter(item => item.type === 'income' && String(item.date || '').startsWith(month));
    const tracked = incomes.filter(item => trackedIncomeSource(item));
    const trading = tracked.filter(item => trackedIncomeSource(item) === 'trading').reduce((sum, item) => sum + num(item.amount), 0);
    const side = tracked.filter(item => trackedIncomeSource(item) === 'side').reduce((sum, item) => sum + num(item.amount), 0);
    const unclassified = incomes.filter(item => !clean(item.incomeSource) && !trackedIncomeSource(item) && !/найм|зарплат|оклад/i.test(`${item.category || ''} ${item.note || ''}`)).length;
    const goal = Math.max(1, num(state.settings?.v65?.incomeGoal) || 300000);
    const total = trading + side;
    return { goal, total, trading, side, unclassified, progress: Math.min(100, Math.round(total / goal * 100)) };
  }

  function injectFinanceIncomeGoal(view) {
    const hero = view.querySelector('.v65-finance-hero,.hero,.v59-hero');
    if (!hero || view.querySelector('.v67-income-goal')) return;
    const model = incomeGoalModel();
    hero.insertAdjacentHTML('afterend', `<section class="v67-income-goal"><div><span>₽</span><div><small>Цель личного дохода · месяц</small><b>${money(model.total)} из ${money(model.goal)}</b><p>Считаются только трейдинг и подработки. Работа по найму не попадает в прогресс.</p></div></div><div class="v67-income-progress"><i style="width:${model.progress}%"></i></div><div class="v67-income-sources"><article><span>Трейдинг</span><b>${money(model.trading)}</b></article><article><span>Подработки</span><b>${money(model.side)}</b></article><article class="${model.unclassified ? 'is-warn' : ''}"><span>Без источника</span><b>${model.unclassified}</b></article></div><button data-action="openRecordForm" data-type="operation" type="button">＋ Добавить доход</button></section>`);
  }

  function dashboardAttention(view) {
    const living = view.querySelector('.v67-living-strip');
    if (!living || view.querySelector('.v67-dashboard-guide')) return;
    const isPersonal = personalItem;
    const isDone = item => ['Готово', 'Выполнено', 'Закрыто'].includes(item.status);
    const tasks = list('tasks').filter(isPersonal).filter(item => !isDone(item) && item.date && item.date <= todayDate()).sort((a, b) => String(a.date).localeCompare(String(b.date)) || ({ A: 1, B: 2, C: 3, D: 4 }[a.priority] || 9) - ({ A: 1, B: 2, C: 3, D: 4 }[b.priority] || 9));
    const habits = list('habits').filter(isPersonal);
    const pendingHabits = habits.filter(item => !item.marks?.[todayDate()]);
    const goals = list('goals').filter(isPersonal).filter(item => !isDone(item));
    const finance = incomeGoalModel();
    const hasFinance = list('operations').length || num(state.settings?.currentBalance) || list('debts').length;
    const missing = [];
    if (!hasFinance) missing.push({ route: 'finance', title: 'Финансы', text: 'указать остаток или загрузить выписку' });
    else if (finance.unclassified) missing.push({ route: 'finance', title: 'Доходы', text: `${finance.unclassified} без источника` });
    if (!habits.length) missing.push({ route: 'habits', title: 'Привычки', text: 'добавить основной ритм' });
    if (!goals.length) missing.push({ route: 'goals', title: 'Цели', text: 'добавить первый ориентир' });
    const heavy = lifeSettings().heavyDayDate === todayDate();
    const taskLimit = heavy ? 3 : 5;
    view.classList.toggle('v67-heavy-day', heavy);
    if (heavy) [...view.querySelectorAll('.v65-timeline-row')].slice(3).forEach(element => { element.hidden = true; });
    const reminders = reminderRows(reminderModel()).length;
    living.insertAdjacentHTML('afterend', `<section class="v67-dashboard-guide ${heavy ? 'is-heavy' : ''}"><header><div><span>${heavy ? '◇' : '✦'}</span><div><small>${heavy ? 'Тяжёлый день' : 'Обзор за 5 секунд'}</small><b>${heavy ? 'Оставляем только необходимое' : 'Показатели, день и незаполненное'}</b></div></div><div class="v67-dashboard-actions"><button data-v67-life-action="open-reminder-center" type="button">◷ ${reminders ? `Сигналы · ${reminders}` : 'Сигналов нет'}</button><button data-v67-life-action="toggle-heavy-day" type="button">${heavy ? 'Обычный режим' : 'Мне тяжело сегодня'}</button></div></header><div class="v67-dashboard-metrics"><article><span>Доход месяца</span><b>${money(finance.total)}</b><small>${finance.progress}% от 300 000 ₽ · трейдинг + подработки</small></article><article><span>Задачи дня</span><b>${tasks.length}</b><small>${tasks.length ? `показываю первые ${Math.min(taskLimit, tasks.length)} по сроку и приоритету` : 'обязательных пунктов нет'}</small></article><article><span>Привычки</span><b>${habits.length ? `${habits.length - pendingHabits.length}/${habits.length}` : '—'}</b><small>${pendingHabits.length ? `${pendingHabits.length} ещё не отмечено` : (habits.length ? 'на сегодня всё отмечено' : 'ритм не настроен')}</small></article></div><div class="v67-dashboard-attention"><span>Важно заполнить</span>${missing.map(item => `<button data-go="${item.route}" type="button"><b>${e(item.title)}</b><small>${e(item.text)}</small></button>`).join('') || '<p>Ключевые данные заполнены — помощник может давать точнее рекомендации.</p>'}</div></section>`);
  }

  function toggleHeavyDay() {
    const settings = lifeSettings();
    const active = settings.heavyDayDate === todayDate();
    settings.heavyDayDate = active ? '' : todayDate();
    save(); render();
    toast(active ? 'Обычный план возвращён' : 'Тяжёлый день включён · показываю только необходимое');
  }

  function reminderSettings() {
    state.settings = state.settings || {};
    state.settings.v66 = state.settings.v66 || {};
    state.settings.v66.notifications = Object.assign({ morning: '09:00', evening: '20:00', channel: 'iphone', enabled: false }, state.settings.v66.notifications || {});
    return state.settings.v66.notifications;
  }

  function reminderTimeMinutes(value) {
    const match = String(value || '').match(/(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?:\s|$)/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  function nowMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function withinReminderWindow(value, lateMinutes) {
    const target = reminderTimeMinutes(value);
    if (target === null) return false;
    const delta = nowMinutes() - target;
    return delta >= 0 && delta <= lateMinutes;
  }

  function personalItem(item) {
    const area = String(item?.area || '').trim().toLocaleLowerCase('ru-RU');
    const text = `${item?.title || ''} ${item?.name || ''} ${item?.note || ''}`;
    return area !== 'работа' && !/работа по найму|по найму|зарплат|оклад|работодател|офисн(?:ая|ые|ый) работ|рабоч(?:ая|ие|ий|ую) задач/i.test(text);
  }

  function reminderModel() {
    const date = todayDate();
    const tasks = list('tasks')
      .filter(personalItem)
      .filter(item => !doneStatus(item.status) && item.date && item.date <= date)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)) || ({ A: 1, B: 2, C: 3, D: 4 }[a.priority] || 9) - ({ A: 1, B: 2, C: 3, D: 4 }[b.priority] || 9));
    const habits = list('habits').filter(personalItem);
    const pendingHabits = habits.filter(item => !item.marks?.[date]);
    const debts = debtReminderItems();
    const people = peopleReminderItems().filter(entry => {
      if (entry.type === 'birthday') return entry.days <= 7;
      if (entry.type === 'promise') return entry.days <= 3;
      return entry.days !== null;
    });
    const todayOperations = list('operations').filter(item => String(item.date || '') === date);
    const goals = list('goals').filter(personalItem).filter(item => !doneStatus(item.status));
    const timedTasks = tasks.filter(item => Boolean(item.reminder) && (reminderTimeMinutes(item.reminder) !== null || reminderTimeMinutes(item.time) !== null));
    return { date, tasks, habits, pendingHabits, debts, people, todayOperations, goals, timedTasks };
  }

  function countText(value, one, few, many) {
    const count = Math.abs(Number(value) || 0);
    const tail = count % 100;
    const last = count % 10;
    const word = tail >= 11 && tail <= 14 ? many : last === 1 ? one : last >= 2 && last <= 4 ? few : many;
    return `${count} ${word}`;
  }

  function morningReminderText(model) {
    const parts = [];
    if (model.tasks.length) parts.push(countText(model.tasks.length, 'задача', 'задачи', 'задач'));
    if (model.pendingHabits.length) parts.push(countText(model.pendingHabits.length, 'привычка', 'привычки', 'привычек'));
    if (model.debts.length) parts.push(countText(model.debts.length, 'платёж', 'платежа', 'платежей'));
    if (model.people.length) parts.push(`${countText(model.people.length, 'сигнал', 'сигнала', 'сигналов')} по людям`);
    return parts.length ? `На сегодня: ${parts.join(' · ')}. Выберите один главный шаг.` : 'Срочного нет. Выберите один главный шаг и сохраните спокойный темп.';
  }

  function eveningReminderText(model) {
    const parts = [];
    if (model.tasks.length) parts.push(`${countText(model.tasks.length, 'задача', 'задачи', 'задач')} осталось`);
    if (model.pendingHabits.length) parts.push(countText(model.pendingHabits.length, 'привычка', 'привычки', 'привычек'));
    if (!model.todayOperations.length) parts.push('финансы не обновлялись');
    return parts.length ? `${parts.join(' · ')}. Зафиксируйте короткий итог без самокритики.` : 'День собран. Запишите один результат и первый шаг на завтра.';
  }

  function reminderPermissionLabel() {
    if (typeof Notification === 'undefined') return 'не поддерживаются';
    return ({ granted: 'разрешены', denied: 'запрещены браузером', default: 'ждут разрешения' }[Notification.permission] || Notification.permission);
  }

  function reminderRows(model) {
    const rows = [];
    model.tasks.slice(0, 4).forEach(item => rows.push({ icon: item.date < model.date ? '!' : '✓', tone: item.date < model.date ? 'red' : 'blue', title: item.title || 'Задача', detail: item.date < model.date ? 'Просрочена · остаётся в напоминаниях' : `${item.time || 'без времени'} · приоритет ${item.priority || 'B'}`, route: 'tasks' }));
    model.debts.slice(0, 3).forEach(entry => rows.push({ icon: '₽', tone: entry.days < 0 ? 'red' : 'amber', title: entry.item.person || 'Обязательный платёж', detail: entry.days < 0 ? `Просрочено · ${money(entry.item.amount)}` : `${entry.days === 0 ? 'сегодня' : `через ${entry.days} дн.`} · ${money(entry.item.amount)}`, route: 'debts' }));
    model.people.slice(0, 3).forEach(entry => rows.push({ icon: '♡', tone: 'violet', title: entry.person.name || 'Человек', detail: `${entry.title} · ${entry.detail}`.slice(0, 120), route: 'people' }));
    if (model.pendingHabits.length) rows.push({ icon: '↻', tone: 'green', title: `Привычки ${model.habits.length - model.pendingHabits.length}/${model.habits.length}`, detail: `${model.pendingHabits.length} ещё не отмечено сегодня`, route: 'habits' });
    if (!model.todayOperations.length) rows.push({ icon: '₽', tone: 'blue', title: 'Финансы сегодня не обновлялись', detail: 'Проверьте расходы и остаток — даже если операций не было', route: 'finance' });
    return rows;
  }

  function openReminderCenter() {
    const settings = reminderSettings();
    const model = reminderModel();
    const rows = reminderRows(model);
    openModal('Центр личных напоминаний', `<div class="v67-reminder-center"><section class="v67-reminder-hero"><span>◷</span><div><small>${e(settings.morning)} план · ${e(settings.evening)} итог</small><h3>${rows.length ? `${countText(rows.length, 'сигнал требует', 'сигнала требуют', 'сигналов требуют')} внимания` : 'Срочных сигналов нет'}</h3><p>${e(morningReminderText(model))}</p></div><em class="${settings.enabled ? 'is-on' : ''}">${settings.enabled ? 'включено' : 'выключено'}</em></section><div class="v67-reminder-status"><article><span>Разрешение</span><b>${e(reminderPermissionLabel())}</b></article><article><span>Канал</span><b>это устройство</b></article><article><span>Фоновый режим</span><b>${navigator.onLine ? 'нужна настройка Web Push' : 'сейчас офлайн'}</b></article></div><div class="v67-reminder-rows">${rows.map(row => `<button data-v67-life-action="reminder-go" data-route="${e(row.route)}" type="button"><span class="is-${row.tone}">${row.icon}</span><div><b>${e(row.title)}</b><small>${e(row.detail)}</small></div><i>→</i></button>`).join('') || '<div class="v67-reminder-empty"><span>✓</span><div><b>Можно не держать всё в голове</b><small>Следующая проверка произойдёт автоматически.</small></div></div>'}</div><section class="v67-reminder-preview"><div><span>Утро</span><p>${e(morningReminderText(model))}</p></div><div><span>Вечер</span><p>${e(eveningReminderText(model))}</p></div></section><div class="v67-course-actions"><button class="is-primary" data-v67-life-action="send-reminder-test" type="button">Проверить уведомление</button><button data-v66-action="openNotifications" type="button">Настроить время</button><button data-v67-life-action="close-life-modal" type="button">Закрыть</button></div><p class="v67-reminder-note">Если приложение было временно неактивно, напоминание догонит расписание в безопасном окне: до 3 часов для утра и до 4 часов для вечера. Для уведомлений при полностью закрытом iPhone потребуется Web Push после публикации на HTTPS.</p></div>`);
  }

  async function showSystemReminder(title, body, tag, route = 'dashboard') {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, { body, tag, renotify: false, icon: './icon-192-v71.png', badge: './icon-192-v71.png', data: { url: `./#${route}` } });
    return true;
  }

  async function notifyOnce(key, title, body, tag, route) {
    if (localStorage.getItem(key)) return false;
    const shown = await showSystemReminder(title, body, tag, route);
    if (shown) localStorage.setItem(key, new Date().toISOString());
    return shown;
  }

  async function sendReminderTest() {
    const settings = reminderSettings();
    if (typeof Notification === 'undefined') return toast('Уведомления не поддерживаются в этом браузере');
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      settings.enabled = permission === 'granted';
      save();
      if (permission !== 'granted') return toast('Браузер не разрешил уведомления');
    } else if (!settings.enabled) {
      settings.enabled = true;
      save();
    }
    const model = reminderModel();
    await showSystemReminder('План дня · проверка', morningReminderText(model), `sbos-reminder-test-${Date.now()}`, 'dashboard');
    toast('Проверочное уведомление отправлено');
    openReminderCenter();
  }

  async function notificationTick() {
    const settings = reminderSettings();
    if (!settings.enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    const model = reminderModel();
    const date = model.date;
    if (withinReminderWindow(settings.morning || '09:00', 180)) {
      await notifyOnce(`secondBrainOS.v66.notification.${date}.morning`, 'План утра', morningReminderText(model), `sbos-morning-${date}`, 'dashboard');
    }
    if (withinReminderWindow(settings.evening || '20:00', 240)) {
      await notifyOnce(`secondBrainOS.v66.notification.${date}.evening`, 'Короткий итог вечера', eveningReminderText(model), `sbos-evening-${date}`, 'reviews');
    }
    for (const task of model.timedTasks) {
      const scheduled = reminderTimeMinutes(task.reminder) !== null ? task.reminder : task.time;
      if (!withinReminderWindow(scheduled, 180)) continue;
      await notifyOnce(`secondBrainOS.v67.taskReminder.${date}.${task.id}`, task.title || 'Личная задача', `${task.time || scheduled} · ${task.area || 'Личное'}. Задача останется в списке, пока вы её не завершите.`, `sbos-task-${task.id}-${date}`, 'tasks');
    }
  }

  function reminderSelfTest() {
    const checks = {
      morningTime: reminderTimeMinutes('09:00') === 540,
      eveningTime: reminderTimeMinutes('20:00') === 1200,
      singular: countText(1, 'сигнал', 'сигнала', 'сигналов') === '1 сигнал',
      plural: countText(5, 'сигнал', 'сигнала', 'сигналов') === '5 сигналов',
      sideGigIsPersonal: personalItem({ area: 'Подработка', title: 'Подготовить заказ' }),
      wageWorkExcluded: !personalItem({ area: 'Работа', title: 'Отчёт работодателю' })
    };
    return { ok: Object.values(checks).every(Boolean), checks };
  }

  function courseState() { return lifeSettings().tradingCourse; }
  function currentLesson() { return COURSE.find(item => item.id === courseState().current) || COURSE.find(item => !courseState().completed.includes(item.id)) || COURSE[0]; }

  function tradingCoursePage() {
    const progress = courseState();
    const lesson = currentLesson();
    const completed = progress.completed.filter(id => COURSE.some(item => item.id === id));
    const percent = Math.round(completed.length / COURSE.length * 100);
    const answer = progress.answers[lesson.id];
    const correct = Number(answer) === lesson.correct;
    return layout('Обучение Forex', 'Пошаговый курс по основам, риску и дисциплине. Без торговых сигналов и обещаний доходности.', `<section class="v67-course"><div class="v67-course-hero"><div><span class="v65-overline">Личная программа</span><h2>${completed.length}/${COURSE.length} уроков</h2><p>Прогресс сохраняется отдельно от демо- и реальных сделок.</p><div><i style="width:${percent}%"></i></div><small>${percent}% курса завершено</small></div><aside><span>Цель курса</span><b>Повторяемый процесс</b><p>Сначала правила и демо-дисциплина, затем осторожный переход к реальному счёту.</p></aside></div><div class="v67-course-layout"><aside class="v67-course-list">${COURSE.map((item, index) => `<button class="${item.id === lesson.id ? 'active' : ''} ${completed.includes(item.id) ? 'done' : ''}" data-v67-life-action="course-lesson" data-id="${item.id}" type="button"><span>${completed.includes(item.id) ? '✓' : index + 1}</span><div><b>${item.title}</b><small>${item.time}</small></div></button>`).join('')}</aside><article class="v67-lesson"><header><span>${lesson.icon}</span><div><small>${lesson.time}</small><h2>${lesson.title}</h2><p>${lesson.intro}</p></div></header><ol>${lesson.points.map(point => `<li>${point}</li>`).join('')}</ol><section class="v67-quiz"><span class="v65-overline">Мини-тест</span><h3>${lesson.question}</h3><div>${lesson.options.map((option, index) => `<button class="${Number(answer) === index ? (index === lesson.correct ? 'correct' : 'wrong') : ''}" data-v67-life-action="course-answer" data-lesson="${lesson.id}" data-answer="${index}" type="button"><span>${String.fromCharCode(65 + index)}</span>${option}</button>`).join('')}</div>${answer !== undefined ? `<p class="${correct ? 'correct' : 'wrong'}">${correct ? 'Верно. ' : 'Пока неверно. '}${lesson.explanation}</p>` : '<p>Выберите один вариант. Ошибка не сбрасывает прогресс.</p>'}</section><div class="v67-course-actions"><button data-v67-life-action="complete-lesson" data-id="${lesson.id}" class="is-primary" type="button" ${correct ? '' : 'disabled'}>${completed.includes(lesson.id) ? 'Урок завершён' : 'Завершить урок'}</button><button data-go="trading" type="button">Открыть Forex-журнал</button></div></article></div></section>`);
  }

  function selectLesson(id) {
    if (!COURSE.some(item => item.id === id)) return;
    courseState().current = id;
    save(); render();
  }

  function answerCourse(lessonId, answer) {
    const lesson = COURSE.find(item => item.id === lessonId);
    if (!lesson) return;
    courseState().answers[lessonId] = Number(answer);
    save(); render();
    toast(Number(answer) === lesson.correct ? 'Верно' : 'Посмотрите объяснение и попробуйте ещё раз');
  }

  function completeLesson(id) {
    const lesson = COURSE.find(item => item.id === id);
    if (!lesson || Number(courseState().answers[id]) !== lesson.correct) return toast('Сначала ответьте на мини-тест');
    if (!courseState().completed.includes(id)) courseState().completed.push(id);
    const index = COURSE.findIndex(item => item.id === id);
    courseState().current = COURSE[index + 1]?.id || id;
    save(); render(); toast(index + 1 < COURSE.length ? 'Урок завершён · открыт следующий' : 'Курс завершён');
  }

  function tradingReadinessModel() {
    const courseCompleted = courseState().completed.filter(id => COURSE.some(item => item.id === id)).length;
    const demo = list('trades').filter(trade => trade.mode === 'demo').slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    let disciplinedSeries = 0;
    for (const trade of demo) {
      const followed = trade.followedPlan === true || trade.followedPlan === 'true';
      if (!followed || trade.riskViolation) break;
      disciplinedSeries += 1;
    }
    const manual = lifeSettings().tradingReadiness.manual === true;
    const automatic = courseCompleted === COURSE.length && disciplinedSeries >= 20;
    return { courseCompleted, disciplinedSeries, manual, automatic, ready: automatic || manual };
  }

  function openTradingReadiness() {
    const model = tradingReadinessModel();
    openModal('Допуск к реальному Forex', `<div class="v67-readiness"><section><span>${model.ready ? '✓' : '⛨'}</span><div><small>Защита от слишком раннего старта</small><h3>${model.ready ? 'Реальный режим доступен' : 'Сначала процесс, затем реальные деньги'}</h3><p>Автоматический допуск требует весь курс и серию из 20 демо-сделок без нарушения плана. При необходимости вы можете открыть режим вручную с отдельным подтверждением.</p></div></section><div class="v67-readiness-grid"><article class="${model.courseCompleted === COURSE.length ? 'done' : ''}"><span>Курс</span><b>${model.courseCompleted}/${COURSE.length}</b><small>${model.courseCompleted === COURSE.length ? 'завершён' : 'пройдите уроки и мини-тесты'}</small><button data-go="trading-course" type="button">Открыть курс</button></article><article class="${model.disciplinedSeries >= 20 ? 'done' : ''}"><span>Демо-серия</span><b>${Math.min(model.disciplinedSeries, 20)}/20</b><small>${model.disciplinedSeries >= 20 ? 'условие выполнено' : 'считаются последние сделки до первого нарушения'}</small><button data-go="trading" type="button">Открыть журнал</button></article></div>${model.manual ? '<div class="v67-readiness-manual is-active"><b>Ручной допуск включён</b><p>Вы подтвердили личную ответственность за решение. Лимиты риска и разбор убытков продолжают работать.</p><button data-v67-life-action="reset-readiness-manual" type="button">Вернуть автоматический допуск</button></div>' : (model.automatic ? '<div class="v67-readiness-manual is-active"><b>Автоматические условия выполнены</b><p>Курс и демо-серия завершены. Перед каждой сделкой всё равно действуют лимиты риска.</p></div>' : '<div class="v67-readiness-manual"><label><input id="v67_manual_readiness" type="checkbox"><span>Я понимаю, что ручной допуск не подтверждает навык и не снижает финансовый риск.</span></label><button data-v67-life-action="confirm-readiness-manual" type="button">Открыть реальный режим вручную</button></div>')}</div>`);
  }

  function confirmManualReadiness() {
    if (!document.getElementById('v67_manual_readiness')?.checked) return toast('Подтвердите понимание риска');
    if (!window.confirm('Открыть реальный Forex вручную до выполнения курса и 20 демо-сделок? Лимиты риска останутся обязательными.')) return;
    lifeSettings().tradingReadiness = { manual: true, manualConfirmedAt: new Date().toISOString() };
    save(); closeModal(); render(); toast('Ручной допуск включён · используйте минимальный риск');
  }

  function resetManualReadiness() {
    lifeSettings().tradingReadiness = { manual: false, manualConfirmedAt: '' };
    save(); closeModal(); render(); toast('Возвращён автоматический допуск');
  }

  function pendingLoss() {
    return list('trades').filter(trade => trade.mode === 'real' && num(trade.resultAmount) < 0 && !trade.lossReview?.completedAt).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0] || null;
  }

  function openLossReview(id) {
    const trade = list('trades').find(item => String(item.id) === String(id)) || pendingLoss();
    if (!trade) return toast('Сделка для разбора не найдена');
    openModal('Разбор убыточной сделки', `<div class="v67-loss-review"><section><span>◇</span><div><small>${e(trade.pair || 'FOREX')} · ${e(trade.date || '')}</small><h3>Сначала урок, затем новая реальная сделка</h3><p>Убыток не означает провал. Короткий разбор нужен, чтобы следующая сделка не стала эмоциональной попыткой отыграться.</p></div></section><label><span>Что произошло по фактам?</span><textarea id="v67_loss_fact" placeholder="Без оценки себя: что сделал рынок и что сделали вы?">${e(trade.lossReview?.fact || '')}</textarea></label><label><span>Какая эмоция сильнее всего?</span><input id="v67_loss_emotion" value="${e(trade.lossReview?.emotion || trade.emotion || '')}" placeholder="Например: спешка, страх, злость"></label><label><span>Какой урок я забираю?</span><textarea id="v67_loss_lesson" placeholder="Один честный вывод">${e(trade.lossReview?.lesson || '')}</textarea></label><label><span>Что конкретно изменю в следующей сделке?</span><textarea id="v67_loss_change" placeholder="Одно проверяемое правило">${e(trade.lossReview?.change || '')}</textarea></label><label class="v67-loss-ready"><input id="v67_loss_ready" type="checkbox"><span>Я завершил разбор и не пытаюсь немедленно вернуть убыток.</span></label><div class="v67-course-actions"><button data-v67-life-action="save-loss-review" data-id="${e(trade.id)}" class="is-primary" type="button">Завершить разбор</button><button data-v67-life-action="close-life-modal" type="button">Отмена</button></div></div>`);
  }

  function saveLossReview(id) {
    const trade = list('trades').find(item => String(item.id) === String(id));
    if (!trade) return;
    const value = field => clean(document.getElementById(field)?.value);
    const lesson = value('v67_loss_lesson');
    const change = value('v67_loss_change');
    if (!lesson || !change) return toast('Добавьте урок и одно конкретное изменение');
    if (!document.getElementById('v67_loss_ready')?.checked) return toast('Подтвердите завершение разбора');
    trade.lossReview = { fact: value('v67_loss_fact'), emotion: value('v67_loss_emotion'), lesson, change, completedAt: new Date().toISOString() };
    trade.lossReviewRequired = false;
    save(); closeModal(); render(); toast('Разбор завершён · следующая реальная сделка доступна');
  }

  function beforeOpenTrade(mode) {
    if (mode !== 'real') return true;
    const trade = pendingLoss();
    if (trade) {
      openLossReview(trade.id);
      return false;
    }
    if (!tradingReadinessModel().ready) {
      openTradingReadiness();
      return false;
    }
    return true;
  }

  function canSaveRealTrade(mode) { return beforeOpenTrade(mode); }

  function injectTradingGrowth(view) {
    const hero = view.querySelector('.v66-trade-hero,.hero,.v59-hero');
    if (!hero || view.querySelector('.v67-trading-growth')) return;
    const loss = pendingLoss();
    const progress = courseState();
    const readiness = tradingReadinessModel();
    hero.insertAdjacentHTML('afterend', `<section class="v67-trading-growth">${loss ? `<article class="is-loss"><span>◇</span><div><b>Перед следующей реальной сделкой нужен разбор</b><small>${e(loss.pair || 'FOREX')} · результат ${money(loss.resultAmount)} · сначала урок, затем действие</small></div><button data-v67-life-action="open-loss-review" data-id="${e(loss.id)}" type="button">Разобрать</button></article>` : '<article><span>✓</span><div><b>Незавершённых разборов нет</b><small>Реальная сделка всё равно проверит лимиты риска.</small></div></article>'}<article><span>▤</span><div><b>Обучение Forex</b><small>${progress.completed.length}/${COURSE.length} уроков · тесты и сохранение прогресса</small></div><button data-go="trading-course" type="button">Продолжить</button></article><article class="${readiness.ready ? 'is-ready' : 'is-readiness'}"><span>${readiness.ready ? '✓' : '⛨'}</span><div><b>Допуск к реальному счёту</b><small>${readiness.manual ? 'открыт вручную' : `${readiness.courseCompleted}/${COURSE.length} уроков · ${Math.min(readiness.disciplinedSeries, 20)}/20 демо-сделок`}</small></div><button data-v67-life-action="open-readiness" type="button">${readiness.ready ? 'Проверить' : 'Условия'}</button></article></section>`);
  }

  function injectCourseNavigation() {
    const nav = document.querySelector('.v59-nav-scroll');
    if (!nav || nav.querySelector('[data-go="trading-course"]')) return;
    const trading = nav.querySelector('[data-go="trading"]');
    if (!trading) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'v59-nav-item v67-course-nav'; button.dataset.go = 'trading-course';
    button.innerHTML = '<span class="v59-nav-ico" style="background:linear-gradient(135deg,#0f766e,#2dd4bf)">▤</span><span class="label">Обучение Forex</span><span></span>';
    trading.insertAdjacentElement('afterend', button);
  }

  function injectSystemLifeCards(view) {
    const grid = view.querySelector('.v66-system-grid');
    if (!grid || grid.querySelector('[data-v67-life-card]')) return;
    const recognition = speechApi() ? 'доступен в браузере' : 'через диктовку клавиатуры';
    const reminderCount = reminderRows(reminderModel()).length;
    grid.insertAdjacentHTML('beforeend', `<article data-v67-life-card><span>◐</span><div><b>Светлая и тёмная тема</b><small>сейчас: ${e(lifeSettings().theme === 'auto' ? 'как в системе' : lifeSettings().theme)}</small></div><button data-v67-life-action="open-theme" type="button">Выбрать</button></article><article data-v67-life-card><span>●</span><div><b>Голосовой ввод</b><small>${recognition} · задачи, заметки, расходы и дневник</small></div><button data-v67-life-action="open-voice" type="button">Открыть</button></article><article data-v67-life-card><span>◷</span><div><b>Центр напоминаний</b><small>${reminderCount ? `${countText(reminderCount, 'сигнал', 'сигнала', 'сигналов')} · утро, вечер и личные сроки` : 'срочных сигналов нет · утро 09:00, вечер 20:00'}</small></div><button data-v67-life-action="open-reminder-center" type="button">Открыть</button></article><article data-v67-life-card><span>▣</span><div><b>PWA для iPhone</b><small>установка на экран «Домой», без App Store</small></div><button data-v67-life-action="install-pwa" type="button">Установить</button></article>`);
  }

  function polishSystemPage(view) {
    const heroText = view.querySelector('.hero p,.v59-hero p');
    if (heroText) heroText.textContent = 'Защита данных, вход, уведомления, оформление и установка на устройства.';
    const legacyHeading = [...view.querySelectorAll('h2')].find(element => /V60 Clickable Folders/i.test(element.textContent || ''));
    if (legacyHeading) {
      legacyHeading.textContent = 'Резервная копия';
      if (legacyHeading.nextElementSibling) legacyHeading.nextElementSibling.textContent = 'Скачайте копию личных данных перед крупными изменениями или переносом на другое устройство.';
      const container = legacyHeading.parentElement;
      const backup = container?.querySelector('[data-v59-action="backup"]');
      if (backup) backup.textContent = 'Скачать резервную копию';
      container?.querySelector('[data-v60-action="testRoutes"]')?.remove();
      const home = container?.querySelector('[data-go="dashboard"]');
      if (home) home.textContent = 'На главную';
    }
    const dataHeading = [...view.querySelectorAll('h3')].find(element => element.textContent === 'Данные');
    if (dataHeading) dataHeading.textContent = 'Сохранённые записи';
    const labels = { operations: 'Операции', debts: 'Долги', tasks: 'Задачи', purchases: 'Покупки', wishes: 'Желания', notes: 'Заметки', ideas: 'Идеи', people: 'Люди', habits: 'Привычки', goals: 'Цели', documents: 'Документы', books: 'Книги', films: 'Фильмы', trips: 'Поездки', personal: 'Личная память', archive: 'Архив', inbox: 'Входящие' };
    view.querySelectorAll('.v59-health-item span').forEach(element => { if (labels[element.textContent]) element.textContent = labels[element.textContent]; });
  }

  async function installPwa() {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      return;
    }
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    openModal('Установить Second Brain OS', `<div class="v67-install"><span>▣</span><h3>${ios ? 'Добавьте приложение на экран «Домой»' : 'Установка PWA'}</h3><ol>${ios ? '<li>Откройте сайт в Safari.</li><li>Нажмите «Поделиться».</li><li>Выберите «На экран Домой».</li><li>Подтвердите название Second Brain OS.</li>' : '<li>Откройте меню браузера.</li><li>Выберите «Установить приложение» или «Создать ярлык».</li><li>Разрешите уведомления после установки.</li>'}</ol><p>Данные останутся локальными, пока вы отдельно не включите облачную синхронизацию.</p></div>`);
  }

  function injectSupportiveTone(view, route) {
    if (route !== 'coach' || view.querySelector('.v67-supportive-tone')) return;
    const hero = view.querySelector('.hero,.v59-hero,.v65-assistant-intro');
    if (!hero) return;
    hero.insertAdjacentHTML('afterend', '<section class="v67-supportive-tone"><span>♡</span><div><b>Сначала поддержка, затем конкретный шаг</b><small>Помощник не ругает за пропуски и не оценивает вашу ценность по продуктивности.</small></div></section>');
  }

  function postRender() {
    const v70Active = Boolean(document.querySelector('script[src*="app-v70-living.js"]'));
    const v69Active = Boolean(document.querySelector('script[src*="app-v69-calm.js"]'));
    const v68Active = Boolean(document.querySelector('script[src*="app-v68-assistant.js"]'));
    const activeBuild = v70Active ? 'second-brain-space-v70-living-personal-os-20260715' : (v69Active ? 'second-brain-space-v69-calm-intelligence-20260715' : (v68Active ? 'second-brain-space-v68-unified-assistant-20260715' : BUILD));
    document.body.dataset.sbosBuild = activeBuild;
    document.body.dataset.v678ReminderSelftest = reminderSelfTest().ok ? 'pass' : 'fail';
    document.querySelector('meta[name="second-brain-build"]')?.setAttribute('content', activeBuild);
    try { localStorage.setItem('secondBrainOS.currentBuild', activeBuild); } catch (error) {}
    const version = document.querySelector('.v59-version,.version');
    if (version && version.textContent !== (v70Active ? 'V70 · LIVING PERSONAL OS' : (v69Active ? 'V69 · CALM INTELLIGENCE' : (v68Active ? 'V68 · UNIFIED PERSONAL OS' : 'V67.8 · LIVING PERSONAL OS')))) version.textContent = v70Active ? 'V70 · LIVING PERSONAL OS' : (v69Active ? 'V69 · CALM INTELLIGENCE' : (v68Active ? 'V68 · UNIFIED PERSONAL OS' : 'V67.8 · LIVING PERSONAL OS'));
    const core = document.querySelector('.v59-core-pill');
    if (core && core.textContent !== (v70Active ? 'V70' : (v69Active ? 'V69' : (v68Active ? 'V68' : 'V67.8')))) core.textContent = v70Active ? 'V70' : (v69Active ? 'V69' : (v68Active ? 'V68' : 'V67.8'));
    ensurePersonFields();
    ensureFinanceFields();
    injectTopTools();
    injectCourseNavigation();
    applyTheme();
    const view = document.getElementById('view');
    if (!view) return;
    const route = (location.hash || '').replace('#', '') || 'dashboard';
    if (route === 'trading-course') view.innerHTML = tradingCoursePage();
    if (route === 'dashboard') dashboardAttention(view);
    if (route === 'finance') injectFinanceIncomeGoal(view);
    if (route === 'trading') injectTradingGrowth(view);
    if (route === 'debts') injectDebtReminders(view);
    if (route === 'people') injectPeopleReminders(view);
    if (route === 'system') { polishSystemPage(view); injectSystemLifeCards(view); }
    injectSupportiveTone(view, route);
    document.querySelectorAll('.v59-nav-item').forEach(button => button.classList.toggle('active', button.dataset.go === route));
    const prime = view.querySelector('.v65-prime');
    const statsParent = prime?.querySelector('article')?.parentElement;
    if (statsParent && statsParent.querySelectorAll(':scope>article').length === 4) statsParent.classList.add('v67-equal-core');
  }

  function schedulePost() {
    clearTimeout(postTimer);
    postTimer = setTimeout(postRender, 45);
  }

  const oldRender = typeof render === 'function' ? render : null;
  if (oldRender) {
    render = function () {
      const result = oldRender.apply(this, arguments);
      requestAnimationFrame(postRender);
      return result;
    };
  }

  window.SecondBrainLife = { beforeOpenTrade, canSaveRealTrade, openLossReview, openReminderCenter, notificationTick, reminderModel, reminderSelfTest, postRender };

  window.addEventListener('click', event => {
    const button = event.target.closest?.('[data-v67-life-action]');
    if (!button) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    const action = button.dataset.v67LifeAction;
    if (action === 'open-theme') return openTheme();
    if (action === 'set-theme') return setTheme(button.dataset.theme || 'auto');
    if (action === 'open-voice') return openVoiceCapture();
    if (action === 'start-voice') return startVoice();
    if (action === 'stop-voice') return stopVoice();
    if (action === 'save-voice') return saveVoice(button.dataset.type || 'note');
    if (action === 'confirm-voice-expense') return confirmVoiceExpense();
    if (action === 'toggle-heavy-day') return toggleHeavyDay();
    if (action === 'open-reminder-center') return openReminderCenter();
    if (action === 'send-reminder-test') return sendReminderTest();
    if (action === 'reminder-go') { closeModal(); return go(button.dataset.route || 'dashboard'); }
    if (action === 'mark-contact') return markContact(button.dataset.id || '');
    if (action === 'course-lesson') return selectLesson(button.dataset.id || '');
    if (action === 'course-answer') return answerCourse(button.dataset.lesson || '', button.dataset.answer || '0');
    if (action === 'complete-lesson') return completeLesson(button.dataset.id || '');
    if (action === 'open-loss-review') return openLossReview(button.dataset.id || '');
    if (action === 'save-loss-review') return saveLossReview(button.dataset.id || '');
    if (action === 'open-readiness') return openTradingReadiness();
    if (action === 'confirm-readiness-manual') return confirmManualReadiness();
    if (action === 'reset-readiness-manual') return resetManualReadiness();
    if (action === 'install-pwa') return installPwa();
    if (action === 'close-life-modal') return closeModal();
  }, true);

  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
  window.addEventListener('hashchange', () => [0, 90, 240].forEach(delay => setTimeout(postRender, delay)));
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  const app = document.getElementById('app');
  if (app) new MutationObserver(schedulePost).observe(app, { childList: true, subtree: true });
  lifeSettings();
  postRender();
  notificationTick().catch(() => {});
  [150, 700, 1900, 3600, 6500].forEach(delay => setTimeout(postRender, delay));
})();
