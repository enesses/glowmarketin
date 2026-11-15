// arayuz: index.html içindeki sanitize() bozuk localStorage verisini güvenli biçime çevirmeli.
import vm from 'node:vm';
export default async (base, ok, bad) => {
  const html = await (await fetch(base + '/')).text();
  const grab = (name) => {
    const i = html.indexOf(`function ${name}(`); if (i < 0) return null;
    let d = 0, j = html.indexOf('{', i);
    for (let k = j; k < html.length; k++) { if (html[k] === '{') d++; else if (html[k] === '}' && --d === 0) return html.slice(i, k + 1); }
    return null;
  };
  const src = [grab('defaults'), grab('sanitize')];
  if (src.includes(null)) return bad('arayuz: defaults/sanitize bulunamadı');
  const ctx = vm.createContext({});
  vm.runInContext(src.join('\n') + ';this.sanitize=sanitize;', ctx);
  const cases = ['x', [], null, 5, { icerikler: 'a', yorumlar: {}, kredi: '5', isletme: { isletmeAdi: 'A' } },
    { isletme: { isletmeAdi: 5, sss: 'x' }, videolar: null, paket: 'Yok', yorumlar: [{ yildiz: 'abc' }, 3] }];
  let hata = '';
  for (const c of cases) {
    const o = ctx.sanitize(JSON.parse(JSON.stringify(c)));
    for (const k of ['icerikler', 'yorumlar', 'sosyal', 'videolar', 'sss']) if (!Array.isArray(o[k])) hata ||= `${k} dizi değil (${JSON.stringify(c)})`;
    if (typeof o.kredi !== 'number' || !Number.isFinite(o.kredi)) hata ||= 'kredi sayı değil';
    if (!['Go', 'Plus', 'Max'].includes(o.paket)) hata ||= 'paket geçersiz';
    if (o.isletme && (!Array.isArray(o.isletme.sss) || typeof o.isletme.isletmeAdi !== 'string')) hata ||= 'isletme bozuk';
    o.yorumlar.forEach((y) => { if (!(y.yildiz >= 1 && y.yildiz <= 5)) hata ||= 'yildiz aralık dışı'; });
  }
  const iyi = ctx.sanitize({ isletme: { isletmeAdi: 'Kafe', sektor: 'restoran' }, sss: [{ soru: 'a', cevap: 'b' }], kredi: 42, paket: 'Max' });
  if (iyi.kredi !== 42 || iyi.paket !== 'Max' || iyi.isletme.sss.length !== 1) hata ||= 'geçerli veri bozuldu';
  hata ? bad('arayuz: depolama onarımı: ' + hata) : ok('arayuz: bozuk localStorage verisi onarılıyor');
};
