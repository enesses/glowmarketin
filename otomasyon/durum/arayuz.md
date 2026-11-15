# Durum — arayuz

1. dalga (15 Kasım 2026, 15:00 İstanbul) sürüyor.

## Yapılanlar
- localStorage sağlamlığı: `sanitize()` eklendi; bozuk/eski veri (yanlış tür diziler, metin kredi, geçersiz paket, sayısal işletme adı, SSS metin vb.) artık uygulamayı çökertmiyor. Test: `otomasyon/testler/arayuz-depolama.mjs`.

- Mobil (360 px) yatay taşma giderildi: tek sütun düzenlerde `1fr` → `minmax(0,1fr)` (İşletme formu, Yorumlar).
- Türkçe ek hatası: paket düğmeleri "Go’e/Plus’e geç" → "Go’ya/Plus’a/Max’e geç". Mobilde yanlış yönlendiren "Soldan …" ifadeleri düzeltildi.
- Erişilebilirlik: pencerelerde odak tuzağı (Tab döngüsü), kapanınca odağı açan düğmeye geri verme; onay penceresinde Escape = Vazgeç (önceden alttaki pencereyi kapatıyordu); onayda odak Vazgeç/onay kutusuna gider; bildirim (toast) `role=status aria-live`; seçim düğmelerinde `aria-pressed`.
- Kredi güvenliği: `runAgent` önce sonucu uygular, sonra krediyi düşer; yapay zekâdan boş/bozuk yanıt gelirse kredi gitmez ("Kredi düşülmedi" mesajı artık doğru).
- localStorage yazılamazsa (kota/gizli sekme) kullanıcı bir kez uyarılır; çoklu sekme: `storage` olayıyla diğer sekmedeki değişiklik alınır (eski sekme yeni veriyi ezmez).
- Hata bildirimleri metin uzunluğuna göre daha uzun ekranda kalır (en az 4 sn).
- SSS satırlarındaki alanlara erişilebilir ad (aria-label) eklendi; Paket sayfasındaki kredi açıklaması gerçek maliyetlerle düzeltildi (haftalık plan 3, video 20–50).
- 320 px genişlikte Bağlantılar ve AI video sayfalarındaki taşma giderildi; 1280/360/320 px ve tüm pencereler Playwright ile tarandı, taşma kalmadı.
- Formlar Enter ile gönderilebiliyor (kaydet düğmeleri `type=submit`, çift tetikleme yok). `prefers-reduced-motion` desteği. Soluk metin rengi (`--ink-3`) WCAG AA kontrastına çekildi (açık #776C63, koyu #978C82).

## Kalanlar
