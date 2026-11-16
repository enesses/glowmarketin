# Durum — sunucu

## 16 Kasım (2. gün)
Durum: **tamamlandı** (1. dalga, 07:30–07:40 İstanbul). 4 görevin hepsi bitti, tüm testler geçiyor.

### Yapılanlar
- [1] Bilinmeyen `/api/*` (ve `/api`) her yöntemde (GET/POST/PUT/DELETE/HEAD) JSON 404 `{error:'Bu API ucu bulunamadı.'}`; artık statik dosya aramasına düşüp düz metin 404 dönmüyor. `/api/x/*` bilinmeyenleri zaten x-api.js'te JSON 404.
- [1+] `/api/health` GET/HEAD dışı → 405. API dışı adreslerde GET/HEAD dışı yöntem → JSON 405. Statik dosyalar HEAD'e de yanıt veriyor (önceden yönlendirici HEAD'i statiğe göndermiyordu).
- [2] Video indirmesi belleğe alınmıyor: `Readable.fromWeb(r.body)` → bayt sayan Transform (256 MB aşılınca keser) → `<ad>.mp4.<pid>.<zaman>.tmp` → `rename`. Hata/kopmada `.tmp` silinir, yarım dosya "hazır" görünmez. `Content-Length` ön kontrolü ve eşzamanlı indirme tekilleştirmesi korundu. İndirme `fetch` ağ hatası artık 500 değil 502 (Türkçe mesaj).
- [3] `/api/health` → `x` (X_CLIENT_ID tanımlı mı) ve `metaAds` (META_APP_ID + META_APP_SECRET tanımlı mı, yani uzun ömürlü anahtar değişimi açık mı) bayrakları. Yalnızca boolean; değer yanıtlanmaz.
- [4] Uç denetimi: tüm `server.js` hata yanıtları Türkçe. DeepSeek 400/422 mesajları "DeepSeek …" diye netleştirildi. Yeni `redact()` yardımcısı: `.env`'deki gizli değerler (DEEPSEEK_API_KEY, FAL_KEY, OPENROUTER_API_KEY, META_APP_SECRET, X_CLIENT_SECRET) ve bilinen biçimler (`sk-…`, `EAA…` Meta anahtarı, `Bearer/Basic/Key …`, `access_token=`, `client_secret=` vb.) loglarda `***` olur. Uygulandığı loglar: DeepSeek hata, video sağlayıcı hata, Meta Ads exchange uyarısı, beklenmeyen hata, yakalanmamış söz.
- Testler: `otomasyon/testler/sunucu-api.mjs` (JSON 404, 405, HEAD, health bayrakları), `otomasyon/testler/sunucu-video-akis.mjs` (sahte fal.ai ile akış kaydı, küçük/kopuk video → 502 ve .tmp yok, anahtarı yansıtan sağlayıcı hatasında yanıt Türkçe ve log maskeli). Bu test kendi sunucusunu 3996/3997 portlarında, geçici UPLOADS_DIR ile açar.

### Denetim sonucu (x-api.js ve Meta Ads — işlev değiştirilmedi)
- `x-api.js`: gizli anahtar sızıntısı yok. `X_CLIENT_SECRET` yalnızca X'e giden Basic başlığında; loglar yalnızca `@kullanıcı` ve gönderi kimliği. `/api/x/config` `clientId` döndürüyor — bu gizli değil (PKCE için tarayıcıda gerekli). `access_token/refresh_token` yalnızca sahibine (tarayıcıya) dönüyor, sunucuda saklanmıyor. Hata mesajları Türkçe; yalnızca X'in kendi açıklaması (`detail`) İngilizce olarak mesaj sonuna ekleniyor — bilerek bırakıldı.
- Meta Ads (`/api/meta-ads/status`, `/api/meta-ads/exchange`): `META_APP_SECRET` yanıtta yok; yalnızca Meta'ya giden URL'de. fetch hatası URL'yi loglamıyor. Exchange uyarı logu artık maskeli. Hata mesajları Türkçe.
- Küçük tutarsızlık (x ajanına öneri, dokunmadım): x-api.js bilinmeyen uçta `'Bulunamadı.'`, server.js `'Bu API ucu bulunamadı.'` diyor.

### Kalanlar
- Yok (bugünkü 4 görev bitti).
- İleride: video için `VIDEO_MAX` testte 256 MB indirmek pahalı olduğundan sınır aşımı yalnızca kodla doğrulandı (Content-Length ön kontrolü + Transform).

### Kararlar
- Bilinmeyen-ama-var-olan yoldaki yanlış yöntem (ör. `DELETE /api/video`) görev tanımına uygun olarak JSON 404 döner; yalnızca `/api/health` için 405 eklendi (en çok yoklanan uç).
- `metaAds` bayrağı = "sunucu tarafı yapılandırıldı mı" (APP_ID + SECRET). Meta Ads kısa süreli anahtarla bu olmadan da çalışabildiği için `false` "kapalı" değil "uzatma kapalı" demek.
- `.tmp` adı pid + zaman içeriyor: çökmeden kalan eski `.tmp` ile çakışmaz; artıklar `cleanUploads` ile 14 günde silinir.
- x-api.js ve Meta Ads işlevlerine dokunulmadı; yalnızca server.js içindeki Meta Ads logu maskelendi (aynı ajanla çakışma riski: tek satır).

### Kullanıcının yapması gerekenler
- Yeni bir şey yok. 15 Kasım listesi geçerli: `.env`'de `TRUST_PROXY`, `ALLOWED_ORIGINS` (yıldız değil), `PUBLIC_URL` (https), `DEEPSEEK_API_KEY`, video için `FAL_KEY`/`OPENROUTER_API_KEY`.
- Dağıtımdan sonra `GET /api/health` ile `x` ve `metaAds` bayraklarına bakarak X_CLIENT_ID ve META_APP_ID/SECRET'ın gerçekten yüklendiğini doğrula.

