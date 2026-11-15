# Durum — sunucu

Son güncelleme: 15 Kasım 2026 (1. dalga, devam ediyor)

## Yapılanlar
- İstemci IP'si `clientIp(req)` ile tek yerden okunuyor; `X-Forwarded-For` yalnızca `TRUST_PROXY` (varsayılan 1) kadar sağdan okunur → başlık sahteleyerek hız sınırı aşılamaz. `::ffff:` öneki temizleniyor.
- Hız sınırı: sınırdayken dizi büyümüyor; eski IP kayıtları 5 dk'da bir temizleniyor (bellek sızıntısı). `RATE_LIMIT_PER_MIN` geçersizse 20'ye düşer.
- Test: `otomasyon/testler/sunucu-guvenlik.mjs`.

## Kalanlar
- Gövde sınırı (Content-Length ön kontrolü, 413 yanıtının gerçekten gitmesi), JSON Content-Type zorunluluğu (CSRF), nesne olmayan JSON.
- `AGENTS` prototip anahtarları (`constructor` vb.), bozuk URL kodlaması (400), `new URL` try dışında.
- Video durum ucu hız sınırı, güvenlik başlıkları, `/api/health` ayrıntıları, SIGTERM ile düzgün kapanma, `.env.example`.

## Kararlar
- `TRUST_PROXY` varsayılanı 1 (Render/Railway gibi tek vekil arkasında doğru IP). Doğrudan internete açık çalıştırılıyorsa 0 verilmeli.

## Kullanıcının yapması gerekenler
- (bitince doldurulacak)
