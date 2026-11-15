// meta-ads: arayüz bloğu statik denetimi — kart var, ACTIVE kampanya asla oluşturulmuyor.
import fs from 'node:fs';
import path from 'node:path';
export default async (base, ok, bad) => {
  const html = fs.readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../glow-marketing/public/index.html'), 'utf8');
  const a = html.indexOf('Meta Reklamları (Marketing API'), b = html.indexOf("case 'ma-boost'");
  if (a < 0 || b < a) return bad('meta-ads: arayüz bloğu bulunamadı');
  const blk = html.slice(a, b);
  ok('meta-ads: arayüz bloğu mevcut');
  /status\s*:\s*['"]ACTIVE['"]/.test(blk) ? bad('meta-ads: ACTIVE durumlu oluşturma bulundu') : ok('meta-ads: ACTIVE oluşturma yok');
  const posts = [...blk.matchAll(/maApi\(`\$\{act\}\/(campaigns|adsets|ads)`,\{method:'POST',params:\{([^]*?)\}\}\)/g)];
  posts.length === 3 && posts.every((m) => /status:'PAUSED'/.test(m[2])) ? ok('meta-ads: kampanya/set/reklam PAUSED') : bad(`meta-ads: PAUSED denetimi (${posts.length} POST)`);
  html.includes('${maCard()}') ? ok('meta-ads: Bağlantılar kartı bağlı') : bad('meta-ads: maCard() çağrılmıyor');
  const r = await fetch(base + '/'); (await r.text()).includes('maKart') ? ok('meta-ads: sayfa kartı sunuyor') : bad('meta-ads: sunulan sayfada kart yok');
};
