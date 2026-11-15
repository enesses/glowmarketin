# Durum — arayuz

1. dalga (15 Kasım 2026, 15:00 İstanbul) sürüyor.

## Yapılanlar
- localStorage sağlamlığı: `sanitize()` eklendi; bozuk/eski veri (yanlış tür diziler, metin kredi, geçersiz paket, sayısal işletme adı, SSS metin vb.) artık uygulamayı çökertmiyor. Test: `otomasyon/testler/arayuz-depolama.mjs`.

- Mobil (360 px) yatay taşma giderildi: tek sütun düzenlerde `1fr` → `minmax(0,1fr)` (İşletme formu, Yorumlar).
- Türkçe ek hatası: paket düğmeleri "Go’e/Plus’e geç" → "Go’ya/Plus’a/Max’e geç". Mobilde yanlış yönlendiren "Soldan …" ifadeleri düzeltildi.
- Erişilebilirlik: pencerelerde odak tuzağı (Tab döngüsü), kapanınca odağı açan düğmeye geri verme; onay penceresinde Escape = Vazgeç (önceden alttaki pencereyi kapatıyordu); onayda odak Vazgeç/onay kutusuna gider; bildirim (toast) `role=status aria-live`; seçim düğmelerinde `aria-pressed`.

## Kalanlar
