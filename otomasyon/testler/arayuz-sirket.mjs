// arayuz: yasal metinlerdeki her şirket yer tutucusu CONFIG.sirket'ten yönetilebilmeli; kaydedilmemiş değişiklik uyarısı yerinde olmalı.
export default async (base, ok, bad) => {
  const html = await (await fetch(base + '/')).text();
  const yerler = [...new Set([...html.matchAll(/<mark class="ph">(\[[^<]+\])<\/mark>/g)].map((m) => m[1]))];
  const m = html.match(/const SIRKET_YER=(\{[^;]+\});/);
  if (!m) return bad('arayuz: SIRKET_YER bulunamadı');
  let map; try { map = JSON.parse(m[1].replace(/'/g, '"')); } catch (e) { return bad('arayuz: SIRKET_YER okunamadı'); }
  const eksik = yerler.filter((y) => !map[y]);
  const anahtarsiz = Object.values(map).filter((k) => !new RegExp(`\\n\\s+${k}:''`).test(html));
  if (eksik.length) bad('arayuz: CONFIG.sirket ile eşlenmeyen yer tutucu: ' + eksik.join(', '));
  else if (anahtarsiz.length) bad('arayuz: CONFIG.sirket içinde eksik alan: ' + anahtarsiz.join(', '));
  else ok(`arayuz: ${yerler.length} yasal yer tutucu CONFIG.sirket'ten yönetiliyor`);
  const guard = /function isletmeDegisti\(/.test(html) && /addEventListener\('beforeunload'/.test(html) && /function go\(id,zorla\)/.test(html);
  guard ? ok('arayuz: kaydedilmemiş değişiklik uyarısı tanımlı') : bad('arayuz: kaydedilmemiş değişiklik uyarısı eksik');
};
