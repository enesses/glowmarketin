# Durum — x

## 16 Kasım (2. gün)
Son güncelleme: 16 Kasım 2026, ~07:40 (İstanbul) · dal `ajan/x` · 3 görevin üçü de tamamlandı, testler geçiyor.

### Yapılanlar
1. **Görselli X gönderisi**
   - Belge doğrulandı (docs.x.com, 16 Kasım): `POST https://api.x.com/2/media/upload` tek istek; JSON gövde `{media: <base64>, media_category: "tweet_image"}` (multipart da olur), scope **`media.write`**, yanıt `data.id`; `tweet_image` JPG/PNG/GIF/WEBP, en fazla 5 MB. Gönderi: `POST /2/tweets` `{text, media:{media_ids:[id]}}` (en fazla 4 foto). Eski `command=INIT/APPEND/FINALIZE` biçimi artık kullanılmıyor; video için ayrı `/2/media/upload/initialize|append|finalize` var (kapsam dışı).
   - `x-api.js`: `SCOPES`'a `media.write` eklendi. `/api/x/post` isteğe bağlı `media` alır: yalnızca bu sunucunun `/media/<32 hex>.jpg` dosyası (adres ya da ad) kabul edilir, dosya diskten (`UPLOADS_DIR` / `uploads`) okunur — dış adres indirilmez (SSRF yok). 5 MB denetimi, yükleme hataları Türkçe (403 → "yeniden bağlan, görsel izni gerekiyor"). Metinsiz, yalnızca görselli gönderiye de izin var. Yanıtta `media: true/false`. `server.js`'e dokunulmadı.
   - `public/x.js`: `publish(text, {media})`; bağlantının `scope`'unda `media.write` yoksa görselli paylaşım sunucuya gitmeden "yeniden bağlan" hatası verir. **Eski bağlantılar**: kartta "Görselli gönderi için yeni bir izin gerekiyor. X’e yeniden bağlan; metin paylaşımı çalışmaya devam eder." + "Yeniden bağlan" düğmesi, durum rozeti "Yeniden bağlan". Yeniden bağlanınca eski refresh token sessizce iptal edilir. Yeni yardımcılar: `scopeOld()`, `canMedia()`, `native()`, `nativeMsg`, `reset()`.
   - `index.html`: X platformunda görsel alanı görünür (isteğe bağlı); modal notu görsel/izin/video durumuna göre değişir; "X’te paylaş" görseli gönderir; izin eskiyse "Görselsiz, yalnızca metin paylaşılsın mı?" onayı; video ekliyse X’e yalnızca metin gider (uyarılı). Yalnızca metin akışı aynen çalışıyor.