---
# 15 Kasım (1. gün) kaydı

Son güncelleme: 15 Kasım 2026 (1. dalga tamamlandı)

## Yapılanlar
- İstemci IP'si `clientIp(req)` ile tek yerden okunuyor; `X-Forwarded-For` yalnızca `TRUST_PROXY` (varsayılan 1) kadar sağdan okunur → başlık sahteleyerek hız sınırı aşılamaz. `::ffff:` öneki temizleniyor.
- Hız sınırı: sınırdayken dizi büyümüyor; eski IP kayıtları 5 dk'da bir temizleniyor (bellek sızıntısı). `RATE_LIMIT_PER_MIN` geçersizse 20'ye düşer.
- Gövde okuma: `Content-Length` ön kontrolü; sınır aşılınca soket kesilmeden 413 yanıtı gidiyor (`Connection: close`).
- CSRF: JSON uçlarında `text/plain`, form ve multipart gövdeleri 415 ile reddediliyor (bu türler tarayıcı ön kontrolü olmadan başka siteden gönderilebiliyordu → API kredisi harcatma riski). Nesne olmayan JSON (`null`, dizi) 400.
- `AGENTS` araması `Object.hasOwn` ile (`constructor`, `toString` vb. artık 400).
- Bozuk URL kodlaması (`%E0%A4%A`) ve `%00` artık 500 değil 400; `new URL` try içinde.
- Statik dosyalar: `X-Frame-Options: DENY` (HTML), `Referrer-Policy`, HTML için `Cache-Control: no-cache`, HEAD desteği.
- CORS izinli başlıklara `Authorization` eklendi (X/Meta uçları için gerekebilir).
- Video durum ucu (`GET /api/video/:id`) ayrı kova ile dakikada 60 istekle sınırlı.
- DeepSeek: zaman aşımı gövde okunurken de geçerli; bozuk JSON yanıtı 502.
- Video: fal ikinci istek ağ hatası → RUNNING/yeniden dene; aynı görev için eşzamanlı indirme tekilleştirildi; dosya `.tmp` → rename ile atomik yazılıyor.
- `cleanUploads` klasör okunamazsa çökmüyor. `unhandledRejection` loglanıyor. SIGTERM/SIGINT ile düzgün kapanma. Port kullanımdaysa anlaşılır hata.
- `server.headersTimeout=20s`, `requestTimeout=120s` (yavaş istemci saldırısı).
- `/api/health`: `surum` (package.json) ve `calisma` (saniye) eklendi.
- `.env.example`: `TRUST_PROXY=1` açıklamasıyla eklendi.
- MP4 akışında dosya okuma hatası artık süreci çökertmiyor; JSON yanıtlarına `nosniff`. Açılışta `PUBLIC_URL` https değilse ve `ALLOWED_ORIGINS=*` ise uyarı.
- Elle doğrulandı: MP4 Range 206/416, JPEG yükleme 200, 8 MB üstü (Content-Length ve chunked) 413, SIGTERM ile çıkış kodu 0.
- Test: `otomasyon/testler/sunucu-guvenlik.mjs` (hız sınırı, 413, 415, prototip, URL, başlıklar, CORS, health). Sahte XFF IP'leri kullanır, 127.0.0.1 kovasını doldurmaz.

## Kalanlar
- Bilinmeyen `GET /api/*` hâlâ düz metin 404 döner (JSON değil). Diğer ajanların rota ekleyeceği satıra çok yakın olduğu için çakışma riskine karşı bırakıldı; birleştirmeden sonra eklenebilir.
- Video indirmesi 256 MB'a kadar belleğe alınıyor (akışla diske yazmaya çevrilebilir).

## Kararlar
- `TRUST_PROXY` varsayılanı 1 (Render/Railway gibi tek vekil arkasında doğru IP). Doğrudan internete açık çalıştırılıyorsa 0 verilmeli.
- CSRF için `application/json` zorunlu kılmak yerine yalnızca tarayıcının ön kontrolsüz gönderebildiği 3 türü reddettim; X/Meta ajanlarının uçları/testleri farklı başlıkla çağırırsa kırılmasın diye.
- `/api/health` satırına yalnızca `surum` ve `calisma` ekledim; `x`/`metaAds` bayraklarını o ajanlar ekler (birleştirmede aynı satırda küçük çakışma çıkabilir — iki tarafın alanlarını birlikte tutun).
- CSP eklenmedi: `index.html` satır içi betik/stil kullanıyor; yanlış CSP uygulamayı kırar.
- Diğer ajanların rota ekleyeceği bölgeye (`serveStatic` geri dönüşünden önceki satır) dokunmadım.
- Yeni rota yazan ajanlar için: IP için `clientIp(req)`, sınır için `limited(ip)` ya da ayrı kova `limited('x:' + ip, N)`, gövde için `readBody(req)` kullanın.

## Kullanıcının yapması gerekenler
- `.env`: `TRUST_PROXY` — Render/Railway/Nginx arkasında `1` (varsayılan), sunucu doğrudan internete açıksa `0`.
- `.env`: `ALLOWED_ORIGINS` içine yalnızca kendi alan adlarını yaz; `*` kullanma.
- `.env`: `PUBLIC_URL` mutlaka `https://` ile başlamalı (Instagram görselleri/videolar için).
- `.env`: `DEEPSEEK_API_KEY`, video için `FAL_KEY` ya da `OPENROUTER_API_KEY` (değişmedi).
- Meta/X geliştirici ayarları bu ajanın kapsamında değil (bkz. `x.md`, `meta-ads.md`).
