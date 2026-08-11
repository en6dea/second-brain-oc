/* Служебный экран: где лежат данные, какие есть копии, как их вынести.

   Раздел скучный, но он единственный отвечает на вопрос «что будет, если
   всё сломается». Поэтому здесь без украшений: состояние хранилища, список
   копий, выгрузка в файл и загрузка из файла. */

import { getState, dataCounts, listBackups, createBackup, restoreBackup, exportState } from '../store.js?v=2.2.0';
import { esc, dateShort, plural } from '../format.js?v=2.2.0';
import { pageHead, card, label, button, metricStrip, empty } from '../ui.js?v=2.2.0';

/* Копии подгружаются асинхронно, поэтому храним их между отрисовками. */
let cachedBackups = null;

export function invalidateBackups() { cachedBackups = null; }

/**
 * Читает список копий и перерисовывает экран.
 * Выходит сразу, если список уже прочитан: перерисовка снова вызывает эту
 * функцию, и без проверки получился бы бесконечный цикл.
 */
export async function loadBackups(rerender) {
  if (cachedBackups !== null) return;
  cachedBackups = [];                     /* занимаем место, чтобы не войти дважды */
  try {
    cachedBackups = await listBackups();
  } catch (error) {
    cachedBackups = { error: String(error && error.message || error) };
  }
  if (rerender) rerender();
}

const NAMES = {
  tasks: 'Задачи', operations: 'Операции', debts: 'Обязательства',
  habits: 'Привычки', goals: 'Цели', financeAccounts: 'Счета',
  people: 'Люди', notes: 'Заметки', financeCategories: 'Категории',
  debtPayments: 'Платежи по долгам', books: 'Книги', wishes: 'Желания'
};

export function render() {
  const state = getState();
  const counts = dataCounts();
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const head = pageHead({
    eyebrow: 'Сохранность данных',
    title: 'Хранилище',
    subtitle: 'Где лежат записи, какие есть копии и как вынести всё в файл',
    actions: `${button('Выгрузить в файл', { action: 'export-json' })}${button('Создать копию', { action: 'backup-now', primary: true })}`
  });

  const storage = card(`
    ${label('Где лежат данные')}
    <div class="kv">
      <div><span>Хранилище</span><b>IndexedDB · SecondBrainOSDurableStorage</b></div>
      <div><span>Версия схемы</span><b>${esc(String(state.schemaVersion || 3))}</b></div>
      <div><span>Общий доступ</span><b>с прежней версией приложения</b></div>
      <div><span>Всего записей</span><b>${total}</b></div>
    </div>
    <p class="muted" style="margin-top:14px">Обе версии приложения читают и пишут одни и те же записи,
    поэтому переключаться между ними можно в любой момент, ничего не перенося.</p>
  `);

  const filled = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  const collections = card(`
    ${label('Что в базе')}
    ${filled.length
      ? `<div class="kv">${filled.map(([key, n]) => `
          <div><span>${esc(NAMES[key] || key)}</span><b>${n}</b></div>`).join('')}</div>`
      : '<p class="muted">Записей пока нет.</p>'}
  `);

  let backups;
  if (cachedBackups === null) {
    backups = card(`${label('Резервные копии')}<p class="muted">Читаю список…</p>`);
  } else if (cachedBackups.error) {
    backups = card(`${label('Резервные копии')}<p class="muted">Не удалось прочитать: ${esc(cachedBackups.error)}</p>`);
  } else if (!cachedBackups.length) {
    backups = card(`${label('Резервные копии')}<p class="muted">Копий пока нет. Первая создаётся автоматически перед первой записью.</p>`);
  } else {
    backups = card(`
      ${label(`Резервные копии · ${cachedBackups.length}`)}
      ${cachedBackups.slice(0, 12).map((backup) => {
        const reason = backup.key.split(':')[1] || '';
        return `<div class="row">
          <div class="n"><b>${esc(backup.createdAt ? dateShort(backup.createdAt.slice(0, 10)) : 'копия')}
            ${esc(backup.createdAt ? backup.createdAt.slice(11, 16) : '')}</b>
            <span>${esc(reason)}</span></div>
          <button class="row-btn" type="button" data-act="backup-restore"
            data-id="${esc(backup.key)}" title="Восстановить">↺</button>
        </div>`;
      }).join('')}
      <p class="muted" style="margin-top:12px">Перед восстановлением приложение сохранит текущее состояние отдельной копией.</p>
    `);
  }

  const importCard = card(`
    ${label('Загрузить из файла')}
    <p class="muted">Файл, выгруженный этим приложением или прежней версией.
    По умолчанию записи добавляются, существующие не трогаются.</p>
    <div class="acts">
      ${button('Добавить записи из файла', { action: 'import-merge', primary: true })}
      ${button('Заменить всё', { action: 'import-replace' })}
    </div>
  `);

  const metrics = metricStrip([
    { label: 'Всего записей', value: String(total) },
    { label: 'Копий', value: cachedBackups && !cachedBackups.error ? String(cachedBackups.length) : '—' },
    { label: 'Коллекций с данными', value: String(filled.length) },
    { label: 'Схема', value: String(state.schemaVersion || 3) }
  ]);

  return `${head}<div class="grid2">${storage}${collections}</div>${backups}${importCard}${metrics}`;
}
