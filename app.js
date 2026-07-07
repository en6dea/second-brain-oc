// Second Brain OS ↔ Альфа-Банк API — Cloudflare Worker template
// ВАЖНО: это безопасный сервер-посредник. Не храните банковские токены в GitHub Pages/app.js.
// Secrets в Cloudflare Worker:
//   SECOND_BRAIN_KEY        — свой ключ доступа из приложения
//   ALFA_CLIENT_ID          — client_id из Alfa API
//   ALFA_CLIENT_SECRET      — client_secret из Alfa API
//   ALFA_REFRESH_TOKEN      — refresh token после OAuth-согласия
//   ALFA_ACCOUNT_ID         — account/card identifier если требуется
//
// Endpoints:
//   GET /health
//   GET /operations?from=YYYY-MM-DD&to=YYYY-MM-DD

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Second-Brain-Key'
    };
    if (request.method === 'OPTIONS') return new Response('', { headers: cors });

    const key = request.headers.get('X-Second-Brain-Key');
    if (env.SECOND_BRAIN_KEY && key !== env.SECOND_BRAIN_KEY) {
      return Response.json({ ok:false, error:'unauthorized' }, { status:401, headers:cors });
    }

    if (url.pathname === '/health') {
      return Response.json({ ok:true, service:'second-brain-alfa-worker', mode:'template' }, { headers:cors });
    }

    if (url.pathname === '/operations') {
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');

      // TODO ШАГ 1: получить/обновить access_token через OAuth/refresh token Альфа-Банка.
      // const accessToken = await refreshAlfaAccessToken(env);

      // TODO ШАГ 2: вызвать endpoint истории операций Альфа-Банка.
      // Примерный псевдокод — фактические поля зависят от продукта/доступа личной карты:
      // const alfaResp = await fetch('https://baas.alfabank.ru/api/pp/v1/operations?...', {
      //   headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
      // });
      // const alfaData = await alfaResp.json();

      // TODO ШАГ 3: нормализовать операции в формат Second Brain OS.
      const operations = [
        // { date:'2026-07-07', type:'expense', amount:1250, category:'Продукты', note:'Альфа · магазин' }
      ];

      return Response.json({ ok:true, from, to, operations }, { headers:cors });
    }

    return Response.json({ ok:false, error:'not found' }, { status:404, headers:cors });
  }
};
