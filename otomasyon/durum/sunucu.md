# Durum — sunucu

Son güncelleme: 15 Kasım 2026 (1. dalga, devam ediyor)

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
- Test: `otomasyon/testler/sunucu-guvenlik.mjs` (hız sınırı, 413, 415, prototip, URL, başlıklar, CORS, health). Sahte XFF IP'leri kullanır, 127.0.0.1 kovasını doldurmaz.

## Kalanlar
- Bilinmeyen `GET /api/*` hâlâ düz metin 404 döner (JSON değil). Diğer ajanların rota ekleyeceği satıra çok yakın olduğu için çakışma riskine karşı bırakıldı; birleştirmeden sonra eklenebilir.
- Video indirmesi 256 MB'a kadar belleğe alınıyor (akışla diske yazmaya çevrilebilir).

## Kararlar
- `TRUST_PROXY` varsayılanı 1 (Render/Railway gibi tek vekil arkasında doğru IP). Doğrudan internete açık çalıştırılıyorsa 0 verilmeli.

## Kullanıcının yapması gerekenler
- (bitince doldurulacak)
