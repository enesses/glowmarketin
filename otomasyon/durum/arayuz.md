# Durum — arayuz

1. dalga tamamlandı (15 Kasım 2026, 15:00–15:15 İstanbul). Dal: `ajan/arayuz`. Tüm commit'lerde `node otomasyon/smoke-test.mjs` geçti.
Doğrulama: Playwright ile 1280 / 360 / 320 px, açık ve koyu tema; tüm sayfalar, pencereler, bozuk localStorage, iki sekme, gece yarısı geçişi, sahte AI sunucusu senaryoları hatasız.

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
- Gece yarısını geçen açık sayfada "bugün" vurgusu ve gün seçenekleri dakikada bir / sekmeye dönünce yenilenir. Aynı anda ikinci onay penceresi açılması engellendi (ilk onayın sözü askıda kalıyordu).
- AI video tanıtım metni sektöre göre (Restoranın / Salonun / Mağazan / İşletmen; "tabağının" yalnızca restoranda). Koyu tema ekran görüntüleriyle kontrol edildi.
- "Daha" menüsünden Çerez tercihleri açılınca menü kapanır, odak çerez penceresine gider (odak tuzağıyla çakışma önlendi). AI yolları (taslak, haftalık plan, müşteri yanıtı, bozuk yanıt) sahte sunucuyla denendi: boş yanıtta kredi düşmüyor.

## Kalanlar
- (İsteğe bağlı) İşletme bilgileri formunda kaydedilmemiş değişiklik varken sayfadan çıkınca uyarı.
- (İsteğe bağlı) `go()` içindeki `scrollTo({behavior:'smooth'})` azaltılmış hareket tercihinde de yumuşak kayıyor; JS tarafında da `matchMedia` kontrolü eklenebilir.
- (İsteğe bağlı) Haftalık plan / taslak için `spend()` `toplamTaslak` sayacını kredi tutarından bağımsız 1 artırıyor; "Üretilen taslak" etiketi buna göre adlandırılabilir.
- Birleştirme notu: X ve Meta Ads ajanları da `public/index.html` dosyasına dokunuyor. Bu dalın değiştirdiği bölgeler: depolama (`sanitize`, `save`), Modal bölümü (`openModal`/`closeModal`/klavye), `confirmAsk`, `runAgent`, `toast`, gün sabitleri (`TODAY`), sonda `storage` dinleyicisi, birkaç CSS satırı (mobil `minmax(0,1fr)`, `--ink-3`). Çakışma olursa iki tarafı da korumak yeterli; mantıkça çakışan değişiklik yok.

## Kararlar
- Bozuk veri silinmez, onarılır: yanlış türdeki alan varsayılana döner, işletme adı boşsa kurulum ekranı açılır.
- Kredi yalnızca sonuç başarıyla ekrana uygulandıktan sonra düşer (önce `apply`, sonra `spend`).
- Çoklu sekmede son yazan kazanır; diğer sekme `storage` olayıyla güncellenir, açık pencere varken yalnızca üst bilgi yenilenir (kullanıcının yazdığı silinmesin).
- `.post` kartına `role=button` eklenmedi (içinde Sil düğmesi var; iç içe etkileşimli öğe erişilebilirlik hatası olurdu).
- Kontrast için `--ink-3` koyulaştırıldı; tasarım dili korunarak AA seviyesine çekildi.
- Ek test: `otomasyon/testler/arayuz-depolama.mjs` (bağımlılıksız; index.html'den `sanitize`'ı çıkarıp bozuk girdilerle dener).

## Kullanıcının yapması gerekenler
- Yasal metinlerdeki yer tutucuları doldur: `[ŞİRKET UNVANI]`, `[ŞİRKET ADRESİ]`, `[MERSİS NO]`, `[VERGİ DAİRESİ / NO]`, `[KVKK E-POSTASI]`, `[KEP ADRESİ]` vb. (`public/index.html`, ~46 yer).
- `public/index.html` içindeki `CONFIG` (ya da `window.GLOW_CONFIG`): `googleClientId` ve `metaAppId` yayında buraya yazılırsa müşteriler bu alanları görmez.
- Sunucu `.env`: `DEEPSEEK_API_KEY` (yapay zekâ), video için `FAL_KEY` veya `OPENROUTER_API_KEY` + internetten erişilebilir `PUBLIC_URL` (görsel/video yükleme için de gerekli).
- Google Cloud: Business Profile API erişim başvurusu, üç API'nin etkinleştirilmesi, "Yetkili JavaScript kaynakları"na site adresi.
- Meta for Developers: İşletme türü uygulama, OAuth yönlendirme URI'si (site adresi), App Review'da izinler, işletme doğrulaması. X ve Meta Ads ayarları kendi ajanlarının durum dosyalarında.
