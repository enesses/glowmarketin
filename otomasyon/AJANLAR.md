# Glow Marketing — Ajan Ekibi (15 Kasım 2026, 15:00–20:00 İstanbul)

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
