// meta-ads (16 Kas): şehir hedefleme, öne çıkarma uygunluk ön kontrolü, içerik modalı kısayolu, gizlilik metni — statik denetim.
import fs from 'node:fs';
import path from 'node:path';
export default async (base, ok, bad) => {
  const html = fs.readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../glow-marketing/public/index.html'), 'utf8');
  const chk = (c, m) => (c ? ok('meta-ads: ' + m) : bad('meta-ads: ' + m));
  chk(/type:'adgeolocation',location_types:'\["city"\]'/.test(html) && html.includes("country_code:'TR'"), 'adgeolocation şehir araması (TR)');
  chk(html.includes("{countries:['TR']}") && html.includes("geo_locations:geo"), 'varsayılan Türkiye geneli, şehir seçilirse cities');
  chk(/MA_YARICAP=\{min:17,max:80/.test(html) && html.includes("distance_unit:'kilometer'"), 'yarıçap 17–80 km');
  chk(html.includes("fields:'is_eligible_for_promotion,promotable_id'") && html.includes("fields:'boost_eligibility_info'") && html.includes('eligible_to_boost===false'), 'FB/IG uygunluk ön kontrolü');
  chk(html.includes("if(uy.durum==='degil') return toast(uy.neden,true);"), 'uygun değilse taslak oluşturulmuyor');
  chk(html.includes('maIcerikKisayol(c,pf);') && html.includes("case 'ma-kisayol'"), 'içerik modalı "Reklam taslağı" kısayolu');
  chk(html.includes('id="gizlilik-meta-reklam"') && /Meta Reklamları bağlıysa/.test(html), 'gizlilik 5. ve 6. bölüm reklam verisi');
  const a = html.indexOf('Meta Reklamları (Marketing API'), b = html.indexOf('/* ---------- Bağlantılar sayfası');
  chk(a > 0 && b > a && !/ACTIVE['"]\s*[,}]/.test(html.slice(a, b).replace(/ACTIVE:'Yayında'/, '')), 'blokta ACTIVE değer gönderimi yok');
};
