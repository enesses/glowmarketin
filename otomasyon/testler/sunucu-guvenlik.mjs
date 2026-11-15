// sunucu ajanı testleri: hız sınırı, IP, gövde sınırı, hata yanıtları, başlıklar.
// Hız sınırı denemeleri sahte X-Forwarded-For IP'leriyle yapılır; böylece 127.0.0.1 kovası
// dolmaz ve sonraki testler etkilenmez.
export default async function (base, ok, bad) {
  const t = async (name, fn) => { try { const r = await fn(); r === true ? ok(name) : bad(`${name}: ${r}`); } catch (e) { bad(`${name}: ${e.message}`); } };
  const post = (body, headers = {}) => fetch(base + '/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });

  await t('[sunucu] hız sınırı 429 (IP başına)', async () => {
    const h = { 'X-Forwarded-For': '10.250.0.1' };
    let last;
    for (let i = 0; i < 22; i++) last = await post('{"agent":"yok"}', h);
    if (last.status !== 429) return `durum ${last.status}`;
    const other = await post('{"agent":"yok"}', { 'X-Forwarded-For': '10.250.0.2' });
    return other.status === 400 || `başka IP de engellendi (${other.status})`;
  });

  const H = { 'X-Forwarded-For': '10.250.1.1' };
  await t('[sunucu] büyük gövde 413', async () => {
    const r = await post(JSON.stringify({ agent: 'icerik', not: 'a'.repeat(70 * 1024) }), H);
    return r.status === 413 || `durum ${r.status}`;
  });
  await t('[sunucu] text/plain gövde 415 (CSRF)', async () => {
    const r = await fetch(base + '/api/agent', { method: 'POST', headers: { 'Content-Type': 'text/plain', ...H }, body: '{"agent":"icerik"}' });
    return r.status === 415 || `durum ${r.status}`;
  });
  await t('[sunucu] nesne olmayan JSON 400', async () => {
    const r = await post('null', H); const r2 = await post('[1]', H);
    return (r.status === 400 && r2.status === 400) || `durum ${r.status}/${r2.status}`;
  });
  await t('[sunucu] prototip ajan adı 400', async () => {
    for (const a of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      const r = await post(JSON.stringify({ agent: a }), H);
      if (r.status !== 400) return `${a} → ${r.status}`;
    }
    return true;
  });
  await t('[sunucu] bozuk URL kodlaması 400', async () => {
    const r = await fetch(base + '/%E0%A4%A'); const r2 = await fetch(base + '/api/video/%E0%A4%A'); const r3 = await fetch(base + '/index.html%00');
    return (r.status === 400 && r2.status === 400 && r3.status === 400) || `durum ${r.status}/${r2.status}/${r3.status}`;
  });
  await t('[sunucu] HTML güvenlik başlıkları', async () => {
    const r = await fetch(base + '/');
    return (r.headers.get('x-frame-options') === 'DENY' && r.headers.get('x-content-type-options') === 'nosniff') || 'başlık eksik';
  });
  await t('[sunucu] izinsiz kaynağa CORS başlığı yok', async () => {
    const r = await fetch(base + '/api/health', { headers: { Origin: 'https://kotu.example' } });
    return !r.headers.get('access-control-allow-origin') || 'izinsiz kaynağa izin verildi';
  });
  await t('[sunucu] /api/health sürüm ve çalışma süresi', async () => {
    const j = await (await fetch(base + '/api/health')).json();
    return (typeof j.surum === 'string' && Number.isFinite(j.calisma) && j.ai === false) || JSON.stringify(j);
  });
}
