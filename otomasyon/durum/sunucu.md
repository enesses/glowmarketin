# Durum — sunucu

## 16 Kasım (2. gün)
Durum: çalışıyor (1. dalga, 07:30 başladı).

### Yapılanlar
- [1] Bilinmeyen `/api/*` (ve `/api`) her yöntemde JSON 404 `{error:'Bu API ucu bulunamadı.'}`; statik aramaya düşmüyor. `/api/x/*` 404'ü zaten x-api.js'te JSON.
- [3] `/api/health` → `x` (X_CLIENT_ID var mı) ve `metaAds` (META_APP_ID+SECRET var mı) bayrakları; yalnızca boolean. `/api/health` GET/HEAD dışı → 405.
- Statik dosyalar artık HEAD'e de yanıt veriyor; API dışı GET/HEAD olmayan istek → JSON 405.
- Test: `otomasyon/testler/sunucu-api.mjs`.

### Kalanlar
- [2] Video indirmesini akışla diske yazma.
- [4] Uç uç hata mesajı / gizli anahtar sızıntısı denetimi.

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
