# Durum — meta-ads

## Yapılanlar
- [x] Sunucu: `GET /api/meta-ads/status`, `POST /api/meta-ads/exchange` (kısa süreli → ~60 günlük anahtar; `META_APP_ID`/`META_APP_SECRET` yoksa 503). Test: `otomasyon/testler/meta-ads-sunucu.mjs`.
- [x] `.env.example`: `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_VERSION`.

## Kalanlar
- [ ] Arayüz: Bağlantılar'da "Meta Reklamları" kartı (bağlan / hesap seç / kes), insights (7/30 gün), kampanya listesi.
- [ ] Yayınlanmış FB/IG gönderisini PAUSED taslak kampanya olarak öne çıkarma.

## Kararlar
- Graph sürümü: uygulamadaki mevcut `v25.0` korunuyor (v26 Tem 2026, v27 4 Kas 2026 çıktı; v25 hâlâ destekli). Sunucuda `META_GRAPH_VERSION` ile değiştirilebilir.
