# Durum — meta-ads

## 16 Kasım (2. gün)
Son güncelleme: 16 Kas 2026, 1. dalga (~08:00).

### Yapılanlar
- [x] **Şehir/ilçe hedefleme**: "Gönderiyi öne çıkar" formuna Konum alanı. Targeting Search `GET /search?type=adgeolocation&location_types=["city"]&country_code=TR&limit=10` (reklam anahtarıyla); sonuçtan şehir ekle/çıkar (en çok 25), ortak **çevre yarıçapı 17–80 km** (varsayılan 25). Şehir yoksa varsayılan **Türkiye geneli** (`countries:['TR']`); varsa `geo_locations.cities=[{key,radius,distance_unit:'kilometer'}]`. Onay penceresi ve özet satırı hedefi gösteriyor. Form değerleri yeniden çizimde korunuyor (`maFormOku`).
- [x] **Uygunluk ön kontrolü** (sayfa anahtarıyla, gönderi seçilince otomatik + oluşturmadan hemen önce): FB `GET {sayfa_gönderi}?fields=is_eligible_for_promotion,promotable_id`; IG `GET {ig_media}?fields=boost_eligibility_info` → `eligible_to_boost`. Uygun değilse neden gösterilir ve buton devre dışı; denetim hata verirse uyarı + "Tekrar denetle", taslak denenebilir.
- [x] **İçerik modalı "Reklam taslağı" kısayolu**: FB/IG'de yayınlanmış içerikte görünür → modal kapanır, Bağlantılar'a gidip Meta Reklamları kartında o gönderiyi seçer (reduced-motion'a uyar). Bağlı değilse uyarı verir. Paylaşılan koda tek satır: `updateIcerikGoogleUI` içinde `maIcerikKisayol(c,pf)`.
- [x] **Gizlilik Politikası**: 5. bölüme "Meta reklam verileri" maddesi (`#gizlilik-meta-reklam`: ads_read/ads_management/business_management, hesap/kampanya/istatistik, yalnızca tarayıcıda, sunucuda saklanmaz, sunucu yalnızca belirteci kaydetmeden uzatır); 6. bölümdeki Meta satırına reklam verisi cümlesi.
- [x] Test: `otomasyon/testler/meta-ads-hedefleme.mjs`. Playwright (390 px, sahte Graph yanıtlarıyla) uçtan uca: kısayol → doğru gönderi seçili; IG uygun değil → neden + buton kapalı; FB uygun; Kadıköy + 30 km → adset `cities` ile, kampanya/set/reklam **PAUSED**; JS hatası yok.

### Kalanlar
- [ ] Gerçek hesapla canlı deneme (anahtar yok): özellikle `boost_eligibility_info` yanıt yapısı ve şehir+yarıçap reklam seti.
- [ ] İsteğe bağlı: `subcity`/bölge (il) hedefleme; şimdilik yalnızca `type=city`.

### Kararlar
- Resmi belge (Basic Targeting): şehir yarıçapı 10–50 mil / **17–80 km**; birim olarak km seçildi. Targeting Search `location_types` seçenekleri arasında `subcity` yok; Türkiye ilçeleri Meta'da çoğunlukla `city` olarak geçtiği için yalnızca `type==='city'` sonuçları gösteriliyor.
- `boost_eligibility_info` alt alanları resmi sayfada ayrıntılı değil ("uygun değilse ek ayrıntılar içerir"); `eligible_to_boost` (RestFB `IgBoostEligibilityInfo`) kullanıldı, diğer alt alanlar neden olarak olduğu gibi gösteriliyor. FB'de `is_eligible_for_promotion=false` ama farklı `promotable_id` varsa kreatifte o kimlik kullanılıyor (belgede "doğrudan öne çıkarılamayan gönderiler için" tanımı).
- Ön kontrol **sayfa anahtarıyla** yapılıyor (reklam anahtarında sayfa okuma izni yok). Denetim hata verirse engellemiyoruz; Meta zaten uygun olmayanı reddeder.
- Gizlilik metni arayüz ajanının alanında olsa da bugünkü tablo bu görevi meta-ads'e verdi; yalnızca 5. bölüme yeni `<li>` ve 6. bölümdeki Meta hücresine cümle eklendi (yer tutuculara dokunulmadı).
- Asla ACTIVE yok: yeni kod da yalnızca PAUSED oluşturuyor; test denetliyor.
- Birleştirme denemesi (07:40): `main` + `ajan/sunucu` + `ajan/arayuz` + `ajan/x` + `ajan/meta-ads` geçici çalışma ağacında çakışmasız birleşti, smoke-test geçti. Bugünkü 4 görev tamamlandı; dalga erken bitirildi.

### Kullanıcının yapması gerekenler
1. (15 Kasım listesi geçerli) Marketing API ürünü, `ads_read/ads_management/business_management` Advanced Access, `.env` `META_APP_ID`/`META_APP_SECRET`.
2. Uygunluk ön kontrolü sayfa bağlantısının izinleriyle çalışır (`pages_read_engagement`, `instagram_basic`); bunlar mevcut sayfa bağlantısında zaten isteniyor.
3. Şehir hedefli bir taslağı Ads Manager'da açıp hedef kitle tahminini kontrol et, sonra **kendin** yayına al.

---
# 15 Kasım (1. gün) kaydı

Son güncelleme: 15 Kas 2026, 1. dalga.

## Yapılanlar
- [x] **Sunucu** (`server.js`, yalnızca Meta Ads blokları): `GET /api/meta-ads/status` (`{exchange, graphVersion}`), `POST /api/meta-ads/exchange` — kısa ömürlü kullanıcı anahtarını `fb_exchange_token` ile ~60 günlük anahtara çevirir. `META_APP_ID`/`META_APP_SECRET` yoksa 503; gizli anahtar tarayıcıya hiç gitmez. Hız sınırı + 4 KB gövde sınırı.
- [x] **`.env.example`**: `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_VERSION` (boş/varsayılan).
- [x] **Arayüz** (`public/index.html`, "Meta Reklamları (Marketing API · ajan/meta-ads)" bloğu + `renderBaglantilar` içinde tek satır `${maCard()}`):
  - Bağlantılar'da "Meta Reklamları" kartı: ayrı OAuth açılır penceresi (scope `ads_read,ads_management,business_management`, `state` doğrulaması, mevcut `glow-meta-auth` dönüş betiği yeniden kullanılıyor), sunucu varsa anahtar uzatma, `/me/adaccounts` ile hesap seçimi, bağlantıyı kes, süresi dolunca "Yeniden bağlan".
  - Seçilen hesabın **Son 7 / 30 gün** özeti: harcama, gösterim, tıklama, CTR, CPC (`act_x/insights`).
  - Kampanya listesi (ad, durum, bütçe, dönem harcaması/tıklaması — `insights.date_preset(...)` alan genişletmesi).
  - **Gönderiyi öne çıkar (taslak)**: Glow'dan Facebook/Instagram'da yayınlanmış gönderiyi seç → günlük bütçe, gün, yaş → onay kutulu teyit → kampanya (`OUTCOME_ENGAGEMENT`) + reklam seti (`POST_ENGAGEMENT`, `ON_POST`, TR) + kreatif (FB: `object_story_id`; IG: `object_id`+`instagram_user_id`+`source_instagram_media_id`) + reklam — **üçü de `status: PAUSED`**. Ads Manager bağlantısı gösterilir.
  - Kartta yönetici kurulum adımları (Marketing API ürünü, App Review, .env).
- [x] **Testler**: `otomasyon/testler/meta-ads-sunucu.mjs` (uçlar), `otomasyon/testler/meta-ads-arayuz.mjs` (kart var, ACTIVE yok, 3 POST'un hepsi PAUSED). Playwright ile sahte Graph yanıtlarıyla uçtan uca denendi (390 px mobil, JS hatası yok).

## Kalanlar
- [ ] Gerçek bir Meta uygulaması/reklam hesabıyla canlı deneme (bu ortamda anahtar yok). Özellikle reklam seti parametreleri (`destination_type: ON_POST`, `advantage_audience: 0`) ve IG kreatifi canlı doğrulanmalı.
- [ ] İsteğe bağlı: şehir/ilçe hedefleme (şu an yalnızca Türkiye geneli), `boost_eligibility_info` / `is_instagram_eligible` ön kontrolü.
- [ ] İsteğe bağlı: içerik modalına "Reklam taslağı" kısayolu (arayuz ajanıyla çakışmamak için eklenmedi).
- [ ] Gizlilik politikasına Meta reklam verisi (ads_read) kullanımı cümlesi — gizlilik metni arayüz ajanının alanında; birleştirici/arayüz eklemeli.

## Kararlar
- **Graph sürümü**: uygulamadaki mevcut `v25.0` (`CONFIG.graphVersion`) korundu. Resmi belgelere göre v26.0 (29 Tem 2026) ve v27.0 (4 Kas 2026) yayımlandı; v25 hâlâ destekli. v26'nın kırıcı değişiklikleri (Explore yerleşimi, Messenger Stories, anket kreatifleri) bu akışı etkilemiyor. Sunucuda `META_GRAPH_VERSION` ile değiştirilebilir.
- **Reklam çağrıları tarayıcıdan**, kullanıcının kendi anahtarıyla (mevcut sayfa bağlantısıyla aynı desen); sunucu yalnızca anahtar uzatır, hiçbir zaman kampanya oluşturmaz.
- **Asla ACTIVE yok**: kod durum değiştirme/yayına alma içermiyor; test bunu denetliyor.
- **Hedefleme**: Türkiye, kullanıcı yaş aralığı, Advantage+ kitle kapalı (`advantage_audience: 0`) — yaş sınırını korumak için.
- **Bütçe**: hesabın para birimine göre alt birim (kuruş); kuruşsuz para birimleri (JPY, KRW vb.) için çarpan 1.
- `is_adset_budget_sharing_enabled=false` gönderiliyor (kampanya bütçesi yok, bütçe reklam setinde).
- Reklam metni üretilmiyor (mevcut gönderi kullanılıyor), bu yüzden `meta-reklam-uzmani` skill'i yüklenmedi; arayüzde politika uyarısı var.
- Ekleme noktaları (server.js yönlendirme, `.env.example`, Bağlantılar kartı) diğer ajan dallarıyla (`arayuz`, `sunucu`, `x`) `git merge-tree` ile çakışmasız olacak şekilde seçildi (15:15 itibarıyla). Kart, Google kartının hemen altında.
- Çerez bandı test sırasında tıklamayı engelliyordu — arayüz ajanının alanı, dokunulmadı.

## Kullanıcının yapması gerekenler
1. Meta for Developers'ta mevcut uygulamaya **Marketing API** ürününü ekle.
2. App Review'da `ads_read`, `ads_management`, `business_management` için **Advanced Access** iste (Marketing API Access Tier). Onaya kadar yalnızca uygulamada rolü olan hesaplar bağlanabilir.
3. Sunucu `.env`: `META_APP_ID=` ve `META_APP_SECRET=` (Uygulama ayarları → Temel). Yazılmazsa bağlantı 1-2 saatte düşer, yeniden bağlanmak gerekir.
4. Business Manager'da reklam hesabında en az "Reklamveren" yetkisi ve sayfada reklam verme yetkisi olsun. Kreatif oluşturmada izin hatası alınırsa scope'a `pages_manage_ads` eklemek gerekebilir.
5. Taslak kampanyaları Ads Manager'da inceleyip **kendin** yayına al.
