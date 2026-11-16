// [sunucu] 16 Kasım: bilinmeyen /api/* JSON 404, /api/health bayrakları, yöntem denetimi
export default async function (base, ok, bad) {
  const t = async (name, fn) => { try { const r = await fn(); r === true ? ok(name) : bad(`${name}: ${r}`); } catch (e) { bad(`${name}: ${e.message}`); } };
  const H = { 'X-Forwarded-For': '10.77.0.1' };
  const json404 = async (method, p) => {
    const r = await fetch(base + p, { method, headers: { ...H, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) }, ...(method === 'POST' ? { body: '{}' } : {}) });
    const ct = r.headers.get('content-type') || '';
    if (r.status !== 404) return `${method} ${p} durum ${r.status}`;
    if (!ct.includes('application/json')) return `${method} ${p} içerik türü ${ct}`;
    if (method !== 'HEAD') { const j = await r.json(); if (typeof j.error !== 'string') return `${method} ${p} error alanı yok`; }
    return true;
  };
  for (const [m, p] of [['GET', '/api/yok'], ['POST', '/api/yok'], ['PUT', '/api/yok'], ['DELETE', '/api/video'], ['GET', '/api'], ['HEAD', '/api/yok'], ['GET', '/api/x/yok']]) {
    await t(`[sunucu] ${m} ${p} → JSON 404`, () => json404(m, p));
  }
  await t('[sunucu] /api/health x ve metaAds bayrakları', async () => {
    const j = await (await fetch(base + '/api/health', { headers: H })).json();
    if (typeof j.x !== 'boolean' || typeof j.metaAds !== 'boolean') return 'bayrak yok: ' + JSON.stringify(j);
    const s = JSON.stringify(j);
    return !/secret|client_id|sk-/i.test(s) || 'health yanıtında anahtar benzeri alan var';
  });
  await t('[sunucu] POST /api/health → 405', async () => { const r = await fetch(base + '/api/health', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: '{}' }); return r.status === 405 || `durum ${r.status}`; });
  await t('[sunucu] HEAD / → 200', async () => { const r = await fetch(base + '/', { method: 'HEAD', headers: H }); return r.status === 200 || `durum ${r.status}`; });
  await t('[sunucu] statik PUT → 405', async () => { const r = await fetch(base + '/index.html', { method: 'PUT', headers: H }); return r.status === 405 || `durum ${r.status}`; });
}
