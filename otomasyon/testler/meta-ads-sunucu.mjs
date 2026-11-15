// meta-ads: sunucu uçları (anahtarsız çalışır)
export default async (base, ok, bad) => {
  const t = async (name, fn) => { try { const r = await fn(); r === true ? ok(name) : bad(`${name}: ${r}`); } catch (e) { bad(`${name}: ${e.message}`); } };
  await t('meta-ads: GET /api/meta-ads/status', async () => {
    const r = await fetch(base + '/api/meta-ads/status'); const j = await r.json();
    return (r.ok && typeof j.exchange === 'boolean' && /^v\d{2}\.0$/.test(j.graphVersion)) || `durum ${r.status} ${JSON.stringify(j)}`;
  });
  await t('meta-ads: anahtarsız exchange 503', async () => {
    const r = await fetch(base + '/api/meta-ads/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"token":"x"}' });
    return [503, 400].includes(r.status) || `durum ${r.status}`; // .env'de META_* varsa 400
  });
  await t('meta-ads: exchange GET 405', async () => { const r = await fetch(base + '/api/meta-ads/exchange'); return r.status === 405 || `durum ${r.status}`; });
};
