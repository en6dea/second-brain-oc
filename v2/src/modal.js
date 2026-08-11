/* Модальные окна и формы.

   Одно место на всё приложение: описываешь поля — получаешь окно, чтение
   значений и валидацию. Так формы не расходятся по виду и поведению, как
   это случилось в прошлой версии.

   Главное правило чтения чисел: пустое поле возвращает null, а не 0.
   «Не заполнено» и «ноль рублей» — разные факты (см. DATA-MODEL.md). */

import { esc } from './format.js';
import { numberOrNull } from './store.js';

let active = null;

/* ------------------------------- Поля ----------------------------------- */

function fieldHtml(field) {
  const id = `f_${field.id}`;
  const span = field.span ? ' span-2' : '';
  const value = field.value === null || field.value === undefined ? '' : field.value;

  if (field.type === 'select') {
    return `<label class="field${span}">
      <span>${esc(field.label)}</span>
      <select id="${id}">
        ${(field.options || []).map((opt) => `
          <option value="${esc(opt.value)}" ${String(opt.value) === String(value) ? 'selected' : ''}>
            ${esc(opt.label)}
          </option>`).join('')}
      </select>
      ${field.hint ? `<small>${esc(field.hint)}</small>` : ''}
    </label>`;
  }

  if (field.type === 'textarea') {
    return `<label class="field${span}">
      <span>${esc(field.label)}</span>
      <textarea id="${id}" rows="3">${esc(value)}</textarea>
      ${field.hint ? `<small>${esc(field.hint)}</small>` : ''}
    </label>`;
  }

  if (field.type === 'checkbox') {
    return `<label class="field check${span}">
      <input id="${id}" type="checkbox" ${value ? 'checked' : ''}>
      <span>${esc(field.label)}</span>
    </label>`;
  }

  const attrs = [
    `type="${field.type || 'text'}"`,
    field.type === 'number' ? 'inputmode="decimal" step="any"' : '',
    field.min !== undefined ? `min="${field.min}"` : '',
    field.placeholder ? `placeholder="${esc(field.placeholder)}"` : ''
  ].filter(Boolean).join(' ');

  return `<label class="field${span}">
    <span>${esc(field.label)}${field.required ? ' <i>обязательно</i>' : ''}</span>
    <input id="${id}" ${attrs} value="${esc(value)}">
    ${field.hint ? `<small>${esc(field.hint)}</small>` : ''}
  </label>`;
}

/** Читает значения полей. Числа — через numberOrNull. */
function readFields(fields) {
  const out = {};
  fields.forEach((field) => {
    const el = document.getElementById(`f_${field.id}`);
    if (!el) return;
    if (field.type === 'checkbox') out[field.id] = el.checked;
    else if (field.type === 'number') out[field.id] = numberOrNull(el.value);
    else out[field.id] = String(el.value || '').trim();
  });
  return out;
}

/* ------------------------------- Окно ----------------------------------- */

export function closeModal() {
  if (!active) return;
  active.node.remove();
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', active.onKey);
  active.opener?.focus?.();
  active = null;
}

/**
 * openModal({title, subtitle, fields, submitText, onSubmit, extraActions})
 * onSubmit(values) — вернуть строку с ошибкой, чтобы окно осталось открытым.
 */
export function openModal({ title, subtitle = '', fields = [], submitText = 'Сохранить', onSubmit, danger = null }) {
  closeModal();
  const opener = document.activeElement;

  const node = document.createElement('div');
  node.className = 'modal';
  node.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head">
        <div>
          <h2>${esc(title)}</h2>
          ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
        </div>
        <button class="modal-x" type="button" data-close aria-label="Закрыть">×</button>
      </div>
      <div class="modal-body">
        <div class="form-error" hidden></div>
        <div class="form-grid">${fields.map(fieldHtml).join('')}</div>
      </div>
      <div class="modal-foot">
        ${danger ? `<button class="btn ghost danger" type="button" data-danger>${esc(danger.text)}</button>` : ''}
        <span class="spacer"></span>
        <button class="btn sec" type="button" data-close>Отмена</button>
        <button class="btn" type="button" data-submit>${esc(submitText)}</button>
      </div>
    </div>`;

  const errorBox = node.querySelector('.form-error');
  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  };

  const submit = () => {
    const values = readFields(fields);
    const required = fields.find((f) => f.required && !values[f.id] && values[f.id] !== 0);
    if (required) return showError(`Заполните поле «${required.label}»`);
    const problem = onSubmit ? onSubmit(values) : null;
    if (problem) return showError(problem);
    closeModal();
  };

  node.addEventListener('click', (event) => {
    if (event.target === node || event.target.closest('[data-close]')) return closeModal();
    if (event.target.closest('[data-submit]')) return submit();
    if (event.target.closest('[data-danger]')) {
      if (!danger.confirm || window.confirm(danger.confirm)) { danger.run(); closeModal(); }
    }
  });

  const onKey = (event) => {
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && node.contains(event.target)) {
      event.preventDefault();
      submit();
    }
  };
  document.addEventListener('keydown', onKey);

  document.body.appendChild(node);
  document.body.classList.add('modal-open');
  active = { node, onKey, opener };
  node.querySelector('input,select,textarea')?.focus();
}
