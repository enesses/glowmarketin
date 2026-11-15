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
}
