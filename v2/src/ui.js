/* Общие элементы интерфейса. Возвращают строки HTML.
   Всё пользовательское проходит через esc() из format.js. */

import { esc, money } from './format.js?v=2.2.0';

/** Полоса метрик на волосяных линиях — без карточек и теней. */
export function metricStrip(items) {
  return `<div class="strip">${items.map((item) => `
    <div class="m">
      <small>${esc(item.label)}</small>
      <b class="${item.tone || ''}">${item.value}</b>
      ${item.hint ? `<em>${esc(item.hint)}</em>` : ''}
    </div>`).join('')}</div>`;
}

/** Кольцевой индикатор. value от 0 до 1. */
export function ring(value, big, small) {
  const clamped = Math.max(0, Math.min(1, Number(value) || 0));
  const deg = Math.round(clamped * 360);
  return `<div class="ringbox">
    <div class="ring" style="--deg:${deg}deg"></div>
    <div class="ring-in"><b>${big}</b><span>${esc(small)}</span></div>
  </div>`;
}

/**
 * График-кривая по точкам. points — массив чисел (значения по оси Y).
 * Рисуется как убывающая/растущая линия с градиентной заливкой.
 */
export function areaChart(points, { id = 'c', height = 128 } = {}) {
  const values = (points || []).filter((v) => Number.isFinite(v));
  if (values.length < 2) {
    return `<div class="chart-empty">Недостаточно данных для графика</div>`;
  }
  const width = 420;
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const stepX = (width - 8) / (values.length - 1);
  const toY = (v) => height - 6 - ((v - min) / span) * (height - 22);

  const coords = values.map((v, i) => [4 + i * stepX, toY(v)]);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height} L4,${height} Z`;
  const [lastX, lastY] = coords[coords.length - 1];

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img">
    <defs>
      <linearGradient id="ln-${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--accent-deep)"/>
        <stop offset="100%" stop-color="var(--accent2)"/>
      </linearGradient>
      <linearGradient id="ar-${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(124,107,255,.32)"/>
        <stop offset="100%" stop-color="rgba(124,107,255,0)"/>
      </linearGradient>
    </defs>
    <path fill="url(#ar-${id})" d="${area}"/>
    <line class="base" x1="4" y1="${height - 1}" x2="${width - 4}" y2="${height - 1}"/>
    <path class="ln" stroke="url(#ln-${id})" d="${line}"/>
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="10" fill="var(--accent)" opacity=".16"/>
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.6" fill="var(--accent)"/>
  </svg>`;
}

export const axis = (labels) =>
  `<div class="axis">${labels.map((l) => `<span>${esc(l)}</span>`).join('')}</div>`;

/** Строка списка: название, описание, прогресс, сумма и кнопки действий. */
export function listRow({ rank, title, subtitle, progress, progressLabel, amount, tone = '', danger = false, actions = [] }) {
  return `<div class="row ${danger ? 'dgr' : ''}">
    ${rank ? `<span class="rank">${esc(rank)}</span>` : ''}
    <div class="n"><b>${esc(title)}</b><span>${esc(subtitle || '')}</span></div>
    ${progress !== undefined && progress !== null ? `
      <div class="pr">
        <div class="tr"><i class="${danger ? 'd' : ''}" style="width:${Math.max(0, Math.min(100, progress * 100)).toFixed(0)}%"></i></div>
        ${progressLabel ? `<small>${esc(progressLabel)}</small>` : ''}
      </div>` : ''}
    ${amount !== undefined ? `<div class="amt ${tone}">${amount}</div>` : ''}
    ${actions.length ? `<div class="row-acts">${actions.map((a) => `
      <button class="row-btn" type="button" data-act="${esc(a.action)}" data-id="${esc(a.id)}"
        title="${esc(a.title)}" aria-label="${esc(a.title)}">${esc(a.icon)}</button>`).join('')}</div>` : ''}
  </div>`;
}

export const card = (inner, { pad = true, cls = '' } = {}) =>
  `<div class="card ${pad ? 'pad' : ''} ${cls}">${inner}</div>`;

export const label = (text) => `<div class="lbl">${esc(text)}</div>`;

export const empty = (text, action = '') =>
  `<div class="empty">${esc(text)}${action ? `<div class="acts">${action}</div>` : ''}</div>`;

export const button = (text, { action = '', primary = false, id = '', extra = '' } = {}) =>
  `<button class="btn ${primary ? '' : 'sec'}" type="button" data-act="${esc(action)}" ${id ? `data-id="${esc(id)}"` : ''} ${extra}>${esc(text)}</button>`;

/** Заголовок экрана. */
export function pageHead({ eyebrow, title, subtitle, actions = '' }) {
  return `<div class="top">
    <div class="l">
      <div class="date">${esc(eyebrow)}</div>
      <h1>${esc(title)}</h1>
      ${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ''}
    </div>
    ${actions ? `<div class="acts">${actions}</div>` : ''}
  </div>`;
}

/** Сумма с уважением к «не заполнено»: пустое печатается словами. */
export const amount = (value, tone = '') =>
  `<span class="${tone}">${money(value)}</span>`;
