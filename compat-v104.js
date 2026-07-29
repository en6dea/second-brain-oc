/* Second Brain OS V104 — helpers required before the first route render. */
'use strict';
(() => {
  const stateNow = () => window.SecondBrainApp?.getState?.() || window.state || {};
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  window.hpJournal = window.hpJournal || ((limit = 120) => {
    const logs = Array.isArray(stateNow().gameLife?.logs) ? stateNow().gameLife.logs : [];
    return logs.filter(Boolean).slice().sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || ''))).slice(0, Math.max(1, number(limit) || 120));
  });

  window.skillCard = window.skillCard || ((key, icon, title) => {
    const value = number(stateNow().gameLife?.skillXp?.[key]);
    const level = Math.max(1, Math.floor(value / 60) + 1);
    const progress = Math.max(0, Math.min(100, (value % 60) / 60 * 100));
    return `<article><i>${safe(icon)}</i><span><small>${safe(title)}</small><b>Уровень ${level}</b><u><em style="width:${progress}%"></em></u></span><strong>${value} XP</strong></article>`;
  });

  window.rewardCooldownRemaining = window.rewardCooldownRemaining || ((reward = {}) => {
    const days = number(reward.cooldownDays);
    const redeemed = reward.lastRedeemedAt ? new Date(reward.lastRedeemedAt) : null;
    if (!days || !redeemed || Number.isNaN(redeemed.getTime())) return 0;
    return Math.max(0, Math.ceil((redeemed.getTime() + days * 86400000 - Date.now()) / 86400000));
  });

  window.rewardVisual = window.rewardVisual || ((reward = {}) => {
    const image = String(reward.imageUrl || '').trim();
    const fallback = safe(reward.icon || '🎁');
    return /^https?:\/\//i.test(image) || /^data:image\//i.test(image)
      ? `<span class="v85-reward-image"><img src="${safe(image)}" alt="${safe(reward.title || 'Награда')}" loading="lazy" onerror="this.parentElement.textContent='${fallback}'"></span>`
      : `<i>${fallback}</i>`;
  });

  window.rewardAvailability = window.rewardAvailability || ((reward = {}) => {
    const game = stateNow().gameLife || {};
    const level = Math.max(1, number(game.level) || Math.floor(number(game.xp) / 250) + 1);
    const cooldown = window.rewardCooldownRemaining(reward);
    if (reward.archived || reward.active === false) return {ok: false, text: 'Неактивна'};
    if (number(reward.minLevel) > level) return {ok: false, text: `Нужен LV ${number(reward.minLevel)}`};
    if (reward.limit && number(reward.redeemedCount) >= number(reward.limit)) return {ok: false, text: 'Лимит исчерпан'};
    if (cooldown) return {ok: false, text: `Через ${cooldown} дн.`};
    if (number(game.coins) < number(reward.cost)) return {ok: false, text: 'Не хватает HP'};
    return {ok: true, text: 'Получить'};
  });
})();