2. **resetAll**: "Verileri sıfırla" artık `GX.reset()` çağırıyor → `localStorage.glowX` silinir, bellekteki bağlantı sıfırlanır, X’teki izin sessizce iptal edilir.
3. **Mobil (capacitor://)**: `window.Capacitor.isNativePlatform()` ya da `capacitor:`/`ionic:` protokolünde X kartı bağlan düğmesi yerine "X bağlantısı web sürümünden yapılmalı. Mobil uygulamada X girişi henüz desteklenmiyor; X’te paylaşmak için Glow’u tarayıcıda aç." gösterir; `connect()` de aynı mesajla durur; modal notu da bunu söyler.
- **Testler**: `x-baglanti.mjs` (sahte X: görselli gönderi, metinsiz görsel, metin akışında `media` yok, dış adres 400, olmayan dosya 400, izinsiz 403 + "yeniden bağlan"); yeni `x-arayuz.mjs` (x.js vm içinde: eski izin, canMedia, engelleme, reset, Capacitor, resetAll→GX.reset). Hepsi geçiyor.
- Playwright ile uçtan uca denendi (sahte X): eski izinli hesapta modal notu + "yalnızca metin" onayı; yeni izinli hesapta "görseliyle birlikte" onayı → `/2/media/upload` (base64 JPEG) → `/2/tweets` `media_ids:["555"]` → "X’te paylaşıldı" + `yayinlar.x` kaydı; sayfa hatası yok.

### Kalanlar
- X’e video gönderimi (chunked `/2/media/upload/initialize` → `append` → `finalize` → `GET` durum). Bugün kapsam dışı; şu an video ekliyse yalnızca metin gider.
- Mobil uygulamada gerçek X girişi (sistem tarayıcısı + deep link + uygulamaya özel redirect). Şimdilik yalnızca uyarı. Not: Capacitor uygulamasının localStorage’ı web’den ayrı olduğu için web’de bağlanmak uygulamaya taşınmaz.
- Görsel için alt metin (`/2/media/metadata`) eklenebilir.

### Kararlar
- Tek istekli `POST /2/media/upload` (JSON + base64) seçildi: içerik görselleri en fazla 1440 px JPEG, 5 MB altında; chunked akışa gerek yok.
- Görsel sunucu diskinden okunur, URL indirilmez (güvenlik + PUBLIC_URL’in internetten erişilebilir olması gerekmez).
- Eski izinli bağlantı zorla koparılmadı: metin paylaşımı çalışmaya devam eder, yalnızca görselli paylaşımda ve kartta "yeniden bağlan" istenir.
- `resetAll`’da X izni de iptal ediliyor (best-effort), çünkü "tüm veriler silinsin" diyen kullanıcı bağlantının da kalkmasını bekler.
- index.html’de yalnızca X’e ait satırlar ve `resetAll`’a tek satır eklendi (arayuz ajanı ile çakışmayı azaltmak için).

### Kullanıcının yapması gerekenler
1. X Developer Portal’da uygulama izni **Read and write** olmalı (görsel yükleme `media.write` scope’u ile istenir; portalda ayrıca bir ayar gerekmez, ama izin "Read" ise yükleme 403 verir).
2. Daha önce X’e bağlanmış hesaplar Bağlantılar → X → **Yeniden bağlan** demeli (yeni görsel izni). Metin paylaşımı bu arada çalışır.
3. Görsel yüklemek için sunucuda `PUBLIC_URL` tanımlı olmalı (mevcut `/api/media` şartı).
4. 15 Kasım listesindeki adımlar (aşağıda) geçerli: `X_CLIENT_ID`/`X_CLIENT_SECRET`, callback adresi, ücretli/kredili API erişimi (görselli gönderi de "Content: Create" olarak ücretlendirilir).

---
# 15 Kasım (1. gün) kaydı

Son güncelleme: 15 Kasım 2026, ~15:15 (İstanbul) · dal `ajan/x` · 1. dalga tamamlandı.

## Yapılanlar
- **Sunucu (`glow-marketing/x-api.js`, yeni modül)** — server.js'e yalnızca 5 satırlık `/api/x/*` kancası eklendi (çakışmayı azaltmak için).
  - `GET /api/x/config` → `{enabled, clientId, scopes, maxLength}` (secret asla dönmez).
  - `POST /api/x/token` → `{code, code_verifier, redirect_uri}` ile `https://api.x.com/2/oauth2/token` (grant_type=authorization_code), ardından `GET /2/users/me`; `{access_token, refresh_token, expires_in, user}` döner.
  - `POST /api/x/refresh` → grant_type=refresh_token (X refresh token'ı döndürür; yeni refresh token istemcide saklanır).
  - `POST /api/x/revoke` → `/2/oauth2/revoke` (Bağlantıyı kes).
  - `POST /api/x/post` → `POST https://api.x.com/2/tweets` `{text}` (+ isteğe bağlı `reply_to`). 280 ağırlıklı karakter denetimi sunucuda da var.
  - Confidential client (`X_CLIENT_SECRET` varsa) → `Authorization: Basic`; yoksa public client → gövdede `client_id`.
  - Hata eşlemesi: 401 süresi doldu, 403 izin/paket, "duplicate" → 409, 429 sınır; 15 sn zaman aşımı; IP hız sınırı (`limited`).
  - redirect_uri yalnızca `.../x-callback.html` ve PUBLIC_URL / ALLOWED_ORIGINS / aynı Host / localhost kökeninde (ya da `X_REDIRECT_URIS` listesi).
- **Arayüz**
  - `public/x.js` (yeni): PKCE (S256, crypto.subtle; yoksa plain), açılır pencere, state doğrulama, token yenileme (süre bitmeden 60 sn önce + 401'de bir kez yeniden dene), Bağlantılar'daki X kartı (bağlan / kes / durum / yönetici kurulum adımları), ağırlıklı sayaç.
  - `public/x-callback.html` (yeni): X dönüşünde `code`+`state`'i aynı kökenli ana pencereye postMessage ile iletir ve kapanır.
  - `index.html` (küçük dokunuşlar): `<script src="x.js">`, `GlowX.init(...)`, Bağlantılar'da Meta kartının altına `GX.card()`, içerik modalında platform "x" için **"X’te paylaş"** düğmesi + not satırı + 280 sayacı (ağırlıklı), `xYayinlaModal()` (onay, yer tutucu denetimi, `c.yayinlar.x = {id, tarih, url}` kaydı). Gizlilik politikasındaki üçüncü taraflar tablolarına (2 yer) X Corp. satırı.
- `.env.example`: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URIS` (boş).
- **Testler** `otomasyon/testler/x-baglanti.mjs`: anahtarsız uçlar, sayaç (URL 23, emoji 2, CJK 2), redirect denetimi, x.js/x-callback sözdizimi, **sahte X sunucusuyla** token değişimi (Basic auth + code_verifier), yenileme, gönderi, 281 → 400, 401, duplicate → 409, revoke. Hepsi geçiyor.
- Playwright ile elle doğrulandı: X kartı görünüyor; sahte authorize → callback → token → "Bağlı @kullanıcı"; modalda "X’te paylaş" → `/api/x/post` → toast + `yayinlar.x` kaydı; sayfa hatası yok.

## Kalanlar (sonraki dalga için)
- Görsel ekli X gönderisi (media upload, `media.write` scope) — şu an yalnızca metin. Bilerek kapsam dışı bırakıldı.
- Mobil uygulama (capacitor://) içinde açılır pencere akışı çalışmaz; sistem tarayıcısı + deep link gerekir.
- Arayüzdeki "verileri sıfırla" benzeri bir işlev varsa `localStorage.glowX`'i de temizlemeli (x.js ayrı anahtar kullanıyor).
- Birleştirmede `index.html` çakışması olursa: X değişiklikleri yalnızca yukarıda listelenen satırlar; `x.js`/`x-callback.html`/`x-api.js` yeni dosyalar, çakışmaz.

## Kararlar
- X mantığı ayrı dosyalarda (sunucu `x-api.js`, arayüz `public/x.js`) — diğer ajanlarla `server.js`/`index.html` çakışmasını en aza indirmek için.
- Erişim/yenileme anahtarları sunucuda saklanmaz (mevcut Meta tasarımıyla aynı: tarayıcı localStorage); sunucu yalnızca vekil.
- Yönlendirme adresi ayrı sayfa (`x-callback.html`); mevcut Meta popup yakalayıcısına dokunulmadı.
- Varsayılan istemci türü: confidential (Web App) önerildi; secret boşsa public client olarak çalışır.
- `/api/health`'e alan eklenmedi (sunucu ajanının kapsamı); durum `/api/x/config` ile okunur.
- X belgeleri (docs.x.com) doğrulandı: authorize `https://x.com/i/oauth2/authorize`, token `https://api.x.com/2/oauth2/token`, revoke `/2/oauth2/revoke`, kod 30 sn geçerli, access token 2 saat, `offline.access` ile refresh token, S256 destekli; gönderi `POST https://api.x.com/2/tweets` `{text}` → `{data:{id,text}}`.

## Kullanıcının yapması gerekenler
1. **X Developer Portal** (developer.x.com) → proje + uygulama oluştur → *User authentication settings*: OAuth 2.0 açık, App permissions **Read and write**, Type **Web App, Automated App or Bot** (confidential).
2. **Callback URI**: `https://<site-adresin>/x-callback.html` (yerel deneme için `http://localhost:3000/x-callback.html`). Website URL alanına site adresini yaz.
3. Keys and tokens → **OAuth 2.0 Client ID ve Client Secret**'ı sunucunun `.env` dosyasına yaz: `X_CLIENT_ID=...`, `X_CLIENT_SECRET=...` → sunucuyu yeniden başlat.
4. Site sunucudan farklı bir adresteyse o adres `ALLOWED_ORIGINS` (veya `PUBLIC_URL`) içinde olmalı; değilse `X_REDIRECT_URIS`'e tam callback adresini yaz.
5. Gönderi paylaşmak X API'de **yazma hakkı olan ücretli/kredili erişim** gerektirebilir (paket koşulları X tarafından değişiyor; Developer Portal'da kontrol et). 403 hatası alınırsa ilk bakılacak yer burası.
