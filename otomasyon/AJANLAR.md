# Glow Marketing — Ajan Ekibi

Kullanıcı tam yetki verdi ve **hiç soru sorulmamasını** istedi. Her ajan kendi kararını verir,
belirsiz noktada en makul yolu seçer ve bunu durum dosyasına yazar.

## Kod
- Uygulama: `glow-marketing/` (Node 18+, bağımlılıksız `server.js` + tek dosya `public/index.html`).
- Test: `node otomasyon/smoke-test.mjs` (çıkış 0 olmalı). Yeni özellik için `otomasyon/testler/<ajan>-*.mjs`
  ekle (default export `async (base, ok, bad) => {}`; sunucu anahtarsız çalışır).
- Bağımlılık ekleme (npm paketi yok). Gizli anahtarlar yalnızca `.env`; `.env.example`'a boş satır ekle.
- `glow-marketing-sunucu.zip` eski yüklemedir, dokunma.

## Ajanlar — her biri AYRI dal, AYRI oturum; biri durursa diğerleri etkilenmez
| Ajan | Dal | Kapsam (yalnızca burası) |
|---|---|---|
| sunucu | `ajan/sunucu` | `server.js` hataları, güvenlik (CORS, hız sınırı, IP, body limit, hata mesajları), `/api/health`, `.env.example`. X/Meta Ads uçlarına dokunma. |
| arayuz | `ajan/arayuz` | `public/index.html` hataları: JS hataları, kırık akışlar, mobil görünüm, erişilebilirlik, localStorage sağlamlığı, Türkçe metin hataları. Bağlantılar sayfasına X/Meta Ads ekleme (onlar diğer ajanların). |
| x | `ajan/x` | **X (Twitter) bağlantısı**: OAuth 2.0 PKCE (scope: `tweet.read tweet.write users.read offline.access`). Token değişimi ve yenileme sunucuda (`/api/x/token`, `/api/x/refresh`; X token ucu CORS'a izin vermez), gönderi `/api/x/post` → `POST https://api.x.com/2/tweets`. `.env`: `X_CLIENT_ID`, `X_CLIENT_SECRET` (confidential client ise). Arayüz: Bağlantılar'da X kartı (bağlan / kes / durum), içerik modalında platform "x" ise "X'te paylaş". 280 karakter denetimi. |
| meta-ads | `ajan/meta-ads` | **Meta Ads bağlantısı** (Marketing API, mevcut Meta sayfa bağlantısından ayrı izin): scope `ads_read,ads_management,business_management`; reklam hesaplarını listele (`/me/adaccounts`), seçilen hesabın son 7/30 gün `insights` özetini göster (harcama, gösterim, tıklama, CTR, CPC), kampanya listesi, bir gönderiyi **DURAKLATILMIŞ (PAUSED)** taslak kampanya olarak öne çıkarma. Asla ACTIVE kampanya oluşturma, asla bütçe harcatma — kullanıcı Ads Manager'da kendisi açar. Arayüz: Bağlantılar'da "Meta Reklamları" kartı + küçük panel. Reklam metni üretirken `meta-reklam-uzmani` ilkeleri: Meta reklam politikasına uygunluk önce. |

## Her oturumun akışı
1. Klonla, kendi dalına geç (yoksa `main`'den oluştur; varsa `git pull` ile devam et).
2. `otomasyon/durum/<ajan>.md` dosyasını oku — önceki dalga nerede kaldıysa oradan devam et.
3. Küçük adımlarla çalış: **her anlamlı düzeltmeden sonra** test → commit → push. Böylece limit
   ya da kesinti olursa iş kaybolmaz ve sonraki dalga devam eder.
4. Durum dosyasını güncel tut: yapılanlar, kalanlar, verilen kararlar, bilinen riskler.
5. Saat 19:50 (İstanbul) sonrası yeni iş başlatma; son commit + push yap, bitir.
6. `main`'e doğrudan itme. Birleştirmeyi saat 19:35'teki **birleştirici** oturum yapar.

## Limitler
- 5 saatlik limit dolarsa oturum durur; **bekçi** oturumları (Fable ile) durumu görür, aynı ajan için
  ~40 dk sonra yeni bir deneme kurar (bekle → devam).
- Aynı ajan ikinci kez limite takılırsa (haftalık limit ihtimali) bekçi o ajanın kalan oturumlarını
  `claude-fable-5-2` modeline çevirir.


---

# 16 Kasım 2026 — 2. gün (07:30–10:30 İstanbul) — BU BÖLÜM GEÇERLİ

Saatler (yukarıdakilerin yerine): **10:15'ten sonra yeni iş başlatma**, son commit + push yap ve bitir.
Birleştirici 10:20'de çalışır. Dallar main'in güncel hâlinden yeniden açıldı.

| Ajan | Dal | Bugünkü görevler |
|---|---|---|
| x | `ajan/x` | 1) **Görselli X gönderisi**: `media.write` scope'u, X media upload (güncel resmi belge: v2 `POST /2/media/upload` — doğrula), içerik görseli (sunucudaki `/media/<id>.jpg`) ile gönderi; yalnızca metin akışı bozulmasın. Scope değişince eski bağlantılar "yeniden bağlan" uyarısı alsın. 2) "Verileri sıfırla" (`resetAll`) `localStorage.glowX`'i de temizlesin. 3) Mobil (capacitor://) için en azından anlaşılır uyarı: "X bağlantısı web sürümünden yapılmalı". |
| meta-ads | `ajan/meta-ads` | 1) **Şehir/ilçe hedefleme**: Targeting Search (`/search?type=adgeolocation`) ile şehir seçimi + yarıçap; varsayılan Türkiye geneli kalsın. 2) Öne çıkarmadan önce uygunluk ön kontrolü (FB `is_eligible_for_promotion` / IG `boost_eligibility_info` — doğrula); uygun değilse nedenini göster. 3) İçerik modalında yayınlanmış gönderi için **"Reklam taslağı"** kısayolu. 4) Gizlilik Politikası 5. bölüme (Instagram ve Facebook verileri) ve 6. bölüme Meta reklam verisi (ads_read/ads_management: hesap, kampanya, istatistik; yalnızca kullanıcının tarayıcısında, sunucuda saklanmaz) cümlesi. Asla ACTIVE yok. |
| arayuz | `ajan/arayuz` | 1) İşletme bilgileri formunda **kaydedilmemiş değişiklik uyarısı** (sayfa değiştirirken + `beforeunload`). 2) `go()` içindeki `scrollTo` `prefers-reduced-motion`'a uysun. 3) "Üretilen taslak" sayacı: adı/hesabı tutarlı olsun. 4) Yasal metinlerdeki yer tutucuları (`[ŞİRKET UNVANI]` vb.) tek yerden yönetilebilir yap: `CONFIG.sirket = {unvan, adres, mersis, vergi, kvkkEposta, kep, ...}`; doluysa metne yazılsın, boşsa yer tutucu görünsün ve Paket/Ayarlar'da yöneticiye "yasal bilgiler eksik" notu çıksın. Değerleri UYDURMA. |
| sunucu | `ajan/sunucu` | 1) Bilinmeyen `/api/*` her yöntemde **JSON 404**. 2) Video indirmesini belleğe almadan **akışla diske** yaz (256 MB sınırı ve atomik `.tmp`→rename korunsun). 3) `/api/health`'e `x` ve `metaAds` (yapılandırıldı mı) bayrakları. 4) Tüm uçları gözden geçir: X ve Meta Ads uçları dahil hata mesajları Türkçe ve tutarlı, gizli anahtar hiçbir yanıtta/logda yok. |

Gerçek hesap/anahtar gerektiren işler (X Developer Portal, Meta App Review, .env değerleri) ajanların kapsamı dışında — kullanıcı yapacak; durum dosyasında "Kullanıcının yapması gerekenler" altında güncel tut.

---

## Video skill'leri (16 Kasım 2026'da eklendi)
Claude ile video üretimi/kurgusu için 53 skill `.claude/skills/` altında. Hangisinin ne işe yaradığı,
lisansları ve Glow için önerilen kullanım: `otomasyon/VIDEO-REPOLARI.md`. Motor HyperFrames;
onetake ve lemo-opuscar ticari olmayan lisanslı olduğu için eklenmedi.
